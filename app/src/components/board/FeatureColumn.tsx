import type { BoardColumn } from "@/lib/board-model";
import { UNMAPPED_KEY } from "@/lib/board-model";
import type { TaskRef } from "@/lib/task-detail";
import { TaskCard } from "./TaskCard";
import { GhostCard } from "./GhostCard";
import { ParkedRow } from "./ParkedRow";
import { SliceLine } from "./SliceLine";

/**
 * One board column (T-004): feature header (F-ID + name), real cards in
 * display order with the milestone slice line at the block boundary,
 * ghosts below all real cards, parked collapsed at the very bottom.
 *
 * T-006 look: the header is the inverted --column-header pill (ink on
 * white, bone on black) over a --hairline rule; columns share width
 * equally and floor at 320px, below which the board scrolls sideways
 * (density rule). `dense` forwards the >40-cards meta-row rule to cards.
 *
 * T-005: cards forward clicks up as detail-panel opens. T-017: the
 * parked row expands into entries that open the panel the same way.
 *
 * T-097: when the backbone spells one numeric slot twice (`F-1` beside
 * `F-01`) the header carries an `= <other spelling>` marker after the
 * name. The board does NOT merge those columns — see the ruling at
 * `selectBoard`'s routing site — so this marker is the only thing that
 * tells a reader the two plausible-looking columns are one slot and
 * that its tasks are split across them by exact string. It reuses the
 * id chip's own classes deliberately: this is identity metadata, and
 * adding no new utility keeps the compiled stylesheet unmoved.
 */
export function FeatureColumn({
  column,
  labelSlice,
  dense,
  onOpen,
}: {
  column: BoardColumn;
  labelSlice: boolean;
  dense: boolean;
  onOpen: (ref: TaskRef) => void;
}) {
  const above = column.cards.slice(0, column.sliceIndex);
  const below = column.cards.slice(column.sliceIndex);
  return (
    <section
      data-testid="feature-column"
      data-feature-id={column.featureId ?? UNMAPPED_KEY}
      aria-label={column.name}
      className="flex min-w-80 flex-1 shrink-0 flex-col gap-2"
    >
      <header
        title={column.description === "" ? undefined : column.description}
        className="flex items-baseline gap-2.25 rounded-lg bg-column-header px-3.25 py-2.75"
      >
        {column.featureId !== undefined && (
          <span className="shrink-0 font-mono text-xs text-column-header-id">
            {column.featureId}
          </span>
        )}
        <span className="truncate text-base font-semibold tracking-title text-column-header-foreground">
          {column.name}
        </span>
        {column.aliasedWith !== undefined && (
          <span
            data-testid="column-alias"
            data-aliased-with={column.aliasedWith.join(" ")}
            title={`one backbone slot spelled twice: ${[column.featureId, ...column.aliasedWith].join(", ")} — the board keeps a column per spelling and each task lands in the column matching its exact feature: string, so this slot's tasks are SPLIT across them`}
            className="shrink-0 font-mono text-xs text-column-header-id"
          >
            = {column.aliasedWith.join(" = ")}
          </span>
        )}
      </header>
      <div aria-hidden="true" className="mt-0.5 mb-1 h-px bg-hairline" />
      <ul className="flex flex-col gap-2">
        {above.map((card) => (
          <TaskCard key={card.key} card={card} onOpen={onOpen} dense={dense} />
        ))}
        <SliceLine labeled={labelSlice} />
        {below.map((card) => (
          <TaskCard key={card.key} card={card} onOpen={onOpen} dense={dense} belowSlice />
        ))}
        {column.ghosts.map((card) => (
          <GhostCard key={card.key} card={card} onOpen={onOpen} />
        ))}
      </ul>
      <ParkedRow parked={column.parked} onOpen={onOpen} />
    </section>
  );
}
