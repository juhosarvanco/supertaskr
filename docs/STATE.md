# State

Updated: 2026-08-14 by T-002 integrator, claude-fable-5 @fresh

## Just completed
T-002 (task-file parser, lib/parser, C-06) is DONE and merged to
main — the first task through the full pipeline: build → REJECTED on
the security sweep (prototype injection via `__proto__` frontmatter
key) → fresh-executor fix (null-prototype objects for untrusted-key
maps) → re-verified APPROVED, 67/67 tests. Full suite green on merged
main; built dist parses the live repo tree with 0 issues. Review:
same-model (builder and verifier were separate claude-fable-5
sessions).

## In progress / broken right now
T-001 (app shell) in flight: built, all four acceptance criteria
reproduced (incl. @human visual confirmation), then REJECTED round 1
on the security sweep (null CSP + unused opener IPC surface). A
fresh-executor fix pass is running right now in the t001 worktree;
re-verification is queued. Nothing broken on main.

## Next up (1–3)
1. Finish the T-001 pipeline: fix → re-verify → integrate.
2. Architect triage of six open suggestions: T-001-s1 project-dir
   command, T-001-s2 token lint guard, T-001-s3 Linux CI, T-002-s1
   cross-reference checks, T-002-s2 preserve raw body, T-002-s3
   id-format validation.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

T-003/T-004 unblock only when BOTH T-001 and T-002 are done.

## Open questions
None.
