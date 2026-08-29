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
verifier:
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
