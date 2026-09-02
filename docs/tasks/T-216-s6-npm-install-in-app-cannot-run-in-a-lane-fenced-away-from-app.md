---
id: T-216-s6
title: A fresh lane cannot run CONVENTIONS' own setup command — `npm install` from app/ dies EACCES on app/package-lock.json under the physical layer
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/tests/workflow-parity.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-216-s4
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-216-s4, NOT FIXED THERE.** `docs/CONVENTIONS.md`
is outside that lane's fence — `T-236` holds it tonight — so the sentence
this needs cannot be written from inside it.

**Class parent: `T-216-s4`.** Same mechanism, one layer out: T-210's
physical layer makes every tracked file outside a lane's fence read-only,
and this time the caller is not a test body but the SETUP STEP the
project's own conventions prescribe.

## Measured

In `/Users/ujju/Projects/nputer-T-216-s4` (fence = five files by path,
layer armed), 2026-09-01, running the fresh-worktree order the LANE
sub-bullet of `docs/CONVENTIONS.md` prescribes:

    from app/:  npm install   ->  exit 243

    npm error   code: 'EACCES',
    npm error   syscall: 'open',
    npm error   path: '<lane>/app/package-lock.json'

The install had already populated `app/node_modules` — the following
`npm run build` exited 0 and emitted `dist/` — so the failure is the
LOCKFILE WRITE at the end and not the install. Nothing warns; a session
that reads the exit and stops has no tree, and a session that ignores it
has an unlocked install it did not intend.

**`npm ci` does not write the lockfile and is unaffected**: `npm ci` from
`tools/e2e/` exited 0 in the same lane at the same moment, and CI already
uses `npm ci` for app/ — one of the two DELIBERATE divergences
`workflow-parity.spec.ts` pins.

## What it decides

1. Whether the LANE sub-bullet's fresh-worktree order should say `npm ci`
   for app/ **inside a lane**, leaving `npm install` as the local
   dependency-changing spelling. That would make the documented order and
   CI's order agree for the first time and needs the parity spec's
   divergence comment updated with it.
2. Or whether `app/package-lock.json` (and its two siblings) belong in
   the manifest's `alwaysWritable` set beside `docs/tasks` — a bigger
   claim, because a lockfile a lane may rewrite is a lane that can move a
   dependency outside its fence.

Option 1 is the cheap half and is probably right; option 2 is a fence
question and should be ruled, not assumed.

## Acceptance criteria

- The fresh-worktree ordering in `docs/CONVENTIONS.md` SHALL name a
  command that succeeds inside an armed lane, or SHALL say in as many
  words that `npm install` from app/ does not.
- WHERE the command changes, `tools/e2e/tests/workflow-parity.spec.ts`'s
  divergence mapping SHALL move in the same commit — that spec reds by
  name on a command the doc lists and it has no entry for.
- Verification: headless.

## TRIAGE, 2026-09-02 — PROMOTED as the carrier of the lockfile class

Absorbs: T-223-s1, T-230-s2 — the same `npm install` refusal measured
independently on three lanes in one night (exit 243 EACCES on the
read-only `app/package-lock.json`, node_modules already populated).
This card carries it because it alone states acceptance criteria and
names `tools/e2e/tests/workflow-parity.spec.ts` as a same-commit
obligation, now in its fence. RULED at the seat, so the lane does not
have to: **the lane's setup spelling is `npm ci` from app/ — CI's own
documented spelling — and the CONVENTIONS lane bullet says so beside the
fresh-clone ORDER; option 2 (a lockfile in `alwaysWritable`) is
REFUSED**, because the unfenceable set is one directory and every
addition is a hole in every fence at once. T-223-s1's third arm — the
arming step printing "installs in app/ use npm ci" — is an option the
lane may take, not a criterion.
