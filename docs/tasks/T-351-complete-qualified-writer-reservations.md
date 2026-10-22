---
id: T-351
title: Reserve complete repository-qualified writer sets through the existing run-record transaction
feature: F-04
milestone: 4
priority: 1
size: M
tier: standard
status: verifying
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: [T-349, T-350]
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/qualified-reservation.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/qualified-reservation.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

Reserve the entire product/records scope before any writer can start, using the existing coordinator transaction and reservation home. Keep one answer about who owns each domain. This reservation foundation is consumed by the next native-lifecycle contract; it does not by itself enable split dispatch.

## Finding and reconciliation

Prepared at e985f1c807a2bad19017b6fef0c968a70cccf42b. The existing run-record transaction serializes callbacks and starts. Its reservation is an exclusive file keyed by one absolute checkout, not the task's qualified project domains. Two separate worker checkouts of the same product can therefore be individually reserved without this mechanism proving their task fences disjoint. T-349 provides the canonical qualified comparator; T-350 supplies exact committed card/registry and measured project-root facts. Reuse both. Shared team authority, cross-host scheduling and physical activation are outside this card.

## Acceptance criteria

- WHEN the qualified reservation API in tools/e2e/scripts/qualified-reservation.mjs accepts a request THE request SHALL name one coordinator authority root, attempt, project association, immutable card/registry receipt and full per-role project revisions; it SHALL retain the canonical expanded fence from the public parser and measure each participating project root and actual worker checkout. The worker bindings SHALL name role, absolute checkout and exact base. Qualified scope SHALL be derived from committed bytes using the existing records capture and canonical parser, never trusted from caller-supplied expanded paths. The canonical coordinator authority root SHALL equal the captured product integration root and be bound to its association; selecting another home SHALL refuse. For first acquisition, each declared worker base SHALL equal its measured HEAD and the corresponding captured role revision. After publication, that base SHALL remain the immutable origin of retained scope; reads, release and exact repeats SHALL revalidate physical checkout/project identity and retained committed inputs without requiring current HEAD to remain at the base or deriving scope from current HEAD. The subsequent native consumer governs permitted HEAD movement. Duplicate roles SHALL refuse; supported colocated roles SHALL normalize one physical worker claim and a union of domains, with differing bases for the same worker refused. Missing, malformed, changed or unbindable facts SHALL refuse before acquiring a writer set. Pin runtime data format and public API in the delivery notes.
- WHEN two writer sets are compared THE canonical qualified comparator SHALL compare their domains in the authoritative project-root identities rather than treating different worker checkout paths as different projects. Equal product domains in separate worker checkouts SHALL collide; equal relative paths in supported independent product and records repositories SHALL remain distinct; colocated aliases SHALL collide. Missing facts, changed associations, unsupported nested/shared-common-directory product/records topology, unsafe paths and symlink escape SHALL refuse. A participating worker checkout SHALL be uniquely owned, even when two scopes inside it would be disjoint.
- WHEN tools/e2e/scripts/run-record.mjs acquires or releases a qualified set THE complete conflict check and publication SHALL run inside the existing withNativeTransaction boundary and reservation home, with no second lock framework or independently editable authority table. The set SHALL be published atomically as one recoverable record before launch, or not acquired. A conflict in any participating repository SHALL leave no reservation for another participating repository. Every legacy and qualified writer acquisition SHALL check qualified sets in that authority home under the same existing transaction, in both acquisition orders. Existing whole-checkout reservations SHALL remain effective and conservatively conflict with an overlapping qualified set. Legacy release SHALL not remove a qualified set. A qualified reader and every conflict check SHALL reconstruct retained scope from exact committed card/registry inputs and measured identities, validating version, owner, receipt, bindings and canonical expansion; a narrowed valid-JSON scope, changed binding or unreadable authority SHALL refuse rather than appear free. A checksum stored only beside mutable scope is not sufficient evidence.
- WHEN acquisition is repeated with the same attempt and exact scope THE result SHALL be idempotent; a changed scope or competing owner SHALL refuse. Release SHALL remove only the exact set owned by the requesting attempt, using expected retained identity/content. Foreign, unreadable or changed qualified authority SHALL not be deleted. Scope equality SHALL retain ownership, bases and domain facts while excluding incidental acquisition times and holder process identity. Dead holder observation SHALL not grant permission to steal a set; retained attempt/job reconciliation decides release. A crash after acquisition SHALL leave a discoverable set naming its attempt, never an invisible partial grant.
- WHEN the existing lifecycle is used without qualified scope THE current start, bind, continuation, stop and collection behavior SHALL remain effective. This card SHALL expose the qualified acquire/read/release operations through the existing run-record module, but native admission and split dispatch SHALL stay refused until the separate native consumer is qualified. No unknown assignment field SHALL be accepted as permission to write a second root. No CLI escape hatch, hand-authored lane manifest or new monitoring daemon SHALL be introduced. The existing seat fixtures in tools/e2e/tests/push-guard.spec.ts SHALL copy each conventions source once, including the index and all chapters, without making read-only live sources writable or altering their assertions.
- WHEN verified THE bodies in tools/e2e/tests/qualified-reservation.spec.ts and tools/e2e/tests/run-record.spec.ts SHALL exercise real independent repositories and worker checkouts, exact committed receipt drift, same-project scope collision across different worker checkouts, genuinely disjoint scopes, colocated aliases, mixed-component containment, second-root conflict with no first-root residue, legacy whole-checkout conflict in both acquisition orders, legitimate colocated role aliases and conflicting alias bases, narrowed valid-JSON retained scope, changed binding, malformed/stale reservations, foreign release, idempotent repeat and changed repeat, including retained reads, exact repeats and release after legitimate worker commits advance HEAD. Concurrent child-process acquisition SHALL prove one winner for conflicting sets, with separate discriminating controls: a coordinated unsafe interleaving when serialization is disabled, and admission of a conflicting set when conflict enforcement is disabled. Restore every drill by hash. Fixtures SHALL own their inputs, not depend on the live project grant or board. The existing seat-fixture cases SHALL run successfully with their read-only conventions source. An isolated mutation reintroducing the duplicate index copy SHALL turn the existing seat-fixture case RED with the expected index-copy EACCES during setup before the seat operation, followed by literal hash restoration and a successful rerun. Preserve source read-only permissions and existing assertions.

## Implementation notes

### Fresh recovery criteria echo — T-351-a6

- [x] Acquire only a complete, validated qualified request: committed card/registry receipt, canonical expanded scope, measured project and worker identities, exact first-acquisition bases, and immutable retained bases after legitimate HEAD advancement.
- [x] Compare domains by authoritative project identity, preserve independent repository domains, reject aliases/topology/path escapes, and give each physical worker one owner.
- [x] Check and atomically publish the full set within the existing native transaction and reservation home; keep legacy conflicts effective in both orders and reconstruct retained authority from exact committed inputs.
- [x] Make exact repeats idempotent, refuse changed ownership/scope, release only an exact owned retained set, and preserve discoverable crash evidence without dead-holder stealing.
- [x] Preserve ordinary lifecycle and dependency loading, expose only qualified library operations, keep native/split admission refused, and copy every read-only conventions fixture input exactly once.
- [x] Exercise the reservation edge cases and separate concurrency controls using owned fixtures; preserve recovered hash-restored drills and measure the duplicate-copy EACCES mutation, literal restoration, and successful seat-fixture rerun in this attempt.

This fresh attempt starts at 85eb7584e517d379f36df55e83a07f70eb93686c.
The allowed recovery source is implementation-only commit
b04953c62409d2a2d8a5395f80fe6b245f8dbc34. The original failed
attempt at baa54a7302bdac16159e0593c7afd27b798d5c9f remains historical
RED evidence; its original grade is not this attempt's grade. The reviewed
recovery criteria and five-file fence above are retained, rather than
importing that attempt's task card.

Independently reviewed outside the repository in two packet-only sittings. Final review accepted this contract with the explicit acquisition-versus-retained-HEAD distinction incorporated above. Owner-authorized on 2026-10-05 as the next qualified-ownership implementation in the full repository-separation migration; implementation and independent verification remain separate.

Draft outside the product repository. New files have tracked parents. Size M is provisional for one reservation-set test cycle; revise size/fence before dispatch if investigation shows an additional independent cycle. Preserve existing one-writer/digest grant hazards and callback limits. Keep transaction orchestration in run-record and validation below it. Qualified capture may load the existing built public parser on demand; ordinary lifecycle imports and operations SHALL retain their existing dependency/loading requirements, with no new capture/parser dependency when qualified scope is absent. The capture providers are library exports, not CLI entry points; introduce no circular initialization dependency. This card changes no method grammar or publication ruling. Requested implementation and independent verification are GPT-6.1 Sol extra-high; observed identity is separate. No additional agent demonstration campaign.

### Delivered foundation and recovery provenance

The six check marks above record the delivered implementation and its evidence;
the final graded range is measured after this complete notes commit and is
reported by ref, count and exit in the executor handoff. Its result is not
preclaimed here.

The exact allowed recovery commit was applied through an ordinary cherry-pick.
Its only conflict was the historical criteria echo in this card; that conflict
was resolved to the already committed recovery echo and reviewed criteria,
producing b51e1ff7. At repaired source
273f1eed77169e3638313265716f40d436fecf29, all four implementation files are
byte-identical to b04953c62409d2a2d8a5395f80fe6b245f8dbc34. No historical
card, verifier artifact or authority stamp was imported.

Committed capture/task snapshot and the canonical public parser reconstruct
the complete card, registry, association, repository identities and qualified
expansion. Registered worker identity binds physical root/common directory/
Git directory/device/inode. First acquisition checks exact HEAD/base; retained
reads, repeats and release use the immutable committed origin and physical
identity after legitimate worker commits advance HEAD. Colocated role aliases
normalize one worker and reject inconsistent bases. Domain comparison uses
project identities; independent repositories remain distinct, colocated aliases
and repeated physical workers collide. Unsafe paths, symlinks, nested roots,
unsupported shared common directories and receipt drift refuse.

Run-record performs complete validation, legacy/qualified conflict checks,
atomic publication and exact release within the existing native transaction
and reservation home. The retained record is reconstructed from committed
inputs before conflict checks. The repaired version 2 publication additionally
commits that reconstruction in its filename: a coherent replacement of the
JSON's request, scope and adjacent identity cannot change the originally
published scope. Missing objects and malformed authority cannot appear free.
The earlier version 1 implementation lacked this acquisition commitment and
was rejected independently; its evidence remains below. Legacy whole-checkout
conflicts work in both orders;
legacy release cannot remove a qualified set. Exact repeat preserves the first
record; changed repeat and foreign expected release identity refuse. A dead
holder does not authorize stealing. Ordinary lifecycle imports/reservations
without qualified authority load no new capture/parser dependency; unknown
assignment root fields refuse. Qualified operations are library APIs only;
native qualified admission and split dispatch still need the separate consumer.

### Public API — request version 1, retained publication version 2

`captureQualifiedInputs({ authorityRoot, projectId, revisions: { product,
records }, taskId, legacyTokenMap })` is synchronous and returns
`{ authorityRoot, receipt, fence }`. Both role revisions require full commit
object IDs. The receipt extends the existing committed task-snapshot receipt
with normalized exact-token ownership and complete registry entries
`{ path, blobId, mode }`, retaining the exact card, association, revision and
measured repository facts. Capture alone grants no writer authority.

The strict request is `{ version: 1, authorityRoot, attempt, projectId,
revisions, taskId, legacyTokenMap, receipt, workers }`, with workers
`[{ role: 'product' | 'records', checkout, base }]`. Checkout is absolute;
base equals the captured role revision. Duplicate roles and unknown fields
refuse. The caller supplies an expected receipt, never trusted expanded paths.
Reconstructed scope contains `{ authorityRoot, attempt, projectId, revisions,
receipt, fence, workers }`; canonical workers contain
`{ identity: { filesystemRoot, gitCommonDirectory, gitDirectory, device,
inode }, base, roles }`. Device/inode are strings; roles and workers are sorted.

Run-record exports asynchronous
`acquireQualifiedReservation(root, request, { at?, pid?, host? })`, returning
`{ file, reservation, repeated }`; `readQualifiedReservation(root, attempt)`,
returning a validated record or null; and
`releaseQualifiedReservation(root, { attempt, expectedIdentity })`, returning
a boolean. `qualifiedReservationPath(root, attempt, expectedIdentity)` is
synchronous and requires the full canonical `sha256:<64 lowercase hex>`
acquired identity. The API root must equal the captured product integration
root. Scope equality includes
ownership, bases, committed receipts and physical/domain facts, excluding
acquisition time and holder process metadata.

The sole publication is
`.supertaskr/runs/reservations/qualified-<attempt>-<64 hex acquired digest>.json`, exactly
`{ version: 2, kind: 'qualified-writer-set', attempt, request, scope,
identity, takenAt, holder: { pid, host } }`. Filename, record and request owners
agree. The filename digest must equal SHA-256 of the fully reconstructed
canonical acquired scope, independently of the mutable adjacent identity.
Every reader, conflict check, exact repeat and qualified release validates
that commitment. Release first locates the held attempt, then compares the
expected identity: a wrong identity refuses rather than reporting an absent
wrongly constructed path. Old unanchored names, malformed names and multiple
publications for one attempt fail closed; none is silently migrated, selected
by directory order, rewritten or rekeyed. This is retained-file content
integrity within the existing authority home. Replacing, deleting or rekeying
the entire authority home, filesystem/OS compromise and authentication are
outside its claim; the coordinator/native consumer protects that boundary.
Below run-record, validation exports `deriveQualifiedScope(request,
{ retained? })`, `measureQualifiedWorker`, `qualifiedSetsConflict`,
`legacyQualifiedConflict`, `validateQualifiedReservation`, `qualifiedContent`,
`qualifiedIdentity`, `QUALIFIED_RESERVATION_VERSION` (2),
`QUALIFIED_REQUEST_VERSION` (1) and
`QualifiedReservationFinding`. Explicit qualified operations preload validation
asynchronously, then validate/check/publish synchronously inside the existing
transaction. Legacy take/release retain their synchronous signatures. Delivery
used Node v22.22.0 at source 273f1eed; package engines were unchanged.

### Self-drill block — recovered source and fresh repair

The historical notes at baa54a7302bdac16159e0593c7afd27b798d5c9f record
eleven RED/hash-restored mutants for the ten added bodies at implementation
source b04953c62409d2a2d8a5395f80fe6b245f8dbc34. These remain recovered
evidence, not a final successful grade for T-351-a6. At repaired source
273f1eed, an empty explicit source-to-recovery diff and literal SHA-256 prove
the four implementation files still carry those same bytes/properties:

| File | SHA-256 at both implementation and repaired source |
|---|---|
| qualified-reservation.mjs | `28b70ee29071b007521d2e4dde77b8e90adeca61ba786b044658f416a5cc13bd` |
| run-record.mjs | `2789724ce93249cfa8b4f959044418eeec0dbc3f813bbf5b3fef17b319194f89` |
| qualified-reservation.spec.ts | `3d281b3204d4b11032d0920e2596d08c7f07b80ae4b6d8376509209538a78b49` |
| run-record.spec.ts | `6311ea018f4eaf425dc0e1377ec89626548c38eb403218644cd089489cc88940` |

| Historical drill | Removed property or changed data | Body prefix |
|---|---|---|
| 01 | Committed mixed-component records domain changed | qualified acquisition freezes complete committed |
| 02 | Canonical comparator overlap discarded | qualified domains separate independent roles |
| 03 | Expected committed receipt comparison removed | qualified validation refuses drift |
| 04 | Incompatible physical alias bases accepted in retained mode | qualified colocated role bindings |
| 05 | Current HEAD required during retained validation | qualified repeat read and exact release |
| 06 | Mutable narrowed scope trusted after capture | qualified retained readers reconstruct |
| 07 | Legacy versus qualified conflict relation removed | qualified second-root and legacy conflicts |
| 08 | Transaction removed with coordinated post-check interleaving | qualified concurrent acquisition has one winner |
| 09 | Qualified-set conflict enforcement removed | qualified conflict enforcement independently |
| 10 | Unknown assignment fields accepted | ordinary reservation lifecycle loads no qualified |
| 11 | Validation eagerly imported by ordinary lifecycle | ordinary reservation lifecycle loads no qualified |

Each historical run executed one body and exited 1; each literal restoration
exited 0 with matching hashes. The controls discriminate independently:
serialization removal allows both coordinated fixture children to publish,
while conflict removal admits sequential overlap. Every child is joined or
terminated and joined before cleanup. Their original measured refs remain
historical. The new-file keeper was UNANSWERED at the original admitted base
because these new files did not exist; no baseline GREEN is claimed.

The initial duplicate-copy recovery adds no body or assertion. It changes the
shared seat fixture
so the flat docs loop excludes `CONVENTIONS.md`; `conventionsFiles` copies that
index and every chapter once. Defect class: duplicate copying of a read-only
source into the same fixture destination. A class sweep inside the granted
spec found one flat-docs loop and one canonical conventions loop, meeting in
this fixture; the planted reverse repair demonstrated that pair is actionable.
The change moves four added plus five removed lines and preserves all existing
seat assertions, all chapters and source permissions.

The persisted `duplicate-copy-drill` answer was read and acknowledged through
the normal run arm before coordinator preparation. One disposable detached
checkout at exact repaired source 273f1eed was used with its own installs,
builds, TMPDIR and outputs inside that checkout. This is a procedural workspace
authorization, not native machine ownership of a second root; the native
callback boundary still monitors the admitted lane and does not claim OS/read
isolation. No live authority was edited, no agent was spawned and no independent
reviewer material was read during that initial recovery. The later intentionally
supplied rejected report is the repair input disclosed below.

Fresh drill: remove only the flat loop's index exclusion, leaving assertions
unchanged. The existing case beginning `--take-seat installs the guard and
announces it` ran one body and failed at exit 1 with index-copy EACCES in
`seatFixture`, before `seatVerb`. Mutant SHA-256:
`543f697af2795f67627e5b3382f01db5a82b053e0a1da7778e213aae97cc47cd`.
Literal restore from 273f1eed, with staged/worktree restore, matched expected
SHA-256 `4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`
and an empty explicit per-path diff. The unchanged control reran one body,
passed one and exited 0. All thirteen conventions Markdown sources retained
0444 before and after. The disposable root's `local-drill-output` holds the
mutation diff, RED/restored logs and `duplicate-copy-drill-T-351-a6.json`.
Read on Juhos-MacBook-Pro.local at 2026-10-05T07:22:03Z: no owned drill
Node/Playwright/Vite job and no port 15351 listener remained. The coordinator
collected this disposable workspace and its evidence. The coordinator then
independently confirmed the literal restoration and absence of owned drill
jobs, preserved all ten output artifacts with checksums in the external recovery
directory `duplicate-copy-drill-artifacts-v1`, and removed only the disposable
checkout. No drill cleanup remains for the executor.

### Commands, gates and limits before the final grade

At repaired source 273f1eed, setup followed parser `npm ci` then
`npm run build`, app `npm ci` then `npm run build`, and tools/e2e `npm ci`:
all exited 0. The disposable checkout followed that same order with its own
dependencies; every step exited 0. End-to-end `npm run typecheck` exited 0.
The actual mutant/control commands used `npx playwright test
tests/push-guard.spec.ts --grep 'installs the guard and announces it'
--reporter=line` from the disposable tools/e2e package, with port 15351 and
the owned TMPDIR: respectively one failed/exit 1 and one passed/exit 0.

At 273f1eed, the mechanical merge forecast against main
85eb7584e517d379f36df55e83a07f70eb93686c exited 0 and returned tree
d324c857d8caef56a0f6ddaafcd9bc7d0c8284dd with six changed paths: five
granted source/spec paths plus this card. These notes add no seventh path.
`docs-gate.mjs` on that exact list exited 1 meaning FIRES, with no frontmatter
issues; parser, app and end-to-end readings are owed. The blessed owed-set
derivation for the admitted original base through 273f1eed exited 0 and owes
parser, app and nineteen end-to-end specs, with no unplaceable paths. The final
grade re-derives that set after the complete notes commit.

GRAPH REGEN's broad suffix trigger fires for the three changed test paths.
The actual `cargo run -p supertaskr-index -- index --check --root ../..`
from app/src-tauri at 273f1eed exited 0, CURRENT; tools are outside the graph
walk. Regeneration and generated capability/index reconciliation remain
integration work. BOOT GATE has no matching app source or manifest path;
METHOD EVAL GATE has no method path or added verdict-citation line. The executor
handoff rechecks these decisions against its final mechanical forecast. No
audit or boot campaign was introduced by this repair.

The original failed attempt is preserved: its grade at
baa54a7302bdac16159e0593c7afd27b798d5c9f had parser 469 and app 1171
passing, with end-to-end 1026 passing and three existing seat-fixture failures.
That grade is RED, despite the added bodies passing; no waiver, verdict or
history is rewritten. T-351-a6 owes its own one original-base-to-complete-source
grade after all notes/source writes, then its status-only verifying stamp.
That last commit moves only this card's status word and is the published
exemption that reruns no suite. Independent verification and integration remain
separate seats; the lane is left standing.

Corrections: the assembler's historical template model was superseded by the
owner's requested native Sol/xhigh seat. The implementation-only recovery
commit also carried a historical echo insertion; its card conflict was resolved
in favor of the reviewed recovery card, never by importing the old card.
Fresh dependencies/builds were absent as expected and were restored in order.
Two combined read-only diagnostics exited 1 at an unmatched chapter-heading
search and at the absent-dependency listing; another read stopped at the
empty permitted lsof result. Their bounded source/stat reads were completed
separately. The first criteria-echo patch missed a long exact context line and
edited nothing; the corrected patch was applied before any source import.
The ordinary cherry-pick initially exited 1 for the disclosed echo conflict,
then exact card restoration and cherry-pick continuation exited 0.

### In-fence follow-through

None outside the reviewed criteria. The read-only fixture repair is expressly
required by the recovery contract; no new acceptance criterion or live fence
expansion was made. No unrelated source, merge, push or foreign-lane write was
performed.

### Repair continuation after independent retained-origin rejection

The independent a7 review rejected C1/C3/C4 at candidate
910e174c2a729b5b38f37edb04318aa03c74c78b, despite its successful original-range
grade. Its interrupted, uncommitted report is intentional repair input. Two
fixture-owned reproductions coherently replace a valid acquired worker or a
valid committed card/domain origin, then recompute request/scope/identity; the
reader accepts both. The original candidate and grade remain preserved. No
blind attack set was opened.

Repair criteria echo, before implementation:

- [x] C1: retain the originally acquired committed inputs, worker bindings and bases independently of a coherently rewritten JSON request/scope/identity; continue allowing legitimate current HEAD advancement.
- [x] C3: check that original-acquisition commitment in every qualified reader and legacy/qualified acquisition under the existing transaction and reservation home; changed authority must refuse without partial publication.
- [x] C4: exact repeat and expected-content release must refuse replaced authority and retain it for reconciliation, while intact repeat/release remain effective.
- [ ] C5/C6: retain the read-only fixture repair and all existing assertions, add owned causal regressions, restore necessary property-site drills by hash, and grade the complete original-base-to-repaired-source range after complete notes.

The last box retains its pre-grade state in this complete notes commit. Its
implementation and five controls are completed below; the required original
range is graded only after this commit, with actual ref/count/exit in the
handoff. The later status-only stamp changes no evidence or outcome in these
notes. The prior GREEN range at 281924cd513c30d130692b7ae82998fefedece10
had parser 469, app 1171 and e2e 1029 passing, exits 0; that result did not
establish acceptance and is not the repaired range's grade.

The allowed repair input is the ceased a7's preserved
`phase2-interrupted-rejected-report-v1.md` and `repair-preparation-v1.md`
in the external T-351 recovery directory, plus the two ordinary regression
bodies in `/private/tmp/supertaskr-T-351-a7-scratch/logs/coherent-bodies-T-351.diff`
(SHA-256 `68fd002e47b7db252d6963c8de950358ecafec93ef782cf6375f5862ba12e5f3`).
No original blind attack set was opened. The persisted
`repair-origin-commitment` answer approved the helper/publication format
described above and its limited claim; it was read and acknowledged before
implementation. One content-addressed record in the existing transaction/home
adds no ownership table, service, second lock or native split admission.

### Original-acquisition repair, ordinary regressions and corrections

The minimal repair is committed at
c8e65fa0f8f5e25ba465aab832883fd8cc6c34ba. Every retained consumer reconstructs
the same immutable committed inputs and physical worker identities as before,
then verifies the actual publication name against that acquired canonical
scope. Legitimate worker HEAD advancement still uses the immutable base; it
does not rekey the authority. The three new owned regression bodies cover
coherent worker replacement, coherent committed card/domain replacement with
physical workers unchanged, and publication naming/version/old/malformed/
duplicate authority plus wrong expected release identity. Replacements refuse
through read, exact repeat, another qualified acquisition, legacy acquisition
and exact release; replacement bytes and the original authority are retained.
Literal fixture restoration proves intact read/repeat/release remain effective.

Two existing no-residue assertions now expect the returned publication's
basename rather than the old unanchored literal. They still require exactly
one reservation after the whole-set conflict, preserving their strength.
All other existing assertions and the read-only seat fixture repair remain.

Ordered repair command results: the first selector was incorrectly anchored
at the title start and reported `No tests found`; zero bodies means no
reproduction. Its undeclared ignored log caused the native hold. The coordinator
normally ceased/released the exact owner, preserved that log and the identical
tracked diff, relocated only the log and re-admitted the same native thread;
no implementation/test/card bytes were changed. The withheld command result
was never asserted. All subsequent logs, TMPDIR and npm cache use
`/private/tmp/supertaskr-T-351-a6-repair-scratch/{logs,tmp,npm-cache}`,
with only published gate/test outputs in the worker.

Corrected `npx playwright test tests/qualified-reservation.spec.ts --grep
'qualified original acquisition' --reporter=line` executed two bodies at the
pre-repair implementation and failed both, exit 1: the reader resolved rather
than rejected. The first repaired spec run executed twelve bodies, with eleven
passing and one fixture setup failure (exit 1): the helper tried to commit
unchanged records bytes while producing another valid request. Using a distinct
records domain fixed that fixture. The first typecheck exited 2 on the optional
regex capture; its checked-name capture annotation fixed the typing. The
corrected complete qualified spec executed twelve and passed twelve, exit 0
(43.4 seconds); `npm run typecheck` exited 0. These are ordinary iteration
checks on the source bytes subsequently committed at c8e65fa0, not a blessed
range grade. The external logs retain both the actual two-body reproduction
and the failed/repaired twelve-body iterations. Read-only diagnostics also
reported missing guessed runner/typecheck-log names; the actual runner and
available logs were located and read separately, with no source change.

### Self-drill block — original-acquisition repair at c8e65fa0

The `repair-origin-drill-ready` answer recorded actual coordinator preparation
of `/private/tmp/drill-T-351-a6-origin-repair` at exact clean source
c8e65fa0f8f5e25ba465aab832883fd8cc6c34ba. Its own parser/app/e2e installs and
parser/app builds exited 0. The answer was read and acknowledged before any
mutation. Only the five approved ordinary controls were run, with external
owned TMPDIR/log/cache and port 15351. Each mutation diff was read before the
case ran; every job completed before restoration. No platform refusal or
unexecuted selector occurred in these five controls.

| Drill | Single changed side and actual body | Mutant result | Literal restored result |
|---|---|---|---|
| 01 | Remove filename-origin comparison in run-record; coherent worker replacement body | 1 body, resolved reader, 1 failed, exit 1 | Run-record hash A; 1 passed, exit 0 |
| 02 | Remove filename-origin comparison in run-record; coherent committed-origin replacement body | 1 body, resolved reader, 1 failed, exit 1 | Run-record hash A; 1 passed, exit 0 |
| 03 | Remove duplicate-attempt guard in run-record; publication-format body | 1 body, duplicate accepted, 1 failed, exit 1 | Run-record hash A; 1 passed, exit 0 |
| 04 | Insert an owned residual reservation file immediately before the first changed no-residue assertion; complete-acquisition body | 1 body, unexpected residual filename, 1 failed, exit 1 | Qualified-spec hash B; 1 passed, exit 0 |
| 05 | Insert the same owned residual file before the second changed no-residue assertion; second-root/legacy-conflict body | 1 body, unexpected residual filename, 1 failed, exit 1 | Qualified-spec hash B; 1 passed, exit 0 |

Hash A before and after each literal staged/worktree restore:
`255e8862e25be55d9e79491c68c4f019ef0d7ccd39ecc84643fe50f91008298f`.
Hash B before and after each literal staged/worktree restore:
`cbd0b359bd5ba4806eeb618242e643af90226565c5b232ba8208bf33bba397c7`.
Each explicit source-to-path diff is empty after restoration. The three
new bodies have one property-site mutant each; both changed old assertions
have owned data controls that fail while those assertions remain unchanged.
This is necessary causal qualification, not an added security campaign.

The literal c8e65fa0 source also has qualified-reservation.mjs SHA-256
`ee937d2fa2164ed6daa38871796fa0a07ba672d682bbe7231b74ffdcbc8d8073`;
run-record.spec.ts and push-guard.spec.ts retain their historical hashes in
the earlier block. The repaired module/request versions and naming commitment
supersede the earlier version 1 API; historical mutant hashes remain at their
reported original refs, not new claims about changed files.

External evidence is `logs/origin-drill-01` through `origin-drill-05` with
mutation `.diff`, RED/restored `.log` and source/hash/count/exit `.json`, plus
`origin-drill-final-state-T-351-a6.json`, in the repair scratch. At
2026-10-05T13:39:24Z on Juhos-MacBook-Pro.local, the disposable remained exact
source c8e65fa0 with clean tracked state, all thirteen conventions Markdown
sources 0444, no owned Node/Vite/Playwright/Cargo job and no port 15351
listener. The persisted `repair-origin-artifact-reference` answer was read
and acknowledged. The coordinator independently read the decisive logs and
receipts, then preserved twenty-five reproduction/control artifacts
byte-for-byte in the external evidence archive at
`execution/repository-separation-2026-10-05/T-351/recovery/origin-repair-drill-artifacts-v1/`.
Its `MANIFEST.json` records every literal SHA-256 and size. This packet includes
the actual two-body pre-repair reproduction and twelve-body repaired controls.
The disposable remains restored and retained at its exact source; it was not
removed or independently collected as a second native writer. Preservation
does not replace final grading or fresh independent verification.

### Complete repaired range and gate handoff

The complete repaired notes/source commit is the next graded source, with
original admitted base 85eb7584e517d379f36df55e83a07f70eb93686c. The handoff
re-derives the mechanical merge forecast against actual main and the blessed
owed set for that exact full range after this notes commit. At c8e65fa0,
the original range still has exactly six paths: the five frozen source/spec
paths and this card. The notes add no seventh path or new trigger class.
DOCS GATE fires and owes parser/app/docs readers; GRAPH REGEN fires on the
three test suffixes, with generated reconciliation assigned to integration.
BOOT GATE has no matching app source/manifest; METHOD EVAL has no method path
or new verdict citation. These are owed-at-source decisions; the final report
supplies actual final-tree derivation and index-current check, and integration
must re-derive for its own merged tree. No merge or push was performed.

### Alias-repair criteria echo — before implementation

- [x] C1: normalize the accepted coordinator-root alias before constructing publication paths, preserving the canonical captured authority, physical identities, immutable acquired bases and legitimate HEAD advancement.
- [x] C2: retain every project-domain comparator, physical-worker ownership and topology/path guard; the accepted root alias names the same authority, not an independent project.
- [x] C3: normalize both the retained qualified scanner and the qualified acquisition's legacy scanner, preserving the existing transaction, atomic complete publication and regular-file/realpath checks; legitimate legacy overlap must report conflict in both orders.
- [x] C4: same-alias read, exact repeat and exact release must consume the acquired set; wrong expected release identity must preserve its bytes, and a genuinely absent release must remain false.
- [x] C5: preserve ordinary lifecycle, native/split refusal and the read-only conventions-copy repair, with no grant, manifest, authority or new API contract change.
- [ ] C6: carry the three supplied verdict/body commits in order, establish the body RED on unchanged implementation, repair and run actual controls; hash/mode/clock-restore the authorized scanner-normalization control and grade the full original range after complete notes. Preserve the separate incomplete qualification and platform refusal.

Requested implementation model/effort remains GPT-6.1 Sol/xhigh; observed
model/effort/usage is unknown. The coordinator's normal alias-repair-packet
answer was read and acknowledged before this echo or any repair work.

### Accepted coordinator alias remedy — implementation and preserved evidence

The normal `alias-repair-packet` answer authorizes this concrete repair and
the intentional appended verdict/body inputs. The three ceased a9 commits
were read completely and carried in order through ordinary cherry-picks:

| Preserved verifier commit | Corresponding lane commit |
|---|---|
| `38e1a86e60861817c52b5fdb20b013beb2d714a0` — qualification incomplete | `6c05f34df240ce96b53b53d90f8aeb39b383c7ed` |
| `9cb7ef4f484a268876483b6daadd846fadf7478b` — concrete alias rejection | `7eb814364f795033759264ec7c4aedcee20bab86` |
| `64ee0d13166ed014beef8d63cd8f847b2c969c26` — exact regression body | `9309e1110b8f158fd391955bc7cef30959a0007a` |

Each cherry-pick exited 0; no conflict or verifier entry was rewritten.
The full Verdicts section matches the supplied final verifier commit
byte-for-byte, and the supplied regression spec matches its literal bytes
before the implementation repair. The original six acceptance criteria and
five-path fence also match the admitted base. No blind attack set was opened.

At lane source 9309e111, unchanged candidate implementation plus the supplied
body `qualified accepted coordinator aliases preserve legacy conflicts
retained reads exact repeats and release` executed one body and failed,
exit 1: after successful canonical-root controls, the legacy-first alias
acquisition returned `RESERVATION_UNREADABLE` / `unknown reservation authority`
instead of `QUALIFIED_CONFLICT`. No zero-test or setup failure is counted as
that reproduction.

Implementation commit 95e4c67eabcbb40b1325207d320b294601cdd8a1 adds exactly
two statements, `root = realpathSync(root);`, at entry to
`qualifiedReservations` and `acquireQualifiedReservation`, before either
constructs publication paths. Class sweep: the two lexical publication-path
comparisons identified in the supplemental verdict; both now receive the
canonical physical authority root. This retains every regular-file/realpath,
committed receipt/origin, canonical captured-root equality, transaction,
conflict, topology, ownership and expected-release check. There is no new
authority home, service, table, lock or admission permission. The same accepted
alias reaches the same canonical set; an alias acquisition now returns the
canonical publication path. API shapes, request version 1, publication
version 2 and the prior original-acquisition commitment remain unchanged.

The first repaired thirteen-body spec run reported twelve passes and one
existing sequential-conflict body timeout (`Test timeout of 30000ms exceeded`),
exit 1, with a reported duration of 14.2 hours across overnight execution.
The new alias body passed. No functional assertion failure was reported for
the timed-out body, and no causal attribution or GREEN is claimed for that
run. At 2026-10-06T06:11:51Z all owned jobs and the lane listener were absent.
One unchanged full rerun, without changing timeouts, executed thirteen and
passed thirteen, exit 0, 56.0 seconds. Both the RED and rerun logs are retained.
These are ordinary iterations on the source bytes subsequently committed at
95e4c67e, not the final blessed original-range grade.

`npm run typecheck`, whole-tree `npm run lint:docs`, and
`cargo run -p supertaskr-index -- index --check --root ../..` exited 0 on
those repaired source bytes. The docs command found zero whole-tree findings;
it judges no diff or owed set. Graph is CURRENT. `npm run capabilities:check`
exited 1, STALE: committed 129443 bytes versus fresh generation 130997 bytes.
Regeneration remains the integrator's work, not an executor fence expansion.
The final complete notes/source commit receives its own required range
derivation and actual readings in the handoff.

The coordinator initially requested a fresh identity probe before rebinding
this already qualified continuation. That probe was refused before execution
by the execution-not-bound native hold; no shell, file read/edit or job ran
in that no-work turn. Its failed completion and actual cessation were normally
reconciled; normal continue followed immediately by exact retained-identity
binding preceded this repair's ask. No fresh probe result was invented and no
authority was edited by hand. Requested model/effort remains Sol/xhigh;
observed model/effort/usage remains unknown.

### Self-drill block — accepted alias availability at 95e4c67e

The actual `alias-repair-drill-ready` answer prepared the procedural disposable
`drill-T-351-a6-alias-repair`, detached and clean at exact source
95e4c67eabcbb40b1325207d320b294601cdd8a1. Its own parser/app/e2e installs
and parser/app builds exited 0. The answer was read and acknowledged before
use; the older origin-repair disposable was preserved unchanged. This is not
a second native writer or a hand-authored authority.

The assigned mutant block remains verbatim in the supplemental verdict below.
Only its single scanner normalization statement was removed; acquisition
normalization and every guard remained. The literal one-line landing diff
was read before the exact supplied alias body ran. It executed one body,
failed one, exit 1, at the same-alias retained read with
`QUALIFIED_AUTHORITY_UNREADABLE` / `not a regular reservation file`.
This is an accepted-root availability control, not a guard-disabling campaign.

| Actual control | RED | Literal restoration and positive rerun |
|---|---|---|
| Remove only `qualifiedReservations` root normalization; supplied alias body | 1 body, 1 failed, exit 1; retained read fails after both legacy-first controls | original SHA-256, mode 0644 and exact nanosecond atime/mtime restored; same 1 body passed, exit 0 |

Original and restored run-record SHA-256:
`cc0fff3311b2df439714dd4517b8c848c945c18c7bedb4537c215960259e626c`.
Exact restored atime: 1791267618901843924 ns; mtime:
1791267541191271267 ns. The explicit source-to-path diff is empty, and
tracked state is clean. Mode and clocks were checked again after the restored
positive body completed. The unchanged supplied spec SHA-256 is
`767cca838f289a42e851a010b4ff58526cd777a94bfd887d1439a6b7e7c528d8`.
All thirteen conventions Markdown sources remain 0444. At
2026-10-06T06:22:52Z on Juhos-MacBook-Pro.local, no owned
Node/Vite/Playwright/Cargo/Chromium job or port 15351 listener remained.
All control logs, cache, TMPDIR and Playwright outputs are in the supplied
external repair scratch, outside managed test-output TMPDIRs and arbitrary
worker runtime files.

The actual `alias-artifact-reference` answer was read and acknowledged.
The coordinator read the one-line mutation, decisive RED/restored logs and
restoration/cessation receipts, then preserved nineteen completed alias
artifacts (33969 bytes) byte-for-byte in the external evidence archive at
`execution/repository-separation-2026-10-05/T-351/recovery/alias-repair-artifacts-v1/`.
`MANIFEST.json` retains each literal SHA-256 and size. The packet includes
the unchanged-implementation regression RED, overnight timeout RED and
unchanged thirteen-body GREEN rerun. Preservation is not independent
qualification, native collection, merge or acceptance. The disposable remains
preserved at its restored exact source; no further control is launched.

The broader platform-refused safety-guard campaign was not repeated, widened,
waived or described as passed. Both preserved independent REJECTED entries
remain operative evidence: this concrete remedy does not decide independent
acceptance or close the separate standard-qualification landing hold.
The alias C6 echo retains its pre-grade state because the complete original
range is run after this complete notes commit; real final ref/spec/count/exit
is reported separately, followed only by the exempt status word stamp.

## Verdicts

### Recovery scope amendment — 2026-10-05

The candidate at baa54a7302bdac16159e0593c7afd27b798d5c9f passed its added bodies but its original-base owed grade was RED: parser 469 and app 1171 passed, e2e 1026 passed and 3 failed. The failures were all the existing seat fixture's second copy of the read-only conventions index, before invoking seat or reservation behavior. The repair is one additional spec path already in the owed range. It preserves the source mode and existing seat assertions. Native frozen writer scope is not live-expanded: collect the ceased failed attempt, preserve its refs and evidence, complete normal failed-attempt collection and reservation release before fresh admission, then dispatch a fresh admitted worker using the retained implementation as recovery material. Disclose that recovery commit to the fresh verifier reviewing the entire new-base-to-candidate diff. No verifier record or grade is rewritten.

### 2026-10-05 — REJECTED — gpt-6.1-sol@01a10c71-2ff4-7373-98dd-23f7aaab891f — qualification incomplete

Fresh native phase two, T-351-a9, canonical task
`/root/migration351_repair_phase2_clean`, judging original base
`85eb7584e517d379f36df55e83a07f70eb93686c` through candidate
`e11b10762952f74742e671688ef466786b155f37`. The candidate has no
functional failure demonstrated by this sitting. REJECTED records incomplete
qualification: the standard verifier rubric requires per-property drill proof,
and the broader safety-property source-drill campaign remains unexecuted.
The narrower permitted compatibility, legitimate-alias and duplicate-copy
controls do not establish that omitted proof. This is no finding that a
commanded but unexecuted check passed, and no earlier GREEN is acceptance.

Requested model/effort: GPT-6.1 Sol/xhigh. Native identity was measured first
as `01a10c71-2ff4-7373-98dd-23f7aaab891f`, then explicitly bound by the
normal coordinator before repository use. Observed model, effort and token
usage: unknown. Profile: `detached-verifier`; assigned bench:
`supertaskr-V-T-351-r3`. The frozen preparation digest and raw card digest
were validated privately, without displaying any raw card notes or nested
authority. `inspectNativeBench` independently returned clean and actual
independent check true at the candidate, including original-base ancestry.
This is a procedural reading boundary and supported repository safeguard;
it claims no OS isolation or authentication against arbitrary authority-home
replacement.

Frame: a fresh independent phase-two native spawn receiving a separately
sealed packet-only phase-one artifact, rather than a continuation of phase
one. Phase one disclosed that its packet supplied the active six-criterion
contract and operational extraction instructions, rather than the complete
historical role. The operational phase-two packet disclosed the prior
interrupted uncommitted rejection and two regression bodies shared with the
recovery executor. No prior reports/verdicts, executor conversation, raw
notes or commit messages were opened. Implementation and test diffs were
read before the permitted selective API delivery excerpt. That excerpt pins
request version 1, retained publication version 2, and the actual public
capture/acquire/read/release/path operations and limitations. It declares no
separate in-fence follow-through. The full six-path range was reviewed.

Sealed inputs, rehashed in this sitting:

- attack set: `sha256:4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`;
- ground: `sha256:b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`;
- raw card at the original base: `sha256:486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`.

The sealed ground is a base file/body census and preflight reading. It does
not contain the requested empirical platform matrix. Current-source
permission and fixture measurements below are candidate measurements,
never represented as pre-diff base ground.

| Acceptance criterion | Evidence at candidate e11b10762952f74742e671688ef466786b155f37 | Reading |
|---|---|---|
| 1 — complete committed request, measured roots/workers and immutable retained origins | `captureQualifiedInputs` uses existing committed capture, exact full revisions, complete registry and public `expandQualifiedFence`; `deriveQualifiedScope` validates strict request/role shape, measured worker identity, exact first HEAD/base and retained committed origins. Passing bodies: `qualified acquisition freezes complete committed receipts and mixed containment across actual worker checkouts`; `qualified validation refuses drift bases duplicate roles unsafe domains and alternate authority before publication`; `qualified colocated role bindings normalize one worker and refuse incompatible alias origins`; `qualified repeat read and exact release survive worker HEAD advancement but retain immutable identity`. Version and alias source controls below discriminate their narrow properties. | Functional evidence GREEN; wider safety-property drill proof unexecuted. |
| 2 — authoritative project comparison and unique physical worker ownership | `qualifiedSetsConflict` uses public `compareQualifiedFences` on captured integration-root identities and additionally claims each canonical physical worker once. Passing bodies: `qualified domains separate independent roles while colocated aliases and reused workers collide`, complete mixed-containment body and validation body covering unsafe domains, symlink, nested roots and shared common directory. Independent repositories and registered linked workers are created by each fixture. | Functional evidence GREEN; no claim of a complete worker-ownership/containment source kill set. |
| 3 — one transaction/home and one atomic complete publication, with legacy interaction and retained reconstruction | Source read confirms set discovery, retained validation, decisive complete conflict checks and `atomicJson` publication inside `withNativeTransaction`; legacy take/release share that transaction. Passing bodies: `qualified second-root and legacy conflicts in both orders leave no partial grant and preserve release ownership`; `qualified retained readers reconstruct narrowed scope changed binding malformed authority and committed receipt`; both `qualified original acquisition refuses coherent ...` bodies; `qualified publication commits scope in its name and refuses unanchored malformed and duplicate authority`. All retained consumers compare reconstruction against the digest in the original publication name. | Functional evidence GREEN; broader authority-integrity and legacy-enforcement source drills unexecuted. |
| 4 — exact repeat/release ownership, retained progress and no dead-holder theft | Passing repeat/read/release body, coherent-replacement bodies and publication body. Independent `crash-origin-T-351-a9.mjs` acquired in a real child that exited 77; the holder actually ceased, one complete two-repository set remained discoverable, a distinct-worker contender refused, wrong expected release preserved the exact file hash, and worker commits still allowed original read/repeat/exact release. Owned fixture was removed. | Constructive lifecycle evidence GREEN; no omitted guard-disabling drill claimed. |
| 5 — ordinary lifecycle retained, direct APIs exposed, native/split admission remains closed and seat fixture copying repaired | All owed run-record/native/adjacent bodies passed, including `ordinary reservation lifecycle loads no qualified capture and unknown assignment roots grant no permission`. Strict top-level and native assignment whitelists reject extra root/scope authority. Source review confirms no native consumer wiring, CLI bypass, hand-authored manifest, new daemon or dependency. The existing split CLI refusal remains. `seatFixture` skips the conventions index in the flat walk and copies the canonical set once; existing assertions are unchanged. Authorized duplicate-index-copy control below gives the exact setup EACCES and restored success with read-only sources. | Functional and targeted fixture evidence GREEN. |
| 6 — owned real fixtures, required unhappy cases, independent concurrency controls and literal restoration | All 12 qualified-reservation bodies passed in the original range. The two distinct children in the normal conflict case yield one winner; the separate serialization-disabled fixture coordinates both free-state checks before publication and yields two grants; the separate conflict-disabled fixture keeps serialization and admits sequential overlap. These are existing constructive candidate controls confined to owned repositories and child module views. Retained corruption/receipt/binding/owner/version cases, alias bases, disjoint scopes, cross-worktree collision and both legacy orders are covered by the named bodies. The current source hashes were compared literally against the candidate after the original run. Three additional permitted source controls below have actual RED, exact restoration and GREEN readings. | Specified functional controls GREEN. The standard rubric's wider per-property source-drill qualification is INCOMPLETE. |

Original-range command:
`node tools/e2e/scripts/gate-run.mjs --range 85eb7584e517d379f36df55e83a07f70eb93686c..e11b10762952f74742e671688ef466786b155f37`,
with assigned port 25351 and externally supplied temporary/log/cache homes.
Actual exit 0 at the candidate: parser 469 bodies GREEN, app 1171 GREEN,
e2e 1032 GREEN across the derived 19 spec files. No body was skipped and no
zero-test result was counted. `npm run typecheck` and the whole-tree
`npm run lint:docs` each exited 0. `npm run capabilities:check` exited 1:
STALE, committed 129443 bytes versus candidate generation 130889 bytes.
The conventions assign that regeneration to the integrator at merge; this
seat preserved the read-only generated file. Docs budget warnings remain
warnings. Rust, boot and method-eval legs were not in this range's owed set.

Current candidate source SHA-256 readings, each matched against literal
`git show` bytes at the candidate:

- `tools/e2e/scripts/qualified-reservation.mjs`: `ee937d2fa2164ed6daa38871796fa0a07ba672d682bbe7231b74ffdcbc8d8073`;
- `tools/e2e/scripts/run-record.mjs`: `255e8862e25be55d9e79491c68c4f019ef0d7ccd39ecc84643fe50f91008298f`;
- `tools/e2e/tests/qualified-reservation.spec.ts`: `cbd0b359bd5ba4806eeb618242e643af90226565c5b232ba8208bf33bba397c7`;
- `tools/e2e/tests/run-record.spec.ts`: `6311ea018f4eaf425dc0e1377ec89626548c38eb403218644cd089489cc88940`;
- `tools/e2e/tests/push-guard.spec.ts`: `4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`.

Targeted disposable-source controls were normally prepared by the
coordinator at the exact candidate, used only after original-range job
completion, and addressed as explicit test resources from the assigned
bench. Their driver/results/log stems are `duplicate-copy-T-351-a9`,
`version-T-351-a9` and `alias-T-351-a9` in the supplied external scratch.
The tests ran from the disposable `tools/e2e` package at port 25351, using
Playwright's existing config and exact named-body filters:

- Duplicate index copy: existing body `` `--take-seat` installs the guard and announces it, and BOTH seat verbs report a checkout without the hook as UNGUARDED ``. Baseline 1 passed/exit 0. The sole mutation removed `&& f !== "CONVENTIONS.md"` from the flat-copy filter; its literal `git diff` was retained and checked. Mutant 1 failed/exit 1 with actual `EACCES: permission denied, copyfile` on the conventions index at `seatFixture`, before seat CLI execution. Candidate source hash `4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`, mode and exact atime/mtime were restored; same body 1 passed/exit 0.
- Publication compatibility: sole literal change `QUALIFIED_RESERVATION_VERSION = 2` to `3`; exact landing diff read before running `qualified publication commits scope in its name and refuses unanchored malformed and duplicate authority`. Mutant 1 failed/exit 1, Expected 2 / Received 3. Exact candidate hash `ee937d2fa2164ed6daa38871796fa0a07ba672d682bbe7231b74ffdcbc8d8073`, mode and clocks restored; same body 1 passed/exit 0.
- Legitimate colocated alias support: sole omission of `prior.roles.push(binding.role)`; exact landing diff read before running `qualified colocated role bindings normalize one worker and refuse incompatible alias origins`. Mutant 1 failed/exit 1 with `qualified-worker-missing: records` during acquisition. Exact candidate hash `ee937d2fa2164ed6daa38871796fa0a07ba672d682bbe7231b74ffdcbc8d8073`, mode and clocks restored; same body 1 passed/exit 0.

These are three targeted source controls over selected bodies, not a
complete kill-set survey across the whole owning spec graph. Canonical
`conventionsFiles` measured 12 rule inputs; all 13 conventions Markdown
files including the chapter README remained mode 0444. No live conventions
source, native authority, grant or integration workspace was altered by
these controls. The owned-input crash fixture's original publication hash
was `6b8b0f6992309b6d805d1ab47aefe83ea797f2c8db4d7ad2da068cfc8c83d416`;
foreign release and competing acquisition preserved it literally.

Security sweep: new input paths were examined for argv injection, unsafe
paths, unchecked authority, secrets, defaults and dependency additions.
Git invocation uses argument arrays, strict schemas precede acquisition,
qualified scope is reconstructed from exact committed inputs, publication
names bind original scope, and unknown assignment extras grant no second
root. No new endpoint, dependency or exposed secret was found in this diff.
Architecture interface and adjacent lifecycle readings passed within the
original owed set. Whole authority-home replacement and OS compromise
remain outside the delivery's declared claim.

The preserved prior platform refusal says: "This content was flagged for
possible cybersecurity risk." It is a refusal, not a failing body or
successful drill. The native boundary explicitly prohibits repeating or
widening that previously refused campaign. The normal arm permitted only
this sitting's duplicate-copy and two compatibility/availability source
controls and expressly permitted no safety-guard-removal campaign. Thus
broader per-property source drill proof for retained authority integrity,
worker ownership/containment, legacy enforcement and the assignment guard
was not executed. The favorable functional evidence above cannot fill that
missing measurement. Qualification remains incomplete under the standard
rubric until the remaining proof is legitimately obtained or the owner
explicitly changes that requirement.

Corrections assigned: 0; committed correction bodies: 0; mutant blocks: 0.
No unmeasured implementation correction is assigned from this limitation.
No pack gap or additional suggested task was found. The withheld raw-note
boundary was resolved through the normal selective delivery excerpt; the
disposable-source constraint was resolved through normal preparation. All
three answers were acknowledged in the designated ask file. No merge or
push is part of this pass. This verdict write owes its own range's gates
at the committed tip; those results are reported by ref after the write.

### 2026-10-05 — REJECTED — gpt-6.1-sol@01a10c71-2ff4-7373-98dd-23f7aaab891f — accepted coordinator aliases lose retained authority

This supplements and preserves the preceding qualification-incomplete verdict committed at
38e1a86e60861817c52b5fdb20b013beb2d714a0. Further independent, constructive owned-input
checks found a concrete functional defect in candidate e11b10762952f74742e671688ef466786b155f37.
An absolute symlink alias of the same canonical coordinator product root is accepted by first
qualified acquisition, but that accepted root cannot subsequently read, exactly repeat or
exactly release its held set: each returns `QUALIFIED_AUTHORITY_UNREADABLE` / `not a regular
reservation file`. The canonical-root controls can perform all three operations on the same
held set. No unsafe scope or foreign authority is supplied.

The class sweep found both lexical-publication-path comparisons in `run-record.mjs`:
`qualifiedReservations` compares the qualified file's realpath to a pathname built from the
unnormalized API root; `acquireQualifiedReservation` independently does the same for a legacy
publication. A legitimate legacy reservation reached through the accepted alias is therefore
misclassified as `RESERVATION_UNREADABLE` / `unknown reservation authority`, while the canonical
root correctly reports `QUALIFIED_CONFLICT`. Scanner normalization alone does not repair this
second path. The normal arm's recorded q4/q5 answers confirm that this accepted-root
availability defect is inside the existing criterion and fence; they authorize only the
narrow prototype and regression described below.

| Frozen criterion | Supplemental evidence at candidate e11b10762952f74742e671688ef466786b155f37 | Judgment |
| --- | --- | --- |
| 1 — committed capture, canonical authority, measured bindings and retained origin | Existing twelve qualified bodies and original-range grade cover capture/base/receipt/alias origins. `authority-alias-T-351-a9.mjs` acquires the same canonical request through its physical authority alias; retained consumers then fail while canonical controls succeed. | Failed for accepted-root retained availability; previous property-qualification limits also remain. |
| 2 — authoritative domain comparator, topology and worker exclusivity | Existing collision/disjoint/colocated/topology bodies remained GREEN in the original range and the thirteen-body normalization prototype run. Normalization preserves domain derivation, root identity and all containment/comparator checks. | No new functional failure observed; prior independent-mutant limit remains. |
| 3 — one transaction, atomic complete publication, both legacy orders and retained validation | `authority-alias-legacy-T-351-a9.mjs` and the new body's legacy-first phase discriminate canonical `QUALIFIED_CONFLICT` from alias `RESERVATION_UNREADABLE`. Its qualified-first phase requires the legacy take through the same alias to recognize the held complete set. | Failed for accepted-root conflict classification/scanning; no partial or competing grant was observed. |
| 4 — exact idempotence, ownership-preserving release and crash discoverability | First alias acquisition succeeds, but same-alias read/repeat/release all fail in the constructive probe. New body pins exact repeat, foreign-identity preservation, exact release and absence after release; prototype GREEN. Existing independent crash/origin probe remains evidence at unchanged candidate. | Failed: accepted held authority cannot be consumed through the root that acquired it. |
| 5 — legacy lifecycle, qualified exports, split refusal and read-only seat fixture | Original range and first own-write range remain GREEN at their named refs. Existing regular-file/realpath, transaction and assignment/split guards are untouched by the prototype. Duplicate-index-copy isolated control and thirteen read-only conventions inputs remain as recorded in the preceding verdict. | No new lifecycle or fixture failure observed; prior qualification limit remains separate. |
| 6 — real owned fixtures, discriminating controls and literal restoration | New body owns two independent repositories/worktrees and one local root alias. Candidate RED, two-site normalization GREEN, single scanner-normalization removal RED, restored normalization GREEN, and exact candidate restoration plus twelve original-body rerun GREEN. | One real correction now pinned; broader unexecuted safety-guard campaign is still incomplete qualification. |

**Correction: preserve accepted coordinator-root aliases across both publication scanners.**
One correction, one correction body, one mutant block. Commit the body below in
`tools/e2e/tests/qualified-reservation.spec.ts` after this supplemental verdict commit.
Implementation repair remains the recovery executor's work; this bench retains candidate
implementation bytes. The safe prototype adds only `root = realpathSync(root);` at entry to
`qualifiedReservations` and `acquireQualifiedReservation`, before constructing their publication
paths. Both existing regular-file/realpath checks and all conflict, receipt, origin,
canonical captured-root equality, transaction, ownership and release checks remain intact.
The single block removes only the newly added scanner normalization from that prototype;
the regression's earlier legacy-first phase additionally pins the acquisition-path correction.

```mutant
correction: preserve accepted coordinator-root aliases across both publication scanners
file: tools/e2e/scripts/run-record.mjs
spec: tools/e2e/tests/qualified-reservation.spec.ts
body: qualified accepted coordinator aliases preserve legacy conflicts retained reads exact repeats and release
message: QUALIFIED_AUTHORITY_UNREADABLE
--- old
function qualifiedReservations(root) {
  root = realpathSync(root);
  const dir = path.join(root, RESERVATIONS_REL_PATH);
--- new
function qualifiedReservations(root) {
  const dir = path.join(root, RESERVATIONS_REL_PATH);
```

**Measured correction readings.** All commands began at the assigned verifier bench; the
normal disposable was the explicit test resource `/private/tmp/drill-T-351-a9`, HEAD
`e11b10762952f74742e671688ef466786b155f37`. External driver
`/private/tmp/supertaskr-T-351-a9-scratch/logs/root-alias-control-T-351-a9.mjs` invokes
`node /private/tmp/drill-T-351-a9/tools/e2e/node_modules/@playwright/test/cli.js test tests/qualified-reservation.spec.ts --grep "qualified accepted coordinator aliases preserve legacy conflicts retained reads exact repeats and release"`
with cwd `/private/tmp/drill-T-351-a9/tools/e2e` and that disposable's absolute CLI path.
The full runs omit `--grep`. TMPDIR and npm cache are the supplied external scratch; port25351.

- Exact candidate implementation plus new body: one executed body, one failure, exit1,
  `RESERVATION_UNREADABLE` from alias legacy-first acquisition after canonical controls.
- Two-site normalization plus new body: one executed body passed, exit0; full qualified spec
  thirteen bodies passed, exit0, measured at candidate plus the retained literal prototype/body diffs.
- Remove only prototype scanner normalization: one executed body failed, exit1,
  `QUALIFIED_AUTHORITY_UNREADABLE` / `not a regular reservation file` on same-alias retained read.
- Restore that normalization: same body passed, exit0.
- Restore both implementation and disposable spec to literal candidate bytes: source SHA256
  `255e8862e25be55d9e79491c68c4f019ef0d7ccd39ecc84643fe50f91008298f`, spec SHA256
  `cbd0b359bd5ba4806eeb618242e643af90226565c5b232ba8208bf33bba397c7`;
  modes and exact nanosecond access/modification clocks checked and restored. Disposable tracked
  state clean; all thirteen conventions Markdown inputs0444. Twelve original qualified bodies
  passed, exit0, at restored candidate. Every owned fixture was removed and each child joined.

The external logs use `root-alias-{candidate,prototype,prototype-full,mutant,prototype-restored,candidate-restored-full}-T-351-a9.log`;
separate driver logs record exact exits, nonzero counts and fixture cleanup. Landing diffs are
`root-alias-{body-landing,prototype-landing,mutant-landing}-T-351-a9.diff`; the exact one-statement
prototype-to-mutant diff is `root-alias-mutant-from-prototype-T-351-a9.diff`. All are under the
supplied scratch logs directory. No zero-test or setup error is presented as discrimination.

**Grades and limits.** The original exact base-to-candidate grade independently passed
parser469/app1171/e2e1032 across nineteen owed specs, exit0. The first verdict's own-write
range `e11b10762952f74742e671688ef466786b155f37..38e1a86e60861817c52b5fdb20b013beb2d714a0`
passed parser469/app1171/e2e778 across twelve owed specs, exit0; whole-tree docs and graph checks
also exited0 there. These counts name those refs, not the later correction tip. After the
ordered verdict/body commits, run `node tools/e2e/scripts/gate-run.mjs --range e11b10762952f74742e671688ef466786b155f37..HEAD`,
whole-tree docs, e2e typecheck and mandatory graph check at the actual final HEAD; report their
actual exits/counts and cessation through native completion. The newly committed regression
is expected to remain RED until the executor carries the implementation correction. Do not
silently normalize this verifier bench or skip the correction to make its owed grade GREEN.

The earlier broader safety-guard fault-injection campaign remains unexecuted under the
preserved platform refusal and this fresh brief's boundary. The exact refusal remains at
`verification-r3/previous-platform-refusal-v1.txt` in the evidence packet. No guard-disabling
campaign was repeated or waived by the q4/q5 availability answers. Thus the functional
correction and incomplete standard qualification are independent reasons this candidate is
REJECTED. No new dispatch fault or pack gap was found.

**Frame and seal.** This remains the fresh phase-two native verifier, canonical task
`/root/migration351_repair_phase2_clean`, explicitly bound to native ID
`01a10c71-2ff4-7373-98dd-23f7aaab891f`; requested GPT-6.1 Sol/xhigh, observed model/effort/usage
unknown. Diff preceded the permitted API excerpt. Raw card notes, prior foreign judgments,
executor conversation and commit messages remained unread. The ground is the disclosed
scripted base census/preflight, not an independently measured empirical body matrix.
The previously validated seals are unchanged:
attack SHA256 `4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`;
ground SHA256 `b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`;
raw frozen base-card SHA256 `486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`.
No merge or push. Final cessation and real final commit are collected after the own-write jobs.


### 2026-10-22 — REJECTED — gpt-6.1-sol@01a162d0-6207-7ae3-a35d-cf9868c15326 — T-351-a12

Candidate: `a9a651257ab01906481eec5548a7c7c172318d9e`; original base:
`85eb7584e517d379f36df55e83a07f70eb93686c`. All candidate figures below
name that candidate, not this later verdict commit. The candidate's owed
range is GREEN, but an independently constructed namespace compatibility
case reproduces a functional failure. Acceptance is refused.

**Finding: persisted transaction metadata blocks qualified acquisition.**
Current authority main `e8aabf062b289c2cd1a460a9a3c1413f69262125` reserves
`native-transaction-faults` in `nativeTransactionFaultPath` and
`native-transaction-recoveries` in `nativeRecoveryIntentPath`, beneath the
existing reservations home. The candidate's qualified acquisition enumerates
that home and excludes neither directory. An owned real-repository fixture
acquires/releases normally, plants both metadata directories, proves legacy
acquisition/release still works, then attempts the same qualified request.
Expected: acquire the complete set while preserving transaction metadata.
Actual: `RESERVATION_UNREADABLE`, naming `native-transaction-faults` and
`unknown reservation authority`, before publication. This is an exercised
compatibility defect, not an inference from inspecting current main.

Reproduce after the correction-body commit with the repository's Playwright
runner, config `tools/e2e/playwright.config.ts`, spec
`tools/e2e/tests/qualified-reservation.spec.ts`, grep
`preserves persisted transaction`, port `25351`. The exact body is named in
the mutant block below. `namespace-red-T-351.log` retains the failure.
A temporary in-fence prototype adding only the two reserved metadata names
passes the same body, including its unknown-authority refusal and metadata
preservation assertions (`namespace-green-T-351.log`). The prototype was
removed: restored `run-record.mjs` SHA256 is
`cc0fff3311b2df439714dd4517b8c848c945c18c7bedb4537c215960259e626c`, equal
to the candidate blob. No implementation repair is committed by this seat.
The regression body is committed after this verdict, under the role's
correction protocol. The sweep covered reservation-home enumeration and the
current transaction fault/recovery path producers; full integrated-source
qualification remains the coordinator's separate obligation.

| Criterion | Evidence and decision at the candidate |
|---|---|
| C1: committed inputs, authority, revisions, physical workers and immutable origin | Qualified acquisition/validation, colocated role normalization, advanced-HEAD retained consumers, coherent-origin replacement and accepted coordinator-alias bodies pass. The sanitized delivery declaration supplied through this attempt's ask pins request version 1, retained version 2, strict schemas and public operations; those declarations match the reviewed source. No caller-expanded paths grant scope. |
| C2: authoritative project domains, topology and unique worker ownership | Independent versus colocated repositories, mixed containment, cross-checkout collision, disjoint scopes, reused worker, unsafe paths, symlink, shared-common-directory and nested-root bodies pass using real Git repositories/worktrees. |
| C3: complete transaction/publication, legacy coexistence and reconstruction | Existing second-root/no-residue, both legacy acquisition orders, malformed/narrowed/coherent-replacement authority and cold legacy-consumer bodies pass. **FAIL:** the added owned namespace case rejects valid acquisition once current transaction metadata directories exist. The existing transaction and recovery namespace must survive integration. |
| C4: exact repeat, exact release, retained origin and dead-holder behavior | Repeat/read/release after worker commits, changed/foreign identity refusal, coherent replacement preservation and child-process controls pass. A completed child leaves discoverable retained authority and a conflicting sequential child still refuses; holder death grants no takeover. |
| C5: ordinary lifecycle, admission boundary and conventions fixtures | Original-range run-record/native/CLI consumers pass; unknown assignment-root fields refuse; public operations remain data APIs. The unchanged seat cases pass against an owned read-only source copy, with assertions preserved. No CLI escape, manifest or daemon is added. |
| C6: real fixtures and discriminating controls | Targeted run: 14/14 GREEN, including the separate serialization-disabled coordinated unsafe interleaving and conflict-disabled sequential-admission controls. Read-only seat control: 3/3 GREEN; isolated duplicate-index mutation: 1/1 RED with actual index-copy EACCES during `seatFixture`, before `seatVerb`; literal restoration: 3/3 GREEN. The original broad guard-removal coverage limitation remains expressly retained under the owner-approved T-351-only exception; no functional failure is waived. |

**Original-range grade.** The blessed command
`node tools/e2e/scripts/gate-run.mjs e2e --range 85eb7584e517d379f36df55e83a07f70eb93686c..a9a651257ab01906481eec5548a7c7c172318d9e`
returned exit 0: parser 469 bodies GREEN, app 1171 GREEN, e2e 1033 GREEN
over its derived 19 spec files. `original-range-T-351.log` records the
complete derivation and exact-ref verdicts. This is distinct from the added
correction-body RED/GREEN and the later own-write grade.

**Read-only control and restoration.** This detached bench does not have the
legacy lane-lock permission layer; its conventions sources were mode 0644.
An owned exported source copy of the candidate supplied the fixture control,
with the conventions index and chapter files kept at 0444 throughout. The
canonical `conventionsFiles` set contains 12 sources at the candidate; the
flat walk plus canonical walk copies each exactly once. The isolated mutant
copies the index twice and produces the required EACCES. The source copy's
spec restored SHA256 is
`4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`;
all read-only source hashes and modes match their pre-drill manifest.
Live source permissions and existing assertions were not changed.
A source-copy setup attempt failed before tests because the local Python
lacked `tarfile.extractall(filter=...)`; the next setup omitted that optional
argument. The initial Playwright copy setup then found no tests because the
copied parser lacked its YAML dependency link. Both setup failures are
retained and are not grades; the subsequent successful baseline, mutation
and restoration runs are separate logs.

**Seals and actual frame.** Original attack SHA256:
`4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`;
original-base ground:
`b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`;
base card:
`486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`.
Re-entry attack:
`4ebe6be51af393056342993d3fb5fd923f4bfe9841756dc4d2755d842866d793`;
re-entry ground:
`187941cf1dffe6d96e1e6a648ad8fa42bc65327a882a3f62ed48602b44866fa5`;
re-entry actual-frame record:
`68da86e7c76efb490e7a9595adcff03eeb86f1f579a9ce590ebfc8294dcb6bf7`.
All seals match. The relative card seal was evaluated at its original base,
not against the candidate's later task file. The re-entry ground was taken
at `e11b10762952f74742e671688ef466786b155f37`, before alias repair;
it is not original-base ground. Both attacks were evaluated. The original
phase-one frame supplied conduct extraction and six criteria; the re-entry
frame also disclosed its absent standing/full-role packet. Those limitations
are retained. The retained-origin regression bodies and accepted coordinator
alias body were shared repair inputs to the executor, so their presence is
not claimed as fresh independent discovery.

This was a fresh independent phase-two native session, canonical task
`/root/t351_phase2_20261022`, profile `detached-verifier`. The exact initial
identity probe returned `01a162d0-6207-7ae3-a35d-cf9868c15326`, followed by
explicit coordinator binding before repository tools. Requested model/effort:
GPT-6.1 Sol/xhigh; observed model and usage: unknown. Raw preparation authority
was checked privately: digest, frozen base-card bytes, endpoints, resource
and executor identity, without displaying nested authority or private text.
The full implementation diff preceded delivery declarations. A batched
read-only call caused a native transaction-busy hold; the attempted
implementation-notes read returned no contents, and an attempted ask append
was blocked. The attempt ceased as directed, then resumed only after the
coordinator reported checked public recovery, normal continuation and exact
rebind. Commands were serialized thereafter. The failed history and unknown
callback evidence remain preserved. Later delivery metadata arrived only as
a sanitized declaration through this attempt's ask, with acknowledgement.
No raw executor reasoning, previous verdicts or commit messages oriented
this pass. This is a procedural read boundary, not OS/read isolation.

**Security and adjacent interfaces.** Reviewed new request, receipt, path,
Git invocation, retained-record, release and assignment inputs. Git uses argv
rather than shell interpolation; committed scope and physical measurements
remain authoritative; malformed retained authority refuses; native admission
is separate. No dependency, secret, network endpoint, CLI bypass or daemon
was added. Architecture's files/receipts/physical-root interface remains the
intended model; the namespace incompatibility above is the concrete defect.
No additional security finding or pack gap was identified. The coordinator's
sanitized declaration reports no extra in-fence follow-through outside the
reviewed criteria; source inspection agrees. No helper was spawned.

**Generated currency, checked separately from the functional range.** The
candidate-owned source copy at `a9a651257ab01906481eec5548a7c7c172318d9e`
returns exit 1 from `capabilities.mjs --check`: committed census 129443 bytes,
fresh census 130997 bytes. At the correction-body commit
`86e3a8212e694fbfee6dfa3897517f63d5f4e93b`, the same check returns exit 1
with fresh census 131114 bytes. These are source-generation failures, not an
environment failure or a functional waiver. Regeneration is required at
integration; the generated documents are outside this frozen fence and were
not edited. This regeneration action has no new property to pin: the existing
currency checker already detects it, so it carries no additional body or
mutant block.

Correction count: 2 (the independently graded compatibility property and the
existing-check regeneration action); committed property-body count: 1;
mutant block count: 1. The block removes the demonstrated prototype property
and must be re-drilled after the corresponding implementation repair.

```mutant
correction: Preserve persisted transaction metadata during qualified acquisition
file: tools/e2e/scripts/run-record.mjs
spec: tools/e2e/tests/qualified-reservation.spec.ts
body: qualified acquisition preserves persisted transaction fault and recovery metadata while refusing unknown authority
message: RESERVATION_UNREADABLE
--- old
      if ([".native-transaction.lock", ".native-transaction.lock.recovery", "native-transaction-refusals", "native-transaction-faults", "native-transaction-recoveries"].includes(name)) continue;
--- new
      if ([".native-transaction.lock", ".native-transaction.lock.recovery", "native-transaction-refusals"].includes(name)) continue;
```

The verdict and correction-body commits still owe their independent write-range
grade. Final exact refs, that grade and actual owned-job cessation are reported
through native output for independent collection. This local verdict makes
no push or CI claim.
