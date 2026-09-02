---
id: T-205-s7
title: MF-09's digest-command conjunct is satisfied by the POISON DRILL's own `shasum` mention, so striking the T-205 bullet's command spelling is undetectable
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**A CONJUNCT THAT CANNOT FAIL, INSIDE A GUARD BUILT TO END EXACTLY
THAT.** `MF-09`'s third text finding is written as a conjunction:

    if (!/shasum -a 256/.test(conv) || !CITATION.test(conv.replace(...)))

The second conjunct — the citation grammar `attack set: sha256:<hex>` —
is load-bearing and was drilled RED at the T-205 verification. The first
is not. `docs/CONVENTIONS.md` has carried `shasum -a 256` since long
before T-205, in the POISON DRILL bullet (*"`git show HEAD:<path> |
shasum -a 256` against the working file"*), so the whole-document
presence test is satisfied by a bullet that has nothing to do with
attack-set digests.

**MEASURED, at `48285b5`.** Replacing the T-205 bullet's own
`` `shasum -a 256 <file>` `` with the words *"the usual hashing
command"* leaves `node tools/method-evals/run.mjs` at **exit 0**. The
same edit to the citation-grammar half reds it (exit 1, naming the
finding). So the command half of a two-part check is decorative: the
sentence MF-09 exists to hold can lose its command spelling and no gate
notices.

**WHY IT IS WORTH A CARD AND NOT A SHRUG.** `T-057` is this project's
name for an assertion that cannot fail, and `roles/verifier.md` step 2b
calls a control that grades every arrangement the same the defect this
method produces most. MF-09 is otherwise a careful guard — a five-row
matrix with three wrong judges, all of which were drilled and killed —
which is precisely why one inert conjunct inside it is worth removing
rather than tolerating: it is the shape a later reader will copy.

## Acceptance criteria

- THE command check SHALL be scoped so that striking the digest command
  from the bullet that documents the attack-set citation REDS the eval,
  while an unrelated `shasum` mention elsewhere in the document does NOT
  satisfy it.
- A DEGRADATION SHALL be added to `MF-09`'s `degrade()` arm set that
  strikes the command spelling and requires it detected — the positive
  control the current conjunct never had.
- THE FIX SHALL NOT make the check brittle to rewording: scope it to the
  bullet, not to a byte-exact sentence.

## Read beside

`tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs`,
`T-205`'s verdict (which records the measurement), and `T-205-s1`, which
owns the other end of the same chain.
