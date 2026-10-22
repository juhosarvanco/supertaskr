---
id: T-351
title: Reserve complete repository-qualified writer sets through the existing run-record transaction
feature: F-04
milestone: 4
priority: 1
size: M
tier: standard
status: done
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: [T-349, T-350]
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/qualified-reservation.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/qualified-reservation.spec.ts, tools/e2e/tests/push-guard.spec.ts, tools/e2e/scripts/native-codex.mjs]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
built_by: gpt-6.1-sol@xhigh
verified_by: gpt-6.1-sol@xhigh
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

### Namespace compatibility repair criteria echo — T-351-a13

Before implementation, at verifier-feedback source
566858522c365d3e352d8891b919b7b3841e8dc4:

- [ ] C1: preserve committed capture, canonical authority and measured worker identities, strict requests, immutable acquired origins and legitimate HEAD advancement.
- [ ] C2: preserve authoritative project-domain comparison, independent repository separation, physical worker ownership and topology/path refusals.
- [ ] C3: recognize only the published native transaction fault/recovery namespaces while preserving complete conflict checks, atomic publication, legacy coexistence and retained reconstruction in the existing transaction/home.
- [ ] C4: preserve exact idempotent repeats, expected-content owned release and discoverable retained sets; unknown authority must still refuse without deletion or a partial grant.
- [ ] C5: preserve ordinary lifecycle, library-only qualified APIs, native/split admission refusal and the existing read-only conventions-copy correction.
- [ ] C6: reproduce the already committed namespace body RED on unchanged source, show the narrow correction GREEN including unknown-authority preservation, retain hash-restored property evidence and required focused controls, then grade the complete original range after all source/notes commits.

The coordinator's current-source sweep lead was reproduced through public
`readAssignment` and `startRun`: the resource-free consultation with work id
`reservations` creates a real `reservations-a1.json` in the shared home,
and qualified acquisition misclassifies it as legacy authority. The actual
`namespace-work-record-scope` answer was read and acknowledged before its
production repair. This is required C3/C5 compatibility under the existing
six criteria, not an incidental follow-through or an additional criterion.
Recognize only a canonical, intact resource-free work record; retain strict
malformed, changed-owner, writer/resource and actual legacy-conflict refusals.

Original cumulative origin remains
85eb7584e517d379f36df55e83a07f70eb93686c; original retained candidate
remains a9a651257ab01906481eec5548a7c7c172318d9e. This replacement starts
at the actual collected verifier feedback above. Prior verdicts and the
assigned regression body are retained unchanged; no independent attack
artifact or verifier workspace is an input to this repair.

### Namespace compatibility delivery — T-351-a13

The source corrections are committed at
877cdf33 (published transaction metadata) and
a167a6f1d0b4bc5671f417d37fb6e3751f4d0c5b (resource-free public work records).
This complete notes commit is the next graded source; its actual ref,
original-range counts/exits and final job cessation are reported in the
native handoff after the run, rather than preclaimed here.

`acquireQualifiedReservation` now recognizes the existing transaction's
`native-transaction-faults` and `native-transaction-recoveries` namespaces.
The same scanner also recognizes a resource-free work record only at its
exact canonical `reservations-aN.json` path. It uses `readRecord`'s existing
version check and requires matching attempt/assignment ownership, known
state, intact assignment digest and fields, false writer, null resource
and no reservation claim. Every other entry still undergoes the existing
legacy reservation validation. The transaction, canonical regular-file and
realpath checks, complete qualified conflict/publication/reconstruction,
expected-content release and actual legacy ownership checks remain active.
Request version 1, publication version 2 and all public API shapes stay as
declared above. No new authority table, lock, native admission or split
permission is introduced.

Class sweep: reservation-home enumeration in `qualifiedReservations` and
the acquisition legacy scanner, plus current-main committed producers
`nativeTransactionFaultPath`, `nativeRecoveryIntentPath`, `allRecords` and
`nativeRecordFiles`, at e8aabf062b289c2cd1a460a9a3c1413f69262125. The two
directory namespaces and real public resource-free record were exercised;
the qualified scanner's existing qualified-prefix selection needed no
change. The initial brief's assigned directory body was already committed
and was not applied again. The additional work-record body implements the
same required C3/C5 compatibility property, as ruled in the acknowledged
scope answer, not an incidental follow-through. At a167a6f1 relative to
feedback 56685852, source changes are 14 added/1 removed lines and spec
changes are 51 added/1 removed lines; the full repair is not claimed to be
under twenty moved lines. There is no separate in-fence follow-through.

| Criterion | Implementation and actual pre-grade controls |
|---|---|
| C1 | Strict captured inputs, canonical authority, measured identities and immutable origins are retained; the complete qualified spec passes at the repaired source. |
| C2 | Existing independent/colocated domains, cross-worker ownership, mixed containment and unsafe topology/path cases remain in that passing spec. |
| C3 | Both namespace compatibility cases now acquire/read/repeat/release, preserve nonwriter metadata bytes and retain real legacy conflicts in both orders; complete publication/reconstruction remains unchanged. |
| C4 | Existing exact-repeat, retained-HEAD, foreign release, malformed/coherent replacement and acquired-origin cases pass; new malformed work records retain their bytes and leave no qualified residue. |
| C5 | Ordinary lifecycle remains covered by the earlier scoped run and the final range owed below; read-only seat fixtures pass with unchanged assertions and source modes. Qualified/native/split admission boundaries are unchanged. |
| C6 | Real public start reproduction, final fifteen-body qualified controls, both constructive concurrency controls and three isolated RED/restore/GREEN controls are completed below; the complete committed range remains to be graded after these notes. |

### Self-drill block — namespace compatibility at a167a6f1

The actual `namespace-drill-resource` and `namespace-work-record-scope`
answers were read and acknowledged before their isolated writes. The two
owned scratch source copies were literal committed exports of full ref
a167a6f1d0b4bc5671f417d37fb6e3751f4d0c5b, with 1722 regular source files
each. No live runtime authority or source implementation symlink was
copied; only dependency/build outputs were linked. These are owned test
fixtures without a source Git HEAD, not native worker resources. Each test
creates and removes its own independent Git histories. All thirteen copied
conventions Markdown sources remain 0444. Primary source permissions were
not changed.

| Property-site control | Actual RED | Literal restoration and positive rerun |
|---|---|---|
| Remove only the two newly recognized transaction metadata names; supplied persisted-transaction body | 1 executed, 1 failed, exit 1; `RESERVATION_UNREADABLE` at `native-transaction-faults` | Run-record hash A, exported mode 0664 and exact atime/mtime restored; 1 passed, exit 0 |
| Remove only resource-free work-record recognition; new public work-record body | 1 executed, 1 failed, exit 1; `RESERVATION_UNREADABLE` at `reservations-a1.json` | Same hash A, mode and clocks restored; 1 passed, exit 0 |
| Reintroduce only the duplicate conventions-index copy; existing seat-install body | 1 executed, 1 failed, exit 1; actual index-copy `EACCES` in `seatFixture`, before `seatVerb` | Push-guard spec hash B, mode and clocks restored; all 3 existing seat bodies passed, exit 0 |

Hash A: `dd57385e7ff097dd37817f5cc0bb7bae095a8b483be0f2ecf9cca8257bad23ce`.
Hash B: `4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`.
Qualified spec hash: `01eb867efe3d876be475394d46da5575d5ca243e372a955bfe54e357c164c09a`.
Both compatibility bodies passed together at fixture baseline (2 bodies,
exit 0); the read-only seat baseline passed 3 bodies, exit 0. Literal
one-sided mutation diffs were read before every RED. Final restoration
checked every exported source hash and mode, then restored controlled
nanosecond timestamps after the positive runs. The primary remained clean.
External `logs/fixture-final-restoration-T-351.json` records that check at
2026-10-22T10:12:57Z, alongside per-control commands, exits, counts, mutation
diffs and restoration receipts. Every test process completed before the
next source/fixture command. No wider source-drill campaign was resumed;
the existing T-351-only owner coverage exception and historical limitations
remain preserved, and no prior rejection is rewritten.

### Ordered readings and final qualification handoff — T-351-a13

The identity probe returned native thread
01a16305-90a8-7b91-a3eb-cf3d22ac9495, canonical task
`/root/t351_namespace_repair_20261022`; explicit binding preceded repository
tools. Requested profile is GPT-6.1 Sol/xhigh; observed model/usage is
unknown. Commands and callbacks were serial, with yielded sessions polled
to completion; no helper, verifier workspace or attack artifact was used.
Parser/app/e2e dependencies and built prerequisites already existed and
were rechecked; no dependency install or package manifest changed.

Ordered functional commands from tools/e2e, all with assigned port 15351
and external temporary/output homes:

- `npx playwright test tests/qualified-reservation.spec.ts --grep 'preserves persisted transaction' --reporter=line`: unchanged feedback implementation, 1 failed, exit 1; corrected source later committed at 877cdf33, 1 passed, exit 0.
- `npx playwright test tests/qualified-reservation.spec.ts tests/run-record.spec.ts --reporter=line`: source later committed at 877cdf33, 59 passed, exit 0. This predates the additional work-record repair and is not claimed as that repair's grade.
- `npx playwright test tests/qualified-reservation.spec.ts --grep 'public read-only work records' --reporter=line`: 877cdf33 implementation plus the new public-start body, 1 failed, exit 1, `invalid legacy reservation`.
- `npm run typecheck`: new work-record body before production correction, exit 0.
- `npx playwright test tests/qualified-reservation.spec.ts --reporter=line`: repaired runtime source subsequently committed at a167a6f1, 15 passed, exit 0, including both required constructive concurrency controls.
- `npm run typecheck`: first repaired-source reading exited 2 for a typed indexed-field access; a type-only record-map annotation fixed it, and the corrected reading exited 0 at the source committed as a167a6f1. No failed reading is replaced by its rerun.
- The three isolated controls above invoke the copied repository's Playwright CLI with its own config; their exact argv, body counts and exits are retained in the external per-control receipts. All setup, mutations and literal restorations exited 0; deliberate RED test runs each exited 1.

Every mandatory graph reading so far returned CURRENT/exit 0; tools are
outside the graph walk. At a167a6f1, whole-tree `npm run lint:docs` exited 0
with zero findings (no diff judged). `npm run capabilities:check` exited 1,
STALE: committed 129443 bytes versus fresh 131244 bytes. This is a source
currency finding, not an environment failure; generated reconciliation
remains integration work outside the frozen fence.

At a167a6f1 the blessed `--owed-set --range` derivations both exited 0:
original origin 85eb7584e517d379f36df55e83a07f70eb93686c has six changed
paths, replacement feedback 566858522c365d3e352d8891b919b7b3841e8dc4 has
three. Both derive whole parser/app plus the same nineteen e2e specs, with
no unplaceable path. The final original-range run will re-derive and grade
the complete notes/source commit once; its unchanged final inputs and
selected set can cover the identical replacement owed set. That is one
measurement of both obligations, not two alleged runs.

The mechanical merge forecast against current main
e8aabf062b289c2cd1a460a9a3c1413f69262125 exited 1 with an actual tree and
one content conflict in `tools/e2e/tests/push-guard.spec.ts`; run-record
auto-merged. No conflict was resolved locally. Therefore no clean final
merge-diff gate decision is claimed: the integrator must re-derive after
reconciliation. Source-range docs-gate on the actual six original paths
exited 1 meaning FIRES, owing parser/app/e2e; source scope has no boot or
method-eval trigger, and the broad graph trigger matches the test suffixes.
These are owed-at-source readings. The notes add no new path or trigger
class; final source derivations and graph/docs/type readings are reported
after this commit. No merge, push or CI claim is made.

The inherited card is already `verifying`; it stays so. There is no new
status-only stamp commit or post-grade content change to exempt. Prior
verdicts remain intact and fresh independent acceptance is still required.

### Intact writer compatibility repair criteria echo — T-351-a15

Before implementation, at replacement base
a50dfa8faedffbb02aaf4c26fd2209f4900799d8:

- [ ] C1: preserve strict committed capture, exact receipts/revisions, measured project and worker identities, immutable acquired bases and legitimate retained HEAD advancement.
- [ ] C2: preserve authoritative project-domain comparison, independent repositories, colocated aliases, physical worker ownership and unsafe topology/path refusal.
- [ ] C3: recognize canonical intact active writers only with matching actual legacy ownership, and normal terminal released history, while retaining atomic complete acquisition, retained reconstruction and legacy conflicts in both orders inside the existing transaction/home.
- [ ] C4: preserve exact idempotent repeats and expected-content owned release; changed, malformed, foreign and unknown authority must refuse and remain retained without partial publication.
- [ ] C5: preserve the public unqualified lifecycle and resource-free records, library-only qualified operations, native/split refusal and the read-only conventions-copy repair.
- [ ] C6: reproduce the committed writer body RED, apply the exact proved correction GREEN, retain the restrictive property-site and namespace/duplicate-copy RED/hash-restore/GREEN controls, then grade the complete original cumulative range after every source and notes commit.

The newest committed verdict and exact proved prototype are shared repair
inputs, not a fresh independent attack. Every prior verdict and genuine
failure remains intact. The existing T-351-only limited qualification
exception preserves its explicit coverage limitation and waives no
functional failure. This size-M executor leaves independent verification
and integration to their separate seats.

### Intact writer compatibility delivery — T-351-a15

The production correction is committed at
cb1dec0f40bf2f3799b4324b2a96f8d455441947, based on
a50dfa8faedffbb02aaf4c26fd2209f4900799d8. Its run-record SHA-256 is
`34cae83bfcde48740d1cdf07558ced59ce2c8400055fb159b413f34b13bff4f7`,
identical to the exact proved prototype preserved at
8d7483dfdaded79d73da72b645045d8d6dc44581. The committed correction body
is unchanged: qualified-spec SHA-256
`8ebcf2b03a9bdcfdd8892d54bab84787963b545a462f0b5a8ef08a8f58759b1a`.
The latest ae419c2baa5447bd1485ed0ad0481d3e17b3365f rejection and all
earlier verdicts remain append-only. No new test body or assertion was
added, duplicated or changed in this repair.

The canonical shared-home work record now validates common record and
assignment ownership, known state, boolean writer, complete allowed
assignment fields and intact assignment digest. A resource-free record
still requires no resource or reservation claim. An active writer must
name the absolute assignment resource and canonical reservation file,
with a readable acquisition instant and actual matching legacy version,
attempt, work, resource, role and acquisition time, without a qualified
kind. Released history must carry a readable release instant and a
terminal state. Its actual reservation is still independently enumerated
when present, so real overlap remains a conflict. The existing regular-file
and realpath checks, unknown-authority refusal, complete transaction,
retained reconstruction and acquired-origin commitment are unchanged.
Request version 1, publication version 2 and all public API shapes remain
as declared above. No native/split admission, authority table or lock is
added.

Class sweep at cb1dec0f: reservation-home enumeration in
`qualifiedReservations` and `acquireQualifiedReservation`, canonical
`recordPath` and `reservationPath`, public `startRun`/`takeReservation`,
`readRecord`/`readReservation`, `releaseIfOurs`, `stopRun` and `collectRun`.
The acquired scanner is the shared-home classifier; the retained qualified
scanner only selects qualified publications. The correction applies at
that existing classifier rather than skipping an arbitrary prefix. There
is no extra in-fence follow-through.

| Criterion | Repaired source evidence before final grading |
|---|---|
| C1 | All 16 qualified bodies pass, retaining strict committed capture, measured identities, exact first bases, colocated normalization and immutable origin after legitimate worker commits. The correction changes no derivation or retained validator. |
| C2 | The same passing spec retains independent and colocated domains, cross-worker collisions, worker reuse, mixed containment, symlink and unsafe topology/path refusals. |
| C3 | The unchanged committed writer body now accepts intact disjoint active writers and normal released history, preserves matching legacy ownership, refuses changed/foreign authority and reports actual overlap as `QUALIFIED_CONFLICT`. Metadata/resource-free and both legacy acquisition orders remain exercised. |
| C4 | Existing exact-repeat, advanced-HEAD, expected-release, coherent replacement, malformed publication and acquired-origin bodies pass. Writer/digest/resource/attempt/release corruptions retain their actual bytes and refuse acquisition. |
| C5 | All 45 ordinary run-record bodies pass. Resource-free compatibility and the three existing seat cases pass with read-only conventions; ordinary lazy loading, unknown assignment refusal and native/split boundaries are unchanged. |
| C6 | The committed writer body is RED on unchanged runtime and GREEN after the precise correction. All four bounded controls below are RED, literally restored and GREEN. The focused 61-body run includes both separate constructive concurrency controls. The complete original-range grade is still owed after this notes commit. |

### Self-drill block — intact writer compatibility at cb1dec0f

The owned source fixture is a literal committed export of
cb1dec0f40bf2f3799b4324b2a96f8d455441947, with no source Git HEAD.
Its 1722 regular source files are recorded by hash and mode. Only the
parser/app dependency and build outputs and e2e dependencies are linked;
no live runtime authority, grant, manifest, holder, run or reservation was
copied. Each executed body constructs its own repositories and authority.
All thirteen copied conventions Markdown files are 0444, and primary
conventions permissions remain 0444. The native boundary explicitly
authorizes these confined test data exports; no second worker or helper
was admitted.

| Bounded control, one changed side | Actual RED | Literal restoration and GREEN |
|---|---|---|
| Exact supplied restrictive mutant: add `record.writer === true` to the existing shared-home record guard; unchanged writer body | 1 executed, 1 failed, exit 1; `RESERVATION_UNREADABLE` for intact writer states | Run-record hash A, exported mode 0664 and exact nanosecond clocks restored; same 1 body passed, exit 0 |
| Remove only the two recognized transaction fault/recovery namespace names; unchanged metadata body | 1 executed, 1 failed, exit 1; `RESERVATION_UNREADABLE` at the metadata directory | Hash A, mode and clocks restored; same 1 body passed, exit 0 |
| Restrict the same record guard with `record.writer === false`; unchanged resource-free body | 1 executed, 1 failed, exit 1; `RESERVATION_UNREADABLE` at its canonical work record | Hash A, mode and clocks restored; same 1 body passed, exit 0 |
| Reintroduce only the flat loop's duplicate conventions-index copy; unchanged seat-install body | 1 executed, 1 failed, exit 1; actual index-copy `EACCES` in `seatFixture`, before any `seatVerb` | Push-guard spec hash B, mode and clocks restored; all 3 existing seat bodies passed, exit 0 |

Hash A: `34cae83bfcde48740d1cdf07558ced59ce2c8400055fb159b413f34b13bff4f7`.
Hash B: `4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`.
Every one-sided mutation diff was read before its test. Fixture baseline
executed the writer, metadata and resource-free bodies plus all three seat
cases: 6 passed, exit 0. Final whole-export verification found all 1722
source hashes and modes unchanged, then restored the controlled clocks
again after positive runs. The source fixture has no runtime directory.
External `fixture-final-restoration-T-351.json`, individual mutation diffs,
RED/GREEN logs, exact argv/count/exit receipts and restoration receipts
record the measurements. Python's exact nanosecond restoration was used;
Node v22.22.0 reports libuv 1.52.0. Primary implementation was never mutated
by these controls.

The broader previously platform-refused safety-guard-removal campaign was
not resumed. The owner-adopted T-351-only limited-qualification exception
retains the missing fresh independent source-drill coverage for retained
authority integrity, worker ownership/containment, legacy enforcement and
admission/assignment guards. Existing source evidence and constructive
fixtures are separate from that missing independent measurement. No
functional failure or completion uncertainty is waived; fresh independent
review still decides acceptance.

### Ordered readings, corrections and final handoff — T-351-a15

The exact first identity probe returned native thread
01a16368-03e8-78c3-bbba-11f7a4b3b0c3; the canonical child is
`t351_writer_compat_repair_20261022` under the root coordinator. Explicit
public binding preceded repository tools. Requested model/effort is
GPT-6.1 Sol/xhigh; observed provider identity and usage are unknown.
Every shell entered the assigned resource first; all tools and callbacks
were serial and every yielded job was polled to terminal. No helper,
foreign review workspace, withheld attack set or other worker conversation
was opened. Prerequisites were already installed and built, and were
rechecked; no install or manifest change was made.

Ordered functional readings, with port 15351 and assigned external output
homes:

1. At unchanged a50dfa8f runtime plus this attempt's criteria echo, the
   committed writer body executed 1 and failed 1, exit 1. Active, released
   and overlap all returned `RESERVATION_UNREADABLE` rather than the
   required successful coexistence or actual conflict.
2. With exact prototype bytes subsequently committed at cb1dec0f,
   `npx playwright test tests/qualified-reservation.spec.ts tests/run-record.spec.ts --reporter=line`
   executed 61 and passed 61, exit 0: 16 qualified and 45 ordinary bodies.
   E2e `npm run typecheck` exited 0. Mandatory graph readings after the
   criteria and source writes each returned CURRENT, exit 0.
3. At the literal cb1dec0f export, the six-body baseline and four
   RED/restored-GREEN controls ran in the order in the block above.
   Each deliberate RED command exited 1; baseline, restoration and
   positive test commands exited 0. Exact commands, working directories,
   source refs, counts and exits are in the per-control JSON receipts.
4. A later control driver reused the first primary reproduction's raw
   stdout-log filename. Its native tool result and original error-context
   and trace artifacts remain retained; the overwritten text file is not
   claimed as preserved. The conflict was immediately disclosed and
   recorded in `log-stem-correction-T-351.json`, and unique fixture stems
   were applied. A separately exported exact a50dfa8f source then repeated
   the unchanged-body reproduction: 1 executed, 1 failed, exit 1, with
   unchanged run-record hash
   `dd57385e7ff097dd37817f5cc0bb7bae095a8b483be0f2ecf9cca8257bad23ce`.
   `unchanged-base-writer-red-repeat-T-351` retains that genuine later
   run's argv, raw log, count, exit, trace and before/after hashes. No
   fabricated replacement log or erased failure is asserted.
5. At cb1dec0f, all three `--owed-set --range` derivations exited 0:
   original 85eb7584e517d379f36df55e83a07f70eb93686c has six changed
   paths; previous replacement 566858522c365d3e352d8891b919b7b3841e8dc4
   has three; current repair a50dfa8faedffbb02aaf4c26fd2209f4900799d8
   has two. Each derives whole parser/app and the same nineteen e2e
   specs, with no unplaceable paths. Final derivation and measured
   coverage are repeated at the complete final notes/source ref.
6. At cb1dec0f, source-range `docs-gate.mjs` on the six actual paths
   exited 1 meaning FIRES; whole-tree `npm run lint:docs` exited 0 with
   zero findings and no diff judged. `npm run capabilities:check` exited
   1, STALE: committed 129443 bytes versus fresh 131336. This remains a
   source currency finding. Generated reconciliation belongs to
   integration outside this frozen fence and was not performed here.

The mechanical merge forecast at cb1dec0f against main
e8aabf062b289c2cd1a460a9a3c1413f69262125 exited 1 with the existing
content conflict in `tools/e2e/tests/push-guard.spec.ts`; run-record
auto-merged. No local merge or resolution was performed, so these are
owed-at-source decisions, not a clean merged-tree certification. On the
six-path original source range, DOCS GATE fires; the broad GRAPH REGEN
trigger matches the three test suffixes, while actual graph check is
CURRENT because tools are outside the walk. BOOT GATE has no app source
or manifest trigger. METHOD EVAL has no method path or added verdict
citation. Final source derivation is supplied in the handoff; the
integrator must re-derive after reconciliation. This notes append adds
no path or trigger class.

The initial card remains `verifying`; no status-only stamp or post-grade
source/note commit is planned. This complete notes/source commit owes the
one final original cumulative grade, with final replacement ranges derived
separately and covered only by the actual identical final suites/specs.
The native completion reports its real full ref, counts, exits, clean
tracked state and actual owned-job/port cessation after that grade. No
merge, push or CI is part of this executor pass. No new pack gap or
out-of-fence implementation need was discovered. The read-only source
fixture arrangement and exact correction were already authorized by the
frozen brief, so no new ask or scope decision was required.

### Physical recorded-path compatibility criteria echo — T-351-a17

Before implementation, at unchanged source
e8e5f6657c2efc00c890ee8203fb7162a6c85761:

- [ ] C1: preserve strict committed capture, complete receipts and role revisions, measured identities, immutable acquired origins and retained reads after legitimate worker HEAD advancement.
- [ ] C2: preserve authoritative project-domain comparison, independent repository separation, colocated aliases, unique physical worker ownership and unsafe topology/path refusal.
- [ ] C3: accept a legacy writer record's supported coordinator alias only when its recorded reservation parent resolves to the existing physical home and its exact expected basename matches; preserve actual legacy ownership, all conflict checks and atomic complete publication in the existing transaction.
- [ ] C4: preserve exact repeats and expected-content owned release; changed, foreign, missing or unreadable recorded authority must refuse without deletion or partial acquisition.
- [ ] C5: preserve ordinary public start/bind/continuation/stop/collection, metadata and resource-free records, library-only qualified APIs, native/split refusal and the read-only conventions fixture repair.
- [ ] C6: retain the supplied regression, demonstrate its unchanged-base failure and corrected normal qualified/run-record readings, assess canonical/alias active/released/disjoint/overlap/foreign cases, and grade the final committed original range once after all notes; disclose the stopped independent review and every unexecuted proof without retrying source mutations or guard-disabling work.

The a16 review was stopped before a verdict and remains incomplete. Its
copied regression and narrow prototype are shared ordinary repair inputs,
not independent acceptance. The standing source-drill requirement is not
executed in this ordinary compatibility pass; prior evidence keeps its own
refs and the explicitly retained qualification limitation remains visible.

### Physical recorded-path compatibility delivery — T-351-a17

The correction and both ordinary regressions are committed at
15d5c9668559a8099010813b5541d62f809b3f4c, from unchanged completed source
e8e5f6657c2efc00c890ee8203fb7162a6c85761. Production is the exact narrow
copied prototype: require an absolute recorded reservation path, resolve
its parent physically, retain its basename, then compare that complete
location to the existing expected reservation path. The retained file
itself may be absent after normal release; its shared physical parent is
still required. An unresolved, removed or retargeted alias cannot establish
the original location and refuses for reconciliation. No lexical-prefix
exception or historical-record rewrite is introduced.

The class sweep read both reservation-home scanners, `recordPath`,
`reservationPath`, `readRecord`, `takeReservation`, `readReservation`,
`startRun`, `releaseIfOurs`, `stopRun` and `collectRun`. Public legacy start
retains the accepted root representation in `reservation.file`; release
retains that history after removing the actual owned legacy reservation.
The corrected comparison is at that shared-home record classifier. The
actual active reservation still needs matching version, attempt, work,
resource, role and acquisition time. Complete legacy enumeration and
qualified overlap checks, common record/assignment/digest/state checks,
retained acquired-origin reconstruction, regular-file checks, transaction,
atomic publication and expected-content release are unchanged. Request
version 1, publication version 2 and the declared API remain unchanged.

| Criterion | Actual ordinary evidence and remaining qualification |
|---|---|
| C1 | All 18 qualified bodies pass with strict committed capture, receipts, measured roots/workers, first-acquisition bases and retained immutable origins after worker commits. No derivation or retained validator changed. |
| C2 | The same passing bodies retain independent and colocated domains, mixed containment, different-worker collisions, physical worker reuse and unsafe topology/path refusals. |
| C3 | The supplied body accepts canonical and aliased disjoint active/released histories and still reports overlapping writers as `QUALIFIED_CONFLICT`. The added path-class body requires the exact physical parent and basename. Matching legacy ownership and both acquisition orders remain covered. |
| C4 | Existing read/repeat/release, coherent replacement, malformed/version/owner and advanced-HEAD cases pass. The two new bodies retain every tested record and ownership byte on success/refusal and leave no qualified residue after release or refused acquisition. |
| C5 | All 45 ordinary run-record bodies pass. Metadata, resource-free and prior writer compatibility bodies pass unchanged. Native/split admission, unknown-field refusal, lazy loading and existing seat assertions are unchanged; all 13 live conventions Markdown sources remain 0444. |
| C6 | The supplied regression is RED on unchanged implementation and GREEN after correction. The additional ordinary data cases pass, as do both unchanged constructive concurrency bodies. The final original cumulative grade is owed after this complete notes commit. Source-drill qualification for the two new bodies remains unexecuted under this pass's explicit ordinary-tests-only boundary; independent acceptance is not claimed. |

The supplied partial-review spec is retained byte-for-byte as the prefix of
the final spec. The added body exercises chained coordinator aliases,
direct reservation-parent aliases and redundant separator/dot spelling in
both active and released states. It rejects null/relative paths, the wrong
basename in the correct parent, retargeted parent and coordinator aliases,
dangling aliases, symlink loops and a non-directory parent. Restoring the
original fixture alias/record allows normal acquisition/release again.
These are ordinary fixture-data cases; no implementation guard or source
file was disabled or mutated for qualification.

Source hashes at 15d5c9668559a8099010813b5541d62f809b3f4c:

| File | SHA-256 |
|---|---|
| run-record.mjs | `5654674180efbab7f29c52acdf68ad417bc8d88c84a4353ebc83f3cdc4e088f1` |
| qualified-reservation.spec.ts | `073ab07a7f8ef3cc7e4ae3c81fc3e50077a85aca331659f45154760cd4d429b6` |

### Self-drill block and stopped-review limit — T-351-a17

Two bodies are added in this pass: the exact supplied alias-history body
and one physical-parent/basename data-case body. No new source mutation,
poison drill, guard-disabling experiment or a16 verification retry was
performed. Consequently neither body's new per-body source-drill proof is
marked MET. The unchanged-base functional failure and normal corrected
tests establish the ordinary compatibility behavior, without filling the
separate missing independent source measurement. Historical source/control
hashes and results above retain their own refs; the copied a16 17-body
prototype/typecheck readings remain partial observations with no verdict.

### Ordered readings, gates and completion boundary — T-351-a17

The required first identity probe returned native thread
01a163a6-a078-71a2-82e7-6d1e11d1de45, canonical task
`/root/t351_alias_repair_20261022`. Explicit public binding preceded all
repository tools. Requested profile remains GPT-6.1 Sol/xhigh; observed
provider model, effort and usage are unknown. Every shell began with the
exact assigned-resource prefix. All commands and owned test processes were
serial and polled to terminal. No helper, foreign worker, sealed attack set,
live authority copy, merge, push or CI operation was used. Existing built
prerequisites satisfied the normal test preflight; no install was needed.

Ordered functional commands and actual results before this notes commit:

1. Read-only orientation, source/path/digest/mode checks and criteria/source
   patch operations exited 0. Mandatory graph checks after the echo,
   supplied body, added data body and correction each returned CURRENT/0.
2. `npx playwright test tests/qualified-reservation.spec.ts --grep 'qualified writer history accepts physical coordinator aliases' --reporter=line`
   ran the unchanged e8e5f665 runtime with the exact supplied regression:
   1 executed, 1 failed, exit 1. Canonical active/released/overlap controls
   matched; alias variants all returned `RESERVATION_UNREADABLE`.
3. `npx playwright test tests/qualified-reservation.spec.ts tests/run-record.spec.ts --reporter=line`
   on source bytes subsequently committed at 15d5c966 ran 63 and passed
   63, exit 0 (18 qualified, 45 lifecycle). `npm run typecheck` exited 0.
   `git diff --check` and the source commit exited 0.
4. At 15d5c966, original and current-repair `--owed-set --range`
   derivations each exited 0. Original origin 85eb7584e517d379f36df55e83a07f70eb93686c
   has six paths; replacement e8e5f6657c2efc00c890ee8203fb7162a6c85761
   has three. Both derive whole parser/app and the same 19 e2e specs,
   with no unplaceable paths. The actual final-tree coverage is rechecked
   after this complete notes commit, before the one original-range grade.
5. The main merge forecast at 15d5c966 exited 1 with an actual tree and
   the existing `tools/e2e/tests/push-guard.spec.ts` content conflict.
   No local reconciliation was attempted. Source-range docs gate on the
   actual six paths exited 1, meaning FIRES for parser/app/e2e readers.
   Whole-tree `npm run lint:docs` exited 0 with zero findings, no diff
   judged. `npm run capabilities:check` exited 1, STALE: committed 129443
   bytes versus fresh 131545. Generated reconciliation remains outside
   the frozen fence and belongs to integration.

Unique raw logs and command/ref/count/exit receipts are retained under
`supertaskr-T-351-alias-repair-20261022/logs` in the assigned external
scratch. The original failure log was never reused. There is no source
export fixture or constructed fixture HEAD in this pass; each test owns
its independent Git repositories and runtime records.

On the original six-path source range, DOCS GATE fires and the broad GRAPH
REGEN trigger matches the three test suffixes; the actual graph remains
CURRENT because tools are outside its walk. BOOT GATE has no app source or
manifest trigger. METHOD EVAL has no method path or new verdict-citation
line. These are owed-at-source decisions: the conflict prevents a clean
merged-tree claim, and integration must re-derive after reconciliation.
The notes add no new path or trigger class. No in-fence follow-through or
new pack gap was found.

The inherited card stays `verifying`; there is no new status-only stamp
and no post-grade source/notes commit. This complete committed tree gets
one final original cumulative grade; final replacement coverage, actual
full ref, body counts/exits, clean tracked state and owned-job/15351
cessation are reported after the grade. Size M retains separate verifier
and integrator seats. The stopped a16 review stays incomplete without a
verdict; fresh independent acceptance remains required.


Coordinator scope reconciliation, 2026-10-22: the normal current-main merge
was refused before publication. The existing malformed shared-home record
body produces a raw JSON error in the native inventory before the qualified
callback, reproduced unchanged at prepared base
6f6ed6cfef47abb10c5713a883f1cc56d5ac1f2c. Its exact owning source is
tools/e2e/scripts/native-codex.mjs, now added to this same-contract repair
fence. This adds no criterion, weakens no named refusal or native fault
recording, and grants no new source-disabling proof campaign. The actual
diagnostic worker completed and was collected without a source edit; a fresh
worker must read the agreeing card/manifest before writing the added path.
Original cumulative origin85eb7584e517d379f36df55e83a07f70eb93686c remains
distinct from the prepared repair origin; complete obligations for both are
derived at the final candidate. Prior accepted source, refused merged-tree
logs and all earlier verdicts remain preserved.

### Native inventory integration repair criteria echo — T-351-a20

Before implementation at prepared source
e5412d0a8e6be32cb45d043b39f6246d08ae2ed2:

- [ ] C1: retain committed capture, exact receipts/revisions, canonical authority and measured identities, immutable acquired origins and legitimate retained HEAD advancement.
- [ ] C2: retain authoritative project domains, independent repository separation, colocated aliases, physical worker ownership and unsafe topology/path refusal.
- [ ] C3: keep inventory discovery separate from record decoding so malformed shared-home authority reaches a named refusal, while retaining native sidecar/fault handling, complete conflict checks and atomic publication inside the existing transaction/home.
- [ ] C4: retain exact repeats, expected-content owned release, crash discoverability and unchanged malformed/foreign authority without a partial acquisition.
- [ ] C5: preserve ordinary public lifecycle and shared-home work records, native/split admission refusal, library-only qualified operations and main's stronger read-only conventions fixture.
- [ ] C6: reproduce the unchanged public body RED, exercise the production-class correction with ordinary owned data and focused qualified/native/run-record compatibility tests, then grade the complete original cumulative range after all commits and separately derive prepared-origin coverage.

Both the card and armed manifest were read back and agree on six paths,
including native-codex.mjs. The integration brief's remaining phrase
"beyond those five paths" is the coordinator-supplied copied wording error;
the actual six-path manifest governs. The prior a19 RED and failed closure
remain preserved. This ordinary implementation pass does not retry a16 or
establish the expressly unexecuted independent source-drill coverage.

### Native inventory integration delivery — T-351-a20

Final production correction: 95666b8e81e61b56cb6308104088c291bc339a0e,
from prepared e5412d0a8e6be32cb45d043b39f6246d08ae2ed2. Inventory
now enumerates supported paths without decoding. Its two consumers decode
and exclude only exact nativeReservationMetadata publications inside their
own error boundaries. Transaction entry retains strict shared-home UTF-8/
JSON validation even without pending sidecars; failures are named
RESERVATION_UNREADABLE. allNativeRecords can persist its existing per-attempt
unreadable-authority evidence. Non-shared native errors retain their handling.
Nothing unreadable is skipped or treated as free authority.

Class sweep: the inventory declaration and both consumers, including raw
refusal and emergency-hold absorption. Existing fault archival, retirement,
transaction/ownership, complete qualified conflict/publication and retained
reconstruction remain intact. Public APIs, request version 1, publication
version 2 and native/split admission are unchanged. Main's push-guard spec
remains exact Git blob 15ef9c136251d7c8df4e6eab3bd77daccdfa137c; all thirteen
live conventions Markdown inputs remain 0444 without permission changes.

| Criterion | Ordinary evidence on bytes committed as 95666b8e |
|---|---|
| C1 | All 19 qualified bodies retain committed inputs, measured identities, immutable origins and legitimate retained HEAD advancement. |
| C2 | Independent/colocated domains, cross-worker collisions, exclusive physical workers and unsafe topology/path refusals pass. |
| C3 | Existing malformed shared-home body and new byte case pass; native fault archival, hold crash/replay, sidecar retirement and reserved-work metadata cases pass. |
| C4 | Exact/changed repeats, owned/foreign release and retained corruption controls pass; corrupt bytes and durable unknown evidence survive refusals and record restoration. |
| C5 | All 47 current-main ordinary run-record bodies pass. Shared-home records, existing seat assertions, read-only modes and native/split boundaries remain effective. |
| C6 | Focused qualified/run-record 66/66 and native consumer 6/6 pass, including the unchanged constructive concurrency controls. The final cumulative grade remains owed after these notes. |

### Test evidence and retained proof boundary — T-351-a20

Unique raw logs/receipts/traces use the following stems in the assigned
external scratch's logs directory; previous a19 files remain untouched.

| Reading, in order | Actual result |
|---|---|
| base-public-record-red-T-351-a20, exact unchanged e5412d0a | 1 failed, exit 1; raw inventory JSON error; before/after runtime/spec hashes match. |
| focused-qualified-run-record-T-351-a20 | Exit 1 before any body: private helper import. Fixture corrected to the published record-sidecar path. |
| focused-qualified-run-record-v2-T-351-a20 and focused-native-inventory-T-351-a20 | Initial correction: 66 passed and 8 passed, exits 0. |
| valid-json-invalid-utf8-red-T-351-a20, bd01c739 runtime plus refined ordinary data | 1 failed, exit 1: acquisition accepted invalid UTF-8 inside valid JSON. This actual iteration defect is preserved. |
| focused-qualified-run-record-v3-T-351-a20 and focused-native-inventory-v2-T-351-a20 | Final bytes later committed as 95666b8e: 66 passed and 6 passed, exits 0; literal source/spec hashes retained. |

The single new body uses public startRun/readAssignment and owned independent
repositories. Valid acquisition/inspection controls precede malformed JSON
and invalid UTF-8 inside otherwise valid JSON. Read-only inspection writes
no emergency hold; failure-persisting inspection records unknown, and restored
record bytes cannot erase it. Strict shared-home transaction validation closes
the iteration defect above. No source-disabling mutation, guard-removal campaign
or stopped a16 retry occurred. The new body's per-body source-drill proof
remains NOT ESTABLISHED; ordinary RED/GREEN evidence does not fill the broader
retained independent qualification gap. No mutation restoration is claimed.

### Gates, corrections and final handoff — T-351-a20

Pre-grade typecheck, whole-tree docs and 13 model-free evals exited 0 at
bd01c739ed81f11272fc2eccbe06f5bb38588231; subsequent source changes receive
final checks before the cumulative grade. Every graph check returned CURRENT/0.
Capabilities currency is STALE/1: 135487 committed versus 137704 fresh bytes
at 057d5dc7. Integration owns generated reconciliation outside this fence.

At 057d5dc754995efa3c403f234c2f706bda878943, separate original/prepared
owed-set derivations exited 0: 20 versus 3 paths, whole parser/app and the
same 22 e2e specs, no unplaceable path. The former 19-spec set is superseded.
Final-tree derivations and measured coverage are reported after all commits.
Mechanical forecast against main7072de95987996c0da04862eb05fba4f17a6201a
exited 1, solely this card's content conflict; no source/spec resolution or
merged-tree certification was attempted. Original source-range docs gate
FIRES/1; six test suffixes trigger graph, no path triggers boot, and existing
added verdict citations owe normal model-free evals. Integration must re-derive
at its resolved merged tree; selftest and model-in-loop are separate/unclaimed.

First probe: 01a16447-c1d1-7b70-89a5-ff723c31c963, canonical native child
t351_native_inventory_repair_20261022; public bind preceded repository tools.
Requested Sol/xhigh remains separate from unknown observed provider/usage.
Standing/role/card/v2 packet were read; all tools were serial and yielded jobs
were polled terminal. No helper, foreign source, sealed attack, runtime copy,
merge, push or CI was used; the fresh ask was unnecessary. The brief's copied
five-path phrase means the actual agreeing six-path manifest; its template
model yields to the requested native profile. Incorrect read-only orientation
paths and truncated reads were corrected; no failed reading is a grade.
No pack gap, extra source need or incidental follow-through was found.

The card stays verifying with requested built_by and empty verified_by.
Every source/test/protocol/notes commit precedes ONE original cumulative
85eb7584e517d379f36df55e83a07f70eb93686c-to-final grade; prepared-origin
e5412d0a8e6be32cb45d043b39f6246d08ae2ed2 coverage is derived separately
at that same final tree. No post-grade commit or status-only exemption is
planned. Actual final ref/counts/exits, clean tracked state and owned-job/
15351 cessation are reported after the run; future success is not preclaimed.

### Retained qualified-authority byte repair criteria echo — T-351-a22

Before source or test implementation at admitted base
4d899fdd17cabfb77f3e08070fb192b9d835f567:

- [ ] C1: preserve exact committed capture, canonical authority, complete revisions/receipts, measured workers and immutable acquired origins after legitimate HEAD advancement.
- [ ] C2: preserve authoritative project-domain comparison, independent and colocated domains, exclusive physical workers and unsafe topology/path refusal.
- [ ] C3: reject malformed encoded qualified and legacy reservation authority before conflict admission or publication, using the existing transaction/home and retained reconstruction with no partial grant.
- [ ] C4: require readable retained bytes for read, exact repeat and expected-content release; preserve malformed authority byte-for-byte and restore valid controls using literal SHA256.
- [ ] C5: preserve the ordinary/native lifecycle, existing durable unreadable-record evidence, library-only qualified APIs, admission refusal and main's stronger read-only seat fixture.
- [ ] C6: pin unchanged-source RED with ordinary owned byte-data bodies and valid Unicode/acquire/read/repeat/release/conflict controls, then focused GREEN and one final original cumulative grade after all commits; derive replacement coverage independently.

The retained a21 reproducer and all nineteen closed manifest members were
verified by size/SHA256 before reading the disclosed reproducer. This is
ordinary implementation feedback and owned fixture-data qualification, not
an independent discovery or source-disabling drill. No stopped a16 activity
is resumed. The existing broader independent source-drill gap remains NOT
ESTABLISHED under the exact T-351-only exception.

### Retained qualified-authority byte integrity delivery — T-351-a22

Production and the two ordinary data bodies are committed at
5a69a2343f9dec9abca76ededd70a618acee92f5, from admitted source
4d899fdd17cabfb77f3e08070fb192b9d835f567. The complete final notes/source
commit receives the one original cumulative grade after every write. Its
actual ref, suite/body counts, exits and cessation are reported separately.

`readReservationAuthority` requires the raw reservation bytes to round-trip
through UTF-8 before parsing JSON. Both the retained qualified scanner and
qualified acquisition's legacy scanner use it inside their existing named
error boundaries. Thus read, exact repeat, qualified acquisition, legacy
acquisition and exact qualified release refuse malformed qualified encoding
as QUALIFIED_AUTHORITY_UNREADABLE; malformed legacy authority refuses as
RESERVATION_UNREADABLE before a complete set can be published. The transaction,
physical file/root checks, committed reconstruction, acquired-name commitment,
conflict comparators and exact release ownership remain unchanged. No input
or scope is skipped, and no new table, lock, service or policy route is added.
Request version 1, retained format 2 and public APIs remain as pinned above.

Class sweep: complete qualified acquire/read/repeat/release and both conflict
paths in run-record, plus native shared-home inventory and transaction-entry
error boundaries. The native attempt-record reader already checks exact UTF-8
bytes and its durable unreadable-authority handling is preserved. The runtime
correction is 10 added/2 removed lines in run-record; 86 test lines add the two
owned data bodies. No extra in-fence follow-through or path need was found.

| Criterion | Actual implementation and pre-grade evidence |
|---|---|
| C1 | The complete focused run retains strict committed capture/receipts/revisions, measured workers, immutable acquired origins and valid retained operations after worker HEAD advances. |
| C2 | Its independent/colocated domains, cross-worker conflicts, disjoint controls, worker exclusivity and topology/path refusal cases pass. |
| C3 | Invalid bytes in an otherwise JSON-shaped qualified record now refuse every consuming operation before publication. Both legacy conflict directions remain covered; malformed legacy authority refuses under the same transaction without a qualified residue. |
| C4 | Read/repeat/release preserve malformed bytes; literal fixture SHA256 restoration allows valid read/repeat/exact release again. Exact/foreign/changed ownership and retained-origin cases still pass. |
| C5 | All 47 ordinary run-record bodies pass; the shared-home malformed-record/native durable-evidence body also passes. Native/split admission stays closed. Main's stronger push-guard blob and all thirteen read-only conventions inputs are preserved. |
| C6 | Two new meaningful ordinary byte-data bodies are RED on unchanged runtime and GREEN after repair; focused qualified/run-record is 68/68, including the two unchanged constructive concurrency controls. The final complete original-range grade remains owed after these notes. |

#### Ordinary byte-data RED, restoration and GREEN

The retained a21 manifest SHA256
9c8439e5183cbee6e130478587a527916b3fd9b9ef6452bffe6b09f2116fb30d
verified all 19 members/378459 bytes before its exact reproducer was read.
No ephemeral scratch substituted for this disclosed feedback.

The qualified body tests raw ff, a truncated multibyte sequence, an overlong
sequence and an encoded surrogate inside incidental holder.host. Its valid
host contains an actual replacement character, CJK and a supplementary Unicode
character. Valid acquire/read/exact-repeat, disjoint qualified and legacy
acquisition, and exact release controls succeed. Every malformed variant is
exercised through read, repeat, disjoint qualified acquisition, disjoint legacy
acquisition and expected-content release; bytes and publication names must
remain exact. The legacy body covers malformed holder bytes in both product
and records whole-checkout authority, with valid conflicts/restoration/release
and qualified reacquisition controls.

| Unique log stem in assigned external scratch | Runtime/data and actual result |
|---|---|
| unchanged-byte-data-red-T-351-a22 | Unchanged admitted runtime plus new bodies: 2 executed, 2 failed, exit 1. Read/repeat were accepted, both disjoint acquisitions published, and exact release deleted malformed authority. The qualified body's 20 literal data restorations and valid final release completed. |
| unchanged-legacy-byte-red-v2-T-351-a22 | Final legacy body alone on unchanged runtime: 1 failed, exit 1. Both product and records cases returned ordinary conflict instead of unreadable authority; both literal restorations and valid controls completed. The initial version stopped at the first failing assertion; using a soft assertion completes both roles and restoration without changing the expected property. |
| changed-byte-data-green-T-351-a22 | Corrected source bytes later committed as 5a69a234: 2 passed, exit 0. All 22 logged fixture restoration hashes match their literal original bytes. |
| focused-reservation-lifecycle-T-351-a22 | Same corrected runtime/spec bytes: 68 passed, exit 0 (21 qualified and 47 ordinary); all 22 new fixture restoration hashes match. |
| retained-reproducer-green-T-351-a22 | Exact unchanged retained a21 module, exit 0 measurement: valid read/repeat succeed; malformed read/repeat/release each refuse QUALIFIED_AUTHORITY_UNREADABLE; file remains, literal original restoration and valid release succeed. |

Before source repair, run-record SHA256 remained
01b6859a094ff1d324ef3b211707eeaf59ccd8050fa380339c247864fb3e9bb7,
with all other runtime/spec protections unchanged. At 5a69a234, run-record is
695fb29011e36e70f4edb9c3950df64a9a5ed90ad14c0ba42c3c36d4318e3ab5
and qualified spec is
c1fcecdef562bdf29cd2b5e5c553b4bfbfd5173577d2bb118d581ae088066b36.
The external unchanged-runtime receipt binds the actual REDs to source hashes;
byte-data-restorations-T-351-a22.json retains each literal malformed/restored
fixture hash, separately from source hashes. No source restoration is claimed
because no production source was mutated for a drill.

#### Self-drill block and proof boundary

The two new bodies change only owned fixture data at the byte-encoding property.
Actual unchanged-source RED/current-source GREEN with constructive controls is
ordinary implementation qualification. No source guard was disabled, no new
source-mutation campaign was run, and no stopped a16 activity was resumed or
reframed. Fresh broader independent source-drill proof for retained integrity,
worker ownership/containment, legacy enforcement and assignment/admission
remains NOT ESTABLISHED under the preserved exact T-351-only exception.
Historical controls retain their own refs. No functional failure, normal grade
or completion uncertainty is waived; fresh independent review remains owed.

#### Gates, source preservation and completion boundary

At corrected bytes subsequently committed as 5a69a234, e2e typecheck and whole-tree
docs each exit 0. At 5a69a234, normal model-free evals pass 13/exit 0. They establish
neither MF09 selftest nor live-model proof. Every mandatory graph reading is
CURRENT/0. Capabilities currency is STALE/1: 135487 committed versus 137879
fresh bytes at 5a69a234. Generated capability/index reconciliation remains an
integration obligation outside this frozen source fence.

Independent original/replacement owed derivations at 5a69a234 each exit 0 with
no unplaceable input or unresolved import. Original 85eb7584 changes 20 paths;
admitted replacement 4d899fdd changes 3. Both owe whole parser/app; original owes 22
e2e specs and replacement 20. The original additionally owes brief-flush and
card-figures, and contains every replacement spec. These complete sets are
unequal; the final original-range run must satisfy its two additional
obligations and explicitly measure all replacement specs. The wording ruling
is routed through the own durable ask, with final comparison and actual
coverage reported after this complete committed tree.

Source-range docs gate on the 20 actual original paths is FIRES/1, with no
frontmatter issues. Six changed test suffixes trigger the broad graph rule;
tools remain outside its walk. No original path triggers boot. Historical
added verdict-citation lines owe normal model-free evals. The mechanical
forecast against main 7072de95987996c0da04862eb05fba4f17a6201a is exit 1 with
only this task's content conflict; no local merge or resolution is performed.
These are owed-at-source readings; integration must re-derive its resolved
merged tree. Known Rust watcher failures remain unwaived, and no whole-Rust
GREEN is claimed from a range that owes no Rust leg.

Main's push-guard Git blob remains exactly
15ef9c136251d7c8df4e6eab3bd77daccdfa137c. Its source SHA256, native-codex,
qualified-reservation and run-record-spec bytes match the admitted base.
All 13 live conventions Markdown sources remain 0444 without permission edits.
Every old note and verifier entry is preserved; own sections alone are added.
No API/dependency/secret/network/command-execution surface was introduced;
strict decoding precedes existing validation and ownership decisions.

Native first probe: 01a16504-12a3-7ad2-937d-9bfc76e744a9, canonical task
/root/t351_qualified_bytes_repair_20261022, public attempt T-351-a22. Explicit
binding preceded repository reads. Requested Sol/xhigh is separate from
unknown observed model/usage. Every shell entered the assigned absolute
resource, tools were serial, and every yielded session was retained and polled
to terminal before another shell. No helper, foreign writer tree or sealed
phase-one artifact was opened. Existing built prerequisites were reused.

Corrections: initial guessed short card path did not exist; the actual path
was derived and the complete card read in bounded chunks. Two read-only rule
selectors were shortened to their unique actual openers. Scope comparison
first expected the wrong output key, then correctly found unequal 22/20 sets;
no failed diagnostic or asserted equality is a grade. No new pack refusal or
out-of-fence implementation need was found. The owning scope-wording ask is
the only routed question and is acknowledged before final grading.

The inherited card stays verifying with verified_by empty. This size-M row
owes separate verifier and integrator seats. All source/body/protocol/notes
commits precede the ONE final original cumulative 85eb7584-to-final grade.
No post-grade commit, status-only exemption, merge, push or CI is planned.
Actual complete final ref, counts, exits, clean tracked state, ceased owned
jobs and clear 15351 port are supplied at genuine RUN-DONE completion.

Integration citation hygiene (2026-10-23): the historical local-home citation is written as an equivalent artifact-relative path. Its verbatim source is retained at fe23b2352b8425d9f26bf0e374a6038756ce9fdf in this card and in the private integration evidence; the historical verdict meaning, sealed inputs and committed bodies are unchanged.

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


### 2026-10-22 — REJECTED — codex/gpt-6.1-sol@T-351-a14

Fresh independent repair review of collected candidate
f0941fe6375cec13e8d3970b5e5c98023ea04a97. The delivered scanner still
misclassifies intact public **writer** work records for work id
`reservations`. Both an active writer on a disjoint resource and its
normally stopped/collected historical record make qualified acquisition
refuse with `RESERVATION_UNREADABLE` / `invalid resource-free work record`.
This is a C3/C5 compatibility failure, not unknown or corrupt authority.
No acceptance is inferred from preparation, the executor's report, or the
existing green suites.

The native first probe returned thread
`01a16330-3db5-75d2-b71f-b0f5bababbe9`, canonical task
`/root/t351_repair_phase2_20261022`; the coordinator explicitly bound it
before repository tools. Profile: detached-verifier. Requested model/effort:
GPT-6.1 Sol/xhigh; provider identity and usage: unknown. The preparation
hash, frozen card hash, resource, profile and combined writable fence were
validated privately without displaying nested card notes. An initial
metadata comparison omitted the manifest's separate `alwaysWritable` array;
the corrected combined comparison matched. All commands and callbacks were
serial. This is a procedural repository boundary, not OS/read isolation.

The standing STATE/INDEX, supplied current standing, complete current role,
frozen six criteria, both preserved attack sets and their distinct grounds
were read. The full five-file implementation diff preceded delivery notes;
no executor conversation or commit messages were consulted. This is a fresh
phase-two repair review using the preserved original and reentry frames,
not a claim of new preimplementation blindness. Original phase one received
the conduct extraction and contract rather than the complete historical
role. Reentry phase one likewise disclosed its supplied frame. Its ground
was taken at pre-alias-repair e11b10762952f74742e671688ef466786b155f37,
not retroactively at the original base. Retained-origin, alias and a12
namespace feedback, plus the resource-free `reservations` observation, were
shared with the repair executor. Those are shared inputs. The active and
released writer variant below was independently derived during this review.

Seals were independently rehashed and matched:

- Original attack: `4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`.
- Original base ground: `b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`.
- Card at 85eb7584e517d379f36df55e83a07f70eb93686c: `486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`.
- Reentry attack: `4ebe6be51af393056342993d3fb5fd923f4bfe9841756dc4d2755d842866d793`.
- Reentry ground: `187941cf1dffe6d96e1e6a648ad8fa42bc65327a882a3f62ed48602b44866fa5`.
- Reentry actual frame: `68da86e7c76efb490e7a9595adcff03eeb86f1f579a9ce590ebfc8294dcb6bf7`.

#### Literal criteria and deciding evidence

All figures in this table describe candidate
f0941fe6375cec13e8d3970b5e5c98023ea04a97 or the explicitly named owned
prototype, not this later verdict commit.

| Criterion | Finding and actual evidence |
|---|---|
| C1 | Existing controls pass: committed mixed-component receipt, exact revisions, forged/changed facts and alternate authority refusal, measured physical bindings, colocated normalization, differing alias bases, retained read/repeat/release after worker commits. Full diff confirms committed capture/public parser reconstruction and first-acquisition versus retained-origin separation. |
| C2 | Existing controls pass: independent roots with equal relative paths, same-project collisions across distinct workers, disjoint scopes, colocation, worker reuse, containment, unsafe paths/symlink and nested/shared-common-directory refusals. The comparator uses authoritative repository identities. |
| C3 | **FAIL.** Direct legacy/qualified conflict cases and published metadata controls pass, but the real `startRun` writer record at the canonical shared-home work-record path is rejected as corrupt even with an intact matching legacy reservation on an independent resource. Normal released history causes the same permanent acquisition refusal. Complete checks/publication remain inside the existing native transaction; no second lock or authority table was added. |
| C4 | Existing controls pass: exact repeats exclude incidental process/time, changed repeats and foreign expected identity refuse, retained bases survive HEAD advancement, coherent request/scope replacement is checked against the acquired filename commitment, malformed/duplicate/unanchored authority stays retained. A dead holder does not grant stealing. |
| C5 | **FAIL in coexistence with the public lifecycle.** The unqualified run-record suite passes and public start/stop/collection produce the legitimate writer states in the new reproduction, but qualified acquisition cannot coexist with their intact records. Ordinary lazy loading, unknown assignment-field refusal, library-only API exposure and unchanged native/split admission boundaries remain intact. The three existing seat cases pass with read-only conventions and unchanged assertions. |
| C6 | The delivered 15 qualified bodies and 45 run-record bodies pass at the candidate. Both separate constructive child-process concurrency controls execute. Required retained-data, receipt, ownership/release, alias and advanced-HEAD fixtures use owned actual Git repositories/worktrees. Required duplicate-index setup control and both assigned namespace availability controls were independently RED, hash-restored and GREEN. The added correction body exposes the C3/C5 gap that the delivered bodies missed. |

#### Original and reentry grades

The one blessed original cumulative grade was
`node tools/e2e/scripts/gate-run.mjs e2e --range 85eb7584e517d379f36df55e83a07f70eb93686c..f0941fe6375cec13e8d3970b5e5c98023ea04a97`
from the assigned bench, with port 25351. Exit 0: parser **469 GREEN**,
app **1171 GREEN**, e2e **1035 GREEN** over the derived **19 specs**, all
verdicts explicitly at the candidate. The source was held unchanged until
that command was terminal. Original-range derivation has six paths;
replacement range 566858522c365d3e352d8891b919b7b3841e8dc4 through the
same candidate has three, with the same suite/spec set and no unplaceable
paths. These are distinct origins covered by the same unchanged-source
measurement, not two alleged full runs. Earlier focused qualified/run-record
execution passed 60 bodies, exit 0. Local results make no push or CI claim.

`npm run capabilities:check` independently remains STALE at the candidate,
exit 1: committed 129443 bytes versus generation 131244. This is a source
currency finding. Generated reconciliation is outside this verifier's fence
and is not silently regenerated or called an environment failure.

#### Independent controls and restoration

Owned source fixtures were literal committed exports of the candidate, with
no source Git HEAD and no live runtime authority, grant, manifest, reservation
or run record copied. Only dependency/build outputs were linked. Every Git
repository and authority record exercised by the tests was fixture-owned.
All copied conventions Markdown sources remained 0444; primary permissions
were unchanged. Node was v22.22.0; Git was 2.50.1 (Apple Git-155).

The actual `fixture-controls` and `disjoint-writer-feedback` answers in this
attempt's own ask file were read and acknowledged with literal line-initial
RUN-ACK tokens. The latter confirmed that active and released writer records
are the same existing C3/C5 compatibility class; it did not direct a verdict.

| Bounded control | Actual result |
|---|---|
| Remove only recognized transaction fault/recovery names | One existing body RED, exit 1, `RESERVATION_UNREADABLE`; literal source restoration; same one body GREEN, exit 0. |
| Remove only resource-free work-record recognition | One existing body RED, exit 1, `RESERVATION_UNREADABLE`; literal source restoration; same one body GREEN, exit 0. |
| Reintroduce only duplicate index copy | Baseline three existing seat bodies GREEN. Isolated one-body RED, exit 1, actual `copyfile` index `EACCES` in `seatFixture` before seat operation; literal restoration; same three seat bodies GREEN, exit 0. Assertions and conventions modes unchanged. |
| New intact writer lifecycle correction | One body RED on unchanged candidate: active, normally stopped/collected and overlapping public writer records all report `RESERVATION_UNREADABLE`. A bounded availability prototype with matching actual legacy ownership and terminal-release checks passes all 16 qualified bodies, including malformed work-record, foreign reservation, unknown authority, overlap, retained-origin and both concurrency controls. |
| New correction's restrictive property-site mutant | One unchanged guard expression additionally rejects writer records: new body RED, exit 1. Literal prototype restoration by SHA-256: same body GREEN, exit 0. This is an availability discriminator, not safety-guard removal. |

Original and finally restored run-record SHA-256:
`dd57385e7ff097dd37817f5cc0bb7bae095a8b483be0f2ecf9cca8257bad23ce`;
qualified spec:
`01eb867efe3d876be475394d46da5575d5ca243e372a955bfe54e357c164c09a`;
push-guard spec:
`4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`.
The prototype SHA-256 was
`34cae83bfcde48740d1cdf07558ced59ce2c8400055fb159b413f34b13bff4f7`;
it was restored after its restrictive mutant, then discarded in favor of
literal candidate bytes. Run-record mode 0644 and its saved modification
clock were restored. Exact mutation diffs, command logs and restoration
receipts are retained under this attempt's declared owned scratch. Primary
production is unchanged; no corrective production patch is committed here.

The exact owner-approved T-351-only limited-qualification exception remains
explicit: the broader independent safety-guard-removal source-drill campaign
for retained-authority integrity, worker ownership/containment, legacy
enforcement and admission/assignment guards was not executed or reopened.
Existing executor evidence is separate from that missing independent source
measurement. The required constructive fixtures, independent concurrency
controls, copy control, correction RED/GREEN/restoration and original-range
grade were performed. No functional failure is waived; this implementation
is REJECTED. No broad kill-set matrix is claimed from these bounded controls.

Security/interface sweep found fixed-argument Git calls, no new dependency,
endpoint, CLI escape hatch, monitoring daemon or secret in the implementation
diff. Committed planning remains distinct from native admission. There is no
undeclared in-fence follow-through. No additional pack gap was discovered;
the disclosed phase-one packet limitations and source census staleness stay
named rather than being recast as acceptance.

#### Assigned correction — one correction, one committed body, one block

Preserve legitimate active and normally released writer work records in the
shared reservation home. Validate canonical record/assignment ownership and
the matching actual legacy reservation while active; preserve normal terminal
history after release. Keep resource-free records, malformed/foreign/unknown
refusal, actual overlapping ownership and atomic complete-set acquisition.
Do not solve this by skipping arbitrary prefixes. The demonstrated prototype
is evidence of feasibility, not a mandated production design.

The body below is committed separately after this verdict, as the acting role
requires. It ran RED against the implementation lacking the property and
GREEN with the bounded prototype carrying it. Its restrictive mutant anchor
matches exactly once in both candidate and prototype and preserves the
existing guard; the corrective executor must retain or explicitly reconcile
that property-site anchor with its final implementation.

```mutant
correction: Preserve intact active and released writer work records during qualified acquisition
file: tools/e2e/scripts/run-record.mjs
spec: tools/e2e/tests/qualified-reservation.spec.ts
body: qualified sets preserve intact active and released writer work records in the shared home
message: RESERVATION_UNREADABLE
--- old
          if (file !== recordPath(root, attempt) || record.attempt !== attempt || !STATES.includes(record.state) ||
--- new
          if (record.writer === true || file !== recordPath(root, attempt) || record.attempt !== attempt || !STATES.includes(record.state) ||
```

The verdict and subsequent correction-body commit owe their independently
derived write-range checks. Their actual final refs, readings and owned-job
cessation will be reported for independent collection; no result is preclaimed.

#### Exact proved availability prototype — correction handoff

This literal prototype patch was applied only to the owned committed export
of f0941fe6375cec13e8d3970b5e5c98023ea04a97. It is preserved as correction
evidence, not a production change or a mandated design. Applying it to
run-record source SHA-256
`dd57385e7ff097dd37817f5cc0bb7bae095a8b483be0f2ecf9cca8257bad23ce`
produced the GREEN prototype SHA-256
`34cae83bfcde48740d1cdf07558ced59ce2c8400055fb159b413f34b13bff4f7`.
The literal patch text's SHA-256 is `1f3798b3bf71375060bc636ddc133a2584a30b3835df3f9aee72960ae47197c8`.
The later corrective body and preceding mutant block carry the executable
RED/GREEN handoff; primary production remains unchanged.

```diff
--- run-record.mjs original
+++ run-record.mjs availability prototype
@@ -207,12 +207,27 @@
           const record = readRecord(root, attempt);
           const assignment = /** @type {Record<string, any>} */ (record.assignment);
           if (file !== recordPath(root, attempt) || record.attempt !== attempt || !STATES.includes(record.state) ||
-              record.writer !== false || record.resource !== null || record.reservation?.file !== null ||
-              record.reservation?.takenAt !== null || record.reservation?.releasedAt !== null ||
-              assignment?.id !== "reservations" || assignment.resource !== "none" || !["card", "consultation"].includes(assignment.kind) ||
+              typeof record.writer !== "boolean" ||
+              assignment?.id !== "reservations" || !["card", "consultation"].includes(assignment.kind) ||
               ASSIGNMENT_FIELDS.some((field) => typeof assignment[field] !== "string" || assignment[field].trim() === "") ||
               Object.keys(assignment).some((field) => ![...ASSIGNMENT_FIELDS, "native", "ownedJobs", "admission", "instants"].includes(field)) ||
-              record.assignmentDigest !== sha256(JSON.stringify(assignment))) throw new Error("invalid resource-free work record");
+              record.assignmentDigest !== sha256(JSON.stringify(assignment))) throw new Error("invalid shared-home work record");
+          if (!record.writer) {
+            if (record.resource !== null || assignment.resource !== "none" || record.reservation?.file !== null ||
+                record.reservation?.takenAt !== null || record.reservation?.releasedAt !== null) throw new Error("invalid resource-free work record");
+          } else {
+            if (typeof record.resource !== "string" || !path.isAbsolute(record.resource) ||
+                path.resolve(assignment.resource) !== record.resource ||
+                record.reservation?.file !== reservationPath(root, record.resource) ||
+                typeof record.reservation.takenAt !== "string" || !Number.isFinite(Date.parse(record.reservation.takenAt))) throw new Error("invalid writer work record");
+            if (record.reservation.releasedAt === null) {
+              const ownership = readReservation(root, record.resource);
+              if (ownership?.version !== RECORD_VERSION || ownership.attempt !== attempt || ownership.work !== workOf(attempt) ||
+                  ownership.resource !== record.resource || ownership.role !== assignment.role ||
+                  ownership.takenAt !== record.reservation.takenAt || "kind" in ownership) throw new Error("writer reservation ownership changed");
+            } else if (typeof record.reservation.releasedAt !== "string" || !Number.isFinite(Date.parse(record.reservation.releasedAt)) ||
+                !TERMINAL_STATES.includes(record.state)) throw new Error("invalid released writer work record");
+          }
           continue;
         }
         if (legacy.version !== RECORD_VERSION || typeof legacy.resource !== "string" || !path.isAbsolute(legacy.resource) ||
```


### 2026-10-22 — APPROVED — codex/gpt-6.1-sol@T-351-a18 — independent normal review under the existing limited exception

I approve collected candidate b1ed2d7744c4fd6275e0b272bf4c9170a50a1652
for the six unchanged frozen functional criteria, under the exact owner-adopted
T-351-only qualification exception of 2026-10-06. No new functional defect or
additional unexcepted property gap was established. This local verdict does
not certify a merged tree, publication or CI. All earlier rejections and the
incomplete a16 review remain intact.

#### Actual frame and seals

Native first probe: 01a163c7-71e0-7352-af85-77b47292eb00; canonical task:
`/root/t351_normal_review_20261022`. Explicit binding preceded repository
reads. Profile: detached-verifier. Requested model/effort: GPT-6.1 Sol/xhigh;
observed provider identity/usage: unknown. Tools were serial, without helpers.
The native resource prefix was used throughout. This was a procedural reading
boundary, not OS/read isolation.

I read STATE/INDEX, the supplied current standing and complete verifier role,
the frozen contract, both distinct attack/ground sets and the original context
pack. The complete five-path implementation diff and full changed-path/mode
inventory preceded source notes, reports and old verdicts. The sole additional
changed path is this task record; no implementation path or executable mode
was hidden. Its criteria still match the original card exactly. No executor
conversation or commit subjects were used for orientation.

This is a fresh phase-two normal review of a completed/collected repair,
not a new preimplementation blind sitting. Original phase one received the
contract/conduct extraction rather than the whole historical role. Reentry
ground names pre-alias-repair e11b10762952f74742e671688ef466786b155f37,
not the original base. Metadata, resource-free, writer-record and alias
regressions were shared repair inputs, not fresh discoveries by this reviewer.

Rehashed original inputs:

attack set: sha256:4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394 (../../../supertaskr-evidence/execution/repository-separation-2026-10-05/T-351/recovery/verification-r4/attack-set-T-351.md)

ground: sha256:b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874 (ground-T-351.md, same original packet)

Raw card at 85eb7584e517d379f36df55e83a07f70eb93686c:
`486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`.
Reentry attack: `4ebe6be51af393056342993d3fb5fd923f4bfe9841756dc4d2755d842866d793`;
reentry ground: `187941cf1dffe6d96e1e6a648ad8fa42bc65327a882a3f62ed48602b44866fa5`;
actual-frame seal: `68da86e7c76efb490e7a9595adcff03eeb86f1f579a9ce590ebfc8294dcb6bf7`.
All match their saved files. The native preparation digest
`4018137c16d6033d2bdbe5386dd96b257c014d6ba77336687ca8f2c983ae4b8b`
and its frozen card digest
`f8e5f84abb9ce724df185ebec3421dddc5f4412bebf40b16a140f5bc8a816781`
were validated privately against replacement origin
e8e5f6657c2efc00c890ee8203fb7162a6c85761, source a17, the exact candidate,
resource, profile and combined paths/alwaysWritable fence. Nested authority
card text was not displayed. An initial validator incorrectly expected a
`sha256:` prefix on the native bare-hex card digest; the corrected comparison
matched without changing authority.

The named public asks `normal-suite-boundary-T-351-a18` and
`readonly-preparation-T-351-a18` were answered through the run arm and read
before actual line-initial acknowledgements. The first preserved the two
already-committed constructive concurrency controls inside the unmodified
normal suite; it granted no new mutation or stopped-prototype retry. The
initial preparation condition check exited 1 before any suite: all thirteen
conventions inputs were 0644. Under the second answer I derived only the
tracked canonical input set, validated regular non-symlink targets in this
bench and removed write bits. At the candidate, all thirteen became 0444;
bytes, Git modes, HEAD/tree and tracked cleanliness stayed exact. This setup
failure is retained as a preparation gap, not an implementation test failure
or proof that a fixture ran. No fake lane-lock or authority was introduced.

#### Six literal criteria

The current-source evidence below is the independent original-range reading
at b1ed2d7744c4fd6275e0b272bf4c9170a50a1652. Named bodies are in the frozen
qualified-reservation and run-record specs unless otherwise stated.

| Criterion | Result and deciding evidence |
|---|---|
| C1 — complete committed scope, authority and immutable origins | MET functionally. Source `captureQualifiedInputs` and `deriveQualifiedScope` use existing committed capture and the public parser, exact receipts/revisions, measured roots/workers, strict role bindings and first HEAD/base checks. Complete mixed-receipt, malformed/drift/alternate-authority, colocated-alias-base and advanced-HEAD read/repeat/release bodies all pass. Request version 1, retained publication version 2 and public API/failure contracts are pinned in the delivery notes. |
| C2 — authoritative project domains and exclusive physical workers | MET functionally. `qualifiedSetsConflict` uses the canonical comparator on captured project identities and separately claims physical workers. Passing bodies distinguish same-project overlap across separate workers, genuinely disjoint scopes, independent equal relative paths, colocated aliases, worker reuse, mixed containment, unsafe paths/symlinks and unsupported nested/shared-common-directory topology. |
| C3 — existing transaction/home, complete atomic publication, interoperability and retained reconstruction | MET functionally. Source discovery, reconstruction, complete conflicts and single `atomicJson` publication are within `withNativeTransaction`; legacy take/release use the same boundary. Both acquisition orders and the second-root/no-residue body pass. Coherent worker/origin replacement, narrowed JSON, receipt/binding/version/publication corruption and unknown authority refuse through retained consumers. Metadata, resource-free, intact writer and recorded-path bodies pass. The latest comparison resolves the recorded parent physically and requires the exact basename; actual legacy ownership checks remain. |
| C4 — exact repeat/release, preservation and recoverability | MET functionally. Exact repeat excludes holder/time, meaningful changed repeats refuse, foreign expected identity preserves authority, and advanced HEAD retains the acquired origin. Current coherent-replacement/publication tests pass. Retained independent a9 crash-origin evidence at e11b1076 records actual child exit 77, ceased holder, one complete discoverable two-repository set, refused dead-holder theft, unchanged hash after foreign release and successful advanced-HEAD read/repeat/exact release. Its publication/retained-origin mechanism remains in the reviewed source; this is historical evidence at its named ref, not a newly run crash campaign. |
| C5 — ordinary lifecycle and admission fence, library APIs and read-only seat fixtures | MET functionally. All 45 ordinary run-record bodies pass, including lazy loading and unknown second-root assignment refusal; ordinary start/bind/continuation/stop/collection remain covered. Qualified operations remain library exports; no new native/split admission, CLI bypass, lane manifest, daemon or dependency was introduced. The shared seat fixture copies the conventions index only through its canonical derived set, preserving assertions; all three existing seat bodies pass with the candidate's thirteen sources at 0444. |
| C6 — real owned fixtures and required constructive/discriminating evidence | MET for the frozen functional/control requirements, with the precise rubric limitation below. All 18 qualified bodies pass using owned actual repositories/worktrees. The unchanged separate child controls execute: normal conflicting acquisition has one winner; coordinated serialization-disabled interleaving has two grants; serialized conflict-disabled overlap is admitted. Historical read-only duplicate-copy RED/hash restoration/GREEN and assigned availability correction evidence were inspected as detailed below. No incomplete a16 result supplies a missing control. |

#### Retained controls and exact proof limits

I inspected the literal mutation landings, raw RED/GREEN logs and restoration
receipts, not only delivery summaries. The preserved a9 archive verifies all
66 manifest entries by size/hash. Its independent duplicate-copy control at
e11b1076 changes only the index exclusion, fails the existing seat-install
case with actual index-copy EACCES in `seatFixture` before `seatVerb`, restores
the unchanged push-guard spec hash and modes/clocks, and passes the same case.
Current push-guard spec SHA-256 is still
`4796e23487dcf0a16016d870352c2ba9a15e3535dda6863234d9065981647576`.

The retained a15 artifact manifest verifies all 92 entries. At cb1dec0f its
writer, metadata and resource-free availability controls each run one body
RED/exit 1, restore literal run-record hash
`34cae83bfcde48740d1cdf07558ced59ce2c8400055fb159b413f34b13bff4f7`,
and run that body GREEN/exit 0. Its duplicate-copy control gives the specific
setup EACCES, literal restoration and three restored seat passes. The
whole-export receipt records 1722 unchanged hashes/modes and restored clocks.
These are preserved executor controls independently inspected here, not
executor self-approval. The disclosed reused stdout stem is not treated as
preserved original output; its separately retained exact-base repeat supplies
the genuine prior-source writer RED.

For the latest physical-parent availability repair, the actual a17 raw
`base-alias-regression-red-T-351-a17.log` executes one supplied body against
exact e8e5f665 runtime/hash and fails only the aliased active/released/overlap
expectations with RESERVATION_UNREADABLE; canonical controls agree. The narrow
production difference and current independent passing history/path bodies
establish the availability correction. Current data cases also require exact
parent/basename, reject foreign, missing, looping and retargeted aliases,
preserve record/ownership bytes and recover after literal fixture restoration.
This ordinary prior-source RED/current-source GREEN is not relabelled as a
completed new independent source-mutation drill.

The exact adopted exception leaves the broader fresh independent safety-
guard-removal source-drill campaign unexecuted for retained-authority
integrity, worker ownership/containment, legacy enforcement and assignment/
admission guards. That coverage is still NOT ESTABLISHED. No general waiver
for arbitrary new tests, functional failures, constructive controls,
correction RED/GREEN/restoration, completion or ownership is inferred. The
latest retained legacy-path refusal boundaries were exercised with ordinary
fixture data; no new source-disabling kill set is claimed for them. The
availability property has the specific actual missing-property RED and
corrected GREEN above. I found no further unexcepted property requiring an
unsupported proof to declare these six functional criteria satisfied.

Automatic cybersecurity review stopped a16's new mutation verification. It
has no verdict; its partial 17-body prototype pass and unknown missing
callback remain incomplete evidence. I did not resume, reframe or route
around that activity, mutate a source copy or launch another drill campaign.
No missing callback, success or independent approval was manufactured.

#### Independent grades, scope and handoff

The one original cumulative command was:
`node tools/e2e/scripts/gate-run.mjs --range 85eb7584e517d379f36df55e83a07f70eb93686c..b1ed2d7744c4fd6275e0b272bf4c9170a50a1652`,
with port 25351. Exit 0: parser 469 GREEN, app 1171 GREEN, e2e 1038 GREEN
over 19 derived specs, all at the exact candidate/tree
d85f8cfc592d391ee81bc7ffc040a6db9223ca22. Source remained unchanged and
tracked clean until the command was terminal. Original origin 85eb7584 has
six paths; replacement origin e8e5f665 has three. Their complete required
suite/spec sets match, and actual measured coverage matches both with no
unplaceable path. These are separate derivations covered by one run, not two
claimed source grades. Raw suite outputs, range log/token and coverage receipt
are retained in the declared `supertaskr-T-351-final-normal-review-20261022`
scratch under unique T-351-a18 stems.

At the candidate, typecheck and whole-tree docs checks exit 0; graph check is
CURRENT/0. Capabilities check is STALE/1: 129443 committed versus 131545
fresh bytes. That known generated reconciliation belongs to integration,
not a quiet fence expansion. The existing push-guard integration conflict
must retain main's stronger source/canonical Set dedup and derived-chapter
control. Integration must re-derive and grade its merged tree. No merge,
push, CI or current-main certification was performed here.

Security/interface review found fixed-argument Git calls, strict new input
shapes and committed/physical validation, with no new dependency, endpoint,
secret, shell interpolation or undocumented authority surface. The complete
diff contains no undeclared follow-through. No new correction is assigned:
zero new corrections and zero new mutant blocks. Historical blocks and all
138689 bytes of task history at b1ed2d77 are preserved as the exact prefix.

This verdict is the only tracked write. Its own committed range, whole-tree
docs check and triggered model-free evals are owed after this append; the
native final report will state their actual final ref/counts/exits and job/
25351 cessation. No own-write result or future collection is preclaimed.


### 2026-10-22 — REJECTED — requested-gpt-6.1-sol@01a1649e-8f61-78c1-b8aa-3cfaa13361f9 — native T-351-a21

REJECTED at implementation candidate `fb1d039e47d8959b7ff1c45461e601210011c3bb` for an unexcepted C3/C4 failure: malformed-byte qualified authority is accepted and deleted. The normal complete suites are GREEN; they do not cover this counterexample. This entry assigns no at-merge correction. The owning disposition requires a fresh executor repair and fresh independent review; no production correction is authorized in this review bench.

The actual native identity probe returned `01a1649e-8f61-78c1-b8aa-3cfaa13361f9`, canonical task `/root/t351_current_main_review_20261022`; the coordinator confirmed the public exact bind before any file access. Profile: detached-verifier, independently collected source T-351-a20, preparation digest `97076d387b5bb2f86d11d45ee32b2ee9a1601a51428c8049e48b233c5abc0135`. Requested model/effort: GPT-6.1 Sol/xhigh. Observed provider/model, tokens and execution usage remain unknown. The measured boundary is registered callbacks and Bash/apply_patch with explicit resource rooting, not OS/read isolation.

This is a fresh normal phase-two review after disclosed repairs, not a fresh phase-one discovery claim. I read the selected complete verifier role, supplied STATE then INDEX, frozen six-criterion contract, context pack and sealed attack/ground inputs. I inventoried original/prepared/current-main changed paths and modes, read the six feature paths and implementation/body changes before source feedback, and did not orient from commit subjects or executor conversation. Additional already-delivered main inputs were accounted for in the original cumulative inventory and grade. Raw card integrity was checked privately: original SHA256 `486c30755489e85afcab93ecab873dcb28fee64266dde47151e14a52158a7b70`, prepared SHA256 `843dea922c6eedfde45da1afadae1afad46e8870b74a5a0e15af69b499667191`, candidate SHA256 `f3aad1042851bd642716463ff73b067c74b72803150fcf4d0efa530384aaddd7`; all six criterion bullets agree. No raw nested authority/card history was displayed to validate a digest.

The two sealed inputs remain distinct. Original attack `execution/repository-separation-2026-10-05/T-351/recovery/verification-r4/attack-set-T-351.md`, SHA256 `4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`; original ground beside it, `ground-T-351.md`, SHA256 `b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`, names original base `85eb7584e517d379f36df55e83a07f70eb93686c`. Original phase one received conduct extraction and contract, not the complete historical role. Reentry attack `execution/repository-separation-2026-10-05/T-351/recovery/reentry-alias/attack-set-reentry-T-351-v1.md`, SHA256 `4ebe6be51af393056342993d3fb5fd923f4bfe9841756dc4d2755d842866d793`; `reentry-ground-v1.json` in that directory, SHA256 `187941cf1dffe6d96e1e6a648ad8fa42bc65327a882a3f62ed48602b44866fa5`, names pre-alias source `e11b10762952f74742e671688ef466786b155f37`. Its `actual-frame-v1.md`, SHA256 `68da86e7c76efb490e7a9595adcff03eeb86f1f579a9ce590ebfc8294dcb6bf7`, discloses the packet-only procedural frame. These are historical sealed proposals/grounds, not this review's test results.

#### Reproducible failure — invalid UTF-8 qualified reservation

`qualifiedReservations` in `tools/e2e/scripts/run-record.mjs` uses `JSON.parse(readFileSync(file, "utf8"))`. Invalid UTF-8 is replaced before validation, so a record containing byte `ff` can become valid JSON in memory. `readQualifiedReservation`, exact repeat through `acquireQualifiedReservation`, and `releaseQualifiedReservation` all consume that lossy representation.

An owned fixture used real independent product/records repositories, committed inputs and worker checkouts through the public APIs. A valid acquisition with `holder.host = "byte-marker"` passed read and exact-repeat controls. I replaced only that marker's raw bytes in its retained qualified record with byte `ff`, leaving invalid UTF-8. Expected: retained read, repeat and release refuse unreadable authority and preserve its bytes. Actual: read accepted host U+FFFD; repeat returned `repeated: true`; release returned true and removed the malformed record. The fixture then restored the original bytes exactly and its valid release passed. It removed its own repositories; no repository source was mutated.

The actual reproducer is `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/invalid-utf8-qualified-data-T-351.mjs`, SHA256 `2ff5e67e3a6c072fd8389bdde7cc6de4c51a668e68f78d6efea09abef283305a`; run that module from the assigned candidate's repository root. Its actual result is `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/invalid-utf8-qualified-data-result-T-351.json`, SHA256 `163fdedbf82dcada835fb83124b1abc034b8e2b23071cd8145f4a9ac288a79d3`. Its exit0 means the measurement completed; the reported acceptance/deletion is the failing contract observation. This is an ordinary data fixture, not a source guard-removal drill. It is separate from the repaired malformed shared attempt-record case.

#### Criterion decisions at the implementation candidate

| Criterion | Decision and evidence |
|---|---|
| C1 — complete committed scope and bindings | The named qualified acquisition, validation, colocated-role and advanced-HEAD bodies passed. Reading `captureQualifiedInputs`, `deriveQualifiedScope` and `measureQualifiedWorker` confirms committed receipts/public-parser expansion, authority association, exact first-acquisition bases, immutable retained origins, duplicate-role refusal and physical identity reconstruction. Request version1 and retained qualified format2 are pinned; public acquire/read/release remain on run-record. Independent broad guard-removal proof remains limited below. |
| C2 — authoritative project comparison | The independent-role/alias/reused-worker, mixed containment and validation bodies passed: same-project overlap across workers refuses, distinct repositories can admit equal relative domains, disjoint controls admit, physical-worker reuse collides, and unsafe/symlink/nested/shared-common-directory cases refuse. `qualifiedSetsConflict` uses the canonical parser comparator with measured repository identities. |
| C3 — transaction, publication and retained authority | REJECTED by the byte-invalid retained-record read/repeat acceptance above. Normal second-root/no-residue, legacy both-orders, retained replacement/corruption and publication-name bodies passed. Validation, complete conflict checks and one atomic publication are inside `withNativeTransaction`; those successes do not establish refusal of this malformed-byte authority. |
| C4 — repeat, exact release and recovery | REJECTED by deletion of that unreadable qualified record using its original expected identity. Normal foreign/stale release, changed repeat, process/time-independent exact repeat, advanced-HEAD and discoverable publication controls passed. Dead holder observation grants no automatic steal. The positive valid read/repeat/release controls passed in the failing fixture itself. |
| C5 — existing lifecycle and admission fence | The complete ordinary run-record suite and unknown-assignment/no-qualified-load body passed; native lifecycle readers are included in the complete range. The four focused real-seat cases passed with unchanged assertions and read-only source modes. No native qualified admission, split-dispatch path, CLI escape hatch, manifest or daemon was added. |
| C6 — meaningful fixture/control coverage | The unchanged qualified/run-record focused run passed66 bodies, including the separate child serialization-disabled and conflict-disabled controls with their normal counterparts; the real-seat focus passed4. Complete range coverage is1124 e2e bodies over22specs. Fixtures own their Git inputs. Current copy-set/mode checks pass; retained historical duplicate-copy RED/restoration/GREEN is cited at its named older source below, not claimed as a fresh current-source mutation. The broader source-drill limitation remains explicit. This row does not waive C3/C4. |

Focused evidence: `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/focused-reservation-lifecycle-T-351.log`, SHA256 `6405fbf96d3a7d6752bb9f501531ff7ea5e2edc490c54c75eaf47fbebe1a34bf`, is66 passed at the candidate; `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/focused-readonly-seat-T-351.log`, SHA256 `8c4d8e9572b48689feed0556c3306a940b6f6c9ff3a338c65ee291ce819ad80e`, is4 passed at the same ref. Security sweep covered the added input shapes, Git argument calls, authority home, path/symlink checks, publication/release boundaries, unchanged dependencies and admission fence; the malformed-byte authority failure is the blocking finding. No additional injection, secret, dependency or authorization finding was observed in that sweep.

#### Complete range grades and input inventory

Original cumulative range `85eb7584e517d379f36df55e83a07f70eb93686c..fb1d039e47d8959b7ff1c45461e601210011c3bb` changes20 paths. Prepared-origin range `e5412d0a8e6be32cb45d043b39f6246d08ae2ed2..fb1d039e47d8959b7ff1c45461e601210011c3bb` changes3 paths. Each independently derives parser/app plus the same complete22-spec e2e set, no unplaceable inputs or unresolved imports. I compared nonempty complete suite/spec sets and then matched the actual measured spec list; one original-range run therefore covers both at this unchanged candidate. Command: `node tools/e2e/scripts/gate-run.mjs --range 85eb7584e517d379f36df55e83a07f70eb93686c..fb1d039e47d8959b7ff1c45461e601210011c3bb`, with bench port25351.

| Suite | Actual bodies at candidate | Result |
|---|---:|---|
| Parser | 469 | GREEN, exit0 |
| App | 1171 | GREEN, exit0 |
| E2E | 1124 across22specs | GREEN, exit0 |

Exact grade evidence: `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/candidate-original-range-grade-T-351.log`, SHA256 `be7154e317d5395ec334c60816ebcd02048c658906021baf82367b3ae7c705a7`. Exact set comparison: `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/scope-comparison-T-351.json`, SHA256 `7e4f3aa79ca49c5c5569b0ffc1bda45659669aa2ac882fc351ec6738c9db54e1`. The complete original/prepared/current-main path/mode inventory is `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/inventory-and-mode-T-351.json`, SHA256 `393a06ce85aa30e149f0d5c65f28c91059eb79aab721bcd7cbb5f5fb66799907`. No Git mode changes were hidden. Original cumulative input includes delivered main's recovery implementation/specs, dispatch and stronger fixture changes plus governing/generated records; the six feature paths remain separately identified.

Current integration base `7072de95987996c0da04862eb05fba4f17a6201a` is divergent, not the preparation origin. Its ordinary name/mode comparison has6 changed paths; the owed-set tool correctly refused an ancestor-range grade for that divergent pair. No merged-tree or current-main certification is claimed. The stronger push-guard fixture blob remains exactly `15ef9c136251d7c8df4e6eab3bd77daccdfa137c`. All13 tracked conventions inputs match prepared SHA256s and0444 modes; the canonical copy set contains12 because `docs/conventions/README.md` is not an indexed chapter. Exact check: `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/candidate-all-tracked-conventions-T-351.json`, SHA256 `579c24db2bad11522859f26455720651c5d6b8fa215358f9162b50f3c86f355c`.

The candidate evidence is retained under `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-current-main-v1/retained-review-a21-v1/candidate-evidence-MANIFEST-T-351-a21.json`, SHA256 `9c8439e5183cbee6e130478587a527916b3fd9b9ef6452bffe6b09f2116fb30d`, with19 closed members. This entry is the only reviewer tree change. Its exact committed ref and independently derived final reviewer-record range grade are reported in the handoff after this write; the implementation figures above name only the candidate.

#### Proof boundary and procedural disclosures

The adopted T-351-only exception is `plans/repository-separation-next-2026-10-05/owner-recovery-and-T351-authorization-2026-10-06.md`, SHA256 `0eb65f42297bca4312215850860469dbe8e44fc78216a20f5d6a3e16ebe0cbc1`, adopting `plans/repository-separation-next-2026-10-05/T-351-limited-qualification-exception-proposal-v1.md`, SHA256 `ca1b06f1510b4752b569b61829ab45bef911a2862aa625b4ceba9227d45c0d95`. Fresh independent broad source-guard-removal proof for retained integrity, worker ownership/containment, legacy enforcement and assignment guards remains NOT ESTABLISHED. No stopped a16 mutation activity was resumed, reframed or performed on another surface; its incomplete status and missing-callback UNKNOWN are unchanged. T-351-s1 c7's exception is separate. No functional failure, additional unexcepted proof gap, owed grade or completion uncertainty is waived.

The permitted existing child controls ran unchanged and child module views terminated; source hashes remained unchanged. Shared duplicate-copy evidence `execution/repository-separation-2026-10-05/T-351/recovery/verification-r3/completed-artifacts-v1/duplicate-copy-driver-T-351-a9.log`, SHA256 `b53ce6be1a546378ef29f901a155d491be077a43ec26952b132d2e2abb369b39`, names source `e11b10762952f74742e671688ef466786b155f37`, exact index-copy EACCES before the seat operation, literal hash/mode/clock restoration and successful rerun. Its older filter implementation is not today's stronger Set fixture; the fresh current fixture/mode GREEN is separate, and no fresh duplicate-copy source mutation was run here. The retained source-a20 manifest `execution/repository-separation-2026-10-05/resume-2026-10-22-v1/repair-integration-preparation-v1/retained-source-a20-v1/MANIFEST-T-351-a20.json`, SHA256 `9b030d197ff976cde252cdfab699761e3ba27da961f314a6c4edd02a1bd5e9a2`, was independently hash-verified for all71 members/637355bytes. Its actual public malformed-record RED, initial invalid-byte RED and corrected-source GREEN remain shared repair evidence, never this review's independent discovery or grade. Prior writer/alias source finals were read only after implementation orientation. Earlier rejections remain intact.

Procedural fault: the first focused command's wrapper discarded its yielded session identifier. I stopped issuing shells; the coordinator independently established the actual job's cessation and clear port before explicitly authorizing serial resumption. The retained focused output still proves66 passed; no rerun, invented callback or parallel shell was used to repair that metadata fault. Later yielded jobs were polled to terminal. The own ask file carries actual acknowledgements for evidence retention and the C3/C4 owning disposition. This is not OS isolation or a new blind phase-one claim. No new pack refusal occurred in the measured suites; stale generated currency remains an integrator obligation. Prior Rust watcher failures are separately attributed and no whole-Rust GREEN is claimed.

At-merge correction assignments:0; committed pinning bodies:0; mutant blocks:0. This is an executor-repair rejection, as the owning answer explicitly directs. The retained public data reproducer is the concrete handoff; no unestablished repaired-source GREEN is invented. No merge, push or CI result is claimed. Final review-record grading, exact final ref, tracked cleanliness and ceased owned jobs/port are owed after this entry's commit and are reported separately at genuine completion.


### 2026-10-23 — APPROVED — gpt-6.1-sol@xhigh / T-351-a23

Fresh independent native phase two approves the whole frozen candidate
`5d2bc544b51422e0de35cadc078c0aedfecfb273` under the existing T-351-only
qualification exception. All six unchanged functional criteria pass. This
is a local candidate verdict; integration, generated currency, checkpoint
qualification, publication and exact-tip CI remain separate obligations.

**Frame and binding.** Native thread
`01a1655b-47ee-7fb3-9f39-d11297ffd91e`, canonical task
`/root/t351_qualified_bytes_review_20261022`, detached-verifier profile,
actually probed identity first and waited for successful public binding.
Requested model/effort is gpt-6.1-sol/xhigh; observed model and usage are
unknown. This is a fresh phase-two sitting, not a new blind phase one.
The complete current role, STATE/INDEX, active contract and context pack
were read. The brief and mandatory exception disclosed prior facts;
separate source feedback was opened only after complete changed-path/mode
inventory and implementation/body orientation, including native-codex.
No executor conversation or commit subjects were opened.

**Sealed inputs.** Original attack/ground at original base
`85eb7584e517d379f36df55e83a07f70eb93686c` retain SHA256
`4efed69562a95932d2e0ccf2923d9b9a2f686e47d8b2b74abf28dfead4b75394`
and `b74a3dc4cf43165c5e2cef6333f1ff6af2c30254b76c2d67a0eedf5db9928874`.
The separate completion-reentry attack/ground retain
`4ebe6be51af393056342993d3fb5fd923f4bfe9841756dc4d2755d842866d793`
and `187941cf1dffe6d96e1e6a648ad8fa42bc65327a882a3f62ed48602b44866fa5`;
its actual-frame seal is
`68da86e7c76efb490e7a9595adcff03eeb86f1f579a9ce590ebfc8294dcb6bf7`.
These files were independently hash-checked; reentry ground is pre-alias
e11b, not original 85eb. Criteria were privately confirmed identical
across original, admission, candidate and current main. No raw nested
authority/card history was displayed for orientation.

**Existing evidence.** The closed candidate archive is
[retained-review-a23-candidate-v2](../../../supertaskr-evidence/execution/repository-separation-2026-10-05/resume-2026-10-22-v1/verification-qualified-bytes-v1/retained-review-a23-candidate-v2/MANIFEST-T-351-a23-candidate-v2.json),
manifest SHA256
`74985adfb94c9a93e81d6d1dd9c23b370564a9969ae5b623ad47b297799488fa`.
All 37 members / 877323 bytes were retained and independently verified
before this entry. Artifact filenames below are relative to that archive.
The genuine Retain answer was read and RUN-ACK recorded in the own ask.

| Criterion | Independent deciding evidence at candidate 5d2bc544b51422e0de35cadc078c0aedfecfb273 |
|---|---|
| 1 — complete committed and physical facts | `qualified acquisition freezes complete committed receipts and mixed containment across actual worker checkouts`, validation/base/duplicate-role/alternate-authority cases, colocated binding normalization, and retained origin cases passed in `focused-qualified-lifecycle-T-351.log`. Delivery notes pin request version 1, retained format 2 and public acquire/read/release APIs. |
| 2 — authoritative project domains and worker ownership | Independent versus colocated roots, cross-checkout overlap, genuinely disjoint scopes, containment, worker reuse, unsafe/symlink domains and unsupported topology cases passed in that focused run. Physical replacement at the same worker path independently refused; literal physical restoration restored access in `independent-crash-rebind-control-T-351.json`. |
| 3 — one transaction, complete publication and retained reconstruction | Second-root conflict leaves no partial grant; legacy conflicts refuse in both orders and cold-process acquisition; narrowed/coherently replaced scope, receipt/binding corruption, shared-home malformed authority and invalid UTF-8 refuse without removal. Existing serialization/conflict-disabled child controls passed unchanged. Code review confirms decisive checks and publication share withNativeTransaction and the existing home. |
| 4 — exact repeat, ownership, release and crash retention | Exact repeats ignore incidental PID/time, changed repeats and foreign release refuse, and retained reads/repeats/release survive worker HEAD advancement. An independently terminated acquiring child exited 73; its complete two-root set remained discoverable and blocked a competing owner despite the holder actually being gone. Exact repeat, subsequent commits, physical-rebind refusal/restoration and exact release passed in the independent crash/rebind artifact. |
| 5 — ordinary lifecycle and admission fence | Full run-record lifecycle plus ordinary dependency-absence/unknown-assignment cases passed; complete source grading includes native-codex and adjacent lifecycle suites. Code review finds no native/split admission enablement or CLI escape. Four existing/read-only seat controls passed in `focused-seat-positive-T-351.log`; the stronger push-guard blob remains unchanged. |
| 6 — real fixtures and discriminating controls | Focused qualified/run-record execution passed 68 bodies. Existing independent child controls distinguish one normal winner from two unsafe grants and independently distinguish conflict enforcement. The duplicate-index-copy fixture alone produced setup copyfile EACCES before the seat operation (1 failed); exact source SHA256 restoration then passed the existing case (1 passed). See duplicate-copy patch/log/restoration artifacts. All 13 read-only conventions sources preserved bytes and mode 0444. |

**Complete source grades and coverage.** The independently derived original
range `85eb7584e517d379f36df55e83a07f70eb93686c..5d2bc544b51422e0de35cadc078c0aedfecfb273`
passed parser 469, app 1171 and e2e 1126 bodies over all 22 derived specs,
all exit 0/GREEN at the unchanged source, with a clean tracked tree.
`original-cumulative-grade-T-351.log`, the three original-raw logs,
`original-gate-token-T-351.json` and
`validated-complete-coverage-T-351.json` retain actual evidence.
The complete admitted-replacement range
`4d899fdd17cabfb77f3e08070fb192b9d835f567..5d2bc544b51422e0de35cadc078c0aedfecfb273`
owes the same three suites and 20 specs. Original 22 is a strict superset,
with brief-flush and card-figures additional; replacement has no missing
obligation. Actual token scope exactly matches the original set under the
same configuration. This is measured coverage, not an equality claim or
reuse of executor grades. Graph check was CURRENT.

**Repair and proof boundary.** The source a22 closed 84-member manifest
SHA256 `1a8e4fd7782fb6d3d5f9a702f1d303ce32d505cff2dd43957f29af2350b62874`
was independently verified. Its ordinary byte-data RED at admission 4d899
and corrected-source GREEN, including literal restorations, remain shared
repair evidence; `shared-source-evidence-verified-T-351.json` distinguishes
that evidence from this sitting's fresh 68-body execution and complete
source grade. Fresh byte controls preserve malformed authority, reject
four invalid encodings through every qualified consumer, support valid
Unicode and check literal restored hashes (22 restoration observations).
No new production correction or source-disabling campaign was performed.
Remaining broad fresh independent safety-guard-removal source-drill proof
is **NOT ESTABLISHED** under the exact adopted owner exception; a16 remains
incomplete/no verdict and its missing callback UNKNOWN. This exception is
T-351-only, distinct from T-351-s1 c7, and waives no functional defect,
normal grade, ownership or completion requirement.

**Sweep and exit.** New inputs use argument-vector Git calls, strict
shapes and committed-input/physical identity reconstruction; no dependency,
endpoint, secret or CLI bypass was added. Architecture's existing file
state, transaction and refused split-admission interfaces are preserved.
No unexcepted functional failure, pack gap or dispatch fault was found.
Corrections assigned: 0; correction mutant blocks: 0. All source jobs
actually finished; port 25351 had no listener. An earlier cwd PID's
command attribution remains unknown, its later ESRCH is actual, and the
subsequent probe excludes measured inspector PIDs and finds no remaining
bench cwd process; the archive retains that explicit clarification.
This verdict append creates a new ref: its own complete reviewer-write
grade and final cessation are separately delivered after the final commit,
without a post-grade source or record commit.
