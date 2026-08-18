import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import { deriveArchitecture, UNMAPPED_ID } from "../src/lib/architecture/derive";
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

  it("the live registry is the eleven known components", () => {
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
    ]);
    expect(derived.mode).toBe("full");
    expect(derived.components.filter((c) => c.kind === "declared")).toHaveLength(11);
    expect(derived.components.filter((c) => c.kind === "placeholder")).toHaveLength(0);
  });

  it("all 117 files map — zero unclaimed territory after the §2 amendments", () => {
    expect(derived.fileComponent.size).toBe(117);
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
      ["C-05", 54],
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
      ["C-06", 25],
      ["C-08", 10],
      ["C-09", 3],
      ["C-10", 2],
      // 11 → 14 at the T-034 merge regen: TasksLens.tsx, map-lens.ts and
      // task-waves.ts all land under app/src/architecture/**, C-12's own
      // glob and its only claimant. The FILE LIST below moves with it —
      // same body, same merge, and it is the half that gets missed.
      ["C-12", 14],
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
      ["C-13", 8],
      // C-14 joins the mapping at the T-025 merge regen with exactly ONE
      // file: agent-store.ts. Its other declared path
      // (app/src-tauri/src/agent/**, five .rs files) is invisible to the
      // indexer until T-010 lands Rust extraction — languages is still
      // ["ts"]. The same arc C-13 walked at T-024, one language short.
      ["C-14", 1],
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
      "app/src/architecture/MapEdge.tsx",
      "app/src/architecture/MapNode.tsx",
      "app/src/architecture/MapPanel.tsx",
      "app/src/architecture/MapProvenanceMark.tsx",
      "app/src/architecture/MapView.tsx",
      "app/src/architecture/TasksLens.tsx",
      "app/src/architecture/map-layout.ts",
      "app/src/architecture/map-lens.ts",
      "app/src/architecture/map-search.ts",
      "app/src/architecture/map-visuals.ts",
      "app/src/architecture/task-waves.ts",
      "app/src/lib/architecture/derive.ts",
      "app/src/lib/architecture/glob.ts",
      "app/src/lib/architecture/graph.ts",
    ]);
  });

  it("no file-level ambiguity: the umbrella really is non-overlapping", () => {
    expect(derived.issues).toEqual([]);
  });

  it("THE FINDINGS: ten undeclared dependencies, three declared-only components, no unclaimed territory", () => {
    expect(derived.findings).toEqual([
      {
        rule: "D1",
        id: "D1:C-05->C-06",
        from: "C-05",
        to: "C-06",
        fileEdges: [
          { from: "app/test/architecture-derive.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/architecture-dogfood.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/board-truth.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-dogfood-render.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-search.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          // Both NEW at the T-034 merge regen: 8 → 10 file edges. This
          // LIST is a separate assertion from the relation table's
          // observedCount below and lives in a different it() body — the
          // count going right does not make the list right.
          { from: "app/test/map-task-waves.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-tasks-lens-dom.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-view-dom.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/select-board.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/select-task-detail.test.ts", to: LIB_PARSER, package: PARSER_PKG },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-05->C-09",
        from: "C-05",
        to: "C-09",
        fileEdges: [
          { from: "app/test/detail-presentation.test.ts", to: "app/src/lib/task-detail.ts" },
          { from: "app/test/panel-dismissal.test.ts", to: "app/src/components/board/panel-dismissal.ts" },
          { from: "app/test/select-task-detail.test.ts", to: "app/src/lib/task-detail.ts" },
        ],
      },
      {
        // T-024 merge regen: C-05's own suites reach into the genesis
        // pane under the app/test/** umbrella — real drift, same shape
        // as C-05→C-06 and C-05→C-09 above.
        // T-037 merge regen: 2 → 4 file edges, and the finding CHANGES
        // CHARACTER. The first entry below is a SOURCE edge — the shell
        // screen importing the lens — where before this merge the pair
        // carried only test-suite edges. That import is the whole point
        // of T-037; T-026's merge measured its absence as proof the lens
        // was unmounted. Left UNDECLARED deliberately (see the dated
        // T-037 addendum above for the integrator's reasoning); this row
        // is the drift signal the architect is meant to rule on, not a
        // blemish to drain at the merge that created it.
        // T-027 merge regen: 4 → 10 file edges, the largest growth this
        // list has taken, and it is a LIST that moves — the relation
        // table's observedCount below is a different assertion in a
        // different it() body, so the count going right does not make
        // this right. Two of the six additions are SOURCE edges, not
        // suite edges: App.tsx now starts the interview subscription and
        // GenesisScreen.tsx mounts the chat beside the lens.
        rule: "D1",
        id: "D1:C-05->C-13",
        from: "C-05",
        to: "C-13",
        // T-028 merge regen: 10 → 13 file edges. GenesisScreen.tsx gains
        // TWO (BoardCrescendo.tsx and crescendo.ts — the screen now picks
        // which renderer fills the slot, so it imports both the decision
        // and the board half) and crescendo.test.ts adds the third.
        // T-029 merge regen: 13 → 15. Both additions are the ONE new
        // indexed file reaching two C-13 modules, and both are DYNAMIC
        // `await import(...)` references — the indexer resolves them to
        // ordinary file edges, the same thing T-050 established for
        // startup-recovery.test.ts. The list GROWS but the FINDING COUNT
        // does not, which is why no drift ring moves at this merge.
        // T-056 merge regen: 15 → 17. The existing resume DOM suite now
        // imports interview-model and interview-turns directly to pin
        // stable live + rehydrated turn identity without adding a new
        // indexed test file. The finding count still does not move.
        fileEdges: [
          { from: "app/src/App.tsx", to: "app/src/genesis/interview-source.ts" },
          {
            from: "app/src/components/shell/GenesisScreen.tsx",
            to: "app/src/genesis/BoardCrescendo.tsx",
          },
          {
            from: "app/src/components/shell/GenesisScreen.tsx",
            to: "app/src/genesis/GenesisPane.tsx",
          },
          {
            from: "app/src/components/shell/GenesisScreen.tsx",
            to: "app/src/genesis/InterviewChat.tsx",
          },
          {
            from: "app/src/components/shell/GenesisScreen.tsx",
            to: "app/src/genesis/crescendo.ts",
          },
          { from: "app/test/crescendo.test.ts", to: "app/src/genesis/crescendo.ts" },
          { from: "app/test/genesis-derive.test.ts", to: "app/src/genesis/genesis-derive.ts" },
          {
            from: "app/test/genesis-pane-boundary.test.tsx",
            to: "app/src/genesis/GenesisPane.tsx",
          },
          { from: "app/test/genesis-pane-dom.test.tsx", to: "app/src/genesis/GenesisPane.tsx" },
          {
            from: "app/test/interview-chat-dom.test.tsx",
            to: "app/src/genesis/InterviewChat.tsx",
          },
          {
            from: "app/test/interview-chat-dom.test.tsx",
            to: "app/src/genesis/interview-source.ts",
          },
          { from: "app/test/interview-harness.test.ts", to: "app/src/genesis/interview-source.ts" },
          { from: "app/test/interview-model.test.ts", to: "app/src/genesis/interview-model.ts" },
          {
            from: "app/test/interview-resume-dom.test.tsx",
            to: "app/src/genesis/InterviewChat.tsx",
          },
          {
            from: "app/test/interview-resume-dom.test.tsx",
            to: "app/src/genesis/interview-model.ts",
          },
          {
            from: "app/test/interview-resume-dom.test.tsx",
            to: "app/src/genesis/interview-source.ts",
          },
          {
            from: "app/test/interview-resume-dom.test.tsx",
            to: "app/src/genesis/interview-turns.tsx",
          },
        ],
      },
      {
        // NEW at the T-025 merge regen, and the SIXTH undeclared row:
        // C-05's app/test/** umbrella reaches into C-14's store the
        // moment the store joins the index. Exactly the shape C-13 took
        // at T-024 and for the same structural reason — the suite is
        // C-05's by umbrella, the module it drives belongs to the child
        // component. Left UNDECLARED, same reasoning as C-05→C-13 above:
        // the integrator regenerates, the ARCHITECT rules on the
        // registry, and draining a finding at the merge that created it
        // destroys the signal. Filed for triage.
        // T-027 merge regen: 1 → 3 file edges, the SECOND grown list at
        // this merge and the one most easily missed — both additions are
        // new interview suites reaching the store directly rather than
        // through C-13.
        rule: "D1",
        id: "D1:C-05->C-14",
        from: "C-05",
        to: "C-14",
        // T-028 merge regen: 3 → 5, the same shape a THIRD time — both new
        // crescendo suites drive the store directly rather than through
        // C-13.
        // T-029 merge regen: 5 → 6, a FOURTH time, and this entry is worth
        // a sentence because it settles how observedCount is counted:
        // interview-resume-dom.test.tsx imports agent-store BOTH statically
        // (line 5) and dynamically (line 65) and contributes exactly ONE
        // file edge. observedCount is the number of DISTINCT (from,to) file
        // pairs, not the number of import statements.
        fileEdges: [
          { from: "app/test/agent-store.test.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/test/crescendo-dom.test.tsx", to: "app/src/lib/agent-store.ts" },
          { from: "app/test/crescendo.test.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/test/interview-chat-dom.test.tsx", to: "app/src/lib/agent-store.ts" },
          { from: "app/test/interview-model.test.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/test/interview-resume-dom.test.tsx", to: "app/src/lib/agent-store.ts" },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-08->C-05",
        from: "C-08",
        to: "C-05",
        fileEdges: [
          { from: "app/src/components/board/TaskCard.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/badges/ModelBadge.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/badges/SizeBadge.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/lib/board-model.ts", to: "app/src/lib/verdicts.ts" },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-09->C-05",
        from: "C-09",
        to: "C-05",
        fileEdges: [
          { from: "app/src/components/board/TaskDetailPanel.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/TaskDetailPanel.tsx", to: "app/src/lib/verdicts.ts" },
        ],
      },
      {
        // NEW at the T-027 merge regen, and the row the branch's own
        // forecast did NOT predict: the first genesis-side use of a
        // SHARED UI PRIMITIVE. Both new chat components import
        // components/ui/button.tsx, which is C-05's by umbrella — so
        // C-13 becomes a D1 SOURCE for the first time, which is also why
        // it joins the drift set below.
        rule: "D1",
        id: "D1:C-13->C-05",
        from: "C-13",
        to: "C-05",
        // T-028 merge regen: 2 → 3 — BoardCrescendo.tsx's completion CTA
        // is the same shared primitive, so the row grows by the same
        // route it was created by.
        fileEdges: [
          { from: "app/src/genesis/BoardCrescendo.tsx", to: "app/src/components/ui/button.tsx" },
          { from: "app/src/genesis/InterviewChat.tsx", to: "app/src/components/ui/button.tsx" },
          { from: "app/src/genesis/interview-turns.tsx", to: "app/src/components/ui/button.tsx" },
        ],
      },
      {
        // NEW at the T-028 merge regen, and the FIRST time the genesis
        // pane reaches the PARSER directly: crescendo.ts counts task
        // RECORDS rather than files, so the switch is a parse result and
        // not a filename match. That is criterion 1's whole point showing
        // up as a component edge.
        rule: "D1",
        id: "D1:C-13->C-06",
        from: "C-13",
        to: "C-06",
        fileEdges: [
          { from: "app/src/genesis/crescendo.ts", to: "lib/parser", package: "p:@nputer/parser" },
        ],
      },
      {
        // NEW at the T-028 merge regen, and the row that IS the task: the
        // genesis pane mounts C-08's real Board. One import, read-only —
        // `git diff` over app/src/components/board/ is a 0-file diff, so
        // the board was composed rather than copied. Left UNDECLARED on
        // the standing reasoning: the integrator regenerates, the
        // ARCHITECT rules on the registry, and draining a finding at the
        // merge that created it destroys the signal.
        rule: "D1",
        id: "D1:C-13->C-08",
        from: "C-13",
        to: "C-08",
        fileEdges: [
          {
            from: "app/src/genesis/BoardCrescendo.tsx",
            to: "app/src/components/board/Board.tsx",
          },
        ],
      },
      {
        // NEW at the T-027 merge regen and forecast: all four new genesis
        // modules read C-14's store, because T-027 adds no reducer of its
        // own — the store already folds the genesis-turn channel and the
        // chat renders turn.text as given. Left UNDECLARED on the
        // standing reasoning: the integrator regenerates, the ARCHITECT
        // rules on the registry, and draining a finding at the merge that
        // created it destroys the signal. Flagged for triage.
        rule: "D1",
        id: "D1:C-13->C-14",
        from: "C-13",
        to: "C-14",
        // T-028 merge regen: 4 → 5 — crescendo.ts reads the store too,
        // which is how it sees turns without ever reading turn TEXT.
        fileEdges: [
          { from: "app/src/genesis/InterviewChat.tsx", to: "app/src/lib/agent-store.ts" },
          { from: "app/src/genesis/crescendo.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/src/genesis/interview-model.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/src/genesis/interview-source.ts", to: "app/src/lib/agent-store.ts" },
          { from: "app/src/genesis/interview-turns.tsx", to: "app/src/lib/agent-store.ts" },
        ],
      },
      // D3:C-13 cleared at the T-024 merge regen exactly as predicted,
      // and D3:C-14 cleared at the T-025 one on the same arc and inside
      // a single merge: the branch declared C-14 with no indexed file
      // (D3 appears), this regen indexed agent-store.ts (D3 clears). The
      // three that remain are the genuinely code-less components — C-01
      // is method/ (not code), C-07 is Rust-only until T-010, C-11 is
      // still planned.
      { rule: "D3", id: "D3:C-01", component: "C-01" },
      { rule: "D3", id: "D3:C-07", component: "C-07" },
      { rule: "D3", id: "D3:C-11", component: "C-11" },
    ]);
  });

  it("the full relation table: 13 confirmed, 10 undeclared, 9 planned", () => {
    expect(derived.edges.map((e) => [e.from, e.to, e.relation, e.observedCount])).toEqual([
      ["C-05", "C-01", "planned", 0],
      // 8 → 10 at the T-034 merge regen: both new map suites import
      // @nputer/parser, riding the T-009 package.path seam like the
      // eight before them. The fileEdges LIST above moves with it.
      ["C-05", "C-06", "undeclared", 10],
      ["C-05", "C-08", "confirmed", 4],
      ["C-05", "C-09", "undeclared", 3],
      // 10 → 13 at the T-024 merge regen: both genesis suites import
      // docs-model, and the DOM suite also drives watcher-store.
      // 13 → 16 at the T-026 merge regen: GenesisScreen.tsx takes a
      // DocsModelState (the first shell-side src edge into C-10), and
      // genesis-entry.test.tsx drives both docs-model and watcher-store.
      // 16 → 19 at the T-037 merge regen: both new suites import
      // docs-model, and genesis-pane-boundary.test.tsx also drives
      // watcher-store. All three in the DECLARED direction.
      // 19 → 20 at the T-041 merge regen: shell-harness.test.ts drives
      // watcher-store — the ONLY observedCount this merge moves.
      // 20 → 21 at the T-048 merge regen: shell-frame.test.tsx imports
      // docs-model (a DocsSnapshotPayload type import) — again the only
      // observedCount that moves.
      // 21 → 23 at the T-049 merge regen: accelerators.test.tsx imports
      // BOTH docs-model and watcher-store, so this one edge takes both
      // new imports. Still the only observedCount that moves.
      // 23 → 24 at the T-050 merge regen: startup-recovery.test.ts
      // reaches watcher-store through a DYNAMIC import — the indexer
      // resolves it to the same file edge, which is worth knowing and
      // was checked rather than assumed. Again the only one that moves.
      // 24 → 25 at the T-042 merge regen: genesis-switch-truth.test.tsx
      // type-imports DocsSnapshotPayload from app/src/lib/docs-model.ts,
      // which is C-10's by name. Its other module reference is
      // ../src/App, which is C-05's own — intra-component, so it adds no
      // row. Once again the only observedCount that moves.
      // 25 → 27 at the T-027 merge regen: interview-chat-dom.test.tsx and
      // interview-harness.test.ts both reach docs-model / watcher-store.
      // 27 → 31 at the T-028 merge regen: the two new crescendo suites
      // plus GenesisScreen and BoardCrescendo all read C-10's docs model,
      // on the already CONFIRMED edge.
      // 31 → 32 at the T-029 merge regen: interview-resume-dom.test.tsx
      // imports docs-model, on the already CONFIRMED edge.
      // 32 → 33 at the T-063 merge regen: startup-screen.test.tsx now
      // reaches watcher-store TWICE — a type import of StartupFailure and
      // a dynamic `await import` of STARTUP_DEADLINE_MS — and the indexer
      // folds both into the one file edge, so the count moves by one and
      // not by two. The dynamic arm is the CONSTANT PIN the executor added
      // to close the green poison (raising STARTUP_DEADLINE_MS 1000× left
      // every deadline test passing, because they all advance the fake
      // clock BY the constant): the guard against a test that cannot pin
      // its own constant is the very import that moves this number.
      // THE ONLY observedCount this merge moves, forecast before the regen
      // and confirmed by a throwaway probe against the fresh graph — the
      // node picture, the 32-row edge table, the ten D1 findings, the three
      // D3s and all eight per-component file counts are unchanged.
      ["C-05", "C-10", "confirmed", 33],
      ["C-05", "C-11", "planned", 0],
      // 20 → 22 at the T-034 merge regen: map-task-waves.test.ts imports
      // task-waves.ts and map-tasks-lens-dom.test.tsx imports MapView.tsx.
      ["C-05", "C-12", "confirmed", 22],
      // 2 → 4 at the T-037 merge regen, and one of the two additions is
      // the shell's own SOURCE import of the lens — the mount. Still
      // undeclared: the integrator's reasoning is in the dated addendum.
      // 4 → 10 at the T-027 merge regen — six new file edges, two of them
      // SOURCE edges (App.tsx → interview-source.ts and
      // GenesisScreen.tsx → InterviewChat.tsx). The fileEdges LIST above
      // moves with it, in a different it() body.
      // 10 → 13 at the T-028 merge regen (see the D1 list above).
      // 13 → 15 at the T-029 merge regen: the one new suite reaches
      // InterviewChat.tsx and interview-source.ts. The fileEdges LIST
      // above moves with it, in a different it() body.
      // 15 → 17 at the T-056 merge regen: the same suite reaches
      // interview-model.ts and interview-turns.ts to pin both identity
      // paths. No new test file, component or finding.
      ["C-05", "C-13", "undeclared", 17],
      // NEW at the T-025 merge regen: the sixth undeclared row, one file
      // edge (agent-store.test.ts → agent-store.ts). See the D1 above.
      // 1 → 3 at the T-027 merge regen: two new interview suites drive
      // the store directly. Its fileEdges list moves too.
      // 3 → 5 at the T-028 merge regen: both crescendo suites drive the
      // store directly.
      // 5 → 6 at the T-029 merge regen: the same new suite drives the
      // store directly. THREE observedCounts move in this one toEqual and
      // no row is created — the whole merge is eleven MODIFIED indexed
      // files and one NEW one, and only a new file can move a row.
      ["C-05", "C-14", "undeclared", 6],
      ["C-06", "C-01", "planned", 0],
      ["C-08", "C-05", "undeclared", 4],
      ["C-08", "C-06", "confirmed", 4],
      ["C-08", "C-09", "confirmed", 6],
      ["C-08", "C-11", "planned", 0],
      ["C-09", "C-05", "undeclared", 2],
      ["C-09", "C-06", "confirmed", 2],
      ["C-09", "C-08", "confirmed", 3],
      ["C-09", "C-11", "planned", 0],
      ["C-10", "C-06", "confirmed", 1],
      // 4 → 6 at the T-034 merge regen: task-waves.ts imports
      // lib/verdicts.ts and TasksLens.tsx imports lib/utils.ts — both
      // C-05's by NAME in the registry, not by umbrella. SIX and not the
      // seven the branch forecast: the third new app/src/lib/** edge
      // (TasksLens.tsx → lib/task-detail.ts) belongs to C-09, which
      // declares that file explicitly. See C-12→C-09 below.
      ["C-12", "C-05", "confirmed", 6],
      // 4 → 6: task-waves.ts and TasksLens.tsx both import
      // @nputer/parser, the package.path seam again.
      ["C-12", "C-06", "confirmed", 6],
      ["C-12", "C-07", "planned", 0],
      // 4 → 5 at the T-034 merge regen, and this is the assertion the
      // branch did not forecast at all: TasksLens.tsx imports
      // app/src/lib/task-detail.ts, which C-09-detail-panel.md names.
      // The notes cite MapPanel.tsx → task-detail.ts as the precedent
      // proving type-only imports create edges — the right file, the
      // wrong component. Already DECLARED (C-12 depends_on C-09), so it
      // is a bigger count on a confirmed row, not a new finding.
      ["C-12", "C-09", "confirmed", 5],
      ["C-12", "C-10", "confirmed", 1],
      ["C-12", "C-11", "planned", 0],
      // T-024's declared edges, met by reality at the merge regen: the
      // graph now indexes app/src/genesis/, so the docs-model edge is
      // CONFIRMED by both genesis sources. C-13→C-11 stays planned —
      // no TS import can confirm a token stylesheet, the same honest
      // state C-12→C-11 carries.
      // NEW at the T-027 merge regen and the SEVENTH undeclared row — the
      // one the branch's forecast missed. C-13 becomes a dependency
      // SOURCE for the first time: both new chat components import the
      // shared components/ui/button.tsx, which is C-05's.
      // 2 → 3 at the T-028 merge regen: BoardCrescendo.tsx's CTA is the
      // same shared primitive.
      ["C-13", "C-05", "undeclared", 3],
      // 2 → 4 at the T-027 merge regen: interview-model.ts and
      // interview-source.ts both import docs-model, on the already
      // DECLARED edge.
      // NEW at the T-028 merge regen and the NINTH undeclared row:
      // crescendo.ts imports the PARSER, because the lens→board switch
      // counts task RECORDS and not filenames.
      ["C-13", "C-06", "undeclared", 1],
      // NEW at the T-028 merge regen and the TENTH — the row that IS this
      // task: the genesis pane mounts C-08's real Board, read-only, with
      // a 0-file diff under app/src/components/board/.
      ["C-13", "C-08", "undeclared", 1],
      // 4 → 6 at the T-028 merge regen: crescendo.ts and BoardCrescendo.tsx
      // both read docs-model, on the already DECLARED edge.
      ["C-13", "C-10", "confirmed", 6],
      ["C-13", "C-11", "planned", 0],
      // NEW at the T-027 merge regen and the EIGHTH undeclared row, this
      // one forecast: all four new genesis modules read C-14's store.
      // T-027 adds no reducer — the store already folds the turns.
      // 4 → 5 at the T-028 merge regen: crescendo.ts reads the store too.
      ["C-13", "C-14", "undeclared", 5],
      // T-025's declared edge, honestly PLANNED: the runner's Rust half
      // consumes C-10's WatchState, which no TS import can confirm and
      // the indexer cannot see until T-010 extracts Rust — the same
      // honest state C-12→C-07 carries. It flips at the merge regen only
      // if agent-store.ts grows an import into C-10, which it does not.
      ["C-14", "C-10", "planned", 0],
    ]);
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
    ]);
    const c09 = derived.edges.find((e) => e.from === "C-09" && e.to === "C-06");
    expect(c09?.relation).toBe("confirmed");
    expect(c09?.fileEdges).toEqual([
      { from: "app/src/components/board/TaskDetailPanel.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/lib/task-detail.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    const c10 = derived.edges.find((e) => e.from === "C-10" && e.to === "C-06");
    expect(c10?.relation).toBe("confirmed");
    expect(c10?.fileEdges).toEqual([
      { from: "app/src/lib/docs-model.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    // The undeclared fourth consumer is C-05 (test files) — drift, not absence.
    expect(derived.edges.find((e) => e.from === "C-05" && e.to === "C-06")?.relation).toBe(
      "undeclared",
    );
  });

  it("drift flags land on the right nodes", () => {
    const drift = derived.components.filter((c) => c.hasDrift).map((c) => c.id);
    // D1 sources: C-05, C-08, C-09; D3: C-01, C-07, C-11. C-13 left the
    // set at the T-024 merge regen and C-14 at the T-025 one — both have
    // files now, and both are the TARGET of a D1 from C-05, never its
    // source. C-14 was in this list on the branch, before the regen it
    // could not run; it comes back out here, which is the ritual working.
    // C-13 REJOINS at the T-027 merge regen, and by the opposite route
    // to the one that took it out: it left T-024's set because it gained
    // FILES, and it comes back because it gained OUTGOING undeclared
    // edges — the first time it is a D1 source rather than only a target
    // (→C-05 via components/ui/button.tsx, →C-14 via agent-store.ts).
    expect(drift).toEqual(["C-01", "C-05", "C-07", "C-08", "C-09", "C-11", "C-13"]);
    const declaredOnly = derived.components.filter((c) => c.declaredOnly).map((c) => c.id);
    expect(declaredOnly).toEqual(["C-01", "C-07", "C-11"]);
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
