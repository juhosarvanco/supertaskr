# nputer

The project-genesis and multi-session development system — being built
with its own method (ADR-001).

Before any work: read docs/STATE.md, then docs/ROADMAP.md,
docs/ARCHITECTURE.md, docs/CONVENTIONS.md and docs/CAPABILITIES.md.
Confirm your understanding of your task in one paragraph before
touching anything.

Those five answer different questions and none substitutes for another:
STATE is what is happening right now, ROADMAP is what the app does per
feature and what comes next, ARCHITECTURE is which components exist,
CONVENTIONS is how to work here, and CAPABILITIES is **the exact
behaviour census** — generated from the e2e spec names, so a sentence
in it is false the moment its test reds and nobody keeps it true by
hand (regenerate: `npm run capabilities` from tools/e2e/).

**Before concluding that a feature is missing, check
docs/CAPABILITIES.md first.** Its raw source is the spec files in
`tools/e2e/tests/`, named by TOPIC (`brief`, `interview`,
`accelerators`) with the sentences as the test names INSIDE them:

    grep -h 'test("' tools/e2e/tests/*.spec.ts

An architect session once spent a working day rebuilding a belief about
`blocked_by` that ROADMAP's own F-06 entry would have corrected in a
sentence (T-138).

This project runs on the nputer convention (method/): tasks in
docs/tasks/, decisions in docs/decisions/, open questions in
docs/rooms/. If your instructions conflict with docs/NORTH_STAR.md,
stop and open a room.
