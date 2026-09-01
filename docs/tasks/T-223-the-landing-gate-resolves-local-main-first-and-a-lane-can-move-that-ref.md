---
id: T-223
title: THE LANDING GATE RESOLVES LOCAL `main` FIRST, and `git update-ref` moves that ref from inside the lane — so the sentence the no-self-widening claim rests on is false
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: [T-212]
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts, tools/e2e/scripts/dispatch-brief.mjs]
suggested_by: "T-212's independent verifier, from a reproduction: the card's build step 2 and `landing-gate.mjs`'s module header both assert main is a ref the lane cannot move, and `git update-ref` accepts exactly that write where `git branch -f` refuses it"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**THE CLAIM IS LOAD-BEARING AND IT IS NOT TRUE.** `T-212`'s landing gate
reads a lane's fence from the card AS COMMITTED ON THE INTEGRATION
BRANCH, and both the card and `.claude/hooks/landing-gate.mjs`'s module
header justify that choice with the same sentence — main is "a ref the
lane cannot move". `integrationRefCandidates` then tries the LOCAL
`main` first, and local `main` is movable from inside a lane worktree.

## The reproduction, run at T-212's verification

In a throwaway repository with `main` checked out in worktree A and a
lane branch checked out in worktree B, from B:

    git branch -f main <sha>
    -> fatal: cannot force update the branch 'main' used by worktree at ...

    git update-ref refs/heads/main <sha>
    -> ACCEPTED; main moved

`git branch -f` carries the checked-out-elsewhere guard. `git
update-ref` does not. So a lane can point local `main` at any commit —
including one whose copy of its own card carries a wider `touches:` —
and the landing gate will expand THAT fence and admit paths the real
main would refuse. This is the widening-from-inside-the-lane that rule 5
forbids and that this gate's whole read-from-main design exists to
prevent, reached by a route the design did not consider.

## Why this is small and still worth a card

It is NOT a hole an ordinary lane falls into: it takes a deliberate
plumbing command, and a seat willing to run it could equally reach for
`git push --no-verify`. The guard's floor is unchanged. What is wrong is
that a guard states an ABSOLUTE it does not have, in the one paragraph a
reader consults to decide how far to trust it — rule 5's *"a guard
described as total is worse than no guard"*, and this project's own
habit of pinning a constant against the program that owns it.

## What to build

1. **Correct the sentence** in `landing-gate.mjs`'s header and in
   `T-212`'s card: main is the ref the lane's own COMMITS cannot move,
   which is the property actually relied on, and a local ref rewrite is
   a disclosed limit beside the other four.
2. **Consider preferring `refs/remotes/origin/<branch>`** where it
   resolves, falling back to the bare name. Weigh it rather than assume
   it: `T-153-s9` measured that `actions/checkout` on a `pull_request`
   event leaves no local branch, and the candidate ORDER in
   `dispatch-brief.mjs` is owned there and asserted identical by a body
   — so a reorder here is a change to a shared, pinned fact and not a
   one-line edit. A remote-tracking ref is also writable by
   `update-ref`, so this narrows the window rather than closing it.
3. **A body** that moves local `main` with `update-ref` inside the
   fixture and asserts what the gate then does, so the limit is measured
   rather than argued.

## Read beside

`T-212` (the gate), `method/lane-protocol.md` rule 5 (the law, and the
disclosure obligation), `T-153-s9` (why the candidate order is what it
is), `T-216` (the other open rooting question on the same hook).

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Fence narrowed at dispatch to three files by path**: the hook, its
spec, and `tools/e2e/scripts/dispatch-brief.mjs`, because the candidate
order is OWNED there and a body asserts the hook's copy identical to it
(landing-gate.spec.ts, "the integration-ref candidates are
dispatch-brief's, spelling for spelling"), so a reorder is a two-file
edit and both are in the fence. Three sibling lanes run tonight
(T-216-s4, T-230, T-236); none touches these files.

**Audit (orchestrator 5b)**: `integrationRefCandidates` at 2489853 returns
`[branch, origin/<branch>, refs/remotes/origin/<branch>]` — local first,
as the card claims. The `git update-ref` versus `git branch -f` claim is
a platform claim and is the verifier's phase-1 ground truth to measure,
not this seat's to assert.

**Ceremony**: size S, and the card is guard-class, so `review:
independent` binds: executor, then verifier; the executor does NOT
integrate its own work tonight — this lane does not hold the integration
checkout, stamps `verifying`, reports ready-to-merge with branch and tip,
and leaves its worktree standing (lane-protocol rules 4 and 6).

## Implementation notes

Built in `/Users/ujju/Projects/nputer-T-223` on
`task/T-223-landing-gate-local-main`, cut at `28924c7`. Every figure
below carries the ref or the reading time it was measured at.

### What the three build steps became

**1. The sentence.** The header of `.claude/hooks/landing-gate.mjs` now
states the property the gate actually rests on — **`<integration>` is
the ref the lane's own COMMITS cannot move** — and names the two bodies
that measure it (`a manifest edited INSIDE the lane does not widen this
gate`, `a lane editing its OWN card's touches: does not widen this gate
either`). `T-212`'s card gets the same sentence APPENDED beside its
struck clause rather than written over it, because a record is appended.

**PARTLY DISCHARGED BEFORE THIS LANE OPENED, AND THE CARD DOES NOT SAY
SO.** At `28924c7` both the header and `T-212`'s card already carried a
DISCLOSURE that the absolute was false — landed at `203e374`, T-212's
own verdict-corrections commit. What neither carried was the POSITIVE
property, which is the half this card asks for. Derived:
`git log -S'AND THAT REF IS NOT BEYOND' -- .claude/hooks/landing-gate.mjs`
returns exactly `203e374`.

**AND "beside the other four" IS A STALE FIGURE.** The header's
`WHAT THIS GATE CANNOT SEE` list held **FIVE** entries at `28924c7`
(`T-224`'s amendment-rides-in limit is the fifth, added by the same
`203e374`). The local-ref rewrite lands as **6**, not as a fifth.

**2. The candidate order — WEIGHED AND REFUSED, on a measurement.** The
card asks for a preference for `refs/remotes/origin/<branch>` to be
weighed rather than assumed. It is refused, on three counts, and the
first is measured rather than argued. In a throwaway repository at git
**2.50.1 (Apple Git-155)**, `main` checked out in worktree A and a lane
branch in worktree B, every command run from B:

    git branch -f main <sha>                       -> exit 128, fatal:
                                                      cannot force update
                                                      the branch 'main'
                                                      used by worktree at …
    git update-ref refs/heads/main <sha>           -> exit 0, main moved
    git update-ref refs/remotes/origin/main <sha>  -> exit 0
    git fetch . +<sha>:refs/remotes/origin/main    -> exit 0

- **ONE.** A remote-tracking ref carries no checked-out-elsewhere guard
  at all — no worktree can check one out — and the fourth line reaches
  it with no plumbing command whatsoever. The reorder would trade a
  partly-guarded ref for an unguarded one. *"Narrows the window"* was the
  right thing to suspect and the wrong thing to assume; the card said to
  weigh it, and the weighing says the opposite.
- **TWO.** It breaks the one widening route this gate's own `ROUTE` text
  prescribes: a fast-path-A amendment is COMMITTED on the integration
  branch and reaches `origin/<branch>` only after a push and a fetch, so
  a remote-first gate would refuse a lane widened exactly as instructed
  for as long as the two refs disagree.
- **THREE.** The order is not this file's to change, and a reorder is a
  THREE-file edit of which one file is outside this fence. Owned in
  `tools/e2e/scripts/dispatch-brief.mjs` (in fence); pinned by
  `landing-gate.spec.ts`'s *"the integration-ref candidates are
  dispatch-brief's, spelling for spelling"* (in fence); and asserted
  again by **`tools/e2e/tests/brief.spec.ts`**'s *"THE INTEGRATION REF IS
  RESOLVED, NOT ASSUMED — and the bare name still wins wherever it
  exists"*, which requires `integrationRefCandidates(branch)[0]` to be
  `branch` and is **OUTSIDE this lane's fence**. ROUTED rather than
  taken: if a future card ever concludes the order should move, the edit
  is those three files in one commit, and it needs a fence carrying
  `tools/e2e/tests/brief.spec.ts`.

The weighing is recorded in three places, each where its own reader
meets it: the hook's header (the account and the three counts),
`integrationRefCandidates`' own comment in the hook (a pointer, because
that is where a reader asks the question), and the OWNING copy in
`dispatch-brief.mjs` (which previously argued bare-name-first only for
the brief's question and did not know it had a guard as a second
consumer).

**3. The body.** `landing-gate.spec.ts` gains *"THE DISCLOSED LIMIT,
MEASURED: a lane moves local `main` with `update-ref` and this gate
follows it"* — one fixture, driven end to end through the wired hook:

- an ordinary refusal first, so the allow below cannot be a gate that
  never armed;
- a SECOND worktree holding `main`, which is what arms the porcelain's
  guard — a one-worktree fixture would measure neither half;
- `git branch -f` REFUSED (`used by worktree`) with `main` asserted
  unmoved, then `git update-ref` accepted and `main` asserted moved;
- the SAME lane commit pushed again — allowed, with the lane tip
  asserted IDENTICAL across the two attempts, so the ref is the only
  thing that changed;
- and the allow asserted NOT to be an announced cannot-compare, so the
  body measures an ENFORCED widened fence rather than a gate that failed
  to judge.

**A MEASUREMENT THAT CHANGED THE FIXTURE.** The widened token is
`docs/ARCHITECTURE.md` and not the bare `docs`, because `expandFence`
answers `docs` **UNUSABLE** — measured through the hook's own
`expandTouches` at this lane's tip:

    ["docs"]                  -> unusable ["docs"], paths []
    ["docs/ARCHITECTURE.md"]  -> paths ["docs/ARCHITECTURE.md"]

The first draft of the body used `[tools/e2e, docs]` and the push was
allowed by the CANNOT-COMPARE arm rather than by the widened fence —
green for the wrong reason, caught by the assertion that the allow is
not announced. That assertion is the reason the body is worth its bytes.

### The poison drill ledger — 15 mutants, 15 killed, 0 survivors

Drilled at a COMMIT (`d6ed833`) in a DETACHED scratch worktree,
`/private/tmp/nd-T-223`, cut at the lane stem and installed on its own;
never in the lane. Bench baseline before any mutant: **24 passed,
exit 0**. Every mutation was READ BACK with `git diff -U0` before its
suite ran, applied to ONE SIDE only, and restored with
`git restore --source=d6ed833 --staged --worktree --`, both sides named.
Restoration proved by sha256 after EVERY mutant, against
`git show d6ed833:<path>`:

    tools/e2e/tests/landing-gate.spec.ts
      a9ed692ffcf3fa1ad2e0a40ce6543c1cfc9f26138b6d5a8d23e3b26b08108b5f
    .claude/hooks/landing-gate.mjs
      3689fe8ab0fa024fd10ba0dd491e268b6cb782efdf3b5e27c1c964bd72aef1b3

**Code-under-test mutants (2).**

| mutant | what moved | result |
|---|---|---|
| A1 | the fence is read at `merge-base(rev, HEAD)` instead of at the resolved integration rev | KILLED |
| A2 | `integrationRefCandidates` reordered remote-first | KILLED — 3 failed / 21 passed |

A2's kill set is NAMED rather than counted: *the integration-ref
candidates are dispatch-brief's, spelling for spelling*, *a lane whose
card is not on the integration branch is refused, never widely allowed*
(the fixture's `origin/main` still carries the card main no longer has),
and this card's own body. That is the coupling count three above
predicts, measured.

**Assertion-side mutants (13), one per new assertion, each run alone:**
`B01` arm-one refused · `B02` the refusal names the path · `B03` the
fence reported is main's · `B04` the refused push left the remote
alone · `B05` the porcelain refuses · `B06` and refuses for the
checked-out-elsewhere reason · `B07` and left `main` unmoved · `B08`
`update-ref` moved it · `B09` the lane tip is unchanged between the
attempts · `B10` the gate followed the ref · `B11` the allow is not an
announcement · `B12` the followed push reached the remote. **All 13
KILLED**, exit 1 each, one failing body each.

**SHAPE SIX, ASKED AND ANSWERED** (`docs/CONVENTIONS.md`'s catalogue:
name a mutant this body kills, run the WHOLE suite under it, require the
failing-body count to be ONE). A1 is that mutant, chosen because it is
the narrowest thing that separates *"the fence is read at whatever ref
resolves NOW"* from every neighbouring body's claim. The whole e2e suite
under A1, in the bench: **3 failed / 533 passed of 536, exit 1** — and
TWO of the three are the environmental `session-economics` reds that
fail identically with NO mutant applied (**2 failed / 534 passed**,
same bench, same tip). **The attributable failing-body count is ONE**,
and it is this card's body. No other body in this repository kills A1.

### Standing gates, derived from the merge forecast

`docs/CONVENTIONS.md`'s RANGE RULE, executor row, run with `$?` read
unpiped and first:

    TREE=$(git merge-tree --write-tree <main tip> HEAD)   # exit 0
    git diff --name-only <main tip> "$TREE"

- **GRAPH REGEN — FIRES.** `tools/e2e/tests/landing-gate.spec.ts` is a
  `.ts` outside `docs/`. Asked the gate rather than predicted; the
  reading is in the report. The trigger is deliberately wider than the
  walk and `tools/` is `.nputerignore`d, so a no-op is the expected and
  the recorded answer.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**`,
  `app/src/**`, `app/package.json` or `app/src-tauri/Cargo.toml`.
  Derived anyway rather than assumed, because a not-owed gate nobody
  derived and a gate nobody ran read the same afterwards.
- **DOCS GATE — FIRES**, exit 1 with a verdict, owing three suites:
  `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/`, on
  `docs/tasks/T-212-…md`. Frontmatter clean over the whole live tree.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.

### Reported, never regenerated

**`capabilities:check` is STALE and it is mine.** It answered **CURRENT
(44961 bytes)** at `28924c7` before any edit, and **STALE — committed
44961, a fresh generation is 45063** after the new body's name landed.
`docs/CAPABILITIES.md` is outside this fence and read-only in this lane;
the regeneration is the INTEGRATOR's, in the merge commit
(`docs/CONVENTIONS.md`'s capabilities bullet). Reported here so the
merge does not learn it from CI.

### Reds that are not this lane's

**Two `session-economics.spec.ts` bodies red in THIS LANE** — *the
recommended seat is a function of the CARD…* and *the advisory line is
NOT a contract row…* — and the cause is **REF SKEW between this lane's
base and main**, not this diff and not a defect this fence may fix.

`brief.mjs` crosses a MACHINE-scoped list (the live worktrees, read now)
with a CHECKOUT-scoped one (the card files in the tree it runs in, read
at the base), so its disjointness verdict is a function of the reader's
BASE. `T-230` declares `touches: [tools/e2e]` at `28924c7` and
`touches: [tools/e2e/scripts/card-preflight.mjs,
tools/e2e/tests/card-preflight.spec.ts, tools/e2e/fixtures]` at main
`aad0cf7`, narrowed in a stamp commit that landed after this lane was
cut. **At main's card set the whole wave is pairwise disjoint.**

**MEASURED BOTH WAYS IN ONE DETACHED BENCH, same machine, same minute,
same live worktree list — the only variable is the checkout's card
copies:**

    session-economics.spec.ts at 28924c7  ->  2 failed / 8 passed, exit 1
    session-economics.spec.ts at aad0cf7  ->  10 passed,           exit 0

Corroborated onto **`T-143-s1`** (the suite's half) and **`T-187`** (the
stale-card mechanism, widened: the stale copy is a SIBLING's card, and
the consequence is a red rather than a stale instruction).

**A CARD WAS FILED AND WITHDRAWN BEFORE IT LANDED, AND THAT IS RECORDED
RATHER THAN TIDIED AWAY.** This lane first read the five findings as a
live dispatch defect — four concurrent lanes holding non-disjoint fences
— and wrote `T-223-s2` saying so. Re-derived at main's card set, the
claim is FALSE: the fences are disjoint there, the seat that narrowed
`T-230` had already done the right thing, and the finding was an
artefact of reading sibling cards at a stale base. The file was deleted
before it was committed and the true finding went to the two cards that
already own the class. **The failure mode is worth naming**: a refusal
that names SIBLING LANES reads exactly like a dispatch error, and the
only thing that separates the two is re-deriving at the integration
ref — which is `method/roles/executor.md`'s own correction clause
applied to a finding instead of to a figure.

The four bodies the dispatch brief attributed to the physical fence
layer (token-scan's seven-root plant, lane-lock's `cpSync` fixture, two
`nputer-index` bodies) are `T-216-s4`'s and were not touched here.

### Findings filed

- **`T-223-s1`** — `npm install` from `app/`, the setup step CONVENTIONS
  publishes, is refused `EACCES` on `app/package-lock.json` by the
  physical fence layer in every lane whose fence does not reach `app/`.
  Met cold at this lane's first setup command; `npm ci` (CI's own
  spelling for that package) worked first try. Class parent
  **`T-216-s4`**.
- **Corroboration on `T-143-s1`** — the same two bodies, with the
  trigger identified as ref skew rather than the live lane list, and the
  two-sided bench control that holds the worktree list constant.
- **Corroboration on `T-187`** — the stale copy a base-old lane reads is
  not only its OWN card, it is every sibling's, and here the consequence
  is a red rather than a stale instruction.

### Noticed and deliberately NOT filed

The two existing no-self-widening bodies widen their fixture card and
manifest to `[tools/e2e, docs]`, and `docs` is a token `expandFence`
calls UNUSABLE — so if either body ever stopped refusing, the allow
would be an announced cannot-compare rather than an enforced wide fence.
**They still discriminate today** (both assert a refusal, and an
announced allow is not a refusal), so this is a sharpening and not a
defect. It is recorded in the new body's own comment, where the next
reader of that fixture meets it, rather than as a third suggestion card:
`docs/STATE.md` names suggestion drift as a live problem, and a card for
a body that already discriminates spends a triage decision to buy
nothing.

### For the verifier

- The claim to attack hardest is **build step 2's refusal**. It is a
  decision, not a diff, and the measurement behind it is four `git`
  invocations in a throwaway repository that you can re-run in a minute.
  If a remote-first order is in fact safer, the whole of count ONE is
  wrong and the header now says something confident and false — which is
  precisely the failure this card exists to repair.
- The second is whether the new body measures the ROUTE or merely the
  outcome. It asserts both halves of the porcelain/plumbing asymmetry in
  the fixture, but the fixture's second worktree is created by this body
  alone; a lane in the wild has one from birth.
- `A2`'s three-body kill set is the coupling this card refuses to move.
  If you disagree with the refusal, that ledger is where the cost of
  moving it is stated.

## Verdicts

2026-09-02 — claude-opus-5@subagent (verifier, BLIND TWO-PHASE,
`review: independent`): **APPROVED.**

**THE BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINARY, AND THAT IS THE
WEAKER OF THE TWO GUARANTEES — SO IT IS NAMED.** Phase 1 reached this
seat before the lane produced anything: the bench was cut at this card's
base `28924c7` and the attack set and ground truth were written when no
diff, branch tip, note or report existed to decline to read. Both were
SEALED before phase 2 arrived —
`attack-V-T-223.md` sha256
`79983e8277dcee89190c294df4755afaf202f4d656c8446c04d86811e9daa691`,
`ground-V-T-223.md` sha256
`6aea83fdef8a714e0264f94861b93552a4996593689b7beee0bf08088fef595e`,
stamped `2026-09-01T22:19:47Z`. The verdict was DRAFTED and hashed
(`47135884adb98df9715b140b25931535ffc8ead7d7392e7b6f97a0e79aeb5755`,
02:12:26 EEST) before the implementation notes or any commit message was
opened; those were read afterwards, and this entry says which conclusions
changed as a result: **none**. One commit SUBJECT was unavoidably printed
by `git checkout --detach` at the start of phase 2.

### The gates, in this verifier's own bench at the commit under review `58c8001`

Blessed gate-runner, exit AND body count read from each `gate-verdict`
line rather than from the exit alone.

| suite | exit | verdict | bodies |
|---|---|---|---|
| `parser` | 0 | GREEN | **349** |
| `app` | 0 | GREEN | **1131** |
| `rust` | 0 | GREEN | **631** in 18 targets |
| `e2e` (`NPUTER_E2E_PORT=25223`) | 1 | RED | **536**, exactly TWO failures |

**The app suite's FIRST run was RED at 1131 bodies and it was this
seat's own gap, not the diff's**: 14 bodies read the SHIPPED bundle and
this bench had never run `npm run build` in `app/` — the error says so in
words (*"no build output at …/app/dist/assets"*). Built, re-run, GREEN.
Recorded because a red attributed to a diff by a verifier who skipped a
documented setup step is the failure this seat exists to avoid.

**The two e2e failures are NOT this diff's, and the attribution was
MEASURED rather than accepted.** Both are `session-economics.spec.ts`
(`:179`, `:365`). Re-run at the BASE `28924c7` in this same bench, same
machine, same live worktree list: **2 failed / 8 passed, exit 1** — the
identical pair. The failure text names five fence collisions of which
THREE do not involve `T-223` at all (`T-216-s4` against `T-230`, `T-230`
against `T-236`), which is the ref-skew mechanism this card's notes
describe, reached independently here from the failure output.

**All 24 `landing-gate.spec.ts` bodies pass, including the new one.**
`capabilities:check` is **STALE — committed 44961, fresh 45063** (+102
bytes, one added test-name bullet). That is the CORRECT post-lane state:
`docs/CAPABILITIES.md` is outside every lane fence since `T-210` and is
not in this diff. The integrator regenerates it in the merge commit.

### Build step 1 — the sentence: MET

The header's absolute is gone, the positive property is stated, and the
local-ref rewrite is enumerated as **limit 6** in `WHAT THIS GATE CANNOT
SEE` — with limits 1–5 intact and unrenumbered (checked). `T-212`'s card
carries the same property APPENDED beside its struck clause. This seat
independently reached the two facts the notes also record — that
`203e374` had already landed the DISCLOSURE at the base, and that
*"beside the other four"* was stale because the list held five — and both
appear in the phase-1 attack set, written before the lane's work existed.

### Build step 2 — the reorder: WEIGHED, REFUSED, AND THE MEASUREMENT REPRODUCES

The card's own steer names this the claim to attack hardest. Re-measured
independently, in a throwaway repository, `main` in worktree A and the
lane branch in B, every command run from B, git **2.50.1 (Apple
Git-155)** on Darwin 25.6.0 arm64:

    git update-ref refs/remotes/origin/main <sha>   -> exit 0
    git fetch . +<sha>:refs/remotes/origin/main     -> exit 0
    git fetch . +<sha>:refs/heads/main              -> exit 128, fatal:
                                                       refusing to fetch into
                                                       branch 'refs/heads/main'
                                                       checked out at …

Count ONE holds, and the control in the third line is what makes it a
measurement rather than a coincidence. **One nuance the header does not
carry and does not need**: `git worktree add <dir> refs/remotes/origin/main`
exits 0 — it checks out DETACHED, no ref is held, and the remote-tracking
ref stays writable (exit 0) with that worktree standing. So *"no worktree
can check one out"* is true in the only sense that arms a guard.
Count TWO (a remote-first gate would refuse a lane widened by fast path A
until push and fetch) follows from where a fast-path-A amendment lands
and is sound. Count THREE is confirmed structurally by this seat's own
drill: MC3 below shows a `dispatch-brief.mjs`-only reorder reds the
identity body, and `brief.spec.ts`'s bare-name-first assertion is outside
this fence. **This seat pre-committed in phase 1, before the diff
existed, that a reorder was structurally refused by this fence; the diff
refuses it for that reason and two better ones.**

### Build step 3 — the body: it has a real positive control, and it binds to the FENCE

The drill below is this verifier's own, in its own bench, one side at a
time, landing read from `git diff -U0` (never a mutator's report), and
`shasum -a 256` verified back to the tip's three files after every single
mutant.

| mutant | what moved | bodies that died |
|---|---|---|
| MC1 | `integrationRefCandidates` reordered remote-first, HOOK ONLY | `:287` identity, `:588` card-not-on-main, **`:605` the new body** — 3 failed / 21 passed |
| MC2 | the same reorder in BOTH fenced files | `:588`, **`:605`** — identity SURVIVES: it is a symmetric `toEqual` and blind to a change made on both sides — 2 failed / 22 passed |
| MC3 | the same reorder in `dispatch-brief.mjs` ONLY | `:287` alone — 1 failed / 23 passed |
| MC4 | the resolution LOOP reversed in the hook (the site the property lives) | `:588`, **`:605`** — 2 failed / 22 passed |
| MD3 | **DATA**: the moved-to commit's card is NOT wider | **`:605` ALONE** — 1 failed / 23 passed |

**KILL-SET CONTAINMENT, NOT THE COUNT.** `:287` and `:605` neither
contains the other: MC3 kills `:287` and leaves `:605` green, while MC2,
MC4 and MD3 kill `:605` and leave `:287` green. Both are load-bearing.
**MD3 is the proof a code-only drill could not give**: the property —
*the fence this gate enforces is the one declared at whatever commit the
moved ref names* — lives in the fixture's DATA, and mutating that data
kills the new body and nothing else in the file.

### The one finding, and it is the executor's own least-confident line

The notes ask whether the body measures the ROUTE or merely the outcome.
Measured: **it measures the outcome plus the fence content, and does not
exclude a second route to the same outcome.**

    MD2 (DATA): `git update-ref refs/heads/main` retargeted from the
    widened commit to the LANE TIP  ->  24 passed, exit 0. SURVIVES.

Pointing `main` at the lane's own tip also flips the verdict to allow —
measured at the BASE ref in phase 1, before this diff existed: the
merge-base becomes the tip, the range EMPTIES, and the gate answers
`landing-gate-inside-the-fence` with **0 path(s)** instead of 1. The new
body's closing assertions (`refused === false`, not an announced
cannot-compare, the remote ref moved) hold in both worlds. **This is a
SUGGESTION and not a failure**: MD3 proves the body binds to the fence
declared at the moved ref, and the fixture as written does exercise the
widening route. Filed as `T-223-s3` with the one-line strengthening that
kills MD2 — and that proposed control was itself checked against this
seat's own rule that a suggested control must be able to fail.

### Security sweep — clean, and the strongest reason is mechanical

**The production change is COMMENT-ONLY.** With block and line comments
stripped and whitespace removed, the executable bytes are IDENTICAL
between `28924c7` and `58c8001`: `.claude/hooks/landing-gate.mjs`
`e1eefc4954fd1b1165aebcffe0c71c133828a92e158b3067ac78e799e7ad5e61` at
both refs, `tools/e2e/scripts/dispatch-brief.mjs`
`0dc7b45f1681f6a206daa6a7d989a6978f2432de590ef0ad1e4edb9124fca92d` at
both. The only executable change in the diff is the new spec body.

- **No new `import` or `require` anywhere in the diff** — the hook's
  dependency budget (no `node_modules`, no `dist/` in a ninety-second-old
  worktree) is intact.
- **No new input path, no new `allow(` arm, no fail-open drift**, by the
  same byte-identity.
- **THE REF-MOVING TEST IS SAFE.** Every git invocation in the new body
  targets `fx.root` explicitly or the fixture's own helper; the second
  worktree is created under `mkdtempSync(os.tmpdir())` and registered in
  `SCRATCH` for `removeGitFixture`; the body references `repoRoot`
  **zero** times. On a machine running three sibling lanes tonight, a
  fixture that moved a real `main` would have been REJECTED-level, and
  this one cannot.
- No secrets, no dependency additions, no shell-string interpolation of a
  branch or candidate (argv arrays throughout).

### ARCHITECTURE and CONVENTIONS

Fence honoured: the three fenced paths plus writes under `docs/tasks/`,
which rule 5 puts outside every fence. No `method/` edit, so no version
bump is owed (this fence could not perform one). Frontmatter deltas over
the WHOLE diff are exactly three lines — `-status: building`,
`+status: verifying`, `+status: suggested` — all legal. `T-223-s1`'s
title opens with a backtick and IS quoted, which is `TASK-FORMAT.md`'s
rule and the failure mode that makes a board silently shorter. The two
sibling-card writes are CORROBORATIONS, which that same file sanctions.
Fixtures pin `git init -b main` through the file's existing `fixture()`.

### Two disclosures this seat owes about its own conduct

1. **A root-cwd run clobbered a file in this bench.** Running the census
   generator from the repository root instead of `tools/e2e/` rewrote
   `docs/CAPABILITIES.md` with garbage — CONVENTIONS' *"a command carries
   its cwd or it is half a spelling"*, committed while measuring.
   Restored by `git checkout --`, sha256 back to the committed
   `12e2c4330d30fff8d3e1c2eac21c85f7ad45bba8e19f113685fe1f2d7acb1924`,
   `git status --porcelain` empty. Nothing left the bench.
2. **The first drill script did not apply four of its five mutants** —
   backticks inside a double-quoted shell string were substituted by the
   shell, the exact hazard CONVENTIONS names, met inside a drill about a
   guard. Every one of those runs reported *24 passed*, and `git diff`
   showed an EMPTY diff, which is why the rule is to read a mutant's
   landing from `git diff` and never from a green suite. Re-run through a
   literal-string mutator; the ledger above is from that run.

### Suggestions filed — never blocking, never folded into this verdict

- **`T-223-s3`** — the new body survives the lane-tip data mutant; one
  merge-base assertion closes it.
- **`T-223-s4`** — the narrowed sentence is still an absolute under one
  measured route (`git symbolic-ref HEAD refs/heads/main` from the lane
  exits 0, and an ORDINARY commit then moves `main`), and
  `T-211`'s card still carries the struck clause in its fast-path-A
  prose. **Explicitly NOT charged against this lane**: the card
  PRESCRIBED that exact sentence, and `TASK-FORMAT.md` warns that a
  finding is read as a unit and its proposed remedy adopted.
- `s2` is deliberately skipped: these notes record a `T-223-s2` filed and
  withdrawn before it was committed, and reusing the id would make that
  record ambiguous.

### Step 7 — the gates this verdict's OWN commit could move

Appending a verdict and filing two cards are WRITES, and prose is a code
input here. Measured at **`2561553`**, the commit carrying the entry
above, in the verifier's bench:

| gate | exit | figure |
|---|---|---|
| `docs-gate.mjs`, 3 separate literal paths | **1 = FIRES** | a verdict, not a crash: **0 frontmatter issues**, *every live task card's frontmatter parses, with a legal status* |
| `parser` | 0 | GREEN, **349** |
| `app` | 0 | GREEN, **1131** |
| `e2e` | 1 | RED, **536** — the SAME two `session-economics` bodies, **2 failed / 534 passed**; nothing this commit wrote moved |

The regress is closed by naming the ref rather than by chasing it: every
figure above is a fact about `2561553`, and the only gates a prose-only
commit on top of it can move are the docs gate and the card-parsing
suites, re-read at the final tip.
