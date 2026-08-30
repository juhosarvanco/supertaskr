---
id: T-155-s5
title: The founding failure class has four stamped instances and exactly one file that remembers them
status: parked
suggested_by: executor claude-opus-5 @T-155
---

T-155 §4 names the best-attested failure class on record — *"a query that
runs clean and answers a different question"* — with **four stamped
instances across three hands in one week**: the architect's
`git log -15 -- <path>` cap-after-filter, its unlabeled-KiB review
divisor, a stale figure transcribed hours after a fresh one was measured,
and an external review's Unix-convention claim that `diff(1)` refutes.

**THOSE FOUR EXIST NOWHERE ELSE IN THE REPOSITORY.** Derived at this
lane's base with `command grep -rn "divisor" docs/ method/` and the same
for the other terms: the only hit for any of them is T-155's own card
line. The checkpoint records under docs/checkpoints/ do not carry them —
their eval-fodder sections carry a DIFFERENT (and properly stamped) set:
the fence-ledger join printing `app-agent: FREE` while a lane held it and
the `git mv` index slip (amnesty triage), the guessed suggestion filename
and the silently no-opping perl (T-154), the brief that told a seat not
to stamp its status and the `npm ci` the token lint does not need
(T-158).

**WHY IT MATTERS RATHER THAN BEING TIDINESS.** ADR-001 and CONVENTIONS'
succession rule say it in one line: if it isn't in this folder, it didn't
happen. A card is a folder file, so the four are not lost — but a CARD is
a spec that gets absorbed, archived and eventually stops being read,
while a checkpoint record is append-only by charter (ADR-019). The eval
corpus this card built now CITES those instances by name
(`tools/method-evals/fixtures/review-claims.mjs`, each claim carrying a
`source:`), so two of its four fixtures point at a single card line for
their provenance. **A fixture whose only provenance is the card that
created the fixture is a citation with no independent side.**

**TAKING IT.** Each of the four wants its mechanism recorded where the
class is collected — one checkpoint's eval-corpus section, or a standing
place if T-159's metabolism rules make one. Two of the four are already
mechanised in this lane and want only their record: `RC-01` re-derives
the `git log` cap and `RC-03` re-derives `diff(1)`'s exit codes, both at
the reading session's own ref. The other two (the KiB divisor, the stale
transcription) are recorded as `RC-02` and `RC-04` against DERIVED
subjects rather than against the original incidents, because the original
figures are not in the tree to re-derive — which is this suggestion
restated as a defect in the corpus rather than in the record.

**THE ROUTE, not a fence.** Checkpoint records belong to the integrator
seat and ADR-019 forbids any gate depending on the directory's contents,
so this is not an executor's write and was never in T-155's fence
(`[tools/method-evals, docs/CONVENTIONS.md]`).

Standing triage 2026-08-30 (architect seat): PARKED. Re-derived at this ref and HOLDS: `grep -rln "divisor" docs/ method/ tools/` returns three files — the T-155 card, this card, and `tools/method-evals/fixtures/review-claims.mjs` — while `grep -rln "cap-after-filter|unlabeled-KiB|Unix-convention" docs/checkpoints/` returns ZERO. The four stamped instances of the founding failure class live in one card body, and two eval fixtures cite a card line as their only provenance.
The re-derivation sharpens it: the fixtures at `review-claims.mjs:101,129,161,189` build signatures against `docs/CONVENTIONS.md` — SUBSTITUTE subjects, not the original incidents — so the citation genuinely has no independent side, exactly as the card argues.
Not promoted, because the remedy is a write into `docs/checkpoints/`, which is an INTEGRATOR's seat rather than a lane's, and because it is deliberately NOT merged with `T-155-s6`: they share a concern (the eval suite's confidence exceeds its evidence) but not a seat or a fence, and s6's work is inside `tools/method-evals/`. Folding a records write into a code card is how one of the two silently does not happen.
RESURFACES: the next checkpoint written for a `tools/method-evals` card — `T-155-s6` is promoted at this sitting and will produce one. That integrator writes the four instances into the record's eval-corpus section as it closes, which costs a paragraph in a document it is already writing, and is the cheapest moment this work will ever be available. IF that checkpoint lands without them THEN this promotes as its own S card.
