import { cn } from "@/lib/utils";
import type { BoardCard, StatusToken } from "@/lib/board-model";
import { cardRef, type TaskRef } from "@/lib/task-detail";
import { SizeBadge } from "./badges/SizeBadge";
import { ModelBadge } from "./badges/ModelBadge";
import { ReviewBadge } from "./badges/ReviewBadge";

/* Status → token-backed utility classes. Keyed by our own StatusToken
 * union (project-authored, parser-validated) — not file-derived strings,
 * so ADR-009 does not apply to this literal. Shared with the detail
 * panel's status/blocker chips (T-005). */
export const STATUS_CLASSES: Record<StatusToken, string> = {
  planned: "bg-status-planned text-status-planned-foreground",
  building: "bg-status-building text-status-building-foreground",
  verifying: "bg-status-verifying text-status-verifying-foreground",
  rejected: "bg-status-rejected text-status-rejected-foreground",
  done: "bg-status-done text-status-done-foreground",
  merging: "bg-status-merging text-status-merging-foreground",
};

/**
 * One task card (T-004): colored by status, pulsing while
 * verifying/merging (motion-safe — reduced-motion users get the static
 * color), face shows id · title · size chip · model badge · review badge.
 * T-005: the face is a real button — click (or Enter/Space) opens the
 * detail panel; `data-card-trigger` exempts it from the panel's
 * outside-click close so clicking another card switches instead.
 */
export function TaskCard({ card, onOpen }: { card: BoardCard; onOpen: (ref: TaskRef) => void }) {
  const hasBadges =
    card.size !== undefined || card.model !== undefined || card.review !== undefined;
  return (
    <li
      data-testid="task-card"
      data-task-id={card.id ?? ""}
      data-status={card.status}
      data-pulse={card.visual.pulse ? "true" : undefined}
      className={cn(
        "rounded-md border border-current/25",
        STATUS_CLASSES[card.visual.token],
        card.visual.pulse && "motion-safe:animate-status-pulse",
      )}
    >
      <button
        type="button"
        data-card-trigger
        onClick={() => onOpen(cardRef(card))}
        className="flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-baseline gap-2">
          {card.id !== undefined && (
            <span className="shrink-0 font-mono text-xs opacity-75">{card.id}</span>
          )}
          <span className="min-w-0 text-sm font-medium">{card.title}</span>
        </span>
        {hasBadges && (
          <span className="flex w-full items-center gap-1.5">
            {card.size !== undefined && <SizeBadge size={card.size} />}
            {card.model !== undefined && <ModelBadge model={card.model} />}
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
