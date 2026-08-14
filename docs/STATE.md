# State

Updated: 2026-08-14 by T-001 integrator, claude-fable-5 @fresh

## Just completed
Milestone 1's first slice is DONE: T-001 (app shell, app/, C-05) and
T-002 (task-file parser, lib/parser, C-06) are both merged to main,
each through the full pipeline — built, REJECTED once on the mandatory
security sweep by a same-model verifier, fixed by a fresh executor,
re-verified APPROVED. T-001's rejection: null CSP + unused opener IPC
surface → now ships strict CSP `default-src 'self'; script-src 'self';
style-src 'self'; connect-src ipc: http://ipc.localhost` with the
opener plugin fully removed (baseline recorded as ADR-010). T-002's:
prototype injection → null-prototype maps (ADR-009). Full suite green
on merged main: parser 67/67 + tsc + build, app build exit 0
(byte-identical bundle), tauri dev boots with both `[nputer]` lines.

## In progress / broken right now
Nothing in flight; nothing broken. Both worktrees removed, branches
kept.

## Next up (1–3)
1. Human decision: dispatch T-003 (watcher, M — unblocked)? And start
   the T-004 planning pass? T-004 (story map, L) is also unblocked but
   size L: per the method it needs a planning pass and explicit human
   approval before dispatch. T-003 dispatch also awaits the human's go
   — the standing instruction covered only T-001/T-002.
2. Architect triage of six open suggestions: T-001-s1 project-dir
   command, T-001-s2 token lint guard, T-001-s3 Linux CI, T-002-s1
   cross-reference checks, T-002-s2 preserve raw body, T-002-s3
   id-format validation.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

Known caveat carried forward: the Linux half of T-001's window
criterion remains machine-unverified (see T-001-s3).

## Open questions
None.
