---
id: T-133-s3
title: Orchestrator step 5b requires the brief contract and names no way to obey it — one clause closes the gap the command was built for
status: suggested
suggested_by: executor claude-opus-5 @T-133
---

**ROUTED, NOT TAKEN.** T-133's fence is `touches: [tools/e2e]`;
`method/roles/orchestrator.md` is outside it. It is FREE — `T-132` holds
`lane-protocol.md`, `integrator.md` and `TASK-FORMAT.md` at FILE
granularity, so the two role neighbours are reachable — but not by this
lane.

## The gap, stated as the card states it

Step 5b already says *"The brief is assembled to the contract in
roles/executor.md — every row, from the sources that row names."* Every
dispatch brief written on 2026-08-25 obeyed the first clause and broke
the second. **The prose was read closely enough to be quoted and still
did not bind**, which is T-133's whole argument, and step 5b is the exact
sentence it is an argument about.

## The clause

One sentence at step 5b naming the command, in the shape the DOCS GATE
bullet uses for its own census — a spelling, not a description:

> Assemble it by running `node tools/e2e/scripts/brief.mjs --task T-NNN`
> and pasting what it emits: every row comes back with the source that
> row names and the ref or reading time it was derived at, and a row the
> command cannot derive is printed as NOT DERIVED with its source rather
> than filled in.

**WHY THIS AND NOT A SHARPER RULE.** A rule that depends on a reader
remembering has a failure mode; a rule that depends on a construction
does not. The command already refuses to emit a bare figure — a `note`
carrying a digit throws — so what step 5b needs is not more prose about
care, it is the one line that makes the derived answer cheaper than the
remembered one.

**AND IT IS A METHOD FILE, SO THE COST IS NOT ZERO.** `method/` changes
are version-bumped and noted in `docs/CONVENTIONS.md`, and a bump is a
three-file commit whose third file is Rust
(`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`, asserted
on every `cargo test`). Whether naming a project command inside a role
file is a FORMAT change is the first question this card has to answer —
`method/` is meant to be product-agnostic, and
`node tools/e2e/scripts/brief.mjs` is an nputer path. **The honest
resolution is probably that the clause belongs in `docs/CONVENTIONS.md`
and step 5b gains only a pointer**, which is the same split
`lane-protocol.md` already takes for every lane SPELLING.

Fence: `[method/roles/orchestrator.md]`, or `[docs/CONVENTIONS.md]` if
the split above is taken. Read beside `T-108-s3`, which is the other
open card about `method/roles/` under a path-granular fence.
