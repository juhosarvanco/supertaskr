---
id: T-038
title: Token lint precision — a regex literal is not an arbitrary value, and neither is a variant
feature: F-02
milestone: 4
priority: 21
size: S
status: building
blocked_by: []
touches: [tools/e2e/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-020-s5, T-037-s1. **The gate is RED on main right now** —
`npm run lint:tokens` exits 1 against an untouched tree because
pattern P1 (`-\[[^]]`) matches a REGEX LITERAL at
`app/src/genesis/genesis-derive.ts:231`, not a Tailwind class. T-020's
own verifier predicted exactly this class ("P1 fires on regex literals
containing `-[`; `lib/parser/src/frontmatter.ts:35` is that shape,
safe only by scope") and the scope caught up when T-024 landed a
character class inside app/src. The second predicted class is still
loaded: P1 also fires on arbitrary VARIANTS (`data-[state=open]:`,
`group-[.peer]:`, `supports-[…]:`, `min-[600px]:`) which the T-020
plan §5 deliberately does NOT lint — safe today only because the
vendored `[&_svg]` has no preceding hyphen, so the next
`shadcn add <component>` reds the tree.

Consequence beyond the annoyance: the lint is CI's step 1, before
every install, so the standing "watch the first CI run" item aborts
before reaching any of the Linux evidence it exists to collect (the
T-018-s3 sentinel tests among it). A gate that cries wolf on a clean
tree also teaches its readers to route around it, which is how
enforcement mechanisms die.

## Acceptance criteria
- THE lint SHALL exit 0 on the current untouched tree, and the fix
  SHALL be precision — never the removal of a pattern, never an
  allowlist of files or lines (the zero-allowlist design in T-020 §5
  stands; a genuine future collision is a consultation, not an
  escape hatch).
- THE lint SHALL NOT report a match inside a regular-expression
  literal or a string that is not a class context — mechanism is the
  executor's call (a real tokenizer pass, a class-attribute-scoped
  scan, or an equivalent), recorded with its limits in the script's
  header so the next reader knows what it does and does not see.
- THE lint SHALL NOT report arbitrary VARIANTS (`data-[…]:`,
  `group-[…]:`, `supports-[…]:`, `min-[…]:`, `[&_svg]:` and the
  family) — they target selectors, not values, and the token
  mechanism still governs the utility half; the exclusion is recorded
  in T-020 §5 and SHALL become executable rather than incidental.
- THE lint SHALL still catch every true violation it caught before:
  the four patterns' positive cases (`p-[13px]`, `[color:red]`,
  `text-red-500`, `bg-(--x)`) SHALL each be re-proven by planting one
  and requiring file:line output with exit 1, and the `--selftest`
  sample set SHALL grow to carry the new negative cases (regex
  literal, each variant family) so the precision itself is pinned.
- WHEN the lint runs in CI THE step SHALL behave identically to the
  local command (one source of truth — the parity spec already binds
  the command string; confirm it still matches).

Verification: headless — `npm run lint:tokens` exit 0 on the tree,
`--selftest` green with the enlarged sample set, the four plant-and-
revert drills with output pasted, and the E2E lane (17/17) plus the
three repo suites unchanged. S-tier: executor + tests, orchestrator
merges.

## Implementation notes

## Verdicts
