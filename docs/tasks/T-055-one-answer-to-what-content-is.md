---
id: T-055
title: One answer to "is this content?" — the shared inert-span pass
feature: F-02
milestone: 4
priority: 24
size: M
status: planned
blocked_by: [T-053]
touches: [lib-parser]
builder:
verifier:
built_by:
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
  ~~~, with the closing-fence and info-string rules), HTML comments,
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

## Verdicts
