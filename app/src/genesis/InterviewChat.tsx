import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DocsModelState } from "@/lib/docs-model";
import type {
  GenesisRecordPayload,
  KickoffOutcomePayload,
  SendOutcomePayload,
  StartOutcomePayload,
} from "@/lib/agent-store";
import { elapsedLabel } from "./crescendo";
import {
  activeTurn,
  assembleTranscript,
  EMPTY_BANKING_OBSERVATION,
  mergeRehydrated,
  noticeRoutesToHandDriven,
  observeBanking,
  shouldStickToBottom,
  stageOf,
  stageReadout,
  stageStrip,
} from "./interview-model";
import {
  freshInterview,
  interviewBusy,
  loadKickoff,
  rehydrateInterview,
  resumeInterview,
  retryTurn,
  sendAnswer,
  startGenesisClock,
  startInterview,
  useGenesisElapsedMs,
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
  //
  // WHICH HALF OF THE OBSERVATION IS REACT STATE IS THE WHOLE OF T-072
  // CRITERION 2, and the rule it restores is T-056's. `observeBanking`
  // is still ONE pure transition owned by `interview-model.ts` and
  // shared verbatim with the replay tests (T-057 criterion 1) — not a
  // line of the rule moves back into this component. What moves is
  // STORAGE. The baseline is bookkeeping no render reads; the chip map
  // is the render. Holding both in one `useState` meant a quiet snapshot
  // — the watcher's seq advances, nothing banked — returned a fresh
  // observation object, which is never `Object.is`-equal to the last
  // one, so React re-rendered the conversation for a value nothing
  // displays and the `transcript` effect fired an auto-scroll write with
  // it (T-057-s2, the regression T-056 exists to move against).
  //
  // The observation lives in a ref and only `chipsByTurn` is state, so a
  // baseline advance costs no render. The ref is written in an EFFECT,
  // after the commit — CONVENTIONS' render-phase ref stamp rule and its
  // three conditions govern a write during RENDER and do not apply here.
  // The write is idempotent, which is what makes it safe under
  // StrictMode's double-effect: observing the same docs twice is a stale
  // snapshot the second time, and that path returns the previous
  // observation by identity.
  const observed = useRef(EMPTY_BANKING_OBSERVATION);
  const [chipsByTurn, setChipsByTurn] = useState(EMPTY_BANKING_OBSERVATION.chipsByTurn);

  useEffect(() => {
    const active = activeTurn(genesis.turns);
    const next = observeBanking(observed.current, docs, active);
    observed.current = next;
    // Identity, not deep equality: `observeBanking` hands back the same
    // map on every path that adds no path to no turn, and React's eager
    // bail-out then schedules nothing at all.
    setChipsByTurn(next.chipsByTurn);
  }, [docs, genesis.turns]);

  // ---- the first frame ------------------------------------------------
  //
  // AUTO-START, per the @human ruling: the user's action that reached
  // this screen was literally "Start an interview", and re-asking on
  // arrival is the four-step problem T-049 fixed one screen over. The
  // explicit affordance below stays visible whenever there is nothing
  // yet, so this is a convenience and never load-bearing.
  const notStarted = genesis.phase === "idle" && genesis.turns.length === 0;

  // THE RESUME OFFER (criterion 1). `resumeAvailable` is the typed answer
  // `genesis_start` gives when the registry already remembers a planner
  // session here; taking it respawns that native session, and declining
  // it is `freshInterview`. Both are the SAME screen, because "the
  // conversation is not where you left it" is one situation with two
  // exits, not two situations.
  //
  // ONE VALUE, TWO SOURCES, IN A FIXED ORDER — and that order is the
  // T-027-s2 argument applied a second time. This module's `notice` is
  // the LIVE answer to a call this screen just made; the store's
  // `lastOutcome` is the DURABLE one, folded by `reduceGenesisOutcome`
  // and cleared only by a `started`/`accepted`. Reading just the first
  // loses the offer across a remount (module state outlives a component,
  // but a caller that never ran leaves it null); reading just the second
  // ignores the answer in hand. Deriving every block below from ONE
  // expression is what stops the store and the UI disagreeing about
  // whether there is a session to pick up.
  const outcome = ui.notice ?? genesis.lastOutcome;
  const offer = outcome?.kind === "resumeAvailable" ? outcome : null;
  const rejected = outcome?.kind === "sessionIdRejected" ? outcome : null;

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
    // T-029 (T-027-s2): NOT over a dead turn channel. Auto-starting there
    // spawns a real planner that really writes into `docs/` while this
    // half of the screen can never show a word of it — which is precisely
    // the defect, made worse by doing it without being asked. The
    // explicit affordance below still works, so the user can force it.
    if (genesis.listenerFailed) return;
    void startInterview(projectDir);
  }, [statusKnown, notStarted, projectDir, genesis.listenerFailed]);

  // ---- the elapsed slot (T-028 criterion 3) ---------------------------
  //
  // Started HERE because this component IS the interview being on screen,
  // which is exactly what the clock claims to measure. The origin lives
  // in the module rather than in a ref, so a remount keeps it and only a
  // different genesis project re-bases it; the whole rule, including what
  // an app restart does to it, is written on `startGenesisClock`.
  //
  // WHERE THE DESIGN PUTS THIS SLOT, and why it is not there: the mockup
  // reads `~9 min elapsed` in the LENS's footer-right, which T-024
  // substituted with `stage ~N · <step>` for a stated reason. T-028 can
  // no longer put it back there even if it wanted to — the lens is
  // REPLACED by the board at decomposition, so a footer slot would take
  // the elapsed time off screen at exactly the moment the run is being
  // timed. It lives in the conversation's own header instead, which is
  // the one piece of chrome that survives the whole genesis. Disclosed
  // deviation; the number and its phrasing are the design's.
  useEffect(() => {
    startGenesisClock(projectDir, Date.now());
  }, [projectDir]);
  const elapsed = elapsedLabel(useGenesisElapsedMs());

  // ---- the transcript, and who scrolls -------------------------------
  //
  // `stageOf` calls the lens's own exported `deriveGenesis` with the
  // empty change log and `nowMs = 0` — both `approxStage` and
  // `stageStep` are independent of those, so the call is deterministic
  // and this screen adds no clock. It also cannot throw: see the note on
  // `stageOf`, which is the difference between a torn file breaking a
  // progress bar and a torn file taking the conversation down.
  const stage = stageOf(docs);
  // THE CONVERSATION IS WHERE YOU LEFT IT (criteria 1-2). Pulled on
  // arrival rather than at app startup: `genesis_transcript` reads the
  // OPEN project, and at startup there may not be one.
  useEffect(() => {
    void rehydrateInterview();
  }, [projectDir]);
  const joined = mergeRehydrated(genesis.rehydrated, genesis.turns, ui.userHalves);
  const transcript = assembleTranscript(joined.turns, joined.userHalves, chipsByTurn);
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
  /**
   * T-028 criterion 6 (folding T-027-s1): did the answer box HOLD FOCUS
   * at the moment this turn was sent?
   *
   * THE DEFECT, stated exactly, because the fix only makes sense against
   * it: the box disables itself while a turn is in flight, and the HTML
   * spec blurs a focused element when it becomes disabled. Nothing gave
   * the focus back — so on a seven-question conversation you reached for
   * the mouse between every single answer. The blur is correct and stays;
   * what was missing was the other half.
   *
   * RECORDED AT SUBMIT, NEVER INFERRED ON LANDING, and that is the whole
   * of why this is a ref rather than a check inside the effect. By the
   * time the turn lands the box has already been blurred by the disable,
   * so "did it have focus?" is unanswerable then — and a "Bank answer"
   * click, where focus is on the BUTTON, would be indistinguishable from
   * an ⏎ send. Two different intentions, one observable state: the flag
   * separates them at the only moment they are still distinguishable.
   */
  const heldFocusAtSubmit = useRef(false);

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
    heldFocusAtSubmit.current = box.current !== null && document.activeElement === box.current;
    const text = draft;
    setDraft("");
    void sendAnswer(text);
  }, [draft]);

  /**
   * Give the focus back when the turn leaves flight — and only then, and
   * only if it was ours to give back.
   *
   * NO DEPENDENCY ARRAY, deliberately: keying this on the falling edge of
   * `busy` would make it depend on React observing a RISING edge, and the
   * rising edge is not guaranteed to survive batching when a send
   * resolves inside one microtask (the served DEV bundle's twin does
   * exactly that — there is no `invoke` to wait for). The ref guard makes
   * every other render a no-op, so running unconditionally costs one
   * boolean read and cannot miss a transition. The lens uses the same
   * shape for its one timer.
   *
   * THE ANTI-THEFT CLAUSE is the second condition, and it is the half a
   * naive fix gets wrong: if the user moved focus somewhere else while
   * the planner was thinking — tabbed to the retry button, clicked into
   * the lens, focused the theme toggle — that focus is THEIRS and yanking
   * it back into the box mid-keystroke would be a worse bug than the one
   * being fixed. So the box only takes focus back from the state the
   * disable left behind: nothing focused at all (`document.body`, which
   * is where a blurred element's focus goes), or the box itself.
   */
  useEffect(() => {
    if (busy || !heldFocusAtSubmit.current) return;
    heldFocusAtSubmit.current = false;
    const el = box.current;
    if (el === null) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body && active !== el) return;
    el.focus();
  });

  const onRetry = useCallback(
    (turn: number) => {
      void retryTurn(projectDir, turn);
    },
    [projectDir],
  );

  // ---- the hand-driven mode (criterion 4) -----------------------------
  //
  // ADR-006's manual interview as a FIRST-CLASS MODE rather than a
  // separate build: the same assembled kickoff the spawn would have used,
  // in a copyable block, with T-024's lens (now T-028's board) live on the
  // right and the same completion detection. Zero agent plumbing, any
  // model, any CLI — and it is the ONE route that works with no login at
  // all, which is why the auth failure offers it.
  //
  // It is opened DELIBERATELY, never automatically: a `cliNotFound`
  // renders its own card, and an auth failure offers the button. Popping a
  // wall of prompt text over a recoverable failure would be the screen
  // deciding the user has given up.
  const [handDriven, setHandDriven] = useState<KickoffOutcomePayload | null>(null);
  const onHandDriven = useCallback(() => {
    void loadKickoff().then((outcome) => {
      // `null` is the served-bundle case (no Tauri to answer). Nothing to
      // show, and nothing pretended.
      if (outcome !== null) setHandDriven(outcome);
    });
  }, []);

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
          <span className="flex items-baseline gap-2.5">
            {elapsed !== null && (
              <span
                data-testid="interview-elapsed"
                className="font-mono text-xs text-muted-foreground"
              >
                {elapsed} elapsed
              </span>
            )}
            <span
              data-testid="interview-stage-readout"
              className="font-mono text-xs text-secondary-foreground"
            >
              {stageReadout(stage.approxStage, stage.stageStep)}
            </span>
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
              approxStage={entry.current ? stage.approxStage : null}
              onRetry={onRetry}
              onHandDriven={onHandDriven}
            />
          ),
        )}

        {genesis.listenerFailed && (
          <div
            data-testid="interview-listener-failed"
            className="flex flex-col gap-2 rounded-lg border border-status-verifying-border bg-status-verifying px-4 py-3.5"
          >
            <span className="text-sm font-semibold tracking-heading text-status-verifying-title">
              this half of the screen is not receiving
            </span>
            <span className="text-sm text-secondary-foreground">
              nputer could not subscribe to the planner&apos;s turn channel, so no
              question will appear here even if the interview runs. The plan
              still assembles beside this, and everything written to{" "}
              <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> is
              real — you are just not being shown the conversation. Reopening the
              folder re-subscribes; driving it by hand needs no channel at all.
            </span>
            <div className="flex items-center gap-2.25">
              <Button
                data-testid="interview-listener-hand-driven"
                variant="outline"
                onClick={onHandDriven}
              >
                Drive it by hand
              </Button>
            </div>
          </div>
        )}

        {offer !== null && (
          <div
            data-testid="interview-resume-offer"
            data-turns={offer.turns}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3.5"
          >
            <span className="text-sm font-semibold tracking-heading text-foreground">
              an interview was already running here
            </span>
            <span className="text-sm text-secondary-foreground">
              {resumeSentence(offer.turns, offer.model)} Everything it banked is in{" "}
              <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span>{" "}
              either way — that is the record, and it is what you see on the right.
            </span>
            <div className="flex items-center gap-2.25">
              <Button
                data-testid="interview-resume"
                disabled={busy}
                onClick={() => void resumeInterview(projectDir)}
              >
                Pick up where it stopped
              </Button>
              <Button
                data-testid="interview-fresh"
                variant="outline"
                disabled={busy}
                onClick={() => void freshInterview(projectDir)}
              >
                Start a fresh session
              </Button>
            </div>
          </div>
        )}

        {rejected !== null && (
          <div
            data-testid="interview-session-unusable"
            className="flex flex-col gap-2 rounded-lg border border-status-rejected-border bg-status-rejected px-4 py-3.5"
          >
            <span className="text-sm font-semibold tracking-heading text-destructive">
              your saved session is unusable
            </span>
            <span
              data-testid="interview-session-unusable-why"
              className="font-mono text-sm whitespace-pre-wrap break-words text-status-rejected-foreground"
            >
              {rejected.why}
            </span>
            <span className="text-sm text-secondary-foreground">
              <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">
                {rejected.registryPath}
              </span>{" "}
              is runtime state, not project truth. A fresh session reads the banked{" "}
              <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span>,
              says which stage is next, and carries on — nothing about the project is
              lost.
            </span>
            <div className="flex items-center gap-2.25">
              <Button
                data-testid="interview-fresh"
                disabled={busy}
                onClick={() => void freshInterview(projectDir)}
              >
                Start a fresh session
              </Button>
            </div>
          </div>
        )}

        {handDriven !== null && (
          <HandDrivenBlock outcome={handDriven} onDismiss={() => setHandDriven(null)} />
        )}

        {notStarted && offer === null && rejected === null && (
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

        {outcome !== null && offer === null && rejected === null && (
          <OutcomeNotice
            outcome={outcome}
            projectDir={projectDir}
            onHandDriven={onHandDriven}
          />
        )}
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

/** How the resume offer reads. The model name comes through the
 * registry's READ boundary, so `null` means both "no model recorded" and
 * "recorded, but not a usable name" — the screen says the honest thing
 * for both rather than printing bytes it just refused (T-047-s3). */
function resumeSentence(turns: number, model: string | null): string {
  const count = turns === 1 ? "1 turn" : `${turns} turns`;
  const ran = model === null ? "(model not recorded)" : `on ${model}`;
  return `It got ${count} in ${ran}. You can pick that same session up, or start a fresh one that reads what is already banked and continues from the next stage.`;
}

/**
 * WHAT WAS BANKED HERE, in one sentence (T-070 criterion 4).
 *
 * THE SHAPE THIS CLOSES IS T-029's OWN, ONE LAYER OUT: the fact was on
 * disk, typed, and free to read — `.nputer/sessions.json`, no CLI
 * anywhere in the call — and a user routed to the hand-driven mode
 * because the app could not find their CLI was told nothing about the
 * turns they had already banked with a CLI they have since uninstalled
 * or renamed. Detection is not delivery.
 *
 * The turn count is the record's, and WHERE THE ARTIFACTS ARE is `docs/`
 * under the project the block already names — never a second path and
 * never a second source of truth, because `docs/` is the only thing that
 * was ever project truth (ADR-017 clause 4) and the transcript is not
 * record.
 */
function bankedSentence(record: GenesisRecordPayload, projectDir: string): string {
  const count = record.turns === 1 ? "1 turn" : `${record.turns} turns`;
  return `An interview already ran in this folder and banked ${count} — the work itself is in docs/ under ${projectDir}, which is what the prompt below picks up from.`;
}

/**
 * THE HAND-DRIVEN MODE (criterion 4) — ADR-006's manual interview, as a
 * mode rather than a message.
 *
 * The block is the SAME text `genesis_start` would have put on the
 * child's stdin, assembled by the same Rust function, over a kit that has
 * really been materialized by the time this renders. So the split-view
 * magic survives with zero agent plumbing: paste this into any agent CLI
 * in any terminal, and the right half keeps rendering what lands, chips
 * and stage strip and completion detection included — because every one
 * of those reads FILES rather than the turn stream (T-027's chip rule,
 * T-028's completion rule).
 *
 * NO COPY BUTTON, deliberately. The clipboard is a webview capability
 * this app does not have and will not add for a convenience: ADR-012 says
 * a grant is added by the task that genuinely needs it, and "select the
 * text yourself" is not a need. The block is selectable text.
 */
function HandDrivenBlock({
  outcome,
  onDismiss,
}: {
  outcome: KickoffOutcomePayload;
  onDismiss: () => void;
}) {
  if (outcome.kind !== "ready") {
    return (
      <div
        data-testid="interview-hand-driven-block"
        data-kind={outcome.kind}
        className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3.5"
      >
        <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          hand-driven mode
        </span>
        <span className="text-sm text-secondary-foreground">
          {outcome.kind === "noProject"
            ? "no project is open, so there is nothing to plan."
            : outcome.kind === "alreadyPlanned"
              ? `${outcome.path} already holds a plan.`
              : outcome.message}
        </span>
      </div>
    );
  }
  // A pre-T-070 payload has no `record` key at all; a folder nothing has
  // ever run in has it as `null`. Both mean the same thing here and are
  // collapsed once, at the boundary, rather than at each read.
  const banked: GenesisRecordPayload | null = outcome.record ?? null;
  return (
    <div
      data-testid="interview-hand-driven-block"
      data-kind="ready"
      data-resuming={outcome.resuming ? "true" : "false"}
      data-banked-turns={banked === null ? "none" : String(banked.turns)}
      className="flex flex-col gap-2.5 rounded-lg border border-border bg-card px-4 py-3.5"
    >
      <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
        hand-driven mode
      </span>
      <span className="text-sm text-secondary-foreground">
        Run this in any agent CLI in your terminal — I&apos;ll render what lands.
        {outcome.resuming
          ? " It picks up from what is already banked rather than starting over."
          : ""}
      </span>
      {banked !== null && (
        <span
          data-testid="interview-hand-driven-banked"
          className="text-sm break-words text-secondary-foreground"
        >
          {bankedSentence(banked, outcome.projectDir)}
        </span>
      )}
      <pre
        data-testid="interview-kickoff"
        className="max-h-64 overflow-auto rounded-sm bg-muted px-3 py-2.5 font-mono text-sm whitespace-pre-wrap break-words text-foreground"
      >
        {outcome.prompt}
      </pre>
      <span className="font-mono text-xs text-muted-foreground">
        cwd:{" "}
        <span data-testid="interview-kickoff-cwd" className="break-words">
          {outcome.projectDir}
        </span>{" "}
        · method v{outcome.methodVersion}
      </span>
      <div className="flex items-center gap-2.25">
        <Button data-testid="interview-hand-driven-dismiss" variant="outline" onClick={onDismiss}>
          Hide this
        </Button>
      </div>
    </div>
  );
}

/**
 * A typed outcome that is not `started`/`accepted`, rendered inline as
 * text. Every field it shows is a TYPED fact from the runner — no error
 * string is ever parsed to decide which of these to show.
 *
 * TWO OUTCOMES HAVE THEIR OWN CARD, and they are the two that say the
 * agent CLI cannot be used. `cliNotFound` (T-029 criterion 6) names the
 * binaries the app looked for — const data from the Rust adapter table,
 * never disk-sourced — the project path, and the hand-driven route.
 * `unsupportedVersion` (T-107) names the version the CLI reported and the
 * same route. Neither carries the assembled kickoff prompt:
 * `assemble_kickoff` is a Rust `pub fn` reachable only from Rust, and
 * `GenesisStatusPayload` carries no kickoff — a copyable block needs a
 * fifth genesis command and belongs with T-029.
 *
 * **WHICH OUTCOMES OFFER THE ROUTE IS NOT DECIDED HERE** (T-107).
 * `noticeRoutesToHandDriven` owns that ruling for every arm of both
 * unions, exhaustively, and this component READS it — including for the
 * generic notice below, so an arm ruled routable later reaches the screen
 * instead of quietly doing nothing. The ruling is the only implementation
 * of the rule; the markup is the only rendering of it.
 */
function OutcomeNotice({
  outcome,
  projectDir,
  onHandDriven,
}: {
  outcome: StartOutcomePayload | SendOutcomePayload;
  projectDir: string;
  onHandDriven: () => void;
}) {
  // T-029 criterion 4: the typed not-found becomes the MODE, not just an
  // apology. The prompt is assembled by the same Rust function the spawn
  // uses, over a kit really on disk. ONE element for every card that
  // offers it — the testid is unchanged from T-029 on purpose, because
  // the affordance is unchanged and renaming it would move a pin without
  // moving a behaviour.
  const handDriven = noticeRoutesToHandDriven(outcome) ? (
    <div className="flex items-center gap-2.25">
      <Button data-testid="interview-cli-hand-driven" onClick={onHandDriven}>
        Show me the prompt
      </Button>
    </div>
  ) : null;

  if (outcome.kind === "unsupportedVersion") {
    return (
      <div
        data-testid="interview-cli-outdated"
        className="flex flex-col gap-2 rounded-lg border border-status-verifying-border bg-status-verifying px-4 py-3.5"
      >
        <span className="text-sm font-semibold tracking-heading text-status-verifying-title">
          your agent CLI is older than this app can drive
        </span>
        <span className="text-sm text-secondary-foreground">
          It reports{" "}
          <span data-testid="interview-cli-found" className="font-mono text-sm break-words">
            {outcome.found}
          </span>
          . nputer stops rather than driving a CLI whose flags it cannot be sure
          of — updating yours to its current release is the fix.
        </span>
        {/* THE COMMAND IS DELIBERATELY ABSENT, AND THIS IS WHERE THAT
            REFUSAL IS RECORDED (T-107 criterion 2). `claude install`,
            `claude update`, `brew upgrade`, a package manager's own verb —
            which one is right depends entirely on how this user
            installed, and `unsupportedVersion` carries the `--version`
            line and nothing else: no path, no manager, no channel. An app
            that prints an install command it never ran is T-082's defect
            one layer up, where the shipped `claude login` sent the word
            "login" to a model the user could not reach. So the screen
            says what is true, says why it is not saying more, and hands
            over the one route that needs no CLI at all. */}
        <span className="text-sm text-secondary-foreground">
          It cannot see how you installed it, though, so it will not print an
          update command that might be the wrong one for your machine — that one
          is yours.
        </span>
        <span className="text-sm text-secondary-foreground">
          And you do not have to wait for it: the method is hand-drivable. Run
          your own agent in{" "}
          <span data-testid="interview-outdated-project" className="font-mono text-sm break-words">
            {projectDir}
          </span>{" "}
          and this screen keeps rendering whatever lands in{" "}
          <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span>.
        </span>
        {handDriven}
      </div>
    );
  }

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
        {handDriven}
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
      {handDriven}
    </div>
  );
}

/**
 * One sentence per typed outcome, from its own fields.
 *
 * THIS IS NOT THE ENUMERATION (T-107 criterion 6). Its arms are a subset
 * of the two unions' thirteen kinds and its `default` degrades to the
 * bare kind rather than failing the build — which is the right behaviour
 * for a SENTENCE, where a bare kind on screen is poor and still far
 * better than a crashed pane, and the wrong one for a RULING. The ruling
 * lives in `noticeRoutesToHandDriven`, whose `never` guard makes a newly
 * added arm a compile error until somebody decides about it.
 */
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
      // Rendered by its own block above; this arm exists so the switch
      // stays exhaustive rather than falling through to a bare kind.
      return `a planner session is already recorded here (${outcome.turns} turns).`;
    case "sessionIdRejected":
      return outcome.why;
    case "nothingToResume":
      return "there is no saved session to pick up — start the interview instead.";
    case "staleProject":
      return `the running session belongs to ${outcome.sessionProject}, not the folder now open.`;
    case "unsupportedVersion":
      // Rendered by its own block above since T-107, which gave it the
      // next step this sentence never had. Kept for the same reason
      // `resumeAvailable` is kept — so the switch stays exhaustive rather
      // than falling through to a bare kind.
      return `the agent CLI reports ${outcome.found}, which is older than this app can drive.`;
    case "error":
      return outcome.message;
    default:
      return outcome.kind;
  }
}
