---
id: T-205-s6
title: "A tree home for the sealed attack set after the verdict — docs/benches/<card-id>/ committed by the integrator at the checkpoint that lands the verdict, so a verdict's digest citation resolves from the tree and MF-10 can exit 0"
feature: F-06
milestone: 4
size: S
priority: 8
status: planned
suggested_by: "T-205-s1's executor, ask-T-205-s1.md ASK 1 (2026-09-09), refused as a lane write by the architect seat and ruled a card; the card's own design question 2"
blocked_by: []
touches: [method/roles/orchestrator.md, method/roles/integrator.md, docs/CONVENTIONS.md, docs/reference/07-verification.md, docs/reference/08-landing.md, tools/e2e/tests/brief.spec.ts, tools/method-evals/, method/roles/verifier.md, docs/benches/README.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-205-s15 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews; applied only after the owner's two decisions — the README bootstrap and the citation grammar package). Fence completed: tools/e2e/tests/brief.spec.ts (criterion 3's own body), tools/method-evals/ and method/roles/verifier.md (the child's), and docs/benches/README.md — a TRACKED file by the time this card is cut, established by the owner-approved bootstrap records action that lands the neutral README before this lane (the preflight refuses a reservation under an untracked directory, so the lane cannot create its own root). blocked_by cleared: T-205-s1 is done. Priority 66 to 8. The combined custody, reader and grammar work is re-estimated BEFORE DISPATCH, and any ledger or assembler fence addition the work demonstrates joins the fence then; size S is provisional until that estimate.

## Why

Every real digest citation on the board today (T-205-s1's count: 13) names a
BARE filename — `attack-set-T-249.md`, `attack-V-T-239.md` — that resolves
only inside the dispatching session's scratchpad. So the checker T-205-s1
builds can VERIFY nothing from the tree alone: it exits 3 UNAVAILABLE on every
real citation and says where the method expects the file. That is honest, and
it is a refusal to guess, not a verification. A home in the tree turns exit 3
into exit 0.

The home is not a lane's to create. method/roles/orchestrator.md 5c says THE
ATTACK SET NEVER REACHES THE EXECUTOR, and T-205's card says plainly that
"after the verdict is a different question than before it, which this card
has to answer rather than assume." T-205-s1's executor parked the question
(ask-T-205-s1.md, ASK 1); the architect seat refused the grant and filed this.

## The seat's recommendation (for @human to confirm before dispatch)

- `docs/benches/<card-id>/` holding the three sealed files under fixed names:
  `attack-set.md`, `ground.md` (the ground truths taken at the base ref) and
  `stamps.txt` (the sha256 lines the verdict cites).
- Written by the INTEGRATOR, in the checkpoint commit that lands the verdict —
  never before the verdict (5c holds until then), never by the lane, never by
  the verifier (whose commit is on the bench and carries the verdict only).
- A digest citation resolves against the tree home by convention: the
  checker's `--scratch` roots gain `docs/benches/<card-id>`; by T-205-s1's
  design that is one more root and no code change.
- `docs/benches/` is a record directory: never rewritten, exempt from the
  prose budgets the governing documents carry, listed with the record floors
  the integrator counts at a rename (t265's RECORD_FLOORS class).

The alternative, `.supertaskr/benches/`, is refused in the recommendation:
`.supertaskr/` holds machine state (the lane manifest, the gate token) that
is re-minted, and a sealed set is a record.

## History — the five numbered requirements as filed, superseded on 2026-09-14 by the canonical section below (kept verbatim; the instruments read only the canonical section)

1. WHEN a verdict lands at a checkpoint, THE integrator commits the three
   sealed files under `docs/benches/<card-id>/` in the checkpoint commit, and
   `sha256sum -c` over `stamps.txt` in a fresh clone passes — the digests the
   verdict cites are the digests of the tree's files.
2. WHEN T-205-s1's checker is run against a verdict whose sealed set is in
   the tree, with no `--scratch` and no `SUPERTASKR_ATTACK_SET_DIR`, THE
   checker exits 0 (verified) — no code change beyond the root by convention;
   if a code change proves necessary, the card says so and routes it.
3. WHEN the executor's brief is assembled for a lane whose card cites a
   sealed set, THE brief carries nothing from `docs/benches/` for that card:
   5c holds for the lane's own set. A test in the brief's suite plants a
   `docs/benches/<card-id>/attack-set.md` and asserts the brief excludes it.
4. WHEN CONVENTIONS' bench bullet, orchestrator 5c, integrator's checkpoint
   list and reference chapters 07 and 08 are read, THE home is named once
   each with the same path shape, and the docs gate's root-anchor ledger
   tracks `docs/benches/` (it exists in the tree, with a README naming the
   rule, before the first set lands).
5. Nothing in `docs/benches/` is rewritten after it lands; the record rule
   is stated where the directory is introduced.

## Acceptance criteria

- WHEN a verdict lands at a checkpoint THE integrator commits the sealed files under docs/benches/<card-id>/ in the checkpoint commit, and a digest check over the stamps in a fresh clone passes — the digests the verdict cites are the digests of the tree's files. (requirement 1 as filed)
- WHEN T-205-s1's checker is run against a verdict whose sealed set is in the tree, with no scratch override, THE checker exits 0 — resolving a cited digest against the checkout-scoped root (resolveCited gains that root, as the integrator's note measured; the old assumption that no code change is needed is superseded), the fenced file carrying that change named at dispatch. (requirement 2 as filed, amended)
- WHEN the executor's brief is assembled for a lane whose card cites a sealed set THE brief carries nothing from docs/benches/ for that card; a body in the brief's suite plants a docs/benches/<card-id>/attack-set.md and asserts the brief excludes it. (requirement 3 as filed)
- WHEN CONVENTIONS' bench bullet, orchestrator 5c, the integrator's checkpoint list and reference chapters 07 and 08 are read THE home is named once each with the same path shape; every docs reader of docs/benches/ is covered by the docs gate's derivation or argued in its root-anchor ledger (the ledger accounts for specific reader files and grants no directory), and where a ledger or code change proves necessary its owning file and test join the fence at dispatch. (requirement 4 as filed, amended)
- Nothing in docs/benches/ is rewritten after it lands; the record rule is stated where the directory is introduced. (requirement 5 as filed)
- (absorbed from T-205-s15, the digest reader) WHEN a verdict cites its sealed inputs THE writers SHALL emit plain standalone canonical lines with `ground truth:` as the canonical spelling, and THE reader SHALL recognise the historical singular and plural ground labels and simple list-item or bold wrappers on otherwise recognisable standalone citations OR return a named format refusal — never turning such a citation silently into zero work; an existing `seal:` citation receives an explicit compatibility interpretation or a named unresolved-format result and is never guessed or discarded invisibly, and no new `seal:` output is introduced; the corrupt-ground positive and negative fixtures are kept, and the control that explanatory prose merely quoting the grammar is not a citation is kept; every count in the child is a historical measurement, not a fresh board count.
- Amendment of 2026-09-14 (the owner's condition at the fold): the home is kept SEPARATELY PER VERIFICATION ATTEMPT — docs/benches/<card-id>/<attempt>/, one directory per attempt on a card that is verified more than once (T-312's two attempts are the instance) — so no attempt's evidence overwrites another's; the criteria above that say docs/benches/<card-id>/ read with that attempt level; and no historical sealed material is published by this card's landing or by the bootstrap — which sets, if any, are moved into the home is decided at implementation and authorized separately.

## Absorbed from T-205-s15 — The second digest line has no reader — every recent verdict cites its ground truths on a line of its own, in two spellings the method never ruled, and the checker collects `attack set:` alone, so a corrupted ground-truths file exits 0; a bulleted or bold citation vanishes the same way (kept whole)

Title as filed: "The second digest line has no reader — every recent verdict cites its ground truths on a line of its own, in two spellings the method never ruled, and the checker collects `attack set:` alone, so a corrupted ground-truths file exits 0; a bulleted or bold citation vanishes the same way"

Filed as: status suggested, priority 8, size S, touches [tools/method-evals/, docs/CONVENTIONS.md, method/roles/verifier.md], wake None, suggested_by "verifier claude-fable-5-1@subagent @T-205-s1, 2026-09-09".

CLASS PARENT: `T-205-s1`. DISPOSITION HINT: **needs a spelling ruling
first, then promote at S.** The architect rules the line (`ground
truths:` or `ground truth:`, and whether `seal:` is a third), CONVENTIONS'
bench bullet spells it beside the attack-set line, and only then the
checker's `SITE` gains it and a fixture card carries it — a lane that
picked a spelling would be ruling method text, which is why T-205-s1's
verdict filed this rather than assigning it.

### The finding (T-205-s15)

Measured at `faf1b69`, on T-205-s1's verification bench:

- The board carries 14 `attack set:` citations in 12 cards, every one
  collected, and **16 `ground truth(s):` lines in 12 cards — 13 spelled
  `ground truth:`, 2 spelled `ground truths:` (T-248:670, T-264:353) —
  plus one `seal:` line (T-239:222); none is collected.**
  `tools/method-evals/verdict-digest.mjs`'s `SITE` is
  `^[ \t]*attack set:[ \t]*sha256:`, and MF-09's grammar is that line
  and nothing else.
- A card whose attack-set line verifies and whose ground-truths line
  cites a wrong digest **exits 0** (probe P22 in the verdict). No method
  file, CONVENTIONS or reference chapter spells the second line:
  `docs/reference/07-verification.md` phase 2 step 6 requires "the
  ground-truth digest on lines of their own" and gives no spelling;
  `method/roles/verifier.md` says the record is "hashed BESIDE the attack
  set". Two spellings on the board is the consequence.
- The same anchor drops a citation written as a list item (a line
  opening `- ` before the words) or in bold (`**` before them): 0 cited,
  exit 3 when the card is walked alone, and **silent inside a board
  walk** (probes P21, P21b). Zero such lines on the board today. The
  T-901 fixture holds the anchor's other edge — prose that QUOTES the
  grammar must not be a citation — so any widening owes both fixtures.

### What closes it (T-205-s15)

One ruled spelling in CONVENTIONS' bench bullet; `SITE` widened to the
ruled line or lines; a fixture card carrying a verifying attack-set line
beside a corrupted ground-truths line, expected exit 1 and named in
`MF-10`'s expectations; and the list-item and bold cases either ruled out
("a line of its own" means the line opens with the words) and pinned by
a fixture expecting 0 cited, or admitted and collected.

## Implementation notes

The first sets to land are the ones already sealed in the architect's
scratchpad for T-264, T-265, T-224, T-219-s6, T-153-s3 and T-205-s1 (their
stamps files carry the digests their verdicts cite); back-filling them is the
integrator's, at the checkpoint after this card lands, one commit, named.

VERIFIER NOTE (T-205-s1's verdict at faf1b69, measured): a citation naming a
repo-root-relative path (`docs/benches/T-901/attack-set.md`) with no
`--scratch` and no `SUPERTASKR_ATTACK_SET_DIR` is UNAVAILABLE, exit 3,
whatever the cwd; only an absolute path resolves without a root. Criterion 2
therefore needs the code change its own text allows for: `resolveCited` gains
the checkout-scoped repo root, derived from the file's location as
`boardCards` derives `docs/tasks` — checkout-scoped, not the machine-scoped
default rule 4 forbids. And criterion 1's `sha256sum -c` is `shasum -a 256 -c`
on this platform (CONVENTIONS' bench bullet). (Appended by the integrator at
T-205-s1's merge, correction 5.)

## Verdicts
