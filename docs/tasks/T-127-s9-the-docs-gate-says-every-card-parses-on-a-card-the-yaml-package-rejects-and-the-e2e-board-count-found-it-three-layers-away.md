---
id: T-127-s9
title: The DOCS GATE says "every live task card's frontmatter parses" and exits 0 on a card whose frontmatter the yaml package REJECTS — the exact 9c64cd8 class the gate was built for, found three layers away by an e2e frame test
status: suggested
suggested_by: executor claude-opus-5 @T-127-s6
---

**The DOCS GATE bullet in `docs/CONVENTIONS.md` opens its own argument
with this failure**: at `9c64cd8`, *"two card titles opened with a
backtick, a YAML plain scalar may not, both cards became unparseable,
nothing errored, the board just got SHORTER and it surfaced as
`Expected "60"` against `Received "62"` in four bodies about scroll
containment."* The gate exists so that red arrives attached to its edit.

**It reproduced, on T-127-s6's lane, against the gate.**

## Measured at `f0ff62d` + two untracked suggestion cards

An executor that had read that bullet the same session wrote a card whose
`title:` began with a backtick. What each check said, all read from `$?`
unpiped:

    npm run lint:docs   from tools/e2e   exit 0
      docs-gate: every live task card's frontmatter parses, with a legal status.

    node -e 'yaml.parse(frontmatter)'
      FAIL  Plain value cannot start with reserved character ` at line 2, column 8

    npm test            from tools/e2e   exit 1, 5 failed of 281
      shell-frame.spec.ts:232:3  x3 — the frame holds on every screen
      shell-frame.spec.ts:263:1      — the error strip owns a ceiling
      Expected "60"  Received "61"   on <main data-failure-count>

**Positive control, run rather than argued**: rewording the title so it
does not open with a backtick, changing nothing else, takes
`shell-frame.spec.ts` from 4 failed to **6 passed, exit 0** in 12.0s.
The attribution is the title and nothing else.

Note the count: `data-failure-count` was **60 before**. The board already
renders a standing sixty; the card moved it to 61, so the signal is one
digit in an attribute on a frame test three layers from the edit — which
is the bullet's own sentence about how this class is found.

## What is worth fixing, and what is not

The gate is not wrong about most of what it checks; it is wrong about
this ONE sentence, and the sentence is the reassuring kind. Two shapes,
and the second is probably the real one:

1. **The frontmatter check does not use the `yaml` package.** Something
   in the chain accepts a plain scalar YAML forbids. `brief.spec.ts`
   already carries a body asserting *"the frontmatter reader agrees with
   `yaml` on every live card and every component"* — so the repository
   OWNS a comparison against the authority and the gate does not run it.
   Wiring that comparison into `docs-gate.mjs`'s live-tree check is
   probably the whole fix.
2. **A green sentence is a claim.** *"every live task card's frontmatter
   parses"* is stated unconditionally on every run, which is exactly the
   shape CONVENTIONS warns about elsewhere: a check that can only ever
   say yes. Whatever the fix, it needs a PLANTED HIT — a card with a
   backtick-opening title in a scratch tree — before its zero is written
   down again (the POISON DRILL's proof clause).

## Why T-127-s6 did not fix it

`tools/e2e/scripts/docs-gate.mjs` is `tools/e2e`, outside
`[docs/architecture/components/, app-map, crate-index]`. The bad card was
this executor's own and was repaired in the lane before hand-off —
`docs/tasks` is always writable — so nothing is left red by it. The gate
gap is what survives.

## Fence

`[tools/e2e]` — collides with `T-153-s5`/`T-153-s6` and with `T-127-s8`,
which is the same fence for a neighbouring gap in the same file family
(the census cannot see a reader that goes through a helper). **Take them
together or take them in a row; they are one sitting.**
