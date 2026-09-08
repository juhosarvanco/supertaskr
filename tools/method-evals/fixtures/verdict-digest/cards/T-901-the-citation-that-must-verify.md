# T-901 — FIXTURE CARD: the citation that must VERIFY

Synthetic, and shaped exactly like a real card's Verdicts section so the
checker's walk is exercised rather than approximated.

## Verdicts

### 2026-09-09 — fixture (phase 2)

VERDICT: APPROVED

attack set: sha256:188bd2bfdb3663c3a0ece5ed8242d66f5c19bec045e6d72115b18c3963884499 (attack-set-T-901.md)
ground truth: sha256:c9768b57722ac5a0f3cd8a32dca7cf9b9c55f427d52ab1259ff2a73d90893b2f (attack-set-T-902.md)

The prose below is here because a real verdict has prose below it, and a
walk that only ever met a two-line file would not be walking anything.
The line above is a line of its own, which is how docs/CONVENTIONS.md's
bench bullet spells the citation.

AND THIS PARAGRAPH IS PART OF THE FIXTURE, not filler. It quotes the
grammar mid-sentence — the citation grammar `attack set: sha256:<hex>` —
exactly the way two real cards on the board discuss the rule. A collector
that did not anchor on the LINE would read this as a second, malformed
citation and refuse a card that is doing nothing wrong. So this card must
come back with EXACTLY ONE citation and exit 0, and the paragraph is what
makes that assertion able to fail.
