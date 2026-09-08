---
id: T-264-s2
title: The app-dev launcher carries a 34th `NPUTER_*` variable and `bin/` is outside T-264's fence — the env prefix is renamed everywhere a program reads it EXCEPT the one launcher a human runs by hand
feature: F-01
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — found deriving the env-var census repo-wide rather than over the fence's own path set
blocked_by: []
touches: [bin/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264`.** ADR-022 decision 2 renames the environment
prefix to `SUPERTASKR_*`. T-264's fence reaches `app/`, `lib/`,
`tools/`, `.claude/`, `.github/` and four root files; it does NOT reach
`bin/`, and `bin/app-dev.mjs` reads `NPUTER_APP_WORKTREE`.

**DERIVE BOTH CENSUSES, BECAUSE THEY DISAGREE AND THE DIFFERENCE IS THE
FINDING.** At `fe2a2aa`:

    git grep -h -o -E 'NPUTER_[A-Z0-9_]+' -- app lib tools .claude .github docs/CONVENTIONS.md | sort -u | wc -l   # 33
    git grep -h -o -E 'NPUTER_[A-Z0-9_]+' | sort -u | wc -l                                                        # 37

The 33 are T-264's and were renamed. Of the four remaining,
`NPUTER_AGENT_`, `NPUTER_AGENT_ARGS` and `NPUTER_AGENT_SCENARIO` appear
only inside RECORDS, which ADR-022 decision 3 does not rewrite. The
fourth, `NPUTER_APP_WORKTREE`, is live code.

The same file also defaults its target to `~/Projects/nputer-app` — the
`repository-directory` survivor class T-264's own notes enumerate, which
moves with the repository rename (`T-266`) rather than here. **Read the
two halves separately**: the env var is T-264's rename finished, the
default path is @human's to move.

## Acceptance criteria

- WHEN this lane lands THE variable `bin/app-dev.mjs` reads SHALL be
  `SUPERTASKR_APP_WORKTREE`, and a repo-wide
  `git grep -h -o -E 'NPUTER_[A-Z0-9_]+'` outside `docs/` SHALL return
  nothing.
- IF the launcher's default target still names the pre-rename repository
  directory THEN it SHALL be left alone and named in the notes — that
  path is `T-266`'s, and a launcher pointing at a directory nobody has
  created yet is worse than one pointing at the directory that exists.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
