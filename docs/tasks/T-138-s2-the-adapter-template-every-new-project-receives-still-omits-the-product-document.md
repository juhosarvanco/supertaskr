---
id: T-138-s2
title: The adapter TEMPLATE every new project receives still names the old three documents, so every genesis inherits the defect that cost this project a working day
status: suggested
suggested_by: executor claude-opus-5 @T-138
touches: [method/adapters/CLAUDE.md, method/adapters/AGENTS.md, method/interview/plan-interview.md, docs/CONVENTIONS.md, app-agent]
---

**THIS IS THE CLASS; `6a6bc87` fixed the INSTANCE.** That commit moved
this repository's own root adapters to STATE → ROADMAP → ARCHITECTURE →
CONVENTIONS and said in its own message that the template was left
carrying the identical defect. It still is, at `00e133a`:

```
method/adapters/CLAUDE.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and
method/adapters/AGENTS.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and
```

**Every project this method ever creates copies those two files to its
root** (`method/roles/planner.md` step 1: *"Copy both adapter files from
adapters/ to the project root"*), so every new project starts with a
read-first set that omits the product document — the exact omission that
cost a working day here.

## Why T-138 could not take it — measured, not assumed

T-138's fence is `[CLAUDE.md, method/roles/orchestrator.md,
method/roles/executor.md]`. Asked of `lib/parser`'s `fence.ts`, the one
implementation (T-134), at `00e133a`:

```
T-138                  vs [method/adapters/CLAUDE.md, method/adapters/AGENTS.md]  ->  disjoint
[method/adapters/*.md] vs [method/, docs/CONVENTIONS.md]                          ->  overlapping
```

**The token `CLAUDE.md` normalises to the repository-root path and does
not reach `method/adapters/CLAUDE.md`** — neither string is a path-prefix
of the other, so `sharedDomain` returns `undefined`. The template half was
genuinely not T-138's, by measurement.

It IS `overlapping` with `[method/, docs/CONVENTIONS.md]`, which `T-105`,
`T-128` and `T-131` each hold. **So this composes with whichever of those
three runs, or it takes its own file-granular fence** — which is now
expressible, thanks to T-134.

## The arithmetic this card owes, stated so nobody re-derives it

Both adapters are `include_str!`'d into the binary:
`method/adapters/CLAUDE.md` at `app/src-tauri/src/agent/kit.rs:99`
(`rel:`) / `:100` (`include_str!`), and `method/adapters/AGENTS.md` at
`:103` / `:104`. Changing them is a **method format change**, and a bump
here is **A THREE-FILE COMMIT AND THE THIRD FILE IS RUST**
(`docs/CONVENTIONS.md`, first gotcha):

1. `docs/CONVENTIONS.md` — the `currently v<version>` stamp.
2. `method/interview/plan-interview.md` — the `(v<version>` stamp in its
   Output heading.
3. `app/src-tauri/src/agent/kit.rs` — `METHOD_SNAPSHOT_VERSION`, at `:35`,
   **`"0.1.6"` at `00e133a`**, so this card takes it to `0.1.7`.

`snapshot_version_matches_the_live_method_stamps` reads BOTH docs off disk
on every `cargo test`, **and its two asserts are ORDERED**: a const-only
bump reds on the plan-interview arm and never reaches the CONVENTIONS
arm, so fixing only the file a panic names yields a SECOND red rather than
a green. Move all three in ONE commit. **`cargo test` is owed by this
card** — it was not owed by T-138, whose diff touched nothing under
`method/`.

## What the template should say

Whatever this project's own root adapters say once `T-138-s1` lands, in
placeholder form — the template is where the SHAPE of the set is decided
for every future project, so it should carry the product-shaped slot even
if a brand-new project has nothing to put in it yet. A slot a genesis
leaves visibly empty is a question somebody answers; a slot that does not
exist is a document nobody thinks to write.

closed_by: T-145's merge fixed the class's core (the template names
docs/ROADMAP.md with the check-first placeholder), and the ADR-019
phase-7 commit completes the product-document half this card is named
for: the template now names docs/CAPABILITIES.md as a marked
placeholder ("once this project generates it" — T-145's own rule that
a template shipping a nonexistent path is worse than one shipping
nothing), points at method/docs-protocol.md, and the method version
bump this card earmarked ships as 0.1.6 -> 0.1.7 in the three-file
commit whose third file is kit.rs. Find it with
`git log -S "0.1.7" -- app/src-tauri/src/agent/kit.rs`. Executed
directly at @human's direction per docs/rooms/governing-docs.md's
override.
