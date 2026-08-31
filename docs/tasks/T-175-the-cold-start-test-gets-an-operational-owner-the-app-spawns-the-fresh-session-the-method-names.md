---
id: T-175
title: The cold-start test gets an operational owner — the app spawns the fresh, docs-restricted session the method names, and its gaps render beside the board
feature: F-03
milestone: 4
priority: 5
size: M
status: verifying
blocked_by: []
touches: [app-agent, app-interview]
suggested_by: standing triage sitting #4 (2026-08-30) — SPLIT from T-171
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**SPLIT FROM `T-171` AT THE FOURTH STANDING TRIAGE (2026-08-30), AND
THE SPLIT IS THE DISPOSITION** — `T-171` is @human's walk finding
whole; this card is its second half. The two halves answer to
different fences and different sizes, which is the method's own
argument for two cards: `T-171` is a terminal STATE in the interview
pane (`app-interview`, a stall @human hit and can hit again), and this
is a SPAWN (`app-agent`, a new short-lived session with a restricted
reading surface). A single card carrying both would hand one lane the
union of those fences for two unrelated contracts.

**READ `T-171` FIRST — IT CARRIES THE WALK'S EVIDENCE**, including
@human's verbatim report and the by-hand cold-start result this card
exists to automate.

## What the method asks for, and why the interview session cannot do it

`method/interview/plan-interview.md` ends: *"Then: cold-start test. A
fresh session reads only docs/ and explains the project back. Gaps in
its answer are gaps in the docs — fix and repeat."*

The interview session is disqualified BY CONSTRUCTION — it holds the
whole interview in context, and the blindness IS the test. The planner
at @human's walk said exactly this in its own words and then had
nowhere to go. So the test needs a second session, and the app is the
only thing positioned to spawn one.

## THE TRIAGE RULING THIS CARD IS BUILT ON (2026-08-30, sitting #4)

**THE COLD-START TEST IS OFFERED, NEVER GATED.** `T-171`'s open
question 3 — *"whether the test blocks completion or follows it"* — is
ruled: **completion is at the last bank; the cold-start test is an
offered next action.** Three reasons, and the first decides it:

1. A completion that depends on a SPAWN can fail for reasons that have
   nothing to do with the project's quality — an expired login, a
   missing CLI, a cancelled turn. Gating the walk's ending on it
   reproduces the exact failure @human hit, one layer out: a person
   with a finished project and no way forward.
2. Milestone 3's own precedent is hand-driven-first (ADR-017's
   spawned-planner-writes rule arrived the same way), and the walk
   itself ran this test by hand successfully.
3. The method says *"fix and repeat"*, which is a LOOP a person opts
   into, not a gate a program holds shut.

## The reading restriction IS the test

A session that read the interview transcript, the planner's context or
the repository outside `docs/` is not cold, and a green answer from it
is worthless. The restriction is therefore a CONTRACT of the spawn and
not a prompt instruction: it belongs with `app-agent`'s existing
argv/environment discipline (ADR-003 `env_clear()` + allowlist,
`validate_resolved_program`, the bounded-transcript rule), where the
project already knows how to prove a child could not reach something.

Note for the lane: `.nputer/` holds the interview transcript and is
gitignored but present on disk in the generated project — a cold
session pointed at the project root can reach it. The restriction has
to be stated against a path set, not against the project.

## Acceptance criteria

- WHEN the interview has banked its last stage THE app SHALL offer the
  cold-start test as a named action, and SHALL NOT gate completion on
  it (the ruling above).
- WHEN the person runs it THE app SHALL spawn a FRESH agent session
  whose reading surface is the new project's `docs/` tree, and the
  restriction SHALL be proven the way this project proves its other
  child-surface claims — a test that the child cannot reach
  `.nputer/`, the transcript, or anything above `docs/`.
- THE explain-back SHALL render beside the board, and its GAPS SHALL be
  the actionable output — the method's fix-and-repeat loop, not a
  score.
- IF the spawn fails THEN the failure SHALL be a typed outcome that
  costs the person no affordance (the T-069/T-101/T-102/T-107/T-113
  family's rule), and the finished project SHALL remain finished.
- Verification: headless. The restriction body is `cargo test`'s; the
  offer-not-gate body is the app suite's.

## Implementation notes

**Executor `claude-opus-5@subagent`, lane `task/T-175-lane` at
`/Users/ujju/Projects/nputer-T-175`, base `0a8dd58` (derived:
`git merge-base main HEAD`).** Every figure below is measured at this
lane's own tip unless it names another ref.

### THE CARD IS PARTLY DEFECTIVE, AND SAYING SO IS THE FIRST NOTE

**Criteria 1 and 3 order work outside this card's own `touches:`.** A
"named action" is a rendered affordance with a working handler, and the
last three links of that handler's chain are all `app-shell` (C-05):

- `app/src-tauri/src/lib.rs`'s `generate_handler!` list, where a
  `#[tauri::command]` wrapper is registered;
- `app/test/crescendo-dom.test.tsx`'s **two IPC census pins**, each a
  `toEqual` over an exact command set — one derived by scanning EVERY
  `invoke<T>("name")` in the whole of `app/src/`, the other read out of
  `lib.rs`. Adding the frontend door reds the first; registering the
  command reds the second;
- that same file is where `BoardCrescendo` is DOM-tested, so the panel
  that renders the offer has no reachable body either.

`[app-agent, app-interview]` expands to C-14 + C-13 and reaches none of
them — re-derived at `0a8dd58` by calling `decide()` in
`.claude/hooks/lane-fence.mjs` over each of the 13 manifest paths plus
six negative controls (including the near miss `app/src/genesis-not-a-dir.ts`,
which shares the string prefix of a fence domain and is correctly
REFUSED), rather than by reading the manifest JSON. `TASK-FORMAT.md`
rules this case — *"A card whose criterion and whose fence disagree is a
DEFECTIVE CARD, not a hard call for the lane"* — so it is **routed as
`T-175-s1`**, the third instance of the disposition `T-110`→`T-126` and
`T-112`→`T-112-s1` already took. The fence was not widened.

**The one-line dodge was available and refused, recorded so nobody
re-derives it as a good idea.** The frontend census matches the literal
`invoke<T>("name")`, so an invoke through a `const` name would have
added the door without reddening anything. That is hiding from a census,
not passing one.

### What was built, and where the restriction actually lives

**`adapter.rs` — `CLAUDE_COLD_START_V1`, a second ARGV SURFACE over the
one agent.** `ADAPTERS` is untouched and `exactly_one_v1_entry_…` still
reads 1, because ADR-017 clause 6 fixes the v1 AGENT set, not the
template set. The new `SPAWNABLE` list is `[CLAUDE_V1,
CLAUDE_COLD_START_V1]` and the three security sweeps (`all_argv_strings`,
the bypass ban's assembled-argv half, the data-borne-flag round trip) now
walk **it** rather than `ADAPTERS` — a strengthening: those bodies ask
which bytes reach an `execve`, and that stopped being the agent set the
moment a second template existed.

The cold template is every subtraction and no addition: **no `--add-dir`,
no `--permission-mode`, no `--allowedTools`, no `--resume`**, and
`--disallowedTools Bash Edit Write NotebookEdit WebFetch WebSearch Task`.
`Bash` is the load-bearing member — it is how `cat
../.nputer/genesis/transcript.jsonl` would have been spelled from inside
`docs/`. `resume_args` is byte-identical to `spawn_args`, which is how
this surface refuses to resume **structurally** rather than by a caller's
discipline: no `--resume` and no `SESSION_ID_SLOT` exist for an id to be
substituted into.

**`mod.rs` — `cold_start(watch, agent)` + `cold_start_status(agent)`.**
The child's cwd is `<project>/docs` (`COLD_START_CWD_REL`), which is the
card's own *"stated against a path set, not against the project"*. The
turn number is `COLD_START_TURN = 0` — interview turns are 1-based, so no
cancel notice or log line can present a cold start as an interview turn.

**The emitter is SILENT, and that is the design.** `genesis-turn` is the
interview's channel and the store folds every payload on it into the
conversation by turn number; a cold-start delta would render as the
planner speaking and a cold-start `Started` would arm `flightOf`'s
`claimed` arm — which is the completion panel standing down. So the run
reaches no channel and its answer is READ through `cold_start_status`,
the `genesis_status` precedent. A second channel would need a second sink
in `lib.rs`, which is the same out-of-fence file as everything else in
`T-175-s1`.

**The single-flight latch is SHARED with genesis** (`begin_turn`), so
exactly one child exists at a time and the child slot `genesis_cancel`
and the exit hook read is never ambiguous. A cold start therefore
answers `Busy` mid-interview, and `genesis_cancel`/`reap_for_exit` reach
its process group unchanged — no new orphan class.

**`kit.rs` — `assemble_cold_start_prompt()` takes NO ARGUMENTS.** Every
other prompt in that module interpolates two absolute paths; this one
CANNOT, so it cannot tell a cold reader where `.nputer/` lives. Pinned
both ways: the prompt carries no `/` at all, and the interview's kickoff
DOES name the project (the control that keeps the first assertion from
being vacuous).

**`fake_agent.rs` — the dump gained `visible.json`**, the cwd's own
contents, cwd-relative and bounded (2000 entries, depth 8). "Record
everything you were handed" is that binary's charter and a working
directory's contents are the largest thing it is handed.

**`crescendo.ts` — `coldStartOffer(completion, cold)` and
`splitColdStartAnswer(text)`.** The argument order is the ruling:
completion goes in and the offer comes out, and `completionOf` takes no
cold-start argument, so nothing can travel the other way. The reverse
direction is closed too — a cold answer over an unfinished interview
offers nothing, because an explain-back of a tree the planner is still
writing would present a mid-flight tree as a finished one.
`gapsNamed` is deliberately not `gaps.length > 0`: "the reader looked and
found nothing" and "the reader never answered the second half" are
different facts and only one is good news.

### What the restriction proof does and does not claim

The half this repository owns is **the surface the app hands the child**
— cwd, argv, environment, stdin — and that half is measured in the same
dump channel `the_child_gets_the_allowlist_and_never_a_secret` has used
since T-025. The half it does NOT own is what a real CLI would do with an
absolute path typed into its own `Read` tool, and **table three of
`EFFECTIVE_GRANT_TABLES` is live on this surface too**: no `--settings`
and no `--setting-sources` are passed, so a user whose own CLI
configuration grants `Bash` has granted it here, and no argv on this
table takes it back. That is ROUTED to @human on `T-025-s4` already and
is not re-decided here; it is written into
`CLAUDE_COLD_START_V1`'s doc comment beside the grants, in the voice
`validate_resolved_program` uses for *"the gate checks SHAPE, never
identity"*.

### Criteria

1. **Offer at the last bank, never gating** — the DERIVATION is built and
   pinned (`coldStartOffer`, 5 bodies); the RENDER is routed to
   `T-175-s1` (fence). The not-gating half is fully met and measured.
2. **Fresh docs-restricted spawn + the restriction proven** — MET.
   `cargo test` bodies below.
3. **Explain-back beside the board, gaps as the actionable output** — the
   PARSER is built and pinned (`splitColdStartAnswer`, 6 bodies, including
   a body asserting no digit appears anywhere in a failed offer); the
   RENDER is routed to `T-175-s1` (fence).
4. **Typed failure costing no affordance; the finished project stays
   finished** — MET, and the "costs nothing" half is asserted as the
   POSITIVE it is: after a `CliNotFound` the offer is asked again and
   reaches the same refusal rather than `Busy`, which is what a stranded
   latch would have produced.
5. **Verification headless** — MET; nothing here spawns a real model.

### Gates and figures — measured at `2a38623`, base `0a8dd58`

**THE GATE SET WAS DERIVED AGAINST THE TREE THIS TIP WILL HAVE**, per
`roles/executor.md`: the only commit after `2a38623` is this notes
edit, whose whole diff is `docs/tasks/T-175-*.md` — already in the path
set the DOCS GATE was asked about and already covered by the three
suites it named. So no gate answer below moves, and the integrator
inherits a derivation rather than a forecast.

- Setup, fresh worktree: `npm ci` + `npm run build` from `lib/parser/`,
  `npm install` from `app/`, `npm ci` from `tools/e2e/` — exit **0** each.
- `npm run build` from `app/` — exit **0**.
- `npm test` from `app/` — exit **0**, **50 files / 1130 tests**.
- `npx vitest run` from `lib/parser/` — exit **0**, **16 files / 344
  tests**. `npx tsc --noEmit` — exit **0**.
- `npm test` from `tools/e2e/` — exit **0**, **420 passed** (5.4 m),
  `NPUTER_E2E_PORT=14175`. **Worktree count 12 either side** (`git
  worktree list | wc -l`), so `THE MARGIN GUARD` read a stable lane list
  — `T-220`'s environmental red did not occur here. `npm run typecheck`
  — exit **0**.
- `cargo test` from `app/src-tauri/` — exit **0**: **268** lib, **95
  passed / 1 ignored** in `agent_runner`, every other target green.
- `npm run lint:tokens -- --selftest` **0** · `npm run lint:tokens` **0**
  · `npm run lint:docs` **0** (the CENSUS half — "I was not asked", never
  "nothing owed") · `npm run capabilities:check` **0**.
- **DOCS GATE — FIRES.** `node tools/e2e/scripts/docs-gate.mjs` over the
  7 source paths answered *"none under docs/ — this gate is not owed"*;
  **re-derived over the full 9-path set including this card and
  `T-175-s1` it FIRES** and names three suites — `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/` — all
  three run and green above. Run FROM THE REPOSITORY ROOT: from
  `tools/e2e/` it exits **2** (CALLED WRONG) on plain relative paths,
  which is the gate refusing an ambiguous question rather than a finding.
- **BOOT GATE — OWED and RUN.** Trigger derived from the diff: it touches
  `app/src-tauri/**` and `app/src/**`. `NPUTER_BOOT_PORT=14175 npm run
  boot:check` from `tools/e2e/` — exit **0**, both lines observed:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-175` and
  `[nputer] window "main" created`. Port derived from the card id and
  `lsof -nP -iTCP:14175 -sTCP:LISTEN` returned **zero rows** immediately
  before and after. 1420 was never probed.
- **GRAPH — STALE, and it is the integrator's.** `cargo run -p
  nputer-index -- index --check --root ../..` — exit **1**. Committed
  1,153,961 bytes / 200 files / 2,456 symbols / 2,379 edges; fresh
  1,165,474 / 200 / 2,493 / 2,386. Diff: **7 files `~`, edges +8 −1**,
  budget 1,165,474 of 2,145,959 (54.3 %). This is the REAL red shape —
  both counts plus a file diff — not the `--root` false red, which says
  `committed: MISSING`. CONVENTIONS' GRAPH REGEN puts the regen at the
  CHECKPOINT, and `docs/architecture/graph.json` is outside this fence
  besides.
- NOT OWED, each derived rather than assumed: `cargo audit` (no manifest
  or lock change), the DECLARING-A-COMPONENT three-fixture reconcile (no
  `docs/architecture/components/` change), a METHOD VERSION BUMP (no
  `method/` byte moved, so neither of the two doc stamps nor
  `METHOD_SNAPSHOT_VERSION` is owed; `snapshot_version_matches_the_live_method_stamps`
  is green).

### Drills — eight, one side only, each restored IDENTICAL by sha256

Landing was decided by **sha256**, never by the mutator: the first
harness used `git diff --numstat`, which is UNCHANGED for a
one-line-for-one-line swap, and its `$?` was reading a trailing `cd` —
so it reported "exit 0, mutant survived" for three drills while
measuring nothing. Re-run; the corrected results are these.

| # | mutated (one side) | bodies red |
|---|---|---|
| D1 | `cold_start`'s cwd → the project root | 1 — `…is_stood_up_in_docs_and_can_reach_nothing_above_it` |
| D3 | `spawn_cold_start` uses `planner_adapter()` | 1 — `…argv_and_prompt_hand_the_child_no_route_out` |
| D6 | `walk_cwd` returns an empty list | 1 — the central body, **on its POSITIVE assertion** |
| D2 | heading match `===` → `.includes()` | 1 — the two near misses |
| D4 | `failed` arm → not offered | 1 — the failed-offer body |
| D5 | drop the `- none` skip | 1 — `'- none' is an ANSWER…` |
| D7 | `running` arm → `available` | 1 — the phase-mapping body |
| D8 | no-heading arm → `gapsNamed: true` | 1 — the no-heading body |

**D6 is the one worth reading twice.** It kills the fake's directory walk
and the central restriction body reds on the line that says the docs tree
MUST be reachable — proof that the body's four absences are not being
satisfied by silence.

D4 and D8 each redded THREE and TWO bodies on the first pass. Both were
restatements and both were separated rather than explained: the
phase-mapping body no longer covers `failed`, and the near-miss body no
longer restates `gapsNamed`.

### Noticed, not done

- `app/src-tauri/src/arch_cmd.rs:2` has an unused `Path` import warning
  at base `0a8dd58`, unrelated to this diff and outside this fence.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
