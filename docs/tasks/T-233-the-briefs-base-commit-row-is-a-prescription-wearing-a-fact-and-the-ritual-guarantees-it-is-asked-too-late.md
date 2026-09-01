---
id: T-233
title: The brief's `base commit` row recomputes "newest Checkpoint" instead of deriving the lane's actual base — and the dispatch ritual guarantees the brief is assembled AFTER the cut, so the row is always derivable and can always be wrong
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-216-s1, which read the row as its own base; confirmed at the integration seat against the lane it was wrong about"
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE EXECUTOR READ ITS BRIEF'S `base commit` ROW AS THE BASE OF ITS
LANE. IT WAS NOT.** Measured on `T-216-s1`'s dispatch:

    brief row 4, "base commit:"                  06ca1c5
    git merge-base main task/T-216-s1-...        4551292

The row is derived — its own provenance stamp says so — but what it
derives is *"`git log --first-parent` main, newest Checkpoint"*, which is
a PRESCRIPTION about where a lane ought to be cut. The row is LABELLED
`base commit`, and row 5 then prints a `git worktree add … <that hash>`
create command beside it. **A seat reading its brief takes both as facts
about its own lane.**

## The ritual guarantees the row is asked too late to be a prescription

`docs/STATE.md` and `roles/orchestrator.md` 5b/5c put the steps in this
order:

    audit -> stamp -> cut lane AND bench -> brief -> preflight
      -> --write-fence -> read the manifest back -> launch

**The brief is assembled AFTER the worktree exists.** So by the time the
row is computed, the lane's real base is a one-command derivation and the
prescription is no longer the useful answer. This is not an edge case a
dispatcher can avoid by being careful — **the ordering makes it the
normal case**, and it will be wrong for every lane not cut from the
newest checkpoint.

## Cutting elsewhere is legal, which is what makes this bite

`lane-protocol.md` rule two blesses it in as many words: *"a later
non-merge commit on the same branch is equally safe PROVIDED its own
gates are green — a base is trusted for its green gates, not for being a
checkpoint."* `T-216-s1` was cut from `4551292` with all four suites
measured GREEN at that commit first, which obeys the rule's reason.

**So the brief and the protocol disagree about a lane the protocol
permits**, and the brief is the document the executor holds.

## Why it survived until now

The dispatcher's covering message named the real base, so the executor
had two answers and reported the conflict rather than acting on the wrong
one. **That is a seat catching a document defect, not a document
working.** The next lane's brief carries the same row and the next
covering message may not contradict it.

## Acceptance criteria

- WHERE the lane worktree named on the command line already exists, the
  brief's `base commit` row SHALL be derived from that lane
  (`git merge-base` against the integration branch), not from the newest
  `Checkpoint:` commit.
- WHERE the lane does not yet exist, the row SHALL remain the
  prescription it is today and SHALL SAY SO in its label or its
  provenance, so the two cases are distinguishable by a reader.
- A body SHALL demonstrate the defect before the fix: a lane cut from a
  legal non-checkpoint base, and a brief whose row names a different
  commit. **A body exercising only a lane cut from the newest checkpoint
  is degenerate against this card — the two answers coincide there — and
  SHALL be treated as absent.**
- The `create:` command row SHALL NOT print a `git worktree add` for a
  worktree that already exists, or SHALL be shown to be harmless when it
  does.
- Verification: headless.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Holds at 1cd2c8d, and it bit tonight**: the base row derives the newest
`Checkpoint:` commit, which is 43e776a — a commit whose own e2e battery
was RED (inherited from the retired seat, repaired at 85dda6d) — so
tonight's lanes are cut from the green tip and the covering message
overrides the row. A live instance, recorded here rather than filed.
