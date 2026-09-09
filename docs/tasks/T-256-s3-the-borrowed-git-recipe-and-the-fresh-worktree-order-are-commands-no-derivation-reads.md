---
id: T-256-s3
title: The borrowed-git recipe and the fresh-worktree ORDER are commands the parity derivation never reads, so both could be reverted with every suite green
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-256
blocked_by: []
touches: [tools/e2e/tests/workflow-parity.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE VERIFYING T-256, NOT A FAILURE OF IT** — no criterion of
that card asked for a guard, and the card is APPROVED. This is the hole
the work made visible.

T-256 wrote two things into `docs/CONVENTIONS.md` that a lane executes:
the borrowed-git recipe's three new identity variables, and the
fresh-worktree ORDER a lane runs before its suite. **Neither is read by
any derivation.** `workflow-parity.spec.ts` parses only bullets carrying
a `run from <dir>/:` marker inside `## Build & test`; the borrowed-git
bullet sits inside that section but has no marker — the spec's own
FIXTURE body calls this "the shape that IS silent" — and the
fresh-worktree sub-bullet lives in `## Gotchas`, outside the section
entirely.

**MEASURED, not inferred.** In a scratch clone at T-256's tip, both
mutations applied at once — the three identity variables deleted from the
recipe, and the fresh-worktree order's app/ `npm ci` reverted to
`npm install` — the WHOLE e2e suite still answers **742 passed, exit 0**,
byte-for-byte the count the unmutated tip gives. Nothing anywhere reds.

**The recipe's technique is meanwhile implemented a SECOND time in code**
— `noIdentityEnv()` in `tools/e2e/tests/brief.spec.ts` writes a
`GIT_CONFIG_GLOBAL` file carrying `useConfigOnly` and unsets
`GIT_AUTHOR_*`/`GIT_COMMITTER_*`/`EMAIL`. That is a rule written twice
(T-057's hazard), and the two spellings already differ: the doc uses the
`GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` env triple, the spec uses a file.
Both are correct today; nothing makes them stay agreed, and nothing
notices if the doc's half is deleted.

This is the same class T-045 closed for the per-package command bullets:
a command written down where no derivation reads it drifts silently. The
fresh-worktree ORDER is the sharper half, because the seats it exists for
are the ones who meet the exit 243 EACCES when it is wrong.

## Acceptance criteria

- WHEN `docs/CONVENTIONS.md`'s borrowed-git bullet publishes its recipe
  THE parity spec SHALL assert the published recipe suppresses identity
  auto-detection, and SHALL red BY NAME when the suppression is removed
  from the doc.
- WHEN the fresh-worktree ORDER names a per-package install command IT
  SHALL be checked against the spelling `## Build & test` publishes for
  the same package, and SHALL red BY NAME when the two disagree.
- Each new body SHALL be drilled with a DATA mutant on a scratch copy of
  the doc, since the property lives in the document rather than in code
  (verifier.md 2b, T-221).
- Verification: headless.
