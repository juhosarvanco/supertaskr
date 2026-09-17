---
id: T-332
title: "The docs-input-gate spec costs a CI shard half an hour when it is owed, because its bodies launch the real docs gate against the whole repository again and again: exercise the spellings and the exit combinations over small controlled fixtures, keep representative real-repository checks, and measure the repeated scans before choosing any caching"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against shard 4's log"
blocked_by: []
touches: [tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/tests/push-checks.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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

## Verdicts
