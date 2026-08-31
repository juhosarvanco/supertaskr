---
id: T-208
title: "`path.canonicalize()` is `read_contained`'s FOURTH refusal, it is UNPINNED, and unlike the shadowed halves it is PINNABLE — lift it and a `..` traversal returns the contents of a file outside the root"
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: verifier claude-opus-5@subagent @T-194, re-measured by T-194's executor before filing; id allocated by the integrator
builder: claude-opus-5@subagent
review: independent
---

**FOUND BY `T-194`'S BLIND VERIFIER, RE-MEASURED BY `T-194`'S EXECUTOR AT
`87929c2` BEFORE FILING, AND MEASURED RATHER THAN INFERRED BOTH TIMES.**
`T-194` named `read_contained`'s refusals A, B and D at their site under a
heading that read as the complete set. **It omitted `canonicalize()`,
which is load-bearing and which nothing pins.** That omission is now
corrected at the site (`T-194`, comment-only); **the missing body is this
card**, routed rather than built, on the precedent `T-186` set when it
routed `.follow_links(true)` as `T-196` instead of widening its own fence.

## The refusal, and what it independently contributes

> **PINNED since this card landed — see the implementation notes.** The
> title and the paragraph above say UNPINNED and *"which nothing pins"*;
> both are the DISPATCHED SPEC, kept verbatim as the record of what was
> asked for, and both stopped being true at this card's own tip. The pin is
> `a_dot_dot_traversal_never_reads_outside_the_root` in `resolve/mod.rs`,
> which kills its mutant ALONE (257/1, exit 101, at `2ccb498`).
> **Assigned by this card's verifier as `T-194`'s CORRECTION 2 — the same
> defect on the card one id away — and it is a POINTER rather than a
> rewrite** because a card is the contract it was dispatched under.
> One residual the verifier raises, recorded here rather than acted on:
> **C+D's containment is only as strong as the caller's ROOT being
> canonical** — a non-canonical root makes `starts_with` false for
> everything and this function refuses everything, silently. Benign today
> (`lib.rs` canonicalizes once at `validate_root` and hands the one
> `canon_root` on), and `walk.rs:144` states that third condition for its
> own line while this site does not.

`app/src-tauri/crates/nputer-index/src/resolve/mod.rs::read_contained`:

    let meta = std::fs::symlink_metadata(&path).ok()?;
    if meta.file_type().is_symlink() || !meta.is_file() {   // A, B
        return None;
    }
    let canon = path.canonicalize().ok()?;                  // C — this one
    if !canon.starts_with(root) {                           // D
        return None;
    }
    std::fs::read_to_string(&canon).ok()

**What C contributes is not its `.ok()?` arm but the RESOLUTION it performs
before D reads the result.** `Path::starts_with` compares COMPONENTS, so
`<root>/inside/../../elsewhere/loot.json` textually starts with `<root>`
and satisfies D on its own. Only `canonicalize` collapses the `..`.
**Without C, D is a string-prefix test wearing a containment test's name**,
and any `..` a caller puts in `dir` walks straight out of the root.

## Measured twice, at two benches, with the same numbers

Crate scope, `cargo test -p nputer-index --no-fail-fast`, **12 targets**
every arm. Verifier's bench at `26cba92`; executor's re-measurement at
`87929c2` in a role-qualified scratch with its own `CARGO_TARGET_DIR`.

| arm | result |
|---|---|
| baseline | exit 0, **256 passed / 0 failed** |
| `canonicalize().ok()?` → `path.to_path_buf()`, no probe | exit 0, **256/0 — NOTHING RED** |
| the probe below, on SHIPPED code | exit 0, **257/0** — it passes |
| the probe below + that lift | exit 101, **256/1 — the probe ALONE** |

The failing assertion is the whole finding:

    assertion `left == right` failed: a .. traversal must not escape the root
      left: Some("{\"loot\":1}")
     right: None

**`read_contained` returned the contents of a file outside the root.**

## Why this is a DIFFERENT finding from `T-194`'s "cannot red"

`T-194` established that `read_contained`'s `!meta.is_file()` half is
shadowed downstream and **no body can pin it** — that is a cannot-red
finding and it was landed as such. **C is the opposite case and must not
be read as the same one**: it is unpinned *today* and a body that pins it
exists and has been run. That is a coverage hole with a fixture, exactly
the distinction `T-186`'s verifier drew for `.follow_links(true)`.

## The probe, run in `T-194`'s drill and deliberately not landed there

Aim it at a SECOND `TempTree` so the lifted arm terminates in a FIXTURE
(`docs/CONVENTIONS.md`, LIFTING A SAFETY GUARD TO DISCRIMINATE) — the
sibling temp tree is reachable as `../<its basename>` because `TempTree`
places every tree under one parent:

    let t = TempTree::new("...");
    let outside = TempTree::new("...-outside");
    let root = t.root().canonicalize().expect("canon");
    outside.write("loot.json", "{\"loot\":1}");
    let outside_root = outside.root().canonicalize().expect("canon");
    // POSITIVE CONTROL: the loot IS readable when the root contains it,
    // so the None below cannot be there-was-nothing-there.
    assert_eq!(
        read_contained(&outside_root, "", "loot.json").as_deref(),
        Some("{\"loot\":1}"),
    );
    let rel = format!("../{}", outside_root.file_name().unwrap().to_str().unwrap());
    assert_eq!(read_contained(&root, &rel, "loot.json"), None);

The verifier's own spelling of the same fixture uses an in-root climb,
`read_contained(&root, "inside/../../probe-outside", "loot.json")`; either
form reds on the lift. **The sibling-`TempTree` form is preferred because
it cleans itself up and never writes into the shared temp dir directly.**

## Acceptance criteria

- A body SHALL pin `canonicalize()` ALONE: it SHALL pass on shipped code
  and red when that call is replaced by a non-resolving equivalent, with
  the failing count read as **ONE** at crate scope under `--no-fail-fast`.
- THE BODY SHALL carry a POSITIVE CONTROL proving the fixture would
  otherwise have been read, so a `None` cannot be satisfied by
  there-was-nothing-there.
- THE LIFTED ARM SHALL be proven to terminate in a FIXTURE rather than in
  repository content, and the proof SHALL be shown rather than asserted.
- The site comment's refusal COUNT SHALL still match the code after this
  card lands — `T-194` put the count in the heading precisely so an
  omission is visible, and a card that adds a body must not leave it stale.
- NO predicate SHALL be deleted or weakened: this card ADDS evidence.
- Verification: headless, `cargo test`.

## Read beside

`T-194` (the site, the four-refusal accounting, and the drill this probe
was first run in), `T-196` (the same unpinned-but-pinnable shape, routed
the same way), and `T-186` (the precedent that a lane routes rather than
widens its own fence).

---

## Implementation notes (executor, lane `task/T-208-lane`)

Base DERIVED with `git merge-base main HEAD` = **`d7ec96c`**, matching the
brief. Fence manifest read first: **1 expanded path**,
`app/src-tauri/crates/nputer-index`, from token `crate-index` -> C-07,
`alwaysWritable: ["docs/tasks"]`. Every arm ran from
`/Users/ujju/Projects/nputer-T-208/app/src-tauri` with a PRIVATE
`CARGO_TARGET_DIR=/Users/ujju/Projects/T-208-scratch/target`, command
verbatim and identical on every arm:

    cargo test -p nputer-index --no-fail-fast

### The four arms, every figure at its own ref

| arm | ref | targets | passed | failed | exit |
|---|---|---|---|---|---|
| baseline, shipped | `d7ec96c` | 12 | **257** | 0 | 0 |
| `canonicalize().ok()?` -> `path.to_path_buf()`, NO probe | `d7ec96c` | 12 | **257** | **0** | 0 |
| the probe, on SHIPPED code | `3cd86e9` | 12 | **258** | 0 | 0 |
| the probe + that lift | `3cd86e9` | 12 | **257** | **1** | **101** |
| the probe + a RESOLUTION-ONLY lift | `3cd86e9` | 12 | **257** | **1** | **101** |

2 ignored on every arm. **The premise was re-derived by building the
mutant and watching it survive**, not inherited: arm 2 is 257/0 with
NOTHING RED, so the card's own claim holds at this ref with a different
number than it records.

The failing arm names ONE body and prints the escape rather than a type:

    failures:
        resolve::tests::a_dot_dot_traversal_never_reads_outside_the_root

    assertion `left == right` failed: a .. traversal must not escape the root
      left: Some("{\"loot\":1}")
     right: None

`read_contained` returned **the contents of a file outside the root**.

### The fifth arm is new, and it settles a sentence the site used to ARGUE

The site claimed *"what C contributes is not its `.ok()?` arm but the
RESOLUTION"*. That was reasoning, not measurement. A second one-side
mutant KEEPS the error arm and discards only the resolution —

    let canon = { let _ = path.canonicalize().ok()?; path.to_path_buf() };

— and reds **the same single body with the same loot, 257/1, exit 101**.
So the pinned half is the resolution, measured. One construct, two jobs,
now separated.

### CORRECTION — the card's figures had MOVED, exactly as the brief warned

The card records **256 passed / 0 failed** at `87929c2` for baseline and
for the no-probe lift, and **257/0 · 256/1** for the probe arms. **At
`d7ec96c` those are 257/0, 257/0, 258/0 and 257/1.** Main moved under the
card between filing and dispatch. Nothing about the finding changes; the
DELTAS are identical. This is the same drift `T-196` reported when its
card's `252/0` was `256/0` by the time it ran, and it is why a quoted
count is re-run rather than transcribed.

### THE SWEEP — the count was not WRONG, it was UNITLESS, and the sibling had already been fixed

`T-194` put the count in the heading so an omission would be visible;
`T-196`'s verifier then showed (its correction 2) that a count with no
UNIT cannot do that job. **That repair was applied to `walk_root` and not
to `read_contained` — the site whose omission STARTED the thread.**
`walk.rs` has carried *"THE UNIT IS A MECHANISM, NOT A SITE"* since
`T-196`; this site's heading still read *"The FOUR refusals"* over four
letters.

Recounted hostile from source at `d7ec96c`, letters unread first:
**SIX constructs in `read_contained` can drop the read; the letters name
FOUR.** Nothing is omitted — it is a unit mismatch, and both counts are
now in the block:

    FOUR LETTERED REFUSALS  A, B, C, D — the checks made on purpose
    SIX CONSTRUCTS          those four plus two unlettered error arms
    FIVE STATEMENTS         the same six, A and B sharing one `if`

The two unlettered ones are named at the site: **`symlink_metadata(&path)
.ok()?`** and the trailing **`read_to_string(&canon).ok()`** — the second
being also **the construct that SHADOWS refusal B**, which B's own bullet
already turns on without saying they are the same line. And **C is one
construct doing TWO jobs**, which the fifth arm above separates.

### Acceptance criteria, read literally

1. **MET** — a body pins `canonicalize()` ALONE: passes on shipped code,
   reds on the non-resolving replacement, **failing count read as ONE** at
   crate scope under `--no-fail-fast`, exit 101.
2. **MET** — TWO positive controls, both passing in BOTH arms: an ordinary
   contained read (`read_contained(&root, "inside", "kept.json")`), and the
   loot read from a root that DOES contain it
   (`read_contained(&outside_root, "", "loot.json")`), so the `None` cannot
   be satisfied by there-was-nothing-there.
3. **MET, and SHOWN rather than asserted** — the lifted arm terminates in a
   FIXTURE: the traversal is aimed at a second `TempTree`;
   `root.parent() == outside_root.parent()` is asserted (that is WHY
   `../<basename>` reaches it); and the escaped path is canonicalized and
   compared **to the fixture file itself** before the guard is exercised.
   Repository content is never on the path. The body additionally asserts
   the MECHANISM — uncollapsed, the traversal path **clears refusal D on
   components alone** — so the refusal is attributable to C and not to D.
4. **MET** — the count still matches the code, and now carries its unit.
   See THE SWEEP above.
5. **MET** — nothing deleted, nothing weakened. The only non-comment change
   in the whole lane is the ADDED test body; `read_contained`'s body is
   byte-identical to `d7ec96c` (proved by hash in the drill ledger).
6. **MET** — headless `cargo test` throughout. No screen control.

### Drills — one side only, read back, restored, proved by HASH

Every mutation was a single anchored `perl -CSD -0777` substitution or one
exact-string edit, **read back with `git diff -U1` before any suite ran** —
the count is not the proof, the text is. The work was **COMMITTED before it
was drilled** (`3cd86e9`), so no restore could pass by throwing away work
`HEAD` never saw (`T-072-s1`'s mechanism). Restored with `git restore
--source=<ref> --staged --worktree --`, both sides named, proved by
**sha256** against the tree at that ref, with an empty `git status` as the
COMPANION and never as the proof.

Only one file was ever mutated,
`app/src-tauri/crates/nputer-index/src/resolve/mod.rs`:

- at `d7ec96c` — `4640ff10712712537228eac8e17ba6782e90fc0338b5d96fce96fbdb125be96f`
  (worktree and `git show HEAD:` agreeing before the drill, and the
  worktree again after the restore);
- at `3cd86e9` — `b24cef7144457ab361d2ab4be2758d127c68e422313f7019aee384b08c1689aa`
  (`git show 3cd86e9:` and the worktree agreeing after each of two
  restores).

**Three mutant arms, three restores, 3 for 3 sha256-proved**, no arm left
the tree dirty.

### Noticed, not done

- **`cargo fmt --check` exits 1 across the WHOLE crate** — 184 hunks in
  **29 files**, 28 of which this lane never touched. Pre-existing, and
  `cargo fmt` is not a CI step (`.github/workflows/ci.yml` runs `cargo
  test`, `index --check` and `cargo audit`, no fmt and no clippy). Not
  acted on and not routed as a card: a crate-wide reformat is not this
  fence's business and nobody has asked for one.
- **`T-196` left the three `walk_root` error arms unpinned and deliberately
  minted no id** for whether any is PINNABLE. Untouched here; the same
  question exists for this site's two unlettered arms. Recorded rather than
  routed, on `T-196`'s own precedent that a lane cannot construct a card id
  safely and the dispatching seat allocates.

### REACHABILITY — this pins a CONTRACT, and today no production caller can supply a `..`

Stated because the card's title (*"a `..` traversal reads outside the
root"*) is true of the FUNCTION and could be read as a live exploit. It is
not one at `d7ec96c`, and saying so is the difference between a coverage
hole and an incident.

`git grep 'read_contained('` returns **three production call sites**, each
re-read rather than assumed:

- `resolve/mod.rs:183` `PackageIndex::nearest` — `dir` is
  `parent_dir_of(rel)` over a WALKED root-relative POSIX path;
- `resolve/tsconfig.rs:56` `TsconfigIndex::nearest` — the same, climbing
  with `parent_dir_of_owned`, which only STRIPS segments;
- `resolve/rust.rs:474` `manifest_dirs` — the same, climbing likewise.

Every one of those `dir` values is generated by `walk_root`, which builds
paths by descending real entries from a canonical root, so no `..`
component exists to pass on. **And the one place repository CONTENT could
inject a `..` — a `tsconfig.json` whose `baseUrl` or `paths` climbs — goes
through `normalize_join` (`resolve/ts.rs:57`), which collapses `..`
SYMBOLICALLY and returns `None` the moment the stack underflows.** It
therefore cannot emit a `..`-bearing string at all, which its own body
`normalize_join_handles_dots_and_flags_escapes` already pins.

**The search was shown capable of a non-zero answer before the zero was
written down** (`docs/CONVENTIONS.md`): the same grep returns 3 hits, and
the `..` question was answered by reading all 3, not by a grep for `..`
returning empty.

**So refusal C is defence-in-depth today and the pin protects the
CONTRACT** — `read_contained`'s signature takes a caller-supplied segment,
and any future caller that passes one through would be relying on exactly
the resolution nothing was checking. That is the `T-196` SIGNATURE
argument turned around: the same reasoning that makes the attack
impossible in `walk_root` makes it *possible* here the moment a caller
changes, and only this call stands in the way.

### Standing gates, DERIVED at tip `28f1910` against main `40c9b8b`

`TREE=$(git merge-tree --write-tree 40c9b8b HEAD)` — **exit read FIRST,
unpiped: 0** — tree `6fbcd54`. `git diff --name-only 40c9b8b "$TREE"`
returns **2 paths**: `resolve/mod.rs` and this card.

| gate | trigger | verdict |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **FIRES** on 1 path. ASKED rather than predicted: `index --check --root ../..` **exit 1 STALE**, `files +0 -0 ~1`, the `~1` being `resolve/mod.rs` (content, loc 718 -> 869). Bytes, files, symbols and edges are IDENTICAL on both sides (1153961 · 200 · 2456 · 2379), so the only delta is this lane's own loc. **NOT acted on** — `docs/architecture/graph.json` is outside this fence, and the bullet lands the regen **with the CHECKPOINT** regardless. The integrator owes it. The figure does not move when a later card-only commit lands: `docs/` is excluded from the walk. |
| BOOT GATE | `app/src-tauri/**`, `app/src/**` or either manifest | **FIRES** on 1 path. **exit 0**, both `[nputer]` startup lines detected, on `NPUTER_BOOT_PORT=22080` DERIVED from the card id (20000 + 208×10), `lsof` showing **0 rows** immediately before the run. 1420 was read once with `lsof` and never probed, bound or named. |
| DOCS GATE | a `docs/` path a code suite READS | **FIRES** on 1 path. `docs-gate.mjs` **exit 1 — a VERDICT, not a crash**: it printed `docs-gate:` lines (26 derived readers across 4 suites, 0 frontmatter issues), which is the distinction `docs/STATE.md` warns an exit code alone cannot make. Three suites named, all green below. Fed the RANGE RULE's own path list as SEPARATE LITERAL PATHS, never a variable. |
| METHOD EVAL | `method/**` | **NOT OWED** — 0 of 2 paths match. |

The three suites the DOCS GATE named, at `28f1910`, after `npm ci` in
`tools/e2e/` (without it that gate dies at import and exits 1, which it
spells `FOUND`):

- `npx vitest run` from `lib/parser/` — **exit 0, 16 files / 344 tests**
- `npm test` from `app/` — **exit 0, 50 files / 1116 tests**, after
  `npm run build` **exit 0** (a fresh worktree has no `app/dist`)
- `npm test` from `tools/e2e/` — **exit 0, 409 passed (5.6m)**, on
  `NPUTER_E2E_PORT=32080` derived 30000 + 208×10, `lsof` **0 rows** before
  binding

CI-step gates at the same ref: `npm run lint:tokens` **exit 0** (clean;
166 TOKEN files, 1074 CONTROL files), `npm run lint:docs` **exit 0**,
`npm run capabilities:check` **exit 0, CURRENT (33576 bytes)** — this lane
touches no `tools/e2e/tests/` spec name, so the census could not move.

**This ledger is the lane's last commit and it adds no path the set above
does not already carry** — `docs/tasks/T-208-*.md` is already one of the
two — so no gate DECISION moves with it. The three docs-gate suites were
re-run at this exact tip after it landed; results unchanged.

### Ceremony

Row read from `method/tasks/TASK-FORMAT.md`: **S, touching shipped code —
executor → verifier**, self-integration only once the verdict is in AND
while holding the integration checkout. This lane holds neither and takes
neither. Status stamped `verifying` **in this lane**; verifier fields left
empty. Worktree left STANDING for the holder (lane-protocol rule 6): a
worktree removed before the verdict destroys the only reproducible copy of
what was measured.

---

## Verdicts

2026-09-01 — claude-opus-5@subagent (verifier, blind two-phase seat):
**APPROVED WITH ONE ASSIGNED CORRECTION.** The card's subject is fixed.
`canonicalize()` has a body, the body kills its mutant **alone and by
name**, and — the thing that decides this pass — **the body is not
vacuous**. I went into phase 2 with a specific vacuity attack derived
blind from the card's own suggested probe, and the lane had already
closed it with a control the card never asked for. The one correction is
prose in this card's own spec half, it is the shape this family keeps
producing, and it is not a reason to hold the lane.

Measured at **`2ccb498`** (lane tip) and **`d7ec96c`** (its base). Every
figure below names its ref. Bench: my own detached worktree at
`/Users/ujju/Projects/nputer-V-208` with a private `CARGO_TARGET_DIR` at
`/Users/ujju/Projects/V-208-verify-scratch/target`, **cold for the first
arm**; command verbatim on every arm,
`cargo test -p nputer-index --no-fail-fast`, exits captured by redirect
and `$?` before any pipe. Nothing was run in the integration checkout or
in the lane's worktree.

### Phase 1 was sealed before the diff was opened

The attack set was written from the contract alone — this card at
`d7ec96c`, `T-186`, `T-194`, `T-196`, CONVENTIONS, lane-protocol,
roles/verifier — and saved before the branch, the diff or the notes
existed to me. sha256
**`e88968a11c480e30d888217d9fbed7ca5affc34fc85c4a22122aa4c6a1d83ce4`**,
387 lines, at `/Users/ujju/Projects/V-208-verify-scratch/`.

**I checked this card's HEADINGS before reading its body**, per the
hazard `T-213` now carries: at `d7ec96c` it is 123 lines with no
implementation notes and no verdicts. Blindness intact.

**DISCLOSURE, AND THE LEAK IS NOT MINE — AND IT IS THE SECOND
INSTANCE.** My phase-1 brief named the executor's scratch port (22080)
and this card's line count at the tip (355). Both are executor-derived
and had no business above the line; `docs/STATE.md` §"Next up" 7 says a
verifier's brief carries **no** lane fact. Neither is a mutant number or
a suite figure, so phase 1 stands. **The coordinator identified it as
their own defect, and asked that the record carry that this is the
SECOND time**: `T-196`'s verifier disclosed the identical leak — the
executor's ports and the card's line count — hours earlier, was told,
undertook to tighten it, and the same two facts travelled again. The
reasoning that let it through both times was *"it isn't a mutant
number"*. Carried here so the third instance has a countable prior.

**AND THE `review: independent` REPAIR LANDED.** It is in the
frontmatter at `d7ec96c`, i.e. stamped at DISPATCH. `T-194`'s verifier
found that field **lane-stamped** — "the weakest possible form of it" —
assigned the repair to the dispatching seat, and recorded that it was
already the second consecutive sighting. This is that repair arriving.
Credited, because an assigned correction that lands and is never noticed
teaches nothing.

### What reproduced — 12 targets and 2 ignored on every arm

| # | ref | mutation, ONE SIDE ONLY | exit | passed/failed | failing body |
|---|---|---|---|---|---|
| 1 | `2ccb498` | none (cold build) | 0 | **258/0** | — |
| 2 | `2ccb498` | `canonicalize().ok()?` → `path.to_path_buf()` | 101 | **257/1** | the new body, **ALONE** |
| 3 | `d7ec96c` | none | 0 | **257/0** | — |
| 4 | `d7ec96c` | the same lift, no probe | 0 | **257/0** | none — the premise holds |
| 5 | `2ccb498` | `{ let _ = path.canonicalize().ok()?; path.to_path_buf() }` | 101 | **257/1** | the same body, **ALONE** |

Arm 2's panic is byte-identical to the lane's ledger, at `mod.rs:827`:

    assertion `left == right` failed: a .. traversal must not escape the root
      left: Some("{\"loot\":1}")
     right: None

**Every row of the lane's five-arm ledger reproduced at an independent
bench, exit for exit and name for name.** Its two recorded blob hashes
are real, not quoted: `git show d7ec96c:` gives
`4640ff10712712537228eac8e17ba6782e90fc0338b5d96fce96fbdb125be96f` and
`git show 3cd86e9:` gives
`b24cef7144457ab361d2ab4be2758d127c68e422313f7019aee384b08c1689aa`, both
character-identical to the ledger. My own six mutations were restored
against the tip blob
`9d895110640e89f9b41b1103a2894570fec84ba18ab20b62542941a2a68c3cc6`,
**6 for 6 sha256-proved**, with an empty `git status` kept as companion
and never as proof, and every mutation read back with `git diff` and
hash-compared before its suite ran (a no-op substitution aborts the arm
rather than reporting a green).

### THE HEADLINE ATTACK, DERIVED BLIND — AND THE LANE HAD ALREADY CLOSED IT

Phase 1 §2, written before the diff: **the card's own suggested probe is
structurally vacuous.** It uses TWO DIFFERENT ROOTS — the control reads
through `outside_root`, the refusal through `root` — so dropping
`.canonicalize()` from the refusal's root alone makes
`canon.starts_with(root)` false for every path under `/var/folders`,
`read_contained` refuses **everything**, the refusal assertion still sees
its `None`, and the control never notices because it goes the other way.
A body of the card's shape would stay green while measuring nothing, on
shipped code. I ruled it REJECTED-level in advance and named the fix: a
second control **through `root`**.

**Measured, arm 6 at `2ccb498`** — `let root = canon_root(&t);` →
`let root = t.root().to_path_buf();`, the refusal's root only:
**exit 101, 257/1, this body ALONE**, dying at `mod.rs:779` —

    assertion `left == right` failed: control: an ordinary inside file must read
      left: None
     right: Some("{\"who\":\"inside\"}")

That is POSITIVE CONTROL 1, and it is exactly the control I derived blind
and the card does not ask for. **The lane found it without being told.**
AC2 as written is satisfied by the card's own weaker spelling; the lane
shipped the stronger one.

### What FAILED to break it, reported as the seat owes

Four more one-side arms at `2ccb498`, each aimed at a distinct vacuity,
each killed **by the right assertion** rather than by volume:

| arm | attack | result | died at |
|---|---|---|---|
| 6 | **M1** non-canonical refusal root | 257/1, this body alone | `779` — control 1 |
| 7 | **M3** refuse-everything (`if !canon.starts_with(root)` → `if true`) | 234/24, this body among them | `779` — control 1 |
| 8 | **M4** delete `outside.write("loot.json", …)` | 257/1, this body alone | `785` — control 2 |
| 9 | **M2** near-miss traversal (`../<basename>` → `../<basename>-nope`) | 257/1, this body alone | `807` — the reachability assertion, `NotFound` |

**M3 is the arm `T-196`'s verifier said to want on any future card of
this shape** — one that leaves the refusal assertion PASSING and reds the
CONTROL. It does. So the control does not merely RUN, it **EXCLUDES the
reading it exists to exclude**: a `read_contained` that refuses
everything cannot satisfy this body. **M4** excludes
there-was-nothing-there. **M2** excludes the absent-directory reading —
and M2 is the one that matters most, because the card's `TempTree`
sibling-hop premise is a claim about a helper, not a fact of the
language. It is true (`testutil.rs:14` puts every tree directly under
`std::env::temp_dir()`), and the body **asserts** it rather than relying
on it.

**Both controls are in the SAME body and BOTH run BEFORE the refusal.**
Phase 1 §A10 called that out as the thing to check; it holds.

### ESCAPE or TYPE — the question the criteria leave open, settled

AC1 demands only a TYPE. The body's final assertion is `== None`, which
is *strictly stronger* than any `!= Some(loot)` form. What makes it an
ESCAPE claim is not the assertion but the four fixture assertions in
front of it, and my phase-1 ruling was that a type assertion suffices
**if and only if** the target is proven reachable and the refusing root
is proven live. Both are proven here, in-body, before anything is
exercised — including the sharpest of them, `escaped.starts_with(&root)`,
which asserts the **mechanism**: uncollapsed, the traversal path clears
refusal D on components alone, so D cannot be what refuses it and C is.
The loot is distinctive on both name and content (`{"loot":1}` versus the
inside fixture's `{"who":"inside"}`), so the panic's `left:` identifies
the file it came from unambiguously.

### The count of ONE, attacked from the other end

A count of one can be a count of the wrong one. It is not: under arms 2,
5, 6, 8 and 9 the single failure is
`resolve::tests::a_dot_dot_traversal_never_reads_outside_the_root`
itself, read **by name out of the output** rather than inferred from a
count — not a file-count body reddening on volume. Measured on a cold
build against a private target directory, so the
mutant-looks-dead-against-a-stale-binary reading is excluded by
construction rather than by hope.

### The accounting, recounted independently from source

I counted `read_contained`'s droppers from the function body before
comparing against the lane's letters, and got the same three numbers:
**SIX constructs** (`symlink_metadata(&path).ok()?`, `is_symlink()`,
`!meta.is_file()`, `canonicalize().ok()?`, `!canon.starts_with(root)`,
`read_to_string(&canon).ok()`), **FIVE statements** (A and B share one
`if`), **FOUR lettered**. **Nothing is omitted** — this is a unit
mismatch and not a `T-194` repeat, and all three counts now carry their
unit at the site. The lane's claim that `T-196`'s correction 2 reached
the SIBLING and not the site that started the thread is **true**:
`walk.rs:88` has carried *"THE FIVE LETTERED GATES, OF ELEVEN MECHANISMS"*
since `T-196`, while this site's heading still read *"The FOUR refusals"*
at `d7ec96c`. Fixing it here is the right call and was not asked for.

### REACHABILITY — I ran my own procedure and reached PINNED independently

Phase 1 §5 set the test by SIGNATURE, this family's standard, and made
both answers reportable. `git grep 'read_contained'` **from the
repository root** at both refs returns **three production call sites**,
each read to its origin rather than taken:

- `resolve/mod.rs:232` `PackageIndex::nearest` and `tsconfig.rs:56`
  `TsconfigIndex::nearest` — `dir` originates at `mod.rs:420`,
  `let dir = parent_dir_of(rel)` over the WALKED map's keys; both climb
  with `parent_dir_of`/`parent_dir_of_owned`, which only STRIP at the
  last `/` and can introduce nothing.
- `rust.rs:474` `manifest_dirs` — the same shape over `rust_files`.

`walk_root` generates every `rel` by descending real entries from a
canonical root, so no `..` component exists to pass on. **And the
content-injectable route is weaker than the lane claims, in the lane's
favour**: a `tsconfig.json` `baseUrl`/`paths` goes through
`normalize_join` (`ts.rs:57`), whose body collapses `..` on a segment
stack and returns `None` on underflow — so it cannot emit a `..`-bearing
string — **and its output never reaches `read_contained` at all**. It
terminates in `first_hit` (`mod.rs:352`), a pure `walked.contains()` set
lookup with no filesystem access. **PINNED, not LIVE, confirmed
independently.** The card's title is true of the FUNCTION and the notes
are right to say so out loud.

**My A5b residual, checked and benign — and worth one sentence at the
site.** `read_contained`'s containment is only as strong as the caller's
root: a non-canonical root makes `starts_with` false for everything and
the function refuses **everything, silently** — the *"no word for I could
not tell"* shape `T-196` found one module over, and the very failure mode
my M1 arm exploits. It is benign today because `lib.rs:259`
`validate_root` canonicalizes once at a single boundary and hands the one
`canon_root` to both `walk_root` and `resolve_all`. `walk.rs:144` already
states this third condition for its own line; this site does not.

### CORRECTION 1 — THIS CARD'S OWN SPEC HALF IS FALSE AT ITS TIP

Assigned, non-blocking, prose only.

    title: "... is `read_contained`'s FOURTH refusal, it is UNPINNED, ..."
    line 20: "**It omitted `canonicalize()`, which is load-bearing and
              which nothing pins.**"

**Both are false the moment this lane merges**, because this lane is what
pins it. The lane applied `T-196`'s correction 2 to the SITE and did not
apply `T-194`'s correction 2 to its OWN CARD — and `T-194`'s correction 2
is *literally this defect*, on the card one id away: *"THE CARD'S SPEC
HALF STILL SAYS 'TWO' AT THE TIP."* This family exists because a landed
sentence in `T-140-s9`'s sweep was false and cost the next lane the work
of rediscovering it; leaving the same shape in the title re-arms it for
whoever greps the board for what is pinned.

**Assigned, in `T-194`'s own disposition:** add ONE line under
`## The refusal, and what it independently contributes` reading *"PINNED
since this card landed — see the implementation notes"*. **Do not rewrite
the dispatched spec or the title**: the record of what was dispatched is
worth keeping, and a pointer preserves both. Notes-only, no field moves.

**Not mechanically caught, which is why it needs a human sentence.**
`tools/e2e/scripts/card-figures.mjs` is a derivation module with no I/O
at import, wired into neither `package.json` nor `ci.yml`, so nothing
gates a stale figure or a stale claim in a card body. I checked before
ruling on severity.

**The SOURCE half of this sweep is CLEAN**, and I ran it rather than
assumed it: `git grep 'unpinned\|UNPINNED'` and `git grep 'T-208'` across
`app/`, `lib/` and `tools/` at `2ccb498`. `resolve/mod.rs:126` reads
*"what unpinned looked like"* — past tense, correct. Every `walk.rs`
citation of `T-208` describes the FINDING (that the call is load-bearing
in `read_contained`), never its pinned-ness, so none went stale. No code
site still calls C unpinned.

### Every criterion, read literally

1. **MET.** Pins `canonicalize()` alone; passes at the tip (258/0);
   reds on the non-resolving replacement at **257/1, exit 101**, crate
   scope, `--no-fail-fast`, the failing count read as **ONE** and the one
   confirmed by name. Arm 5 additionally separates the construct's two
   jobs — the error arm kept, only the resolution discarded, same body,
   same loot — so *"what C contributes is the RESOLUTION"* is now
   measured where the site used to argue it. **§2 does not make arms 2
   and 5 uninformative**, and this is the reason it does not: M1 was
   killed, so the body is known non-vacuous before either arm is read.
2. **MET, in a stronger form than the card asks.** TWO controls, both in
   the same body, both before the refusal, and **both shown to
   discriminate** (arms 6/7 and 8) rather than merely to run.
3. **MET, and SHOWN.** `root.parent() == outside_root.parent()`; the
   escaped path canonicalized and compared **to the fixture file
   itself**; `!escaped_canon.starts_with(&root)`; and the mechanism
   assertion that makes the refusal attributable to C. Arm 9 proves the
   chain has teeth: break the hop and the body reds at the reachability
   assertion, not at the refusal.
4. **MET**, and improved — the count matches the code and now carries
   its unit. Recounted hostile from source; nothing omitted.
5. **MET.** I filtered the diff to non-comment lines: **every one is
   inside the new `#[test]`**. `read_contained`'s five statements are
   byte-identical to `d7ec96c`. Nothing deleted, nothing weakened.
6. **MET.** Headless `cargo test` throughout; no screen control.

### NOT corrections

- **The lane's `256`-vs-`257` premise correction is right and was owed.**
  It re-derived rather than transcribed, and my four independent
  predictions — base 257/0, tip 258/0, tip+lift 257/1-alone, base+lift
  257/0 — were written into the sealed attack set before I measured and
  all four landed. Two derivations agreeing stop being checks on each
  other, which is why I measured anyway.
- **`cargo fmt --check` failing crate-wide** is pre-existing, is not a CI
  step, and is correctly left alone. Not this fence's business.
- **The graph is STALE (`index --check` exit 1)** and the lane correctly
  ASKED rather than predicted, then did not act: `docs/architecture/`
  is outside its fence and the regen lands with the CHECKPOINT. The
  integrator owes it. Re-derived at my own tip: bytes, files, symbols and
  edges identical on both sides, the sole delta being this lane's own
  `loc` on one file.
- **Ceremony is correct.** `size: S` with a verifier row: the lane
  stamped `verifying` in its own lane, left the verifier fields empty,
  merged nothing, checkpointed nothing, and **left its worktree
  standing** (lane-protocol rule 6). I checked this specifically, because
  a worktree removed before the verdict destroys the only reproducible
  copy of what was measured.

### An observation I mint no id for

`Path::join` with an ABSOLUTE segment discards the base, so
`read_contained(root, "/etc", "passwd")` builds `/etc/passwd` — the same
class as this card's `..` (a caller-supplied segment leaving the root),
refused by **D alone** rather than by C, and pinned by no body. It is
contract-only today for exactly the reason above: no production caller
supplies an arbitrary `dir`. Recorded rather than routed, and **I mint no
id** — `T-186` established that no seat outside the integrator can derive
a free one, since an unmerged sibling's ids are invisible to every
checkout. Board-side, alongside `T-196`'s still-open question about
whether the unlettered error arms are PINNABLE.

### Gates re-run at MY OWN tip, per roles/verifier.md §7

My verdict is a WRITE, and prose is a code input here. **The forecast was
RE-DERIVED against the main that moved** rather than inherited from the
lane's ledger: the lane derived at `28f1910` against main `40c9b8b`; main
is now **`dcd1c3e`**. `git merge-tree --write-tree dcd1c3e <my tip>` —
exit read first, unpiped: **0** — and the merge's diff is still exactly
the same **2 paths**, `resolve/mod.rs` and this card. Main's one
intervening commit touches only `T-195`'s card, so **no gate decision
moves** and the lane's ledger stands at the new base.

**Gates my own commit could move**, run AFTER it landed — `docs/STATE.md`
is explicit that a gate read BEFORE a commit does not catch what the
commit creates. Every exit captured by redirect and `$?` before any pipe,
and every one read as OUTPUT rather than as a code:

| gate | exit | read |
|---|---|---|
| `docs-gate.mjs`, run from `tools/e2e/` with a plain relative path | **2** | **CALLED WRONG, and correctly so.** The gate refused: from there the path has two readings. **This run was not a claim about the tree**, and it is recorded rather than quietly re-run, because a gate that refuses a question it cannot read is the behaviour STATE's `CANNOT_RUN` hazard asks for. |
| `docs-gate.mjs`, re-run from the repository ROOT, separate literal paths | **1** | **A VERDICT, not a crash** — `docs-gate:` lines, 26 derived readers across 4 suites, 0 frontmatter issues, *"every live task card's frontmatter parses, with a legal status"*, governing budgets hold. FIRES on the card and names three suites. |
| `npm run lint:docs` | **0** | the CENSUS half; its own output says a 0 means *"I was not asked"*. |
| `npm run lint:tokens` | **0** | clean. |
| `npm run capabilities:check` | **0** | CURRENT — this lane touches no `tools/e2e/tests/` spec name, so the census could not move. |

The three suites the docs gate named, at **`95318fa`** (my tip), in
fresh-clone ORDER, after `npm ci` in `tools/e2e/`:

- `npx vitest run` from `lib/parser/` — **exit 0, 16 files / 344 tests**
- `npm test` from `app/` — **exit 0, 50 files / 1116 tests** (after
  `npm run build` exit 0)
- `npm test` from `tools/e2e/` — **exit 0, 409 passed (5.0m)**, on
  `NPUTER_E2E_PORT=22208` derived from this seat's id, `lsof` showing
  **0 rows** immediately before binding. 1420 was never probed, bound or
  named.

All three reproduce the lane's own figures exactly. **My commit adds no
path the merge's set did not already carry** — the forecast against
`dcd1c3e` is the same 2 paths with the verdict in it — so no gate
decision moves with this write either.

**FIXTURE CONTAINMENT, CHECKED FROM THE OUTPUT SIDE TOO** (`T-196`'s
standard, since the body proves it in-band and I wanted the other half):
occurrences of `Projects/nputer` in the LIFTED arm's captured output
after the suite marker = **0** over 347 lines — **and the search was
shown capable of failing first**, returning **1** against a poisoned copy
of the same corpus at 348 lines. The discriminating half never reached
repository content.

**Fence, expanded rather than taken:** `crate-index` resolves through
`docs/architecture/components/C-07-nputer-index.md` (`touch_slugs:
[crate-index]`, `paths: app/src-tauri/crates/nputer-index/**`) — the code
path is inside it, and the card is outside every fence by construction
(lane-protocol rule 5). **No breach.** My verdict rides a non-task branch,
`verify/T-208-verdict`, so it is the ALLOWED case of the fence's three
answers rather than an unmanifested task branch.

**What I did not run, and why:** `cargo test` at the workspace root and
`cargo audit` — my commit is prose in `docs/tasks/`, which no `KIT_FILES`
entry covers and no Rust body reads. The crate suite is reported above at
crate scope for the lane's own diff.
