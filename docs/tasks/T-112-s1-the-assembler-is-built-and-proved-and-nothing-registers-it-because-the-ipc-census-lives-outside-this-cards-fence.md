---
id: T-112-s1
title: The brief assembler is built and proved and nothing registers it — the command's registration and the IPC census both live in app-shell, which T-112's fence does not carry
feature: F-04
milestone: 4
priority: 5
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [app-shell, app-dispatch, app-board]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

**T-112's CRITERION 1 ORDERS WORK OUTSIDE ITS OWN CARD'S `touches:`,
AND THIS IS THE HALF THE LANE COULD NOT BUILD.** The criterion reads
*"THE app SHALL gain one command assembling the executor brief for one
card … **The IPC census moves and SHALL be corrected at both ends,
never widened**"*. Both ends are `app-shell`:

- the REGISTRATION is `app/src-tauri/src/lib.rs`'s `generate_handler!`
  list, and `lib.rs` is in `C-05-app.md`'s `paths:`;
- BOTH census pins are in `app/test/crescendo-dom.test.tsx`, also
  C-05's — `the frontend reaches exactly the thirteen commands it is
  allowed` and `Rust exposes exactly seventeen commands`.

T-112's `touches:` is `[app-dispatch, app-board]`, which expands to
C-15 + C-08/C-09/C-17/C-18 and reaches neither file.
`method/tasks/TASK-FORMAT.md` rules this case in as many words —
*"A card whose criterion and whose fence disagree is a DEFECTIVE CARD,
not a hard call for the lane"* — and `roles/executor.md` rules the
lane's own move: record it, route it, build the rest. So this is
routed rather than built, and the fence was NOT widened from inside the
lane.

**IT IS THE SAME DISPOSITION `T-110` TOOK AND `T-126` DISCHARGED**, one
card over, for the identical reason: `app/src-tauri/src/dispatch/mod.rs`
already carries the sentence *"registration lives in
`app/src-tauri/src/lib.rs`, which is C-05's `app-shell` — outside
T-110's `[app-dispatch]` fence"*, and `T-110-s1` carried that wiring
until T-126 landed it. This card is that suggestion's twin for the
brief.

## What is already built and proved, so this card adds no derivation

`app/src-tauri/src/dispatch/brief.rs` holds the whole assembler and its
pins (28 bodies under `cargo test`). `brief_for_card(project_root,
task_id, role)` is the command's shape already: one task id and one
role cross the boundary, both strings the board holds, and the project
root is the app's own — so the registered command stays a zero-path one
under ADR-012 and `acl_pin.rs` stays a 0-file diff, which is that
criterion's own second clause.

`app/src/lib/dispatch-store.ts` carries the mirrored wire types
(`BriefOutcomeWire` and friends), pinned against serde's output by
`the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects`.
`app/src/components/board/Board.tsx` already threads `dispatch` and
`brief` into the drawer as optional props, and
`app/src/lib/task-detail.ts`'s `selectBriefPanel` renders them.

## Acceptance criteria

- THE app SHALL register the assembler as one `#[tauri::command]` in
  `app/src-tauri/src/lib.rs`, taking the narrowest argument surface that
  works — no path crosses the boundary in either direction (ADR-012).
- THE IPC census SHALL be corrected at BOTH ends in
  `app/test/crescendo-dom.test.tsx` and never widened; `acl_pin.rs`
  SHALL be a 0-file diff, and the grant count SHALL be re-derived at the
  lane's own ref rather than quoted from here.
- THE board root SHALL fill `Board.tsx`'s `dispatch` and `brief` props
  from the store, so the drawer's dispatch block reaches a real card.
- A pin SHALL cover `Board.tsx`'s prop threading, which no suite reaches
  today — `T-112-s4` carries the measurement and the reason.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-04 p5, as filed

Fence, priority and criteria re-derived at `b60b06d` and nothing on the
card moved: `p5` is free in F-04 (the planned column holds p3, p4, p6,
p7, p8), and the two census pins the card names are live —
`command grep -n "thirteen commands\|seventeen commands" app/test/crescendo-dom.test.tsx`
answers at lines 503 and 550. `command grep -n "brief" app/src-tauri/src/lib.rs`
returns NOTHING at this ref, which is the card's whole subject: the
assembler is still unregistered and the drawer's brief block still
cannot render.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority. **This remains the next code dispatch the moment the
limit is ruled** — T-112's verifier recommended it and nothing since has
displaced it.

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-112-s1`, branch
`task/T-112-s1-register-the-assembler`, base **`82f5722`** (the dispatch
stamp), one commit **`1eb05f2`**. The `T-140-s4` block above is
DISCHARGED at this ref: headroom is **1,009,228** bytes of a
**2,145,959** budget, derived by `index --check` rather than quoted.

### The four criteria

**1. ONE `#[tauri::command]`, and the narrowest argument surface that
works.** `dispatch_brief` in `app/src-tauri/src/lib.rs` — the
EIGHTEENTH — over a `dispatch_brief_at` seam, the `dispatch_lanes_at`
shape, because a `tauri::State` cannot be constructed in a unit test and
a command whose whole body reads state is a command nothing can drive.
**No path crosses in either direction.** The project root is
`WatchState`'s; `task_id` is a key into the `docs/tasks` listing the
assembler itself takes, matched by equality against names that listing
handed over, so a traversal string is a MISS rather than a traversal
(the `arch_detail` argument, and `brief_for_card`'s own lookup is where
it holds); `role` is a **closed enum**, not a string — `Role` gained
`Deserialize`, so serde refuses a third spelling before a file is read,
which is narrower than the `String` the command would otherwise take.
The id is **bounded before it is echoed** — `MAX_TASK_ID_CHARS = 64` and
`task_id_within_bounds` in `brief.rs`, applied at the command the way
`arch_detail` applies `target_within_bounds` — because `NoSuchCard`
carries the id back. `async` + `spawn_blocking`: the assembler reads a
directory, a card, the contract, the adapter and CONVENTIONS, which is
blocking fs work and does not belong on Tauri's main thread.

**2. The IPC census, corrected at BOTH ends and never widened.**
`app/test/crescendo-dom.test.tsx`, both pins, both lists spelled out
rather than counted: the frontend list gains `dispatch_brief`
(thirteen → **fourteen**, title moved with it) and the Rust handler list
gains it (seventeen → **eighteen**, title moved with it). Neither
assertion was loosened — they are still `toEqual` over a literal array,
so a nineteenth command reds by name.
**`acl_pin.rs` IS A 0-FILE DIFF**: `git diff --stat -- app/src-tauri/src/acl_pin.rs` is
empty across the whole change. **The grant count RE-DERIVED at this
lane's own ref rather than quoted from this card: 92** — counted off
`EXPECTED_GRANTS` in `acl_pin.rs` at `1eb05f2`, and all six `acl_pin`
bodies pass. An app command is not a webview grant, which is the whole
ADR-012 point.

**A LIVE WIRE DEFECT SURFACED HERE AND IS FIXED, WITH ITS SWEEP.**
`BriefOutcome` carried `rename_all = "camelCase"` and NOT
`rename_all_fields`. `rename_all` renames an enum's VARIANTS; fields a
variant carries inline need `rename_all_fields`, which `DispatchJoin`
and `LaneScan` one module over have always had. So `NoSuchCard` emitted
**`task_id`** while `dispatch-store.ts`'s `BriefOutcomeWire` declared
**`taskId`** — the two sides of one boundary disagreeing since T-112,
with nothing red, because
`the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects`
asserted the variant TAG and never a field name. Registering the command
is what made it reachable. **CLASS:** a tagged enum whose variants carry
inline fields, missing `rename_all_fields`. **SWEEP:**
`command grep -rn 'serde(tag = "kind"' app/src-tauri/src/ | command grep -v rename_all_fields`
at `82f5722` returns **6** declarations — 4 in `brief.rs`, 2 in
`join.rs`. Of those, exactly ONE carries a multi-word inline variant
field and is the defect; `join.rs`'s two are a STRUCT (where
`rename_all` does rename fields) and a fieldless enum, and `brief.rs`'s
other three carry only single-word fields where the two spellings
coincide. **FIX: the class, not the instance** — all four `brief.rs`
enums gained the attribute, so the next two-word field is right by
construction. No byte on the wire moved except `task_id` → `taskId`.

**3. Board.tsx's props filled from the store — HALF BUILT, HALF ROUTED,
and this is the one criterion not met in full.** `dispatch-store.ts`
gains the door: `readBrief(taskId, role)` invoking `dispatch_brief`, plus
`DispatchBriefWire` mirroring the `NoProject | Answered` wrapper **in the
commit that adds it**, which is `T-126-s1`'s finding applied rather than
repeated. Its one new import is `invoke` — a PACKAGE edge to
`@tauri-apps/api`, not a component edge, so no relation row moves.

**`dispatch` CANNOT BE FILLED, AND IT IS NOT A FENCE PROBLEM.** This lane
held `app-shell` AND `app-dispatch`, so it could reach `lib.rs` and
`join.rs` and deliberately did not. The chain is mechanical:
`TaskDetailPanel` computes `briefPanel` as
`dispatch === undefined ? undefined : selectBriefPanel(...)`, so the
block does not render without a `DispatchReading`; that type is
`joined | unavailable` and `selectDispositions` reads `row.state` and
`row.lanes` off every joined row — the JOIN's classification; and the
only producers are `join_lanes`, whose three shapes `T-126-s2` refuses,
or a `joined` reading over an empty map, which is the exact lie the
`unavailable` arm exists to prevent. **`T-126-s2` is PARKED and says in
as many words that it wants a RULING before it wants a fence**, and an
executor may not make an unruled architecture decision from inside a
lane. Its own UN-PARK condition — *a consumer needs to render the four
lane states* — has now fired; **corroborated on that card** rather than
filed as a sibling (TASK-FORMAT, *search before filing*).
**A SECOND, INDEPENDENT BLOCKER was measured and filed as `T-112-s5`**:
even once the join lands, the shell cannot fill `brief`, because the
open-card ref is `Board.tsx`'s own `useState` and `App.tsx` never learns
it — a brief is a fact about ONE card and only the component holding the
answer knows which. Three shapes, none obviously right, all named there.

**4. A pin over Board.tsx's prop threading.** Three bodies in
`app/test/board-truth.test.tsx`. **That file is C-05's, has imported
`Board` since T-017, and `C-05 -> C-18` is already in `C-05-app.md`'s
`depends_on`** — so the pin cost no registry line, no new component edge
and no `arch drift` finding, which is exactly why a `[app-board]` lane
still cannot write it and this one could. **`T-112-s4`'s first criterion
is UNTOUCHED and stays that card's**: C-18 still declares no test path of
its own, and this card did not edit the registry to give it one. The
props are written as STRUCTURAL LITERALS, never imported —
`DispatchReading` is `board-model.ts`'s and `BriefOutcomeView` is
`task-detail.ts`'s, both C-17, which C-05 does NOT declare, so importing
either for a type would buy the undeclared edge the pin exists to avoid.

### Gates, every one with its exit

Measured at `82f5722` (BASELINE, before any edit) and at `1eb05f2`:

| gate | baseline | after |
|---|---|---|
| `cargo test` from app/src-tauri/ | exit **0**, lib 251 | exit **0**, lib **255** (+4) |
| `npm run build` from app/ | exit **0** | exit **0** |
| `npm test` from app/ | exit **0**, 49 files / **1059** | exit **0**, 49 files / **1062** |
| `index --check` from app/src-tauri/ | exit **0**, CURRENT | exit **1**, **STALE** — expected |
| `npx vitest run` from lib/parser/ | — | exit **0**, 16 files / 336 |
| `npm test` from tools/e2e/ | — | exit **0**, **332 passed** |
| boot check | — | exit **0** |

**GRAPH REGEN fires** (`*.rs` and `*.ts` outside docs/) and
`index --check` answers **STALE** at exit 1 — a REAL stale, not the
`--root` false red: it prints both counts and a file diff.
committed 1,134,410 B · 199 files · 2,418 symbols · 2,331 edges; fresh
1,136,731 B · 199 files · **2,425** symbols · **2,334** edges;
`files +0 -0 ~7`, `edges +4 -1`. The four new edges are
`brief.rs -> cargo:serde` (gaining `Deserialize`),
`dispatch-store.ts -> @tauri-apps/api`, and two intra-file `type_ref`s;
the one removed is that same serde import at its old symbol set. **No
new COMPONENT edge**, so the relation table's undeclared list
(`C-05->C-15`, `C-10->C-14`) does not move. **`graph.json` is OUTSIDE
this lane's fence: the graph was ASKED, never regenerated — the regen and
the two app dogfood fixtures are the integrator's step at the
checkpoint** (`files +0 -0` is the sentence that argues the file-count
half owes nothing).

**BOOT GATE fires** (`app/src-tauri/**` and `app/src/**`). Run from
tools/e2e/ on a port DERIVED from the card id —
`NPUTER_BOOT_PORT=21121` (20000 + 112×10 + 1), `lsof` read to **zero
rows** immediately before. **Exit 0**, both lines:

    [nputer] project folder: /Users/ujju/Projects/nputer-T-112-s1
    [nputer] window "main" created

Port **1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else: **zero rows, nothing listening** (read 2026-08-31 on
Mac.lan — a live fact, not a function of a tree).

**DOCS GATE fires** — 2 paths under `docs/` are code inputs. Range from
the RANGE RULE's executor row (`git merge-tree --write-tree`, exit read
FIRST: **0**, a tree, not a conflict report), main tip re-derived at this
session as `1e886c0`, merge tree `023f2c7`, **9 paths**. Gate **exit 1 =
it HAS a verdict**, naming three suites; all three run and all three
green (table above). Every live card's frontmatter parses with a legal
status, this card's and `T-112-s5`'s included.

**METHOD EVAL GATE not owed** — nothing under `method/**` in the diff.
**AUDIT GATE not owed** — `Cargo.toml`, `Cargo.lock` and
`app/package.json` are a 0-path diff, so no dependency moved.

### Poison drill — 10 of 10 killed, restorations sha256-proved

Committed FIRST (`1eb05f2`), then drilled in a **detached scratch
worktree at a named commit** with its **own `CARGO_TARGET_DIR` inside
itself**, one stem derived from the card id spent on the worktree, the
target dir and every driver:
`/private/tmp/nd-T-112-s1` @ `1eb05f2347974f15183239dd8019c95bdc9f0ee3`,
`CARGO_TARGET_DIR=/private/tmp/nd-T-112-s1/target`. Drill baseline there:
`cargo test` exit 0, `npm test` from app/ 49 files / 1062. Every mutation
is ONE SIDE ONLY — the code under test, never an assertion, never a
literal the two share — and every one was READ BACK with `git diff`
before its suite ran.

| # | mutation (one side) | suite | exit | failing bodies |
|---|---|---|---|---|
| M1 | `BriefOutcome` loses `rename_all_fields` | `cargo test` | **101** | 2 |
| M2 | `task_id_within_bounds` always answers true | `cargo test` | **101** | 1 |
| M3 | `dispatch_brief_at`'s `None` arm becomes a card refusal | `cargo test` | **101** | 1 |
| M4 | the seam drops `role`, always assembling the executor's | `cargo test` | **101** | 1 |
| M5 | the seam drops `task_id` for a constant | `cargo test` | **101** | 1 |
| M6 | the wrapper is tagged `type` instead of `kind` | `cargo test` | **101** | 1 |
| M7 | `dispatch_brief` leaves `generate_handler!` | `npm test` app/ | **1** | 1 |
| M8 | the frontend call site names `dispatch_lanes` instead | `npm test` app/ | **1** | 1 |
| M9 | **both** `Board.tsx` threading lines deleted (T-112-s4's own mutant) | `npm test` app/ | **1** | 2 |
| M9a | ONLY `dispatch={dispatch}` deleted | `npm test` app/ | **1** | 2 |
| M9b | ONLY `brief={brief}` deleted | `npm test` app/ | **1** | 1 |

**`T-112-s4`'s MUTANT IS DEAD.** That card measured the two threading
lines deleted leaving the whole app run green at exit 0; here the same
one-sided deletion, read back as `0 2` on `git diff --numstat`, takes
`npm test` from app/ to **2 failed / 1060 passed, exit 1** — and every
failing body is one of this card's three. Its criterion 3 asks for the
failing-body count: **M9b, the finer mutant that deletes exactly one
line, fails exactly ONE body**, which is the non-duplication
mechanically (POISON DRILL shape SIX).

**SHAPE SIX's SECOND QUESTION, ASKED AND ANSWERED.** Does any OTHER test
already kill these mutants? For M9/M9a/M9b: **no** — `T-112-s4`'s
measurement is that the whole suite was green under exactly this
deletion, and every body that reds here is new in this commit. For M7 and
M8: no — the census pins are the only readers of the handler list and the
call sites. M1's count of 2 is deliberate rather than duplicative: the
two bodies observe the same field at different LEVELS (the assembler's
own wire form in `brief.rs`, the wrapper's in `lib.rs`), and M6 kills the
`lib.rs` body ALONE, which is that body's own unique mutant.

**RESTORATION PROVED BY sha256 AGAINST THE COMMITTED BLOB** after every
mutant, both sides named
(`git restore --source=HEAD --staged --worktree -- <path>`), with an
empty whole-tree `git status --porcelain` as the companion and never as
the alternative. Every restore matched:

    app/src/components/board/Board.tsx  235645c01e4984478dd3138c3ff72b49dd42a8921031cd98035becc2d4984124
    app/src/lib/dispatch-store.ts       3bc8162eb5741d2bf520026131316fd60bb88b4c42b3fa061fa7313e14bed964
    app/src-tauri/src/lib.rs            703d35287b819d81b38cc2326b22e903bbf53b737845f84a2d250deda5fa3311
    app/src-tauri/src/dispatch/brief.rs f1dc08d67e1c2e734f2e05706fadc83827da780ec7a47ac254180c4677304482

The drill worktree is left in place at `/private/tmp/nd-T-112-s1`,
detached and clean at `1eb05f2` — it is not a lane, holds no fence, and
is the reproducible copy of what was measured. The integrator may remove
it at the checkpoint.

### One residual, DISCLOSED rather than discovered

**`dispatch_brief` IS THE FIRST COMMAND IN THIS APP WHOSE ARGUMENT NAME
EXERCISES TAURI'S camelCase → snake_case CONVERSION, AND NOTHING HERE
PINS IT.** `readBrief` invokes with `{ taskId, role }` and the Rust
signature takes `task_id: String` — Tauri v2's documented default, and
the reason `#[tauri::command(rename_all = "snake_case")]` exists to opt
out of. Every argument-taking command before this one is a single word
(`arch_detail`'s `target`, `genesis_send_turn`'s `text`), so no existing
body distinguishes the two spellings. **The IPC census pins the command's
NAME at both ends and says nothing about its argument names**, the boot
check does not invoke commands, and `THE E2E LANE'S HONEST SCOPE` rules
that an IPC path is not the browser lane's to cover. So the claim rests
on Tauri's documented behaviour rather than on a measurement in this
repository. It is named here so the verifier can decide whether it wants
one; the cheapest honest check is @human opening the drawer once the
`dispatch` prop has a filler, which is `T-126-s2`'s and `T-112-s5`'s.

### Where the brief and the card were wrong

1. **The brief's ROW 4 names a worktree INSIDE the repository** —
   `…/.claude/worktrees/nputer-T-112-s1`, which `lane-protocol.md` rule
   three forbids in as many words. The real lane is the sibling
   `/Users/ujju/Projects/nputer-T-112-s1`, which ROW 5 states correctly
   two rows later. Already filed as `T-179`; not re-filed.
2. **ROW 4's base names `4e08d29`**, the newest checkpoint, where the
   actual base is the dispatch stamp `82f5722` — which ROW 4's own
   *integration tip right now* line names. Not re-filed.
3. **ROW 3's read-first list carries `docs/ROADMAP.md`**, which
   `roles/executor.md` step 1 subtracts. `T-112-s3` is in flight on it;
   not re-filed, and ROADMAP was not read as ramp-up.
4. **THE CARD'S CRITERION 3 IS NOT BUILDABLE AS WRITTEN, and this is a
   new finding.** It orders both props filled from the store. Neither
   half is reachable today, for two DIFFERENT reasons, and neither is a
   fence: `dispatch` needs the join (`T-126-s2`, parked, wanting a
   ruling) and `brief` needs a caller that knows which card is open
   (`T-112-s5`, filed). This card is the mirror image of its own
   subject — T-112's criterion 1 ordered work outside T-112's fence and
   was routed here; this criterion orders work outside any *ruling* this
   card carries, and is routed on. The census, the registration and the
   pin all landed; the drawer's brief block still cannot render in the
   shipped app, and **`docs/STATE.md`'s line *"until it lands the
   drawer's brief block never renders"* stays true for `T-126-s2`
   instead** — that is the correction the checkpoint owes.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

### 2026-08-31 — `claude-opus-5@subagent` — **APPROVED WITH ASSIGNED CORRECTIONS**

Blind pass, two phases with the line written down. **Phase 1: 22 attacks
and 6 mutants written to a file BEFORE the diff, the notes or the commits
were opened** — from the card at base `82f5722`, CONVENTIONS,
ARCHITECTURE + ADR-012 in full, `roles/verifier.md`, the component files
C-05/C-08/C-09/C-15/C-17/C-18 and the six named code files at base.
Nothing in the dispatching brief named an executor-derived specific, so
phase 1 was kept rather than merely intended. **Two attacks survived
contact; both are assigned below and neither reopens a criterion.**

Every gate below I ran MYSELF, unpiped, at the lane tip **`d6e51ef`** —
never a reported number. Bench: my own detached worktree
`/private/tmp/nv-T-112-s1` (stem derived from the card id) with its own
`CARGO_TARGET_DIR`. **I did NOT reuse the executor's bench at
`/private/tmp/nd-T-112-s1`**: a bench carries a target dir and build
artifacts, so a green measured there could be a green their leftovers
produced. It would not have weakened the BLINDNESS — a target dir carries
no reasoning — but it would have weakened the independence of the numbers,
which is the half that matters here.

| gate | exit | count |
|---|---|---|
| `npm ci` · `npm run build` · `npm test`, lib/parser/ | **0** · **0** · **0** | 16 files / **336** |
| `npm install` · `npm run build`, app/ | **0** · **0** | — |
| `npm test`, app/ | **0** | 49 files / **1062** |
| `cargo test`, app/src-tauri/ | **0** | lib **255**, all targets green |
| `NPUTER_BOOT_PORT=11201 npm run boot:check`, tools/e2e/ | **0** | both lines below |
| `index --check` (**ASKED, never regenerated**) | **1** STALE | expected; figures below |

**BOOT GATE** fires (`app/src-tauri/**` + `app/src/**`). Port **11201**,
derived from this card id and NOT the executor's 21121, `lsof`-read to
**zero rows** immediately before. Both `[nputer]` lines:

    [nputer] project folder: /Users/ujju/Projects/nputer-T-112-s1
    [nputer] window "main" created

Port **1420** read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else: **zero rows, nothing listening** (2026-08-31).

**GRAPH REGEN** fires and `graph.json` is outside this lane's fence, so I
**asked the graph and did not regenerate or commit it** — the
integrator's step. It says STALE at exit 1: committed 1,134,410 B · 199
files · 2,418 symbols · 2,331 edges; fresh 1,136,731 B · 199 files ·
**2,425** symbols · **2,334** edges; `files +0 -0 ~7`, `edges +4 -1`.
The four added are `brief.rs -> cargo:serde` (gaining `Deserialize`),
`dispatch-store.ts -> @tauri-apps/api` (`invoke`) and two intra-file
`type_ref`s; the removed one is that same serde import at its old symbol
set. **No new COMPONENT edge** — `arch drift` reports findings=4,
undeclared=**2** (`C-05->C-15`, `C-10->C-14`), unmapped=0, exactly the
pre-existing pair. Budget **1,009,228 of 2,145,959 left**, which
discharges the `T-140-s4` block this card was triaged under.

#### Criterion by criterion

**1 — MET.** One `#[tauri::command]`, `dispatch_brief`, over a
`dispatch_brief_at` seam on the `dispatch_lanes_at` precedent. **No path
crosses in either direction, checked in both and in the error variants.**
Inbound: `task_id: String` + a closed `Role` enum; the root is
`WatchState`'s, and `task_id` is never joined onto it — `brief_for_card`
matches it by `starts_with` against names `list_dir("docs/tasks")` handed
over, so a traversal string is a miss, not a traversal. Outbound: every
source string is repository-relative by construction (`DiskFiles::list_dir`
builds `format!("{rel}/{name}")`; `Role::file()` is a `&'static str`).
**The error path I attacked specifically**, because a path escapes through
an error as easily as a return: the `spawn_blocking` join arm formats
`JoinError`, and tokio 1.53.1's `Display` **does** interpolate a panic
payload (`"task {} panicked with message {:?}"`), while
`sanitize_for_log` escapes control characters and truncates but does NOT
strip paths. So I checked whether any reachable panic can carry one —
`brief.rs`'s and `lanes.rs`'s shipped paths hold **no** `unwrap()`,
`expect()` or `panic!`; the only panic-capable sites are slice indexes,
whose messages carry no path. **The claim holds.**

**2 — MET.** Both ends corrected and **neither widened**: still `toEqual`
over spelled-out literals at both pins, and the two extraction regexes are
untouched (verified by diff). Rust 17 → **18**, frontend 13 → **14**, both
test NAMES moved with their lists. `acl_pin.rs` is a **0-file diff**
(`git diff --numstat` returns zero rows across `82f5722..HEAD`), and so is
`capabilities/**`. **Grant count re-derived by me at the lane's own ref
`d6e51ef`: 92**, counted off `EXPECTED_GRANTS`, with all six `acl_pin`
bodies passing in my own `cargo test`.

The **live wire defect** the executor found here was real and is exactly
the attack my phase-1 set wrote down as E1 (*"does the keeper assert
FIELDS or only variant tags?"*): `BriefOutcome::NoSuchCard` emitted
`task_id` against the mirror's `taskId`, green because the keeper read the
tag alone. The sweep is sound — I confirmed `ContractDefect`'s only inline
field is single-word, so `rename_all_fields` moved no bytes beyond
`task_id` → `taskId`.

**3 — NOT DELIVERED. Routed, and I judge the routing CORRECT on the
merits.** `App.tsx` is a 0-line diff, so the criterion is unmet as written.
**The fence excuse was not available and was not taken** — the executor
states in the diff itself that the lane held `app-shell` and `app-dispatch`
and "could have registered a joining command and deliberately did not."
I verified the blocking chain independently rather than on their word:
`TaskDetailPanel.tsx:102-108` gates the whole block on
`dispatch === undefined`, so filling `brief` alone renders nothing;
`DispatchReading` is a JOINED shape and **no file under `app/src/**`
produces one** at base or at the tip — only test files construct it;
`dispatch_lanes` returns a bare `LaneScan` and refuses to join by design.
`T-126-s2` **pre-existed this lane** (`status: parked`, filed by T-126's
executor, parked at the eleventh triage 2026-08-26) and its own text says
it wants a ruling before it wants a fence; its diff here is a **pure
append** (zero removed lines) corroborating rather than a duplicate card,
which is TASK-FORMAT's *search before filing* obeyed. The second blocker
is real and I confirmed it: `openRef` is `Board.tsx:61`'s own `useState`
and `App.tsx:812` renders `<Board model={model} />` with no access to it,
so the shell cannot know which card to ask a brief for — filed as
`T-112-s5`, `status: suggested`, legal frontmatter.

I looked for the shape they missed and found only one: filling `dispatch`
with a constant `unavailable` reading. It is **not** "from the store", and
`TaskDetailPanel`'s own pre-existing header refuses it in as many words
(*"a section that says nothing on every open is a section nobody reads"*).
So this is a genuine ruling-shaped dependency, not a card declining work it
could have done. **What was buildable of criterion 3 WAS built** — the
store's door (`readBrief` + `DispatchBriefWire`), which is what moves the
frontend census at all.

**4 — MET, and I killed the mutant myself.** Three bodies in
`app/test/board-truth.test.tsx` (C-05's, which has imported `Board` since
T-017 — no registry line, no new component edge). It is a RENDER pin, not
a source-text grep. My own drill, one side only, every diff read back and
every restoration sha256-proved against the committed blob
(`235645c0…`), whole tree `git status --porcelain` = 0 after each:

| my mutant | suite | exit | failing bodies |
|---|---|---|---|
| **V1** both threading lines deleted (`0 2`) — T-112-s4's own mutant | `npm test` app/ | **1** | 2 |
| **V2** only `dispatch={dispatch}` | `npm test` app/ | **1** | 2 |
| **V3** only `brief={brief}` | `npm test` app/ | **1** | 1 |
| **V4** `Brief.role_file` renamed on the wire | `cargo test` | **0 — SURVIVED** | 0 |
| **V5** the command's task-id bound guard → `if false` | `cargo test` | **0 — SURVIVED** | 0 |

**T-112-s4's measured mutant is dead**, and **shape SIX is answered by
measurement rather than argument**: in all three kills the ONLY failing
bodies are the three this card added, so no pre-existing body already
killed them, and V3 fails exactly one body, which is the non-duplication.

#### ASSIGNED CORRECTIONS — three, none reopening a criterion

**C1 (V5, the sharper of the two survivors). The one piece of input
validation sits on the un-drillable side of the seam.** Deleting the guard
from `dispatch_brief` — `if !task_id_within_bounds(&task_id)` → `if false`,
read back as `1 1` — leaves `cargo test` at **exit 0, 255 passed**. The
predicate has its own pin; the command's USE of it has none, because a
`#[tauri::command]` taking `AppHandle` is not unit-drivable — which is the
very reason `dispatch_brief_at` exists. The seam was given the state read
and not the bound. **Move the check into `dispatch_brief_at`** (ahead of
the `project_root` match, so it refuses before it needs a root) and add one
body asserting
`dispatch_brief_at(Some(&root), &"x".repeat(MAX_TASK_ID_CHARS + 1), Role::Executor)`
returns `Answered { outcome: NoSuchCard { task_id: String::new() } }`.
Re-run V5 afterwards; it must then fail.

**C2 (V4, the other survivor). The wire keeper still does not read the two
fields a human actually sees.** Adding `#[serde(rename = "role_file")]` to
`Brief.role_file` (`1 0`) leaves `cargo test` at **exit 0, 255 passed**.
`the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects`
asserts `role`, `assembledFrom` and now `taskId`, but neither `roleFile`
nor `cardPath` — and those two are exactly what `renderBrief` puts in the
copied brief's header lines, so a disagreement renders `undefined` into a
pasted brief. The struct-level `rename_all` makes the ACCIDENTAL version
of this unreachable, so this is a gap in the pin rather than a live defect
— but the notes claim the fix was "the class, not the instance", and the
class's most visible two fields are unread. **Add
`assert_eq!(json["brief"]["roleFile"], "method/roles/executor.md");` and an
assertion on `json["brief"]["cardPath"]` to that body**, plus the
`assert!(json["brief"].get("role_file").is_none())` negative half that
makes it a two-sided check like the `taskId` one.

**C3 (documentation, exact and one word).**
`app/test/crescendo-dom.test.tsx:504` still reads *"a fourteenth would fail
this line by name"*. The list now HOLDS fourteen, so the pin's own stated
guarantee is false by exactly one. **Change `fourteenth` to `fifteenth`.**

#### Not defects — recorded so nobody re-derives them

- **The executor's one disclosed residual is RESOLVED, in its favour.** It
  flagged that `dispatch_brief` is the first command whose argument name
  exercises Tauri's camelCase → snake_case conversion and that nothing here
  pins it. I checked the vendored macro rather than the documentation:
  `tauri-macros-2.5.5/src/command/wrapper.rs:50` defaults
  `argument_case: ArgumentCase::Camel`, and :462 applies
  `key.to_lower_camel_case()` — so the Rust parameter `task_id` is looked
  up as `taskId`, which is precisely what `readBrief` sends. **The wiring
  is correct.** What remains true is only that no body in this repository
  pins it; that is worth a suggestion, not a correction, and the cheapest
  honest check remains @human opening the drawer once a filler exists.
- `Board.tsx` and `TaskDetailPanel.tsx` are **comment-only** diffs
  (verified: every changed line is a comment), so criterion 4's mutant
  operates on untouched T-112 code.
- The executor's drill ledger reproduces: my V1/V2/V3 failing-body counts
  (2 / 2 / 1) match their M9 / M9a / M9b exactly.

#### What I could not verify, and why

- **`npm test` from tools/e2e/ I did not run.** It was not in this pass's
  named gate set, the card's fence reaches no `tools/e2e` path, and the
  lane binds its own vite on `NPUTER_E2E_PORT` while two other lanes are
  live — so running it risked contending for a port I do not own. The
  executor reports 332 passed; **that figure is theirs, not mine.**
- **The camelCase argument conversion is verified by SOURCE, not by a live
  invoke.** Nothing in this repository can drive a real `invoke` against a
  registered app command outside `acl_pin.rs`'s harness, and extending that
  harness is outside this card.
- **`graph.json` is stale by design at this tip** — regenerating it is the
  integrator's step, and I deliberately did not.

My own bench `/private/tmp/nv-T-112-s1` is left standing, detached and
clean at `d6e51ef`; I removed no worktree, merged nothing and pushed
nothing.
