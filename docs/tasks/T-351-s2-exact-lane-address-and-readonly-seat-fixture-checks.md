---
id: T-351-s2
title: Keep lane-address and seat-fixture checks exact at readonly convention inputs
feature: F-04
milestone: 4
priority: 1
size: S
tier: standard
status: verifying
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: []
touches: [tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
built_by:
verified_by:
review: independent
---

Repair the test helpers that falsely fail the native-recovery range when one live lane address is a prefix of another and the conventions source is read-only. Retain the actual product output, source permissions and existing acceptance assertions. This is one fixture/oracle qualification cycle over the two owning specs, not a production guard change.

## Finding

Read at 16c9b0a6d3ecdcc8c1ea1fed3fc29621e6b77376. The linesWith helper in tools/e2e/tests/dispatch-order.spec.ts counts substring matches; the T-351 worktree address is a literal prefix of the T-351-s1 worktree address, so the real-board once-per-lane body counts two rows for the parent. The seatFixture helper in tools/e2e/tests/push-guard.spec.ts copies the conventions index in both its flat documents pass and its canonical conventions-files pass. With the live source read-only, that second copy refuses before the seat command runs. The failed source range is retained in the T-351-s1 handoff; it is not graded green by this card. A narrowly qualified single-copy remedy is already preserved in T-351 candidate a9a651257ab01906481eec5548a7c7c172318d9e, but it has not landed.

## Acceptance criteria

- WHEN tools/e2e/tests/dispatch-order.spec.ts evaluates the once-per-lane address requirement THE oracle SHALL count the requested literal complete address, distinguish parent and sibling addresses sharing a prefix, preserve all existing once-or-absent assertions, and correctly detect an actual repeated address. Controlled cases SHALL include prefix-related worktree and branch addresses and literal punctuation that could be mistaken for a regular expression. The dispatch formatter and provenance output SHALL remain unchanged.
- WHEN tools/e2e/tests/push-guard.spec.ts builds its fixture from read-only conventions THE fixture SHALL copy the canonical index and chapter set once per destination while retaining every other required document. The existing whole seat-verbs bodies SHALL reach their real CLI and retain their guard-installed and UNGUARDED assertions. Source conventions and fixture destination modes SHALL not be relaxed or overwritten to make the copy succeed.
- WHEN independently qualified THE bodies in both owning specs SHALL include positive and negative controls that expose the original helpers and pass the repaired helpers through real rendering or fixture-owned repositories and public seat commands. Record the actual complete-body failures, passing controls, exact source identity and literal source/data property-site discrimination with restoration; setup success or changed expectations alone SHALL not substitute for the required properties. No production dispatch, guard, authority, callback or permission code SHALL change.

## Implementation notes

### Criteria echo — before implementation

- [x] Count a requested complete literal lane address; separate prefix-related worktree and branch addresses and literal punctuation, retain once/absent assertions, and reject genuine repeats without changing rendering or provenance.
- [x] Copy each canonical conventions index/chapter once from readonly inputs while keeping every other document, the complete public seat-verbs assertions, and exact source/destination modes.
- [x] Qualify both helpers with positive and negative controls through real rendering and fixture-owned public commands; record complete-body failures, literal source/data property-site mutants, exact identity and SHA256/mode restoration, with no production or authority change.

Associated repair under the owner's remaining migration grant. Drafted outside the repository for independent pre-dispatch review. Its own native executor and fresh detached verifier require normal admission. The frozen T-351-s1 fence stays unchanged. Preserve the held T-351 source and original failed ranges; no legacy fault or foreign reservation may be cleared to start this repair. Generated documents and final merged-tree qualification are integration work. Requested implementation and review are GPT-6.1 Sol extra-high.

The independent packet review accepted filing conditional on actual preserved-source continuity and normal native admission. Qualify the original failures through complete real address-rendering and seat-verbs bodies in fixture-owned repositories, not synthetic helper loops alone. A fresh verifier assigning corrections must commit its property bodies on its own bench after the verdict and provide one literal mutant block per correction under the standing role, with named-body discrimination, exact restoration and normal integration drills. Existing committed body references alone do not satisfy that rule.


### Executor a2 — implementation and qualification

Code is committed at 074635bf16d1773204113999b9f0d91766f4b886. Only the two owning specs changed: linesWith escapes the literal and counts complete whitespace-delimited address occurrences, including genuine repeated occurrences on one row; seatFixture copies the union of required flat documents and the source's canonical conventions files once per destination. The renderer, provenance, production guards, authority and live source permissions were untouched. No in-fence follow-through was added.

The two new complete bodies use real dispatchContext/dispatchReport/render and independently owned Git seat fixtures running the public take/release commands under the existing harness. The readonly fixture adds its own index-pointer chapter before freezing all canonical source files at 0444; it checks every flat document, canonical SHA256 and destination modes before and after both guarded and UNGUARDED seat verbs. The fixture source identities are printed in each complete-body log.

At the code commit, development controls finished 7 passed, exit 0; typecheck finished exit 0 after a fixture-opener correction and tuple typing repair. Earlier development readings are retained: 6 passed/1 failed because the added index opener carried an extra bullet marker, then typecheck exit 2 for unchecked tuple access and a brief edit syntax error. Those were implementation errors, not source-proof waivers. The current real-board body passed with two live lanes; the historical T-351-s1 source range remains RED and is not regraded by that current-environment pass.

The normal ask helper-drill-and-quiet-job-boundary was answered and ACKed in the lane ask file. The disposable drill repository has independent Git administration and detached HEAD at the exact code commit, no manifest/reservation/binding, only read-only links to existing ignored dependencies/build outputs. Its canonical conventions bytes equal the named candidate and were armed at 0444 as fixture construction. The fixed baseline and final restored positive control each ran all seven complete affected bodies, 7 passed, exit 0.

Self-drill block at 074635bf16d1773204113999b9f0d91766f4b886: nine literal source/data mutants were planted one at a time, read back from their Git diffs, run through complete affected bodies, then restored by SHA256, mode and clock before the next mutant. Every source-mode restoration is 0644.

| Mutant | Complete-body reading | Intended failure site |
|---|---|---|
| address-original | exit 1; 1 failed, 2 passed | original substring oracle reports 3 for the complete parent branch; expected 1 |
| address-regex | exit 1; 1 failed, 2 passed | unescaped literal punctuation reports 0; expected 1 |
| address-capped | exit 1; 1 failed, 2 passed | repeated actual rendered branch reports 1; expected 2 |
| address-absent | exit 1; 1 failed, 2 passed | absent complete address reports 1; expected 0 |
| address-prefix-data | exit 1; 1 failed, 2 passed | source worktree data loses the parent prefix; startsWith control fails |
| seat-original | exit 1; 4 failed | literal original helper's second index copy throws EACCES in all complete seat bodies |
| seat-derived | exit 1; 1 failed, 3 passed | stale live chapter derivation omits the fixture-only chapter; destination identity read throws ENOENT |
| seat-chapter-data | exit 1; 1 failed, 3 passed | the source index pointer no longer names the required fixture-only chapter |
| seat-mode-data | exit 1; 1 failed, 3 passed | source-mode arming data is 0644 while the fixed control requires 0444 |

The original-helper runs demonstrate the positive controls failing when their properties are absent, not only passing after restoration. The address source SHA256 restored after each of its five drills is 8e47307f4f840df7b0d2bf18bb7d3e72d85ab27fd0dca1d67e3dffc29ae50ee9; the seat source SHA256 restored after each of its four drills is 83f8459e0896bb307cb5f97e7af98458dfcba89f3e8041c89b1e754b969bcff1. All named-commit diffs were empty after restoration. All twelve candidate conventions files in the drill fixture retain their exact SHA256 and 0444 modes. Literal old/new blocks, exact mutated hashes, modes, command/PID/PGID/exit receipts, complete logs and source identities are preserved under the executor-a2 scratch, with lane-named files; the report cites them.

Class sweep: the source search for function linesWith/function seatFixture found the owning address oracle, this fixture, and checkout-currency.spec.ts's unrelated one-file fixture. The latter copies no conventions and has no duplicate-copy repair to make. The search's owning hits serve as its nonzero control. No broader repair was performed.

Standing gates for the final three-path footprint: graph regeneration is a merge obligation triggered by the two TypeScript paths; index --check at the code commit exited 0 and reported graph.json CURRENT (203 files, 2659 symbols, 2563 edges). Boot is not owed because no app source, Rust source or manifest changed. The own-card write fired docs-gate-notes at exit 1 (its FIRES result, not a failed suite): all live frontmatter was legal, and parser/app/e2e were named as owed. The original-base graded owed set is derived after this notes commit. Method eval is not owed because neither method text nor a verifier attack-set citation was added. No source or authority widening was required. No process may outlive final executor handoff; exact final group/port evidence is in the report. Requested model/effort are GPT-6.1 Sol/xhigh; observed model, token usage and engine seconds remain unknown until independent native collection.

Corrections to the assembled brief: the stamped builder assignment takes precedence over its inherited template model advice. This tooling-only S card has the independent standard review explicitly assigned by its card and native boundary; this executor holds no integration checkout and will merge/push/remove nothing. The initial ask markers were corrected from ASK to the actual reader's RUN-ASK; the actual normal answer and RUN-ACK govern dependent work. Two fixture preparation checks failed locally before testing (a self-ancestor path match, then symlink dependency paths requiring exact private excludes); no foreign resource was reused, no protected action was refused or forced, and their failed attempts remain in evidence.

The final substantive tip is graded once over the original base 5bc04318a356dbbef14201ae48292096f3e6f4b3, not only over the later code/notes boundary. The last separate commit will change only this card's status to verifying; that status-only exemption reruns no suite and is verified by its exact one-line diff. Fresh independent review still determines acceptance.

## Verdicts

### 2026-10-06 — APPROVED — codex/unknown@T-351-s2-a3

Independent standard review of candidate 37fb34c67d3c2eb30b7e3fc63687be22159e6e33 against original base 5bc04318a356dbbef14201ae48292096f3e6f4b3. Acceptance is local candidate evidence; publication and CI remain separate outcomes. Requested model/effort: gpt-6.1-sol/xhigh. Observed model, effort and usage: unknown.

attack set: sha256:fc5cb186a032f85df0d271204cd8c4ac7a693bedd26d86adc7f4e76a7b7d066b (attack-set-T-351-s2.md)

Ground: sha256:ff8d3ae02370fa1711d85314a6e41a15b35dabf2fb19ede07112c3bcaa1f0325 (ground-T-351-s2.md). Raw base-card integrity: sha256:7b729c9bf3308eb407c3ca534ba55421791f4ab22752cffef54d44198529b3f5. All 27 original sealed-manifest files matched their recorded bytes and hashes. The current specs match the submitted code-commit identities: dispatch-order SHA256 8e47307f4f840df7b0d2bf18bb7d3e72d85ab27fd0dca1d67e3dffc29ae50ee9; push-guard SHA256 83f8459e0896bb307cb5f97e7af98458dfcba89f3e8041c89b1e754b969bcff1. Both source modes are 0644.

| Acceptance criterion | Independent deciding evidence at the candidate |
|---|---|
| Complete literal address oracle, prefixes, punctuation, retained assertions and genuine repeats | The full two-spec implementation diff precedes executor notes/report. The COMPLETE LITERAL LANE ADDRESSES body uses real dispatchContext/dispatchReport/render; the existing once/absent/ruling assertions remain. Five independently planted source/data mutants each ran three complete address bodies and produced 1 failed/2 passed: literal original helper expected 1/received 3; unescaped punctuation expected 1/received 0; capped repetition expected 2/received 1; constant counter expected 0/received 1; damaged worktree-prefix data expected true/received false. A further temporary complete real-render body supplied only siblings and a child address: repaired helper passed, original helper failed absent parent branch expected 0/received 2. Candidate branch fixtures passed Git check-ref-format; no ref collision is presented as an oracle failure. The temporary body and all mutants were restored. Formatter/provenance files are unchanged in the exact original-base diff. |
| Canonical single-copy fixture, other documents, whole public seat bodies and permissions | In a new independent Git fixture detached exactly at the candidate, copied canonical source bytes were armed 0444. Fixed and restored controls each ran all seven affected complete bodies, 7 passed/0 failed. Copy instrumentation recorded 132 successful attempts to 132 distinct destinations, maximum one attempt per destination. The two readonly guarded/bare destinations each received 22 distinct documents, including the fixture-only derived chapter and every required flat document. Real public take/release commands and original installed-guard/UNGUARDED assertions ran. Restoring the literal original helper failed all four complete seat bodies at the second index copy with EACCES. The source conventions in the original executor checkout still match every sealed hash and 0444 mode; this detached bench's normal checkout modes were never changed. |
| Independent positive/negative qualification, exact identities, literal source/data property sites and restoration, unchanged production scope | Nine independent source/data drills were inspected from their actual named-candidate Git diffs before execution. Five address mutants killed the new address body; original seat helper killed all four seat bodies; stale live-source chapter derivation, damaged fixture index pointer, and 0644 arming data each killed only the readonly body with three existing seat bodies passing. Their primary sites were respectively missing fixture chapter ENOENT, expected fixture pointer absent, and expected 0444 arming false. Every source restoration matched candidate SHA256, 0644 mode, exact mtime and empty named-commit diff; canonical fixture bytes/modes remained unchanged. The repaired complete baselines and independently degraded controls distinguish the two properties, rather than counting aggregate kills. The submitted nine records also reconstruct to the exact candidate original/mutant/restored hashes; its retained independent fixture matches the submitted code commit and source hashes. No production dispatch, guard, authority, callback or permission path changed. |

The exact original-base grade was `node tools/e2e/scripts/gate-run.mjs --range 5bc04318a356dbbef14201ae48292096f3e6f4b3..37fb34c67d3c2eb30b7e3fc63687be22159e6e33`: exit 0, parser 469 GREEN, app 1171 GREEN, e2e 803 GREEN over the derived 13-spec scope, all at the named candidate. Initial derivation before dependency preparation failed closed over unresolved parser dist imports; after the documented parser-first build/setup order, no unresolved import remained and parser/app/e2e were owed. The former current-board substring pass after source parking remains an environment observation, not proof about the old oracle; the controlled real rendering supplies that discrimination. Historical source-range REDs are not regraded here.

Security and adjacent behavior: reviewed the full original-base diff, architecture interfaces and implicated convention rules. This three-path repair introduces no public input, endpoint, dependency, secret, authority/permission behavior or production change. The docsRoot parameter is confined to the owned test fixture. The regex escapes literal input before matching; the fixture commands terminate in independently owned repositories. No in-fence follow-through was declared or found. Original-base adjacent reader scope is green.

Actual frame: separate packet-only phase one and fresh native detached phase two, with tools available under a procedural reading restriction, not OS/read isolation. Native identity 01a1116a-dda6-7070-b006-cc4dc646b3ff, canonical task /root/helper_repair_phase2, normal attempt T-351-s2-a3. The first wrong command-prefix read was refused before repository/brief exposure; genuine failed completion and normal lifecycle reconciliation are retained. A later wait-only turn also genuinely ended without repository exposure and was normally continued/rebound. Full standing STATE/INDEX, complete unchanged verifier role and derived pack were read after exact binding. The complete two-spec implementation diff was read before executor notes/report. During metadata checking after that implementation diff, I mistakenly displayed lane-fence.json including raw preparation base-card notes. This breaches the separate no-display instruction: this phase-two sitting is not wholly unexposed. The immutable independent phase-one attack set is unchanged; later raw-card and executor material are disclosed corroborating inputs. The coordinator required preserving this late exposure and continued independent qualification without waiving any criterion. No authority was edited. No pack gap or missing-tier dispatch fault was encountered.

The normal independent-qualification-boundary RUN-ASK was answered through the run lifecycle and actually RUN-ACKed before dependent fixture construction. All host commands retained the literal assigned-bench prefix after reconciliation. Finite serial jobs record exact argv/cwd/PID/PGID/start/end/exit/body counts with ceilings; the original-base grade's PID/PGID 14718 ceased with an empty group. The independent fixture has separate Git administration and no native manifest, binding or reservation. Evidence uses the actor-owned stem supertaskr-V-T-351-s2-a3; full logs, landing patches, source receipts, copy/CLI trace and sealed input references are preserved in the verifier report. Two local reporting-wrapper mistakes are preserved: an initial argument-order refusal launched no job, and a summary query expected an absent optional failClosed key; neither changed a test, candidate source or the actual grade.

Assigned corrections: 0. Newly required committed correction bodies: 0. Correction mutant blocks: 0. The additional temporary boundary attack passed the repaired candidate and assigns no correction. This verdict write still owes its own tree/range checks; the actual report records those separately after this commit, together with final job/port cessation. No frontmatter stamp, merge or push is performed by this verifier.
