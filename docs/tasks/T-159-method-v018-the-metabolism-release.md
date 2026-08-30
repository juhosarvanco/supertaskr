---
id: T-159
title: Method v0.1.8 — the metabolism release, one bump owning every method-text change ADR-020 and its reviews earned
feature: F-01
milestone: 4
priority: 38
size: M
status: verifying
blocked_by: [T-154]
touches: [method/, docs/CONVENTIONS.md, app-agent]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

The pre-execution review found T-154 and T-157 each carrying
method-text riders that would collide into two rapid bumps; this card
is the resolution — ONE bump, one coherent release, one three-file
commit whose third file is Rust (`kit.rs` 0.1.7 → 0.1.8), one
cargo-gated landing, sequenced after T-154's mechanism exists so no
method sentence runs ahead of reality. `blocked_by: [T-154]` is that
sequencing; `T-155`'s eval obligation applies if its suite has landed
by then, and is recorded as not-yet-owed if it has not.

## The release contents (each already ratified or reviewed; this card writes them)

1. **The fence is a property** — lane-protocol rule 5 gains the
   write-time enforcement text with its honest limit (Bash-mediated
   writes stay protocol-covered in v1, disclosed).
2. **Session hygiene per seat** — T-157's run-economics text in the
   role files: dials at session start, standing seats compact between
   dispatches, noisy jobs in subagents, quiet flags with counts kept.
3. **The revert play** — the method's missing undo, written before
   the first bad merge improvises it: `git revert -m 1` of the merge,
   the card returns to `planned` with the revert recorded in its own
   body (a record, never erased), fixtures and generated artifacts
   reconciled at the reverting checkpoint, the checkpoint record
   carrying the why.
4. **Guard-class independence** — a card whose subject is a guard
   (hooks, gates, keepers, security) requires `review: independent`;
   the builder of a cage is not its inspector.
5. **The suggestion metabolism** (TASK-FORMAT + roles): SEARCH BEFORE
   FILING — a finding whose class a card already owns is a
   CORROBORATION and appends a dated evidence line to that card,
   never a sibling file; every new suggestion names its class parent
   if one exists and carries a one-line disposition hint;
   TRIAGE-AT-STAMP — a done card's suggestion train receives
   dispositions within one dispatch cycle, while context is hot;
   a PARKED card resurfaces when its fence's component is next
   dispatched. (The 140-card backlog gets one amnesty triage sitting,
   which is the architect's, not this card's.)
6. **Retirement conditions** (from the external review's best point,
   with this repository's own precedent — the interim graph rule that
   carried its retirement condition from birth and met it): EVERY
   machine ships with the condition under which it retires, and the
   health bands are what notice an incident class gone quiet.
   Promotion and demotion, or the gate inventory eats the method.
7. **The trust sentence** (docs-protocol): trust is not eliminated;
   it is RELOCATED to fewer, named, recorded points — seats,
   provenance marks, human gates. Written down so no future
   description can honestly claim zero.
8. **Review reconciliation** (roles): a review's claims are VERIFIED
   before they are folded in; findings that die are recorded as
   refuted, never deleted. Two sibling reviews in one week each ran
   a third wrong at full confidence — the loop is now the practice,
   this makes it the rule.

## Acceptance criteria

- WHEN the bump lands THE three stamps SHALL move together (the
  ordered-asserts trap is documented) and the commit SHALL record the
  eval-suite result or its honest absence.
- IF any release item's mechanism does not yet exist THEN its method
  sentence SHALL say what holds it today rather than claiming the
  machine — prose never runs ahead of reality.
- WHEN the kit recompiles THE adapter templates SHALL still be
  cmp-identical below line 1 and byte-for-byte with their entries.

## Implementation notes

Built at `9a8a2e9` -> tip on `task/T-159-metabolism-release`. Every
figure below is derived at the ref it names; the live-environment facts
carry the time they were read.

### The three stamps, and the trap re-measured rather than transcribed

`METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs, the
`currently v0.1.8` clause in docs/CONVENTIONS.md's first gotcha, and
method/interview/plan-interview.md's `## Output` heading all moved in
ONE commit. Derived at the tip with `git grep -n "0\.1\.[0-9]"` from the
root: those are the only three occurrences that CLAIM the current
version and are inside `[method/, docs/CONVENTIONS.md, app-agent]`.
Three more claim it from OUTSIDE any bump fence and are routed as
`T-159-s2` (docs/ARCHITECTURE.md's C-01 row, the C-01 component file —
which was ALREADY one version stale before this bump — and
docs/ROADMAP.md). The fixtures were left: they need A version string,
not THE current one.

**The ordered-asserts trap was drilled, not quoted** — table below.
Its sharpest form is mutant A: with the const alone at 0.1.7 the panic
reads *"plan-interview.md's Output heading no longer stamps v0.1.7"*,
naming the DOC and the CONST's version, so a reader repairing the file
the panic names moves the doc backwards and earns a second red. Mutant
C is the positive control the gotcha's own T-089 measurement never
separately showed: the CONVENTIONS arm IS reachable when the
plan-interview arm is satisfied.

### The riders, each derived from its own source

Fourteen parked cards name T-159 (`command grep -l 'T-159'
docs/tasks/T-*.md`, filtered on `status: parked`, at `9a8a2e9`). Twelve
carry it as their named resurfacing condition and two (`T-132-s2`,
`T-132-s6`) name another primary vehicle while assigning an arm here —
which is the arithmetic behind the amnesty record's "twelve".

| rider | disposition | where |
|---|---|---|
| `T-152` (TAKE FIRST) | TAKEN, arm 1 | executor.md step 1 gains the ceremony table, with the twice-measured cost. Arm 2 was already built — `brief.mjs` row 11 prints the ceremony row. Arm 3 refused as the card asked, and the safety line was NOT deleted. |
| `T-052-s5` | TAKEN, arm 1 | integrator.md now states its own citation vocabulary: top-level list is STEPS, a list inside a section is RULES. |
| `T-091-s4` | TAKEN | integrator.md step 1 gains the predicted-tree comparison and the checkpoint-loudness clause. |
| `T-104-s4` | item 2 TAKEN, and NOT by the arm the card preferred | See below — the pointer arm is now refuted by evidence that did not exist when it was written. |
| `T-124-s1` | arm A TAKEN, arm B WITHDRAWN | planner.md step 1 carries bare-git and write-tool, generalised off the one CLI as the card's own caution demanded. Arm B measured red and is routed (`T-159-s4`). |
| `T-126-s5` residual | DISCHARGED, nothing to take | The residual asked whether a lane's OWN card is exempt from every fence. lane-protocol rule 5 already says so at this base — *"A CARD'S OWN FILE IS NEVER PART OF ITS OWN FENCE"* — landed by T-154 AFTER the parking note was written. |
| `T-126-s6` | TAKEN | executor.md's report gains the gate-derivation clause with the two-branch escape, citing the verifier's wording rather than restating it, as the card required. |
| `T-132-s2` | primary DISCHARGED, residual TAKEN | The primary ask (a method-only diff matches no gate) is closed by T-155's METHOD EVAL GATE. The cargo residual is now stated in that gate's own bullet. Trigger-widening stays parked: its author MARKED IT UNVERIFIED and it needs the reader census re-run and the root-anchor ledger re-asserted, not a word changed. |
| `T-132-s4` | TAKEN, arm 1 | lane-protocol rule 4 gains the staged-state obligation. Arm 2 was not needed: arm 1 makes TASK-FORMAT's sentence true without editing it, which is the card's own argument. |
| `T-132-s5` | TAKEN | integrator.md orders the two tests — WHO may write the fix before WHEN it became false. The owed positive control is ARGUED on the page, as the card said it must be. |
| `T-132-s6` | arm 1 TAKEN in a better form | **The card's literal ask has no site at this ref.** It asks to name the port space "beside the other five" shared surfaces; `command grep -n -i 'surfaces' docs/CONVENTIONS.md` returns ZERO rows and the list lives only on T-128's cards. Took the CORROBORATION's sharper general ask instead: rule 4 now names the MACHINE-versus-CHECKOUT scope class with both observed instances, and prefers the construction. Arm 2 stays parked on T-120-s2's merge. |
| `T-133-s3` | TAKEN, in the split its own first question asked for | The RULE stays in orchestrator 5b as a pointer; the SPELLING is in CONVENTIONS' lane bullet. |
| `T-135-s4` | TAKEN, repair 3 | TASK-FORMAT's lifecycle gains the half-dispatched named case. Repairs 1 and 2 refused for the card's own reasons. |
| `T-145-s2` | TAKEN, the wording half | CONVENTIONS' gotcha now settles what a bump is owed for: two tests, SHIPPED BYTES or GRAMMAR, with the adapter case ruled explicitly (it takes test 1, fails test 2, and is owed a bump). |

**`T-104-s4` item 2 is the one rider whose preferred arm is now
WRONG, and the refutation is worth the space.** The card offered two
arms: make TASK-FORMAT's status listing a POINTER, or say why the file
keeps a copy. **The pointer arm would break the checker that closes the
gap the card is about.** `MF-05` in tools/method-evals reads
TASK-FORMAT's `status:`, `size:` and `review:` comments and requires
them EQUAL to `lib/parser/src/types.ts`'s frozen arrays; delete the
listing and MF-05 reports the method side unreadable. MF-05 landed at
T-155, after the amnesty note was written, so the card is not wrong —
it is stamped at a ref where its own answer had not arrived. Took the
second arm: the file now says why the copy is kept (the method must be
readable before a project's code exists) and names the checker as the
only thing that makes redundancy safe.

### The record-derived riders

- **The fence as a property** (card item 1, T-154's records) — rule 5,
  with the limits disclosed in the same breath: a shell-mediated write
  does not pass through the write tools and stays protocol-covered, and
  a guard that cannot find its own program fails OPEN.
- **Two-phase verification** (T-153-s5, T-154, T-155, T-156 records) —
  verifier.md step 0. The attack set is WRITTEN OUT before the diff,
  because one that was only thought is indistinguishable from one
  assembled afterwards. Three verifiers disclosed the same format
  weakness in three lanes, unprompted; that is recorded as the reason
  the discipline is load-bearing.
- **Executor facts below the marker** (T-156's record) — executor.md's
  brief rules. A duties section naming mutant numbers has already
  broken phase 1 above the line.
- **A brief may not contradict the role file it cites** (T-153-s2's
  record) — executor.md's brief rules, plus orchestrator's review
  reconciliation, where a brief is named as a review's smallest case.
- **`T-155-s4`** — the METHOD arm is taken twice over: brief row 3 now
  APPLIES the role file's reading step, and the adapter TEMPLATE says
  the role file wins. **The mechanical arm is NOT built and is routed**
  (`T-159-s4`): `brief.mjs` prints the new rule and still prints the
  unfiltered list under it, which is honest but not yet fixed. The
  root adapters lagging their own template is `T-159-s3`.
- **DISCHARGED-NOT-DECLINED** (the amnesty record's standing question)
  — TASK-FORMAT's triage encoding. The archive line says which of the
  two happened and names the commit; the case that forces it is a
  discharge with no receiving card to carry an `Absorbs:` line.
- **`T-157-s1`** — run hygiene is in all five role files under a
  heading carrying the locator word, verified by running the brief
  rather than by reasoning (it now QUOTES the section). **Its rider 1
  is RULED NO**: the advisory seat line does NOT become a contract row.
  A row must be derived from `method/roles/<role>.md`, and this line is
  derived from a CARD; making it a row would either put a card-derived
  fact in a role-file-sourced table or leave a row with no deriver,
  which the contract reports as a finding on every dispatch. Rider 2
  needed nothing — row 12 already substitutes per role.
- **`T-155-s5`** — PARTLY. The metabolism text gives a failure class a
  home (a corroboration appends to the class parent rather than
  spawning a sibling). Writing the four instances into a record is the
  integrator seat's and ADR-019 forbids any gate depending on that
  directory, so the record half stays routed exactly as the card says.

### The card's own eight, beyond the riders

Items 3 (the revert play, as a lane-protocol section rather than a
numbered rule, so no citation renumbers), 4 (guard-class
`review: independent`, field in TASK-FORMAT and act in orchestrator 5b),
5 (the suggestion metabolism), 6 (retirement conditions as
docs-protocol law 8), 7 (the trust relocation) and 8 (review
reconciliation) all landed. **Criterion 2 was applied and bit once**:
every sentence here describes a mechanism that exists at this ref, and
where one does not the text says what holds it today — the fence
guard's limits, the positive control that has to be argued rather than
run, and the vocabulary copy that is safe only where a checker exists.

### What the verifier should attack first

The gate-derivation clause and the run-hygiene sections are the two
places where new prose could contradict existing prose rather than
merely add to it — the first sits beside the verifier's own wording of
a neighbouring rule, and the second appears five times with deliberate
per-seat differences that a reader could mistake for drift.

### The gates, derived over the FORECAST path set

Derived against the tree the tip WILL have (18 paths), which is this
lane obeying the clause it just wrote into its own report spec:
GRAPH REGEN **FIRES** (1 `.rs` outside docs/) and the graph is STALE by
exactly one file, `app/src-tauri/src/agent/kit.rs (content)` — same
byte, file, symbol and edge counts. Regeneration is the CHECKPOINT's by
this project's own bullet and `docs/architecture/graph.json` is outside
this fence. BOOT GATE **FIRES** and is green. DOCS GATE **FIRES** on 6
docs paths naming all four suites, all run. METHOD EVAL GATE **FIRES**
and is green with the positive control.

## Verdicts
