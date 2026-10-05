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

## Verdicts

### Recovery scope amendment — 2026-10-05

The candidate at baa54a7302bdac16159e0593c7afd27b798d5c9f passed its added bodies but its original-base owed grade was RED: parser 469 and app 1171 passed, e2e 1026 passed and 3 failed. The failures were all the existing seat fixture's second copy of the read-only conventions index, before invoking seat or reservation behavior. The repair is one additional spec path already in the owed range. It preserves the source mode and existing seat assertions. Native frozen writer scope is not live-expanded: collect the ceased failed attempt, preserve its refs and evidence, complete normal failed-attempt collection and reservation release before fresh admission, then dispatch a fresh admitted worker using the retained implementation as recovery material. Disclose that recovery commit to the fresh verifier reviewing the entire new-base-to-candidate diff. No verifier record or grade is rewritten.
