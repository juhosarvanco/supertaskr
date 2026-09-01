---
id: T-216
title: THE PUSH GUARD ROOTS ON THE WRITER'S cwd TOO — `cd <lane> && git push` asks the DISPATCHING checkout's graph, so the guard answers about a tree the push does not contain
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: [T-199]
touches: [.claude, tools/e2e]
suggested_by: "T-199's executor, which was told to treat push-guard.mjs's import list as a contract and found the same defect CLASS in the file's own rooting while checking it"
builder: claude-opus-5@subagent
review: independent
---

**THE SAME LINE, IN THE GUARD NEXT DOOR.** `T-199` fixed
`lane-fence.mjs`'s `decide` by rooting on the TARGET rather than on
`request.cwd`. `.claude/hooks/push-guard.mjs` still roots on the writer:

`.claude/hooks/push-guard.mjs`, in the arm that resolves the checkout
(derive it: `grep -n "findCheckoutRoot(cwd)"` — it was line 449 when this
card was filed and T-203 has since moved it, which is why the citation is
now a SEARCH and not a number):

    const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();
    const root = findCheckoutRoot(cwd);

`root` then decides four things: whether this is *this* repository at all
(`INDEX_CRATE_MANIFEST_REL_PATH`), whether the pusher holds a lane,
whether that lane's fence can reach the graph, and — the load-bearing one
— **which checkout `index --check` is run in.**

## Why it is the same class and not the same card

In this project's dispatch shape a lane session's `request.cwd` is the
DISPATCHING checkout (`CLAUDE_PROJECT_DIR`), not the lane. A lane that
pushes with `cd /Users/ujju/Projects/nputer-T-NNN && git push` therefore
gets its graph judged **in the dispatching checkout** — a different tree,
a different HEAD, a different `docs/architecture/graph.json`. The verdict
can be green while the pushed commits carry a stale graph, and red while
they carry a current one.

**IT IS NOT FIXED BY COPYING `T-199`'s FIX**, which is why it is a card
and not a line. A write has a target path; a push does not. The
repository a `git push` acts on is named by the command's own `-C`/`--git-dir`
options, by a `cd` earlier in the same shell line, or by the shell's cwd
— and `push-guard.mjs` already declines to parse shell for a write target
(`lane-fence.mjs` limit 1 gives the reason: it "answers confidently and
wrongly"). So the honest options are narrower and each costs something:

1. **Read the `-C` option the guard's own `isPush` scanner already steps
   over**, and treat a bare push as the writer's cwd. Cheap, covers the
   explicit case, misses `cd … && git push` — which is the live case.
2. **Refuse to judge a push whose repository the guard cannot identify**,
   and say so. Fails closed on the guard that currently fails open.
3. **Leave it and DECLARE it**, the way `T-199` made an unjudged write
   announce itself — the guard already has an "announced allow" arm
   (`check-could-not-run`), so the shape exists.

## Acceptance criteria

**THE LAST TWO WERE APPENDED BELOW THIS SECTION AND ARE NOW INSIDE IT.**
Everything that parses a card scopes to this heading, and the parser's
`splitSections` DROPS content under unknown `##` headings entirely — so
two normative SHALLs sat where no mechanism could see them and a
preflight would have passed the card green with them uncounted.
**Measured, not assumed: 5 SHALLs in the card, 3 inside this section,
before the move.** It is the CARD AUDIT class one turn later — the same
gap, now swallowing requirements about the WORK rather than claims about
the world.

- A body SHALL demonstrate the defect: a real lane worktree, a real
  `cd <lane> && git push`, and the check demonstrably run against a
  DIFFERENT checkout than the one being pushed.
- A positive control SHALL prove the guard still refuses a genuinely
  stale push and still passes a current one — `push-guard.spec.ts`
  already carries that pair (`WITH the guard, …`), so it is extension
  rather than invention.
- WHERE the guard cannot identify the pushed repository, the decline
  SHALL be observable rather than silent (`T-199`'s third criterion,
  applied to the guard beside it).
- **THE ONE-CARD-VERSUS-TWO RULING SHALL BE ARGUED, NOT MERELY STATED**,
  and SHALL name what it leaves behind, so a narrowing is visible rather
  than silent. **A split is legitimate; a split is not a route to
  softening the four criteria above it.**
- WHERE the implementation leans on an ANCESTRY test it SHALL state the
  limit recorded below: ancestry is answerable from a stale checkout only
  because a WORKTREE shares refs, and a stale CLONE consults a stale
  `main` and answers wrongly.
- Verification: headless.

## CARD AUDIT — 2026-09-01, the first run of orchestrator 5b's new step

Audited at the dispatching seat BEFORE the stamp, per `orchestrator.md`
5b. Every factual claim checked against the tree at `e9f21a6`:

| claim | verdict |
|---|---|
| `push-guard.mjs` still roots on `request.cwd` | **HOLDS** — the quoted two lines are verbatim in the tree |
| the rooting decides four things incl. which checkout `index --check` runs in | **HOLDS** |
| `blocked_by: [T-199]` is met | **HOLDS** — T-199 `done` |
| the code sits at **line 449** | **FALSE** — line 449 now reads `stdout: String(out.stdout ?? "")` |

**`T-203` inserted roughly 220 lines above it, and nothing updated this
card.** The code moved to 669–670. The citation was corrected to a
`grep` rather than a number, which is the form `docs/STATE.md` asks for:
*a line number is a coordinate in a mutable object that fails silently,
still pointing at a real line, just the wrong rule.*

**The card's substance is untouched** — the defect is real and still
present. What the audit caught is a stale coordinate that would have sent
an executor to an unrelated line in a file it was about to change.

**And this is the case 5b was written from.** A preflight validates
structure and would have passed this card green; nothing checks a
sentence about the world. `T-230` is the construction that would have
caught it mechanically.

## A LIVE INSTANCE, MEASURED AT DISPATCH — AND IT IS WORSE THAN THIS CARD SAYS

Found at the integration seat on 2026-09-01, hours after `T-203` landed
the push gate, while checking why a push with a demonstrably STALE token
had succeeded.

**The guard never ran. Not once, across an entire sitting of pushes.**

The dispatching session's project directory is a git WORKTREE checked out
at `4ec229c` — **334 behind main at `9eb3ec8`, 335 at `4c33125`**
(two seats read those two numbers an hour apart and BOTH WERE RIGHT; a
bare count here manufactures a disagreement between correct readings,
which is the third time in two days an unanchored figure has done that) —
predating `T-199`, `T-203`, `T-209` and `T-212`. Its `.claude/settings.json` registers only the
lane-fence hook, and `.claude/hooks/push-guard-hook.mjs` **does not exist
there at all.**

Driven directly, the guard is correct in both checkouts:

    request.cwd = the session's worktree  -> block, `token-missing`
    request.cwd = the checkout pushed from -> block, `token-stale`
                  (HEAD tree eeb7236…, token recorded 88d8550…)

**Both refusals are right. Nothing invoked either of them.**

### Why this widens the card

This card's finding is that the guard ROOTS on the writer's cwd, so it
judges the wrong tree. That presumes the guard runs. **The stronger case
is that the hook is LOADED from the session's project directory, so a
session sitting in a stale checkout runs a stale guard — or, as here, no
guard at all.**

A rooting fix cannot reach this. A guard absent from the checkout that
loads it has no cwd to root on.

### What it means for anything this card builds

**A push gate is only as current as the checkout the session was started
in**, and nothing announces the gap. The seat believed it was gated for a
whole sitting and reported pushes as "judged" that were never seen. What
saved the tree was a HABIT — running `gate-run --all` by hand and reading
it — which is exactly the substitute the guard exists to replace.

Whoever builds this decides whether that is this card's problem or a
sibling's, and **says which** rather than leaving it. A candidate shape:
the guard announces its own provenance — which checkout it was loaded
from and whether that checkout is an ancestor of the integration branch —
so an absent or stale guard is LOUD instead of silent. That is the
project's standing preference for a refusal over a silence, applied to
the guard's own installation.

## THE CANDIDATE REMEDY ABOVE IS DEFECTIVE, AND ITS OWN INSTANCE IS THE PROOF

Found by this card's blind verifier reading the section above BEFORE any
implementation existed, and it corrects the dispatching seat that wrote
it.

**"An absent or stale guard is LOUD instead of silent" treats two unlike
halves as one.**

- A **STALE** guard RUNS. It can read its own `import.meta.url`, announce
  which checkout it came from, and refuse or disclose. Provenance works.
- An **ABSENT** guard runs NOTHING. The measured checkout registers no
  `Bash` matcher at all, so there is no place for an announcement to come
  from.

**And ABSENT is the half that was measured** — *"does not exist there at
all."* So the proposed remedy covers the case that did not happen and
misses the case that did.

Anything that catches an absent guard must run **where the guard is
not**: in settings, in the dispatch ritual, or on the integration side.
**That is, by construction, a sibling's problem** — so this card's own
text carries evidence for the two-card ruling, whichever way the lane
goes.

### And the ancestry half has a limit that must be stated if it is used

The candidate's second clause — *whether that checkout is an ancestor of
the integration branch* — is answerable from a stale checkout **only
because a WORKTREE SHARES REFS**. Measured: from the session worktree at
`4ec229c`, `main` resolves to `4c33125`, a commit its own HEAD does not
contain.

**In a stale CLONE the same query consults a stale `main` and answers
wrongly** — the guard asking the stale thing whether it is stale. Any
implementation leaning on ancestry states that limit or inherits it
silently.

## THE BRIEF ASKED FOR MORE THAN THIS CARD DID, AND THE CARD IS NOW THE STRICTER ONE

The dispatching brief asked the executor to rule on one-card-versus-two,
**argue its reason, and name what it leaves behind.** The section above
required only *"decides ... and says which."* The verifier caught the gap
and correctly re-stamped to grade against the CARD, treating the extra as
credit rather than a pass mark — *"I won't hold the executor to a
sentence that exists only in your message to me."*

That is the right call and it leaves a divergence between brief and card,
which TASK-FORMAT says is resolved on the card. **Resolved here, in the
card's favour, because the argued ruling is what was actually wanted:**

**These three obligations now live in `## Acceptance criteria` above,
where the machinery can see them. They were here, below every heading a
parser reads, until this card`s verifier measured that they were
invisible.**

## A FIGURE, A WRONG DIAGNOSIS OF IT, AND A WRONG DIAGNOSIS OF THAT

Three seats' worth of correction on one number, kept because the last
turn is the interesting one.

**The measurements**, at this card's own refs:

    ref        grep -c SHALL    grep -o '\bSHALL\b'
    aea2255          5                  5
    40c1d50          8                  6

**The inflator is the PLURAL, not line counting.** `SHALL` matches
`SHALLs`, and the paragraph added at `40c1d50` carried two: *"two
normative SHALLs sat where no mechanism could see them"* and *"5 SHALLs
in the card."* Six requirements plus two plural mentions is eight.

> **The paragraph written to DOCUMENT the invisible-SHALLs defect is what
> inflated the SHALL count.**

`\bSHALL\b` — the form `isEars` already uses — answers 6.

### What each seat got wrong, in order

1. **The dispatcher reported "8 and 8, zero outside."** Internally
   consistent, and section-scoped at that ref `grep -c` is also 8,
   because the plural-bearing paragraph was inside the section. **The
   load-bearing half — ZERO OUTSIDE — was correct, and the move had
   worked.**
2. **The verifier read the discrepancy as undermining the claim.** It did
   not.
3. **The dispatcher diagnosed its own figure as `grep -c` counting lines,
   multi-line bullets counting twice.** FALSE — the two methods agree at
   `aea2255`.
4. **The verifier diagnosed the dispatcher's figure as repeated from
   memory rather than derived.** Also false. It was measured; the method
   was just wider than the mechanism.

**Only step 4's author measured before writing step 4's correction was
needed** — which is how the plural was found at all.

### Why it is on the card rather than left in the exchange

Because the wrong diagnosis reached a COMMIT MESSAGE (`b6f694e`) and
commits do not change. Anyone reading that message will find a root cause
this card can now say is false. Nothing wrong ever reached the criteria —
checked, and the only greps in this card are the `findCheckoutRoot(cwd)`
citation and the audit's own point about greps over line numbers.

**And a verifier that corrects its own hashed record against its own
interest is worth more than one that is never wrong**, which is the
reason this section exists rather than a quiet fix.

## THE RULING — TWO CARDS, ARGUED, WITH WHAT IS LEFT NAMED

**Two cards.** Filed as `T-216-s1`, and the reason is not a preference
about scope:

**THE PROVENANCE DEFECT CANNOT BE FIXED BY THE ARTIFACT IT IS ABOUT.** A
guard absent from the loading checkout runs none of this card's code; a
guard present but stale runs ITS code, not this card's. Any announcement
added to `push-guard.mjs` is emitted only by checkouts that ALREADY carry
it — exactly the checkouts that do not need it — so building it here
produces a keeper structurally incapable of failing on its own motivating
instance. That is `NORTH_STAR`'s known-vacuous keeper, priced as a
stop-the-line defect, and the class `T-229` exists to name. The remedy has
to run **where the guard is not**, which is a dispatch-time, settings-time
or CI mechanism and not a `PreToolUse` decision module.

This lane reached that conclusion from the sections above BEFORE the
verifier's amendment arrived, and by the same argument. **The cost of the
dispatching seat's defective candidate was zero minutes**: it was rejected
on its own merits when read, and no design was cut against it. What the
amendment changed was the confidence, not the direction.

**WHAT IS LEFT BEHIND, named rather than implied:**

1. **A stale or absent guard is still silent.** `T-216-s1`.
2. **This card's fix is itself loaded from the dispatching checkout**, so
   a lane still does not arm its own copy — `docs/STATE.md` already says
   so. Fixing the rooting does not fix the loading, and this card never
   claimed it would.
3. **No ancestry test is used**, so the stale-clone limit the card raises
   is not inherited here. It is stated on `T-216-s1` for whoever does.
4. **The four original criteria are NOT softened by the split** — each is
   met below, and the split removed nothing from them.

## What landed — executor, base `9eb3ec8`

Two files in shipped scope; **no assertion loosened, no `test("…")` name
removed.**

    .claude/hooks/push-guard.mjs        +438 / -11
    tools/e2e/tests/push-guard.spec.ts  +472 /  -3

`push-guard.spec.ts` goes from **45 to 56** bodies. Two suggestion cards
were routed (`T-216-s1`, `T-216-s2`).

### The design, and why it is not option 1, 2 or 3 alone

The card offered three honest options. **What shipped is 1 and 3
together, and the reason is that they answer different inputs.** A push
has no target path, so the guard now roots on EVIDENCE and on nothing
else — three inputs, decreasing in certainty and each fully determined by
the text:

1. **`git -C <dir> push`** — git's own option, applied by git's own
   chaining rule. Not an inference about the shell; it is what git does.
2. **`cd <literal> && … && git push`** — the shell's cwd at the push.
   **`&&` IS THE WHOLE ARGUMENT**: under it, IF THE PUSH RUNS THEN THE
   `cd` SUCCEEDED. Under `;` a failed `cd` leaves the push where it
   started, and under `||` the `cd` may not have run at all — so a single
   non-`&&` separator anywhere between the first `cd` and the push makes
   the line unresolved. `cd /a || cd /b && git push`, where a naive walk
   lands on `/b` and the shell lands on `/a`, is the worked example that
   fixes the rule.
3. **Nothing moved the cwd** — `request.cwd` IS the push's cwd, which is
   what the old code assumed unconditionally and is still right about.

**Everything else is UNRESOLVED and is declared, never approximated**: a
bare `cd` (the shell's `$HOME`), `cd -`, any value carrying a shell
metacharacter, `pushd`/`popd`, a `cd` word this scanner cannot read as a
command, `--git-dir`/`--work-tree`/`--namespace`, a `GIT_DIR=…` prefix, a
directory that is not there, or two pushes disagreeing about where they
run. **Option 2 (fail closed) was NOT taken**, and the file's own header
is the reason: not knowing which repository a push acts on is THE GUARD'S
OWN INABILITY, and *"a guard that can halt [the seat] on its own
inability halts the project, and the first person it inconveniences turns
it off."* An unresolved push is an ALLOW that says `NOTHING ABOUT THIS
PUSH WAS JUDGED` and names the spelling that restores the guard exactly —
`git -C <dir> push`.

### The cost, stated rather than discovered

**A push spelled outside those constructs is now UNJUDGED where it used
to be MISJUDGED.** That is a trade of a wrong answer for no answer plus a
loud sentence, and it is the only direction this guard may fail.

**THE COST SPLITS IN TWO, AND AN EARLIER DRAFT OF THIS PARAGRAPH CLAIMED
ONLY THE HALF THAT FLATTERED IT.** It said the retired verdict *"was never
about the pushed tree, so retiring it loses no measurement."* **The
universal form is FALSE**, found by this card's verifier and reproduced
here before being written down:

- **CROSS-CHECKOUT — nothing is lost, exactly as claimed.** The push acts
  on a tree the old rooting never looked at, so its verdict was about the
  wrong tree in both directions. Retiring it stops a lie and gains a
  remedy.
- **SAME-CHECKOUT BUT UNRESOLVABLE — a CORRECT verdict is retired.** When
  the push really does act on the writer's own checkout and the line is
  still not readable, the old rooting was ACCIDENTALLY RIGHT: it judged
  the writer's cwd, and the writer's cwd was the answer.

**MEASURED, both directions, one fixture — graph STALE, token FRESH,
`request.cwd` the fixture itself, base `9eb3ec8` against this tip:**

| spelling (each pushes the writer's OWN checkout) | base | tip |
|---|---|---|
| `cd <own> ; git push` | REFUSED `graph-stale` | non-verdict |
| `pushd <own> && git push` | REFUSED `graph-stale` | non-verdict |
| `cd "$OWN" && git push` | REFUSED `graph-stale` | non-verdict |
| `git --git-dir=<own>/.git --work-tree=<own> push` | REFUSED `graph-stale` | non-verdict |
| `GIT_DIR=… GIT_WORK_TREE=… git push` | REFUSED `graph-stale` | non-verdict |
| `echo cd /elsewhere && git push` | REFUSED `graph-stale` | non-verdict |
| `cd ~ && cd <own> && git push` | REFUSED `graph-stale` | non-verdict |
| | **0 of 7** | **7 of 7** |

`cd - && git push` is deliberately NOT in that table: it lands wherever
`OLDPWD` points, which the line does not name, so it is not provably a
same-checkout push and may not be counted as one.

**THE COST IS REAL AND IS TAKEN DELIBERATELY**, and the alternative is the
one thing this card forbids. To keep those seven the guard would have to
GUESS that an unreadable line did not move the cwd — which is the old
assumption restored, and it is wrong exactly when a lane pushes. There is
no test that separates *"unreadable and it stayed here"* from
*"unreadable and it left"*: that IS the unreadability. So the guard
declines both, loudly, and the seat's remedy is one flag. Fail-open on the
guard's OWN inability is this file's doctrine, and criterion 3 asks for
precisely an observable decline rather than a silent one.

## Each acceptance criterion

1. **A body SHALL demonstrate the defect** — MET, twice and mechanically.
   `a cd <lane> && git push runs the check in the LANE, not in the
   dispatching checkout` builds a REAL lane worktree (a sibling, on a
   lane branch, with its OWN commit so the two trees genuinely differ) and
   reads WHERE the check ran from the cargo shim's own `$PWD`. Its
   discriminating half runs a bare push through the SAME fixture and
   requires the check to land in the DISPATCHING checkout — so the
   directory is a function of the COMMAND, not of the fixture. `the two
   checkouts a lane push straddles answer DIFFERENTLY` pins the defect
   permanently: one repository, two checkouts, two verdicts, one seat.
2. **A positive control SHALL prove the guard still refuses a stale push
   and still passes a current one** — MET, extended rather than replaced.
   The five `WITH the guard, …` / `WITHOUT the guard, …` bodies are
   untouched and green. `WITH the fixed rooting, a fully measured lane
   push still reaches the remote` adds this card's own, **measured ON THE
   REMOTE**: the other direction of the same defect refused a lane that
   had run its whole battery, and a guard that refuses every lane push
   passes the refusal body and fails this one.
3. **WHERE the guard cannot identify the pushed repository, the decline
   SHALL be observable** — MET. `push-repository-unresolved` joins
   `ANNOUNCED_ALLOW_CODES`; its silent sibling
   `push-repository-unresolved-outside` deliberately does not, for
   `not-this-repository`'s reason. Both halves are driven.
4. **Verification: headless** — MET. No browser is used by any body added.

### The interactions the brief named, checked rather than assumed

- **T-203's token gate** — the load-bearing interaction. `headTree(root)`
  and `readToken(root)` now key on the LANE's tree, which is the tree the
  push carries. Before this card a lane push was graded against the
  dispatching checkout's token: green over an unmeasured lane, red over a
  measured one. Both directions are now bodies.
- **T-212's landing verdicts** — `readHeadRef(root)` now reads the LANE's
  HEAD, so `laneLandingVerdict` judges the branch actually being pushed.
  Previously it judged the dispatcher's HEAD, which for a lane push is
  usually not a lane branch at all — the landing gate was being asked
  about the wrong branch.
- **T-210's physical layer** — met head on, twice: it correctly refused
  `npm install`'s rewrite of the out-of-fence `app/package-lock.json`
  (`npm ci` is the non-writing equivalent), and it is the cause of the
  two e2e reds attributed below. Nothing was worked around.
- **T-228** — known, not touched.

## THE DRILL LEDGER

### 1. The defect, reproduced against the UNFIXED code

A standalone harness built a real lane worktree and drove the REAL wired
runner with `cd <lane> && git push` and `request.cwd` at the dispatching
checkout. Run against `push-guard.mjs` **as it stands at `9eb3ec8`**, then
against the fix:

| check | unfixed | fixed |
|---|---|---|
| `index --check` runs in the LANE being pushed | **FAIL** | PASS |
| …and NOT in the dispatching checkout | **FAIL** | PASS |
| a lane whose OWN battery never ran is REFUSED | **FAIL** (exit 0) | PASS (exit 2) |
| a fully measured lane is ALLOWED though the dispatcher is not | **FAIL** (exit 2) | PASS (exit 0) |
| the legitimate push REACHES the remote | **FAIL** | PASS |
| an unreadable spelling is ALLOWED | PASS | PASS |
| …and SAYS nothing was judged | **FAIL** | PASS |
| | **1/7** | **7/7** |

The unfixed run's own evidence: the check ran in
`…/T-216-which-tree-eTA5YK/app/src-tauri` — **the DISPATCHING checkout** —
and the measured lane was refused with *"no verdict token … nothing has
been measured in this checkout"*, a true sentence about a tree the push
does not carry. **The one row that does not discriminate on its exit code
alone is the unresolved arm**, because the old guard allowed that push too
by judging the dispatcher; that body therefore requires the SENTENCE.

### 2. Poison drill — four mutants, kill sets read from the run's JSON

Every landing read from `git diff` against the pristine file, never from
the mutator's claim.

| mutant | aimed at | killed by |
|---|---|---|
| M1 | the ROOTING itself — `findCheckoutRoot(cwd)` again, i.e. the base behaviour | **7** of 56 |
| M2 | the `&&` chain rule — accept any separator | **2** of 56 |
| M3 | the DECLARATION — leave the unresolved decline silent | **4** of 56 |
| M4 | the `-C` reading — stop following git's own option | **3** of 56 |

**4/4 killed, and every kill set is INDEPENDENT** — no mutant's kill set
is contained in another's.

**THE FIRST TWO MEASUREMENTS OF THIS DRILL WERE WRONG AND ARE RECORDED
BECAUSE THEY WERE.** The first reported all four mutants *"killed by 54
bodies"* — every body in the file — because it scraped playwright's
`line` reporter, which prints each test as it STARTS. A kill set equal to
the whole suite for every mutant is an artifact, not a measurement, and it
is unusable for containment. Re-measured from the run's JSON, M2 then came
back **CONTAINED BY M4**: the `&&` rule had no body that could tell those
two failures apart. A body aimed at the separator rule alone (`;` and `||`
after a `cd` are not `&&`) was added for that reason, and M2's kill set
became independent. **The drill changed the shipped tests; that is what it
is for.**

## Gates — asked, never guessed

The DOCS GATE was handed the three changed paths as separate literals and
**FIRED**, naming three suites (the card under `docs/tasks` is a code
input). All were run, with `GIT_CONFIG_GLOBAL=/dev/null
GIT_CONFIG_SYSTEM=/dev/null` so no fixture could inherit machine git
config — the class that reddened main for five hours while four local
batteries said green.

| gate | verdict |
|---|---|
| `docs-gate.mjs <3 paths>` | exit 1 — FIRES, names app / tools/e2e / lib/parser |
| lib/parser `npx vitest run` | **349 passed**, exit 0 |
| lib/parser `npx tsc --noEmit` | exit 0 |
| app `npm test` | **1131 passed, 50 files**, exit 0 |
| tools/e2e `npm run typecheck` | exit 0 |
| tools/e2e `npm test` | **501 passed, 2 failed** — both ATTRIBUTED below |
| `index --check --root ../..` | exit 0 — **CURRENT** (1166334 bytes, 200 files) |
| `npm run lint:tokens` | exit 0 — clean |
| `npm run lint:docs` | exit 0 |
| `npm run capabilities:check` | **exit 1 — STALE. OWED TO THE INTEGRATOR** |

### The two e2e reds are NOT this lane's — measured, not asserted

Both are `EACCES` from **T-210's physical read-only layer** meeting two
bodies that write out-of-fence TRACKED files inside an ARMED lane:

    lane-lock.spec.ts:465   method/roles/executor.md not writable
    token-scan.spec.ts:273  EACCES open app/package.json

**Attribution by measurement, not by reading:** the lane's four files were
removed, putting the tree at the base ref in the same armed worktree under
the same borrowed config, and both suites were re-run.

| suite | with this lane | at the base |
|---|---|---|
| app `npm test` (before `npm run build`) | 14 failed / 1117 passed / 6 files | **14 failed / 1117 passed / 6 files** |
| e2e `lane-lock` + `token-scan` | 2 failed / 21 passed | **2 failed / 21 passed** |

Identical. **The app's 14 were a MISSING BUILD, not a defect** — every one
said *"no build output at app/dist/assets"*; `npm run build` in `app/`
cleared all fourteen, and the suite is 1131/1131. The two e2e bodies write
paths a fence makes read-only, so they cannot pass inside an armed lane
and are expected to pass in the unarmed checkouts CI and the integration
seat use. **That is a finding about running the suite in an armed lane,
not about this card, and it is left for the integrator to route.**

### What the integrator owes at the merge

**`npm run capabilities` must be run and land in the SAME commit as this
change** — this lane added 11 `test("…")` names, `capabilities:check`
reads STALE (committed 40662 bytes, fresh 41431), and `docs/CAPABILITIES.md`
is out of this fence and PHYSICALLY read-only under T-210. The lane cannot
do it and did not try to defeat the layer. `T-216-s2` is filed on the fact
that `docs/CONVENTIONS.md` states this rule without naming its owner.

### The integrator's two non-blocking observations: one folded, one routed

**FOLDED — the widened threat model.** `runCheck` spawns `cargo` with its
cwd inside the judged root, and that root can now come from COMMAND TEXT
rather than only from the harness. A sentence is now in
`push-guard.mjs`'s header: the bound is the crate-manifest check made
BEFORE the spawn, `cargo` is still resolved off PATH, and the residual —
a qualifying directory still supplies the `Cargo.toml`, workspace and
`.cargo/config.toml` a build reads — is named rather than dismissed. It
is **not** a privilege escalation: a seat that can write `cd <x> && git
push` can run anything in `<x>` directly, with the same rights and
without this hook. It is a wider surface than a harness-rooted guard had,
and it belongs where the next person deciding what may root this file
will meet it.

**ROUTED — the subshell hole (`T-216-s3`).** It is in the SCANNER, and
this card's subject is the ROOTING; widening a landed guard's matcher
inside a card about where it points is how one guard quietly becomes
another. It is also not a one-liner: `gitInvocations`'s header records
that `echo git push` and `man git push` already reach a refusal, and
under T-203's token arm a false positive refuses most of the time — so
any widening owes a re-measurement of that class, which is a card's worth
of work. **Measured before filing, at this tip:**

    ( cd /tmp && git push )   SEEN, unresolved (safe)
    ( git push )              SEEN, resolves to the writer's cwd
    (cd /tmp && git push)     NOT SEEN AT ALL
    (git push)                NOT SEEN AT ALL

The whitespace is the entire difference, which is why the card treats it
as a misleading declaration rather than an honest gap: `pushCwds` now
reads as though it covers `cd`-prefixed pushes, and for the unspaced
subshell nothing is reached at all.

### The merge this lane hands over, MEASURED rather than claimed

**This card's own text was taken from `main` at `b41a5fa` before the stamp
was appended**, so this section sits after every post-dispatch amendment
rather than beside one. That was done twice — the card was re-stamped when
`main` moved from `aea2255` to `b41a5fa` mid-lane — and it is `T-226`'s
hazard being paid down rather than handed on.

**IT DOES NOT MERGE CLEAN, AND THIS SENTENCE USED TO SAY IT DID.** Asked
with `git merge-tree --write-tree main HEAD` — no ref moved, no commit
written, which is `docs/CONVENTIONS.md`'s own recipe for an executor with
no merge commit to point at:

    CONFLICT (content): docs/tasks/T-216-….md          — this file ONLY
    every other path in the change                     — auto-merged

**ONE hunk, at end of file, and MAIN'S SIDE OF IT IS EMPTY.** Both sides
appended at the same anchor relative to the base, which is a shape git
cannot align however identical the shared prefix is. The resolution is
*keep both, main's text first*, and it cannot lose content. Chasing it
further would mean merging `main` into a lane, which is not this seat's
to do.

**The claim that preceded this paragraph was written before it was
measured, and the measurement contradicted it.** It is corrected here
rather than quietly deleted, for the reason this card's own verifier
section gives one screen up.
