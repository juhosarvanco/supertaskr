---
id: T-331
title: "CI's planning job derives the owed set before the parser is built, so the static import edge to the parser's built entry cannot land and every push falls back to all four suites and all 42 e2e specs, while the same range locally selects three suites and 12 specs: give the planning job the preparation its derivation needs, keep the fail-closed fallback for genuinely unresolved inputs, and prove the local and fresh-runner selections agree for one exact range"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: verifying
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against the job logs and the local derivation"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/workflow-parity.spec.ts, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

CI runs the owed set CI-side since T-294: a planning job derives what the pushed range owes and the suite jobs run that. On the push of one amended card on 2026-09-15 the planning job's log reads that the derivation FAILED CLOSED because the static import graph has an edge it could not land on a file, the edge from the brief spec to the parser library's built entry, and it answered all four suites with the e2e leg whole: 42 spec files across four shards. The job checks out, sets up node and derives; it never installs or builds the parser, so the built entry does not exist when the graph is walked. The checks job gained exactly that preparation at T-317; the planning job did not. Locally, with the parser built, the same range derives parser, app and 12 e2e specs.

The fallback is the right answer for an input the derivation genuinely cannot resolve. Here the input is unresolvable only because of the job's own build order, so every push pays the fallback, and on this push the fallback cost a 37-minute shard for a change whose correct selection excludes that shard's slowest spec; the other three shards took 3 to 6 minutes, which suggests the size of the opportunity and does not establish the duration after the repair.

## What would settle it

The planning job prepares what its derivation walks: the parser installed and built before the owed set is derived (the same steps the checks job already runs), or the derivation resolving a generated entry through its owning source and build relationship without the build. The fail-closed answer stays for an input that is genuinely unresolved, and it names the input as it does today. A body proves parity: for one exact pushed range, the selection a fresh runner derives equals the selection the integration checkout derives, suite for suite and spec for spec. The card reports, for the push that lands it and for the next records-only push, the time to push and the time to CI completion separately; it promises no runner figure before that measurement.

## Acceptance criteria

- WHEN the planning job derives the owed set for a pushed range THE job SHALL have the parser library's built entry present before the derivation walks the import graph, or SHALL resolve that generated entry through its build relationship, and SHALL answer the same suites and specs the integration checkout answers for that range.
- WHEN an input of the derivation is genuinely unresolved THE derivation SHALL still fail closed to the whole battery and SHALL name the input.
- WHEN this card lands THE card SHALL record, for its own push and for the next records-only push, the time to push and the time to CI completion as two figures, with the specs each selection ran.

## Implementation notes

2026-09-15, the executor. The repair is the remedy this card names at the
head of "What would settle it": the planning job now prepares what its
derivation walks. `.github/workflows/ci.yml`'s `owed` job gained the two
steps the `checks` job has run since T-317, `npm ci` and `npm run build`
in `lib/parser`, placed before the step that asks, with the npm cache
keyed on that package's lockfile; the derivation itself is untouched, so
the fail-closed answer is the same code path it always was. The other
remedy the card offers, resolving a generated entry through its build
relationship, would have meant editing `tools/e2e/scripts/gate-run.mjs`,
which this lane's fence does not carry.

Measured at the base commit in the lane worktree, which begins with
nothing installed and nothing built: the walk reports two unresolved
edges, `tools/e2e/tests/brief.spec.ts` and `tools/e2e/tests/cli.spec.ts`
each importing `lib/parser/dist/pure.js`. After those two steps and
nothing else, zero. The two commands took 0.91 s and 0.69 s on this
machine with a warm npm cache.

The whole job was then run as the runner runs it, through
`tools/e2e/scripts/ci-owed.mjs` with the event environment of the push
this card was written from, over a stand-in tree holding exactly the
generated files the walk reaches and over one withholding them. Without
them the job writes `suites=app,e2e,parser,rust`, `e2e-whole=true`,
`spec-count=42`, `shard-count=4` and `run-boot=true`, and its log carries
the card's own sentence naming both edges. With them it writes
`suites=app,e2e,parser`, `e2e-whole=false`, `spec-count=12`,
`run-rust=false` and `run-boot=false` — the answer the integration
checkout gives for that range, suite for suite and spec for spec. The
saving is wider than the spec count alone: the rust leg and the boot
check, with its apt prerequisites and its cargo build, are skipped too.

Two keepers, both derived rather than listed. In
`tools/e2e/tests/workflow-parity.spec.ts` the generated inputs are read
off the tree — every file the derivation's own walk reaches that `git
ls-files` does not carry — and the `owed` job is held to installing and
building each one's package before it asks; a build output from a second
package arriving on the import graph reds there rather than quietly
restoring the battery. In `tools/e2e/tests/gate-run.spec.ts` a body takes
the integration checkout's answer for the range through `owedForRange`,
then derives the same range over a tree with those files withheld and
over one with them restored: the withheld arm fails closed and names both
edges, and the restored arm matches the checkout exactly. Each keeper
carries its own mutant fixture and its own positive control.

### In-fence follow-through

- `tools/e2e/tests/workflow-parity.spec.ts`, the rename fixture's victim
  selection: 18 lines added, 2 removed, of which 10 of the added lines are
  the comment that argues the change. The property restored is that the
  fixture makes a SINGLE-site rename: it chose its victim as the earliest
  named step carrying a `working-directory` and then asserted that name was
  written once, which held by luck until this card's own change gave the
  `owed` job a step whose name five other jobs already share; the body then
  red on its own precondition rather than on the guard behaviour it pins.
  It now selects a victim whose name is written once. The class is a
  fixture selecting its subject by position and asserting a property the
  position does not guarantee, and the sweep over both fenced specs found
  no other site.

  DISCLOSED RATHER THAN TRIMMED: added plus removed is 20, which sits
  exactly on the "about twenty" line step 5 draws, and that rule routes an
  arguable count out to a card. It is listed here instead because it is not
  a discretionary follow-through — this card's own change is what red the
  body, so repairing it is part of the primary change rather than scope
  taken on beside it. The count is stated so the reader rules rather than
  guesses, and the comment was not shortened to fit a budget it is not
  measured against.

### A finding outside this fence, reported and not repaired

The graded end-to-end leg at this lane's tip is RED on three bodies, all in
`tools/e2e/tests/push-guard.spec.ts` and all one cause, which is not this
card's: `seatFixture` copies every flat `docs/*.md` into its fixture root
and then copies each entry of the conventions chapter list, whose first
entry is `docs/CONVENTIONS.md` — so that one file is copied twice onto one
destination. `copyFileSync` gives the destination the source's mode, and a
fenced lane holds an out-of-fence file at 444 while the integration
checkout holds it at 644. In a lane the first copy therefore creates a
read-only destination and the second copy meets it. Demonstrated on its
own, outside the suite: the first copy lands read-only and the second
raises the same error. Re-run once, the same three fail identically.

It is invisible in the integration checkout, where the mode is 644, and
invisible to any lane running a scoped leg; this lane runs the whole leg
because the scoped reading refused this fence. The remedy is one line in
that fixture, normalising the destination's mode so a fixture the test
owns is writable whatever the source tree's mode is, and it lies outside
this lane's fence, so it was not made. The seat ruled on 2026-09-15 that
the fence stays as it is and that the separate card is the seat's to file
at the merge, carrying this attribution; no card was filed from this lane.

### What this lane does not record

The two figures the third criterion asks for are the seat's to take: they
are properties of a push that has not happened, and this lane invents
none of them. The merge owes `npm run capabilities` — this card adds test
names, the census is generated from them, and `capabilities:check` reads
STALE at this tip by 586 bytes; `docs/CAPABILITIES.md` is outside this
fence and was not regenerated here.

## Verdicts

### 2026-09-15 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Guarded tier, two-spawn bench, phase 2 at the lane tip `3814f0de` over base
`150f38eb`. The diff was read before the executor's notes, and the notes were
read afterwards as part of what is graded.

attack set: sha256:f27970c04f320d81f9c84f9ac083513e0882135e12a0333600d009362f5c5804 (attack-set-T-331.md)
ground: sha256:b2bba66a43cd6ccb72a9e63524458e8cb5b88e51058c2f1335610c1632d012b3 (ground-T-331.md)
card at 150f38eb: sha256:38af89108ad996f4190c53c3656d833d519cdf33e6872ad98d8a0c70bcddb6e5
ground-truth named by the addendum: sha256:1ee13d48370f5f0d999a7199efc1a8f6682f74c24a6a0d3dd6768577962e6717

All four digests were re-derived on this bench rather than taken on trust,
because the ground file was resealed by hand after the attack set was written.
They match.

**THE FRAME I ACTUALLY HAD, AND A PACK GAP.** This phase-2 brief carried NO
CONTEXT PACK — the known and filed arm defect T-296-s10, which docs/STATE.md
also records, and not a fault of this dispatch. My role file's rule for a brief
carrying no pack is that the document is read whole, so I read
docs/CONVENTIONS.md and all eleven chapters its index names, end to end, and say
so here. The brief's duties section named no executor-derived specifics, so
phase 1 was not broken above the line. Phase 1 held no tools at all; every
figure below is mine, measured on this bench or in a throwaway worktree.

#### The suites, at `3814f0de`

| leg | verdict | bodies |
|---|---|---|
| parser | GREEN | 454 |
| app | GREEN | 1171 |
| rust | GREEN | 661 over 18 targets |
| e2e | GREEN | 1210, 21.0m |

The app leg was RED at 14 bodies on its first run and that was MY bench's
fault, not the diff's: every one of the 14 said `no build output at
app/dist/assets — run npm run build in app/ first`, which is the fresh-worktree
order docs/conventions/lanes.md publishes. After `npm run build` in app/ the leg
is GREEN at 1171. The rust count is read across all 18 `test result:` lines and
not off the last header; the e2e leg printed no `failed` line at all.

**THE THREE push-guard BODIES THE SEAT WARNED ME ABOUT DID NOT RED HERE.** The
bench is detached and carries no fence, and all 123 push-guard bodies passed.
That CONFIRMS the seat's measurement rather than contradicting it.

#### A row per acceptance criterion

| criterion | verdict | the reading that decided it |
|---|---|---|
| 1 — the built entry present before the walk, and the same suites and specs the integration checkout answers | MET | A worktree cut fresh at the tip with nothing installed and nothing built derives all four suites, `e2e.whole: true`, fail-closed. Prepared with ONLY this job's own two steps and nothing else, it derives `app, e2e, parser`, `e2e.whole: false`, 12 specs, no fail-closed — and the enumeration is IDENTICAL, spec for spec and in order, to the sealed ground's M1 taken at the base in the integration checkout before any of this diff was read. |
| 2 — still fail closed on a genuinely unresolved input, and name it | MET | On a FULLY PREPARED tree — an input this repair does not resolve — one planted bogus specifier gives all four suites, `e2e.whole: true`, at exit **0** (fail closed, not fail stop), and the sentence names BOTH the importing file and the specifier. The enumeration behind "the whole battery" is derived, not typed: planting a spec file moved `inputs.specFiles` 42 to 43 and the fallback grew with it. |
| 3 — record, for this card's own push and the next records-only push, the time to push and the time to CI completion, with the specs each selection ran | NOT MET, AND NOT MEETABLE HERE — owed at the merge | Its `WHEN` fires when the card LANDS, so at the tip I grade the trigger has not fired. The lane invented no figures, which is right and is what I pre-committed to accept. But it also left the two clocks and the category undefined, and the sealed ground's M10 establishes the tree defines no "records-only push" at all. Correction 2 below. |

#### The attack set, answered

Written blind, before the work existed. Naming what did NOT land is half the
value of having written it down first.

- **A1 stub, A3 stale artifact, A4 committed dist — none land.** The entry is
  produced by the package's own build, unconditionally: no `if:`, not gated on a
  cache hit. `cache: npm` caches npm's DOWNLOAD cache keyed on the parser's
  lockfile, never `dist`, and `npm ci` verifies integrity from that lockfile.
  `lib/parser/dist` is still gitignored and appears nowhere in the diff.
- **A5 exemption, A6 dist-to-src string surgery, A9 self-generated golden — none
  land.** The derivation is untouched: neither `tools/e2e/scripts/ci-owed.mjs`
  nor the blessed gate-runner appears in the diff. Nothing was exempted, and the
  fail-closed path is the same code it always was.
- **A11 a second unprepared derivation site — does not land.** `.github/workflows/`
  holds one file and exactly one `run:` line invoking the derivation, in this
  job. Every other mention is comment prose or an `echo`.
- **A12 "the same steps" quietly weakened — does not land, and the deviation is
  REAL and ARGUED.** The checks job runs three steps; this job runs two, omitting
  `tools/e2e`'s own `npm ci`. I checked the claim rather than the comment: the
  four scripts in the closure import only `node:` builtins and one another, and
  my fresh-worktree derivation ran correctly to the right answer with
  `tools/e2e/node_modules` ABSENT throughout. The omission is correct.
- **A14 the range differs on a fresh runner — does not land.** `fetch-depth: 0`
  is unchanged on this job's checkout.
- **B1 vacuous, B2 a category word, B4 a redefined battery, B5 fail-stop — none
  land**, each measured rather than read; see criterion 2's row.
- **C2 inherited figures, C5 a figure off a run that ran nothing — do not land.**
  No figure is claimed at all.
- **A10 a body that pins text rather than behaviour — LANDS, and is correction 1.**
- **A7 and my pre-commitment P2 — the equality is satisfied by both sides
  agreeing, and they agree on an under-selection. This is the finding below.**
- **A8 and B3 — partially.** The lane's fresh side is a symlink mirror of THIS
  checkout with the untracked reached files withheld, so its "prepared" arm
  compares a mirror of the local tree against the local tree, and its
  criterion-2 arm withholds precisely the input this repair resolves. The
  sealed ground's M13 had already established the honest arrangement is cheap
  here. So I ran the honest one myself — a genuinely fresh worktree, installed
  and built — and the harder criterion-2 input as well; both pass, which is why
  these cost the lane a note rather than a correction. The simulation is sound
  for what it asks: the walk asks only whether a path is a file and what its
  bytes are.

**MY OWN PROPOSED CONTROLS, AND THE DEMONSTRATIONS I OWED ON THEM.** A control I
propose is mine to run where the deciding arrangement is ABSENT. Removing the
two preparation steps from `ci.yml` — the arrangement exactly as it stood at the
base — reds BOTH new workflow-parity bodies BY NAME, naming the job, the missing
command, its directory and 16 generated files. So the lane's keeper is not
degenerate and my pre-commitment P3 resolves in its favour. Under the same
mutant the two `gate-run.spec.ts` bodies stay GREEN, which is the correct
construction and not a defect: the property "this job prepares" lives in DATA
and is graded by a data mutant in the workflow, while "preparation changes the
answer" lives in the derivation and is graded there. Neither kill set contains
the other.

#### Correction 1 — a preparation the job can skip is not a preparation

`owedPreparationProblems` asked only whether the command was THERE. A step's
condition is a fact about the job like its command, and this very spec's
disk-guard and free-disk keepers already read one — the free-disk keeper refuses
a conditional step outright. This new keeper did not.

Measured on this bench at the lane tip: `if: false` on the `parser build` step of
the `owed` job — ONE word, the step still present, still before the question,
still spelled exactly right — left all 117 bodies of the two fenced specs GREEN,
while the job it describes walks an unbuilt tree and falls back to all four
suites and all 42 specs. That is this card's own finding restored without
touching anything the keeper reads.

The body is committed on this bench after this verdict. RED against an
implementation lacking the property: with `if: false` planted, the keeper body
reds by name printing `A PREPARATION THE JOB CAN SKIP IS NOT A PREPARATION`.
GREEN against one carrying it: 36 bodies pass over the untouched workflow, and
117 over both fenced specs, with `npm run typecheck` at exit 0 and the token
lint clean. `ci.yml` was restored after every drill and the restoration proved by
sha256 against `HEAD` both times.

The fixture body's name said `four` and would have run five arms, so it is
renamed to `five` and names the new one. That name is pinned nowhere else in the
tree and is not in the committed census.

#### Correction 2 — criterion 3's two clocks and its category, a wording change

THIS CORRECTION PINS NO PROPERTY AND OWES NO MUTANT BLOCK, and I say so in as
many words so the shortfall between two corrections and one block is explained
rather than read as a body nobody wrote.

Criterion 3 cannot be satisfied at the tip I grade and the lane was right to
invent nothing. What it can carry now, and does not, is the definition the
figures will be taken against — without which the two numbers are unfalsifiable
whenever they do arrive:

- **The two clocks, each with its start and stop event named.** "Time to push"
  and "time to CI completion" both have several readings; the CI figure should be
  wall-clock to the LAST required check, never the fastest job and never a sum.
- **What a "records-only push" IS.** The sealed ground's M10 establishes this
  tree defines no such category: no `paths-ignore`, no `paths:` filter anywhere.
  The phrase is prose. Whatever definition is used has to be stated on the card,
  because nothing in the tree will supply it.
- **The specs each selection ran, ENUMERATED and not counted.** Two different
  twelve-spec sets satisfy a count, and which is the whole parity claim.

Every figure carries its run id and its ref.

#### A finding this fence cannot repair — reported, and a card is owed

**AFTER THIS CARD, A PUSH THAT CHANGES ONLY `lib/parser/src/**` RUNS NO
END-TO-END SPEC AT ALL — INCLUDING THE TWO THAT IMPORT WHAT THOSE SOURCES
BUILD.** Measured through the real CLI on a real range whose only changed path
was `lib/parser/src/pure.ts`: the owed set is `app, parser`, `e2e.whole: false`,
**zero** specs. `brief.spec.ts` and `cli.spec.ts` are not selected, and they are
exactly the two files that statically import `lib/parser/dist/pure.js`, which is
compiled from that source.

The mechanism: the import edge lands on the BUILT entry, and that file is
gitignored, so it can never appear among a pushed range's changed paths. The
edge can therefore never contribute a selection — its only effect on the
derivation was the fail-closed this card removes. `packageDependents` carries
`parser -> app` and no edge to the end-to-end package, whose manifest still
declares it imports neither.

**THIS IS NOT THE LANE'S DEFECT AND THE LANE COULD NOT HAVE FIXED IT.** The
behaviour is pre-existing in the derivation, which is out of this fence, and
criterion 1's own second branch — resolving the generated entry through its
build relationship — is precisely what would close it. The lane took the first
branch, said so in its notes, and satisfied the criterion as written: it answers
what the integration checkout answers, and the integration checkout
under-selects identically. That is my attack A7's shape arriving honestly rather
than as a cheat.

**WHAT CHANGES IS WHEN IT BITES.** Until now every push fell back to the whole
battery, so CI ran both specs regardless and the hole was masked. Narrowing is
this card's whole point and is right; this is the one coupling the narrowing
exposes, and it is the coupling the card itself studied. It is bounded: the
parser and app suites still run on such a push, and the whole battery runs
nightly on main with a bisection recipe printed. I did not reject on it, because
rejecting would demand work this lane's fence forbids, and I do not file it from
here — the seat files cards at the merge, as it is already doing for the
push-guard fixture. It should be filed with this attribution.

#### The in-fence follow-through, graded

Accepted. The rename fixture chose its victim as the earliest named step
carrying a `working-directory` and then assumed that name was unique — which
held by luck until this card's own step made `parser install` the first such
step and one of six sites. I verified the cause rather than the account:
`name: parser install` is written 5 times at the base and 6 at the tip. The
entry is in the manifest, adds no criterion, and its 18 added and 2 removed
lines sit exactly on the "about twenty" line, which the lane disclosed rather
than trimmed. It is a precondition this card broke, so repairing it is part of
the primary change rather than scope taken beside it.

#### Security sweep

Clean. `permissions: contents: read` is untouched; the trigger set is unchanged
and carries no `pull_request_target`. Both new steps are literal strings with no
`${{ }}` interpolation — the two ids still reach the process through `env:` — so
no expression is spliced into script text. No action was added; `cache: npm` is
a parameter to an already SHA-pinned setup-node. No dependency was added, and
nothing new shells out. The cache holds npm's download cache only and `npm ci`
verifies integrity against the lockfile, so a restored cache cannot substitute
package contents undetected.

#### What the merge owes

`npm run capabilities`. I confirmed the lane's disclosure: `capabilities:check`
reads STALE, committed 115383 bytes against a fresh generation of 115969 — the
586 the notes name. My correction's renamed fixture body falls inside that same
single regeneration. Criterion 3's two figures and correction 2's definitions
are the landing seat's, and this verdict is not a licence to skip them.

#### The mutant block

ONE BLOCK FOR TWO CORRECTIONS, AND THE SHORTFALL IS CORRECTION 2, which is a
wording change and owes none. The correction body itself is the committed spec
change on this bench, and the property it pins lives in DATA — the workflow —
so the block plants a DATA mutant there rather than in the spec. The verb's
apply step will therefore find the tree already carrying `old` and do nothing;
the drill is the real work.

```mutant
correction: a preparation the job can skip is not a preparation — the keeper reads the step condition
file: .github/workflows/ci.yml
spec: tools/e2e/tests/workflow-parity.spec.ts
body: the planning job prepares the tree its own derivation walks, so the fallback is never the runner's build order
message: A PREPARATION THE JOB CAN SKIP IS NOT A PREPARATION
--- old
      # rather than quietly restoring the whole battery here.
      - name: parser install
        working-directory: lib/parser
        run: npm ci
      - name: disk after the parser install
        run: |
          df -Pk / | awk 'NR==2 { print "free on /: " $4 " KiB" }'
      - name: parser build
        working-directory: lib/parser
        run: npm run build
--- new
      # rather than quietly restoring the whole battery here.
      - name: parser install
        working-directory: lib/parser
        run: npm ci
      - name: disk after the parser install
        run: |
          df -Pk / | awk 'NR==2 { print "free on /: " $4 " KiB" }'
      - name: parser build
        working-directory: lib/parser
        if: false
        run: npm run build
```
