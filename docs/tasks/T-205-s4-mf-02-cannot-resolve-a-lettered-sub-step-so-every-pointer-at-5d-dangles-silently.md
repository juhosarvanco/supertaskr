---
id: T-205-s4
title: MF-02 resolves numbered rules and is blind to LETTERED sub-steps, so `roles/orchestrator.md 5d` — now cited from two role files — dangles silently the day 5d is renamed
feature: F-06
milestone: 4
size: S
priority: 4
status: planned
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**A HOLE MF-02 ALREADY KNOWS THE SHAPE OF, IN A CITATION FORM T-205 JUST
MADE LOAD-BEARING.** `tools/method-evals/evals/mf-02-rule-citations.mjs`
resolves `<file>.md rule N` against that file's own `^ {0,3}(\d+)\.\s`
items. The method's role files do not number their steps that way in
every case: `roles/orchestrator.md` carries `5b.`, `5c.` and now `5d.`,
and every citation of them — `(roles/orchestrator.md 5c)` in two files
before T-205, `roles/orchestrator.md 5d` in `roles/verifier.md` and
`roles/executor.md` after it — carries no `rule` keyword and names no
ordinal MF-02 can see. **The regex does not match, so the citation is
never examined**, which is the same silent class MF-04's own header
names for a bare unprefixed filename.

**WHY IT MATTERS NOW RATHER THAN BEFORE.** T-205's whole shape is *one
statement, everything else points at it* (`T-057`). A pointer that
cannot be checked is the failure mode of that shape: rename 5d, or
insert a 5d ahead of it, and two role files quietly cite a step that is
not there while every gate stays green. This is MF-02's own opening
argument — *an ordinal IS a line number wearing a rule's clothes* —
applied to the form the method actually writes.

## Acceptance criteria

- MF-02 SHALL resolve a LETTERED sub-step citation (`<file>.md 5d`,
  `<file>.md 5c`) against that file's own `^\d+[a-z]\.` items.
- THE coverage count SHALL rise, and the eval SHALL still throw when it
  examines nothing — a widened predicate that matches nothing is a
  quieter version of the hole it closed.
- THE POSITIVE CONTROL SHALL rename `5d` in the home file and require
  the eval to name the two role files that cite it, demonstrated red.
- THE predicate SHALL NOT start matching ordinary prose: run it over the
  corpus and show the findings count is zero before the degradation.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-225-s2 merge (6691fc5)

The architect seat. Dangling lettered pointers are exactly what the single-source rule now depends on; T-205-s7 rides in the same fence.

## Absorbs: T-205-s7 (2026-09-02, at the T-225-s2 merge (6691fc5))

MF-09's digest-command conjunct is satisfied by the POISON DRILL's own `shasum` mention, so striking the T-205 bullet's command spelling is undetectable

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
matrix with three wrong judges, all of which were drilled a
