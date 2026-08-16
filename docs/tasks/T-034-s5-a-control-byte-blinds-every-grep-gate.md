---
id: T-034-s5
title: A control byte in a source file blinds every grep gate — the check belongs in lint:tokens, not in one pane's suite
status: suggested
suggested_by: executor claude-opus-5 @T-034
---

Found while sweeping T-034's own diff with `file(1)`, and it is a
whole-repo trap rather than a map problem.

**The mechanism.** A control character written as a LITERAL byte into a
string or template literal — instead of the six-character `\uXXXX`
escape — compiles, bundles, typechecks and tests green. But `file(1)`
classifies that source as `data`, and **`grep(1)` treats it as BINARY**:
it prints `Binary file … matches` instead of the line, and with `-c` or
in a pipeline it can report nothing at all. Every grep-based gate in
this repo then silently stops seeing that file:

- `tools/e2e/scripts/lint-tokens.mjs` (reads with `readFileSync(…,
  "utf8")`, so it survives — but it is the natural home for the check);
- the no-innerHTML / raw-HTML-sink gates in
  `app/test/genesis-pane-dom.test.tsx` and
  `app/test/map-tasks-lens-dom.test.tsx`;
- any future `grep`-shaped CI step.

**It has happened twice in this repo, by two different builders, and
neither noticed.**

1. `app/src/architecture/map-layout.ts` — `layoutKey` writes its THIRD
   separator as a literal `U+0003` while the two beside it are correct
   escapes. Shipped by T-012, present on main until T-034 fixed it.
2. `app/src/architecture/task-waves.ts` — two literal NULs in the
   critical-path edge keys. Shipped by T-034's own checkpoint 1, fixed
   at its checkpoint 4, and the same trap bit a THIRD time while
   writing the gate itself.

Both were behaviour-neutral (the escape and the literal denote the same
string), which is exactly why nothing went red.

**What exists now, and why it is not enough.** T-034 added a standing
check over `app/src/architecture/**` that fails on any C0 control
character except tab, LF and CR, reporting codepoint and offset. That
covers one pane. The trap is repo-wide, and the natural home is
**`lint:tokens`** — it already walks `app/src/**/*.{ts,tsx}` with a
hand-written lexer, it is CI's FIRST step (it runs against a bare
checkout with nothing installed), and it already exists to catch
"compiles fine, silently wrong" bypasses. This is the same class.

Sketch, in that file's idiom: a fifth pattern `P5` — "literal control
character (invisible, and it makes grep treat the file as binary)" —
applied to the RAW source rather than the masked text (a control byte in
a comment is just as blinding as one in a string), with tab/LF/CR
allowed and the report naming `U+XXXX` and the offset. Zero allowlist,
like the other four. Widen the walk to `app/test/**`,
`lib/parser/src/**` and `tools/e2e/**` if the cost is acceptable; as of
T-034, all four trees are clean, so it lands green.

Measured today: `file(1)` over every tracked `.ts`/`.tsx`/`.mjs` in
`app/src`, `app/test`, `lib/parser/src` and `tools/e2e` reports text for
all of them. That is the moment to add the gate — before the next one.
