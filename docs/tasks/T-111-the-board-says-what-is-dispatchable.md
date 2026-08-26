---
id: T-111
title: The board says what is dispatchable, and WHY the rest are not
feature: F-04
milestone: 4
priority: 4
size: M
status: done
blocked_by: []
touches: [app-board, app-shell]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5
verified_by: claude-opus-5
review: same-model
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

## Implementation notes — THE SECOND LANE (2026-08-26)

Executor `claude-opus-5 @T-111`, lane `task/T-111-board-dispatchable`,
worktree `/Users/ujju/Projects/nputer-T-111`, base **`15a963d`**.
Understanding was confirmed in one paragraph before a file was touched,
with `git status --short` clean in this worktree at that moment.

**THE FIRST LANE'S NOTES ABOVE ARE LEFT BYTE-UNTOUCHED.** They record a
correct refusal and the measurement behind it; this section is what
happened once the architect's ruling unlocked the fence.

### THE FENCE QUESTION, RULED FIRST, BECAUSE EVERYTHING ELSE IS DOWNSTREAM

**`T-111-s2` IS DISCHARGED BY THE ARCHITECT'S CORRECTION AND NOT BY THIS
LANE.** Its claim was that `[app-board]` — thirteen globs, every one under
`app/src/**` — contains no test collector, so three criteria naming a pin
in their own text could not be built. **`touches:` now reads
`[app-board, app-shell]`**, and `app-shell` expands through C-05, whose
`paths:` include **`app/test/**` and `app/vitest.config.ts`**. Derived
from the component files' own `touch_slugs:` at `15a963d`, never from
ARCHITECTURE's prose:

    app-board -> C-08, C-09, C-11
    app-shell -> C-05, C-10, C-11, C-16

**So every pin this card owes lives in fence, and none had to be
weakened.** They are in `app/test/select-board.test.ts` — C-05's
`app/test/**` — beside the other pins for the same producer.

**AND NOT IN A NEW FILE, DELIBERATELY.** A new indexed file moves
`architecture-dogfood.test.ts`'s `fileComponent.size` and
`map-dogfood-render.test.tsx`'s header hint, and those reconciliations
belong to the checkpoint that regenerates the graph. Asked rather than
predicted, `index --check` reports **`files +0 -0 ~2`** — the graph gains
no node. **The forecast section below measures what the regen actually
costs, which is nothing.**

### THE CRITERIA

1. **One disposition per card, six values — MET.**
   `selectDispositions(model, dispatch, topmost?)` returns
   `{ kind: "derived", cards, inFlight, ceilingReached, headline }` or
   `{ kind: "undecidable", sentence }`. `DISPOSITIONS` is the closed six.
   **The ORDER of the tests is pinned**: `not-applicable` -> `blocked` ->
   `fenced` -> `not-topmost` -> `at-ceiling` -> `dispatchable`.
   Card-specific reasons come first, because a blocked card told *"the
   ceiling is reached"* has been told the least useful true thing about
   itself.
2. **The lane set joined with `status:`, disagreement visible, a pin
   driving all four states — MET, and the vocabulary is CONSUMED.** The
   four states are `join.rs`'s, mirrored structurally so `board-model.ts`
   declares no C-15 dependency for a type alias — the shape
   `dispatch-store.ts`'s own `BoardStamp` already uses. `T-111-s2` item 2
   asked for exactly this. One body per state, plus one for a
   registration whose directory is gone.
   **`died` IS THE BODY THAT PROTECTS `T-135`.** A card stamped in flight
   beside no worktree has meant "somebody forgot" nearly every time it has
   appeared in this record, and at `15a963d` it did NOT: `T-135` is
   deliberately merged-but-open and STATE carries a heading saying so.
   **A derivation cannot read intent, so it reports the two facts and
   refuses the third** — and the body sweeps the sentence for `lapsed`,
   `forgot`, `dead`, `abandon` and `stale` to keep it that way.
3. **Normalisation, one function, its own pin, from the live board's own
   tokens — MET, and the criterion's prescribed minimum is not enough.**
   `normaliseTouchToken` is the one function; `touchTokensOverlap` adds
   separator-anchored CONTAINMENT, which is what reaches `docs` beside
   `docs/CONVENTIONS.md` and `method/` beside `method/lane-protocol.md`.
   Censused at `15a963d`: **142 cards carry `touches:`, 26 distinct raw
   tokens**, against `T-111-s3`'s 124 and 19 at `e04f5b3` — and the eleven
   new tokens are a CONTAINMENT family that census did not have.
   **`ci` against `.github/` is pinned AS known-wrong**, because a
   normalisation that silently misses a collision while the card says the
   vocabulary is normalised is worse than none (`T-111-s3`'s own ask).
4. **The reason rendered as TEXT — MET, with the negative control.** Every
   disposition except the quiet three carries a sentence naming its own
   subject: the blocker ids and their bindings, the token and the lane and
   the shared paths, the card above, the lane count against the ceiling.
   `a DIFFERENT input yields a DIFFERENT sentence, five ways` strips card
   ids and asserts five distinct SHAPES, which is the control `T-111-s2`
   item 4 asks for: a derivation returning one reason for everything
   satisfies "the reason names the token" as readily as a correct one.
5. **The ceiling as a named constant with its own assertion — MET.**
   `CONCURRENCY_CEILING` is `{ min: 3, max: 5 }`; the body hardcodes 3 and
   5 rather than reading the constant (the shape that let `BRANCH_MAX_LEN`
   survive T-110's first drill), **and a second body parses the bound out
   of the live `method/roles/orchestrator.md` and asserts the same two
   numbers.** `at-ceiling` and `NOTHING IS DISPATCHABLE` are different
   sentences and are pinned as different.
6. **A dangling `blocked_by` is `blocked`, consuming the parser's
   `dangling-reference` — MET, AND THE DISAGREEMENT IS RULED RATHER THAN
   DEFAULTED.** See the ruling below. No plumbing was owed, exactly as the
   first lane derived: `parseProjectFromFiles` already pushes
   `validateProject`'s issues into `result.issues`, so the sentence is
   consumed verbatim and never re-derived (T-057).
7. **`done`/`parked` carry no reason at all — MET**, plus `merging`, which
   is `done`'s last mile. The key is ABSENT rather than undefined-valued,
   and the body carries the positive control that a card which SHOULD
   carry a reason does — without it, "no reason" is equally explained by a
   derivation computing none.
8. **No dispatch affordance — MET, and trivially: no component file
   changed.** Both named guards are green inside the 1009/1009 run —
   `it("6. the completion state renders — board ready, elapsed, ONE CTA
   (criterion 2)")` in `app/test/crescendo-dom.test.tsx`, and
   `TaskDetailPanel.tsx`'s module doc comment recording that the mockup's
   dispatch footer is deliberately absent.

**WHAT IS NOT BUILT, AND IT IS NOT A CRITERION.** Nothing RENDERS a
disposition. `selectDispositions` has no data source in the running app:
`dispatch_lanes` (T-126) delivers the lane SCAN, and the JOIN this
derivation consumes has no zero-argument shape — **`T-126-s2` is that
routing and it names T-111 as its first consumer.** Wiring a panel to a
model nothing can produce would be dead code with a fake input, so the
frontier ships as the derivation the card asks for and the surface waits
on the ruling `T-126-s2` wants.

### THE RULING THE ARCHITECT ASKED FOR: A DANGLING BLOCKER

**The card and `T-111-s4` disagree, this card predates the finding, and
neither wins silently.** The card: *"IF a card's `blocked_by` names an id
that does not exist THEN the disposition SHALL be `blocked` and SHALL say
the blocker is unresolved, rather than treating an unresolvable blocker as
satisfied."* The finding: *"a dangling blocker is a defect in the card,
not a reason to wait."*

**RULED: THE CARD WINS ON THE DISPOSITION, THE FINDING WINS ON THE REASON,
and the two are not a compromise.** A dangling blocker yields
`disposition: "blocked"` with `binding: "missing"`, and the sentence reads
*"names T-999 as a blocker and no card declares that id — that is a defect
in this card, not a reason to wait."* Four reasons:

1. **`T-111-s4`'s own argument decides it.** Its case is that over-blocking
   *"costs throughput rather than correctness, and therefore is the failure
   nobody notices"* — the CHEAP failure. Dispatching on a card whose own
   frontmatter is unresolvable is the expensive one. The finding's
   asymmetry argues for keeping it blocked.
2. **The finding's sentence is about the READER, not the verdict.** It ends
   *"and the board should say which it is"* — a requirement on the reason
   text, which `binding` and the clause deliver. Reading it as a
   requirement on the disposition would make the field's THREE states
   collapse into two, which is the fold the same paragraph forbids.
3. **It names the cheapest repair.** A `missing` blocker is fixed by
   editing one line; an `open` one is fixed by landing a card. Saying so is
   the "help rather than a scold" the card asks @human to judge.
4. **It costs nothing today and is therefore a design decision rather
   than a live trade-off.** Measured at `15a963d`: **ZERO live cards name
   a blocker id that does not exist**, re-derived in a body that will red
   the day one does.

**`T-136` WAS THE OTHER SEAT AND IT WAS REJECTED ON MAIN WHILE THIS LANE
BUILT.** At `b0b5b43` — twenty minutes before this section was written —
`T-136` moved to `docs/tasks/rejected/` and four declarations cleared
under its argument were restored byte-identical. **Its criteria required
the same three states unfolded, so nothing above changes**; what changes
is that no gate will assert them, and the board is now the only surface
that judges binding at all. The ruling stands on its own four reasons.

### THE CENSUS — AND THE FRAMING IT WAS MEASURED UNDER WAS OVERTURNED ON MAIN MID-LANE

**READ THIS SECTION AS AN INVENTORY, NOT AN INDICTMENT, AND THAT IS A
CORRECTION TO THIS LANE'S OWN BRIEF.** `T-136`'s rejection at `b0b5b43`
settles it on @human's question and a reading of the source:
`app/src/lib/task-detail.ts` has always resolved every `blocked_by` id
against the model and `TaskDetailPanel.tsx` has always rendered a `done`
blocker in its status colour with a tick. **`blocked_by: [T-104]` on a
card whose T-104 has landed is not stale — it is historically accurate,
and it is the only record of why the work was sequenced that way.** The
defect was never in the data; it was in a QUERY that read a non-empty
field as "blocked" without resolving the ids.

**THAT STRENGTHENS THIS CARD RATHER THAN WEAKENING IT.** A hand-written
query is exactly what `selectDispositions` replaces, and it is the one
thing this derivation structurally cannot do: it asks every named blocker
for its status and never asks the field for a verdict. Full account in
**`T-111-s6`**, which retracts the word "stale" and keeps every count.

The short form, walked over `docs/tasks/` and `docs/tasks/rejected/` by
`^id:` and never by glob:

| quantity | `f9350b1` | `15a963d` (this base) |
|---|---|---|
| `blocked_by` entries repo-wide | 51 | **44** |
| entries whose blocker is `done` | **48** | **41** |
| such entries on cards that are not `done` | 10 | **3** |
| **planned cards ALL of whose blockers had landed** | **6** | **0** |
| entries naming no card at all | 0 | **0** |

**ZERO is right for the question that decides a dispatch, and for no
other.** Three entries survive on PLANNED cards — `T-067 <- T-062`,
`T-067 <- T-058`, `T-068 <- T-057` — and none changes an answer, because
both cards are still genuinely blocked by `T-065`. **`T-111-s4` and
`T-136` both say 46; on disk at `f9350b1` it is 48**, and the two missing
are `T-111 <- T-110` and `T-134 <- T-132`, which `15a963d` cleared as
*dispatch* rather than counting as *census*. Every figure reconciles once
those two are added back — and **the first two rows go back UP at
`b0b5b43`**, because the four are restored. A count of this field is a
function of the tree AND of the question; derive it rather than quoting
this table.

### THE ARCHITECT'S MID-LANE STEER, AND WHAT IT CHANGED

**Received after the first build commit: the derivation has a SECOND
consumer — a terminal session — and must not be reachable only from a
React tree.** Acted on at `59fb69a` rather than deferred, and the change
was small because the function was already pure: the column order became a
PARAMETER, defaulted to `topmostUndoneByColumn(model)`, which is now the
only function in the frontier that knows a board exists. Two pins: an
injected order changes the answer, and the default IS the board's order.
Drill arm A30 kills the first and nothing else.

**THE SHARED HOME IS `lib-parser` AND IT IS OUT OF FENCE AND HELD LIVE BY
`T-134`.** Routed, not built — `executor.md`'s *"widening the fence from
inside the lane is the one repair this role may never make"*. **`T-137`
landed on main at `cf470f5` WHILE THIS LANE WAS BUILDING** and is that
card, with `blocked_by: [T-134]` and a criterion reading *"IF `T-111` has
landed a board-local implementation by the time this runs THEN this card
moves it and says what moved."* **`T-111-s5` is the "what moved" half**,
written by the seat that built it, including the one decision T-137's
criteria do not settle: whether the column ORDER moves with the frontier.

### THE DOCS GATE CAUGHT A REAL DEFECT IN THIS LANE'S OWN TEST FILE

**Worth its own heading because it fired on the shape of the code rather
than on its meaning, and the first spelling was RED.** The live-board
helper originally looped `for (const dir of ["docs/tasks", …])` and joined
with `dir + "/" + name`. The reads were correct; every docs literal sat
behind a loop variable, so `docs-scan.mjs` could not resolve them.
`app/test/select-board.test.ts` therefore held the repository root while
forming no linkable docs path — `unaccountedRootAnchors()`'s residual —
and **`tools/e2e/tests/docs-input-gate.spec.ts` went 4 failed / 38 passed
while the hand-run gate exited 1 on a CODE-ONLY path list**, which three
of those four bodies exist to forbid.

**Rewritten in `architecture-dogfood.test.ts`'s literal-at-the-join shape:
exit 0, 15 derived readers across 4 suites (up from 14 — this suite IS a
reader and the gate now says so), the root-anchor account back to 6, and
the spec 42/42.** Arguing it into `ROOT_ANCHOR_LEDGER` instead would have
been a lie by placement — that ledger records files that hold the root and
mostly *do not* read docs/ — and the ledger is `tools/e2e`, out of fence.
**The scanner gap is real for the next file and is `T-111-s8`**, with the
failure direction named: a docs read the scanner cannot see is a suite the
gate does not name.

### THE POISON DRILL — 33 ARMS, ALL RED, AND FOUR BODIES THAT CANNOT BE POISONED

Detached worktree **outside the repository** at `/private/tmp/t111d` (18
characters — `T-133-s5`'s threshold is bracketed 116–128), its own
install, `npm run build` first so the app suite was drillable at all.
**One side only: the PRODUCER was mutated and never an assertion**, every
substitution count asserted **= 1**, every mutation read back with
`git diff` **before** its run, and every arm restored with
`git checkout --` and proved by sha256 against `git show HEAD:<path>` with
`git status --porcelain` EMPTY.

**33 arms, 33 REDS, exit 1 on every one, 0 arms restored short.**
**SIXTEEN arms kill exactly one body**, which is the uniqueness
measurement rather than the uniqueness claim. The positive control every
arm carries: the parsed `Tests N failed | M passed (T)` line was read as
well as the exit, and each run was swept for `Cannot find module` /
`Transform failed` / `Failed to load` — **zero startup errors across 33
arms**, which is what separates a killed body from a suite that never ran.
That control exists because this card's FIRST lane caught a false positive
of exactly that shape.

**FOUR BODIES SURVIVE EVERY PRODUCER MUTATION, and that is the finding
CONVENTIONS asks for rather than a gap.** Three assert facts about the
TREE and have no producer to mutate: `T-054 is still the live fixture`
(the fixture check `T-111-s3` nominates), `it matches the LIVE
orchestrator.md` (the constant's other end — its partner body pins the
constant against the same hardcoded 3 and 5, so the chain is closed by the
PAIR), and `no live card names a blocker that does not exist`. They red
when the tree moves, which is their entire purpose.

**The fourth is a MEASUREMENT and it is the interesting one.** `the two
spellings that collide on THIS board are both live, and they overlap`
survived both A01 (trailing-slash strip removed) and A02 (containment
removed) — **because the two rules are REDUNDANT on exactly the pair
criterion 3 names.** `tools/e2e` beside `tools/e2e/` is caught by
normalisation alone OR by containment alone. Arm A27 broke both in one
producer-side mutation and the body RED. **So the criterion's own example
is the one case where either half suffices**, and the collisions that
needed the second half are the ones the criterion does not name.

**SHAPE SIX WAS ASKED AND ANSWERED.** Two bodies share an identical kill
set across all 33 arms — `app-board and app-shell are different strings
claiming ONE component` and `the clash names both faces AND the
component`. They are not duplicates: the first drives `expandTouch` and
asserts component ids and paths; the second drives `fenceClashes` and
asserts the clash record's five fields. Different calls, different values,
neither character-identical to the other.

### THE GRAPH REGEN FORECAST — MEASURED, NOT PREDICTED, AND IT COSTS THE CHECKPOINT NOTHING

**GRAPH REGEN FIRES** (2 of 2 paths are `.ts` outside `docs/`) and the
graph is deliberately NOT committed here — 55 of the 57 commits that ever
touched it are checkpoints. **So the forecast was MEASURED instead**, the
way `T-135-s3` should have been: the graph was regenerated in this
worktree, both suites were run against it, and it was restored and proved.

    committed   955710 bytes · 181 files · 2038 symbols · 1943 edges   sha256 b742efbe…
    regenerated 973907 bytes · 181 files · 2075 symbols · 1990 edges
    files +0 -0 ~2      edges +50 -3

**`edges +48 -3` IS WHAT THIS BLOCK SHIPPED AND IT FAILS ITS OWN
ARITHMETIC**: `1943 + 48 − 3` is 1988 against the 1990 printed one line
above; only `+50 −3` closes it. Corrected in place rather than left to be
quoted forward — a figure contradicted by its neighbour on the same screen
is the class this card was rejected for. **Re-asked at the fix pass's own
tip** (`index --check --root ../..`, exit 1 STALE, the real form with both
counts and a file diff): `files +0 -0 ~2`, **`edges +50 -3`**, and the
fresh index is **973930** bytes rather than 973907 because the two files
grew again. **AND THE SENTENCE BELOW IS IMPRECISE FOR A SECOND REASON**:
three of the additions are FILE-LEVEL import edges that also appear in the
`−3`, re-emitted with longer symbol lists, so they are neither intra-file
nor package edges. The operative half — `files +0 −0`, therefore no
dogfood assertion moves — holds, and it is the only half the checkpoint
depends on.

**`npm test` from `app/`: 1009 / 1009, exit 0 — with the regenerated graph
in place.** Not one dogfood assertion moves, because **zero files join or
leave the index** and every new edge is either intra-file (`type_ref`,
`call`) or a PACKAGE edge to `node:fs` / `node:path` / `node:url`, none of
which is a component. The nine-versus-six trap `T-135-s3` fell into cannot
fire here; **the checkpoint that commits this regen owes NO fixture
reconciliation**, and that sentence is a measurement.

`docs/architecture/graph.json` was restored with `git checkout --` and its
sha256 read back as **`b742efbe…`**, identical to the committed file, with
`git status --porcelain` EMPTY.

### THE RANGE, DERIVED AT THIS LANE'S OWN REF — AND MAIN MOVED UNDER IT

Main was **`15a963d`** at dispatch and **`cf470f5`** when the range was
derived: `T-136` and `T-137` landed mid-lane. **Every figure below names
`cf470f5`.**

    git merge-tree --write-tree cf470f5 <tip>  -> tree 4737fc89…, exit 0 (read from $? FIRST)
    git diff --name-only cf470f5 <TREE>            -> 2   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only cf470f5...<tip>  (THREE)  -> 2   AGREES
    git diff --name-only cf470f5..<tip>   (TWO, FORBIDDEN) -> 4
    git diff --name-only 15a963d..cf470f5 (main's advance)  -> 2

**THE SET IDENTITY WAS CHECKED AND NOT ONLY THE COUNT**: `comm -12` over
this branch's two paths and main's two is **EMPTY**, and 2 + 2 = 4 is the
arithmetic proving the forbidden form's overstatement is pure
left-endpoint drift. The ratio is **2.0x**; the ratio is weather and the
left endpoint is the signal.

### FENCE DISJOINTNESS AGAINST EVERY LIVE LANE, COMPUTED THE WAY THIS CARD SAYS IT MUST BE

Read at **12:12:04 EEST, 2026-08-26** — a live-environment fact carrying a
clock and never a commit. `git worktree list --porcelain | awk '/^branch
refs\/heads\/task\//'` returns **THREE**, against **NINE** worktree
entries:

    task/T-111-board-dispatchable   [app-board, app-shell]      this lane
    task/T-134-path-fences          [lib-parser, method/lane-protocol.md]
    task/T-136-stale-blocker-gate   [tools/e2e]

**The other six entries are not lanes**: main's checkout, `../nputer-app`,
`../arch-verify`, and **four detached scratch checkouts** — this card's
drill at `/private/tmp/t111d` and T-134's at `/private/tmp/t134b` and
`/private/tmp/t134v`. **A path filter would have reported six lanes**,
which is T-137's own criterion arriving as a live measurement rather than
a historical one.

**Expanded through the component files' `touch_slugs:` and intersected as
PATH SETS, all three pairs are disjoint** — `lib/parser/**` and
`method/lane-protocol.md` and `tools/e2e` share no prefix with any C-05 /
C-08 / C-09 / C-10 / C-11 / C-16 path. `T-111's OWN FENCE AND T-134's ARE
DISJOINT` pins that pair in the suite **with a positive control**, because
an empty intersection asserted without one is worth nothing.

### WHERE THE CARD AND THE BRIEF WERE WRONG

1. **THE BRIEF, the census: *"the number you re-derive should now be zero
   — and if it is not, that is news."*** Three numbers answer that
   sentence and they are **0, 3 and 41**. Zero planned cards had all their
   blockers landed; three such entries remain on planned cards; 41 remain
   repo-wide. The brief named no unit, which is the limit it names about
   itself — *figures AND their qualifiers slip through*.
2. **THE BRIEF AND `T-111-s4`, THE WHOLE FRAMING — overturned on main at
   `b0b5b43` while this lane measured it.** *"`blocked_by:` is written at
   drafting and NOTHING EVER CLEARS IT … the field drifts monotonically
   toward over-blocking"* reads as a data defect. **`T-136`'s rejection
   rules there is none**: the field is a declaration, it is historically
   accurate, and every rendering surface in this app already resolves it.
   The defect was a hand query. **This is the brief's fourth self-declared
   limit — *it does not stop me being stale* — arriving as the largest
   single correction this lane makes**, and it makes the card's subject
   more useful rather than less.
3. **`T-111-s4` AND `T-136`, the headline figure: 46 is 48 on disk at
   `f9350b1`.** The two missing are `T-111`'s own and `T-134`'s own.
4. **`T-111-s4`, *"four sit on PLANNED cards"*: SIX did.** Four had every
   blocker landed; two more (`T-067`, `T-068`) carried such entries that
   changed no answer, which is why a hand pass did not find them — and,
   after `b0b5b43`, why it should not have.
5. **THE CARD, criterion 3's prescribed minimum is not enough on this
   board.** A trailing-slash rule reaches two collision families and
   **eleven cards now fence a FILE UNDER a directory another card fences**
   — a containment family `T-111-s3`'s census did not have. `T-111-s3`'s
   own arithmetic (124 cards, 19 tokens) is **142 and 26** at `15a963d`.
6. **THE CARD, criterion 6 versus `T-111-s4`** — ruled above rather than
   defaulted, as `T-136` requires of whoever meets it first.
7. **THE BRIEF, *"`T-111-s2` IS A CONSTRAINT ON HOW YOU CAN TEST"*:
   correct in force and already discharged in fact.** The architect's
   in-place correction to `[app-board, app-shell]` bought `app/test/**`
   before this lane started, so the constraint shaped WHERE the pins went
   and never bound what they could assert. Re-derived from the component
   files rather than taken.
8. **THE BRIEF, *"`T-133` landed a command that derives exactly this;
   read it before building a second one"*: right, and the reuse is
   REPORTED rather than performed.** `dispatch-brief.mjs` derives the lane
   list, the slug map and fence overlap — for a **dispatcher in the
   integration checkout, in zero-dependency plain Node**. The board cannot
   import it and it cannot import the board. **What this lane took from it
   is its RULES, not its code**: expansion before comparison, the
   authoritative `touch_slugs:` field over ARCHITECTURE's prose, and
   separator-anchored containment — which this card reached independently
   and which agrees. **`T-137` is the card that makes it one copy**, and
   `T-111-s5` is the move list it asked for.
9. **THE BRIEF was right about every trap it named, and two would have
   cost time.** `npm run typecheck` from `app/` does not exist (scripts
   are `dev, build, preview, test, tauri`); `lint:docs`/`lint:tokens` live
   in `tools/e2e/package.json` and exit **254** from the root; build
   `lib/parser` first; match by `grep -l "^id: <ID>$"` and never a glob —
   `T-111-*.md` matches four suggestion files here; ports are machine-wide
   (15881/15882/15883/15884, each `lsof`-probed at zero rows before use);
   ask GRAPH REGEN rather than predicting it. **The one that actually bit
   was none of them** — it was the DOCS GATE finding above, which no brief
   could have carried because it did not exist until this lane wrote the
   file that caused it.

## ADVERSARIAL VERIFICATION — REJECTED (2026-08-26)

Verifier `claude-opus-5`, lane tip **`09b8920`** confirmed with
`git rev-parse`. **BOUNDED READ HONOURED**: the card was read at base
`15a963d` and the attack set written down at **09:36Z**, before the diff,
the notes commit or any of `s5`–`s8` were opened. Every measurement below
was taken OUTSIDE the repository, in detached worktrees at short paths
(`/private/tmp/t111b|f|m|v`, 18 chars — `T-133-s5`'s bracket is 116–128).

**THE DERIVATION IS CORRECT AND THE CENSUS IS EXACT. THE REJECTION IS
ABOUT WHAT THE SHIPPED TEXT SAYS ABOUT ITSELF**, and about two reason
clauses this card names in its own criteria that nothing defends.

### THE CENSUS RECONCILES ON EVERY ROW — RE-DERIVED, NOT CHECKED

Walked independently by `^id:` over `docs/tasks/` and `docs/tasks/rejected/`,
FRONTMATTER ONLY. **That last word is load-bearing**: one card carries
`blocked_by: [T-B] (any resolvable id); mouse-click T-A's card, then` in
its BODY, and a whole-file grep counts it.

| quantity | `f9350b1` | `15a963d` | lane | verdict |
|---|---|---|---|---|
| entries repo-wide | 51 | 44 | 51 → 44 | **AGREES** |
| blocker is `done` | 48 | 41 | 48 → 41 | **AGREES** |
| such on non-`done` cards | 10 | 3 | 10 → 3 | **AGREES** |
| planned, ALL blockers landed | 6 | 0 | 6 → 0 | **AGREES** |
| naming no card | 0 | 0 | 0 → 0 | **AGREES** |

**BOTH OF THE LANE'S CORRECTIONS TO `T-111-s4` ARE RIGHT**: 46 is 48, and
"four" is six (`T-015`, `T-059`, `T-065`, `T-131`, plus `T-111` and
`T-134`'s own). At **current main `b3eaefe`** the same walk gives 50 / 46 /
8 / **4** / 0 — the four restored at `b0b5b43`, plus `T-137 ← T-134`.

**ZERO DANGLING HOLDS UNDER BOTH DEFINITIONS AND AT EVERY REF** — the
census's (both dirs) and `liveBoard()`'s narrower one (`docs/tasks` only).
So the pin does not red at merge. **But the tripwire is broader than the
body's comment claims**: it fires the day a card's blocker is moved to
`rejected/`, which is routine triage, not only "the day somebody drafts a
typo". `T-136` was rejected last night; nothing named it, so it did not fire.

### FINDINGS — SIX MATERIAL, AND FOUR ARE THE TEXT BEING WRONG ABOUT ITSELF

**F1. THE NEAR-MISS NEVER REACHES THE RENDERED REASON, AND THE PIN'S TITLE
SAYS IT DOES.** `a dangling blocker carries the PARSER's own sentence,
never a second one` — its comment reads *"The near-miss hint is the
parser's and it reaches the reason untouched."* **Measured with a probe:
`REASON_CONTAINS_PARSERSAID = false`.** On a fixture that produces a real
near-miss the parser says *"'T-001' is declared and differs only in zero
padding"* and the board renders *"names T-01 as a blocker and no card
declares that id — that is a defect in this card, not a reason to wait."*
**The hint is dropped, and the board composes a SECOND sentence** — so both
clauses of the title are false. Criterion 6 names the near-miss as the
reason to consume; criterion 4 requires the reason RENDERED. This re-creates
`T-076`'s own failure — sending the author hunting a task that does not
exist — one layer above the code that fixed it.

**F2. THREE ONE-SIDED PRODUCER MUTANTS SURVIVE `npm test` AT EXIT 0.**
Producer mutated, never an assertion; substitution count asserted = 1;
`git diff` read back before each run; restored and sha256-proved.
- **A20b — the whole COARSE-fence clause deleted from the `fenced` reason:
  exit 0, 1009/1009.** Nothing asserts `COARSE`, `expand through` or
  `override it deliberately`. **This is the card's own headline (b)**:
  *"a reason string honest enough that a human can see it is the coarse
  fence rather than a real overlap… the frontier must make that visible,
  not silently serialize."*
- **A09 — the narrower/wider shared-path rule inverted** (a decision with a
  comment asserting it): **exit 0, 1009/1009**, and PROVED non-equivalent —
  `["docs/CONVENTIONS.md"]` becomes `["docs"]` on a parent/child overlap
  that is live on this board (`T-054` holds bare `docs`; 21 cards hold
  `docs/CONVENTIONS.md`).
- A28 — component-id sort dropped: exit 0, probably an equivalent mutant here.

**This card cites T-110's first-pass rejection for exactly this shape.** The
lane's 33 arms were all red and I reproduced its redundancy finding exactly
(A01 kills 2 bodies and not the named one; A02 kills 1; A01+A02 together
kills 3 INCLUDING `the two spellings that collide on THIS board`). The
drill simply never reached the rendered reason text.

**F3. BOOT GATE FIRES AND THE SECOND LANE NEVER MENTIONS IT.** Its trigger
is `app/src/**`; the diff carries `app/src/lib/board-model.ts`. T-046
criterion 6: *"THE EXECUTOR RUNS IT TOO, on the same trigger, before
handing off"*, and *"a skipped gate is news, never silence."* Both "BOOT
GATE" strings in this card are in the FIRST lane's section, where it was
correctly NOT OWED for a docs-only diff. **Lines 480→end and all four
suggestion files contain zero mentions.** Not run, not declared, not routed.
I did not run it either (cold cargo, and it opens a window); `npm run build`
is exit 0, so the TS side is covered — the gate is still owed.

**F4. THE PUBLISHED RANGE DESCRIBES A TIP TWO COMMITS BEHIND THE ONE IT
SHIPS ON.** Published: prescribed 2, three-dot 2, two-dot 4, advance 2,
ratio 2.0x. **Reproduced exactly — at tip `88d4b7a`**, the last code commit.
At the real tip the same ref `cf470f5` gives **7 / 7 / 9**. The range was
written INTO `797e6d4`, the commit that added the four suggestion files and
invalidated it; it was wrong by five paths the instant it was recorded.
Downstream: *"GRAPH REGEN FIRES (2 of 2 paths…)"* is 2 of **7**; and under
the published 2-path range the DOCS GATE reads 0 of 2 → NOT OWED, yet the
lane ran it and found a real defect. **The range and the gate account in
this card do not cohere.**

**F5. THE RETRACTED FRAMING SURVIVES IN THE SHIPPED TEST FILE.** The
retraction reached the card prose, `T-111-s6` and `board-model.ts`'s doc
comment. It did not reach `app/test/select-board.test.ts`, which still
ships the test title **`"THE DECAY IS REAL HERE, and the derivation ignores
it"`**, the comment *"a corpus with no stale entries"*, and `const stale =`.
*Decay* is `T-111-s4`'s exact retracted word. The ASSERTION is correct and
its positive control is genuinely needed — only the vocabulary is retracted
— but a test title is shipped text, and `board-model.ts` says three files
away that a landed blocker *"is not stale — it is historically accurate."*

**F6. `disagrees` IS WRITE-ONLY.** `InFlightLane.disagrees` is declared,
assigned once, set in the test helper and **read nowhere**; arm A24 forcing
it to `false` survives at exit 0. It is the field named for criterion 2's
*"THEIR DISAGREEMENT SHALL BE VISIBLE"*. **The criterion is met** — by the
`not-applicable` sentences, which ARE pinned (A23 reds) — but the field is
unpinned dead data on a public interface `T-111-s5` puts on T-137's move list.

**SMALLER, ALL MEASURED.** (a) *"the four carried seven entries between
them"* — the FOUR carry **five** (1+1+2+1); the SIX carry seven. `51−7=44`
is right, the attribution is not. (b) Graph edges are **+50 −3**, not
+48 −3 — only +50 reconciles 1943 → 1990; and three of the additions are
file-level import edges that also appear in the `−3`, so *"every new edge is
intra-file or a package edge"* is imprecise (the operative `files +0 −0`
holds). (c) `T-111-s6`'s filename says *three* published figures, its title
says *four*. (d) The card header still carries the LINE citation
`orchestrator.md:16` the first lane flagged; the body quotes step 4 correctly.

### F7 — THE BIGGEST FACT FOR THE INTEGRATOR, AND IT IS NOT THIS LANE'S FAULT

**T-134 MERGED WHILE I VERIFIED.** Main went `15f0d7d` → **`b3eaefe`**;
`520e93e` merged T-134 — *"a fence names PATHS, a slug is shorthand, and
disjointness is computed over the expanded sets"* — landing
**`lib/parser/src/fence.ts`, 470 lines**, with `normalizeFenceToken`,
`slugPathIndex`, `expandFence`, `compareFences`, `sharedDomain` and
`UNFENCEABLE_PATHS`. T-111 ships `normaliseTouchToken`, `expandTouch`,
`fenceClashes`, `touchTokensOverlap`: **the same four facts in a different
component, with a British/American spelling split on the function this
card's criterion 3 is about.** A semantic divergence already exists —
T-134 rules `docs/tasks` UNFENCEABLE, T-111 has no such notion, and `T-054`
fences bare `docs`, which contains it under T-111's containment rule.
**`T-111-s5`'s move list is no longer prospective**: merging this puts a
fourth derivation of the fence rule into a repo that just landed the
canonical one.

### RULINGS THE BRIEF ASKED FOR

**THE DISPOSITION/REASON SPLIT IS COHERENT AND I UPHOLD IT.** The card
constrains the DISPOSITION; `T-111-s4` constrains what the reader is TOLD —
different objects, so this is not a compromise. Folding `missing` into
`dispatchable` dispatches on a card whose own frontmatter is unresolvable,
the expensive failure, while `T-111-s4`'s own argument rests on
over-blocking being the CHEAP one. The three bindings are unfolded in the
type, one clause each, and `THREE BINDINGS, and the three are three
sentences` asserts the clauses distinct AND ordered; arms A04 and A05
(folding `missing`→`open`, `parked`→`open`) each red. **But the split is
half-delivered**: the reason wins the ruling and then drops the near-miss
(F1), which is the most useful thing it could tell whoever must fix the card.

**`T-111-s7` IS RIGHT, AND NOW URGENT.** Read directly at
`task-waves.ts:573`: `readSchedule` folds `missing` (`blockerStatus ===
undefined` joins `unmet` with `allInFlight = false`), does not give `parked`
a binding of its own (it is absent from `IN_FLIGHT`, so a wait with no
scheduled end reads like one with an end), and owns `waits`/`blocked`, which
the frontier has no equivalent for and which the merge should keep. Both
resolve ids rather than trusting the field, so s7's "good news first" is
right and it is genuinely the third such surface. Its ordering — land after
`T-111-s5`'s move, then it is a deletion rather than a refactor — is sound.
**One correction: s7 says "today nothing forces them to agree"; as of
`520e93e` there are FOUR derivations, not two.**

### THE RANGE, AT MY OWN REFS, AND MAIN MOVED TWICE UNDER ME

    ref b3eaefe (current main, read 09:58Z)
    git merge-tree --write-tree b3eaefe 09b8920 -> exit 0 READ FIRST, tree b03c8875…
    git diff --name-only b3eaefe <TREE>              ->  7   PRESCRIBED PRE-MERGE FORM
    git diff --name-only b3eaefe...09b8920 (THREE)   ->  7   AGREES, AND THE SETS ARE IDENTICAL
    git diff --name-only b3eaefe..09b8920  (TWO, FORBIDDEN) -> 20
    git diff --name-only 15a963d..b3eaefe (main's advance)  -> 13

`diff` over the two sorted lists is exit 0; `comm -12` against main's 13 is
EMPTY; 7 + 13 = 20 is the arithmetic proving pure left-endpoint drift.
Ratio **2.86x**. At the earlier ref `15f0d7d` the same forms gave 7 / 7 / 13
with advance 6 (ratio 1.86x) — **the ratio is weather, the left endpoint is
the signal**, and it moved twice inside this verification.

### SUITES AND GATES — every exit read unpiped from `$?`, count derived too

- **app `npm run build` exit 0** · **`npm test` 1009/1009 across 47 files,
  exit 0** — baseline, and again at BOTH merge forecasts.
- **parser `npx vitest run` 268/268** at the tip; **290/290** merged with
  `b3eaefe` (T-134's `fence.test.ts` adds 22).
- **tools/e2e 194 passed, exit 0, FIRST RUN, no flake** — scratch port
  **15993**, `lsof`-probed at zero rows immediately before binding and free
  again after. `T-120-s3`'s mtime red did NOT fire for me.
- **DOCS GATE — FIRES, exit 1, 5 of 7 paths under `docs/`.** **15 derived
  readers across 4 suites**, root-anchor account **6**, **0 frontmatter
  issues**, and `app/test/select-board.test.ts` IS derived as a
  `docs/tasks` + `docs/architecture/components` reader — **`T-111-s8`'s fix
  is real and the scanner gap it describes is a correct diagnosis, not a
  mis-read of the lane's own bug.** Three suites owed, all three run above.
- `lint:tokens` exit 0 clean (138 TOKEN files, 778 CONTROL) · `lint:docs` exit 0.
- **BOOT GATE — OWED AND NOT RUN BY THE LANE (F3). The integrator owes it.**

### THE TWO FORECASTS, RE-RUN AT REFS THE LANE NEVER SAW

**MERGE — GREEN AT BOTH.** Merged into a detached checkout at `15f0d7d`:
build 0, **1009/1009**. Re-merged at **`b3eaefe`** after T-134 landed:
parser build 0, parser **290/290**, app build 0, **app 1009/1009**, zero
startup errors on every run. The four restored declarations are in that tree
and no live-board body reds. **The suite asserts token MEMBERSHIP, never
counts** — cards carrying `touches:` moved 142 → 144 under it and nothing
noticed, which is the right design and I confirmed it rather than assuming it.

**GRAPH REGEN — THE CLAIM IS TRUE, VERIFIED ON THE MERGED TREE.**
`index --check` exit 1 (STALE, the real form: both counts and a file diff).
Committed sha256 **`b742efbe…`** as reported. Regenerated: 973907 bytes,
181 files, 2075 symbols, 1990 edges, **files +0 −0 ~2** (both `~`, neither
`+` nor `−`). **`npm test` from `app/` with the regenerated graph in place:
1009/1009, exit 0.** Restored with `git checkout --`, sha256 read back
**identical to `b742efbe…`**, `git status --porcelain` EMPTY. **So the
checkpoint owes NO fixture reconciliation, and that is now measured twice.**

### LIVE-ENVIRONMENT FACTS, WITH A CLOCK AND NEVER A COMMIT

Read **09:58Z**: **nine worktree entries, TWO lanes** (this one and
`task/T-134-path-fences`); four of the rest are this verification's own
detached scratch checkouts, and T-134's five were cleaned up between the
brief and this read. A path filter would report **six**. The brief said ten
entries and two lanes; the card says nine and three at 12:12 EEST. **All
three are true at their own moment** — which is exactly why
`T-111's OWN FENCE AND T-134's ARE DISJOINT` names two CARDS and asserts no
lane count. That judgement is correct and I verified the body makes it.
Port 1420's holder is node pid **46532**, cwd `/Users/ujju/Projects/nputer-app/app`
— a different checkout, so `integrator.md` rule 1 does not bind here. STATE's
recorded pid is stale, as the brief warned.

### WHAT REJECTION ASKS FOR — SIX ITEMS, ALL SMALL

1. Render `parserSaid` (or its `nearMiss`) into the `missing` clause, and
   fix the pin's title and comment, which currently assert the opposite.
2. Pin the COARSE-fence clause and the narrower-shared-path rule; A20b and
   A09 must red.
3. Run the BOOT GATE or declare it LOUDLY with its reason and exit code.
4. Re-derive the range at the tip this ships on, and correct the gate
   denominators that follow from it.
5. Clear `DECAY`/`stale` from `select-board.test.ts`'s title, comment and
   variable — the assertion is right, only the retracted word is wrong.
6. Correct "the four carried seven entries" (it is five) and "+48 −3"
   (it is +50 −3).

**NOTHING ABOUT THE DERIVATION ITSELF NEEDS TO CHANGE.** The census is
exact, the ruling is sound, the eight criteria are substantively built, the
merge and regen forecasts hold at refs the lane never saw, and every suite
and gate I could run is green. **The rejection is that four pieces of
shipped text state things that are not so, and that criterion 4's own two
headline reason clauses are encoded rather than defended.**

## Implementation notes — THE FIX PASS AFTER REJECTION (2026-08-26)

Executor `claude-opus-5 @T-111`, **a FRESH HAND as
`method/tasks/TASK-FORMAT.md` requires of a rejected card** — this seat
did not write the two lanes above and deliberately is not the session that
did. Lane `task/T-111-board-dispatchable`, worktree
`/Users/ujju/Projects/nputer-T-111`, rejected tip `75b7626` confirmed with
`git rev-parse`, main `6a6bc87` at the start and unmoved at the end.
Understanding was confirmed in one paragraph before a file was touched.

**THE TWO LANES' NOTES AND THE VERDICT ARE LEFT BYTE-UNTOUCHED, WITH ONE
EXCEPTION NAMED IN PLACE**: `edges +48 -3`, which fails its own arithmetic
against the 1990 printed one line above it. A figure that cannot be true
is not a record of what a session believed; it is a number the next
reader quotes.

**THE VERDICT IS RIGHT THAT NOTHING IN THE DERIVATION HAD TO CHANGE.** One
producer edit was made and it is the one the rejection asks for. Everything
else is a pin, a title, or a figure.

### THE SIX, EACH WITH THE MUTANT THAT NOW REDS IT

**Every arm below: PRODUCER mutated and never an assertion, substitution
count asserted `= 1`, mutation read back with `git diff` BEFORE the run,
exit read from `$?` unpiped, the `Tests N failed | M passed (T)` line
derived as well as the exit, each run swept for `Cannot find module` /
`Transform failed` / `Failed to load` at ZERO, and restored with
`git checkout --` and proved by sha256 against `git show HEAD:<path>` with
`git status --porcelain` EMPTY.** Detached worktree at `/private/tmp/t111p`
— **19 characters**, against `T-133-s5`'s bracketed 116–128 — with its own
install and `npm run build` first. Baseline **1013/1013, exit 0**.

| # | repair | arm | mutation | result | kills |
|---|---|---|---|---|---|
| 1 | the parser's sentence reaches the reader | **A31** | `if (said.length === 0)` -> `>= 0` (the quote never appends) | **exit 1**, 2 failed / 1011 passed | 2 |
| 2 | the COARSE clause is TEXT | **A20b** | `clash.viaComponents.length === 0` -> `>= 0` (clause deleted) | **exit 1**, 1 failed / 1012 | 1 |
| 2 | …and it is not unconditional | **A20c** | the same test -> `< 0` (clause always appended) | **exit 1**, 1 failed / 1012 | 1 |
| 2 | the NARROWER shared domain | **A09** | `pa.length >= pb.length` -> `<=` | **exit 1**, 1 failed / 1012 | 1 |
| 2 | component ids are sorted | **A28** | `.sort(byText)` dropped in `expandTouch` | **exit 1**, 1 failed / 1012 | 1 |
| 2 | …and so is the clash's copy | **A28b** | `.sort(byText)` dropped in `fenceClashes` | **exit 1**, 3 failed / 1010 | 3 |
| 6 | `disagrees` is read | **A24** | `row.state !== "live"` -> `false` | **exit 1**, 1 failed / 1012 | 1 |
| 5 | the renamed live-board body still kills | **A32** | `blockerStatus === "done"` -> `"verifying"` | **exit 1**, 2 failed / 1011 | 2 |

**EIGHT ARMS, EIGHT REDS, 0 STARTUP ERRORS, 0 ARMS RESTORED SHORT.** Six of
the eight kill exactly one body, which is the uniqueness measurement rather
than the claim. **A20c IS THE POSITIVE CONTROL A NEGATIVE ASSERTION NEEDS**:
the new body asserts three `not.toContain`s on a path-only clash, and
without an arm that makes the clause appear unconditionally those three are
satisfied by a producer that never emits it at all.

**1. THE PIN'S TITLE ASSERTED THE OPPOSITE, AND ITS FIXTURE COULD NOT HAVE
SHOWN THE HINT EITHER — WHICH THE VERDICT DID NOT NAME.**
`blockedReason` now quotes `parserSaid` VERBATIM and ATTRIBUTED
(`The parser says: "…"`), so the near-miss reaches the rendered reason
instead of stopping at a field. The title drops *"never a second one"*
because that clause is still false and SHOULD be: the board's ruling
sentence — *a defect in this card, not a reason to wait* — is what the
disposition/reason split owes a reader, and it belongs beside the quote.
**AND THE FIXTURE MOVED.** It declared `T-900` and dangled on `T-90`;
`idSlotKey` strips only LEADING zeros, so those are different slots and
the parser emitted **no near miss at all**. The body could not have shown
the hint reaching the reason even with the render present. It is `T-01`
beside a declared `T-001` now — T-076's own example and the pair the
verdict probed with — and `nearMiss` is asserted to be exactly
`["T-001"]`. A second body is the DISCRIMINATING control: `T-999` has no
padding twin, so the reason must quote a message carrying no such clause
and must NOT contain "zero padding". Without it, "the reason says zero
padding" is equally explained by this file composing that clause itself.

**3. THE BOOT GATE — RUN, NOT DECLARED.** It fires: 1 of 9 paths is under
`app/src/**`. `NPUTER_BOOT_PORT=15771 npm run boot:check` from `tools/e2e/`,
**exit 0**, and both `[nputer]` lines:

    [nputer] project folder: /Users/ujju/Projects/nputer-T-111
    [nputer] window "main" created

Port **15771** `lsof`-probed at **zero rows** immediately before binding and
**zero rows** after; the check stopped its own captured process group with
SIGTERM and no `pkill` was issued. **Port 1420 was read and never touched**:
`lsof -nP -iTCP:1420 -sTCP:LISTEN` at **10:34:59Z** gives node pid **46532**,
`lsof -a -p 46532 -d cwd` puts its cwd at `/Users/ujju/Projects/nputer-app/app`
— a different checkout, so `integrator.md` rule 1 does not bind here.

**4. THE RANGE, AT THE REF THIS SHIPS ON — AND IT MOVED UNDER ME ONCE,
WHICH IS THE HALF WORTH READING.** The rejection's item 4 is a range
written INTO the commit that added five paths to it. **The repair is
structural rather than careful**: every path is committed FIRST and the
range derived at that tip, so a section that then edits only files ALREADY
IN THE SET is a fixed point.

**THE STRUCTURE HELD AND MY FIRST DRAFT OF IT STILL WENT STALE.** This
section was first written naming tip **`c72e97a`** at **8** paths — and
then `T-111-s10` was filed, which is a NINTH path, and the eight became a
nine before the commit landed. **The number below is re-derived at the
tip that carries this sentence and the fixed point is checked rather than
argued**, because "I arranged it so it cannot drift" is exactly the claim
the rejected range also made.

    ref 6a6bc87 (main)                           tip 18c03b4
    git merge-tree --write-tree 6a6bc87 18c03b4 -> exit 0 READ FIRST, tree 8c95303c…
    git diff --name-only 6a6bc87 <TREE>              ->  9   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 6a6bc87...18c03b4 (THREE)   ->  9   AGREES, AND THE SETS ARE IDENTICAL
    git diff --name-only 6a6bc87..18c03b4  (TWO, FORBIDDEN) -> 31
    git diff --name-only 15a963d..6a6bc87 (main's advance)  -> 22

`diff` over the two sorted lists is **exit 0, EMPTY**; `comm -12` against
main's 22 is **EMPTY**; **9 + 22 = 31** is the arithmetic proving the
forbidden form's overstatement is pure left-endpoint drift. Ratio **3.44x**
— the ratio is weather, the left endpoint is the signal. **The gate
denominators DERIVED from that list, never from a remembered one**: DOCS
GATE **7 of 9** under `docs/`, GRAPH REGEN **2 of 9** `.ts` outside
`docs/`, BOOT GATE **1 of 9** under `app/src/**`. **The commit carrying
this paragraph edits only this card, which is already path 9**, so the set
does not move again — verified by re-deriving at that tip and comparing the
sorted lists, not by asserting it.

**5. THE RETRACTED WORD IS OUT OF THE SUITE.** Title, comment and variable:
`THE DECAY IS REAL HERE` -> `LANDED BLOCKERS ARE DECLARED HERE, and the
derivation asks their status rather than the field`; *"a corpus with no
stale entries"* -> *"a corpus carrying no such entry"*; `const stale` ->
`const landed`. **The assertion and its positive control are byte-unchanged
and arm A32 proves the body still kills.** Swept with `command grep` over
both files: the only surviving `stale`/`decay` are the `died` body's own
FORBIDDEN-WORD LIST (which must contain the word to forbid it), this card's
record of what was retracted, and `board-model.ts` quoting
`executor.md` row 5's *"prose that goes stale"* — a different sense.

### THE FENCE-RULE DUPLICATION — RULED, AND THE DIVERGENCE MEASURED FIRST

**T-134 merged at `520e93e` and `lib/parser/src/fence.ts` is EXPORTED from
the parser's index, which `@nputer/parser` already is a dependency for — so
importing it is a READ inside this fence and never a widening.** The
question was live and it was decided by measurement, not by the fence.

Both implementations were run over the live board on the merged tree — 27
distinct raw tokens over 304 cards, and the whole pairwise matrix over the
147 cards carrying a fence. **`T-111-s5` carries the full table.** The
short form: **0 of 27 normalisation disagreements**, 3 of 27 token-KIND
disagreements (`ci`, `docs`, `method`, all on `T-054`), **113 of 10 731
pairs disagree and every one is a pair against `T-054`**, and the
narrower-domain rule **AGREES** on `docs` x `docs/CONVENTIONS.md`.

**NOT IMPORTED, FOR THREE REASONS AND NONE OF THEM IS THE FENCE:**

1. `compareFences` has a THIRD verdict, `unusable`, which its own doc
   forbids folding into `disjoint`. **Criterion 1 closes this card's
   disposition vocabulary at SIX.** Consuming it faithfully needs a
   seventh value — a criteria change, which an executor may not make.
2. `expandFence`'s oracle is `knownPaths`, and its doc calls that *"the
   ONLY way this module can tell a bare directory token from a word that
   names nothing"*. **`selectDispositions` is a pure function of the
   parsed model and has no filesystem.** With the oracle supplied the
   `docs` pair comes back `overlapping` and the two agree exactly — so
   **the 113 are an ORACLE GAP, not a rule disagreement**, which is a
   better answer than either card had.
3. `FenceWitness` carries `{left, right, path}` and **no component ids**,
   so the `fenced` reason could no longer say *"both expand through C-11,
   so this may be the COARSE fence"* — **the clause this card's section
   (b) demands and whose absence is half of what rejected the first
   pass.** `T-111-s5` predicted this in advance: *"it needs the
   provenance, not the verdict."*

**AND THE DIVERGENCE IS DORMANT TODAY, MEASURED RATHER THAN HOPED.**
`T-054` is the only card in the vocabulary carrying a bare word and it is
**`done`** — never in flight, never a candidate — so none of the 113 pairs
can reach a live dispatch. `UNFENCEABLE_PATHS` is dormant too: **no live
token normalises to `docs/tasks`** (the three `docs/tasks/…` tokens on the
board are individual FILES, which T-134 permits). **Merging this card puts
a fourth spelling of the fence rule in the tree until `T-137` lands, and
that debt is recorded rather than argued away.**

### SUITES AND GATES — every exit from `$?` unpiped, every count derived too

At `c72e97a` in this worktree unless stated.

- **app `npm run build` exit 0** · **`npm test` 1013 / 1013 across 47
  files, exit 0.** Four new bodies against the rejected tip's 1009.
- **parser `npx vitest run` 268 / 268 across 12 files, exit 0.**
- **`cargo test --no-fail-fast` 512 passed / 0 failed / 3 ignored, exit
  0**, summed over **SIXTEEN** `test result:` lines. NOT owed by the DOCS
  GATE on this diff; run anyway.
- **tools/e2e `npm test` — 3 FAILED / 191 passed, exit 1 on the first run;
  194 passed, exit 0 on the second. BOTH DECLARED, NOTHING DISCARDED, AND
  THE RED WAS MINE.** Scratch ports **15883** then **15884**, each
  `lsof`-read at zero rows immediately before binding and zero after. See
  the NUL section below: all three reds were one edit of mine, and one of
  them impersonates a known flake (`T-111-s9`).
- **`lint:tokens` exit 0 clean** — 138 TOKEN files, **778** CONTROL
  tracked text files · **`lint:docs` exit 0.**
- **BOOT GATE — FIRES (1 of 9), exit 0**, both lines quoted above.
- **DOCS GATE — FIRES, exit 1, 7 of 9 paths under `docs/`.** **15 derived
  readers across 4 suites**, root-anchor account **6**, census 133
  docs-shaped sites in 23 files, **0 frontmatter issues**, and
  `app/test/select-board.test.ts` still derives as a `docs/tasks` +
  `docs/architecture/components` reader — `T-111-s8`'s fix survives this
  pass. Three suites owed, all three run above.
- **GRAPH REGEN — FIRES (2 of 9), ASKED AND NOT PREDICTED, TWICE.**

### THE REGEN — AND THE LANE'S FORECAST WAS MEASURED AGAINST A GRAPH THAT NO LONGER EXISTS

**`b0416e9`, main's own T-134 checkpoint, REGENERATED `graph.json`.** The
committed graph is **`616205de…`**, not the `b742efbe…` both the lane and
the verdict measured against. So the forecast above is a true statement
about a baseline that left main, and it was re-measured on the tree that
actually ships:

    at this lane's tip (committed b742efbe…, 181 files, 1943 edges)
      files +0 -0 ~2   edges +50 -3   fresh 973930 bytes
    MERGED with 6a6bc87 (committed 616205de…, 183 files, 1986 edges)
      files +0 -0 ~2   edges +50 -3   fresh 989181 bytes · 183 files · 2101 symbols · 2033 edges

`1986 + 50 − 3 = 2033` closes. **`npm test` from `app/` with the
REGENERATED graph in place on the merged tree: 1013 / 1013, exit 0.**
Restored with `git checkout --`, sha256 read back **`616205de…`**,
`git status --porcelain` EMPTY. **So the claim holds at the ref that
matters, and `+48 −3` was wrong at every ref.**

**AND THE FIRST MEASUREMENT OF IT WAS WRONG IN A WAY WORTH ITS OWN CARD.**
Run with `CARGO_TARGET_DIR` INSIDE the worktree — which is exactly what
`docs/CONVENTIONS.md`'s POISON DRILL arm (c) instructs — the gate reported
**`files +3 -0 ~2` and `edges +51 -3`**, the three being
`.fctarget/debug/build/serde*/out/private.rs`. The walk excludes `target/`
and nothing else. **`files +0 -0` is the sentence a checkpoint decides on,
and following a standing rule inverts it.** `T-111-s10`.

### THE MERGE FORECAST, AT A REF NEITHER EARLIER SEAT SAW

Merged into a detached checkout at **`6a6bc87`**: parser build 0, parser
**290 / 290** (T-134's `fence.test.ts` adds 22 to this lane's 268), app
build 0, **app 1013 / 1013**, zero startup errors on every run.

### THE TWO NUL BYTES — MINE, AND THEY BEAT EVERY GATE BUT ONE

**I typed a sentinel and the byte that landed was `U+0000`.**
`toContain(emitted[0]?.message ?? "<NUL>never")`, twice, at bytes 67908 and
69367 of `select-board.test.ts`. A NUL inside a JS string literal is a
valid string, so **`npm run build` exited 0, the app suite went 1013/1013,
and all eight poison arms ran clean over it.** `lint:tokens` P5 is the only
check in this repository that saw it — that rule's own stated rationale
arriving on its author.

**IT ANNOUNCED ITSELF ONCE BEFORE I UNDERSTOOD IT AND I MIS-READ THE
ANNOUNCEMENT.** Arm A31's log came back `Binary file … matches` where the
test counts should have been, so that arm briefly had **an EXIT with no
COUNT** — the exact shape this project forbids reading a drill by. It was
caught because the count was demanded a second time with `grep -a`, not
because anything failed. **A log that answers "Binary file matches" is a
measurement that did not happen.**

The sentinel is gone rather than respelled, because it guarded a real
hazard the wrong way: **`toContain("")` is true of every string**, so an
empty message would have made the assertion vacuous rather than red. It is
now an explicit `said.length > 0` before the `toContain`.

### WHERE THE VERDICT AND THE BRIEF WERE WRONG

1. **THE VERDICT, its correction to `T-111-s7`.** *"as of `520e93e` there
   are FOUR derivations, not two."* `520e93e` is T-134's merge and its whole
   content is `fence.ts`, which matches `blocked` **ZERO** times. That
   module cannot have moved a count of blocker-binding derivations. **The
   four-derivation fact is the FENCE rule's** and the same verdict states
   it correctly under F7; it was attached to the wrong card. Re-derived at
   `6a6bc87`: **three sites RESOLVE a `blocked_by` id, two deliver a
   VERDICT on whether it binds.** `TaskDetailPanel.tsx` re-derives nothing,
   `TasksLens.tsx` holds no `blockedBy` reference, `dispatch-brief.mjs`
   matches `blocked` zero times.
2. **THE VERDICT AND THE BRIEF, the fence divergence.** Both name
   *"`docs/tasks` is unfenceable in the merged module and handled by
   containment in yours"* as the live semantic divergence. **It is
   dormant** — no live token normalises to `docs/tasks`. The divergence
   that is live is the **BARE-WORD ORACLE**, 113 of 10 731 pairs, all on
   `T-054`'s `docs` / `method` / `ci`, and it is a resolvability gap rather
   than a disagreement about the rule.
3. **THE VERDICT, F1 — the pin was weak in a SECOND way it does not
   name.** The fixture (`T-90` against a declared `T-900`) is in a
   different id slot, so no near miss was ever emitted; the verifier had to
   build its own fixture to probe it and did not report that the shipped
   one could not.
4. **THE LANE AND THE VERDICT, the regen baseline.** Both measured against
   committed `b742efbe…`. `b0416e9` replaced it with `616205de…` before
   this pass started. The conclusion survives; the baseline does not.
5. **THE BRIEF, "a UI spec passes at 116 chars and reds at 128".** Both
   scratch worktrees here are **19 characters** and neither approached it.
   The trap the brief named is real and none of this pass's four measured
   traps were on its list.
6. **THE ENVIRONMENT, and it silently un-did a sweep.** `grep` in this
   session's shell is a FUNCTION shimming to `ugrep --ignore-files`. It
   returned **no hits** for `lapsed`, `abandon` and `stale` in a tracked
   file that contains all three, on the very sweep meant to prove the
   retracted vocabulary was gone — a clean exit that would have shipped a
   false "the word is gone". `command grep` finds them. **Every sweep in
   this pass was re-run with `command grep`**, and a sweep is not a sweep
   until its own positive control has fired.
7. **THE CARD, header citation — STILL UNFIXED AND DELIBERATELY.**
   `method/roles/orchestrator.md:16` is a LINE citation where CONVENTIONS
   requires a SYMBOL; the first lane flagged it and the body quotes step 4
   correctly. It sits in the card's SPEC, which is the architect's text,
   and rewriting a spec from inside a lane is not this seat's to do.

### FOR THE VERIFIER — WHAT MOVED, IN ONE PARAGRAPH

**ONE PRODUCER EDIT** (`blockedReason` quotes `parserSaid`), **six new or
retitled bodies**, one variable and two comments renamed, four figures
corrected, two suggestion files added, and every arm the rejection named
now reds with its restoration proved. **Nothing in `selectDispositions`'s
control flow, the six dispositions, the three bindings, the ruling on a
dangling blocker, or the census moved** — the verdict re-derived the census
independently and agreed on every row, and none of those rows is touched
here. `status:` stays `verifying`; `verifier:`, `built_by:`, `verified_by:`
and `review:` are untouched and empty.

## ADVERSARIAL RE-CHECK — APPROVED (2026-08-26, tip `70dbf83`)

Same verifier, same attack set, re-run at the shipping tip in a fresh
detached worktree (`/private/tmp/t111z`, 18 chars). My verdict commit
`75b7626` is still an ancestor — confirmed with `merge-base --is-ancestor`
— so the base is untouched and the merge stays a forecast.
**Baseline 1013/1013, exit 0, zero startup errors.**

### ALL SIX REPAIRS VERIFIED, FIVE OF THEM BY MUTATION

**1. THE NEAR-MISS NOW REACHES THE READER — PROVED END TO END, NOT READ.**
My own probe on the fixed tree:

    NEARMISS  ["T-001"]
    REASON    "T-900 names T-01 as a blocker and no card declares that id —
               that is a defect in this card, not a reason to wait. The parser
               says: "… 'T-001' is declared and differs only in zero padding …"."
    CONTROL   T-999, no padding twin -> reason carries NO "zero padding" clause

Arm **V1** (drop the appended sentence) and **V2** (append a TEMPLATE
sentence instead of the parser's) each red **2 bodies**. V2 is the one that
matters: it proves the pin checks the PARSER's sentence rather than the
presence of any sentence.

**2. ALL FOUR OF MY SURVIVORS NOW RED.** Producer-side only, substitution
count = 1, `git diff` read back before each run, restored and sha256-proved.

| arm | before | now |
|---|---|---|
| A09 narrower shared domain inverted | exit 0, 1009/1009 | **exit 1, 1 kill** |
| A20b coarse clause forced empty | exit 0 | **exit 1, 1 kill** |
| A20c coarse clause made UNCONDITIONAL | — | **exit 1, 1 kill** |
| A24 `disagrees` forced false | exit 0 | **exit 1, 1 kill** |
| A28 componentIds sort dropped | exit 0 | **exit 1, 1 kill** |

**A CORRECTION TO MY OWN RE-RUN, CAUGHT BY POSITIVE CONTROL.** My first
A20b at this tip came back exit 0 and I nearly reported a survivor. The
mutation was `const via = "" || (…)` — **`""` is falsy, so the operator
returns the original expression and the mutation is a no-op.** Re-applied
as `const via = "";` it reds. **An arm that does not change behaviour is
not evidence of a pin**, and only reading the diff back caught it.
`disagrees` is now asserted in BOTH directions (`[false]` for `live`,
`[true]` for the disagreement), which is what discharges it as dead data.

**3. BOOT GATE — RUN, exit 0, 1 of 9.** **4. THE RANGE — re-derived at the
tip that carries it**, and nine is right (see below). **5. THE RETRACTED
FRAMING IS GONE**: the body is now `LANDED BLOCKERS ARE DECLARED HERE, and
the derivation asks their status rather than the field`, the variable is
`landed`, and the old wording survives only inside a comment that
*documents* the retraction — which is the right place for it. The remaining
`stale` in the file is the forbidden-vocabulary sweep list, where it belongs.
**6. THE FIGURES** are corrected in place with the arithmetic shown.

### THE THREE CORRECTIONS TO ME — ALL THREE CHECKED, ALL THREE ACCEPTED

**(a) MY `T-111-s7` CORRECTION WAS WRONG.** `git show main:lib/parser/src/fence.ts`
matches `blocked|blocker` **zero** times. I carried the FENCE-rule count of
four into a ruling about the BLOCKER rule. Re-derived: **three sites resolve
a blocker id** (`task-detail.ts`, `board-model.ts`, `task-waves.ts`) and
**two deliver a verdict** (`board-model.ts`, `task-waves.ts`).
`s7` stands as written; my correction to it does not.

**(b) THE LIVE FENCE DIVERGENCE IS THE BARE-WORD ORACLE, NOT
`UNFENCEABLE_PATHS`.** Measured: **27 distinct live tokens, and bare
`docs/tasks` is not one of them**, so `UNFENCEABLE_PATHS` matches nothing —
dormant, exactly as claimed. The real divergence is `ci`, `docs`, `method`,
all on `T-054`, which is `done`.

**(c) THE GRAPH BASELINE MOVED UNDER BOTH OF US.** `b0416e9` replaced
`b742efbe…` with `616205de…`. **Re-measured on a tree merged with current
main**: committed 970961 bytes · 183 files · 2064 symbols · 1986 edges;
fresh 989181 · 183 · 2101 · 2033; **`files +0 −0 ~2`, `edges +50 −3`**
(1986 + 50 − 3 = 2033, which closes). **`npm test` from `app/` with the
regenerated graph: 1013/1013, exit 0**; restored and sha256 read back
**`616205de…`**, porcelain EMPTY. **The conclusion survives the new
baseline: the checkpoint owes NO fixture reconciliation.**

### THE `fence.ts` DECISION — INDEPENDENTLY MEASURED, AND THE DECLINE IS RIGHT

Both implementations run over the live board on the merged tree:

    distinct tokens                     27
    normalisation disagreements       0 of 27
    token-kind disagreements          3 of 27   ci, docs, method  (mine `path`, theirs `unresolved`)
    pair disagreements                every one involves T-054, which is `done`

**My pair arithmetic differs from the lane's** — I count 11 026 pairs and 34
disagreements against its 10 731 and 113, because I passed `ownFile: ""` and
filtered to id-bearing cards with a non-empty fence. **The load-bearing
claim is identical and I confirm it: every disagreeing pair is a `T-054`
pair, and the cause is the oracle, not the rule.** `expandFence`'s own doc
comment names the same three tokens.

**AND THE THIRD REASON IS ONE MY OWN REPAIR CREATED.** `FenceWitness` carries
`left`, `right`, `path` and **no component ids**, so importing `compareFences`
would delete the COARSE-fence clause that repair 2 has just pinned in two
directions. `FenceVerdict`'s third value `unusable` is real and the
six-value disposition cannot express it. **Declining to import is correct,
and it is measured rather than argued.**

### THE `grep` SHIM — REPRODUCED, WITH A ROOT CAUSE

The shim is real and its flags are the answer. From the snapshot:

    ARGV0=ugrep "$_cc_bin" -G --ignore-files --hidden -I --exclude-dir=.git …

**`-I` means SKIP BINARY FILES, and one NUL byte makes a file binary.**
Two files, same three words, one carrying `\0\0`:

    SHIM grep     clean=1  withnul=NO MATCH   (all three words)
    command grep  clean=1  withnul=1          (all three words)

**That is the executor's report exactly**, and it is why it could not be
reproduced on normal files: the shim and `command grep` agree on everything
that is not binary. **The trigger was the lane's own NUL bytes** — the two
findings are one event, and a `grep` sweep over a NUL-bearing file returns
"no matches" with no error and exit 1. `--ignore-files` is a second, distinct
blind spot; it is inert here (`git ls-files | git check-ignore --stdin`
returns **0**). **At `70dbf83` exactly 18 tracked files carry a NUL and all
18 are icons and fonts** — no source or test file does, so the repair landed.

### SUITES, GATES AND THE RANGE

- app **1013/1013** exit 0 at the tip, and **1013/1013** merged with current
  main · parser **290/290** merged · **tools/e2e 194 passed, exit 0, FIRST
  RUN**, scratch port **15995** probed at zero rows immediately before
  binding · **`lint:tokens` exit 0, clean** — P5 sees no NUL, which is the
  gate that caught them · DOCS GATE fires, three suites owed, all three run.
- **THE RANGE, AT MY OWN REF `6a6bc87`** (main moved twice more during this
  re-check — `b0416e9` then `6a6bc87`):

      git merge-tree --write-tree 6a6bc87 70dbf83 -> exit 0 READ FIRST, tree 967ad5d4…
      git diff --name-only 6a6bc87 <TREE>            ->  9   PRESCRIBED
      git diff --name-only 6a6bc87...70dbf83 (THREE) ->  9   AGREES, SETS IDENTICAL
      git diff --name-only 6a6bc87..70dbf83  (TWO, FORBIDDEN) -> 31
      git diff --name-only 15a963d..6a6bc87 (main's advance)   -> 22

  `comm -12` EMPTY, 9 + 22 = 31. **Nine is right.** Ratio 3.44x — weather;
  the left endpoint is the signal, and it moved four times across both passes.

### VERDICT

**APPROVED.** Every finding my rejection named is discharged by a mutant
that reds rather than by a sentence saying it is fixed, and the two claims I
got wrong are corrected against the tree rather than conceded. The census,
the disposition/reason split and the parser work are byte-untouched apart
from the six, and I re-confirmed the census is unmoved. **`T-111-s9` and
`T-111-s10` are the right shape** — both are gaps in the METHOD found by
obeying it, and `s9`'s camouflage finding (a whole-corpus assertion redding
three bodies from one planted violation, one of them impersonating
`T-120-s3`) is the more dangerous of the two, because it teaches a reader to
discount a real red.

## Integration

Merged at **`f3a4233`** into main-before **`6bec5a2`**, checkpointed
separately on top. Lane tip **`a80870b`** — derived with `git rev-parse`,
and it is the **RE-CHECK VERDICT** commit rather than the last work commit
`70dbf83`. Integrated by a third `claude-opus-5` session that neither wrote
nor reviewed the lane's commits; `review: same-model`, and the
`Co-Authored-By` trailer on those commits is a harness constant and is NOT
evidence of a model.

**THE FORECAST TREE IS THE MERGE'S TREE.** `git merge-tree --write-tree
6bec5a2 a80870b` returned exit **0** (read from `$?` FIRST) and tree
**`09a8279e`**; the merge commit's own tree is **`09a8279e`**. No conflict,
no resolution. Parents are `6bec5a2` and `a80870b` and nothing else.

**THE RANGE, at `6bec5a2`:** prescribed **9**, three-dot **9** with the
sorted sets IDENTICAL (`diff` exit 0), two-dot **47** forbidden, main's
advance since the lane's base **38**, `comm -12` over the two sorted lists
**EMPTY**, and **9 + 38 = 47** — the overstatement is pure left-endpoint
drift. The FORBIDDEN merge-base form `15a963d..a80870b` also returns **9**
here, which is luck and not licence: `15a963d` happens to be an ancestor of
`a80870b`. `main..HEAD` returns **0**.

**SUITES on the merged tree**, every exit read from `$?` unpiped and the
COUNT derived as well as the exit: parser build 0, `tsc --noEmit` 0, parser
**290/290** across 13 files; app build 0, **`npm test` 1013/1013** across 47
files (main's own baseline at `6bec5a2` was **973/973**, so this merge adds
**40** bodies); `cargo test --no-fail-fast` **512 passed / 0 failed / 3
ignored** over SIXTEEN `test result:` lines, with sixteen `running N tests`
headers summing to **515 = 512 + 3**; `tools/e2e` **194/194, exit 0, FIRST
RUN, 2.2m** on explicit port **15871**.

**GATES.** **BOOT GATE FIRES — 1 of 9 (`app/src/lib/board-model.ts`), RUN,
exit 0**, on scratch port **15872**, both `[nputer]` lines read:
`project folder: /Users/ujju/Projects/nputer` and `window "main" created`.
**This is the finding the rejection's item 3 was about, discharged at the
merge as well as in the lane.** **DOCS GATE FIRES — exit 1, 7 of 9**, with
**16 derived readers across 4 suites** (up from 15; the sixteenth is
`app/test/select-board.test.ts`, which this merge makes derivable —
**`T-111-s8`'s fix landing on main**), census 133 sites in 23 files, **0
frontmatter issues**, 6 root-anchored all argued, 0 unlinked. **GRAPH REGEN
FIRES — 2 of 9 — and was ASKED rather than predicted**, twice before the
doc writes and again after: STALE → **`files +0 −0 ~2`, `edges +50 −3`**
(1986 + 50 − 3 = 2033, which closes) → regenerated → CURRENT.

**THE `+50 −3` THE REJECTION'S ITEM 6 ASKED FOR IS CONFIRMED AT A THIRD
BASELINE.** The lane and the first verdict both measured against committed
`b742efbe…`; `b0416e9` replaced it with `616205de…`; this merge measured
against `616205de…` and got the same `+50 −3` and the same `files +0 −0 ~2`.
**And the no-reconciliation conclusion was not inherited — it was
re-derived**: `npm test` from `app/` **with the regenerated graph actually
in place** is **1013/1013, exit 0**, so no fixture moves.

**THE `fence.ts` DUPLICATION IS A MEASURED DECLINE AND IS NOT A DEFECT OF
THIS MERGE.** `T-111-s5` is the move list, `T-137` is the vehicle, and the
three reasons the verifier confirmed independently stand: `compareFences`
has a third verdict (`unusable`) the six-value disposition cannot express,
which is a criteria change an executor may not make; `expandFence`'s oracle
needs a filesystem `selectDispositions` does not have; and `FenceWitness`
carries no component ids, so importing would DELETE the coarse-fence clause
that repair 2 has just pinned in two directions. Every disagreeing pair
involves `T-054`, which is `done`, so the divergence is dormant.

**THE TRIPWIRE THE VERDICT WARNED ABOUT HAD ITS FIRST LIVE REHEARSAL THREE
HOURS BEFORE THIS MERGE, AND PASSED.** The verdict noted that
`a dangling blocker` fires "the day a card's blocker is moved to
`rejected/`, which is routine triage". The eleventh triage (`6bec5a2`)
removed **16** cards from `docs/tasks/` — including this card's own
`T-111-s1`, `T-111-s3` and `T-111-s4` — and nothing redded, because not one
of the 16 is named as a blocker. Re-derived through the parser at this
merge: **51 `blocked_by` entries over `docs/tasks/`, 48 whose blocker is
`done`, 3 open, ZERO dangling.**

**WHAT THIS MERGE RELEASES.** `T-111`'s fence expands to **36 paths** and
overlaps **20 of the 36 other open fence-carrying cards** — and, derived
through `fence.ts`, **every one of the 20 is visible on TOKENS**: `T-111`
appears in ZERO of the board's 25 flip pairs. So the fence census reads
**36 cards · 630 pairs · 25 flips · 0 reverse** after the stamp, against 37
· 666 · 25 · 0 before it — **the flip total does not move, and this time
that IS evidence that nothing moved**, which is the exact opposite of
`T-134`'s checkpoint, where an unmoved total concealed a complete change of
pairs.

`T-111-s9` and `T-111-s10` are carried to the backlog unrepaired: both are
`[tools/e2e]` / `[docs/CONVENTIONS.md]`, outside this card's fence.
