import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { cn } from "@/lib/utils";
import { refLabel, selectTaskDetail, type TaskRef } from "@/lib/task-detail";
import { STATUS_CLASSES } from "./TaskCard";
import { SizeBadge } from "./badges/SizeBadge";
import { ReviewBadge } from "./badges/ReviewBadge";

/**
 * Card detail panel (T-005, read-only): a fixed right-side panel over
 * the board, derived per render from the live DocsModel via the pure
 * selectTaskDetail — so T-003's push updates an open panel in place, and
 * a deleted task degrades to a calm "no longer present" state instead of
 * erroring. Esc or a click outside (that is not another card) closes it;
 * clicking a resolvable blocker re-targets the panel to that task.
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

  // Esc closes; a click outside the panel closes unless it lands on a
  // card trigger (that click's own handler opens/switches the panel —
  // closing here too would race it shut).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest("[data-card-trigger]") !== null) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [onClose]);

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

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      data-testid="task-detail-panel"
      data-ref-kind={taskRef.kind}
      data-task-ref={refLabel(taskRef)}
      aria-label={detail === undefined ? refLabel(taskRef) : (detail.id ?? detail.title)}
      className="fixed inset-y-0 right-0 z-10 flex w-96 max-w-full flex-col gap-4 overflow-y-auto border-l border-border bg-background p-6 text-foreground"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground">
          {detail?.id ?? refLabel(taskRef)}
        </p>
        <button
          type="button"
          data-testid="detail-close"
          aria-label="close detail panel"
          onClick={onClose}
          className="rounded-sm px-1 font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          esc ✕
        </button>
      </div>

      {detail === undefined ? (
        <div data-testid="detail-missing" className="flex flex-col gap-2">
          <p className="text-sm font-medium">no longer present</p>
          <p className="text-sm text-muted-foreground">
            This task is not in the current model — its file may have been
            deleted or renamed. The panel will pick it back up if it
            returns.
          </p>
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{detail.title}</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                data-testid="detail-status"
                className={cn(
                  "rounded-sm px-1.5 py-0.5 font-mono text-xs",
                  detail.suggested
                    ? "border border-dashed border-muted-foreground/50 text-muted-foreground"
                    : STATUS_CLASSES[detail.visual.token],
                )}
              >
                {detail.status}
              </span>
              {detail.size !== undefined && <SizeBadge size={detail.size} />}
            </div>
            {detail.suggested && (
              <p data-testid="detail-suggested-by" className="text-xs text-muted-foreground">
                suggested by{" "}
                <span className="font-mono">{detail.suggestedBy ?? "(unattributed)"}</span>
              </p>
            )}
          </header>

          <Section title="acceptance criteria" testid="detail-acceptance">
            {detail.acceptanceCriteria === undefined ? (
              <Empty />
            ) : (
              <div className="text-sm whitespace-pre-wrap">{detail.acceptanceCriteria}</div>
            )}
          </Section>

          <Section title="blocked by" testid="detail-blocked-by">
            {detail.blockedBy.length === 0 ? (
              <Empty label="none" />
            ) : (
              <ul className="flex flex-wrap gap-1.5">
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
                          "rounded-sm border border-current/30 px-1.5 py-0.5 font-mono text-xs underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
                          STATUS_CLASSES[blocker.visual.token],
                        )}
                      >
                        {blocker.id}
                      </button>
                    ) : (
                      <span
                        data-testid="blocker-unresolved"
                        data-blocker-id={blocker.id}
                        title="not in the current model"
                        className="rounded-sm border border-current/30 px-1.5 py-0.5 font-mono text-xs opacity-60"
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
              <ul className="flex flex-wrap gap-1.5">
                {detail.touches.map((slug, index) => (
                  <li
                    key={`${slug}#${index}`}
                    className="rounded-sm border border-current/30 px-1.5 py-0.5 font-mono text-xs"
                  >
                    {slug}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="verdicts" testid="detail-verdicts">
            {detail.verdicts === undefined ? (
              <Empty />
            ) : (
              <pre
                data-testid="detail-verdicts-text"
                className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs"
              >
                {detail.verdicts}
              </pre>
            )}
          </Section>

          {!detail.suggested && (
            <Section title="stamps" testid="detail-stamps">
              <dl className="flex flex-col gap-1 text-xs">
                <Stamp label="built_by" testid="stamp-built-by" value={detail.builtBy} />
                <Stamp label="verified_by" testid="stamp-verified-by" value={detail.verifiedBy} />
                <div className="flex items-baseline gap-2">
                  <dt className="w-24 shrink-0 font-mono text-muted-foreground">review</dt>
                  <dd data-testid="stamp-review" className="flex items-center gap-1.5 font-mono">
                    {detail.review === undefined ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <ReviewBadge mode={detail.review} />
                        {detail.review}
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </Section>
          )}

          <p className="mt-auto border-t border-border pt-2 font-mono text-xs text-muted-foreground">
            {detail.file}
          </p>
        </>
      )}
    </aside>
  );
}

function Section({
  title,
  testid,
  children,
}: {
  title: string;
  testid: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testid} className="flex flex-col gap-1.5">
      <h3 className="font-mono text-xs text-muted-foreground">{title}</h3>
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
      <dt className="w-24 shrink-0 font-mono text-muted-foreground">{label}</dt>
      <dd data-testid={testid} className="font-mono">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
