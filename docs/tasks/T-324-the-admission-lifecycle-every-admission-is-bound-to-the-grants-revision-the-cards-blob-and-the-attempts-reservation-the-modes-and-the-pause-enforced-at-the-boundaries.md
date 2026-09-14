---
id: T-324
title: "The admission lifecycle: every admission the arm makes — the lane cut, a child start, a re-entry, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; the three approval modes and the two recovery values are enforced at those boundaries; a pause stops new work at the next safe boundary with its scope stated; a successor coordinator inherits the grant from the block"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 2
status: verifying
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

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Verified at the lane tip `291b3778c26ce9c061c336c0055edc17b5493bdf`, base
`07b1f7aa154e35459ed45449c6b5d48cfb31f830`, on the guarded tier, from the bench worktree
`supertaskr-V-T-324`. The build is sound and the design is the right one: the grant reaches
the arm through the parser's reader and through nothing else, the ledger is the run records
and no second one was added, the admission precedes the reservation at the child start, and
the blob binding tolerates the loop's own ceremony while refusing a rewritten criterion.
THREE CORRECTIONS ARE ASSIGNED, all three of them fail-open holes at the pause and the
endpoint — the two controls this card exists to build — and each is committed on this bench
after this verdict with a body and a mutant block.

#### The frame I actually had, and the sealed inputs

Two spawns. Phase 1 held no tools, no diff and no executor material, and wrote the attack set
against the card at the base; I am a fresh spawn that holds tools and read the diff. I read
the diff and the specs BEFORE the executor's notes, the ask file and the report, in that order.

- attack set `attack-set-T-324.md` — sha256 `661ca256307bd3f939620e4bef70024bc7138900f5fbede789557dcea3783c36`
- ground `ground-T-324.md` — sha256 `abe4dbf1d3ea190ff0ed861c837bf158267a6c67cf593cab2f7fb6c03488157f`
- the card at the base — sha256 `298335f5e3915844161f442986f4df3e3c410d7e8b9e85fca10e11611ed29c88`

All three re-hashed on this bench and matched. The ground carries the seat's answers to phase
1's fifteen measurement requests under its own addendum heading, taken at the base before the
diff existed.

ONE DISCLOSURE, because the rule is that I report the frame I had rather than the one I was
promised: my own phase-2 brief carried two executor-derived facts before I opened the diff —
that `docs/CONVENTIONS.md` stands 4,123 bytes under its fail line at the tip, and that
`T-324-s1` to `T-324-s3` are the executor's filings. Neither says anything about the shape of
the implementation, and phase 1's set was sealed and hashed before either existed; I name them
because a later reader cannot tell a disclosed leak from an undisclosed one.

#### A row per acceptance criterion

| # | criterion | what decided it | verdict |
|---|---|---|---|
| 1 | admission at four boundaries, explicit or derived, bound to the revision, the blob and the reservation; retry consumes nothing twice; no second ownership ledger | bodies `THE ADMISSION COMES BEFORE THE RESERVATION…`, `A CONSUMED APPROVAL PRESENTED AGAIN…`, `A RETRY OF AN INTERRUPTED ADMISSION…` (run-record.spec.ts) and `THE LANE CUT IS AN ADMISSION…`, `A MECHANICAL APPEND IS STILL THE CARD…`, `THE ADMISSION AT THE CUT TOLERATES…` (brief.spec.ts); my own inspection of every path the admission decision reads and writes | MET |
| 2 | the three approval modes, per-card and never a batch, the `until` endpoint inclusive and the next card refused by name | six parameterized bodies `THE MODE AND THE POLICY ARE ENFORCED TOGETHER — approval X paired with recovery Y`; endpoint admitted at stage 6 of the lifecycle fixture | MET after CORRECTION 3 |
| 3 | the two recovery values, one lifecycle fixture with six stages | body `THE REPAIR LIFECYCLE — one fixture, its stages in sequence…`, stages 1 to 6 asserted in order with a different-failure control at stage 5 | MET |
| 4 | the pause, its two scopes, the admitted candidate, the immediate stop routed elsewhere | body `A PAUSE DISTINGUISHES NEW WORK FROM THE VERIFICATION OF A CANDIDATE ALREADY ADMITTED…`; my probes at the two boundaries the body does not reach | MET after CORRECTIONS 1 and 2 |
| 5 | the optional limits read, reported by name, enforced by nothing, the deferral named | body `THE GRANT'S LIMITS ARE READ, REPORTED BY NAME AS ADVISORY…`; plus the negative evidence: `advisoryLimits` is the ONLY reader of `state.block.limits` in the three arm files, and `T-324-s3` is the deferral's filed card | MET |
| 6 | a successor coordinator inherits the grant from the block | body `A SUCCESSOR COORDINATOR INHERITS THE GRANT FROM THE BLOCK…` over a fixture runtime directory carrying a holder record, asserting the predecessor's label and pid are absent from what is inherited and that `remaining` continues from the ledger | MET |
| 7 | the switches operational with their read sites named, the reader the only reader, the report's three groups, step 5 extended, the conventions once | bodies `THE SCHEMA'S DISPATCH BLOCK NAMES A READ SITE FOR EVERY ROW…`, `THE ARM READS THE GRANT THROUGH THE PARSER'S READER AND THROUGH NOTHING ELSE`, `THE ARM'S RUN REPORT KEEPS THE REFUSALS IT TESTED APART…`, `THE ORCHESTRATOR'S STEP 5 KEEPS ITS TWO SENTENCES AND EXTENDS THEM`, `THE CONVENTIONS CARRY THE ADMISSION RULE ONCE, AT THE LOOP'S OWN SECTION`; plus my own grep: `dispatchBlock(` is called at exactly one site, inside `grantState`, and `grantState` at exactly three | MET |

#### The three corrections

**CORRECTION 1 — A PAUSE THE OWNER WROTE CORRECTLY STOPPED NOTHING IN THIS PROJECT'S OWN
TREE, WHILE ONE HE WROTE BADLY STOPPED EVERYTHING.** `admit` returns the unenforced answer
for a tree with no `dispatch:` block BEFORE it reads the pause, so the pause is read by
`grantState` and then discarded. This project's own runtime template carries no dispatch block
(the ground's M1), which makes the tree this card ships in the exact tree in which the control
does nothing — and the conventions this card wrote now tell the owner that
`.supertaskr/pause.json` is how a pause is recorded. The function's own doc comment says the
opposite of what the code does: "the PAUSE is read first because it is the owner's most recent
act and a paused loop is paused whatever the grant says". What makes this a defect rather than
a judgement about grantless trees is the inversion: `readPause` refuses inside `grantState`,
so an UNREADABLE record refuses every admission in that same tree while a readable one refuses
none. Reproduced on this bench against a grantless fixture:

```
a WELL-FORMED `all` pause : ADMITTED (unenforced)
a MALFORMED pause record  : REFUSED [ADMISSION_SCOPE]
```

The correction lifts the pause block above the no-grant return, which is where its own comment
already says it belongs. Criterion 4's `WHEN a pause is recorded` is unconditional on a grant.

**CORRECTION 2 — A `new-work` PAUSE ADMITS ANY VERIFICATION OR INTEGRATION, INCLUDING OF A
CARD NO ATTEMPT EVER ADMITTED, AND SPENDS THAT CARD'S APPROVAL DOING IT.** The scope's branch
discriminates on the PHASE alone (`if (phase === "implementation")`), while the criterion
permits "the verification and integration of THE ADMITTED CANDIDATE". The pinned body only
exercises the case where the candidate exists, so the hole is invisible to it. Reproduced on
this bench, grant `each` over `T-901`, a `new-work` pause recorded, an EMPTY ledger:

```
executor   (implementation): REFUSED [ADMISSION_PAUSED_NEW_WORK]
verifier,  EMPTY ledger    : ADMITTED kind=explicit consumed=true
integrator, EMPTY ledger   : ADMITTED kind=explicit consumed=true
```

So new work passes a pause by relabelling the seat, and burns the card's own per-card approval
while it does — after which the legitimate executor start meets `ADMISSION_APPROVAL_CONSUMED`.
The correction refuses a non-implementation phase whose card the ledger does not carry.

**CORRECTION 3 — THE `until` ENDPOINT IS CROSSED BY NAMING AN UNREACHABLE PARENT.** The
derived branch requires only `grant.order.includes(parent)`. Under `until`, a card in the
order but AFTER the endpoint is work the grant refuses — and a repair naming it as its parent
inherits an authorization the grant never made. Reproduced on this bench, order
`[T-901, T-902, T-903]`, `until: T-901`, recovery `repairs`:

```
explicit T-903 (past the endpoint)   : REFUSED [ADMISSION_UNTIL_ENDPOINT]
DERIVED T-904, parent T-903 (past it): ADMITTED kind=derived consumed=true
```

Criterion 2 admits under `until` only "the repairs that card's delivery needs", and a card the
grant does not reach delivers nothing. The correction refuses a parent beyond the endpoint by
name.

#### The attack set, answered where the answer is not a row above

- **The read-once cache (A1.1) and the mid-run mutation (A2.7).** There is no memo. `grantState`
  reads the schema, the template and the pause from disk on every call, and it is called once
  per boundary — `dispatchLanePlan`, and `admissionAt` from `startRun` and from `continueRun`.
  The pause fixture writes the record as RAW JSON on disk and the grant as RAW YAML into the
  template, never through an arm helper, which is the arming A1.1 asked for and X1 called the
  highest-value control in the set. It is the fixture shape throughout.
- **The four boundaries, one chokepoint (A1.2).** All four reach one `admit`. The replacement
  writer is not an independent call site: it is `continueRun`'s one `admissionAt` call with the
  boundary string chosen by `opts.replace`. That is not a hedge — the ground's M4 established at
  the base that the replacement IS a branch inside `continueRun` — so A1.2's demand for a mutant
  that reds the replacement independently of the re-entry has no site to aim at, and I record
  that rather than grade it a miss. The boundary label is asserted at each of the three
  (`child-start`, `re-entry`, `replacement`).
- **The blob binding that binds to nothing (A1.3).** It binds. `cardDrift` reads the approved
  revision back out of the object database by `git cat-file` on the sha the grant recorded and
  compares it to the card now, and the edit the body uses is a SEMANTIC one inside the
  acceptance criteria, not whitespace — which is exactly what A1.3 demanded. A deleted line and
  a widened `touches:` are both refused, and the four mechanical shapes are all admitted.
- **The mechanical-append escape hatch (A1.6, D3).** It is a CLOSED enumeration:
  `MECHANICAL_FIELDS` is six frontmatter keys, `MECHANICAL_SECTIONS` is two headings, plus one
  follow-up-id pattern. An amendment under a heading of its own is substantive and refuses,
  which is this project's own recorded lesson honoured in code. I withdraw A1.6's demand that an
  Implementation-notes append be refused: the card's own words allow "a notes or verdicts
  append", so the implementation follows the criterion and my attack was over-tight.
- **The derived admission with a decorative evidence field (A1.4) and attribution by timing
  (A3.2).** The arm checks that a parent and an evidence were NAMED, never that the naming is
  true — and it says so, by name, in `coordinatorObligations`, which the report prints under
  `THE COORDINATOR'S, NOT THIS ARM'S`. That is criterion 7's required separation used for
  exactly the thing A3.3 said must land there rather than be presented as enforcement. Graded as
  disclosed, not hidden. The de-duplication is keyed on the FAILURE EVIDENCE digest and the
  parent, not on the card id, and the lifecycle fixture's stage 5 carries the different-failure
  control that proves it (A3.5).
- **Minting a grant (A1.5).** Nothing in the admission path writes the template or the block.
  The mode-matrix body asserts a derived admission's `revision` is still 1.
- **The retry seam (A1.7) and the uncertain old writer (A1.8).** The retry body constructs the
  real intermediate on-disk state — the attempt left `reserved`, the lock held, nothing bound —
  rather than calling `startRun` twice, which is the arrangement A1.7 asked for. The uncertain
  writer is T-311's `CONTINUE_UNCERTAIN`, a third state between live and dead, and the body
  asserts the refused continuation wrote no second record, moved no admission and touched no
  reservation.
- **The second ownership ledger (A1.11, D5), by inspection as I pre-committed.** The admission
  decision READS the schema, the template through the reader, `.supertaskr/pause.json`, the run
  records under `.supertaskr/runs/`, git's object database and the card index. It WRITES exactly
  one thing: an `admission` field on the run record the boundary was already writing. No lock,
  no marker, no `.consumed`, no table. `readPause` has no writer anywhere in the arm — the pause
  is the owner's file and the arm only reads it.
- **`each` as a batch (A2.1) and refusal by name (A2.2).** Consumption is per card and derived
  per card (`ledger.filter(e => e.card === card …)`); every refusal message carries the card id,
  and the bodies assert on the id rather than on a boolean.
- **`until` by recorded order (A2.3).** The grant's `order` is the only recorded order the data
  has — the ground's M1 shows the declaration's own `what:` says "the approved cards in dispatch
  order". A2.3 collapses to a definitional point, as I said it would.
- **The inclusive endpoint (A2.4).** Two separate readings: the endpoint card itself is started
  and carried to completion at stage 6 of the lifecycle fixture, and the card after it is
  refused BY NAME in the `until` arm of the mode matrix, naming both the endpoint and the
  refused card.
- **Crossing a parked endpoint (A2.5).** The arm refuses EVERY card past the endpoint, parked or
  not, so the requirement holds a fortiori and the status set's completeness cannot matter. One
  residual, recorded rather than assigned: the parked reading only decorates the refusal
  message, and `request.board` is supplied only at the lane cut — at the three run-record
  boundaries the message says the endpoint's status "was not read here". Nothing behavioural
  turns on it.
- **The mode × recovery matrix (A2.8).** Six distinct bodies, parameterized, each naming its own
  pair. I counted them: three approvals × two recoveries.
- **An unknown mode (A2.9) and failing open (X3).** Fails CLOSED, and before `admit` is reached:
  the parser's reader validates a mode against the declaration's own `values:` list and throws
  `ProcessFinding` (`approval is sometimes, which is not one of…`). `admit` carries its own
  `UNKNOWN_MODE`/`UNKNOWN_RECOVERY` refusals as defence in depth. A pause with a scope outside
  the closed set, with no `by`, with no `at`, with a wrong `version` or that does not parse all
  refuse (A4.6). An unreadable pause is never silence.
- **`none` refusing everything (A3.1).** `RECOVERY_NONE` fires only for `kind === "derived"`; an
  explicitly approved repair takes the explicit path and is admitted under `none`, which the
  `none` arms of the matrix exercise.
- **The new-work scope proved by one arrangement (A4.1).** The permitted verifier and the
  refused replacement executor go through the SAME entry point, `startRun`, with different
  assignment roles — not two different functions. That is the defect my role file names most
  often, and it is not present here.
- **"The admitted candidate" identified loosely (A4.2).** Present. CORRECTION 2.
- **The replacement under a pause (A4.3).** Refused, and by the pause rather than by the
  re-entry rule: the refusal is `ADMISSION_PAUSED_NEW_WORK` at `startRun`, a fresh implementation
  attempt.
- **`all` stopping mid-phase (A4.4) and the staged merge (A4.5).** The `all` refusal stops the
  next ADMISSION and names each phase's declared safe boundary in its message; it kills nothing
  in flight, because the arm has no way to. A4.5's two-record branch has no implementation to
  test here — no code in this card decides whether a staged merge finishes or aborts — and the
  criterion's clause is a statement about what a pause MEANS for a mechanism outside this arm. I
  grade the clause as stated rather than as enforced, and say so rather than crediting it.
- **"Needs no second approval to be read" (A4.7).** Vacuous, as I pre-committed it might be:
  there is no general "records need approval" rule for it to be an exemption from. `readPause`
  requires a `by` so that the record says whose act it is, which is the nearest real content.
  Recorded as vacuous, not as met by a mechanism.
- **The pause written where nobody looks (A4.9).** The fixture writes `.supertaskr/pause.json`
  as raw bytes at the documented path, not through an arm helper. The shape is documented once
  in the conventions at the loop's own bullet, which is what a later owner would follow.
- **Limits (A5.1 to A5.4, D1).** Each present limit is named individually in the report
  (`limits.tokens.<provider> = N`, `limits.expires_at = …`), absence is reported as "no ceiling
  nobody wrote down" rather than defaulted to a number, `advisoryLimits` is the only reader of
  the limits in the three arm files, and the deferral has an addressee: `T-324-s3`. My D1
  pre-commitment said I would not credit the criterion's PURPOSE on a report line alone; the
  grep and the filed card are the negative evidence I demanded, so I credit it.
- **Succession (A6.1 to A6.4).** The inherited answer is asserted NOT to contain the
  predecessor's label or pid, the remaining order is continued from the ledger rather than
  restarted, and the grantless control says so rather than inventing an order. A6.3's demand for
  an ungraceful predecessor's leavings is partly unmet — the fixture writes a holder record but
  no partial run record and no stale lock — and it cannot change the answer, because
  `grantInheritance` reads neither; recorded, not assigned. A6.4's interaction is coherent: the
  successor inherits the GRANT from the block while the uncertain old writer still holds its own
  admission at the reservation, and the two rules do not touch.
- **The read sites (A7.1) and text-presence (A7.2, A7.5, D2).** The read-site table is parsed
  back out of the schema by `dispatchReadSites` and held by a body that requires every declared
  row to name a site and every named symbol to be a function this arm EXPORTS — so a site naming
  nothing real reds. I judged placement and singularity for the prose clauses as I pre-committed:
  the conventions rule is consolidated INTO the loop's existing bullet (one occurrence, asserted
  by a count), not added under a heading of its own; step 5's two standing sentences are present
  verbatim, with the new clause between them and `5b.`, and the ground's M10 confirmed no spec
  pins a sentence of step 5 proper, so nothing was paraphrased away.
- **Concurrency (X4).** Not addressed by the diff and not required by any criterion. Consumption
  is derived by a read of the run records with no atomicity of its own; the named atomic
  primitive is T-311's `wx` reservation, which serialises two WRITERS over one resource but not
  two admissions of a card whose assignment carries `resource: none`. Filed as `T-324-s4` rather
  than assigned, because no criterion asks for it.

#### Security sweep (mandatory, and it found no REJECTED-level finding)

- **No dependency was added.** No `package.json`, no lockfile and no new import outside the tree
  except `RUNTIME_DIR` from `.claude/hooks/lane-fence.mjs`, which is the one file that declares
  that name (`run-record.mjs` reaches the same constant through `gate-token.mjs`, which
  re-exports it) — so the new path has one spelling and not two.
- **The one new input path is `.supertaskr/pause.json`.** It is parsed inside a try/catch,
  pinned to `version: 1`, its `scope` validated against a closed two-value set, `by` and `at`
  required, and a record that fails any of those REFUSES rather than being half-read. That is
  the right direction for a control whose failure mode is a loop that keeps running.
- **No identifier from owner-authored data reaches a path join or a shell.** `approvedCardText`
  validates `^[0-9a-f]{40}$` before `git cat-file`; `cardFileOf` resolves a card id through the
  board index rather than building a path out of it, which is T-311's own charset rule honoured;
  `cardBlobSha` joins only a repository-relative path the index gave it; every git call is an
  argv array.
- **The derived admission is the privilege-escalation surface by design** — it is the one path
  that admits work no owner named. Its whole guard is `recovery === "repairs"` plus a parent in
  the order plus a non-empty evidence plus `scope === "repair"`. CORRECTION 3 closes the leak in
  that guard, and I grade it as a security finding rather than a correctness one, exactly as I
  pre-committed in X5(d). The residual — that attribution is a NAMING and not a truth — is
  declared in the report's obligations group.
- **No credential, no key, no home path and no owner-identifying string** lands in a record or a
  report. The run record's `resource` is an absolute path, but no run record is tracked by git
  (the ground's M13).
- **The grant's owner-authored strings** (`given_by`, `at`, the card ids) are interpolated into
  rendered report lines that reach a brief. They sit at the same trust level the runtime
  template already had, reach no shell and no path, and are not a finding.

#### What I checked that no criterion asked for

- The in-fence follow-through list names three entries: the conventions size reading, the census
  staleness, and the regeneration of `docs/reference/15-settings.md`. The first two are readings
  rather than changes; the third is a generated file inside the widened fence and nothing in it
  is typed. The two remaining out-of-criterion changes — the rewritten `cli.spec.ts` body and the
  two `brief-flush.spec.ts` excuse entries — are declared in the notes under `The fence widenings
  of 2026-09-14` rather than under the follow-through heading. They are consequences of criterion
  7's flip and of criterion 1's lane-cut boundary, both inside the widened fence and both argued;
  I record the heading mismatch and do not treat either as undeclared surface.
- The claim that the `git-fixture.spec.ts` red was repaired from INSIDE the fence holds: that
  file is untouched, and the repair is in `run-record.spec.ts`'s own `grantBench`, which now
  spreads `NO_BACKGROUND_MAINTENANCE` and tears down through `removeGitFixture`.
- Every path the diff touches is one of the card's eleven `touches:` entries or a card under
  `docs/tasks/`. The fixture git identity in the new bench is `fixture@example.invalid`, which
  the keeper's own table already names.

#### The mutant blocks — three corrections, three blocks

```mutant
correction: a pause read after the no-grant state stops nothing in the tree this project ships
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/run-record.spec.ts
body: A PAUSE THE OWNER RECORDED STOPS THE LOOP EVEN WHERE THERE IS NO GRANT TO ENFORCE — and a tree with no block is this project's own
message: a pause recorded in a tree with no grant stopped nothing
--- old
  if (pause !== null) {
--- new
  if (pause !== null && state.enforced) {
```

```mutant
correction: a new-work pause discriminating on the phase alone admits work no attempt ever admitted
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/run-record.spec.ts
body: A `new-work` PAUSE PERMITS THE VERIFICATION OF A CANDIDATE ALREADY ADMITTED AND OF NOTHING ELSE — a verifier start for a card this loop never admitted is refused
message: a new-work pause admitted a verifier for a card no attempt ever admitted
--- old
      String(request.work ?? "card") !== "card" || ledger.some((e) => e.card === card);
--- new
      true;
```

```mutant
correction: a derived repair whose parent lies past the until endpoint inherits an authorization the grant never made
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/run-record.spec.ts
body: A DERIVED REPAIR CANNOT EXCEED THE AUTHORIZATION IT INHERITS — a parent past the `until` endpoint is refused, so the endpoint is not crossed by naming an unreachable parent
message: a repair crossed the until endpoint by naming an unreachable parent
--- old
    const beyondEndpoint = endpointAt >= 0 && parentAt > endpointAt;
--- new
    const beyondEndpoint = false;
```

Three corrections, three blocks, no shortfall. Each body was run RED against the arm as this
lane built it and GREEN against the arm as this bench corrected it; the readings are in the
postscript below.

#### Findings filed, which block nothing

- `T-324-s4` — the consumption is derived by a read with no atomicity of its own, so two
  admissions of one card that reserve no resource can both spend one per-card approval. No
  criterion asks for it; the retry rule the card DOES ask for is held correctly.
- `T-324-s5` — an `all` pause reaches the admission reader and nothing else: `readPause` has one
  caller and `grantState` has three, all of them admission boundaries, so the staged merge the
  criterion names by hand is decided by no pause.

The executor's own three — `T-324-s1` (the pause row in the block), `T-324-s2` (the lane cut
records no admission) and `T-324-s3` (the limits' deferral) — are the right three and I would
have filed the second and third myself.

#### Postscript — every figure with the ref it was measured at

A figure with its ref stays true forever; a figure without one is wrong as soon as anybody,
including me, writes again. Nothing between a verdict and a merge re-runs the suites a verdict
quotes, so both trees are measured here: the one I was sent, and the one my own commits made.

##### The whole battery at the tip I was sent, `291b3778c26ce9c061c336c0055edc17b5493bdf`

| leg | exit | bodies | targets | verdict |
|---|---|---|---|---|
| parser | 0 | 454 | 1 | GREEN |
| app | 0 | 1171 | 1 | GREEN |
| rust | 0 | 655 | 18 | GREEN |
| e2e | 0 | 1126 | 1 | GREEN (18.4m) |

Every leg through `tools/e2e/scripts/gate-run.mjs`, in the foreground, on the bench's own port.
The base's own readings for comparison, from the sealed ground's M6 and M7: 1102 e2e bodies and
454 parser bodies at `07b1f7aa`, both green — so this lane added 24 e2e bodies and no leg was
red before it.

##### The whole battery at my own tip, `c227752e8b6004e5dd0c64b1b9af7bc8680fc764`

| leg | exit | bodies | targets | verdict |
|---|---|---|---|---|
| parser | 0 | 454 | 1 | GREEN |
| app | 0 | 1171 | 1 | GREEN |
| rust | 0 | 655 | 18 | GREEN |
| e2e | 0 | 1129 | 1 | GREEN (18.8m) |

My own tip is four commits above the one I was sent: this verdict, then the three corrections,
each with its body. The three corrections add 3 bodies to the e2e leg.

##### The two currency checks at my own tip

- `cargo run -p supertaskr-index -- index --check --root ../..` — **CURRENT**, 1228940 of
  2145959 bytes (57.3%), 203 files, 2626 symbols, 2505 edges. The graph indexes neither
  `tools/e2e` nor `method`, so nothing this lane or this bench touched could move it.
- `npm run capabilities:check` from `tools/e2e` — **STALE BY CONSTRUCTION**, committed 102875
  bytes against a fresh generation of 105999 at `c227752e`. The lane's own notes report 105521
  at `291b3778`; the difference is the three sentences my three bodies add. `docs/CAPABILITIES.md`
  is outside this card's fence and the merge regenerates it, so I report the figure with its ref
  rather than regenerating it on the bench.

##### The corrections, RED before and GREEN after, and the drill

All five readings are over `tools/e2e/tests/run-record.spec.ts` on this bench, through
`npx playwright test` from `tools/e2e` on port 25324.

- **RED.** The three bodies appended to the spec with the arm exactly as the lane built it:
  `3 failed, 32 passed` — and the three that failed are the three I added, each on its own first
  assertion. That is the reading that says the bodies CAN fail.
- **GREEN.** The same three bodies with the three corrections applied: `35 passed`. No body that
  passed before this bench touched anything stopped passing — the lane's own 32 are untouched.
- **THE DRILL, one mutant per correction, planted on the corrected tree.** Each mutant reds
  EXACTLY ONE body, its own, and 34 pass beside it — so no kill set contains another and none of
  the three is a restatement of another. Each mutant is planted at the site the property lives:
  the pause's own guard, the candidate derivation, and the endpoint comparison.

  | mutant | reds | passes beside it |
  |---|---|---|
  | `if (pause !== null && state.enforced)` | correction 1's body, alone | 34 |
  | `candidate` pinned to `true` | correction 2's body, alone | 34 |
  | `beyondEndpoint` pinned to `false` | correction 3's body, alone | 34 |

  Each failing run prints the `message` its block names, checked by hand against the run's own
  output: `a pause recorded in a tree with no grant stopped nothing`, `a new-work pause admitted
  a verifier for a card no attempt ever admitted`, `a repair crossed the until endpoint by naming
  an unreachable parent`.
- **THE RESTORE IS PROVED BY SHA256, NOT ASSERTED.** `tools/e2e/scripts/dispatch-brief.mjs` reads
  `1b146217e9939112a2b5b122a508817162ed61ca6cb032a9d80df1a3e4ba78bf` before each plant and again
  after each restore, three times over. The file at my committed tip carries that same digest, and
  `tools/e2e/tests/run-record.spec.ts` carries
  `6f45d70afb4ba36f49e0c3ecdf2ceeef0c21a794a061d76d4b4b1e49c0e6e73f` — so the tree I drilled and
  the tree I committed are the same tree, byte for byte.
- **THE CONTROL THIS BENCH OWES FOR ITS OWN SUGGESTIONS.** Each of the three bodies carries a
  positive control evaluated where the arming is ABSENT and it is a different arrangement, not
  the same one read twice: correction 1's is the same grantless tree with the pause record
  REMOVED (it admits, and says nothing was enforced); correction 2's is the verifier of the card
  that WAS admitted (it starts, and re-presents that candidate's admission rather than making a
  fresh one); correction 3's is the same repair of a parent the grant DOES reach (admitted). Each
  control was run and seen to answer the opposite way.

##### The preflight and the fence at my own tip

`node tools/e2e/scripts/brief.mjs --task <card> --preflight` exits 0 over `T-324`, `T-324-s4` and
`T-324-s5`. Everything this bench wrote is inside the card's own eleven-path fence or under
`docs/tasks/`: `tools/e2e/scripts/dispatch-brief.mjs`, `tools/e2e/tests/run-record.spec.ts`, the
card, and the two filed findings. No file outside the fence moved.
