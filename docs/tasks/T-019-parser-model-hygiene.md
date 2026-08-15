---
id: T-019
title: Parser model hygiene — ids, cross-references, ghost context
feature: F-02
milestone: 4
priority: 10
size: M
status: verifying
blocked_by: [T-008]
touches: [lib-parser, app-board]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-002-s1, T-002-s2, T-002-s3. Triage 2026-08-15. Kept
separate from T-011 (task-graph layer, not architecture layer). Land
before milestone 3 — the interview writes the task graphs this
validates. blocked_by T-008 for lib-parser touch serialization only.

## Acceptance criteria
- THE parser SHALL gain validateProject() cross-reference issues:
  blocked_by → missing task id, feature → missing backbone id,
  id ↔ filename mismatch — parse-issue severity, collect-don't-throw.
- THE parser SHALL validate task id format (^T-\d+(-s\d+)?$ family;
  `id: banana` becomes a structured issue) and feature ids on tasks
  (^F-\d+$) — same first-match ordering discipline as existing rules.
- THE suggestion preamble (the context paragraph before the first
  heading) SHALL be preserved in the typed model AND rendered in the
  ghost detail panel (a suggestion's paragraph is its entire content;
  today the panel renders empty).
- IF a file's issues include cross-reference findings THEN the record
  still renders (flagging, not hiding — the T-002 contract).

## Implementation notes

2026-08-16, executor claude-fable-5 @fresh, branch t019-parser-hygiene.

**Criterion 1 — validateProject() cross-references (both entries).**
New pure module lib/parser/src/validate.ts: `validateProject({tasks,
features}) -> ParseIssue[]`, exported from index.ts AND pure.ts, and
invoked by BOTH assemblers — parseProject and parseProjectFromFiles
(both return paths of the latter, so disk/pure stay deep-equal; the
existing mirror tests prove it). Issue order: task → roadmap →
component → cross-reference; within the pass, tasks in path-sorted
order, per task blocked_by (list order) → feature → id↔filename.
blocked_by→missing-task and feature→missing-backbone reuse the
`dangling-reference` kind (defined generically for exactly this;
component depends_on already used it — same shape, message style
mirrored); id↔filename is the new additive `id-mismatch` kind
{file, id, expected, message}. The union extension is safe: the app
consumes issues generically (count + first message; no exhaustive kind
switch anywhere — verified by grep). ADR-009: membership is
Set<string>, so `blocked_by: [__proto__]` cannot resolve via
inheritance (test pins it). Two deliberate skips, both documented in
the module: (a) the feature check is skipped when the model has ZERO
features — an absent/failed roadmap already reports itself once
(io-error/roadmap-error), and the pinned pre-T-019 missing-roadmap
test (exactly one issue) ratifies that cascading one dangler per task
is noise, not findings; (b) filename comparison is skipped when the
basename encodes no id — see T-019-s2 for the deliberate narrowness.
Verification: lib/parser/test/validate.test.ts (13 tests: each rule
both entries, exact issue shapes/order, hostile ids, hand-built-model
standalone call incl. `validateProjectPure === validateProject`,
no-mutation, disk-layer wiring).

**Criterion 2 — id format (+ feature format pinned).**
`^T-\d+(-s\d+)?$` joins parseTaskFile's id chain as an else-if — the
same first-match discipline as every field rule (absent → missing;
wrong type → invalid; bad pattern → invalid; one issue per field).
`id: banana` → structured invalid-field naming file+field. A
format-invalid id stays OFF the record, so the identity gate withholds
the card for id-requiring statuses — deliberately consistent with the
pinned `id: 007` YAML-number probe (verifier-probes) and the loud-trap
design (CONVENTIONS: the parse-error badge is the designed surface for
identity failures); a SUGGESTED task with a bad id keeps its record
id-less (flagged, not hidden). Family tests cover T-1/T-016/T-016-s1/
T-999-s12 pass and t-016/T016/T-016-s/T-016-x1/T-016-s1-s2 fail. The
feature rule (^F-\d+$) predated T-019 — now explicitly pinned with a
`feature: banana` test. Records only ever carry well-formed ids after
this, which is what lets the mismatch check skip a format guard.

**Criterion 3 — suggestion preamble, model + ghost panel.**
splitSections now captures body text before the FIRST `##` heading (of
any kind) as `sections.preamble` — trimmed, absent when empty, never
an empty string; a heading-less body (the suggestion shape) is all
preamble. `## Preamble` cannot address the key (not in the null-proto
KEYS map), unknown-heading content stays dropped. The verifier probe
that pinned the DROPPED behavior (citing T-002-s2) is flipped to pin
preservation, dated. TaskDetail gains `preamble?` (same
empty-normalization as the other sections); TaskDetailPanel's
SUGGESTED variant only renders a leading "context" section
(testid detail-context / detail-context-text): verbatim,
whitespace-pre-wrap + break-words + min-w-0 (the T-004-s1 containment
— class-pinned in board-truth against a 200-char unbroken run),
visibly-empty fallback like every other section. Non-suggested panels
are byte-identical to before (test pins no detail-context there).

**Criterion 4 — flagged records still render.**
Cross-reference findings are project-level and never touch the
identity gate, so flagged records stay in `tasks` (parser tests assert
records + exact issues together), docs-model's failure predicate never
sees them (soft issues by construction — record present), and the
board renders the card. App-side pin: select-task-detail derives a
full detail from a record carrying both dangling kinds; board-truth
renders the ghost panel from a real parsed model.

**Live-tree zero-new-issues proof.** Audited before finalizing
patterns, then proven three ways on every suite run: (1) parser smoke
test — parseProject over THIS repo, `issues toEqual([])`, now WITH
validation wired in; (2) app architecture-dogfood — parseProjectFromFiles
over live docs/tasks + components + ROADMAP, `project.issues
toEqual([])`; (3) the full-tree audit: all 30 id-bearing live files
match the family (incl. T-003-s2, T-009-s1/s2/s3 suggestion ids), all
blocked_by targets exist flat in docs/tasks/ (nothing references into
the excluded rejected/), features F-01/F-02/F-06 ⊆ backbone F-01..F-06,
and every filename encodes exactly its declared id under longest-prefix
derivation (T-009-s1-graph-regen-at-merge.md → T-009-s1, not T-009).
No live file trips the new rules — nothing was widened to make that
true. Fixture reconciliations (changed, never loosened, dated in the
tests): valid-project's blocked_by: [T-100] was a GENUINE dangler →
fixture gains T-100-genesis.md (a valid project now means references
resolve); dup-project's files renamed T-301-first/T-302-second →
T-300-first/T-300-second so the duplicate-id fixture doesn't also trip
the new mismatch rule (one fixture, one violation).

**Suites (ADR-011 order).** lib/parser: npm ci · vitest 153/153
(132 + 21 new) · tsc --noEmit clean · build clean. app: npm install ·
npm run build clean · npm test 381/381 (375 + 6 new). cargo untouched:
zero src-tauri diff (verified via git status — boundary held: lib/
parser/**, app/src/lib/task-detail.ts, TaskDetailPanel.tsx ghost
variant, app/test/**, docs/tasks/T-019-* only; no App.tsx, no
watcher-store/docs-model, no tokens, no dep changes).

**For the integrator (T-009-s1 standing practice).** This branch adds
TS files outside docs/ (lib/parser/src/validate.ts +
test/validate.test.ts + fixture churn), so the committed graph.json is
stale at merge — regenerate per the practice. Expected deltas: C-06
gains validate.ts (+ its test file under lib/parser/**); no new
app/test file was added (new app tests live inside existing suites
precisely to keep D1 C-05→C-06 file-edge counts stable), so
architecture-dogfood counts should move only by the C-06 file adds.
On-branch, the ignored cargo self_graph `--check`-style test would be
red for the same staleness — expected, not run here (cargo untouched).

**Flagged for the verifier.**
- The zero-feature skip rule is the one judgment call with teeth: it
  trades bootstrap-state danglers (empty-but-clean backbone + featured
  tasks → silent) for cascade-noise suppression, and the pinned
  missing-roadmap behavior forced the choice. Attack it if you
  disagree — the pinned test to argue with is files.test.ts
  "missing roadmap is an io-error issue".
- `id-mismatch` keeps the DECLARED id as model truth (blocked_by
  resolution targets frontmatter, not filenames) — the message says so.
- Suggestions filed: T-019-s1 (soft issues surface only as the header
  count — no card-level mark), T-019-s2 (filenames encoding no id slip
  the mismatch check by design).

## Verdicts
