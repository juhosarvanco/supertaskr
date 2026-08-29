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
verifier:
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
