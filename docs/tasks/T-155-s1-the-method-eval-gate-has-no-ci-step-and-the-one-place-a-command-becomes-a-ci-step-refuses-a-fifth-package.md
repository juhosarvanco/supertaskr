---
id: T-155-s1
title: The method eval gate has no CI step, and the one place a command becomes a CI step refuses a fifth package
feature: F-01
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/conventions/standing-gates.md]
suggested_by: executor claude-opus-5 @T-155
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-307-s1 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line. This card carried no canonical criteria section until this commit; the section below is derived from its own prose and its three absorbed lines (T-155-s2, s3, s7), nothing invented, then the sibling's obligations tagged with their source. Priority 9 becomes 2, the sibling's. One decision is reserved for before dispatch: the execution arrangement for the workflow file's edit.

**PROMOTED at the first standing triage, 2026-08-30, as the OWNER OF ITS CLASS: `tools/method-evals` is absent from every hand-maintained enumeration of this repository's trees.**

Four findings, one shape, one editing session. Each names a different
frozen list that a new package had to be added to and was not — and each
was re-derived at this ref and HOLDS:

| absorbed | the list that does not know the tree | site |
|---|---|---|
| this card | `DOC_DIRS` (4) + `CI_SEQUENCE` + ci.yml steps | `workflow-parity.spec.ts:399`, `.github/workflows/ci.yml` |
| s2 | `TOKEN_ROOTS` / `MUST_TOKEN_COVER` / `TOKEN_ROOTS_OUT` + tsconfig `include` | `token-scan.mjs:170,182,194` |
| s3 | the `Code layout:` bullet's tree enumeration | `docs/ARCHITECTURE.md:110` |
| s7 | `SUITES` (4) and the derived `READERS` set | `docs-scan.mjs:284` |

**THE ORDERING CONSTRAINT IS THE REASON THIS IS ONE CARD.** s2's tsconfig
arm must not break the zero-install property that this card's CI
placement depends on — confirmed at this ref: `node run.mjs` from
`tools/method-evals/` exits 0 (`6 model-free eval(s)`) with no
`node_modules` in that tree. Two lanes could satisfy their own arms and
break the joint property between them.

**A RECONCILIATION THIS CARD DID NOT KNOW IT OWED, FOUND IN
RE-DERIVATION.** `docs/CONVENTIONS.md`'s METHOD EVAL GATE bullet
documents the command as a REPO-ROOT invocation and calls it *"THE ONE
SPELLING, character for character the same string
`tools/method-evals/run.mjs`'s own header prints"*. This card's own
prescription — a `run from tools/method-evals/:` bullet with `node
run.mjs` — would mint a SECOND spelling against that bullet's own
sentence. The taking lane settles that in writing before it edits, and
says which spelling won.

**DISPATCH NOTE:** carries `docs/CONVENTIONS.md`, held by the live
`task/T-111-s10-poison-drill-bullet` lane at this sitting.

Absorbs: T-155-s2 (Standing triage 2026-08-30 (architect seat)) — the new suite sits outside the TOKEN lint's corpus and outside every typechecked program. Re-derived and HOLDS — and it is SHARPER than filed: `tools/method-evals` is absent from `TOKEN_ROOTS`, from `MUST_TOKEN_COVER` and from `TOKEN_ROOTS_OUT`, so it is neither walked nor argued-absent. The out-list is that file's own mechanism for "we decided, not forgot", and the new tree sits in a fourth state the design has no name for. Note the card's FILENAME is stale against its own body and title — it says "outside both lints", but the CONTROL arm derives from `git ls-files` and does see the tree; the body is right. File removed in this commit.

Absorbs: T-155-s3 (Standing triage 2026-08-30 (architect seat)) — the code-layout bullet names every tree in this repository except the one that just arrived. Re-derived and HOLDS: the bullet is at `docs/ARCHITECTURE.md:110-123` (not CONVENTIONS), it enumerates `app/`, `lib/parser/`, `crates/nputer-index`, `tools/e2e/` and `.github/workflows/`, and `grep -rn 'method-evals' docs/ARCHITECTURE.md` returns ZERO hits in the whole file. Explicitly NOT a component declaration — one clause naming it as dev tooling under no component. File removed in this commit.

Absorbs: T-155-s7 (Standing triage 2026-08-30 (architect seat)) — the new suite reads the governing documents and the DOCS GATE's derivation cannot see it. Re-derived and HOLDS: `npm run lint:docs` exits 0 printing "23 derived docs readers across 4 suites", and not one reader line is under `tools/method-evals`; `grep -n 'method-evals' docs-scan.mjs` returns zero; `SUITES` (`:284-289`) is frozen at four `{dir, command}` pairs and `docs-input-gate.spec.ts:107` still asserts every reader carries a suite and a command. **This arm is CODE, not a list entry** — the scanner needs a new site shape — and it is the one member a lane may split back out if the others land first; it is kept here because the tree it registers is the same tree. Its census figures have drifted from the card's table by unrelated growth; re-derive rather than copy. File removed in this commit.

T-155's first acceptance criterion is *"WHEN any method file changes THE
model-free eval set SHALL run"*. The suite exists, reds correctly and is
documented as the METHOD EVAL GATE in docs/CONVENTIONS.md — but **it runs
only when a hand runs it**, exactly like the DOCS GATE's diff half. CI
never executes it, and `method/**` is the one tree in this repository
whose change fires no automated step at all (derive: match a
`method/**`-only diff against the four gate triggers in CONVENTIONS).

**THE FENCE COULD NOT REACH IT, AND THE REASON IS MECHANICAL RATHER THAN
POLITICAL.** `deriveExpectedSteps` in
`tools/e2e/tests/workflow-parity.spec.ts` reads the `run from <dir>/:`
bullets of CONVENTIONS' "Build & test" section and compares them, in BOTH
directions, against `CI_SEQUENCE` and `LOCAL_ONLY` in that same file. Its
`DOC_DIRS` constant pins exactly four bullets in order, so a fifth
`run from tools/method-evals/:` bullet reds the lane by name — correctly.
Taking this suggestion is therefore a THREE-file edit that no single
fence in T-155's shape can hold: the CONVENTIONS bullet, that spec, and
`.github/workflows/ci.yml`. T-155's fence was
`[tools/method-evals, docs/CONVENTIONS.md]`.

**WHAT TO DO, and the order matters.** Add the `run from
tools/method-evals/:` bullet to "Build & test" with
`node run.mjs` and `node run.mjs --selftest` as its commands; add
`tools/method-evals` to `DOC_DIRS`; add both to `CI_SEQUENCE`; add the
step to ci.yml. **THE SELFTEST IS NOT OPTIONAL IN CI** — it is the
positive control, and a suite whose checks have quietly become vacuous
reports the same green as an intact one; the token lint's own
`-- --selftest` step is the precedent and it runs FIRST for the same
reason.

**THE POSITION IS ARGUABLE AND WORTH ARGUING ONCE.** Like the token lint,
this suite is zero-dependency and reads no `node_modules`, so it can run
against a bare checkout ahead of every `npm ci` — measured at this lane's
tip by running it in a worktree where only `lib/parser` and `tools/e2e`
were installed and `tools/method-evals` never was. That makes it eligible
for the job's first steps, which is where a gate that answers in seconds
belongs.

**DO NOT wire `--set model-in-loop` into CI.** It spends tokens, samples
a nondeterministic process, and its cadence is a method version bump —
CONVENTIONS' first gotcha carries that obligation. A per-commit
model-in-loop set is the ritual-with-extra-steps T-155's own card warns
about.

## Acceptance criteria

- WHEN the method-eval commands are documented THE card SHALL record the reconciliation between the existing repo-root invocation and the proposed package-relative invocation before editing either; the Build & test entry, METHOD EVAL GATE instructions and CI SHALL consistently use the selected command-and-working-directory contract for both the model-free run and its selftest. The card SHALL identify the selected spelling and working directory. (from T-155-s1's own reconciliation paragraph, in the review's words)
- WHEN workflow parity is derived THE spec's package/command inventory SHALL include the method-eval suite and both selected invocations, with parity checked in BOTH directions between the documented commands and ci.yml. (from T-155-s1, in the review's words)
- WHEN CI runs THE model-free evals SHALL run as an early step ahead of every `npm ci`, the selftest FIRST as the positive control (a suite whose checks went vacuous reports the same green as an intact one), the zero-install property measured rather than assumed; the model-in-loop set SHALL NOT be wired into CI. (from T-155-s1; T-307-s1's CI half)
- WHEN the token lint and the typecheck run THE suite SHALL be inside the token lint's corpus (`TOKEN_ROOTS`, `MUST_TOKEN_COVER`) and inside a typechecked program, without breaking the zero-install property the CI placement depends on. (absorbed T-155-s2, carried)
- WHEN ARCHITECTURE's code-layout bullet enumerates the trees THE method eval suite SHALL be among them. (absorbed T-155-s3, carried)
- WHEN the docs gate derives its readers THE suite's readers of the governing documents SHALL be visible to it (docs-scan's SUITES and READERS). (absorbed T-155-s7, carried)
- WHEN the METHOD EVAL GATE decides whether to run THE trigger SHALL be derived from the eval corpus's own declared `reads`, never a hand-kept list of directories beside the corpus, so that a docs-only commit touching docs/rooms/ runs MF-11 and the next eval added is in the trigger without anyone editing it; a body degrades a copy of the declaration and requires the trigger to move. (absorbed from T-307-s1)
- BEFORE dispatch THE execution arrangement for the workflow file's edit SHALL be recorded on this card (the harness refuses a subagent's write under .github/workflows/; the one prior seat edit was a one-merge ruling, not a standing permission). (the reserved decision)

## Absorbed from T-307-s1 — The METHOD EVAL GATE fires on a method/** diff, but the eval that holds the room-entry rule reads docs/rooms/ — a room entry lands in a docs-only commit and the eval that would refuse it never runs (kept whole)

Title as filed: "The METHOD EVAL GATE fires on a method/** diff, but the eval that holds the room-entry rule reads docs/rooms/ — a room entry lands in a docs-only commit and the eval that would refuse it never runs"

Filed as: status suggested, priority 2, size S, touches [docs/CONVENTIONS.md, .github/workflows/ci.yml, tools/e2e/scripts/ci-owed.mjs], wake None, suggested_by "executor claude-opus-5@subagent @T-307, measured at a00acf00bf6000d646c96218986032b599c2159c, 2026-09-10".

### The finding, measured at `a00acf00bf6000d646c96218986032b599c2159c` (T-307-s1)

T-307 added MF-11 to the method eval corpus: it reads every room entry
dated on or after the rule's floor and refuses one that quotes the
owner's message or names a person. Its SUBJECT is `docs/rooms/**`. The
gate that runs it fires on something else.

- docs/CONVENTIONS.md's METHOD EVAL GATE bullet: the trigger is a merge
  whose diff touches `method/**`, or one that adds a line matching the
  citation grammar under `docs/tasks/`.
- `.github/workflows/ci.yml` at this ref runs no method-eval step at
  all — derived by grepping the workflow for the runner's one spelling,
  which returns nothing — so the gate is a hand run at a merge.
- `tools/e2e/scripts/ci-owed.mjs` names four suites, and none of them is
  the method eval set.

So the ordinary way a room entry arrives — a seat appends to a room and
commits under `docs/`, with nothing under `method/` in the diff — is
exactly the case in which nothing runs MF-11. The eval is real, its
positive control is real, and the entry it exists to refuse can reach
main without it ever being asked.

### Why it was not fixed in T-307 (T-307-s1)

Every one of the three files above is outside that card's fence, and
docs/CONVENTIONS.md was held by a live lane beside it (T-295). T-307's
own criterion 4 already routes its one CONVENTIONS line to the
integrator at the merge; widening a standing gate's trigger is a
different write and wants its own card.

### The shape that would work (T-307-s1)

Widen the METHOD EVAL GATE's trigger to name the eval corpus's declared
`reads`, rather than one directory: every model-free eval already
declares the paths it depends on, so the trigger can be derived from the
corpus instead of restated beside it — the same move the DOCS GATE makes
when it derives its readers rather than listing them. A CI step is the
cheaper half and buys the whole tree rather than the merge: the runner
needs no install (the suite reads no `node_modules`), so it can sit
beside the token lint as an early step.

The trap to avoid: adding `docs/rooms/**` to the trigger by hand. That
is a second list of what the evals read, and the next eval added to the
corpus will not be in it.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
