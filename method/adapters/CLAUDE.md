<!-- Thin adapter — copy to repo root. Facts and routing only; behavioral
     instructions live in the role prompt you are dispatched with. -->

# <project name>

<One sentence: what this repo is.>

Before any work: read docs/STATE.md, then docs/ROADMAP.md,
docs/ARCHITECTURE.md, docs/CONVENTIONS.md and — once this project
generates it — docs/CAPABILITIES.md. Confirm your understanding of
your task in one paragraph before touching anything.

Those documents answer different questions and none substitutes for
another: STATE is what is happening right now, ROADMAP is what the
product does per feature and what comes next, ARCHITECTURE is which
components exist, CONVENTIONS is how to work here, and CAPABILITIES is
**the exact behaviour census** — GENERATED from the project's own
executable record, so a sentence in it is false the moment its test
reds and nobody keeps it true by hand. All are governed by
method/docs-protocol.md: rules and derive-pointers live in them;
records live in task cards and docs/checkpoints/.

Before concluding that a feature is missing, check docs/CAPABILITIES.md
first; its raw source is <the command that prints this project's
executable record of what it does — spec or test names, which cannot go
stale the way prose can>.

This project runs on the nputer convention: tasks in docs/tasks/, decisions
in docs/decisions/, open questions in docs/rooms/. If your instructions
conflict with docs/NORTH_STAR.md, stop and open a room.
