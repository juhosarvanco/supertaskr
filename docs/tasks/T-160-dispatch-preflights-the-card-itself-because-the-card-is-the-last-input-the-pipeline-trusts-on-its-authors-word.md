---
id: T-160
title: Dispatch preflights the card itself — every derivable claim re-derived at HEAD before a seat is paid for, because the card is the last input the pipeline still trusts on its author's word
feature: F-04
milestone: 4
priority: 3
size: M
status: done
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "@human (2026-08-29): is there a step when a task is started that makes sure the task is doing work we want it to do — that the task and its description is up to date and makes sense?"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

**FILED AT @HUMAN'S DIRECT REQUEST (2026-08-29), planned at filing.**

The dispatch derivation checks that a card is STARTABLE — it exists,
its status is legal, its blockers read satisfied against live
statuses, its fence is disjoint, the base's gates are green. The
executor's step 1 checks the card MAKES SENSE — but after dispatch,
inside the lane, at lane prices. Between the two, nothing re-derives
what the card CLAIMS against the tree it is about to be built on.
"Derive at your own ref, never quote" is a gated property for the
governing documents and a prose rule for cards.

## Three measured instances from one day (2026-08-29)

- `T-127-s1` dispatched with a fence true at its writing and stale at
  dispatch — T-149 had moved both dogfood fixtures to `app-map`. The
  lane's honest stop cost ~164k tokens; a path-existence and
  fence-coverage re-derivation would have caught it pre-dispatch.
- `T-153-s2`'s card named argv as the channel; the code's own
  comments said a model never reaches argv (`validate_model`'s
  header). Found mid-build.
- `T-092-s2` was promoted on a headroom figure an intervening merge
  had mooted — caught at MERGE by hand re-derivation, two seats late.

And two instances of the check WORKING when performed by hand: the
amnesty integrator re-derived the 280-byte claim before folding, and
the T-153-s5 dispatcher read the fence manifest back before
launching — which is how the suffixed-id truncation (T-143 instances
4/5) was caught before it misfenced a third lane. The lineage:
`T-142` (an unmeasured claim acquires dispatch authority by being
handed to a seat), `T-143` (the dispatch answer lies), and the
class sentence both carry — a figure derived at one ref is not a
fact at another.

## The shape

A preflight arm beside `--write-fence` in the dispatch ritual, with
the same disposition: REFUSE with the discrepancy named, never
proceed past one silently.

## Acceptance criteria

- THE dispatcher SHALL be able to run a card preflight (an arm of
  brief.mjs or a sibling script — the seat decides, T-057 forbids a
  second copy of any derivation brief.mjs already owns) that
  re-derives, at HEAD, every claim of the card's that IS derivable:
  (a) every repository path the card names exists, or is explicitly
  a creation target; (b) the `touches:` fence, expanded through the
  live slug map, covers the paths the criteria name — the T-127-s1
  shape, fixtures counted; (c) every figure the card states WITH its
  derive command is re-run and compared; (d) each `blocked_by:` entry
  against live statuses, and any stated blocking REASON checked where
  it is derivable; (e) any ref the card stamps (`@ <hash>`) still
  resolves.
- WHEN any re-derivation disagrees THE preflight SHALL refuse the
  dispatch, printing the claim, the card's value, the fresh value and
  the derivation — the `--write-fence` refusal shape — and dispatch
  SHALL NOT proceed until the card is corrected or the discrepancy is
  ruled acceptable ON THE CARD, dated.
- THE preflight SHALL NOT judge desirability. Whether the work is
  still WANTED stays a seat's call; the tool surfaces stale facts,
  and its own output SHALL say exactly which claim classes it checked
  and which it cannot (the honest-omission rule, the capabilities
  generator's precedent).
- GUARD RULES: a planted stale path, a planted stale figure, and a
  planted uncovered criterion path must each RED the preflight
  (positive controls), and a current card must PASS (the clean twin)
  — pinned in a spec, mutants disposed per the POISON DRILL bullet.
- THE dispatch ritual in docs/CONVENTIONS.md SHALL gain the step
  (derive brief -> PREFLIGHT -> write fence -> stamp -> cut) — ONE
  sentence, minding that the dispatch bullet's opener rows are
  machine-parsed (`rawBullet` THROWS; workflow-parity pins the
  run-from set — the T-155-s1 lesson: state a limitation in place
  rather than tripping the parity pins).

## Fence note at filing

`touches: [tools/e2e]` is HELD by T-153-s5's live lane, and T-153-s6
is queued for the same seat on the CI-green path — dispatch this
card AFTER both land; the lane list is the authority, and the
CI-green sequence outranks priority 3 by @human's standing runbook.

PREFLIGHT RULING (2026-08-30): the note's "HELD by T-153-s5" is CARRIED
rather than corrected. That lane landed before this card was dispatched,
so the sentence above is false at HEAD — which is exactly the claim class
this card exists to surface, and the tool it builds refuses its own card
on it. It is not rewritten because the note is the founding evidence: the
condition it states was satisfied before dispatch, and destroying the only
copy of what the card was filed against to make a gate green is the shape
docs/CONVENTIONS.md refuses under "an unexplained file found here is
RECORDED and LEFT". This is the mechanism's own first worked example.

## Implementation notes

Built as **arm six of `brief.mjs`** — `--preflight`, requiring `--task` —
with the derivation in `tools/e2e/scripts/card-preflight.mjs` and the
execution in the wrapper, the house split. It CONSUMES rather than
re-derives: `context()` for the board, slug map, lane list and ref; the
parser's own `readDispatchOrder` for this card's expanded fence and its
startability ruling (the same expansion `--write-fence` stamps into the
manifest); `card-figures.mjs`'s `auditCard`/`derivedTexts` for the figure
ledger; and `within` from `.claude/hooks/lane-fence.mjs` for containment.
T-057 is why none of those is re-spelled.

**EVERY ARM WAS CALIBRATED AGAINST THE LIVE BOARD BEFORE IT WAS WRITTEN,
and the wide versions were refuted there.** The measurements are in the
module header as SHAPES with their derivation rather than as digits, per
the figure rule; re-derive them at your own ref. Three of the wide
readings would have made this gate the thing nobody runs.

### Where the card and the tree disagreed, named plainly

- **Criterion (b), as written, is false on this corpus.** "The fence
  covers the paths the criteria name" over-fires across a quarter of the
  board, because a criterion CITES far more files than it writes. What
  refuses instead is the narrow half: a criteria path that exists, that
  the fence does not reserve, and that **a DECLARED component owns** —
  the card could have fenced it by naming that slug. That rule
  reproduces this card's own founding instance: run the preflight on
  `T-127-s1` and it names BOTH dogfood fixtures under the `app-map` slug
  its fence never carried. The plain uncovered set is REPORTED, with the
  citation limit stated in place.
- **Criterion (c)'s "derive command" is the `card:<key>` STAMP**, not a
  shell command in prose. A figure is re-run through the closed
  `CARD_DERIVERS` vocabulary or reported unrunnable. The tool never
  executes text out of a markdown body, and its own output says so.
- **Criterion (d)'s "stated blocking REASON" is derivable in exactly one
  shape**: a claim that another card's LIVE LANE holds something, read
  against the lane list. The obvious wider reading fires on `after
  T-NNN` constantly and wrongly, because a satisfied blocker is the
  normal case. The narrow arm fires in the low single digits over the
  whole board — and every hit was genuinely stale, including this card's
  own fence note.
- **The dispatch message put a refusal at exit 3.** The repository puts
  it at 1: `brief.mjs`'s own header gives 1 to "assembled and FOUND
  something" and 3 to "could not run", and `lane-fence.mjs` says in as
  many words that a finding is thrown "so the caller can answer 1 rather
  than 3". Followed the repository; both codes are pinned in the spec.
- **Criterion two's "ruled acceptable ON THE CARD, dated" needed a
  mechanism and had none.** Built as a BODY line —
  `PREFLIGHT RULING (<date>): …` — rather than a frontmatter field,
  because the field vocabulary is `method/tasks/TASK-FORMAT.md`'s and
  adding one is a method change outside this fence. A ruling discharges
  ONE finding by naming its SUBJECT (the path, the hash, the card id,
  the figure's own line), never a claim class, and every discharge is
  printed with the line that made it. This card carries the first one:
  its fence note's `HELD by T-153-s5` is CARRIED rather than corrected,
  because the note is the founding evidence.

### The drill

Nineteen producer-side mutants, each derived from an acceptance-criteria
clause with the spec file closed, run in a DETACHED scratch worktree at a
named commit whose stem was derived from the lane. **19 for 19 red**, one
side only, every mutation read back off `git diff` before its suite ran,
every restoration proved by sha256 against `git show HEAD:` plus an empty
`git status`. Seventeen kill exactly one body; `paths-never-missing` kills
six and `owners-keep-the-glob` two, both being whole-arm mutants. The two
that live in `brief.mjs` were additionally run against the WHOLE lane, and
each came back **1 failed / 300 passed (300 at 2771ae9, not 299 — verdict, correction five)** naming one body — the
non-duplication count. The last two were run at `924067d` against the
refusal for a card the schedule does not draw.

**THE DRILL FOUND A CLAUSE NO PIN COVERED** (poison shape SEVEN, and the
procedure that bullet prescribes is what found it): the mutant that makes
a MISSING path INSIDE the card's own fence refuse was killed by nothing,
because every fixture had exercised only the outside-the-fence half. The
criterion's own words are "exists, OR is explicitly a creation target".
A body and its discriminating twin were added in `3c61797`.

### For the verifier

- The claim-class table and the not-a-claim-class list are pinned by
  CARDINALITY as well as by content, because a printed list with a
  member deleted reads exactly like a complete one (shape FIVE).
- Nothing in the spec reads a live card. Every fixture is planted into a
  temporary git repository with docs/CONVENTIONS.md, the whole of
  `method/` and both root adapters copied in — the live board carries
  real instances of all five classes, and pinning them would pin a board
  that churns.
- `docs/ARCHITECTURE.md` is copied into the fixture with its slug block
  re-derived from the fixture's own two components. Leaving this
  repository's nine-slug block beside a two-component registry is a real
  divergence the brief reports as a finding — the mechanism working, on a
  disagreement the fixture manufactured.
- The `--preflight` arm runs BEFORE `--write-fence` in one invocation,
  so a card whose claims no longer hold does not get a manifest written
  for it.

### Owed to the integrator, not filed as a card

`npm run capabilities` regen is owed: this spec adds bodies to the e2e
lane, and the census is generated from spec names (T-153-s8's class —
saying so here rather than filing a duplicate).

### Routed, not built

`T-160-s1` (nothing enforces the step — the manifest-receipt arm is the
one worth measuring), `T-160-s2` (a criterion inside an indented block is
invisible; the hole is disclosed in the tool's own output and the narrow
repair needs a measurement first), `T-160-s3` (asking for the preflight
always emits the whole brief, which only costs on the re-run loop this
mechanism creates).


## Verdicts

Fence corrected at dispatch (2026-08-30, integrator): criterion five lands in docs/CONVENTIONS.md, which the filed fence did not cover — the exact claim class this card exists to preflight, caught by hand at its own dispatch. Widened to [tools/e2e, docs/CONVENTIONS.md]; manifest rewritten and read back.

### 2026-08-30 — APPROVED WITH ASSIGNED CORRECTIONS (verifier claude-opus-5@subagent)

Independent hand. Two-phase blindness held: the attack set was written
from this card at its base ref `c2c40c2` with the Implementation notes
and the executor's report unread, extended after the raw diff, and only
then measured against the notes. **Every figure below is mine, derived
at `2771ae9` unless another ref is stamped beside it.**

**THE BATTERY, run in the lane at `2771ae9`, exits unpiped.**
tools/e2e `npm run typecheck` 0 · `npm run lint:tokens -- --selftest` 0
then `npm run lint:tokens` 0 (TOKEN 153 files, CONTROL 883) ·
`npm run lint:docs` 0 (23 readers across 4 suites, 0 frontmatter issues,
governing budgets hold) · the FULL lane `NPUTER_E2E_PORT=14571 npm test`
**301 passed, exit 0** in 2.9m, the port read to zero rows on both the
`-sTCP:LISTEN` and the unfiltered form first · app `npm test` **1015
passed / 47 files, exit 0** · lib/parser `npx vitest run` **314 passed /
15 files, exit 0** · app/src-tauri `cargo test` **all suites ok, exit
0**, the lib suite's own time **4.06s** — under the 9.5s green line, so
the cache cliff was not in play and no `a_hostile_session_id` red
appeared · `index --check --root ../..` **CURRENT, exit 0** (1022964 of
1040000 bytes).

**`capabilities:check` is STALE by exactly this lane's eighteen bodies,
and that was proved rather than assumed.** In a detached scratch
worktree I regenerated the census at `c2c40c2` and at `2771ae9`, each
restoration sha256-proved against `git show HEAD:`
(`a85ba04f7fa843ae…`). At the base the generator reproduces the
committed document byte for byte (`--check` exit 0, 22190 bytes). The
base-to-tip diff is **one removed line and twenty-two added**: the
census header (283 -> 301 behaviours, 27 -> 28 spec files), a
`## card-preflight` heading, and the eighteen sentences — nothing else.
**Fresh at the tip is 23599 bytes, not the 23599 (corrected per the verdict — 23525 predated 924067d) the executor's report
carries**; that figure was measured before `924067d` added the
eighteenth body and is stale at the tip it is quoted for. The regen is
the integrator's (T-153-s8's class).

**THE FOUNDING INSTANCE REPRODUCES BY NAME.**
`brief.mjs --task T-127-s1 --preflight` exits 1 and names
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx`, each *"reserved by app-map,
which this fence does not carry"*, stamped `@ 2771ae941f96`.

**THE EXIT CONTRACT IS PINNED FOUR WAYS AT MY OWN HAND**: 0 on `T-160`
itself, 1 on `T-127-s1`, 2 on `--preflight` with no `--task`, 3 on a
`parked` card (`T-101-s2`), whose refusal names the status and adds
*"Nothing was written."*

**THE BOARD-WIDE CENSUS, my own driver over every id the parser's
dispatch order draws.** 322 cards; the schedule draws **173** (done 122,
planned 49, building 1, verifying 1) and refuses the other **149**
(parked 113, suggested 36) at exit 3. Of the drawn set, **46 cards raise
at least one finding and 127 are clean.** By kind: CENSUS 59 across 25
cards (58 of them `done`), UNCOVERED CRITERION PATH 19 across 16,
STALE PATH 8 across 6, UNRUNNABLE 4, STALE 4, NOT STARTABLE 3, STATED
REASON NO LONGER HOLDS 2, UNUSABLE FENCE TOKEN 1.

**THE RULING MECHANISM, driven adversarially on live cards in a detached
scratch worktree, every mutation read back and every restoration
sha256-proved** (`T-059` `c4309e7a71f5…`, `T-068` `34dd1fa36a10…`).
A dated ruling naming the subject discharges and the run goes to exit 0;
a CLASSWIDE ruling naming no subject does not, and prints *"discharges
nothing at this ref"*; an UNDATED one does not; a malformed date does
not; the same sentence inside a fenced block, indented four spaces, or
written as a `- ` list item does not. On `T-068`'s four findings, one
ruling discharges **exactly one** and the other three still refuse; two
rulings discharge two.

**THE HONEST-OMISSION AUDIT — and this is where the corrections come
from.** Each probe planted one line into a live card's acceptance
criteria, with a CONTROL beside it, because the first apparatus I built
reported agreement out of a perl invocation that had silently consumed
its own argument (poison shape TEN, caught by the controls and not by
the result). With working controls — `tools/src/thing.ts` refuses,
`@ deadbee1234` refuses — four token shapes are **invisible to the tool
and named nowhere in its printed `cannot:` rows**: a path whose FIRST
SEGMENT is not a top-level entry of the tree (`oldpkg/src/thing.ts`
produces no finding and no census entry — a whole deleted or renamed
top-level directory is the staleness class at its largest, and it is the
one shape the arm cannot see); a path written with a leading `./`; a
repository-root file named with no slash; and a commit named in any form
other than the published stamp (`at commit deadbee1234` is invisible
where `@ deadbee1234` refuses). A markdown link is read correctly, and
the fenced-block hole IS disclosed.

**MY OWN POISON DRILL — eleven mutants, none of them the executor's.**
Producer side only, derived from the acceptance criteria, in a detached
scratch worktree at `2771ae9` with a lane-derived stem, each mutation
applied by an exact-count substituter that refuses any count but one,
each read back off `git diff -U0`, each restoration sha256-proved
(`7aad489f0c81…` for the module, `d73eb1ada98c…` for the wrapper) and
the tree left clean. **11 for 11 red.** Nine kill exactly one body: the
body-scope report, the dead-fence entry, the figure verdict gate, the
inverted live-lane read, the ref stamp's `@` requirement, the ruling's
subject binding, the not-a-claim-class cardinality, and both wrapper
mutants. `inFence = false` is a whole-arm mutant and kills nine;
dropping the component glob's wildcard normalisation kills two. **The
two wrapper-level mutants were run against the WHOLE lane and each came
back 1 failed / 300 passed**, naming one body — the non-duplication
count that poison shape SIX asks for.

**SECURITY SWEEP — clean.** No dependency is added anywhere in the diff.
The module spawns exactly two processes, both `git`, both argv arrays
with no shell: `check-ignore --stdin` (tokens on stdin, never as
arguments) and `rev-parse --verify --quiet <hash>^{commit}` with the
hash constrained to `[0-9a-f]{7,40}` at the regex. **No text out of a
card is ever executed**, which is the hazard a tool like this invites
and the one its own output names. The path regex cannot produce an
absolute or `..`-leading token, and no candidate path is ever opened —
existence is answered against `git ls-files`. The one cross-package
import (`within` from `.claude/hooks/lane-fence.mjs`) is the pattern
`tools/e2e/scripts/lane-fence.mjs` already uses.

### THE DESIGN QUESTION, ruled: the ownership inference STANDS as built

Re-derived at my own hand at `2771ae9`, over the 173 cards the schedule
draws.

- **Criterion (b) as LITERALLY written is refuted, decisively.** Every
  criteria path the expanded fence does not carry: **137 findings across
  79 cards** — done 100, planned 36, building 1. That is uncovered
  criteria paths on nearly half the drawn board, and **37 of them sit on
  cards a dispatch can actually pick**. A gate refusing half the
  dispatchable board is a gate nobody runs. The executor's refutation is
  correct and I reproduce it independently.
- **The NARROW form — a path a DECLARED component owns — fires 19 times
  across 16 cards: 18 on `done` cards and ONE on a `planned` one.**
  (The report's "7 board-wide, 5 on done" does not reproduce at this
  ref; it is superseded by the figures here.)
- **On the set that decides the question — planned, building, verifying,
  merging — the arm fires exactly ONCE, and that once is a TRUE
  POSITIVE.** `T-059` carries `touches: [crate-index, app-shell]` and a
  criterion ordering an assertion INTO
  `app/test/architecture-dogfood.test.ts`, which `app-map` reserves.
  That is `T-127-s1`'s shape, live on the board, on a card queued for
  dispatch — and `method/tasks/TASK-FORMAT.md` already calls a card
  whose criterion and fence disagree a DEFECTIVE CARD. Routed as
  `T-160-s4`. **The arm found a real defect on its first live pass.**
- **Precision on `done` cards is poor, and it does not matter
  operationally.** Four sampled hits: `T-023` (*"lib/parser's suite
  commands run against it"*) and `T-140` (*"Build lib/parser first"*)
  are citations; `T-088` names a path to be written into a component
  file; `T-056` names `app/src/lib/agent-store.ts` in order to promise
  it a **zero-byte diff** — a card refused for being careful, which is
  the sharpest false-positive shape and is routed as `T-160-s5` with the
  measurement a narrowing would owe. None of these is dispatchable; a
  done card is never picked, and the run prints the card's status on its
  third line so a reader sees which kind of card they are holding.
- **The costs are asymmetric and the escape hatch is cheap.** A false
  negative of this class cost `T-127-s1` a lane. A false positive costs
  one dated `PREFLIGHT RULING` line, printed on every subsequent run,
  which is precisely the artefact this method wants. **No scope change**
  — in particular, do NOT skip `done` cards: `T-127-s1` is `done`, and
  skipping them would delete this card's own founding demonstration.

### ASSIGNED CORRECTIONS — the integrator performs these

1. **The `cannot:` rows understate the tool by four shapes.** In
   `CLAIM_CLASSES` (card-preflight.mjs), `paths.cannot` SHALL name a
   token whose first segment is not a top-level entry of the tree at
   HEAD, a token written with a leading `./`, and a repository-root file
   named with no slash; `refs.cannot` SHALL name a commit written in any
   form other than the published `@ <hash>` stamp. `paths.checks`
   currently reads *"every repository path the card names"* and SHALL be
   softened to what the reader actually resolves. This is criterion
   three's own subject, and the four shapes are measured above.
2. **A claim addressed to me is false and SHALL not survive the merge.**
   The notes' *"The `--preflight` arm runs BEFORE `--write-fence` in one
   invocation, so a card whose claims no longer hold does not get a
   manifest written for it"* — and the same sentence in brief.mjs's arm
   six comment — describe a gate the code does not have. Measured:
   `--task T-068 --preflight --write-fence <dir>` raises the preflight's
   four findings AND executes arm five, which then refuses for its own
   unrelated reason; nothing reads `preflightFindings` before the write.
   PREFERRED repair: gate the write on `preflightFindings.length === 0`,
   printing why the manifest was not written, with a body pinning both
   halves. ACCEPTABLE repair: correct both sentences to say the ordering
   is print order and the two are separate ritual steps. Either way,
   docs/CONVENTIONS.md's own *"a guard believed wider than it is is
   worse than no guard"* is the rule being applied.
3. **`dischargedBy` binds by bare substring.** Measured: a ruling naming
   `app/src/lib/event-names.ts.map` discharges the finding whose subject
   is `app/src/lib/event-names.ts`. With this repository's suffixed ids
   (`T-153` inside `T-153-s5`) the same over-discharge is reachable on
   blocker and held-lane subjects. Add a boundary condition so a subject
   must not be continued by a path or id character, and pin it with a
   body. Every discharge is printed, so this is visible rather than
   silent — which is why it is a correction and not a rejection.
4. **State the ruling's own form where the ruling is prescribed.**
   docs/CONVENTIONS.md's new sentence says *"a `PREFLIGHT RULING
   (<date>):` line"*. Measured: the same sentence indented four spaces,
   inside a fenced block, or written as a `- ` list item does NOT
   discharge. Say so in place — a plain unindented body line, outside
   any fenced or indented block — because a bullet is the natural way to
   write it on a card and the failure is silent to the author.
5. **Two figures in the notes are stale at the tip they are quoted
   for**, on a card whose whole subject is that. *"1 failed / 299
   passed"* for the wrapper-level mutants is **300** at `2771ae9` (I
   measured both), and the report's capabilities figure is **23599**,
   not 23599 (corrected per the verdict — 23525 predated 924067d). Restate with a ref or correct.

### Routed, not blocking

`T-160-s4` (T-059's fence cannot reach a file its criteria order it to
write — the live defect this tool found on its first board-wide pass)
and `T-160-s5` (a criterion promising a zero-byte diff reads as a write
claim; the narrowing needs the corpus measurement the card specifies).
Both filed on this lane. I concur with the executor's `T-160-s1/s2/s3`
and with the CAPABILITIES regen being the integrator's.

### What I could not close

The claim-class table is asserted PRESENT and CARDINAL by the spec, not
asserted TRUE of the code — nothing mechanically compares the printed
`cannot:` rows against what the readers actually skip, which is how
correction 1's four shapes went unnoticed. That is a shape-EIGHT-adjacent
residual with no cheap mechanical remedy, disclosed here rather than
filed as a card, because the honest repair is the wording in correction 1
plus a reader who re-derives.
