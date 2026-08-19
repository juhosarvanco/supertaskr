---
id: T-058
title: The tree stays searchable — a C0 gate in lint:tokens, and a lint that is safe to import
feature: F-02
milestone: 4
priority: 26
size: M
status: done
blocked_by: []
touches: [tools/e2e]
builder: codex/gpt-5.6
verifier: claude-opus-5
built_by: codex/gpt-5.6 @fresh
verified_by: claude-opus-5 @fresh
review: independent
---

Absorbs: T-034-s5, T-034-s6, T-045-s2 (triage 2026-08-17). The
suggestion files are removed in the same commit as this card. Three
findings in ONE file (`tools/e2e/scripts/lint-tokens.mjs`) and one
refactor closes all three.

THE HAZARD, STATED THE WAY T-034-s6 CORRECTED IT — this wording is
load-bearing, because s5's own lede is wrong and a durable note that
misidentifies the mechanism sends the next reader to harden the wrong
thing. A control character written as a LITERAL byte instead of its
six-character escape compiles, bundles, typechecks and tests green.
`file(1)` then calls that source `data`. **This repo's gates are NOT
blinded** — every one of them (both no-innerHTML gates, `lint:tokens`)
reads through Node's `readFileSync(…, "utf8")`, where a NUL is an
ordinary codepoint in a JavaScript string and regex matching is
unaffected, and `.github/workflows/ci.yml` contains ZERO greps. What
IS blinded is the **searcher**: `ripgrep`/`ugrep` with `-I` return no
match at all, exit 1 — which is the mode every agent and most humans
search this tree in. In a method where agents audit the repo BY
GREPPING IT, one byte can make a file unsearchable to every future
session while every suite stays green.

THIRTEEN REPRODUCTIONS ACROSS SIX SESSIONS, one of them into STATE.md
itself, one refused by the tool layer, and **one into this very card
while it was being written** — the triage analyst drafting this
paragraph landed a literal NUL at byte 1058 quoting the escape as
prose, `file(1)` immediately called the card `data`, and it was caught
only by running the C0 scan on its own output before staging. That is
the second time the mechanism has reproduced itself inside a document
describing it (T-034's verifier hit the same thing writing s6 and s7).
The escape-lands-as-character failure is real, frequent, and completely
silent.

THE PRACTICAL LESSON, worth carrying into the implementation: the fix
is not to be careful, it is to never spell the escape. This card's
prose now says "U+0000" with a plus sign everywhere and quotes no
backslash form at all, which is the only version that has survived.

AND THE TREE IS CLEAN RIGHT NOW — re-verified at triage:
`git grep -P '[\x00-\x08\x0b\x0c\x0e-\x1f]'` over every tracked
`.ts`/`.tsx`/`.mjs`/`.md`/`.rs`/`.json` returns NOTHING (exit 1), and
`map-layout.ts:405` now carries the escape form. That is exactly the
moment T-034-s5 named to add the gate: before the next one.

## Acceptance criteria
- `lint:tokens` SHALL gain a fifth pattern P5 — "literal control
  character (invisible, and it makes binary-skipping searchers miss
  the file entirely)" — applied to the RAW source rather than the
  masked text, because a control byte in a COMMENT is just as
  blinding as one in a string. Tab, LF and CR allowed; the report
  names the codepoint in U+XXXX form and the byte offset, in the idiom
  of the other four.
- P5 SHALL carry its own positive and negative `--selftest` samples,
  like the other four patterns, and the allowlist SHALL stay ZERO.
  **The positive sample SHALL be constructed at runtime** (from a
  character code, never typed into the source), because a sample file
  containing a literal control byte would trip the gate it is testing
  and would itself be unsearchable — T-034 hit exactly this writing
  its own gate.
- THE extracted module SHALL expose TWO explicit corpora. The TOKEN corpus
  keeps the current UI-relevant roots exactly as they are; P1–P4 run only over
  that masked source. The CONTROL corpus SHALL cover all tracked first-party
  text — including `lib/parser/src/**` — and P5 alone SHALL read its raw bytes.
  Tailwind/token rules SHALL NOT be applied to prose, parser or Rust files.
- ARCHITECT RULING (2026-08-18): the CONTROL corpus SHALL include `docs/**`,
  `method/**`, root records, `.github`, app/parser Rust and TypeScript,
  scripts, JSON/TOML/YAML, HTML/CSS/text and lockfiles, while excluding binary
  assets and generated/dependency directories. Leaving records out would omit
  the highest-incidence surface and violate succession: these are the files
  agents search to recover the project. At checkpoint `ae8833c` the current
  corpora are TOKEN **117** and CONTROL **520**; the executor SHALL re-derive
  rather than pin either count. The extracted module itself belongs to CONTROL
  but is excluded only from TOKEN, whose rules it implements.
- P5 SHALL report a true BYTE offset derived from a `Buffer`, not a JavaScript
  UTF-16 string index. The lint SHALL report TOKEN and CONTROL corpus counts
  separately so a green token scan cannot be mistaken for whole-tree control
  coverage.
- THE standing C0 check T-034 added over `app/src/architecture/**`
  (`map-tasks-lens-dom.test.tsx:573`) SHALL be kept exactly as it is —
  it works, it names codepoint and offset, and it is proven by
  planting. Two gates over one property is not duplication here; the
  vitest one is fast and scoped, the lint one is CI's first step and
  runs against a bare checkout with nothing installed.
- THE testable half of the lint SHALL move into a side-effect-free
  module (`scripts/token-scan.mjs` exporting `maskSource`,
  `scanSource`, the patterns, the walk policy and `corpus()`), with
  `lint-tokens.mjs` keeping its unconditional `lintTree()` /
  `selftest()` call. Importing the lint today runs the FULL tree lint
  and, on a tree with a violation, `process.exit(1)`s the importer
  before it runs a line of its own — two tasks in a row worked around
  this (T-045-s2).
- THE `import.meta.url === process.argv[1]` guard SHALL NOT be used
  and the notes SHALL say why: T-046 argued it down for
  `tauri-boot-check.mjs` because a path mismatch (symlinked checkout,
  wrapper script) turns the gate into a silent exit 0 — and this lint
  is CI's FIRST step.
- T-034's implementation notes SHALL have their "the no-innerHTML
  gate, `lint:tokens` and every CI grep stop seeing that file"
  sentence replaced by T-034-s6's measured table, so the durable
  record names the mechanism that actually failed.

Verification: headless — `npm run lint:tokens`, `-- --selftest`, and a
runtime-constructed planted control byte in every CONTROL-corpus root shown
red then reverted (`shasum -c` clean). Plant representative non-ASCII text
before it to prove the reported byte offset is not a UTF-16 index. @human:
none.

## Implementation notes

Implemented by **codex/gpt-5.6 @fresh** on
`task/T-058-searchable-tree` from architect checkpoint `71fa546`.

### Two corpora, one unconditional gate

`tools/e2e/scripts/token-scan.mjs` now owns the side-effect-free scanner.
It exports the P1–P4 definitions, P5, `maskSource`, both scan functions,
the walk policy, `corpus()`, `lintTree()` and `selftest()`. A direct import
defines those values and does nothing else. `lint-tokens.mjs` is the small
command wrapper and still calls `lintTree()` or `selftest()` unconditionally.
It deliberately has no `import.meta.url === process.argv[1]` guard: a
symlinked checkout or wrapper script can make those paths disagree and turn
CI's first gate into a silent exit 0.

TOKEN retains exactly `app/src`, `app/test` and `tools/e2e`, the existing
TS/TSX/MJS suffixes, the same mask and unchanged P1–P4 semantics. Both lint
implementation scripts are excluded by name from TOKEN and remain included
in CONTROL; the new test file is ordinary TOKEN input. CONTROL derives its
authority from `git ls-files -z`, then excludes generated/dependency
directories and a named set of binary-asset suffixes. Everything else is
raw input, including docs, method, root records, `.github`, app/parser
TypeScript and Rust, scripts, dotfiles, extensionless fixtures, JSON, TOML,
YAML, HTML, CSS, text and lockfiles. There is no hit allowlist.

The card's 520 CONTROL baseline belonged to `ae8833c`. This branch's
checkpoint contains three later suggestion-record removals and two promoted
cards, so the same policy re-derived **519** before T-058. The committed
post-change corpora derive as **TOKEN 118 / CONTROL 521**: TOKEN's 117 grows
only by the test, and CONTROL grows by the scanner plus its test. No count is
pinned in implementation or test.

### P5 and the seven-root plant

P5 reads a `Buffer`, permits byte 09, 0A and 0D, and rejects 00–08, 0B, 0C,
0E–1F and 7F. Each finding names `P5`, U+XXXX and the zero-based raw byte
offset. The positive selftest constructs its forbidden byte at runtime; the
negative sample contains only the three allowed bytes. The focused suite
also checks every forbidden byte and proves a non-ASCII prefix has more bytes
than JavaScript string units before asserting the reported offset.

The standing architecture check was preserved byte-identical at SHA-256
`b6995559...740b1`. The new plant test appends one runtime-built byte after a
24-byte prefix containing `é` to seven tracked files simultaneously and gets
exactly seven CONTROL reds at these byte offsets:

- `app/package.json` 940
- `docs/NORTH_STAR.md` 3720
- `lib/parser/package.json` 835
- `tools/e2e/package.json` 751
- `method/README.md` 3462
- `AGENTS.md` 525
- `.github/workflows/ci.yml` 9141

Restoration runs in `finally`; the test compares all seven post-restore
SHA-256 values to the saved original Buffers and requires `git diff --quiet`
over all seven paths. The restored focused run passed **5/5**. T-034's
durable implementation note now replaces the false “every gate is blind”
sentence with T-034-s6's measured table: Node readers still catch violations,
CI has no shell greps, `/usr/bin/grep` matches but suppresses line text, and
binary-skipping `ripgrep` / `ugrep -I` miss the file entirely.

### Evidence

- `npm run lint:tokens -- --selftest`: **49 TOKEN samples + 2 CONTROL
  samples, 37 walk-policy checks**, all green.
- `npm run lint:tokens`: clean, **TOKEN 118 / CONTROL 521**.
- Direct `await import("./tools/e2e/scripts/token-scan.mjs")`: exit 0,
  emitted only the caller's post-import marker.
- `npm run typecheck` from `tools/e2e`: green.
- Focused scanner suite: **5/5** green.
- Full headless E2E lane: **88/88**, one worker, no skips.
- Fresh-worktree prerequisites were lockfile-exact: parser `npm ci` + build,
  app `npm ci`, tools/e2e `npm ci`; all three installs reported zero
  vulnerabilities.
- Poison discipline: one relation-breaking expectation in each of the five
  new test bodies produced exactly **5/5 named reds**. Restoration returned
  `token-scan.spec.ts` to SHA-256
  `ee9852b60df312c6730ab8106aac29ceafd2f46b70b56e07965bf13e316bb551`
  before the green focused and full reruns.

The permanent diff is confined to the lint wrapper/scanner, its test and
typecheck entry, T-034's durable correction, and this card. No app source,
parser source, Rust, manifest, lockfile, workflow, architecture fixture or
graph moved. Graph regeneration and the boot gate therefore do not trigger.
No suggestion was filed: the checkpoint-count difference was fully explained
by the already-recorded task-triage wave and required no policy change.

## Verdicts

### 2026-08-19 — APPROVED (claude-opus-5 @fresh, review: independent)

Verified `2444af0` against its parent `71fa546` in worktree
`nputer-T-058`. Cross-model: built by `codex/gpt-5.6`, verified by
`claude-opus-5`, no builder reasoning consulted beyond the committed
card. Diff is the stated 6 files, +1130/-704.

**All nine acceptance criteria hold**, each re-derived rather than read:

1. **P5 on RAW bytes.** `scanControlSource` takes a `Buffer` and throws
   a `TypeError` on anything else. Tab, LF and CR pass; 00-08, 0B, 0C,
   0E-1F and 7F red. Report idiom matches the other four:
   `path:byte N: U+XXXX  [P5: literal control character …]`.
2. **Runtime-constructed positive sample, zero allowlist.** The positive
   is `Buffer.from([0x00])` concatenated after a non-ASCII prefix; the
   negative is `Buffer.from([0x09, 0x0a, 0x0d])`. No forbidden byte is
   typed anywhere in the branch — all four changed source files report
   `charset=utf-8` or `us-ascii` under `file --mime`. No per-hit mute
   mechanism exists; `allowlist` appears only in prose arguing against
   one.
3. **Two explicit corpora.** TOKEN is byte-for-byte the old policy:
   118 files, and **0 from docs/, method/, lib/parser/ or
   app/src-tauri/**. P1-P4 run on masked text, P5 on raw Buffers, and
   `corpus()` hard-errors on any third name.
4. **The architect's amended scope is what the code implements.**
   539 tracked, minus exactly the **18** binary assets (16 icons,
   2 woff2) = **521**. Zero tracked files sit under a skip directory,
   so `SKIP_DIRS` removes nothing today and the whole exclusion is the
   suffix deny list. CONTROL carries 248 markdown files, all 44 Rust
   sources, both lockfiles, dotfiles and extensionless fixtures. Stated
   scope and real scope agree.
5. **Byte offsets, separate counts.** Counts re-derived independently
   from `git ls-tree` under the shipped policy: `ae8833c` TOKEN 117 /
   CONTROL 520 (matching the card's baseline), `71fa546` 117 / 519,
   tip **118 / 521** — TOKEN +1 for the spec, CONTROL +2 for the
   scanner and the spec, nothing removed. The live run agrees exactly.
6. **Standing check preserved.** `map-tasks-lens-dom.test.tsx` is
   untouched by the diff and hashes to
   `b6995559033ac5c6f693527a430b0a6c98fb87f9980cfeadd13f6d0e459740b1`,
   the value the notes claim.
7. **Import no longer runs the lint — proven side by side.** With one
   P3 violation planted live in `tools/e2e/preflight.ts`: importing
   `token-scan.mjs` exits **0** emitting only the caller's marker;
   running the wrapper on the same tree exits **1** naming the hit; and
   restoring the wrapper to its `71fa546` content and importing THAT
   exits **1** with 30 reports — the T-045-s2 defect, reproduced and
   then shown closed. Both files restored, `shasum -a 256 -c` OK.
8. **No argv guard, and its absence is load-bearing.** `git grep` finds
   `import.meta.url === process.argv[1]` only in comments and card
   prose, never in executable code. Invoked through a symlink in
   another directory — the exact path mismatch T-046 argued about — the
   wrapper still lints and exits 1. A guard would have exited 0 there.
9. **T-034's record now names the right mechanism.** The false sentence
   is replaced by s6's five-row table, and the s5 summary line is
   corrected too. Each row reproduced here on a scratch file carrying
   one U+0000: `file --mime` says `charset=binary`; `/usr/bin/grep`
   prints "Binary file … matches" at exit **0** with the line text
   suppressed; the same grep with `-I` prints nothing at exit **1**;
   Node's `readFileSync(…, "utf8")` finds **both** needles; and
   `ci.yml` contains zero greps (`git grep` over it exits 1). ripgrep
   is not installed on this machine, so its row is corroborated by the
   `-I` behaviour rather than measured directly.

**Independent plant drill.** Ten targets chosen by the verifier, all
different from the executor's seven, covering every CONTROL root plus
markdown, YAML, TOML, JSON lockfile, Rust, TS and TSX. One byte built
from a character code (U+000B), after a 22-byte prefix containing two
multi-byte characters where the JavaScript string is 19 units. Result:
exit 1, `(0 TOKEN, 10 CONTROL)`, **10 of 10 lines matched at the exact
predicted byte offset** — so the offset is bytes, not a UTF-16 index.
All ten restored and verified by SHA-256, not by `git status`.
`.github/workflows/ci.yml` came back at byte 9139 against my 22-byte
prefix; the file is 9117 bytes and the executor's prefix is 24, giving
their reported 9141 — their evidence is arithmetically sound.

**Suites, first-hand, exits unpiped.** parser **234/234** exit 0 ·
app **822/822** exit 0 · e2e lane **88/88** exit 0 on scratch port
14558, one worker, no skips, all five new tests listed by name ·
`tsc --noEmit` from tools/e2e exit 0 · `lint:tokens` clean · selftest
49 + 2 samples and 37 walk-policy checks green. The app suite needs
`npm run build` first — without `app/dist` twelve shipped-bundle
assertions fail loudly by design; after building, 822/822. The
executor's notes do not claim an app-suite run.

**Poison discipline, implementation side.** The notes report five
expectation-side reds; this pass mutated the IMPLEMENTATION instead,
which is the stronger direction. Nine mutations, each alone and
reverted to SHA-256 `998d98a2…e90f0e`: P5 permitting U+0000 → 2 reds;
byte offset becoming a UTF-16 index → 2 reds; CONTROL dropping docs/ →
2 reds plus a named selftest red; the scanner running the lint on
import → the side-effect test red; the scanner exiting on import (the
literal T-045-s2 hazard) → collection dies; the wrapper ceasing to lint
→ the plant test red; TOKEN dropping app/test → named selftest red;
lowercase codepoints → 2 reds. **Every new test is non-vacuous and each
pins a distinct criterion.** No matcher in the new spec is loosened:
`toBe` on exit codes and exact stdout, `toEqual` on full arrays,
`toHaveLength(7)`, `toContain` needles carrying computed offsets.

**Four suggestions filed** (`T-058-s1` through `s4`, committed on this
branch), none of them a defect against the build. s1: only 13 of the
CONTROL corpus's 18 suffix classes are pinned, so one line in
`CONTROL_BINARY_EXTENSIONS` can silently drop 109 of 521 files —
including all 44 `.rs` and all 46 `.tsx`, the two classes the architect
named. s2: a **fifth poison shape** — the selftest's assertion-set
cardinality is unpinned, so deleting an assertion deletes its own
failure; four measured deletions, including all four P1-P4 positive
samples at once, leave every gate green. s3: the superseded s5
mechanism survives verbatim at `map-tasks-lens-dom.test.tsx:579-581`,
inside the file criterion six ordered preserved — outside this card's
fence, but it is the first thing the next session reads. s4: the only
P5 positive sample is U+0000, whose hex has no letters, so CI's FIRST
gate cannot see a codepoint-format regression that the lane catches.

**Three notes for the integrator, none charged against the build.**
(a) The card is stamped `status: done` at size M, where
`method/roles/executor.md:19` allows `done` only for size S. `Verdicts`
was empty and `verified_by`/`review` blank, so it reads as a stamping
slip and not a claim that verification had happened; nothing was
merged, so main and the board were unaffected. (b) **BOOT GATE does not
fire.** Computed both ways: `71fa546..2444af0` is the 6 stated files
and `adb32c3..2444af0` adds only `docs/STATE.md` and three cards; the
trigger set `app/src/**`, `app/src-tauri/**`, `app/package.json`,
`app/src-tauri/Cargo.toml` matches **zero** paths in either
derivation. `boot:check` was therefore not run, and no `BOOT_EXIT`
exists to record. (c) The notes say graph regeneration does not
trigger; the CONVENTIONS trigger is `*.ts/*.tsx/*.js/*.jsx` outside
docs/, and `tools/e2e/tests/token-scan.spec.ts` matches it. The
conclusion is still right — `cargo run -p nputer-index -- index --check
--root ../..` reports **CURRENT** (117 files, 982 symbols, 1502 edges,
exit 0) because the indexer does not scope tools/e2e — but it is right
by a different route than the note gives.

Also verified: ADR-011 holds (the two new files import only node
builtins, `@playwright/test`, `../preflight` and the sibling scanner);
no new dependency; `tools/e2e/package.json` unchanged. Two behaviour
changes worth knowing: CONTROL's authority is now `git ls-files`, so
CI's first step needs git on PATH — with git removed it fails loudly
and named (`cannot derive tracked CONTROL corpus`) at exit 1, the right
direction; and a broken TOKEN walk now throws (exit 1) where the old
lint used `process.exit(2)`, so a gate that could not run and a tree
that is dirty share an exit code.

Status left for the integrator.
