# State

Updated: 2026-08-24 by integrator (T-088 merged and checkpointed).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THERE ARE TWO LIVE
LANES, AND THE PARAGRAPH THAT USED TO SIT HERE SAID THE OPPOSITE.** The
previous checkpoint opened with *"there are NO LIVE LANES"* — true when
T-101 landed, false from the moment three lanes were dispatched at
`9b03ae6`, and doubly false now. `git worktree list` is the authority
(lane-protocol rule 7) and it returns, beside this main checkout:

- **`/Users/ujju/Projects/nputer-T-113`** on `task/T-113-tail-dedup`,
  **fence `[app-agent]`** — LIVE, moving while this was written
  (`55f9b1b` → `d0c8ba9` → `1238062` across three samples).
- **`/Users/ujju/Projects/nputer-T-090`** on `task/T-090-docs-gate-ci`,
  **fence `[tools/e2e, .github/, docs/CONVENTIONS.md]`** — LIVE at
  `f20f786`.
- a DETACHED entry at `<scratchpad>/drill` on `f20f786`, which is
  **T-090's poison-drill worktree, not a lane** — the lane-protocol
  bullet's "read it as entries on a `task/T-NNN-*` branch, not as a row
  count" being exercised for the second time on record.

`docs/tasks/` carries **2 cards at `status: building`** and they are
exactly those two, which is the dispatch stamp T-089 restored doing its
job — the first checkpoint where the board and the worktree list AGREE
about who is live. **Do not dispatch into `app-agent`, `tools/e2e`,
`.github/` or `docs/CONVENTIONS.md`.** Everything else is free,
including the newly-declared `app-dispatch`.

## Just completed

**T-088 — the dispatch surface is a declared component before it is a
directory.** F-04, milestone 4, size S, `touches:
[docs/architecture/components/, lib-parser, app-shell]`, **fence never
widened**. Built by `claude-opus-5 @T-088`, self-integrated per the
size-S ceremony; `review: self-verified`. Main-before **`9b03ae6`**,
lane tip **`9f12769`**, merge **`bd5864b`**; the card was `building`
— stamped **before the cut**, which is the practice T-089 ruled back
into the method and which this lane is the first to exercise end to
end — and this checkpoint stamps **`done`**.

**WHAT LANDED.** `docs/architecture/components/C-15-dispatch.md`, in
C-13/C-14's shape, with the paths `docs/design/dispatch-technical-plan.md`'s
**D2 decided** — `app/src-tauri/src/dispatch/**` and
`app/src/lib/dispatch-store.ts` — and no more. `depends_on: [C-10]`
mirrors C-14, the structurally identical sibling (a Rust core under
`app/src-tauri/src/<x>/**` plus a TS store at `app/src/lib/<x>-store.ts`);
`decisions: [ADR-009, ADR-012, ADR-017]` are each cited by a criterion of
T-110/T-112 rather than chosen by feel. **The point of the card is the
fence word**: without it every dispatch card inherits `app-agent` — C-14,
the genesis runner — and dispatch serialises against every genesis card
for the life of the feature, for no reason but a missing declaration.
The file states in prose why C-02/C-03/C-04 stay undeclared (no doc
decides their layout, so any glob would be INVENTED), and **T-008-s1's
re-park stands untouched** — its trigger was "revisit at the F-04
planning pass", that pass decided THIS component's location and not the
CLI's.

## THE COST WAS THE POINT, AND THE MOVED SET WAS DERIVED RATHER THAN DISCOVERED

Declaring a component moves the three live-registry fixtures
(`docs/CONVENTIONS.md`'s own gotcha, written after the omission cost
T-024 a rejection and recurred at T-025's merge). The executor derived
the set BEFORE running anything, with a throwaway probe `it()` that ran
the live derivation with C-15 on disk and was then removed — T-073's
technique, reused. **EIGHT assertions across SIX bodies in THREE files**,
reconciled corrected and never widened, every array still a whole-array
`toEqual` with each pre-existing entry byte-unchanged:

| file | moves |
|---|---|
| `lib/parser/test/smoke.test.ts` | the live-tree id array, 11 → 12 |
| `architecture-dogfood` registry body | ids 11 → 12, **then** the declared count 11 → 12 |
| `architecture-dogfood` findings | `D3:C-15` appended after `D3:C-11`, in id order |
| `architecture-dogfood` relation table | `["C-15","C-10","planned",0]`; planned 9 → 10, confirmed 13 and undeclared 10 HOLD |
| `architecture-dogfood` drift body | `drift` +C-15, **then** `declaredOnly` +C-15 |
| `map-dogfood-render` | nodes 11 → 12; edges 32 → 33 |

**TWO of the eight are SECOND assertions in a body whose first also
moves** — the shape T-077's checkpoint met and this fixture's own ledger
keeps warning about — **and map-dogfood's edge body is the same trap
INVERTED**: the row count moves 32 → 33 while its second assertion, the
undeclared tally, HOLDS at 10, because a component declared before it
has code can only ever add PLANNED rows.

**A FOURTH live-registry reader was checked rather than assumed.**
`app/src-tauri/crates/nputer-index/tests/arch.rs` drives this same
registry from Rust and pins no count ON PURPOSE — its own header says
making the three fixtures four, in a second language, would be a
standing cost at every merge for a property the TypeScript already
guards. So `cargo test` does not move, and the three-fixture rule is
three and not four for a reason somebody wrote down.

## C-15 IS DECLARED-ONLY, AND THAT IS A PROPERTY THE INTENT LAYER EXISTS TO HAVE

Neither declared path matches a file on disk. The derivation therefore
renders C-15 as **declared-only rather than as a defect**, which is the
same arc C-13 walked at T-024 and C-14 at T-025 — both cleared their D3
at the next regen, when a file appeared under the glob. C-15's clears
when T-110 writes the store; **not when it writes the Rust**, because
`languages: ["ts"]` still hides `app/src-tauri/**` until T-010.

Everything a file-count assertion could see is UNCHANGED and was
measured, not reasoned: `fileComponent.size` **126**, the per-component
tally gains no row (a component with zero files contributes no entry),
C-12's file list byte-identical, `derived.issues` `[]`, `unmappedFiles`
`[]`, `mode` `"full"`, and map-dogfood's `committed graph · 126 files`
hint does not move at all. **That last is the exact inverse of T-073's
ledger entry**, where a file joined the index and moved ONLY that hint.

The new pin asserts the property by NAME, and its discriminating power
was MEASURED rather than argued (the shape-six question, asked and
answered): mutant A7 widened C-15's first glob to
`app/src/lib/dispatch-*.ts` — a different glob that still matches
nothing — and the pair suite went **17/18, exit 1, the new body ALONE**.
Every whole-array assertion in the tree is blind to that mutation
because none of them carries C-15's globs.

## Ranges — EVERY FORM IS 8, AND THAT IS A PROPERTY OF THIS WINDOW, NOT A LICENCE

Main-before **`9b03ae6`** (verified as the tip at the moment of merge,
not inherited from the dispatch brief), lane tip **`9f12769`**, merge
**`bd5864b`**, merge-base **`9b03ae6`** — the cut commit itself.

    git merge-tree --write-tree 9b03ae6 9f12769 -> tree 9bd40572…, exit 0 (read from $?)
    git diff --name-only 9b03ae6 <TREE>                      -> 8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 9b03ae6..9f12769   (TWO dots)       -> 8   the forbidden pre-merge form
    git diff --name-only 9b03ae6...9f12769  (THREE dots)     -> 8
    git diff --name-only 9b03ae6..bd5864b   (TWO dots)       -> 8   THE MERGE'S DIFF
    git diff --name-only 9b03ae6...bd5864b  (THREE dots)     -> 8   COLLAPSES
    main's own advance from the cut                          -> 0

**MAIN NEVER ADVANCED FROM THE CUT, so there is ZERO left-endpoint drift
and every form agrees.** `git merge-base --is-ancestor 9b03ae6 bd5864b`
exits **0**. This is the one condition under which the forbidden range
is harmless, and the RANGE RULE says so in as many words — *"the
prescribed and the forbidden forms are indistinguishable exactly where
this rule is addressed"*. **DO NOT GENERALISE IT.** The next lane to
integrate will have T-088's merge sitting on main behind it, and its
forbidden count will carry these 8 paths as drift; the previous
checkpoint watched that figure climb 24 → 52 → 68 → 75 → 77 for exactly
this reason.

**THE FORECAST WAS EXACT AND WAS CHECKED TWO WAYS.** The merge's own
`HEAD^{tree}` **IS** the pre-merge forecast tree `9bd40572…`, and `cmp`
over the sorted pre-merge path list against the merge's own diff exits
**0**. Parents are `9b03ae6` and `9f12769` and nothing else. **NOTHING
WAS WRITTEN INTO THE MERGE COMMIT**; every integrator edit is in this
checkpoint.

## THREE standing gates — derived from the merge's own eight paths

Derived mechanically at the merge, not carried from the brief.

| gate | trigger | on these 8 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **3 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES**, four suites |

- **GRAPH REGEN — FIRES on the three fixture edits, AND THE COMPONENT
  `.md` IS NOT WHAT FIRES IT.** The card required the executor to STATE
  this rather than assume it, and the statement is: a component `.md`
  matches neither the suffix list nor the outside-`docs/` half, so a card
  that declares a component and touches nothing else would NOT trigger
  this gate at all. At the merge, `cargo run -p nputer-index -- index
  --check --root ../..` exits **1** with BOTH count lines present (so a
  real red, not the `--root` false red): committed **648862 bytes · 126
  files · 1126 symbols · 1712 edges** against fresh **648863 · 126 ·
  1126 · 1712**, `files +0 -0 ~3`, every one a `content, loc` change.
  **SYMBOLS AND EDGES ARE UNMOVED AND THE WHOLE REGEN IS +1 BYTE** — the
  new test body is an anonymous arrow in an argument position that
  imports nothing, so it contributes no symbol and no edge. The lane
  forecast that delta and it reproduced exactly; **the endpoints were
  re-derived here rather than carried**, which is the standing rule.
  Regenerated with `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index
  --test self_graph -- --ignored` and `docs/architecture/graph.json` is
  committed with THIS checkpoint at **648863 bytes · 126 files · 1126
  symbols · 1712 edges**, `index --check` exit **0** afterwards. **ONE
  REGEN WAS ENOUGH and that is stated rather than assumed**: every other
  edit in this checkpoint is under `docs/`, which `.nputerignore`
  excludes, and the two indexed dogfood fixtures needed no reconciling
  because no component relation moved — re-confirmed by re-running
  `index --check` after the doc writes, exit 0.
- **BOOT GATE — NOT OWED, derived on 8 paths with 0 matches.** No
  `app/src-tauri/**`, no `app/src/**`, neither manifest. `app/test/**` is
  a GRAPH REGEN trigger and is deliberately NOT a boot trigger — the
  distinction three checkpoints once conflated. No boot check was run
  and none was owed.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the paths as ARGUMENTS,
  ROOT-RELATIVE, never through `xargs`. Five `docs/` paths are code
  inputs and **FOUR suites are owed** — app, tools/e2e, lib/parser AND
  cargo, which joins through `arch.rs`'s read of the component registry.
  All four were run at the merge and all four again after the checkpoint
  doc writes. Both runs report **12 derived readers across 4 suites**,
  **0 frontmatter issues**, a census of **119 docs-shaped sites in 22
  files, 12 of them in 10 files resolving into this repo's docs/**, **24
  files holding the repository root** (11 derived, 0 unlinked, 13 with no
  linkable site), **1 package-relative site, derived**, and the
  root-anchor ledger holding at 6.

## THE CARD'S OWN CENSUS WAS STALE, AND THE REMEDY EXISTS ONE DOCUMENT OVER

T-088's last acceptance criterion reads *"THE DOCS GATE will fire on
`docs/architecture/components/` (five readers, three suites at the
fifth-triage census)"*. **It is SEVEN readers across FOUR suites**, and
the missing suite is `cargo test` — the one no TypeScript reader would
have guessed. The dispatch brief transcribed the parenthetical verbatim,
so the wrong figure travelled from card to brief to session unchecked.

**This is `docs/CONVENTIONS.md`'s own fix having been applied to the
bullet and not to the seat that writes criteria.** That bullet says *"NO
COUNT IS TRANSCRIBED INTO THIS BULLET, AND THAT IS THE POINT"* — it used
to carry the census as digits, claimed twelve where the tree held
eleven, and was green and wrong at two refs. The digits did not
disappear; they moved into the card that cites the bullet. Filed as
**`T-088-s1`**, whose fix is one sentence: a criterion that depends on
the gate's answer should NAME THE COMMAND, not its output — the shape
`index --check`'s own bullet already uses (*"ASK THE GATE INSTEAD OF
PREDICTING"*). It belongs with **T-105**'s sweep and with `T-101-s4`,
which is the identical defect in a quotation rather than a count.

## A NEW FLAKE, AND IT IS THE SECOND THIS CRATE HAS PRODUCED

**Bare `cargo test --no-fail-fast` at the merge exited 101 with exactly
one failure**: `docs_watch::tests::startup_arm_watches_the_initial_root`,
*"expected a docs-changed emit: Timeout"*.

**IT CANNOT BE THE MERGE, AND THAT WAS DERIVED.** `git diff --name-only
9b03ae6..bd5864b -- app/src-tauri/` is **0 files** and the merge carries
**0** manifests or lockfiles. A Rust test cannot change behaviour across
a diff containing no Rust.

**THE HONEST TALLY, in T-061-s4's own shape**: 1 red in **2** full suite
runs; the immediate full re-run was **382 passed / 0 failed / 3 ignored,
exit 0** over 15 `test result:` lines, identical to main's figure and to
both of the lane's runs. The failing body alone was then re-run **5
times: 5 green**. So: **one red in eight observations**, not "it is
fine".

**THE CONDITION IS THE FILING.** The red landed while THREE lanes were
running suites at once — this integration plus T-113 and T-090 in Phase
1 — on top of the human's live `tauri dev`. The body arms an FSEvents
watch on a temp directory and waits for a debounced emit against a
bounded deadline; that is a wall-clock race against machine load, and
three concurrent lanes is now the ORDINARY condition here rather than an
exotic one. **A timing test that only reds when the machine is busy is
worst-behaved exactly when a checkpoint is being written**, and a real
regression arriving in a busy window would read exactly like this.
Filed as **`T-088-s4`** with both arms and the fence (`[app-shell]` —
`docs_watch.rs` is C-10's).

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command.

- **parser: 263/263 across 12 files**, exit **0**; `npm run build` **0**
  first (fresh-clone order); `npx tsc --noEmit` **0**. The live-tree
  smoke moved by exactly one array entry.
- **app: 940/940 across 46 files**, exit **0** — main's 939 plus the one
  new pin body. No new test FILE, so the file count is main's.
- **`npm run build` 0, 269 modules. BOTH bundle hashes UNMOVED from
  main's** — `index-C86RloYb.css` / 45.06 kB and `index-DEkJr3K8.js` /
  526.42 kB — which a zero-bundle-input diff requires. The CSS hash
  holding is the Tailwind content-scan check (v4 auto-scans `app/test`
  too, so a stray utility-shaped word in the new body would have minted
  CSS, and none did). The drill reproduced both hashes in a separate
  worktree, which is an independent confirmation of the build.
- **bare Rust `cargo test --no-fail-fast`: 382 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines — on the SECOND run; see the flake section above for
  the first. Unmoved from main, which a 0-file Rust diff requires.
- **E2E: 135/135**, exit **0**, scratch port **14932**; `npm run
  typecheck` **0**. Adds no spec, so equals main.
- **token lint: selftest 0, lint 0** — TOKEN **131** unmoved (this merge
  adds no `.ts`/`.tsx`/`.mjs` FILE anywhere the lint walks; all three
  code paths are MODIFIED). **CONTROL is 603 at this checkpoint, and the
  621 the last checkpoint recorded is a figure about a different tree** —
  three commits and a triage landed between them. It closes from both
  directions: `9b03ae6` is **598**, the merge adds four tracked text
  files (C-15's registry file and three findings) to make **602**, and
  this checkpoint's own `T-088-s4` makes **603**.
  **AND THE FIRST READING OF IT WAS WRONG, CAUGHT BY MEASURING RATHER
  THAN ASSERTING** — worth one sentence because it will catch the next
  integrator too. Run before the checkpoint was committed, the lint
  printed **602**: CONTROL derives its corpus from `git ls-files`, which
  cannot see an UNTRACKED file, so a finding written but not yet staged
  is invisible to it. **The lint's CONTROL count is a fact about the
  INDEX, not about the working tree** — measure it after the commit, or
  read a number that is short by exactly however many files you have
  just written.
- **`npx tsc --noEmit` and `npx tsc -p tsconfig.test.json`** both run as
  part of `npm run build` from app/, because a green app `tsc` alone is
  not a green build (T-073).

## The poison drill — nine mutants at the lane tip, one side only

Detached scratch worktree at **`a2a691b`** — CONVENTIONS' arm (c). No
`CARGO_TARGET_DIR` hazard applied because no Rust was drilled, and that
is STATED rather than skipped; the app suite needs a build first, so
`node_modules` and `lib/parser/dist` were SYMLINKED in and `npm run
build` run there, reproducing the lane's bundle byte-for-byte.

Every mutation was applied by a Python driver with `encoding='utf-8'`, a
**relative-path refusal**, an **outside-the-drill refusal** and a
match-count-of-exactly-1 guard — all three demonstrated FIRING before
any mutant ran — and every mutated TEXT was read back with `git diff
--unified=0` BEFORE its suite ran. Baselines 18/18 and 4/4.

All nine RED at exit 1: the smoke array back to eleven; the dogfood ids
back to eleven; the declared count 12 → 11; findings losing `D3:C-15`;
the relation table losing `C-15→C-10`; `drift` losing C-15;
`declaredOnly` losing C-15; map nodes 12 → 11; map edges 33 → 32. Plus
the producer-side A7 above.

**THE TWO SAME-BODY PAIRS WERE SHOWN INDEPENDENT RATHER THAN ASSERTED**,
which is the part worth keeping. A5 and A6 both red the drift body, so
"one body reds" would not have shown the two assertions discriminate.
Re-run individually with the assertion text captured, A5 reds on
`expected [ Array(8) ] to deeply equal [ Array(7) ]` and A6 on `expected
[ 'C-01','C-07','C-11','C-15' ] …` — **and A6 reaching its assertion at
all PROVES the first one passed.** That is the hidden-second-assertion
shape demonstrated on the very fixture whose ledger warns about it.

**Restoration proved TWO ways after every mutant** — an empty per-path
`git diff` and a sha256 against `git show a2a691b:<path>` — and again at
the end, where the whole-worktree diff is empty. Symlinks were **UNLINKED
rather than deleted** and all three targets verified present; `app/dist`
removed; the worktree removed and pruned. No `npm ci` or `npm install`
was run anywhere.

## TWO LANES DRILLED INTO ONE PATH — a near miss, recorded as one

**`T-088-s3`, measured live.** T-088 and T-090 both obeyed the POISON
DRILL rule, both independently chose the literal path
`<scratchpad>/drill`, and both wrote a driver to
`<scratchpad>/mutate.py`. The second overwrote the first, and T-088's
own `git worktree list` showed a detached drill at `f20f786` — T-090's
tip, not its own.

**The scratch directory is SHARED between concurrent lanes and its
session UUID makes it look private.** The lane-protocol bullet already
records the sharing as a REPORTING nuisance (expect sibling worktrees in
your list); this is the same fact as a WRITE hazard, which is a
different claim. **And the post-T-085 mechanical guard does not cover
it**: each driver refuses paths outside `<scratchpad>/drill`, and that
prefix is true of BOTH lanes' drills — the refusal was written to ask
*"is this the drill or the real tree"* and silently answers *"is this A
drill"*. What kept it safe was `git worktree add` refusing an existing
path, which protects the CREATE and not the MUTATE. Nothing was
corrupted: T-088's drill was removed and pruned before T-090's existed,
and all nine restorations proved against `a2a691b`. Fix is one line —
name it `drill-T-NNN` and guard that path, not the prefix.

## Two documents ticked, and ARCHITECTURE's slug map was WRONG IN THREE PLACES

- **ARCHITECTURE's slug paragraph gains `app-dispatch` = C-15** — the
  integrator ceremony the lane correctly ROUTED rather than performing,
  since `docs/ARCHITECTURE.md` is not under the fence's
  `docs/architecture/components/`. The T-101 precedent of ARCHITECTURE
  ticks landing at checkpoints, applied.
  **AND THE PARAGRAPH TURNED OUT TO UNDERSTATE THREE SLUGS, derived
  mechanically from every component file's `touch_slugs:` rather than by
  eye**: `app-shell` is **C-05, C-10 and C-11**, not C-05; `app-board` is
  **C-08, C-09 and C-11**, not "C-05 board pane"; `app-map` is **C-12**,
  not "C-05 map pane". A fence computed from that prose would call two
  overlapping cards DISJOINT — the exact failure a fence exists to
  prevent, and the reason F-04's own decomposition pass flagged
  `app-shell` as a false-conflict fence. The derived table is now in the
  paragraph as a stopgap, with the authority named (the field, never the
  prose) and the real fix routed: this is `T-089-s7`'s row-5 finding
  riding **T-104**, and T-111's frontier should COMPUTE the map rather
  than read it.
- **The Components table deliberately does NOT gain a C-15 row.** It
  stops at C-07 and C-08–C-14 have never been in it; the components/
  directory is their home. Checked rather than assumed.

## The board, derived from disk at this checkpoint

**165 flat task files — 73 done / 46 planned / 40 parked / 4 suggested /
2 building / 0 verifying; 26 in `rejected/`.** The two `building` are
T-113 and T-090, the live lanes. **The four `suggested` are all
T-088's** — the backlog reached zero at the seventh triage and this card
is what restarted it.

**Twelve component files on disk**, C-01 and C-05–C-15.

**73 done cards — 56 `same-model`, 11 `self-verified`, 5 `independent`,
1 EMPTY (T-056)**; 56 + 11 + 5 + 1 = 73. T-088 moves `self-verified`
from 10 to 11 and is the first size-S self-integration since the
ceremony carve-out was written down.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal. Holder `node`
pid **82549**, one socket `TCP [::1]:1420 (LISTEN)`, identical
throughout.

1. **NOTHING RELAUNCHED AND NOTHING HOT-SWAPPED, and this is the third
   distinct case that distinction has produced.** BOOT GATE is NOT owed
   here, and the relaunch trigger is not owed either: `tauri dev`
   restarts the Rust binary on `app/src-tauri/**` changes and vite HMRs
   `app/src/**` into the running webview — **this merge is `app/test/**`
   and `docs/` only, so it touches NEITHER**. The human's app is
   unchanged by the merge itself.
2. **The map pane DOES see something new, and it is the whole point of
   the card.** `docs/architecture/graph.json` moves 648862 → 648863
   bytes with 126 files, 1126 symbols and 1712 edges all unmoved, so no
   node or edge moves on the reality side — but the INTENT side gains a
   component: the architecture lens will render **twelve** nodes where
   it rendered eleven, with C-15 in the declared-only treatment (`declared
   · no files yet`), a fourth D3 ring, and one new planned edge to C-10.
   That arrives through C-10's ordinary docs watcher, because
   `docs/architecture/components/*.md` is watched content.
3. **`app/dist` WAS rewritten** by the pre-suite `npm run build`, with
   both hashes unchanged — vite dev does not serve from `dist`.

**No process from this integration survives.** Two scratch ports were
used — **14930** and **14931** in the lane, **14932** at the merge —
each read with `lsof -nP -iTCP:<port> -sTCP:LISTEN` FIRST (zero rows)
and then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::`
in that order and never the reverse, and free again after. None is 1420
and none is the default 14520. **No `pkill` at any point.** No `npm ci`
or `npm install` was run in the main checkout or anywhere else during
integration. The T-090 and T-113 worktrees were never touched, nor was
T-090's drill worktree. The two `nputer-T-060` `fake_agent` orphans are
unchanged and left alone. **The untracked zero-byte file `z`** still
sits in the main checkout — not mine, not staged, left alone for the
fifth checkpoint running.

**No real model call was made and no screen-control probe was run.**
Verification is headless throughout and T-088 owes no @human look.

## Provenance — and the trailer told its lie again, from a third seat

T-088 is **built and integrated by `claude-opus-5`, SELF-DECLARED**,
`review: self-verified`. **The commits on this branch carry
`Co-Authored-By: Claude Fable 5`** — a harness constant instructed by
the environment, disagreeing with the session's own declaration inside
the same session. That is now the THIRD independent confirmation of
T-085's proof, after T-101's thirteen-of-fifteen split: `built_by:` is
filled from what the session DECLARES, never from what its commit
signature says, and reading it off your own trailer is how this goes
wrong every time.

## In progress / broken right now

**NOTHING IS BROKEN. TWO LANES ARE LIVE** — see the top of this file.
Parser, app, Rust, E2E, token lint and its selftest, the graph-currentness
gate and the docs gate are all green at this checkpoint; **GRAPH REGEN
and DOCS GATE fired and were run, BOOT GATE was derived NOT OWED.** The
one red seen anywhere in this integration is the `docs_watch` flake
above, reproduced green 6 times out of 7 subsequent observations and
provably not caused by a merge with a 0-file Rust diff.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1126 SYMBOLS / 1712
EDGES / 648863 BYTES / 126 FILES** — and note the symbol and edge counts
are UNMOVED from the last checkpoint while the byte count moved by one.
**Forecast the DELTA, re-derive the endpoints.**

**AND THE NEXT INTEGRATOR INHERITS A NON-TRIVIAL LEFT ENDPOINT FOR THE
FIRST TIME IN THIS ROUND.** T-113 and T-090 were both cut from `9b03ae6`
and main is now `bd5864b` plus this checkpoint, so their forbidden
two-dot ranges will carry T-088's 8 paths as pure drift. The prescribed
`merge-tree` form is the only one that will be right.

## Next up

1. **T-113 and T-090 are in flight** and both hold fences that block
   real work — `app-agent` gates `T-101-s1`'s four-line deletion and
   `T-089-s1`'s method bump; `docs/CONVENTIONS.md` gates `T-088-s1`,
   `T-088-s3` and `T-088-s4`'s own fixes. Integrate them before
   dispatching into those fences.
2. **F-04's slice is now unblocked at its head.** `T-110` (the lane
   reader) carries `blocked_by: [T-088]` and that block is CLEARED by
   this checkpoint; its fence `app-dispatch` exists and is free for the
   first time. T-111 (frontier, `app-board`) and T-112 (brief assembler,
   `app-dispatch` + `app-board`) follow it in order.
3. **`T-088-s1` should be folded into T-090 if it is still open** — that
   lane already owns the docs gate's contract and its fence includes
   `docs/CONVENTIONS.md`, so absorbing a "name the command, not its
   output" sentence needs no widening. Same argument that put
   `T-101-s3` there.
4. **`T-088-s4` is the second flake this crate has produced** and the
   first that reds under a condition this project now creates on
   purpose. Three concurrent lanes is the plan, not an accident.
5. **`T-088-s2` is cheap and removes a class**: four `it()` titles carry
   counts nothing can pin. Rename them to name the property.
6. **`T-101-s1` is still the sharpest thing on the board** — the
   `exitNonZero` path double-reports a refusal today, in shipped code,
   with a written four-line fix. It waits on `app-agent`.
7. **`T-089-s1` is still owed**: the method version bump to v0.1.6, a
   three-file commit whose third file is Rust. Also `app-agent`.
8. **@human owes T-101 one look** — the denial notice, already
   hot-swapped into the running window. Unchanged by this checkpoint and
   still the only outstanding @human item.
