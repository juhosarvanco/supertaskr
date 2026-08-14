import type { BoardCard } from "@/lib/board-model";
import { cardRef, type TaskRef } from "@/lib/task-detail";

/** Suggested task rendered as a dashed ghost at the column bottom
 * (T-004). Suggestions are minimal files: id renders when present.
 * T-005: clicking opens the detail panel's minimal suggestion variant
 * (id-less ghosts open by file ref). */
export function GhostCard({ card, onOpen }: { card: BoardCard; onOpen: (ref: TaskRef) => void }) {
  return (
    <li
      data-testid="ghost-card"
      data-task-id={card.id ?? ""}
      className="rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground"
    >
      <button
        type="button"
        data-card-trigger
        onClick={() => onOpen(cardRef(card))}
        className="flex w-full items-baseline gap-2 rounded-md px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {card.id !== undefined && (
          <span className="shrink-0 font-mono text-xs opacity-80">{card.id}</span>
        )}
        <span className="min-w-0 text-sm">{card.title}</span>
      </button>
    </li>
  );
}
