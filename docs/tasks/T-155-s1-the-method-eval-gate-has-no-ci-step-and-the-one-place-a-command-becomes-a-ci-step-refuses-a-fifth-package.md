---
id: T-155-s1
title: The method eval gate has no CI step, and the one place a command becomes a CI step refuses a fifth package
feature: F-01
milestone: 4
priority: 9
size: M
status: planned
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md, docs/ARCHITECTURE.md]
suggested_by: executor claude-opus-5 @T-155
builder:
verifier:
built_by:
verified_by:
review:
---

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
