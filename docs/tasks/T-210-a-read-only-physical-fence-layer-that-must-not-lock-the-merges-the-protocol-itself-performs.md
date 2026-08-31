---
id: T-210
title: A read-only physical fence layer catches the bash hole a PreToolUse hook provably cannot — and as first proposed it EACCES-fails the checkpoint sync the same design depends on
feature: F-06
milestone: 4
priority: 3
size: M
status: planned
blocked_by: [T-212]
touches: [tools/e2e, method/lane-protocol.md]
suggested_by: "peer session nputer-10's enforcement stack (relayed 2026-08-31, approved in direction by @human); the self-violation found by this seat's flag and then sharpened by nputer-10 into the event list below"
builder:
review: independent
---

**THE HOLE IS REAL AND ALREADY PROVEN UNPARSEABLE.** A PreToolUse hook
sees a Bash command as a string. `T-025-s4` established that deciding
what an arbitrary shell command will write is not a parsing problem this
project will win. So a lane can write outside its fence through bash, a
script, or a build tool, and the hook cannot know.

**A read-only tracked file answers mechanically what no parser can.**
`chmod` the out-of-fence tracked files in a lane worktree and a stray
write fails with `EACCES` — from the filesystem, needing no intent
analysis, covering every writer equally.

## AND AS FIRST PROPOSED IT BREAKS THE PROTOCOL THAT PROPOSED IT

This seat flagged the layer against git generally: checkout, merge and
stash all write tracked files, so a lane switching base could take an
`EACCES` from the guard rather than from a real breach — **a guard that
reds honest work.**

`nputer-10` then found the sharp instance, which is not a general worry
but a **self-violation**:

**The checkpoint sync (fast path B) IS a git merge writing tracked files,
and the files it most needs to write are EXACTLY the ones chmod locked.**
B's landed changes are by definition outside A's pre-widening fence —
that is what makes the sync necessary. So the physical layer would
`EACCES`-fail the very fast path the enforcement stack is built to
enable.

**Layer (a), the landing gate, carries correctness alone in the
meantime**, which is why the stack ordered it first and why this card is
`blocked_by: [T-212]` rather than racing it. (At filing this pointed at
`T-203`, which was to be amended to carry the gate; the gate is `T-212`
now, split out so the token gate stays dispatch-ready — the blocker
points at the thing itself.)

## The event list — what re-chmods, and when

The self-violation is what gives this card a spec instead of a wish:

1. **APPLY at `--write-fence`**, from the manifest just written.
2. **RE-APPLY after any fence widening.** The re-expand already rewrites
   the manifest — same moment, one event, no second trigger to forget.
3. **DROP ENTIRELY around a checkpoint sync**, and re-apply from the
   POST-widening manifest once the merge commit exists. Not a narrowing,
   not an exception list — the layer is off for the duration of a merge
   the protocol itself performs.
4. **CLEANUP IS WORKTREE REMOVAL.** Nothing needs sweeping at abandonment
   if removal is the event. `git worktree remove --force` does not care
   about mode bits; **a plain `remove` of a dirty tree might**, and that
   is a control this card owes, not an assumption it may make.

## What this layer does NOT cover, stated so it is not oversold

**A lane writing ANOTHER lane's worktree never appears in its own diff**,
so the landing gate cannot see it. That is the vector this layer covers
and the gate does not. Conversely the gate covers what this layer cannot:
content that lands through a path where mode bits were legitimately
dropped. **The layers cover each other's blind spots, and neither is
sufficient alone** — say so in the artifact, because a guard trusted
further than it measures is this project's most repeated defect.

## Acceptance criteria

- OUT-OF-FENCE tracked files in a lane worktree SHALL be read-only after
  `--write-fence`, and in-fence files SHALL remain writable.
- **A POSITIVE CONTROL SHALL prove an in-fence write still SUCCEEDS.** A
  layer that locks everything is indistinguishable from one that works.
- A BASH write outside the fence SHALL fail with `EACCES` — the case the
  hook provably cannot decide, and the reason this layer exists.
- **THE CHECKPOINT SYNC SHALL SUCCEED with the layer active**, proved by
  a body that arms the layer, performs a sync writing a previously
  out-of-fence file, and asserts the merge commit exists. Without this
  body the card ships the defect it was filed to fix.
- WORKTREE REMOVAL SHALL leave no read-only residue, with a control for
  the dirty-tree `remove` case named above.
- THE artifact SHALL state which vector each layer covers and which it
  does not.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Read beside

`T-212` (the landing gate, which carries correctness until this lands and
which this card is blocked on), `T-203` (the token gate on the same
hook), `T-209` (the dispatch guard, same manifest), `T-199` (the UX
layer — the real-time refusal), `T-025-s4` (which established the bash
string as unparseable), and `method/lane-protocol.md:182`.

## A note on provenance

The enforcement stack came from peer session `nputer-10` with @human
driving the fast paths and the can-a-breach-be-made-impossible framing.
**The self-violation was found by flagging the proposal rather than
accepting it**, and then sharpened by the proposing seat into the event
list above. Recorded because a design that survives its own author's
attack is worth more than one that arrives approved.
