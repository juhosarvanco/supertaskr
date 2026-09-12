---
id: T-303-s1
title: "Codex sessions can claim checkout ownership without sharing another task's identity — the seat-taking arm derives a Codex session's identity from the codex process and its thread id, refuses a missing or malformed thread id without touching the holder record, and keeps every Claude identity and holder record compatible"
feature: F-03
milestone: 4
size: M
tier: standard
priority: 1
status: verifying
suggested_by: "the Codex orchestrator's recovery sitting (2026-09-11): the seat-taking arm refused a real Codex ancestry because sessionIdentity recognised Claude only, and a Codex desktop task's nearest harness ancestor is one app-server process shared by every task on the machine; built and approved in the recovery clone at its commit 2ab710fa and reused here as a patch (sha256 51dffca9fbbd7e6e7c3235e9ebfa87fb36e8d0bfc78c4f7ab499f465e89c9a92), to be judged on this bench"
blocked_by: []
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The seat-taking arm (`brief.mjs --take-seat` and `--release-seat`) derives who is asking from the process ancestry: `sessionIdentity` in checkout-currency.mjs walks up to a process whose program is `claude`, or a Node process running the Claude CLI, and records its pid and start time. A Codex session has no such ancestor. Its nearest harness process is a `codex` app-server that every Codex task on the machine shares, so the pid alone would make different tasks compare as one owner, and the arm answers COULD NOT RUN. The recovery sitting of 2026-09-11 measured on this host that a Codex task exposes its own logical id as `CODEX_THREAD_ID`, a UUID, while `CODEX_SESSION_ID` belongs to the parent session and is inherited by a subagent; the thread id is therefore the identity and the session id is never a fallback.

The recovery clone's implementation, its commit 2ab710fa, passed the whole battery there and received an independent verdict there. Neither is this card's evidence: the code re-enters this repository as a patch the executor applies and re-derives, and this lane's bench judges it.

Under the owner's ruling of 2026-09-12 no Codex session writes to this repository until a write-time fence exists for it, so the consumer of this card today is the loop's own Claude seat: the same patch tightens the Claude matcher (the Node form must be the executable itself, never an argument that mentions the package) and makes `--take-seat` refuse an unreadable holder record instead of replacing it, which changes the remedy T-238-s1 recorded.

## Acceptance criteria

- WHEN a supported Codex CLI or desktop task claims a checkout THE identity SHALL distinguish its logical task as well as the live process incarnation; two tasks sharing an app-server SHALL never compare as the same owner.
- WHEN CODEX_THREAD_ID is absent or malformed THE Codex identity SHALL be refused with an actionable diagnostic, without creating or releasing a holder record; CODEX_SESSION_ID SHALL NOT substitute for it. A valid distinct subagent thread SHALL remain identifiable when its inherited session ID differs.
- WHEN an existing Claude session uses the ownership commands THE current valid identity and holder records SHALL remain compatible, and unrelated executables or arguments mentioning a harness SHALL not identify a session.
- WHEN holder records are written and read THE logical identity SHALL survive the round trip, invalid records SHALL fail closed, and a different task SHALL be unable to release a live holder; focused bodies SHALL prove both acceptance and refusal.

## Implementation contract

- The executor starts from the recovery patch the seat exported to the scratch directory as `t303-s1-recovery.patch` (its sha256 is in the frontmatter), applies it in the lane with `git apply`, and then re-derives every criterion against the tree as if the code were its own. What the re-derivation finds wrong it changes, and the notes say what and why.
- The fence is the three files named in `touches:`. `brief.mjs` is in it because the arm's acquisition path otherwise proceeds from an unreadable holder record to a write; no other file is granted.
- A `CODEX_THREAD_ID` value is never echoed into a diagnostic, and appears in a holder record only inside its identity block.
- The integration seat proposes the exact dated amendment to T-238-s1 for the owner's approval and appends it during integration through the existing records process. The executor does not edit T-238-s1; its implementation notes identify the changed unreadable-holder remedy.
- The recovery verdict, its commit 330f43c7, may be read by the seat when dispatching; it is not shown to this lane's phase-two verifier before its own judgement is written.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before the code was read

Restated in my own words, one line each, from the card alone and before
the recovery patch was applied to this lane:

1. A Codex task's identity carries a LOGICAL id as well as the live pid
   and start time, so two tasks hanging off one shared app-server
   process never compare equal.
2. A missing or malformed thread id refuses the Codex identity with a
   diagnostic a reader can act on, writes and removes no holder record,
   and never falls back to the session id; two subagent threads under
   one session id stay distinguishable.
3. A Claude session's identity and every holder record it already wrote
   keep working unchanged, and a program that merely mentions a harness
   in its arguments identifies no session.
4. The logical id survives write then read of a holder record, a record
   of the wrong shape fails closed rather than reading as vacant or as
   a live holder, a different task cannot release a live holder, and
   bodies prove the yes and the no of each.

### How the patch entered, and what it is evidence of

The recovery patch was verified by its sha256 before anything else,
applied with `git apply` on the dispatch stamp, and then read as a diff
rather than as a result. The recovery clone's own battery and its own
verdict are named in the card and are not cited here: what follows is
this lane's re-derivation against this tree, and the corrections below
are the places where that re-derivation disagreed with what arrived.

### What the re-derivation changed

- **A sentence the patch broke in half.** The unreadable-record refusal
  in the seat arm prints three note lines. The middle line was reworded
  from "removing it would" to "replacing or removing it would" and the
  words "retire an" were lost with the old wording, leaving the arm
  printing "replacing or removing it would / unread claim and destroy
  the only evidence of whose it was." No body asserts that line, so
  nothing was red; the words are restored.
- **A branch no body can reach any more, said out loud.** The arm now
  derives the acting identity BEFORE it branches, and refuses with
  CANNOT_RUN when that derivation failed. That precondition is the only
  way the holder verdict ever returned its underivable code, so the
  later live-record branch is now unreachable. It is kept as the catch
  if the precondition is ever relaxed, and it now carries a comment
  saying no body reaches it, because a branch that reads as live
  coverage and is not is worse than no branch.
- **A missing body for the card's own opening sentence.** Every arriving
  body that proves two tasks sharing an app-server are told apart proves
  it at the comparison function or at the verdict. None proved it at the
  ownership commands, which is where the sentence is spent. A new body
  drives both commands through a process table where every invocation
  lands on ONE invented ancestor with ONE start time, so the process
  incarnation is identical by construction and the logical task is the
  only thing left that can separate them: one task takes the seat, the
  other is refused BOTH the takeover and the release with the record
  preserved byte for byte, and the task that took it releases it as the
  positive control.
- **Two header repairs.** The process-row reader had prose wedged
  between its parameter and return tags; it moves above them and now
  says WHY the executable is a second read rather than a wider column
  list — an executable value on this platform can itself hold spaces, so
  a single row carrying both has no parseable boundary. The Codex
  predicate's command argument is accepted and never read, which now
  says so in its header rather than reading as an oversight.

### The criteria, with what answers each

1. **Logical task as well as process incarnation.** The identity walk
   returns the nearest ancestor whose EXECUTABLE basename is the Codex
   one, and attaches the validated thread UUID to the pid and start time
   it already carried. The comparison is all four fields, so two tasks
   on one app-server row differ. Proved at the comparison, at the
   verdict, and now at the commands themselves.
2. **A missing or malformed thread refuses, touches no record, and the
   parent session id never substitutes.** The thread source is read
   once, checked against a canonical UUID shape, and refused otherwise;
   the refusal names the variable and never its value. The commands
   derive the identity before any branch that writes or removes, so a
   refusal returns CANNOT_RUN with nothing created and nothing removed,
   measured against a vacant seat, a dead record, a live record and an
   unreadable one. A subagent with its own valid thread is accepted
   whatever the inherited session context says, including a malformed
   one and an absent one.
3. **Claude sessions and their records stay compatible.** The native arm
   is unchanged in effect: the executable basename is the harness name.
   The interpreter arm now requires the executable itself to be the
   interpreter before it will read an argument at all, so a program that
   merely mentions the package in a positional argument, and every
   option-leading form, identifies nothing. Records with no logical
   identity read and write exactly as before, and every neighbouring
   suite that drives the seat arm under a fake harness stays green.
4. **The round trip, the closed failures and the refused release.** The
   logical identity is canonicalised at the write and at the read, so it
   survives; a record carrying half of it, or a provider this reader
   does not know, or a task id that is not a UUID, is refused rather
   than read as a legacy record; and the release refusal is proved end
   to end against a live holder belonging to another task on the same
   process. Every one of those has its positive control in the same
   fixture.

### What the record this changes, which this lane did not edit

`--take-seat` used to write over a record whose shape it could not read.
It now refuses, and that retires the remedy T-238-s1 recorded for that
state. Two places rest on the old one and both are the seat's to amend
at integration through the records process, not this lane's to touch:

- T-238-s1's item about the sibling arm states that the documented
  remedy is unchanged because re-taking the seat still does exactly
  what the verdict's sentence says. That sentence is now false.
- T-238-s4 is a live suggested card whose whole subject is that
  `--take-seat` replaces an unreadable record without announcing it, and
  whose premise is that re-taking is the right remedy. The replacement
  is gone, so the card is moot; its fence is a subset of this one.

The verdict's own sentence for the unreadable state was changed with the
behaviour it described, and the arm's finding now says the same thing:
inspect the record, then repair or delete it only once its claim is
established as retired.

### In-fence follow-through

- The broken refusal sentence, one line moved, restoring the property
  that the arm's own explanation of what it refused is a sentence.
- The unreachable-branch comment, eight lines added, restoring the
  property that a reader can tell live coverage from a kept fallback.

### Measured here, at this lane's own tip

- The executable is a SECOND process read per ancestor rather than a
  wider column list. Cost at the walk's own bound of twenty-four hops,
  measured on this host: thirty-three milliseconds for one read per hop
  against fifty-six for two. The walk is bounded and the verdict reaches
  it only when a record is present and parsed, so this is disclosed
  rather than optimised.
- The behaviour census goes stale on this diff: test titles changed and
  two were renamed, and the generated capability list carries them. That
  regeneration belongs to the merge commit by this project's own
  standing rule, and the generated documents are outside this fence, so
  nothing here regenerates them. The integrator owes
  `npm run capabilities` in the merge commit, which also refreshes the
  generated index.
- No ask file was written. Everything the re-derivation wanted to change
  was inside the armed fence, and the two things outside it are the
  merge's regeneration and the seat's records act, both already assigned
  elsewhere.

### For the verifier

- The interpreter arm reaches the FILESYSTEM to disambiguate a flattened
  spaced entrypoint. That is a new surface inside a predicate a guard
  calls, it is reached only after every cheaper refusal, and it is the
  subject of a suggested card that proposes reading the true argument
  vector instead.
- The refusal exit for a session that cannot name itself moved for one
  case: a release asked of a VACANT integration checkout used to be a
  clean nothing and is now an inability. That is the price of deriving
  the identity before the branch, it is the fail-closed direction, and
  it is the subject of the other suggested card.

## Verdicts
