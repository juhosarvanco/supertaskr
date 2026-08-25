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
