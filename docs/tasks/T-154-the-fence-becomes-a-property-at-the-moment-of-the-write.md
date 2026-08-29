---
id: T-154
title: The fence becomes a property at the moment of the write — a hook derives the card from the lane's own branch and blocks what the fence forbids
feature: F-04
milestone: 4
priority: 30
size: M
status: verifying
blocked_by: []
touches: [.claude/, tools/e2e, method/lane-protocol.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

ADR-020 decision 1. Three logged incidents would have been blocked
mechanically: `db4c903` (an architect edit inside T-138's held fence),
T-126's breach (verdict `de05430` ruled the fence should have held and
approved only by necessity), and the architect session's 2026-08-29
report ("I edited a file a live lane held"). Lane-protocol rule 5 is a
discipline today; this card makes it a property — the ADR-019
promote-if-it-slips trajectory applied one layer earlier, to the
moment of the write.

## The mechanism — expand at dispatch, read at the write

**REDESIGNED 2026-08-29 before dispatch** (pre-execution review): the
first draft expanded the fence AT HOOK TIME through `@nputer/parser`,
which has a bootstrap contradiction — a fresh lane worktree has
nothing installed and nothing built (CONVENTIONS' own bold sentence),
so a fail-closed hook needing `lib/parser/dist` blocks the executor's
first LEGAL write, and every escape hatch is worse (fail-open guts
the guard; a parser-free re-implementation is the T-057 sin). The
correct shape:

1. AT DISPATCH: the `brief.mjs --task` step the dispatcher already
   runs — which has a built parser by definition — writes the
   EXPANDED fence to `.nputer/lane-fence.json` in the worktree,
   stamped with the raw `touches:` line it expanded. One
   implementation (`fence.ts`), run once, where it can run.
2. AT THE WRITE: a PreToolUse hook on Edit/Write (repo-versioned in
   `.claude/settings.json`, inherited by every worktree) reads the
   manifest with ZERO dependencies. No manifest + no `task/T-NNN-*`
   branch = not a lane = ALLOW (integrator, architect and drill
   contexts; a positive control — refusal distinguishable from
   absence). A lane branch with no manifest = BLOCK: dispatch skipped
   its step.
3. Inside the manifest's paths, or under the unfenceable
   `docs/tasks/`: ALLOW. Outside: BLOCK, printing the fence, the
   path, and the route (file a suggestion, or the fence is wrong —
   triage's call, never the hook's).
4. STALENESS: the hook cheaply compares the card's current `touches:`
   line against the manifest's stamp; a mismatch BLOCKS with
   "re-expand", never guesses.

## Acceptance criteria

- WHEN a session in a lane worktree writes a file outside its
  manifest THE hook SHALL block the write, naming the fence, the
  path, and the route.
- WHEN the same write occurs in the main checkout or a detached
  worktree THE hook SHALL allow it, and the allow SHALL be proven by
  a positive control.
- IF a lane branch has no manifest, or the card's `touches:` no
  longer matches the manifest's stamp THEN the hook SHALL block with
  the reason, never allow silently.
- WHEN the hook lands THE lane-protocol rule-5 text SHALL say the
  property exists and name its honest limit — Bash-mediated writes
  remain protocol-covered in v1 — with that method text riding the
  shared v0.1.8 bump (`T-159`), not a bump of its own.
- The card's own CONVENTIONS documentation edit is EXPECTED to meet
  that file's warn line (280 bytes of headroom at filing); the warn
  is the tripwire working, and the executor moves content to a
  record rather than being startled.

## Org-scale note (ADR-020 decision 6)

This is the PROJECT tier of a two-tier design. The managed tier —
org-controlled, non-overridable hooks — is a named slot, not built
here; the hook's config shape should not preclude a second source.

## Loop-protection follow-ups (same layer, route if not taken here)

Block `docs/architecture/graph.json` writes outside a checkpoint
context; block test-file edits in a lane whose card is a fix task
(the playbook's protect-the-feedback-loop play; needs a card-type
marker first).

## Implementation notes
<!-- executor appends before finishing -->

### Understanding, confirmed before touching anything

I am building the two halves of the redesigned mechanism and nothing
else. At DISPATCH, a new named arm of `brief.mjs` — the step the
dispatcher already runs, in a checkout where `lib/parser/dist` exists by
definition — expands the card's `touches:` through the parser's ONE
fence implementation (`fence.ts`'s `expandFence`, with
`dispatch-order.mjs`'s `knownPathOracle` closing the bare-word gap) and
writes `.nputer/lane-fence.json` into the lane worktree, stamped with
the RAW `touches:` line it expanded. At the WRITE, a PreToolUse hook on
the file-writing tools, wired in the repo-versioned
`.claude/settings.json` and depending on nothing but node builtins,
reads that manifest and answers four ways: a checkout whose HEAD is not
on a `task/T-NNN-…` branch is NOT A LANE and is ALLOWED (the positive
control — integrator, architect and detached-drill contexts, so a
refusal is distinguishable from an absence); a lane branch with no
manifest BLOCKS, because dispatch skipped its step; a path inside the
manifest's expanded paths or under the unfenceable `docs/tasks/` is
ALLOWED; anything else BLOCKS, naming the fence, the path and the route.
A card whose current `touches:` line no longer matches the manifest's
stamp BLOCKS with "re-expand" rather than guessing which side is right.
My fence is `[.claude/, tools/e2e, method/lane-protocol.md,
docs/CONVENTIONS.md]` and the card's own criterion removes
`method/lane-protocol.md` from it in practice — the rule-5 text rides
`T-159`'s shared v0.1.8 bump, so I do not edit `method/` here and route
the sentence instead. `docs/tasks/` is writable for these notes and for
the suggestions I file. The CONVENTIONS edit is expected to meet that
file's warn line; the warn is the gate working.

### What landed

Two halves that are deliberately not the same program.

**THE DISPATCH STEP.** `tools/e2e/scripts/lane-fence.mjs` +
`brief.mjs --write-fence <worktree>` (arm five, a NAMED arm requiring
`--task`). It expands the card's `touches:` through the parser's ONE
implementation — `expandFence`, loaded the way `dispatch-order.mjs`
loads it, with `knownPathOracle` closing the bare-word gap — and writes
`.nputer/lane-fence.json` into the LANE WORKTREE, never into the
checkout it runs from, so `brief.spec.ts`'s *"THE COMMAND IS A READ"*
drives the same invocation it always did. The manifest carries the
expanded `paths`, the parser's own `UNFENCEABLE_PATHS` as
`alwaysWritable`, the card's RAW `touches:` line as the staleness stamp,
the card path, the branch and the ref. A fence with an unresolvable
token is REFUSED and nothing is written: a manifest that under-reserves
is a guard that permits, and a lane with no manifest is closed while a
lane with a short one is quietly open. Repository-shaped failures throw
`LaneFenceFinding` so the command answers 1; a missing
`lib/parser/dist` still answers 3.

**THE WRITE-TIME HALF.** `.claude/hooks/lane-fence.mjs` (`decide`,
pure) + `.claude/hooks/lane-fence-hook.mjs` (the runner), wired in
`.claude/settings.json` as a PreToolUse matcher over
`Edit|Write|NotebookEdit`. Nothing but node builtins on either side —
no `node_modules`, no `git` subprocess, no `lib/parser/dist`. It reads
HEAD off disk (`.git` is a FILE in a worktree; both shapes handled),
settles lane-ness from the BRANCH before it looks for anything, and
answers: `not-a-repository` / `not-a-lane` / `outside-the-checkout` /
`always-writable` / `inside-the-fence` allow, and `no-manifest` /
`stale-stamp` / `unreadable-request` / `outside-the-fence` block.

BLOCK is exit 2 with the reason on stderr — the mechanism that blocks
by EXIT CODE and overrides any JSON, so a harness that stops
recognising a structured verdict still refuses. ALLOW is exit 0 with
NOTHING PRINTED, and that is a decision: an explicit
`permissionDecision: "allow"` would short-circuit the harness's own
permission flow and auto-approve writes a human would otherwise be
asked about. This hook subtracts permission; it never grants it.
Measured cost, `Mac.lan` 2026-08-29: **0.04 s** per write, in a lane and
in the integration checkout alike.

`docs/CONVENTIONS.md` gains one sub-bullet under THE LANE PROTOCOL,
naming the dispatch command, pointing at `decide` as the authority
rather than restating it, and declaring the three limits.

### The suite ledger — counts AND exits, unpiped, at the tip `1fc8071`

| command | where | result |
|---|---|---|
| `npm test` | tools/e2e (NPUTER_E2E_PORT=16102) | **258 passed**, exit **0** |
| `npm run typecheck` | tools/e2e | exit **0** |
| `npm run lint:tokens` | tools/e2e | clean — TOKEN 146 files, CONTROL 850 tracked text files; exit **0** |
| `npm run lint:docs` | tools/e2e | exit **0**, with the budget WARN below |
| `npx vitest run` | lib/parser | **314 passed** of 314; exit **0** |
| `npm test` | app | **1013 passed** of 1013; exit **0** |
| `cargo test` | app/src-tauri | **518 passed / 0 failed / 4 ignored** over 18 result blocks; exit **0** |
| `index --check --root ../..` | app/src-tauri | **CURRENT**; exit **0** |

The e2e suite was 233 tests at the base and is 258 here; the new spec is
`tools/e2e/tests/lane-fence.spec.ts`, 25 bodies.

### The gates, derived from the merge's diff and not from memory

Range per the RANGE RULE's executor row —
`TREE=$(git merge-tree --write-tree <main tip> HEAD)` then
`git diff --name-only <main tip> "$TREE"`, `merge-tree` exit read
FIRST (**0**, a tree and not a conflict report). Against main
`3607a94` at the tip `1fc8071` the set is **11 paths**; it was 8 before
this card's own notes and its three routed suggestions joined it, and
the figure is stated at a ref for that reason.

- **BOOT GATE — NOT OWED.** Nothing under `app/src-tauri/**`,
  `app/src/**`, or either manifest is in the set.
- **GRAPH REGEN — FIRES**, on `tools/e2e/tests/lane-fence.spec.ts`
  (a `.ts` outside docs/). ASKED THE GATE rather than predicting:
  `index --check` is **CURRENT** at this tip, so the regen is a no-op —
  `tools/` is `.nputerignore`d and `.claude/` holds no indexed suffix
  (`.mjs` and `.json` are in neither `Lang::for_extension` nor the
  walk). The regen still belongs to the integrator at the checkpoint;
  this is the executor's derivation, not a substitute for it.
- **DOCS GATE — FIRES**, **5** paths under `docs/` are code inputs at
  the tip (`docs/CONVENTIONS.md`, this card, the three suggestions). It
  named FOUR suites and all four are in the ledger above, green — every
  one of them re-run AFTER the suggestion cards landed, because a flat
  `docs/tasks/T-*.md` is a parser input and a ledger measured before it
  existed would be a ledger about a different tree.

**THE DOCS GATE ALSO CAUGHT THIS LANE ONCE, WHICH IS WHY IT IS WORTH
SAYING.** The first commit spelled the spec's own docs read as
`laneSpellings(conventionsText(repoRoot))`, and `docs-scan.mjs`'s call
arm follows ONE hop and names `f(g(root))` in its own WHAT IT CANNOT
SEE — so this file really did read `docs/CONVENTIONS.md` while the
derivation could not link it, and the unlinkable-reader tripwire
reported it by name. Unnested at `c9ad45f`; the file is now derived as
a reader with the arm printed beside it.

### The drill ledger — one side only, mutation read back, restoration proved

Drilled in a DETACHED worktree at `/tmp/T-154-drill` (short root, stem
derived from the lane and spent on the worktree, the driver and every
results file), guarded on the exact path AND the exact commit rather
than on the shared prefix. No cargo in the drill, so no
`CARGO_TARGET_DIR` hazard; the lane's own `node_modules` and
`lib/parser/dist` were symlinked in and the environment PROVED sound by
a green **25 of 25** baseline before any mutant. Every mutant moved a
PRODUCER — the hook, the writer, the brief command, `settings.json`,
or the hook's own header — never an assertion. Every restoration was
`git checkout --` plus a sha256 match against `git show HEAD:<path>`
and an empty `git diff`.

| # | one-sided mutation | killed |
|---|---|---|
| m1 | `LANE_BRANCH_RE` matches every branch | 5 |
| m1b | a detached HEAD is reported as a lane branch | **1** |
| m2 | the outside-the-fence arm returns allow | 6 |
| m3 | a missing manifest returns allow | 2 |
| m4 | the staleness comparison never fires | **1** |
| m5 | the always-writable carve-out is skipped | **1** |
| m6 | containment loses its `/` separator | **1** |
| m7 | `touchesLineOf` is unscoped from the frontmatter | **1** |
| m8 | `ROUTE` stops citing rule 5 | **1** |
| m9 | the writer stamps raw `touches` instead of the expansion | **1** |
| m10 | the writer stamps an empty `alwaysWritable` | **1** |
| m11 | the writer stops refusing an unusable fence | **1** |
| m12 | the writer stops writing the self-ignoring `.gitignore` | **1** |
| m13 | the writer writes the manifest under another name | 10 |
| m14 | the writer defines its own copy of the reader's constants | **1** |
| m15 | the matcher drops `Edit` | **1** |
| m16b | the hook imports `lib/parser/dist` — the bootstrap contradiction | **1** |
| m17 | the runner prints an explicit allow verdict | **1** |
| m18 | the hook's branch spelling drifts from CONVENTIONS' | 15 |
| m19 | `findCheckoutRoot` invents a root | **1** |
| m20b | the path-field set shrinks to one spelling | **1** |
| m21 | the out-of-checkout limit is deleted from the header | **1** |
| m22 | `touchesLineOf` returns the value, not the raw line | 3 |
| m23 | `brief.mjs` stops refusing `--write-fence` without `--task` | **1** |
| m24 | the writer stops checking the worktree is this card's lane | **1** |

Fourteen mutants killed EXACTLY ONE body, which is the mechanical form
of the non-duplication question (poison shape SIX's remedy: a count of
one IS the non-duplication).

**ONE MUTANT WAS NOT LOADABLE AND IS RECORDED AS A WEAKER KILL.** m16
added `import { parse } from "yaml"` to the hook; the drill worktree
cannot resolve it, so the SPEC FAILED TO LOAD rather than the body
failing. That is evidence of the property and not of the assertion, so
m16b was built to replace it: importing `lib/parser/dist/index.js`,
which the drill CAN load, so the body actually ran and named the
specifier.

**THE DRILL FOUND TWO DEFECTS IN THIS CARD'S OWN WORK, AND BOTH ARE
FIXED IN THEIR OWN COMMITS.**

1. `eec55d8` — a VACUOUS CROSS-CHECK. `LANE_FENCE_CONTRACT` re-exported
   three constants the writer IMPORTS from the hook, and the spec
   compared them to themselves. No one-sided mutation could red it: one
   fact wearing a cross-check's costume. It was spotted by asking
   "which mutant kills this?" before running one. Replaced by a SOURCE
   pin (the writer defines neither constant and imports both — m14
   kills it) and a BEHAVIOURAL pin (the file the writer produced is the
   file the reader opens — m13 kills it).
2. `954087f` — POISON SHAPE FIVE, found by a surviving mutant. The
   path-spelling body looped over `WRITE_TOOL_PATH_FIELDS`, so shrinking
   that array to one member deleted the array's own check and m20 went
   GREEN at 25 of 25. T-063's rule exactly: a test parametrised by the
   constant it checks cannot pin that constant. The spellings are named
   literally now, with membership asserted per spelling; m20b kills one
   body.

**WHAT COULD NOT BE POISONED, NAMED RATHER THAN PADDED.** The
`docs/CONVENTIONS.md` edit adds prose and no assertion, so it has no
mutant of its own — its only mechanical readers are `laneSpellings`,
which still resolves all four spellings after the edit, and
`workflow-parity`, which parses a different section and is green. That
is the ordinary state of a clause in that file and is stated rather
than dressed up.

### The warn line

`docs/CONVENTIONS.md` had **280 bytes** of headroom at filing and is
now **109893 bytes against a 107967-byte warn line — 1926 over**, with
the fail line at 129560. `npm run lint:docs` prints
`docs-gate: budget WARN` on **stderr** and exits **0**: the warn does
not increment `breaches`, so it is a tripwire and not a gate, exactly
as the card said it would be.

**NOTHING WAS DELETED TO FIT AND THE WARN WAS NOT SILENCED.** The
overage is noted here, which is the disposition the card offers beside
moving content to a record — and moving content to `docs/checkpoints/`
is the integrator's act on a directory outside this fence, so an
executor taking it would have been reaching. The edit was written to
carry the mechanism, the authority pointer and the three limits and
nothing else; the guard is a new standing mechanism and a lane reading
that bullet needs it there.

### Routed, not built

- `T-154-s1` — `.nputer/` belongs in the repository's own `.gitignore`;
  the writer's self-ignoring file is the right property in the wrong
  home, and the root ignore was outside this fence.
- `T-154-s2` — the guard arms on the WRITING session's own branch, so
  two of the three incidents the card's spec cites (architect writes
  from the integration checkout, which is not a lane) are outside what
  landed. Covering them needs every live lane's manifest AND a ruling
  about which of an integration seat's ordinary writes a lane may veto.
- `T-154-s3` — `docs/CAPABILITIES.md` is stale as of this lane (25 new
  behaviours, 233 → 258) and nothing runs `capabilities:check`. The
  regeneration is the integrator's at the checkpoint —
  `npm run capabilities` from tools/e2e — and the missing gate is the
  card.
- **The `method/lane-protocol.md` rule-5 sentence is NOT in this
  diff**, per the card's own fourth criterion: that text rides `T-159`'s
  shared v0.1.8 bump. `method/` is in this card's `touches:` and was
  deliberately left untouched, which also keeps this lane clear of the
  three-file version-bump trap (CONVENTIONS' first gotcha).

### Least confident

**THE ONE THING NOT MEASURED IS THE ONE THING THAT MATTERS MOST: no
live session has been observed being blocked by this hook.** Every arm
here is driven by calling `decide` and by piping a request into the
runner — the harness contract (matcher shape, the stdin field names,
exit 2 as the blocking mechanism) is taken from documentation, not from
a session. Two specific residuals follow from that:

1. **The payload's path field.** The harness's hook examples read
   `tool_input.file_path` and its tool reference documents `path`. Both
   are read, first present wins, and a request carrying NEITHER is
   REFUSED inside a lane rather than waved through — so an unknown third
   spelling fails closed, loudly, rather than opening the fence. That is
   the design's answer to the uncertainty, and it is the reason the
   unreadable-request arm exists at all.
2. **`$CLAUDE_PROJECT_DIR` in a worktree.** The command is
   `node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"`,
   and whether that variable points at a worktree root is not
   documented. The DECISION does not depend on it — `decide` resolves
   the checkout by climbing from the request's own `cwd` — but LOCATING
   THE SCRIPT does, and if the variable is unset and the shell's cwd is
   not the repository root the command simply fails, which is a
   NON-blocking error and therefore an ALLOW. That is the one fail-open
   path in the design and it is a misconfiguration path, not a bypass
   an executor can reach; a verifier should try it in a real session
   before the mechanism is trusted.

Two smaller ones, both deliberate. `NotebookEdit` is matched though the
card names only Edit and Write: it is the third file-writing tool, and
excluding it would leave a hole for nothing. And the hook holds the
lane-branch spelling rather than parsing `docs/CONVENTIONS.md` on every
keystroke — the copy is COMPARED against `laneSpellings`' derivation by
behaviour over samples built from the document's own pattern (m18 kills
15 bodies), which is the treatment `docs/ARCHITECTURE.md` gives its own
slug block, not an exemption from the one-implementation rule.

## Verdicts

### 2026-08-29 — APPROVED (claude-opus-5@subagent)

Verified from a detached scratch worktree at `/tmp/v154`, cut with
`git worktree add --detach /tmp/v154 8ccdfc1`, plus a second detached
drill worktree `/tmp/v154d` at the same commit for the mutants. Every
figure below is stamped at the tip under review, `8ccdfc1`, unless it
names another ref. Main moved DURING this pass — `3607a94` at dispatch,
`26d912d` when the range was taken (T-158 merged) — and the RANGE RULE's
own form still yields the same eleven paths, so nothing here rests on the
older tip. The lane worktree's files were never edited except this
section. Port `1420` was read once with the permitted `lsof` and nothing
else; it is HELD (`node`, `[::1]:1420`), so nothing was run in the main
checkout. **No session of mine ever had the lane or the scratch as its
project directory**: the branch's `.claude/settings.json` stayed unarmed
and the hook was exercised the way CONVENTIONS' guard rules require — as
a child process fed crafted stdin, pointed at fixtures.

**DISCLOSURE, because it changes what this verdict is worth.** The seat's
informational blindness was lifted by the dispatching instruction, which
directed me to read the executor's Implementation notes and treat their
least-confident items as primary targets. I wrote the attack set from the
card at its base ref FIRST and then read the notes; but a shared
assumption could have reached me through that text, and this verdict
should be read as one written with the builder's reasoning in hand.

Everything the card's criteria assert survived. Two mutants of my own
that the ledger does not carry SURVIVED the suite, and one figure in the
executor's own ledger is wrong at the ref it is stated at. None is
blocking, and each is named below with its reproduction.

#### THE FENCE OF THE DIFF

`git diff 26d912d $(git merge-tree --write-tree 26d912d HEAD) --name-only`
— `merge-tree` exit read FIRST: **0**, a tree and not a conflict report —
gives **11** paths, every one under `.claude/`, `tools/e2e/`,
`docs/CONVENTIONS.md` or `docs/tasks/`. `method/` is **0 files**, which is
the card's fourth criterion honoured by omission; the rule-5 sentence has
a real home, `T-159`'s release-contents item 1, which names it and its
Bash limit in as many words. No `package.json` or lockfile is in the diff:
the zero-dependency claim is a property of the tree, not a promise.

#### ARM BY ARM, EACH WITH ITS POSITIVE CONTROL FIRST

Fixtures under the session scratchpad: a synthetic LANE (`.git` file →
gitdir with `ref: refs/heads/task/T-900-fixture`, a card, a manifest), the
same tree DETACHED, the same tree with the manifest removed, and the same
tree with the card's `touches:` moved under it. **The guard's STATE was
asserted before anything was exercised** — `findCheckoutRoot`,
`readHeadRef`, `LANE_BRANCH_RE` and `readManifest` printed for all eight
roots, including the live lane, the main checkout and `/tmp/v154` — so no
arm below is an absence wearing a refusal's clothes.

| # | payload | exit | answer |
|---|---|---|---|
| A | in-fence `tools/e2e/scripts/x.mjs`, in the LANE | **0** | silent allow — THE CONTROL |
| A2 | in-fence ABSOLUTE path, in the LANE | **0** | silent allow |
| A3 | `docs/tasks/T-900-fixture.md`, in the LANE | **0** | silent allow (unfenceable) |
| B | `app/src/main.ts`, in the LANE | **2** | blocks, naming fence, path, route |
| E | THE SAME payload as B, DETACHED checkout | **0** | silent allow |
| E2 | THE SAME payload as B, main checkout on `main` | **0** | silent allow |
| C | in-fence payload, lane branch, NO manifest | **2** | blocks, naming the dispatch command |
| D | in-fence payload, card's `touches:` moved | **2** | blocks, quoting BOTH lines, says re-expand |

B/C/D are refusals of a fixture A/A2/A3 prove would otherwise have been
accepted, and E/E2 are the same refused payload allowed one branch over —
the discriminating pair the second criterion asks for, in both directions.
Allow is exit 0 with **0 bytes on stdout and 0 on stderr**, measured; the
hook subtracts permission and never grants it, so the harness's own
permission flow is untouched.

**The payload's shape, which is the executor's own first residual.**
`file_path` (F-arms), `path` and `notebook_path` each drive the same
verdict — outside blocks, inside allows. A request with NEITHER is
**refused inside a lane (exit 2)** and **allowed outside one (exit 0)**,
and so are the four malformed variants I could think of: `tool_input`
absent, an empty string, a number, an array. That is fail-closed in the
lane and free for the integrator, exactly as claimed. First-present-wins
means a payload carrying BOTH spellings with different values judges
`file_path`; no harness sends both, and I record it only so the next
reader does not have to re-derive it.

**Hostile paths.** Traversal that lands back INSIDE the checkout is
normalised and judged (`tools/e2e/../../app/src/main.ts` → **2**;
`app/../tools/e2e/x.mjs` → **0**). Prefix confusion is not containment:
`tools/e2eXX/y.mjs`, `docs/tasksXX/y.md` and `docs/CONVENTIONS.md.bak`
all **2**. The two self-disarm routes are shut for a card whose fence
does not carry them: `.nputer/lane-fence.json` → **2**, and
`.claude/settings.json` → **2**. Traversal and absolute paths that leave
the checkout — `/etc/hosts`, a SIBLING LANE's tree — are **0**, which is
declared limit 2 behaving as declared.

#### RULING 1 — THE FAIL-OPEN PATH: ACCEPTABLE WITH DISCLOSURE

Reproduced, and it is real. The wiring is
`node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"`.

    printf '<an outside-fence lane payload>' \
      | env -u CLAUDE_PROJECT_DIR /bin/sh -c 'cd / && node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"'
    -> exit 1, "Cannot find module"        (the write that arm B refuses)

Two distinct routes, measured separately. **(a) THE SCRIPT IS NOT
LOCATED**: the variable is unset and the shell's cwd is not a checkout
carrying `.claude/hooks/`, node exits **1**, and the harness's contract
reserves **2** for blocking — any other non-zero is a non-blocking error,
so the write proceeds. **(b) NO CONTEXT AT ALL**: the script IS found but
the payload carries no `cwd` and the variable is unset, so `decide` falls
to `process.cwd()`; from outside any repository that is `allow`
(`not-a-repository`), exit **0** and silent.

**The ruling.** Route (a) is **not fixable inside this design and not
fixable inside any design of this kind**, which is why it is not
blocking: a `type: command` PreToolUse hook cannot fail closed against
its own script being unlocatable, because a process that never starts
cannot exit 2. That is a property of the harness's hook contract, not of
this implementation, and no rewrite of these two files changes it. It is
also not a bypass an executor can reach — an executor cannot unset the
harness's environment — and it is strictly weaker than the guard's own
declared limit 1, under which any `sed -i` walks through the same wall.
Route (b) is narrower still: the harness supplies `cwd` on every
PreToolUse payload, and where it does not, the runner's own
`CLAUDE_PROJECT_DIR` fallback covers it — measured, exit **2** with the
fence quoted.

Both halves of the location path were checked and both work in the
ordinary case: `CLAUDE_PROJECT_DIR` pointing at a checkout that carries
the hook → exit **2**; the variable unset with the shell's cwd at such a
checkout → exit **2**. The fail-open needs BOTH to be wrong at once.

**Two conditions on the approval, neither blocking, both routed.**
First, the executor's own sentence stands and I could not close it: **no
live session has been observed being blocked by this hook**, and I could
not observe one either without arming a session against the lane, which
the guard rules forbid a verifier from doing to the tree it is judging.
The first dispatch into a lane carrying this manifest is the real
measurement, and it should be watched. Second, **the fail-open is
disclosed on the card and NOT in `docs/CONVENTIONS.md`**, whose new
sub-bullet declares three limits where the hook's own header declares
four and the fail-open is neither. A card's Implementation notes are not
the standing page a future lane reads, and this bullet's own sentence —
that a guard believed wider than it is is worse than no guard — is the
argument for putting it there. That is one sentence against a file
already 1,926 bytes over its warn line, so it belongs with the rest of
this card's method text in `T-159`, not in a widening here.

#### RULING 2 — THE `T-154-s2` SCOPE QUESTION

**The incident framing is a defect in the CARD, not an overstatement in
the WORK, and the acceptance criteria remain fully met.** Judged, with
reasons:

1. **The criteria never claimed the second shape.** All four EARS lines
   quantify over *"a session in a lane worktree"*, *"the main checkout or
   a detached worktree"*, and *"a lane branch"*. Not one of them mentions
   a write from a seat that has no lane. The opening paragraph is
   motivation prose; the criteria are the contract, and the contract is
   met arm for arm above.
2. **The over-claim predates the work and survives the redesign.** The
   paragraph was written at filing, when the mechanism was hook-time
   expansion through `@nputer/parser` — and THAT draft also armed on the
   writing session's own branch, so the paragraph was already wider than
   its own mechanism before the 2026-08-29 pre-dispatch redesign touched
   anything. An executor cannot be rejected for a gap that arrived with
   the card.
3. **The routing is right on the merits, and I checked it rather than
   took it.** `db4c903` is an architect edit inside `T-138`'s held fence
   and the 2026-08-29 report is an architect editing a file a live lane
   held — both are the integration seat reaching IN, both allowed by
   `decide`'s first arm, correctly and on purpose. `T-126`'s breach is a
   lane reaching OUT, which arm B refuses. Two of three, exactly as
   `T-154-s2` says.
4. **The disclosure is where it has to be.** The hook's header (limit 3),
   the new CONVENTIONS sub-bullet (*"a seat in this checkout editing a
   file a live lane holds is not seen — the shape of two of the three
   incidents the card cites"*) and `T-154-s2` all say it in the standing
   documents, not only in the notes. The executor did not repeat the
   card's claim anywhere.

So: no rejection, and a **defect to correct in the card at the merge** —
the opening paragraph should say that one of the three incidents is
blocked here and two want `T-154-s2`. `T-154-s2` is also correct that the
second shape needs a RULING before it needs code, and that is triage's,
not a lane's.

#### THE MANIFEST WRITER

One expansion, and I looked for a second: `git grep expandFence` over
tracked `.ts/.tsx/.mjs/.js` outside `dist/` finds the parser's own
`fence.ts` family and exactly one caller in this diff,
`tools/e2e/scripts/lane-fence.mjs:152`. `dispatch-brief.mjs`'s
`expandFenceEntry` is a SECOND expansion in this repository, but it is
present unchanged at the base (`git show 3607a94:` finds it at the same
symbol) and is not this card's to answer.

Driven for real, not read: a scratch lane repo (`git init -b
task/T-154-scratch`) handed to
`node tools/e2e/scripts/brief.mjs --task T-154 --write-fence /tmp/v154lane`
from `/tmp/v154`. It wrote **exactly two files, both inside the lane it
was handed** — the manifest and the self-ignoring `.gitignore` — and the
checkout it ran in stayed byte-clean (`git status --porcelain` empty).
The stamp is the RAW line, character for character:
`touches: [.claude/, tools/e2e, method/lane-protocol.md, docs/CONVENTIONS.md]`,
matching `grep -m1 '^touches:'` on the card. `paths` came back
`.claude, docs/CONVENTIONS.md, method/lane-protocol.md, tools/e2e` and
`alwaysWritable` `docs/tasks`.

**It follows the FIELD, which is the claim that mattered.** With
`--task T-004` (`touches: [app-board, app-shell]`) the manifest expanded
to **61** paths. Mutating `C-09-detail-panel.md`'s
`touch_slugs: [app-board]` to `[app-nothing]` in the scratch — mutation
read back before the run — took it to **54**, and the seven that vanished
are precisely C-09's (`TaskDetailPanel.tsx`, `panel-dismissal.ts`,
`task-detail.ts` and their three tests). The slug map's own cross-check
reported the mutation by name in the same run, which is a second witness
that the mutation was real. Restored: working sha256
`985f4076…f57634` equals `git show HEAD:` sha256, `git diff` for the path
empty, whole scratch tree clean.

#### THE DRILL CLAIMS — FIVE OF TWENTY-FIVE RE-RUN, ALL EXACT

Drilled in `/tmp/v154d`, detached at `8ccdfc1`, short root, no cargo in
it. Baseline proved sound FIRST: **25 of 25 green, exit 0**. Every
mutation was read back off disk before its run and every restoration
proved by sha256 against `git show HEAD:` plus an empty `git diff`.

| mutant | ledger says | measured | bodies |
|---|---|---|---|
| m16b the hook imports `lib/parser/dist` | 1 | **1**, exit 1 | *the hook depends on NOTHING a fresh worktree lacks* |
| m2 the outside-the-fence arm returns allow | 6 | **6**, exit 1 | L209, L234, L284, L306, L323, L673 |
| m5 the always-writable carve-out is skipped | 1 | **1**, exit 1 | L323 |
| m20b the path-field set shrinks to one spelling | 1 | **1**, exit 1 | L390 |
| m18 the branch spelling drifts from CONVENTIONS' | 15 | **15**, exit 1 | L209…L705 |

Five for five, counts exact. m16b in particular reds BY NAME on the
bootstrap contradiction, which is the property the whole redesign exists
to hold, and m20b reds a single body — so the poison-shape-FIVE fix at
`954087f` really did stop the assertion moving with the constant it
checks. The tree was green again at 25 of 25 after the last restore.

**The ledger's coverage is complete and I checked the map rather than the
total.** Those five mutants alone kill **16 of the 25** bodies; the other
nine each have a named mutant in the ledger with a matching description
(L252←m19, L446←m9, L478←m24, L490←m12, L504←m23, L576←m22, L607←m7,
L614←m6, L653←m15). No body is unaccounted for.

#### WHAT DID NOT SURVIVE — THREE FINDINGS, NONE BLOCKING

**F1. Two producer branches have no discriminator (mine, not in the
ledger).** Both mutants left the suite at **25 of 25, exit 0**:

- `mV` — `readManifest`'s version check neutered (`if (obj["version"] !==
  MANIFEST_VERSION)` → `if (false)`). Nothing reds. The shape check still
  refuses a manifest missing a field, so the live effect is only that a
  future v2 manifest would be read optimistically by a v1 hook.
- `mW` — the UNREADABLE-CARD arm returns `allow` instead of `block`.
  Nothing reds. The arm is implemented correctly; it simply has no test.
  Reachability is nil today: `docs/tasks/` is unfenceable so a lane may
  write its own card, but truncating it makes `touchesLineOf` return
  `undefined` and the STALE-STAMP arm blocks (measured); deleting or
  renaming it needs Bash, which is declared limit 1 already.

Not a rejection: the POISON DRILL's obligation is over new and changed
ASSERTIONS, and these are producer branches with no assertion of their
own — the shape the notes' *"what could not be poisoned"* paragraph is
for, which named the CONVENTIONS prose and not these. Two bodies would
close both. Routed below.

**F2. A figure in the ledger is wrong at the ref it is stated at.** The
suite table says the token lint saw *"CONTROL 850 tracked text files"* at
`1fc8071`. Measured at `8ccdfc1`, whose tree differs from `1fc8071` by
one card's prose: **853**. The trees carry 871 files each
(`git ls-tree -r --name-only`), so the difference cannot be the commit —
it is the three suggestion cards, which landed IN `1fc8071` and were not
in the corpus when that number was taken. 853 − 3 = 850, exactly. This is
the verifier role's FIGURE CASE reproduced inside a ledger that was
explicitly re-stated for it (`8ccdfc1`, *"the ledger's figures re-stated
at the tip they were measured at"*), and it is the one that got away.
Correct it to **853** at the merge. Every other figure in that table I
re-measured matched: 258, 314, 1013, 518/0/4 over 18 blocks, CURRENT,
109893/107967.

**F3. A symlink or path alias is outside limit 2's wording, though inside
its spirit.** `path.resolve` does not resolve symlinks, so a path naming
the SAME checkout through a different string reads as outside it:
an alias symlink to the lane, and `/private/tmp/…` against a `/tmp/…`
root, both **exit 0** on a payload that is **exit 2** by its real name.
A symlink INSIDE the fence pointing out of it is likewise allowed. None
of this is reachable without Bash or a deliberate alias, so it changes
the guard's honest strength by nothing — declared limit 1 is a larger
door standing open beside it. But limit 2 says *"a path outside the
lane's own checkout"*, and these paths are inside the checkout and
outside the STRING, which is a sentence worth one clause when the method
text is written. It matters most where this project already sends people:
STATE tells sessions to cut scratch worktrees at short `/tmp` roots, and
on this platform `/tmp` is a symlink.

#### THE SUITES AND THE GATES, COUNTS AND EXITS, UNPIPED, AT `8ccdfc1`

Ports read at zero rows immediately before binding, every time. Lane on
**16112**, drill on **16113**; `1420` read once and never touched.

| command | where | result |
|---|---|---|
| `npm test` (`NPUTER_E2E_PORT=16112`) | tools/e2e | **258 passed**, exit **0** |
| `npm run typecheck` | tools/e2e | exit **0** |
| `npm run lint:tokens` | tools/e2e | clean — TOKEN 146 files, CONTROL **853**; exit **0** |
| `npm run lint:tokens -- --selftest` | tools/e2e | 65 TOKEN + 4 CONTROL samples, 88 walk-policy, 9 evidence-floor; exit **0** |
| `npm run lint:docs` | tools/e2e | exit **0**, budget WARN on **stderr only** (0 hits on stdout) |
| `npx vitest run` | lib/parser | **314 passed** of 314, 15 files; exit **0** |
| `npx tsc --noEmit` | lib/parser | exit **0** |
| `npm run build` | app | exit **0** (both `tsc` calls) |
| `npm test` | app | **1013 passed** of 1013, 47 files; exit **0** |
| `cargo test --no-fail-fast` | app/src-tauri | **518 passed / 0 failed / 4 ignored**, 18 result blocks; exit **0** |
| `index --check --root ../..` | app/src-tauri | **CURRENT**, 1020023 bytes, 19977 left; exit **0** |
| DOCS GATE, the one spelling | repo root | exit **1** — FIRES, 5 paths, names 4 suites |

The DOCS GATE named `cargo test` from app/src-tauri, `npm test` from app,
`npm test` from tools/e2e and `npx vitest run` from lib/parser. All four
are in the table, green, run AFTER the suggestion cards were in the tree.
The budget warn is the tripwire working: **109893 against a 107967 warn
line, 1926 over**, fail at 129560, printed on stderr with exit 0 — the
card's figures reproduce exactly and the disposition it offers (note the
overage, delete nothing, silence nothing) is the one taken.

**A HAZARD I CREATED AND ANYONE REPEATING THIS PASS WILL CREATE.**
`index --check` first came back **STALE, exit 1** — a FALSE red, and not
the `--root` one CONVENTIONS legends. I had followed the POISON DRILL's
*"its own CARGO_TARGET_DIR inside itself"* and put it at
`/tmp/v154/.cargotarget`, INSIDE the indexed tree; `.nputerignore`
excludes `docs/`, `tools/` and the fixture tree and nothing else, so the
indexer walked twelve cargo build artifacts into the fresh graph and
reported them as `+` files. Moving the target dir outside the worktree
gave **CURRENT, exit 0** with no rebuild of anything that mattered. Two
written rules collide here and neither names the other; routed.

#### SECURITY SWEEP

New input path: the hook's stdin. There is no `child_process`, no
`spawn`, no network, no `eval`, and no write of any kind in either hook
file — the only `exec` hits are `RegExp.prototype.exec`. `process` is
touched four times: `cwd()`, one `env` read, `stderr.write`, `exit`. No
dependency is added anywhere in the diff and no lockfile is touched, so
the zero-dependency claim is checkable rather than promised. No secret,
key or token shape in the diff. One authz-shaped observation, recorded
and not blocking: `readFileSync(path.join(root, manifest.card))` will
follow a traversal in the manifest's `card` field, and the block message
echoes the matched line — so a crafted manifest could surface one
`touches:`-prefixed line of an arbitrary readable file on stderr. It
requires an actor who can already write the manifest, which a lane
provably cannot (that write is exit 2, measured), so the precondition is
disk access the guard never claimed to cover.

#### ARCHITECTURE AND ADJACENT FEATURES

Nothing crosses an ARCHITECTURE interface: `.claude/` and `tools/e2e/`
are outside every component's territory, and the map agrees — `.mjs` and
`.json` are in neither the indexer's language table nor the walk, which
is why `index --check` is CURRENT with a `.ts` file added under
`tools/`. `brief.mjs` keeps its read arms as reads: arm five is a NAMED
arm that requires `--task` (**exit 2** without it, measured), it writes
only into the worktree it is handed, and `brief.spec.ts`'s *"THE COMMAND
IS A READ"* drives the same invocation. The manifest's home, `.nputer/`,
is the directory ADR-017 already confines runtime writes to. The
`--write-fence` run exiting **1** on my scratch was pre-existing board
findings (three live lanes' fences, the slug map's two copies), not the
fence write — read the message, which names them.

#### ROUTED, NOT BLOCKING — for triage; a verifier's writes are this card only

1. **Two bodies for the two surviving mutants** (F1): a manifest with an
   unknown `version` blocks, and a manifest whose `card` cannot be read
   blocks. Both arms exist and are correct; both are undiscriminated.
2. **`docs/CONVENTIONS.md` declares three limits where the hook declares
   four, and the fail-open is in neither** (Ruling 1). One sentence, and
   it belongs in `T-159` with the rest of this card's method text rather
   than in a file 1,926 bytes over its warn line.
3. **The card's opening paragraph** should say one of three, not three
   (Ruling 2) — a correction at the merge, `T-154-s2` already holds the
   rest.
4. **`CONTROL 850` in the ledger is `853`** (F2) — a one-figure fix at
   the merge.
5. **The POISON DRILL's `CARGO_TARGET_DIR` advice and the graph-currency
   gate collide**: a target directory inside the scratch root makes
   `index --check` report a false STALE naming build artifacts. Either
   `.nputerignore` gains the drill's directory name or the drill bullet
   says "outside the tree". Not this card's, and it cost me a run.
6. **The first real dispatch into a manifest-carrying lane should be
   watched**, because that is the one measurement neither seat could
   take: no live session has yet been blocked by this hook.

**APPROVED.** The mechanism does what its criteria say, its refusals are
distinguishable from its absences in both directions, its expansion has
one implementation and follows the field, its own drill is honest and its
counts reproduce, and the hole it admits is a property of the harness's
hook contract rather than a choice this diff made — declared in the code,
on the card, and now in this verdict.

#### THE GATES RE-RUN AT MY OWN TIP — a verdict is a write

The table above is stamped at `8ccdfc1`, the commit I was sent. The
verdict commit `f554cbd` created a tip nobody had tested, and prose is a
code input here, so the DOCS GATE was taken again over the range at that
tip. Main had moved a second time during the pass (`26d912d` →
`e9c2bf2`); `merge-tree` exit **0**, the path list is still the same
**11**, and the gate FIRES on the same 5 docs paths and names the same
4 suites. All figures below are measured at **`f554cbd`**.

| command | where | result at `f554cbd` |
|---|---|---|
| `npm test` (`NPUTER_E2E_PORT=16112`) | tools/e2e | **258 passed**, exit **0** |
| `npm test` | app | **1013 passed** of 1013, 47 files; exit **0** |
| `npx vitest run` | lib/parser | **314 passed** of 314, 15 files; exit **0** |
| `cargo test --no-fail-fast` | app/src-tauri | **518 passed / 0 failed / 4 ignored**, 18 blocks; exit **0** |
| `npm run typecheck` | tools/e2e | exit **0** |
| `npm run lint:tokens` | tools/e2e | clean — TOKEN 146, CONTROL 853; exit **0** |
| `npm run lint:docs` | tools/e2e | exit **0**, the same budget WARN on stderr |
| `index --check --root ../..` | app/src-tauri | **CURRENT**, 19977 bytes left; exit **0** |

`docs-gate` also reports *"every live task card's frontmatter parses,
with a legal status"* at this tip, which is the specific gate a verdict's
own prose can break.

**ONE MORE HAZARD MEASURED, AND IT IS THE POISON DRILL'S OWN CLASS IN A
NEW SHAPE.** Between the two cargo runs I MOVED the scratch's
`CARGO_TARGET_DIR` (out of the tree, to fix the false STALE recorded
above). The next `cargo test` went **498 passed / 20 failed, exit 101**,
every failure a `spawn binary: Os { code: 2, kind: NotFound }` from
`crates/nputer-index/tests/cli.rs` — the binary path is baked into the
test at COMPILE time and cargo does not fingerprint it, so the tests were
still spawning the directory's old name. `cargo clean -p nputer-index`
(2736 files, 579.7 MiB) and a rebuild was the whole fix: **518 / 0 / 4,
exit 0**. Nothing about the diff, and the main checkout's own `target/`
was never involved — but a MOVED target directory reds the same way a
SHARED one does, and CONVENTIONS' bullet names only the shared case.
Folded into routed item 5.
