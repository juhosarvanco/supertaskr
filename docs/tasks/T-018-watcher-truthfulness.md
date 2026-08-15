---
id: T-018
title: Watcher never silently lies or dies
feature: F-02
milestone: 4
priority: 9
size: M
status: verifying
blocked_by: []
touches: [app-shell]
builder: claude-fable-5
verifier:
built_by: "claude-fable-5 @fresh"
verified_by:
review:
---

Absorbs: T-003-s1 (residual), T-003-s3, and T-003-s2's reporting
half (the scale work itself stays parked). Triage 2026-08-15.
Schedule alongside milestone 2: graph.json rides this same collector
under the same caps.

## Acceptance criteria
- WHEN docs/ appears or is replaced under the open project root THE
  watcher SHALL re-arm itself (root sentinel; recovery today is a
  manual re-pick nobody would know to do).
- WHEN the collector skips a path (>1 MiB, non-UTF-8, depth/file-cap)
  THE snapshot SHALL carry the skipped paths + reasons and THE
  frontend SHALL surface them in the existing parse-error chip family
  — a skipped existing record must not read as a deletion.
- WHEN the 2000-file cap truncates THE snapshot SHALL set a truncated
  flag surfaced as a quiet footer note (design's "symbols truncated"
  pattern).
- IF the sentinel or skip-reporting paths fail THEN the existing
  watch SHALL be unaffected (additive telemetry, never a new failure
  mode) — pinned by cargo tests.

## Implementation notes

Executor claude-fable-5 @fresh, 2026-08-16, branch `t018-watcher-truth`
(worktree, parallel with T-019 — zero shared files). Three commits:
Rust half, frontend half, chip-count honesty + notes. All app-shell:
docs_watch.rs (+ one doc-comment line in lib.rs), docs-model.ts,
watcher-store.ts, App.tsx chip strip, app/test/**. Zero diff on board
components, app/src/architecture/**, lib/parser/**, tokens/index.css,
capabilities/CSP, dependencies.

### Criterion 1 — root sentinel (WHEN docs/ appears or is replaced)

The missing TRIGGER for the existing T-007 re-arm machinery, not a new
mechanism: `rearm` now also arms a NON-RECURSIVE notify watch on the
project root (`arm_sentinel`), and the batch handler runs
`ensure_docs_watch` before collecting. The check is deliberately
STAT-BASED, not event-path-based (notify backends disagree about path
forms; "does `<root>/docs` exist, and is it the directory we armed?"
does not): armed-state + `has_plain_docs_dir` + a unix (dev, ino)
identity (`dir_identity`) detect the three transitions —
- **appears** (T-003-s1 case 1): startup with a docsless root now sets
  the sentinel scope (`target.root`) even though the docs arm failed, so
  `mkdir docs` + first write re-arms and ships the tree — previously
  restart-or-repick territory. STARTUP ONLY: a failed pick still never
  moves the sentinel off the previously open project (rearm's
  fail-clean contract is untouched — the pre-existing pick tests pass
  unmodified).
- **replaced** (case 2, the stale-handle death): identity mismatch →
  unwatch old handle (its failure tolerated), watch fresh, KEEP the
  emit baseline so the same batch emits the content diff. The
  same-folder re-pick branch of `rearm` also heals this now (it used to
  keep the stale handle — the "manual re-pick nobody would know to do"
  didn't even work for the same folder).
- **vanishes**: disarm (drop the dead handle) so a later appearance
  re-arms; the empty-tree emit (deletion semantics) is unchanged.
The sentinel's fs noise (root-level sibling churn, .git entry mtime)
lands in the existing collect-and-suppress path — one no-op collect per
debounced batch, no emits.

### Criterion 2 — skip surfacing (paths + reasons, no phantom deletions)

`collect_docs_tree` (docs_watch.rs) returns `CollectOutcome {files,
skipped, skipped_total, truncated}`; `DocsSnapshot` carries the three
new fields (camelCase serde). Reasons: `oversize` (>1 MiB), `nonUtf8`
(read InvalidData), `tooDeep` (ONE entry for the offending directory,
not per buried file), `fileCap` (past MAX_FILES), `unreadable`
(non-NotFound read/readdir errors — a permission-denied subtree used to
vanish silently too). Eligibility is decided BEFORE any skip verdict
(canonicalize → containment → `is_collected_docs_path`), so only files
that WOULD have been collected are reported — a 2 MiB .txt stays
silent. **Symlinks stay silent BY DECISION** (T-003-s3's open question,
settled): they are ADR-010 security refusals, not telemetry, and
reporting them would hand a hostile repo a path-disclosure channel. The
report list is capped (`MAX_SKIPPED_REPORTED` 200, path-sorted) so
telemetry cannot win back the payload the caps took away;
`skipped_total` stays the honest count and the frontend chip counts
from IT (tooltip gains "…and N more" when clipped). NotFound during
read stays silent — a vanish mid-read is a deletion in progress, not a
skip.

Frontend: `DocsSnapshotPayload` gains OPTIONAL `skipped`/
`skippedTotal`/`truncated` (pre-T-018 payloads, fixtures, and the dev
harness stay valid — absent = clean). `applySnapshot` treats a skipped
path as PRESENT: exempt from the deletion sweep, and a skipped MODEL
INPUT with last-good content keeps rendering it
(`showingLastGood: true`) — the criterion's "must not read as a
deletion", by the same machinery parse failures use. Skips are NOT
folded into `failures`: `ParseIssue` is the parser's closed union and a
collector skip is not a parse issue (faking one would touch lib/parser
— fenced); instead `DocsModelState.skipped: SkippedEntry[]` feeds the
same CHIP FAMILY in App.tsx — `SkippedFilesBadge`, a byte-identical
terracotta sibling of the parse chip (`N skipped file(s) · last valid
state`, per-path reason tooltip), plus lines in the existing
`parse-error-details` strip (`<path>: skipped — over 1 MiB (showing
last valid state)`). The skipped GRAPH keeps T-012 §4's no-last-good
design — `graphContent` goes undefined (map degrades to its
index-not-run family, Re-index heals) but the skip is surfaced in the
chip, closing T-012 §5's "indistinguishable from absent" note. The
`model-updated` echo now carries `skippedTotal` + `truncated` and the
`docs-changed` stdout line prints them — the round trip's evidence
channel says what the frontend saw.

### Criterion 3 — truncation flag + quiet note

`truncated` rides the snapshot when the file cap clips. Collection is
now TWO-PHASE (walk-classify → sort → cap → read), which makes cap
membership deterministic — the first 2000 readable paths in path order
— instead of traversal-order luck; T-003-s2's recorded nondeterminism
(WHICH files drop) would otherwise have made outcome-equality
suppression emit phantom churn in the truncated regime. Under-cap trees
produce byte-identical files lists to the old collector (same set, same
sort). Surfaced as the design's "symbols truncated" pattern in the
SHELL's chip strip (the map's own note is untouched): muted mono
`docs truncated · showing first {fileCount} files`
(`data-testid="docs-truncation-note"`, inside the data-panel-exempt
header group). Smallest-choice copy recorded here; `fileCount` (new on
the model state) is what actually rode the snapshot, so the note never
overclaims.

### Criterion 4 — additive-only (telemetry is never a failure mode)

- `arm_sentinel` is best-effort by construction: called AFTER the docs
  watch is armed, every failure path logs and leaves docs
  watch/baseline/ack exactly as pre-T-018; `ensure_docs_watch` failure
  paths all degrade to "watch as before, retry on the next batch".
- Whole-outcome equality is the new suppression baseline — a skip
  change alone (file crosses 1 MiB with no collected file changing)
  emits, otherwise the frontend keeps stale skip truth
  (`outcome_equality_is_the_suppression_baseline_including_skips`, and
  live: `a_file_crossing_the_size_line_emits_with_a_skip_not_a_silent_
  deletion`).
- Pinned by cargo tests:
  `a_dead_sentinel_leaves_the_existing_watch_fully_working` (batch
  handler driven directly with `sentinel: None` — suppression and emit
  behave exactly as pre-T-018) and
  `a_vanished_root_never_panics_the_batch_handler` (root deleted
  mid-run: empty-tree emit, then suppression, no panic). The factored
  `handle_fs_batch` seam exists precisely so these run without fs-event
  timing.

### Verification (macOS 15/Darwin 25.6, node 22, fresh worktree — parser
built first per CONVENTIONS order)

- lib/parser (untouched): `npm ci` + `npx vitest run` → **132/132**;
  `npx tsc --noEmit` clean; `npm run build` clean.
- app: `npm ci` + `npm run build` (tsc incl. test/ + vite) exit 0;
  `npm test` → **392/392** (375 baseline + 17 new: 9 reducer skip tests
  + 1 phrase test, 2 store, 6 DOM in new test/watcher-truth.test.tsx —
  chip/strip/note rendering, recovery, no-invented-record,
  clipped-count honesty, skip-vs-deletion contrast).
- app/src-tauri: bare `cargo test` → **121 passed + 2 ignored**
  (baseline 109+2, +12 new in docs_watch: 6 collector-report units
  incl. the 2207-file determinism/clip attack, 1 live skip round trip,
  3 live sentinel tests — created-late, replaced-wholesale-then-
  in-place-edit, deleted-empty-recreated — and the 2 additive-only
  pins). The replaced-wholesale test is the regression proof: on
  pre-T-018 main the in-place edit after a docs/ swap produces no
  event and the test times out.
- `cargo test -p nputer-index --test self_graph self_graph_is_current
  -- --ignored` → **FAILED, expected**: the new
  app/test/watcher-truth.test.tsx is not in the committed graph.
  Integrator regenerates at merge (T-009-s1 standing practice; this
  branch adds exactly one TS file).
- Hygiene greps over the diff: zero dangerouslySetInnerHTML/innerHTML/
  eval, zero Tailwind arbitrary values (chip/note reuse the existing
  utility set; no token changes).

### Flags for the verifier

- The sentinel is STAT-driven; only its WAKE-UP is event-driven. Attack
  surface worth probing: rapid replace-swap storms (rename A→B→A inside
  one debounce window), a docs/ replaced by a symlink (has_plain_docs_
  dir refuses → treated as vanished → disarm + empty emit — ADR-010
  posture preserved), and sentinel behavior across project switches
  (old root's sentinel is unwatched on move).
- `collect_docs_files` survives as a `#[cfg(test)]` wrapper so all
  pre-T-018 collector tests run verbatim against the new two-phase
  implementation — deliberate equivalence evidence, not dead code.
- Payload growth: +`"skipped":[],"skippedTotal":0,"truncated":false`
  (~45 bytes) per snapshot in the clean case; skip entries only when
  skips exist, list capped at 200.
- IPC/ACL surface: ZERO diff (no new commands, no capability entries,
  CSP untouched; the snapshot event carries strictly more fields on the
  same channel).
- Recorded residuals: (1) Windows cannot detect a REPLACED docs/
  (identity is unix-only; appears/vanishes still handled) — filed as
  T-018-s1; (2) `mkdir docs` with no files re-arms but emits nothing
  (empty tree equals the empty baseline), so the front door stays until
  the first file lands — sided with the emit-suppression invariant and
  the design's "an empty folder is an invitation"; (3) the project ROOT
  itself being replaced wholesale kills both handles — recovery is the
  picker, out of this criterion's scope; (4) a skip-list clip (>200
  skipped files) hides per-path detail beyond the cap — aggregate
  honesty via skippedTotal + the chip's "…and N more" tooltip line.

### Suggestions filed

- `T-018-s1-windows-replace-identity.md` — non-unix dir-identity gap
  (replaced-docs detection degrades to pre-T-018 keep-the-watch there).

## Verdicts
