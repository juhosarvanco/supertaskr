---
id: T-018-s7
title: A pull the overtake guard drops must also emit no `model-updated`, and nothing drives that end to end through the shipped store — the property is inherited from an identity return that only a pure-reducer body asserts
feature: F-02
milestone: 4
size: S
priority: 4
status: verifying
suggested_by: executor claude-opus-5@subagent @T-018-s6
blocked_by: []
touches: [app/test/startup-recovery.test.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

**Class parent: `T-018-s6`** (the startup `docs_snapshot` pull could
overtake a `docs-changed` emit and `reduceDocs` decided on `seq` alone).
Same defect, the half that lives one caller UP from the reducer and
outside that card's fence.

## What T-018-s6 built, and the exact edge it left uncovered

`reduceDocs` now returns `prev` BY IDENTITY when a pulled snapshot
carries a higher `seq` and an older content time than an emit already
applied for the same project. The identity is not decoration: it is the
whole of the second guarantee, because `applyDocsPayload` opens

    const next = reduceDocs(shell.docs, payload);
    if (next === shell.docs) return; // stale/duplicate: no re-render, no echo

and that early return precedes BOTH `setShell` and `sendEcho`. So "the
dropped pull emits no `model-updated`" is TRUE, and it is true by
inheritance from a reference comparison rather than by anything that
drives it.

**THE MEASUREMENT THAT MAKES THIS WORTH A CARD.** Driven through the
SHIPPED store at the base (jsdom, the real `startDocsWatcher`, the emit
delivered while the `docs_snapshot` invoke is still in flight), the
unguarded defect produced a **second `model-updated` echo at `seq 6`**
over a model the emit had already echoed at `seq 5` — one observable
symptom of the overwrite that the pure reducer cannot show, because
`sendEcho` is module-private and the echo is a boundary effect.

## Why T-018-s6 could not build it

Its fence was `app/src/lib/watcher-store.ts`,
`app/src/lib/docs-model.ts`, `app/test/watcher-store.test.ts`,
`app/test/docs-model.test.ts`. Both fenced test files run in vitest's
`node` environment with no Tauri boundary mocked, and the echo path is
reachable only from a jsdom body that mocks `@tauri-apps/api/core` and
`@tauri-apps/api/event` — scaffolding that already exists, in
`app/test/startup-recovery.test.ts`, which is not in that fence. The
lane asserted the property at the only point it could reach — identity,
with `toBe` — and routed the rest here rather than converting a
47-body node-environment file to jsdom to reach one assertion.

## What a fix would build

One body in `app/test/startup-recovery.test.ts`, using that file's
existing `ipc` harness: deliver a `docs-changed` emit (`seq 5`, a LATER
`generatedAtMs`, three files) through the captured `onDocsChanged`
handler while the `docs_snapshot` invoke is parked, then release the
invoke with an `open` status carrying the overtaking pull (`seq 6`, an
EARLIER `generatedAtMs`, two files). Assert on `ipc.emits`: exactly ONE
`model-updated`, at `seq 5`. The pair must be built by hand — that
file's own fixtures, like both of T-018-s6's, stamp `generatedAtMs`
monotone with `seq`, so the two stamps cannot disagree in them and the
interleaving is unrepresentable.

## What is deliberately NOT in this card

The guard itself, which shipped with T-018-s6 and is pinned by five
bodies in `app/test/watcher-store.test.ts` (positive control, the
two-path agreement body, the over-broad and same-millisecond
directions, the `generatedAtMs: 0` abstain, and the cross-project
direction) plus one ruling body in `app/test/docs-model.test.ts`. This
card adds no source change at all: if it reds, the store changed, not
the reducer.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at T-018-s6's merge (f2a3ed0)

The architect seat. True by inheritance today (`applyDocsPayload`'s
identity return precedes `setShell` and `sendEcho`) and pinned by
identity in the store's own bodies; what is missing is the end-to-end
drive through the shipped store, which needs a jsdom body in a
node-environment file. One body, one file; the T-018-s6 verifier
measured the base's second echo and the tip's single one through the
shipped store already, so the lane has its expected values.

## BUILD NOTE, 2026-09-02 — the recipe above did not run as written, and what was changed inside the fence to make it

BUILD RULING (2026-09-02) on "release the invoke with an `open` status":
**the card's own drive was not buildable on the shipped harness.** In
`startup-recovery.test.ts`'s `invoke` mock the `docs_snapshot` branch
ANSWERED before `ipc.parked` was ever consulted, so the one command whose
in-flight window this race lives in was the one command no body in that
file could hold open. Three routes were available — the sync drive
(`startDocsWatcher` reaches `listen` synchronously and `invoke` only after
an await), a `listenParks` release, or editing the harness — and the
harness edit was taken, because it is INSIDE this card's fence, because it
leaves the card's recipe exactly as written, and because the other two
drive a DIFFERENT interleaving from the one the card specifies. The
`docs_snapshot` branch now consults `parked` after `invokeRejects` and
before `Promise.resolve(ipc.status)`; every other body in the file is
unchanged by construction, since `freshStore` empties the set.

**IT IS LOAD-BEARING AND DEMONSTRATED SO** (drill M4, below): with that
branch reverted, both new bodies red on the positive control that proves
the pull is genuinely in flight — *"and it really is still in flight:
expected undefined to be 'STILL PARKED'"* — rather than passing quietly
over a pull that had already answered.

**A SECOND BODY WAS ADDED BEYOND THE CARD'S ONE**, and it is the
discriminating half a negative assertion is owed: the same parked-pull
drive with the single `generatedAtMs` the guard reads moved the other way,
which applies and echoes TWICE. Without it "exactly one echo" is satisfied
equally by a guard that dropped the pull and by a harness that never
delivered it.

**NO SOURCE CHANGE, as the card requires**: the merge's diff is exactly
`app/test/startup-recovery.test.ts`.

## VERDICT

**APPROVED** — 2026-09-02, verifier seat `claude-opus-5@subagent`
(V-T-018-s7), judging tip `3660324369a5a6e077b99784dccce3b45cb6a11b`
(code commit `ebee624`) against base
`874eeff5a2e14b39d73f2d01f57da93fbf9bbed9`, from the detached bench
`/Users/ujju/Projects/nputer-V-T-018-s7`. Ports 25018 / 26018; 1420 was
neither probed nor bound, because nothing in this pass needed a server.

### The frame, and the seals that make the blindness checkable

Phase 1 was its own spawn and it reached this seat BEFORE the work
existed: the attack set, the ground truth and their stamps were written
and hashed against the base with no lane, no branch and no diff in view.

| file | sha256 |
| --- | --- |
| `attack-V-T-018-s7.md` | `90a17465386d66dd7c3d3950702e14b4f37a99f21004f2f811da24283372aafe` |
| `ground-V-T-018-s7.md` | `f8209e5318bf93fa1c5b08bf9c05d02f2caca88bf49b4d6bd7d5f77fa6dc275f` |
| `stamps-V-T-018-s7.txt` | `3f349dd063be99bb86a01b4719ac803292d636c001162cd159acff7c0bc392bb` |

Sealed **2026-09-02T16:14:06Z**, re-verified byte-unchanged at this
verdict. **Disclosed:** the phase-2 dispatch carried the executor's own
mutant outcomes, body counts and gate figures — after the line, and not
one of them is relayed here. Every figure below is this seat's own,
measured on this bench; where one agrees with the executor's it agrees
because two seats measured the same tree.

### The ground truth this verdict is judged against, taken at the base

Measured in phase 1, before the diff existed, in a scratch spec built
from `startup-recovery.test.ts`'s own first 206 lines and then deleted —
emit `seq 5 / clock +2 s / 3 files`, then pull `seq 6 / clock +1 s /
2 files`, same folder, driven through the shipped store:

| | base `874eeff` | the same base with the s6 guard mutated off |
| --- | --- | --- |
| `model-updated` | **once**, at seq 5 | **twice**, at seqs 5 and **6** |
| model | `seq 5`, 3 files | `seq 6`, 2 files |

So the card's central measurement is confirmed independently of the lane:
the property is real, inherited from a reference comparison, and at the
base undriven.

### The criteria, every one re-derived here

1. **Bodies in the fenced file, driving the SHIPPED store.** Two, both in
   `app/test/startup-recovery.test.ts`, both through
   `store.startDocsWatcher()`, the handler the store itself registered on
   `docs-changed`, and the `emit` the store itself calls. Nothing below
   the Tauri boundary is faked and no store internal is spied on.
2. **No source change, as the card requires.** `git diff 874eeff..3660324
   -- app/src app/src-tauri lib tools method` is EMPTY. The whole diff is
   two files, +258 / -4: the spec and this card.
   `app/src/lib/watcher-store.ts` hashes `00c02e73…` at both refs.
3. **The interleaving is on the guard's route, not a decoy.** Pull
   `seq 6 > 5`, so the T-007 watermark line cannot be what drops it;
   `generatedAtMs` `+1 s` against the emit's `+2 s` — non-zero, non-null,
   strictly earlier; identical `projectDir`. That clears all four
   spellings of the vacuous route this seat pre-committed to hunting.
4. **The assertion names the survivor, not just a length.** Exactly one
   `model-updated`, at `seq 5`, `taskCount 3`, the emit's three ids, and
   `ipc.emits.map(name)` equal to `["model-updated"]`. A run in which the
   emit never landed and the PULL echoed alone therefore cannot pass it —
   which a bare `toHaveLength(1)` would have allowed.
5. **Counts, each with its ref.** `startup-recovery.test.ts` 48 bodies at
   `874eeff` -> **50** at `3660324`; the app suite
   `gate-verdict suite=app exit=0 bodies=1148 targets=1
   ref=3660324… verdict=GREEN` against `bodies=1146` at the base. Two
   added, none removed, none renamed.
6. **The gates docs-gate names for this card path** — it FIRES on
   `docs/tasks/T-018-s7-….md` and names `npm test` from app/, `npm test`
   from tools/e2e/ and `npx vitest run` from lib/parser/. At `3660324`:
   **parser 372 GREEN · app 1148 GREEN · e2e 630 GREEN**, each read off
   `gate-run`'s own verdict line, count first.

### The drills

**A tree fact that makes this section honest, measured at the base before
any mutant was written:** `app/test/shell-harness.test.ts`'s *"is not
stale: the build is at least as new as the store"* compares
`dist/assets/*.js` mtime against `src/lib/watcher-store.ts` mtime, so
every write to the store — the mutation AND the restore — reds a body
that has nothing to do with the mutant. `npm run build` was re-run after
every write before any suite was read, which is why no red below is
misattributed. Each landing was read back with `git diff`, restored with
`git restore --source=HEAD --staged --worktree`, and proved by
`shasum -a 256` (`00c02e73…` for the store, `a7ff1a9b…` for the spec).

| mutant | site | kill set at the tip |
| --- | --- | --- |
| **M1** `readingIsOvertaken`'s clock arm -> `return false` | the guard | **4**: new body 1, plus `T-018-s5` x2 and `T-018-s6` x1 in `watcher-store.test.ts`. The same mutant at the BASE killed **3** — the new body is the whole of the difference |
| **M2** `applyDocsPayload`'s `if (next === shell.docs) return;` removed | the ECHO suppression | **3**: new body 1, the pick-path *"a STALE pull drops by identity"*, and a T-064 snapshot-less-switch body |
| **M3** the `"open"` pull arm rewrites `generatedAtMs` to `MAX_SAFE_INTEGER` | the pull's own arm | 5, including both new bodies — noisier than predicted, because it also moves the echo's provenance, which three provenance bodies read |
| **M4** `reduceDocs`'s `payload.seq <= prev.seq` line removed | the T-007 watermark | 5 pre-existing bodies, **neither** new body |
| **M7** the guard made over-broad (`< prev + 5 s`) | the guard, other direction | 36, including new body 2 but **not** new body 1 |
| **M5** DATA: the two `generatedAtMs` stamps SWAPPED in the new fixture | the payload pair | new body 1 alone |
| **M6** DATA: the pull's `seq` lowered to 5 — the vacuous route | the fixture's route | **nothing; it SURVIVES**, and that is argued below |

**Kill-set containment, settled both ways and without needing a
unique-kill mutant.** New body 1 dies under M1 and under M2, and the sets
of PRE-EXISTING bodies those two kill are disjoint — so no existing body
dies under both, so body 1's kill set is contained in no existing body's.
M4 settles the converse: five pre-existing bodies die and neither new one
does. Between the two NEW bodies, M1 kills 1 and not 2 while M7 kills 2
and not 1, so neither is a restatement of the other and the second body
is load-bearing rather than decorative.

**The site the property lives.** M2 is the proof that matters for this
card in particular: it leaves the guard and the model untouched and moves
only the echo, and body 1 dies. That is the boundary effect the class
parent's fence could not reach, measured rather than argued.

**M6 SURVIVES, AND IT IS NOT A DEFECT — the argument, because a surviving
mutant deserves one.** With the pull's seq lowered to 5 the drop moves one
rule UP, to the T-007 watermark, and body 1's observations are identical:
measured at the base in phase 1, that arrangement yields the same single
echo, the same tree and the same watermark. So the body's own assertions
cannot say WHICH rule dropped the pull. What pins the route is the pair of
readings rather than any one assertion — under M1 the shipped fixture
REDS, and under M6's arrangement it could not, because a pull at seq 5 is
dropped by a line M1 does not touch. The route is proved jointly, and this
is written down so a later reader does not mistake a surviving mutant for
an unmeasured claim.

### The harness edit, judged on its own

`ipc.parked` genuinely could not hold `docs_snapshot`: that branch
answered before the `parked` check was reached. This seat measured it at
the BASE in phase 1, independently of the build note — with
`ipc.parked = new Set(["docs_snapshot"])` the command answered anyway,
`ipc.release` stayed `null`, `invokeCalls` reached 1. The edit sits inside
the fence, after the `invokeCalls` increment and after the `invokeRejects`
arm, so neither the counter nor the refusal path moves, and it is inert
for every other body because `freshStore()` empties the set — which the
1148-body green over the whole app suite is the check on. Two other drives
existed and are named in this seat's sealed ground truth (the sync drive,
since `startDocsWatcher` reaches `listen` synchronously and `invoke` only
after an await; and a `listenParks` release); the route taken is the one
that matches the card's own recipe, and the ruling is recorded where a
later reader meets it.

### Security sweep

Test-only diff. No dependency added — `package.json` and both lockfiles
are untouched — no new input path, no endpoint, no secret or key, no
absolute machine path baked into a fixture, no widened export on the
store. Nothing to report.

### Adjacent features, and the fence

`watcher-store.test.ts`, `docs-model.test.ts` and the T-063 / T-064 /
T-192 bodies in the fenced file all pass at the tip; the three suites
above are green over 2150 bodies between them. The fence held exactly:
`touches: [app/test/startup-recovery.test.ts]` plus this card's own file
is the whole diff, and no widening was asked for or taken.

### One sentence on this card READS wrong, and it is this card's prose

The section above says the guard is pinned by five bodies in
`watcher-store.test.ts` **plus one ruling body in `docs-model.test.ts`**.
The five are real — the `T-018-s6` describe holds exactly five bodies —
but only ONE of them reds when the guard is removed; the other four
assert the directions that must still APPLY (newer, same-millisecond,
`generatedAtMs: 0`, cross-project), and a mutant that removes a drop
cannot kill an assertion that something applies. The `docs-model.test.ts`
body is the same shape one layer further: it RULES `applySnapshot`
correct as written and asserts the overtaking payload still APPLIES
there, so it reds only if a later card moves the clock comparison DOWN —
never when the guard is removed. Both sentences are true as written and
neither is a coverage claim this lane could have discharged; recorded so
the next reader of that paragraph does not go looking for a body that was
never supposed to red.
