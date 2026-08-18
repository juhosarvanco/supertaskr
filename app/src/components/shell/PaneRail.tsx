import { cn } from "@/lib/utils";

/**
 * The pane rail (T-012; deferred from T-006's scope notes): 72px, the
 * sidebar token family, populated with ONLY what exists — board · map.
 * rooms/sess ghosts are dead chrome for unbuilt features; their tasks
 * add their items (plan §3/§9 fence). The `v0.1` mono tag anchors the
 * bottom per the measured spec.
 *
 * Real <button>s, tab-focusable, aria-current on the active item; no
 * keyboard accelerators (undesigned — recorded silence). Icons are CSS
 * shapes at the measured 1.5px stroke (no assets, per the bundle).
 * Family reconciliations, disclosed T-006-style: active bg
 * --sidebar-accent renders #f0f0f0 vs the mock's #ededed (one step);
 * inactive icon/label ride --muted-foreground (label mock-exact in
 * light; icon ink one step from #a3a3a3); item radius maps to the 10px
 * scale step for the mock's 9px pill.
 *
 * T-062 — `h-screen` IS LOAD-BEARING, and it is the rail's own. The
 * rail is a stretch-height sibling of the shell's content column, so it
 * used to inherit the DOCUMENT's height: over this repo's own docs/
 * tree it measured 4989px (2202 when T-048 measured it), the strip and
 * its right border running the whole scrolling page. Bounding the shell
 * would have collapsed that to the viewport by inheritance — right
 * answer, wrong reason, and silently wrong again the day `main` moves.
 * Saying it here makes the strip the WINDOW by construction, and
 * `app/test/shell-frame.test.tsx` pins it so it cannot be dropped as
 * redundant.
 */

export type PaneId = "board" | "map";

const ITEMS: { id: PaneId; label: string }[] = [
  { id: "board", label: "board" },
  { id: "map", label: "map" },
];

export function PaneRail({
  active,
  onSelect,
}: {
  active: PaneId;
  onSelect: (pane: PaneId) => void;
}) {
  return (
    <nav
      data-testid="pane-rail"
      aria-label="panes"
      className="flex h-screen w-18 shrink-0 flex-col items-center gap-1.5 border-r border-sidebar-border bg-sidebar py-4"
    >
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`pane-rail-${item.id}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex w-14 flex-col items-center gap-1.25 rounded-lg py-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
              isActive && "bg-sidebar-accent",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-4 rounded-sm",
                isActive
                  ? "bg-sidebar-accent-foreground"
                  : "icon-stroke border-muted-foreground",
              )}
            />
            <span
              className={cn(
                "font-mono text-map-meta",
                isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
      <span className="mt-auto font-mono text-map-meta text-muted-foreground">v0.1</span>
    </nav>
  );
}
