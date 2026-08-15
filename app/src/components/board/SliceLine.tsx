/** Milestone slice line (T-004): rendered per column at the boundary
 * between milestone-1 cards and everything later; above ships first.
 * Labeled once, in the leftmost column. T-006 look: label leads, then a
 * --hairline rule fills the row. */
export function SliceLine({ labeled }: { labeled: boolean }) {
  return (
    <li role="separator" data-testid="slice-line" className="flex items-center gap-3 py-1.5">
      {labeled && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          milestone 1 ships above
        </span>
      )}
      <span className="h-px flex-1 bg-hairline" />
    </li>
  );
}
