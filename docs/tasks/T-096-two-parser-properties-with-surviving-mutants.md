---
id: T-096
title: Two parser properties the suite states and cannot check — the ambiguous-mapping winner past 309 digits, and the disk layer's issue order
feature: F-02
milestone: 4
priority: 52
size: S
status: planned
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** Line-number drift, cited
> per CONVENTIONS' own rule: `T-076-s5` cites `lib/parser/src/files.ts:181`
> for the layer-order comment; at `4d2f03c` it sits at line **157**. The
> SUBSTANCE reproduces exactly and the SYMBOL is what I have cited
> below. `project.ts:202` and `component.ts:412` both still resolve.

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
