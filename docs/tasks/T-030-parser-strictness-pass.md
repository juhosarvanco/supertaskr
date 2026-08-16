---
id: T-030
title: Parser strictness pass — comment-blind roadmap, cycles, filenames, id aliases
feature: F-02
milestone: 4
priority: 14
size: M
status: building
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-008-s3, T-011-s4 (the parse-time-warning half; the glob.ts
header half lives in T-032), T-019-s2, T-019-s3, T-023-s1, T-024-s6
(the parser half — the load-bearing one; the board-badge half lives in
T-031 and the map-badge half in T-032). Triage
2026-08-16: four validateProject/parse strictness rules sharing one
test discipline — separately each would rebuild the same fixtures.
Each rule tightens what inputs are legal; this task's creation is the
deliberate ratification the suggestions asked for (never a silent
widening). Land before T-027 — the live interview renders ROADMAP.md
as it materializes, and T-023-s1's phantom-feature trap sits directly
under it; the lib-parser lane is free now (T-019/T-023 done).

T-024-s6's ARM IS RULED HERE, because two of its three arms collide
with this task's own last criterion. Arm 2's gate ("raise a validation
issue when the model half contains whitespace, `@` or `+`") would flag
the LIVE TREE — T-020 and T-024 both carry compound stamps — and
nothing may flag the live tree. Arm 1 (a full delimited grammar) has
the widest blast radius and would require editing two done tasks'
frontmatter. TAKEN: arm 3 plus the correctness patch — accept the
compound stamp as legitimate prose, define a REPRESENTATIVE model, fix
`policy`, bound the badges (T-031/T-032), and pin a compound fixture.

## Acceptance criteria
- THE roadmap parser SHALL ignore HTML-comment content (strip
  `<!-- -->` spans, multi-line included, before line matching) so a
  column-0 `- F-NN:` bullet inside a comment yields neither a
  FeatureRecord nor a roadmap-error issue; fixtures SHALL pin the
  commented-bullet case, the commented-malformed case, and a live
  bullet adjacent to a comment (unchanged). WHEN this lands THE
  CONVENTIONS gotcha ("a bare example row would parse as real
  content") SHALL be updated to record the trap is closed — the
  templates stay comment-wrapped regardless (T-023-s1).
- THE validateProject SHALL emit one structured issue per blocked_by
  cycle, self-reference included, naming the member ids — one issue
  per cycle, not per member (the T-019 one-root-cause discipline)
  (T-019-s3).
- THE validateProject SHALL flag an id-bearing task file whose
  basename encodes no id (T-banana.md with `id: T-901`) as an issue;
  id-less suggestion files stay legitimately free-form beyond the
  `T-` prefix (T-019-s2).
- THE component-set parse SHALL emit a structured warning when two
  DIFFERENT id strings share one numeric value ("numerically equal
  ids C-05 and C-005 — zero-padding aliases one slot"), reusing or
  siblinging the duplicate-id kind, collect-don't-throw (T-008-s3).
- THE component parser SHALL warn on a single-segment leading-slash
  `paths` pattern (`/dist`): the strip rule unanchors it against
  git's root-only intent; the message SHALL name `dist/**` as the
  anchored idiom (T-011-s4).
- THE model[@session] parse SHALL yield a REPRESENTATIVE model rather
  than the whole prose: after splitting at the LAST `@`, the model is
  the last whitespace-delimited token of the left half, with `raw`
  keeping the full stamp for the detail panel. Measured today,
  `claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh
  x2 (...)` yields a FIFTY-character badge; after this rule it yields
  `claude-opus-5`. `codex/gpt-5.2 @S3` SHALL be unchanged (T-024-s6).
- THE `policy` flag SHALL read the session's FIRST whitespace-
  delimited word instead of requiring an exact `fresh`, so an
  annotated `@fresh x2 (...)` stops reporting `resume`. SIX live
  stamps report the opposite of what happened today — T-001, T-002,
  T-005, T-019, T-020, T-024 — and nothing outside model-session.ts
  reads the field yet, which is precisely why it will be believed
  later. The existing pins SHALL stay green (T-024-s6).
- THE suite SHALL carry a fixture pinning a COMPOUND cross-model stamp
  end to end — `raw` preserved, representative model, policy fresh,
  short badge — so the next cross-model build does not rediscover
  this (T-024-s6).
- THE smoke suite SHALL still parse this repo's live tree with zero
  issues — no new rule may flag the live tree.
- IF any new rule fires THEN the record SHALL stay collected and
  flagged, never hidden (flagging-not-hiding contract).

## Implementation notes

2026-08-17, executor claude-opus-5 @fresh, branch t030-parser-strictness
(from main@6ed97cf). Six rules, one lane: lib/parser/** plus the one
docs/CONVENTIONS.md bullet criterion 1 names. All quoted evidence is
INDENTED, never fenced (splitSections has no fence awareness — the
T-023 note, and now suggestion T-030-s3's sibling T-030-s2).

### Criteria → evidence

**C1 — roadmap ignores HTML comments** (roadmap.ts, +51 lines).
`stripHtmlComments` blanks every `<!-- … -->` span before ANY line is
matched: non-newline characters inside a span become spaces, newlines
survive, so every FeatureRecord.line and every `:N:` in a message stays
truthful. Multi-line is free (the scan is over the document, not per
line). A commented line reduces to whitespace, which the scanner already
treats as blank. Pins in roadmap.test.ts (7→16 tests): the
commented-bullet case, the commented-MALFORMED case, a live bullet
adjacent to a comment (unchanged, incl. exact line numbers), a trailing
same-line comment, a commented `##` heading, the verbatim
docs-templates shape at column 0, CRLF line numbers, and the
unterminated opener. CONVENTIONS gotcha updated to record the trap
closed and that templates stay comment-wrapped regardless.

One judgment call, flagged for the verifier: an UNTERMINATED `<!--`
blanks to end of file (the comment-blind reading — nothing after a
broken opener can become a phantom feature) AND emits a roadmap-error
naming the opener's line. The criterion did not ask for that issue;
silent content-eating is the one thing the flagging-not-hiding contract
forbids more than a spurious flag, and the live tree has no comments at
all in ROADMAP.md so nothing is flagged. Attack it if you disagree — the
pin is "an UNTERMINATED comment is reported with its line".

**C2 — one issue per blocked_by cycle** (validate.ts, new
`dependency-cycle` kind). Iterative Tarjan SCC over blocked_by edges
among parsed task ids; an SCC of ≥2 members is a cycle, a 1-member SCC
is one only when it names itself. ONE issue per SCC naming every member,
never one per member. Why SCC and not simple rings: a figure-eight
(T-901↔T-902 and T-901↔T-903) is ONE root cause — reporting each ring
would name T-901 twice, the exact anti-pattern the T-019 discipline
forbids — and enumerating simple rings is exponential, which no parser
should be. Iterative because a parser must not blow the stack on input
anyone can write (pinned with a 5000-member ring). Dangling references
are not edges: check 1 owns them, and a reference to nothing cannot
close a ring. Issues are appended AFTER the per-task pass so every
pinned per-task order is byte-untouched. 10 pins in validate.test.ts
incl. both layers, ordering, and an ADR-009 `__proto__` probe.

**C3 — id-bearing file whose basename encodes no id** (validate.ts, new
`filename-id-missing` kind). `T-banana.md` declaring `id: T-901` used to
slip the mismatch check entirely (the deliberate T-019 narrowness).
Distinct kind rather than `id-mismatch` because there is no
filename-derived id to compare: `expected` would have to repeat `id` and
read as agreement. Id-LESS files stay free-form beyond the `T-` prefix —
flagging them would make the convention stricter than TASK-FORMAT.md is
written. The pre-existing pin that codified the old silence
("skips id-less suggestions and filenames that encode no id") is FLIPPED
and dated in place, its id-less half kept: changed, never loosened.

**C4 — numerically aliased component ids** (component.ts, new
`aliased-id` kind, sibling of `duplicate-id`). Grouped by numeric slot
with leading zeros stripped as TEXT, not through `Number()` — two
genuinely different ids past 2^53 must not collide into a false alias
(pinned). ONE issue per slot, not per pair: three spellings of one slot
report once. Both records kept. Message names the aliasing and that
comparator order cannot separate them, so the file-mapping winner falls
to string comparison — a winner nobody declared.

**C5 — single-segment leading-slash `paths`** (component.ts). Reuses
`invalid-field` on field `paths` — the parser's existing per-field
channel — rather than a new kind: it is a field's value being wrong for
its purpose, the record is still returned and the pattern still matches
exactly as before (flagged, never rewritten). Exactly as narrow as its
reason: only a LEADING SLASH claims git's root-only anchoring, and only
a single remaining segment loses it when the slash is stripped
(`app/src/lib/architecture/glob.ts` compilePattern: strip `./`, strip
`/`, then `unanchored = segments.length <= 1`). `/app/src/**` keeps its
`/` and is silent; `dist` never claimed anchoring; `./dist` is not a git
anchoring marker at all. The suggested idiom is derived, so `/dist`
yields exactly the criterion's `dist/**` and `!/dist` yields `!dist/**`.

**C6 — representative model + C7 policy first word** (model-session.ts).
After splitting at the LAST `@`, the model is the last
whitespace-delimited token of the left half; `raw` is untouched; the
no-`@` branch is deliberately unchanged (no session syntax means the
whole value is the model — `parseModelSession('codex')` stays pinned).
`policy` reads the session's FIRST whitespace-delimited word; `session`
keeps the full remainder (the annotation is data). All five pre-existing
pins stay green byte-unchanged, `codex/gpt-5.2 @S3` included.

**C8 — compound stamp end to end.** model-session.test.ts pins the
T-024 stamp through `parseProjectFromFiles`: zero issues, `raw`
preserved verbatim (107 chars), model `claude-opus-5` (13), session
`fresh ×2 (…)`, policy `fresh`, and the single-model stamps beside it
untouched. Plus the unit-level pin with the same values.

**C9 — the live tree at ZERO issues.** Proven below (obligation 2).

**C10 — flagging, not hiding.** Every new rule asserts the record
survives: features/tasks/components still returned, `blockedBy` and
`paths` preserved verbatim, declared id kept as the model's truth.

### Obligation 1 — failing→passing, per rule

New tests run against the BRANCH-POINT source (src swapped for
6ed97cf's, suite re-run, src restored and verified byte-identical via
`git status --porcelain -- lib/parser/src` → empty):

    OLD SOURCE + NEW TESTS -> total 197  failed: 29  passed: 168
      roadmap.test.ts   7 red    validate.test.ts  12 red
      component.test.ts 6 red    model-session.test.ts 4 red

What used to be accepted, and what now says so:

- a column-0 `- F-99:` bullet inside a `<!-- … -->` span parsed as a
  REAL feature (T-023-s1's phantom board column) → now no record, no
  issue · pin "is comment-blind: a column-0 bullet inside an HTML
  comment is not a feature".
- a column-0 `- F-XX:` malformed bullet inside a comment emitted
  `roadmap-error` over content nobody shipped → silent · pin "is
  comment-blind to MALFORMED bullets too". (Noted honestly: the
  ONE-LINE form `<!-- - F-XX: … -->` never tripped the old malformed arm
  — it is anchored at the line start — so the pin uses the multi-line
  shape a template actually has. The first draft of this pin passed
  against old source; it was strengthened, not kept.)
- a column-0 `## heading` inside a comment ENDED the backbone, so every
  real bullet after the comment silently vanished from the board →
  both bullets now parse · pin "a commented-out heading neither opens
  nor CLOSES a section".
- `blocked_by: [T-901]` on T-901, and every ring of tasks blocking each
  other, resolved SILENTLY (each reference names a task that exists) →
  one `dependency-cycle` naming the members · 10 pins.
- `T-banana.md` with `id: T-901` produced ZERO issues → one
  `filename-id-missing` · pins incl. `T-901.bak.md`, `T-9x1-slug.md`,
  `T-.md`, and the disk layer.
- `C-05` + `C-005` in one registry produced ZERO issues → one
  `aliased-id` for the slot · 3 pins.
- `paths: [/dist]` produced ZERO issues → one `invalid-field` naming
  `dist/**` · 3 pins.
- `claude-fable-5 @fresh ×2 (…)` reported policy `resume` → `fresh`;
  the T-024 stamp's model was the whole 59-char left half → 
  `claude-opus-5` · 4 pins.

### Obligation 2 — the live tree at ZERO issues, every rule in

Branch parser (fresh `npm run build`) over this worktree's live tree,
AFTER all six rules:

    parseProject(<worktree>) →
      tasks 81 · features 6 · components 11 · ISSUES 0    (before the
      three suggestion files existed)
      tasks 84 · features 6 · components 11 · ISSUES 0    (final tree —
      re-run after committing T-030-s1/s2/s3; a verifier re-deriving
      this gets 84)

The same tree through the BRANCH-POINT parser gives the identical
counts and ISSUES 0 in both runs. Zero before, zero after — no new rule
flags the live tree, and nothing was widened to make that true (the
three T-030-sN suggestion files are inside the 84 and parse clean:
their basenames encode their ids). The suite's own
smoke test (`parseProject` over this repo, `issues toEqual([])`) is
green in every run reported below, which is the same proof re-derived
on every `npx vitest run`.

Audit of what COULD have flagged it, checked directly: ROADMAP.md
contains no `<!--` at all (so the strip is a no-op there); no component
`paths` pattern starts with `/` (11 files, every pattern read); no
task file's basename fails to encode its declared id; no two component
ids share a numeric slot; no blocked_by cycle exists.

### Obligation 3 — the wrong stamps, measured before and shown after

Measured by parsing the live tree with both parsers and diffing every
task record field by field. NOT taken from the card — and the card
undercounts: it names SIX TASKS, and there are **EIGHT wrong policy
stamps** in them (T-002 and T-005 each carry a wrong `built_by` AND a
wrong `verified_by`). Nine record fields change in total:

    field diff (before → after), 9 changed fields, {builtBy: 6, verifiedBy: 3}

    T-001 built_by      policy resume → fresh
    T-002 built_by      policy resume → fresh
    T-002 verified_by   policy resume → fresh
    T-005 built_by      policy resume → fresh
    T-005 verified_by   policy resume → fresh
    T-019 built_by      policy resume → fresh
    T-020 built_by      policy resume → fresh · model 59 → 13 chars
    T-024 built_by      policy resume → fresh · model 59 → 13 chars
    T-001 verified_by   policy resume (unchanged — the session's first
                        word is `human`) · model 34 → 1 char

`raw` is unchanged on all nine (asserted in the diff run).

The two long badges, measured through the app's own `shortModelName`
(transcribed verbatim from app/src/lib/board-model.ts — that file is
NOT touched by this task):

    T-020 built_by  badge BEFORE (50 chars): "fable-5 @fresh (WIP through 986431e) + claude-opus"
                    badge AFTER   (4 chars): "opus"
    T-024 built_by  badge BEFORE (50 chars): "fable-5 @fresh (WIP through ad2716f) + claude-opus"
                    badge AFTER   (4 chars): "opus"

So the card's "FIFTY-character badge" is exact at the RENDERED badge;
the `model` field behind it was 59. Third case, the wart:
T-001 `verified_by` badge 27 chars → `+` (filed as T-030-s1, pinned in
the suite rather than papered over).

### Obligation 4 — parseRoadmap unchanged on live bullets

Same content (`docs/ROADMAP.md`), both parsers, JSON-compared:

    features before: 6 | after: 6      features BYTE-IDENTICAL: true
    issues   before: 0 | after: 0      issues   BYTE-IDENTICAL: true
    F-01@L4 F-02@L5 F-03@L7 F-04@L9 F-05@L11 F-06@L13

Project-wide: `components` and `features` arrays byte-identical
before/after; the ONLY changed fields anywhere in the model are the nine
ModelSession fields listed above.

### Obligation 5 — every new test executes

`throw new Error('T-030 POISON')` inserted as the first statement of
every test body this branch adds (39 `it(` declarations extracted from
`git diff 6ed97cf..HEAD -- lib/parser/test`), one suite run, then
restored:

    poisoned test bodies: 39
    total tests run: 197  failed: 39  passed: 158
    poisoned tests still GREEN (vacuous): none
    collateral failures (not poisoned): none
    sha256 of all 10 test files: MATCHES HEAD

A body that never executes cannot fail, so 39 poisoned / 39 red is the
proof that none is vacuous or silently skipped. (The unique-title set is
38 — "fires identically through the disk layer" is used twice, in the
filename and cycle blocks — but the FAILURE COUNT is 39, so both ran.)

### Obligation 6 — suites

    lib/parser (from lib/parser/):
      npm ci                        clean, 0 vulnerabilities
      npx vitest run                197/197  (159 baseline + 38 net new:
                                    roadmap +9, model-session +8,
                                    validate +13, component +8)
      npx tsc --noEmit              clean
      npm run build                 clean
    app (from app/):  npm install clean · npm run build clean ·
      npm test  507/507  (baseline 507 — NOTHING moved)
    app/src-tauri:  cargo test  217 passed / 0 failed / 3 ignored
      (baseline 217 + 3 ignored)
    tools/e2e:  npm ci clean · npm run lint:tokens clean (38 files) ·
      NPUTER_E2E_PORT=14531 npm test  36/36 chromium, headless

The e2e lane was given scratch port 14531 deliberately: T-045 owns
tools/e2e tonight and the default 14520 is its port — two lanes must not
contend, exactly the reasoning the PORT RULE applies to 1420. Port 1420
was never bound, probed or contacted by anything here.

BOOT GATE (T-046): **not triggered** — the diff touches no
`app/src-tauri/**`, no `app/src/**`, and neither manifest. Stated
explicitly rather than silently skipped, per the CONVENTIONS rule.

App fixtures that move at merge: **none observed**. The app suite is
507/507 unchanged with the new parser linked through
`file:../lib/parser`, because no app test asserts a model badge derived
from the LIVE tree (architecture-dogfood parses live docs but asserts
components; select-board/select-task-detail use their own single-model
fixtures, and `detail.verifiedBy` reads `raw`, which is untouched). The
user-visible change is a RENDERING one the suite does not pin: the
T-020 and T-024 cards' model badges read `opus` instead of a 50-char
run, and T-001's verified-by badge reads `+`. If the integrator wants
that pinned, it belongs to T-031's board-badge half.

### Obligation 7 — fence proof

    git diff --stat 6ed97cf..HEAD
     docs/CONVENTIONS.md                   |  13 +-
     lib/parser/src/component.ts           |  84 +++++-
     lib/parser/src/model-session.ts       |  47 ++++-
     lib/parser/src/roadmap.ts             |  53 ++++-
     lib/parser/src/types.ts               |  33 +++
     lib/parser/src/validate.ts            | 163 ++++++++++-
     lib/parser/test/component.test.ts     | 128 +++++++++
     lib/parser/test/model-session.test.ts | 120 +++++++-
     lib/parser/test/roadmap.test.ts       | 145 ++++++++++
     lib/parser/test/validate.test.ts      | 252 +++++++++++++++-
     10 files changed, 1018 insertions(+), 20 deletions(-)
    + docs/tasks/T-030-*.md (this file + s1/s2/s3), added in the final
      commit.

Zero bytes under `app/`, `tools/`, `method/`, `docs/architecture/`, or
`app/src-tauri/`. `docs/CONVENTIONS.md` is the one file outside
lib/parser/**, and criterion 1 requires it. `../nputer-t045`,
`../nputer-t034` and any t027 worktree were never entered; the only
files read outside this worktree were read-only in the main checkout.

### Expected graph delta (NOT regenerated here, per dispatch)

docs/architecture/graph.json is stale at merge — regenerate per the
T-009-s1 standing practice. Expected, and narrower than the dispatch
assumed: **no new file nodes**. Nothing was added under `lib/parser/`;
the new tests extended the four existing test files, so C-06 gains no
files and the app-side dogfood counts should not move at all.

- hash + loc on 9 existing C-06 files: src/roadmap.ts (93→144),
  src/validate.ts (136→287), src/component.ts (330→404),
  src/model-session.ts (32→75), src/types.ts (287→320), and the four
  test files (component 606→734, model-session 54→172, roadmap 89→234,
  validate 392→640).
- three NEW non-exported symbols (the graph records unexported
  top-level functions — verified against the committed graph, e.g.
  validate.ts's `filenameId`): `stripHtmlComments` (roadmap.ts),
  `blockedByCycles` (validate.ts), `anchoredIdiomFor` (component.ts),
  plus shifted `range` values on every symbol below an edit.
- three new `call` edges (parseRoadmap→stripHtmlComments,
  validateProject→blockedByCycles, parseComponentFile→anchoredIdiomFor)
  and symbol-level call edges from model-session.test.ts to
  parseProjectFromFiles. No new IMPORT edges: every module already
  imported the module it now takes one more name from.
- No package nodes, no component registry change → the THREE
  live-registry fixtures (smoke.test.ts, architecture-dogfood,
  map-dogfood-render) all stay as they are. No component was declared.

### Suggestions filed

- T-030-s1 — the representative-model rule leaves a literal `+` on
  T-001's `verified_by` (trailing `@human` note). Pinned in the suite as
  a known wart with four arms costed; the fix is a grammar decision the
  triage explicitly deferred.
- T-030-s2 — the roadmap parser is comment-blind now but still
  FENCE-blind: a fenced `- F-99:` example row parses as a real feature
  (and a fenced malformed one still emits roadmap-error). Same class as
  splitSections' fence blindness, which is why this repo indents its
  quoted examples. Proposes one shared inert-span pass for both.
- T-030-s3 — zero-padding aliases TASK and FEATURE ids too (`T-01` vs
  `T-001`, `F-1` vs `F-01`), and only component ids are checked. Probed
  on this branch: both pairs coexist with zero issues, and
  `blocked_by: [T-01]` silently resolves to one of the two.

### Flagged for the verifier

- The unterminated-comment roadmap-error is the one rule not literally
  in a criterion (rationale above, C1).
- `dependency-cycle` reports SCCs, not simple rings. For every shape in
  the pins the two coincide; they differ only for a figure-eight, where
  SCC is deliberate (one root cause, one report) — the pin says so.
- `invalid-field` was REUSED for the `/dist` warning rather than a new
  kind. It is the only new rule that rides an existing kind; if you
  read `invalid-field` as strictly "malformed for its type", this
  stretches it — the record is returned and the pattern preserved
  either way.
- Three new union members (`aliased-id`, `filename-id-missing`,
  `dependency-cycle`) are additive; the app consumes issues generically
  (`f.issues[0]?.message`, count only — no exhaustive switch anywhere,
  re-verified by grep and by `npm run build` + 507/507 green), so the
  union extension is safe exactly as it was at T-019.

## Verdicts
