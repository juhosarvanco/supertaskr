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
verifier:
built_by: codex/gpt-5.6 @fresh
verified_by:
review:
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
