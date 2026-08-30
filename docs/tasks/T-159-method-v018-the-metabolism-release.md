---
id: T-159
title: Method v0.1.8 — the metabolism release, one bump owning every method-text change ADR-020 and its reviews earned
feature: F-01
milestone: 4
priority: 38
size: M
status: building
blocked_by: [T-154]
touches: [method/, docs/CONVENTIONS.md, app-agent]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

The pre-execution review found T-154 and T-157 each carrying
method-text riders that would collide into two rapid bumps; this card
is the resolution — ONE bump, one coherent release, one three-file
commit whose third file is Rust (`kit.rs` 0.1.7 → 0.1.8), one
cargo-gated landing, sequenced after T-154's mechanism exists so no
method sentence runs ahead of reality. `blocked_by: [T-154]` is that
sequencing; `T-155`'s eval obligation applies if its suite has landed
by then, and is recorded as not-yet-owed if it has not.

## The release contents (each already ratified or reviewed; this card writes them)

1. **The fence is a property** — lane-protocol rule 5 gains the
   write-time enforcement text with its honest limit (Bash-mediated
   writes stay protocol-covered in v1, disclosed).
2. **Session hygiene per seat** — T-157's run-economics text in the
   role files: dials at session start, standing seats compact between
   dispatches, noisy jobs in subagents, quiet flags with counts kept.
3. **The revert play** — the method's missing undo, written before
   the first bad merge improvises it: `git revert -m 1` of the merge,
   the card returns to `planned` with the revert recorded in its own
   body (a record, never erased), fixtures and generated artifacts
   reconciled at the reverting checkpoint, the checkpoint record
   carrying the why.
4. **Guard-class independence** — a card whose subject is a guard
   (hooks, gates, keepers, security) requires `review: independent`;
   the builder of a cage is not its inspector.
5. **The suggestion metabolism** (TASK-FORMAT + roles): SEARCH BEFORE
   FILING — a finding whose class a card already owns is a
   CORROBORATION and appends a dated evidence line to that card,
   never a sibling file; every new suggestion names its class parent
   if one exists and carries a one-line disposition hint;
   TRIAGE-AT-STAMP — a done card's suggestion train receives
   dispositions within one dispatch cycle, while context is hot;
   a PARKED card resurfaces when its fence's component is next
   dispatched. (The 140-card backlog gets one amnesty triage sitting,
   which is the architect's, not this card's.)
6. **Retirement conditions** (from the external review's best point,
   with this repository's own precedent — the interim graph rule that
   carried its retirement condition from birth and met it): EVERY
   machine ships with the condition under which it retires, and the
   health bands are what notice an incident class gone quiet.
   Promotion and demotion, or the gate inventory eats the method.
7. **The trust sentence** (docs-protocol): trust is not eliminated;
   it is RELOCATED to fewer, named, recorded points — seats,
   provenance marks, human gates. Written down so no future
   description can honestly claim zero.
8. **Review reconciliation** (roles): a review's claims are VERIFIED
   before they are folded in; findings that die are recorded as
   refuted, never deleted. Two sibling reviews in one week each ran
   a third wrong at full confidence — the loop is now the practice,
   this makes it the rule.

## Acceptance criteria

- WHEN the bump lands THE three stamps SHALL move together (the
  ordered-asserts trap is documented) and the commit SHALL record the
  eval-suite result or its honest absence.
- IF any release item's mechanism does not yet exist THEN its method
  sentence SHALL say what holds it today rather than claiming the
  machine — prose never runs ahead of reality.
- WHEN the kit recompiles THE adapter templates SHALL still be
  cmp-identical below line 1 and byte-for-byte with their entries.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
