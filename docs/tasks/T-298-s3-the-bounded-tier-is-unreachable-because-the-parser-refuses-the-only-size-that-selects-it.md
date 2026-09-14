---
id: T-298-s3
title: "The bounded tier is UNREACHABLE: the classifier selects it on size XS and the parser refuses XS as an invalid field, so no live card can carry the size that would ever reach the cheapest tier — measured by a card that tried"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: verifying
suggested_by: "executor claude-opus-5@subagent @T-298, measured at 885153d11a92a913382e0da2032982c21b6e0e0f, 2026-09-11"
blocked_by: []
touches: [lib/parser/src/types.ts, lib/parser/test/task.test.ts, method/tasks/TASK-FORMAT.md, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/session-economics.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

ADR-024 decision 1 gives this project three tiers and the cheapest of
them is bounded. `method/tasks/TASK-FORMAT.md`'s tier table selects it on
size XS, and the arm's classifier reads that same size — a branch on `XS`
is the only route to a `bounded` verdict, and every other size falls
through to standard or guarded.

The parser will not let a card carry that size. `lib/parser/src/types.ts`
declares the legal set as S, M and L, and a card declaring anything else
is an `invalid-field` issue in the model. Three suites read the live
board and require it to parse with ZERO issues — the parser's own smoke
body, the app's architecture dogfood, and the shell frame's parse-error
count in the end-to-end lane.

So the tier a project would reach for on its smallest changes is
selectable only by a card the tree refuses to hold.

**HOW IT WAS MEASURED, and it was not by reading either file.** A
suggested card filed from the T-298 lane declared `size: XS` because the
tier table names that size. The battery answered: parser 388 of 389 with
`field 'size' must be one of S | M | L, got "XS"`, app 1170 of 1171 on
the same issue reaching the dogfood layer, and the end-to-end lane four
bodies down where the frame's parse-error list is counted, 60 expected
against 61 received. One illegal word in one frontmatter field, three red
legs, and the only thing wrong with the card was that it used the tier
table's own vocabulary.

The repair is a ruling rather than a patch: either the size set gains XS
and the three suites go with it, or the tier table stops selecting on a
size the model cannot hold and names its own condition. Whichever way it
goes, the two documents must stop disagreeing — today a project following
the method's tier table writes a card its own parser rejects.

## Acceptance criteria

- WHEN a card declares the size the tier table names for the bounded tier
  THE parser SHALL accept it as a legal field, or the tier table SHALL
  stop naming a size the parser refuses.
- WHEN the arm classifies a card that meets every bounded condition THE
  verdict SHALL be reachable end to end, from a card that lives in the
  tree, with a body proving it.
- WHEN the live board is parsed after the change THE three suites that
  require zero issues SHALL be green.

## Amendment of 2026-09-13 — the bounded size vocabulary (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — the bounded size vocabulary. The selected repair is to add XS to the parser's legal sizes and the task format's size vocabulary, preserving S, M and L. The arm's existing bounded conditions and guarded overrides are unchanged; XS is necessary under that selector and is not sufficient by itself. The fence additionally grants tools/e2e/tests/brief.spec.ts. A body takes a tracked fixture card through parsing and the arm's classification and reaches bounded only when every current bounded condition holds; controls retain the guarded-path result and the existing refusal or standard result when the keeper conditions are unmet. Existing invalid-size refusals remain, and the live-board checks already required by this card still run. The owner chose the XS route on 2026-09-13, as the review recommended.

## Widening of 2026-09-14 — the seat's, both halves (the lane's second ask)

The XS ceremony row goes FIRST, because the ceremony table is written lightest-first and a tool in this tree (lightestTier in tools/e2e/scripts/session-economics.mjs) reads it as such; that reds one body of tools/e2e/tests/session-economics.spec.ts, which had the size S typed into it as the lightest tier. The fence gains that spec so the lane replaces the typed value with the invariant this card creates — the lightest ceremony row and the size the tier table admits bounded on are one size — while the body's mutant arm stays as it is. The consequence the lane measured — the seat-verdict size signal reads S as TRY instead of KNOW once XS is the lightest row, 487 of 701 sized cards at 9d7a1582 — is a change in what the advisory recommends, not ruled by the amendment, and is filed by the lane as its own card rather than decided here; tools/e2e/scripts/session-economics.mjs stays outside this fence.

## Implementation notes
<!-- executor appends before finishing -->

### 2026-09-14 — executor claude-opus-5@subagent

**WHAT MOVED.** `lib/parser/src/types.ts` declares
`TASK_SIZES = ['XS', 'S', 'M', 'L']`, and
`method/tasks/TASK-FORMAT.md`'s frontmatter block declares
`# XS | S | M | L`. Those are the two ends MF-05 compares, and the eval
is the reason both had to move in one commit: with only the parser
moved it reported "the task sizes disagree: method/tasks/TASK-FORMAT.md
has [XS] the parser does not" (run under the drill below). S, M and L
are unchanged and every other value is still an `invalid-field` issue
naming the whole set.

**AND THE CEREMONY TABLE GAINED AN XS ROW, WHICH THE AMENDMENT DID NOT
NAME.** The arm's row 11 reads the ceremony ROW and refuses to reason
from the letter: `deriveDeliverable` in
`tools/e2e/scripts/dispatch-brief.mjs` pushes the finding "the ceremony
table has no row for size XS" when nothing matches, and
`tools/e2e/scripts/brief.mjs` turns any finding into `EXIT.FOUND`. So
the vocabulary alone would have moved the outage one step down the
dispatch rather than closed it. Parked as the lane's first ask; the seat
ruled it IN SCOPE on 2026-09-14 under criterion 2's "reachable end to
end". The row restates the tier table's own bounded line and nothing
more, and the S, M and L rows are byte-identical.

**THE ROW GOES FIRST, AND THAT COST ONE BODY OUTSIDE THE ORIGINAL
FENCE.** The ceremony table is written lightest-first and
`lightestTier` in `tools/e2e/scripts/session-economics.mjs` reads it as
such, so XS second would have been a false table. The first row moving
red `tools/e2e/tests/session-economics.spec.ts`'s
"the lightest ceremony tier is read off the table's first row" body,
which had `S` typed into it. Parked as the lane's second ask; the seat
widened the fence on both halves — main's card at commit 3b8d8a44, and
this lane's `.supertaskr/lane-fence.json` regenerated from it by the
arm's own writer — and the `touches:` line and the widening section
above are that commit's, applied here so the two halves agree at the
merge.

**ONE PLACE I DID NOT FOLLOW THE ANSWER'S LETTER, AND WHY.** The seat
said that body's mutant arm stays exactly as it is. As written it
renamed the 2026 first row and asserted `XS` — which is the answer the
UNMUTATED document now gives, so the arm would have been a control that
could not fail, and a known-vacuous keeper is a stop-the-line defect by
docs/NORTH_STAR.md's own bar. The arm keeps its claim and its shape and
now renames whichever row is FIRST, derived from `ceremonyRows` rather
than typed, so it cannot go vacuous the next time the table gains a row.
The typed `S` became the invariant this card creates: the lightest
ceremony row and the size the tier table admits `bounded` on are one
size, both read from the document and neither from `lightestTier`.

**In-fence follow-through**

- `lib/parser/test/task.test.ts`'s `VALID` fixture carried the old
  vocabulary in its own `size:` comment; it and the one `.replace()`
  that anchors on that line moved together.

**Figures, each at the ref it was measured at.** The owed set for
39515fad..HEAD is app, e2e, parser and rust with the e2e leg WHOLE,
because `method/tasks/TASK-FORMAT.md` lies under no package root and no
spec reaches it — gate-run says so in the token. It was run twice, and
the first run is kept here because the red it found is the whole reason
the fence widened. At 9d7a1582: parser 416 of 416 GREEN, app 1171 of
1171 GREEN, rust 655 of 655 over 18 targets GREEN, e2e RED at 1082 of
1083 on the typed lightest tier. At the graded tip 2ccf7cde, after the
repair: parser 416 GREEN, app 1171 GREEN, rust 655 over 18 targets
GREEN, e2e 1083 GREEN — four legs, no red. Parser was 413 at the base,
derived from the mutant run below in which the three added bodies were
exactly the three that fell. The eleven model-free method evals are
green at this tip and their positive-control self-test passes.

**What this change does to the seat advisory, which nobody ruled.**
`seatVerdict` scores the size signal as `size === lightest`, so with XS
the lightest row every S card now scores TRY where it scored KNOW: 487
of 701 sized cards at 9d7a1582 (S 487, M 192, L 22). The block is
advisory and a tie already went to the stronger seat, so nothing breaks
— but the majority of this board carries one more TRY on a signal whose
meaning did not change. `tools/e2e/scripts/session-economics.mjs` stayed
outside the fence by the seat's ruling, so it is filed as T-298-s8 with
both readings of what the signal means, rather than decided here.

**Suggested cards filed.** T-298-s6 (the runtime template's `ceremony:`
block is a second copy with no reader and no checker — grepped, not
assumed), T-298-s7 (the size vocabulary is spelled twice more, in
`docs/reference/02-cards.md` and the board's SizeBadge comment, and
MF-05 pins only one of the four spellings), T-298-s8 (the advisory
shift above).

**What the merge owes and this lane does not.** `npm run capabilities`
— the census is stale by 345 bytes at 2ccf7cde (committed 100241, a fresh generation 100586) because three bodies were
added to two specs, and docs/CONVENTIONS.md puts that regeneration in
the merge commit. The graph regen fires too (`.ts` outside docs/). The
BOOT GATE does not fire: nothing under `app/src-tauri/**`, `app/src/**`
or either manifest is touched. The DOCS GATE fires on the four filed
cards and answers app, e2e and parser, which the owed set already
covers. A method-text change means the merge bumps the method version;
the bump and the release note are the merge's.

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 1 — the bounded tier is unreachable: the classifier selects on a size the parser refuses, so the cheapest tier of ADR-024 decision 1 can never run. Not dispatched by this sitting.

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Tier GUARDED, the two-spawn bench, base 39515fad002fb274b4beae223f2eb7eaafbad205, tip
900e6626f3ca6c54655f3bad009064275ee699cd. Four legs GREEN at the tip I was sent, every
acceptance criterion met. ONE correction is assigned below — a shortfall inside a card this lane
filed — and a second was proposed, graded and withdrawn by the containment rule. Neither is a
defect in what ships.

#### The frame I actually had

Two spawns, and the blindness was real rather than kept. Phase 1 wrote the attack set with no
tools and no diff, from the card at the base; it asked for eighteen measurements (M1 to M18)
precisely because it could take none, and its section 5 reads as a request rather than a
finding. I am the second spawn: I hold tools, I read the diff, and I cannot return to that
frame. I read the diff and the spec bodies BEFORE the executor's notes, the report and the
lane's asks, in that order.

One disclosure the role file requires rather than permits. My PHASE-2 brief named two outcomes
of the lane's asks before I opened the diff — that the XS ceremony row was ruled in scope and
that the fence was widened for the session-economics spec. That is seat-derived rather than
executor-derived, and it reached me after the seal, so phase 1's blindness is intact and the
attack set proves it: attack A1.5 and measurement M15 both ask whether the fence moved and by
whose authority, which is not a question a spawn that had been told the answer would write. It
did give phase 2 a step it would otherwise have taken from the diff, and I say so rather than
present my reading of the ceremony row as unprompted.

#### The sealed inputs, by digest

- attack set — sha256:6129b7fbdd5556474a31f992789b1375bc2c08d639d1ff25d91a4d5ed5f6253e
- ground, with the seat's M1 to M18 addendum — sha256:44a3126d2c57d6332fdc5ce82b40dd502446680350ff966ecd850c9105bab44d
- the card at 39515fad — sha256:0bc8a6355d85ac12d2abecd3a067af80095727f501a81f2f465cc189eaebb6d2

All three re-hashed on this bench and all three match the stamp file.

#### Every acceptance criterion, with the evidence that decided it

| criterion | verdict | the command, body or reading that decided it |
|---|---|---|
| C1 — a card declaring the size the tier table names for bounded parses as a legal field | MET | `lib/parser/src/types.ts` declares `TASK_SIZES = ['XS','S','M','L']` and the exported type is derived from that array, so there is ONE site and not two — the type-without-runtime split attack has no seam to live in. Three bodies in `lib/parser/test/task.test.ts` read the vocabulary out of `method/tasks/TASK-FORMAT.md` instead of spelling it. Parser leg 416 of 416 GREEN at 900e6626 (413 at the base per M1: the three added bodies are the whole difference). |
| C1, second half — S, M and L survive and every other value is still refused | MET | The second added body loops every value the METHOD declares and requires zero issues for each, then requires EXACTLY ONE `invalid-field`-or-`missing-field` issue for `XXL`, `xs`, `Small` and an empty size. A parser widened to `string`, or one that downgraded the issue to a warning, reds on the second half. |
| C1, the diagnostic | MET | The refusal message at `lib/parser/src/task.ts:220` is the declared set joined with a pipe separator, derived from `TASK_SIZES` itself, so it cannot enumerate a stale set; the third added body asserts every declared value appears in the message and that the rejected value is quoted. |
| C2 — the bounded verdict is reachable end to end from a card that lives in the tree, with a body proving it | MET | The new body in `tools/e2e/tests/brief.spec.ts` derives the bounded size from the tier table's own row, DERIVES a fixture from the live board rather than typing one (the live card with the smallest wholly-tracked guard-free fence), moves exactly one field, parses it through the BUILT browser entry the arm imports, requires zero issues AND `task.size` equal to that size, then classifies the parser's own frontmatter through `classifyTier` and reads `bounded`. I re-ran it on this bench: 1 passed (1.4s). |
| C2, "not sufficient by itself" | MET | The body removes the guarded override, the tracked-fence condition and the keeper condition one at a time from the SAME card and lands on `guarded`, `standard`, `standard`, and throws `TierFinding` on the unanswered keeper. It does NOT move the size, which is the first condition the tier table names; the pre-existing classifier body pins that, which is why the arm I wrote for it was withdrawn below. |
| C3 — the three zero-issue suites are green | MET | gate-run's own token at 900e6626, `dirty:false`: parser exit 0 bodies 416 GREEN; app exit 0 bodies 1171 GREEN; e2e exit 0 bodies 1083 GREEN. Rust exit 0 bodies 655 over 18 targets GREEN. No count fell against the base (413 / 1171 / M3's scoped 184). |
| C3, green-by-subtraction | RULED OUT | The diff adds no `.skip`, `.only`, `.todo`, `xit` or `fixme`; its eleven deleted lines are the status stamp, the `touches:` line, four vocabulary spellings and the two session-economics assertions that were replaced. Nothing was deleted that was asserting. |
| C3, green-by-moving-the-expectation | RULED OUT | M4 placed the parse-error count in `tools/e2e/tests/shell-frame.spec.ts`, a literal 60 on both sides, and `tools/e2e/tests/brief.spec.ts` asserts no such count at all. The diff does not touch shell-frame.spec.ts, so the 60-against-61 the card records was repaired at the cause and not at the expectation. |

#### The amendment's own clauses, each checked

- *"add XS to the parser's legal sizes and the task format's size vocabulary, preserving S, M and L"* — done at both ends and nowhere else; the disjunct that would have deleted the tier table's bounded row is not taken.
- *"The arm's existing bounded conditions and guarded overrides are unchanged"* — BYTE-unchanged. `tools/e2e/scripts/dispatch-brief.mjs` is not in the diff at all. I verified the classifier's text at the tip against its digest before and after my own drills.
- *"XS is necessary under that selector and is not sufficient by itself"* — necessary is pinned by the pre-existing classifier body, which drill D2 below kills and the new bodies survive; not-sufficient is pinned by the new body's four removed conditions.
- *"a tracked fixture card"* — stronger than asked. No fixture card was added; the body derives one from the live board and moves one field in memory, so nothing entered the board, nothing had to be gitignore-checked, and the census, the roadmap and the graph did not move. The card-lives-in-the-tree clause and the zero-issues clause do not collide at all.
- *"Existing invalid-size refusals remain"* — the second added body is exactly that assertion, and drill D3 below shows it reds when the refusal is taken away.

#### What the attack set predicted, and what the measurement did to it

Most of it died on contact with a diff that had already thought about it, and I record the
deaths because an attack set whose every line lands is a set written after the fact.

- **A1.1, A1.2, A1.3, A1.4, A1.7 — dead.** One declaration site, the model's `size` asserted equal to the declared value rather than merely issue-free, and a message derived from the set.
- **A1.5 — dead.** The tier table's bounded row is byte-identical to M8's reading; the ceremony table gained a row and lost none, and the S, M and L rows are unchanged.
- **A1.6 — dead by M10 and it stayed dead.** Nothing orders or compares sizes. The one order-dependent reading is a DOCUMENT order, `lightestTier` reading the ceremony table's first row, and it is the live consequence discussed below.
- **A2.1 — dead.** No spread re-introduces a hand-built value: the object handed to the classifier carries the size read off the same card text the parser was given, and the body asserts the two readers agree before classifying.
- **A2.2 — LANDED on the body and NOT on the suite.** This was the set's "single most important control", the new body does not carry it, and the body three screens above it does. I tried to close the gap anyway and withdrew the attempt — see the withdrawn proposal below.
- **A2.3 — dead.** The guarded control trips a DERIVED override — `guardClassCandidates()[0]` against the tree's own guard map — and not a declared `tier:` field, which is exactly the arming the attack asked for.
- **A2.4 — dead, and it was the lane's best find rather than mine.** The second new body closes the one downstream site that would still have refused: row 11's `deriveDeliverable` reads the ceremony ROW, a size with no row is a finding, and `brief.mjs` turns any finding into a non-zero exit. I checked the other downstream enumerations M9 named and none of them refuses an XS card: the frozen `TIERS` triple, `health-bands.mjs`'s per-tier budgets, `merge.mjs`'s XS bound, and the app's own Rust `ceremony_row`, which scans the same table by the same rule and now finds the new row.
- **A2.4's settings layer, which phase 1 could not see and I checked.** `classifyTier` is gated by a `verify.tier` switch that can turn the whole ladder off. This project runs `profile: standard` with an empty departures block, and `method/runtime/process-schema.yaml` resolves `verify.tier` to `by-the-classifier` under that profile. So bounded is reachable in this project's own configuration and not only in the library — measured, not assumed.
- **A2.5, A2.6 — dissolved.** See the tracked-fixture clause above.
- **A2.7 — dead.** Each body builds its own input from a fresh read.
- **A3.x — dead**, as the criterion rows record.
- **A4.2 — the set's own open question, and the lane closed it better than the set expected.** The attack set said it would not fail the lane for the absence of an agreement-keeper. One exists twice over: MF-05 compares the two ends mechanically at the merge, and — the stronger half — the added parser bodies read the method document's vocabulary at run time, so the agreement is pinned inside the battery rather than only in a merge-time eval.
- **A4.4, the fence — clean.** Every path in the diff is granted: four by the card, the fifth by the seat's dated widening, which I compared against main's card at 3b8d8a44 and found byte-identical prose. Filed cards are the role's own step 6. Nothing touched the classifier, the dogfood test, a built artefact, a CI workflow, the census or the index.

#### The drills I ran myself, each restore proved by digest

- **D1 — a DATA mutant the lane did not drill.** Removed XS from `method/tasks/TASK-FORMAT.md`'s `size:` comment ALONE, leaving the parser's array and the tier table intact. Parser leg 1 failed of 416: *"the vocabulary the tier table selects on is not in the vocabulary it declares: expected [ 'S', 'M', 'L' ] to include 'XS'"*. This is the finding's own shape — two documents disagreeing about one word — and the battery now catches it in 1.4 seconds. Restored; digest of the document identical before and after.
- **D2 — the containment question A2.2 raises.** Neutered the classifier's size branch so no size can send a card to standard. The PRE-EXISTING body *"the classifier answers from the card and the tree..."* red at line 6357 (`size: "S"` expected standard, received bounded); BOTH new bodies passed. So the property is pinned in the suite, by a body three screens above the new one, and the two kill sets contain each other in neither direction — D1 and the vocabulary mutant kill the new bodies and not the old, D2 kills the old and not the new. Under the role file's containment test both are load-bearing and the count of one is not a defect. Restored; digest identical.
- **D3 — the refusal itself, because a vocabulary that stopped refusing would satisfy C1's letter.** Replaced the membership test in `lib/parser/src/task.ts` with `false`, so every size is legal. TWO of the three added bodies red, by name and with the message they were written to print: *"size \"XXL\" is not one of the method's values and was accepted anyway: expected +0 to be 1"*, and the message body's `expected undefined to be defined`. So the widen-to-`string` attack and the downgrade-the-issue attack both die on bodies the lane wrote, measured here rather than taken from the notes. Restored; digest of the source identical before and after, 9e6cf7d3….

**And I am declining my own pre-commitment, in as many words.** The attack set pre-committed to REFUSING on A2.2 — *"a proving body with no negative control on the size field is a refusal, because without it nothing in the diff shows XS is load-bearing"*. The stated reason is what I measured and it is false: something in the TREE shows it, D2 names the body and the line, and the role file's 2b rules containment over counting. A pre-commitment exists to make me state a reason for relaxing it rather than relax it quietly, and that is the reason. What survives is a gap in one body rather than in the suite — and when I tried to assign even that as a correction, the containment rule took it back, which is recorded below rather than quietly dropped.

#### Security sweep, mandatory and not empty here

The one input-validation shape in this diff is a validated closed set gaining exactly one
literal. It is still a closed set, the runtime membership check is unchanged, and D1 and the
refusal body both show it still refuses. No dependency is added, no manifest and no workflow
file is touched, no endpoint, query or credential path appears, no secret or key is in the
diff, and no fixture with a synthetic git identity was created. The added lines carry no home
path and no absolute path, and the pre-rename identifier is not spelled anywhere in them. The
four card files added or edited carry no `<-` in prose.

#### Two things I measured that belong to somebody else, named so they are not attributed here

- **The card preflight is exit 1 at this tip**, on one CENSUS finding at the card's line 71: the word FIRST in the widening section, read as an unattested ordinal. That paragraph is the SEAT's, byte-identical to main's copy at 3b8d8a44, and the same finding stands in the sealed ground taken before this diff existed. It is not this lane's to repair and the merge does not create it.
- **The whole end-to-end lane took 17.6 minutes** for 1083 bodies at 900e6626, against a `suite/e2e-seconds` band whose drift line is 234s and whose breach line is 312s, measured at 279 bodies. The band is three and a half times outgrown by the suite it watches and this lane added two bodies to it; the breach is the suite's growth, not this diff. My reading is additionally CONTENDED — a second lane's end-to-end run, T-295-s9's, was live on this machine throughout — so it is an upper bound and not a clean figure.

#### Assigned corrections

ONE assigned correction, and NO MUTANT BLOCK — said here in as many words, because a verdict
that assigns corrections and carries no block is the shape `merge.mjs`'s drill step STOPS on,
and the seat reading this should know why before it meets the refusal. The one correction is a
WORDING correction, which step 5b says owes no block. A second was proposed, written, graded
both ways and then WITHDRAWN by the containment test; it stands below with its reasoning intact
and is deliberately NOT headed as a correction, because it is not one.

##### A proposal I wrote, graded, and then WITHDREW — the end-to-end chain and the first condition the tier table names

The tier table's bounded row names five conditions and the first of them is the size. The new
body removes the other four one at a time from the same card and reads the alternative answer
each time; it never moves the size. A classifier that stopped reading size altogether leaves
that body GREEN — I ran exactly that and it did — so the chain this card exists to create is
pinned everywhere except at the word the card is about.

The body WAS to be committed on this bench after this verdict — that is what this paragraph
said when it was written, and it is kept as the record of what was proposed rather than
rewritten. It is NOT committed; the withdrawal below is why. What it did: take the sizes from
the parser's own vocabulary rather than typing a letter, move one field on the same fixture,
and pin the answer to one of the two real alternatives rather than to "not bounded", which a
classifier returning nothing would also satisfy.

Both readings, run on this bench: GREEN against the tip's own classifier — 1 passed (1.4s),
and `npm run typecheck` from tools/e2e clean. RED against a classifier whose size branch is
neutered — *"the same card at size S reached bounded too, so the size the tier table selects on
is not what bought the cheapest tier"*, expected pattern `/^(standard|guarded)$/`, received
`"bounded"`.

**WITHDRAWN on 2026-09-14, by the same test I applied to the diff.** Step 2b says two bodies
are both load-bearing only when NEITHER kill set contains the other, and that where one contains
the other the contained body is a RESTATEMENT. I could not build a mutant that reds my arm and
not the pre-existing classifier body: every change that lets a non-bounded size reach `bounded`
on a DERIVED fixture also lets it reach `bounded` on a hand-built one, which is exactly what
drill D2 measured — one mutant, two dead bodies, mine not among the ones that died alone.

The merge verb says the same thing mechanically, and finding that is what settled it.
`gradeDrill` in `tools/e2e/scripts/merge.mjs` REFUSES a block whose mutant "REDS MORE THAN
ITSELF — a mutant that kills a set is not evidence about this one property", and the drill's
scope is the whole spec file the block names. So the block I had written could never have been
drilled at the merge, and the reason it could not is the reason the arm was not a correction.

**So the body is NOT committed and no block is carried.** `tools/e2e/tests/brief.spec.ts` is
byte-identical to the lane's own, digest 4e2a744… on this bench. What this section leaves behind
is the reasoning rather than twenty lines of test, which is the honest yield of the exercise:
the attack set's headline demand was answered by the tree before I arrived, and the second time
I tried to collect on it the method's own containment rule took it away. Asking of my own
suggestion what I ask of the diff is the rule that produced this paragraph, and it is the rule I
opened this verdict by citing against the lane.


##### Correction 1, the only one assigned — T-298-s7 names two of the five live copies, and THIS CORRECTION CARRIES NO MUTANT BLOCK because it pins no property

T-298-s7 is the right card and its criterion is the right criterion: *"WHEN the parser's
declared size set changes THE tree SHALL red on any in-repository copy of that vocabulary that
did not move with it"*. Its census is short. The seat's own M7 enumerated the spellings at the
base, and at this tip three live copies outside the two the card names still read the old set:

- `method/interview/decomposition.md:62` — *"Size honestly (S/M/L per TASK-FORMAT.md)"*. This is the worst of the three: it is METHOD TEXT, it is guard-class, and it is the line that tells an author how to size a card — so the interview still teaches the vocabulary that makes the cheapest tier unreachable, which is this card's own finding one document further out.
- `tools/e2e/scripts/merge.mjs:2204` — *"The board's parser knows S, M and L today"*, in the header of the live XS bound. The sentence is now false about the tree it runs in.
- `tools/e2e/tests/merge.spec.ts:508` — the same sentence again, as the stated reason for a control loop over S, M and L.

The behaviour at all three sites is correct and nothing is broken; what is wrong is that a card
filed to close a class names two members of it, and a `touches:` naming two of five is a fence
the next executor cannot satisfy the criterion inside. The correction widens the card's finding
and its fence to name all five. It is prose about prose and there is no property to pin, so no
body and no block: the count above is two corrections against one block, deliberately.

#### What I am NOT failing this lane for, each with its reason

- **The executor departed from the seat's letter on the session-economics mutant arm.** The seat said the arm stays exactly as it is; as written it renamed the 2026 first row to XS and asserted XS, which after this diff is the answer the UNMUTATED document gives — a control that could no longer fail. The executor rederived it to rename whichever row is first. That is the role files' own rule about controls applied against an instruction, the departure is disclosed in the notes and the report rather than buried, and a seat's sentence does not outrank a known-vacuous keeper. Correct, and I would have assigned it as a correction had it not been done.
- **The ceremony table's XS row was not named by the amendment.** It was parked as an ask and ruled in scope by the seat under criterion 2, and it is the difference between a reachable tier and an outage moved one step down the dispatch. In fence, pinned by a body with a real control.
- **The advisory shift — 487 of 701 sized cards moving from KNOW to TRY on the size signal.** This is a live behaviour change of a shipped tool caused by a document edit, and it is the sharpest thing in the lane. It is also ruled: the seat kept `tools/e2e/scripts/session-economics.mjs` outside the fence, required the measurement in the notes, and required the card. All three were done, the figures carry their ref, and T-298-s8 states both readings of the signal rather than presuming one. Not the lane's to decide.
- **The census is stale by 345 bytes at this tip.** `docs/CONVENTIONS.md` puts that regeneration in the INTEGRATOR's commit at the merge, by name, and I confirmed the bullet rather than taking the notes' word for it.

#### Step 7 — the readings at MY OWN tip, d7c5ce8a1d1117b475d03c050790cea5409b8874

Every figure in the verdict above was measured at 900e6626, the commit I was sent. This verdict,
its one correction, its withdrawal and the card filed under step 6 created a tip nobody had
tested, so the whole battery and the two currency checks were run there. Each figure below names
the ref it was measured at, because a count in prose is a claim about a tree and no suite
compares the two.

**ONE READING WAS TAKEN AND THROWN AWAY, and it is named rather than quietly dropped.** A first
step-7 battery was started at 8a10f28d. While its end-to-end leg was still running I wrote to
the tree — restoring `tools/e2e/tests/brief.spec.ts` when I withdrew the correction — and
`docs/STATE.md` says exactly what that does: a commit or a write during the run UNKEYS the
token, and every write is to be held until it finishes. So that leg's answer is a reading of a
tree that changed under it, whatever it said, and the battery below is a fresh one taken with
the tree final and nothing left to commit but this postscript.

**The battery at d7c5ce8a1d1117b475d03c050790cea5409b8874, by gate-run's own token.** parser exit 0, 416 bodies, GREEN · app exit 0, 1171 bodies, GREEN · rust exit 0, 655 bodies over 18 targets, GREEN · e2e exit 0, 1083 bodies, GREEN. Identical body for body to the readings at 900e6626, which is the answer I wanted: the arm I wrote was withdrawn rather than committed, so no spec changed, and the three card files I did change move no count.

**C3's three suites by PATH rather than by leg total, because the card names them only by
description and a leg total would let three greens be the wrong three.** The seat's M11 placed
them, and each was run on its own with my verdict, the correction and the filed card already on
the board: `lib/parser/test/smoke.test.ts`, which calls `parseProject` on the repository root —
4 passed; `app/test/architecture-dogfood.test.ts`, whose line 1095 requires the live board's
issue list to be empty — 10 passed; and `tools/e2e/tests/shell-frame.spec.ts`, whose four bodies
drive the parse-error count — inside the green end-to-end leg above. So the three suites the card
meant are the three that are green, and they are green with four more cards on the board than the
base carried: the lane's T-298-s6, s7 and s8, one of which I corrected, plus my own T-298-s9.

**The currency checks, both STALE at this tip and both the INTEGRATOR's at the merge.**
`npm run capabilities:check` from tools/e2e exits 1 — committed 100241 bytes against a fresh
generation of 100586. That is the same 345 bytes at my tip as at the lane's, so my own writes
moved it by nothing: the census reads test NAMES out of the spec files, and the only body I
touched I put back. `cargo run -p supertaskr-index -- index --check --root ../..` from
app/src-tauri exits 1, naming two changed files and both of them the lane's —
`lib/parser/src/types.ts` and `lib/parser/test/task.test.ts` — with the budget at 1216090 of
2145959 bytes (56.7%). `docs/CONVENTIONS.md` names the owner of each regeneration in the same
words for both, and it is the integrator's commit at the merge rather than the lane's or mine.

**The gates my own PROSE could move, which is the half of step 7 that is easy to skip.**
`npm run typecheck` from tools/e2e exits 0. `npm run lint:docs` from tools/e2e exits 0 and says
*"every live task card's frontmatter parses, with a legal status"* — so this verdict, the
correction, the widened `touches:` line and the card I filed are clean as code inputs. Its one
WARN, `docs/CONVENTIONS.md` at 162655 bytes against a 146878-byte warn line, stands in the
sealed ground taken before this diff existed and is nobody's here. `node
tools/method-evals/run.mjs` exits 0 over 11 model-free evals, the run that carries MF-05 — the
keeper comparing the two ends of the size vocabulary this card moved.

**The card preflight finds exactly ONE thing, and it is the same one.**
`node tools/e2e/scripts/brief.mjs --task T-298-s3 --preflight` exits 1 on the CENSUS finding at
the card's line 71 — the seat's widening paragraph, byte-identical to main's at 3b8d8a44 and
present in the sealed ground. My prose added none, which is what I was checking for; the four
filed cards preflight with no finding either.

**And the token this run wrote is unkeyed by this very commit.** `docs/STATE.md` names it among
the three writes that red the tree with no cheap gate watching: a prose commit stales the push
token. The battery above was keyed to the tip this postscript then moved past, so the integrator
owes a fresh owed-set run at the merge rather than a push on my token. Said here because the
figures above are exactly the thing that would make somebody think otherwise.

#### A precision on one line in the verdict above

The verdict says the app's own Rust `ceremony_row` "now finds the new row". That was a reading
of the rule and not a measurement, so I closed it: the rule in
`app/src-tauri/src/dispatch/brief.rs` takes every line opening with a pipe that has exactly two
cells and matches the head exactly or as a comma-qualified prefix — the same rule the arm's
`ceremonyRows` uses — and applied to this document it answers the XS row for XS, the first S row
for S, the M and L rows for those, and nothing for XL. No earlier two-cell table in the file
shadows the ceremony table: its head row is the first one. So the second reader resolves the new
row correctly today.

What is NOT there is a Rust body naming XS: that suite pins S, M and an absent XL, so a
Rust-side regression on the new value would stay green while the arm's side reds. I am
deliberately not filing that — the Rust body that exists pins the RULE rather than the values,
XS is just another value under it, and a card for it would cost triage more than it buys. It is
recorded here instead, which is the right weight for it.

#### What "five copies" in the correction counts, and what it deliberately leaves out

Five FILES, six lines: `docs/reference/02-cards.md` twice, and
`app/src/components/board/badges/SizeBadge.tsx`, `method/interview/decomposition.md`,
`tools/e2e/scripts/merge.mjs` and `tools/e2e/tests/merge.spec.ts` once each. Two further hits
for the old spelling exist and are NOT counted, because they are RECORDS rather than live
vocabulary and this project does not rewrite records: `docs/design/design-handoff.md` and a
dated research capture of 2026-09-09. The executor filing T-298-s7 will grep and find them, so
they are named here rather than left to be rediscovered as an omission.

#### One consequence of the correction that the next dispatch needs to know

Widening T-298-s7's fence to the sites its criterion cannot be satisfied without makes that
card's fence OVERLAP a lane that is live right now: the arm's own ledger reports *"T-295-s9 and
T-298-s7: OVERLAP — T-295-s9 tools/e2e/scripts/merge.mjs against T-298-s7
tools/e2e/scripts/merge.mjs, the same entry"*. My own T-298-s9 is fenced on the same two files
and joins that overlap. All three are `status: suggested` with no worktree, so nothing is blocked
today and no live fence is violated; but neither can be dispatched until T-295-s9 lands. The
alternative was to name the stale sites in prose and leave them outside the fence, which is the
shape this project's preflight calls an UNCOVERED CRITERION PATH — a card that cannot be built as
written. I would rather hand the triage an ordering constraint than a card whose fence does not
reach its own criterion.

#### A dispatch fault in my own brief, named rather than absorbed

My phase-2 brief carried no CONTEXT PACK — the role file calls a brief with no pack a dispatch
fault and says the verifier then reads `docs/CONVENTIONS.md` whole and declares that it did. I
did not read it whole. I read it by the bullet, on demand, at each point a judgement needed one:
the CENSUS-CURRENCY and GRAPH REGEN bullets for who owes each regeneration, the guard-class map
and the fresh-clone build order as the arm's own preflight transcribed them, and the standing
read `docs/STATE.md` for the named intermittents — which named none that could explain anything I
measured, since every leg was green. That is the reading the pack would have given me, arrived at
the long way, and it is a narrower claim than the role file's remedy: I am reporting the frame I
had rather than the one the rule prescribes.

#### Two frontmatter fields I deliberately did NOT stamp

`verified_by:` is left EMPTY and `status:` is left at `verifying`. The merge verb fills the stamp
itself — `merge.mjs` replaces an empty `verified_by:` line, an anchor that matches an empty field
and nothing else — so a verifier who stamped it by hand would defeat the regex that is supposed
to fill it and the merge would quietly stamp nothing. The lane's own stamp commit says these
fields are the verifier's; the tool says they are the merge's, and the tool is the one that has
to find them.
