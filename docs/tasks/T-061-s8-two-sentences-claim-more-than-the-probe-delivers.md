---
id: T-061-s8
title: Two sentences claim the spawn-time capture and the liveness probe answer pid RECYCLING — measured, they answer only "the group is not empty"
status: suggested
suggested_by: verifier claude-opus-5 @T-061-verify (filed by claude-opus-5 @T-061-integrate)
---

**Filed by the integrator on the verifier's behalf** — finding 2 of
T-061's APPROVED verdict, written into the card and filed as no file.
Neither arm affects behaviour; both are claims in the tree that the
tree's own measurements contradict, which is the class this repository
has watched go stale three times in a week.

## Arm 1 — the code comment, measured false

`tools/e2e/scripts/tauri-boot-check.mjs:212`:

> Capturing it here rather than reading `child.pid` at kill time is the
> whole point

Measured: `child.pid` is the **same integer after the `exit` event**
(81368 → 81368, `typeof number`), so `-child.pid` read at kill time
names exactly the group the spawn-time capture names. `child.kill()`
after the event returns `false`, as the notes correctly say — but that
is a different fact about a different call.

Capturing at spawn is **type hygiene** — it gives one known-good moment
to evaluate `isSignalableGroup` and removes a `undefined` branch — not
recycling protection. The whole point is the PROBE, plus that single
evaluation.

## Arm 2 — the card's own criterion frames the pair as closing pid recycling

T-061's first acceptance criterion reads:

> by the time the `exit` event fires node has reaped the child, so that
> pgid names a group whose leader is gone — on a busy machine a recycled
> pid could put the signal somewhere else. Capture the pgid at SPAWN
> time and signal it only if a zero-signal liveness probe on that pgid
> still succeeds

That reads as though capture + probe closes the recycling hole. **It
narrows it.** The verifier measured all three states headlessly, with
detached `sh -c "sleep N & exit 0"` trees that bind no port:

| state | `kill(-pgid, 0)` | what an unguarded signal hits |
|---|---|---|
| leader reaped, member alive | ALIVE | the right tree — the fix signals here, correctly |
| group empty, id not yet reused | ESRCH | nothing; harmless **today** |
| id now names a LIVE stranger | **ALIVE** | **the stranger — and the fix kills it too** |

So the probe buys exactly one thing: **it refuses to signal an EMPTY
group.** A recycled id that has become live again passes the probe. And
recycling is not hypothetical on this machine — sequential allocation
with a 99999 ceiling, and the pid space wrapped inside BOTH the
executor's run (tauri 99996 → vite 376) and the verifier's (a holder
spawned after pid 98xxx came back as pid **176**).

**The honest statement is the one `groupAlive`'s own comment already
makes**: *signal only a group that still has members*. That comment is
correct and does not overreach; it is the other two sentences that do.

## Why this is worth a card rather than a shrug

The residual is real but small — the window is between the child's exit
and the signal, microseconds, and it requires the kernel to have wrapped
the whole pid space and handed that exact id to a live stranger. Nobody
should widen the fix for it. **The cost of the over-claim is that the
next person to touch this path will believe the recycling case is
handled and reason from that**, which is how the `ROOT_ANCHOR_LEDGER`
comment (`T-084-s8`) and `CONVENTIONS:690`'s xargs sentence
(`T-061-s3`) each became false in the tree.

## Suggested fix

Two prose edits, no behaviour change: correct the `:212` comment to say
what the capture actually buys, and amend the criterion's rationale to
the narrow claim. If a future card wants the residual CLOSED rather than
stated, the only real answer is to hold a reference that keeps the group
id reserved, which POSIX gives no portable way to do — say so instead
of implying it is done.

Related: `T-061-s6` (the probe is pinned by nothing — a pin should
assert the narrow property, not the broad one, or it encodes this same
over-claim).
