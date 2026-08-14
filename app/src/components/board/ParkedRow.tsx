/** Parked tasks collapsed into one static "N parked" row per feature
 * (T-004). Expansion is T-005 territory. */
export function ParkedRow({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      data-testid="parked-row"
      className="rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground"
    >
      {count} parked
    </div>
  );
}
