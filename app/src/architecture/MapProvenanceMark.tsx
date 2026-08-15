import type { DerivedProvenance } from "@/lib/architecture/derive";
import { independentLine, provenanceLabel } from "./map-visuals";
import type { DerivedComponent } from "@/lib/architecture/derive";

/**
 * Provenance mark at map scale (T-012, ADR-016): exactly two marks —
 * solid disc + check (independent OR same-model) and half disc (self) —
 * plus the provenance overlay's hairline dashed ring for unverified
 * work. The three-way distinction lives in TEXT (the hover label).
 *
 * A purpose-built 12/14px twin of the board's ReviewBadge rather than
 * an import: badges/ live in C-08 (board pane), and the §2 registry
 * amendment deliberately declares only C-05 + C-09 as the map's
 * shared-primitive imports — importing the badge would ship a
 * born-drifted C-12→C-08 edge (T-004 purpose-built precedent, ~30
 * lines). Colors ride the same --review-* provenance tokens, so the
 * marks are value-identical to the bundle's --provenance-* set.
 */
export function MapProvenanceMark({
  component,
  size,
  unverified = false,
}: {
  component: DerivedComponent;
  size: 12 | 14;
  unverified?: boolean;
}) {
  const provenance: DerivedProvenance | undefined = component.provenance;
  const overlayLine = independentLine(component);
  if (unverified || provenance === undefined || provenance === "unreviewed") {
    if (!unverified) return null; // base view: no done review → no mark
    const label = [provenanceLabel("unreviewed"), overlayLine]
      .filter(Boolean)
      .join(" · ");
    return (
      <span
        data-testid="map-provenance"
        data-mark="unverified"
        title={label}
        aria-label={label}
        className="inline-flex shrink-0"
      >
        <svg viewBox="0 0 15 15" width={size} height={size} aria-hidden="true">
          <circle
            cx="7.5"
            cy="7.5"
            r="6.75"
            fill="none"
            stroke="var(--provenance-unverified)"
            strokeWidth="1.5"
            strokeDasharray="2.4 2.4"
          />
        </svg>
      </span>
    );
  }

  const checked = provenance !== "self-verified";
  const label = [provenanceLabel(provenance), overlayLine].filter(Boolean).join(" · ");
  return (
    <span
      data-testid="map-provenance"
      data-mark={checked ? "checked" : "self"}
      data-review={provenance}
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
