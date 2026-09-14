---
id: T-324
title: "The admission lifecycle: every admission the arm makes — the lane cut, a child start, a re-entry, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; the three approval modes and the two recovery values are enforced at those boundaries; a pause stops new work at the next safe boundary with its scope stated; a successor coordinator inherits the grant from the block"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 2
status: building
suggested_by: "the architect seat on 2026-09-14, splitting T-319 under the orchestrator's sizing rule after the Codex orchestrator's pre-dispatch review named the owning files"
blocked_by: [T-319]
touches: [method/roles/orchestrator.md, method/runtime/process-schema.yaml, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/run-record.spec.ts, docs/CONVENTIONS.md, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md, tools/e2e/tests/brief-flush.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

T-319's effective contract, once its owning files were named, carried two test cycles: the grant block and its reader belong to the parser library and its vitest suite; the admission at attempt boundaries, the modes, the recovery policy's enforcement and the pause belong to the dispatch arm, the run record and the orchestrator role file, graded by the end-to-end suite. The orchestrator role file's step 2 says a card is the smallest unit that carries its own test cycle and anything larger is split before dispatch; this card is the arm's half. Today the arm's `--dispatch-lane` cuts a lane without consulting any grant, `startRun` reserves a resource before a harness launch, `continueRun` reconciles a previous execution, and none of the three reads an approval, so a lane can be cut, a pause recorded, and a start or re-entry still follow; a pause exists only in chat and the seat's ledger; and a successor coordinator has nothing to inherit but a checkpoint's prose. The grant this card reads is T-319's block through the parser's reader; this card adds no reader and no second ownership ledger.

## The consolidation of 2026-09-14

Filed from the split of T-319 on 2026-09-14; corrected the same day after the Codex orchestrator's review of the drafts: explicit versus derived admissions (an automatic repair needs no owner-approved blob; it binds to its parent work, the failure evidence, the parent grant's revision and its own blob at filing), per-card consumption under each, the pause distinguishing new work from the admitted candidate's verification and integration, optional limits read and deferred by name, the schema's labels flipping to operational here, the interface with T-319's reader fixed before the parser lane starts.

## Acceptance criteria

- WHEN the arm admits work — at the lane cut (`--dispatch-lane`), at a child start (the run record's startRun), at a re-entry or continuation (continueRun) and at a replacement writer — THE admission SHALL be one of two kinds, both bound to T-311's attempt reservation and re-reading the grant at every boundary: an EXPLICIT admission of a card the grant names, bound to the grant's revision and the card's approved blob (a mechanical append allowed: a status stamp, a notes or verdicts append, a filed follow-up line); or a DERIVED admission of a repair the recovery policy allows, bound to its parent authorized work, the failure evidence, the parent grant's revision and the repair card's own blob at its filing, recorded on the repair card and in the run record, needing no owner round trip and inheriting the parent's authorization rather than minting a grant; a repair's description alone establishes nothing, and a scope change re-evaluates the derived admission; a retry of an interrupted admission SHALL neither consume an approval twice nor create a second writer; no second ownership ledger is added; pinned by bodies: a pause after the cut before the start refuses the start, a consumed approval presented again is refused as consumed, an uncertain old writer holds the admission until reconciled, the lane cut is distinguished from the writer reservation.
- WHEN approval is each THE arm SHALL consume the particular card's approval once at its admission and SHALL refuse every card without its own approval by name, the grant's list being per-card approvals and never a batch; WHEN approval is until THE arm SHALL admit the cards in the recorded order up to and including the until card, plus the repairs that card's delivery needs where the recovery policy allows them, SHALL refuse the next card in the order by name, and SHALL NOT cross a parked until card; WHEN approval is standing THE arm SHALL admit until a pause is recorded; pinned by a body per mode paired with each recovery value.
- WHEN recovery is none THE arm SHALL refuse a derived admission by name and record it as needing its own explicit approval — an explicitly approved repair is admitted; WHEN recovery is repairs THE arm SHALL admit a derived repair only for a failure attributed to the approved work, classified and verified as any card, never a product-scope change or a waived verification; pinned by one lifecycle fixture: an authorized initial card, its failure, a previously unlisted repair admitted by derivation, an out-of-scope repair refused, a repeated delivery event producing no duplicate repair, and the until endpoint's completion refusing the next feature.
- WHEN a pause is recorded THE arm SHALL distinguish new implementation and re-entry work from the verification and integration of a candidate already admitted: under scope new-work every new implementation attempt and re-entry is refused while the verification and integration of the admitted candidate are PERMITTED to start and finish (a verifier start for an existing candidate is admitted); under scope all every further phase stops at its declared safe boundary (a running executor at its stamp, a running verifier at its verdict, a staged merge finished or aborted as the record says); an immediate stop is a separate request routed through the applicable stopping mechanism and not this admission reader, and its interruption preserves uncertainty until the jobs are reconciled; an owner-issued pause needs no second approval to be read; pinned by bodies: an executor candidate followed by a new-work pause and a permitted verifier start, a refused replacement executor under the same pause, and an all-pause refusal of that verifier.
- WHEN the grant carries optional limits THE arm SHALL read them and SHALL NOT enforce them in this card: their presence is reported by name as advisory and unenforced, their absence imposes no token or time ceiling, and enforcement is deferred to a later card so no control silently does nothing; pinned by a body over a grant with limits present.
- WHEN a successor coordinator takes the seat (T-238) THE successor SHALL inherit the current grant from the block and continue the order without the previous coordinator's identity, pinned by a body over a fixture runtime directory.
- WHEN this card lands THE dispatch block's switches SHALL become operational in the process schema (their read sites named there), the arm SHALL read the grant through the parser's reader and through nothing else, the arm's report SHALL separate the refusals it tested from the coordinator's obligations it cannot check (scope interpretation, an unreported integrity problem, a provider's live usage) and from advisory accounting, the orchestrator role file's step 5 SHALL say a dispatch inside the current grant is approved by the grant and every other dispatch still waits for the owner, the existing sentences kept and extended, and the conventions carry the rule once at the loop's section.

## Implementation notes

### The admission lifecycle, built 2026-09-14 (claude-opus-5@subagent)

**WHERE IT LIVES AND WHY THERE.** The reader is one section of
`tools/e2e/scripts/dispatch-brief.mjs` — `grantState`, `readPause`,
`admit`, `admissionLedger`, `cardDrift`, `advisoryLimits`,
`coordinatorObligations`, `grantInheritance`, `admissionRecs`,
`dispatchReadSites`, `cardBlobSha`, `approvedCardText`, `cardFileOf`,
`admissionBoard`, `admissionPhase`. It sits there because
`run-record.mjs` already imports that module and nothing imports the
run record back, so the one place both the lane cut and the three
run-record boundaries can reach is the arm. `brief.mjs` is the only file
that imports both halves, so it is where the LEDGER is derived
(`admissionLedger(allRecords(root), TERMINAL_STATES)`) and handed to the
lane-cut plan — a `dispatch-brief.mjs` that imported the run record would
be a cycle.

**THE GRANT IS READ THROUGH THE PARSER'S READER AND THROUGH NOTHING
ELSE** (criterion 7). The arm re-exported six of the reader's seven
symbols; T-319-s1 named the gap and this card closes it by taking
`dispatchBlock` the same way T-317 took the other six — bound to this
arm's `ProcessFinding` and re-exported under the name it has always
carried. `grantState` is the only caller.

**THE FOUR BOUNDARIES.** The lane cut is in `dispatchLanePlan`, beside
the model resolution and for the same reason: the plan is pure, so a
refusal costs no stamp commit and no worktree. It names no resource and
takes none, which is the criterion's "the lane cut is distinguished from
the writer reservation" as a property of the plan rather than as a
sentence. The child start is in `startRun`, BEFORE `takeReservation` — a
lock taken for work nobody admitted is a writer this loop had no
authority to start, and a refusal after the take leaves a lock behind.
The re-entry and the replacement writer are in `continueRun`, after the
reconciliation: an uncertain old writer refuses there first, which is
what "holds the admission until reconciled" is on disk — nothing is
admitted, nothing is consumed, and the ledger still shows the
interrupted attempt's own admission.

**THE LEDGER IS THE RUN RECORDS.** Each record grew one field,
`admission`, and what has been consumed is derived from
`.supertaskr/runs/` by `admissionLedger`. No second ownership ledger was
added. A record written before this card carries no admission and is
reported as such rather than as an admission nobody made.

**CONSUMPTION, AND THE ONE RULING THE CARD LEFT OPEN.** An open
(non-terminal) admission for a card at the grant's revision is
RE-PRESENTED at every later boundary. Where the card's lifecycle has
concluded, a verification or an integration still re-presents it — the
phases that carry a card to a verdict are the rest of one lifecycle, and
criterion 4's "the verification and integration of the admitted
candidate" is what that reading is taken from. What is refused as
consumed is a fresh IMPLEMENTATION attempt under approval `each`. Under
`until` the bound is the endpoint and under `standing` it is the pause,
so neither spends a per-card approval; criterion 2 names the spending
only under `each`, and this is that sentence read literally.

**WHAT THE ARM BEHAVES LIKE WITH THE BLOCK ABSENT** (criterion 1 read
with T-319's no-grant clause). This project's template carries no
dispatch block, so `grantState` answers `enforced: false` and every
admission is MADE and REPORTED as unenforced. That is the honest
reading: the seat dispatches on the owner's standing authorization,
which lives where the arm cannot read it, and an arm that refused here
would stop a loop nobody asked it to stop. The refusals apply wherever a
block exists. No grant is invented from a person, an instant or a past
authorization, and the report says NOT ENFORCED rather than claiming an
enforcement it did not perform. Every T-311 body is unchanged for the
same reason: a bare fixture root is that state.

**THE BLOB BINDING TOLERATES THE LOOP'S OWN CEREMONY.** `cardDrift`
compares the card at the approved blob — read back out of the object
database by `git cat-file`, since the grant records the sha and git
still holds the bytes — against the card now. A change confined to
`status`, `tier`, `builder`, `verifier`, `built_by`, `verified_by`, or
to lines appended under `## Implementation notes` or `## Verdicts`, or a
line naming a filed follow-up, is the mechanical append the criterion
allows and is REPORTED as drift. A moved criterion, a widened fence and
a deleted line are a different card and refuse.

**THE PAUSE IS A RUNTIME RECORD, RULED WITH THE SEAT IN THIS LANE'S ASK
FILE.** The schema's `dispatch_block:` declaration carries no pause row
and the parser's reader answers each field by name, so a pause row today
would be a control the reader never returns — which criterion 5 forbids
in as many words. The pause is therefore `.supertaskr/pause.json` beside
T-238's holder record: `version`, `at`, `by`, `scope` and an optional
`why`, read by `readPause` and by nothing else, refusing rather than
reading as silence when it cannot be parsed. T-319's own sentence — that
a grant, a pause or a revocation is a dated edit to the block — is
honoured by the block for grants and revocations and by the runtime
record for the pause until T-324-s1 lands. The shape is stated once in
the conventions at the loop's section, as the seat's ruling required.

**THE SCHEMA'S READ SITES.** The parser library closes the attribute set
of a dispatch block field, so a `reads:` attribute on a row would be
refused there and the library is outside this fence. The read sites are
therefore a table in the section's own comment, PARSED back out by
`dispatchReadSites` and held by a body that requires every row to name
one and every named symbol to be exported by the arm — the guard-class
map's own idiom. The rows the arm branches on say `operational`;
`grant.given_by`, `grant.at`, the revocation's two record rows, the
limits family and the history stay `declarative`, which is the honest
label for a field that is read, attributed and printed but decides
nothing.

**THE LIMITS ARE READ AND ENFORCED BY NOTHING**, reported by name as
advisory at every admission, with their absence reported too. An expiry
that has passed refuses nothing. T-324-s3 is the deferral's card.

**A CONSULTATION IS ADMITTED WHILE IT WRITES NOTHING.** T-311 separates
the WORK SERVED from the RESOURCE a child may write, and the read-only
half of that split needed an answer here: a grant approves CARDS, so a
consultation is never in an order, and refusing it would stop the
tool-less participant the owner's approval of the card already covers. A
consultation is therefore admitted, bound to the grant's revision,
consuming nothing and reserving nothing — and one that claims write
ownership of a resource is refused by name, because work that writes is
work needing its own approval whatever the assignment calls it. The
pause still reaches it through its role.

### In-fence follow-through

- `docs/CONVENTIONS.md` is 172130 bytes after this card's addition, against a
  warn line of 146878 and a fail line of 176253 (docs gate, this lane's
  tip). The document was already past the warn line at the base; this
  card added about 4 kilobytes to the loop's own bullet and left 4123
  bytes of head-room. T-311-s3 is the open card for it.
- The behaviour census is STALE by construction: this card adds fourteen
  bodies to the run-record spec and ten to the brief spec, so a fresh
  generation is 105521 bytes against the committed 102875 (that figure
  from `npm run capabilities:check` from tools/e2e, at this lane's tip),
  and `docs/CAPABILITIES.md` is outside this fence (the regeneration is
  EACCES from inside the lane). The merge regenerates it, which is where
  that write belongs.
- `docs/reference/15-settings.md` was regenerated by
  `node tools/e2e/scripts/settings.mjs reference --write` and committed;
  it is a generation of the schema and nothing in it is typed.

### The fence widenings of 2026-09-14

`tools/e2e/tests/cli.spec.ts` and `docs/reference/15-settings.md` were
added to this card's fence by the architect seat on 2026-09-14, on the
lane's ask, and landed on the integration branch at 7e881974. Both are
consequences of criterion 7's opening clause: the body T-319's verifier
wrote to assert every dispatch block row is declarative says in its own
comment that T-324 moves it, and the settings chapter is a generation of
the schema whose label counts move with the flip.

`tools/e2e/tests/brief-flush.spec.ts` was added on the same day, at
6b131f69, after the whole end-to-end leg found its arm-coverage body red:
that body derives the flag set from the command's own frozen list and
reds on a flag no announced arm drives and no entry excuses. The two
this card adds — the pair that makes a lane cut a DERIVED admission —
are argued into that file's excuse list as dials of `--dispatch-lane`,
neither drivable alone. The same leg found one more red, in
`tools/e2e/tests/git-fixture.spec.ts`, and that one was repairable from
inside the fence: this card's new git fixture commits into a repository
it removes, so it now spreads the no-background-maintenance config and
tears down through the shared remover, which is what that census asks
of every spec in the class.

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 split of T-319 under the owner's yes of 2026-09-14 to the order T-319, T-322 before the T-312 rerun): to planned at priority 2, in T-319's slot after it; T-322 is blocked by this card.
