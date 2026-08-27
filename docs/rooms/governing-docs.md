# Room: what may the governing documents contain, and who keeps each sentence true? (resolved 2026-08-27)

Opened 2026-08-27 at @human's direction, after a review of the four
read-first documents against the question below. Amended the same day
after the architect session's review — the dated section before "What
this room does not decide" records what moved and why — and RULED the
same day by @human: see "The ruling" at the end. Ratified as ADR-019.

## The question, as the human asked it

> Is the content and form in them the most valuable and valuable
> information dense a orchestrator, executor, verifier and integrator
> sessions need to excell in their work? [...] ai work is the most
> efficient and produces the best quality when the session has just the
> information it needs and not less and not more than that.

and, on the follow-up:

> Plan a gold standard model for how to upkeep these files while
> development work moves forward.

## The measurement that opens it

Derived 2026-08-27 with `wc -c docs/{STATE,ROADMAP,ARCHITECTURE,CONVENTIONS}.md`
— re-derive at your own ref:

    STATE.md          67,772 bytes
    ROADMAP.md        81,470
    ARCHITECTURE.md  133,682
    CONVENTIONS.md    99,212
    total            382,136 bytes ≈ 153,000 tokens

Re-derived twice later the same day — once by the architect's review,
once independently — **384,201 bytes**, the two derivations
byte-identical: 2,065 bytes of growth inside the room's own first day,
the monotone-growth claim demonstrating itself.

ROADMAP's F-01 bullet recorded 364,118 bytes at `00e133a` and named it
"the number to argue against." The set consumes roughly three quarters
of a session's context window before the session reads its role file,
its card, or a line of code. Growth is structurally monotone: the T-101
precedent (correct in place, never delete) makes ROADMAP and
ARCHITECTURE append-only, and every checkpoint rewrites STATE larger.

The diagnosis, in one sentence: the four documents conflate WORKING
STATE a session must load with the project's EVIDENTIARY ARCHIVE, the
archive won, and the same merge story now appears three or four times
across the set (card, ROADMAP, ARCHITECTURE row, STATE) with copies
that can and do drift — CONVENTIONS ships a named instance of its own
internal contradiction ("SIX files ... where the LANE PROTOCOL bullet
below still says five").

## What the record already committed to

The proposal below invents almost nothing. Every mechanism in it is
already ratified or practiced somewhere in this repository:

- **"DERIVE IT, DO NOT QUOTE IT"** — stated dozens of times across the
  four documents; the docs record many instances of transcribed prose
  going stale and no instance of a gate going stale silently.
- **The signpost/authority split** (T-078, the four-walks table): where
  a bullet kept an authority pointer and dropped the transcription, it
  survived change untouched — "THE AUTHORITY COLUMN NEEDED NOTHING,"
  twice.
- **The stop-enumerating precedent** (T-086, the retracted "CLOSED AT
  TWO"): a list closed by prose is a defect, because prose is not what
  adds the next member.
- **"Keep the MECHANISM and stamp the INSTANCE"** — STATE's own remedy
  for live-environment facts, stated at the T-138 checkpoint.
- **One owner per rule** (T-057): a rule with two implementations is
  two chances to disagree. This room lifts it from code to prose.
- **Budgets with measured reasons** (T-139, `max_graph_bytes`): the
  direction proven by measurement, the value @human's.
- **Figures with a keeper** (T-091, the RANGE RULE + range-rule.spec.ts):
  a document whose printed figures a suite re-derives is the one kind
  of figure-bearing prose that does not decay.
- **Generation over narration** (T-138, @human's ruling): the
  product-shaped entry is a GENERATED document assembled from
  `tools/e2e/tests/` because nobody has to keep it true. `T-138-s1` is
  the card; `docs/CAPABILITIES.md` is its named output.
- **STATE compaction already routed** (`T-133-s2`): dropping the
  sections `brief.mjs --state` can answer is already a card.
- **The reading list stays** (T-138, @human's ruling): the four names
  are frozen; this room is about their interiors, which that ruling
  does not foreclose — F-01 frames the byte count as the number to
  argue against.
- **The succession rule**: if it isn't in this folder, it didn't
  happen — which is why the archive must live in files, and why this
  room carries its whole proposal rather than citing a chat.
- **Rediscovery is already on the board** (`T-146`, "the record has
  outgrown reading and rediscovery is now cheaper than retrieval"): a
  card naming this room's problem independently. Convergent evidence;
  phase dispatch checks coordination with whatever T-146 routes.
- **The archive is already drifting inside the document the precedent
  governs** (architect's review): ARCHITECTURE's T-101 entry carries a
  disclosure that "still routes to the removed T-101-s1 — a stale
  disclosure of a closed defect" (`T-113-s1`).

## The proposal

### 1. Three kinds of fact, three keepers

Every sentence in a governing document is one of three kinds, and the
kind decides where it lives:

| kind | what it is | keeper | home |
|---|---|---|---|
| RULE | how to work: constraints, procedures, traps | version + gates | CONVENTIONS, method/ |
| TRUTH | what is true now: counts, lanes, statuses | a program, re-run | derive commands; generated docs with a currency check |
| RECORD | what happened, stamped at a ref | immutability | cards, docs/checkpoints/, ADRs, git history |

The four living documents carry RULES and pointers to TRUTH-derivers.
RECORDS never enter them. Living documents are REPLACED; records are
APPENDED; never the other way around. That single allocation rule is
what bounds the growth.

### 2. Document contracts

Budget values are sub-question 1, @human's; the shape is the proposal.

- **STATE.md** — what is happening right now. Regenerated whole from a
  template at every checkpoint under a gate-enforced byte budget
  (proposed ≤ 12 KB). Holds: status headline (nothing broken /
  designed exits), live-lane derive commands with the last stamped
  reading, the dispatch queue's top items, the standing hazards a
  session will hit this week, and a pointer to the current checkpoint
  record. Absorbs `T-133-s2`.
- **ROADMAP.md** (≤ 24 KB) — what the app DOES and what's next.
  Present-tense backbone: one paragraph per feature (capability now +
  next step + card ids). Milestones: goal, derived status line, task
  pointer. Links to generated `docs/CAPABILITIES.md`. At a merge it
  gains at most one sentence per feature ("Since T-NNN: ..."); the
  story lives on the card's Integration section, which already exists.
- **ARCHITECTURE.md** (≤ 20 KB) — which components exist. System map;
  component rows ≤ 3 lines pointing into
  `docs/architecture/components/C-*.md`; the touch_slugs authority
  rule; interface rules one paragraph each with card cites; decisions
  index. Touched only when an interface moves.
- **CONVENTIONS.md** (≤ 48 KB) — how to work here. Every current rule,
  compressed to rule / why (≤ 2 sentences) / authority (the gate or
  test that enforces it) / provenance (card ids). Machine-read spans
  keep their parsed shape: the Build & test bullets
  (workflow-parity.spec.ts), the method stamp (kit.rs), and the RANGE
  RULE figures (range-rule.spec.ts), which are tier-TRUTH with a real
  keeper and stay.
- **docs/CAPABILITIES.md** (new, generated) — what a user can do,
  exactly; `T-138-s1`'s output, regenerated when owed, with a
  `--check` currency mode on the `index --check` pattern.
- **docs/checkpoints/** (new, append-only) — one stamped file per
  integration holding everything today's STATE narrative holds:
  ranges, gates, suites, run ledger, board deltas, what the brief got
  wrong, environment anomalies. Written once, never edited, and read
  by no suite ever — by rule, so records stay out of the DOCS GATE's
  reader census by construction.

### 3. The six laws of writing

1. **One home per fact.** Write it where its question lives; cite it
   everywhere else.
2. **A figure needs a keeper.** Transcribe a number only if a program
   re-derives it, a generator with a currency check emits it, or it is
   ref-stamped in an immutable record. Otherwise write the derive
   command, never the number.
3. **Living docs are replaced; records are appended.** In the four
   documents, the current sentence replaces the stale one and cites
   the card that holds the story. The T-101 correct-in-place precedent
   is SCOPED to immutable records, where it remains in full force.
   This scoping is the ADR's central ruling.
4. **The lesson once.** A recurring pattern earns one rule, its first
   card, and one worked example; further instances are stamped in
   checkpoint records, never accumulated in the doc.
5. **Emphasis is a budget.** Bold capitals only for live traps that
   cost a session an hour or more.
6. **Every doc edit runs the DOCS GATE** on its diff and the suites it
   names — already the rule; restated because compaction diffs are
   exactly the diffs that owe it.

### 4. The upkeep loop

- Executor and verifier: card notes and verdicts, never the four
  (unless a card's fence names one).
- Integrator, at checkpoint, in order: (1) write
  `docs/checkpoints/<date>-T-NNN.md`; (2) regenerate STATE from the
  template, budget-gated; (3) tick ROADMAP with derived status lines,
  one sentence per feature max; (4) ARCHITECTURE only if an interface
  moved — row stamp plus one line, account in the component file;
  (5) CONVENTIONS never at a checkpoint; (6) regenerate CAPABILITIES
  if its check says owed.
- Architect / triage: ROADMAP backbone and CONVENTIONS rule changes,
  via cards at their seats.
- @human: this ADR, the budget values, the reading list.
- Reading protocol: adapter → role file → the four (read in full at
  ~30k tokens) → the card → derive commands for anything live. Each
  role file gains one line naming its load-bearing sections.

### 5. Migration phases (each a fenced card; lane state derived at dispatch)

0. This room → the ADR (@human).
1. Create `docs/checkpoints/` + template; backfill the current
   STATE.md narrative verbatim as the first record, so nothing is lost
   before anything is cut. Fence `[docs/checkpoints/]` — the backfill
   READS STATE.md and writes nothing outside the new directory, so no
   lane holds a file every checkpoint rewrites (architect's review).
2. Land `T-138-s1` (re-scoped per the T-138 checkpoint: 194 is
   derivable from source; honest omissions NAMED) — the replacement
   must exist before ROADMAP narrative is removed.
3. STATE compaction, absorbing `T-133-s2`. The lane delivers the
   TEMPLATE and the budget gate in `lint:docs` — fence `[the
   template's ruled home, tools/e2e]` — and the CUTOVER, the first
   regeneration of docs/STATE.md itself, is performed by the next
   merge's own checkpoint: the seat that already rewrites STATE
   outside any fence. No lane ever holds `docs/STATE.md`; a lane that
   did would make every other card's checkpoint a second-writer
   violation (architect's review; the mechanism, not the tally — see
   the review section below).
4. ROADMAP compaction; pre-compaction text permanently reachable at
   `git show <ref>:docs/ROADMAP.md`, ref recorded in the ADR and the
   card — a loud, ruled deletion, not a silent one. Its traceability
   table pre-enumerates the T-101-justified passages, derived with
   `git grep -n "T-101" docs/ROADMAP.md` at dispatch.
5. CONVENTIONS compaction, absorbing the queued seat edits (`T-092`,
   `T-093`, `T-127-s5`, the stale unbuilt-app denominators). The
   co-move list is workflow-parity.spec.ts, range-rule.spec.ts AND
   `tools/e2e/scripts/dispatch-brief.mjs` (architect's review,
   verified at source: `laneSpellings` at :517, opener-text lookups
   on THE LANE PROTOCOL, DISPATCH FROM THE LAST CHECKPOINT,
   Fresh-clone ORDER and PORT RULE:, three column-0 bullet splits).
   Law 2 binds the exit: the four looked-up bullets end the phase
   under a real keeper — a pinned parsed-shape test, or the lane
   spellings moved to one structured source both the doc and the
   script read (T-057). Which arms fail silent is measured in the
   card, not assumed: the PORT RULE arm already discloses loudly
   (:1504). `docs-scan.mjs` owns `conventionsText()` (:2608), so the
   four spec readers share one read. Fence
   `[docs/CONVENTIONS.md, tools/e2e]`.
6. ARCHITECTURE compaction, deliberately LAST of the document cuts
   (architect's review): the deepest cut, the document T-101 leans on
   most, and by now several checkpoints under the new model will have
   exercised the citation pattern. Component files are C-06-parsed,
   so the parser suite and both dogfood fixtures watch it. Its
   traceability table pre-enumerates the T-101-justified passages.
7. Propagate to method/: `roles/integrator.md` checkpoint sequence,
   the docs-protocol file below, the adapter templates — the T-145
   lesson, fix the template. Rides the version-bump rule (three-file
   commit, third file `kit.rs`), coordinated with `T-138-s2`'s
   pending 0.1.7.

### 6. Verification discipline for every compaction card

Census (`docs-gate.mjs --census`) before and after; a traceability
table where every removed block names its destination — a card id, a
checkpoint record, a derive command, or "retired: derivable" — and a
block with no destination is a rejection; all owed suites green; and a
keeper drill: mutate one retained figure that claims a keeper and
watch the keeper red. Any phase that reads as "less rigor" was
executed wrong and should be rejected at verification — the model
relocates rigor, it does not dilute it.

## Draft ADR text (moves to docs/decisions/ at ratification)

Number at ratification: STATE records ADR-018 as owed to T-135 Half B,
so this likely lands as 019 — do not collide.

> # ADR-0NN: governing documents carry rules and pointers; records are
> immutable and live elsewhere
>
> Status: proposed. Date: ratification date. Decider: @human.
>
> **Decision.** Every sentence in docs/STATE.md, docs/ROADMAP.md,
> docs/ARCHITECTURE.md and docs/CONVENTIONS.md is a RULE, a TRUTH or a
> RECORD, per docs/rooms/governing-docs.md §1. The four documents
> carry rules and truth-derivers only; records live in cards,
> docs/checkpoints/ and ADRs. Living documents are replaced under
> byte budgets; records are appended and never edited.
>
> **Scope of the T-101 precedent.** "Corrected in place with the ref
> rather than deleted" governs IMMUTABLE RECORDS (cards, checkpoint
> records, ADRs, room resolutions), where it remains in full force. In
> the four living documents the current sentence replaces the stale
> one and cites the card or record that holds the history; the
> pre-replacement text remains reachable in git history at the ref the
> replacing commit names.
>
> **Transition.** Passages already corrected in place under the
> practiced precedent remain valid records of their moment until the
> phase that compacts their document reaches them; each is then
> re-justified, moved or retired in that card's traceability table.
> There is no window in which live text cites a precedent that no
> longer licenses it.
>
> **Budgets.** STATE ≤ NN KB (hard, gate-enforced in lint:docs);
> ROADMAP ≤ NN KB, ARCHITECTURE ≤ NN KB, CONVENTIONS ≤ NN KB (warn).
> Values are @human's and revisable by ADR addendum with a measured
> reason, on the T-139 pattern.
>
> **Records.** docs/checkpoints/ holds one append-only file per
> integration. No suite, gate or generator may ever read
> docs/checkpoints/ — records must stay out of the DOCS GATE's reader
> census by construction.
>
> **Reading list.** Unchanged (T-138's ruling stands): the adapter
> names the same four documents plus docs/CAPABILITIES.md when it
> lands.
>
> **Supersedes / amends.** Amends the practiced T-101 precedent as
> scoped above. Does not amend ADR-001..017.

## Draft method/docs-protocol.md sketch (generic; lands at phase 7)

Written product-agnostic on the lane-protocol.md pattern — generic
rules here, every name left to the project:

> # Docs protocol
>
> 1. A project's governing documents (its state, roadmap, architecture
>    and conventions files, however named) carry RULES and pointers to
>    TRUTH-derivers. RECORDS — what happened, stamped — live in task
>    cards, checkpoint records and decision records, and never in the
>    governing documents.
> 2. A figure appears in a governing document only with a keeper: a
>    program that re-derives it, a generator with a currency check, or
>    a ref stamp in an immutable record. Otherwise the document carries
>    the derive command.
> 3. Governing documents are replaced; records are appended. A stale
>    sentence in a governing document is replaced by the current one
>    plus a citation; correction-in-place with history preserved is the
>    rule for records.
> 4. The state document is regenerated from a template at every
>    checkpoint under a byte budget the project declares and a gate
>    enforces. The checkpoint's narrative goes to an append-only
>    checkpoint record that no suite reads.
> 5. A recurring lesson earns one rule, one provenance citation and one
>    worked example in a governing document; instances accumulate in
>    checkpoint records only.
> 6. Each role's file names the governing-document sections that role
>    reads first.

## Sub-questions for @human's ruling

1. **Budget values.** Proposed 12 / 24 / 20 / 48 KB (STATE hard, rest
   warn). Direction and ceiling argued above; the values are a
   judgment the evidence does not select. The architect's review flags
   ARCHITECTURE's 20 KB — an 85% cut — as the value most likely to be
   wrong; provisional, revisable by ADR addendum with a measured
   reason.
2. **Record home.** docs/checkpoints/ files (recommended — the
   succession rule favors files, and they are greppable) versus
   checkpoint commit messages only (current partial practice; the
   commit message keeps its summary role either way).
3. **RANGE RULE disposition.** Keep the spec-kept figures whole
   (recommended — it is the model's tier-TRUTH exemplar) and move only
   the unguarded 31-merge scoreboard narrative to T-083's card, or
   leave the bullet entirely as is.
4. **Where Law 3's scoping is written.** Revised after the architect's
   review, which cited T-146's finding that a rule living only in a
   record nobody re-reads gets rediscovered wrong. The split now
   proposed: the GENERIC law already sits in the docs-protocol
   sketch's rule 3, which is method text every future project's
   sessions read; the NAMED amendment ("this scopes the practiced
   T-101 precedent") lives in the ADR alone, because method/ is
   generic and a card id does not belong in it (the first gotcha).
   Ruling sought on that split.

## The architect's review (2026-08-27), and what it changed here

Reviewed at @human's direction; findings verified independently at the
source before being folded in. What moved:

- **Phase 5's co-move list gains `dispatch-brief.mjs`** (blocking):
  it parses CONVENTIONS structurally — opener-text bullet lookups and
  column-0 bullet splits — so the rule/why/authority/provenance
  reformat would break the tool that assembles every dispatch brief.
  One nuance kept honest: the failure is not uniformly silent — the
  PORT RULE arm discloses loudly by name (:1504); which arms fail
  silent is measured in the card, not assumed.
- **No lane ever holds `docs/STATE.md`** (blocking): phases 1 and 3
  reshaped above. The review's tally — "15 of the last 15
  first-parent commits" — did not reproduce: measured 4 of 15, the
  window holding card filings, a triage and this room's own commit.
  The finding survives its tally: every CHECKPOINT rewrites STATE, so
  a held STATE fence makes every checkpoint a second-writer
  violation. Cite the shape, not the tally — the project's own rule,
  applied to its own review.
- **ARCHITECTURE compacts last** of the document cuts; its 20 KB
  budget is flagged provisional.
- **The draft ADR gains the Transition clause**: rescoping T-101
  touches the stated rationale of the passages that cite it (measured
  14 raw mentions in ARCHITECTURE, 5 in ROADMAP; precedent-phrase
  counts differ by counting rule and the shape, not the tally, is the
  finding). Phases 4 and 6 pre-enumerate those passages.
- **Sub-question 4 reworded** as the generic-law / named-amendment
  split.
- **`T-146` added to the evidence**: the board already carries a card
  naming this room's problem.

## What this room does not decide

No document is edited by this room. No card is re-scoped. The T-101
precedent stands unmodified until the ADR lands. Phases 1–7 dispatch
only after the ruling, each as its own fenced card, with lane state
derived at dispatch — never from this file.

## The ruling (@human, 2026-08-27)

All four sub-questions ruled as recommended, with sub-question 1 in
the revised shape reached after @human pressed on the too-narrow risk:

1. **Budgets are TARGETS, not gates.** 12 / 24 / 20 / 48 KB are what
   the compaction cards aim at (overshoot up to ~25% acceptable,
   argued in the card). Gate values are DERIVED at each document's
   compaction landing — warn at landed size × 1.25, fail at landed
   size × 1.5 — and recorded by ADR addendum with the measurement,
   the max_graph_bytes pattern. Nothing can hard-fail until a
   compacted document exists to measure. The budget is a tripwire
   against relapse, not the instrument of the cut.
2. **Records live in docs/checkpoints/ files**, append-only, written
   before STATE is regenerated; the commit message keeps its summary
   role.
3. **The RANGE RULE keeps its spec-kept figures whole** — tier-TRUTH
   with a real keeper — and only the unguarded 31-merge scoreboard
   narrative moves to T-083's card at phase 5.
4. **The split**: the generic law lives in method/docs-protocol.md
   rule 3 (phase 7); the named T-101 amendment lives in the ADR
   alone.

Ratified as **ADR-019**,
`docs/decisions/019-governing-docs-rules-truths-records.md` — 018
stays reserved for T-135 Half B, so the numbering gap is deliberate.

**Phase 1 was executed at @human's direction in the same session**:
`docs/checkpoints/` exists with `TEMPLATE.md` and the verbatim
backfill of docs/STATE.md at `9d09a07` (69,837 bytes) — nothing was
cut before it was preserved. One honest correction to this room's own
§2, discovered on the way: "read by no suite, ever" is achievable as
NO DEPENDENCY, not as no walk — the two e2e specs that walk all of
docs/ walk these files as app content by construction, and ADR-019's
Records clause states the boundary precisely.

**Phase 2 needs no new card**: `T-138-s1` already exists and its
re-scope is on the record (STATE's Next up and this room §5);
dispatching it is the architect's. **Phases 3–7 dispatch as fenced
cards per §5**, each citing this room and ADR-019.
