---
id: T-225-s12
title: The triage view `--dispatch --full` is 40,672 bytes past one pipe buffer — the biggest arm there is, now announced on every run and filtered by nothing
feature: F-06
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/tests/dispatch-order.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE ARM T-225-s7 ASKED TO HAVE ANNOUNCED IS NOW ANNOUNCED, AND WHAT IT
ANNOUNCES IS THE WORST NUMBER ON THE BOARD.** T-225-s2 added
`--dispatch --full` to the margin guard's `LIVE_ARMS`. Measured back to
back at one held board, the base `09526da` in a detached drill and the
diff in the lane immediately after:

    --dispatch --full    105,910 -> 106,208 bytes

against a 65,536-byte pipe buffer: **40,672 PAST**, about 162% of one
buffer, and T-225-s2 moved it in the wrong direction by 298 bytes
because the margin block now discloses its own cost.

**T-225-s2 COULD NOT SHRINK IT AND SAYS SO.** That card's two passages —
`docs/CONVENTIONS.md`'s LANE PROTOCOL bullet and `method/lane-protocol.md`
rule four — are row 4 and row 10 of the `--task` arm and appear nowhere
in the dispatch arm. The `--dispatch --full` answer is a function of
`dispatch-order.mjs`'s own rendering: since T-225 the default arm carries
the dispatchable-now filter and `--full` spells out every set the filter
dropped, which is exactly what makes it the TRIAGE view
(`docs/STATE.md`, TRIAGE IS OWED AT THE STAMP) and exactly what makes it
the biggest invocation this command has.

**SO THE CEILING HAS MOVED ONE ARM ALONG AGAIN**, which is this family's
whole pattern: T-225 moved it off `--dispatch`, T-225-s2 moved it off
`--task <id> --state --full`, and the arm the project reads most
deliberately is the one still past the line.

**WHY IT WAS NOT BUILT IN THE LANE.** `tools/e2e/scripts/dispatch-order.mjs`
is outside T-225-s2's fence.

**WHAT A FIX WOULD DECIDE.** Whether `--full` spells out every dropped
set at full width or only the sets a triage sitting acts on; whether the
per-card body is truncated with its own disclosure the way the margin
block discloses the whole; or whether the arm is SPLIT so a reader asks
for one dropped set at a time. The third is the shape T-225-s2 took for
its two passages — an address rather than the bytes — and it is the one
that does not have to choose what to leave out.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-225-s2 merge (6691fc5)

The architect seat. The biggest arm there is, announced on every run and filtered by nothing.

## Acceptance criteria — DERIVED, 2026-09-02, executor claude-opus-5@subagent

The card was dispatched without this section (`brief.mjs --task` said so:
*"the card carries no acceptance criteria, so there is nothing to build
against"*). These are read off the card's own prose above and off
`dispatch-order.mjs`'s contract comments, and each one is a property that
was measured rather than an intention.

1. **`--dispatch --full` is materially smaller at ONE HELD BOARD**,
   measured base and tip back to back at the same ref, with the ref, the
   worktree count and the lane count named beside every figure.
2. **Nothing a triage sitting acts on leaves the answer.** Every ruled
   card keeps its row in `--full`; every ruling keeps the LANE it names
   and the EXACT SHARED PATHS it names — the two things the card's own
   prose says `--full` exists for.
3. **The term removed is the one that SCALES**, not a set that was
   dropped: `dispatchReport`'s own note names the cost as
   O(cards x lanes x paths), and the removal is the O(cards x lanes)
   half. The census's RULED half and the row-per-ruled-card contract are
   unchanged (`THE POSITIVE CONTROL` body, which exists to kill exactly
   the "smaller by emitting less" mutant).
4. **Each live lane's branch and worktree appear EXACTLY ONCE in the
   whole answer** — on the lane's own row under THE LIVE LANES, where the
   answer now says in as many words that they are. More than once means a
   ruling still re-spells one; zero means the fix bought its bytes by
   deleting what the reader came for.
5. **The removal cannot be WRONG.** The needle is built from the lane
   record rather than recognised as a shape, so a lane spelled any other
   way leaves the reason WHOLE — bigger than it needs to be and never
   wrong.
6. **`--dispatch --full` stays the biggest announced arm**, so
   `brief-flush.spec.ts`'s biggest-arm assertion stays green. This is a
   CEILING ON THE FIX rather than a property of it, and it is why
   criterion 1 reads "materially smaller" rather than "under one buffer"
   — see BUILT, below.

## BUILT, 2026-09-02 — executor claude-opus-5@subagent

**MEASURED AT `cde65b5`, EIGHTEEN WORKTREES AND FIVE LANES LIVE, BASE AND
TIP BACK TO BACK, THE BOARD UNMOVED BETWEEN THE TWO READS** (`git
worktree list --porcelain | grep -c`, taken before and after each pair):

    --dispatch --full   123,153 -> 99,943 bytes   (-23,210, -18.8%)
    --dispatch           49,202 -> 49,382 bytes   (+180, the disclosure below)
    every other announced arm      unchanged      (none renders this report)

**WHAT WAS REMOVED, AND WHAT EACH BYTE COST.** The parser spells a lane
into a reason as `T-202-s1 (refs/heads/task/T-202-s1-solo-lock-whole-path-key
at /Users/ujju/Projects/nputer-T-202-s1)`, and `--full` prints one reason
per held card — so every live lane's BRANCH and absolute WORKTREE PATH
were re-spelled once per card: **252 addresses, 23,388 bytes** across 120
rulings at this ref. Every one of them was a repeat of THE LIVE LANES
section a page above, which spells each lane's branch and worktree
exactly once. **The reader loses nothing it acts on**: the lane ID and the
shared PATHS — free that lane, argue with that overlap — are still in
every ruling, untouched, and the address is still in the same answer,
once, under a heading that names it. **The 180 bytes the default arm
GAINED are the price of saying so**: two note lines under THE LIVE LANES
telling a reader where the address went, because a disclosure a reader
has to infer is not one.

**WHAT WAS NOT BUILT, AND WHY THE RANKING DECIDED IT.** The card asks for
one pipe buffer, 65,536 bytes. That is **not reachable from this fence**,
and the obstruction is not arithmetic alone:

- **Arithmetic.** Everything outside the FENCED section is 51,326 bytes
  at this ref (STARTABLE alone is 39,345 over 62 cards), so the fenced
  rows would have to fit in about 14,200 bytes while the 55 title rows
  alone are 17,935. No lossless shape fits.
- **THE RANKING FLOOR, which binds first.** `brief-flush.spec.ts`'s
  margin guard requires the BIGGEST measured arm to carry `--full`. The
  second-biggest is `--task T-133 --preflight` at 74,443 bytes, which
  carries no `--full` and renders no dispatch report, so nothing in this
  fence can shrink it. **Any tip taking this view below 74,443 reds that
  guard by name**, in a file this fence does not hold. Verified on both
  sides: the guard was run at the base (green, `--dispatch --full`
  biggest at 123,153) and at the tip (green, biggest at 99,943, 25,500
  clear of the floor).

**ROUTED, NOT BUILT** — T-225-s17 (the arm SPLIT per dropped set, the
shape this card itself preferred; needs `brief.mjs`'s flag parsing, held
by T-239), T-225-s18 (the ranking floor; needs
`tools/e2e/tests/brief-flush.spec.ts`, which T-225-s13 already holds and
may absorb it), and the standing T-225-s11 (shrink the preflight arm),
which would lower the floor from the other side.
