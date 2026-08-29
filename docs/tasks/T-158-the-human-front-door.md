---
id: T-158
title: The human front door — the root carries two agent adapters and no door for the people the bar says must be impressed
feature: F-01
milestone: 4
priority: 44
size: S
status: building
blocked_by: []
touches: [README.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

NORTH_STAR's bar (2026-08-29) names the audience — the world's best
veteran developers and masters of the field — and today that reader
clones the repository cold and meets CLAUDE.md and AGENTS.md: two
adapters written for agents. There is no README. The empty-chair
first ten minutes decide the first impression, and the record —
the project's strongest asset — is invisible without a guide.

## What it is

A root `README.md` written for humans, doing three jobs:

1. **What this is**, in the project's own one-paragraph vision, and
   what makes it different in one sentence: the repository is its own
   proof.
2. **The record tour** — five links with one line each: a card with
   an adversarial verdict on it, a checkpoint record, the room that
   ratified the governing-docs charter, the generated capabilities
   census, and the decision index. The tour IS the pitch.
3. **The terminology bridge** (from the external review's fair hit):
   house terms mapped to the literature on first use — the poison
   drill is mutation testing run as a hand discipline; a fence is
   computed write-set disjointness; seats are roles with adversarial
   separation. Coin only where nothing standard exists.

Constraints: no marketing voice (the applause-metrics exclusion
binds prose too); every claim in it either links to its record or
carries its derive command; the file is a signpost by design and says
so — the adapters stay the agents' door, untouched.

## Acceptance criteria

- WHEN a stranger reads only README.md THE five tour links SHALL
  each land on a real record that substantiates the claim beside it.
- IF the README states a figure THEN it SHALL carry a ref stamp or a
  derive command (ADR-019 Law 2 applies to the front door most of
  all).

## Implementation notes
<!-- executor appends before finishing -->

### Executor — claude-opus-5 @T-158-exec, lane `task/T-158-human-front-door`, base `3607a94`

**Understanding, confirmed before the first edit.** I am building one
file, `README.md` at the repository root, and nothing else: a door for
a human reader rather than an agent session, doing the three jobs this
card names — the project's own one-paragraph vision taken verbatim in
substance from docs/NORTH_STAR.md plus the one-sentence differentiator
that the repository is its own proof; a record tour of five links, each
a real repo-relative path, each carrying one line that the linked
record actually substantiates; and a terminology bridge mapping the
house vocabulary to the standard names, with the poison drill given as
mutation testing run as a hand discipline, the fence as computed
write-set disjointness and a seat as a role with adversarial
separation. The constraints that shape the prose are not stylistic
preferences: NORTH_STAR's applause-metrics exclusion forbids marketing
voice, ADR-019's Law 2 forbids a transcribed figure without a keeper,
and Law 1 forbids a second copy of a fact whose home is elsewhere — so
the build commands are pointed at rather than repeated, and the page
states no measurement of its own. The file says of itself that it is a
signpost and that the record outranks it; `CLAUDE.md` and `AGENTS.md`
stay byte-untouched, and the README names them as the agents' door
rather than duplicating them. My fence is `[README.md]` plus this card,
which is outside every fence by lane-protocol rule 5; I do not merge,
push, or touch main.

### The link-verification ledger

Every markdown link target in README.md, extracted mechanically rather
than by eye and checked for existence in the lane worktree. Re-run it
at your own ref from the repository root:

    perl -0777 -ne 'while (/\]\(([^)]+)\)/g) { print "$1\n" }' README.md \
      | sort -u | while read -r p; do [ -e "$p" ] && echo "OK   $p" \
      || echo "MISS $p"; done

Its output at `3607a94` plus this lane's working tree — every target
resolves, nothing missing:

    OK    docs/ARCHITECTURE.md
    OK    docs/CAPABILITIES.md
    OK    docs/CONVENTIONS.md
    OK    docs/NORTH_STAR.md
    OK    docs/ROADMAP.md
    OK    docs/STATE.md
    OK    docs/checkpoints/2026-08-27-T-092.md
    OK    docs/decisions/                        (directory)
    OK    docs/rooms/governing-docs.md
    OK    docs/tasks/T-083-the-range-rule-is-backwards-before-the-merge.md
    OK    method/                                (directory)
    OK    method/README.md

The tour's five, with what each was checked to substantiate — a link
that resolves is not yet a link that supports the sentence beside it,
which is what acceptance criterion 1 asks:

| tour link | the claim beside it | how it was checked |
|---|---|---|
| `docs/tasks/T-083-the-range-rule-is-backwards-before-the-merge.md` | a done card carrying the verdict that rejected it, plus the re-derivation, a second session's fix and the approval | frontmatter reads `status: done`; the `## Verdicts` section opens with a dated `REJECTED` entry and closes with a dated `APPROVED` re-verification; the body carries a `SECOND EXECUTOR … closing the rejection` section and an `## Acceptance criteria` section above them all |
| `docs/checkpoints/2026-08-27-T-092.md` | one integration written once: merge range, gates fired or not-owed, suites with exit codes, budget spend | the file's own `## Merge`, `## Gates`, `## Suites` sections carry exactly those, including a gate recorded as fired and a document budget with its remaining headroom |
| `docs/rooms/governing-docs.md` | the room argued, amended by a review, ruled, and the charter behind ADR-019 | the room's opening paragraph records the amendment and the ruling and says it was ratified as ADR-019; ADR-019's own Provenance line names this room |
| `docs/CAPABILITIES.md` | generated from the e2e test names; a sentence is false the moment its test reds; unexpandable behaviours are named rather than dropped | the file's generated-header comment names the generator and the currency check; the closing section is titled `Not extracted — named rather than dropped` |
| `docs/decisions/` | dated records naming status and where each was decided; ADR-018 absent on purpose with the reservation written down | every file's first content line is a `Date: … · Status: … · Decided in: …` row (ADR-019 and ADR-020 spell the last field `Decider:`); ADR-019 records the reservation and both STATE and ROADMAP name T-135 Half B as owing it |

The README's decisions line was rewritten once during the build for
exactly this reason: the draft said each record "names its decider",
and only two of the files use that word. It now says *status and where
it was decided*, which is what the files carry.

### Figures, and why there are none in the deliverable

Acceptance criterion 2 is discharged by subtraction. Every digit in
README.md is an IDENTIFIER, not a figure: `Milestone 3`, `T-083`,
`ADR-018`, `ADR-019`, and the date inside the checkpoint record's
filename. Nothing on the page is a count, a size, a hash or a range,
so nothing on it needs a keeper. Derive the sweep:

    grep -n "[0-9]" README.md

The figures in THESE NOTES are stated with the command that produced
them and were read at the lane tip; the transcripts below are the
commands' own output rather than retyped numbers.

### Commands run, each exit code read from `$?` unpiped

From `tools/e2e/` in the lane worktree, with NO `npm ci` — the token
lint is zero-dependency and `npm run` only extends PATH, which
CONVENTIONS' CI bullet states as the reason it can run against a bare
checkout:

    npm run lint:tokens -- --selftest        exit 0
      lint-tokens selftest: 65 TOKEN samples + 4 CONTROL samples green,
      87 walk-policy checks green, 9 evidence-floor checks green

    npm run lint:tokens                      exit 0
      lint-tokens: clean (TOKEN 144 files under app/src, app/test,
      tools/e2e; CONTROL 846 tracked text files)

`README.md` was `git add`ed BEFORE the lint ran, because CONTROL
derives its corpus from `git ls-files` and an untracked file is
invisible to it — a clean run over a file the gate never opened would
have been the silence this gate exists to remove. That the file is
actually in the corpus was asserted rather than assumed, from the
repository root:

    node -e 'import("./tools/e2e/scripts/token-scan.mjs").then(m=>{
      const c=m.corpus(m.CORPORA.CONTROL);
      console.log("README.md in CONTROL:", c.includes("README.md"));
      console.log("README.md in TOKEN:", m.corpus(m.CORPORA.TOKEN).includes("README.md"));})'
    README.md in CONTROL: true
    README.md in TOKEN: false

CONTROL true and TOKEN false is the right pair: TOKEN walks `.ts/.tsx/
.mjs` under three roots and a root markdown file is outside it, while
CONTROL walks every tracked first-party text file. An independent raw
byte sweep agrees with the gate — zero C0 bytes and DEL, and the only
non-ASCII codepoint in the file is U+2014 EM DASH, the character every
governing document here already uses:

    perl -0777 -ne '$n=0; while (/([\x00-\x08\x0b\x0c\x0e-\x1f\x7f])/g)
      { $n++ } print "control bytes: $n\n"' README.md
    control bytes: 0

### The plant hazard, checked rather than assumed

`README.md` is NOT one of `token-scan.spec.ts`'s planted first-party
roots. The list is owned by that spec's *"one runtime-built control
byte reds all seven first-party roots at exact byte offsets"* and is
deliberately not copied here; read it there. It carries `AGENTS.md`
and `method/README.md`, which is close enough to the root README to be
worth checking on purpose — the ordering hazard on `T-138-s1`'s card
(the e2e suite must run only AFTER the commit that adds a plant
target) therefore does NOT apply to this lane.

### Standing gates, derived from the diff rather than assumed

The lane's own diff, by the RANGE RULE's executor row — build the
merge's tree and diff main against it, never `main..HEAD`:

    TREE=$(git merge-tree --write-tree 3607a94 HEAD)   # read $? FIRST
    git diff --name-only 3607a94 "$TREE"

Two paths: `README.md` and this card.

- **GRAPH REGEN — NOT OWED.** The trigger is `*.ts/*.tsx/*.js/*.jsx`
  or `*.rs` outside `docs/`; 0 of 2 match. Checked at source rather
  than from the suffix list alone, because CONVENTIONS' own standing
  lesson there is that the list is a signpost: `Lang::for_extension`
  in `app/src-tauri/crates/nputer-index/src/graph.rs` returns `None`
  for `md`, and the crate's own test enumerates `"md"` among the
  extensions that must not match. A markdown file cannot move the
  graph.
- **BOOT GATE — NOT OWED.** The trigger is `app/src-tauri/**`,
  `app/src/**` or either manifest; 0 of 2.
- **DOCS GATE — FIRES, on this card and not on the README.** A path
  under `docs/` that a code suite reads is in the diff: flat
  `docs/tasks/T-*.md` is exactly what the parser's live docs walk
  collects. The README is not under `docs/` and no program in this
  repository reads it (`git grep README` over `app/`, `lib/`,
  `tools/`, `.github/` returns only fixtures, a `method/README.md`
  plant target and design-doc citations). CONVENTIONS assigns the
  DIFF half of this gate to the integrator — *"THE DIFF HALF IS STILL
  A RITUAL: nothing but the integrator running the two lines above
  makes a merge answer for the suites it owes"* — unlike BOOT GATE,
  which assigns the executor in as many words. It is named here so the
  merge answers for it. The result of running it in this lane is in
  the next section.

### What was not triggered, and why

Nothing in this lane touches shipped code, a
manifest, a lockfile, a spec body or a test assertion, so the POISON
DRILL is not triggered: there is no new or changed assertion to
mutate. That is stated as a derivation, not as an excuse — the trigger
is *"any task that ADDS OR CHANGES a test body"*, and this diff adds
one markdown file and one card's notes.

### The run ledger — every suite the gate named, run, with its exit code

The DOCS GATE fires, so the three suites it names were installed and
run IN THIS WORKTREE (never in the integration checkout —
lane-protocol rule 4). All at lane commit `2dadf27`; the only change
after it is this ledger, which is card prose and moves no frontmatter
field.

    lib/parser/   npm ci                              exit 0
    lib/parser/   npm run build                       exit 0
    lib/parser/   npx vitest run                      exit 0   314/314, 15 files
    lib/parser/   npx tsc --noEmit                    exit 0
    app/          npm install                         exit 0
    app/          npm run build                       exit 0
    app/          npm test                            exit 0   1013/1013, 47 files
    tools/e2e/    npm ci                              exit 0
    tools/e2e/    NPUTER_E2E_PORT=14733 npm test      exit 0   233/233
    tools/e2e/    npm run typecheck                   exit 0
    tools/e2e/    npm run lint:docs                   exit 0
    tools/e2e/    npm run lint:tokens -- --selftest   exit 0
    tools/e2e/    npm run lint:tokens                 exit 0
    (root)        node tools/e2e/scripts/brief.mjs --card T-158   exit 0

The DOCS GATE's diff half, run in the one spelling the doc and the
script share, exit **1** read unpiped, which is the code that means
the gate HAS a verdict:

    TREE=$(git merge-tree --write-tree 3607a94 HEAD)   # exit 0 read FIRST
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 3607a94 "$TREE")

It named one path under `docs/` as a code input — this card — and NOT
`README.md`, which is the mechanical confirmation of the reasoning in
the gate section above. The three suites it printed are the three run
in the ledger. It also reported that every live task card's
frontmatter parses with a legal status, and that the ADR-019 budgets
hold.

PORT DISCIPLINE, because the lane binds one: `14733`, read at zero
rows with `lsof -nP -iTCP:14733 -sTCP:LISTEN` AND unfiltered
immediately before the run, both exit 1. `1420` was never probed,
bound, connected to or signalled. The lane plants a control byte into
seven tracked files while it runs and restores them; `git status
--porcelain` in this worktree is EMPTY after the run, and the run
happened in a worktree rather than the main checkout precisely so the
human's live app never saw the write.

`brief.mjs --card T-158` is the card-figures audit pointed at this
card: *"no figure in this card claims a provenance and no census claim
is made"*, exit 0. These notes carry figures with their commands and
no stamp they cannot back.

### Checked and found to be a non-issue

The card's fence `[README.md]` names a file that did not exist when
the lane was cut, which raises the fair question of whether the
parser's fence expansion could resolve it. It can, and without an
oracle: `expandFence` in `lib/parser/src/fence.ts` classifies a token
as a path when it contains a `/` or a `.`, before it ever consults
`knownPaths` — so `README.md` resolves to `kind: 'path'` whether or
not the file is on disk. A fence naming a not-yet-existing file is not
the "unresolved token" case that rule warns about.

Separately, `lib/parser/test/fence.test.ts` calls `readdirSync(repoRoot)`,
which is the only place a suite reads the repository's top-level
listing. It uses it as an ORACLE for T-054's bare words (`docs`,
`method`, `ci`) and pins no exact set of root entries, so a new root
file cannot red it.

### Where the brief was wrong, and one open item for the seat above

- The dispatch brief named the base as `3607a94` and it is correct;
  `git rev-parse main` returns that same commit at dispatch, so the
  base is also the integration tip and no rebase question arises.
- The brief said the token lint "needs `npm ci` there first". It does
  not, and CONVENTIONS says why in its CI bullet: `token-scan.mjs` is
  zero-dependency and `npm run` only extends PATH. Both arms ran green
  against an uninstalled `tools/e2e/`.
- **OPEN, and deliberately not decided in the lane.** The brief says
  *"do not change the card's status"*. `method/roles/executor.md` step
  6 says the opposite in as many words — stamp in the lane, and *"a
  brief telling you to skip it is wrong"* — and for this card the
  ceremony table's row (`S, diff outside shipped code`) would make
  that stamp `done` rather than `verifying`. I have left the status at
  `building` and am naming the conflict instead of resolving it,
  because `done` additionally requires `built_by`/`verified_by`/
  `review` to be stamped and this work has neither been merged nor
  reviewed; asserting completion ahead of both would put a false state
  on the board, which is the failure the stamp exists to prevent. One
  edit closes it whichever way the seat above rules.

### Least confident

The **selection** of the tour's five links, not their verification.
Verification is mechanical and is ledgered above; selection is a
judgment about which record best demonstrates the property beside it,
and I made it from a repository I have read the governing documents
and a sample of cards from, not all of it. `T-083` was chosen over
`T-024`, `T-078` and `T-089` because its rejection is the narrowest
and most legible to a stranger — one figure that failed the card's own
prescribed derivation — and because the card then carries the fix and
the approval, so a reader sees a closed loop rather than a wound.
`T-024`'s verdict is arguably stronger evidence of adversarial
separation, since it was a CROSS-MODEL review and it caught a red
suite in a package the builder had not run; a verifier who thinks the
tour should demonstrate cross-model review rather than legibility
should swap that link, and the swap is a one-line edit. The second
least-confident judgment is the terminology table's `seat` row, which
states the verifier's informational constraint as the role file
charters it; `method/roles/executor.md` records, unresolved, that the
executor appends its reasoning to the same file the verifier reads.
The README describes the rule, not the residual, and I judged the
residual too deep for a front page — but it is a real caveat and it is
recorded here rather than left unsaid.

## Verdicts

### 2026-08-29 — REJECTED (claude-opus-5@subagent, review: same-model)

Verified from a detached scratch worktree at `/tmp/v158`, cut with
`git worktree add --detach /tmp/v158 487186e`. Every figure below is
stamped at `487186e` unless it names another ref. The lane's own files
were never edited from the scratch; `1420` was never probed, bound,
connected to or signalled.

**One sentence on the front door is false against this repository's
own record, and it is the sentence that describes the guarantee the
whole page is selling.** Everything else attacked survived: the fence
holds at two paths, the adapters are byte-identical blobs, all twelve
link targets exist and are tracked, the five tour links each
substantiate the sentence beside them, the page states no figure at
all, the marketing sweep is empty against a gate proved capable of
firing, and the three suites the DOCS GATE names are green at exit 0.
The defect is not a missing check — it is a claim the executor's own
verification ledger never tested, because the ledger tested the LINKS
and this claim carries none.

#### DEFECT 1, BLOCKING — "the session that builds a change never verifies it"

`README.md`'s terminology table, the `seat` row, third column:

> the session that builds a change never verifies it, and the verifier
> is handed the card and the diff rather than the builder's reasoning

The first clause is false, and the record says so twice.

**The method PERMITS what the sentence forbids.**
`method/tasks/TASK-FORMAT.md`, "Session syntax": *"Verifier may be any
model or session, including the builder's — the `review:` field records
which guarantee actually held"*, and, in the paragraph below it,
*"`self-verified` is the one value that names a MISSING guarantee,
because there the informational constraint was never applied at all —
the builder read its own reasoning by construction."* The README states
as a property of the practice the exact thing the method's format file
prices as an available, recorded weakening.

**The board CARRIES what the sentence forbids.** Derive it at your own
ref from the repository root:

    grep -h '^review:' docs/tasks/T-*.md | sort | uniq -c | sort -rn
    grep -l '^review: self-verified' docs/tasks/T-*.md

At `487186e`: **83** `same-model`, **20** `self-verified`, **5**
`independent`, **43** blank — and every one of the 20 `self-verified`
cards reads `status: done`, so these are merged changes, not
abandoned lanes. `T-097` closes the question without needing the
`review:` field at all: its frontmatter stamps `built_by:
claude-opus-5 @T-097` and `verified_by: claude-opus-5 @T-097` — one
session id on both lines.

**Why this is blocking rather than a note.** The README's own rule is
*"where this file and the record disagree the record wins"*, and here
they disagree. The page's thesis is that a stranger should check it;
one `grep` over `docs/tasks/` is the check, and it returns twenty
counterexamples and a method file that authorises them. Under
NORTH_STAR's bar — work that SURVIVES the scrutiny of masters — a
front-door sentence that fails a one-command check by the audience it
names is a stop-the-line defect, and it fails in the direction that
flatters the project, which is the applause-metrics exclusion arriving
as a fact rather than as an adjective. It is also the one row in the
table carrying no citation, which is how it got here: the
link-verification ledger above is thorough about the five tour links
and silent about the seven table rows, because only the links have
targets to check.

**The correction is available and is STRONGER than what it replaces.**
`TASK-FORMAT.md`'s same paragraph gives the true and sharper claim:
*"THE INDEPENDENCE THAT PAYS IS INFORMATIONAL, NOT MODEL DIVERSITY"*,
and *"`same-model` is not a weaker verdict than `independent`; it is
the same blindness with a different provenance, and the sharpest
rejections a pipeline records are routinely same-model."* The second
clause of the README's own row already says this correctly. The fix is
to drop the false first clause and keep the true one — the guarantee
is the verifier's blindness to the builder's reasoning, and where a
session held both seats the card stamps `self-verified` and the
guarantee is recorded as missing. That is a more impressive sentence
than the one on the page, because it survives the grep.

The executor named this row as its second least-confident judgment and
identified a DIFFERENT residual (the executor appending reasoning to
the file the verifier reads). That residual is real — this very
verification was dispatched with an instruction to read the
Implementation notes — and it is a second reason the first clause
overstates. Neither residual is the defect above, which is about
session identity and is settled by the frontmatter.

#### DEFECT 2, BLOCKING — "every house term is mapped to its standard name in the table below"

Same class, same page, one section earlier:

> The vocabulary here is local, and none of it has to be learned in
> advance: every house term is mapped to its standard name in the table
> below.

The table maps seven terms: card, lane, fence, seat, room, poison
drill, checkpoint record. The README's own body uses at least seven
more house terms that the table does not map — **verdict** (in the
T-083 tour line and in "lanes, fences, verdicts, checkpoints"),
**standing gate** ("each standing gate fired or ruled not-owed"),
**byte budget** ("how much of a document's byte budget the card
spent"), **governing document**, **dispatch brief**, **read-first
set**, and **integration branch** (used inside the `lane` row's own
description). A stranger meeting *"each standing gate fired or ruled
not-owed"* does have to learn something not in the table, so the
promise directly above it is not kept. Derive it:

    sed -n '83,89p' README.md | cut -d'|' -f2      # the seven mapped terms
    grep -n -iE 'verdict|standing gate|byte budget|governing document|dispatch brief|read-first set|integration branch' README.md

Either soften the promise to what the table delivers, or add the rows.
This is one line either way, and it is blocking for the same reason as
defect 1: it is an absolute the page's own body falsifies, on the page
whose whole claim is that its sentences hold.

#### What was attacked and SURVIVED

Named individually, because a rejection that lists only what broke
tells the next executor nothing about what it may leave alone.

- **THE FENCE.** `git diff 3607a94..487186e --name-only` returns
  exactly **2** paths — `README.md` and this card — exit **0**. The
  card is outside every fence by `method/lane-protocol.md`'s *"OWN CARD
  IS NOT A FENCE BREACH"*. No breach.
- **THE ADAPTERS.** `git diff 3607a94..487186e --name-only -- CLAUDE.md
  AGENTS.md` returns **0** paths, exit **0**. Stronger, by blob:
  `git rev-parse 3607a94:CLAUDE.md` and `487186e:CLAUDE.md` are both
  `03bbe073`, and both spellings of the adapter are that same blob at
  both refs. Byte-untouched, confirmed twice.
- **EVERY LINK TARGET.** All **12** unique markdown targets extracted
  mechanically (`perl -0777` over the anchor form), each tested with
  `[ -e ]` and `git ls-files --error-unmatch`: **12** exist, **12**
  tracked, **0** missing, **0** untracked. Independent of the
  executor's ledger and agreeing with it.
- **THE FIVE TOUR LINKS, opened and read.** Each substantiates the
  sentence beside it: `T-083` is `status: done` with `REJECTED` at its
  `## Verdicts` head, a `SECOND EXECUTOR … closing the rejection`
  section, an independent re-derivation and a closing `APPROVED`, all
  beneath its `## Acceptance criteria`; the T-092 checkpoint carries
  `## Merge` (parents and the merge-tree forecast), `## Gates`
  (four, each dispositioned), `## Suites` (five with exit codes) and
  the ADR-019 budget spend, and `git log -- <path>` returns exactly
  **1** commit, which is the "written down once and never edited"
  claim measured rather than asserted; `governing-docs.md`'s own
  H1 IS the question quoted, its opening paragraph records the
  amendment and the ruling, and ADR-019's `Provenance:` line names it
  back; `CAPABILITIES.md` carries the generated header naming
  generator and currency check and closes with a section literally
  titled *"Not extracted — named rather than dropped"*; and
  `docs/decisions/` holds **19** files, every one with `Status:` and
  `Date:`, `008` carrying `Amends: ADR-007`, and the `018` gap
  explained inside `019` by name.
- **THE VISION PARAGRAPH IS VERBATIM, not paraphrased.**
  `diff <(sed -n '3,7p' README.md) <(sed -n '4,8p' docs/NORTH_STAR.md)`
  exits **0** — byte-identical, which is what "quoted rather than
  re-worded" claims.
- **ZERO FIGURES.** `grep -n '[0-9]' README.md` returns **5** lines and
  every digit on them is an identifier: `Milestone 3`, `T-083` (twice),
  the date inside a checkpoint FILENAME, `ADR-019`, `ADR-018`. No
  count, size, hash, percentage or range anywhere on the page, and no
  spelled-out quantity making a claim about the tree. ADR-019 Law 2 is
  discharged by subtraction, exactly as claimed. The sweep was proved
  capable of firing by concatenating a planted `233` and re-running.
- **NO MARKETING VOICE.** A 30-term sweep (`best|finest|world-class|
  powerful|seamless|revolution|effortless|amazing|gold standard|unique|
  robust|elegant|ultimate|game-changing|production-ready|!|emoji|…`)
  returns **0** hits, exit **1**. **Proved capable**: the same pattern
  against the file plus one planted line reading *"This is the best,
  most seamless tool!"* returns that line at exit **0**. The page also
  does the harder thing — *"What has never happened is stated in the
  plan rather than omitted from it"* puts the unrun genesis on the
  front door, which is anti-marketing rather than merely non-marketing.
- **THE TERMINOLOGY ROWS I COULD FALSIFY, I could not.** `lane` is
  verbatim `method/lane-protocol.md`'s opening ("One task, one branch,
  one worktree, one session — and the integration branch is none of
  them"); `fence` restates that file's rule 5 accurately including the
  token-comparison failure; `poison drill` matches CONVENTIONS' POISON
  DRILL bullet, and its "prove the restoration with a hash rather than
  with a clean `git status`" is CONSERVATIVE relative to the source,
  which is the safe direction; `checkpoint record`'s "no gate, suite or
  generator is permitted to depend on the directory's contents" matches
  ADR-019 as STATE restates it. The two unlinked non-table claims check
  out too: *"Nothing here is the only copy of itself … the rule the
  method applies to its own dispatch briefs"* is
  `method/roles/executor.md`'s *"Nothing in the brief may be the only
  copy of itself"*, and the *"one home per fact"* and *"derive it,
  never quote it"* glosses are Laws 1 and 2 of `governing-docs.md`,
  the second one exact on all three of its exemptions.
- **THE EXECUTOR'S OWN LEDGER CLAIMS, re-run rather than read.**
  `README.md` is NOT among `token-scan.spec.ts`'s seven plant targets
  (the list carries `AGENTS.md` and `method/README.md`); GRAPH REGEN is
  genuinely not owed — `Lang::for_extension` in
  `crates/nputer-index/src/graph.rs` matches `ts|tsx|mts|cts|js|jsx|rs`
  and returns `None` for everything else; `git grep README -- app lib
  tools .github` returns **12** hits, every one a test fixture, a
  design-handoff citation or the `method/README.md` plant target, so no
  program reads the root file; and `brief.mjs --card T-158` is a real
  invocation (`--card` is in that script's own flag set) that exits
  **0** and expands this fence to **1** tracked file.

#### Suites — every count and exit read unpiped from `$?`

Run in `/tmp/v158` at `487186e`, in the scratch worktree and never in
the integration checkout. The DOCS GATE named three suites; all three
were installed and run there.

    (root)      node tools/e2e/scripts/docs-gate.mjs README.md \
                  docs/tasks/T-158-the-human-front-door.md   exit 1  FIRES
    lib/parser  npm ci                                        exit 0
    lib/parser  npm run build                                 exit 0
    lib/parser  npx vitest run                                exit 0  314/314, 15 files
    app         npm install                                   exit 0
    app         npm run build                                 exit 0
    app         npm test                                      exit 0  1013/1013, 47 files
    tools/e2e   npm ci                                        exit 0
    tools/e2e   NPUTER_E2E_PORT=16113 npm test                exit 0  233/233
    tools/e2e   npm run lint:tokens -- --selftest             exit 0
    tools/e2e   npm run lint:tokens                           exit 0  TOKEN 144, CONTROL 846
    tools/e2e   npm run lint:docs                             exit 0
    (root)      node tools/e2e/scripts/brief.mjs --card T-158 exit 0

Exit **1** on the DOCS GATE is the code that means the gate HAS a
verdict, not a failure; it named this card (never `README.md`) and the
three suites above, which is the mechanical confirmation of the
executor's reasoning about which gates this diff owes. `cargo test` was
NOT run: the gate does not name it, no `.rs` or `.md`-under-a-Rust-
reader path is in the diff, and STATE's cargo cache cliff makes an
unowed cargo run a source of false reds rather than of evidence.

PORT DISCIPLINE: `16113` read at zero rows with
`lsof -nP -iTCP:16113 -sTCP:LISTEN` AND unfiltered immediately before
the run — both exit **1** — and at zero rows again after. `1420` was
read zero times, because nothing in this verification had a question
about it.

POISON DRILL: not triggered. This diff adds one markdown file and one
card's prose and changes no test body, so there is no new or changed
assertion to mutate. The two SEARCH-based checks I rested a zero on
were each run once against a planted hit before their zeros were
written down, per CONVENTIONS' *"A COMMAND QUOTED AS PROOF IS SHOWN
CAPABLE OF FAILING"*: the marketing sweep and the digit sweep, both
recorded above.

SECURITY SWEEP: clean and shallow by construction. The diff adds no
input path, no endpoint, no query, no dependency and no executable
code — one root markdown file and card prose. No secret, key, token or
credential appears in either file; every link is repo-relative and
none leaves the repository. The only supply-chain surface touched was
my own scratch installs, which are outside the deliverable.

#### The executor's two least-confident items, ruled

- **Tour-link SELECTION — ACCEPTED, with reasons, and I decline the
  offered swap.** `T-083` over `T-024` is the right call and the
  argument for it is the one the executor made: a stranger can follow
  "one figure did not survive the card's own prescribed derivation"
  without knowing this repository, and the card then carries the fix
  and the approval, so the tour shows a closed loop. Cross-model review
  is a weaker thing to demonstrate here anyway — `TASK-FORMAT.md` rules
  in as many words that model diversity is not the guarantee that pays,
  so a tour entry advertising it would sit crosswise to the method's
  own position. The checkpoint pick is also right for a reason the
  notes do not claim: it is the record STATE names as current, it is
  immutable so the link cannot rot, and the README makes NO currency
  claim about it, so it needs no keeper. `docs/decisions/` as a bare
  directory is accepted because there is no index file to link — `ls
  docs/decisions/` shows 19 ADRs and no `README.md` — and the `018` gap
  is visible in the listing itself.
- **The `seat` row — CONTESTED, and it is defect 1 above.** The
  residual the executor named is real and I agree it is too deep for a
  front page. The residual it did not name is not deep at all: it is
  `grep -c '^review: self-verified' docs/tasks/T-*.md`.

#### Not blocking — do not hold the re-verification for these

1. *"They name the read-first set and stop."* The adapters also carry
   an operating rule (check CAPABILITIES before concluding a feature is
   missing), a command, the T-138 anecdote and the method pointers.
   "and stop" undersells them. One word fixes it and nothing depends on
   it.
2. The terminology table carries no citations, while the section above
   it promises *"Every claim below links to the record that holds it or
   names the command that derives it."* Every row I checked was
   accurate and traceable, and `method/` and `docs/CONVENTIONS.md` are
   both linked one section below — but a per-row source (`fence —
   method/lane-protocol.md rule 5`) would make the table self-certifying
   and would have caught defect 1 during the build. Recommended, not
   required.
3. `app/src/architecture/MapView.tsx`'s comment *"the README's
   pane-header order"* names no path and now reads ambiguously against
   a root `README.md` that did not exist when it was written. Adjacent,
   pre-existing, outside this fence; filed here rather than as a card
   because the board already carries **140** `suggested` entries
   awaiting the amnesty triage (derived at `487186e` with `brief.mjs
   --card T-158`).
4. The STATUS conflict the executor names as open is not mine to
   resolve and does not affect this verdict: `building` is the correct
   value at a rejection either way, and the stamping question belongs
   to the merge-time seat.

#### What a re-verification will be measured against

Two edits, both one line, both inside the existing fence
`[README.md]`. Fix the `seat` row so the guarantee it states is the
informational one the method actually charters, and make the
"every house term" sentence true against the table it introduces. The
three suites above are green and nothing else in this diff was found
wanting, so a re-verification is the DOCS GATE plus its three suites
at the new tip, plus the two greps in defects 1 and 2 returning
nothing.

#### The verdict's own tip, gated

This verdict is a WRITE, so it owes the gates it could move
(`roles/verifier.md` step 7). Re-run in `/tmp/v158` moved to my own
verdict commit `77ca368`, on the range `3607a94..77ca368`:

    (root)      node tools/e2e/scripts/docs-gate.mjs \
                  $(git diff --name-only 3607a94 77ca368)   exit 1  FIRES
    lib/parser  npx vitest run                               exit 0  314/314
    app         npm test                                     exit 0  1013/1013
    tools/e2e   NPUTER_E2E_PORT=16113 npm test               exit 0  233/233
    tools/e2e   npm run lint:tokens                          exit 0  TOKEN 144, CONTROL 846
    tools/e2e   npm run lint:docs                            exit 0

The gate names the same three suites and reports that every live card's
frontmatter parses with a legal status, which is the check the
`verifier:` stamp above could have broken. `git status --porcelain` in
the scratch is empty after the lane's plant-and-restore. Port `16113`
read at zero rows on both `lsof` forms before the bind and after the
run; `1420` untouched throughout.

The only change after `77ca368` is this ledger — card prose, no
frontmatter field moved — and the counts above are stamped at
`77ca368` rather than left to read as current.
