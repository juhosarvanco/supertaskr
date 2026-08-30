---
id: T-160-s4
title: T-059's fence cannot reach a file its own criteria order it to write, which is T-127-s1's shape sitting on the board right now
feature: F-04
milestone: 4
priority: 1
size: S
status: done
blocked_by: []
touches: [docs/tasks/T-059-the-two-joins-cannot-quietly-disagree.md]
suggested_by: verifier claude-opus-5@subagent @T-160
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by: nputer-4e@integration-seat
review:
---

**PROMOTED at the first standing triage, 2026-08-30, at the TOP of its column — this is the only live defect on the board that a dispatch would pay for.**

Re-derived at this ref, from both cwds, before promoting:
`node tools/e2e/scripts/brief.mjs --task T-059 --preflight` exits 1 with
`UNCOVERED CRITERION PATH ... line 74: app/test/architecture-dogfood.test.ts is named in the acceptance criteria, exists at HEAD, and is reserved by the app-map slug — which this card's touches do not carry.`
T-059's fence is `touches: [crate-index, app-shell]`; its criterion at line 74 orders an assertion to LIVE BESIDE `app/test/architecture-dogfood.test.ts`, which `app-map` reserves. TASK-FORMAT is unambiguous about what that makes T-059: *a card whose criterion and whose fence disagree is a DEFECTIVE CARD, not a hard call for the lane.*

**Why priority 1.** The preflight was run over all 48 cards at
planned/building/verifying/merging and T-059 is the ONLY hit — and T-059
is startable right now (its blocker T-033 is done, and the parser rules
it disjoint from every live lane). The protection today is procedural,
not mechanical: `brief.mjs:289` gates the fence write on preflight
findings only when `--preflight` is passed in the same invocation, so
`--write-fence` alone still arms a clean manifest over this card.

**THE FENCE ON THIS CARD IS NARROWED BY HAND, AND THAT IS THE FINDING
APPLIED TO ITSELF.** As filed, this card carried `touches: [tools/e2e]`
while its own criterion ordered an edit to T-059's card — the very shape
it was filing against. It escaped its own preflight only because
`docs/tasks/` is under no component slug and because a suggested card is
refused a preflight at all. A bare `docs/tasks` fence is refused BY THE
PARSER (`UNFENCEABLE_PATHS`, `lib/parser/test/fence.test.ts`), so the
fence is narrowed to the single card file this work may touch, on the
T-108 precedent.

**THE REPAIR IS ONE OF TWO AND THE LANE CHOOSES IN WRITING**, per
TASK-FORMAT: widen T-059's `touches:` to carry `app-map`, or rewrite the
criterion as a ROUTE (*IF this path is outside the fence THEN record it,
route it as a suggestion naming the fence it needs, and say so*).
Acceptance is the command, not a count: `brief.mjs --task T-059
--preflight` SHALL exit 0, and no other card's preflight SHALL change.

## The instance, found by the tool under verification

`T-160`'s preflight was run over every card the board's schedule draws
(173 of 322 at `2771ae9`). Of the statuses a dispatch can actually pick
from — planned, building, verifying, merging — the ownership arm fires
exactly ONCE, and the hit is real:

    node tools/e2e/scripts/brief.mjs --task T-059 --preflight

`T-059` carries `touches: [crate-index, app-shell]`. Its acceptance
criteria carry:

- ONE assertion SHALL live BESIDE the TypeScript fixture in the app
  lane (`app/test/architecture-dogfood.test.ts`, where the
  expectations already live and already get reconciled)

That file is reserved by the `app-map` slug, which `T-059`'s fence does
not carry. The criterion is a WRITE instruction, not a citation — it
orders an assertion into that file — so the card as it stands would be
dispatched with a fence that refuses the write its own criteria demand.

This is the shape `T-127-s1` paid for: that lane stopped honestly and
the stop cost roughly 164k tokens. `method/tasks/TASK-FORMAT.md` already
rules on it in as many words — *"A card whose criterion and whose fence
disagree is a DEFECTIVE CARD, not a hard call for the lane"* — and puts
the repair on the seat that writes the criterion, not on the lane.

## What to do

Widen `T-059`'s `touches:` to carry `app-map` before it is dispatched,
or rewrite that criterion as a ROUTE in the form TASK-FORMAT prescribes.
Either repair is one line on the card. Re-run the preflight afterwards
and require exit 0 — the same command above is the check.

## Why this is a card and not a verdict line

The defect is on `T-059`, not on `T-160`. A verdict on `T-160` cannot
repair another card, and a finding recorded only in a verdict is a
finding the board never sees. `T-160`'s own dispatch had the same shape
caught by hand (its filed fence missed `docs/CONVENTIONS.md`), and that
repair is written into its Verdicts section — this is the same class,
caught mechanically instead.

## Acceptance criteria

- `node tools/e2e/scripts/brief.mjs --task T-059 --preflight` SHALL
  exit 0, with no UNCOVERED CRITERION PATH finding, by a change to
  `T-059`'s own card and to nothing else.

## Corroboration (2026-08-30, standing triage sitting #2) — a THIRD shape of the same class, from `T-163-s1`

Appended rather than filed beside, per `method/tasks/TASK-FORMAT.md`:
a second instance belongs attached to the card that owns the class.
**This one differs in the way that matters and the difference is the
reason it is recorded here.** This card's instance is a fence that
misses a file the card's OWN CRITERIA name — visible to the preflight,
and refused by it. `T-163`'s instance is a fence that misses a file NO
criterion names: `touches: [docs/architecture, app/test]` is the natural
spelling for a card whose subject is a component file, the fence domain
is the DIRECTORY `docs/architecture/`, and the governing document
`docs/ARCHITECTURE.md` is a FILE beside it differing by case and a
suffix. Asked of the lane hook rather than assumed, at that lane's ref:

    docs/ARCHITECTURE.md                               -> block (outside-the-fence)
    docs/architecture/components/C-11-design-tokens.md -> allow (inside-the-fence)

So the card parses, the preflight passes, the manifest is written, and
the lane discovers the exclusion only when a suite in a third package
reds — because the obligation is created by that suite, not by any
criterion a card author reads. **A preflight cannot catch this one**,
which is why it is worth attaching to the card that owns the shape the
preflight DOES catch.

The narrow repair that instance asked for is discharged (the slug block
was corrected at the T-163 flip-set landing). Two dispositions survive
it, and neither is this card's fence to take — they are recorded so
whoever picks this class up starts from them:

- **Structural** — make the architecture doc's slug block DERIVED rather
  than transcribed, so a `touch_slugs:` change cannot leave it stale.
  `docs/CAPABILITIES.md` is the precedent already in this repo:
  generated, with a currency check; the existing block-versus-field
  comparison becomes that check.
- **Vocabulary** — teach the fence that the architecture directory and
  the architecture document are one blast radius, or refuse the
  ambiguous token when the manifest is written. Largest, and the one
  most likely to be a cure worse than the disease — recorded because
  leaving it unnamed means the next card re-derives the choice.

Nothing above changes this card's own acceptance criterion, which stays
exactly the one line it was promoted with.

## Implementation notes

**THE FENCE WAS THE WRONG SIDE, AND IT WAS DERIVED FROM `T-059`'S OWN
INTENT RATHER THAN CHOSEN.** `method/tasks/TASK-FORMAT.md` offers two
repairs and this card's body left the choice to the lane in writing;
here they are not interchangeable, and four things on `T-059` point the
same way. Its title is *one pin across both engines* and the line-74
assertion IS that pin — the Rust refusals are only the other half. Its
`Verification:` line already owes `npx vitest run` from app/, which
nothing else on the card would owe. The criterion immediately after it
exists for no purpose except to price that assertion (a built binary on
PATH, a loud skip when it is missing, and whether the fixture count
becomes four). And `T-014-s2`, which the card ABSORBS in its first line,
IS that assertion — so the ROUTE repair would have discharged an
absorbed suggestion back into a suggestion, undoing a triage decision
from the outside. The criterion is the card; the fence was the omission.

The ownership was asked of the registry rather than taken from the
preflight's message: `app/test/architecture-dogfood.test.ts` is listed
by name in `docs/architecture/components/C-12-map-pane.md`'s own
`paths:`, whose `touch_slugs:` is `[app-map]` — routed out of C-05's
test umbrella at T-149, and that file's own comment names T-137 failing
on this same fixture. `app-shell` was KEPT rather than traded for
`app-map`: the assertion spawns a child process, and
`app/test/node-builtins.d.ts` — the shim the app's second tsc PROGRAM
needs for a `node:` import, the app shipping no `@types/node` — is
`app-shell`'s, not the map pane's. So the repair is one added slug and
nothing removed.

**THE PROOF, BOTH RUNS UNPIPED.** `node scripts/brief.mjs --task T-059
--preflight` from tools/e2e/, in this lane:

    before, at 9ed2b7fa430d  -> exit 1, FOUND 2: UNCOVERED CRITERION
                                PATH at line 74, plus a live-lane
                                fence-disjointness finding
    after,  at 6904dacf2180  -> exit 1, FOUND 1: the live-lane finding
                                ALONE; the UNCOVERED CRITERION PATH is
                                gone and the preflight's own five claim
                                classes are clean

**AND THE COUNTERFACTUAL IS REALIZED RATHER THAN ARGUED**, because the
residue is a machine-scoped fact and this lane cannot remove it. The
same command was run against a DETACHED clone of this lane whose
worktree list holds no task branch (`git clone --local`, then
`git checkout --detach`), so the lane list the assembler joins is empty
while the tree is byte-identical:

    --root <detached clone> at 9ed2b7fa430d  -> exit 1, the UNCOVERED
                                                CRITERION PATH alone
    --root <detached clone> at 6904dacf2180  -> exit 0, no findings

**THE ACCEPTANCE CRITERION IS THEREFORE MET AT THE TREE AND UNMET AT
THE MACHINE, AND THIS IS RECORDED RATHER THAN RULED.** The single
surviving finding is `fences are not disjoint: T-167-s2 crate-index
against T-059 crate-index` — correct, and about a sibling lane this
sitting dispatched in parallel with this one (docs/STATE.md's "Next up"
names the pair). It is not a claim `T-059` makes: it is present with
`--preflight` absent too (`brief.mjs --task T-059` alone, exit 1, same
one finding), so no change to any card can clear it. `T-059` carries no
`PREFLIGHT RULING` for it BY CHOICE — a ruling would discharge a real
future collision to make this lane's own gate green, which is the
suppression the preflight's ruling arm warns about in its own printout.
**Re-run the command once `T-167-s2`'s worktree is gone; exit 0 is what
it will answer, and that is the counterfactual above.**

**THE CARD'S OTHER CLAUSE — *no other card's preflight SHALL change* —
WAS MEASURED, NOT ASSUMED.** Every card at a status a dispatch can pick
from was swept at both refs inside the same detached lane-free clone,
and the two runs compared after normalising the ref stamp:

    for each card with status planned|building|verifying|merging:
      node scripts/brief.mjs --task <id> --preflight --root <clone>
    77 cards swept per ref; diff of the normalised pair -> ONE hunk

The one hunk is `T-059`: `exit=1` plus its UNCOVERED CRITERION PATH line
becomes `exit=0`. The other 76 are byte-identical.

**GATES AND SUITES, every exit read from `$?` on an unpiped command.**
The diff is one path under `docs/` that code suites read, so the DOCS
GATE fires; it was asked rather than predicted, in its one spelling from
the repository root, and it named three suites:

    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only $MAIN $TREE)
                                                     -> exit 1, FIRES
    npm run lint:docs      from tools/e2e/            -> exit 0
    npm run build          from lib/parser/           -> exit 0
    npx vitest run         from lib/parser/           -> exit 0  (15 files, 315 tests)
    npm run build          from app/                  -> exit 0
    npm test               from app/                  -> exit 0  (47 files, 1015 tests)
    npm test               from tools/e2e/            -> exit 0  (320 passed, 3.3m)

GRAPH REGEN, BOOT GATE and the METHOD EVAL GATE are NOT owed: the diff
holds no `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside docs/, nothing under
`app/**` or either manifest, and nothing under `method/**` — derived
from `git diff --name-only`, not from the brief. The e2e lane was run on
`NPUTER_E2E_PORT=15164`, DERIVED from this lane id rather than defaulted
(lane-protocol rule four's machine-scoped surface: two sibling lanes are
live and 14520 is the default both would take), `lsof`-read to zero rows
immediately before binding. 1420 was only ever READ, never probed, and
it is held by the human's app. `git status` is empty after the run, so
token-scan restored all seven plant targets.

**ONE FINDING ROUTED, AS A CORROBORATION AND NOT A SIBLING FILE.**
`method/tasks/TASK-FORMAT.md`'s search-before-filing clause sends a
second instance to the card that owns its class, and `T-143-s1` owns
this one exactly: *bodies that assert exit 0 from a brief the live lane
list can correctly refuse*. The new instance is the same mechanism with
a different consumer — an ACCEPTANCE CRITERION rather than a spec body,
namely this card's own — and the exit code is where the card-claim
verdict and the live-schedule verdict are welded together. Appended to
`T-143-s1` with the measurement above and a disposition hint; that
card's own preflight is exit 0 before and after the append, its only
change being `ref stamps: 0 -> 1` on a stamp that resolves.

**STATUS, SAID PLAINLY BECAUSE THE TABLE AND THE TREE DISAGREE.** The
ceremony row for size S with a diff outside shipped code gives this card
no verifier, so the table's stamp is `done` and the executor would be
its own integrator. Stamped `verifying` instead: one acceptance clause
is unmet for a cause outside every card, and the dispatching seat
retained the merge, so `done` would claim both a discharge this lane did
not earn and an integration it did not perform. No merge, no push, no
branch but this one.
