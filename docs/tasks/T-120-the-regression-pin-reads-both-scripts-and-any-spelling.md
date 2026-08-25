---
id: T-120
title: The universal's regression pin catches one spelling in one file — a wrapped line, a lowercase "can", or the same claim in docs-gate.mjs each restores the rejected defect at a green suite
feature: F-06
milestone: 4
priority: 42
size: S
status: done
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-120
verified_by:
review: self-verified
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** Fence
> collides with `T-118`, `T-119` and `T-090`; none may run concurrently.

Absorbs (seventh triage, 2026-08-24): T-085-s3 — file removed in this
commit.

T-085's second round added a POSITIONAL pin in
`tools/e2e/tests/docs-input-gate.spec.ts` —
`the ledger's universal is gone, and what replaced it is checkable`. It
exists because the previous pin, a `toContain` on the retraction
headline, was satisfiable by the very defect it was meant to prevent,
and was: the retraction was present while `rootAnchoredFiles()`'s
comment still asserted the universal 220 lines above. **The new pin is a
real improvement and it catches the defect that actually happened. Its
REACH is narrower than the intent it is written to serve.**

## The pin, read at `6b0cf47`

    const asserted = [...scanner.matchAll(/only (?:kind of )?file that CAN read/g)];

`scanner` is `tools/e2e/scripts/docs-scan.mjs` and nothing else. The
comment above it states the intent in as many words — *"AND THE
RETRACTION HAS TO BE THE ONLY PLACE IT SURVIVES"* — while the assertion
enforces that **for one spelling in one file**.

**Five mutants, measured at branch tip `ea4a758`, each run as the full
spec with `NPUTER_E2E_PORT=14621`, baseline 36/36 exit 0** (that file
still holds 36 top-level tests at `6b0cf47`; derive it at your own ref):

| mutant | shape | result |
|---|---|---|
| A | the exact two rejected lines, restored outside the window | **35/1 exit 1 — caught** |
| B | same claim, WRAPPED so `CAN` and `read` fall on different lines | 36/36 exit 0 — **escapes** |
| C | same claim, lowercase `can read` | 36/36 exit 0 — **escapes** |
| D | same claim stated in `docs-gate.mjs` | 36/36 exit 0 — **escapes** |
| E | retraction quotation deleted (positive control) | **35/1 exit 1 — caught** |

**B is not an exotic shape, it is the LIKELY one.** `docs-scan.mjs`
wraps its comments at about 72 columns, so whether `CAN read` lands
contiguous on one line is an accident of where the wrap falls; the
original defect had it contiguous by luck. **C matters from the other
side**: the file's own corrected sentences write lowercase — at
`6b0cf47` two of them, in `rootAnchoredFiles()`'s comment and in the
ledger's own positive claim, both reading *"the only kind of file that
can name docs/ by an ABSOLUTE anchor"* — so a reintroduction written in
the file's current voice escapes.

**The tree already proves the reach is short.** `docs-scan.mjs` states
the universal in a DIFFERENT wording near the top of its "WHAT IT CANNOT
SEE" section — *"a file can only read THIS repository's docs/ if it
holds THIS repository's root"* — outside the retraction window, and the
pin does not see it. That occurrence is BENIGN (it is itself a
retraction, and correct), **which is exactly why it is good evidence**:
a real, live, differently-worded statement of the same claim, sitting
where the pin cannot reach, with the suite green.

**And the prose is truthful today.** Swept case-insensitively over
`tools/e2e/scripts/` and `tools/e2e/tests/` at `6b0cf47`, the phrase
`only (kind of )?file that can read` occurs **exactly once**, inside the
retraction's own quotation. This card is not about a live falsehood; it
is about what the pin will catch NEXT time.

## Acceptance criteria

- **THE SWEEP SHALL BE INSENSITIVE TO WRAPPING AND TO CASE.** It SHALL
  match the claim across line breaks and comment-continuation markers
  (runs of whitespace and `*` between words) and SHALL NOT require the
  uppercase `CAN`. **Mutants B and C SHALL each be re-run and shown
  caught** — they were 36/36 exit 0 before this card, and a criterion
  whose mutant does not red is not evidence.
- **THE POSITIVE CONTROL SHALL SURVIVE THE WIDENING.** The retraction
  QUOTES the sentence, and that quotation is what keeps the sweep from
  being vacuous; a widened matcher that stops matching the quotation has
  removed its own control. **Mutant E SHALL be re-run and shown caught**
  (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL).
- **THE SWEEP SHALL READ BOTH SCRIPTS, NOT ONE.** `docs-gate.mjs` is
  where one of the three corrected restatements lived and is the sibling
  the pin does not open. **Mutant D SHALL be re-run and shown caught.**
  A positional pin over one file is the shape that misses its sibling —
  and the window logic (retraction offset, positive-claim offset) is
  defined in `docs-scan.mjs` only, so the second file needs its own
  rule: **outside the retraction file, ANY occurrence is a hit.**
- **THE PIN SHALL COVER THE CONCLUSION AND NOT ONLY THE PREMISE.** The
  premise occurs once; the conclusion it warranted was restated three
  times and each needed its own clause — a sweep for "exact set of
  places" that requires a scoping word (`ROOT-ANCHORED`, `THIS CLASS`)
  nearby would have caught all three mechanically instead of by reading.
  IF the executor judges the conclusion sweep too noisy against the live
  tree THEN it SHALL say so with the hit list it measured, rather than
  omitting the arm in silence.
- **THE SPEC'S PROSE AND ITS ASSERTION SHALL AGREE.** Either the
  assertion reaches "the ONLY place it survives" or the comment SHALL
  narrow to what is enforced. **A comment claiming more than its
  assertion is the T-070-s5 shape, in the card that exists because a
  stale claim shipped.**
- IF the widened sweep matches something benign already in the tree THEN
  the fix is the SWEEP's scoping, never a rewrite of prose that is
  already correct — and the benign occurrence SHALL be named in the spec
  so the next reader knows it was seen and kept.
- **NO ARM OF THE GATE'S BEHAVIOUR MOVES.** `docs-scan.mjs`'s two-arm
  reader derivation, `rootAnchoredFiles()`, `packageRelativeSites()` and
  the `--census` output are untouched by this card; it changes one
  regression pin.

Verification: headless — `npm test`, `npm run typecheck` and
`npm run lint:tokens` (plus `-- --selftest`) from tools/e2e/, exits read
unpiped from `$?` and stated; workers 1, retries 0, no skips. **POISON
DRILL on the changed assertion, one side only**: mutants A-E re-run as a
family at the lane's own ref, each mutated text read back with
`git diff` before its run, restores per-path proved by sha256 at the
drill's own commit, and the drill performed in a detached scratch
worktree — **these mutants edit a file the live gate reads, so mutating
in place would make every concurrent reader see a false claim.** Then
the shape-six check: does any other body already assert this. The DOCS
GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.

## Implementation notes

Built by `claude-opus-5 @T-120` on branch `task/T-120-regression-pin`,
base `c4cfe52`, in worktree
`/Users/ujju/Projects/nputer/tools/nputer-T-120` — **which is INSIDE the
repository and should not be** (`method/lane-protocol.md` rule 3 asks
for a sibling directory). The dispatcher cut it with a relative path
from `tools/e2e/`, owns the error and is recording it; it is named here
because the record should say where the work actually happened.

**ONE FILE CHANGED: `tools/e2e/tests/docs-input-gate.spec.ts`.** No arm
of the gate's behaviour moved — `docs-scan.mjs` and `docs-gate.mjs` are
byte-identical to `c4cfe52` (sha256
`fa08642e…` and `489f0d9b…`, proved again after every drill mutation).

### THE CARD'S OWN FIGURES, RE-DERIVED

| figure | card says | measured here | at |
|---|---|---|---|
| top-level tests in the spec | 36 | **36** | `6b0cf47` |
| the same | — | **41** | `c4cfe52`, this lane's base |
| the same, after this card | — | **42** | tip |
| `only (kind of )?file that can read`, case-insensitive, in `scripts/` + `tests/` | exactly once | **exactly once**, `docs-scan.mjs:2115`, inside the retraction | `c4cfe52` |
| the conclusion "restated three times" | three | **TWO** — `docs-scan.mjs:1884` and `:2133`; **zero** in `docs-gate.mjs` | `6b0cf47` AND `c4cfe52` |

**The "three restatements" figure does not reproduce for the phrase the
criterion names.** `exact set of places` occurs twice, at both refs, both
in `docs-scan.mjs`. The arm was built anyway, against the hit list
measured rather than against the card's count — which is what the
criterion asked for in the branch where the executor disagrees.

### CRITERION BY CRITERION

1. **WRAPPING AND CASE — MET.** `GAP = "[\\s*]+"` between every word plus
   the `i` flag. It matches runs of whitespace and comment-continuation
   `*` and nothing else, so it cannot leap a word, a `/` or a quote:
   measured on this tree it matches **exactly** what the narrow pin
   matched, one occurrence at offset 92213, and nothing more. **Mutants
   B (wrapped) and C (lowercase) were 36/36 exit 0 before this card and
   are 41/1 exit 1 after it.**
2. **THE POSITIVE CONTROL SURVIVED — MET, AND CHECKED THE HARD WAY.**
   The widened matcher still matches the retraction's quotation
   (`asserted.length > 0`), and **mutant E deletes that quotation and
   reds on that exact assertion** — `Error: the retraction quotes the
   sentence, so this sweep can match / Expected: > 0`. The widening did
   not remove its own control.
3. **BOTH SCRIPTS — MET.** `UNIVERSAL_SIBLING_FILES` holds
   `docs-gate.mjs`, and outside the retraction file ANY occurrence is a
   hit, because the window (retraction offset, positive-claim offset) is
   defined in `docs-scan.mjs` and nowhere else. **Mutant D reds naming
   the file and the offset**: `tools/e2e/scripts/docs-gate.mjs holds no
   retraction window … Received [3102]`.
4. **THE CONCLUSION — BUILT, NOT ARGUED AWAY, WITH ITS HIT LIST.** A new
   body, *"the conclusion the universal warranted is scoped wherever it
   is restated"*: every `exact set of places` in either script must carry
   `ROOT-ANCHORED` or `THIS CLASS` within 80 characters of the match end.
   **Measured before it was written: 2 occurrences, both scoped — at
   `+8` (`ROOT-ANCHORED`) and `+4` (`THIS CLASS`) — and 0 in
   `docs-gate.mjs`. ZERO unscoped hits, so there was no noise to trade
   against.** Mutants F and G remove one scoping word each and the body
   reds naming the exact site (`docs-scan.mjs:1884`, then
   `docs-scan.mjs:2133`).
5. **PROSE AND ASSERTION AGREE — MET BY NARROWING.** The comment no
   longer says "the ONLY place IT survives"; it says **"the only place
   THIS WORDING survives, in either script"**, and a closing paragraph
   states what the pin does *not* reach.
6. **THE BENIGN OCCURRENCE — NAMED, AND PINNED.** The widened sweep does
   NOT match `docs-scan.mjs:128`'s different wording (*"a file can only
   read THIS repository's docs/ if it holds THIS repository's root"*), so
   no scoping was needed. It is asserted anyway — present, and OUTSIDE
   the window — so that "seen and kept" cannot rot into "missed", and so
   nobody rewrites correct prose to satisfy a sweep. **Mutant H rewords
   it and the body reds**, which is what makes that paragraph evidence
   rather than decoration.
7. **NO ARM OF THE GATE MOVES — MET.** Both scripts are untouched; the
   two-arm reader derivation, `rootAnchoredFiles()`,
   `packageRelativeSites()` and `--census` are all unchanged, and
   `--census` prints the same 12 readers / 4 suites / 129 sites it did
   before.

### THE POISON DRILL — NINE MUTANTS, NINE REDS, ZERO SURVIVALS

Detached scratch worktree **`drill-T-120`** at
`/Users/ujju/Projects/drill-T-120`, commit **`0c4fba4`**; driver
`drill-T-120.sh`, helper `drill-T-120-mutate.mjs`, per-mutant logs
`drill-T-120-run-<id>.log`. **ONE SIDE ONLY: every mutation edits a
PRODUCER — `docs-scan.mjs` or `docs-gate.mjs` — never the spec's
assertion and never a literal the two share.** Each mutation was read
back with `git diff -U1` BEFORE its run. Baseline unmutated: **42
passed, exit 0**, port 15151.

| # | what was mutated (producer only) | before this card | after |
|---|---|---|---|
| A | the exact two rejected lines, outside the window | 35/1 exit 1 | **41/1 exit 1** |
| B | the same claim WRAPPED across a line break | 36/36 exit 0 | **41/1 exit 1** |
| C | the same claim in lowercase | 36/36 exit 0 | **41/1 exit 1** |
| D | the same claim stated in `docs-gate.mjs` | 36/36 exit 0 | **41/1 exit 1** |
| E | the retraction's QUOTATION deleted (positive control) | 35/1 exit 1 | **41/1 exit 1** |
| F | `ROOT-ANCHORED` removed from the first restatement | — | **41/1 exit 1** |
| G | `THIS CLASS` removed from the second restatement | — | **41/1 exit 1** |
| H | the benign differently-worded retraction reworded | — | **41/1 exit 1** |
| I | BOTH restatements reworded (the arm's own control) | — | **41/1 exit 1** |

**Every run failed exactly ONE body, and the message named the site** —
an offset for A-C, a file and offset for D, the control's own sentence
for E and I, a `file:line` for F and G.

**RESTORATION PROVED PER PATH BY SHA256 AT THE DRILL'S OWN COMMIT:
18 of 18 OK, 0 mismatches** (nine mutants x two paths), against
`git show 0c4fba4:<path> | shasum -a 256`. The drill worktree is clean.

**THE SHAPE-SIX CHECK — asked, and answered NO.** No other body asserts
this. Two bodies read `docs-gate.mjs`'s source (`ONE SPELLING, TWO
PLACES` and `THE EXIT OBJECT IS THE SINGLE AUTHORITY`) and neither looks
at the universal. A sweep for the same defect shape elsewhere —
case-sensitive contiguous matchers over one file's prose — found only
assertions on a program's printed OUTPUT, which is a contract rather
than a comment. **The new body is not a duplicate of anything.**

### GATES, DERIVED AT THIS LANE'S OWN REF

`TREE=$(git merge-tree --write-tree c4cfe52 HEAD)` -> exit **0**, tree
`a7e2e7d…`; `git diff --name-only c4cfe52 "$TREE"` -> **4 paths**.

- **GRAPH REGEN — FIRES on 1 of 4** (the `.ts` spec) **and was ASKED,
  not predicted.** `cargo run -p nputer-index -- index --check --root
  ../..` from `app/src-tauri` is exit **0, CURRENT** at **895 891 bytes
  / 172 files / 1889 symbols / 1849 edges** — unmoved. `tools/` is
  `.nputerignore`d, so a diff confined there cannot move the graph by
  construction; that is the answer the gate gave, not one it was spared.
  **NO REGEN OWED.**
- **BOOT GATE — NOT OWED, 0 of 4.** This fence cannot produce
  `app/src-tauri/**`, `app/src/**` or a manifest.
- **DOCS GATE — FIRES, exit 1**, invoked directly with root-relative
  arguments, never through `xargs`. **2 of 4 under `docs/`** (the two
  suggestion files; the card itself joins at the notes commit), **three
  suites owed**: `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/`. **`cargo test from app/src-tauri/`
  is NOT owed** — its readers are `docs/CONVENTIONS.md`,
  `docs/architecture/components` and a research capture, none of them in
  this diff. New files were `git add`ed before the gate ran (T-010-s10:
  it reads TRACKED files only). 12 derived readers across 4 suites, **0
  frontmatter issues**.

### SUITES — every exit off its own unpiped `$?`

- **tools/e2e: 146/146, exit 0** on scratch port 15150 (145 + this
  card's one new body). `npm run typecheck` **0**. `npm run lint:tokens
  -- --selftest` **0** (65 TOKEN + 4 CONTROL samples, 87 walk-policy, 9
  evidence-floor checks); `npm run lint:tokens` **0**, clean at **TOKEN
  131 / CONTROL 657 before this card's doc writes and CONTROL 660 after
  them** — the three suggestion files joining the tracked corpus, which
  is the whole of the delta and is why the figure is stated twice rather
  than once. `npm run lint:docs` **0**.
- **EVERY SUITE RAN TWICE: at the code change, and again AFTER the doc
  writes were staged.** Both passes are the numbers above.
- **app: 958/958 across 46 files, exit 0**, after `npm run build` exit 0.
- **parser: 264/264 across 12 files, exit 0**.

**THE FIRST `npm test` FROM tools/e2e WAS 145/1 AT EXIT 1, AND IT WAS
NOT THIS CARD'S.** `token-scan.spec.ts:201` (T-079's body) failed its
mtime-restore assertion on a file this diff never touches; the identical
second run was **146/146 exit 0** with no edit in between, because the
failing restore had itself repaired the condition. Characterised,
measured and routed as **`T-120-s3`** rather than re-run away. **Both
numbers are reported, because a single green would be the less true of
the two.**

### WHAT WAS ROUTED

- **`T-120-s1`** — the pre-write exclusivity check (`git status
  --short`) cannot tell a parked worktree from an integrator
  mid-ceremony; four `??` lines at `c4cfe52`, none of them a ceremony.
  Also refutes, by `git add -A --dry-run`, the claim that a broad add
  would stage thousands of files: git does not recurse into a nested
  repository, so it would stage **three gitlinks**, loudly. Fence:
  `docs/CONVENTIONS.md` / `method/`.
- **`T-120-s2`** — 92 e2e test bodies across 5 spec files open no
  browser, and running any of them in a scratch worktree still costs
  three npm installs (330M), a parser build and a vite boot, because
  `assertLanePreconditions` throws at config load. Every POISON DRILL on
  that spec family pays it. Fence: `[tools/e2e]`, out of this card.
- **`T-120-s3`** — the mtime-restore assertion above: `Stats.mtime` is a
  `Date`, so the restore rounds to whole milliseconds while the
  assertion compares an unrounded float. **50/50 fresh writes on this
  filesystem carry a sub-millisecond mtime**; `utimesSync(mtimeMs/1000)`
  round-trips exactly. Red once per fresh checkout, then green forever.
  Fence: `[tools/e2e]`, out of this card.
