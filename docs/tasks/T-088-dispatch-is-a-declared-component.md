---
id: T-088
title: The dispatch surface is a declared component before it is a directory
feature: F-04
milestone: 4
priority: 1
size: S
status: done
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-088
verified_by:
review: self-verified
---

F-04's first card, per `docs/design/dispatch-technical-plan.md` (D1
ruled by @human 2026-08-19: milestone 4; D2 taken: C-15 with slug
`app-dispatch`; the follower-first order ratified in
`docs/rooms/cockpit-or-mirror.md`).

Every dispatch card after this one wants a fence word. Without one they
all inherit `app-agent` — C-14, the genesis runner — and dispatch would
serialize against every genesis card for the life of the feature, for
no reason but a missing declaration.

T-008-s1 is the reason to be careful and the reason this is legitimate:
C-02/C-03/C-04 have no component files because no doc decides where
their code will live, so any `paths` glob would be invented. **This
pass decided C-15's location** (the plan's D2), so its paths are
decided rather than invented — the same footing C-07 was declared on
before its binary existed. The CLI's layout stays undeclared
(T-008-s1's re-park stands).

THE COST IS THE POINT OF THE CARD: declaring a component moves the
live-registry fixtures — the parser smoke test's exact id array,
`architecture-dogfood.test.ts`, and `map-dogfood-render.test.tsx`.
That omission cost T-024 a rejection and recurred at T-025's merge.
At T-077's checkpoint the moved set was FOUR assertions across THREE
bodies, surfaced by vitest one at a time — derive the full set before
running anything, and expect the hidden-second-assertion shape.

## Acceptance criteria

- THE registry SHALL gain `docs/architecture/components/C-15-dispatch.md`
  in the shape of C-13/C-14: `id`, `name`, `layer: app`, non-empty
  `paths`, `depends_on`, `decisions`, `status: auto`,
  `touch_slugs: [app-dispatch]`.
- THE declared `paths` SHALL name what the plan decided and no more —
  `app/src-tauri/src/dispatch/**` and `app/src/lib/dispatch-store.ts` —
  and the file SHALL state in prose that C-02/C-03/C-04 stay undeclared
  because their layout is undecided.
- **EVERY MOVED FIXTURE SHALL BE RECONCILED IN THIS COMMIT, corrected
  and never widened.** The set SHALL be DERIVED at the branch (the
  registry diff plus a dry regen forecast), not copied from this card —
  the counts in any prior card are stale by construction.
- THE graph SHALL be regenerated per the standing rule and
  `index --check` SHALL exit 0 at the checkpoint; the executor SHALL
  state whether GRAPH REGEN's trigger fires on this diff rather than
  assuming (a component .md alone does not match its suffix list).
- IF the declared `paths` match no file on disk THEN the derivation
  SHALL render C-15 as declared-only rather than reporting a defect,
  and a pin SHALL assert that — the intent layer exists to carry
  components that are not built yet.
- THE DOCS GATE will fire on `docs/architecture/components/` (five
  readers, three suites at the fifth-triage census) — the executor
  SHALL run what it owes and report the exits.

Verification: headless — parser, app and cargo suites plus
`index --check --root ../..`; every reconciled fixture poisoned back to
its old value and shown RED, restorations hash-proved at a commit.
@human: none.

## Implementation notes

Executor `claude-opus-5 @T-088`, 2026-08-24. Lane
`task/T-088-dispatch-component` cut at `9b03ae6`; build commit
`a2a691b`. Phase 1 only — built, gated, drilled and committed in the
lane; NOT merged, and main was never touched.

### What landed

`docs/architecture/components/C-15-dispatch.md`, in C-13/C-14's shape:
`id`, `name: Dispatch`, `layer: app`, two non-empty `paths`,
`depends_on: [C-10]`, `decisions: [ADR-009, ADR-012, ADR-017]`,
`status: auto`, `touch_slugs: [app-dispatch]`. The paths are the plan's
D2 verbatim and nothing else. `depends_on: [C-10]` mirrors C-14 — the
closest structural sibling (a Rust core under
`app/src-tauri/src/<x>/**` plus a TS store at
`app/src/lib/<x>-store.ts`) — because the board half of T-110's lane
join arrives on the docs watcher's existing `DocsModelState`; the lane
facts themselves come from git's own files, which belong to no
component. The three `decisions` are each cited BY A CRITERION of the
cards that will build into these paths: ADR-009 (T-110's Map /
null-prototype rule for branch, worktree and task-id keys), ADR-012 (a
Rust-side reader, zero webview grants), ADR-017 (the app renders what
lands; hand-driven is first-class, which is the follower-first ruling's
own footing). The file states in prose why C-02/C-03/C-04 stay
undeclared — no doc decides their layout, so any glob would be invented
— and T-008-s1's re-park stands untouched.

### The moved set was DERIVED, and the derivation instrument is worth keeping

Before running any suite, a throwaway probe `it()` was appended to
architecture-dogfood's describe, run once against the live tree with
C-15 on disk, and removed (removal proved by an empty `git status` for
`app/test/`). It printed the whole derivation — ids, kinds, mapping
size, per-component tally, issues, findings, the full edge list, drift,
declaredOnly, C-15's own record. That is T-073's technique reused, and
it is what let the SECOND assertions be reconciled without ever reading
a failure diff.

**EIGHT assertions move, across SIX bodies in THREE files.** Two are
second assertions in a body whose first also moves, and one is the
inverse trap:

| file | body | moves |
|---|---|---|
| `lib/parser/test/smoke.test.ts` | live-tree registry | id array 11 to 12 |
| `architecture-dogfood` | the registry body | id array 11 to 12, **then** the declared count 11 to 12 |
| `architecture-dogfood` | THE FINDINGS | `D3:C-15` appended after `D3:C-11`, in id order |
| `architecture-dogfood` | the relation table | `["C-15","C-10","planned",0]` appended; planned 9 to 10 while confirmed 13 and undeclared 10 HOLD |
| `architecture-dogfood` | drift flags | `drift` +C-15, **then** `declaredOnly` +C-15 |
| `map-dogfood-render` | node count | 11 to 12 |
| `map-dogfood-render` | edge count | 32 to 33 — and the SECOND assertion here, the undeclared tally, does NOT move |

**WHAT DOES NOT MOVE, and it is the criterion:** C-15's declared paths
match no file on disk, so it is declared-only rather than territory.
`fileComponent.size` stays **126**, the per-component tally gains no row
(a component with zero files contributes no entry), C-12's file list is
byte-identical, `derived.issues` stays `[]`, `unmappedFiles` stays `[]`,
`mode` stays `"full"`, and map-dogfood's `committed graph · 126 files`
hint does not move at all. That last is the exact inverse of T-073's
ledger entry, where a file joined the index and moved ONLY that hint.

**A FOURTH live-registry reader was checked rather than assumed.**
`app/src-tauri/crates/nputer-index/tests/arch.rs` drives this same
registry from Rust; its own header says it pins no count on purpose,
*"so nothing here pins a count that a sibling task can move"*. Confirmed
by reading it and by `cargo test` being unmoved at 382/0/3. Nothing else
in the tree reads the registry live — `git grep -l architecture/components`
returns 29 files and every other one uses fixtures.

### The new pin, and the shape-six question asked and ANSWERED

Criterion 5 wants the declared-only property asserted rather than
inferred, so `architecture-dogfood` gains one body: C-15's declared
`paths`, its `kind`, an empty `files`, `declaredOnly: true`, no entry in
`fileComponent`, exactly one `D3:C-15` finding and `issues: []`.

CONVENTIONS requires asking whether another test already drives this
exact call. **It was asked and MEASURED, not reasoned about.** Mutant A7
widened C-15's first declared glob to `app/src/lib/dispatch-*.ts` — a
different glob that still matches nothing — and the pair suite went
**17 passed / 1 failed, exit 1, the new body ALONE**. Every whole-array
assertion in the tree is blind to that mutation, because none of them
carries C-15's globs. The body kills a mutant nothing else kills.

### Gates, derived from the merge's own diff

`git merge-tree --write-tree 9b03ae6 HEAD` gives tree `ec3b45f9…`,
**exit 0 read before the substitution swallowed it**; `git diff
--name-only 9b03ae6 ec3b45f9…` gives **4 paths**. Main had not moved
from the cut, so the forecast tree IS `HEAD^{tree}` (verified equal) and
the merge's diff is the branch's own.

- **GRAPH REGEN — FIRES, on 3 of the 4 paths.** Stated rather than
  assumed, as the criterion demands: the component `.md` does NOT match
  the suffix list and `docs/` is excluded from it twice over; the three
  fixture edits (`.ts`, `.tsx`, `.ts`, all outside `docs/`) are what
  fire it. Asked the gate rather than predicting: `cargo run -p
  nputer-index -- index --check --root ../..` from `app/src-tauri` exits
  **1** with BOTH count lines present (so a real red, not the `--root`
  false red): committed **648862 bytes · 126 files · 1126 symbols · 1712
  edges** against fresh **648863 · 126 · 1126 · 1712**, `files +0 -0 ~3`,
  every one a `content, loc` change. **SYMBOLS AND EDGES ARE UNMOVED and
  the whole regen is +1 BYTE** — the new body is an anonymous arrow in
  an argument position and imports nothing, so it contributes no symbol
  and no edge. The regen belongs at the CHECKPOINT, not the merge.
- **BOOT GATE — NOT OWED, derived on 4 paths, 0 matches.**
  `app/src-tauri/**`, `app/src/**`, `app/package.json` and
  `app/src-tauri/Cargo.toml` are all absent; `app/test/**` is a GRAPH
  REGEN trigger and is deliberately not a boot trigger.
- **DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with the paths as
  ARGUMENTS, root-relative, never through `xargs`. One path under
  `docs/` is a code input, and it names **SEVEN readers across FOUR
  suites** — `cargo test` from app/src-tauri, `npm test` from app,
  `npm test` from tools/e2e, `npx vitest run` from lib/parser. All four
  were run and all four are green. 12 derived readers across 4 suites,
  **0 frontmatter issues**, census 119 sites in 22 files / 12 in 10
  resolving into docs/, 24 files holding the root, 1 package-relative
  site derived, root-anchor ledger at 6.
  **THE CARD'S OWN PARENTHETICAL IS STALE AND THE REPOSITORY WINS**:
  it says *"five readers, three suites at the fifth-triage census"*. It
  is seven and four, and the joining suite is `cargo test` through
  `arch.rs`. Filed as `T-088-s1` — this is CONVENTIONS' own *"no count
  is transcribed into this bullet"* remedy having been applied to the
  bullet and not to the seat that writes criteria.

### Suites, every exit read unpiped from `$?`

At `a2a691b` unless noted. Baselines first, at the base `9b03ae6`:
parser **263/263** exit 0, app **939/939 over 46 files** exit 0.

- `npx vitest run` from lib/parser: **263/263 across 12 files**, exit 0.
- `npx tsc --noEmit` from lib/parser: exit 0.
- `npm run build` from app: exit 0, 269 modules. **BOTH bundle hashes
  UNMOVED from main's** — `index-C86RloYb.css` / 45.06 kB and
  `index-DEkJr3K8.js` / 526.42 kB — which a zero-bundle-input diff
  requires, and which the drill then reproduced byte-for-byte in a
  separate worktree. That build runs `tsc && tsc -p tsconfig.test.json
  && vite build`, so both programs typechecked (T-073).
- `npm test` from app: **940/940 across 46 files**, exit 0. 939 + the
  one new body, and no new test FILE, so the file count is main's.
- `cargo test --no-fail-fast` from app/src-tauri: **382 passed / 0
  failed / 3 ignored**, exit 0, summed programmatically over **15**
  `test result:` lines. Unmoved from main, which a 0-file Rust diff
  requires. The `#[ignore]`d real-CLI smoke was left ignored.
- `npm test` from tools/e2e: **135/135**, exit 0, scratch port
  **14930**. `npm run typecheck`: exit 0.
- token lint: `--selftest` exit 0, lint exit **0** — `clean (TOKEN 131
  files; CONTROL 599 tracked text files)`. TOKEN does not move (this
  branch adds no `.ts`/`.tsx`/`.mjs` file anywhere the lint walks);
  **CONTROL is 599 at `a2a691b`, not the 621 STATE records at T-101's
  checkpoint** — three commits have landed since. The +1 closes by
  construction: this commit adds exactly one tracked text file.

### The poison drill — nine mutants, detached worktree, one side only

Detached scratch worktree at **`a2a691b`** (CONVENTIONS arm (c)). No
`CARGO_TARGET_DIR` was needed because no Rust is drilled — stated rather
than skipped — but the app suite needs a build first, so `node_modules`
(app and lib/parser) and `lib/parser/dist` were SYMLINKED in and `npm
run build` run there. **The drill reproduced the lane's bundle
byte-for-byte** (`index-C86RloYb.css` / `index-DEkJr3K8.js`), an
independent confirmation of the build. Baselines in the drill: the
dogfood pair **18/18 exit 0**, smoke **4/4 exit 0**.

Every mutation was applied by a Python driver with `encoding='utf-8'`, a
**relative-path refusal**, an **outside-the-drill refusal** and a
match-count-of-exactly-1 guard — all three demonstrated firing before
any mutant ran, so a command that does not name the drill cannot run at
all (T-085's `perl -i` accident prevented mechanically, not carefully).
Every mutated TEXT was read back with `git diff --unified=0` BEFORE its
suite ran.

| # | mutant (one side only) | exit | tests | red body |
|---|---|---|---|---|
| P1 | smoke's id array back to eleven | 1 | 3/4 | the registry body, `Array(12)` vs `Array(11)` |
| A1 | dogfood ids back to eleven | 1 | 17/18 | the registry body |
| A2 | declared count 12 to 11 | 1 | 17/18 | the registry body, **its second assertion** |
| A3 | findings lose `D3:C-15` | 1 | 17/18 | THE FINDINGS |
| A4 | relation table loses `C-15 to C-10` | 1 | 17/18 | the relation table |
| A5 | `drift` loses C-15 | 1 | 17/18 | drift flags, **first assertion** |
| A6 | `declaredOnly` loses C-15 | 1 | 17/18 | drift flags, **second assertion** |
| M1 | map nodes 12 to 11 | 1 | 17/18 | the node body |
| M2 | map edges 33 to 32 | 1 | 17/18 | the edge body |
| A7 | PRODUCER side: C-15's glob widened, still matching nothing | 1 | 17/18 | **the new pin ALONE** |

**A5 AND A6 RED THE SAME BODY, AND THE ARMS ARE SHOWN INDEPENDENT
RATHER THAN ASSERTED.** Re-run individually with the assertion text
captured: A5 reds on `expected [ Array(8) ] to deeply equal [ Array(7) ]`
(the `drift` array) and A6 on `expected [ 'C-01', 'C-07', 'C-11',
'C-15' ] to deeply equal [ 'C-01', 'C-07', 'C-11' ]` (the
`declaredOnly` array). A6 reaching its assertion at all PROVES the first
one passed — which is the hidden-second-assertion shape demonstrated,
on the very fixture whose ledger keeps warning about it. A1/A2 are the
same pair in the registry body.

**Restoration proved TWO ways after every single mutant** — an empty
per-path `git diff` and a sha256 against `git show a2a691b:<path>` —
and once more at the end, where the whole-worktree `git diff` is empty.
The three symlinks were **UNLINKED rather than deleted** and all three
targets verified present afterwards; `app/dist` removed; the worktree
removed and pruned. No `npm ci` or `npm install` was run anywhere during
the drill.

### Environment

Port **1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else, and never bind-probed: holder `node` pid **82549**, one
socket `TCP [::1]:1420 (LISTEN)`, unchanged. Scratch port **14930** was
`lsof`-probed FIRST (zero rows), then bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` in that order, and `lsof`-probed
free again after the lane. No `pkill` at any point. The T-090 and T-113
worktrees, the two `nputer-T-060` `fake_agent` orphans and the untracked
`z` in the main checkout were all left alone. No real model call, no CLI
spawn, no screen control — verification is headless throughout.

### Routed, not built

- **`docs/ARCHITECTURE.md`'s slug-map paragraph does not yet carry
  `app-dispatch` = C-15.** It is OUTSIDE this card's fence — the fence
  reads `docs/architecture/components/`, and `docs/ARCHITECTURE.md` is
  not under it — and no acceptance criterion asks for it. On the T-101
  precedent of ARCHITECTURE ticks landing at checkpoints, it is
  integrator ceremony at the checkpoint. The fence was NOT widened.
- **`T-088-s1`** — the card's reader census was stale (five/three
  against a measured seven/four); criteria should name the gate's
  command, not its output.
- **`T-088-s2`** — four `it()` TITLES carried counts this commit
  falsified, and nothing pins a title; they were corrected by hand
  because they were read, not because anything failed.
- **`T-088-s3`** — a NEAR MISS, measured: T-088 and T-090 both drilled
  into the literal path `<scratchpad>/drill` and both wrote
  `<scratchpad>/mutate.py`, because the scratch directory is shared
  between concurrent lanes and its UUID makes it look private. Each
  driver's post-T-085 path refusal guards a shared PREFIX, so it cannot
  tell its own drill from a sibling's. `git worktree add`'s refusal of
  an existing path is what kept it safe, and that protects the create,
  not the mutate. T-088's drill was removed and pruned before T-090's
  existed and all nine restorations proved against `a2a691b`, so nothing
  was corrupted. Fix: name the drill `drill-T-NNN`.
