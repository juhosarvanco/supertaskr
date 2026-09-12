---
id: T-317
title: "The process settings reader — the schema parser, the section reader, the resolver, the ledger and the constraint findings — moves out of the dispatch arm into lib/parser as a pure module exported through the browser entry `@supertaskr/parser/pure`, the arm importing it and re-exporting its symbols unchanged, the generated reference byte-identical, so the terminal, the app screen and the skill can read one implementation"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: building
suggested_by: "the owner's rulings of 2026-09-12: T-300 first, then an ordinary card extracts the shared reader; the reader lives in the parser library; the Codex orchestrator's review of 2026-09-12: the app imports the parser's pure entry"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/src/pure.ts, lib/parser/src/index.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/architecture/components/C-06-lib-parser.md, docs/CONVENTIONS.md, .github/workflows/ci.yml]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

The schema parser, the template section reader, the resolver, the ledger and the constraint findings live inside `dispatch-brief.mjs` (T-299); the terminal command (T-300) imports them from there and plans its own edit with its own helpers. The app imports only `@supertaskr/parser/pure`, the browser-safe entry; the root entry is filesystem-backed. Edit planning is not part of the reader: it stays with the terminal command (T-300-s6) and later with the follow-up card that runs the command from the app.

### Acceptance criteria

- WHEN the module lands in the parser library THE five symbols SHALL be exported through `@supertaskr/parser/pure` with the same names and behaviour they have in the arm, with no filesystem access in the module, and the arm SHALL import them and re-export every symbol it exports today, so every current importer and test is unchanged; a body SHALL exercise the public browser entry, not only the module.
- WHEN the library's tests run THE parser and the resolver SHALL be pinned by the same cases the arm's spec pins today, moved or shared, and the brief spec bodies that compare the hand parser to a real YAML parser SHALL stay green.
- WHEN the terminal command's reference is regenerated after the move THE page SHALL be byte-identical; any behaviour change is a separate decision and not this card's.
- WHEN the graph is regenerated THE app-to-parser edge SHALL be the only edge the app gains and the parser component's record SHALL name the module.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before a line of the implementation

- Criterion 1 — the schema parser, the section reader, the resolver, the
  ledger and the constraint findings live in the parser library as one
  module that takes TEXT and returns values, reads no file and imports no
  node builtin; the browser entry exports them under the names the arm
  uses today; the arm imports that module and still exports every symbol
  it exports today, so the settings command, the merge verb, the brief
  spec and the CLI spec are untouched; and a body exercises the browser
  entry rather than the module file.
- Criterion 2 — the library's own test pins the parser and the resolver
  with the cases the arm's spec pins today, shared rather than lost, and
  the brief spec's bodies that compare the hand parser with a real YAML
  library stay green at my tip.
- Criterion 3 — the terminal command's generated reference regenerates
  byte-identical after the move; a difference is a finding I report, not
  a page I rewrite.
- Criterion 4 — the graph regen adds no app edge but the one the app
  already owes the parser, and the parser component's record names the
  module.


### What was done

The five symbols the card names, plus the accessor they are built on, are
now `lib/parser/src/process-settings.ts` and are exported through the
browser-safe entry. The dispatch arm imports that module and re-exports
them under the names it has always carried, so the settings command, the
merge verb, the brief spec and the CLI spec are untouched: the arm's own
file lost 441 lines and gained an import.

WHAT STAYED IN THE ARM, and why: `loadProcess` (it reads two files off
the disk), `switchReadSites` (it scans the arm's own source), the six
switch bodies that branch on a value, and the arm's `ProcessFinding`
class. The module itself imports nothing at all — no node builtin, no
dependency — which is what lets the app's webview render the same
settings the terminal prints, and a body pins that with a positive
control.

THREE DECISIONS A READER SHOULD SEE:

1. THE ERROR CLASS IS A PARAMETER, because it is the one thing that could
   not cross the package boundary. The arm's `ProcessFinding` is a
   `DispatchLaneFinding` on purpose — the dispatch arm catches that class
   and reports a refusal rather than crashing — and a class declared in
   the parser library cannot extend one declared in the arm. So the
   class travels the other way: `processSettingsReader({ Finding })`
   binds every refusal to the caller's class, the arm passes its own, and
   the entry exports the same six symbols bound to the library's own
   default for a caller that has none. The arm's refusals are still
   `ProcessFinding` and still `DispatchLaneFinding`, which a body checks
   from both sides.
2. THE ARM IMPORTS THE BUILT BROWSER ENTRY BY RELATIVE PATH, which is the
   spelling the dispatch-order script already uses for the built root
   entry and the artefact the e2e preflight already asserts into
   existence: the e2e package declares no dependency on the parser and
   its manifest says so, and a landing-gate body pins that. The load is a
   dynamic import awaited at module scope so that a tree with no build
   gets a refusal naming the build order rather than a bare resolver
   error.
3. THE LIBRARY'S OWN TEST HOLDS NO REPOSITORY ROOT. Its first draft read
   the shipped schema and the shipped template the way the fence test
   reads the live board; the docs gate refused that by name — a new
   root-anchored file in a suite not universally owed must be argued in a
   ledger this lane's fence does not carry. The module takes TEXT, so the
   test was rewritten onto text fixtures, and the shipped documents are
   read through this same reader by the brief spec, which owns the live
   tree. Nothing was lost and no fence was widened.

### Criterion by criterion

- Criterion 1 — MET. The six symbols are exported from the browser entry
  and from the root entry; the arm re-exports every symbol it exported
  before (`parseProcessSchema`, `processSection`, `resolveProcess`,
  `switchValue`, `processLedger`, `constraintFindings`, `ProcessFinding`,
  `PROCESS_SCHEMA`, `PROCESS_SECTION`, `RUNTIME_TEMPLATE`,
  `SWITCH_FIELDS`, `SWITCH_TYPES`) and no importer changed: the settings
  command, the merge verb and the CLI spec are not in this diff. The
  module reads no file, pinned by a body with a control. The bodies in
  the library's test import the browser ENTRY, not the module file. The
  brief spec gained one body: the arm's symbols and the library's agree
  field for field on the shipped schema and on the ledger, the arm's
  refusal is still both classes, and the refusal SENTENCES exist in
  exactly one file of the two — which is the check that would catch a
  copy coming back.
- Criterion 2 — MET. The library's test pins the parser and the resolver
  on text fixtures, including the real-YAML agreement the arm's spec
  pins, every refusal of both, the accessor, the ledger and the
  constraints: 23 bodies. The arm's own bodies are unchanged and green,
  the two that compare the hand parser with a real YAML library included.
- Criterion 3 — MET. `settings reference --check` answers 0 at this tree:
  the committed page is a current generation, byte for byte, after the
  move. The page's sha256 is unchanged. And the check is not vacuous:
  under a mutant in the moved parser it answers 1 naming the byte counts,
  and under another it answers 3 with the moved resolver's own refusal.
- Criterion 4 — the app half is MET by construction and the record half
  is DONE; the regeneration itself is the merge's step. No file under the
  app's tree is in this diff, so the app gains no edge at all beyond the
  one it already owes the parser. The graph is outside this lane's fence
  and the parser's source is indexed, so the committed graph is stale in
  this lane by construction and its regeneration belongs to the
  integrator, per the graph-regen rule. The parser component's record now
  names the module.

### Findings, and one of them blocks the merge

- THE CI LINT JOB BUILDS NO PARSER, AND THREE OF ITS STEPS NOW RED. That
  job installs the e2e package and nothing else. Measured in this lane by
  moving the parser's build output aside: the e2e typecheck answers 2
  with a TS2307 naming the built entry, the docs gate answers 1, and the
  census check answers 3 with the arm's own refusal. With the build
  present all three are green. The repair is the two steps every other
  job already carries. The workflow file is outside this fence: asked for
  in the lane's ask file, parked, and filed as T-317-s1. **Do not push
  this merge without it.**
- THE COMMITTED CENSUS IS STALE, AND IT WAS STALE BEFORE THIS LANE. At
  this lane's base with this lane's changes stashed, the committed page
  is 95835 bytes and a fresh generation is 95959; at this tip it is 95835
  against 96059, so 100 of the 224 bytes are this lane's one new body and
  124 were already there with no commit to a spec file between. The
  regeneration is the merge's write, never a lane's. Filed as T-317-s3,
  which also carries the sharper half: since this card the census refuses
  outright on a tree whose parser is not built.
- THE CLI'S DOCTOR does not declare the parser build for the verbs that
  front the arm's scripts, so an installed package now answers a
  loader error where it has a named repair to give. Filed as T-317-s2.
- No in-fence follow-through was performed: nothing outside the card's
  own work was repaired in this lane.

### Figures, each at the tree this commit carries

- the arm's file: 8006 lines at the base, 7565 at this tip.
- the library's census: 412 bodies over 17 files, of which 23 over 1 file
  are this lane's; 389 over 16 at the base.
- the brief spec: 178 bodies, of which 1 is this lane's; 177 at the base.
- `settings reference --check`: exit 0; the page's sha256 is
  e4b7c152d4edd3396bdf6dc74643e04d522f5d096bdeb2bafb09f382003ce019, the
  same bytes the base carries.
- `capabilities:check`: exit 1, committed 95835 against a fresh 96059.
- the drill: 29 mutants in the moved module, every one RED, every one
  restored and proved by sha256, and every one of the 23 new bodies red
  under at least one; plus two in the arm, one killing 44 bodies of the
  brief spec and one killing exactly the new body. The report carries the
  block.

### For the verifier

The three decisions above are where to attack. The sharpest questions I
can name: whether binding the error class is the right shape or a
duplication of classes; whether the module-scope await is safe in every
consumer of the arm (11 scripts and 3 hooks reach it, and the hooks reach
it only in prose today); and whether the brief spec's new body would
really catch a second spelling creeping back, which the drill answers on
one sentence and not on all of them.

## Verdicts
