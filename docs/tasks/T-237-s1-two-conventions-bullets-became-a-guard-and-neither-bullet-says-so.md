---
id: T-237-s1
title: Two CONVENTIONS bullets became a GUARD and neither bullet says so — a seat meets `NPUTER_CANCEL_CI` for the first time in a refusal, and the document that ordered the habit does not know it is now enforced
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A RULE THAT MOVED FROM A HABIT TO A MECHANISM AND LEFT NO FORWARDING
ADDRESS.** T-237 made two docs/CONVENTIONS.md bullets into arms of
`.claude/hooks/push-guard.mjs`:

    A PUSH CANCELS THE RUNNING CI JOB   ->  a REFUSAL, with a run id
    AND THEN READ IT                    ->  an ANNOUNCEMENT, with the
                                            failing step and its package

Neither bullet was touched — T-237's fence was the hook and its spec, so
the edit was out of fence and is routed here rather than performed. The
gap this leaves is not cosmetic. A seat reading CONVENTIONS today learns
that it *should* batch its pushes and read `gh run list` afterwards; it
does not learn that the guard will now REFUSE a push over a live run,
that the refusal names the run, or that
`NPUTER_CANCEL_CI=<run id> git push …` is the one spelling that clears it.
**The first place a seat meets the acknowledgement is inside the refusal
it is trying to get past**, which is the worst moment to meet a new
mechanism and the moment at which guards get disabled.

Compare the treatment the same document gives T-203's token, three
bullets down: the gate-runner bullet says in as many words that the
runner mints a token, that `push-guard.mjs` refuses a push whose suites
are not green against the tree, and it names each refusal code with its
remedy. That is the shape this owes.

## Acceptance criteria

- WHERE docs/CONVENTIONS.md publishes the two bullets above THE
  document SHALL record that each is now enforced by
  `.claude/hooks/push-guard.mjs`, naming the refusal code
  `ci-run-in-flight` and the announcement, in the way the gate-runner
  bullet already records `token-incomplete` and its siblings.
- THE acknowledgement SHALL be published with its VALUE contract — the
  run's own id, never a bare truthy flag — and with the reason: a value
  that must equal the live run's id cannot outlive the run it was for.
- THE bullet SHALL record that `gh` absent, unauthenticated, without a
  GitHub remote, or failing in a way the guard cannot place ALLOWS with
  an announcement, so that a seat meeting one of those four sentences
  can tell it from a refusal.
- Verification: headless — the e2e lane already reads this document by
  bullet (`conventionsBullet`), and T-237's own spec pins the two
  subcommands against the *AND THEN READ IT* bullet, so a rewrite that
  drops `gh run list` or `gh run view` reds a body by name.

## TRIAGE, 2026-09-02 — `planned`, the integrator's, no lane

The architect seat, at the stamp of T-237's merge (44a95c3). A
forwarding address in a governing document is a reconciling write of the
kind the checkpoint owns: the two CONVENTIONS bullets gain, in the next
checkpoint commit, the sentence that they are now arms of the push guard
(`ci-run-in-flight` refuses; the newest verdict is announced) and that
`NPUTER_CANCEL_CI=<run id>` is the acknowledgement — and this card closes
there, beside T-225-s4's sentence in the same commit.
