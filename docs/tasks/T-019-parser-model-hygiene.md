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

**Fix pass after 2026-08-16 rejection — fresh executor claude-fable-5
(2026-08-16, this branch).** Scope: the verdict's one finding only.

Chosen shape: the verdict's FIRST option — gate the skip on the roadmap
having actually REPORTED. validateProject gains
`options.roadmapReported?: boolean`; the feature check is skipped only
when `featureIds.size === 0 && roadmapReported`, otherwise it runs
normally — so a PRESENT, well-formed, zero-bullet `## Backbone`
(features: [], zero roadmap issues) now makes every task feature
reference fire its criterion-1 `feature → missing backbone id` dangler,
attributed to the task file. Why this shape over the one-aggregate-issue
option: (1) criterion 1 literally names the per-reference dangler, and
the danglers say WHICH tasks name WHICH undeclared ids — an aggregate
says neither; (2) it removes an arbitrary cliff — a backbone declaring
one wrong feature already produced N danglers, so a backbone declaring
zero producing silence was indefensible; (3) no new issue kind and no
second module emitting `roadmap-error` (roadmap.ts stays its sole
emitter). Refinement over the verdict's letter ("a roadmap
io-error/roadmap-error present in the issue list"): the flag is
distilled by the ASSEMBLERS from the roadmap layer's OWN issue sublist
(`roadmapResult.issues` / `roadmap.issues` `.some(kind === 'io-error' |
'roadmap-error')`; the pure layer's missing-roadmap branch passes
`true`), never re-detected from the merged project list — a task-file
or component io-error there must not spoof "the roadmap reported" and
re-create the silence. Standalone default is the LOUD path (a
hand-built model has no roadmap layer to have reported); the flag is
inert whenever features exist. `ValidateProjectOptions` exported from
both entries; both assemblers pass it, so disk/pure stay deep-equal.

App-side consequence, ruled deliberately: dangler-side reporting, not a
roadmap-side issue. parseRoadmap is byte-untouched, so docs-model's
per-file roadmap predicate ("zero features AND ≥1 issue" → hard-fail
into last-good) still sees a clean empty backbone as a VALID state — an
early-genesis ROADMAP never hard-fails, never badges, never falls back
to last-good; the signal reaches the board only as project-level soft
issues attributed to the TASK files (header count, T-019-s1 surface),
records still render (criterion 4 — validateProject never touches the
identity gate). For the T-024 genesis lens that means honest per-card
signal, not spam: backbone-first genesis order produces no danglers,
and the loud state is precisely the accidentally-emptied-backbone
accident the verdict proved was end-to-end silent. Honestly-empty stays
silent: empty backbone + no feature-bearing tasks → zero issues
(pinned).

Failing→passing proof: regression tests written first, fix stashed —
old code: 3 failed / 16 passed in validate.test.ts (the verifier's
exact repro: empty backbone + `feature: F-01` task → `issues: []`;
standalone loud-default; disk-layer parity); fix restored: 19/19. New
pins (flip/extend, never weaken): the verdict's verbatim repro fixture
→ exactly one dangler with record + reference preserved; honestly-empty
silence (zero tasks, and a feature-less suggestion); skip still holds
for all three already-loud states (missing roadmap → io-error only —
the pre-T-019 pin, assertion unchanged, rationale re-dated; no-Backbone
heading and malformed-bullets-only backbone → roadmap-error only);
standalone loud-by-default / quiet-only-when-told / flag-inert-with-
features; disk layer fires identically. files.test.ts missing-roadmap
io-error pin: byte-untouched, green. App reconciliation (enumerated,
nothing loosened): exactly one app fixture sits in the changed state —
select-board "tasks without any backbone" (empty backbone + F-01 task,
model 0 → 1 issue); its board assertions were already emission-blind
and still pass; STRENGTHENED with a dated pin asserting the dangler and
its task-file attribution. No other app fixture has zero features from
a clean parse (verified: docs-model/watcher-store/board-truth/detail
fixtures all declare F-01+; missing-roadmap fixtures keep the skip).

Suites (ADR-011 order): lib/parser npm ci · vitest 159/159 (153 + 6) ·
tsc --noEmit clean · build clean; app npm ci · build clean · npm test
381/381 (same count — extended an existing test). Live-tree proofs,
branch parser dist: this worktree's docs 45 tasks / 6 features / 0
issues (smoke + architecture-dogfood also green in-suite); main's
CURRENT committed docs via git archive (b2d4660) 52 tasks / 6 features
/ 0 issues. Boundary: lib/parser/src (validate/project/files/index/
pure), lib/parser/test/validate.test.ts, app/test/select-board.test.ts,
this file only; zero src-tauri/app-src/dep/token diff; T-019-s1/s2/s3
untouched.

## Verdicts

2026-08-16 — claude-fable-5 @fresh (verifier, same-model as builder):
REJECTED — one hole in the flagged judgment call: the zero-feature
skip is silent in exactly one state, and it is a state the skip's own
rationale says must be loud. Everything else verified green — all
four criteria's happy and hostile paths, both suites fresh, the
boundary, the security sweep, both fixture repairs, the live-tree
proof on BOTH trees (branch, and main's current docs with the T-020
promotion landed) — so the fix round is one guard plus its test.

Failure (lib/parser/src/validate.ts, the `featureIds.size > 0` skip):
the documented justification is "an absent/failed roadmap already
reports itself once (io-error / roadmap-error)". True for a missing
roadmap (io-error), a roadmap with no `## Backbone` heading
(roadmap-error), and a backbone of only malformed bullets
(roadmap-error per line) — all three reproduced. But a PRESENT,
well-formed `## Backbone` heading with ZERO bullets under it parses
to `features: []` with NO issue (roadmap.ts: `sawBackbone = true`
suppresses the roadmap-error; no bullet ever fires the malformed
arm), and the skip then silences every feature dangler. Repro
(vitest, lib/parser):

    parseProjectFromFiles(new Map([
      ['docs/ROADMAP.md',
       '# Roadmap\n\n## Backbone\n\n(features to be decided)\n'],
      ['docs/tasks/T-901-a.md',  // planned task, feature: F-01
       '---\nid: T-901\ntitle: x\nfeature: F-01\nmilestone: 1\n' +
       'priority: 1\nsize: S\nstatus: planned\n---\n'],
    ]))
    // actual:   features: [], issues: []  — total silence
    // expected: criterion 1 — `feature → missing backbone id` fires
    //           (or at minimum ONE loud root-cause issue exists)

Why REJECTED-level, not a suggestion: (1) criterion 1 literally
requires the feature → missing-backbone issue, and this state has a
feature naming an id the backbone does not declare; (2) the
one-root-cause-one-report principle the skip is built on delivers
ZERO reports here — the state fails the skip's own rule; (3) it is
not a corner: T-019 lands before milestone 3 because "the interview
writes the task graphs this validates", and a heading-present,
features-not-yet-written backbone alongside feature-carrying tasks
is precisely a mid-genesis bootstrap state. The silence is
end-to-end: docs-model's failure predicate codifies "empty backbone
(no issues) is a valid state", so no layer reports anything — an
accidentally emptied backbone renders a zero-issue board.

The cited pinned test (files.test.ts "missing roadmap is an io-error
issue") is untouched by this finding — no per-task cascade is being
asked for when the roadmap is missing or failed. The gap is only the
parsed-clean-but-empty backbone. Fix shape (executor's choice): gate
the skip on the roadmap having actually REPORTED (features empty AND
a roadmap io-error/roadmap-error present in the issue list),
otherwise check normally; or emit one aggregate issue when a clean
backbone declares zero features while tasks reference features.
Either preserves the pinned behavior and kills the silence.

Everything else — verified, not trusted:
- Suites fresh (ADR-011 order): lib/parser npm ci · 153/153 (132+21)
  · tsc clean · build clean; app npm install · build clean · 381/381
  (375+6). Zero src-tauri diff; no dep / tokens / App.tsx /
  docs-model / watcher-store changes (name-only sweep).
- Hostile validation probes (28, all held): ADR-009 at DESCRIPTOR
  level — blocked_by [__proto__, constructor, hasOwnProperty,
  toString, valueOf] all five dangle, Object.prototype's own-property
  set byte-identical after; references into rejected/ dangle;
  resolution is case-sensitive; identity-gate-failed targets dangle;
  one-issue-per-root-cause interactions hold (format-invalid feature
  → invalid-field ONLY; valid-but-missing → dangler ONLY;
  duplicate-id + filename-mismatch + a resolving reference → exactly
  one duplicate-id + one id-mismatch, zero danglers, no explosion).
- Id family edges: T-0 / T-00 / T-1-s0 / T-016-s01 pass (the regex
  permits them; no live-tree conflict), unicode digits (NKO,
  Arabic-Indic) fail, inner space fails; the record is withheld on
  planned/building/verifying/done/parked with a format-invalid id
  while suggested survives id-less — consistent with the T-002/T-016
  loud-trap precedents; rejected-exclusion suite still green.
- filenameId boundary: T-909.bak.md → skip (the documented T-019-s2
  narrowness, confirmed at the boundary); greedy -sN
  (T-909-s1-s2-slug.md encodes T-909-s1); uppercase -S1 reads as
  slug → flags conservatively (errs toward loud); leading zeros
  compare string-exact; lowercase t-*.md is never collected at all
  (pre-existing glob anchor, not a T-019 hole).
- Preamble: `## Preamble` / `## __proto__` headings cannot address
  the key (null-proto KEYS verified); whitespace-only pre-heading
  text yields NO key (absent, never empty string); hostile content
  (script/img/style tags, ANSI, RTL override, 5k unbroken run)
  preserved VERBATIM as data.
- Ghost panel DOM probe: hostile preamble renders as TEXT NODES only
  (children.length 0, no script/img/style elements materialized,
  innerHTML escaped, nothing executed), verbatim including newlines;
  whitespace-pre-wrap + break-words + min-w-0 on the text node and
  all three present in the compiled CSS bundle; non-suggested panels
  grow NO detail-context even when a full task HAS a preamble
  (probed stronger than the builder's preamble-less pin); zero
  innerHTML/dangerouslySetInnerHTML anywhere in app/src.
- Union-extension safety: confirmed — no exhaustive switch over
  ParseIssue kinds anywhere in the app (issues are consumed as count
  + first message; the only `.kind` matches are verdict/map/ref
  kinds); tsc clean rules out type-level exhaustiveness too.
- Disk/pure parity: the fixture mirror tests exercise only
  validateProject's zero-finding path (valid-project and
  broken-project produce no cross-reference findings), so parity was
  probed on a project whose validation FIRES — deep-equal holds
  across parseProject and parseProjectFromFiles (danglers + mismatch
  identical).
- Fixture repairs: both are truth-repairs, dated, and NET TIGHTER —
  valid-project's blocked_by: [T-100] was a genuine dangler the old
  suite could not see (T-100-genesis.md makes "valid" include
  reference resolution); dup-project's renames keep one-fixture-one-
  violation and the new `issues toHaveLength(1)` pin is STRONGER
  than the old shape-only check. Nothing widened.
- Live-tree proof re-derived independently: branch tree 44 tasks /
  6 features / 0 issues with an independent audit (26 id-bearing
  records all family-clean, all filenames consistent, every
  blocked_by resolves, features ⊆ backbone); main's CURRENT docs
  (T-020 planning landed, T-009-s3 absorbed/removed) through the
  BRANCH parser: 48 tasks / 6 features / 0 issues — the promotion
  interacts cleanly, nothing to enumerate.
- Security sweep: no new dependencies, no secrets in the diff, no
  new injection surface (hostile content stays inert data
  end-to-end), prototype-pollution probes clean at descriptor level.

Suggestion filed (not part of the verdict): T-019-s3 (blocked_by
self-references and cycles resolve silently — out of T-019's stated
scope, worth a deliberate rule before dispatch logic consumes the
graph).
