---
id: T-199
title: The lane fence judged NOTHING all night — every lane worktree is outside the dispatching checkout, so `lane-fence.mjs`'s own limit 2 allows every write unjudged, and seven lanes' compliance was discipline
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: "T-190's executor, which DRILLED THE FENCE ITSELF and found the write succeeded; re-derived from the hook's source at the architect/integrator seat before filing"
builder: claude-opus-5@subagent
review: independent
---

**A LANE DRILLED THE INSTRUMENT THAT WAS SUPPOSED TO BE CONSTRAINING IT,
AND THE INSTRUMENT WAS NOT THERE.** `T-190`'s executor wrote to a path
**outside** its `.nputer/lane-fence.json` as a deliberate drill. **The
write succeeded.** It removed the file immediately and reported it.

## Re-derived at this seat from the hook's own source

`.claude/hooks/lane-fence.mjs:786`:

    return allow("outside-the-checkout",
      `${abs} is outside ${root} (limit 2 in this file's header)`);

and the header at line ~754 states the design plainly: *"A detached
checkout is not judged at all (limit 3), **a path outside this checkout is
not judged (limit 2)**, a lane whose manifest cannot be read reserves
nothing (limit 4)."*

**The limit is DECLARED, deliberate, and correct in isolation.** What is
new is the configuration it meets.

## Why it swallows every lane in this session's shape

The dispatching seat runs from a nested checkout
(`.claude/worktrees/<name>`), and lane worktrees are **siblings** of the
repository (`../nputer-T-NNN`) — which `method/lane-protocol.md` rule 3
REQUIRES. Subagents inherit the dispatching session's project root.

So every lane write is, from the hook's point of view, **outside the
checkout** — and `laneLessVerdict` allows it **unjudged**. Not denied,
not permitted-with-a-carve: **never evaluated.**

**The two rules are individually right and jointly fatal**: rule 3 puts
lanes outside the repository, and limit 2 declines to judge outside the
repository. Nothing in either names the other.

## THE EXPOSURE, STATED PLAINLY

**Seven lanes ran on 2026-08-31 believing a hook enforced their fences.
None was enforced.** Every dispatch brief from the architect/integrator
seat said *"a PreToolUse hook enforces it"*, and that sentence was false
for the entire night.

**What actually happened is the good news and also the point**: every
lane stayed inside its fence, and several **routed rather than widened**
when the fix lay outside — `T-112-s4`, `T-186`, `T-192` and `T-190` all
did so explicitly. **Compliance was total and it was DISCIPLINE.**

`T-167-s8`'s absorbed evidence is that over one night, every
mechanically-triggered gate held and **every memory-held obligation
decayed**. The fence has been in the second category without anyone
knowing, and it survived only because it was also written into every
brief in prose.

## This is the guard-class defect in its purest form

`method/tasks/TASK-FORMAT.md`: *"a guard's characteristic defect shows up
as **nothing happening, which is also what success looks like**."*

**A fence that judges nothing and a fence that approves everything are
byte-identical from outside.** Seven lanes' worth of clean writes is
exactly what a working fence produces — and exactly what an absent one
produces when the writers are careful. Only a lane that **deliberately
attacked its own fence** could tell them apart, and one did.

## What a fix decides

1. **Where `root` should come from.** The hook resolves the dispatching
   checkout; what it needs is the LANE's worktree, which the manifest
   already names in `worktree`. **The manifest may already carry the
   answer** — check before inventing a resolution.
2. **Whether limit 2 should narrow or the root should move.** Limit 2
   exists so the hook does not police unrelated files on the machine, and
   that reason is still good. **Narrowing it to "outside every known lane
   worktree" preserves the intent** — but argue it, and say what it costs.
3. **What the hook does when it cannot decide.** Limits 3 and 4 also
   ALLOW. A guard that fails open is a defensible choice and an
   indefensible silence: whatever is decided, **an unjudged write should
   be visible**, or this card recurs in a new shape.
4. **Whether the dispatch brief may claim enforcement at all.** Until a
   body proves the hook denies a real out-of-fence write from a real
   lane, the sentence *"a PreToolUse hook enforces it"* is a claim
   nothing backs.

## Acceptance criteria

- A body SHALL prove the hook **DENIES** a write outside the manifest
  from a lane worktree in the shape this project actually dispatches —
  sibling worktree, nested dispatching checkout — and a **positive
  control** SHALL prove the same body passes an in-fence write.
- **THE CONTROL IS THE POINT**: a body that only asserts in-fence writes
  succeed passes identically against a hook that judges nothing, and is
  the vacuity this card exists to remove.
- WHERE the hook declines to judge, the decline SHALL be OBSERVABLE
  rather than silent.
- THE brief's enforcement sentence SHALL be true when it is printed, or
  SHALL not be printed.
- `method/lane-protocol.md` rule 3 SHALL NOT be weakened to fit the hook;
  the hook moves.
- Verification: headless.

## Read beside

`T-167-s8` (mechanical triggers hold, memory-held obligations decay —
measured), `T-189` (self-integration and the concurrent ceiling, another
pair of individually-right rules that do not name each other), and
`method/lane-protocol.md` rule 3, which is correct and stays.

## THE FIX HAS A DIRECTION NOW — judge by the TARGET, not the writer's cwd

Folded in from the outgoing architect seat's fix plan (relayed
2026-08-31, approved in direction by @human), and **verified at this ref
before folding**:

`lane-fence.mjs:870` —

    export function decide(request) {
      const cwd = typeof request.cwd === "string" && request.cwd !== ""
        ? request.cwd : process.cwd();

**The root comes from where the WRITER SITS.** That is the whole defect in
one line: limit 2 then asks "is the target outside *that*", and for a
sibling lane worktree the answer is always yes.

**The redesign**: `decide()` resolves the **TARGET path's** repository
root and applies **that** repository's lane fences, regardless of where
the writer sits. A write into `/Users/ujju/Projects/nputer-T-NNN` is then
judged by nputer's fences because the TARGET belongs to nputer — which is
what limit 2's own intent (*"do not police unrelated files on the
machine"*) actually wanted.

**The seed already exists**: the manifest carries `"worktree"` naming the
lane's own root, so the mapping from target → lane → fence needs no new
derivation.

**And this seat's session shape is why the limit became the common case
rather than an edge**: a nested dispatching checkout plus sibling lane
worktrees, which `method/lane-protocol.md` rule 3 requires. The hook's
declared limit was written for an exception and met the default.

## FOLDED IN: the shared manifest reader

Also from that plan, and this seat supplied the instance: **the hook
should EXPORT the manifest reader** rather than leaving every consumer to
open `.nputer/lane-fence.json` itself. This seat read it with `.allow`
when the key is `paths` and got **empty fences back for three lanes** —
a reader that answers "no paths" is indistinguishable from a fence that
carries none, which is this card's own subject arriving in its own
client.

## `review: independent` SET AT FILING, not left for a dispatch to remember

**The fence hook itself — a guard whose whole subject is refusing a write.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.

---

## Implementation notes (executor, 2026-08-31)

### What was built

`decide()` in `.claude/hooks/lane-fence.mjs` resolves the **TARGET
path's** repository root and applies THAT repository's fences, wherever
the writer sits. The card's fix direction was RIGHT and is implemented as
stated; nothing about it needed arguing away.

    const abs  = path.resolve(cwd, target);          // cwd's only job left
    const root = findCheckoutRoot(path.dirname(abs));

`request.cwd` keeps exactly two jobs: resolving a RELATIVE target, and
answering a request that carries no readable path at all (limit 8, new).

**The manifest's `worktree` field was NOT needed.** The card offered it as
the seed for a target→lane→fence mapping. `findCheckoutRoot` climbing
from the target already lands on the lane's own root and `readHeadRef`
already tells you it is a lane, so a second mapping would have been a
second copy of a fact git keeps — the T-057 shape. Stated because the
card asked the question directly.

### The four decisions the card asked for

1. **Where `root` comes from** — the target's checkout, not the manifest,
   for the reason above.
2. **Limit 2 narrows; the root moves; BOTH.** Limit 2 now reads *a path
   in NO git checkout at all is not judged* — the scratchpad, `/tmp`, and
   any tree outside a repository. Its stated intent (*"do not police
   unrelated files on the machine"*) is preserved exactly: an unrelated
   repository elsewhere is still rooted and asked, and its own empty lane
   list allows the write. The COST is declared in the header and in
   limit 2 itself: a sibling lane's tree is no longer outside anything,
   so a write into it is judged by THAT lane's fence whoever is writing.
   The hook still has no term separating an architect reaching into a
   lane from that lane's own executor writing in from a shell parked
   elsewhere — but the design this replaces allowed BOTH without
   looking, so every write this tightens was previously UNJUDGED and
   none was previously refused.
   The `rel.startsWith("../")` branch is now unreachable by construction
   and was DELETED rather than left inert: an allow no mutation can kill
   is an allow no test can prove.
3. **What it does when it cannot decide — it says so.** `Decision` gains
   `judged: boolean`; `DECLINE_CODES` is exported and holds the four
   codes that reach an allow through a header limit —
   `not-a-repository`, `not-judged-detached`, `not-judged-lane-list`,
   `no-path-to-judge`. The runner prints a decline on **stderr** at exit
   0, prefixed `LANE FENCE (not judged)`. stderr and not stdout because
   stdout is the channel a harness parses for a permission decision, so
   an allow that spoke there could GRANT. THE LIMIT, DECLARED: exit-0
   stderr is not in the main transcript, so this makes a decline
   AUDITABLE rather than LOUD. What it removes is the byte-identity.
   Two codes were renamed to make the partition real: the detached
   allow and the unreadable-lane-list allow both used to answer
   `not-a-lane`, which is also the code for the JUDGED answer *no live
   lane reserves this path*. One code, two meanings, and one of them a
   decline — the card's own subject in miniature.
4. **Whether the brief may claim enforcement** — NOT YET, and the reason
   is a fact the card does not carry. `.claude/settings.json` runs the
   hook as `node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"`,
   and `CLAUDE_PROJECT_DIR` is the DISPATCHING session's project root. So
   **the hook binary that runs for a lane session is the DISPATCHING
   checkout's copy, not the lane's.** This fix arms nothing until it is
   merged, and then arms every session started afterwards. Until the
   merge lands, *"a PreToolUse hook enforces it"* stays false. Routed as
   `T-215`, which also carries the CONVENTIONS correction.

### The defect, measured — before and after, same configuration

Live seat `/Users/ujju/Projects/nputer/.claude/worktrees/adoring-nash-028cf4`
(HEAD `refs/heads/claude/adoring-nash-028cf4`), lane
`/Users/ujju/Projects/nputer-T-199` (HEAD `refs/heads/task/T-199-lane`),
read 2026-08-31.

BEFORE, at base `e6a97d2` — four writes into the lane from that seat:

    ALLOW outside-the-checkout   docs/ROADMAP.md
    ALLOW outside-the-checkout   app/src/main.tsx
    ALLOW outside-the-checkout   docs/NORTH_STAR.md
    ALLOW outside-the-checkout   .claude/hooks/lane-fence.mjs

AFTER, same seat, same targets:

    BLOCK judged=true  outside-the-fence   docs/ROADMAP.md
    BLOCK judged=true  outside-the-fence   app/src/main.tsx
    BLOCK judged=true  outside-the-fence   docs/NORTH_STAR.md
    ALLOW judged=true  inside-the-fence    .claude/hooks/lane-fence.mjs
    ALLOW judged=true  inside-the-fence    tools/e2e/tests/lane-fence.spec.ts
    ALLOW judged=true  always-writable     docs/tasks/T-199-x.md
    ALLOW judged=false not-a-repository    /tmp/T-199-anything.txt

### The bodies, and the two mutants that prove they discriminate

Five bodies added to `tools/e2e/tests/lane-fence.spec.ts`, plus a new
fixture seat (`addDispatchSeat`) that is a checkout NESTED inside the
fixture repository, so the fixture reproduces the real geometry: nested
writer, sibling lane, `path.relative(seat, lane)` climbing out.

The refusal body is `T-167-s8`'s three-arm shape rather than an assertion
about a return value. `harnessWrite` IS the harness for the width of one
write — it runs the real runner as a real subprocess with the real
request on stdin and performs the write ONLY on exit 0. Arms: a real
attempt, a real refusal at the exit code the harness obeys, and the
protected file asserted UNCHANGED by sha256 and by `git status
--porcelain -- app/src`.

**THE TWO MUTANTS ARE THE POINT.** Each was armed one side only, run, and
restored; `.claude/hooks/lane-fence.mjs` sha256 before and after both is
`af80bded166641a6180e1273f2f8931321062bf8397b46c34dc2b600ea8b0566`, and
`grep -c MUTANT` on the restored file is 0.

| mutant | what it does | lane-fence.spec.ts |
|---|---|---|
| 1 — `findCheckoutRoot(cwd)` | the defect, restored | 5 failed / 37 passed |
| 2 — `inside-the-fence` returns `block` | refuses everything | 5 failed / 37 passed |

**And the two failure SETS are different, which is the whole argument.**
Mutant 1 (the inert guard) is caught by the drill and NOT by the positive
control — the positive control passes against it, exactly as the card
warns. Mutant 2 (the refusing guard) is caught by the positive control
and NOT by the drill, which passes against it. Neither body alone is
worth anything; the pair is discriminating in both directions.

### Every command, with its exit code, in the order run, read unpiped

Setup (fresh worktree — nothing installed, nothing built):

    lib/parser  npm ci                        0
    lib/parser  npm run build                 0
    app         npm install                   0
    app         npm run build                 0
    tools/e2e   npm ci                        0

Gates (all from the lane, none in the integration checkout):

    tools/e2e   npm run typecheck             0
    tools/e2e   npx playwright test tests/lane-fence.spec.ts tests/push-guard.spec.ts
                                              0   67 passed
    app         npm run build                 0   (the fast gate)
    tools/e2e   npm run typecheck             0
    tools/e2e   npm run lint:tokens           0
    tools/e2e   npm run lint:tokens -- --selftest   0
    tools/e2e   npm run lint:docs             0
    tools/e2e   npm run capabilities:check    1   STALE — see below
    tools/e2e   NPUTER_E2E_PORT=14199 npm test    0   409 passed (5.0m)

Drills:

    mutant 1 armed, suite run, restored       1 → 5 failed / 37 passed
    mutant 2 armed, suite run, restored       1 → 5 failed / 37 passed

Scratch port 14199, derived from the card id; `lsof -nP -iTCP:14199
-sTCP:LISTEN` returned zero rows immediately before each bind. 1420 was
never probed.

### The one red, and why it is not repairable inside this fence

`npm run capabilities:check` exits **1**: *committed 33163 bytes, a fresh
generation is 33576*. `docs/CAPABILITIES.md` is generated from e2e test
names and this diff moves five of them. The repair is
`npm run capabilities` from `tools/e2e/`, which writes `docs/CAPABILITIES.md`
— **outside `touches: [.claude, tools/e2e]`**, and the newly-armed hook
refuses it `outside-the-fence` when asked. **THE INTEGRATOR OWES THAT
REGENERATION AT THE MERGE.** The general case is routed as `T-214`,
because every test-adding lane now hits it and CONVENTIONS requires the
regeneration in a commit no lane can make.

### Routed, not built — three suggestions filed

- **`T-214`** — arming the fence makes the capabilities census
  unregenerable by the lane that staled it. The collision above, stated
  generally. Needs `tools/e2e` + `docs/CONVENTIONS.md`.
- **`T-215`** — `docs/CONVENTIONS.md`'s lane bullet still publishes the
  limit this card deletes (*"a path OUTSIDE the writing checkout is
  allowed in BOTH seats"*, and the sibling-lane hole as *deliberate*).
  Outside this fence, and held by the live **T-189** lane at dispatch.
  Carries the brief's enforcement sentence too.
- **`T-216`** — `.claude/hooks/push-guard.mjs:449` roots on
  `request.cwd` in the same way, so `cd <lane> && git push` runs
  `index --check` in the DISPATCHING checkout. IN fence by path, filed
  rather than changed because a push has no target path and the honest
  options each cost something — a different judgement from this card's,
  and one this lane was not dispatched to make.

### For the verifier

- **The import contract held.** `.claude/hooks/push-guard.mjs:68` takes
  `LANE_BRANCH_RE`, `findCheckoutRoot`, `readHeadRef`, `readManifest`,
  `within`. None of their semantics moved — only how `decide` composes
  them. `push-guard.spec.ts` is green (24 bodies inside the 67 above) and
  a new body pins the import list against the live exports by name, so a
  rename reds here instead of at somebody's push.
- **The folded-in shared manifest reader already existed.** `readManifest`
  is and was exported, shape-checks, and refuses rather than shrugging.
  A sweep for hand-rolled reads of `.nputer/lane-fence.json` in code
  found none — only two `existsSync` checks in
  `card-preflight.spec.ts`. The failure the card describes (reading
  `.allow` when the key is `paths`, and getting three empty fences) was a
  READER at a seat, not a code path, so there was nothing to change. Said
  plainly because the card asked for a change and the honest answer is
  that it is already there.
- **The positive control alone is vacuous and this lane can prove it**:
  mutant 1 passes it. Read the two mutants' failure SETS, not their
  counts.
- The three renamed/narrowed assertions in existing bodies —
  `outside-the-checkout` → `not-a-repository` (two sites), `not-a-lane` →
  `not-judged-detached` (two sites) — are behaviour changes, not
  cosmetics. Each is the old code answering a question the new design
  answers differently, and each body still carries its discriminating
  half.

### The correction clause — where the brief was wrong

1. **THE BASE WAS `e6a97d2`, NOT `2eb87f7`.** The brief named `2eb87f7`.
   Derived at this seat rather than argued:

       git merge-base main HEAD                       e6a97d205756…
       git merge-base --is-ancestor 2eb87f7 HEAD      exit 1  (NO)
       git merge-base --is-ancestor e6a97d2 HEAD      exit 0  (YES)
       main tip 2eb87f7 · this lane's tip 408c540

   `2eb87f7` is main's tip, so it is the right LEFT-HAND REF for the
   range rule's merge forecast and the wrong answer to *"what is this
   lane's base"*. The dispatching seat volunteered the correction and
   named the cause itself: it derived a ref from **where it was
   standing** instead of from the thing it was describing.
   **THAT IS THIS CARD'S DEFECT PERFORMED BY HAND.** `decide()` took the
   repository root from `request.cwd` — where the WRITER was standing —
   instead of from the target it was judging, and a seat writing the
   brief FOR that card made the identical substitution in the same
   sitting. It is the best available evidence that the defect is natural
   rather than careless, and it is recorded here because a guard-class
   card is worth more when the class is shown to reach humans too.

2. **The brief said the hook "has never fenced anything in this
   session's shape" — true, and incomplete in a way that matters.**
   `.claude/settings.json` runs the hook as
   `node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"`,
   and `CLAUDE_PROJECT_DIR` is the DISPATCHING session's project root —
   so the hook binary a lane session actually executes is the
   DISPATCHING checkout's copy. **This fix therefore arms nothing in its
   own lane**, which is why every proof here is a subprocess drill
   against this worktree's runner rather than an observation of the live
   session. It arms at the merge, for sessions started after it.

3. **The brief's line 786 / line 870 citations were right**, and so was
   its warning about the five-symbol import contract: nothing in
   `LANE_BRANCH_RE`, `findCheckoutRoot`, `readHeadRef`, `readManifest`
   or `within` moved, and `push-guard.spec.ts` is green.

4. **The card's folded-in "the hook should EXPORT the manifest reader"
   item was ALREADY SATISFIED** at the base ref — `readManifest` is
   exported, shape-checks and refuses rather than shrugging, and no code
   in the tree opens `.nputer/lane-fence.json` by hand. Nothing was
   built for it. Said plainly rather than quietly skipped.

5. **A standing warning relayed mid-lane, and it did not bite here.**
   `docs-gate.mjs` can exit 1 from an import-time crash, which is
   indistinguishable BY CODE from its `EXIT.FOUND`. This lane ran
   `npm ci` from `tools/e2e/` before any gate (exit 0) and every
   docs-gate run printed its full derivation — 26 readers, the census
   figures, and named owed suites — rather than a stack trace. The
   exits below were read from that OUTPUT, not from the code alone.
