---
id: T-205-s12
title: The sealed attack sets have no home in the tree, so the checker T-205-s1 built verifies NOTHING from a clean checkout — 14 of 14 real citations came back unavailable, and where a set lives after its verdict is a ruling no lane may make
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s1, 2026-09-09
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-205-s1`, which built the checker and hit this wall.
DISPOSITION HINT: **needs a ruling from @human or the architect, not a
build.** The code side is done; one directory and one CONVENTIONS
sentence close it, and neither is a lane's to choose.

## The finding

`tools/method-evals/verdict-digest.mjs` re-hashes the file a verdict's
`attack set: sha256:<hex> (<file>)` line names. Measured at `4de3675`
over the live board: **14 citations in 556 cards, and 14 came back
UNAVAILABLE.** Every one names a BARE FILENAME — `attack-set-T-249.md`,
`attack-V-T-239.md` — that resolves only inside the dispatching
session's scratchpad, and `method/lane-protocol.md` rule 4 forbids
defaulting a machine-scoped path, so the checker refuses to guess and
exits 3. Pointed at the live scratchpad with `--scratch`, **7 of the 14
VERIFY and 0 refuse** — so the mechanism works and the artifact is
simply not where a gate can reach it.

`T-205-s1`'s own card states the question and declines to answer it:
committing the set beside the verdict makes the digest checkable from
the tree alone, but `roles/orchestrator.md` 5c says THE ATTACK SET NEVER
REACHES THE EXECUTOR, and *"after the verdict is a different question
than before it, which this card has to answer rather than assume."* A
lane executor answering it by creating the directory is exactly the seat
5c excludes.

## What a ruling would need to settle

- The directory: `docs/benches/` or `.supertaskr/benches/` — the first is
  in the byte-banded corpus and the graph walk, the second is runtime.
- Whether a landed set is readable by a later executor, and if not, what
  stops it.
- One sentence in `docs/CONVENTIONS.md`'s bench bullet naming it. The
  checker needs no change: a tree home is one more resolution root.
