---
id: T-145-s2
title: T-145 changed a file that ships inside the compiled kit under a fence that could not bump the method version, and T-104 already ruled that question belongs to triage BEFORE dispatch
status: parked
suggested_by: executor claude-opus-5 @T-145
touches: [method/interview/plan-interview.md, docs/CONVENTIONS.md, app-agent]
---

**This is a dispatch question, not a defect, and it is deliberately not
decided here.**

`T-145` changed `method/adapters/CLAUDE.md` and `method/adapters/AGENTS.md`.
Both ride the compiled kit (`KIT_FILES` in `app/src-tauri/src/agent/kit.rs`,
`include_str!`), so a genesis run after this lane materializes different
adapter bytes than a genesis run before it — while `kit.json` on disk
stamps `methodVersion` **0.1.6** in both cases.

`docs/CONVENTIONS.md` gotcha 1: *"Changes to method/ formats are
version-bumped (currently v0.1.6) and noted here"* — and a bump is a
three-file commit whose third file is Rust.

**`T-145`'s fence is `method/adapters/`. It reaches none of the three.**

## Why it is triage's and not the lane's

`T-104` (done) ruled it in as many words: *"Whether a bump is owed at all
is triage's call and should be decided BEFORE dispatch."* T-145's
dispatch did not decide it, and the lane may not decide it from inside
its own fence.

**Note the predecessor.** `T-138-s2` — the card `T-145` promotes — carried
`touches: [method/adapters/CLAUDE.md, method/adapters/AGENTS.md,
method/interview/plan-interview.md, docs/CONVENTIONS.md, app-agent]` and
its body carried *"the full three-file bump arithmetic and 0.1.6 →
0.1.7"*. **T-145's re-fence to `method/adapters/` — the move that got it
past the `method/` containment against a laneless `T-135` — dropped that
half of its own predecessor.** That is the cost of the narrowing, and it
is worth writing down beside the win, because the narrowing is now
recorded in `docs/STATE.md` as the pattern for `T-105`, `T-128` and
`T-131` to copy.

## Two answers, both defensible

- **Owed.** The kit ships these bytes; a version that lies about what
  shipped is the exact failure the pin exists to prevent, and two
  projects both stamped `v0.1.6` would hold different adapters.
- **Not owed.** The gotcha says *formats*, and an adapter is a scaffolded
  ARTIFACT rather than a format like `TASK-FORMAT.md` or the banking map.
  On this reading nothing in the method's grammar moved.

**Nothing in the repository is red either way** — the three stamps still
agree with each other, so `snapshot_version_matches_the_live_method_stamps`
stays green and no gate will ask this question for you. That is precisely
why it needs a card rather than a suite.

Amnesty triage 2026-08-29 (triage seat): PARKED — TRIAGE RULES IT, WHICH IS WHAT T-104 SAID THIS QUESTION NEEDED. The INSTANCE is moot: the method has since gone to v0.1.7 at ADR-019's phase-7 commit, and that same commit edited the adapter template — so no shipped kit.json now stamps a version that lies about the adapter bytes beside it. The GENERAL question survives and is genuinely two-sided: the gotcha says FORMATS are version-bumped, and whether a scaffolded ARTIFACT like an adapter is a format is a wording question about the gotcha itself, not a fact anyone can derive. The card's second half stands as a recorded cost of the T-145 narrowing that STATE now names as the pattern for T-105, T-128 and T-131 to copy: re-fencing to method/adapters/ dropped the three-file-bump half its own predecessor T-138-s2 carried. RESURFACES: the next method/ dispatch — T-159 — which should settle the gotcha's wording rather than leaving each lane to re-derive it, and which is itself a bump and so the cheapest place to say what a bump is owed for.
