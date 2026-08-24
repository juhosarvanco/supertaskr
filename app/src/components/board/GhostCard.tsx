import type { BoardCard } from "@/lib/board-model";
import { cardRef, type TaskRef } from "@/lib/task-detail";

/** Suggested task rendered as a dashed ghost at the column bottom
 * (T-004). T-006 look (card-states "render modes"): dashed --ghost-border
 * edge, no fill ever, title plus one line of provenance in the uppercase
 * tag style. Suggestions are minimal files: id and suggested_by render
 * when present. T-005: clicking opens the detail panel's minimal
 * suggestion variant (id-less ghosts open by file ref). T-017
 * (T-004-s1): the title span breaks pathological unbroken runs instead
 * of bleeding across columns — same containment as TaskCard. T-031
 * (T-017-s1): the provenance line is the OTHER file-derived text on this
 * face — `suggested_by` is free-form attribution the parser only checks
 * for non-emptiness — so it wears the same treatment rather than a
 * second policy. */
export function GhostCard({ card, onOpen }: { card: BoardCard; onOpen: (ref: TaskRef) => void }) {
  return (
    <li
      data-testid="ghost-card"
      data-task-id={card.id ?? ""}
      className="rounded-lg border border-dashed border-ghost-border"
    >
      <button
        type="button"
        data-card-trigger
        onClick={() => onOpen(cardRef(card))}
        className="flex w-full flex-col gap-1.25 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline gap-2">
          {card.id !== undefined && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{card.id}</span>
          )}
          <span className="min-w-0 text-sm break-words text-status-planned-foreground">
            {card.title}
          </span>
        </span>
        <span
          data-testid="ghost-provenance"
          className="min-w-0 font-mono text-xs tracking-tag break-words text-muted-foreground uppercase"
        >
          {card.suggestedBy === undefined ? "suggested" : `suggested · ${card.suggestedBy}`}
        </span>
      </button>
    </li>
  );
}
