---
id: T-351-s2
title: Keep lane-address and seat-fixture checks exact at readonly convention inputs
feature: F-04
milestone: 4
priority: 1
size: S
tier: standard
status: building
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
