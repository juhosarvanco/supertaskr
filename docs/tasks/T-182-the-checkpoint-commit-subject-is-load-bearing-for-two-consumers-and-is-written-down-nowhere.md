---
id: T-182
title: The `Checkpoint:` commit subject is load-bearing for TWO consumers and is stated as a rule nowhere — a seat wrote six records in one night without it and neither consumer complained
feature: F-01
milestone: 4
priority: 13
size: S
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: architect/integrator seat @T-153-s8's integration (2026-08-31) — found by a health band that could not see its own remedy
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review: self-verified
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

## Implementation notes (executor, 2026-08-31)

**WHAT LANDED.** One new named bullet in `docs/CONVENTIONS.md`,
`THE CHECKPOINT COMMIT'S SUBJECT OPENS WITH \`Checkpoint:\``, placed
immediately after `HEALTH BANDS AT THE CHECKPOINT` and before
`POISON DRILL`. That adjacency is the criterion "where a reader writing a
checkpoint will meet it": the bands bullet is the one a seat reads AT the
checkpoint, and it is also consumer one's home. **+1,864 bytes**, no
other file touched.

**BOTH CONSUMERS RE-DERIVED AT `bd8a8e8`, NOT TAKEN FROM THE CARD.**

- Consumer one, the dispatch base: the DISPATCH bullet in this same file.
- Consumer two, the band: `newestCheckpoint` in
  `tools/e2e/scripts/health-bands.mjs`, which shells
  `git log -1 --grep=^Checkpoint: --format=… HEAD` and anchors
  `triage/net-arrivals-per-window` in `health-bands.config.mjs`
  (drift 9, breach 40).

**THE CARD'S "SIX RECORDS" IS AN UNDERCOUNT — the derived figure is
TWELVE.** Over `4e08d29..b737b53`, 13 first-parent commits added a record
under `docs/checkpoints/` and **only the last carried the marker**:
`git log --first-parent --diff-filter=A --format='%h|%s' 4e08d29..b737b53 -- docs/checkpoints/`.
Six is defensible under a narrower reading (card-closing records only);
twelve is the count under the event the guard would actually key on,
which is the number that matters for the routed trigger.

**A MEASURED FACT THE CARD DID NOT HAVE: `--grep` IS NOT SUBJECT-ONLY.**
`--grep=^Checkpoint:` anchors to the start of ANY LINE of the whole
message, body included. Proved by positive control in a throwaway repo
rather than asserted: a commit whose subject was
`A plain subject with no marker`, carrying `Checkpoint:` only on a BODY
line, WAS matched. In this repository the divergence has never fired
(0 of the `--grep` hits on main have a non-marker subject at `bd8a8e8`),
but it is a latent false-anchor channel in consumer one, and it means a
guard asserting the SUBJECT is strictly NARROWER than the band's reader.
`newestCheckpoint` has no spec of its own at `bd8a8e8`.

## What is ROUTED, and why this lane could not mechanise it

**THE TRIGGER IS OUT OF FENCE AND IS NOT WIDENED.** A mechanical check
needs `tools/e2e` (the band's reader and its specs) and `.claude` (the
hook home); this card's fence is `[docs/CONVENTIONS.md]`. **Routed to
`T-167-s8` as a THIRD trigger** rather than built as a second mechanism:
that card's absorbed `T-181` trigger is already *the commit that adds a
record under `docs/checkpoints/`* — the identical event — and it already
holds the `.claude`/`tools/e2e` fence in a live lane.

What that trigger must touch, stated so the sibling need not re-derive
it: assert the subject of any commit adding under `docs/checkpoints/`
matches `^Checkpoint:`; take the marker from ONE place shared with
`newestCheckpoint` so the guard and the band cannot drift; prefer the
PUSH-side walk over a commit-time refusal, because a subject is still
repairable before the push and not after; and fail OPEN with a message,
the shape the lane-fence hook already uses.

**THIS IS PROSE, AND THE CARD SAYS SO IN ITS OWN TEXT.** Until
`T-167-s8` lands the trigger, nothing fires; the bullet states the rule
and names its own missing mechanism rather than implying coverage.

## Integrator review (self, no verifier owed — S, diff outside shipped code)

**WHAT I REVIEWED.** The diff is 31 lines in one file. I re-derived both
consumers at my own ref; I checked the new bullet against the mechanical
readers of this file and found and FIXED a real defect of my own making —
the first draft cited consumer one by quoting `DISPATCH FROM THE LAST
CHECKPOINT` verbatim, which took `rawBullet`
(`tools/e2e/scripts/dispatch-brief.mjs`) to two matching bullets and red
**11 bodies** across `range-rule`, `brief` and `card-preflight`. The
citation now spells that bullet's name around, and the bullet records
why. I then re-checked all **8** phrases any reader requires unique
(`THE LANE PROTOCOL`, `DISPATCH FROM THE LAST CHECKPOINT`,
`Fresh-clone ORDER`, `PORT RULE:`, `THE RANGE RULE:`, `BOOT GATE (T-046`,
`GRAPH REGEN (T-009-s1`, `DOCS GATE (T-084`) — each matches exactly one
bullet. The bullet's opener is deliberately not gate-shaped, so
`standingGates` does not enumerate it as a gate.

**WHAT I COULD NOT REVIEW.** No blind pass exists on this diff — I read
my own reasoning by construction, hence `review: self-verified`. I did
not exercise the routed guard, because it does not exist. I could not
run anything under `tools/e2e`'s own fence beyond reading it.

**GATES.** `npm run lint:docs` exit **0** (budgets hold, 4 gated). The
CONVENTIONS-reading specs **212 passed, exit 0** — identical to the
pre-edit baseline of 212. `npm run health` exit **3** (the designed
answer while four bands lack keepers): **14 bands — 7 inside, 0 drifting,
0 BREACHED, 3 unread, 4 UNKEPT**. Byte band: 145,583 -> **147,447**
(+1,864) against warn 164,393 / fail 197,271; headroom **10.31%**, above
the 10% drift line with 506 bytes to spare. GRAPH REGEN, BOOT GATE and
METHOD EVAL GATE are NOT owed — the diff is docs-only and touches no
`.ts/.tsx/.js/.jsx/.rs`, no `app/**`, no manifest, no `method/**`.

**ONE FINDING ROUTED RATHER THAN WRITTEN**, since it is another live
lane's card and not mine to edit: `T-167-s8`'s subject IS a guard, and
TASK-FORMAT's rule *"A GUARD-CLASS CARD REQUIRES `review: independent`,
AND THE FIELD IS SET AT DISPATCH"* applies to it — but its `review:`
field is empty at `bd8a8e8` and its lane is already live.
