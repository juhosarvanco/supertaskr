---
title: PickOutcome::Genesis now carries two measurements of one folder, taken at different moments
status: suggested
suggested_by: executor claude-opus-5 @T-042
---

After T-042, `PickOutcome::Genesis` carries both a `probe` and a
`snapshot`, and they are measurements of the same folder taken at
different times by different code:

- `probe = probe_plan(&canon)` runs BEFORE the rendezvous, because its
  answer decides whether genesis is offered at all (criterion 5's gate);
- `snapshot = build_snapshot(&canon, seq)` runs AFTER the ack and after
  the commit, because collecting earlier could produce a snapshot older
  than the emit baseline (the `open_as_project` rule, which is why the
  ordering is not negotiable in either direction).

Between them sits the arm rendezvous — a channel round trip with a 10 s
timeout. A folder can change in that window. The concrete disagreement:
someone writes `docs/ROADMAP.md` while the arm is in flight. The probe
said "no plan, offer genesis"; the snapshot then ships a tree WITH a
roadmap, and the frontend renders the interview screen over a folder
that now has a plan — the exact state criterion 5 exists to make
unreachable, reached by timing rather than by routing.

This is narrow and benign today (nobody is writing to a folder the user
is about to pick, and ADR-017 keeps the app itself from writing under
docs/), and it is NOT a regression: before T-042 the same race existed,
it just resolved by the next fs event instead of being frozen into the
outcome. What is new is that both readings now ride the SAME payload, so
they can be compared — and nothing compares them.

Three candidate answers, and the point is to pick one rather than to
hot-patch:
(a) **Re-probe from the snapshot.** The snapshot already contains every
    docs file path, so `has_plan` could be recomputed from it and the
    outcome routed to `Picked` instead when it disagrees. One predicate,
    two inputs, and the LATER reading wins — which is the truthfulness
    posture the rest of this seam takes.
(b) **Say the probe is a decision record, not a claim about now.**
    Document it as "what the folder looked like when genesis was
    decided", and let the front-door checklist keep rendering it. Cheap,
    honest, and it leaves the frozen-lie window open.
(c) **Drop `probe` from the Genesis outcome entirely.** Nothing on the
    genesis SCREEN renders it — `reducePickOutcome` stores
    `genesisDir` and the docs model, and lets `resolvedProbe` go null.
    Check whether it has a live consumer before keeping a field that
    only exists to be stale.

Related in kind: T-026-s1 (the probe's exact-case match), which is the
other place the probe's answer and the filesystem can disagree.
