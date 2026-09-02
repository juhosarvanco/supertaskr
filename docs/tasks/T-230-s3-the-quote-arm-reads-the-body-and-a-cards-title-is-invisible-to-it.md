---
id: T-230-s3
title: The quote arm reads the card BODY, so a false assertion in a TITLE is neither checked nor listed nor disclosed — and one of the three founding instances states its claim there
status: verifying
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
suggested_by: "verifier claude-opus-5@subagent @V-230, 2026-09-02 — found attacking T-230's first acceptance criterion at 90dfe53"
---

`T-230`'s new `quotes` arm is careful about silence everywhere it looks:
an unreadable marker is counted apart, a marker the prose reader cannot
see is REPORTED as a sighting rather than dropped, and every unmarked
quoted run is listed with its line. **All three readers take
`cardBody(cardText)`, which strips the YAML frontmatter — so the one
place none of them looks is the card's own TITLE.**

Reproduced at `90dfe53` by driving the exported readers directly over a
card whose title carries a quoted assertion:

    title: the design "EACCES-fails the checkpoint sync" and docs/CONVENTIONS.md "already says it"

`cardClaims` returns nothing, `unseenMarkers` returns nothing, and
`unmarkedQuotes` returns nothing. A marker written inside a frontmatter
field is ignored **without even a sighting**, which is the exact failure
`unseenMarkers` exists to remove one line over: a marker meant as a claim
that is invisible, with no way for the author to tell.

**IT IS NOT HYPOTHETICAL, AND THE CARD'S OWN TABLE IS THE INSTANCE.**
`T-210`'s false prediction — the one `T-230` lists third — is stated in
that card's TITLE (its acceptance criteria begin at line 77; the
prediction is in the frontmatter and again in its body at lines 22-41).
The fixture reproduces the sentence faithfully and relocates it to body
prose, which is the only scope the arm can see.

Nothing the arm reports is WRONG. What is incomplete is its census, in a
place its own `cannot` text does not admit — and the first acceptance
criterion asks it to *"report every claim it could not evaluate rather
than passing silently over it"*.

**The cheap repair is one of two, and they are not the same size.** Read
the frontmatter's SCALAR VALUES as a further scope — they are already
parsed for `touches` by the path arm — or, cheaper and honest, add the
frontmatter to the class's `cannot` line so the omission is stated rather
than silent. Prefer whichever the fence can carry; the second is a
one-line edit and closes the disclosure half immediately.

## TRIAGE, 2026-09-02 — PROMOTED, absorbing its two siblings

Absorbs: T-230-s4, T-230-s5 — three distinct gaps in one arm of one
file, merged for economy (one lane, one review): the frontmatter blind
spot this card names, the marker's source reaching the report line
unescaped (`JSON.stringify` on the NOT CHECKABLE record, as the finding
message already does), and `unmarkedQuotes` dropping runs below
`MIN_QUOTE_CHARS` without counting them (a `below the quote floor: N`
line beside the two counts). Take the `cannot`-line arm as the floor for
the frontmatter gap and the scalar-value scope as the option. Fence
narrowed to the module and its spec.

## DISPATCH, 2026-09-02 — the stamp

**Audit (orchestrator 5b)**: both quote-arm call sites in
`tools/e2e/scripts/card-preflight.mjs` pass `cardBody(cardText)`, which
strips the frontmatter block (card-figures.mjs), so the title blind spot
holds at 37ac590. Fence: the module and its spec; T-225 holds neither.
Ceremony: S, guard-class, review independent — executor, then verifier;
this lane does NOT hold the integration checkout and does not merge.

## Implementation notes

Built at `80c36f8` (the code tip; later commits on this branch are
docs/tasks only). Fence held: `tools/e2e/scripts/card-preflight.mjs` and
`tools/e2e/tests/card-preflight.spec.ts`, nothing else, plus this card
and three findings under the always-writable `docs/tasks/`.

### The three gaps, and which arm each took

**ONE — THE FRONTMATTER BLIND SPOT. The OPTION was taken, not the
floor, and the floor's disclosure was kept anyway.** The card offered
the `cannot`-line edit as the floor and the scalar-value scope as the
option. The scope is built: `frontmatterScalars` reads the block's
SCALAR fields through `frontmatterFields` — the same function the path
arm already spends on `touches:`, so this is one derivation and not a
second — and `unmarkedQuotes` scans each one as its own unit.
`unseenMarkers` now reports a marker-shaped line in the frontmatter as a
SIGHTING. `cardClaims` was deliberately NOT widened: a frontmatter key
is a field with its own owner, which is why `cardBody` strips the block
at all, so a marker there is a request in the wrong place and gets a
sighting rather than the power to refuse. The `cannot` line states the
whole residual, so the floor's disclosure is delivered by the option
rather than instead of it.

**WHY THE OPTION WAS AFFORDABLE, MEASURED FIRST.** `frontmatterFields`
returns a value with YAML's own quoting still on it, so a naive scan
reads `suggested_by: "…"` as one author-written quoted run. Over the
448 live flat cards at `f5bad14`, with both controls printed: the raw
reading finds **171** quoted runs in frontmatter and **131** of them are
that wrapper; unwrapping first leaves **40** across 34 cards, **39** of
them in `title:` and every one an assertion somebody wrote. That ratio
is why `unwrapScalar` exists and why its guard refuses to strip a value
that merely begins and ends with a quote.

**TWO — THE UNESCAPED SOURCE.** The NOT CHECKABLE record now
`JSON.stringify`s `m.claim.source`, matching the finding beside it. The
`raise()` SUBJECT one line down is deliberately left raw: `dischargedBy`
matches a dated ruling against exactly that string, and escaping it
would stop every published-form ruling from discharging, silently and in
the re-opening direction. Six more unescaped display interpolations
remain in this arm — filed as `T-230-s9` with that discriminator stated.

**THREE — THE FLOOR'S SILENT DROP.** `unmarkedQuotes` no longer discards
a run below `MIN_QUOTE_CHARS`; it flags it, the floor still decides what
is LISTED, and the report carries `below the quote floor: N` beside the
two counts. Derived at `80c36f8` over the same 448 cards, controls
printed first: **369** body runs plus **2** frontmatter runs — 371 — were
previously dropped with no number anywhere.

### What the verifier should attack hardest

- **THE COUNTS ARE STILL NOT THE CENSUS, AND THE ARM NOW SAYS SO.** A
  quoted run spanning this repository's hard wrap is invisible to both
  halves — already filed as `T-230-s7`, `blocked_by: [T-230-s3]`. Nothing
  here repairs it; the `cannot` line DISCLOSES it, and the module and
  spec cite the card. Re-derived at `80c36f8` with controls: **2345**
  spanning runs across **363** of 448 cards. `T-230-s7`'s own figure is
  **2,386** across 364 at `f5bad14` — the estimators differ and that
  card is the authority for its own number.
- **THE DISCLOSURE BODY WAS SELF-CERTIFYING.** `every run prints which
  claim classes it checked and which it cannot` asserts
  `toContain(c.cannot)` with the expected value read from the constant,
  so it passes for any value including the empty string. Four `quotes`
  clauses are now pinned as literals beside the loop; the other five
  classes are not. Filed as `T-230-s8`.
- **`cardLines` WAS NOT TOUCHED.** Seven consumers across five claim
  classes and the ruling reader read through it, so the change stayed at
  the call sites this card names. `cardBody` now has three call sites in
  the module (was two); the added one is `frontmatterScalars`, which
  takes the COMPLEMENT of the body and changes what no existing reader
  sees.
- **NO `cannot` STRING MAY CARRY A DIGIT** — those rows leave through
  `note()`, which throws on one. Asserted mechanically at `80c36f8`: zero
  of the six classes carries a digit in any column.

### Poison drill — eleven mutants, eleven kills, at `80c36f8`

Run in a DETACHED scratch worktree at `/private/tmp/nd-T-230-s3`, stem
derived from the lane; module mutated ONE SIDE ONLY (never an assertion,
never a literal the two share), every mutation read back with `git diff`
before the suite ran, and every restoration proved by sha256 against
`git show 80c36f8:<path>` with an empty per-path diff as its companion.
Baseline in that tree: **40 passed, exit 0** over
`card-preflight.spec.ts` + `git-fixture.spec.ts`, the two consumers.

| mutant | bodies red |
|---|---|
| M1 frontmatter scope removed from `unmarkedQuotes` | 1 |
| M2 `unwrapScalar` never unwraps | 1 |
| M3 the unwrap guard removed — always strips | 1 |
| M4 the frontmatter sighting removed from `unseenMarkers` | 1 |
| M5a the floor count wired to the listed set | 1 |
| M5b `take()` drops short runs again | 2 |
| M6 the NOT CHECKABLE source unescaped again | 1 |
| M7 `where()` drops the field label | 1 |
| M8 frontmatter `nearPath` forced true | 1 |
| M9 body runs carry a field | 2 |
| M10 the hard-wrap disclosure loses its capitals | 1 |
| M11 the frontmatter-direction disclosure loses its capitals | 1 |

Nine kill exactly one body, which is the shape SIX question answered.
M5b and M9 each kill two, and the two are the READER's unit body and the
REPORT's line body — one property at two sites, stated rather than
tidied. **M10 AND M11 ARE THE ONES WORTH READING**: both mutate a
`cannot` clause by one capital, the parametrised loop stays GREEN under
both because it reads the mutated constant, and only the literal
assertions red. That is `T-230-s8`'s evidence, produced rather than
argued.

Restoration hash, both drill passes and every mutant:
`170fb211e493cbc622ce9fac337642ac4d8aa135763d7e8f1d6f9254fa66e93a`
for the module at `80c36f8`.

### Filed, not built

- `T-230-s8` — the claim-class disclosure body is parametrised by the
  constant it checks; five classes still unpinned.
- `T-230-s9` — six author-text interpolations in this arm are still
  unescaped, and the `raise()` subjects must stay raw.
- `T-230-s10` — `T-230-s7`'s `touches:` names
  `tools/e2e/scripts/brief.mjs`, which carries zero occurrences of the
  reader that card is about; the module is
  `tools/e2e/scripts/card-preflight.mjs`. No arm of the preflight can
  see it, because the path EXISTS.

## VERDICT — APPROVED, 2026-09-02, claude-opus-5@subagent (V-T-230-s3)

Judged at `db7e04d` (code tip `80c36f8`) against base `f5bad14`, in the
detached bench `/Users/ujju/Projects/nputer-V-T-230-s3`. All three gaps
the TRIAGE bought are closed, the option was taken without the
over-firing it risked, and the two things this work does NOT reach are
stated in the tool's own voice rather than left for a reader to
discover.

**MY BLINDNESS WAS THE CLOCK, NOT A DISCIPLINE, AND ONLY ONE OF THOSE
WAS GUARANTEED.** The bench was cut with the lane and briefed before the
work existed: at 2026-09-02T01:01:21Z the machine sweep in my own
preflight run recorded lane and bench both at `f5bad14`. There was no
diff, no tip ahead of the base and no note to decline to read. The
attack set and the ground truth were written and hashed before this
branch had a second commit —
`attack-V-T-230-s3.md` sha256 `1d968f64319a684c…da042117`,
`ground-V-T-230-s3.md` sha256 `4ce32d808712f17a…36151fd1`,
stamped `2026-09-02T01:08:55Z`. The dispatching brief named no
executor-derived specific, so phase 1 stayed above the line by its own
construction.

### What I attacked, and what held

**THE HIGHEST-COST MISFIRE AVAILABLE WAS NOT MADE.** `m.claim.source`
has three uses in one loop and only one of them is a display site. The
`raise()` SUBJECT one line below the escaped record is what
`dischargedBy` matches a dated ruling against; escaping it would have
stopped every published-form ruling from discharging, silently and in
the re-opening direction, and `dischargedBy`'s boundary test treats a
quote as a terminator so nothing would have said so. Measured at
`db7e04d`: a plain ruling still discharges a plain subject. The notes
name this discriminator before I did.

**THE FRONTMATTER SCOPE DOES NOT OVER-FIRE, AND I RE-DERIVED THE RATIO
RATHER THAN READING IT.** At `db7e04d`, over 451 flat cards: **40**
frontmatter runs listed across **34** cards, **39** of them in `title:`
and one in `suggested_by:`. The raw reading finds 171 across 131 cards,
so `unwrapScalar` suppresses **131 YAML wrappers** — quotation marks
nobody wrote as quotation. Its guard was attacked at eight edges and
held at all eight, including the two that matter: an escaped inner pair
and a value that merely begins and ends with a quote are both left
exactly as written. The conservative direction is the right one and it
is the one taken.

**`cardLines` WAS NOT TOUCHED, WHICH IS THE CONTAINMENT QUESTION.**
Seven consumers across five claim classes plus the ruling reader and the
criteria check read through it. `frontmatterScalars` takes the
COMPLEMENT of the body, so `paths`, `refs`, `blockers` and `rulings`
cannot have moved. `cardClaims` was deliberately not widened, so nothing
in a frontmatter field gained the power to refuse a dispatch.

**MY OWN POISON DRILL — NINE MUTANTS, AIMED, READ BACK FROM `git diff`,
RESTORED BY SHA256.** Run in this bench at `db7e04d`, module mutated one
side only, every restoration proved against `git show db7e04d:<path>`.

| mutant | site | bodies red |
|---|---|---|
| D1 the frontmatter-scalar `cannot` clause (DATA mutant) | the string constant | 1 — the disclosure body |
| D2 the LIST-values `cannot` clause reversed (DATA mutant) | the string constant | **0 — SURVIVED** |
| D3 the floor comparison | `belowFloor:` | 1 — the floor body |
| D4 the NOT CHECKABLE escape removed | the record line | 1 — the escape body |
| D5 the frontmatter scope returns nothing | `frontmatterScalars` | 2 |
| D6 the unwrap guard removed | `unwrapScalar` | 1 |
| D7 the frontmatter unit forced near-path | the `take` argument | 1 |
| D8 the frontmatter sighting loop removed | `unseenMarkers` | 1 |
| D9 LIST values scanned, in CODE | the scalar filter | 1 |

**CONTAINMENT, NEVER THE COUNT.** Body-wise the kill sets are
`{D5,D6}`, `{D5,D7}`, `{D8}`, `{D3}`, `{D4}`, `{D1}` — **no body's kill
set contains another's**, so all six new bodies are load-bearing and
none is a restatement. D5's count of two is a property of a wide mutant,
not a defect. Each mutant died at the site its property lives, and D1 is
a DATA mutant because that property lives in a string, which a code-only
drill would have mis-graded by construction.

**D2 IS THE ONE THAT SURVIVED, AND IT IS ALREADY FILED.** The clause
*its LIST values are not scanned at all* can be reversed in the `cannot`
string and the whole suite stays green — the parametrised loop reads the
mutated constant and four literals do not cover that clause. D9 shows
the BEHAVIOUR is pinned (`toEqual(["id","title","suggested_by"])` reds),
so what is unpinned is the disclosure alone. That is exactly
`T-230-s8`'s subject, produced independently by this seat and by the
executor's M10/M11. Not a blocker; the card exists.

**NO SHAPE-EIGHT HOLE IN THE NEW LITERALS.** Each of the four pinned
needles occurs exactly **once** in a real report, so none is satisfied
by a duplicate elsewhere.

**SECURITY.** No dependency added, no manifest in the diff, no
credential-shaped literal. Path traversal still refuses at the `tracked`
gate — `../../etc/passwd`, `/etc/passwd` and `docs/../../../etc/passwd`
all reach `cardClaims` unnormalised and all three are untracked, so
nothing is opened. Report injection through a marker source is now
closed on the reachable line: a source carrying a forged provenance
string is untracked, lands in NOT CHECKABLE, and is escaped there. Four
thousand quoted runs on one frontmatter line scan in under a
millisecond, so the new scope adds no backtracking surface. And the YAML
is read through `frontmatterFields` rather than re-parsed, so T-057's
one-derivation rule is kept and no second parser can disagree with the
first.

**THE CARD'S OWN INSTANCE IS STILL INVISIBLE, FOR A NOW-DISCLOSED
REASON.** At `db7e04d` this card's quote counts are still zero, because
its one quoted assertion (lines 44-45) spans the hard wrap. I predicted
this before the diff existed and it is the single most misreportable
fact in the lane: the repair did not move its own founding instance, the
`cannot` line now says why, and the notes say so too rather than
claiming a closure.

**THE TWO ESTIMATORS FOR THE WRAP GAP DIFFER BY THE ESTIMATOR AND NOT BY
THE REF, AND I OWN THE OTHER ONE.** `T-230-s7` carries **2,386 across
364** because it was filed from this seat's phase-1 ground truth; the
notes re-derive **2,345 across 363** at `80c36f8`. I re-ran my own
estimator at `80c36f8` and it returns 2,386 across 364 there too, so the
ref is not the cause. Mine pairs leftover straight quotes greedily
within a paragraph and counts no typographic pair, which makes it a
loose upper bound on one class and a lower bound overall. Neither number
is load-bearing for any decision here; `T-230-s7` is the authority for
its own figure, as the notes say, and that card should settle on one
estimator rather than carry two.

### Gates, at the commit under review

Run in this bench, unpiped, exit read from `$?`. The DOCS GATE fired on
four card paths and named three suites owed; all three were run.

    docs-gate.mjs <the RANGE RULE's own path list>   exit 1, verdict:
      three suites owed, and "every live task card's frontmatter parses,
      with a legal status" — the GATE CASE is clear for all four cards
    gate-run parser   exit 0   bodies=349    GREEN
    gate-run app      exit 0   bodies=1131   GREEN   (after npm run build)
    gate-run e2e      exit 1   bodies=553    551 passed, 2 failed

**THE TWO E2E FAILURES ARE NOT THIS DIFF'S, AND THE ATTRIBUTION IS
MEASURED IN BOTH DIRECTIONS RATHER THAN ARGUED.** Both are in
`session-economics.spec.ts` and both carry the identical cause:
`T-236-s5 holds a worktree on refs/heads/task/T-236-s5-row-four-reads-by-label
and no live card declares that id`. That lane's card landed on `main`
after this lane was cut, so a MACHINE-scoped fact — the host's worktree
list — is being joined to a CHECKOUT-scoped one, which is the collision
`method/lane-protocol.md` rule 4 names in those words.

- CONTROL A, at the base `f5bad14` with no part of the diff present:
  **the same two bodies fail**, 8 passed.
- CONTROL B, on the merge's own tree, built with
  `git merge-tree --write-tree` and wrapped in a throwaway `commit-tree`
  so no ref moved: **10 passed, exit 0** — the merged tree carries
  T-236-s5's card.
- The diff touches `session-economics.spec.ts` zero times, and that spec
  names `card-preflight` zero times.

So the red is inherited from the base, does not survive the merge, and
the lane's own green reading was true when it was taken. Neither reading
is about this work.

`merge-tree --write-tree main db7e04d` exits **0** on **six** paths.
`capabilities:check` exits **1**, STALE, 45968 → 46371 bytes, by the five
new bodies (31 → 36 in this spec) — re-derived here, matching the
handoff.

### Corrections owed before the merge, neither of them blocking

1. **THE STALE CENSUS IS NOT ON THE CARD.** `docs/CONVENTIONS.md` asks a
   lane that adds a test body to REPORT the stale census in its handoff;
   it reached the handoff verbally but not this durable file, and the
   handoff is not what the integrator reads at the merge. It is recorded
   here instead: **the integrator regenerates `docs/CAPABILITIES.md` in
   the merge commit** — the fence leaves it read-only, so the lane
   neither could nor should have. Forgetting it reds CI's
   census-currency step on that push, as it did at `e67cb44`.
2. **`status:` IS LEFT AT `verifying`.** Moving it is the closing seat's,
   not this seat's.

### Filed, not folded into this verdict

`T-230-s11` — the new scalar scope inherits `frontmatterFields`'
inline-comment strip, so a scalar is cut at the first space-hash and any
quoted assertion after it is dropped with no listing, no sighting and no
floor count. Reachable (five frontmatter lines on the board carry the
sequence at `db7e04d`) and costing nothing there today, because none of
those five carries a quoted run after the cut. Inherited from a reader
outside this fence that was correctly reused, and no completeness claim
was made about it — so a suggestion, never a finding against this card.

### The one thing I would say to the next reader

The card offered a one-line `cannot` edit as its floor and the scalar
scope as its option, and warned that the cheap one closes only the
disclosure half. This lane took the option AND kept the disclosure, then
disclosed the two gaps it did not close — and it found, unprompted, that
the body meant to hold the disclosure honest is parametrised by the
string it checks. A guard that can go silent without a red is not a
guard, and this work is the first in this arm to say so about itself.

### Step 7 — the gates at the tip THIS VERDICT created

A verdict and a filed finding are commits, and they make a tip nobody
has tested; prose is a code input here, so this seat owes the gates its
own writes could move. Measured at `c06ecb0`, the commit carrying the
verdict above and `T-230-s11`:

    lint:docs (whole-tree half)  exit 0 — every live task card's
      frontmatter parses, with a legal status; budgets hold
    gate-run parser  exit 0  bodies=349   GREEN
    gate-run app     exit 0  bodies=1131  GREEN
    gate-run e2e     exit 1  bodies=553   551 passed, 2 failed

**THE E2E DELTA FROM THIS SEAT'S OWN WRITES IS ZERO**: the same two
`session-economics` bodies, the same `T-236-s5` cause string, 551 passed
either side. So the figures in the verdict above are stated at
`db7e04d`, this block's are stated at `c06ecb0`, and neither is a
present-tense number anybody has to keep true.
