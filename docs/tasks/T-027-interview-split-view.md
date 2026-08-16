---
id: T-027
title: Interview split view — planner chat, challenge treatment, banked answers
feature: F-03
milestone: 3
priority: 5
size: L
status: planned
blocked_by: [T-024, T-025, T-026]
touches: [app-interview, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
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

## Acceptance criteria
- WHEN genesis starts THE split view SHALL render 640px chat left +
  the T-024 lens right (window label "nputer — new project"), drive
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
  against the fake-CLI failure fixtures.
- IF the CLI is missing at start THEN the screen SHALL route to the
  hand-driven fallback state (T-029's surface; until T-029 lands, a
  minimal copyable-kickoff-prompt card is acceptable and stated in
  notes).
- IF model output contains hostile content (script-shaped text, RTL
  overrides, 10k-char turns) THEN it renders as text nodes only —
  no injected elements; no-innerHTML grep gate across the pane;
  ADR-009 discipline in every model-keyed collection.
- IF prefers-reduced-motion is set THEN all interview motion SHALL
  have static equivalents (existing motion-safe mechanism).

Verification: headless — vitest state-machine units against fake
runner event scripts; jsdom DOM states (question/challenge/banked/
failed/complete); served-bundle probe walking a full scripted
interview over the fake CLI writing real files into a temp project
(the whole loop: spawn → turn → agent writes → watcher → banked
chip). @human, listed explicitly: the one-question-at-a-time feel and
challenge treatment judgment, light + dark; the milestone closer's
live run rides T-028.
- WHEN any screen registers a WINDOW-LEVEL accelerator THE app SHALL
  route it through ONE screen-scoped accelerator table rather than a
  second `window` keydown listener: T-026's front-door Cmd-O/Cmd-N
  move onto it unchanged (their unmount-scoping test stays green) and
  this screen's own keys join it — two independent window listeners
  racing over modifier chords is how key handling rots. Input-local
  keys (Enter send, Shift-Enter newline) are NOT accelerators and stay
  on the input. Out of scope, recorded rather than forgotten: the
  Cmd-vs-Ctrl label and a native Tauri menu, both of which stay with
  T-022 (T-026-s2).

## Implementation notes

## Verdicts
