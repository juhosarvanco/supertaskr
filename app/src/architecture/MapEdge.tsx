import type { DerivedEdge } from "@/lib/architecture/derive";
import type { LayoutEdge } from "./map-layout";
import { edgeVisual, type EdgeUiState } from "./map-visuals";

export const edgeKey = (edge: Pick<DerivedEdge, "from" | "to">): string =>
  `${edge.from}->${edge.to}`;

/**
 * One edge (T-012): the visible stroke plus an invisible 10px hit path
 * (`pointer-events: stroke`) so hover works without fattening the ink.
 * The visible layer never takes pointer events; relation → stroke
 * styling comes from the map-visuals table. Colors are CSS var
 * references (the ReviewBadge precedent — attribute var() is
 * tokens-only compliant).
 */
export function MapEdge({
  edge,
  layout,
  ui,
  onHover,
}: {
  edge: DerivedEdge;
  layout: LayoutEdge;
  ui: EdgeUiState;
  onHover: (key: string | null) => void;
}) {
  const visual = edgeVisual(edge.relation, edge.observedCount, ui);
  const key = edgeKey(edge);
  return (
    <g data-testid="map-edge" data-edge={key} data-relation={edge.relation}>
      <path
        d={layout.path}
        fill="none"
        stroke={visual.stroke}
        strokeWidth={visual.strokeWidth}
        {...(visual.dashArray !== undefined ? { strokeDasharray: visual.dashArray } : {})}
        {...(visual.linecap !== undefined ? { strokeLinecap: visual.linecap } : {})}
        markerEnd={`url(#map-arrow-${visual.marker})`}
      />
      <path
        data-testid="map-edge-hit"
        d={layout.path}
        fill="none"
        stroke="transparent"
        strokeWidth={10}
        pointerEvents="stroke"
        onPointerEnter={() => onHover(key)}
        onPointerLeave={() => onHover(null)}
      />
    </g>
  );
}

/** The five arrowhead definitions (measured 6.5px heads; planned is 6). */
export function MapEdgeMarkers() {
  const heads: { id: string; fill: string; width: number }[] = [
    { id: "confirmed", fill: "var(--map-arrowhead)", width: 6.5 },
    { id: "planned", fill: "var(--map-arrowhead-planned)", width: 6 },
    { id: "drift", fill: "var(--warning)", width: 6.5 },
    { id: "hover", fill: "var(--map-edge-hover)", width: 6.5 },
    { id: "muted", fill: "var(--map-edge-muted)", width: 6.5 },
  ];
  return (
    <defs>
      {heads.map((head) => (
        <marker
          key={head.id}
          id={`map-arrow-${head.id}`}
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={head.width}
          markerHeight={head.width}
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 z" fill={head.fill} />
        </marker>
      ))}
    </defs>
  );
}
