---
id: T-317
title: "The process settings reader — the schema parser, the section reader, the resolver, the ledger and the constraint findings — moves out of the dispatch arm into lib/parser as a pure module exported through the browser entry `@supertaskr/parser/pure`, the arm importing it and re-exporting its symbols unchanged, the generated reference byte-identical, so the terminal, the app screen and the skill can read one implementation"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: done
suggested_by: "the owner's rulings of 2026-09-12: T-300 first, then an ordinary card extracts the shared reader; the reader lives in the parser library; the Codex orchestrator's review of 2026-09-12: the app imports the parser's pure entry"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/src/pure.ts, lib/parser/src/index.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/architecture/components/C-06-lib-parser.md, docs/CONVENTIONS.md, .github/workflows/ci.yml]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### 2026-09-12 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Guarded tier, two spawns. Phase 1 wrote the attack set with no tools, no
diff and no notes; this spawn holds tools and read the diff before the
notes. Bench detached at the tip, base afb22cdcd2e80d4948c753befc342155ebf7e749, tip
f65f7e25452e5970921704794a41ac7b08c251b3.

**The three sealed inputs, cited and verified against the saved files:**

- the attack set — sha256 `898eceb481431ce7bb5cac39a26f00ea4b9bd50823735fac41b6b757e7b79a6c`
- the ground taken at the base — sha256 `1368aed9fc5d6b47975e38d07a39950813e5a57d5c57fa9e5c43cf845b815589`
- the card at the base — sha256 `6ca2a5df25ae67c41e5cc079c024703476daf28d4d3c37c36a3f26ab118c9195`, recomputed here from the commit rather than the worktree

**The frame I actually had.** Two spawns, guaranteed by the spawn and not
by a discipline. The brief named no executor-derived specific — no mutant
count, no path count, no suite figure. One leak I report rather than hide:
orienting on the bench with `git log` put the executor's own commit
subjects in front of me before the diff, which is the leak two earlier
verifiers reported and which no brief can prevent. The attack set was
already written and sealed by then, so nothing it contains was shaped by
it. The tier on the brief was guarded; no dispatch fault on that axis.

#### The suites, at the tip and by count as well as exit

`node tools/e2e/scripts/gate-run.mjs parser app rust e2e`, port 15317,
ref f65f7e25452e5970921704794a41ac7b08c251b3, exit 0:

| suite | bodies at the tip | at the base (ground M12) | exit | verdict |
|---|---|---|---|---|
| parser | 412 | 389 | 0 | GREEN |
| app | 1171 | 1171 | 0 | GREEN |
| rust | 655 | 655 | 0 | GREEN |
| e2e | 1042 | 1041 | 0 | GREEN |

The counts move by exactly the bodies this diff adds — 23 in the library
and 1 in the arm's spec — so nothing was skipped, filtered or dropped
from a project's include glob to buy a green.

#### A row per acceptance criterion, with the reading that decided it

| criterion | verdict | the evidence, and the command or body that produced it |
|---|---|---|
| AC1 — five symbols through the browser entry, same names and behaviour, no filesystem access in the module, the arm imports and re-exports every symbol it exports today, a body exercises the public browser entry | **MET** | Export sets compared by RESOLVED BINDING, not by source text: the arm at the base and the arm at the tip both export 173 names, none lost and none gained; the five are functions on both sides and the three string constants compare equal by identity. A differential over 95 cases — the shipped schema and template, every switch through the accessor, 22 malformed schemas, 10 malformed templates, 9 resolver unhappy paths, a dropped switch through the ledger and the findings, and 4 malformed needs — found ZERO differences in value or in refusal MESSAGE between the base arm and the moved module. The module imports nothing at all (`grep` for imports: none; for `node:`, `process.`, `console.`, `Buffer`, `import.meta`: none), and a walk of the built entry's transitive graph over 16 files reaches no node builtin. The entry body is not a smoke test: MUT-3 below reds 11 of the 23. |
| AC2 — the parser and the resolver pinned by the same cases the arm's spec pins today, moved or shared; the YAML-comparison bodies stay green | **MET, in the strongest available form** | The arm's spec is 75 added lines and **0 deleted** — not one case moved, not one expectation rewritten, not one stub left behind, which is the whole of attack A2.1 and A2.2 refuted by the diff's own numstat. The nine bodies the ground names at M3 are byte-unchanged and now run against the moved implementation through the re-export, so the pin is SHARED in the only sense that cannot drift. Both YAML-comparison bodies are green in the 1042-body run, and the library adds its own agreement body against the real `yaml` package over a hand-typed fixture. The library's fixtures are TYPED TEXT constants, not computed from the code under test, so A2.3's one-arrangement-decides-both-sides defect is absent. |
| AC3 — the regenerated reference page byte-identical | **MET, against a PARTIALLY DEGENERATE oracle — see P2** | Re-run at the tip rather than read off the diff: `node tools/e2e/scripts/settings.mjs reference --write` twice, exit 0 both times, empty stderr, 26168 bytes, sha256 `e4b7c152d4edd3396bdf6dc74643e04d522f5d096bdeb2bafb09f382003ce019` both times and identical to the page at the base; `git status` clean after both writes. The oracle is LIVE for the schema parser: with a marker planted on the free-text field inside the MOVED module, the regenerated page moves 42 lines and its sha256 changes, and a coarser mutant takes the generator to exit 3 with the moved module's own refusal — so the page is genuinely a function of the code that moved. It is BLIND to the resolver, the accessor, the ledger and the findings: with the constraint refusal reworded, `--check` still answers 0. |
| AC4 — the app-to-parser edge the only edge the app gains; the parser component's record names the module | **first half DEGENERATE (pre-committed as P1), second half MET** | The graph was regenerated at the tip (`SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index --test self_graph -- --ignored`, exit 0) and the app's outgoing edge set compared against the base graph: **no edge kind gained, none lost**, and the app-to-parser import edge stands at 31 on both sides. The app gains no edge because no file under the app is in this diff and the edge already existed at the base — which is what P1 pre-committed to calling degenerate. The regenerated graph is 604 added / 7 removed lines, all of it the library's own two new files, so the COMMITTED graph is stale at this tip and its regeneration is the merge's write. C-06 names the module in prose that no generator writes (ground M8). |

#### The pre-commitments, honoured

- **P1 — CONFIRMED, and it stands as written.** The app-to-parser edge
  existed at the base with 31 import edges, so AC4's first clause is
  satisfiable by gaining nothing, and it was. Said whatever the diff
  contained, and the diff happens to be good.
- **P2 — CONFIRMED at the tip as well as at the base.** Byte-identity of
  the reference page pins the schema parser and the schema document and
  pins NOTHING about the resolver, the accessor, the ledger or the
  constraint findings. Those are graded on MUT-1 and MUT-2 instead, both
  of which killed at the site.
- **P3 — STANDS for the entry, LIFTED for the module.** At the base
  nothing reddened when a node builtin was added to the browser entry
  (ground M16). At this tip the same mutation in the entry barrel still
  reds nothing — parser suite 412 passed, types exit 0 — so the entry's
  browser-safety is enforced by no gate. What the card DID buy is the
  module's: MUT-5 below reds the new purity body. **No green Node suite
  is quoted anywhere above as evidence of purity**; the purity readings
  are the static scan and the import-graph walk.
- **P4 — MOOT, and the control was run anyway.** No vitest alias and no
  tsconfig path for the package exists, so no body was deceived about
  what it resolves. MUT-4 below is the control and its reading is
  reported honestly: none of this card's new bodies exercises the
  package's `exports` map.
- **P5 — settled.** The arm exported exactly the five the card describes
  plus the accessor they are built on; six symbols moved and the verdict
  grades six.

#### The drills — aiming stated, landing read from `git diff`, every one restored and the restoration proved by sha256

| mutant | where it lives | reading |
|---|---|---|
| MUT-1, code, at the resolver's PRECEDENCE site: the departure is recorded and not applied | the moved module | library suite **4 failed / 19 passed**, exit 1 |
| MUT-2, DATA, the constraint finding's own sentence | the moved module | library suite **1 failed / 22 passed**, exit 1; the arm's spec **1 failed / 177 passed** — the arm's own pre-existing body dies, which is the proof the moved cases still pin the moved code |
| MUT-3, at the ENTRY: one of the six stops being re-exported | the browser entry barrel | library suite **11 failed / 12 passed**, exit 1 — the entry bodies are not smoke tests |
| MUT-5, purity: a node builtin in the module | the moved module | library suite **1 failed / 22 passed** — and it is the purity body that dies, at the site |
| MUT-5b, the same builtin in the ENTRY barrel | the browser entry barrel | **412 passed, exit 0**, types exit 0 — nothing reds; this is P3's residue and it is not this card's to close |
| MUT-4, DATA, the `./pure` key removed from the package's export map | the package manifest | the library's 23 bodies **still pass**, the arm still loads, and the app can no longer resolve the entry (`ERR_PACKAGE_PATH_NOT_EXPORTED`; the ground's M17 measured the app suite at 72 failed / 167 passed of 239 under exactly this at the base). So the export MAP is pinned by the app's suite, which predates this card, and by none of this card's bodies |

Kill-set containment rather than count: MUT-1 and MUT-2 land in the same
module and kill disjoint sets except for one shared body, MUT-3 kills a
set neither of them touches, and MUT-5's kill set is a single body neither
of the others reaches. No contained pair, and each died where its property
lives — the precedence site, the sentence itself, the export list and the
import list.

#### The security sweep — mandatory, and concrete to what this move changes

The move promotes script-internal code to a published browser entry, so
the threat model changes even though no byte of logic did.

- **Prototype pollution: NOT REACHABLE, and not by luck.** The schema
  parser refuses any switch field outside its own frozen whitelist, so
  `__proto__` as a field is a REFUSAL rather than an assignment; switch
  ids, profile ids and the profile columns all land in `Map`s, which carry
  no prototype chain; and the one plain object a parsed key reaches takes
  only strings, string lists and booleans, where an assignment to
  `__proto__` is a no-op. Driven: `__proto__`, `constructor` and
  `prototype` as a field, as a switch id, as a profile and as a template
  departure — all five behave identically to the base arm and
  `Object.prototype` is untouched after the run.
- **ReDoS: measured, not reasoned about.** The moved regexes are anchored
  with single quantifiers. A 60,000-character constraint fed through the
  needs regex parses, resolves and reports in 2 ms and 0 ms; a
  500,000-character top-level line refuses in 0 ms.
- **Unbounded input:** no size cap exists, and none existed before; the
  timings above are why this is a note and not a finding.
- **No dependency was added.** The module imports NOTHING — the package
  manifest is not in this diff at all — so there is no package to judge
  and nothing new reaches the app's bundle.
- **No export-map widening.** The map is untouched; `./pure` already
  existed at the base.
- **No secret, no key, no new endpoint, no authz surface.**
- **Unsafe defaults: none.** The reader's unbound default raises a loud
  `ProcessFinding` rather than answering an empty settings object, which
  is the half of attack A1.6 that would have put a quiet half-resolved
  answer on a settings screen.

#### The findings

**FINDING 1 — MERGE-BLOCKING. This tip reds CI's `checks` job, and the
repair is the one thing the fence was widened to allow.** The job installs
the e2e package and nothing else; since this diff the dispatch arm loads
the parser's BUILT browser entry at module scope, and `dist` is not
committed. Measured on this bench at this tip with the build moved aside
and restored afterwards:

- `npm run typecheck` from the e2e package — **exit 2**, `TS2307: Cannot
  find module '../../../lib/parser/dist/pure.js'` at the arm's spec, plus
  eight implicit-any errors downstream of the missing types.
- `npm run capabilities:check` — **exit 3**, `GATE COULD NOT RUN`, carrying
  the arm's own refusal naming the build order.
- `npm run lint:docs` — **exit 0**. This is where my reading DIFFERS from
  the lane's: the notes and the filed card both say the docs gate answers
  1, and it does not. The docs gate reaches no module of the arm.

So two of the three steps red, not three. The repair is the parser install
and build the parser job and the app job already spell, placed ahead of
this job's own steps. **The workflow file IS inside this card's fence** —
the fence was widened for exactly this at `0ba05044` on the integration
line and the card at this tip carries `.github/workflows/ci.yml` in its own
`touches` — so the lane's reason for not repairing it is wrong even though
its conclusion is right: the real obstruction is that this harness refuses
a write under the workflows directory from any subagent seat, which is
mine as much as the executor's. **I could not repair it either, and I say
so rather than assign a body I did not write.** See assigned correction 1.

**FINDING 2 — a new body's discriminator is satisfied by a doc comment.**
The arm's spec gained one body whose stated discriminator is that each
refusal SENTENCE lives in exactly one of the two files. Driven with a DATA
mutant that reworded the constraint refusal in the library's code: the
arm's own pre-existing body died and **the new body stayed green**, because
the heading above the function still carries the phrase as a substring. A
`toContain` over source TEXT cannot tell a raised sentence from a described
one. See assigned correction 2, its body committed on this bench with both
readings.

**FINDING 3 — two statements of record are false.** The card filed as
T-317-s1 says the lane's fence carries no workflow file; it does. And it
reports the docs gate at exit 1; it is 0. Both are in the finding text a
later seat will act on. See assigned correction 3.

**NOT FINDINGS, and each named so it is not mistaken for silence.** The
committed graph is stale at this tip by construction, which this project's
own standing hazard puts in the merge commit rather than in a lane. The
behaviour census is stale at this tip — committed 95835 bytes against a
fresh 96059, exit 1 — of which 100 bytes are this lane's one new body and
124 were already stale at the base; it is the merge's write and the lane
filed T-317-s3 for the part that is not. The arm's module-scope `await
import` of a sibling package's build output by relative path is the
decision I attacked hardest and it survives: it is the spelling the
dispatch-order script already uses, the refusal it raises names the repair,
and the alternative — a dependency in the e2e package's manifest — is
outside this fence and contradicted by that package's own charter. The
declaration of `RUNTIME_TEMPLATE` moved to the library with the reader
although it is the arm's constant; it is needed there because the section
reader's refusal quotes it, the arm re-exports it and the resolved value
compares equal by identity, so this is a note and not a defect.

**No in-fence follow-through was declared and none was found**: every path
in the diff is in the fence or under the always-writable card directory,
and nothing in it is a change no criterion asked for.

#### The assigned corrections

**Correction 1 — the CI `checks` job gains the parser install and build,
ahead of `lint:docs`, `typecheck` and `capabilities:check`.** BLOCKING:
do not push this merge without it. **No body is committed for this
correction and no mutant block is written for it, and here is why in as
many words**: this harness refuses a write under the workflows directory
from any subagent, so I cannot produce the GREEN reading step 5b requires;
and the spec that owns workflow parity is outside this card's fence, so
pinning the property in the arm's brief spec would repeat the defect
T-299-s1 already names. The correction is therefore assigned to the seat
that merges, with the measurement above as its evidence and T-317-s1 as its
card.

**Correction 2 — every refusal sentence is DRIVEN through the public
entry, not grepped for in the source.** Committed on this bench after this
verdict, in the arm's brief spec, inside the body the lane added. Read
**RED** against an implementation lacking the property — the constraint
refusal reworded in the library — at 2 failed / 176 passed, exit 1, failing
on `the library no longer RAISES: FORBIDDEN COMBINATION`; and **GREEN**
against the implementation carrying it at 178 passed, exit 0. Before the
correction the same mutant left that body green at 1 failed / 177 passed,
which is the whole of the finding in one pair of numbers.

**Correction 3 — the two false statements in T-317-s1's finding text.**
Committed on this bench after this verdict. A wording repair to a record:
**it pins no property and owes no mutant block**, and the block count below
is short of the correction count for that reason and for correction 1's.

```mutant
correction: the refusal-sentence discriminator is satisfied by a doc comment
file: lib/parser/src/process-settings.ts
spec: tools/e2e/tests/brief.spec.ts
body: THE ARM'S FIVE SYMBOLS ARE THE PARSER LIBRARY'S, and this file carries no second spelling of them
message: the library no longer RAISES: FORBIDDEN COMBINATION
--- old
          `FORBIDDEN COMBINATION: \`${id}\` is \`${mine}\` and that needs \`${other}\` to be ` +
--- new
          `FORBIDDEN COMBO: \`${id}\` is \`${mine}\` and that needs \`${other}\` to be ` +
```

Three corrections, one mutant block: correction 1 owes none because no
seat of my class can write the file its property lives in, and correction 3
owes none because it changes wording and pins nothing.

#### The gates at the tip I created

Re-run after this verdict and its corrections were committed, because
prose is a code input here and a figure measured at the commit I was sent
is stale at the tip I created. The whole battery again, at **d2c3a44f** —
the tip carrying the verdict, both committed corrections and the filed
card:

| suite | bodies | exit | verdict |
|---|---|---|---|
| parser | 412 | 0 | GREEN |
| app | 1171 | 0 | GREEN |
| rust | 655 | 0 | GREEN |
| e2e | 1042 | 0 | GREEN |

Correction 2 adds assertions and no test NAME, so the e2e count is the
same 1042 at my tip as at the lane's, and the census figure quoted above
is unmoved by my own writes: committed 95835 against a fresh 96059 at
d2c3a44f, exactly as at f65f7e25. The docs gate answers 0 over 0 findings
at my tip, and the card preflight answers 0 for T-317. The three cards
filed as `suggested` answer 3 from the preflight — all three of the
lane's do too, which is what that command answers about a card the
board's schedule does not draw, and not a property of anything written
here.
