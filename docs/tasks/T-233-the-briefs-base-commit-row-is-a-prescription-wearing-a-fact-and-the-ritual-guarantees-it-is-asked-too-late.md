---
id: T-233
title: The brief's `base commit` row recomputes "newest Checkpoint" instead of deriving the lane's actual base — and the dispatch ritual guarantees the brief is assembled AFTER the cut, so the row is always derivable and can always be wrong
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
suggested_by: "executor claude-opus-5@subagent @T-216-s1, which read the row as its own base; confirmed at the integration seat against the lane it was wrong about"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-296-s7 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews), and re-triaged the same day against T-300-s7 (landed at e528a5d5): the criteria as filed move whole into the History section with the dated discharge and supersession account, and the canonical section below carries only the surviving work.

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

## History — the criteria as filed on 2026-09-02, with the discharge and supersession of 2026-09-14 (superseded; the instruments read only the canonical section below)

Discharge of 2026-09-14: the bullets below on the base derived from the lane's merge-base, the no-lane case saying so, and the demonstrating body landed at e528a5d5 — laneCutCommit is the merge-base, baseVerdict separates the cut from the anchor including the no-new-stamp case, and the arm is driven end to end by bodies in brief.spec.ts; the landed bodies are the evidence, not a census over prose. The create-row bullet survives and is restated in the canonical section. T-296-s7's lane-facts criterion is SPLIT: its live-lane half (the row gives the base as the dispatch stamp the arm committed and names its derivation) landed at e528a5d5; its no-lane half (that the row say which commit a cut would start from and why) is SUPERSEDED as a requirement amendment and not as proof the former words landed — with no lane cut the row reports the checkpoint anchor and labels it as the rule's anchor, never as a prediction of a cut and never a manufactured stamp, and that landed behaviour stands. The child's own criteria are kept verbatim under the absorbed record.

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

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.

## Acceptance criteria

- The `create:` command row SHALL NOT print a `git worktree add` for a worktree that already exists, or SHALL be shown to be harmless when it does. (the surviving requirement as filed on 2026-09-02)
- WHEN docs/CONVENTIONS.md's dispatch bullet is read THE explanation SHALL distinguish the actual cut commit and its derivation from the checkpoint anchor: a stamp may create a commit before the cut; if no stamp commit is written, the explanation still names the actual cut without inventing a stamp; with no lane cut, the checkpoint is labelled as the rule's anchor and not as a prediction of a future cut; a body in brief.spec.ts SHALL red when the row's base and the worktree's `git rev-parse HEAD` at the cut disagree on a fixture. (absorbed from T-296-s7 and reworded per the reviews of 2026-09-14; the landed fixtures of e528a5d5 are the reference and are not commissioned again)
- Verification: headless.

## Absorbed from T-296-s7 — The brief's lane-facts row gives the base as the newest checkpoint commit while the arm cuts the lane at the dispatch stamp — the row reads a rule the arm superseded, and every lane since T-239 has been handed a base its own worktree contradicts (kept whole)

Title as filed: "The brief's lane-facts row gives the base as the newest checkpoint commit while the arm cuts the lane at the dispatch stamp — the row reads a rule the arm superseded, and every lane since T-239 has been handed a base its own worktree contradicts"

Filed as: status suggested, priority 2, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md], wake None, suggested_by "the seat (2026-09-10): the T-296 executor's report named row 4's base as the newest Checkpoint (1b255d1c) while the lane was cut at the dispatch stamp (9dc05597); the lane trusted git rev-parse and said so".

### What was measured (T-296-s7)

The dispatch brief's lane-facts row derives its base commit from `git log --first-parent` on the integration branch, taking the newest commit whose subject opens with `Checkpoint:` — the DISPATCH FROM THE LAST CHECKPOINT bullet in docs/CONVENTIONS.md. Since T-239 the arm cuts the lane at the DISPATCH STAMP it commits in its own step, and the seat's facts and the fence manifest name that stamp as the base. At the T-296 dispatch the row said the rename-sitting checkpoint and the worktree said the stamp, and the executor reported the disagreement rather than acting on it. A lane that trusted the row would diff from the wrong base and hand its verifier a range that carries other cards' merges.

### T-296-s7's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the brief is assembled for a lane the arm cut THE lane-facts row SHALL give the base as the dispatch stamp the arm committed — the commit the worktree was created at — and SHALL name its derivation; WHEN no lane exists yet (the `--task` form before a cut) THE row SHALL say which commit a cut WOULD start from and why.
- WHEN docs/CONVENTIONS.md's dispatch bullet is read THE rule SHALL say that the arm cuts at its own stamp and that the checkpoint rule describes the seat's timing of dispatches, not the commit the row reports; a body in brief.spec.ts SHALL red when the row's base and the worktree's `git rev-parse HEAD` at the cut disagree on a fixture.

### T-296-s7's Implementation notes (as filed, empty)
<!-- executor appends before finishing -->

### T-296-s7's Verdicts (as filed, empty)

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
