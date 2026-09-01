---
id: T-232
title: docs/CONVENTIONS.md says the lane-fence hook fails open in exactly one shape needing two faults at once — it needs ONE, the process DOES start, and the sentence mistakes the interpreter for the script
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-216-s1 phase 1 ground truth, 2026-09-01; re-derived independently at the integration seat before filing"
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A GOVERNING DOCUMENT ASSERTS A FAIL-OPEN CONDITION THAT IS TWICE AS
NARROW AS THE REAL ONE.** `docs/CONVENTIONS.md` (the lane-fence gotcha)
says:

> the hook FAILS OPEN in exactly one shape, proven at verification to be
> the harness's own contract rather than this guard's choice: a command
> hook whose script cannot be LOCATED never starts, and a process that
> never starts cannot exit 2 — it takes `CLAUDE_PROJECT_DIR` unset AND a
> shell cwd outside any checkout carrying the hook, both wrong at once

**Two of those claims are false, and the second one is load-bearing.**

## Measured

The registered command, read from `.claude/settings.json`:

    node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"

Driven with `CLAUDE_PROJECT_DIR` resolving CORRECTLY and only the `.mjs`
absent — one fault, not two:

    node <checkout>/.claude/hooks/DOES-NOT-EXIST.mjs
    exit=1
    stderr: 761 bytes, "node:internal/modules/cjs/loader … throw err"

- **"never starts" is FALSE.** The process starts. `node` is the command;
  it is on `PATH` and launches normally. It then exits 1 having failed to
  resolve a MODULE.
- **"both wrong at once" is FALSE.** One fault suffices. An absent hook
  file, with every environment variable correct, fails open on its own.
- The premise that survives is the one that matters least: exit 1 is not
  exit 2, so the harness does not block. **That part is right.**

## The mistake underneath, which is why it will recur

**THE SENTENCE CONFLATES THE INTERPRETER WITH THE SCRIPT.** For a command
hook spelled `node <path>`, the *command* is `node` and the *script* is an
ARGUMENT. "A command hook whose script cannot be located never starts"
would be true of a hook spelled `<path>` directly — a bare executable. It
is false of every hook this repository actually registers, because all of
them shell out to an interpreter first.

**So the failure surface is the union of two disjoint conditions**, and
CONVENTIONS names only the smaller:

- the interpreter cannot be located → the process never starts (the
  documented shape)
- the interpreter starts and the SCRIPT cannot be located → exit 1,
  stderr, still fails open (undocumented, and reachable by one fault)

## Why this is worth a card

**It is cited as PROVEN AT VERIFICATION**, which is the strongest
provenance this project's prose carries, and it was added at a merge to
close a verdict's disclosure condition. A reader auditing fail-open
coverage stops at that sentence, because it reads as a settled and
narrow result. **The narrower a false safety claim reads, the fewer
people re-derive it.**

It is also the exact class `T-216-s1` is about — a guard that is
registered and does not run — and that card's own verification found the
two states observationally identical from outside. This card fixes the
DOCUMENT; `T-216-s1` builds the catcher.

## Acceptance criteria

- `docs/CONVENTIONS.md`'s lane-fence fail-open sentence SHALL be corrected
  to state the union of both conditions, and SHALL NOT claim the process
  never starts for the script-absent case.
- The correction SHALL distinguish the INTERPRETER from the SCRIPT for
  command hooks spelled `<interpreter> <path>`, since every hook this
  repository registers takes that shape.
- A body SHALL demonstrate the undocumented arm: a hook registration whose
  interpreter resolves and whose script does not, showing a started
  process, a non-2 exit, and a write that is not blocked. **A body that
  only exercises the documented two-fault shape is degenerate against this
  card and SHALL be treated as absent.**
- WHERE the corrected sentence retains the "proven at verification"
  provenance, it SHALL name the ref at which the claim was re-measured.
- Verification: headless.
