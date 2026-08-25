---
id: T-132-s2
title: method/ is a code input exactly the way docs/ is, and a method-only diff matches NO standing gate — the argument that created the DOCS GATE, one directory over
status: suggested
suggested_by: executor claude-opus-5 @T-132
touches: [docs/CONVENTIONS.md, tools/e2e]
---

**Derived at `b1783a6` by asking the gate rather than predicting it.** The
three standing gates were each run on T-132's own three-path diff — all of
it under `method/` — and all three answer NOT OWED:

| gate | trigger | on these 3 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside `docs/` | 0 | not owed |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | 0 | not owed |
| DOCS GATE | a path under `docs/` a code suite reads | **0** | **exit 0** |

The DOCS GATE says so in its own words:

    docs-gate: 3 changed path(s) given, none under docs/ — this gate is not owed.

**AND `method/` IS A CODE INPUT.** `app/src-tauri/src/agent/kit.rs`
`include_str!`s eight `method/` files into the binary — `roles/planner.md`,
`interview/plan-interview.md`, `interview/decomposition.md`,
`docs-templates/**`, `adapters/*`, `tasks/TASK-FORMAT.md`,
`tasks/T-000-template.md`, `runtime/nputer.yaml` — and four cargo bodies
read `method/` **off disk** and assert against it:
`every_compiled_entry_matches_its_method_file_byte_for_byte`,
`the_snapshot_table_covers_every_method_scaffold_file`,
`the_shipped_plan_interview_still_carries_the_normative_banking_map` and
`snapshot_version_matches_the_live_method_stamps`.

**So `cargo test` is owed by a diff that touches `method/tasks/`, and no
gate will ever say so.** T-132 ran it and derived it by hand — 471 / 0 / 3
over 16 `test result:` lines, headers summing to 474 — but the next card
fenced on `method/` has nothing to derive it from except somebody having
read `kit.rs`.

**THIS IS THE DOCS GATE'S OWN ARGUMENT, MOVED ONE DIRECTORY.** That gate
exists because a commit whose whole diff is `docs/tasks/*.md` matched
neither of the two gates above it, and both incidents surfaced three
layers from the cause, attributed to whoever was nearest. **A commit whose
whole diff is `method/**` matches none of the THREE.** The failure mode is
identical and the blast radius is worse: a `method/` file is compiled into
the shipped binary and materialized into other projects' kits.

**THE REPAIR IS PROBABLY ONE WORD IN A TRIGGER, AND THAT IS EXACTLY WHY IT
SHOULD BE CHECKED RATHER THAN ASSUMED — MARKED UNVERIFIED.** The gate's
reader derivation is scoped to `docs/` in more than one place (its census
counts "docs-shaped sites", and its root-anchor ledger is argued about
`docs/`), so "also accept `method/`" may be a trigger change or may be a
scanner change. **Do not widen the trigger without re-running the census
and re-asserting the ROOT_ANCHOR_LEDGER equality** — this gate's own
design says the reader set is derived from the tree and never listed, and
a hand list is the defect two earlier cards each found.

**The cheaper interim, if the scanner is a bigger job than it looks**: a
sentence in the DOCS GATE bullet naming `method/` as a code input the gate
cannot see, with `kit.rs` as the reader — which is prose, and prose is
what this project just spent a whole card proving does not bind.
