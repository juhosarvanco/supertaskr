---
id: T-053
title: Zero-padding aliases every id space, not just components — lift the slot check
feature: F-02
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-030-s3 (architect, 2026-08-17), promoted after surviving two
triages as "the correctness-of-record item". The suggestion file is
removed in the same commit as this card.

T-030 shipped `aliased-id`: two different component id strings sharing
one numeric value (`C-05` / `C-005`) are one registry slot spelled
twice, and "first by component id order wins" then resolves by string
comparison — an arbitrary winner nobody declared. **The criterion
scoped it to components, and that is the only id space it checks.**

The same aliasing is legal and unchecked in the two id spaces the board
actually renders. Reproduced on T-030's own branch:

    docs/ROADMAP.md      ## Backbone
                         - F-1:  One — a
                         - F-01: One padded — b
    docs/tasks/T-01-a.md    id: T-01
    docs/tasks/T-001-b.md   id: T-001,  blocked_by: [T-01]

    → tasks: T-001 T-01 · features: F-1 F-01 · zero issues

Nothing rejects the pair: tasks are `^T-\d+(?:-s\d+)?$` (`task.ts:176`),
features are `F-\d+`, `duplicate-id` compares strings exactly and stays
silent, and the filename rule is satisfied because each file encodes
its own declared spelling.

**Why this stopped being hypothetical last night.** The suggestion
closed by calling it "a trap for the next hand-numbered task or an
interview-written backbone, not a live bug" — every id in this tree is
three digits, so nothing collides today. T-027 then shipped the
interview: a planner CLI now writes `docs/ROADMAP.md` and
`docs/tasks/*.md` into a fresh project, and T-028 is building the act
where those task files land live. **An interview-written backbone is
now a real path, and the writer is a language model choosing its own
id spellings.** `F-1` and `F-01` in one generated backbone is not an
exotic input; it is a plausible Tuesday. The trap goes live exactly
when the product starts working.

The harms, in increasing order:

- The board renders TWO columns for what a human reads as one feature,
  and a task naming the other spelling dangles or lands in the wrong
  column.
- `blocked_by: [T-01]` resolves to whichever spelling matches, so a
  dependency silently means something other than its author meant —
  the failure the cycle rule was added to make loud, arriving by a
  different door. **T-034 now renders that same `blocked_by` graph as
  dependency waves, a critical path and a worst blocker**, so a
  silently re-pointing edge is a wrong picture in a pane a human reads
  for planning.

## Acceptance criteria
- THE numeric-slot grouping SHALL exist ONCE as a shared helper, lifted
  out of `parseComponentSet` (`lib/parser/src/component.ts:335–355`)
  rather than copied, and SHALL be applied to component ids, task ids
  and backbone feature ids. The component behaviour SHALL be unchanged
  — T-030's existing pins (`lib/parser/test/component.test.ts:395`,
  `:428`, `:443`, `:470`) SHALL pass untouched, and any edit to them is
  a regression to explain, not a fixture to reconcile.
- THE slot key SHALL strip leading zeros AS TEXT, never through
  `Number()`, preserving T-030's stated reason: two genuinely different
  ids past 2^53 must not collide into a false alias because floating
  point ran out of room. Pin it with ids long enough to prove it.
- WHEN a task id space contains numerically equal ids spelled
  differently THE parser SHALL report one issue for the slot, in
  comparator order, keeping BOTH records. **The `-sN` suffix is part of
  the identity and its digits alias too**: `T-01` / `T-001` alias;
  `T-01-s1` / `T-001-s1` alias; `T-01-s01` / `T-01-s1` alias; and
  `T-01` / `T-01-s1` SHALL NOT alias. All four cases pinned — the
  suffix is the subtlety most likely to be got wrong, and a
  suffix-blind key silently merges a suggestion with its parent task.
- WHEN the roadmap backbone declares numerically equal feature ids
  spelled differently THE parser SHALL report one issue for the slot.
  Both declarations live in ONE file, so a `files` array reading
  `["docs/ROADMAP.md", "docs/ROADMAP.md"]` locates nothing: the issue
  SHALL carry enough to find the two declarations (both id spellings
  named in the message at minimum, a line reference if the roadmap
  parser already tracks one). A diagnostic a human cannot act on is
  not a diagnostic.
- THE issue SHALL say which id space it is about. `aliased-id` today
  hardcodes "component ids" in its message; three spaces need three
  messages, and a consumer SHALL be able to tell them apart without
  parsing prose. Whether that is a new field on the union member or
  three kinds is the builder's call — **record the choice and its
  reason in notes**. There are currently NO consumers of `aliased-id`
  outside `lib/parser/**` and its own tests (verified by `git grep`),
  so this is free to shape now and will not be later.
- THE app SHALL surface the new issues through the existing count and
  list with NO app-side change — assert that by running the app suite
  unmodified, and if any app file needs editing, STOP: that means a
  consumer switches exhaustively on issue kind, which contradicts the
  premise above and wants saying out loud.

Verification: headless — vitest in `lib/parser` over fixtures for all
three id spaces including the four suffix cases and the 2^53 case, plus
a live re-parse of this repo proving **zero new issues on the real tree**
(every id here is three digits, so a green tree is the control; a new
issue on real data means the slot key is too eager).

## Implementation notes

2026-08-17, executor claude-opus-5 @fresh, worktree
/Users/ujju/Projects/nputer-T-053, branch task/T-053-id-aliasing from
main@5995ac7. Fence: `lib/parser/**` plus this card and its suggestion
files. ZERO bytes under `app/`, `tools/`, `method/`, `app/src-tauri/`,
`docs/architecture/`. All quoted evidence is INDENTED, never fenced
(splitSections has no fence awareness — T-030-s2's standing trap).

### The card's own reproduction, reproduced first

The card's four-file fixture through the BRANCH-POINT parser, byte for
byte what the card claims:

    tasks:   T-001 T-01
    features: F-1 F-01
    ISSUES: 0

Same fixture through the branch parser: TWO issues, one per space.

### Criteria → evidence

**C1 — the grouping exists ONCE, lifted, applied to three spaces.**
New module `lib/parser/src/id-slot.ts`: `idSlotKey` (:49) and
`aliasedIdSlots` (:78). Three call sites, no copy:
`component.ts:340` (passing `compareComponentIds`),
`validate.ts:167`, `roadmap.ts:115`. The `bySlot` loop that used to sit
in `parseComponentSet` is GONE from component.ts; what remains there is
the component-specific message. T-030's four pins (branch-point
:395/:420/:433/:453, now :395/:432/:445/:465): the three that assert
BEHAVIOUR pass BYTE-UNTOUCHED, and :395 took a ONE-LINE tightening — see "What contradicts
the card" below, this is the one place the card cannot be obeyed as
written. Detection behaviour is unchanged, proved by the mutant sweep
(the component 2^53 pin still reds against a `Number()` key).

**C2 — the strip is TEXTUAL, pinned with ids a `Number()` build fails
on.** `id-slot.ts:49` is `id.replace(/\d+/g, d => d.replace(/^0+(?=\d)/,
''))` — T-030's reason is carried into its doc comment verbatim in force
and given a second limb (see C3). Pins: `id-slot.test.ts:53` asserts
LITERAL keys for `9007199254740993` / `...992` (and first asserts
`Number()` really does fuse them), plus a 400-digit pair where `Number()`
gives Infinity for both; `validate.test.ts:442`, `roadmap.test.ts:287`
and T-030's `component.test.ts:465 (its opener; :453 at the branch point)` pin the same at the ISSUE level in
all three spaces. NOT vacuous: a `Number()`-keyed build reds exactly
these four (mutant (a) below).

**C3 — task ids, and the `-sN` suffix is part of the identity.**
`validate.ts:167`, one issue per slot, both records kept
(`validate.test.ts:387` asserts `result.tasks` still holds both). The key
canonicalizes EVERY digit run separately and keeps the separators, so:

    T-01     / T-001      alias      (slot T-1)
    T-01-s1  / T-001-s1   alias      (slot T-1-s1)
    T-01-s01 / T-01-s1    alias      (slot T-1-s1)
    T-01     / T-01-s1    NOT alias  (T-1 vs T-1-s1)

All four pinned twice over: together in one five-file fixture
(`validate.test.ts:404`, which asserts the two slots' exact membership
AND that no slot mixes suffixed with unsuffixed ids) and case 4 alone
(`validate.test.ts:431`, zero issues — the assertion a suffix-blind key
reds). The harm the card names is pinned as a before/after, not as
prose: `validate.test.ts:479` shows `blocked_by: [T-01]` is a LOUD
dangling-reference while T-01 does not exist, and that adding the
unpadded sibling silently resolves that same edge — now `aliased-id`.

**C4 — backbone feature ids, locatable inside ONE file.**
`roadmap.ts:115`, run after the scan (a whole-file property) and after
the structural check. `files` is `["docs/ROADMAP.md","docs/ROADMAP.md"]`
because the type is index-aligned by contract and that IS truthful — so
the message carries what locates them: each spelling WITH ITS LINE,
using the `seen` map the duplicate-id message already uses. Pinned at
`roadmap.test.ts:237`, which asserts the literal substrings
`'F-1' (line 4)` and `'F-01' (line 5)` rather than only the kind. A
commented-out spelling cannot alias (the T-030 strip runs first) —
pinned at `roadmap.test.ts:300`.

**C5 — the issue says which id space, structurally.** `IdSpace` +
`space` on the member (`types.ts:227`/`:247`); emitted at
`component.ts:345`, `validate.ts:172`, `roadmap.ts:120`. Choice and
reason in "The union shape" below. Pinned at `validate.test.ts:390`,
which reads `.space` off a mixed fixture and asserts `['feature','task']`
without touching a message.

**C6 — no app-side change, and I did not need to make one.** The app
suite ran UNMODIFIED: `npx tsc --noEmit` clean, `npm run build` exit 0,
`npx vitest run` **718/718 (38 files)**, with the parser linked live
through `file:../lib/parser` (rebuilt dist first). `git grep aliased-id`
over the whole repo returns hits only in `lib/parser/src/{component,
types}.ts`, `lib/parser/test/component.test.ts` and task cards — re-run
myself with `git grep` per the standing rule, not taken on trust. No
consumer switches exhaustively on issue kind (`git grep "\.kind ==="`
over app/: every hit is a different union — GraphIssue, verdict entries,
agent events). Adding a FIELD rather than a KIND is also what makes this
safe against a future exhaustive switch.

Then measured rather than argued: the alias fixture pushed through the
app's OWN `docs-model.ts` (`applySnapshot`, via `vite-node`, no app file
touched) gives

    model.issues.length (the COUNT App.tsx:602 renders): 2
    failures.length     (the LIST App.tsx:615 renders):  0

So the criterion is met as written and its PREMISE is half true: the
count includes the new issues, the list cannot — `parse-error-details`
iterates `failures`, and `failingIssues` only marks a file failed when a
record was withheld or the roadmap yielded zero features. That is
pre-existing and identical for T-030's component `aliased-id`,
`ambiguous-mapping`, `dependency-cycle` and every `dangling-reference`.
Filed as **T-053-s1** rather than half-fixed inside a lib-parser lane.

### The union shape, and why (C5 asks for this explicitly)

TAKEN: **one kind, a new required `space: IdSpace` field.** Rejected:
three kinds (`aliased-component-id` / `-task-id` / `-feature-id`).

1. **The house already decided this shape twice.**
   `dangling-reference` is ONE kind spanning `depends_on`, `blocked_by`
   and `feature`, discriminated by a `field` value. `duplicate-id` is
   ONE kind spanning all three id spaces today. Splitting aliasing into
   three kinds would make it the odd one out in its own union.
2. **The root cause is one concept.** Three kinds would say the
   component case and the task case are different PROBLEMS; they are the
   same problem in different spaces, which is exactly why the fix was a
   lift and not three implementations.
3. **A field is the safer union change.** A new kind can silently fall
   through an exhaustive `switch` or a `Record<ParseIssue["kind"], …>`
   map; a new REQUIRED field breaks the compiler at every construction
   site instead, and there are none outside this package.
4. **It costs less at the pins.** The field disturbed exactly one
   pre-existing assertion (component.test.ts:395); three kinds would
   have disturbed three (:395, :420's filter, :465's kind array).
5. `space` is REQUIRED, not optional. An optional discriminator whose
   absence means "component" is a shape that has to be learned, which is
   what the criterion forbids.

Surface kept minimal: the TYPE `IdSpace` is exported from both barrels
(a consumer narrowing on `space` needs it); `idSlotKey`/`aliasedIdSlots`
are NOT exported from the package — no consumer exists, and tests reach
them by module path.

### Obligation — every new assertion executes, and DISCRIMINATES

Poison sweep, `throw new Error('T-053 POISON')` as the first statement of
every `it(` body the branch adds (28, extracted from
`git diff -U0 5995ac7..HEAD -- lib/parser/test` by walking hunk headers,
each verified to be a single-line opener):

    poisoned test bodies: 28   (id-slot 10, validate 10, roadmap 8)
    total 225   failed: 28   passed: 197
    failures citing POISON: 28/28    collateral AssertionErrors: 0
    restored: all three files sha256-IDENTICAL, git status clean

197 passed is exactly the pre-poison baseline, which is the collateral
check restated. But a poison sweep only proves a body RUNS, and this
card's traps are about a body being WRONG, so four discriminating
mutants were run against `idSlotKey` (each restored and re-hashed):

    (a) Number()-based key        ->  4 red  (all three spaces' 2^53
                                      pins + the helper's literal keys)
    (b) suffix-blind key          ->  9 red  (the four-cases pin, the
                                      isolated non-alias pin, AND THE
                                      LIVE-TREE SMOKE TEST)
    (c) strips every zero         -> 11 red  (incl. the smoke test)
    (d) identity (no grouping)    -> 23 red

(b) is the one worth reading twice: **the real tree is a live control
for the suffix trap, not just for eagerness.** This tree carries 58
suffixed task ids and every one of them has its parent present, so a
suffix-blind key would fire **19 false aliases** on today's docs/ and
red the smoke test immediately.

### The real tree: zero NEW issues, two trees

Branch parser (fresh `npm run build`) over the live tree:

    this worktree, before the s-files   tasks 117 · features 6 ·
                                        components 11 · ISSUES 0
    this worktree, FINAL tree           tasks 121 · features 6 ·
                                        components 11 · ISSUES 0
    /Users/ujju/Projects/nputer (main)  tasks 120 · features 6 ·
                                        components 11 · ISSUES 0

Main's tree is three cards ahead of this branch and the branch has never
seen it. Zero on both. What COULD have fired, checked rather than
assumed: every task id's BASE number is three digits wide (measured — no
`T-\d{1,2}` id exists), every feature and component id is two, and the
only 1-digit runs anywhere are the `-sN` suffixes, which is precisely
the part a careless key would have merged. The suite's own smoke test
re-proves the zero on every run.

Small correction to the card's phrasing while it is in view: "every id
here is three digits" is true of the T-NNN part and NOT of the suffix
(58 of the 111 id-bearing tasks carry a ONE-digit `-sN`), and the suffix is the half
the card is right to worry about.

### Suites — my own actuals, exit codes read unpiped

    lib/parser (from lib/parser/):
      npm ci            0 vulnerabilities
      npm run build     exit 0
      npx tsc --noEmit  exit 0
      npx vitest run    225/225 (11 files), exit 0   [197 + 28 new]
    app (from app/):
      npm install       clean
      npx tsc --noEmit  exit 0
      npm run build     exit 0  (index-Ch0Gpkv4.js 484.43 kB,
                                 index-DSR1ACex.css 43.30 kB)
      npx vitest run    718/718 (38 files), exit 0 — UNMODIFIED
    app/src-tauri:  cargo test  299 passed / 0 failed / 3 ignored,
      exit 0, zero compiler warnings, 13 test binaries + 2 doc-test
      targets (108/0/0/32+1/123/0/7/13/3/7/0+1/2+1/4/0/0)
    tools/e2e:  npm ci clean · npm run typecheck exit 0 ·
      NPUTER_E2E_PORT=14653 npm test -> 60 passed in 11.3 s, headless
      chromium, 1 worker, retries 0, no skips
    npm run lint:tokens -> clean (107 files), exit 0; --selftest ->
      49 samples green, 14 walk-policy checks green

The app and cargo figures DERIVE exactly from main's (718, 299/3): a
branch with a zero-byte app diff and zero Rust must not move them, and
does not.

PORT RULE observed. **1420 has a LIVE LISTENER right now** (`lsof` at
session start: node pid 81894 on [::1]:1420 — the human's app). It was
never bound, connected to or signalled; the only interaction was that
read-only `lsof`. The e2e lane was given scratch port **14653**, probed
free first, chosen away from the default 14520 and from anything the two
sibling worktrees (T-028, T-051) might hold.

BOOT GATE (T-046): **not triggered, stated rather than skipped** — the
diff touches no `app/src-tauri/**`, no `app/src/**` and neither
manifest.

### What contradicts the card

1. **Criterion 1 and criterion 5 cannot both be obeyed literally, and
   this is the card's one internal contradiction.** C1 says T-030's four
   pins "SHALL pass untouched"; C5 says the issue "SHALL say which id
   space it is about" and hands the builder the choice between a field
   and three kinds. BOTH choices change the object that
   `component.test.ts:395` asserts with a whole-object `toEqual`. Taken:
   the field, and a ONE-LINE tightening of that pin (`space: 'component'`
   added to the expected object, every other assertion byte-identical),
   dated and reasoned in place at the pin. The three pins that assert
   BEHAVIOUR rather than shape are byte-untouched. Read C1 as "the
   component DETECTION behaviour is unchanged" and it is fully met; read
   it literally and it is unmeetable, which is worth saying out loud
   rather than absorbing.
2. **`component.ts:335–355` REPRODUCES EXACTLY** against 5995ac7 — 335 is
   `const bySlot = new Map…`, 355 the closing brace of the issue loop —
   and the reasoning the dispatch calls load-bearing is the comment
   directly above it at 323–334. Both were read before the lift; the WHY
   paragraph moved into `idSlotKey`'s doc rather than being deleted.
3. **Three of the card's four test citations are not `it()` openers.**
   `component.test.ts:395` is one; `:428`, `:443` and `:470` are the
   remaining `git grep aliased-id` hits — an assertion line, a comment
   line and a final assertion. They do land one-per-pin inside the four
   T-030 alias pins, so the citation's INTENT reproduces exactly (four
   pins) even though three of the four line numbers point mid-body. The
   pins themselves OPEN at :395, :420, :433 and :453 in the branch-point
   file (:465 for the 2^53 one after my edit).
4. Minor: the suffix-width correction above.
5. **The hand-off stamp asked for is not a legal status, and this card's
   own control caught it.** `status: built` is not one of TASK-FORMAT.md's
   eight (`suggested | planned | building | verifying | rejected |
   merging | done | parked`); writing it produced an `invalid-field` on
   THIS FILE, reddened the live-tree smoke test and took the tree from
   ISSUES 0 to ISSUES 1 — the exact failure mode this card exists to
   prevent, arriving through the card's own stamp. Left at
   **`building`**, which is the house's executor hand-off state (T-027's
   stamp commit `7d3520c`: "status: building · builder + built_by";
   T-030's verdict: "Status left `building` for the integrator"), with
   `builder` and `built_by` stamped as asked. `verifier`/`verified_by`/
   `review` are the verifier's and integrator's to fill.

### Expected graph delta (NOT regenerated here, per dispatch)

`docs/architecture/graph.json` is stale at merge; regenerate per the
T-009-s1 standing practice. Expected: **TWO new file nodes under C-06**
(`lib/parser/src/id-slot.ts`, `lib/parser/test/id-slot.test.ts`) — the
first files added under `lib/parser/` since T-008 — carrying two new
exported symbols (`idSlotKey`, `aliasedIdSlots`) plus one unexported
(`compareIdSpellings`), three new `import` edges into id-slot.ts
(component.ts, validate.ts, roadmap.ts) and their `call` edges, a new
type symbol `IdSpace` in types.ts, and shifted `range` values on symbols
below every edit. No component was declared and no registry file was
touched, so T-024's THREE-fixture rule does NOT fire —
`lib/parser/test/smoke.test.ts` is deliberately untouched and green,
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` likewise (app suite 718/718
unmodified). The dogfood file COUNT for C-06 does move (+2), which is a
regen concern, not a registry one.

### Suggestions filed

- **T-053-s1** — an aliased slot raises the board's issue COUNT and
  names itself nowhere: the details strip only lists per-file parse
  failures. Measured through the app's own docs-model (2 issues, 0
  failures). Pre-existing for every cross-file kind.
- **T-053-s2** — `compareComponentIds` returns **NaN** for ids past
  `Number`'s range (309+ digits), which makes it an invalid comparator
  and leaves `sort` order implementation-defined. Reproduced.
- **T-053-s3** — `duplicate-id` is now the only id-space issue with no
  structural discriminator; it spans all three spaces and can be told
  apart only by prose, which is what C5 just ruled out for its sibling.
- **T-053-s4** — the REFERENCE side of the same trap is loud but blind:
  `blocked_by: [T-01]` against a declared `T-001` says "no task declares
  it" while a numerically equal id sits one file away. Reproduced.

### Flagged for the verifier

- The one-line tightening of `component.test.ts:395` is the only
  pre-existing assertion this branch touches; attack it first.
- `aliasedIdSlots` DEDUPES its input (an exact repeat is duplicate-id's
  business). All three callers already pass unique ids, so the dedupe is
  belt-and-braces encoding of a rule rather than live behaviour — pinned
  at `id-slot.test.ts:88`.
- Aliases are emitted BEFORE cycles inside validateProject (an aliased
  slot makes every edge below it ambiguous). Order pinned at
  `validate.test.ts:556`.
- `idSlotKey` is total over any string, including ids with no digits, so
  it needs no pattern argument and no per-space regex. That is deliberate
  — a per-space pattern would have been a fourth place to disagree about
  what an id is — but it does mean a hypothetical future id space gets
  grouped without opting in.

## Verdicts
