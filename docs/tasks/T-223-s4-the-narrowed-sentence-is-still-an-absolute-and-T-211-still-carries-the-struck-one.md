---
id: T-223-s4
title: "The narrowed sentence is still an absolute — `git symbolic-ref HEAD refs/heads/main` from a lane worktree exits 0 and an ORDINARY commit then moves main — and T-211's card still carries the struck clause"
status: done
feature: F-06
milestone: 4
priority: 4
size: S
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent — build 4a9aed6, notes 7d95dab
verified_by: claude-opus-5@subagent — APPROVED, verdict at the commit this line lands in
review: independent
suggested_by: verifier claude-opus-5@subagent @V-223
---

Two prose residues of the same class, filed as one card because they are
one class: **a sentence about what a lane cannot reach, stated as an
absolute.**

## ONE — the replacement sentence over-reaches its own premise

`T-223` replaced *"main is a ref the lane cannot move"* with **"main is
the ref the lane's own COMMITS cannot move"**, and the header's reasoning
is *"committing on a lane branch advances the LANE branch"*. The premise
is conditional on HEAD naming the lane branch; the conclusion is stated
over every commit a lane makes.

Measured in a throwaway repository, git **2.50.1 (Apple Git-155)**,
Darwin 25.6.0 arm64 — `main` checked out in worktree A, the lane branch
in worktree B, both commands run from B:

    git symbolic-ref HEAD refs/heads/main   -> exit 0   (no
                                               checked-out-elsewhere guard)
    git add -A && git commit -m "…"         -> exit 0
    main moved:  9e460457… -> fe2f675b…

So an ORDINARY commit made by the lane moves `main`, once one plumbing
ref write has prepared HEAD. That is the same CLASS limit 6 discloses (a
lane rewriting a ref it should not), reached through `HEAD` rather than
through `refs/heads/main`, and the floor is unchanged for the same
reason the card gives: a seat that will do this can `--no-verify`.

**THIS IS NOT CHARGED AGAINST `T-223`'s LANE.** The card PRESCRIBED that
exact sentence in its own build step 1, and `method/tasks/TASK-FORMAT.md`
warns that *a finding is read as a unit* — an executor working from the
ask adopts the proposed remedy. The repair belongs wherever the sentence
is next edited: bind the conclusion to its premise (*"while HEAD names
the lane branch"*), or widen limit 6 from `refs/heads/<integration>` to
any ref write that decides what a commit advances.

## TWO — `T-211`'s card still carries the retracted absolute

At `58c8001`, `docs/tasks/T-211-…-guards-exist.md:29` still reads *"where
`T-212`'s gate reads it, on a ref the lane cannot move"* in its
fast-path-A prose, while that same card's own review notes (item 2)
retract it and point at `T-223`. The LAW itself —
`method/lane-protocol.md`'s fast path A — does NOT carry the absolute; it
says only *"where a legitimate widening lands"*, which is the half that
survives. **So no `method/` edit is owed**, and this is a one-sentence
append in an already-unfenceable file.

Out of `T-223`'s named scope (its card names the hook header and
`T-212`'s card), which is why it was not charged there either.

## TRIAGE, 2026-09-02 — PROMOTED, placement fields written at the seat

Bind the narrowed sentence to its premise (HEAD names the lane branch)
or widen limit 6 to any ref write, measured; append one sentence to
T-211's card, which is docs/tasks and outside every fence. Fence: the
hook alone.

## Implementation notes (executor, 2026-09-09)

Lane `task/T-223-s4-symbolic-ref-absolute`, worktree
`/Users/ujju/Projects/nputer-T-223-s4`, base
`542d94191c514fb30ba86d9dc2b09bdfca311e10` (this card's own dispatch
stamp, which is also `main`'s tip). Fence:
`.claude/hooks/landing-gate.mjs` alone, `docs/tasks` always writable.

### What landed

**`.claude/hooks/landing-gate.mjs` — comment-only, three edits.**

1. **The property paragraph is bound to its premise.** The header now
   opens *"WHILE `HEAD` NAMES THE LANE BRANCH, `<integration>` is the ref
   the lane's own COMMITS cannot move"*, and a new paragraph under it
   says why the clause is not pedantry and carries the measurement below.
   The card offered bind-OR-widen; **both were taken**, because they are
   two halves of one honest statement: the property paragraph is what a
   reader consults to decide how far to trust the gate, and limit 6 is
   where the exception is priced.
2. **Limit 6 is stated over the CLASS.** It read *"A LOCAL REF REWRITE
   MOVES THE FENCE"* and named one command; it now reads *"ANY REF WRITE
   THAT DECIDES WHAT A COMMIT ADVANCES MOVES THE FENCE"* and names two
   measured members — (i) the ref itself (`update-ref`, `T-223`), (ii)
   the ref `HEAD` names (`symbolic-ref`, this card) — each beside the
   PORCELAIN twin that is refused in the same state. The closing sentence
   states what the class wording buys: a limit naming one command reads
   as closed against every command it does not name, and that reading is
   what made (ii) a finding rather than a footnote.
3. **The exoneration paragraph's miniature of the same absolute** —
   *"the two endpoints no lane's commits can write"* — is bound to the
   same premise and points at limit 6.

**T-211's card** (`docs/tasks/T-211-…-guards-exist.md`) — one sentence
appended to review-note **item 2**, which is where that card already
retracts the clause. The struck line in its fast-path-A prose is LEFT
STANDING: a `done` card is a record and this project does not rewrite
records, so the sentence marks it struck where the retraction already
lives, names the surviving property with its premise, and states that
`method/lane-protocol.md`'s fast path A never carried the absolute and
needs no edit — which is the card's own §TWO conclusion, re-derived here
rather than copied (`grep -n "a ref the lane cannot move"
method/lane-protocol.md` -> exit 1, no match).

**`docs/tasks/T-223-s6-*.md`** — a `status: suggested` card for the same
class found in `tools/e2e/tests/landing-gate.spec.ts` (outside this
fence): its comment repeats the now-bound absolute, and no body anywhere
measures limit 6's second member.

### Each clause of the TRIAGE, with its evidence

**TRIAGE clause 1 — "bind the narrowed sentence to its premise (HEAD
names the lane branch) or widen limit 6 to any ref write". MET, both.**
Evidence: the diff at `.claude/hooks/landing-gate.mjs`; the header's
property section now opens with the premise clause and limit 6 now opens
with the class. `node --check .claude/hooks/landing-gate.mjs` -> exit
**0**; the diff has **zero** changed lines outside the module comment
(`git diff -U0 <base> HEAD -- .claude/hooks/landing-gate.mjs | grep -E
'^[+-]' | grep -vE '^(\+\+\+|---)' | grep -vE '^[+-] \*'` returns
nothing).

**TRIAGE clause 2 — "MEASURED in a throwaway repository as the card
measured it". MET.** Script kept at
`<scratch>/measure-T-223-s4.sh`, repository left at
`<scratch>/T-223-s4-measure.o22YrY`. git **2.50.1 (Apple Git-155)**,
**Darwin 25.6.0 arm64**, `main` checked out in worktree A, branch
`task/T-999-lane` in worktree B, every command run from B and every exit
read from `$?` unpiped:

    git checkout main                          -> exit 128
        fatal: 'main' is already used by worktree at '…/A'
    git branch -f main <sha>                   -> exit 128
        fatal: cannot force update the branch 'main' used by worktree …
    CONTROL, HEAD still on the lane branch:
    git add -A && git commit                   -> exit 0 / 0
        main  bf256b47… -> bf256b47…   UNMOVED
        lane  advanced to 7f7a7d9a…
    git symbolic-ref HEAD refs/heads/main      -> exit 0, EMPTY stderr
        HEAD now names refs/heads/main
    git add -A && git commit                   -> exit 0 / 0
        main  bf256b47… -> 168a2dec…   MOVED, by an ORDINARY commit
        task/T-999-lane still at 7f7a7d9a…     (it did not move)
    git show main:ordinary.txt                 -> exit 0
    git symbolic-ref HEAD refs/heads/task/T-999-lane -> exit 0
        (the route closes: four commands, every exit 0, no --no-verify,
         and the lane is back where a push-guard lane arm expects it)

**The control is in the same drill and it is the positive control this
measurement needs**: with `HEAD` left alone the identical `add`/`commit`
pair advances the lane branch and leaves `main` on the byte it started
on. Without it, "an ordinary commit moved main" would be a claim about a
fixture rather than about `HEAD`. The card's own figures were
`9e460457… -> fe2f675b…` in its repository; mine are `bf256b47… ->
168a2dec…` in mine — different shas, same shape, and the reproduction
carries two facts the card did not: the refused PORCELAIN twin
(`git checkout main`, exit 128) that makes the asymmetry the same shape
as `branch -f`/`update-ref`, and the fact that the lane branch does not
move.

**TRIAGE clause 3 — "append one sentence to T-211's card". MET.** One
sentence, appended at review-note item 2. Nothing else in that card is
touched; `git diff --stat` shows **13** insertions and **0** deletions
there.

**TRIAGE clause 4 — "Fence: the hook alone". HELD.** The only non-`docs/
tasks` path in this lane's whole range is `.claude/hooks/landing-gate.mjs`.

### What was NOT taken, and why

`tools/e2e/tests/landing-gate.spec.ts` carries the same absolute in the
leading comment of its *"THE DISCLOSED LIMIT, MEASURED"* body, and no
body measures limit 6's `symbolic-ref` member. That file is OUTSIDE this
lane's fence. **No spec change is OWED** — nothing in the suite reads the
hook's comment text, so a prose-only header change pins nothing (checked:
`grep -rn "landing-gate.mjs" tools/e2e/tests/*.spec.ts` finds one import
and four prose mentions, and the only assertion against the hook's source
is `landing-gate.spec.ts`'s integration-branch constant, untouched here)
— so this was not an ASK, and no ask was raised. Routed as **`T-223-s6`**.

### Ceremony, stated rather than assumed

`method/tasks/TASK-FORMAT.md`'s table row for this diff is **S, diff
outside shipped code** — `.claude/hooks/` and `docs/tasks/` are tooling
and docs, and the rule of thumb is *"docs, method and tooling
self-integrate; anything a user could run does not"* — which gives this
card **no verifier**. The card's own frontmatter says otherwise
(`verifier: claude-opus-5@subagent`, `review: independent`), and the
dispatch declares a verifier is being spawned. **I obeyed the stricter of
the two** and stamped `verifying`: a `done` stamp would strand a verifier
already on its way. The disagreement is recorded here rather than
resolved at this seat.

This lane does **not** hold the integration checkout, so per
`method/lane-protocol.md` rule 6 it merges nothing, checkpoints nothing
and removes nothing; the worktree stands for the verdict.

### Gates, derived from this lane's own diff

Derived against the tree this tip WILL have — the RANGE RULE's own
pre-merge form, `TREE=$(git merge-tree --write-tree $(git rev-parse main)
HEAD)` then `git diff --name-only <main tip> "$TREE"` — over **4** paths:

    .claude/hooks/landing-gate.mjs
    docs/tasks/T-211-fast-paths-…-guards-exist.md
    docs/tasks/T-223-s4-…-struck-one.md
    docs/tasks/T-223-s6-…-two-routes.md

- **GRAPH REGEN — NOT OWED.** Trigger is `*.ts/*.tsx/*.js/*.jsx` or
  `*.rs` outside `docs/`. The one non-docs path is `.mjs`, which none of
  the five suffixes match, and `.supertaskrignore` excludes `/.claude/`
  root-anchored, so the path cannot move the graph by construction
  either. **0 of 4** paths match.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`
  or either manifest. **0 of 4**.
- **DOCS GATE — FIRES.** 3 of 4 paths are under `docs/tasks`, which 12
  named readers across three suites read. Asked rather than predicted:
  `node tools/e2e/scripts/docs-gate.mjs <the 4 literal paths>` -> exit
  **1**, naming `npm test from app/`, `npm test from tools/e2e/` and
  `npx vitest run from lib/parser/`. All three run below.
- **METHOD EVAL GATE — NOT OWED, and the naive derivation of this one is
  WRONG.** Trigger is `method/**`, or a line matching the citation
  grammar under `docs/tasks/`. **0 of 4** paths are under `method/`
  (`git diff --name-only <base> HEAD | grep -c "^method/"` -> **0**).
  **The citation half needs the collector's own pattern and not a
  substring grep**: `tools/method-evals/verdict-digest.mjs`'s `SITE` is
  `/^[ \t]*attack set:[ \t]*sha256:/i` — a citation OPENS a line of its
  own, which is exactly why that file's header says the board writes the
  grammar mid-sentence without citing anything. A substring grep over
  this range answers **1**, and the one hit is THIS SECTION quoting the
  trigger; under `SITE` the answer is **0**
  (`git diff <base> HEAD -- docs/tasks | grep -E "^\+[ \t]*attack
  set:[ \t]*sha256:" | wc -l` -> **0**). Recorded rather than quietly
  corrected, because the substring form is the derivation a reader
  reaches for and it fires this gate on a card that merely names it.

### Suites, in the order run, each exit read from `$?` unpiped

Fresh worktree: nothing was installed and nothing built. Setup in the
ADR-011 order — `npm ci` in `tools/e2e/` (**0**), `npm ci` (**0**) and
`npm run build` (**0**) in `lib/parser/`, then `app/`.

**`npm install` in `app/` FAILED with `EACCES` and it is not a defect.**
The lane fence's read-only mode has every out-of-fence tracked file at
mode `444`, and `npm install` wants to REWRITE `app/package-lock.json`;
`npm ci` installs from the lock without writing it and exits **0**. This
is worth a line because `docs/CONVENTIONS.md`'s "Build and test" block
spells `npm install` for `app/` while `.github/workflows/ci.yml` spells
`npm ci` there — CI never meets the fence, a lane always does.

| # | command | cwd | exit | figures |
|---|---|---|---|---|
| 1 | `npm ci` | `tools/e2e/` | **0** | — |
| 2 | `SUPERTASKR_E2E_PORT=15223 npx playwright test tests/landing-gate.spec.ts` | `tools/e2e/` | **1** | refused at config load: `app/node_modules` missing (`preflight.ts`) |
| 3 | `npm ci` | `lib/parser/` | **0** | — |
| 4 | `npm run build` | `lib/parser/` | **0** | `dist/pure.js` present |
| 5 | `npm install` | `app/` | **243** | `EACCES` on `app/package-lock.json` — the fence, above |
| 6 | `npm ci` | `app/` | **0** | — |
| 7 | `SUPERTASKR_E2E_PORT=15223 npx playwright test tests/landing-gate.spec.ts` | `tools/e2e/` | **0** | **52 passed** |
| 8 | `npm run typecheck` | `tools/e2e/` | **0** | `tsc --noEmit` |
| 9 | `node tools/e2e/scripts/docs-gate.mjs <2 forecast paths>` | root | **1** | FIRES, names three suites |
| 10 | `npx vitest run` | `lib/parser/` | **0** | **389 passed** in 16 files |
| 11 | `npm run build` | `app/` | **0** | — |
| 12 | `npm test` | `app/` | **0** | **1163 passed** in 51 files |
| 13 | `SUPERTASKR_E2E_PORT=15223 npm test` | `tools/e2e/` | **0** | **706 passed** (13.1m) |
| 14 | `npx vitest run` | `lib/parser/` | **0** | **389 passed** — re-run at the final tree |
| 15 | `SUPERTASKR_E2E_PORT=15223 npx playwright test tests/landing-gate.spec.ts` | `tools/e2e/` | **0** | **52 passed** — re-run after the last hook comment edit |

Rows 10, 12 and 13 are the three suites the DOCS GATE named at row 9;
all three are green. Rows 14 and 15 re-run the two suites whose inputs
this lane's last two edits touched — the card set and the hook's text —
so no green in this table is claimed for a tree that is not this one.
The only content written AFTER row 15 is this table and the paragraph
above it, which is card BODY prose: the parser reads frontmatter, and
this card's frontmatter has not changed since row 10.

**PORT DISCIPLINE.** Every suite ran on `SUPERTASKR_E2E_PORT=15223`, this
lane's own. `1420` was read once with the one permitted command —
`lsof -nP -iTCP:1420 -sTCP:LISTEN` at 2026-09-09T00:37:44Z on Mac.lan,
still `node` pid **38601**, the same holder the dispatch recorded — and
never contacted.

### Where the brief was wrong

1. **ROW 4's base is not this lane's base.** The brief names
   `f83f7f13d4741a911c1f71fe6bfc3ba350db1f86` (the newest `Checkpoint:`
   on main). This worktree's HEAD at dispatch, `.supertaskr/lane-fence.json`'s
   `ref`, and `git rev-parse main` are all
   `542d94191c514fb30ba86d9dc2b09bdfca311e10` — this card's own dispatch
   stamp, a non-merge commit later than that checkpoint, which the
   CONVENTIONS dispatch bullet allows. Everything here is derived at
   `542d941`.
2. **The ADVISORY's "the card carries no acceptance criteria" is a
   heading test, not a criteria test.** The card has no `## Acceptance
   criteria` heading and it does carry criteria: its TRIAGE section is
   four clauses, and they are what this lane built against.
3. **ROW 5's lane list was three-quarters right about the count and
   STATE was wrong about it.** Re-read at 2026-09-09T00:16:37Z on
   Mac.lan: **five** lanes live (`T-153-s3`, `T-205-s4`, `T-223-s4`,
   `T-241`, `T-244`), which matches the brief; `docs/STATE.md`'s
   "**THREE LANES ARE LIVE**" is a checkpoint-time claim and the file's
   own instruction is to derive it. Disjointness is unchanged: no other
   live lane names `.claude/hooks/`.
4. **ROW 7 transcribes `npm install` for `app/` and a lane cannot run
   it** — row 5 of the table above. The brief is faithful to
   CONVENTIONS; CONVENTIONS is what is out of step with the fence.

## Verification — APPROVED

Adversarial verification by a seat that did not build this, `claude-opus-5@subagent`,
2026-09-09. **Tip** `7d95dabb84e8cff073cab298400c2474150f01f8`, **base**
`542d94191c514fb30ba86d9dc2b09bdfca311e10`, judged in a bench worktree
detached at that tip (`/Users/ujju/Projects/nputer-V-T-223-s4`; `git symbolic-ref
-q HEAD` exit **1** throughout — this seat never held a branch).

### The sealed inputs, cited so a later reader re-runs one command

attack set: sha256:9ca8810d977341726ede0be5e2f6a5ed30933e4b71fffcb2f0ac4aa6e906eae1 (attack-set-T-223-s4.md)

The ground record taken by the dispatcher at the BASE, before any of this
work was visible: sha256:00cdd4dd2724235c9dae0afe4b4e39e3e027728b9ba96a6608b761b1994ec75a
(ground-T-223-s4.md). Both verified with `shasum -a 256`; both matched on
the first read, so nothing here is judged against a file that moved.

### THE FRAME I ACTUALLY HAD, stated rather than promised

**Phase 1 was its own spawn and it made 0 tool calls — but it was
tool-less BY INSTRUCTION, not by construction, because this harness
cannot deny a spawn its tools.** That is a discipline kept, not a
guarantee held, and a later reader cannot tell the two apart from the
artefact; the attack set's own header records the same thing.

**AND MY PHASE-2 BRIEF CARRIED EXECUTOR-DERIVED SPECIFICS, WHICH IS
PHASE 1 BROKEN ABOVE THE LINE.** It named the diff's **four paths** and
called the hook change **"comment-only"** — both of which are the
executor's claims about its own work, handed to me as if they were
setting. I say so rather than pretend otherwise, and I **re-derived both
from the tree** instead of accepting either:

- the four paths, from `git diff --name-status 542d941..7d95dab`;
- "comment-only", from the file itself and not from the diff's shape —
  the leading block comment ends at line **410** at the base and line
  **466** at the tip, and **everything after it is byte-identical at the
  two refs**, `sha256:bec2545621c626590df02579ab6f2a2ad3314e8bb1d0c262e69eb45b2524459c`
  on both. All four hunks land at base lines 34, 44, 229 and 325, i.e.
  inside that comment. Independently: of the **73 added** and **17
  removed** lines, **0** fail to match `^[+-] \*`. The export surface is
  identical at both refs (**42** symbols, `diff` exit 0).

### The criteria, one by one

The card carries no `## Acceptance criteria` heading; its **TRIAGE** is
the build instruction and it has four clauses.

**1. "Bind the narrowed sentence to its premise (HEAD names the lane
branch) OR widen limit 6 to any ref write." — MET. Both arms taken, and
both are correct.**

The card's own question, asked of the new sentence: *does a reader
holding only this sentence predict exit 0 and main moving?* It does now.
The clause is a **checkable state**, not one of the hedge adverbs the
attack set pre-committed to refusing (`normally`, `ordinarily`, `in
practice`, `directly`, `by itself`) — a reader can run `git symbolic-ref
-q HEAD` and get a yes or a no.

BEFORE (`542d941`, hook line 34):

    * **`<integration>` is the ref the lane's own COMMITS cannot move**
    * (`T-223`). That is the whole of what the paragraph above needs and the

AFTER (`7d95dab`, hook line 34):

    * **WHILE `HEAD` NAMES THE LANE BRANCH, `<integration>` is the ref the
    * lane's own COMMITS cannot move** (`T-223`; the opening clause is
    * `T-223-s4`). That is the whole of what the paragraph above needs and

**It is bound to the RIGHT premise, and that distinction was measured.**
The attack set weighted a precision failure here: *"while the lane branch
is checked out"* would have been the wrong condition, because a detached
HEAD names no branch. The sentence says **`HEAD` NAMES**, not *is checked
out*, and ARM 4 below confirms the case it thereby declines to claim —
a detached commit moves nothing at all, so the sentence is silent exactly
where it should be silent rather than false.

Limit 6, BEFORE (`542d941`, hook line 229):

    * 6. **A LOCAL REF REWRITE MOVES THE FENCE, AND THE LOCAL NAME IS TRIED
    *    FIRST.** `integrationRefCandidates` resolves the bare branch name
    *    ahead of either remote spelling, and `git update-ref
    *    refs/heads/<integration>` is accepted from inside a lane worktree
    *    where `git branch -f` is refused — measured above.

Limit 6, AFTER (`7d95dab`, hook line 267):

    * 6. **ANY REF WRITE THAT DECIDES WHAT A COMMIT ADVANCES MOVES THE
    *    FENCE, AND THE LOCAL NAME IS TRIED FIRST.** The limit is stated
    *    over the CLASS and not over one command, because it WAS written as
    *    one command and a second member was found THE SAME DAY, by this
    *    limit's own verifier (`T-223-s4`, filed at `2561553` against
    *    `33e50b8`).

**The floor argument survives the widening**, which is the half a
widening most easily breaks: it still reads *"each route costs a
deliberate plumbing command that no ordinary lane runs, and the same seat
could `--no-verify` past this hook entirely"* — pluralised from the
base's *"the route costs"*, so the argument was re-stated over the class
rather than left behind on the old singular. `--no-verify` is available
to the same seat on either route, so the reason still follows.

**The LIMITS list is consistent at the tip.** Headings censused at both
refs: **1–7, contiguous, unique, none lost its number**, only limit 6's
text changed. The limit 5 block is **byte-identical** at the two refs,
letters **(a)–(f)** unchanged — **`(g)` was NOT taken**, so there is no
collision with `T-224`'s `(f)` from the same night, and this card added
no lettered residue, which its TRIAGE never asked for.

**A third occurrence was found and bound that the card did not name** —
the exoneration paragraph's miniature, base line 325 *"the two endpoints
no lane's commits can write"*, now *"…can write while `HEAD` names the
lane branch (limit 6, which states the exception over the class)"*.

**2. "Measured." — MET, and it reproduces independently.** Re-run from
scratch in a **throwaway repository under `mktemp`** — never against this
repository's refs — git **2.50.1 (Apple Git-155)**, Darwin **25.6.0
arm64**, `main` in worktree A, `lane` in worktree B, every command from
B, every exit read unpiped. Five arms:

| arm | command | exit | effect |
|---|---|---|---|
| 1 CONTROL | `add`/`commit`, `HEAD` untouched | **0** | lane `e8e9c9ab…`→`686cfacd…`; **`main` UNMOVED** |
| 2 porcelain | `git checkout main` | **128** | `fatal: 'main' is already used by worktree at …` |
| 3 plumbing | `git symbolic-ref HEAD refs/heads/main` | **0** | **empty stderr** (0 bytes); HEAD names `main` |
| 3 plumbing | then an ORDINARY `add`/`commit` | **0** | **`main` MOVED `e8e9c9ab…`→`32ea6055…`; the lane branch STAYED** |
| 4 detached | `checkout --detach`, then `add`/`commit` | **0** | `symbolic-ref -q HEAD` exit **1**; **NO branch moved** |
| 5 limit 6 (i) | `git branch -f main` / `git update-ref refs/heads/main` | **128** / **0** | the porcelain twin refused, the plumbing accepted, empty stderr |

Every factual claim the new prose makes is in that table, including the
two the card itself did not carry — the refused porcelain twin
`git checkout main` and the fact that the lane branch does not move — and
including the **positive control** the header claims runs "in the same
drill". It does, and it decides: with `HEAD` left alone the identical
pair advances the lane branch and leaves `main` on the byte it started
on, so ARM 3 is decided by the `HEAD` write and not by the fixture. The
card's premise stands and the prose built on it is true.

**3. "Append one sentence to T-211's card." — MET.** Exactly **one
sentence** (no internal sentence break), **+13 / −0**, a **single hunk**,
appended to review-note **item 2** — where that card's retraction already
lives — and it **agrees** with item 2 rather than contradicting it.
Nothing else on that card moved: **frontmatter, status and verdict fields
untouched.**

**The struck clause at line 29 is left standing, and I judge that
correct rather than a shortfall.** `T-211` is `status: done`, and
`method/tasks/TASK-FORMAT.md:270` codifies the norm the append invokes —
*"is appended, never rewritten over what is there."* The correction is
visible and quotes the struck clause verbatim, so a reader searching that
card meets it. I record the residual honestly: it is **not adjacent** to
line 29, so a reader who stops inside fast path A still meets the
absolute. Adjacency and the record norm are in genuine tension here and
the human owns that trade; the lane took the side its own project
codified, disclosed the choice in the sentence itself, and that is not a
defect to assign against it.

**4. "Fence: the hook alone." — HELD.** `git diff --name-only
542d941..7d95dab` is **4 paths**, a strict subset of the fence:

    .claude/hooks/landing-gate.mjs                  (in fence)
    docs/tasks/T-211-…-guards-exist.md              (authorised by TRIAGE)
    docs/tasks/T-223-s4-…-struck-one.md             (this card)
    docs/tasks/T-223-s6-…-two-routes.md             (new suggestion card)

`method/` is **byte-identical** at both refs — tree
`619096af3de849d4f976446dc68d335e643fe2a7`, and `lane-protocol.md` blob
`3ea24dbbefba…` — so fast path A was correctly left alone. `tools/e2e/`
has **0** paths changed; `landing-gate.spec.ts` is byte-identical
(`sha256:e56f5b68…`, **52** bodies at both refs). No `docs/CAPABILITIES.md`,
no `docs/STATE.md`.

### The drill — and the finding it produced is NOT a pass

The property this card repairs lives in **data** (prose inside an
executable file), so the mutants are data mutants, per the role's `T-221`
rule. Every landing was read from `git diff`, never from the mutator.

| # | mutant | result |
|---|---|---|
| M7 | stray `*/` inside the header | **KILLED** — `node --check` exit **1** |
| M10 | flip `judgePaths`'s refusal (`? inside : outside` → `? outside : inside`) | **KILLED** — `landing-gate.spec.ts` **31 failed / 21 passed**, exit 1, against a **52 passed** baseline; the mutant **parses** (`node --check` exit 0), so the red is the SPEC talking |
| M1 | delete the new condition clause, restoring the absolute | **SURVIVED** |
| M3 | revert limit 6's widening to the single command | **SURVIVED** |
| M4 | renumber limit 6 to `5.` — list becomes 1,2,3,4,5,**5**,7 | **SURVIVED** |
| M5 | letter collision under limit 5 — `(f)`→`(g)` | **SURVIVED** |
| M6 | mangle limit 6's floor argument | **SURVIVED** |
| M8/M9 | on `T-211`'s card, replace the append with a sentence **contradicting** review-note item 2 and re-asserting the false absolute | **SURVIVED** |

M1, M3, M4, M5 and M6 were applied **together** and the suite still ran
**52 passed, exit 0** — with the absolute restored, limit 6 reverted, the
list carrying a duplicate number, a duplicated letter, and the floor
argument broken. M2 (inverting the condition) is unarmed by the same
construction and is not scored. M8/M9 left the parser suite at **389
passed, exit 0**.

**THE HONEST FINDING, AND I DO NOT SCORE IT AS A PASS: this repair is
enforced by no body.** It is not merely unpinned by accident — it is
unpinnable as the suite currently stands, which I established
mechanically rather than by the mutants alone: `landing-gate.spec.ts`
**imports** the hook as a module (line 31) and **no spec anywhere reads
`landing-gate.mjs` as text** (`readFileSync` scan over `tools/`, `lib/`,
`app/src/`: zero hits for this hook). So no mutation of the header's
prose can red anything, and the two ground-truth greps agree at **both**
refs — `"own COMMITS cannot move"` **0 hits**, `"HEAD names the lane
branch"` **0 hits**, `"limit 6"` **0 hits** in `tools/e2e/tests`.

**What holds this sentence true tomorrow is the next reader, not the
suite.** That is the verdict's answer to its own central question, and
it is a gap in the repository rather than a defect in this lane: the spec
is outside this fence and rule 5 forbids widening from inside, so routing
it was the only move available. The executor routed it (`T-223-s6`) and I
have filed the pin gap separately (`T-223-s7`).

**M10 is the control that makes the "comment-only" claim mean something.**
It is armed differently from M1–M6 — a code mutant against a code-covering
spec — and it shows the spec **would** have caught an executable change at
this site. The spec is green at the tip and the executable residue is
byte-identical, so the claim "this lane changed no behaviour" is measured
from both sides rather than asserted from one.

### Security sweep — clean, and it ran precisely because the diff is 100% comment

A smuggled line hides in exactly this kind of diff, so the sweep was not
skipped. Executable residue byte-identical (`sha256:bec25456…`); export
surface identical (42 symbols); **0** dependency-manifest paths in the
range; **0** hits in the added lines for `child_process`, `execSync`,
`spawnSync`, `exec(`, `new RegExp`, `fetch(`, a URL, `require(` or
`import(`; **0** hits for secrets, keys or tokens; no new input path, no
weakened refusal, no new network or filesystem read. Byte hygiene: **no
BOM**, **no CR**, **0** C0/DEL bytes at either ref; the only non-ASCII the
added lines introduce is `U+2014` and `U+2026`, both already throughout
the header. Mode bits unchanged (`100644`). `node --check` exit **0**;
`npm run typecheck` (tools/e2e) exit **0**.

### Bodies run during verification, each with the ref it was measured at

At the **review tip `7d95dab`**, clean tree, `SUPERTASKR_E2E_PORT=25223`:

| body | exit | count |
|---|---|---|
| `npx playwright test tests/landing-gate.spec.ts` (baseline) | **0** | **52 passed** (40.4s) |
| the same, under M10 | **1** | **31 failed / 21 passed** (38.7s) |
| the same, under the combined data mutant M1+M3+M4+M5+M6 | **0** | **52 passed** (48.8s) |
| `npx vitest run` (lib/parser), under M8/M9 | **0** | **389 passed** / 16 files |
| `npm run typecheck` (tools/e2e) | **0** | `tsc --noEmit` |
| `node --check .claude/hooks/landing-gate.mjs` | **0** | — |
| `node tools/method-evals/run.mjs` | **0** | **10** model-free evals |
| the card's measurement, 5 arms, throwaway repo | — | table above |

Every mutant was restored and the restoration verified by digest, not by
assumption: the hook returns to
`sha256:a6c252ec5e864e9df5e0c74476ef82e7581e367c6248a368d9a1a24f081e58db`
and `git status --porcelain` to **0** paths after each.

### The falsifiers I pre-committed to — none fires

Out-of-fence path: no. `node --check` fails: no. Spec pass or body count
moves: no (52/52, byte-identical). Prose still states a falsified
absolute: no — all three occurrences in the header are bound. Re-run
contradicts the premise: no, it reproduces in five arms. LIMITS list
inconsistent: no. Executable behaviour changed: no, proven twice. T-211's
append contradicts item 2 or alters other fields: no. Security: clean.
Figures unattributed to a ref: no — and the three commits the new prose
cites (`2561553`, `33e50b8`, `4a9aed6`) all resolve to real objects in
this repository.

### ASSIGNED CORRECTIONS: none

Nothing is required of this lane before it merges.

**Recorded and NOT assigned**, so the next reader is not misled: one
added line runs to **88 columns** where the header mostly wraps near 72.
It is cosmetic and it is not a convention breach — the base header
already carries **49** lines over 74 columns and its longest line is
**176** at both refs, unchanged by this diff. No correction is owed.

### Filed as suggestions, never blocking

- **`T-223-s7`** — the hook header's prose and its LIMITS structure are
  enforced by no body, evidenced by M1/M3–M6 above. It carries the
  control's own demonstration, which is this seat's to owe and not the
  next lane's: the check I propose was run against the **base** hook,
  where the binding is absent, and **RED** with both assertions firing;
  against the **tip** it is **GREEN**. It is modelled on a body that
  passes on this board today — `tools/e2e/tests/lane-fence.spec.ts:689`
  pins `lane-fence.mjs`'s header text exactly this way — so the class is
  demonstrated working before it is spent on a file that lacks it.
- **A corroboration appended to `T-223-s6`**, not a fourth card, per
  `method/tasks/TASK-FORMAT.md`'s rule that a second instance of a class
  another card owns is a corroboration: the hook's own exported `ROUTE`
  string — the sentence a REFUSED executor actually reads — still carries
  the same absolute unbound.

