import { useEffect, useReducer, useRef } from "react";
import type { DocsModelState } from "@/lib/docs-model";
import { skipReasonPhrase } from "@/lib/docs-model";
import {
  deriveGenesis,
  EMPTY_CHANGE_LOG,
  observeDocsChange,
  type BackboneEntry,
  type GenesisArtifact,
  type GenesisChangeLog,
} from "./genesis-derive";

/**
 * Genesis pane (T-024, C-13): the interview screen's right half — "the
 * project, so far" — rendered from deriveGenesis's model only. A pure
 * lens: whatever writes docs/ (T-025's spawned planner, or a human
 * hand-driving the method in a terminal) lands here through the
 * existing watcher pipeline; the pane holds no data of its own beyond
 * the change log that powers the "writing" pulse window.
 *
 * Standalone and driver-agnostic: the mount point arrives with T-026.
 * Props are the live DocsModelState plus an injectable clock (tests
 * pin the writing window without wall-clock flake).
 *
 * Design source: the `interview` screen of docs/design/
 * claudedesign_handoff/"supertaskr app.dc.html", right pane — values
 * extracted per the T-006 protocol, tokens only; dark values ride the
 * token families (flagged to the screenshot pass). Degradation rides
 * the existing machinery: torn/malformed model inputs keep their
 * last-good content in `effective` while the established parse-chip
 * family reports the failure — never a crash, never a blank pane.
 *
 * THE RENDER-PHASE REF STAMP, RATIFIED (T-042 criterion 4, the
 * architect's ruling on T-024-s3; the write itself is below, in the
 * component body). `logRef.current = observeDocsChange(logRef.current,
 * docs, clock())` mutates a ref DURING RENDER, which React's rules
 * generally forbid. It is legitimate HERE, and the three conditions are
 * the whole of why — lose any one of them and this stops being the
 * pattern and starts being the bug it resembles:
 *
 *   1. GUARDED. `observeDocsChange` returns `prev` BY IDENTITY for the
 *      empty state, for an already-observed seq, and for a stale one, so
 *      a StrictMode double-render and every unrelated re-render are
 *      no-ops. The fold itself is pure.
 *   2. BOUNDED. The only thing the stamp feeds is the `writing` pulse
 *      window. The worst a discarded concurrent render can do is start
 *      that window a few milliseconds early — cosmetic, self-healing,
 *      and nothing else in the model reads it.
 *   3. DERIVED FROM PROPS THE RENDER ALREADY HAS. `docs` is the prop; no
 *      I/O, no subscription, no second source of truth. This is the
 *      T-012 precedent (its render-time layout cache), not a new one.
 *
 * NOT RELOCATED, and the reason is recorded rather than assumed. The
 * arm for folding this log into the watcher store existed to serve a
 * SECOND CONSUMER; T-027's planning pass read both sides and proved
 * there is none — T-024's log answers "what changed in the last five
 * seconds" (this pulse window), while T-027's banked chips need "what
 * changed since this turn began", a per-turn baseline diff over the same
 * evidence. Different windows, no shared log. Moving state across a
 * component boundary to serve nobody is cost without benefit.
 *
 * IF a second consumer ever appears, the relocation is a change of
 * SOURCE, not of mechanism: the fold is already pure, so it moves
 * wholesale and this component drops the ref. Recorded here so that
 * option stays open rather than lost. The general rule lives beside the
 * other traps, in docs/CONVENTIONS.md § Gotchas.
 */

const OVERLINE = "font-mono text-xs uppercase tracking-overline text-muted-foreground";
const MONO_HINT = "font-mono text-xs text-muted-foreground";
/** The established parse-chip family (ParseErrorBadge / SkippedFilesBadge). */
const CHIP =
  "flex items-center gap-1.75 rounded-md border border-status-rejected-border bg-status-rejected px-2.5 py-1.25 font-mono text-xs text-destructive";

/** 12px checked disc — the review-mark family at the design's artifact-row
 * size (--review-disc / --review-mark, the provenance semantic the ✓ rows
 * reuse; same construction as ReviewBadge's checked mark). */
function WrittenMark() {
  return (
    <svg viewBox="0 0 12 12" width={12} height={12} aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="6" r="6" fill="var(--review-disc)" />
      <path
        d="M3.5 6.3 L5.2 8 L8.6 4.4"
        fill="none"
        stroke="var(--review-mark)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArtifactRow({ artifact }: { artifact: GenesisArtifact }) {
  const { path, status, assumptions } = artifact;
  const box =
    status === "writing"
      ? "border-status-building-border bg-card"
      : status === "written"
        ? "border-border bg-card"
        : // Placeholder rows follow the design's dashed-placeholder
          // treatment (its forming/slot backbone cards are dashed AND
          // card-filled); the border style, not the fill, carries
          // "not written yet".
          "border-dashed border-ghost-border bg-card";
  return (
    <li
      data-testid="genesis-artifact"
      data-path={path}
      data-status={status}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3.25 py-2.5 ${box}`}
    >
      <span
        className={`truncate font-mono text-sm ${
          status === "expected" ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {path}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {assumptions > 0 && (
          <span
            data-testid="genesis-assumption-badge"
            title={`${assumptions} unresolved assumption marker${assumptions === 1 ? "" : "s"} ([?])`}
            className="rounded-sm bg-muted px-1.5 font-mono text-xs text-muted-foreground"
          >
            {assumptions} [?]
          </span>
        )}
        {status === "written" && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-status-done-foreground">
            <WrittenMark />
            written
          </span>
        )}
        {status === "writing" && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-status-building-foreground">
            <span
              aria-hidden="true"
              className="h-1.25 w-1.25 rounded-full bg-chart-4 motion-safe:animate-status-pulse"
            />
            writing
          </span>
        )}
        {status === "expected" && (
          <span className="font-mono text-xs text-muted-foreground">expected</span>
        )}
      </span>
    </li>
  );
}

/** Backbone grid cell ids continue past the built/forming entries so the
 * placeholder slots carry the ids the interview will bank next. */
function backboneCells(entries: BackboneEntry[]): (BackboneEntry | { kind: "slot"; id: string })[] {
  const cells: (BackboneEntry | { kind: "slot"; id: string })[] = [...entries];
  let max = 0;
  for (const entry of entries) {
    const n = /^F-(\d+)$/.exec(entry.id);
    if (n !== null) max = Math.max(max, Number(n[1]));
  }
  while (cells.length < 5) {
    max += 1;
    cells.push({ kind: "slot", id: `F-${String(max).padStart(2, "0")}` });
  }
  return cells;
}

export function GenesisPane({ docs, now }: { docs: DocsModelState; now?: () => number }) {
  const clock = now ?? Date.now;
  // Render-time ref cache keyed on (seq, projectDir) — the T-012 layout
  // precedent; observeDocsChange returns identity for already-observed
  // states, so StrictMode double-renders never re-stamp. RATIFIED rather
  // than relocated at T-042 criterion 4 — the header's three conditions
  // are what make this legitimate, and the log stays here.
  const logRef = useRef<GenesisChangeLog>(EMPTY_CHANGE_LOG);
  logRef.current = observeDocsChange(logRef.current, docs, clock());
  const [, bumpTick] = useReducer((t: number) => t + 1, 0);
  const model = deriveGenesis(docs, logRef.current, clock());

  // The pane's one timer: a single one-shot re-derivation scheduled at
  // the earliest writing→written horizon. Not polling — nothing is
  // fetched; a known state transition is rendered when its window
  // closes. Cleared and re-armed per render; fires only when a writing
  // artifact exists.
  useEffect(() => {
    if (model.nextTransitionMs === null) return undefined;
    const timer = setTimeout(bumpTick, Math.max(model.nextTransitionMs, 0) + 1);
    return () => clearTimeout(timer);
  });

  const failures = docs.failures;
  const skipped = docs.skipped;

  return (
    <section
      data-testid="genesis-pane"
      data-stage={model.approxStage ?? "none"}
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar"
    >
      <header className="flex items-center justify-between gap-4 border-b border-hairline px-6.5 pt-5 pb-4">
        <span className={OVERLINE}>the project, so far</span>
        <span data-testid="genesis-file-count" className={MONO_HINT}>
          docs/ · {model.filesWritten} file{model.filesWritten === 1 ? "" : "s"} written
        </span>
      </header>

      {(failures.length > 0 || skipped.length > 0) && (
        <div className="flex flex-wrap items-center gap-2.25 px-6.5 pt-3">
          {failures.length > 0 && (
            <span
              data-testid="genesis-parse-chip"
              title={failures
                .map((f) => f.issues[0]?.message ?? `${f.path}: unparsable`)
                .join("\n")}
              className={CHIP}
            >
              {failures.length} parse error{failures.length === 1 ? "" : "s"}
              {failures.some((f) => f.showingLastGood) && (
                <span className="text-status-rejected-foreground">· last valid state</span>
              )}
            </span>
          )}
          {skipped.length > 0 && (
            <span
              data-testid="genesis-skip-chip"
              title={skipped.map((s) => `${s.path}: skipped — ${skipReasonPhrase(s.reason)}`).join("\n")}
              className={CHIP}
            >
              {skipped.length} skipped file{skipped.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6.5 py-5.5">
        {/* T-031 (T-024-s4): this card's title is the pane's ONE unbounded
            text surface. Every other one is bounded — chips clip at
            CHIP_CLIP characters on a word boundary, artifact rows and
            backbone names carry `truncate` — while
            `northStar.title = firstSentence(vision)` returns the WHOLE
            collapsed blob when the vision holds no `.`, `!` or `?`, which
            a NORTH_STAR.md caught mid-write routinely does: the sentence
            terminator arrives after the prose, and rendering that state
            live is the entire point of this pane.
            The treatment is T-017's, not a third policy — `break-words`
            plus `min-w-0` on the flex ancestor, and deliberately NO
            `truncate`/`line-clamp`, because the design's hero line is one
            sentence and a clipped hero reads worse than a wrapped one.
            Whether it should ALSO clip is a design call, not a
            correctness one. */}
        <div
          data-testid="genesis-north-star"
          className="flex min-w-0 flex-col gap-2.25 rounded-lg border border-border bg-card px-5 py-4.5 shadow-card"
        >
          <span className={OVERLINE}>north star</span>
          {model.northStar === null ? (
            <span className="text-sm text-muted-foreground">forming…</span>
          ) : (
            <>
              <span
                data-testid="genesis-north-star-title"
                className="min-w-0 text-2xl font-semibold tracking-heading break-words text-foreground"
              >
                {model.northStar.title}
              </span>
              {model.northStar.chips.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-1.75">
                  {model.northStar.chips.map((chip) => (
                    <span
                      key={chip.kind}
                      data-testid="genesis-chip"
                      data-kind={chip.kind}
                      className="rounded-chip border border-status-done-border bg-status-done px-2.25 py-0.75 font-mono text-xs text-status-done-foreground"
                    >
                      {chip.kind}: {chip.text}
                    </span>
                  ))}
                </span>
              )}
            </>
          )}
        </div>

        <div data-testid="genesis-backbone" className="flex flex-col gap-2.75">
          <div className="flex items-center justify-between gap-4">
            <span className={OVERLINE}>backbone</span>
            <span className={MONO_HINT}>grows as you answer</span>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {backboneCells(model.backbone).map((cell) => {
              if (cell.kind === "built") {
                return (
                  <div
                    key={cell.id}
                    data-testid="genesis-feature"
                    data-kind="built"
                    className="flex min-w-0 flex-col gap-0.75 rounded-lg bg-column-header px-3 py-2.5"
                  >
                    <span className="font-mono text-xs text-column-header-id">{cell.id}</span>
                    <span className="truncate text-sm font-semibold text-column-header-foreground">
                      {cell.name}
                    </span>
                  </div>
                );
              }
              const forming = cell.kind === "forming";
              return (
                <div
                  key={cell.id}
                  data-testid="genesis-feature"
                  data-kind={forming ? "forming" : "slot"}
                  className={`flex min-w-0 flex-col gap-0.75 rounded-lg border border-dashed bg-card px-3 py-2.5 ${
                    forming ? "border-ghost-border" : "border-border"
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">{cell.id}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {forming ? "forming…" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div data-testid="genesis-artifacts" className="flex flex-col gap-2.75">
          <div className="flex items-center justify-between gap-4">
            <span className={OVERLINE}>artifacts written</span>
            <span className={MONO_HINT}>plain markdown, in your repo</span>
          </div>
          <ul className="flex flex-col gap-1.75">
            {model.artifacts.map((artifact) => (
              <ArtifactRow key={artifact.path} artifact={artifact} />
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-dashed border-ghost-border pt-4">
          <span data-testid="genesis-next" className="text-base text-secondary-foreground">
            {model.nextLine}
          </span>
          <span data-testid="genesis-stage" className="shrink-0 font-mono text-xs text-muted-foreground">
            {model.stageLine}
          </span>
        </div>
      </div>
    </section>
  );
}
