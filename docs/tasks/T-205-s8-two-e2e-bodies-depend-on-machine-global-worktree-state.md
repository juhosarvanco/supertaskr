---
id: T-205-s8
title: Two session-economics bodies assert the assembler exits 0, so ANY live worktree whose id has no card reds them — the suite's answer depends on machine-global state no ref controls
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: verifier claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/e2e/tests/session-economics.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**THE SAME TREE MEASURED GREEN AND THEN RED WITH NO COMMIT BETWEEN
THEM.** At `c08f260`, `gate-run e2e` was **619 bodies GREEN** at
2026-09-02T10:39:44Z. At the SAME ref, roughly four and a half hours
later, the same suite reported **2 failed / 617 passed**. Nothing in the
repository changed. What changed was the machine: a peer seat cut
`/Users/ujju/Projects/nputer-T-216-s8` on
`task/T-216-s8-unjudged-push-refused`, and **no card on the board
declares `T-216-s8`** — its siblings `T-216-s4` and `T-216-s7` exist and
it does not.

`brief.mjs` is right to refuse: *"a lane whose fence cannot be read is a
fence nobody can be disjoint from"* is `T-209`'s guard doing its job, and
exit 1 is the correct answer to the question it was asked. **The defect
is on the test side.** These two bodies —

    tests/session-economics.spec.ts:179  the recommended seat is a function of the CARD…
    tests/session-economics.spec.ts:365  the advisory line is NOT a contract row…

— both assert `expect(run.status).toBe(0)` against a real invocation of
the assembler in the real checkout, so they inherit `git worktree list`,
which is machine-scoped and belongs to no ref. **A body whose answer
depends on which OTHER lanes a colleague happens to have open is not
measuring the property it names.** Neither body is about lane
disjointness at all: 179 is about the recommendation being a function of
the CARD and not the environment — which is exactly the property it
fails to have — and 365 is about the advisory line's POSITION relative to
row 13.

**MEASURED, and the attribution is a control rather than a reading.**
Run alone at the T-205 tip `48285b5`: 2 failed, 8 passed. Run alone at
the base `c08f260`, where the T-205 diff does not exist: **the same 2
failed, the same 8 passed, the same `T-216-s8` cause.** The diff is
exonerated by measurement.

**WHY IT MATTERS BEYOND ONE STRAY WORKTREE.** This is the third member of
the family `docs/CONVENTIONS.md` already names — the SCRATCH RULE, the
PORT RULE and the E2E PORT rule all exist because *a defaulted
machine-scoped surface is a collision waiting for a second seat*. The
worktree list is the same class and has no rule. Under concurrent lanes,
which this project runs by design, a suite that reads it will red for
whoever measures last, and it will be attributed to their diff.

## Acceptance criteria

- THE two bodies SHALL assert the property each names without depending
  on the checkout's live worktree list — by driving the assembler against
  a controlled lane set, or by asserting on the recommendation and the
  advisory position independently of the run's exit code.
- A BODY SHALL demonstrate the isolation: with a planted undeclared lane
  present, the two bodies still pass, and the assembler's own refusal is
  still exercised somewhere that MEANS to exercise it.
- THE FIX SHALL NOT weaken `brief.mjs`'s refusal, which is correct
  (`T-209`) and is the half that must not move.

## Read beside

`tools/e2e/tests/session-economics.spec.ts`,
`tools/e2e/scripts/dispatch-brief.mjs` (the lane list is derived from
live worktrees), `T-209`, and `docs/CONVENTIONS.md`'s SCRATCH RULE /
PORT RULE family — one class, three spellings, and this is the fourth.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-225-s2 merge (6691fc5)

The architect seat. Two benches paid a red e2e leg for it this sitting: any live lane cut after the bench ref reds session-economics. Fence narrowed from tools/e2e to the one spec file.

## VERDICT

**APPROVED** — 2026-09-02, verifier `claude-opus-5@subagent`, seat
`V-T-205-s8`, bench `/Users/ujju/Projects/nputer-V-T-205-s8`.
**Tip judged: `60406f34ac13ad2268f149afe442ba4c03d079ab`**, base
`ca64d7c5e1d6970e3b3c82d782e717f211c900a8`. Every figure below was
measured in this bench; each carries the ref it was measured at, and no
figure was taken from the executor.

### The frame, and the seals

Phase 1 was a spawn of its own, before this diff was opened. The attack
set and the ground truth were written from the card at `ca64d7c` — with
`docs/CONVENTIONS.md`, `method/lane-protocol.md` rule 4 and
`method/roles/verifier.md` — and sealed at **2026-09-02T13:09:45Z**:

    attack set: sha256:34c56d465f9a2200ff343a25cee08539cb12a4764a33b0f7a6aa991bc7f29b61 (attack-V-T-205-s8.md)
    ground truth: sha256:d3d917147612b02e698c44b8f1d0f21b86c48dbededaeca80b05efbdb21b3a37 (ground-V-T-205-s8.md)
    stamps-V-T-205-s8.txt carries both, the base ref and the sealing clock.

Both re-verified byte-identical after this verdict was written.

**WHAT THE BLINDNESS ACTUALLY WAS, said plainly.** Phase 1 had a shell
and used it: the card, the governing documents, the spec and the three
production scripts were read at the base, and the ground truth was
MEASURED there. What it never opened was the lane, its branch, its diff
or any executor note, and the dispatching brief named no
executor-derived specific. Phase 2 arrived with the executor's own tree
facts in the message — its fixture shape, its six mutants and their kill
sets, its suite figures. That is phase 2's normal shape, and the answer
to it is that **nothing below rests on any of them**: every criterion
was re-derived here, the drill below is the sealed set and not the
executor's, and where the two overlap it is because both aimed at the
same site.

### The fence: one file, and it was enough

`touches:` permits `tools/e2e/tests/session-economics.spec.ts` alone.
The diff is 5 paths — that file (+344/-69), this card's `status:` line,
and three new `status: suggested` cards. **No production file moved**,
proved by digest rather than by reading the stat: at `60406f3`

    tools/e2e/scripts/brief.mjs             0270a75b43c0b96ee227c2a2dd6acdd22337a983e2a5f549ad046f128abf02d5
    tools/e2e/scripts/dispatch-brief.mjs    91f3d674b9ff2ed328d1f28799c51786663e78d28654e344d37237e69c4b9bff
    tools/e2e/scripts/session-economics.mjs 66d542f493d1326b782bfcc8b6406308913ae87d2aee6094a06f3f13b691ea8b
    tools/e2e/scripts/lane-fence.mjs        36ae6c300fce10c81bb143f196a25d94f713c47771651305d5aac0972f3bd388
    tools/e2e/tests/brief.spec.ts           f8c76534f086a7603671b5de19d102347f50b4d7cb968663f63896a0faaeae41
    tools/e2e/tests/git-fixture.ts          cced5d58c02256f77375561072f52352e267bf9db31a00eba616beeef8a7268c

every one of them the digest sealed at the base. **Phase 1 pre-committed
that a production hunk would be a REJECT and that none was needed**,
having measured at `ca64d7c` that `brief.mjs --root <a separate
repository>` already drives the assembler against a controlled lane set
from a foreign cwd. The three surfaces the fix spends —
`EXIT`, `spellings.branchPattern` and the `repository: ${ctx.root}`
line — all exist at `ca64d7c` and are exported there. The fix bought
nothing with a production change, which is the strongest thing that can
be said about a one-file fence.

### Criterion 1 — the two bodies no longer read the machine's list

Re-derived here, not read off the diff. The dependence at the base was
`git -C <root> worktree list --porcelain`, reached twice per body:
in-process through `control()`'s `context({})`, and in the child through
`spawnSync(brief.mjs)` with no way to name a repository. At the tip both
reads take a root the suite built: `control(root)` and
`brief(root, id)`, with `cwd` deliberately left on the live checkout so
the two are different paths.

**MY OWN PLANTED ARM, independent of the fixture the diff builds.** A
`git clone --local` of this repository in the scratchpad, detached at
`60406f3`, with an undeclared lane cut **in the clone's own worktree
administration** (`task/T-902-planted-undeclared-V-T-205-s8`, no card
declares `T-902`) — so `repoRoot` for the run IS a checkout holding an
undeclared lane, which is the defect exactly. Nothing was planted in
`/Users/ujju/Projects/nputer`'s administration at any point.

| arm, all at `NPUTER_E2E_PORT=25208` in that clone | result |
|---|---|
| **base** spec (`d250224e…`) with the plant | **2 failed, 8 passed** — `:179` and `:365`, each `Expected: 0 / Received: 1`, stderr naming `T-902 … a lane whose fence cannot be read is a fence nobody can be disjoint from` |
| **tip** spec (`7936fe48…`) with the same plant | **11 passed** |

That is the card's own signature reproduced by a seat that did not write
the fix, and its removal measured at the tip.

The named properties are all still asserted, and phase 1 pre-committed
that losing any of them would make an approval false: the child process
survives (P1); the positive control that the block is not a constant,
**in the recommendation and not in the echoed path**, survives (P2); the
structural `not.toContain("process.env")` survives (P3); and body 365
keeps all four of its assertions — no seat/model/econom contract row,
`assembleBrief`'s recs carrying no `ADVISORY —`, `ROW 13` before
`ADVISORY —`, and `NOT one of the rows above` (P4). Every graded id is
still DERIVED, now against the fixture's own board through the command's
own `fenceOverlaps` (P7) — the T-163-s4 regression phase 1 pre-committed
to rejecting did not happen.

**AND THE FIX ADDED A GUARD PHASE 1 DID NOT ASK FOR AND SHOULD HAVE.**
`expect(clean.stdout).toContain("repository: ${root}")` with its
negative twin on `repoRoot`. Without it, a command that ignored `--root`
would pass every comparison in the body on a machine whose lanes all
have cards — which is this machine (see below). Mutant **M8** confirms
it fires.

### Criterion 2 — the isolation is demonstrated, on both sides of the act

The new body at `:584` takes the graded answer, cuts a lane no card
declares in a SECOND checkout of this project, and requires the graded
answer byte-identical across the act; then names that second checkout as
the one under test and requires `EXIT.FOUND` **with the guard's own
sentence in stderr**, not merely a non-zero code — which is the failure
mode phase 1 pre-committed to catching (D1). It asserts its
pre-conditions rather than assuming them: the plant registers as a lane,
its id has no card, and the graded checkout grew none. Then it re-runs
BOTH graded bodies' helpers with the lane standing, which is criterion 2
in the card's own words.

The plant's id is derived (`undeclaredId`, first free `T-9NN`) and its
branch is spelled from the project's own published lane pattern, so
neither is a typed literal that a later card could turn into a
tautology.

**The one thing it will not do is cut into the live checkout's shared
administration**, and it says so. Phase 1 pre-committed that doing so
would be an automatic REJECT — it would red every peer seat measuring in
that window, which is this card's own defect committed by the fix for
it. Measured after eight suite runs on this bench: the shared
administration holds the same 17 entries it held before, none named for
this card, and no `t205s8-lanes-*` directory survives in the temp root.

### Criterion 3 — the refusal is intact, and it has two keepers

`brief.mjs`'s blind-lane finding is byte-identical at the tip (digest
above). It is exercised on purpose in two places: `brief.spec.ts`'s
pre-existing `BLIND_PORCELAIN` family, which phase 1 recorded as already
satisfying this clause at the base, and now the new body, which grades
the real command against a real planted worktree rather than a porcelain
string. **M2 proves both are live.**

### The drill — the sealed set, plus two aimed additions

Every landing was read from `git diff` before running, every restore was
proved by `shasum -a 256` against `git show 60406f3:<path>`, and the
run scope is `session-economics.spec.ts` + `brief.spec.ts` — 51 bodies,
green at `60406f3` before the first mutant.

| # | site | mutation | bodies killed |
|---|---|---|---|
| M1 | fixture DATA | the plant is not cut | `session-economics:584` |
| M2 | `dispatch-brief.mjs` `deriveFence` | the blind-lane FINDING is dropped | `brief:2104`, `session-economics:584` |
| M3 | `dispatch-brief.mjs` `laneWorktrees` | the lane list is always empty | `brief:415, 2104, 2481, 2533, 2595, 2632`, `session-economics:584` |
| M4 | the new body's assertion | `EXIT.FOUND` → `EXIT.CLEAN` | `session-economics:584` |
| M5b | `session-economics.mjs` `seatVerdict` | the verdict is a CONSTANT | `session-economics:431, 439, 562, 584` |
| M6 | `brief.mjs` | the advisory is printed BEFORE the rows | `session-economics:431, 562, 584` |
| M8 | `dispatch-brief.mjs` `context()` | `--root` is IGNORED | `brief:1144, 2346, 2822`, `session-economics:431, 584` |
| M10 | `dispatch-brief.mjs` `assembleBrief` | an `ADVISORY —` line INSIDE the row set | `session-economics:562, 584` |
| **M7** | environment (DATA) | an undeclared lane live in the checkout the suite runs in | **none — 11/11** |

**Containment (2b), and it separates every pair.** `431 ⊄ 562`: M8 kills
431 and not 562. `562 ⊄ 431`: M10 kills 562 and not 431. `584` is
independent of both: M1, M2, M3 and M4 kill it where neither of them
dies. The three bodies are mutually load-bearing.

**584's kill set does CONTAIN both graded bodies', and that is the
card's own design rather than a restatement.** It contains them because
criterion 2 asked for the graded assertions to be re-run under a plant,
so 584 calls their helpers. What keeps 431 and 562 from being
restatements is 2b's own requirement of a control: they are the arm
where **the arrangement is ABSENT**. Delete them and the plant has
nothing to be compared against; the suite would then decide the
subject's answer and the control's from one arrangement, which is the
defect 2b names as the one this method produces most.

**A correction to my own sealed attack set, stated rather than
quietly dropped.** It required M1 and M4 to have DIFFERENT kill sets, on
the theory that a shared kill set meant the fixture was not doing the
assertion's work. Both kill exactly `{584}`, and the clause was wrong as
written: 2b's containment test grades BODIES, and two mutants aimed at
the one body that carries a property must both kill that body — *"a kill
count of one is a property of a well-chosen mutant, not an invariant"*.
What the pair actually establishes is the right thing and it holds: M1
says the body's pass depends on the plant being cut, M4 says its
assertion is not vacuous.

**Two drill notes worth the next reader's time.** (1) An M4 attempt
whose `perl` pattern missed by two leading spaces produced a GREEN suite
and an EMPTY `git diff` — the exact "survived" that is really a
non-landing. It was caught because the landing is read from `git diff`
before the run, never from the mutator. (2) The literal byte-swap first
planned for M3 — deleting `laneWorktrees`'s `if (entry.branch === "")
continue;` — is UNDRILLABLE by construction: an empty branch cannot
match `^refs/heads/task/T-(\d+(?:-s\d+)?)-.+$` either, so the guard is
redundant with the regex below it and no mutant of it can change an
answer. That is an observation about the production file, not about this
diff; M3 was re-aimed at the list itself.

### Security sweep

No new dependency, no network, no new input path from outside the
repository. The fixture is `git archive HEAD` of this repository's own
tracked tree, extracted into `mkdtempSync(os.tmpdir(), "t205s8-lanes-")`
— a scratch name DERIVED from the lane, which is the SCRATCH RULE's own
requirement and the class this card is about. The temp root is outside
the repository (lane-protocol rule 3), the plant is a SIBLING of the
peer checkout rather than a path inside it, and one removal in
`afterAll` takes the whole tree through the project's own
`removeGitFixture`, whose failure is reported as the FIXTURE's finding
rather than as the body's. `FIXTURE_GIT_ENV` introduces no secret — an
`example.invalid` identity — and every fixture `git` call carries
`NO_BACKGROUND_MAINTENANCE`, so nothing keeps writing into a tree the
teardown is removing. The graded arm is `--task`, which writes nothing;
the only writing arm is `--take-seat`, which is not used, and it would
write into the checkout `--root` names — the fixture — rather than the
live one. Nothing to report.

### Adjacent features, and the gates

`brief.spec.ts` and `git-fixture.ts` are untouched (digests above); the
new body reuses `git-fixture.ts` rather than re-implementing teardown.
The docs gate at this tip answers **1 — HAS a verdict**, naming
`npm test from app/`, `npm test from tools/e2e/` and
`npx vitest run from lib/parser/` as owed by the four `docs/tasks/*.md`
paths, and reporting *every live task card's frontmatter parses, with a
legal status* — the DOCS-GATE-through-frontmatter class is clear, and
the three filed cards carry `status: suggested`, `suggested_by`, unique
ids and no reserved title indicator.

Measured at `60406f3` on this bench, `node tools/e2e/scripts/gate-run.mjs`:

    gate-verdict suite=parser exit=0 bodies=372  ref=60406f3 verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1141 ref=60406f3 verdict=GREEN
    gate-verdict suite=e2e    exit=0 bodies=625  ref=60406f3 verdict=GREEN

**AND THE GATE THIS VERDICT ITSELF COULD MOVE WAS RE-RUN AT THE TIP THIS
COMMIT CREATES** — prose is a code input, and the parser suite reads
`docs/tasks/`. Its sha cannot be quoted inside the commit that makes it,
so this is the derive command with no answer beside it, which is the one
form that cannot go stale (CONVENTIONS, the moving-symbol bullet):

    node tools/e2e/scripts/gate-run.mjs parser    # from the repo root, at HEAD

**`docs/CAPABILITIES.md` is STALE at this tip and that is correct** —
committed 52797 bytes against a fresh generation of 52918, one added
test name. Under T-201 the census is the INTEGRATOR's to regenerate in
the merge commit; a lane that regenerated it would have written outside
this fence. `gate-run e2e` is `npx playwright test` alone and does not
read the census, so nothing here is hiding behind it. **The integrator
owes `npm run capabilities` at the merge.**

### Figures, each with its ref

| figure | at `ca64d7c` | at `60406f3` |
|---|---|---|
| `test(` bodies in `session-economics.spec.ts` | 10 | 11 |
| `test("` across `tools/e2e/tests/*.spec.ts` (static) | 603 | 604 |
| assertions the plant kills in the two graded bodies | 4 | 0 |
| production files changed | — | 0 |

### Not failures — filed, never blocking

1. The two routed cards name their subject by FILE AND LINE in the
   TITLE (`dispatch-order.spec.ts:80`, `brief.spec.ts:479`).
   CONVENTIONS' *A LINE NUMBER IS A FIGURE* bullet is about rule
   citations, so this is not that rule broken — but a body's NAME
   outlives a merge where its line does not, and both cards give the
   name in their bodies already. Worth spending at the merge, not here.
2. `laneWorktrees`'s empty-branch guard is redundant with the branch
   regex and therefore cannot be drilled (above). A guard no mutant can
   kill is a guard nobody can prove is load-bearing.
3. The e2e leg was measured under real contention — a sibling seat's
   `gate-run e2e` ran concurrently on this machine, which `solo: true`
   did not prevent (`T-202-s1`'s subject). It moves wall time, not the
   count, and the count is what was read.
