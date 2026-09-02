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
