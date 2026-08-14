import type { BoardCard } from "@/lib/board-model";

/** Suggested task rendered as a dashed ghost at the column bottom
 * (T-004). Suggestions are minimal files: id renders when present. */
export function GhostCard({ card }: { card: BoardCard }) {
  return (
    <li
      data-testid="ghost-card"
      data-task-id={card.id ?? ""}
      className="rounded-md border border-dashed border-muted-foreground/50 px-3 py-2 text-muted-foreground"
    >
      <div className="flex items-baseline gap-2">
        {card.id !== undefined && (
          <span className="shrink-0 font-mono text-xs opacity-80">{card.id}</span>
        )}
        <span className="min-w-0 text-sm">{card.title}</span>
      </div>
    </li>
  );
}
