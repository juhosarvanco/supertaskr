---
id: T-282-s6
title: "Card-derived text reaches the rendered dispatch answer with no control-character filter, so a `touches:` token carrying an ANSI escape is written straight to the reader's terminal — pre-existing at three sites, and the triage section would be a fourth"
feature: F-06
milestone: 4
size: S
priority: 12
status: parked
wake: T-292
suggested_by: "verifier claude-opus-5@subagent @T-282 phase 2, 2026-09-09, measured at bf22ede on the bench"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-285-s5 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews). This card stays parked with its wake (T-292, planned); the child's priority 4 defers under this disposition until T-292 is done, stated here so the deferral is a decision and not a loss.

Driven at `bf22ede`: a card whose `touches:` token carries a U+001B
escape has that escape rendered VERBATIM into the dispatch answer. Nothing
in `dispatch-brief.mjs` filters or escapes a control character — a grep
for an escape literal, `stripAnsi` or any sanitiser over the whole file
returns nothing, at the base as at the tip.

**IT IS PRE-EXISTING AND NOT T-282's**, which is why this is a card and
not a verdict finding. The base already interpolates the field
unfiltered at three sites in `deriveFence` and `stateReport` — the
`${lane.taskId} touches: ${entries.join(", ")}` shape — and the answer is
read in a terminal. T-282's triage section joins the same field into
`— all reserve …` rows, so it inherits the surface rather than opening
it, and it renders nowhere today anyway (T-282-s1).

The rest of the hostile set came back CLEAN and is recorded here so
nobody re-runs it: `expandFenceEntry` does no filesystem work at all, so
`../../../etc/passwd`, `/etc/passwd`, `**`, `{a,b}/**/*` and
`~/.ssh/id_rsa` are echoed back as tokens and never read; a
100,000-character field and a 10,000-id kinship line each return in about
4 ms, so there is no expansion blow-up and no ReDoS; and no card-derived
string reaches a shell.

The cheap shape is a single escape at the rendering boundary — `value()`
and `note()` are the two funnels every row passes through — plus a body
planting one escape in a fixture card and asserting the rendered answer
carries no C0 byte. Note the project already owns the definition of that
byte set: `scanControlSource` in `tools/e2e/scripts/token-scan.mjs` is
the authority and must not be transcribed.

Class parent: T-282. Disposition hint: promote with any dispatch-brief
lane; it is one funnel and one body, and it is worth doing before the
triage section starts rendering card text a filer chose.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; card-derived text reaches the terminal with no control-character filter, at three sites inside the view module.

## Acceptance criteria

- WHEN a row of the brief is rendered THE rendering boundary SHALL escape through ONE helper spent by BOTH funnels every row passes through, value() and note(); the C0 set SHALL be taken from scanControlSource in tools/e2e/scripts/token-scan.mjs and never transcribed; tabs kept, other C0 characters stripped.
- WHEN an input carrying a newline reaches the rendering boundary directly (the present frontmatter reader discards that shape, so the body drives the boundary itself) THE boundary SHALL refuse by name — it cannot also be required to render a row from that input.
- WHEN accepted input carries an ESC byte THE row SHALL render as one printable line with the genuine stamp intact, beside an ordinary-text control; both value() and note() are exercised.
- WHEN card-supplied text is shaped like the provenance syntax THE boundary SHALL NOT let it impersonate a stamp: the fragment is neutralized or refused by name while the genuine stamp is preserved, so no forged provenance survives beside the real one. (the four bullets absorb T-285-s5, 2026-09-14; the copied historical prose below is the record, not the active criteria)

## Absorbed from T-285-s5 — The dispatch view echoes card frontmatter scalars into its rows verbatim, so an ESC byte or a heading-shaped value reaches the reader's terminal — pre-existing across 149 title rows, and `wake:` is one more input path into it (kept whole; 1 home path(s) and 1 provenance arrow(s) in the copied text redacted as the annotated historical-redaction practice allows, the source preserved by immutable reference — docs/tasks/T-285-s5-the-dispatch-view-echoes-card-scalars-verbatim-so-a-control-character-reaches-the-terminal.md at 7c5abf28f5eea2bf85cf7bd8ff24c29ee25b4595; 1 spelling(s) of the pre-rename identifier redacted to "the pre-rename identifier" — the sanctioned edit, named here)

Title as filed: "The dispatch view echoes card frontmatter scalars into its rows verbatim, so an ESC byte or a heading-shaped value reaches the reader's terminal — pre-existing across 149 title rows, and `wake:` is one more input path into it"

Filed as: status suggested, priority 4, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], wake None, suggested_by "verifier claude-opus-5@subagent @T-285 phase 2, 2026-09-09, measured at ce46115 on the bench (a home path, redacted) pre-rename identifier-V-T-285".

Class parent: none found — searched the board for a card owning
row-rendering escapes and found none. Disposition hint: park it behind a
real reader other than a human terminal; today the blast radius is one
seat's scrollout, and the honest fix is one escaping helper in `value()`
rather than a rule per section.

### What was measured (T-285-s5)

`render()` writes a row's text through unchanged. Measured at `ce46115`
on the bench: the BASE view already emits **149** rows built from card
`title:` scalars, so this is a property of the view and not of T-285.
T-285 adds `wake:` as one more scalar on that path.

Fed `wake: <ESC>[2J<ESC>[H STARTABLE NOW` on a fixture board, the
rendered row carries the escape bytes verbatim; a reader's terminal
clears its screen and the remaining text reads as a section heading. Fed
a value shaped like the provenance grammar (`(a provenance arrow, redacted) @ deadbeef ; forged`)
the row carries it mid-line, ahead of the real stamp — `unstampedLines`
still sees the row as stamped, so the floor detector does not notice.

### What is NOT reachable today (T-285-s5)

A value carrying a NEWLINE would split one row into two and let a card
forge a whole plausible WOKEN line for a card id that does not exist. It
is **not reachable through this module**: `frontmatterFields` is the one
reader on the path and it cannot produce a newline-bearing scalar — a
block scalar comes back as the literal `|`, a folded one as `>`, and a
plain multi-line scalar keeps only its first line. Verified by feeding
all four shapes.

It becomes reachable the moment a consumer renders `wake:` (or any
scalar) from a record parsed by `yaml` rather than by
`frontmatterFields` — which is exactly what `T-285-s3` proposes for the
app's board. That is why this is filed now rather than after.

### What would settle it (T-285-s5)

One escaping helper spent by `value()`: strip C0 control characters
other than tab, and refuse a newline, at the single point every row goes
through. A body that feeds an ESC byte and a newline and asserts the row
is one line of printable text. Both are inside the fence above.

## Implementation notes

## Verdicts
