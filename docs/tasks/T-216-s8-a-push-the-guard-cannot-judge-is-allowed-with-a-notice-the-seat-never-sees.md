---
id: T-216-s8
title: A push the guard cannot judge is ALLOWED with a notice the seat never sees — a `cd <dir>;` before the push turned a STALE-token refusal into a silent allow, and an unverified tree reached origin
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: the architect seat, measured by probing the hook with the pushed command line, 2026-09-02
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## The finding, measured

At 10:53Z the seat pushed a2335c6 with a token minted at 5af76ff (a
different tree). Probing the hook afterwards with the two spellings:

- `git push origin main` — PUSH REFUSED: the verdict token is STALE
  against HEAD's tree (exit 2). Correct.
- `cd /Users/ujju/Projects/nputer; git push origin main 2>&1 | grep …`
  — the exact line the seat ran — NOTHING ABOUT THIS PUSH WAS JUDGED:
  "a `cd` reaches this push through a separator that is not `&&`", the
  token, graph, board and fence ALL UNVERIFIED, exit 0, allowed.

The guard's own rule (T-216) reads only what the text DETERMINES and
declines to guess a working directory after a `;`. That is right. What
is wrong is the VERDICT on the undetermined case: an allow. A PreToolUse
hook's stdout on exit 0 is not shown to the seat, so the notice reached
nobody, and a tree no battery had graded went to origin. The one arm in
the file that "refuses on an ABSENCE" is the token arm — and this
spelling routed around it by making the token unreadable rather than
stale.

## What is asked

A command whose text contains a push the guard cannot place SHALL be
REFUSED (exit 2) with the same remedy the notice already spells —
`git -C <checkout> push` — not allowed with a notice. The refusal names
the separator it could not read past. The three determinable spellings
(`-C`, `cd <literal> &&`, an unmoved working directory) are unchanged.
A command with no push in it is unchanged.

## Acceptance criteria

- The exact command line above is refused by name, and the refusal text
  contains the `git -C` remedy.
- `cd <dir> && git push`, `git -C <dir> push` and a bare `git push`
  with a fresh token are still allowed; with a stale token the bare form
  is still refused as STALE (the existing body).
- A positive control demonstrated failing: the mutant that restores the
  allow on the undetermined case reds exactly the new body.
- No other arm's verdict moves: the existing push-guard bodies are green
  at the tip, and the drill kill sets are disjoint from theirs.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, behind T-228 by fence

Filed by the seat that pushed the tree. The evidence is a probe, not a
reading, so it is planned at once — but T-228 holds the whole `.claude`
directory until it lands, and the arm refused this lane on that shared
path. The seat had stamped it `building` and cut a lane before deriving
that; the lane was removed unarmed. Dispatch at T-228's merge; T-238-s1
shares the fence and waits behind this card.

## BUILT, 2026-09-02 — the lane's record

Base `2f813e8`. `push-repository-unresolved` is a `block` at exit 2,
carrying `git -C <the checkout being pushed> push` and naming the
construct it could not read past; it leaves `ANNOUNCED_ALLOW_CODES`
because it is no longer an allow. `push-repository-unresolved-outside`
is untouched — still a silent allow, T-216's sixth criterion.

**THE THIRD CRITERION IS MET IN THE STRONG FORM, BY A DIFFERENT MUTANT
THAN THE ONE THE CARD NAMES, AND THE CARD'S OWN MUTANT DOES NOT HAVE
THAT PROPERTY.** *Restore the allow* (`block(` → `allow(`) reds FOUR
bodies, not one: the new body and the three that had to change with the
verdict. It could not have redded only the new body — a body asserting
`exit 0` on this arm cannot survive the arm refusing. The mutant that
reds EXACTLY the new body is a different one, aimed at what only that
body reads: replace the separator's own sentence in `pushCwds` with a
generic *"the working directory at the push is not determined by the
text"*. 1 failed / 85 passed, and the failure is the new body.

Five drills, all one-side (the code, never an assertion), each read back
with `git diff` and restored by sha256 against `89cf296`, measured over
`push-guard.spec.ts`'s 86 bodies:

| mutant | what it changes | kills |
|---|---|---|
| A | `block(` → `allow(` on the undetermined case | 4 — the new body + the three changed |
| B | the `git -C …` remedy line dropped from the refusal | 2 — the new body + *a spelling this guard cannot read* |
| C | the separator's sentence replaced by a generic one | **1 — the new body, and nothing else** |
| D | the code put back into `ANNOUNCED_ALLOW_CODES` | 2 — the census body + *an unresolvable push outside* |
| F | the separator check accepts ANY separator | 3 — the separator body, the new body, the resolver table |

## Gates, and the one RED that is not this lane's

Derived on `git merge-tree --write-tree main HEAD`, four paths: GRAPH
REGEN **fires** (`*.ts` outside docs/), DOCS GATE **fires** (two cards
are code inputs — app, tools/e2e, lib/parser), BOOT GATE and METHOD
EVAL **not owed** (nothing under `app/src-tauri/**`, `app/src/**`,
either manifest, or `method/**`).

`gate-run parser` GREEN 372 and `gate-run app` GREEN 1141 at both
`73981da` and `e72cf2d`; `index --check` CURRENT at `73981da`.
**`gate-run e2e` RED at both: 2 failed / 620 passed, both in
`session-economics.spec.ts`, and neither is this diff.** `brief.mjs`
refuses three worktrees on task branches (`T-202-s1`, `T-205-s8`,
`T-225-s12`) whose cards *"no live card declares"* — the REF-SKEW class
this project already names (T-143-s1, T-187): all three cards exist on
main and none exists at this lane's base `2f813e8`, so the check joins a
MACHINE-scoped surface (the host's worktree list) to a CHECKOUT-scoped
one (this base's cards) and reds every older lane the moment a newer
lane is cut. **Measured, not argued**: the two bodies red ALONE at this
tip (2 failed / 8 passed) and are GREEN 10/10 in a detached worktree at
the merge tree, where main's cards are present.

**THE MERGE FORECAST IS GREEN, MEASURED TWICE AGAINST A MOVING MAIN, AND
THE INVARIANT IS THE DELTA.** `a944722` (main `cde65b5` ⨝ `73981da`) and
`9d53074` (main `ecbc26f` ⨝ `e72cf2d`) both read `gate-run e2e` **exit
0, 625 bodies, GREEN** — +5 on this lane's own 620, being the two
ref-skew bodies the merge repairs and three bodies main gained. Run in a
detached `../nputer-T-216-s8-forecast`, removed afterwards. The second
forecast's `index --check` is CURRENT, so **the merge owes no regen**;
the first read STALE on two files this lane never opened
(`app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx`, blobs identical to main's) and
main regenerated exactly those at `7b4ed3e` while this lane measured.
Main moved eight commits during this build.

**THE CENSUS IS OWED AND IS NOT THIS LANE'S TO PAY**: one test name is
added, `capabilities:check` reads STALE (committed 52442 bytes, fresh
52556), and `docs/CAPABILITIES.md` is outside this fence — the
integrator regenerates it in the merge commit. It is LOCAL_ONLY, so CI
does not read it.

**THE ROUTED CARD'S ID WAS TAKEN WHILE THIS LANE HELD IT.** It was filed
as `T-216-s9`; `ecbc26f` landed a different `T-216-s9` on main an hour
later, so it is `T-216-s10` here. The card-id namespace is a
BRANCH-scoped surface two seats can claim at once, and nothing warned —
the integrator re-checks it at the merge.

## Attribution owed by the dispatch: the holder body's intermittent

*"a lane holds no seat, so a holder record in one refuses nothing"* —
red under the whole e2e suite on a loaded machine, green alone, filed at
`T-238-s1`'s absorbed `T-229-s11`. **NOT CHANGED HERE**: it is a
different arm from this card's. The attribution, derived rather than
reproduced:

The recorded failure is the control's OR — `control.verdict === "block"
|| notices.includes("SEAT")`. Enumerate the states that satisfy NEITHER
half and the answer is small: `held` blocks, `dead` and `unknown` each
emit a sentence carrying `SEAT`, and `mine` is unreachable (the composed
session's pid is `process.ppid` and the record's is `process.pid`). So
the body can only red through a SILENT allow — `not-a-repository`,
`not-this-repository`, holder `vacant`, or holder `not-integration` —
and **every one of those four is reached only through an
errno-swallowing filesystem probe**: `existsSync` (which returns `false`
for EMFILE and EACCES exactly as it does for ENOENT) at
`readHolder`'s own first line and at `decideWith`'s indexer-manifest
check, and a bare `try/catch` around `statSync`/`readFileSync` in
`gitDirOf`/`headRefIn`. Under the peak descriptor and process pressure of
the full suite — which is precisely the condition the card's table
records, six concurrent Playwright processes — a probe that answers
"not here" for a file that IS there turns a load artifact into a verdict.

**AND IT EXCLUDES THE OBVIOUS SUSPECT.** `decideWithSeat` seams `check`,
`cheap`, `gh` and the session identity but NOT `readProcess`, so
`identityAlive` spawns a real `ps`; that spawn failing is the reading of
the host everyone looks at first. It is not this failure: every state a
failed `ps` can produce is `dead` or `held`, and both satisfy the OR.
A failed `ps` would red the NEXT assertion, `control.code`, which is not
the one recorded.

**THE CHEAPEST NEXT STEP IS NOT A FIX**: put `d.code` and the notices
into the two assertions' own messages, so the next red attributes itself
instead of costing another lane this derivation.

## Verdicts

### APPROVED — 2026-09-02 — claude-opus-5@subagent — blind verifier, measured at `8b5000d`

Judged on the detached bench `../nputer-V-T-216-s8`, base `2f813e8`.
Bodies are cited by NAME, never by line number — a line number is a
coordinate in a mutable object that fails silently. Every figure is my
own, at a named ref; where mine disagrees with the lane's record I say so.

**WHICH BLINDNESS I HAD: the preferred one, and it is a fact about the
clock rather than a discipline** (roles/verifier.md; orchestrator 5c).
Phase 1 was dispatched before this tip existed, so there was no diff to
decline to read. The attack set and the ground truth were written from
the card at its base ref and SEALED before it arrived:

    2026-09-02T11:53:19Z
    b8e75ccaf0ede1621f62dea8c15403daef90d632f607aaa7d1910728b5ae5806  attack-V-T-216-s8.md
    5135da2b540dcb3496c0ecbf8520d0a4740ff947f3ccd9e3a782a82222510903  ground-V-T-216-s8.md

Both re-verified byte-unchanged after this verdict was written. **AND THE
DISCLOSURE THE SAME RULE OWES**: the phase-2 dispatch carried the
executor's own figures in the message that named the tip, so from that
message on I was not blind. The seal timestamp predates it, which is what
makes phase 1 auditable rather than merely claimed.

**The card's central prediction was TRUE, measured before the diff.** At
`2f813e8` the finding's own line exits **0**, allowed, notice on stderr.

#### Every criterion re-derived: fourteen spellings, base against tip

Probed by piping `{"tool_name":"Bash","tool_input":{"command":…}}` into
`push-guard-hook.mjs` from the bench root at BOTH refs under an IDENTICAL
token state — no `.nputer/gate-verdict.json` in either reading, the
bench's own state as cut, restored for the tip — and the two runs diffed
byte for byte. **The entire diff is six cases and two sentences:**

| spelling | base | tip |
|---|---|---|
| bare push | 2, token arm | **2, byte-identical** |
| `cd <dir> &&` push | 2, token arm | **2, byte-identical** |
| `git -C <dir>` push | 2, token arm | **2, byte-identical** |
| push piped to `grep` | 2, token arm | **2, byte-identical** |
| `cd <dir> &&` push piped | 2, token arm | **2, byte-identical** |
| `ls -la docs` | 0, EMPTY stderr | **0, EMPTY, byte-identical** |
| `cd <dir>; ls -la docs` | 0, EMPTY stderr | **0, EMPTY, byte-identical** |
| `cd <dir>;` push `--dry-run` | 0, EMPTY stderr | **0, EMPTY, byte-identical** |
| `cd <dir>;` push | 0, announced allow | **2, refused** |
| the card's exact line | 0, announced allow | **2, refused** |
| `cd "$LANE";` push | 0 | **2** |
| `cd <dir>; git -C <dir>` push | 0 | **2** |
| `echo cd <dir>;` push | 0 | **2** |
| `pushd <dir>;` push | 0 | **2** |

**FIRST CRITERION — MET.** The card's exact line exits **2**, carries the
cause verbatim (*"a `cd` reaches this push through a separator that is
not `&&`"*) and the remedy verbatim (`git -C <the checkout being pushed>
push`). The graph is not asked: 78 ms against 2.9 s for a judged push.

**SECOND CRITERION — MET, GRADED BY ARM IDENTITY, WHICH I PRE-COMMITTED
TO IN PHASE 1 BECAUSE THE CRITERION IS DEGENERATE ON A ONE-SUITE BENCH.**
*"Still allowed"* is unmeasurable here — with no green four-suite token
every determinable push is refused by the TOKEN arm whatever this card
did — so the graded property is that each determinable spelling still
reaches the token/graph arms with **byte-identical** text. Proved by an
empty diff, not asserted. The half the bench cannot show, the lane's new
body shows with a fixture, and I drilled that fixture rather than
trusting it: under the restore-the-allow mutant its `&&` control reds, so
it can fail.

**THIRD CRITERION — MET, AND THE CARD NAMES THE WRONG MUTANT.** I derived
this from my own drill before reading the lane's claim of it, and I
confirm it. `block(` → `allow(` reds **four** bodies, not one, and could
not red one: three sibling bodies assert this arm's verdict and cannot
survive it flipping. The mutant that reds **exactly the new body and
nothing else** is the one aimed at what only that body reads — the cause
sentence. Replacing the interpolated reason with a generic phrase reds
**1 of 86**, and it is the new body. **The criterion should have named
the property, not the mutant**; the property it wanted is present.

**FOURTH CRITERION — MET.** 86/86 green at the tip before any drill. No
other arm's verdict moves — the byte-diff above is the proof, and it is
empty for every determinable and non-push spelling.

#### The drill: ten one-sided mutants over 86 bodies at `8b5000d`

Each landing READ BACK from `git diff` — never a substitution count —
each restored with `git restore --source=8b5000d --staged --worktree` and
PROVED by sha256 against the commit (`push-guard.mjs` `54f4546b…4e717`,
`push-guard-hook.mjs` `668080a7…b8499`), byte-exact after all ten. Kills
+ passes = 86 on every run, so no exit hid a harness failure.

| mutant | kills | which bodies |
|---|---|---|
| `block` → `allow` | 4 | *cannot read*, *outside is silent*, *`;` and `\|\|`*, **the new body** |
| refuse OUTSIDE this repo too | 1 | *outside is silent* |
| remedy line dropped | 2 | *cannot read*, **the new body** |
| **cause sentence made generic** | **1** | **the new body ALONE** |
| hook `exit(2)` → `exit(1)` | 36 | incl. **the new body** |
| **refusal narrowed to sentences naming `cd`** | **0 — SURVIVOR** | — |
| no separator determines the cwd | 8 | incl. **the new body**, the resolver table |
| census row put back (a DATA mutant) | 2 | *announced allows*, *outside is silent* |
| `\|\|` accepted as determining | 2 | *`;` and `\|\|`*, the resolver table |
| cross-checkout notice dropped | 6 | incl. *cannot read*, *`;` and `\|\|`* |

**CONTAINMENT, BOTH DIRECTIONS, SETTLED BY MEASUREMENT RATHER THAN BY
INSPECTION** (roles/verifier.md 2b: containment, never the count). No
other body's kill set contains the new body's — the cause mutant is its
alone. Two bodies LOOKED contained in it after eight mutants, so rather
than declare a restatement I built the two mutants that would separate
them: `||`-accepted kills *`;` and `||`* and not the new body, and the
dropped cross-checkout notice kills *cannot read* and not the new body.
**Neither contains the other in any pair; all three are load-bearing.**
The two controls I proposed for arms the card does not enumerate carry
their own demonstration — refusing outside this repository reds *outside
is silent*, so that control CAN fail, and T-216's sixth criterion is
pinned by a body rather than by argument.

#### One SURVIVOR — a coverage gap, filed as T-216-s11, not blocking

A mutant firing the refusal **only when the unresolved sentence names
`cd`** kills nothing: 86/86 green. The shipped behaviour is correct and
general — `pushd <dir>;` push and `echo cd <dir>;` push both exit 2 and
neither sentence contains `cd` — so the implementation is keyed on the
determinability answer exactly as asked. What is unpinned is the
GENERALITY: `pushd`/`popd`, `GIT_DIR=…`, `--git-dir`, a non-literal `-C`
and *"pushes from N different working directories"* all reach the new
refusal and no body would notice a later narrowing. That is shape SEVEN,
found by deriving from the criteria with the spec file closed. It fails
no acceptance criterion, so it is a suggestion and not a rejection.

#### Security sweep — clean

Four files; no dependency added (no manifest or lockfile in the diff), no
secret, no new input path, no new spawn, nothing executes or shells out
the command text. The two interpolations into the refusal already existed
at the base in the same string and reach stderr only. The change is
strictly STRICTER, so no bypass is introduced, and its one availability
risk — a push wedged by a refusal — is answered inside the refusal by a
one-line remedy. **The sixth criterion keeps it from firing outside this
repository's checkouts, and I verified that from a foreign
`git init -b main` scratch repo**: silent allow there, exit 2 for the
identical text from inside. That control is armed SEPARATELY from its
subject — the arrangement deciding the inside answer, a checkout carrying
the indexer manifest, is ABSENT in the scratch repo — which is the
separation this method most often loses.

#### Architecture and adjacent features

The census argument in `ANNOUNCED_ALLOW_CODES` stays honest: the row goes
BECAUSE the code now blocks, and the spec pins the absence with a second
assertion so deleting the arm outright would not satisfy it (shape five).
`push-repository-unresolved-outside` is untouched. Four header claims
that the token arm is the only fail-closed arm were amended rather than
left to rot; I checked each site. The routed card `T-216-s10` is
well-formed — `status: planned`, `suggested_by` naming the seat and the
ref, `touches` inside this lane's fence.

#### Gates, and the RED that is not this lane's

Mine, at the refs named. At `8b5000d`: `gate-run parser` **GREEN 372**,
`gate-run app` **GREEN 1141**, `push-guard.spec.ts` **86/86**.
`gate-run e2e` **RED, exit 1, 622 bodies, 2 failed / 620 passed**, both
in `session-economics.spec.ts`.

**ATTRIBUTED, NOT ASSUMED, AND THE ATTRIBUTION IS A MEASUREMENT.** The
same spec run ALONE at the base `2f813e8` — this lane's diff entirely
absent, and my own suggested card moved out of the tree so it could not
contaminate the reading — reds **the same two bodies**, 2 failed / 8
passed. The cause is named by `brief.mjs` in its own words: a live
worktree on `refs/heads/task/T-225-s12-…` that *"no live card declares"*.
That card exists on `main` and at NEITHER this base nor this tip, and the
diff touches four paths, none of them `session-economics.spec.ts`,
`brief.mjs`, or anything either reads. It is the REF-SKEW class this
project already names (T-143-s1, T-187): a MACHINE-scoped surface (the
host's worktree list) joined to a CHECKOUT-scoped one (this base's
cards).

**AND THE READING MOVED BETWEEN TWO RUNS OF THE SAME TREE, WHICH IS THE
DIAGNOSIS RATHER THAN A COMPLICATION.** The lane's record names three
unsettled lanes; mine names one. Neither tree changed — the MACHINE's
live lanes did, between the two runs. A red whose content is a function
of the host at the moment of the run cannot be a function of the diff.

**docs-gate FIRES on two card paths** (`T-216-s8`, `T-216-s10`) and now a
third of my own, owing `npm test` from `app/`, `npm test` from
`tools/e2e/` and `npx vitest run` from `lib/parser/`. Those are the gates
THIS VERDICT COMMIT owes, not the ones I was sent, and the figures for
them are recorded at my own tip in the commit message — because a figure
measured at the commit under review is stale at the tip the verdict
itself creates.
