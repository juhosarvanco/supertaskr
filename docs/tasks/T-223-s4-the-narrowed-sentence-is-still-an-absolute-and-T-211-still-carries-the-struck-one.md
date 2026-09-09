---
id: T-223-s4
title: "The narrowed sentence is still an absolute — `git symbolic-ref HEAD refs/heads/main` from a lane worktree exits 0 and an ORDINARY commit then moves main — and T-211's card still carries the struck clause"
status: verifying
feature: F-06
milestone: 4
priority: 4
size: S
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
