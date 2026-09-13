---
id: T-314
title: "The push guard and landing gate run from a git pre-push hook installed by the arm in every integration checkout, in either harness, judging each proposed update by its remote old object and local new object with the evidence read from the pushed candidate — the token keyed to the pushed tree as an additional binding, the range-derived owed set and the unchanged-tree check preserved — with deliberate bypass recorded as an accepted procedural limitation"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "ADR-025 decision 3, approved by the owner on 2026-09-12 with the v1 limitation accepted the same day; card 5a of its plan"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/scripts/brief.mjs, tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

The push guard and landing gate are registered only as a Claude PreToolUse hook on the Bash tool; under Codex nothing runs, and under Claude the guard judges the command a session typed and derives its range from the checkout's upstream and HEAD: a push spelled with a leading `cd` once passed unjudged. No git-level hook exists and `core.hooksPath` is unset. A git pre-push hook receives each proposed update on standard input as local ref, local object, remote ref and remote object, and can be skipped with `--no-verify`.

## Acceptance criteria

- WHEN a push is attempted from an integration checkout THE pre-push hook SHALL read each proposed update from its standard input and judge the range from the update's remote old object to its local new object with the token, the owed set and the unchanged-tree check read from the candidate being pushed, refusing an unqualified update with the guard's own reason; bodies SHALL cover a pushed commit that differs from HEAD, a remote old object that differs from the local tracking ref, several proposed updates of which one is unqualified (the whole push refused), and an unsupported update shape refused by name.
- WHEN the guard judges a pushed commit THE token SHALL be required to match the pushed commit's tree in addition to, never instead of, the range-derived owed set and the check that the tree stayed unchanged during grading; a body SHALL show a token minted for a different tree refused, and a token minted for the pushed tree with a stale owed set refused.
- WHEN the seat takes a checkout with `--take-seat` THE arm SHALL install the hook, the file `pre-push` in the tracked hooks directory the fence names, by setting `core.hooksPath` to that directory only when it is unset or already ours, SHALL refuse by name and change nothing when a different hooks path is configured, SHALL change no configuration when the seat acquisition fails, and SHALL announce the result; the seat verbs SHALL report a checkout without the hook as unguarded.
- WHEN the Claude PreToolUse guard runs THE existing behaviour SHALL be unchanged, as a second net.
- WHEN this card lands THE conventions SHALL record, at the push bullet, that a deliberate bypass (`--no-verify`, a push from a checkout without the hook) is closed by procedure in v1 as the owner accepted on 2026-09-12, that the runner's owed set on the pushed range remains the public check, and that a protected receiving gate and credential isolation are separate proposals (T-310).

## Amendment of 2026-09-13 — the seat's pre-dispatch read (approved by the owner on 2026-09-13)

(1) The hook file is `.claude/hooks/pre-push`, committed with the executable mode (100755) by the lane at implementation, the mode recorded through git's own index operation and never assumed from a checkout. (2) Installation is a separate act: `--take-seat` verifies that the working-tree file is executable and, where it is not, establishes the permission through an authorized operation of the arm; it stages nothing and preserves any staged content it finds. (3) Before changing `core.hooksPath` the installer reads the checkout's active hooks (`$GIT_DIR/hooks`, non-sample files, which an unset `core.hooksPath` makes live) and refuses with their names when any exists, since pointing the path elsewhere would silently deactivate them; it also refuses when `.claude/hooks/` carries any other git-hook-named file, since the path makes every such name live. (4) A fixture SHALL show an ACTUAL push invoking the hook and refused when unqualified, beside the seat verbs' "unguarded" diagnostic, which is not proof on its own. Measured 2026-09-13: this harness refuses a subagent's shell `chmod`; that refusal is reported for authorization, not routed around, and the lane's inability to set a mode is a finding for the seat at the merge.

## Amendment of 2026-09-13 — hook installation scope (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — hook installation scope. The installer derives the checkout's effective hook location and configuration scope through Git, including a linked worktree's common directory and any worktree override; it does not assume that its private Git directory holds the active hooks. Installation must preserve the effective hook routing of other worktrees. A configuration that cannot be installed without an additional shared-configuration change is refused by name before that change or a new holder record is written, unless that configuration change has been explicitly authorized. A body covers a linked integration worktree with an existing enabled hook in the common hooks directory, and a successful installation with a sibling worktree's effective configuration unchanged. Hook-installation refusals leave the holder record, Git configuration and index unchanged. The existing executable-mode, competing-hooks, actual-push and procedural-bypass requirements stand.

## Implementation notes

Built by claude-opus-5@subagent, executor, 2026-09-13. Base
fea4397d9dbb1d94326c79317a385e0ee4d36603 (the dispatch stamp); the
implementation landed at 3017ff4566b62b5f9bca9243fdb0304dd3a96296 and
every figure below names the ref it was measured at.

### What was built

Three files carry the guard. `.claude/hooks/pre-push` is the file git
executes, and it is a POSIX shell wrapper for one mechanical reason: a
git hook has no extension and node decides a file's module system from
one, so an extensionless file carrying import statements is CommonJS on
one node and a module on another. The wrapper refuses with its own
sentence where node is absent, rather than leaving the shell to say
`node: not found` at a push. It runs `.claude/hooks/pre-push-hook.mjs`,
which reads the proposed updates off standard input and answers with an
exit code, and that asks `.claude/hooks/pre-push-guard.mjs`, which
decides. The split is the one `push-guard.mjs` and `push-guard-hook.mjs`
already use, for its reason: importing the decision is side-effect-free.

Each proposed update is judged on its own two objects. The range is the
remote's OLD object to the local NEW one; the verdict token is required
to match the tree of the PUSHED commit; the range-derived owed set and
the unchanged-tree checks are asked through the same exported functions
the older guard asks them through, so the strictness is additive on all
three axes rather than substituted on one. A remote object of all zeros,
an old object this checkout does not carry, and an old object that is not
an ancestor all fail CLOSED to the whole battery, which is what
`owedSetForPush` does one file over when a branch names no upstream.

The guard also asks the seat, the landing gate, the cheap checks and the
graph, in the order `decideWith` argues for them. It does NOT ask the CI
arm: that arm makes a network round trip with a fifteen-second hang
bound, a git hook runs at every push including ones no session typed, and
the guard that adds a network call to `git push` is the guard somebody
runs with the bypass. The omission is argued in the module header and
filed as T-314-s1 rather than left to be discovered.

`.claude/hooks/hook-install.mjs` is the arm's half. It derives the
checkout's effective hook location and configuration scope through git
rather than assuming either: `hooks` is not on git's per-worktree path
list, so a linked worktree's live hooks are the repository's COMMON ones,
and a reader that assumed otherwise would report a linked worktree as
hook-free and then silently deactivate a hook the whole repository
shared. It writes `core.hooksPath` at WORKTREE scope where the
per-worktree config file is already live, at LOCAL scope where the
repository has one worktree, and refuses by name otherwise.

### Every refusal leaves a checkout untouched, and that includes the seat

`hookInstallPlan` decides and writes nothing; `installHook` performs.
That split is what lets `brief.mjs --take-seat` install BEFORE it records
a holder: a refusal leaves the hooks path, the index and the holder
record exactly as they were, which is the amendment's ordering and the
difference between a checkout that is plainly unguarded and one
everything downstream believes is guarded because a seat was recorded in
it. Both seat verbs print the checkout's guard state before they act, and
report a checkout without the hook as UNGUARDED.

An ABSENT hook file is reported, never refused. Refusing there would make
the seat unobtainable in every checkout older than this card, including
the ones a seat most needs to be able to take in order to update them.

### The executable mode, and the harness refusal the amendment predicted

The hook is committed at 100755, read back with `git ls-files -s` by a
body that also proves its ten neighbours in the same directory are
100644, so the mode is a fact about this file rather than about how this
repository stores everything (measured at 3017ff45).

The lane never needed a shell `chmod` and never met the refusal the
amendment named. The mode was set by node's own file-mode call inside a
script the lane ran, which is the same mechanism the installer uses as
its authorized operation; `git update-index --chmod` was therefore not
needed either, because git records the mode it finds. The installer sets
the mode on the WORKING TREE FILE and never through the index, and a body
proves it preserves content a seat had staged.

### Figures, each at its ref

- `.claude/hooks/pre-push` 1933 bytes, `pre-push-hook.mjs` 3077,
  `pre-push-guard.mjs` 32944, `hook-install.mjs` 24751 (at 3017ff45).
- `tools/e2e/tests/push-guard.spec.ts` 102 bodies at fea4397d and 119 at
  3017ff45: seventeen added, every one of the push bodies driving a real
  `git push` through the real hook against a real bare remote inside one
  temporary directory.
- `tools/e2e/scripts/brief.mjs` 83430 bytes at fea4397d, 87593 at
  3017ff45. `.claude/hooks/gate-token.mjs` 38183 and 38956.
  `docs/CONVENTIONS.md` 160297 and 162655.
- The committed graph is CURRENT at 3017ff45 (exit 0, 203 files, 2593
  symbols, 2488 edges): the new modules are outside the graph's own
  scope. GRAPH REGEN still FIRES at the merge by its own trigger, because
  the diff carries two `.ts` files outside docs.
- The census is STALE at 3017ff45 by design and by fence: seventeen new
  test names move `docs/CAPABILITIES.md` and `docs/INDEX.md`, neither of
  which this lane's fence carries. `npm run capabilities` in the merge
  commit is what closes it, which is the standing rule for a lane that
  adds bodies.
- The docs gate answers 0 findings at 3017ff45 and warns that
  `docs/CONVENTIONS.md` is past its byte warn line. It was past it at the
  base too (160297 against a 146878-byte warn line, fail at 176253), and
  it is already filed as T-311-s3; this card adds 2358 bytes to a
  document that was already warning, and nothing here is a new instance.

### In-fence follow-through

- `judgeToken` in `.claude/hooks/gate-token.mjs` gained one optional
  argument, `treeOwner`. Three of its sentences name HEAD as the owner of
  the key, and this card's whole subject is a key that is NOT HEAD's — so
  a refusal would have told a seat its token was stale against "HEAD's
  tree" while printing a hash that is not HEAD's. The default is the
  literal the function has always printed, so every existing caller's
  refusal is byte-identical and the two bodies that pin that wording did
  not move. Nothing else about the judgement changed: the label is a noun
  in a sentence and no arm reads it.

### What was deliberately not done

- A rule for a tag push. A ref outside `refs/heads/` is refused as an
  unsupported shape, which is the card's own first criterion, and giving
  tags a rule is a different question with its own range semantics. Filed
  as T-314-s3, with the operational consequence named: the first release
  tag will meet a guard that has no rule for it.
- Uninstalling at `--release-seat`. Leaving a guard installed is the safe
  direction and the card asks for neither.

## Verdicts
