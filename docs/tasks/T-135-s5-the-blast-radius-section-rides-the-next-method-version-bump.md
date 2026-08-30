---
id: T-135-s5
title: The blast-radius ceremony section rides the next method version bump — shipped bytes moved and the bump machinery cannot see a paragraph inside a done card
status: parked
suggested_by: "T-135 Half B verifier (2026-08-30), correction 1: the deferred bump is recorded where the rider mechanism cannot find it"
---

Half B added `## Ceremony by blast radius — ADVISORY` to
method/tasks/TASK-FORMAT.md, which is a KIT_FILES row — SHIPPED BYTES
moved, so CONVENTIONS' bump rule (test 1) owes a method version bump.
The bump was correctly deferred (Half B's whole footprint is one
revertible commit; the three version stamps and the --bump eval block
were out of its fence) — but the deferral was recorded as a paragraph
on T-135's card, and the release-card rider mechanism gathers its
cargo by grepping cards at `status: parked`. A done card's paragraph
is invisible to it. This card is the visible rider.

RESURFACES: the next method version bump (the next release card's
sitting) — that card's changelog MUST list the blast-radius section
among what the version carries, and this card discharges into it.
