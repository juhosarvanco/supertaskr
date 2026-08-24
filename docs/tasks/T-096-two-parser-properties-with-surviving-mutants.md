---
id: T-096
title: Two parser properties the suite states and cannot check — the ambiguous-mapping winner past 309 digits, and the disk layer's issue order
feature: F-02
milestone: 4
priority: 52
size: S
status: building
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-076-s4, T-076-s5 (sixth triage, 2026-08-20). Both files
removed in this commit.

**Two non-equivalent mutants, each surviving `npx vitest run` from
`lib/parser/` at 263 passed / 263, exit 0.** Both are properties the
suite ASSERTS in prose and cannot check; neither is a bug in shipped
behaviour. They are one card because they are one shape — *a pin on the
mechanism instead of on the property the mechanism exists to protect* —
and because they land in the same suite.

## ONE — the declared winner is decided by ID order, and nothing says so

T-076 fixed `compareComponentIds` and pinned `compareComponentIds`. It
did not pin the property the fix exists to protect: that the
`ambiguous-mapping` message's declared winner — *"first by id, '<id>',
wins file mapping"* — is decided by ID order **at every id length**. The
executor flagged it against itself (*"there is no pin that says the
ambiguous-mapping WINNER is id order past 309 digits"*); this is the
measurement that turns the flag into a fact.

The sort site is `compareComponentIds(a.id, b.id) || (a.file < b.file ?
-1 : a.file > b.file ? 1 : 0)` in `lib/parser/src/component.ts` —
verified live at `4d2f03c`. **`NaN` is falsy**, so the moment the
comparator cannot weigh two ids numerically the tiebreak takes over and
the declared winner becomes the id in the first-sorting FILE.

**Measured**, one one-sided source mutant applied at the
`ambiguous-mapping` sort site only, inlining the pre-T-076 comparator
while leaving `compareComponentIds` itself total: **263 passed (263),
exit 0** — the mutant survives the entire suite. It is not equivalent;
driven over two components with 400- and 401-digit ids and overlapping
`paths`, varying only which FILE holds which id, it restores the defect
verbatim — the winner is the first-sorting file in BOTH orderings, while
`compareComponentIds` itself still answers `-1`.

**Why it survives.** Every `ambiguous-mapping` pin in
`lib/parser/test/component.test.ts` uses two- and three-digit ids (seven
occurrences of the kind in that file at `4d2f03c`), and the
branch-point and fixed comparators agree on every id a double can weigh
— verified over all 1,210,000 ordered pairs of every 2- and 3-digit
`C-` id, zero sign disagreements. **No existing pin can distinguish the
two bodies, and T-076's own new pins all assert the comparator in
isolation rather than through the consumer.**

## TWO — the two layers are pinned deep-equal against a fixture that cannot tell

`parseProject` (disk) and `parseProjectFromFiles` (pure) are contracted
deep-equal on the same files — the contract T-076 leaned on when it
tightened the parity body. Both assemble their issue list in a declared
LAYER ORDER, task → roadmap → component, and both say so in a source
comment (`lib/parser/src/files.ts`'s *"their issues come last (task ->
roadmap -> component order, mirroring the disk layer)"*, and the
assembly in `lib/parser/src/project.ts`).

**Only one side is pinned.** T-076 added the PURE side's pin — the body
`reads .space off every duplicate without touching a message` in
`lib/parser/test/files.test.ts`, which asserts `['task', 'feature',
'component']` over one mixed model and is the only test in the suite
that does; swapping the pure assembly reds exactly that body and nothing
else. **The DISK side has no equivalent.** One one-sided mutant at the
disk assembly — component issues before roadmap issues — leaves the
suite at **263 passed (263), exit 0**, and it genuinely breaks the
contract: the same fixture through both entry points under the mutant
gives `task | component | feature` on disk and `task | feature |
component` pure. **Layers agree? false.**

**Why the deep-equal pin does not catch it.** The parity assertion
`expect(fromFiles).toEqual(fromDisk)` runs over the `broken-project`
fixture, whose issues are ALL task-layer — a good task, a broken-YAML
task, and a task missing `size`, with a clean roadmap and no components.
**A parity assertion can only see the layers it has issues from, and
this one has one layer.** Pre-existing rather than introduced by T-076;
the mutant would have survived at `e4a5ae7` too. It surfaces now only
because T-076 built the first assertion that the order is a contract at
all.

## Acceptance criteria

- **THE AMBIGUOUS-MAPPING WINNER SHALL BE PINNED THROUGH THE CONSUMER,
  not through the comparator**: one body in
  `lib/parser/test/component.test.ts` with two components whose ids
  differ past 309 digits and whose `paths` provably overlap, parsed
  TWICE with the ids swapped between two file names that sort in
  opposite orders, asserting the declared winner is the smaller ID both
  times.
- **THE MEASURED MUTANT SHALL BE RE-RUN AGAINST THE NEW BODY AND SHOWN
  RED** — the pre-T-076 comparator inlined at the sort site, with
  `compareComponentIds` left total, so the body is proven to
  discriminate the exact defect T-076 closed.
- IF the component-space `aliased-id` `ids` array degrades by the same
  mechanism at the same threshold THEN it SHALL get the same treatment
  or an explicit ruling that it does not need one.
- **THE PARITY FIXTURE SHALL CARRY AT LEAST ONE ISSUE FROM EACH OF THE
  THREE LAYERS**, so the existing `toEqual` holds the WHOLE contract
  rather than a second body being added to remember it. THE OTHER PARITY
  BODIES THAT READ THAT FIXTURE SHALL BE RECONCILED, each move checked
  rather than any assertion loosened.
- **THE DISK-SIDE MUTANT SHALL BE RE-RUN AND SHOWN RED** after the
  fixture widens, and the notes SHALL name which body catches it.
- IF a second parity body is added on the disk side instead THEN the
  card SHALL state why the fixture fix was refused, because it fixes the
  parity pin's blindness rather than adding a second place to remember.
- **NEITHER NEW BODY MAY DUPLICATE AN EXISTING ONE.** After each drill
  reds, run T-092's shape-six check: name a mutation of the source the
  body kills, run the WHOLE parser suite under it, and require the
  failing-body count to be ONE.
- **AT LEAST ONE MUTANT SHALL BE DERIVED FROM A CRITERION WITH THE TEST
  FILE CLOSED.** T-076 ran 16 one-sided mutants with zero survivors and
  reported it honestly; both mutants above are of the same class and
  survive, because the 16 were derived from the pins that exist rather
  than from the criteria that were written.

Verification: headless — `npx vitest run` and `npx tsc --noEmit` from
lib/parser with counts and exits stated, plus the POISON DRILL on both
new bodies: one side only, substitution count recorded, mutated text
read back with `git diff` before each run, restore proved by sha256
against the drill's own commit. The parser suite's smoke body parses the
live `docs/` tree, so the DOCS GATE also fires on any card file this
lane writes — run what it owes. @human: none.

## Implementation notes

Built by `claude-opus-5 @T-096` in `../nputer-T-096` on
`task/T-096-parser-properties`, base **`765362e`**. Fence `[lib-parser]`
= C-06 = `lib/parser/**`, **never widened**; the whole diff is four test
files plus one new fixture file, and `lib/parser/src/**` is a **0-file
diff**, so the parser's `dist/` is unmoved and the app compiles against
exactly what it compiled against before.

**BOTH MUTANTS RE-DERIVED AT MY OWN BASE BEFORE ANYTHING WAS BUILT**, in
a detached worktree at `765362e` (`drill-T-096-base`), because a card's
premise is a figure like any other. Baseline **263 passed (263), exit 0**.
The pre-T-076 comparator inlined at the `ambiguous-mapping` sort site with
`compareComponentIds` left total: **263 passed (263), exit 0** — survives.
The disk assembly reordered to component-before-roadmap: **263 passed
(263), exit 0** — survives. The card was right about both.

### ONE — the winner is pinned through the consumer

`lib/parser/test/component.test.ts` gains ONE body, `the DECLARED WINNER
is id order at EVERY id length, never file order (T-096)`, inside the
existing `ambiguous mapping` describe. Two components with 400- and
401-digit ids and the SAME `paths` pattern (`app/src/**` — the
`na === nb` arm, so the overlap is provable from the pattern text alone
and nothing depends on glob semantics), parsed TWICE with the spellings
swapped between `C-aaa.md` and `C-zzz.md`, asserting the smaller id wins
in the structured `ids` field AND in the message's own sentence, both
times.

Two properties of the fixture are deliberate. The digits are chosen so
**string order DISAGREES with id order** (`'9…'` sorts after `'1…'` while
400 digits are fewer than 401), so the body discriminates a fall-through
to the string fallback as well as the file tiebreak. And the `files`
array is asserted in both runs as a **POSITIVE CONTROL that the two runs
really are different arrangements** — the winner's FILE moves while the
winning ID does not. Without it a fixture that quietly stopped swapping
would leave every other assertion passing for the wrong reason.

### TWO — the fixture widened, and no second body was added

`lib/parser/test/fixtures/broken-project` now carries one issue from EACH
of the three layers: `yaml-error` + `missing-field` (task, both
pre-existing), a `roadmap-error` from a malformed backbone line added to
`docs/ROADMAP.md`, and a `missing-field` for `paths` from a new
`docs/architecture/components/C-90-missing-paths.md`. **Four issues, one
per layer plus the task layer's second**, verified through `parseProject`
before a line of test was edited.

**Criterion 6 is NOT triggered and this is why**: the fixture fix was
taken, not refused. A second parity body on the disk side would fix the
symptom — it would remember the order — while leaving `toEqual` blind to
every layer the fixture still lacks, which is the defect. The fixture
carrying all three layers makes the EXISTING assertion hold the whole
contract, and it does so for any layer property nobody has thought of yet.

Three reconciliations came with it, each checked, none loosened:

- `loadFixture` in `files.test.ts` loads a components directory when a
  fixture declares one, guarded by `existsSync`, so the pure side is
  handed the same three layers the disk side reads. Fixtures with no
  components directory are untouched.
- The parity body passes `componentsDir` and gains an **order-INDEPENDENT
  fixture-shape control** (a `Set` of the three layers). It is
  order-independent on purpose: the ORDER stays held by
  `toEqual(fromDisk)` and by nothing else, so the fixture cannot narrow
  back to one layer without failing, and the widening does not smuggle in
  a second copy of the order.
- `project.test.ts`'s reader of the same fixture: `toHaveLength(2)` ->
  `toHaveLength(4)`, the two new layer issues asserted by their field and
  file, and the `missing-field` lookup named by `field === 'size'` because
  the kind now has two candidates.

### THE CARD'S OWN PROBLEM STATEMENT IS WRONG IN ONE PLACE, AND THE ERROR IS LOAD-BEARING

Section ONE says *"T-076's own new pins all assert the comparator in
isolation rather than through the consumer."* **That is false at
`765362e`.** T-076 built exactly one CONSUMER-side pin — `the slot's OWN
ids array is ordered past the double range too (T-076)` in
`component.test.ts` — which is the same two-arrangement shape this card
asked for, on the comparator's OTHER consumer. The true statement is
narrower and sharper: **T-076 pinned one of the comparator's two consumers
through the consumer and left the other pinned only in isolation.** That
matters because it changes what this card is: not "T-076 forgot the
consumer" but "T-076 found the shape and applied it to one site of two".

### CRITERION 3 — RULED, AND THE RULING IS A MEASUREMENT

The component-space `aliased-id` `ids` array **does** degrade by the same
mechanism at the same threshold — `Number()` fuses both spellings of a
>309-digit slot to `Infinity`, the difference is `NaN`, and here there is
no `||` to swallow it, so the NaN reaches `Array.prototype.sort` directly
and V8 leaves the pair in arrival order, which is sorted FILE order. **It
needs no new treatment because it already HAS the treatment**: mutant
`D5` — the pre-T-076 comparator passed to `aliasedIdSlots` at its call
site in `parseComponentSet` — reds **exactly ONE body**, T-076's, at 1
failed / 263 passed, exit 1. Ruled, with the mutant that proves it, rather
than asserted.

That measurement is also half of criterion 7's answer: `D5` reds T-076's
body and NOT this card's, while `D1` and `D3` red this card's and NOT
T-076's. The two are the same shape on two different producers, which is
the opposite of a duplicate.

### THE POISON DRILL — ten mutants, one side only, always the producer

Detached scratch worktree **`drill-T-096`** at `3d870bb` (named for the
card, not the shared literal `drill` — `T-088-s3`), `node_modules`
symlinked in, no `CARGO_TARGET_DIR` hazard because no Rust body is
drilled. Baseline **264 passed (264), exit 0**. Every mutation applied by
a driver that REFUSES a path outside the drill, refuses a test file
without an explicit flag, and requires a substitution count of exactly
**1**; every mutated TEXT read back with `git diff --unified=0` BEFORE its
suite ran.

| # | mutation (producer only) | suite | failing BODIES |
|---|---|---|---|
| D1 | pre-T-076 comparator inlined at the `ambiguous-mapping` sort site, `compareComponentIds` left total | 1 failed / 263, exit 1 | **1** — the new body |
| D2 | disk assembly: component issues before roadmap issues | 1 failed / 263, exit 1 | **1** — the parity body |
| D3 | sort site: the `compareComponentIds(...) \|\|` term DELETED, file order alone | 1 failed / 263, exit 1 | **1** — the new body |
| D4 | sort site: comparator NEGATED | 5 failed / 259, exit 1 | 5 — the new body and four existing `ambiguous-mapping` pins |
| D5 | pre-T-076 comparator passed to `aliasedIdSlots` | 1 failed / 263, exit 1 | **1** — T-076's aliased-id body |
| D8 | component parser stops emitting `missing-field` for `paths` | 3 failed / 261, exit 1 | 3 |
| D9 | `ambiguous-mapping`'s `files` array reversed | 2 failed / 262, exit 1 | 2 |
| D10 | roadmap parser stops emitting the malformed-bullet `roadmap-error` | 4 failed / 260, exit 1 | 4 |
| D13 | BOTH assemblers reordered the SAME way (parity preserved) | 1 failed / 263, exit 1 | **1** — T-076's pure-side layer-order pin |
| D14 | pure assembly: component issues before roadmap issues | 2 failed / 262, exit 1 | 2 |

**D3 IS THE CRITERION-8 MUTANT.** It was derived from criterion 1's text
with `component.test.ts` and `files.test.ts` NEVER OPENED — written down
before either file was read, together with `D4` and `D2`'s shape — and it
is not the mutant the card supplied. It reds, and it reds exactly one
body.

**T-092's SHAPE-SIX CHECK, per new or changed body.** The new
`ambiguous-mapping` body: `D1` and `D3` each red it and nothing else. The
widened parity body: `D2` reds it and nothing else. Both are ONE.

**D13 IS THE ANSWER TO THE OBVIOUS OBJECTION**, and it is measured rather
than reasoned: a parity assertion cannot see a reorder applied to BOTH
sides, so widening the fixture would be worth little if that case were
uncovered. It is not — T-076's pure-side pin catches it, alone, at
exactly one failing body. The three cases are therefore all covered by
two bodies between them: disk-only by the parity body (`D2`), pure-only by
both (`D14`), symmetric by the pure-side pin (`D13`).

**RESTORATION PROVED THREE WAYS** after every mutant and at the end of the
drill: an empty tracked `git diff`, `sha256` of all five touched files
against the drill's own commit `3d870bb` (all MATCH), and a clean re-run
at **264 passed (264), exit 0**.

### A JUSTIFICATION I WROTE, THEN REFUTED WITH ITS OWN COUNTERFACTUAL

The comment on `project.test.ts`'s reconciled `missing-field` lookup first
claimed the bare `find` "would have redded this body under a disk-side
reorder". **Measured, that is false**: counterfactual `C1` (the OLD bare
lookup restored, `D2`'s producer mutation applied — deliberately
two-sided, therefore NOT a drill) leaves `project.test.ts` GREEN, because
the TASK layer still comes first under that transposition and the bare
`find` still lands on `size`. The 2x2, all four cells measured at
`3d870bb`:

| disk mutation | named lookup (as landed) | bare lookup (as it was) |
|---|---|---|
| component before roadmap | 1 body (parity) | 1 body (parity) |
| component before TASK | 1 body (parity) | **2 bodies** (parity + `project.test.ts`) |

So the naming IS load-bearing, for a transposition one step away from the
one I named. The comment in the file now states the measured reason and
says the first one was refuted, because the next reader needs to know
which reorder it protects against. **A reason that sounds right is not a
measurement**, which is this card's own subject arriving one layer down.

### FILED, NOT BUILT

`T-096-s1` — a THIRD body in the same suite, `component issues surface in
the project model after task and roadmap issues`, TITLES the pure layer's
order and carries ONE issue, so it cannot check it (`D14` reds two bodies
and neither is that one). The fix is the TITLE, not the fixture: widening
it would build exactly the second order-remembering body this card
refused. In fence, outside the criteria, one line.

### OWED AT THE MERGE — READ THIS BEFORE INTEGRATING

**GRAPH REGEN FIRES AND IS GENUINELY OWED.** Three of the five diff paths
are `.ts` outside `docs/`, and unlike the `tools/**` worked examples these
ARE indexed — `lib/parser/test/**` carries 12 of the graph's 126 files.
The gate was ASKED rather than predicted:
`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` in this worktree exits **1**, STALE:

    committed:   648863 bytes · 126 files · 1126 symbols · 1712 edges
    fresh index: 648886 bytes · 126 files · 1126 symbols · 1712 edges
    files  +0  -0  ~3   (component.test.ts, files.test.ts, project.test.ts — content + loc)
    edges  +1  -1       (files.test.ts -> node:fs gains `existsSync` in its symbol list)

**THE DELTA IS +23 BYTES AND ONE EDGE RESPELLED**; symbol and edge COUNTS
and the file count do not move. Per GRAPH REGEN the regen belongs to the
CHECKPOINT, not the merge, so it is stated here and not performed.

**BOOT GATE — NOT OWED, 0 of 5.** Derived, not assumed: this fence cannot
produce `app/src-tauri/**`, `app/src/**` or either manifest, and the
count is stated.

**DOCS GATE — fires on this card and on `T-096-s1`.** Run at the merge
with the range rule's own path list.
