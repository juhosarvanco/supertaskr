---
id: T-300-s6
title: "`npx supertaskr settings` reads through lib/parser's process settings module and keeps no reader, resolver or constraint engine of its own — its edit planning, the YAML formatting of one departure, stays explicitly the command's — and its public surface, exit vocabulary and generated reference are unchanged"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 2
status: verifying
suggested_by: "the owner's ruling of 2026-09-12 that T-300 lands first and adopts the shared reader in a follow-up; the Codex orchestrator's review of 2026-09-12 on the planning boundary"
blocked_by: [T-317]
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

T-300 landed on 2026-09-12 importing the resolver from the arm and planning its edit with its own small helpers, which already call the shared constraint function; the verifier's two corrections pinned that the listing reads the project's own tree and that a departure is listed at the resolved value. Formatting a YAML edit is not a second reader.

### Acceptance criteria

- WHEN the command lists, edits or renders THE rows, the resolved values and the constraint refusals SHALL come from the parser library's module through its browser entry, and the command SHALL keep no parser, resolver or constraint engine of its own; its edit planning SHALL stay the command's, named as such in the notes; its `main(argv, io)` seam, its command forms, its exit vocabulary and the generated reference SHALL be unchanged and byte-identical, pinned by the existing bodies.

## Implementation notes
<!-- executor appends before finishing -->

### The criterion, echoed as a checklist BEFORE the code

Restated in my own words, one line each, written before a line of the
implementation was touched:

1. The listing's resolved values reach the rendering through the parser
   library's process settings module, imported by this command through
   that library's browser-safe entry.
2. The edit's constraint refusals come from that same module, and not
   from any judgement this command holds.
3. This command keeps no parser, no resolver and no constraint engine of
   its own: nothing in it parses the schema, resolves a profile, or
   rules on a combination.
4. The edit planning stays the command's, and these notes say so: the
   YAML scalar spelling, the located switches block and the one-line
   template edit are this command's own, and none of them moved.
5. The `main(argv, io)` seam keeps its signature and both injection
   points.
6. The command forms are unchanged: the bare listing, `set` with a
   switch and a value, `reference` bare and with `--write` and with
   `--check`, plus `--root` and the help flags.
7. The exit vocabulary is unchanged: clean, found, called wrong, could
   not run.
8. The generated reference chapter is unchanged and byte-identical,
   regenerated at my own tip and shown clean by a diff that exits zero.
9. The bodies that already pin all of that stay green, and the property
   the card adds gets a body of its own.

### What was built

The command now loads the parser library's process settings module from
that library's BUILT browser-safe entry, `lib/parser/dist/pure.js`, and
takes the schema's vocabulary, the LEDGER and the CONSTRAINT FINDINGS
off it. Before this card those four names arrived from the dispatch
arm, which had re-exported the library's own module since T-317 — so
the values were already the library's and the READING went through the
arm. The card's question is which of the two this surface reads, and the
two answer identically, which is why the body that pins it is written
against the reading rather than against the output.

Two symbols still come from the arm, and neither is a reader. `EXIT` is
the house's exit vocabulary, which this command spells nowhere of its
own. `loadProcess` is the one function in the repository that opens the
schema and the template off disk: the library's module is browser-safe
by construction, imports no node builtin and reads no file, so the
file-reading half has to live where `node:fs` may be imported — and a
second copy of it in this command would be exactly the second reader the
card removes. Everything it hands back, the parsed schema and the
resolved settings, is the library's own work.

The JSDoc types for the schema and the settings now name the library's
built entry too; `LoadedProcess` still names the arm, because that shape
is the arm's.

### THE EDIT PLANNING IS THE COMMAND'S, and that is deliberate

The criterion asks for this to be named, so: `setPlan`, `yamlScalar`,
`switchesBlock` and `editTemplate` are this command's own and not one
line of them moved. They are not a reader and not a judgement. Formatting
one departure into a YAML section a human wrote — quoting a scalar a
YAML reader would give back as a boolean, locating the `switches:` block
rather than reconstructing it, replacing or removing or inserting ONE
line so every comment survives — is a property of THIS surface's output
format. The app's settings screen will not write YAML at all, and a
module shared with it would be carrying a rule that applies to one
caller. What `setPlan` does NOT own is the judgement: its fourth refusal
is the library's `constraintFindings` run over the settings the write
would produce, and the new body pins that the refusal quotes those
findings word for word rather than restating them.

### Why the library is loaded by a dynamic import, measured rather than preferred

A static `from` specifier would have moved two things, both measured at
this card's tip.

A missing build would be refused by the ESM LINKER, which resolves the
whole graph before anything evaluates, so `ERR_MODULE_NOT_FOUND` would
print where the arm's loud refusal naming the ADR-011 build order prints
today. Measured in a scratch probe of three modules reproducing the
shape: with a static specifier the linker's error is what surfaces and
the catch never runs; with a dynamic one, the statically imported module
evaluates first and ITS refusal is what prints.

And the front derives what a verb reaches outside its own package from
`from` specifiers alone, so a static import would make this verb refuse
in an installed copy through a path no other verb of the loop takes —
a change to the command's public behaviour, which the card forbids. That
blindness is itself a finding and is filed as T-300-s8.

There is deliberately NO second refusal message beside the dynamic
import. The arm is imported statically above it and is evaluated first,
so a copy of the build-order message here would be a refusal no
arrangement can reach. The reasoning holds only while the command keeps
importing the arm, and that fragility is filed as T-300-s9.

### What the reference did

Regenerated at this card's tip with `node tools/e2e/scripts/settings.mjs
reference --write`, which reported 26168 bytes written, and
`git diff --exit-code docs/reference/15-settings.md` exits 0 — the page
is byte-identical to the committed one. The chapter is a function of the
schema alone, and nothing this card touched is the schema.

### The unchanged half, measured rather than asserted

The exported name set of the command's module is identical before and
after, compared by sorting the export lines on both sides. The bare
listing rendered at this tip is byte-identical to the listing the base
version renders over the same tree, compared with `diff`, which found no
line. Every command form was exercised unpiped: the listing, `reference`
bare, `reference --check`, `--help` all exit 0; a stale page exits 1;
each of the four refusals and an unknown subcommand exit 2; a tree
carrying no schema exits 3. The `main(argv, io)` signature and both
injection points are untouched.

### For the verifier

The body this card adds is a READING body: it derives the script the
`settings` verb fronts from the front's own table, reads that file, and
checks the import list, the absence of any locally declared reader
symbol, and two relations against the library called directly — the
command's rows against the library's own ledger, field for field, and
the command's fourth refusal against the library's own findings, word
for word. Its positive control is a combination the schema ALLOWS, which
the library returns no finding for and the command does not refuse.

The tree-readings body's precondition is a merge newer than the newest
checkpoint, which holds at this base; it passed here.

### What was noticed and not done

- T-300-s8 — the front's out-of-package derivation reads static import
  specifiers only, so the parser's built browser entry is invisible to it
  in both the arm and this command; measured at this tip, the `settings`
  verb derives two reaches and neither is that entry.
- T-300-s9 — loading that entry is spelled once per consumer, each with
  its own catch naming the same build order, and the newest consumer
  carries none because evaluation order hands it another module's.

### Where the brief was wrong

The seat's dispatch note asked me to measure a 2026-09-13 observation
that `node tools/e2e/scripts/cli.mjs settings reference --write` exited
0 and wrote nothing while the direct invocation wrote the file, and to
rule it either this command's fault or a card. It is neither. The front's
module carries no entry guard ON PURPOSE, and the package's bin entry
beside it says so in its own header: a guard inside the module would turn
a symlinked checkout or a shim into a silent exit 0 that ran nothing, so
the bin file is the entry and the module stays side-effect free for a
spec to import. Run through the package's bin the verb writes the page
and exits 0. The observation is an artefact of invoking the module
rather than the entry, and nothing is owed.

## Verdicts

### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

One pass at the STANDARD tier, taken on the bench worktree `supertaskr-V-T-300-s6`
detached at `b62b706bcc6e0648894315b556aa0d3c5ddd3687`, against the base
`869534e2782f30f1867b8c23ab4a057c6568cc98`. Every figure below names the ref it was
measured at.

attack set: sha256:64a723640c1d2abffa54651234a40ce9180b31a2c0fa4a82c856585af5b632e5 (attack-set-T-300-s6.md)
ground: sha256:21466f4866a2b5b0b7c6d3e338eaca2ac48dc814ec1aabe4c6e056e0cb4e941d (ground-T-300-s6.md)
card at the base: sha256:1e1ac8ef6532c7669078849212d43a35f2075fe935b2903ab73e4f75cc217fc6

All three digests were re-computed on this bench before the diff was opened and each
matched the sealed copy.

#### The frame I actually had

Two spawns, genuine. Phase 1 was its own tool-less spawn; the attack set was written and
hashed against the card at the base, and this spawn opened the diff before the notes and
the notes before the executor's report. The brief names the tier and its duties section
names no executor-derived specific, so phase 1 was clean above the line. Phase 1 disclosed
two leak channels the dispatcher did not put there — a harness environment block carrying
five recent commit subjects on the integration branch, all of them T-317 and T-312, and a
standing memory file naming sibling cards — and neither disclosed this lane's work. I
repeat the disclosure here because that environment block is a vector the arm does not
control.

**This brief carries no CONTEXT PACK**, which this role's step 0 calls a dispatch fault and
answers by reading `docs/CONVENTIONS.md` end to end. I read it whole, 2344 lines, and say so
here as that step requires. It is not a fault of this dispatch: `docs/STATE.md` records NO
VERIFIER PACK as the arm's standing state with the gap already filed (T-296-s10). Two of its
bullets paid for the reading immediately — the poison catalogue's shape EIGHT, which names
this pass's central finding by name, and the cheap keeper that forbids this machine's home
directory in an added line, which is why no absolute path appears above.

#### A row per acceptance criterion

The card carries ONE criterion and it is compound. Each clause gets its own row, because a
verdict with one row for a nine-clause criterion has not said what it approved.

| # | Clause | Verdict | The evidence that decided it |
|---|---|---|---|
| 1 | The ROWS come from the parser library's module through its browser entry | MET, and UNPINNED — correction 1 | The diff replaces the arm's six-symbol import with `{ EXIT, loadProcess }` and adds `const processPure = await import("../../../lib/parser/dist/pure.js")`; `settingsRows` returns that namespace's `processLedger` mapped. The file the specifier names is the file `lib/parser/package.json`'s `exports["./pure"].import` names (ground M1), and there is no `browser` condition for Node to resolve differently (M1). The import EDGE moved, which is the only reading under which this clause is not satisfied by the empty diff — the attack set pre-committed to judging it there. |
| 2 | The RESOLVED VALUES likewise | MET, with the transit named | `loaded.settings` still arrives through the arm's `loadProcess`. Read at the tip, that function reads two files and then calls only the library's `processSection`, `parseProcessSchema`, `resolveProcess` and `constraintFindings`; it holds no parse, no resolution and no constraint of its own. The resolution is the library's work; the file-opening half is the arm's, which is where `node:fs` may be imported. A second copy of that half in the command would be the second reader this card removes. |
| 3 | The CONSTRAINT REFUSALS likewise | MET | `setPlan`'s fourth refusal calls `constraintFindings` off `processPure`. Probed at the tip: `settings set record.bands off` exits 2 and prints the library's own `FORBIDDEN COMBINATION:` sentence, byte-identical to the same probe run against the base version of the command over the same tree. |
| 4 | The command keeps NO parser, resolver or constraint engine of its own | MET | None of the six reader symbols is declared in the command. The three refusals `setPlan` owns before the fourth are lookups into the parsed `schema` object — `schema.switches.get(id)`, `sw.floor`, `sw.values.includes(value)` — and not a table of the command's own, so the attack set's "data is an engine" line finds nothing to bite: no key list, no defaults map, no value enum survives in the file. |
| 5 | The EDIT PLANNING stays the command's, named as such in the notes | MET, with a wording defect — correction 2 | `setPlan`, `yamlScalar`, `switchesBlock` and `editTemplate` are untouched by the diff; the notes carry a section headed that the edit planning is the command's and argue why. The claim holds against the call graph and not only against itself. But two of the command's own docblocks still attribute the ledger and the constraint findings to the ARM, which the same diff made false — correction 2. |
| 6 | `main(argv, io)` seam unchanged | MET | The sorted set of `export` lines is identical at the base and at the tip — 14 lines each, `diff` exit 0 — and `main(argv, io = {})` is among them unchanged. |
| 7 | The COMMAND FORMS unchanged | MET | Seven forms run at the tip and again with the base version of the command restored over the same tree: bare listing, `reference --check`, a forbidden-combination `set`, an unknown-key `set`, an unknown subcommand, `--root` at a tree with no schema, `--help`. Every stdout byte-identical under `diff` except the no-schema message, whose only difference is the `mktemp` directory the two runs were given. |
| 8 | The EXIT VOCABULARY unchanged | MET | The same seven probes: 0, 0, 2, 2, 2, 3, 0 at the tip, and the identical seven at the base version. The attack set's live worry was a NEW failure mode wearing an old code: with `lib/parser/dist` moved aside, the command exits 1 with the ARM's ADR-011 build-order message — and the base version, over the same arrangement, prints the same message at the same code, byte-identical. The build hazard is T-317's and this card does not widen it. |
| 9 | The GENERATED REFERENCE unchanged and byte-identical | MET | `docs/reference/15-settings.md` is not in the diff at all. Its sha256 at the tip is `e4b7c152d4edd3396bdf6dc74643e04d522f5d096bdeb2bafb09f382003ce019`, which is the ground's reading at the base (M10). |
| 10 | Pinned by THE EXISTING BODIES | MET | `tools/e2e/tests/cli.spec.ts` is +136 / −0: not one existing line is modified or removed. The body-title set at the tip is the base's 58 titles plus exactly one — no deletion, no rename, no relaxed expectation. Both of T-300's own verifier-correction bodies, the two the card's summary names, stand unmodified and green. |

#### The drills — what the card's new body pins, and what it does not

Four mutants, each planted at the site the property lives, read back from `git diff` before
the run, restored with `git restore --source=<tip>` and PROVED by sha256 against
`1ce2237906153bbf913c9766eacf6ad71ba26c8deca7d9650ed84909a720c40f`, which every restore
returned.

**D1 — the survivor, and this pass's central finding.** The card's one criterion asks that
the reading go through the LIBRARY'S browser entry rather than through the arm's re-export
of it. Point the one dynamic load back at `./dispatch-brief.mjs`, which re-exports the same
four symbols under the same names, and change nothing else: the arm's named import list is
untouched, the destructure is untouched, every value is identical. **All 57 bodies of the
owning spec stayed green** — the card's own new body among them. The property the card was
written for had no body under it. The reason is the poison catalogue's **shape EIGHT**: the
new body asserts `expect(source).toContain("lib/parser/dist/pure.js")` over the whole file,
and that file spells the same path four more times in JSDoc type annotations — documentation
ABOUT the pin, which is the likeliest author of the second copy, in the catalogue's own
words. The needle outlives the import. Correction 1 is the remedy the catalogue names:
narrow the haystack, with an anchor that is not the needle.

**D2 — the card's own drill, re-run.** A third symbol added to the arm's import list
(`PROCESS_SECTION`). RED, 1 failed / 56 passed: kill set exactly the new body. That half of
the body is well aimed and kills alone. It is also the mutant the executor's self-drill
planted, and its shape is why D1 survived — a mutant set derived from the PIN rather than
from the CRITERION, which the catalogue files as shape SEVEN.

**D3 — the relation half.** `settingsRows` made to drop its first row. RED, 2 failed / 55
passed: the new body and the pre-existing *"the settings listing names the profile and EVERY
switch the schema declares, in the schema's order"*. Neither body's kill set contains the
other — D2 kills the new body alone and nothing kills the new body that the listing body
does not — so both are load-bearing and neither is a restatement. Recorded because the
relation half, read alone, is close to a tautology: `settingsRows` IS `processLedger` mapped,
and the arm's binding and the library's binding compute the same values, which is exactly
why a body written against the OUTPUT could never decide this card. The executor says so in
the notes and is right.

**D4 — the correction body's own RED, taken before it was committed.** Below.

#### Security sweep — mandatory at this tier, and it found nothing

No new input path: the read path is `loadProcess` unchanged and the library's parse
unchanged, and the write path is not touched by the diff. The dynamic import's specifier is
a constant string, so there is no specifier injection. No dependency is added — no manifest
is in the diff, and the attack set's prediction that the fence was too short to reach one is
FALSIFIED by the ground (M12): `tools/e2e` declares no dependency on the parser, the root
carries no manifest, and the relative path to the built file is the only spelling available,
which is how the arm already reaches it. No secret, key or credential shape in the diff. The
barrel the command now loads has one top-level side effect, `const bound =
processSettingsReader()`, which is a pure call and touches no file and no global. The
prototype-pollution and YAML-injection surfaces the attack set listed are unmoved: the
settings are `Map` and `Set`, and the escaping is `yamlScalar`'s, which the diff does not
touch. One security-flavoured observation belongs to a filed card rather than to this
verdict: a dynamic load is invisible to the front's out-of-package derivation, so the front
cannot refuse a verb whose reach it cannot see. That is T-300-s8, filed by the lane, and it
is a property of the arm as much as of this command.

#### Architecture, conventions and the adjacent features

The diff matches `docs/ARCHITECTURE.md`'s C-02 shape — the front still fronts a script, the
verb table is untouched — and `docs/CONVENTIONS.md`'s PROCESS IS SETTINGS bullet, which
already rules that the terminal command, the app's settings screen and the skill render ONE
implementation. That bullet's sentence about the arm re-exporting the module stays true: the
arm still re-exports, and the diff removes no re-export. The Build and test bullet's clause
naming `dispatch-brief.mjs` as the script that needs the parser build before it runs is now
narrower than the tree, since this command is a second such script; the refusal it describes
is still the one that prints, measured above, so the bullet is not falsified, and the
duplication it points at is T-300-s9's subject. Nothing adjacent broke: the parser suite, the
app suite and the eleven owning spec files are green at this tip, and the reference page, the
front's verb table and the arm are byte-unchanged.

The lane performed no in-fence follow-through and declares none, and the diff carries no
change outside the card's three fenced paths and the task cards. The two cards it filed
carry their notes and Verdicts sections from birth and their statuses are in the parser's
vocabulary. Both corrections below land in files the card's own fence already admits, so no
fence widening is owed on the integration branch before this merge.

#### CORRECTION 1 — the reading body cannot see the regression it was written for

Assigned, and committed on this bench after this verdict as a body in
`tools/e2e/tests/cli.spec.ts`: *"the settings command LOADS the parser library's own browser
entry — the module it imports, and not a path its comments also spell"*.

What it does that the existing body does not: it strips the comments before it searches, and
it proves the strip ran rather than assuming it; it reads which file the browser entry IS off
the parser package's own `exports["./pure"]` map instead of typing a path; it resolves every
static and dynamic specifier from the command's own directory; and it requires that the
reaches landing inside `lib/parser` be exactly that one file. A side-door import of a second
deep path, a swap to the package's node entry, and the D1 swap back to the arm each red it.

BOTH READINGS, taken on this bench before the body was committed. **GREEN** against the
implementation carrying the property — the lane tip, 1 passed. **RED** against one lacking
it — the D1 mutant planted at `tools/e2e/scripts/settings.mjs`, whole spec run: 1 failed /
57 passed, the failure being this body alone and the printed message the one the block names.
Kill set exactly one, at the site the property lives, and not contained by any existing
body's: the 57 others are blind to that mutant, which is the finding. `npm run typecheck`
from tools/e2e exits 0 with the body in the tree.

```mutant
correction: the reading body cannot see the regression it was written for
file: tools/e2e/scripts/settings.mjs
spec: tools/e2e/tests/cli.spec.ts
body: the settings command LOADS the parser library's own browser entry — the module it imports, and not a path its comments also spell
message: the command does not load the parser library's browser entry ITSELF
--- old
const processPure = await import("../../../lib/parser/dist/pure.js");
--- new
const processPure = await import("./dispatch-brief.mjs");
```

#### CORRECTION 2 — two docblocks still say the arm owns what this card moved

Assigned, and committed on this bench after correction 1. **It owes no mutant block and this
sentence is that statement in as many words**: it is a wording correction with no property to
pin, so the block count below is one against two correction headings, deliberately and not by
omission.

The diff rewrites the command's header to say that the parser, the resolver, the value sets,
the floor and the constraints now come from the library through its browser-safe entry. Two
docblocks further down still say the opposite, and the same diff edited lines inside both of
them: `settingsRows`'s says *the ledger is the ARM'S own read*, and `setPlan`'s says the
fourth refusal *is `constraintFindings`, the arm's own*. Both were true at the base and are
false at the tip, and they are false about precisely the two symbols this card moved. A file
that contradicts itself about its own provenance is how the next reader learns the wrong
thing from the right file. Each is corrected to name the parser library. No spec pins either
sentence — grepped across `tools/e2e/tests/`, `lib/parser/` and `app/test` before the edit —
and the lines are in a file under neither `method/` nor `docs/`, so the merge's removed-line
keeper is not implicated.

#### The suites this range owed

Derived, never listed: `gate-run.mjs --owed-set --range` answers app, e2e and parser over the
five moved paths, with the end-to-end leg narrowed to eleven spec files. Run through the
blessed runner in its range form at `b62b706bcc6e0648894315b556aa0d3c5ddd3687`, port 15300,
runner exit 0.

| suite | ref | bodies | exit | verdict |
|---|---|---|---|---|
| parser | b62b706b | 412 | 0 | GREEN |
| app | b62b706b | 1171 | 0 | GREEN |
| e2e, scoped to the eleven owning spec files | b62b706b | 606 | 0 | GREEN |
| rust | — | — | — | not owed by the range's own derivation |

Beside them, at the same tip: `brief.mjs --task T-300-s6 --preflight` exit 0, read unpiped;
`npm run lint:docs` exit 0 over the whole-tree half with 0 findings; `npm run typecheck`
from tools/e2e exit 0; `npm run capabilities:check` exit 1 — STALE, committed 96059 bytes
against a fresh generation of 96200. The census staleness is expected and is the merge's to
regenerate, and my correction body adds a second sentence to it, so the integrator
regenerates against MY tip and not against this one. The graph regeneration fires on this
range and is the merge's too.

#### What I graded and did not block on

The two cards the lane filed are findings about the tree rather than about this diff, and
both are fairly scoped out of the criteria: T-300-s8 is a property of the front and of the
arm as much as of this command, and T-300-s9 names a fragility in the lane's own reasoning
that the lane itself argued for in writing. The exit-code collision the attack set predicted
— a missing parser build and a stale reference page both leaving 1 — is real, predates this
card in T-317, and is answered by T-300-s8's remedy rather than by a third card. I file no
new card.

#### Meters

| | |
|---|---|
| Wall clock, by phase | sealed inputs, role file and the three digests 3 min · the diff, the library and the call graph 5 min · `docs/CONVENTIONS.md` whole 4 min · the owed-set run, waited on with the arm 6 min · the behaviour matrix and the build-absent probes 4 min · four drills 6 min · the correction body, its two readings and this verdict 12 min. Roughly 40 min wall, 12:58 to 13:38 (+03:00).
| Context consumed | about 265K tokens, read off this session's own remaining-budget line; a property of the pass and not of the tree. |
| Model | `claude-opus-5@subagent`, set at session start and never switched. |
| Suites run | 3 graded — parser, app, e2e — once, in the range form, at the lane tip; plus targeted runs of the owning spec for every drill. |
| Bodies graded | 2189 at `b62b706b` (412 + 1171 + 606), and 57 of `cli.spec.ts` again under each of four mutants. |
| Mutants drilled | 4 — one survivor that is this pass's finding, two kill-set probes, one the correction body's own RED. Every restore proved by sha256. |
| Corrections assigned | 2 — one with a mutant block, one a wording correction that owes none and says so. |
| Cards filed | 0. |

#### The step-7 readings, taken at the tip THIS verdict created

The suite figures in the table above name `b62b706b`, the commit I was sent. My own
verdict and two correction commits made a tip nobody had tested, and one of them added a
body — so every one of those figures is stale at the tip an integrator will actually
merge. Re-derived at `a5a6061d000024f0d04085fe34cd829b55d7b064`, the bench tip, through the
blessed runner's range form over `869534e2..a5a6061d`:

| suite | ref | bodies | exit | verdict |
|---|---|---|---|---|
| parser | a5a6061d | 412 | 0 | GREEN |
| app | a5a6061d | 1171 | 0 | GREEN |
| e2e, the same eleven owning spec files | a5a6061d | 607 | 0 | GREEN |

One body more than at the lane tip, which is correction 1's. Beside it, at the same ref:
`brief.mjs --task T-300-s6 --preflight` exit 0 · `npm run typecheck` from tools/e2e exit 0
· `npm run lint:tokens` exit 0, clean over 187 token files and 1576 tracked text files ·
`npm run lint:docs` exit 0 over the whole-tree half.

**And one gate my own commits TURNED ON.** The METHOD EVAL GATE fires on a merge that adds
a line matching the citation grammar under `docs/tasks/`, and the lane's diff added none —
the executor's report correctly derived it NOT OWED. This verdict's `attack set:` line is
exactly that trigger, so the gate is owed at the merge because of me. Run at this tip:
`node tools/method-evals/run.mjs` exit 0 over 11 model-free evals, and
`node tools/method-evals/verdict-digest.mjs` on this card, handed the dispatching session's
scratchpad, answers VERIFIED for the one citation — 1 verified, 0 REFUSED, 0 unavailable,
exit 0.

`npm run capabilities:check` is exit 1 at this tip — STALE, 96059 bytes committed against a
fresh generation of 96334. It was 96200 at the lane tip; the extra 134 bytes are correction
1's body. The integrator regenerates against THIS tip and not against the lane's. The graph
regeneration fires on the range and is the merge's.
