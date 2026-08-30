---
id: T-169
title: An assignment violation is flagged on the board — the model the human assigned either did the task or the card says so loudly, because D5 ruled assignment BINDING
feature: F-04
milestone: 4
priority: 4
size: S
status: done
blocked_by: []
touches: [lib-parser, app-board]
suggested_by: "@human's D5 ruling (2026-08-30): of course the models the human assigns to different tasks do those tasks as assigned — recorded in rooms/cockpit-or-mirror.md"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing.** D5 is ruled in @human's own words: assignment is BINDING.
Where a spawn path can force the model, the adapter forces it; where
it cannot (a hand-pasted brief, an adapter whose CLI takes no model
flag), nputer VERIFIES — and this card is the verification's teeth.

## Acceptance criteria

- THE parser SHALL derive a per-card assignment verdict from the
  fields it already reads: WHEN `builder:` names a model and
  `built_by:` names a DIFFERENT model, that is a VIOLATION; likewise
  `verifier:`/`verified_by:`. The comparison is on the MODEL half of
  `model@vehicle` — the vehicle (subagent, cli, a hand-driven app) is
  legitimate variation D5 does not constrain; the seat SHALL state the
  exact comparison rule at the definition site. An EMPTY assignment
  constrains nothing; an empty execution field on a `done` card is
  its own (existing) incompleteness, not this verdict's.
- THE board SHALL surface a violation the way it surfaces a parse
  error: visibly, per card, with both values shown — never a silent
  substitution. The word used SHALL be honest about what is known:
  the fields disagree; WHY is a human question.
- THE live board SHALL be censused at the lane's ref: every current
  violation enumerated (expected: zero — derive, never assume) and
  the census pinned the fence-census way, with named exceptions only
  if @human rules one acceptable ON the card, dated.
- GUARD RULES: a fixture card with a mismatched builder pair must
  flag (positive control), a matching pair and a
  same-model-different-vehicle pair must NOT, and the clean live
  board must census clean — mutants disposed per the POISON DRILL
  bullet.

## Implementation notes

Built in `task/T-169-assignment-flag` off `bf274ed`. Every figure below
is derived at `c2f1dea` (the drill's named commit) unless stamped
otherwise.

**THE COMPARISON RULE, and where it is stated.** The definition site is
`lib/parser/src/assignment.ts` — the module header carries the rule in
five numbered clauses, and `satisfiesAssignment` carries clause 5 alone
so the asymmetry cannot be read backwards. In short: each side is
reduced to the SET of models its value names (`stampModels`), an empty
side constrains nothing, and a pair is HONOURED when every assigned
model is satisfied by some executed model — equal, or refined at a `/`
boundary in the executed direction only.

**WHY A SET AND NOT `ModelSession.model`, and the finding that forced
it.** The naive reading of this card's own criterion — compare the
`model` field the parser already computes — reports **8 disagreements on
the live board**, not zero. Six are not disagreements at all:
`parseModelSession` returns a REPRESENTATIVE model (the last whitespace
token before the LAST `@`, a mechanical rule with a wart pinned at
T-030-s1), so against a prose stamp it returns prose. `verified_by:
claude-opus-5 @T-013-verify (re-verified @T-013-verify2, 2026-08-23)`
yields the model `(re-verified`, and comparing that against `verifier:
claude-opus-5` would have the board announce violations on **T-001,
T-013, T-081, T-084, T-085 and T-110** where the fields plainly agree.
That is the board lying about @human's own finished cards, so the rule
reads every `model@vehicle` unit instead of one representative. The six
are pinned BY ID in `assignment.test.ts` as the rule's control: one body
asserts the representative comparison still disagrees on exactly six
(non-vacuous by assertion), the next asserts this rule reports none.

**THE OTHER TWO OF THE EIGHT, named rather than quietly excepted.**
T-020 and T-024 stamp `built_by: claude-fable-5 @fresh (WIP through …) +
claude-opus-5 @fresh (completion)` against `builder: claude-fable-5`.
The assigned model IS among those the stamp names — it did the work and
a second model finished — so clause 4 reads them `honoured`. That is a
judgement and it is on the record: D5 is a ruling against a model being
SUBSTITUTED for the assigned one, and a stamp naming both is the
loudest possible disclosure, the opposite of a substitution.
`executedModels` carries the whole set for any consumer that wants to
say more. **If @human reads those two as violations, the fix is one
clause in `satisfiesAssignment`'s caller, not a rewrite.**

**A COUNTER-EXAMPLE THE PARSER'S OWN FIXTURE PROVIDED.** With exact
string equality, `lib/parser/test/fixtures/valid-project/docs/tasks/
T-104-done.md` — which has stamped `builder: codex@fresh` against
`built_by: codex/gpt-5.2 @S3` since T-003 and expects ZERO issues —
became a D5 violation, redding two pre-existing bodies. That fixture is
the convention's worked example of a correctly stamped done card, so
the `/` refinement clause exists and names it as its evidence. The
clause is one-directional and the boundary is `/` and only `/`:
`claude-opus-5-mini` never satisfies `claude-opus-5`.

**THE LIVE CENSUS, derived at `c2f1dea`.** 347 cards, **227 constrained
pairs** (both halves stamped), **ZERO violations** — the card's expected
zero, derived rather than assumed. Pinned the fence-census way (the
`parseProject(repoRoot)` shape `fence.test.ts` uses) in TWO places, both
of which print the offending card and both values on failure:
`assignment.test.ts`'s census describe, and `select-board.test.ts`'s
`THE LIVE BOARD CENSUSES CLEAN` walking the real `selectBoard` output.
Each is paired with a non-vacuity body, and each was run against a
PLANTED violation before its zero was written down (drill M15/M16).
**No named exception is claimed and none was needed.**

**THE SURFACE.** The violation is a `ParseIssue` — kind
`assignment-violation`, carrying `assignedField`/`executedField` and
both raw values, deliberately NOT a single `field`, because naming one
field is naming the one at fault and that is the human question. Being
an issue, it joins by file through `issuesByFile` and reaches the card
face's existing `IssueMark` and the panel's verbatim issues section with
no new visual language invented — that IS "the way it surfaces a parse
error". What the board adds: `TaskDetailPanel`'s provenance block prints
the ASSIGNMENT beside the stamp that departed from it, which repairs a
real silent substitution (`modelBadge` shows `built_by` on a done card,
so on a disagreeing card the assignment was on screen nowhere); and the
card face carries `data-assignment-violations` so a census counts
without reading a glyph. The word everywhere is DISAGREE, and a body
asserts the message contains none of `substituted` / `wrong model` /
`unauthorised`.

**POISON DRILL: 24-for-24.** Detached scratch worktree at
`/tmp/T-169-drill` cut at `c2f1dea`, its own npm installs, one stem for
the worktree, the driver and the results file (CONVENTIONS' scratch
bullet); no `CARGO_TARGET_DIR` — every suite here is TypeScript. Each
mutant edited ONE SIDE, the applied TEXT was confirmed (not merely a
non-zero substitution count), the suite ran UNPIPED through `spawnSync`,
and every one exited 1 killing its INTENDED body. Restoration by `git
restore --source=c2f1dea --staged --worktree --` and proved by sha256
against `git show c2f1dea:<path>`, 24 for 24. The two census mutants are
the load-bearing ones: a violation planted into T-145's `built_by:`
redded the parser census (3 bodies) and the board census (1), so neither
zero is a search that was never shown capable of failing. Results:
`/tmp/T-169-drill-results.json`; worktree removed, lane tree clean.

**GATES**, every exit read from `$?` on an UNPIPED command at `200e957`.
`npx vitest run` from lib/parser/ **exit 0** (334 tests, 16 files).
`npm test` from app/ **exit 0** (1026 tests, 47 files). `npm run
lint:docs` from tools/e2e/ **exit 0**. `npm run build` green in both
packages. The DOCS GATE **FIRES** on this diff (exit 1 = it has a
verdict) — the two `docs/tasks/` cards are code inputs — and names three
suites: app/, tools/e2e/ and lib/parser/. All three were run.

**THE E2E SUITE IS RED, AND THE RED IS THIS LANE'S EXISTENCE RATHER
THAN ITS DIFF.** `NPUTER_E2E_PORT=14169 npm test` from tools/e2e/ (port
lsof'd to zero rows immediately before binding) exits 1: **319 passed, 1
failed** — `session-economics.spec.ts:73`, at its POSITIVE CONTROL,
where `brief.mjs --task T-112` is expected to exit 0 and exits 1
instead. The reason the brief prints is this card's own filing note come
true: *"fences are not disjoint: T-169 app-board against T-112 app-board
— the same entry (lane-protocol rule five)"*. **Attribution derived, not
argued**: the identical command run from the pristine main checkout at
`bf274ed`, carrying not one line of this diff, exits 1 with the same
sentence. The suite was 320/320 at zero lanes (STATE); it is 319/320
while a lane holding `app-board` is live, and it returns to 320 when
this lane lands or is removed. **Nothing here is fixed by a change to
this diff, and nothing in this diff should be changed to make it
green.**

**GRAPH VERDICT — REPORTED, NOT REGENERATED** (regen is the
integrator's). `cargo run -p nputer-index -- index --check --root ../..`
from app/src-tauri/ exits **1: `graph.json is STALE`** — correctly, and
predictably: this diff adds `lib/parser/src/assignment.ts` and its
import/type edges. The added edges the check enumerates are exactly the
new module's (four importers of `assignment.ts`, the widened `types.ts`
re-export lists, and the `AssignmentDisclosure` type refs from
`TaskDetailPanel` and `BoardCard`). **BUDGET AT THIS TIP, measured:
1,005,840 of 1,040,000 bytes (96.7%), 34,160 left** — the figure T-139
says to derive and never quote, derived here at `200e957`; the
integrator regenerating should read it again rather than take this one.

**WHAT I DID NOT DO.** The rendering pin lives in
`app/test/review-badge.test.tsx` because the board's general DOM file,
`board-truth.test.tsx`, is outside `touches: [lib-parser, app-board]`;
filed as T-169-s1 rather than moved by a lane that may not move it.

## Fence note at filing

`touches: [lib-parser, app-board]` — collides with T-112
(app-dispatch, app-board) if both dispatch at once; the lane list is
the authority at dispatch time.

VERDICT (2026-08-30, blind verifier claude-opus-5@subagent, factless spawn — structural blindness): **APPROVED WITH ASSIGNED CORRECTIONS**, all three performed at merge by the integration seat, committed-first, drilled one-sided with sha256-proved restoration (73d323ac…f36d): (1) `@human` matches the WORD, not the prefix — `@human-driven` keeps its model (pinned; the reverted regex reds exactly the new body); (2) an execution stamp naming no readable model VIOLATES a binding assignment instead of landing `unconstrained` (pinned; the reverted comparable reds exactly the new body) — the three false definition-site sentences rewritten to the measured truth; (3) the T-020/T-024 two-model-stamp judgement routed to @human as T-169-s2. The verifier independently re-derived the census zero through two comparison rules, confirmed the executor's 24-for-24 drill artifact, verified the e2e red lane-caused by running the probe itself, and its four blind predictions about prose-stamp false-positives matched the executor's findings card for card.
