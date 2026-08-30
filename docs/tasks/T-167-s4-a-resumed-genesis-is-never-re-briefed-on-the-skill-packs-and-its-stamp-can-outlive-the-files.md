---
id: T-167-s4
title: A resumed genesis is never re-briefed on the organization's skill packs, and its stamp records what the FIRST turn was given — deliberate at T-167, and a decision nobody has made
feature: F-03
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED BY T-167's LANE AT THE EDGE OF ITS OWN SCOPE.** That card is
"genesis only, no per-stage slots, no UI" and its criterion says the
KICKOFF carries the packs. Two neighbouring behaviours follow from that
and neither was ruled; both are cheap to change and cheap to leave, so
they should be decided rather than discovered.

## What the code does today

`app/src-tauri/src/agent/mod.rs`:

- `start_genesis` and `fresh_genesis` call `report_skills` once,
  brief the planner with the discovered packs, and stamp them into the
  new `SessionEntry.skills`.
- `resume_genesis` sends `kit::assemble_resume_nudge`, which is
  deliberately SHORT — the CLI's own session already carries the whole
  conversation, so re-sending a kickoff would re-brief a briefed
  planner. It names no packs.
- `spawn_turn`'s completion path carries the previous entry's `skills`
  forward rather than re-discovering, so the stamp records **what this
  session was briefed with**, not what is on disk now.

## The two open questions

1. **Should a RESUMED native session be re-briefed on the packs?** The
   argument for not: the session was briefed at turn 1 and the nudge's
   whole design is that it adds nothing already carried. The argument
   for: a long session may have been compacted — which the nudge itself
   acknowledges, since it names the resume rule for exactly that case —
   and org policy is precisely the thing you do not want quietly falling
   out of a compacted context. A middle form exists: name the packs in
   the nudge only when the session was compacted, which nothing can
   currently detect, or name them always in one short clause.

2. **Should the stamp be REFRESHED when a pack changes under a live
   session?** Today it is not, on purpose: re-reading the folder
   mid-session would silently rewrite the provenance of turns that were
   briefed under the old bytes, and "which policy shaped this decision"
   would then answer with a policy that arrived afterwards. The
   alternative is to APPEND rather than replace — a second stamp with its
   own hash and the turn it took effect at — which is strictly more
   information and strictly more schema. Note that `T-167-s1` is already
   open on the schema question, so the two want deciding together.

## What would make either question urgent

Neither is urgent while genesis is the only consumer. Both become
load-bearing the moment the room's Stage-2 sentence is built out — packs
in spec-writing sessions and in the seats' briefs
(`docs/rooms/loop-customization.md`, design seed 1: *"seat briefs name
which skills were active"*), because a brief that names a stale pack set
is worse than one that names none.

## The cheap half, if only one is taken

Question 1 is a one-clause change to `assemble_resume_nudge` and one
integration body in `tests/agent_runner.rs` beside the T-167 guards.
Question 2 needs the schema answer first.
