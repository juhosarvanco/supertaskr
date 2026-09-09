---
id: T-256
title: CONVENTIONS says `npm install` for app/, CI runs `npm ci`, and under a lane fence `install` fails EACCES on the lockfile rewrite — one spelling, `npm ci`, and the parity spec's install→ci mapping retired
feature: F-01
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: "the T-247 executor seat, 2026-09-08 (row 13 of its report): the brief's build row transcribes CONVENTIONS' `npm install` for app/, which rewrites app/package-lock.json outside the lane's fence and is refused EACCES; `npm ci` works — and tools/e2e/tests/workflow-parity.spec.ts already maps the doc's `npm install` to CI's `npm ci` with a written reason"
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was found

Two seats reached the same line from opposite sides. The workflow-parity
spec carries a documented divergence: CONVENTIONS' Build & test bullet
says `npm install` for app/ and ci.yml runs `npm ci`, with the reason
written into the spec. A lane executor then found the third reading:
under a lane fence, `npm install` in app/ tries to rewrite
app/package-lock.json, which is outside the fence, and the hook refuses
it (EACCES); `npm ci` never writes the lockfile and works. So the
doc's spelling is the one that fails for the seats that read it most.
Also from the same report: the brief's build order stops at lib/parser
and app/, but tools/e2e's own preflight refuses without
app/node_modules and lib/parser/dist — the brief's fresh-worktree
paragraph should say so in its order, not only in its warning.

## Acceptance criteria

- WHEN CONVENTIONS' RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT
  bullet publishes its recipe THE recipe SHALL also suppress git's
  identity AUTO-DETECTION (`-c user.useConfigOnly=true`, or the
  `GIT_AUTHOR_*`/`GIT_COMMITTER_*` variables unset AND
  `user.useConfigOnly=true`), and the bullet SHALL say why: the two
  `GIT_CONFIG_*=/dev/null` variables suppress config FILES only, so on a
  host whose hostname carries a dot the recipe answers green and
  reproduces no runner red (T-239-s4's class; measured at 0f6b37f).
- IF the recipe is run against the T-239 ritual fixture at 0f6b37f THEN
  it SHALL reproduce the runner's exit 128 (the control T-239-s4's
  verifier took at the base: `useConfigOnly` arming 1 failed / 56 passed).
- WHEN CONVENTIONS' Build & test bullet is read THE app/ install line
  SHALL say `npm ci`, and the parity spec's install→ci mapping (the
  `steps: [{ dir: "app", run: "npm ci" }]` entry with its reason) SHALL
  be retired so the doc and CI say the same words — the spec's
  "verbatim" class then covers app/ the way it already covers the
  parser package (respelled by the seat, 2026-09-09: the preflight read
  the package's path here as a criterion path outside the fence).
- WHEN the fresh-worktree sub-bullet is read THE build ORDER SHALL name
  tools/e2e's `npm ci` and the app build as steps a lane runs before
  its suite, in the order the preflight demands.
- The workflow-parity suite SHALL be green with the mapping gone, and
  the docs gate SHALL be run on CONVENTIONS (the budget line printed).
- IF the dispatch brief's build rows are derived from the bullet THEN
  a brief assembled after the merge SHALL print `npm ci` for app/ —
  checked once by hand and recorded in the report.

## Implementation notes (executor, 2026-09-09, lane
`task/T-256-npm-ci-one-spelling`, base `89f23ca`)

Two files moved, both inside the fence: `docs/CONVENTIONS.md` and
`tools/e2e/tests/workflow-parity.spec.ts`. **No app or Rust source is
touched, and no spec NAME moved** — `npm run capabilities:check` answers
CURRENT at the tip, so this lane owes the census nothing.

**T-216-s6 IS ABSORBED BY THIS LANE'S WORK.** Both of its criteria are
satisfied by the same commit: the fresh-worktree ordering now names a
command that succeeds inside an armed lane, and the parity spec's
divergence mapping moved with it. What was built is that card's TRIAGE
RULING, not a fresh decision — `npm ci` from app/, said in the lane
bullet beside the fresh-clone ORDER, and no lockfile added to
`alwaysWritable`. This lane did not edit T-216-s6; the seat stamps it at
the merge.

### `npm ci` under an ARMED fence, measured from the other side

The card was filed on three lanes' EACCES. This lane is the positive
case, taken in this worktree with the physical layer armed:

    lib/parser  npm ci          exit 0        npm run build  exit 0
    app         npm ci          exit 0 (499 packages)
    app         npm run build   exit 0
    tools/e2e   npm ci          exit 0

`git status --porcelain` was EMPTY after all four: none of them writes a
lockfile, which is exactly why the fence permits them and refuses
`npm install`.

### The borrowed-git recipe — the identity gap, measured

On this host (`Mac.lan`, git 2.50.1), in a scratch repository with no
configured identity. Each row is one `git commit`, exit read unpiped:

| arming | exit | author |
|---|---|---|
| bare (this machine's config) | 0 | `ujju <ujjuujju@proton.me>` |
| `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` — THE RECIPE AS PUBLISHED | **0** | `ujju <ujju@Mac.lan>`, AUTO-DETECTED |
| + `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=user.useConfigOnly GIT_CONFIG_VALUE_0=true` | **128** | *"Author identity unknown"* |
| the triple WITHOUT the `/dev/null` pair | 0 | `ujju <ujjuujju@proton.me>` |
| the whole recipe + `GIT_AUTHOR_*`/`GIT_COMMITTER_*` set | 0 | `t256 <t256@example.invalid>` |

Rows 4 and 5 are the controls for the two halves: the config files must
be suppressed AND the auto-detection switched off, and an environment
identity outranks both — which is why the bullet now says to unset
`GIT_AUTHOR_*`/`GIT_COMMITTER_*`. The published recipe used
`-c user.useConfigOnly=true`'s ENV form because a suite spawns its own
gits: `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` is how one key reaches all of
them, and the `-c` spelling is named beside it for a single command.

### The control at `0f6b37f`, on the T-239 ritual fixture

`npx playwright test tests/brief.spec.ts` from `tools/e2e/`, whole file,
at `0f6b37f34665` — the ref the criterion names — in a `--shared` clone
under the scratch directory (NOT a worktree: cutting one would have put
a fourth entry in `git worktree list` while three lanes were live).
Every exit read unpiped:

| arming | exit | count |
|---|---|---|
| ordinary | **0** | 57 passed |
| the recipe AS PUBLISHED (the two `/dev/null` variables) | **0** | **57 passed — it reproduces NOTHING** |
| the recipe THIS LANE PUBLISHES | **1** | **1 failed, 56 passed** |

The one red is `brief.spec.ts:3230` *THE ARM LEAVES EXACTLY WHAT THE
EIGHT HAND STEPS LEAVE, file for file*, and it is the RIGHT red: its
captured output carries `*** Please tell me who you are.` and
`stopped at step 1 (stamp)` — CI run 33672240360's own failure. Those
are the figures T-239-s4's verifier recorded for the identity-disabled
cell at this base (1 failed / 56 passed), reproduced here by the recipe
the doc now publishes rather than by a hand-built arming.

**AND THE MIDDLE ROW IS THE POINT OF THE WHOLE EDIT**: the recipe
CONVENTIONS published until this commit answers 57 passed at a base CI
had already reddened.

**One environment correction, disclosed.** The clone's own `main` was
still at the integration tip, so `checkout-currency.mjs` answered STALE
with `[registration-missing]` / `[guard-surface-behind]`, and the
ordinary arm then failed the SAME body at step 3 (preflight) for that
unrelated reason — the STALE-CLONE LIMIT that tool prints about itself.
`git branch -f main 0f6b37f` in the clone answers CURRENT and the
ordinary arm goes green, which is the cell that breaks the degeneracy.
All three rows above were taken in that state.

### The drill — three mutants, each RED ALONE, each restored by sha256

Pre-drill digests: `docs/CONVENTIONS.md`
`0e0867c0314de84f3f3d01ab80618211425e30e1d41dcf69d144afc377f5d3ad`,
`tools/e2e/tests/workflow-parity.spec.ts`
`4926500d01e42450bc83c624ed570a2638bd48ce6d5677b13ede13d194d22632`.
Each mutation was applied alone, the whole parity file run, then
inverted and the digest compared (an inverse edit, not `git restore` —
the work was uncommitted at the time and a restore would have discarded
it).

| # | mutation | exit | named by |
|---|---|---|---|
| M1 | the DOC says `npm install` for app/ again | 1 | *lists [app] npm install, which this spec has no entry for* AND *this spec expects [app] npm ci, which … no longer lists* — 4 bodies |
| M2 | the spec's new verbatim entry still says `npm install` (an incomplete retirement) | 1 | the mirror pair, both sides named — 4 bodies |
| M3 | the app entry deleted outright (the retirement taken too far) | 1 | *lists [app] npm ci, which this spec has no entry for* — 4 bodies |

Both files' digests matched their pre-drill values after the drill, and
`git status --porcelain` showed only the two fenced files.

### The bytes

`docs/CONVENTIONS.md` 129,306 bytes at the base `89f23ca` to 131,328 at
the lane tip `d3b5a16` (**+2,022**), against the ADR-019 band `landed
117,502 / warn 146,878 / fail 176,253` — the gate prints
*governing-document budgets hold*, with 15,550 bytes of headroom to the
warn line. Two cuts were taken in the same file rather than one:
the retired DIVERGENCE 1 sentence, and the fresh-worktree sub-bullet's
pointer at the fresh-clone ORDER, which the new explicit ORDER makes
redundant. **The additions still outweigh the cuts, and that is stated
rather than rounded away.**

### The battery, all at the lane tip `d3b5a16` unless a row says otherwise

    node tools/e2e/scripts/gate-run.mjs e2e     exit 0  GREEN  742 bodies
    node tools/e2e/scripts/gate-run.mjs parser  exit 0  GREEN  389 bodies
    npm test            (app/)                  exit 0  1171 tests, 51 files
    cargo test          (app/src-tauri/)        exit 0  650 bodies, 18 binaries
    index --check       (app/src-tauri/)        exit 0  CURRENT
    npx playwright test tests/workflow-parity   exit 0  22 passed
    docs-gate.mjs docs/CONVENTIONS.md           exit 1  FIRES, budgets hold
    capabilities:check / typecheck              exit 0 / exit 0
    lint:tokens / --selftest / lint:docs        exit 0 / exit 0 / exit 0

Both `gate-run` legs recorded `dirty: false` at that ref. The docs gate's
exit 1 is its FIRES answer, not a failure: it names four owed suites
(cargo, app, tools/e2e, lib/parser) and all four are above.

### For the verifier

- The FENCE held: `git diff --name-only 89f23ca..HEAD` names three
  paths, two of them the manifest's and the third this card under the
  unfenceable `docs/tasks/`.
- The docs gate FIRES on this diff and names two suites — `npm test`
  from tools/e2e (run, GREEN) and `cargo test` from app/src-tauri. The
  Rust readers of CONVENTIONS are `kit.rs` (the method-version stamp,
  untouched — the stamp stays v0.1.11) and `dispatch/brief.rs`, which
  looks up the `Fresh-clone ORDER` and `A FRESH WORKTREE HAS NOTHING
  INSTALLED` bullets by phrase (both phrases intact) and parses the
  per-package commands with the same middle-dot rule the spec uses.
  Its one command assertion is about `lib/parser`'s `npm ci`.
- `T-256-s1` is filed for the `npm install` spellings that survive
  OUTSIDE this fence, and it asks a question rather than prescribing a
  rename: `bin/app-dev.mjs` step 4 may be RIGHT as it stands, because
  CONVENTIONS' relaunch bullet says `npm ci` beside a live app deletes
  `node_modules/.vite` — the one channel that corrupts rather than
  interrupts.

## Verdicts

Absorbs: T-239-s5 (2026-09-08, triage at the wave sitting) — the borrowed-git recipe's identity gap, measured by the T-239-s4 executor at 0f6b37f; the file is removed in this commit, this line is the surviving record.
