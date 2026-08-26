---
id: T-131
title: The ceremony costs about 930k tokens per merged card and tonight it caught no behavioural defect the executor's own drill had not — five changes, ranked by evidence, for @human to rule on
feature: F-01
milestone: 4
priority: 5
size: M
status: planned
blocked_by: [T-104]
touches: [method/, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**Filed by the architect on 2026-08-25, from the first session that ran
six lanes concurrently.** @human asked what this project's own
development had taught that should change how the method works for a
user starting a NEW app, and how the process could be faster, cheaper or
more intelligent at the same quality. This card is the answer with the
measurements attached, and **it is `@human: yes` because adopting any of
it changes how every future card is dispatched.**

## @HUMAN'S RULING — 2026-08-25: ALL FIVE ADOPTED

**Asked which of the five to adopt, and shown the architect's objection to
item 5 in the question itself, @human adopted ALL FIVE, item 5 included.**
The adoption decision this card called its deliverable is therefore made,
and this card becomes the record plus the method prose. The mechanisms are
separate cards, because prose is precisely what failed:

| item | mechanism | card |
|---|---|---|
| 1 — briefs carry the ask, never the state | a command that emits the contract's rows, each from its named source | **`T-133`** |
| 2 — STATE's volatile sections derived | same command; the lane list is the row both consumers get wrong | **`T-133`** |
| 3 — a convention that could be a gate should be a gate | a writing rule, not a build | **`T-132`** (prose) |
| 4 — fences name paths; slugs are shorthand | disjointness over expanded path sets | **`T-134`** |
| 5 — ceremony scales with blast radius | the graph must first be able to answer it | **`T-135`** |

**ITEM 5 CARRIES A PREREQUISITE THAT WAS NOT KNOWN WHEN THE QUESTION WAS
ASKED**, and it is not an objection but a fact: `T-126-s4`, verified three
ways this session, established that the indexer records `use` imports only,
so a Rust `mod` declaration produces **zero edges** — and `T-010-s6`
records that Rust emits no `call` or `type_ref` edges at all. **A
blast-radius number computed against today's graph would under-count Rust
dependencies silently, marking risky cards cheap.** `T-135` carries that
work and states that shipping the rule before the graph can answer it
would be worse than not shipping it.

**AND ITEM 1'S FRAMING IN THIS CARD WAS WRONG, WHICH `T-132` CORRECTS.**
It is not a rule to adopt. `method/roles/orchestrator.md` already requires
that a brief be *"assembled to the contract in roles/executor.md — every
row, from the sources that row names."* **The contract exists and the
architect violated it all night.** The remedy for a violated contract is a
check, not more prose — which is why item 1's mechanism is a command.

## @HUMAN'S RULING ON ITEM 5 — 2026-08-26: TWO AXES, AND THE HANDOVER IS AUTOMATIC

**@human ruled that `size:` and blast radius are BOTH kept, because they
answer different questions**, and supplied the transition rule the
architect had missed:

- **`size:` keeps meaning DURATION** — how long the work is. That is why
  an L card earns a planning pass.
- **BLAST RADIUS governs CHECKING** — whether a verifier is owed and
  whether the integrator must be a third hand.

**@human's observation is the part that resolves it**: *"in the beginning
of development there is not much blast radius."* That is correct and it is
not a defect in the metric — **a young codebase genuinely IS cheap to get
wrong**, and the number reporting so is the number working. **Size carries
the weight early; blast radius takes over on its own as the graph deepens,
with no second ruling needed.**

The architect had framed advisory-until-it-discriminates as a workaround
for a rule that cannot yet sort. **It is not a workaround — it is the
correct behaviour, and @human's framing is why.** `T-135` Half B is
unblocked on this ruling.

## THE MEASUREMENT

Subagent token totals, read from completion notices across **16 runs**
this session:

| role | n | sum | mean | min | max |
|---|---|---|---|---|---|
| executor | 5 | 1 681 984 | **336 396** | 204 327 | 468 658 |
| verifier | 5 | 1 282 140 | **256 428** | 192 604 | 304 906 |
| integrator | 5 | 1 364 015 | **272 803** | 238 217 | 335 000 |
| triage | 1 | 312 046 | 312 046 | — | — |

**Total 4 640 185 tokens. A full three-hand ceremony averages 865 627.
Five cards merged, so ≈928 037 tokens per merged card** — and that
excludes the architect's own briefing, sequencing and recovery work,
which is not instrumented.

**Two caveats, stated rather than buried.** The five executors are not
the same five cards as the five verifiers and integrators — T-107's and
T-102's executors ran before the measuring window — so "per card" is an
average over the session, not a per-card figure. And one integrator
total is an estimate: its duplicate completion notices reported
331 234 / 328 556 / 340 716 for the same run, so the accounting is not
exact to the token.

**For scale: `T-126` landed one `mod` declaration and one command
registration.** `T-129`, which was genuine engineering, spent 468 658 in
the executor alone. The ceremony does not currently price by what the
card is worth.

## WHAT THE CEREMONY BOUGHT, COUNTED HONESTLY

**Five verifications tonight, zero rejections.** That is not "the
verifier is useless" — T-107's proved a criterion was unsatisfiable
inside its fence and forced a disclosure; T-033's ruled a mid-flight
rebase legitimate and caught a figure printed by neither engine; T-116's
found the regen reconciliation wrong twice. **But look at the KIND**:
a stale forecast, a wrong attribution, an incomplete drill table, a false
universal in a comment, a shape-six claim whose evidence did not hold.
**Those are record defects.**

**The behavioural defects were found by the executors' own poison
drills**, every one: T-129's symmetric-cardinality body (`is_some()` and
`is_none()` both counted 1), its two-frames-per-source-level boundaries
(off-by-one mutants killed nothing, so two bounds were pinned only to
within two while their names claimed precision), and its `default()`
survivor that no extractor body could see.

**So the drill is doing the engineering and the second hand is largely
auditing the paperwork.** That should change what the second hand is
FOR, not whether it exists.

## THE FIVE CHANGES, RANKED BY HOW WELL THE EVIDENCE SUPPORTS THEM

### 1. A BRIEF CARRIES THE ASK AND THE JUDGEMENT, NEVER THE STATE

**Strongest evidence in the card.** Every dispatch brief written this
session contained at least one error, and **every error was transcribed
state** — a figure without its ref, a lane list (wrong four times), a
gate prediction, and twice a brief contradicting a ruling its own author
had made hours earlier. **Every agent that ignored the brief and derived
from the repository was right.**

The definitive case: **three fixture-reconciliation lists were produced
by three hands for one card, all different, and all correct** — one
baseline differed because T-033's *checkpoint* moved it after the
verifier measured against T-033's *merge*. Each was right at the ref
where it was taken.

**AND THE FAILURE MODE IS WORSE THAN STALENESS — IT REACHES
FABRICATION.** T-104's verifier found that its brief asserted *"the lane
notes its owed-suite count went 2 → 4 … and it re-ran everything at the
final tip. Verify it did."* **The lane records neither.** The move was
real — the verifier established it by running the gate itself — but the
architect had lifted it from the lane's conversational report and written
it into a brief as though it sat in the committed record. **A verifier
trusting the brief would have ticked a box.** That is not a figure going
stale; that is a fabricated citation, produced by the same act of
transcription.

The same verifier caught the sharper version: the brief attributed a
board split to the lane which the lane never derived — *"it is the
brief's own figure wearing the lane's name and carrying no ref."* **That
is ruling FIVE's figure case, committed inside the brief commissioning
ruling FIVE.**

**The rule the project already applies to cards** — *cite the shape, not
the tally* — **has never been applied to briefs.** Adopt it: name the
card, the fence, the judgement calls, and the COMMANDS to derive
everything else. It removes an error class and cuts brief size by more
than half. **A thin brief was trialled on T-108's integration and that
integrator was asked to report whether the omission helped or hurt** —
read its answer before ruling.

**A brief SHALL NOT cite the lane's own record for anything the brief's
author has not read IN the record.** A lane's conversational report and
its committed notes are two different documents, and only one of them is
evidence.

## TWO LIMITS OF THE THIN FORMAT, FOUND BY THE INTEGRATORS IT WAS TRIALLED ON

**Both were found by the format's own subjects, which is the point of
having asked them.**

**LIMIT ONE — it does not protect an ARGUMENT.** T-104's integrator: a
brief of mine claimed *"T-091 has landed, so the reader will red if anyone
breaks the bullet — that reader is the whole point."* False. **The reader
guards FIGURES**, and neither routed edit changes a figure, so the suite
passes whether the new prose is right or wrong. Its diagnosis, which is
the rule: **"a thin brief carrying no figures can still carry an argument,
and an argument is not one command away."** Removing transcribed state
removes one error class and leaves reasoning errors entirely untouched.
Filed as `T-104-s5`.

**LIMIT TWO — ATMOSPHERE FIGURES SLIP THROUGH, AND THEY ARE THE WRONG
ONES TO GET WRONG.** T-126's integrator found a transcription in a brief
that promises none: *"the ratio swung 8:5 to 1:5"*, *"up to 20.75×
tonight"* — **numbers carried for colour rather than for use.** Its real
ratio was 6.33×. The load-bearing figures had all been removed and the
decorative ones survived precisely *because* they were decorative and
nobody, including the author, treated them as claims.

**A figure carried to make a point vivid is still a figure, and it is the
one nobody checks.** The rule needs the clause: **a brief carries no
number at all, including the ones it is not relying on.**

**THE FORMAT STILL WON, AND ALL THREE SUBJECTS SAID SO.** *"I needed
nothing you withheld. Every figure was one command away."* — and from the
third: *"it saved the thing that mattered … what only you could carry was
exactly the work."*

### 2. STATE'S VOLATILE SECTIONS SHALL BE DERIVED, NOT WRITTEN

STATE's lane list was wrong repeatedly and four briefs copied the error
forward. The cause is measurable: **detached scratch worktrees sit at
lane-shaped paths and outnumber real lanes better than two to one**
(15 worktrees against 6 lanes at one point tonight). Two agents
independently arrived at the same fix — **filter on the branch, never
the path** — which means it is derivable and therefore should not be
typed.

STATE should carry only what cannot be derived: the narrative, the
traps, the owed @human looks. Counts, lane lists and board state come
from a command. This also removes the "board-truth window", now observed
**eight** times.

### 3. A CONVENTION THAT COULD BE A GATE SHOULD BE A GATE

The tenth triage found **five defect classes that `docs/CONVENTIONS.md`
names with worked examples, and not one is enforced by a command.**

Prose is re-read by every agent on every dispatch — expensively and
lossily. A gate runs once and is exact. **T-091 turned the range rule
into a reader this session and it paid immediately**: the architect
reached for the forbidden two-dot form later the same night, on a real
branch, and it reported a lane deleting a 1 928-line file it had never
touched.

**AND THE CONFIRMATION MUST NOT BE A SUMMARY STATISTIC.** Two
integrators hit a second graph staleness in which *every headline figure
was identical on both sides* — same bytes, files, symbols and edges —
because the fixtures being reconciled are themselves indexed. A
byte-count confirmation would have shipped it. **Where verification
artifacts live inside the corpus they verify, confirming by summary
statistic is unsound.**

### 4. FENCES AT PATH GRANULARITY; SLUGS ARE SHORTHAND

**Zero real fence collisions occurred this session.** Every block was a
naming collision: 21 of 36 planned cards named `app-shell`, nine named
nothing else, and `T-126` — priority 5, needing one `mod` line in
`lib.rs` — waited hours behind a registry lane that never opened that
file.

Two fences were narrowed by hand this session (`T-108`'s
`[docs/tasks/]`, `T-116`'s app-test question) and **both narrowings were
correct and neither caused a collision.** A card that knows its files
should name them; a slug should mean "all of this component" rather than
being the only expressible unit.

**Related and already filed**: `T-031-s4` — `app/vitest.config.ts`
collects `test/**` only, so **five of eight slugs cannot hold a
TypeScript test assertion at all.** That has cost a rejection, an unmet
shipped criterion, an unbuildable card and a lane that built nothing.
One line fixes it.

### 5. CEREMONY SHOULD SCALE WITH BLAST RADIUS, NOT CARD SIZE — LEAST PROVEN, MOST INTERESTING

S/M/L is a proxy for risk and a poor one. **`T-126` was "S" and was the
difference between a feature existing and not existing.** A card
touching a file nothing imports is cheap to get wrong; a card touching a
file twelve things import is not.

**nputer already computes the thing that predicts risk and does not use
it.** The architecture map knows each file's dependents. Ceremony keyed
to that number would spend the 865k where it earns and skip it where it
does not.

**THE CAVEAT IS THE POINT OF THIS ENTRY**: it is one session's data,
five merges, and one unusually introspective repository. **It should not
change dispatch until an ADR argues it with a measurement**, which is
why it is ranked last despite being the most valuable if true. It also
has a known blind spot — `T-126-s4` found that the indexer records `use`
imports only, so **a Rust `mod` declaration is invisible to the graph**,
and a blast-radius number computed today would under-count.

## WHAT SHALL NOT CHANGE, AND WHY IT IS IN THIS CARD

A proposal that only subtracts is not a design. These earned their cost
this session and the card records them so a later reader does not trim
them by symmetry:

- **The POISON DRILL.** Every behavioural defect found tonight came from
  it. It is the expensive thing that works.
- **BOUNDED READ** — the verifier reads the card at its BASE REF and
  writes its attack set down before opening the lane's notes. It is
  cheap and it is what makes a verdict credible.
- **FIGURES CARRY THEIR REF.** Vindicated repeatedly, including against
  the architect, three times in one card.
- **DISCLOSURE OVER SILENCE.** T-107 shipping with a criterion unmet,
  named and routed, was right.
- **ONE TASK, ONE BRANCH, ONE WORKTREE.** Four agents died on
  infrastructure tonight — two network errors, two stalled streams — and
  **not one lost any work**, because each had its own branch and its own
  tree. That property was never designed for crash recovery and paid for
  itself anyway.

## WHAT A NEW USER HITS THAT THIS PROJECT HIT LATE

- **Almost all of tonight's cost was history-navigation** — a
  1 300-line conventions document, 250 task files, 80 open findings.
  **A day-one project has none of it, and this ceremony would crush a
  three-card project.** Genesis should start minimal and escalate.
- **Their first "app" component will become C-05.** Ours swallowed the
  shell, the leaf utilities, every test, the Tauri plumbing and the UI
  primitives — twenty path groups under one word — which serialised most
  of the board and caused eight of nine registry cycles. **A node holding
  both an entry point and shared leaves cycles with everything between
  them by construction**, and genesis can warn about that shape.
- **Known-defect debt taxes every lane and is never the current card.**
  `T-120-s3` cost four separate lanes in ONE NIGHT and had waited six
  checkpoints. "This has taxed N lanes" is measurable and should feed
  priority.
- **@human looks accumulate with no batching.** Five are owed right now.
  A user cannot be interrupted per-card.

## Acceptance criteria

- **DISCHARGED 2026-08-25: @human adopted all five.** What remains of
  this criterion is that **item 5 still owes its own ADR** — not as a gate
  on the decision, which is made, but as the reasoning, and it SHALL carry
  the architect's recorded objection and what would falsify the change.
  `T-135` holds that obligation.
- **THIS CARD SHALL CARRY THE METHOD PROSE AND NONE OF THE MECHANISMS.**
  Four mechanism cards exist (`T-132`, `T-133`, `T-134`, `T-135`). **IF
  this lane finds itself writing a check, it is in the wrong card.**
- **EVERY FIGURE IN THIS CARD SHALL BE RE-DERIVED AT THE EXECUTING
  LANE'S OWN REF**, not carried forward. It is a card about transcribed
  state and it must not become an instance of its own subject. **The
  token table is the exception and SHALL be marked as a historical
  measurement with its window named**, because it cannot be re-measured
  after the fact.
- **THE ADOPTED RULES LAND IN `method/`, NOT IN A CARD.** `T-104` exists
  because nine ratified rulings lived everywhere except the file that
  ratifies them, and this card SHALL NOT reproduce that failure. This is
  why it is `blocked_by: [T-104]`.
- **THE "SHALL NOT CHANGE" LIST SHALL SURVIVE INTO THE METHOD** wherever
  a rule is edited near it, with its reason. A future reader trimming
  ceremony by symmetry is the predictable failure mode.
- IF any proposal is rejected THEN the reason SHALL be recorded beside
  it, so "we decided" cannot later be read as "we forgot" — the same
  discipline `T-107`'s enumeration required.

Verification: headless. **This card adds no test body and that is stated
here rather than left silent** (the drill's clause about bodies that
cannot be poisoned). The DOCS GATE fires on `docs/CONVENTIONS.md` and on
this card — run `node tools/e2e/scripts/docs-gate.mjs <path>...`
**directly, never through `xargs`**, and record which commands it owed
and each exit. **`docs/CONVENTIONS.md` is read by a reader that parses
the RANGE RULE bullet since T-091** — if this card edits that file, run
`npm test` from `tools/e2e/` and state the count. `cargo test` is owed if
the method version moves, because `kit.rs` reads the method files off
disk. **@human: YES — the adoption decision is the deliverable, not the
prose.**
