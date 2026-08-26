---
id: T-111
title: The board says what is dispatchable, and WHY the rest are not
feature: F-04
milestone: 4
priority: 4
size: M
status: building
blocked_by: []
touches: [app-board, app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-089-s6, T-013-s1 — files removed in this commit.

`method/roles/orchestrator.md:16` states the rule in one sentence:
*among the topmost undone tasks of each feature column, pick the
highest-priority one that is unblocked AND whose `touches:` don't
overlap any task currently building. Ceiling: 3–5 concurrent.* Half is
already built and unused — `app/src/architecture/task-waves.ts`
computes `ready`/`waits`/`blocked` from `blocked_by` as a pure function
for the map's tasks lens. **The missing half is the fence, and the
fence is where every mistake this week happened.**

**Measured, not anticipated — two things make it harder than the
sentence admits:**

**(a) The `touches` vocabulary is unnormalised and collides by
spelling.** `tools/e2e` appears alongside `tools/e2e/`, `method/`
alongside `method`, and one card carries a bare `docs`. A
string-equality fence reports two cards as disjoint that are not — the
exact failure a fence exists to prevent.

**(b) `app-shell` is one slug over the whole Tauri app** — the
`touch_slugs` value of C-05, C-10 and C-11, whose paths span
`app/src/**` *and* `app/src-tauri/**`, and roughly half the board holds
it. A frontier treating it as an atom refuses a Rust-only card because
a TypeScript-only card is in flight. **That is the coarseness working
as designed and this card SHALL NOT "fix" it** — splitting `app-shell`
is a registry change moving three fixtures and belongs in its own card
if wanted at all. What this card owes is a *reason string* honest
enough that a human can see it is the coarse fence rather than a real
overlap, and override deliberately. Two lanes did exactly that this
week (T-013 twice widened its own `touches` mid-lane, both widenings
ruled correct) — the frontier must make that visible, not silently
serialize.

> **ARCHITECT'S RULING 2026-08-25 — THE FENCE WAS WRONG, THE CARD RETURNS
> TO `planned`, AND THIS IS THE FIFTH TIME.** The lane built seven of
> eight criteria NOT, and was right to: `[app-board]` expands to
> C-08 u C-09 u C-11, thirteen globs all under `app/src/**`, while the
> app's only collector is `app/vitest.config.ts` (`include: ["test/**"]`)
> and both it and `app/test/**` are C-05's `app-shell`. **Three criteria
> name a pin in their own text and no pin can exist in the fence.**
> Measured with a positive control rather than reasoned from the config:
> the same failing body inside C-08's own glob is INVISIBLE to the
> shipped collector (exit 0, 958/958) and RED under one that can see it.
> `touches:` is corrected in place to `[app-board, app-shell]` and the
> dispatch fields are unlocked. **The dispatch defect is the
> ARCHITECT'S**, exactly as at T-015.
>
> **AND THE LANE CAUGHT A SECOND, WORSE ERROR OF MINE — THE FENCES WERE
> NEVER DISJOINT.** `C-11-design-tokens.md` carries
> `touch_slugs: [app-shell, app-board]`, the only double-claimed
> component in the registry. String-equality on slugs says T-033 x T-111
> is disjoint; **component expansion says it is not — they share C-11.**
> The lane ran the whole matrix by hand on the live board: fifteen pairs,
> fourteen agree, **one disagrees, and it is this one**. No collision
> occurred (this lane's diff is four markdown paths), but the guardrail
> was reading the wrong thing. Filed as `T-111-s1`. **The disjointness
> test is over EXPANDED COMPONENTS, never over slug strings** — and that
> is now a rule the dispatcher owes, not an observation.
>
> **THE CEILING WAS ALSO EXCEEDED**, reported by the same lane:
> `orchestrator.md` step 4 reads *"Ceiling: 3-5 concurrent"* and six
> lanes were live. @human asked for maximum parallelism, so the deviation
> was deliberate on the dispatcher's part and undeclared, which is the
> defect — a written ceiling that is silently exceeded stops being a
> ceiling. Merging this lane returns the count to five. IF the ceiling is
> to move THEN it is a `method/` edit and belongs to T-104, not to a
> dispatcher's discretion.
>
> **WHAT THE RE-CUT CARD INHERITS**: criterion 8 is MET (no dispatch
> affordance, both guards named and green), criterion 2 is partly
> discharged already — the four states and their pins live in `join.rs`
> since T-110's rebuild, so the re-cut card should CONSUME them rather
> than respell them — and criterion 3's trailing-slash rule reaches only
> two of the four collisions the tree actually contains (`T-111-s3`).

## Acceptance criteria

- THE board SHALL derive, as a pure function of the parsed model plus
  T-110's lane set, one **disposition** per card: `dispatchable`,
  `blocked` (naming the unmet blocker ids), `fenced` (naming the
  overlapping token AND the lane holding it), `not-topmost` (naming the
  card above it in its column), `at-ceiling`, or `not-applicable`.
- **THE IN-FLIGHT SET SHALL BE THE LANE SET JOINED WITH `status:`, AND
  THEIR DISAGREEMENT SHALL BE VISIBLE** — not one or the other. T-089
  restored the pre-cut `building` stamp, so a live lane normally shows
  both; a stamp with no worktree is a dead lane and a worktree with no
  stamp is an unstamped dispatch. A pin SHALL drive all four states,
  including the two disagreements.
- **`touches` TOKENS SHALL BE NORMALISED BEFORE COMPARISON** — at
  minimum a trailing-slash rule — in **one function with its own pin**,
  never repeated at each comparison site. A pin SHALL show `tools/e2e`
  and `tools/e2e/` overlapping, driven from the live board's own tokens
  rather than a synthetic pair.
- **THE REASON SHALL BE RENDERED AS TEXT, not merely encoded.** A fenced
  card names the token and the lane; a blocked card names the blocker
  ids. **A disposition with no reason is not done being computed.**
- THE ceiling SHALL be a named constant with its own assertion matching
  `orchestrator.md`'s 3–5, and the disposition SHALL distinguish
  "nothing is dispatchable" from "the ceiling is reached" — different
  sentences to a reader.
- IF a card's `blocked_by` names an id that does not exist THEN the
  disposition SHALL be `blocked` and SHALL say the blocker is
  unresolved, rather than treating an unresolvable blocker as
  satisfied. The parser already emits `dangling-reference` with a
  near-miss hint; **consume it rather than re-deriving it** (T-057).
- IF a card is `done` or `parked` THEN it SHALL carry no disposition
  reason at all — progress must not acquire a scolding.
- **NO DISPATCH AFFORDANCE LANDS IN THIS CARD.** T-028's fence is
  enforced mechanically — `crescendo-dom.test.tsx` counts the
  completion panel's buttons and greps its text for `dispatch`/`run
  task`/`assign`, and `TaskDetailPanel.tsx` records that the mockup's
  dispatch footer is deliberately absent. Both SHALL stay green here,
  and this card SHALL name them so the brief card knows what it is
  moving.

Verification: headless — `npm test` from app/ over synthetic models
**and over this repository's own live board**, with the fence pin driven
from a fixture in which no card carries `building` (so the lane set
alone must produce the fenced result). Every new assertion poisoned and
shown RED at a commit. The DOCS GATE fires on the card; run what it
owes. **@human: whether the reason text reads as a help rather than a
scold** — listed explicitly, since a frontier that lectures gets
ignored.

## Implementation notes

Executor `claude-opus-5 @T-111`, lane `task/T-111-dispatchable-board`,
worktree `/Users/ujju/Projects/nputer-T-111`, base `e04f5b3`.
**Understanding was confirmed in one paragraph before a single file was
created**, with `git status --short` empty in this worktree at that
moment (10:47Z).

### THE HEADLINE: SEVEN OF EIGHT CRITERIA ARE NOT BUILT, AND THAT IS THE FINDING RATHER THAN A SHORTFALL

**NO PIN CAN LIVE INSIDE `[app-board]`, AND IT IS MEASURED WITH A
POSITIVE CONTROL RATHER THAN REASONED FROM THE CONFIG.** Every
derivation this card asks for lands under `app/src/**`. The app's only
test collector is `app/vitest.config.ts` with
`include: ["test/**/*.test.{ts,tsx}"]`, and **both that config and
`app/test/**` are in C-05's `paths:` — slug `app-shell`**, held right now
by live lane T-033. So this card's fence contains no suite, and three of
its criteria name a pin in their own text (criterion 2 *"A pin SHALL
drive all four states"*, criterion 3 *"in one function with its own
pin"*, criterion 5 *"a named constant with its own assertion"*).

`method/roles/executor.md` rules the case in one sentence: *"A criterion
that cannot be built inside the fence is NOT built. Record it, route it
as a suggestion naming the fence it needs, and build the rest. Widening
the fence from inside the lane is the one repair this role may never
make."* **T-015 is the same situation with the architect's ruling already
on it** — *"The lane below built nothing and was RIGHT to … **The
dispatch defect was the ARCHITECT'S**, not the lane's … Re-dispatch only
when `app-shell` is free"* — and its `touches:` was corrected in place
from `[app-map]` to `[app-map, app-shell]`. **T-111 needs the same
correction: `[app-board, app-shell]`.**

**AND THE ALTERNATIVE IS A KNOWN REJECTION, NOT AN UNTRIED OPTION.**
T-110's first pass shipped exactly this card's shape — a correct,
unpinned TypeScript derivation under `app/src/**` — and was REJECTED for
it, with four one-sided producer mutants all surviving `npm run build`
and `npm test` at exit 0. Its rebuild's entire content was relocating
that logic into Rust where a pin could reach it. **T-111 has no such
relocation available**: all thirteen globs in `[app-board]` are
`app/src/**` TypeScript, styles and assets. `assertNever` and two `tsc`
programs catch a MISSING arm and have never caught a WRONG one.

**SO NO SOURCE FILE WAS CHANGED. `app/src/**` IS A 0-FILE DIFF, AND SO IS
EVERY OTHER CODE PATH IN THE REPOSITORY.** The whole diff is this card
and three suggestion files.

### The fence, derived from the component files — never from ARCHITECTURE's prose

`[app-board]` is C-08 ∪ C-09 ∪ C-11, read from each file's own
`touch_slugs:` at `e04f5b3`. Thirteen globs:
`app/src/components/board/{Board,FeatureColumn,GhostCard,ParkedRow,SliceLine,TaskCard,TaskDetailPanel}.tsx`,
`app/src/components/board/badges/**`,
`app/src/components/board/panel-dismissal.ts`,
`app/src/lib/board-model.ts`, `app/src/lib/task-detail.ts`,
`app/src/styles/**`, `app/src/assets/**`. **Not one is a collector and
not one is read by one.**

### THE MEASUREMENT — two arms, and the second is what makes the first mean anything

A body asserting `expect("collected").toBe("not collected")` written to
`app/src/components/board/badges/t111-collector-probe.test.ts` — inside
the fence, under C-08's own `badges/**` glob — untracked throughout and
removed afterwards:

| arm | collector | result |
|---|---|---|
| **A** | the SHIPPED `app/vitest.config.ts`, unchanged | **exit 0 — 46 files / 958 tests, unchanged from baseline** |
| **B** | a throwaway config OUTSIDE the repository naming that exact path | **exit 1 — 1 failed / 1**, `AssertionError: expected 'collected' to be 'not collected'` |

Restoration: `git status --short` EMPTY, the directory back to its three
`.tsx` files, and `npm test` re-run at **958/958, exit 0**.

**A FALSE POSITIVE CONTROL WAS CAUGHT ON THE WAY.** Arm B's first run
also exited 1 — on `Error: Cannot find module 'vitest/config'`, a STARTUP
error from a config in a directory with no `node_modules`, not the
assertion. **The exit code alone could not tell the two apart**; the
message could. The config was rewritten with no import and the second run
carried the assertion text. This project's "derive the count as well as
the exit" rule, arriving in a probe rather than in a suite.

### Each acceptance criterion

1. **One disposition per card, six values.** NOT BUILT — routed
   (`T-111-s2`). Buildable in `app/src/lib/board-model.ts`, which is in
   fence; unpinnable there.
2. **The lane set joined with `status:`, disagreement visible, a pin
   driving all four states.** NOT BUILT — routed. **AND THE RE-CUT CARD
   SHOULD CONSUME RATHER THAN RESPELL**: T-110's rebuild already holds
   `live`/`died`/`stampSkipped`/`notDispatched` in
   `app/src-tauri/src/dispatch/join.rs` with a pin under each, and
   `hydrateJoin` in `app/src/lib/dispatch-store.ts` carries them to the
   webview verbatim. A second spelling of that rule in `board-model.ts`
   is precisely the divergence T-110 exists to remove.
3. **Normalisation, one function, its own pin, from the live board's own
   tokens.** NOT BUILT — routed, **and the criterion is partly wrong**:
   see `T-111-s3` and the corrections section below.
4. **The reason rendered as TEXT.** NOT BUILT — routed. The negative
   control it needs is named in `T-111-s2`.
5. **The ceiling as a named constant with its own assertion.** NOT BUILT
   — routed. `orchestrator.md` step 4 reads *"Ceiling: 3–5
   concurrent."*, verified at this ref; the assertion must hardcode the
   bound rather than derive it from the constant (CONVENTIONS' rule, and
   the shape that let `BRANCH_MAX_LEN` survive T-110's first drill).
6. **A dangling `blocked_by` is `blocked`, consuming the parser's
   `dangling-reference`.** NOT BUILT — routed, with two facts derived
   that the re-cut card needs. **NO PLUMBING IS OWED**:
   `parseProjectFromFiles` already pushes `validateProject`'s issues into
   `result.issues` (`lib/parser/src/project.ts`), so `selectBoard(model)`
   already receives `dangling-reference` with its `nearMiss` hint and
   `board-model.ts` already consumes `ParseIssue[]` through
   `issuesByFile`. **And the case cannot be driven from the live board**:
   at `e04f5b3`, 31 cards carry a `blocked_by` and **ZERO** name an id
   that is not on the board, so criterion 6 needs a synthetic fixture.
7. **`done`/`parked` carry no reason at all.** NOT BUILT — routed.
8. **NO DISPATCH AFFORDANCE LANDS — MET, and trivially so, since no
   source file changed.** Both guards named as the criterion asks, so
   T-112 knows what it is moving: `it("6. the completion state renders —
   board ready, elapsed, ONE CTA (criterion 2)")` in
   `app/test/crescendo-dom.test.tsx`, which counts the completion panel's
   buttons (`toHaveLength(1)`, `data-testid` `genesis-open-board`) and
   greps its text for `dispatch` / `run task` / `assign`; and
   `TaskDetailPanel.tsx`'s module doc comment, which records that *"the
   mockup's dispatch footer belongs to F-04 and is deliberately absent"*.
   **Both green** inside the 958/958 run.

### THE FINDING THE CARD DID NOT ANTICIPATE — and it is this lane's own dispatch

**`[app-board]` AND `[app-shell]` ARE NOT DISJOINT.** C-11 carries
`touch_slugs: [app-shell, app-board]`, so at `e04f5b3`:

    T-033  [docs/architecture/components/, lib-parser, app-map, app-shell]
    T-111  [app-board]

    STRING-EQUALITY fence    -> intersection EMPTY  -> reported DISJOINT
    COMPONENT-EXPANDED fence -> intersection {C-11} -> OVERLAPPING
                                (app/src/styles/**, app/src/assets/**)

C-11 is the ONLY component in the registry carrying two slugs, so this is
the only pair in the vocabulary that can collide this way — and
ARCHITECTURE's own derived table prints both rows containing C-11, four
lines apart. **The data was never missing; nothing joined it.** Nothing
was breached (neither lane wrote under those globs), which is exactly why
it survived a whole lane undetected. Full account and three arms in
`T-111-s1`. **The card's criterion about the reason string covers the
converse case only** — a coarse slug refusing a disjoint card — and no
reason string helps here, because no reason is computed.

**AND IT IS ONE PAIR IN FIFTEEN, ON A BOARD THAT IS ALSO OVER ITS
CEILING.** The lane set went from TWO to SIX while this lane worked
(T-086, T-091, T-102, T-107 cut between 10:51Z and 11:08Z) and main moved
three times in twenty-two minutes. Run by hand at **11:10Z against main
`c4c15c8`** — by hand, because the thing that should run it is this card:

    T-033 [docs/architecture/components/, lib-parser, app-map, app-shell]
    T-086 [docs/CONVENTIONS.md]        T-102 [app-agent]
    T-091 [tools/e2e]                  T-107 [app-interview]
    T-111 [app-board]

Fifteen pairs. **Fourteen agree; ONE disagrees** — `T-033 x T-111`,
string-equality EMPTY against component-expanded `{C-11}` — and it is the
only pair in the vocabulary that can. **And `orchestrator.md` step 4 reads
"Ceiling: 3–5 concurrent." There are SIX.** That is criterion 5's
"the ceiling is reached" branch, live rather than hypothetical, reported
by nothing.

### The drill — NOT OWED, and that is derived rather than skipped

**This diff contains ZERO new or changed assertions**, so CONVENTIONS'
poison-drill trigger does not fire: `app/src/**`, `app/test/**`,
`lib/parser/**`, `tools/e2e/**` and `app/src-tauri/**` are all 0-file
diffs. The collector measurement above is the discipline applied anyway,
to the one claim this lane does make, and it carries the positive control
a negative claim requires. **No `drill-T-111` worktree was created**, and
the class is therefore empty from this lane.

### Suites and gates, every exit read from `$?` unpiped, count derived as well as exit

All at `e04f5b3` in this lane's worktree, in the order run. Setup first,
as a fresh worktree has nothing: lib/parser `npm ci` **0** then
`npm run build` **0**; app `npm install` **0**; tools/e2e `npm ci` **0**.
**The fresh-install rule was DERIVED, not skipped**: port 1420's holder
was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else (node
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, read 10:47Z), and
`lsof -a -p 88948 -d cwd` puts its cwd at
`/Users/ujju/Projects/nputer-app/app` — **a different checkout**, so
`integrator.md` rule 1's operative condition (the CHECKOUT serving a live
product) is not this one. That is arm B of STATE's first-reader table,
applied from a lane.

- **app `npm run build` exit 0** · **`npm test` 958/958 across 46 files,
  exit 0** — three times: baseline, with the probe present (unchanged,
  which is the measurement), and after its removal.
- **parser `npx vitest run` 264/264 across 12 files, exit 0.**
- **cargo `test --no-fail-fast` 455 passed / 0 failed / 3 ignored, exit
  0**, summed over **SIXTEEN** `test result:` lines. Identical to
  main's 455/0/3 over 16 — this diff adds no test body and no test
  target. **GREEN FIRST TIME, NO RE-RUN, AND THE CLOCK TABLE GAINS A
  NINTH ROW**: the lib binary reads **`ok. 160 passed … finished in
  3.99s`**, inside STATE's green band (every green under 9.5s) and on
  the post-clean mean of 3.97s. Neither `docs_watch::tests::
  startup_arm_watches_the_initial_root` nor
  `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
  fired. **A lane worktree has its own small target directory, which is
  what STATE's `T-088-s4` account predicts** — this is the prediction
  holding, not evidence the cliff is gone.

- **E2E — 145 passed / 1 FAILED, exit 1 on the FIRST run; 146/146 exit 0
  on the second and third. BOTH DECLARED, NOTHING DISCARDED.** Scratch
  ports **15220**, **15221**, **15222**, each `lsof`-read FIRST (zero
  rows), then bind-confirmed on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in
  that order and never the reverse, and all free again after. No `pkill`.
  **THE RED IS `T-120-s3`, IDENTIFIED BY ITS OWN SIGNATURE RATHER THAN
  GUESSED AT** — `token-scan.spec.ts:201`, *"P6 reds a planted bare motion
  utility and leaves its motion-safe twin alone"*, failing at its mtime
  restore with **`Expected: 1787654289922.3904` / `Received:
  1787654289922`**. **The `.3904` IS the diagnosis**: `Stats.mtime` is a
  `Date` holding whole milliseconds, so `utimesSync(target, clock.atime,
  clock.mtime)` writes back a rounded timestamp while the assertion
  compares the unrounded float it captured.
  **IT CANNOT BE THIS LANE'S, AND THAT IS DERIVED**: the change set is 4
  paths, ALL `docs/tasks/*.md`, and `grep -c tools/e2e` over it is **0**.
  A markdown-only diff cannot move an mtime assertion in a TypeScript
  spec.
  **AND IT IS THE FIRST TIME IN FIVE CHECKPOINTS THAT IT ACTUALLY
  FIRED.** STATE has carried *"IT DID NOT FIRE AT THIS MERGE EITHER"* for
  five checkpoints running while predicting it fires *"in exactly the
  places this project creates most often: a fresh lane worktree and a
  fresh poison-drill worktree."* **This is a fresh lane worktree and it
  fired, red once then green twice, exactly as written.** The second run
  was not a re-run to reach green — it is the prediction's own second
  half being checked, and both halves are reported. **The one-token fix
  in STATE is unchanged and still unbuilt**; it is still item 1 under
  "Next up", now for the sixth checkpoint.

**THE THREE STANDING GATES, DERIVED FROM THIS LANE'S OWN DIFF (4 paths,
all under `docs/`):**

- **GRAPH REGEN — NOT OWED, 0 of 4**, and **ASKED rather than predicted**
  as its bullet demands.
- **BOOT GATE — NOT OWED, 0 of 4.** No `app/src/**`, no
  `app/src-tauri/**`, neither manifest. **The dispatch brief asserted
  "your edits will match" and instructed the gate be RUN; the outcome
  falsified the premise**, so it is derived not-owed rather than run —
  STATE's own precedent for a docs-only diff.
- **DOCS GATE — FIRES, exit 1, 4 of 4 under `docs/`.** Invoked directly
  from the repo root with ROOT-RELATIVE arguments and never through
  `xargs`, with the new files `git add`ed first so it can see them
  (`T-010-s10`). **THREE suites owed** — `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/` — all
  three run and green, at the writes and AGAIN after the amendment
  (T-081-s9). **`cargo test` is NOT owed on this diff** (no
  `docs/CONVENTIONS.md`, no `docs/architecture/components`, no capture)
  and was run anyway. The gate reports **12 derived readers across 4
  suites**, a census of **130** docs-shaped sites in 22 files, and **0
  frontmatter issues** — which is this card's `verifying` stamp parsed
  rather than assumed.

**THE RANGE, DERIVED AT MY OWN REF — and the left endpoint moved twice
while I derived it.** Main was `e04f5b3` at 10:46Z, `ad5a0df` at 10:51Z
and **`c4c15c8` at 11:08Z**: three tips in twenty-two minutes.

    git merge-tree --write-tree c4c15c8 <tip> -> tree 64852bc…, exit 0 (read from $? FIRST)
    git diff --name-only c4c15c8 <TREE>            ->  4   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only c4c15c8...<tip> (THREE)   ->  4   AGREES — FIFTH MERGE RUNNING
    git diff --name-only c4c15c8..<tip>  (TWO, FORBIDDEN) -> 13
    git diff --name-only e04f5b3..c4c15c8 (main's advance) ->  9

**THE SET IDENTITY WAS CHECKED, NOT ONLY THE COUNT** — `diff` over the two
sorted lists is exit 0, EMPTY — which is the check that would have caught a
disagreement had one existed. `comm -12` over the branch's four and main's
nine is **EMPTY**, and 9 + 4 = 13 is the arithmetic proving the sets
disjoint. The forbidden two-dot form overstates by **9 paths, 3.25x**, pure
left-endpoint drift. Ratios so far: T-110 7.0x, T-120 1.2x, T-124 5.6x,
T-052 5.3x, T-111 **3.25x** — the ratio is weather; the left endpoint is
the signal.

**`lint:tokens` CONTROL IS 691 HERE AGAINST STATE's 688, AND THE
DIFFERENCE IS EXACTLY THIS LANE.** The corpus is `git ls-files`, which
reads the INDEX, so the three staged suggestion files join it: 688 + 3 =
691. Derived, not quoted.

### For the verifier

- **Rule the fence question first** — everything else is downstream of
  it. The claim is that `[app-board]` contains no test collector, hence
  no criterion naming a pin can be built in it. The two-arm measurement
  above is reproducible in four commands and the positive control is the
  half worth attacking.
- **The second thing worth attacking is whether "build nothing" was
  right.** The alternative is shipping the derivation into
  `board-model.ts` with the pins routed — which is T-110's first pass
  verbatim, and was rejected. If the architect prefers that shape, it is
  a DISPATCH decision, not an executor's.
- Three findings routed: `T-111-s1` (the C-11 double claim — the live
  fence overlap), `T-111-s2` (no pin can live in `[app-board]`, with the
  pins the re-cut card owes listed so they are not re-derived), and
  `T-111-s3` (the `touches:` vocabulary is three kinds of token).
- `roles/executor.md`'s own last bullet records that this section and
  `roles/verifier.md` cannot both hold. Nothing here is addressed to the
  executor alone; the conflict is noted, not resolved.

### Where the CARD and the BRIEF were wrong

1. **THE CARD, criterion 3 — the trailing-slash rule does not reach the
   card's own third example.** The criterion names `tools/e2e` beside
   `tools/e2e/`, `method/` beside `method`, and *"one card carries a
   bare `docs`"*. Censused at `e04f5b3` over 124 cards and 19 raw
   tokens: the first two DO collide under a trailing-slash rule (27 and
   8 cards); **`docs` does NOT** — it normalises to `docs` while
   `docs/tasks/` normalises to `docs/tasks`, so 25 cards fenced under
   `docs/` are still reported disjoint from it. Containment needs a
   prefix rule. And a fourth collision the card does not mention exists:
   `ci` (1 card) against `.github/` (4), which shares no substring at
   all. `T-111-s3` carries it, with T-054 as the single live fixture
   that exhibits three of the four.
2. **THE CARD, header citation.** `method/roles/orchestrator.md:16` is a
   LINE citation; CONVENTIONS requires a SYMBOL. The rule is
   `orchestrator.md`'s **step 4**, and its text is quoted accurately.
3. **THE CARD, criterion 2's premise is already discharged in part.**
   The four states and their pins exist in `join.rs` as of T-110's
   rebuild. The criterion reads as though they must be built here.
4. **THE BRIEF, item 8 — "your edits will match" the GRAPH REGEN
   trigger.** They do not: this lane changes no `.ts/.tsx/.js/.jsx/.rs`
   file. GRAPH REGEN and BOOT GATE are both NOT OWED.
5. **THE BRIEF, item 4 — the base is right and the main tip moved under
   it.** Base `e04f5b3` confirmed. Main was `e04f5b3` at 10:46Z and
   **`ad5a0df` by 10:51Z** (the ninth triage's first batch, promoting
   T-126). Every pre-merge range is derived against the tip read at that
   moment and will need re-deriving again at the merge — the brief's own
   rule 2 about live-environment facts, arriving within the hour.
6. **STATE's board tally, re-derived and moved by this card's own
   dispatch.** STATE says 39 planned / 1 building; at `e04f5b3` the
   board is **84 done / 38 planned / 41 parked / 56 suggested / 0
   verifying / 2 building**, total 221. The dispatch commit that created
   this lane is what moved planned 39→38 and building 1→2 — the
   staleness is the stamp, not an error.
