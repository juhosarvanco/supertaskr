import { cn } from "@/lib/utils";
import type { DerivedComponent } from "@/lib/architecture/derive";
import { NODE_W, type LayoutNode } from "./map-layout";
import { STATUS_CHIP, type ChurnVisual } from "./map-visuals";
import {
  CONTAINER_BORDER,
  CONTAINER_HEADER_H,
  CONTAINER_PAD,
  GROUP_LABEL_H,
  GROUP_GAP,
  INTRA_EDGE_BUDGET,
  INTRA_GUTTER,
  NOTE_H,
  ROW_GAP,
  ROW_H,
  type Expansion,
} from "./map-zoom";

/**
 * T1 — a component expanded IN PLACE (T-013).
 *
 * The node becomes a container: header row (id · name · status ·
 * collapse), then its files grouped by directory. It keeps the node's
 * WIDTH and its layout slot's x, and grows DOWN — the layout stacked its
 * column around the height `expansionFor` computed, so the rows below it
 * in this column moved and nothing else did (map-layout.ts, rule T1).
 *
 * Inner file rows are LIGHTER than a T0 node on purpose (handoff §4.4:
 * "keep inner nodes visually lighter than T0 nodes so hierarchy is
 * obvious") and carry no status of their own — files inherit the
 * component's, at low emphasis.
 *
 * Every row is a `data-card-trigger` button: pressing one re-targets the
 * pane's panel to T2 (that file's symbols and resolved edges) instead of
 * dismissing the panel it is about to replace — the T-005 primitive's
 * exemption, the same one the T0 nodes use.
 *
 * The heights here are the SAME constants `expansionFor` measured with,
 * imported rather than restated, because a container that renders taller
 * than the layout reserved is a container that overlaps the row below
 * it. `the container renders at exactly the height the layout reserved`
 * in map-t1-t2-dom.test.tsx is what holds that.
 */
export function MapContainer({
  component,
  node,
  expansion,
  intra,
  churn,
  selectedFile,
  onCollapse,
  onSelectFile,
  onSelectComponent,
  containerRef,
  tabbable,
  onKeyDown,
  onFocus,
  onHover,
}: {
  component: DerivedComponent;
  node: LayoutNode;
  expansion: Expansion;
  /** File→file import edges with both ends in this component. */
  intra: readonly { from: string; to: string }[];
  churn?: ChurnVisual;
  selectedFile: string | null;
  onCollapse: (id: string) => void;
  onSelectFile: (path: string) => void;
  onSelectComponent: (id: string) => void;
  containerRef: (el: HTMLButtonElement | null) => void;
  tabbable: boolean;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const dirOf = (label: string): string => (label === "(root)" ? "" : label);

  // The intra-component edge layer. Row centres come from `expansion`
  // (computed from the same constants this file lays out with), so the
  // bows can be drawn without measuring anything — jsdom has no layout,
  // and the canvas must not depend on one either. Over the budget the
  // bows stop being a picture of anything, so the count is stated on the
  // container instead of drawn.
  const rowY = new Map(expansion.rows.map((row) => [row.path, row.y]));
  const drawable = intra.filter((edge) => rowY.has(edge.from) && rowY.has(edge.to));
  const drawn = drawable.length <= INTRA_EDGE_BUDGET ? drawable : [];
  const gutter = drawn.length > 0 ? INTRA_GUTTER : 0;

  return (
    <div
      data-testid="map-container"
      data-component-id={component.id}
      data-mode={expansion.mode}
      data-intra-total={intra.length}
      data-intra-drawn={drawn.length}
      className="absolute overflow-hidden rounded-xl border border-map-node-border bg-map-group"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: node.h,
        padding: CONTAINER_PAD,
      }}
      onPointerEnter={() => onHover(component.id)}
      onPointerLeave={() => onHover(null)}
    >
      {/* Header — also the collapse control and the node's keyboard home
          while expanded, so the roving tabindex never lands on nothing. */}
      <button
        type="button"
        ref={containerRef}
        data-card-trigger
        data-testid="map-container-header"
        tabIndex={tabbable ? 0 : -1}
        aria-expanded="true"
        aria-label={`${component.id} ${component.name}, expanded`}
        onClick={() => onSelectComponent(component.id)}
        onDoubleClick={() => onCollapse(component.id)}
        onFocus={() => onFocus(component.id)}
        onBlur={() => onFocus(null)}
        onKeyDown={(event) => onKeyDown(event, component.id)}
        className="flex w-full items-center justify-between gap-1.5 border-b border-hairline text-left outline-none"
        style={{ height: CONTAINER_HEADER_H }}
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 font-mono text-map-id text-muted-foreground">
            {component.id}
          </span>
          <span className="truncate text-map-name font-semibold tracking-title">
            {component.name}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {churn !== undefined && (
            <span
              data-testid="map-churn-count"
              data-churn={churn.display}
              className={cn(
                "font-mono text-map-meta",
                churn.display === "dash"
                  ? "text-map-declared-only-foreground"
                  : "text-secondary-foreground",
              )}
            >
              {churn.display === "dash" ? "—" : churn.edits}
            </span>
          )}
          <span
            className={cn(
              "rounded-chip border px-1.25 font-mono text-map-meta",
              STATUS_CHIP[component.status],
            )}
          >
            {component.status}
          </span>
        </span>
      </button>

      {drawn.length > 0 && (
        <svg
          aria-hidden="true"
          data-testid="map-container-edges"
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={NODE_W}
          height={node.h}
        >
          {drawn.map((edge) => {
            const from = rowY.get(edge.from) as number;
            const to = rowY.get(edge.to) as number;
            const right = CONTAINER_BORDER + CONTAINER_PAD + INTRA_GUTTER;
            const bow = CONTAINER_BORDER + CONTAINER_PAD + 2;
            return (
              <path
                key={`${edge.from}->${edge.to}`}
                data-testid="map-container-edge"
                d={`M${right} ${from} H${bow} V${to} H${right}`}
                fill="none"
                stroke="var(--map-edge-muted)"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      )}

      <div
        data-testid="map-container-body"
        className="flex flex-col"
        style={{ paddingTop: 0, paddingLeft: gutter, gap: GROUP_GAP }}
      >
        {expansion.groups.length === 0 && (
          <p
            className="flex items-center font-mono text-map-meta text-muted-foreground"
            style={{ height: ROW_H }}
          >
            no indexed files
          </p>
        )}
        {expansion.groups.map((group) => (
          <div key={group.label} className="flex flex-col" style={{ gap: ROW_GAP }}>
            {expansion.mode === "files" ? (
              <>
                <span
                  data-testid="map-container-group"
                  className="flex items-end truncate font-mono text-map-id tracking-overline text-muted-foreground uppercase"
                  style={{ height: GROUP_LABEL_H }}
                >
                  {group.label}
                </span>
                {group.leaves.map((leaf) => {
                  const path = `${dirOf(group.label)}${leaf}`;
                  return (
                    <button
                      key={path}
                      type="button"
                      data-card-trigger
                      data-testid="map-file"
                      data-file-path={path}
                      aria-pressed={selectedFile === path}
                      onClick={() => onSelectFile(path)}
                      title={path}
                      className={cn(
                        "flex items-center truncate rounded-md border px-1.5 text-left font-mono text-map-meta outline-none",
                        selectedFile === path
                          ? "border-map-node-border-selected bg-background"
                          : "border-hairline bg-background/60 text-secondary-foreground hover:bg-background",
                      )}
                      style={{ height: ROW_H }}
                    >
                      {leaf}
                    </button>
                  );
                })}
              </>
            ) : (
              /* Degraded: one row per rolled-up directory. Not clickable
                 — there is no single file behind it, and a row that
                 opens nothing is worse than a row that says what it is. */
              <span
                data-testid="map-container-group"
                className="flex items-center justify-between gap-1.5 rounded-md border border-hairline px-1.5 font-mono text-map-meta text-secondary-foreground"
                style={{ height: ROW_H }}
                title={group.label}
              >
                <span className="truncate">{group.label}</span>
                <span className="shrink-0 text-muted-foreground">{group.count}</span>
              </span>
            )}
          </div>
        ))}
        {drawable.length > INTRA_EDGE_BUDGET && (
          <span
            data-testid="map-container-edge-note"
            className="flex items-center truncate font-mono text-map-meta text-muted-foreground"
            style={{ height: NOTE_H }}
          >
            {drawable.length} edges inside · not drawn
          </span>
        )}
        {expansion.note !== undefined && (
          <span
            data-testid="map-container-note"
            className="flex items-center truncate font-mono text-map-meta text-muted-foreground"
            style={{ height: NOTE_H }}
            title={expansion.note}
          >
            {expansion.note}
          </span>
        )}
      </div>

      {churn !== undefined && churn.display === "bar" && churn.percent > 0 && (
        <span
          aria-hidden="true"
          data-testid="map-churn-bar"
          data-hottest={churn.hottest || undefined}
          className={cn("pointer-events-none absolute bottom-0 left-0 h-0.75", churn.barClass)}
          style={{ width: `${churn.percent}%` }}
        />
      )}
    </div>
  );
}
