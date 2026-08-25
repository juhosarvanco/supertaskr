---
id: T-027
title: Interview split view — planner chat, challenge treatment, banked answers
feature: F-03
milestone: 3
priority: 5
size: L
status: done
blocked_by: [T-024, T-025, T-026, T-037, T-041, T-048, T-049]
touches: [app-interview, app-shell, tools/e2e/]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Size L: planning pass required before dispatch (chat-state machine ×
runner event contract; banked-marker join semantics; error/retry
states; the design-fidelity reconciliation for a context-fidelity
screen). The demo moment — ADR-008 concentrates the design budget
here. Design source: the `interview` screen of the design bundle
(left pane, values from source): stage strip (7 segments:
done/current/future), quieter history above, the current question
large (17px/500 vs 14px history), the PUSHING BACK block (2px
#b5651d-family left rule, warm paper, "planner · pushing back"
label), inline "banked → <artifact>" chips, input row ('Answer, or
say "skip"…', ⏎ send · ⇧⏎ newline, Bank answer), "one question at a
time · N of 7". Composes T-024's lens (right), T-025's runner
(events), T-026's screen. Model text renders as plain text nodes —
no markdown-to-HTML (fenced).

Absorbs: T-026-s2 (triage 2026-08-16) — this is the second screen that
wants keys, which is exactly the trigger that suggestion named.

COMPOSITION RULED by @human 2026-08-17, after seeing T-024's lens at
full width in a real genesis run (the `streak`/birding demo, five
artifacts landing live): **build the split as designed** — 640px
planner chat on the left, the T-024 lens on the right. The pane earns
its half; the interview is a conversation with the plan assembling
beside it. This settles the question T-027's planning pass has been
held on all day, and it means criterion 1's geometry stands as
written rather than being re-reconciled against a full-width lens.

FIRST FRAME RULED by @human 2026-08-17: the interview AUTO-STARTS on
arrival — the user already clicked "Start an interview" to get here,
and re-asking is the four-step problem T-049 fixed one screen over. An
explicit "Start the interview" affordance stays visible so the
auto-start is a convenience and never load-bearing.

## Acceptance criteria
- WHEN genesis starts THE split view SHALL render 640px chat left +
  the T-024 lens right (the app's own header names the new project — the OS window title
  is not set; that needs a window grant outside `core:default`, and
  the design's chrome bar is mockup furniture), drive
  the interview through T-025's events one question at a time, and
  keep exactly one current question prominent with history quieter
  above (design treatment, tokens-only, both schemes).
- WHEN a planner turn opens with the T-023 challenge prefix THE turn
  SHALL render the pushing-back treatment; IF the prefix is absent
  THEN the turn renders as a normal planner turn (the hint is never
  load-bearing).
- WHEN new/changed docs artifacts land between turns (watcher truth,
  via T-024's derivation) THE chat SHALL insert the "banked →
  <artifact>" confirmation chips from file evidence only — never
  from parsing model output — and the stage strip SHALL follow the
  derived stage.
- WHEN the user sends an answer THE input SHALL support ⏎ send /
  ⇧⏎ newline / the skip convention, disable while a turn is in
  flight (single-flight, the `picking`/`indexing` pattern), and
  render the user turn right-aligned per the design.
- IF a turn fails (typed runner failure) THEN the chat SHALL show a
  calm inline failure with a retry affordance and the interview
  SHALL remain resumable — no dead end, no lost banked docs; pinned
  against fixtures transcribed from T-025's typed failure variants
  (`app/src-tauri/src/agent/runner.rs`'s `TurnError`, named in the
  fixture header) — the fake CLI is a Rust [[bin]] no webview test
  can spawn; the mirror-without-a-comparison is T-041-s2's.
- IF the CLI is missing at start THEN the screen SHALL route to the
  hand-driven fallback state (T-029's surface; until T-029 lands, a card
  naming the typed `cliNotFound { probed }` fact, the project path
  and the hand-driven route is acceptable and stated in notes. It
  does NOT carry the assembled kickoff: `assemble_kickoff` is
  Rust-only and no command returns it, so a copyable block needs a
  fifth genesis command and belongs with T-029).
- IF model output contains hostile content (script-shaped text, RTL
  overrides, 10k-char turns) THEN it renders as text nodes only —
  no injected elements; no-innerHTML grep gate across the pane;
  ADR-009 discipline in every model-keyed collection.
- IF prefers-reduced-motion is set THEN all interview motion SHALL
  have static equivalents (existing motion-safe mechanism).

Verification: headless — vitest state-machine units against fake
runner event scripts; jsdom DOM states (question/challenge/banked/
failed/complete); and a tools/e2e lane walking a full scripted
interview against the real bundle and real CSS through T-041's
`__nputerShellHarness` + the docs harness + this task's DEV-only
interview harness (start → turn → docs land → banked chip →
challenge → failure → retry). AMENDED 2026-08-17: the original third
leg — a served-bundle probe driving the fake CLI to write real files —
described something no browser can do (no Tauri, therefore no runner,
no CLI, no watcher); the spawn → agent-writes → watcher half is
already proven Rust-side by T-025's `writes-docs` scenario and its
two-direction watcher test, and nothing re-proves it from a webview.
@human, listed explicitly: the one-question-at-a-time feel and
challenge treatment judgment, light + dark; the milestone closer's
live run rides T-028.
- WHEN any screen registers a WINDOW-LEVEL accelerator THE app SHALL
  route it through ONE screen-scoped accelerator table rather than a
  second `window` keydown listener: T-026's front-door Cmd-O/Cmd-N
  are ALREADY on it (T-049 lifted them to
  `app/src/components/shell/accelerators.ts`; its "exactly one keydown
  path" tests stay green) and this screen's own keys join it — two independent window listeners
  racing over modifier chords is how key handling rots. Input-local
  keys (Enter send, Shift-Enter newline) are NOT accelerators and stay
  on the input. Out of scope, recorded rather than forgotten: the
  Cmd-vs-Ctrl label and a native Tauri menu, both of which stay with
  T-022 (T-026-s2).

## Implementation plan (size-L planning pass — planner session claude-opus-5, 2026-08-17)

Drafted read-only by the planning session; the architect reviews this section, applies it into `docs/tasks/T-027-interview-split-view.md`, and commits — nothing below is in effect until that commit. Repo facts were verified against the working tree at `main@fa84ebc` on 2026-08-17: `agent-store.ts` read in full, the design bundle's `interview` screen read line by line (lines 499–617), and every test this task must reconcile opened by hand. No model was called; nothing bound or contacted port 1420.

This pass settles the nine questions the dispatch names plus everything a fresh executor would otherwise guess, including **five places where a criterion or the Verification line predates a reality this pass discovered** (§10's amendment block, T-012 §1 precedent). The @human composition ruling of 2026-08-17 — 640px chat left, T-024's lens right — is the fixed point; every geometry decision below serves it.

**Frontmatter changes made by this pass.** `blocked_by` becomes `[T-024, T-025, T-026, T-037, T-041, T-048, T-049]`. All seven are `done`, so this changes no scheduling — it records that four of them are *technical* prerequisites this task must not rediscover: T-037 landed the mount plus two source-grep tests T-027 must reconcile; T-041 landed `__nputerShellHarness` and the genesis lane spec T-027 rewrites; T-048 landed the bounded frame and the `min-h-0` chain assertion T-027 breaks by construction; T-049 landed the accelerator module T-027 extends. `touches` becomes `[app-interview, app-shell, tools/e2e/]` — the third is the T-041 precedent and the guardrail only works if `touches` tells the truth. Verified against the registry: `app/src/genesis/**` is C-13 (`app-interview`); `app/src/components/shell/**`, `App.tsx`, `app/test/**` are C-05 and `app/src/styles/**` is C-11, both carrying `app-shell`. **`app/src/lib/agent-store.ts` is C-14 (`app-agent`) and is therefore not editable by this task — §7 makes that a fence, not an accident.**

### 1. The chat state machine — the store already holds the turns; the UI holds the user's half

**Decision: T-027 adds no reducer for planner turns.** `reduceGenesisEvent` (`app/src/lib/agent-store.ts:181`) already folds the `genesis-turn` channel into `GenesisState.turns: GenesisTurn[]`, and `GenesisTurn` is `{ turn, text, activity[], status: "running"|"completed"|"failed"|"cancelled", truncatedRelay, error }`. **Deltas are already coalesced into `turn.text` inside the store** (`text: t.text + event.text`, :209) and `completed` **replaces** the buffer with the canonical `result` text (:230). So there is no delta coalescing in the UI, no second buffer, and no second reduction implementation. The chat renders `turn.text` as the store gives it.

**The store does NOT hold the user's answers** — `sendGenesisTurn(text)` passes `text` to `invoke` and records nothing. The transcript is therefore a join: *planner halves from the store* ⨝ *user halves the chat records itself*. The chat records `{ turn: N, text }` only when `genesis_send_turn` answers `accepted { turn: N }`; `busy` / `noSession` / `staleProject` / `error` record nothing and render as an inline outcome notice. Turn 1 has no user half by design (its user half is the kickoff, which lives in `.nputer/genesis/transcript.jsonl` and is not exposed by any command) — the chat renders no bubble for it. **Consequence, stated rather than discovered: the user's half does not survive a remount or an app restart.** `refreshGenesisStatus` rebuilds `phase`/`turn`/`nativeSessionId` but never `turns`, so a remount mid-interview shows an empty transcript over a live session. That is T-029's rehydration, named here so nobody builds half of it.

**Ordering.** The transcript is rendered by ascending `turn`; for turn N the order is *user bubble (N≥2) → planner turn N → banked chip row for N* (§2). Everything above the last planner turn is history; **the last planner turn is the "current question"** and carries the 17px/500 treatment (§6) — unless it is a challenge, in which case the pushing-back block wins and carries the `one question at a time · N of 7` footer (§3).

**Mid-stream vs completed.** `status === "running"` renders the text as it stands plus a 5px `bg-chart-4 motion-safe:animate-status-pulse` dot (the `GenesisPane.tsx:105` precedent, so reduced motion is the existing mechanism) and the LAST `activity` label as a quiet mono line. `status === "completed"` drops the dot and the label. `truncatedRelay` renders one honest mono line — the relay stopped at T-025's 1 MiB cap, the turn did not.

**`seq` stale-drop × rendering, settled and pinned.** `reduceGenesisEvent` returns `prev` **by identity** on `event.seq <= prev.seq` (:185), and `setState` is identity-guarded (:311), so `useSyncExternalStore` skips the render. Nothing for the UI to do; the obligation is to *prove* it, because a chat that re-renders on every dropped duplicate is how a stream becomes a stutter. §8's unit replays a full event script twice and asserts the render count is unchanged by the replay.

**`textDelta` after `completed` — the sharp edge, and the executor's first job.** There is no status guard in the reducer: a `textDelta` with a higher `seq` arriving after `completed` appends to the already-canonical text and leaves `status: "completed"`. The user would see the canonical answer with a duplicated tail. **Reachability is a Rust question this pass could not settle from TS alone: it depends on whether `runner.rs`'s relay loop flushes a pending coalesced delta before emitting `completed`.** The executor reads that ordering first, then does exactly one of: (a) unreachable by construction — record the emit ordering with the line reference and pin the store's behaviour as a documented invariant; (b) reachable — pin the observable behaviour in a vitest unit, render it as the store gives it (there is no pure-UI defence once the buffer is polluted), and **file a suggestion against C-14** with the reproduction. Under no circumstance does T-027 edit `agent-store.ts` to fix it (§7).

**Where the state comes from, and how the lane reaches it.** A single hook, `useGenesisState(): GenesisState`, in `app/src/genesis/interview-source.ts`:

- **Under Tauri:** `useSyncExternalStore(subscribeGenesis, getGenesisState)` — the real store, no duplication.
- **Browser + DEV only** (`!isTauri && import.meta.env.DEV`, the byte-identical gate expression `watcher-store.ts:533-534` uses): local state folded with the **same exported `reduceGenesisEvent`**, fed by `window.__nputerInterviewHarness = { push(event), get(), sent }`.

That is T-041's `commitPickOutcome` argument in a different shape: there is only one reduction spelling in the tree, so a parallel implementation would have to be written on purpose. `sent: string[]` records what the UI *asked* to send — the cheapest of T-049-s1's three remedies, scoped to this screen — because `sendGenesisTurn` returns early on `!isTauri` and a served bundle can otherwise prove a keystroke was claimed but never that it reached a command. **`startGenesisListener()` is never called today; T-027 calls it from `App.tsx` beside `startDocsWatcher` (`App.tsx:254-256`)** — an app-shell edit, not a C-14 edit.

Rejected: **a second `listen("genesis-turn")` in the chat** (two subscribers on one channel, two folds, two stale-drop states — the store owns the channel). Rejected: **extending `__nputerShellHarness`** (conceptually cleaner — one gate — but it means editing `watcher-store.ts`, which **T-050 is editing right now**, and the harness would have to reach `agent-store`'s private `setState`; the cost of the second gate is named in §8 and paid down with the same three proofs T-041 used).

**Starting the interview.** The chat auto-starts turn 1 when the mount-time `genesis_status` reports `phase: "idle"` and `turn === 0`. The user's action that reached this screen was literally "Start an interview"; re-asking on arrival is the four-step problem T-049 just fixed one screen over. Three guards, and **T-050's lesson applied preemptively rather than inherited**: the attempt latch is keyed by `projectDir` and set on a *typed outcome*, never before the await; a rejected `invoke` clears it; and **the screen always renders an explicit "Start the interview" affordance whenever `phase === "idle"` and `turns` is empty**, so the auto-start is a convenience and never load-bearing. Outcomes render inline: `cliNotFound` → §5's fallback card; `resumeAvailable` → a plain notice naming T-029's territory; `alreadyPlanned` / `noProject` / `unsupportedVersion` / `error` → an inline notice carrying the typed fields as text nodes. Rejected: **an explicit start card as the only path** (honest, but it makes the flagship screen's first frame a button, and the consent was already given by the button that got here) — recorded as the one-line revert if @human disagrees.

### 2. Banked chips — file evidence only, and exactly what that costs

**The signal is the `DocsModelState` prop the screen already receives, and nothing else.** Not `activity` events (those are tool-use markers off the model's own stream — model output, which criterion 3 bans), not `completed.text`, not the banking map's expectations. **`activity` labels may render as the mid-stream progress line and may never produce a chip; a test asserts an event script whose `activity` labels name docs paths produces zero chips.**

A pure module, `app/src/genesis/interview-model.ts` (C-13, so the standing no-innerHTML gate covers it for free — §8):

```ts
export interface BankBaseline { projectDir: string; seq: number; contents: ReadonlyMap<string, string>; primed: boolean }
export function bankBaseline(docs: DocsModelState): BankBaseline
export function bankedSince(baseline: BankBaseline, docs: DocsModelState): readonly string[]
```

`bankedSince` returns the sorted paths present in `docs.effective` whose content differs from the baseline's, i.e. **added or changed**. Deletions are not chips — a deletion is not a banking. `docs.seq === 0` and `docs.seq <= baseline.seq` return empty and the baseline is unchanged, mirroring `observeDocsChange`'s identity contract (`genesis-derive.ts:206-208`) rather than inventing a second convention.

**Timing and attribution, settled.** On every observation (a `docs` prop whose `seq` advanced), the chat computes `bankedSince`, unions the result into `chipsByTurn[activeTurn]`, and **resets the baseline to the observed state**. `activeTurn` is the highest turn number in `turns` at observation time — running or completed. Consequences, each deliberate:

- **An artifact that lands after `completed` still belongs to that turn.** The watcher's debounce routinely pushes a snapshot past the `result` line; attributing to "the turn that was in flight" alone would silently drop the most common case.
- **An artifact that changes twice between turns produces one chip.** The diff is a set; the files cannot prove two bankings, so the chat does not claim two.
- **A write that lands after the next turn has started attributes to the new turn.** That is what the file evidence supports and the plan does not pretend otherwise.
- **The chip asserts "this file changed on disk at this point in the conversation", not "this turn caused it."** §8 pins this with the sharpest possible test: a change made by a *human writing the file in a terminal* mid-interview produces an identical chip. That is not a bug — it is ADR-006's hand-driven mode rendering correctly, and it is the proof that no causation was inferred.

**Priming — and the one case where a chip can lie.** The baseline is captured when `started { turn: 1 }` is first observed; before that there are no chips. On a docs-less folder (the ordinary path) the baseline is genuinely empty, so turn 1's stage-0 scaffold chips correctly. **On the T-026-s4 shape — genesis over a folder whose `docs/` already holds files but no plan — no snapshot exists at that moment** (`arm_genesis` delegates to `rearm` and nothing emits until the next fs event), so the baseline is empty and the pre-existing files chip falsely on turn 1.

Ranked honestly: priming on the first `seq > 0` state instead would remove that lie and cost **every** interview its turn-1 scaffold chips — a common-path loss traded for a narrow-path lie. **Decision: prime at first-`started`, name the lie, and pin it as a tripwire** (`genesis-screen.spec.ts`'s T-041 precedent: a test that asserts today's wrong answer with a comment naming the task that fixes it, so it cannot silently keep passing). **T-042's criterion 1 removes the case by construction** — see the cover note.

**Rendering.** One chip row per turn, matching the design (line 536): a 14px `bg-review-disc` disc carrying ✓ in `text-review-mark`, then `font-mono text-xs text-status-done-foreground` reading `banked → <path>[, <path>…]`, left-aligned in deliberate contrast to the right-aligned user bubble above it. **Paths, not the design's section names.** The design reads `banked → north star, person`; a section-level claim is not file evidence, and T-024 made exactly this call already (its deviation 2: the design shows `docs/north-star.md`, the pane shows real paths). Cap at 4 paths with a `+K more` tail (T-003's cap discipline); the cap is a UI cap and the underlying set is complete.

**The stage strip follows the derived stage, not the chips.** The chat calls the already-exported `deriveGenesis(docs, EMPTY_CHANGE_LOG, 0)` and reads only `approxStage` and `stageStep` — both independent of the change log and of `nowMs`, so the call is deterministic and the chat adds no clock. Rejected: **exporting a `deriveStage` convenience from `genesis-derive.ts`** — that module carries a test which re-reads `method/interview/plan-interview.md` cell by cell, and touching it for a convenience export buys nothing. `BANKING_MAP` is not edited, read, or transcribed by anything T-027 adds.

### 3. The challenge treatment — detected on the turn's current text, inert by construction

**One pure function**, `challengeOf(text): { challenge: boolean; body: string }`, applied to the turn's *current* text — the streaming buffer while `status === "running"`, the canonical `completed.text` after. That single rule is both halves of the dispatch's question: mid-stream the treatment settles as soon as the first delta carries the prefix, and `completed.text` — T-025's canonical `result` line, the only text the driver contract blesses — is authoritative the moment it lands and overwrites the buffer, so a turn whose deltas were truncated or dropped still gets the treatment at completion, and a turn whose deltas merely *looked* like a challenge loses it.

Match: the first non-whitespace run of the text, **case-insensitive** against the literal `pushing back:`. The method says "the literal prefix"; case-insensitivity is a deliberate widening with a stated reason (models capitalise sentence starts, and a rendering hint that fails on `Pushing back:` is a hint that fails). The prefix and the whitespace after it are **stripped from the rendered body** — the label carries the semantics, and `method/roles/planner.md` is explicit that the transcript is not the record, so nothing is lost.

**Treatment**, values read from the design (lines 539–542): `border-l-2 border-chart-4` (`#b5651d`, exact token), `bg-interview-challenge` (§6's new token, `#fdf6ee`), `rounded-r-lg` — the design's asymmetric `0 10px 10px 0`, square on the ruled edge — `px-4 py-3.5`, `gap-2`; label `font-mono text-xs tracking-overline uppercase text-status-verifying-foreground` (`#84501c`, exact token) reading `planner · pushing back`; body `text-lg` (14.5px, exact) `text-interview-challenge-ink`. Full width — no bubble, no 78% clamp.

**Inertness, proven not asserted.** The prefix is read by exactly one function and consumed by exactly one class list. §8's unit runs the *same* event script twice, once with the prefix and once without, and asserts the two resulting states are deep-equal **except** for the `challenge` boolean and the rendered label — the turn count, the banked chips, the stage strip, the input's enabled state and the footer's `N of 7` are byte-identical. That is what "the hint is never load-bearing" means as a test.

### 4. Input, single-flight, and the screen-scoped accelerator table

**The input is a plain `<textarea>` in `app/src/genesis/`, not a vendored primitive.** `app/src/components/ui/` contains exactly one file (`button.tsx`); T-027 is the app's first form control. Vendoring shadcn's Textarea would drag `data-[state=…]` arbitrary variants into the tree, which is precisely the class T-020-s5 measured as a P1 token-lint false positive on unmodified upstream code — a red lint before the first render. A ~10-line textarea with token classes costs less and lives beside the only screen that uses it. Values from the design (line 557): `border border-input rounded-lg px-3.5 py-3 text-base bg-card shadow-card`, `placeholder:text-muted-foreground`, placeholder verbatim `Answer, or say "skip" and I'll mark it an assumption…` (straight quotes, ASCII apostrophe, single-character U+2026). One row, auto-growing to a bounded max, then scrolling — the design draws a single line and gives no guidance, so the bound is stated rather than discovered.

**⏎ / ⇧⏎ / skip.** `Enter` without `Shift` sends; `Shift+Enter` inserts a newline. **These are input-local handlers, never accelerators** — the criterion says so and `matchAccelerator` requires a modifier anyway. The skip convention is *typed by the user*: the app sends the literal text and the planner does the rest (`method/roles/planner.md` step 2). **No Skip button in v1** — the placeholder is the affordance the design draws, and a button that types a word for you is a feature nobody asked for. Empty or whitespace-only send is a no-op.

**Single-flight, on the store's own flag, not a third one.** `isTurnInFlight(state)` = `state.sending || state.phase === "running"` (`agent-store.ts:289`) is the `picking`/`indexing` pattern's counterpart and already exists; `startGenesis`/`sendGenesisTurn` both guard on it internally. The textarea and the Bank-answer button take `disabled={inFlight}`, **and the ⏎ handler re-checks the flag before calling** — the `disabled` attribute is not the guard, because a keydown can be delivered between state updates. §8 drives this the way T-049's C3 did: a parked `invoke`, then a burst of ⏎ presses, asserting `invoke` was called exactly once and the state is unchanged by identity.

**The accelerator table becomes screen-scoped, and the interview contributes exactly one row.** `App.tsx:268` becomes `useAccelerators(acceleratorsFor(screen, actions))` — a change of **argument**, not of mechanism, exactly as `accelerators.ts:28-36` already predicts. One listener, unchanged; T-049's three instruments (per-chord `preventDefault` count, live-path enumeration, `EmptyState`'s zero registrations) stay green by construction.

- **`openFolder` / `startInterview` are in every screen's table, unchanged.** T-049's criterion 1 says the chords fire from any screen and its tests pin it. Narrowing ⌘N on the interview screen was considered — it opens a picker that can abandon a live interview — and **rejected**: T-025 already types that outcome (`staleProject`, with `genesis_cancel` still available), the picker's own single-flight bounds it, and silently removing an advertised chord on one screen is worse than a typed consequence.
- **`cancelTurn`, on ⌘/Ctrl+`.`** — added to `AcceleratorId` and `matchAccelerator` in `accelerators.ts`, present only in the interview screen's row, calling `cancelGenesis()`. It earns its place because §1 auto-starts turn 1: a screen that spawns a process on arrival owes a way to stop it. ⌘. is the long-established macOS cancel chord, needs no `event.target` inspection (a typed period carries no modifier, so T-049's deliberate target-blindness survives), and is inert when no turn is in flight. Advertised in the hint slot while in flight (`planner is thinking… · ⌘. to stop`), which is a text swap in a slot the design already has rather than a new control.
- **This USES and PINS T-049-s3's property (2)**, one of the two that suggestion names as "the ones that would bite: an accelerator absent from a screen's table must be left completely alone — no `preventDefault`, nothing swallowed. Today deleting that guard leaves 503/503 green. §8 adds the pin: ⌘. pressed on the board is claimed **zero** times and reaches no command, while ⌘. on the interview is claimed exactly once. Half of T-049-s3 discharges here as a side effect of doing this task correctly.
- **`accelerators.test.tsx`'s 26-chord sweep moves** — the app now declares five chords, not four. **Changed, never loosened**: the assertion stays a whole-set equality and every pre-existing chord's verdict is byte-unchanged.
- **Not touched, as T-026-s2 and T-049-s2 both leave them:** the ⌘-vs-Ctrl label and a native Tauri menu stay with T-022.

### 5. Failure, retry, and the CLI-missing fallback

**Typed failures render as a calm inline block in the transcript**, in the position of the turn that failed — never a modal, never a toast, never a screen replacement. The block carries the error's own words as text nodes, capped in the UI, plus one "Try again" button. Per variant (`TurnErrorPayload`, `agent-store.ts:29-36`): `spawnFailed { os }` · `startTimeout` · `stall` · `exitNonZero { code, stderrTail }` · `malformedStream { why }`. The `stderrTail` is already `sanitize_for_log`'d Rust-side (T-025's recorded silence) and is nonetheless rendered under the same ADR-009 discipline as every other model-adjacent string (§8's hostile-content probe covers it).

**Retry re-issues the command that produced the failure, with the same argument, and renders whatever typed outcome comes back.** For turn N≥2 that is `sendGenesisTurn(storedText)`; for turn 1 it is `startGenesis()`, and if that answers `resumeAvailable` the screen surfaces it as a plain notice naming T-029 rather than auto-resuming. Simple, honest, and testable — no retry state machine, no backoff, no attempt counter.

**Resumable, and nothing banked is lost.** T-025 leaves the registry `idle` after every failure and the runner never opens a path under `docs/`, so this is by construction: after a failed turn the input re-enables, the lens keeps rendering, and every chip already emitted stays. §8 pins exactly that (chips before the failure are still present after it) because "no lost banked docs" is the criterion's phrase and it deserves a positive assertion rather than the absence of a crash.

**What T-029 owns, so the fence is clean:** auth classification (`AuthFailed { status, message }` — T-025's smoke proved the CLI reports 401 in-band on stdout with an empty stderr and `subtype: "success"`, which is why `exitNonZero` is what T-027 receives today and why T-027 renders it verbatim rather than guessing); `terminal_reason` / `permission_denials`; restart resume and transcript rehydration; the fresh-session fallback; and where "an interview was running on `<folder>`" is persisted (the `.nputer/` registry, T-026-s3's fold). **T-027 parses no error text for any reason.**

**The CLI-missing card, and why criterion 6's parenthetical must change.** `cliNotFound { probed: string[] }` routes to a fallback card carrying: the typed fact (the binary names the app looked for — const data from the adapter table, never disk-sourced), the project path, and one sentence saying the method can be hand-driven in a terminal while this screen renders what lands. **It does NOT render the assembled kickoff prompt, because no command exposes it.** `assemble_kickoff` is a Rust `pub fn` reachable only from Rust; `GenesisStatusPayload` carries `phase / projectDir / turn / nativeSessionId / cliVersion / methodVersion / lastError / lastEventAtMs` and no kickoff. A copyable kickoff needs a fifth genesis command — new IPC, an `acl_pin.rs` roster line and a capabilities regen — which is squarely T-029's, since T-029 is the task whose criterion asks for it. Amendment text in §10.

### 6. Geometry inside the bounded frame — the split, its two scroll regions, and where it degrades

**The split is flush, not gapped.** The design (line 509) is `width:640px; flex:none; border-right:1px solid #ededed`; the right pane (line 565) is `flex:1; min-width:0; background:#fafafa` with no border and no radius. The 1px rule belongs to the chat side. There is no gap element and no card frame anywhere between them.

**So `GenesisScreen.tsx` loses its interim chrome.** Today it renders an `interview` overline, an `<h2>` with the project dir, an explanatory paragraph, `px-10 py-9`, and a `rounded-lg border border-border bg-card shadow-card` box around the pane — every one of which T-026 built as an acknowledged placeholder ("the genesis screen has no design source in this task — T-027 fills it") and which T-037's @human item 1 flags as a sidebar tone inside a card the design never draws. T-027 replaces all of it:

```
<section data-testid="genesis-screen"  className="flex min-h-0 flex-1 flex-col">
  <div data-testid="genesis-split"     className="flex min-h-0 min-w-0 flex-1">
     <InterviewChat …/>                      ← w-160 shrink-0 border-r border-hairline  (split on)
                                               mx-auto w-full max-w-160                 (split off)
     <div data-testid="genesis-pane-slot" className="hidden min-h-0 min-w-0 flex-1 lg:flex lg:flex-col">
        <GenesisPaneBoundary resetKey={docs.seq}><GenesisPane docs={docs} /></GenesisPaneBoundary>
```

`w-160` is 640px exactly (`--spacing-unit: 0.25rem`). **`GenesisScreen.tsx` stays IPC-free and timer-free** — `genesis-mount.test.tsx:141-157` forbids `invoke`, `listen(`, `setTimeout` and seven more strings *in this file's source text*, and that gate is kept, not weakened; every scrap of the conversation half lives in `app/src/genesis/`. The same test pins `<GenesisPane docs={docs} />` by regex (`:142-143`); that pin **must be re-derived** for the new nesting, changed never loosened.

**Two scroll regions now.** The chat's transcript is `min-h-0 flex-1 overflow-y-auto` between a fixed header (the stage strip) and a fixed input row; the lens keeps its own `overflow-y-auto` region untouched. The chat sticks to the bottom **only when the user is already at the bottom** — a pure `shouldStickToBottom(scrollTop, scrollHeight, clientHeight, threshold)` helper unit-tested in vitest (jsdom has no layout, so the *policy* is pinned there) and the *behaviour* pinned in the lane with real layout and a trusted `page.mouse.wheel`, the T-048 precedent. The design draws no scroll region at all (it draws an 800px-tall pane); this is stated as an extension, not a reading.

**The `min-h-0` chain test breaks, by construction, and is re-derived.** `app/test/shell-frame.test.tsx:258-263` pins the exact array `["div.flex", "genesis-pane", "genesis-pane-slot", "genesis-screen"]`. The new link needs `min-h-0` **and** a `data-testid` to get a stable name — hence `genesis-split` above, giving `["div.flex", "genesis-pane", "genesis-pane-slot", "genesis-split", "genesis-screen"]`. T-048's own flags say this test "will go red and should be re-derived, not deleted"; T-027 additionally **adds a second chain** for the chat's log region, so both scroll regions are protected rather than one.

**Degradation, COMPUTED rather than measured — and computed wrongly; see the correction below.** The genesis column has no horizontal padding of its own now, so at viewport W the split has W to divide. The chat's 640 is BORDER-BOX, so the 1px rule sits INSIDE it and the lens gets W−640: at 1440 → 800, at 1280 → 640, at 1024 → 384, and 160 at 800 — where the lens does not render at all, so that last row is arithmetic and never was a measurement. **Decision: the split renders at Tailwind's existing `lg` breakpoint (1024px) and above; below it the lens is not rendered and the chat centres at `max-w-160`.** One existing default breakpoint, no new token, no config change, no new responsive vocabulary — which matters because T-027 is the app's first responsive call site and T-038-s1 is still open on whether breakpoints are tokens. At 1024 the lens has 384px: tight but complete (rows `truncate`, the backbone grid wraps). At 1280 it has 640px, the geometry the design draws.

**CORRECTED 2026-08-25 (T-108, at `43f995a`), AND THE LABEL IS WHY THIS OUTRANKED ITS SIBLING.** This paragraph read *"**Degradation, measured rather than guessed.** … 640 chat + 1px rule leaves the lens W−641: at 1440 → 799 (the design's own number), at 1280 → 639, at 1024 → 383, at 800 → 159"*, and closed *"At 1024 the lens has 383px … At 1280 it has 639px"*. **It was not measured. It was computed, and computed wrongly** — the 1px rule was ADDED to the 640, when Tailwind's preflight sets `box-sizing: border-box` on everything, so the rule is inside the 640 and comes off the chat's own content, never off the lens. **A reader who stopped here had been told the number came from the app**, which is the difference between this and the plain wrong figure T-074 fixed one level downstream. The QUALITATIVE claims are untouched and were never in question: the breakpoint, the `lg` decision, "tight but complete" at the narrow end, and the geometry the design draws.

**THE TWO CORRECTIONS BELOW ARE OLDER THAN THIS ONE AND STAY EXACTLY AS THEY ARE.** This file already fixed the arithmetic twice — the implementation notes' *"The lens gets W−640, not W−641"* and the verdict's *"384 / 640 / 800"* — so the defect was never that the card failed to notice. It is that **the wrong number came FIRST and wore the word "measured"**, and the two later corrections could not reach a reader who never got to them. That ordering is the finding; the corrections are not clutter and are not tidied away. The falsified arithmetic also reached `app/src/components/shell/GenesisScreen.tsx`'s comment **from here** — T-074 corrected it there at `e83ee1d` — so after T-074 the last live site still teaching W−641 was the plan section of the card that invented it.

**AND THE DESIGN NEVER SAID 799 EITHER — the half this card never had.** The parenthetical *"(the design's own number)"* was the second error inside the first, and it is the same border-box slip one step further back. Measured headlessly in Chromium at `e83ee1d` (T-074) over the `data-screen-label="Interview"` artboard of `docs/design/claudedesign_handoff/nputer app.dc.html`; that file is **byte-identical at `43f995a`** (sha256 `07d8b43d…`), so the measurement carries to this ref rather than being re-asserted at it. The artboard is a **1440px BORDER-BOX frame carrying its own 1px window chrome** (`width:1440px; border:1px solid #dcdcdc`), so it has **1438** to split; the chat column is `width:640px` with a 1px right rule (rect 640, client 639) and the right half is `flex:1` — **798**. In the app the VIEWPORT is the frame and carries no chrome, so the same design ratio gives 1440 − 640 = **800**. **799 is NEITHER of them: it is what you get by subtracting the 1px rule twice** — once in the artboard's chrome and once in the chat's own border — which is exactly the arithmetic that produced it.

**The consequence, stated plainly and flagged to @human: at the app's own configured 800×600 window the lens does not render.** The interview is usable — the chat takes the frame, and T-048's measurements say the frame holds — but the half the human just ruled "earns its half" is invisible at the size the app opens. **T-027 deliberately does not change `tauri.conf.json`**: the window size governs every screen, it triggers the BOOT GATE and sits beside T-048-s5's missing `minHeight`, and a flagship screen's width requirement is a reason to raise the default window, not a licence for this task to do it in passing. Recorded as the cover note's third finding. Alternatives rejected with costs: **shrinking the chat below 640** (violates the ruling's geometry and gives the lens 300-odd px anyway); **stacking the halves vertically** (two ~250px scroll regions inside a 600px frame — worse than one good one); **`xl` (1280) as the threshold** (drops the lens at 1024×768, one of T-048's own three pinned viewports).

**Ruling on T-048-s1, which named T-027 as the decider.** The **decision** is taken here: bounded frames everywhere, growing pages nowhere — two scroll models in one shell is a thing users feel and cannot name. The **work** is not taken here, and the conditional at `App.tsx:313` stays, because collapsing it requires a sticky rail, a board scroll region, and **T-048-s2's map-canvas fix first** (the canvas is `overflow-hidden` with no scroll region under it and clips silently the instant anything bounds it) — three changes across two screens T-027 does not touch, each owing its own before/after measurement at three viewports. That belongs in its own S/M card, and this pass recommends it be filed with T-048-s2 as its prerequisite.

**Tokens.** Two new, added to `app/src/styles/tokens.css` and mapped in `app/src/index.css` (both C-11/C-05, both `app-shell`, both in `touches`): `--interview-challenge-bg` (light `#fdf6ee`, exact from the design) and `--interview-challenge-ink` (light `#3f2b1a`, exact). Every other value in the pane maps to an existing token — `#b5651d`→`--chart-4`, `#84501c`→`--status-verifying-fg`, `#1f7a58`→`--review-disc`, `#2f7256`→`--status-done-fg`, `#f5f5f5`→`--muted`, `#e2e2e2`→`--input`, `#171717`→`--foreground`, `#111`/`#fafafa`→`--primary`/`--primary-foreground` — all exact. **There is no dark interview screen in the design bundle** (the `sc-if` list carries `boardDark` and `mapDark` and no `interviewDark`), so the two dark values are derived by family the way `--status-verifying-bg/-fg` inverts (`#fce6d2`/`#84501c` → `#2c1a0c`/`#e8a468`): starting point `--interview-challenge-bg` dark `#1d1710`, `--interview-challenge-ink` dark `#e4d3c0`, refinable by the executor and **flagged to the @human dark pass as the one place the design cannot be followed, only extended.**

**Disclosed deviations beyond nearest-step rounding**, each with its reason. (1) **Line heights**: the design's 1.55 / 1.6 / 1.5 against the token pairs' 1.43 / 1.45 / 1.41 — the largest systematic gap in the pane; the tokens are taken and the deviation is flagged, because chat prose wanting more air is a judgment @human should make once rather than a token this task should invent. (2) **10px overlines → `text-xs` (11px)** and **ls 0.1em → `tracking-overline` (0.12em)** — no 10px step and no second tracking step exist. (3) **The three-step recency ink ladder** (`#525252` → `#262626` → `#171717`) **collapses to two**: all history at `text-secondary-foreground`, the current question at `text-foreground` — which is exactly what criterion 1 asks for ("one current question prominent with history quieter above"); a positional gradient across a live transcript is a nuance the criterion does not ask for and the design's own instance is explainable as its pre/post-challenge split. (4) **The user bubble's `max-width:78%` becomes `max-w-114` (456px)** — 78% of the 640px pane's content box, so the two coincide at the fixed width and stay stable when the chat is alone. (5) **Hairlines `#ededed` → `border-hairline` (`#e5e5e5`)**, the identical call T-024 disclosed. (6) **Strip segment radius 2px → `rounded-full`** (1.5px effective on a 3px bar); 2px is below the radius scale and `rounded-[2px]` is a token-lint P1 violation. (7) **The stage readout**: the strip's 7 segments are interview stages 1–7, while `approxStage` is 0–8 — stage 0 renders all-future with `scaffold` and no "of 7", stage 8 renders all-done with `decomposition · 7 of 7`; the chat writes `stage N of 7` where T-024's pane writes `stage ~N`, so the two halves phrase the same approximation differently and that is flagged. (8) **The design's chat header, footer line, and input row are drawn only mid-interview** — the empty, failed, and cli-missing states have no design source and are built from the nearest precedent in the existing vocabulary, T-024's deviation 3 pattern.

Every new utility must be confirmed to **emit** into `dist/assets/index-*.css` (T-024's protocol) — Tailwind's stock scales are disabled in `index.css`, so an unmapped token yields a silently dead class.

### 7. Module layout, and what T-027 must not edit

New, all under `app/src/genesis/**` (C-13, `app-interview`) — which also means the **standing recursive no-innerHTML gate** at `genesis-pane-dom.test.tsx:315-336` covers every one of them the moment they exist, satisfying the criterion's "no-innerHTML grep gate across the pane" by construction:

    interview-model.ts      pure: bankBaseline / bankedSince / challengeOf /
                            shouldStickToBottom / stage-strip mapping
    interview-source.ts     useGenesisState(): the Tauri subscription, the
                            DEV-only harness twin, the send recorder
    InterviewChat.tsx       the pane: header + strip, transcript, input row
    interview-turns.tsx     turn/chip/challenge/failure presentational pieces

Modified: `app/src/components/shell/GenesisScreen.tsx` (the split; still IPC-free), `app/src/components/shell/accelerators.ts` (`cancelTurn`), `app/src/App.tsx` (`startGenesisListener()`, `acceleratorsFor(screen)`, the header's project line extended to genesis), `app/src/styles/tokens.css` + `app/src/index.css` (two tokens + their mapping), the reconciled tests, and `tools/e2e/tests/genesis-screen.spec.ts` + a new interview spec.

**Not editable, and each for a stated reason:**

- **`app/src/lib/agent-store.ts`** — C-14, `app-agent`, not in `touches`. It already exposes everything the chat needs; the one defect §1 names is filed, not fixed.
- **`app/src/lib/watcher-store.ts`** — C-10 is `app-shell` so this is a *lane* fence rather than a slug fence: **T-050 is `status: building` on that exact file right now** and was serialized behind T-049 for precisely this reason. Nothing in this plan needs it.
- **`app/src/genesis/GenesisPane.tsx` and `genesis-derive.ts`** — T-024's landed module. The chat calls the exported `deriveGenesis` and edits nothing. `BANKING_MAP` is normative-transcribed and coupled to `method/` by a test; leave it alone.
- **`app/src-tauri/**`** — zero Rust. The ACL surface therefore cannot have moved, and that is proven by the empty diff rather than by a regen.
- **`method/**`** — the pass reads the driver contract and changes nothing in it.

**The screen's props do not change**: `GenesisScreen` still takes `{ projectDir, docs }`, and everything the chat needs beyond that it gets from the store. The T-026 seam holds without a widening.

### 8. Test strategy — what is vitest, what is the lane, what is honestly @human

**No real model call anywhere, by construction:** T-027 adds no Rust, and the only path from the webview to a CLI is `invoke`, which is mocked at the boundary in vitest and returns before `invoke` in the browser (`!isTauri`). Nothing in this task can spawn a process.

**vitest units** (`app/test/interview-model.test.ts`, node env), against scripted `GenesisEvent[]` arrays: turn assembly and user/planner interleave; the identity/no-render property under a replayed script; `textDelta`-after-`completed` (§1's pinned answer, whichever it is); `challengeOf` across prefix present / absent / mid-word / leading whitespace / uppercase / split across deltas; the **inertness pin** (same script ± prefix → deep-equal but for one boolean); `bankedSince` over add / change / change-twice / delete / no-op; chip attribution across turn boundaries, including after-`completed` and after-next-`started`; the priming rule and the T-026-s4 tripwire; caps and dedupe; `shouldStickToBottom`.

**vitest jsdom** (`app/test/interview-chat-dom.test.tsx`), the states the criteria name: question, challenge, banked, failed-with-retry, in-flight-disabled, cli-missing, empty/not-started. Plus, in the register this repo uses: **hostile content** — a 10k-char turn, `<script>`/`<img onerror>`, an RTL override and a NUL in turn text, in `stderrTail`, in `activity` labels and in chip paths, asserted by the *absence of the elements* plus the presence of the literal bytes as text, with zero `on*` attributes anywhere; **reduced motion** — the streaming dot carries `motion-safe:` and no bare `animate-status-pulse` exists (T-024's exact form); and **ADR-009 discipline** in every model-keyed collection (turns keyed by number, chips by path, both through null-prototype maps or arrays, never object literals keyed by model-supplied strings).

**The lane** (`tools/e2e/`), against the real bundle and real CSS: `__nputerShellHarness` drives phase `genesis`, `__nputerDocsHarness` pushes T-024's `streak` fixture, and the new `__nputerInterviewHarness` pushes a scripted event stream. It walks a full interview — start, question, answer, challenge, banked chips, failure, retry — asserting phases through `expectPhase`, computed colours through `tokenColor` (the challenge rule and warm paper resolved from the served sheet, both schemes via a trusted Toggle-theme click), the two scroll regions with a trusted `page.mouse.wheel`, the split present at ≥1024 and absent below, and a real ⏎ producing a recorded send attempt with the typed text. **T-041's `genesis-screen.spec.ts` must be re-derived**, not deleted: it asserts the pane's strings inside `genesis-pane-slot` at the lane's 1280×720 (still true) and T-048's three-viewport sweep includes 800×600, **where the slot no longer renders** — that assertion changes and the comment says why.

**The DEV harness's cost, paid the way T-041 paid it.** A second dev-gated window property is a second gate to audit, and T-041 argued for one. Three proofs: the gate *expression* is byte-identical and a test asserts both harnesses live behind the same `!isTauri && import.meta.env.DEV` shape; the Tauri path never defines it (asserted with a positive control first, so "absent" cannot pass for the boring reason that nothing ran); and a **bundle grep** over `dist/assets/*.js` proves `__nputerInterviewHarness` contributes zero bytes, with in-bundle controls in the same file and the staleness guard T-037 built. Both halves are **drilled**: flip `DEV` to `true` → the bundle test reds; drop `!isTauri` → the runtime test reds.

**Reconciled, each declared loudly with its diff and its strength argued** (the T-049 precedent, and the STATE open question "who owns the property a retired test was reaching for" answered in advance — every dropped assertion names its new home): `genesis-mount.test.tsx` (the `<GenesisPane docs={docs} />` regex; the forbidden-strings list **stays**), `shell-frame.test.tsx` (both `min-h-0` chains), `accelerators.test.tsx` (five declared chords, whole-set equality), `genesis-entry.test.tsx` (steps 4–6 read the screen's new structure), `genesis-screen.spec.ts` (above). Nothing is deleted; nothing becomes `toContain`, `arrayContaining`, `toHaveLength` or `.skip`.

**What the fake CLI can and cannot do here.** T-025's `fake_agent` is a Rust `[[bin]]` driven by `cargo` integration tests; **vitest cannot reach it and a served bundle has no Tauri, so no browser test can drive a real spawn.** T-027 consumes the failure fixtures as their *event shapes*, transcribed into a TS fixture module whose header names `app/src-tauri/src/agent/runner.rs`'s `TurnError` as the source of truth. That is T-041-s2's exact gap — a wire shape pinned in Rust, mirrored by hand in TS, compared nowhere — widened by one more mirror, and it is named rather than quietly widened. The honest closer (a cargo test that dumps real emitted event JSON into a committed fixture the TS suite reads) requires editing `app/src-tauri/tests/agent_runner.rs`, which is `app-agent`; recorded as the growth step and left with T-041-s2.

**Honestly @human**, listed and never performed here: the one-question-at-a-time feel and whether the current question is big enough to be the only thing on the left; the challenge treatment's judgment, **light and dark** — the two new tokens have no dark source at all; the eight disclosed deviations, especially the line-height gap read at real size; the 640/lens balance at 1280 and 1440; **the 800×600 consequence** (no lens at the app's own window size) and whether the default window should move; and whether the header's "nputer + project path" reads as the design's "nputer — new project". The milestone closer's live run rides T-028; one real observed planner turn remains the biggest unobserved thing in the project (T-025-s2).

### 9. Out-of-scope fence (do not build)

- **No T-028**: no lens→board switch, no card-rain transition, no completion state, no elapsed timer, no CTA into the board, no rail restoration.
- **No T-029**: no restart resume, no transcript rehydration, no auth classification (`exitNonZero` is rendered verbatim), no fresh-session fallback, no copyable kickoff block, no persistence of "an interview was running here".
- **No `app/src-tauri/**`** — zero Rust, zero new commands, zero grants, `EXPECTED_GRANTS` untouched by construction. **No `setTitle`**: the OS window title stays as the manifest sets it; a title change needs a window grant outside `core:default` and the design's chrome bar is mockup furniture (it also draws the OS traffic lights).
- **No `agent-store.ts`, no `watcher-store.ts`, no `GenesisPane.tsx`/`genesis-derive.ts`, no `method/**`** — §7's reasons.
- **No markdown rendering.** Model text is plain text nodes; the criterion fences it and a test asserts a turn containing `**bold**`, a fenced block and a link renders those bytes literally.
- **No global scroll-model change** (T-048-s1 ruled, not built — §6), no `tauri.conf.json`, no window-size change, no board/map/front-door changes.
- **No new dependency** — no textarea library, no markdown library, no virtualiser, no animation library; `package.json` and both lockfiles zero-diff.
- **No new component declaration** — everything lands in C-13's and C-05's existing territory, so the three-fixture registry rule does **not** fire and `lib/parser/test/smoke.test.ts` must not move.

### 10. Criteria amendments, verification protocol, dispatch note, silences

**Criteria amendments (exact text), T-012 §1 precedent — applied by the architect at this section's commit.**

*Criterion 1's parenthetical* `(window label "nputer — new project")` becomes:

> (the app's own header names the new project — the OS window title is
> not set; that needs a window grant outside `core:default`, and the
> design's chrome bar is mockup furniture)

*Criterion 5's* `pinned against the fake-CLI failure fixtures` becomes:

> pinned against fixtures transcribed from T-025's typed failure
> variants (`app/src-tauri/src/agent/runner.rs`'s `TurnError`, named in
> the fixture header) — the fake CLI is a Rust `[[bin]]` no webview
> test can spawn; the mirror-without-a-comparison is T-041-s2's

*Criterion 6's parenthetical* becomes:

> (T-029's surface; until T-029 lands, a card naming the typed
> `cliNotFound { probed }` fact, the project path, and the hand-driven
> route is acceptable and stated in notes. It does NOT carry the
> assembled kickoff: `assemble_kickoff` is Rust-only and no command
> returns it, so a copyable block needs a fifth genesis command and
> belongs with T-029)

*The last criterion's* `T-026's front-door Cmd-O/Cmd-N move onto it unchanged (their unmount-scoping test stays green)` becomes, per T-049-s2:

> T-026's front-door Cmd-O/Cmd-N are already on it (T-049 lifted them to
> `app/src/components/shell/accelerators.ts`; its "exactly one keydown
> path" tests stay green) and this screen's own keys join it

*The Verification line's third leg* — `served-bundle probe walking a full scripted interview over the fake CLI writing real files into a temp project (the whole loop: spawn → turn → agent writes → watcher → banked chip)` — describes something no served bundle can do: a browser has no Tauri, hence no runner, no CLI and no watcher. Replace with:

> tools/e2e lane walking a full scripted interview against the real
> bundle and real CSS through T-041's `__nputerShellHarness` + the
> docs harness + this task's DEV-only interview harness (start → turn
> → docs land → banked chip → challenge → failure → retry). The
> spawn → agent-writes → watcher half is already proven Rust-side by
> T-025's `writes-docs` scenario and its two-direction watcher test;
> nothing re-proves it from a webview.

All other criteria stand unchanged.

**Executor proof obligations:**

1. Suites green at branch-point truth. Today's record: lib/parser **159/159**, app **507/507 (30 files, after `npm run build`)**, bare `cargo test` **217 + 3 ignored**, lane **36**, `lint:tokens` clean at 38 files. T-050 will move the app and lane counts; branch-point truth governs and deviations are noted (T-023 precedent).
2. Every new test body execution-swept: `expect("PROBE").toBe("EXECUTED")` as the first statement of every new/changed body, run, reverted, sha256-verified against pre-probe copies.
3. §1's `textDelta`-after-`completed` question answered from `runner.rs`'s emit ordering, with the line reference, and pinned either way; a suggestion filed if reachable.
4. The banked-chip semantics drilled: the human-writes-the-file test (identical chip, no causation claimed); change-twice → one chip; delete → no chip; an `activity`-labelled path → zero chips; the T-026-s4 tripwire red-when-fixed with its comment naming T-042.
5. The challenge inertness pin: same script ± prefix, deep-equal but for one boolean.
6. Single-flight drilled with a parked `invoke`: an ⏎ burst yields exactly one `invoke` and state unchanged by identity; release, next send works.
7. Accelerators: ⌘. claimed exactly once on the interview and **zero** times on the board/map/front door (T-049-s3 property 2, newly pinned); T-049's three instruments still green; the 26-chord sweep re-derived at five declared chords.
8. The DEV gate proved both ways and drilled both ways (§8), including the zero-bytes bundle grep with in-bundle controls.
9. Geometry measured, before → after, at 800×600 / 1024×768 / 1280×720 / 1440×900: page `scrollHeight` equals the viewport at every one; both scroll regions engage; the split present at ≥1024 and absent below; **the other screens byte-identical** (front door, no-plan card, board, map) — T-048's criterion-4 table re-run, since T-027 restructures the screen T-048 bounded.
10. Tokens: every new utility confirmed present in the built stylesheet; `lint:tokens` clean; both new tokens carrying light **and** dark values.
11. Every reconciled test declared with its diff and its strength argued; no assertion loosened; every dropped assertion names its new home.
12. Fence audit: `git diff --stat` confined to §7's list; zero diff to `app/src-tauri/**`, `app/src/lib/**`, `app/src/genesis/GenesisPane.tsx`, `genesis-derive.ts`, `method/**`, `lib/parser/**`, `capabilities/**`, `tauri.conf.json`, `docs/architecture/graph.json`, every manifest and every lockfile.
13. **BOOT GATE fires** (`app/src/**`): `NPUTER_BOOT_PORT=<free scratch port> npm run boot:check`, result recorded — or declared UNRUN **loudly** with the reason and the exit code if the dispatch fences 1420 (T-049's precedent; a skipped gate is news, never silence).
14. Graph regen delta **measured in-branch and restored byte-exact**, not forecast. Expected shape: `app/src/genesis/` gains four files and `app/test/` gains two, all inside existing component territory; **C-13 gains an import edge into C-14** (`interview-source.ts` → `agent-store.ts`), which C-13's `depends_on: [C-10, C-11]` does not declare — so a new `["C-13","C-14",…]` relation row and possibly a D1 finding appear. Either declare `C-14` in C-13's `depends_on` in-branch (the honest option; it moves the relation table and the map edge count but **not** `lib/parser/test/smoke.test.ts`, which pins only the id array) or record the undeclared row deliberately. `tools/e2e/**` stays invisible (`.nputerignore` carries `tools/`).

**Verifier's likely attack surface, flagged now:** (1) prove a chip cannot come from model output — feed `activity` labels and `completed.text` naming real paths and require zero chips; (2) attack the priming rule with a snapshot that arrives before `started`, and with a project switch mid-interview; (3) replay and re-order events (duplicate `seq`, `completed` before `textDelta`, a `started` for a turn that never existed) and require no crash and no phantom turn — `upsertTurn` silently creates a turn for an unseen number; (4) plant a second `useAccelerators` and confirm T-049's instruments still catch it, then confirm ⌘. is genuinely inert off-screen by deleting `useAccelerators`' absent-entry guard; (5) drive the split at 1023/1024/1025 px and at the app's own 800×600, and re-measure T-048's four other screens; (6) hostile content through *every* string channel including `stderrTail`, `activity`, `probed` and chip paths, asserting zero `on*` attributes and zero injected elements; (7) attack the DEV gate (`NODE_ENV=development npm run build` is the one lever T-041's verifier found — T-041-s4); (8) confirm zero Rust and therefore zero ACL movement without taking it on report; (9) re-derive the graph delta independently, especially the C-13→C-14 edge.

**Dispatch note.** Builds in the **app-shell lane strictly after T-050 merges** — T-050 is `building` on `App.tsx` and `watcher-store.ts`, and T-027 edits `App.tsx` at the accelerator mount, the screen render site and the header's project line. The `app-interview` half is free. If T-042 is dispatched first (recommended — cover note), T-027 rebases on it and the §2 tripwire flips from "pins the lie" to "pins the fix". Executor reads, in order: this section top to bottom; the design bundle's `interview` screen lines 499–617 **directly**, not this summary of it; `method/roles/planner.md`'s driver contract and `method/interview/plan-interview.md`'s banking table; `agent-store.ts` in full; T-025's §§1–10 and its notes (the four commands, the caps, the 250 ms bound, the in-band auth defect); T-024's derivation and its deviation table; T-048's measurement tables and its flags; T-049's module header and T-049-s2/s3; T-041's harness and gate proofs; ADR-017 and ADR-009. Integrator at merge: graph regen (the rule fires), BOOT GATE (`app/src/**`), ARCHITECTURE's C-13 status cell and the Genesis interfaces line, ROADMAP's milestone-3 progress narrative (this one **does** add a user capability), STATE.

**Genuine silences, left open deliberately.** The user's half of the transcript does not survive a remount (T-029's rehydration) · the T-026-s4 false-chip case, tripwired here and closed by T-042 · `textDelta`-after-`completed` (pinned, not fixed — C-14's) · no dark interview mockup exists, so two tokens are family-derived and unchecked · the design's line heights are looser than every token pair and the tokens win, pending @human · the three-step recency ink ladder collapsed to two · the lens is absent at the app's own 800×600 window, and the window size is not this task's to change · T-048-s1's global scroll unification decided but not built · T-041-s2's wire mirror widened by one and not closed · T-049-s4's `event.key` layout limitation inherited unchanged, now with a fifth chord riding it · render volume under a long streaming turn is unthrottled and unmeasured (the measurement to take: renders per turn under T-025's `happy` scenario) · **T-047-s3 has no caller here** — no command exposes `model`, and T-027 renders neither `model` nor `cliVersion` · the packaged wkwebview is still not what the lane drives (T-020's standing limit) · Windows remains the repo-wide standing silence.

## Implementation notes

Built by `claude-opus-5 @fresh` on branch `t027-split-view`, cut from the
**checkpoint** `e92056a` (`Checkpoint: T-042 done`) and not from the
merge — every graph regen in this project's history has landed in a
checkpoint, six for six, and T-014 is the worked example of what a lane
cut from a merge inherits. Worktree-only; nothing committed to main.

**No model was called anywhere.** T-027 adds no Rust, and the only path
from the webview to a CLI is `invoke`, which is mocked at the boundary in
vitest and returns before `invoke` in a browser. Nothing in this task can
spawn a process. **Port 1420 was never bound, connected to or signalled**
— see the note at the end of this section, which the human should read.

### Suites — before → after, all re-derived first-hand at the branch point

| Suite | Branch point `e92056a` | After |
|---|---|---|
| lib/parser (`npm ci` + build + `vitest run`) | 197/197, 10 files | **197/197, unmoved** (0-byte parser diff) |
| app (`npm install` + `npm run build` + `vitest run`) | 625/625, 35 files | **718/718, 38 files** (+93, +3 files) |
| app/src-tauri bare `cargo test` | 220 passed + 3 ignored, 11 binaries, 0 warnings | **unmoved — zero Rust in this task** |
| tools/e2e (`npm ci` + `npm test`) | 54 passed | **60 passed** (+6) |
| `npm run lint:tokens` | clean, 99 files, zero allowlist | **clean, 107 files, zero allowlist** |
| `npm run lint:tokens -- --selftest` | 49 samples + 14 walk-policy | **unmoved, green** |

`npx tsc --noEmit` clean in app and in tools/e2e; `npm run build` exit 0.
Ports: the lane ran on **14601**, the boot gate on **14602**, both probed
free first and both `lsof`-empty afterwards. 1420 was never touched.

**The cargo baseline was taken twice**, because the first attempt piped
`cargo test` through `tail` and lost eight of the eleven test binaries —
the CONVENTIONS gotcha, reproduced and then obeyed: the real run wrote to
a file with the exit code from `$?` and summed 11 binaries to 220 + 3.

### Criteria → evidence

**Criterion 1 — 640px chat + the lens, one question at a time, history
quieter, tokens-only, both schemes.**
`GenesisScreen.tsx` renders `genesis-split` → `InterviewChat` (640) +
`genesis-pane-slot` (`hidden … lg:flex`). Geometry MEASURED against the
served sheet in `tools/e2e/tests/interview.spec.ts` ("the split is 640 +
the lens at >=1024"): the chat is exactly 640 at 1440/1280/1024, its
`border-right-width` is 1px, the slot's `border-left-width` is 0px, the
two boxes ABUT (gap 0), and the lens takes W−640. Prominence in
`interview-chat-dom.test.tsx`: exactly one `interview-turn-current` and
it is the last turn; the current body carries `text-xl font-medium
tracking-title text-foreground` and history carries `text-base
text-secondary-foreground`. The project's name is in the app's own
header (`genesis-project-dir` moved to `App.tsx`) — the OS window title
is not set, per the applied criterion.

**Criterion 2 — the challenge treatment, and the hint never
load-bearing.** `challengeOf` is read by one function and consumed by one
class list. Rendering pinned in the DOM suite (rule, paper, asymmetric
radius, label, marker consumed) and in the lane against the SERVED sheet
(`--interview-challenge-bg`, `--chart-4`, `border-left-width: 2px`,
`border-top-left-radius: 0px`), **in both schemes**. Inertness pinned as
a property, not a claim: `interview-model.test.ts`'s "the same script
with and without the marker is deep-equal but for one boolean" runs one
event script twice and requires the two states equal after normalising
ONLY the turn text — same turn count, same statuses, same activity, same
phase, same `sending`, same footer.

**Criterion 3 — banked chips from file evidence only; the strip follows
the derived stage.** `bankedSince` takes `(BankBaseline, DocsModelState)`
and nothing else — no event stream crosses its signature, so "never from
parsing model output" is a property of the TYPE. Driven anyway, because
an argument from types is not evidence: a turn whose `activity` labels
and whose `completed.text` both name real docs paths produces **zero**
chips, in the unit AND in the DOM suite. The sharpest one:
**a file a human writes in a terminal produces an IDENTICAL chip** —
ADR-006's hand-driven mode rendering correctly, and the proof no
causation was inferred. The strip calls the exported `deriveGenesis`
(via `stageOf`) and reads only `approxStage`/`stageStep`;
`genesis-derive.ts` is a **0-byte diff** and `BANKING_MAP` is not read,
edited or transcribed anywhere.

**Criterion 4 — ⏎ / ⇧⏎ / skip, single-flight, right-aligned.** All in
the DOM suite plus a real-keyboard walk in the lane. Single-flight is
drilled with a parked `invoke`: six ⏎ presses yield **exactly one**
command and `getGenesisState()` is unchanged **by identity**; released,
the next send works. The skip convention is TYPED — there is no Skip
button, and a test asserts there is none.

**Criterion 5 — a calm inline failure, retry, resumable, nothing banked
lost.** Per-variant headline + the error's own words, capped, as text
nodes; no modal and no `alertdialog` anywhere. "No lost banked docs" is
asserted POSITIVELY in both the DOM suite and the lane: a chip emitted
before the failure is still on screen after it. Retry re-issues the same
command with the same argument — `genesis_start` for turn 1,
`sendGenesisTurn(storedText)` for N≥2, with the lane asserting the third
send is byte-identical to the second.

**Criterion 6 — the CLI-missing route.** The card names the typed
`cliNotFound { probed }` binaries, the project path and the hand-driven
route. It deliberately carries **no kickoff block** — asserted by
absence: `not.toContain("KIT ROOT")`, `not.toContain("roles/planner.md")`.

**Criterion 7 — hostile content.** Every string channel at once: turn
text, `activity` labels, `stderrTail`, and a chip PATH. Asserted by the
absence of the elements (`script`, `img`), by a TreeWalker proving **no
comment node was ever created** (a comment node is proof markup was
parsed), and by sweeping **every attribute of every element** for an
`on*` name — plus the literal bytes present as text, control characters
and RTL override intact. A 10 000-character turn renders whole. Markdown
renders as its own bytes (`**bold**`, a link, a fenced block — no
`strong`, no `a`, no `code`). ADR-009 driven rather than asserted from
source: a `docs/__proto__.md` path renders as a path and pollutes
nothing.

**Criterion 8 — reduced motion.** The streaming dot carries
`motion-safe:animate-status-pulse` (T-024's exact form) and a sweep over
every rendered element asserts **no unconditional** `animate-status-pulse`
exists.

**Last criterion — ONE screen-scoped accelerator table.**
`useAccelerators(acceleratorsFor(screen, actions))` — a change of
ARGUMENT; `useAccelerators` itself is untouched and there is still
exactly one `window` keydown listener. T-049's three instruments stay
green unchanged. See obligation 7.

### §10's fourteen proof obligations

1. **Suites green at branch-point truth** — table above; every figure
   re-derived first-hand, none inherited. The plan's own figures (parser
   159 · app 507 · cargo 217 · lane 36 · tokens 38 files) all predate
   T-030/T-045/T-034/T-042; branch-point truth governs, per T-023.
2. **Execution sweep** — `expect("PROBE").toBe("EXECUTED")` inserted as
   the first statement of **every** `it()` body in all eight
   new-or-changed test files by a script: **132 bodies poisoned, 132
   failed.** Not one body is vacuous. Reverted from pre-probe copies and
   **sha256-verified identical for all eight files**; `git diff` empty
   afterwards; suite back to 718/718.
3. **`textDelta`-after-`completed`, ANSWERED FROM `runner.rs` — the
   answer is (a): UNREACHABLE BY CONSTRUCTION, so NO suggestion is filed
   against C-14.** Every emit happens on one thread inside `run_turn`.
   `flush_pending` is the ONLY producer of `TextDelta`
   (`runner.rs:1341`), called from three places, all inside `run_turn`:
   `runner.rs:1183`, `runner.rs:1231`, and — the load-bearing one —
   **`runner.rs:1246`, unconditionally, immediately after the read loop
   exits and BEFORE the reap-and-decide block**. `emitter.completed` is
   at **`runner.rs:1320`** and `emitter.failed` at **`runner.rs:1316`**,
   both strictly after that flush with no emit path in between.
   `Emitter::next` (`runner.rs:129-131`) stamps `seq` from one
   `AtomicU64` at the moment of emission, so the final flush's delta
   necessarily carries a LOWER seq than the completion that follows it.
   Pinned BOTH ways in `interview-model.test.ts`: the reachable shape (a
   late-DELIVERED delta, which carries its lower seq and is dropped by
   identity — the canonical text stands) and the counterfactual (what
   the store WOULD do with a higher-seq delta), so the claim is
   falsifiable rather than merely asserted, and if the emit ordering
   ever changes the second test says exactly what the user would see.
4. **Banked-chip semantics drilled** — human-writes-the-file (identical
   chip); change-twice → one chip; delete → no chip; `activity` labels
   naming docs paths → zero chips; a non-markdown file under `docs/` is
   not an artifact; a stale/equal/zero seq → nothing; a project switch →
   nothing. **The T-026-s4 tripwire was DELETED, not written**: T-042's
   criterion 1 removed the case by construction, and the test now
   asserts the FIXED behaviour (pre-existing docs do not chip on turn 1)
   — which is what STATE.md predicted this task would get to do.
5. **The challenge inertness pin** — see criterion 2.
6. **Single-flight drilled with a parked `invoke`** — see criterion 4.
7. **Accelerators** — ⌘. is claimed **exactly once** on the interview
   (and on Ctrl too) and **zero** times on the board, the map, the map's
   own search field and the front door. **T-049-s3's property (2) is
   pinned for the first time**, and three drills prove the pin
   discriminates: (a) make `useAccelerators` `preventDefault` on an
   absent entry → the zero-claims test reds; (b) put `cancelTurn` in
   every screen's table → the same test reds; (c) drop `cancelTurn` from
   `matchAccelerator` → three tests red. All reverted, `git diff` clean
   each time. T-049's three instruments (per-chord `preventDefault`
   count, live-path enumeration, `EmptyState`'s zero registrations) are
   green **unchanged**.
8. **The DEV gate proved AND drilled both ways** — `interview-harness.test.ts`
   mirrors T-041's protocol: runtime half with a POSITIVE CONTROL first
   (`listen("genesis-turn")` and `invoke("genesis_status")` both called,
   so "absent" cannot pass for the boring reason that nothing ran); an
   EXACT five-door key set with every door required to BE a function; a
   source-level assertion that **both** harnesses sit behind
   `!isTauri` → `import.meta.env.DEV` → install, in that nesting,
   searching BACKWARDS from each install site (searching forwards found
   an unrelated earlier `import.meta.env.DEV` in `watcher-store.ts` —
   the first version of this test was wrong and said so); and a
   zero-bytes bundle grep with **four in-bundle controls** and T-037's
   staleness guard. Drills: force `DEV` → **2 red** (bundle grep + gate
   shape); drop `!isTauri` → **4 red** (both runtime tests + gate shape
   + the staleness guard firing, which incidentally proves the guard
   works). Both reverted, `git diff` clean.
9. **Geometry measured at 800×600 / 1024×768 / 1280×720 / 1440×900** —
   at every one: page `scrollHeight` equals the viewport, the column is
   bounded to the window, and the chat's own region has more content
   than box. The lens's region is additionally asserted wherever the
   lens renders. The split is present at ≥1024 and absent at 1023 and at
   800. A real `page.mouse.wheel` scrolls the transcript and `scrollY`
   stays 0. **T-048's four other screens re-measured** at 800×600 and
   1280×720 (front door, no-plan card, board, map): all four still
   scrolling pages, `h-screen` absent on the column at every one.
10. **Tokens** — both new tokens carry light AND dark values, both
    present in the built sheet (`interview-challenge-bg: #fdf6ee` /
    `#1d1710`, `interview-challenge-ink: #3f2b1a` / `#e4d3c0`). Every new
    utility confirmed to EMIT into `dist/assets/index-*.css` (32 of 33
    checked; the 33rd, bare `.w-160`, is legitimately absent because only
    `lg:w-160` is used and that one IS emitted — proven live by the
    lane's 640px measurement). `lint:tokens` clean over 107 files at zero
    allowlist.
11. **Reconciled tests** — six, each declared in place. See the table
    below.
12. **Fence audit** — `git diff --stat e92056a HEAD` is **20 files**, all
    inside §7's list. **Zero diff** to `app/src-tauri/**`,
    `app/src/lib/**`, `GenesisPane.tsx`, `genesis-derive.ts`, `method/**`,
    `lib/parser/**` (so `smoke.test.ts` is untouched — no component
    declared), `capabilities/**`, `tauri.conf.json`,
    `docs/architecture/graph.json`, every manifest and every lockfile.
    **Zero Rust ⇒ the ACL surface cannot have moved, and that is proven
    by the empty diff rather than by a regen.**
13. **BOOT GATE: FIRED, RAN, GREEN.** Scratch port **14602**, probed free
    first, deliberately avoiding 1420 and the ports used tonight
    (14520/14534/14535/14542/14555/14570/14571/14580/14581) and my own
    lane port 14601.

        [boot-check] port 14602 free — spawning `npm run tauri dev …`
        [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-t027
        [boot-check] detected startup line 1/2: [nputer] project folder:
        [boot-check] app: [nputer] window "main" created
        [boot-check] detected startup line 2/2: [nputer] window "main" created
        [boot-check] process tree stopped (exit=null signal=SIGTERM)
        BOOT_EXIT=0

    **Exit 0, both `[nputer]` lines.** Afterwards: `lsof` on 14602
    empty, `pgrep -fl tauri-boot-check` empty, no `tauri dev` strays.
14. **Graph delta measured IN-BRANCH and restored byte-exact** — below.

### The reconciled tests — six, each with its diff and its strength argued

The plan named five. The sixth (`startup-screen.test.tsx`) was
discovered by running the suite, and it is the one that mattered most.

| File | What changed | Why it is not a loosening |
|---|---|---|
| `shell-frame.test.tsx` | the `min-h-0` chain gains `genesis-split`; a **second** chain added for the chat's scroll region | The loop still requires `min-h-0` on every link and the expected array is still a whole-path equality. **Strengthened**: there are two scroll regions now, and a chain protecting one protects the frame half as well. T-048's own flags said this test "will go red and should be re-derived, not deleted". |
| `genesis-mount.test.tsx` (criterion 1) | `genesis-project-dir` → `interview-chat` present + the dir asserted ABSENT from the screen | The line existed to prove the screen was not just the pane; T-026's `<h2>` was the only other thing there. **New home named**: `genesis-entry.test.tsx` renders the real App and already asserts the dir at two points — those two lines needed NO edit and kept passing, so the property moved from one screen rendered alone to the whole shell. |
| `genesis-mount.test.tsx` (criterion 5) | same swap in the boundary test, plus `interview-input` | **Strictly stronger.** The heading was an empty sibling; the chat is a live component with its own subscription, state and input. "A crash in the right half stays in the right half" is a claim the old assertion could not make. |
| `genesis-pane-boundary.test.tsx` | `toContain("Starting a plan in")` → the header's `genesis-project-dir` **plus** `interview-chat` | Same claim, better instrument: a `data-testid` instead of a sentence that a redesign can move, and both halves of the split asserted instead of one heading. |
| `accelerators.test.tsx` | +5 ⌘. cases in the existing verdict test; +1 whole-set sweep; +3 screen-scoping tests | **Every pre-existing assertion is byte-unchanged.** See the plan correction below. |
| `startup-screen.test.tsx` | the `listen` mock is now channel-aware | **A strengthening, not an accommodation.** The mock parked EVERY `listen` on one shared deferred. T-027 opens a second subscription, so the second call silently overwrote the first's resolve/reject pair — every `refuseListen` would then have rejected the WRONG channel and **seven tests would have been asserting against a subscription nobody was awaiting**. Naming the channel is what keeps them about `docs-changed`. |

Nothing was deleted; nothing became `toContain`, `arrayContaining`,
`toHaveLength` or `.skip`.

### THE PLAN'S OWN NUMBERS — one claim did not reproduce

§4 says "`accelerators.test.tsx`'s **26-chord sweep** moves — the app now
declares five chords, not four. Changed, never loosened: the assertion
stays a **whole-set equality**." **There is no 26-chord sweep in that
file and there is no whole-set equality.** What is there is one `it()`
with **eleven** hand-listed `chordOf(...)` cases — thorough, but not
exhaustive: an unlisted letter could have been claimed silently and
nothing would have gone red.

This is the fourth-instance pattern STATE.md flags ("a card's own numbers
are a claim to verify"), now a fifth. It was answered by **building the
thing the plan described**: a sweep over every letter, every digit and
every named key the app's UI mentions, with ⌘ and with ⌃, against a
COMPLETE expected verdict map — so a fourth chord, a moved chord, a
renamed id or a chord quietly claimed on an unlisted letter all red.
The eleven original cases are kept, byte-unchanged, beside it.

Two more numbers were re-measured rather than restated:

- **The lens gets W−640, not W−641.** The plan computed 799 at 1440 by
  adding the 1px rule to the 640. The app's box model is **border-box**,
  so the rule is INSIDE the 640 and the lens gets **800 at 1440, 640 at
  1280, 384 at 1024**. One pixel wider than forecast at every size.
- **`watcher-store.ts:533-534`** (the plan's citation for the gate
  expression) no longer points at the gate, and the gate is a NESTED
  `if (!isTauri) { if (import.meta.env.DEV) { … } }` rather than a
  single `&&`. The new module uses the same nesting, and a test asserts
  the two are the same shape rather than trusting a line number.

### THREE DEFECTS FOUND BY THE TESTS AND FIXED IN THE DESIGN

Each was found by something going red, and each was fixed by changing
the code rather than the assertion.

1. **`stageOf` — the chat could be taken down by a file on disk.**
   `genesis-mount.test.tsx`'s hostile-tree probe (a Proxy that throws on
   any read) reds the CHAT, because the chat calls `deriveGenesis` over
   the same docs tree the lens does — from **outside T-037's error
   boundary**. A tree torn badly enough to break the lens would have
   taken the whole interview with it: exactly the failure that boundary
   exists to prevent, one layer up. The conversation is the load-bearing
   half and the stage strip is derived decoration, so the strip now
   degrades to `stage —` / all-future and **says so in the DOM**
   (`data-stage-derivation="failed"`) while the chat stands.
2. **`startInterviewSource` could reject at the app's root.** A refused
   `listen("genesis-turn")` was becoming an unhandled rejection — T-050's
   exact shape. Now caught and logged loudly. The residual (nothing on
   SCREEN says so) is filed as **T-027-s2** rather than half-fixed here,
   because the honest fix wants a field on C-14's state.
3. **`bankedSince` refused the first snapshot of the whole interview.**
   Found by the lane. `resetDocsForProjectSwitch` returns
   `{ ...emptyState(), seq }`, so a genesis switch carrying no tree
   leaves `{ seq: 10, projectDir: "" }` — a real watermark over **no
   project** — and the project-switch guard read that as a switch and
   silently dropped every chip. The guard now asks whether the baseline
   **knew** a project, testing `docs-model.ts`'s own sentinel. Both
   halves pinned so neither can be loosened alone.

### Design values — what was followed, and the disclosed deviations

Read directly from the bundle's `interview` screen (lines 499–617).

| Design | Token / utility | Exact? |
|---|---|---|
| chat 640px, `flex:none`, `border-right:1px` | `lg:w-160` + `lg:border-r border-hairline` | ✓ (640px; hairline is deviation 5) |
| right half `flex:1; min-width:0` | `flex-1 min-w-0`, no border, no radius | ✓ |
| `#b5651d` challenge rule | `--chart-4` | ✓ exact |
| `#84501c` pushing-back label | `--status-verifying-fg` | ✓ exact |
| `#fdf6ee` warm paper | `--interview-challenge-bg` | ✓ exact (NEW) |
| `#3f2b1a` challenge ink | `--interview-challenge-ink` | ✓ exact (NEW) |
| `#1f7a58` / `#fff` banked disc | `--review-disc` / `--review-mark` | ✓ exact |
| `#2f7256` banked text | `--status-done-fg` | ✓ exact |
| `#f5f5f5` bubble | `--muted` | ✓ exact |
| `#e2e2e2` input border | `--input` | ✓ exact |
| `#171717` current question | `--foreground` | ✓ exact |
| 17px / 500 / −0.01em question | `text-xl font-medium tracking-title` | ✓ size + tracking exact |
| radius 10px | `rounded-lg` (`--radius`) | ✓ exact |
| `0 1px 2px rgba(0,0,0,0.04)` input | `shadow-card` (0.05) | near |
| all padding/gap values | the 4px spacing scale | ✓ exact |

**Disclosed deviations, each with its reason.**
1. **Line heights.** Design 1.55 / 1.6 / 1.5 against the token pairs'
   1.43 / 1.45 / 1.41 — the largest systematic gap in the pane. The
   tokens are taken and the deviation is flagged: chat prose wanting
   more air is a judgment @human should make once, not a token this task
   should invent. **@human, at real size.**
2. **10px overlines → `text-xs` (11px)**, ls 0.1em → `tracking-overline`
   (0.12em). No 10px step and no second tracking step exist.
3. **The three-step recency ink ladder collapses to two** — all history
   at `text-secondary-foreground`, the current question at
   `text-foreground`. That is exactly what criterion 1 asks for; a
   positional gradient across a live transcript is a nuance the
   criterion does not ask for.
4. **The bubble's `max-width:78%` → `max-w-114`** (456px) — 78% of the
   640px pane's 584px content box, so the two coincide at the ruled
   width and stay stable when the chat is alone.
5. **Hairlines `#ededed` → `border-hairline` (`#e5e5e5`)** — the
   identical call T-024 disclosed.
6. **Strip segment radius 2px → `rounded-full`** (1.5px effective on a
   3px bar); 2px is below the radius scale and `rounded-[2px]` is a
   token-lint P1 violation.
7. **The stage readout.** The strip's 7 segments are interview stages
   1–7 while `approxStage` is 0–8 (or null). Stage 0 reads `scaffold`
   with all segments future; stage 8 reads `stage 7 of 7 · decomposition`
   with all done; null reads `stage —`. The chat writes `stage N of 7`
   where T-024's pane writes `stage ~N` — **the two halves phrase the
   same approximation differently, and that is flagged rather than
   silently unified.**
8. **The empty, failed and CLI-missing states have no design source** —
   built from the nearest precedent in the existing vocabulary (T-024's
   deviation-3 pattern).
9. **Paths, not section names, on the chips.** The design reads
   `banked → north star, person`; a section-level claim is not file
   evidence. T-024 made the identical call (its deviation 2).
10. **NO DARK SOURCE AT ALL for the two new tokens.** The bundle's
    `sc-if` list carries `boardDark` and `mapDark` and no
    `interviewDark`. The two dark values are **derived by family** the
    way `--status-verifying-bg/-fg` inverts. **This is the one place the
    design cannot be followed, only extended, and it is @human's.**

### The expected graph delta — MEASURED in-branch, then restored byte-exact

Regenerated with the ratified ritual, the delta recorded, then
`docs/architecture/graph.json` **restored from a pre-regen copy and
verified byte-identical**: sha256
`88e1daf69645e5734acf43a910e36e03faeb9dca8464bc10f527a144b9a0a289`,
441,937 bytes, `git status` clean on that path, and both dogfood fixtures
green again (17/17). The integrator's ritual is the integrator's.

**The graph itself:** **100 → 107 files** (7 added, none removed),
**757 → 853 symbols**, **1170 → 1315 edges** (import +32, call +58,
type_ref +55). Languages still `["ts"]`; zero `.rs` indexed.

Added: `app/src/genesis/{InterviewChat.tsx, interview-model.ts,
interview-source.ts, interview-turns.tsx}` (C-13) and
`app/test/{interview-chat-dom.test.tsx, interview-harness.test.ts,
interview-model.test.ts}` (C-05's `app/test/**` umbrella).
**Deviation from the plan's forecast: `app/test/` gains THREE, not two.**
The DEV-gate proofs need module resetting and bundle reads, which do not
compose with the DOM suite's fixture; the third file is
`interview-harness.test.ts`.

**Per-component:** `C-05` 47 → **50**, `C-13` 2 → **6**; every other
component unmoved. `unmappedFiles` stays `[]` and `derived.issues` stays
`[]` (the per-component counts sum to exactly 107).

**The relation table: 28 → 30 rows** — `13 confirmed, 6 undeclared, 9
planned` becomes **`13 confirmed, 8 undeclared, 9 planned`**. Two new
rows, and **the plan predicted only one of them**:

- `["C-13","C-14","undeclared",4]` — forecast (`interview-source.ts` →
  `agent-store.ts`, plus three more).
- `["C-13","C-05","undeclared",2]` — **NOT forecast**: both
  `InterviewChat.tsx` and `interview-turns.tsx` import
  `components/ui/button.tsx`, which is C-05's. The first genesis-side
  use of a shared UI primitive.

**Four EXISTING rows move their counts** — the thing a "two new rows"
forecast would miss: `C-05→C-13` 5 → **10**, `C-05→C-14` 1 → **3**,
`C-05→C-10` → **27**, `C-13→C-10` → **4**.

**Findings: 9 → 11** (six D1 + three D3 becomes eight D1 + three D3),
adding `D1:C-13->C-05` and `D1:C-13->C-14`. **AND TWO EXISTING FINDINGS
GROW THEIR `fileEdges` LISTS** — the trap that cost the last integrator
three assertions: `D1:C-05->C-13` grows 5 → **10** entries and
`D1:C-05->C-14` grows 1 → **3**. Swept for directly: no OTHER list
moves, because no other component pair gained a file edge.

**Drift: 6 → 7 flagged nodes** — **C-13 joins the drift set** (it is now
the SOURCE of two D1s, where before it was only a target).

**The moved fixture assertions, enumerated — 9 `expect()` statements and
4 `it()` names:**

`app/test/architecture-dogfood.test.ts`
1. `fileComponent.size` `toBe(100)` → **107** (+ the `it()` name "all
   100 files map")
2. the per-component array: `["C-05", 47]` → **50** and `["C-13", 2]` →
   **6** (one `expect`, two cells)
3. `derived.findings` `toEqual` → +2 rows **and 2 grown lists** (+ the
   `it()` name "six undeclared dependencies" → eight)
4. the relation table `toEqual` → +2 rows **and 4 changed counts** (+ the
   `it()` name "13 confirmed, 6 undeclared, 9 planned")
5. the drift-flag `toEqual` → 6 → 7

`app/test/map-dogfood-render.test.tsx`
6. `expect(node("C-13").className).not.toContain("map-drift-ring")` —
   **this one INVERTS**, and it is invisible to any count check
7. `toHaveLength(28)` → **30** (+ the `it()` name "draws the full
   28-edge relation table")
8. `"committed graph · 100 files"` → **107**
9. C-13's node gains a `map-drift-count` of **2** (an assertion to ADD,
   beside the existing C-05/C-08/C-09 ones)

`lib/parser/test/smoke.test.ts` is **deliberately NOT touched**: T-027
declares no component and changes no registry file, so the T-024
three-fixtures rule does not fire. Confirmed by re-running lib/parser
after the regen: **197/197**.

**The architect's call, flagged not taken:** `C-13→C-14` is real and
undeclared. Declaring `C-14` in `C-13`'s `depends_on` would move the
relation table and the map's edge count but **not**
`lib/parser/test/smoke.test.ts` (which pins only the id array). T-027
did not edit the registry — that is the architect's territory and
editing a registry file is the one thing that fires the three-fixtures
rule.

### Genuine silences, left open deliberately

The user's half of the transcript does not survive a remount or an app
restart — `refreshGenesisStatus` rebuilds phase/turn/session but never
`turns`, so a remount mid-interview shows an empty transcript over a
live session (**T-029's rehydration**, named here so nobody builds half
of it) · `textDelta`-after-`completed` is **pinned, and unreachable**,
so nothing is owed · the two new tokens have **no dark design source**
and are family-derived · the design's line heights are looser than every
token pair and the tokens win, pending @human · the three-step recency
ink ladder is collapsed to two · **the lens is absent at the app's own
800×600 window**, and the window size is not this task's to change ·
T-048-s1's global scroll unification is ruled but not built · **T-041-s2's
wire mirror is now THREE copies compared nowhere** — runner.rs, agent-store.ts
and `tools/e2e/tests/shell-harness.ts`, the third added by this task and
named in its own header · T-049-s4's `event.key` layout limitation is
inherited unchanged, now with a fifth chord riding it · render volume
under a long streaming turn is unthrottled and unmeasured (**T-027-s3**) ·
a refused turn subscription is invisible on screen (**T-027-s2**) · the
answer box loses focus after every send (**T-027-s1**) · **T-047-s3 has
no caller here** — no command exposes `model`, and T-027 renders neither
`model` nor `cliVersion` · the packaged wkwebview is still not what the
lane drives (T-020's standing limit) · Windows remains the repo-wide
standing silence.

### The control-byte discipline — a TWELFTH reproduction, caught by the tool layer

Writing the hostile-content fixture, the first attempt to create
`app/test/interview-chat-dom.test.tsx` through a shell heredoc was
**refused outright by the tool layer**: "command contains control
characters that would be hidden in the approval dialog". The escape text
I typed had become the CHARACTERS, exactly as STATE.md's rule predicts.

The rule was then obeyed rather than worked around: the file is generated
by a script that **constructs** the escapes from `chr(92)`, and the
script **verifies its own output** — zero bytes in the C0/DEL ranges, and
all four `\uXXXX` sequences present as six-character text — before it
exits. `file(1)` reports it as `HTML document text, ASCII text`.

**`file(1)` was run over every file this task created or changed** and
every one reads as text; none is `data`. The habit is now six-for-six.

### 1420 — never bound, never contacted, never signalled, AND AN OBSERVATION THE HUMAN SHOULD SEE

Nothing in this session bound, connected to or signalled port 1420. It
was **observed** with `lsof` only.

**At the start of this session** 1420 was held by `node` **pid 64249**
with one established connection to the human's webview — the same pid
five checkpoints have recorded. **By the time the boot gate ran, 1420 had
no listener and pid 64249 was gone**, and `pgrep -f "tauri dev"` returns
nothing at all.

**This session did not do it, and that is argued rather than asserted:**
1420 was ALREADY free when probed immediately BEFORE the boot check, so
the boot check cannot be the cause; and the boot check kills by
`process.kill(-child.pid, …)` against a process group it created with
`detached: true` (`scripts/tauri-boot-check.mjs:128-176`), which cannot
reach a process in another group. Everything else this session ran was
`npm`/`cargo`/`vitest`/`playwright`/`git` inside the worktree, none of
which kills by name or by port. **What actually stopped it is not
established, and is not guessed at here.**

The practical consequence for the morning: **the human's dev server on
1420 is down**, so the app window they left open is no longer being
served. If they were relying on it still running, that is news.

## Verdicts

2026-08-17 — claude-opus-5 @fresh, verifier — same-model review:
**APPROVED** — all eight criteria plus the accelerator criterion met and
re-derived first-hand from `7d3520c`. Merge-base with main confirmed
`e92056a` (the T-042 checkpoint); main has since moved to `8120e0d`
(T-014's `bdada11`+`d77a33e` and T-052's filing), so **every number below
is branch-point truth and none of it is main's.** Nothing was taken from
the notes. Port **1420 was never bound, connected to or signalled** — I
observed it with `lsof` only and it still has no listener, a fourth
independent sighting of the state three sessions have now recorded. My
own ports: lane **14733**, geometry probe **14734**, boot gate **14735**,
each probed free first and each `lsof`-empty afterwards; no `tauri dev`
or boot-check strays. **NO MODEL CALL WAS POSSIBLE**, proven rather than
assumed: `git diff e92056a..HEAD -- app/src-tauri/**` is empty, so the
task adds no Rust; the only webview→CLI path is `invoke`, which is mocked
at the module boundary in every vitest fixture and returns before `invoke`
on `!isTauri` in a browser.

**SUITES, all re-derived: app 718/718 (38 files) after `npm run build`
(exit 0) · lib/parser 197/197 (10 files) · cargo 220 passed + 3 ignored
across 11 binaries, exit 0 · tools/e2e 60 passed · `lint:tokens` clean
over 107 files at zero allowlist · selftest 49 samples + 14 walk-policy ·
`tsc --noEmit` clean in app AND in tools/e2e.** Every figure in the
notes' table reproduces exactly.

**THE `textDelta`-AFTER-`completed` RULING — every citation verified, and
the claim survives attack.** `flush_pending` is at `runner.rs:1327` and
its `emitter.text_delta` at **:1341**; that is the ONLY `TextDelta`
producer reachable from production code — the only other `text_delta`
caller in the tree is `agent/mod.rs:657`, inside the `#[cfg(test)]` block
opening at `mod.rs:535`. It is called from exactly three sites, all in
`run_turn`: **:1183** (Activity), **:1231** (coalesce timeout) and
**:1246**, unconditional, immediately after the read loop's closing brace
at :1245. `emitter.failed` is at **:1316** and `emitter.completed` at
**:1320**. `Emitter::next` is **:129-131**, `fetch_add(1, SeqCst) + 1` on
one `AtomicU64` created once per Agent (`mod.rs:183`). **The attack:** I
enumerated every exit from the read loop — cancel (:1109), Oversize
(:1222), EOF (:1224), StartTimeout (:1237), Stall (:1241) — and every one
falls through to :1246. There is **no `return`, no `?` and no early exit**
between loop entry and :1246 (grepped; the only `.expect()`s are mutex
locks, whose poison-panic aborts the turn thread and emits nothing at
all). Between :1246 and the terminal emit there is only the cancel
re-read, terminate/reap and pure error classification — no emit. **No
second emitter:** the two threads `run_turn` spawns capture `tx`
(:1074) and `ring` (:1081), not the emitter; the only emitter clone is
`spawn_turn`'s single thread (`mod.rs:454-457`), serialized by
`begin_turn`'s `TurnInFlight` compare-exchange latch. So the runner
cannot stamp a delta above a completion for the same turn. **The
counterfactual discriminates:** `interview-model.test.ts:209` feeds a
seq-3 delta after a seq-2 completion and asserts `"canonical tail"` — if
the emit ordering ever moved, that test is the one that says what the
user would see, and it is not vacuous because it exercises the append
branch the reachable test can never reach. No suggestion against C-14 is
owed.

**BANKED CHIPS — attacked with my own payloads through the REAL chat, 24
probes, all green.** `bankedSince`'s signature admits no event stream, so
"never from parsing model output" is a property of the type; I drove it
anyway. **A `completed.text` naming three real docs paths with the disk
unchanged produces ZERO chips. `activity` labels naming docs paths
produce ZERO chips.** A **deletion** produces no chip. A file changed in
two different turns chips in both (one row per turn); changed twice
inside one turn, one chip. **A snapshot arriving BEFORE `started` primes
rather than chips** — the effect returns early while `activeTurn` is
null, then baselines over whatever is on disk at the first turn.
**Pre-existing docs do not chip on turn 1**, and deleting the T-026-s4
tripwire was CORRECT rather than convenient: I read the fix myself —
`watcher-store.ts:391-403` applies the genesis outcome's snapshot in the
SAME state update as the switch (`applySnapshot(switched, snapshot)`), so
the tree is present before the screen can mount, let alone start a turn.
**Hostile chip paths** (`docs/__proto__.md`, `docs/constructor.md`,
`docs/<img src=x onerror=alert(1)>.md`) render as text: zero `img`
elements, zero prototype pollution, and a sweep of every attribute of
every element found **zero `on*` names**.

**CHALLENGE INERTNESS AND THE MATCHER — 15 of my own cases.** Matching:
plain, uppercase, mixed case, and a leading run of spaces/newline/tab all
match; **mid-word extension** (`pushing backwards:`), **prefixed word**
(`notpushing back:`), **mid-sentence**, **no colon**, **double space
inside**, **NBSP inside the phrase**, **zero-width-space lead** and **RTL
override lead** all do not. A **dotted capital İ** (whose lowercase is
two characters) does not widen the match, and because `slice` runs on the
original before `toLowerCase`, it cannot shift the body index — verified
directly. Both directions of the completion rule reproduce: **deltas
lacked the prefix and `completed.text` carried it → challenge; deltas
carried it and `completed.text` dropped it → ordinary; split across three
deltas → settles.** The inertness pin at `interview-model.test.ts:287` is
a real deep-equal over the same script ± the marker.

**THE DEV GATE — defeated on the build half, exactly as T-041-s4 predicts,
and the runtime half holds.** `NODE_ENV=development npm run build` DOES
flip `import.meta.env.DEV`: all three harness names appear in the bundle
(`__nputerInterviewHarness`, `__nputerShellHarness`, `__nputerDocsHarness`
— so this is T-041-s4's known, already-filed lever and not a T-027
regression). **The runtime gate survives it**: in that very bundle the
minified install site reads `const dp = typeof window<"u" &&
"__TAURI_INTERNALS__" in window;` … `async function jM(){ if(!dp){
window.__nputerInterviewHarness={…}`, so under Tauri the harness is never
installed even from a DEV-flipped build. Restored production build is
byte-identical (`index-GxM6iwW9.js`) and I re-derived the zero-bytes
claim independently: all three names absent, in-bundle controls
(`interview-chat`, `interview-input`, `genesis-split`) present.

**GEOMETRY — my own probe, six viewports including the 1023/1024/1025
boundary:**

    800x600  | page 600/600 | col 600 | chat 640 @ x80  | lens ABSENT | log 1077/342 | lens-region —
    1023x768 | page 768/768 | col 768 | chat 640 @ x192 | lens ABSENT | log 1077/510 | lens-region —
    1024x768 | page 768/768 | col 768 | chat 640 @ x0   | lens 384    | log 1077/510 | lens-region 673/648
    1025x768 | page 768/768 | col 768 | chat 640 @ x0   | lens 385    | log 1077/510 | lens-region 673/648
    1280x720 | page 720/720 | col 720 | chat 640 @ x0   | lens 640    | log 1077/462 | lens-region 657/600
    1440x900 | page 900/900 | col 900 | chat 640 @ x0   | lens 800    | log 1077/642 | lens-region 780/780

Page height equals the viewport at every one; the column is bounded at
every one; the chat's own region engages at every one; the split is
present at exactly ≥1024 and absent at 1023 and 800; the chat is 640 and
centres (x80) when alone. **The lens is W−640 — 384 / 640 / 800 — which
confirms the notes' correction of the plan's W−641: the app is
border-box, so the rule is inside the 640.** The one soft spot: at
1440x900 the lens region measured **780/780** in my variant, zero margin
under the spec's `toBeGreaterThan` — filed as **T-027-s5**.

**T-048's CRITERION-4 TABLE, re-run by me at 800x600 and 1280x720:**
front door, no-plan card, board and map are all still scrolling pages
(`h-screen` absent on the column at all eight cells), page==viewport
everywhere except the no-plan card at 800x600 (**663/600**, which is
T-048-s4's pre-existing, already-filed overflow and unmoved by T-027).
Nothing regressed.

**ACCELERATORS — the pin discriminates, drilled twice by me.** (a)
Deleting `useAccelerators`' absent-entry guard (`if (run === undefined)
return;`) reds **exactly** "⌘. is claimed ZERO times on the board, the
map and the front door". (b) Putting `cancelTurn` in every screen's table
reds the same test. Both restored, `accelerators.ts` sha256-identical,
`git diff` clean. **T-049-s3's property (2) is genuinely pinned for the
first time.** The chord sweep the builder BUILT (`accelerators.test.tsx:501`)
is a real complete verdict map — 26 letters + 10 digits + 11 named keys ×
{⌘, ⌃}, collected into an object and compared with a whole-set `toEqual`
— so an unlisted letter can no longer be claimed silently.

**THE PLAN'S THREE FAILED NUMBERS — all three confirmed, and no fourth
found.** (1) At `e92056a`, `accelerators.test.tsx` had **11**
`chordOf(...)` cases in one `it()` and no whole-set equality: there was
never a 26-chord sweep. (2) The lens is W−640, measured above. (3)
`watcher-store.ts:533-534` at the branch point is inside an object
literal (`docs: emptyState()`), not the gate; both gates are the nested
`if (!isTauri) { if (import.meta.env.DEV) { … } }` shape, which I
compared directly.

**THE THREE DEFECTS FIXED IN DESIGN — each verified with a pin that
discriminates.** `stageOf` now catches (`interview-model.ts:221-228`) and
its pin drives a Proxy that throws on every read, asserting `failed`,
`stage —` and seven future segments — the chat stands where a torn tree
would previously have taken the whole interview down from outside T-037's
boundary. `startInterviewSource` catches the refused `listen` and logs
loudly (residual correctly filed as T-027-s2 rather than half-fixed,
since the honest fix wants a field on C-14). `bankedSince`'s guard now
asks whether the baseline KNEW a project (`baseline.projectDir !== ""`),
which is `docs-model.ts`'s own sentinel, and both halves are pinned
(`:367` and `:373`).

**EXECUTION SWEEP — re-derived: 133 bodies, 133 red.** I poisoned the
first statement of every `it()` body in all eight new-or-changed vitest
files with `expect("PROBE").toBe("EXECUTED")` by script: 16 + 10 + 3 + 34
+ 9 + 46 + 4 + 11 = **133 poisoned, 133 failed, 8 files failed**. Not one
body is vacuous. Restored from pre-probe copies, **all eight sha256-
identical**, `git status` clean, suite back to 718/718. **The notes say
132; the count is 133.** Off by one, conclusion unchanged and slightly
stronger.

**RECONCILED TESTS — six checked for a sixth vacuity, and the shipped
reconciliations are clean.** `shell-frame.test.tsx` refactors the walk
into `chainFrom` and applies it to BOTH regions with whole-path equality
— strengthened. `genesis-mount.test.tsx` (criterion 1) swaps the dir for
`interview-chat` present **plus the dir asserted ABSENT**, a positive
claim about the new structure; **I verified the named new home is real** —
`genesis-entry.test.tsx` is untouched by this branch and asserts
`genesis-project-dir` at lines **173 and 233** through the real App, so
the property moved rather than being dropped. Criterion 5's swap adds
`interview-input` and is strictly stronger. `genesis-pane-boundary.test.tsx`
trades a sentence for a `data-testid` plus both halves. The
forbidden-strings source gate in `genesis-mount.test.tsx` is **byte-
unchanged** with all ten strings. `startup-screen.test.tsx`'s
channel-aware mock is a strengthening, not an accommodation: the
non-`docs-changed` branch parks forever and `listenCalls` now counts the
docs subscription specifically, so it still reds if the channel is
renamed. **The sixth instance is in a NEW test, not a reconciled one** —
`interview-model.test.ts:468`'s marquee `expect(byHuman).toEqual(byPlanner)`
compares `f(x)` with `f(x)` for byte-identical arguments and is deletable
with the suite green. Criterion 3 is still proven (the second assertion,
and the DOM suite's real-chat tests), so this is not a rejection — filed
as **T-027-s4**, together with the `bank()` helper being a hand-copy of
the chat's effect that has already drifted by the project-switch clause.

**FENCE — proven.** `git diff --name-status e92056a..HEAD` is 24 paths:
**20 code files** (the notes' figure, accurate for code, written before
the four docs files landed) plus the card and three suggestions. **Zero
diff** to `app/src-tauri/**`, `app/src/lib/**`, `GenesisPane.tsx`,
`genesis-derive.ts`, `method/**`, `lib/parser/**`, `capabilities/**`,
`tauri.conf.json`, `docs/architecture/graph.json` and every manifest and
lockfile — checked as one pathspec'd diff that returned empty. Zero Rust
⇒ the ACL surface cannot have moved.

**GRAPH FORECAST — regenerated by me with the ratified ritual and
restored byte-exact. The forecast is CORRECT, including its two traps.**
`100 → 107 files` (7 added — the four `app/src/genesis/**` and three
`app/test/**` — none removed), `757 → 853 symbols`, `1170 → 1315 edges`
(**import +32, call +58, type_ref +55**), languages still `["ts"]`.
Derived: **drift 6 → 7 with C-13 joining**; relation table gains
**`["C-13","C-14","undeclared",4]`** and **`["C-13","C-05","undeclared",2]`
— the row the plan did NOT forecast, and it is real: both `InterviewChat.tsx`
and `interview-turns.tsx` import `components/ui/button.tsx`**; the
existing `["C-13","C-10","confirmed"]` row moves **2 → 4**; findings gain
**`D1:C-13->C-05`** and **`D1:C-13->C-14`** (4 file edges, all four
genesis modules → `agent-store.ts`). **Both traps confirmed:** two
EXISTING findings grow their `fileEdges` lists (`D1:C-05->C-13` and
`D1:C-05->C-14`), invisible to any count check; and
`map-dogfood-render.test.tsx`'s
`expect(node("C-13").className).not.toContain("map-drift-ring")`
**INVERTS** — it reds with the ring now present. `graph.json` restored to
sha256 `88e1daf6…`, **441,937 bytes**, `git status` clean on that path,
both dogfood fixtures green again (17/17), lib/parser still 197/197.

**BOOT GATE: FIRED, RAN, GREEN — my own run, port 14735.** Both
`[nputer]` lines (`project folder:` and `window "main" created`),
`BOOT_EXIT=0`, process tree stopped by SIGTERM, port empty afterwards.

**THE THREE SUGGESTIONS, ruled: all three correctly filed rather than
fixed.** **T-027-s1** (the answer box loses focus after every send) is
measured, mechanism-explained, and pinned in the lane by
`not.toBeFocused()` at `interview.spec.ts:481` — a real tripwire rather
than a claim. It is the one the human will feel within ten seconds of
using this screen, so it should be triaged high even though filing was
right. **T-027-s2** (a refused turn subscription is invisible) is
introduced by T-027 and honestly named as T-050's shape; the fence on
C-14 is real and half-fixing would have been worse. **T-027-s3** (render
volume unmeasured) carries the plan's silence forward with the exact
measurement to take. I add **T-027-s4** and **T-027-s5** above.

**THE SIX @human VISUAL JUDGMENTS CARRY FORWARD INTACT** and are the
morning's agenda: (1) the one-question-at-a-time feel and whether the
current question is big enough to be the only thing on the left; (2) the
challenge treatment's judgment **in light AND dark** — the two new tokens
have no dark source in the bundle at all and are family-derived, the one
place the design could only be extended; (3) the eight disclosed
deviations, especially the **line-height gap** (design 1.55/1.6/1.5
against the tokens' 1.43/1.45/1.41) read at real size; (4) the 640/lens
balance at 1280 and 1440; (5) **the 800x600 consequence — the lens does
not render at the app's own configured window**, and whether the default
window should move (it sits beside T-048-s5's missing `minHeight`); (6)
whether the header's "nputer + project path" reads as the design's
"nputer — new project".

Everything I touched was reverted and verified: accelerators.ts by
sha256, all eight test files by sha256, `graph.json` by sha256 and byte
count, the production bundle by filename hash, and three probe files
deleted. `file(1)` reports every file I created as text, never `data`.
Tree clean at verdict time.

