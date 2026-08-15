import { useState } from "react";
import type { BoardCard } from "@/lib/board-model";
import { cardRef, type TaskRef } from "@/lib/task-detail";

/** Parked tasks collapsed into one "N parked" row per feature (T-004).
 * T-006 look (card-states "render modes"): a quiet filled row — paper
 * fill, accent hairline, chevron affordance — never a card.
 *
 * T-017 (T-005-s1): the row expands in place — nothing above it moves,
 * per the design sheet — into ghost-like entries (id + title) that open
 * the existing detail panel via cardRef, closing the one gap in the
 * board's inspectability. Expansion is ephemeral view state (a scroll
 * position, never project state). The toggle carries
 * `data-panel-exempt` (the T-005-s3 mechanism): expanding the list to
 * reach a parked task must not dismiss an open panel; the entries
 * themselves are `data-card-trigger`s exactly like cards, so clicking
 * one switches the panel instead of racing it shut. Entry titles get
 * the same `break-words` containment as card faces (T-004-s1). */
export function ParkedRow({
  parked,
  onOpen,
}: {
  parked: BoardCard[];
  onOpen: (ref: TaskRef) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (parked.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        data-testid="parked-row"
        data-panel-exempt
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between rounded-lg border border-accent bg-status-planned px-3 py-2.25 text-left font-mono text-xs text-status-planned-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span>{parked.length} parked</span>
        <span aria-hidden="true" className="text-muted-foreground">
          {expanded ? "⌄" : "›"}
        </span>
      </button>
      {expanded && (
        <ul data-testid="parked-list" className="flex flex-col gap-2">
          {parked.map((card) => (
            <li key={card.key}>
              <button
                type="button"
                data-testid="parked-task"
                data-task-id={card.id ?? ""}
                data-card-trigger
                onClick={() => onOpen(cardRef(card))}
                className="flex w-full items-baseline gap-2 rounded-lg border border-dashed border-ghost-border px-3 py-2.25 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {card.id !== undefined && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {card.id}
                  </span>
                )}
                <span className="min-w-0 text-sm break-words text-status-planned-foreground">
                  {card.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
