---
id: T-194
title: The index crate's other two symlink guards carry bodies NAMED for a shadowed half, and lifting that half leaves the whole crate suite green — measured, and it corrects a sentence in T-140-s9's landed sweep
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5@subagent @T-186
builder:
built_by: claude-opus-5@subagent
review: independent
---

**FOUND BY `T-186`'S CLASS SWEEP, AND MEASURED RATHER THAN INFERRED.**
`T-186` corrected `walk_root`'s four shadowed checks. Its sweep for the
same class inside the same fence found two more shipped sites, and both
are the class rather than merely the shape.

## The two sites

Both fold the halves into ONE expression over `symlink_metadata`, so the
`is_symlink()` half is inert for the reason `T-140-s9` established: under
lstat a link is neither file nor dir, so the right-hand operand refuses it
anyway.

1. `arch/registry.rs::read_registry` —
   `if meta.file_type().is_symlink() || !meta.is_dir()`
2. `resolve/mod.rs::read_contained` —
   `if meta.file_type().is_symlink() || !meta.is_file()`

## What makes them the class rather than the shape

**Each has a body NAMED for the half that cannot be detected**:
`a_registry_directory_that_is_a_symlink_is_refused_not_followed`
(`tests/arch.rs`) and `symlinked_tsconfig_is_never_read`
(`resolve/tsconfig.rs`). That is the difference between "two halves that
happen to shadow" and "a suite reporting coverage it does not have".

**MEASURED at `e71198f`**, one arm each, one side only, in a detached
scratch worktree with its own `CARGO_TARGET_DIR`, each restored and proven
by sha256: lifting the `is_symlink()` half at either site leaves
`cargo test -p nputer-index` at **exit 0 with nothing red**.

## AND IT CORRECTS A LANDED SENTENCE

`T-140-s9`'s sweep classified both sites as *"same shape, no false
coverage"*, on the stated ground that *"no body is named for the half"*.
**That clause is false at this ref for both sites.** The shadowing half of
that classification was right; the coverage half was not. This card exists
because `T-140-s9`'s own verifier found the identical failure one function
away — a sweep that stopped short inside its own fence — and the remedy it
assigned was to name the sites, not to leave them.

## What a lane would do (proposed, not ruled)

The `T-186` shape, applied twice: name each half at its site for what it
independently contributes, and — before assuming the sibling's verdict —
**MEASURE whether the surviving half is separately pinnable here.**
`T-186` is the worked warning: its sibling one crate over proved a
`!meta.is_file()` half undetectable, and in the index walk the same half
turned out to have a fixture, because that walk filters on a NAME rather
than a resolved path. `read_registry`'s surviving half is `!meta.is_dir()`
and `read_contained`'s is `!meta.is_file()`; whether either has a fixture
is an open question this card must answer by running it.

**Delete nothing.** `T-140-s9`'s ruling stands: a provably
behaviour-neutral line on an ADR-010 boundary buys zero discrimination by
leaving and costs a visible containment statement. The evidence is what
changes.

## Acceptance criteria

- EACH of the two sites SHALL be named at its site for what each half
  independently contributes.
- WHERE a surviving half is separately detectable, a body SHALL pin it
  ALONE; where it is not, the card SHALL record that with the attempts
  shown.
- The two bodies named for a shadowed half SHALL say, at their site, what
  they actually pin.
- EVERY body added or changed SHALL be poisoned one side only, read back
  with `git -C <dir> diff`, restored, and the restoration proven by hash.
- NO layer SHALL be deleted merely for being shadowed.
- Verification: headless, `cargo test`.

## Read beside

`T-186` (the same finding, corrected, with the dedup trap and the
count-1 mutant recorded at their site) and `T-140-s9` (the ruling, and the
sweep sentence this card corrects).

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-194`, branch
`task/T-194-the-index-crates-other-two-symlink-guards`, base **`146ebb6`**
(not the brief's `f7366770` — see WHERE THE BRIEF WAS WRONG). Work commit
**`a9de0e2`**, +355/−0 over four files, all inside the fence
`app/src-tauri/crates/nputer-index`. Ceremony row: **S touching shipped
code**, so a verifier is owed — nothing merged, nothing pushed, the lane
worktree left standing.

### THE CARD SAYS TWO SITES AND THERE ARE THREE GUARDS, WHICH IS WHERE THE ANSWER WAS HIDING

The card's prose enumerates two expressions. The symbol `read_registry`
carries the shape **twice** — on the registry DIRECTORY (`registry.rs:119`
at base) and on EACH ENTRY (`registry.rs:133` at base) — and
`T-140-s9`'s sweep sentence, the one this card exists to correct, already
named all three: *"`registry.rs:119,133` and `resolve/mod.rs:49`"*.
CONVENTIONS' A CITATION NAMES A SYMBOL, NOT A LINE puts the second guard
inside the symbol the card names, so all three were taken in scope.

**This is not a technicality — the guard the card's prose omitted is the
only one of the three whose surviving half turned out pinnable.** A lane
reading the two quoted expressions and stopping would have reported "no
half is separately pinnable at either site" and been wrong.

### THE ANSWER: FIVE HALVES, THREE GUARDS, AND TWO GUARDS OF IDENTICAL TEXT ANSWER OPPOSITELY

`T-186` generalised the rule and this card is its cleanest instance:
**`registry.rs`'s entry guard and `resolve/mod.rs`'s guard are the same
twelve characters — `is_symlink() || !meta.is_file()` — and one half is
separately pinnable in one and provably unpinnable in the other.** The
difference is entirely downstream, exactly as `T-186` predicted it would
be. Nothing here was inherited from either sibling in either direction.

| guard | half | verdict | why | measured |
|---|---|---|---|---|
| D1 `read_registry`, the registry dir | `is_symlink()` | inert | its own sibling: lstat makes `!meta.is_dir()` refuse every link | 256/0, exit 0 |
| D1 | `!meta.is_dir()` | inert | **DOWNSTREAM**: `read_dir` fails on every non-dir and returns the same `DirMissing` | 256/0, exit 0 |
| D1 | the PAIR | load-bearing | with both lifted `read_dir` FOLLOWS a symlinked registry dir | 255/1 |
| D2 `read_registry`, each entry | `is_symlink()` | inert | its own sibling, same construction | 256/0, exit 0 |
| D2 | `!meta.is_file()` | **SEPARATELY PINNABLE** | the only later predicate is `path.extension()`, which reads the entry's own NAME — a directory called `C-99.md` clears it and `std::fs::read` turns it into a `Malformed` | **255/1, alone** |
| D2 | the PAIR | load-bearing | a symlink named `C-99.md` is read through; this reader has NO containment check at all | 254/2 |
| G3 `read_contained` | `is_symlink()` | inert | its own sibling, same construction | 256/0, exit 0 |
| G3 | `!meta.is_file()` | **NOT pinnable** | **DOWNSTREAM**: `read_to_string` fails on every non-file, non-symlink type that does not block, reproducing the guard's own `None` | 256/0, exit 0 |
| G3 | the PAIR | load-bearing, but only against an INSIDE link | an outside link is refused by `canon.starts_with(root)` first | 255/1 |

**D1's second half is a shape neither sibling had met.** `T-140-s9` and
`T-186` both found halves shadowed BY THEIR SIBLING. `!meta.is_dir()` is
shadowed by neither its sibling nor a test's shortcoming but by
`read_dir` on the next statement, which computes the same outcome from
the same tree. So D1 is a guard where **no single-side lift is
detectable and the pair is** — the count-2 shape, arrived at from a
direction the two prior cards did not have a name for.

### THE THIRD SIGHTING OF THE INSTRUMENT DEFECT, AND IT IS THE WORST OF THE THREE

`symlinked_tsconfig_is_never_read` (`resolve/tsconfig.rs`) aims its link
at a **second `TempTree`**, so the target canonicalizes out of the root and
the link is refused TWICE OVER — once by the classification, once by
`canon.starts_with(root)`. **Measured: with BOTH halves of that
classification lifted the body is still `ok`.** It cannot see the half it
is named for, and it cannot see the pair either. That is strictly worse
than `T-186`'s `walk_root` body, which at least reds on the two-side lift,
and it is the same defect `T-140-s9` met in `docs_watch.rs`.

**AND THE OBVIOUS EXPLANATION FOR IT IS WRONG — I WROTE IT DOWN, THEN
MEASURED IT, AND IT FAILED.** *"Containment alone produces that body's
green"* is the sentence this lane first landed in three places, carried
straight over from `T-186`'s finding about `walk_root`. **Lifting
containment alone leaves the body GREEN too** (arm `g3-contain`, 256/0,
exit 0), because the link classification still refuses the link. Both
mechanisms are individually sufficient, so neither "produces" the green
and the body can name neither. It reds only when BOTH are lifted (arm
`g3-allthree`, 254/2), which at least proves it is not vacuous.

**This is the card's own thesis turning on the lane that was writing it.**
The instruction was not to inherit a sibling's verdict; I obeyed that for
the three guards I was sent to measure and then quietly inherited one for
the body BESIDE them, on the strength of the fixture looking identical to
`T-186`'s. It took one arm to falsify and I had already committed the
sentence. Corrected at all three sites rather than softened.

`a_registry_directory_that_is_a_symlink_is_refused_not_followed`
(`tests/arch.rs`) is the milder case: it reds on D1's two-side lift, so it
pins the PAIR truthfully while its NAME claims the half.

**Both names are KEPT** — `T-140-s9`'s ruling 4: `T-186` and this card
cite them, `docs/architecture/graph.json` carries the first as a symbol
node, and a rename strands those references. Each now states at its own
site what it actually asserts.

### WHAT THE BODY THAT CANNOT RED BOUGHT, RECORDED RATHER THAN QUIETLY DROPPED

`a_directory_wearing_the_config_files_name_is_refused`
(`resolve/mod.rs`) was written to pin G3's `!meta.is_file()` half by the
fixture shape that works one file over. **It stays GREEN under the very
lift it was written to catch** (arm `g3-isfile`, 256/0, exit 0), and it
stays green under the full classification lift too. `docs/CONVENTIONS.md`
rules the case — *"a body that cannot red is the finding"* — so it is
landed with that stated at its site, in the words that say it is NOT a pin
on a half, so the next reader does not spend the attempt again.

Attempts made and why each fails, all at the site:

1. **A directory named `tsconfig.json`/`package.json`** — `read_to_string`
   errors on a directory and `.ok()?` turns that into the same `None` the
   guard produces. RUN, not reasoned: `g3-isfile` is that measurement.
2. **A fifo** — would distinguish the halves in principle (`read_to_string`
   blocks rather than erroring) and is refused as a body on two counts: it
   HANGS rather than failing, and `std::fs` cannot create one, so it needs
   an out-of-process `mkfifo`. A body that blocks forever is not a body.
3. **Any other non-file, non-symlink type** (socket, device) fails
   `read_to_string` identically. There is no fourth kind.

By poison shape SIX's own definition this body kills no mutant of the
guard that another body does not, and that is stated plainly rather than
left for a reader to discover.

### THE RULING: NOTHING DELETED, AND THE SHIPPED BEHAVIOUR IS PROVABLY UNMOVED

`T-140-s9`'s ADR-010 reasoning was not re-litigated and holds unchanged.
`git diff --numstat 146ebb6 a9de0e2` is **+355 / −0** — the deletion count
is mechanically zero across all four files.

**Every one of the 355 added lines is either a comment or inside
`#[cfg(test)] mod tests`, checked mechanically rather than asserted.**
Each file's shipped half (everything before `#[cfg(test)]`, comments and
blanks stripped) is IDENTICAL between base and tip: `registry.rs`
**227 = 227**, `resolve/mod.rs` **398 = 398**, `tsconfig.rs` **82 = 82**
non-comment lines, non-zero on both sides before any verdict was read.

**AND MY OWN POSITIVE CONTROL WAS VACUOUS — TWICE, IN OPPOSITE
DIRECTIONS — AND ITS OWN FAILURE LINE IS WHAT SAID SO BOTH TIMES.** The
control plants a one-token change and requires the comparison to detect
it.

1. It first used `symlink_metadata`, which occurs twice in `registry.rs`'s
   shipped half and once in `resolve/mod.rs`'s, and **zero times in
   `tsconfig.rs`'s** — so for that file it planted nothing and the check
   printed `CONTROL FAILED`.
2. Switching the whole script to `read_contained` fixed `tsconfig.rs` and
   **broke `registry.rs`**, which contains no such call. Same failure, other
   end of the same list, one edit apart.

This is poison shape TEN wearing the drill's costume for the third card
running (`T-186` hit it twice, its verifier once). The landed form takes
the control token **PER FILE and asserts its occurrence count before
running the control** — `symlink_metadata` ×2 in `registry.rs`,
`read_contained` ×2 in the other two — and refuses rather than reporting
when the count is zero. **The lesson that generalises, and the reason the
second sighting is worth more than the first: a positive control is itself
a check, so it needs its own non-empty precondition. Assert the planted
token OCCURS before trusting that the check can say no** — otherwise
"fixing" a vacuous control just moves which file it is vacuous for, which
is exactly what happened here.

### THE DRILL — 17 ARMS, EVERY ONE READ BACK, RESTORED AND PROVEN

Detached scratch worktree `/private/tmp/nd-T-194`, cut at **`a9de0e2`**
(the work COMMITTED FIRST, so a restore cannot pass itself off as a
revert), `CARGO_TARGET_DIR=/private/tmp/nd-T-194/target` — the one name
`.gitignore` excludes — never shared with the lane. Stem `nd-T-194`
DERIVED from the card id and spent on the worktree, the target dir, the
driver and every log. Scratch baseline reproduces the lane exactly:
**exit 0, 256 passed / 0 failed over 12 targets**.

Each arm: mutate ONE side only with `perl -0777`, at an absolute path;
**refuse unless the substitution count is exactly 1**; **read the mutation
back with `git -C /private/tmp/nd-T-194 diff`** and refuse on an empty
read-back; run `cargo test -p nputer-index --no-fail-fast` UNPIPED into its
own log and capture `$?` before anything else; restore with
`git restore --source=a9de0e2 --staged --worktree`; prove by `shasum -a 256`.

**THE DRIVER WAS SHOWN CAPABLE OF REFUSING BEFORE ANY RESULT WAS WRITTEN
DOWN.** Arm `control-nomatch` uses a pattern matching nothing: count 0,
**REFUSED, no suite run**. Without it a mis-aimed arm would report a clean
256/0 over an unmutated tree — a green built out of a failure.

**Every count below is a TARGET count beside a pass/fail count**, and
`--no-fail-fast` is on every arm. `T-186` nearly corrected its verifier's
right answer into a wrong one by omitting it, and the tell was arithmetic:
crate scope is 12 targets, the lib target alone is 1.

| arm | mutation (one side) | exit | targets | pass/fail | red bodies |
|---|---|---|---|---|---|
| `control-nomatch` | pattern matches nothing | — | — | **REFUSED at count 0** | no suite run |
| `d1-symlink` | `…is_symlink() \|\| !meta.is_dir()` → `false \|\| !meta.is_dir()` | 0 | 12 | 256/0 | **none** |
| `d1-isdir` | → `…is_symlink() \|\| false` | 0 | 12 | 256/0 | **none** |
| `d1-both` | → `false` | 101 | 12 | 255/1 | `a_registry_directory_that_is_a_symlink_is_refused_not_followed` |
| `d2-symlink` | `…is_symlink() \|\| !meta.is_file()` → `false \|\| !meta.is_file()` | 0 | 12 | 256/0 | **none** |
| `d2-isfile` | → `…is_symlink() \|\| false` | 101 | 12 | 255/1 | `a_directory_wearing_a_component_files_name_is_skipped` **alone** |
| `d2-both` | → `false` | 101 | 12 | 254/2 | the directory body + the symlink body |
| `d2-dironly` | → `meta.is_dir()` | 101 | 12 | 255/1 | `a_symlinked_component_file_is_skipped_and_never_read_through` **alone** |
| `g3-symlink` | `…is_symlink() \|\| !meta.is_file()` → `false \|\| !meta.is_file()` | 0 | 12 | 256/0 | **none** |
| `g3-isfile` | → `…is_symlink() \|\| false` | 0 | 12 | 256/0 | **none — THE FINDING** |
| `g3-both` | → `false` | 101 | 12 | 255/1 | `an_inside_pointing_symlink_is_refused_by_the_link_classification` **alone**; `symlinked_tsconfig_is_never_read` **GREEN** |
| `p-regdir` | assertion `vec!["C-01"]` → `vec!["C-02"]` | 101 | 12 | 255/1 | itself, alone |
| `p-reglink` | assertion `vec!["C-01"]` → `vec!["C-02"]` | 101 | 12 | 255/1 | itself, alone |
| `p-inside` | assertion `None` → `Some(String::new())` | 101 | 12 | 255/1 | itself, alone |
| `p-condir` | assertion `None` → `Some(String::new())` | 101 | 12 | 255/1 | itself, alone |
| `g3-contain` | `!canon.starts_with(root)` → `false` | 0 | 12 | 256/0 | **none — falsified my own sentence** |
| `g3-allthree` | classification AND containment → `false` | 101 | 12 | 254/2 | the inside body + `symlinked_tsconfig_is_never_read` |

The last two arms were added AFTER the first fifteen, when re-reading my
own criteria showed I had asserted a shadow relationship
(*"containment alone produces its green"*) without measuring it. `g3-contain`
falsified it; `g3-allthree` establishes the body is not vacuous. **Seventeen
arms in total, counting the driver control.**

**Every arm restored and PROVEN by sha256** against its `a9de0e2` blob —
`registry.rs`
`23478bd96a4fee2e43cfc6a9e5af5eb86566674403e9865a98047b4df21e2c69`,
`resolve/mod.rs`
`97e62213bb249ae29d567253711cba5bc20bfd93f4c5b092de15e404a9f7f8d2` — after
every single one, and the scratch's `git status --short` is empty at the
end.

**POISON SHAPE SIX, ASKED FOR ALL FOUR NEW BODIES.** Three answer at
count 1 — `d2-isfile` for the directory body, `d2-dironly` for the
registry symlink body (a CONSTRUCTED arm, exactly `T-186`'s device: a
directory-only skip under which directories are still refused and links
pass, which is what earns the body out of shape SIX rather than an
argument), and `g3-both` for the inside-link body. **The fourth,
`a_directory_wearing_the_config_files_name_is_refused`, has no such
mutant, and that is recorded above as the finding rather than hidden.**
All four also die alone under an expected-value poison, so no body is
vacuous by its own value.

**THE LIFTED ARMS TERMINATE IN FIXTURES, CHECKED RATHER THAN ASSUMED**
(CONVENTIONS, LIFTING A SAFETY GUARD TO DISCRIMINATE). Both new registry
bodies and the new `read_contained` body aim at `TempTree`s under the
system temp dir. **The one exception is pre-existing and is now stated at
its site**: `a_registry_directory_that_is_a_symlink_is_refused_not_followed`
links at this repository's OWN `docs/architecture/components`, so under
`d1-both` the reader reads the live registry. It is a read-only read, no
body writes through it, and the note at the body says so rather than
leaving it to be discovered.

### THE CLASS AND THE SWEEP — AND THIS ONE COMES BACK CLOSED

**The class**: a refusal whose removal is shadowed by a later check
computing the same outcome, with a test NAMED for the shadowed half — so
the suite reports coverage it does not have.

Swept with `git grep` over the fence, **shown capable of both hitting and
missing before its result was written down**: the pattern against a
planted `|| !meta.is_socket()` line matched 1, and a one-token variant
(`|| !metaZZZ.is_`) matched 0 with grep exit 1.

`git grep -n '|| !meta\.is_' -- app/src-tauri/crates/nputer-index` returns
**7 hits, of which 4 are shipped code**:

- `registry.rs:160` (D1) — **this card**
- `registry.rs:193` (D2) — **this card**
- `resolve/mod.rs:95` (G3) — **this card**
- `walk.rs:143` — **`T-186`, already corrected**

The other three are prose: the naming `T-186` and this card added. And
`tests/perf.rs:31` is still a fixture copier rather than shipped
behaviour, exactly as `T-140-s9` classified it.

**So the class is CLOSED inside `crate-index`: all four shipped sites are
now named at their site and measured.** Nothing is routed out of this
sweep.

### THE SENTENCE THIS CARD CORRECTS, AND WHAT SURVIVES OF IT

`T-140-s9`'s sweep classified `registry.rs:119,133` and
`resolve/mod.rs:49` as *"the halves shadow each other but no separate
layer claims depth and no body is named for the half — same shape, no
false coverage."* At this ref:

- *"the halves shadow each other"* — **TRUE at G3 and at D2, and FALSE at
  D1**, where `!meta.is_dir()` is shadowed by `read_dir` rather than by
  its sibling. A third relationship the sentence has no room for.
- *"no body is named for the half"* — **FALSE for all three**; two bodies
  are, and `T-186` measured that before this card was filed.
- *"no false coverage"* — **FALSE**, and worse than `T-186` reported:
  `symlinked_tsconfig_is_never_read` cannot see the pair either.
- *"same shape"* — **TRUE of the text and FALSE of the behaviour**, which
  is the whole lesson: D2's `!meta.is_file()` is pinnable and G3's
  identical `!meta.is_file()` is not.

### WHERE THE BRIEF WAS WRONG

1. **ROW 4's `base commit:` names `f7366770`; this lane is cut at
   `146ebb6`.** The dispatch named this up front and filed it as `T-187`;
   the repository wins. `146ebb6` measured green before anything was
   touched (601/0 over 18 targets), so the base is trusted for its gates
   rather than for being a checkpoint, which is what the dispatch bullet
   actually requires. Every other row was checked against the tree.
2. **The card under-enumerates its own subject** — two expressions named,
   three guards present, and the omitted one carries the only separately
   pinnable half. Recorded above rather than silently widened.
3. **`review:` was EMPTY on a guard-class card, which is the exact defect
   `T-186`'s verifier assigned as correction 5** — *"`review: independent`
   was owed at dispatch and the field was empty… flagged so the next
   dispatch sets it."* This IS the next dispatch, and it did not. Stamped
   `independent` here; the repair belongs at the dispatching seat, since a
   lane stamping its own review field is the weakest possible form of it.
4. **The fence-hook correction in my dispatch is right and matches
   `docs/STATE.md`** (`T-199`): nothing judged my writes. Every path I
   touched is inside `app/src-tauri/crates/nputer-index` except this card,
   by discipline alone.

### GATES — every exit read UNPIPED, every trigger DERIVED from the diff

**THE WHOLE SET WAS RUN TWICE AND THE FIGURES BELOW ARE THE SECOND RUN'S,
at the code tip `c51c83d`.** The first pass gated `7ae3357`; the two extra
arms that falsified my own sentence then moved comments in `resolve/mod.rs`
and `tsconfig.rs`, so every trigger fired again rather than only the docs
half. **Every figure came back identical** — the same 605/0, the same
`files +0 -0 ~4`, the same 344 / 1100 / 366+1, the same boot lines — which
is what a comments-only delta should look like and is stated because it was
checked, not assumed.

The gate set is derived against **the tree this tip will have**, the merge
forecast the RANGE RULE prescribes for the executor's position:
`TREE=$(git merge-tree --write-tree main HEAD)` then
`git diff --name-only main "$TREE"`, at main **`dd6b723`** — **exit 0, no
conflict, 5 paths**: the four crate files and this card. Re-derived at the
frozen tip `7ae3357` and again at `c51c83d`; unchanged both times — 5
paths, `merge-tree` exit 0, no conflict. (Main advanced from `146ebb6` to
`dd6b723` while this lane worked — one docs-only commit that touches no
path in this fence.)

- **`cargo test` from `app/src-tauri/`** at `c51c83d`: **exit 0, 605
  passed / 0 failed over 18 targets**, `--no-fail-fast`. (Same at
  `7ae3357`.)
- **THE BASE WAS MEASURED, so the delta is not arithmetic**: the same
  command at `146ebb6` before anything was touched is **exit 0, 601
  passed / 0 failed over 18 targets**. 601 + 4 = 605 and the four are the
  new bodies, named above. At crate scope
  `cargo test -p nputer-index --no-fail-fast` goes **252/0 → 256/0 over
  12 targets**, and the `nputer-index` lib target **200 → 204**. **The
  parts add up to the whole in both directions**, which is the arithmetic
  tell `T-186` was saved by.
- **The cargo cache cliff did not fire** (`T-088-s4`): the lib suite's own
  time is **4.13s at base, 4.60s at `7ae3357` and 5.33s at `c51c83d`**,
  against the green band of
  under 9.5s, with sibling lanes live. The first build in this worktree was
  COLD, as the dispatch said it would be; that is the build, not the suite.
  No body was re-run, so there is nothing to attribute.
- **GRAPH REGEN FIRES** (four `*.rs` paths outside `docs/`), so it was
  **ASKED and NOT acted on** — `graph.json` is outside this fence.
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/`: **exit 1, STALE**, and the staleness is exactly this
  lane's four files — `files +0 -0 ~4`. It is a REAL red, not the `--root`
  false red: it prints both counts and `~` file lines rather than
  `committed: MISSING`. **`files +0 -0` is the sentence that matters** —
  no phantom file entered the walk, because the drill's target dir lives
  at `<scratch>/target` outside the tree and this lane's own logs were
  moved out of the worktree the moment they were created. One edge is
  genuinely added: `resolve/mod.rs -> testutil.rs (import) symbols=[TempTree]`,
  which is the new `#[cfg(test)] mod tests` reaching for `TempTree`;
  symbols 2448 → 2449, edges 2365 → 2366, 199 files unchanged. Budget
  1149371 of 2145959 bytes (53.6%), 996588 left. **The integrator
  regenerates and commits it at the checkpoint; this lane did not.**
- **BOOT GATE FIRES** (`app/src-tauri/**`): `NPUTER_BOOT_PORT=21940
  npm run boot:check` from `tools/e2e/` — **exit 0** (0 booted · 1 boot
  failed · 2 port busy · 3 override refused). The port is DERIVED from the
  card id, 20000 + 194×10, never defaulted, and `lsof` gave **zero rows
  immediately before binding**. Both startup lines arrived, naming this
  lane's own folder: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-194` and `[nputer] window "main" created`.
  **1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
  else, before and after every run: zero rows every time.**
- **DOCS GATE FIRES** — this card's own frontmatter and notes are a path
  under `docs/` that code suites READ. Derived by ASKING rather than
  predicting, with the forecast's five paths passed as SEPARATE LITERAL
  ABSOLUTE arguments (`docs/STATE.md`'s zsh-splitting hazard, and a
  relative path makes this gate refuse with exit 2 rather than answer):
  **exit 1, FIRES, 1 path(s) under `docs/` are code inputs**, naming three
  commands. It also reports **every live task card's frontmatter parses,
  with a legal status** — which covers this card's own `verifying` /
  `built_by` / `review` stamps — and that governing-document budgets hold.
  - `npx vitest run` from `lib/parser/` — **exit 0, 16 files / 344 tests**
  - `npm test` from `app/` — **exit 0, 49 files / 1100 tests** (`T-186`
    measured 1077 six commits ago; derived at this ref, not carried)
  - `npm test` from `tools/e2e/` — **exit 1, 366 passed / 1 failed**,
    attributed below and NOT this lane's
  - `npm run lint:tokens` — **exit 0, clean** (TOKEN 162 files under
    app/src, app/test, tools/e2e; CONTROL 1049 tracked text files)
  - `npm run lint:docs` — **exit 0**, and the run says of itself that this
    is the CENSUS half only, so its 0 means *"I was not asked"*. The
    owed-suite verdict is the `docs-gate.mjs` call above, which WAS asked.
  - `npm run capabilities:check` — **exit 0, CURRENT (29121 bytes)**; this
    lane added no e2e spec, so no spec name moved and
    `docs/CAPABILITIES.md` needed no regeneration
- **METHOD EVAL GATE: not owed** — zero paths under `method/` in the
  forecast's 5.
- **AUDIT GATE** names a gate and declares no merge-diff trigger, so it is
  not one of these. No manifest moved in this diff (`Cargo.toml`,
  `Cargo.lock`, `package.json` all untouched), so no dependency entered.

### THE ONE E2E RED, ATTRIBUTED TO A FILED CARD AND ROUTED — IT IS NOT THIS LANE'S

`tests/dispatch-order.spec.ts:200 › --dispatch runs on the live
repository, exits 0, and WRITES NOTHING` fails on
`expect(received).toContain("BLOCKED — the unmet blocker is named")`.

**Measured, not argued:**

- `node tools/e2e/scripts/brief.mjs --dispatch` **redirected to a file** is
  **77,634 bytes**, and `# BLOCKED — the unmet blocker is named, and
  nobody is on it.` is present at **line 206**.
- The same command **piped** is **65,536 bytes — exactly 64 KiB**. The
  section is past the cut. Loss: **12,098 bytes**.
- The section is REAL CONTENT rather than an empty-board artifact: **four
  cards carry an unmet blocker** at this ref — `T-067` and `T-068` on
  `T-065`, `T-126-s2` on `T-198`, `T-203` on `T-202` — derived over 396
  parsed cards (a zero there would have been the shape-TEN case and is
  printed for that reason).

**This is `T-197`**, already filed, `status: planned`, `touches:
[tools/e2e]` — **outside this fence**, so it is ROUTED and not fixed, and
`docs/STATE.md` names it in advance: *"`brief.mjs` TRUNCATES piped stdout
at 64 KiB (`T-197`) — redirect to a file; **it reds a standing e2e body no
lane caused**."* `T-192`'s executor met the identical red and proved it
was not its own; **this is the second sighting, and it carries a
re-measurement `T-197` will want**: that card's title states **3,757
bytes** lost to `| head`, and at this ref the loss is **12,098 bytes**.
The defect grows with the board.

**And this lane's diff cannot reach it, by construction rather than by
assertion**: nothing in `docs/tasks/` declares `blocked_by` containing
`T-194` (grep exit 1, zero hits), and this lane's ONLY change under
`docs/` is this card itself. Removing this lane's work cannot put a
BLOCKED entry back.

**RUN TWICE, AND ONLY THE SECOND IS QUOTED ABOVE — BUT BOTH AGREE.** The
first full e2e run was in flight when this lane corrected a false sentence
in `registry.rs`'s own comment, so the tree moved under it. A gate run
against a tree that moved under it is not a claim about the tree
(`T-186`), so the tree was committed to `7ae3357` and the suite re-run
against that frozen tip: **366 passed / 1 failed both times, the same
single body, the same reason.** The changed path is a Rust comment that no
e2e body reads, which is why the two agree — stated rather than assumed.
The failing spec file alone was also re-run at the frozen tip: **13 passed
/ 1 failed**, same body.

### WHAT THIS LANE LEFT ON DISK

The lane worktree `/Users/ujju/Projects/nputer-T-194` stays standing until
the verdict (`lane-protocol.md` rule 6: an S card that took a verifier
keeps the only reproducible copy of what was measured). The drill scratch
`/private/tmp/nd-T-194` is left standing too, **detached at `a9de0e2` and
clean**, so the verifier can re-run any arm — a detached entry is not a
lane and does not appear in the lane list. Its `CARGO_TARGET_DIR` is
**686M** and is the integrator's to reclaim after the checkpoint. Nothing
was merged, nothing pushed, and `main` was never touched.
