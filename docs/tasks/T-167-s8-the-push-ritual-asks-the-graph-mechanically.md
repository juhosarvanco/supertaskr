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
