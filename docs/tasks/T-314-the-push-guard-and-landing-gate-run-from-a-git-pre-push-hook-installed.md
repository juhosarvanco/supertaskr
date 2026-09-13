---
id: T-314
title: "The push guard and landing gate run from a git pre-push hook installed by the arm in every integration checkout, in either harness, judging each proposed update by its remote old object and local new object with the evidence read from the pushed candidate — the token keyed to the pushed tree as an additional binding, the range-derived owed set and the unchanged-tree check preserved — with deliberate bypass recorded as an accepted procedural limitation"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: verifying
suggested_by: "ADR-025 decision 3, approved by the owner on 2026-09-12 with the v1 limitation accepted the same day; card 5a of its plan"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/scripts/brief.mjs, tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
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

### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Verifier, GUARDED tier, two-spawn bench. Phase 1 wrote the attack set with
no tool call of any kind, from the card at the base and `roles/verifier.md`
at the same ref; this is the phase-2 spawn, which held tools, read the
diff, and read the executor's report LAST — after the diff, the specs, the
conventions bullet and the card's own notes.

Bench `supertaskr-V-T-314`, a linked worktree detached at the lane tip
`6eef8786067812b3e448ea8e25be862de722003e`; base
`fea4397d9dbb1d94326c79317a385e0ee4d36603`.

The sealed inputs, verified before they were read: the attack set at
`sha256:ad522f515920e22b27d8fea695b7273cff925c00f654cc3968cccfdd501216f2`,
the ground (with the seat's addendum, M1 to M23) at
`sha256:0563f26e9f231caa6f85b2ea3962e65797c35dc9dab119130e89fcd3e216b090`,
and the card at the base at
`sha256:d955fba6dc7d790e0a0e02838ed0ce3a10fc52fc992f6d0a7c54740f8f7f910e`.
All three matched; the card's digest was re-derived from `git show` at the
base rather than trusted from the copy pasted into the brief.

#### The criteria, one row each

| # | criterion | verdict | the evidence that decided it |
|---|---|---|---|
| AC1 | each proposed update read from stdin and judged on its own remote-old-to-local-new range | **MET**, one residual → C2 | `updateRange` builds `${remoteOid}..${localOid}` out of the update's own two fields, and `judgeUpdate` orders shape → candidate tree → range → owed set → token with every step handed evidence off the update. All four named shapes are bodied through REAL `git push` against a real bare remote: a pushed commit that is not HEAD (`HEAD~1:refs/heads/side` refused `token-stale` naming HEAD~1's own tree, HEAD's own push green in the same fixture); a remote old object diverged from the tracking ref by a hand `update-ref`, where the body asserts the refusal CONTAINS the remote-derived range and does NOT contain the tracking ref's empty one — an assertion on a range inside one derivation and outside the other, which is what phase 1 demanded; several updates with one unqualified, where the QUALIFIED update is named and neither remote ref moved; and unsupported shapes refused by name, a real `--delete` and a real tag push, each with the remote ref asserted unmoved. Drills D5 and D6 killed the range-source and single-read mutants, one body apiece. |
| AC2 | the token keyed to the pushed tree **in addition to**, never instead of, the owed set and the unchanged-tree check | **MET** | Phase 1 pre-committed to this as the criterion most likely to be satisfied in letter and failed in purpose. It is not. The whole of `.claude/hooks/gate-token.mjs`'s diff is a NOUN — `treeOwner`, defaulting to the literal the function has always printed — so `judgeToken`'s six states, their order and their conditions are unchanged: `token-partial` still derives from the RANGE's owed set, `token-stale` from the tree, `token-unkeyed` from `dirty` and `treeAtWrite`. The hook adds a third key and relaxes neither of the first two. One body walks all four legs in one fixture and the drills prove the legs are independently killable: D3 (never pass the range-derived owed set) fails at leg (b) on `token-partial`, D4 (drop the tree-moved-during-grading branch) fails at leg (c) on `token-unkeyed` with legs (a) and (b) passing first. |
| AC3 | `--take-seat` installs, refuses by name and changes nothing, announces; the seat verbs report unguarded | **MET**, one gap → C3 | `hook-install.mjs` asks git for everything — `rev-parse --git-path hooks` for the location, `config --show-scope --get` for the value AND its scope, `worktree list --porcelain` for the count. `hookInstallPlan` decides and writes nothing while `installHook` performs, which makes "a refusal changes nothing" structural rather than asserted. `brief.mjs` installs BEFORE `writeHolder`, so a refusal leaves no holder record — bodied, with the staged-file and hooks-path snapshots and a positive control that takes the seat once the foreign path is unset. Both verbs print the guard line before they act, and an ABSENT hook file is reported rather than refused, which keeps the seat obtainable in every checkout older than this card. The gap is C3: the third condition — file present, `core.hooksPath` pointed at it, but NOT EXECUTABLE — is pinned by no body, and the ground's M2 makes that the state git answers by SKIPPING the hook while the push SUCCEEDS. Drill D1 removed that branch entirely and all 119 bodies stayed green. |
| AC4 | the PreToolUse guard unchanged, as a second net | **MET** | Graded on phase 1's pre-committed question and nothing else: does the older guard still refuse ON ITS OWN with the pre-push hook absent? The new body runs the WIRED command in a fixture where `core.hooksPath` is never set and gets that guard's own `index --check` refusal at exit 2. It also pins that the two nets are registered by different mechanisms and that the hook's file name appears nowhere in `.claude/settings.json`, so neither net can be retired by whatever retires the other. I measured the bypass separately: `isPush` and `pushTargetBranch` both still read `git push --no-verify origin HEAD:refs/heads/main` as a push on `main`, so `--no-verify` defeats git's hook and NOT the second net. |
| AC5 | the conventions record the accepted limitation at the push bullet | **MET in prose, unpinned → C1** | The new bullet sits immediately after the T-280 push bullet the ground's M15 names, in the same list, and the diff to `docs/CONVENTIONS.md` is 34 insertions with ZERO deletions — so phase 1's reword-regression attack has no surface at all. All three clauses are the card's own: the v1 procedural closure with the owner's 2026-09-12 acceptance and both spellings of the bypass; "THE RUNNER'S OWED SET ON THE PUSHED RANGE REMAINS THE PUBLIC CHECK"; and the protected receiving gate plus credential isolation as T-310. The ground's M22 confirms the middle clause is TRUE of the runner today — `ci-owed.mjs` spawns `gate-run.mjs --owed-set --range <base>..<tip>` — so the document is not asserting something false. But nothing reads any of it: three other CONVENTIONS bullets are pinned in this very spec file and this one is not. Drill D2 deleted a whole clause and all 119 bodies stayed green. |
| A1 | amendment of 2026-09-13 — the mode, installation as a separate act, competing hooks, an actual push | **MET** | `git ls-files -s` reports `100755` for `.claude/hooks/pre-push` and the body reads the INDEX rather than the filesystem, with its ten 100644 neighbours as the control that the mode is this file's property and not the directory's. The arm sets a lost mode on the WORKING TREE FILE through its own process, never through `git update-index --chmod`, and a body proves a seat's staged content survives. Competing hooks and foreign hook names are both refused by name and both bodied. The actual-push requirement is met four times over. The harness `chmod` refusal the amendment predicted never arrived: the lane used node's own file-mode call, the same mechanism the installer uses, so there was nothing to route around and nothing to report. |
| A2 | amendment of 2026-09-13 — hook-installation scope | **MET** | The premise is measured rather than assumed: `--git-path hooks` in a LINKED worktree resolves to the COMMON hooks directory, which is the ground's M7 and which I re-confirmed at the tip from this bench. Body (a) plants a live `pre-commit` in the common directory and drives the installer FROM the linked worktree, getting `active-hooks-present` naming the file, with removal as the positive control. Body (b) is a SUCCESSFUL installation in a real two-worktree repository at WORKTREE scope, with the sibling's own `config --show-scope --get` unchanged AND the sibling's guard state still false — an effective reading asked of git from the sibling, not a file compared. The shared-config refusal names `extensions.worktreeConfig`, asserts it was not turned on behind the caller's back, and has `--allow-shared-git-config` as its positive control. There is no silent `--worktree`-to-`--local` fallback anywhere: a failed write returns `hooks-path-unwritable` and stops. |

**APPROVED WITH ASSIGNED CORRECTIONS.** Every acceptance criterion and
both amendments are met. The three corrections below are bodies this diff
owes and does not carry, not criteria it failed.

#### The drills

Six mutants, each planted by an anchored replace, run against
`tools/e2e/tests/push-guard.spec.ts` on this bench at port 15314, then
restored with the restore proved by re-reading the file's sha256. The
baseline at the tip is **119 passed (1.7m)**.

| # | mutant | site | outcome |
|---|---|---|---|
| D1 | drop `hookStatus`'s not-executable branch | `.claude/hooks/hook-install.mjs` | **SURVIVED** — 119 passed. The gap C3 closes. |
| D2 | delete the whole "THE RUNNER'S OWED SET…" clause (a DATA mutant, because the property lives in prose) | `docs/CONVENTIONS.md` | **SURVIVED** — 119 passed. The gap C1 closes. |
| D3 | never pass the range-derived owed set to `judgeToken` | `.claude/hooks/pre-push-guard.mjs` | KILLED — the AC2 body, at leg (b), `Expected substring: "token-partial"`. |
| D4 | drop the `atWrite !== entry.tree` branch | `.claude/hooks/gate-token.mjs` | KILLED — the AC2 body, at leg (c) on `token-unkeyed`, legs (a) and (b) having passed first. |
| D5 | derive the old side of the range from `refs/remotes/origin/<branch>` instead of the update's own remote object | `.claude/hooks/pre-push-guard.mjs` | KILLED — the remote-OLD-OBJECT body ONLY; the not-HEAD body survived. |
| D6 | judge only the first proposed update | `.claude/hooks/pre-push-guard.mjs` | KILLED — the several-updates body ONLY. |

**Two containment questions phase 1 raised, both answered NO.** D5 killed
the remote-old-object body while the not-HEAD body survived it, so those
two are not restatements of one another — each dies to a mutant the other
lives through. And D3 and D4 land on different legs of the AC2 body with
the earlier legs passing, so the owed set and the unchanged-tree check are
each load-bearing on their own rather than one standing in for the other.
The honest caveat: those three legs share ONE `test(...)`, so at body
granularity their kill sets are identical by construction, and the
independence above is a reading of WHERE each run failed rather than of
which body names went red.

**One thing D4 incidentally established.** The `treeAtWrite` branch it
removed is pinned at this tip by the new T-314 body and by nothing else —
the pre-existing token bodies exercise `dirty`, not a tree that moved and
moved back. The diff strengthened a check that was carrying no body.

#### The security sweep (step 3)

- **The tracked hooks directory is now an execution surface for git, not
  for one harness.** `core.hooksPath` pointed at a VERSION-CONTROLLED
  directory means a pull changes what runs at push time, and the path makes
  every git-hook NAME in that directory live at once rather than the one
  file this card wrote. That is the price of the property the card exists
  for, and the design pays it knowingly: installation refuses when the
  directory already carries a foreign hook name. It asks once. Nothing
  asks again — filed as T-314-s4.
- **No injection surface through the update fields.** Every git call is
  `spawnSync("git", [...argv])` with no shell anywhere; `localOid` is
  validated against `OID_RE` in `updateShape` before `candidateTree` uses
  it, and `remoteOid` in `updateRange` before `cat-file` does. Ref names
  reach message strings only. Git's own refname rules ban control
  characters, so the terminal-escape channel is closed upstream of this
  file rather than by it.
- **The token binding is a plain record and nothing here pretends
  otherwise.** Ground M18: `.supertaskr/gate-verdict.json`, mode 0644, no
  HMAC — the tree key is forgeable by the very agent it constrains. That is
  coherent for a PROCEDURAL guard, and the new bullet says the load-bearing
  thing out loud: the runner's owed set on the pushed range remains the
  public check, on a machine that is not yours. No sentence in the diff
  upgrades the binding to an authentication.
- **The hook's environment fails closed.** `set -eu`, the directory
  resolved with `CDPATH= cd -- "$(dirname -- "$0")" && pwd`, and a named
  refusal at exit 1 when `node` is absent instead of the shell's
  `node: not found`. Every git call carries `-C root`, so an inherited
  `GIT_DIR` cannot re-point the decision. The no-node branch is unbodied —
  a residual, not a correction: it fails closed by construction.
- **No dependency was added.** Every import is a node builtin, a hook in
  the same directory, or `checkout-currency.mjs`, which imports builtins
  only.
- **The fail-open audit, path by path, found exactly one — C2.**
  Interpreter missing → exit 1. `candidateTree` unable to name the pushed
  object → refuse. Owed set underivable → the WHOLE battery, never a
  narrowing. Token unreadable → `judgeToken`'s problem branch refuses.
  Unknown ref shape → refused by name. `probe()` treats every stat error
  but ENOENT and ENOTDIR as PRESENT, so `not-this-repository` cannot be
  reached by an inability. `decidePrePush` is wholly synchronous and
  `process.exit(1)` is explicit on the block branch, so the classic
  node-hook fail-open — an async rejection letting the event loop drain at
  exit 0 — has no surface here. The one that remains is the standard input
  a read FAILED on.

#### The corrections

Three, each a body I wrote and ran both ways on this bench, committed here
after this verdict so its figures still name the tip they were measured at.

**C1 — the fifth criterion's three clauses are pinned by nothing.** The
criterion's whole property lives in PROSE, and D2 deleted an entire clause
over a green suite. This spec file already pins three other CONVENTIONS
bullets for exactly that reason. The body reads the bullet through
`conventionsBullet` and asserts each clause separately, so a data mutant
against any one of them lands on its own assertion.
READINGS: **RED** against the tree with the clause deleted (the D2 mutant)
— one body failed, 121 passed — and **GREEN** against the tree as it
stands, 122 passed.

```mutant
correction: C1 — the conventions clauses the fifth criterion asks for are pinned by a body
file: docs/CONVENTIONS.md
spec: tools/e2e/tests/push-guard.spec.ts
body: docs/CONVENTIONS.md records the accepted bypass, the public check and T-310 — the fifth criterion, pinned
message: the runner's owed set is not recorded as the public check
--- old
  the hook as UNGUARDED. **THE RUNNER'S OWED SET ON THE PUSHED RANGE
  REMAINS THE PUBLIC CHECK**, on a machine that is not yours: the local
  hook narrows the window in which an ungraded tree can reach the
  remote, and replaces nothing about what the runner then measures.
--- new
  the hook as UNGUARDED.
```

**C2 — a standard input that could not be READ was allowed, in the one
file whose header says it is refused.** `pre-push-hook.mjs` catches a
failed `readFileSync(0)` and hands the decision the EMPTY STRING, which is
exactly what git writes when every ref is already up to date — and that is
an ALLOW. I measured it at the tip:
`decidePrePush({ cwd, stdin: "" })` answers `allow / no-updates-proposed`,
while the module's own header says an unreadable input "is refused there by
name rather than allowed here in silence". One string carried two opposite
meanings and the allow won both. The correction carries the failure over as
a flag, refuses it by name as `update-input-unread`, leaves the empty READ
an allow, and makes the header's sentence true.
READINGS: **RED** against the tree with the refusal removed — one body
failed, 121 passed — and **GREEN** against the corrected tree, 122 passed.

```mutant
correction: C2 — an unreadable standard input is refused by name, not read as git's empty input
file: .claude/hooks/pre-push-guard.mjs
spec: tools/e2e/tests/push-guard.spec.ts
body: standard input this hook could not READ is refused by name, and is NOT git's own empty input
message: a push whose contents this guard never learned is not an allow
--- old
  if (request.stdinReadable === false) {
    return block(
      "update-input-unread",
      "PUSH REFUSED — NOTHING ABOUT THIS PUSH COULD BE JUDGED: this hook could not READ the " +
        "standard input git hands it, so the list of objects about to leave this machine is not " +
        "known to it at all.\n" +
        "  An EMPTY input is git saying every ref is already up to date, and that is allowed. An " +
        "input that could not be read says nothing, and a guard that cannot tell the two apart " +
        "allows the second every time it meets it.",
    );
  }

  const parsed = parseUpdates(request.stdin ?? "");
--- new
  const parsed = parseUpdates(request.stdin ?? "");
```

**C3 — the one unguarded state that looks guarded is pinned by nothing.**
`hookStatus` answers three conditions and the third — the file present,
`core.hooksPath` pointed straight at it, and the file NOT EXECUTABLE — is
asserted by no body. D1 removed the branch and all 119 stayed green. The
ground's M2 is why it matters: git IGNORES a non-executable hook under
`core.hooksPath`, prints a hint, and lets the push through, so this is the
only unguarded state that cannot be told from a guarded one by reading the
configuration. The existing assertion that names this property sits in a
fixture whose hooks path is UNSET, where the unset path is what answers;
its message is corrected here too, and the new body differs from its own
control in exactly one respect — the mode, set and unset again.
READINGS: **RED** against the tree with the branch swapped for a second
presence check — one body failed, 121 passed — and **GREEN** against the
tree as it stands, 122 passed.

```mutant
correction: C3 — a hook git cannot execute is reported UNGUARDED, and a body says so
file: .claude/hooks/hook-install.mjs
spec: tools/e2e/tests/push-guard.spec.ts
body: a hook git cannot EXECUTE is UNGUARDED with the path pointed straight at it — the state git answers by SKIPPING
message: a hook git cannot execute guards nothing
--- old
  if (!executable(site.hookFile)) {
    return {
      guarded: false,
--- new
  if (!present(site.hookFile)) {
    return {
      guarded: false,
```

Three corrections, three blocks.

#### Findings that are not corrections

- **The foreign-hook-name question is asked once and never again.**
  `hookInstallPlan` answers `pathIsOurs` FIRST and returns before
  `foreignHookNames` is consulted — deliberately, and argued at the site —
  so a git-hook-named file landing in the tracked hooks directory AFTER
  installation becomes live in every seat that installed, with no line
  anywhere. `hookStatus` does not ask it either. Filed as **T-314-s4**.
- **One refusal path can leave a shared configuration change standing.**
  With `--allow-shared-git-config`, `installHook` turns
  `extensions.worktreeConfig` on at LOCAL scope and then writes
  `core.hooksPath`; if that second write fails it returns `refused` and the
  shared change is not rolled back, against the amendment's "refusals leave
  Git configuration unchanged". Reachable only after the caller authorized
  exactly that change, and no seat is recorded. Named, not assigned.
- **The token binds the TIP's tree only.** A push of `A..C` where `C` is
  clean satisfies the binding whatever `B` carried; the range-derived owed
  set is what covers the intermediate paths. That is the card's own wording
  — "the pushed commit's tree" — and the residual is stated nowhere.
- **Nothing makes a token single-use or range-bound.** A token minted for
  tree `T` can qualify any later push whose tip carries `T`. No criterion
  asks for more; recorded so no later reader infers it.
- **`--no-verify` defeats git's hook and NOT the second net**, measured
  above. The bullet's "skips every client-side hook" is conservative rather
  than wrong — it understates what still catches.
- **`pre-push-guard.mjs`'s import header is inaccurate about its own
  imports.** It says every import is "a builtin or a hook in this
  directory" and describes the `checkout-currency.mjs` exception as riding
  along "transitively" through `push-guard.mjs`. That file is imported
  DIRECTLY, on its own import line. The property the sentence exists to
  protect still holds — that module imports builtins only, so the guard
  still loads in a lane worktree with no `node_modules` — but the sentence
  describes a different import graph from the one below it.
- **One line of the new conventions bullet does not wrap**, running to
  roughly twice the width its neighbours keep. `lint:docs` answers 0
  findings, so nothing enforces it; a legibility nit in a document this
  project reads by eye.
- **The `In-fence follow-through` entry is inside its three limits.**
  `judgeToken`'s `treeOwner` is under `.claude/hooks/`, which the fence
  carries; it adds no criterion; it is one optional argument whose default
  is the literal the function already printed, so every existing caller's
  refusal is byte-identical. Declared, and checked rather than waved
  through for being declared.
- **The three cards the executor filed are sound**, and none of them covers
  what C1 to C3 cover.

#### What phase 1 pre-committed to, and how it came out

Recorded because a pre-commitment nobody scores is a pre-commitment nobody
made.

1. **"AC2 is the criterion most likely to be satisfied in letter and failed
   in purpose"**, predicting the third and fourth legs would be ABSENT.
   **Wrong, and I am glad to say so.** Both are present, in one fixture,
   with the positive control last, and `gate-token.mjs`'s diff is a noun,
   so nothing was relaxed to make room for the new key.
2. **"AC4 is most likely to be degenerate"**, to be graded on whether the
   PreToolUse guard still refuses with the pre-push hook ABSENT.
   **Answered in the diff's favour** — the new body does exactly that.
3. **"A2a.2 (worktree config scope) is where I predict the real bug is."**
   **Wrong.** The installer reads the scope with the value, writes
   `--worktree` only where the per-worktree file is already live, and
   refuses by name rather than falling back. I read that branch first, as
   pre-committed.
4. **"The `--take-seat` refusal paths are where I predict 'change nothing'
   is over-claimed."** **Wrong for the holder record**, the clause the
   amendment names: the install runs BEFORE `writeHolder` and a body proves
   no record is written. **Right one path over** — the authorized
   shared-config change is not rolled back (finding above).
5. **"A missing 'the remote ref did not move' assertion is a finding."**
   **Not triggered.** Every actual-push body asserts it.
6. **"If the D3 control fails, the refusal side of this card's evidence is
   degenerate."** **The control is in the suite itself**: "WITHOUT the hook
   an ungraded push reaches the remote; WITH it the same push never does"
   unsets `core.hooksPath`, pushes, and asserts exit 0 with the remote
   MOVED before re-installing and refusing the same tree. It is the single
   check phase 1 most wanted run, and the diff runs it.

#### The battery, at the lane tip `6eef8786`

`node tools/e2e/scripts/gate-run.mjs parser app rust e2e`, the whole
battery the guarded tier keeps, at `SUPERTASKR_E2E_PORT=15314`:

- parser **GREEN 413 bodies**, exit 0
- app **GREEN 1171 bodies**, exit 0
- rust **GREEN 655 bodies over 18 targets**, exit 0
- e2e **RED 1074 bodies** — `1 failed / 1073 passed (15.9m)`, exit 1

**The one red is base-inherited and is not this diff's.** It is
`tests/cli.spec.ts:2346`, "the listing goes to the PROJECT'S OWN tree for
its readings", failing at its arrangement assertion because every record in
`meters.jsonl` predates the newest `Checkpoint:` commit — T-300-s7's class,
named in my own brief as the known red at this base and reported by the
executor at the same body from the same cause. The diff touches nothing
under `docs/checkpoints/` and nothing under `tools/e2e/tests/cli.spec.ts`.
