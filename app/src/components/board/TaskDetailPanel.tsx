import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ProjectParseResult } from "@supertaskr/parser/pure";
import { cn } from "@/lib/utils";
import type { AssignmentDisclosure, DispatchReading } from "@/lib/board-model";
import {
  criterionLines,
  refLabel,
  selectBriefPanel,
  selectTaskDetail,
  type BriefOutcomeView,
  type BriefPanel,
  type TaskRef,
} from "@/lib/task-detail";
import { verdictEntries, type VerdictEntry } from "@/lib/verdicts";
import { attachPanelDismissal } from "./panel-dismissal";
import { CHIP_BORDER_CLASSES, STATUS_CLASSES } from "./TaskCard";
import { ReviewBadge } from "./badges/ReviewBadge";

/**
 * Card detail panel (T-005, read-only): a fixed right-side panel over
 * the board, derived per render from the live DocsModel via the pure
 * selectTaskDetail — so T-003's push updates an open panel in place, and
 * a deleted task degrades to a calm "no longer present" state instead of
 * erroring. Esc or a pointer press outside (that is not another card)
 * closes it; clicking a resolvable blocker re-targets the panel to that
 * task.
 *
 * T-006 design language (card-detail tab): id + heading over a chip row;
 * overline section labels; per-criterion marks (task-level honesty —
 * ✓ only once the verdict gate passed); status-tinted blocker chips;
 * verdict history as tinted verbatim blocks; provenance rows where the
 * independent/same-model distinction lives in TEXT (ADR-016). The
 * mockup's dispatch footer belonged to F-04 and was deliberately absent
 * until T-112 landed it: see {@link BriefBlock}. It renders only when a
 * lane reading is supplied, so a board with no lane channel is unchanged.
 *
 * T-017 (T-005-s2): Implementation notes — often the richest text in a
 * finished task file — render as a collapsed-by-default disclosure
 * (the @human-confirmed taste call) between the verdict history and
 * provenance: verbatim and mono like the verdict blocks, the body a
 * horizontal scroll container so preformatted runs stay contained.
 * The disclosure is keyed by task ref, so re-targeting the panel
 * (blocker click, another card) starts the new task collapsed again.
 *
 * T-031 (T-017-s1, T-017-s2): every remaining surface here that prints
 * FILE-DERIVED text now contains a pathological unbroken run, and the
 * two answers are deliberately different because the surfaces are.
 * Prose that WRAPS — the h2 title, the id/ref line, blocker id chips,
 * touches slugs, the provenance stamps, the file-path footer — takes
 * T-017's `min-w-0 break-words`, so a hostile field makes a taller
 * panel and never a panel-wide horizontal scrollbar. Text that is
 * PREFORMATTED and must keep its own columns — the verdict blocks —
 * takes the notes body's `overflow-x-auto` instead, because breaking a
 * verbatim quote is not containment, it is editing. Every one of them is
 * class-pinned in board-truth.test.tsx against a hostile-fields fixture;
 * jsdom does no layout, so the CLASS contract is what the suite holds
 * and the launch look stays @human's.
 *
 * T-031 (T-019-s1): the panel is where a soft issue is SAID. The card
 * face only marks that one exists; the `issues` section here lists the
 * parser's own sentences verbatim, joined by the single `issuesByFile`
 * lens the face uses, so mark and list can never disagree.
 *
 * Pure-lens note: the open/closed ref is ephemeral VIEW state (like a
 * scroll position), never project state — nothing here writes files.
 */
export function TaskDetailPanel({
  model,
  taskRef,
  onOpen,
  onClose,
  dispatch,
  brief,
}: {
  model: ProjectParseResult;
  taskRef: TaskRef;
  onOpen: (ref: TaskRef) => void;
  onClose: () => void;
  /**
   * The lane reader's answer (T-110/T-111). **ABSENT MEANS THE APP HAS NO
   * LANE CHANNEL, WHICH IS TODAY'S TRUTH AND NOT A DEFAULT.** It wants a
   * `DispatchJoin`, and since `T-126-s2` there is a producer for one: the
   * architecture sitting of 2026-08-31 ruled the join into TypeScript
   * once the dispatch view model had a test path, `T-198` landed the
   * path, and `dispatch-store.ts`'s `joinLanes` is the join.
   * **WHAT IS STILL ABSENT IS THE CALLER** — `joinLanes` needs a
   * `LaneScan`, whose only producer is the `dispatch_lanes` command; the
   * door onto it is `T-126-s1`'s parked RULING, and the two files that
   * render `<Board>` are C-05's `app-shell` (`T-126-s9`). While this prop
   * is absent the dispatch block does not render at all, rather than
   * rendering an "unavailable" strip on every card: a section that says
   * nothing on every open is a section nobody reads.
   */
  dispatch?: DispatchReading;
  /**
   * The assembler's answer for this card, when one has been asked for.
   * `dispatch_brief` is registered since `T-112-s1` and reachable through
   * `dispatch-store.ts`'s `readBrief`; what has no caller yet is the prop
   * above, which gates this one.
   */
  brief?: BriefOutcomeView;
}) {
  const detail = useMemo(() => selectTaskDetail(model, taskRef), [model, taskRef]);
  // T-112: the brief block. The JUDGEMENT is `selectBriefPanel`'s, which
  // takes T-111's disposition rather than re-deriving one here.
  const briefPanel = useMemo(
    () =>
      dispatch === undefined
        ? undefined
        : selectBriefPanel(model, taskRef, dispatch, brief),
    [model, taskRef, dispatch, brief],
  );
  const panelRef = useRef<HTMLElement>(null);

  // Esc closes; a pointer press outside the panel closes unless it
  // lands on a card trigger. Dismissal keys off POINTERDOWN, not click —
  // a trusted click's React flush detaches the clicked blocker chip
  // mid-propagation, so click-time containment checks misfire (the
  // 2026-08-15 rejection). Mechanism and rationale: attachPanelDismissal.
  useEffect(() => attachPanelDismissal(document, () => panelRef.current, onClose), [onClose]);

  // Focus the panel when it opens and whenever it re-targets (blocker
  // click); restore focus to the original opener on close.
  const openerRef = useRef<Element | null>(null);
  useEffect(() => {
    openerRef.current = document.activeElement;
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    panelRef.current?.focus();
  }, [taskRef]);

  const criteria =
    detail?.acceptanceCriteria !== undefined
      ? criterionLines(detail.acceptanceCriteria, detail.status)
      : [];
  const verdicts = detail?.verdicts !== undefined ? verdictEntries(detail.verdicts) : [];

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      data-testid="task-detail-panel"
      data-ref-kind={taskRef.kind}
      data-task-ref={refLabel(taskRef)}
      aria-label={detail === undefined ? refLabel(taskRef) : (detail.id ?? detail.title)}
      className="fixed inset-y-0 right-0 z-10 flex w-150 max-w-full flex-col overflow-y-auto border-l border-border bg-background text-foreground shadow-pop"
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-6.5 pt-5.5 pb-4">
        <div className="flex min-w-0 flex-col gap-2.25">
          <div className="flex items-baseline gap-2.5">
            {/* T-031 (T-017-s1): NOT `shrink-0`. This line is an id for a
                real card and the FILE PATH for an id-less suggestion
                (refLabel), so it is file-derived text of unbounded
                length; a flex item that refuses to shrink cannot be
                contained by any break utility, because its flex basis
                stays its content width. Ordinary ids are short enough
                that shrinking never reaches them. */}
            <p
              data-testid="detail-ref"
              className="min-w-0 font-mono text-sm break-words text-muted-foreground"
            >
              {detail?.id ?? refLabel(taskRef)}
            </p>
            {detail !== undefined && (
              <h2 className="min-w-0 text-2xl font-semibold tracking-heading break-words">
                {detail.title}
              </h2>
            )}
          </div>
          {detail !== undefined && (
            <div className="flex flex-wrap items-center gap-1.75">
              <span
                data-testid="detail-status"
                className={cn(
                  "rounded-chip border px-2.25 py-0.75 text-xs font-medium",
                  detail.suggested
                    ? "border-dashed border-ghost-border text-muted-foreground"
                    : STATUS_CLASSES[detail.visual.token],
                )}
              >
                {detail.status}
              </span>
              {detail.size !== undefined && <NeutralChip>{detail.size}</NeutralChip>}
              {detail.feature !== undefined && <NeutralChip>{detail.feature}</NeutralChip>}
              {detail.priority !== undefined && (
                <NeutralChip>priority {detail.priority}</NeutralChip>
              )}
            </div>
          )}
          {detail?.suggested === true && (
            <p
              data-testid="detail-suggested-by"
              className="min-w-0 text-xs break-words text-muted-foreground"
            >
              suggested by{" "}
              <span className="font-mono">{detail.suggestedBy ?? "(unattributed)"}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          data-testid="detail-close"
          aria-label="close detail panel"
          onClick={onClose}
          className="shrink-0 rounded-md border border-input px-2.25 py-1 font-mono text-base text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          esc
        </button>
      </div>

      {detail === undefined ? (
        <div data-testid="detail-missing" className="flex flex-col gap-2 px-6.5 py-5">
          <p className="text-base font-semibold">no longer present</p>
          <p className="text-sm text-muted-foreground">
            This task is not in the current model — its file may have been
            deleted or renamed. The panel will pick it back up if it
            returns.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5.5 px-6.5 py-5">
          {/* T-031 (T-019-s1): FIRST in the body, and rendered only when
              there is something to say. Every other section renders
              always and shows `(empty)` — that is right for a section
              the reader came looking for, and wrong for a defect
              notice, which would then say "(empty)" on every clean card
              in the project and stop being read within a week. Absence
              here means exactly "the parser had nothing to say about
              this file", the same absence discipline the card face's
              mark takes. */}
          {detail.issues.length > 0 && (
            <Section
              title="issues · verbatim"
              meta={`${detail.issues.length} issue${detail.issues.length === 1 ? "" : "s"}`}
              testid="detail-issues"
            >
              <ul className="flex flex-col gap-1.5">
                {detail.issues.map((message, index) => (
                  <li
                    key={index}
                    data-testid="detail-issue"
                    className="min-w-0 rounded-lg border border-warning-chip-border bg-warning-chip px-3.75 py-2.5 font-mono text-xs break-words whitespace-pre-wrap text-foreground"
                  >
                    {message}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {detail.suggested && (
            // T-019 (absorbing T-002-s2): a suggestion's context paragraph
            // is its ENTIRE content, so the ghost variant leads with it —
            // verbatim, wrapped, break-words for pathological unbroken
            // runs (the T-004-s1 containment). Absent context renders
            // visibly empty like every other section, never as an error.
            <Section title="context" testid="detail-context">
              {detail.preamble === undefined ? (
                <Empty />
              ) : (
                <p
                  data-testid="detail-context-text"
                  className="min-w-0 text-sm whitespace-pre-wrap break-words text-foreground"
                >
                  {detail.preamble}
                </p>
              )}
            </Section>
          )}
          <Section
            title={criteria.length > 0 ? `acceptance criteria · ${criteria.length}` : "acceptance criteria"}
            testid="detail-acceptance"
          >
            {detail.acceptanceCriteria === undefined ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-2 font-mono text-sm">
                {criteria.map((criterion, index) => (
                  <div key={index} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "shrink-0",
                        criterion.met ? "text-review-disc" : "text-muted-foreground",
                      )}
                    >
                      {criterion.met ? "✓" : "○"}
                    </span>
                    <span className="min-w-0">{criterion.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="blocked by" testid="detail-blocked-by">
            {detail.blockedBy.length === 0 ? (
              <Empty label="none" />
            ) : (
              <ul className="flex flex-wrap gap-1.75">
                {detail.blockedBy.map((blocker, index) => (
                  <li key={`${blocker.id}#${index}`} className="min-w-0">
                    {blocker.resolved && blocker.visual !== undefined ? (
                      <button
                        type="button"
                        data-testid="blocker-link"
                        data-blocker-id={blocker.id}
                        title={`${blocker.title ?? blocker.id} — ${blocker.status ?? ""}`}
                        onClick={() => onOpen({ kind: "id", id: blocker.id })}
                        className={cn(
                          "min-w-0 rounded-chip border px-2.25 py-0.75 font-mono text-xs break-words underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          STATUS_CLASSES[blocker.visual.token],
                          CHIP_BORDER_CLASSES[blocker.visual.token],
                        )}
                      >
                        {blocker.status === "done" || blocker.status === "merging"
                          ? `${blocker.id} ✓`
                          : blocker.id}
                      </button>
                    ) : (
                      <span
                        data-testid="blocker-unresolved"
                        data-blocker-id={blocker.id}
                        title="not in the current model"
                        className="min-w-0 rounded-chip border border-dashed border-ghost-border px-2.25 py-0.75 font-mono text-xs break-words text-muted-foreground"
                      >
                        {blocker.id}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="touches" testid="detail-touches">
            {detail.touches.length === 0 ? (
              <Empty label="none" />
            ) : (
              <ul className="flex flex-col gap-1 font-mono text-xs text-secondary-foreground">
                {detail.touches.map((slug, index) => (
                  <li key={`${slug}#${index}`} data-testid="detail-touch" className="min-w-0 break-words">
                    {slug}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="verdict history · verbatim"
            meta={verdicts.length > 0 ? `${verdicts.length} entr${verdicts.length === 1 ? "y" : "ies"}` : undefined}
            testid="detail-verdicts"
          >
            {detail.verdicts === undefined ? (
              <Empty />
            ) : (
              <div data-testid="detail-verdicts-text" className="flex flex-col gap-2.5">
                {verdicts.map((entry, index) => (
                  <VerdictBlock key={index} entry={entry} />
                ))}
              </div>
            )}
          </Section>

          {detail.implementationNotes === undefined ? (
            <Section title="implementation notes" testid="detail-notes">
              <Empty />
            </Section>
          ) : (
            <NotesDisclosure
              key={`${taskRef.kind}:${refLabel(taskRef)}`}
              notes={detail.implementationNotes}
            />
          )}

          {!detail.suggested && (
            <Section title="provenance" testid="detail-stamps">
              <dl className="flex flex-col gap-1.75 text-sm">
                {/* T-169 (D5, assignment is BINDING): when the parser found
                    the assignment and the execution naming different
                    models, the ASSIGNMENT is printed here beside the stamp
                    that departed from it. Its absence on a clean card is
                    deliberate — an unflagged pair says nothing new, and a
                    row that appears on every card stops being read. */}
                {detail.assignment.map((entry) => (
                  <AssignmentRow key={entry.role} entry={entry} />
                ))}
                <Stamp label="built_by" testid="stamp-built-by" value={detail.builtBy} />
                <Stamp label="verified_by" testid="stamp-verified-by" value={detail.verifiedBy} />
                <div className="flex items-center gap-2">
                  <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">review</dt>
                  <dd data-testid="stamp-review" className="flex items-center gap-1.75 font-mono">
                    {detail.review === undefined ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <ReviewBadge mode={detail.review} size={14} />
                        <span
                          className={cn(
                            "text-xs",
                            detail.review === "self-verified"
                              ? "text-muted-foreground"
                              : "text-status-done-foreground",
                          )}
                        >
                          {detail.review === "independent"
                            ? "independent — different model"
                            : detail.review === "same-model"
                              ? "same-model — fresh session"
                              : "self-verified — builder session"}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </Section>
          )}

          {briefPanel !== undefined && <BriefBlock panel={briefPanel} />}

          <p
            data-testid="detail-file"
            className="mt-auto min-w-0 border-t border-hairline pt-2.5 font-mono text-xs break-words text-muted-foreground"
          >
            {detail.file}
          </p>
        </div>
      )}
    </aside>
  );
}

/**
 * The dispatch block (T-112) — the mockup's dispatch footer, which the
 * header note above called deliberately absent until F-04 reached it.
 *
 * **THREE OUTCOMES AND NO TWO OF THEM ARE THE SAME SILENCE.** A brief you
 * may copy; a card you may NOT dispatch, shown with the disposition's own
 * reason instead of a blank; and an assembler that could not tell you,
 * shown as its typed refusal rather than as a shortened brief. The
 * judgement is `selectBriefPanel`'s and none of it is re-decided here —
 * this component chooses a `data-testid` and nothing else.
 *
 * The block is `overflow-x-auto` and NOT `break-words`, for the reason
 * T-031 settled one section up: the brief is a PREFORMATTED quotation of
 * other files, and breaking a verbatim quote is not containment, it is
 * editing. A human selects it and pastes it into their own agent, so the
 * columns have to survive the trip.
 */
function BriefBlock({ panel }: { panel: BriefPanel }) {
  if (panel.kind === "copyable") {
    return (
      <Section title="dispatch brief · copyable" testid="detail-brief">
        {/* T-185's quiet truncation note, in the shell's own idiom — the
            `docs-truncation-note` pattern from App.tsx (T-018): muted,
            factual, never a chip, and ABSENT rather than empty when the
            scan was a count. It sits ABOVE the brief because it qualifies
            the invitation to copy it, and the sentence is
            `selectBriefPanel`'s — this component chooses a testid and
            nothing else, exactly as this block's header promises. */}
        {panel.floor !== null && (
          <p
            data-testid="detail-brief-floor"
            className="min-w-0 font-mono text-xs break-words text-muted-foreground"
          >
            {panel.floor}
          </p>
        )}
        <div
          data-testid="detail-brief-copyable"
          data-task-id={panel.taskId}
          className="overflow-x-auto rounded-chip border border-hairline bg-muted px-2.5 py-2"
        >
          <pre className="font-mono text-xs whitespace-pre text-secondary-foreground">
            {panel.text}
          </pre>
        </div>
        <button
          type="button"
          data-testid="detail-brief-copy"
          className="self-start rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-muted-foreground"
          onClick={() => {
            // The clipboard is not the project: this writes no file, so
            // the pure-lens rule is untouched. It is also absent in
            // jsdom and in a hostile webview, so the call is optional
            // and its failure costs the reader nothing — the block above
            // is still selectable by hand, which is what makes the
            // affordance an accelerator rather than the only way out.
            void navigator.clipboard?.writeText(panel.text).catch(() => {});
          }}
        >
          copy
        </button>
      </Section>
    );
  }
  if (panel.kind === "withheld") {
    return (
      <Section title="dispatch brief · withheld" testid="detail-brief">
        <p
          data-testid="detail-brief-withheld"
          data-disposition={panel.disposition}
          className="min-w-0 text-sm break-words text-secondary-foreground"
        >
          {panel.reason}
        </p>
      </Section>
    );
  }
  return (
    <Section title="dispatch brief · unavailable" testid="detail-brief">
      <p
        data-testid="detail-brief-unavailable"
        className="min-w-0 text-sm break-words text-secondary-foreground"
      >
        {panel.sentence}
      </p>
    </Section>
  );
}

/** Neutral metadata chip (size · feature · priority) in the header row. */
function NeutralChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-muted-foreground">
      {children}
    </span>
  );
}

/** Implementation notes as a collapsed-by-default disclosure (T-017,
 * T-005-s2): the summary row wears the section-header dress and toggles
 * the body — verbatim, mono, whitespace-preserving like the verdict
 * blocks, inside an `overflow-x-auto` container so unbroken
 * preformatted runs scroll instead of widening the panel. Collapse
 * state is ephemeral view state; the parent keys this component by task
 * ref so every newly targeted task starts collapsed. */
function NotesDisclosure({ notes }: { notes: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section data-testid="detail-notes" data-expanded={open ? "true" : "false"} className="flex flex-col gap-2.5">
      <button
        type="button"
        data-testid="detail-notes-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-baseline justify-between gap-2 rounded-sm text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <h3 className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          implementation notes · verbatim
        </h3>
        <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
          {open ? "⌄" : "›"}
        </span>
      </button>
      {open && (
        <div
          data-testid="detail-notes-text"
          className="overflow-x-auto rounded-lg border border-border bg-muted px-3.75 py-3.25 font-mono text-sm whitespace-pre-wrap text-foreground"
        >
          {notes}
        </div>
      )}
    </section>
  );
}

/** One verdict entry: a tinted reading surface, text verbatim.
 *
 * T-031 (T-017-s2): the text container carries `overflow-x-auto`, the
 * same containment `NotesDisclosure` has had since T-017 — the criterion
 * that built the notes body said "scrollable like verdicts" while the
 * verdict blocks were the one file-derived surface in this panel that
 * had no containment at all. A long unbroken run in a REJECTED repro (a
 * path, a URL, a minified snippet) used to widen the panel's own scroll
 * context into ONE panel-wide horizontal scrollbar, while the notes
 * section directly below it scrolled neatly inside its own box.
 *
 * SCROLL rather than BREAK, and the two are not interchangeable here.
 * A verdict is a verbatim quotation of somebody's judgement, often
 * preformatted; `break-words` would re-flow it and change what the
 * reader sees, which is the one thing a verbatim surface may not do
 * (T-005). `whitespace-pre-wrap` is unchanged for the same reason. */
function VerdictBlock({ entry }: { entry: VerdictEntry }) {
  const tint =
    entry.kind === "rejected"
      ? "border-status-rejected-border bg-verdict-rejected"
      : entry.kind === "approved"
        ? "border-status-done-border bg-verdict-approved"
        : "border-border bg-muted";
  const label =
    entry.kind === "rejected"
      ? "text-status-rejected-foreground"
      : entry.kind === "approved"
        ? "text-status-done-foreground"
        : "text-muted-foreground";
  const ink =
    entry.kind === "rejected"
      ? "text-verdict-rejected-ink"
      : entry.kind === "approved"
        ? "text-verdict-approved-ink"
        : "text-foreground";
  return (
    <div
      data-verdict-kind={entry.kind}
      className={cn("flex flex-col gap-2 rounded-lg border px-3.75 py-3.25", tint)}
    >
      <span className={cn("font-mono text-xs font-bold uppercase", label)}>
        {entry.kind === "note" ? "entry" : entry.kind}
      </span>
      <div
        data-testid="detail-verdict-text"
        className={cn("overflow-x-auto font-mono text-sm whitespace-pre-wrap", ink)}
      >
        {entry.text}
      </div>
    </div>
  );
}

function Section({
  title,
  meta,
  testid,
  children,
}: {
  title: string;
  meta?: string;
  testid: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testid} className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          {title}
        </h3>
        {meta !== undefined && (
          <span className="font-mono text-xs text-muted-foreground">{meta}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/** Visibly-empty marker (criterion 3: absent sections render as empty,
 * never as an error). */
function Empty({ label = "(empty)" }: { label?: string }) {
  return (
    <p data-testid="detail-empty" className="text-xs text-muted-foreground italic">
      {label}
    </p>
  );
}

/**
 * One flagged assignment pair, BOTH VALUES SHOWN (T-169).
 *
 * The card's second criterion is that a violation is never a silent
 * substitution, and the substitution this repairs is a real one: the
 * model badge shows `built_by` on a done card and `builder` on every
 * other, so on a card where the two disagree the assignment was simply
 * not on screen anywhere. Here they sit on one row, verbatim, with the
 * frontmatter field names the reader will find on the card.
 *
 * THE WORD IS "DISAGREE" AND NOTHING STRONGER. The panel knows the two
 * fields name different models; it does not know which is right, and the
 * parser's own sentence — already listed verbatim in the issues section
 * above — says the same. Why they disagree is a human question, and the
 * row's job is to put the question in front of a human, not answer it.
 *
 * `text-warning` is the sanctioned stroke (tokens.css: warning is a
 * STROKE, never a fill), the same ink the card face's IssueMark uses, so
 * the face's mark and this row read as one disclosure.
 */
function AssignmentRow({ entry }: { entry: AssignmentDisclosure }) {
  return (
    <div
      data-testid="stamp-assignment"
      data-assignment-role={entry.role}
      className="flex flex-col gap-0.75 rounded-lg border border-warning-chip-border bg-warning-chip px-3.75 py-2.5"
    >
      <span className="font-mono text-xs text-warning">
        {entry.assignedField} and {entry.executedField} disagree
      </span>
      <div className="flex items-baseline gap-2">
        <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
          {entry.assignedField}
        </dt>
        <dd
          data-testid="assignment-assigned"
          className="min-w-0 font-mono text-sm break-words"
        >
          {entry.assigned}
        </dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
          {entry.executedField}
        </dt>
        <dd
          data-testid="assignment-executed"
          className="min-w-0 font-mono text-sm break-words"
        >
          {entry.executed}
        </dd>
      </div>
    </div>
  );
}

function Stamp({ label, testid, value }: { label: string; testid: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{label}</dt>
      <dd data-testid={testid} className="min-w-0 font-mono text-sm break-words">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
