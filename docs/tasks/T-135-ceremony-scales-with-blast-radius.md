---
id: T-135
title: Ceremony scales with how many things depend on what a card touches, not with S/M/L — adopted by @human, and the graph cannot yet answer the question it now has to answer
feature: F-06
milestone: 4
priority: 7
size: L
status: planned
blocked_by: [T-132]
touches: [crate-index, method/]
builder:
verifier:
built_by:
verified_by:
review:
---

**@human adopted this on 2026-08-25** as item 5 of `T-131`'s five process
changes, **having been shown the architect's objection to it and chosen it
anyway.** The objection is recorded below because it is now a risk to
manage rather than a reason to decline, and a card that hides the argument
against itself is worse than one that never had it.

## The ruling

**Card size is a proxy for risk and a poor one.** `T-126` was size S and
was the difference between a feature existing and not existing — a lane
reader rejected twice, waived once by @human, rebuilt by two executors and
approved on a third pass, compiled into nothing because no module declared
it. Meanwhile the same session spent ~930 000 tokens on a full three-hand
ceremony for cards whose blast radius was a single unimported file.

**A card touching a file nothing imports is cheap to get wrong. A card
touching a file twelve things import is not.** nputer already computes the
thing that predicts this — the architecture map knows every file's
dependents — and does not use it. Ceremony keyed to that number spends the
expensive rungs where they earn.

## THE ARCHITECT'S RECORDED OBJECTION

Stated at the ruling and preserved verbatim in substance: **this rests on
one session, five merges, and one unusually introspective repository.** It
would change how every card in the project is dispatched. It is the most
valuable of the five if true and the least evidenced of the five as
measured.

**@human ruled to adopt with that in view.** The objection therefore
becomes this card's obligation: **the ADR SHALL argue the decision with a
measurement rather than record it as a preference**, and the rollout SHALL
be reversible.

## THE PREREQUISITE, AND IT IS NOT SMALL

**The graph cannot answer the question this ruling asks of it.**

- **`T-126-s4`, verified three independent ways during this session**: the
  indexer records `use` imports only, so a **`mod` declaration plus a path
  expression — the strongest dependency Rust has — produces ZERO edges.**
  `lib.rs` gained a real dependency on the dispatch component and the
  edge count did not move.
- **`T-010-s6`**: the Rust resolver emits **no `call` and no `type_ref`
  edges at all**, and states the omission in its own source.
- **There is no dependents view.** The graph is walked forward; nothing
  reverses it.

**So a blast-radius number computed against today's graph would
under-count Rust dependencies badly, and would do so silently** — the
number would look authoritative and be wrong in the direction that
matters, marking risky cards cheap. **Shipping the ceremony rule before
the graph can answer it would be worse than not shipping it**, because a
wrong number carries more authority than no number.

## Acceptance criteria

- **THE GRAPH SHALL RECORD `mod` DECLARATIONS AS EDGES**, and a pin SHALL
  show it does. **The pin SHALL fail against the pre-fix tree** — today
  `lib.rs`'s dependency on the dispatch module produces no edge, which is
  the whole finding (`T-080-s1`).
- **THE RUST EDGE COVERAGE SHALL BE ENUMERATED AND RULED ON, NOT
  SILENTLY WIDENED.** Say which edge kinds Rust emits after this card and
  which it still does not, and whether each omission is safe for a
  blast-radius count. **`T-010-s6` is the standing record of the gap** and
  SHALL be cited rather than rediscovered.
- **DEPENDENTS SHALL BE DERIVED, NOT STORED.** A reverse index that can
  disagree with the forward one is two implementations of the same fact
  (T-057). IF materialising it is necessary for cost THEN the derivation
  SHALL be the pin.
- **THE CEREMONY RULE SHALL NAME ITS THRESHOLDS AND SHALL JUSTIFY THEM
  FROM MEASURED DISTRIBUTION**, not from taste. Compute the dependent
  count for every component and every file the board's planned cards
  touch, state the distribution, and put the rungs where the data
  separates rather than at round numbers.
- **THE RULE SHALL DEGRADE SAFELY WHEN THE NUMBER IS UNKNOWN.** A card
  touching a path the graph does not cover — anything outside the walk,
  `docs/`, `method/`, `tools/` — SHALL get the HIGHER ceremony, never the
  lower. **An unmeasured blast radius is not a small one.**
- **AN ADR SHALL ARGUE THE DECISION WITH A MEASUREMENT.** @human's ruling
  is the authority; the ADR is the reasoning, and it SHALL include the
  architect's recorded objection and what would falsify the change.
- **THE ROLLOUT SHALL BE REVERSIBLE AND SHALL SAY HOW.** IF the rule
  misclassifies a card in practice THEN there SHALL be a stated way to
  override it per-card with a reason recorded, so a bad threshold costs a
  sentence rather than a re-ruling.
- **S/M/L SHALL NOT SIMPLY BE DELETED.** It carries planning information
  (how long the work is) that blast radius does not. Say what each field
  now means, or the two will drift into meaning the same thing badly.

Verification: headless — bare `cargo test --no-fail-fast` from
`app/src-tauri`, exit read **unpiped from `$?`**, the total **SUMMED from
the `test result:` lines and cross-checked against the `running N tests`
headers** — a mutant this session produced an ordinary-looking
`465 passed / 1 failed` while three bodies had vanished into an abort that
printed no result line at all. **`graph.json` SHALL be regenerated and its
movement stated**, and since this card deliberately adds edges, **the
byte/symbol/edge deltas are the deliverable rather than a side effect**.
**Ask GRAPH REGEN, never predict it, and ask AGAIN after any write** — a
regeneration has twice left every headline figure identical while the file
changed. **POISON DRILL on every new assertion**, producer mutated and
never the assertion, in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it, **OUTSIDE the repository** — and note the
pollution **outlives the mutants**: a stale binary in a drill's target
directory produced a plausible and entirely false defect report this
session. **Uniqueness of kill SHALL be measured against the whole suite.**
**This is an L card and owes a planning pass before any code.** @human:
one look at the final thresholds, because where the rungs sit is a
judgement about how much this project is willing to pay for safety.
