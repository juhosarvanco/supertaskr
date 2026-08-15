import { cn } from "@/lib/utils";
import type { TaskSize } from "@nputer/parser/pure";

/** Size tier chip (S | M | L) on the card face (T-004; T-006 look —
 * mono 11px, 6px chip radius, border one step darker than the card's.
 * Ink inherits the card's status fg; the border class comes from the
 * card via className so the chip stays context-free). */
export function SizeBadge({ size, className }: { size: TaskSize; className?: string }) {
  return (
    <span
      data-testid="size-badge"
      title={`size ${size}`}
      className={cn("rounded-chip border px-1.5 font-mono text-xs", className)}
    >
      {size}
    </span>
  );
}
