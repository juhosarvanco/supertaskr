---
id: T-299-s6
title: "The process schema labels every switch `operational`, `manual` or `declarative` with a non-empty `manualAction` for the manual ones — an operational label requires behavioural evidence that changing the value changes the arm's behaviour, not only a read site — the terminal lists the label and refuses to edit a declarative switch with its file unchanged, and the reference carries the labels; the app adopts the labels in its authorized amended T-301 resumption after this card lands, and the skill adopts them in T-302"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the recovery candidate of 2026-09-11 carried these labels inside an expanded T-301; the owner ruled on 2026-09-12 that the app is a mirror first and that the pieces of that candidate return as small cards; the Codex orchestrator's review of 2026-09-12 on evidence for operational labels"
blocked_by: [T-317, T-300-s6]
touches: [method/runtime/process-schema.yaml, lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

The schema's `reads:` field names `processLedger` for most switches, which the schema itself explains means no arm branches on them; a user of the terminal cannot tell an executable control from a recorded intention. The arm has a read-site scanner over its own source (`switchReadSites`), pinned by a brief spec body; a read site shows the value is read, not that changing it changes behaviour. The recovery candidate's labelling counted six operational rows and relabelled one switch the arm reads as declarative; that count and that relabelling are claims for this lane's bench, not facts carried over. Refusing to edit a declarative switch is a new product behaviour.

### Acceptance criteria

- WHEN the schema declares a switch THE row SHALL carry `implementation` as one of `operational`, `manual` or `declarative` and `manualAction` as a string, non-empty and actionable for a manual switch and empty otherwise; the parser SHALL refuse a missing or unknown label and an empty manual action.
- WHEN a switch is labelled `operational` THE lane SHALL show behavioural evidence: a body that changes the value and observes the switch's documented effect in the arm, beside the read site the scanner finds; a change in the displayed value alone SHALL NOT establish an operational effect. Missing evidence SHALL trigger inspection and an appropriate body, not automatic demotion. A `declarative` label SHALL be supported by inspection establishing that the promised effect is not implemented; a documented action performed by a person or seat SHALL be classified as `manual` with its actionable instruction. An unresolved classification SHALL remain an acceptance finding and SHALL NOT be concealed by assigning `declarative`. The count of operational switches is this lane's finding, not a figure fixed in advance.
- WHEN the terminal lists a switch THE label and, for a manual switch, the action SHALL be shown beside the value; WHEN an edit names a declarative switch THE command SHALL refuse with the code `declarative` and leave the template byte-identical, pinned by a body; the reference SHALL carry the labels.
- WHEN this card lands THE notes SHALL identify T-301 and T-302 as the remaining label consumers. Under the proposed sequence, T-301 SHALL resume only after T-317, T-300-s6 and this card are merged on its resumption base and its separately authorized amendment includes displaying each label and the manual action before the new brief is frozen; T-302's dispatch contract SHALL likewise include label adoption and this landed prerequisite. This card does not authorize editing either card or an active lane. If T-301's brief is already frozen or its work has finished, the seat SHALL name and obtain authorization for a separate app-label follow-up before claiming the adoption is assigned. The method version SHALL bump with its release note and evaluation block.

## Amendment of 2026-09-13 — the seat's pre-dispatch read (approved by the owner on 2026-09-13)

In the third criterion, "refuse with the code `declarative`" means the refusal's finding code in the message, at the command's existing refusal exit (2); the exit vocabulary stays the four codes T-300-s6 pinned as unchanged, and a body SHALL show the refusal's exit equals the other refusals'.

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

## Verdicts
