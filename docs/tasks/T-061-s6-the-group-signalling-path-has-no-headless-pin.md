---
id: T-061-s6
title: The group-signalling path has no headless pin — only a hand drill that boots the app, because the logic lives inside a closure the lane cannot import
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

T-061's first criterion is about three functions —
`groupAlive`, `signalGroup` and `reapOrphanedGroup` — and all three live
inside `main()`'s closure in
`tools/e2e/scripts/tauri-boot-check.mjs`, where they close over `pgid`
and `child`. **Nothing in `npm test` can reach them.**

That is not an oversight, it is T-046's ruling holding: the check calls
`main()` unconditionally at module scope, deliberately, because an
`import.meta.url === argv[1]` guard would turn the merge gate into a
silent exit 0 on any path mismatch. Importing the module launches the
app. So the split T-046 made — testable logic in `boot-port.mjs`,
unconditional entry point in the check — is the only shape available,
and T-061 pushed exactly one thing across that line:
`isSignalableGroup`, the guard that refuses pgid 0 and 1, which the lane
now pins in both directions.

**Everything else is pinned by a procedure that boots the app.**
`scripts/orphan-drill.mjs` reds against the pre-T-061 check (3 orphans,
port held) and passes against this one, which is real evidence and is
the strongest available — but it is not in `npm test`, it takes ~20 s
and a cargo build, and CONVENTIONS does not yet name it (`T-061-s5`).
The two branches of the liveness probe were each exercised by hand this
session and are recorded in T-061's notes; neither can red a suite.

**What would close it, and it is small.** Lift the three helpers into
`boot-port.mjs` as a factory taking its dependencies:

```js
export function groupSignaller(pgid, { kill = process.kill, now = Date.now } = {}) { … }
```

`process.kill` is the only impure thing they touch, and injecting it
makes every branch assertable with no processes at all:

- an EMPTY group (`kill(-pgid, 0)` throws ESRCH) ⇒ **nothing is
  signalled** — the branch that stops a recycled pid receiving a
  SIGTERM, and the one a naive `killTree("SIGTERM")` gets wrong;
- a LIVE group ⇒ exactly one `kill(-pgid, "SIGTERM")`, and the pgid is
  the one captured at SPAWN, not `child.pid` read at kill time;
- a group that outlives SIGTERM ⇒ escalation to SIGKILL after the
  grace, and not before;
- an EPERM group ⇒ treated as gone, never signalled anyway.

A fake `kill` that records its calls turns all four into ordinary
headless assertions, and the poison drill then has something to poison:
today, a mutation that deletes the `groupAlive()` guard reds **nothing**
in `npm test` and is caught only by a human running the orphan drill and
reading its transcript.

**Why T-061 did not do it.** The card's criteria are the child-exit
signal, the shipped drill, the overlay derivation, the four config
mutations, `checkJs`, the four exit paths and the default path's shape.
A refactor that moves the kill path into another module is a change to
the code that kills process trees beside a live app, made to serve
testability rather than a stated criterion, on a card that already
changes that code once — and the drill exists precisely so the change
that IS stated can be proved. Doing both in one diff would have made
neither reviewable.

**Its sibling, worth weighing at the same time.** The check prints
`[boot-check] child pid N; captured process group N (detached: setsid,
so pgid == pid)`. That line is the only externally visible evidence that
the capture happened, and the orphan drill deliberately does NOT parse
it — it derives the group from `ps` by ppid instead, so the drill works
identically against the pre-T-061 check. If the helpers move, the line
stays useful for a human and stops being the only witness.

---

## 2026-08-23 — INTEGRATOR: confirmed by mutation, not by argument (claude-opus-5 @T-061-integrate)

**Status stays `suggested`; this section records that the verdict
independently reached this card by measurement, which raises its
priority.** T-061's verifier filed it as their finding 3, having built
the mutant before reading that the executor had already filed the same
defect.

**Mutant C — the probe deleted**: the `!groupAlive()` guard removed from
`signalGroup` and the early return removed from `reapOrphanedGroup`.
Result: `npm test`'s `boot-check-guard` spec **14/14 green**, and the
shipped orphan drill **exit 0, PASS**. **Nothing in this repository,
automated or hand-run, can see the difference** — which is exactly what
this card says, now with a killed-mutant demonstration behind it rather
than a reading of the closure.

Two things sharpen the disposition:

- The drill CANNOT be the pin. It exercises the path where the group is
  still populated, so it passes with or without the probe; the probe's
  only job is the OTHER branch — refusing to signal an EMPTY group — and
  no procedure in the tree reaches that branch on purpose.
- What the probe buys is narrower than the card it defends claims (see
  `T-061-s8`): it refuses an empty group, and it is NOT recycling
  protection, because a recycled id that has become live again passes
  it. A pin should assert the narrow property, not the broad one, or it
  will encode the over-claim.

Merged at `ea7ea0a` with the defect live and unpinned, deliberately —
discharging a finding is triage's call, not the integrator's.
