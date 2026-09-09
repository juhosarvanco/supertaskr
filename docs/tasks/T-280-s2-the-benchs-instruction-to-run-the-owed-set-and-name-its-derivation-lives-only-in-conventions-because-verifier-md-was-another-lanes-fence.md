---
id: T-280-s2
title: "The bench's instruction to run the OWED SET at its tip and to name the set and its derivation in the verdict lives only in CONVENTIONS, because method/roles/verifier.md was another live lane's fence"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-280, 2026-09-09, at a1bb590 + this lane's diff"
blocked_by: [T-280, T-283]
touches: [method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-280's fourth criterion: *"WHEN a bench verifies a lane THE verifier's
one run at its tip (T-262) SHALL be the owed set for base..tip, not the
four legs — the bench's report naming the set and its derivation."*

Half of that landed. `docs/CONVENTIONS.md`'s BLESSED GATE-RUNNER bullet
now says the verifier's one run and the integrator's run before the push
are the owed set for their own range, and the runner has the
`--range <base>..<tip>` arm that produces it. The other half —
**the verdict naming the set and its derivation** — is an instruction to
a ROLE, and the only file that holds it is `method/roles/verifier.md`,
which was T-283's armed fence while T-280 was built. T-280 did not touch
it, correctly.

So today a verifier reaching for its one run finds the rule in
CONVENTIONS and finds nothing about it in its own role file, which is the
document a bench's phase-2 spawn is handed. That is the gap T-271-s3
already names one layer over ("no verifier brief can be assembled because
verifier.md carries no contract table"), and this is a second, concrete
instance of the same absence rather than a restatement of it: the run
instruction is now WRONG by omission rather than merely missing, because
CONVENTIONS has moved and the role file has not.

What this card owes:

- `method/roles/verifier.md` says the bench's one run at the tip is the
  owed set for `<base>..<tip>`, spelled as the runner's own range form.
- It says the verdict REPORTS the set and the derivation — which suites,
  which spec files, and the sentence the derivation gives when it fails
  closed to the whole battery. A bench that ran a narrower set without
  saying which set is a bench whose green nobody can re-derive, and
  T-280's whole argument is that the set is re-derivable.
- It keeps the sentence T-280 did NOT move: a cross-spec red must land
  inside the lane's ceremony. The range form is what keeps that true
  while costing the range's own paths, and the role file should say so
  rather than leaving the reader to infer it from a cost argument.
