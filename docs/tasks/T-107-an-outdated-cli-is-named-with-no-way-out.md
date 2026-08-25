---
id: T-107
title: An unsupported CLI version is diagnosed exactly and offered no way out — the one failure family whose renderer has no action slot
feature: F-03
milestone: 4
priority: 63
size: S
status: building
blocked_by: []
touches: [app-interview]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-070-s1 — files removed in this commit.

Absorbs (eighth triage, 2026-08-25): T-113-s1 — file removed in this
commit. **It is an unrelated one-line correction riding this card
because it shares the fence**, which is how this project ships small
in-fence corrections (the seventh triage did the same twice); it is
listed separately here so no reader mistakes it for part of the CLI
subject above.

- **`visibleDenials`' DOC COMMENT SHALL STOP DESCRIBING A DEFECT THAT NO
  LONGER EXISTS, and it is TWO stale claims rather than one.** In
  `app/src/genesis/interview-model.ts` that comment says the
  `exitNonZero` double report is LIVE and routes the fix to
  **`T-101-s1`** — a file the seventh triage removed when T-113 absorbed
  it. T-113 deleted the runner-side note, so the defect is closed and the
  routing target does not exist. T-113's own last criterion predicted
  this exactly (*"IF the comment's routing sentence goes stale because
  this card lands THEN say so and route the one-line correction rather
  than editing across the fence"*) and routed it here rather than
  widening its own fence. Correct BOTH claims: the report is closed, and
  the citation names T-113 (or nothing) rather than a removed file.

Absorbs: T-082-s4 (sixth triage, 2026-08-20). That file is removed in
this commit.

**Found by T-082's criterion 5, which required enumerating every other
executable command the app renders in a failure path.** The enumeration
turned up no second bad command — and turned up a failure path that
names a fixable problem and offers nothing to fix it with.

`noticeSentence` in `app/src/genesis/InterviewChat.tsx` renders
`unsupportedVersion` as, verbatim at `4d2f03c`:

    the agent CLI reports ${outcome.found}, which is older than this app can drive.

That is a correct, typed diagnosis — `CLAUDE_V1`'s `min_major: 2` in
`app/src-tauri/src/agent/adapter.rs`, verified — **and it is a dead end
in the same shape T-029 exists to prevent elsewhere: the app knows
exactly what is wrong, the user can fix it in one command, and the
screen does not say which command.**

**The gap is structural rather than an oversight.** `unsupportedVersion`
is a `StartOutcome`, not a `TurnError`, so it is not routed through
`failureAction` at all — it reaches `OutcomeNotice` rather than
`FailureBlock`, and `OutcomeNotice` has no `command` slot to fill (all
four symbols verified at `4d2f03c`; `failureAction` lives in
`interview-model.ts` and `FailureBlock` in `interview-turns.tsx`).
**Two families of "this went wrong" have different renderers, and only
one of them can carry an action.**

**The command exists and was read from the CLI's own surface at 2.1.226,
which spawns no turn**: `claude install [target]` (*"Install Claude Code
native build"*) and `claude update|upgrade` (*"Check for updates and
install if available"*). **Which of the two is right depends on how the
user installed** — the observed binary was `/opt/homebrew/bin/claude`,
where `brew upgrade` may be the honest answer instead — **and that is
the open question, not the missing string.** T-082's own lesson applies
directly: an app that guesses an install-manager command it never ran is
the same class of defect one layer over.

Two shapes, neither obviously right:

1. **Give `OutcomeNotice` the same `hint`/`command` structure
   `FailureBlock` has**, and name one command per outcome. Costs a
   second place where the app asserts a command surface it cannot
   verify.
2. **Say what is true and nothing more** — *"nputer needs claude 2 or
   newer; update it however you installed it"* — and route to the
   hand-driven mode, which needs no CLI at all and is already built.

Shape 2 is cheaper and inherits no risk. **The choice is a product
decision, which is why T-082 recorded it rather than building it.**

## Acceptance criteria

- **THE UNSUPPORTED-VERSION NOTICE SHALL OFFER A NEXT STEP THE USER CAN
  TAKE**, and the step SHALL be one the app can honour: a command the
  app has verified, or the hand-driven route that needs no CLI.
- **THE APP SHALL NOT PRINT AN INSTALL-MANAGER COMMAND IT CANNOT
  VERIFY.** IF a command is rendered THEN the card SHALL state how the
  app knows it is the right one for this installation, and IF it cannot
  know THEN shape 2 is the answer and the refusal SHALL be recorded at
  the renderer.
- **THE MINIMUM VERSION SHALL BE NAMED FROM THE ADAPTER, not
  transcribed.** `CLAUDE_V1.min_major` is the authority; a notice
  hard-coding "2" is a second implementation (T-057).
- IF `OutcomeNotice` gains an action slot THEN the two renderers' notion
  of an action SHALL stay ONE shape rather than two — a `hint`/`command`
  pair in two families that drift apart is the defect this card is
  fixing, arrived at from the other side.
- **A BODY SHALL DRIVE THE `unsupportedVersion` OUTCOME AND ASSERT THE
  NEXT STEP IS PRESENT AND REACHABLE** — the route, or the command
  string — rather than asserting the sentence text, which is prose and
  will be reworded.
- **THE OTHER `StartOutcome`/`SendOutcome` ARMS SHALL BE ENUMERATED AND
  RULED ON in one pass**: which of them name a fixable problem with no
  offered fix. `noticeSentence` has ten arms at `4d2f03c`, and this card
  should not leave a sibling behind for the same reason T-082's
  criterion 5 existed. THE ENUMERATION SHALL BE DERIVED FROM THE UNION
  TYPE, not from reading the switch — an arm added later must not escape
  the ruling.
- IF any arm is judged deliberately actionless (`busy`, for instance)
  THEN the decision SHALL be recorded beside it, so "we decided" cannot
  be read as "we forgot".

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated. **NO REAL MODEL CALL, in any suite, for any
reason**; the CLI's command surface is read from `--help`, which spawns
no turn, and **no backtick goes inside a shell string** while doing it —
single-quote a command name or omit it (T-093's absorbed T-082-s3, where
that exact motion started a real turn). POISON DRILL on the new body,
one side only, mutated text read back before the run, restore proved by
sha256 at the drill's own commit. **@human: yes, one look** — the notice
is the screen a user meets when their CLI is too old, and whether the
chosen wording reads as help rather than as a wall is not a headless
question.

## Implementation notes (executor `claude-opus-5` @T-107)

Lane `task/T-107-cli-no-way-out`, worktree
`/Users/ujju/Projects/nputer-T-107`, base **`c4c15c8`**, code commit
**`458237a`**. **NO REAL MODEL CALL WAS MADE, IN ANY SUITE, AT ANY
POINT** — and the CLI was never invoked at all, not even `--help`: every
fact this card needed about `claude`'s command surface was already
recorded in `failureAction`'s T-082 comment and in `adapter.rs`'s
header, so the safest reading of the warning was to not run the binary.
No backtick ever entered a shell string.

### SHAPE 2, AND THE CARD'S OWN WORDING FOR IT CANNOT BE TAKEN AS WRITTEN

Shape 2 was taken, on criterion 2's burden rather than on the card's
recommendation. **The app cannot know which command is right, and the
reason is structural rather than an omission**: `StartOutcome::
UnsupportedVersion { found: String }` carries the `--version` line and
NOTHING ELSE — no resolved path, no manager, no install channel — so
this side cannot even see the `/opt/homebrew/bin/claude` the card
observed. A `claude update` printed under a Homebrew install is T-082's
defect reproduced one layer up, where the shipped `claude login` sent the
word "login" to a model the user could not reach. **The refusal is
recorded twice on purpose**: once beside `noticeRoutesToHandDriven` in
`interview-model.ts`, and once as a comment INSIDE the card's own markup
in `InterviewChat.tsx`, which is what the next editor of that screen
actually opens.

**THE CARD'S SUGGESTED SHAPE-2 SENTENCE CONTRADICTS ITS OWN CRITERION 3
AND IS NOT WHAT SHIPPED.** It reads *"nputer needs claude 2 or newer;
update it however you installed it"* — and criterion 3 says in terms that
*"a notice hard-coding '2' is a second implementation (T-057)"*. Both
cannot hold. Criterion 3 won, because the transcription is the part with
a named failure mode attached. What shipped says the CLI's reported
version (typed, from `found`) and that it is below what the app drives,
which is exactly what this side can derive — no number. **The floor
reaches the frontend through NO channel at all**, verified from both
ends, and the plumbing that would let the notice name it from its
authority is routed as `T-107-s1`.

### WHAT SHIPPED

- **`unsupportedVersion` gets its own card in `OutcomeNotice`**, the
  structural twin of `cliNotFound`'s: the typed `found`, the fix in
  words, the recorded refusal, the project path, and the hand-driven
  route — the one mode that needs no CLI and is already built.
- **`noticeRoutesToHandDriven` in `interview-model.ts` owns the ruling**
  for all thirteen kinds across both unions, **EXHAUSTIVELY**. Its
  `default` assigns to `never`, so an arm added to `StartOutcome` or
  `SendOutcome` later **fails `tsc`** until somebody rules on it. That is
  criterion 6's *"DERIVED FROM THE UNION TYPE, not from reading the
  switch"* mechanized rather than promised, and criterion 7's *"the
  decision SHALL be recorded beside it"* is a comment per arm.
- **NO `hint`/`command` PAIR WAS ADDED ANYWHERE**, so criterion 4's
  antecedent is false and its obligation never arises. What the notice
  family gained is a BOOLEAN over the affordance both renderers already
  shared — `FailureAction.fallback` under the other one. `FailureAction`
  is byte-untouched.
- **The affordance is ONE element with ONE consumer.** `OutcomeNotice`
  computes it once and renders it in all three shapes, the generic notice
  included, so an arm ruled routable later reaches the screen instead of
  quietly doing nothing. The `interview-cli-hand-driven` testid is
  deliberately unchanged: the affordance did not change, and renaming it
  would have moved a pin without moving a behaviour.
- **`visibleDenials`' doc comment (the absorbed T-113-s1)** stops
  describing the `exitNonZero` double report as live and stops routing to
  `T-101-s1`. Both claims were verified stale at the base: `runner.rs`
  carries *"T-113: THE RING NOTE FOR THIS SET IS GONE"* at the
  `unannounced` partition, `denial_names`' own comment says the same, and
  `docs/tasks/T-101-s1*` does not exist. The useful half of the paragraph
  — that no honest rule on THIS side could ever have fixed it — is kept,
  because it is why the fix was the runner's.

### THE ENUMERATION, DERIVED FROM THE UNION TYPES IN `agent-store.ts`

Ten arms in `StartOutcomePayload`, six in `SendOutcomePayload`, **THREE
SHARED** (`busy`, `cliNotFound`, `error`) — **thirteen distinct kinds**.
`noticeSentence` has ten arms and is therefore NOT the enumeration.

| kind | ruling | why |
|---|---|---|
| `cliNotFound` | **routed** | T-029's card, unchanged |
| `unsupportedVersion` | **routed** | this card |
| `busy` | actionless, deliberately | transient and self-clearing; a route here is an escape hatch from a working interview |
| `error` | actionless, deliberately | untyped by construction — no ground for a next step, and inventing one is the guess this card refuses |
| `resumeAvailable` | already actioned | its own block, two buttons |
| `sessionIdRejected` | already actioned | its own block, "Start a fresh session" |
| `nothingToResume` | already actioned | `notStarted` is necessarily true on that path, so "Start the interview" is beside it |
| `noProject` | not this pane's | the fix is a folder, which is the shell's affordance; the hand-driven prompt needs a project too |
| `alreadyPlanned` | not a fault | the folder is DONE; the right half already becomes the board (T-028) |
| `noSession` | **GAP — filed `T-107-s2`** | names the fix in words; its button is gated on `phase === "idle"`, which a refused SEND does not imply |
| `staleProject` | **GAP — filed `T-107-s3`** | names the other project and offers neither way out. NOT routed here: the CLI is not what is wrong |
| `started`, `accepted` | unreachable, ruled anyway | `reduceGenesisOutcome` sets `lastOutcome: null` on exactly these two and every `interview-source.ts` caller sets `ui.notice` only on a non-success answer |

**Two siblings, enumerated and filed rather than built** — the same
disposition T-082's criterion 5 took, which is what produced this card.

### CRITERION 5 IS ROUTED, AND IT IS A DISPATCH DEFECT — `T-107-s4`

**No assertion can be added inside `[app-interview]`.** C-13 declares one
path glob, `app/src/genesis/**`, and it is source-only: `app/test/**` and
`app/vitest.config.ts` are C-05 `app-shell` (held by T-033), and
`tools/e2e/**` is `[tools/e2e]` (held by T-091). `vitest.config.ts` reads
`include: ["test/**/*.test.{ts,tsx}"]`, so a colocated body under
`app/src/genesis/` is not collected by `npm test` AND is compiled into
the app program — worse than no pin. Derived before any code was written,
as the brief asked.

**THE BODY WAS WRITTEN, RUN GREEN AND POISONED ANYWAY**, in the drill, and
`T-107-s4` carries it ready to paste with all four measurements. **And
the mechanism it would pin is already held indirectly**: because the
ruling is one function the renderer reads, flipping its `cliNotFound` arm
reds SEVEN existing bodies. What is unpinned on this tree is the
`unsupportedVersion` arm's own answer and nothing else.

### POISON DRILL — detached `drill-T-107`, outside the repository, at `458237a`

Own installs, own `npm run build`, removed afterwards. Baseline in the
drill **958/958 across 46 files, exit 0**. Every mutation read back with
`git diff` BEFORE its run; every mutation ONE-SIDED (the code under test,
never an assertion and never a literal the two share).

| # | mutation | result | exit |
|---|---|---|---|
| A | `noticeRoutesToHandDriven`'s **`cliNotFound`** arm `true` → `false` | **RED — 7 failed / 951**, 2 files | **1** |
| B0 | candidate body added, unpoisoned (positive control) | 46 passed in file; **959/959** whole suite | **0** |
| B1 | `noticeRoutesToHandDriven`'s **`unsupportedVersion`** arm `true` → `false` | **RED — 1 failed / 45**, on *"the notice offers the one mode that needs no CLI: expected null not to be null"* | **1** |
| B2 | `OutcomeNotice`'s `outcome.kind === "unsupportedVersion"` branch → a kind that never arrives | **RED — 1 failed / 45** | **1** |

Restoration PROVED, not asserted, after every mutant:
`InterviewChat.tsx` `d10f9f74…` and `interview-model.ts` `ef1a8dae…`,
each matching `git show HEAD:<path> | shasum -a 256`, with `git diff`
naming only the drill's own throwaway test file. **The drill's `dist` was
never rebuilt after its baseline**, so T-079's mtime hazard had no
surface, and **the lane worktree was never mutated at all**.

### SUITES AND GATES — every exit off `$?` on the very next token, unpiped, with its count

- **app `npm run build` exit 0** · **app `npm test` exit 0, 958 passed /
  958 across 46 files** — identical to the base, so **no existing body
  moved**, which is the honest reading of an unchanged count here rather
  than a green to be proud of.
- **`npm run lint:tokens` from tools/e2e exit 0**, TOKEN **132** /
  CONTROL **685**. (STATE says 688 at its own ref; CONTROL is
  `git ls-files`, so it is derived here and is not a constant.) **No new
  token was needed** — the card reuses the `status-verifying` family the
  `cliNotFound` card already uses, which is why `app/src/styles/**`
  (C-11, out of fence) never had to be routed.
- **GRAPH REGEN — TRIGGER MATCHES AND THE GATE WAS ASKED RATHER THAN
  PREDICTED.** `cargo run -p nputer-index -- index --check --root ../..`
  is **exit 1, STALE**, and it is a REAL red, not the `--root` false red:
  it prints both counts and a `~` file diff. Committed **920597 bytes ·
  178 files · 1959 symbols · 1878 edges** (T-124's, exactly as the brief
  stated); fresh **921608 bytes · 178 files · 1960 symbols · 1881
  edges** — `+1` symbol (`noticeRoutesToHandDriven`), edges `+5 −2`, two
  files `~`. **92.16% of `max_graph_bytes`, 78 392 bytes of headroom.**
  The regen is the integrator's, at the checkpoint.
- **BOOT GATE — TRIGGER MATCHES (`app/src/**`) AND IT WAS RUN.**
  `NPUTER_BOOT_PORT=15260 npm run boot:check` from tools/e2e, **exit 0**,
  both lines observed: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-107` and `[nputer] window "main"
  created`.
- **DOCS GATE** — fires on the four suggestion files and this card; run
  from the repo root with root-relative arguments and never through
  `xargs`; results below this section.

### PROHIBITIONS, OBSERVED

Port **1420** was read ONCE with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
with nothing else — never bind-probed, never connected. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`. **Its cwd was read
with `lsof -p 88948` and is `/Users/ujju/Projects/nputer-app/app`** — a
different checkout from this lane, which is the CHECKOUT test STATE's
first-reader section says the port test cannot make, applied rather than
quoted. So no install here could reach it, and none was owed anyway.
`/Users/ujju/Projects/nputer-app` was never entered. Scratch port
**15260** was `lsof`-read FIRST (zero rows), then bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` in that order, and was free again
after. No `pkill`, no `cargo clean`, no sibling worktree entered, and the
untracked `z` in the main checkout was not touched. **The main checkout
was not written to at any point** — every command above ran in the lane
worktree or in the detached drill.

### WHERE THIS BRIEF AND THE CARD WERE WRONG

1. **The card's shape-2 wording violates the card's own criterion 3** —
   see above. The contradiction, not a preference, is why the shipped
   sentence names no number.
2. **The brief's lane list was stale by the time it was read**, for the
   ninth checkpoint running. At the base `c4c15c8` it named T-111
   `[app-board]` as LIVE; `git worktree list` during this build shows no
   T-111 entry and main at **`29c0f4f`**, three commits past the base. A
   worktree list is a live-environment fact; derive it.
3. **`/opt/homebrew/bin/claude` is the card's observation and is NOT
   re-verified here.** Nothing in this build read the user's filesystem
   for a binary, deliberately. It does not matter to the outcome: the
   argument for shape 2 is that the PAYLOAD carries no path, so the app
   could not act on that fact even if it were re-confirmed.
4. **Everything else the brief asserted was right**, including the base
   graph figures to the byte, the fence map, and the prediction that a
   pin might have nowhere to live — which is exactly what happened, and
   is filed as `T-107-s4` rather than used as a reason to ship unpinned.

### THE @HUMAN LOOK, NAMED PRECISELY

**Drive `genesis_start` to `unsupportedVersion` and read the card.** The
question is not whether the facts are right — they are typed — but
whether three sentences and a button read as HELP rather than as a WALL.
Specifically: (a) does *"It cannot see how you installed it, though, so
it will not print an update command that might be the wrong one for your
machine — that one is yours"* read as respect or as an excuse? (b) is
**"Show me the prompt"** the right label for a user who came here to fix
their CLI, not to abandon it? (c) should the notice name the minimum
version at all — `T-107-s1` can make that possible, and this build's
position is that "update to the current release" is the more useful
instruction. **The screen is `app/src/genesis/InterviewChat.tsx`'s
`interview-cli-outdated` card.**

### DOCS GATE AND THE THREE SUITES IT OWED

Derived at main **`29c0f4f`** with the RANGE RULE's executor form —
`TREE=$(git merge-tree --write-tree "$MAIN" HEAD)` read off `$?` FIRST at
**exit 0**, tree `2df35a2e…` — then
`git diff --name-only "$MAIN" "$TREE"`, **7 paths**: the two source files
and five under `docs/tasks/`. Fed to the gate DIRECTLY from the repo
root, root-relative, **never through `xargs`**.

**DOCS GATE exit 1 — FIRES on 5 of 7, THREE suites owed.** It reports
**12 derived readers across 4 suites**, a census of **130** docs-shaped
sites in 22 files, **0 frontmatter issues** in the live tree, and closes
with *"every live task card's frontmatter parses, with a legal status"* —
which is this card's own `building` stamp and the four new
`suggested` files checked rather than assumed. **`cargo test from
app/src-tauri/` is NOT owed** and that is derived: this diff carries no
`docs/CONVENTIONS.md`, no `docs/architecture/components`, and no capture
under `docs/research/`, which are the three things its readers resolve.

| suite | result | exit |
|---|---|---|
| `npm test` from app/ | **958 passed / 958 across 46 files** | **0** |
| `npx vitest run` from lib/parser/ | **264 passed / 264 across 12 files** | **0** |
| `npm test` from tools/e2e/ | **146 passed / 146** | **0** |

**THE E2E SUITE TOOK TWO RUNS AND BOTH ARE DECLARED — THE FIRST WAS
`T-120-s3`, NOT THIS LANE.** Run 1 on scratch port **15261** was
**145 passed / 1 failed, exit 1**, at
`tools/e2e/tests/token-scan.spec.ts:201`, and the failure carries that
finding's exact documented signature: `Expected: 1787655727948.6855`
against `Received: 1787655727949` — an unrounded float compared against
a timestamp that went out through a `Date` and came back rounded to a
whole millisecond. STATE predicts it *"RED EXACTLY ONCE IN EVERY FRESH
CHECKOUT, THEN GREEN FOREVER AFTER"*, and this lane is a fresh worktree
with a fresh `npm ci`. Run 2 on scratch port **15262** was **146/146,
exit 0**. **The second run proves nothing about the defect** — the
`utimesSync` in the body's own `finally` repairs the condition that
caused it — but it answers the only question this gate asks, which is
whether THIS diff reds that suite. It does not: the failing body is the
token lint's P6 pattern over a fixture, and nothing in this diff is on
any path it reads. **`T-120-s3` remains unfixed and is still the first
item under STATE's "Next up".**

Scratch ports **15260** (boot gate), **15261** and **15262** were each
`lsof`-read FIRST (zero rows), then bind-confirmed free on `127.0.0.1`,
`0.0.0.0`, `::1` and `::` in that order and never the reverse, and all
three were free again afterwards. Port **1420** was read once and never
touched.

**ONE PROCESS OBSERVATION, BECAUSE IT TOUCHED A RECORDED MEASUREMENT'S
PROVENANCE.** A helper this session wrote into its own agent scratch
directory to bind-probe ports was, later in the same session, found
REPLACED by a functionally equivalent script it did not write (different
output format, different comment text, a newer mtime). The answer both
gave agreed with `lsof` in every case, so no port decision moved — but
the 15261 probe was re-derived inline, self-authored, before being
recorded above. **Nothing was written into the repository at any point**;
this is about the scratch directory outside it, which STATE already
records as shared. Worth knowing before another session trusts a scratch
file by name.

## Verdicts

### 2026-08-25 — `claude-opus-5 @T-107-verify` — **APPROVED**

**WHY THIS PASS EXISTS, AND WHY THAT SHAPES THE VERDICT.** This is the
first card to invoke @human's 2026-08-25 rule that a size-S card touching
SHIPPED CODE gets a verifier. It was asked for on two grounds, and the
second is the one that matters: **criterion 5's pin could not ship, so
nothing on the tree holds the new arm's own answer.** This pass is the
compensating control for that missing pin, and everything below is
written so the next reader does not have to take the gap on report.

**THE BOUNDED READ IS DECLARED.** The spec was read at the base ref
(`git show c4c15c8:docs/tasks/T-107-…md`) and the attack was FORMED AND
RUN from it alone — all three poison mutants, the exhaustiveness probe,
the fence positive control and the security sweep were designed and
executed before the lane's notes were opened. The notes were read
afterwards only to check the EVIDENCE half, and every figure they carry
was re-derived here rather than quoted. Verified in a detached worktree
`/Users/ujju/Projects/drill-T-107-verify` at `55909bb`, **outside** the
repository, with its own installs; **the lane worktree was never entered
for any measurement** and no build, test or install ran in it.

#### The ranges, at my own ref, every dot count stated

Main moved twice under this pass (`29c0f4f` → `765924d`). **Derived at
both, and the path SET is identical at both** — checked with `diff` over
sorted lists, never with counts.

    git merge-tree --write-tree 29c0f4f 55909bb -> 4ec4f34a…, exit 0 (read off $? FIRST)
    git diff --name-only 29c0f4f <TREE>          ->  7   THE PRESCRIBED PRE-MERGE FORM
    git merge-tree --write-tree 765924d 55909bb -> 1a0260cb…, exit 0   (re-derived after main moved)
    git diff --name-only 765924d <TREE2>         ->  7   SAME SET — `diff` over sorted lists EMPTY
    git diff --name-only c4c15c8..55909bb        ->  7   branch-only, TWO dots from the card's base
    git diff --name-only c4c15c8..29c0f4f        ->  4   main's advance
    git diff --name-only c4c15c8...55909bb       ->  7   THREE dots — AGREES, SIXTH MERGE RUNNING
    git diff --name-only 29c0f4f..55909bb        -> 11   TWO dots, FORBIDDEN

**The forbidden two-dot form overstates by 4 paths — 1.57x — and it is
pure left-endpoint drift.** Main advanced **4** (T-111's card and its
three suggestion files), the branch **7**, `comm -12` over the sorted
lists is **EMPTY**, and 4 + 7 = 11, the arithmetic that proves the sets
disjoint. The three-dot form returned the right answer for the sixth
merge running, **and that is recorded as a hazard rather than a habit**:
it agrees only while the two path sets stay disjoint, and T-124's warning
is unchanged.

#### THE CRITERION-3 CONTRADICTION — MY INDEPENDENT RULING

**The card contradicts itself and the lane picked the right side.** The
suggested shape-2 wording is *"nputer needs claude 2 or newer; update it
however you installed it"* — which hard-codes the very "2" that criterion
3 calls a second implementation. Both cannot hold.

I ruled this from the criterion's own text before reading the lane's
argument, and I reach the same answer by a different route. Criterion 3
is one prohibition with a positive gloss attached. The prohibition has a
NAMED failure mode (T-057: a rule with two implementations is two chances
to disagree). The positive gloss — *"named FROM THE ADAPTER"* — is
**UNSATISFIABLE AT THIS COMMIT IN ANY FENCE**, and that is derived rather
than accepted on report:

- `grep -rn "min_major|minMajor" app/src/` returns **exactly one row**,
  and it is inside this card's own new doc comment. No code path carries
  the number.
- Rust-side `min_major` appears in **four** places only —
  `adapter.rs:37` (the field), `adapter.rs:111` (`= 2`),
  `adapter.rs:1695` (a unit assert) and `runner.rs:830` (the comparison).
  **It is serialized to the webview nowhere.**
- `StartOutcomePayload.unsupportedVersion` carries `found: string` and
  nothing else; `GenesisStatusPayload` carries `cliVersion` and no floor.

So the only available way to "name" the minimum is to transcribe it, and
transcribing it is the one act the criterion names as the defect. **A
criterion cannot be discharged by committing the defect it cites by
name.** The prohibition is what survives.

**AND THE DISCRIMINATING TEST IS NOT "DID IT SAY THE NUMBER" BUT "DOES
THE SHIPPED SCREEN CREATE THE DEFECT THE CRITERION EXISTS TO PREVENT".**
It creates **zero** implementations of that number. The notice cannot
disagree with `CLAUDE_V1.min_major` because it makes no claim about the
floor at all — the failure mode is not merely avoided, it is made
structurally impossible. What is lost is user information, which is a
PRODUCT cost, not a T-057 correctness cost, and it is routed as
`T-107-s1` and deposited into the @human look. **The ruling holds.**

**WHERE THE LANE'S OWN WORDING IS TOO GENEROUS, AND THIS IS A CORRECTION
TO THE RECORD RATHER THAN A FAILURE.** The notes head that paragraph *"THE
MINIMUM VERSION IS NOT NAMED, AND THAT IS CRITERION 3 SATISFIED RATHER
THAN DODGED."* The honest description is narrower and the lane's own
vocabulary already has the right word for it: **criterion 3's PROHIBITION
is met, and its POSITIVE OBLIGATION is ROUTED to `T-107-s1`** — exactly
the disposition the same notes describe plainly for criterion 5
("CRITERION 5 IS ROUTED"). Two identical acts are described with two
different words. Nothing downstream reads either adjective, the routing
card exists and is correct, and the code and comments say the true thing;
this is recorded beside the claim rather than being cause to reject.

#### THE MISSING PIN — VERIFIED UNBUILDABLE IN FENCE BY POSITIVE CONTROL

The lane's claim was **not** accepted from the config. It was tested,
with a deliberately RED body placed inside the fence's own glob
(`app/src/genesis/drill-T-107-verify-probe.test.ts`), by the T-111
method:

| arm | what was run | result |
|---|---|---|
| **A** | the SHIPPED collector, `npm test` from app/, with the red body colocated in `app/src/genesis/` | **exit 0, 958 passed / 46 files** — the body is INVISIBLE; the only mention of it in the whole log is the `RUN v3.2.7` header path |
| **B** | the same body under a collector that CAN see `src/genesis/**` | **exit 1, 1 failed / 1** — `AssertionError: expected true to be false` |
| **C** | a TYPE error introduced into the colocated body, then `npm run build` | **exit 2** — `src/genesis/drill-T-107-verify-probe.test.ts(8,11): error TS2322` |
| **D** | `grep` for the body's text over the built `app/dist/` | **no rows** |

**Arm A ↔ arm B is the whole finding: the green was INVISIBILITY, not
vacuity.** The identical body reds the moment a collector can reach it.
Arm C proves the second half of the lane's claim positively — a colocated
body IS inside the program bare `tsc` compiles, because `app/tsconfig.json`
includes `"src"` — so the file would be a test nothing runs while still
gating the shipped build. **Arm D refines the lane's phrasing**: it is the
TYPECHECK program, not the emitted bundle; vite never reaches an
unreferenced module. *"Compiled into the app program"* is right;
*"shipped in the binary"* would not have been, and nobody claimed it.

The registry half is confirmed independently: **C-13 declares one glob,
`app/src/genesis/**`, source-only**, while `app/test/**` AND
`app/vitest.config.ts` are both **C-05, `touch_slugs: [app-shell]`** —
held by T-033 at dispatch and still held. `vitest.config.ts` reads
`include: ["test/**/*.test.{ts,tsx}"]`. **The fence is real and the
dispatch defect is real.** `T-107-s4` is correctly filed.

#### THE ROUTED BODY REDS — CHECKED, NOT TRUSTED

A routed pin nobody can run is worth only as much as its measurement, so
the body in `T-107-s4` was pasted into
`app/test/interview-chat-dom.test.tsx` in the drill and driven both ways.
**Every figure below reproduces the lane's exactly.**

| run | result | exit |
|---|---|---|
| the file with the body, unpoisoned | **46 passed (46)**, 45 before | **0** |
| the whole app suite with the body | **959 passed / 46 files**, 958 without | **0** |
| `npm run build` with the body | — | **0** |
| poison: `noticeRoutesToHandDriven`'s `unsupportedVersion` arm `true`→`false` | **1 failed / 45**, on *"the notice offers the one mode that needs no CLI: expected null not to be null"* | **1** |
| poison (MINE, renderer side): `{handDriven}` deleted from the `interview-cli-outdated` block | **1 failed / 45**, same assertion | **1** |

#### THE MECHANISM IS HELD; THE NEW ARM'S OWN ANSWER IS NOT

Reproduced against the SHIPPED tree, with no body added:

| # | one-sided mutation of the code under test | result | exit |
|---|---|---|---|
| **1** | `noticeRoutesToHandDriven`'s **`cliNotFound`** arm `true`→`false` | **RED — 7 failed / 951, 2 files** (`interview-chat-dom.test.tsx` 1, `interview-resume-dom.test.tsx` 6) | **1** |
| **2** | `noticeRoutesToHandDriven`'s **`unsupportedVersion`** arm `true`→`false` | **GREEN — 958/958**, build exit 0 | **0** |
| **3** | `{handDriven}` deleted from the `interview-cli-outdated` block | **GREEN — 958/958**, build exit 0 | **0** |

**The lane's "7 across 2 files" reproduces exactly**, so the ruling
function is genuinely load-bearing and genuinely pinned — by its SIBLING
arm. **Mutants 2 and 3 are the gap stated at its worst**: deleting the
entire behaviour this card exists to add, from either side, leaves the
tree fully green. A corroborating census: `unsupportedVersion` appears in
`app/test/**` and `tools/e2e/**` **exactly once**, at
`tools/e2e/tests/shell-harness.ts:202`, and that is a TYPE MIRROR in a
payload union, not an assertion.

**WHY THIS IS NOT A REJECTION.** A REJECTED verdict must be actionable by
the lane it is handed to, and this one would not be: the pin could not
have shipped without breaking a fence held by another live lane, and
breaking a fence is the worse offence (T-101's precedent — a fence
deliberately NOT widened and a disclosed defect that ships). The executor
did every available thing instead: wrote the body, ran it green, poisoned
it twice, filed it ready-to-paste with two dispositions and the
neighbouring `T-110-s9` collision named. **The behaviour is verified — by
this pass's own run of that body, green then red twice — even though
nothing on the tree holds it.** That measurement is the compensating
control, and it now lives here rather than in a removed drill.

Every mutation above was ONE-SIDED (producer only, never an assertion and
never a literal the two share), read back with `git diff` BEFORE its run,
and restored with sha256 proof:
`interview-model.ts` **`ef1a8daed6e0127ea68b84713043169679a799e09d11933cdcd9ddfdeb12827d`**,
`InterviewChat.tsx` **`d10f9f74351c53f48d2dee62f5a75ff9522ed6383fa65cb354963e3230d424d3`**,
`interview-chat-dom.test.tsx` **`e73ecd952aff672aa1121e96329ca1e738730091209ad35f2f8398464dd2a1b0`**,
`agent-store.ts` **`f2232cc27a552180d5a405a6c3f5a7bfe2f7e8f74a84f5a3f461a2cdefc09a9e`**,
each identical before and after, with `git status --porcelain` **empty**
at the end of every drill. **Nothing was trusted from the shared agent
scratch directory by name** — the lane's warning was heeded and the port
bind-probe was re-derived inline in this pass.

#### EVERY CRITERION, AND HOW IT WAS ATTACKED

1. **Next step present AND one the app can honour — MET, and the
   "honour" half is stronger than the card asked.** Attacked by asking
   whether the offered route can dead-end. `agent::kickoff` calls
   `resolve_cli` **nowhere** — verified by grep: `resolve_cli` appears at
   `mod.rs:370, 498, 585, 815` and `kickoff` is at `746`. Its one refusal
   arm is `AlreadyPlanned`, and **that arm is unreachable from this
   screen**: all three doors that can return `UnsupportedVersion`
   (`start_genesis`, `resume_genesis`, `fresh_genesis`) run
   `routes_to_genesis`/`has_plan` at `308`, `477` and `580` — BEFORE
   `resolve_cli` at `370`, `498`, `585`. A planned folder answers
   `AlreadyPlanned` and never reaches the version probe, so the two
   outcomes are mutually exclusive at the same instant. The residual race
   renders honestly (`renders a typed non-ready kickoff as itself rather
   than as a blank block`, `interview-resume-dom.test.tsx:749`).
2. **No unverifiable install-manager command — MET, and the refusal IS at
   the renderer.** Attacked by grepping every added line for a command
   surface: `git diff … | grep '^+'` for `claude install|claude update|
   claude upgrade|brew|npm i|apt|pnpm|yarn` returns **zero rows**, and
   the routed body asserts the same thing as a CLASS over verbs. The
   card's demand that *"the refusal SHALL be recorded at the renderer"*
   is met literally — the comment sits INSIDE the JSX of the
   `interview-cli-outdated` block, which is what the next editor opens,
   and again beside the ruling in `interview-model.ts`.
   **ONE OBSERVATION, NOT A FAILURE:** the sentence *"updating yours to
   its current release is the fix"* is a DIRECTION, not a command — no
   string on that screen is executable, which is the letter and the
   spirit of a criterion whose named failure is a pasteable `claude
   login`. It is deposited into the @human look rather than ruled on
   here, because it is a wording question.
3. **Minimum named from the adapter — PROHIBITION MET, POSITIVE
   OBLIGATION ROUTED.** Ruled above at length.
4. **One shape across the two renderers — MET, and vacuously so.**
   Attacked by checking whether a second `hint`/`command` pair appeared.
   `FailureAction` is **byte-untouched**: the diff's only three hunks are
   the import list, a new function at `+718`, and the `visibleDenials`
   doc comment at `+978`; `FailureAction` is at line 633 and every `+`
   line mentioning it is prose inside the new comment. The antecedent is
   false, so the obligation never arises — and what the notice family
   gained is a BOOLEAN over the affordance both renderers already shared
   (`FailureAction.fallback`), which is the honest reading of the
   criterion rather than a dodge of it.
5. **A body driving `unsupportedVersion` — NOT MET ON THE TREE.**
   Positively controlled above, both that it is missing and that it could
   not have been added inside the fence. Routed as `T-107-s4`.
6. **Enumeration derived from the union type — MET, AND ITS TEETH WERE
   TESTED BY ADDING AN ARM, WHICH IS THE ONLY WAY TO KNOW.** I derived
   the union independently from `agent-store.ts:99-123` and `190-196`:
   **10 arms in `StartOutcomePayload`, 6 in `SendOutcomePayload`, 3
   shared (`busy`, `cliNotFound`, `error`) — 13 distinct kinds**, and
   `noticeRoutesToHandDriven` carries all 13. `noticeSentence` has
   **10** case arms plus a degrading `default`, so it is a strict SUBSET
   and is correctly disclaimed as not the enumeration. Then the guard was
   made to fire, twice, one union at a time:

       + | { kind: "verifierProbeArm"; quotaResetAtMs: number }   // into SendOutcomePayload
       npm run build -> exit 2
       src/genesis/interview-model.ts(878,13): error TS2322: Type '{ kind: "verifierProbeArm"; … }' is not assignable to type 'never'.

       + | { kind: "verifierStartArm"; detail: string }            // into StartOutcomePayload
       npx tsc --noEmit -> exit 2
       src/genesis/interview-model.ts(878,13): error TS2322: Type '{ kind: "verifierStartArm"; … }' is not assignable to type 'never'.

   **A compile-time exhaustiveness guard that does not actually fail is
   criterion 6 unmet; this one fails, from either union, at the build the
   project gates on.** And note what did NOT error in either run:
   `noticeSentence` compiled clean both times, which is the same fact
   from the other side — the sentence is not the enumeration and the
   ruling is.
7. **Actionless arms recorded beside themselves — MET.** All 11
   non-routed arms carry a per-arm reason in the switch. Spot-attacked
   the two that could have been hand-waved: `nothingToResume` claims
   `notStarted` is necessarily true on that path — `notStarted` is
   `phase === "idle" && turns.length === 0` (`InterviewChat.tsx:115`) and
   the resume raced the registry with nothing started, so it holds;
   `started`/`accepted` claim unreachability via `reduceGenesisOutcome`
   setting `lastOutcome: null`, and ruling on an unreachable arm anyway
   is the right call, because an omitted arm is indistinguishable from a
   forgotten one.

**THE TWO GAPS FILED RATHER THAN BUILT — FILING WAS RIGHT, AND I CHECKED
BOTH FOR IN-SCOPE-NESS RATHER THAN DEFERRING.** Criterion 6 demands the
siblings be *"ENUMERATED AND RULED ON"*, not fixed. `T-107-s2`'s premise
verifies: `notStarted` requires `phase === "idle"`, and a SEND refused
with `noSession` can leave the phase at `failed`, so the button really can
be absent while the words say "start the interview first" — but the fix
is a change to when the Start affordance is offered, which is a second
product decision. `T-107-s3`'s fix is either a shell affordance (reopen a
folder) or a fresh-start door — also a second decision, and neither is
about a CLI. **Neither belonged in this card's scope**, and the precedent
is this card's own genesis: T-082 recorded rather than built, which is
what produced T-107.

#### SECURITY SWEEP — MANDATORY, AND THE ANSWER IS CLEAN

This renders text from a CLI's `--version` output into the DOM, so the
sweep was run as a first-class pass and not as a formality.

- **TEXT NODE ONLY, NO MARKUP, NO ATTRIBUTE, NO URL.** `outcome.found`
  reaches the page at exactly one site, `InterviewChat.tsx:732`, as a
  bare JSX child `{outcome.found}` inside a `<span>` whose every
  attribute is a static literal. React escapes text children. The whole
  of `app/src/` contains **zero** occurrences of
  `dangerouslySetInnerHTML`, `innerHTML` or `__html`, and the added lines
  contain **zero** `href`, `src=`, `url(`, `eval(`, `new Function`,
  `setAttribute`, `window.open` or `location`. The generic notice's one
  dynamic attribute is `data-outcome-kind={outcome.kind}`, a union
  literal, not free text.
- **THE PAYLOAD CARRIES NO FILESYSTEM PATH, AND THAT IS THE LOAD-BEARING
  ONE**, because the whole shape-2 argument rests on it. Traced to the
  source: `agent/mod.rs:75` declares `UnsupportedVersion { found: String }`;
  the three constructors at `374`, `502`, `589` pass through
  `ResolveError::Unsupported { found }`; that is built at
  `runner.rs:831` as `found: line.clone()`, where `line` is
  `probe_version`'s return — `output.stdout.lines().next()?.trim()`,
  **the first line of `--version` and nothing else**. No resolved path,
  no manager, no channel, and the resolved `path` is deliberately left
  behind in `ResolvedCli`. The lane's argument stands on the code.
- **THE INPUT SURFACE IS NOT WIDENED BY ONE BYTE.** `outcome.found` was
  ALREADY rendered to this screen before this card, by `noticeSentence`'s
  `unsupportedVersion` arm at `4d2f03c`. The diff moves the same typed
  field into a different element. Its bound is unchanged and inherited:
  `probe_version` reads through `handle.take(MAX_LINE_BYTES)`,
  `runner.rs:66` = 1 MiB — a large bound for a DOM text node, but
  **pre-existing, shared with `error.message` and `cliNotFound.probed`,
  and not this card's to move.**
- **No new IPC command, no new endpoint, no authz surface.**
  `noticeRoutesToHandDriven` is a pure total function; the button invokes
  the already-permitted `genesis_kickoff`.
- **No dependency added** — the diff touches no `package.json`,
  `package-lock.json`, `Cargo.toml` or `Cargo.lock`. **No secret, key or
  token in the diff.** No unsafe default: the new arm's failure mode is
  to offer nothing, never to offer something wrong.

**Nothing here is REJECTED-level. Nothing here is even suggestion-level.**

#### SUITES — every exit off `$?` on the very next token, unpiped, with its COUNT

- **app: `npm run build` exit 0** · **`npm test` exit 0, 958 passed / 958
  across 46 files** — identical to main's reference, which is the honest
  reading that **no existing body moved** and, jointly with mutants 2 and
  3, that no new body was added.
- **parser: `npx vitest run` exit 0, 264 passed / 264 across 12 files.**
- **cargo: exit 0, 455 passed / 0 failed / 3 ignored**, summed over
  **SIXTEEN** `test result:` lines — main's reference exactly. **The lib
  line finished in 3.99s**, inside STATE's green band (every green under
  9.5s, every red over 14.6s), which is the fresh-target-dir prediction
  holding: this drill worktree has its own small `target/`. Neither
  `docs_watch::tests::startup_arm_watches_the_initial_root` nor
  `a_hostile_session_id_in_the_init_line…` fired. **`cargo clean` was not
  run and main's target directory was not touched.**
- **E2E — BOTH RUNS DECLARED, NEITHER DISCARDED.** Run 1 on scratch port
  **15270**: **exit 1, 145 passed / 1 failed**, and the failing body is
  `tools/e2e/tests/token-scan.spec.ts:201` — `T-120-s3`, exactly where
  STATE predicts it in a fresh checkout. Run 2 on **15271**: **exit 0,
  146/146**. **The second run proves nothing about the defect** — the
  `utimesSync` in the body's own `finally` repairs the condition — but it
  answers the only question this gate asks, and nothing in this diff is
  on any path that spec reads. `T-120-s3` remains unfixed and is still
  the first item under STATE's "Next up", for the sixth checkpoint.
- **tools/e2e `npm run typecheck` exit 0.**
- **tools/e2e `npm run lint:tokens` exit 0** at **TOKEN 132 / CONTROL
  689**. The lane recorded 685 at its code commit `458237a` and STATE
  records 688 at its own ref; the corpus is `git ls-files`, and the four
  suggestion files this branch adds account for the difference exactly.
  **Derive it at your own ref; it is not a constant.**
- **tools/e2e `npm run lint:docs` exit 0** (the whole-tree census half).

#### GATES — each derived with its own path count over the 7

| gate | trigger | on these 7 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/tsx/js/jsx` or `*.rs` outside `docs/` | **2 — FIRES** | exit **1, STALE** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** | exit **0** |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES** | exit **1** |

- **GRAPH REGEN — exit 1, and it is a REAL stale, not the `--root` false
  red** (it prints both counts and a `~` file diff). Committed **920 597
  bytes · 178 files · 1959 symbols · 1878 edges** → fresh **921 608 ·
  178 · 1960 · 1881**: **+1 symbol** (`noticeRoutesToHandDriven`), edges
  **+5 −2**, two files `~`. **921 608 of `max_graph_bytes` 1 000 000 =
  92.16%, with 78 392 bytes of headroom** — the highest this repository
  has been, and still nothing reports it. Every lane figure reproduces.
  **The regen itself is the integrator's, at the checkpoint.**
- **BOOT GATE — exit 0**, `NPUTER_BOOT_PORT=15272 npm run boot:check`
  from tools/e2e in the drill worktree, **both `[nputer]` lines
  observed**: `[nputer] project folder: /Users/ujju/Projects/drill-T-107-verify`
  and `[nputer] window "main" created`. Captured process group **60650**,
  stopped by SIGTERM, no orphan.
- **DOCS GATE — exit 1, FIRES on 5 paths, THREE suites owed** (`npm test
  from app/`, `npm test from tools/e2e/`, `npx vitest run from
  lib/parser/`), all three run and green above. Invoked from the repo
  root with ROOT-RELATIVE arguments and **never through `xargs`**, in the
  one documented spelling. It reports **12 derived docs readers across 4
  suites**, a census of **130 docs-shaped sites in 22 files**, 2
  package-relative sites both resolving into `docs/`, 6 root-anchored
  files argued in `ROOT_ANCHOR_LEDGER`, and **0 frontmatter issues** —
  every live card parses with a legal status. **`cargo test` is NOT owed
  on this diff**, because no `docs/CONVENTIONS.md` path is in it; it was
  run anyway and is green.

#### THE @HUMAN LOOK, RESTATED PRECISELY

**One look is owed and this pass cannot discharge it.** No screen control
was used and none should be: the question is not whether the facts are
right — they are typed, and every one of them is verified above — but
whether the screen reads as HELP rather than as a WALL.

**WHAT TO OPEN:** the `interview-cli-outdated` card in
`app/src/genesis/InterviewChat.tsx`, reached by starting an interview
with an agent CLI whose `--version` reports a major below
`CLAUDE_V1.min_major` (currently 2). It renders: a heading, the reported
version in mono, a stated refusal to guess an update command, a sentence
offering the hand-driven route, the project path, and a **"Show me the
prompt"** button.

**THE FOUR QUESTIONS, in the order they will bite:**

1. Does *"It cannot see how you installed it, though, so it will not
   print an update command that might be the wrong one for your machine —
   that one is yours"* read as **respect** or as an **excuse**?
2. Is **"Show me the prompt"** the right label for someone who came to
   fix their CLI rather than to abandon it? The testid was deliberately
   left unchanged because the affordance did not change — **the LABEL is
   still open.**
3. **Should the notice name the minimum version at all?** `T-107-s1` is
   what makes that possible; this build's position is that *"update to
   the current release"* is more useful than a number. **This is the
   product half of the criterion-3 ruling above and it is @human's to
   settle, not a lane's.**
4. **NEW, ADDED BY THIS PASS:** *"updating yours to its current release
   is the fix"* is an assertion the app cannot verify either — it is not
   a COMMAND, so it clears criterion 2, but it is the same class of claim
   one notch softer. Is that the right place to draw the line?

#### WHERE THE BRIEF AND THE CARD WERE WRONG

- **THE CARD CONTRADICTS ITSELF**, criterion 3 against its own suggested
  shape-2 wording. Ruled above. This is the card's defect, not the
  build's, and the build resolved it correctly.
- **THE CARD'S VERIFICATION LINE ASKS FOR A POISON DRILL "ON THE NEW
  BODY"** while its own fence makes a new body impossible. The two
  instructions are jointly unsatisfiable and the executor could not have
  obeyed both. It did the reachable thing (drill the body in a throwaway
  worktree, file it) and this pass re-ran that drill from the outside.
- **THE BRIEF'S `29c0f4f` WENT STALE MID-PASS.** Main advanced to
  `765924d` (T-086 merged, plus a T-104 ruling) while this verification
  ran. The path SET is identical at both refs, so nothing moved — but
  this is the ninth consecutive record of a brief's ref being true when
  written and false when used. **Re-derive; never quote a ref.**
- **THE BRIEF SAYS "the three-dot form has agreed FIVE merges running".**
  At my ref it is **six**, counting this one — a running tally in a brief
  is stale by construction, and the warning attached to it is what
  matters and is unchanged.
- **THE LANE'S "compiled into the app program"** is right about the
  typecheck program and would be wrong about the emitted bundle. Arm D
  measured the distinction; the lane did not claim the stronger thing.
- **THE LANE'S CONTROL FIGURE OF 685** is not wrong, it is at a different
  commit; mine is **689** at the tip. Neither is a constant.
- **THE BRIEF'S "DOCS GATE 5 of 7" AND EVERY REGEN FIGURE REPRODUCED
  EXACTLY**, as did "7 existing bodies across 2 files". Recorded because
  a verifier that only reports discrepancies is not reporting.

#### PROHIBITIONS OBSERVED

**NO REAL MODEL CALL AND NO CLI SPAWN, AT ANY POINT, FOR ANY REASON** —
the binary was never invoked, not even `--help`; every fact about
`claude`'s surface came from `adapter.rs`, `runner.rs` and the existing
T-082 comment. **No backtick ever entered a shell string.** No screen
control. Port **1420** was read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else — holder `node` pid
**88948**, one socket `TCP [::1]:1420 (LISTEN)`, **identical before and
after**; the app binary is pid **89201**, started **2026-08-25
10:54:33**, unchanged, read with the anchored
`awk '$NF=="target/debug/nputer"'`. **`/Users/ujju/Projects/nputer-app`
was never entered**; its cwd was read from `lsof -p 88948` only, which is
also what made this pass's installs provably safe under
`integrator.md` rule 1 — the holder serves from a different checkout than
the one installed into. Scratch ports **15270** (e2e run 1), **15271**
(e2e run 2) and **15272** (boot gate) were each `lsof`-read FIRST (zero
rows), then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::`
in that order and never the reverse, and **all were free again
afterwards**. **No `pkill` at any point.** The live lanes
`/Users/ujju/Projects/nputer-T-033`, `-T-102`, `-T-091` and `-T-086` were
not entered. The untracked `z` was left alone. **The lane worktree
`/Users/ujju/Projects/nputer-T-107` was not entered for any measurement,
and this verdict commit is the only write this pass makes to it.**
`drill-T-107-verify` is detached, named per-lane, sits outside the
repository, and is left in place for the integrator to remove.

**VERDICT: APPROVED.** The behaviour is correct, the ruling is right, the
refusal is recorded where a reader will meet it, the enumeration is
enforced by the compiler rather than promised, the security answer is
clean, and the one criterion that is not met on the tree could not have
been met inside the fence — it is disclosed, routed with its body, and
discharged by measurement in this verdict.
