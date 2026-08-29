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
`wc -c` and enforced in docs-gate.mjs's DOC_BUDGETS:

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
