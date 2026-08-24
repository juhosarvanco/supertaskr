import { cn } from "@/lib/utils";
import type { ModelBadgeInfo } from "@/lib/board-model";

/** Model badge (T-004): short model name (builder pre-done, built_by
 * after — derived in board-model), full raw value on hover. T-006 look:
 * mono 11px chip like the size tier; border class supplied by the card.
 *
 * T-031 (T-024-s6): the chip is BOUNDED — `min-w-0 max-w-24 truncate` —
 * and this is defense in depth BEHIND T-030's parser fix, not instead of
 * it. `parseModelSession` now takes the LAST whitespace-delimited token
 * of a stamp's model half, so an honest compound stamp
 * (`claude-fable-5 @fresh (WIP…) + claude-opus-5 @fresh ×2`) already
 * yields a clean short name; that is the load-bearing half. What is left
 * is everything the split is mechanical about — the `+` wart T-030-s1
 * pins, a stamp with no `@` at all, a single token that is simply long —
 * and this chip had NO bound of any kind, so any of them widened the
 * card. All three parts are load-bearing together: `truncate` alone
 * cannot shrink a flex item whose `min-width: auto` is its content, and
 * `max-w-24` alone loses to that same automatic minimum (min beats max
 * in the cascade).
 *
 * CLIPPING HERE IS NOT THE BOARD HIDING TRUTH, which is the T-017
 * question this has to answer. A title is the card's SUBJECT and wraps;
 * a badge is a chip, and the design already clips chips. Nothing is
 * lost: the full raw stamp rides `title=` on hover, and the detail
 * panel's provenance row prints `builtBy.raw` verbatim — the one surface
 * a compound stamp is actually good on. */
export function ModelBadge({ model, className }: { model: ModelBadgeInfo; className?: string }) {
  return (
    <span
      data-testid="model-badge"
      title={model.full}
      className={cn("min-w-0 max-w-24 truncate rounded-chip border px-1.5 font-mono text-xs", className)}
    >
      {model.short}
    </span>
  );
}
