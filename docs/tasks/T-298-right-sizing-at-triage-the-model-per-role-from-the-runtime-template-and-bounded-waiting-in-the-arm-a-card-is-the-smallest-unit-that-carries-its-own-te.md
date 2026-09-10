---
id: T-298
title: Right-sizing at triage, the model per role from the runtime template, and bounded waiting in the arm — a card is the smallest unit that carries its own test cycle; every dispatch names its model from the template's role defaults (Opus 5 by default, the user's to change); the arm's waits are marker-driven with a ceiling
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/roles/orchestrator.md, method/runtime/supertaskr.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Superpowers' measured run put all 26 reviewers on the top tier because one dispatch named no model, and two-thirds of its wait calls were short polls that timed out; our dispatches name models by hand and our waits are hand-typed sleeps.

## Acceptance criteria

- WHEN a card is triaged THE orchestrator's rule SHALL be stated once: a card is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate, and a card larger than that is split before dispatch.
- WHEN the arm dispatches any seat THE model SHALL be read from the runtime template's role defaults and printed in the brief; an absent default SHALL refuse the dispatch, never inherit the session's model; the template's defaults SHALL read Opus 5 for every role.
- WHEN the arm waits on a lane, a bench or a battery THE wait SHALL be on a marker file or a pid with a stated ceiling, and a body SHALL show the ceiling reached reported rather than hung.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before a line of the implementation

Three criteria, restated in my own words, one line each:

1. Right-sizing is a TRIAGE rule and it is stated ONCE, in the
   orchestrator's triage step: the smallest unit that carries its own
   test cycle and is worth a fresh reviewer's gate is what a card is,
   and anything bigger is split before it is dispatched.
2. Every dispatch resolves each seat's model from the runtime template's
   role defaults, prints it in the brief, and REFUSES when the template
   names no default for a role the dispatch is filling; the session's own
   model is never the fallback. The template reads Opus 5 for every role.
3. Every wait the arm performs is on a marker file or on a pid, carries a
   ceiling it states out loud, and REPORTS the ceiling reached instead of
   hanging on it. A body drives the ceiling and reads the report.

### What was built, criterion by criterion

**Criterion 1 — right-sizing is a triage rule, stated once.**
`method/roles/orchestrator.md` step 2 now carries it: a card is the
smallest unit that carries its own test cycle and is worth a fresh
reviewer's gate; anything larger is split before dispatch and anything
smaller is absorbed into the card it belongs to. It is written as a
MECHANICAL test rather than a taste — name the test cycle the card would
owe, and if naming it needs the word *and*, it is two cards — and it
carries the inverse defect too, because a finding whose remedy sits
inside a fence somebody already holds is a follow-through rather than a
card. The step is the only place in the file that says it; a body counts
the occurrences rather than merely finding one, so a second copy reds.

**Criterion 2 — the model per role comes from the runtime template.**
`method/runtime/supertaskr.yaml` now reads Opus 5 for every one of its
five roles, with a header saying the arm reads them, that a role with no
default refuses, and that the values are the user's to change. The arm
resolves them in `dispatchLanePlan`, which is PURE — so an absent default
refuses before a card is stamped or a worktree is cut, and a body proves
the refused dispatch left the fixture tree byte for byte as it found it.
The model is printed in two places: row 1 of the brief, beside the role
it belongs to, saying which file and which key it was read from; and in
the dispatch's own lane facts, once per seat. The two seat dials still
work and are now an announced OVERRIDE — the template's default is
reported beside the value that won, because a reader shown only the
winner cannot tell a dispatch that took the project's default from one
that departed from it.

**A note on the strictness, because it is a reading of the criterion.**
The template is consulted whether or not a dial was passed. The criterion
says an absent default refuses, and that is a statement about the
template rather than about the invocation: a dial cannot make a missing
default present, and a project whose template has lost a role should hear
about it at the next dispatch rather than at the one that happens to omit
a flag.

**Criterion 3 — the bounded wait.** A new arm on the brief command:
`--await <marker>` or `--await-pid <pid>`, each requiring
`--ceiling <seconds>`. It waits on a FACT rather than on a duration, asks
before it sleeps so a fact already true costs no interval, never sleeps
past the ceiling it stated, and when the ceiling arrives it REPORTS —
naming what it waited for, how long, how many times it asked, and that
nothing was signalled and nothing taken away — with exit 1 beside the
report so a caller reading only the exit still learns the difference. A
missing ceiling is refused at usage rather than defaulted, because a
ceiling nobody typed is a hang nobody chose. The liveness probe is the
process table by way of the checkout-currency reader, which is this
project's own ruling: the obvious probe was measured wrong here in three
separate ways, and the process group and the broadcast pid are refused at
the plan.

The clock, the sleep and the question are injected, so the bodies drive
the ceiling in their own synthetic time. A body that waited on real time
would either take its own ceiling to red or assert nothing.

`method/roles/orchestrator.md` gains step 5f for the rule.

### The out-of-fence need, asked at the start and granted

The wait is only reachable from a shell as a flag, and `brief-flush`'s
arm-list body derives the command's frozen flag set and reds by name on
any flag that is neither driven by an arm nor excused with a reason. That
file was outside the fence, so the ask went out before the first line of
code with the three entries written verbatim, and the build carried on
around it. The grant arrived as two agreeing files in this lane — the
fence manifest and this card's own touches line — and was read off disk
rather than off the reply. The three flags are excused as a WAITER and
its modifier: an arm that BLOCKS is the one arm a size guard must never
drive.

### What I would flag for the verifier

- The strict reading of criterion 2 above: the template is read even when
  a dial names a model. If that is wrong, the repair is one branch.
- The arm's own CHILD PROCESSES still have no ceiling of any kind — the
  keeper leg at the base is a whole suite run through a synchronous spawn
  with every option set except the one that would bound it. That is filed
  as T-298-s2 rather than performed, because closing it adds a property no
  existing body measures.
- `docs/CAPABILITIES.md` is stale against this lane: nine new bodies in
  `brief.spec.ts` are nine new census lines. The regeneration is the arm's
  at the merge (ADR-024 decision 3), and no gate in this lane's own owed
  set reads it.
- Two method sentences point at `docs/CONVENTIONS.md` for the wait's
  spelling and that bullet does not exist yet; T-298-s1 carries it, with
  the command and its four exits measured in this lane.

### Suggested cards filed

- **T-298-s1** — the conventions bullet and the standing-state line the
  method text now points at. The pointer landed; its target did not,
  because that file sat inside another live lane's fence.
- **T-298-s2** — the arm's own subprocess waits carry no ceiling at all,
  and the keeper leg at the base is the one that pays for it.

## Verdicts
