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
