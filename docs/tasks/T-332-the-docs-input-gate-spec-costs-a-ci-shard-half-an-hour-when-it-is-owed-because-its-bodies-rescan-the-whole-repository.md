---
id: T-332
title: "The docs-input-gate spec costs a CI shard half an hour when it is owed, because its bodies launch the real docs gate against the whole repository again and again: exercise the spellings and the exit combinations over small controlled fixtures, keep representative real-repository checks, and measure the repeated scans before choosing any caching"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: done
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against shard 4's log"
blocked_by: []
touches: [tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/tests/push-checks.spec.ts, tools/e2e/tests/cli.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## The finding

On the CI run of 2026-09-15 for one amended card, the e2e shard that carried the docs-input-gate spec took 37 minutes while the other three took 3 to 6; 28.7 of those minutes were that spec's bodies. The slowest body, every spelling of one docs path answering the same, took 9.4 minutes on its own; the exit-code matrix, the empty-path-list exit, the unreadable-path line and the advisory scan took 2 to 3.5 minutes each. Each of them launches the real docs gate against the repository, several times per body, and the gate scans the whole tree every time. The spec was not even owed by that push: the correct selection for the range omits it, and it ran only because the planning job had fallen back to the whole battery. When it IS owed, the same cost is paid legitimately.

**THE COST IS PAID ON A CORRECTLY NARROWED PUSH TOO, which the run this card was filed from could not show.** That 2026-09-15 reading was taken where the planning job had fallen back to the whole battery, so this spec was not even owed. On 2026-09-16, run 35030867035 for commit `8f18d0c3` derived 24 of 42 spec files with an empty fallback reason and this spec was legitimately among them. The shard carrying it ran 31m59s while another shard finished in 3m13s, and the run ended when that shard did. **THAT FIGURE IS A SHARD DURATION AND NOT THIS SPEC'S OWN**: the shard also carried the card-preflight, landing-gate, push-checks, session-economics and workflow-parity specs, and no per-spec measurement was taken. Read it as the observed critical-path contribution that motivates the repair. The spec's own duration and its gate-launch count are what the second criterion requires measured, and no saving is claimed before they are — in particular this card does not promise half an hour back, and an earlier draft that said so is withdrawn.

## What would settle it

The spellings and the exit combinations exercised over small controlled fixture repositories, where a scan is milliseconds; a representative set of real-repository integration checks kept, chosen so that the gate's answer over this tree is still pinned; the repeated scans measured (how many launches per body, how long each) before any caching or memoisation is chosen, so the choice is made on figures. The card reports the spec's wall time before and after on one runner shard.

## Acceptance criteria

- WHEN a body exercises a spelling of a docs path or a combination of the gate's exit codes THE body SHALL run the gate over a small controlled fixture repository, and the real repository SHALL be scanned only by a representative set of integration bodies named as such.
- WHEN this card lands THE card SHALL record the number of gate launches per body and the spec's wall time on one runner shard before and after, and SHALL choose caching or memoisation only on those figures.
- WHEN a body is kept in the representative real-repository set THE card SHALL record what integration risk against the CURRENT repository that body covers and why the chosen representative set is sufficient, so the set is justified by its coverage rather than by its label.

## Implementation notes

### The criteria, echoed before a line was written

1. A body that exercises a SPELLING of a docs path, or a COMBINATION of
   the gate's exit codes, runs the gate over a small controlled fixture
   repository; the real repository is scanned only by a set of bodies
   named in the spec as the integration set.
2. This card records gate launches per body and the spec's wall time
   before and after, and chooses caching or memoisation on those figures
   alone.
3. Every body kept in the representative set records the integration
   risk against the CURRENT repository it covers, and the set as chosen
   is argued sufficient by its coverage rather than by its label.

### What the measurement found, and it is the whole argument

Measured at the lane's base `97c17541` on Mac.lan, with a `--require`
shim counting every child launch and the Playwright JSON reporter
attributing each launch to the body that was running.

- The spec ran 780s wall over 72 bodies, exit 0.
- It launched `docs-gate.mjs` 47 times. TWENTY-THREE of those reached the
  whole-tree derivation, at a mean of 31.5s, for 723.9s — 92.8% of the
  spec's wall time. The other 24 were refused at argument parsing before
  any scan and cost 1.41s in total.
- Per body, launches and the seconds inside them: EVERY SPELLING 22 /
  282.0s · the hand-run exit codes 5 / 91.2s · THE SCAN IS ADVISORY 4 /
  66.0s · a path the scan cannot read 2 / 64.0s · THE CENSUS 2 / 63.5s ·
  THE EXIT MATRIX 7 / 63.4s · THE EMPTY-LIST TRAP 4 / 63.2s · EVERY hit
  in one file 1 / 31.9s · THE PRINTED HITS 1 / 31.6s.
- Inside ONE launch, the scanned corpus was walked FOURTEEN times: five
  by `docsReaders`, three by `rootAnchoredFiles`'s own pass, two by
  `packageRelativeSites`, one each by `siteCensus` and `liveTaskCards`,
  and two cheap tracked-file listings inside import resolution. The count
  was taken by logging `git ls-files` invocations, one per walk. The
  corpus at that ref is 380 scanned source files and 11,354,965 bytes of
  1,691 tracked files.

So the cost had two independent causes: launches that did not need this
tree, and one launch asking the same derivation of the tree many times.

### What was built

`tools/e2e/scripts/docs-gate.mjs` takes `--root <checkout>` — the
spelling and the default sentence `push-checks.mjs` already publishes,
so this repository has one way to say which checkout a gate is judging
rather than two. The arguments are now walked rather than split on a
leading dash, because a flag with a VALUE puts a directory where a path
argument stands. A root that is not a directory is USAGE, as it is
there. Against the real root nothing moved: the diff form and the census
form both produce byte-identical output to the base, sha256
`3ce4303485aa82b975f3a594657255b0f38e2893ab6376b7bff9d36f01aea9ca` and
`ec3eccb3b52c2698663570d7e26bdcc67863b11e39877db03e33cfc685754375`,
taken by stashing the change and re-running.

A run under `--root` announces itself at the head of its output AND as
the last line a reader meets, and names the two checks it cannot answer
about another tree: the root-anchor ACCOUNT, whose ledger argues this
repository's files one by one, and the ADR-019 BUDGETS, whose table
names this repository's documents. Printing it twice is T-142-s1's own
measurement applied — that card's disclaimer was present, three lines
from the end, under two sentences that read as a clean bill of health.
Behaviour against the real root is unmoved in both skips, the `statSync`
throw included: a governed document that vanishes from this repository
is still exit 3.

`docs-scan.mjs` gained optional parameters on `rootAnchoredFiles`,
`unlinkedFiles`, `unaccountedRootAnchors` and `unlinkedSites` that take
the answer the function would otherwise compute. They are DATAFLOW and
not a cache: the defaults compute exactly what they computed before, so
every caller that passes nothing is unchanged, and nothing is remembered
between calls or has to be invalidated. `main` now asks for each
derivation once. Corpus walks per launch fell from 14 to 7, and a
real-repository launch from 31.5s to 14.0s — which every integrator hand
run and CI's own `lint:docs` step pays too, not only this spec.

`docs-input-gate.spec.ts` builds a miniature repository once per worker
— the four indexed documents, the status vocabulary read out of the
parser, `docs-scan.mjs`'s own planted readers, a card, and an index
GENERATED into it by the same `writeDocsIndex` the real one is generated
by — so every whole-tree check is clean in it by construction and an
exit of 0 or 1 there is decided by the diff verdict alone. Seven bodies
moved onto it. No docs-first literal was typed for the fixture's
readers: the plants come from `docs-scan.mjs`, the one file excluded
from its own scan.

### The caching decision, made on the figures and not otherwise

NO CACHE AND NO MEMO WAS ADOPTED. The repeated scans the card asked to
be measured turned out to be structural — four derivations recomputing
each other inside one process — so passing the value removes them
outright, with no key, no invalidation and no way for a gate to answer
from a tree nobody re-read. A cache on a gate is a claim about a tree
nobody looked at, which is the costume this gate's own exit legend
exists to strip off. The remaining SEVEN walks are four independent
derivations plus three cheap listings; collapsing those four into one
shared pass over the corpus would take a launch to roughly a quarter
again, and it changes four exported derivations at once, so it is filed
as a suggestion rather than taken here.

### The representative real-repository set, and why it is sufficient

Both entries live in the spec as `REAL_REPOSITORY_BODIES`, each carrying
the risk it covers, and a keeper derives the launcher's call sites from
the spec's own source and reds if the list and the sites disagree either
way. The launch primitive is asserted to be declared once and called
once per launcher, so nobody can reach around the launchers.

- `THE CENSUS SAYS WHICH QUESTION ITS EXIT ANSWERS, and says it LAST` —
  the whole-tree half over this tree, in the mode CI runs. It requires
  `--census` to exit 0 here, which is every whole-tree check finding
  nothing in this repository: the root-anchor account against the
  ledger, the live board's frontmatter, the ADR-019 budgets, STATE
  against the newest record, and INDEX against the four documents it
  indexes. Its positive control then asks the DIFF form about a card
  taken off this board and requires the verdict to name the suite and
  the body the T-142-s1 incident reddened. Neither half is decidable in
  a fixture.
- `THE GATE'S PRINTED HITS ARE THE SCAN'S OWN, over this repository's
  live docs/ corpus` — the injection scan against prose nobody wrote for
  a test. The subject set is whichever of this tree's own files under
  docs/ carry a hit today, and what is asserted is that the binary
  prints what the scan produced, hit for hit and nothing besides. A
  fixture can only carry hits somebody planted in it.

Sufficiency: everything else this spec pins is a property of the GATE —
the path vocabulary, the four exit codes, what each message names, that
the scan runs and cannot move an exit, that a pattern which throws is
absorbed. A property of the gate holds over any tree, which is why the
fixture is a faithful miniature rather than an empty directory: same
code, same checks, same vocabulary. What is left over is the pair of
questions that are genuinely about THIS tree — does the whole-tree half
come back clean on it, and does the diff half name the right suites for
its real contents — and between them the two bodies carry all five
whole-tree checks, both modes, and the live prose corpus. The move was
decided by what a fixture can DECIDE, never by what looked slow: the
bodies that stayed are two of the nine, and they are not the two
cheapest.

### The result, at this lane's tip

BOTH READINGS UNDER THEIR CONDITIONS, because a wall time with no
conditions is a number and not a measurement. Command
`npx playwright test tests/docs-input-gate.spec.ts` from tools/e2e/,
`SUPERTASKR_E2E_PORT=15332`, ONE worker (the config's own setting), node
v22.22.0, host Mac.lan. BEFORE at `97c17541`, the lane's base. AFTER at
`c6dcfcda`, this lane's tip.

- BEFORE: 72 bodies, exit 0, 780s wall, 768.9s of body time.
- AFTER: 74 bodies, exit 0, 81s wall by the shell's clock and 1.3m as
  Playwright rounds it, 69.4s of body time.
- 9.6x on the wall clock, 11.1x on body time, and 699s off one run.
- THE SUM AND THE CLOCK RECONCILE, which at one worker they must: 69.4s
  of bodies inside 81s of wall leaves 11.6s, and that is the dev server
  Playwright starts for every run of this file plus the module-scope
  derivations this spec runs at import. The gap is the same shape before
  (768.9s inside 780s, 11.1s) — it did not move, because nothing this
  card changed is in it.
- 52 launches now. FOUR carry no `--root`: the three integration ones, at
  12.6s, 12.4s and 12.2s, and one argument refusal at 0.1s that never
  reaches a scan and asserts as much about itself. The other 48 carry
  `--root` and cost 3.72s in all, 78ms each.
- Per body after: THE CENSUS 2 / 25.0s · THE PRINTED HITS 1 / 12.2s ·
  EVERY SPELLING 21 / 1.5s · THE EXIT MATRIX 7 / 0.48s · the hand-run
  exit codes 5 / 0.43s · THE SCAN IS ADVISORY 4 / 0.33s · THE EMPTY-LIST
  TRAP 4 / 0.32s · the --root announcement 5 / 0.33s · a path the scan
  cannot read 2 / 0.23s · EVERY hit in one file 1 / 0.12s.
- The four bodies that hold the rest of the time launch NOTHING: they are
  this spec's own in-process derivations over the real tree, 25.9s
  between them, down from 40.1s at the base by the follow-through below.

THE RUNNER READING IS NOT THIS ONE AND IS NOT TAKEN HERE. Both figures
above are Mac.lan, same machine, same method, so they are comparable
with each other and not with the 31m59s shard duration this card was
filed from. A lane cannot run CI, so the runner figure is owed at the
CI run this merge produces, and the integrator can read it as this
spec's own duration inside the shard that carries it.

### In-fence follow-through

- The spec's own repeated whole-corpus derivations, six call sites, all
  inside the fence and all the same repetition the card measured inside
  the gate: `READERS` is already a module constant and is now handed on
  to `rootAnchoredFiles`, `unlinkedFiles` and `unaccountedRootAnchors`,
  and one body's `packageRelativeSites` result is handed to
  `unlinkedSites` instead of being recomputed. Eight lines moved. No
  property changes: the values passed are what the defaults computed.

### For the verifier

- The one behaviour genuinely added is `--root`, and its hazard is the
  obvious one: a gate that can be pointed elsewhere can be made to
  answer about a tree nobody asked about. The defences are that the
  default is this repository, that neither CI's step nor the alias
  passes a flag, that a foreign run says so twice and names what it did
  not answer, and that the announcement's control is a default run which
  must carry neither line. That control is the weakest link — attack it.
- Also attack whether the fixture is a faithful miniature. If any
  whole-tree check can be made to find something in it, the exit-code
  bodies stop meaning what they say.
- And attack the keeper over `REAL_REPOSITORY_BODIES`: it reads this
  spec's own source, so a call spelled another way is its failure mode.
  The launch-primitive count is the half that closes that.

### The fence, widened three paths across four asks, and the record the merge nearly lost

Re-added by the integrator at the merge. The merge verb resolves a
conflict in a card's own file to the LANE's side, and the lane's copy
carried no account of its fence at all, so this record survives only
because it was carried across by hand. It is here rather than under a
heading of its own because an amendment under its own heading is
invisible to the readers that take criteria from the canonical section.

The fence opened at three paths — `docs-input-gate.spec.ts`,
`docs-gate.mjs`, `docs-scan.mjs` — and closed at six. Every widening was
caused by this card's own repair, and every one was verified against the
tree before the seat granted it.

`tools/e2e/scripts/cli.mjs` — the repair gives `docs-gate.mjs` a `--root`
flag, and the registry's own declaration of that verb is the thing that
has to move with it, or the registry's claim about the verb would be
knowingly false.

`tools/e2e/tests/push-checks.spec.ts` — the same flag, read from the
other side by the bodies that drive the gate through the push checks.

`tools/e2e/tests/cli.spec.ts` — the fourth ask, and the most interesting.
That file's installed-copy body drove `docs-gate` BY NAME as its example
of a verb whose script resolves its own root, and this card's flag moved
that verb OUT of the class: the CLI stops refusing it on the root ground
and gets one step further, to a dependency an installed copy has not got.
Exit 3 and the project's path are unchanged; only the sentence moved. The
hard-coded verb was the defect, not the expectation, so the example is now
DERIVED from the registry — the first entry with `rootFlag: false` and a
`target` of kind `script`, of which seven remain — with a floor asserting
that set is non-empty, because an empty class would agree with everything.

**THE PATH WAS REFUSED FOR AN HOUR AND NOT ON ITS MERITS.** T-344's live
lane held `tools/e2e/tests/cli.spec.ts`, and two live lanes may not hold
one path. The executor wrote its repair out as TEXT, touched nothing, and
parked; the grant followed once T-344 merged.

**TWICE THE GRANT ARRIVED HALF-PERFORMED AND THE LANE REFUSED TO WRITE.**
The fence manifest is stamped from main's committed card, and the lane's
own copy of the card is at its branch, so after each widening the pair the
write-time guard compares disagreed character for character. Both times
the executor declined to write rather than test the guard by writing. The
second time it declined against an explicit instruction from the seat to
absorb the line itself — and it was right: **a lane that can move its own
`touches:` line can grant itself any fence**, because the guard would then
be comparing two values the lane controls. The absorb is the seat's write,
and the seat made it.

## Verdicts

### 2026-09-17 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Verifier, phase 2, a fresh spawn on the detached bench
`../supertaskr-V-T-332` at the lane tip `6563743b`, grading the diff
`97c17541..6563743b`. Bench port 25332. A second clean worktree
`../supertaskr-B-T-332` was stood up detached at the base `97c17541`
with `git status --porcelain` empty, because phase one's M1, M2, M3, M4,
M7 and M8 are worthless once the diff exists and the dispatcher recorded
them as outstanding. I took them there rather than grading a row
ungradable.

PHASE ONE'S PRE-COMMITMENT, CITED AS REQUIRED, AND RE-HASHED BEFORE I
RELIED ON IT: the attack set `attack-set-T-332.md`, sha256
`17b267c906aa00f62101fb008ca7955b6a560800ec38f4ddf1bc79eae1570c0f` —
fifteen attacks on criterion 1, twelve on criterion 2, six on criterion
3, three cross-criterion, and ten measurement requests. The grounds
taken at the base before the diff existed, `ground-T-332.md`, sha256
`ac6ff452bfca8d2fbedb411254e63fc903aa9468a726f0d262ac87f9e0130886`.
Both matched the values my brief pre-committed.

CONDITIONS FOR EVERY FIGURE BELOW, because a wall time with no
conditions is a number and not a measurement: host Mac.lan, node
v22.22.0, ten cores, ONE worker (the config's own setting), the list
reporter, `npx playwright test tests/docs-input-gate.spec.ts` from
tools/e2e/. The base reading ran at port 26332 in the base worktree and
the tip reading at 25332 on the bench, back to back in one detached job
so the two share their machine and their moment.

#### Criterion 1 — the spellings and the exit combinations over a fixture, the real tree only by a named integration set

**PASS.** Attacked with all fifteen of phase one's shapes; the four that
could have carried it are answered by measurement rather than by the
card's prose.

*A1.6 — "the fixture is a copy of the real tree."* I rebuilt the
fixture outside the spec, from the same `docs-scan.mjs` exports
`gateFixture` uses, and measured it: **14 files, 3,435 bytes**, against
the grounds' 1,691 tracked files and 11.35 MB. It is written file by
file from constants — no `cp -r`, no clone, no symlink into the live
docs/ — so its size is not a function of the repository.

*A1.7 — "fixtures live inside the tree the real gate scans."* Does not
arise. The fixture is made under `tmpdir()` and removed in `afterAll`,
so the project's own gate never meets it. `realpathSync` wraps
`mkdtempSync`, which is the deliberate canonicalisation the grounds' M6
said every fixture root in this lane owed.

*A1.1 and A1.9 — "the fixture is degenerate, so every body takes one
early exit," and "the scan is stubbed."* Refuted by drill, not by
reading. Over my replica the gate answers 1 for the planted card, 0 for
a code path, 2 for no paths and for a refused range, 0 for `--census`,
and 2 for a plain-relative path typed from `tools/e2e` — six distinct
outcomes, so the derivation really runs there. Then the mechanism was
removed: neutering the PLAIN-RELATIVE branch in `normalisePaths` reds
`EVERY SPELLING…` (1 failed / 73 passed, exit 1), and the file is
restored byte-identical. And the data mutant phase one asked for: a
stale index planted in the fixture, and an illegal `status:` planted in
its card, each move the code-only row from 0 to 1 — so the fixture's
whole-tree checks are LIVE in it, "clean by construction" is a property
rather than a vacuity, and the exit-0 row is the standing control that
would catch any whole-tree finding. The card asked me to attack exactly
this; it holds.

*A1.2 — "assertions narrowed to the exit integer."* The opposite
happened: 17 `expect(` lines removed against 43 added, net +26, and the
message assertions moved with their bodies. A right-code-wrong-reason
mutant — "PLAIN RELATIVE" reworded to "AMBIGUOUS", exit untouched — reds
`EVERY SPELLING…` (1 failed / 73 passed).

*A1.8 — "the gate is no longer a process."* It is. `launch` runs
`process.execPath` on the real script. Mutating ONLY the CLI boundary,
`process.exit(code)` remapped so USAGE arrives as CLEAN, reds **six**
bodies — the hand-run exit codes, the `--root` announcement, EVERY
SPELLING, THE EXIT MATRIX, THE EMPTY-LIST TRAP and THE SCAN IS ADVISORY.
Every fixture exit-code body goes through a real process boundary.

*A1.3 — "speed from bodies that no longer run."* 72 bodies at the base,
74 at the tip, and the tip spec carries no `test.skip`, `test.only`,
`test.fixme`, `describe.skip`, `.slow(` or `test.fail` anywhere.

*A1.13 and A1.15 — "named as such is prose," and "the set is empty."*
The boundary is mechanical. The keeper derives the launcher's call sites
from the spec's own source and compares them with
`REAL_REPOSITORY_BODIES` both ways, floors the list non-empty, and
counts the launch primitive so nobody can reach around the launchers. I
drilled the reach-around — a direct `launch([...], repoRoot)` planted
inside an unlisted body — and the keeper reds (1 failed / 73 passed).
That is the half the card flagged as load-bearing, and it is the half
that works.

*A1.10 — "root injection becomes a production bypass."* The sharpest
attack available, and the gate fails closed. `--root` at an empty
directory is exit 3; `--root` at an empty git repository carrying a
docs/ file is exit 3 (it cannot read the status vocabulary). There is no
arrangement I found in which a foreign root buys a quiet 0. The banner
prints on both. `npm run lint:docs` passes no flag, and CI's step passes
no flag.

#### Criterion 2 — launches per body and the spec's wall time, before and after, and the caching choice made on those figures

**PASS,** and the figures are the card's own to within noise. I did not
take the lane's word for any of them: an external shim, installed from
OUTSIDE the spec through `NODE_OPTIONS`, logged every node process's
argv and patched `execFileSync` to record every `git ls-files`. Phase
one's A2.4 demanded the shim be verified before it is trusted, so it was
run standalone first and recorded a non-zero count.

*A2.1 and A2.11 — "before and after are not the same quantity," taken
"on a dirty tree."* The before-reading is the spec's own wall time at
`97c17541` on a clean checkout, which is the reading the card admits it
could not take from CI.

- **BASE `97c17541`: 760.72s wall, 72 bodies, 0 failed, exit 0**, 752.2s
  of body time.
- **TIP `6563743b`: 81.35s wall, 74 bodies, 0 failed, exit 0**, 71.3s of
  body time.
- **9.35x on the wall clock.** The card claims 780s to 81s and 9.6x.

*A2.9 — "n = 1."* Two further tip repetitions under the same conditions:
78.16s and 85.29s, so **min 78.16 / median 81.35 / max 85.29**. The base
is n = 1 at 760.72s; the delta is an order of magnitude outside that
band either way.

*A2.3 — "wall time that excludes the expensive part."* It does not. At
one worker the sum and the clock reconcile: 752.2s of bodies inside
760.72s leaves 8.5s before, 71.3s inside 81.35s leaves 10.05s after. The
gap did not move, which is the card's own claim and is what rules out a
rewrite that relocated the cost into setup.

*A2.5 — "launches are the wrong quantity."* Three numbers, not one:

- BASE: **46 launches**, of which **23 walked the corpus 14 times each**
  and 19 were refused before any walk; **352 corpus walks** in the run.
- TIP: **51 launches**, of which **47 carry `--root` and 4 do not**, and
  only **3 walked the corpus — 7 times each**; **149 corpus walks** in
  the run.

So launches rose and WORK fell: tree-reaching launches **23 to 3**, and
walks per real-root launch **14 to 7**. Both are the card's exact
figures, arrived at independently. A real-root launch measured three
times each way: base 28.13 / 28.35 / 28.94s, tip 12.25 / 12.37 / 12.16s;
the census form 30.66s against 13.08s. A fixture launch is 0.12s.

*A2.6, A2.7 and A2.8 — "the cache's address is unstated," "a production
cache that can serve a stale verdict," "the decision is a sentence."*
There is no cache to address. The diff adds no module-level mutable
state; the two memos in `docs-scan.mjs` are present at the base and are
not this lane's; the four new parameters default to computing exactly
what they replaced, and `rootAnchoredFiles` does not mutate the reader
objects it is handed, so a value passed on and a value recomputed cannot
diverge. The strongest evidence is behavioural, and it was taken against
a CLEAN base checkout rather than a stash: **the real-root answer is
byte-identical at both refs in both modes** — the diff form's stdout
sha256 `40ab0284…` across three repetitions each way, its stderr
`35543a1f…`, the census form's stdout `5850ef51…`. Phase one's A2.7
drill has no target: there is no key, nothing to invalidate, and no
artefact that could survive into a restored cache directory.

*X.1 and A2.10 — "the after figure is small because coverage left."*
Read against criterion 1's inventory, it is not: bodies up, assertions
up, no skips, and the removal is proved live by five mutants.

#### Criterion 3 — what risk each kept body covers, and why the set is sufficient

**PASS, with a named decay.**

*A3.4 — "a kept body that does not actually reach the real tree."*
Refuted by the shim. Exactly **3** launches carry no `--root` and reach
the derivation, at 7 walks each, and they sit in the two named bodies:
`THE CENSUS…` at 25.09s for its two launches and `THE GATE'S PRINTED
HITS…` at 13.02s for its one. Their duration is two orders of magnitude
away from a fixture body's, which is the tell phase one asked for, in
the right direction.

*A3.1 and A3.5 — "the risk restates the body," "label laundering."*
Neither. Both risks name a property of THIS tree that a fixture cannot
carry — the whole-tree half coming back clean in the mode CI runs, and
the injection scan over prose nobody wrote for a test. And the set is
two of nine, with real-root launches down from 23 to 3, so the labels
did not do the work.

*The half that proves the kept body earns its cost:* I made the new
dataflow hand-off WRONG — `rootAnchoredFiles(root, [])` in place of the
readers — and `THE CENSUS…` reds (1 failed / 73 passed). A "structural"
removal that changed an answer would be caught by the integration set,
which is what makes that set load-bearing rather than decorative.

*A3.2, A3.3 and A3.6 — the decay, recorded because it is real.* The
sufficiency argument is by exclusion and it is a good one, but it names
**no deliberately-uncovered risk**, and phase one's A3.6 is right that a
real enumeration always has a tail. The specific omission the grounds
predicted is SCALE: at 1,152 files under docs/ against a 14-file
fixture, nothing here would notice a derivation going quadratic — both
kept bodies meet the tree at real size, so the substance is covered, but
neither asserts anything about cost, so a regression of exactly the kind
this card was filed about would return silently. And the justification
is inert prose: the keeper pins the LIST and the presence of a risk
paragraph, never the risks' currency. This does not fail the criterion,
which asks for the risk and the sufficiency argument and gets both. It
is the card's known decay and it is said plainly here rather than left
for the next reader.

#### The four reds the brief expected, checked rather than accepted

**push-guard.spec.ts — NOT REPRODUCED, and the attribution is right.**
Run whole on this bench: **123 passed, 0 failed, exit 0**. The cause is
the mode the fence imposes, and I measured it rather than inferring it:
`docs/CONVENTIONS.md` is mode 444 in the lane worktree
`../supertaskr-T-332` and mode 644 both here and on main, so
`copyFileSync` carries a read-only source only inside a fenced lane. The
three reds are T-333's and they do not travel to the merge.

**cli.spec.ts — THE RED IS REAL AND THE BRIEF'S MECHANISM IS WRONG.**
The brief says it is lane-local because the lane predates T-344 and so
runs the pre-T-344 body against the pre-T-344 TRACKED template. If that
were the mechanism the BASE would red too, and it does not: at
`97c17541` this spec is **65 passed, 0 failed, exit 0**. At the tip it is
**1 failed, 64 passed**, and the finding is `T-332 has moved beyond the
admission's mechanical drift: frontmatter 'touches': changed`. The
actual cause is THIS LANE'S OWN FOUR FENCE WIDENINGS: the card's
`touches` went from three paths to six, and the grant block still living
inside the pre-T-344 tracked template pins the base's three-path card.
On main that block is gone — T-344, `be9726f1` — and the operational
store is at revision 5, pinning T-332 at blob
`f34c59a656938936ab227dabedf063ac836c48e1`, which is exactly main's
current card blob and carries the six-path `touches`. So the red does
not survive the merge; but it is not "not this diff's", and it must be
re-run rather than assumed.

#### One correction, and it is the one place the house rule was broken

**CORRECTION 1 — THE VERB THAT LEFT THE REFUSAL CLASS IS PINNED BY A
COMMENT.** The registry entry for `docs-gate` flips `rootFlag: false` to
`true`, which is a shipped behaviour change the card's "What was built"
never mentions and its "For the verifier" contradicts by calling `--root`
"the one behaviour genuinely added". Before this diff, `rootMismatch`
REFUSED `docs-gate` from an installed copy; now it returns null and the
CLI hands the script the USER'S project. What keeps that safe is a
second refusal — `requirementsFor` will not run a script whose bare
imports have no `node_modules` beside them — and the lane's own comment
in `cli.spec.ts` asserts precisely this ("still exit 3, still naming the
project"). I verified the claim is TRUE: packed, installed into a
scratch project and run, `npx supertaskr docs-gate docs/x.md` is exit 3,
"CANNOT RUN", "Nothing was run." But the body that used to pin
`docs-gate`'s refusal was rewritten to drive a DIFFERENT verb, so the
claim is now carried by prose alone — a grep for a sentence answering a
different question than "does this behaviour exist". The fix asserts it,
derived off the registry so a second verb joining the class inherits the
pin. Readings: with the fix, `cli.spec.ts` whole is **1 failed, 64
passed** — the one red being the grant drift above and nothing else —
and the corrected body alone is **1 passed**, exit 0; `tsc --noEmit`
exit 0. With the mutant planted the body reds, `1 failed`, exit 1,
`Error: docs-gate from an installed copy is exit 3, never an answer /
Expected: 3 / Received: 1` — and it names `docs-gate` itself, because
every other verb in the class is still refused by the package-escapes
arm. Both anchors were counted before the mutant was planted: the old
matched exactly once and the new matched none, and `cli.mjs` was
restored to sha256
`b33e70d248964968e276fb934206be89ddfdbf911ddfa0ce162a7d9499152301`,
byte-identical.

```mutant
correction: the verb that left the refusal class is pinned by something that reads
file: tools/e2e/scripts/cli.mjs
spec: tools/e2e/tests/cli.spec.ts
body: npx supertaskr runs out of a packed tarball installed into a project that is not this repository
message: docs-gate from an installed copy is exit 3, never an answer
--- old
    if (bare.length > 0 && !existsSync(path.join(pkgRoot, "node_modules"))) {
--- new
    if (false && bare.length > 0 && !existsSync(path.join(pkgRoot, "node_modules"))) {
```

#### Findings that changed no row

- **The closing line is not printed on the exit-3 path.** The card says a
  `--root` run announces itself at the head AND as the last line a reader
  meets. When the derivation throws, `main` never returns and
  `foreignRootClosing` never runs — I saw this on both bypass attacks.
  The reader still ends on a disclaimer ("This run is not a claim about
  the tree"), so nothing is misread, and the body that pins "first and
  last" drives a run that completes. Nothing reds if a later edit makes
  that path end reassuringly.
- **The generated census is stale at the lane tip.** `npm run
  capabilities:check` from tools/e2e is exit 1: "capabilities: STALE —
  committed 117410 bytes, a fresh generation is 117582 bytes".
  `docs/CAPABILITIES.md` is outside this card's fence, so the lane could
  not have committed it. It is the integrator's regeneration.
- **The owed-derivation for this spec did not move (phase one's X.3).**
  With a synthetic docs-only commit on top of each ref,
  `gate-run.mjs --owed-set` selects the SAME four spec files at the base
  and at the tip, and `docs-input-gate.spec.ts` is in neither. The lane
  did not touch selection or scoping to make this spec less often owed.
  Both worktrees were reset back to their refs, clean.
- **The fixture's size is fixed by construction, not asserted.** Phase
  one's A1.6 wanted a bound in a body. There is none; the fixture is
  written from `INDEXED_DOCS` and `PLANTED_READERS`, so it grows only
  when those lists do. Bounded, but not pinned.

#### What I re-ran, because appending a verdict is a write

My two commits change the card and `tools/e2e/tests/cli.spec.ts`, so
`gate-run.mjs --owed-set` over their range derives three suites and
twelve e2e spec files. All three legs were run on this bench.

- **e2e**, the twelve owed specs at port 25332: **1 failed, 736 passed**,
  exit 1, 7.2m. The one red is the grant-drift body described above —
  `cli.spec.ts` "THE REAL CONFIGURATION IS CHECKED THROUGH THE PARSER'S
  READER" — which reds on this bench because the tree predates T-344 and
  the card's fence has since widened. It is green at the base, it is the
  same red the lane reported, and it is not mine. `push-guard.spec.ts`
  was inside this leg and passed.
- **app**, `npm test` from app/: **51 files, 1171 tests passed**, exit 0.
- **parser**, `npm test` from lib/parser/: **17 files, 454 tests
  passed**, exit 0.

#### What the integrator owes at the merge

1. **Regenerate the behaviour census.** `npm run capabilities:check`
   from tools/e2e is exit 1 at the lane tip — committed 117,410 bytes
   against a fresh 117,582. `docs/CAPABILITIES.md` is outside this card's
   fence, so this is the merge's write, and it is the last write before
   the merge commit.
2. **Re-run `cli.spec.ts` at the merged tree, and do not assume.** The
   grant-drift red is expected to clear because main carries no grant
   block in the shipped template and its operational store is at
   revision 5, pinned to the six-path card. Confirm it, since the merge
   also stamps `status: done` and appends this verdict, and the drift
   rule is what decides whether those count as mechanical.
3. **Take the runner figure the card defers.** Both of the card's wall
   times and both of mine are one machine; the shard reading is owed at
   the CI run this merge produces, read as this spec's own duration
   inside the shard that carries it.
4. **Apply correction 1** to `tools/e2e/tests/cli.spec.ts` — it is
   committed on this bench directly after this verdict. **IT COSTS
   SOMETHING AND THIS CARD IS ABOUT COST, so the figure is here rather
   than discovered later:** `cli.spec.ts` whole goes from 11.2s to 17.7s,
   because the installed-copy body now drives thirteen more `npx
   supertaskr` calls — one per verb in the `--root` class, derived rather
   than typed. The alternative was to name `docs-gate` alone, which is
   the staleness the lane's own rewrite of that body was removing. 6.5s
   against a spec whose own repair returned 699s is the right side of
   that trade, but it is a trade and it is recorded.
