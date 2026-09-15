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
