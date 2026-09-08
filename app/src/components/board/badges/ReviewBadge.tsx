import type { ReviewMode } from "@supertaskr/parser/pure";

/**
 * Verification badge — TWO marks per ADR-016 (supersedes T-004's
 * three-mark rendering):
 *
 * - solid disc + check  = someone other than the builder's session
 *                         checked the work (independent OR same-model)
 * - half disc           = self-verified (the builder signed off on itself)
 *
 * The independent-vs-same-model distinction stays first-class DATA and
 * is always visible in TEXT (hover label here, provenance row in the
 * detail panel) — never in the mark. The invariant that survives: a
 * self-check never looks identical to another session's check.
 *
 * Colors are the sheet's provenance semantic (--review-disc /
 * --review-mark), not a reuse of the status palette.
 */
export function ReviewBadge({ mode, size = 15 }: { mode: ReviewMode; size?: number }) {
  const checked = mode !== "self-verified";
  const label =
    mode === "independent"
      ? "checked: independent — different model"
      : mode === "same-model"
        ? "checked: same-model — fresh session"
        : "self-verified — the builder signed off on itself";
  return (
    <span
      data-testid="review-badge"
      data-review={mode}
      data-mark={checked ? "checked" : "self"}
      title={label}
      aria-label={label}
      className="inline-flex shrink-0"
    >
      {checked ? (
        <svg viewBox="0 0 15 15" width={size} height={size} aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="7.5" fill="var(--review-disc)" />
          <path
            d="M4.4 7.8 6.5 9.9 10.6 5.4"
            fill="none"
            stroke="var(--review-mark)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 15 15" width={size} height={size} aria-hidden="true">
          <circle
            cx="7.5"
            cy="7.5"
            r="6.75"
            fill="none"
            stroke="var(--review-disc)"
            strokeWidth="1.5"
          />
          <path d="M7.5 0.75 A6.75 6.75 0 0 0 7.5 14.25 Z" fill="var(--review-disc)" />
        </svg>
      )}
    </span>
  );
}
