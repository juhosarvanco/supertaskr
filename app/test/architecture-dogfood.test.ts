import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import { deriveArchitecture, isDriftFinding, UNMAPPED_ID } from "../src/lib/architecture/derive";
import { GRAPH_PATH, parseGraph } from "../src/lib/architecture/graph";

// THE DOGFOOD CHECK (T-011 acceptance criterion 4): run the derivation on
// THIS repo — the live component registry, the committed graph.json, the
// live task model — and assert the actual findings. This test is the
// current drift truth of the nputer repo, reviewed and pinned; plan §10
// wants the repo driven to zero drift before launch, and this is the
// ratchet that makes each finding a deliberate architect decision
// (T-008-s2 predicted the C-08/C-09 → C-05 pair; the derivation found
// two more, both from the app/test/** umbrella).
//
// Maintenance contract: these expectations change ONLY when the committed
// graph is regenerated (integrator, at TS-touching merges — T-009-s1) or
// the registry/architecture changes (architect). Task-status churn cannot
// move them: drift is intent ⨝ reality, and status/provenance values are
// deliberately NOT asserted here (they live in the unit tables; the live
// values are recorded in T-011's implementation notes).
//
// RECONCILED AT THE T-011 MERGE (2026-08-15, integrator — third
// exercise of the T-009-s1 practice): the regenerated 59-file graph
// includes both this task's own files and T-017's. app/test/** maps to
// C-05 (then 21 files); D2 carried FOUR unclaimed files (the engine
// trio + verdicts.ts) and the unmapped node drew four undeclared
// edges. Those pins were honest current truth, not targets: T-012's
// dispatch carried the registry amendment decision (T-011-s1) meant to
// drain D2 back to empty.
//
// RECONCILED AT T-012's §2 REGISTRY AMENDMENTS (2026-08-15, executor
// claude-fable-5 @T-012, same commit as the amendments — deltas
// enumerated in T-012's implementation notes): C-12 gains depends_on
// C-05+C-09 and claims the engine in place (paths +
// app/src/lib/architecture/** — T-011-s1 option a, decided at
// dispatch); C-05 gains depends_on C-12 and paths
// app/src/components/shell/** + app/src/lib/verdicts.ts. Against the
// same committed 59-file graph: D2 drains to empty (engine trio → C-12,
// verdicts.ts → C-05), D3:C-12 drains (C-12 now has files), the four
// unmapped edges leave the table, C-05→C-12 materializes CONFIRMED
// (the 4 architecture tests' 6 file edges), C-12→C-06 flips planned →
// confirmed (derive.ts → @nputer/parser now counts as C-12's), and the
// verdicts.ts consumers fold into the existing D1s: C-08→C-05 3→4
// (board-model), C-09→C-05 1→2 (TaskDetailPanel). The four remaining
// D1s are launch data (real drift the map exists to show), not
// blemishes; the T-012 code this branch adds is NOT in the committed
// graph until the integrator's merge regen (T-009-s1), which this
// fixture meets again there.
//
// RECONCILED AT THE T-012 MERGE (2026-08-15, integrator — fourth
// exercise of the T-009-s1 practice): the regenerated 75-file graph
// (59→75: eight map-pane sources + PaneRail + seven test suites) now
// contains the map's own code, so the §2 amendments meet reality.
// Deltas, each verified by independent re-derivation before this edit:
// mapping C-05 22→30 (the new tests + the rail), C-12 3→11 (the map
// joins its engine); D2 STAYS EMPTY and the unmapped node stays gone —
// the amended registry claimed everything this branch added. Findings:
// only D1:C-05→C-06 moves, 5→8 file edges (map-dogfood-render,
// map-search, map-view-dom import @nputer/parser under the app/test/**
// umbrella); the other three D1s and D3 C-01/C-07/C-11 are byte-
// unchanged. Relation table: same 23 rows, tally 9/4/10 → 12/4/7 —
// C-12's declared edges to C-05 (4: utils + button), C-09 (4:
// panel-dismissal, task-detail, TaskDetailPanel) and C-10 (1:
// watcher-store) flip planned → CONFIRMED now that its code is
// indexed; C-12→C-06 grows 1→4 (MapPanel/MapView/map-layout join
// derive.ts on the parser); C-05→C-12 6→20 (the map test suites);
// C-05→C-10 5→8 (three new tests consume docs-model). C-12→C-07 and
// C-12→C-11 honestly remain planned: no TS import can confirm a Rust
// crate or a token file. Changed, never loosened.
//
// RECONCILED AT THE T-018 MERGE (2026-08-16, integrator — fifth
// exercise of the T-009-s1 practice): the regenerated 76-file graph
// (75→76: the watcher-truth DOM suite joins under the app/test/**
// umbrella; hash/loc drift on the five files T-018 modified —
// App.tsx, docs-model.ts, watcher-store.ts and their two test
// suites). Deltas, verified against the enumerated edge diff of the
// regen (+21 edges, 0 removed) before this edit: mapping C-05 30→31;
// D2 STAYS EMPTY; findings byte-unchanged — the new suite imports no
// @nputer/parser, so all four D1s and the three D3s hold exactly (no
// new finding families). Relation table: same 23 rows, same 12/4/7
// tally — only C-05→C-10 grows 8→10, both new file edges in the
// DECLARED direction: watcher-truth.test.tsx consumes docs-model
// under the app/test umbrella, and App.tsx itself now imports
// skipReasonPhrase for the skip chip (the first src-side C-05→C-10
// edge). Changed, never loosened.
//
// RECONCILED AT THE T-019 MERGE (2026-08-16, integrator — sixth
// exercise of the T-009-s1 practice): the regenerated 78-file graph
// (76→78: validate.ts joins C-06's src AND validate.test.ts its test
// tree — the branch's own forecast said one file; the indexer's
// lib/parser/test/** coverage makes it two). Deltas, verified against
// the enumerated edge diff of the regen (+20 edges, 0 removed;
// symbols 441→449, +8/0) and an independent re-derivation before this
// edit: mapping C-06 19→21; D2 STAYS EMPTY; findings byte-unchanged —
// every new edge is C-06-internal (both assemblers gain a call edge
// into validateProject; the new test imports index/pure) or
// package-bound (node:fs/os/path, vitest), so no cross-component file
// edge moved: all four D1s, the three D3s, and the whole 23-row
// relation table hold exactly (same 12/4/7 tally, every observedCount
// unchanged — the three parser-importing app suites T-019 touched
// were already in the C-05→C-06 D1 list). Hash/loc drift on the
// fifteen pre-existing files T-019 modified (six parser src, four
// parser tests, TaskDetailPanel/task-detail, three app suites), plus
// this fixture pair's own reconciliation edits — picked up because
// the final regen runs after these lines land (the ceaa949 ordering
// lesson, sixth hold). Changed, never loosened.

// RECONCILED AT T-024 (2026-08-16, executor claude-opus-5 @T-024, same
// commit as the registry addition): the branch declares C-13 genesis
// pane (paths app/src/genesis/**, depends_on C-10 + C-11) per the task
// spec and the T-012 §2 precedent. The committed graph is an index
// snapshot that predates app/src/genesis/, so C-13 lands as a FOURTH
// declared-only component — a true D3, structurally identical to
// C-01/C-07/C-11, and it clears itself the next time the indexer runs
// over a tree containing the pane. Delta, enumerated and changed
// (never loosened): registry 9 → 10 ids; declared count 9 → 10;
// findings gain D3:C-13 (three declared-only → four; the four D1 rows
// are byte-unchanged); relation table 23 → 25 rows, the two additions
// being C-13→C-10 and C-13→C-11, both PLANNED with observedCount 0 —
// honestly so, since no indexed file can confirm an import that the
// graph has never seen (the same reason C-12→C-07 and C-12→C-11 stay
// planned); tally 12 confirmed / 4 undeclared / 7 → 9 planned; drift
// nodes 6 → 7. Every pre-existing row, count and file edge is
// untouched — the only movement in this fixture is C-13's own arrival.
//
// RECONCILED AT THE T-024 MERGE (2026-08-16, integrator — ninth
// exercise of the practice, first since T-009-s1 was ratified into
// docs/CONVENTIONS.md as the INTERIM integrator rule): the
// regenerated 82-file graph (78→82: GenesisPane.tsx + genesis-derive.ts
// under C-13's own paths, and their two suites under the app/test/**
// umbrella) finally contains the pane, so the block above meets
// reality and MOST of it reverses. Deltas, each independently
// re-derived from the raw graph (file→component globs, cross-component
// import edges, declared-vs-observed classification) before this edit,
// not read off the failure output:
//   · mapping 78→82; C-05 31→33 (the two new suites), C-13 0→2.
//   · D2 STAYS EMPTY; the unmapped node stays gone.
//   · D3:C-13 CLEARS — C-13 now has indexed files; declared-only is
//     back to the three non-code components C-01/C-07/C-11, and the
//     drift set drops from 7 nodes to 6.
//   · C-13→C-10 flips planned → CONFIRMED (2 file edges: both genesis
//     sources import docs-model). C-13→C-11 honestly STAYS planned —
//     no TS import can confirm a stylesheet edge, the same state
//     C-12→C-11 carries.
// TWO DELTAS THE PRE-MERGE FORECAST DID NOT PREDICT, both from the
// app/test/** umbrella rather than from the pane's own imports — the
// forecast reasoned only over app/src/genesis/:
//   · a FIFTH undeclared edge appears: D1:C-05→C-13, observedCount 2
//     (genesis-derive.test.ts → genesis-derive.ts, genesis-pane-dom.
//     test.tsx → GenesisPane.tsx). C-05's suites consume a child
//     component it does not declare — structurally identical to the
//     existing D1:C-05→C-06 and D1:C-05→C-09, and it lands C-05 on
//     three drift findings. The tally moves 12/4/7 → 13/5/8.
//   · C-05→C-10 grows 10→13: both new suites import docs-model and
//     genesis-pane-dom.test.tsx also drives watcher-store.
// Everything else — the four pre-existing D1 rows, the two remaining
// D3s, C-12's file list, and every other observedCount — is
// byte-unchanged. Changed, never loosened.
//
// RECONCILED AT THE T-026 MERGE (2026-08-16, integrator — eleventh
// exercise of the practice): the regenerated 84-file graph (82→84:
// app/src/components/shell/GenesisScreen.tsx under C-05's shell glob,
// and app/test/genesis-entry.test.tsx under the app/test/** umbrella;
// nothing removed). Deltas, each independently re-derived from the raw
// graph — the added/removed edge sets enumerated in full and every new
// file edge classified by component pair — before this edit, not read
// off the failure output:
//   · stats 82→84 files, 513→539 symbols, 871→909 edges (43 edges
//     added, 5 removed — the five removals are watcher-store-internal
//     call/type_ref edges the picker refactor retired: applyDocsPayload
//     now reaches buildEcho through sendEcho, pickProjectFolder through
//     the shared runPicker, and selectScreen's noDocsMessage is gone).
//   · mapping 82→84; C-05 33→35. Every other component's count holds
//     (C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, C-13 2). D2 STAYS
//     EMPTY; the unmapped node stays gone.
//   · findings BYTE-UNCHANGED — all five D1 rows and both remaining D3s
//     hold exactly. The umbrella surprise that T-024's merge produced
//     did NOT recur: genesis-entry.test.tsx imports App.tsx (C-05),
//     docs-model and watcher-store (C-10, already confirmed) and three
//     packages, and it does NOT reach into app/src/genesis/ — T-026's
//     seam is a SLOT, not an import, so no new component pair appears
//     and D1:C-05→C-13 keeps its two file edges.
//   · relation table: same 26 rows, same 13 confirmed / 5 undeclared /
//     8 planned tally. Exactly one observedCount moves — C-05→C-10
//     10→13→16, the three new file edges being GenesisScreen.tsx →
//     docs-model (the first shell-side src edge from this component),
//     genesis-entry.test.tsx → docs-model, and genesis-entry.test.tsx →
//     watcher-store. All three are in the DECLARED direction.
//   · hash/loc drift on the four pre-existing files T-026 modified
//     (App.tsx 311→428, watcher-store.ts 382→560, project-shell.test.tsx
//     127→215, watcher-store.test.ts 242→375), plus this fixture pair's
//     own reconciliation edits — picked up because the final regen runs
//     after these lines land (the ceaa949 ordering lesson, eighth hold).
// Note for the record: the branch's own forecast (78→80 files, C-05→
// C-10 10→13) was measured against the pre-T-024 base and its absolute
// numbers do not apply here; its DELTAS (+2 files, +26 symbols, +38
// edges, +3 on that one row) reproduce exactly. Changed, never loosened.
//
// RECONCILED AT THE T-037 MERGE (2026-08-16, integrator — twelfth
// exercise of the practice): the regenerated 86-file graph. This is the
// merge that MOUNTED the lens, so for the first time the delta is the
// point rather than a side effect. Every number below was re-derived
// here from the raw graph (full added/removed edge-set enumeration) and
// from an independent re-run of the derivation engine, before this edit
// — not read off the failure output and not taken from the branch's
// forecast (which, unusually, matched in every particular):
//   · stats 84→86 files, 539→565 symbols, 909→941 edges — 32 added,
//     ZERO removed. The two new files are app/test/genesis-mount.test.tsx
//     and app/test/genesis-pane-boundary.test.tsx; nothing removed.
//     Content-changed (hash/loc/symbols only): GenesisScreen.tsx (73→141
//     loc, and it gains a second symbol — the GenesisPaneBoundary class),
//     genesis-entry.test.tsx (220→235), node-builtins.d.ts (28→30).
//   · THE EDGE THIS MERGE EXISTS FOR: f:app/src/components/shell/
//     GenesisScreen.tsx --import[GenesisPane]--> f:app/src/genesis/
//     GenesisPane.tsx. T-026's merge measured that edge's ABSENCE three
//     ways as proof the lens was unmounted; it is present now.
//   · mapping 84→86; C-05 35→37 (both new suites land under the
//     app/test/** umbrella). Every other component's count holds —
//     C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, and C-13 STAYS 2: the
//     lens gained a consumer, not a file. D2 STAYS EMPTY; the unmapped
//     node stays gone; derived.issues stays [].
//   · findings: no finding added or removed — still five D1 rows and the
//     same three D3s. D1:C-05→C-13's fileEdges goes 2→4, gaining
//     GenesisScreen.tsx→GenesisPane.tsx (sorted FIRST, ahead of the
//     app/test/ entries) and genesis-pane-boundary.test.tsx→
//     GenesisPane.tsx (sorted third). Everything else byte-identical.
//   · relation table: same 26 rows, same 13 confirmed / 5 undeclared /
//     8 planned tally. EXACTLY TWO observedCounts move — C-05→C-10
//     16→19 and C-05→C-13 2→4.
//   · INTEGRATOR JUDGMENT, recorded because the next reader will ask.
//     C-05→C-13 stays UNDECLARED, deliberately. Its character changed at
//     this merge — it was two of C-05's own test suites reaching a child
//     component (arguably umbrella noise); it now carries a genuine
//     SOURCE dependency of the shell on the lens, the same shape as the
//     declared C-05→C-08 and C-05→C-12. Declaring it (a `depends_on`
//     C-13 in docs/architecture/components/C-05-app.md) would drain this
//     D1 honestly and move the tally to 14/4/8. It was NOT taken here:
//     (a) this fixture's own maintenance contract names two different
//     actors — the integrator regenerates the graph, the ARCHITECT
//     changes the registry — and a depends_on edit changes DERIVED
//     OUTPUT (a finding drains, the tally moves), which is a ruling, not
//     a merge-time truth-fix; (b) the composition is explicitly
//     provisional and on the @human list right now — T-024's pane sits
//     full-width inside T-026's card frame only until T-027 builds the
//     split view around it; (c) draining a finding at the same merge
//     that first made it meaningful destroys the signal before any
//     architect reads it. Filed for triage, not taken. For the record,
//     and correcting a widely-held belief: such an edit would NOT move
//     lib/parser/test/smoke.test.ts — that suite pins the component ID
//     LIST and C-06's shape, plus a referential-integrity loop C-13
//     already satisfies. THREE fixtures move when a COMPONENT is
//     declared (the T-024 lesson); a depends_on edit moves this file
//     only.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-037
//     declares no component and changes no registry file.
//   · The ceaa949 ordering lesson, NINTH hold, and measured this time
//     rather than asserted: regenerating before these lines landed gave
//     sha 413ddaec…; regenerating after them gives a different sha, so a
//     regen-first ordering would have committed a stale graph.
//
// RECONCILED AT T-025 (2026-08-16, executor claude-opus-5 @fresh): the
// branch declares C-14 agent runner (paths app/src-tauri/src/agent/** +
// app/src/lib/agent-store.ts, depends_on [C-10], slug app-agent) per the
// task spec and the T-012 §2 precedent. This is a REGISTRY-ONLY move —
// the committed graph.json is NOT regenerated in-branch (that is the
// integrator's ritual, T-009-s1), so C-14 arrives with zero indexed
// files and the graph-derived numbers are untouched. Every delta below
// was re-derived from the failure-free half of the suite, not read off a
// diff:
//   · registry 10 → 11 ids; declared 10 → 11; placeholders still 0.
//   · mapping STAYS 84 and every per-component count is byte-unchanged
//     (C-05 35, C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, C-13 2) —
//     C-14 claims two paths the committed graph has never seen. D2 stays
//     empty; `unmappedFiles` stays empty. Its Rust path is invisible to
//     the indexer until T-010 lands Rust extraction; agent-store.ts is
//     ordinary TS and WILL join at the merge regen, which is exactly
//     when D3:C-14 clears — the same arc C-13 walked at T-024/T-012.
//   · findings gain exactly one row, D3:C-14 (declared-only), appended
//     after D3:C-11 in id order. All five D1 rows byte-unchanged.
//   · relation table 26 → 27 rows: C-14→C-10 lands PLANNED with
//     observedCount 0 — honestly planned, because no TS import in the
//     committed graph can confirm a Rust-side dependency yet (the same
//     state C-12→C-07 carries). The 13 confirmed / 5 undeclared tally
//     holds; planned goes 8 → 9.
//   · drift gains C-14 (it is a D3 source); declaredOnly gains C-14.
// Changed, never loosened: every assertion is still a whole-array
// toEqual, and no pre-existing value moved.
//
// RECONCILED AT THE T-025 MERGE (2026-08-16, integrator — THIRTEENTH
// exercise of the practice), and this block SUPERSEDES the absolute
// numbers in the branch block directly above. Read those two blocks as
// two halves of one merge: the branch moved the REGISTRY-derived numbers
// (it declares C-14) against its own branch point f7fdf13, where the
// mapping was 84; main had meanwhile moved the GRAPH-derived numbers to
// 86 at the T-037 merge. Both edit sets survive here — the same
// "absolute numbers do not apply, deltas do" note the T-024 block above
// carries. Every number below re-derived twice before this edit: once
// from the raw graph by enumerating the added/removed file and edge
// sets, once from an independent re-run of the derivation engine. They
// agreed, and both agreed with the branch's forecast:
//   · stats 86→88 files, 565→595 symbols, 941→990 edges — 49 added,
//     ZERO removed. The two new files are app/src/lib/agent-store.ts
//     (C-14's own, by its explicit declared path) and
//     app/test/agent-store.test.ts (C-05's, by the app/test/** umbrella);
//     nothing removed. Content-changed (hash/loc only, symbol counts
//     unmoved): this file 567→608 loc, map-dogfood-render.test.tsx
//     186→189, lib/parser/test/smoke.test.ts 82→95 — i.e. exactly the
//     three registry pins the BRANCH moved, picked up because the final
//     regen runs after these lines land (ceaa949, TENTH hold).
//   · THE FIVE NEW .rs FILES ARE INVISIBLE, and that is not a bug:
//     app/src-tauri/src/agent/{mod,adapter,kit,runner,sessions}.rs are
//     C-14's larger half by far (~3,200 lines) and the indexer's
//     languages is still ["ts"]. They join at T-010. Until then C-14's
//     indexed footprint is one TS file and the map under-reports it.
//   · mapping 86→88; C-05 37→38, C-14 0→1. Every other count holds —
//     C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, C-13 2. D2 stays empty,
//     unmappedFiles stays empty, derived.issues stays [].
//   · findings: ONE ADDED, ONE CLEARED, net unchanged at eight rows.
//     D3:C-14 clears (C-14 has a file now) and D1:C-05→C-14 appears with
//     one file edge. The branch predicted both. All five pre-existing D1
//     rows byte-unchanged, including D1:C-05→C-13's four fileEdges from
//     the T-037 merge — checked explicitly at the conflict resolution,
//     because a take-one-side merge would have silently reverted them.
//   · relation table 27→28 rows: C-05→C-14 lands UNDECLARED with
//     observedCount 1. Tally 13 confirmed / 5 undeclared / 9 planned →
//     13 confirmed / 6 undeclared / 9 planned. C-14→C-10 STAYS PLANNED
//     at 0, exactly as the branch called it: agent-store.ts imports only
//     @tauri-apps/api, so no TS import can confirm the Rust-side
//     WatchState dependency until T-010.
//   · drift LOSES C-14 and declaredOnly LOSES C-14 — the branch put it
//     in both (it had no file), the regen takes it back out (it has
//     one). A component that appears and clears inside one merge.
//   · INTEGRATOR JUDGMENT, same call as T-037's and for the same
//     reasons: C-05→C-14 stays UNDECLARED. It is genuine drift of the
//     familiar umbrella shape (C-05's own suite reaching a child
//     component's module) and the honest drain would be a `depends_on`
//     C-14 in C-05-app.md — a REGISTRY edit, the architect's call, not
//     the integrator's, and one that would move the tally to 14/5/9.
//     Filed for triage alongside T-037's identical C-05→C-13 question;
//     they should be ruled together, since they are one question asked
//     twice.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched HERE: the
//     branch already moved it (+C-14, eleven ids) because it declares a
//     component — the T-024 three-fixtures lesson. A merge regen alone
//     never moves it.
//
// RECONCILED AT THE T-041 MERGE (2026-08-16, integrator — sixteenth
// exercise of the practice; the fourteenth and fifteenth, at T-039's
// and T-046's merges, fired and were NO-OPS, which is why this file
// skips from T-025 to here). Every number below re-derived from the raw
// graph by full added/removed file-and-edge enumeration against
// `git show HEAD:docs/architecture/graph.json`, and from an independent
// re-run of the derivation engine, before this edit:
//   · stats 88→89 files, 595→602 symbols, 990→1003 edges — 15 added and,
//     for the first time in this file's history, TWO REMOVED. That is not
//     churn, it is the branch's one refactor showing up as topology:
//     `runPicker`→`reducePickOutcome` and `runPicker`→`sendEcho` are gone,
//     replaced by `runPicker`→`commitPickOutcome` plus that new symbol's
//     own three call edges. The extracted function is the +17 bytes the
//     verifier measured in the shipped bundle, seen from the other side.
//   · one new file, app/test/shell-harness.test.ts; nothing removed.
//     Content-changed: app/src/lib/watcher-store.ts, 560→659 loc and
//     37→40 symbols (ShellHarnessSnapshot, shellHarnessSnapshot,
//     commitPickOutcome).
//   · THE FIVE tools/e2e FILES IN THIS MERGE ARE INVISIBLE, checked
//     rather than assumed: .nputerignore:8 is `tools/`, and the
//     regenerated file list contains zero paths under it. The lane's
//     three specs and two modules cannot move the map, which is why a
//     merge that lands ten new tests moves the graph by one file.
//   · mapping 88→89; C-05 38→39 (the new suite lands under the
//     app/test/** umbrella). Every other count holds — C-06 21, C-08 10,
//     C-09 3, C-10 2, C-12 11, C-13 2, C-14 1. D2 stays empty, the
//     unmapped node stays gone, derived.issues stays [].
//   · findings: NOTHING added, nothing removed, nothing renumbered —
//     five D1 rows and three D3s, byte-identical. The new suite's only
//     cross-component import is watcher-store, and C-05→C-10 is already
//     CONFIRMED, so it deepens an honest edge instead of raising a
//     finding.
//   · relation table: same 28 rows, same 13 confirmed / 6 undeclared /
//     9 planned tally. EXACTLY ONE observedCount moves — C-05→C-10
//     19→20.
//   · FOUR assertions moved here, not three. T-041's verifier forecast
//     three (this file's count, the C-05→C-10 cell, and the map header
//     string) and every one of those is right; the fourth —
//     ["C-05", 38] → 39 in the counts table — is in the same it() body
//     as the count, so vitest stopped at the first failing expect and
//     never reached it. Recorded because the miss is structural, not
//     careless: a forecast read off a failure list under-counts every
//     assertion that sits behind another in the same test.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-041
//     declares no component and changes no registry file — the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     by re-running lib/parser after the regen: 159/159, unmoved.
//   · The ceaa949 ordering lesson, TENTH hold, measured again:
//     regenerating BEFORE these lines landed gave sha
//     83ba6f02588c2481900a3101489542d00a639f4ab44b5758b8cd0ebee68e7e05;
//     regenerating after them gives a different one, because this file
//     and map-dogfood-render.test.tsx are both indexed. Fixture edits
//     first, final regen last.
//
// RECONCILED AT THE T-048 MERGE (2026-08-16, integrator — eighteenth
// exercise of the practice). Every number re-derived from the raw graph
// by added/removed/content-changed enumeration against
// `git show HEAD:docs/architecture/graph.json` before this edit:
//   · stats 89→90 files, 602→616 symbols, 1003→1013 edges.
//   · ONE new file, app/test/shell-frame.test.tsx; nothing removed.
//     Content-changed (hash/loc only): app/src/App.tsx and
//     app/src/components/shell/GenesisScreen.tsx — T-048's two class
//     edits plus the comments that explain them. No symbol added or
//     removed in either; the layout fix moves no interface.
//   · mapping 89→90; C-05 39→40 (the new suite lands under the
//     app/test/** umbrella again). Every other count holds — C-06 21,
//     C-08 10, C-09 3, C-10 2, C-12 11, C-13 2, C-14 1. D2 stays empty,
//     the unmapped node stays gone, derived.issues stays [].
//   · findings: NOTHING added, removed or renumbered — five D1 rows and
//     three D3s, byte-identical. shell-frame.test.tsx's only
//     cross-component import is docs-model, and C-05→C-10 is already
//     CONFIRMED, so it deepens an honest edge instead of raising a
//     finding.
//   · relation table: same 28 rows, same 13 confirmed / 6 undeclared /
//     9 planned tally. EXACTLY ONE observedCount moves — C-05→C-10
//     20→21.
//   · FOUR assertions moved here, not three — THE SAME STRUCTURAL MISS
//     T-041 RECORDED ABOVE, REPEATED BY T-048's VERIFIER AND CAUGHT AT
//     THE MERGE. The branch forecast exactly three (this file's count,
//     the C-05→C-10 cell, the map header string) and all three are
//     right; the fourth — ["C-05", 39] → 40 — sits in the same it()
//     body as the count, so vitest stopped at the first failing expect
//     and never reached it. The lesson is now twice-proven and worth
//     stating as a rule: a graph regen that adds a file under a
//     component's glob ALWAYS moves that component's counts-table row,
//     and a forecast read off a failure list can never see it. Derive
//     it from the added-file list, not from the red.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-048
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     by re-running lib/parser after the regen: 159/159, unmoved.
//   · The ceaa949 ordering lesson, ELEVENTH hold: this block and the
//     map fixture are both indexed, so they were edited BEFORE the
//     final regen and the regen was run twice for byte-identity.
//
// RECONCILED AT THE T-049 MERGE (2026-08-16, integrator — nineteenth
// exercise of the practice). Every number re-derived from the raw graph
// by added/removed/content-changed enumeration against
// `git show HEAD:docs/architecture/graph.json` before this edit:
//   · stats 90→92 files, 616→642 symbols, 1013→1038 edges.
//   · TWO new files, app/src/components/shell/accelerators.ts and
//     app/test/accelerators.test.tsx; nothing removed.
//     tools/e2e/tests/accelerators.spec.ts is invisible — .nputerignore
//     carries tools/. Content-changed (hash/loc only): app/src/App.tsx
//     (loc 461→487) and app/test/project-shell.test.tsx (215→297).
//   · mapping 90→92; C-05 40→42, because BOTH new files land in C-05's
//     globs — app/src/components/shell/** and app/test/** — and the
//     registry was checked to confirm C-05 is their ONLY claimant, so
//     neither could go anywhere else. Every other count holds: C-06 21,
//     C-08 10, C-09 3, C-10 2, C-12 11, C-13 2, C-14 1. D2 stays empty,
//     the unmapped node stays gone, derived.issues stays [].
//   · findings: NOTHING added, removed or renumbered. The new module
//     lives in C-05's own declared territory (the alternative was
//     measured: at app/src/lib/accelerators.ts the regen raises a
//     D2:unmapped and moves SEVEN assertions, including the map's
//     unmapped bucket this file asserts cannot exist).
//   · relation table: same 28 rows, same 13 confirmed / 6 undeclared /
//     9 planned tally. EXACTLY ONE observedCount moves — C-05→C-10
//     21→23, the two new imports accelerators.test.tsx makes of
//     docs-model and watcher-store, both C-10 files, on an edge that is
//     already CONFIRMED.
//   · FOUR assertions moved here, not three, AND THE RULE ABOVE IS WHAT
//     CAUGHT IT — used as a rule this time rather than relearned. The
//     branch forecast exactly three (this file's count, the C-05→C-10
//     cell, the map header string) and all three are right; the fourth,
//     ["C-05", 40] → 42, was derived from the ADDED-FILE LIST before a
//     single test was run — both new files match C-05 globs, therefore
//     its counts row moves by two — and never appeared in any red,
//     because it sits behind the file count in the same it() body. That
//     is three merges in a row where three was forecast and four moved.
//     The rule holds; read it above and apply it, do not rediscover it.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-049
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     by re-running lib/parser after the regen: 159/159, unmoved.
//   · The ceaa949 ordering lesson, TWELFTH hold: this block and the map
//     fixture are both indexed, so they were edited BEFORE the final
//     regen and the regen was run twice for byte-identity.
//
// RECONCILED AT THE T-050 MERGE (2026-08-17, integrator — twentieth
// exercise of the practice). Every number below re-derived from the raw
// graph — added/removed/content-changed enumeration plus an INDEPENDENT
// re-derivation of the file→component mapping and the cross-component
// import pairs, written against the registry globs rather than run
// through this app's own derive.ts — against
// `git show HEAD:docs/architecture/graph.json`, before this edit:
//   · stats 92→94 files, 642→667 symbols, 1038→1063 edges — 29 added
//     and FOUR REMOVED. The removals are not churn, they are T-050's one
//     refactor seen as topology: `startDocsWatcher` no longer does the
//     work itself, so its four outgoing edges (calls to applyDocsPayload
//     and applyProjectStatus, type_refs to DocsSnapshotPayload and
//     ProjectStatusPayload) move to the extracted `runStartup`. The
//     latch became a wrapper and the graph says so.
//   · TWO new files, app/test/startup-recovery.test.ts and
//     app/test/startup-screen.test.tsx; nothing removed.
//     tools/e2e/tests/startup-recovery.spec.ts is invisible —
//     .nputerignore carries tools/. Content-changed: app/src/App.tsx
//     (loc 487→623, symbols 6→8 — StartupScreen and startupStepPhrase),
//     app/src/lib/watcher-store.ts (659→841, symbols 40→45 —
//     StartupStep, StartupFailure, runStartup, recordStartupFailure and
//     the harness door), and hash/loc only on app/test/shell-harness.
//     test.ts (312→328) and app/test/watcher-store.test.ts (375→383).
//   · mapping 92→94; C-05 42→44, because BOTH new files land under
//     app/test/**, and the registry was swept to confirm C-05 is that
//     glob's ONLY claimant. D2 stays empty, the unmapped node stays
//     gone, no file is ambiguous, derived.issues stays [].
//   · findings: NOTHING added, removed or renumbered — six D1 rows and
//     three D3s, byte-identical. No new component PAIR appears: the two
//     new suites reach only watcher-store (C-10, an already-CONFIRMED
//     edge) and App.tsx (C-05's own), so neither can raise a finding.
//   · relation table: same 28 rows, same 13 confirmed / 6 undeclared /
//     9 planned tally. EXACTLY ONE observedCount moves — C-05→C-10
//     23→24. Note WHICH import it is: startup-recovery.test.ts reaches
//     the store through a DYNAMIC `await import("../src/lib/watcher-
//     store")` (it must, to re-import a fresh module per case), and the
//     indexer resolves that to the same file edge a static import would
//     — checked here rather than assumed, because a missing dynamic-
//     import edge would have shown up as "no assertion moved" and read
//     as an ordinary no-op regen. startup-screen.test.tsx's only
//     dynamic import is ../src/App, C-05's own, so it crosses nothing.
//   · FOUR assertions moved in this file again, and for the fourth
//     merge running the fourth was ["C-05", 42] → 44, derived from the
//     ADDED-FILE LIST before anything was run. The rule stated at T-048
//     and used at T-049 is now used a second time rather than
//     rediscovered: it is load-bearing, keep it.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-050
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     by re-running lib/parser after the regen: 159/159, unmoved.
//   · The ceaa949 ordering lesson, THIRTEENTH hold: this block and the
//     map fixture are both indexed, so they were edited BEFORE the
//     final regen and the regen was run twice for byte-identity.
//
// RECONCILED AT THE T-030 MERGE (2026-08-17, integrator — twenty-first
// exercise of the practice, and the FIRST in which the graph MOVED and
// not one assertion in this file did). That combination is the reason
// this block exists at all: a green fixture after a regen must not be
// read as "the regen was a no-op". Every number re-derived from the raw
// graph against `git show HEAD:docs/architecture/graph.json`, plus an
// INDEPENDENT re-derivation of the file→component mapping written
// against the registry globs rather than run through this app's own
// derive.ts — before this edit, and BEFORE the suite was re-run:
//   · stats 94 files (UNCHANGED), 667→670 symbols, 1063→1069 edges —
//     8 added, 2 removed. ZERO files added, ZERO removed: T-030 is a
//     lib/parser-only branch whose new tests EXTENDED the four existing
//     test files rather than adding any, so C-06 gains no node.
//   · the three new symbols are all UNEXPORTED top-level functions —
//     stripHtmlComments (roadmap.ts), blockedByCycles (validate.ts),
//     anchoredIdiomFor (component.ts) — which is the standing evidence
//     that this graph records unexported symbols, re-confirmed here.
//   · the 2 "removed" edges are NOT removals. They are two import edges
//     whose `symbols` list WIDENED, which the graph models by value:
//     validate.ts→types.ts gains TaskRecord, and model-session.test.ts→
//     index.ts gains parseProjectFromFiles. No module PAIR became
//     connected, so the branch's "no new import edges" forecast is right
//     in substance and only looks wrong in the raw edge diff. Worth
//     knowing before someone reads a remove/add pair as churn.
//   · content-changed (hash/loc only, no node): all NINE are under
//     lib/parser/ — src roadmap 93→144, validate 136→287, component
//     330→404, model-session 32→75, types 287→320; test component
//     606→734, model-session 54→172, roadmap 89→234, validate 392→640.
//   · mapping 94→94 and BYTE-IDENTICAL per component (C-05 44, C-06 21,
//     C-08 10, C-09 3, C-10 2, C-12 11, C-13 2, C-14 1), zero unclaimed,
//     zero ambiguous. It CANNOT have moved and the reason is worth
//     stating: the file SET is unchanged and the globs are unchanged, so
//     the mapping is unchanged whatever the glob semantics are.
//   · findings and the 28-row relation table BYTE-UNCHANGED, tally still
//     13 confirmed / 6 undeclared / 9 planned, D2 empty, the unmapped
//     node still gone, derived.issues still []. DERIVED, not observed:
//     the registry was swept and `lib/parser/**` (C-06) is the ONLY
//     pattern in all 41 globs that can match a lib/parser path, so all
//     ten changed edges are C-06-INTERNAL by construction and no
//     cross-component pair count can move. Every one was classified and
//     every one is C-06→C-06. Same conclusion the T-019 block reached,
//     and the same mechanism.
//   · NO assertion moved here, and none in map-dogfood-render.test.tsx
//     either — its comment log tracks the FILE COUNT, which held at 94,
//     so that fixture is deliberately untouched. The GENERAL RULE, now
//     that it has been derived once: a lib/parser-only change is
//     structurally incapable of moving either app fixture unless it adds
//     or removes a FILE, or the REGISTRY changes. T-031 and T-032 are
//     next in this lane; use the rule rather than rediscovering it.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-030
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     rather than assumed by re-running lib/parser: 197/197.
//   · The ceaa949 ordering lesson, FOURTEENTH hold: this block is itself
//     indexed, so it was written BEFORE the final regen and the regen
//     was then run twice for byte-identity.
//
// RECONCILED AT THE T-034 MERGE (2026-08-17, integrator — TWENTY-THIRD
// exercise of the practice; the twenty-second was T-045's, which fired
// and was a verified no-op, so it left no block here). Every number
// re-derived from the raw graph against
// `git show 8857e7c:docs/architecture/graph.json`, plus an INDEPENDENT
// re-derivation of the file→component mapping and every cross-component
// import pair, written against the registry globs in my own script
// rather than run through this app's derive.ts — all of it BEFORE this
// edit and BEFORE the suite was re-run:
//   · stats 94→99 files, 670→738 symbols, 1069→1158 edges. The edge
//     total moves by +89 and the split matters: import +19, call +29,
//     type_ref +41. The branch's notes forecast "edges → 1082" by
//     adding only the 19 IMPORT edges to the total, which is a category
//     error the verifier caught. Only the 19 imports can move anything
//     in this file (derive.ts line 392 skips every non-import edge), so
//     the other 70 are real graph movement with zero fixture reach —
//     worth stating, because "edges grew by 89 and four counts moved"
//     otherwise reads as an under-reconciliation.
//   · FIVE files added, NOTHING removed: app/src/architecture/
//     TasksLens.tsx, map-lens.ts and task-waves.ts (C-12), and
//     app/test/map-task-waves.test.ts and map-tasks-lens-dom.test.tsx
//     (C-05). Content-changed: app/src/architecture/MapView.tsx (the
//     lens control) and app/src/architecture/map-layout.ts — the second
//     is the ONE-BYTE control-character correction (a literal U+0003
//     that T-012 shipped, replaced by its escape), behaviour-identical
//     and hash-visible. The branch's notes forecast only MapView.tsx as
//     content-changed; map-layout.ts moves too, and a reader who did
//     not know why would read it as an unexplained edit.
//   · mapping 94→99; C-05 44→46 and C-12 11→14, and the registry was
//     swept so both are derivable before any test runs — app/test/** has
//     exactly one claimant (C-05) and app/src/architecture/** exactly
//     one (C-12). D2 empty, unmapped node still gone, nothing ambiguous,
//     derived.issues still [].
//   · THE C-12 FILE LIST MOVES TOO, and this is the assertion neither
//     branch role forecast. The builder enumerated eight moving
//     assertions and the verifier corrected it to nine; the real count
//     is TWELVE, and the three they both missed are all LISTS rather
//     than counts — C-12's own `files` array (11→14 entries), which
//     sits in the SAME `it()` body as the file count and the per-
//     component counts, and the D1:C-05→C-06 `fileEdges` list (8→10),
//     which the verifier did catch. This is the fixture's standing trap
//     firing for the SIXTH merge running: a count assertion masks a list
//     assertion below it in the same body, and vitest never reaches the
//     second while the first is red. THE RULE, restated because it keeps
//     paying: read every `expect` in the body you are about to touch and
//     derive it from the added-file list; never let the failure output
//     enumerate the work for you. Extended form for whoever is next:
//     the trap is not only counts-behind-counts, it is LISTS behind
//     counts, and a list can move while every count in the same body is
//     already correct.
//   · findings: NOTHING added, removed or renumbered — six D1 rows and
//     three D3s. Only the D1:C-05→C-06 fileEdges LIST grows, 8→10, both
//     new suites importing @nputer/parser. No new component PAIR
//     appears, which is derivable: C-12 declares C-05, C-06 and C-09,
//     and C-05 declares C-12, so every one of the 19 new import edges
//     lands on a pair the table already carries.
//   · relation table: same 28 rows, same 13 confirmed / 6 undeclared /
//     9 planned tally. FIVE observedCounts move — C-05→C-06 8→10,
//     C-05→C-12 20→22, C-12→C-05 4→6, C-12→C-06 4→6, C-12→C-09 4→5.
//     TWO of those five are the verifier's corrections to the builder's
//     forecast and both were re-derived here from scratch: C-12→C-05 is
//     6 and NOT the forecast 7, and C-12→C-09 was not forecast at all.
//     One root cause for both — app/src/lib/task-detail.ts belongs to
//     C-09 (C-09-detail-panel.md names it explicitly), not to C-05, so
//     of TasksLens.tsx's three new edges into app/src/lib/** two go to
//     C-05 (utils.ts, verdicts.ts) and one goes to C-09. C-12 gains no
//     drift ring from any of it: all three targets are in its declared
//     depends_on.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-034
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form. Confirmed
//     rather than assumed by re-running lib/parser: 197/197.
//   · The ceaa949 ordering lesson, FIFTEENTH hold: this block and the
//     map fixture are both indexed, so both were edited BEFORE the final
//     regen and the regen was then run twice for byte-identity.
//
// RECONCILED AT THE T-042 MERGE (2026-08-17, integrator — TWENTY-FOURTH
// exercise of the practice). Every number re-derived from the raw graph
// against `git show 9cd4ee3:docs/architecture/graph.json`, with the
// file→component mapping and every cross-component import pair
// re-derived in my own script written against the registry globs rather
// than run through this app's derive.ts — all of it BEFORE this edit and
// BEFORE the suite was re-run:
//   · stats 99→100 files, 738→757 symbols, 1158→1170 edges (import +5,
//     call +5, type_ref +2). Only the 5 imports can move anything here.
//   · ONE file added, NOTHING removed: app/test/genesis-switch-truth.
//     test.tsx (C-05). Content-changed: app/src/genesis/GenesisPane.tsx
//     (comment only — T-042 criterion 4's ratification header),
//     app/src/lib/watcher-store.ts (the new exported
//     `outcomeCarriesSnapshot`), app/test/watcher-store.test.ts, and
//     app/test/startup-screen.test.tsx — the last is the ARCHITECT-
//     INSTRUCTED out-of-fence control-byte fix (T-050's file carried raw
//     NUL+BEL+ESC twice; replaced by \u0000/\u0007/\u001b escapes). It is
//     hash-visible and STRUCTURALLY INERT: loc 328 and 13 symbols both
//     unchanged, so it moves no assertion in this file. Stated because a
//     reader who did not know why would read it as an unexplained edit.
//   · mapping 99→100; C-05 46→47 is the ONLY count that moves —
//     app/test/** has exactly one claimant (C-05), swept again here.
//     D2 empty, unmapped node still gone, derived.issues still [].
//   · relation table: same 28 rows, same tally, and exactly ONE
//     observedCount moves — C-05→C-10 24→25, from the single new file
//     edge `genesis-switch-truth.test.tsx => app/src/lib/docs-model.ts`
//     (docs-model.ts is C-10's by name). No new component PAIR appears,
//     so no drift ring moves: C-05 declares C-10 already.
//   · NO LIST MOVES, and that was DERIVED rather than hoped. The trap the
//     T-034 block records (lists behind counts) was swept for directly:
//     this fixture enumerates a `files` array for C-12 ONLY, never for
//     C-05; the six D1 `fileEdges` lists are all for undeclared pairs and
//     C-05→C-10 is CONFIRMED, so it has no D1 row; and the `fileEdges`
//     list at the C-0x→C-06 seam test is C-10→C-06, a different edge that
//     the one new import does not touch. Four assertions move here plus
//     one in the map fixture — three numbers, one `it()` name, one hint
//     string — and the sweep for lists is what proves that is all.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-042
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form.
//   · The ceaa949 ordering lesson, SIXTEENTH hold: this block and the map
//     fixture are both indexed, so both were edited BEFORE the final
//     regen and the regen was then run twice for byte-identity.
//
// RECONCILED AT THE T-053 MERGE (2026-08-17, integrator — TWENTY-SEVENTH
// exercise of the practice). TWO exercises are missing from this log
// between T-042's block and this one, and they are missing for OPPOSITE
// reasons — stated so the numbering is not read as a gap in the ritual.
// The twenty-fifth was T-014's merge: it fired and was a verified no-op
// (a Rust-only crate against `languages: ["ts"]`; graph.json unmoved at
// 88e1daf6), so it left no block here for the same reason T-045's did.
// The twenty-sixth was T-027's, and that one is an OMISSION: it moved
// the graph 100→107 files and ten assertions with it, but recorded the
// whole reconciliation inline at the assertion sites and in its commit
// message rather than here. Both halves of that record are intact and
// nothing was lost — but the top-of-file log is the instrument the next
// integrator actually reads before touching a body, so it is restored
// here rather than left to rot. Every number below re-derived from the
// raw graph against `git show 2dd9ea5:docs/architecture/graph.json` with
// my own diff script, BEFORE this edit and BEFORE the suite was re-run:
//   · stats 107→109 files, 853→857 symbols, 1315→1325 edges (import +5,
//     call +4, type_ref +1). Nothing removed: 10 added, 0 retired.
//   · TWO files added, both C-06's — lib/parser/src/id-slot.ts (loc 99,
//     3 symbols: idSlotKey, aliasedIdSlots and the unexported
//     compareIdSpellings) and lib/parser/test/id-slot.test.ts (loc 110,
//     0 symbols). THE FIRST TIME SINCE T-008 THAT C-06 MOVES AT ALL, and
//     the first entry in this log whose moving component is neither C-05
//     nor C-12 nor C-13. Content-changed (hash only): the six other
//     lib/parser/src files and the three lib/parser/test suites. Only
//     types.ts moves a symbol count, 20→21 — the new `IdSpace`.
//   · mapping 107→109; C-06 21→23 is the ONLY count that moves, and it
//     is derivable before anything runs: `lib/parser/**` is C-06's
//     single glob and its only claimant, swept again here. D2 empty,
//     unmapped node still gone, derived.issues still [].
//   · NOTHING ELSE MOVES, and that was DERIVED rather than hoped. All
//     ten new edges are C-06-INTERNAL or C-06→package: three src imports
//     of id-slot.ts, the suite's two imports (id-slot.ts and p:vitest),
//     four call edges into aliasedIdSlots/idSlotKey, one type_ref
//     ParseIssue→IdSpace. No new component PAIR can appear from edges
//     that never leave a component, so the findings list, all six D1
//     `fileEdges` lists, the 30-row relation table with its 13/8/9
//     tally, every observedCount, every drift ring and the C-12 `files`
//     array are byte-identical. The T-034 block's trap was swept for
//     directly anyway: the two LISTS in this file that could move
//     (C-12's `files`, the D1:C-05→C-06 `fileEdges`) are both app→parser
//     or app-internal, and no app file was added.
//   · THREE assertions move plus one `it()` name — the size check and
//     the C-06 row here (SECOND in the same body as the size check, so a
//     red hides it), and the index hint in map-dogfood-render.test.tsx.
//     Forecast from the added-file list and the registry glob before the
//     regen was run, and the measurement matched it exactly.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-053
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form — VERIFIED
//     rather than assumed, since this is a lib-parser branch and that
//     pin lives in the package it edits.
//   · The ceaa949 ordering lesson, SEVENTEENTH hold: this block and the
//     map fixture are both indexed, so both were edited BEFORE the final
//     regen and the regen was then run twice for byte-identity.
//
// RECONCILED AT THE T-051 MERGE (2026-08-17, integrator — TWENTY-EIGHTH
// exercise of the practice). The log is unbroken from T-053's block
// above. Every number re-derived from the raw graph against
// `git show dca3731:docs/architecture/graph.json` with my own diff
// script, BEFORE this edit and BEFORE the suite was re-run:
//   · stats 109→110 files, 857→860 symbols, 1325→1328 edges (import +3,
//     call +0, type_ref +0), 500788→502350 bytes. Nothing removed:
//     3 added, 0 retired.
//   · ONE file added, C-05's — app/test/window-manifest.test.ts (loc 176,
//     3 symbols: MANIFEST, WindowBlock, windowBlock). THE BRANCH ADDED
//     TWO `.ts` FILES AND ONLY ONE IS INDEXED: the other is
//     tools/e2e/tests/window-contract.spec.ts, and `tools/` is
//     .nputerignored, so the lane is not territory — the same reason
//     T-041's five tools/e2e files landed nowhere. Derive the mapping
//     move from the INDEXED added-file list, not from the merge's diff.
//   · mapping 109→110; C-05 50→51 is the ONLY count that moves, and it
//     is derivable before anything runs: `app/test/**` is C-05's glob
//     and its only claimant (swept again here — C-05-app.md:9 is the
//     single match in docs/architecture/components/).
//   · NOTHING ELSE MOVES, and that was DERIVED rather than hoped. All
//     three new edges are file→PACKAGE — `node:fs`, `node:path` and
//     `p:vitest`. An edge whose head is a package can create no
//     component PAIR at all, so the findings list, all six D1
//     `fileEdges` lists, the 30-row relation table with its 13/8/9
//     tally, every observedCount, every drift ring and the C-12 `files`
//     array are byte-identical. The T-034 block's trap (lists hiding
//     behind counts) was swept for directly anyway: the two LISTS in
//     this file that could move are C-12's `files` array — C-12 is
//     app/src/architecture/**, and no file was added there — and the
//     D1 `fileEdges` lists, every one of which is a component pair.
//     No symbol count moves either; the three new symbols are all in
//     the new file.
//   · THREE assertions move plus one `it()` name — the size check and
//     the C-05 row here (SECOND in the same body as the size check, so
//     a red hides it: the trap that cost T-048 and T-049 a row each),
//     and the index hint in map-dogfood-render.test.tsx. Forecast from
//     the added-file list and the registry glob before the regen was
//     run, and the measurement matched it exactly — the SECOND complete
//     forecast running.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: T-051
//     declares no component and changes no registry file, so the T-024
//     three-fixtures rule does not fire in its registry form.
//   · The ceaa949 ordering lesson, EIGHTEENTH hold: this block and the
//     map fixture are both indexed, so both were edited BEFORE the final
//     regen and the regen was then run twice for byte-identity.
//
// RECONCILED AT THE T-028 MERGE (2026-08-17, integrator — TWENTY-NINTH
// exercise of the practice, and the LARGEST regen since T-027). The log
// is unbroken from T-051's block above. Every number derived from the
// freshly regenerated graph through this file's own `liveModel()`,
// BEFORE this edit and BEFORE the suite was re-run:
//   · stats 110→114 files, 860→916 symbols, 1328→1408 edges (import +28,
//     call +26, type_ref +26), 502350→532485 bytes. Nothing removed.
//   · FOUR files added and FIVE were in the merge's diff: crescendo.ts
//     (loc 232, 12 symbols) and BoardCrescendo.tsx (loc 140, 1) to C-13;
//     crescendo.test.ts (loc 374, 9) and crescendo-dom.test.tsx (loc 548,
//     19) to C-05. The fifth is tools/e2e/tests/crescendo.spec.ts, and
//     `tools/` is .nputerignored, so the lane is not territory — the
//     third merge running where the merge's diff over-counts this row.
//     THE TOKEN LINT IS THE MIRROR IMAGE and both were derived here: it
//     walks tools/e2e/**, so that same file counts for the lint (109→114)
//     and not for the graph. Neither walk is the other's proxy.
//   · mapping 110→114; TWO counts move, not one — C-05 51→53 and
//     C-13 6→8. C-13's is the FOURTH assertion in that body, below the
//     size check and below C-05's row, so two separate reds could hide
//     it.
//   · UNLIKE T-051's and T-053's blocks, the component picture MOVES A
//     LOT, and that was derived rather than discovered: the new edges
//     reach real component heads rather than packages. TWO new relation
//     rows, both leaving C-13 — C-13→C-06 (crescendo.ts imports the
//     PARSER, because the lens→board switch counts task RECORDS and not
//     filenames) and C-13→C-08 (BoardCrescendo.tsx mounts C-08's real
//     Board, read-only, with a 0-file diff under
//     app/src/components/board/). The table goes 30→32 rows and its
//     tally 13/8/9 → 13/10/9. FOUR observedCounts climb besides
//     (C-05→C-10 27→31, C-05→C-13 10→13, C-05→C-14 3→5, C-13→C-05 2→3,
//     C-13→C-10 4→6, C-13→C-14 4→5 — six in all), and FOUR D1 `fileEdges`
//     lists grow. C-12's `files` array is byte-identical: C-12 is
//     app/src/architecture/** and no file was added there.
//   · TEN assertions move across two files plus one `it()` name — the
//     size check, C-05's row, C-13's row, the findings array, the
//     relation table here; the edge count, the undeclared tally and the
//     index hint in map-dogfood-render.test.tsx. The edge count and the
//     undeclared tally are again TWO assertions in ONE body. Forecast
//     from the indexed added-file list and the registry globs before the
//     regen was run — the THIRD complete forecast running.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched, VERIFIED
//     rather than assumed: T-028 declares no component and
//     `git diff a6eea36..HEAD -- docs/architecture/components/` is a
//     0-file diff, so the T-024 three-fixtures rule does not fire.
//   · The ceaa949 ordering lesson, NINETEENTH hold.
//
// RECONCILED AT THE T-055 MERGE (2026-08-18, integrator). Derived from
// the regenerated graph against `git show b0dd4de:docs/architecture/graph.json`
// before changing either fixture:
//   · stats 115→117 files, 970→982 symbols, 1484→1502 edges
//     (import +7, call +11, type_ref unchanged).
//   · TWO files join C-06: lib/parser/src/inert-spans.ts (161 loc,
//     10 symbols) and lib/parser/test/inert-spans.test.ts (55 loc,
//     1 symbol). roadmap.ts retires stripHtmlComments (-1 symbol) while
//     task.test.ts adds two helpers, for the measured +12 total.
//   · mapping 115→117 and C-06 23→25 are the only rollup moves.
//     The 21 added / 3 removed edge records are C-06-internal or lead to
//     packages; no component pair can be created or grown. The 32-row
//     relation table, ten findings, every observedCount and every drift
//     flag remain byte-identical, as the focused 17-test run confirmed.
//   · THREE expectations move across the two app fixtures: this body's
//     size and C-06 row, plus map-dogfood-render's header hint. The live
//     registry did not move, so lib/parser/test/smoke.test.ts's exact
//     component-ID pin deliberately remains unchanged.
//   · Both fixture edits precede the final regeneration; the generated
//     graph is regenerated again afterwards and checked for identity.
//
// RECONCILED AT THE T-057 MERGE (2026-08-19, integrator). Derived from the
// regenerated graph against `git show adb32c3:docs/architecture/graph.json`
// before touching either fixture, and cross-checked with a throwaway probe
// `it()` appended to this describe, run once and removed (removal proved by
// sha256 against HEAD, not by a clean `git status`):
//   · stats 117 files (UNCHANGED) / 970->982->989 symbols (+7) /
//     1502->1508 edges (+13 added, -7 removed). No file joins or leaves
//     the index: T-057 moved 43 lines BETWEEN two already-indexed files.
//   · the +7 symbols are interview-model.ts +3 (observeBanking,
//     BankingObservation, EMPTY_BANKING_OBSERVATION), accelerators.test.tsx
//     +3 (AcceleratorHarness, keydownAdds, keydownRemoves) and
//     startup-screen.test.tsx +1 (isTauriRuntime). InterviewChat.tsx's
//     symbol set is BYTE-IDENTICAL — what moved lived inside the component
//     body, not at the top level.
//   · the four changed file-level import edges are all EXISTING pairs
//     whose `symbols` lists grew; not one new file pair appears. Every
//     symbol-level add is inside interview-model.ts or is
//     InterviewChat->observeBanking, replacing the two calls and one
//     type_ref it retired.
//   · THEREFORE ZERO ASSERTIONS MOVE, in this file or in
//     map-dogfood-render.test.tsx — the first merge in this ledger where
//     the forecast is "nothing changes". Measured, not assumed:
//     fileComponent.size 117; mapping C-05 54 / C-06 25 / C-08 10 /
//     C-09 3 / C-10 2 / C-12 14 / C-13 8 / C-14 1 (= 117); the 32-row
//     relation table, all ten D1 findings with every `fileEdges` list and
//     `observedCount`, the three D3 findings, the drift set and
//     `unmappedFiles` [] all byte-identical.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched: the live
//     component registry did not move (`git diff adb32c3..HEAD --
//     docs/architecture/components/` is a 0-file diff), so the T-024
//     three-fixtures rule does not fire.
//   · The ceaa949 ordering still holds and still MATTERS even here: this
//     comment is itself an indexed edit, so it stales the measuring regen
//     and the graph is regenerated a final time after it, then proven
//     deterministic by regenerating once more and `cmp`-ing.
//
// RECONCILED AT THE T-076 MERGE (2026-08-19, integrator). Derived from the
// regenerated graph against `git show 76cf034:docs/architecture/graph.json`
// before touching either fixture, and cross-checked with a throwaway probe
// `it()` appended to this describe, run once and removed (removal proved by
// sha256 against `git show HEAD:<path>` — 2475901a…, not by a clean
// `git status`):
//   · stats 117 files (UNCHANGED) / 989 -> 995 symbols (+6) /
//     1508 -> 1518 edges (+14 added, -4 removed); 571733 -> 575346 bytes.
//     `files +0 -0 ~13` — no file joins or leaves the index. T-076 is a
//     lift entirely inside lib/parser/**, which is C-06.
//   · the +6 symbols are id-slot.ts 3 -> 8 (canonicalDigits,
//     compareDigitRuns, idSlotIndex, slotNearMisses, nearMissClause) and
//     component.test.ts 5 -> 6. Every other one of the thirteen changed
//     files moves loc and hash only.
//   · the 14 added edges are THREE file-level imports whose `symbols`
//     lists grew (component.ts, validate.ts and id-slot.test.ts, each
//     into id-slot.ts — the same three pairs that appear in the -4, so
//     not one NEW file pair) plus eleven symbol-level `call` edges, every
//     one of them lib/parser -> lib/parser. An edge with both ends inside
//     one component can create or grow no component PAIR.
//   · THEREFORE ZERO ASSERTIONS MOVE, in this file or in
//     map-dogfood-render.test.tsx — the second merge in this ledger where
//     the forecast is "nothing changes", after T-057's. MEASURED by the
//     probe, not reasoned: fileComponent.size 117; mapping C-05 54 /
//     C-06 25 / C-08 10 / C-09 3 / C-10 2 / C-12 14 / C-13 8 / C-14 1
//     (= 117); the eleven-id registry; the 32-row relation table at
//     13 confirmed / 10 undeclared / 9 planned with C-05->C-06 still at
//     observedCount 10; all ten D1 findings with every `fileEdges` list,
//     the three D3 findings, drift ["C-01","C-05","C-07","C-08","C-09",
//     "C-11","C-13"], declaredOnly ["C-01","C-07","C-11"], pinned
//     ["C-01"] and `unmappedFiles` [] — all byte-identical.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched, and T-024's
//     three-fixture rule VERIFIED not to fire rather than assumed: its
//     trigger is DECLARING A COMPONENT (docs/CONVENTIONS.md:145), and
//     `git diff 76cf034..HEAD -- docs/architecture/components/` is a
//     0-file diff. No component was declared; the registry still stops
//     at C-14.
//   · The ceaa949 ordering, TWENTY-SECOND hold — derived, not carried:
//     the last NUMBERED hold is T-028's NINETEENTH, and the two entries
//     since (T-055, T-057) each held it without an ordinal, so this is
//     the twenty-second. This comment is itself an
//     indexed edit, so it stales the measuring regen; the graph is
//     regenerated a final time after it and then proven deterministic by
//     regenerating once more and `cmp`-ing.
//
// RECONCILED AT THE T-073 MERGE (2026-08-19, integrator). Derived against
// the merged main's committed graph (`56178286…`, 117 files / 995 symbols /
// 1518 edges — NOT the branch's figures, which were taken against the
// pre-T-076 graph and read 989/1508), then cross-checked with a throwaway
// probe `it()` appended to this describe, run once against the freshly
// regenerated graph and removed (removal proved by sha256 against
// `git show HEAD:<path>` — eddd4d0b…, not by a clean `git status`):
//   · stats 117 -> 118 files (+1) / 995 symbols (UNCHANGED) / 1518 edges
//     (UNCHANGED); 575351 -> 575612 bytes. `files +1 -0 ~2`:
//     + app/test/node-builtins-write.d.ts, ~ crescendo-dom.test.tsx
//     (loc 575 -> 677), ~ node-builtins.d.ts (loc 47 -> 49). The +261-byte
//     delta is the same one the branch measured against the older graph,
//     which is the cross-check that the file delta is T-073's alone.
//   · THE NEW FILE IS AN AMBIENT DECLARATION FILE AND CARRIES NO SYMBOLS.
//     That is why a merge that ADDS a file moves symbols and edges by zero
//     — the first entry in this ledger where a file joins the index and
//     nothing else in the graph moves at all.
//   · TWO ASSERTIONS MOVE IN THIS BODY AND ONLY ONE IS VISIBLE IN THE
//     FAILURE OUTPUT: the size check below reds at 118, and C-05's row is
//     the SECOND assertion in the same body, so vitest never reaches it
//     while the first is red. Derived from the indexed added-file list
//     BEFORE anything was run and confirmed by the probe — the same shape
//     T-048, T-049 and T-053 each had to learn once.
//   · EVERYTHING ELSE IS BYTE-IDENTICAL, measured by the probe rather than
//     reasoned: unmappedFiles []; the eleven-id registry (11 declared, 0
//     placeholder, mode full); the 32-row relation table at 13 confirmed /
//     10 undeclared / 9 planned with C-05->C-06 still observedCount 10 and
//     ten fileEdges; the ten undeclared pairs unchanged; derived.issues [];
//     project and graph issues 0/0; declaredOnly ["C-01","C-07","C-11"];
//     pinned ["C-01"]; C-12's fourteen-file list unchanged.
//   · map-dogfood-render.test.tsx moves ONE assertion — the index hint,
//     117 -> 118 files — because a NODE-count-free file join still moves
//     the file count the hint prints.
//   · lib/parser/test/smoke.test.ts deliberately NOT touched, and T-024's
//     three-fixture rule VERIFIED not to fire rather than assumed:
//     `git diff 16bb47b..a137d20 -- docs/architecture/components/` is a
//     0-file diff. No component was declared; the registry stops at C-14.
//   · The ceaa949 ordering, TWENTY-THIRD hold, derived from the entry
//     above (T-076's twenty-second). This comment is itself an indexed
//     edit, so it stales the measuring regen; the graph is regenerated a
//     final time after it and then proven deterministic by regenerating
//     once more and `cmp`-ing.
//
// RECONCILED AT T-088 (2026-08-24, executor claude-opus-5, IN THE LANE —
// not at a merge). EVERY ENTRY ABOVE RECORDS A REGEN MOVING THE GRAPH;
// THIS ONE RECORDS THE OTHER TRIGGER, and it is the first in this ledger
// to fire alone: the REGISTRY changed and the graph did not. The branch
// declares C-15 dispatch (`app/src-tauri/src/dispatch/**` +
// `app/src/lib/dispatch-store.ts`, slug `app-dispatch`) per
// docs/design/dispatch-technical-plan.md's D2. docs/ is .nputerignored,
// so a component .md moves no indexed file and `index --check` is exit 0
// at the base with the file added; what moves is the INTENT layer alone.
//   · DERIVED BEFORE ANYTHING WAS RUN, by a throwaway probe `it()`
//     appended to this describe, run once against the live tree with
//     C-15 present and REMOVED (removal proved by an empty `git status`
//     for app/test/, not by memory) — the T-073 technique above, reused.
//     EIGHT assertions move, across SIX bodies in THREE files, and TWO
//     of the eight are SECOND assertions in a body whose first also
//     moves, which is the shape this ledger keeps warning about:
//     the registry body (ids array, then the declared-count) and the
//     drift body (drift, then declaredOnly).
//   · C-15 IS DECLARED-ONLY, NOT TERRITORY, and that is the whole reason
//     the counts hold: neither declared path matches a file on disk, so
//     fileComponent.size stays 126, the per-component tally gains NO row
//     (a component with zero files contributes no entry), C-12's file
//     list is byte-identical, derived.issues stays [], unmappedFiles
//     stays [], mode stays "full" and map-dogfood's `126 files` hint does
//     not move. A paths-glob that matches nothing is INTENT, never a
//     defect — the property the new pin below asserts by name.
//   · WHAT DOES MOVE, exactly: the id array 11 -> 12 and the declared
//     count 11 -> 12 (this body); findings gain D3:C-15, appended after
//     D3:C-11 in id order; the relation table gains ONE row,
//     C-15->C-10 planned 0, appended in from-id order, taking planned
//     9 -> 10 while confirmed (13) and undeclared (10) hold; drift gains
//     C-15 and declaredOnly gains C-15. In map-dogfood-render.test.tsx:
//     the node count 11 -> 12 and the edge count 32 -> 33 — and the
//     SECOND assertion in that edge body, the undeclared tally, HOLDS at
//     10, which is the same trap read the other way round. In
//     lib/parser/test/smoke.test.ts: the live-tree id array alone.
//   · T-024's THREE-FIXTURE RULE FIRES HERE, in full, and a FOURTH was
//     checked rather than assumed: app/src-tauri/crates/nputer-index/
//     tests/arch.rs drives the same live registry from Rust and pins no
//     count on purpose (its own header says so), so `cargo test` does not
//     move. Nothing else in the tree reads this registry live.
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function docsFiles(): FileEntry[] {
  const entries: FileEntry[] = [];
  for (const name of readdirSync(join(ROOT, "docs/tasks"))) {
    if (name.endsWith(".md")) entries.push({ path: `docs/tasks/${name}`, content: read(`docs/tasks/${name}`) });
  }
  for (const name of readdirSync(join(ROOT, "docs/architecture/components"))) {
    if (name.endsWith(".md")) {
      entries.push({
        path: `docs/architecture/components/${name}`,
        content: read(`docs/architecture/components/${name}`),
      });
    }
  }
  entries.push({ path: "docs/ROADMAP.md", content: read("docs/ROADMAP.md") });
  return entries;
}

function liveModel() {
  const project = parseProjectFromFiles(docsFiles());
  const graphResult = parseGraph(read(GRAPH_PATH));
  const derived = deriveArchitecture({
    components: project.components ?? [],
    ...(graphResult.graph !== undefined ? { graph: graphResult.graph } : {}),
    tasks: project.tasks,
  });
  return { project, graphResult, derived };
}

const PARSER_PKG = "p:@nputer/parser";
const LIB_PARSER = "lib/parser";

describe("dogfood: the nputer repo through its own derivation engine", () => {
  const { project, graphResult, derived } = liveModel();

  it("both input layers parse clean (the smoke-test discipline)", () => {
    expect(project.issues).toEqual([]);
    expect(graphResult.issues).toEqual([]);
    expect(graphResult.graph).toBeDefined();
  });

  it("the live registry is the thirteen known components", () => {
    expect((project.components ?? []).map((c) => c.id)).toEqual([
      "C-01",
      "C-05",
      "C-06",
      "C-07",
      "C-08",
      "C-09",
      "C-10",
      "C-11",
      "C-12",
      "C-13",
      "C-14",
      // T-088: C-15 dispatch, declared before its directory exists. It is
      // the SECOND assertion below — the declared count — that hides
      // behind this array when both move, which is why both were derived
      // from the live probe rather than read off the first red.
      "C-15",
      // T-033: C-16 shared primitives, EXTRACTED from C-05 rather than
      // written — app/src/components/ui/**, lib/utils.ts and
      // lib/verdicts.ts change owner and no file moves on disk. It is the
      // first component this registry has gained that adds no territory:
      // fileComponent.size below is UNCHANGED at 178 while C-05 goes
      // 65 -> 62 and C-16 takes the 3.
      "C-16",
    ]);
    expect(derived.mode).toBe("full");
    expect(derived.components.filter((c) => c.kind === "declared")).toHaveLength(13);
    expect(derived.components.filter((c) => c.kind === "placeholder")).toHaveLength(0);
  });

  // T-088's own criterion, pinned by NAME rather than left to the
  // whole-array assertions that happen to contain it: a component whose
  // declared paths match NO file on disk is INTENT, not a defect. The
  // paths assertion is what makes this body more than a restatement —
  // nothing else in this tree pins C-15's globs, so widening them to
  // anything that still matches nothing (say app/src/lib/dispatch-*.ts)
  // reds here and NOWHERE else, while widening them to something that
  // matches reds half the fixture. The intent layer exists to carry
  // components that are not built yet; C-07 has done so since T-009.
  it("C-15 HAS TERRITORY AT LAST: five files under its declared globs, D3 cleared", () => {
    // THE ASSERTION THAT INVERTS AT THE T-110 MERGE REGEN (2026-08-25).
    // This body read "C-15 is DECLARED-ONLY, never a defect: declared
    // paths, zero files, one D3" from T-088 until here, and its own
    // comment above named the condition exactly: C-15's D3 "clears when
    // T-110 writes app/src-tauri/src/dispatch/**". It did. This is the
    // same arc C-13 walked at T-024, C-14 at T-025 and C-07 at T-010 —
    // the fourth component to leave declared-only, and the first to do
    // so because the card that was ALWAYS going to build it landed.
    // FOUR assertions move here and the TITLE with them; the paths
    // assertion is deliberately unchanged, because it is still the only
    // thing in this tree that pins C-15's globs and the globs did not
    // move. Derived from a throwaway probe `it()` run against the
    // regenerated graph BEFORE this suite was run (the T-088 technique),
    // never read off a failure — the first red in this body hides the
    // three below it.
    // T-033: a THIRD glob, and this assertion is where it is pinned.
    // `tests/dispatch_lanes.rs` is claimed here by the rule T-010 used for
    // `tests/agent_runner.rs` — a component's suite belongs to the
    // component it exercises — which drains the D2 below. This was NOT in
    // T-033's rulings; they were made seven hours before T-110 merged,
    // when neither this file nor C-15's five source files existed.
    // 3 -> 2 at the ELEVENTH TRIAGE (2026-08-26). T-126 deleted the shim
    // at `0fa83da`; the glob outlived the file by nine merges, matching
    // nothing while claiming a path that no longer existed. Removing it is
    // the cleanup @human ordered when the triage surfaced it, and it moves
    // NO file count — a glob matching nothing contributes nothing, which is
    // exactly why nine merges did not notice.
    expect(project.components?.find((c) => c.id === "C-15")?.paths).toEqual([
      "app/src-tauri/src/dispatch/**",
      "app/src/lib/dispatch-store.ts",
    ]);
    const c15 = derived.components.find((c) => c.id === "C-15");
    expect(c15?.kind).toBe("declared");
    // SIX files since T-033: `app/src-tauri/tests/dispatch_lanes.rs` —
    // the two-line compile shim that is the only reason `cargo test` can
    // reach this module at all — matched NEITHER declared glob and became
    // this repository's SECOND D2. **THIS LINE SAID "first" AND "one day"
    // AND BOTH WERE WRONG**; T-141 derived the census rather than
    // remembering it, and the first D2 was `app/src/lib/verdicts.ts` ten
    // days earlier — the same `lib/verdicts.ts` that sits three entries
    // down this ledger as one of C-16's three. It stood on main
    // **4h06m14s**, `1d8a2c2` 12:25:46 to `8f8ec31` 16:32:00, the same
    // day and not "a day". The derivation and all three instances are in
    // the `["unmapped", 1]` ledger entry below. It is claimed now, and
    // the unmapped bucket below is empty again.
    // 6 → 5 at the T-126 merge regen (2026-08-25), and this is the FIRST
    // time this repository has reconciled a dogfood fixture DOWNWARD:
    // T-126 declares `pub mod dispatch;` in `lib.rs`, so the shim's only
    // reason to exist is gone and the commit DELETES it. Every other move
    // in this file's log added a file; this one removes one, so a reader
    // scanning for the usual `+1` will misread the direction. The glob
    // list below is UNCHANGED and still passes — C-15's registry still
    // DECLARES `tests/dispatch_lanes.rs` and now matches nothing with it,
    // which no gate in this repository reports (`arch` says C-15 drift
    // `-`, `unmapped=0`). That dangling declaration is `T-126-s3` item 1,
    // deliberately NOT taken here; see this merge's checkpoint for why an
    // integrator routed it instead of repairing it. Derived from
    // `arch --root ../..` over the regenerated graph BEFORE this suite was
    // run (the T-088 technique), never read off a failure — the first red
    // in this body hides the three below it.
    expect(c15?.files).toEqual([
      "app/src-tauri/src/dispatch/fixtures.rs",
      "app/src-tauri/src/dispatch/join.rs",
      "app/src-tauri/src/dispatch/lanes.rs",
      "app/src-tauri/src/dispatch/mod.rs",
      "app/src/lib/dispatch-store.ts",
    ]);
    expect(c15?.declaredOnly).toBe(false);
    expect([...derived.fileComponent.values()].filter((id) => id === "C-15")).toEqual([
      "C-15",
      "C-15",
      "C-15",
      "C-15",
      "C-15",
    ]);
    // and the derivation no longer says anything about C-15 at all: the
    // D3 is gone and no D1 replaced it, because every edge the four Rust
    // files carry is either INTERNAL to C-15 or lands on a cargo package
    // (`serde`, `std`). A component that gains territory without gaining
    // a cross-component import is the clean case, and it is why C-15
    // leaves the drift set below rather than swapping one finding for
    // another the way C-13 did at T-027.
    expect(derived.findings.filter((f) => "component" in f && f.component === "C-15")).toEqual([]);
    expect(derived.issues).toEqual([]);
  });

  it("all 185 files map and the bucket is EMPTY again — T-141 closes the THIRD D2, which stood for exactly one merge", () => {
    // 126 → 172 at the T-010 merge regen (2026-08-25), the largest single
    // move this row has ever taken and the only one whose cause is a new
    // LANGUAGE rather than a new file. `Lang::for_extension("rs")` now
    // answers, so every `.rs` under app/src-tauri/ enters the index at
    // once: +46 files, every one of them Rust, and NOT ONE of them is new
    // on disk. The registry was settled ahead of the regen (the card's own
    // problem statement demanded it), so `unmappedFiles` below stays [] —
    // the regen CONFIRMS a decision instead of discovering a bucket.
    // 172 → 178 at the T-110 merge regen (2026-08-25): the four
    // `app/src-tauri/src/dispatch/*.rs` files and `dispatch-store.ts`
    // (C-15's, five) plus `app/src-tauri/tests/dispatch_lanes.rs` (no
    // component's, one).
    // AND THIS BODY'S TITLE STOPPED BEING TRUE HERE, WHICH IS THE POINT.
    // "zero unclaimed territory" held for every regen since the §2
    // amendments; T-110 ends it, and the honest reconciliation is to
    // record the bucket rather than to widen a glob until it disappears.
    // Widening is not this checkpoint's to do: the registry lives in
    // `docs/architecture/components/`, which T-033's lane holds tonight.
    // Routed as `T-110-s9`. THREE assertions move in this body's head and
    // two more in the tally below; all five were derived from a throwaway
    // probe against the regenerated graph before the suite was run.
    // T-033: THE SIZE DOES NOT MOVE AND THAT IS THE ASSERTION. C-16 is an
    // extraction — three paths change owner, no file joins or leaves the
    // index — so this stays 178 while C-05 drops 3 and C-16 gains them.
    // A count that moved here would mean the extraction had accidentally
    // widened or narrowed the claimed set.
    // 178 → 179 at the T-116 merge regen (2026-08-25), and this one IS a
    // new file rather than a change of owner: `app/test/map-churn-age
    // .test.tsx`, which C-05's `app/test/**` glob claims, so the tally
    // below moves with it and `unmappedFiles` stays [].
    // 179 → 178 at the T-126 merge regen (2026-08-25), and it is the ONLY
    // entry in this log that moves DOWN. T-126 deletes
    // `app/src-tauri/tests/dispatch_lanes.rs` — the shim exists only
    // because `lib.rs` did not declare the module, and this merge declares
    // it — so one file leaves the index and none joins. `index --check`
    // printed `files +0 -1 ~2`, which is the shape to read: the `-1` is
    // the whole of this move and the two `~` are content-only. Derived
    // from the indexed removed-file list and `arch` BEFORE the suite was
    // run, which is what the note in the body above asks for.
    // 178 → 179 at the T-129 merge regen (2026-08-25), and it is the
    // plainest entry in this log: ONE new file,
    // `app/src-tauri/crates/nputer-index/tests/depth.rs`, which C-07's
    // `app/src-tauri/crates/nputer-index/**` glob claims, so the C-07 row
    // in the tally below moves with it (32 → 33) and `unmappedFiles`
    // stays []. `index --check` printed `files +1 -0 ~8`, and the nine
    // paths it names are EXACTLY this merge's nine code paths, one for
    // one — no foreign staleness rode along, which is what T-129-s4 warns
    // can happen when a lane's base sits between a merge and its
    // checkpoint. The eight `~` are content-only. Derived from the
    // regenerated graph and `arch` BEFORE the suite was run.
    // 179 → 180 at the T-127 merge regen (2026-08-25), the same plain
    // shape as the entry above: ONE new file,
    // `app/src-tauri/crates/nputer-index/src/arch/cycles.rs`, which
    // C-07's `app/src-tauri/crates/nputer-index/**` glob claims, so the
    // C-07 row in the tally below moves with it (33 → 34) and
    // `unmappedFiles` stays []. `index --check` printed `files +1 -0 ~4`
    // and the five paths it names are EXACTLY this merge's five code
    // paths, one for one — no foreign staleness rode along. THE `~4` IS
    // WORTH READING BESIDE THE LANE'S OWN NOTES, which record `~3` and
    // `+3`: those figures were taken one commit before the lane's own
    // last commit and are stale by `tests/arch.rs -> cycles.rs`. Derived
    // fresh here from the regenerated graph and `arch` BEFORE the suite
    // was run, which is the instruction that caught it.
    // 180 → 181 at the T-135 Half A merge regen (2026-08-26), the same
    // plain shape as the two entries above: ONE new file,
    // `app/src-tauri/crates/nputer-index/src/arch/blast.rs`, which C-07's
    // `app/src-tauri/crates/nputer-index/**` glob claims, so the C-07 row
    // in the tally below moves with it (34 → 35) and `unmappedFiles`
    // stays []. `index --check` printed `files +1 -0 ~8` and the nine
    // paths it names are exactly this merge's nine `.rs` paths, one for
    // one.
    // AND THIS IS THE ENTRY THE CARD THAT PREDICTED IT DID NOT PREDICT.
    // `T-135-s3` forecast that committing this graph reds this file and
    // `map-dogfood-render.test.tsx` over the `C-05 -> C-15` D1 alone, at
    // 6 failed / 967 passed. Measured here: **9 failed / 964 passed**,
    // four in this file and five in that one. SIX are the D1; the other
    // THREE are this file-count line and two in the map file, and they
    // move under no repair `T-135-s3` offers, because the card's figures
    // were taken at an intermediate tree in which `blast.rs` did not yet
    // exist. The verifier diagnosed it by rebuilding that tree; this
    // integrator re-derived the nine independently. A count carried from
    // one tree into a paragraph about another is the shape to watch.
    // 181 → 183 at the T-134 merge regen (2026-08-26), by TWO, and the
    // first entry in this ledger whose new files are BOTH lib-parser's:
    // `lib/parser/src/fence.ts` and `lib/parser/test/fence.test.ts`, so
    // the row that moves below is C-06 (25 → 27) and NOT C-07. `index
    // --check` printed `files +2 -0 ~2` and the four paths it names are
    // exactly this merge's four `.ts` paths, one for one — the two
    // modified are the two barrels that re-export the new module.
    // AND THE C-06 ROW IS THE ASSERTION THIS MERGE'S BRIEF DID NOT NAME.
    // The integrator brief listed this size check and the map file's
    // hint and said nothing about the tally, which sits BELOW this line
    // in the same body and is therefore invisible while this one is red
    // — the trap the C-06 comment down there has warned about since
    // T-053, fired again on the pass that was reading the warning.
    // Measured: 2 failed / 971 passed on the first run, 3 red assertions.
    // 183 → 185 at the T-139 merge regen (2026-08-26, merge `aed77b6`), by
    // TWO — `app/src-tauri/crates/nputer-index/tests/budget.rs` and
    // `app/src-tauri/tests/graph_budget_bench.rs`. **AND THIS IS THE FIRST
    // ENTRY IN THIS LEDGER WHERE THE BUCKET STOPS BEING EMPTY**: the second
    // of those two lands under NO component's globs, so `unmappedFiles`
    // below goes from `[]` to one path and a D2 appears for the first time
    // since T-033 cleared it. Derived from `index --check`'s own
    // `files +2 -0 ~4` and from `arch` (`files=185 mapped=184 unmapped=1`)
    // before this suite was re-run, never from the failure output.
    // 185 → 185 AT T-141 (2026-08-26), AND THE SIZE HOLDING IS THE POINT.
    // This card declares an OWNER for a file already in the index; no file
    // joins or leaves, so this line does not move and the four assertions
    // under it do. The same shape as T-033's extraction eleven entries up —
    // a count that moved here would mean the declaration had accidentally
    // widened or narrowed the claimed set. Derived from `arch` at
    // `2a922ce` with the claim applied (`files=185 mapped=185 unmapped=0`),
    // before this suite was re-run.
    // 185 -> 189 AT THE T-137 MERGE REGEN (2026-08-27, merge c22f0ac).
    // FOUR FILES JOIN AND NONE LEAVE: lib/parser/src/{lanes,task-waves}.ts
    // and their two test files - the extraction that moved the schedule
    // analysis out of app-map into lib-parser. All four land under C-06's
    // globs, so unmapped STAYS 0 and the bucket does not re-open: a count
    // moving here WITHOUT the D2 moving is exactly what an extraction into
    // an already-declared component should look like. Derived from a set
    // difference over the two graph.json revisions (added 4, removed 0)
    // and from arch after the regen (files=189 unmapped=0), never from the
    // failure output.
    expect(derived.fileComponent.size).toBe(189);
    // AND THE BUCKET IS EMPTY AGAIN, ONE MERGE AFTER IT RE-OPENED.
    // T-033's settlement kept `tests/dispatch_lanes.rs` out of it by
    // CLAIMING it and T-126 kept it out by DELETING it; T-139 put a file IN
    // it, because `app/src-tauri/tests/` is claimed one file at a time —
    // C-14 declares `app/src-tauri/tests/agent_runner.rs` and nothing
    // declares a prefix. **T-141 CLAIMS IT FOR C-05 AND THE CLAIM COSTS NO
    // EDGE**, which is what chose C-05 over the two components the harness
    // actually imports. `graph_budget_bench.rs` imports `nputer_index`
    // (C-07) and `docs_watch` (C-10), so those two look like the closer
    // owners and each would INVERT a real dependency: C-07 is a standalone
    // crate with `depends_on: []` and the app depends on IT, while C-10 is
    // a watcher with no dependency on the indexer. C-05 already declares
    // BOTH, and the harness sits in the app's own test directory measuring
    // the app's own delivery path — the T-010 rule at `tests/agent_runner
    // .rs`, that a component's suite belongs to the component it
    // exercises, applied to a harness that exercises the seam.
    // MEASURED AT `2a922ce`, ALL FOUR ARRANGEMENTS, BEFORE THIS EDIT:
    //   no owner (today)  39 edges  5 findings  — D2 + two shadow rows
    //   claimed in C-05    37 edges  4 findings  — NO new edge
    //   claimed in C-07    38 edges  5 findings  — new undeclared C-07→C-10
    //   claimed in C-10    38 edges  5 findings  — new undeclared C-10→C-07
    // Only C-05 makes the graph SMALLER in both columns; the other two
    // trade a D2 for a D1 and write the inverted dependency into the map.
    // **AND NOTHING ON THE RUST SIDE REDDED FOR ANY OF IT**, in either
    // direction: `arch drift` exits 0 without `--fail-on` and
    // `crates/nputer-index/tests/arch.rs` pins the CYCLE census rather than
    // the drift census, so `cargo test` was byte-identical while the D2
    // opened and is byte-identical again now that it has closed. This
    // assertion and the three below it are still the only things in the
    // repository that notice — see the note in the drift body.
    expect(derived.unmappedFiles).toEqual([]);
    expect(derived.components.find((c) => c.id === UNMAPPED_ID)).toBeUndefined();
    const counts = new Map<string, number>();
    for (const id of derived.fileComponent.values()) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect([...counts.entries()].sort()).toEqual([
      // 33 → 35 at the T-026 merge regen: GenesisScreen.tsx under the
      // shell glob, genesis-entry.test.tsx under the app/test umbrella.
      // 35 → 37 at the T-037 merge regen: genesis-mount.test.tsx and
      // genesis-pane-boundary.test.tsx, both under that same umbrella.
      // 37 → 38 at the T-025 merge regen: agent-store.test.ts, under it
      // again — the SUITE lands here while the module it drives lands in
      // C-14, which is what makes the new D1 below.
      // 38 → 39 at the T-041 merge regen: shell-harness.test.ts, the same
      // umbrella. T-041's five tools/e2e files land nowhere — `tools/` is
      // .nputerignored, so the lane is not territory.
      // 39 → 40 at the T-048 merge regen: shell-frame.test.tsx, the same
      // umbrella a third time. This is the row the branch's forecast
      // missed both times — it hides behind the count assertion above,
      // so vitest never reaches it while that one is red. Derive it from
      // the added-file list, never from the failure output.
      // 40 → 42 at the T-049 merge regen, and it moves by TWO because
      // both new files are C-05's: accelerators.test.tsx under app/test/**
      // and accelerators.ts under app/src/components/shell/**. Forecast
      // as three again, derived as four HERE from the added-file list
      // before anything was run — which is the rule above being used.
      // 42 → 44 at the T-050 merge regen, by TWO again and by the same
      // route: startup-recovery.test.ts and startup-screen.test.tsx are
      // both under app/test/**, and the registry sweep confirms C-05 is
      // that glob's only claimant. Derived from the added-file list
      // BEFORE the suite was run, for the second merge in a row.
      // 44 → 46 at the T-034 merge regen, by TWO and by the same route a
      // third time: map-task-waves.test.ts and map-tasks-lens-dom.test.tsx
      // are both under app/test/**. Derived from the added-file list
      // before the suite ran — third merge running.
      // 46 → 47 at the T-042 merge regen, by ONE and by the same route a
      // fourth time: genesis-switch-truth.test.tsx is under app/test/**,
      // still C-05's alone. The out-of-fence control-byte repair to
      // startup-screen.test.tsx moves NOTHING here — same file, same loc,
      // same symbol count, only its content hash.
      // 47 → 50 at the T-027 merge regen, by THREE and by the same route a
      // fifth time: interview-chat-dom.test.tsx, interview-harness.test.ts
      // and interview-model.test.ts are all under app/test/**, C-05's alone.
      // THREE and not the two the plan forecast — the DEV-gate proofs would
      // not compose with the DOM fixture, so the branch split them into a
      // third file. Derived from the added-file list before the suite ran,
      // which is the rule above being used for the fifth merge running.
      // 50 → 51 at the T-051 merge regen (2026-08-17), by ONE and by the
      // same route a sixth time: window-manifest.test.ts is under
      // app/test/**, C-05's alone. The branch added TWO .ts files and this
      // row moves by ONE, not two — tools/e2e/tests/window-contract.spec.ts
      // is under .nputerignored `tools/`, so it never enters the index and
      // cannot be territory. Deriving this row from the MERGE's diff would
      // have over-counted it; derive it from the INDEXED added-file list.
      // 51 → 53 at the T-028 merge regen (2026-08-17), by TWO and by the
      // same route a seventh time: crescendo.test.ts and
      // crescendo-dom.test.tsx are under app/test/**, C-05's alone. The
      // branch added FIVE .ts/.tsx files and only FOUR are indexed —
      // tools/e2e/tests/crescendo.spec.ts is under .nputerignored
      // `tools/`. Of those four, two land here and two land on C-13.
      // 53 → 54 at the T-029 merge regen (2026-08-18), by ONE and by the
      // same route an eighth time: interview-resume-dom.test.tsx is under
      // app/test/**, C-05's alone. The branch changed ELEVEN indexed
      // .ts/.tsx files and only ONE of them is NEW — the other ten are
      // modifications, which move hash, loc and symbols and can never move
      // a mapping count. tools/e2e/tests/resume-fallback.spec.ts is under
      // .nputerignored `tools/` and is invisible here (it counts for the
      // token lint, which walks tools/e2e — two walks, two answers).
      // 54 → 55 at the T-073 merge regen (2026-08-19), by ONE and by the
      // same route a ninth time: node-builtins-write.d.ts is under
      // app/test/**, C-05's alone. It is a `.d.ts` and carries no symbols,
      // so it moves this row and the file count and NOTHING else in the
      // graph. It is the SECOND assertion in this body — below the size
      // check above — so vitest never reaches it while that one is red;
      // derived from the indexed added-file list before the suite ran.
      // 56 → 59 at the T-013 merge regen, by THREE and by the same route
      // a tenth time: map-churn.test.ts, map-t1-t2-dom.test.tsx and
      // map-zoom.test.ts are all under app/test/**, C-05's alone.
      // Derived from the indexed added-file list and validated by a
      // POSITIVE CONTROL — the same matcher reproduces this array's
      // previous value exactly against the graph committed at 11c82a1 —
      // before the suite was run, never off the failure output.
      // 59 → 65 at the T-010 merge regen, and for the first time in this
      // log the reason is NOT a new file: C-05 declares lib.rs, main.rs,
      // build.rs BY NAME and took acl_pin.rs, churn.rs and index_cmd.rs
      // in the §5 settlement, and all six became VISIBLE the moment the
      // walk learned `.rs`. Derived from the regenerated graph's own
      // file→component map before the suite was run, never off a red.
      // 65 → 62 at T-033, and for the first time this row moves DOWNWARD
      // and without the graph moving at all: `components/ui/button.tsx`,
      // `lib/utils.ts` and `lib/verdicts.ts` leave for C-16. An
      // extraction, not a deletion — the three files are on disk, indexed,
      // and counted three rows below.
      // 62 → 63 at the T-116 merge regen (2026-08-25), by ONE and by the
      // app/test/** route an eleventh time: map-churn-age.test.tsx is
      // C-05's alone. It is the ONLY file the regen added (`index --check`
      // printed `files +1 -0 ~2`), and it is the THIRD assertion in this
      // body — below the size check and the empty-bucket checks — so
      // vitest never reaches it while any of those is red. Derived from
      // the indexed added-file list before the suite was run, which is
      // what the note nine entries up asks for.
      // 63 → 64 AT T-141 (2026-08-26), and this row moves WITHOUT the graph
      // moving at all — the second time it has done so, after T-033's
      // extraction two entries up, and the first time it moves UPWARD that
      // way. No file was added: `app/src-tauri/tests/graph_budget_bench.rs`
      // has been indexed since T-139 and merely changes owner, from nobody
      // to C-05. It is the FOURTH assertion in this body — below the size
      // check and the two empty-bucket checks — so vitest never reaches it
      // while any of those is red, and this is the fifth consecutive entry
      // in this ledger to say so. Derived from `arch`'s own
      // `component C-05 … files=64` with the claim applied, before the
      // suite was re-run, never off the failure output.
      // 64 → 31 AT T-149 (2026-08-27), the largest move this row has ever
      // made and the third time it moves WITHOUT THE GRAPH MOVING AT ALL —
      // no file added, no file deleted, `derived.fileComponent.size` still
      // 189. THIRTY-THREE of the forty-nine files under `app/test/**` change
      // owner, and the catch-all glob that made them C-05's is gone: the
      // component now names its SIXTEEN shell tests one by one. What is left
      // is 15 shell files + 16 tests = 31, and that 15 is the same fifteen
      // the card counted before anything moved. THE SIX ROWS BELOW MOVE IN
      // THE SAME BREATH AND SUM TO THE SAME 33 — C-08 +2, C-09 +3, C-10 +4,
      // C-12 +16, C-13 +7, C-14 +1 — which is the check worth running on
      // this table: a routing that loses or duplicates a file breaks the sum
      // before it breaks any single row. Derived from `arch`'s own
      // `component … files=` lines at the edited registry, cross-checked
      // against a per-file simulation over `graph.json` run BEFORE the
      // registry was touched, never off the failure output.
      ["C-05", 31],
      // 21 → 23 at the T-053 merge regen (2026-08-17), and this is the
      // FIRST time since T-008 that C-06 moves at all: lib/parser/src/
      // id-slot.ts and lib/parser/test/id-slot.test.ts, both under
      // `lib/parser/**`, C-06's single glob and its only claimant. It is
      // also the first regen in this log where the moving component is
      // NOT C-05 — the umbrella row above is byte-unchanged, because a
      // lib-parser branch with a 0-byte app diff cannot move it.
      // Derived from the added-file list and the registry glob BEFORE
      // anything was run, and it is the SECOND assertion in this body:
      // it sits below the size check above, so vitest never reaches it
      // while that one is red. Same shape as the row T-048 and T-049
      // each missed once.
      // 23 → 25 at the T-055 merge regen (2026-08-18): inert-spans.ts
      // and inert-spans.test.ts are both new and both match only C-06's
      // `lib/parser/**` glob. The four other parser files are modifications,
      // so they can move hash/loc/symbols but cannot move this count.
      // 25 → 27 at the T-134 merge regen (2026-08-26): `fence.ts` and
      // `fence.test.ts`, both new on disk and both matching only C-06's
      // `lib/parser/**` glob. The two other parser files in the diff are
      // the barrels and are modifications, so they move loc and content
      // hash and cannot move this count. This is the THIRD time this row
      // moves and the first since T-055 — and it is the row the merge's
      // own brief omitted, which is exactly what the paragraph above has
      // said about it since T-053. Derived from `arch` over the
      // regenerated graph before the suite was re-run.
      // 27 -> 31 at the T-137 merge regen (2026-08-27, c22f0ac): the four
      // files of the schedule extraction - lib/parser/src/{lanes,task-waves}.ts
      // and their two tests. ALL FOUR LAND HERE AND NOWHERE ELSE, which is the
      // whole point of the extraction: it moved the schedule analysis out of
      // app-map, so a rise anywhere but C-06 would mean it had not landed where
      // the card claimed. Derived from a set difference over the two graph.json
      // revisions, not from the failure output.
      ["C-06", 31],
      // C-07 JOINS THE MAPPING AT THE T-010 MERGE REGEN WITH THIRTY-TWO
      // FILES AND NO NEW FILE ON DISK — the row this whole card exists to
      // create, and the inverse of every C-05 entry above. Its D3 clears
      // in the same breath (see the drift body below), which is the arc
      // C-13 walked at T-024 and C-14 at T-025, one language later.
      // 32 → 33 at the T-129 merge regen (2026-08-25):
      // `crates/nputer-index/tests/depth.rs`, the integration target that
      // pins every bounded traversal, and the FIRST file this component
      // has gained on disk since it joined the mapping. Derived from
      // `arch` over the regenerated graph before the suite was run.
      // 33 → 34 at the T-127 merge regen (2026-08-25):
      // `crates/nputer-index/src/arch/cycles.rs`, the registry cycle
      // gate — the SECOND file this component has gained on disk, and
      // the only component whose count moves at this merge. Derived from
      // `arch` over the regenerated graph before the suite was run.
      // 34 → 35 at the T-135 Half A merge regen (2026-08-26):
      // `crates/nputer-index/src/arch/blast.rs`, the derived-dependents
      // report — the THIRD file this component has gained on disk, and
      // again the only component whose count moves at this merge.
      // Derived from `arch` over the regenerated graph before the suite
      // was run.
      // 35 → 36 at the T-139 merge regen (2026-08-26):
      // `crates/nputer-index/tests/budget.rs`, the degradation-path suite —
      // the FOURTH file this component has gained on disk. It is again the
      // only DECLARED component whose count moves, but this merge is the
      // first in the series that also adds a file NO component claims, so
      // the bucket row at the bottom of this table is new. Derived from
      // `arch` over the regenerated graph before the suite was run.
      ["C-07", 36],
      // 10 → 12 at T-149: `review-badge.test.tsx` and `select-board.test.ts`
      // arrive from C-05's dissolved test umbrella. Both drive only this
      // component's own files plus the parser it already declares, so the
      // relation table below gains no row for them — C-08 → C-06 merely
      // goes 4 → 5.
      ["C-08", 12],
      // 3 → 6 at T-149: `detail-presentation.test.ts`,
      // `panel-dismissal.test.ts` and `select-task-detail.test.ts`. The
      // first also reads C-16's `verdicts.ts`, which this component already
      // declares, so again no new row — C-09 → C-16 goes 2 → 3.
      ["C-09", 6],
      // 2 → 3 at the T-010 merge regen: docs_watch.rs, which C-10 has
      // claimed by name since T-003 and which no walk could see.
      // 3 → 7 at T-149: `docs-model.test.ts`, `shell-harness.test.ts`,
      // `startup-recovery.test.ts` and `watcher-store.test.ts`. THIS ROW
      // MORE THAN DOUBLES AND THE FENCE DOES NOT MOVE WITH IT, which is
      // worth saying where the number is: C-10's `touch_slugs:` is
      // `[app-shell]`, the same slug C-05 carries, so a test routed here is
      // routed for TRUTH and not for throughput. `shell-harness.test.ts` is
      // the one whose name argues for C-05 — the surface it audits,
      // `window.__nputerShellHarness`, is installed by `watcher-store.ts`,
      // which is this component's file.
      ["C-10", 7],
      // 11 → 14 at the T-034 merge regen: TasksLens.tsx, map-lens.ts and
      // task-waves.ts all land under app/src/architecture/**, C-12's own
      // glob and its only claimant. The FILE LIST below moves with it —
      // same body, same merge, and it is the half that gets missed.
      // 14 → 18 at the T-013 merge regen, by FOUR: MapContainer.tsx,
      // churn-source.ts and map-zoom.ts under app/src/architecture/**,
      // plus churn.ts under app/src/lib/architecture/** — both C-12's
      // globs and C-12 their only claimant. Same positive control.
      // 18 → 34 at T-149, by SIXTEEN — the largest single move any row in
      // this table has made, and the mirror of C-05's 33-file drop. Five
      // `architecture-*` and eleven `map-*` files arrive from the dissolved
      // umbrella; `map-shell-dom.test.tsx` does NOT, because its subject is
      // `components/shell/PaneRail.tsx` and a filename is a hint rather than
      // a fact. THIS IS THE ROW T-137 COULD NOT REACH: its fence was
      // `[lib-parser, app-map, tools/e2e]` and the assertions its own regen
      // moved lived in `app/test/**`, which was C-05's — the defect this
      // card exists to remove, recorded at the number that proves it.
      ["C-12", 34],
      // The genesis pane joined the index at the T-024 merge regen, and
      // STAYS 2 at T-037's: the mount gave the lens a consumer, not a
      // file.
      // 2 → 6 at the T-027 merge regen — the largest single move this
      // component has made, and the first time C-13 grows by FOUR:
      // InterviewChat.tsx, interview-model.ts, interview-source.ts and
      // interview-turns.tsx all land under app/src/genesis/**, C-13's own
      // glob and its only claimant.
      // 6 → 8 at the T-028 merge regen: crescendo.ts and
      // BoardCrescendo.tsx, both under app/src/genesis/**. This is the
      // FOURTH assertion in this body — below the size check and below
      // C-05's row — so a red in either hides it. It was derived from the
      // indexed added-file list and the registry glob before the suite
      // ran, which is the only way this row is ever caught in time.
      // 8 → 15 at T-149, by SEVEN: `crescendo.test.ts`,
      // `genesis-derive.test.ts`, `genesis-pane-dom.test.tsx` and the four
      // `interview-*` files. FIVE genesis-named tests stay with C-05 and
      // that is the judgement this row records — `crescendo-dom`,
      // `genesis-entry`, `genesis-mount`, `genesis-pane-boundary` and
      // `genesis-switch-truth` mount `App.tsx` or
      // `components/shell/GenesisScreen.tsx`, so routing them here would
      // write `C-13 → C-05` into a registry that already declares
      // `C-05 → C-13` at 6 observed — a cycle, for a mount point.
      ["C-13", 15],
      // C-14 joins the mapping at the T-025 merge regen with exactly ONE
      // file: agent-store.ts. Its other declared path
      // (app/src-tauri/src/agent/**, five .rs files) is invisible to the
      // indexer until T-010 lands Rust extraction — languages is still
      // ["ts"]. The same arc C-13 walked at T-024, one language short.
      // 1 → 8 at the T-010 merge regen, and it is the clause "invisible to
      // the indexer until T-010 lands Rust extraction" above that stops
      // being true — the FIVE is still five, re-derived here rather than
      // trusted: agent/** holds adapter.rs, kit.rs, mod.rs, runner.rs and
      // sessions.rs. The §5 settlement adds C-14's test double
      // `src/bin/fake_agent.rs` and its suite `tests/agent_runner.rs`, on
      // the rule that already puts app/test/** under C-05, so
      // 1 + 5 + 2 = 8. The map stops under-reporting this component.
      // 8 → 9 at T-149: `agent-store.test.ts`, the TS half's own test,
      // which is the same rule the §5 settlement two lines up already
      // applied to `fake_agent.rs` and `tests/agent_runner.rs`. The clause
      // above that reads "the rule that already puts app/test/** under
      // C-05" is what T-149 retires: there is no longer an `app/test/**`
      // rule, only per-file routing, and this component's own test is the
      // first row to feel it.
      ["C-14", 9],
      // C-15 JOINS THE MAPPING AT THE T-110 MERGE REGEN WITH FIVE FILES,
      // and it is the row this ledger has been forecasting since T-088
      // declared the component with nothing under it. Four Rust files
      // under `app/src-tauri/src/dispatch/**` plus the one TS file the
      // second glob names exactly. Derived from the added-file list and
      // the registry globs BEFORE the suite ran — this is the FOURTH
      // assertion in this body, below the size check, the unmappedFiles
      // check and the bucket check, so three separate reds can hide it.
      // 5 → 6 at T-033: `tests/dispatch_lanes.rs`, claimed by name.
      // 6 → 5 at the T-126 merge regen: the same file, deleted rather than
      // reclaimed, because declaring `pub mod dispatch;` in `lib.rs`
      // removes the shim's only reason to exist. The component returns to
      // exactly the five files it joined the mapping with, and the count
      // it returns to is NOT the count it started from for the same
      // reason — this is a round trip in the number and a one-way move in
      // the tree. Derived from `arch` over the regenerated graph before
      // the suite ran; it is the FOURTH assertion in this body, so three
      // separate reds can hide it.
      ["C-15", 5],
      // AND THE ROW NOBODY DECLARED. `app/src-tauri/tests/dispatch_lanes.rs`
      // is the two-line `#[path]` shim that lets `cargo test` compile
      // `src/dispatch/**` at all — the placement T-110's verifier RULED
      // legitimate, because `app/src-tauri/tests/**` is claimed by no
      // component and widening `lib.rs` (C-05's `app-shell`) from inside
      // the `[app-dispatch]` fence is the one repair an executor may
      // never make. T-010 settled every other unclaimed Rust file by
      // name and could not settle this one, because it did not exist on
      // main yet. So the bucket is REAL and this row records it rather
      // than hiding it: it is `T-110-s9`'s subject, and it clears the
      // moment either a component claims `tests/**` or `T-110-s1` lands
      // the real wiring, whose commit DELETES this shim.
      // BOTH HAPPENED, IN THAT ORDER: T-033 claimed it and T-126 deleted
      // it, so this row was settled twice by opposite mechanisms inside
      // two days. The second is why C-15 reads 5 above.
      // AND THE ROW T-033 CREATES. C-16 shared primitives, EXTRACTED from
      // C-05: `components/ui/button.tsx`, `lib/utils.ts`,
      // `lib/verdicts.ts`. The first component in this ledger to arrive
      // with files and add none — every other new row above either grew
      // the index or waited for a language.
      ["C-16", 3],
      // AND THE ROW THAT LEFT, CAME BACK, AND HAS LEFT AGAIN — KEPT HERE AS
      // A LEDGER ENTRY WITH NO ASSERTION UNDER IT, BECAUSE DELETING THE
      // EXPLANATION TO CLOSE THE FINDING WOULD ERASE THE EVIDENCE THAT IT
      // HAPPENED.
      //
      // **THE CENSUS BELOW IS DERIVED, NOT REMEMBERED, AND EVERY EARLIER
      // COUNT IN THIS REPOSITORY WAS WRONG.** T-141 first wrote "the
      // second D2" here and was rejected for it; the verdict said three
      // and named the first as the map's own engine trio at T-011. Three
      // is right and that first instance is still not. Method, because
      // the count is only worth what the method is: for every one of the
      // **390** first-parent commits on main, materialise that commit's
      // own `docs/architecture/{graph.json, components/}` — the only two
      // inputs `arch` reads — and run ONE fixed engine over it. **350
      // carry a committed graph** (the earliest 40 predate `graph.json`,
      // so no D2 can exist there) and the sweep computes the join instead
      // of grepping for `D2:unmapped`, which is why it can find an
      // instance nobody recorded. **It found one.** Control: at 343 of
      // those 350 the derived count equals the list this very fixture
      // asserted at that commit; the 7 exceptions are 6 commits predating
      // the fixture and ONE genuine disagreement, `c036779`, described
      // below. The glob semantics have not drifted.
      //
      // `["unmapped", N]` HAS STOOD ON MAIN THREE TIMES.
      // **FIRST, 4h31m29s** — and it is not the instance anyone named.
      // The bucket opened at `98b1f4e`, **Checkpoint: T-017 done**,
      // 2026-08-15 18:47:21, whose regen after `93d3ea6` Merge T-017 put
      // exactly two files into the graph: `app/test/board-truth.test.tsx`,
      // which C-05 claimed, and **`app/src/lib/verdicts.ts`, which nothing
      // claimed** — the same `lib/verdicts.ts` listed three entries up as
      // one of C-16's three. T-017's merge had nothing to do with the map;
      // the regen simply indexed a file no glob reached. It stood at ONE
      // file for 1h20m, was still one at `c036779` Merge T-011 19:05:31 —
      // where T-011's incoming fixture asserted `unmappedFiles` `[]` and
      // was FALSE on main for 62 minutes, the one control mismatch in 350
      // — and grew to FOUR at `ceaa949`, **Checkpoint: T-011 done**,
      // 20:07:13, when that checkpoint's regen added the engine trio
      // (`derive.ts`, `glob.ts`, `graph.ts`) to the ALREADY-OPEN bucket
      // and reconciled the fixture to `["unmapped", 4]`. So T-011's
      // checkpoint is where the repository first SAW it, not where it was
      // made. Closed by `f8046fa` **T-012 §2**, which reached main at
      // `ed56884` Merge T-012, 23:18:50.
      // **SECOND, 4h06m14s**: `app/src-tauri/tests/dispatch_lanes.rs`,
      // opened at `1d8a2c2` **Checkpoint: T-110 done** 2026-08-25
      // 12:25:46 after `1223543` Merge T-110, settled onto C-15 by
      // `1baed94` **T-033 phase 1B** and drained on main at `8f8ec31`
      // Merge T-033 16:32:00 — by the rule T-010 used for
      // `tests/agent_runner.rs`.
      // **THIRD, one merge**: `app/src-tauri/tests/graph_budget_bench.rs`,
      // opened at `ae92f67` **Checkpoint: T-139 done** 2026-08-26
      // 19:40:08 after `aed77b6` Merge T-139, sitting in a directory no
      // component claims by prefix — and **T-141 closed it** by declaring
      // C-05 the owner.
      //
      // THE PATTERN, WORTH RECORDING BECAUSE IT IS NOW THREE FOR THREE —
      // AND THE INSTANCE NOBODY REMEMBERED IS THE ONE THAT FITS IT BEST.
      // ALL THREE D2s THIS REPOSITORY HAS EVER HAD WERE CREATED BY A
      // MERGE'S REGEN AT THE CHECKPOINT AND CLOSED BY A LATER CARD'S
      // HAND, NEVER BY THE MERGE THAT MADE THEM. All three were created
      // the same way: a merge added a file to a directory claimed one
      // file at a time, and the regen — which is the checkpoint's act,
      // not the lane's — discovered it afterwards. All three were closed
      // the same way: a later card took a DISPOSITION, because picking an
      // owner is a registry decision and neither an executor (fence) nor
      // an integrator (a checkpoint takes no dispositions) may take it.
      // **THE FIRST IS THE PUREST CASE OF THE MECHANISM AND WAS THE ONE
      // LEFT OUT**: T-017's merge was about the board, the stranded file
      // was a shared helper, and nothing in that merge's own subject had
      // anything to do with the bucket it opened.
      // DURATIONS, ALL MEASURED THE SAME WAY — first first-parent commit
      // on main carrying the bucket, to the first that drains it, since a
      // lane commit is not yet main: **4h31m29s, 4h06m14s, and this one**.
      // Two of the three are within 25 minutes of each other and none of
      // them is "a day"; that phrase entered at T-033, was repeated by
      // T-139's checkpoint, by this card's brief, by STATE.md and by this
      // file, and was never once measured. THE STANDING
      // LESSON IS THE ONE THE DELAY ITSELF TEACHES: a D2 is not a defect
      // the merge that creates it can repair, so the honest reconciliation
      // is to RECORD the bucket — which is what T-139's checkpoint did in
      // this file, in 137 lines — and let the disposition follow. Repairing
      // it at the merge would have hidden that the merge created unclaimed
      // territory, which is the most interesting thing about any of them.
      // AND THE SECOND LESSON IS THIS ENTRY'S OWN HISTORY: a census
      // carried in prose was wrong three times running and cost a
      // rejection; the sweep that corrected it is thirty lines of shell
      // over a binary this repository already ships.
      //
      // AND WHAT NOTICED IS A THIRD THING THE CENSUS CORRECTS, BECAUSE THE
      // THREE INSTANCES DID NOT FAIL ALIKE. The FIRST was TypeScript and
      // it went RED: T-011's fixture asserted `[]` against a bucket that
      // was already open, so `npm test` on main was failing for 62
      // minutes and the checkpoint reconciled it. For the SECOND and
      // THIRD — both `.rs` — the whole tripwire was this file and the map
      // fixture. Not `cargo test`, which was 518/0/4 exit 0 on both sides
      // of the T-139 regen and on both sides of this claim; not `arch
      // drift`, which exits 0 without `--fail-on`; not the cargo arch
      // pin, which is about CYCLES. **Two React fixtures are the whole of
      // the tripwire for unclaimed RUST territory, and that is exactly
      // the half of the history where nothing else spoke.** Recorded, not
      // fixed — wiring a drift gate is a separate decision and not this
      // card's; it is `T-141-s1`.
    ]);
    // The map pane joined its engine at the T-012 merge regen
    // (T-011-s1 option a keeps the trio in place under lib/).
    // T-034 merge regen: 11 → 14, the pane's second lens. Ordering is
    // the graph's own file order, which is a plain codepoint sort of the
    // full path — so TasksLens.tsx sorts among the capitalised
    // components and map-lens.ts / task-waves.ts among the lowercase
    // modules, and app/src/architecture/** still precedes
    // app/src/lib/architecture/**. Derived from the added-file list and
    // checked against the regenerated graph's ordering, not copied out
    // of a failure diff.
    expect(derived.components.find((c) => c.id === "C-12")?.files).toEqual([
      "app/src/architecture/MapContainer.tsx",
      "app/src/architecture/MapEdge.tsx",
      "app/src/architecture/MapNode.tsx",
      "app/src/architecture/MapPanel.tsx",
      "app/src/architecture/MapProvenanceMark.tsx",
      "app/src/architecture/MapView.tsx",
      "app/src/architecture/TasksLens.tsx",
      "app/src/architecture/churn-source.ts",
      "app/src/architecture/map-layout.ts",
      "app/src/architecture/map-lens.ts",
      "app/src/architecture/map-search.ts",
      "app/src/architecture/map-visuals.ts",
      "app/src/architecture/map-zoom.ts",
      "app/src/architecture/task-waves.ts",
      "app/src/lib/architecture/churn.ts",
      "app/src/lib/architecture/derive.ts",
      "app/src/lib/architecture/glob.ts",
      "app/src/lib/architecture/graph.ts",
      // T-149: 18 → 34. The sixteen tests that exercise this pane arrive
      // from C-05's dissolved `app/test/**` umbrella. They sort AFTER every
      // `app/src/**` entry because the order is the graph's own, a plain
      // codepoint sort of the full path — `app/src` < `app/test` on the
      // fifth segment character. Derived by filtering `graph.json`'s own
      // file order through the routed set, not copied out of a failure
      // diff, and the count reconciles against `arch`'s `C-12 … files=34`.
      "app/test/architecture-derive.test.ts",
      "app/test/architecture-dogfood.test.ts",
      "app/test/architecture-glob.test.ts",
      "app/test/architecture-graph.test.ts",
      "app/test/architecture-store.test.ts",
      "app/test/map-churn-age.test.tsx",
      "app/test/map-churn.test.ts",
      "app/test/map-dogfood-render.test.tsx",
      "app/test/map-layout.test.ts",
      "app/test/map-search.test.ts",
      "app/test/map-t1-t2-dom.test.tsx",
      "app/test/map-task-waves.test.ts",
      "app/test/map-tasks-lens-dom.test.tsx",
      "app/test/map-view-dom.test.tsx",
      "app/test/map-visuals.test.ts",
      "app/test/map-zoom.test.ts",
    ]);
  });

  it("no file-level ambiguity: the umbrella really is non-overlapping", () => {
    expect(derived.issues).toEqual([]);
  });

  it("THE FINDINGS: TWO D1 ROWS, ONE OF THEM REVEALED RATHER THAN CREATED — AND THE D2 IS GONE, RETIRED BY A DECLARATION THAT COST NO EDGE", () => {
    // T-033 TAKES THIS ARRAY FROM FIFTEEN ROWS TO THREE, and the shape of
    // what is left is the whole deliverable. Eleven undeclared rows were a
    // warning light wired to always-on; after this, an undeclared edge is
    // news. What survives, and why each one is deliberate:
    //
    //   · D1:C-10->C-14 — the ONE undeclared row left, and it is left on
    //     purpose. T-123 made `docs_watch.rs` ask C-14's session registry
    //     whether a folder is already registered, which is real and which
    //     sits opposite the declared `C-14 -> C-10`: this repository's
    //     first component CYCLE. @human ruled 2026-08-25 that the registry
    //     holds no cycles, so declaring it is forbidden and the fix is an
    //     EXTRACTION — `T-125`. The amber stays visible until that lands.
    //   · D3:C-01 and D3:C-11 — both now INFORMATIONAL. `method/**` is
    //     markdown and C-11 is stylesheets and fonts; neither will ever
    //     hold a file this walk collects, so the finding is reported and
    //     explained but no longer counts as drift (`hasDrift` below).
    //
    // WHAT LEFT, each by a different mechanism, so a single cause cannot
    // explain the drop: eight D1 rows drained because C-16's extraction
    // moved `cn`/`Button`/`verdicts` out of the shell's paths (C-08->C-05,
    // C-09->C-05, C-13->C-05 vanish outright), and the rest because the
    // registry now DECLARES dependencies that were always real
    // (C-05->C-06/-C-07/-C-09/-C-13/-C-14, C-13->C-06/-C-08/-C-14). The
    // D2 left because C-15 claims its own test shim by name.
    //
    // Derived from a throwaway probe against the live registry and the
    // committed graph BEFORE this suite was run (the T-088 technique),
    // never read off a failure — the first red here hides everything under
    // it. The probe was deleted and its removal proved by `git status`.
    //
    // A SECOND D1 ARRIVES AT THE T-135 HALF A MERGE REGEN (2026-08-26),
    // AND IT IS REVEALED RATHER THAN CREATED. T-135 makes a Rust `mod`
    // declaration an `import` edge, so `app/src-tauri/src/lib.rs` (C-05)
    // finally shows the dependency on `dispatch/mod.rs` (C-15) that
    // `pub mod dispatch;` has carried since T-126's merge `0fa83da`.
    // `git log -S "C-15" -- docs/architecture/components/C-05-app.md` is
    // EMPTY: C-05 has never declared C-15 in its history. So this row was
    // exactly as true one commit before this merge as it is now, which is
    // the whole of ruling thirteen's parent test — the checkpoint that
    // reconciled this array therefore did NOT declare C-15 in the
    // registry. The declaration is routed, with its own measurement, to
    // `T-126-s3` item 4, which is where a triage will dispose of it.
    // AND THAT CARD'S ITEM 4 CALLS THIS THE "FIFTH D1"; IT IS THE SECOND,
    // and there are four findings, not five. Measured here with `arch
    // drift` over the regenerated graph: two D1 rows and two D3 rows.
    expect(derived.findings).toEqual([
      {
        rule: "D1",
        id: "D1:C-05->C-15",
        from: "C-05",
        to: "C-15",
        fileEdges: [
          {
            from: "app/src-tauri/src/lib.rs",
            to: "app/src-tauri/src/dispatch/mod.rs",
          },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-10->C-14",
        from: "C-10",
        to: "C-14",
        fileEdges: [
          {
            from: "app/src-tauri/src/docs_watch.rs",
            to: "app/src-tauri/src/agent/sessions.rs",
          },
        ],
      },
      // AND THE D2 ROW THAT STOOD HERE FOR EXACTLY ONE MERGE — KEPT AS A
      // COMMENT AFTER THE ROW ITSELF LEFT, BECAUSE THE ROW'S DEPARTURE IS
      // THE FINDING AND THE EXPLANATION IS THE EVIDENCE FOR IT.
      // T-139 PUT IT BACK (2026-08-26, merge `aed77b6`): this repository had
      // carried a D2 twice before — 4h31m29s in 2026-08-15 and 4h06m14s at
      // T-110/T-033 — and
      // `app/src-tauri/tests/graph_budget_bench.rs` is the THIRD it has
      // ever had. (This comment said "the second" and "exactly one day",
      // inheriting both from T-139's checkpoint; the derived census is in
      // the `["unmapped", 1]` ledger entry above.) It was the merge's own
      // — `arch drift` read `unmapped=0` at
      // the parent `00e133a` and `unmapped=1` after the checkpoint's regen —
      // and the DECLARATION was routed rather than taken there, because the
      // harness imports across two components (C-07's `nputer_index` and
      // C-10's `docs_watch`) and choosing an owner is a registry decision.
      // T-141 TAKES IT, AND TAKES IT FOR THE COMPONENT THAT LOOKED FURTHEST
      // AWAY. Neither importee is the owner: claiming it in C-07 would
      // declare that a standalone crate with `depends_on: []` depends on the
      // app's docs watcher, and claiming it in C-10 would give the watcher a
      // dependency on the indexer — mirror inversions of the real direction,
      // and both MEASURABLE. At `2a922ce`, C-07 gives 38 edges / 5 findings
      // (new undeclared C-07→C-10), C-10 gives 38 / 5 (new undeclared
      // C-10→C-07, and a second drift ring on C-10), and C-05 gives 37 / 4
      // with nothing added at all. **A DISPOSITION THAT MAKES THE GRAPH
      // SMALLER IN BOTH COLUMNS IS DECLARING SOMETHING THE REGISTRY ALREADY
      // CARRIED**, which is the test that separated the three candidates,
      // and it is why the count above went 5 → 4 rather than 5 → 5.
      // `informational: true` is READ from each component file's opt-in
      // `non_code:` key, never derived from the empty file list — the two
      // are asserted apart in architecture-derive.test.ts, where a second
      // component with no files and no flag keeps `informational: false`.
      { rule: "D3", id: "D3:C-01", component: "C-01", informational: true },
      { rule: "D3", id: "D3:C-11", component: "C-11", informational: true },
    ]);
  });

  it("the full relation table: 25 confirmed, 2 undeclared, 10 planned", () => {
    // T-149: THE ROW COUNT DOES NOT MOVE AND FIFTEEN OF THE THIRTY-SEVEN
    // ROWS DO, WHICH IS THE WHOLE RESULT STATED AS A RELATION. Routing 33
    // test files out of C-05's umbrella adds NO row and removes NO row —
    // 37 before, 37 after — because every test that moved already imported
    // only components its new owner declares. The tally moves by exactly
    // one row's relation: `C-05 -> C-09` goes `confirmed 3` to
    // `planned 0`, so 26/2/9 becomes 25/2/10.
    // THE ARRANGEMENTS WERE MEASURED RATHER THAN ARGUED (the T-141
    // precedent, and this card's own third bite). A per-file simulation
    // over `graph.json`, run BEFORE the registry was touched, scored the
    // candidate owner of every one of the 49 files by the edges it would
    // create; the chosen routing scores ZERO new component edges, and the
    // tool then reproduced the simulation's every file count and every
    // observed count exactly. The rule that decided the hard cases: a test
    // that mounts `App.tsx` or a `components/shell/**` component stays with
    // C-05, because giving it to the component it otherwise exercises would
    // point that component BACK at the shell — and C-05 already declares
    // C-08, C-10, C-12, C-13 and C-14, so every such row would be a CYCLE
    // under @human's no-cycles ruling. Thirteen files are held here by that
    // rule alone.
    // THE ONE ROW WHOSE RELATION MOVES IS RESIDUE, AND IT IS LEFT
    // STANDING DELIBERATELY. All three observed `C-05 -> C-09` file edges
    // were test edges; with them routed, the shell reaches the detail
    // panel only THROUGH C-08 (`App.tsx -> Board.tsx -> TaskDetailPanel`).
    // T-012's `C-05` row in C-12 is the precedent for DROPPING such a
    // declaration, and this card does not take it: dropping a declared
    // dependency is a separate judgement with its own argument, and this
    // card's charter is `paths:`. Filed as `T-149-s1`.
    // T-033: 35 rows -> 36, and the TALLY is where the card lands.
    // 14/12/9 becomes 26/1/9 — eleven undeclared rows become confirmed or
    // disappear, and the single survivor is the cycle T-125 owns.
    // FIVE ROWS ARRIVE, all of them `-> C-16`, and FOUR LEAVE: C-08->C-05,
    // C-09->C-05 and C-13->C-05 stop existing (their file edges moved to
    // C-16, and nothing declares them), and C-12->C-05 was dropped from
    // the registry because the extraction took its last observed edge and
    // left a `planned 0` row asserting a dependency that is not there.
    // Derived from a throwaway probe before the suite ran.
    expect(derived.edges.map((e) => [e.from, e.to, e.relation, e.observedCount])).toEqual([
      ["C-05", "C-01", "planned", 0],
      // undeclared -> CONFIRMED at T-033: the shell's own test umbrella
      // really does consume the parser, so the registry says so. The
      // observed count is untouched, which is the tell that this row moved
      // by a DECLARATION and not by code.
      // 13 -> 14 at the T-116 merge regen: map-churn-age.test.tsx imports
      // `@nputer/parser`, so this time the row moves by CODE and not by a
      // declaration — the opposite tell to the one above. THE LANE'S OWN
      // FORECAST MISSED THIS ROW while recording the D1 entry the same
      // edge produces; the D1 entry no longer moves at all, because T-033
      // took this pair from `undeclared` to `confirmed` and the findings
      // list stopped holding it.
      ["C-05", "C-06", "confirmed", 1],   // T-149: 14 -> 1
      // 1 -> 2 AT T-141, and the observed count moves with NO code change
      // and NO regen: `graph_budget_bench.rs` has imported `nputer_index`
      // since T-139 and the file edge has been in the graph the whole time
      // — it was attributed to the bucket. Declaring an owner re-attributes
      // it, so the edge that WAS `unmapped -> C-07 undeclared 1` folds into
      // this already-CONFIRMED row. That fold is the whole reason the table
      // gets SHORTER instead of longer: nothing new is observed, one
      // endpoint is renamed.
      ["C-05", "C-07", "confirmed", 2],
      ["C-05", "C-08", "confirmed", 2],   // T-149: 4 -> 2
      ["C-05", "C-09", "planned", 0],     // T-149: confirmed 3 -> planned 0
      // 38 -> 39 at the T-116 merge regen: map-churn-age.test.tsx imports
      // `startDocsWatcher` from app/src/lib/watcher-store.ts, which is
      // C-10's.
      // 39 -> 40 AT T-141, by the same re-attribution as the C-07 row above
      // and for the harness's OTHER import, `docs_watch`. The two folds are
      // one file's two imports, which is why the D2 was one finding and not
      // three, and why retiring it retires both shadow rows at once.
      ["C-05", "C-10", "confirmed", 24],  // T-149: 40 -> 24
      ["C-05", "C-11", "planned", 0],
      // *** DISCHARGED AT T-033's CHECKPOINT: 32 -> 33. *** The lane left
      // this row at 32 because the file tracks the COMMITTED graph (the
      // fixture's own maintenance contract) and deliberately committed no
      // regenerated one; the integrator's regen is what moves it. The
      // cause is this lane's own fixture edit: map-dogfood-render.test.tsx
      // — C-05's, under the app/test umbrella — gains `import { edgeKey }
      // from "../src/architecture/MapEdge"` so it can assert the
      // surviving undeclared row by IDENTITY rather than by count, and a
      // test file importing the pane it renders is exactly the umbrella
      // edge this row has always counted.
      // THE LANE'S FORECAST HELD EXACTLY, AND IT WAS ASKED RATHER THAN
      // TRUSTED: the checkpoint regen (923899 -> 925217 bytes, symbols
      // +1, edges +5, files ~12) left the app suite at 961/962 with this
      // ONE row red at `expected 32, received 33` — the single deferred
      // assertion the verdict promised — and 962/962 once moved. Nothing
      // else in this file or in map-dogfood-render.test.tsx moved.
      // 33 -> 35 at the T-116 merge regen, by TWO: map-churn-age.test.tsx
      // imports BOTH MapView.tsx and churn-source.ts, and both are C-12's.
      // THREE REFS, THREE DIFFERENT FORECASTS FOR THIS ONE ROW, and none
      // of them is what landed here: the lane forecast 32 -> 34 at a tree
      // without T-033, the verifier measured 32 -> 35 against T-033's
      // MERGE commit, and on main after T-033's CHECKPOINT the baseline is
      // 33. All three were right where they were measured. Derived here at
      // this merged tree, which is the only ref that governs this line.
      ["C-05", "C-12", "confirmed", 1],   // T-149: 35 -> 1
      ["C-05", "C-13", "confirmed", 6],   // T-149: 17 -> 6
      ["C-05", "C-14", "confirmed", 3],   // T-149: 8 -> 3
      // NEW at the T-135 Half A merge regen (2026-08-26), and it is the
      // ONE row this merge adds: `lib.rs -> dispatch/mod.rs`, the single
      // cross-component pair among the 27 edges the `mod` fix rescues.
      // It arrives `undeclared` and is LEFT undeclared — see the findings
      // body above for why the checkpoint did not repair it and where the
      // declaration is routed. Row count 36 -> 37, tally 26/1/9 -> 26/2/9.
      ["C-05", "C-15", "undeclared", 1],
      // NEW at T-033: `components/shell/PaneRail.tsx -> lib/utils.ts` and
      // two siblings. The shell is now a CONSUMER of the primitives it
      // used to own, which is the extraction working in both directions.
      ["C-05", "C-16", "confirmed", 2],   // T-149: 3 -> 2
      ["C-06", "C-01", "planned", 0],
      ["C-08", "C-06", "confirmed", 5],   // T-149: 4 -> 5
      ["C-08", "C-09", "confirmed", 6],
      ["C-08", "C-11", "planned", 0],
      // NEW at T-033, and it REPLACES `["C-08","C-05","undeclared",4]`:
      // three `cn` imports plus `board-model.ts -> verdicts.ts`, all four
      // now landing on C-16. Declaring C-08 -> C-05 instead would have
      // written a cycle against the already-declared C-05 -> C-08.
      ["C-08", "C-16", "confirmed", 4],
      ["C-09", "C-06", "confirmed", 3],   // T-149: 2 -> 3
      ["C-09", "C-08", "confirmed", 3],
      ["C-09", "C-11", "planned", 0],
      // NEW at T-033, replacing `["C-09","C-05","undeclared",2]`: `cn` and
      // `verdicts` from TaskDetailPanel.tsx.
      ["C-09", "C-16", "confirmed", 3],   // T-149: 2 -> 3
      ["C-10", "C-06", "confirmed", 1],
      // THE ONE UNDECLARED ROW LEFT IN THIS REPOSITORY, and it is left on
      // purpose: declaring it would write this registry's first cycle
      // (C-14 -> C-10 is declared and confirmed two rows down). @human
      // ruled no cycles; the extraction is T-125.
      ["C-10", "C-14", "undeclared", 1],
      // `["C-12","C-05","confirmed",7]` is GONE. All seven were `cn` and
      // `verdicts`, so the extraction took the row to `planned 0` and the
      // registry dropped the declaration rather than assert an intent that
      // is not there — which also closed C-05 <-> C-12.
      ["C-12", "C-06", "confirmed", 17],  // T-149: 6 -> 17
      ["C-12", "C-07", "planned", 0],
      ["C-12", "C-09", "confirmed", 5],
      // 1 -> 2 at the T-116 merge regen, and this is the card's own
      // architectural content on the map: churn-source.ts now imports
      // `getShellState`/`subscribeShell` from watcher-store.ts, so the map
      // pane reads the shell's project-switch signal directly. C-12 ALREADY
      // DECLARES C-10, so the new edge is confirmed rather than drift —
      // which is why the fence question the card raised about that import
      // was never a fence question.
      ["C-12", "C-10", "confirmed", 5],   // T-149: 2 -> 5
      ["C-12", "C-11", "planned", 0],
      // NEW at T-033: the map pane is the heaviest consumer of the
      // primitives — five `cn` sites plus `task-waves.ts -> verdicts.ts`.
      ["C-12", "C-16", "confirmed", 7],
      ["C-13", "C-06", "confirmed", 1],
      ["C-13", "C-08", "confirmed", 1],
      ["C-13", "C-10", "confirmed", 14],  // T-149: 6 -> 14
      ["C-13", "C-11", "planned", 0],
      ["C-13", "C-14", "confirmed", 9],   // T-149: 5 -> 9
      // NEW at T-033, replacing `["C-13","C-05","undeclared",3]` — three
      // `Button` imports. This is the row the ruling named as the proof
      // that the arrow was an artifact of WHERE the primitives lived:
      // genesis never depended on the shell, it depended on a button.
      ["C-13", "C-16", "confirmed", 3],
      ["C-14", "C-10", "confirmed", 2],
      ["C-15", "C-10", "planned", 0],
      // AND THE TWO ROWS THAT STOOD HERE FOR ONE MERGE, KEPT AS A COMMENT.
      // T-139 (2026-08-26, merge `aed77b6`) added `unmapped -> C-07` and
      // `unmapped -> C-10`, the first and only rows this table has ever
      // carried whose SOURCE is not a component: the bucket's imports.
      // `app/src-tauri/tests/graph_budget_bench.rs` was unclaimed territory
      // and reaches `nputer_index` (C-07) and `docs_watch` (C-10), so one
      // unmapped file produced TWO undeclared rows — which is what made
      // them a symptom of the D2 rather than two independent findings.
      // T-141 DECLARED IT AND BOTH VANISHED, exactly as the comment that
      // stood here predicted. They did not become two new rows: the
      // observed edges folded into `C-05 -> C-07` and `C-05 -> C-10`
      // above, both already CONFIRMED, so the table lost two rows and
      // gained none. **A DECLARATION THAT SHORTENS THE TABLE IS DECLARING
      // A DEPENDENCY THAT WAS ALREADY DECLARED**; a declaration that
      // lengthens it has picked the wrong owner, and C-07 and C-10 were
      // each measured doing exactly that (38 rows apiece, each with a new
      // undeclared row pointing the wrong way down the dependency).
    ]);
    const tally = new Map<string, number>();
    for (const e of derived.edges) tally.set(e.relation, (tally.get(e.relation) ?? 0) + 1);
    expect([...tally.entries()].sort()).toEqual([
      // 26 -> 25 and 9 -> 10 at T-149, and the two move TOGETHER because
      // it is ONE row changing relation, not two rows appearing:
      // `C-05 -> C-09` loses its last observed file edge (all three were
      // test edges, now C-09's own) and becomes a declared dependency with
      // nothing behind it. 25 + 2 + 10 = 37, the same 37 as before the
      // routing — no row arrived and none left. Derived from `arch`'s own
      // edge listing at the edited registry, and forecast by a per-file
      // simulation over `graph.json` before the registry was touched.
      ["confirmed", 25],
      ["planned", 10],
      // 2 → 4 at T-139, both new rows from the one unmapped file above.
      // 4 → 2 AT T-141, both leaving for the same reason they arrived. This
      // is the SECOND assertion in this body and the row count above is the
      // first, so vitest never reaches it while that one is red — the trap
      // this body's own comments have warned about since T-028. Both
      // numbers were derived from `arch` with the claim applied (26
      // confirmed / 2 undeclared / 9 planned = 37) before the suite was
      // re-run, never off the failure output.
      ["undeclared", 2],
    ]);
    // AND THE INVARIANT THE CARD EXISTS TO RESTORE: every undeclared edge
    // is now either declared or owned by a named card. TWO rows at the
    // T-135 Half A merge, and the invariant still holds because the new
    // one arrives with its owner already named: `C-05->C-15` is routed to
    // `T-126-s3` item 4 and `C-10->C-14` is T-125's cycle. An undeclared
    // row with no owner is what this assertion exists to catch, and
    // adding one WITHOUT its owner is the failure it would have caught.
    // FOUR ROWS AT THE T-139 MERGE, and the invariant still held for the
    // same reason in a different shape: the two new ones were not a
    // relation anybody declared wrongly, they were the SHADOW of `D2:
    // unmapped` above, and they were owned by the routed registry decision
    // that merge's checkpoint recorded. Declare the harness and all four
    // numbers below move at once; that coupling is the point.
    // BACK TO TWO AT T-141, AND THE COUPLING IS THE PROOF. The routed
    // decision landed, one line of registry moved, and the row count, the
    // undeclared tally, this identity list and the findings body all moved
    // together — four assertions across two bodies, one cause. The
    // invariant is unchanged and now has two rows to hold: `C-05->C-15` is
    // routed to `T-126-s3` item 4 and `C-10->C-14` is T-125's cycle. This
    // is the THIRD assertion in this body; it moves under a red on either
    // of the two above it and was derived, like them, from `arch`.
    expect(
      derived.edges.filter((e) => e.relation === "undeclared").map((e) => `${e.from}->${e.to}`),
    ).toEqual(["C-05->C-15", "C-10->C-14"]);
  });

  it("the T-009 package.path seam is consumed: C-0x→C-06 edges are real, never absent", () => {
    // Declared consumers of @nputer/parser resolve to CONFIRMED edges
    // through the package join (this closes the seam note in T-009 §6.6:
    // the file:-dep edge must not render as planned-forever, and must
    // never be silently absent).
    const c08 = derived.edges.find((e) => e.from === "C-08" && e.to === "C-06");
    expect(c08?.relation).toBe("confirmed");
    expect(c08?.fileEdges).toEqual([
      { from: "app/src/components/board/Board.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/components/board/badges/ReviewBadge.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/components/board/badges/SizeBadge.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/lib/board-model.ts", to: LIB_PARSER, package: PARSER_PKG },
      // 4 -> 5 at T-149: `select-board.test.ts` arrives from C-05's
      // dissolved test umbrella and consumes the parser through the same
      // seam. `review-badge.test.tsx` arrives too and does NOT appear here
      // — it imports react and one component, no parser — which is what
      // makes this list a check on the ROUTING rather than on the count.
      { from: "app/test/select-board.test.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    const c09 = derived.edges.find((e) => e.from === "C-09" && e.to === "C-06");
    expect(c09?.relation).toBe("confirmed");
    expect(c09?.fileEdges).toEqual([
      { from: "app/src/components/board/TaskDetailPanel.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/lib/task-detail.ts", to: LIB_PARSER, package: PARSER_PKG },
      // 2 -> 3 at T-149: `select-task-detail.test.ts`. Of the three tests
      // routed here, it is the only parser consumer.
      { from: "app/test/select-task-detail.test.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    const c10 = derived.edges.find((e) => e.from === "C-10" && e.to === "C-06");
    expect(c10?.relation).toBe("confirmed");
    expect(c10?.fileEdges).toEqual([
      { from: "app/src/lib/docs-model.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    // The fourth consumer is C-05 (its test umbrella), and at T-033 it
    // stops being drift and becomes DECLARED — the seam's own point, that
    // a file:-dep edge must render as real, now holds for every consumer
    // instead of three of four. The COUNT is asserted beside the relation
    // so "confirmed" cannot be reached by the edge quietly emptying.
    const c05 = derived.edges.find((e) => e.from === "C-05" && e.to === "C-06");
    expect(c05?.relation).toBe("confirmed");
    // 13 -> 14 at the T-116 merge regen: map-churn-age.test.tsx is a
    // fourteenth C-05 file importing `@nputer/parser`. This body is
    // T-033's, so the lane could not have forecast it — and the count
    // moving here while the relation holds is exactly what this body was
    // written to make visible.
    // 14 -> 1 AT T-149, AND THE GUARD THIS COMMENT DESCRIBES IS WHAT KEEPS
    // THE ROW HONEST AT THE OTHER END OF ITS RANGE. Thirteen of the
    // fourteen parser consumers under C-05 were tests, and every one has
    // been routed to the component it exercises. The survivor is
    // `board-truth.test.tsx`, which stays with C-05 because it mounts
    // `App.tsx` — so the shell's declared dependency on the parser now
    // rests on ONE file edge, and if that file ever moves this row goes
    // `planned 0` rather than disappearing quietly. Derived from
    // `graph.json`'s own package-seam edges filtered through the routed
    // ownership map, not read off a failure diff.
    expect(c05?.observedCount).toBe(1);
  });

  it("drift flags land on the right nodes", () => {
    const drift = derived.components.filter((c) => c.hasDrift).map((c) => c.id);
    // D1 sources: C-05, C-08, C-09; D3: C-01, C-11 (and C-15 below).
    // That D3 list read "C-01, C-07, C-11" until the T-010 merge regen
    // and is corrected in place rather than left beside a moved
    // assertion. C-13 left the
    // set at the T-024 merge regen and C-14 at the T-025 one — both have
    // files now, and both are the TARGET of a D1 from C-05, never its
    // source. C-14 was in this list on the branch, before the regen it
    // could not run; it comes back out here, which is the ritual working.
    // C-13 REJOINS at the T-027 merge regen, and by the opposite route
    // to the one that took it out: it left T-024's set because it gained
    // FILES, and it comes back because it gained OUTGOING undeclared
    // edges — the first time it is a D1 source rather than only a target
    // (→C-05 via components/ui/button.tsx, →C-14 via agent-store.ts).
    // C-15 JOINS BOTH LISTS AT T-088, by the D3 route the three
    // non-code components already take — it is declared with no file
    // under either glob, so it is a D3 subject and therefore drifts.
    // THESE ARE TWO ASSERTIONS IN ONE BODY AND BOTH MOVE: a red on the
    // first hides the second, so both were derived from the live probe
    // before the suite was run rather than read off the failure output.
    // C-07 LEAVES BOTH LISTS AT THE T-010 MERGE REGEN, and it is the
    // first component to leave the drift set without gaining or losing a
    // single file on disk — the walk learned `.rs`, its 32 files became
    // visible, its D3 cleared, and it is a D1 TARGET (from C-05) and
    // never a source, which is exactly the C-13-at-T-024 and
    // C-14-at-T-025 route one language later. Both assertions were
    // derived from the live probe before the suite ran, for the same
    // reason the sentence above gives.
    // C-10 JOINS THE DRIFT SET AT THE T-123 MERGE REGEN, and it is its
    // FIRST drift finding in this repository's life — the node has been in
    // this table since T-003 and has never carried one. It joins as a D1
    // SOURCE (→C-14 via docs_watch.rs importing GenesisReachability), the
    // same route C-13 took at T-027 and C-05 at T-025. `declaredOnly` does
    // NOT move: C-10 has three files and is nobody's declared-only node.
    // ASYMMETRY WORTH KEEPING: C-14 does NOT join, because it is only the
    // TARGET here and it already declares C-10 — which is exactly why this
    // edge closes a CYCLE rather than adding a second independent one.
    // C-15 LEAVES BOTH LISTS AT THE T-110 MERGE REGEN and "unmapped"
    // JOINS THE FIRST, and the two happen in the same breath for
    // opposite reasons — which is why this pair is the sharpest trap in
    // this file. C-15 leaves because it gained five files and its D3
    // cleared (the C-13-at-T-024 / C-14-at-T-025 / C-07-at-T-010 arc,
    // fourth time); the unmapped bucket joins because it is a D2 SUBJECT,
    // a route no entry in this ledger has taken before.
    // **THE LENGTH OF THIS ARRAY DOES NOT MOVE — EIGHT BEFORE, EIGHT
    // AFTER.** One member is swapped for another, so any assertion on
    // `drift.length` would be green across this merge while the set it
    // counts changed. The whole array is pinned for exactly that reason.
    // The SECOND assertion below moves too and does NOT cancel:
    // declaredOnly goes from three to two, because nothing became
    // declared-only in C-15's place. Both derived from a throwaway probe
    // against the regenerated graph before the suite ran — a red on the
    // first would otherwise hide the second, which this body's own
    // comment has warned about since T-088.
    // T-033 TAKES THIS ARRAY FROM EIGHT TO ONE, and the three mechanisms
    // are deliberately different so no single change explains it:
    //   · C-05, C-08, C-09, C-13 leave as D1 SOURCES — either the edge was
    //     declared, or C-16's extraction took it away entirely.
    //   · "unmapped" leaves because the bucket is empty: C-15 claims
    //     `tests/dispatch_lanes.rs`, so there is no D2 subject at all.
    //   · C-01 and C-11 leave WITHOUT their findings leaving. This is the
    //     new route and the one to read carefully: both are still
    //     `declaredOnly` and both still carry a D3 in the findings body
    //     above — the finding is INFORMATIONAL, so it stops feeding
    //     `hasDrift`. `declaredOnly` below is the control that proves the
    //     two facts came apart rather than both vanishing.
    //   · C-10 stays, alone, on the cycle T-125 owns.
    // C-05 RETURNS AT THE T-135 HALF A MERGE REGEN (2026-08-26), by the
    // D1-source route it left by at T-033: `lib.rs -> dispatch/mod.rs` is
    // observed and C-05 does not declare C-15. `declaredOnly` below is
    // the control again and does NOT move — this merge adds a drift
    // SOURCE without adding a declared-only component, which is a
    // different mechanism from the one T-088 recorded, and pinning the
    // whole array is what makes the two distinguishable.
    // "unmapped" JOINS AT T-139 (2026-08-26, merge `aed77b6`), and it is
    // not a component — it is the bucket node the derivation synthesises
    // for `D2:unmapped`. So this list is "nodes carrying drift" and has
    // never been "components carrying drift"; the difference was invisible
    // while the bucket was empty and is visible now.
    // AND IT LEAVES AGAIN AT T-141, ONE MERGE LATER, BY THE SAME ROUTE IT
    // LEFT BY AT T-033 — a component claims the file, so there is no D2
    // subject and the derivation synthesises no bucket node. The lesson
    // survives the row: this list is "nodes carrying drift" and has never
    // been "components carrying drift", and the two entries that remain
    // are both real components again. `declaredOnly` below is the control
    // and does NOT move, which is the tell that a NODE left rather than a
    // component changing shape — the mirror of the T-135 Half A entry
    // above, where a drift source arrived and the control also held.
    expect(drift).toEqual(["C-05", "C-10"]);
    const declaredOnly = derived.components.filter((c) => c.declaredOnly).map((c) => c.id);
    expect(declaredOnly).toEqual(["C-01", "C-11"]);
    // THE CONTROL FOR THE DOWNGRADE, stated as its own assertion: the two
    // components that left the drift set are exactly the two that opted
    // in, and the flag is read off the record rather than inferred from
    // the empty file list they share with nobody else today.
    expect(derived.components.filter((c) => c.nonCode).map((c) => c.id)).toEqual(["C-01", "C-11"]);
    // AND THE PREDICATE ITSELF, asserted here because this is the fixture
    // that reads the live registry: `hasDrift` above and the map's rings
    // are the SAME rule, exported once from the engine. The drill caught
    // the moment they were two.
    // AND THIS IS THE FOURTH ASSERTION IN THIS BODY, WHICH IS WHY THE
    // T-135 CHECKPOINT MET IT SECOND. Reconciling `drift` above turned
    // this line red on its own re-run — the exact "a red on the first
    // hides the second" trap this file has warned about since T-028,
    // fired on the integrator that was reading the warning. Recorded
    // rather than quietly fixed: FOUR assertions live in this one body
    // and a fixture pass must re-run until the body is green, never
    // until the first message stops appearing.
    // AND THE T-139 CHECKPOINT MET IT THE SAME WAY, which is the second
    // consecutive integration to prove the warning above with its own
    // re-run: reconciling `drift` turned this line red on the next pass.
    // AND T-141 MET IT A THIRD TIME, WHICH MAKES THREE CONSECUTIVE HANDS.
    // This lane's first pass read `6 failed / 1007 passed` and its card
    // named exactly six bodies; the SEVENTH assertion was this line, hidden
    // under the `drift` red four lines up, and it surfaced only on pass 2
    // at `1 failed / 1012 passed`. **A COUNT OF FAILURES IS A FLOOR AND
    // NEVER A TOTAL** — and this time the floor was published in a card
    // before the run, which is the strongest form of the warning yet: even
    // a body-by-body forecast written from a scratch measurement missed it,
    // because a body is one unit to vitest and seven assertions to a
    // reader. Re-run until the BODY is green, never until the first message
    // stops appearing.
    expect(derived.findings.filter(isDriftFinding).map((f) => f.id)).toEqual([
      "D1:C-05->C-15",
      "D1:C-10->C-14",
    ]);
  });

  it("stable rollup structure (values live in the unit tables, not here)", () => {
    const byId = new Map(derived.components.map((c) => [c.id, c]));
    // C-01 dogfoods the pin feature: pinned done, no task slug maps to it.
    expect(byId.get("C-01")?.pinned).toBe(true);
    expect(byId.get("C-01")?.status).toBe("done");
    expect(byId.get("C-01")?.tasks).toEqual([]);
    // Task membership that cannot churn: done tasks keep their touches.
    const taskIds = (id: string): (string | undefined)[] =>
      (byId.get(id)?.tasks ?? []).map((t) => t.id);
    expect(taskIds("C-06")).toContain("T-002");
    expect(taskIds("C-06")).toContain("T-008");
    expect(taskIds("C-07")).toContain("T-009");
    expect(taskIds("C-12")).toContain("T-011");
    // Every component resolves to a real status; pins are where declared.
    for (const component of derived.components) {
      expect(["planned", "building", "verifying", "rejected", "done", "merging"]).toContain(
        component.status,
      );
    }
    expect(derived.components.filter((c) => c.pinned).map((c) => c.id)).toEqual(["C-01"]);
  });
});
