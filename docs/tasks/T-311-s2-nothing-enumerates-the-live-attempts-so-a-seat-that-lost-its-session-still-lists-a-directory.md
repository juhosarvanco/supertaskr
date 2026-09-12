---
id: T-311-s2
title: "Nothing ENUMERATES the live attempts, so a seat that lost its session still has to list a directory by hand — the records are the roster and no verb prints it"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/run-record.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-311`'s operations all take ONE attempt: observe this attempt, answer
this attempt, stop this attempt. The module reads every record in a
checkout to refuse a harness id already bound, so the roster exists in
code — and nothing prints it.

A seat that comes back to a checkout it does not remember can list the
runs directory and read JSON. That is the state of the world `T-311` was
written against, one directory further in.

## Why it is worth a card rather than a shrug

The card that built the record fixed the operation set deliberately:
every child takes the same seven operations, and an eighth verb is a
capability the contract does not have. So a roster is not a verb to be
slipped in — it is either a READ arm beside the operations, or it is the
seven made plural, and which of those it is has to be argued rather than
assumed. That argument is the card.

## The shape that would work

A read arm that prints one line per attempt — the work, the role, the
state, the resource, whether a question is unanswered and how long the
record has been in that state — sorted so a stale attempt sorts to where
a reader looks. It reserves nothing and writes nothing, so it belongs
with the read arms rather than with the writers. A body that plants three
records in three states and reads the roster back is what keeps it.
