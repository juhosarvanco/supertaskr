# State

Updated: 2026-08-26 by the T-134 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP. NOTHING IS BROKEN.
ONE COMMAND ON MAIN EXITS 1 ON PURPOSE. ONE CARD IS `status: building`
WITH NO LANE, AND THAT IS ALSO ON PURPOSE.** This merge is **512 / 973 /
290 / 194 green**. `cargo run -p nputer-index -- arch cycles --root ../..`
is **exit 1** on main and that is the DESIGNED state — the one declared
cycle `C-08 -> C-09 -> C-08` survives because removing it needs paths
T-127's fence could not reach, and the removal is routed with its
measurement (`T-127-s1`). **The ENFORCING copy is `cargo test`, which is
green.**

## **THIS MERGE CHANGES HOW EVERY FUTURE DISPATCH DECIDES WHETHER TWO LANES MAY RUN AT ONCE**

**A FENCE NAMES PATHS. A COMPONENT NAME IS SHORTHAND FOR THE PATH SET IT
STANDS FOR. DISJOINTNESS IS COMPUTED OVER THE EXPANDED SETS AND NEVER
OVER THE TOKENS.** That sentence is now both a rule
(`method/lane-protocol.md` rule 5) and a mechanism
(`lib/parser/src/fence.ts`), and the two are ONE implementation rather
than a rule and a copy of it.

**IT CAUGHT A LIVE NEAR-MISS ON ITS WAY IN, AND THE NEAR-MISS WAS THE
ARCHITECT'S OWN NEXT DISPATCH.** Three planned cards — **`T-105`,
`T-128` and `T-131`** — each hold `touches: [method/, docs/CONVENTIONS.md]`,
and `method/` **CONTAINS** the `method/lane-protocol.md` this lane held.
Token equality calls all three disjoint from the lane. **They were not.**
Derived at this checkpoint through the merged module itself:

    T-105 x T-134   tokens=disjoint   expanded=OVERLAPPING   witness method/lane-protocol.md
    T-128 x T-134   tokens=disjoint   expanded=OVERLAPPING   witness method/lane-protocol.md
    T-131 x T-134   tokens=disjoint   expanded=OVERLAPPING   witness method/lane-protocol.md

**`T-131` WAS NEXT IN LINE.** Dispatching it while that lane was live
would have put two writers on `method/lane-protocol.md`, and nothing in
this project except this card's own mechanism could have told the
difference.

**AFTER THIS MERGE ALL THREE ARE GENUINELY FREE, AND SO IS `T-137`** —
which was visibly blocked, sharing the `lib-parser` token. **BEFORE IT
THEY WERE NOT.** They are released because the card CLOSES and its
worktree goes, not because the comparison changed: the comparison is what
made the fence visible in the first place.

**AND THEY ARE NOT FREE OF EACH OTHER.** `T-105`, `T-128` and `T-131` all
hold `docs/CONVENTIONS.md` and `method/`, so they overlap **visibly**, on
tokens; **at most one of the three is dispatchable at a time.**

### **THE SAME SHAPE IS STILL LIVE ONE FILE OVER, AND NO BRIEF NAMED IT**

**`T-131 × T-135` → OVERLAPPING, witness `method/tasks/TASK-FORMAT.md`,
tokens DISJOINT.** So are `T-105 × T-135` and `T-128 × T-135`. **`T-135`
is `building` with Half B unwritten.**

**IT HOLDS NO LANE TODAY, SO NOTHING IS FENCED RIGHT NOW** — rule 5 binds
concurrent LANES, not open cards, and `T-135`'s worktree was removed at
its own checkpoint. **But the day Half B is cut as a lane, dispatching
any of those three beside it puts two writers on `TASK-FORMAT.md`, and a
token comparison will call them disjoint.** This is the identical failure
this merge just closed, one file over, and it is written here because the
next dispatcher will meet it before it meets the card.

## **THE CARD THIS MERGE LANDS IS `done`. THE ONE THAT IS STILL OPEN IS `T-135`, AND THAT IS DELIBERATE.**

**`T-135` is `status: building` and NO LANE IS LIVE FOR IT.** That
combination has meant "somebody forgot" every other time it has appeared
in this record. **It does not mean that here.** T-135 is one card with
two halves and a reversible boundary (its planning pass §2). **HALF A
MERGED** at `9ae87a6` — `mod` declarations are graph edges, `arch blast`
derives dependents — verified and APPROVED at `c983a7d`. **HALF B DID
NOT**: the ceremony section in `method/tasks/TASK-FORMAT.md` and ADR-018
are unwritten, because they wait on **@human's look at its §6 and §7**.
No frontmatter line moved on it, and `status:`'s eight values contain
none that is true of the card — the conflict is RECORDED AND ROUTED as
`T-135-s4`, not decided. **Half B wants a FRESH lane cut from this
checkpoint (rule 2), a fence widened by the ARCHITECT to include
`docs/decisions/` (its §11), and it must not be re-dispatched whole:
Half A is on main and its criteria 1–3 are discharged.**

## WHAT T-134 ACTUALLY LANDS, AND WHAT IT IS NOT

**FIVE CODE PATHS AND ONE PROTOCOL PATH.**

- **`lib/parser/src/fence.ts`** (new, 470 lines) — the whole mechanism.
  `normalizeFenceToken` (ONE spelling: backslashes, repeated slashes, a
  leading `./`, a trailing star run and a trailing slash all collapse),
  `slugPathIndex` (the map, READ off each component file's own
  `touch_slugs:`), `expandFence` (four token kinds, the own-file
  carve-out, `invalid-field` issues on `touches`) and `compareFences`
  (**a THREE-valued verdict**).
- **`lib/parser/test/fence.test.ts`** (new) — 22 bodies, the live board
  as the fixture wherever it can be.
- **`lib/parser/src/index.ts`**, **`lib/parser/src/pure.ts`** — additive
  re-exports. The browser-safe barrel takes it too, because `fence.ts`
  imports nothing but `./types.js`.
- **`method/lane-protocol.md`** — rule 5 gains the fence's definition,
  the one-spelling rule, the unfenceable-directory rule and the own-file
  clause.

**THE CEILING IS DECLARED RATHER THAN DISCOVERED.** An interior `*`, a
`?`, a character class or a leading `!` surviving normalisation is
`unresolved` and makes the fence `unusable` — because comparing
`app/src/**/*.ts` as a literal prefix would answer confidently and
wrongly. **AN UNRESOLVED TOKEN IS NEVER SILENTLY DISJOINT**; three
verdicts, never two.

**A BARE `docs/tasks/` FENCE IS REFUSED AT PARSE TIME, AND THE REFUSAL
HAD TO BE MECHANICAL RATHER THAN CONVENTIONAL.** The verifier attacked
that argument and it held: simulating a fenceable `docs/tasks` shows the
holder reserves the directory, the neighbour's own card file is carved
out of the NEIGHBOUR's own fence, and the comparison comes back
**disjoint** — the collision is structurally invisible to a
fence-versus-fence comparison, because the collision is between a fence
and a PROTOCOL WRITE and the comparison has no term for one.

**A CARD'S OWN FILE IS OUTSIDE EVERY FENCE INCLUDING ITS OWN, AND THAT
RESOLVES `T-108-s3` QUESTION 1** — a lane writing to its own card is not
a fence breach, so `executor.md` step 5 becomes performable under a
path-granular fence instead of forbidden by one. **Deliberately narrower
than the finding's three questions**: (2) dissolves (the notes go on the
card, so nothing is transcribed and T-057 is not engaged) and (3) is
answered by construction (the clause is tier-blind). **The SECOND
conflict on step 5 — the verifier reading the file this role writes into
— is NOT touched and NOT resolved.**

**AND IT IS NOT A SECOND MAP.** `slugPathIndex` joins two of each parsed
`ComponentRecord`'s own fields and embeds no table; the pin derives the
whole map from the registry rather than asserting it, and mutating C-11's
`touch_slugs:` reds two bodies. `app-shell` and `app-board` appear in
`fence.ts` **only in doc comments**.

### **THE DUPLICATE IS REAL, IS ROUTED RATHER THAN CLOSED, AND TODAY IT AGREES**

**THERE ARE TWO IMPLEMENTATIONS OF THIS EXPANSION ON MAIN RIGHT NOW.**
`tools/e2e/scripts/dispatch-brief.mjs` (T-133) carries
`slugMapFromFields`, `expandFenceEntry`, `pathsOverlap` and
`fenceOverlaps` — the same join off the same authoritative field. The map
is not duplicated; **the FUNCTION is**, which is T-057's rule about a
fact with two implementations.

**THE CARD'S OWN CHARACTERISATION OF THE DIVERGENCES IS WRONG IN TWO WAYS
AND THE VERIFIER CORRECTED BOTH.** R1 says *"the divergences are real and
all in one direction"*: they go **both ways** — the missing own-file
carve-out makes that copy STRICTER (a false overlap), while `ci` and
`docs/tasks` make it LOOSER (a false disjoint). And R1 **undercounts**:
`pathsOverlap` also does not collapse repeated slashes, does not strip a
leading `./`, strips only ONE trailing slash and does not convert
backslashes, so `docs//tasks2/`, `./method/`, `method//` and
`method\lane-protocol.md` each come back **disjoint where the parser says
overlapping** — four more, all in the DANGEROUS direction — and it has no
glob ceiling.

**AND HERE IS THE MEASUREMENT THE CARD NEVER MAKES, WHICH IS THE
REASSURING ONE.** On the live board the two implementations **agree
exactly: 305 overlapping pairs each over 703 pairs, ZERO
disagreements.** **The duplication `T-137` will resolve is a LATENT
hazard today, not an active wrong answer** — which is the difference
between a card to schedule and a fire to put out.

**AND UNIFYING HERE WOULD HAVE BREACHED THE VERY RULE THIS CARD SHIPS**:
`tools/e2e` is outside its fence. The manifest's *"imports neither app
nor parser"* is a recorded ADR-011-family choice, and `brief.spec.ts`
already pins `fenceOverlaps` on the same containment case. **`T-137` is
the vehicle** and now reads `touches: [lib-parser, app-map, tools/e2e]`,
spanning both. **One ground of that ruling went stale under the
verification and was STAMPED rather than deleted**: `T-136` was `building`
holding `[tools/e2e]` when the ruling was written and is `rejected` now.

### **THE ONE DEFECT IN THIS CARD WAS INVISIBLE TO ALL 290 BODIES, AND THAT IS ITS OWN LESSON MEASURED**

`compareFences` built its witness-dedup key by joining three strings with
what were meant to be spaces and were written as **two literal U+0000
bytes**. The key WORKED — a NUL is a perfectly good separator — so the
parser suite was **290/290** with it in place and `tsc --noEmit` was 0.
**`tools/e2e`'s P5 control-character rule is the only thing in this
repository that could see it**, and it arrived as three failing bodies in
`token-scan.spec.ts` counting **9 planted control bytes against an
expected 7**. Fixed at `31d8212` with `JSON.stringify`, which removes the
separator question rather than answering it.

**THE VERIFIER REPLANTED IT AND WATCHED THE GATE**: exactly 2 × U+0000 at
byte offsets **18812** and **18824**, `lint:tokens` red at **P5** on those
same two offsets, exit 1, **while the parser suite stayed 290/290 exit
0**. **A defect that changes no behaviour is invisible to every
behavioural suite by construction, and its only guard is a gate that
reads the TEXT.**

### **FIVE BEHAVIOURS NO BODY CATCHES, AND THE SHARPEST ONE IS THE FIX ITSELF**

The lane's eight poison arms reproduce **exactly** against a 290/290
control (6 · 3 · 1 · 2 · 2 · 2 · 1 · 4 killed). **Five arms of the
verifier's own do NOT**, so these behaviours are UNPINNED:

1. the own-file suppression *inside* `compareFences` —
   `if (excluded.has(shared)) continue;` **can be deleted green**;
2. `sharedDomain`'s repository-root arms;
3. the witness SORT, which the interface documents;
4. the witness DEDUP;
5. **the dedup key reverted to an ordinary space join stays 290/290
   green** — the NUL site remains invisible to every behavioural body,
   which is this card's lesson measured rather than repeated.

## **WHAT THE APPROVAL DOES NOT COVER — DISCLOSURES, NOT DEFECTS**

- **THE UNION-EXCLUSION HOLE.** `compareFences` unions BOTH fences'
  `excluded` sets, so if card B explicitly fences card A's own file while
  A is live, the shared domain is suppressed and the verdict is
  **`disjoint`** though both would write it. `fence.ts` discloses it in
  source, live exposure is **zero** (no card fences another card's file),
  and arm 9 above shows the suppression is unpinned. **BUT `T-134`'s OWN
  R3 AND R4 PROPOSE FENCES OF EXACTLY THAT SHAPE**
  (`[…, docs/tasks/T-054-…md]`), which would create the first instance.
  The existing body *"does not suppress a collision on somebody ELSE's
  card file"* uses a THIRD card's file and never reaches the case.
- **AC6 IS MET IN THE FENCE MODULE, NOT IN `validateProject`.** A card
  spelling `docs/tasks/` is refused only when someone expands its fence;
  the normal parse path stays silent. Routed deliberately (R3), because
  wiring it today would put three issues on the live tree from `T-054`
  and red `lib/parser/test/smoke.test.ts`, whose repair needs a file
  outside this fence.
- **THE PROTOCOL HALF SHIPS PINNED AS TO ITS SHAPE AND UNPINNED AS TO
  WHAT IT SAYS.** See the next section — the card's own R6 gets the
  reason wrong.

### **R6 IS FALSE AND THE CONCLUSION SURVIVES FOR A SHARPER REASON**

The card's R6 says `method/lane-protocol.md` is *"read by NO suite"*.
**It is read**: `tools/e2e/scripts/dispatch-brief.mjs:152` calls
`readDoc("method/lane-protocol.md")` via `laneProtocolText()`, and
`tools/e2e` exercises it. **The conclusion holds anyway, and for a
structural reason rather than a content one**: that consumer reads
numbered steps **2, 3, 4 and 6** only, this edit is **entirely inside
step 5**, and steps 2/3/4/6 are **byte-identical across the merge** (819
/ 1107 / 5927 / 960). `numberedStep` THROWS on a missing step. **So there
is a STRUCTURAL guard and no CONTENT guard** — the shape of rule 5 is
pinned and its text is not.

**`cargo test` IS NOT OWED HERE AND THAT IS DERIVED RATHER THAN SKIPPED.**
No `.rs` path is in the diff, and `method/lane-protocol.md` is **not**
among the fourteen `method/` files compiled into `agent/kit.rs` — the
parity test walks `docs-templates`, `adapters` and `tasks`, and the two
Rust mentions (`dispatch/join.rs:57`, `dispatch/lanes.rs:40`) are doc
comments, not `include_str!`. **It would have cost everything if this
card's fence had been `method/tasks/TASK-FORMAT.md`**, which is exactly
Half B's fence. It was run anyway; see the suites.

## THE FIXTURE RECONCILIATION WAS ONE ASSERTION LARGER THAN EVERY FORECAST OF IT

**THE VERDICT AND THE INTEGRATOR BRIEF BOTH NAMED TWO SITES** — the `181`
in `architecture-dogfood.test.ts` and `"committed graph · 181 files"` in
`map-dogfood-render.test.tsx`, with `smoke.test.ts` correctly excluded.
**Measured on the merged tree with the regenerated graph: 2 failed / 971
passed, and THREE red assertions.**

    architecture-dogfood.test.ts:1298   expected 183 to be 181
    architecture-dogfood.test.ts:1421   ["C-06", 25]  -> 27      HIDDEN
    map-dogfood-render.test.tsx:680     'committed graph · 183 files'

**THE THIRD SITS BELOW THE FIRST IN THE SAME `it()` BODY**, so vitest
never reaches it while the size check is red — and **that body's own C-06
comment has warned about exactly this since T-053**, in as many words:
*"it sits below the size check above, so vitest never reaches it while
that one is red."* **The warning fired on the pass that was reading it,
for the second consecutive merge.** T-135's checkpoint recorded the same
class from the other side (nine failing bodies, ten red assertions).

**FOUR SITES EDITED**: the two assertions, the tally row, and the test
TITLE `all 181 files map`. **A fixture pass runs until the body is green,
never until the first message stops appearing** — and a forecast that
counts FAILING BODIES is the wrong unit to plan a repair against.

## **THE IDENTICAL-FIGURES TRAP FIRED TWICE IN ONE INTEGRATION, IN THE STRONGEST FORM IT HAS TAKEN**

**THREE DISTINCT GRAPHS AT EXACTLY 970 961 BYTES.**

    09151e14…   970961   the lane's pre-NUL-fix tree      (verifier's)
    ee554cea…   970961   the merged tree                  (reproduced here)
    616205de…   970961   after the fixture writes         (committed)

GRAPH REGEN was asked **five** times. The first: **STALE**,
`955710 · 181 · 2038 · 1943` → `970961 · 183 · 2064 · 1986`, `files +2 -0
~2`, `edges +43 -0`, the four named paths exactly this merge's four `.ts`
paths — no foreign staleness. **The SECOND is the finding**: after the
fixture writes it reported **every headline figure identical on both
sides** —

    committed:   970961 bytes · 183 files · 2064 symbols · 1986 edges
    fresh index: 970961 bytes · 183 files · 2064 symbols · 1986 edges
    -> STALE, exit 1
    files +0 -0 ~2
    | ~ app/test/architecture-dogfood.test.ts   (content, loc 1951 -> 1974)
    | ~ app/test/map-dogfood-render.test.tsx    (content, loc  684 ->  695)

**A BYTE COMPARISON WOULD HAVE CONFIRMED "CURRENT" AND BEEN WRONG, TWICE
IN ONE SESSION.** The third ask is CURRENT, and so are the
fourth and fifth, taken after every doc write in this checkpoint —
**including after the architect's `b3eaefe`, which confirms rather than
assumes that a new `.md` under `docs/tasks/` is not indexed.** **Regenerating `ee554cea…`
independently also reproduces the verifier's own post-fix hash**, which
is the strongest available check that the lane's tree and the merged tree
are the same tree.

## THE BYTE BUDGET IS THE FIGURE NOTHING REPORTS AND THIS IS THE LARGEST SPEND IN THE SERIES

**970 961 of `max_graph_bytes` 1 000 000 = 97.10%, 29 039 bytes of
headroom**, spending **15 251** — larger than T-135 Half A's **11 120**,
which its own checkpoint called the largest single spend to date. **TWO
INDEXED FILES AND 43 EDGES COST MORE THAN 27 NEW EDGES DID.** At 29 039
bytes the budget holds roughly two more merges of this size.
**DERIVE IT AT YOUR OWN REF; a transcribed byte count is a line number by
another name.**

**`arch` MOVES `files=181 → 183` AND `mapped=181 → 183` AND NOTHING
ELSE** — `components=13 unmapped=0 edges=37 findings=4
drift_components=4`, every one unchanged — and **C-06 25 → 27 is the only
component whose count moves**, its third move ever and its first since
T-055. Every one of the 43 new edges is C-06-internal or lands on a `p:`
package node.

## THE LANE LIST, DERIVED AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-FOURTH MEASUREMENT
SAYING SO.** Two commands answer it:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

**AFTER THIS CHECKPOINT THERE IS EXACTLY ONE LANE: `T-111`.**
**DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO NOT QUOTE THIS
PARAGRAPH** — and this checkpoint is itself a worked case for that
instruction, because **the worktree list moved twice in fifteen minutes
while this integration was running.**

- **`/Users/ujju/Projects/nputer-T-111`, `refs/heads/task/T-111-board-dispatchable`,
  tip `09b8920` — THE ONE LIVE LANE.** `touches: [app-board, app-shell]`,
  `status: building`, in verification. **Its worktree is CLEAN** and it
  was left entirely alone. **Its fence is enormous**: `app-shell` expands
  to nearly all of `app/`, so **21 planned cards overlap it, every one of
  them VISIBLY, on tokens.**
- **`/Users/ujju/Projects/nputer-T-134` — REMOVED by this checkpoint**
  (rule 6, after the merge and after the checkpoint). See below.
- `/Users/ujju/Projects/nputer-app`, **detached at `f9350b1`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **IT DID NOT MOVE UNDER
  THIS INTEGRATION** and is now **nine merges behind main.**
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS INTEGRATOR'S,
  AND IT MOVED ONTO THIS MERGE WHILE THIS CHECKPOINT WAS BEING WRITTEN.**
  `1de937f` at 12:38 EEST and **`520e93e` — this merge — at 12:53**, with
  one modified file (`docs/tasks/T-137-…md`). Somebody's live checkout,
  tracking main. On no `task/` branch and named after no card, so **not a
  lane**; read with `git -C … rev-parse` and `git -C … status
  --porcelain` and nothing else, and left alone. **Its modified file is
  evidence that `T-137` is being worked somewhere; it is not on main.**
- **FOUR detached `/private/tmp/t111*` checkouts — T-111's own drills, and
  they are MOVING.** `t111b` `15a963d`, `t111f` `f9350b1`, `t111v`
  `ea21839` (a `Merge commit '15f0d7d' into HEAD` — somebody's merge
  forecast), and **`t111m` at `15f0d7d`, which did not exist at 12:38 and
  did at 12:53.** All detached, all on no `task/` branch: **none is a
  lane**, none was touched.

## Just completed

**T-134 — A FENCE NAMES PATHS AND A SLUG IS SHORTHAND.** F-06, milestone
4, **size M**, `touches: [lib-parser, method/lane-protocol.md]`.
Main-before **`15f0d7d`**, lane tip **`4b6c6b7`** (derived with `git
rev-parse` — it is the **VERDICT ADDENDUM** commit, not the lane's last
work commit `31d8212`), merge **`520e93e`**. **THIS CHECKPOINT IS NOT THE
MERGE'S DIRECT CHILD, AND THAT IS A FIRST FOR THIS SERIES**: the
architect committed `b3eaefe` (one file, `docs/tasks/T-138-…md`) between
the merge and this write, so the parentage is `520e93e` → `b3eaefe` →
this checkpoint. **The range is unaffected — it is between two fixed
commits and `b3eaefe` is outside it** — and the merge and the checkpoint
are still two commits and still in that order, which is what
`integrator.md` rule 1 actually requires. Built by `claude-opus-5`
(`9dfb5a0`, notes `c98313c`, NUL fix
`31d8212`, addendum `8d93149`), verified by a second `claude-opus-5`
session (`4f40ccd`, addendum `4b6c6b7`), integrated by a third that
neither wrote nor reviewed the lane's commits. **`review: same-model`,
and the `Co-Authored-By` trailer on those commits is a harness constant
and is NOT evidence of a model** — T-085 proved it, T-101 sharpened it.

**THE VERIFIER CAUGHT ITSELF, AND THE LESSON IS EVERY READER'S.** Its
FIRST flip census reported **four reverse flips** — flips toward
*disjoint*, the direction that would mean the expansion LOOSENS a fence
and the only direction that would be dangerous. **It was its own ad-hoc
frontmatter parser choking on a trailing `#` comment after `paths:`** in
four component files (C-05, C-07, C-12, C-16), which parsed with ZERO
paths. Re-derived through the real parser: **reverse count 0, and it
stayed 0 under both implementations.** **A verifier's own tooling is the
last thing that gets a positive control** — and if you write a throwaway
parser to check anything about fences, that is the failure waiting for
you. **Use `fence.ts`; it is on main now.**

**THE CENSUS, RE-DERIVED HERE THROUGH THE MERGED MODULE**, is stable
across five refs and moves only when a card leaves the open set:

    15a963d   36 cards   630 pairs   25 flips   0 reverse   (lane)
    cf470f5   38 cards   703 pairs   25 flips   0 reverse   (verifier)
    15f0d7d   37 cards   666 pairs   25 flips   0 reverse   (verifier addendum)
    520e93e   37 cards   666 pairs   25 flips   0 reverse   (this merge, pre-stamp)
    +stamp    36 cards   630 pairs   22 flips   0 reverse   (T-134 leaves the open set)
    b3eaefe   37 cards   666 pairs   25 flips   0 reverse   (T-138 arrives)

**THE DROP FROM 25 TO 22 IS THIS MERGE'S WHOLE EFFECT ON THE BOARD'S
FENCE GRAPH**, and it is exactly the three cards named at the top of this
file. **`T-111 × T-134` → `{verdict: disjoint, witnesses: [], unusable:
[]}`**, derived through the mechanism and not assumed.

**AND THEN IT WENT STRAIGHT BACK TO 25, ON THE SAME THREE CARDS, INSIDE
THE HOUR — WHICH IS THE MOST INSTRUCTIVE FIGURE IN THIS FILE.** See the
next section: the identical total conceals a complete change of pairs.

**THE TWO PINS, AND THE CARD GUESSED BACKWARDS.** The card says *"both
SHALL fail against the pre-fix tree — the second one probably passes
today"*. **It is the FIRST that passes and the second that fails.** Pin
one (slugs collide, paths do not, required disjoint) is a CONTROL against
token equality, and it is genuinely new only against the OTHER model of
before — slug granularity — with both models in the suite. **PIN ONE HAS
NO LIVE INSTANCE AND CANNOT HAVE ONE**: zero `touches:` path tokens fall
inside any SLUG-CARRYING component. Pin two (paths collide, required
overlapping) is genuinely new **in two live instances**: `T-112 ×
T-114` on `app/src/assets` and `app/src/styles`, and `T-128 × T-134` by
containment.

### **THE MECHANISM'S FIRST CONSUMER ARRIVED ONE COMMIT LATER AND IMMEDIATELY RE-CREATED THE SAME THREE COLLISIONS**

**`T-138` was filed by the architect at `b3eaefe`, between this merge and
this checkpoint**, `status: planned`, `blocked_by: [T-134]` — so **this
merge is what unblocks it** — with

    touches: [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]

**`CLAUDE.md` IS THE FIRST REPOSITORY-ROOT FILE TOKEN THIS BOARD HAS EVER
CARRIED, AND IT IS ONLY EXPRESSIBLE BECAUSE OF THIS MERGE.** Derived at
this ref: it is tracked by git, it is in **zero** components, it appears
**zero** times in `graph.json`, and it is the **only** bare root-file
token across all 300 cards' `touches:`. Under slug granularity there was
no word for it; under token equality it would have been compared as a
string against nothing.

**AND THE FENCE IT EXPANDS TO PUTS THE THREE RELEASED CARDS STRAIGHT BACK
INTO AN INVISIBLE COLLISION**, because `method/` contains
`method/roles/*.md`:

    T-105 x T-138   tokens=disjoint   expanded=OVERLAPPING   method/roles/{executor,orchestrator}.md
    T-128 x T-138   tokens=disjoint   expanded=OVERLAPPING   method/roles/{executor,orchestrator}.md
    T-131 x T-138   tokens=disjoint   expanded=OVERLAPPING   method/roles/{executor,orchestrator}.md

**THE FLIP TOTAL IS 25 BEFORE THE MERGE AND 25 AFTER `b3eaefe`, AND NOT
ONE OF THE THREE MOVING PAIRS IS THE SAME PAIR.** A total that does not
move is not evidence that nothing moved — the same trap the ROADMAP
census carries, one board over. **Whoever dispatches next must derive the
pairs, not the count**, and must sequence `T-138` against `T-105`/`T-128`/
`T-131` exactly as it sequences those three against each other.

**AND THE ARCHITECT DISCLOSED THE COMMIT RATHER THAN LETTING IT BE
FOUND**, which is why this section exists at all: one file, written with
`git commit -- <path>` scoped to it, index left clean, this integrator's
seven modified files untouched in the tree, and all three owed suites run
green at that seat's own ref before the disclosure. **Safe-from-corruption
is not safe-from-confusion**, and the difference between the two was
closed by a message rather than by machinery.

**AND THE CARD FILES NO SUGGESTION CARDS AT ALL.** Its six findings
R1–R6 live in the card's own "Routed" section rather than as
`T-134-sN` files. `R1` has a vehicle (`T-137`) and `R5` names a fence,
but **`R2`, `R3`, `R4` and `R6` exist only inside `T-134`'s body**, so a
triage walking the backlog by card id will not meet them. **Recorded, not
repaired** — filing four cards is a disposition and disposition belongs
to a triage (T-083). The suggestion backlog holds at **123** and does not
move at this merge.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 15f0d7d 4b6c6b7 -> tree 21b9612c, exit 0 (read from $? FIRST)
    git diff --name-only 15f0d7d..520e93e   (THE MERGE'S DIFF)            ->   6   the only one that means anything
    git diff --name-only 15f0d7d...520e93e  (three dots AT the merge)     ->   6   collapses, as it must
    git diff --name-only 15a963d..4b6c6b7   (merge-base..tip, FORBIDDEN)  ->   6   agrees HERE and that is luck
    git diff --name-only 15f0d7d..4b6c6b7   (two dots BEFORE the merge)   ->  12   ← the T-083 trap, live again
    git diff --name-only main..HEAD         (FORBIDDEN)                   ->   0   ← read this row twice

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0.** `merge-tree
--write-tree` returned **`21b9612c`** and the merge commit's own tree is
**`21b9612c`** — the same tree, byte for byte. No conflict, no
resolution; parents are `15f0d7d` and `4b6c6b7` and nothing else.

**THE T-083 TRAP IS LIVE AND ITS MAGNITUDE MOVED AGAIN.** `4b6c6b7` is
not a descendant of `15f0d7d`, so the two-dot form returns the union of
the lane's 6 paths and the reversal of everything main gained since the
merge-base — **12 paths** here, against T-135's **28** and T-133's
**39**. **The figure is a function of how far main moved, not a
constant**, which is the second reason never to quote it. **AND THE
FORBIDDEN merge-base FORM AGREES AT 6 HERE, WHICH IS LUCK AND NOT
LICENCE**: `15a963d` happens to be an ancestor of `4b6c6b7`, so that
range is a proper ancestry range at THIS merge and will not be at the
next one.

**DISJOINTNESS PROVED AS TWO NAMED SETS, NOT BY THE EMPTINESS OF ONE.**
The other live lane is `T-111` at `09b8920`. `git diff --name-only
main...task/T-111-board-dispatchable` gives **7** paths;
this merge gives **6**; `comm -12` over the two sorted lists is
**EMPTY**. **And through the mechanism this merge lands**, `T-111 ×
T-134` → `disjoint`, `witnesses: []`, `unusable: []`. Both statements
were derived; neither was assumed.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `15f0d7d` when the range
was derived and `15f0d7d` in the same command as the merge, read beside
the two diff checks. `git diff --cached --name-only` and `git diff
--name-only` were both EMPTY there, with one `??` row; **`??` alone is
not a ceremony.**

## THREE standing gates — TWO FIRE, all derived from the merge's own 6 paths

| gate | trigger | on these 6 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **4 — FIRES** | **ASKED FIVE TIMES**: STALE → regen → **STALE AGAIN** → regen → CURRENT → CURRENT → CURRENT |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | derived, not skipped |
| DOCS GATE | a `docs/` path a code suite reads | **1 of 6, 2 of 9** | exit **1**, **THREE** suites named, all green |

- **GRAPH REGEN — the graph IS regenerated and IS committed here**, in
  the checkpoint and not the merge, with the fixture reconciliation in
  the same commit. **The second ask is the interesting one and has its
  own section above.**
- **BOOT GATE — NOT OWED, and that is a derivation.** None of the six
  paths is under `app/src-tauri/**`, `app/src/**` or a manifest, and the
  two files this checkpoint writes are `app/test/**`, which is none of
  the three. **No scratch port was bound for it and none was needed.**
- **DOCS GATE — exit 1, fires on 1 of the merge's own 6** (this card) —
  and **on `docs/architecture/graph.json` when the graph is put in the
  list by hand**, which is `T-135-s3`'s hole and is still unwritten in
  `docs/CONVENTIONS.md`. The graph's readers are
  `tools/e2e/tests/shell-frame.spec.ts` and
  `tools/e2e/tests/window-contract.spec.ts`. Invoked DIRECTLY from the
  repository root with the RANGE RULE's six paths **plus the graph and
  the two reconciled fixtures**, never through `xargs`, exit read from
  `$?` unpiped. **15 derived docs readers across 4 suites** (the
  fifteenth is this card's own `fence.test.ts`, detected by its
  `parseProject()` call), census **131 sites in 22 files**, **0
  frontmatter issues**, **6 root-anchored files all argued, 0 unlinked**,
  2 package-relative sites both resolving into `docs/`.
- **`cargo test` IS A FOURTH SUITE THE GATE STILL CANNOT NAME** —
  `T-132-s2`, unchanged. It cost nothing here (see R6 above). **THE
  `method/` HALF OF THAT GAP IS STILL WHAT HALF B WILL WALK INTO.**

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **parser: 290 / 290 across 13 files, exit 0** — after `npm run build`
  from `lib/parser/`, which was run FIRST regardless. `npx tsc --noEmit`
  exit 0. **Up 22 from the 268 this file recorded at T-135**, all of them
  `fence.test.ts`'s.
- **app: `npm run build` exit 0** · **`npm test` THREE runs, and the
  middle one is the finding**: **973/973** before the regen, **2 failed /
  971** with the regenerated graph and the old fixtures, **973/973** after
  the reconciliation. 47 files.
- **cargo: 512 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines; **16 `running N tests` headers sum to
  515 = 512 + 3 ignored**, which reconciles exactly and is not a
  three-body gap. **512 is UNCHANGED from T-135's 512** — this merge adds
  no Rust body — and the lib suite is **5.62s**, inside the healthy band.
- **E2E: 194/194, exit 0, 3.0m**, on explicit port **15831**, re-probed
  at **zero rows at 12:44:43 EEST** immediately before binding and read
  back at **zero rows at 12:47:43 EEST**. Header `Running 194 tests using
  1 worker` cross-checked against **194** `✓` bodies and 0 failures.
- **ALL FOUR WATCHED CARGO BODIES WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id_in_the_init_line…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`, and T-135's live pin
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph` `ok`
  **against the regenerated graph**.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY**: `arch cycles
  --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35`, report on **stderr**
  at **645 bytes** with stdout **0 bytes**. **`arch cycles > out.txt` on
  a red yields an EMPTY FILE**, and reading its exit through `| head`
  yields head's 0. Untouched by this merge, which changes no registry
  file.
- **`arch drift` exit 0**: findings=4, undeclared=2, unmapped=0,
  declared_only=2 — `D1:C-05->C-15`, `D1:C-10->C-14`, `D3:C-01`,
  `D3:C-11`. **Byte-unchanged in substance from T-135's checkpoint.**
- **`npm run lint:docs` exit 0** and **`npm run lint:tokens` exit 0** at
  **TOKEN 138 / CONTROL 778** — **AND BOTH LIVE IN
  `tools/e2e/package.json`**. Run from the repository root they exit
  **254** with `npm error enoent`, because **there is no root
  `package.json` at all**, and that reads exactly like a failing lint.
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF** — 776 at the lane's,
  **778** here, +2 for this card's two new files. `git ls-files` reads
  **796**.
- **`npm run typecheck` from `tools/e2e` exit 0**, **from `lib/parser`
  exit 0**, and **from `app/` exit 1 `Missing script`** — the last run
  deliberately, to re-derive the trap rather than quote it.
- **THE THREE OWED SUITES WERE RUN AGAIN AFTER EVERY DOC WRITE**, because
  the DOCS GATE fires on this checkpoint's OWN paths — **5 of 7**, naming
  `STATE`, `ROADMAP`, `ARCHITECTURE`, `graph.json` and the card, exit 1.
  Second runs: parser **290/290**, app **973/973**, e2e **194/194 in
  2.2m** on explicit port **15841**, probed at zero rows at **13:03:39
  EEST** and read back at zero rows at **13:05:52 EEST**. **Both e2e runs
  print the `range-rule DISCLOSURE` line; it is a disclosure and not a
  failure, and the second one carries `@ b3eaefe`** — the architect's
  commit — which is how a suite reports the ref it actually ran at.
- **RUN LEDGER — every run declared, including the ones that agree.**
  parser build **once**, parser suite **twice**; app build **once**,
  `npm test` **four times** (973 · 2/971 · 973 · 973); cargo **once**
  (512/0/3); `tools/e2e` **twice** (194/194 · 194/194) on ports 15831 and
  15841; DOCS GATE **three times** (the merge's paths plus the graph and
  fixtures; `--census` via `lint:docs`; then the checkpoint's own paths);
  `index --check` **FIVE asks**, `index --root ../..` **two writes**, all
  from `app/src-tauri/`; `arch` and `arch drift` **once each**; `arch
  cycles` **once**; the flip census **five times** through the merged
  `fence.ts`. **THE SUITES THIS FILE'S OWN LAST WRITE OWES ARE DECLARED
  IN THIS CHECKPOINT'S COMMIT MESSAGE**, which is where the regress
  terminates — a commit message is not a code input.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS NINETEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **4.0 GB** here, unchanged from
T-135's 4.0 GB — **this merge recompiles nothing, which is why** — and the
lib suite is **5.62s** against T-135's 5.25s. **TWENTY-SEVEN runs across
eighteen integrations and not one lands between 9.5s and 14.6s.** Read
the lib suite's own time first; it tells you which regime you are in
before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. Lanes may be building against this repository:
`lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
was declared settled at better than 400-to-1 on 15 clean-cache runs.
**T-086's lane refuted that within the hour**: 1 red in 4 full `cargo
test` runs in a FRESH lane worktree, with `docs_watch` GREEN and the lib
suite inside the healthy band. Run alone: **5 green in 5**. **THE
SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 22**.
It did NOT fire at this merge — read by NAME, `ok`. `T-086-s1` and
`T-102-s3`; fence `[app-agent]`, **FREE**.

## THE MTIME INTERMITTENT — SEVEN CONSECUTIVE GREENS ON FIXED CODE, AND STILL NOT PROOF

`T-120-s3`'s fractional-millisecond mtime signature (`token-scan.spec.ts`,
`Expected …492.7957` against `Received …493`) was fixed on main at
**`cea839e`** (T-130). The nine-run tally on code that **cannot** carry
that fix was **3 red in 9 — near one in three**. **A red before `cea839e`
is not news; a red at or after it is.** This merge ran e2e once more,
194/194, and it fired in neither that run nor the six before it — **seven
consecutive clean runs on fixed code.** That is evidence accumulating and
it is still not proof: a green was never evidence, in either direction.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE — AND THIS MERGE IS THE ONE WHERE THE TRIGGER ACTUALLY FIRED.**
`lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT. The app
resolves `@nputer/parser` through a symlink, so it compiles against
PRE-merge types and fails with e.g. `TS2339` while `vitest` transpiles
without typechecking. **One command clears it**: `npm run build` from
`lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT IS A MERGE THAT
CHANGES THE PARSER'S TYPES** — CONVENTIONS files the parser-before-app
ORDER under *fresh clone*, so a fully-installed main checkout reads as
exempt and is not. **THIS MERGE ADDS THIRTEEN EXPORTS TO BOTH BARRELS —
EIGHT TYPES, FOUR FUNCTIONS AND ONE CONST** (`FenceTokenKind`,
`FenceToken`, `Fence`, `SlugExpansion`, `FenceVerdict`, `FenceWitness`,
`FenceComparison`, `ExpandFenceOptions`; `normalizeFenceToken`,
`slugPathIndex`, `expandFence`, `compareFences`; `UNFENCEABLE_PATHS`) —
which is exactly the shape that fires it. **The figure was first written
here as "seven types and six functions" and is corrected in place rather
than left standing** (T-101's precedent), derived from
`index --check`'s own re-export symbol list rather than counted by eye.
The build was run first, in that order, and every exit was 0.

**AND THE SEPARATE UNBUILT-APP CLASS IS THE ONE THAT ARRIVES LOOKING LIKE
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns **14 failed
of 973 across six files**, every message about an absent
`app/dist/assets` rather than about the tree. **Both CONVENTIONS bullets
that state it carry a stale denominator, and the file NAMES ITS OWN
CONTRADICTION**: `:856` says *"12 of 840 across five files"*, `:1328` says
*"14 failures across 6 files … 924/924"*, `:1327` says *"SIX files since
T-013 … where the LANE PROTOCOL bullet below still says five"*, and the
suite is **973**. `git diff 15f0d7d..520e93e -- docs/CONVENTIONS.md` is
**EMPTY**, so all of it was exactly as false one commit ago: ruling
thirteen returns **FILE**, and the seat is `T-092`/`T-093`.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**: `npm run typecheck`
from `app/` exits **1** with `Missing script`. **The app's typecheck is
the TWO `tsc` calls inside `npm run build`** — `tsc && tsc -p
tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap.

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT

**`T-132-s6`, unchanged.** `resolveLanePort()`'s default **14520** is a
CONSTANT shared by every checkout on the machine, so rule 4's
checkout-granular partition does not reach it. **The remedy in practice:
pass an explicit port and re-probe immediately before binding** — this
integration used `NPUTER_E2E_PORT=15831`, `lsof`-read at **zero rows at
12:44:43 EEST** and again at **zero rows at 12:47:43 EEST** afterwards.
**No collision, and a probe reserves nothing — the runner's own bind is
what proves the port was free.** `resolveLanePort()` THROWS on 1420 by
construction, which is a defence in the tree rather than a habit in a
session. **AND ANOTHER LANE WAS LIVE THROUGHOUT THIS INTEGRATION**, with
four of its own checkouts, so this was not a precaution against a
hypothetical.

## `T-133-s5` — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green at 33, because the shell renders the
project path and the chrome wraps. **The threshold is bracketed between
116 and 128 characters** — at 116 it measures 252 px against a 250 px
floor at 800×600, TWO PIXELS of margin. **Cut drill and scratch worktrees
at SHORT roots.** This integrator cut none, so nothing here re-measures
it.

## The board, derived from disk at this checkpoint

**300 flat task files — 99 done / 35 planned / 41 parked / 123 suggested /
0 verifying / 2 building; 27 in `rejected/`.**
99 + 35 + 41 + 123 + 0 + 2 = 300. **`done` MOVES to 99**, its first move
in two merges, and **T-134 is the only card this merge stamps.** The two
`building` are `T-111` (a live lane, in verification) and `T-135` (no
lane, open on purpose — see the second section). **`verifying` is 0.**

**THE FLAT COUNT IS UP THREE FROM T-135's 297 AND NOT ONE OF THE THREE IS
THIS MERGE'S**: `T-111-s4` and `T-137` landed on main before it and
`T-138` landed during this checkpoint, while `T-136` never counted flat
because it was created directly in `rejected/`, which goes 26 → 27.
**This merge adds no task file at all.** **It read 299 when this section
was first written and 300 by the time it was committed** — derive it at
your own ref and stamp the reading, because on this project that
paragraph went stale inside forty minutes.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWENTY-THREE AND WANTS AN
ELEVENTH TRIAGE.** It does not move at this merge: T-134 files **zero**
suggestion cards and routes R1–R6 inside its own body instead — see the
note under *Just completed*, which is the reason a triage should read
`T-134`'s card and not only the backlog.

## Provenance — SELF-DECLARED, never read off a trailer

**99 done cards — 74 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 74 + 19 + 5 + 1 = 99. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented**, and this merge adds the 74th
`same-model`: T-134 was built by `claude-opus-5`, verified by a different
`claude-opus-5` session, and integrated by a third. **`same-model` is not
a weaker verdict than `independent`** (TASK-FORMAT's own paragraph); it
records WHICH HAND HELD THE PEN, and the one value naming a MISSING
guarantee is `self-verified`.

## Documents ticked

- **STATE — rewritten, as a snapshot.** `T-133-s2`'s edit (dropping the
  four sections `brief.mjs --state` can answer) was **NOT performed**:
  `docs/STATE.md` is free, but that edit is a card of its own and taking
  it inside a checkpoint would bundle a routed change with a merge.
- **The card** is stamped **`done`** with `verifier:`, `built_by:`,
  `verified_by:` and `review: same-model` filled, and gains an
  `## Integration` section. **The lane's own text, the planning notes,
  the verdict and both addenda are preserved byte-untouched.**
- **ROADMAP — TICKED on the census line, and THIS TIME IT MOVES TWICE.**
  The milestone-4 census re-derives on disk at **98** cards — F-01 **10**,
  F-02 43, F-03 12, F-04 **8**, F-06 25 — up two from the 96 that held for
  five checkpoints. **BOTH movers are outside this merge's range**:
  `T-137`, rewritten at `15f0d7d` before the merge, and `T-138`, filed at
  `b3eaefe` during this checkpoint. **SEVENTH CONSECUTIVE MERGE WHERE THE
  F-04 PROGRESS LINE DOES NOT MOVE**, and the sixth distinct reason is
  the sharpest: the census moved, twice, and neither movement is this
  merge's. A census re-derived on disk answers *what is true now*, never
  *what did this merge do* — and this one was 97 mid-checkpoint and 98 at
  the commit.
- **ARCHITECTURE — UPDATED, and rule 3's *"if any interface moved"*
  answers YES.** C-06's row gains the fence — the module, its four
  functions, the declared ceiling, the three-valued verdict, the
  `touch_slugs:` source and the no-table pin, the rule that landed in
  `lane-protocol.md` rule 5, the 25-flip measurement with its direction
  property, the live near-miss, the routed duplicate with its
  305-versus-305 agreement, and the NUL only a lint could see — and its
  file count 25 → **27**. C-07's row gains the byte-budget entry:
  **970 961 bytes — 97.10%, 29 039 bytes of headroom**, spending
  **15 251**, the largest in the series and **the first whose files are
  not C-07's**.
- **CONVENTIONS — NOT TOUCHED.** Its two stale unbuilt-app denominators
  are FILED and not repaired (section above), and `arch blast` still
  joins `arch cycles` in the queue at `T-127-s5`.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. **The rule this card makes IS the ADR-shaped
  decision, and it landed in `method/lane-protocol.md` rule 5, which is
  the file that owns the fence** — @human adopted it on 2026-08-25 as
  item 4 of `T-131`'s five process changes, so the decision was already
  taken and this card is its mechanism. **ADR-018 IS STILL OWED AND IS
  STILL HALF B's.**
- **`graph.json` REGENERATED and COMMITTED HERE**, in the checkpoint and
  not the merge, with the fixture reconciliation in the same commit.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT A
SECOND TIME.** **ZERO of this merge's six paths are under `app/**` at
all**; four are `lib/parser/**`, one is `method/`, one is `docs/tasks/`.
This checkpoint additionally writes two files under `app/test/**`, which
vite does not serve. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE
ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), so it was
answered from the build order instead: **this integration DID rebuild
`lib/parser/dist` and DID write `app/dist`, and both land in
`/Users/ujju/Projects/nputer`.** The vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd — **@human's own
checkout, nine merges behind** — and `app/node_modules/@nputer/parser`
there is a **RELATIVE** symlink (`../../../lib/parser`, re-read at this
ref rather than quoted), so it resolves inside that checkout with its own
`lib/parser/dist`. **The running product reads none of what this
integration wrote.** **THIS IS THE MERGE WHERE THAT MATTERED MOST SO
FAR**: it is the first in this series whose parser diff adds public
exports, so a shared `dist` would have changed the running product
without the diff naming one of its files.

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a
fact of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this checkpoint's regenerated `graph.json`
and the stamped `T-134` card reached the running board through the
watcher**, and the map pane would re-render with a 183-file hint. That is
an INTERRUPTION channel (a re-render), never a breakage one, and no
integrator can read which folder is open without touching the app.

**Port 1420 was read with `lsof -nP -iTCP:1420` and nothing else** — no
bind, no connect, no signal. Holder `node` pid **46532**, `TCP
[::1]:1420 (LISTEN)` plus one ESTABLISHED pair with a `com.apple` client
pid 46660, read at **12:38:33 EEST** (before any command that writes) and
again at **12:54:27 EEST** after the suites, the gates and the doc
writes. **Both readings identical, same pid.** The anchored process read
— `ps -o pid,lstart,command -p 46532` — reports `node
/Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started
**Wed Aug 26 11:04:22 2026**, and `lsof -a -p 46532 -d cwd` reports cwd
`/Users/ujju/Projects/nputer-app/app`. **THE PID IN THIS FILE'S PREVIOUS
REVISION (88948, started Aug 25 10:54) IS DEAD AND ITS SUCCESSOR IS A
DIFFERENT PROCESS** — a pid, a port holder and a start time are
live-environment facts, not functions of a tree, **and this is the first
checkpoint in the series where the previous revision's pid was actually
wrong rather than merely stale-in-principle.** All three are already
stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: `app/node_modules`, `lib/parser/node_modules`,
`tools/e2e/node_modules`, both `dist/` directories and `target/` were
checked and all six were present, so **no fresh dependency install was
owed and no `npm ci` was run**. **There is no root `node_modules` and
there is no root `package.json`** — see the lint bullet above. **The
repair is still item 12 below, unwritten after SEVENTEEN consecutive
merges performed it by hand.**

**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-ninth** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting. No `git add -A` — every write used `git commit -- <paths>`
with the paths listed explicitly.** Be precise rather than claiming more
than is true: this integration's `cargo test` run and its **six**
`nputer-index` invocations all WROTE to main's `app/src-tauri/target/`,
which reads **4.0 GB**, as any cargo run must. **The ONLY sibling
worktree modified was T-134's own, and only by removing it** — every
other was read with `git -C … rev-parse` and `git -C … status
--porcelain` and `lsof` only. **All scratch work for this integration
lives outside the repository**, at a session scratch root, and **no
worktree was cut at all.**

## THE LANE WORKTREE IS REMOVED AND THE BRANCH IS KEPT

`/Users/ujju/Projects/nputer-T-134` was removed after the merge and after
this checkpoint (rule 6). **It carried NOTHING**: `git status
--porcelain` was **empty** and its `docs/architecture/graph.json` was at
the committed `b742efbe…`, because the lane deliberately restored both of
its regenerations and committed no graph. **Nothing was discarded with
it, and that is a stronger statement than the previous checkpoint could
make** — T-135's worktree carried one modified file. Rule 6's own reason
is discharged: the worktree survives until a VERDICT exists so the
measured copy is reproducible, and the verdict is at `4f40ccd` with
everything it measured now in main's history. **`git worktree prune` ran
behind it. The branch is kept.**

**LEAVING IT WOULD HAVE BEEN THE WORSE ERROR, AND THIS CARD IS WHY.** A
worktree on a `task/` branch IS a lane by this project's own derivation
(rule 7), so leaving it would make every future session derive a LIVE
lane holding `lib/parser` and `method/lane-protocol.md` — **and, under
the mechanism this very merge lands, that phantom lane would correctly
compute as OVERLAPPING with `T-105`, `T-128`, `T-131` and `T-137`,
blocking all four for no reason at all.** A false lane is worse than a
missing one, and it is now worse by more than it used to be.

## In progress / broken right now

**NOTHING IS BROKEN. THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED. THE ONE
`building` CARD WITHOUT A LANE IS OPEN ON PURPOSE.**

**ONE LANE HOLDS A FENCE: `T-111`, `[app-board, app-shell]`, in
verification.** Read `git worktree list` — or run `brief.mjs --state`,
which stamps the reading with a clock — rather than any table here.
**Everything outside `app/` is free.**

## Next up

1. **`T-131`, `T-105` OR `T-128` — RELEASED BY THIS MERGE, AND EXACTLY
   ONE OF THE THREE, AND NOT BESIDE `T-138`.** All three read
   `overlapping` against each other on `docs/CONVENTIONS.md` and
   `method/`, visibly, on tokens. **All three are `disjoint` from
   `T-111`**, derived. **AND ALL THREE OVERLAP `T-135` INVISIBLY** on
   `method/tasks/TASK-FORMAT.md` — harmless today because T-135 holds no
   lane, and a real collision the moment Half B is cut. **AND ALL THREE
   NOW OVERLAP `T-138` INVISIBLY** on `method/roles/executor.md` and
   `method/roles/orchestrator.md`. **Sequence them; four cards contend
   for `method/` and only one may hold it.**
2. **`T-138` IS UNBLOCKED BY THIS MERGE AND IS THE MECHANISM'S FIRST
   CONSUMER.** `blocked_by: [T-134]`, now discharged. Its `touches:
   [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]`
   is a fence **no previous vocabulary could express** — `CLAUDE.md` is
   in no component, no graph and no other card. **`disjoint` from
   `T-111`**, overlapping the three above. Its subject is that the
   read-first set has three spellings and its designated authority omits
   the product document.
3. **`T-137` IS ALSO RELEASED AND IT IS R1's VEHICLE.** `touches:
   [lib-parser, app-map, tools/e2e]`, `disjoint` from `T-111` **and from
   `T-138`**. It is the card that retires the SECOND implementation of
   the expansion this merge lands — the one that agrees on all 703 live
   pairs today and diverges in seven named ways. **Somebody is already
   working it**: `/Users/ujju/Projects/arch-verify` carries a modified
   `docs/tasks/T-137-…md` that is not on main.
4. **HALF B OF `T-135`, AND ITS THREE PRECONDITIONS.** (a) **@human's
   look at §6 and §7**; §6's own measurement is the argument against
   binding now — the rule is a **constant function** on the live board,
   because **0 of 230 `touches:` entries has ever named a code path
   inside the walk**. (b) **The architect widens the fence to include
   `docs/decisions/`**; a lane cannot do it (§11). (c) **The TS half of
   §7's floor rule**: `arch blast` prints a bare `dependents=0` for
   `app/src/main.tsx`, `app/vite.config.ts` and `app/vitest.config.ts`,
   indistinguishable from genuinely unimported files, and **§7's floor
   rule cannot bind until that is closed or disclosed in the output.**
5. **`docs/CONVENTIONS.md` IS FREE AND ELEVEN EDITS ARE QUEUED AT ITS
   SEAT** — `T-104-s5` carries the argument. **THE COMMAND LIST — three
   edits**: `T-127-s5` (`arch cycles` and `arch blast`) and `T-133-s1`
   (`brief.mjs`). **THE RANGE RULE BULLET — three edits, to `T-093`**,
   plus **this merge's sixth candidate**: the pre-merge two-dot form gave
   **12** here against T-135's 28 and T-133's 39, and **the FORBIDDEN
   merge-base form agreed at 6 — which is the more dangerous datum,
   because a form that agrees once teaches the wrong lesson.** **THE
   POISON DRILL BULLET — four edits, to `T-092`.** **AND THE TWO STALE
   UNBUILT-APP DENOMINATORS** (840 at `:856`, 924 at `:1328`, against 973
   on disk).
6. **`T-135-s3`'s GENERAL FINDING IS UNFIXED AND IT IS CHEAP.** A
   sentence in the GRAPH REGEN bullet naming the DOCS GATE as owed on the
   checkpoint's OWN graph commit. **This checkpoint did it by hand for
   the second time and it worked again** — the gate named
   `shell-frame.spec.ts` and `window-contract.spec.ts` as `graph.json`
   readers. Same seat as item 5.
7. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
   returns **zero rows**, re-checked at this ref, for the eighth
   checkpoint running. **`method/` is free**, so this is takeable — and
   it now has four cases in the record, this merge's being the cleanest
   (forecast tree `21b9612c`, merge tree `21b9612c`, identical).
8. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
   EXIST.** Unchanged. Its option (1) — write the rule in
   `lane-protocol.md` rule 4 — is preferred, **and rule 5 has just been
   edited, so the file is warm.** Fence free.
9. **`T-126-s3` — FIVE WRITTEN STATEMENTS ABOUT C-15 ARE STILL FALSE ON
   MAIN**, and `arch drift` still reports `D1:C-05->C-15` as the FIRST of
   two D1s and the first of four findings, where item 4 calls it the
   *"fifth D1"*. **Nothing reds.** The `C-05 -> C-15` declaration is the
   one-line registry fix this checkpoint again deliberately did not make:
   it was exactly as false at this merge's parent. Fence `[app-dispatch,
   docs/architecture/components/]`, both FREE.
10. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
   PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the
   `app/test/**` fixtures) and `lib-parser`. **`app-shell` IS HELD BY
   `T-111`'s LANE** — the first item in this list that is genuinely
   blocked rather than merely queued.
11. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING, AND
   THIS MERGE MAKES THAT ARGUMENT MEASURABLE.** A word for C-10 frees 2
   of 8 fences outright. **`T-127-s4` is its warning label**: a
   `touch_slugs:` edit is invisible to every suite in this repository —
   **and this merge widens that surface again**, because `fence.ts` now
   READS `touch_slugs:` as the authoritative map, so a malformed one
   changes what every future dispatch computes. **R5 is the bigger
   version of the same question**: `app-shell × app-board` at C-11 is
   **19 of the 22 remaining flips**, twenty cards' worth of honest
   overlap, and either C-11 gets its own fence word or the board accepts
   that those two never dispatch concurrently. Fence
   `[docs/architecture/components/]`, FREE.
12. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — SEVENTEENTH
    CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
    DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
    `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
    — `lsof -a -p <pid> -d cwd` for the holder's cwd, compared against the
    checkout you are installing into** — and this integration is a worked
    example again. Fence `[docs/CONVENTIONS.md]`, **FREE**.
13. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64 — a false
    sentence, never a false verdict; (b) the live positive control is
    brittle to a shared closing hop. Fence `[crate-index]`, **FREE.**
14. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, **FREE**.
15. **`T-108-s3` IS NOW HALF-ANSWERED AND THE REST IS STILL OPEN.**
    Question 1 — is a write to the card's own file a fence question — is
    **RESOLVED by this merge**: the file is outside every fence. **The
    SECOND conflict on `executor.md` step 5, the one that file's own
    closing bullet records (the verifier reads the file this role writes
    into), is untouched.** **`T-135-s4` BELONGS BESIDE IT**: the same
    file's step 6, and the two are one seat's worth of work on how a
    fence and a status behave when a card is only half-dispatched.
    `roles/` and `tasks/TASK-FORMAT.md` are both free.
16. **`T-135-s1` and `T-135-s2` — THE TWO GRAPH CARDS.** s1: a
    cross-package FILE-level blast radius is not computable from today's
    graph. s2: a distinct `mod` edge kind needs `GRAPH_EDGE_KINDS` widened
    in `app-map` first. Both untriaged.
17. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, threshold bracketed 116–128 characters, two-pixel margin at
    800×600. The fix is in `app/src` (`app-shell`) — **held by `T-111`.**
18. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-22.** Two findings, one body, `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence. **AND THE FOURTH INTERMITTENT** —
    `T-120-s3`'s mtime signature, now seven consecutive greens on fixed
    code — is `[tools/e2e]`, **FREE**.
19. **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class; `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, **held by `T-111`**). **`T-129-s2`**,
    **`T-129-s3`**, **`T-129-s5`** are `crate-index`, **FREE**.
20. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**. Measured: **exit 0 as `.rs`, exit 134 as
    `.ts`**, and TS `namespace` chains abort at **2 000** against Rust's
    tightest **3 000**, so **TypeScript is the MORE exposed language.**
21. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals;
    the C-09 → C-08 direction has THREE closing edges and the card names
    two.
22. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
23. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWENTY-THREE AND WANTS AN
    ELEVENTH TRIAGE**, and it should read `T-134`'s card body beside it:
    **four of that card's six routed findings exist nowhere else.**
    `T-130-s1`'s OWN ROUTING LINE IS STILL STALE — it says
    `docs/CONVENTIONS.md` is *"held by T-104"*; `T-104` is `done` and the
    seat is `T-092`.
24. **THE BOARD-TRUTH RULING** — TWENTY-FIRST ask. **A PATTERN COUNT IN
    THE FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column
    still closes at the first push, and `git remote` still returns zero
    remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief in this thread has contained at
least one error, and saying so is the most valuable thing a checkpoint
returns.** This brief's central instruction was again a reading list —
`git show 4f40ccd`, then `git show 4b6c6b7`, then the lane's notes commit,
because *a summarised finding loses the findings inside it* — **and that
instruction is again the reason this checkpoint has anything worth
reading in it.** Sorted into the four categories the brief asked for.

1. **FACTS — EVERY LOAD-BEARING ONE HELD, AND ONE WAS INCOMPLETE IN THE
   ONE PLACE THAT COST WORK.** *"Fixtures owed: the `181` in
   `architecture-dogfood.test.ts` and `"committed graph · 181 files"` in
   `map-dogfood-render.test.tsx`; `smoke.test.ts` does not move."*
   **Both named sites are real and `smoke.test.ts` genuinely does not
   move — and the list is one assertion short.** `["C-06", 25]` → 27 sits
   in the SAME body, below the size check, and is invisible until that
   one is fixed. **The brief inherited the omission from the verdict,
   which names the same two sites and adds *"C-06 25 → 27 is the only
   component that moves"* in a different paragraph without connecting the
   two.** Both halves were on the page; nothing joined them. Everything
   else confirmed: the tip is the VERDICT ADDENDUM commit; GRAPH REGEN
   `970961 · 183 · 2064 · 1986`; 97.10% / 29 039 / 15 251; `arch`
   `files=181 → 183` with everything else unchanged; the identical-figures
   trap at `09151e14` vs `ee554cea`, both 970 961 bytes — **`ee554cea`
   reproduced here byte for byte**; `arch cycles` exit 1 with stdout
   empty; `lint:*` in `tools/e2e/package.json`; `npm run typecheck` from
   `app/` absent; ports machine-wide; and the three released cards, each
   with its witness.
2. **PREDICTIONS — ONE WAS UNDERSTATED IN THE SAME DIRECTION IT WARNED
   ABOUT.** *"Byte budget 97.10%, spending 15 251 — larger than T-135
   Half A's 11 120, which its own checkpoint called the largest single
   spend in the series."* True, and the interesting half is what it does
   NOT say: **29 039 bytes of headroom is roughly two more merges of this
   size**, which is the first time this series has been within sight of
   the ceiling. That belongs beside the percentage, not behind it.
3. **ARGUMENTS — THE CENTRAL ONE IS RIGHT AND ITS SCOPE WAS TOO NARROW.**
   *"Three planned cards hold `[method/, …]` … after this merge they are
   genuinely free, and before it they were not."* **Confirmed, with
   witnesses, through the merged module.** But *free* is not the whole
   truth in two ways the brief does not reach: **(a)** the three are not
   free of EACH OTHER — they collide visibly, so at most one is
   dispatchable; and **(b)** all three still collide INVISIBLY with
   `T-135` on `method/tasks/TASK-FORMAT.md`, harmless only because T-135
   holds no lane. **The brief's own warning, applied one file over,
   answers itself.**
4. **STALENESS — TWO, AND THE FIRST IS THE ONE THE BRIEF PREDICTED.**
   *"Port 1420's holder pid has changed since STATE recorded it — read
   it, do not match a remembered number."* **Correct, and stronger than
   stated**: the recorded holder (pid 88948, started Aug 25 10:54) is not
   merely stale, it is a DIFFERENT PROCESS — the live holder is pid
   **46532**, started **Wed Aug 26 11:04:22 2026**. **Second:** *"One
   other lane is live (`T-111`, in verification)"* was true and became an
   understatement inside fifteen minutes — that lane now has **four**
   detached drill checkouts, one of which (`/private/tmp/t111m`) did not
   exist when this integration began, and **`arch-verify` moved onto this
   merge commit while this file was being written.** None of them is a
   lane; all of them would be, to a session that matched on directory
   names instead of on `refs/heads/task/`.
