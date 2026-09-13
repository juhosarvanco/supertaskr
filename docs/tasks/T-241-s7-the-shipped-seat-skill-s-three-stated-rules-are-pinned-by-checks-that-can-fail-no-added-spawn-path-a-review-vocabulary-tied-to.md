---
id: T-241-s7
title: "The shipped seat skill's three stated rules are pinned by checks that can fail: no added spawn path, a review vocabulary tied to the task format, and a seat-mismatch rule with a named source and family reduction"
feature: F-04
milestone: 4
size: S
priority: 14
status: suggested
suggested_by: "the pile-2 sitting of 2026-09-13 (the owner's approval of 2026-09-13): T-241-s3, T-241-s4 and T-241-s5 folded; each source's full text is under its absorbed heading below"
blocked_by: []
touches: [method/skills, app/src-tauri/src/agent/kit.rs, tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review: independent
---

# T-241-s7 — the shipped seat skill's three stated rules, pinned

Absorbs: T-241-s3, T-241-s4, T-241-s5 (2026-09-13, the pile-2 sitting, the owner's approval of 2026-09-13). The three files are removed in the same commit as this line; their obligations sit in the criteria below tagged with their source, and each full text is kept under its absorbed heading.

## What was measured

At c9a6be65 the shipped SKILL.md carries its own legitimate indented commands — the invocations of its golden and host-command checks — and no dispatch or spawn construct; the mutant measured at 9f56d19 (an "if the arm is down, run the eight steps yourself" path) is caught by nothing; the quick path's review vocabulary is a hand copy of the task format's `review:` line; §6's seat-mismatch sentence names neither the assignment's source nor how a model family is reduced. The three sources' measurements are kept whole below. The task-format document (TASK-FORMAT.md under the method's tasks directory) is criterion 2's INPUT, read by the eval and degraded only on a copy; it is not in this card's write fence.

## Acceptance criteria

- WHEN SKILL.md is checked THE check SHALL reject an ADDED dispatch or spawn implementation — a fenced shell block, a `HOST>` marker, `git worktree add`, `claude -p`, `codex exec` or a background launch — as a third arm of host-command-check.mjs or a body beside the clauses test in kit.rs, with the positive control run against a COPY carrying the mutant measured at 9f56d19 and FAILING, and the negative control that the shipped file's own indented check invocations (the golden and host-command lines) PASS unchanged; the executor SHALL NOT remove those invocations to satisfy the checker. (absorbed from T-241-s3)
- WHEN the quick path's review vocabulary is checked THE values SHALL be tied to the task format's own `review:` line, either read at run time or by adding the pack as a third corpus to MF-05's comparison (the cheaper shape, where the other two vocabularies already meet), with the positive control run where the arming is absent: degrade the task format's line on a COPY and require the new body to catch it. (absorbed from T-241-s4)
- WHEN §6's seat-mismatch sentence is read THE pack SHALL name `verifier:` on the card as the assignment's source and state the family reduction once (the model id up to its first vehicle or context marker, `@` or `[`), both pinned in the clauses body with a control that separates a same-family, different-vehicle pair from a different-family pair. (absorbed from T-241-s5)

## Absorbed from T-241-s3 — Nothing catches a second spawn path ADDED to the seat skill — the prohibition is pinned as a presence, never as an absence (kept whole)

Title as filed: "Nothing catches a second spawn path ADDED to the seat skill — the prohibition is pinned as a presence, never as an absence"

Filed as: status suggested, priority 14, size S, touches [method/skills, app/src-tauri/src/agent/kit.rs], suggested_by verifier claude-opus-5@subagent (phase 2) @T-241.

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

### What to do (T-241-s3)

Add a check — either a third arm of `host-command-check.mjs` or a new body
beside the clauses test — asserting that `SKILL.md` carries no
command-shaped line: no fenced shell block, no `HOST>` marker, and none of
the spawn-shaped constructs above. Give it a positive control that FAILS
against a copy of `SKILL.md` carrying the mutant above, and run that control
rather than asserting it (`method/roles/verifier.md` 2b). The kill this buys
is the one the presence-pin cannot: a spawn path arriving as an addition.

### Why it is a suggestion and not a correction (T-241-s3)

The shipped bytes are clean today and the criterion's SHALL is satisfied by
them. This card buys the guard against the next edit, which is the same
argument the clauses test itself makes.

## Absorbed from T-241-s4 — The seat skill's review vocabulary is a hardcoded copy — degrading TASK-FORMAT's own line leaves the pack green, so a fourth value would arrive silently (kept whole)

Title as filed: "The seat skill's review vocabulary is a hardcoded copy — degrading TASK-FORMAT's own line leaves the pack green, so a fourth value would arrive silently"

Filed as: status suggested, priority 15, size S, touches [method/skills, tools/method-evals], suggested_by verifier claude-opus-5@subagent (phase 2) @T-241.

T-241's criterion 6 asks the quick path to use *"TASK-FORMAT's own values"*.
`method/skills/supertaskr-seat/SKILL.md` spells `same-model` and
`self-verified` and adds **"do not invent a fourth"**, and
`the_shipped_seat_skill_still_carries_its_three_load_bearing_clauses` pins
all three strings. The values are correct today.

**Measured at `9f56d19`, two-sided, by T-241's phase-2 verifier.**

- Change the PACK's value (`same-model` → `fast`): the clauses body reds.
- Change the ANCHOR — remove `self-verified` from
  `method/tasks/TASK-FORMAT.md`'s own `review:` vocabulary line: the pack's
  bodies stay **green**. `node tools/method-evals/run.mjs` does red, exit 1,
  but for a different arm — *"the review modes disagree: TASK-FORMAT has
  nothing extra, lib/parser/src/types.ts's REVIEW_MODES has [self-verified]
  the method does not"* (MF-05, comparing the method against the parser).

So the host tree cannot drift silently between TASK-FORMAT and `types.ts`,
and **the pack is tied to neither**. A fourth value added legitimately would
leave `SKILL.md`'s *"do not invent a fourth"* stale, and nothing in the tree
would say so.

### What to do (T-241-s4)

Either read the vocabulary out of `method/tasks/TASK-FORMAT.md` at run time
(the split `golden-check.mjs` already keeps with its golden: the file owns
the SET, the program owns the comparison), or add the pack to MF-05's
comparison as a third corpus. The second is cheaper and puts the answer
where the other two vocabularies already meet.

Run the positive control where the arming is absent: degrade TASK-FORMAT's
line on a COPY and require the new body to catch it, and record the
demonstration rather than asserting it.

## Absorbed from T-241-s5 — The seat-mismatch rule names no reduction from a model id to a model FAMILY and no source for the ASSIGNED model, so its condition cannot be evaluated mechanically (kept whole)

Title as filed: "The seat-mismatch rule names no reduction from a model id to a model FAMILY and no source for the ASSIGNED model, so its condition cannot be evaluated mechanically"

Filed as: status suggested, priority 16, size S, touches [method/skills], suggested_by verifier claude-opus-5@subagent (phase 2) @T-241.

T-241's criterion 8 is met in the shipped bytes:
`method/skills/supertaskr-seat/SKILL.md` §6 carries the sentence verbatim —
*verified by the builder's own model family, not an outside one* — framed as
provenance rather than a downgrade, and `references/golden-lane.md` FIELD
SET 4 carries `verdict.seatMismatch` as a conditional field that the golden
check resolves.

**What is thin is the CONDITION, not the sentence.** *"When the verifier
seat is not the assigned model"* has two inputs and the pack names neither:

- **the ASSIGNED model.** The card's `verifier:` field is the assignment,
  written at the stamp (`golden-lane.md` FIELD SET 1 says so), but §6 never
  points at it — a seat is left to infer where to read it from.
- **the FAMILY reduction.** T-169's mismatch is about a model *family*. An
  exact-string comparison answers wrongly in both directions: it calls
  `claude-opus-5@subagent` and `claude-opus-5[1m]` a MISMATCH when they are
  one family, and it would call two different vehicles of one model a match
  by accident rather than by rule. The pack states no reduction.

The sentence therefore fires by a seat's judgement rather than by a rule,
which is the shape `method/roles/verifier.md` warns about when it says a
criterion satisfied only by prose is unverified.

### What to do (T-241-s5)

Two sentences in §6: name `verifier:` on the card as the assignment's
source, and give the reduction — the family is the model id up to its first
vehicle or context marker (`@`, `[`), stated once so two seats reduce the
same way. Then pin both in the clauses body, and give the pin a control that
separates a same-family/different-vehicle pair from a different-family pair.

Measured at `9f56d19` by T-241's phase-2 verifier: this very card is
`review: independent` with builder and verifier both `claude-opus-5@subagent`,
so the sentence is owed on T-241's own verdict — and it is there, placed by
a seat reading the rule rather than by the rule deciding.

## Implementation notes

## Verdicts
