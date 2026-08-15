---
type: consultation
task:
status: open
max_rounds: 3
---

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
