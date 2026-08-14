import type { ReviewMode } from "@nputer/parser/pure";

/**
 * Verification badge (T-004): which guarantee actually held, per
 * docs/design/dashboard.md — a check from the author's own session must
 * never look identical to independent eyes. Three visually DISTINCT
 * circled-check marks whose fill level tracks independence:
 *
 * - independent:   fully filled disc, check knocked out of it
 * - same-model:    half-filled disc (left solid, right ring), check on top
 * - self-verified: outline ring + stroked check, warning (amber) tint
 *
 * The knockout/halo strokes reference --status-done-bg directly: the
 * badge renders only on done cards, whose surface IS that token. The
 * self-verified warning tint reuses the amber --status-building-fg pair
 * via its utility (the plan adds no separate warning token).
 */
export function ReviewBadge({ mode }: { mode: ReviewMode }) {
  const label =
    mode === "independent"
      ? "verified: independent"
      : mode === "same-model"
        ? "verified: same-model review"
        : "self-verified";
  return (
    <span
      data-testid="review-badge"
      data-review={mode}
      title={label}
      aria-label={label}
      className={
        mode === "self-verified"
          ? "inline-flex text-status-building-foreground"
          : "inline-flex text-status-done-foreground"
      }
    >
      {mode === "independent" && (
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="6" fill="currentColor" />
          <path
            d="M4.2 7.3 6.2 9.3 9.8 5.2"
            fill="none"
            stroke="var(--status-done-bg)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {mode === "same-model" && (
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 1 A6 6 0 0 0 7 13 Z" fill="currentColor" />
          <path
            d="M4.2 7.3 6.2 9.3 9.8 5.2"
            fill="none"
            stroke="var(--status-done-bg)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.2 7.3 6.2 9.3 9.8 5.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {mode === "self-verified" && (
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M4.2 7.3 6.2 9.3 9.8 5.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
