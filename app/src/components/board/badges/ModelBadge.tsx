import type { ModelBadgeInfo } from "@/lib/board-model";

/** Model badge (T-004): short model name (builder pre-done, built_by
 * after — derived in board-model), full raw value on hover. */
export function ModelBadge({ model }: { model: ModelBadgeInfo }) {
  return (
    <span
      data-testid="model-badge"
      title={model.full}
      className="rounded-sm border border-current/30 px-1 font-mono text-xs opacity-80"
    >
      {model.short}
    </span>
  );
}
