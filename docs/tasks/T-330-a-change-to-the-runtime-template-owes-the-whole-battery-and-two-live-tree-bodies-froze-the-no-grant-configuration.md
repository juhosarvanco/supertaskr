---
id: T-330
title: "A change to the runtime template owes the whole battery because the owed-set derivation cannot place it, and two live-tree bodies froze the no-grant configuration: map the template to its consumers with the fail-closed fallback kept, move the settings-combination bodies to fixtures, keep a focused check against the real configuration, and prove the narrowed selection catches a configuration defect before any check is dropped"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: verifying
suggested_by: "the architect seat on 2026-09-15, from the closing check of the dispatch grant's landing, on the Codex orchestrator's finding of the same day"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/brief.spec.ts, docs/conventions/gates-and-the-push.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

Recording the owner's approved dispatch grant in `method/runtime/supertaskr.yaml` (a records change of a few lines, approved on 2026-09-15) cost the whole battery at the closing check and would have cost it again on the runner, for causes the derivation and the run itself name.

The owed-set derivation fails closed on the runtime template: the path lies under no package root, no spec reaches it through a static import, and it is not a document the docs gate maps, so the fallback selects all four suites. That is the conservative answer for an unplaceable input, not a finding that nearly every body reads the template. The template's actual consumers are the parser library's settings reader, the arm that reads the dispatch block and the roles, and the bodies that drive them.

Two bodies read the LIVE template and assert the no-grant state as a property of this project: "this project's template carries no grant" in the CLI spec and "this project's own tree is the explicit no-grant state" in the brief spec. Their own comments say they move on the day a migration grant is approved; that day came, and the approved configuration now contradicts them, so an ordinary configuration change reds bodies that froze yesterday's configuration.

The coupling is wider than those two bodies, because the fixtures seed their scratch roots by copying the LIVE runtime template, so the real grant judged every fixture dispatch and refused each fixture card by name as one the grant does not list. RE-DERIVED at `eca49471` with the approved grant's prepared patch applied to the working tree, the end-to-end leg is 22 failed and 1188 passed over 1210 bodies — 21 in `brief.spec.ts` and one in `cli.spec.ts`. The closing check that first raised this reported 35 and nobody re-derived it; 22 is the figure that carries a ref, and the 35 stands as a reading taken elsewhere under conditions this card cannot restate. A fixture that inherits the project's configuration tests the project's configuration, not the behaviour it was written for.

## What would settle it

- The derivation places the runtime template with its actual consumers (the settings reader, the arm's grant and roles readers, the bodies that drive them), and the fail-closed whole-battery fallback stays for inputs that are genuinely unresolved.
- The behaviour of settings combinations, the no-grant state among them, is tested over controlled fixture templates, never over this project's live configuration; fixtures that copy the live template seed their own template instead (the roles and the switches they need, and the grant state each body is about); the no-grant coverage is kept in full on a fixture.
- A focused integration check reads the real template and validates the configured grant through the parser's reader (present, mode, recovery, revision, every card in the order carrying a blob that matches the card at the approval ref), so the approved configuration is checked rather than assumed.
- Before any check is dropped from the selection, a planted configuration defect (a wrong mode, a stale blob, a card missing from the map) is shown to be caught by the narrowed selection; the current checks stay intact until then.
- A records-only change (a card filed, a card re-triaged) exercises the parser, the board invariants and the consumers it actually affects, with a measured, short completion target recorded on this card when it lands.

## Acceptance criteria

- WHEN the owed-set derivation meets a change to the runtime template THE derivation SHALL place the template with its consumers (the settings reader, the arm's grant and roles readers, and the bodies that drive them) and SHALL keep the fail-closed whole-battery answer for an input it cannot place.
- WHEN a body tests a settings combination, the no-grant state among them, THE body SHALL read a controlled fixture template and never this project's live configuration, and a fixture that seeds a dispatch SHALL write its own template rather than copy the live one.
- WHEN the real template carries a grant THE focused integration check SHALL validate it through the parser's reader (present, mode, recovery, revision, every card of the order with a blob that matches the card at the approval ref, the admission's mechanical drift allowed) and SHALL refuse a planted defect by name (a wrong mode, a blob stale beyond mechanical drift, a card missing from the map).
- WHEN the repair is verified THE verification SHALL exercise the approved grant on the tree: fixture dispatches stay independent of it and the focused check validates it, and no requirement that an approved card stays byte-identical beyond the admission's mechanical drift is introduced.
- WHEN a narrowed selection is proposed THE card SHALL report the checks selected and the elapsed time before and after, for the grant change and for a card-only change, and SHALL drop no check before a planted configuration defect is shown caught by the narrowed selection.
- WHEN a records-only change is pushed after this card lands THE card SHALL record its measured completion time and SHALL promise nothing about administrative pushes in general.

## Implementation notes

The approved grant (revision 1, the owner's yes at 2026-09-15T07:22:18Z, validated through the parser's reader) is prepared as a commit and a patch in the evidence directory and lands with this card's merge, when the bodies and the fixtures have moved off the live template; until then the tree stays in the no-grant state and the express demonstration waits.

**Built on 2026-09-15 in the lane cut at `eca49471`, at tip `801da9a2`.**

THE DERIVATION NOW PLACES THE TEMPLATE. `tools/e2e/scripts/gate-run.mjs`
gained an arm for `method/runtime/`, composed the way the docs arm beside
it is: a reader map, each reader placed through the package roots, and the
end-to-end leg narrowed through the same `owningSpecs`. The map is derived
from the source corpus and not listed — a file that SPELLS the path, as
one literal or as the segments a `path.join` is given, or that names an
identifier a speller BINDS to it. That identifier half is load-bearing:
what the arm and the bodies open is the parser library's
`RUNTIME_TEMPLATE` constant rather than a path they spell, so a
literal-only scan finds the library and misses every body that drives it.
Measured at `43a330ff` by calling `settingsReaders` on this tree: TWELVE
readers — the parser's settings reader, its two barrels and its own test;
the kit, which embeds the file with `include_str!`; the arm; the settings
command; the token scan; and the FOUR specs that drive them, which are
`brief`, `cli`, `gate-run` and `run-record`. An earlier reading of this
line said eleven over three specs and undercounted `run-record.spec.ts`,
which reaches the template through the same `RUNTIME_TEMPLATE` identifier
every other body does. The whole-battery fallback is kept for
everything still unplaceable, and three bodies in `gate-run.spec.ts` hold
it there: a settings path nobody asked the scan about, one the scan finds
no reader for, and a reader lying under no package root.

THE SELECTION AND THE ELAPSED TIME, BEFORE AND AFTER, for a change to the
runtime template — which is exactly the shape of the approved grant:

- Before: the whole battery, fail-closed. Four suites, the end-to-end leg
  WHOLE at 42 spec files. Measured whole at this tip: 1215 bodies, 21.5
  minutes wall, 20.2 minutes of body time, one worker.
- After: four suites, DERIVED, with the leg narrowed to 22 of 42 spec
  files. Measured: 1125 bodies, 21.9 minutes wall, 19.6 minutes of body
  time — 3 failed, 1122 passed, and the three are the attributed ones
  named below.

**AND THE SAVING IS SMALL, WHICH THE CARD SHOULD SAY OUT LOUD RATHER THAN
BURY.** The narrowed selection is 97% of the leg's body time, because
`docs-input-gate.spec.ts` is 11.6 minutes of a 20.2-minute leg by itself
and it reaches the arm through the import graph, so it is in the narrowed
set. The suite set does not shrink either, and that is the honest answer
rather than a disappointment: the kit embeds the template at compile time,
the parser declares it, and the app depends on the parser through a `file:`
specifier, so all four legs really are owed. What this card buys is
therefore NOT speed. It is that the answer is DERIVED, with a per-path
reason that travels into the token, instead of a blanket fallback that says
only that the derivation could not place the input — and that the
fail-closed answer is now kept for inputs that are genuinely unresolved
rather than spent on this project's own configuration. A card that wants
the runtime template to cost less than twenty minutes is a card about
`docs-input-gate.spec.ts`, not about this derivation.

A RECORDS-ONLY CHANGE, for comparison, measured the same way: this card
re-triaged owes three suites with the leg at 12 of 42 spec files, 734
bodies, 6.4 minutes wall and the same in body time. This card does not
move that answer — the docs arm already derived it — and the completion
time of a records-only push belongs to the push that lands it.

NO CHECK WAS DROPPED, AND THE NARROWING IS SHOWN TO CATCH A CONFIGURATION
DEFECT. Nothing was removed from any selection: the narrowing is a
derivation, not a subtraction. A body in `gate-run.spec.ts` derives every
spec that reads this project's dispatch block and requires the narrowed
selection to carry all of them, so a narrowing that dropped the body which
validates the real configuration would red. The planted defects themselves
are in `cli.spec.ts`: a mode the schema does not declare, a card in the
order with no blob in the map, a blob this repository does not carry, and a
card rewritten past the admission's mechanical drift — each refused by
name, with a sound grant over a real card validating clean as the control.

THE FIXTURES SEED THEIR OWN CONFIGURATION. `ritualFixture` in
`brief.spec.ts` writes its own runtime template over the one the archive
carried, before the fixture's checkpoint commit. It names the roles the arm
itself dispatches, derived from `ROLE_TEMPLATE_KEYS`, at values that exist
nowhere else in this tree, the process section the arm needs, and no
dispatch block. Every restore-the-template step in the lane now restores
the fixture's own, and a body asserts the fixture's template is that text
and not this project's. Independence from a landed grant follows
mechanically: the arm reads the template at the root it is given, and no
fixture root carries this project's file any more. The body that compared
the arm's reader with the library's builds on a controlled base too, since
appending a block to a template that already carries one would be a body
about which block a parser takes.

THE TWO FROZEN BODIES ARE ANSWERED DIFFERENTLY, AS THEY DESERVE. The
arm-side body in `brief.spec.ts` moves onto a fixture and keeps its
coverage whole, control included. The parser-side body in `cli.spec.ts`
becomes the one focused integration check that reads the real template:
where a grant is present it validates every row and matches every approved
card against the tree through `cardDrift`, so a mechanical stamp is
allowed and a rewritten criterion is not; where there is none it reads out
the explicit no-grant state in as many words. The tree is still that
no-grant state, which is the point of the card.

THE REJECTION ARC, 2026-09-15: ONE UN-ROOTED DISPATCH WAS THE WHOLE OF
IT. The independent verifier met criteria 1, 2, 3 and 5 and rejected on 4,
for a cause this card had already named and the first pass had left
standing in one place. `stubPlan` in `brief.spec.ts` planned at the LIVE
root through `context({})`, and `dispatchLanePlan` resolves the lane-cut
admission against the dispatch block it finds at the root it is given — so
with the approved grant on the tree, the eleven-body step loop and the
four bodies beside it refused the lane-cut admission of T-133 as a card
the grant does not name. Fifteen bodies written about the ritual's step
sequencing were being judged by the board. Every other dispatch site in
that file already named a root; this one now does too, a fixture root
whose template carries no dispatch block, so the independence is the same
mechanical one the fixtures already had.

THE FIXTURE IS BUILT ONCE AND SHARED, AND THAT IS SAFE BY CONSTRUCTION
RATHER THAN BY CARE: every one of those bodies drives the ritual through
`ritualStub`, whose io answers each command, read and write out of its own
arrays and touches no disk, so no body can move the tree another body
reads. It is built lazily, so a run selecting none of them pays for none
of it, and removed in `afterAll` — what a shared fixture owes in place of
the `finally` a per-body fixture carries, and verified by finding no
fixture left in the temp directory after a whole leg. A fixture per body
was the alternative, measured at about 1.3 seconds each: fifteen
whole-tree copies to answer a question about a pure plan.

THE MEASUREMENT, TAKEN THE WAY THE VERDICT TOOK IT — a throwaway detached
worktree, the prepared patch (`sha256:1f3da850…`) applied to the working
tree and never committed, one worker:

- `43a330ff`, the rejected tip, grant applied: `brief.spec.ts` 15 failed,
  215 passed, exit 1 — the same fifteen the verdict names.
- `489d06d6`, this repair, grant applied: `brief.spec.ts` 230 passed, 0
  failed, exit 0. The body count is identical either way, so nothing was
  dropped to reach it.
- `489d06d6`, grant applied, THE WHOLE END-TO-END LEG: 1215 passed, exit
  0, against the baseline `Running 1215 tests using 1 worker` — and the
  summary carries no `N failed` line at all.
- `eca49471`, grant applied, the whole leg: 22 failed, 1188 passed, which
  is the finding's figure re-derived and is where the 22 above comes from.

The tree this card leaves behind is still the explicit no-grant state.
The grant lands with the merge, by the seat's hand and not this lane's.

THE THREE PROSE FIGURES THE VERDICT CORRECTED. The reader count above is
re-derived from `settingsReaders` at `43a330ff` and is twelve over four
specs; the earlier eleven-over-three undercounted `run-record.spec.ts`.
The finding's coupling figure now carries the ref and the conditions it
was measured at. The three lines that broke their files' own wrap — one of
118 characters in `gates-and-the-push.md`, two in these notes — are
rewrapped, changing no words. Criteria 1, 2, 3 and 5 were not reopened.

THE VERDICT'S F5 IS NOT THIS LANE'S AND A CARD IS OWED FOR IT. The
verifier recorded two properties of the pre-existing admission arm, both
outside this fence and neither asked for by any criterion: the grant check
reads `order` into the `cards` map but never the map back into the order,
so a card present in both widens authority invisibly; and the block binds
to no approval record, so a revision nobody approved validates against
itself. Phase 1 reached both independently and blind. The seat has it and
files it at the merge at priority 1; it is named here only so a reader of
this card finds it without going back to the verdict.

THREE RED BODIES IN THIS LANE ARE ATTRIBUTED AND ARE NOT THIS DIFF'S.
`push-guard.spec.ts`'s three `--take-seat` bodies fail in any FENCED lane
worktree with `EACCES` copying `docs/CONVENTIONS.md`: `seatFixture` copies
that file twice — the flat `docs/*.md` walk, then the derived
`conventionsFiles()` list whose opening entry is that same file — and
`copyFileSync` carries the source's mode, which the lane fence leaves at
444. Measured in isolation on this machine: a 444 source gives a 444
destination and the second copy is `EACCES`, while a 644 source copies
cleanly. They are green in the integration checkout and on the runner,
where the mode is 644, and the verifier bench carries no fence. T-333 is
already filed for this, fenced on that spec; the repair spelling reached
here independently is `rmSync(dest, { force: true })` before the copy,
which is mode-independent and keeps the derived list.

THE BEHAVIOUR CENSUS MOVES WITH THIS DIFF and its regeneration is the
merge's: `capabilities:check` reads STALE at this tip, 115997 bytes
committed against a 116892-byte generation — the repair pass moved that
second figure from 116595, which is the only thing about this note the
rejection arc changed. `docs/INDEX.md` is current and does not move.

## Verdicts

### 2026-09-15 — APPROVED — claude-opus-5@subagent

THE SECOND VERIFICATION OF THIS CARD, by a fresh spawn that is not a continuation of
phase 1 and not a continuation of the verifier that rejected it. The rejecting verdict
and its correction-1 body are preserved at the tag `T-330-verdict-rejected-2026-09-15`
and were not on my bench; I read them there, and I re-judged the criterion they rejected
on from my own measurements rather than from their account of it.

Range graded: base `eca49471923d3600bfc5cde89c67d1f757598410`, tip
`8c7165f6975918bd8077471e40aa8f74d195c718`. Tier guarded, so this is the role file
entire: the two-spawn bench, the seat's answers under the ground's addendum, and the
whole suites.

**THE SEALED INPUTS, CITED BY HASH AND RE-DERIVED AT MY OWN BENCH.**

| input | sha256 | matches the stamps file |
|---|---|---|
| the attack set | `0e66ed9e293f4e26eda1c477fbd6f24590c6b46fd107d6d52b370e1adcab6cd4` | yes |
| the ground | `4c7d02c5954aa41ae73615e4d8e5d07f7d87325bcbf0c1887e027656c7c1f4d0` | yes |
| the card at the base ref | `d274db1e512ae2e1314f2afce37612512ee7eeca858d41231abc2818611abd5f` | yes |

The attack set is the ORIGINAL and is unchanged from the first pass — written blind
against the card at its base, before any implementation existed, and the criteria have
not moved. I graded against it as written.

#### The frame I actually had, and it was not a clean one

**PHASE 1 DISCLOSED A CONTAMINATED FRAME AND I CARRY THE DISCLOSURE RATHER THAN
DESCRIBING A CLEAN ONE.** The harness that runs every subagent in this session injects a
git-status block carrying recent commit subjects. Phase 1 read five subjects newer than
its base, learning that a neighbouring lane's fence had been widened and that a lane was
live beside it; it reported that this shaped attack S2 and nothing else, and no executor
output for this card reached it. The seat records the same leak in the ground's addendum
and names its own cause. My own phase-2 spawn was given the diff and the notes together
with the instruction to read the diff first, and I did: the code diff, then the specs,
then the document, and the card's notes last. My brief named no executor-derived
mutant count, path count or suite figure, so phase 1 was not broken above the line by the
brief I was handed.

**I DID NOT GRADE THE LANE AS THOUGH IT INVENTED A DRIFT DEFINITION.** The ground's M10
says the admission's "mechanical drift" is defined nowhere but this card, and the ground's
own closing section says that reading is wrong. I checked it against the tree rather than
taking either: `cardDrift` and `MECHANICAL_SECTIONS` are present at the base ref in
`tools/e2e/scripts/dispatch-brief.mjs`, and `MECHANICAL_SECTIONS` carries `Verdicts`
beside `Implementation notes` and the repair-ledger heading. The lane delegates to them
and invents nothing. That also answers phase 1's A3.6 outright: a verdict appended to an
approved card — including this one — is mechanical drift by the arm's own definition, so
the focused check cannot red on the ceremony's own writes.

#### What I ran, and at which ref

**THE WHOLE BATTERY AT THE BENCH TIP `8c7165f6`**, which is what the guarded tier keeps —
`gate-run.mjs parser app rust e2e`, port 25330, one worker:

| suite | verdict | bodies | exit |
|---|---|---|---|
| parser | GREEN | 454 | 0 |
| app | GREEN | 1171 | 0 |
| rust | GREEN | 661 | 0 |
| e2e | GREEN | 1215 | 0 |

Gate exit 0. The end-to-end summary carries **no `N failed` line at all** and reads
`Running 1215 tests using 1 worker` against `1215 passed (21.1m)` — I read the failed
count and the header, not the last line. No suite ran over zero bodies.

**THE THREE `push-guard.spec.ts` BODIES THE SEAT ATTRIBUTES TO T-333 DID NOT APPEAR.**
The seat's measurement says they red in any FENCED lane worktree and that a detached
bench carries no fence, so I should not see them. I did not: 123 push-guard lines ran in
the leg above and all passed. That corroborates the seat's attribution rather than
contradicting it, and it is the reading that would have contradicted it if the cause were
the diff.

#### A row per acceptance criterion

| # | the criterion, in short | verdict | what decided it |
|---|---|---|---|
| 1 | the derivation places the runtime template with its consumers, and keeps the fail-closed whole-battery answer for an input it cannot place | **MET** | I called `settingsReaders` on the tree myself at `8c7165f6`: **12 readers over 4 specs**, DERIVED from the corpus and not listed — the parser's settings reader, its two barrels, its own unit test, the Rust kit that embeds the file, the arm, the settings command, the token scan, and `brief`/`cli`/`gate-run`/`run-record`. All four classes the criterion names are present, the parser's own unit suite among them (A1.6). Placement at the tip: template → four suites, leg narrowed to 22 of 42. Fail-closed still answers for a sibling nobody reads, an unplaceable top-level file, a mixed set, and a CASE-SHIFTED spelling of the template's own path — each naming the path it could not place (A1.2, A1.3, A1.5, A1.8). A sibling that IS read (`process-schema.yaml`) places at three suites and 18 of 42, so the arm generalises rather than matching one string. Drills 1 and 2 below. |
| 2 | settings-combination bodies read a controlled fixture, never this project's live configuration, and a fixture that seeds a dispatch writes its own template | **MET** | `ritualFixture` writes its own template over the archive's before the fixture's first commit, composed from the arm's own `ROLE_TEMPLATE_KEYS` rather than a list. Every restore-the-template step in the lane reseeds the fixture's own instead of copying the live one — seven such copies at the base ref, none at the tip. The brief-side frozen body moved onto a fixture and carries an explicit independence assertion; the reader-agreement body moved onto a controlled base. Drill 3 below shows the independence assertion CAN red. Residual coupling recorded as F2 — not a breach of this criterion's letter, since none of the remaining archive fixtures seeds a dispatch. |
| 3 | the focused check validates the real grant through the parser's reader and refuses a planted defect by name | **MET** | The check reads the real template and calls `parserPure.dispatchBlock` from the parser's BUILT entry — the same reader the arm calls, not a second parse (A3.2). It branches: under a grant every row is validated and every approved card matched through `cardDrift`; under none the explicit no-grant state is read out. It is NOT vacuous on a no-grant tree, because the drill body runs the same `grantFindings` function over controlled templates: an undeclared mode, an order naming a card the map does not carry, a pin to bytes this repository does not hold, and a card rewritten past mechanical drift — each refused naming the offending value or card id, with a sound grant over a real card validating clean as the control, and a stamped card allowed. It carries no literal revision, card list or count, so the owner approving revision 2 does not edit it (A2.9). And in my grant-applied throwaway the `WHEN` actually fired: all eight approved cards match their pinned blobs at this tip, and the check validated them clean. |
| 4 | the verification exercises the approved grant on the tree; fixture dispatches stay independent of it; no byte-identity requirement is introduced | **MET** | Measured below in full, twice, in throwaways I cut myself. |
| 5 | the card reports the checks selected and the elapsed time before and after, for the grant change and for a card-only change, and drops no check before a planted defect is caught by the narrowed selection | **MET** | I re-derived the figures rather than reading them: at `8c7165f6` the whole leg is **1215 bodies in 42 files**; the narrowed selection for a runtime-template change is **1125 bodies over 22 files**, so the narrowing drops exactly **90 bodies**. The card's 1125 reproduces. I then asked the question A5.3 asks — what does the drop expose — and checked all 20 excluded specs for any reference to `RUNTIME_TEMPLATE`, `dispatchBlock`, `grantState`, `method/runtime`, `processSection` or `loadProcess`: **zero hits across all twenty**. The drop exposes no configuration coverage at all. A card-only change gives three suites and 12 of 42 at the tip, identical to the ground's base reading, so the narrowing did not quietly move it. The card states out loud that the saving is not speed; that is honest and I grade it as met rather than as a shortfall. Sub-case note in F5. |
| 6 | a records-only change pushed after this card lands records its measured completion time, and the card promises nothing about administrative pushes in general | **NOT YET DUE — DEFERRED, and its second half MET** | The `WHEN` fires only after the card lands, so it is unreachable inside the lane; phase 1 pre-committed (P2, R2) that an APPROVED verdict must either cite a real records-only push measurement or mark 6 explicitly deferred with the mechanism that closes it. I mark it DEFERRED. The mechanism is named on the card — the completion time belongs to the push that lands it — and the half that IS testable now holds: I read the document diff for any generalising sentence about administrative pushes and there is none, in the card or in `docs/conventions/gates-and-the-push.md` (A6.3). **The seat owes the figure on this card at the push that lands the merge**; approving 6 on a promise is a thing phase 1 pre-committed against and I am not doing it. |

#### Criterion 4, the measurement that decides this pass, in full

I did not take the executor's word for it. The patch in the evidence directory is
`sha256:1f3da850a8148e4886337c431f170d477f8b2846fb6fbede07a6e19cf6c2fa62`, matching the
ground's M8, and `git apply --check` is exit 0 at this tip.

**I COMMITTED THE GRANT IN MY THROWAWAYS RATHER THAN LEAVING IT IN THE WORKING TREE, AND
THE DIFFERENCE IS LOAD-BEARING.** `ritualFixture` seeds by `git archive HEAD`, which
cannot see an uncommitted file. A working-tree-only application therefore never reaches
the fixtures' own seeding path — the one this card is about — and leaves the tree dirty
besides. Committing it in a disposable worktree is exactly the state the merge creates.
The bench itself was never given the grant and remains the explicit no-grant state.

**THE CLEAN READING.** A throwaway cut as a sibling of the bench at tip `8c7165f6` with
the grant committed on top, whole end-to-end leg, port 25330, one worker:

| reading | value |
|---|---|
| the header | `Running 1215 tests using 1 worker` |
| the summary | `1215 passed (21.1m)` |
| the `N failed` line | **absent entirely** |
| exit | 0 |

**THE APPROVED GRANT, APPLIED AS THE MERGE WILL APPLY IT, MOVES NO BODY.** The count is
read as well as the exit, and the header proves the exit is not a pass over zero bodies.
The card's own claim of exit 0 over 1215 reproduces — and it reproduces on the stronger
arrangement its own measurement could not reach, because a grant left uncommitted is
invisible to the archive the fixtures seed from.

**THE FIRST THROWAWAY, AND THE ONE RED IN IT, ATTRIBUTED BY NAME.** My first throwaway
sat under a long session-scratchpad path and reported `1 failed, 1214 passed` — the body
`shell-frame.spec.ts:263`, `the board keeps the standing region floor`, `Expected >= 250,
Received 234` at the 800x600 viewport. It is **not this diff's and not the grant's**, and
a 2x2 settles it rather than an opinion:

| worktree | grant | that body |
|---|---|---|
| long-path throwaway | committed | FAILS, 234 |
| long-path throwaway | absent (same tip as the bench) | FAILS, 234 — identically |
| bench, isolated and inside the whole battery | absent | PASSES |
| sibling throwaway | committed | PASSES |

The grant changes nothing about it; the worktree's location does. `app/src` and the built
assets are byte-identical between the two trees (same content-hashed bundle names), and
the body is pure viewport geometry over a synthetic error snapshot, so it reads no
repository data. I re-ran the suspect once and attributed it by name, per STATE.

**THE OTHER HALVES OF CRITERION 4.** Fixture independence is measured, not asserted:
drill 3 shows the independence assertion redding when the coupling is restored. And "no
requirement that an approved card stays byte-identical beyond mechanical drift is
introduced" — phase 1's A4.4 asked me to make that falsifiable rather than take it as
written. I did: the blob arm of `grantFindings` ends in `cardDrift`, not in an equality;
a card the ceremony merely stamped is asserted to pass and a rewritten criterion to fail;
and the document diff introduces no sentence obliging an approved card at all. Nothing in
the diff compares card bytes or a content hash without drift normalisation.

**AND THE PATCH IS DATA, NOT AUTHORISATION.** Phase 1's R1 refused to read a file in an
evidence directory as the owner's consent, and that refusal stands here. I verified that
the grant does not red the tree. I did not verify, and cannot from this seat, that its
contents are what the owner said yes to. That reading is the seat's and the owner's.

#### The drills

Each mutant's landing was read from `git diff`, never from the mutator's report, and each
kill set is named rather than counted.

| drill | where it lands | kind | kill set |
|---|---|---|---|
| 1 — the identifier arm is disabled in `settingsReadersIn` | `tools/e2e/scripts/gate-run.mjs` | code | `gate-run.spec.ts:2247` and `:2352` |
| 2 — an unread settings path is marked placed | `tools/e2e/scripts/gate-run.mjs` | code | `gate-run.spec.ts:2288` |
| 3 — `seedFixtureTemplate` copies the live template again | `tools/e2e/tests/brief.spec.ts` | **data** | `brief.spec.ts:7252` and `:9352` |

No kill set contains another, so all five bodies are load-bearing rather than
restatements, and each mutant died at the site the property it is about actually lives.
Drill 3 is a DATA mutant because the property — that the fixture's configuration is its
own — lives in the template text the fixture writes, and a code-only drill would
mis-grade it by construction.

**AND MY FIRST AIM AT DRILL 2 SURVIVED, WHICH I REPORT RATHER THAN QUIETLY RE-AIM.**
Making the empty-reader branch unreachable killed nothing — 85 passed — because the outer
`!placed` fallback still fails the path closed with a generic reason. The property was
never removed; only its wording was. That is the aiming failure the rubric names, it was
mine, and the re-aimed mutant above is what actually measured the property. It also tells
the reader something true about the arm: fail-closed here is protected twice, and what is
NOT pinned by any body is the settings-specific reason TEXT.

**THE CONTROL I PROPOSED IN PHASE 1 IS ONE I OWED A DEMONSTRATION FOR.** A2.3 proposed
planting a data mutant in the live template and requiring the fixture rituals to stay
green, and said a control that cannot red proves nothing. Both halves are now measured.
Forward: the grant committed on the tree, the whole leg green. Reverse: drill 3 restores
the coupling and the rituals red — on a tree carrying NO grant at all, which is a stronger
reverse than the one I asked for, because it does not need the arming to be present to
show the instrument working.

#### Findings

**F1 — THE CARD'S OWN PREFLIGHT REGRESSED FROM EXIT 0 TO EXIT 1, AND THE REPAIR PASS
INTRODUCED IT.** `brief.mjs --preflight --task T-330` exits **1** at the tip with one
finding: a CENSUS claim in the finding paragraph's re-derivation sentence — an unstamped
ordinal sitting beside a phrase that scopes it to this whole tree's history. The sentence
is shown in the correction below, fenced, because reproducing it in prose here would
carry the same defect into this verdict. The ground records the arm's own
preflight at the base as exit 0 over 0 findings, so this is a regression inside the range
I am grading, not an inherited condition. It reds no graded suite (the preflight specs run
over a fixture card, and the whole battery above is green), but it is the class that has
stopped a merge on this board before. **Corrected below.**

**F2 — THREE ARCHIVE-SEEDED FIXTURES STILL INHERIT THIS PROJECT'S LIVE TEMPLATE.**
`refShapes` and `nestedShapes` in `brief.spec.ts`, and `laneFixture` in
`session-economics.spec.ts`, each build their tree from `git archive HEAD` and never call
`seedFixtureTemplate`. None of them seeds a dispatch, so none breaches this criterion's
letter, and the clean grant-applied leg proves they are independent in fact today. But the
coupling CLASS this card exists to remove is closed by inspection rather than by a
mechanism, which is exactly how the defect that caused the first rejection survived a
pass. Phase 1's A2.6 asked for a repo-wide guard body and there is none. The first two are
inside this fence; the third is not. Not blocking. Partly answered by correction 2 below,
which pins the narrower property that actually bit.

**F3 — THE NEW CHECK REPRODUCES A ONE-DIRECTIONAL GRANT READING, AND I AM NOT REJECTING
ON IT.** `grantFindings` walks `order` into the `cards` map and never the map back into
the order, so a card present in both that the order does not name is invisible; and the
block binds to no approval record, so a revision nobody approved validates against itself.
Phase 1 reached both blind as A3.9 and A3.10 and the first verifier as its F5. They are
pre-existing properties of the admission arm, outside this fence, already recorded, and
the seat files them as their own card at the merge. I record only that the new body
inherits the same shape, so whoever closes that card should close it here too.

**F4 — AN OPTION-INJECTION SURFACE IN THE NEW CHECK, LOW SEVERITY.** `approvedText` calls
`git cat-file -p <sha>` with the sha taken from the template and no `--` terminator, so a
recorded value beginning with `-` would be read by git as an option. Its sibling
`currentBlob` already passes `--`. The input is this project's own committed
configuration, which is trusted to the same degree as code, so this is hardening and not a
vulnerability — but it is a one-token fix and the asymmetry with the line beside it is
what makes it worth naming. The rest of the security sweep is clean: no secrets, keys or
credentials in the diff; no dependency additions at all; no shell-string execution — every
child process is argv-form `execFileSync`; no home path, personal address or pre-rename
identifier anywhere in the diff; scratch roots come from `mkdtempSync`, not a predictable
name; and the one place stderr is swallowed is documented and scoped to a reader where a
miss is an answer.

**F5 — TWO REPORTING GAPS IN CRITERION 5's FIGURES, NEITHER CHANGING ITS VERDICT.** The
timing figures are anchored to "this tip" in a notes block whose opening line names tip
`801da9a2`; the tip has since moved to `8c7165f6`, so a later reader must resolve "this
tip" through that sentence rather than read it at the card's own head. The repair's own
measurements do carry explicit refs, which is the right shape. Second: the card reports the
card-only case as "this card re-triaged" and does not report the "a new card filed"
sub-case that A5.5 asks for separately. I measured it myself — three suites, 12 of 42,
identical to the re-triage answer — so the substance holds and only the reporting is short.

**F6 — A SHALLOW-CLONE NOTE, FOR WHOEVER READS THIS ON THE RUNNER.** `approvedText`
returns null when the recorded blob is absent, and the check turns that into a finding
rather than a skip, which is the right direction — a skip there would be phase 1's A3.1
arriving on CI. But on a depth-1 checkout a card that HAS drifted would red for a reason
that is not a configuration defect. It only bites when a card has drifted, since an
unmoved card short-circuits before fetching. Observation, not a finding against the lane.

**WHAT I CHECKED AND FOUND NOTHING ON.** The fence: the arm's preflight reports 0 criteria
naming paths the fence does not reserve and 0 entries reserving nothing, so no UNCOVERED
CRITERION PATH and no DEAD FENCE ENTRY (S1). The neighbouring lane's fence and this one
remain disjoint (S2). Every change in the diff maps to a criterion — I enumerated the
hunks and mapped each — so there is no undeclared surface and nothing that needed an
`In-fence follow-through` heading (S7). The reworded sentences in
`docs/conventions/gates-and-the-push.md` are pinned by no spec, so no spec-pinned sentence
was paraphrased. The census moves with this diff and its regeneration is the merge's, which
is outside this fence and not a finding against the lane.

#### Corrections I assign

**CORRECTION 1 — the card's census ordinal.** In the finding paragraph:

```text
before:  The closing check that first raised this reported 35 and nobody re-derived it
after:   The closing check that raised this reported 35 and nobody re-derived it
```

No word of the claim changes; the unstamped ordinal does, and with it the whole finding. **A CORRECTION WITH NO PROPERTY TO PIN
SAYS SO IN AS MANY WORDS, AND THIS IS ONE**: the property lives in the card's prose and is
already pinned by a mechanism in the tree — `card-figures.mjs`'s own CENSUS rule, which is
what found it — so no new body and no mutant block is owed for it. Both readings taken on
my bench: RED `brief.mjs --preflight --task T-330` exit **1** with the CENSUS finding
before, GREEN exit **0** with no findings after.

**CORRECTION 2 — a body pinning the property the first rejection turned on.** The repair
rooted `stubPlan` at a fixture, which fixes the instance. Nothing mechanical holds the
CLASS: a new call handing an unrooted context to `dispatchLanePlan` would pass every suite
until the day a grant is recorded, which is precisely how fifteen bodies came to be judged
by the board. I judge that the repair does NOT make such a body unnecessary — inspection
has now failed at this exact site once — so I commit my own rather than carrying the
previous verifier's forward. Mine derives the call sites from the file's own source,
resolves a named context to where it was built rather than refusing it, and requires at
least one site so the containment cannot go vacuous. Both readings taken on my bench: GREEN
against the tip as it stands, and RED against the same tree with one unrooted call planted.

```mutant
correction: the dispatch-root guard
file: tools/e2e/tests/brief.spec.ts
spec: tools/e2e/tests/brief.spec.ts
body: NO DISPATCH THIS SUITE PLANS IS JUDGED BY THIS PROJECT'S OWN CONFIGURATION — every planned dispatch names the root it plans at
message: a dispatch is planned at this checkout's own root
--- old
  return dispatchLanePlan(context({ root: fx.root }), {
    taskId: "T-133",
--- new
  return dispatchLanePlan(context({}), {
    taskId: "T-133",
```

The block is a ONE-FOR-ONE SWAP and adds no code, so its old text is not a substring of
its new and the verb can place it; the anchor matches its file exactly once; no field
carries a line number. It un-roots the very call the rejection turned on, which is the
site the property lives. Drilled on my bench: it reds the body above, naming the offending
site in the failure — `context({}` — and nothing else in that spec moves, because on a
tree with no grant an unrooted plan still admits.

#### The gates my own writes move

Steps 5 and 6 are writes and they create a tip nobody has tested. I re-ran them against the exact content these three commits produce, so the figures
below are the tip I created and not the commit I was sent:

| gate | before my writes | after |
|---|---|---|
| `brief.spec.ts`, whole | 230 bodies, all passing | **231 bodies, 231 passed (2.7m)** — my body is the 231st |
| `brief.mjs --preflight --task T-330` | **exit 1**, one CENSUS finding | **exit 0**, 0 census claims |
| `npm run lint:docs` | exit 0, one pre-existing budget warning on a file this diff does not touch | exit 0, unchanged |
| `npm run capabilities:check` | exit 1, STALE at 115997 committed against 116892 generated | exit 1, STALE at 115997 against **117023** |

**THE CENSUS IS STALE BEFORE AND AFTER, AND MY BODY MOVES IT FURTHER.** That is expected
and is not a finding against the lane: the generated census is outside this fence and its
regeneration belongs to the merge. What the seat needs from this row is the NEW number —
a regeneration at the merge must land 117023 bytes and not the 116892 the notes recorded,
because a body was added after they were written.

The whole battery quoted at the head of this verdict was measured at `8c7165f6`, the tip I
was sent. It has not been re-run at the tip these commits create; what has been re-run is
every gate those commits could move, which is the obligation.
