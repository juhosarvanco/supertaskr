---
id: T-132-s2
title: method/ is a code input exactly the way docs/ is, and a method-only diff matches NO standing gate — the argument that created the DOCS GATE, one directory over
status: rejected
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

**RE-PARKED WITH A NEW CONDITION (2026-08-30, `T-159-s1`, the card triage promoted to write T-159's rider stamps). THE CONDITION ABOVE FIRED, TWO THIRDS OF THIS CARD WERE ANSWERED, AND THE THIRD IS NOT RE-STAMPED UNDER THE OLD NOTE — parking twice with the same note is how a shelf forms** (`method/tasks/TASK-FORMAT.md`, the parking rule). Re-derived at `51fa31c`, by running the gate rather than predicting it, which is this card's own method:

- **THE PRIMARY IS DISCHARGED.** *"A method-only diff matches NO standing gate"* is false at this ref: `docs/CONVENTIONS.md:1542` carries a FOURTH standing gate, the METHOD EVAL GATE (T-155, ADR-020 decision 2), firing *"at any merge whose diff touches `method/**`"*. Its bullet derives the hole this card measured rather than asserting it, matching a `method/**`-only diff against the other three triggers one by one.
- **THE CARGO RESIDUAL IS TAKEN, AND IT IS TAKEN BY NAME.** `docs/CONVENTIONS.md:1605-1619` — *"AND THIS GATE CLOSES THE TRIGGER HOLE, NOT THE CARGO ONE (`T-132-s2`'s residual, taken at T-159)"* — carries this card's sharpest finding into the standing text: the boundary runs THROUGH `method/`, the directory name answers nothing, `lane-protocol.md` and `roles/integrator.md` are outside the `KIT_FILES` table while every adapter and docs-template is inside it, DERIVE the paths at your own ref and run `cargo test` when your diff hits one. Both cargo bodies this card corrected the count on are named there.
- **THE MEASUREMENT STILL REPRODUCES**, which is why the survivor is real work and not a stale note. `node tools/e2e/scripts/docs-gate.mjs method/lane-protocol.md method/roles/integrator.md method/tasks/TASK-FORMAT.md`, run from the repository root at `51fa31c`: *"3 changed path(s) given, none under docs/ — this gate is not owed"*, **exit 0**.

**WHAT SURVIVES IS ARM ONE ALONE — WIDEN THE TRIGGER — AND IT SURVIVES EXACTLY BECAUSE ITS AUTHOR MARKED IT UNVERIFIED.** The same CONVENTIONS bullet says so in its own voice: *"widening this gate's trigger to fire cargo is NOT done here and stays that card's, because it needs the reader census re-run and the root-anchor ledger re-asserted rather than a word changed in a trigger."* The two halves it names are live and countable at this ref, from the same command's `--census` output: **24 derived docs readers across 4 suites**, **150 docs-shaped sites in 31 files**, and **6 root-anchored files sitting in a suite not already owed for all of `docs/`, each argued in `ROOT_ANCHOR_LEDGER` (`tools/e2e/scripts/docs-scan.mjs`), with the two sets asserted equal**. The second axis this card added is also still open and still unanswerable from a directory name: whether the widened trigger reaches all of `method/` or only the `KIT_FILES` subset.

**NEW RESURFACING CONDITION: the merge of `T-127-s8`** — `status: planned`, `touches: [tools/e2e]` at this ref, and its subject IS this census (*"the docs-gate census cannot see a reader that reaches docs/ through a helper it does not know"*). That lane must re-derive the reader set and re-assert the ledger to do its own job, which is precisely the precondition this arm was refused for; taking this arm there costs the census once instead of twice. **If `T-127-s8` is disposed of without touching the scanner, the condition falls back to the next dispatch whose fence reaches `tools/e2e/scripts/docs-gate.mjs` AND `tools/e2e/scripts/docs-scan.mjs`** — both, because the census lives in one and the ledger in the other, and an arm that can only reach one of them is the half-fix this card already warns against. Checkable by whoever cuts that lane, off the card's own `touches:`, without remembering this card. **NOT a method/ dispatch and NOT T-159**: this is a tools/e2e scanner change, the method text it wanted is already written, and a second bump would have nothing to carry.

Disposition 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): discharged — the work landed elsewhere: T-155 (done). the method eval gate is the fourth standing gate, and merge.mjs carries the step "the METHOD EVAL GATE — method/ moved" that fires on any diff touching method/**.
