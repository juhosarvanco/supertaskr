/** Milestone slice line (T-004): rendered per column at the boundary
 * between milestone-1 cards and everything later; above ships first.
 * Labeled once, in the leftmost column. */
export function SliceLine({ labeled }: { labeled: boolean }) {
  return (
    <li role="separator" data-testid="slice-line" className="flex items-center gap-2 py-1">
      <span className="flex-1 border-t-2 border-foreground/25" />
      {labeled && (
        <>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">milestone 1</span>
          <span className="w-4 border-t-2 border-foreground/25" />
        </>
      )}
    </li>
  );
}
