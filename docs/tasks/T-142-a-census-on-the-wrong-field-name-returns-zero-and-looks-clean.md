---
id: T-142
title: A census that names a field the data does not have returns zero — and zero is indistinguishable from a clean result
feature: F-06
milestone: 4
priority: 4
size: S
status: done
suggested_by: architect claude-opus-5
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by: claude-opus-5
verified_by:
review: self-verified
---

Absorbs: T-111-s6 (Amnesty triage 2026-08-29 (triage seat)) — the fullest worked instance of this card's own instance 3, re-derived on disk by matching ^id: rather than a filename glob, and it retracts its own headline word after main overturned the framing: the counts are an inventory of declarations naming a blocker that has since landed, not an indictment. What was wrong was a QUERY — a shell loop reading a non-empty blocked_by as "blocked" without resolving the ids — which is exactly the positive-control gap this card exists to close, and it cost four accurate declarations being cleared and a card filed against a defect that did not exist.

Absorbs: T-093-s2 (Amnesty triage 2026-08-29 (triage seat)) — the triage recommendation this promotion takes, argued rather than asserted: T-093's anchor (a search that finds nothing is not a refutation) and this card's (a census on a field the data lacks returns zero) are one class — a query ran, produced no error, returned an answer shaped exactly like the one you wanted, and answered a different question. It also supplies a further instance measured at bc2d82a: T-093's own card cites a needle that no longer finds the sentence it was recorded for, because ADR-019's compaction reflowed the line — a remedy needle without a ref, stale in four days, in the card whose subject is that this happens.

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of the
false-empty class.** `T-093-s2` recommended exactly this and said which
way the absorption runs: T-093 is DONE and its content has landed, so
what is left over is the arm this card calls the one that generalises.
Two further findings are absorbed below, taking the instance count to
six across four seats.

Absorbs: T-093-s2, T-111-s6.

## Acceptance criteria

- THE positive-control rule SHALL be extended to CENSUSES in the same
  place it is already stated for test bodies (arm 1). Before a count is
  written into a card, a brief or STATE, the query SHALL have been shown
  capable of returning something else — pointed at a ref where the
  answer is known non-zero, or run once against a planted instance.
- THE layer boundary SHALL be named once (arm 2): frontmatter keys are
  snake_case and model properties are camelCase, so a census of the
  PARSED model for `blocked_by` and a census of FRONTMATTER for
  `blockedBy` both return zero and both read clean. `docs/STATE.md`
  carries this as a live-hazard line today, and a hazard that recurs
  belongs in CONVENTIONS.
- THE fix SHALL NOT be a lint that greps for known-bad field names.
  That is a census about censuses with the same failure mode — it
  returns zero on the day someone invents a new wrong spelling. The
  property worth pinning is *the query was demonstrated able to answer
  non-trivially*.
- ARM 3 (a helper that queries the parsed model and so cannot be asked
  for a field the model lacks) SHALL NOT be folded in. It keeps its own
  `tools/e2e` seat: it covers only queries that go through the model,
  and this card's sharpest instance went through `graph.json` directly.
  IF it is wanted THEN it SHALL be routed as its own card.
- THE fence on this card was CORRECTED once already (from `method/` to
  `docs/CONVENTIONS.md`, by T-093's lane, because a lane cut to
  `method/` cannot write the sentence the card is about). The lane SHALL
  re-derive that the fence still reaches the sentence it intends to
  write before it starts.

**Three instances in one working day, two of them mine.** Each is a
query that ran without error, returned a number, and answered a
different question than the one asked.

## The three

1. **`docs/architecture/graph.json` has no component field.** Its file
   records carry `id, path, lang, hash, loc, symbols` — the component
   join happens later, in the TS derive layer, against registry globs. I
   probed the published graph for unmapped files at nine historical
   checkpoints. It returned a rising series (59, 75, 92, 178, 185) that
   looked exactly like a project accumulating unmapped files. **It was
   the total file count.** Every record matched "no component field",
   because no record has one.

2. **`blocked_by` and `blockedBy` are both correct, in different
   layers.** `lib/parser/src/task.ts:240` reads the frontmatter key
   `blocked_by` into a model property `blockedBy`. A census of the
   PARSED model for `blocked_by` returns 0; a census of FRONTMATTER for
   `blockedBy` returns 0. **Either direction reads as a clean pin.** An
   integrator hit this on the dangling-blocker census and wrote it down.

3. **The `blocked_by` episode itself** — a raw frontmatter census that
   ran fine and supported a wrong belief for most of a day, ending in
   four accurate declarations being cleared and a card filed to gate a
   defect that did not exist. Different mechanism, same ending.

## Why this shape is worse than a wrong answer

A crash is a finding. **A zero is the answer you were hoping for.**
Instance 1 is the sharpest: the probe did not even return zero, it
returned a *plausible rising series*, and I reported it to the human
before noticing. Nothing about the output distinguished it from a
correct measurement — no error, no empty set, no anomaly.

**These three all sit under a rule this project already wrote:**

> A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.

The rule exists for test bodies. **Every instance above was a census,
not a test** — a one-off shell or Python query run to establish a fact
that a decision then rested on. The rule was never carried across, and
census results have been entering cards, briefs and STATE unguarded.

## The shape of a fix, not the fix

1. **Extend the positive-control rule to censuses**, in the same place
   it is already stated. Before a zero (or any count) is written into a
   card, brief or STATE, the query must be shown capable of returning
   something else — point it at a ref where the answer is known
   non-zero, or plant one instance and see it found. Cheapest; prose,
   and `T-131` argues prose does not bind.
2. **Name the layer boundary once.** Frontmatter keys are snake_case and
   model properties are camelCase; that is a real and reasonable design,
   and nothing states it where a session doing a census would read it.
3. **Give the census a tool.** The project already prefers a
   construction to a check. A helper that queries the PARSED model
   cannot be asked for a field the model lacks — it would have failed
   loudly in instance 1 and been impossible in instance 2.

**FENCE CORRECTED 2026-08-27, by T-093's lane.** This card was filed
`touches: [method/]`. Arms 1 and 2 as argued write the citation bullet in
`docs/CONVENTIONS.md` — **a lane cut to `method/` cannot write the
sentence the card is about.** Re-fenced. Arm 3 keeps its own `tools/e2e`
seat and is deliberately NOT folded in: it only covers queries that go
through the parsed model, and this card's sharpest instance went through
`graph.json` directly. See `T-093-s2`.

**Arm 1 is the one that generalises**; arm 3 only covers queries that
go through the model, and instance 1 went through `graph.json` directly.

## One caution for whoever takes it

**Do not let the fix be a lint that greps for known-bad field names.**
That is a census about censuses, and it has the same failure mode: it
returns zero on the day someone invents a new wrong spelling. The
property worth pinning is *the query was demonstrated able to answer
non-trivially*, not *the query avoided a blacklist*.

## Implementation notes (executor claude-opus-5, 2026-08-31)

Arms 1 and 2 landed as **eight indented lines inside the existing
`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL` bullet**, not as a new
bullet. Two reasons, both derived rather than assumed: the card asks
for arm 1 "in the same place it is already stated for test bodies",
and a NEW column-0 bullet would have joined both `standingGates` and
the derived ROW 9 discipline list — the T-182 failure this file has
already paid for once tonight. Arm 2 sits in the same paragraph
deliberately: the card's complaint is that nothing states the layer
boundary *where a session doing a census would read it*, and the
census rule is now that place.

**Arm 3 was not folded in and is not re-routed** — the card already
gives it its own `tools/e2e` seat.

### The byte band — measured at every step, never estimated

| | bytes | headroom vs the 164,393 warn line |
|---|---|---|
| base `8443a78` | 147,447 | 10.3082% |
| tip | 147,948 | 10.0035% |

`+501`. The drift line is 10%, the reading is `(warn - size) * 100 /
warn` and drifts at `v < 10`, so the ceiling was **147,953 bytes and
the budget 506**. Two longer drafts were measured and CUT for landing
at 9.9804% and 9.9937% — both DRIFTING. This paragraph is the rule it
publishes: the byte check was shown able to say NO twice before it was
allowed to say yes.

**This leaves 5 bytes.** `docs/CONVENTIONS.md` is now effectively AT
its drift line, and the next docs lane cannot add a sentence without
tripping it. That is a real finding and the remedy is not this lane's:
it is an ADR-019 compaction landing, which moves content to a record
rather than deleting a hazard to fit. Routed below.

### Evidence per acceptance criterion

1. **Positive-control rule extended to censuses** — MET. The bullet now
   carries "Before a count reaches a card, brief or STATE, show the
   query able to answer otherwise: a ref where it is known non-zero, or
   one planted instance."
2. **Layer boundary named once** — MET. Before this lane the census
   `snake_case|camelCase|blockedBy` over `docs/CONVENTIONS.md` returned
   **0, exit 1**; the identical query over `docs/STATE.md` returned
   **1, exit 0** as the positive control. The premise was measured, not
   assumed.
3. **Not a lint on known-bad field names** — MET by construction. No
   lint, no gate, no field-name list was added; the published sentence
   ends "Not a lint on known-bad spellings: a census about censuses."
4. **Arm 3 not folded in** — MET; untouched, keeps its own seat.
5. **Fence re-derived before starting** — MET. `.nputer/lane-fence.json`
   resolves `touches:` to exactly `docs/CONVENTIONS.md` with
   `docs/tasks` always-writable; the sentence the card is about is
   inside it, and the whole diff is those two paths.

### What I reviewed as my own integrator, and what I could not

The ceremony row is *S, diff outside shipped code*, and I DERIVED that
rather than accepting it: no component's `paths:` claims this file, and
the kit's `docs-templates/CONVENTIONS.md` entry is
`include_str!("method/docs-templates/CONVENTIONS.md")` — a different
file. My bytes do not reach the product, so no verifier is owed.

Reviewed, mechanically:
- **All 12 phrases a CONVENTIONS reader requires unique still match
  exactly one bullet**, asked of the repo's own `rawBullet` and
  `conventionsBullet` rather than a reimplementation — with a POSITIVE
  CONTROL that planted a duplicate and required the throw. It fired.
- **The derived gate list (4) and ROW 9 discipline list (19) are
  byte-identical before and after.** My prose is invisible to both
  derivations, which is the T-182 trap avoided by measurement.

Could NOT review: whether the sentence actually changes behaviour. It
is prose, `T-131`'s argument that prose does not bind applies to it,
and no gate can tell a demonstrated query from a confident one — which
is the same limit the rule it extends already carries.

## Corroboration — instance 5, 2026-08-31 (architect seat, reached CI)

The class owner takes this rather than a sibling file (TASK-FORMAT: a
second instance is a corroboration). `blocked_by: [T-190]` was set
naming a card that existed only inside another lane; the seat ran
`npm run lint:docs`, read *"every live task card's frontmatter parses,
with a legal status"* — **true, and not the question** — pushed, and CI
reddened in `lib/parser/test/smoke.test.ts`:
`blocked_by names 'T-190' but no task in the model declares it`.
Fixed on main at `8df0dcc`; not this lane's to chase.

**The reported diagnosis was that the gate could not have caught it.
Measured at this lane's tip, that is false, and the correction matters
more than the instance:**

- `npm run lint:docs` is `docs-gate.mjs --census`. It exits **0**,
  prints the frontmatter sentence, and prints **no FIRES line and no
  owed suite whatsoever** (`grep -c FIRES` = 0). It cannot answer
  "which suites does my diff owe", and nothing in its name says so.
- The DOCS GATE **proper**, fed the RANGE RULE's pair, exits **1
  (FIRES)** on a `docs/tasks/*.md` path and names
  `npx vitest run from lib/parser/`, listing
  `lib/parser/test/smoke.test.ts` BY NAME — the exact body that
  reddened.

So the instrument that would have caught it exists, works, and was
standing one command away. **The failure is not a missing gate; it is
two modes of one script where the reassuring mode is the one whose npm
alias sounds like the general question** — and its exit 0 is read as an
all-clear when the gate's own contract reserves 0 for "nothing owed".
That is this card's class with a shipped instrument as the subject,
and it is the sharpest instance on the card.

## Routed, not built

- **`T-142-s1` FILED** — the remedy for instance 5. It needs
  `tools/e2e` (the alias and the census mode's output) and is outside
  this card's one-file fence, so it is a suggestion rather than a
  silent omission. `T-090`, which argued the gate should NOT be an npm
  script, is `done` and predates the alias, so nothing open owned it.
- **The byte band is at its floor and this lane did not cause it.**
  Re-derived: `docs/CONVENTIONS.md` landed at 131,514 on 2026-08-30
  (ADR-019 addendum 4, headroom 20.00% by construction) and stands at
  147,948 today — **+16,434 bytes, exactly 50.0% of the whole band, in
  about one day.** `T-162-s1` already owns this class, is `done`, and
  ruled that only @human can change the formula; so this is reported as
  a fresh datum for that ruling rather than re-filed. The operational
  consequence is immediate: the next docs lane has **5 bytes**, and the
  remedy CONVENTIONS itself prescribes is a compaction landing that
  MOVES content to a record — never a hazard deleted to fit.
- **NOT chased, on instruction**: the `blocked_by: [T-190]` defect this
  lane inherited from its base. Fixed on main at `8df0dcc`; the merge
  forecast below confirms it resolves.

## Gates and suites — every exit captured BEFORE any pipe

Derived from the diff, not accepted: the diff is `docs/CONVENTIONS.md`
plus this card and `T-142-s1`. **GRAPH REGEN not owed** (no
`*.ts/tsx/js/jsx/rs` outside docs/). **BOOT GATE not owed** (nothing
under `app/src/**`, `app/src-tauri/**` or a manifest). **METHOD EVAL
GATE not owed** (no `method/**`). **DOCS GATE FIRES.**

| command | exit | figures |
|---|---|---|
| `npm run lint:docs` (tools/e2e) | 0 | budgets hold, 4 gated |
| `npm run health` (tools/e2e) | 3 | designed — 3 unread, 4 unkept; 7 inside, 0 drifting, 0 breached |
| DOCS GATE, RANGE RULE pair | 1 | FIRES — owed `cargo test` + `npm test` from tools/e2e/ |
| `cargo test` (app/src-tauri) | **0** | 598 passed, 0 failed, 4 ignored; lib suite **4.10s**, under the 9.5s cliff |
| `npx vitest run` (lib/parser) | 1 | 343 passed, 1 failed — the inherited dangling reference |
| `npm test` (tools/e2e) | 1 | 337 passed, 4 failed (4.6m) — all inherited |
| `npm test` (app) | 1 | 1075 passed, 2 failed — both inherited |

**A CORRECTION THIS LANE MADE AGAINST ITSELF, AND IT IS THIS CARD'S OWN
CLASS.** The DOCS GATE run at the CONVENTIONS-only diff named TWO owed
suites, and the notes above were first written to that answer. Re-run
at the FINAL tip — once `docs/tasks` had entered the diff — it named
**four**, adding `npm test from app/` and `npx vitest run from
lib/parser/`. A gate answer is a function of the diff it was asked
about, and the earlier answer was true of a diff that was no longer
mine. The fourth suite was then run rather than inferred, and it is the
one that found two more inherited bodies.

**THE SEVEN RED BODIES ARE INHERITED FROM THE BASE, PROVEN RATHER THAN
ASSERTED**, and none is mine:

1. base `8443a78` already carries `blocked_by: [T-190]` at line 9 of
   `T-126-s2`;
2. **0** cards named `T-190` exist at that ref — with the positive
   control that the same census finds **4** `T-126` cards, so it can
   find cards;
3. commit `1b35e01` changes exactly one file, `docs/CONVENTIONS.md`,
   `+8` lines — a board parse count is not a function of it.

The four e2e failures are `parse-error-details` counts (60→61 three
times, 1→2 once) — the signature the DOCS GATE bullet already records
for `9c64cd8`, a board change surfacing in bodies about frame geometry.
The app suite's two name the cause outright (*"no live card names a
blocker that does not exist"*), and its log mentions `T-190` **4**
times and this lane's two new cards **0** times. The parser suite
stayed at exactly **1 failed / 343 passed** before and after those two
cards were added — the count did not move 1→2, which is what shows they
are clean by the REFERENCE-RESOLVING instrument and not merely by the
frontmatter one.

**Merge forecast against current main `8df0dcc`** (the role file's
preferred form, since a lane's own tip cannot answer for the commit
that IS its tip): `git merge-tree --write-tree` exits **0** — clean, no
conflicts — the merged tree carries `blocked_by: []`, and this lane's
prose survives intact at 147,948 bytes / 10.0035% headroom. So the five
reds resolve at the merge; I could not run the suites against that tree
because materialising it is the integrator's act, not this lane's.

## Corroboration — instance 6, 2026-08-31 (`T-142-s1`'s lane, measured at `57c1b39`)

Appended as a record, per TASK-FORMAT. Found while running the owed
suites for `T-142-s1`; **it is not that lane's to fix and was not
fixed** — routed instead, because it is a distinct producer needing its
own drill.

`node tools/e2e/scripts/brief.mjs --dispatch` **silently truncates its
own output at exactly 65,536 bytes whenever its stdout is a PIPE.** It
exits **0**, writes no stderr, and returns a report that reads as
complete — the header, the live lanes and the whole STARTABLE section
are all present, so nothing about it looks partial. What is missing is
the tail: `critical path:`, `worst blocker:`, `drawn cards:`, `ready on
blocked_by alone:` and `startable once the lanes are counted:`.

Measured at `57c1b39` **on a pristine tree** (`git status --porcelain`
= 0 lines, this lane's three edits stashed), so the attribution is not
an argument:

| stdout is | bytes | carries `critical path:` |
|---|---|---|
| a FILE (`1> out.txt`) | **69,302** | yes |
| a PIPE (`spawnSync`, default `maxBuffer`) | **65,536** | no |
| a PIPE (`spawnSync`, `maxBuffer` 64 MiB) | **65,536** | no |

**It is not `maxBuffer`** — raising it to 64 MiB changes nothing, and
65,536 is one pipe buffer exactly. The mechanism is
`process.exit(code)` at `brief.mjs`'s last line: a pipe write is
asynchronous, and `process.exit` discards whatever has not drained. A
file write is synchronous, so the hand-run spelling never loses a byte
and the defect is invisible to whoever tests it by eye.

**Why it belongs on THIS card.** It is the class exactly: a command ran,
produced no error, exited 0, and returned an answer shaped like the one
you wanted while answering a smaller question. It is also the
class's worst reach so far — the truncated tail is precisely the
DECISION content (`critical path`, `worst blocker`), the report is
`method/roles/orchestrator.md`'s own dispatch input, and every
programmatic reader of it takes a pipe by construction while every
human reader takes a terminal and sees the whole thing.

**Live consequence, stated because a session will meet it:**
`tools/e2e/tests/dispatch-order.spec.ts:200` (*"--dispatch runs on the
live repository, exits 0, and WRITES NOTHING"*) reds on this at
`57c1b39` — **1 failed / 366 passed** in the full e2e lane, and
**1 failed / 13 passed** running that spec alone. Re-run once as a
second measurement, per STATE, and it reproduces. The board crossed
64 KiB of `--dispatch` output at some ref nobody was watching for, so
the red arrives attributed to whatever lane runs the suite next — which
is the DOCS GATE's own founding story one tool over.
