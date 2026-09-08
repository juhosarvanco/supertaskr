---
id: T-277
title: "The verdict-digest checker resolves a relative citation outside its named root and hashes any absolute path a card names — a card is an input path, and the refusal line prints the true digest of whatever file it was pointed at"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "verifier claude-fable-5-1@subagent @T-205-s1, 2026-09-09"
blocked_by: []
touches: [tools/method-evals/]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-248` — a card's text is an input path every seat reads.
DISPOSITION HINT: **promote at S.** Refuse a candidate that resolves
outside the root it was resolved in; keep absolute citations, which the
design allows and `verdict-digest.mjs`'s header argues for; decide on the
record whether a refusal keeps printing the file's actual digest.

## The finding

Measured at `faf1b69`, on T-205-s1's verification bench.
`resolveCited` builds `path.join(root, name)` and accepts the result if
it is a file, with no containment check, so a citation whose file part is
`../outside/secret.md` VERIFIES through `--scratch <root>` against a file
that is not under that root (probe P18). An absolute citation resolves
to itself, so a card naming any readable file gets it read and hashed,
and on a mismatch the refusal says *"against a file that hashes to
<its true sha256>"* (probe P18b) — a hash oracle over the operator's
filesystem, driven by board text. Read-only, no exec, no network, one
digest per line; the verdict's security sweep graded it a hardening and
not a rejection, and said so.

## What closes it

A candidate whose `path.relative(root, candidate)` opens with `..` (or is
absolute) is skipped with the reason named, and a fixture card carrying a
`../` file part expects UNAVAILABLE; the oracle is either accepted on the
record, or the mismatch line prints the cited digest and *"does not
match"* only. Drill: a mutant that removes the containment check must red
the new fixture by name.
