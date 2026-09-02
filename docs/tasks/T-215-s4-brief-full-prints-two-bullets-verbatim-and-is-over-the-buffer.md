---
id: T-215-s4
title: "`brief.mjs --full` prints the LANE PROTOCOL bullet and lane-protocol rule 4 VERBATIM — 22.5 KB of a 66 KB answer — so any correction to either pushes a triage view past the buffer, and the fix is not to shorten the rules"
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder:
verifier:
review: independent
---

**A GOVERNING RULE CANNOT BE CORRECTED WITHOUT A TRIAGE VIEW GOING OVER
ITS BUFFER, AND THAT IS THE VIEW'S PROBLEM RATHER THAN THE RULE'S.**
`T-215` had to state eight of `.claude/hooks/lane-fence.mjs`'s limits
where the page had stated four; the paragraph grew from **1,207 to 2,464
bytes**, and `brief.mjs --task <id> --full` went from **64,043** to
**66,265** against a 65,536-byte buffer.

## The measurement, at the refs it was taken at

Measured in the `T-215` lane, `Mac.lan`, node v22.22.0, 2026-09-02:

| arm | bytes | against 65,536 |
|---|---|---|
| `--full` at base `42520e3` | 64,043 | 1,493 under |
| `--full` at `T-215`'s tip | 66,265 | **729 OVER** |
| `--dispatch` at `T-215`'s tip | 95,569 | **30,033 OVER, already** |
| `--role executor` at `T-215`'s tip | 50,457 | 15,079 under |

**THE ARM THAT ACTUALLY STARTS A SESSION IS THE ONE WITH ROOM.** The
executor brief is 50 KB and never carried the lane bullet in full. The two
arms that overflow are triage views, and `--dispatch` has been over by
thirty kilobytes independently of this card — so the buffer is not a live
constraint on them today, which is exactly why nobody noticed the shape
below until a rule had to grow.

## Where the bytes are

Two lines of `--full`'s output are 22,485 of its 66,265 characters:

- `lane bullet in full:` — the whole `THE LANE PROTOCOL` bullet, **9,407
  characters on one line** (8,041 before this card)
- `never touch the integration branch:` — `method/lane-protocol.md` rule
  4, **13,078 characters on one line**

Both are printed VERBATIM because the brief contract says a row quotes
its source and a paraphrased rule has forked from the rule. That rule is
right. What follows from it is that the two longest governing passages in
the project are pasted whole into a view whose own header measures itself
against a fixed buffer — and the header does say so, printing *"OVER by
729 … a caller collecting into a fixed buffer of that size receives a
prefix with no error"*.

## What a fix decides

1. **Whether `--full` needs the bullets VERBATIM at all.** Its readers
   are seats triaging a card, not sessions being dispatched — the
   transcription rule binds the brief that puts a session to work, and
   `--full` is not it. A citation with a byte count and a path may be the
   whole answer.
2. **If it does, whether the answer should be PAGED** rather than
   truncated, so the disclosure the header already makes has a route out
   of it.
3. **What NOT to do**: shorten the rules to fit. `docs/CONVENTIONS.md`'s
   own budget rule says a hazard is never deleted to fit, and `T-215`
   already declined to drop a published limit for 700 bytes. A view that
   makes correcting a rule expensive will eventually be paid in
   uncorrected rules.

## Acceptance criteria

- `node tools/e2e/scripts/brief.mjs --task <any live card> --full` SHALL
  fit the buffer its own margin header measures against, or SHALL make
  the overflow recoverable rather than only disclosed.
- The arm that dispatches a session (`--role <role>`) SHALL keep printing
  every rule it quotes VERBATIM; nothing here touches the brief contract.
- A body SHALL fail if `--full` regains a verbatim whole-bullet row after
  the fix, so the shape cannot come back unnoticed.
- Verification: headless.
