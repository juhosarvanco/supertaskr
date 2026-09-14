---
id: T-176
title: The shipped card template parses as a phantom card in every generated project, and the planner's own repair of it is two further parse failures — the grammar has no word for "this is a template"
feature: F-03
milestone: 4
priority: 6
size: M
status: planned
blocked_by: []
touches: [app-agent, method/tasks, method/interview, docs/CONVENTIONS.md, docs/conventions/standing-gates.md]
suggested_by: standing triage sitting #4 (2026-08-30), from @human's first-walk board session relayed by the outgoing integrator seat
builder:
verifier:
built_by:
verified_by:
review:
---

**THE RELAY SAID THE METHOD FILE OPENS WITH A LEADING COMMENT. IT DOES
NOT, AND THE NEEDLE-CHECK IS WHY THIS CARD IS SHAPED DIFFERENTLY FROM
THE FINDING THAT ARRIVED.** Derived at `b60b06d`:
`method/tasks/T-000-template.md` starts with `---` and carries
`status: planned`; `/Users/ujju/Projects/nputer-app`'s copy at `d5c4b65`
does too. The leading comment exists only in the GENERATED project, and
`git -C /Users/ujju/Projects/first-walk log --follow -- docs/tasks/T-000-template.md`
returns ONE commit — the genesis commit `93a8f07` — which ADDS the
comment and `status: rejected` together. **The planner wrote that file.**

So this is not a byte in our template that needs moving. It is three
failures stacked, and the third is the one that matters.

## Layer 1 — the shipped template is a real card wherever it is parsed

`method/tasks/T-000-template.md` carries `status: planned`,
`milestone: 1`, `priority: 1`, `feature: F-0X`. In THIS repository that
is harmless: `method/` is outside all four walks (CONVENTIONS, THE FOUR
WALKS — the parser reads flat `docs/tasks/T-*.md` only). In a generated
project the same bytes land under `docs/tasks/` and parse as a live
milestone-1 priority-1 card in a feature column `F-0X` that does not
exist. The planner's own comment says it observed exactly this.

## Layer 2 — the repair the planner reached for is a designed parse failure

It set `status: rejected` on a FLAT card. `docs/CONVENTIONS.md`'s
suggestion-triage gotcha: *"Flat `status: rejected` in docs/tasks/ stays
a hard parse failure BY DESIGN (missing placement fields light the
board's parse-error badge) — move the file, don't 'fix' the parser"*,
pinned in `lib/parser/test/rejected-exclusion.test.ts`. The
generated project has no `docs/tasks/rejected/` for it to be moved to,
and nothing shipped tells the planner one exists.

## Layer 3 — and the explanatory comment breaks frontmatter outright

Measured at `b60b06d` against the real file:

    node -e 'console.log(require("fs").readFileSync(
      "/Users/ujju/Projects/first-walk/docs/tasks/T-000-template.md","utf8"
    ).startsWith("---"))'        # false

`lib/parser/src/frontmatter.ts` answers `missing-frontmatter`:
*"no frontmatter — file must start with a '---' YAML block"*. So the
board opens with a parse error on the template, which is what @human saw.

## WHAT THE THREE LAYERS ADD UP TO, AND IT IS NOT A TYPO

**Nothing shipped instructs the template's placement at all.**
`method/interview/plan-interview.md`'s normative stage table, stage 0,
says the scaffold creates *"empty docs/decisions/ docs/tasks/
docs/rooms/"* — EMPTY. The template's home is the kit root, and no row
says to copy it into the project's task directory. The planner improvised
a placement, discovered layer 1, and improvised a fix; both improvisations
are failures of a grammar it was never given. **A faithful reader of the
shipped documents cannot get this right**, which makes it the kit's
defect and not the planner's.

## The shapes, and the fix decides which — none is free

1. **Rename it out of the glob.** The parser collects flat
   `docs/tasks/T-*.md`; a template named so the glob misses it
   (`TASK-TEMPLATE.md`) is invisible wherever it is placed, needs no
   status word, and needs no parser change. Cheapest, and it moves a
   `KIT_FILES` `rel:`.
2. **Instruct the placement.** Stage 0's row names where the template
   goes (or says it stays in the kit root), so the planner stops
   improvising. Cheapest in bytes, and leaves layer 1 live for anyone
   who copies it anyway.
3. **Give the grammar a word for it.** A status the parser tolerates and
   the board does not draw. This is a TASK-FORMAT grammar change, is the
   most honest, and is the most expensive: it is a method version bump
   whose third file is Rust, and adding a status is ruled a method change
   rather than a parse fix (CONVENTIONS, suggestion-triage gotcha).

**THE BUMP QUESTION IS ALREADY ANSWERED FOR SHAPES 1 AND 3 AND THE LANE
MUST RE-DERIVE IT ANYWAY.** `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs`
at `b60b06d` lists `tasks/T-000-template.md`, so test 1 (SHIPPED BYTES)
is YES and a bump is owed for any edit to it — `kit.rs` `include_str!`s
it and `every_compiled_entry_matches_its_method_file_byte_for_byte` reds
on a byte drift. The fence above carries all three bump stamps for that
reason. Shape 2 alone touches `plan-interview.md`, which is also shipped
AND whose stage table is transcribed cell-by-cell into `BANKING_MAP`
(`app/src/genesis/genesis-derive.ts`) — see `T-173`, which moves the same
table.

## Acceptance criteria

- THE shipped card template SHALL NOT parse as a live card in a
  generated project, and the proof SHALL be a body that parses a
  MATERIALIZED kit the way the project's own parser does — not an
  assertion about our own tree, where `method/` is unparsed and the
  defect is invisible by construction.
- WHATEVER shape is taken, a fresh planner reading only the shipped
  documents SHALL be able to place the template correctly without
  inventing a status: the placement SHALL be stated wherever the
  scaffold is specified.
- IF a method version bump is owed THEN it SHALL be a three-file commit
  with the eval block in its message (CONVENTIONS, METHOD EVAL GATE),
  and the lane SHALL re-derive both bump tests at its own ref.
- Verification: headless — `cargo test` from app/src-tauri/ for the kit
  pins, and the parser suite for whatever the parse claim rests on.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
