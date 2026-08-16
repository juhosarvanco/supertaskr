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

  it("all 90 files map — zero unclaimed territory after the §2 amendments", () => {
    expect(derived.fileComponent.size).toBe(90);
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
      ["C-05", 40],
      ["C-06", 21],
      ["C-08", 10],
      ["C-09", 3],
      ["C-10", 2],
      ["C-12", 11],
      // The genesis pane joined the index at the T-024 merge regen, and
      // STAYS 2 at T-037's: the mount gave the lens a consumer, not a
      // file.
      ["C-13", 2],
      // C-14 joins the mapping at the T-025 merge regen with exactly ONE
      // file: agent-store.ts. Its other declared path
      // (app/src-tauri/src/agent/**, five .rs files) is invisible to the
      // indexer until T-010 lands Rust extraction — languages is still
      // ["ts"]. The same arc C-13 walked at T-024, one language short.
      ["C-14", 1],
    ]);
    // The map pane joined its engine at the T-012 merge regen
    // (T-011-s1 option a keeps the trio in place under lib/).
    expect(derived.components.find((c) => c.id === "C-12")?.files).toEqual([
      "app/src/architecture/MapEdge.tsx",
      "app/src/architecture/MapNode.tsx",
      "app/src/architecture/MapPanel.tsx",
      "app/src/architecture/MapProvenanceMark.tsx",
      "app/src/architecture/MapView.tsx",
      "app/src/architecture/map-layout.ts",
      "app/src/architecture/map-search.ts",
      "app/src/architecture/map-visuals.ts",
      "app/src/lib/architecture/derive.ts",
      "app/src/lib/architecture/glob.ts",
      "app/src/lib/architecture/graph.ts",
    ]);
  });

  it("no file-level ambiguity: the umbrella really is non-overlapping", () => {
    expect(derived.issues).toEqual([]);
  });

  it("THE FINDINGS: six undeclared dependencies, three declared-only components, no unclaimed territory", () => {
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
        rule: "D1",
        id: "D1:C-05->C-13",
        from: "C-05",
        to: "C-13",
        fileEdges: [
          {
            from: "app/src/components/shell/GenesisScreen.tsx",
            to: "app/src/genesis/GenesisPane.tsx",
          },
          { from: "app/test/genesis-derive.test.ts", to: "app/src/genesis/genesis-derive.ts" },
          {
            from: "app/test/genesis-pane-boundary.test.tsx",
            to: "app/src/genesis/GenesisPane.tsx",
          },
          { from: "app/test/genesis-pane-dom.test.tsx", to: "app/src/genesis/GenesisPane.tsx" },
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
        rule: "D1",
        id: "D1:C-05->C-14",
        from: "C-05",
        to: "C-14",
        fileEdges: [
          { from: "app/test/agent-store.test.ts", to: "app/src/lib/agent-store.ts" },
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

  it("the full relation table: 13 confirmed, 6 undeclared, 9 planned", () => {
    expect(derived.edges.map((e) => [e.from, e.to, e.relation, e.observedCount])).toEqual([
      ["C-05", "C-01", "planned", 0],
      ["C-05", "C-06", "undeclared", 8],
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
      ["C-05", "C-10", "confirmed", 21],
      ["C-05", "C-11", "planned", 0],
      ["C-05", "C-12", "confirmed", 20],
      // 2 → 4 at the T-037 merge regen, and one of the two additions is
      // the shell's own SOURCE import of the lens — the mount. Still
      // undeclared: the integrator's reasoning is in the dated addendum.
      ["C-05", "C-13", "undeclared", 4],
      // NEW at the T-025 merge regen: the sixth undeclared row, one file
      // edge (agent-store.test.ts → agent-store.ts). See the D1 above.
      ["C-05", "C-14", "undeclared", 1],
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
      ["C-12", "C-05", "confirmed", 4],
      ["C-12", "C-06", "confirmed", 4],
      ["C-12", "C-07", "planned", 0],
      ["C-12", "C-09", "confirmed", 4],
      ["C-12", "C-10", "confirmed", 1],
      ["C-12", "C-11", "planned", 0],
      // T-024's declared edges, met by reality at the merge regen: the
      // graph now indexes app/src/genesis/, so the docs-model edge is
      // CONFIRMED by both genesis sources. C-13→C-11 stays planned —
      // no TS import can confirm a token stylesheet, the same honest
      // state C-12→C-11 carries.
      ["C-13", "C-10", "confirmed", 2],
      ["C-13", "C-11", "planned", 0],
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
    expect(drift).toEqual(["C-01", "C-05", "C-07", "C-08", "C-09", "C-11"]);
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
