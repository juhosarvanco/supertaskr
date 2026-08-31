---
id: T-112-s4
title: C-18 declares no test path, so Board.tsx's prop threading has no suite — deleting it leaves the whole app run green, measured
feature: F-02
milestone: 4
priority: 2
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [app-board, docs/architecture/components]
builder:
verifier:
built_by: claude-opus-5 @subagent-executor
verified_by: claude-opus-5 @subagent-verifier
review: independent
---

**MEASURED, NOT ANTICIPATED, IN T-112's POISON DRILL** (detached
worktree at `8ee848e`, its own `CARGO_TARGET_DIR` at
`<scratch>/target`). Deleting the two lines that thread `dispatch` and
`brief` from `app/src/components/board/Board.tsx` into the drawer —
a one-sided mutation of production source, read back as `0 2` on
`git diff --numstat` before the suite ran — left `npm test` from `app/`
at **49 test files / 1060 tests, exit 0**. The mutant SURVIVES the whole
app run. Restoration proved by sha256 against the base commit; the
drill worktree came back clean.

**THE CAUSE IS A REGISTRY GAP, NOT A MISSING TEST.**
`docs/architecture/components/C-18-board-root.md` declares exactly one
path — `app/src/components/board/Board.tsx` — and no `app/test/**`
entry at all. Every other board component was given its own test path
when T-149 routed them out of C-05's umbrella: C-08 took
`review-badge.test.tsx` and `select-board.test.ts`, C-09 took four,
C-17's are driven through C-09's. C-18 took none, so **there is no test
file a C-18-fenced lane may write into**, and a lane holding
`[app-board]` cannot add one without editing the registry.

Nor may an existing in-fence test file import `Board`: `Board.tsx` is
C-18's and every board test file belongs to C-08 or C-09, so the import
would be an undeclared component edge — **the exact defect `arch drift`
caught at T-169**, whose account is in
`app/test/detail-assignment.test.tsx`'s own header.

**THIS IS T-110's LESSON IN A SMALLER SHAPE**, and it is why it is
routed rather than shrugged at: T-110 measured four one-side-only
producer mutants surviving the app suite at exit 0 because the rule sat
in a module no test imports. T-112 kept every JUDGEMENT out of the
component for exactly that reason — `selectBriefPanel` in
`task-detail.ts` holds it, `select-task-detail.test.ts` drives it, and
seventeen of seventeen mutants died. What survives is the two lines of
PLUMBING that cannot be moved anywhere a suite can see.

## Acceptance criteria

- `C-18-board-root.md` SHALL declare a test path of its own, or the
  registry SHALL state in that file why the composition root is
  deliberately untested from inside a `[app-board]` fence.
- A pin SHALL drive `Board` with a lane reading and require the drawer's
  dispatch block to appear, so deleting the threading reds by name.
- THE mutant above SHALL be re-run after the fix and SHALL die, with the
  failing-body count reported: a count of ONE is the non-duplication,
  mechanically (POISON DRILL, shape SIX).

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-02 p25, as filed

The registry gap is unchanged at `b60b06d`:
`docs/architecture/components/C-18-board-root.md` declares
`Board.tsx` and no `app/test/**` path, so a `[app-board]` lane still has
no test file it may write into. The card's measured mutant (the two
threading lines deleted, app suite green at exit 0) stands as filed.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## PROMOTED TO PRIORITY 2 AT THE ARCHITECTURE SITTING, 2026-08-31 — this card is now a BLOCKER for two others

**Nothing about this card's own argument changed; its position did.**

The sitting ruled `T-126-s2`'s seam (read the ruling there). The join
goes to TypeScript, and shapes 1 and 2 were refused on architectural
properties while shape 3 was refused **only** on test reachability. That
makes the registry gap this card describes the load-bearing obstacle for
the whole seam rather than a local annoyance:

- **`T-126-s2` now declares `blocked_by: [T-112-s4]`.** Until C-18 has a
  test path, anything the join puts in TypeScript is unpinnable by
  construction, and `T-110` already measured what that costs — four
  one-side-only producer mutants surviving at exit 0.
- **`T-112-s5` needs the same file opened**, to declare the C-09 → C-15
  edge its shape 3 requires. Two cards want one registry edit; doing them
  apart means opening it twice.

**And the seam is emptier than this card measured.** The sitting confirmed
that nothing in `app/src` or `app/test` imports `dispatch-store.ts` at
all, and filed `T-185` for two fields the board's reading type silently
drops. This card's *"deleting it leaves the whole app run green"* is one
instance of a condition that holds across the entire dispatch view model.

## Implementation notes (executor, 2026-08-31)

**THE TITLE'S SECOND CLAUSE IS NO LONGER TRUE, AND THAT IS THE FIRST
THING A VERIFIER SHOULD CHECK.** *"a mutant survives the whole app run"*
was true when this card was filed and is false at the base this lane was
cut from. `T-112-s1` pinned the threading in `app/test/board-truth.test.tsx`
in the interval. Re-run here as a poison drill in a detached scratch
worktree at the lane's base — each threading line deleted separately and
both together, one side only, `0 <n>` on `git -C <dir> diff --numstat`
before each suite run, restored with `git restore --source=<base>
--staged --worktree` and proved by sha256 against `git show <base>:` —
**every one of those mutants dies.** The per-mutant failing-body counts
are in the lane's report; they are deliberately not transcribed here, so
that a blind verifier derives its own. The drill worktree came back clean
and was removed.

**SO CRITERION 2 WAS ALREADY MET BEFORE THIS LANE OPENED**, by another
card, in a file this card's fence cannot reach. Criterion 3 is met by
measurement rather than by a fix: the mutant it names dies, and the
non-duplication question it asks (POISON DRILL shape SIX) is answered
per-line rather than for the two-line deletion, because deleting two
lines is two mutations and shape six's count is defined per mutant.

### Criterion 1 is where the work went, and it split in two

The criterion is a disjunction. **Its second arm is discharged in the
tree**: `C-18-board-root.md` now carries a section deriving why this
component declares no `app/test/**` path — what covers the composition
root today, why that pin may not be re-homed here, and what a test path of
its own would actually cost. The load-bearing derivations there are:

- the owner of `board-truth.test.tsx` is C-05, read out of the registry
  rather than remembered;
- that file imports `App` beside `Board`, and `C-05 -> C-18` is already
  declared, so C-18 owning it is a declared cycle — the shape this
  component was split out of C-08 to remove;
- therefore `T-169-s1`'s parked one-file move is refused on an
  architectural property, and this lane is the customer that card said
  would decide it.

**Its first arm could not be built inside this card's fence, and that is
a property of the card rather than a judgement call.** A `[app-board]`
fence expands to C-18's `paths:` as they stood at dispatch. The lane may
add a test path to the registry and still may not write the file the line
names, because the manifest was expanded before the line existed and a
lane may not re-expand its own fence. Verified against the hook's own
`decide()` rather than assumed. TASK-FORMAT names this exact shape — *"a
criterion that cannot be built inside the fence is not built, it is
recorded and routed"*, and *"a card whose criterion and whose fence
disagree is a DEFECTIVE CARD, not a hard call for the lane."* So it is
routed, as **`T-112-s6`**, carrying the `touches:` line that makes it
dispatchable first time.

### The shipped-code half

Two comments in this fence asserted that `T-126-s2` is **PARKED with a
ruling owed** — `Board.tsx`'s header and `TaskDetailPanel.tsx`'s
`dispatch` prop doc. The ruling landed at this lane's own base commit, so
both were contradicted by the tree a reader would check them against, and
both sit exactly where someone deciding the dispatch seam would look.
Corrected to the ruled state. **Neither is a behaviour change and neither
is poisonable** — no assertion moved, and this lane added no test body at
all. That is stated rather than left for the verifier to discover as a
gap: the drills above are of EXISTING bodies, run to settle the card's
premise, not of anything this diff introduced.

### Routed rather than done, and deliberately not absorbed

- **`T-190`** — the finding that matters most here. `T-126-s2`'s ruling
  names this card as the blocker for putting the join in TypeScript. At
  this base the dispatch VIEW MODEL is already reachable from inside
  `[app-board]` — three separate in-fence test files drive the frontier,
  the presentation and the drawer's rendered block. What no test file may
  reach is `dispatch-store.ts`: **C-15 declares no test path either**, and
  that is the seam's genuinely unreachable half. **ACCEPTED by the
  architect seat while this lane was still open**: the ruling's direction
  stands and its blocker moves to C-15. That seat is amending `T-126-s2`
  itself — this lane did not touch it, because a lane does not edit the
  card that rules over it.
  **This card was first filed as `T-187` and renumbered**: that id had
  been taken the same night by a different seat's card, already on main.
  Nothing in the method derives the next free id, and the account of that
  gap is on `T-190` rather than here.
- **The `C-09 -> C-15` edge** that `T-112-s5` wants was priced and NOT
  declared, per the dispatch's instruction to make the case rather than
  act silently. It creates no cycle and would cost no drift — a
  declared-but-unobserved edge is an ordinary `planned` state in this
  registry — but declaring it presupposes `T-112-s5`'s shape 3, which is
  unruled, and an executor may not settle an unruled architecture
  question from inside a lane. The case is written up on `T-190` so the
  card that writes the import can declare the edge in the same commit,
  which is when it becomes observed.
- **`T-185`** was NOT absorbed; its other half is `dispatch-store.ts`,
  outside this fence. Its two named files, `board-model.ts` and
  `select-board.test.ts`, were both in this fence and neither was
  touched. A note was appended there recording that its fourth criterion
  currently has no file it may be written in, for the same C-15 reason.

### For the verifier

The contract to attack is the registry section in `C-18-board-root.md`.
Its claims are each independently checkable at your own ref: who owns
`board-truth.test.tsx`; what that file imports; what `C-05-app.md`
declares in `depends_on`; what `arch cycles` answers; whether the three
named in-fence test files really drive what they are said to drive;
whether anything imports `dispatch-store.ts` by `import`/`require`/
`import()` rather than by name. **The premise correction is the highest-
value thing to re-measure independently** — if the mutant this card was
filed on still survived, the section would be wrong about the one fact
everything else rests on.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

### 2026-08-31 — `claude-opus-5@subagent` — **APPROVED WITH ASSIGNED CORRECTIONS**

**PHASE 1 WAS WRITTEN AND SAVED BEFORE THE DIFF WAS OPENED**, to
`T-112-s4-attack-set-phase1.md` in this session's scratchpad: the card at
base `df0b550`, the registry, `.nputer/lane-fence.json`, CONVENTIONS'
poison-drill catalogue, `TASK-FORMAT`'s defective-card clause and
`roles/verifier.md` — then 5 per-criterion attack families, 7 planned
mutants, and a written prediction about the premise. Only then were the
diff, the notes, the commits and the two routed cards opened.

**DISCLOSURES.** (1) My brief leaked a *shape* above its blind line: it
directed me to "pay particular attention to any claim about a FENCE
boundary" and to check whether TASK-FORMAT's record-and-route
prescription "is what actually happened". No mutant number, path count or
suite figure was named — so not the figure-leak `roles/verifier.md`
forbids outright — but it telegraphs that this lane made a fence claim
and routed. I re-derived the fence from the manifest and the registry
independently; I cannot claim I would have ranked it identically
unprompted. (2) My own first orientation command listed `docs/tasks/` and
so showed me the filename of `T-112-s6` before phase 1 was written; I
confirmed it absent at base, and read no part of its contents until
phase 2. Both were recorded in the phase-1 file at the time.

#### The premise: I reached the lane's conclusion independently, blind

Measured in my own detached bench (`/private/tmp/vf-T-112-s4`, stem
derived from the card id, own `CARGO_TARGET_DIR`), at **base `df0b550`**,
one side only, each mutation read back on `git -C <dir> diff --numstat`
before the suite and each restore proved by sha256 against
`235645c0…4124`:

| mutant | numstat | exit | failing bodies |
|---|---|---|---|
| baseline | — | 0 | 0 — 49 files / 1077 tests |
| `dispatch={dispatch}` deleted | `0 1` | 1 | **2** |
| `brief={brief}` deleted | `0 1` | 1 | **1** |
| both deleted (**THE card's mutant**) | `0 2` | 1 | **2** |

**The card's second clause is false at its own base and the mutant dies.**
`T-112-s1` closed it in the interval. The lane reported exactly this, in
its first commit subject, and did not manufacture the defect — which is
the behaviour this pass existed to check. Its choice to withhold the
counts so a blind verifier would derive its own is sound and it worked;
correction **C4** now lands them, because a figure without its ref goes
stale at the next write.

**Criterion 2** was therefore already satisfied at base. **Criterion 3**
is satisfied by measurement, and the lane's reading of shape SIX — that
the count is per *mutant*, so a two-line deletion is answered per line —
is correct. Stated plainly, as it is not on the card: the `brief` line's
count is ONE; the `dispatch` line's is TWO, because bodies 1 and 3 both
discriminate it.

**Shape SIX asked of every body criterion 3 rests on.** Body 1
(`…neither prop alone will do`) is killed uniquely by the `brief`-line
mutant — count 1. Body 3 (`…the UNAVAILABLE arm rather than a brief`) is
killed uniquely by a one-sided poison of the producer sentence in
`task-detail.ts` — count 1, measured. Neither is a duplicate. Body 2 is
the declared positive control; I did not construct its unique mutant and
say so rather than implying I did.

#### The fence claim: re-derived from the manifest, and it holds

Not accepted from the card. `.nputer/lane-fence.json` is a **dispatch-time
snapshot** pinned to `ref df0b550`; its `paths` carry no new `app/test/**`
file, and `.claude/hooks/lane-fence.mjs` only ever reads that result —
a lane fails closed on every uncertainty. So the registry line and the
file it names provably cannot land in one lane, criterion 1's first arm
collides with `touches:`, and `TASK-FORMAT` rules the card defective and
prescribes record-and-route. **That is what happened**, and criterion 1's
second arm — which *is* in fence — was discharged in the tree rather than
routed away. Routing was not used to avoid work.

**I attacked the routing itself and failed to break it.** `T-112-s6`'s
deliverable is a `touches:` line naming a file that does not exist, so I
expected the expander to reject it. Run through the built
`expandFence`: `app-board => slug | app/test/board-root.test.tsx => path`,
`unusable: []`, and the new path is reserved — a token carrying `/` or `.`
is self-identifying and needs no existence oracle. The card is
dispatchable as filed. `T-190` is likewise genuine: `dispatch-store.ts` is
C-15's source under `app-dispatch`, a slug this lane does not hold.

#### Gates, at the tip I was sent and in my own bench

Parser suite 16 files / 344 tests exit 0 · `tsc --noEmit` exit 0 · app
`npm run build` exit 0 · app `npm test` **49 files / 1077 tests exit 0**
(three separate runs, all green) · `cargo test` all suites ok, 0 failed ·
`arch cycles` exit 0 · `arch drift` exit 0 (REPORT; findings 4, unchanged
from base). The parser's smoke test parses the live `docs/` tree with
zero issues, which is what proves both new cards' frontmatter well-formed.

**`index --check` exits 1 at the tip and 0 at base** — `Board.tsx` loc
96→100, `TaskDetailPanel.tsx` loc 708→710. The diff touches `*.tsx`
outside `docs/`, so CONVENTIONS' GRAPH REGEN rule fires and the
regeneration is committed **with the CHECKPOINT** — the integrator's, not
a lane failure. It is called out because the notes describe these two
comment edits as inert, and they are not inert to the index.

**On the intermittent the lane declined to call green: nothing about it
reaches the tree** — not the card, not either commit message. I could not
reproduce any red either, across every suite above. I attribute nothing
to this diff, and correction **C5** asks for the sighting or its
withdrawal, per STATE's re-run-once-then-attribute rule.

#### The findings, and why they are corrections rather than a rejection

No write leaves the manifest (`Board.tsx`, `TaskDetailPanel.tsx`,
`C-18-board-root.md` and `docs/tasks`, all reserved); no gate reds that
this lane owns; the premise correction is right; the routing is real and
dispatchable. What is wrong is evidence, in a permanent registry file.

**C1 — THE CYCLE MEASUREMENT DOES NOT MEASURE THE CYCLE, AND IT IS
CAPTIONED "run rather than forecast".** `C-18-board-root.md` prints
`arch cycles … verdict ACYCLIC exit 0` as the cost of re-homing the pin.
I performed the re-route the sentence describes — put
`app/test/board-truth.test.tsx` into C-18's `paths:` — and that same
command answers **ACYCLIC, exit 0, again**: `arch cycles` reads DECLARED
`depends_on`, and a path move declares no edge. What the path-only move
actually buys is an `arch drift` **D4**:
`app/test/board-truth.test.tsx  claimed_by=C-05,C-18  winner=C-05`. The
cycle appears only after a second, unstated step — declaring `C-05` in
C-18's `depends_on`, which honouring the observed `App` import requires —
and then it is emphatic: **exit 1, `DECLARED CYCLE`,
`C-05 -> C-18 -> C-05` and `C-05 -> C-13 -> C-18 -> C-05`, 2 cycles.**
The conclusion stands; the printed evidence does not reach it. Either
print the measurement that does, or re-caption the ACYCLIC block as the
baseline it is. Record the D4 as the first wall, and that clearing it
needs `C-05-app.md`, which an `[app-board]` fence cannot reach — that is
a sharper refusal than the cycle. **The same unbacked claim is repeated in
`T-112-s6`** ("the measurement is in `C-18-board-root.md`"); fix it there
too, or it propagates into the card that acts on it.

**C2 — THE PRINTED DERIVATION IS FALSIFIED BY THE ACT OF WRITING IT
DOWN.** The section instructs the reader to run
`command grep -n 'board-truth' docs/architecture/components/*.md` and says
it answers `C-05-app.md`. At the tip it answers **two files, four lines**,
because three of them are now the section's own prose. Verified by running
it verbatim. `command grep -n '^  - app/test/board-truth' docs/architecture/components/*.md`
answers exactly the one `paths:` line and survives being written down.

**C3 — TWO QUOTES TRUNCATED WITHOUT ELLIPSIS, AND ONE REFERENT SWAPPED.**
`T-169-s1`'s RESURFACES sentence is cut at "file." — dropping the half
that names *two* remedies — and `C-05-app.md`'s T-149 note is cut before
its parenthetical. More substantively: `T-169-s1`'s "one-file move" is
moving the *review-badge bodies into* `board-truth.test.tsx`, and its
re-route question named **C-08's or C-09's** `paths:`. This section
refutes a third thing — re-homing `board-truth.test.tsx` to C-18 — then
says "This is that customer, and this section is the decision." It decides
one branch, not the one that card put first. Narrow the claim, or
`T-169-s1` gets un-parked on an answer to a different question.

**C4** Land the drill counts on this card with the ref they were measured
at (`df0b550`), now that blindness has served its purpose — the table
above may be cited. **C5** Record the intermittent — suite, body, the two
measurements — or state that it did not recur and withdraw it. **C6** Note
that this diff moves the index, so the checkpoint's graph regen is owed.

#### Not blocking, and deliberately not filed by me

**A body that cannot red.** The unavailable sentence's second half —
everything from the em dash on — is asserted nowhere in the repository:
deleting it from the producer in `task-detail.ts` (mutation read back
`1 1`, restore sha-proved) leaves the app suite **green at 49/1077,
exit 0**. Only its prefix is pinned, by `toContain` in `board-truth.test.tsx`
— which is C-05's, while the producer is C-17's, so an `[app-board]` card
may edit the sentence without its fence reaching the only file that pins
it. That is `T-112-s1`'s pin, not this lane's diff. It wants a card, and I
have not minted an id for it: this lane just paid for a `T-187` collision
because ids are machine-scoped and every lane reads them from a stale
checkout, and a verdict written from an older base than that lane's is
the worst possible seat to mint from.

*(My first attempt at that mutant silently no-opped — a literal em dash in
a `perl -0777 -CSD` pattern is matched as bytes against decoded text, the
hazard CONVENTIONS records. The numstat was empty and the suite was green;
reported only after re-running with `\x{2014}` and reading the diff back.)*

**Status left at `verifying`, deliberately.** Six corrections are ASSIGNED
and none is performed here; `merging` would assert they had landed and
`done` would assert a merge. `verified_by` and `review` are stamped;
`verifier` stays empty because this seat was not pre-assigned.
Gates re-run at the tip THIS verdict creates, not only at the one I was
sent — figures above are ref-bound to `df0b550` (base) and `a00e2b5`
(lane tip) as labelled.
