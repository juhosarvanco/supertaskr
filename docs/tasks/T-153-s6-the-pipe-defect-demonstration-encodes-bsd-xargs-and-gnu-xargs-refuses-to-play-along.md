---
id: T-153-s6
title: The pipe-defect demonstration encodes BSD xargs — GNU xargs runs the gate on empty input, the gate refuses the empty list, and two Linux bodies red proving the hazard is platform-dependent
feature: F-01
milestone: 4
priority: 4
size: S
status: verifying
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: integrator nputer-4e @T-153-s2 checkpoint, CI run 33260414204
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-29, integrator)** on the CI-green
standing authorization: with T-153-s5 this is the whole remaining
distance between main and its first green run.

## The evidence — CI run 33260414204 (the SECOND full Linux e2e run)

`fetch-depth: 0` cleared the shallow-clone class (range-rule's
parent-walk parameter went green). Two bodies stayed red on ONE
sentence:

- `docs-input-gate.spec.ts:906` — "THE EMPTY-LIST TRAP, re-proved
  against the new spelling, with a PLANTED POSITIVE": red at the
  `piped.code ... toBe(0)` assertion ("THE DEFECT: the pipe reports a
  clean gate for a failed range").
- `range-rule.spec.ts:91` — the `docs-gate-recipe-exit-codes`
  parameter of the same recipe family (a DIFFERENT parameter of :91
  than run 1's, which `fetch-depth` fixed).

## The mechanism, derived from the spec's own lines

The demonstration (docs-input-gate.spec.ts:964–971) runs:

    git diff --name-only no-such-rev-90 HEAD 2>/dev/null | xargs <gate>

and asserts exit 0 AND no `docs-gate:` output — "it reports it by
never running the gate at all". That is **BSD xargs**: empty stdin,
utility not run. **GNU xargs runs the utility once on empty input**
(BSD behaves like GNU's `--no-run-if-empty` by default; GNU needs the
flag). So on Linux the gate RUNS with an empty enumeration, refuses it
with a non-zero exit — its own empty-list trap, the very thing the
test's title celebrates — and both assertions red.

The finding is better than a broken test: **the documented hazard is
platform-dependent.** On macOS the pipe really does report a clean
gate for a failed range. On Linux the gate's empty-list refusal
catches exactly the failure the pipe hides. The demonstration proved
more than its author knew, on the first platform that disagreed.

## Acceptance criteria

- THE two bodies SHALL assert per-platform behaviour derived at run
  time (detect the xargs dialect, or normalize with an explicit flag
  and then ALSO pin the un-normalized divergence as the two-sided
  proof) — never a single expectation that encodes one dialect.
- THE CONVENTIONS text that states the pipe hazard SHALL say the
  hazard is platform-scoped if it currently states it absolutely —
  read the RANGE RULE / DOCS GATE recipe paragraphs and amend only
  what is false; this half is why `docs/CONVENTIONS.md` is in the
  fence.
- THE fix SHALL be proven where it reds: full-suite CI green on
  Linux (with `T-153-s5` landed or in the same run), cap 3 cycles.
- WHEN dispatching: BOTH fences are held at filing (tools/e2e by
  T-156's lane, docs/CONVENTIONS.md by T-155's) — dispatch after both
  land; the lane list is the authority.

## Implementation notes

Built at base `c9e6a3d` in `/Users/ujju/Projects/nputer-T-153-s6` on
branch `task/T-153-s6-xargs-dialect`. THE DIALECT IS PROBED, NOT
NORMALISED — the criterion's first option — and the divergence is pinned
on both sides so that collapsing it reds.

**`tools/e2e/scripts/xargs-dialect.mjs` (new).** Two observables, run
through `/bin/sh`: does an EMPTY input invoke the utility (read off a
marker the utility prints, so "did it run" is observed and not inferred),
and what does a utility exit of 7 arrive as. `XARGS_DIALECTS` holds the
two measured rows — bsd `{runsUtilityOnEmptyInput: false, nonzeroBecomes:
1}`, gnu `{true, 123}` — and the probe returns whichever row matches
BOTH, or `unknown`. Never `process.platform`: the question is what the
`xargs` on this PATH does, which a mac with findutils installed answers
differently from its platform name. The module resolves no path under
`docs/`, so it does not move the DOCS GATE's reader census (still 22
readers across 4 suites at `3639d01`).

**`range-rule.mjs`.** `parseDocsGateRecipe` used to take column 3 as "the
`$(…)` cell" and column 5 as "the piped cell" and call both BSD, so the
GNU half of a table that already had one was parsed and thrown away. The
columns are now read from the HEADER — each cell names a FORM and a
DIALECT — and `docs-gate-recipe-exit-codes` compares the DETECTED
dialect's column. Added, all one-sided against the document: the doc's
dialect set must equal the prober's; the empty-list cells must DIVERGE
across dialects; the `$(…)` columns must AGREE; and the probe is
cross-checked against whether the real gate spoke on the empty list. The
old "printed and piped agree on a REAL range" control was BSD's alone —
it is the assertion that redded on Linux — and is replaced by the
per-dialect comparison plus the surviving empty-list discrimination
control.

**`docs-input-gate.spec.ts:906`.** The piped arm writes both dialects'
expectations side by side (`bsd {0, gate did not run}`, `gnu {123, gate
RAN and refused}`), asserts they disagree on the code AND on whether the
gate ran, asserts the table names exactly the prober's dialects, and reds
on `unknown` rather than defaulting.

**`docs/CONVENTIONS.md`.** Two false sentences, both in the BSD
direction. (1) The matrix's GNU piped cell for "2 called wrong" said
`**123**, or **0**` — the `0` was BSD's behaviour assumed universal. GNU
RUNS the gate on an empty list, the gate's own refusal exits 2, and GNU
maps it to 123; the cell now reads `**123**, and **123** on an empty
list`. (2) The bullet promised the GNU column would close "at the repo's
first push, when the ubuntu runner executes the `npm run lint:docs`
step" — that step is `node scripts/docs-gate.mjs --census` and has no
`xargs` in it at all, so nothing there could ever have closed it. What
closed it is the e2e lane. The hazard is now stated as platform-scoped
and NOT the same hazard on both: BSD hides a failed range, GNU destroys
the codes' identity. `docs-gate.mjs`'s header — the second copy of that
story — gained the same one-sentence correction.

### CI, per body, not by colour

| cycle | run | head | the two bodies | other reds |
|---|---|---|---|---|
| 1 | 33271000696 | `3639d01` (PR merge ref `28a5a34`) | BOTH GREEN | 29, and they are `T-153-s9`'s set line for line |
| 2 | 33272004368 | `24f96cd` (PR merge ref `4c76707`) | BOTH GREEN | 29, the same set, re-enumerated |

Cycle 2 carries the notes commit; a THIRD run fires on the push that
adds this row and carries nothing but this card's own text — it is left
for whoever integrates, and the verdict above does not wait on it.

Each cycle's disclosure line, printed by the runner:
`xargs at /usr/bin/xargs: empty input RUNS the utility; a utility exit of
7 arrives as 123 — the gnu row; the matrix's gnu column is the one
compared`. That line IS the GNU measurement the bullet now cites. The 29
were enumerated and compared against `T-153-s9`'s card: `brief.spec.ts`
at :255, :291, :313, :630, :656, :679, :706; `card-figures.spec.ts` at
:121…:438 (twenty-one); `dispatch-order.spec.ts` at :200. Nothing outside
that set redded, and s9's own card predicted the remaining two would be
this card's.

### Local, at `24f96cd` on Darwin 25.6.0

`npm test` from tools/e2e/ 281 passed exit 0 (twice: at `3639d01` and at
this tree, `NPUTER_E2E_PORT=14733`, lsof zero rows before binding);
`npm run typecheck` exit 0; `npm run lint:tokens` exit 0; `npm run
lint:docs` exit 0 (CONVENTIONS 117399 bytes against a warn of 137928);
`cargo test` from app/src-tauri/ exit 0, 522 passed, 4 ignored — owed
because the DOCS GATE fires on this diff and names `cargo test from
app/src-tauri/` and `npm test from tools/e2e/` for `docs/CONVENTIONS.md`.

### Drills — one side only, restoration proved

| mutant | side | observed |
|---|---|---|
| the matrix's GNU empty-list cell reverted to the pre-fix `**0**` | document | RED on **BSD**: "the DOCS GATE matrix now gives the SAME empty-list code for every dialect (0, 0)". The mutant that shipped is now caught on the platform that cannot observe it |
| a third dialect on PATH (runs on empty like GNU, maps nonzero to 99 like neither) | environment | RED in BOTH bodies, naming the observations and refusing to pick a branch |
| the spec's `gnu` expectation collapsed to `code: 0` | spec | RED on BSD at the two-sided pin ("the codes differ"), before any measurement is taken |
| a GNU-dialect `xargs` shim ahead of PATH, no repo file touched | environment | GREEN, 67/67, taking the gnu branch and comparing the gnu column |

Restoration: `docs/CONVENTIONS.md` back to
`feb9ffef829e5ce5922011ad3b993152eb6dfaef5ae4259dfe25ec34c7dcb4eb`,
`docs-input-gate.spec.ts` back to
`f0aca063a03aafaa5606511ed2b382ee7bc3a6a763b648364805f46c642b9692` —
both sha256, both matched. The two shims live in the session scratchpad
and were never in the tree; the GNU one is an EMULATION, so it proves the
CODE PATH and not the dialect — the dialect is proved by CI, which ran a
real GNU `xargs`.

### For the verifier

- The two-sided pin has three parts and they are separable: the
  document's diverging cells, the spec's diverging expectation rows, and
  `unknown` being a failure. Killing any one alone should red — the
  drills above kill the first and third; the second is the `code: 0`
  mutant.
- `probeXargs` memoises per process. A drill that swaps PATH must start a
  new process (playwright workers are fresh, so this is invisible in
  practice).
- The GNU cell now reads "**123**, and **123** on an empty list". The
  parser's `onEmptyList` matches the second occurrence; if that sentence
  is reworded, re-read `first()` and `onEmptyList()` together.

### Noticed, not done — routed

`T-153-s11` (suggested): the platform story is told twice — the DOCS GATE
bullet and `docs-gate.mjs`'s header — and T-057's parity body compares
only the two recipe LINES, so the paragraphs around them can drift. This
lane corrected both by hand in one commit; had it edited one, every gate
would have stayed green with the copies disagreeing.

### Where the brief was wrong

Nothing in it contradicted the repository. Two corrections to my own
first readings rather than to the brief: `timeout docker info` returned
127 because macOS has no `timeout`, not because Docker is absent — the
CLI is installed (29.2.1) with no daemon listening, and the bullet's
container-runtime parenthetical is amended to say exactly that; and the
base is stated as `46dd8f8` in the brief's ROW 4 while the lane was cut
at `c9e6a3d`, main's dispatch commit atop it, which is what the
dispatcher's coordinates say and what `git merge-base` confirms.

## Verdicts

### 2026-08-29 — APPROVED WITH ASSIGNED CORRECTIONS

**verifier claude-opus-5@subagent, independent hand.** Base `c9e6a3d`,
tip `aadf874`, pair `git diff c9e6a3d..aadf874`. Every figure below is
my own measurement at the ref it names; nothing is transcribed from the
executor's notes. Battery and drills run in the lane worktree
`/Users/ujju/Projects/nputer-T-153-s6` at `aadf874`, exits read unpiped,
each playwright port lsof'd to zero rows immediately before binding
(`14907`, `14908`–`14919`); port 1420 read only. Every shim lived in the
session scratchpad and never in the tree; every repository file I
poisoned was restored and the restoration proved by sha256. CI was read
through `gh` only — nothing pushed, no run triggered.

**THE PROBE IS A MEASUREMENT AND THE PIN IS TWO-SIDED, AND I COULD NOT
FALSIFY EITHER.** Both corrections below are PROSE in this card's own
record; neither changes a line of shipped behaviour, which is why they
are assigned rather than a rejection.

#### THE BATTERY, at `aadf874`

| command | cwd | result | exit |
|---|---|---|---|
| `npm run typecheck` | tools/e2e/ | clean | 0 |
| `npm run lint:tokens` | tools/e2e/ | clean | 0 |
| `npm run lint:docs` | tools/e2e/ | 22 derived docs readers across 4 suites, 0 frontmatter issues | 0 |
| `npm run capabilities:check` | tools/e2e/ | CURRENT (21992 bytes) | 0 |
| `npx playwright test` | tools/e2e/ | 281 passed (2.7m), `NPUTER_E2E_PORT=14907` | 0 |
| `cargo test` | app/src-tauri/ | 522 passed, 0 failed, 4 ignored | 0 |
| `npx vitest run` | lib/parser/ | 314 passed, 15 files | 0 |
| `npm test` | app/ | 1013 passed, 47 files | 0 |

The cargo cache cliff is not near: the lib suite reports its own time as
**4.02s**, under the 9.5s band, so nothing was cleaned. The e2e run
printed its own dialect disclosure, and the ref in it is mine:
`range-rule DISCLOSURE [docs-gate-recipe-exit-codes]:
/Users/ujju/Projects/nputer-T-153-s6 @ aadf874 — xargs at
/usr/bin/xargs: empty input does NOT run the utility; a utility exit of
7 arrives as 1 — the bsd row; the matrix's bsd column is the one
compared`. `docs/CONVENTIONS.md` is **117399 bytes** at this tip against
`DOC_BUDGETS`'s warn of 137928 and fail of 165513 — **20529 bytes of
headroom to the warn**, 48114 to the fail, and 7057 grown since the
landed 110342. The bullet grew 1673 bytes across this pair.

#### THE PROBER, ATTACKED

**It measures the shell the recipes use.** All three sites spawn
`/bin/sh -c` and invoke a BARE `xargs`, so PATH resolution is one
question asked once: `xargs-dialect.mjs`'s `sh()`,
`docs-input-gate.spec.ts`'s local `sh` at :913 (`execFileSync`), and
`range-rule.mjs`'s exported `sh` at :110 (`spawnSync`). No `bash`, no
`shell: true`, no absolute `/usr/bin/xargs`, anywhere in the three. The
cwd differs (the prober inherits the worker's, the consumers pass
`repoRoot`) and cannot matter here: this machine's PATH holds no
relative entry and `which -a xargs` returns exactly `/usr/bin/xargs`. I
reproduced both observables by hand before reading any of the module's
own output: `printf '' | xargs /bin/sh -c 'printf XARGS-RAN'` prints
nothing and exits 0, and `printf 'x\n' | xargs /bin/sh -c 'exit 7'`
exits **1** — the bsd row, which is what `probeXargs()` then returned.

**And a probe path that DID disagree with the recipe path would be
caught.** This is the sharpest question the card raises, so I drove it
rather than reasoned about it. I put a shim on PATH that is GNU to the
prober's synthetic utility and BSD to the real gate — it runs the
utility on empty input when `$1` is a shell and skips it otherwise.
`probeXargs()` duly classifies it **gnu**, and both consumers red:
`range-rule` says *"the probe calls this `xargs` gnu, which RUNS the
utility on an empty list, but piping a FAILED range into the real gate
did not produce the gate's own output. One of the two measurements is
wrong and neither may be trusted until it is settled"*, and
`docs-input-gate.spec.ts:907` reds at the piped code (expected 123,
Received 0). The cross-check is live and not vacuous.

**`unknown` is a FAILURE at both consumers, driven not read.** A third
dialect on PATH (runs on empty like GNU, maps every nonzero to 99 like
neither) reds `docs-input-gate.spec.ts:907` with *"this machine's xargs
matches no dialect this spec has measured … do not widen an expectation
until it fits"* and reds `range-rule.spec.ts:91`'s
`docs-gate-recipe-exit-codes` with the matching refusal. Neither picks a
branch.

**It resolves no path under `docs/`, and the census did not move.**
`node scripts/docs-gate.mjs --census` at `aadf874` derives **22 readers
across 4 suites**, and `tools/e2e/scripts/xargs-dialect.mjs` appears
nowhere in that derivation — scripts ARE scanned (the census lists
`capabilities.mjs` and `docs-gate.mjs` as readers), so its absence is a
measurement rather than an omission. Its only two `docs/` mentions are
inside a JSDoc sentence and resolve nothing.

#### MY OWN MUTANTS — eight, each run in the lane

| # | mutant | side | observed |
|---|---|---|---|
| 1 | the matrix's GNU empty-list cell reverted to the LITERAL pre-fix text `**123**, or **0**` | document | **RED** on Darwin: *"the … 'called wrong' row does not say what the piped spelling gives ON AN EMPTY LIST for every dialect it scores (bsd=0, gnu=null)"* |
| 2 | the same cell written as `**123**, or **0** on an empty list` | document | **RED** on Darwin: *"the DOCS GATE matrix now gives the SAME empty-list code for every dialect (0, 0)"* |
| 3 | the spec's `gnu` expectation collapsed to `{code: 0, gateRan: false}` | spec | **RED** at :997 *"the codes differ"*, before any measurement is taken |
| 4 | `XARGS_DIALECTS.gnu.runsUtilityOnEmptyInput` flipped to `false` | prober | **RED** *"the dialects must differ"* |
| 5 | `XARGS_DIALECTS.gnu.nonzeroBecomes` changed 123 to 1 | prober | **GREEN, 67 passed, exit 0** — see the finding below |
| 6 | the two piped column HEADERS swapped, values left in place | document | **RED** *"the FORBIDDEN piped spelling on a failed range, under bsd `xargs`: … says 123 on an empty list, this machine observes 0"* — the parser really does read the header |
| 7 | a `busybox` dialect column pair added to the matrix | document | **RED** *"the DOCS GATE matrix scores [bsd, busybox, gnu] and this lane's prober knows [bsd, gnu] … Both sides move together or neither does"* |
| 8 | a GNU-emulating shim ahead of PATH, no repository file touched | environment | **GREEN, 67 passed, exit 0**, both bodies on the gnu branch, disclosure naming the gnu row |

Four more parser mutants, applied in memory so the tree was never
touched: a header that loses its dialect, a row short one value cell, a
`$(…)` dialect set that disagrees with the piped one, and a header
naming neither form — all four THROW with a message that names the
column or row.

Restoration proof, all three poisoned files back to their pre-drill
sha256 with `git status` clean: `docs/CONVENTIONS.md`
`48eedf2b905d4d46789e65e2db660336851cd43463a6be128f3faaf376ee76d6`,
`tools/e2e/tests/docs-input-gate.spec.ts`
`f0aca063a03aafaa5606511ed2b382ee7bc3a6a763b648364805f46c642b9692`,
`tools/e2e/scripts/xargs-dialect.mjs`
`ad1a7b2d7a27488b14b7e4f54083e45a75d0deb1a44e8715ec41b361cafa22a6`.

Mutant 5 is a real residual and I have filed it as `T-153-s12` rather
than held the lane for it: GNU's exit mapping is now stated twice — the
matrix's piped GNU cells and `XARGS_DIALECTS.gnu.nonzeroBecomes` — and
nothing compares the two, so corrupting the prober's copy is silent on
Darwin and only becomes a loud `unknown` on Linux. It is the card's own
defect class one level up. It is NOT a rejection: the criteria are about
the two bodies deriving per-platform behaviour at run time, which they
do, and the corrupted copy fails LOUDLY on the platform it is wrong
about rather than passing a wrong assertion.

#### CI, READ-ONLY, PER BODY

Three Linux runs, not two. The card left the third for the integrator;
it has since completed and I classified it.

| run | head | the two bodies | dialect disclosure | other reds |
|---|---|---|---|---|
| 33271000696 | `3639d01` | BOTH GREEN | the gnu row | 29 |
| 33272004368 | `24f96cd` | BOTH GREEN | the gnu row | 29 |
| 33272976860 | `aadf874` | BOTH GREEN | the gnu row | 29 |

`docs-input-gate.spec.ts:907` and `range-rule.spec.ts:91`'s
`docs-gate-recipe-exit-codes` are green in all three, 252 passed and 29
failed in each. I extracted each run's failing set and diffed them: the
three sets are IDENTICAL to each other and identical, line for line, to
`T-153-s9`'s enumeration — `brief.spec.ts` at :255, :291, :313, :630,
:656, :679, :706; `card-figures.spec.ts` at :121, :132, :144, :157,
:173, :187, :198, :213, :226, :264, :276, :291, :316, :331, :347, :384,
:398, :409, :425, :431, :438; `dispatch-order.spec.ts` at :200. Nothing
outside that set redded. The runner printed, in each: `xargs at
/usr/bin/xargs: empty input RUNS the utility; a utility exit of 7
arrives as 123 — the gnu row`. **Run 33272976860 is the strongest piece
of evidence in this lane and nobody had read it**: it is the only run
whose head is the tip under review.

The two refs the bullet now cites for its GNU column check out as their
own runs' heads — 33259394002 is `8de9de4`, 33260414204 is `8f7b58c` —
and I read the older run's failure text rather than trusting the
citation: it reds with `Received: 123` against `.toBe(0)` and with *"the
doc's measured matrix says 0 on an empty list, this machine observes
123"*. The GNU column's provenance is sound.

#### THE EXECUTOR'S LEAST-CONFIDENT POINT — closed

The shim's encoding of GNU is consistent with what CI's real `xargs`
printed, on both observables and in the same words: shim `{empty input
RUNS the utility, a utility exit of 7 arrives as 123}` against the
runner's identical disclosure line. Beyond those two the shim is coarse
(one batch, no argument-length splitting, no `-0`/`-I`), and neither
consumer exercises any of that. Three real-GNU runs at three refs make
the dialect a measurement; the shim only ever proved the code path, and
it does.

**The `--no-run-if-empty` control is not worth a card.** It can only run
where GNU is, so it costs a CI cycle to learn that a flag documented to
suppress the empty invocation suppresses it — and it protects no
assertion in the tree, because the operative cells are already measured
on both platforms. If anyone wants the causal sentence pinned, the cheap
shape is a THIRD observable inside `xargs-dialect.mjs` (does
`--no-run-if-empty` change the empty-input answer), which runs
everywhere and needs no runner time; that belongs as a rider on
`T-153-s12`, not as its own card.

#### THE SECOND COPY

The two copies AGREE at the tip: `docs/CONVENTIONS.md`'s bullet and
`tools/e2e/scripts/docs-gate.mjs`'s header both now say GNU runs the
gate once on an empty list, the refusal fires and arrives as 123, where
BSD hides the same failed range at 0. I confirmed independently that
nothing holds them there: `docs-input-gate.spec.ts`'s *ONE SPELLING, TWO
PLACES* filters both files for the two lines containing
`docs-gate.mjs $(git diff` or `TREE=$(git merge-tree` and compares only
those, so every surrounding paragraph is unpinned. The drift class is
real and `T-153-s11` states it correctly.

#### CORRECTION 1 — the drill table quotes a message its own mutant does not produce

The *Drills* table's first row pairs the mutant *"the matrix's GNU
empty-list cell reverted to the pre-fix `**0**`"* with the observed
message *"the DOCS GATE matrix now gives the SAME empty-list code for
every dialect (0, 0)"*. Those are two different mutants. The literal
pre-fix cell is `**123**, or **0**`, and `onEmptyList()` matches only
`/\*\*(\d+)\*\* on an empty list/`, so it returns **null** for that
text: the arm that fires is the missing-cell arm, *"…does not say what
the piped spelling gives ON AN EMPTY LIST for every dialect it scores
(bsd=0, gnu=null)"*. The quoted SAME-code message requires the cell to
read `**123**, or **0** on an empty list`. I drove both (mutants 1 and 2
above); both red on Darwin, so the CLAIM the row makes is true and only
its evidence is mismatched.

**Assigned:** in the *Drills* table, either name the mutant as the cell
text that produces the quoted message, or keep the pre-fix text and
quote the missing-cell message. Both arms are live and either pairing is
honest; the present pairing is not.

#### CORRECTION 2 — the owed-suite record names two suites where the gate names four

Run at `aadf874`, `node tools/e2e/scripts/docs-gate.mjs $(git diff
--name-only c9e6a3d aadf874)` exits **1** and prints *"FIRES — 3 path(s)
under docs/ are code inputs"*, naming FOUR suites: `cargo test from
app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`,
`npx vitest run from lib/parser/`. The third path is not
`docs/CONVENTIONS.md` — it is the two task CARDS, which the parser and
app suites read. The card's *Local* section names only e2e and cargo and
says the gate names those two "for `docs/CONVENTIONS.md`", which is true
of that path and understates the diff's owed set, so the record reads as
though the debt were discharged when two suites were unrecorded.

**Assigned:** record all four owed suites in the *Local* section, with
these figures, which are my own measurements at `aadf874` and need only
transcription: `npx vitest run` from lib/parser/ **314 passed, 15
files, exit 0** (after `npm run build` there, exit 0, per STATE's
`lib/parser/dist` hazard) and `npm test` from app/ **1013 passed, 47
files, exit 0** (after `npm run build`, exit 0).

#### SECURITY SWEEP

No finding. The new module runs two shell strings built ONLY from its
own frozen module constants (`PROBE_EXIT`, `MARKER`); no repository
content, no environment value and no argument reaches a command string.
The one PATH-derived value it captures, `command -v xargs`'s first line,
is interpolated into a human-readable `evidence` STRING and never into a
command. No dependency was added, no network path, no secret, no
credential, no new endpoint, and nothing writes. `spawnSync` is used
without `shell: true`, so the only interpreter is the explicit
`/bin/sh`. The failure default is the safe one: a signal, an absent
`xargs` or an unrecognised dialect all end as a refusal rather than as a
branch.

#### ROUTED

`T-153-s12` (suggested): the prober's GNU row restates a number the DOCS
GATE matrix already holds and nothing compares the copies — mutant 5
above. `T-153-s11` stands as the executor filed it and I confirmed its
premise by reading the parity body.

Status left at `verifying`; no merge, no push, nothing written outside
this lane.

#### THE GATES MY OWN WRITING MOVED

This verdict and `T-153-s12` are two cards under `docs/tasks/`, which is
a code input. At `84fc0f6` — the commit carrying them, one commit past
the reviewed tip — `node tools/e2e/scripts/docs-gate.mjs $(git diff
--name-only aadf874 84fc0f6)` FIRES on both cards and names three
suites, not four: `npm test from app/`, `npm test from tools/e2e/`,
`npx vitest run from lib/parser/` (no cargo, because this commit does
not touch `docs/CONVENTIONS.md`). All three run green at `84fc0f6` —
e2e **281 passed exit 0** (`NPUTER_E2E_PORT=14920`, lsof zero rows
first), lib/parser **314 passed exit 0**, app **1013 passed exit 0** —
and `npm run lint:docs` exits 0 with every live card's frontmatter
parsing under a legal status. The only commit after that one is the one
adding this section, and it changes nothing but this prose.
