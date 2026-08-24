---
id: T-123
title: An interview that banked stage 0 can still be reached — the plan probe asks whether a folder holds a plan and never whether one of ours is running on it
feature: F-03
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [app-shell, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

Every source reading below was derived at `45691d9`, against the live
tree, and the reproduction is a REAL one: it happened to @human on
2026-08-24, on the first genesis interview this project has ever run
against a real model (STATE's T-101-look section carries that account).

**THE INTERVIEW'S OWN FIRST ACT MAKES ITSELF UNREACHABLE.** Stage 0
scaffolds `docs/ROADMAP.md`; a folder holding a ROADMAP has a plan; a
folder with a plan is never routed to genesis; the resume offer lives
only on the genesis screen. So the session that wrote the plan is
stranded by the plan it wrote, with no way back in from the UI.

## The mechanism, every hop cited by symbol

1. `probe_plan` in `app/src-tauri/src/docs_watch.rs` **stats and never
   reads content** — `roadmap: fs::symlink_metadata(docs.join(ROADMAP_NAME)).is_ok()`
   — and its own header says so.
2. `PlanProbe::has_plan` is `self.roadmap || self.tasks`.
3. `pick_project`'s `if probe.has_plan()` arm prints *"genesis declined:
   <folder> already has a plan - opening it as a project"* and routes to
   the ordinary open. **This is T-026 criterion 5 and it is CORRECT** —
   there is no overwrite path in this app by construction.
4. The shell therefore never reaches `phase: "genesis"`
   (`watcher-store.ts`), so `screen === "genesis"` never renders
   (`App.tsx`), so C-13's chat never mounts.
5. `resumeGenesis` (`app/src/lib/agent-store.ts`) has **exactly one
   caller** — `takeStart(projectDir, resumeGenesis)` in
   `app/src/genesis/interview-source.ts` — inside that chat. T-029 built
   the resume offer; nothing can reach it.

**MEASURED, NOT REASONED.** `~/nputer-genesis-probe` after one turn:
`docs/ROADMAP.md` is the scaffolded template with **zero features** (every
example inside an HTML comment, exactly as T-030 and T-023 intend),
`docs/tasks/` is EMPTY, and `.nputer/sessions.json` registers
`{"id": "S1", "roles": ["planner"], "turns": 1, "status": "idle"}` with a
live `native_session_id`. `has_plan()` is true on a plan that contains
nothing. Both doors — the board header's "Start an interview" and the
front door's open — land on an empty board, which is itself HONEST (no
features, no task files, nothing to draw).

## The guard is right; the missing input is the session registry

The routing question is *"does this folder already hold a plan?"* and it
has never asked *"is one of our interviews running on it?"* — even though
that second fact has an owner. T-029 gave `.nputer/sessions.json` exactly
this responsibility, and T-070 named the accessor: `sessions::genesis_record`
in `app/src-tauri/src/agent/sessions.rs` is **the ONE place that fact
lives**, already used to tell a CLI-less user what they banked.

A guard built to stop you overwriting SOMEONE ELSE'S plan cannot
currently tell that plan from **the one its own live session wrote thirty
seconds ago**. Resuming an interview that authored a plan is not an
overwrite; it is the opposite.

This is the inverse of T-050's ruling that no reachable screen is a dead
end: here the reachable screen (the board) is a dead end *for the
session*. And it is milestone-4 work rather than a residual because a
real user meets it on their FIRST interview, before they have anything to
lose track of.

## Acceptance criteria

- **IF the picked folder holds a plan AND its `.nputer/sessions.json`
  registers a genesis session THEN the pick SHALL route to genesis**
  rather than to the ordinary open, so T-029's existing resume offer is
  reachable. The routing decision SHALL be made from the registry, never
  from the plan probe alone.
- **THE REGISTRY READ SHALL HAVE ONE OWNER.** The shell SHALL ask
  `sessions::genesis_record` (or a sibling accessor added beside it in
  C-14) and SHALL NOT stat `.nputer/` or re-parse that JSON itself — a
  rule with two implementations is two chances to disagree (T-057). IF
  the accessor's current shape does not answer this question THEN the
  new one lives in C-14 beside it and not in `docs_watch.rs`.
- **THE NO-OVERWRITE GUARANTEE SHALL BE PINNED UNMOVED**: a folder that
  holds a plan and registers NO genesis session SHALL still route to the
  ordinary open. This is the POSITIVE CONTROL the new arm needs
  (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL) — a body
  asserting the new route fires is satisfied equally by a probe that
  routes everything to genesis, and only the pair discriminates.
- **THE CONTENT-BLINDNESS OF `probe_plan` SHALL NOT BE TRADED AWAY, and
  the refusal SHALL BE WRITTEN AT THE PREDICATE.** The tempting fix is to
  teach `has_plan` to read `ROADMAP.md` and rule a features-free template
  "not a plan". It is REFUSED: a real but sparse plan would then lose
  T-026's guard entirely, the probe's own header states it never reads
  content, and content-sniffing makes the routing depend on the parser's
  vocabulary. Say so where the next reader meets it.
- **THE REPRODUCTION SHALL BE THE PIN.** A body SHALL drive exactly the
  shape this card exists for — a template `ROADMAP.md` carrying no
  features, an empty `docs/tasks/`, and a registered planner session —
  and SHALL assert the outcome is genesis. IF the offer needs any
  frontend change to appear THEN that change is `app-interview`, OUTSIDE
  this fence, and SHALL be routed rather than reached for.
- **THE VETO-ONLY PROPERTY SHALL BE RE-DERIVED AND STATED.**
  `PlanProbe::from_docs_snapshot` is veto-only today (T-064: the post-ack
  re-read can turn genesis OFF and never ON). This card gives "off" a
  second input, so the executor SHALL state whether the veto still holds
  after the change and SHALL pin whichever answer is true.
- IF a registered session is found for a folder whose plan it did NOT
  write — a cloned repository that happens to carry a `.nputer/` — THEN
  the route SHALL still be resume and never a fresh interview:
  `genesis_fresh` stays the only destructive door (T-029's reason for
  keeping it off `genesis_start`'s flag) and SHALL be shown still
  refusing a planned folder.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines), plus `npm test` from app/ if any payload shape
moves. **POISON DRILL on every new or changed assertion, one side only**,
producer mutated and never the assertion; each mutated text read back
with `git diff` before its run; restores proved per-path by sha256
against the drill's own commit; detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it (arm (c)), and name the drill directory for
this card rather than the shared literal `drill` (T-088-s3). Then the
shape-six check on each new body. BOOT GATE fires on `app/src-tauri/**` —
run it on a scratch port and record the exit and both `[nputer]` lines.
DOCS GATE fires on this card; ask it directly, never through `xargs`.
**@human: one look, and it is the reproduction run backwards** — open a
folder whose interview has banked stage 0 and confirm the resume offer is
there. `~/nputer-genesis-probe` is the live instance and its session id
is in its own `.nputer/sessions.json`.
