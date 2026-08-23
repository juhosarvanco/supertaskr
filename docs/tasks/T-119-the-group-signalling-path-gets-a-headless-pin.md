---
id: T-119
title: The group-signalling path gets a headless pin, the drill stops calling a link failure a leak, and the two sentences claiming pid-recycling protection say what the probe actually buys
feature: F-02
milestone: 4
priority: 58
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** This
> card's fence collides with `T-118`, `T-120` and `T-090`, all
> `[tools/e2e]` or a superset; none may run concurrently. `T-061-s5`
> (CONVENTIONS does not name the orphan drill) was absorbed by `T-090`
> at this same triage, so the naming half referenced below belongs
> there, not here.

Absorbs (seventh triage, 2026-08-24): T-061-s6, T-061-s7, T-061-s8 —
files removed in this commit.

T-061's first criterion is about three functions — `groupAlive`,
`signalGroup` and `reapOrphanedGroup`. **Nothing in `npm test` can reach
any of them, and a killed mutant proves it.**

## Why nothing can reach them, measured at `6b0cf47`

All three are `const` arrow functions declared INSIDE `main()`'s closure
in `tools/e2e/scripts/tauri-boot-check.mjs` — `main()` spans lines
141-484 and is called unconditionally at 486 — where they close over
`pgid` and `child`. **That is not an oversight, it is T-046's ruling
holding**: the check calls `main()` at module scope deliberately,
because an `import.meta.url === argv[1]` guard would turn the merge gate
into a silent exit 0 on any path mismatch. Importing the module launches
the app. The split T-046 made — testable logic in `boot-port.mjs`, an
unconditional entry point in the check — is the only shape available,
and T-061 pushed exactly one thing across that line: `isSignalableGroup`,
which refuses pgid 0 and 1 and which `boot-check-guard.spec.ts` pins in
both directions.

**Everything else is pinned by a procedure that boots the app.**
`scripts/orphan-drill.mjs` reds against the pre-T-061 check and passes
against this one — real evidence, and the strongest available — but it
is not in `npm test`, it takes ~20 s and a cargo build.

**AND THE MUTANT IS ALREADY KILLED.** T-061's verifier built it
independently, before reading that the executor had filed the same
defect: **mutant C — the `!groupAlive()` guard removed from
`signalGroup` and the early return removed from `reapOrphanedGroup`.**
Result: `boot-check-guard` **14/14 green**, and the shipped orphan drill
**exit 0, PASS**. Nothing in this repository, automated or hand-run, can
see the difference.

**The drill CANNOT be the pin.** It exercises the path where the group
is still populated, so it passes with or without the probe. The probe's
only job is the OTHER branch — refusing to signal an EMPTY group — and
no procedure in the tree reaches that branch on purpose.

## What the probe actually buys, and the two sentences that claim more

The verifier measured all three states headlessly, with detached
`sh -c "sleep N & exit 0"` trees that bind no port:

| state | `kill(-pgid, 0)` | what an unguarded signal hits |
|---|---|---|
| leader reaped, member alive | ALIVE | the right tree — the fix signals here, correctly |
| group empty, id not yet reused | ESRCH | nothing; harmless **today** |
| id now names a LIVE stranger | **ALIVE** | **the stranger — and the fix kills it too** |

**So the probe buys exactly one thing: it refuses to signal an EMPTY
group.** A recycled id that has become live again passes it. Two
sentences in the tree claim more. The first is the comment above the
capture in `tauri-boot-check.mjs`, still present at `6b0cf47`:
*"Capturing it here rather than reading `child.pid` at kill time is the
whole point"*. Measured: `child.pid` is the **same integer after the
`exit` event** (81368 → 81368), so `-child.pid` read at kill time names
exactly the group the spawn-time capture names. Capturing at spawn is
**type hygiene** — one known-good moment to evaluate `isSignalableGroup`,
and one `undefined` branch removed — not recycling protection. The
second is T-061's own criterion, which frames capture + probe as closing
the recycling hole; it **narrows** it. `groupAlive`'s own comment is the
one that gets it right and is the model: *signal only a group that still
has members*.

Recycling is not hypothetical here — sequential allocation with a 99999
ceiling, and the pid space wrapped inside both the executor's run and
the verifier's. Nobody should widen the fix for it; the cost of the
over-claim is that the next person to touch this path reasons from a
handled case that is not handled.

## The drill's loudest verdict is reachable having spawned nothing

`orphan-drill.mjs` imports `isSignalableGroup` from `./boot-port.mjs`
with a STATIC import (verified at `6b0cf47`). That symbol does not exist
at `2036fb2` — T-061 is the commit that adds it — so the procedure
T-061's own notes prescribe under *"THE FAILING CASE, REPRODUCED FIRST"*,
byte-copying both scripts from a pre-fix ref, **cannot work**. The drill
dies at ESM link time, before `main()`:

    SyntaxError: The requested module './boot-port.mjs' does not
    provide an export named 'isSignalableGroup'
    DRILL_PREFIX_EXIT=1

Exit 1 is `EXIT_LEAK` — *the boot check left orphans and the port is
still held* — reached by a script that probed nothing and spawned
nothing. `EXIT_CANNOT_RUN` (3) exists in that file for precisely this
case and **cannot be reached**, because the failure happens before
`main()` and therefore before any `try` the script owns. It is a false
ALARM and never a false green — the output is an unmistakable stack
trace — but the four-code contract is the machine-readable half, and
this is the third instance of *the could-not-run case borrowing another
code* (`T-084-s6`, `T-080`'s exit-3 row).

## Acceptance criteria

- **THE THREE HELPERS SHALL BECOME REACHABLE FROM `npm test` WITHOUT
  BOOTING THE APP**, by lifting them into `boot-port.mjs` as a factory
  that takes its impure dependency (`process.kill`, and a clock if the
  grace is asserted) rather than closing over it. `tauri-boot-check.mjs`
  SHALL keep its unconditional `main()` — T-046's ruling is not reopened
  by this card.
- **FOUR BRANCHES SHALL EACH HAVE A PIN, DRIVEN BY A FAKE `kill` THAT
  RECORDS ITS CALLS**, with no processes spawned: an EMPTY group
  (`kill(-pgid, 0)` throws ESRCH) is **not signalled at all**; a LIVE
  group receives exactly one `SIGTERM` **on the pgid captured at spawn**;
  a group that outlives the grace escalates to `SIGKILL` **after** it and
  not before; an EPERM group is treated as gone and never signalled.
- **THE PIN SHALL ASSERT THE NARROW PROPERTY, NOT THE BROAD ONE.**
  "Refuses to signal an empty group" is what the probe does; "protects
  against pid recycling" is what it does not. A pin written to the broad
  claim encodes the over-claim this card is also correcting.
- **MUTANT C SHALL BE RE-RUN AND SHOWN RED.** Remove the `!groupAlive()`
  guard from `signalGroup` and the early return from
  `reapOrphanedGroup`, and require the new pins to fail — it left
  `boot-check-guard` at **14/14 green** and the shipped drill at **exit
  0, PASS** before this card. That mutant is this card's acceptance test.
- **THE ESCALATION PIN SHALL NOT BE PARAMETRISED BY THE GRACE IT
  CHECKS** (CONVENTIONS: a test parametrised by the constant it checks
  cannot pin that constant — the whole `STARTUP_DEADLINE_MS` family
  stayed green at `8_000_000`). One body SHALL pin the literal.
- **A LINK FAILURE SHALL LAND ON `EXIT_CANNOT_RUN`, NOT ON `EXIT_LEAK`.**
  `orphan-drill.mjs` SHALL reach its module graph through a `try`/`catch`
  around a **dynamic** `import()`, so a failure before `main()` exits 3
  with a sentence saying the drill did not run. A pin SHALL drive it —
  point the drill at a module graph that cannot link and require exit 3
  with that sentence.
- **THE NOTES' PRE-FIX PROCEDURE SHALL BE CORRECTED WHERE IT LIVES**:
  the pre-fix comparison needs the MUTATION, not a byte copy from a ref
  that predates `isSignalableGroup`. A procedure that cannot be followed
  is worse than none, because the next verifier spends the attempt.
- **THE TWO OVER-CLAIMING SENTENCES SHALL SAY WHAT WAS MEASURED**: the
  capture comment SHALL say the capture buys type hygiene and one
  known-good evaluation moment, and the recycling residual SHALL be
  stated as a residual. IF a future card wants it CLOSED rather than
  stated THEN the only real answer is holding a reference that keeps the
  group id reserved, which POSIX gives no portable way to do — **say so
  instead of implying it is done.**
- IF lifting the helpers changes what the boot check PRINTS THEN the
  `child pid N; captured process group N` line SHALL survive: it is the
  only externally visible evidence that the capture happened, and the
  orphan drill deliberately does not parse it (it derives the group from
  `ps` by ppid, which is what lets the drill run against the pre-T-061
  check).

Verification: headless — `npm test`, `npm run typecheck` and
`npm run lint:tokens` (plus `-- --selftest`) from tools/e2e/, exits read
unpiped from `$?` and stated; workers 1, retries 0, no skips. The
**orphan drill SHALL be run by hand** in both directions (control PASS
exit 0; the child-exit mutant LEAK exit 1 with its orphan count and the
port held) and its transcript recorded — the new pins do not retire it,
they cover the branch it cannot reach. **POISON DRILL on every new
assertion, one side only**, producer mutated and never the assertion —
mutant C above is the first of them; each mutated text read back with
`git diff` before its run, restores per-path proved by sha256 at the
drill's own commit. Then the shape-six check per new body. **PORT RULE:
1420 is the human's; give the boot check a scratch port with
`NPUTER_BOOT_PORT` and never bind-probe 1420 to learn whether it is held
— `lsof -nP -iTCP:1420 -sTCP:LISTEN` is the one read-only command that
answers it.** The BOOT GATE trigger does not fire (no `app/src/**`,
`app/src-tauri/**` or manifest path) — derive that from the diff at the
lane's own ref rather than taking it from here. The DOCS GATE fires on
this card; ask `node tools/e2e/scripts/docs-gate.mjs <changed path>...`
directly, never through `xargs`. @human: none — nothing here is on
screen, and running the drill is not screen control.
