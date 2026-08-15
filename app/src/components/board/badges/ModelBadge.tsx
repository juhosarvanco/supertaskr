import { cn } from "@/lib/utils";
import type { ModelBadgeInfo } from "@/lib/board-model";

/** Model badge (T-004): short model name (builder pre-done, built_by
 * after — derived in board-model), full raw value on hover. T-006 look:
 * mono 11px chip like the size tier; border class supplied by the card. */
export function ModelBadge({ model, className }: { model: ModelBadgeInfo; className?: string }) {
  return (
    <span
      data-testid="model-badge"
      title={model.full}
      className={cn("rounded-chip border px-1.5 font-mono text-xs", className)}
    >
      {model.short}
    </span>
  );
}
