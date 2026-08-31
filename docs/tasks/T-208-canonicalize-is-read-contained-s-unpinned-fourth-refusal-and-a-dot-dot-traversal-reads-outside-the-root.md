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
