---
id: T-085
title: A package-relative docs path is invisible to every arm of the docs gate — and one is live on bare cargo test
feature: F-06
milestone: 4
priority: 43
size: M
status: verifying
blocked_by: []
touches: [tools/e2e]
builder:
verifier: claude-opus-5
built_by: claude-opus-4.8 @T-085
verified_by: claude-opus-5 @T-085-verify
review: same-model
---

Absorbs: T-084-s8, T-084-s1 (fifth triage, 2026-08-20). Both files
removed in this commit.

**The docs gate's bound has a measured hole, and the tree holds one
live instance.** `docs-scan.mjs`'s `ROOT_ANCHOR_LEDGER` doc comment
asserts a universal — *"a file that holds this repository's root is the
only kind of file that CAN read this repository's docs/"* — and it is
false: a docs path expressed RELATIVE TO A PACKAGE DIRECTORY reads the
live tree while holding no root, and escapes all four mechanisms in
silence.

The live instance is `app/src-tauri/tests/agent_runner.rs:1761`:

    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl")

Measured at T-084's merge, not argued: mutate one field of that capture
and `docs-gate.mjs` fires owing **only** `npm test from tools/e2e/`
(121/121, exit 0) while bare `cargo test` goes **351/1/3, exit 101**.
An integrator who obeys the gate merges a red tree — BLOCKING 1's own
sentence, surviving its fix, on a fifth prefix.

**How the hole was found and then found again.** The verifier
falsified the universal with the JS spelling (`resolve("../docs/…")`),
found zero instances, and filed rather than rejected. The integrator
then found the Rust spelling live — the verifier had probed for the
idiom it expected rather than the one the tree uses, the same error it
had confessed one section earlier about `perf.rs`. The package-dir form
appears **21 hits across 9 files in `app/test` alone** (integrator's
re-derivation; the verdict's 9-across-5 was an undercount), so the next
instance is one character away.

T-084-s1's shape folds in here: a docs path behind an imported
constant is one hop of *import* following, the mirror of the call-arm
tracing T-084's fix already does for functions.

## Acceptance criteria

- THE ledger's universal SHALL be corrected to what is true — the
  scanner's mechanisms cover ROOT-anchored reads, and package-relative
  reads are a distinct class — OR `docsSites` SHALL resolve the literal
  against its file's package directory before judging it, which
  subsumes the `docs`-first rule rather than replacing it. State which
  arm and why; T-084-s8 recorded both.
- IF the resolution arm is taken THEN the discriminator that kept
  `lib/parser/test/files.test.ts` OUT (a fixtures-directory base) SHALL
  be shown to still hold — widening that lets fixture readers flood the
  reader set, which is the over-owing failure T-084's third way exists
  to avoid.
- **THE LIVE INSTANCE SHALL BE DERIVED, NOT LISTED**: after the fix,
  `agent_runner.rs` SHALL appear as a reader of
  `docs/research/captures/` owed by `cargo test`, produced by the
  derivation with no ledger entry naming it by hand.
- THE T-084 verdict's mutant SHALL be re-run: one field of the live
  capture mutated, and the gate SHALL owe a suite that actually reds —
  bare `cargo test` — never only a green one.
- A pin SHALL prove the package-relative class is covered by
  construction: plant a reader using `CARGO_MANIFEST_DIR` + `../../docs`
  in a scratch file AND one using a JS `resolve("../docs/…")`, and
  require both derived. Read the mutated text back; the verifier's
  probe missed the live instance by spelling.
- IF a docs path resolves OUTSIDE the repository (a `../../..` that
  escapes) THEN it SHALL be excluded and the exclusion asserted — the
  gate must not acquire readers in other repos.

Verification: headless — the docs-gate spec suite from tools/e2e, the
planted-reader pins, and the re-run mutant showing the owed suite reds.
Every figure carries the ref it was measured at. @human: none.

## Implementation notes

Built by claude-opus-4.8 @T-085, off `a15b78e` (main's tip at dispatch,
a `Checkpoint:` commit). Delivered tip `12b08c8`. Main advanced to
`11c82a1` (T-089 merged) while this lane sat; the merge forecast below
is re-derived at that live tip.

**THE ARM TAKEN: resolution, not correction-only.** The card offered
either (a) reword the ledger's universal to what the mechanism supports,
or (b) resolve the literal against its file's package directory before
judging, "which subsumes the `docs`-first rule rather than replacing
it." I took (b), the resolution arm — and did (a) as well, because a
false sentence left live in a code comment is the exact
`T-070-s5`/`T-081-s8` shape and the card's first criterion asks for it
outright. The mechanism now:

- `docsShaped(raw)` decides a site's SHAPE textually — is `docs` the
  first literal segment that is not a `..` climb. This keeps the
  candidate set (and the census) docs-shaped out of a corpus holding
  ~1000 path calls, and it is where the `docs`-first rule's FIRST half
  still lives (a literal whose first segment is `app` is not a site,
  which is what keeps `tools/e2e/fixtures/shell.ts` out).
- `siteDocsPrefix(site, ctx, root)` is the JUDGEMENT: resolve the
  literal against whatever the base evaluates to, keep it only when it
  lands inside `<root>/docs`, return the repo-relative prefix. One
  containment test does the four jobs the old two-halves-and-a-hole
  split across — subsumes `join(<root>, "docs/…")`, admits the
  package-relative climb, drops the fixture base, and drops a climb that
  escapes the repo (`path.relative` answers with its own `..`).
- The site patterns stopped judging the path. `JS_SITE` matches an
  explicit base then lookahead at the opening quote; `JS_CWD_SITE` is
  the no-base form whose implicit base is the package dir (`resolve`,
  `path.join`); `RS_SITE` now admits a base that is itself a CALL with
  one level of nested parens, which is what
  `Path::new(env!("CARGO_MANIFEST_DIR"))` needs and what made the live
  instance invisible even before the `docs`-first rule got to reject it.
- `evalBase` learned `process.cwd()` (the package dir spelled as a
  call — T-084's verifier's SECOND falsifier) and `ROOT_FORMS` records
  it.

**THE FIXTURES-DIRECTORY DISCRIMINATOR HOLDS, shown two ways.**
`lib/parser/test/files.test.ts` does `join(root, 'docs', 'ROADMAP.md')`
where `root = fixture(name)` from `import.meta.url`. It is NOT in the
reader set after the fix (asserted). On the live tree `evalBase` cannot
follow `fixture(name)` (a call WITH ARGUMENTS), so its base yields null
— but the exclusion must not REST on that, or a future `evalBase` that
followed argument-calls would flood the reader set with fixture readers,
which is exactly the over-owing failure T-084's third way exists to
avoid. So `RESOLVE_SAMPLES` proves the discriminator with a fixtures
base the calculus CAN evaluate (`resolve("test","fixtures","valid")`):
the path lands in `…/fixtures/valid/docs`, outside `<root>/docs`, and is
dropped by CONTAINMENT. That sample is a floored member of
`resolveSelftest()`.

**THE LIVE INSTANCE IS DERIVED, NOT LISTED** (criterion 3).
`app/src-tauri/tests/agent_runner.rs` now appears as a reader owed by
`cargo test`, prefix
`docs/research/captures/real-planner-turn-2026-08-19.jsonl`, via the
site arm — produced by the derivation with NO entry in
`ROOT_ANCHOR_LEDGER` naming it (asserted: it is not in the ledger, and
it is a reader that holds no root, which is the counterexample that
falsifies the old universal). The reader set moved 11 → 12; that one
file is the only addition (proportional, no fixture flood).

**BOTH SPELLINGS PLANTED AND BOTH REQUIRED DERIVED** (criterion 5).
`PLANTED_READERS` in `docs-scan.mjs` holds a `CARGO_MANIFEST_DIR` +
`../../docs` Rust reader AND a JS `resolve("../docs/…")` reader (plus
`process.cwd()`, a fixture base, and an escaping climb). The spec writes
them into a scratch git repo, reads each back off disk, runs the REAL
`docsReaders(dir)` over it, and requires the Rust plant owed by `cargo
test` and the JS plant owed by `npm test`. T-084's verifier probed for
the JS idiom, found zero, and filed — while the Rust idiom sat live; the
probe missed BY SPELLING, so both are planted and both are floored in
`resolveSelftest`. The poison-drill limb M1 additionally planted both in
the LIVE tree (readers 12 → 14, both derived, neither in the ledger),
then restored to an empty `git status`.

**THE CAPTURE MUTANT RE-RUN** (criterion 4), M2 of the drill, on a
COPY-safe basis after a mid-mutation connection drop taught the lesson
the hard way: mutate one field of the live capture
(`decision_reason_type` value `subcommandResults` → `sUbcommandResults`,
substitution count 1, read back via `git diff`), and `docs-gate.mjs`
fed the one changed path FIRES (exit 1) owing **`cargo test from
app/src-tauri/`** and `npm test from tools/e2e/`. Bare `cargo test
--no-fail-fast` then goes **360 passed / 1 failed / 3 ignored** over 15
`test result:` lines, **exit 101**, the one red body
`the_tool_denied_fixture_is_a_transcription_not_a_construction`. Before
the fix (the `a15b78e` scanner, run at this same ref) the same mutant
owed **only** `npm test from tools/e2e/` — the green suite. The gate now
owes a suite that actually reds. The capture was restored byte-identical
(sha256 `273a3d33…` == `git show HEAD:…`), tree clean.

**ESCAPE EXCLUDED AND ASSERTED** (criterion 6). A planted
`resolve("../../../docs/tasks")` from `app/test/` climbs out of the
repo; `packageRelativeSites()` classifies it `outside` (seen as a
docs-shaped site, prefix null), and it is asserted absent from the
reader set. The gate acquires no readers in other repositories.

**Figures, each at its ref.** At `12b08c8`, the delivered tip:
- Derivation: **12 readers across 4 suites**; census **119 docs-shaped
  sites in 22 files, 12 resolving into docs/ in 10 files**; **24
  root-anchored files (11 derived, 0 unlinked, 13 unclassified)**; **1
  package-relative site, derived**; `unaccountedRootAnchors()` unchanged
  at 6, ledger agrees.
- e2e lane **135/135**, `NPUTER_E2E_PORT=14585` (bind-probed free on all
  four stacks; 1420 read via `lsof` only, holder `node` 82549
  `[::1]:1420`, untouched); `tsc --noEmit` 0.
- parser **263/263**, `npm run build` 0, `tsc --noEmit` 0.
- app **857/857**, `npm run build` 0 (`index-DsNHI2Jr.js` 503.61 kB,
  `index-CwYF5FQb.css` 43.95 kB — unchanged; this lane touches no
  bundle input).
- bare `cargo test --no-fail-fast` **361/0/3** over 15 lines, exit 0
  (baseline; the T-061-s4 kill-path flake did not fire, one run).
- token lint **clean (TOKEN 124, CONTROL 581)**, selftest 0.
- `index --check --root ../..` from `app/src-tauri` exit **0**, graph
  CURRENT at 588891 bytes / 119 files / 1023 symbols / 1550 edges — this
  lane is `tools/**`, `.nputerignore`-excluded, so the graph does not
  move and GRAPH REGEN is NOT owed.

**The standing gates on THIS lane's own diff (3 paths at `12b08c8`:
`tools/e2e/scripts/docs-gate.mjs`, `docs-scan.mjs`,
`tools/e2e/tests/docs-input-gate.spec.ts`):**
- GRAPH REGEN — `.ts/.tsx/.js/.jsx` outside docs/: the spec is `.ts` and
  DOES match the trigger suffixes, but it is under `tools/` which
  `.nputerignore` excludes from the index, so `index --check` stays
  CURRENT (verified 0). The two `.mjs` are not in the trigger suffix
  list at all. NOT owed.
- BOOT GATE — `app/src/**`, `app/src-tauri/**`, a manifest: none of the
  three. NOT owed.
- DOCS GATE — this lane's diff has NO path under `docs/` (all three are
  `tools/e2e/**`), so the gate does not fire on the CODE diff. It DOES
  fire on the card + finding materialized in the verifying commit below
  (a `docs/tasks/*.md` diff), and that run is recorded there.

**Merge forecast, re-derived at live main `11c82a1`, dot-counts stated.**
`git merge-tree --write-tree 11c82a1 12b08c8` → tree `c66dc5da…`, exit 0.
`git diff --name-only 11c82a1 <TREE>` → **3** (the prescribed pre-merge
form). Three-dot `11c82a1...12b08c8` → **3**; branch-only
`a15b78e..12b08c8` → **3**; all three collapse because the branch adds
no path main also moved. The FORBIDDEN two-dot `11c82a1..12b08c8` →
**24**, which is **21 (main's T-089 advance from `a15b78e`) + 3
(branch)**, `comm -12` over the two sorted lists EMPTY — pure
left-endpoint drift, not this merge. T-089 touched `[method/,
docs/CONVENTIONS.md]` + findings; disjoint from `[tools/e2e]`. My spec
reads `docs/CONVENTIONS.md`, so I forecast every CONVENTIONS-dependent
assertion against main's REWORDED bullet: the DOCS GATE bullet still
names exactly the four derived commands (both directions), still carries
`docs-gate.mjs --census` and the two pointers, still no transcribed site
count, and each `run from <dir>/:` bullet still lists its command. Green
at merge.

Nothing from this integration survives: no process bound/connected/
signalled 1420 (lsof-only), scratch port 14585 free after, no `pkill`,
the drill ran in-tree at a committed ref with byte-restore proved, and
the `nputer-T-060` orphans were left alone.

## Verdicts

### 2026-08-23 — REJECTED (claude-opus-5 @T-085-verify, review: same-model)

**One blocking finding, and it is this card's own subject matter left
half-done: `docs-scan.mjs` now RETRACTS the false universal in one
comment while still ASSERTING it in another, 220 lines earlier.** Line
1878, in the doc comment of `rootAnchoredFiles()` — the census the
sentence is about — reads:

    * the tripwire below can only report a file it can SEE a docs site
    * in, so a file that reaches docs/ purely through a callee this
    * scanner cannot open is invisible to BOTH. What bounds that class
    * is not an argument, it is this list: A FILE HOLDING THE REPOSITORY
    * ROOT IS THE ONLY FILE THAT CAN READ THIS REPO'S DOCS/, so
    * `unclassified` is the exact set of places the answer could still
    * be short

That is the same claim the ledger comment at :2096 now explicitly
withdraws — *"THE SENTENCE THAT USED TO OPEN THIS COMMENT WAS FALSE, and
T-085 is what it cost"* — and it is not decorative. It is the stated
WARRANT for the paragraph's conclusion, and T-085 disproved the
conclusion too: `agent_runner.rs` was a place the answer was short, and
it is not in the root-anchor census at all, because it holds no root. So
`unclassified` is NOT "the exact set of places the answer could still be
short"; the package-relative class is another, which is precisely why
`packageRelativeSites()` and `unlinkedSites()` had to be written.

Reproduce:

    grep -n "only file that CAN read\|only kind of file that CAN read" \
      tools/e2e/scripts/docs-scan.mjs
    # 1878:  * the repository root is the only file that CAN read this repo's docs/,
    # 2098:  * the only kind of file that CAN read this repository's docs/." It is a

:2098 is the quoted-and-retracted copy. :1878 is live and unqualified.
Criterion 1 asks for the universal "corrected to what is true"; the
executor's own notes name `T-070-s5`/`T-081-s8` — a live false comment —
as the reason arm (a) was done at all, and this file's remaining copy is
that shape exactly. The narrowing already written at :2110 ("can name
docs/ by an ABSOLUTE anchor") is the sentence :1878 needs, plus a clause
conceding that the package-relative class is bounded by construction
rather than by this list. **The code is correct; this is a comment fix,
and it is the only thing standing between this card and APPROVED.**

**Everything else on this card held under attack, including the parts I
tried hardest to break.** Findings below are non-blocking.

**Criteria read before the notes.** The criteria are inline in the card,
but the `T-089-s2` leak path was AVOIDED here rather than declared: I
read `sed -n '1,86p'` (frontmatter through the last criterion, stopping
one line short of `## Implementation notes`), formed and wrote down my
own mutant set, and only then read :87 onward. A ranged read is
sufficient; a single `cat` is not forced. Three verifiers declaring the
leak unavoidable this session were each one `sed` from not having it.

**Refs, re-derived, not inherited.** Main had already advanced past the
brief's `11c82a1`: **T-013 LANDED** at `6834287` before I started. Tip
`8f09df1`, base `a15b78e`, `git merge-base 6834287 8f09df1` =
`a15b78e`, unmoved.

    git merge-tree --write-tree 6834287 8f09df1 -> 2ca84028…, exit 0
    git diff --name-only 6834287 <TREE>               -> 5   PRESCRIBED
    git diff --name-only 6834287...8f09df1 (3 dots)   -> 5
    git diff --name-only a15b78e..8f09df1  (2 dots)   -> 5
    git diff --name-only 6834287..8f09df1  (2 dots)   -> 52  FORBIDDEN

`comm -12` over main's advance and the branch's paths is EMPTY — T-089
and T-013 are disjoint from `tools/e2e`.

**T-013 did NOT move the live instance.** The brief said to expect it to.
In the merged tree (lane + `6834287`, merge exit 0) `agent_runner.rs`
still holds `Path::new(env!("CARGO_MANIFEST_DIR"))` at **1760** and the
`.join("../../docs/…")` at **1761**, and the re-derived census is
**12 readers, unchanged**. The card's prose cites `:1761` (the literal)
while the gate prints `:1760` (the base, where the match starts); both
are findable, neither is wrong, but they are different lines.

**THE OVER-ADMISSION ATTACK — eight mutants planted in a detached
worktree at `8f09df1`, seven refused, one admitted.** Planted as tracked
source and re-derived with the real `docsReaders()`:

| mutant | shape | result |
|---|---|---|
| fixture `docs/` dir, base EVALUABLE | `resolve(HERE,"fixtures","valid-project")` + `join(FIX,"docs","tasks")` | excluded — containment |
| scratch path built then deleted | `mkdtempSync(join(tmpdir(),…))` base | excluded — base null |
| sibling checkout | `resolve("../../nputer-T-013/docs/tasks")` | excluded — not even docs-SHAPED |
| escape climb | `resolve("../../../docs/tasks")` | excluded, classified `outside` |
| partially-foldable variable | `join(join(resolve(".."), which), "docs","tasks")` | excluded — one arg unfoldable |
| template under `method/` | `resolve("../docs/tasks")` from `method/docs-templates/` | excluded, classified `outside` |
| **suite-less file under `docs/`** | `join("docs","tasks")` in `docs/design/…/x.js` | **ADMITTED — see finding 2** |
| bare-`docs` suite-less reader | `join("docs")` | admitted; ledger equality UNAFFECTED |

The sibling-checkout climb is refused one layer EARLIER than containment
and that is worth recording: `docsShaped` requires `docs` to be the
first segment that is not a `..`, so `../../nputer-T-013/docs/tasks` —
a real directory on this disk — never becomes a site at all. Two
independent exclusions, not one.

**THE FIXTURES DISCRIMINATOR IS CONTAINMENT, NOT ACCIDENT — ruled by
making the evaluator succeed.** On the live tree `evalBase("root")` in
`lib/parser/test/files.test.ts` returns **null** for all six of its
docs-shaped sites (`root = fixture(name)`, a call WITH ARGUMENTS the
calculus cannot follow), so today the exclusion is TAKEN by evaluation
failure. That is not the question. I respelled the live file's base into
a form the calculus CAN follow —

    const root = fileURLToPath(new URL('./fixtures/valid-project', import.meta.url));

— and re-derived: `evalBase` now returns
`…/lib/parser/test/fixtures/valid-project`, and **all six sites still
yield `prefix=null`**, dropped by containment because
`lib/parser/test/fixtures/valid-project/docs/ROADMAP.md` is not under
`<root>/docs`. The exclusion survives the evaluator improving. It is a
property of containment with evaluation failure sitting in front of it,
not an accident of the failure — and it holds structurally, because the
fixture tree is rooted at the file's own directory, which is nowhere
near `<root>/docs`. Independently pinned twice in the tree
(`RESOLVE_SAMPLES`' floored fixture negative, `PLANTED_READERS`'
`t085-planted-fixture.ts`), so it cannot regress silently.

The brief told me the executor claims this "does NOT rest on `evalBase`
merely failing to follow `fixture(name)`". **The brief mischaracterised
the executor.** The notes and the header comment at :99–110 both state
plainly that on this tree `evalBase` DOES yield null and that the
exclusion must not rest on it — which is exactly what I proved. The tree
is more honest than the brief reported it to be.

**BOTH SPELLINGS PLANTED BY ME, BOTH DERIVED.** Not the executor's pins
— my own, written into the live corpus of the drill worktree:

    app/src-tauri/tests/vfy_rust_reader.rs
      Path::new(env!("CARGO_MANIFEST_DIR")).join("../../docs/research/captures/vfy.jsonl")
      -> DERIVED  [cargo test from app/src-tauri/]  docs/research/captures/vfy.jsonl
    app/test/vfy-js-reader.ts
      resolve("../docs/tasks")
      -> DERIVED  [npm test from app/]  docs/tasks

Readers 12 → 15 with both plants and the suite-less mutant present; both
spellings appear in `packageRelativeSites()` as `derived`. T-084's
verifier missed the live instance by probing only the JS idiom; probing
both, the Rust idiom derives.

**THE CAPTURE MUTANT, RE-RUN INDEPENDENTLY.** In the detached drill at
`8f09df1`, never in the lane or main checkout. One field mutated on line
19 of `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
(`"decision_reason_type": "other"` → `"MUTANT"`; my field, not the
executor's `subcommandResults` → `sUbcommandResults`):

    node tools/e2e/scripts/docs-gate.mjs <the one changed path>
      exit 1 — FIRES, owing:  cargo test from app/src-tauri/
                              npm test from tools/e2e/
    cargo test --no-fail-fast   (from app/src-tauri, CARGO_TARGET_DIR
                                 inside the drill, cold)
      360 passed / 1 failed / 3 ignored over 15 `test result:` lines
      exit 101
      the_tool_denied_fixture_is_a_transcription_not_a_construction
      panicked at tests/agent_runner.rs:1808:13

The owed suite reds. The executor's 360/1/3 exit 101 reproduces exactly
at a different mutated field, which is the stronger result. Restored and
proved byte-identical across all four copies:

    sha256 273a3d33593a53614101489b9cd3e9574010beae3830a60f43a8e65f74da47ac
      drill after restore == git show 8f09df1:<path>
      == main checkout on disk == lane worktree on disk

**The brief's warning that a sibling lane left this shared fixture
modified on disk is FALSE as of this session.** All four copies were
already at `273a3d33…` before I touched anything, and
`git status --porcelain` was empty for that path in main and in all four
`nputer-T-*` worktrees. Nothing needed recovering.

**THE LIVE INSTANCE IS DERIVED, NOT LISTED — and the 11 → 12 delta is
exactly one file.** Measured by running BOTH scanners over the same
merged tree:

    a15b78e scanner -> 11 readers
    8f09df1 scanner -> 12 readers
    ADDED   : ['app/src-tauri/tests/agent_runner.rs']
    REMOVED : []

`ROOT_ANCHOR_LEDGER` holds six files and `agent_runner.rs` is not among
them. The set-equality assertion is against `unaccountedRootAnchors()`,
which filters `kind !== "derived"`, so a derived reader correctly drops
out rather than owing a hand-written entry — no contradiction between
criterion 3 and the ledger equality.

**T-085-s1's NIL census: HONEST BOUND, filed, not rejected — and I made
it falsifiable.** The card argues the package-relative class has no
enumerable population, so its one disclosed residual (limit 5b: a base
already inside `docs/`, spent on a literal not itself starting with
`docs`) has no census. The READER class indeed has none. But the
RESIDUAL does, by a different census than the one the card says cannot
exist: enumerate every binding in the corpus whose value evaluates
inside `<root>/docs`. I ran it over **3800 bindings across the whole
corpus** and found **exactly 2**:

    lib/parser/test/rejected-exclusion.test.ts  rejectedDir -> docs/tasks/rejected
    lib/parser/test/task.test.ts                taskDir     -> docs/tasks

Both are LOCAL, and both files are already derived readers carrying
prefixes that cover everything a second site off those bases could name
(`docs/tasks/rejected`, `docs/tasks`). The IMPORTED case — the actual
residual — is **NIL, measured, not asserted**. This is materially
stronger than T-084-s8's precedent, where a disclosed hole with zero
instances had no census and the tree then turned out to hold one: here a
census exists, I ran it, and it held. Filing is right. The residual card
should record the census method so the next reader can re-run it rather
than re-argue it.

**Standing gates on this lane's diff, derived from CONVENTIONS rather
than accepted.** GRAPH REGEN fires on `*.ts/*.tsx/*.js/*.jsx` outside
`docs/`; `docs-input-gate.spec.ts` IS `.ts` and outside `docs/`, so the
trigger DOES match — the executor says so too, and is right that the
regeneration is a no-op because `.nputerignore` excludes `tools/` from
the index walk. Stating it as "not owed" is a claim about the
consequence, not the trigger; the distinction matters if `.nputerignore`
ever changes. The two `.mjs` are not trigger suffixes. BOOT GATE fires on
`app/src/**`, `app/src-tauri/**` or a manifest: none of the five paths.
NOT owed, confirmed.

**Non-blocking findings.**

2. **A suite-less file becomes a reader whose owed command is
   `undefined` — new to T-085, zero live instances.** `JS_CWD_SITE` is
   the no-base arm this card adds; combined with `suiteFor()` returning
   `undefined` for anything outside the four declared packages, a file
   at `docs/design/claudedesign_handoff/x.js` containing
   `join("docs","tasks")` derives as a reader and the gate prints, at
   exit 1:

       reader  docs/design/…/x.js  [undefined from undefined/]  docs/tasks
       docs-gate: FIRES …  Run:
         undefined from undefined/

   The `a15b78e` scanner does NOT admit the same file (verified by
   running it over the identical tree), so this is newly reachable. It
   is the loud direction — an integrator sees an uninterpretable command
   and stops, rather than a short answer — and the one suite-less corpus
   file today (`docs/design/claudedesign_handoff/support.js`) contains
   no docs-shaped path call, so the census is NIL. I also checked the
   second-order hazard: a suite-less reader with a bare `docs` prefix
   puts `undefined` into `suitesOwedForAllOfDocs()`, but
   `unaccountedRootAnchors()` and the ledger stayed EQUAL, because every
   root-anchored file sits in a declared suite. Suggested fix: either
   skip readers with no suite, or name them explicitly as unrunnable.

3. **A doc comment on the judgement function overstates the live tree.**
   `siteDocsPrefix`'s comment (:1074) says *"The fixture base resolves to
   lib/parser/test/fixtures/<name>"*. It does not resolve — `evalBase`
   returns null there, as the header at :99–110 correctly says and as I
   measured. The conclusion (dropped, outside `<root>/docs`) is right;
   the mechanism as written is not. One clause.

4. **A docs-shaped site with an unevaluable base, a non-climbing
   literal, and no repository root in the file is dropped SILENTLY** —
   `unlinkedSites()` filters to climbing sites and `unlinkedFiles()` to
   root-anchored ones, so neither reports it (my `mkdtempSync` mutant is
   this shape). This is disclosed as limit 5 in "WHAT IT CANNOT SEE"
   (*"a base that is a call WITH ARGUMENTS … is still invisible to
   both"*), so it is a known hole and not a new one — recorded here only
   because it is the under-firing direction and the census above is what
   bounds it.

**Environment.** 1420 read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` only,
never bound, connected or signalled; holder unchanged, `node` 82549 on
`[::1]:1420`. No `pkill`; the `nputer-T-060` orphans were left alone. No
`npm ci`/`npm install` anywhere; the drill reached `yaml` through a
symlink to the lane's own `node_modules`. `docs-gate.mjs` was invoked
DIRECTLY with paths, never through `xargs`. The drill ran detached at
`8f09df1` in a scratch worktree outside the repository with its own
`CARGO_TARGET_DIR` inside it, and was reset and cleaned after. No real
model call. Nothing from this verification survives on disk.

**Owed suites re-run AFTER the verdict commit `ee841a3` landed
(T-081-s9).** `docs-gate.mjs` fed this card's path fires at exit 1 and
owes three; all three green on the committed tree:

    npx vitest run   from lib/parser/   263/263, 12 files, exit 0
    npm test         from app/          857/857, 43 files, exit 0
    npm test         from tools/e2e/    135/135, exit 0   NPUTER_E2E_PORT=14611
                                        (bind-probed free on 0.0.0.0,
                                         127.0.0.1, ::, ::1 before use)

`cargo test` is NOT owed by this diff — `agent_runner.rs` reads
`docs/research/captures/`, not `docs/tasks/` — and was exercised instead
by the capture mutant above (360/1/3, exit 101, then restored).

Not owed but measured, to confirm the executor's figures rather than
accept them: `lint:tokens` clean, exit 0, **TOKEN 124 / CONTROL 582**.
The executor recorded CONTROL **581** at `12b08c8`; the verifying commit
`8f09df1` adds `T-085-s1-*.md`, one new tracked text file, so 581 → 582
reconciles exactly at its own ref rather than disagreeing.
`nputer-index --check --root ../..` exit **0**, graph CURRENT at 588891
bytes / 119 files / 1023 symbols / 1550 edges — GRAPH REGEN confirmed
not owed materially, not only by reading the trigger.
