/** Parked tasks collapsed into one static "N parked" row per feature
 * (T-004). T-006 look (card-states "render modes"): a quiet filled row —
 * paper fill, accent hairline, chevron affordance — never a card.
 * Expansion is T-005 territory. */
export function ParkedRow({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      data-testid="parked-row"
      className="flex items-center justify-between rounded-lg border border-accent bg-status-planned px-3 py-2.25 font-mono text-xs text-status-planned-foreground"
    >
      <span>{count} parked</span>
      <span aria-hidden="true" className="text-muted-foreground">
        ›
      </span>
    </div>
  );
}
