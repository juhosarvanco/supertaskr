---
id: T-202-s1
title: The gate runner's solo lock keys on the LAST EIGHT BYTES of the checkout path, so a verifier bench and its own lane share one lock for every eight-character card id and the two seats the method runs in parallel are serialised
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-223-s3-verify, phase 1 at 695954f, 2026-09-02; filed by the architect seat
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding, measured

`lockPath(root)` in `tools/e2e/scripts/gate-run.mjs` derives the lock key
as `Buffer.from(root).toString("hex").slice(-16)` — the last eight
BYTES of the checkout path. For a card whose id is exactly eight
characters (every `T-NNN-sN`), the lane `…/nputer-T-223-s3` and its bench
`…/nputer-V-T-223-s3` end in the same eight bytes and produce the
identical key (`542d3232332d7333`); for `T-228` they do not. V-T-223-s3
verified both. The consequence: a bench's gate run is refused as
"solo-locked" while its own lane runs a suite, and vice versa — the
executor and the blind verifier, the two seats the method deliberately
runs side by side, are serialised on every eight-character card. Three
seats reported the refusal today (V-T-216-s8, V-T-223-s3, V-T-112-s6's
e2e baseline) and each read it as another checkout's lock, which the
runner's own header says cannot happen.

## What is asked

The key SHALL be a function of the WHOLE path (a digest of it, or the
full hex), so distinct checkouts never share a lock; the per-checkout
solo property is unchanged. A body plants two roots differing only
before their last eight bytes and requires distinct keys; a second body
keeps two runs in ONE root serialised.

## Acceptance criteria

- `lockPath` for `/x/nputer-T-223-s3` and `/x/nputer-V-T-223-s3` differ;
  for the same root twice they are equal.
- The positive control demonstrated failing: the base key function reds
  the distinct-roots body by name.
- Existing gate-run bodies green at the tip; the lock file's location
  and lifetime are unchanged, so no other reader moves.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, at the seat

Serialising the bench against its lane costs every eight-character card
a full suite length of wall-clock, silently, and misattributes the
refusal. Dispatch at the next free slot; the fence is free of every
live lane.

## Implementation notes, 2026-09-02 — built in lane `task/T-202-s1-solo-lock-whole-path-key`

**The key is a sha256 of the whole root path**, so every byte of it is
read: `createHash("sha256").update(root, "utf8").digest("hex")`. The
collision the card names is reproduced and killed — drill D1 restores
the base key and the body reds naming the shared lock
`nputer-gate-run-542d3232332d7333.lock`, the card's own figure.
Re-measured here: this lane's own checkout
`/Users/ujju/Projects/nputer-T-202-s1` and its bench
`…/nputer-V-T-202-s1` collide under the base key too.

**A DIGEST AND NOT THE PATH'S OWN FULL HEX, which the card also
offered.** The hex form is two bytes of basename per byte of root, so
the basename is `21 + 2 * root.length` and crosses NAME_MAX — 255 here,
`getconf NAME_MAX /` — at a root of **118 bytes**, `ceil((255 - 21) / 2)
+ 1`, where `acquireSolo`'s own `writeFileSync` throws ENAMETOOLONG.
The longest root that reaches `lockPath` in this suite today is **72
bytes** (a `mkdtempSync` root under a 48-byte `tmpdir()`), so the hex
form would not have failed HERE — the hazard is a checkout path an
ordinary home directory two projects deep already reaches, not a
fixture one. The sha256 form is FIXED at 85 bytes of basename for every
root on every machine. Drilled: D6 plants the hex form and the body
reds at 457 bytes against 255.

**The lock file's LOCATION and LIFETIME are unchanged, and the two
bodies now pin them, because nothing at the base did.** Same `tmpdir()`,
same `nputer-gate-run-<key>.lock` name shape, same JSON payload, same
lifetime — written at acquire, removed by the holding pid at release,
reclaimed when the holder pid is gone. **The readers are two and both
are green**: `acquireSolo` in the same file, and this suite's
stale-reclaim body *"a lock left behind by a dead process is reclaimed…"*,
which plants a lock at `lockPath(root)` by hand and reads the pid back
out of it. Nothing outside `tools/e2e/` reads the path at all (sweep
below). At the base a key change could have carried the file out of
`tmpdir()` and every body would still have passed, so the first body now
asserts the directory (drill D4) and the name shape (D5).

**THE CENSUS IS OWED AND IT IS THE INTEGRATOR'S.** Two bodies were
added, so `docs/CAPABILITIES.md`'s `## gate-run` section moves from **39
entries to 41** and `npm run capabilities:check` reds until
`npm run capabilities` is run from `tools/e2e/` in the merge commit.
This lane's fence is `tools/e2e/scripts/gate-run.mjs` and
`tools/e2e/tests/gate-run.spec.ts`; `docs/CAPABILITIES.md` is outside it
and was deliberately not regenerated here.

**THE CLASS AND ITS SWEEP** — a machine-scoped identity keyed on a
SUFFIX of a path, so two distinct paths collide. `git grep -nE
'\.slice\(-[0-9]+\)|\.substr\(-'` over `*.mjs *.ts *.tsx *.js *.rs`
outside `docs/` returns **one instance, the one fixed** — shown capable
of answering otherwise by running it at the base `3676dd7`, where it
returns that instance plus three. The three survivors are triaged NOT
of the class: `tools/e2e/tests/push-guard.spec.ts:2750` feeds its slice
to `mkdtempSync` as a PREFIX, which appends six random characters, so no
two harnesses can collide however their roots end; the two in
`tools/method-evals/evals/mf-01-brief-assembles.mjs` slice an array of
text LINES for diagnostic output and key nothing. A second sweep for
deterministic (non-`mkdtemp`) machine-scoped names under `tmpdir()`
returns this lock and one path in `push-checks.spec.ts` that is
deliberately never created.
