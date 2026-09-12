---
id: T-303-s1
title: "Codex sessions can claim checkout ownership without sharing another task's identity — the seat-taking arm derives a Codex session's identity from the codex process and its thread id, refuses a missing or malformed thread id without touching the holder record, and keeps every Claude identity and holder record compatible"
feature: F-03
milestone: 4
size: M
tier: standard
priority: 1
status: building
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

## Verdicts
