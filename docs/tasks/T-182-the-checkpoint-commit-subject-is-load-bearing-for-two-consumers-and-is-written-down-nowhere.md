---
id: T-182
title: The `Checkpoint:` commit subject is load-bearing for TWO consumers and is stated as a rule nowhere — a seat wrote six records in one night without it and neither consumer complained
feature: F-01
milestone: 4
priority: 13
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: architect/integrator seat @T-153-s8's integration (2026-08-31) — found by a health band that could not see its own remedy
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY A BAND THAT COULD NOT SEE ITS OWN REMEDY.** At `T-153-s8`'s
integration, `npm run health` reported
`triage/net-arrivals-per-window: 10 cards … 0 dispositioned` — **after a
triage sitting that had dispositioned five of them an hour earlier.**
The band was not wrong; its WINDOW had never moved.

## The mechanism

The band measures *since the newest `Checkpoint:` commit*. Its own
derivation line names the anchor:

    derivation  since the newest Checkpoint: commit 4e08d29 —
    10 suggestion card(s) added, 0 dispositioned, net 10

`git log --format='%h %s' -1 4e08d29` answers
`Checkpoint: T-167-s1 closed — …`. **Every checkpoint commit this seat
wrote on 2026-08-30/31 opens with the card id instead** — `T-140-s4
closed: …`, `T-112-s3 closed: …`, `Standing triage sitting #5: …` — so
the anchor never advanced, and the band spent the whole night measuring
a window that had closed the previous evening.

## The second consumer, which is the reason this is a card and not a note

`docs/CONVENTIONS.md`'s DISPATCH bullet: *"cut a task branch from the
newest `Checkpoint:` commit on main"*, and later *"cut from a commit
whose gates are green, which the newest `Checkpoint:` always is and a
merge commit never is."* **That rule reads the same marker.** With the
marker absent for a night, "the newest `Checkpoint:` commit" pointed a
day into the past, and every brief assembled in that window printed that
stale hash as its `create:` base.

**NOTHING WENT WRONG, AND THAT IS THE FINDING.** Six lanes were cut from
dispatch-stamp commits instead — permitted by the bullet's own reading
(*a non-merge commit later than the checkpoint is equally safe PROVIDED
its own gates are green*), gates green each time, verified. So both
consumers degraded silently: one printed a stale-but-harmless base, the
other measured a window that would not close. **A marker two rules
depend on went missing for a night and neither rule could say so.**

## What is actually missing

`command grep -rn "Checkpoint:" docs/CONVENTIONS.md method/docs-protocol.md
method/roles/integrator.md` filtered for commit/subject/prefix/message
returns only the two DISPATCH-bullet references above — both of which
CONSUME the marker. **No file states the rule that produces it.** The
convention is inherited by reading `git log`, which is exactly the way a
practice decays when the seat changes: this seat ramped up on records,
and a record does not carry its own commit subject.

## What a fix decides

1. **Where the rule is written.** `method/roles/integrator.md` is the
   role that writes checkpoints, and the marker is generic (any project
   using this method needs it) — but that file is NOT in `KIT_FILES`, so
   the bump question is real and belongs to triage. `docs/CONVENTIONS.md`
   is the project-local alternative and is this card's declared fence.
2. **Whether it stays a convention or becomes a check.** The
   `T-167-s8`/`T-181` guard already fires on the commit that adds a
   record — asserting that commit's SUBJECT is the same event, and
   nearly free once that guard exists. Say whether it joins there rather
   than building a second mechanism.
3. **Whether the band should anchor on something more durable** than a
   commit subject. That is the `crate-index`/`tools/e2e` half and is not
   this card's fence; name it if the answer is yes.

## Acceptance criteria

- `docs/CONVENTIONS.md` SHALL state, where a reader writing a checkpoint
  will meet it, that the checkpoint commit's subject opens with
  `Checkpoint:`, and SHALL name BOTH consumers so the next seat learns
  why rather than obeying a style rule.
- THE statement SHALL cite the consumers rather than restating their
  logic — the dispatch bullet and the health band's own config.
- THE lane SHALL re-derive both consumers at its own ref rather than
  taking this card's reading.
- Verification: headless. `npm run lint:docs` and the CONVENTIONS-reading
  specs, which are the suites a bullet edit owes.
