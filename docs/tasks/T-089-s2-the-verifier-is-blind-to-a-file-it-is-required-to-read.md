---
id: T-089-s2
title: The verifier is promised the executor's reasoning is withheld, and is handed the file the executor writes it into
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

T-089's first acceptance criterion says: *IF the contract would hand the
executor anything the verifier is later forbidden to see THEN the
conflict is recorded and routed to the verifier-blindness card, never
resolved silently.* Writing the contract surfaced it. **There was no
verifier-blindness card to route to** — a grep of `docs/tasks/` and
`docs/rooms/` at `4d2f03c` finds none — so this file is the route.

## The contradiction, in two method files that ship together

`method/roles/verifier.md`, line 3: *"You receive ONLY the task file
(spec + acceptance criteria) and the diff — never the executor's
reasoning. Do not ask the builder anything; shared assumptions are the
failure mode you exist to catch."*

`method/roles/executor.md`, step 5: *"Append Implementation notes to the
task file: what you did, what you'd flag for the verifier, anything you
noticed but didn't do."*

The task file IS the executor's reasoning by the time the verifier reads
it — and "what you'd flag for the verifier" is reasoning addressed to
the verifier by name. **Both sentences cannot hold.** The blindness the
verifier role is built on is not implemented by anything; it is
contradicted by the immediately preceding role file, and it has been
contradicted on every card this project has run.

## Why it matters more than a wording clash

The stated purpose of the blindness is that *shared assumptions are the
failure mode you exist to catch*. This repository has measured that
failure mode repeatedly — a verifier probing with the idiom it expected
rather than the one the tree uses (T-084's verdict on `perf.rs`, then
again on the Rust docs-path spelling), a verdict declining to reject on a
premise the integrator falsified an hour later. A verifier that has read
the executor's account of what it did is exactly the verifier those
findings describe.

## The arms, none of them free

1. **Say what actually happens** — delete the blindness clause and
   describe the verifier as reading the card INCLUDING the notes. Cheap,
   honest, and gives up the property.
2. **Make the notes a separate artifact** the verifier is not given
   (`docs/tasks/notes/T-NNN.md`, or a section the harness strips).
   Keeps the property; costs a file convention, a parser rule and a
   place for the integrator to look; and nothing enforces the
   withholding while briefs are pasted by hand.
3. **Split the notes**: an EVIDENCE half the verifier must see (commands,
   exits, measured figures, restoration proofs — this project's verdicts
   already depend on these) and a REASONING half it must not. The line
   between them is the hard part and would need writing down.
4. **Order it**: the verifier reads the card at the tip it is verifying,
   and the executor's notes are committed separately so the verifier can
   be pointed at the pre-notes tree. Costs nothing in file layout and
   everything in discipline.

The choice is the architect's or the human's, not an executor's.
T-089 recorded the conflict in `method/roles/executor.md` in as many
words and resolved nothing, which is what its criterion asked for.

**One consequence to weigh with it**: whichever arm wins governs the
dispatch brief too. Row 13 of T-089's contract tells the executor to
report where the brief was wrong; if the brief itself is not something
the verifier may see, then neither is the note that corrects it, and the
tree loses the correction that has caught two stale figures in three
merges.
