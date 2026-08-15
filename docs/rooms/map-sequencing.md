---
type: consultation
task:
status: resolved
max_rounds: 3
---

## Resolution
- **Question** — what runs as milestone 2: the architecture map
  (F-06) or the in-app interview (F-03)?
- **Decision** — the map VERTICAL SLICE only: T-008 → T-009 → T-011 →
  T-012 (the screenshot on nputer's own repo) is milestone 2; F-03
  (in-app genesis) is milestone 3; T-010/T-013/T-014/T-015 re-enter
  after F-03 (milestone 4). Chosen by @human, 2026-08-15. Milestone-
  order rule holds: nothing in 2 dispatches before T-006 closes
  milestone 1.
- **Why** — the slice buys the second hero surface and immediate
  drift-dogfooding on this repo at a bounded delay to the interview,
  while the expensive remainder (Rust language support, CLI binary,
  semantic zoom, pins) defers to where NORTH_STAR's interview-first
  logic governs. Rejected: (a) full map first — delays the product's
  core (the interview IS the product; the middle of the workflow is
  absorbable, per competitors.md) for features the screenshot doesn't
  need; (b) interview first — spends none of the fresh, fully-specced
  map plans, loses the launch post's second image, and the slice's
  cost is small enough that the trade is favorable.
- **Changed** — docs/ROADMAP.md (milestone 2 fixed to the slice,
  milestone 3 = F-03, deferred F-06 remainder noted);
  docs/tasks/T-010/T-013/T-014/T-015 frontmatter milestone 2 → 4;
  docs/STATE.md next-up and open questions.

## @planner (claude-fable-5 @chat-session) — 2026-08-15

F-06 (architecture map) is promoted: backbone entry, ADR-013/014/015,
tasks T-008…T-015 decomposed and parked below the slice line. One
question remains, and per the promotion rule it is the human's:
WHERE does F-06 run, and what visibly moves down?

The tension, stated honestly:
- FOR building the map next: it is the second hero surface and the
  launch post's second image; it dogfoods on this repo immediately
  (drift findings on our own code before launch); the indexer is the
  only genuinely hard engineering in the near roadmap and de-risks
  early; momentum and the prepared plans are fresh.
- AGAINST: NORTH_STAR says the interview is the product and F-03 is
  its first in-app incarnation; the competitors research says the
  BEGINNING of the workflow is the defensible ground while the middle
  "demos well and gets absorbed by platforms" — the map is
  spectacular middle; success criteria 2–3 (30-minute magic moment,
  outside users dispatching from their own boards) both need F-03,
  not F-06; drift detection was consciously parked at Horizon
  (future.md) and ADR-013 already pulls a slice forward.

Options:
- (a) Map next: milestone 2 = F-06 (T-008…T-015, vertical slice
  first: T-008 → T-009 → T-011 → T-012); F-03 becomes milestone 3.
- (b) Interview next: milestone 2 = F-03; F-06 becomes milestone 3;
  the map plans wait fully specced (they age well — ADRs fix the
  contracts).
- (c) Slice compromise: milestone 2 = F-06 vertical slice ONLY
  (T-008, T-009, T-011, T-012 — the screenshot), T-010/T-013/T-014/
  T-015 parked behind F-03; milestone 3 = F-03.

T-006 (design language) closes milestone 1 regardless and is
unaffected — it proceeds when the token sheet returns. @human

## @human — 2026-08-15

Map slice first (option c).
