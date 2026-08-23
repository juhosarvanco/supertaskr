---
id: T-097
title: A padding-aliased task does not reach `unmapped` — it reaches the WRONG REAL COLUMN, and no test on the board side has ever driven the case
feature: F-02
milestone: 4
priority: 53
size: S
status: done
blocked_by: []
touches: [app-board]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-097
verified_by: claude-opus-5 @T-097
review: self-verified
---

Absorbs: T-076-s2 (sixth triage, 2026-08-20). That file is removed in
this commit.

**The board repairs one roadmap defect and not its sibling, and nothing
says so.** `selectBoard` keys its columns on the EXACT feature id string
and skips a repeat — *"duplicate backbone id: first wins, issue already
flagged"* in `app/src/lib/board-model.ts`, verified live at `4d2f03c` —
so the two defects the parser reports land in opposite places:

- **An exact duplicate (`F-01` twice) collapses to ONE column.** The
  first declaration wins, the second bullet's name and description are
  discarded. The parser reports it; **the board repairs it.**
- **A padding alias (`F-1` beside `F-01`) renders TWO columns.** Task
  routing is an exact-string `byFeature.get(task.feature)` falling back
  to `unmapped`, so a mis-padded task **does not even reach `unmapped`
  — it reaches the WRONG REAL COLUMN**, the one whose id string happens
  to match its own spelling. The parser reports it; **the board does
  not repair it.**

**The asymmetry is silent in the direction that matters.** An unmapped
task is visibly homeless; a task in the wrong column looks exactly like
a task in the right one. A human reading the board sees a plausible
placement and has no reason to doubt it, and the only signal that
anything is wrong is an advisory `aliased-id` issue in a different part
of the screen.

**Nothing normalises on the app side and nothing pins the case.**
Verified at `4d2f03c`: `git grep idSlotKey -- app/src` returns nothing —
there is no slot normalisation anywhere in the app — and
`app/test/select-board.test.ts` carries **no `F-1`-beside-`F-01` case at
all**. That is defensible as a design — a parser flags and a renderer
renders — but it is currently undocumented, and the `aliased-id`
message asserts the split-column harm as a FACT while nothing pins it on
the side where the harm happens.

**Related to but distinct from the rendering question.** T-077's family
is about what the app SHOWS about these issues; this is about what it
DOES with them.

## Acceptance criteria

- **THE BEHAVIOUR SHALL BE PINNED BEFORE IT IS DECIDED**: one body in
  `app/test/select-board.test.ts` driving `F-1` beside `F-01` with a
  task on each spelling, asserting the column set AND which column each
  task lands in. Whatever the ruling below, that body is the thing that
  makes the next change visible.
- **THE RULING SHALL BE WRITTEN, not implied**: either `selectBoard`
  routes by SLOT once the parser has reported an alias — repairing both
  defects rather than one — or it does not, and the reason sits at
  `selectBoard` beside the duplicate-id skip that already carries one.
- IF slot routing is taken THEN the two columns SHALL still render as
  two (the roadmap declares two bullets and the board tells the whole
  truth, T-017), and the card SHALL state which column a mis-padded task
  routes to and why — collapsing the task into the canonical slot while
  leaving both columns visible is a choice a reader must be able to
  find.
- IF slot routing is refused THEN the `aliased-id` message SHALL stop
  asserting a board consequence it does not produce, OR the board SHALL
  make the misrouting visible where it happens — an advisory issue three
  panes away is not the same claim.
- **THE PIN SHALL DISCRIMINATE THE WRONG-COLUMN CASE FROM THE UNMAPPED
  CASE.** A body that only asserts "the task is not in `unmapped`" is
  satisfied by the defect; assert the column identity.
- THE parser side SHALL NOT be touched by this card — `aliased-id` is
  reported correctly today, and a rule with two implementations is two
  chances to disagree (T-057).

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated, plus the POISON DRILL on the new body: mutate
the ROUTING (one side only — the producer, never the assertion), read
the mutated text back with `git diff` before running, require the RED,
restore and prove the restoration by sha256 against the drill's own
commit. Then T-092's shape-six check: name a mutation the new body
kills, run the whole app suite under it, require a failing-body count of
ONE. @human: none — the case is diagnostic, and the question "is a
mis-padded task better shown misplaced or shown homeless" is answered by
the ruling above rather than by looking.

## Implementation notes

2026-08-23, executor claude-opus-5 @T-097, worktree
/Users/ujju/Projects/nputer-T-097, branch `task/T-097-aliased-column`
cut from main's tip `a15b78e` (a `Checkpoint:` commit, per the
DISPATCH-FROM-THE-LAST-CHECKPOINT rule). Fence `[app-board]`: four code
paths under `app/src/components/board/`, `app/src/lib/` and `app/test/`,
plus this card and its findings. ZERO bytes under `lib/parser/**`,
`app/src-tauri/**`, `tools/**`, `method/**` — criterion 6 held
literally, not approximately.

### The brief named a file that does not exist

The dispatch said to read `app/src/lib/board-model.ts` /
`select-board.ts`. **There is no `app/src/lib/select-board.ts`.**
`selectBoard` lives in `board-model.ts`; `select-board` is the name of
its TEST file, `app/test/select-board.test.ts`. Both of the card's own
citations are correct — it names `board-model.ts` for the skip comment
and `select-board.test.ts` for the missing case — so this is the
brief's slip and not the card's.

### The card's two verified claims, and the one that is imprecise

Re-verified at `a15b78e`, not taken from the card:

- `git grep idSlotKey -- app/src` returns NOTHING. No slot
  normalisation anywhere in the app. TRUE.
- `app/test/select-board.test.ts` carried no `F-1`-beside-`F-01` case.
  TRUE.
- **"A padding-aliased task does not land in `unmapped` — it reaches
  the WRONG REAL COLUMN" is imprecise, and the pin is what showed it.**
  Routing is `byFeature.get(task.feature)`, an exact-string lookup, so
  a task ALWAYS reaches the column whose id string EQUALS its own
  `feature:` value, or `unmapped`. There is no input on which it
  reaches a column it does not name. What the card is really pointing
  at needs BOTH spellings declared in the backbone: then ONE slot
  renders as TWO columns and the slot's tasks are SPLIT across them,
  each looking correctly placed. Declare only `F-01` and a task saying
  `F-1` is correctly, visibly homeless — pinned as the contrasting
  case. **The harm is the SPLIT, not a misfile**, and the difference
  matters because it is exactly what rules out the repair the title
  implies.

### Criterion 1 — the pin, written and run BEFORE the ruling

`app/test/select-board.test.ts`, describe **"selectBoard — a
padding-aliased backbone slot (T-097)"**. The first three bodies were
written against the UNMODIFIED `selectBoard` and run there first:
`npx vitest run test/select-board.test.ts` exit **0**, 36/36. They
were GREEN, which is the point — they capture today's behaviour, so
whatever the ruling turned out to be, the next change to it is visible.

What they captured, at `a15b78e`, on a backbone declaring `F-1`,
`F-01`, `F-02` with a task on each of the first two:

    board.columns.map(c => c.key)   ->  ["F-1", "F-01", "F-02"]
    an unmapped column?             ->  NO
    cards in F-1                    ->  ["T-101"]
    cards in F-01                   ->  ["T-102"]
    cards in F-02                   ->  []
    board.columns.map(c => c.name)  ->  ["One", "One padded", "Two"]

**The pin discriminates the wrong-column case from the unmapped case,
and that is driven rather than argued.** The column SET assertion says
there is no `unmapped` column at all; the per-column IDENTITY
assertions say which real column each task reached; and a third body
runs the CONTRASTING fixture — one spelling in the backbone, a task on
the other — where the column list is `["F-01", "unmapped"]` and the
task is in the unmapped one. Mutant **M5** below proves the
discrimination is load-bearing: under an exact-first/slot-FALLBACK
routing, a previously homeless task quietly joins a real column, and
that third body is **the only body in 866** that notices.

### Criterion 2 — THE RULING: slot routing is REFUSED

Written at the routing site in `selectBoard`, beside the duplicate-id
skip, as the criterion demands — a 30-line block, not a clause.
Summarised here; the code carries it in full.

**Three reasons, and the first is decisive.**

1. **THERE IS NO CANONICAL COLUMN TO ROUTE TO.** The two bullets are
   two DECLARATIONS with their own name and description ("One — the
   unpadded bullet", "One padded — the padded bullet"). Nothing in the
   roadmap says which one the slot means. Any routing rule — first
   declared, shortest spelling, the parser's comparator order — makes
   the board **pick an arbitrary winner nobody declared**, which is
   verbatim the defect `aliased-id` was created to REPORT (T-030's
   "first by component id order wins … an arbitrary winner nobody
   declared", carried into T-053). The board would commit, silently,
   the bug it is displaying the warning for.
2. **THE DUPLICATE-ID SKIP IS NOT A PRECEDENT.** The card's framing —
   "the board repairs one defect and not its sibling" — reads the skip
   as a repair POLICY. It is not. Two bullets spelled `F-01` twice
   carry ONE id string, so a Map keyed by id cannot hold two columns
   for them; the skip is a consequence of KEYING. An alias has two
   distinct strings and keys two distinct columns with no help. There
   is no policy here to be consistent with, so the "asymmetry" is
   thinner than the card claims.
3. **A TASK IS NEVER FILED AGAINST TEXT IT DOES NOT CARRY.** Today
   `feature: F-01` lands under the bullet spelled `F-01` — checkable by
   reading two files. Slot routing would file it under a heading its
   own frontmatter never names.

**And a fourth, which is about this card's own fence.** The feature
`aliased-id` message ends *"the board renders a column per spelling and
a task's feature field lands in whichever column matches its exact
string"* (`lib/parser/src/roadmap.ts:137`). That sentence is TRUE
today. **Slot routing would falsify it, and criterion 6 forbids me from
repairing it** — I would be knowingly shipping a live, user-visible
false sentence with only a suggestion file as remedy, which is the
T-070-s5 / T-061-s8 shape this house has twice filed against itself.
Refusing keeps every existing sentence true; criterion 1's pin now
makes that sentence a PINNED claim on the side where the behaviour
happens, which is what the card's body actually complains is missing.

### Criterion 4 — refusing obliges disclosure, and it is rendered

Criterion 4 offers two ways out and **criterion 6 closes the first**:
the `aliased-id` message cannot "stop asserting a board consequence"
without a parser edit, and it produces the consequence it asserts
anyway. So the second is owed: **the board makes it visible where it
happens.**

- `BoardColumn` gains **`aliasedWith?: string[]`** — the other backbone
  spellings sharing this column's numeric slot. Present only on columns
  the parser named; **ABSENT, never `[]`** (T-017), enforced by a
  `spreadAlias` helper so the key does not exist at all on an unaliased
  column, and pinned with `hasOwnProperty`.
- It is read **straight off the parser's own `aliased-id` issues**
  (`space === 'feature'`) by `featureAliasIndex`. **The app does not
  re-derive the slot rule** — `idSlotKey` is not exported from the
  package and T-057 is explicit that one rule with two implementations
  is two chances to disagree. This also keeps criterion 6 exactly:
  no parser file, not even a barrel line, is touched.
- `FeatureColumn.tsx` renders it in the header as `= F-01` after the
  name, with a `title` spelling out the whole consequence, plus
  `data-testid="column-alias"` / `data-aliased-with`. It reuses the id
  chip's own classes deliberately — see the stylesheet note below.

**Which column a mis-padded task routes to, stated as criterion 3
asks** (it asks under the OTHER arm, but the question deserves its
answer either way): it routes to the column whose id string is
character-for-character its own `feature:` value, and to `unmapped`
when no column has that string. Both aliased columns render, both keep
their own name and description, and both now say so about each other.

### Suites — every exit read from `$?` unpiped, at `a15b78e`/`cce52e0`

Fresh worktree, prescribed order: parser `npm ci` -> `npm run build`,
then app `npm ci`, then tools/e2e `npm ci`, then the app BUILD before
the app suite.

    lib/parser:  npm ci            exit 0   (0 vulnerabilities)
                 npm run build     exit 0
                 npx vitest run    263/263 over 12 files, exit 0
    app:         npm ci            exit 0   (0 vulnerabilities)
                 npm run build     exit 0   BASELINE (before any edit)
                 npx vitest run    857/857 over 43 files, exit 0  BASELINE
                 npx tsc --noEmit  exit 0
                 npm run build     exit 0   AFTER
                 npx vitest run    866/866 over 43 files, exit 0  AFTER
    tools/e2e:   npm ci            exit 0   (0 vulnerabilities)
                 npm run typecheck exit 0
                 npm test          129/129, exit 0

**857 -> 866 is +9 and it reconciles exactly**: select-board 33 -> 40
(+7), board-truth 15 -> 17 (+2). The baseline reproduces the figures
the dispatch quoted (app 857/43, parser 263/263, e2e 129/129), so those
were right at `a15b78e` and are re-derived here rather than inherited.

**THE COMPILED STYLESHEET DID NOT MOVE, and that was checked rather
than hoped.** `index-CwYF5FQb.css` **43.95 kB** before and after,
byte-identical hash — the Tailwind content-scan hazard did not fire,
because the marker introduces no new utility (it reuses `shrink-0
font-mono text-xs text-column-header-id`, already emitted by the id
chip) and no bare utility-shaped word entered the scan. The JS moved as
it must: `index-DsNHI2Jr.js` 503.61 kB -> `index-CulPWp0S.js` 504.35
kB, both bundle inputs having changed; 265 modules, unchanged.

**One thing `npx tsc --noEmit` did NOT catch and the build did.**
`npm run build` runs `tsc && tsc -p tsconfig.test.json && vite build`,
and the test tsconfig's `lib` predates `Object.hasOwn` — the first
build exited **2** on `TS2550` in my own new body. Replaced with
`Object.prototype.hasOwnProperty.call`. Worth recording because the
loose `tsc --noEmit` is green on a file the shipped build rejects.

### The poison drill — SEVEN mutants, at the commit, all one-sided

Run in this worktree at **`cce52e0`** (the code commit), never against
a dirty tree. Correspondence by sha256 BEFORE any mutation, all four
paths identical to `git show cce52e0:<path>`. **Every mutant is
PRODUCER-side only** — no assertion was ever touched, proved by
`git diff --name-only` showing a single non-test file each time — and
**every mutated text was READ BACK with `git diff` before running**,
which is how M7's four-substitution `perl` pass was confirmed to have
landed all four rather than three.

| # | producer mutation | exit | failing bodies | which |
|---|---|---|---|---|
| M1 | route by SLOT (the card's own routing mutant) | 1 | **3** | the split pin, the homeless pin, the DOM pin |
| M2 | marker render disabled in FeatureColumn | 1 | **1** | the DOM pin |
| M3 | `spreadAlias` always sets the key | 1 | **1** | the absence pin |
| M4 | aliased column inherits the first spelling's NAME | 1 | **1** | the split pin |
| M5 | exact-first, slot-FALLBACK routing | 1 | **1** | the homeless pin |
| M6 | disclosure truncated to one spelling | 1 | **1** | the three-way pin |
| M7 | marker rendered unconditionally | 1 | **1** | the not-unconditional DOM pin |

**M1 is the mutant the card prescribes and it reds exactly the three
bodies it should, with ZERO pre-existing bodies red** — 863 passed / 3
failed of 866. The assertion texts are the discriminating ones:
`expected [] to deeply equal [ 'T-101' ]`, `expected [] to deeply equal
[ 'T-201' ]`, and `expected [ 'F-01' ] to deeply equal [ 'F-01',
'unmapped' ]`. That last line is the wrong-column/unmapped
discrimination, printed by the suite.

**T-092's shape-six check: SIX of the nine new bodies have a mutant
they alone kill** (M2..M7, each a whole-app-suite run with a
failing-body count of exactly **ONE**). Named per body, that is: the
split pin -> M4; the homeless pin -> M5; the absence pin -> M3; the
three-way pin -> M6; the DOM disclosure pin -> M2; the
not-unconditional DOM pin -> M7.

**THREE BODIES HAVE NO SUCH MUTANT AND I COULD NOT DERIVE ONE. Said
plainly rather than papered over, and filed as T-097-s2.** They are the
parser-premise control, the model-level "an unaliased backbone
discloses nothing" (which is a strictly weaker restatement of the DOM
body M7 kills), and the component-space body. The last is the sharpest
of the three: **it cannot discriminate removal of its own
`space === 'feature'` filter**, because component ids are `C-\d{2,}`
and feature ids are `F-\d+`, so a component slot key can never equal a
feature column key and an unfiltered index would leave every column
untouched. I found that while deriving the mutant, corrected the
body's own comment — it had claimed the filter was "load-bearing",
which is FALSE — and kept the filter, which is correct and cheap, while
labelling what the body actually pins.

**Restoration, proved four ways.** After the last mutant, all four
paths sha256-MATCH `git show cce52e0:<path>`
(`88ad99cf…` board-model.ts, `5e2d390d…` FeatureColumn.tsx,
`d7b818be…` select-board.test.ts, `5a48f98a…` board-truth.test.tsx),
`git diff --stat` is EMPTY and `git status --short` is EMPTY.

### Standing gates — derived from the diff, not from the brief

Range by the PRESCRIBED pre-merge form (`merge-tree --write-tree`),
never `merge-base..HEAD`; **dot count stated on every range command**.
Measured AFTER the notes commit so the docs paths sit inside the range
they gate.

**MAIN MOVED TWICE WHILE I MEASURED, and the first forecast was stale
because of it.** At dispatch main was `a15b78e`; my first
`merge-tree --write-tree` ran against `4c6ae7a`; by the very next
command main was `11c82a1` (T-089 merged and checkpointed), and I
reused the tree hash forecast against the older tip — which reported
**8** paths instead of 7. Re-derived from scratch at `11c82a1`, the
tree is `f5a579e…` and the count is **7**. A forecast tree is bound to
the tip it was computed against, and the ref must be re-read, not
cached.

Main tip **`11c82a1`**, my HEAD **`afecbad`**, merge-base **`a15b78e`**
(my cut, and an ancestor of the tip).

    git merge-tree --write-tree 11c82a1 HEAD -> tree f5a579e…, exit 0 ($?)
    git diff --name-only 11c82a1 <TREE>       (NO dots, PRESCRIBED)  ->  7
    git diff --name-only 11c82a1...HEAD       (THREE dots)           ->  7
    git diff --name-only a15b78e..HEAD        (TWO dots, branch-only)->  7
    git diff --name-only 11c82a1..HEAD        (TWO dots, FORBIDDEN)  -> 28

**The forbidden 28 is left-endpoint drift, not this branch.** Main
advanced **21** paths from my cut, the branch **7**, `comm -12` over
the sorted lists is **EMPTY**, and 21 + 7 = 28 — that arithmetic IS the
disjointness check.

### The three gates — ALL THREE FIRE, all three RUN

| gate | trigger | of the prescribed 7 |
|---|---|---|
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | 4 code paths | **FIRES** |
| BOOT GATE (`app/src/**`, `app/src-tauri/**`, either manifest) | 2 paths | **FIRES** |
| DOCS GATE (a `docs/` path a code suite reads) | 3 paths | **FIRES** |

The two `app/test/*.ts(x)` paths are GRAPH triggers but **NOT** boot
triggers — boot is `app/src/**`, and `app/test/` is neither that nor a
manifest.

**GRAPH REGEN — a REAL RED, and the discriminator is on both halves.**
`cargo run -q -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **1** with BOTH count lines present (committed
*588891 bytes · 119 files · **1023** symbols · **1550** edges*; fresh
*590881 · 119 · **1027** · **1555***) and `files +0 -0 ~4` — four
CONTENT changes, zero adds or deletes. **Not** the `--root` false red,
which prints `committed: MISSING`. **+4 symbols / +5 edges** (edges +7
−2): the new symbols are `featureAliasIndex` and `spreadAlias`
(board-model.ts, 17 -> 19) and two in the test file (7 -> 9), and the
two removed edges are the same two imports re-emitted with wider
symbol lists (`ParseIssue` added; `BoardColumn`/`BoardModel`/
`UNMAPPED_KEY` added).

**THE REGEN IS NOT IN THIS BRANCH — the checkpoint owes it.**
`docs/architecture/graph.json` is a **0-path** diff across
`a15b78e..HEAD`, deliberately.

**THE COMPOUNDING TRAP DOES NOT FIRE FOR THIS LANE, and that was
checked rather than assumed.** Main's 21-path advance since my cut
contains **ZERO** `.ts/.tsx/.js/.jsx` outside docs/ (T-089 is `method/`
+ `docs/CONVENTIONS.md`) and `graph.json` itself is a 0-path diff on
main, so the base is still 1023/1550 and this delta lands at
**1027/1555**. **THAT IS CONDITIONAL ON MERGE ORDER**: T-013 is
integrating with `[app-map, app-shell, app-agent]`, which WILL move the
base — if T-013 lands first, re-derive rather than reuse 1027/1555.

**BOOT GATE — OWED at 2 of 7, RUN, exit 0.** `NPUTER_BOOT_PORT=14761
npm run boot:check` from `tools/e2e` exits **0** with both `[nputer]`
lines (*project folder: /Users/ujju/Projects/nputer-T-097* and *window
"main" created*), child pid 86161, captured group 86161 (setsid, pgid
== pid), tree stopped on SIGTERM. Port **14761** was bind-probed free
on all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use and
is free after.

**DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with the three paths
and never through `xargs`. It owes **three** suites, all run:
`npm test from app/`, `npm test from tools/e2e/`,
`npx vitest run from lib/parser/`. `cargo test from app/src-tauri/` is
correctly NOT owed — its two readers resolve
`docs/architecture/components` and `docs/CONVENTIONS.md`, neither
touched. Reported: **11 derived readers across 4 suites**, **0
frontmatter issues**, a census of **118 docs-shaped sites in 22 files,
11 root-anchored in 9 files**, and *every live task card's frontmatter
parses, with a legal status* — which is the machine check that this
card's `status: done` / `review: self-verified` stamps and the two new
finding files are legal. All three owed suites were run again after
this gate section was appended.

### What I did not do

- **No parser byte.** Criterion 6, literally.
- **1420 was READ ONLY**, with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
  nothing else. Holder unchanged: `node` pid **82549**, one socket
  `TCP [::1]:1420 (LISTEN)`.
- No `pkill`, no `npm ci`/`npm install` in the main checkout, no real
  model call, no merge, no touch of main.

## Verdicts

2026-08-23 — claude-opus-5 @T-097 (executor, S-tier self-verification;
`review: self-verified`, the honest floor — no verifier existed at this
size and this entry does not pretend one did): **DONE, with three
things the card got wrong recorded rather than absorbed.**

The adversarial pass I ran against my own work, and what it changed:

1. **The card's title claim is imprecise and the pin is what proved
   it.** Routing is an exact-string lookup, so no input makes a task
   reach a column it does not name; the real harm needs BOTH spellings
   in the backbone and is a SPLIT, not a misfile. Recorded in the notes
   and load-bearing on the ruling — the imprecision is exactly what
   rules out the repair the title implies.
2. **The card's premise that the board "repairs" duplicates is
   overstated.** The skip is a consequence of keying a Map by id, not a
   normalisation policy, so the "asymmetry" the card is built on is
   thinner than it reads. There was no precedent to extend.
3. **Criterion 4's first disjunct is unreachable under criterion 6.**
   The `aliased-id` message cannot stop asserting a board consequence
   without a parser edit, and it produces the consequence it asserts
   anyway — so refusing obliged the SECOND disjunct, which is why the
   marker is rendered to the DOM and not left as a model field.

What I attacked hardest, and what it cost me: **three of my own nine
new bodies kill no mutant another body does not already kill**, one of
them (the component-space body) provably unable to discriminate the
mechanism its own comment claimed was load-bearing. I corrected the
false comment in place and filed the credit correction as `T-097-s2`
rather than deleting the bodies or leaving them credited as pins. Six
bodies DO have an alone-killed mutant, each proved by a whole-suite run
with a failing-body count of exactly one.

Where a verifier should start if this is ever re-opened: the six
alone-kill claims are the load-bearing evidence and each is one command
to reproduce; the ruling's first reason (no canonical column exists) is
the one that would have to be wrong for the other arm to be right.
