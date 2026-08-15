import { cn } from "@/lib/utils";
import type { DerivedComponent, DerivedStatus, DriftFinding } from "@/lib/architecture/derive";
import { NODE_H, NODE_W, type LayoutNode } from "./map-layout";
import { MapProvenanceMark } from "./MapProvenanceMark";
import {
  attributedFindings,
  hasVisibleMark,
  nodeVisual,
  type NodeUiState,
} from "./map-visuals";

/** Previous-fill classes for the teal wipe overlay (the OLD color wipes
 * out to the right, revealing the new teal from the left edge). */
const WIPE_FILL: Record<DerivedStatus, string> = {
  planned: "bg-status-planned",
  building: "bg-status-building",
  verifying: "bg-status-verifying",
  rejected: "bg-status-rejected",
  done: "bg-status-done",
  merging: "bg-status-merging",
};

/**
 * One T0 node (T-012): a real 192×66 <button> at its layout slot. The
 * face is calm — id · drift/provenance/pin slot · name · meta — and
 * every ink resolves through map-visuals' state table. `data-card-
 * trigger` is the T-005 primitive's re-target exemption: pressing
 * another node switches the panel instead of closing it.
 */
export function MapNode({
  component,
  node,
  ui,
  findings,
  wipe,
  buttonRef,
  tabbable,
  onSelect,
  onHover,
  onFocus,
  onKeyDown,
}: {
  component: DerivedComponent;
  node: LayoutNode;
  ui: NodeUiState;
  findings: readonly DriftFinding[];
  /** Set when the derived status just turned done: the previous fill +
   * a nonce keying the one-shot overlay. */
  wipe?: { from: DerivedStatus; key: number };
  buttonRef: (el: HTMLButtonElement | null) => void;
  /** Roving tabindex: exactly one node is tabbable at a time. */
  tabbable: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onFocus: (id: string | null) => void;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
}) {
  const visual = nodeVisual(component, ui);
  const attributed = attributedFindings(findings, component.id);

  // Line 1's right slot, composed order (recorded silence): drift ·
  // pulse dot + word · provenance mark · pin.
  const driftSlot =
    visual.driftDisplay === "none" ? null : component.kind === "unmapped" ? (
      <span
        data-testid="map-drift-count"
        className="font-mono text-map-meta text-warning"
      >
        {ui.overlay === "drift" ? component.files.length : (attributed[0]?.rule ?? "D2")}
      </span>
    ) : (
      <span
        data-testid="map-drift-count"
        className="font-mono text-map-meta font-bold text-warning"
      >
        {visual.driftDisplay === "chip" ? `drift ${attributed.length}` : attributed.length}
      </span>
    );

  const showMark =
    component.kind === "declared" && (hasVisibleMark(component.provenance) || visual.unverifiedRing);

  // Line 3: layer · file count · live status word (word placement per
  // visuals — pulsing statuses carry it beside the dot instead).
  const meta =
    component.kind === "unmapped"
      ? `${component.files.length} file${component.files.length === 1 ? "" : "s"} no component claims`
      : component.declaredOnly || component.kind === "placeholder"
        ? "declared · no files yet"
        : [
            component.layer,
            `${component.files.length} file${component.files.length === 1 ? "" : "s"}`,
            visual.metaStatusWord,
          ]
            .filter(Boolean)
            .join(" · ");

  return (
    <button
      type="button"
      ref={buttonRef}
      data-card-trigger
      data-testid="map-node"
      data-component-id={component.id}
      data-status={component.status}
      data-kind={component.kind}
      data-drift={component.hasDrift || undefined}
      data-pinned={component.pinned || undefined}
      aria-pressed={ui.selected}
      aria-label={`${component.id} ${component.name}`}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => onSelect(component.id)}
      onPointerEnter={() => onHover(component.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onFocus(component.id)}
      onBlur={() => onFocus(null)}
      onKeyDown={(event) => onKeyDown(event, component.id)}
      className={cn(
        "absolute overflow-hidden rounded-lg border px-2.75 py-2 text-left outline-none",
        visual.container,
        visual.ring && "map-drift-ring",
      )}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
    >
      {wipe !== undefined && (
        <span
          key={wipe.key}
          aria-hidden="true"
          data-testid="map-teal-wipe"
          className={cn(
            "pointer-events-none absolute inset-0 origin-right scale-x-0 motion-safe:animate-map-teal-wipe",
            WIPE_FILL[wipe.from],
          )}
        />
      )}
      <span className="relative flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-1.5">
          <span className={cn("font-mono text-map-id", visual.idInk)}>
            {component.kind === "unmapped" && ui.overlay !== "drift"
              ? "—"
              : component.kind === "inferred"
                ? "~"
                : component.kind === "unmapped"
                  ? (attributed[0]?.rule ?? "D2")
                  : component.id}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {driftSlot}
            {visual.dot !== undefined && (
              <span
                className={cn("flex items-center gap-1.25 font-mono text-map-meta", visual.idInk)}
              >
                <span
                  data-testid="map-status-dot"
                  className={cn(
                    "h-1.25 w-1.25 rounded-full motion-safe:animate-status-pulse",
                    visual.dot,
                  )}
                />
                {visual.dotWord}
              </span>
            )}
            {showMark && (
              <MapProvenanceMark
                component={component}
                size={visual.markSize}
                unverified={visual.unverifiedRing}
              />
            )}
            {component.pinned && (
              <span className="font-mono text-map-meta text-muted-foreground">pin</span>
            )}
          </span>
        </span>
        <span className={cn("truncate text-map-name font-semibold tracking-title", visual.titleInk)}>
          {component.name}
        </span>
        <span className={cn("truncate font-mono text-map-meta", visual.metaInk)}>{meta}</span>
      </span>
    </button>
  );
}
