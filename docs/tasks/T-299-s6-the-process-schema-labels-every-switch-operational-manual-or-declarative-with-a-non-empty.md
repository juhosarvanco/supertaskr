---
id: T-299-s6
title: "The process schema labels every switch `operational`, `manual` or `declarative` with a non-empty `manualAction` for the manual ones — an operational label requires behavioural evidence that changing the value changes the arm's behaviour, not only a read site — the terminal lists the label and refuses to edit a declarative switch with its file unchanged, and the reference carries the labels; the app adopts the labels in its authorized amended T-301 resumption after this card lands, and the skill adopts them in T-302"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: done
suggested_by: "the recovery candidate of 2026-09-11 carried these labels inside an expanded T-301; the owner ruled on 2026-09-12 that the app is a mirror first and that the pieces of that candidate return as small cards; the Codex orchestrator's review of 2026-09-12 on evidence for operational labels"
blocked_by: [T-317, T-300-s6]
touches: [method/runtime/process-schema.yaml, lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

### What was measured

The schema's `reads:` field names `processLedger` for most switches, which the schema itself explains means no arm branches on them; a user of the terminal cannot tell an executable control from a recorded intention. The arm has a read-site scanner over its own source (`switchReadSites`), pinned by a brief spec body; a read site shows the value is read, not that changing it changes behaviour. The recovery candidate's labelling counted six operational rows and relabelled one switch the arm reads as declarative; that count and that relabelling are claims for this lane's bench, not facts carried over. Refusing to edit a declarative switch is a new product behaviour.

## Acceptance criteria

- WHEN the schema declares a switch THE row SHALL carry `implementation` as one of `operational`, `manual` or `declarative` and `manualAction` as a string, non-empty and actionable for a manual switch and empty otherwise; the parser SHALL refuse a missing or unknown label and an empty manual action.
- WHEN a switch is labelled `operational` THE lane SHALL show behavioural evidence: a body that changes the value and observes the switch's documented effect in the arm, beside the read site the scanner finds; a change in the displayed value alone SHALL NOT establish an operational effect. Missing evidence SHALL trigger inspection and an appropriate body, not automatic demotion. A `declarative` label SHALL be supported by inspection establishing that the promised effect is not implemented; a documented action performed by a person or seat SHALL be classified as `manual` with its actionable instruction. An unresolved classification SHALL remain an acceptance finding and SHALL NOT be concealed by assigning `declarative`. The count of operational switches is this lane's finding, not a figure fixed in advance.
- WHEN the terminal lists a switch THE label and, for a manual switch, the action SHALL be shown beside the value; WHEN an edit names a declarative switch THE command SHALL refuse with the code `declarative` and leave the template byte-identical, pinned by a body; the reference SHALL carry the labels.
- WHEN this card lands THE notes SHALL identify T-301 and T-302 as the remaining label consumers. Under the proposed sequence, T-301 SHALL resume only after T-317, T-300-s6 and this card are merged on its resumption base and its separately authorized amendment includes displaying each label and the manual action before the new brief is frozen; T-302's dispatch contract SHALL likewise include label adoption and this landed prerequisite. This card does not authorize editing either card or an active lane. If T-301's brief is already frozen or its work has finished, the seat SHALL name and obtain authorization for a separate app-label follow-up before claiming the adoption is assigned. The method version SHALL bump with its release note and evaluation block.

## Amendment of 2026-09-13 — the seat's pre-dispatch read (approved by the owner on 2026-09-13)

In the third criterion, "refuse with the code `declarative`" means the refusal's finding code in the message, at the command's existing refusal exit (2); the exit vocabulary stays the four codes T-300-s6 pinned as unchanged, and a body SHALL show the refusal's exit equals the other refusals'.

## Amendment of 2026-09-13, second — the `declarative` label's definition (the owner's ruling of 2026-09-13, after the verifier's correction 3)

This section supersedes ONE part of the second criterion: its sentence that a `declarative` label is supported by inspection establishing that the promised effect is not implemented. It is recorded as an accepted CHANGE to the criterion, not as a finding that the original wording was satisfied; the lane's tree departs from that sentence and the departure is the ruled definition. Everything else in the criterion stands.

- `declarative` is an informational value: the row's value neither controls what the arm runs nor prescribes a manual action. The distinction the label draws is whether changing the setting changes what runs — which is separate from whether the underlying behaviour exists. The schema's own `implementation` field states this (the field that tells an executable control from a recorded intention), and the lane's body pins it: `declarative` means the arm carries no read site for the row and the ledger alone reads it.
- The label alone establishes neither that the underlying behaviour exists nor that it is absent. A fence hook, a landing gate or a CI job can be active while its settings row is informational, and calling such a feature "not implemented" would be misleading; equally, a declarative row does not certify that anything runs.
- The criterion's evidence requirements are preserved unchanged: a `declarative` label is supported by inspection and evidence recorded on the card, and uncertainty never becomes `declarative` by default — a row whose read site or effect is unknown is inspected, and an operational effect found is labelled `operational` with its body, as the criterion already requires.
- A fourth label separating "implemented elsewhere" from "not implemented" is deferred; this amendment authorizes no additional development. For the settings screen, the distinction can be carried by explanatory text beside the value (for example that a behaviour is active and controlled by the hook rather than by this setting) — an input to T-301's design step, not a requirement placed here.

## Implementation notes

### The criteria, echoed as a checklist before any code (T-279, the criteria echo)

1. Every schema row carries `implementation` as one of `operational`,
   `manual` or `declarative`, and `manualAction` as a string: non-empty
   and actionable on a manual row, empty on every other. The parser
   refuses a missing label, an unknown label, an empty action on a
   manual row and an action on a row that is not manual.
2. An `operational` label is earned by a body that CHANGES the value and
   watches the arm answer differently — not by a read site, and not by a
   value the surface prints back. A `declarative` label is earned by
   inspection showing the row controls nothing. A row whose effect a
   person or a seat performs is `manual` and carries the instruction.
   The count of operational rows is this lane's finding.
3. The listing shows the label beside the value and, on a manual row,
   the action. A `set` naming a declarative row refuses with the finding
   code `declarative` in its message, at the refusal exit the other
   refusals already use, and leaves the template byte-identical. The
   generated reference carries the labels.
4. The notes name T-301 and T-302 as the remaining label consumers and
   say what each of them owes. This card edits neither of those cards
   nor any live lane.
### The rule the labels were assigned by

The three words answer one question — WHAT MAKES THIS ROW TRUE — and the
rule is mechanical, so a reader can re-derive any row's label without
asking the seat that wrote it.

- `operational`: a program in this tree reads the resolved value through
  the accessor and branches on it, so changing the value changes what
  that program DOES. Earned by a body, never by a read site.
- `manual`: no program reads the value, and what the row names is carried
  out by a person or a seat — a document they write, a command they run,
  a step of a ritual they perform. `manualAction` is that instruction.
- `declarative`: no program reads the value and no instruction is
  addressed to a seat by it. The row is a RECORD. It does not mean the
  behaviour is absent: the fence hook, the landing gate and the docs gate
  are all labelled this way and all in force — they live in code and in
  CI configuration that never consults the schema, so editing the row
  moves the template and nothing else, which is why the terminal refuses
  the write.

### The finding the second criterion asks for

**SIX of the forty-two rows are operational**, measured at this lane's
tip: `dispatch.model_per_role`, `verify.tier`, `verify.phase1`,
`merge.regen_graph`, `merge.regen_census` and `merge.keepers`. Twenty-four
are manual and twelve declarative.

**Seven rows name an arm symbol in `reads:` and only six of them are
operational.** `record.whole_suite_net` is the seventh: the arm really
does read it, `wholeSuiteNet` really does answer differently at every
value, and what that answer reaches is one printed sentence in the
brief's process rows. Nothing the arm DOES moves with it — the four legs'
clock is kept by the scheduled CI run and by the integrating seat at each
checkpoint, neither of which consults the row. So it is `manual` with the
instruction that names both halves, and it has a body of its own that
observes the arm's plan at every value and requires it not to move, with
an operational row as the positive control. That row is the whole of why
the card says a read site is not evidence, and it is the one place the
count could have been seven.

The twelve declarative rows divide into two shapes. Four are steps of the
dispatch ritual that run unconditionally — the keeper at the base, the
card preflight, the verifier's bench and the ground truths — and four
more are CI's: what the runner grades, the shard matrix, the currency
check and the runs per push, all decided by the workflow and by
`ci-owed.mjs` and none of them by this file. The remaining four are hooks
and guards: the fence hook, the landing gate, the docs gate and the
owed-set token. T-299-s8 is filed for the first shape, where two of the
four rows could be read by the ritual and become controls.

### What moved

- **The schema** carries `implementation` and `manualAction` on all
  forty-two rows, and its header documents both fields, including the
  sentence that keeps `declarative` from being read as "absent".
- **The parser** adds both to `SWITCH_FIELDS`, so a row missing either is
  already the existing missing-field refusal, and declares
  `IMPLEMENTATIONS` and `MANUAL_IMPLEMENTATION`. Three new refusals: a
  label outside the set, an empty action on a manual row, and an action on
  a row that is not manual. The last is not in the criterion's list of
  three; it is the "and empty otherwise" half of the same sentence, and a
  field the parser does not police is a field nobody validates.
- **The ledger** carries both fields, so every surface renders them from
  the one read.
- **The terminal** shows the label in a bracket of its own AFTER the
  `FLOOR` and `DEPARTURE` marks — deliberately, so that a reader and a
  body matching on `[FLOOR` or on a whole `[DEPARTURE — …]` still read
  what they read before — and prints `manual action:` under the `what`
  line for a manual row and for no other. `set` refuses a declarative row
  with the finding code in the message at the existing refusal exit, per
  the card's amendment, and a body compares that exit against the floor
  and value refusals rather than typing it.
- **The reference** carries each row's label, each manual row's action,
  and a derived sentence counting the three.
- **Five bodies in `cli.spec.ts` moved off `dispatch.keeper_at_base`.**
  They used it as the ordinary editable switch, and the inspection above
  makes it declarative, so `set` now refuses it. They use
  `build.criteria_echo` instead — same shape, two values, no constraint —
  and every assertion they made is unchanged. The new refusal body
  DERIVES its subject (the first declarative row that is not also floor)
  rather than naming one, so it cannot go stale against a relabelling.

### What I would flag for the verifier

- The classification of `record.whole_suite_net` is the load-bearing
  judgement of this lane and the one most worth attacking: it is the row
  a read-site rule would have called operational.
- `verify.ground` and `verify.separate_bench` are declarative on the same
  inspection as the other two ritual steps — the arm performs them at
  every value — but each also has a seat practice around it (the
  addendum resealed by hand, phase two taken on the bench). I read the
  row as describing the ARM's step rather than the seat's practice; a
  reader who weighs it the other way would call them manual.
- `docs/CONVENTIONS.md` was already over its ADR-019 warn line before
  this lane (157456 bytes at the base) and this card adds about 1.9K to
  the one bullet its criteria need. The docs gate answers 0 findings; the
  budget line is a WARN and was warning already.

### The fourth criterion: the remaining label consumers

**T-301 and T-302 are the two.** The schema is one source and four
surfaces; this card moved two of them.

- **T-301**, the app's settings screen, is LIVE in its own lane as this
  card is built, and this card does not edit it or its card. Under the
  sequence the card proposes, T-301 resumes only after T-317, T-300-s6
  and this card are merged on its resumption base, and its separately
  authorized amendment includes displaying each row's label and, for a
  manual row, its action, before the new brief is frozen. **If that brief
  is already frozen or the work has finished, this card does not make the
  adoption assigned**: a separate app-label follow-up has to be named and
  authorized, and this lane names that condition rather than assuming
  which side of it the live lane is on.
- **T-302**, the skill's command, is the fourth surface and has not been
  dispatched. Its dispatch contract should carry label adoption and this
  card as a landed prerequisite, for the same reason: the skill renders
  the schema, and a surface that shows a row without saying whether
  editing it does anything is the gap this card closed in the terminal.

### Cards filed

- **T-299-s7** — the label vocabulary is exported by the module and
  re-exported by neither barrel, so no consumer can import it. The lane's
  fence carried the module and not `src/pure.ts` or `src/index.ts`.
- **T-299-s8** — four dispatch-ritual steps run whatever their rows say,
  which is why four rows are records; the repair is the ritual reading
  the two that are not floor, and it changes behaviour rather than a
  label.

### The method version bump

Not this lane's. The bump, its release note under the stamp line and the
evaluation block are the integrator's writes at the merge; the method
text this card moved is `method/runtime/process-schema.yaml`.

Integrator's note at the merge (2026-09-13, the verifier's correction 3, a wording correction with no block): the second criterion's sentence that a `declarative` label is supported by inspection establishing that the promised effect is not implemented does not describe the tree this lane built — the lane's `declarative` means the row is not a control (nothing reads its value, the arm carries no read site) and is pinned that way by a body, and at least eight of the twelve declarative rows (`fence.hook`, `landing.gate`, `docs.gate`, `push.token` and the four `ci.*`) describe behaviour that is implemented and in force elsewhere. The verifier judged the departure correct and named it as a departure; the ruling on the label's definition is the owner's and is owed on this card as a dated amendment. The criterion's sentence is not rewritten here.

## Verdicts

### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Phase 2 of a GUARDED pass, on the bench `../supertaskr-V-T-299-s6` (the sibling worktree; the seat's home path redacted at the merge on the forbidden-spelling keeper's instruction, nothing else changed)
detached at `baea26970d5fdd03da07973910db7ee6fc0dd548`, base
`3297a658e62d0ae0f945ec50bbc1769d3abb73fc`. Every figure below names the ref it was
measured at.

**THE FRAME I ACTUALLY HAD.** Two spawns, guaranteed rather than kept: phase 1 held no
file, git or shell tool and wrote its attack set from the card at the base; this spawn
holds tools, read the diff and the notes together, and opened the executor's report only
after the attack set was hashed and the diff was read. The brief's duties section named no
executor-derived figure — no mutant count, no path count, no suite number — so phase 1 was
not broken above the line. The seat's facts about the tree (the graded tip, the expected
census and graph staleness, the bench rebuild) arrived as facts and I re-measured every one
I used.

**SEALED INPUTS, CITED.** Each digest recomputed on this bench and matching the saved file:

- attack set `sha256:e187e1cff10021de7a4dbd2cf0644464dcda72197f17cc86db42cfd854cdf01e`
- ground truths `sha256:273a101213265d62765fd7b4c6c293fa3c0b55d54f8dcb9e6340b5c1b251fba6`
- the card at `3297a658` `sha256:9989bb990ff659a210bcb913eb052ed0b48d56917477eab034a231a616ecf9ea`

#### The suites, at `baea2697` — the whole battery, which the guarded tier keeps

`SUPERTASKR_E2E_PORT=15299 node tools/e2e/scripts/gate-run.mjs parser app rust e2e`, exit 0.

| leg | ref | bodies | targets | exit | verdict |
|---|---|---|---|---|---|
| parser | baea2697 | 413 | 1 | 0 | GREEN |
| app | baea2697 | 1171 | 1 | 0 | GREEN |
| rust | baea2697 | 655 | 18 | 0 | GREEN |
| e2e | baea2697 | 1049 | 1 | 0 | GREEN |

Beside them, at the same ref: `settings.mjs reference --check` exit 0 (the committed
chapter IS a current generation); `npm run lint:docs` 0 findings with the ADR-019 budget at
WARN — `docs/CONVENTIONS.md` is 159357 bytes against a 146878 warn and a 176253 fail, and it
was already warning at the base (157456); `brief.mjs --task T-299-s6 --preflight` exit 0;
`capabilities:check` STALE (96334 committed, 96924 fresh) and the graph stale — both
regenerations and the method stamp are the merge's by the schema's own `merge.regen_*` and
`method.stamp` rows.

#### A row per acceptance criterion, with the evidence that decided it

| # | criterion | verdict | the evidence |
|---|---|---|---|
| C1 | every row labelled, `manualAction` non-empty and actionable for manual and empty otherwise; the parser refuses a missing or unknown label and an empty manual action | MET, with correction 1 | All 42 rows carry both fields (enumerated at `baea2697`: 6 operational, 24 manual, 12 declarative). The refusals live in `lib/parser/src/process-settings.ts` — the library T-317 made the single source — not in the arm's wrapper, so C1-B's attack finds nothing above the library. A MISSING field is the pre-existing every-field refusal because both fields joined `SWITCH_FIELDS`, and the new parser body drives that direction too. Drill D1: `!IMPLEMENTATIONS.includes(impl)` → `false` reds exactly 1 of 413. "Empty otherwise" IS policed (`impl !== manual && action !== ''`), which C1-D expected to be skipped. Type confusion is closed by the hand parser upstream: every field but `values`/`needs`/`band`/`floor` is `processScalar`, so `implementation: 123` and `implementation: [operational]` arrive as strings outside the set and refuse. **The gap:** `action.trim() === ''` is pinned by nothing — drill D2 replaced it with `action === ''` and all 413 parser bodies stayed green, so "non-empty" degrades to "not the empty string" and `manualAction: "   "` parses. Correction 1. |
| C2 | an operational label requires behavioural evidence; a declarative label requires inspection; a person's act is manual; an unresolved classification stays a finding; the count is this lane's | MET, with a named departure (correction 3) | The proof body holds one observer per operational row, requires the observer table to EQUAL the labelled set (so no label is handed out without evidence), requires the arm's answers to differ pairwise, and — the part that answers C2-B — erases every value of the row from every answer before comparing, so an observer that reads back what it was handed collapses. Each observer reads an arm ACT: a rendered model row, a tier, a merge plan's step ids, a keeper plan's step ids. **P1, the control I pre-committed to and owed a demonstration for:** drill D5 neutered the BRANCH (`switchValue(process, "merge.keepers")` → `"on"` in `merge.mjs`, not the read site and not the schema) and all three label bodies red, including the third body's own positive control. The other half of the demonstration: drill D7 changed a `cost:` string in the schema — a schema edit touching no label and no branch — and all three stayed green, so the control does not fire spuriously. **C2-A, the concealment the criterion names, is mechanically blocked:** drill D6, a DATA mutant relabelling the operational `merge.keepers` as `declarative`, reds three bodies (the label body, the proof body, and the reference-currency body). The count landed at exactly six with the candidate's seventh row relabelled, so per my pre-commitment I applied the strongest evidence standard and say so: each of the six carries its own independently written observer, and the seventh, `record.whole_suite_net`, has a body of its own that observes four arm acts at every value and requires none to move, with an operational row as the positive control and the moving brief SENTENCE shown as the thing that is not evidence. C2-H is answered by disclosure rather than by a clean sweep: T-299-s8 is filed for the four ritual rows, and the notes flag `verify.ground` and `verify.separate_bench` as the judgement a reader could weigh the other way. |
| C3 | the terminal lists the label and the manual action beside the value; an edit naming a declarative switch refuses with the code `declarative`, template byte-identical, pinned by a body; the reference carries the labels. Amendment: a finding code at the existing refusal exit, the four-code vocabulary unchanged, and a body showing the exit equals the other refusals' | MET, with correction 2 | The listing asserts per row, on the row's OWN line, for all 42 — not `stdout.includes`, which C3-E predicted — and counts the `manual action:` lines against the manual rows so an action on a row that has none also reds. The reference is GENERATOR-emitted (`renderReference`), its three counts DERIVED, and `reference --check` is green; the currency body compares the committed page against a fresh generation, so C3-G's hand-edit is caught (D6 reds it). C3-B's "refuses for everything" is ruled out by the positive control: drill D4a made the refusal fire for every row and the body red at "the control: an allowed set is clean". Byte-identity is a fact about a FILE, read off disk in a temp project through `settingsMain`, and structurally true besides — `setPlan` throws before the template is ever read. The exit vocabulary did not grow a fifth code and T-300-s6's pinning bodies are untouched. **I recorded the opposite prediction before seeing the work (C3-C) and it was wrong: the body compares `refused.status` against the OBSERVED exits of two other refusals, not against a literal on both sides.** Credit is real. **The gap:** the floor control was `push.token`, which is FLOOR and ALSO declarative — one arrangement deciding both the subject's answer and the control's. Drill D4b (`if (sw.floor)` → `if (sw.floor && sw.implementation !== "declarative")`) leaves the new body GREEN while its stated arrangement is false; the neighbouring four-refusals body catches that particular mutant, so the defect is contained rather than open, but a body whose control can become its own subject is the defect this method produces most. Correction 2. |
| C4 | the notes identify T-301 and T-302; the sequencing; this card edits neither card nor a live lane; the method version bumps with its release note and evaluation block | MET for the notes and the prohibition; the version bump is OUTSTANDING and is the merge's | `git diff --name-status 3297a658 baea2697` names eleven paths and no task card but this one and the two findings it filed, so pre-commitment 3 is clear: nothing under `docs/tasks/T-301-*` or `T-302-*` moved, and the fence was not widened. The notes name both consumers and what each owes. On the live conditional: the notes take the conservative branch and never claim the adoption is assigned — they state the condition and decline to assume which side of it T-301 is on. That satisfies the clause, which binds only "before claiming the adoption is assigned"; my pre-commitment 4 does not fire, and I say so rather than letting a rule I wrote in advance decide a case it does not cover. It is still weaker than it needed to be: "LIVE in its own lane" is a claim about another card's state carried at no ref, and the ground taken at the base shows the favourable branch was true and measurable (T-301 `building`, its worktree and bench dormant at one commit since 2026-09-11, and the only brief file predating both amendments, so nothing is frozen and no work has finished). A figure with its ref stays true; this one has none. **The version bump, the release note and the evaluation block are not at this tip.** The lane's position — that they are the integrator's writes at the merge — is the project's own rule (`method.stamp`: "bump the method stamp in every file that carries it, and run the method evals, in the merge that moves method text"), and this lane moves `method/runtime/process-schema.yaml`. So the criterion is not met AT THIS COMMIT and cannot be; it is an obligation the merge carries, and this verdict names it so the merge cannot mistake it for discharged. |

#### The security sweep (step 3, mandatory)

No dependency added, no secret, no key. The edit path takes a switch NAME from the caller
and resolves it through a `Map`, so `settings set __proto__ …` is an unknown-switch refusal
rather than a prototype write; the schema's hand parser refuses any field name outside
`SWITCH_FIELDS`, which closes the same door on the file side. The refusal fires before the
template is read or written, and the template path is `path.join(root, RUNTIME_TEMPLATE)` —
a fixed constant, never caller-supplied. `manualAction` is a new schema string rendered
unescaped into the terminal listing and into the generated Markdown page; the ground taken
at the base establishes that this is the file's EXISTING convention rather than a new class
of path (`what`, `effect` and `cost` already flow to both surfaces unescaped), so it is
recorded here as a standing property of the surface and not charged to this lane.

#### Adjacent features and the architecture

`tools/e2e/scripts/dispatch-brief.mjs` is unchanged, so the brief's rendered output does not
move: the 236 lines in `brief.spec.ts` are three new bodies plus four lines of a typed
fixture the parser's new refusals made mandatory. No node builtin enters `lib/parser/src`,
so T-317-s4's unguarded browser-safety hazard was not tripped. T-317's re-export invariant
IS dented: `IMPLEMENTATIONS` and `MANUAL_IMPLEMENTATION` are exported by the module and
re-exported by neither barrel, and `settings.mjs` consequently carries the literal
`"declarative"` — a second spelling of a vocabulary the library declares. Both barrels are
outside this card's fence, the lane filed T-299-s7 rather than reaching for them, and that
is the right call; it is named here because a dent nobody records is a dent nobody repairs.
Five existing bodies moved their subject from `dispatch.keeper_at_base` to
`build.criteria_echo` because the inspection made the first row declarative — forced by a
criterion, declared in the notes, and no assertion weakened. One consequence the lane did
not name: `setPlan` now owes FIVE refusals while the body called "each of the four refusals
a set owes is ITSELF" still says four, and the census publishes that sentence. The body is
not wrong about what it tests; it is no longer the whole set. Worth a line on whatever card
next touches that file, and not worth a correction here.

#### The corrections

Two bodies, committed on this bench AFTER this verdict so the figures above still name the
tip they were measured at, and one wording correction that has no property to pin.

**Correction 1 — a manual action that is only whitespace parses.** The parser's emptiness
check trims and nothing pins the trim. Body: the existing label-refusal body gains a
whitespace-only case. RED against an implementation lacking the property (mutant below): 1
of 413 parser bodies, "a manual action that is only whitespace: the schema parsed without a
murmur". GREEN against the implementation as it stands: 413 of 413. Restore proved by
sha256 `4d8969c7…`, equal to the pre-drill reading.

**Correction 2 — the declarative refusal's floor control could become its own subject.**
`push.token` is FLOOR and declarative, so a check order that put the label first would have
left the body comparing the subject against itself. The control moves to `template.roles`,
which is FLOOR and MANUAL and can therefore answer the floor refusal and no other, and both
controls now assert the refusal they claim to be. RED against an implementation lacking the
property (mutant below): exactly 1 of 241 bodies across `cli.spec.ts` and `brief.spec.ts`,
"the floor control answered some other refusal". GREEN against the implementation as it
stands. Restore proved by sha256 `d65234bd…`, equal to the pre-drill reading.

**Correction 3 — the card's own sentence about `declarative` is false of the tree this lane
built, and the notes do not say so. THIS CORRECTION CARRIES NO MUTANT BLOCK, because a
card's wording has no property a body can pin.** The criterion reads "A `declarative` label
SHALL be supported by inspection establishing that the promised effect is not implemented."
The lane's `declarative` means something different and says so loudly in four places: the
row is not a CONTROL — nothing reads its value — and the behaviour is emphatically NOT
absent. That is true of at least eight of the twelve: `fence.hook`, `landing.gate`,
`docs.gate`, `push.token` and the four `ci.*` rows all describe behaviour that is
implemented and in force, and would fail the card's literal test. I judge the departure
CORRECT rather than a defect — the card's three buckets have no home for "implemented, but
not by this file", the lane found that gap, chose the only remaining word, and pinned its
operative definition in a body (`declarative` ⇒ `reads` is the ledger AND the arm carries no
read site) so a future reader is held to the lane's rule and not to the card's sentence. But
the departure is nowhere named AS a departure, and a criterion that no longer describes the
tree it governs is how a later seat "fixes" the labels back. The correction is a sentence in
the notes naming the departure and the ruling it wants, and the ruling is the owner's to
give — I neither write an amendment nor claim one.

```mutant
correction: a manual action that is only whitespace parses
file: lib/parser/src/process-settings.ts
spec: lib/parser/test/process-settings.test.ts
body: REFUSES a label it does not know, a manual row with no action, and an action on a row that is not manual
message: a manual action that is only whitespace
--- old
      if (impl === MANUAL_IMPLEMENTATION && action.trim() === '') {
--- new
      if (impl === MANUAL_IMPLEMENTATION && action === '') {
```

```mutant
correction: the declarative refusal's floor control could become its own subject
file: tools/e2e/scripts/settings.mjs
spec: tools/e2e/tests/cli.spec.ts
body: a `set` naming a DECLARATIVE switch is refused with the code `declarative`, at the exit every other refusal takes, and the template is byte-identical
message: the floor control answered some other refusal
--- old
  if (sw.floor) {
--- new
  if (sw.floor && sw.implementation !== "manual") {
```

#### The drills, read off `git diff` rather than off a mutator's report

| # | site | mutant | kill set | restore proved |
|---|---|---|---|---|
| D1 | `lib/parser/src/process-settings.ts` | the unknown-label refusal never fires | the new parser body alone, 1 of 413 | `4d8969c7…` |
| D2 | `lib/parser/src/process-settings.ts` | `action.trim() === ''` → `action === ''` | **SURVIVOR** — 413 of 413 green; correction 1 | `4d8969c7…` |
| D3 | `tools/e2e/scripts/settings.mjs` | `set` stops refusing declarative | the new refusal body alone | `d65234bd…` |
| D4a | `tools/e2e/scripts/settings.mjs` | the refusal fires for EVERY row | the new refusal body, at its positive control | `d65234bd…` |
| D4b | `tools/e2e/scripts/settings.mjs` | the label is checked before FLOOR | the four-refusals body; the new body SURVIVES it; correction 2 | `d65234bd…` |
| D5 | `tools/e2e/scripts/merge.mjs` | the `merge.keepers` BRANCH neutered (P1) | all three label bodies, including the third's own control | `e38b9ebd…` |
| D6 | `method/runtime/process-schema.yaml` (DATA) | an operational row hidden as `declarative` (P2, C2-A) | the label body, the proof body, the reference-currency body | `a4e0f58f…` |
| D7 | `method/runtime/process-schema.yaml` (DATA) | a `cost:` string, no label and no branch | **none, as required** — the P1 control does not fire spuriously | `a4e0f58f…` |

**The control the rule owes.** Before spending these on bodies they fail, they passed one
they should: the four-refusals body survived D1, D2, D3, D4a, D5, D6 and D7 and died only to
D4b, the one mutant that is actually about it. A drill that graded that body degenerate
would have been a broken drill, not a broken tree.

**My pre-commitments, and how they came out.** (1) Hand-written reference labels would be
REJECT-level — not triggered; the generator emits them and `reference --check` is green.
(2) An operational label whose body survives its branch being neutered is unproven — not
triggered; D5 killed all three. (3) Touching T-301/T-302 is a REJECT-level scope violation —
not triggered. (4) C4's conditional unestablished makes the adoption claim unfounded — not
triggered, because no adoption claim was made. (5) I predicted "actionable" would be the
weakest clause, satisfied by a non-empty check alone — **half right**: the trim is unpinned
(correction 1), but "actionable" is more mechanised than I predicted, by a
`trim().length > 20` floor over every shipped manual row, and the credit for that is real.
(6) I predicted C3-C's exit equality would be typed as a literal on both sides — **wrong**,
and the lane did the stronger thing. (7) Six operational with the candidate's relabelling
would draw the strongest evidence standard — triggered, applied, and it held.

#### The gates at the tip I created, because a figure measured at the commit I was sent is stale at the tip my verdict made

Prose is a code input here — a verdict and two committed bodies create a
commit nobody has tested — so the whole battery ran again at
**c19d77519f616e132b9503b8be8a126d85b5b49d**, the tip carrying this
verdict and both corrections:

| suite | ref | bodies | targets | exit | verdict |
|---|---|---|---|---|---|
| parser | c19d7751 | 413 | 1 | 0 | GREEN |
| app | c19d7751 | 1171 | 1 | 0 | GREEN |
| rust | c19d7751 | 655 | 18 | 0 | GREEN |
| e2e | c19d7751 | 1049 | 1 | 0 | GREEN |

Both corrections add ASSERTIONS and no body NAME, so every count is the
same at my tip as at the lane's, and the census figure this verdict quotes
is unmoved by my own writes for the same reason: committed 96334 against a
fresh 96924 at `c19d7751`, exactly as at `baea2697`. The docs gate answers
0 findings at my tip with the ADR-019 budget still at WARN and unmoved at
159357 bytes — my writes went into a task card, not into
`docs/CONVENTIONS.md` — and the card preflight answers 0 for T-299-s6. The
two cards the lane filed as `suggested` cannot be preflighted at all: that
command answers about a card the board's schedule draws, and a suggested
card is not a dispatch candidate.

This postscript sits INSIDE this verdict's own heading, so the merge verb
still finds one verdict on this card and both mutant blocks above are
still the newest verdict's. It moves prose only, and nothing above it
changed.
