---
id: T-298
title: Right-sizing at triage, the model per role from the runtime template, and bounded waiting in the arm — a card is the smallest unit that carries its own test cycle; every dispatch names its model from the template's role defaults (Opus 5 by default, the user's to change); the arm's waits are marker-driven with a ceiling
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/roles/orchestrator.md, method/runtime/supertaskr.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Superpowers' measured run put all 26 reviewers on the top tier because one dispatch named no model, and two-thirds of its wait calls were short polls that timed out; our dispatches name models by hand and our waits are hand-typed sleeps.

## Acceptance criteria

- WHEN a card is triaged THE orchestrator's rule SHALL be stated once: a card is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate, and a card larger than that is split before dispatch.
- WHEN the arm dispatches any seat THE model SHALL be read from the runtime template's role defaults and printed in the brief; an absent default SHALL refuse the dispatch, never inherit the session's model; the template's defaults SHALL read Opus 5 for every role.
- WHEN the arm waits on a lane, a bench or a battery THE wait SHALL be on a marker file or a pid with a stated ceiling, and a body SHALL show the ceiling reached reported rather than hung.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before a line of the implementation

Three criteria, restated in my own words, one line each:

1. Right-sizing is a TRIAGE rule and it is stated ONCE, in the
   orchestrator's triage step: the smallest unit that carries its own
   test cycle and is worth a fresh reviewer's gate is what a card is,
   and anything bigger is split before it is dispatched.
2. Every dispatch resolves each seat's model from the runtime template's
   role defaults, prints it in the brief, and REFUSES when the template
   names no default for a role the dispatch is filling; the session's own
   model is never the fallback. The template reads Opus 5 for every role.
3. Every wait the arm performs is on a marker file or on a pid, carries a
   ceiling it states out loud, and REPORTS the ceiling reached instead of
   hanging on it. A body drives the ceiling and reads the report.

### What was built, criterion by criterion

**Criterion 1 — right-sizing is a triage rule, stated once.**
`method/roles/orchestrator.md` step 2 now carries it: a card is the
smallest unit that carries its own test cycle and is worth a fresh
reviewer's gate; anything larger is split before dispatch and anything
smaller is absorbed into the card it belongs to. It is written as a
MECHANICAL test rather than a taste — name the test cycle the card would
owe, and if naming it needs the word *and*, it is two cards — and it
carries the inverse defect too, because a finding whose remedy sits
inside a fence somebody already holds is a follow-through rather than a
card. The step is the only place in the file that says it; a body counts
the occurrences rather than merely finding one, so a second copy reds.

**Criterion 2 — the model per role comes from the runtime template.**
`method/runtime/supertaskr.yaml` now reads Opus 5 for every one of its
five roles, with a header saying the arm reads them, that a role with no
default refuses, and that the values are the user's to change. The arm
resolves them in `dispatchLanePlan`, which is PURE — so an absent default
refuses before a card is stamped or a worktree is cut, and a body proves
the refused dispatch left the fixture tree byte for byte as it found it.
The model is printed in two places: row 1 of the brief, beside the role
it belongs to, saying which file and which key it was read from; and in
the dispatch's own lane facts, once per seat. The two seat dials still
work and are now an announced OVERRIDE — the template's default is
reported beside the value that won, because a reader shown only the
winner cannot tell a dispatch that took the project's default from one
that departed from it.

**A note on the strictness, because it is a reading of the criterion.**
The template is consulted whether or not a dial was passed. The criterion
says an absent default refuses, and that is a statement about the
template rather than about the invocation: a dial cannot make a missing
default present, and a project whose template has lost a role should hear
about it at the next dispatch rather than at the one that happens to omit
a flag.

**Criterion 3 — the bounded wait.** A new arm on the brief command:
`--await <marker>` or `--await-pid <pid>`, each requiring
`--ceiling <seconds>`. It waits on a FACT rather than on a duration, asks
before it sleeps so a fact already true costs no interval, never sleeps
past the ceiling it stated, and when the ceiling arrives it REPORTS —
naming what it waited for, how long, how many times it asked, and that
nothing was signalled and nothing taken away — with exit 1 beside the
report so a caller reading only the exit still learns the difference. A
missing ceiling is refused at usage rather than defaulted, because a
ceiling nobody typed is a hang nobody chose. The liveness probe is the
process table by way of the checkout-currency reader, which is this
project's own ruling: the obvious probe was measured wrong here in three
separate ways, and the process group and the broadcast pid are refused at
the plan.

The clock, the sleep and the question are injected, so the bodies drive
the ceiling in their own synthetic time. A body that waited on real time
would either take its own ceiling to red or assert nothing.

`method/roles/orchestrator.md` gains step 5f for the rule.

### The out-of-fence need, asked at the start and granted

The wait is only reachable from a shell as a flag, and `brief-flush`'s
arm-list body derives the command's frozen flag set and reds by name on
any flag that is neither driven by an arm nor excused with a reason. That
file was outside the fence, so the ask went out before the first line of
code with the three entries written verbatim, and the build carried on
around it. The grant arrived as two agreeing files in this lane — the
fence manifest and this card's own touches line — and was read off disk
rather than off the reply. The three flags are excused as a WAITER and
its modifier: an arm that BLOCKS is the one arm a size guard must never
drive.

### What I would flag for the verifier

- The strict reading of criterion 2 above: the template is read even when
  a dial names a model. If that is wrong, the repair is one branch.
- The arm's own CHILD PROCESSES still have no ceiling of any kind — the
  keeper leg at the base is a whole suite run through a synchronous spawn
  with every option set except the one that would bound it. That is filed
  as T-298-s2 rather than performed, because closing it adds a property no
  existing body measures.
- `docs/CAPABILITIES.md` is stale against this lane: nine new bodies in
  `brief.spec.ts` are nine new census lines. The regeneration is the arm's
  at the merge (ADR-024 decision 3), and no gate in this lane's own owed
  set reads it.
- Two method sentences point at `docs/CONVENTIONS.md` for the wait's
  spelling and that bullet does not exist yet; T-298-s1 carries it, with
  the command and its four exits measured in this lane.

### Suggested cards filed

- **T-298-s1** — the conventions bullet and the standing-state line the
  method text now points at. The pointer landed; its target did not,
  because that file sat inside another live lane's fence.
- **T-298-s2** — the arm's own subprocess waits carry no ceiling at all,
  and the keeper leg at the base is the one that pays for it.

### The method stamp, and the bump the merge performs

Two method files moved in this lane — `method/roles/orchestrator.md` and
`method/runtime/supertaskr.yaml` — so the METHOD EVAL GATE fires at this
merge and the method version moves with it. The version at the base is
`v0.1.21`, read out of the conventions' own stamp line rather than
remembered, and the verb performs the bump:

    node tools/e2e/scripts/brief.mjs --merge T-298 --bump 0.1.21..0.1.22

The three stamp files are the merge runner's own set and are not re-listed
here. The gate was run in this lane and answered exit 0 over 11 model-free
evals at the lane's tip; the merge's own run is the one that grades the
merged tree, and the block above is what tells it which version to move
to.

### The working run that found a defect, said out loud

The battery was run once before the tip below, on a tree whose only
difference was one word in one frontmatter field, and three of its four
legs came back RED for that one word: a suggested card filed from this
lane declared `size: XS`, because that is the size the method's own tier
table names for the bounded tier, and the parser's legal set is S, M and
L. Parser 388 of 389, app 1170 of 1171, the end-to-end lane four bodies
down where the frame counts the parse-error list, 60 expected against 61
received. The card's size is now S and the disagreement between the two
documents is filed as T-298-s3, which is the more interesting half: the
cheapest tier this project has is selectable only by a card the tree
refuses to hold.

That run is a WORKING run and it is not the lane's graded reading. The
graded run is the one at the tip that carries this paragraph.

### Suggested cards filed, complete list

- **T-298-s1** — the conventions bullet and the standing-state line the
  method text now points at.
- **T-298-s2** — the arm's own subprocess waits carry no ceiling at all.
- **T-298-s3** — the bounded tier is unreachable, because the classifier
  selects it on a size the parser refuses. Measured by a card that tried.

## Verdicts

### 2026-09-10 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier guarded, judged at tip `9169545120b54c6e0845efa6de1b65ed524bd3b6` against base
`d8e4a9dd07a1f9b8beaad0e808a0e6742f5a0177`. The three sealed inputs, hashed at the
start of this pass and matching the stamps file character for character:

- attack set — `sha256:78828b04996a744d4a9819ac3f56b755c9b1ae665d9a6c9c776120ea001c3f86`
- the ground, with the seat's addendum — `sha256:bfafd1f4bf255b4a844c9f970930ee24e596764db8d958c4f8e47f239e1f2dcc`
- the card at the base — `sha256:0e3f192b11d7bcc460feef0d9d04728afb8163708bdaab879c418b8fa5b1256f`

**THE FRAME I ACTUALLY HAD.** Two spawns, guaranteed rather than kept: phase 1 wrote the
attack set with no file, git or shell tools and disclosed two leakages of its own, both from
the environment and neither from this lane. This spawn read the sealed files, the role file at
the base, the card, and then the DIFF — the executor's report, its ask file, the card's notes
and the commit messages were opened only after every finding below was written. The brief's
duties section named no executor-derived figure, so phase 1 is unbroken above the line. The
brief carried a tier, so no dispatch fault to report.

#### A row per acceptance criterion

| # | criterion | verdict | the evidence that decided it |
|---|---|---|---|
| 1 | the triage rule, stated once | **MET**, one correction | The rule is in `orchestrator.md` step 2 and nowhere else in the file, and nowhere else in `method/` at all — the two other live occurrences are a research capture and a room, both records. Placement is pinned by `numberedStep(md, 2)` with step 4 as its control. Attack A1.2 (a second copy in the corpus) fails; A1.3 (present but not at triage) fails; A1.5 is unmechanizable and stays prose, as phase 1 pre-committed. A1.4 lands: the clause `AND IS WORTH A FRESH REVIEWER'S GATE` is outside the pinned needle, and a DATA mutant deleting it survives the lane's body — correction 2. |
| 2 | the model per role, from the runtime template | **MET**, two corrections | C1 run on the LIVE template of a shared clone: a sentinel written into `roles.builder` moved the brief's row-1 line to that value and back, so the print is a READ and not a literal (A2.6, A2.12 fail). C3(b) run with the default deleted AND `ANTHROPIC_MODEL` plus a second model variable set in the environment: the brief printed `model: NOT READ` and the refusal, never the environment value (A2.2 fails, and this is the arm the criterion exists for). A2.3 fails — there is no catch-all key and an unmapped role refuses by name. A2.11: every reachable dispatch entry point was enumerated and driven. A2.8 lands — the checklist for `every role` is the module's own map, not the tree's — correction 1. A2.4 lands on one boundary — correction 3. |
| 3 | bounded waiting in the arm | **MET** | C4 run as phase 1 specified it: ONE waiter, ONE ceiling, two runs differing only in whether the fact arrives. Arrives at 755 ms over 4 asks, exit 0; never arrives, and the report lands at 2002 ms against a stated 2000 ms ceiling over 9 asks, exit 1. The same two readings on the pid arm — 765 ms exit 0, and 1004 ms against a 1000 ms ceiling exit 1, with the child measured STILL ALIVE afterwards, so `nothing was signalled and nothing was taken away` is a measurement rather than a claim. A3.1, A3.2, A3.3, A3.7, A3.10 and A3.11 all fail against this arm. |

#### The controls this seat proposed, and what running them showed

**C4 is not a filter that reds everything.** It was the arrangement above, and the arm passed
it cleanly in both directions with two visibly different readings — which is what separates it
from a control that grades every implementation degenerate. C1 likewise passed and its
discriminator is real: the sentinel exists nowhere else in the tree.

**C2 was run in BOTH directions and only running both separated them.** Deleting the
load-bearing clause: the lane's own body stays GREEN (too loose — this is correction 2).
Applying a meaning-preserving paraphrase of the whole sentence: the lane's body and this
seat's both go RED. That paraphrase reading is the direction chosen deliberately here — the
standing note rules that a paraphrase of a spec-pinned sentence is a regression — so it is
recorded and it is not a finding. The DELETION reading is.

#### The three assigned corrections

**Correction 1 — `every role` is counted from the arm's own map, never from the tree.**
The lane's body iterates the parsed template and then `ROLE_TEMPLATE_KEYS`, and that constant
is exported by the module under test. Phase 1 pre-committed to grading exactly this shape,
having asked for the role listing at the base as an independent checklist. A map that quietly
loses a role satisfies itself: the loop simply runs one fewer time, and the role file left
behind is one the arm can name no model for at all. The committed body takes its denominator
from `git ls-files`, names the orchestrator as the one argued absence, and requires every other
role file in the tree to resolve. GREEN at the tip; RED ALONE under the mutant below.

**Correction 2 — the rule's second clause is unpinned, and a data mutant walks through it.**
The criterion has three clauses; the lane pins the first by needle and the third by the bare
token `SPLIT`. The second — the clause that says WHO the size is for — is pinned by nothing,
so it can be deleted from the shipped method file in silence. The property lives in prose, so
this is a DATA mutant on the live role file, per the rubric. GREEN at the tip; RED ALONE under
the mutant below, with the lane's own body staying green under the same mutation, which is the
whole finding.

**Correction 3 — a template value that is only a comment is read as the model.**
This one needs a line of the reader beside the body, and the verdict names it. `builder:` with
nothing after it and `builder:` followed by only whitespace both refuse correctly. But
`builder: # pick one later` yields the model `# pick one later`, and `builder: ""` yields a
model of two quote characters. Every YAML reader there is calls all four of those NULL, so all
four are the ABSENT DEFAULT this criterion says REFUSES the dispatch — and a user commenting a
default out is exactly how a value that is `the user's to change` gets changed. It reaches no
shell, so it is a correctness defect and not a security one. **The correction is in the mutant
block's `old` text** and it is two lines of `roleModels`. RED at the tip over the committed
body; GREEN with those two lines applied; RED ALONE under the mutant below with them applied.

```mutant
correction: every role is counted from the tree, never from the arm's own map
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: EVERY ROLE THIS METHOD SHIPS RESOLVES A MODEL, and the checklist is the TREE'S rather than the arm's own map
message: method/roles/planner.md is a role this arm can name no model for
--- old
  planner: "planner",
--- new
  plannerr: "planner",
```

```mutant
correction: the triage rule's reviewer-gate clause is pinned, not only its first half
file: method/roles/orchestrator.md
spec: tools/e2e/tests/brief.spec.ts
body: THE TRIAGE RULE CARRIES BOTH ITS HALVES — the test cycle AND the fresh reviewer's gate, and the split is an instruction
message: the rule drops the half that says who the size is for
--- old
THE SMALLEST UNIT THAT CARRIES ITS OWN TEST CYCLE AND IS WORTH A
--- new
THE SMALLEST UNIT THAT CARRIES ITS OWN TEST CYCLE, WHICH IS
```

```mutant
correction: a template value that is only a comment, or an empty quoted one, is an ABSENT default
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: A TEMPLATE VALUE THAT IS ONLY A COMMENT IS AN ABSENT DEFAULT, and so is an empty quoted one
message: a value that is only a comment was read as a model instead of refused
--- old
    const cut = raw.startsWith("#") ? "" : (raw.split(" #")[0] ?? "");
    const value = cut.trim().replace(/^(?:""|'')$/, "");
--- new
    const value = raw.split(" #")[0]?.trim() ?? "";
```

Every mutant above was planted on this bench, the spec run WHOLE, the named body seen RED
ALONE, the site restored and the restore proved by sha256 against the blob at the tip —
`dispatch-brief.mjs` back to `11f25fc7bbc2d5403bdda52ab768f8ac6b230a7b99d616dc06f4287612a208fd`
and `orchestrator.md` back to `eda88cabeb2884e9c64c5f7e1a36ff582c9a2e82fc73feea815618950a31dc01`.
Correction 3's drill was taken with its own correction applied, which is the tree the merge
will drill on. Three corrections, three blocks, no shortfall.

#### The security sweep — mandatory, and it found nothing at REJECT level

The model string flows from the template into a card's frontmatter and into printed text, and
into nothing else: every subprocess in the file is an argv array through the injected runner,
there is no shell string anywhere in it, and a value carrying shell metacharacters was carried
through as inert text. No new dependency — the `roles:` block is parsed by hand precisely
because this repository ships no YAML reader on that path. No endpoint, no secret, no key. The
unsafe-default question is the one the card is about and the answer is right in both places: a
missing model REFUSES rather than defaulting, and a missing ceiling REFUSES rather than
defaulting to infinity. Two residual hazards belong to the caller and are filed as a card, not
held against this diff: a marker left over from a previous run satisfies a wait instantly, and
a marker path an unrelated process can create ends a wait early.

#### What I re-measured, and what stayed a claim

The report's figures are corroborated where I could re-derive them: the four graded body
counts, and the two fenced specs at 117 bodies scoped. The whole-battery run at the tip moved
the e2e count from 912 at the nearest whole reading in the ground file to 921 — plus exactly
nine, which is the nine bodies this lane added, so none of them is skipped or unregistered and
attack X2 fails. The working run that found the size defect was taken on a tree that no longer
exists and stays a CLAIM; the commit that fixed it and the card it produced are both in the
diff and both check out. The lane's disclosure that the census is stale is confirmed from both
ends — CURRENT at the base, STALE at the tip — and the conventions rule that regeneration is
the integrator's, so it is not a finding here.

The `size: XS` the lane wrote and then withdrew was handled the way the method asks: the
parser refused it, the lane took the refusal as the more interesting half and filed it rather
than working around it. No undeclared surface — the diff's ten paths sit inside the armed six
plus the always-writable cards directory, the ask that widened the fence was written before the
first line of code and granted, and the one signature widening in the file is a direct enabler
of the criteria's own bodies and is behaviour-preserving for every numeric caller.

#### The suites, at the tip judged

| leg | exit | bodies | verdict |
|---|---|---|---|
| parser | 0 | 389 | GREEN |
| app | 0 | 1171 | GREEN |
| rust | 101 then 0 | 655 | RED once, GREEN on the single re-run |
| e2e | 0 | 921 | GREEN |

`brief.spec.ts` 111 passed and `brief-flush.spec.ts` 6 passed, each run alone by name. Method
evals exit 0 over 11 model-free evals. The card preflight exit 0. The whole-tree docs gate exit
0 over 0 findings.

**THE RUST RED, ATTRIBUTED BY NAME.** One body, `the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`,
failed once and passed on the single re-run the standing rule allows — it timed a process-group
reap at 25 ms of a 900 ms grace, on a machine that was concurrently finishing this bench's
install and carrying another lane. It is timing-sensitive by construction, this diff touches no
Rust and no reaping code, and the lane's own graded run had the same 655 bodies green. NOT
attributable to this diff; worth a name in the standing intermittents, which is why it is
written out here in full.

#### Meters

- **wall clock by phase**: seals and the sealed reading 10 min · role file, card and the whole
  diff before any note 35 min · the attack run — boundary probes, the two controls, the entry
  points 40 min · the whole battery 55 min including the rust re-run · three bodies written and
  three mutants drilled 45 min · notes read, verdict and cards written 30 min.
- **context consumed**: roughly 190K of a 1M window.
- **model**: `claude-opus-5@subagent`, set at session start and never switched.
- **suites run**: the whole battery once at the tip plus the rust leg once more; the two fenced
  specs alone by name; the method eval gate; the card preflight; the whole-tree docs gate; the
  census-currency gate; and the three mutant drills, each over the whole of `brief.spec.ts`.
- **bodies graded**: 3136 across the four legs at the tip, of which 9 are this lane's own and 3
  are this verdict's.
- **mutants drilled**: 3 planted, 3 RED ALONE, 3 restored and proved by sha256; one of them a
  DATA mutant on live method text, and one of them the paraphrase reading run beside it.
- **cards filed**: 2 — T-298-s4 and T-298-s5.
