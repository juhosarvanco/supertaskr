---
id: T-203
title: A GREEN-TOKEN PRE-PUSH GATE — commits stay fast and pushes become unlyable, because three commits landed tonight after a gate that had already failed
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); the instances are this seat's own, measured the same night"
builder:
review: independent
---

**THE RULE EXISTS AND `docs/CONVENTIONS.md` NEVER RECEIVED IT**: *"an
edit script's success is a GATE, not a step — never chain a commit after
one."* **This seat broke that three times in one night**, twice with `&&`
and once in a guarded chain, each time reading the exit **after** the
commit had already run.

> **CORRECTED AT VERIFICATION (2026-09-01), and the correction makes this
> card's case stronger rather than weaker.** This paragraph opened *"`docs/
> CONVENTIONS.md` ALREADY SAYS IT"*. It does not, and never did: **zero
> occurrences** of that sentence in `docs/CONVENTIONS.md` at this lane's
> base `9d56b47` and at its tip — re-derived here rather than taken on
> report. The rule is real and traceable: it was written at `18d8166` and
> is recorded in
> `docs/checkpoints/2026-08-30-the-rulings-sitting-2-eight-answers.md`,
> which cites *"the rule from `18d8166` working as designed one day after
> it was written"*. But it lives ONLY in append-only records. **A rule
> recorded in a checkpoint and absent from the governing document is a
> rule no seat reads before it acts** — which is why it could be broken
> three times by a seat able to quote it. The executor inherited the
> misattribution from the filer without checking it; a verifier measured
> it. **The `Read beside` line below points at the same non-existent
> bullet and is left standing as the other half of the same finding.**
> Both are the routed CONVENTIONS item seen from the far end: that bullet
> does not need updating, it needs WRITING.

## What it cost, and none of it was theoretical

- A commit landed on a **`census exit=1`** — STATE stale against a newer
  record, twice.
- A commit landed on a **parser red** — a card stamped out of `suggested`
  without its four required fields.
- **`blocked_by: [T-190]` naming a card that did not exist reached CI and
  redded it**, because the gate that would have named the failing body
  was never asked.

`T-167-s8` established the shape that works: **a guard that refuses a
PUSH**, keyed on a command's own exit, with no escape hatch — and its
blind verifier then proved the guard fires against a real bare remote.
This card extends that shape from one gate to all of them.

## What to build

**`T-202`'s runner writes a VERDICT TOKEN**: the tree hash it ran
against, plus a per-suite exit code and body count.

**Pre-push refuses when the token is MISSING, STALE (its tree hash is not
HEAD's) or RED.** And it **unconditionally runs the cheap checks** that
cost seconds and caught real defects tonight:

- the **parser parse-check on changed cards** — this is the exact check
  that would have refused `blocked_by: [T-190]` and the missing-fields
  stamp, both of which reached a push;
- **record-newer-than-STATE** — `docs-protocol.md` rule 4, which fired
  twice tonight *after* the commit.

**Commits stay fast; pushes become unlyable.** That division is the
design: the cost of a full battery is paid once per push rather than once
per commit, and the token is what makes "I ran the gates" a fact rather
than a claim.

**A SECOND ARM RIDES THIS HOOK AND IS NOT THIS CARD: the LANDING GATE**
(`T-212`) — at a LANE push, the merge-base-to-tip diff intersected with
the card's expanded fence, refusing any out-of-fence path. Split to its
own card so this one stays dispatch-ready: that gate needs `T-209`'s
intersection and this card does not. One hook, two arms, two cards —
`T-207`'s own precedent, one artifact per meaning.

## What a fix decides

1. **Where the token lives.** It must not be committable — a token in the
   tree can be stale-but-matching after an amend. A runtime path like
   `.nputer/` (already gitignored by a file the tool writes) is the
   obvious candidate; argue it.
2. **What "stale" means against an amend or a rebase.** The tree hash is
   the honest key; say what happens when a commit is amended after a
   green run.
3. **Whether the cheap checks can ever be skipped.** `T-167-s8` shipped
   its guard with **no escape hatch** and argued why. Follow that unless
   there is a measured reason not to.

## Acceptance criteria

- A push SHALL be REFUSED when the verdict token is missing, when its
  tree hash does not match `HEAD`, or when any suite it records is red.
- THE cheap checks SHALL run on every push regardless of the token, and a
  body SHALL prove each one refuses its own measured instance —
  **an unresolvable `blocked_by`, and a record newer than STATE**.
- **A POSITIVE CONTROL SHALL prove a clean push is ALLOWED**; a guard
  that refuses everything is indistinguishable from one that works, which
  is `T-199`'s lesson and this project's most expensive one.
- THE guard SHALL be proved to FIRE end to end — a stale token, a real
  push attempt, and the remote ref asserted UNCHANGED — following
  `T-167-s8`'s three-arm shape rather than asserting a decision function's
  return value.
- **This card is GUARD-CLASS**: `review: independent` is owed and SHALL
  be set at dispatch. The one time this seat missed that, the verifier it
  should have had found three mutants that would have refused every push
  in the repository.
- Verification: headless.

## Read beside

`T-202` (which produces the token — this card is blocked on it),
`T-167-s8` (the guard whose shape this extends, landed and verified),
`T-212` (the landing gate, this hook's other arm), `T-209` (the
intersection that arm calls), and `docs/CONVENTIONS.md`'s
edit-script-is-a-gate bullet, which this card makes mechanical.

## Implementation notes — built on `task/T-203-lane`

**WHAT THE THREE DECISIONS WERE ANSWERED WITH.**

1. **Where the token lives** — `.nputer/gate-verdict.json`, the runtime
   directory T-154 already created with its self-ignoring `.gitignore`.
   The argument is the amend, and it is the one the card asked for: a
   token IN THE TREE can be stale-but-matching, because amending a commit
   to change a source file leaves the committed token intact and
   describing a tree that no longer exists — while its own presence in
   the tree changes the tree it would be compared against. `git
   check-ignore` is asked for this in a body, with a tracked path as the
   control, rather than the property being inferred from the path's
   spelling.
2. **What "stale" means** — the **tree hash**, `HEAD^{tree}`, recorded
   PER SUITE. An amend that changes only the message keeps the token
   valid (the suites graded that content, and the content has not moved);
   an amend or rebase that changes a file stales it. A rebase that
   reorders commits onto the same final tree keeps it valid, and that is
   a STATED LIMIT rather than an oversight — a tree hash cannot see
   history. Both directions are measured in one body.
3. **Whether the cheap checks can be skipped** — no, and no flag exists.
   `T-167-s8`'s argument held: the one candidate case had a one-command
   remedy, and a hatch for a case that already has a remedy is a hatch
   that gets used for every other case.

**A FOURTH DECISION THE CARD DID NOT NAME: the token must be COMPLETE.**
A token recording one suite is not a lie — it says exactly what it
measured. It is the READER that would lie, by accepting "the gates are
green" from a claim about a quarter of them. So the required set is the
whole graded registry and a token missing an entry is refused as
INCOMPLETE, naming the suites. The required list is held in the hook
(which may not import the registry — its matcher fires on every `Bash`
call in a session) and is COMPARED against `GRADED_SUITES` by a body, the
treatment `LANE_BRANCH_RE` and `GRAPH_REL_PATH` already get.

### THE POSTURE CHANGE, DECIDED AND DEFENDED RATHER THAN INHERITED

**THIS CARD EXTENDS A REGISTERED GUARD; IT DOES NOT CREATE ONE.**
`.claude/settings.json` has pointed `PreToolUse`/`Bash` at
`push-guard-hook.mjs` since `b8dcb37` (T-167-s8) and this card did not
touch that file — the diff proves it. What is added is a THIRD ARM inside
the decision module, beside the graph arm and T-212's landing arm.

**AND IT INVERTS THAT FILE'S FAIL-OPEN POSTURE, WHICH IS A DECISION.**
`push-guard.mjs`'s header argues — well, and it is right — that *"a guard
that can halt [the pushing seat] on its own inability halts the project,
and the first person it inconveniences turns it off."* The token arm
refuses on a MISSING token. Three reasons that argument does not reach
it, and they are reasons rather than an exemption:

1. **It is not an INABILITY.** Every fails-open arm in that file is the
   guard failing to ANSWER a question: no cargo, no toolchain, an
   unreadable request, a check that exited 2. An absent token answers its
   question — *nothing was measured* — and it is the precise state this
   card exists to catch. A guard that allowed there would not be
   cautious; it would be vacuous, passing its own subject.
2. **The inconvenience has a one-command remedy, and the refusal prints
   it.** *"The first person it inconveniences turns it off"* is a claim
   about a guard with no way out. `node tools/e2e/scripts/gate-run.mjs
   --all` is the way out, it is the command that seat already owes, and
   the refusal names it together with the reason it must be run LAST.
3. **The guard's OWN inability still fails open, and is announced.** A
   checkout whose `HEAD^{tree}` git will not name has no key to compare
   against; that arm allows and says so, with a body driving both sides.
   So the header's rule is preserved exactly where it applies.

**WHAT IS PAID FOR IT, said plainly**: the full battery is now owed once
per PUSH — which is the card's own design (*"commits stay fast; pushes
become unlyable"*) — and the false-positive cost of `gitInvocations`'
whitespace scanner rises with it, as recorded below. If a seat measures
that this bet is wrong, the place to argue it is a card, not a flag.

**A COST THAT ROSE, RECORDED RATHER THAN DISCOVERED.** `gitInvocations`
is a whitespace scanner whose own header records that `echo git push`
reaches the refusal. Under the graph arm that cost was bounded by a real
staleness the seat already owed. Under the token arm it is not: a stray
`git push` inside an unquoted string is refused whenever the battery has
not been run against HEAD's tree. The scanner is a landed guard's and was
neither widened nor narrowed here; the new cost is stated in the module
header so the next reader meets it in a comment rather than in a refusal.

**TWO SIBLING SPECS CHANGED, AND THAT IS THE GUARD BEING REAL.** A new
precondition on every push in this repository means every fixture that
drives a push must now express "the gates were run against this tree".
`push-guard.spec.ts`'s fixture plants a fresh green token by DEFAULT (a
fixture with none would refuse before the graph arm was ever reached, and
every graph body would have been measuring the token arm while reading as
though it measured the graph); `landing-gate.spec.ts` refreshes one at
the push rather than at fixture build, because its bodies commit in
between and the key is the tree.

**THREE OF THIS REPOSITORY'S OWN TRIPWIRES FIRED ON THIS WORK AND ALL
THREE WERE RIGHT.** `brief-flush.spec.ts` caught `push-checks.mjs` ending
at `process.exit()` after writing (fixed to `process.exitCode`, not
argued into the exempt list); `git-fixture.spec.ts` caught the new
`gate-run.spec.ts` fixture committing without spreading
`NO_BACKGROUND_MAINTENANCE`; and the new placement check itself caught
`landing-gate.spec.ts`'s fixture cards carrying `status: building` with
none of the four fields the parser requires — cards the parser would
refuse, standing in for cards it would not.

**ONE IMPLEMENTATION, NOT TWO** (T-057): the record-newer-than-STATE
derivation MOVED from `docs-gate.mjs` into `docs-scan.mjs` as
`staleStateRecords` and both readers now call it, which is the treatment
`DOC_BUDGETS` got at T-156 for the identical reason. A body asserts the
gate calls the shared derivation rather than carrying its own.

### The rejection, and what it changed (2026-09-01)

**THE BLOCKING DEFECT: the token was not gitignored outside an armed lane
worktree.** `writeToken` created `.nputer/` and the token and never the
`.gitignore` that makes the directory un-committable — only T-154's fence
writer did that, at DISPATCH time. So non-committability was a property of
having been dispatched as a lane, and false everywhere else: on a fresh
clone, and **in the integration checkout, which is never armed as a lane
and is where pushes happen**, `git status` showed `?? .nputer/` and `git
add -A` offered the token. That is the stale-but-matching hazard
`gate-token.mjs` argues against at length, reintroduced by the guard
written to close it.

**THE SECOND FACE IS THE ONE WORTH KEEPING.** The body asserting
non-committability used `docs/STATE.md` as its negative control, and on a
fresh clone **the subject and the control returned the same value** —
the exact degeneracy a control exists to exclude. No mutant of mine could
have killed it, because it was green BY CONSTRUCTION in the only tree the
drill ever ran in. A drill can only kill what its environment lets fail.

**FIXED**: `writeToken` now arms the directory itself, the ignore string
has ONE home both writers import (`RUNTIME_DIR_IGNORE` in
`.claude/hooks/lane-fence.mjs`), and the bodies that check it build a
repository **nobody armed** and ask `check-ignore`, `git status` and `git
add -A --dry-run`. **The new bodies were run against the pre-fix writer
first and all three FAILED** — the pin is real before it is green.

**FINDING 1 — a cargo-less checkout could never push, and it said the
wrong thing.** Decided: it still refuses. An unrun suite genuinely is
unmeasured, which is this card's premise. But `REFUSED` no longer arrives
as `token-red`: the states are split, and `token-unmeasured` says the
runner DECLINED TO GRADE and names the toolchain case. Telling a seat its
suite failed when nothing ran is telling it something false about its own
tree. The reconciliation with this file's own third criterion — *"the
gate could not run" must never become a refusal* — is written into
`push-guard.mjs`'s header: **the discriminator is whose inability it is.**
The graph arm refuses to turn ITS OWN inability into a verdict; the token
arm reports the RUNNER's inability faithfully.

**FINDING 2 — C-7, the key described a tree the run did not measure.**
Real, and the header's claim that the tree hash *"names the CONTENT the
suites actually ran against"* was an overclaim: suites execute against the
WORKING TREE. Fixed rather than reworded — each entry now records whether
TRACKED files were modified when it ran, and a token carrying dirt is
refused as `token-unkeyed`. Untracked files are deliberately not counted
(they do not move `HEAD^{tree}` either, and refusing over a scratch note
is how a guard gets turned off); **the residual — an untracked NEW TEST
FILE — is named in the code and self-corrects when it is added.**

**FINDING 3 — the card's own opening quote.** Corrected in place at the
top of this card, with the derivation.

## THE POISON DRILL LEDGER — 14 mutants at `9b572f2`, 0 survivors

**IT IS HERE BECAUSE A FIGURE WITHOUT A KEEPER IS A CLAIM** (the verdict
of 2026-09-01). The drill ran, and its result lived only in a report to
the coordinator — so a verifier could read that M3 *aborted* but could
not confirm it ABORTED rather than was REPORTED as aborting. That is the
same defect this lane already recorded about a byte count, arriving from
the other side. Every row below is transcribed from the run's own
`drill-ledger.json`, not retyped from memory: each landing is what `diff`
printed, each kill list is the runner's own body names, each restore is a
sha256 taken before the mutation and compared after.

**HOW THE HARNESS REFUSES TO LIE.** A mutant whose pattern does not match
**aborts the whole run** rather than printing `survived` — the failure
mode this project has hit four times in one night. A mutant whose `diff`
shows no change aborts too. Both restore the file first.

**THE ORDER IS THE RUN ORDER**, which is why `M10` is last: `M11`–`M14`
were appended to the array ahead of it when the rejection's fixes landed.

### M3 ABORTED ON ITS FIRST RUN, AND THAT IS THE ROW WORTH READING

After the rejection's fixes rewrote the red arm into a red/unmeasured
split, `M3`'s pattern `if (entry.verdict !== GREEN) {` no longer existed.
The harness stopped the entire drill at that point:

```
M1 token-missing arm allows: exit=1 failed=2 passed=43 restored=true
M2 token staleness never detected: exit=1 failed=4 passed=80 restored=true
ABORT M3 token redness never detected: pattern matched 0 times in .claude/hooks/gate-token.mjs, expected exactly 1
```

Exit **9**, no ledger written, and `git status --porcelain` **0 dirty
paths** afterwards — the abort restores before it exits. A mutator that
had merely *reported* would have printed `survived` and left a stale
pattern pointing at code that no longer exists, which is how a drill
comes to certify a property nothing tests. `M3` was then retargeted at
the site the property moved to (`if (red.length > 0) {`) and the full
set re-run; that re-run is the ledger below.

### The 14 rows
#### M1 token-missing arm allows

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- state: "missing",`
  - `+ state: "fresh",`
- **died** (2 body/bodies; the run also reported 43 passed):
  - `tests/push-guard.spec.ts:901:1 › a missing token refuses the push and names the one command that fixes it`
  - `tests/push-guard.spec.ts:1122:1 › a checkout whose HEAD tree git will not name is announced, and allowed`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M2 token staleness never detected

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (entry.tree !== tree) {`
  - `+ if (false && entry.tree !== tree) {`
- **died** (4 body/bodies; the run also reported 80 passed):
  - `tests/gate-run.spec.ts:736:1 › a real run's verdict survives the round trip into the token and is judged GREEN against the tree it ran at`
  - `tests/push-guard.spec.ts:915:1 › a token whose tree is not HEAD's refuses as STALE, naming both trees`
  - `tests/push-guard.spec.ts:1014:1 › an amend that changes only the message keeps the token; one that changes a file does not`
  - `tests/push-guard.spec.ts:1177:1 › WITH the guard, the same stale token never reaches the remote`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M3 token redness never detected

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (red.length > 0) {`
  - `+ if (false && red.length > 0) {`
- **died** (3 body/bodies; the run also reported 81 passed):
  - `tests/gate-run.spec.ts:778:1 › a RED verdict is recorded rather than dropped, so a red run is never mistaken for a run nobody made`
  - `tests/push-guard.spec.ts:924:1 › a token recording a red suite refuses, and says which suite`
  - `tests/push-guard.spec.ts:943:1 › a suite the runner DECLINED to grade refuses as unmeasured, not as red`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M4 an incomplete token passes

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (missing.length > 0) {`
  - `+ if (false && missing.length > 0) {`
- **died** (2 body/bodies; the run also reported 82 passed):
  - `tests/gate-run.spec.ts:805:1 › a second run MERGES into the token rather than replacing it, because the battery is run in pieces`
  - `tests/push-guard.spec.ts:932:1 › a token that graded some of the battery is refused as INCOMPLETE`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M5 dangling blockers never reported

- **site** `tools/e2e/scripts/push-checks.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (cards.has(id)) continue;`
  - `+ if (true) continue;`
- **died** (4 body/bodies; the run also reported 52 passed):
  - `tests/push-checks.spec.ts:143:1 › a blocked_by naming no live card is FOUND, and one naming a live card is not`
  - `tests/push-checks.spec.ts:226:1 › the CLI exits FOUND on a defective board and CLEAN on a coherent one`
  - `tests/push-guard.spec.ts:1039:1 › an unresolvable blocked_by refuses the push — the first measured instance`
  - `tests/push-guard.spec.ts:1066:1 › the cheap checks run even where the guard would otherwise allow and return`
- **restored** — sha256 `7926d205b888bafd…` before mutation, identical after: **yes**

#### M6 placement gaps never reported

- **site** `tools/e2e/scripts/push-checks.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (missing.length === 0) continue;`
  - `+ if (true) continue;`
- **died** (1 body/bodies; the run also reported 10 passed):
  - `tests/push-checks.spec.ts:162:1 › a card stamped out of suggested without its four placement fields is FOUND; a suggestion is not`
- **restored** — sha256 `7926d205b888bafd…` before mutation, identical after: **yes**

#### M7 a record newer than STATE is never reported

- **site** `tools/e2e/scripts/docs-scan.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (recAt !== null && recAt > stateAt) stale.push(rec);`
  - `+ if (false && recAt !== null && recAt > stateAt) stale.push(rec);`
- **died** (2 body/bodies; the run also reported 97 passed):
  - `tests/push-checks.spec.ts:179:1 › a checkpoint record committed after STATE is FOUND, and the same commit as STATE is not`
  - `tests/push-guard.spec.ts:1048:1 › a record newer than STATE refuses the push — the second measured instance`
- **restored** — sha256 `9212db603df239e8…` before mutation, identical after: **yes**

#### M8 the cheap checks stop being unconditional

- **site** `.claude/hooks/push-guard.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- const cheapResult = cheap(root);`
  - `+ const cheapResult = onLane ? { status: 0, stdout: '', stderr: '' } : cheap(root);`
- **died** (1 body/bodies; the run also reported 44 passed):
  - `tests/push-guard.spec.ts:1066:1 › the cheap checks run even where the guard would otherwise allow and return`
- **restored** — sha256 `574bbaa53d2d2d79…` before mutation, identical after: **yes**

#### M9 only GREEN verdicts reach the token

- **site** `tools/e2e/scripts/gate-run.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- const { path: tokenFile } = writeToken(root, verdicts);`
  - `+ const { path: tokenFile } = writeToken(root, verdicts.filter((v) => v.verdict === "GREEN"));`
- **died** (1 body/bodies; the run also reported 38 passed):
  - `tests/gate-run.spec.ts:778:1 › a RED verdict is recorded rather than dropped, so a red run is never mistaken for a run nobody made`
- **restored** — sha256 `9948e0d899445c56…` before mutation, identical after: **yes**

#### M11 writeToken stops arming the runtime directory

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (!existsSync(ignoreFile)) writeFileSync(ignoreFile, RUNTIME_DIR_IGNORE, "utf8");`
  - `+ if (false) writeFileSync(ignoreFile, RUNTIME_DIR_IGNORE, "utf8");`
- **died** (3 body/bodies; the run also reported 42 passed):
  - `tests/push-guard.spec.ts:816:1 › writeToken makes its own token un-committable in a repository NOBODY armed`
  - `tests/push-guard.spec.ts:871:1 › the ignore string has ONE home, and the fence writer and the token writer both use it`
  - `tests/push-guard.spec.ts:885:1 › an ignore file already on disk is left alone, so an armed lane is never clobbered`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M12 a token written over a dirty tree is accepted

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (unkeyed.length > 0) {`
  - `+ if (false && unkeyed.length > 0) {`
- **died** (1 body/bodies; the run also reported 44 passed):
  - `tests/push-guard.spec.ts:977:1 › a battery run over uncommitted work does not certify the tree it is keyed to`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M13 the working tree is never seen as dirty

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- return String(out.stdout ?? "").trim() !== "";`
  - `+ return false;`
- **died** (1 body/bodies; the run also reported 44 passed):
  - `tests/push-guard.spec.ts:977:1 › a battery run over uncommitted work does not certify the tree it is keyed to`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M14 REFUSED collapses back into RED

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- if (entry.verdict === "REFUSED") unmeasured.push(`${s} (${detail})`);`
  - `+ if (false) unmeasured.push(`${s} (${detail})`);`
- **died** (1 body/bodies; the run also reported 44 passed):
  - `tests/push-guard.spec.ts:943:1 › a suite the runner DECLINED to grade refuses as unmeasured, not as red`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

#### M10 a later run replaces the token instead of merging

- **site** `.claude/hooks/gate-token.mjs`
- **landing, read from `git diff`** — one line out, one in:
  - `- const suites = "token" in prior ? { ...prior.token.suites } : {};`
  - `+ const suites = {};`
- **died** (1 body/bodies; the run also reported 38 passed):
  - `tests/gate-run.spec.ts:805:1 › a second run MERGES into the token rather than replacing it, because the battery is run in pieces`
- **restored** — sha256 `417dfe75c45997ac…` before mutation, identical after: **yes**

**Totals at `9b572f2`: 14 mutants, 14 killed, 0 survivors, 0 unrestored,
and `git status --porcelain` clean after the run.** The two aims this
project separates are both met: every mutant died, and each died AT THE
SITE THE PROPERTY LIVES rather than somewhere downstream.

**ONE BODY NAME IN `M11` NO LONGER EXISTS, AND THE LEDGER IS DELIBERATELY
NOT EDITED TO MATCH.** `M11`'s kill list records *"the ignore string has
ONE home, and the fence writer and the token writer both use it"*. That
body was renamed AFTER this drill ran — to *"the ignore file the TOKEN
writer leaves on disk is the one imported ignore string"* — because its
name claimed both writers while the body drives one. **A ledger is a
record of a run at a ref, not a description of the current tree**, so
correcting the transcription would make it a tidier document and a false
one. The name dangles on purpose and this sentence is its pointer: a
reader grepping for it finds nothing, and would otherwise read that as a
DELETED body rather than a renamed one.

**WHAT THE DRILL COULD NOT REACH, NAMED RATHER THAN IMPLIED.** The
pre-fix ignore-file defect was invisible to every mutant of mine, because
the body asserting it was green BY CONSTRUCTION in the only tree the
drill ever ran in — an armed lane worktree. A drill can only kill what
its environment permits to fail. That is why `M11`'s three bodies now run
in a repository nobody armed, and why they were run against the pre-fix
writer FIRST, where all three failed.
### Owed at the merge, outside this lane's fence

- **`docs/CAPABILITIES.md` REGENERATION.** `npm run capabilities:check`
  exits 1 — committed **36,429** bytes against a fresh generation of
  **39,429** bytes **at `489f6b9`**. The regeneration is the integrator's
  step and lands in the merge commit (the practice at `8422407`,
  `4cb2313`, `a2b53e3`, `75093ce`); `docs/CAPABILITIES.md` is outside
  `[.claude, tools/e2e]`. **RE-DERIVE IT AT THE MERGE — this figure has
  now moved three times inside one lane** (38,897 at `9cdcffe`, 39,007 at
  `1987be9`, 39,429 here), once per batch of spec names added, which is
  precisely why a byte count is worthless without the ref it was taken at.
- **`docs/CONVENTIONS.md` gets no bullet for this gate.** The BLESSED
  GATE-RUNNER bullet still describes the runner without its token, and
  nothing in that file yet tells a seat that a push now needs one. Routed:
  the file is outside this fence.
- **`docs/STATE.md`'s push line needs updating AGAIN, for the opposite
  reason.** At this lane's BASE (`9d56b47`) it read *"NOTHING GATES THE
  PUSH YET"*, which was already false then — a push has been gated on a
  stale graph since `b8dcb37`. Main corrected it at `53fe498` to *"PUSH is
  registered and FAILS OPEN (hazards)"*, which is exactly right today and
  is exactly what this card changes: the token arm fails CLOSED. Neither
  the line nor the hazard block is inside `[.claude, tools/e2e]`, so the
  re-correction is routed. **The base's copy is stale on this point and
  was deliberately not edited from inside the lane** — that would be a
  mid-flight fence widening, which is the very thing the sibling lane is
  writing law about.
- **The docs gate's own STATE-staleness reporting has no body.** The
  poison drill's M7 killed two bodies in `push-checks.spec.ts` and
  `push-guard.spec.ts` and NONE in `docs-input-gate.spec.ts` — the check
  was untested where it already lived, and this card moved it rather than
  covering that half. Pre-existing, named rather than silently inherited.

## `review: independent` SET AT FILING, not left for a dispatch to remember

**A pre-push gate — its job is to REFUSE a push.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.
