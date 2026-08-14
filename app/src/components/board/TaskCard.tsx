import { cn } from "@/lib/utils";
import type { BoardCard, StatusToken } from "@/lib/board-model";
import { SizeBadge } from "./badges/SizeBadge";
import { ModelBadge } from "./badges/ModelBadge";
import { ReviewBadge } from "./badges/ReviewBadge";

/* Status → token-backed utility classes. Keyed by our own StatusToken
 * union (project-authored, parser-validated) — not file-derived strings,
 * so ADR-009 does not apply to this literal. */
const STATUS_CLASSES: Record<StatusToken, string> = {
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
 */
export function TaskCard({ card }: { card: BoardCard }) {
  const hasBadges =
    card.size !== undefined || card.model !== undefined || card.review !== undefined;
  return (
    <li
      data-testid="task-card"
      data-task-id={card.id ?? ""}
      data-status={card.status}
      data-pulse={card.visual.pulse ? "true" : undefined}
      className={cn(
        "flex flex-col gap-1 rounded-md border border-current/25 px-3 py-2",
        STATUS_CLASSES[card.visual.token],
        card.visual.pulse && "motion-safe:animate-status-pulse",
      )}
    >
      <div className="flex items-baseline gap-2">
        {card.id !== undefined && (
          <span className="shrink-0 font-mono text-xs opacity-75">{card.id}</span>
        )}
        <span className="min-w-0 text-sm font-medium">{card.title}</span>
      </div>
      {hasBadges && (
        <div className="flex items-center gap-1.5">
          {card.size !== undefined && <SizeBadge size={card.size} />}
          {card.model !== undefined && <ModelBadge model={card.model} />}
          {card.review !== undefined && (
            <span className="ml-auto inline-flex">
              <ReviewBadge mode={card.review} />
            </span>
          )}
        </div>
      )}
    </li>
  );
}
