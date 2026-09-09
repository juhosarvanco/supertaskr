---
id: T-238-s1
title: Five residues of the holder record, recorded by T-238's verifier and not filed — a dangling citation in a refusal, a release that removes what it cannot read, a false premise about session ids, a detached integration checkout that holds no seat, and an e2e suite that writes the host's worktree list
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-238-verify, phase 2 at 7705ac4, filed by the architect seat at the merge
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/checkout-currency.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
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
