---
id: T-133-s1
title: The brief command ships with no bullet in CONVENTIONS, so the one derivation that lists commands cannot see it
status: suggested
suggested_by: executor claude-opus-5 @T-133
---

**ROUTED, NOT TAKEN.** T-133's fence is `touches: [tools/e2e]`.
`docs/CONVENTIONS.md` is outside it, and a fence is not widened from
inside the lane it fences (lane-protocol rule 5), so the command ships
with exactly one spelling and no entry in the section that enumerates
this project's commands.

## What is missing

`node tools/e2e/scripts/brief.mjs --task T-NNN` and
`node tools/e2e/scripts/brief.mjs --state` are the only spellings. The
`tools/e2e` bullet under `## Build & test` lists seven commands and this
is not one of them, so:

- **`workflow-parity.spec.ts` cannot see it.** That derivation reads the
  per-package bullets; a command in `package.json` and not in the bullet
  is invisible to both of its loops, which is the third silent SHAPE that
  bullet already names — "a command written into a bullet carrying no
  `run from <dir>/:` marker" has a sibling, "a command in no bullet at
  all".
- **The next dispatcher will not find it**, which is most of the point.
  The card's argument is that the right answer has to be CHEAPER than the
  remembered one, and a command nobody can find is not cheaper than
  memory.

## The edit

One bullet entry beside `npm run lint:docs`, and a disposition. **It is a
REPORTER and not a gate** — it writes nothing and judges no diff — so it
takes `LOCAL_ONLY` with the reason, the same disposition
`cargo run -p nputer-index -- arch` and `index --watch` already have, and
`workflow-parity.spec.ts` needs the matching `LOCAL_ONLY` entry in the
same commit or the lane reds by name (T-090's worked example).

**IF a named `npm run` form is added THEN it must be added to both sides
in one commit.** The two halves are the doc bullet and the spec's
`LOCAL_ONLY` list, and the middle-dot rule governs the bullet: a
separator inside a parenthetical drops every command behind it.

Fence: `[docs/CONVENTIONS.md, tools/e2e]`. Note that the CONVENTIONS seat
already has five queued edits across two bullets (`T-092`, `T-093`); this
is a sixth and belongs to neither, because it is an addition to
`## Build & test` rather than to a gotcha.
