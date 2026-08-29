---
id: T-149-s2
title: T-149's own success measurement is a census over card TEXT and cannot move from inside T-149's fence — twenty planned cards still claim app-shell for a test surface that is no longer the shell's
status: parked
suggested_by: executor claude-opus-5 @T-149
---

**T-149's card names its own measurement: "Before: 20 of 34 planned
cards touch `app-shell`. Re-derive that number after." It is 20 after,
and it was always going to be.** Said plainly here because the number
will be read as a failure otherwise, and it is not one.

## The mechanism, and the T-142 control that proves the census works

"A planned card touches `app-shell`" is a census over the STRING
`app-shell` in a card's `touches:` list. T-149 edits component
`paths:`. **No registry edit can move a token a card has already
typed.** Measured with one query binary against three trees:

    base 23ee41b                         planned 34   touching app-shell 20
    lane bf09a57 (routing applied)       planned 34   touching app-shell 20
    base + ONE planted change            planned 34   touching app-shell 19

The third row is `T-142`'s positive control, planted and restored in a
detached scratch worktree: flipping `T-022`'s `touches: [app-shell]` to
`[app-board]` and nothing else takes the census to 19, so the query is
demonstrably capable of returning a different number and the 20/20 is a
fact about the cards.

## What DID move, and it is the same 59% by a different route

Derived through the built parser's own `slugPathIndex` + `expandFence`,
which is the code the dispatcher uses:

    app/test files each SLUG reserves      base 23ee41b     lane bf09a57
      app-shell                                49 of 49        20 of 49
      app-map                                   0               16
      app-interview                             0                7
      app-board                                 0                5
      app-agent                                 0                1

**Twenty-nine of the forty-nine test files left the `app-shell` fence.**
The 20 that remain are C-05's sixteen shell tests plus C-10's four —
C-10 carries `touch_slugs: [app-shell]` too, which is why routing a
watcher test is a truth repair and not a throughput one.

## The work, and why this lane could not do it

Each of the twenty cards below claims `app-shell`. For most, the claim
exists because the card must write an `app/test/**` file that C-05
owned. That file now belongs elsewhere, so the claim can narrow — but
narrowing it means editing twenty cards under `docs/tasks/`, and
**`docs/tasks` is in `UNFENCEABLE_PATHS` (`lib/parser/src/fence.ts`)**:
no card may fence it, so no card can reserve those twenty files while it
rewrites them. T-149's fence is
`[docs/architecture/components/, app-shell, app-map]` and reaches none
of them.

    T-015  T-022  T-032  T-035  T-044  T-059  T-065  T-068  T-071  T-075
    T-087  T-094  T-099  T-100  T-106  T-114  T-115  T-117  T-125  T-140

**IT IS TWENTY JUDGEMENTS, NOT TWENTY EDITS.** `T-022`
(front-door-persistence) is genuinely about the shell and keeps its
claim; `T-015` (layout-pins, `[app-map, app-shell, tools/e2e]`) very
likely does not. Each card has to be opened and asked *which files does
this actually write*, and a card whose fence turns out to be one file
short is worse than a card that waited — the standing lesson from
T-128's re-fence note in STATE.

## Two cautions for whoever takes it

1. **Verify with `brief.mjs --task` AFTER the card is committed, never
   in tokens.** STATE's own *Next up* item 1 says this about re-fencing,
   and the C-11 seam is why: `app-board` and `app-shell` both name C-11,
   so a card that drops `app-shell` for `app-board` has not become
   disjoint from a shell lane. The census above shows it — the
   fence-overlap derivation stays at 21 across all three trees while the
   literal one moves.
2. **This is triage's call, not an executor's.** Re-fencing is a change
   to what a card may dispatch against, which is the orchestrator's
   question.

Amnesty triage 2026-08-29 (triage seat): PARKED — the census is CORRECT and its non-movement is expected — no registry edit can move a token a card has already typed — and the card says so plainly with a T-142 positive control proving the query can return a different number. The throughput gain T-149 was for DID land, by the other route: the app/test files app-shell reserves went 49 of 49 to 20 of 49, with the rest distributed to app-map, app-interview, app-board and app-agent. What is left is per-card ARCHITECT judgement — whether each of the twenty still needs the slug at all — and that is a placement field, so it is the single-writer seat's and no lane's. RESURFACES: the next planning or re-fencing pass, or the next time app-shell is measurably the board's binding constraint (derive it). Read it with T-127-s2, parked at the same seat, which asks whether C-10 should have a slug word of its own — the same pass can answer both.
