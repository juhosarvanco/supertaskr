# ADR-019: governing documents carry rules and pointers; records are immutable and live elsewhere

Status: ratified. Date: 2026-08-27. Decider: @human.
Provenance: docs/rooms/governing-docs.md (opened `280df02`, the
architect session's review folded in at `9d09a07`, ruled the same
day). Numbering: ADR-018 is reserved — STATE records it as owed to
T-135 Half B — so this decision takes 019 and the gap is deliberate.

## Decision

Every sentence in docs/STATE.md, docs/ROADMAP.md, docs/ARCHITECTURE.md
and docs/CONVENTIONS.md is a RULE, a TRUTH or a RECORD, per
docs/rooms/governing-docs.md §1. The four documents carry rules and
truth-derivers only; records live in task cards, docs/checkpoints/
and decision records. Living documents are REPLACED under byte
budgets; records are APPENDED and never edited.

## Scope of the T-101 precedent

"Corrected in place with the ref rather than deleted" governs
IMMUTABLE RECORDS (cards, checkpoint records, ADRs, room resolutions),
where it remains in full force. In the four living documents the
current sentence replaces the stale one and cites the card or record
that holds the history; the pre-replacement text remains reachable in
git history at the ref the replacing commit names.

The generic form of this law lands in method/docs-protocol.md rule 3
at the room's phase 7; this NAMED amendment lives here alone, because
method/ is generic and a card id does not belong in it.

**Transition.** Passages already corrected in place under the
practiced precedent remain valid records of their moment until the
phase that compacts their document reaches them; each is then
re-justified, moved or retired in that card's traceability table.
There is no window in which live text cites a precedent that no
longer licenses it.

## Budgets

Compaction TARGETS: STATE ≤ 12 KB · ROADMAP ≤ 24 KB · ARCHITECTURE
≤ 20 KB · CONVENTIONS ≤ 48 KB. An overshoot up to ~25% is acceptable
when the compaction card argues it. GATE values are not legislated
here: they are DERIVED at each document's compaction landing — warn
at landed size × 1.25, fail at landed size × 1.5 — and recorded by
addendum to this ADR with the measurement (the max_graph_bytes
pattern). STATE's gate is hard once set (template-generated, low
variance); the other three run warn-only until they have survived
several merges. The budget is a tripwire against relapse, not the
instrument of the cut: the room's §3 laws do the compaction, the
gate holds the line after.

## Records

docs/checkpoints/ holds one append-only file per integration, written
BEFORE docs/STATE.md is regenerated, on the committed template
(docs/checkpoints/TEMPLATE.md). No suite, gate or generator may
DEPEND on this directory's contents. The two e2e specs that walk all
of docs/ will walk these files as app content; that walk is not a
dependency and must never become one.

## The RANGE RULE

docs/CONVENTIONS.md's RANGE RULE keeps its spec-kept figures whole —
they are tier-TRUTH with a real keeper (range-rule.spec.ts) — and
only the unguarded 31-merge scoreboard narrative moves to T-083's
card at the room's phase 5.

## Reading list

Unchanged — T-138's ruling stands: the root adapter names the same
four documents, plus docs/CAPABILITIES.md when T-138-s1 lands it.

## Supersedes / amends

Amends the practiced T-101 precedent as scoped above. Does not amend
ADR-001..017.

## Addendum (2026-08-27, at the compaction run's close)

Gate values derived at each landing, per §Budgets, measured with
`wc -c` and enforced in docs-gate.mjs's DOC_BUDGETS [the table's home
since T-156 (2026-08-29) is docs-scan.mjs — one table, the gate
enforces it from there and the health bands read it]:

    document             landed     warn      fail    target   note
    docs/STATE.md         6,772     8,465    10,158   12,288   under
    docs/ROADMAP.md       8,399    10,499    12,599   24,576   under
    docs/ARCHITECTURE.md  8,525    10,657    12,788   20,480   under
    docs/CONVENTIONS.md  86,373   107,967   129,560   49,152   OVER

CONVENTIONS' target is unreachable today for a measured reason: ~59 KB
of the document is spec-kept or card-owned (the run's checkpoint
record itemises it). The floor drops when T-092/T-093 land and when
the four dispatch-brief bullets' lane spellings move to one structured
source; the target stands as the aim for that day, these gate values
the tripwire until then. Sub-question 3's "move the unguarded
scoreboard narrative" half proved VOID by measurement — the scoreboard
is spec-kept by range-rule's own CHECK_IDS — so the RANGE RULE bullet
stayed whole, which the ruling's primary clause already required.

Record of execution: docs/checkpoints/2026-08-27-adr019-compaction.md.

## Addendum 2 (2026-08-29): the ritual slipped, and the gate is the answer

The record-first checkpoint ritual slipped in its first two live
checkpoints — T-092's and T-093's records were written and STATE was
never regenerated, ROADMAP never ticked; the architect session's own
report named the skip. The room's promote-if-it-slips clause fires:
docs-gate now FAILS whenever a checkpoint record's last commit is
newer than docs/STATE.md's last commit. Committed history only, so the
correct one-commit checkpoint ties and passes, and a mid-ritual
working tree never false-reds. The check's positive control was the
live defect itself: added against the stale tree, it redded naming
exactly the two records, exit 1 read unpiped, before the repair
landed. ROADMAP ticking stays a ritual — judgment is not mechanically
checkable — but STATE, the file every session reads first, can no
longer be forgotten silently.

## Addendum 3 (2026-08-29, at T-154's checkpoint)

docs/CONVENTIONS.md re-landed at **110,342 bytes** — the T-093/T-092
floor-droppers plus ADR-020's merge gate plus T-154's ruled guard
bullet (with the fourth limit the verdict required disclosed). Every
byte of the growth is rule text that survived the pipeline, which is
what the document is FOR; the tripwire fired on the way (warn at
107,967, T-092-s2's prediction to the sentence) and its disposition
is this addendum, per §Budgets: gate values re-derived at the new
landing — warn 137,928, fail 165,513 — with the 48 KB target still
standing as the aim for the day T-092/T-093's classes retire their
kept spans. Measured reason recorded; the mechanism, not the
adjective, is the bar.

## Addendum 4 (2026-08-30, at T-162's re-landing): ROADMAP and CONVENTIONS re-land, and the formula's own arithmetic is stated

@human's ruling at the 2026-08-30 rulings sitting approved a full
re-landing pass over raise-the-lines-only and keep-absorbing. Two
documents are re-landed on their own terms per §Budgets; STATE's and
ARCHITECTURE's landings are untouched.

    document             landed     warn      fail    target   note
    docs/ROADMAP.md       9,801    12,252    14,702   24,576   under
    docs/CONVENTIONS.md 131,514   164,393   197,271   49,152   OVER

Derivation, the same one §Budgets legislates and the same rounding the
2026-08-27 and 2026-08-29 landings used: `wc -c` at the re-landing
commit, `warn = ceil(landed × 1.25)`, `fail = ceil(landed × 1.5)`.
ROADMAP measured at `c0b865b` (`git cat-file -s c0b865b:docs/ROADMAP.md`
= 9801); CONVENTIONS at `5b85715`
(`git cat-file -s 5b85715:docs/CONVENTIONS.md` = 131514). The table's
home is `DOC_BUDGETS` in tools/e2e/scripts/docs-scan.mjs; the gate
enforces it from there and the health bands read the headroom under
`warn`. Both docs-headroom bands read INSIDE after the landing —
`npm run health` from tools/e2e reports 7 inside, 0 drifting, 0
BREACHED (it still exits 3 while four unrelated bands await keepers,
T-156-s1/s2, which is by design and not this card's).

**WHAT THE COMPACTION MOVED.** ROADMAP 10,315 → 9,801 (−514, −5.0%):
three days of per-merge chronicle back to the checkpoint records that
already hold it, the method version stopped being quoted where
CONVENTIONS' first-gotcha stamp is the keeper, F-03's second copy of the
real-model gate replaced by a pointer to milestone 3 which states it
once, and the milestone-4 tally replaced by the derivation the same
paragraph already ordered. CONVENTIONS 134,167 → 131,514 (−2,653,
−2.0%): the per-release method changelog to T-159's card and checkpoint,
the POISON DRILL bullet's transcribed drill measurements to T-013,
T-092, T-130-s1, T-145-s3, T-153-s5 and T-111-s10, the xargs BSD/GNU
narrative to T-153-s6, the token-lint replaced-row story to T-058 and
T-080, and T-090's retraction message to T-090. Every rule, tell,
remedy, hazard and poison-shape ordinal is whole; the RANGE RULE bullet
is untouched, because range-rule.mjs parses it sentence by sentence and
addendum 1's ruling on it stands.

**AND THE PASS FOUND ONE STALE SENTENCE, CORRECTED IN PLACE PER §Scope.**
CONVENTIONS' DOCS GATE bullet described the PRE-T-085 site rule — a
literal opening with `docs` AND a base evaluating to the repository root,
"both halves load-bearing" — which T-085 subsumed under one containment
test so that a package-relative docs read holding no root is SEEN. No
suite compares the bullet to `docs-scan.mjs`, so the two implementations
had disagreed unnoticed. The bullet now names that module's own
`THE DERIVATION` header as the authority.

**THE RE-BREACH PRICE, STATED RATHER THAN ASSUMED** — the card's own
condition, and it has two halves, one of which is uncomfortable.

*The bar is cleared.* ROADMAP's new landing buys **2,451 bytes** of warn
headroom. Derive the growth rate rather than quoting it: for each commit
`c` touching the file, `git cat-file -s $c:docs/ROADMAP.md`. Over the
night the card was filed about — 2026-08-29 12:35 through 2026-08-30
05:40, sixteen commits — the file went 8,559 → 10,320, **+1,761 bytes
net**, with per-commit positive deltas from 25 to 302 bytes (median 177)
and FIVE net-negative absorption trims paid inside that window to stay
under the old line. Six sentences at that median is ~1,062 bytes, so the
new landing buys about **2.3× the card's ~six-sentence bar**, or ~13
merges at the median delta. It does NOT buy a comfortable multiple of
that whole night: 2,451 against 1,761 is **1.4 nights**. CONVENTIONS is
the same shape one order up — **32,879 bytes** of headroom against
**+23,825 bytes** measured between the 2026-08-29 T-154 landing (110,342)
and this card's dispatch (134,167), six merges of rule text in about
fourteen hours: **1.4 days** at that rate.

*The uncomfortable half.* Because §Budgets sets `warn = landed × 1.25`,
**headroom is exactly a quarter of the landing, so compacting a document
BUYS LESS ABSOLUTE RUNWAY, not more.** Measured on this pass: ROADMAP's
514-byte cut cost 128 bytes of headroom (2,579 → 2,451) and CONVENTIONS'
2,653-byte cut cost 663 (33,542 → 32,879). What actually bought the
runway was RE-BASING — ROADMAP's warn line moves 10,499 → 12,252
(+1,753) and CONVENTIONS' 137,928 → 164,393 (+26,465) — because the old
lines were derived from landings that three days of legitimate rule
growth had left behind. **So the compaction is not the instrument of the
runway and must not be pushed as though it were**: §Budgets already says
the gate is a tripwire against relapse rather than the instrument of the
cut, and this pass took the cut exactly as far as ADR-019's own law
reaches — record-shaped sentences to the records that keep them — and
not one hazard further. A deeper cut would have shortened the runway it
was supposed to lengthen.

**WHAT THIS CARD THEREFORE DOES NOT ANSWER, SAID PLAINLY.** At the
measured velocity ROADMAP re-breaches in about a night and a half of
merges and CONVENTIONS in about a day and a half of rule-text landings.
Re-deriving the gate cannot fix that, because the gate is a tripwire and
the velocity is real work: what holds the line is ROADMAP's
one-sentence-per-feature-per-merge contract being enforced at the merge
and CONVENTIONS' growth being rule text that survived the pipeline
(addendum 3's finding, still true). If the next re-breach arrives on the
same schedule, the question to take to @human is whether a proportional
`landed × 1.25` is the right shape for a document under this velocity at
all — a FLOOR in bytes, or a per-merge budget, are different instruments
and neither is legislated here. Routed as `T-162-s1`.

Record of execution: T-162's card (Implementation notes) and the
integrator's checkpoint record for this merge. **THE CHECKPOINT RECORD
IS NOT THIS LANE'S**: T-162's fence is
[docs/ROADMAP.md, docs/CONVENTIONS.md, docs/decisions, tools/e2e] and
docs/checkpoints/ is outside it, which is the correct division — ADR-019
§Records has the record written at the integration, before STATE is
regenerated.
