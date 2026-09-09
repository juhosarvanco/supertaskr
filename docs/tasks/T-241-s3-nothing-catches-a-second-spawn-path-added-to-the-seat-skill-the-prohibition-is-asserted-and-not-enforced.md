---
id: T-241-s3
title: Nothing catches a second spawn path ADDED to the seat skill — the prohibition is pinned as a presence, never as an absence
feature: F-04
milestone: 4
size: S
priority: 14
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2) @T-241
blocked_by: []
touches: [method/skills, app/src-tauri/src/agent/kit.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-241's criterion 5 is *no second spawn path*, and the shipped pack keeps it:
`method/skills/supertaskr-seat/` carries exactly ONE dispatch spelling
(`node tools/e2e/scripts/brief.mjs --dispatch-lane …`, in
`references/host-commands.md`), no `claude -p`, no `codex exec`, no
`worktree add`, no background launch. `the_shipped_seat_skill_still_carries_
its_three_load_bearing_clauses` pins the refusal's PRESENCE.

**Measured at `9f56d19` by T-241's phase-2 verifier.** A mutant that ADDS a
second spawn path to `SKILL.md` — a fallback reading *"IF THE ARM IS DOWN,
RUN THE EIGHT STEPS YOURSELF"* followed by `git worktree add`, `claude -p`
and `codex exec` — trips **nothing**: `cargo test` on the kit bodies exit 0,
`host-command-check.mjs --repo .` exit 0, `golden-check.mjs --selftest`
exit 0. The clauses body asserts what the file SAYS and cannot see what the
file GAINS.

**The property is already stated and is mechanically decidable.** `SKILL.md`
opens with *"THIS FILE IS THE ORDER AND THE REFUSALS. IT IS NOT THE
SPELLINGS"*, and `references/host-commands.md` closes with *"Anything the
arm performs. The eight steps have one implementation."* Both are absence
claims about a file, which is the shape a check can hold.

## What to do

Add a check — either a third arm of `host-command-check.mjs` or a new body
beside the clauses test — asserting that `SKILL.md` carries no
command-shaped line: no fenced shell block, no `HOST>` marker, and none of
the spawn-shaped constructs above. Give it a positive control that FAILS
against a copy of `SKILL.md` carrying the mutant above, and run that control
rather than asserting it (`method/roles/verifier.md` 2b). The kill this buys
is the one the presence-pin cannot: a spawn path arriving as an addition.

## Why it is a suggestion and not a correction

The shipped bytes are clean today and the criterion's SHALL is satisfied by
them. This card buys the guard against the next edit, which is the same
argument the clauses test itself makes.
