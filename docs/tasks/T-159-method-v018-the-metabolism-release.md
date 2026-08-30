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

### 2026-08-30 — verifier claude-opus-5@subagent — **APPROVED**

Independent hand. Every figure below was derived by this seat at the ref
it names; nothing is transcribed from the notes. Suites run in the lane
worktree `/Users/ujju/Projects/nputer-T-159`, exits read UNPIPED. Base
`9a8a2e9`, tip `6b37f57`.

**DISCLOSURE OWED BY `method/roles/verifier.md` AT THIS TIP, AND PAID
HERE.** The brief carried the executor's report in the same message that
dispatched the verification, below a `===` marker with a two-phase
instruction — so the blindness was a discipline this seat kept by hand,
not a property the dispatch guaranteed, which is exactly what the new
step 0 says to expect and to say. **And the duties section above the
marker named executor-derived specifics**: an expected e2e count
(`313`), and that suggestion `s1` had been refused by the parser while
`s4` existed. Under the clause this release lands, that broke phase 1
above the line. It was contained: the attack set was written to disk
**before** the diff, the notes or any suggestion card was opened, and it
is reproduced in the report to the integrator. The 313 was independently
re-derivable from `docs/CAPABILITIES.md`'s own census header, and the
`s1`/`s4` leak cost the surprise of two routings, not the attack on them.

**AC 1 — the three stamps, met, and the trap re-drilled rather than
read.** `9c0da79` carries all three in one commit: `kit.rs`
`METHOD_SNAPSHOT_VERSION` `0.1.8`, `docs/CONVENTIONS.md:328`
`currently v0.1.8`, `method/interview/plan-interview.md:26` `(v0.1.8`.
Drilled in a detached worktree at `6b37f57` with its own
`CARGO_TARGET_DIR`, one side at a time. **Mutant A** — const alone at
`0.1.7`: **exit 101**, panic at `kit.rs:485`, *"plan-interview.md's
Output heading no longer stamps v0.1.7"*, which is the ordered-asserts
trap in the flesh: repairing the file the panic names moves the doc
BACKWARDS and earns a second red. **Mutant C** — const and the
plan-interview heading both at `0.1.7`, satisfying the first arm:
**exit 101**, panic at `kit.rs:497`, *"docs/CONVENTIONS.md's first
gotcha no longer says 'currently v0.1.7'"*. The CONVENTIONS arm is
REACHABLE, which the gotcha's own T-089 measurement never separately
showed. Both restorations sha256-matched `6b37f57` and the drill tree
was clean. The eval clause is met by the bump commit's own message,
which carries the `--bump` block, NAMES the replay runner, and states in
as many words that the 1.00 rate is not a measurement.

**AC 2 — prose does not run ahead of reality, checked item by item, and
the two places it could have are the two places the text hedges.** The
fence-as-property text discloses its limits and then delegates the full
list to the guard's own decision function rather than claiming
completeness; the vocabulary-copy paragraph makes the copy safe
CONDITIONAL on a mechanical checker, and this seat proved that checker
live (below). `review: independent` adds no new value — it is already in
`TASK-FORMAT`'s frontmatter block and in the parser, which is why no
parse moved.

**AC 3 — adapters, met.** `method/adapters/AGENTS.md` and
`method/adapters/CLAUDE.md` differ on line 1 only; `cmp` of the tails
is byte-identical, sha256
`34a8111bf9cef046a29e0c8b1a2243b76a1e4ca3af1fd1367ec2d26e9e09791e`
each. The two cargo bodies that assert byte-identity with `KIT_FILES`
are green in the run below.

**THE BATTERY, at `6b37f57`, exits unpiped.** `cargo test` from
app/src-tauri **525 passed / 0 failed / 4 ignored, exit 0** — lib body
200 tests in **4.12s**, read against the cache-cliff band FIRST and
green under it. `npx vitest run` from lib/parser **314/314, exit 0**;
`npx tsc --noEmit` **exit 0**. `npm run build` from app/ **exit 0**;
`npm test` from app/ **1015/1015, exit 0**. The full e2e lane at
`NPUTER_E2E_PORT=15912` (lsof `-sTCP:LISTEN` zero rows immediately
before binding) — header *"Running 313 tests using 1 worker"*,
**313 passed, exit 0**, and `git status` clean afterwards, so the seven
planted control bytes were restored. `npm run lint:tokens -- --selftest`
**exit 0** (65 TOKEN + 4 CONTROL samples, 89 walk-policy checks, 9
evidence-floor checks); `npm run lint:tokens` **exit 0** (TOKEN 155
files, CONTROL 896 tracked text files); `npm run lint:docs` **exit 0**;
`npm run typecheck` **exit 0**.

**THE METHOD EVAL GATE, all three arms.** `node
tools/method-evals/run.mjs` **exit 0 over 6 bodies**;
`--selftest` **exit 0**; `--bump` under the replay runner **exit 0**
(6 model-free, 4 model-in-loop). The negative control was run too:
`--bump` with `NPUTER_EVAL_RUNNER` unset **exits 3** and prints the
did-not-run block — so the block in `9c0da79` is a claim that had to be
earned by pointing at a runner.

**THE VERSION CENSUS, RE-DERIVED OVER THE WHOLE TREE AND NOT THE
FENCE.** `git grep -n "0\.1\.8"` and `"0\.1\.7"` from the root at
`6b37f57`, lockfiles excluded, every hit classified by hand. Three
references CLAIM the current method version and did not move, all three
outside `[method/, docs/CONVENTIONS.md, app-agent]`:
`docs/ARCHITECTURE.md:28` (`built (v0.1.7)`), `docs/ROADMAP.md:22`, and
`docs/architecture/components/C-01-method.md:9`, **which read `v0.1.6`
and was therefore already one version stale BEFORE this bump**. All
three are routed as `T-159-s2`; this seat's independent census agrees
with that card path for path. Every Rust and TypeScript reference is
DERIVED from the const rather than spelled. The `methodVersion: "0.1.5"`
literals in the app and e2e fixtures were correctly left: they need A
version string, not THE current one. The records — checkpoints, decision
records, the rooms ledger, `CONVENTIONS`' own v0.1.7 history entry and
the older cards — keep their v0.1.7 spellings correctly as append-only
history and are classified, not flagged.

**THE EVALS PROVEN TO FIRE ON THIS RELEASE'S OWN TEXT.** Four
degradations, producer-side, in the detached drill at `6b37f57`, each
run against the FULL model-free set, each restoration sha256-proved
against `6b37f57` with the drill tree clean afterwards. **4-for-4 red.**
(1) `method/roles/verifier.md`'s opening reworded to `# The verifier
role` → **MF-03**, exit 1, naming the file. (2) A cross-reference inside
a sentence THIS RELEASE ADDED to `method/roles/executor.md` —
`tasks/TASK-FORMAT.md` → `TASK-FORMATS.md` in the blindness-guarantee
bullet → **MF-04**, exit 1, *"points at method/tasks/TASK-FORMATS.md,
which is not in the method tree"*, over 14 distinct targets. (3) One
status word drifted in TASK-FORMAT's block, `parked` → `shelved` →
**MF-05**, exit 1, naming both sides. (4) **The T-104-s4 refusal
reproduced rather than believed**: TASK-FORMAT's vocabulary listing
replaced by a POINTER — the arm that card preferred — → **MF-05**,
exit 1, the method side reported unreadable. The refutation holds, the
arm the lane took is the only surviving one, and the paragraph it wrote
names the checker that makes the copy safe.

**THE RIDERS, five spot-verified from the cards' own text at my ref.**
`T-152` (taken first): its arm 1 asks that executor.md step 1 gain
TASK-FORMAT's ceremony table *"with the reason: you must know whether
you are your own integrator before you finish"* — the landed paragraph
is that arm including the reason clause, it obeys the card's caution
(the safety line is explicitly left standing), and its cross-reference
resolves: executor.md step 6 is the stamp step and TASK-FORMAT's
`## Ceremony by size` carries the note about a size-S card still owing a
verifier. Its arm 2 was already built — `brief.mjs` row 11 prints
`ceremony row M`, confirmed by running it. `T-052-s5` (my chosen taken
rider): arm 1 landed as integrator.md's citation vocabulary, and the
sibling citations it governs are CORRECT under the new rule —
`lane-protocol.md:118` says *"integrator.md rule 1"* for the
in-section detect-and-refuse rule and `:330` says *"step 1"* for the
two-commit shape, which is what those two lists actually hold.
`T-126-s5`'s residual: **verified DISCHARGED at the base**, not at the
tip — `git show 9a8a2e9:method/lane-protocol.md` already carries *"A
CARD'S OWN FILE IS NEVER PART OF ITS OWN FENCE"* and *"a lane writing to
its own card is NOT a fence breach"*, so the park-back with a reason is
right. `T-132-s6`: I ran the grep myself — `command grep -in "surface"
docs/CONVENTIONS.md` returns **3 rows at `6b37f57`, none of them the
enumeration**, so the card's literal site ("beside the other five")
does not exist and the five live only on T-128's cards; the landed rule
4 names those same five (index, ref namespace, directory, checkout,
board) beside the two machine-scoped ones, which is the ask in the place
the class belongs. `T-104-s4` item 2: measured above.
**And the census: FOURTEEN parked cards name T-159**, derived here by
filtering `docs/tasks/T-*.md` on `status: parked` — the standing
"twelve" is wrong by the same arithmetic the notes give.

**THE HYGIENE QUESTION — APPROVED, and the executor's own reason is the
weaker of the two available.** Five per-seat `## Run hygiene` sections
landing in the bump that also touches docs-protocol law 5. **First, law
5 does not reach these files.** Law 1 enumerates governing documents as
*"the state, roadmap, architecture and conventions files"*; the role
files are method files, and law **7** is the law addressed to them —
and it points the other way, putting per-seat reading obligations in the
seat's own file. **Second, they are not one lesson five times.**
Measured at `6b37f57`: 573 / 711 / 980 / 765 / 829 bytes, and the
per-seat clauses carry OPPOSITE values — the two standing seats are told
to COMPACT BETWEEN DISPATCHES and the planner is told *"Do not compact
to save tokens"* with its own reason, which one shared section cannot
say. The verifier's *"keep the subagent on the phase-2 side of the
line"* is a blindness constraint that exists in no other seat.
**Third, and this is the half that answers the backwards worry:
I measured the tooling.** `brief.mjs` does quote the acting role's
section verbatim, sourced `method/roles/<role>.md section Run hygiene` —
seen in this card's own advisory block. But `--role verifier`,
`--role planner`, `--role integrator` and `--role orchestrator` all
**exit 3** at `6b37f57` (*"found 0 tables headed …"*), because only
executor.md carries the four-column contract table. **So the tool can
only ever print ONE of the five today.** Four of the five sections were
therefore not shaped by tooling at all — no program demanded them and
none can emit them. The worry is refuted on its own terms. What IS
missing is a checker for the four sentences the five share, which is
the release's own TASK-FORMAT argument turned on the release's own diff;
filed as `T-159-s5`, non-blocking.

**GATES, derived over the merge forecast at `6b37f57`.**
`git merge-tree --write-tree 9a8a2e9 HEAD` **exit 0** (read before the
substitution was used), tree `2780e4a`, **18 paths** — main has not
advanced, so the forecast and the branch agree. **GRAPH REGEN FIRES**
and `index --check --root ../..` **exits 1**: STALE by exactly one file,
`app/src-tauri/src/agent/kit.rs (content)`, with byte, file, symbol and
edge counts identical on both sides (1022964 / 189 / 2160 / 2114) — the
REAL-red signature, not the `--root` false red. **This is the
integrator's at the checkpoint by this project's own bullet, and
`docs/architecture/graph.json` is outside this fence; it is named here so
it cannot arrive detached from its cause.** **BOOT GATE FIRES** and is
green: `NPUTER_BOOT_PORT=15913 npm run boot:check` **exit 0** with both
`[nputer]` lines, the port lsof-read at zero rows immediately before,
and the guard's own refusal confirmed first (`NPUTER_BOOT_PORT=1420`
**exit 3**, probing and spawning nothing). Port 1420 was read once,
read-only, and never probed: `node` pid 19746 on `[::1]:1420`. **DOCS
GATE FIRES**, **exit 1** over 6 docs paths naming all four suites — all
four are in the battery above. **METHOD EVAL GATE FIRES** and is green
with its positive control.

**SECURITY SWEEP — clean.** The diff is prose plus one `&str` const. No
dependency added, no secret, no new input path, no endpoint, no default
loosened. The one security-adjacent change is a DISCLOSURE — the fence
guard's limits stated in the method text — which narrows the belief a
reader may hold about the guard rather than widening what the guard
allows, and it points at `decide` rather than restating it.

**TWO THINGS THE INTEGRATOR SHOULD CARRY INTO THE CHECKPOINT.**
(1) `9c0da79` in isolation is RED: I checked it out detached, built its
own `app/dist`, and `npx vitest run` from app/ gave **1 failed / 1014
passed**, the body being `test/genesis-derive.test.ts`'s BANKING_MAP
cell comparison. The tip is green because `6b37f57` withdrew the clause,
and the figure CONVENTIONS now carries for that lesson is exactly right
— but the bump commit is the one whose message carries the eval block
and it is also the one that reds a suite, which matters to anyone who
cherry-picks or bisects to "the bump". Recorded, not charged: committing
first and withdrawing after is what this project's own drill rule asks
for. (2) `docs/CONVENTIONS.md` is **126,280 bytes at `6b37f57`**, up
**6,688** from **119,592** at `9a8a2e9` — **91.6% of the 137,928-byte
warn line, 11,648 bytes of headroom**, fail at 165,513. The budget
HOLDS and `lint:docs` exits 0; it is stamped here because the CONVENTIONS
train is the next thing queued behind this card.

**FILED, and one deliberately NOT filed.** `T-159-s5` — the five
hygiene sections share a four-sentence skeleton with no checker, class
parent `T-157-s1`, disposition hint on the card. **NOT filed:** the
`--role <non-executor>` exit 3. I re-derived it as a live fact and then
obeyed the rule this release just landed — SEARCH BEFORE FILING — and
found `T-133` already owns it, corrected in place and re-measured at
`1b626e2`. A sibling card would have been the duplicate that rule
exists to prevent, so this paragraph is the corroboration and there is
no new file. Also considered and rejected as noise: law 8 shipping no
retirement condition for itself — a law is not a machine under law 8's
own definition, and this release adds no machine.

**GATES RE-RUN AT THE TIP THIS VERDICT CREATED**, because appending it
and filing `T-159-s5` are writes into `docs/tasks/`, which is a code
input: results recorded in the commit that carries them.

**APPROVED.** No corrections assigned. Status left at `verifying`; the
graph regen above is the checkpoint's standing obligation, not a
correction to this lane.
