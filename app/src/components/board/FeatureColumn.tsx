import type { BoardColumn } from "@/lib/board-model";
import { UNMAPPED_KEY } from "@/lib/board-model";
import { TaskCard } from "./TaskCard";
import { GhostCard } from "./GhostCard";
import { ParkedRow } from "./ParkedRow";
import { SliceLine } from "./SliceLine";

/**
 * One board column (T-004): dark header (F-ID + name), real cards in
 * display order with the milestone slice line at the block boundary,
 * ghosts below all real cards, parked collapsed at the very bottom.
 */
export function FeatureColumn({
  column,
  labelSlice,
}: {
  column: BoardColumn;
  labelSlice: boolean;
}) {
  const above = column.cards.slice(0, column.sliceIndex);
  const below = column.cards.slice(column.sliceIndex);
  return (
    <section
      data-testid="feature-column"
      data-feature-id={column.featureId ?? UNMAPPED_KEY}
      aria-label={column.name}
      className="flex w-72 shrink-0 flex-col gap-2"
    >
      <header
        title={column.description === "" ? undefined : column.description}
        className="flex items-baseline gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground"
      >
        {column.featureId !== undefined && (
          <span className="shrink-0 font-mono text-xs opacity-80">{column.featureId}</span>
        )}
        <span className="truncate text-sm font-semibold">{column.name}</span>
      </header>
      <ul className="flex flex-col gap-2">
        {above.map((card) => (
          <TaskCard key={card.key} card={card} />
        ))}
        <SliceLine labeled={labelSlice} />
        {below.map((card) => (
          <TaskCard key={card.key} card={card} />
        ))}
        {column.ghosts.map((card) => (
          <GhostCard key={card.key} card={card} />
        ))}
      </ul>
      <ParkedRow count={column.parkedCount} />
    </section>
  );
}
