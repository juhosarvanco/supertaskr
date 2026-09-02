---
id: T-112-s6
title: C-18 gets a test file of its own — and the card that adds it must name that file in `touches:`, because a fence expands to the registry as it stood at dispatch
feature: F-02
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
touches: [app-board, docs/architecture/components/C-18-board-root.md, app/test/board-root.test.tsx]
suggested_by: executor claude-opus-5@subagent @T-112-s4 — routed under TASK-FORMAT's "a criterion that cannot be built inside the fence is recorded and routed"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

**THIS IS THE HALF OF `T-112-s4`'s FIRST CRITERION THAT ITS OWN FENCE
COULD NOT REACH**, routed rather than approximated. That card's criterion
read *"`C-18-board-root.md` SHALL declare a test path of its own, or the
registry SHALL state in that file why the composition root is
deliberately untested from inside a `[app-board]` fence."* The second arm
is discharged — `C-18-board-root.md` now carries the derivation. The
first arm is this card, and the reason it is a separate card is
mechanical rather than a matter of appetite.

## Why `T-112-s4` could not do it, stated so this card is not re-filed

A `[app-board]` fence expands to C-08/C-09/C-17/C-18's `paths:` **as they
stand at the moment the fence is written**, which is dispatch. C-18
declares exactly one path, `Board.tsx`. So:

- the lane may ADD `app/test/<name>.test.tsx` to C-18's `paths:` — the
  registry is inside the fence;
- and the lane still may NOT WRITE that file — the manifest at
  `.nputer/lane-fence.json` was expanded before the line existed, and a
  lane may not re-expand its own fence (the manifest is outside every
  fence, by design).

**The registry line and the file it names cannot land in one lane unless
the card's `touches:` names the FILE.** `C-05-app.md`'s T-149 note
already prescribes *"the card adding a test fences its own component's
slug plus that component's own registry FILE"*; that is necessary and not
sufficient, because the slug expansion is what is stale. Hence the
`touches:` line above — it is the deliverable of `T-112-s4`'s learning and
should be taken verbatim rather than re-derived.

**RETRACTED 2026-09-02 BY THE LANE THIS SENTENCE STOPPED.** It read:
*"`app-board` already reaches `C-18-board-root.md` through the slug, so
no separate registry token is needed here; a dispatcher preferring the
narrower T-149 spelling may use `[app-board,
docs/architecture/components/C-18-board-root.md,
app/test/board-root.test.tsx]` instead, and the two are equivalent for
this card's writes."* **The two are NOT equivalent, and the second is the
only one that works.** The slug expands to each component's `paths:`, and
the section above quotes C-18's own body saying that no component
declares its own registry file there — so the sentence was refuted by
this card's own citation two paragraphs up. `touches:` at the top is now
the three-token spelling; the account is at the end of this card.

## What the file may and may not import

Every edge a C-18-owned test needs is ALREADY DECLARED — this component
sits above the whole board side, with `depends_on: [C-06, C-08, C-09,
C-17]`. So a file importing `Board`, the parser, the card faces, the
drawer and the board model adds no registry line beyond its own path.

**It may not import `App`, or anything under `app/src/components/shell/`.**
That is C-05's, C-05 already declares `C-05 -> C-18`, and declaring the
reverse edge cycles — `C-05 -> C-18 -> C-05` and
`C-05 -> C-13 -> C-18 -> C-05`, `arch cycles` exit 1. **But read the
measurement in `C-18-board-root.md` rather than that sentence**, because
the wall a lane actually hits comes first and is different: re-homing
`board-truth.test.tsx` by a PATH MOVE alone leaves `arch cycles` ACYCLIC
at exit 0 and instead raises an `arch drift` **D4** double-claim, which
can only be cleared from `C-05-app.md` — a file no `[app-board]` fence
reaches. **So a new file is not merely the tidier option here; it is the
only one this card's fence can execute.** That is also why
`app/test/board-truth.test.tsx` cannot simply be re-routed here.

`T-169-s1` is adjacent but is NOT authority for the above: it parked on
whether that file moves to **C-08's or C-09's** `paths:`, and on moving
the review-badge bodies into it. Neither question is this card's, and
both stay open.

## Acceptance criteria

- `C-18-board-root.md` SHALL declare an `app/test/**` path of its own,
  and that file SHALL exist and be collected by `app/vitest.config.ts`.
- The new file SHALL drive `Board` with a lane reading and require the
  drawer's dispatch block, so that deleting either threading line in
  `Board.tsx` reds a body in a file `[app-board]` may itself edit.
- `cargo run -p nputer-index -- arch cycles --root ../..` SHALL exit 0
  after the change, and `arch --root ../..` SHALL report the new file
  mapped rather than unmapped — derive both at the lane's own ref.
- The lane SHALL say whether the existing pin in
  `app/test/board-truth.test.tsx` is left in place or superseded, and
  SHALL NOT delete it from outside `[app-shell]`.

## What this card is NOT

**It is not a coverage gap.** The composition root's threading is pinned
today and every one-sided mutant of it dies — `T-112-s4` measured that at
its own base and the figure belongs to that card, not transcribed here.
This is placement debt with a working pin, which is why it is filed at a
priority that says so. The cost of leaving it is paid by the NEXT
`[app-board]` card that changes `Board.tsx`'s threading and cannot update
the pin that protects it.

PREFLIGHT RULING (2026-08-31): `app/test/board-root.test.tsx` is ABSENT
and INSIDE this card's own fence — it is the file this card CREATES, so
the preflight's own classification (`creation target`) is the correct
one and the finding is discharged rather than corrected. Recorded because
the dispatch gate refuses on any finding, benign ones included, and a
ruling is the mechanism it names for exactly this.

## DISPATCH REFUSED 2026-08-31 — the fence cannot reach two criterion paths

The dispatch preflight refused the fence write, and it was right:

    UNCOVERED CRITERION PATH line 80: app/vitest.config.ts
      — reserved by app-shell, which this fence does not carry
    UNCOVERED CRITERION PATH line 88: app/test/board-truth.test.tsx
      — reserved by app-shell, which this fence does not carry

`touches:` is `[app-board, app/test/board-root.test.tsx]`. Both named
paths belong to **C-05 (`app-shell`)**.

**THIS IS `T-185`'S SHAPE, CAUGHT BEFORE THE LANE WAS CUT RATHER THAN
AFTER IT BUILT.** `T-185` reached a C-05 fixture its fence could not
touch, was rejected for a regression it was forbidden to repair, and cost
a whole second card (`T-185-s2`) to discharge. Here the preflight refused
at dispatch and cost nothing.

**What the next dispatch must decide, and it is a judgement not a
widening:** a criterion names a path for two different reasons — because
the work WRITES it, or because the argument CITES it. If these are cited,
the criteria should say so and the fence is already right. If they are
written, the fence needs `app-shell` and the card should say why a
board-root test reaches the shell's config. Do not widen on reflex; the
preflight's own note draws exactly this distinction.

Stamp returned to `planned`; no lane was cut and nothing was built.

## AND THE SECOND DISPATCH WAS REFUSED TOO — BY THE LANE HOOK, MID-BUILD

The re-dispatch took `touches:` as the card asked, verbatim:
`[app-board, app/test/board-root.test.tsx]`. The armed manifest expanded
to **18 paths, none of them a registry file**, and the hook refused
`docs/architecture/components/C-18-board-root.md` — the file the FIRST
acceptance criterion requires. Probed rather than discovered by a failed
write:

    docs/architecture/components/C-18-board-root.md  exit=2
      LANE FENCE: ... is outside T-112-s6's fence.

**THE LANE STOPPED RATHER THAN SHIPPING THE HALF IT COULD REACH, AND THE
HALF WAS MEASURED HARMFUL BEFORE THAT WAS DECIDED.** On a `git archive`
copy of the tree at the lane's base, the test file WITHOUT the registry
line lands `arch drift` **D2 unmapped=1, findings 4 to 5, edges 45 to
48** — which `app/test/architecture-dogfood.test.ts` asserts against by
name, and which reds at the integrator's graph regen, detached from its
cause, in a file no `[app-board]` fence reaches. With the line, the same
copy answers **mapped 201, unmapped 0, edges 45, findings 4** — every
summary at its base value.

**BOTH OF THOSE ARE THE COPY'S FIGURES AND NEITHER IS THIS TREE'S.**
`arch` reads the COMMITTED graph, which no lane regenerates, so at this
lane's tip it still prints `files=200 mapped=200` and cannot name the new
file at all. **Criterion 3's "`arch` reports the new file mapped" is
therefore satisfiable only after the INTEGRATOR's regeneration**, and
what this lane can show in-tree is `index --check` answering **STALE,
`files +1 -0`, `edges +12 -0`** — the expected reading — plus
`arch cycles` **ACYCLIC at exit 0**, which needs no graph because it
reads the registry only. The derivation is now in `C-18-board-root.md`,
which is where the next component in this position will look.

The fence was re-armed on the three-token spelling and the card built
under it. **The cost of the two refusals was two dispatches and no
rejected build**, which is the trade the preflight and the lane hook are
both for.

## VERDICT — 2026-09-02 — claude-opus-5@subagent — APPROVED

Blind verifier, independent bench `nputer-V-T-112-s6`, judged at
`a3cafbe2cce5d2681f4cfbb9a3114250c8fe9b0a` checked out DETACHED from the
base `695954f`. Every figure below names the ref it was measured at, and
every one was re-derived on this bench rather than read from the lane.

### Which blindness this was, said plainly

**A DISCIPLINE, NOT A FACT ABOUT THE CLOCK — the weaker of the two
shapes.** The lane worktree and branch already existed when phase 1
began, so there was a diff available to decline to read, and this seat
declined it by hand. The attack set and a ground-truth table were
written against the card at `695954f` and SEALED before any lane ref,
branch or diff was opened —
`attack-V-T-112-s6.md` `191bb7379bcb4c79d167610d004a51e42d6d01aab7c5f68a233a3e32501eaaa5`,
`ground-V-T-112-s6.md` `4ff8147ba21fa8328c20a6bd395b4b1572f8376f375eb11aa6b5193940fc27cf`,
sealed `2026-09-02T11:44:15Z`; both re-verified unchanged after this
verdict was written. **The phase-1 brief named no executor-derived
figure above the line.** The phase-2 brief DID carry the executor's
report — mutant map and suite counts — and it arrived after the seal;
every figure it named is re-derived below from this seat's own runs, and
none is transcribed.

### The fence widening was the DISPATCHING SEAT's, at the executor's request

`5225b99` on `main` (2026-09-02) widened `touches:` to the three-token
spelling by exact path. The executor met the lane hook's refusal on
`docs/architecture/components/C-18-board-root.md`, **stopped, and routed
it** rather than working around it; the manifest is outside every fence
and no lane can re-arm its own. The card's `touches:` at this tip is
byte-identical to `5225b99`'s, and the lane touched nothing under
`.nputer/`. The diff is exactly three paths — the new test file, the
registry file, and this card — all inside the widened fence.

### Criterion by criterion, re-derived

**1 — C-18 declares an `app/test/**` path of its own; the file exists and
is collected.** MET. The anchored derivation this component's own body
prescribes answers exactly one line, in the right file:

    command grep -n '^  - app/test/board-root' docs/architecture/components/*.md
    -> docs/architecture/components/C-18-board-root.md:7   (one match, at a3cafbe)

Collected without touching `app/vitest.config.ts`, whose `include` is
already `test/**/*.test.{ts,tsx}`: the app suite moves **50 files / 1141
bodies at `695954f` to 51 files / 1146 bodies at `a3cafbe`**, both
GREEN through the blessed runner, with `test/board-root.test.tsx (5
tests)` named in the run. `npm run build` from app/ is exit 0 at both
refs, so the annotated fixtures typecheck.

**2 — the file drives `Board` with a lane reading and REQUIRES the
drawer's dispatch block.** MET, and the kill sets are this seat's own,
each mutant landed one side only, read back from `git diff`, restored by
`git checkout` and PROVED restored against
`Board.tsx` sha256 `2533b8a7…` / `TaskDetailPanel.tsx` sha256
`2d190c1a…`:

| mutant (at `a3cafbe`) | app suite | dies in the new file | dies elsewhere |
|---|---|---|---|
| `dispatch={dispatch}` deleted | 6 failed / 1140 passed | 4 bodies | board-truth 2 |
| `brief={brief}` deleted | 4 failed / 1142 passed | 3 bodies | board-truth 1 |
| `{ ...dispatch, truncated: false }` | 1 failed / 1145 passed | **1 body, alone** | **none** |
| `{ ...dispatch, truncated: true }` | 1 failed / 1145 passed | **1 body, alone** | **none** |
| dispatch block rendered unconditionally | 3 failed / 1143 passed | 1 body | board-truth 1, detail-assignment 1 |

Both threading lines die in a file `[app-board]` may itself edit, which
is the criterion. **AND THE KILL SETS ARE NOT CONTAINED, which is the
finding this seat came closest to getting wrong.** The card is filed as
placement debt with a working pin, so containment BY `board-truth` would
have been expected and was pre-committed as NOT a rejection ground. It
does not arise: the normalising mutant — a root that threads both props
while quietly rewriting one field inside them — leaves
`board-truth.test.tsx` and `detail-assignment.test.tsx` at **38 passed,
exit 0** and kills exactly ONE body out of 1146, in the new file. Its
mirror kills the other one alone. Two singleton kill sets, disjoint, at
the site the property lives: the composition root's claim that it threads
VERBATIM, which `board-truth`'s own header records itself unable to
check. This file is therefore load-bearing at the PROPERTY level and not
only at the placement level.

**And the positive control was seen to FAIL before it was trusted**
(roles/verifier.md 2b, run by this seat rather than asserted): the body
asserting the block does NOT render with both props absent reds under the
unconditional-render mutant, in the same run as `board-truth`'s and
C-09's equivalents. The control's arrangement differs from its subject's
— no props versus both — so one arrangement does not decide both answers.

**3 — `arch cycles` exit 0; `arch` reports the new file mapped rather
than unmapped, at the lane's own ref.** FIRST HALF MET, SECOND HALF
**UNSATISFIABLE AS WRITTEN AND CORRECTLY DISCLOSED** — and this seat
pre-committed to that reading in its sealed ground truth at `695954f`,
before the diff existed, by planting a throwaway file and registry line
at the base and finding `arch`'s output byte-identical.

    arch cycles --root ../..   at a3cafbe: ACYCLIC, exit 0,
                               15 components, 43 declared edges  (unmoved)
    arch --root ../..          at a3cafbe: BYTE-IDENTICAL to the same
                               command at 695954f — files=200 mapped=200
                               unmapped=0 edges=45 findings=4, C-18 files=1
    index --check --root ../..  at a3cafbe: STALE exit 1, files +1 -0,
                               edges +12 -0

`arch` and `arch drift` compute from the COMMITTED
`docs/architecture/graph.json`; no component's `paths:` claims that file,
so no board fence reaches it and the regen is the integrator's. At this
tip the new file is **neither mapped nor unmapped** — it is absent from
the graph. **The lane claims nothing else**, names its forward figures as
a throwaway copy's in both the card and the registry file, and left
`graph.json` byte-identical to `695954f`. Reproduced independently on
this bench in this seat's own `git archive` copies of `a3cafbe`, graph
regenerated inside each copy:

    with the registry line:     files=201 mapped=201 unmapped=0 edges=45
                                findings=4 dangling=0, C-18 files=2,
                                C-18->C-06 observed 1 to 2,
                                C-18->C-17 observed 2 to 4,
                                arch blast names component=C-18
    without it (the half-fence): files=201 mapped=200 unmapped=1 edges=48
                                findings=5 — the D2 the card cites

So the harm argument for stopping is real, and the twelve new graph edges
are seven `import`s (C-18's own file, two C-17 symbols, the parser
package, and react/react-dom/vitest, which are no component's), three
`type_ref`s into the same C-17 symbols and two intra-file `call`s —
**not one new component edge**, exactly as claimed. The `index --check`
exit 1 is EXPECTED and owed to the merge's GRAPH REGEN; it is not a
finding against this lane, and was pre-committed as a non-finding.

**4 — say what becomes of the existing pin; do not delete it from outside
`[app-shell]`.** MET. `app/test/board-truth.test.tsx` is byte-identical
to `695954f` (sha256 `8b45cb81…`), the diff does not name it, and both
the new file's header and the registry file state that the pin stays and
why. `Board.tsx` is likewise byte-identical.

### Imports, security, adjacent features

The new file imports `react`, `react-dom/client`, `vitest`,
`@nputer/parser/pure` (C-06, declared), `../src/lib/board-model` and
`../src/lib/task-detail` (C-17, declared) and `../src/components/board/Board`
(this component's own). **No `App`, nothing under
`app/src/components/shell/`, nothing of C-15's or C-16's** — so the
forbidden import is absent and no undeclared component edge is bought,
confirmed against the twelve edges the gate itself printed. Security
sweep: no dependency added, no `process.env`, no network or process
surface, no secret-shaped string, no new input path — the only executable
addition is a test file, and the other two paths are prose. Nothing
adjacent broke: the whole app suite is green at the tip, and the only
files that move under any mutant are the three that pin this threading.

### The figures this verdict is measured at

`695954f` (base): parser 372, app 1141, rust 639 / 18 targets, all GREEN.
`a3cafbe` (this tip): app 1146 GREEN, `npm run build` exit 0.
The four suites `docs-gate.mjs` names for this card and the registry file
— `cargo test` from app/src-tauri, `npm test` from app, `npm test` from
tools/e2e, `npx vitest run` from lib/parser — were re-run by this seat at
the VERDICT COMMIT rather than at the tip it was sent, because appending
this section makes a tree nobody has tested and both changed paths are
code inputs. `docs/CAPABILITIES.md` is NOT stale (`capabilities:check`
CURRENT, 52297 bytes); `npx tsc --noEmit` from lib/parser and
`npm run typecheck` from tools/e2e are both exit 0.

**AND THE e2e LEG IS RED FOR A REASON THAT IS NOT THIS TREE'S — ATTRIBUTED
AT THE BASE BY NAME RATHER THAN COUNTED.** `gate-run e2e` answers
`bodies=619 RED`, 617 passed and **2 failed, both in
`tools/e2e/tests/session-economics.spec.ts`** (the recommended-seat body
and the advisory-line body). Both fail on the same assembler refusal:

    T-202-s1 holds a worktree on
    refs/heads/task/T-202-s1-solo-lock-whole-path-key and no live card
    declares that id

`/Users/ujju/Projects/nputer-T-202-s1` exists on this MACHINE, and its
card — `T-202-s1-the-solo-lock-keys-on-the-last-eight-bytes-…` — is
present on `main` and on that lane's own branch but **absent at this
bench's base `695954f`**, which predates it. So this is REF SKEW between
an older tree under judgement and the machine's live worktree list, the
class `docs/STATE.md` names. **Reproduced at the base to prove it**: the
same two bodies, run alone at `695954f` before this lane wrote a byte and
before this verdict existed, fail with the identical message — 2 failed,
8 passed. It is therefore not the diff's, not this verdict's, and it
cannot reach CI, which has no worktrees. The lane reported e2e green; the
worktree that reds it was cut between that run and this one.

**Non-blocking, filed as neither a failure nor a task.** Criterion 3's
second half cannot be derived at any lane's own ref for any card that
ADDS a file — a future card of this shape should ask for
`index --check`'s file line plus a named copy, which is what this lane
produced anyway.
