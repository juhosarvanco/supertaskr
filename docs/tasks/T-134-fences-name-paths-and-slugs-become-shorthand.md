---
id: T-134
title: A fence names paths and a slug is shorthand — zero real collisions occurred all night while one word serialised most of the board
feature: F-06
milestone: 4
priority: 5
size: M
status: building
blocked_by: []
touches: [lib-parser, method/lane-protocol.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human adopted this on 2026-08-25** as item 4 of `T-131`'s five process
changes.

## The measurement

**Zero real fence collisions occurred during the session that ran six
lanes concurrently.** Every block was a *naming* collision:

- 21 of 36 planned cards named `app-shell`; nine named nothing else.
- `T-126` — priority 5, needing one `mod` line in `lib.rs` — waited hours
  behind a registry lane that never opened that file.
- Two fences were narrowed by hand mid-session (`T-108`'s bare
  `docs/tasks/` directory, and `T-116`'s app-test question). **Both
  narrowings were correct and neither produced a collision.**
- `T-116` and `T-033` held the same slug simultaneously with **disjoint
  file sets** and never touched each other.

**A slug is the only expressible unit today, so a card that knows its
three files must claim its whole component.** The fence stops being
collision-avoidance and becomes a lock on a name.

## What this is NOT

**It is not "remove the fence."** The fence is what kept six concurrent
lanes from writing each other's files, and `T-126`'s verifier ruled this
session that a card's own criteria may not override it. **Path granularity
makes the fence sharper, not weaker** — a lane that names three files is
easier to check than one that names a component, not harder.

**And a slug must remain expressible.** A card that genuinely rewrites a
component should say so in one word. The change is that a slug becomes
*shorthand for a path set* rather than the only vocabulary.

## Acceptance criteria

- **`touches:` SHALL ACCEPT PATHS AND SLUGS IN THE SAME LIST**, and
  disjointness SHALL be computed over the EXPANDED path sets rather than
  over the tokens. **`T-111-s1` already recorded the token-comparison
  defect from the other side** — two lanes were declared disjoint because
  their slug strings differed while one component carried both slugs.
- **THE EXPANSION SHALL READ EACH COMPONENT FILE'S `touch_slugs:`**, which
  `method/roles/executor.md` already rules authoritative over the prose
  block in the architecture document, *"because the block is prose that
  goes stale the day a component is added."* **Do not build a second map.**
- **A PIN SHALL DRIVE THE CASE THAT MOTIVATED THIS**: two cards whose
  slugs collide but whose paths do not, required disjoint; and two whose
  paths collide, required overlapping. **Both SHALL fail against the
  pre-fix tree** — the second one probably passes today, so say which does
  and which does not rather than claiming both are new.
- **A CARD'S OWN FILE IS NEVER IN ITS OWN FENCE** and the expansion SHALL
  encode that rather than leaving it to each reader. Ruled during
  `T-108`'s dispatch and confirmed by two lanes since; **`T-108-s3`
  records that `executor.md` step 5 is currently unperformable for any
  path-fenced card**, and this card SHALL either resolve that or route it
  explicitly.
- **THE VOCABULARY DEFECT SHALL BE FIXED IN THE SAME PASS OR ROUTED.**
  `T-111-s3` measured that `touches:` carries three kinds of token —
  slugs, paths, and directory prefixes — with `method` beside `method/`
  and `tools/e2e` beside `tools/e2e/`. **A parser that accepts both
  spellings silently is how a fence check returns the wrong answer.**
- **A BARE DIRECTORY FENCE OVER `docs/tasks/` SHALL BE REJECTED BY THE
  PARSER, not by convention.** That directory is where every dispatch and
  every integrator stamps frontmatter, so a lane holding it collides with
  every other lane's opening and closing move. Ruled at `T-108`'s
  dispatch; **this card makes it mechanical.**
- **NO EXISTING CARD'S FENCE SHALL CHANGE MEANING SILENTLY.** IF the
  expansion alters what any live or planned card holds THEN enumerate the
  affected cards by id and say what moved. **A fence that changes under a
  running lane is `T-111-s1`'s failure from the registry side.**

Verification: headless — `npx vitest run` from `lib/parser/`, exit read
**unpiped from `$?`**, count derived; plus `npm test` from `app/` if any
shape the board reads moves. **POISON DRILL on every new assertion**, one
side only, producer mutated and never the assertion, read back with
`git diff` before its run, restores proved per-path by sha256 in a
detached scratch worktree **OUTSIDE the repository**. **Uniqueness of kill
SHALL be measured against the whole suite rather than asserted.** The DOCS
GATE fires on `method/` paths a code suite reads and on this card — run it
**directly, never through `xargs`**. Ask GRAPH REGEN rather than
predicting and **ask again after any write**. @human: none — the ruling is
already made; this is its mechanism.
