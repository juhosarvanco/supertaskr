import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DocsModelState } from "@/lib/docs-model";
import type { SendOutcomePayload, StartOutcomePayload } from "@/lib/agent-store";
import {
  activeTurn,
  assembleTranscript,
  bankBaseline,
  bankedSince,
  shouldStickToBottom,
  stageOf,
  stageReadout,
  stageStrip,
  UNPRIMED_BASELINE,
  type BankBaseline,
} from "./interview-model";
import {
  interviewBusy,
  retryTurn,
  sendAnswer,
  startInterview,
  useGenesisState,
  useInterviewUi,
} from "./interview-source";
import { BankedChips, PlannerTurn, StageStrip, UserTurn } from "./interview-turns";

/**
 * THE PLANNER CHAT — the left half of the split (T-027).
 *
 * 640px of conversation beside T-024's lens, per the @human composition
 * ruling: the interview is a conversation with the plan assembling
 * beside it. Everything with an `invoke`, a listener or a timer in it
 * lives here and below; `GenesisScreen.tsx` stays IPC-free and
 * timer-free, and a source grep in `genesis-mount.test.tsx` keeps it
 * that way.
 *
 * THE STAGE STRIP FOLLOWS THE DERIVED STAGE, NOT THE CHIPS. `stageOf`
 * calls the already-exported `deriveGenesis` and reads only
 * `approxStage` and `stageStep` — both independent of the change log and
 * of `nowMs`, so the call is deterministic and this screen adds no clock
 * of its own. `genesis-derive.ts` is a 0-byte diff and `BANKING_MAP` is
 * not read, edited or transcribed by anything here.
 */
export function InterviewChat({
  projectDir,
  docs,
}: {
  projectDir: string;
  docs: DocsModelState;
}) {
  const genesis = useGenesisState();
  const ui = useInterviewUi();
  const busy = interviewBusy(genesis, ui);

  // ---- banked chips: file evidence, and only file evidence -----------
  //
  // The signal is the docs tree this screen is already handed and
  // NOTHING else — not `activity` labels (those are tool-use markers off
  // the model's own stream, i.e. model output, which criterion 3 bans),
  // not `completed.text`, not the banking map's expectations.
  const baseline = useRef<BankBaseline>(UNPRIMED_BASELINE);
  const [chipsByTurn, setChipsByTurn] = useState<ReadonlyMap<number, readonly string[]>>(
    () => new Map(),
  );

  useEffect(() => {
    const active = activeTurn(genesis.turns);
    // Before the interview has started there is nothing to attribute a
    // file to, so there are no chips and no baseline.
    if (active === null) return;
    if (!baseline.current.primed) {
      // PRIMED AT THE FIRST TURN, over whatever is already on disk.
      // T-042 made this honest by construction: a genesis switch onto a
      // folder whose docs/ already holds files now carries that tree at
      // the switch's own seq, so the baseline is the real tree and
      // pre-existing files do NOT chip as if the planner had just
      // written them.
      baseline.current = bankBaseline(docs);
      return;
    }
    const banked = bankedSince(baseline.current, docs);
    if (docs.seq > baseline.current.seq || docs.projectDir !== baseline.current.projectDir) {
      baseline.current = bankBaseline(docs);
    }
    if (banked.length === 0) return;
    setChipsByTurn((previous) => {
      const existing = previous.get(active) ?? [];
      const merged = [...new Set([...existing, ...banked])].sort();
      // A file that changes twice between turns is ONE chip: the diff is
      // a set, the files cannot prove two bankings, so the chat does not
      // claim two. Identity back when nothing was added.
      if (merged.length === existing.length) return previous;
      const next = new Map(previous);
      next.set(active, merged);
      return next;
    });
  }, [docs, genesis.turns]);

  // ---- the first frame ------------------------------------------------
  //
  // AUTO-START, per the @human ruling: the user's action that reached
  // this screen was literally "Start an interview", and re-asking on
  // arrival is the four-step problem T-049 fixed one screen over. The
  // explicit affordance below stays visible whenever there is nothing
  // yet, so this is a convenience and never load-bearing.
  const notStarted = genesis.phase === "idle" && genesis.turns.length === 0;

  // …but ONLY once the mount-time `genesis_status` has actually
  // answered. `methodVersion` is the honest signal for that and it is
  // already in the store: nothing sets it but `applyGenesisStatus`, so
  // non-null means "a status was observed" and null means "we have not
  // asked yet, or nobody answered". Auto-starting on the EMPTY state
  // instead would fire against a boundary that has said nothing — which
  // is a process spawn on a guess.
  const statusKnown = genesis.methodVersion !== null;
  useEffect(() => {
    if (!statusKnown || !notStarted) return;
    void startInterview(projectDir);
  }, [statusKnown, notStarted, projectDir]);

  // ---- the transcript, and who scrolls -------------------------------
  //
  // `stageOf` calls the lens's own exported `deriveGenesis` with the
  // empty change log and `nowMs = 0` — both `approxStage` and
  // `stageStep` are independent of those, so the call is deterministic
  // and this screen adds no clock. It also cannot throw: see the note on
  // `stageOf`, which is the difference between a torn file breaking a
  // progress bar and a torn file taking the conversation down.
  const stage = stageOf(docs);
  const transcript = assembleTranscript(genesis.turns, ui.userHalves, chipsByTurn);
  const log = useRef<HTMLDivElement | null>(null);
  const stick = useRef(true);

  const onScroll = useCallback(() => {
    const el = log.current;
    if (el === null) return;
    stick.current = shouldStickToBottom(el.scrollTop, el.scrollHeight, el.clientHeight);
  }, []);

  useEffect(() => {
    const el = log.current;
    // Only when the reader is already at the bottom: a chat that yanks
    // the view while someone reads back through their own answers is
    // worse than one that never scrolls.
    if (el === null || !stick.current) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript]);

  // ---- the input ------------------------------------------------------
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    // One row, auto-growing to a bounded max, then scrolling. The design
    // draws a single line and gives no guidance, so the bound is stated
    // rather than discovered: `max-h-40` (160px) in the class list below.
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const submit = useCallback(() => {
    // The flag is re-read HERE rather than trusted from the render that
    // drew the control: `disabled` is not the guard, because a keydown
    // can be delivered between state updates. The latch inside
    // `sendAnswer` is the one that actually bounds a burst.
    if (draft.trim().length === 0) return;
    const text = draft;
    setDraft("");
    void sendAnswer(text);
  }, [draft]);

  const onRetry = useCallback(
    (turn: number) => {
      void retryTurn(projectDir, turn);
    },
    [projectDir],
  );

  return (
    <section
      data-testid="interview-chat"
      data-phase={genesis.phase}
      data-turns={genesis.turns.length}
      data-stage-derivation={stage.failed ? "failed" : "ok"}
      // Mobile-first, and the only responsive call site in the app. Below
      // `lg` the lens is not rendered at all and the chat takes the frame,
      // centred at the width it would have had; at `lg` and up it is the
      // design's 640px column with the split's 1px rule on its own edge
      // (the rule belongs to the chat side — the design draws no border
      // and no radius on the lens half).
      className="mx-auto flex min-h-0 w-full max-w-160 flex-col lg:mx-0 lg:w-160 lg:max-w-none lg:shrink-0 lg:border-r lg:border-hairline"
    >
      {/* ---- header: the overline, the readout, the strip ------------- */}
      <div className="flex flex-col gap-3 border-b border-hairline px-7 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
            planning interview
          </span>
          <span
            data-testid="interview-stage-readout"
            className="font-mono text-xs text-secondary-foreground"
          >
            {stageReadout(stage.approxStage, stage.stageStep)}
          </span>
        </div>
        <StageStrip segments={stageStrip(stage.approxStage)} />
      </div>

      {/* ---- the transcript, the chat's own scroll region -------------- */}
      <div
        ref={log}
        onScroll={onScroll}
        data-testid="interview-log"
        className="flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto px-7 py-5.5"
      >
        {transcript.map((entry) =>
          entry.kind === "user" ? (
            <UserTurn key={`u${entry.turn}`} text={entry.text} />
          ) : entry.kind === "banked" ? (
            <BankedChips key={`b${entry.turn}`} paths={entry.paths} />
          ) : (
            <PlannerTurn
              key={`p${entry.turn}`}
              turn={entry.turn}
              planner={entry.planner}
              current={entry.current}
              approxStage={stage.approxStage}
              onRetry={onRetry}
            />
          ),
        )}

        {notStarted && (
          <div data-testid="interview-not-started" className="flex flex-col gap-3">
            <p className="text-base text-secondary-foreground">
              The planner asks one question at a time and writes each answer straight into{" "}
              <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span>. It
              starts on its own — this is here in case it does not.
            </p>
            <div className="flex items-center gap-2.25">
              <Button
                data-testid="interview-start"
                disabled={busy}
                onClick={() => void startInterview(projectDir, { force: true })}
              >
                Start the interview
              </Button>
            </div>
          </div>
        )}

        {ui.notice !== null && <OutcomeNotice outcome={ui.notice} projectDir={projectDir} />}
      </div>

      {/* ---- the input row --------------------------------------------- */}
      <div className="flex flex-col gap-2.5 border-t border-hairline px-7 pt-4 pb-5">
        <textarea
          ref={box}
          rows={1}
          data-testid="interview-input"
          disabled={busy}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // INPUT-LOCAL, never accelerators: the criterion says so, and
            // `matchAccelerator` requires a modifier anyway. Shift+Enter
            // falls through to the textarea's own newline.
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            submit();
          }}
          placeholder={'Answer, or say "skip" and I\'ll mark it an assumption…'}
          className="max-h-40 resize-none rounded-lg border border-input bg-card px-3.5 py-3 text-base shadow-card placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3">
          <span data-testid="interview-hint" className="font-mono text-xs text-muted-foreground">
            {busy ? "planner is thinking… · ⌘. to stop" : "⏎ send · ⇧⏎ newline"}
          </span>
          <Button data-testid="interview-bank" disabled={busy} onClick={submit}>
            Bank answer
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * A typed outcome that is not `started`/`accepted`, rendered inline as
 * text. Every field it shows is a TYPED fact from the runner — no error
 * string is ever parsed to decide which of these to show.
 *
 * `cliNotFound` is the one with its own card (criterion 6). It names the
 * binaries the app looked for (const data from the Rust adapter table,
 * never disk-sourced), the project path, and the hand-driven route. It
 * deliberately does NOT carry the assembled kickoff prompt:
 * `assemble_kickoff` is a Rust `pub fn` reachable only from Rust, and
 * `GenesisStatusPayload` carries no kickoff — a copyable block needs a
 * fifth genesis command and belongs with T-029.
 */
function OutcomeNotice({
  outcome,
  projectDir,
}: {
  outcome: StartOutcomePayload | SendOutcomePayload;
  projectDir: string;
}) {
  if (outcome.kind === "cliNotFound") {
    return (
      <div
        data-testid="interview-cli-missing"
        className="flex flex-col gap-2 rounded-lg border border-status-verifying-border bg-status-verifying px-4 py-3.5"
      >
        <span className="text-sm font-semibold tracking-heading text-status-verifying-title">
          no agent CLI found
        </span>
        <span className="text-sm text-secondary-foreground">
          nputer looked for{" "}
          <span data-testid="interview-cli-probed" className="font-mono text-sm break-words">
            {outcome.probed.join(", ")}
          </span>{" "}
          and found none on the path it can see.
        </span>
        <span className="text-sm text-secondary-foreground">
          The method is hand-drivable: run your own agent in{" "}
          <span data-testid="interview-cli-project" className="font-mono text-sm break-words">
            {projectDir}
          </span>{" "}
          and this screen keeps rendering whatever lands in{" "}
          <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span>.
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="interview-notice"
      data-outcome-kind={outcome.kind}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3.5"
    >
      <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
        {outcome.kind}
      </span>
      <span
        data-testid="interview-notice-detail"
        className="text-sm whitespace-pre-wrap break-words text-secondary-foreground"
      >
        {noticeSentence(outcome)}
      </span>
    </div>
  );
}

/** One sentence per typed outcome, from its own fields. */
function noticeSentence(outcome: StartOutcomePayload | SendOutcomePayload): string {
  switch (outcome.kind) {
    case "busy":
      return "a turn is already running — this one was not sent.";
    case "noProject":
      return "no project is open, so there is nothing to plan.";
    case "noSession":
      return "there is no planner session to answer; start the interview first.";
    case "alreadyPlanned":
      return `${outcome.path} already exists — this folder has a plan.`;
    case "resumeAvailable":
      return `a planner session is already recorded here (${outcome.turns} turns, session ${outcome.nativeSessionId}). Resuming it is T-029's; nothing has been lost.`;
    case "staleProject":
      return `the running session belongs to ${outcome.sessionProject}, not the folder now open.`;
    case "unsupportedVersion":
      return `the agent CLI reports ${outcome.found}, which is older than this app can drive.`;
    case "error":
      return outcome.message;
    default:
      return outcome.kind;
  }
}
