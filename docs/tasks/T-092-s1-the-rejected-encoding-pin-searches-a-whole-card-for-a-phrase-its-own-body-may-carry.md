---
id: T-092-s1
title: The rejected-encoding pin searches a WHOLE card for a phrase that card's own body may carry, so poison shape eight is live in lib/parser
status: parked
suggested_by: executor claude-opus-5 @T-092
---

**ROUTED, NOT TAKEN.** T-092's fence is
`touches: [docs/CONVENTIONS.md, app-agent]`. This body lives in
`lib/parser/test/`, which is C-06 — outside the fence, and a fence is not
widened from inside the lane it fences (lane-protocol rule 5,
TASK-FORMAT's criterion clause). Found by the class sweep T-092's own
criteria ordered; recorded here so the sweep result is not lost.

## The instance

`lib/parser/test/rejected-exclusion.test.ts`, in
*"the live rejected/ directory is non-empty, so the exclusion pin is not
vacuous"*:

    const content = readFileSync(join(rejectedDir, name), 'utf8');
    expect(content).toContain('status: rejected');

The haystack is a WHOLE task card. The comment one line above says what
the assertion is understood to pin — *"every file there uses the ratified
encoding: status: rejected kept"* — which is a claim about the file's
**frontmatter**. `toContain` is satisfied by any occurrence anywhere, so
a rejected card whose frontmatter carried a different status while its
BODY quoted the phrase in prose passes this assertion with its own
subject deleted. That is poison **shape EIGHT** as T-092 numbers it.

**It is one planted copy away and the copies are plausible**, which is
what makes it worth a card rather than a shrug: cards in
`docs/tasks/rejected/` are prose ABOUT triage, and the phrase
`status: rejected` is the thing triage is about. Derived at T-092's tip
`dc3c5af`: every tracked file under `docs/tasks/rejected/` holds exactly
ONE occurrence today, and the same phrase already appears 37 times across
`docs/` and `method/` — `docs/tasks/T-016-*.md` alone carries five.
Re-derive rather than quoting these: `git grep -Fc 'status: rejected' --
docs/tasks/rejected/`.

## Why the sibling assertions in the same sweep are NOT this

Recorded so the next reader does not re-open them:

- `app/src-tauri/src/dispatch/lanes.rs` and several bodies in
  `app/src-tauri/tests/agent_runner.rs` search whole files with
  **negated** `contains`. A duplicate REDS a negative assertion rather
  than greening it, so the shape cannot bite there.
- `app/src-tauri/src/agent/mod.rs`'s
  `the_only_production_path_to_the_transcript_is_the_bounded_one` already
  applies shape eight's remedy and says why in a comment: it cuts the file
  to its production half first, *"so every signature it looks for is also
  a string literal a few lines below"*. It is the worked example, not a
  finding.

## What would close it

Either remedy from CONVENTIONS' shape-eight entry, and the choice is
whoever owns C-06's:

- **Narrow the haystack** — parse the frontmatter block (this package
  already owns a frontmatter reader) and assert the STATUS FIELD equals
  `rejected`. This is the stronger one, and it pins what the comment
  already says the body means.
- Or an occurrence floor, with the caveat CONVENTIONS records: a bare
  count is a number with no keeper.

Fence it needs: `lib-parser`. The pin is not currently wrong about the
tree — it is unfalsifiable in one direction, which is the finding.

Amnesty triage 2026-08-29 (triage seat): PARKED — poison shape EIGHT, live, in the pin that guards the very encoding this triage sitting uses — and it is one planted copy away, on plausible copies: cards under docs/tasks/rejected/ are prose ABOUT triage and the phrase status: rejected is the thing triage is about. The pin is not wrong about the tree; it is unfalsifiable in one direction, which is the finding. The remedy is the stronger of the two CONVENTIONS offers and it is available for free: this package already owns a frontmatter reader, so assert the STATUS FIELD rather than searching the whole card, which pins what the comment already says the body means. RESURFACES: the next lib-parser dispatch. This sitting added two files to docs/tasks/rejected/ and both carry the phrase in their frontmatter AND in triage prose, so the corpus that could plant the counterexample has just grown.
