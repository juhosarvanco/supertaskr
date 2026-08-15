import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { cn } from "@/lib/utils";
import {
  criterionLines,
  refLabel,
  selectTaskDetail,
  verdictEntries,
  type TaskRef,
  type VerdictEntry,
} from "@/lib/task-detail";
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
 * mockup's dispatch footer belongs to F-04 and is deliberately absent.
 *
 * Pure-lens note: the open/closed ref is ephemeral VIEW state (like a
 * scroll position), never project state — nothing here writes files.
 */
export function TaskDetailPanel({
  model,
  taskRef,
  onOpen,
  onClose,
}: {
  model: ProjectParseResult;
  taskRef: TaskRef;
  onOpen: (ref: TaskRef) => void;
  onClose: () => void;
}) {
  const detail = useMemo(() => selectTaskDetail(model, taskRef), [model, taskRef]);
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
            <p className="shrink-0 font-mono text-sm text-muted-foreground">
              {detail?.id ?? refLabel(taskRef)}
            </p>
            {detail !== undefined && (
              <h2 className="min-w-0 text-2xl font-semibold tracking-heading">{detail.title}</h2>
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
            <p data-testid="detail-suggested-by" className="text-xs text-muted-foreground">
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
                  <li key={`${blocker.id}#${index}`}>
                    {blocker.resolved && blocker.visual !== undefined ? (
                      <button
                        type="button"
                        data-testid="blocker-link"
                        data-blocker-id={blocker.id}
                        title={`${blocker.title ?? blocker.id} — ${blocker.status ?? ""}`}
                        onClick={() => onOpen({ kind: "id", id: blocker.id })}
                        className={cn(
                          "rounded-chip border px-2.25 py-0.75 font-mono text-xs underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
                        className="rounded-chip border border-dashed border-ghost-border px-2.25 py-0.75 font-mono text-xs text-muted-foreground"
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
                  <li key={`${slug}#${index}`}>{slug}</li>
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

          {!detail.suggested && (
            <Section title="provenance" testid="detail-stamps">
              <dl className="flex flex-col gap-1.75 text-sm">
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

          <p className="mt-auto border-t border-hairline pt-2.5 font-mono text-xs text-muted-foreground">
            {detail.file}
          </p>
        </div>
      )}
    </aside>
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

/** One verdict entry: a tinted reading surface, text verbatim. */
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
      <div className={cn("font-mono text-sm whitespace-pre-wrap", ink)}>{entry.text}</div>
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

function Stamp({ label, testid, value }: { label: string; testid: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{label}</dt>
      <dd data-testid={testid} className="font-mono text-sm">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
