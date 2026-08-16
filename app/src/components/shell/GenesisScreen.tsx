import { Component, type ReactNode } from "react";
import { GenesisPane } from "@/genesis/GenesisPane";
import type { DocsModelState } from "@/lib/docs-model";

/**
 * The genesis screen (T-026 criterion 2): what the shell shows while a
 * folder with no plan is open for an interview. Full-bleed by design —
 * the pane rail stays board|map, which are the panes an OPEN project has;
 * an interview is not a pane.
 *
 * T-027 still fills the screen proper (the split view: conversation left,
 * the project-so-far right). What T-026 left as a placeholder region is
 * now the real thing: T-037 mounted T-024's lens (C-13) in the marked
 * slot below — the join the first slice owed, since T-024 built the lens
 * against a base predating this screen and T-026 built this screen
 * against a base predating the lens.
 *
 * THE SEAM, as T-026 designed it and T-037 used it: everything the lens
 * needs is already in this screen's two props — `projectDir` (the genesis
 * root) and `docs` (the live DocsModelState the watcher feeds, which is
 * exactly what genesis-derive.ts consumes). So the mount is one import
 * and one element; no new IPC, no polling, no prop plumbing — the pane
 * updates through the watcher pipeline that already runs.
 */
export function GenesisScreen({
  projectDir,
  docs,
}: {
  projectDir: string;
  docs: DocsModelState;
}) {
  const fileCount = docs.fileCount;
  return (
    // T-048 — `min-h-0` is the link that makes the chain a chain. The
    // shell bounds this screen's column at `h-screen` (App.tsx), the slot
    // below already carries `min-h-0 flex-1`, and the pane carries it on
    // down to its `overflow-y-auto` region — but a flex item's automatic
    // minimum size is its CONTENT size, so without `min-h-0` here the
    // section refused to shrink below its 1105px of content inside a
    // 600px column and `overflow: visible` spilled the whole thing onto
    // the page. The page grew instead of the pane, at every window size.
    // Bounding the column alone was measured and does NOT fix it
    // (T-041-s3): page 1110 vs a 720 viewport, pane region 796/796,
    // both unmoved. With this one class the same measurement reads page
    // 720/720 and pane region 796/406 — the frame holds, the pane
    // scrolls.
    <section
      data-testid="genesis-screen"
      data-genesis-files={fileCount}
      className="flex min-h-0 flex-1 flex-col gap-6 px-10 py-9"
    >
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          interview
        </span>
        <h2 className="text-2xl font-semibold tracking-heading">
          Starting a plan in{" "}
          <span data-testid="genesis-project-dir" className="font-mono text-xl">
            {projectDir}
          </span>
        </h2>
        <p className="max-w-120 text-sm text-secondary-foreground">
          The planner writes into{" "}
          <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> and this
          screen renders whatever lands — nothing is copied, nothing is imported.
        </p>
      </div>

      {/* ---- T-024's lens, mounted (T-037) ---------------------------- */}
      {/* The slot frames the pane and clips it to the card radius; the
          pane brings its own ground (bg-sidebar), header rule, padding
          and inner scroll region, so the frame adds no styling of its
          own beyond the border. min-h-0 + flex-1 is what lets the pane's
          own overflow-y-auto region scroll instead of pushing the page. */}
      <div
        data-testid="genesis-pane-slot"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card"
      >
        <GenesisPaneBoundary resetKey={docs.seq}>
          <GenesisPane docs={docs} />
        </GenesisPaneBoundary>
      </div>
    </section>
  );
}

/**
 * The one guard the mount adds (T-037 criterion 5). Mounting the lens
 * puts C-13 on the shell's critical path, and T-024's degradation
 * criteria cover malformed DOCS, not a broken COMPONENT: a throw inside
 * the pane would otherwise unmount the whole React tree and leave the
 * user a blank window with their interview in it.
 *
 * Deliberately the smallest thing that can work — React's own boundary
 * contract (getDerivedStateFromError), no library, no reporting
 * infrastructure, nothing reusable invented for one call site. Two notes
 * on the shape:
 *
 * - It does NOT latch forever. `resetKey` is the applied snapshot's seq,
 *   so the next snapshot the watcher delivers gets one fresh attempt; a
 *   single torn file cannot brick the screen for the session, and a
 *   pane that keeps throwing keeps showing the fallback.
 * - It wraps the pane rather than keying it, so normal renders leave the
 *   pane mounted and its change log (the writing-pulse window) intact.
 *   A crash unmounts that subtree by React's own rules; the log
 *   re-baselines on recovery, which is the correct reading of "we do not
 *   know what happened while it was broken".
 */
class GenesisPaneBoundary extends Component<
  { resetKey: number; children: ReactNode },
  { failed: boolean; seenKey: number }
> {
  constructor(props: { resetKey: number; children: ReactNode }) {
    super(props);
    this.state = { failed: false, seenKey: props.resetKey };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: { resetKey: number },
    state: { failed: boolean; seenKey: number },
  ): { failed: boolean; seenKey: number } | null {
    if (props.resetKey === state.seenKey) return null;
    // A new snapshot landed: forget the previous failure and try again.
    return { failed: false, seenKey: props.resetKey };
  }

  componentDidCatch(error: unknown): void {
    console.error("[nputer] the genesis pane failed to render", error);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        data-testid="genesis-pane-failed"
        className="flex flex-col gap-2 bg-sidebar px-6.5 py-5.5"
      >
        <p className="font-mono text-sm text-destructive">
          the view of docs/ stopped rendering
        </p>
        <p className="max-w-120 text-sm text-secondary-foreground">
          Nothing was written and nothing was lost — this screen only reads. Your files are on
          disk and the watcher is still live; the next file written to{" "}
          <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> tries this
          view again.
        </p>
      </div>
    );
  }
}
