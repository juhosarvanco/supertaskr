# Checkpoint: standing triage sitting #5 — the first sitting on this repository called by an INSTRUMENT rather than by a cadence

Date: 2026-08-31. Seat: architect/integrator, mid-night, three lanes
live. Scope: the suggested column 5 → 0; four promotions and one
absorption; no merge — the whole sitting is `docs/tasks/**` plus this
record.

## What called it, and that is the point

Not a calendar and not a seat remembering. `npm run health`, fed its
readings for the first time at `T-172`'s close, answered:

    drifting — triage/net-arrivals-per-window: 10 cards has risen above
    the 9 drift line, not yet the 40 breach line
      derivation  since the newest Checkpoint: commit 4e08d29 —
      10 suggestion card(s) added, 0 dispositioned, net 10

**Sittings #1 and #2 were called by a band too, but only after it had
already BREACHED.** #3 and #4 were called by a cadence — a seat deciding
it was time. This is the first one a band caught at DRIFT, which is what
a drift line is for: it fires while the answer is still cheap.

Board, before → after (`building` 3 and `done` 156 unchanged; the three
live lanes are untouched by this sitting):

| | before | after |
|---|---|---|
| suggested | 5 | **0** |
| planned | 80 | 84 |
| parked | 124 | 124 |

## The tally — 4 promoted, 1 absorbed, 0 parked, 0 archived

| card | disposition |
|---|---|
| T-140-s8 | PROMOTED F-06, priority 12 → 24 — **disposition 3 RULED** (name the state) |
| T-140-s9 | PROMOTED F-06, priority 18 → 25, as filed |
| T-172-s1 | PROMOTED F-03 p8, as filed |
| T-179 | PROMOTED F-04 p9 — **its evidence tripled overnight** |
| T-181 | **ABSORBED into `T-167-s8`**, file removed in this commit |

**Both priority moves are collision repairs, not value judgements**:
F-06's planned column already held 2 through 23.

## The one ruling, and this seat could attest the instance rather than reason about it

`T-140-s8` offered three dispositions and preferred the third. **Taken.**
Widening the fence for budget-moving cards reintroduces the T-050
staleness for every such lane; forbidding the lane to move its own pins
hands the integrator a pin whose story it did not live through, which is
exactly what *"re-derived and explained, never loosened"* exists to
prevent. Naming the state costs a clause and changes no mechanism.

**And the instance is this seat's own, hours later.** At `T-140-s4`'s
integration the branch carried the new pins and the old graph exactly as
the card describes; this seat regenerated at the merge and committed the
graph with the checkpoint, and the lane's worktree had been green the
whole time against an uncommitted file. Both true at once. The handoff
was the defect, not the work — which is what the card says and what a
sitting can now confirm rather than believe.

**The bump question is left to the dispatcher, deliberately.** The fence
carries `method/lane-protocol.md`, which is not a `KIT_FILES` entry, and
a handoff clause is not card/room/brief/role grammar — but *probably* is
not a derivation, so the lane re-derives both tests at its own ref, and
if a bump turns out to be owed the clause becomes a rider for the next
method release rather than a reason to widen the fence.

## Two sightings of one class, in one night, by two different seats

`T-140-s9` and `T-177`'s assigned correction are the same shape found
independently hours apart: **a property that is correct, load-bearing,
and pinned by nothing that could notice its removal.**

- `T-140-s9`: the collector's symlink refusal is guarded THREE times, and
  lifting the first two guards leaves both symlink bodies passing, because
  `relative_posix`'s own `strip_prefix` is a third containment layer.
- `T-177`: the backbone reporter's section scoping — lifting it left the
  suite at 343/343, and **no gate on this repository could have caught
  it**, because the tree contains zero decorated feature bullets outside
  a backbone for the live-tree check to notice.

**Both were found by a poison drill that DISCLOSED its survivors rather
than reporting a clean sheet**, one by an executor on its own work and
one by a blind verifier. The two cards should be read together by
whoever takes either; the sitting does not merge them, because one is a
Rust guard and the other is a parser scope and folding them would make a
grab-bag.

## `T-179`'s evidence tripled while it sat

Filed after ONE sighting. By this sitting **every executor dispatched
tonight had reported it independently** — `T-112-s3`, `T-140-s4`,
`T-172` and `T-177` each read ROW 4's worktree line and found it naming
a path inside the repository, under a heading citing the rule it breaks.
Four lanes, four correct reports, and **zero lanes that actually cut
themselves in the wrong place**, because the dispatching seat corrected
each of them in the launch prompt.

That is the argument for fixing it and the reason it is not urgent, in
one fact: a discipline is standing in for a construction, and it is
holding — which is precisely the trade this project keeps converting the
other way.

## The absorption

`T-181` folds into `T-167-s8` on its own filer's recommendation: same
fence, same argument, different trigger. `T-167-s8`'s trigger is the
PUSH; the absorbed one is the COMMIT THAT ADDS A RECORD, and what it
demands is that the record carries its readings — a health census line
and its exit, plus the boot check's where that gate's own trigger is
met. **It must demand the READING, never the verdict**, because
`npm run health` exits 3 by design and a guard wanting exit 0 would
refuse every checkpoint forever.

**`cargo audit` was deliberately NOT absorbed**: it is already a CI step
(`command grep -c "cargo audit" .github/workflows/ci.yml` answers 2), so
it needs no guard — a fact the absorbed card's filer had wrong at first
and corrected by checking rather than by asserting.

## What the sitting deliberately did not do

- **No preflights were run**, and the reason is not laziness: three
  fences are held by live lanes (`tools/e2e`, `app-shell`/`app-dispatch`/
  `app-board`, `app-interview`), so every promotion touching them would
  report the same live-lane finding — the correct-but-uninformative
  result sitting #3 already documented. `--preflight` is a DISPATCH step
  and runs at the moment a lane is cut.
- **It ruled nothing that is @human's.** The FORM question (reopened
  2026-08-31), the steering split, and T-025-s4's three remaining
  permission questions were not touched, as @human asked for the night.
- **It asked no graph**: `docs/tasks/**` and this file only, and `docs/`
  is outside the walk. Recorded as a deviation the same way sittings #2,
  #3 and #4 record it.

## Gates

- `npm run lint:docs` — **exit 0**; every live card's frontmatter parses
  with a legal status, which is the half that matters after a sitting
  rewrites eight frontmatter blocks.
- `npx vitest run` from lib/parser — **344 passed, exit 0** (the parser
  reads every card).
- The duplicate-key defect that broke sitting #4's own script is guarded
  against this time: the writer asserts key uniqueness before writing,
  and the diff was read back before the commit.

## Owed after this record

- **The three live lanes** (`T-112-s1`, `T-153-s8`, `T-171`) close on
  their own records.
- **@human's desk, untouched overnight and waiting**: the FORM question,
  the steering split, and the three permission questions that want a
  watched genesis run.
