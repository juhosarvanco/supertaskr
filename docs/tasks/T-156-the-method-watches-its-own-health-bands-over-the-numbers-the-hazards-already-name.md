---
id: T-156
title: The method watches its own health — control bands over the numbers the standing hazards already apply by eyeball
feature: F-06
milestone: 4
priority: 34
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 3: F-06's premise — drift as a first-class signal —
applied to the method's own health. The bands already exist as
hand-applied rules: the lib-suite duration cliff (every green under
9.5s, every red over 14.6s, nothing between — T-088-s4, a control
band read by eyeball for twenty-plus checkpoints), graph budget
headroom (98.1% at this filing, the number nothing reports), the four
doc budgets (gated hard/warn but trend-blind), e2e wall time.

Rider (2026-08-29, integrator at the amnesty merge, from T-092-s2's
discharge): governed-doc warn HEADROOM is a band candidate, not just
the budgets themselves — docs/CONVENTIONS.md's headroom moved 12,323 ->
919 -> 280 -> 27,586 bytes across four refs in three days, each
excursion discovered by a card rather than a report. A number that
moves like that wants a band.

## The shape

1. One deterministic script: read each metric from its existing
   authority (`index --check`'s budget line, the suites' own timing
   output, `wc -c` against DOC_BUDGETS), compare against a
   version-controlled bands config. The config has a named home
   beside the script and a named tuner: TRIAGE — dismissals tune
   bands, the playbook's own loop.
2. Tiered response, all three tiers cheap: inside the band — silent;
   drifting — print the trend with its derivation; breached — FILE
   the finding as a suggestion card, which re-enters the board the
   way every finding already does. No tier acts on anything.
3. Run at checkpoints (a line in the record template's Gates section)
   and on CI's schedule once the pipeline is green (behind `T-153`).

## The widened band set (2026-08-29, pre-dispatch)

- **TRIAGE DEBT** (ADR-020's metabolism): suggested-card count (140
  at this writing), age of the oldest untriaged suggestion, and
  arrivals-versus-dispositions per checkpoint window. A parked card
  re-enters the report when its fence's component is next dispatched.
- **THE CONSTITUTION'S OWN INDICATORS** — the criticism's accidental
  gift: NORTH_STAR defined cold-start pass rate, drift-incident
  count, and rejection-rate trend by task size on day one, and
  nothing has ever derived one. They are figures without keepers in
  the one document nobody audited; this card gives them their
  keeper.
- **THE MACHINERY'S OWN COST**: total gate runtime per checkpoint,
  stamped — the enforcement layer is subject to the same budget
  discipline as the documents, said out loud.
- Token bands DEFER to telemetry export (org-scale; a token reading
  is a live-environment fact, stamped in records, never derived from
  the tree).

## Acceptance criteria

- WHEN a watched metric breaches its band THE script SHALL emit a
  finding naming the metric, the reading, the band and the
  derivation — and the checkpoint SHALL carry it.
- IF a metric's authority cannot be read THEN the script SHALL say
  so at exit 3, never report the band as holding.
- WHEN the bands config changes THE change SHALL carry its measured
  reason, the max_graph_bytes pattern.

## Implementation notes

Executor `claude-opus-5@subagent`, lane `task/T-156-health-bands`,
worktree `/Users/ujju/Projects/nputer-T-156`, base `78aabe5`.

### What was built

Three files under the fence, plus one table that moved and one npm
script:

- `tools/e2e/scripts/health-bands.config.mjs` — **the bands, as data.**
  Fourteen of them: the four governing-document warn HEADROOMS (derived
  from `DOC_BUDGETS`, one per gated entry, so a document that gains a
  budget gains a band in the same commit), the graph's emit-budget
  headroom, the two suite durations, the three triage-debt metrics, the
  machinery's own cost, and the constitution's three indicators. Each
  carries `measured: { at, reason }`. The TUNER is named in the header
  and it is TRIAGE: a dismissal is what moves a limit.
- `tools/e2e/scripts/health-bands.mjs` — the derivation, side-effect-free
  so a suite can import it.
- `tools/e2e/scripts/health-bands-run.mjs` — the wrapper that executes.
- `tools/e2e/tests/health-bands.spec.ts` — 21 bodies.
- `DOC_BUDGETS` moved from `docs-gate.mjs` to `docs-scan.mjs`. Two
  readers now need it — the gate reads the `fail` line, the bands read
  the headroom under `warn` — and `docs-gate.mjs` executes at import by
  design, so the second reader could not have imported it there. One
  table, per T-057; a body pins that the gate no longer declares its own.
- `npm run health` from tools/e2e.

### The three tiers, and the two exit codes that are not zero

Inside is SILENT and counted. Drifting prints the reading WITH its
derivation. Breached emits the finding — metric, reading, band,
derivation — and with `--file` (never by default) puts it on the board
as a suggestion card, idempotently: the card carries a `Health band:`
line, and a breach whose line is already on the board files nothing.

**Exit 3 takes precedence over exit 1**, and that ordering is pinned.
A run that could not read three of its bands is not a claim about the
tree however loud the breach it did read — but the breach is still
SAID, because swallowing it would be the same defect wearing the
opposite costume.

### The readings come from the authorities' own output

Nothing here re-derives a number another tool prints. `--readings
<file>` takes the captured stdout of the runs the checkpoint already
performs, and the parsers are pinned to the SOURCE that produces the
line — a body asserts `budget_line`'s two format strings in
`app/src-tauri/crates/nputer-index/src/check.rs`, so reformatting there
reds here instead of silently unreading the band.

WHY NOT JUST RE-MEASURE THE GRAPH FILE: a re-derived graph size is the
COMMITTED file's, `index --check` measures a FRESH index, and the two
disagree exactly when the graph is stale — which is the moment the
number matters.

### The reading at this lane's tip (`91cc62b`), re-derive at yours

    14 band(s) — 5 inside, 2 drifting, 0 BREACHED, 3 unread, 4 UNKEPT

- `docs/STATE.md` — **369 bytes of warn headroom, 4.36% of the warn
  line. DRIFTING.** 8,096 bytes against a warn of 8,465.
- `docs/ROADMAP.md` — 685 bytes, 6.52%. DRIFTING. 9,814 against 10,499.
- `docs/ARCHITECTURE.md` 19.86% and `docs/CONVENTIONS.md` 20.00% —
  inside, both effectively at their landing headroom.
- The three readings bands are UNREAD in this lane on purpose (below).
- The four unkept bands are why the run is 3 rather than 0.

Fed a captured `index --check` budget line from the committed graph
(1,020,023 of 1,040,000 — 19,977 bytes left), `graph/budget-headroom-`
`bytes` reads **DRIFTING at 1.27 mean single-commit growths** of
headroom left. That is the 98.1% the card names, said by something that
will say it again next week.

### THE BAND BREACHED WHILE THIS LANE WAS BUILDING IT

main advanced from `78aabe5` to `8de9de4` during this session (the
T-153-s2 merge and its checkpoint). Re-derived against **main's own
tip** rather than this lane's:

| document | bytes | warn | headroom | % of warn | state |
|---|---|---|---|---|---|
| `docs/STATE.md` | 8,372 | 8,465 | **93** | **1.10%** | **BREACHED** |
| `docs/ROADMAP.md` | 10,066 | 10,499 | 433 | 4.12% | drifting |

`docs/STATE.md` crossed the 2% breach line inside the two commits that
landed while this card was being built, and nothing said so — the
checkpoint that wrote it passed every gate, because the FAIL line is
10,158 bytes away and the warn line is what moved. **That is the rider's
own thesis reproducing live**, one document over from the one it was
written about: *each excursion discovered by a card rather than by a
report.* It is also this project's standing lesson about refs — the
figures in the section above are true at `91cc62b` and false at
`8de9de4`, which is why every one of them is stamped.

The graph band moved too: 1,021,562 bytes at main's tip, **18,438 bytes
of headroom, 1.17 mean single-commit growths**, still drifting and
1,539 bytes closer to its breach line than it was at this lane's base.

### What I refused, and where it went

- **`docs/checkpoints/TEMPLATE.md`, `docs/CONVENTIONS.md`, `ci.yml`** —
  criterion 1's second clause (*"and the checkpoint SHALL carry it"*)
  and shape item 3 are all writes outside `[tools/e2e]`. Not built.
  Routed as **`T-156-s1`**, which also records the
  `workflow-parity.spec.ts` coupling that makes the CONVENTIONS bullet
  and the CI step one commit rather than two.
- **The constitution's three indicators** — declared as bands with no
  keeper, named on every run, never reported as holding. The recording
  MECHANISMS they need are method and docs writes. Routed as
  **`T-156-s2`**, which carries the measurement behind the third one:
  rejection-rate-by-size was attempted and REFUSED, because the 113
  cards with a `## Verdicts` section spell verdicts five different ways
  and two of the matching headings are not verdicts at all. A scanner
  over that corpus is the known-vacuous keeper `docs/NORTH_STAR.md`'s
  bar calls a stop-the-line defect.
- **A suite body that reds on a dirty tree** — routed as `T-156-s3`,
  found by running the lane before committing. Inside the fence, but
  outside this card.
- **`docs/CAPABILITIES.md` is now STALE** — `npm run capabilities:check`
  exits 1 (committed 20,046 bytes, fresh 21,727) because this card adds
  a spec file. That is exactly the class `T-154-s3` already carries, so
  no duplicate card was filed. **THE INTEGRATOR OWES THE REGEN**; the
  file is outside this fence.

### Drills — 7 mutants, 7 kills, TWO OF THEM ONLY AFTER A REPAIR

Committed first, per POISON DRILL; one side only, the producer never an
assertion; restored and proven by `shasum -a 256` against
`git show HEAD:<path>` plus an empty `git diff --stat` over both files.

| # | mutation (in the producer) | result |
|---|---|---|
| 1 | an unread band returns `state: "inside"` | 3 failed / 17 passed |
| 2 | lib-suite guard broadened to `/Running unittests/` | **SURVIVED, 20/20** |
| 2b | same mutation, after the fixture was repaired | 1 failed / 20 passed |
| 3 | `validateBands` stops requiring a measured reason | 1 failed / 20 passed |
| 4 | Playwright's unit suffix assumed to be seconds | 1 failed / 20 passed |
| 5 | the silent tier lists its `inside` bands | 1 failed / 20 passed |
| 6 | one band's measured reason emptied in the config | **SURVIVED, 21/21** |
| 6b | the wrapper stops refusing an invalid config | 1 failed / 20 passed |
| 7 | the filed card carries `status: closed` | 1 failed / 20 passed |

**BOTH SURVIVORS WERE REAL AND BOTH ARE CLOSED.**

*Mutant 2* survived because the fixture happened to list the lib binary
FIRST, so a parser that takes the first binary and ignores its name
agrees with one that reads the name. The fixture now puts `main.rs`
first and a `tests/` binary last, and adds the corpus that ran binaries
but no lib — which must be UNREAD, never another binary's number wearing
this band's name. That assertion is the one the whole cargo-cache-cliff
band rests on, and it was vacuous.

*Mutant 6* survived because `validateBands` was proven and its SEAM to
the wrapper was not: nothing could drive the command against a config
that had lost a reason. Closed by `--config <path>`, which is a real
flag rather than a test seam — a project adopting this method has its
own suites and its own cliffs, and the alternative to a flag is a fork
of the script — plus a body that plants a band with an empty reason in a
temp dir and requires exit 3 with the config named.

### For the verifier

1. **THE CEREMONY ROW IS GENUINELY UNDECIDED AND I DID NOT DECIDE IT.**
   `touches: [tools/e2e]` is a bare path, not a registry slug, so the
   rule of thumb (*"docs, method and tooling self-integrate"*) puts this
   card on the ceremony table's **S, diff outside shipped code** row —
   which gives it NO verifier and would make `done` the stamp
   `roles/executor.md` step 6 asks for. But **this project has never
   stated its shipped partition** — that is `T-147`, still `planned` —
   and the dispatching brief instructed `building -> verifying`. Where
   the row is undecided, `verifying` under-claims and `done` over-claims
   (it would also assert a merge that has not happened and stamp
   verifier fields that are not mine). **So the stamp is `verifying` and
   the disagreement is recorded here rather than resolved.** If the
   integrator reads the row the other way, the fix is one field.
2. **The exit code is 3 at every ref today and will stay 3** until the
   four unkept bands get keepers. That is deliberate and argued in the
   script header, but it is the design decision most worth attacking: a
   permanently non-zero reporter is one people learn to ignore, and the
   counter-argument is that `docs/NORTH_STAR.md`'s bar calls a
   known-vacuous keeper a stop-the-line defect. **`T-156-s1` is what
   moves it to 1-or-0** for the three readings bands; `T-156-s2` for the
   rest.
3. **`suite/e2e-seconds` is the weakest band here** and says so in its
   own reason: no cliff is known, the multiples are borrowed from
   `DOC_BUDGETS`' warn/fail shape, and wall time is near-linear in spec
   count, so it moves at every suite growth. It is landed on this lane's
   own run — 279 specs, 156s at `b060f90` — and is expected to be
   re-landed by triage rather than defended.
4. **No cargo was run in this worktree, on purpose.** A lane's own
   `target/` sits inside the graph walk (`T-153-s3`, `T-111-s10`), so
   building here and then running `index --check` reports phantom files.
   The GRAPH REGEN derivation is done from `.nputerignore` and the
   committed graph instead, which is cheaper and not weaker: `tools/` is
   config-excluded from the walk and the committed graph holds zero
   `tools/` paths, so this diff cannot move it.

## Verdicts

### T-156 VERDICT: APPROVED WITH ASSIGNED CORRECTIONS — verifier claude-opus-5@subagent, 2026-08-29. The bands are real, the guards fire, and the derived-band property holds — but the move shipped without its sweep, the auto-filed card writes an unquoted YAML title, and one branch's guard is vacuous

**Verified at `2aef3d8` in `/Users/ujju/Projects/nputer-T-156`, against
the executor's own pair `78aabe5..2aef3d8`.** `main` moved twice more
during this verification and stood at `40d03b7` when it closed; the
lane's reconciliation is the integrator's, not this seat's. Every figure
below is my own measurement at my own ref — none is relayed from the
handoff.

**DISCLOSURE ON THE BLINDNESS, because the guarantee is the point and it
did not hold here.** The dispatching brief embedded the executor's full
handoff report inside my own task prompt, above the instruction to read
the card and the diff first. I could not un-read it. What I did instead:
I wrote the attack set from the card at its base ref and the raw diff
only, before opening the Implementation notes, and I formed **every
mutant myself** rather than replaying any named in that report — two of
mine (§DRILLS 5 and 6) are not in it, and one of those is a survivor the
executor did not find. The brief's own format is what needs the repair;
that is not this card's defect and I have not folded it into the verdict.

### What I ran, unpiped, in the lane

| suite | result |
|---|---|
| `npm run typecheck` (tools/e2e) | exit **0** |
| `npm run lint:tokens` (tools/e2e) | exit **0** — TOKEN 150 files, CONTROL 810 |
| `npm run lint:docs` (tools/e2e) | exit **0** — 22 readers / 4 suites, 0 frontmatter issues, 4 budgets gated |
| `npm run build` + `npx tsc --noEmit` (lib/parser) | exit **0** |
| `npx vitest run` (lib/parser) | exit **0** — **314 passed** |
| `npm run build` (app) | exit **0** |
| `npm test` (app) | exit **0** — **1013 passed** |
| `npm test` (tools/e2e), `NPUTER_E2E_PORT=14571` | exit **0** — **279 passed, 2.5m** |
| `npm run health` (tools/e2e) | exit **3** — 14 bands: 5 inside, 2 drifting, 0 breached, 3 unread, 4 unkept |

Port env var DERIVED, not assumed: `resolveLanePort()` in
`tools/e2e/preflight.ts`, bound at `playwright.config.ts`'s `const port
= resolveLanePort()`. `NPUTER_BOOT_PORT` is the boot check's and binds
nothing here. 14571 was `lsof -nP -iTCP:14571 -sTCP:LISTEN`-probed to
zero rows immediately before binding, both times.

### THE COUNT: the base is 258, not 259 — and the lane's own commits prove it

`npx playwright test --list` at `2aef3d8` collects **279 tests in 27
files**, of which `tests/health-bands.spec.ts` contributes exactly
**21**. Every other generator in the tree loops over a CONSTANT array
(`CHECK_IDS` in `scripts/range-rule.mjs`, `VIEWPORTS`, two key pairs) —
checked file by file, static against runtime, with five mismatches all
accounted for and none tree-derived. So the base tree collects
**258**, and three of this lane's own figures corroborate it: `353bcd8`
ran **278** with 20 bodies, `b060f90` ran **279** with 21, and
`T-156-s3` records **1 failed / 277 passed** on a dirty working tree
carrying 20 uncommitted bodies. 258 + 20 = 278, 258 + 21 = 279, four
ways. **The card and the three suggestion cards never state 259** — the
figure appears only in the handoff, so nothing on the tree is wrong.
It must not be carried into the checkpoint.

### DRILLS — 6 mutants of my own, committed-first, one side only, restored and proven

Each mutation was read back with `git diff` before its suite ran;
each restoration proven by `shasum -a 256` against
`git show HEAD:<path>` **and** an empty `git diff --stat`. Drilled in
place in the lane rather than in a detached worktree: there is no cargo
in this diff, so the POISON DRILL's target-directory hazard is absent,
and `T-120-s2` already carries the cost of the alternative.

| # | mutation (producer side only) | result |
|---|---|---|
| 1 | lib-binary guard broadened to `/Running unittests/` | **1 failed / 20 passed** |
| 2 | wrapper's config refusal neutered (`validateBands(bands).slice(0,0)`) | **1 failed / 20 passed** |
| 3 | a LANDED band's `measured.reason` blanked in the real config | `npm run health` **exit 3** naming `suite/lib-seconds`; suite **4 failed / 17 passed** |
| 4 | exit precedence inverted (breach beats unread) | **1 failed / 20 passed** |
| 5 | `docs/STATE.md` budget poisoned below its landed size | DOCS GATE **exit 1**, "OVER BUDGET — 8096 bytes against its 8050-byte fail line"; the band moved drifting 4.36% → **BREACHED −1.20%** |
| 6 | `if (b === null) continue;` deleted from `docHeadroomBands` | **SURVIVED, 21 passed** — see correction 2 |

Mutants 1, 2 and 4 each killed exactly ONE body, which is the
non-duplication answer T-072-s2 asks for. Mutant 5 is the whole of the
MOVE, both halves: the gate still enforces from its new import, and the
derived band moves with the table.

**The derived-band property holds independently of the suite.** Called
at my own hand: 4 landed budgets → 4 bands; `+ "docs/FAKE.md"` → **5
bands, the new one present and validating**; `+ "docs/UNLANDED.md":
null` → **still 4, the null gained no band**.

### The readings I took, all stamped

At `2aef3d8` in this lane: `docs/STATE.md` 8,096 bytes, 369 of warn
headroom, **4.36%**, DRIFTING; `docs/ROADMAP.md` 9,814, 685, **6.52%**,
DRIFTING; ARCHITECTURE and CONVENTIONS inside. Fed a captured budget
line, `graph/budget-headroom-bytes` reads 19,977 left = **1.27 mean
single-commit growths**, DRIFTING, and `unread` falls to **0**.

**The executor's live finding reproduces at main.** Read out of
`git show 40d03b7:` without touching that checkout: `docs/STATE.md`
**8,372 bytes, 93 of warn headroom, 1.10% — past its own 2% breach
line**, while `npm run lint:docs` stays green because the FAIL line is
1,786 bytes away. `docs/ROADMAP.md` 10,066, **4.12%**, drifting. The
rider's thesis reproduces live, and the band that would have said so is
the one this card builds.

**Two measured reasons spot-derived at my own ref, both real.**
`graph/budget-headroom-bytes` quotes `IndexOptions::max_graph_bytes`'
doc comment, which reads *"mean single-commit growth of 15 751 (55
growths on record, median 5 230, max 241 980 at T-010) — one ordinary
merge from truncating"* — transcription exact, phrase included.
`triage/live-suggestions` quotes the amnesty record, which stamps
**477,081** tokens for **140** dispositions and computes ≈3.4k per card
itself. These are measurements, not decorative stamps.

### ASSIGNED CORRECTION 1 — the auto-filed card writes an UNQUOTED YAML title

`findingCard` in `tools/e2e/scripts/health-bands.mjs` emits
`` `title: ${title}` `` as a YAML **plain scalar**, and the title is
built out of `band.metric` and `band.unit`. Measured, by calling
`findingCard` directly and parsing the block it returns:

| band's metric / unit | the card |
|---|---|
| control, no colon | parses, title intact |
| metric carries `": "` | **UNPARSEABLE** — *"Nested mappings are not allowed in compact mappings"* |
| unit carries `": "` | **UNPARSEABLE**, same error |
| metric carries `#` | parses, **title silently TRUNCATED** at the hash |

This is the `9c64cd8` class named in the DOCS GATE bullet — *"a YAML
plain scalar may not, both cards became unparseable, nothing errored,
the board just got SHORTER"* — with a program as the author, on the
one path this card designs for automatic use. No shipped band triggers
it today, and `npm run lint:docs` would catch it at the same checkpoint,
so the blast radius is bounded; but the tuner loop this card
establishes is TRIAGE editing metric text in the config, which is
exactly how such a string arrives. **THE FIX**: emit the title through a
YAML-safe double-quoted form (`JSON.stringify(title)` is one), and
extend the existing body *"a breach's finding is a LEGAL suggestion
card"* with a band whose metric carries `": "`. Inside the fence.
**Class swept**: every other interpolated frontmatter line in
`findingCard` is a derived id or a literal; `title` is the only one.

### ASSIGNED CORRECTION 2 — the `null` budget branch has a guard no body kills

Deleting `if (b === null) continue;` from `docHeadroomBands` leaves the
suite **21-for-21** (drill 6). The body that names it — *"a doc-headroom
band exists for every gated DOC_BUDGETS entry, derived and not listed"*
— computes BOTH sides from the live `DOC_BUDGETS`, in which no entry is
null, so the word **gated** in its own title is untested. That branch is
the config's documented contract (*"A null entry is a document whose
compaction has not landed: no check runs"*), and CONVENTIONS' POISON
DRILL is explicit: *"IF a body cannot be poisoned … THEN say so and name
it, because a body that cannot red is the finding."* **THE FIX**: one
fixture — assert `docHeadroomBands({ ...DOC_BUDGETS, "docs/UNLANDED.md":
null })` yields no band for it. Inside the fence. (Shape seven: the
mutant set was derived from the pins, not from the criteria.)

### ASSIGNED CORRECTION 3 — the move shipped without its sweep, and three LIVE pointers still name the old home

CONVENTIONS: *"A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE
WAS RUN."* The Implementation notes record no sweep for the class
"textual pointers to `DOC_BUDGETS`' old location". I ran it
(`git grep -n DOC_BUDGETS` from the root) and classified every hit.

**The code side is complete and correct — NO live consumer names the old
location.** `docs-gate.mjs` imports it from `docs-scan.mjs` and uses it
at both of its own sites; nothing else does. `docs-scan.mjs` stays
zero-dependency (`node:` builtins plus `token-scan.mjs`), so
CONVENTIONS' constraint that the `yaml` dependency belongs to the
wrapper alone survives the move.

**Three LIVE textual pointers are now false:**

1. `docs/decisions/019-governing-docs-rules-truths-records.md`, the
   2026-08-27 addendum — *"enforced in docs-gate.mjs's DOC_BUDGETS"*.
   ADR-019 is the authority the new header itself cites for recording
   budget changes by addendum, so this one matters most.
2. `docs/STATE-template.md` — *"enforced by `npm run lint:docs`
   (docs-gate.mjs, DOC_BUDGETS)"*. `docs/STATE.md` is REPLACED from this
   template at every checkpoint, so the wrong pointer propagates into
   the most-read document in the repository.
3. `docs/tasks/T-111-s10-…md` (`status: planned`, promoted at the
   amnesty as the owner of its class) — *"against DOC_BUDGETS in
   tools/e2e/scripts/docs-gate.mjs"*. A live instruction to a future
   executor, and `docs/tasks/` is `alwaysWritable` in this lane's own
   manifest, so this one was reachable from inside the fence.

**Classified and deliberately NOT flagged** (append-only instances that
legitimately keep the old spelling): `docs/checkpoints/2026-08-29-T-154.md`;
`docs/tasks/T-092-…` at `status: done`; `docs/tasks/rejected/T-092-s2-…`.
`docs/tasks/T-147-…` names `DOC_BUDGETS` with no file and needs nothing.

### ASSIGNED CORRECTION 4 — two handoff figures, for the checkpoint's sake

The base spec count is **258** (§THE COUNT), not the 259 the handoff
claims. And `npm run capabilities:check` at `2aef3d8` is exit **1**,
committed **20,046** against a fresh **21,795** bytes — deterministic
across two runs, and 68 bytes above the 21,727 the handoff reports,
which was measured before the twenty-first body landed. The staleness
itself is real, is the class `T-154-s3` already carries (verified: that
card exists at `status: suggested` and its title is exactly this
shape), and the regen is correctly the integrator's. Re-derive at the
merge ref rather than quoting either figure.

### The design question I was asked to attack, and why it is NOT a defect

**Measured, and it is worse than "exit 3 is permanent": TWO of the four
house exit codes are unreachable.** With every readable band fed
(`--readings`), `unread` falls to 0 and the run still exits **3**; with
a real breach planted in a real band (drill 5), it still exits **3**.
`EXIT.CLEAN` and `EXIT.FOUND` cannot occur in the shipped configuration.
A reporter that adopts the house four-code contract and can emit two of
them has an exit code carrying no information.

**I judge it argued rather than wrong, and the criteria decide it.**
Criterion 2 reads *"IF a metric's authority cannot be read THEN the
script SHALL say so at exit 3, never report the band as holding"* — and
it is met exactly: I could not construct a run in which an unread or
unkept band was reported as holding, and the mutant that tries is killed
(drill 4). The criteria nowhere require 0 or 1 to be reachable. The
alternative — dropping the keeperless bands from the exit — buys a
moving code by making the constitution's three indicators quieter, and
`docs/NORTH_STAR.md`'s bar calls *"a known-vacuous keeper … a
stop-the-line defect"*. The executor took the harder and more honest
side, disclosed it as its own weakest point, and filed the two cards
that move it. The repository's own precedent against a permanently
non-zero signal (the AUDIT GATE POLICY's refusal of `--deny warnings`
*"for no actionable signal"*, the DOCS GATE's over-fire trap) is about
GATES that stop a lane; this command gates nothing and is in no
workflow.

There IS a third option neither taken nor named: `unread` is a property
of a RUN and clears when readings are fed, while `unkept` is a standing
property of the CONFIG that `--list` already shows without running
anything, and only the second is what makes the code constant. That is
a design change with a spec change behind it, not a repair, so it is
**routed as `T-156-s4`** rather than assigned — with the measurement
attached, so the board argues with a number.

### Security sweep — clean, one thing named

No dependency added (the `package.json` diff is one script line). No
network, no endpoint, no secret, no credential. `--config`
dynamic-`import()`s an arbitrary path resolved from cwd, which is
arbitrary code execution by construction — acceptable for a local dev
CLI where `node <file>` is equivalent, and it is the flag that makes
criterion 3 drivable end to end; named here so it is a decision rather
than an oversight. `--file`'s write path is safe: the id is derived from
tracked paths, the slug is `[^a-zA-Z0-9]+`-sanitised so no traversal is
expressible, and the only injection surface is the title (correction 1).

### The filed card is legal end to end — measured, not asserted

I drove `--file` for real against a planted breach. It wrote
`docs/tasks/T-156-s4-docs-headroom-docs-roadmap-md.md`, and with that
card on the tree: `npm run lint:docs` exit **0** (*"every live task
card's frontmatter parses, with a legal status"*), `npx vitest run` from
lib/parser **314 passed**, `npm test` from app/ **1013 passed**. The
third tier really does re-enter the board. The card was then removed and
the poisoned budget restored; `git status --porcelain` empty.

### Gates owed by the EXECUTOR's pair, re-derived here

DOCS GATE **fires** — 4 flat `docs/tasks/*.md` paths are code inputs;
the three suites it owes are the three above, all green with this lane's
cards present. GRAPH REGEN fires by literal trigger and is a **provable
no-op**: `.nputerignore` config-excludes `tools/`, and the committed
`docs/architecture/graph.json` holds **0** paths beginning `tools/` —
checked read-only, with **no cargo run in this worktree**, per
`T-153-s3`. BOOT GATE **not owed**: nothing under `app/src-tauri/**`,
`app/src/**` or either manifest.

### The status row — I leave it at `verifying` and agree it is undecided

`touches: [tools/e2e]` is a bare path rather than a registry slug, and
this project has never stated its shipped partition (`T-147`, still
`planned`), so the ceremony row genuinely does not resolve. My own
existence does not settle it either: a verdict having been produced is a
fact about a dispatch, not about a partition. `done` would additionally
assert a merge that has not happened. **Left at `verifying`; the
integrator owns the row, and `T-147` owns the rule.**

### What holds

Fourteen bands, each with a measured reason the loader REFUSES to do
without — proven against the real config, not only a synthetic one. The
four doc-headroom bands derived from `DOC_BUDGETS` so a fifth budget
gains a fifth band in the same commit. Parsers pinned to the sources
that produce their lines rather than to remembered formats. A silent
tier that stays silent, a drifting tier that carries its derivation, and
a breach tier whose card the board's own parser accepts. The `DOC_BUDGETS`
move is right, the gate still enforces from its new import, and
`docs-scan.mjs` is still zero-dependency. **APPROVED with corrections 1,
2, 3 and 4; none of them blocks the merge once performed.**
