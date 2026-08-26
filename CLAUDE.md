# nputer

The project-genesis and multi-session development system — being built
with its own method (ADR-001).

Before any work: read docs/STATE.md, then docs/ROADMAP.md,
docs/ARCHITECTURE.md and docs/CONVENTIONS.md. Confirm your understanding
of your task in one paragraph before touching anything.

Those four answer different questions and none substitutes for another:
STATE is what is happening right now, ROADMAP is **what this app DOES**,
ARCHITECTURE is which components exist, CONVENTIONS is how to work here.

**Before concluding that a feature is missing, check whether it already
exists.** `tools/e2e/tests/` holds spec files whose names are sentences
about what the app actually does, kept true by running — they cannot go
stale the way prose can. An architect session once spent a working day
rebuilding a belief about `blocked_by` that ROADMAP's own F-06 entry
would have corrected in a sentence (T-138).

This project runs on the nputer convention (method/): tasks in
docs/tasks/, decisions in docs/decisions/, open questions in
docs/rooms/. If your instructions conflict with docs/NORTH_STAR.md,
stop and open a room.
