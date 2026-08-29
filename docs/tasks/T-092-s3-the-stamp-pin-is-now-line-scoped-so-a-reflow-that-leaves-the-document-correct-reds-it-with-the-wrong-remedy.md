---
id: T-092-s3
title: The stamp pin is now LINE-scoped, so a reflow that leaves the document correct reds it — and the message names the wrong remedy
status: parked
suggested_by: verifier claude-opus-5 @T-092
---

T-092's remedy for poison shape eight narrows both haystacks to ONE LINE
via `the_one_line_carrying` (`app/src-tauri/src/agent/kit.rs`). The
criterion permitted exactly this ("an occurrence count, or a narrowed
haystack") and the choice is argued in the card. **This is not a defect
in the fix** — it is the cost the choice carries, measured, so the next
editor of that gotcha is not surprised by it.

## Measured

Drilled at `73d7870` in a detached scratch worktree with its own
`CARGO_TARGET_DIR`, one side only (the DOC), substitution count asserted
at 1, mutated text read back with `git diff -U0` before the run, restored
byte-exact against `73d7870`
(`26322cd653a6c12de6a9bff65d7f937bfce4809f8d993c4235e83aab994d0b12`).

Gotcha one was REFLOWED at the ~70-column wrap so that
`formats are version-bumped` and `(currently v0.1.7)` land on different
lines. **The document is still completely correct**: the anchor is
present exactly once, the stamp is present exactly once, and it is still
inside the first gotcha. `cargo test --lib` from `app/src-tauri/`:

    197 passed / 1 failed, exit 101
    docs/CONVENTIONS.md's first gotcha no longer says 'currently v0.1.7'
      - bump METHOD_SNAPSHOT_VERSION with the method

**The remedy that message names is wrong and actively harmful.** Bumping
`METHOD_SNAPSHOT_VERSION` would not fix a reflow, and it would break the
plan-interview arm and the doc stamps — the three-file bump the first
gotcha itself rules on. The correct repair is "the sentence was rewrapped;
put the stamp back on the anchor's line, or move the anchor."

## Why this is live rather than theoretical

CONVENTIONS' own *A MISS IS NOT A REFUTATION* bullet already carries the
mechanism as cause THREE — *A HARD WRAP ACROSS THE PHRASE* — and says in
as many words that **the wrap point MOVES**: the sentence it works from
broke one word earlier at `4d2f03c` and ADR-019's compaction reflowed it.
The compaction that moved a wrap in this file is nine days old, and this
pin's anchor line is 70 columns of prose in the most-edited gotcha in the
document.

It also interacts with the three-file method bump (T-078-s3): a bumper
who rewraps gotcha one **while** bumping now gets a red whose message
sends them to the const they already moved.

## What would close it

Cheapest first; any one of them:

- **Fix the message, not the mechanism.** Have the stamp asserts say what
  else could be true: *"…or the sentence was reflowed and the stamp left
  the anchor's line — check the wrap before touching the const."* One
  clause each, no behaviour change, and it converts a misdirection into a
  correct diagnosis. This is probably the whole fix.
- Widen the haystack from a LINE to the SECTION the anchor opens (the
  gotcha), which is wrap-immune and still not the whole file. Costs a
  second anchor for the section's end.
- Leave it and record the trade in the shape-eight entry, which already
  discusses anchor-vs-count but does not mention wrap sensitivity.

Fence it needs: `app-agent` (+ `docs/CONVENTIONS.md` for the third arm).

Amnesty triage 2026-08-29 (triage seat): PARKED — not a defect in T-092's fix but the measured cost of the choice it made, and the cost is a MISDIRECTION rather than a false green: a reflow at the ~70-column wrap leaves the document completely correct and reds the suite with a message telling the reader to bump METHOD_SNAPSHOT_VERSION, which would not fix a reflow and would break the plan-interview arm and the doc stamps. It is live rather than theoretical — CONVENTIONS' own A MISS IS NOT A REFUTATION bullet carries hard-wrap-across-the-phrase as cause THREE and says the wrap point MOVES, and this anchor line is 70 columns of prose in the most-edited gotcha in the document. RESURFACES: the next app-agent dispatch. The cheapest arm is probably the whole fix and needs no mechanism: have the stamp asserts say what else could be true — or the sentence was reflowed and the stamp left the anchor's line, check the wrap before touching the const.
