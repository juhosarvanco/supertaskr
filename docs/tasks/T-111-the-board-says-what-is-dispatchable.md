---
id: T-111
title: The board says what is dispatchable, and WHY the rest are not
feature: F-04
milestone: 4
priority: 4
size: M
status: planned
blocked_by: [T-110]
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

`method/roles/orchestrator.md:16` states the rule in one sentence:
*among the topmost undone tasks of each feature column, pick the
highest-priority one that is unblocked AND whose `touches:` don't
overlap any task currently building. Ceiling: 3–5 concurrent.* Half is
already built and unused — `app/src/architecture/task-waves.ts`
computes `ready`/`waits`/`blocked` from `blocked_by` as a pure function
for the map's tasks lens. **The missing half is the fence, and the
fence is where every mistake this week happened.**

**Measured, not anticipated — two things make it harder than the
sentence admits:**

**(a) The `touches` vocabulary is unnormalised and collides by
spelling.** `tools/e2e` appears alongside `tools/e2e/`, `method/`
alongside `method`, and one card carries a bare `docs`. A
string-equality fence reports two cards as disjoint that are not — the
exact failure a fence exists to prevent.

**(b) `app-shell` is one slug over the whole Tauri app** — the
`touch_slugs` value of C-05, C-10 and C-11, whose paths span
`app/src/**` *and* `app/src-tauri/**`, and roughly half the board holds
it. A frontier treating it as an atom refuses a Rust-only card because
a TypeScript-only card is in flight. **That is the coarseness working
as designed and this card SHALL NOT "fix" it** — splitting `app-shell`
is a registry change moving three fixtures and belongs in its own card
if wanted at all. What this card owes is a *reason string* honest
enough that a human can see it is the coarse fence rather than a real
overlap, and override deliberately. Two lanes did exactly that this
week (T-013 twice widened its own `touches` mid-lane, both widenings
ruled correct) — the frontier must make that visible, not silently
serialize.

## Acceptance criteria

- THE board SHALL derive, as a pure function of the parsed model plus
  T-110's lane set, one **disposition** per card: `dispatchable`,
  `blocked` (naming the unmet blocker ids), `fenced` (naming the
  overlapping token AND the lane holding it), `not-topmost` (naming the
  card above it in its column), `at-ceiling`, or `not-applicable`.
- **THE IN-FLIGHT SET SHALL BE THE LANE SET JOINED WITH `status:`, AND
  THEIR DISAGREEMENT SHALL BE VISIBLE** — not one or the other. T-089
  restored the pre-cut `building` stamp, so a live lane normally shows
  both; a stamp with no worktree is a dead lane and a worktree with no
  stamp is an unstamped dispatch. A pin SHALL drive all four states,
  including the two disagreements.
- **`touches` TOKENS SHALL BE NORMALISED BEFORE COMPARISON** — at
  minimum a trailing-slash rule — in **one function with its own pin**,
  never repeated at each comparison site. A pin SHALL show `tools/e2e`
  and `tools/e2e/` overlapping, driven from the live board's own tokens
  rather than a synthetic pair.
- **THE REASON SHALL BE RENDERED AS TEXT, not merely encoded.** A fenced
  card names the token and the lane; a blocked card names the blocker
  ids. **A disposition with no reason is not done being computed.**
- THE ceiling SHALL be a named constant with its own assertion matching
  `orchestrator.md`'s 3–5, and the disposition SHALL distinguish
  "nothing is dispatchable" from "the ceiling is reached" — different
  sentences to a reader.
- IF a card's `blocked_by` names an id that does not exist THEN the
  disposition SHALL be `blocked` and SHALL say the blocker is
  unresolved, rather than treating an unresolvable blocker as
  satisfied. The parser already emits `dangling-reference` with a
  near-miss hint; **consume it rather than re-deriving it** (T-057).
- IF a card is `done` or `parked` THEN it SHALL carry no disposition
  reason at all — progress must not acquire a scolding.
- **NO DISPATCH AFFORDANCE LANDS IN THIS CARD.** T-028's fence is
  enforced mechanically — `crescendo-dom.test.tsx` counts the
  completion panel's buttons and greps its text for `dispatch`/`run
  task`/`assign`, and `TaskDetailPanel.tsx` records that the mockup's
  dispatch footer is deliberately absent. Both SHALL stay green here,
  and this card SHALL name them so the brief card knows what it is
  moving.

Verification: headless — `npm test` from app/ over synthetic models
**and over this repository's own live board**, with the fence pin driven
from a fixture in which no card carries `building` (so the lane set
alone must produce the fenced result). Every new assertion poisoned and
shown RED at a commit. The DOCS GATE fires on the card; run what it
owes. **@human: whether the reason text reads as a help rather than a
scold** — listed explicitly, since a frontier that lectures gets
ignored.
