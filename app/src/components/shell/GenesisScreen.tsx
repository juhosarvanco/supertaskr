import { Component, type ReactNode } from "react";
import { BoardCrescendo } from "@/genesis/BoardCrescendo";
import { showsBoard } from "@/genesis/crescendo";
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
  onOpenBoard,
}: {
  projectDir: string;
  docs: DocsModelState;
  /** T-028: the genesis→board handoff, owned by the shell and passed
   * through. It is a SCREEN change and not a project change — the
   * interview's folder is already the watched one — so it is a plain
   * function call with no boundary crossing of any kind. */
  onOpenBoard: () => void;
}) {
  const fileCount = docs.fileCount;
  // T-028 criterion 1, and the ONE decision this screen makes: which
  // renderer the right half gets. Derived from the docs tree ALONE
  // through one pure call, so this file keeps the properties its header
  // promises — no subscription, no clock, no boundary. Everything that
  // needs the interview's own state lives inside `BoardCrescendo`.
  //
  // FILE EVIDENCE ONLY, and the consequence is deliberate: the board
  // appears because task files PARSED, never because a turn said so. A
  // human hand-driving the method in a terminal (ADR-006) gets exactly
  // the same crescendo as the spawned planner, because the screen is
  // reading the disk and not the dialogue.
  //
  // `showsBoard` rather than `boardReadiness(...).showBoard` because THIS
  // CALL SITE IS OUTSIDE THE BOUNDARY BELOW — a throw here unmounts the
  // whole tree, interview included. See the note on `showsBoard`, which
  // is where that argument lives; it was found by T-037's own hostile
  // probe rather than by reading this line.
  const half = showsBoard(docs) ? "board" : "lens";
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
            twice. The chat's 640 is BORDER-BOX (Tailwind's preflight sets
            it on everything), so the split's 1px rule sits INSIDE that
            640 and the lens gets W-640, not W-641: at 1440 -> 800, at
            1280 -> 640, at 1024 -> 384 — and 160 at 800, where the lens
            does not render at all, so that row is arithmetic rather than
            a measurement. The lens renders at Tailwind's
            existing `lg` (1024px) and above and is ABSENT below it —
            one existing default breakpoint, no new token, no config
            change, which matters because this is the app's first
            responsive call site and T-038-s1 is still open on whether
            breakpoints are tokens.

            CORRECTED 2026-08-20 (T-074, at `e83ee1d`). This paragraph
            taught W-641 — "at 1440 -> 799 (the design's own number), at
            1280 -> 639, at 1024 -> 383, at 800 -> 159" — which T-027's
            verifier falsified by measuring the built app;
            tools/e2e/tests/interview.spec.ts has carried 800 / 640 / 384
            ever since, so the shipped comment and the lane's assertion
            contradicted each other across a fence. THE ATTRIBUTION WAS
            WRONG TOO, and it is the same border-box slip one level
            further back: the design of record
            (docs/design/claudedesign_handoff/`nputer app.dc.html`, the
            `data-screen-label="Interview"` artboard) sets
            `* { box-sizing: border-box }`, gives the chat column
            `width:640px` with a 1px right border and gives the right
            half `flex:1` — it never says 799. Measured headlessly in
            Chromium over that artboard: chat 640 (client 639, the rule
            inside it) and the right half **798**, because the artboard
            is a 1440px border-box frame whose own 1px window chrome
            leaves 1438 to split. In the app the VIEWPORT is the frame,
            so the same design ratio gives 1440 - 640 = 800. 799 is the
            number you get by subtracting the 1px rule twice, and it is
            neither the app's nor the design's.

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
          data-half={half}
          className="hidden min-h-0 min-w-0 flex-1 lg:flex lg:flex-col"
        >
          {/* T-028: the same slot, the same boundary, one of two
              renderers. The boundary WIDENS to cover the board half
              rather than being bypassed by it — mounting the board here
              puts it on the interview's critical path for the first
              time, which is the exact condition T-037's guard exists
              for, and a crash in the right half must still cost the
              right half only. */}
          <GenesisPaneBoundary resetKey={docs.seq}>
            {half === "board" ? (
              <BoardCrescendo docs={docs} onOpenBoard={onOpenBoard} />
            ) : (
              <GenesisPane docs={docs} />
            )}
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
