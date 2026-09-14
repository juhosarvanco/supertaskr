---
id: T-217
title: TWO LANES MINTED T-214 ON THE SAME AFTERNOON — a lane cannot see another lane, so no lane can allocate a unique id, and the census that catches it fires only at the SECOND merge when renumbering is most expensive
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/orchestrator.md]
suggested_by: "the incident itself, 2026-08-31: T-185-s2's lane and T-199's lane each minted T-214 for unrelated subjects, neither able to see the other. Filed on the trigger condition a peer seat and this seat agreed on — file it when a collision actually happens, with the incident as evidence"
builder:
review: independent
---

Absorbs: T-110-s2 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews) — the ruling only, no reader work. The child's wake has occurred (T-111 and T-112 are done; the lane list is rendered to a human). The subject is the older lane-branch grammar (`tNNN-` names from before T-110's `task/T-<digits>-<slug>` shape), not the product-name rename.

**THE RULE WAS DELIBERATELY NOT WRITTEN, AND THE CONDITION FOR WRITING IT
HAS NOW OCCURRED.**

Earlier on 2026-08-31 this seat asserted to peers that only the
dispatching seat may allocate card ids. It then went looking for that
rule and **found it written nowhere** — no hit in
`method/tasks/TASK-FORMAT.md`, `method/lane-protocol.md`,
`method/roles/`, or `docs/CONVENTIONS.md`. A peer seat ruled: leave it
unfiled, because *the uniqueness census is already the mechanism and the
claim-message protocol is already the convention; writing a rule on top
adds law without adding a mechanism. If two seats ever do collide on an
id, file it then with the incident as evidence.*

**The incident is here.**

## The collision, measured

    /Users/ujju/Projects/nputer-T-185-s2/docs/tasks/T-214-*.md
      id: T-214  "A structural-literal fixture catches a WIDENED prop
                  type and is structurally blind to a narrowed one"

    /Users/ujju/Projects/nputer-T-199/docs/tasks/T-214-*.md
      id: T-214  "ARMING THE FENCE MAKES THE CAPABILITIES CENSUS
                  UNREGENERABLE BY THE LANE THAT STALED IT"

Unrelated subjects. Two cross-references each. **Neither is on `main`**,
so nothing is broken yet — which is exactly why it is worth filing now
rather than after it costs something.

## BOTH LANES OBEYED THE RULE. THAT IS THE POINT

Neither lane was careless. Each derived an id and each could have checked
uniqueness at its own ref — and **at its own ref, `T-214` was free.** A
lane worktree cannot see another lane worktree: that isolation is the
whole reason lanes exist, and it is what makes the check unsound from
inside one.

**No amount of diligence inside a lane can prevent this.** The
information required — every id minted in every live lane — exists only
at the seat that holds them all.

## AND THE EXISTING MECHANISM FIRES TOO LATE

The uniqueness census is real and would catch it: 401 ids, 401 unique,
with a planted-duplicate control proving the check fires. But it runs
over **one tree**. It therefore cannot see the collision until the SECOND
lane merges — at which point:

- one card must be renumbered, and
- every reference written into the OTHER lane's notes, report, verdict
  and commit messages already names the id being taken away.

**The cost of the fix is proportional to how late it is found**, and the
current instrument guarantees it is found at the worst moment.

## What a fix decides

1. **Where the census runs.** Over `main` plus every live lane's
   `docs/tasks/`, derived from `git worktree list --porcelain` — the
   same derivation `T-209` uses for fences, and for the same reason: the
   set exists on disk and must not be typed.
2. **When it runs.** At MINT time is the useful moment; at merge it is
   already expensive. A lane cannot run it, so either the dispatching
   seat pre-allocates a block, or the mint is a request the holder
   answers.
3. **Whether pre-allocation beats detection.** A construction beats a
   check — `lane-protocol.md` rule 4's own closing argument, about a
   machine-scoped surface, which a card id is: *"two lanes cannot pick
   the same number when the number comes from the lane."* An id derived
   from the parent card (`T-185-s2`, `T-199-s1`) collides with nothing by
   construction, and **the two lanes that DID derive suffix ids today —
   `T-185-s1`, `T-185-s2`, `T-189-s1`, `T-189-s2`, `T-197-s1`,
   `T-197-s2` — produced no collisions at all.** Only the two that minted
   fresh `T-NNN` ids collided. That asymmetry is the strongest evidence
   in this card and it was free.

## Acceptance criteria

- THE census SHALL run over `main` AND every live lane's cards, with the
  lane set DERIVED from `git worktree list --porcelain` at the moment of
  the check.
- A COLLISION SHALL be reported naming both ids, both worktrees and both
  titles — a report that says only "duplicate" sends the reader back to
  the search this card is about.
- **A POSITIVE CONTROL SHALL prove a genuinely fresh id is ALLOWED.** A
  check that refuses every mint is indistinguishable from one that works.
- **A SECOND CONTROL SHALL prove the cross-lane case specifically**: an
  id free on `main` and taken in a live lane SHALL be refused. A census
  over one tree passes that case, which is the whole defect.
- WHERE a suffix id derived from a parent is used, the check SHALL still
  run — a construction that is believed rather than checked is a
  resolution.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.
- WHEN this card is dispatched THE card SHALL carry the owner's recorded ruling on the id-minting namespace for branches in the older `tNNN-` grammar — the three arms the absorbed record keeps whole: (a) the older grammar is not a lane namespace and such a branch is reported as not-a-lane with its typed reason, no grammar widening; (b) or (c) a reader change; the seat recommends (a), and the choice is outstanding until ruled. This card's obligation is the recorded decision only; under (b) or (c) the reader and its tests are a named app-dispatch follow-up, never this lane's, and this card's fence is unchanged. (absorbed from T-110-s2, 2026-09-14; the count of such branches on a host is a live observation, not a property of any commit)

## Read beside

`T-209` (the same `git worktree list --porcelain` derivation, for
fences), `lane-protocol.md` rule 4 (machine-scoped surfaces, and *a
construction beats a check*), `T-057` (one rule, one implementation), and
`T-207` (mechanical versus memory-held).

## Disposition of the live collision, recorded so the next seat is not confused

The two `T-214`s are resolved at MERGE by renumbering whichever lands
second, in the merge commit, with its cross-references updated in the
same commit. Neither lane is edited while a verifier is drilling its
tree — that is the `T-202` data-loss shape and it is not repeated for a
bookkeeping fix.

## CORROBORATION — 2026-09-01 at `a014b81`, THE SAME DEFECT ON A DIFFERENT RESOURCE

Appended rather than filed beside, per TASK-FORMAT: a second instance is
worth more attached to the first, because the pair is the evidence that
the class is real.

**THE e2e PORT IS DEFAULTED, NOT DERIVED.** `tools/e2e/preflight.ts:28`
reads `NPUTER_E2E_PORT` and falls back to **14520 for every checkout on
the machine**. Three lanes were live when this was measured, two of them
owing that suite through the docs gate. Nothing in the harness derives
the port from the lane; nothing warns; and two lanes taking 14520
together produce a failure that looks like a flaky test in both.

**This is this card's own sentence, unchanged: a lane cannot see another
lane, so no lane can pick a unique value — and a DEFAULT is the shape
that makes every lane pick the SAME one.** An id collision needs two
lanes to choose alike; a port collision needs only two lanes to not
choose at all.

### What makes it a corroboration and not a restatement

The id case had no obvious construction — this card had to invent one.
Here the construction already exists, is written down in
`docs/STATE.md` (*derive scratch ports FROM THE CARD ID*), was applied by
a verifier last night (port 15175 for `T-175`), and the harness still
defaults. **So the gap is not that nobody knew the rule. The gap is that
the RULE and the TOOLING are separate objects, and only one of them was
fixed.** That distinction is what this instance adds, and it widens what
a fix here has to cover: a derivation the docs prescribe and the default
path ignores is not a derivation anybody uses under pressure.

### Attribution, because an unattributed finding reads as advice

Found by the architect/integrator seat immediately after dispatching
three lanes with a brief that NAMED this exact class — *reach for the
construction, not the check* — and then handed all three a suite whose
default violates it. Corrected in-flight by giving each lane its own
derived port (`15000 +` the card's number). **The brief checked that the
lanes knew the rule; it never checked that the tooling obeyed it**, and
that is the fifth instance of this class in two days.

## CORROBORATION — 2026-09-01, `init.defaultBranch`, AND THIS ONE REDDENED MAIN

Third instance on this card, and the first to cost a red integration
branch rather than a confusing hour.

**A test fixture called `git init` without naming a branch.** That name
comes from `init.defaultBranch`, which is MACHINE config. This
developer's machine answers `main`; the CI runner answers `master`.

So the fixture built a **different repository on each machine**. The
landing gate then resolved a different ref as the integration branch,
judged a different commit range, and reached a different verdict:

    macOS  (local `main` exists)   -> range empty      -> gate passes -> test GREEN
    Linux  (local `master`)        -> falls to origin/main
                                   -> README.md in range, out of fence
                                   -> REFUSED before the cheap checks -> test RED

`push-guard.spec.ts:1074` went green on every local run and red on every
CI run for five hours. **Reproduced locally by scoping one env var**
(`GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=init.defaultBranch
GIT_CONFIG_VALUE_0=master`) — the same failure, the same line, which is
how the diagnosis stopped being a guess.

### Why it belongs here and not on a platform card

Nothing about this is macOS-versus-Linux. **It is a value global to the
machine that a test DEFAULTED instead of specifying**, which is this
card's whole sentence: a lane cannot see another lane, a machine cannot
see another machine, and a default is the shape that makes each one
silently pick its own answer.

The card's remedy applies unchanged — DERIVE OR SPECIFY, never default.
Here specifying is enough: `git init -b main`.

### The asymmetry that hid it

**Seven fixtures in this suite already pin the branch** —
`--initial-branch=main` in five, `-b main` in `landing-gate.spec.ts`. The
convention existed and was followed everywhere except the three files
added by `T-203`. So the failure looked like a platform difference rather
than a missed convention, because the surrounding code was already right.

Fixed at nine call sites across `push-guard`, `push-checks` and
`gate-run`, and **verified under BOTH branch settings** — 95 passing with
`main` and 95 with `master`. Written into `docs/CONVENTIONS.md` as a rule
rather than left in this record (`T-146`).

## FOURTH INSTANCE, SAME NIGHT — `user.email`, AND I FIXED ITS SIBLING WITHOUT SWEEPING

Appended rather than filed beside, per TASK-FORMAT.

Hours after the `init.defaultBranch` instance above was fixed, CI went
red again on two `lane-lock.spec.ts` bodies:

    Error: the sync failed: Committer identity unknown
    *** Please tell me who you are.

**The fixture's own `git()` helper passed `-c user.email` and
`-c user.name` correctly.** Two `git merge` calls bypassed that helper
with a raw `spawnSync`, so they inherited the MACHINE's global identity —
present on this developer's box, absent on a CI runner.

Same class, same night, same file family: **a fixture reading machine
config instead of stating what it needs.**

### The part that is worth more than the fix

**I fixed the branch-name instance and did not sweep for siblings.** The
diagnosis named the class correctly — *a value global to the machine that
a test defaulted instead of specifying* — and then the remedy was applied
to exactly the one call the failure pointed at. Git identity is the same
class, in the same suite, and it was sitting there.

**A class named and a class swept are different acts, and only the second
one ends anything.** Cost: a second red CI cycle and a second push.

### The construction that closes both

Neither instance needed a better rule — the rule was already written.
What was missing was a way to ASK the other environment. One line:

    HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null \
    GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=init.defaultBranch \
    GIT_CONFIG_VALUE_0=master npx playwright test tests/<spec>

Run against the fixed suite: **13 passed.** Run against either defect it
reproduces the exact CI failure in seconds. Now in `docs/CONVENTIONS.md`
as a rule, because a machine-scoped surface is not closed by remembering
it — it is closed by making the other machine cheap to ask.

## Absorbed from T-110-s2 — The older tNNN- branch spelling reads as "not a lane", and whether that is right is a ruling nobody has made (kept whole)

Title as filed: "The older tNNN- branch spelling reads as "not a lane", and whether that is right is a ruling nobody has made"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by executor claude-opus-5 @T-110.

**Addressed to the PLANNER or the ARCHITECT** — it is a question about
what a lane IS, not about the reader that answers it.

T-110's positive shape accepts exactly `task/T-<digits>-<slug>`, which
is what `docs/CONVENTIONS.md`'s LANE PROTOCOL bullet spells and what the
card's own problem statement quotes (`ref: refs/heads/task/T-NNN-<slug>`).
Anything else is reported as `WorktreeEntry::NotALane` with a typed
reason — reported, never dropped.

**But the same bullet says both branch spellings are live in this
repository and the older one is not a mistake to fix**: derived at
`4d2f03c`, 69 branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`. So a
worktree checked out on `t042-genesis-switch` would be shown by the
board as *not a lane*, with `notTheLaneNamespace` as its reason.

### Why this is filed rather than fixed (T-110-s2)

Three arms, and picking one from inside the lane would be inventing:

- **(a) Leave it.** The old spelling belongs to branches that ran and
  finished; `git worktree list` has never held one in this session, and a
  reader that accepts only the current protocol is a reader that tells
  you when someone has departed from it.
- **(b) Widen the grammar** to a second shape, `t<digits>-<slug>` with
  the id built as `T-<digits>` — five lines, and it makes an entry that
  is genuinely a lane read as one.
- **(c) Widen and MARK it**, so the row carries which spelling it
  matched. This is the only arm that lets the board say *"this lane is on
  the old spelling"*, which is a fact worth showing exactly once.

The cost of getting it wrong is asymmetric and that is the argument for
ruling rather than defaulting: under (a) a real lane reads as a stray
worktree, and the board's whole point is that a stray worktree is news.

The trigger is written into the module's own header
(`app/src-tauri/src/dispatch/lanes.rs`, the "WHAT THIS DELIBERATELY DOES
NOT DO" list), so whoever changes the grammar meets this question in the
file rather than in a card.

Fence: `[app-dispatch]` — the grammar and its tests are both inside it.

### PARKED — eleventh triage, 2026-08-26 (T-110-s2)

Real and still true; not now. **UN-PARK WHEN:** the first worktree appears on a `tNNN-` branch, or the day the lane list is rendered to a human (`T-111`/`T-112`). A ruling request with no forcing event: `lanes.rs` accepts only `task/T-<digits>-<slug>`, 37 of 69 branches carry the older spelling, and no worktree has ever held one.

## Implementation notes

## Verdicts
