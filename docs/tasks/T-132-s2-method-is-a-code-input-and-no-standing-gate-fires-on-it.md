---
id: T-132-s2
title: method/ is a code input exactly the way docs/ is, and a method-only diff matches NO standing gate — the argument that created the DOCS GATE, one directory over
status: parked
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

**AND PART OF `method/` IS A CODE INPUT — WHICH IS NOT THE SAME CLAIM AND
IS THE SHARPER ONE.** `app/src-tauri/src/agent/kit.rs` `include_str!`s
**fourteen** `method/` files into the binary, in one `KIT_FILES` table:
`roles/planner.md`, `interview/{plan-interview,decomposition}.md`, six
`docs-templates/**` files, `adapters/{CLAUDE,AGENTS}.md`,
`tasks/{TASK-FORMAT.md,T-000-template.md}` and `runtime/nputer.yaml`.
**And two cargo bodies — not four — read `method/` off disk and assert
against it**: `every_compiled_entry_matches_its_method_file_byte_for_byte`
and `the_snapshot_table_covers_every_method_scaffold_file`, both reading
`repo_root().join("method")`. The other two this finding first named read
the **compiled** `KIT_FILES` table, and
`snapshot_version_matches_the_live_method_stamps` reads
`docs/CONVENTIONS.md` off disk rather than anything under `method/`.
**The conclusion is unaffected and reaches it by a shorter route**:
`include_str!` forces the recompile whatever the bodies read.

**`method/` IS NOT A CATEGORY; THE TEST IS PER-PATH.** Both figures above
were first stated as eight and four, and the error was not arithmetic — it
was treating a directory name as an answer to *"is this shipped?"*. It is
not one. **The boundary runs THROUGH `method/`**: fourteen of its files
are compiled into `nputer_lib` and the rest are not, and neither
`method/lane-protocol.md` nor `method/roles/integrator.md` — two of the
three files T-132 itself edited — is among the fourteen. A card fenced
only on `roles/integrator.md` would keep self-integration under the
ceremony table's own boundary test; a card fenced on `tasks/TASK-FORMAT.md`
would not.

**THAT IS THE ARGUMENT FOR PATH-GRANULAR FENCES, MADE BY THE THING BEING
FENCED.** The ruling that a fence names paths rather than directories is
what makes *"is this shipped?"* an askable question at all — asked of a
directory it has no answer, and the answer it appears to have is whichever
of its files the asker happened to open.

**So `cargo test` is owed by a diff that touches `method/tasks/`, and no
gate will ever say so.** T-132 ran it and derived it by hand — 471 / 0 / 3
over 16 `test result:` lines, headers summing to 474 — but the next card
fenced on `method/` has nothing to derive it from except somebody having
read `kit.rs`. **And the per-path boundary makes the gap WORSE, not
better**: the fourteen compiled paths and the rest look identical from
outside, so the seat that must derive `cargo test` by hand must first
derive WHICH `method/` paths are in the table.

**THIS IS THE DOCS GATE'S OWN ARGUMENT, MOVED ONE DIRECTORY.** That gate
exists because a commit whose whole diff is `docs/tasks/*.md` matched
neither of the two gates above it, and both incidents surfaced three
layers from the cause, attributed to whoever was nearest. **A commit whose
whole diff is `method/**` matches none of the THREE.** The failure mode is
identical and the blast radius is worse for the compiled subset: those
files are in the shipped binary and are materialized into other projects'
kits.

**THE REPAIR IS PROBABLY ONE WORD IN A TRIGGER, AND THAT IS EXACTLY WHY IT
SHOULD BE CHECKED RATHER THAN ASSUMED — MARKED UNVERIFIED.** The gate's
reader derivation is scoped to `docs/` in more than one place (its census
counts "docs-shaped sites", and its root-anchor ledger is argued about
`docs/`), so "also accept `method/`" may be a trigger change or may be a
scanner change. **Do not widen the trigger without re-running the census
and re-asserting the ROOT_ANCHOR_LEDGER equality** — this gate's own
design says the reader set is derived from the tree and never listed, and
a hand list is the defect two earlier cards each found.
**AND THE PER-PATH FINDING ADDS A SECOND AXIS TO THAT DECISION**: whether
the trigger should reach all of `method/` or only the compiled fourteen.
The safe answer is probably all of it — the fourteen are `KIT_FILES`, and
a trigger derived from that table is derived from the tree, which is this
gate's own design, while a trigger derived from the directory over-fires
on prose and never under-fires. **Both are askable; neither is answerable
from the directory name, which is the whole finding.**

**The cheaper interim, if the scanner is a bigger job than it looks**: a
sentence in the DOCS GATE bullet naming `method/` as a code input the gate
cannot see, with `kit.rs` as the reader — which is prose, and prose is
what this project just spent a whole card proving does not bind.

Amnesty triage 2026-08-29 (triage seat): PARKED — the gap is real and the derivation is the good kind — the three standing gates were RUN on a method-only diff rather than predicted, and all three answered NOT OWED while fourteen method/ files include_str! into the shipped binary. Its sharpest finding is the one that also makes it hard: method/ is not a category, the boundary runs THROUGH it, and neither lane-protocol.md nor roles/integrator.md is among the fourteen. The repair is MARKED UNVERIFIED by its own author, who warns not to widen the gate's trigger without re-running the reader census and re-asserting the ROOT_ANCHOR_LEDGER equality — the two halves this gate's design rests on. RESURFACES: the next tools/e2e dispatch. T-159 is the second trigger and the better one: it is a method-only diff carrying a Rust file, so it will walk into this gap by construction and can measure it rather than reason about it.
