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
verifier:
built_by: claude-opus-4.8 @T-085
verified_by:
review:
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
