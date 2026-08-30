---
id: T-156-s5
title: The health command is written down beside its own bullet and nowhere else, because listing it in "Build & test" is one commit across two packages and T-156-s1's fence held one of them
feature: F-06
milestone: 4
priority: 14
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-156-s1
builder:
verifier:
built_by:
verified_by:
review:
---

**THE ROUTED HALF OF `T-156-s1`, MEASURED RATHER THAN PREDICTED.** That
card was dispatched with `touches: [docs/checkpoints/,
docs/CONVENTIONS.md, .github/workflows/]` while its own body asks for
`[docs/CONVENTIONS.md, docs/checkpoints, .github, tools/e2e]` and says
in as many words that *"no smaller fence can honour"* the
`workflow-parity.spec.ts` coupling. It was smaller by exactly that path.

`npm run health` is now written down in docs/CONVENTIONS.md — in the
`HEALTH BANDS AT THE CHECKPOINT` bullet under Gotchas, beside the
ceremony it serves, which is where `node tools/method-evals/run.mjs` and
GRAPH REGEN's own regen command already live. **It is NOT in the
`Build & test` tools/e2e command bullet**, and this card is that listing.

## What it costs today, measured at `8c210b2`

One line changed in the tools/e2e command bullet
(`` `npm run typecheck` `` → `` `npm run typecheck` · `npm run health` ``),
nothing else, then `NPUTER_E2E_PORT=14733 npx playwright test
tests/workflow-parity.spec.ts` from tools/e2e/:

    3 failed, 14 passed, exit 1

| body | what it said |
|---|---|
| `the expected commands derive cleanly from docs/CONVENTIONS.md` | *"lists [tools/e2e] npm run health, which this spec has no entry for — add it to CI_SEQUENCE (verbatim or mapped, with the workflow step) or to LOCAL_ONLY with the reason CI does not run it."* |
| `FIXTURE: a command the DOC gains that the spec does not claim reds BY NAME` | its own `expect(before.problems, "the live doc derives cleanly")` |
| `FIXTURE: the shape that IS silent — a command in a bullet with no run from marker` | the same live-doc control |

The mutant was reverted with `git checkout docs/CONVENTIONS.md` and the
tree was clean before the real edits landed.

## The work

1. Add `` `npm run health` `` to the tools/e2e command bullet in
   `docs/CONVENTIONS.md`'s `Build & test`, in the file's own typography
   (middle dot BETWEEN commands, never inside a parenthetical).
2. In the SAME commit, add the matching `LOCAL_ONLY` entry to
   `tools/e2e/tests/workflow-parity.spec.ts` with the reason — the
   disposition is already decided in writing and is LOCAL ONLY, argued in
   full in the `HEALTH BANDS AT THE CHECKPOINT` bullet: the command exits
   3 at every ref while any band is unkept, so a step would red every
   push for no actionable signal (AUDIT GATE POLICY's own argument
   against `--deny warnings`), and its readings are the OUTPUTS of steps
   the job already runs.
3. `LOCAL_ONLY` is asserted rather than merely listed — the spec checks
   that CONVENTIONS' CI bullet also says CI does not run it — so the CI
   bullet gains that sentence too. That is a third file-half in the same
   commit, and it is inside `docs/CONVENTIONS.md`.

## Why it is not just "widen the next fence"

The card this comes from could have written the command into a bullet
carrying no `run from <dir>/:` marker and passed every lane in silence —
that shape is pinned as genuinely invisible by
`FIXTURE: the shape that IS silent`. It did not, and the next lane should
not either. **The listing is owed; what was refused is smuggling it.**
