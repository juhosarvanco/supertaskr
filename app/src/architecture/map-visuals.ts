import type {
  DerivedComponent,
  DerivedProvenance,
  DerivedStatus,
  DriftFinding,
} from "@/lib/architecture/derive";
import { isDriftFinding, UNMAPPED_ID } from "@/lib/architecture/derive";
import { churnBarPercent, type ChurnAttribution } from "@/lib/architecture/churn";

/**
 * State → ink for the map pane (T-012): every visual decision as a pure
 * table, so the sixteen designed node states (and their compositions)
 * are unit-testable without a DOM. Two rules carry everything (design
 * bundle): STATUS IS A FILL, DRIFT IS A STROKE — and nothing here moves
 * a node (layout never reads any of this).
 *
 * Class strings resolve exclusively to tokens.css-backed utilities
 * (T-001/T-006 enforcement: unmapped utilities are dead); the compound
 * geometry treatments (drift ring, selected border) are the named
 * @utility mechanisms in index.css.
 */

/** Overlay modes. T-013 adds `churn`, the only one backed by data the
 * repository's FILES do not contain (it comes from git history — see
 * churn-source.ts), which is why it is also the only one that can be
 * DISABLED. */
export type MapOverlay = "status" | "provenance" | "drift" | "churn";
export const MAP_OVERLAYS: readonly MapOverlay[] = [
  "status",
  "provenance",
  "drift",
  "churn",
];

/** Status fill families (bg + border), the cards' exact tokens. */
const NODE_FILL: Record<DerivedStatus, string> = {
  planned: "bg-status-planned border-status-planned-border",
  building: "bg-status-building border-status-building-border",
  verifying: "bg-status-verifying border-status-verifying-border",
  rejected: "bg-status-rejected border-status-rejected-border",
  done: "bg-status-done border-status-done-border",
  merging: "bg-status-merging border-status-merging-border",
};

/** Hover border: one step darker (the measured -border-strong family). */
const NODE_HOVER_BORDER: Record<DerivedStatus, string> = {
  planned: "border-status-planned-border-strong",
  building: "border-status-building-border-strong",
  verifying: "border-status-verifying-border-strong",
  rejected: "border-status-rejected-border-strong",
  done: "border-status-done-border-strong",
  merging: "border-status-merging-border-strong",
};

const ID_INK: Record<DerivedStatus, string> = {
  planned: "text-status-planned-foreground",
  building: "text-status-building-foreground",
  verifying: "text-status-verifying-foreground",
  rejected: "text-status-rejected-foreground",
  done: "text-status-done-foreground",
  merging: "text-status-merging-foreground",
};

const TITLE_INK: Record<DerivedStatus, string> = {
  planned: "text-status-planned-title",
  building: "text-status-building-title",
  verifying: "text-status-verifying-title",
  rejected: "text-status-rejected-title",
  done: "text-status-done-title",
  merging: "text-status-merging-title",
};

const META_INK: Record<DerivedStatus, string> = {
  planned: "text-status-planned-meta",
  building: "text-status-building-meta",
  verifying: "text-status-verifying-meta",
  rejected: "text-status-rejected-meta",
  done: "text-status-done-meta",
  merging: "text-status-merging-meta",
};

/** Status chip classes (panel header + task rows) — the board's family. */
export const STATUS_CHIP: Record<DerivedStatus, string> = {
  planned: "bg-status-planned border-status-planned-border text-status-planned-foreground",
  building: "bg-status-building border-status-building-border text-status-building-foreground",
  verifying: "bg-status-verifying border-status-verifying-border text-status-verifying-foreground",
  rejected: "bg-status-rejected border-status-rejected-border text-status-rejected-foreground",
  done: "bg-status-done border-status-done-border text-status-done-foreground",
  merging: "bg-status-merging border-status-merging-border text-status-merging-foreground",
};

/** Pulse dot per pulsing status (chart ramp — the board's measured pair). */
const DOT: Partial<Record<DerivedStatus, string>> = {
  verifying: "bg-chart-4",
  merging: "bg-chart-2",
};

export interface NodeUiState {
  hovered: boolean;
  selected: boolean;
  focused: boolean;
  /** Someone else's neighborhood is lit and this node is not in it. */
  dimmed: boolean;
  overlay: MapOverlay;
}

export interface NodeVisual {
  /** Node box classes (fill, border, ring, shadows, dim, wipe home). */
  container: string;
  idInk: string;
  titleInk: string;
  metaInk: string;
  /** The pulsing 5px dot (verifying/merging) — the pane's only ambient
   * motion, and only on the dot (`motion-safe:` gates it in CSS). */
  dot?: string;
  /** Status word beside the dot (pulsing statuses carry it up top). */
  dotWord?: string;
  /** Status word appended to the meta line (building/rejected). */
  metaStatusWord?: string;
  /** Drift ring on (never on the unmapped bucket — it IS the finding). */
  ring: boolean;
  /** How the drift slot renders: "drift N" chip, bare numeral (drift
   * overlay), or nothing. */
  driftDisplay: "chip" | "numeral" | "none";
  /** Provenance mark size (provenance overlay grows 12 → 14). */
  markSize: 12 | 14;
  /** Provenance overlay: hairline dashed ring = no verified task yet. */
  unverifiedRing: boolean;
}

const join = (...parts: (string | false | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

/**
 * The sixteen-state table. `component` is the derived node; `ui` the
 * pane's ephemeral state. Total: any DerivedComponent renders.
 */
export function nodeVisual(component: DerivedComponent, ui: NodeUiState): NodeVisual {
  const { status, kind } = component;
  const ghost = kind === "inferred" || kind === "unmapped";
  // Declared-only reads "exists on paper" — unless the architect PINNED
  // a status: the explicit word beats the derived paper-only treatment
  // (plan §8 names the hero "C-01 pinned+done, C-07 declared-only" as
  // distinct states; C-01 is both flags at once and renders its pin —
  // the D3 ring still carries the no-files tension honestly).
  const declaredOnly = (component.declaredOnly && !component.pinned) || kind === "placeholder";

  // --- fill + border family -------------------------------------------
  let fill: string;
  let idInk: string;
  let titleInk: string;
  let metaInk: string;
  if (kind === "unmapped") {
    // The provisional bucket; in the drift overlay it promotes — it is
    // not a container there, it is the finding.
    const promoted = ui.overlay === "drift";
    fill = join(
      "bg-map-unmapped border-dashed",
      promoted ? "border-warning" : "border-map-edge-planned",
    );
    idInk = promoted ? "text-warning" : "text-map-unmapped-foreground";
    titleInk = "text-map-unmapped-foreground";
    metaInk = "text-status-planned-meta";
  } else if (kind === "inferred") {
    fill = "bg-map-unmapped border-dashed border-map-edge-planned";
    idInk = "text-map-declared-only-foreground";
    titleInk = "text-map-declared-only-title";
    metaInk = "text-map-declared-only-foreground";
  } else if (declaredOnly) {
    // Exists on paper: outline only (placeholders — D5 targets drawn so
    // the edge stays visible — share the treatment).
    fill = "bg-transparent border-dashed border-map-declared-only-border";
    idInk = "text-map-declared-only-foreground";
    titleInk = "text-map-declared-only-title";
    metaInk = "text-map-declared-only-foreground";
  } else {
    fill = NODE_FILL[status];
    idInk = ID_INK[status];
    titleInk = TITLE_INK[status];
    metaInk = META_INK[status];
  }

  // --- interaction chrome ---------------------------------------------
  // Selected wins the border (ink/bone, 1.5px, padding compensated —
  // the box never changes); hover darkens one step; focus adds the
  // ring composite. Dimming is opacity on the node, never a color swap.
  // Exactly ONE shadow class is emitted (they all set box-shadow, so
  // stacking them would leave the winner to stylesheet order): selected
  // > focused > hovered > the rest shadow, which the mock gives only to
  // filled non-planned nodes.
  const hoverBorder =
    ui.hovered && !ui.selected && !ghost && !declaredOnly
      ? NODE_HOVER_BORDER[status]
      : undefined;
  const shadow = ui.selected
    ? "shadow-map-selected"
    : ui.focused
      ? "shadow-map-focus"
      : ui.hovered && !ghost && !declaredOnly
        ? "shadow-map-hover-strong"
        : !ghost && !declaredOnly && status !== "planned"
          ? "shadow-map-node"
          : undefined;
  const container = join(
    "map-node",
    fill,
    hoverBorder,
    ui.selected && "map-node-selected",
    shadow,
    ui.dimmed && "opacity-32",
    // Drift overlay: the only overlay that dims — clean nodes fall back.
    ui.overlay === "drift" && !component.hasDrift && kind !== "unmapped" && "opacity-40",
  );

  // --- status word + pulse --------------------------------------------
  // Pulsing statuses carry the word beside the 5px dot in the top-right
  // slot (hero C-04); building/rejected append it to the meta line
  // (hero C-05); done and planned show no word (hero C-03/C-06 — the
  // "live status word" is the in-flight four).
  const dot = ghost || declaredOnly ? undefined : DOT[status];
  const dotWord = dot !== undefined ? status : undefined;
  const metaStatusWord =
    !ghost && !declaredOnly && (status === "building" || status === "rejected")
      ? status
      : undefined;

  // --- drift ----------------------------------------------------------
  // THE RING STAYS IN EVERY OVERLAY, INCLUDING CHURN, and that is a
  // deliberate departure from the bundle's churn screen (which draws no
  // rings at all): T-012's ratified amendment (b) makes drift core
  // rendering, never overlay-gated, and a drifting component that looks
  // clean because you are reading churn is the one thing this pane must
  // not do. What DOES yield is the SLOT — the card's "raw count at the
  // mark slot" is that slot, so the drift chip steps aside for the churn
  // figure exactly as the mock draws it.
  const ring = component.hasDrift && kind === "declared";
  const driftDisplay = !component.hasDrift || ui.overlay === "churn"
    ? ("none" as const)
    : ui.overlay === "drift"
      ? ("numeral" as const)
      : ("chip" as const);

  // --- provenance -----------------------------------------------------
  const markSize = ui.overlay === "provenance" ? (14 as const) : (12 as const);
  const unverifiedRing =
    ui.overlay === "provenance" &&
    kind === "declared" &&
    !hasVisibleMark(component.provenance);

  const visual: NodeVisual = {
    container,
    idInk,
    titleInk,
    metaInk,
    ring,
    driftDisplay,
    markSize,
    unverifiedRing,
  };
  if (dot !== undefined) visual.dot = dot;
  if (dotWord !== undefined) visual.dotWord = dotWord;
  if (metaStatusWord !== undefined) visual.metaStatusWord = metaStatusWord;
  return visual;
}

/** ADR-016: two marks — checked (independent OR same-model) and self.
 * `unreviewed` (done with no stamp) renders as the no-mark state. */
export function hasVisibleMark(provenance: DerivedProvenance | undefined): boolean {
  return (
    provenance === "independent" ||
    provenance === "same-model" ||
    provenance === "self-verified"
  );
}

/** The three-way distinction lives in TEXT (ADR-016) — hover labels. */
export function provenanceLabel(provenance: DerivedProvenance): string {
  switch (provenance) {
    case "independent":
      return "checked — independent, different model";
    case "same-model":
      return "checked — same model, fresh session";
    case "self-verified":
      return "self-verified — builder signed off on itself";
    case "unreviewed":
      return "unverified — no review stamp yet";
  }
}

/** Provenance-overlay hover line: "N of M tasks independently checked". */
export function independentLine(component: DerivedComponent): string | undefined {
  const done = component.tasks.filter((t) => t.status === "done");
  if (done.length === 0) return undefined;
  const independent = done.filter((t) => t.review === "independent").length;
  return `${independent} of ${done.length} tasks independently checked`;
}

// ---------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------

export type EdgeRelationVisual = "confirmed" | "planned" | "undeclared" | "observed";

export interface EdgeUiState {
  /** This edge touches the hovered/focused node. */
  lifted: boolean;
  /** Some node is hovered/focused and this edge is not the lifted set. */
  backgrounded: boolean;
  overlay: MapOverlay;
}

export interface EdgeVisual {
  /** CSS var reference for the stroke. */
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
  linecap?: "round";
  /** Which marker definition the edge ends with. */
  marker: "confirmed" | "planned" | "drift" | "hover" | "muted";
  /** Observed count printed at the label anchor (lifted edges only). */
  showCount: boolean;
}

/** Weight scales gently with observed imports: 1.5 → 2.5px, capped. */
export function edgeWeight(observedCount: number): number {
  if (observedCount <= 1) return 1.5;
  return Math.min(1.5 + (observedCount - 1) * 0.125, 2.5);
}

export function edgeVisual(
  relation: EdgeRelationVisual,
  observedCount: number,
  ui: EdgeUiState,
): EdgeVisual {
  const planned = relation === "planned";
  const drift = relation === "undeclared";

  // Backgrounded (another node's neighborhood is lit) or the provenance
  // overlay (edges recede so the marks read): muted, base geometry.
  if (ui.backgrounded || (ui.overlay === "provenance" && !ui.lifted)) {
    return {
      stroke: "var(--map-edge-muted)",
      strokeWidth: planned ? 1.25 : edgeWeight(observedCount),
      ...(planned ? { dashArray: "1 4", linecap: "round" as const } : {}),
      ...(drift ? { dashArray: "5 4" } : {}),
      marker: "muted",
      showCount: false,
    };
  }

  if (ui.lifted) {
    // Hover/focus lift: ink at 2.25 with the count; drift lifts in
    // warning instead (the relation stays readable while lit); planned
    // lifts one step darker at its own weight (it has nothing to count).
    if (drift) {
      return {
        stroke: "var(--warning)",
        strokeWidth: 2.25,
        dashArray: "5 4",
        marker: "drift",
        showCount: true,
      };
    }
    if (planned) {
      return {
        stroke: "var(--map-edge)",
        strokeWidth: 1.25,
        dashArray: "1 4",
        linecap: "round",
        marker: "planned",
        showCount: false,
      };
    }
    return { stroke: "var(--map-edge-hover)", strokeWidth: 2.25, marker: "hover", showCount: true };
  }

  // Drift overlay: findings keep strength (drift edges thicken to 1.75);
  // clean edges recede to muted.
  if (ui.overlay === "drift") {
    if (drift) {
      return {
        stroke: "var(--warning)",
        strokeWidth: 1.75,
        dashArray: "5 4",
        marker: "drift",
        showCount: false,
      };
    }
    return {
      stroke: "var(--map-edge-muted)",
      strokeWidth: planned ? 1.25 : edgeWeight(observedCount),
      ...(planned ? { dashArray: "1 4", linecap: "round" as const } : {}),
      marker: "muted",
      showCount: false,
    };
  }

  if (drift) {
    return {
      stroke: "var(--warning)",
      strokeWidth: edgeWeight(observedCount),
      dashArray: "5 4",
      marker: "drift",
      showCount: false,
    };
  }
  if (planned) {
    return {
      stroke: "var(--map-edge-planned)",
      strokeWidth: 1.25,
      dashArray: "1 4",
      linecap: "round",
      marker: "planned",
      showCount: false,
    };
  }
  // confirmed — and `observed` (inferred degraded mode: reality-only is
  // not drift, so it takes the confirmed stroke).
  return {
    stroke: "var(--map-edge)",
    strokeWidth: edgeWeight(observedCount),
    marker: "confirmed",
    showCount: false,
  };
}

// ---------------------------------------------------------------------
// Drift findings: attribution + panel text
// ---------------------------------------------------------------------

/**
 * Re-exported from the ENGINE, never redefined here (T-033). The ring
 * set, the pane footer and `derive.ts`'s own `hasDrift` flag are three
 * callers of ONE predicate — T-057's rule, and the thing this lane's
 * drill caught when there were briefly two copies.
 */
export { isDriftFinding };

/** Findings attributed to a node — exactly the set that lights its ring
 * (D1/D5 by source, D3 by subject, D2 on the unmapped bucket). D4 keeps
 * T-011's deliberate stance (never a ring) but shows in BOTH claimants'
 * panels via `panelFindings`. An informational D3 is excluded here and
 * KEPT in `panelFindings`: the ring is the drift claim, the panel is the
 * explanation. */
export function attributedFindings(
  findings: readonly DriftFinding[],
  id: string,
): DriftFinding[] {
  return findings.filter((f) => {
    if (!isDriftFinding(f)) return false;
    if (f.rule === "D1" || f.rule === "D5") return f.from === id;
    if (f.rule === "D3") return f.component === id;
    if (f.rule === "D2") return id === UNMAPPED_ID;
    return false;
  });
}

/** The panel's drift-findings list: the ring set plus D4 memberships. */
export function panelFindings(
  findings: readonly DriftFinding[],
  id: string,
): DriftFinding[] {
  return findings.filter((f) => {
    if (f.rule === "D1" || f.rule === "D5") return f.from === id;
    if (f.rule === "D3") return f.component === id;
    if (f.rule === "D2") return id === UNMAPPED_ID;
    return f.ids.includes(id); // D4: both claimants explain it
  });
}

export function driftCount(findings: readonly DriftFinding[], id: string): number {
  return attributedFindings(findings, id).length;
}

const leaf = (path: string): string => path.slice(path.lastIndexOf("/") + 1);

/** Cap an evidence list the way the mock does: leaves, dot-separated. */
function evidenceList(paths: readonly string[], cap = 4): string {
  const names = paths.slice(0, cap).map(leaf);
  const more = paths.length - names.length;
  return more > 0 ? `${names.join(" · ")} · +${more} more` : names.join(" · ");
}

export interface FindingText {
  /** The finding's rule id, the panel's mono label (D1…D5). */
  label: string;
  /** One plain sentence — facts, not warnings. */
  sentence: string;
  /** Mono evidence line under it; absent when nothing to list. */
  evidence?: string;
}

export function findingText(finding: DriftFinding): FindingText {
  switch (finding.rule) {
    case "D1": {
      const files = [...new Set(finding.fileEdges.map((e) => e.from))];
      return {
        label: "D1",
        sentence: `${finding.from} imports ${finding.to} without declaring the dependency.`,
        evidence: evidenceList(files),
      };
    }
    case "D2":
      return {
        label: "D2",
        sentence: `${finding.files.length} file${finding.files.length === 1 ? "" : "s"} claimed by no component.`,
        evidence: evidenceList(finding.files),
      };
    case "D3":
      return finding.informational
        ? {
            label: "D3",
            sentence: `${finding.component} declares no code the indexer walks — informational, not drift.`,
            evidence: "non_code: true in its component file",
          }
        : {
            label: "D3",
            sentence: `${finding.component} is declared but its globs match no indexed file.`,
          };
    case "D4":
      return {
        label: "D4",
        sentence: `${finding.path} is claimed by ${finding.ids.length} components — ${finding.ids.join(", ")}.`,
        evidence: `first by component id order wins (${finding.ids[0]})`,
      };
    case "D5":
      return {
        label: "D5",
        sentence: `${finding.from} depends on ${finding.to}, which no component file declares.`,
        evidence: "drawn as a placeholder node",
      };
  }
}

/** Drift-overlay footer: the pane-level summary line. */
export function driftFooter(
  findings: readonly DriftFinding[],
  unmappedFiles: readonly string[],
): string {
  // T-033: the footer counts DRIFT, so an informational D3 is out of both
  // halves — otherwise the pane reports a finding count no node's ring
  // accounts for, which is the "warning light wired to always-on" this
  // downgrade exists to switch off.
  const drift = findings.filter(isDriftFinding);
  const components = new Set<string>();
  for (const f of drift) {
    if (f.rule === "D1" || f.rule === "D5") components.add(f.from);
    else if (f.rule === "D3") components.add(f.component);
  }
  const parts = [
    `${drift.length} finding${drift.length === 1 ? "" : "s"} across ${components.size} component${components.size === 1 ? "" : "s"}`,
  ];
  if (unmappedFiles.length > 0) {
    parts.push(`${unmappedFiles.length} unclaimed file${unmappedFiles.length === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

// ---------------------------------------------------------------------
// Churn (T-013)
// ---------------------------------------------------------------------

/**
 * How a node draws its churn.
 *  - `bar`   — a 3px bottom bar plus the figure at the mark slot.
 *  - `zero`  — the figure `0` and no bar: it exists and it has not moved.
 *  - `dash`  — an em dash and no bar. The design's own sentence: "Declared-only
 *    components show — rather than a zero bar. Nothing has churned because
 *    nothing exists; a zero-width bar would lie about that."
 */
export type ChurnDisplay = "bar" | "zero" | "dash";

export interface ChurnVisual {
  display: ChurnDisplay;
  /** Bar width as a percentage of the node, 0-100. */
  percent: number;
  /** The single hottest component — one step darker (design). */
  hottest: boolean;
  /** File edits in the window; absent when `display` is `dash`. */
  edits?: number;
  /** Bar ink. INK ONLY, NEVER AMBER: "churn is not a judgement, and the
   * moment it turns amber people read it as a problem." */
  barClass: string;
}

const CHURN_BAR = "bg-muted-foreground";
const CHURN_BAR_HOTTEST = "bg-secondary-foreground";

/**
 * The churn face for one node. Pure over the derived component and the
 * attribution — no overlay check here, because the caller owns whether
 * churn is being drawn at all (an overlay that is off draws none of it).
 */
export function churnVisual(
  component: DerivedComponent,
  attribution: ChurnAttribution,
): ChurnVisual {
  // Nothing on paper has churned, and a zero-width bar would claim it
  // had a chance to. Placeholders (D5 targets) are the same shape.
  if (component.declaredOnly || component.kind === "placeholder") {
    return { display: "dash", percent: 0, hottest: false, barClass: CHURN_BAR };
  }
  const churn = attribution.byComponent.get(component.id);
  const edits = churn?.edits ?? 0;
  if (edits <= 0) {
    return { display: "zero", percent: 0, hottest: false, edits: 0, barClass: CHURN_BAR };
  }
  const hottest = attribution.hottest === component.id;
  return {
    display: "bar",
    percent: churnBarPercent(edits, attribution.busiest),
    hottest,
    edits,
    barClass: hottest ? CHURN_BAR_HOTTEST : CHURN_BAR,
  };
}

/** The churn legend's own footer line — the window, what was walked, and
 * every degradation, in one sentence of facts. */
export function churnFooter(
  windowDays: number,
  commits: number,
  attribution: ChurnAttribution,
  options: { truncated: boolean; rejected: number },
): string {
  const parts = [
    `${windowDays}d`,
    `${commits} commit${commits === 1 ? "" : "s"}`,
    `${attribution.busiest} edits in the busiest component`,
  ];
  if (attribution.unattributed > 0) {
    parts.push(`${attribution.unattributed} outside every component`);
  }
  if (options.rejected > 0) {
    parts.push(`${options.rejected} entr${options.rejected === 1 ? "y" : "ies"} refused`);
  }
  if (options.truncated) parts.push("truncated — this is a floor");
  return parts.join(" · ");
}

/** Relative "last touched" for the panel's churn section. Same shape as
 * the header's indexed-at hint, deliberately. */
export function churnAge(lastCommitMs: number, nowMs: number): string {
  if (lastCommitMs <= 0) return "unknown";
  const minutes = Math.max(0, Math.floor((nowMs - lastCommitMs) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
