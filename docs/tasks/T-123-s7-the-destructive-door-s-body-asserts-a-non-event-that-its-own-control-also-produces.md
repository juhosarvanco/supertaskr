---
id: T-123-s7
title: The destructive door's body asserts a non-event its own control also produces, and the shape-six check covered four of the ten new bodies
status: parked
suggested_by: verifier claude-opus-5 @T-123-verify2
---

Absorbs: T-123-s6 (Amnesty triage 2026-08-29 (triage seat)) — same class from the other module: a pin that reads as proving more than it proves. Here a mutant replacing the CARRIED reachability with a second independent read survives the whole suite at exit 0, so the sentence T-064's veto-only property rests on has no tripwire. Its fix is a FIXTURE not a guard — relayed_state's on_arm hook already runs code inside the rendezvous window — and its fence is app-shell where this card's is app-agent, which is why one card wants both.

Two measurements about the strength of T-123's new assertions. Neither
is a defect in the shipped code; both are places where a body says less
than it reads as saying.

## 1. `fresh_genesis`'s body asserts a non-event, and the control produces the same non-event

`fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered`
(app/src-tauri/src/agent/mod.rs) makes two assertions: the typed outcome
is `AlreadyPlanned`, and

    assert_eq!(… read(".nputer/sessions.json") …, before,
               "the recorded session was NOT marked dead");

The first assertion is discriminating — mutant M11 (the bare
`probe.has_plan()` guard deleted) reds this body, alone. **The second is
not.** Measured at `338a7e2` by driving the control the body does not
have — the SAME registry on a folder with NO plan:

    V2-FRESH-PLANNED:   AlreadyPlanned { … }   registry unchanged = true
    V2-FRESH-UNPLANNED: CliNotFound { probed: [ … NPUTER_NO_REAL_CLI … ] }
                                               registry unchanged = true

`fresh_genesis` resolves the CLI BEFORE it calls
`sessions::mark_planner_dead`, and T-060's structural refusal makes
`resolve_cli` fail under `cargo test` unconditionally. So
`mark_planner_dead` is unreachable in this harness for ANY fixture, and
"the recorded session was NOT marked dead" is satisfied by absence
rather than by refusal — CONVENTIONS' *A NEGATIVE ASSERTION NEEDS A
POSITIVE CONTROL*, in its exact form: refused-for-the-right-reason,
refused-for-the-wrong-reason and there-was-nothing-there are
indistinguishable here.

The honest repair is to say what the harness can prove — the typed
outcome — or to assert the guard's own state (`probe_plan(&dir).has_plan()`)
before exercising it, the way the LIFTING A SAFETY GUARD bullet
prescribes. Asserting a write that this harness can never perform reads
as a proof about the destructive door and is a proof about the CLI gate.

## 2. Shape six was asked of four bodies out of ten

The rebuild notes answer the shape-six question for
`start_refuses_…`, `a_registered_interview_with_no_way_back_into_it_…`,
`reachability_tells_…` and `resume_refuses_…`. Ten bodies were added or
changed. Over an independent 15-mutant sweep at `338a7e2`, two of the
unexamined ones kill nothing that
`start_refuses_a_plan_whose_registered_interview_cannot_be_resumed`
does not already kill:

| body | red under | unique? |
|---|---|---|
| `a_registered_session_with_nothing_to_resume_never_starts_a_fresh_one_on_a_plan` | M1, M5, M6, M9 | none — a strict subset of `start_refuses_…`'s list |
| `a_registered_interview_gets_the_resume_offer_on_the_plan_it_wrote` | M2, M4 | none — same |

Both are, structurally, arms 1 and 3 of `start_refuses_…` re-driven as
standalone bodies: the same call on the same fixture, one JSON field
apart. That is shape six as CONVENTIONS defines it — a body that reds
under a poison while killing no mutant another test does not already
kill. It is not vacuous and it is not wrong; it is unexamined, and the
card's own Verification line asks for the check *on each new body*.
Either name them as deliberate duplicates or fold them into the body
they duplicate.

Amnesty triage 2026-08-29 (triage seat): PARKED — both halves are live and neither is a defect in shipped code — they are places where a body says less than it reads as saying. The sharper one is measured with the control the body lacks: fresh_genesis resolves the CLI BEFORE mark_planner_dead, and T-060's structural refusal makes resolve_cli fail under cargo test unconditionally, so "the recorded session was NOT marked dead" is satisfied by absence for EVERY fixture. That is CONVENTIONS' A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL in its exact form. RESURFACES: the next app-agent dispatch (the fresh_genesis body and the two shape-six duplicates) paired with app-shell for the carried-registry fixture absorbed here; both fences are cheap to hold together and the two findings share one seat.
