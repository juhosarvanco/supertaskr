import { memo } from "react";
import type { GenesisDenial, GenesisTurn, TurnErrorPayload } from "@/lib/agent-store";
import { Button } from "@/components/ui/button";
import {
  challengeOf,
  chipLabel,
  denialLine,
  failureAction,
  failureDetail,
  failureHeadline,
  visibleDenials,
  type StageSegmentState,
} from "./interview-model";

/**
 * The interview's presentational pieces — one component per thing the
 * design draws, and nothing that decides anything.
 *
 * EVERY MODEL-PRODUCED STRING IN THIS FILE IS A TEXT NODE. Turn text,
 * activity labels, `stderrTail`, `probed` binary names and chip paths
 * all arrive as JSX children, which React escapes; there is no
 * raw-HTML sink anywhere in `app/src/genesis/` and a standing recursive
 * grep over this directory (`genesis-pane-dom.test.tsx`) fails if one
 * ever appears. There is deliberately NO markdown rendering: a turn
 * containing `**bold**`, a fenced block or a link renders those bytes
 * literally (criterion 6's fence, pinned in the DOM suite).
 */

/** The design's small uppercase speaker label (10px in the mockup; the
 * scale's nearest step is `text-xs` at 11px and its only tracking step
 * is 0.12em — both disclosed deviations). */
function Overline({ children }: { children: string }) {
  return (
    <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
      {children}
    </span>
  );
}

/** 14px checked disc, the same construction as the lens's 12px artifact
 * mark: the provenance semantic (`--review-disc` / `--review-mark`),
 * drawn rather than typed so it needs no off-scale font size.
 *
 * Exported since T-028 so the completion panel reuses this mark instead
 * of becoming a third hand-drawn copy of it. */
export function BankedMark() {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} aria-hidden="true" className="shrink-0">
      <circle cx="7" cy="7" r="7" fill="var(--review-disc)" />
      <path
        d="M4 7.4 L6 9.4 L10 5"
        fill="none"
        stroke="var(--review-mark)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The seven-segment progress strip. The bar is 3px, so the design's 2px
 * radius is below the radius scale and reads identically as
 * `rounded-full` (disclosed deviation). */
export function StageStrip({ segments }: { segments: readonly StageSegmentState[] }) {
  return (
    <div data-testid="interview-stage-strip" className="flex gap-1.25">
      {segments.map((state, index) => (
        <span
          // Positional keys are correct here and ADR-009-safe: the index
          // IS the stage, and nothing in this list is keyed by a string
          // the app did not author.
          key={index}
          data-testid="interview-stage-segment"
          data-state={state}
          className={
            state === "done"
              ? "h-0.75 flex-1 rounded-full bg-review-disc"
              : state === "current"
                ? "h-0.75 flex-1 rounded-full bg-foreground"
                : "h-0.75 flex-1 rounded-full bg-hairline"
          }
        />
      ))}
    </div>
  );
}

/** The user's own answer: right-aligned, in the design's quiet bubble.
 * `max-w-114` is 456px — 78% of the 640px pane's 584px content box, so
 * the design's percentage and this fixed cap coincide at the ruled width
 * and stay stable when the chat is alone below the split's breakpoint. */
export function UserTurn({ text }: { text: string }) {
  return (
    <div data-testid="interview-user-turn" className="flex flex-col items-end gap-1.25">
      <Overline>you</Overline>
      <span className="max-w-114 rounded-lg bg-muted px-3.25 py-2.5 text-base whitespace-pre-wrap break-words text-secondary-foreground">
        {text}
      </span>
    </div>
  );
}

/** The pushing-back treatment (criterion 2). The ONLY consumer of
 * `challengeOf`'s boolean: the prefix reaches this class list and
 * nothing else in the app, which is what "the hint is never
 * load-bearing" means as a construction rather than as a claim. */
function ChallengeTurn({ body }: { body: string }) {
  return (
    <div
      data-testid="interview-turn-challenge"
      className="flex flex-col gap-2 rounded-r-lg border-l-2 border-chart-4 bg-interview-challenge px-4 py-3.5"
    >
      <span className="font-mono text-xs tracking-overline text-status-verifying-foreground uppercase">
        planner · pushing back
      </span>
      <span
        data-testid="interview-turn-body"
        className="text-lg whitespace-pre-wrap break-words text-interview-challenge-ink"
      >
        {body}
      </span>
    </div>
  );
}

/** A planner turn that is NOT the current question: quieter, smaller,
 * and stacked above. The design's three-step recency ink ladder is
 * collapsed to two — all history at `text-secondary-foreground`, the
 * current question at `text-foreground` — which is exactly what
 * criterion 1 asks for (disclosed deviation). */
function HistoryTurn({ body }: { body: string }) {
  return (
    <div data-testid="interview-turn-history" className="flex flex-col gap-1.25">
      <Overline>planner</Overline>
      <span
        data-testid="interview-turn-body"
        className="text-base whitespace-pre-wrap break-words text-secondary-foreground"
      >
        {body}
      </span>
    </div>
  );
}

/** The one question that is prominent (criterion 1).
 *
 * NO STATUS LINE UNDER IT, and that is a ruling rather than an omission:
 * @human retired the `one question at a time · N of 7` footer at the
 * 2026-08-30 genesis walk (T-172). The stage lives in the header —
 * `stageReadout` and the seven-segment `StageStrip`, both one region up
 * — so repeating it under every message was chrome restating chrome. */
function CurrentQuestion({ body }: { body: string }) {
  return (
    <div data-testid="interview-turn-current" className="flex flex-col gap-1.75">
      <Overline>planner</Overline>
      <span
        data-testid="interview-turn-body"
        className="text-xl font-medium tracking-title whitespace-pre-wrap break-words text-foreground"
      >
        {body}
      </span>
    </div>
  );
}

/**
 * WHAT THIS TURN WAS REFUSED, WHILE IT IS STILL HAPPENING (T-101).
 *
 * T-081 carried the CLI's in-band `permission_denied` line all the way to
 * `GenesisTurn.denials` and stopped there, outside its own fence; this is
 * the notice it could not build. Three properties, each of which a naive
 * renderer gets wrong, and each driven in `interview-chat-dom.test.tsx`:
 *
 *  1. **THIS IS NOT `FailureBlock` AND MUST NEVER BECOME IT.** A denial
 *     says something HAPPENED, never how the turn ends — the measured
 *     turn carried two and completed. So the treatment is the quiet
 *     furniture register the streaming line and the truncation note
 *     already use, in the same neighbourhood, and it borrows no part of
 *     the rejected-status surface. Rendering a refusal in the failure
 *     treatment would say the opposite of what the runner measured.
 *  2. **ONE ROW PER DENIAL, NEVER PER TOOL.** The real CLI refused
 *     `Bash` twice in one turn. The list arrives already joined on
 *     `tool_use_id` by the runner, so what is here is each refusal
 *     exactly once, and a render-side dedupe by NAME would drop a
 *     refusal the CLI reported — the silence T-081's verifier rejected a
 *     build over, reproduced one layer up. `data-tool-use-id` is what
 *     tells two rows of one tool apart.
 *  3. **IT OUTLIVES THE TURN.** The rows are keyed to the turn's own
 *     `denials`, not to the `running` furniture above them, so nothing a
 *     later delta, activity label or `completed` does can drop them. A
 *     notice a later render drops is worse than none.
 *
 * Positional keys are correct and ADR-009-safe for the same reason
 * `StageStrip`'s are: the list is append-only, never reordered, and
 * nothing here is keyed by a string the app did not author — `toolUseId`
 * is CLI-supplied, so it rides as a data attribute and never as a key.
 */
function DenialNotice({ denials }: { denials: readonly GenesisDenial[] }) {
  return (
    <div
      data-testid="interview-denials"
      data-count={denials.length}
      className="flex flex-col gap-1.25"
    >
      {denials.map((denial, index) => (
        <span
          key={index}
          data-testid="interview-denial"
          data-tool-use-id={denial.toolUseId ?? ""}
          className="font-mono text-xs whitespace-pre-wrap break-words text-secondary-foreground"
        >
          {denialLine(denial)}
        </span>
      ))}
    </div>
  );
}

/**
 * A planner turn, in whichever of the three treatments it earns. The
 * mid-stream furniture (the pulse dot and the last activity label) rides
 * the SAME `motion-safe:` mechanism the lens uses, so
 * prefers-reduced-motion needs no new machinery: the dot is simply
 * static.
 */
export const PlannerTurn = memo(function PlannerTurn({
  turn,
  planner,
  current,
  onRetry,
  onHandDriven,
}: {
  turn: number;
  planner: GenesisTurn;
  current: boolean;
  onRetry: (turn: number) => void;
  onHandDriven?: () => void;
}) {
  const reading = challengeOf(planner.text);
  const running = planner.status === "running";
  const lastActivity = planner.activity[planner.activity.length - 1];
  // PER DENIAL, NEVER PER TURN — see `visibleDenials`. The first build
  // asked "is this turn's error a `toolDenied`?" and dropped the whole
  // notice on a yes, which put a refusal the failure block never names
  // (a nameless one — `denial_names` filters those out of
  // `error.denials`) on no surface at all.
  const denials = visibleDenials(planner.denials, planner.error);

  return (
    <div
      data-testid="interview-planner-turn"
      data-turn={turn}
      data-status={planner.status}
      data-challenge={reading.challenge ? "true" : "false"}
      className="flex flex-col gap-2"
    >
      {reading.challenge ? (
        <ChallengeTurn body={reading.body} />
      ) : current ? (
        <CurrentQuestion body={reading.body} />
      ) : (
        <HistoryTurn body={reading.body} />
      )}

      {running && (
        <div data-testid="interview-streaming" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-1.25 w-1.25 rounded-full bg-chart-4 motion-safe:animate-status-pulse"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {lastActivity === undefined ? "planner is thinking…" : lastActivity}
            {" · ⌘. to stop"}
          </span>
        </div>
      )}

      {/* Below the activity line and OUTSIDE the `running` guard above
          it: the refusal is news while the turn runs and still true once
          it has landed. What can take a ROW away is the terminal
          `toolDenied` block naming that same tool — the SAME refusal
          stated as the turn's cause of death, T-081's criterion 4 ("the
          same denial shall not be reported twice") read as the rendering
          obligation it also is. It can never take the NOTICE away:
          suppression is per denial and keyed on the names the failure
          block actually rendered, so a refusal that block cannot name
          keeps its row. The DOM suite drives all three directions —
          suppressed, kept beside a `toolDenied` that does not name it,
          and kept beside every other failure kind — because a negative
          assertion needs a positive control. */}
      {denials.length > 0 && <DenialNotice denials={denials} />}

      {planner.truncatedRelay && (
        <span data-testid="interview-truncated" className="font-mono text-xs text-muted-foreground">
          the live relay stopped at its 1 MiB cap — the answer above is the
          planner&apos;s own final text
        </span>
      )}

      {planner.status === "cancelled" && (
        <span data-testid="interview-cancelled" className="font-mono text-xs text-muted-foreground">
          stopped — the session is still open, answer again to continue
        </span>
      )}

      {planner.error !== null && (
        <FailureBlock
          error={planner.error}
          turn={turn}
          onRetry={onRetry}
          onHandDriven={onHandDriven}
        />
      )}
    </div>
  );
});

/**
 * A typed runner failure (criterion 5): calm, inline, in the position of
 * the turn that failed — never a modal, never a toast, never a screen
 * replacement. It carries the error's own words and one way forward.
 *
 * NOTHING HERE PARSES THE ERROR TEXT — and since T-029 it does not have
 * to. T-025's smoke found the CLI reports 401 IN BAND on stdout with an
 * empty stderr and `subtype: "success"`; T-025 routed those words into
 * the tail so they at least ARRIVED, and this block rendered them as an
 * escaped one-line blob under "the planner exited with code 1", with
 * **Try again** below. The words were delivered and the MEANING was not,
 * and Try again is the single thing that cannot work against a login that
 * has not changed.
 *
 * So the classification is done in Rust, off TYPED stream fields, and
 * what reaches here is already named. `failureAction` turns the name into
 * the one action that helps — and, for the deterministic failures, TAKES
 * THE RETRY AWAY, because a button that reruns a failure verbatim is a
 * lie with an affordance on it.
 */
export function FailureBlock({
  error,
  turn,
  onRetry,
  onHandDriven,
}: {
  error: TurnErrorPayload;
  turn: number;
  onRetry: (turn: number) => void;
  /** Absent when the caller has nowhere to route the fallback to; the
   * block then simply does not offer it. */
  onHandDriven?: () => void;
}) {
  const detail = failureDetail(error);
  const action = failureAction(error);
  return (
    <div
      data-testid="interview-failure"
      data-error-kind={error.kind}
      data-retryable={action === null || action.retry ? "true" : "false"}
      className="flex flex-col gap-2 rounded-lg border border-status-rejected-border bg-status-rejected px-4 py-3.5"
    >
      <span className="text-sm font-semibold tracking-heading text-destructive">
        {failureHeadline(error)}
      </span>
      {action !== null && (
        <span data-testid="interview-failure-action" className="text-sm text-secondary-foreground">
          {action.hint}
        </span>
      )}
      {action?.command != null && (
        <code
          data-testid="interview-failure-command"
          className="w-fit rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
        >
          {action.command}
        </code>
      )}
      {detail !== null && (
        <span
          data-testid="interview-failure-detail"
          className="font-mono text-sm whitespace-pre-wrap break-words text-status-rejected-foreground"
        >
          {detail}
        </span>
      )}
      <span className="text-sm text-secondary-foreground">
        Nothing was lost — everything already written to{" "}
        <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> is on disk,
        and the conversation can carry on from here.
      </span>
      <div className="flex items-center gap-2.25">
        {(action === null || action.retry) && (
          <Button data-testid="interview-retry" onClick={() => onRetry(turn)}>
            Try again
          </Button>
        )}
        {action?.fallback === true && onHandDriven !== undefined && (
          <Button
            data-testid="interview-hand-driven"
            variant="outline"
            onClick={onHandDriven}
          >
            Drive it by hand
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The banked-answer confirmation (criterion 3). PATHS, not the design's
 * section names: a section-level claim ("banked → north star, person")
 * is not file evidence, and T-024 made exactly this call already.
 *
 * Left-aligned in deliberate contrast to the right-aligned user bubble
 * above it — the design's own composition.
 */
export function BankedChips({ paths }: { paths: readonly string[] }) {
  return (
    <div
      data-testid="interview-banked"
      data-paths={paths.length}
      className="flex items-center gap-2 py-0.5"
    >
      <BankedMark />
      <span className="font-mono text-xs break-words text-status-done-foreground">
        {chipLabel(paths)}
      </span>
    </div>
  );
}
