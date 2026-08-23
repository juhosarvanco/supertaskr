import type { DerivedArchitecture } from "./derive";
import { claimsPath } from "./glob";

/**
 * Churn attribution (T-013): git's per-path answer joined onto the
 * declared components, as a pure function — the T-011 derivation
 * pattern, DOM-free and IO-free. The shelling-out lives Rust-side
 * (ADR-013 / map plan §0.0-6, app/src-tauri/src/churn.rs); everything
 * from the payload onward is TypeScript, which is ADR-015.
 *
 * THE JOIN IS TWO-STEP, AND THE ORDER IS THE MODELLING DECISION. A
 * churned path that the INDEXER already walked is attributed by
 * `fileComponent` — the derivation's own §4.1 answer, so churn can never
 * disagree with the file list the same panel shows, and the synthetic
 * `unmapped` bucket and the inferred pseudo-components get their churn
 * for free. Every OTHER path falls back to `claimsPath` over the
 * declared globs, because `fileComponent` maps only what the indexer
 * walked — TypeScript and JavaScript, never Rust, never markdown
 * (CONVENTIONS, THE FOUR WALKS) — and a map that reported a Rust crate
 * as permanently cold would be lying about the busiest component in this
 * repository. The fallback keeps §4.1's first-match-by-id-order rule.
 *
 * WHAT THE NUMBER IS, SAID EXACTLY. Rust aggregates per PATH (path →
 * commits that touched it), so a per-component DISTINCT-commit count is
 * not derivable here without shipping every commit's whole path list
 * over IPC. The per-component figure is therefore the sum of its paths'
 * commit counts — FILE EDITS, not commits — and every surface that
 * renders it says "edits". The pane-level commit count in the legend IS
 * exact: Rust counts the commits it walked. The design's map-behavior
 * screen says "commits in 30 days"; this is the recorded divergence, and
 * it is a divergence in the WORD, not in what the bar ranks by.
 */

/** One path's churn, already validated at the boundary. */
export interface ChurnPathEntry {
  path: string;
  commits: number;
  lastCommitMs: number;
}

export interface ComponentChurn {
  /** Σ over the component's churned paths of their commit counts. */
  edits: number;
  /** How many distinct paths under this component moved at all. */
  files: number;
  /** Newest commit touching any of them; 0 when unknown. */
  lastCommitMs: number;
}

export interface ChurnAttribution {
  byComponent: ReadonlyMap<string, ComponentChurn>;
  /** The busiest component's `edits` — the bar's denominator. */
  busiest: number;
  /**
   * The SINGLE hottest component, or undefined. A tie leaves it
   * undefined on purpose: the design asks for "the single hottest
   * component … so the peak is findable", and marking two of them
   * darker would be a picture of a peak that is not there.
   */
  hottest?: string;
  /** Edits landing on no component — reported, never folded in. */
  unattributed: number;
}

const EMPTY: ChurnAttribution = {
  byComponent: new Map(),
  busiest: 0,
  unattributed: 0,
};

/**
 * Which component claims a churned path — the indexed answer first, the
 * declared globs second (see the header). Nothing else can claim one: a
 * placeholder has no globs at all, and a NON-indexed path that no glob
 * matches stays unattributed rather than falling into the `unmapped`
 * bucket. That last refusal is deliberate — the bucket means "indexed
 * files no component claims", and widening it here would make it the
 * busiest node on any repository with a docs tree, which is a picture
 * of the docs tree rather than of the code.
 */
function claimant(derived: DerivedArchitecture, path: string): string | undefined {
  const indexed = derived.fileComponent.get(path);
  if (indexed !== undefined) return indexed;
  for (const component of derived.components) {
    if (component.kind !== "declared") continue;
    const patterns = component.record?.paths;
    if (patterns === undefined || patterns.length === 0) continue;
    if (claimsPath(patterns, path)) return component.id;
  }
  return undefined;
}

/**
 * Attribute churn onto components. `derived.components` is already in
 * the derivation's own id order — that is what makes "first match wins"
 * deterministic — and this function does not re-sort, for the same
 * reason `deriveDeclared` does not.
 */
export function attributeChurn(
  derived: DerivedArchitecture,
  entries: readonly ChurnPathEntry[],
): ChurnAttribution {
  if (entries.length === 0) return EMPTY;

  const byComponent = new Map<string, ComponentChurn>();
  // Path → owner, memoized: a repo can churn the same path in many
  // commits, and glob matching is the expensive half.
  const owners = new Map<string, string | undefined>();
  let unattributed = 0;

  for (const entry of entries) {
    let owner = owners.get(entry.path);
    if (!owners.has(entry.path)) {
      owner = claimant(derived, entry.path);
      owners.set(entry.path, owner);
    }
    if (owner === undefined) {
      unattributed += entry.commits;
      continue;
    }
    const slot = byComponent.get(owner);
    if (slot === undefined) {
      byComponent.set(owner, {
        edits: entry.commits,
        files: 1,
        lastCommitMs: entry.lastCommitMs,
      });
    } else {
      slot.edits += entry.commits;
      slot.files += 1;
      slot.lastCommitMs = Math.max(slot.lastCommitMs, entry.lastCommitMs);
    }
  }

  let busiest = 0;
  let hottest: string | undefined;
  let tied = false;
  for (const [id, churn] of byComponent) {
    if (churn.edits > busiest) {
      busiest = churn.edits;
      hottest = id;
      tied = false;
    } else if (churn.edits === busiest && busiest > 0) {
      tied = true;
    }
  }

  const attribution: ChurnAttribution = { byComponent, busiest, unattributed };
  if (hottest !== undefined && !tied) attribution.hottest = hottest;
  return attribution;
}

/**
 * The bar's width as a percentage of the node, 0–100. Zero edits is a
 * zero-width bar and a component with no churn record renders no bar at
 * all — the caller decides which; this is arithmetic only.
 *
 * A component that HAS churn always gets a visible sliver (the floor),
 * because a 0.3%-wide bar and no bar look identical and mean opposite
 * things.
 */
export const CHURN_BAR_MIN_PERCENT = 4;

export function churnBarPercent(edits: number, busiest: number): number {
  if (busiest <= 0 || edits <= 0) return 0;
  const raw = (edits / busiest) * 100;
  return Math.min(100, Math.max(CHURN_BAR_MIN_PERCENT, Math.round(raw * 10) / 10));
}
