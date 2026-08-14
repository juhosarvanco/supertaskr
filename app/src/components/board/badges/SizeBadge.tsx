import type { TaskSize } from "@nputer/parser/pure";

/** Size tier chip (S | M | L) on the card face (T-004). */
export function SizeBadge({ size }: { size: TaskSize }) {
  return (
    <span
      data-testid="size-badge"
      title={`size ${size}`}
      className="rounded-sm border border-current/30 px-1 font-mono text-xs opacity-80"
    >
      {size}
    </span>
  );
}
