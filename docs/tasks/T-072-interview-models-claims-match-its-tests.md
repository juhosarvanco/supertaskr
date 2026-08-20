---
id: T-072
title: interview-model's claims match its tests — a non-duplicate positive, an identity restored, a header made true
feature: F-03
milestone: 4
priority: 15
size: S
status: done
blocked_by: []
touches: [app-interview]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-072
verified_by:
review: self-verified
---

Absorbs: T-057-s1, T-057-s2, T-057-s3, T-057-s4 (fourth triage,
2026-08-19). The suggestion files are removed in the same commit as this
card. All four live in `app/src/genesis/interview-model.ts` and
`app/test/interview-model.test.ts`, and one pass closes all four.

T-057'S OWN RECURSIVE FINDING, and it is the sharpest of the four. The
card that removed the `f(x) === f(x)` tautology replaced it, per its
criterion 3, with a test that is byte-equivalent to one three cases
above it in the same `describe`: same `bank()` helper, same seq, same
`at`, same prime tree, same matcher, same expected value. The only
difference is an inert content string, and no code path reads it
differently — `bankedSince` compares against `undefined` in both cases,
so both take the identical absent-to-present branch. **Measured:**
rewriting the newer test's content string to match the older one makes
the two calls character-for-character identical and the file still
passes 58 of 58. It kills no mutant of its own; it stayed green under
the rebaselining mutant and under the deleted different-project guard.
The tautology did not go away — it moved from inside one test to across
two.

**This is poison shape SIX and it belongs in T-078's drill clause**: a
body that reds under an expected-value poison while killing no mutant
another test does not already kill. It is not vacuous in the poison
sense, which is exactly why T-057's own poison discipline passed it.
Worth saying plainly: the criterion ASKED for this. It named as its
honest positive a property the suite already had, and the executor
implemented the criterion literally.

THE RELOCATION ALSO MOVED WHERE THE BASELINE LIVES. Before, the baseline
was a `useRef` mutated without a re-render and the early return called
no setter at all. After, both live in one `useState` and the transition
returns a fresh object whenever the baseline advances even when nothing
chips — and a fresh object literal is never `Object.is`-equal to the
previous one, so React does not bail out. Two paths gained renders, not
one: the nothing-banked path and the file-changed-twice-in-one-turn
path. `InterviewChat` has an effect keyed on `transcript`, which is
recomputed unmemoised on every render, so each added render also fires
the auto-scroll write. Bounded, not user-visible — and a regression in
the exact direction T-056 exists to move, landed by a card whose subject
is tests.

## Acceptance criteria
- THE duplicate positive SHALL either be DELETED, with the existing test
  three cases above it renamed to carry the positive half, or be given a
  shape the suite does not already drive. Whichever arm is taken, the
  surviving test SHALL be proved to kill a mutant NO OTHER TEST IN THE
  FILE kills, and that proof SHALL be recorded — a replacement that
  merely reds under a value poison repeats the finding.
- `observeBanking` SHALL restore the render identity the relocation
  lost: return the PREVIOUS observation when `chipsByTurn` did not
  change, carrying the advanced baseline without forcing a new state
  object — or split the return so a baseline advance does not force one.
  Criterion 1 of T-057 (ONE pure transition, shared by chat and tests)
  SHALL stay intact; this is not a request to put the rule back in the
  component.
- THE render count SHALL be pinned, not argued: a quiet snapshot (seq
  advances, docs contents unchanged, nothing banked) SHALL be shown to
  produce no additional render, and the pin SHALL fail if the identity
  is dropped again.
- THE module header's rule 1 SHALL stop saying "deliberate AND TESTED"
  about the hand-written-file property whose test T-057 deleted. The
  property is still true by construction — the only input is the
  watcher's snapshot, which is the type-level argument the same sentence
  already makes — so the honest text drops "and tested", or names the
  surviving negative test (activity labels and completed text naming
  docs paths produce ZERO chips) as what backs it.
- THE project-switch test SHALL not read as more than it proves. Its
  `switched: undefined` half is held by the STALE-SNAPSHOT guard, not by
  the different-project guard its name implies: measured, deleting the
  project guard reds two OTHER tests and leaves this one green. This is
  a TENSION, not a mistake — the equal and lower watermarks are what
  make the other half isolate the project clause, and at a higher switch
  seq the rebaselining would happen anyway. A comment beside the
  assertion, or a third arm at a higher seq asserting the switch
  produced no chip FOR THE PROJECT REASON, SHALL close the gap.

Verification: headless app Vitest. Poison discipline applies to every
changed assertion, and per T-078's clause the mutation SHALL be
one-sided — never a literal the producer and the assertion share.

## Implementation notes

Built by `claude-opus-5 @T-072` in worktree `../nputer-T-072`, branch
`task/T-072-model-claims`, cut from **`e83ee1d`**. Size S, so this
executor stamps `done` and runs the adversarial pass on its own work
(`method/roles/executor.md`); no verifier, no separate integrator.

**THE BRANCH POINT WAS CHECKED RATHER THAN TAKEN.** The dispatch rule
says cut from the newest `Checkpoint:` commit, which is `825932c`;
`e83ee1d` is two commits later. `git diff --name-only 825932c..e83ee1d`
(TWO dots, and legitimate here because
`git merge-base --is-ancestor 825932c e83ee1d` exits 0) returns **1
path**, `docs/design/cross-harness-plan.md`. Docs-only, so no graph
trigger is inherited and the rule's hazard — a lane cut from a tree whose
graph the checkpoint has not regenerated — does not apply.

### Criterion 1 — the duplicate positive, and the mutant that isolates its replacement

**THE DUPLICATE WAS RESHAPED, NOT DELETED** (the criterion's second arm).
`a docs snapshot during an active turn produces a chip` was T-057's
replacement for the `f(x) === f(x)` tautology it removed, and the card is
right about what it is: it drives `bank([{ seq: 2, files: {
"docs/NORTH_STAR.md": "written" }, at: 1 }], docs(1, {}))` against `a file
that lands AFTER completed still belongs to that turn` three cases above,
which drives the identical call with `"v1"` for `"written"`. Read at
`e83ee1d`: same helper, same seq, same `at`, same prime tree, same
matcher, same expected array; the variable name and the content string
are the whole difference, and no branch reads either.

**THE FIRST ARM WAS CONSIDERED AND REJECTED ON EVIDENCE.** Deleting the
duplicate and renaming the test above it makes that test the survivor,
and criterion 1 then demands an isolating mutant for IT — which it does
not have. Its script's first step is byte-identical to the opening step
of `a file that changes TWICE between turns produces ONE chip` and of `a
write that lands after the NEXT turn started attributes to the new turn`,
so a mutation that breaks its expected value breaks theirs. Two probes of
that shape were reasoned through (`docs.seq <= baseline.seq + 1`, and a
poisoned `?? []` default) and both take at least two bodies with them.
**A criterion that cannot be satisfied by the arm you took is not a
finding about the criterion; it is the arm telling you which one it is.**

**THE SHAPE THE SUITE DID NOT DRIVE.** Every `bank()` body in this file
banks once per turn, or banks the SAME path twice — `a file that changes
TWICE` reaches `observeBanking`'s union with nothing to add, so
`merged.length === existing.length` takes the early return and the union
never runs. Nothing in the file, at either ref, drives **a second banking
into a turn that already has one**, so the ORDER the union is put in was
pinned nowhere. `bankedSince` sorts its own answer and that sort IS
pinned (`the result is sorted and deduped`), but that is a different sort
in a different function, and the row a reader sees is the ACCUMULATED
set. The replacement drives `docs/ROADMAP.md` then `docs/ARCHITECTURE.md`
and requires the row to read `["docs/ARCHITECTURE.md",
"docs/ROADMAP.md"]` — arrival order reversed, and a cardinality of two,
so the first chip is also proved to have survived the second observation.

**THE ISOLATING MUTANTS, AND THE PROOF IS OVER THE WHOLE SUITE RATHER
THAN THE FILE.** The criterion asks for a mutant no other test IN THE
FILE kills; both of these are killed by no other test in the app suite,
which is the stronger claim and costs the same run.

| mutant | one-sided change to the code under test | result |
|---|---|---|
| **M1** | `observeBanking`'s `[...new Set([...existing, ...banked])].sort()` loses its `.sort()` | **1 failed / 832 passed of 833**, `exit 1` — the new body ALONE |
| **M2** | `chipsByTurn.set(turn, merged)` becomes `set(turn, banked)` | **1 failed / 832 passed of 833**, `exit 1` — the new body ALONE |

Both were counted (`SUBSTITUTIONS=1`), **both were read back with `git
diff` before the suite ran**, and both were restored with the sha256
proof below. M1 is the sharper of the two because it is a mutation no
type system and no cardinality check can see: the row still holds the
right two paths, in the wrong order, and only this body looks.

### Criteria 2 and 3 — the render identity, and the count that holds it

**THE TRANSITION DID NOT MOVE. THE STORAGE DID.** T-057 criterion 1 —
ONE pure transition shared by the chat and the tests — is intact, and
that is measured rather than argued: **`app/src/genesis/interview-model.ts`
is a COMMENT-ONLY diff across this whole branch.** Every added and
removed line in `git diff e83ee1d..HEAD -- app/src/genesis/interview-model.ts`
is a comment line; filtering them out leaves the diff empty (`grep` exit
1). `observeBanking`, `bankedSince`, `bankBaseline` and the two constants
are byte-identical, so the shared rule cannot have drifted. What changed is which HALF of
its result React is asked to hold. `chipsByTurn` is the render;
`baseline` is bookkeeping no render reads. A quiet snapshot MUST advance
the baseline and cannot avoid allocating one, so an observation object is
not a safe unit of React state — which is exactly what T-057-s2
described. `InterviewChat` now holds the observation in a `useRef` and
puts only `chipsByTurn` in `useState`. That is criterion 2's second arm
("split the return so a baseline advance does not force one") taken
literally.

**WHY NOT THE FIRST ARM, STATED BECAUSE IT LOOKS EASIER.** "Return the
previous observation when `chipsByTurn` did not change" is not
behaviour-preserving. Nothing banked does NOT mean nothing moved: a
DELETION changes the tree and banks nothing (`a DELETED file does not —
a deletion is not a banking`), so a baseline that keeps the vanished
path would refuse the chip when the file returns with its old content;
and a PROJECT SWITCH banks nothing and must rebaseline unconditionally,
which is what `rebaselines a project switch before banking the next
change` holds. A conditional "return previous when the advance is
observationally equivalent" was drafted and dropped: it costs a map
comparison on every snapshot and it silently weakens the seq watermark.

**THE CONTRACT THE SPLIT RESTS ON WAS ALREADY TRUE AND IS NOW WRITTEN
DOWN AND PINNED.** `observeBanking` returns `previous.chipsByTurn` BY
IDENTITY on every path that adds no path to no turn, and a fresh map on
exactly the paths that do — so "the map moved" and "a chip appeared" are
the same statement. Stated on `BankingObservation` and on
`observeBanking`, and pinned by `a quiet snapshot advances the baseline
and returns the chip map BY IDENTITY`.

**THE RENDER COUNT IS COUNTED, NOT ARGUED.** `a quiet snapshot costs the
conversation NO extra render, a banking one costs exactly one` in
`app/test/interview-chat-dom.test.tsx` wraps the chat in `<Profiler>` and
counts COMMITS — so a state update React bails out of is invisible to the
counter, which is the property. It asserts a DELTA across one prop
change, because a mount settles a status pull, an auto-start and a
transcript pull and an absolute would pin those instead. The banking arm
is the positive control and is not decoration: alone, `quiet: 1` is
satisfied equally by a counter that cannot move, by a chat that stopped
observing docs, and by a `Profiler` that was never wired up.

**WHAT THE PIN FAILS ON — the criterion's "fail if the identity is
dropped again", measured three ways:**

| mutant | one-sided change | the pin reads |
|---|---|---|
| **M4** | `InterviewChat` restored to the exact pre-T-072 shape: one `useState` for both halves | **`{ quiet: 2, banking: 2 }`** against `{ quiet: 1, banking: 2 }` |
| **M3** | `observeBanking`'s quiet path returns `new Map(previous.chipsByTurn)` | `{ quiet: 2, banking: 2 }` |
| **M7** | the banking path reuses the caller's map instead of copying | `{ quiet: 1, banking: 1 }` |

**M4 IS THE RESULT WORTH KEEPING.** It reproduces T-057-s2's regression
exactly — a quiet snapshot cost TWO commits and now costs ONE — and it
reds **nothing else in 833 tests**, which is that finding's own sentence
("no test on the branch can see it") measured rather than quoted. One
counter and one commit stood between that regression and being visible
the day it landed; `T-072-s4` carries it.

### Criterion 4 — the header stops claiming a test it does not have

Rule 1 of the module header in `app/src/genesis/interview-model.ts` read
*"The consequence is deliberate and tested"* about the hand-written-file
property, and the test it leaned on — `a human writing the file in a
terminal produces an IDENTICAL chip` — was deleted by T-057 in `c00184e`
as an `f(x) === f(x)` tautology (both halves of that body are the same
`bank()` call with the same arguments; verified by reading the commit,
not by inference).

**BOTH OF THE CRITERION'S OFFERED ARMS ARE TAKEN, because they are not
alternatives here.** "and tested" is gone, replaced by "and it is true BY
CONSTRUCTION"; the paragraph then says WHY the positive half is not
testable from this module at all — no parameter distinguishes the two
writers — and names the two surviving NEGATIVE tests, `activity labels
and completed text naming docs paths produce ZERO chips` and its DOM twin
`a turn whose activity labels name docs paths produces ZERO chips`. Cited
by test NAME rather than by line, per CONVENTIONS' A CITATION NAMES A
SYMBOL bullet. **No deleted test was restored** — a body written to make
an old adjective true is evidence of nothing, and it would put the
tautology straight back.

### Criterion 5 — the tension named, and one arm added that does not touch the two that were right

**THE CARD'S MEASUREMENT REPRODUCES EXACTLY, at `e83ee1d`, before
anything was edited.** Deleting `bankedSince`'s project clause reds
**2 of 833** — `a DIFFERENT project yields nothing` and the second half
of `…but a baseline that knows NO project is not a switch, however high
its seq` — and leaves `rebaselines a project switch before banking the
next change` GREEN. At an equal or lower switch seq the `switched:
undefined` half is held by the STALE-SNAPSHOT guard one line above, and
the project clause is never reached.

**THE TWO EXISTING ARMS ARE BYTE-UNCHANGED.** The card rules them
correct and they are: an equal or lower watermark is precisely what makes
the `changed` half isolate `observeBanking`'s rebaselining clause, which
fires on a project change even when the seq alone would refuse it.
Nothing was "fixed".

What was added is the comment the criterion asks for — beside the
assertion, naming which guard holds which arm — **and its second offered
option, a third arm at a HIGHER switch seq**, where the stale guard
passes and only the project clause can produce the empty list. The
addition is measured on both sides: the same mutation now reds **3 of
833**, and the third failure is this body.

### The drill — ten mutants, every one read back, every one restored and proved

**One-sided throughout: every mutation below is to the CODE UNDER TEST,
never to an assertion and never to a literal the producer and the
assertion share.** Each was applied by an exact-string substitution with
its count printed, the mutated TEXT was read back with `git diff` before
any suite ran, and each was restored and proved with an empty
`git diff --stat` AND `shasum -a 256` of the working file against
`git show HEAD:<path>`. Every suite run is the WHOLE app suite (833
bodies), so the failing-body counts below are global rather than
per-file.

| # | mutation (one-sided) | reds | the body / assertion it names |
|---|---|---|---|
| M0 | `bankedSince`'s project clause deleted, run at `e83ee1d` BEFORE any edit | 2 / 831 | the card's criterion-5 premise, reproduced |
| M1 | merge `.sort()` dropped | **1 / 833** | `a second banking … merges in PATH order` — **isolating** |
| M2 | `set(turn, banked)` for `set(turn, merged)` | **1 / 833** | same body — **isolating** |
| M3 | quiet path returns `new Map(previous.chipsByTurn)` | 2 / 833 | `…and the render half does not move`; and the DOM pin |
| M4 | `InterviewChat` back to one `useState` | **1 / 833** | the DOM pin, at `{ quiet: 2, banking: 2 }` |
| M5 | `bankedSince`'s project clause deleted, run at the branch tip | 3 / 833 | adds `rebaselines a project switch` — the `higher` arm |
| M6 | `bankBaseline`'s `seq: docs.seq + 1` | 11 / 833 | `a banking allocates a NEW map… / …carrying the path` |
| M7 | the banking path reuses the caller's map | 8 / 833 | `a banking allocates a NEW map…` |
| M8 | `chipLabel` drops the paths from the row | 6 / 833 | the DOM pin's `toContain`, counts unmoved at `{1,2}` |
| M9 | the baseline never advances | 3 / 833 | `the baseline still advances…: expected 1 to be 3` |
| M10 | whole-observation identity dropped, MAP identity kept | **1 / 833** | `a repeat moves nothing at all` |

Every NEW or CHANGED assertion is named by at least one row: the new
positive by M1/M2/M7, the four assertions of the identity body by M7
(`not.toBe`), M6 (`toEqual`), M9 (`baseline.seq`), M3 (`toBe`) and M10
(the repeat), the project-switch body's new arm by M5, and the DOM pin's
two assertions by M4/M3/M7 and by M8.

**ONE ORDERING CHANGE CAME OUT OF THE DRILL RATHER THAN OUT OF THE
CARD.** The identity body's `not.toBe` positive control was written
AFTER its `toEqual` sibling, and under M7 the body red on the sibling
instead — because M7's in-place map reuse pollutes the shared
`EMPTY_BANKING_OBSERVATION` and earlier bodies in the same file had
already written into it, so the `toEqual` saw three paths where it wanted
one. The control now runs FIRST and M7 names it exactly. That pollution
is `T-072-s3`.

**M10 IS A RESULT AND NOT JUST A DRILL.** It shows that the whole-
observation identity — `observeBanking` returning `previous` when nothing
moved at all — is load-bearing for exactly ONE body and for no render:
the DOM count stays `{1,2}` under it. The split made the stronger
guarantee redundant for rendering, and only the model pin holds it. Said
plainly rather than left as a green.

### The ranges, every dot count stated, and a collapse worth naming

Pre-merge, so the RANGE RULE's executor row applies: BUILD the merge's
tree and diff main against it. `merge-tree`'s exit was read from `$?`
and not through a command substitution, because a substitution that
swallows a CONFLICT hands back an empty forecast wearing the costume of
a clean gate.

    git merge-tree --write-tree e83ee1d HEAD   -> cedc0728…, MERGE_TREE_EXIT=0
    git diff --name-only e83ee1d <TREE>                  -> 10   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only e83ee1d...HEAD  (THREE dots)    -> 10   cmp against the forecast: exit 0
    git diff --name-only e83ee1d..HEAD   (TWO dots)      -> 10   the pre-merge FORBIDDEN form
    git diff e83ee1d <TREE>  vs  git diff e83ee1d...HEAD -> byte-identical, cmp exit 0

**ALL THREE FORMS AGREE, AND THAT IS A FACT ABOUT TODAY RATHER THAN
ABOUT THE NOTATION.** `git merge-base e83ee1d HEAD` IS `e83ee1d` and
`git merge-base --is-ancestor e83ee1d HEAD` exits **0** — main has not
advanced since this lane was cut, so the branch point and main's tip are
the same commit and the forbidden form has nothing of main's to
misattribute yet. **It will.** Two sibling lanes are live on disjoint
fences (`T-084` on `[docs/CONVENTIONS.md, tools/e2e]`, `T-074` on
`[app-shell, app-map]`); the moment either lands, `e83ee1d..HEAD` starts
returning main's work in reverse while the other two forms do not.
Whoever integrates this should re-derive against main's tip THEN — a
range agreeing with its own forbidden spelling is the strongest possible
argument that the ban names the PAIR and not the punctuation, and the
weakest possible evidence that the spelling is safe.

Suffix census of the ten: **6 md, 2 ts, 2 tsx**.

### Gates

**GRAPH REGEN FIRES — 4 of the prescribed range's 10 paths.** The
trigger is `*.ts/*.tsx/*.js/*.jsx` outside `docs/`, and this branch moves
**four** such paths:
`app/src/genesis/InterviewChat.tsx`, `app/src/genesis/interview-model.ts`,
`app/test/interview-chat-dom.test.tsx`, `app/test/interview-model.test.ts`.
`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **1**, and it is a REAL red rather than a `--root`
false red — the second line prints BOTH counts and a `~` file list, which
a false red cannot (a false red says `committed: MISSING`):

    committed:   576235 bytes · 118 files · 996 symbols · 1520 edges
    fresh index: 576263 bytes · 118 files · 996 symbols · 1520 edges
    files  +0  -0  ~4        edges  +1  -1
    | + f:app/test/interview-chat-dom.test.tsx -> p:react (import) symbols=[Profiler,act]
    | - f:app/test/interview-chat-dom.test.tsx -> p:react (import) symbols=[act]

The `~4` is exactly the trigger's own four paths, the committed figures
are STATE's own, and the SYMBOL and EDGE counts do not move at all — the
only edge change is one import's symbol list gaining `Profiler`. **The
regenerated `graph.json` is deliberately NOT committed**: CONVENTIONS
puts the regen at the CHECKPOINT, and a graph regenerated into a lane is
stale again the moment the checkpoint reconciles the indexed fixtures.
The integrator owes one regen, +28 bytes, one edge.

**BOOT GATE FIRES — 2 of the prescribed range's 10 paths**, both under
`app/src/**` (`InterviewChat.tsx` and `interview-model.ts`); no
`app/src-tauri/**` path and neither manifest. The executor runs it too,
per T-046 criterion 6. `NPUTER_BOOT_PORT=19851 npm run boot:check` from
`tools/e2e`, **`BOOT_CHECK_EXIT=0`**, both `[nputer]` lines detected:
*`[nputer] project folder: /Users/ujju/Projects/nputer-T-072`* and
*`[nputer] window "main" created`*, then `exit=null signal=SIGTERM`.
Port 19851 was bind-probed FREE on all four stacks (`127.0.0.1`,
`0.0.0.0`, `::1`, `::`) before use — an IPv4-only probe of a v6 listener
reports free, which is why all four — and chosen away from the lane's
14520 default and from the last checkpoint's 19841/19843.

### Suites, every exit read from its own `$?` and never through a pipe

| suite | at `e83ee1d` | at the branch tip | exit |
|---|---|---|---|
| app `npx vitest run` | **831 / 831** over 42 files | **833 / 833** over 42 files | `APP_TEST_BASE_EXIT=0`, `APP_TEST_NEW_EXIT=0` |
| `app/test/interview-model.test.ts` | 59 | **60** | inside the above |
| `index --check` re-derived at the FINAL tip | — | still exit 1, `~4` files, `+1 -1` edges | `INDEX_CHECK_FINAL_EXIT=1` |
| `app/test/interview-chat-dom.test.tsx` | 38 | **39** | inside the above |
| app `npm run build` (both `tsc` programs + vite) | exit 0 | exit 0 | `APP_BUILD_BASE_EXIT=0`, `APP_BUILD_FINAL_EXIT=0` |
| `npx tsc --noEmit` (app program alone) | — | exit 0 | `TSC_EXIT=0` |
| parser `npx vitest run` | — | **263 / 263** over 12 files | `PARSER_EXIT=0` |
| parser `npx tsc --noEmit` | — | exit 0 | `PARSER_TSC_EXIT=0` |
| `tools/e2e` `npm test` (scratch port 19852) | — | **91 / 91**, 1 worker, 0 retries, 0 skips | `E2E_EXIT=0` |
| `tools/e2e` `npm run typecheck` | — | exit 0 | `E2E_TYPECHECK_EXIT=0` |
| token lint selftest + lint | — | clean | `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0` |
| `index --check --root ../..` | current | **STALE, exit 1** | `INDEX_CHECK_EXIT=1` — owed at the checkpoint |
| `npm run boot:check` | — | booted | `BOOT_CHECK_EXIT=0` |

The **+2** is exactly this card: one duplicate positive removed, two
model bodies added, one DOM body added. The base 831 and the base build's
`index-3bNJ6pCB.js` 501.54 kB / `index-CwYF5FQb.css` 43.95 kB reproduce
STATE's figures at this ref, so the baseline is derived rather than
inherited.

**THE BUILD OUTPUT, AND A 27-BYTE DETOUR THAT IS WORTH THE PARAGRAPH.**
At the final tree the JS moves — `index-CCC211k4.js`, **501.62 kB**
against the base's 501.54 kB — because `app/src` really moved, and **the
stylesheet is `cmp`-IDENTICAL to the base's, exit 0**, still
`index-CwYF5FQb.css` at 43.95 kB. That is the honest form of "zero new
tokens", and it took a correction to be able to say it.

The FIRST build of this branch emitted **43.98 kB** under a different
hash. Bisected — reverting `app/src/genesis/` to `e83ee1d` alone did not
restore it, nor did removing `app/dist`, nor did moving this card and its
findings aside — and then derived directly, by extracting every selector
from both stylesheets and taking the set difference: **one rule added,
none removed, `.isolate{isolation:isolate}`, 27 bytes.** Its source is
the bare word `isolate`, written ONCE, in a **comment**, in
`app/test/interview-model.test.ts`; at `e83ee1d` that word appears
nowhere under `app/src` or `app/test`. `app/src/index.css` imports
Tailwind with no `@source`, so v4's automatic detection scans the Vite
root — **`app/test/**` included, a tree that ships no byte to the
bundle** — and extracts candidates from raw text, where prose and a
`className` are indistinguishable. The sentence was reworded (the
INFLECTED forms are harmless — only the uninflected spelling is a
utility), `git grep -lw` for it over `app/` is empty, and the stylesheet
came back byte-for-byte, `cmp` exit 0. **The boundary was measured in
both directions**: the same word sits in FIVE tracked `docs/tasks/*.md`
files at this tip, two of them (`T-029`, `T-057`) predating this lane, and
the base tree emits no such rule — so the input is `app/test`
specifically and not "any text in the repo". **Dodging is not a fix and the
finding is `T-072-s5`**, which argues the one-line `@source` close and
notes that this is the `T-084` family with a new member: CONVENTIONS'
FOUR WALKS table does not describe the Tailwind scan, and the Tailwind
scan is a fifth walk with its own authority.

**CONTROL AND TOKEN, DERIVED AT BOTH ENDS.** Run before the docs commit
the lint printed **CONTROL 563**, the brief's figure, because CONTROL
derives from `git ls-files` and the five new `.md` files were still
untracked. Run after it: `lint-tokens: clean (TOKEN 119 files under
app/src, app/test, tools/e2e; **CONTROL 568** tracked text files)`,
`LINT_TOKENS_FINAL_EXIT=0`. It closes arithmetically — `git ls-tree -r`
counts **581** tracked paths at `e83ee1d` and **586** at the branch tip,
+5 and none deleted, and 563 + 5 = 568. **TOKEN is 119 and cannot
move**: this branch adds no FILE under `app/src`, `app/test` or
`tools/e2e`, only modifies four.

**THE PARSER SUITE IS NOT OPTIONAL ON THIS LANE EVEN THOUGH
`lib/parser/**` IS A 0-FILE DIFF.** Its smoke test parses this repo's
LIVE `docs/` tree and requires zero issues, and this branch adds five
flat `docs/tasks/T-072-s*.md` files — the exact input class that red the
app suite on T-081's lane and produced `T-081-s9`, which `T-084` now
owns.

### What ran, and what did not

Everything ran in the worktree, with `app/node_modules`,
`lib/parser/node_modules`, `lib/parser/dist` and `tools/e2e/node_modules`
symlinked read-only from the main checkout for the duration and removed
afterwards, and `CARGO_TARGET_DIR` pointed at scratch so no cargo
invocation wrote into `app/src-tauri/target` (the directory the human's
`tauri dev` builds into). **No `npm ci`, no `npm install`, no `pkill`, no
`cargo` in the main checkout, and no real model call of any kind** —
nothing on this lane spawns a CLI. Port 1420 was read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and with nothing else, before and
after: `node` pid **82549**, one socket, `TCP [::1]:1420 (LISTEN)`,
identical at both ends. The human's chain is unchanged — `npm run tauri
dev` **82342** → `tauri` **82364** → `target/debug/nputer` **85379**, and
`npm run dev` **82504** → `vite` **82549**. The two `nputer-T-060`
`fake_agent` orphans were left alone.

### Findings filed

- **`T-072-s1`** — the POISON DRILL's restoration proof cannot tell a
  restore from a revert of UNCOMMITTED work. Measured here at the cost of
  three edits: `git checkout --` reverted the implementation to the
  branch point mid-drill, and both prescribed proofs (empty `git diff`,
  sha256 against `git show HEAD:`) reported success while the work was
  gone. One clause closes it: DRILL AT A COMMIT.
- **`T-072-s2`** — shape SIX has no mechanical remedy, but it does have a
  mechanical CHECK, and this card ran one: name a mutant the survivor
  kills, run the whole suite, require a failing-body count of ONE.
- **`T-072-s3`** — `EMPTY_BANKING_OBSERVATION` is a shared mutable `Map`
  behind a `ReadonlyMap` type; M7 showed the damage surfaces three
  unrelated bodies away from the mutation.
- **`T-072-s4`** — this is the repo's FIRST render-count pin and the card
  whose subject is render cost (T-056) has none. Carries the idiom.
- **`T-072-s5`** — a bare word in a TEST comment added
  `.isolate{isolation:isolate}` to the shipped stylesheet, because
  `app/test/**` is a Tailwind content input and no walk in CONVENTIONS
  describes that scan. Dodged here, measured, and filed with the
  one-line close.

### Corrections to the dispatch brief

- The brief says of criterion 5: *"The card asks for a comment, not a
  fix."* **The card asks for either**: *"A comment beside the assertion,
  OR a third arm at a higher seq … SHALL close the gap."* Both were done.
  The brief's underlying warning — do not "correct" the two arms the card
  has ruled correct — was obeyed exactly: they are byte-unchanged.
- The brief's *"`e83ee1d` is main's tip; the last `Checkpoint:` is
  `825932c` and the commits after it are docs-only — verify rather than
  take it"* is **correct**, verified above at 1 docs path.
- Every figure the brief quotes for `e83ee1d` reproduced: CONTROL 563,
  TOKEN 119, app 831/831 over 42 files, parser 263/263, graph CURRENT at
  576235 B / 118 files / 996 symbols / 1520 edges.

## Verdicts
