import { cn } from "@/lib/utils";
import type { BoardCard, StatusToken } from "@/lib/board-model";
import { cardRef, type TaskRef } from "@/lib/task-detail";
import { SizeBadge } from "./badges/SizeBadge";
import { ModelBadge } from "./badges/ModelBadge";
import { ReviewBadge } from "./badges/ReviewBadge";

/* Status → token-backed utility classes. Keyed by our own StatusToken
 * union (project-authored, parser-validated) — not file-derived strings,
 * so ADR-009 does not apply to these literals. Shared with the detail
 * panel's status/blocker chips (T-005).
 *
 * T-006 card anatomy (card-states tab): fill + border from the status
 * pair, ink = status fg, title one step darker (-title), chip outlines
 * and the hover border one step darker than the border (-border-strong),
 * pressed fill one step down (the border value) with the shadow off. */
export const STATUS_CLASSES: Record<StatusToken, string> = {
  planned: "bg-status-planned text-status-planned-foreground border-status-planned-border",
  building: "bg-status-building text-status-building-foreground border-status-building-border",
  verifying: "bg-status-verifying text-status-verifying-foreground border-status-verifying-border",
  rejected: "bg-status-rejected text-status-rejected-foreground border-status-rejected-border",
  done: "bg-status-done text-status-done-foreground border-status-done-border",
  merging: "bg-status-merging text-status-merging-foreground border-status-merging-border",
};

const TITLE_CLASSES: Record<StatusToken, string> = {
  planned: "text-status-planned-title",
  building: "text-status-building-title",
  verifying: "text-status-verifying-title",
  rejected: "text-status-rejected-title",
  done: "text-status-done-title",
  merging: "text-status-merging-title",
};

/** Chip outline, one step darker than the card border. Exported for the
 * detail panel's blocker chips. */
export const CHIP_BORDER_CLASSES: Record<StatusToken, string> = {
  planned: "border-status-planned-border-strong",
  building: "border-status-building-border-strong",
  verifying: "border-status-verifying-border-strong",
  rejected: "border-status-rejected-border-strong",
  done: "border-status-done-border-strong",
  merging: "border-status-merging-border-strong",
};

const HOVER_CLASSES: Record<StatusToken, string> = {
  planned: "hover:border-status-planned-border-strong active:bg-status-planned-border",
  building: "hover:border-status-building-border-strong active:bg-status-building-border",
  verifying: "hover:border-status-verifying-border-strong active:bg-status-verifying-border",
  rejected: "hover:border-status-rejected-border-strong active:bg-status-rejected-border",
  done: "hover:border-status-done-border-strong active:bg-status-done-border",
  merging: "hover:border-status-merging-border-strong active:bg-status-merging-border",
};

/** The live status word on the card face: shown for in-flight statuses
 * only (planned is silent paper, done carries the review badge). */
const STATUS_WORD: Partial<Record<StatusToken, true>> = {
  building: true,
  verifying: true,
  rejected: true,
  merging: true,
};

/** Pulse dot color per pulsing status (chart ramp per the mockups —
 * both schemes measured to --chart-4 / --chart-2 exactly). */
const DOT_CLASSES: Partial<Record<StatusToken, string>> = {
  verifying: "bg-chart-4",
  merging: "bg-chart-2",
};

/**
 * One task card (T-004; T-006 design language): colored by status; the
 * verifying/merging pulse lives on a 5px dot next to the status word
 * (motion-safe — reduced-motion users get the static color), face shows
 * id · title · size chip · model badge · review badge (done only,
 * right). Hover lifts 1px, darkens the border one step and reveals the
 * grip dots; pressed drops the fill one step and the shadow; focus is
 * the 2px ring, keyboard only. All values resolve to tokens.css.
 *
 * `belowSlice` renders planned future-milestone cards as the muted mini
 * variant from the board mockup; a live status below the slice keeps the
 * status fill (status is a fill — it always wins).
 *
 * `dense` is the density rule: past 40 cards the meta row drops the
 * model badge first (id and title never shrink).
 *
 * T-005: the face is a real button — click (or Enter/Space) opens the
 * detail panel; `data-card-trigger` exempts it from the panel's
 * outside-click close so clicking another card switches instead.
 */
export function TaskCard({
  card,
  onOpen,
  belowSlice = false,
  dense = false,
}: {
  card: BoardCard;
  onOpen: (ref: TaskRef) => void;
  belowSlice?: boolean;
  dense?: boolean;
}) {
  const token = card.visual.token;
  if (belowSlice && token === "planned") {
    const meta = [
      card.milestone !== undefined ? `milestone ${card.milestone}` : undefined,
      card.size,
    ].filter((part) => part !== undefined);
    return (
      <li
        data-testid="task-card"
        data-task-id={card.id ?? ""}
        data-status={card.status}
        data-below-slice="true"
        className="rounded-lg border border-accent bg-sidebar"
      >
        <button
          type="button"
          data-card-trigger
          onClick={() => onOpen(cardRef(card))}
          className="flex w-full flex-col gap-1.5 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-baseline gap-2">
            {card.id !== undefined && (
              <span className="shrink-0 font-mono text-sm text-muted-foreground">{card.id}</span>
            )}
            <span className="min-w-0 text-sm text-status-planned-foreground">{card.title}</span>
          </span>
          {meta.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground">{meta.join(" · ")}</span>
          )}
        </button>
      </li>
    );
  }

  const showWord = STATUS_WORD[token] === true;
  const dot = card.visual.pulse ? DOT_CLASSES[token] : undefined;
  const hasMeta =
    card.size !== undefined || card.model !== undefined || card.review !== undefined || showWord;
  return (
    <li
      data-testid="task-card"
      data-task-id={card.id ?? ""}
      data-status={card.status}
      data-pulse={card.visual.pulse ? "true" : undefined}
      className={cn(
        "group relative rounded-lg border shadow-card hover:-translate-y-px hover:shadow-card-hover active:translate-y-0 active:shadow-none",
        STATUS_CLASSES[token],
        HOVER_CLASSES[token],
      )}
    >
      {/* grip dots — the hover affordance from the card spec */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1.25 flex -translate-y-1/2 flex-col gap-0.75 opacity-0 group-hover:opacity-100"
      >
        <span className="h-0.75 w-0.75 rounded-full bg-muted-foreground" />
        <span className="h-0.75 w-0.75 rounded-full bg-muted-foreground" />
        <span className="h-0.75 w-0.75 rounded-full bg-muted-foreground" />
      </span>
      <button
        type="button"
        data-card-trigger
        onClick={() => onOpen(cardRef(card))}
        className="flex w-full flex-col gap-2.25 rounded-lg px-3 py-2.75 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline gap-2">
          {card.id !== undefined && (
            <span className="shrink-0 font-mono text-sm">{card.id}</span>
          )}
          <span
            className={cn(
              "min-w-0 text-base font-semibold tracking-title",
              TITLE_CLASSES[token],
            )}
          >
            {card.title}
          </span>
        </span>
        {hasMeta && (
          <span className="flex w-full items-center gap-1.5">
            {card.size !== undefined && (
              <SizeBadge size={card.size} className={CHIP_BORDER_CLASSES[token]} />
            )}
            {card.model !== undefined && !dense && (
              <ModelBadge model={card.model} className={CHIP_BORDER_CLASSES[token]} />
            )}
            {showWord && (
              <span className="flex items-center gap-1.25 text-xs">
                {dot !== undefined && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.25 w-1.25 rounded-full motion-safe:animate-status-pulse",
                      dot,
                    )}
                  />
                )}
                {card.status}
              </span>
            )}
            {card.review !== undefined && (
              <span className="ml-auto inline-flex">
                <ReviewBadge mode={card.review} />
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  );
}
