---
id: T-055
title: One answer to "is this content?" — the shared inert-span pass
feature: F-02
milestone: 4
priority: 24
size: M
status: verifying
blocked_by: [T-053]
touches: [lib-parser]
builder: codex/gpt-5.6
verifier:
built_by: codex/gpt-5.6 @fresh
verified_by:
review:
---

Absorbs: T-030-s2, T-030-s4, T-030-s5 (triage 2026-08-17). The
suggestion files are removed in the same commit as this card.

Three findings that are one change. `parseRoadmap` became
comment-blind at T-030; `splitSections` did not, and was not touched —
so the two parsers now disagree about what content is, silently and in
both directions. Verified at triage: `stripHtmlComments` exists only
in `lib/parser/src/roadmap.ts:121`; `task.ts` has no comment or fence
awareness at all.

`blocked_by: [T-053]` is lane serialization, not a logical dependency
— both are lib-parser and T-053 is the urgent one.

THE TRAP THAT MAKES THIS AN M RATHER THAN AN S, and it is written down
so it is not rediscovered during implementation (T-030-s4): T-030's
OWN CARD would lose its Verdicts section under a naive shared pass.
That file carries six `<!--` openers, every one inside INLINE CODE,
and the last is unterminated as a raw byte sequence — so the strip
blanks to end of file and takes `## Verdicts` with it. Measured:
`splitSections(body)` yields four sections, `splitSections(strip(body))`
yields three. Inline code must therefore be inert, and code spans and
fences must be recognised BEFORE comment openers, or a character that
was never markup decides the rest of the pass.

## Acceptance criteria
- THE parser SHALL gain ONE inert-span pass — fenced blocks (``` and
  `~~~`, with the closing-fence and info-string rules), HTML comments,
  and INLINE CODE (single backticks) — and BOTH `parseRoadmap` and
  `splitSections` SHALL use it, so the two can no longer disagree
  about what counts as content.
- WHEN a `- F-NN:` bullet sits inside a fenced block THE roadmap
  SHALL NOT parse it as a feature, and a malformed example inside a
  fence SHALL NOT emit a roadmap-error over content nobody shipped
  (T-030-s2).
- WHEN a task body comments out a heading THE splitter SHALL neither
  fabricate the section nor truncate the one the file has; pinned in
  `lib/parser/test/task.test.ts` as "a commented-out heading neither
  opens nor closes a section", the sibling of the roadmap pin T-030
  landed (T-030-s4).
- `docs/tasks/T-030-parser-strictness-pass.md` SHALL be a committed
  regression fixture: its section list SHALL be identical before and
  after the pass, and the `<!--` inside inline code SHALL NOT open a
  comment (T-030-s4's measured trap).
- THE abrupt-closing empty comments `<!-->` and `<!--->` SHALL be
  treated as complete spans at the opener, matching CommonMark 0.30
  §6.6 and the renderer, while a genuinely unterminated `<!--` SHALL
  keep running to end of document (which is also CommonMark, and is
  why blanking to EOF there is right) (T-030-s5).
- THE live-tree smoke SHALL stay at zero issues and every live
  section split SHALL be byte-identical before and after — four live
  task files carry HTML comments (T-023, T-038, and the two T-030
  files) and none of them commented out a heading, so any movement
  here is a defect in the pass. Note the corpus grows every triage:
  re-derive the list rather than trusting this sentence's four.
- THE PASS SHALL NOT BECOME A MARKDOWN PARSER. The three shapes above
  are the whole scope; anything else markdown calls inert (indented
  code blocks, HTML blocks, link reference definitions) is explicitly
  out and SHALL be named as out in the module header, so the next
  reader knows the boundary was chosen rather than missed.

Verification: headless — `npx vitest run` + `npx tsc --noEmit` from
lib/parser/, plus a before/after dump of every live task file's
section keys proving zero movement. @human: none.

## Implementation notes

Implemented by **codex/gpt-5.6 @fresh** on
`task/T-055-inert-spans` from architect checkpoint `59763f3`.

### One structural view, two consumers

Added `lib/parser/src/inert-spans.ts`. `blankInertSpans` makes one
same-position structural view by blanking non-newline characters in
exactly three shapes: single-backtick spans on one physical line,
backtick/tilde fenced blocks, and HTML comments. It also returns the
line receipt for a genuinely unterminated comment. `parseRoadmap` uses
that one view for its whole scan and converts the receipt into the
existing loud `roadmap-error`; its private `stripHtmlComments` copy is
gone. `splitSections` recognizes headings from the same view while
buffering the original lines, so inert syntax cannot open or close a
section and section values keep their original bytes.

Fence handling pins the chosen boundary: zero-to-three-space openers;
backtick info strings cannot contain a backtick; closers use the same
marker, at least the opener's run length, and only trailing spaces or
tabs; a top-level unclosed fence runs through EOF. Inline recognition
is physical-line-local. The module header explicitly leaves indented
code, other HTML blocks, link definitions, Markdown list/container
de-indentation, and nested-container fence boundaries out rather than
quietly approximating them.

### The live-corpus contradiction and ruling

The first live-equivalence run failed on two records and did useful
work. T-020 had no fence: a global backtick pairing incorrectly joined
same-line code delimiters across blank lines and section headings.
Making the deliberately narrow inline recognizer physical-line-local
fixed it and still protects all six T-030 comment-looking byte strings.

T-055 itself had two leading spaces followed by a raw tilde fence marker
in criterion 1. A flat unclosed-fence scan therefore blanked this card's
own Implementation notes and Verdicts headings. The architect ruled to
keep the non-container parser boundary and authorized the formatting-only
correction that wraps that literal marker in inline code. The criterion's
meaning is unchanged; the correction is the one acceptance-text byte
change in this implementation.

Explicit regressions now pin T-020, T-030 and T-055 section keys; the
requested T-030 committed fixture remains
`preamble, acceptanceCriteria, implementationNotes, verdicts` before
and after. A dynamically enumerated smoke compares every live task's
complete pre-pass and post-pass section object, not just its keys.

### Evidence

- Lockfile-exact parser setup: `npm ci` installed 55 packages; audit
  reported zero vulnerabilities.
- `npm run build`: green.
- `npx tsc --noEmit`: green.
- `npx vitest run`: **234/234 tests in 12 files**, including the live
  project smoke at zero issues.
- Independent before/after dump over the flat live task directory:
  **127 files, 0 moved**, every full section object byte-identical. The
  HTML-comment list was re-derived rather than copied: T-023, T-030,
  T-038 and T-055 — four files.
- Poison discipline: each of the **9 new assertion bodies** received a
  relation-breaking expected-value mutation in one combined run;
  Vitest reported exactly **9 failed bodies** (4 inert-span, 2 roadmap,
  3 task). Restoration was byte-proven before the green rerun:
  `inert-spans.test.ts` `e65478b2...45ec2`, `roadmap.test.ts`
  `7d265392...bf10`, `task.test.ts` `6f128974...dfe19`.
- Fence held: task card plus `lib/parser/**` only. No app, tools/e2e,
  manifest, dependency, IPC, capability, model, network, or boot-gate
  movement. The TypeScript graph regen belongs to the integration
  checkpoint under the standing rule.

No suggestion was filed: the only discovery was the locked-card/live-
corpus contradiction above, resolved directly by the architect before
any semantic or fixture change.

## Verdicts
