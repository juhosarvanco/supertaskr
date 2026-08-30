---
id: T-167-s8
title: The push ritual asks the graph mechanically — one seat broke ask-after-every-write three times in one day, and a rule a careful hand breaks thrice is a hook's job
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: integrator nputer-4e, third graph-staleness CI red of 2026-08-30
builder:
verifier:
built_by:
verified_by:
review:
---

Three CI runs redded on graph currency in one day, same seat, same
sequence each time: regen -> another edit to an indexed file (a pin
correction, a comment, a census row) -> push without re-asking.
STATE's rule ("ask AGAIN after every write") held every time in
retrospect and never at the moment — batching beats it out of a hand
that knows it. The classes the day already carded are siblings, not
this: T-167-s2 alarms on HEADROOM, T-167-s7 on degradation; nothing
guards CURRENCY at the push.

The ask: a mechanical pre-push check — `index --check` green or the
push refuses with the regen command printed. The seat decides the
home (a hook beside lane-fence.mjs, or a ritual line the push script
owns) and the escape spelling for the rare intentional push of a
stale graph (should not exist; argue it if found). Evidence: the
three run ids are in the day's records (T-143-s4's, the wave-3
record's addendum context, and this card's own filing red).

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p2**, at `@ 51fa31c0964c`. The parked-until-the-fourth
condition the card set for itself is superseded: this sitting is the
"next standing sitting" arm of its own RESURFACES line, and it fires
first. A rule broken three times in one day by a seat that had read the
rule is not a discipline problem any more.

**THE EVIDENCE, SAID AT THE STRENGTH THIS SEAT CAN ACTUALLY VOUCH FOR.**
The claim of a third instance is the FILER's, and this seat did not
re-read the CI runs — no run id is derivable from this checkout, and a
card that pretended otherwise would be inventing corroboration. What IS
derivable here, and does corroborate the class:
`command grep -n 'ask-after-every-write'
docs/checkpoints/2026-08-30-standing-triage-2.md` finds that record
naming the rule *"broken twice in one day"* at its own base, in a
sitting held hours before this card was filed. Two instances on the
record plus the filer's third is the pattern; the fourth is what this
card exists to make impossible.

**THE HOME IS STILL THE SEAT'S TO CHOOSE AND THE FENCE CARRIES BOTH.**
`.claude` is a real fence entry here — `git ls-files .claude` is three
tracked files (`hooks/lane-fence.mjs`, `hooks/lane-fence-hook.mjs`,
`settings.json`), and the existing wiring is a `PreToolUse` matcher on
`Edit|Write|NotebookEdit` pointing at the hook runner. A `Bash` matcher
is the obvious neighbouring shape, and it is the seat's call whether the
guard lives there or in a script `tools/e2e` owns. Both homes are inside
this fence, which is why the fence names both.

**ONE PROHIBITION ADDED AT PROMOTION, because it is the failure this
repository has already paid for.** The guard SHALL ask `index --check`
and read its exit; it SHALL NOT compute staleness itself. A second
implementation of the currency question is T-057's shape, and a guard
that disagreed with the gate would be worse than no guard — it would
teach the seat to override it.

**AND THE COST IS NAMED RATHER THAN DISCOVERED IN THE LANE.**
`index --check` is `cargo run -p nputer-index -- index --check
--root ../..` from `app/src-tauri/`, and CONVENTIONS' standing
cargo-cache-cliff hazard is about exactly how long that can take on a
cold or fat target directory. A guard that adds a slow, sometimes
minutes-long step to every `git push` will be disabled by the first
person it inconveniences. Deciding what the guard runs — the full check,
or a cheaper currency question that still delegates its verdict — is
part of this card, not a detail under it.

## Acceptance criteria

- WHEN a push of this repository is attempted AND the committed graph is
  not current, THE push SHALL be refused with the regen command printed
  verbatim in the refusal.
- THE guard SHALL derive its verdict from `index --check`'s own exit
  code, and SHALL NOT restate or re-derive the currency rule. WHERE the
  guard runs something cheaper than the full check, IT SHALL still take
  its VERDICT from the check rather than from its own reading.
- THE guard SHALL distinguish "the check could not run" from "the graph
  is stale" and SHALL NOT read the first as the second — `index --check`
  publishes exit 3 for a check that could not run and exit 1 for STALE
  (the exit legend is in CONVENTIONS' per-package bullet for the Rust
  workspace, read there rather than restated here), and a guard that
  collapsed them would refuse every push made without a toolchain.
- THE lane SHALL state, on this card, the wall-clock cost of what the
  guard runs, measured at its own ref, and SHALL argue that cost against
  the frequency of a push.
- WHERE an escape is provided at all, THE escape SHALL be explicit,
  spelled on the command line rather than in an environment default, and
  SHALL print what it is overriding. WHERE the lane finds no legitimate
  case for one, IT SHALL ship no escape and say so on this card — a
  hatch nobody needs is a hatch that gets used.
- THE guard SHALL NOT fire outside this repository's own checkouts, and
  SHALL NOT fire on a lane worktree's own pushes IF the lane cannot
  regenerate the graph inside its fence — the lane SHALL derive which of
  those is true rather than assume it.
- Verification: headless. A positive control in BOTH directions — a
  current graph pushes, a stale graph is refused, driven over a fixture
  rather than by making this repository's own graph stale.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-167-s8 --preflight` from tools/e2e at
`@ 51fa31c0964c` exits **1** with exactly ONE finding, and it is a live
lane: `T-154-s2` holds `.claude` AND `tools/e2e`, both of this card's
entries. That is a fact about the clock, not about the card, and it is
not dischargeable by a `PREFLIGHT RULING` line — the preflight says so
itself when one is tried. Every other claim class ran clean; the figures
are printed in this sitting's record.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

FOURTH STRIKE (2026-08-30, run on 2e4b76f's rerun): T-143-s3's merged code files pushed without their regen — masked in the original run because the cargo intermittent redded BEFORE the graph step ran, and revealed only when the rerun cleared cargo. A guard at the push would have caught it regardless of step order.

Absorbs: T-181

## ABSORBED AT STANDING TRIAGE SITTING #5 (2026-08-31): T-181 — the same argument, a second trigger

**T-181 was filed by the outgoing seat's observation and the incoming
seat's self-audit, and its own filer recommended this fold.** It shares
this card's fence exactly (`.claude`, `tools/e2e`) and its whole
argument; what it adds is a SECOND TRIGGER and the measurement that
earns it.

**THE MEASUREMENT, over two seats and one night (2026-08-30/31).** Split
the checkpoint's obligations by whether something mechanical fires them
and compliance separates completely. **Mechanically triggered — met
every time, by both seats**: the DOCS GATE, `index --check`, the
lane-fence hook, the governing-document budgets. Two of them caught real
defects in the seats' own work. **Memory-held — decayed inside one
session and then INHERITED**: the health bands were run zero times
across five records, the boot gate was leaned on second-hand from
in-lane runs, and the decay replicated because the outgoing seat's
records taught the incoming seat a checklist with the holes already in
it. **The first health run that was finally performed found
`docs-headroom/docs/STATE.md` BREACHED** — by the seat that had noticed
its warning twice that evening and deferred it twice.

**WHAT THE SECOND TRIGGER IS.** This card's own trigger is the PUSH.
The absorbed one is the COMMIT THAT ADDS A RECORD under
`docs/checkpoints/` — already the event the DOCS GATE's staleness rule
keys on — and what it demands is that the record CARRIES the readings:
a health-band census line and its exit, plus, where the merge's diff
meets BOOT GATE's own trigger, the boot check's exit and both `[nputer]`
lines.

**AND IT MUST DEMAND THE READING, NEVER THE VERDICT.** `npm run health`
exits 3 by design while four bands lack keepers, so a guard requiring
exit 0 would refuse every checkpoint forever — the same trap the AUDIT
GATE POLICY names about `--deny warnings`. Demand that the gate RAN and
was RECORDED.

**ADDITIONAL ACCEPTANCE, from the absorbed card:**

- WHEN a commit adds a record under `docs/checkpoints/`, THE guard SHALL
  refuse it unless that record carries a health-band census line and its
  exit, and — where the diff meets BOOT GATE's trigger — the boot
  check's exit and both `[nputer]` lines.
- THE guard SHALL demand that a gate RAN and was RECORDED, never that it
  PASSED.
- THE guard SHALL take BOOT GATE's trigger from the same place the
  written gate does rather than restating it, so the two cannot drift.
- IF the guard cannot run THEN it SHALL say so and ALLOW, never refuse
  silently — the lane-fence hook's own fail-open shape, for the same
  reason.
- THE lane SHALL state the second trigger's measured wall-clock cost
  against the frequency of a checkpoint, as this card's existing
  criteria already require for the push.

**WHAT THE FOLD DELIBERATELY KEEPS**: `cargo audit` was NOT absorbed. It
is already a CI step (`command grep -c "cargo audit" .github/workflows/ci.yml`
answers 2 at `1e886c0`), so it needs no guard — a fact the absorbed
card's own filer got wrong at first and corrected by checking.
