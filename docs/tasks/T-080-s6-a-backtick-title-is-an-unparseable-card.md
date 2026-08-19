---
id: T-080-s6
title: A card title that opens with a backtick is unparseable, and the only thing that notices is an off-by-N in a shell-frame body
status: suggested
suggested_by: executor claude-opus-5 @T-080
---

Found by walking into it. Task frontmatter is YAML, and a plain scalar
may not begin with a reserved indicator — backtick among them — so
`title: ` followed immediately by a backtick is a `YAMLParseError`. The
convention's own prose names symbols in backticks constantly, so this is
the natural thing to write, and two of this card's five findings were
written that way. **Nothing in the gates catches it.** `lint:tokens`
does not parse frontmatter, `index --check` ignores `docs/` by
`.nputerignore`, and the file looks correct in every editor. What
actually caught it was `tools/e2e/tests/shell-frame.spec.ts`, whose
`boardWithErrors` helper injects a known number of failing files into
the REAL repo docs snapshot and asserts the board's
`data-failure-count` equals it: two unparseable cards turned
`Expected: "60"` into `Received: "62"` across four bodies at
`146c333`, in tests whose subject is the frame's scroll containment
rather than task files at all. The diagnostic is three steps from the
cause, and it only fires because the lane drives the real tree — a
synthetic fixture would have stayed green. Audited repo-wide after the
fix: **0 unparseable files of 116, and 0 titles starting with any
YAML-reserved character**, so the two were the first instances rather
than a pattern. The cheap remedy is a rule in `TASK-FORMAT.md` (quote a
title that starts with a symbol) plus, better, a check that every
`docs/tasks/*.md` frontmatter parses — which is a natural companion to
the token lint, needs no `node_modules` beyond a YAML reader, and would
name the file instead of the count.
