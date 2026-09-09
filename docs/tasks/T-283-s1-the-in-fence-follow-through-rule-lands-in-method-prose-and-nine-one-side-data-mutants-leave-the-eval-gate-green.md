---
id: T-283-s1
title: "T-283's rule lands wholly in method prose and NINE one-side data mutants — the rule deleted, the fence limit widened, 'the fence decides, never the effort' inverted, the size doubled, the verifier's grading struck, undeclared surface made fine, the notes heading drifted out of step with the verifier's copy, lane-protocol's clause deleted, the revert-and-file clause struck — all leave the method eval gate exit 0"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-283, 2026-09-09, drilled in the lane at the pre-notes tree of task/T-283-in-fence-follow-through"
blocked_by: []
touches: [tools/method-evals/evals]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-283 landed its whole rule in prose across `method/roles/executor.md`
step 5, `method/roles/verifier.md` step 6 and `method/lane-protocol.md`
rule 5. Ten mutants were driven in the lane — the property lives in
prose, so a data mutant is the only kind that can grade it
(`method/roles/verifier.md` 2b, T-221) — each planted at an anchor
matching exactly once, each landing read back from `git diff --numstat`,
each restore proved by sha256 against the pristine file
(`8cfb8f86…` executor, `85fcb97a…` verifier, `2514c1a1…` lane-protocol;
all three PROVED at the end of the run, FAILED=0).

**THE POSITIVE CONTROL FIRST**, because nine greens would otherwise be
indistinguishable from a gate that never opened these files: C1 renamed
the new `roles/executor.md` citation inside the verifier text to
`roles/executorz.md`, and the gate exits **1** naming it — MF-04 reads
these exact new lines.

| # | mutation | gate |
|---|---|---|
| C1 | the new citation made dangling (CONTROL) | **exit 1**, named |
| D1 | the whole follow-through rule deleted from executor step 5 | exit 0, 10 evals |
| D2 | "wholly inside your armed fence" → "near your armed fence" | exit 0, 10 evals |
| D3 | "THE FENCE DECIDES, NEVER THE EFFORT" inverted | exit 0, 10 evals |
| D4 | "about twenty lines" → "about forty lines" | exit 0, 10 evals |
| D5 | the verifier's "YOU GRADE EACH ONE" struck | exit 0, 10 evals |
| D6 | "a change that list does not name is a FINDING" → "is FINE" | exit 0, 10 evals |
| D7 | the notes heading drifts out of step with the verifier's copy | exit 0, 10 evals |
| D8 | lane-protocol's converse clause deleted | exit 0, 10 evals |
| D9 | the revert-and-file clause struck | exit 0, 10 evals |

**D3 AND D7 ARE THE TWO THAT MATTER.** D3 inverts the rule's own
decision procedure into the one the card exists to forbid — the effort
deciding instead of the fence — and reads perfectly well. D7 is the
published-equals-parsed shape T-281's M10 already ruled on one level up:
`executor.md` publishes the notes heading a follow-through goes under and
`verifier.md` reads the diff against it, so a drift in either copy leaves
two files describing two different headings and nothing anywhere reds.

This is T-279-s3's class at a second site and with a second card's text.
That card carries MF-11, an eval its verifier wrote and demonstrated;
whether this becomes new assertions inside MF-11 or an eval beside it is
the builder's call, but the two should not be designed apart.

## Acceptance criteria

- WHEN `node tools/method-evals/run.mjs` runs against method text where
  the in-fence follow-through rule has been deleted from any of its three
  sites THE gate SHALL exit 1 and name the missing property.
- WHEN the decision procedure is inverted — the effort deciding rather
  than the fence — THE gate SHALL exit 1.
- WHEN the notes heading published by `roles/executor.md` and the heading
  read by `roles/verifier.md` differ THE gate SHALL exit 1 naming both
  spellings.
- WHEN the eval is added THE `--selftest` positive control SHALL degrade
  a COPY of the contract and require the eval to detect it, and the card
  SHALL record the demonstration rather than assert it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
