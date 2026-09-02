---
id: T-238
title: THE SEAT THAT HOLDS THE INTEGRATION CHECKOUT IS NOWHERE ON DISK — two architect sessions held it at once on 2026-09-01 and neither could see the other, because the holder is declared in prose and read by nobody
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/scripts/brief.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/checkout-currency.spec.ts, tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/lane-lock.spec.ts]
suggested_by: "the architect seat, 2026-09-02 — item 7 of docs/rooms/loop-efficiency.md; the instance is this seat's own arrival, measured with ps and the session list while the retired seat was mid-battery and then mid-checkpoint in the same checkout"
builder:
verifier:
built_by:
verified_by:
review: independent
---

**RULE 4 SAYS ONE HOLDER AT A TIME AND DECLARED AT DISPATCH. NOTHING
RECORDS WHO.** On 2026-09-01 an Opus session was running the four-suite
battery in /Users/ujju/Projects/nputer and then writing its checkpoint
there while a second session, asked to take the same seat, was reading.
The only defence was the second seat reading `ps` for `gate-run.mjs`,
`lsof` for the e2e port, and the harness's session list — none of which
the method names, and none of which the first seat could have used to
learn a second seat existed. Concurrent checkpoints CORRUPT (rule 4),
and any commit by the second seat would have staled the first seat's
push token (T-203) at the moment it was minted.

T-189-s3 gives the holder a CARRIER in the brief; T-216-s1 built the
catcher that names a stale checkout from outside. This card gives the
holder a RECORD on disk that both the arming step and the push guard
read, so a second seat is refused by construction rather than by luck.

## The construction

A runtime file, `.nputer/holder.json` in the integration checkout,
gitignored like the fence manifest, carrying WHO holds the checkout:
the identity of the holding session, when it took the seat, and the
checkout path. **The identity is the open question this card must
MEASURE rather than assume**: a Bash tool call carries no session id
(T-216-s1 measured `CLAUDE_PROJECT_DIR` unset there), but every tool
shell is a descendant of the harness process, so an ancestor pid plus
its start time is a candidate identity that survives across calls and
dies with the session. The lane SHALL measure whether that ancestor is
stable and distinguishable on this machine before building on it, and
SHALL say what it found.

- **Taking the seat** is an explicit arm — `brief.mjs --take-seat` —
  that refuses when a DIFFERENT holder is recorded and its process is
  alive, and takes over when none is recorded or the recorded process is
  dead, announcing the takeover with the dead holder's identity.
- **The arming steps** (`--preflight`, `--write-fence`) and **the push
  guard** read the file and refuse when the recorded holder is alive and
  is not this session — with the holder's identity and the remedy
  (*the other session retires, or takes over explicitly*).
- **Releasing** is `--release-seat`; a dead holder needs no release.

## Limits, disclosed

A seat that never runs an arming step and never pushes is not seen —
a pure reader is not a holder, which is correct. A seat that edits and
commits without pushing is seen only at its next push. Identity by
process ancestry is a fact about this harness; the lane names it as
such and keeps the derivation in one function so another harness can
replace it.

## Acceptance criteria

- WHEN a session runs `--take-seat` in a checkout whose holder file
  names a DIFFERENT live session THE command SHALL refuse, naming the
  holder and the remedy, and a positive control SHALL show the same
  command succeed once the holder's process is dead.
- WHEN the holder file names this session THE arming steps and the push
  guard SHALL proceed silently; WHEN it names another live session THEY
  SHALL refuse; WHEN it names a dead session THEY SHALL announce and
  proceed.
- THE session identity SHALL be derived in one function and its
  stability measured across at least two separate tool shells in the
  report, with the derivation named in the file's own header.
- THE holder file SHALL be un-committable by construction, the shape
  the fence manifest and the gate token already use.
- IF the checkout is not the integration checkout THEN the arms SHALL
  say so and do nothing — a lane does not hold a seat.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

lane-protocol rule 4 (STANDING, NOT THE SEAT — the holder is declared,
never inferred), T-189-s3 (the carrier), T-216-s1 (the catcher that
sweeps the machine), T-203 (the token this protects), and
docs/rooms/loop-efficiency.md item 7.

## Absorbs: T-230-s6 (2026-09-02)

Four e2e bodies — two in checkout-currency.spec.ts, one in
card-preflight.spec.ts, one in lane-lock.spec.ts — assert their OWN
checkout is CURRENT, so they red when main advances underneath them
(measured green then red hours apart on a byte-identical tree at
90dfe53). The CURRENT case moves to a fixture whose vantage the body
controls, the way the same spec's stale bodies already do; the fence
gains the two specs. Criterion added: WHEN main advances past a lane's
base THE suite in that lane SHALL NOT red on the lane's own currency.

## CORROBORATION, 2026-09-02 — a fourth body, and the trigger is the merge of a guard

Measured by T-215's blind verifier on a bench detached at 42520e3, six
commits behind main and cut before T-237's push guard merged at 44a95c3:
`npm test` from tools/e2e reads 555 passed, 4 failed — card-preflight
.spec.ts:719, checkout-currency.spec.ts:852 and :953, lane-lock.spec.ts
:899 — because T-216-s1's catcher fires `guard-surface-behind` on every
`--preflight` and `--write-fence` in a checkout whose `.claude/` is
behind the integration branch's. Every lane cut before a guard merges
reds these four on its own currency for the rest of its life, which is
the class the absorbed T-230-s6 names with a second trigger: not main
advancing past the base in general, but a `.claude/` change landing.
The fixture-vantage move this card owes covers it; the lane SHALL name
card-preflight.spec.ts:719 among the bodies it moves.
