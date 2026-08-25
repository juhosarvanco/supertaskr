---
id: T-125
title: The session-registry fact becomes its own component, so this repository's first dependency cycle stops existing in the code rather than being written down
feature: F-04
milestone: 4
priority: 7
size: M
status: planned
blocked_by: []
touches: [app-agent, app-shell, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

**@HUMAN RULING 2026-08-25 — THIS REGISTRY HOLDS NO CYCLES.** The
architect proposed declaring the cycle as "argued and real"; @human
overturned it, and this card is the consequence. The full reasoning is on
`T-033` under THE THREE RULINGS; the short form is that **the cycle is in
the SOURCE, not in the picture** — declaring it would change one markdown
line and leave the tangle in the code — and a tool whose product is
showing people tangles in their own codebases should not ship a
"cycles are fine here" precedent at fifteen components.

## The cycle, and what actually creates it

`T-123` gave the genesis routing a second input: before deciding whether
a folder may be interviewed, the docs watcher asks whether an interview
is already registered for it. That fact lives in `.nputer/sessions.json`,
which `T-029` deliberately gave **C-14** sole ownership of so that
exactly one place reads it (T-057's rule: a rule with two
implementations is two chances to disagree).

So today, live on `main`:

- **`C-10 -> C-14`** — `app/src-tauri/src/docs_watch.rs` calls C-14's
  reachability accessor in `app/src-tauri/src/agent/sessions.rs`.
  Undeclared; **C-10's first D1 finding ever**.
- **`C-14 -> C-10`** — already declared in
  `docs/architecture/components/C-14-agent-runner.md`.

**It became VISIBLE rather than new-born at T-010**, which made Rust
indexed for the first time; the call itself arrived with T-123's merge
`0358c0c`.

**Nothing is broken and the honest scope of the cost belongs on the card
rather than in a verdict.** Both modules live in one crate, so `rustc`
does not object, no build step fails and no test is harder to run. If
they were separate crates Rust would refuse to compile it — that gap
between "a loop that hurts today" and "a loop that does not" is exactly
why this is worth one card and not an emergency.

## Ownership is not dependency direction

This is the load-bearing idea and the reason the fix does not undo
T-029. C-14 was given the registry so there would be **one reader** of
"an interview was registered for this folder". That property is about
how many implementations exist, not about which component points at
which. Move the fact to its own component and there is still exactly one
reader — and the arrow stops pointing both ways.

Martin's Acyclic Dependencies Principle sanctions exactly two remedies
for a cycle: **invert the dependency** (the depender declares the
interface it needs) or **extract a component both sides depend on**.
This card takes the second, because the thing in dispute is a FILE ON
DISK that both sides legitimately care about, which is a shared lower
layer rather than an interface either side should own.

## Acceptance criteria

- **THE SESSION-REGISTRY FACT SHALL BECOME ITS OWN DECLARED COMPONENT**,
  at the next free C id, with a component file in the shape of C-13/C-14
  (`id`, `name`, `layer`, non-empty `paths`, `depends_on`, `decisions`,
  `status: auto`, `touch_slugs:`) and its own slug in ARCHITECTURE's slug
  table. Its `paths:` SHALL name what actually moved and no more.
- **AFTER THE MOVE, `C-10 -> C-14` AND `C-14 -> C-10` SHALL NOT BOTH
  EXIST**, and the derivation SHALL be asked rather than argued:
  `cargo run -p nputer-index -- arch drift --root ../..` from
  app/src-tauri, with the before and after recorded in the notes.
- **EXACTLY ONE READER OF THE FACT SHALL SURVIVE**, which is T-029's
  property and the reason this is a MOVE rather than a copy. A body SHALL
  pin it — the same discipline `denialToolName` uses (T-057): if two
  call sites could compute "is there a resumable session here"
  differently, the move has traded one defect for another.
- **THE THREE-STATE CLASSIFICATION T-123 BUILT SHALL MOVE INTACT.**
  `Resumable` / `NotResumable` / `NoSession` exists because a boolean
  could not distinguish *absent* from *refused*, and that distinction was
  the whole content of T-123's rejection. IF the move flattens it THEN
  the rejection is being re-introduced; assert all three arms after the
  move, with the not-resumable arm's positive control.
- **NO BEHAVIOUR SHALL CHANGE, ASSERTED RATHER THAN ASSUMED.** This is a
  relocation. The genesis routing SHALL answer identically for every
  shape T-123's second verifier drove — no session, unparseable registry,
  non-planner roles, a dead planner beside a live one, an id the
  boundary refuses, an id absent — and the notes SHALL name which of
  those bodies moved and which were re-run unchanged.
- **THE REGISTRY EDITS AND THE FIXTURE DELTAS SHALL LAND TOGETHER.**
  Declaring or moving a component moves the live-registry fixtures
  (docs/CONVENTIONS.md's own gotcha); derive the set BEFORE running
  anything, expect the hidden-second-assertion shape, and reconcile
  corrected, never loosened.
- IF the extraction turns out to need a `depends_on` that would create a
  DIFFERENT cycle THEN stop and open a room rather than declaring it —
  the ruling above is standing, not per-case.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines), plus `npm test` from app/ for the fixtures, and
`arch drift` before and after. **POISON DRILL on every new or changed
assertion**, one side only, producer mutated and never the assertion,
each mutated text read back with `git diff` before its run, restores
proved per-path by sha256, in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it and **every artefact named for this lane**
(T-088-s3). Note that a content-exact restore is NOT a complete restore
where a sibling test reads an mtime (measured at T-079) — keep plants
inside the fence. The BOOT GATE fires on `app/src-tauri/**`. GRAPH REGEN
fires on `*.rs` since `e1f3023`; ask `index --check` rather than
predicting. The DOCS GATE fires on this card and every component file.
@human: none — the ruling this card implements has already been made.
