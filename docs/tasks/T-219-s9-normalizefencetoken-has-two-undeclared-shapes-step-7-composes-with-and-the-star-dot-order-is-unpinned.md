---
id: T-219-s9
title: "`normalizeFenceToken` has two UNDECLARED shapes that step 7 now composes with — a star run glued to a NAME (`lib/parser/..*` resolves to `lib`) and an ABSOLUTE token (`/../lib` resolves to `lib`) — and the star-strip/dot-resolve order is pinned by no body"
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: verifier claude-fable-5-1@subagent @V-T-219-s6, measured at e74c12c, 2026-09-09
blocked_by: []
touches: [lib/parser/src/fence.ts, lib/parser/test/fence.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`normalizeFenceToken`'s declared ceiling names ONE glob shape — a
trailing star run, `app/src/styles/**` naming the directory
`app/src/styles` — and its step 5 strips that run with
`/(?:\/)?\*+$/`. The optional slash means a star run GLUED TO A NAME is
stripped as if it were a directory's: `src*` becomes `src`, `.*` becomes
`.`, `..*` becomes `..`. That is pre-existing and was silent before
`T-219-s6`, because a dot left behind reserved a domain nothing could
match. Step 7 now resolves what step 5 leaves, so the two compose into
answers a card author would not expect. Measured at `e74c12c` through
`lib/parser/dist/index.js` — **derive again, never quote**:

| token | normalised | what it reserves |
|---|---|---|
| `lib/parser/.*` | `lib/parser` | the whole directory, for a dotfile glob |
| `lib/parser/..*` | `lib` | the PARENT, for a glob over names beginning `..` |
| `lib/parser/../*` | `lib` | the parent — this one is arithmetic and is right |
| `/lib/parser` | `/lib/parser` | a domain no repository-relative path can sit inside (pre-existing, silent) |
| `/../lib` | `lib` | `..` cancelled the EMPTY anchor segment, so an absolute climb became a relative name |
| `/..` | `` | refused as the empty spelling |

The `..`-cancels-the-anchor row contradicts the step-7 doc's own
sentence — *a `..` with nothing to cancel is KEPT* — because an empty
first segment is lexically "something" and semantically nothing.

**AND THE ORDER IS UNPINNED.** V-T-219-s6's mutant `VM15` moved step 5's
strip to AFTER step 7 (`lib/parser/.*` then normalises to `lib/parser/.`
rather than `lib/parser`) and the parser suite stayed at its baseline —
no body reds. Every body that pins a star run beside a dot segment
(`lib/./parser/**`, `lib/x/../parser/`) gives the same answer under both
orders; only a name-glued run tells them apart, and none is pinned.

## Why this is NOT a defect of `T-219-s6`

- Both shapes are outside the ceiling that function declares, at the
  base and at the tip; the card asked for interior dot segments and got
  them.
- The tip's answers are CONSISTENT with step 5's own declared meaning
  ("the star run names the directory") applied to a badly spelled
  directory: `lib/parser/..` IS `lib`. Surprising, not wrong by its own
  rule.
- **0 live tokens** carry either shape at `e74c12c`
  (`grep -h '^touches:' docs/tasks/T-*.md | grep -E '[^/ \[,]\*'` and
  `grep -E '\[/|, /'` both count 0); the board-wide invariant over all
  918 normalised tokens holds.

## What to build

- Step 5 SHALL strip a star run only where a `/` (or the token's start)
  precedes it; a run glued to a name (`src*`, `.*`, `..*`) is a glob
  this function does not interpret and SHALL survive to `GLOB_CHARS`,
  which classifies it `unresolved` — the ceiling's own sentence, kept.
- A token beginning `/` SHALL be declared: refused by name (a fence is
  repository-relative, so an absolute path names nothing on this board),
  or stripped with the reason written down. The `..`-cancels-the-anchor
  row falls out of whichever is chosen.
- A body SHALL pin the step-5/step-7 order with a token only the order
  distinguishes, and SHALL be shown RED under the swapped order before
  it is trusted green (`docs/reference/07-verification.md`, the drill).

## Read beside

`T-219-s6` (step 7 and its ceiling), `T-111-s3` (the vocabulary
measurement), `T-219-s4` (`DOT_DOMAIN`), the V-T-219-s6 verdict on
`T-219-s6`'s card (`VM15` and the probe table).
