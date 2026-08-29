---
id: T-160
title: Dispatch preflights the card itself — every derivable claim re-derived at HEAD before a seat is paid for, because the card is the last input the pipeline still trusts on its author's word
feature: F-04
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "@human (2026-08-29): is there a step when a task is started that makes sure the task is doing work we want it to do — that the task and its description is up to date and makes sense?"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
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
each came back **1 failed / 299 passed** naming one body — the
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
