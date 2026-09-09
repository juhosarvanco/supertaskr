---
id: T-238-s1
title: Five residues of the holder record, recorded by T-238's verifier and not filed — a dangling citation in a refusal, a release that removes what it cannot read, a false premise about session ids, a detached integration checkout that holds no seat, and an e2e suite that writes the host's worktree list
feature: F-06
milestone: 4
priority: 2
size: S
status: done
suggested_by: verifier claude-opus-5@subagent @T-238-verify, phase 2 at 7705ac4, filed by the architect seat at the merge
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/checkout-currency.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**FIVE THINGS THE VERDICT RECORDED AND ROUTING LEFT TO THE SEAT.** T-238
merged APPROVED; none of these blocked it, and each is one bounded
edit in the files that lane held.

1. **A dangling citation in a user-facing refusal.** The holder arm's
   refusal text cites `HARNESS_ARGV0_BASENAME`, a name nothing exports;
   a reader following it finds nothing. The refusal SHALL cite the
   derivation's real header.
2. **`--release-seat` removes a record it cannot read and prints
   "RELEASED … unopposed".** An unreadable record is a shape failure and
   SHALL be refused with the reason, never released past.
3. **The card's own premise was false as measured.** "A Bash tool call
   carries no session id" — `CLAUDE_CODE_SESSION_ID` and `CLAUDE_PID`
   ARE exported to the tool shell; only `CLAUDE_PROJECT_DIR` was
   re-measured unset. The ancestry derivation is still the better
   instrument (it survives a harness that stops exporting them, and it
   names the process the way `ps` can check), and the header SHALL say
   so with the measurement, not with the false premise.
4. **A detached integration checkout holds no seat.** The arms decide
   "the integration checkout" by branch; a detached HEAD at main's tip
   is not one, and a seat working detached there is unrecorded. The
   arms SHALL say so rather than stay silent.
5. **The e2e suite now writes the host's worktree list.** The moved
   bodies register temporary worktrees in the shared
   `git worktree list` while they run (cleaned up correctly across every
   run the verifier made), and battery 18's one red at d2702e4 was the
   integration checkout's sweep body seeing a sibling verifier's
   temporary worktree appear and vanish mid-run. Registering fixtures in
   the shared list is the machine-scoped hazard rule 4 names; the
   fixture SHALL be a clone or a worktree of a scratch repository, never
   of the host's.

- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-219-s4 merge

The architect seat. The holder's residues and the push guard's refspec residues share three files; one lane, after T-225-s2 frees brief.mjs.

## Absorbs: T-237-s8 (2026-09-02)

The identity's own home file lists its limits and does not name the ONE machine where it will not derive at all — a CI runner — so the limit is stated only in the file that consumes it

**A POINTER THAT PROMISES MORE THAN THE FILE IT POINTS AT CARRIES.**
`.claude/hooks/push-guard.mjs`'s holder section says, in as many words:

    THE LIMITS ARE THE IDENTITY'S AND THEY ARE STATED WHERE IT IS
    DERIVED, in `checkout-currency.mjs`

and then lists three — a seat that never arms, a seat that commits
without pushing, and the one-harness fact. That pointer is the right
shape: one home for the limits, and a consumer that refers to it rather
than copying it. **It is now incomplete in the direction that cost main
a red.** `sessionIdentity` derives from the nearest ancestor process
that IS the harness, and there is a whole class of machine where no such
ancestor exists: a CI runner, whose process tree is Runner, then bash,
then node (respelled by the seat on 2026-09-09: the preflight reads a
`<-` in prose as a provenance arrow and refused the dispatch).
Every local checkout has the ancestor and is green; the runner has none,
and on 2026-09-02 that difference reddened main through a body that
armed the arm from the real process tree (T-238-s2, absorbed into
T-237-s2 and closed there).

**T-237-s2 NAMED THAT C

## Absorbs: T-237-s9 (2026-09-02)

Two residues of the refspec reader the verifier filed rather than blocked on — a `--repo=<value>` eats the only refspec, and a destination beginning with `-` reaches `gh` as `--branch`'s value

**FILED RATHER THAN FOLDED IN, AND THE REASON IS THE FIX PASS'S OWN
SHAPE.** T-237-s2's verifier rejected the three residuals on ONE defect
(`--all`/`--mirror` let a live run through) and recorded these two beside
it as *"findings that do NOT block, filed rather than folded in"*. The fix
pass repaired the blocker and DECLARED these in the reader's limits block,
because a fix pass that widens its own diff is a fix pass the verifier has
to judge twice. They are carried here so the declaration has a repair
behind it.

## 1. `--repo=<value>` supplies the repository and the scanner still eats
a positional for one

`git push --repo=origin HEAD:main` is read as: `--repo=origin` skipped as
a one-token option, `HEAD:main` taken as the REPOSITORY, no refspecs left
— so `pushTargetBranch` falls back to HEAD's branch and the spelled
target `main` is never asked about. A FALSE NEGATIVE only: it can cost a
refusal, never cause one.

## 2. A destination beginning with `-` reaches `gh` as `--branch`'s

## Absorbs: T-229-s11 (2026-09-02, at the T-229-s8 merge (d179821))

A push-guard positive control reds only inside the whole e2e run and passes alone, so the suite carries an intermittent that every lane in the window will misattribute

**Found by `T-229-s8`'s battery, and filed because the next seat to run
the four-suite battery will meet this red and has to decide what it is.**
Nothing in `T-229-s8`'s fence touches the push guard.

`tools/e2e/tests/push-guard.spec.ts:2718` — *"a lane holds no seat, so a
holder record in one refuses nothing"* — fails its own POSITIVE CONTROL
half inside the full `gate-run e2e` and passes every other way:

    Error: the same record on the integration branch is not ignored
      2751 | control.verdict === "block" || (control.notices ?? []).join("").includes("SEAT"),

## What was measured, and where

| run | ref | context | result |
|---|---|---|---|
| full `gate-run e2e` | `4d972d03e2a2644a4a56c792ddb3449e79d4c76e` | whole suite | **RED** — 1 failed / 601 passed, this body |
| full `gate-run e2e`, again | `4d972d03e2a2644a4a56c792ddb3449e79d4c76e` | whole suite | **RED** — same single body |
| the body alone (`-g`) | `4d972d0` | one body | **GREEN** 1/1 |
| the whole spec FILE alone | `4d972d0` | 76 bodies | **GREEN** 76/76 |
| full `gate-run e2e` | `1e344d62fbc3f7db83e367b1e8592578459407cb` | whole suite, quiet machine | **GREEN** 602/602, exit 0 |
| full `gate-run e2e` | `1e344d6`, detached control worktree | whole suite, six other playwright processes live on the host | **RED** — the same single body |

**THE LAST TWO ROWS ARE THE FINDING.** One commit, one suite, two
oppos

Absorbed here because the body that reds is the holder's own control at push-guard.spec.ts:2718, this card already fences that file, and V-T-219-s4 and V-T-229-s8 both measured the same body: red once under a shared machine, green on the verifier's own loaded full run. The lane SHALL attribute it before touching it — a body that reads the host's process tree is the class room item 20 names.

## TRIAGE, 2026-09-02 — raised to priority 2 at the T-225-s2 merge (6691fc5)

The architect seat. T-225-s14 is the fourth lane to measure the holder control's red under the full suite; absorbed here with T-229-s11, and the carrier rises to p2. Waits behind T-216-s8 on push-guard.mjs.

## Absorbs: T-225-s14 (2026-09-02, at the T-225-s2 merge (6691fc5))

The holder body's positive control reds under the FULL e2e suite and passes when the spec runs alone — reproduced at the base with no diff, so it is load and not a lane's work

**MEASURED FOUR TIMES IN ONE SITTING, TWO REFS, SAME BODY.**
`tests/push-guard.spec.ts`'s *"a lane holds no seat, so a holder record
in one refuses nothing"* fails on its own POSITIVE CONTROL — the final
`expect(control.verdict === "block" || notices includes "SEAT")` — but
only under the whole lane:

    ref       what ran                            that body
    855db9b   the whole e2e suite (607 bodies)    FAILED
    855db9b   the whole e2e suite, re-run         FAILED
    855db9b   push-guard + session-economics only PASSED (86 passed)
    09526da   push-guard + session-economics only PASSED (86 passed)
    09526da   the whole e2e suite (604 bodies)    FAILED — 603 passed

**THE LAST ROW IS THE ATTRIBUTION AND IT IS WHY THIS IS FILED RATHER
THAN FIXED IN A LANE.** The base run was made in a detached worktree at
`09526da` with T-225-s2's diff ABSENT, in the same window as the tip
runs, and the same body reds. It is a property of the SUITE's load, not
of any lane's work — and a red that arrives on whoever happens to be
running the battery is a red attributed to the wrong card.

**THE LIKELY MECHANISM, STATED AS A HYPOTHESIS AND NOT AS A FINDING.**
The control writes a holder record built from `processRow(process.pid)`
— the playwright WORKER's own row — and passes `startedAt:
live?.startedAt ?? ""`. If that `ps` read comes back empty or late under
a loaded machine, the record

## ATTRIBUTION handed to this lane, 2026-09-02 (T-216-s8's executor, observed, not changed)

The holder control body (push-guard.spec.ts near line 2960 at 8b5000d;
2718 at older refs) reds only under the FULL e2e suite on a loaded
machine and never alone. Its recorded failure is the control's OR
(`verdict === "block" || notices include SEAT`). Enumerating the states
that satisfy neither: `held` blocks; `dead` and `unknown` each print a
SEAT sentence; `mine` is unreachable (ppid ≠ pid). So the red can only
come through a SILENT ALLOW — `not-a-repository`, `not-this-repository`,
holder `vacant`, or holder `not-integration` — and every one of those is
reached only through an errno-swallowing filesystem probe: `existsSync`
(false for EMFILE/EACCES exactly as for ENOENT) at checkout-currency.mjs's
readHolder first line (→ vacant) and at decideWith's indexer-manifest
check (→ not-this-repository), plus bare try/catch around statSync and
readFileSync in lane-fence.mjs's gitDirOf/headRefIn (→ not-integration).
Under the descriptor pressure of six concurrent Playwright processes a
probe answering "not here" about a file that is there becomes a verdict.
The `ps` read is excluded: a failed ps yields dead or held, both of
which satisfy the assertion. Cheapest first step: put `d.code` and the
notices into the two assertions' messages so the next red attributes
itself; the fix is that those probes distinguish ENOENT from every other
errno, or the silent allows stop being silent.

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-237-s8: `git show e2dee42^:docs/tasks/T-237-s8-the-identity-s-own-home-file-does-not-name-the-machine-where-it-will-not-derive.md`
- T-237-s9: `git show e2dee42^:docs/tasks/T-237-s9-two-refspec-reader-residues-the-verifier-filed-as-non-blocking.md`
- T-229-s11: `git show 162b04f^:docs/tasks/T-229-s11-a-push-guard-body-reds-only-in-the-whole-e2e-run-and-passes-alone.md`
- T-225-s14: `git show 866ac33^:docs/tasks/T-225-s14-the-holder-control-reds-under-the-full-suite-and-passes-alone-at-the-base-too.md`

A lane building this card reads those before it builds.

## Implementation notes (executor claude-opus-5@subagent, 2026-09-09)

**BASE fad35be7a6f544faba064f92fd90725233627623, lane
`task/T-238-s1-five-residues-of-the-holder`.** Two commits, both inside
the five-path fence plus this file.

**ITEM 1 — THE CITATION.** `sessionIdentity`'s refusal cited
`HARNESS_ARGV0_BASENAME`; nothing has ever exported that name. It now
cites `HARNESS_PROGRAM_BASENAME` and `HARNESS_PROGRAM_RE` — the two
constants that actually match the harness — and the section the
derivation is stated in, named as *this file's holder section above
`sessionIdentity`* rather than by repeating the section's own heading,
because an existing body asserts that heading is UNIQUE in the file and a
second copy would red it. The keeper is mechanical rather than a second
spelling: a new body extracts every SHOUTED_SNAKE token from the refusal
and requires each to be a name the module exports, with the sentence AS
IT STOOD as the control that the extractor can fire at all.

**ITEM 2 — `--release-seat`.** `unknown` carries two codes and the arm
caught one: the guard branch tested `figures.holderAlive === true`, which
is set only once the record has PARSED, so an UNREADABLE record fell
through to the release, was deleted, and the seat was told the next
session takes it unopposed. Both halves of that sentence were false. The
arm now refuses on `HOLDER_CODES.UNREADABLE`, leaves the file, and makes
it a FINDING (exit 1). The documented remedy is unchanged and is where it
belongs: `holderVerdict`'s own sentence for this state is *delete the file
or re-take the seat*, and `--take-seat` still does exactly that.
`removeHolder` was repaired in the same class — it answered "there was
nothing to remove" for every errno, so a failed removal read as a clean
release; it now returns FALSE only for ENOENT and throws otherwise, and
the arm turns that throw into CANNOT_RUN.

**ITEM 3 — THE PREMISE, RE-MEASURED IN THIS SESSION'S OWN TOOL SHELL.**
`env | grep -E '^CLAUDE'` plus one `ps`, 2026-09-09 on Mac.lan:
`CLAUDE_CODE_SESSION_ID` SET, `CLAUDE_PID` SET and equal to the tool
shell's own PARENT — the very harness process the walk stops at, pid
19232, `ps` confirming its command is the embedded `claude` binary — and
`CLAUDE_PROJECT_DIR` UNSET. So the card's item 3 is confirmed at my own
ref and host: the header's *"a Bash tool call carries no session id"* was
false and only the `CLAUDE_PROJECT_DIR` half was right. The header now
carries the reading and FOUR stated reasons the ancestry is still the
instrument (it survives a harness that stops exporting them; it names a
process `ps` can be asked about, which is what lets a stale record retire
itself; only the process carries the START TIME that closes pid reuse; and
a variable is a claim the party under test makes about itself where the
process table is read from outside it). The old sentence is QUOTED in
order to be retracted, and the keeper asserts it occurs exactly once and
inside the retraction — a body demanding the words be gone would push the
next editor into deleting the record of the mistake.

**ITEM 4 — THE DETACHED CHECKOUT.** `not-integration` now carries two
codes. A LANE keeps the silence rule 4 gives it. A checkout whose HEAD
names NO BRANCH gets `HOLDER_CODES.NO_BRANCH`, and both arms say it: the
push guard ANNOUNCES it on the push, and `brief.mjs` prints it in the
holder block it already renders for every non-`mine` state. The sentence
names BOTH causes — a detached HEAD and a HEAD this reader could not read
— because `headRefIn`'s own header says it collapses the two, and
claiming to tell them apart would be a second implementation. That
collapse is also why this repair closes one of T-216-s8's silent allows:
an EMFILE on `.git/HEAD` lands here and is now announced.

**ITEM 5 — THE FIXTURE.** `currentVantageCheckout` was the only fixture
in this repository's whole suite that wrote the host's `git worktree
list`; I checked the argument of every `worktree add` in
`tools/e2e/tests/` and the other eight files all pass a scratch
repository. It is now a `--shared --no-checkout --single-branch` CLONE at
the integration ref, which satisfies both arms for the same reason the
worktree did (its HEAD IS main's commit, so the vantage has that object
and the guard-surface commit is an ancestor of it), costs about 30 ms and
104 KB measured against this repository, and appears in no worktree list.
The `afterAll` hook no longer runs `git worktree prune` either: pruning
the host's administration is the same shared write in a tidier costume.
One assertion was retired with the worktree — *the sweep names a checkout
registered SECONDS AGO* — because it cost that write to make; the property
it bought is unmoved in `THE SWEEP NEEDS NOTHING DECLARED`, which builds
every checkout it then counts over a scratch repository.

**ABSORBED T-237-s8.** The CI runner is now named in the identity's OWN
limits block, with the ancestry that makes it so (node under bash under
Runner) and what the callers do there (announce and allow), and
`push-guard.mjs`'s consumer header is reduced to a POINTER that no longer
restates it — a body reads both files and requires the consumer NOT to
carry the ancestry, so the pair cannot drift back apart. The third
criterion's body drives the runner's ancestry through the injected process
reader with a derivable ancestry as its positive control in the same body.

**ABSORBED T-237-s9 — AND ONE OF ITS TWO RESIDUES WAS FALSE OF GIT.** The
option-shaped destination is repaired: `readsAsOption` is the narrowest
shape check that can be true of a branch name, since `git
check-ref-format` refuses a component beginning with `-`, and the line
becomes an announced ALLOW the way `pathsSince` declines a malformed
`headSha`. A body drives `HEAD:--version` through the WIRED hook and reads
the shim's own argument record to show `gh` was never asked. **THE
`--repo` RESIDUE DOES NOT REPRODUCE.** Measured on git 2.50.1 in a scratch
repository with one working remote, all at `--dry-run`: `git push
--repo=origin ./not-a-repo main` fails with *'./not-a-repo' does not
appear to be a git repository*, `git push --repo=origin refs/heads/main`
fails the same way, and `git push --repo=nonexistent origin main` PUSHES
through the positional remote. git takes the FIRST POSITIONAL as the
repository whatever `--repo` says, so the scanner already agrees with it,
and the criterion's own repair — every positional a refspec under `--repo`
— would have read `origin` as the target branch of `git push --repo=x
origin main`, which is strictly weaker than the state it was correcting. I
replaced the limits entry with the measurement rather than deleting it,
and a body drives git itself so the next reader meets the reading. THE
CRITERION IS THEREFORE NOT MET AS WRITTEN AND IS REFUSED WITH EVIDENCE.

**ABSORBED T-229-s11 + T-225-s14 + T-216-s8 — ATTRIBUTION FIRST, AS THE
CARD ASKS.** (a) The holder control's assertions now carry the arm's
`code` and its notices through a `said()` helper, so the next red names
the silent allow it came through instead of leaving the next seat to
enumerate the reachable states by hand. (b) The body no longer measures
the machine: it composed the SESSION's identity already, and it now
composes the RECORD's liveness too — `readProcess` is threaded through
`decideWithSeat`, so nothing in the seat arm depends on a `ps` read that
can come back empty under load. (c) The two errno-swallowing probes INSIDE
this fence are repaired and each has a body: `readHolder` reads once and
reads the errno, so EACCES/EMFILE is an inability and never a vacant seat;
the guard's indexer-manifest probe announces instead of taking the silent
`not-this-repository` allow, and its sibling in the unresolved-push arm
treats an unreadable probe as OURS so T-216-s8's refusal fires rather than
the guard going quiet. Both bodies PRODUCE EACCES with `chmod 000` rather
than simulating it.

**WHAT I COULD NOT MEASURE.** The intermittent did not reproduce. The
baseline full `gate-run e2e` at the base ran GREEN 740/740 while TWO OTHER
full e2e runs were live on this machine (three concurrent
`gate-run-e2e-*` output files, 18 live playwright processes at 08:51), and
the holder control passed. So the load condition alone is not sufficient
here, and the repairs above are the card's *cheapest first step* plus the
two probes it named — not a reproduction. The third probe named in the
attribution, `lane-fence.mjs`'s `gitDirOf`/`headRefIn`, is OUTSIDE this
fence and is filed as T-238-s3 rather than asked for.

**OWED AT THE MERGE, NOT DOABLE HERE.** Eight test names are added, so
`npm run capabilities` is owed IN THE MERGE COMMIT — docs/CAPABILITIES.md
is outside this fence and read-only in the lane. GRAPH REGEN's trigger
FIRES on the suffix rule and cannot move the graph: every path in this
diff is `.supertaskrignore`d (`docs/`, `tools/`, `/.claude/`). BOOT GATE
and the METHOD EVAL GATE are not owed — nothing under `app/`, no
manifest, no `method/**`, and no `attack set:` line added here.

## Suggested cards from this lane

- **T-238-s3** — `lane-fence.mjs`'s `gitDirOf` and `headRefIn` swallow
  every errno, so `not-a-repository` and `not-integration` remain silent
  allows under descriptor pressure. This is the THIRD probe T-216-s8's
  attribution names and the only one this fence could not reach; the two
  inside it are repaired here, and the arm's own announcement now covers
  the branchless case from the other side.
  `touches: [.claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]`
- **T-238-s4** — `--take-seat` writes over a record it could not read
  WITHOUT saying it replaced anything. Re-taking is the documented remedy
  for an unreadable record and stays right; announcing a takeover only for
  a DEAD holder is what is wrong, and the sibling arm this card just
  taught to refuse is the reason the asymmetry is now visible.
  `touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/checkout-currency.spec.ts]`
- **T-238-s5** — CONVENTIONS' app setup command cannot be run inside a
  lane. `npm install` from `app/` rewrites `app/package-lock.json`, which
  the lane-lock layer leaves read-only for any lane not fenced to it, so a
  fresh lane worktree takes EACCES at exit 243; `npm ci` is the spelling
  that works and is what CI already runs. Measured in this lane on
  2026-09-09. Whoever takes it should note that editing a command bullet
  may red `workflow-parity.spec.ts`, so triage may need to widen the fence.
  `touches: [docs/CONVENTIONS.md]`

## Verdicts

### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

**Tip judged `37a4ccca7d8e31e08a84af53ee9a104fa43a4220`, base
`fad35be7a6f544faba064f92fd90725233627623`**, on the detached bench
`../nputer-V-T-238-s1`, port 25238, node v22.22.0, git 2.50.1 (Apple
Git-155), Mac.lan.

**Sealed inputs, verified by `shasum -a 256` before anything else was
opened:**

    sha256:40fe8fd25bab446cd3b70c7ed3fffe33ff93e28675d1b0202128035d23dee70f  attack-set-T-238-s1.md
    sha256:b78fc7f5eec60b3a63c94235c29f7929ada622dc04fe7f5fd7f606653e19f24f  ground-T-238-s1.md

#### THE FRAME I ACTUALLY HAD, said rather than promised

- **Phase 1's attack set was written blind at the base and hashed; this
  phase is a fresh spawn.** Both digests above matched on the first read.
- **THE EXECUTOR'S NOTES REACHED ME EARLIER THAN THE ORDER INTENDS, AND
  THE BRIEF'S OWN STEP 4 IS WHY.** The implementation notes live INSIDE
  this card, so `git diff fad35be..37a4ccc` — step 4's own instruction —
  carries them. I read them before running a single attack. The set was
  fixed and hashed beforehand, so what it attacks was not shaped by them;
  what I cannot claim is a notes-free frame while executing. Any future
  bench that wants that separation must diff the card path out.
- **Two ground truths did not capture in the sealed file** (G6 and G13
  died on `sed`/`nl` argument errors). I took them myself at the base
  before opening the diff. G6 was also pointed at the WRONG FILE: it names
  `tools/e2e/scripts/lane-fence.mjs`, and `gitDirOf`/`headRefIn`/
  `findCheckoutRoot` live in **`.claude/hooks/lane-fence.mjs`**. Both
  copies are outside the fence and both are untouched.
- **My full `gate-run e2e` ran CONCURRENTLY with another full e2e suite**
  (the T-256 lane's, pid 61227, output `gate-run-e2e-YPdlAp`; mine was
  `gate-run-e2e-uko9sV`), with 12 live playwright processes on the host.
  That is the loaded condition T-225-s14 and T-229-s11 name, and the
  holder control passed in it.

#### SUITES — the whole battery once at my own tip, through the blessed runner

| suite | exit | count | ref |
|---|---|---|---|
| parser | 0 | 389 bodies GREEN | 37a4ccc |
| app | 0 | 1171 bodies GREEN | 37a4ccc |
| rust | 0 | 654 bodies GREEN (18 targets) | 37a4ccc |
| e2e | 0 | **748 bodies GREEN** | 37a4ccc |
| the two fenced specs alone | 0 | 135 passed (90 + 45) | 37a4ccc |

748 = the base battery's 740 (ground truth G10, at ec97763) plus the
eight bodies this lane adds — four in each fenced spec, and I diffed the
two body lists to confirm the delta is exactly those eight. No `.skip`,
`.fixme`, `.only`, `.slow`, retry annotation or timeout bump anywhere in
either fenced spec; `playwright.config.ts` is untouched and still
`retries: 0, workers: 1`.

`index --check`: **CURRENT**, exit 0 (1198602 bytes, 201 files).
`capabilities:check`: **STALE** — 63301 committed against a 64070-byte
fresh generation, which is the expected consequence of eight new test
names and is the integrator's at the merge, exactly as the lane declares.

#### THE FENCE AND THE RECORDS

- **The fence holds.** `git diff --name-only` is the five fenced paths,
  this card, and three new cards under `docs/tasks/`. Nothing else.
- **`.claude/hooks/lane-fence.mjs` is byte-identical at base and tip**
  (`a7768da8…e610ac` both sides). The attribution invited an edit there
  and the lane did not take it — it filed T-238-s3 instead, which is the
  narrow gap between hardening two of four probes and breaching the fence.
- **This card's original text survives byte-for-byte.** Lines 18–205
  hash identically at base and tip (`119ce4a2…8caa1`). The only
  frontmatter movement is `status: building -> verifying` and `built_by`
  stamped — both legal lifecycle.
- **No verdict, ADR, checkpoint, room or `method/` file is touched, and
  `docs/CAPABILITIES.md` was not regenerated in the lane.**

#### THE FIVE CRITERIA, RE-MEASURED

**R1 — the dangling citation. MET, and mechanically pinned.**
The refusal now cites `HARNESS_PROGRAM_BASENAME` and `HARNESS_PROGRAM_RE`
— real exports at lines 1069/1072 that `isHarnessProcess` itself reads at
1232–1233, so this is the derivation's own matcher and not a constant
minted to make a citation resolve. It also names the section rather than
a heading literal, which avoids colliding with the existing uniqueness
assertion. `HARNESS_ARGV0_BASENAME` survives at tip only in the two CARD
files (records) and inside the new keeper's own control string; zero
occurrences in production prose. **My attack set predicted this would be
pinned by a literal only and could go dangling again silently. It was
wrong**: the keeper extracts every SHOUTED_SNAKE token from the live
refusal and requires each to be in `Object.keys(currency)`.

**R2 — `--release-seat`. MET across every shape I could build.** Driven
against a scratch fixture, five record shapes plus the vacancy:

| record | exit | kept | errno named |
|---|---|---|---|
| unparseable `{ not json` | 1 | yes, **sha256 byte-identical** | parse position |
| `chmod 000` (EACCES) | 1 | yes | `EACCES` |
| a DIRECTORY at the path | 1 | yes | `EISDIR` |
| `{}` / `{version}` / `{identity:{}}` / pid `"abc"` / pid `0` | 1 each | yes each | shape named |
| ABSENT (the over-refusal control) | **0** | — | releases, base class |

So the repair is errno-aware and not merely a `JSON.parse` catch — which
was the sharpest thing my set expected to find surviving. **C1, a control
I proposed and therefore owed:** the same fixture with a well-formed DEAD
record releases cleanly (exit 0, file gone), so the refusal bodies are not
an arm that refuses everything.
*Security (R2-f):* the delete path is `holderPath(root)` — a CONSTANT
suffix `.supertaskr/holder.json` under `--root`. No operand reaches the
filename, so there is no arbitrary-unlink primitive; and a lane or a
detached checkout is refused before the release path is reached at all.

**R3 — the false premise. MET.** The header carries the date
(2026-09-09), the instrument (`env | grep -E '^CLAUDE'` plus one `ps` in
a Bash tool call) and the per-name outcome — and **every value agrees
with the dispatcher's own base measurement**: `CLAUDE_CODE_SESSION_ID`
set, `CLAUDE_PID` set, `CLAUDE_PROJECT_DIR` unset. Nothing is claimed
that the base reading contradicts. Four reasons are given for keeping the
ancestry, the reading is scoped to where it was taken (so it does not
contradict the new CI-runner limit), and the old sentence is quoted in
order to be retracted — pinned to occur exactly once, inside the
retraction, with the anchor shown capable of failing against the sentence
as it stood.

**R4 — the detached checkout. MET, per arm and beyond the card's
example.** The guard is `seat.headRef === undefined`, not a comparison
against `main`'s tip, so it is strictly wider than the card asked for:

| arrangement | `--release-seat` | `--take-seat` | push guard |
|---|---|---|---|
| detached at `main`'s TIP | NO_BRANCH | NO_BRANCH | notice |
| detached at `main~1` | NO_BRANCH | NO_BRANCH | notice |
| a LANE branch | silent (lane's code) | silent | silent |
| **C2 — a normal branch checkout** | **no notice, exit 0** | **no notice, exit 0** | silent |
| not a repository at all | exit 3 CANNOT_RUN, named | — | — |

Demonstrated live: `--preflight` at this detached bench prints
`holder: not-integration [holder-head-names-no-branch]` with the remedy,
and writes nothing (`git status --porcelain` empty after). **It is a
NOTICE, not a refusal** — R4-c holds, so the other lanes' detached control
worktrees keep their exit codes. **C2 is the control I proposed and
owed**, and it is genuinely absent on a branch.
*R4-d, which my set flagged as a masking risk:* the new notice does
contain the token `SEAT`, but it cannot reach the holder control's OR —
that control's `onMain` fixture has a branch, so `NO_BRANCH` is
unreachable there, and its lane half is on a task branch. No interference.

**R5 — the fixture. THE OPERATIVE PROPERTY IS MET AND MEASURED; THE
CRITERION'S LITERAL HALF IS NOT, AND WAS NOT REFUSED. See Correction 1.**
Measured either side of the full e2e run, the host's `git worktree list`
**path set is identical** — the suite registers nothing. That measurement
is only worth something if the comparison can fail, so **C3, which I
proposed and owed**: on a throwaway stand-in host I registered a worktree
and the same path-set comparison fired, while a `--shared` clone added no
entry. I did not test the detector against the real host, by design.

#### THE ABSORBED CARDS

**T-237-s8 (A1) — MET.** The CI runner is named in the identity's own
limits block with the ancestry and with what the callers do
(`ANNOUNCE AND ALLOW`); `push-guard.mjs`'s header is reduced to a pointer,
and a body reads BOTH files and requires the consumer not to restate the
ancestry. The incident's own trap was avoided: **no `<-` was added to any
card** — the arrows are only in `.mjs`, which the card preflight does not
parse — and my own preflight run confirms no dispatch refusal from it.

**T-237-s9 (A2) — one residue REPAIRED, one REFUSED WITH EVIDENCE, and
the refusal is SOUND.**
*The `-` destination is closed, and closed BEFORE `gh`.* With a recording
spy in `ciVerdict`'s `gh` seam:

    HEAD:--branch                -> ghCalls=[]   "CI WAS NOT ASKED: ... will not hand a value beginning with `-`"
    HEAD:-x                      -> ghCalls=[]
    HEAD:refs/heads/--version    -> ghCalls=[]
    HEAD:--upload-pack=/bin/sh   -> ghCalls=[]
    C4 (control) HEAD:main       -> ghCalls=[["run","list","--branch","main",...]]
    C4 (control) bare `git push` -> ghCalls=[[...]]

**C4 is the control I proposed and owed**: the spy DOES record on benign
pushes, so "no argv recorded" is a measurement and not a broken spy. For
the record, the argv the base would have handed `gh` is
`["run","list","--branch","--branch",...]` — the injection, now
unreachable. No false positives: `+HEAD:main`, `feat-x`,
`HEAD:refs/heads/main`, `-o x`, `--push-option=x` and
`--force-with-lease=main` all still resolve to their true targets.
*The `--repo` residue is REFUSED WITH EVIDENCE, and I re-derived the
measurement independently* on git 2.50.1 in a scratch repository with a
scratch remote, all at `--dry-run`:

    git push --repo=origin ./not-a-repository main
        -> fatal: './not-a-repository' does not appear to be a git repository
    git push --repo=origin refs/heads/main        -> the same fatal
    git push --repo=origin HEAD:main              -> the same fatal (the card's OWN shape)
    git push --repo=nonexistent origin main       -> PUSHED, through the positional

**The criterion rests on a false premise about `git`.** git takes the
first positional as the repository whatever `--repo` says, so the scanner
already agrees with it, and the demanded repair would have read `origin`
as the target of `git push --repo=x origin main` — strictly weaker than
what it corrected. The refusal is sound, it is filed on the card as a
refusal rather than a rewrite, and **it is itself defended by a body**:
planting the demanded repair (M13) reds two bodies.

**T-229-s11 + T-225-s14 + T-216-s8 (A3) — the attribution was done
first, and the control was NOT weakened.**
The OR survives character-for-character —
`control.verdict === "block" || (control.notices ?? []).join("").includes("SEAT")`
— and `expect(control.code).toBe("holder-live-elsewhere")` with it. Only
the assertion MESSAGES changed, gaining `said()`, which is a function of
the decision object evaluated at each call site: I rendered it for every
silent-allow route and it names the code and the notices at BOTH sites,
so the next red attributes itself rather than leaving the next seat to
enumerate states by hand. The body also stops measuring the machine — the
record's liveness is now a composed table rather than `processRow` of the
worker — **and that is isolation ON TOP OF the named repair, not instead
of it**: both in-fence probes are hardened, each with its own body that
PRODUCES `EACCES` with `chmod 000` rather than simulating it, and the two
out-of-fence probes are filed as T-238-s3 rather than silently edited.
The intermittent did not reproduce for me either, and I say so rather
than claiming the repair is proven by a green: 748/748 under a
concurrently-loaded host is consistent with the repair and does not on
its own establish it.

#### THE MUTANT DRILL — producer-side, every landing read from `git diff`

| # | mutation | kill set | size |
|---|---|---|---|
| M1 | rename the export the citation names (leaving the citation text) | the citation keeper | 1 |
| M2 | drop `--release-seat`'s UNREADABLE branch | the release-seat body | 1 |
| M2b | keep the refusal SENTENCE, delete the record anyway | same body, at *"AND THE RECORD IS STILL THERE"* | 1 |
| M3 | `readHolder` swallows every errno | the errno probe body | 1 |
| M4 | route `ENOENT` into the refusal (over-refusal) | 13 bodies | 13 |
| M7 | silence the detached arm in the CONSUMER only | the push-guard detached body (the HOME's body lives) | 1 |
| M11 | remove the runner ancestry from its HOME | the header body, at *"with the ancestry that makes it so"* | 1 |
| M11a | make the CONSUMER restate the ancestry | the header body, at *"does NOT restate the ancestry"* | 1 |
| M13 | implement the repair T-237-s9 demanded | 2, incl. the `--repo` body | 2 |
| M14 | remove the option-shape check | the gh-argv body | 1 |
| M15b | the GUARD's probe swallows every errno | the *COULD NOT LOOK* body | 1 |

**Containment, which is the test that matters and not the counts.** M3
and M15b have DISJOINT kill sets, so the two errno bodies are
per-call-site and neither is a restatement of the other. M3's kill set is
contained in M4's, but M3 kills only the errno body and M4's other twelve
survive M3 — so neither body is a restatement either. M7 kills the
consumer's body while the home's detached body passes, which is what
makes R4's per-arm coverage real rather than one body covering two arms.
Every mutant died at the site the property lives.

**M9 WAS NOT RUN, DELIBERATELY.** The data mutant for R5 is *make the
fixture a worktree of the host again* — and running it would register a
worktree in the host's shared list, which is the very act this card
exists to remove and which my brief forbids. C3 above is what I ran
instead, and it is why the before/after comparison is evidence.

#### A CONTROL I PROPOSED THAT COULD NOT FAIL, disclosed

My attack set's R5-a asked for a runtime assertion that the fixture's
`git rev-parse --git-common-dir` resolves under the temp directory. **It
is degenerate against this implementation**: I measured it, and the clone
answers `.git` — its own — while `objects/info/alternates` points at
`/Users/ujju/Projects/nputer/.git/objects`. The check would have passed
while the borrow it was meant to catch was live. Naming it, because a
control that cannot fail is the defect this method produces most, and I
proposed this one.

#### CORRECTION 1 (assigned) — criterion 5's unmet half is presented as met instead of refused with evidence

**The finding.** The card says the fixture *"SHALL be a clone or a
worktree of a SCRATCH repository, never of the host's"*.
`currentVantageCheckout` at tip is
`git clone --quiet --shared --no-checkout --single-branch --branch main <repoRoot> <at>`
— a clone **of the host**. I measured what that leaves: a 104 KB tree
built in 0.02 s whose `.git/objects/info/alternates` contains
`/Users/ujju/Projects/nputer/.git/objects` (both of the lane's own figures
re-derive). So the operative half is delivered — nothing enters
`git worktree list`, measured either side of a full run — and the literal
half is not.

**Why this is a correction and not a rejection.** The hazard the card
names is a WRITE into a machine-scoped surface, and that write is gone.
What replaced it is a READ borrow, and I measured its direction on a
stand-in: after the source made an object unreachable and ran
`gc --prune=now`, the borrowing clone answered
`fatal: git cat-file: could not get object info`, while the source's own
`fsck` stayed clean with the clone deleted. **The host cannot be harmed
by this fixture**, and in practice the borrowed object is the integration
tip, which is reachable by definition. Further, the literal criterion is
UNMEETABLE while the arm's vantage is `defaultVantage()` — a scratch
repository's HEAD is an object this vantage has never heard of, which the
lane's own header explains correctly.

**So what is actually wrong is the bookkeeping, and this lane knows the
right move because it made it once already**: it refused T-237-s9's
`--repo` criterion with a dated measurement rather than rewriting it. The
same is owed here, plus a declared limit — this project's rule is that a
limit is DECLARED rather than discovered, and T-237-s8, absorbed into
this very card, is a whole card about a limits list missing the limit
that had fired. The fixture's new header declares the one property it
DROPPED (shared refs) and is silent about the one it CREATED.

**Assigned:** (a) a dated *REFUSED WITH EVIDENCE* section on this card for
criterion 5's *"of a SCRATCH repository"* half, carrying the vantage
argument and the alternates reading; (b) the borrow declared in
`currentVantageCheckout`'s own header; (c) the body below, which pins (b).

**THE BODY, VERBATIM, for the integrator to lift** — appended to
`tools/e2e/tests/checkout-currency.spec.ts`. I ran it against an
implementation that LACKS the property and saw it RED at
*"and the file that borrow leaves behind"*, and against one that carries
it and saw it GREEN (1 passed, 921 ms):

```ts
test("the vantage fixture DECLARES what it borrows from the host, because a clone that borrows is not a scratch repository", () => {
  // T-238-s1's FIFTH CRITERION asks for "a clone or a worktree of a
  // SCRATCH repository, never of the host's". `currentVantageCheckout`
  // cannot be that, and the reason is structural: the arm's vantage is
  // `defaultVantage()` — this file's own checkout — and a target reads
  // CURRENT only if the vantage can `git cat-file` its HEAD, which a
  // freshly `git init`ed repository's HEAD never is. So the fixture
  // clones THE HOST, and `--shared` leaves `.git/objects/info/alternates`
  // pointing into the host's object store.
  //
  // THE WRITE IS GONE AND THAT IS THE POINT: nothing is added to
  // `git worktree list` any more. What replaced it is a READ dependency
  // on a surface this machine shares — one-directional (a host `gc`
  // breaks the fixture; the fixture cannot touch the host) and near-zero
  // in practice, because the object borrowed is the integration branch's
  // tip and is reachable by definition. This project's rule is that such
  // a limit is DECLARED rather than discovered — T-237-s8, absorbed into
  // this very card, is a whole card about a limits list missing the limit
  // that had fired — so the borrow is named where the fixture is built.
  //
  // KILLED BY: dropping the declaration from the header, or by making the
  // fixture borrow without saying so.
  const source = readFileSync(
    path.join(repoRoot, "tools", "e2e", "tests", "checkout-currency.spec.ts"),
    "utf8",
  );
  const at = source.indexOf("function currentVantageCheckout");
  expect(at, "the fixture this body is about is in this file").toBeGreaterThan(-1);
  // NORMALISED the way this file's other header bodies normalise, because
  // the prose wraps: a sentence split across two ` * ` lines is the same
  // sentence, and an assertion that could be defeated by a line break is
  // measuring the wrapping rather than the declaration.
  const header = source
    .slice(source.lastIndexOf("/**", at), at)
    .replace(/^\s*\*\s?/gm, "")
    .replace(/\s+/g, " ");
  expect(header, "the header names the clone flag that makes it borrow").toContain("--shared");
  expect(header, "and the file that borrow leaves behind").toContain("alternates");
  expect(header, "and says the criterion's SCRATCH half is not met, rather than implying it is").toContain(
    "never of the host's",
  );

  // AND THE BORROW IS REAL, so the declaration cannot outlive the code it
  // declares: the clone this helper builds carries the alternates file,
  // and it points somewhere that is NOT the fixture's own object store.
  const built = currentVantageCheckout("borrow-declared");
  const alternates = path.join(built, ".git", "objects", "info", "alternates");
  expect(existsSync(alternates), "the clone borrows, exactly as the header says").toBe(true);
  expect(
    readFileSync(alternates, "utf8").trim(),
    "and it borrows from OUTSIDE itself — which is the whole of what is being declared",
  ).not.toContain(built);
});
```

And the declaration it pins, which I ran the body against — inserted in
`currentVantageCheckout`'s header immediately before the existing
*"The one property it drops is SHARED REFS"* sentence:

```
 * WHAT IT BORROWS, DECLARED (T-238-s1's verifier): `--shared` writes
 * `.git/objects/info/alternates` pointing at the HOST's object store, so
 * the criterion's *a clone or a worktree of a SCRATCH repository, never of
 * the host's* is NOT met, and cannot be while the vantage is this checkout.
 * The hazard is one-directional and bounded: a host `gc` can break this
 * fixture, this fixture can never touch the host, and the object borrowed
 * is the integration tip, which is reachable by definition.
```

#### CORRECTION 2 (assigned, board hygiene) — T-238-s5 is the THIRD filing of one defect, and one of the other two is a LIVE LANE

`T-238-s5` (*CONVENTIONS' app setup command cannot be run inside a lane*)
restates, with the same measurement and the same remedy:

- **`T-216-s6`** — *"A fresh lane cannot run CONVENTIONS' own setup command
  — `npm install` from app/ dies EACCES on app/package-lock.json under the
  physical layer"*, `status: planned`,
  `touches: [docs/CONVENTIONS.md, tools/e2e/tests/workflow-parity.spec.ts]`.
- **`T-256`** — same finding, `status: planned`, same `touches:` — **and it
  is a live lane right now**: `/Users/ujju/Projects/nputer-T-256` on
  `task/T-256-npm-ci-one-spelling`, which was running its own full e2e
  suite while I judged this one.

This is not a rejection — the observation is true and was made honestly
from inside the lane — but a third card for work already in flight is
board noise, and its `touches: [docs/CONVENTIONS.md]` also omits
`tools/e2e/tests/workflow-parity.spec.ts`, which **its own second
acceptance criterion says the fence must reach**. *Assigned:* withdraw or
fold `T-238-s5` into `T-256` at triage. I did not file a card for this,
deliberately: a fourth card about it would be the same mistake.

#### FINDINGS THAT DO NOT BLOCK, and no card filed for them either

1. **`T-238-s3`'s acceptance criteria do not reach the probe its own body
   blames.** The card correctly identifies that `findCheckoutRoot`
   answering *no checkout here* is what produces the silent
   `not-a-repository` allow — but `findCheckoutRoot` does NOT call
   `gitDirOf`; it carries its **own** `statSync` in a bare `catch { }`
   (`.claude/hooks/lane-fence.mjs:867–880`). The criteria name only
   `gitDirOf` and `headRefIn`, so the card as written would close half of
   what it identifies. Whoever picks it up should widen it by one function.
2. **`T-238-s4`'s stated mechanism overstates what I measured.** It says a
   seat taking a checkout with an unreadable record *"is never told there
   WAS one"*. Driven against a scratch fixture, `--take-seat` DOES print
   `holder: unknown [holder-unreadable]` with the parse error before it
   writes. What is genuinely missing is the TAKEOVER sentence — the DEAD
   branch renders *"TAKEN OVER from a dead holder"* and this path renders
   only *"THE SEAT — TAKEN"*. The asymmetry the card is about is real; its
   sentence about it is not.

#### SECURITY SWEEP (mandatory) — no findings

- **`--release-seat`'s path derivation:** confined to a constant
  `.supertaskr/holder.json` suffix under `--root`; no operand reaches the
  filename; no arbitrary-unlink primitive. A lane and a detached checkout
  are refused before the release path.
- **Every `rm`/unlink:** `removeHolder` is the only one, and it now throws
  on any errno but `ENOENT`/`ENOTDIR` instead of reporting a clean
  release; `brief.mjs` turns that throw into `CANNOT_RUN` and says the
  seat was NOT released. `removeGitFixture` still targets only the
  fixture's own `mkdtemp` root.
- **Every `git` argv built from data:** all `execFileSync` argv arrays, no
  shell anywhere in these arms.
- **The refspec reader's `-`-prefixed destination BEFORE any `gh`
  invocation:** proven with a recording spy — `ghCalls=[]` for four
  option-shaped destinations including `--upload-pack=/bin/sh`, and the
  spy proven live by C4.
- **A fixture that clones or references the HOST's objects:** found, named,
  and judged in Correction 1. It is a read borrow, one-directional, and
  cannot harm the host — measured, not assumed.

#### WHAT THIS VERDICT DOES NOT ESTABLISH

The intermittent this card absorbs did not reproduce on my bench either,
so nothing here proves the holder control's red is gone. What is
established is narrower and worth more than a green: the two silent-allow
routes inside this fence are closed and each is pinned by a body that
produces a real `EACCES`; the two outside it are named on a card rather
than quietly edited; and when the control next reds, `said()` puts the
code and the notices in the failure message, so the fifth lane to meet it
will not have to enumerate the reachable states by hand.


#### STEP 7 — the gates my OWN commits could move, re-run at the tip I created

A verdict is a WRITE, and prose is a code input here: the docs gate names
this card a code input for three suites. Re-run at `b689d74`, which is the
commit the entry above created and which nobody had tested:

| gate | exit | count | ref |
|---|---|---|---|
| `gate-run parser` (the census reads every card) | 0 | 389 GREEN | b689d74 |
| `gate-run app` | 0 | 1171 GREEN | b689d74 |
| the five e2e specs that read `docs/tasks` — cli, landing-gate, push-checks, shell-frame, window-contract | 0 | 108 passed | b689d74 |
| `docs-gate.mjs <this card>` | 1 = FIRES, its normal answer | frontmatter parses with a legal status; injection scan 0 hits in 7 patterns | b689d74 |

The METHOD EVAL gate is NOT owed and I checked rather than assumed: this
verdict touches no `method/**` file, and there is no `attack set:`
frontmatter grammar in the tree for it to match — the phrase appears only
in a `dispatch-brief.mjs` comment. The GRAPH is unmoved (`index --check`
CURRENT at the tip, and `docs/` is `.supertaskrignore`d). `npm run
capabilities` remains owed IN THE MERGE COMMIT for the lane's eight new
test names, unchanged by anything here.

This addendum is itself a write, so the census was asked once more after
it; that run is quoted in the completion message rather than here, because
a figure that describes the commit it sits inside can never be true.

## Criterion 5, the SCRATCH half — REFUSED WITH EVIDENCE (the architect seat at the merge, 2026-09-09, T-238-s1's verdict, correction 1)

The card asks for a fixture that is "a clone or a worktree of a SCRATCH repository, never of the host's". The WRITE half is met and measured: the fixture no longer registers anything in the host's `git worktree list` (the path set identical either side of a full e2e run; the verifier's stand-in showed the comparison can fire). The SCRATCH half is NOT met and cannot be while the arm's vantage is `defaultVantage()` — this checkout: a target reads CURRENT only if the vantage can `git cat-file` its HEAD, and a freshly `git init`ed repository's HEAD is an object the vantage has never heard of. So `currentVantageCheckout` clones THE HOST with `--shared --no-checkout --single-branch`, and `.git/objects/info/alternates` in the clone points at `/Users/ujju/Projects/nputer/.git/objects` (measured at 37a4ccc: a 104 KB tree built in ~20 ms). What replaced the write is a READ borrow, one-directional and bounded — a host `gc` can break the fixture (the verifier measured it on a stand-in: `fatal: git cat-file: could not get object info` in the borrower, the source's `fsck` clean), the fixture can never touch the host, and the object borrowed is the integration tip, reachable by definition. The borrow is now DECLARED in the helper's own header and pinned by the body "the vantage fixture DECLARES what it borrows from the host, because a clone that borrows is not a scratch repository".

## T-238-s5 withdrawn at the merge (the architect seat, 2026-09-09, T-238-s1's verdict, correction 2)

T-238-s5 ("the documented app setup command cannot be run inside a lane") was the THIRD filing of one defect: T-216-s6 (planned) carries it with its criteria, and T-256 — a live lane at this merge — is building the remedy (`npm ci` for app/, the parity mapping retired). Its `touches:` also omitted the parity spec its own second criterion named. The file is removed in this merge; this paragraph is the surviving record. T-216-s6 is absorbed at T-256's merge.
