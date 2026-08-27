# Room: what may the governing documents contain, and who keeps each sentence true? (OPEN)

Opened 2026-08-27 at @human's direction, after a review of the four
read-first documents against the question below. Awaiting @human's
ruling on the proposal and the four sub-questions at the end. This room
takes no disposition: no document is edited, no precedent is changed and
no card is re-scoped until the ruling lands.

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
   before anything is cut. Fence `[docs/checkpoints/, docs/STATE.md]`.
2. Land `T-138-s1` (re-scoped per the T-138 checkpoint: 194 is
   derivable from source; honest omissions NAMED) — the replacement
   must exist before ROADMAP narrative is removed.
3. STATE compaction, absorbing `T-133-s2`; add the budget gate to
   `lint:docs`. Fence `[docs/STATE.md, tools/e2e]`.
4. ROADMAP compaction; pre-compaction text permanently reachable at
   `git show <ref>:docs/ROADMAP.md`, ref recorded in the ADR and the
   card — a loud, ruled deletion, not a silent one.
5. ARCHITECTURE compaction; component files are C-06-parsed, so the
   parser suite and both dogfood fixtures watch it.
6. CONVENTIONS compaction, absorbing the queued seat edits (`T-092`,
   `T-093`, `T-127-s5`, the stale unbuilt-app denominators);
   workflow-parity and range-rule specs co-move if their parsed shapes
   change. Fence `[docs/CONVENTIONS.md, tools/e2e]`.
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
   judgment the evidence does not select.
2. **Record home.** docs/checkpoints/ files (recommended — the
   succession rule favors files, and they are greppable) versus
   checkpoint commit messages only (current partial practice; the
   commit message keeps its summary role either way).
3. **RANGE RULE disposition.** Keep the spec-kept figures whole
   (recommended — it is the model's tier-TRUTH exemplar) and move only
   the unguarded 31-merge scoreboard narrative to T-083's card, or
   leave the bullet entirely as is.
4. **Where Law 3's scoping is written.** Only in the ADR (recommended
   — the precedent was practice, not method text), or also as a
   sentence in method/.

## What this room does not decide

No document is edited by this room. No card is re-scoped. The T-101
precedent stands unmodified until the ADR lands. Phases 1–7 dispatch
only after the ruling, each as its own fenced card, with lane state
derived at dispatch — never from this file.
