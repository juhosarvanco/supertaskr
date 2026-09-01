---
id: T-236
title: CONVENTIONS compaction landing two — every seat reads the whole document before it can start, it sits at its own warn line, and ADR-019 says the measurement narrative it carries belongs in records
feature: F-01
milestone: 4
priority: 1
size: L
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/scripts/docs-scan.mjs, docs/decisions/019-governing-docs-rules-truths-records.md]
suggested_by: "the architect seat, 2026-09-02 — item 1 of docs/rooms/loop-efficiency.md, filed after @human asked for the loop's weak spots and ruled 'apply all of your current loop efficiency suggestions'"
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE SINGLE LARGEST COST EVERY LANE PAYS IS READING THIS DOCUMENT, AND
ADR-019 ALREADY SAYS MOST OF WHAT IT CARRIES BELONGS SOMEWHERE ELSE.**

`wc -c docs/CONVENTIONS.md` read **158,281 at cf9d462** against a warn
line of 164,393 and a fail line of 197,271 (`DOC_BUDGETS` in
tools/e2e/scripts/docs-scan.mjs, landed 2026-08-30 at 131,514). Five
seats read it per merged card — architect, executor, verifier twice,
integrator — and the root adapter sends every one of them to it before
they touch anything. At roughly a quarter of a token per byte that is
about forty thousand tokens a seat, two hundred thousand a card, before
any work starts.

ADR-019 rule 1 sorts every sentence into RULE, TRUTH or RECORD, and rule
5 says a recurring pattern earns ONE rule, ONE provenance citation and
ONE worked example in a governing document — further instances go to
records. The document has grown past that contract since its 2026-08-30
re-landing: whole bullets are re-measurement tables, second and third
worked examples, and instance narratives that the cards and checkpoint
records already hold. Derive the map rather than trusting this
paragraph:

    awk 'BEGIN{n=0} /^- /{if(n) print len, substr(title,1,60); n++; len=0; title=$0} {len+=length($0)+1} END{print len, substr(title,1,60)}' docs/CONVENTIONS.md | sort -rn | head -20

At cf9d462 that census put the POISON DRILL bullet first by a wide
margin, then the DOCS GATE, RANGE RULE, LANE PROTOCOL and CI bullets. Of
those five, three are PINNED by programs that derive figures or commands
from their text, and two are almost entirely narrative.

## The planning pass — this is an L card, and this section is its plan

**What moves.** A sentence moves when it is an INSTANCE of a rule the
document already states: a second worked example, a re-measurement
table, the story of how a rule was broken after being written, a count
that a card or record stamps at a ref. Each moved sentence is replaced
by a citation — the card id, the record, or the pre-compaction ref —
so the mechanism keeps its provenance and loses its narrative. **A
hazard is never deleted to fit** (ADR-019 rule 6): anything that lives
nowhere else stays, and the executor names each such sentence in the
report rather than cutting it.

**What stays, byte for byte.** Every sentence a program reads. The
readers are DERIVED, never listed: `node tools/e2e/scripts/docs-gate.mjs
--census` from the repo root prints them at the lane's own ref. At
cf9d462 the ones that pin TEXT rather than merely read the file were:

- `tools/e2e/tests/workflow-parity.spec.ts` — the per-package command
  bullets under Build and test, command by command, middle dots
  included; a reworded command reds it by name.
- `tools/e2e/tests/range-rule.spec.ts` and `tools/e2e/scripts/range-rule.mjs`
  — the RANGE RULE bullet's figures, tables and flip lists are READ from
  the document and checked; they are the one measurement narrative this
  card may NOT move, and the card says so rather than letting a lane find
  out.
- `tools/e2e/tests/gate-run.spec.ts` — the blessed runner named in
  exactly one place, and the suite list beside it.
- `tools/e2e/scripts/dispatch-brief.mjs` through `range-rule.mjs`'s
  `rawBullet` — four naming phrases each carried by exactly ONE bullet
  (THE LANE PROTOCOL, DISPATCH FROM THE LAST CHECKPOINT, Fresh-clone
  ORDER, PORT RULE with its colon); a second bullet carrying one exits
  every arm of `brief.mjs` at 3, which is how 43e776a went red on
  2026-09-01.
- `tools/e2e/tests/docs-input-gate.spec.ts` — the DOCS GATE bullet's
  printed spelling and its command list.
- `app/src-tauri/src/agent/kit.rs` — the `currently v<version>` stamp in
  the first gotcha, under `cargo test`.
- `tools/e2e/tests/brief.spec.ts`, `dispatch-order.spec.ts`,
  `lane-fence.spec.ts`, `push-guard.spec.ts` — bullets read by phrase
  (`conventionsText()`); the executor greps each spec for the phrases it
  passes and keeps every one.

**What the landing writes.** The new byte count goes into `DOC_BUDGETS`
in docs-scan.mjs as the landed value, with warn and fail re-derived by
the rule ADR-019 and its addenda state at the lane's own ref (T-162-s1's
byte-floor question is @human's and is not pre-empted here — apply the
rule as written), and a dated addendum on ADR-019 records the
measurement, exactly as T-162's addendum 4 did.

**What this card is not.** Not a rewrite of any rule, not a change to
any command, not a deletion of any hazard. A reader who knew the
document before should find every rule where it was, shorter.

## Acceptance criteria

- THE executor SHALL run `node tools/e2e/scripts/docs-gate.mjs --census`
  at the lane's base and treat every reader it names as a pin: after the
  cut, every reader suite SHALL be run in full and listed in the report
  with its exit, and a body that reds names the sentence that moved.
- WHERE a bullet's text is derived by a program — the RANGE RULE figures,
  the per-package command bullets, the runner's one spelling, the four
  naming phrases, the DOCS GATE spelling, the version stamp — THE bullet
  SHALL keep that text verbatim, and the report SHALL list the bullets
  left intact for that reason.
- THE compaction SHALL replace each moved instance with a citation to the
  card, record or pre-compaction ref that holds it, and IF a sentence
  lives nowhere else THEN it SHALL stay and be named in the report.
- THE executor SHALL report `wc -c docs/CONVENTIONS.md` at the base and
  at the tip, and the landing SHALL reduce it by at least a third; IF the
  pins above make that unreachable THEN the report SHALL say which
  sentences they hold and stop short rather than cut a pinned one.
- THE landed count SHALL be recorded in `DOC_BUDGETS` with warn and fail
  re-derived by the rule in force at the lane's ref, and ADR-019 SHALL
  gain a dated addendum recording the landing and its measurement.
- **A POSITIVE CONTROL**: in a scratch drill the executor SHALL cut one
  pinned sentence, show the reader that owns it RED by name, and restore
  it with the restoration proved by sha256 — so "every reader still
  passes" is a discrimination and not a constant.
- THE method version stamp line SHALL be byte-identical before and
  after, and the DOCS GATE's printed spelling SHALL remain character for
  character the string `tools/e2e/scripts/docs-gate.mjs`'s header prints.
- Verification: headless — the four suites, the docs gate on the diff,
  `npm run lint:docs`, and `npm run health` read for the CONVENTIONS
  headroom band.
- **Ceremony L**: this section is the planning pass; executor, then an
  independent verifier, then the integrator.

## Read beside

ADR-019 and docs/rooms/governing-docs.md (the contract), the record
docs/checkpoints/2026-08-27-adr019-compaction.md (the first landing,
whose shape this repeats), T-162 (the re-landing and its addendum),
T-146 (why a mechanism belongs in a governing document and an instance
in a record), T-111-s12 (a column-zero `- ` inside a bullet splits it
silently — the executor's own hazard while cutting), and
docs/rooms/loop-efficiency.md item 1.
