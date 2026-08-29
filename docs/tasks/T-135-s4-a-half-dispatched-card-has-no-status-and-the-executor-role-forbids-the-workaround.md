---
id: T-135-s4
title: A card dispatched in halves has no `status:` that is true, and `roles/executor.md` says in as many words that a brief telling the executor to skip the stamp is wrong
status: parked
suggested_by: executor claude-opus-5 @T-135
touches: [method/tasks/TASK-FORMAT.md, method/roles/executor.md]
---

**A CONFLICT BETWEEN TWO METHOD FILES AND ONE DISPATCH, RECORDED RATHER
THAN RESOLVED** — `method/roles/executor.md` is explicit that a session
which notices a conflict "records and routes it instead of deciding it".

T-135 was dispatched as **two halves to two hands**: Half A (the graph
fix, fence `crate-index`) and Half B (the ceremony prose and the ADR),
with Half B held pending @human's look at the planning pass's §6/§7. Half
A's executor finished, and then had no true value for `status:`.

- `method/tasks/TASK-FORMAT.md` closes the vocabulary at
  `suggested | planned | building | verifying | rejected | merging | done
  | parked`, and says **"ADDING A STATUS IS A METHOD CHANGE, NOT A PARSE
  FIX"**.
- `method/roles/executor.md` step 6: stamp `verifying` in your own lane,
  **"and a brief telling you to skip it is wrong"**.
- But `verifying` on this card would tell the board — for the one commit
  the value is observable at — that **the whole card** is built and
  awaiting a verifier, when half of it has not been written and is
  waiting on a human ruling.

**The dispatching brief instructed `status: building`, and Half A's
executor obeyed it and said so.** That is a defensible call and it is not
a rule: the executor role file addresses the brief-vs-repository case and
resolves it the other way.

**THE THREE REPAIRS, and the argument against the easy one.**

1. **A new status** (`half-built`, `partial`). Refused on sight: a method
   version bump is a three-file commit whose third file is Rust
   (`docs/CONVENTIONS.md`), the parser's vocabulary is closed in
   `lib/parser`, and the board would gain a value that is meaningless for
   every card dispatched whole.
2. **Never dispatch a card in halves — slice it.** The clean answer, and
   `method/interview/decomposition.md` already says a task that needs a
   second lane was sliced too coarsely. The planning pass considered
   exactly this and recommended AGAINST splitting T-135, on the grounds
   that splitting doubles ceremony on a card whose subject is reducing it.
   **That argument is about ceremony cost and does not answer the status
   question**, which is what makes this worth filing.
3. **Say it in the card body and leave `building`.** What happened here.
   Cheapest, needs no bump — but nothing in `TASK-FORMAT.md` sanctions it,
   so the next half-dispatched card will re-derive it from scratch or
   stamp `verifying` and be wrong.

**Recommendation: write repair 3 into `TASK-FORMAT.md`'s lifecycle rules
as a named case**, beside the bullet that already documents `verifying`
as a lane state with a one-commit window. One sentence, no bump, and it
turns a judgement call into a rule.

Amnesty triage 2026-08-29 (triage seat): PARKED — a genuine conflict between two method files and one dispatch, recorded rather than resolved by the seat that met it — which is what roles/executor.md asks for. Its recommendation is the right one and needs no bump: write repair 3 into TASK-FORMAT.md's lifecycle rules as a NAMED CASE, beside the bullet that already documents verifying as a lane state with a one-commit window. Repair 1 (a new status) is refused on sight by the file's own ADDING A STATUS IS A METHOD CHANGE rule; repair 2 (never dispatch in halves) was considered by T-135's own planning pass and rejected on ceremony cost, which does not answer the status question. RESURFACES: the next method/ dispatch — T-159. It joins T-052-s5, T-091-s4, T-104-s4 item 2, T-126-s5's residual, T-126-s6, T-132-s4, T-132-s5, T-133-s3 and T-124-s1 at that seat; the vehicle now carries nine parked riders and the bump is where they are ruled.
