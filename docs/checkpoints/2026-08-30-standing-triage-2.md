# Checkpoint: standing triage sitting #2 (2026-08-30, architect seat, no merge)

The `triage/live-suggestions` band was DRIFTING at 22 against a drift
line of 20, and this sitting is the band's own answer. **The suggested
column is 22 -> 0.** No merge, no lane, no code: the whole sitting is
`docs/tasks/**` plus this record.

## The band, before and after — the figure that called the sitting

    node scripts/brief.mjs --state          # from tools/e2e/, the BOARD section
    git grep -l "^status: suggested" -- docs/tasks/ | wc -l

**Before: 22** — read at `@ a63f9b6a65732a216d6f868211cac9ab7654920d`
(the T-167 checkpoint's tip, where STATE routed the alarm) and again,
unchanged, at this sitting's base `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`.
**After: 0.** The band's drift line is 20 and its breach line 40, both
in `tools/e2e/scripts/health-bands.config.mjs` with the amnesty's
measured reason beside them; a band that reads 0 is CLEARED, not
merely under.

Board after the sitting, same command: building 1 / done 137 /
parked 130 / planned 76 / flat task files 344 / in rejected/ 38.

## The tally — 22 cards, four dispositions, and one card unparked

**10 PROMOTED from the suggested column**, plus **`T-025-s4` UNPARKED
AND PROMOTED** because its own unpark condition had fired — eleven
promotions in all. **2 ABSORBED** into one carrier and removed in this
commit. **8 PARKED**, each with a resurfacing condition somebody can
check without remembering the card. **2 ARCHIVED AS DISCHARGED** to
`docs/tasks/rejected/`, the reasoning line saying *discharged* rather
than *declined*, because the distinction is invisible in the status word
and is the one a later reader needs.

| card | disposition |
|---|---|
| T-167-s2 | PROMOTED F-06 p1, NARROWED to the tripwire |
| T-025-s6 | PROMOTED F-03 p2, shape 1 RULED, fence corrected |
| T-167-s1 | PROMOTED F-03 p3, the BUMP QUESTION RULED |
| T-025-s4 | UNPARKED + PROMOTED F-03 p4 |
| T-143-s1 | PROMOTED F-06 p3 — the carrier, `Absorbs: T-162-s2, T-168-s1` |
| T-143-s3 | PROMOTED F-06 p6, the shared-helper question ruled OUT of it |
| T-111-s11 | PROMOTED F-06 p12, as filed |
| T-156-s5 | PROMOTED F-06 p14, as filed |
| T-111-s12 | PROMOTED F-01 p15, one preflight correction |
| T-156-s6 | PROMOTED F-06 p17, headline re-derived and moved |
| T-163-s3 | PROMOTED F-06 p18, RETITLED and REFENCED onto its surviving half |
| T-162-s2, T-168-s1 | ABSORBED into T-143-s1 |
| T-163-s1, T-163-s2 | ARCHIVED — discharged, verified at this sitting |
| T-018-s2, T-143-s2, T-143-s5, T-147-s1, T-147-s2, T-162-s1, T-167-s3, T-167-s4 | PARKED |

## Preflight — every promotion, and the one that refused

`node scripts/brief.mjs --task T-NNN --preflight` from tools/e2e/, all
eleven at `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`: **eleven exit 0**,
every card ruled `startable`, no dangling ref, no census claim, no
stale figure. `T-160-s4` re-run after its corroboration was appended:
still exit 0.

**ONE PROMOTION WAS REFUSED AND CORRECTED RATHER THAN RULED.**
`T-111-s12`'s first run exited 1: `UNCOVERED CRITERION PATH … lib/parser
— reserved by lib-parser, which this fence does not carry`. The
criterion named that package as a BUILD step and the tool cannot tell a
build order from a write target. Fixed in the criterion — the build
order stated without the path token, plus the sentence that building is
not writing — because a ruling would have left the same ambiguity for
the next reader. The correction is stamped on the card, dated.

## Six needle-checks that changed a disposition

1. **`T-167-s2` is not a three-shape card any more.** Shape 1 (raise the
   cap) is CLOSED — `docs/tasks/rejected/T-151-…` carries @human's
   rulings-sitting decision of 2026-08-30 rejecting exactly that. Shape 2
   (shrink what is emitted) IS `T-140-s1`, the ruled fix, blocked on
   `T-135`. So the promotion took the half neither covers: the tripwire.
   Corroborated by the sitting's own base commit — `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`
   is a graph regen whose subject records the ask-after-every-write rule
   broken twice in one day. Headroom is now derivable without a build:
   `wc -c docs/architecture/graph.json` is 1032605 against the crate's
   1040000, leaving 7395.
2. **`T-156-s6`'s headline had healed under it.** The card says the four
   unkept bands have "no landed readings". Re-derived here:
   `Gate runtime:` appears in 5 records, `Cold start:` and
   `Drift incidents:` in 3 each (`grep -l "<marker>" docs/checkpoints/*.md
   | grep -v TEMPLATE`). Step 1 of its own sequence is RUNNING. The
   promotion takes the two stale keeper strings and explicitly refuses
   the authority flip, recording the census so the next reader starts
   from a number.
3. **`T-163-s3` was going to be archived and is not.** Its filed half is
   genuinely discharged — verified here, not taken on the stamp's word.
   But the sitting's sweep found the ruling's LAST LIVE COPY in
   `docs/CONVENTIONS.md`: the SHIPPED PARTITION bullet still says *"C-11
   is `non_code: true`, carries two slugs, and ships"*, and
   `grep -h '^touch_slugs:' docs/architecture/components/C-11-design-tokens.md`
   answers the empty list. That file was outside every fence that fixed
   the other four places — which is the hazard the card itself named.
   Retitled, refenced to `[docs/CONVENTIONS.md]`, promoted.
4. **`T-025-s6`'s urgency is now history rather than forecast.** The one
   authorized real run HAS been taken (`T-025-s2` is `done`; the capture
   is `docs/research/captures/real-planner-turn-2026-08-30.txt`). The
   surviving consumer is @human's GENESIS WALK, and a body equally green
   on an auth failure would misreport it. Shape 1 ruled; shape 2 declined
   with its reason kept.
5. **`T-168-s1` refutes the fix the other two cards imply.** The
   collision is NOT `tools/e2e`-specific: T-168's lane saw the same two
   bodies red through a `docs/checkpoints/` overlap. So "pick a fence
   today's lanes do not hold" is not a fix, and the carrier says so.
6. **Two fences were corrected at promotion.** `T-025-s6` carried a bare
   `app/src-tauri/tests`, whose one relevant file the `app-agent` slug
   reserves — the shape `T-160-s4` exists to refuse. `T-167-s1` carried
   `[method/runtime]`, a directory that also reaches a `KIT_FILES` entry;
   narrowed to the one document plus `app-agent`.

## Two rulings taken at the seat, because a lane may not take them

- **`T-167-s1`: NO METHOD VERSION BUMP IS OWED.** Both tests re-derived
  at HEAD rather than read off the card: `git grep -h 'rel: "'
  app/src-tauri/src/agent/kit.rs` prints fourteen entries and the only
  `runtime/` one is `nputer.yaml`, so the schema document is not shipped
  bytes; and `.nputer/sessions.json` is runtime state, not a card, room,
  brief or role contract. Recorded on the card so nobody re-derives it.
- **`T-143-s3`: the shared renderer is NOT built there.** The four copies
  of that sentence live in three packages, so one helper cannot be
  written from inside `app-board` — a criterion ordering it would be the
  defective-card shape TASK-FORMAT rules on. The lane routes the argument
  if it still holds after the instance.

## What the sitting deliberately did not do

`T-143-s2` (the ledger's name-join versus a fence's region) is PARKED,
not declined: two tokens of live magnitude, the reader-side caveat
already printed by `brief.mjs --state`, and four open design questions
that are a pass rather than a repair. Its resurfacing condition is the
disagreement itself — a slug row reading FREE while `--task` answers
OVERLAP through that same slug — which any dispatcher meets with two
commands already in the ritual.

## Owed after this record

- **@human — ONE item routed: `T-162-s1`.** ADR-019 §Budgets legislates
  `warn = landed × 1.25`, so compaction buys LESS absolute runway than it
  costs, and two instruments the decision does not name exist (a byte
  FLOOR; a per-merge DELTA budget). Only @human can move that formula.
  Parked with the ruling as its condition, beside
  `docs/rooms/governing-docs.md`.
- **THE INTEGRATOR — `npm run lint:docs` WAS NOT RUN HERE** and neither
  was any suite: this seat runs `tools/e2e` scripts only, and the docs
  gate is suite-adjacent. **Expect it to red on this very record.** The
  gate refuses while a checkpoint record's last commit is newer than
  `docs/STATE.md`'s, this seat is forbidden `docs/STATE.md`, and so the
  hand-off is by construction: regenerate STATE against this record and
  the exit-1 goes. That is the ORIGINAL slip the gate was promoted to
  catch, arriving on purpose — not the amended-record variant
  `T-143-s5` parks.
- **The graph was not asked.** The sitting wrote `docs/tasks/**` and this
  file only, and `docs/` is excluded from the walk — but the rule is ASK
  IT, never predict, and this seat did not.
- **`docs/CAPABILITIES.md` is untouched**: no spec file moved, so no
  behaviour sentence moved.

## Metrics (ADR-020)

Rework cycles: 0. Preflight refusals: 1 of 11, corrected in the
criterion. Lanes before and after: NONE. Tokens and wall clock: NOT
DERIVABLE at this seat — no meter was read, and this record refuses to
invent them rather than print a confident wrong figure.
