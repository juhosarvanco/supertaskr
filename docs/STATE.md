# State

Updated: 2026-08-25 by the T-127 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN,
AND ONE COMMAND ON MAIN EXITS 1 ON PURPOSE.** This merge is **494 / 973 /
268 / 171 green**, and it lands the gate that turns @human's "no cycles"
ruling from a suggestion with a strong voice into something a machine
enforces. **`cargo run -p nputer-index -- arch cycles --root ../..` is
exit 1 on main right now and that is the DESIGNED state** — the one
declared cycle `C-08 -> C-09 -> C-08` survives because removing it needs
paths this lane's fence could not reach, and the removal is routed with
its measurement. **The ENFORCING copy is `cargo test`, which is green**,
because `tests/arch.rs` pins the census against an EXACT SET holding
exactly that cycle. Read the next section before you read the gate's
output as breakage. Four other things will meet you before any real
defect does: **the app suite cannot BUILD on a merged main until you
rebuild `lib/parser`**, **`npm run typecheck` from `app/` DOES NOT
EXIST**, **three known intermittents**, and **the checkout's test runner
and the checkout's EDITOR are shared surfaces**. **Derive the lane list
before you cut anything — there are THREE lanes and one of them is this
card's, now closing.**

**WHAT IS NEWLY FREE**: **`crate-index`** and
**`docs/architecture/components/`**. That unblocks **`T-126-s3`** (four
written statements about C-15 are false on main, and it has been waiting
on this lane), **`T-125`**'s third slug, **`T-129-s2`**, **`T-129-s3`**
and **`T-129-s5`**, and **`T-032`** / **`T-059`**. **HELD:
`method/lane-protocol.md`, `method/roles/integrator.md` and
`method/tasks/TASK-FORMAT.md` by `T-132`; `tools/e2e` by `T-133`.**

## THE FINDING THIS CHECKPOINT EXISTS TO CARRY — WHAT THE GATE'S GREEN MEANS, AND THE CYCLE NEITHER SIDE CAN SEE

**SAY IT HERE BECAUSE A READER WILL OVER-READ THE GREEN, AND BECAUSE THE
DISCLOSURE THAT PREVENTS IT WAS PROVEN BY CONSTRUCTION RATHER THAN
ARGUED.**

`nputer-index arch cycles` reads the **REGISTRY ONLY** — no graph, no
index — so **a stale graph cannot falsely redden it**, and `index --check`
stays the one staleness gate. Its verdict is about **declared
`depends_on:` and nothing else.** Every run, **green included**, prints
three `note` lines saying so, and they go to **stdout** on the green path
(529 bytes to **stderr** with stdout **empty** on the red one, the same
split `index --check` uses).

**THE VERIFIER PROVED THAT DISCLOSURE IS LOAD-BEARING RATHER THAN
DECORATION, by building the cycle the gate cannot see** — a real Rust
crate with a `use`-based control in the same tree:

| pair | how the dependency is written | edges emitted | `arch drift --fail-on any` | `arch cycles` |
|---|---|---|---|---|
| the CONTROL | `use crate::q::…` | **2 `import`** | **2 × D1**, both named | ACYCLIC |
| the INVISIBLE pair | `crate::b::pong()` path expression | **ZERO** | **nothing** | ACYCLIC |

**The invisible pair is a genuine mutual compile-time dependency**: it
compiles clean, and breaking one side yields `error[E0425]: cannot find
function … in module crate::a`. **SO A CYCLE MADE OF RUST `mod`/PATH
DEPENDENCIES IS INVISIBLE TO BOTH SIDES AT ONCE** — this is `T-126-s4`
generalised from an edge count to a whole class. And note the sharper
form: even the VISIBLE undeclared cycle is reported by no command *as a
cycle* — `arch drift` calls it two D1s and `arch cycles` is green because
nothing is declared.

**THIS BEARS DIRECTLY ON `T-135`**, which would key ceremony to exactly
this graph. A ceremony tier derived from observed edges is derived from a
graph that cannot see a whole class of Rust dependency. **Read this
paragraph before that card is planned.**

## THE CENSUS IS 1 BEFORE AND 1 AFTER, AND THE REASON IS THE FENCE, NOT THE GATE

**DO NOT READ THE UNCHANGED CENSUS AS THE GATE FAILING TO SEE
SOMETHING.** Criterion 3 — *"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF
SHALL BE GONE"* — is **NOT BUILT**, and the disclosure is MEASURED rather
than asserted. The smallest acyclic re-partition of C-08/C-09's `paths:`
takes the app suite to **6 failed / 967 passed of 973**, because the
fixtures it invalidates live in `app/test/**` — C-05's `app-shell`,
outside `[crate-index, docs/architecture/components/]`. Applied in-lane,
read back with `git diff`, run, reverted, **sha256-proved per path**, and
**reproduced verbatim by the verifier** down to the failing message
(`expected [ 'C-10', 'C-12' ] to deeply equal [ 'C-10' ]`).

**Widening a fence from inside the lane it fences is the one repair the
executor role may never make**, so the gate ships and the move is routed
as **`T-127-s1`** with a recommended four-node partition and the reason a
smaller one is wrong. **This is `T-101`'s precedent: a disclosed defect
above a widened fence.** The census did not move because a fence forbade
the move — **not** because the gate could not see it.

## THE RULING THIS CHECKPOINT MADE, AND WHY IT WENT THE WAY IT DID

**T-127's own card, section ONE, is wrong in the specifics, and the
integrator did NOT rewrite it.** Re-derived here from the import lines
and the registry globs rather than taken from either hand:

- **None of the four alternation hops matches a real edge in the
  direction drawn.** `board-model.ts` imports only `@nputer/parser/pure`
  and `./verdicts`; `task-detail.ts` imports only the parser and
  `./board-model`; `TaskCard.tsx` does not import `TaskDetailPanel.tsx`;
  `TaskDetailPanel.tsx` imports neither `FeatureColumn.tsx` nor
  `Board.tsx`. **Four hops, four reversals** — worse than the lane's
  correction, which named one.
- **The card names two closing edges and the C-09 → C-08 direction has
  THREE**: the class constants, `badges/ReviewBadge.tsx` (unnamed, and
  `badges/**` is C-08's), and `task-detail.ts -> board-model.ts`. `arch`
  agrees at this merge: **`C-08 -> C-09 observed=6`**, **`C-09 -> C-08
  observed=3`**. **A fix severing only the class constants would leave
  the component cycle standing.**
- **The card's "TWO cycles" went STALE rather than miscounting** — TRUE
  at `b505fca`, which the card's own table names as main, until T-033
  dropped `C-12 -> C-05`.

**THE RULING: FILE, DO NOT REPAIR.** The analysis predates this merge by
the whole life of the card, so under *repair what the merge INTRODUCES,
file what the merge merely REVEALS* it is filed. **Two further reasons
make this stronger than that ruling alone, and they matter because the
ruling is STILL NOT CITABLE** — `git grep` over `method/` and
`docs/CONVENTIONS.md` returns **zero rows** at this ref, for the second
checkpoint running; it is written and unmerged in `T-132`'s lane.

1. **`T-108`'s OWN PRECEDENT POINTS THE SAME WAY AND IS THE SHARPER
   ARGUMENT.** This project's established remedy for a wrong claim in a
   landed card is a **card**, fenced on the specific card paths and
   dispatched by the architect — that is what `T-108` WAS. Its fence
   ruling says in as many words that a card's own file is exempt from its
   fence **for PROTOCOL WRITES**: `status`, `builder`, `built_by`,
   `verified_by`, `review`. **An integrator's closing stamp is a protocol
   write; rewriting a card's technical analysis is a LANE write**, and
   this integrator holds no lane.
2. **THE CORRECTION IS ALREADY IN THAT FILE, THREE TIMES OVER** — the
   lane's own "Where the card and the brief were wrong" items 2–4, the
   verdict's "THE CARD'S CLOSING EDGES" section, and this checkpoint's
   `## Integration` section, all in the same card at this merge.

**THE RESIDUAL IS STATED RATHER THAN ARGUED AWAY**: a reader who stops at
section ONE of a 1 288-line card meets the error and not the three
corrections. **The correction is therefore written into the CARD in
permanent form, not only here** — this file is a snapshot and will be
rewritten at the next merge. **The gap has NO OWNER**: no suggestion
covers it (`T-127-s3` carries only the DAG claim), and filing one is a
triage's call and not an integrator's (T-083). **Recorded rather than
tidied.**

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** Immediately after T-033 landed, a second session ran `npm test`
from `app/` and saw **nine failures**, reported as the ordinary
pre-checkpoint state of a merge that declares a new component. **That
diagnosis was wrong**, and the real cause is one every future integrator
will meet:

    $ npm run build          # from app/
    src/lib/architecture/derive.ts(530,36): error TS2339:
      Property 'nonCode' does not exist on type 'ComponentRecord'.
    exit 2

**`lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT.** The app
resolves `@nputer/parser` through a symlink to `lib/parser`, so it
compiles against the PRE-merge types; `vitest` transpiles without
typechecking, so the suite still RUNS and the dogfood fixtures red in a
way that looks exactly like an un-reconciled fixture. **One command clears
it**: `npm run build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH
TREE, IT IS A MERGE THAT CHANGES THE PARSER'S TYPES** — CONVENTIONS files
the parser-before-app ORDER under *fresh clone*, so a fully-installed main
checkout reads as exempt and is not. **This merge's parser diff is EMPTY**
— its five code files are all Rust under `crates/nputer-index/` — so the
trap did not fire here; the build was run first anyway, in that order,
and every exit was 0. **Do not read a green build as evidence the trap is
gone.**

**AND T-116's VERIFIER FOUND A SECOND, EARLIER LINK IN THE SAME CHAIN**:
in a FRESH WORKTREE `npm run build` from `app/` exits **2** with
`Cannot find module '@nputer/parser/pure'` until `lib/parser` is both
INSTALLED and BUILT. `T-117` documents the `app/dist` prerequisite; this
is the step before it, and neither is in CONVENTIONS.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**: `app/package.json`'s
scripts are exactly `dev`, `build`, `preview`, `test`, `tauri` — there is
no `typecheck`. `npm run typecheck` from `app/` exits **1** with `Missing
script`, which a hurried reader takes for a compile failure. **The app's
typecheck is the TWO `tsc` calls inside `npm run build`** —
`tsc && tsc -p tsconfig.test.json && vite build` — and the second one is
load-bearing rather than tidy: without it nothing in the repository
typechecks any of the app's test files (T-073). `lib/parser` and
`tools/e2e` DO have a `typecheck` script; `app/` is the exception, and
that asymmetry is the whole trap.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS FIFTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory.**

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds. **A tally that mixes checkouts is not a flake rate.**

### THE CLOCK TEST STILL SEPARATES GREEN FROM RED, AND MAIN IS STILL IN THE GREEN BAND

T-124 found the lib suite's own `test result:` time sorts its runs
perfectly — every green under 9.5s, every red over 14.6s, **a gap of more
than five seconds with nothing in it**. `du -sh app/src-tauri/target`
reads **3.6 GB** here, up from T-130's 3.5 GB — this merge compiles a new
module and a new integration target — and the lib suite is **5.47s**,
against T-130's 4.89s on the same tree. **TWENTY-THREE runs across
fourteen integrations and not one lands between 9.5s and 14.6s.** The
watcher body was read by NAME as `ok` rather than inferred from a green
exit. Read the lib suite's own time first; it tells you which regime you
are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that lanes may be building
against this repository — there are TWO right now: `lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
had been declared settled at better than 400-to-1 on 15 clean-cache runs
that saw it zero times. **T-086's lane refuted that within the hour**: it
redded **1 in 4** full `cargo test` runs in a FRESH lane worktree — with
the `docs_watch` body GREEN and the lib suite inside the healthy band — so
the cache cliff cannot be what crossed its deadline. Run alone the body is
**5 green in 5**.

**THE SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 20**.
**Live, load-sensitive, ~1-in-20 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge — read by NAME,
`ok` — which is one more data point and not a reprieve. Read it beside
**`T-102-s3`**. Its fence `[app-agent]` is **FREE**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE TWENTIETH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-132** | `[method/lane-protocol.md, method/roles/integrator.md, method/tasks/TASK-FORMAT.md]` | **building** |
| **T-133** | `[tools/e2e]` | **building** |

**T-127's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so TWO lanes hold
fences after it — **down from three**. **DERIVE THE MEMBERSHIP BY
FILTERING ON THE BRANCH; DO NOT QUOTE THIS TABLE.** The one command that
answers it:
`git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`.
**THIS EDITION CARRIES NO ROW COUNT FOR THE WHOLE LIST**, on T-130's
policy, and this pass is the second confirmation: a
`/Users/ujju/Projects/nputer-T-132-verify2` checkout was present when
this integration derived its lanes and was **GONE** by the time the
checkpoint was written, while `T-132`'s own lane advanced under it.
**What does NOT move on that timescale is the LANE membership** — the
three-lane set (T-127, T-132, T-133) was identical at every reading
across this whole integration.

### **THE BOARD-TRUTH WINDOW T-130's CHECKPOINT LEFT OPEN HAS CLOSED**

**`T-132` read `status: planned` on the board while holding a lane; it
now reads `building`**, and `T-133` reads `building` too. So both live
lanes agree with the board at this ref. **That is a fact about tonight
and not a property that has been fixed** — the ordering
`method/lane-protocol.md`'s last section governs is still unmerged in
`T-132`'s own lane. **Read the branch, never the card, for what a lane is
doing.**

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: `212543c` at the start and `212543c` at the end, so it
  is now **five merges and five checkpoints** behind main, and updating
  it is @human's one command to run when they choose. Confirmed live
  rather than quoted: `lsof -a -p 88948 -d cwd` reports its cwd as
  `/Users/ujju/Projects/nputer-app/app`.
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS
  INTEGRATOR'S.** It read **`5036958`** throughout, which is behind this
  merge's own main-before. On no `task/` branch and named after no card,
  so **not a lane**; read with `git -C … rev-parse` and nothing else, and
  left alone.
- **A `T-133` POISON DRILL checkout is live under the session scratch
  root**, correctly OUTSIDE the repository (lane-protocol rule 3),
  detached at `9ddca48`. Not a lane, not counted, not touched.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free:
**`crate-index`**, **`docs/architecture/components/`**,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`, `app-shell`,
`app-dispatch`, `app-interview`, `lib-parser`, `.github/`,
`method/README.md`, `method/roles/executor.md`,
`method/roles/verifier.md`, `method/interview/`, and every `docs/tasks/`
card path. **HELD: three `method/` FILES by T-132; `tools/e2e` by
T-133** — note that `method/` is held at FILE granularity, so
`executor.md` and `verifier.md` are reachable and `lane-protocol.md`,
`integrator.md` and `TASK-FORMAT.md` are not, which is why **`T-135`
(`[crate-index, method/]`) and `T-091-s4` still wait** even though
`crate-index` just came free.

## Just completed

**T-127 — a declared registry cycle is now one command away, and the gate
says on every run what it cannot see.** F-06, milestone 4, **size M**,
`touches: [crate-index, docs/architecture/components/]`. Main-before
**`e7db842`**, lane tip **`33cc8de`** (derived with `git rev-parse`),
merge **`ad3ac8a`**, this checkpoint its direct child.
`builder: claude-opus-5`, `verifier: claude-opus-5 @T-127-verify`,
`built_by: claude-opus-5 @T-127 — code d0494fc, 1b51d61, 6839450; notes
e7d597a`, `verified_by: claude-opus-5 @T-127-verify — APPROVED,
2026-08-25 — verdict commit 33cc8de`, **`review: same-model`**.

### **WHAT SHIPPED, AND WHERE THE ENFORCEMENT ACTUALLY LIVES**

`nputer-index arch cycles [--root DIR]`, in `src/arch/cycles.rs`. Decided
there rather than in the docs lint because a cycle is a topology fact
about a graph somebody has to build, and the crate already reads the
registry through one hardened reader (ADR-015) that REFUSES rather than
guesses. **Adding a D6 drift finding was considered and REJECTED** — it
would move `arch`'s `findings=` and `drift=` columns and diverge from the
TypeScript engine, the `T-033-s11` two-engines shape bought for nothing.
`arch` / `arch drift` output is byte-unchanged: `arch/mod.rs` gains one
`pub mod cycles;` line and the `Arch | ArchDrift` arm is untouched.

**THE SUBCOMMAND IS NOT THE GATE.** A subcommand nobody runs is the
suggestion-with-a-strong-voice the card complains about, so
`crates/nputer-index/tests/arch.rs` pins the live census against
`KNOWN_DECLARED_CYCLES`, an **EXACT SET** — **a new cycle reds today and
a stale allowlist entry reds the day `T-127-s1` lands.** The verifier
drilled that in both directions: adding `C-06` to C-01's `depends_on`
kills 2 of 218 bodies, and REMOVING the cycle while leaving the allowlist
entry kills exactly 1. **The enumeration walk is ITERATIVE with an
explicit stack** (T-129's lesson — a blown stack in this crate is an
`abort()`), capped at `MAX_CYCLES = 64` with the truncation stated.

### **THE DRILL'S REAL RESULT WAS THE MUTANT THAT SURVIVED, AND IT REPRODUCED IN BOTH DIRECTIONS**

**M6 — `MAX_CYCLES` 64 → 100 000 — killed ZERO of 217 at exit 0**,
because every assertion in `enumeration_is_capped_…` was written in terms
of `MAX_CYCLES`. **A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT
PIN THAT CONSTANT** (CONVENTIONS, T-063), found by drilling rather than
by reading. Fixed at `1b51d61` with one body pinning the literal. **The
verifier reproduced it in BOTH directions on two separate drill
worktrees**: zero kills of 217 pre-fix at exit 0, exactly one kill of 218
post-fix printing **`left: 100000 / right: 64`** — which is the proof the
fix pins a LITERAL rather than moving the parametrisation one level up.
The two baselines differ by exactly one body, so the fix added one body
and changed nothing else.

### **THE FILE-LEVEL DAG CLAIM WAS MADE GLOBAL AND IT IS FALSE — AND THE ROUTE-IT CLAUSE STILL DOES NOT FIRE**

The card says twice, in bold, that *"the file import graph is a DAG"*.
That walked `app/src/**` only. Tarjan over the whole committed graph
finds **exactly ONE SCC of size > 1** — `resolve/{mod,rust,ts,tsconfig}.rs`,
idiomatic Rust `use super::` against a parent module — under `import`
alone and under `import + call + type_ref` alike. **Its owner set is
`['C-07']` and nothing else**, and **no C-08 or C-09 file takes part in
any SCC**, so criterion 2's *"IF one does THEN route it as a real design
defect"* clause correctly does NOT fire. That was the brief's sharpest
suspicion and it is laid to rest. Filed as **`T-127-s3`** so the DAG
sentence stops being repeated unqualified.

### **`T-033-s7` IS ANSWERED WITH A DECISION AND A NUMBER**

**Answer: option (a) — LEAVE IT**, written into `C-16`'s own file where
the question was asked. **NOT ONE** of the eight live `app-shell`-only
cards names `ui/**`, `utils.ts` or `verdicts.ts`, so `app-ui` would
relieve **0 of 8** while narrowing 20 live fences. **The benefit is
somewhere else**: a dedicated word for **C-10** frees **2 of 8** outright
(`T-114`, `T-035`) and makes **2 more honest** (`T-044`, `T-106`).
**Two of eight, said rather than buried**, and routed as **`T-127-s2`**
with the fence consequences enumerated by card id so the move can be
SEQUENCED. **Nothing in this lane changes a `touch_slugs:` value**, so
the fence consequence of what SHIPPED is nil.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree e7db842 33cc8de -> tree d7b28bb…, exit 0 (read from $? FIRST)
    git diff --name-only e7db842 <TREE>                         ->  14   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only e7db842..ad3ac8a  (THE MERGE'S DIFF)   ->  14   the only one that means anything
    git diff --name-only e7db842...ad3ac8a (three dots AT the merge) -> 14   collapses, as it must
    git diff --name-only afe23c1..e7db842  (main's advance)     ->   7
    git diff --name-only e7db842..33cc8de  (TWO dots, FORBIDDEN)->  21
    git diff --name-only afe23c1..33cc8de  (merge-base..tip, FORBIDDEN) -> 14
    git diff --name-only main..HEAD        (FORBIDDEN)          ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 7 PATHS — 1.50x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **7** under this lane, the
branch **14**, `comm -12` over the sorted lists is **EMPTY**, the union
of the two sets is **byte-identical to the forbidden two-dot set** under
`cmp`, and 14 + 7 = 21 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**, T-102 **3.75x**, T-033 **1.94x**, T-091 **8.78x**, T-116
**15.80x**, T-108 **20.75x**, T-104 **3.54x**, T-126 **6.33x**, T-129
**7.53x**, T-130 **18.00x**, T-127 **1.50x** — **the NARROWEST recorded**,
one merge after the second-widest. **The ratio is weather; the left
endpoint is the signal**, and the two merges together are the proof: the
same rule produced 18.00x and 1.50x back to back, because the distortion
is a function of what MAIN did and not of what the lane did.

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read a 14-path merge as an empty one and every gate
derived from it as NOT OWED** — all THREE standing gates fire here and
all three would have been skipped, silently, with a clean-looking
derivation. **The forbidden forms do not share a failure direction**: one
inflates, one ANNIHILATES, and only the second is invisible.

**`<merge-base>..<tip>` GAVE THE RIGHT ANSWER AGAIN AND IS STILL
FORBIDDEN.** `afe23c1..33cc8de` returns **14** paths, byte-identical to
the prescribed set under `cmp`, because `afe23c1` IS the merge base, so
that spelling degenerates into the three-dot form. **It is right by
coincidence of this lane's shape** — main advanced 7 paths under it and
none collided. **That is now THREE merges running where this form was
accidentally right**, which is the argument for banning the PAIR rather
than trusting the outcome, made three times.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`d7b28bb3dab181b54b25dddaa2297ab536cf1fa9` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`e7db842` and `33cc8de` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** The exit was read from `$?` into a variable **BEFORE**
any substitution — exit **0**.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST BOTH OTHER LIVE LANES**,
not only against declared slugs. `comm -12` of this merge's fourteen
paths against `T-132`'s `merge-base..tip` diff (**7** paths, four
`docs/tasks/` cards and three `method/` files) and against `T-133`'s
(**3** paths, all `tools/e2e`) is **EMPTY** in both cases.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `e7db842` when the range
was derived and `e7db842` one command before `git merge`, read in the
same command as the two diff checks. `git diff --cached --name-only` and
`git diff --name-only` were both EMPTY there, with one `??` row;
**`??` alone is not a ceremony.**

## THREE standing gates — ALL THREE fire, all derived from the merge's own 14 paths

| gate | trigger | on these 14 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **5 — OWED** | **exit 1 STALE**, regenerated **TWICE**, then CURRENT twice |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **5 — FIRES** | **exit 0**, both `[nputer]` lines, port 14538 |
| DOCS GATE | a `docs/` path a code suite reads | **9 — FIRES** | exit **1**, **FOUR** suites owed, all green |

- **GRAPH REGEN — DERIVED FRESH RATHER THAN CARRIED, AND THE LANE'S OWN
  FIGURES WERE STALE.** The lane's notes record `943006 bytes · 180 files
  · 2014 symbols · 1910 edges`, `~3` changed, `+3` edges, above a bullet
  claiming the gate was *"ASKED, never predicted, and asked AGAIN after
  every write"*. The verifier matched those figures byte for byte to
  `1b51d61` — **one commit BEFORE the lane's own last commit** — and this
  integrator reproduced the correction independently at the merge:
  **939 161 → 944 590 bytes · 179 → 180 files · 2004 → 2018 symbols ·
  1907 → 1911 edges**, `files +1 -0 ~4`, `edges +4 -0`. The extra file
  and edge are `tests/arch.rs` and `tests/arch.rs -> cycles.rs`, i.e. the
  docs-gate fix at `6839450` itself. **So the claim is contradicted by
  its own numbers: the last write was not followed by a re-ask.** The
  notes' *"`index --check` reports the THREE edges `cycles.rs` adds"* is
  four at the tip. **THE SUBSTANCE SURVIVES INTACT AND IS STRONGER: all
  four are `import`, still ZERO `call` and ZERO `type_ref`** — three with
  both endpoints inside C-07 and one on `p:cargo:std`.
- **THE IDENTICAL-FIGURES TRAP FIRED, FOR THE FOURTH CHECKPOINT, AND IT
  IS THE SAME MECHANISM EVERY TIME.** After the first regen the graph was
  CURRENT; after the fixture reconciliation below it went **STALE with
  ALL FOUR HEADLINE FIGURES IDENTICAL ON BOTH SIDES** — `944590 bytes ·
  180 files · 2018 symbols · 1911 edges` against itself — and the only
  difference was `files +0 -0 ~2`, the two dogfood fixtures' content
  hashes and loc. **A BYTE COUNT CANNOT TELL YOU THE GRAPH IS CURRENT;
  ONLY THE GATE CAN.** Regenerated a SECOND time and then asked **twice
  more**, exit 0 CURRENT both times. T-104, T-126 and T-129 hit this and
  T-130 did not, and the discriminator is whether the checkpoint writes a
  fixture — **not whether the headline figures move.**
- **BOOT GATE — FIRES, AND THE CARD'S OWN VERIFICATION SECTION OMITS
  IT.** Five of fourteen paths are under `app/src-tauri/**`. The card
  names GRAPH REGEN and the DOCS GATE only; the lane caught the omission
  and ran it, the verifier ran it, and this checkpoint derived it from
  CONVENTIONS' trigger and ran it a third time: **exit 0**, both
  `[nputer]` lines, tree stopped, scratch port **14538**, never 1420.
- **DOCS GATE — exit 1, FIRES on 9 of 14, FOUR suites**: `cargo test`
  from `app/src-tauri/`, `npm test` from `app/`, `npm test` from
  `tools/e2e/`, `npx vitest run` from `lib/parser/`. **The cargo suite is
  owed for a NEW reason and it is this lane's own doing**: the gate's
  reader census now names
  `app/src-tauri/crates/nputer-index/tests/arch.rs` as a
  `docs/architecture/components` reader — the file the lane created at
  `6839450` to fix its own root-anchor finding. Invoked DIRECTLY from the
  repo root with the RANGE RULE's own path list, **never through
  `xargs`**. **13 derived docs readers across 4 suites**, census **131
  sites in 22 files** (130 at T-130's), **0 frontmatter issues**, **6
  root-anchored files, all argued, 0 unlinked**.

## Fixture reconciliation — TWO FILES, THREE BODIES, EVERY FIGURE DERIVED BEFORE THE EDIT

**The three-step procedure T-129's checkpoint wrote down was run and this
time it returned work.** Derive the FIGURE from `arch` over the
REGENERATED graph: **files 179 → 180, mapped 180, unmapped 0, and C-07
33 → 34 — the only component whose count moves.** `components=13
edges=36 findings=3 drift_components=3` are all unmoved. Derive the SITES
with `git grep` on the old digits: **three assertions in two files**,
and the app suite named exactly those three when run before the edits —

    expected 180 to be 179                              architecture-dogfood.test.ts:1266
    expected 'C-07…34…' to contain '33 files'           map-dogfood-render.test.tsx
    expected 'committed graph · 180 files' to be '… 179 files'

**BOTH BODY TITLES CARRIED A COUNT AND BOTH MOVED WITH THEIR DIGITS**
(T-126's precedent — a body whose name carries a count is a count in two
places): *"all 179 files map"* → 180, *"thirty-three Rust files"* →
thirty-four. Each edit carries a ledger entry deriving the move from the
regenerated graph and `arch` **before** the suite was run, and the
architecture-dogfood entry records the `~4`/`~3` discrepancy against the
lane's notes so the next reader is not sent to compare against a stale
number. **973 / 973 on the re-run.**

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 494 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 5.47s**.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **497**, which is 494 + 3 ignored.
  **DO THE HEADER CHECK EVERY TIME** — T-129's M15 is the worked reason:
  a SIGABRT in one target prints **no `test result:` line at all**, so
  the summary reads unremarkably while whole bodies vanish. **471 → 494
  is +23**, which is what this lane adds — and it settles a figure the
  record gets wrong: **`T-127-s5` says the command is "covered by 22 test
  bodies" and it is 23.**
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from `lib/parser/`, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**. **973 is unchanged and that is the right answer**: this merge
  contains no app TypeScript, and the three fixture bodies it moved were
  reconciled rather than added.
- **E2E: 171/171, exit 0, 2.1m, on scratch port 15504.** **BOTH RUNS ARE
  DECLARED EITHER WAY, WHICH IS THE POINT.** `cea839e` — T-130's mtime
  fix — **IS an ancestor of this merge** (`merge-base --is-ancestor`), so
  the fractional-millisecond signature cannot fire here and run 1 was
  green. **A GREEN IS NOT EVIDENCE OF THE FIX**: a lane on unfixed code
  passed this suite three times running, so the only thing a green
  proves is that nothing else broke. **A red before `cea839e` is not
  news; a red at or after it is.**
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root`
  `ok`, `a_hostile_session_id…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`.
- **THE GATE ITSELF WAS RUN AGAINST THE LIVE REGISTRY AT THIS MERGE**:
  `arch cycles --root ../..` exit **1**, `cycle C-08 -> C-09 -> C-08`,
  `components=13 declared_edges=35`, the whole 529-byte report on
  **stderr** with stdout **empty**. **`arch cycles > out.txt` on a red
  yields an EMPTY FILE** — worth knowing before you pipe it.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0** (65 TOKEN + 4 CONTROL samples, 87 walk-policy checks, 9
  evidence-floor checks), **`npm run lint:tokens` exit 0**, at **TOKEN
  135 / CONTROL 754**. **`npm run typecheck` from `tools/e2e` exit 0.**
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF; IT IS NOT A CONSTANT** —
  748 at T-130's checkpoint and **754** here, because this merge adds
  **six** new tracked text files (one `.rs` and five suggestion cards).
  `git ls-files` reads **772**.
- **RUN LEDGER — every run declared, including the ones that agree.**
  cargo **once** (494/0/3); parser **twice** (268/268 post-merge,
  268/268 after the doc writes); app **THREE times** (973/973 post-merge
  and pre-regen, **970/973 with 3 failed** immediately after the regen —
  the reconciliation, quoted above — and 973/973 after the fixture
  edits), plus a fourth after the doc writes; `tools/e2e` **twice in
  main** (171/171 on port 15504 post-merge, and again after the doc
  writes on port 15505). **The final `tools/e2e` run that this file's own
  write owes is declared in this checkpoint's COMMIT MESSAGE** — a commit
  message is not a code input, so recording a run there owes nothing
  further and the regress terminates on the first pass instead of
  converging. **What may never be done is stopping because the loop is
  tiresome, or writing a run's result before running it.**
- **`range-rule.spec.ts` PRINTED ITS DISCLOSURE AGAINST THIS MERGE COMMIT
  BY NAME** — *"`/Users/ujju/Projects/nputer @ ad3ac8a` — GRAPH REGEN's
  published flip figures are stated at `ddcc8bb` and ARE RIGHT THERE, and
  its trigger has since gained `.rs`: 5 of 5 at that ref, 1 of 1 under
  the trigger on disk"* — which is `T-091-s3`'s exact subject, observed
  rather than theoretical, for the **fifth** consecutive merge.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-127` was removed with `git worktree
remove`, after the merge and after the checkpoint (lane-protocol rule 6),
and `git worktree prune` was run behind it. **Rule 6's
preserve-until-the-verdict clause bound here and was honoured**: this is
an M card with a real adversarial verdict, so the worktree survived until
the verdict existed — it did, at `33cc8de`, and the verifier had already
cut and removed its own detached checkouts.

## The board, derived from disk at this checkpoint

**282 flat task files — 96 done / 36 planned / 41 parked / 107 suggested /
0 verifying / 2 building; 26 in `rejected/`.**
96 + 36 + 41 + 107 + 0 + 2 = 282. T-127's stamp moves done from 95 to 96
and clears the single `verifying`; the two `building` are `T-132` and
`T-133`, both live lanes. The merge brought **five** suggestions, so the
file count is up five from T-130's 277. **This checkpoint files NONE**,
and creates no tracked file at all.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND SEVEN AND WANTS AN ELEVENTH
TRIAGE.** `T-127-s1`…`s5` came in with the merge and none is triaged,
because disposition belongs to a triage pass and not to an integrator
(T-083's ruling), so they stay `status: suggested` exactly as filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's own text AND the verdict are
  preserved byte-untouched** — this checkpoint made NO in-place repairs
  to either, including to the two record defects the verifier asked to
  have corrected before hand-off. **That is the ruling above, applied to
  the verifier's own findings 1 and 2 as well as to the card's analysis**,
  and both corrections are written into the `## Integration` section
  instead, where they are permanent and attributed.
- **ARCHITECTURE — TOUCHED, and it is the first checkpoint in five where
  it is.** C-07's row gains `arch cycles` with what its verdict is about,
  what it cannot see, and where the enforcement lives — **an interface
  moved: the component gained a public command** (integrator.md rule 3).
  The byte-budget entry gains **944 590 bytes — 94.46%, 55 410 bytes of
  headroom**, spending **5 429** on ONE new indexed file.
- **ROADMAP — TICKED on the cost line and the census, NOT on progress.**
  T-127 carries `feature: F-06` as **inherited backlog, not F-04 slice
  content** (T-129's and T-130's precedent), so F-04's "4 of 7" line does
  not move. The milestone-4 census was **re-derived on disk rather than
  carried**: **96** cards carry `milestone: 4` — F-01 9, F-02 43, F-03
  12, F-04 7, F-06 25 — every figure identical to T-130's, because this
  merge's five new files are suggestions and suggestions carry no
  milestone.
- **CONVENTIONS — NOT TOUCHED, and that is a DISCLOSURE rather than a
  skip.** `arch cycles` ships **undocumented** in the "Build & test"
  command list, because that file was outside `[crate-index,
  docs/architecture/components/]`. **That is `T-127-s5`, it is real, and
  it was routed on the branch and named NOWHERE in the lane's notes** —
  which enumerate s1 through s4. `docs/CONVENTIONS.md` is **FREE** and
  now **SEVEN** edits are queued at its seat — see "Next up" item 2.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The one decision inside this card — *the cycle
  gate lives in the indexer, reads the registry only, and is not a drift
  finding* — is an APPLICATION of ADR-015's "narrow reader that refuses
  rather than guesses" and its "second computation of a strict SUBSET"
  clause, not an amendment to it. It is recorded in ARCHITECTURE's C-07
  row, where the command lives.
- **`graph.json` REGENERATED TWICE and COMMITTED** with this checkpoint,
  because the gate was asked and said STALE both times it mattered.

## Provenance — SELF-DECLARED, never read off a trailer

T-127 is **built by `claude-opus-5`**, **verified by a second
`claude-opus-5` session** in a detached worktree cut from the lane tip
with its own `CARGO_TARGET_DIR`, and **integrated by a THIRD
`claude-opus-5` session** that neither wrote nor reviewed the lane's
commits before opening them. **`review: same-model` is the honest
label.** **The `Co-Authored-By` trailer on this lane's commits is a
harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened it.

**96 done cards — 71 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 71 + 19 + 5 + 1 = 96. T-127 moves `same-model` from 70
to 71.

**THE VERIFIER REPORTED ITS OWN FALSE STARTS AND ONE OF THEM IS A REUSABLE
LESSON.** It named its scratch target dir `.vtarget` inside its worktree;
`.gitignore` ignores `target/`, which does **not** match `.vtarget`, so
`index --check` walked its build artefacts and reported
`serde_core-*/out/private.rs` as tree staleness — **a completely
fabricated GRAPH REGEN reading, nearly filed as a finding, self-caught.**
**THE PROTECTION IS THE NAME, NOT THE LOCATION**: a scratch
`CARGO_TARGET_DIR` inside a worktree must be named to match an ignore
rule or the staleness gate reports the verifier. It also poisoned one
early reading by exporting `GIT_DIR` alongside `git -C`. **Both are the
drill-pollution class**, and the first belongs in CONVENTIONS' POISON
DRILL bullet beside the three edits already queued there.

## What ACTUALLY reached the human's running app

**NOTHING, AND THE CHANNEL IS CLOSED TWICE OVER — BUT NOT FOR THE REASON
THE LAST FOUR MERGES GAVE.** **FIVE of this merge's fourteen paths ARE
under `app/src-tauri/**`**, which is the trigger that rebuilds and
relaunches the binary, so unlike T-130 this merge does touch a trigger
set. The channel is closed by the CHECKOUT instead: `lsof -a -p 88948 -d
cwd` reports the vite serving 1420 has `/Users/ujju/Projects/nputer-app/app`
as its cwd — @human's own checkout, four merges behind — and
`app/node_modules/@nputer/parser` is a **RELATIVE** symlink
(`../../../lib/parser`), so it resolves inside that checkout with its own
`lib/parser/dist`. **"MY DIFF IS TOOLING-ONLY" IS EXPLICITLY NOT THE
ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and this
integration DID rebuild `lib/parser/dist` and DID compile new Rust into
`app/src-tauri/target/` — both land in directories the running app does
not read.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **23:16:48** (before any
command that writes) and again after the merge, the suites and the boot
gate. **Every reading identical.** The **anchored** process match —
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'` — reports
pid **53350**, started **2026-08-25 19:43:47**, the same pid and start
time T-104's, T-126's, T-129's and T-130's checkpoints recorded, so
**@human has not restarted their app in five integrations**. A pid and a
start time are live-environment facts, not functions of a tree, and both
are already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were checked and all six were present, so **no fresh dependency
install was owed and no `npm ci` was run.** **The repair is still item 9
below, unwritten after THIRTEEN consecutive merges performed it by
hand** — and this pass ran the one command that repair names
(`lsof -p <pid>` for the holder's cwd) and used its answer, which is the
strongest argument yet for writing it down.

**No process from this integration survives.** Scratch ports **15504**
and **15505** (e2e) and **14538** (boot gate) were `lsof`-read free
before each bind and read back at zero rows afterwards; **a probe
reserves nothing, so the runner's own bind is what proves the port was
free.** **ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-fifth** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that.
**No `pkill`. No `npm ci`. No `cargo clean`. No `git update-ref`, no
force-push, no history rewriting.** Be precise rather than claiming more
than is true: this integration's `cargo test` run, two graph regens, four
`index --check` asks and two `arch` reports all WROTE to main's
`app/src-tauri/target/`, which reads **3.6 GB**, as any cargo run must.
**NO sibling worktree was entered or modified** — `../nputer-T-127`,
`../nputer-T-132`, `../nputer-T-133`, `../nputer-app` and
`../arch-verify` were read with `git -C … rev-parse` and `lsof` only, and
`../nputer-T-127` was removed only after this checkpoint. No path was
staged by wildcard; **`git add -A` was never used**, and every write used
`git commit -- <paths>` so it could not sweep another hand's index —
which was not hypothetical tonight, with two other lanes live and one of
them advancing under this pass.

## In progress / broken right now

**NOTHING IS BROKEN, AND THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED.**
TWO lanes hold fences — **T-132** (`building`, three `method/` FILES) and
**T-133** (`building`, `[tools/e2e]`). Read `git worktree list` and each
branch tip rather than any table here.

**`crate-index` AND `docs/architecture/components/` ARE RELEASED.**

## Next up

1. **`T-126-s3` IS THE CARD THIS MERGE MOST DIRECTLY UNBLOCKS, AND IT HAS
   BEEN THE MOST URGENT ROUTED ITEM ON THE BOARD FOR TWO CHECKPOINTS.**
   Four written statements about C-15 are false on main right now: the
   registry `paths:` entry names a deleted file, the module header says
   `lib.rs` does not declare the module and that no command registers it,
   and `T-110-s9`'s EDIT ONE is still live. **Nothing reds** — a declared
   path matching no file produces no finding in either engine. Fence
   `[app-dispatch, docs/architecture/components/]`, and **BOTH slugs are
   now FREE**. Item 1 fires T-024's three-fixture rule; item 3 IS
   `T-110-s9`, so **one lane should take all of it.**
2. **`docs/CONVENTIONS.md` IS FREE AND SEVEN EDITS ARE QUEUED AT ITS
   SEAT, ACROSS THREE BULLETS** — `T-104-s5` carries the argument.
   **THE COMMAND LIST — one edit, `T-127-s5`**: `arch cycles` ships
   undocumented, with its four exit codes and its registry-only scope
   ready to paste. **THE RANGE RULE BULLET — two edits, to `T-093`**
   (`[docs/CONVENTIONS.md]`, `planned`): `T-091-s3`'s
   trigger-beside-the-ref clause and the `bdada11` sharpening, **both
   observed live again at this merge**. **THE POISON DRILL BULLET — four
   edits, to `T-092`** (`[docs/CONVENTIONS.md, app-agent]`, `planned`):
   `T-079-s3` items 2–3, **`T-130-s1`**, T-129's binary-level
   generalisation, and **NEW at this merge — the verifier's `.vtarget`
   lesson: a scratch `CARGO_TARGET_DIR` must be NAMED to match an ignore
   rule, because the protection is the name and not the location.**
   **FOUR OF THE SEVEN ARE ONE GAP SEEN FOUR WAYS**: the bullet rules how
   a restoration is PROVED and never says what restoring MEANS, and its
   proofs — a content hash, an empty `git diff`, a source read — are
   passed by a stale binary, by a moved clock and by a polluted target
   dir alike. **Take them together or the bullet gets patched four times
   and still does not say it.**
3. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
   PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the
   `app/test/**` fixtures) and `lib-parser` if a component ID moves.
   **Both are FREE.** It ships with the measured cost (6 of 973), the
   recommended four-node partition, and the reason a smaller one is
   wrong, so it is the cheapest well-specified card the merge produced.
4. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING.**
   `app-shell` 20, `tools/e2e` 10, `docs/CONVENTIONS.md` 9 at this ref
   (re-derived: **20 / 9 / 9 / 5 app-agent / 4 method/ / 4 app-map / 3
   crate-index**). A word for C-10 frees 2 of 8 outright and makes 2 more
   honest. **`T-127-s4` is its warning label**: a `touch_slugs:` edit is
   invisible to every suite in this repository — measured 973/973 green
   under one — so **declaring a component is loud and re-drawing a fence
   is silent**, and the silent one is the one that changes who may write
   to a file.
5. **TWO LATENT DEFECTS IN THE GATE, BOTH FAIL SAFE, BOTH ROUTED RATHER
   THAN BLOCKED BY THE VERIFIER AND NOT REPAIRED BY THIS CHECKPOINT.**
   (a) **The truncation flag is off by one at exactly 64** — the report
   prints all 64 cycles *and* says the list is incomplete when it is
   complete. A false sentence, never a false verdict, erring toward
   warning; the boundary is untested because
   `enumeration_is_capped_…` uses a complete digraph on 9 nodes, far
   above the cap. (b) **The live positive control is brittle to a shared
   closing hop** — `…minus_one_hop_per_reported_cycle_is_acyclic` asserts
   `dropped == before.cycles.len()`, and two cycles sharing a hop make
   that 1 against 2, redding with a misleading message. **Both are in
   code this merge INTRODUCES, so ruling thirteen would have them
   repaired** — and an integrator writing new Rust with new bodies at a
   checkpoint is a lane write by another name. Fence `[crate-index]`,
   **FREE**.
6. **`T-135` MUST READ THIS CHECKPOINT'S FIRST SECTION BEFORE IT IS
   PLANNED.** It would key ceremony to exactly the graph that cannot see
   a Rust `mod`/path-expression dependency. Fence `[crate-index,
   method/]` — **`crate-index` is free and `method/` is PARTLY HELD** by
   T-132, so it waits for that lane or rides inside it.
7. **`T-132` IS IN FLIGHT AND CARRIES RULING THIRTEEN**, which this and
   the last five checkpoints have all decided by and none could cite:
   *repair what the merge INTRODUCES, file what the merge merely
   REVEALS.* **Verified ABSENT from `method/` and `docs/CONVENTIONS.md`
   again at this ref** — `git grep` returns zero rows. **This checkpoint
   applied it three times and says so**: to the card's section-ONE
   analysis (revealed → filed), to the verifier's findings 1 and 2
   (record defects in text this merge introduces → corrected in the
   integrator's own section rather than by rewriting another hand's
   text), and to findings 3 and 4 (introduced → routed, against the
   ruling, on the verifier's explicit recommendation and because the
   repair is a lane write). **The third case is the one the ruling does
   not yet cover, and it is the most useful thing this merge learned
   about it.**
8. **`T-133` IS THE OTHER LANE IN FLIGHT** and its subject is this
   checkpoint's own experience for the second time running: the previous
   edition's non-lane list went stale under this very integration
   (`nputer-T-132-verify2` appeared and vanished inside one pass) while
   the LANE list did not move once. **A typed lane list is a snapshot of
   a fact that moves faster than the file.**
9. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — THIRTEENTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into** — and this pass RAN it and used its answer.
   Fence `[docs/CONVENTIONS.md]`, **FREE**.
10. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`). The three must be cleared in the same
    commit or the gate reds on arrival. Fence `[tools/e2e]`, **now HELD
    by `T-133`** — it came free at T-130 and went back under a lane
    before anyone took it.
11. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED EVEN THOUGH BOTH
    INSTANCES ARE FIXED.** Fence `[tools/e2e]`, **HELD by `T-133`**.
12. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
    AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
    returns zero rows, re-checked at this ref. Fence `method/` — **PARTLY
    HELD** by `T-132`, which is where this belongs, so **it waits for
    T-132 or rides inside it.**
13. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its
    conflict rests on is NOT in `method/`. **The two are one card.**
    `method/roles/executor.md` is **FREE** — T-132's file-granular fence
    does not reach it, which is `T-134`'s subject arriving as a benefit
    rather than a complaint.
14. **`T-125` IS NOW FULLY UNBLOCKED** (`[app-agent, app-shell,
    docs/architecture/components/]` — all three FREE as of this merge).
    **`T-107-s4`** needs `app/test/**`, free; read it beside
    **`T-110-s9`**.
15. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — `T-134`'s subject arriving early. Fence `[app-board,
    app-shell]`, both FREE.
16. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence.
17. **`T-129-s1` — `IndexOutcome::Error`'s DOC COMMENT PROMISES "never a
    panic" AND WAS FALSE FOR THIS CLASS.** `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, FREE). **`T-129-s5`** — four numbers in one
    comment block inside C-07 are exactly double the literals beneath
    them; **`T-129-s2`** and **`T-129-s3`** are also `crate-index`. **All
    four are FREE as of this merge**, and the three `crate-index` ones
    should be read beside item 5 above — they are the same file's
    neighbourhood.
18. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**, because `extract::ts::Cx::scan` descends every
    named child of the whole tree. Measured: the same shape is **exit 0
    as `.rs` and exit 134 as `.ts`**, and TS `namespace` chains abort at
    **2 000** against Rust's tightest **3 000**, so **TypeScript is the
    MORE exposed language**. **If you are about to cite T-129's card for
    the negative result, cite this paragraph beside it.**
19. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
    **`T-104-s4`** — four defects in T-104's own criteria. **`T-108-s1`**
    — the fourth stale citation. **`T-108-s4`** — the pathspec rule needs
    a ROOT clause. **`T-126-s6`**, **`T-126-s5`**.
20. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND SEVEN AND WANTS AN
    ELEVENTH TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-129-s1`…`s5`,
    `T-130-s1`…`s2` and now `T-127-s1`…`s5` are untriaged. **`T-130-s1`'s
    OWN ROUTING LINE IS STILL STALE** — it says `docs/CONVENTIONS.md` is
    *"held by T-104"*; `T-104` is `done` and the seat is `T-092`.
    Recorded rather than edited, on the same ruling as everything else in
    this checkpoint.
21. **THE BOARD-TRUTH RULING** — SEVENTEENTH ask, and the first from a
    CLOSED window in six checkpoints. **A PATTERN COUNT IN THE FOUR WALKS
    TABLE STILL HAS NO OWNER.** **The GNU `xargs` column still closes at
    the first push**, and `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This was the SIXTH brief in the deliberately-thin format. **It
declared THREE limits up front** — *it does not protect an ARGUMENT*,
*atmosphere figures slip through, and treat the figure AND its qualifier
as suspect*, and *it does not stop me being stale* — **and it instructed
that anything numeric be derived.** That instruction found the errors
below, so **the brief's most useful sentence was again the one about its
own unreliability.** Sorted into the four categories it asked for.

1. **A FACT THAT WAS STALE, AND IT IS THE THIRD LIMIT THE BRIEF NAMED
   ABOUT ITSELF FIRING.** *"Two lanes are live."* **THREE were** — this
   card's own lane plus `T-132` and `T-133` — and the brief's own
   instruction to derive them by filtering `git worktree list` on the
   branch is what caught it. The charitable reading is that it meant two
   lanes BESIDES this one, and on that reading it is exactly right; it is
   listed here because a count that needs a charitable reading is a count
   that should have been derived. **The brief also predicted the
   membership would be stable and it was**: identical at every reading
   across this whole integration, while a detached non-lane
   (`nputer-T-132-verify2`) appeared and vanished inside the same pass.
2. **A FACT ABOUT THE VERIFIER'S FINDING 2 THAT UNDERSTATES IT.** The
   brief says `T-127-s5` *"is routed on the branch and named nowhere in
   the notes"* — true. What it does not say is that `T-127-s5`'s own text
   carries a wrong figure: *"covered by 22 test bodies"* against the
   **23** this merge's cargo count derives (471 → 494 with ignored held
   at 3). The verifier caught it and the brief dropped it. **A finding
   summarised loses its own findings**, which is the thin format's cost
   stated precisely rather than in general.
3. **EVERY PREDICTION FIRED, INCLUDING THE TWO THAT WERE HEDGED.** *"The
   GRAPH REGEN figures in the lane's notes match a commit BEFORE its own
   last commit — derive the regen fresh at your merge"*: derived, and it
   reproduces exactly — `~4` and `+4` against the notes' `~3` and `+3`,
   the difference being `tests/arch.rs -> cycles.rs`. *"The substance is
   said to be intact"*: it is, and stronger — all four edges are
   `import`. *"The BOOT GATE fires here and the card's own Verification
   omits it"*: both true, derived and run, exit 0. *"Build `lib/parser`
   first"*: done, in that order, every exit 0. *"`npm run typecheck` from
   `app/` does not exist"*: re-derived, still true. *"Derive cargo counts
   against the `running N tests` headers"*: done, 497 = 494 + 3.
   *"Ask GRAPH REGEN twice and never confirm by byte count"*: **this is
   the trap that actually fired**, and the brief was right in the exact
   shape it warned about — a second staleness with every headline figure
   identical on both sides.
4. **THE ARGUMENTS WERE ALL SOUND AND ONE WAS LOAD-BEARING.** *"What the
   checkpoint says the gate means matters as much as the merge"* — that
   is the first section of this file, and it is the right call: the gate
   is exit 1 on main and a reader who does not have that paragraph reads
   it as breakage. *"Do not let the checkpoint imply the census moved —
   it is 1 before and 1 after, and the reason is the fence, not the
   gate"* — correct, and it is the sentence that keeps a disclosed defect
   from reading as a failure. *"Treat the figure AND its qualifier as
   suspect"* — applied, and it is what turned "two lanes" into a
   derivation. *"The protection is the NAME, not the location"* —
   correct, and routed to the POISON DRILL bullet. **The one argument the
   brief made that this checkpoint had to DECIDE rather than accept was
   the ruling on the card's wrong analysis**, and the brief was right not
   to answer it: it set out both sides (ruling thirteen against T-108's
   archive accuracy) and asked for a ruling with a reason, which is
   exactly the shape a decision should arrive in.
5. **WHAT THE THIN FORMAT COST ON ITS SIXTH TRIAL: TWO ERRORS, BOTH
   CHEAP, AND BOTH IN THE CATEGORIES IT NAMED IN ADVANCE.** One stale
   fact and one summary that lost a figure. **Neither was in an
   argument**, which is the fifth consecutive trial where the arguments
   held. **The remedy the fifth trial proposed — treat the figure AND its
   qualifier as suspect — worked**, and this pass adds one word to it:
   **treat a SUMMARISED FINDING as suspect too.** A brief that compresses
   four verifier findings into four bullets drops whatever the verifier
   found INSIDE them, and the only defence is to read the verdict, which
   is what this brief told its reader to do first.
