---
id: T-149-s5
title: Three present-tense statements still say the app test directory belongs to C-05 after T-149 retired that rule, and the dogfood title still says 185 files where the tree has 189
status: suggested
suggested_by: verifier claude-opus-5 @T-149-verify
---

**DERIVED AT `d437f5a` with `command grep -rn` over the whole tree**,
then each hit read to separate a HISTORICAL record (which this project
deliberately leaves standing with its ref) from a PRESENT-TENSE claim
about how the registry works today. The landed cards under `docs/tasks/`
and the dated ledger comments in `architecture-dogfood.test.ts` are the
first kind and are correctly untouched. **Four are the second kind.**

## The four

1. **`docs/architecture/components/C-14-agent-runner.md`** — the T-010
   settlement paragraph: *"a component's test double and its suite belong
   to the component they exercise, **the same rule that puts
   `app/test/**` under C-05**"*. There is no longer such a rule, and this
   file is one of the seven T-149 edited. The dogfood comment retires the
   sentence at its OTHER home (*"The clause above that reads … is what
   T-149 retires"*) and this copy was missed. **Inside a reachable
   fence.**
2. **`app/test/select-board.test.ts`**, the T-111 header block:
   *"**`app/test/**` IS C-05's `app-shell`, AND THAT IS WHY THESE BODIES
   EXIST AT ALL.**"* The second half stays true as history; the first
   half is now false, and the file itself is one of the two T-149 routed
   to C-08. **Inside a reachable fence (`app-board`).**
3. **`docs/ARCHITECTURE.md`**, twice — the T-010 clause at the C-14
   discussion and again in the registry-settlement paragraph, both
   spelling *"the rule that already puts `app/test/**` under C-05"*, plus
   T-101's disclosure paragraph asserting *"`app/test/**` and
   `app/vitest.config.ts` are both C-05 `app-shell`"* (the second half
   still holds). **NOT inside any fence T-149 could have held** —
   `docs/architecture/components/` does not contain `docs/ARCHITECTURE.md`
   — which is why this one is routed rather than repaired.
4. **`app/test/architecture-dogfood.test.ts`**, the title *"all 185 files
   map and the bucket is EMPTY again"*. The tree has been **189** files
   since T-137. This one was ALREADY false at the base `23ee41b`, so by
   `integrator.md` rule 3's parent test it is correctly filed rather than
   repaired inside a routing card; T-149's notes record it under *Noticed
   and NOT done* and argue against a card. **Collected here so it has a
   seat**, because a stale digit in a test TITLE is the kind of figure
   later readers quote — the body's ledger is right and the title is what
   gets copied.

## Nothing reds for any of them, which is the whole argument for a card

`npm test` from `app/` is **1013/1013**, `cargo test` **518/0/4**,
`lint:docs` **0** at `d437f5a` — measured. A signpost has no gate. This
is the same shape CONVENTIONS' own FOUR WALKS bullet records about
itself: *"THREE STALE SIGNPOSTS IN THIS ONE BULLET NOW … every one caught
by the lane that falsified it and NOT ONE by a gate."*

## What to do, and the one judgement inside it

Items 1–3 are one sentence each; the honest edit is the one T-149 already
made in the dogfood comment — **keep the record and stamp it**, rather
than delete the clause, because the T-010 reasoning is what a later
reader needs and only the tense is wrong (T-101's precedent, cited in
`ARCHITECTURE.md` itself for exactly this move). Item 4 is one digit, and
whoever takes it should ask the second question first: **does the title
want a number at all**, given that this file's own history says a count
in a title goes stale under somebody else's merge.

Fence: `[docs/architecture/components/, app-board, app-map,
docs/ARCHITECTURE.md]` — `app-board` reaches `select-board.test.ts` and
`app-map` reaches `architecture-dogfood.test.ts` under T-149's own
routing, which is this card's first small demonstration that the routing
works.
