---
id: T-229-s13
title: "`JSON.parse` rejects a trailing comma that `tsc` accepts, so the app-program include pin reds on a tsconfig TypeScript compiles happily — and the uniqueness floor counts the literal in string VALUES too"
feature: F-06
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-229-s10, measured on the bench at cf7c176, 2026-09-09
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-229-s10` replaced a whole-file regex with a string-aware JSONC scanner
plus `JSON.parse`, and pinned the key's uniqueness on the comment-stripped
text. That fix is sound and its two halves are independently load-bearing.
It carries **two false positives in the safe direction**, both measured on
a detached scratch worktree with three-hash restores:

1. **A TRAILING COMMA.** `tsc` accepts `"include": ["src", "test/node-builtins.d.ts",]`
   in a tsconfig — it is ordinary JSONC. `JSON.parse` does not. The body
   reds with `SyntaxError: Unexpected token ']'` on a file TypeScript
   compiles without complaint.
2. **THE FLOOR COUNTS STRING VALUES.** `withoutComments.split('"include"').length - 1`
   counts the literal `"include"` anywhere in the stripped text, not only
   as a key. A value such as `"_note": "include"` makes the count 2 and
   reds the floor. (An ESCAPED occurrence — `"_note": "\"include\": [...]"` —
   does NOT trip it, because the backslash breaks the substring; measured.)

**Neither can make the pin go GREEN**, which is why this is a suggestion
and not a rejection. Both fail loud, on the named body, with a message.
Nothing about the app program's node surface goes unwatched.

## Why the obvious remedy needs care — CHECKED, not assumed

`typescript@5.8.3` is already an `app` devDependency and
`ts.parseConfigFileTextToJson` is pure (it needs no `ts.sys`, so it works
under this file's `@vitest-environment jsdom`). Run against the real
`app/tsconfig.json` on the bench:

| input | `error` | `include` returned |
|---|---|---|
| the file as it stands | 0 | `["src","test/node-builtins.d.ts"]` |
| with a trailing comma | 0 | `["src","test/node-builtins.d.ts"]` |
| malformed (a `]` removed) | **1** | **`["src","test/node-builtins.d.ts","references",[{"path":"./tsconfig.node.json"}]]`** |

**THE THIRD ROW IS THE TRAP AND IT IS THE WHOLE REASON THIS CARD EXISTS
RATHER THAN A ONE-LINE SWAP.** The TypeScript parser RETURNS its error
instead of throwing, and hands back a plausible-looking config beside it.
A swap that reads `.config.include` and ignores `.error` **FAILS OPEN** on
a broken file — the shape `T-229`'s whole class is about. The landed
`JSON.parse` route **FAILS CLOSED**: it throws, and the body reds.

**So the current implementation is the SAFER of the two, and any change
here must not read as an upgrade.** If the parser is swapped, the returned
`error` MUST be asserted absent in the same body, and that assertion owes
its own positive control (a deliberately malformed copy on a scratch
worktree, seen to red).

## What "done" would look like

Either:

- the trailing-comma and string-value cases are accepted as documented
  brittleness, and a sentence in the body's comment says so — cheapest,
  and arguably correct, since both fail loud; or
- the parse moves to `ts.parseConfigFileTextToJson` **with `error`
  asserted absent**, and the floor is narrowed to count `"include"` only
  where it is a KEY (a scan for `"include"` followed by optional
  whitespace and a `:`), each change carrying a data mutant that is seen
  to red before it is claimed as a kill.

No criterion on `T-229-s10` reaches either, which is why that card was
approved with no assigned correction.
