# State

Updated: 2026-08-24 by integrator (T-101 merged and checkpointed), then
amended by the architect through the SEVENTH TRIAGE (`6f2f8ea`).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: there are NO LIVE
LANES.** `git worktree list` returns one entry, the main checkout —
T-101's is removed in the same breath as this commit, in the order
lane-protocol rule 6 fixes (merge, then checkpoint, then remove) — and
zero cards sit at `status: building` or `status: verifying`. Every fence
in ARCHITECTURE's slug table is free. This checkpoint is the end of a
long session and is written as a handoff rather than as a merge note —
what landed today is below, what is queued is at the bottom, and the four
institutional findings that outlive this card have their own sections.

## Just completed

**T-101 — the denial notice reaches the screen, and suppression is PER
DENIAL so a nameless refusal is no longer swallowed with the whole
notice.** F-03, milestone 4, size M, `touches: [app-interview]`, fence
never widened — **deliberately, and the ruling on that refusal is the
most portable thing in this checkpoint.** Built by `claude-opus-5
@T-101` then rebuilt by a SECOND executor (`claude-opus-5
@T-101-rebuild`) after rejection; verified by `claude-opus-5` across TWO
passes; `review: same-model`. **REJECTED on the first verdict — three
blocking findings, all on the last criterion — APPROVED on the second.**
Both verdicts are on the card and both note passes are preserved
(the rebuild is APPENDED, not rewritten). Main-before **`9949250`**,
approved tip **`526b311`**, merge **`5b80d32`**; the card was
`verifying` and this checkpoint stamps **`done`**.

**WHAT LANDED.** T-081 shipped the FACT of a refusal: the CLI's in-band
`permission_denied` line became a classified `RunEvent::Denied`, crossed
the `genesis-turn` channel, and landed on `GenesisTurn.denials` in
arrival order, joined on `tool_use_id`, bounded and control-stripped.
**No component read that field** — the notice a human would see lives in
C-13, and T-081's fence was `[app-agent]`. So a refusal was a datum in
memory nobody could ever see, and T-081's own @human question had
nothing to look at. T-101 is the render half: a `DenialNotice` inside
`PlannerTurn`, below the activity line and OUTSIDE the `running` guard,
in the existing quiet furniture register and deliberately never in
`FailureBlock`'s treatment — **because a denial is not a death**. The
measured real turn carried two `Bash` refusals and finished
`is_error: false`, `terminal_reason: "completed"`; it now renders as two
rows on a turn whose status still reads COMPLETED. One row per DENIAL
and never per tool; `toolUseId` rides as `data-tool-use-id` and the list
is not deduped.

**THE SHARP HALF IS WHERE SUPPRESSION IS KEYED, AND THE CARD GOT IT
WRONG FIRST.** Criterion 7 licenses hiding *the same refusal* when the
terminal `toolDenied` block already names it. The first build spelled
that `planner.error?.kind !== "toolDenied"` — a WHOLE-NOTICE gate — and
it over-suppressed to ZERO: `TurnError::ToolDenied`'s `denials` is built
by `denial_names`, a `filter_map` over `tool_name`, so a refusal the CLI
never named contributes nothing to the failure block AND was then
dropped from the notice, putting it on no surface at all. Two refusals
in the store, one on screen — and the silent one is precisely the one
the runner announces because, in its own words at that partition, *"a
repeat is a nuisance, a silence is the defect this card exists to fix"*.
The gate recreated that silence one layer up. `visibleDenials(denials,
error)` now suppresses **per denial**, keyed on `error.denials` — the
TYPED array `FailureBlock` actually restates, twice (`failureAction`'s
`listOf` and `failureDetail`'s `join`) — so suppression tracks WHAT IS
ON SCREEN rather than what KIND of error it was. The notice can lose a
row; it can never lose the notice. `denialToolName` gives the printed
name and the suppression key ONE owner (T-057's rule), which also closed
the first half of `T-101-s2`.

**NINE PATHS — 3 `app/`, 6 `docs/tasks`.** 5 added / 4 modified, 2280
insertions, 8 deletions. No Rust, no IPC, no store change (`agent-store.ts`
is a 0-file diff), no grant, no manifest, no lockfile, no `tokens.css`.

## THE FENCE RULING — the most important thing this merge carries forward

The verifier's line, and it generalises well past this card:

> **Widen when the fence makes THIS CARD'S OWN criterion unbuildable.
> Route when it makes a NEIGHBOURING defect unfixable.**

T-013 sits on the first branch — its criterion needed a subprocess, a
subprocess needs a Tauri command, registering one edits `lib.rs`, so the
criterion could not exist inside the fence and both widenings were ruled
correct. **T-101 sits on the second, and `app-agent` was FREE at the
time**, so "was the fence available" is demonstrably not the test.
Criterion 7's literal antecedent (*the denial notice and the terminal
`toolDenied` error*) is fully buildable in fence and IS built, pinned by
two mutants no other body kills. The `exitNonZero` double report is a
defect on a NEIGHBOURING surface that this card's renderer merely made
visible.

**THE VERIFIER CHECKED THE THREE IN-FENCE SUBSTITUTES RATHER THAN
ACCEPTING THEM**, and all three are independently forbidden by rules
already written down: text-matching the tail would put a copy of a
`runner.rs` `format!` string in `interview-model.ts` (T-057, and
`FailureBlock`'s own header says *"NOTHING HERE PARSES THE ERROR TEXT"*);
the ring is genuinely bounded (`MAX_STDERR_RING = 64 * 1024`), so a
prefix-keyed renderer can un-suppress at random on a chatty CLI; and the
empty-`message` proxy is genuinely ambiguous, because the runner's own
fixtures produce an in-band denial with an empty message too. So there
was no honest in-fence fix to decline.

**THE LIMITS, AS THE VERIFIER STATED THEM, so the precedent is not
over-read.** Routing instead of widening is right only when all three
hold: **(a)** no criterion of the card is left unbuilt; **(b)** every
in-fence alternative is forbidden by a rule already written down, not
merely unattractive; **(c)** the gap is disclosed **IN THE CODE** and
routed in a finding carrying the mechanism, the fix, the fence and the
pin. **Absent any one of those, routing is evasion.** And the verifier
drew the distinction from its own rejection: it rejected the first build
because that build **denied the defect existed** — `T-101-s1` asserted
the two surfaces were disjoint and that a double report would need
T-081's narrowing to be reverted. Shipping a defect you have reproduced,
mechanised, routed and named in the code is a different act from
shipping one you have argued away.

## THIS MERGE SHIPS A KNOWN DEFECT, AND THE RECORD MUST LET A READER TELL WHICH KIND

**On the `exitNonZero` path a single result-only refusal is reported
TWICE** — once as a live notice row and again inside `stderrTail`, where
`runner.rs` pushes `permission_denials: <names>` for the same
`unannounced` vector it emits live `Denied` events from. It is real
today, on this tree, at this commit. **It is DISCLOSED, not hidden**:
named in `visibleDenials`' own doc comment with its mechanism and the
reason no in-fence key exists, named in the card's rebuild notes, named
in the second verdict's ruling, named in ARCHITECTURE, and routed as
**`T-101-s1`** — REWRITTEN rather than amended (new title, new filename,
`suggested_by` moved to the verifier who found the mechanism), carrying
the reproduction, the `app-agent` fence, the four-line DELETION that
fixes it, the pin it should ship with, and the three reasons a
render-side key is wrong. A shipped known defect that is disclosed is a
different thing from one that is hidden; **this is the first kind**, and
this paragraph exists so no later reader has to work that out.

## `T-101-s4` — A QUOTED RULE THAT DOES NOT EXIST, AND I PROPAGATED IT

The rebuild's fence argument grounds itself on a quotation attributed to
`method/roles/executor.md`:

> *"A criterion that cannot be built inside the fence is NOT built.
> Record it, route it as a suggestion naming the fence it needs, and
> build the rest. Widening the fence from inside the lane is the one
> repair this role may never make."*

**That file is 19 lines and contains neither "fence" nor "widen".**
Re-derived here: `grep -in "widen\|fence" method/roles/executor.md`
exits 1 with no output, `wc -l` says 19, and `git grep "may never make"`
from the ROOT finds it in the T-101 card and its own finding and nowhere
else in the tree.

**THE VERIFIER FOUND THE CAUSE AND IT EXONERATES THE EXECUTOR.**
`method/lane-protocol.md` **did not exist in that lane** — it landed
with T-089's merge, AFTER the cut at `a15b78e` (`git cat-file -e
a15b78e:method/lane-protocol.md` fails; at main it succeeds). An
executor reasoning correctly about a REAL rule reached for the only role
file its worktree had and put quotation marks around a paraphrase. The
substance is written down twice on main — `executor.md` step 5
(*"suggestions never expand your scope"*) and `lane-protocol.md` rule 5
(*"record it, route it, and build the part that fits. A fence is not
widened from inside the lane it fences"*) — so the argument rests on
real authority and the ruling is unchanged by the mis-citation. The
defect is quotation integrity.

**AND THE PROPAGATION IS MINE TO RECORD.** This integrator's dispatch
brief relayed that quotation to the verifier without checking it, so the
architect propagated it too — the same failure one layer up, in the same
session, and the reason the verifier met it at all. A quotation is a
claim; relaying one is asserting it. `T-101-s4` is filed with the fix
(re-cite to `lane-protocol.md` rule 5, which exists in the tree from
this merge onward), and **the brief-writing seat is the second place
that needs it**, not only the card.

## The other two residuals of the delivered artifact, and one confirmed three ways

All five findings exist as real FILES with legal frontmatter — checked,
because T-061's integrator found verdict findings left as card-body text
and every integrator since has had to check. `T-101-s1` and `T-101-s2`
carry `suggested_by: verifier claude-opus-5 @T-101-verify` after the
rebuild moved the attribution; `s3`, `s4` and `s5` are the verifier's own.

- **`T-101-s5` — the verifier's own surviving mutant, and I reproduced
  it at the merged tree.** Point `visibleDenials` at `denial.toolName`
  while `denialLine` keeps calling `denialToolName` — the exact
  two-owner split that function's doc comment exists to prevent —
  and the suite is **45/45 exit 0** on the changed file, which is
  **939/939** whole-suite. No fixture has a name needing normalisation
  that also appears in `error.denials`, so nothing can see the split. It
  is unobservable in production (`denial_field` trims Rust-side and
  `denial_names` clones an already-trimmed name) and is not a criterion
  violation — with one owner the spelling is identical by construction.
  Filed, non-blocking, and now measured by three pairs of hands.
- **`T-101-s2`** — the `toolName` half is CLOSED in fence
  (`denialToolName` trims and maps empty to `null`, pinned by a
  degenerate row spelled `"   "` rather than `""` on purpose: `""` is
  falsy and reds only a `??`-shaped mutant, `"   "` reds a trim-less one
  as well, so whitespace strictly dominates). The MESSAGE half stays
  open — a message of only U+200B survives `.trim()`, because the
  zero-width space is not ECMAScript `WhiteSpace` — and the honest close
  is one rule shared with the identical `.trim()` on `failureDetail` one
  function up.
- **`T-101-s3` IS NOW CONFIRMED THREE TIMES AND STILL HAS NO OWNER.**
  `docs-gate.mjs` filters on `p.startsWith("docs/")`, so a `./`-prefixed
  or ABSOLUTE spelling of a path that owes three suites is answered
  *"none under docs/ — this gate is not owed"* at exit **0**. Filed on
  T-101's branch, reproduced by T-085's integrator on a different path,
  and re-derived here. It belongs with **T-090**, whose fence
  (`[tools/e2e, .github/, docs/CONVENTIONS.md]`) already contains it, so
  absorbing it needs no widening. It is the THIRD leak of one contract —
  `T-084-s6` the empty list, T-090 the `xargs` collapse, this the
  unresolvable non-empty list. **Root-relative paths were used
  throughout this integration, deliberately.**

## TWO TECHNIQUES THIS SESSION ENDORSED — written here, not left in a verdict

Both were invented in a lane and confirmed independently by the
verifier. They are recorded in STATE because the next lane will meet the
problem and will not read this card.

**1. MERGE-FORECAST BY THROWAWAY `commit-tree`.** To answer "what will
the graph gate say AFTER the merge" without writing a commit or moving a
ref: build the merge tree with `git merge-tree --write-tree`, wrap it in
a `git commit-tree` with BOTH parents, check that out DETACHED with its
own `CARGO_TARGET_DIR` inside it, and run the gate there. The executor
did it at main `1aa7137` and the verifier reproduced it at `2ea1d27`,
two merges later. **Both got `files +0 -0 ~3`, `edges +12 -3`, delta +6
symbols / +9 edges — identical — while the ENDPOINTS moved (1023→1029 at
the lane ref, 1120→1126 at the merge).** This integrator then measured
the real thing at the real merge and got **1120 → 1126 symbols, 1703 →
1712 edges, the same `files +0 -0 ~3` and `edges +12 -3`**. Three
forecasts went stale in their ABSOLUTES this session and none went stale
in its DELTA. **Forecast the delta; re-derive the endpoints.** Hygiene:
the throwaway commit is contained by no branch (73 refs before and
after), and the scratch worktree and its target dir are removed.

**2. PORT PROBING — `lsof` IS THE AUTHORITY AND `bind()` IS THE
CONFIRMING HALF, IN THAT ORDER.** Every brief this session had the order
backwards. Measured from first principles by the verifier on a port left
with client-side TIME_WAIT peers: `lsof -nP -iTCP:<port> -sTCP:LISTEN`
returns **zero rows**, a plain `bind()` WITHOUT `SO_REUSEADDR` still
fails **EADDRINUSE**, and a real listener (node and vite set
`SO_REUSEADDR` by default on POSIX) binds it fine. So a bind probe calls
a usable port BUSY. **AND UNFILTERED `lsof` IS EQUALLY BLIND** — it
returns zero rows too, because a TIME_WAIT socket has no owning process,
so `netstat`/`ss` is the only tool that can see it and dropping the
`-sTCP:LISTEN` filter "to be safer" buys nothing. The rebuild hit the
false red for real (port 14768 reported BUSY seconds after the lane, all
four stacks FREE moments later). This integration probed `lsof` FIRST on
every scratch port and used the bind probe only to confirm.

## `built_by:` — the model string was WRONG AGAIN, and the trap is sharper here than at T-085

The frontmatter read **`built_by: claude-opus-4.8 @T-101 (rebuilt after
rejection by claude-opus-5 @T-101-rebuild, …)`**, which already named
both passes (T-081/T-084/T-085's precedent applied) — **but the first
executor's model string was a copy of its own commit signature, not a
fact.** T-085's integrator proved that `claude-opus-4.8` in that field
is a harness commit-trailer CONSTANT; this lane makes the proof
sharper, because the counterexample is inside the lane itself:

**the trailer `Co-Authored-By: Claude Opus 4.8` sits on THIRTEEN of the
fifteen commits on this branch — INCLUDING ALL FIVE the SECOND EXECUTOR
wrote**, and that executor self-declares `claude-opus-5 @T-101-rebuild`
in the very notes those commits carry. A trailer that disagrees with its
own author's self-declaration WITHIN one session is a harness constant.
(The verifier's two commits carry `Claude Opus 5`, which is the same
fact from the other side: the trailer tracks the harness, not the
model.) This integrator is again the live counterexample — running as
`claude-opus-5` under a harness that instructs the `Claude Opus 4.8`
trailer on every commit, including the two written today. `built_by:` is
corrected to **`claude-opus-5 @T-101 (re-built after the rejection by
claude-opus-5 @T-101-rebuild, 2026-08-24)`** and `verified_by:` widened
to name both verification passes.

**THE HONEST LIMIT OF THAT CORRECTION**, stated because the last one was
not: what is PROVEN is that the trailer is not evidence of a model, and
that the string's only provenance in this card is the trailer. Nothing
here reads the first executor's model directly. The correction rests on
the trailer being non-evidence plus T-085's precedent — **a session's
model belongs in the field only if the session declared it, and reading
it off your own commit signature is how this goes wrong twice.**

## Ranges, every dot count stated, at their own refs

Main-before **`9949250`** (T-085's checkpoint, **verified as the tip at
start** rather than inherited), approved tip **`526b311`**, merge-base
**`a15b78e`** (T-070's checkpoint — the lane's own base, unmoved across
two verdicts and FIVE main advances).

    git merge-tree --write-tree 9949250 526b311 -> tree d93877fe…, exit 0 (read from $?)
    git diff --name-only 9949250 <TREE>                       -> 9   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 9949250...526b311   (THREE dots)     -> 9
    git diff --name-only a15b78e..526b311    (TWO, branch-only) -> 9
    git diff --name-only 9949250..526b311    (TWO dots)       -> 77  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only a15b78e..9949250    (main's advance)  -> 68
    git diff --name-only 9949250..5b80d32    (TWO dots)       -> 9   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 9949250...5b80d32   (THREE dots)     -> 9   COLLAPSES
    git diff --name-only a15b78e..5b80d32    (merge-base..merge) -> 77  FORBIDDEN AT THE MERGE TOO

`git merge-base --is-ancestor 9949250 5b80d32` exits **0**, so at the
merge two dots and three dots COLLAPSE (both 9). **THE FORBIDDEN COUNT
IS 77 AND IT IS PURE LEFT-ENDPOINT DRIFT**: main advanced **68** paths
from the cut, the branch **9**, `comm -12` over the sorted lists is
**EMPTY**, and 68 + 9 = 77 — the arithmetic that proves the two sets
disjoint. The forbidden count is the SAME 77 before the merge and at it,
by two different mechanisms, which is why the ban names the PAIR and not
the punctuation. **The branch's own figure went 3 → 5 → 7 → 9 across five
main advances while the forbidden one went 24 → 52 → 68 → 75 → 77**; the
lane re-derived at every one of them.

**THE FORECAST WAS EXACT AND WAS CHECKED THREE WAYS.** The staged merge
tree equalled the `merge-tree` forecast byte-for-byte (`git write-tree`
== `d93877fe…`), the merge's own `HEAD^{tree}` IS that tree, and `cmp`
over the pre-merge path list against the merge's own diff exits **0**.
Parents are `9949250` and `526b311` and nothing else. **NOTHING WAS
WRITTEN INTO THE MERGE COMMIT**; every integrator edit is in this
checkpoint.

## THREE standing gates — DERIVED from the merge's own nine paths

`grep -n "at any merge whose diff" docs/CONVENTIONS.md` returns exactly
**3** (lines 592, 717, 746), the mechanical enumeration the brief
contract prescribes. **ALL THREE FIRE**, the first checkpoint in several
where none is derived away.

| gate | trigger | on these 9 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **3 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES**, three suites |

- **GRAPH REGEN — FIRES on the three `.ts`/`.tsx`, AND IT IS A REAL
  MOVE.** At the merge `cargo run -p nputer-index -- index --check
  --root ../..` from app/src-tauri exits **1** with both count lines
  present (so not the `--root` false red): committed **645482 bytes ·
  126 files · 1120 symbols · 1703 edges** against fresh **648862 · 126 ·
  1126 · 1712**, `files +0 -0 ~3`, `edges +12 -3`. **THE LANE'S
  FORECAST REPRODUCED EXACTLY AT MY OWN BASE** — the same `files` and
  `edges` lines, the same +6/+9. Regenerated here with
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph
  -- --ignored`, and `docs/architecture/graph.json` is committed with
  THIS checkpoint at **648862 bytes · 126 files · 1126 symbols · 1712
  edges**, `index --check` exit **0** afterwards. **ONE REGEN WAS
  ENOUGH and that is stated rather than assumed**: the checkpoint's
  other edits are all under `docs/`, which `.nputerignore` excludes, and
  the two indexed dogfood fixtures did NOT need reconciling because no
  component relation moved — re-confirmed by re-running `index --check`
  after every doc write, exit 0 each time. The new symbols are
  `denialLine`, `denialToolName`, `visibleDenials`, `DenialNotice` and
  two in the test file; every new edge's endpoints sit inside C-13 and
  C-14, so no component relation moved and the registry still stops at
  C-14.
- **BOOT GATE — FIRES on 2 of 9** (`interview-model.ts` and
  `interview-turns.tsx`; the `app/test/` file is a GRAPH REGEN trigger
  and NOT a boot trigger). `NPUTER_BOOT_PORT=14922 npm run boot:check`
  from tools/e2e exits **0** with both lines verbatim — *[nputer]
  project folder: /Users/ujju/Projects/nputer* and *[nputer] window
  "main" created*.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the paths as ARGUMENTS,
  ROOT-RELATIVE, and never through `xargs`. On the range rule's own six
  `docs/` paths: **three** suites owed — app, tools/e2e, lib/parser —
  and NOT cargo, because neither `docs/CONVENTIONS.md` nor
  `docs/research/captures/` is in the merge's diff. Re-run AFTER the
  checkpoint doc edits (T-081-s9) on this commit's own FIVE `docs/`
  paths — STATE, ROADMAP, ARCHITECTURE, the regenerated `graph.json` and
  the task card: the same three suites owed, cargo still not joining,
  because this checkpoint does not touch `docs/CONVENTIONS.md`. Both runs report **12
  derived readers across 4 suites**, **0 frontmatter issues**, a census
  of **119 docs-shaped sites in 22 files, 12 of them in 10 files
  resolving into this repo's docs/**, **24 files holding the repository
  root** (11 derived, 0 unlinked, 13 with no linkable site), **1
  package-relative site, derived** (T-085's live instance, printed as a
  `climb` line with where it landed), and the root-anchor ledger holding
  at 6 entries.
  **AND THE SECOND RUN CAUGHT ME, WHICH IS THE FIRST TIME THIS GATE HAS
  FIRED ON AN INTEGRATOR'S OWN EDIT.** Widening `verified_by:` to name
  both verification passes, I wrote *"(two passes: rejected 2026-08-23,
  approved 2026-08-24)"* — and a `: ` inside a YAML plain scalar opens a
  nested mapping, so the card stopped parsing: `1 frontmatter issue(s)`,
  *"Nested mappings are not allowed in compact mappings at line 13"*,
  naming the FILE, the FIELD and the column. Fixed with an em dash and
  re-run to `0 frontmatter issue(s)` before anything was committed.
  **This is `9c64cd8` and `fede266` exactly — the two incidents the gate
  was built for — arriving a third time, from the seat that writes the
  checkpoint.** Without the gate the app suite would have gone 938 of
  939 on a commit whose entire failing input is one markdown field, and
  the next executor would have found it three layers from the cause.
  Note what did NOT save me: the YAML is legal-looking, the frontmatter
  is short, and I had just read the block. Run the gate after the doc
  edits; do not read them.
  **ALL THREE OWED SUITES RE-RUN AFTER THE DOC WRITES AND GREEN**
  (T-081-s9): parser **263/263** exit 0, app **939/939** over 46 files
  exit 0, e2e **135/135** exit 0 on scratch port **14923** — every
  figure identical to the merge run, so no reader has to decide which
  run a number came from. **And the run that validates the sentence you
  are reading is the LAST of them**, on scratch port **14924**, because
  `docs/STATE.md` is itself a docs code input owing exactly one suite.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command. `timeout` is absent from this shell.

- **parser: 263/263 across 12 files**, exit **0**; `npm run build` **0**
  FIRST (fresh-clone order); `npx tsc --noEmit` **0**. Unmoved from main
  — this merge adds no parser input and the card's `status:` is legal,
  so the live-tree smoke does not move.
- **app: 939/939 across 46 files**, exit **0**, **and it closes from
  both directions.** From main: `9949250` was 933/933 over 46, and the
  lane adds **6** net-new bodies, so 933 + 6 = 939. From the lane: base
  `a15b78e` 857 → tip 863 is the same +6, and the arithmetic closes at
  both refs. No new test FILE, so the file count is main's.
- **`npm run build` 0, 269 modules. THE CSS HASH IS UNMOVED at
  `index-C86RloYb.css` / 45 061 bytes** (sha256 `eaf428df…`), which is
  the Tailwind content-scan check — Tailwind v4 auto-scans `app/test`
  too, so a stray utility-shaped word in the new component OR the new
  test would have minted CSS, and none did. The JS is
  `index-DEkJr3K8.js` / 526.42 kB, moved from main's `index-15GtSLaz.js`
  because both source files are bundle inputs. **The lane's own hash
  `index-CwYF5FQb.css` / 43.95 kB does NOT reproduce here and must
  not** — it is the hash at `a15b78e`, before main's own app work
  landed; the invariant that carries is "unmoved from MY main-before",
  not the digits.
- **bare Rust `cargo test --no-fail-fast`: 382 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. **The T-061-s4 kill-path flake did NOT fire — honest
  tally 1 of 1 green, no re-run performed and none needed.** Unmoved
  from main, which a 0-file Rust diff requires.
- **E2E: 135/135**, exit **0**, scratch port **14921**; `npm run
  typecheck` **0**. Adds no spec, so equals main.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 131 …; CONTROL 621
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8
  evidence-floor.
- **`cargo audit -n`** exit **0**, 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved — which a 0-file `Cargo.lock` diff
  requires.
- **`npx tsc --noEmit` 0 AND `npx tsc -p tsconfig.test.json` 0** from
  app/ — both programs, because a green app `tsc` alone is not a green
  build (T-073).

## CONTROL closes from BOTH directions, and TOKEN does not move

Re-derived at five refs by re-implementing the lint's own corpus rule
(`git ls-tree -r`, minus `SKIP_DIRS`, minus `CONTROL_BINARY_EXTENSIONS`,
IMPORTED from `token-scan.mjs` rather than retyped):

    a15b78e  581     2ea1d27  616     9949250  616
    526b311  586     5b80d32  621

**From main:** 616 + the five findings this merge adds = **621**, and
the lint printed 621. **From the lane:** 586 + main's advance
(581 → 616, +35) = **621**. The two directions meet. **The dispatch
brief's approved-tip figure of 586 was RIGHT this time** — the previous
brief was one commit stale on the same field, so the figure was checked
rather than trusted.

**TOKEN is 131 and does not move**: the merge adds **zero**
`.ts`/`.tsx`/`.mjs` FILES under `app/src`, `app/test` or `tools/e2e` —
all three code paths are MODIFIED — so the figure is main's, carried
through.

## The poison drill — at the MERGED commit, arm (c), six mutants and the verifier's survivor

Detached scratch worktree at **`5b80d32`** — CONVENTIONS' arm (c). No
`CARGO_TARGET_DIR` hazard applies because no Rust is drilled, but the
app suite needs a build first (six files read the shipped bundle), so
`node_modules` and `lib/parser/dist` were SYMLINKED in and `npm run
build` run there. **The drill reproduced the merge's bundle
byte-for-byte** — `index-C86RloYb.css` and `index-DEkJr3K8.js` — an
independent confirmation of the build. **Correspondence by hash before
any mutation**, three copies each (drill / `git show 5b80d32` / main
checkout), all agreeing and all matching the hashes the rebuild AND the
verifier published: `interview-turns.tsx`
`28c6c5f802aa0c16474fd46529092f0447b7423ecd554fcd2ad13e4d1526d699`,
`interview-model.ts`
`fc2e2d434b9edb73636ea2a29782f52c80a36b4fdc923109c3e7b7ac8267850e`,
`interview-chat-dom.test.tsx` `e73ecd95…4dd2a1b0`.

Every mutation ONE SIDE ONLY (producer, never the assertion), applied by
a Python driver with `encoding='utf-8'`, an **ABSOLUTE-path refusal**
and a match-count-of-exactly-1 guard, and every mutated TEXT read back
with `git diff --unified=0` BEFORE its suite ran. Baseline on the
changed file **45/45, exit 0**.

| # | mutant (producer side only) | exit | tests | reds |
|---|---|---|---|---|
| N1 | the REJECTED whole-notice gate restored | 1 | 44/45 | **per-denial body only, at `:1057`** |
| N7 | keep ONLY the nameless on `toolDenied` | 1 | 44/45 | **per-denial body only, at `:1090`** |
| N3 | `denialToolName` returns the raw `toolName` | 1 | 44/45 | **degenerate body only** |
| V7 | `DenialNotice` dedupes by `message` | 1 | 44/45 | **identical-pair body only** |
| M1 | `DenialNotice` dedupes by `toolName` | 1 | 43/45 | MEASURED TURN **+ identical pair** |
| N-J | key on `denial.toolName`, printer keeps `denialToolName` | **0** | **45/45** | **SURVIVES — `T-101-s5`** |

**THE ARM-INDEPENDENCE CLAIM REPRODUCES BY LINE NUMBER, WHICH IS THE
PART WORTH HAVING A THIRD TIME.** N1 and N7 both red the same BODY, so
"one body reds" would not have shown the two arms discriminate. They red
at **different assertions — `:1057` and `:1090`** — exactly the pair the
verifier reported. A rule keyed on namelessness passes arm 1 and dies on
arm 2; arm 2 is not arm 1 restated.

**THE M1 CORRECTION HOLDS AND THE COMPLEMENT SURVIVES IT.** The first
build recorded M1 as reding *"MEASURED TURN only"*; the rebuild's new
identical-pair body also refuses a name dedupe, so M1 now reds TWO. V7
reds the pair body ALONE, which is what makes that body a pin rather
than M1 restated — the shape-six question asked and answered.

**N-J IS THE VERIFIER'S DISCLOSED SURVIVOR AND IT SURVIVES HERE TOO**,
at 45/45 exit 0 on the changed file. That is `T-101-s5` reproduced by a
third pair of hands at the merged tree.

**Restoration proved THREE ways after every mutant and again at the
end**: empty `git diff` over the whole worktree, sha256 against
`git show 5b80d32:<path>`, and a clean re-run at **45/45 exit 0**. The
drill's symlinks were **UNLINKED rather than deleted** and all three
targets verified present afterwards; `app/dist` removed; the worktree
removed and pruned; the MAIN checkout's `git status` unchanged
throughout. **T-085's `perl -i` accident did not recur, and the reason
is mechanical rather than careful**: the driver REFUSES a relative path
outright, so a command that does not name the drill cannot run at all.
No `npm ci` or `npm install` was run anywhere.

## Security sweep — every figure re-derived at the merged tree

The merge touches **zero** files under `app/src-tauri/`, so most of this
is a property of the diff; it was measured anyway.

- **`acl_pin.rs` is a 0-file diff at sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**,
  the pinned value, unmoved. `EXPECTED_GRANTS`: declaration line 54,
  closing `];` line 147, entries 55–146 = **92**, zero blank or comment
  inside, 92 quoted strings / 92 UNIQUE quoted strings.
- **IPC 14/14, derived from BOTH ENDS and reconciled by NAME.**
  Attributes `git grep -cE "^[[:space:]]*#\[tauri::command\]"` summed =
  **14**; `generate_handler![…]` with `//` stripped per line and split
  on commas = **14**; **`comm -3` over the two sorted NAME lists is
  EMPTY**. `repo_churn` (T-013) is still the fourteenth.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, line-anchored: `perf.rs:53`,
  `self_graph.rs:58`, `agent_runner.rs:3767`, all three carrying
  `= "reason"`.
- **0 manifests, lockfiles, capability files, `.entitlements` or
  `tokens.css`** in the merge's diff — no dependency added.
- **0 secret-shaped hits** over the merge's **2005** added lines
  (`sk-`/`AKIA`/PEM/bearer/assignment shapes).
- **0 NUL bytes across all 9 paths**, from a CANARY-VALIDATED byte probe
  (`wc -c` minus `tr -d '\000' | wc -c`): positive canary reports 1,
  clean control reports 0. **AND THE NAIVE PROBE WAS CAUGHT LYING AGAIN
  IN THE SAME RUN** — `LC_ALL=C grep -qP '\x00'` exits **1 on the
  positive canary**, a false GREEN, for the fourth checkpoint running.
  Canary-validate or trust lint P5; do not reach for `grep -P`.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THE APP DID NOT RELAUNCH, AND THE DISPATCH BRIEF PREDICTED IT
   WOULD.** Pid **93529** (started 2026-08-23 22:47:50, T-013's window)
   is unchanged across the merge's working-tree write and the whole
   checkpoint, sampled every ten seconds for two minutes from the write
   and again at the end, under the same supervisor chain (`npm run tauri
   dev` 82342 → `tauri dev` 82364). **The brief expected a relaunch
   because BOOT GATE fires; that inference is wrong and the mechanism is
   worth writing down.** `tauri dev` restarts the Rust binary on
   `app/src-tauri/**` changes; `app/src/**` changes go to VITE, which
   HMRs them into the running webview. This merge is `app/src/**` and
   `app/test/**` only, so what reached the human is **the new
   `DenialNotice` and `visibleDenials` hot-swapped into the window they
   already had** — the notice is live in their app right now, on the
   same process. BOOT GATE's trigger set and the relaunch trigger set
   OVERLAP but are not the same set, and three checkpoints have now
   conflated them.
   **AND A MEASUREMENT PITFALL FROM THIS RUN, RECORDED BECAUSE IT ALMOST
   BECAME A FALSE POSITIVE**: `ps | grep 'target/debug/nputer'` matches
   `target/debug/nputer-index` as a SUBSTRING, so this integrator's own
   graph-gate run appeared for one ten-second sample as a second
   `nputer` process with a fresh start time and read exactly like a
   relaunch. Disambiguated with `awk '$NF=="target/debug/nputer"'`; the
   human's app never moved. **Anchor the process match.**
2. **The map pane sees a NEW graph, and that is this merge's one visible
   change to it.** `docs/architecture/graph.json` moves 645482 → 648862
   bytes, 1120 → 1126 symbols, 1703 → 1712 edges, 126 files unchanged.
   No component relation moved, so no node or ring on the architecture
   lens changes; the T2 symbol panel for C-13 gains four entries.
3. **`app/dist` WAS rewritten** by the pre-suite `npm run build`, with an
   unchanged CSS hash — vite dev does not serve from `dist`.

**No process from this integration survives.** FOUR scratch ports were
used — **14921** (the e2e lane at the merge), **14922** (the boot gate),
**14923** (the owed e2e re-run after the checkpoint doc edits) and
**14924** (the run that validates STATE's own sentences) — each read
with `lsof -nP -iTCP:<port> -sTCP:LISTEN` FIRST (zero rows) and then
bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::`
immediately before use and free again after, in that order and never the
reverse. None is the default 14520 and none is 1420. **No `pkill`
at any point.** No `npm ci` / `npm install` was run anywhere. The T-101
worktree is removed and the branch kept; the drill worktree is removed
and pruned. The two `nputer-T-060` `fake_agent` orphans
(`52504`/`52505`, ppid 1, six days old) are unchanged and left alone
(T-043-s1). **The untracked zero-byte file `z`** still sits in the main
checkout — not mine, not staged, left alone for the fourth checkpoint
running.

**The shared capture fixture was checked before and after.**
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` is
byte-identical to `HEAD` in the main checkout AND in the lane worktree
(sha256 `273a3d33…`, empty `git diff` in both). Nothing mutated it —
this card's drill is DOM-only. **No real model call was made and no
screen-control probe was run**; verification is headless throughout and
the one look T-101 owes is @human's.

## Two documents ticked, and ROADMAP was checked rather than assumed

- **ARCHITECTURE** carried, in T-081's own paragraph, *"What is NOT here
  is the RENDERING: the notice a human would see lives in C-13's chat,
  outside this fence (`T-081-s1`)"* — true when written and false as of
  this merge. Corrected in place, and C-13 gains a full paragraph for
  what the screen does with the channel, why suppression is keyed on
  `error.denials`, and the one report that still duplicates.
- **ROADMAP was checked honestly and it needed a tick, though not the
  one the brief anticipated.** The sentence T-085's integrator found
  false ("the other three remain planned") is already corrected and
  still true: `T-010` and `T-015` are both `status: planned` on disk. No
  stale claim about denial rendering existed anywhere in it. What it
  LACKED was the card: T-101 earns a milestone-3 narrative paragraph on
  T-069's own precedent — *it makes a promise already written above true
  all the way to the eye* — because T-081's criterion said the denial
  "SHALL reach the frontend at the moment it arrives" and it did, into a
  field no component read. That paragraph is added, and it carries the
  live-only limit and the outstanding @human look.

## The board, derived from disk at this checkpoint

**161 flat task files, 72 done / 49 planned / 40 parked / 0 SUGGESTED /
0 verifying / 0 building; 26 in `rejected/`** — re-derived from disk at
`6f2f8ea`. The 188/36/28/52 figures above are T-101's checkpoint and
were true then; three commits have landed since and the seventh triage
disposed all 52 suggestions.

## What landed after T-101's checkpoint (architect, no lanes)

- **`d41456b` — F-04's slice is fully specified.** T-110 (lane reader),
  T-111 (frontier), T-112 (brief assembler) join T-088 and the merged
  T-089. **T-110 INVERTS the decomposition plan's D4**: the plan argued
  the board must read lanes and never `status:`, on the ground that
  `status: building` had never been used — a current-tree grep, which
  cannot see a transient state. 77 commits moved that field, and T-089
  ruled the pre-cut stamp back into the method. So the board reads
  BOTH, and their disagreement is the product: stamped with no worktree
  is a lane that died; a worktree with no stamp is a dispatch that
  skipped the stamp. Tonight's network drop killed three lanes at once
  and one left a shared fixture mutated on disk, with nothing in the
  app able to show it.
- **`6b0cf47` — seventh triage, batches 1–3.** 12 parked with triggers,
  4 rejected (status flipped BEFORE `git mv`, so the exclusion pin
  passed rather than catching it as at the sixth), 21 folded into 11
  targets. **Two residuals were rescued before their own files could
  bury them** — the triage encoding moves a whole file, but a finding
  can be half-true: `T-089-s7`'s row-5 fix (the slug map is
  `docs/ARCHITECTURE.md` plus each component's `touch_slugs:`, named
  nowhere) went to T-104, and `T-013-s7`'s live stale figure
  (CONVENTIONS says five files fail on an unbuilt worktree; the tree is
  at six) rides T-117. **T-087's fence was corrected in place** — it
  declared `[app-shell]` while its own criterion 5 edits CONVENTIONS.
- **`6f2f8ea` — seventh triage, batch 4.** T-113…T-122 promoted, 15
  absorbed findings removed, backlog to zero.

## THE SESSION'S BEST PROCESS FINDING WAS REFUTED BY ITS OWN PROMOTION

The architect spent the day relaying `sed -n '1,86p'` as the command
that lets a verifier read a card's criteria without its reasoning.
**T-121 measured it over all 166 flat cards and refuted it in both
directions**: of the 88 carrying `## Implementation notes`, **41 have
it at or before line 86** (the read leaks the reasoning anyway, up to
59 lines on T-003 and T-007) and **47 have it after** (it truncates the
criteria the verifier exists to attack). Exactly two land where the
number works.

**The attribution was wrong too.** T-085's verifier used `1,86p` and
was lucky — its card's notes began at 87. **T-101's FIRST verifier read
lines 1–110** against notes at 111, and is the one that reported three
blocking findings none of which appeared in the executor's own
eleven-row matrix. That evidence was credited to the wrong lane in five
briefs.

The remedy is **derived, not numeric**: read to the first
`## Implementation notes` or `## Verdicts` heading — zero leaks and
zero truncations across all 166. `T-121` owns the interim discipline;
`T-112` owned a restatement of the refuted number and **was corrected
at this triage** to route to T-121 instead, with the old claim kept
only inside its own retraction (the shape T-085 landed).

**The lesson is the one the whole session kept teaching, and this is
its sharpest instance: everything the architect relayed without
deriving was the weakest thing in the brief.** Six figures, one
quotation that no file contains, a relaunch prediction wrong for three
checkpoints — and finally the discovery *about* unverified relay,
itself relayed unverified, improving with each retelling.

## A LIVE CONTRADICTION BETWEEN TWO PLANNED CARDS — RULE BEFORE EITHER DISPATCHES

**`T-113` deletes the runner-side narrowing that `T-102`'s criterion 6
pins.** Both hold `[app-agent]`, so the fence serialises them and T-113
is sequenced first (p57). A T-102 executor must find criterion 6
amended or stop. T-113 quotes it verbatim; it was deliberately NOT
amended from inside a draft, because quietly editing another planned
card is the class of change this pipeline exists to prevent.

## OUTSTANDING @HUMAN — one look, and it closes a three-card question

T-101's denial notice is **hot-swapped into the running window** (vite
HMR; this merge touched no Rust, so no relaunch — see the BOOT-GATE
distinction now recorded in T-052). Provoke a refusal in a genesis turn
and look once: the notice should read as quiet monospace furniture
below the activity line, and the turn should still read as COMPLETED.
If it reads as an error, that is a copy/treatment fix, not a logic one.
T-081 asked this and could not answer it; T-101 makes it answerable.

**T-101 WAS NEVER STAMPED `building`** — it went planned → verifying —
which is the same lapse the merged TASK-FORMAT bullet rules on, live on
this board for the fourth checkpoint. It is recorded once more and then
it stops being observable, because there are no lanes left to stamp:
`git worktree list` is the authority (lane-protocol rule 7) and it now
lists only the main checkout. **The next dispatch is the first chance to
exercise the stamp rather than note its absence.**

## Provenance and health

T-101 is **built by `claude-opus-5` (two executors) and verified by
`claude-opus-5` (two passes)**, `review: same-model`, **rejected then
approved**. **72 done cards — 56 `same-model`, 10 `self-verified`, 5
`independent`, 1 EMPTY (T-056)**; 56 + 10 + 5 + 1 = 72. T-101 moves
`same-model` from 55 to 56.

At this checkpoint main contains T-101's merge `5b80d32` plus this
checkpoint. Parser, app, Rust, E2E, token lint and its selftest, `cargo
audit`, the graph-currentness gate and the docs gate are all green;
**all three standing gates FIRED and all three were RUN.** Nothing is
broken. **Known residuals of the delivered artifact are filed, not
hidden**: `T-101-s1` (the `exitNonZero` double report — REAL TODAY,
disclosed in code, routed with mechanism/fix/fence/pin), `T-101-s2` (the
U+200B message half), `T-101-s5` (the one-owner property of the denial
name is unpinned; a two-owner split survives the whole suite), plus
`T-101-s3` (the docs gate's path-spelling false-clean) and `T-101-s4`
(the quotation that does not exist), neither of which is a defect in the
delivered code.

## In progress / broken right now

**NOTHING IS IN PROGRESS. ZERO LIVE LANES.** `git worktree list` returns
the main checkout and nothing else; `git branch` still lists every lane
this repo has ever run, which is the intended asymmetry. Every fence is
free, including `app-agent`, `app-interview` and `tools/e2e` — the three
that blocked work for most of this session.

**Merged and checkpointed today:** T-013 (`6834287`/`d673039`), T-097
(`7e82667`/`1aa7137`), T-085 (`2ea1d27`/`9949250`) and T-101
(`5b80d32`/this commit).

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1126 SYMBOLS / 1712
EDGES**, not the 1120/1703 of the last checkpoint and not the 1023/1550
the older lanes measured at. **And forecast the DELTA, not the
absolutes** — see the merge-forecast section above.

## Next up

1. **`T-101-s1` is the sharpest thing this merge deposited and it has a
   written fix.** The `exitNonZero` path double-reports a refusal today,
   in shipped code. The fix is a four-line DELETION in
   `app/src-tauri/src/agent/runner.rs` — drop the `permission_denials:`
   ring note for the `unannounced` set the loop above already emits live
   `Denied` events for — plus the pin the finding names. Fence
   `[app-agent]`, now FREE. It owes `cargo test`.
2. **`T-101-s3` now has THREE independent confirmations and no owner,
   and it belongs to T-090.** A `./`-prefixed or absolute path list
   disarms the newest standing gate at exit 0. T-090 already owns the
   gate's four-code contract and its fence is a superset, so absorbing
   it needs no widening. It is a one-line normalisation in `docsGate()`.
3. **`T-101-s4` needs fixing in TWO places, not one.** Re-cite the
   card's fence argument to `lane-protocol.md` rule 5 (which exists in
   the tree as of this merge) — and note that the quotation reached the
   executor through a DISPATCH BRIEF that asserted it unchecked, so the
   brief-writing seat is the second place. T-105 already owns a sweep
   for rules everyone believes are written down.
4. **`T-085-s3` is still cheap and still unowned.** The pin guarding
   T-084's retraction is one case-sensitive regex over one file; a
   whitespace- and case-insensitive sweep across BOTH scripts closes the
   three measured escapes.
5. **`T-013-s1` is still addressed to the PLANNER**, and this merge is
   its best evidence yet. A fence widened twice from inside a lane
   (T-013, both ruled correct) and a fence deliberately NOT widened
   (T-101, also ruled correct) now sit side by side with the
   discriminating rule written down — the method still has no in-flight
   channel for either "my fence just grew" or "my fence just found a
   defect it may not touch".
6. **`T-089-s1` is UNBLOCKED for the first time.** The method version is
   owed a bump to v0.1.6 and CONVENTIONS still carries the two sentences
   admitting the debt. It is a three-file commit plus an unpinned fourth
   hand-edit and needs a fence including `app-agent` — which was held by
   this lane and is now free. Do not split it: the two asserts are
   ORDERED, and a const-only bump reds on the plan-interview arm and
   never reaches the CONVENTIONS one.
7. **`T-013-s8`'s one-line hardening is cheap**: refuse a resolved
   program under the project root, caller-side only, never in the shared
   gate.
8. **Triage the FIFTY-TWO suggestions.** T-101 deposited five and the
   backlog has grown in every one of the last five checkpoints — 47 →
   52 at this one. It reached ZERO at the sixth triage (`f306ee9`) and
   has climbed steadily since.
9. **@human owes T-101 one look**, and it is the only outstanding
   @human item this session created: does a live denial notice read as
   INFORMATION rather than ALARM on a turn that then COMPLETES? Judge it
   on a turn carrying two `Bash` refusals that finishes. It reads as
   alarm if the rows borrow the failure surface's colour, outrank the
   answer, or make a completed turn look unresolved. The app in front of
   you already has this code — it arrived by HMR, not by relaunch.
