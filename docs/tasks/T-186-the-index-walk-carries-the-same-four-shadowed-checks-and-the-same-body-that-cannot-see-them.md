---
id: T-186
title: The index walk carries the identical four shadowed checks one crate over, calls them "belt-and-suspenders" in the same false words, and its one symlink body points OUTSIDE so containment alone produces the green
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: "architect/integrator seat, ROUTED BY T-140-s9's merge (2026-08-31) and re-measured at this seat before filing rather than transcribed from the route"
builder:
built_by: claude-opus-5@subagent
review:
---

**ROUTED OUT OF `T-140-s9`, AND RE-MEASURED BEFORE FILING.** That lane
corrected `app/src-tauri/src/docs_watch.rs` and routed its sibling
sight-unseen. This seat opened `walk.rs` and confirmed every element
rather than carrying the claim across; what follows is read off the file,
not off the route.

## The same four checks, in the same order, with the same shadowing

`walk_root` in `app/src-tauri/crates/nputer-index/src/walk.rs`:

    let Ok(meta) = std::fs::symlink_metadata(path) else { continue };
    if meta.file_type().is_symlink() || !meta.is_file() { continue; }
    …
    let Ok(canon) = path.canonicalize() else { continue };
    if !canon.starts_with(canon_root) { continue; }

and `relative_posix`'s `strip_prefix(base).ok()?` twelve lines above.

**`!meta.is_file()` already absorbs a lifted `is_symlink`**, for the
reason `T-140-s9` established one crate over: `meta` comes from
`symlink_metadata`, under which a link is neither file nor dir. So the
`is_symlink` half of that disjunction is **inert** — exactly the
one-predicate-written-twice shape, arriving a second time.

`starts_with` and `relative_posix`'s `strip_prefix` are likewise **one
predicate mutually shadowing**, not two independent layers.

## AND THE COMMENT MAKES THE SAME FALSE CLAIM, IN THE SAME WORDS

    // Belt-and-suspenders beyond follow_links(false): our own
    // symlink_metadata check — a symlink (file or dir) is skipped
    // outright.

`T-140-s9` ruled that this exact claim — one line described as *"belt to
the symlink-skip's suspenders"* — **was itself the defect**, because it
tells the next reader that two independent layers exist where one
predicate is doing all the work. The claim is wrong here for the same
reason and should be corrected the same way: **name each layer at its
site for what it actually is.**

## The body that cannot see any of it, measured

`symlinks_are_never_followed_file_or_dir` (`walk.rs:213`) builds its
links pointing at a **second, outside** `TempTree`:

    let outside = TempTree::new("walk-symlink-outside");
    symlink(outside.root().join("secret.ts"), t.root().join("link.ts"))
    symlink(outside.root(), t.root().join("linkdir"))

Every entry it creates canonicalizes **out of the root**, so
`canon.starts_with(canon_root)` drops all of them on its own. **The
containment check alone produces this body's green**, and the
`is_symlink` half it is named for is never exercised.

This is the identical instrument defect `T-140-s9` met: a symlink body
whose link points outside is a containment test wearing a symlink test's
name.

## WHAT THIS CARD MUST NOT ASSUME, and it is the whole risk

`T-140-s9` spent two attempts proving its docs-root guard was
**undetectable by construction** — an outside link is rescued by
containment, an inside link is dropped by the collector's own path
prefix. **Do not assume the same verdict here.** This crate is different
in one way that may matter: `walk_root` filters on **extension and
language** after the symlink check, so an inside-pointing link to an
allowlisted file may reach a different set of predicates than
`docs_watch`'s did.

**Measure it; do not reason from the sibling.** If a body CAN be written
that reds on a lifted `is_symlink` and passes with it, write it. If it
cannot, `docs/CONVENTIONS.md` rules the case directly — *"IF a body
cannot be poisoned … THEN say so and name it, because a body that cannot
red is the finding"* — and the outcome is a named body carrying its
failed attempts at its site, exactly as `T-140-s9` landed.

## Acceptance criteria

- EACH of the four checks SHALL be named at its site for what it
  independently contributes, and any that contributes nothing unique
  SHALL say so rather than being described as a further layer.
- THE "belt-and-suspenders" comment SHALL be corrected or removed; it
  asserts an independence that does not exist.
- A body SHALL exercise the symlink refusal with a link that
  containment CANNOT rescue, or the card SHALL record — with the
  attempts shown — that no such body exists and why.
- EVERY body added or changed SHALL be poisoned by a one-side-only
  mutant read back with `git -C <dir> diff`, restored, and the
  restoration proven by hash.
- NO layer SHALL be deleted merely for being shadowed: `T-140-s9` ruled
  that deleting a shadowed line on an ADR-010 boundary buys zero
  discrimination and costs a visible containment statement. **The
  evidence is what changes, not the refusal.**
- Verification: headless, `cargo test`.

## Read beside

`T-140-s9` (the same finding, corrected, with both failed poison
attempts recorded at their site — read it FIRST, it will save this lane a
day), and `app/src-tauri/src/docs_watch.rs` as it stands after that merge.

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-186`, branch
`task/T-186-the-index-walk-carries-the-same-shadowed-checks`, base
`c3fc1a1`. One file of shipped code, `walk.rs`, the whole fence. Ceremony
row: **S touching shipped code**, so a verifier is owed — nothing merged,
nothing pushed, the lane worktree left standing.

### THE ANSWER TO THE CARD'S OPEN QUESTION IS *NO*, AND THAT IS THE FINDING

The card forbade assuming `T-140-s9`'s "undetectable by construction"
verdict and named the reason: this walk filters on extension and language
between the link check and containment. **Measured, that difference is
real and it goes the card's way.** One crate over, BOTH halves of the link
classification are undetectable and the honest landing was a body that
cannot red. Here:

- `is_symlink()` alone is still undetectable, and provably so — `meta`
  comes from `symlink_metadata`, under which a link is never `is_file()`,
  so the right-hand operand always fires. No fixture can separate them.
- **`!meta.is_file()` IS separately detectable here**, which its sibling
  was not. Layer 2 filters on the entry's own NAME rather than on a
  resolved path, so a DIRECTORY called `<name>.ts` clears every later
  predicate — allowlisted extension, requested language, canonicalizes to
  itself, formats to a relative path — and would be emitted to the parser
  as a source file. That is a body, and it reds on that lift alone.

**Had this lane reasoned from the sibling in either direction it would
have been wrong.** "It was impossible there" would have cost the walk a
body it turns out to support.

### THE RULING: every layer stays, and the EVIDENCE is what changed

No line was deleted. `T-140-s9`'s reasoning holds unchanged and was not
re-litigated: a provably behaviour-neutral line buys exactly zero
discrimination by leaving, while costing a visible containment statement
on an ADR-010 boundary. So each of the four layers is now NAMED at its
site for what it independently contributes, the `starts_with` is named as
restatement rather than left to read as depth, `relative_posix`'s doc
comment says it is a containment predicate rather than a formatter, and
the *"belt-and-suspenders beyond `follow_links(false)`"* claim — the same
false claim of independence, in the same words, that `T-140-s9` ruled was
itself the defect — is gone.

**The shipped walk is semantically identical to base.** Every line added
outside `#[cfg(test)] mod tests` is a comment; the refusal did not move.

### THE FAILED ATTEMPT, RECORDED AT ITS SITE AS THE CARD REQUIRES

The obvious inside-pointing fixture — aim the link at an allowlisted
inside file, `alias.ts` -> `real.ts` — **cannot detect the lift, and this
lane ran it rather than reasoning about it.** A lifted layer 1 pushes
`real.ts` a second time and `files.dedup_by(|a, b| a.rel == b.rel)` at the
end of the walk collapses the duplicate: byte-identical output, mutant
survives, body useless. Under that fixture the inside body stays GREEN
while its sibling body reds. The landed fixture therefore aims at a file
the walk does NOT otherwise collect (`notes.md`), which is also the truer
statement: with layer 1 lifted the walk emits `notes.md` tagged
`Lang::Ts`, because layer 2 read the LINK's name and layer 3 read the
TARGET's path. **This is the trap this crate adds and `docs_watch` has
no equivalent of**; it is recorded in the body so the next reader does not
repeat it.

### POISON SHAPE SIX — ASKED FOR ALL THREE NEW BODIES, AND ALL THREE PASS

The catalogue's form, not the assertion poison: name a mutant of the code
under test the body kills, run the whole suite, require the failing count
to be ONE.

- the directory body — the `!meta.is_file()` lift. **Count 1.**
- the predicate body — the `relative_posix` `.ok()?` lift. **Count 1.**
- the inside-symlink body — no single-half lift reaches it, so this lane
  constructed one instead: replace the whole classification with a
  directory-only skip (`if meta.is_dir()`), under which symlinks pass and
  directories are still refused. **Count 1.** Without that arm the body's
  smallest killer is the both-halves lift, which the directory body also
  kills — i.e. it would have been shape SIX by the catalogue's definition,
  and the arm is what earns it out of that rather than an argument.

**No fourth body was written for the `starts_with`/`strip_prefix`
equivalence, deliberately.** `docs_watch`'s
`the_prefix_check_and_relative_posix_are_one_predicate` already pins that
std-library property, and bare `cargo test` runs both workspace crates —
so the equivalence IS pinned on the merge path. A second copy in this
crate would kill no mutant the first does not, which is the shape the
catalogue tells us to decline rather than add. The site comment cites the
existing body by name instead.

### THE CLASS AND THE SWEEP — AND THE SWEEP DOES NOT COME BACK CLEAN

**The class**: a refusal whose removal is shadowed by a later check
computing the same outcome, with a test NAMED for the shadowed half — so
the suite reports coverage it does not have.

The search was **shown capable of both hitting and missing before its
result was written down**: the containment pattern against a planted line
matched (exit 0), and a one-token variant matched nothing (exit 1).

Inside this fence, `is_symlink()` appears in shipped code at three sites
beyond `walk_root`. `tests/perf.rs` is a fixture copier, not shipped
behaviour. The other two are **the class, and they are not fixed here**:

- `arch/registry.rs::read_registry` — `is_symlink() || !meta.is_dir()`,
  and `a_registry_directory_that_is_a_symlink_is_refused_not_followed`
  is named for the half. **MEASURED: lifting that half leaves the whole
  crate suite green, exit 0.**
- `resolve/mod.rs::read_contained` — `is_symlink() || !meta.is_file()`,
  with `symlinked_tsconfig_is_never_read` named for the half.
  **MEASURED: lifting that half leaves the whole crate suite green,
  exit 0.**

**THIS CORRECTS A SENTENCE IN `T-140-s9`'S LANDED SWEEP.** That record
classified both sites as *"same shape, no false coverage"* on the ground
that *"no body is named for the half"*. At this ref that clause is false
for both, and the two arms above are the evidence. The shadowing halves of
its classification were right; the coverage half was not.

Both are inside this fence but outside this card's acceptance criteria,
which are scoped to `walk_root`'s four checks. **Routed rather than
widened** — see below. This is `T-140-s9`'s verifier's own correction
arriving one crate over, and it is recorded rather than quietly absorbed.

### THE DRILL, AND THE PROOF THAT EVERY ARM WAS PUT BACK

Drilled in a detached scratch worktree at `/private/tmp/nd-T-186`, cut at
`e71198f` — the work COMMITTED FIRST, so a restore cannot pass itself off
as a revert — carrying its own `CARGO_TARGET_DIR` at `<scratch>/target`,
under the one name `.gitignore` excludes, never shared with the lane.

Each arm: mutate ONE side only with `perl` at an absolute path; **read the
mutation back with `git -C <scratch> diff`**, never a bare `git diff`,
with the arm refusing on a substitution count that is not exactly 1 or on
an empty read-back; run the suite UNPIPED into its own log and capture
`$?` before anything else; restore with
`git restore --source=e71198f --staged --worktree`; prove by `shasum
-a 256`.

**Every arm restored and proven: the working file hashes to
`0a2ead5a9a4663bcf4b688c65c862e824bccdf991767c1cd2bb5c3f62af16a3b`, the
`e71198f` blob, after every single one, and the scratch's
`git status --short` is empty at the end.**

The arms are the ledger in `walk.rs`'s own test module — seven lifts of
the code under test, four assertion poisons (one per body, each dying
ALONE, so no body is vacuous by its own value), one recorded ATTEMPT that
deliberately does not red, and two sweep arms outside this card's
criteria. **The lifted arm TERMINATED IN A FIXTURE, verified rather than
assumed** (CONVENTIONS, LIFTING A SAFETY GUARD TO DISCRIMINATE): the only
path leaked by the all-four arm is a `TempTree` under the system temp dir,
and the repository's own path occurs in that output **zero** times.

**`e71198f` and the shipped tip differ on `walk.rs` by the ledger comment
block and nothing else**, checked mechanically — every changed line
between them is a comment — so the ledger measured at `e71198f` describes
the code that ships.

### GATES — every exit read UNPIPED, every gate DERIVED from the diff

The gate set is derived against **the tree this tip will have**, the
merge forecast the RANGE RULE prescribes for the executor's position:
`git merge-tree --write-tree <main> HEAD` at main `8443a78`, exit 0, no
conflict — **3 paths**, `walk.rs` plus this card and `T-194`. The last
commit of this lane is the one carrying this section, and it adds no path
outside `docs/tasks/`, so it moves no trigger and this derivation still
describes the tip.

- **`cargo test`** from `app/src-tauri/` at `df52adb`: **exit 0**, 18
  suite result lines, **0 FAILED**. Lib **260 passed / 0 failed** in
  4.91s; `nputer-index` lib **200 passed / 0 failed**; `agent_runner`
  88/0/1 ignored.
- **The base was MEASURED, so the delta is not arithmetic**: the same
  suite at `c3fc1a1` before anything was touched is **exit 0**, lib 260/0
  in 4.10s, `nputer-index` lib **197/0**. 197 + 3 = 200, and the three are
  named above.
- **The cargo cache cliff did not fire** (`T-088-s4`): the lib suite's own
  time is 4.10s at base and 4.91s at the tip, against the green band of
  under 9.5s, measured with sibling lanes live.
  `startup_arm_watches_the_initial_root` passed in every green run, and
  `a_hostile_session_id…` (`T-086-s1`) likewise. Neither was re-run, so
  there is nothing to attribute.
- **GRAPH REGEN FIRES** (`walk.rs` is `*.rs` outside `docs/`), so it was
  **ASKED and NOT acted on** — `graph.json` is outside this fence.
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/`: **exit 1, STALE**, and the staleness is exactly this
  lane's one file — `files +0 -0 ~1`,
  `~ app/src-tauri/crates/nputer-index/src/walk.rs (content, loc 224 -> 454)`.
  **Nothing the graph emits moved**: 199 files, 2436 symbols, 2351 edges
  and 1143153 bytes are identical on the committed and fresh sides, which
  is what a comments-and-tests diff should look like. Budget 1143153 of
  2145959 (53.3%), 1002806 left. It is a REAL red, not the `--root`
  false red: the second line prints both counts and a `~` file diff rather
  than `committed: MISSING`. **The integrator regenerates and commits it
  at the checkpoint; this lane did not.**
- **BOOT GATE FIRES** (`app/src-tauri/**`): **exit 0**, on the port
  DERIVED from the card id — `T-186` → 20000 + 186×10 = **21860**, never
  defaulted. `lsof` gave zero rows immediately before binding, and both
  startup lines arrived, naming this lane's own folder:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-186` and
  `[nputer] window "main" created`. **1420 was read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else, before and after
  every run: zero rows every time.**
- **DOCS GATE FIRES** — this card's own frontmatter (`status`,
  `built_by`) and `T-194` are paths under `docs/` that code suites READ.
  Derived by ASKING rather than predicting: `docs-gate.mjs` on the
  forecast's path list answers **2 path(s)** and names three commands.
  All three green at `df52adb`:
  - `npx vitest run` from `lib/parser/` — **exit 0, 16 files / 344 tests**
  - `npm test` from `app/` — **exit 0, 49 files / 1077 tests**
  - `npm test` from `tools/e2e/` — **exit 0, 341 passed** (4.3m), on
    `NPUTER_E2E_PORT=31860`, DERIVED as 30000 + 186×10 and lsof'd to zero
    rows before binding
  - `npm run lint:docs` — **exit 0**: every live task card's frontmatter
    parses with a legal status; budgets hold (4 gated, 0 awaiting)
  - `npm run capabilities:check` — **exit 0, CURRENT (27333 bytes)**; no
    e2e spec name moved, so `docs/CAPABILITIES.md` needed no regeneration
  - `npm run lint:tokens` — **exit 0, clean**
- **METHOD EVAL GATE: not owed** — no path under `method/` in the
  forecast's 3.
- **AUDIT GATE** names a gate and declares no merge-diff trigger, so it is
  not one of these.

**THE E2E LANE WAS RUN TWICE AND ONLY THE SECOND RUN IS QUOTED.** The
first run was in flight when this lane renumbered its routed card and
edited this card — both paths that e2e bodies read. It came back 341
passed, but **a gate run against a tree that moved under it is not a claim
about the tree**, so it was discarded rather than reported, the tree was
committed, and the suite re-run against a frozen `df52adb`. Same count,
honestly obtained the second time.

**TWO OF THIS LANE'S OWN CHECKS WERE VACUOUS AND THE NON-EMPTY
PRECONDITION CAUGHT BOTH** (poison shape TEN — an empty comparison
reports agreement). A `diff` of the shipped half against base compared two
EMPTY files and exited 0, because zsh's `:a` modifier had mangled
`$ref:app/...` in a `git show`; and a duplicate-card-id check ran over an
empty corpus for the same class of reason. Both were caught by printing
the corpus size BEFORE reading the verdict, and both were then re-run with
a planted positive control. The repaired forms are what the two claims
above rest on: **the shipped half of `walk.rs` is 73 non-empty lines on
each side and IDENTICAL once comments are stripped** (control: a planted
one-token change reds it), and the merged tree carries **416 parsed card
ids with zero duplicates** (control: a planted duplicate is reported).

### ROUTED, NOT BUILT

**`T-194`** — the two sites above. Fence `crate-index`, the same as this
card. Filed with both measurements on it, so the next lane starts from
evidence rather than from a claim, and carrying this lane's own warning:
**measure whether the surviving half is separately pinnable rather than
inheriting a verdict**, because that is exactly what this card would have
got wrong.

### THE CARD ID IS A BOARD-SCOPED SURFACE WITH NO KEEPER, AND THIS LANE COLLIDED ON IT TWICE

**Two collisions, and the SECOND is the finding.** The first is the
ordinary hazard; the second proves the obvious fix does not work.

1. Filed as **`T-189`**, derived correctly as one past the highest id in
   the tree at dispatch. A DIFFERENT `T-189` then merged to main while
   this lane worked, so the merge would have carried two live cards with
   `id: T-189`. Caught by re-deriving against **main's tip** rather than
   against the base. Renamed to `T-190`.
2. **`T-190` was taken as well** — by `T-112-s4`'s routed card, in a live
   lane that had not merged. **Re-deriving against main could not have
   seen it**, because an unmerged lane's ids are absent from main by
   construction. The integrator holds the authoritative allocation and
   assigned **`T-194`**; this lane's is the FIFTH collision of the night.

**SO THE CHECK THIS LANE FIRST WROTE DOWN IS WRONG, AND IT IS CORRECTED
HERE RATHER THAN LEFT STANDING.** *"Derive a new card's id against the
integration tip when you commit it"* is exactly what collision 2 defeats.
**The id namespace cannot be derived from any single checkout**: main
lacks every live lane's ids, and no lane may read its siblings' trees.
There is no construction available to a lane at all — which is precisely
the case `lane-protocol.md` rule four ends on, a surface scoped by the
BOARD rather than by the checkout, where every written rule stays
satisfied while two lanes collide and nothing warns.

**What works is an ALLOCATOR, and only the dispatching seat can be one.**
A lane should be handed its suggestion ids at dispatch, or file a
suggestion with NO id and let the integrator assign one. Five sightings in
one night is well past an observation.

**AND WHY IT WOULD HAVE REACHED A MERGE UNSEEN IS THE HALF WORTH
KEEPING**: `git merge-tree` reports **NO conflict** for two cards carrying
the same `id:` under different filenames, so a merge forecast — the very
instrument the RANGE RULE prescribes — cannot catch it. **A
duplicate-`id:` check over the merged tree, read from the authoritative
frontmatter field rather than from filenames, is what catches it**, and
this lane ran that check with a planted positive control before trusting
its zero.

### WHERE THE BRIEF WAS WRONG

1. **ROW 4's `base commit:` names `d41e7373`, and this lane is cut at
   `c3fc1a1`** — one board commit later, the commit that promoted this
   card. The dispatch named this defect up front and filed it as `T-187`;
   the repository wins, the base is `c3fc1a1`, and it measured green
   before anything was touched. Every other row was checked against the
   tree and is current.
2. **The report the brief asks for and the blindness it asks me to
   protect are in tension, and the role file settles it.** The dispatch
   said to include no mutant volumes or figures that would contaminate a
   blind attack set; `roles/executor.md`'s report spec REQUIRES every
   drill, every figure and every exit code. The role file wins
   (`roles/executor.md`, "A BRIEF MAY NOT CONTRADICT THE ROLE FILE IT
   CITES"). The blindness is protected instead by the ruling that already
   covers it: **the verifier reads this card at the BASE ref**, without
   these notes. What that does NOT protect is a report pasted into the
   verifier's dispatch — so this is said plainly here, per that same
   file's instruction that a brief which cannot separate the two SAYS SO.
