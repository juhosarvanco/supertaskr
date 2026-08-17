import { useMemo, useRef, useState } from "react";
import type { ProjectParseResult, ReviewMode } from "@nputer/parser/pure";
import { cn } from "@/lib/utils";
import type { TaskRef } from "@/lib/task-detail";
import {
  criticalPathText,
  readyNowText,
  scheduleWord,
  selectTaskWaves,
  taskCardVisual,
  TASK_CARD_H,
  TASK_CARD_W,
  WAVE_LABEL_TOP,
  worstBlockerText,
  type WaveCard,
} from "./task-waves";

/**
 * The map pane's SECOND lens (T-034): the same board tasks, ordered by
 * dependency instead of story — dependency waves from `blocked_by`, the
 * critical path in the design's terracotta family, a blocked/ready
 * distinction on the grey cards, and the summary strip
 * (critical path · worst blocker · ready now).
 *
 * Spec of record: the design bundle's "map · tasks" screen
 * (docs/design/claudedesign_handoff/"nputer app.dc.html"), README §5.
 * Every rule and every number lives in task-waves.ts — this file is a
 * VIEW. Zoom/pan repeats the architecture lens's construction (HTML
 * cards over an SVG edge layer inside ONE transformed wrapper; scale
 * only, never re-layout) because it is the same pane.
 *
 * Every string that reaches the DOM here is a React child — a task title
 * is file content and is rendered as a TEXT NODE, never as markup. The
 * standing grep gate over app/src/architecture/ (map-tasks-lens's own
 * suite) keeps it that way.
 */

/** Zoom clamp, the architecture lens's recorded silence: 0.25–3. */
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export function TasksLens({
  model,
  onOpenTask,
}: {
  model: ProjectParseResult;
  onOpenTask: (ref: TaskRef) => void;
}) {
  const waves = useMemo(() => selectTaskWaves(model), [model]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [focused, setFocused] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());

  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey) {
      const container = canvasRef.current;
      if (container === null) return;
      const rect = container.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setViewport((v) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, v.scale * Math.exp(-event.deltaY * 0.01)),
        );
        const ratio = scale / v.scale;
        return { scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
      });
    } else {
      setViewport((v) => ({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }));
    }
  };

  /** Arrow walking, the architecture lens's mapping: ↑/↓ walk the wave's
   * slots, →/← the first task this one blocks / is blocked by. */
  const onCardKeyDown = (event: React.KeyboardEvent, id: string): void => {
    const node = waves.layout.nodes.get(id);
    if (node === undefined) return;
    let target: string | undefined;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const column = [...waves.layout.nodes.values()]
        .filter((n) => n.wave === node.wave)
        .sort((a, b) => a.row - b.row);
      const index = column.findIndex((n) => n.id === id);
      target = column[event.key === "ArrowUp" ? index - 1 : index + 1]?.id;
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      target = waves.layout.edges
        .filter((e) => (event.key === "ArrowRight" ? e.from === id : e.to === id))
        .map((e) => (event.key === "ArrowRight" ? e.to : e.from))
        .find((candidate) => waves.layout.nodes.has(candidate));
    } else {
      return;
    }
    if (target !== undefined) {
      event.preventDefault();
      cardRefs.current.get(target)?.focus();
    }
  };

  const firstCardId = waves.cards[0]?.id;

  return (
    <>
      {/* Summary strip: critical path · worst blocker · ready now. */}
      <div
        data-testid="map-tasks-summary"
        className="flex items-stretch border-b border-hairline"
      >
        <SummaryCell
          testId="map-tasks-critical-path"
          label="critical path"
          value={criticalPathText(waves)}
          className="min-w-0 flex-1"
        />
        <span aria-hidden="true" className="w-px shrink-0 bg-hairline" />
        <SummaryCell
          testId="map-tasks-worst-blocker"
          label="worst blocker"
          value={worstBlockerText(waves)}
          valueInk="text-status-rejected-title"
          className="w-75 shrink-0"
        />
        <span aria-hidden="true" className="w-px shrink-0 bg-hairline" />
        <SummaryCell
          testId="map-tasks-ready-now"
          label="ready now"
          value={readyNowText(waves)}
          className="w-57.5 shrink-0"
        />
      </div>

      <div
        ref={canvasRef}
        data-testid="map-tasks-canvas"
        onWheel={onWheel}
        className="map-canvas-grid relative min-h-0 flex-1 overflow-hidden px-6 pt-5.5 pb-4.5"
      >
        {waves.cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            no tasks to order yet — the waves come from the task files&rsquo;{" "}
            <span className="rounded-sm bg-muted px-1 font-mono text-xs">blocked_by</span>
          </p>
        ) : (
          <div
            data-testid="map-tasks-transform"
            className="relative"
            style={{
              width: waves.layout.width,
              height: waves.layout.height,
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              width={waves.layout.width}
              height={waves.layout.height}
              className="absolute top-0 left-0 overflow-visible"
              aria-hidden="true"
            >
              <TaskEdgeMarkers />
              {waves.layout.edges.map((edge) => (
                <path
                  key={`${edge.from}->${edge.to}`}
                  data-testid="map-tasks-edge"
                  data-edge={`${edge.from}->${edge.to}`}
                  data-critical={edge.critical || undefined}
                  data-tangled={edge.tangled || undefined}
                  d={edge.path}
                  fill="none"
                  stroke={
                    edge.critical ? "var(--status-rejected-meta)" : "var(--map-edge-planned)"
                  }
                  strokeWidth={edge.critical ? 2 : 1.25}
                  {...(edge.tangled ? { strokeDasharray: "5 4" } : {})}
                  markerEnd={`url(#task-arrow-${edge.critical ? "critical" : "plain"})`}
                />
              ))}
            </svg>
            {waves.layout.waveLabels.map((label) => (
              <span
                key={label.wave}
                data-testid="map-tasks-wave-label"
                className="absolute font-mono text-map-id tracking-overline text-map-declared-only-foreground uppercase"
                style={{ left: label.x, top: WAVE_LABEL_TOP }}
              >
                {label.label}
              </span>
            ))}
            {waves.cards.map((card) => {
              const node = waves.layout.nodes.get(card.id);
              if (node === undefined) return null;
              return (
                <TaskWaveCard
                  key={card.id}
                  card={card}
                  x={node.x}
                  y={node.y}
                  tabbable={focused === card.id || (focused === null && card.id === firstCardId)}
                  buttonRef={(el) => {
                    if (el === null) cardRefs.current.delete(card.id);
                    else cardRefs.current.set(card.id, el);
                  }}
                  onOpen={() => onOpenTask({ kind: "id", id: card.id })}
                  onFocus={setFocused}
                  onKeyDown={onCardKeyDown}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Legend — the tasks lens's own four entries. */}
      <div
        data-panel-exempt
        data-testid="map-tasks-legend"
        className="mx-5 flex flex-wrap items-center gap-5.5 border-t border-hairline pt-3.5 pb-5.5"
      >
        <span className="font-mono text-map-id tracking-overline text-muted-foreground uppercase">
          legend · tasks
        </span>
        <LegendEntry label="critical path">
          <svg width="24" height="2" aria-hidden="true">
            <rect width="24" height="2" fill="var(--status-rejected-meta)" />
          </svg>
        </LegendEntry>
        <LegendEntry label="depends on">
          <svg width="24" height="2" aria-hidden="true">
            <rect width="24" height="1.25" y="0.375" fill="var(--map-edge-planned)" />
          </svg>
        </LegendEntry>
        <LegendEntry label="blocked">
          <span className="size-3.5 rounded-sm border border-dashed border-status-rejected-meta bg-map-unmapped" />
        </LegendEntry>
        <LegendEntry label="ready">
          <span className="size-3.5 rounded-sm border border-status-planned-border bg-status-planned" />
        </LegendEntry>
        {waves.hasCycle && (
          <span
            data-testid="map-tasks-cycle-note"
            className="font-mono text-xs text-status-rejected-foreground"
          >
            a dependency cycle shares one wave — see the parse issues
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          edges come from the task files · nothing here is hand-drawn
        </span>
      </div>
    </>
  );
}

function SummaryCell({
  testId,
  label,
  value,
  valueInk = "text-foreground",
  className,
}: {
  testId: string;
  label: string;
  value: string;
  valueInk?: string;
  className: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 px-6 py-3.25", className)}>
      <span className="font-mono text-map-id tracking-overline text-muted-foreground uppercase">
        {label}
      </span>
      <span data-testid={testId} className={cn("truncate text-base", valueInk)}>
        {value}
      </span>
    </div>
  );
}

function LegendEntry({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-sm text-secondary-foreground">
      {children}
      {label}
    </span>
  );
}

/**
 * One 240×58 task card at its wave slot — a real `<button>` carrying
 * `data-card-trigger` (the T-005 primitive's re-target exemption, so
 * pressing another card switches the panel instead of closing it) and
 * opening the SAME detail panel the board opens, exactly as the design's
 * caption promises.
 */
function TaskWaveCard({
  card,
  x,
  y,
  tabbable,
  buttonRef,
  onOpen,
  onFocus,
  onKeyDown,
}: {
  card: WaveCard;
  x: number;
  y: number;
  tabbable: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onOpen: () => void;
  onFocus: (id: string | null) => void;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
}) {
  const visual = taskCardVisual(card);
  const word =
    card.schedule === "underway"
      ? card.status === "done"
        ? undefined
        : card.status === "rejected" && card.rejectedCount > 0
          ? `rejected ×${card.rejectedCount}`
          : card.status
      : scheduleWord(card);

  return (
    <button
      type="button"
      ref={buttonRef}
      data-card-trigger
      data-testid="map-tasks-card"
      data-task-id={card.id}
      data-status={card.status}
      data-schedule={card.schedule}
      data-critical={card.onCriticalPath || undefined}
      data-worst-blocker={card.worstBlocker || undefined}
      data-in-cycle={card.inCycle || undefined}
      aria-label={`${card.id} ${card.title}`}
      tabIndex={tabbable ? 0 : -1}
      onClick={onOpen}
      onFocus={() => onFocus(card.id)}
      onBlur={() => onFocus(null)}
      onKeyDown={(event) => onKeyDown(event, card.id)}
      className={cn(
        "absolute flex flex-col gap-0.75 overflow-hidden rounded-lg border px-2.75 py-2.25 text-left outline-none focus-visible:shadow-map-focus",
        visual.container,
      )}
      style={{ left: x, top: y, width: TASK_CARD_W, height: TASK_CARD_H }}
    >
      <span className="flex items-center justify-between gap-1.5">
        <span className={cn("font-mono text-xs", visual.idInk)}>{card.id}</span>
        <span className="flex shrink-0 items-center gap-1.25">
          {visual.dot !== undefined && (
            <span
              data-testid="map-tasks-dot"
              className={cn(
                "h-1.25 w-1.25 rounded-full motion-safe:animate-status-pulse",
                visual.dot,
              )}
            />
          )}
          {word !== undefined && (
            <span
              data-testid="map-tasks-word"
              className={cn(
                visual.wordMono ? "font-mono text-map-meta" : "text-xs",
                visual.wordInk,
              )}
            >
              {word}
            </span>
          )}
          {visual.mark && <TaskReviewMark review={card.review} />}
        </span>
      </span>
      <span className={cn("truncate text-map-name font-semibold tracking-title", visual.titleInk)}>
        {card.title}
      </span>
    </button>
  );
}

/**
 * ADR-016 at task scale: exactly TWO marks — solid disc + check
 * (independent OR same-model) and half disc (self-verified). A done task
 * with no `review:` stamp gets no mark, which is the honest reading of
 * an unsigned completion.
 *
 * A purpose-built 14px twin rather than an import, for the fence reason
 * T-012 already recorded for `MapProvenanceMark`: the board's
 * ReviewBadge lives in C-08's `board/badges/`, and C-12 declares only
 * C-05 + C-09 as its shared-primitive imports — importing it would ship
 * a born-drifted C-12→C-08 edge. It rides the same `--review-*` tokens,
 * so the marks are value-identical across board, map and lens.
 */
function TaskReviewMark({ review }: { review?: ReviewMode }) {
  if (review === undefined) return null;
  const checked = review !== "self-verified";
  const label =
    review === "independent"
      ? "checked — independent, different model"
      : review === "same-model"
        ? "checked — same model, fresh session"
        : "self-verified — builder signed off on itself";
  return (
    <span
      data-testid="map-tasks-review"
      data-mark={checked ? "checked" : "self"}
      data-review={review}
      title={label}
      aria-label={label}
      className="inline-flex shrink-0"
    >
      {checked ? (
        <svg viewBox="0 0 15 15" width={14} height={14} aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="7.5" fill="var(--review-disc)" />
          <path
            d="M4.4 7.8 6.5 9.9 10.6 5.4"
            fill="none"
            stroke="var(--review-mark)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 15 15" width={14} height={14} aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.75" fill="none" stroke="var(--review-disc)" strokeWidth="1.5" />
          <path d="M7.5 0.75 A6.75 6.75 0 0 0 7.5 14.25 Z" fill="var(--review-disc)" />
        </svg>
      )}
    </span>
  );
}

/** Two arrowheads: the ordinary dependency edge and the critical path
 * (the mock's `nputerArrow` / `nputerArrowHot` pair, at its 7px size). */
function TaskEdgeMarkers() {
  const heads: { id: string; fill: string }[] = [
    { id: "plain", fill: "var(--map-edge)" },
    { id: "critical", fill: "var(--status-rejected-meta)" },
  ];
  return (
    <defs>
      {heads.map((head) => (
        <marker
          key={head.id}
          id={`task-arrow-${head.id}`}
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={7}
          markerHeight={7}
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 z" fill={head.fill} />
        </marker>
      ))}
    </defs>
  );
}
