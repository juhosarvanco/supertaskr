---
id: T-300-s6
title: "`npx supertaskr settings` reads through lib/parser's process settings module and keeps no reader, resolver or constraint engine of its own — its edit planning, the YAML formatting of one departure, stays explicitly the command's — and its public surface, exit vocabulary and generated reference are unchanged"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 2
status: building
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
