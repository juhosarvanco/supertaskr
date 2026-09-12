---
id: T-300
title: "`npx supertaskr settings` — the terminal surface of the process settings: lists the profile and every switch with its explanation and the project's measured cost, and edits the runtime template's section with the schema's constraints enforced"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 2
status: done
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was measured

The schema (T-299) is the source; the terminal is the first renderer because every seat and every CI runner has it.

## Acceptance criteria

- WHEN `settings` runs with no argument THE output SHALL list the profile and every switch with its state, its one-line explanation and the project's own band reading beside it (the seat's estimate until a reading exists), in the schema's order.
- WHEN `settings set <switch> <value>` runs THE template SHALL be edited only if the constraints allow it, and a forbidden value SHALL be refused naming the constraint; a body SHALL show both.
- WHEN the reference documents the command THE text SHALL be generated from the schema, never typed twice.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before the code (executor, at the base c41a3c0a)

Restated in my own words, one line per criterion, as a checklist:

1. `npx supertaskr settings` with no argument prints the profile this
   project runs and then EVERY switch the schema declares, in the
   schema's own order, each with the value it resolves to, its one-line
   `what`, and one measured column beside it: the project's own band
   reading where the tree carries one, and the schema's `cost` labelled
   as the seat's estimate where it does not.
2. `settings set <switch> <value>` writes the departure into the runtime
   template's `process:` section and ONLY where the schema allows it —
   an id the schema does not declare, a value outside that switch's own
   set, a FLOOR switch, and a combination the constraints forbid are
   four different refusals, each naming what it refused and writing
   nothing; two bodies show the allowed edit and the forbidden one.
3. The reference page that documents the command is GENERATED from the
   schema by this same command, never typed, and a body compares the
   committed page against a fresh generation so a schema change that
   was not regenerated reds.


### What was built

`tools/e2e/scripts/settings.mjs`, fronted by the CLI verb `settings`,
and a generated reference chapter.

**It holds no knowledge of the loop.** The parser, the resolver, the
value sets, the floor and the constraints all live in
`tools/e2e/scripts/dispatch-brief.mjs`, which is the arm's own reader,
and this command imports them: `loadProcess`, `processLedger`,
`constraintFindings`, `processSection`, `resolveProcess`,
`parseProcessSchema`. A second reader would be a second chance to
disagree with the arm about what this project's loop is, and the
disagreement would show up as a settings screen saying one thing while
the dispatch did another. What is genuinely this command's own is the
rendering, the line edit and the generation.

**THE LISTING** (criterion 1) walks `processLedger`, which asks for each
switch BY NAME through `switchValue` rather than walking the
resolution's own map — so a switch the resolution lost is a throw here
exactly as it is at a dispatch, instead of one row fewer that nobody
sees. Each row carries the value it resolves to, a FLOOR mark, a
DEPARTURE mark naming what the profile itself says, the switch's
one-line `what`, and ONE measured column. The measured column is the
project's own band reading where the tree carries one, taken through
the same functions `npm run health` uses so this command cannot report
a different number than the band report does; where no band of that
switch has been read it is the schema's `cost`, LABELLED as the seat's
estimate and naming the band it is waiting for. The label is the point:
a cost nobody has measured, rendered in the same voice as a reading, is
a settings screen inviting a decision on a number that came out of a
room. Measured in this checkout at the lane tip: `loop/cycle-budget-used`
has a reading and `loop/token-budget-used` does not, because one merged
card's seat stated no token figure and the meter takes the whole card
dark — so both halves of that column are live in this tree, not only in
a fixture.

**THE EDIT** (criterion 2) is a LINE edit and that is the whole of how
it keeps the template's shape. The section is method text a human wrote:
`profile:`, `available:`, the `switches:` block and four comment lines
arguing why that block is empty. An editor that round-tripped the file
through a YAML emitter would hand back the same document with every
comment gone and call it unchanged, so `editTemplate` locates the block,
replaces, removes or inserts exactly one line at four spaces of indent,
and everything else survives byte for byte — a body asserts the line
count moved by one, that every comment line is still present, that the
profile line is still there and that the file keeps its trailing
newline. The value is spelled through `yamlScalar`, which quotes
anything a YAML reader would take as a boolean: `off` and `on` are two
of this schema's commonest values, and a toggle written bare comes back
as `false`, fails its own value set, and takes the tree to the refusal
`loadProcess` keeps for a project that contradicts itself — written by
the command whose job was to keep it consistent. The body reads the
edited file with a REAL YAML parser and with the arm's own reader and
requires them to agree.

**THE REFUSAL IS THE SCHEMA'S, NOT THIS COMMAND'S.** `setPlan` names
four mistakes as four different refusals — an id the schema does not
declare, a FLOOR switch, a value outside that switch's own set — and for
the fourth it builds the settings the write WOULD produce and runs the
arm's `constraintFindings` over them. So a forbidden combination is
refused in the schema's own words, naming both switches and both values
and quoting what the needing switch does, and a constraint added to the
schema is enforced here the day it lands with nothing in this file to
change. Nothing is written on any of the four paths, and the body proves
that against the FILE rather than against the throw. Driving it live:
`set record.bands off` is refused because `merge.meters_to_bands` is on
and needs it; `set record.whole_suite_net every-push` is refused twice
over, by `verify.suites` and by `ci.owed`.

Setting a switch to the profile's OWN value REMOVES the departure rather
than writing one, because that section names the profile and the
departures only, and a departure that departs from nothing reads as a
decision to the next person who opens the file. The body proves the
removal puts the file back byte for byte.

**THE REFERENCE** (criterion 3) is `docs/reference/15-settings.md`,
written by `settings reference --write` and a pure function of the
SCHEMA — never of the template. That is deliberate: a page that moved
every time somebody set a switch would red its own currency body for a
change that is not a documentation change, and the body asserts exactly
that by editing the template and requiring the page not to move. The
page's own currency is a body in `tools/e2e/tests/cli.spec.ts` comparing
the committed bytes against a fresh generation, with a planted schema
edit as the control. The command's usage block inside the chapter is the
script's own `USAGE` constant, so even that is not typed twice.

### Where the fence held, and what it cost

The command's one write goes to method text, and a lane worktree holds
every file outside its card's fence read-only (the lane lock). So the
commonest tree anyone will run `set` in is one where the write is
refused on purpose; it is caught and reported as could-not-run naming
the file and the reason, rather than thrown as a stack trace that reads
like a bug in this command. Every `set` exercised in this lane ran
against a scratch project, never against this checkout's own template,
and the template is unchanged in the diff.

### Two smaller decisions, said rather than left to be found

- `treeReadings` returns an empty map for a tree with no recorded
  meters and asks git nothing on that path. A project that adopted this
  method last week has no merges and possibly no checkout at all, and
  the honest rendering there is every switch against the seat's
  estimate. Failing instead would make the listing — the one verb that
  should work everywhere — the verb that needs a history.
- The script sets `process.exitCode` and never calls `process.exit`:
  the listing is tens of kilobytes and the ordinary way anyone reads one
  is through a pager. `tools/e2e/tests/brief-flush.spec.ts` keeps the set
  of commands that still end that way closed, and this one is not in it.

### What was noticed and not done

Filed as T-300-s1, T-300-s2 and T-300-s3: the two template edits the
command refuses today (the profile itself, and a template whose section
carries no `switches:` key), the docs gate not knowing that the process
schema regenerates a reference chapter, and the template's own comment
about departing at no switch, which the edit leaves standing because it
is a human's prose and this command is a settings editor rather than a
formatter.

T-300-s4 was filed by the resumed session and is a finding about the
OWED SET rather than about this command. Drilled here, with the
docs-gate follow-up reverted: the set this range owes — 11 spec files,
592 bodies — passed whole, while
`tools/e2e/tests/docs-input-gate.spec.ts`, which owns the property the
defect breaks, went RED. That body WALKS the tracked corpus and imports
nothing from what it judges, so the ownership rule the derivation uses
cannot see it, and the class is every body whose subject is a property
of the tree rather than of an imported symbol. The whole-suite net
catches it at the next checkpoint, which is the point being made rather
than the answer: the cheap half is the announcement at build time, and
that is what is missing.

### The follow-up the docs gate owed, and each half hides the other

The build was interrupted by the weekly budget with two spellings
uncommitted. Both were re-derived at the resumed tip by running the
docs scanner's own functions over this tree with one half reverted at a
time, and both are load-bearing:

- `REFERENCE_DOC` is a plain repository-relative STRING joined to the
  root at the call site, which is this package's own idiom for a path
  under docs/. Spelled as a segmented join whose first segment is
  `docs`, it is a docs-first site with no base, and the scanner resolves
  such a site against the PACKAGE directory rather than the repository
  root. Measured with only this half reverted: `unlinkedFiles()` reports
  `tools/e2e/scripts/settings.mjs`, and the body in
  `tools/e2e/tests/docs-input-gate.spec.ts` that requires that list
  empty goes RED. The tripwire is right to fire. A generator whose
  output path the gate cannot place is a page the gate can never tell
  anyone to regenerate.
- the reference-currency body reads the chapter by its literal path and
  then asserts that IS the page the command writes, so the scanner sees
  the spec as a READER of the chapter. Measured with only this half
  reverted: the spec's derived prefixes lose the chapter while the
  script stays linked, because importing the constant is not a site the
  derivation can follow. The gate would then stop naming the one body
  that checks the page's currency, and a diff that moved the page would
  point at no suite at all.

Neither spelling changes what the command does. The listing, the four
refusals and the generated page are byte for byte what the build
produced.

### Re-derived criterion by criterion at the resumed tip

Nothing was found short, and the figures below were measured in this
lane rather than carried over.

1. The listing renders 42 rows against the schema's 42 switches, in an
   order that diffs identically to the schema's own declaration order,
   with 10 FLOOR marks against the schema's 10 floor rows, and one
   measured column on every row. Both halves of that column are live in
   this tree: `loop/cycle-budget-used` renders a reading and
   `loop/token-budget-used` renders the seat's estimate, labelled, and
   naming the band it is waiting for.
2. Every switch was driven through every value it declares, against
   throwaway copies of the template. 34 writes, 32 already-at-that-value,
   10 FLOOR refusals and 3 forbidden-combination refusals, and NOT ONE
   refusal moved a byte of the file. The two refusals that sweep cannot
   reach were driven by hand: an id the schema does not declare, and a
   value outside a switch's own set. All four refusals exit 2, which is
   called wrong, and the tree is fine. The write keeps the shape: the
   line count moves by exactly one, all 31 comment lines survive, the
   profile line survives, the trailing newline survives, and setting the
   switch back to the profile's own value restores the file byte for
   byte.
3. The committed chapter is byte-identical to what the write path
   generates. Editing the template leaves it unmoved, which is the
   point of generating from the schema alone; planting one edit in a
   schema field makes the currency check exit 1 and name the byte
   difference. The command's usage block appears in the page verbatim
   from the script's own constant, so even that is not typed twice.

The verb was exercised through the shipped entry point rather than the
library module it fronts, which is what the criterion means by the
command's name.

### Where the brief was wrong, and one fact that moved under it

The brief is sound on every row this lane used. Two facts moved after it
was written and are recorded rather than acted on:

- it names T-301 as live beside this lane. That lane stands still; its
  executor was ended the same way this one was, and its fence stays
  disjoint from this one either way.
- its integration tip and this card's base are the same commit. The
  integration branch has moved since, and this lane was neither rebased
  nor merged: what this session measured, it measured at this lane's own
  tip on this lane's own base.

## Verdicts

### 2026-09-12 — APPROVED WITH ASSIGNED CORRECTIONS (verifier, phase 2)

claude-opus-5@subagent (verifier, phase 2), tier **standard**, one pass at
the tip **88b82c9b19752ea14a3b342764d79169c2a17b5c**, base
**c41a3c0a192b07ade334c0f3e7aaaf67d46322fc**, bench detached at that tip.

**The sealed inputs, cited:**

| input | sha256 |
| --- | --- |
| the attack set | `aece41ef353c76dd0c1f31ff56c0fe321cab95425562e00b9409158924472bd1` |
| the ground, taken at the base by the arm | `9e779fddba60494d2f96755529a34d1edbaf620f990926138f76f125324fc0ad` |
| the card at the base | `f266e67e597c5ef7f441c69c33727a0a4cc7165bdf37547780089dd13e51c6bc` |

All three recomputed at this bench and equal to the stamps file.

**THE FRAME I ACTUALLY HAD.** Two spawns, and the blindness was a
property of the spawn rather than a discipline I kept: phase 1 held no
file, git or shell tools, wrote the attack set against the card at the
base, and its return was hashed before this spawn existed. The brief's
duties section named no executor-derived specific — no mutant number, no
path count, no suite figure — so the step-0 boundary was clean above the
line as well. I opened the diff, then the tree, then ran every
measurement below, and read the executor's report, the card's notes and
the lane's commit messages LAST, after every finding here was written.

**A PACK GAP, NAMED.** The brief carried ground rules and paths and no
CONTEXT PACK at all, which the role file calls a dispatch fault. I did
not read `docs/CONVENTIONS.md` end to end: at 153,943 bytes that is the
volume the pack exists to spare this seat, and I opened it instead at the
two bullets this fence implicates — THE PROCESS IS SETTINGS (which the
new verb cites as its `source`, and which carries the bullet verbatim at
the base) and the house exit vocabulary. I say so rather than let a later
reader assume the whole document was read.

**A SECOND GAP, AND I CLOSED IT MYSELF.** The arm's ground carries blobs,
body names and the preflight; it answers none of the eight measurements
phase 1 asked for. I took them myself at the base ref and BEFORE opening
the diff, and stamped the record at
`f9638100a3f15db520003e36e8c82c3e5623bb6e2f6c37de6b877c978a8f24e5`
(`ground-phase2-supplement-T-300.md` in this pass's scratch directory).
It is not an arm-sealed input and is cited as mine.

## A row per acceptance criterion, with the evidence that decided it

| # | criterion | verdict | the command, body or reading that decided it |
| --- | --- | --- | --- |
| AC1 | bare `settings` lists the profile and every switch with its state, its one-line explanation and the project's own band reading (the seat's estimate until a reading exists), in the schema's order | **MET, with two corrections** | Ran the shipped entry point at this bench: 42 rows against the schema's 42 switches in declaration order, 10 FLOOR marks, a profile line carrying the profile's own sentence, one `what` line and one `measured:` line per row, exit 0. The measured column is NOT degenerate — phase 1 pre-committed to calling it so if no second state were representable: `dispatch.keeper_at_base` renders `loop/cycle-budget-used = 418.74 % of the tier's budget` off this checkout's own meters, while `read.standing` renders `the seat's estimate — about 50K tokens per seat (awaiting loop/token-budget-used)`. Order is a Map built in file order by the schema parser, never object-key iteration, so phase 1's numeric-key attack cannot reach it. Every column traces to a schema field; no switch name appears as a literal in the renderer. The two corrections are the halves of this criterion no body could see — see below. |
| AC2 | `settings set` edits the template only if the constraints allow, refuses a forbidden value naming the constraint, and a body shows both | **MET** | `each of the four refusals a set owes is ITSELF, and the template is not touched by any of them` shows both halves through the real entry point, with a positive control that DOES write. Re-driven by hand at this bench over a scratch project: an undeclared id, a FLOOR switch, a value outside the set, a forbidden combination and a malformed arity all exit 2 with the template byte-identical, and the forbidden-combination refusal is `constraintFindings` — the arm's own, not a second copy — naming both switches and both values. Round trip proved: `set` a departure then `set` it back restores the file byte for byte (sha256 equal). Phase 1's highest-suspicion attack, a hand-written validator agreeing with the schema by luck, is DEFEATED: the value set, the floor and the constraints are all read off the schema, and the floor rule agrees exactly with `resolveProcess`'s, so the surface cannot refuse what the arm accepts or accept what the arm refuses. |
| AC3 | the reference text is generated from the schema, never typed twice | **MET, with the residue filed** | `docs/reference/15-settings.md` exists and is generated whole — the currency body compares the committed BYTES against `renderReference(schema)`, so there is no typed flesh around a generated skeleton, and the command's own usage block reaches the page from the script's constant. Enforcement, which phase 1 pre-committed to requiring: the docs gate names `tools/e2e/tests/cli.spec.ts` as a reader of the chapter (re-derived here — the gate FIRES on that path and names that spec), so the page moving is owed by a suite. The remaining hole is the other direction, and the lane found it first: a schema-only change is told nothing (`docs-gate.mjs method/runtime/process-schema.yaml` is not owed, exit 0), which is T-300-s2, filed, with the whole-suite net as the standing catch. |

## The suites this range owes, at the tip judged

Derived at the bench with `gate-run.mjs --owed-set --range`, graded
through the blessed runner on the same range, port 25300.

| suite | ref | count | exit |
| --- | --- | --- | --- |
| parser | `88b82c9b` | 389 bodies | 0 GREEN |
| app | `88b82c9b` | 1171 bodies | 0 GREEN |
| e2e, 11 spec files | `88b82c9b` | 592 bodies | 0 GREEN |
| `docs-input-gate.spec.ts` alone, OUTSIDE the owed set | `88b82c9b` | 61 passed | 0 |

2152 bodies in the owed set. The last row is not owed and I ran it
anyway, because the diff adds a file under `docs/` and that spec walks
the tracked corpus — which is this lane's own T-300-s4, confirmed rather
than taken on trust.

## The security sweep — clean, and the one write path is structurally closed

The verb adds one new input path (`set <switch> <value>` from argv) and
one new write (the runtime template's `switches:` block). A value can
only reach the writer after `sw.values.includes(value)` and an id only
after the schema resolves it, so a hostile value has no route to the
file. Driven at this bench: a value carrying a newline and a second key,
a value carrying a quote and a bracketed section header, a YAML anchor, a
20,000-character value, a climbing switch id and an absolute switch id —
every one refused at the schema's own value set or switch set, exit 2,
with the template byte-identical across the whole sweep. No shell, no
`eval`, no regex built from user input (both patterns are static and
anchored, so no ReDoS), no traversal (both written paths are constants
joined to the root). No dependency was added — `yaml` was already this
package's, and no manifest moved in the range. No secret is read or
printed; the listing renders schema fields only.

## The two assigned corrections

Both are halves of AC1 this implementation ALREADY KEEPS and that no body
could see, because the one tree every body renders over decides neither.
This repository departs from its profile at NO switch, so a listing
printing the profile's value instead of the project's is indistinguishable
here; and every one of the six bodies injects its own `readings`, so a
command that never went to the tree for them is indistinguishable too.
That is the one-arrangement defect the role file calls the one this
method produces most, and it is present twice in the same criterion.

Both bodies are committed on this bench AFTER this verdict, in
`tools/e2e/tests/cli.spec.ts`, the spec the properties live in.

**Correction 1 — the listing goes to the project's own tree for its
readings.** GREEN against the implementation as shipped: `cli.spec.ts`
56 passed. RED against an implementation lacking the property: the mutant
below, 1 failed / 55 passed — my body alone. The body also carries its
control evaluated where the deciding arrangement is ABSENT: the same
schema and template in a project with no meters prices no band, and the
same command falls back to the seat's estimate for every switch rather
than failing, which is the behaviour the notes argue for and nothing
measured.

**Correction 2 — a departure is listed at the value the project resolves
to.** GREEN as shipped: 56 passed. RED under its mutant: 1 failed /
55 passed, my body alone. The body renders the listing twice over one
fixture — once before the departure, where the state column and the
profile's own value are the same string and nothing can be decided, and
once after — so the arrangement's absence and its presence are both in
the record.

**KILL-SET CONTAINMENT.** The two kill sets are disjoint, not merely
unequal: mutant 1 is invisible to correction 2 (its fixture has no
meters, so the tree prices nothing either way) and mutant 2 is invisible
to correction 1 (its tree has no departure, so the resolved value and the
profile's are the same string). Neither contains the other, and each
lands at the site its property lives — the fallback that fetches the
readings, and the line that renders the state column. Both were restored
and the restore proved by sha256: `tools/e2e/scripts/settings.mjs` is
`ddc41536f344265f8fa7a20d3314ae765da2cb41e62bab687c9a2daef146d01a`
before the first plant and after the last restore.

```mutant
correction: 1 — the listing goes to the project's own tree for its readings
file: tools/e2e/scripts/settings.mjs
spec: tools/e2e/tests/cli.spec.ts
body: the listing goes to the PROJECT'S OWN tree for its readings — the measured column is not a rendering of numbers somebody handed in
message: shows this tree's reading for
--- old
    const readings = io.readings ?? treeReadings(root);
--- new
    const readings = io.readings ?? new Map();
```

```mutant
correction: 2 — a departure is listed at the value the project resolves to
file: tools/e2e/scripts/settings.mjs
spec: tools/e2e/tests/cli.spec.ts
body: a DEPARTURE is listed at the value the PROJECT resolves to, marked against the profile's own
message: the state column carries the value THIS PROJECT resolves to
--- old
    out.push(`  ${row.id} = ${row.value}${marks.length === 0 ? "" : `  [${marks.join("; ")}]`}`);
--- new
    out.push(`  ${row.id} = ${row.profileValue}${marks.length === 0 ? "" : `  [${marks.join("; ")}]`}`);
```

## The in-fence follow-through, and one note about its form

The range carries one change no acceptance criterion asked for: the
docs-gate spelling of the generated page's path, in the commit that names
itself a follow-up. I graded it as part of the diff and re-derived both
halves at this tip: the gate does name `cli.spec.ts` as the reader of
`docs/reference/15-settings.md`, and the effective change is two lines of
code with the rest comment, well inside the size limit, inside the fence,
adding no criterion. It is correct and load-bearing.

The note is FORM, and it is not a correction because there is no property
to pin — I say so in as many words rather than leave a block missing. The
notes declare it in unusual detail, with its measurement and its
counterfactual, but under a heading of its own rather than under
`In-fence follow-through`, and without naming the lines it moved. The
declaration's substance is met; the heading the rule names is the thing a
later reader greps for, and it is not there.

## What I looked for and did not find

Phase 1's typed-mirror attack on the listing, its partial-derivation
attack on the four columns, its laundered-generator attack on the
reference, its refusal-with-a-side-effect attack on the template and its
zero-exit-on-refusal attack all came back clean, each by a measurement
named above. The listing over an empty schema and the profile-line
consistency attack are unreachable as posed: the schema is this
project's, and the state column is the resolution rather than the
profile column, which correction 2 now pins.

One boundary is real and is not a defect: where a project's `process:`
section is followed by a top-level comment, the departure is written
after that comment rather than inside the block a reader would look in.
Both readers still agree — a real YAML parser and the arm's own both
resolve the value, and the removal round trip still restores the file —
so nothing breaks; what suffers is the readability the edit's whole
argument rests on. Filed as T-300-s5 rather than folded in here.

**APPROVED WITH ASSIGNED CORRECTIONS.** The command is a derivation of
the schema at every column the card names, the edit is the arm's own
validation with the template's shape kept, the reference is generated
whole and its currency is owed by a suite, and the security sweep is
clean. Two bodies are owed for the two halves of AC1 that the one
available fixture could not decide, and they are committed on this bench.
