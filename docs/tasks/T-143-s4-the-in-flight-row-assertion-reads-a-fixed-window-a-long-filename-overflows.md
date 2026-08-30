---
id: T-143-s4
title: The in-flight row assertion reads a fixed 600-character window that a long card filename overflows — green wherever the card has a lane, red only on CI, found by the first push after a long-named dispatch
feature: F-04
milestone: 4
priority: 1
size: S
status: building
blocked_by: []
suggested_by: integrator nputer-4e @T-025-s5 merge, CI run on 8e6b18b (2026-08-30)
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
touches: [tools/e2e]
---

`tests/dispatch-order.spec.ts:308` ("A CARD IN FLIGHT WITH A DECLARED
FENCE APPEARS IN THE REPORT") walks every in-flight card and asserts
the lane-or-no-lane sentence within `after.slice(0, 600)` of the
card's row. Every report line carries its provenance stamp, and the
stamp carries the card's FULL PATH — so the window a row gets is a
function of its filename length. `T-025-s5`'s 119-character path,
stamped twice before the sentence, pushed it past 600 and redded CI
run #376 (commit 8e6b18b) — while every local run of the same suite
was green, because locally the card HAD a lane and took the shorter
"HAS a lane above" arm. The no-lane arm only ever executes where no
worktrees exist, which is CI and nowhere else this project runs.

The class: a spec window measured in characters over lines whose
length is data-dependent. The fix is to derive the window from
STRUCTURE — the card's own block, sliced at the next row that starts a
different card id — not to widen the constant (620 fails on the next
filename). The sentence itself prints unconditionally at
`scripts/dispatch-order.mjs` (the `holds no fence` / `HAS a lane
above` pair), so the report is honest; only the spec's ruler is wrong.

Fence note at filing: `touches: [tools/e2e]` is HELD by T-162's live
lane — dispatch after it lands; the lane list is the authority. The
interim exposure is one spec body, red only on CI, only while a
long-named card sits at `status: building` with no lane.

MEASURED BEFORE THE NEXT PUSH (2026-08-30, integration seat, CI-shaped clone — no worktrees, so the no-lane arm runs): **T-162's row ALSO overflows.** The 600-character slice ends mid-sentence — `and it has NO lane, so it holds n` — the phrase BEGINS inside the window and is truncated by it, so the assertion fails on a report that is printing exactly the right thing. Two contributors, both data-length: the card's title in the row line and the card's filename in each stamp. Consequence: main's push is HELD at the T-025-s5 checkpoint until this card lands — the fence frees when T-162 merges, and this dispatches immediately after, ahead of T-156-s1 and T-160-s4 (a red main outranks new work).

PROMOTED AT FILING-PLUS-ONE (2026-08-30, integrator, the T-153-s5/s6 precedent): main's push is HELD on this card alone — the CI-green standing authorization covers a blocker on the green path, and the clone measurement above is the startability evidence. Dispatched the moment T-162's landing freed the fence.

## Implementation notes

Built in worktree `/Users/ujju/Projects/nputer-T-143-s4` on
`task/T-143-s4-spec-window`, cut from `4d3dd8f`. ONE file changed:
`tools/e2e/tests/dispatch-order.spec.ts`. `scripts/dispatch-order.mjs`
is HONEST and was not touched — its sha256 is unmoved across this lane
and across every drill arm below.

### The structural window

Two module-level helpers in the spec, and the constant is gone:

- `inFlightRows(rendered)` — the IN FLIGHT section's ROWS. Both edges
  are `render`'s own shape rather than a count: the section's three
  header notes are skipped while the line starts `# `, and the section
  closes at the empty line a `blank()` record renders as.
- `blockFor(rows, id)` — ONE card's block: its own row, plus every line
  under it, up to the next row that starts a DIFFERENT card id, or the
  section's end for the last card. A card's row starts at column 0; its
  ruling rows are indented, which is `dispatchReport`'s own shape. The
  ` [` in the match is load-bearing — `T-143` is a prefix of `T-143-s4`
  and the bracket is what separates the id from the roadmap cell.

Per card the body now asserts FIVE things where it asserted one:

1. the block is non-empty (`${id} is in flight and is not listed`);
2. the block holds EXACTLY ONE column-0 row — the guard that stops a
   structural window from quietly becoming a bigger net;
3. that row is this card's;
4. the exact phrase, unweakened — `it HAS a lane above` /
   `it has NO lane, so it holds no fence` — inside the block's RULING
   rows, the title row dropped because a title is the other
   data-length contributor and is not where the sentence prints;
5. the OTHER arm is ABSENT from the block, so the row SAYS which of the
   two it is rather than merely containing a sentence.

Nothing was widened: `600` is not replaced by a larger number anywhere.

### The clone measurement, before and after

A CI shape is a checkout with NO sibling worktrees and a DETACHED HEAD,
so every building card takes the no-lane arm. Cut with
`git clone --branch task/T-143-s4-spec-window <lane> <scratch>` then
`git checkout --detach`; `git worktree list --porcelain` there returns
ONE entry, `detached` — zero lanes. lib/parser built, app and tools/e2e
installed per the fresh-worktree order. Port `NPUTER_E2E_PORT=14539`,
lsof-read at zero rows first.

**BEFORE, at `4d3dd8f`** — `npx playwright test
tests/dispatch-order.spec.ts`: **1 failed / 12 passed, exit 1**. The
failing body is line 308's, on `T-143-s4`'s own row:

    Expected substring: "it has NO lane, so it holds no fence"
    Received string:    "…   and it has NO lane, so "

The report is printing the right sentence and the ruler cuts it
mid-word. Measured on the same clone against the live worktree list:

| card | file path | lane | phrase at | fits in 600 |
|---|---|---|---|---|
| `T-143-s4` | 97 ch | none | `[581..617]` | **NO** |
| `T-163` | 96 ch | none | `[515..551]` | yes, by 49 |
| `T-135` | 53 ch | none | `[452..488]` | yes, by 112 |

`T-162`, the row the card's own filing measured, has since landed; the
overflowing row at this ref is THIS CARD'S, and `T-163` sits 49
characters from the same cliff. That is the class: the margin is a
function of a filename nobody is watching.

**AFTER, at `af6bacc`** (the clone re-pointed with
`git fetch origin task/T-143-s4-spec-window` + `git checkout --detach
FETCH_HEAD`): **13 passed, exit 0**.

In the LANE, where `T-143-s4` and `T-163` HAVE lanes and `T-135` does
not, both arms run and the same spec is **13 passed, exit 0**.

### Poison drill — five arms, all RED, one side each

At the committed tip `af6bacc`, in the detached clone, never in the lane
tree. Every arm printed the PLANTED TEXT before running; two arms
(M3, M4) failed to plant on the first attempt — perl interpolated the
generator's own `${…}` — reported EXIT 0 on an UNMUTATED file, and were
re-run through an exact-string planter that refuses unless the needle
occurs exactly once. That is the drill rule earning its keep: a
substitution count is not a mutation.

| arm | side | mutation | result |
|---|---|---|---|
| M1 | producer | the no-lane sentence REWORDED (`NO lane` → `NO worktree`) | **exit 1** — `Expected substring: "it has NO lane, so it holds no fence"` |
| M2 | producer | the no-lane row prints BOTH arms | **exit 1** — `T-143-s4's block carries both arms` (assertion 5) |
| M3 | producer | the card's own ROW deleted from the section | **exit 1** — `T-143-s4 is in flight and is not listed`, expected `> 0`, received `0` (assertion 1) |
| M4 | spec | `blockFor`'s boundary never closes — THE WIDER-NET mutant | **exit 1** — `T-143-s4's block holds another card's row`, received `+ 2` (assertion 2) |
| M5 | producer | the HAS-a-lane sentence reworded, against a FIXTURE lane (`git worktree add -b task/T-135-drill` inside the clone, so `T-135` takes the lane arm) | **exit 1** — `Expected substring: "it HAS a lane above"` |

M4 is the arm this card owes specifically: it proves the structural
window did not become a bigger net. M5 is the arm the clone alone cannot
reach — a clone has no lanes, so the lane arm needed a fixture lane
rather than the lane tree.

RESTORATION, byte-exact, both sides named
(`git restore --source=HEAD --staged --worktree -- <path>`), sha256 of
the worktree file against `git show HEAD:<path>`:

    tools/e2e/scripts/dispatch-order.mjs
      worktree : e9ed26097d56427620f0cfaf01c14ba713454ad26b2f9224a2798bcfe7389b7a
      HEAD     : e9ed26097d56427620f0cfaf01c14ba713454ad26b2f9224a2798bcfe7389b7a
    tools/e2e/tests/dispatch-order.spec.ts
      worktree : a968f836eba861376bc48c2895938df282768c1fb00fbf7d21ed0be43f2a36f6
      HEAD     : a968f836eba861376bc48c2895938df282768c1fb00fbf7d21ed0be43f2a36f6

`git status --porcelain` in the clone: no rows. The whole spec restored:
**13 passed, exit 0**.

### Gates, unpiped

From `tools/e2e/`, `NPUTER_E2E_PORT=14538` (lsof at zero rows first),
after `npm install` in tools/e2e (exit 0), `npm install` + `npm run
build` in lib/parser (exit 0, 0) and `npm install` in app/ (exit 0 — the
lane's preflight refuses without `app/node_modules`).

| gate | exit |
|---|---|
| `npm install` (tools/e2e) | **0** |
| `npm test` | **1** — 5 failed / 315 passed, every failure attributed below |
| `npm run typecheck` | **0** |
| `npm run lint:docs` | **1** — T-143-s5, below |
| `npm run lint:tokens -- --selftest` | **0** |
| `npm run lint:tokens` | **0** |

### The five reds, attributed — none of them this lane's

**TWO are `T-143-s1`'s class**, and the named cause differs from the
dispatch brief's prediction, so it is stated rather than assumed. The
brief expected `session-economics.spec.ts:73` red from the live `T-163`
lane through `T-112`'s expansion. The actual message names THIS lane:

    fences are not disjoint: T-143-s4 tools/e2e against T-157 tools/e2e
      — the same entry (lane-protocol rule five).

`T-157` declares `touches: [docs/checkpoints/, tools/e2e]`, so BOTH
bodies that spawn `brief.mjs --task T-157` and assert exit 0 —
`session-economics.spec.ts:73` and `:247` — red for ANY lane holding
`tools/e2e`, which is exactly the sentence on T-143-s1's card. Not
touched. PROVED lane-caused: the same spec in the no-lane clone at
`af6bacc` is **10 passed, exit 0**.

**THREE are NEW and are carded as `T-143-s5`** —
`docs-input-gate.spec.ts:720`, `:846` and `:907`, all three asserting a
code-only path list reaches the reader as exit 0. The cause is one line
of `npm run lint:docs`:

    docs-gate: docs/STATE.md is STALE against 1 newer checkpoint record(s)
      2026-08-30-T-162.md

`8e659b1` appended eight lines to the T-162 record FOUR MINUTES after
`f90edfd` wrote that record and regenerated STATE together, correctly,
in one commit. It is a TREE fact, not a lane one — it reproduces in the
no-lane clone at `4d3dd8f`, my own base — and `docs/STATE.md` is outside
this fence. **It reds a CI STEP**, so it is routed loudly rather than
quietly: see `T-143-s5` — whose INSTANCE main has since discharged, per
the section below. It does not reach the merge.

### Conflicts, and MAIN MOVED UNDER THIS LANE

No file conflict. Nothing outside `tools/e2e` and `docs/tasks/` was
written by this lane.

**BUT `main` MOVED**, and the first draft of this section said it had
not — corrected here rather than deleted, because the correction is the
finding. Cut at `4d3dd8f`; at handoff `main` is **`35e6504`**, three
commits ahead, touching `docs/STATE.md`, `docs/rooms/team-enablement.md`
and two new cards (`T-164`, `T-165`). Derived with
`git -C <main> log --oneline 4d3dd8f..35e6504` and
`git diff --name-only 4d3dd8f 35e6504`. **Disjoint from this lane's two
files**, so the merge carries no conflict.

**AND ONE OF THOSE THREE COMMITS DISCHARGES T-143-s5's INSTANCE.**
`35e6504`'s subject ends *"and STATE regains currency over the appended
record"*: it regenerated `docs/STATE.md` at 11:12:02, newer than the
T-162 record's `8e659b1` at 10:53:21. Re-measured in the CI-shaped clone
at that ref, `node tools/e2e/scripts/docs-gate.mjs app/src/main.tsx`
from the repository root is **exit 0 at `35e6504`** where it is **exit 1
at `4d3dd8f`**. So the THREE `docs-input-gate` reds in the gate table
above are an artefact of THIS LANE'S BASE COMMIT and go green at the
merge — they are not carried into main. T-143-s5 therefore keeps
`status: suggested` with a `closed_by:` line for the instance and asks
only the question that survives it: whether an APPEND to an
already-checkpointed record should re-trigger the staleness rule at all.
This lane did not rebase — that is not the executor's move — and does
not need to.

### THE MERGE SHAPE, RUN — the strongest evidence this card has

Because `main` moved, the lane's own gate table is not what CI will see.
So the merge was BUILT and RUN rather than argued about.

The executor's RANGE RULE form, from the lane:

    TREE=$(git merge-tree --write-tree 35e6504 HEAD)
    git diff --name-only 35e6504 "$TREE"

exit **0**, `TREE=a286c5710280036027d228ce9434253248be3dd3`, three paths
and no conflict: this card, `T-143-s5`, and
`tools/e2e/tests/dispatch-order.spec.ts`.

That tree was then MATERIALIZED in the CI-shaped clone — detached at
`35e6504`, this lane's three files checked out over it — and `git
write-tree` there answered **`a286c5710280036027d228ce9434253248be3dd3`**,
the same object, so the checkout IS the merge's content rather than a
resemblance to it. `git worktree list --porcelain` there: **zero**
`task/` branches, so every building card takes the no-lane arm — the
board at that tree still carries `T-143-s4` (97 ch), `T-163` (96 ch) and
`T-135` (53 ch) at `status: building`.

| gate, at the merge tree, no lanes, `NPUTER_E2E_PORT=14539` | exit |
|---|---|
| `npm test` | **0** — **320 passed** |
| `npm run typecheck` | **0** |
| `npm run lint:docs` | **0** |
| `npm run lint:tokens -- --selftest` | **0** |
| `npm run lint:tokens` | **0** |

320 = the lane's 315 plus the five reds, every one of which is base- or
lane-caused and none of which survives the merge. `lint:docs` prints
*"every live task card's frontmatter parses, with a legal status"* over
both new cards, `T-143-s5`'s `closed_by:` key included.

### The lane's own final gate run, for completeness

Re-run at `197c69d` after both cards landed in the lane, same figures as
the table above: `npm test` **exit 1, 5 failed / 315 passed** — the same
five, by name — `npm run typecheck` **0**, `npm run lint:docs` **1**
(the base's STATE staleness), `npm run lint:tokens -- --selftest` **0**,
`npm run lint:tokens` **0**.

### Criteria unmet

None known. The one thing this card was asked to prove and could not
prove from the lane alone — that the fix holds in the shape where the
defect fires — is proved twice: in a clone at the lane's own tip
(`af6bacc`, 13 passed) and at the merge tree (`a286c571`, 320 passed).
