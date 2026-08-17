import { Component, type ReactNode } from "react";
import { GenesisPane } from "@/genesis/GenesisPane";
import { InterviewChat } from "@/genesis/InterviewChat";
import type { DocsModelState } from "@/lib/docs-model";

/**
 * The genesis screen (T-026 criterion 2, filled by T-027): what the shell
 * shows while a folder with no plan is open for an interview. Full-bleed
 * by design — the pane rail stays board|map, which are the panes an OPEN
 * project has; an interview is not a pane.
 *
 * THE SPLIT, per the @human composition ruling of 2026-08-17 after seeing
 * T-024's lens at full width in a real genesis run: 640px of planner chat
 * on the LEFT, the lens on the RIGHT. The pane earns its half; the
 * interview is a conversation with the plan assembling beside it.
 *
 * WHAT T-027 REMOVED, and why it was always going to go: this screen used
 * to render an `interview` overline, an `<h2>` naming the project dir, an
 * explanatory paragraph and a `rounded-lg border bg-card` box around the
 * pane. Every one of those was an acknowledged T-026 placeholder ("the
 * genesis screen has no design source in this task — T-027 fills it"),
 * and T-037's @human item 1 flagged the card frame as a sidebar tone
 * inside a box the design never draws. The design's split is FLUSH: a
 * 640px column with a 1px rule on its own right edge, and a `flex:1`
 * right half with no border and no radius. There is no gap element and no
 * card frame anywhere between them. The project's name did not vanish
 * with the heading — it moved to the app's own header (App.tsx), which is
 * where the design puts it.
 *
 * THIS FILE STAYS IPC-FREE AND TIMER-FREE, and the gate that says so is
 * kept rather than weakened: `genesis-mount.test.tsx` sweeps this file's
 * SOURCE TEXT for ten names — every way a component could reach the IPC
 * boundary, a network, a clock, a store on the device, or a raw-markup
 * sink. This comment deliberately spells none of them, because the sweep
 * reads comments too and it should. Every scrap of the conversation half
 * — the store subscription, the send, the auto-start, the scroll — lives
 * in `app/src/genesis/` instead.
 *
 * THE SEAM IS UNCHANGED AND UNWIDENED. Both halves need only this
 * screen's two existing props: `projectDir` (the genesis root) and `docs`
 * (the live DocsModelState the watcher feeds). No new IPC, no polling, no
 * prop plumbing — the chat gets everything else from C-14's store.
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
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* T-048's chain gains one link, by construction rather than by
          accident: the split is a new flex level between the screen and
          the slot, so it needs `min-h-0` for exactly the reason every
          other link does, and a `data-testid` so the chain assertion in
          shell-frame.test.tsx can name it. Both scroll regions below —
          the chat's transcript and the lens's own — descend through it. */}
      <div data-testid="genesis-split" className="flex min-h-0 min-w-0 flex-1">
        <InterviewChat projectDir={projectDir} docs={docs} />

        {/* ---- T-024's lens, mounted (T-037), now the right half ------- */}
        {/* THE SPLIT'S BREAKPOINT, and the one consequence worth reading
            twice. 640px of chat plus the 1px rule leaves the lens W-641:
            at 1440 -> 799 (the design's own number), at 1280 -> 639, at
            1024 -> 383, at 800 -> 159. The lens renders at Tailwind's
            existing `lg` (1024px) and above and is ABSENT below it —
            one existing default breakpoint, no new token, no config
            change, which matters because this is the app's first
            responsive call site and T-038-s1 is still open on whether
            breakpoints are tokens.

            THE CONSEQUENCE: at the app's OWN configured 800x600 window
            the lens does not render. The interview is entirely usable —
            the chat takes the frame and T-048's measurements say the
            frame holds — but the half @human just ruled "earns its half"
            is invisible at the size the app opens. T-027 deliberately
            does NOT change tauri.conf.json: the window size governs every
            screen, it fires the BOOT GATE, and it sits beside T-048-s5's
            missing minHeight. A flagship screen's width requirement is a
            reason to raise the default window, not a licence for this
            task to do it in passing. Flagged to @human.

            The slot keeps `min-h-0 flex-1` — what lets the pane's own
            overflow-y-auto region scroll instead of pushing the page —
            and loses T-037's card frame, radius and border: the design
            draws the right half as a plain `flex:1` ground with no
            border and no radius. */}
        <div
          data-testid="genesis-pane-slot"
          className="hidden min-h-0 min-w-0 flex-1 lg:flex lg:flex-col"
        >
          <GenesisPaneBoundary resetKey={docs.seq}>
            <GenesisPane docs={docs} />
          </GenesisPaneBoundary>
        </div>
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
