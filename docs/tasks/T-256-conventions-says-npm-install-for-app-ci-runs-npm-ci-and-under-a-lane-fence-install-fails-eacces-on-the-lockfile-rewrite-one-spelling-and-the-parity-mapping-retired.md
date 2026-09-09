---
id: T-256
title: CONVENTIONS says `npm install` for app/, CI runs `npm ci`, and under a lane fence `install` fails EACCES on the lockfile rewrite — one spelling, `npm ci`, and the parity spec's install→ci mapping retired
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "the T-247 executor seat, 2026-09-08 (row 13 of its report): the brief's build row transcribes CONVENTIONS' `npm install` for app/, which rewrites app/package-lock.json outside the lane's fence and is refused EACCES; `npm ci` works — and tools/e2e/tests/workflow-parity.spec.ts already maps the doc's `npm install` to CI's `npm ci` with a written reason"
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was found

Two seats reached the same line from opposite sides. The workflow-parity
spec carries a documented divergence: CONVENTIONS' Build & test bullet
says `npm install` for app/ and ci.yml runs `npm ci`, with the reason
written into the spec. A lane executor then found the third reading:
under a lane fence, `npm install` in app/ tries to rewrite
app/package-lock.json, which is outside the fence, and the hook refuses
it (EACCES); `npm ci` never writes the lockfile and works. So the
doc's spelling is the one that fails for the seats that read it most.
Also from the same report: the brief's build order stops at lib/parser
and app/, but tools/e2e's own preflight refuses without
app/node_modules and lib/parser/dist — the brief's fresh-worktree
paragraph should say so in its order, not only in its warning.

## Acceptance criteria

- WHEN CONVENTIONS' RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT
  bullet publishes its recipe THE recipe SHALL also suppress git's
  identity AUTO-DETECTION (`-c user.useConfigOnly=true`, or the
  `GIT_AUTHOR_*`/`GIT_COMMITTER_*` variables unset AND
  `user.useConfigOnly=true`), and the bullet SHALL say why: the two
  `GIT_CONFIG_*=/dev/null` variables suppress config FILES only, so on a
  host whose hostname carries a dot the recipe answers green and
  reproduces no runner red (T-239-s4's class; measured at 0f6b37f).
- IF the recipe is run against the T-239 ritual fixture at 0f6b37f THEN
  it SHALL reproduce the runner's exit 128 (the control T-239-s4's
  verifier took at the base: `useConfigOnly` arming 1 failed / 56 passed).
- WHEN CONVENTIONS' Build & test bullet is read THE app/ install line
  SHALL say `npm ci`, and the parity spec's install→ci mapping (the
  `steps: [{ dir: "app", run: "npm ci" }]` entry with its reason) SHALL
  be retired so the doc and CI say the same words — the spec's
  "verbatim" class then covers app/ like lib/parser.
- WHEN the fresh-worktree sub-bullet is read THE build ORDER SHALL name
  tools/e2e's `npm ci` and the app build as steps a lane runs before
  its suite, in the order the preflight demands.
- The workflow-parity suite SHALL be green with the mapping gone, and
  the docs gate SHALL be run on CONVENTIONS (the budget line printed).
- IF the dispatch brief's build rows are derived from the bullet THEN
  a brief assembled after the merge SHALL print `npm ci` for app/ —
  checked once by hand and recorded in the report.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Absorbs: T-239-s5 (2026-09-08, triage at the wave sitting) — the borrowed-git recipe's identity gap, measured by the T-239-s4 executor at 0f6b37f; the file is removed in this commit, this line is the surviving record.

## Corroborations

- **2026-09-09, the `T-203-s1` executor, at base `c2a0952`** — a second
  instance, reproduced from a cold lane worktree rather than from a
  brief's transcription. `npm install` from `app/` in
  `/Users/ujju/Projects/nputer-T-203-s1` exited **243** with
  `npm error code EACCES` / `npm error path .../app/package-lock.json`
  / `errno -13`; `ls -l` shows the lockfile at mode `-r--r--r--`, which
  is the lane fence's own read-only chmod on a tracked file outside the
  fence. `npm ci` in the same directory exited **0** and the worktree
  went on to run parser (389 bodies), app (1171) and e2e (743) all
  GREEN. So the finding is not particular to the seat that first
  reported it: **every fresh lane whose fence excludes `app/` meets it**,
  and the only reason it is not louder is that the failing command is
  the FIRST thing a lane runs, so it reads as a broken worktree rather
  than as a documented command being wrong.
