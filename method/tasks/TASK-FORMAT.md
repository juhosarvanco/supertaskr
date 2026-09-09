# Task file format

One file per task: `docs/tasks/T-NNN-slug.md`. The story map, the dispatch
order, and the model assignment are all pure functions of this frontmatter —
no layout or state is stored anywhere else.

```yaml
---
id: T-016
title: Audit log
feature: F-03            # story map column
milestone: 2             # above/below the slice line
priority: 2              # position in column; 1 = top = next
size: M                  # S | M | L — sets the ceremony tier
status: planned          # suggested | planned | building | verifying |
                         # rejected | merging | done | parked
blocked_by: [T-015]
wake:                    # PARKED cards only: the event that brings this card
                         # back, in a field instead of only in prose. Its three
                         # forms and its default are under "Triage encoding".
touches: [C-03, src/egress/]   # expected blast radius; orchestrator never
                               # parallelizes tasks with overlapping touches
suggested_by:            # role, model@session, or human — set on suggestions;
                         # kept after promotion for attribution
builder:                 # model[@session]; empty = supertaskr.yaml default
verifier:                # model[@session]; empty = default (independent)
built_by:                # stamped on completion, e.g. codex/gpt-5.2 @S3
verified_by:             # stamped, e.g. claude-fable-5 @fresh
review: independent      # independent | same-model | self-verified (stamped)
---
```

## Body sections

```
## Acceptance criteria     EARS notation (see interview/decomposition.md);
                           each line enforceable by a test
## Implementation notes    appended by the executor before it dies
## Verdicts                appended by the verifier, one dated entry per pass:
                           APPROVED, or REJECTED + concrete failures
```

**A CARD'S FIRST PARAGRAPH IS ITS SUMMARY — one paragraph a seat may
read and STOP at**, and everything below it is the RECORD, read when a
seat needs the world rather than the ask. No field and no status carries
this: it is a writing discipline, and it costs one paragraph at the top
of the body, above the sections. **The record stays**, because on a
project run this way the record IS the product's proof and the pressure
to shorten a card is pressure to delete evidence. What the summary buys
is the DECISION to read the rest: cards grow into essays, a reader
arrives cold, and without a top paragraph the only way to learn whether
this card is the one you need is to read all of it. Measured on this
method's own project, where a single card reached 36 KB and the seats
reading it had no way to triage that cost.

**A CARD MAY ASK FOR ONE OF ITS SENTENCES TO BE CHECKED, AND THE ASK IS
A PLAIN BODY LINE.** The marker is

    CARD CLAIM (<tracked file>): "<quoted string>"

written as an ordinary line of the body — a leading list bullet and
surrounding emphasis are fine — and a project's card-input check opens
that ONE file at the integration ref and requires the quoted run to be
in it. **THE MARKER IS THE REQUEST, WHICH IS WHY THIS CHECK MAY
REFUSE**: a card's structural checks are automatic and must be measured
narrow before they refuse anything, while nobody is refused an ask they
wrote themselves — so a quote that is not in the file it names REFUSES
the dispatch, and so does a marker whose named source cannot be read at
all, because a card that asks to be checked, is not, and reads as though
it were is the worse outcome. **IT IS READ FROM THE PROSE, SO A MARKER
INSIDE A FENCED OR INDENTED BLOCK IS AN EXAMPLE AND NOT A CLAIM** —
including the one above. That is the whole reason the reader is narrow:
this marker gets quoted constantly, by the notes documenting it and by
every room arguing about it, and a reader that saw raw blocks would turn
documentation ABOUT the marker into live claims; a marker-shaped line
the prose reader cannot see is REPORTED, never refused on. **It is the
cheap shape deliberately** — a quoted string plus the file it claims to
be in, never a parse of prose — and what it does not reach is every
claim nobody chose to mark. Which tool reads it, and at which ref, are
the PROJECT's to name in its own conventions; this file names no paths.

**A CRITERION NAMES THE GATE'S COMMAND, NEVER ITS OUTPUT.** Write *"the
gate SHALL report no unaccounted readers"*, or better, write the command
and let it answer — never *"the gate SHALL name five readers across three
suites"*. **A count in an acceptance criterion is a line number by
another name**: it is a fact about the tree at the moment the card was
written, it goes stale under other people's merges exactly the way a line
number does, and it goes stale WHILE THE CARD SITS IN THE QUEUE, which is
the part that surprises people. A card whose criterion transcribed a
derived census was dispatched with a figure already wrong in both of its
dimensions; the executor's choice was then between building to a false
number and disobeying the spec, and neither is a thing a criterion should
force. If the number matters, make the criterion say *derive it and
report it* — the executor re-derives at its own ref either way
(interview/decomposition.md, self-review), so the count in the card was
never the thing being enforced.

This is the general rule behind the ban words in the decomposition step:
a criterion must be **checkable at the moment it is read**, and a
transcribed measurement is checkable only against a tree that has moved.
Discipline, not a gate — nothing can tell a live figure from a stale one
without re-running the thing that produced it, which is precisely why the
criterion should name that thing.

**A CRITERION MAY NOT ORDER WORK OUTSIDE ITS OWN CARD'S `touches:`.**
The reader's half of this is already unconditional and lives in
`roles/executor.md`: a criterion that cannot be built inside the fence is
not built, it is recorded and routed. **Nothing bound the seat WRITING
the criterion**, so the entire burden of refusal sat on the lane — the
card said do it, the fence said do not, and the executor had to disobey
its own spec in order to obey the protocol. **A card whose criterion and
whose fence disagree is a DEFECTIVE CARD, not a hard call for the lane.**
So: test every criterion against `touches:` as you write it, and where
one needs a path the fence does not carry, **either widen the fence
BEFORE dispatch — which is this seat's to do and no lane's — or write the
criterion as a ROUTE**: *IF this path is outside the fence THEN record it,
route it as a suggestion naming the fence it needs, and say so.* That is a
criterion a lane can satisfy exactly instead of approximately, and it
keeps the finding rather than losing it.

**AND "BEFORE DISPATCH" IS NO LONGER THE ONLY MOMENT: THE FIELD HAS A
MID-FLIGHT ARM, AND IT IS THE SAME ACT RATHER THAN A LOOSER ONE.** A
LIVE lane's `touches:` may be widened while that lane builds, and the
widening is the dispatch step performed again — **an amendment to this
field COMMITTED ON THE INTEGRATION BRANCH, plus a re-expansion of that
lane's fence, which refuses the whole act unless the widened fence is
disjoint from every other live lane.** Never a chat grant, never a
reply, and never a hand-edited fence manifest. The amendment has to
reach the integration branch because that is the copy a landing check
reads and the copy the expansion is made from — **and it has to reach
the lane's own working copy as well, because the guard at the write
reads the card from the checkout the write lands in.** A widening
delivered to one of those readers and not the other does not merely
fail to grant: it refuses the paths the lane ALREADY held. The
mechanics, the read-back that constitutes the grant, and that
measurement are `lane-protocol.md`'s fast path A; **this clause is the
FIELD's half** — that `touches:` moves at all while a lane holds it,
that moving it is this seat's act and no lane's, and that the two
copies are one amendment rather than two edits.
**A LANE'S OWN FILE STAYING OUTSIDE EVERY FENCE IS NOT A LICENCE TO
MOVE THIS FIELD FROM INSIDE THE LANE.** A lane may write to its own
card — that is how its stamps and its notes are performable at all —
and this field is the one line on it the lane never writes, for the
reason the whole single-writer rule exists. **It is also the edit that
would not help, and the reason has to cover BOTH moments a guard looks,
because they do not read the same copy.** At the WRITE, the fence in
force is the one the granting seat already expanded, and the lane's
copy of this line is consulted only as a STAMP — a check that the card
has not moved under that expansion. At the LANDING, the fence is
expanded FRESH from the card as committed on the INTEGRATION BRANCH,
which is a copy the lane is not the writer of. So an edit here widens
nothing at either moment, and all it can move is a guard's ability to
tell a real grant from a half-delivered one. **Giving only the
write-time half would generalise one guard's mechanism to a moment it
does not govern** — the conclusion would survive and the reason would
not, which is the shape of a rule that stays right until somebody
reasons from it.

**WHY THE CLAUSE IS HERE AND NOT IN THE EXECUTOR'S FILE.** Putting it
there would be a third sentence telling the reader to refuse, in a file
that already says so twice, and it would reproduce the very defect it
fixes — the rule was never missing from the reader's side.
**Recorded with attribution, because an unattributed rule reads as
advice**: on this method's own project a card written by the ARCHITECT
ordered a deletion outside its own fence, the lane performed it on the
card's authority, and the verifier ruled that an existing rule had been
violated rather than that the method had left a question open. **The card
was the defect.** A criterion-shaped exception cannot be granted, either,
and the reasoning is worth keeping: *every* out-of-fence edit is made
because some criterion seemed to want it, so an exception for criteria
nullifies the fence entirely.

## Session syntax

`codex` = default session policy (fresh) · `codex@fresh` = explicit fresh ·
`codex@S3` = resume registered session S3. Verifier may be any model or
session, including the builder's — the `review:` field records which
guarantee actually held, so the board can render self-verified checks
differently from independent ones.

**THE INDEPENDENCE THAT PAYS IS INFORMATIONAL, NOT MODEL DIVERSITY.**
What a verification rests on is **informational independence**: read
`review:` as PROVENANCE — which hand held the pen — and not as a
strength ranking. The guarantee a verification actually rests on is the
INFORMATIONAL CONSTRAINT in `roles/verifier.md`: the verifier receives
only the card and the diff, **never the executor's reasoning**, and is
adversarial by design. That blindness is what catches the failure a
builder cannot catch, because the failure a builder cannot catch is
almost always a SHARED ASSUMPTION — and an assumption is shared through
the reasoning, not through the weights.

So **`same-model` is not a weaker verdict than `independent`**; it is the
same blindness with a different provenance, and the sharpest rejections a
pipeline records are routinely same-model. Two consequences follow, and
they are the reason this paragraph exists:

- **Do not buy diversity instead of blindness.** Swapping the model while
  handing the verifier the executor's notes, its rationale, or a summary
  of what it "actually did" spends the expensive half and throws away the
  cheap half that was doing the work.
- **`self-verified` is the one value that names a MISSING guarantee**,
  because there the informational constraint was never applied at all —
  the builder read its own reasoning by construction. That is a real
  weakening and the ceremony table above is where it gets priced.

**NO NEW VALUE.** The three `review:` values are unchanged; this is what
they have always meant, written down. Discipline, not a gate: nothing can
verify that a verifier stayed blind — the field records a claim about how
the pass was run, and only the role's own procedure makes it true.

**A GUARD-CLASS CARD REQUIRES `review: independent`, AND THE FIELD IS
SET AT DISPATCH.** Where the card's SUBJECT is a guard — a hook, a gate,
a keeper, a lint, a permission check, a security control, anything whose
job is to REFUSE — the default is not good enough and the reason is not
a doubt about any model: **the builder of a cage is not its inspector.**
A guard is the one artifact whose author's mental model IS the thing
under test. Every ordinary defect shows up as something failing; a
guard's characteristic defect shows up as nothing happening, which is
also what success looks like, and the person best placed to mistake one
for the other is the person who decided what the guard should notice.
**This is the paragraph above applied rather than contradicted**: the
guarantee is still informational blindness, and `independent` is
required here because a guard's specification lives so far inside its
author's head that the card alone under-determines it more than usual.
**Ask what the card is ABOUT, not what it touches.** A card that adds a
feature behind an existing guard is not a guard card; a card that
changes what the guard refuses is one, however small its diff. **And the
ordinary companion applies with full force — a guard owes a POSITIVE
CONTROL**: prove it lets the ordinary case through, not only that it
stops the bad one. A check that cannot tell an absence from a refusal is
not a check.

**AND THE CONTROL IS DEMONSTRATED FAILING, NOT ASSERTED.** Run it
against an implementation that LACKS the property, SEE it red, and
RECORD that demonstration on the card — a control nobody has watched
fail is a claim, and it is the characteristic defect of this very
requirement. **Where ONE arrangement decides both the guard's answer and
the control's, that is a defect, named as one by whoever notices, and
the remedy is to evaluate the control where that arrangement is ABSENT**
— a fresh clone, a planted fixture, a data mutant; where the property
lives in DATA the drill owes a DATA mutant, because a code-only drill
mis-grades a derivation guard by construction. **Measured, because a
rule stated without its measurement reads as advice**: four in one
sitting on this method's own project, in four modules, found by four
different agents, every one of them guard-class, mutant-drilled and
read by a blind verifier — and the fourth was a control a VERIFIER had
proposed, inside the fix for the third. The four are cited by id and
judged in `roles/verifier.md` step 2b, which is this rule's home for
the drill mechanics. **A rule this strong owes its own control, and the
control is a body it PASSES**: one that graded every existing control
degenerate would be indistinguishable from one that works.

## Task creation — single writer

Only the ARCHITECT (planner/orchestrator role) creates tasks with
status: planned. This is where plan coherence lives: one gatekeeper
applies the decomposition rules, so a card on the board always means
the same thing.

Everyone else suggests. A suggestion is a minimal file:
status: suggested, title, one paragraph of context, suggested_by.
Suggested cards are NOT in the queue — the dashboard renders them as
ghosts (dashed) at the bottom of their feature column.

**SEARCH BEFORE FILING, AND A SECOND INSTANCE IS A CORROBORATION RATHER
THAN A CARD.** Before writing a suggestion, look for a card that already
owns its CLASS. IF one exists THEN the finding is a CORROBORATION: it
appends a dated evidence line to that card — what you saw, where, and at
which ref — and no sibling file is created. **A second instance is worth
more attached to the first than filed beside it**, because the pair is
the evidence that the class is real, and two files describing one class
are two triage decisions that can disagree. A corroboration is a RECORD
and is appended, never rewritten over what is there.
**EVERY NEW SUGGESTION NAMES ITS CLASS PARENT IF ONE EXISTS, AND CARRIES
A ONE-LINE DISPOSITION HINT.** The parent is a card id; the hint is the
filer's own sentence about what should happen to this — promote, park
behind X, probably a duplicate of Y, needs a ruling from a human. **The
filer knows this and the triage seat does not**, because the filer has
just spent a lane inside the problem while triage arrives cold, weeks
later, to a title. The hint is advisory and triage overrules it freely;
it costs one line and it is the difference between triaging a finding
and reconstructing one.
**THIS IS THE HALF THAT KEEPS THE BOARD METABOLISING.** A suggestion
corpus grows faster than any triage sitting can drain it, and the
failure is not volume but ILLEGIBILITY: undated instances of one class
scattered across a dozen files, each needing its world rebuilt before it
can be judged. Corroboration collapses the class into one card; the hint
carries the world with the finding; and triage-at-the-stamp
(roles/orchestrator.md) keeps the distance between a finding and its
disposition to one dispatch cycle.

**A TITLE THAT OPENS WITH A SYMBOL IS QUOTED.** The frontmatter is YAML
and a plain scalar MAY NOT BEGIN with a reserved indicator, so a `title:`
followed immediately by a backtick, a quote, a bracket, a brace, `#`,
`&`, `*`, `!`, `|`, `>`, `%`, `@` or a lone `-` is a parse error and the
whole card stops existing. **This is the natural thing to write and that
is what makes it dangerous**: a convention's own prose names symbols in
backticks constantly, so the instinct that produces a good title produces
an unparseable one. **It fails silently in the worst available way** —
nothing errors, the board simply gets SHORTER, and the loss surfaces
later as an unrelated count being off by the number of cards that
vanished, several steps from the cause. Quote the title, or start it with
a word.
This one IS mechanically catchable and should be caught by the project's
card-input gate at the moment of writing, named as a YAML error against
the file that has it — not left to be inferred from a board that got
shorter. Which gate is the PROJECT's to name; this file names no paths.

**A PROPOSED REPLACEMENT CARRIES ITS MEASUREMENT, OR SAYS IT HAS NONE.**
A finding that catches something wrong will usually propose the prose to
put in its place, and **a finding is read as a unit** — an executor
working from the ask rather than re-deriving will adopt the remedy on the
strength of the diagnosis. The two halves are not equally evidenced: the
diagnosis is normally something the author MEASURED, and the remedy is
normally something the author WROTE. A remedy that is merely plausible
can replace one false sentence with a differently false one while
everybody believes the more rigorous arm was taken. So: **prose PROPOSED
as a replacement carries the command and the result that produced it, or
is explicitly MARKED UNVERIFIED.** Marking it costs a word and tells the
executor exactly which half it still has to earn. Discipline, not a gate
— no gate can tell measured prose from confident prose, which is the
whole reason the author has to say which it is.

- Executor mid-build: discovery BLOCKS your current task -> open a
  consultation room. It doesn't block -> file a suggestion and return
  to your task. A suggestion is never an excuse to expand scope.
- Verifier: non-blocking improvement ideas -> suggestions (replaces the
  earlier route-to-Parked rule; Parked remains for backbone-level ideas).
- Human: new FEATURES go to the architect (project room or directly),
  which runs a mini-interview (who is it for, what is observable when it
  works, what does it displace), adds it to the backbone, and runs a
  decomposition pass. New features land BELOW the current slice line
  unless the human explicitly bumps them — bumping means something else
  visibly moves down.

Architect triage (a duty of every architect session): promote (rewrite
through the FULL decomposition rules — the suggestion is raw material,
the rewrite makes it exact), park, or reject with one line of reasoning
left in the file. Nothing is silently deleted.

Triage encoding — how each outcome is written down, so the board and
the parser agree:

- Promoted: the planned task ABSORBS the suggestion — it lists the
  absorbed ids in its body (`Absorbs: T-001-s2, …`) and the suggestion
  file is removed in the same commit; the absorption line is the
  surviving record, so removal is not silent deletion.
- Parked: `status: parked` in place, still flat in the tasks dir.
  Placement fields stay optional, but `id:` becomes required — an
  id-less suggestion gains one when parked.
  **A PARKING NOTE CARRIES A RESURFACING CONDITION OR IT IS A REJECTION
  NOBODY WROTE DOWN.** The note is dated, says why the card is not being
  taken now, and NAMES THE EVENT that brings it back. The default event,
  where nothing better presents itself, is that the card's fence's
  component is NEXT DISPATCHED — which makes the condition checkable by
  whoever cuts that lane instead of by whoever remembers this card.
  **AND A RESURFACED CARD IS RE-DERIVED, NEVER TRUSTED**: a parking note
  is a finding stamped at a ref, so the seat that picks it up re-derives
  its needle at its own ref, and where the ask no longer holds it says
  so in writing and parks it back with a NEW condition. Parking twice
  with the same note is how a shelf forms.

  **AND THE CONDITION IS WRITTEN IN A FIELD, NOT ONLY IN PROSE, BECAUSE
  A PROSE CONDITION IS ONE NOBODY READS.** The rule above was written,
  obeyed and inert: measured on this method's own project on 2026-09-09,
  a hundred and twenty-nine parked cards carried thirty-nine prose
  conditions between them and NOT ONE was ever checked by anything, so a
  parked card resurfaced only when a human re-read the whole folder —
  which happened once, in an amnesty, for a hundred and forty cards. The
  encoding is one optional frontmatter key:

      wake: T-014        # a CARD: holds once that card's status is done
      wake: 2026-11-01   # an ISO DATE: holds once the clock reaches that day
      wake: fence        # THE DEFAULT: holds once a lane is dispatched whose
                         # expanded fence overlaps this card's own touches:

  **THE DEFAULT IS THE FENCE AND AN ABSENT FIELD MEANS IT** — that is the
  paragraph above, spelled as a value, so a card that says nothing still
  has the condition that paragraph gives it. The prose note STAYS: the
  field is the machine-readable half of the same sentence, never a
  replacement for the human-readable one, and a note explaining WHY is
  not derivable from a value.

  **EXISTING PARKED CARDS ARE NOT REWRITTEN FOR THIS.** Their prose
  conditions stand as written, and the field is added by the seat at the
  next triage that touches the card — a hundred-and-twenty-nine-card
  frontmatter sweep is a commit nobody can review, and it would restate
  in a field what its author already wrote in a sentence.

  **A CONDITION THE READER CANNOT PLACE IS REPORTED, NEVER DEFAULTED.**
  A `wake:` value that is neither a card id, nor a day on the calendar,
  nor the word `fence` — including the key written and left blank — is
  not the default: the author was reaching for something else, and
  answering `fence` would hide a half-written card behind a
  correct-looking answer.

  **AND A CARD WITH NEITHER THE FIELD NOR A PROSE CONDITION IS FLAGGED,
  WHICH IS THIS RULE'S ONLY ENFORCEMENT.** The prose test is deliberately
  narrow and is stated here so that an author and a reader are looking at
  one sentence: **a line of the card's BODY — never its frontmatter —
  carrying the word `unpark` or the word `wake`, case-insensitively,
  bounded on the left** (so `awake` is not a condition, and neither is
  the `parked` every parking note spells about itself; and `un-park`, the
  hyphenated spelling the amnesty triage's own `**UN-PARK WHEN:**` template
  writes on nine live parked cards, IS `unpark`). It is not a parse
  of the condition and must never become one; the machine-readable half
  is the FIELD. The flag is a count and a list of ids for a human to
  read — never a closure, never a status change, and the remedy is the
  field at the next triage that touches the card.
- Rejected: the file MOVES to `docs/tasks/rejected/`, keeping
  `status: rejected` plus a dated one-line reasoning. The task globs
  are deliberately flat, so nothing under rejected/ is a model input.

Rationale of record: on tasks `rejected` is a retriable lifecycle
state; on a triaged suggestion it is terminal — one status word must
not carry both meanings in one directory.

**THERE IS NO FOURTH MOVE, AND "RESOLVED BY OTHER WORK" IS NOT ONE.**
The question every verifier eventually asks in frontmatter is what to
write on a finding whose work somebody else has already done. The answer
is that this is a DISPOSITION, and **disposition belongs to triage** —
the same single-writer rule that governs every other placement field.
A discharged finding therefore **KEEPS `status: suggested`** and records
the discharge IN ITS OWN BODY, naming the commit that did it; triage then
makes one of the three moves above, normally promotion, which is what
"resolved by other work" already means once the resolving task can name
it. Recording the discharge is not the same act as disposing of it, and
only the second one is triage's.
**AND A DISCHARGE IS ARCHIVED AS A DISCHARGE, NOT AS A DECLINE.** When
triage does dispose of one and the file moves to the rejected archive,
the reasoning line SAYS which of the two happened: *discharged — the
work landed at `<commit>`* reads differently from *declined — we are not
doing this*, and only the first is a compliment to the finding. The
distinction is invisible in the status word, which is the same either
way, and it is the distinction a later reader actually needs: a
discharged finding is evidence the method works, and filing it under the
same heading as a refusal quietly loses that. **The case that forces the
wording is the one with no receiving card**: a finding closed by work
that produced no task to carry an absorption line has nowhere else to
say so, so the archive entry is the only record and must carry the
commit that did it.

**AND THERE IS NO NINTH STATUS.** `closed` is not a status; neither is
any other word invented to make one file parse. The vocabulary is fixed
above, it lives in exactly one place in a project's code, and **a gate
READS that place rather than restating it** — so a project's card-input
gate can refuse an out-of-vocabulary value AT THE POINT OF WRITING, which
is the only place the mistake is cheap. This is enforceable and should be
enforced: left to prose, an invented status surfaces as an unrelated
suite going red three layers from the cause, attributed to whoever was
nearest. Which gate, and where the vocabulary lives, are the PROJECT's to
name in its own conventions — this file names no paths.
**ADDING A STATUS IS A METHOD CHANGE, NOT A PARSE FIX**, and it carries
the version bump this file's own format changes carry.
**AND YES, THIS FILE ALSO WRITES THE VOCABULARY DOWN — DELIBERATELY, AND
THE REASON IS THE ONLY THING THAT MAKES IT SAFE.** The frontmatter block
at the top lists the statuses, the sizes and the review modes, in the
same file that says a gate should READ the vocabulary rather than
restate it. That is a second copy, and a second copy is normally two
facts rather than one fact checked twice — **which is exactly the
objection a reader is right to raise, and it went unanswered here long
enough to become a filed finding.** The copy is KEPT because the method
has to be readable BEFORE any of a project's code exists: this file is
copied whole into a repository that has no parser yet, and a pointer to
a source file that is not there is worse than a list. **What makes it
safe is a CHECKER, not a promise.** A project whose code declares these
sets is expected to compare its declaration against this block
MECHANICALLY, and to red when the two diverge — the same shape as every
other place this method refuses to trust a duplicate. Redundancy with a
checker is one fact checked twice; redundancy without one is what this
paragraph would otherwise be an example of. **Where a project has no
such check, the honest reading is that this block is the authority and
the code is the copy** — and adding the check is cheaper than the first
divergence.

## Lifecycle rules

- Fields lock at dispatch (status: building); unlock on rejected/planned.
- **THE DISPATCH STAMP HAS AN OWNER AND AN ORDER.** The ARCHITECT
  (orchestrator) writes `status: building`, on the INTEGRATION BRANCH,
  BEFORE the lane's branch is cut — the same single-writer rule that
  governs every other placement field, applied to the field that says
  the placement is now fixed. The order is not a preference: a lane cut
  afterwards inherits the stamp in its own base commit and never touches
  that line, so the merge has exactly one writer for it. A stamp written
  after the cut makes that line writable by BOTH branches: it merges
  clean as long as only one side ever writes it, and resolves by hand
  only when both do — a latent conflict the pre-cut order removes
  entirely, not one every merge pays. THIS FILE IS AUTHORITATIVE FOR THE
  FIELD (what the stamp is and what its absence means); the dispatch step
  in `roles/orchestrator.md` (5b) is authoritative for the ACT (who
  writes it and in what order). The two must agree where they overlap.
  **BROKEN ON THIS METHOD'S OWN PROJECT BY THE SEAT THAT OWNS IT, AND
  RECORDED BESIDE THE RULE RATHER THAN ONLY IN THE INCIDENT.** The
  ARCHITECT stamped two cards AFTER their lanes were cut, believing that a
  separate rule — do not leave staged state in a checkout somebody else is
  holding — forbade the write to the integration branch. **It did not.**
  The two rules were never jointly unsatisfiable: an atomic write of two
  frontmatter lines satisfies both, and the workaround was chosen without
  saying that it had been chosen. **The cost was not the latent merge
  conflict this bullet warns about.** Both cards went on reading a STALE
  `touches:` on the integration branch while their lanes built under a
  narrower one, and other lanes computed fence disjointness from the stale
  copy and got the wrong answer. **A stamp written late is not a late
  stamp; it is a FALSE one, for as long as the lane runs** — and this is
  the second reason for the order, discovered by breaking it.
- **WHAT ITS ABSENCE MEANS — nothing about the work.** A card at
  `status: planned` whose lane exists means the stamp was not written,
  not that the task is undispatched. The authority on what is being
  built is the repository's own lane list (lane-protocol.md rule 7); the
  stamp is how the BOARD learns it. Read a missing stamp as a missing
  stamp, and re-stamp forward rather than reconstructing history.
- **THE STATUSES DO NOT ALL REACH THE INTEGRATION BRANCH ALIKE, AND THE
  FIELD SHOULD NOT BE READ AS THOUGH THEY DID.** The vocabulary above
  presents every value as equally observable on the integration branch.
  Two are not. `building` is DURABLE there — written before the branch is
  cut, it stands until the merge. **`verifying` and `merging` are LANE
  states**: the executor stamps `verifying` inside its own worktree, so
  the stamp reaches the integration branch only WHEN THE MERGE LANDS, and
  the integrator's checkpoint stamps `done` in the next commit. The
  window is therefore **one commit wide** — `building` at the merge's
  parent, `verifying` at the merge commit itself, `done` at the
  checkpoint — and a board read at any other commit shows zero cards
  verifying while lanes are genuinely in verification.
  **THIS IS THE FIELD CLAIMING A REACH IT DOES NOT HAVE**, not a defect
  in the parser, the board or any lane. **`verifying: 0` IS NOT EVIDENCE
  THAT NOTHING IS BEING VERIFIED.**
  **THE HONEST READER IS THE LANE LIST** — the repository's own worktrees
  and branches, which lane-protocol.md rule 7 already makes the
  authority. Ask it; do not ask the board.
  **NO NEW STATUS, AND THE OBVIOUS REPAIR IS REFUSED.** Having the
  executor stamp `verifying` on the integration branch instead would
  re-open the two-writer conflict the pre-cut stamp order exists to
  prevent (lane-protocol.md, "Why the branch carries the dispatch stamp
  and the lane does not") — trading a legible gap for a hand-resolved
  conflict on every card. The gap is documented rather than closed.
- **A CARD DISPATCHED IN HALVES HAS NO TRUE `status:`, AND THE ANSWER IS
  A SENTENCE IN ITS BODY RATHER THAN A NINTH VALUE.** Where one card is
  dispatched to two hands — half its work under one fence now, the rest
  held for a ruling or a freed fence — the first half finishes and no
  value in the vocabulary is true. `verifying` claims the WHOLE card is
  built and awaiting a verifier, which is false for as long as the other
  half is unwritten; `done` is worse. **THE RULE: the card stays
  `building`, and the executor of the finished half writes a dated line
  in the body naming WHICH half is built, at which commit, and what the
  other half waits on.** That is what the seat that first met this did,
  correctly and without sanction; this bullet is the sanction.
  **THE TWO OTHER REPAIRS ARE REFUSED AND THE REASONS ARE WORTH
  KEEPING.** A new status is refused on sight by the rule above — it is
  a method change, the vocabulary is closed, and the board would gain a
  value meaningless for every card dispatched whole. *"Never dispatch in
  halves, slice it instead"* is the clean answer and does not answer
  this question: the case that produced it was one where splitting was
  considered and rejected on ceremony cost, and a ruling about ceremony
  does not tell a lane what to stamp. **A half-dispatched card is still
  a dispatch defect worth noticing** — but it is one the ARCHITECT
  makes, and this bullet exists so the LANE that inherits it is not the
  seat left guessing.
- A rejected task goes to a FRESH executor (never the author session, which
  would defend its work) — unless a human explicitly overrides.
- **THE STOP CONDITION WEIGHS REJECTIONS RATHER THAN COUNTING THEM.**
  Two rejections stop the card — open a room, escalate to the human —
  when the SAME defect survives a rebuild, when a rejection's cause was
  already known and was not closed, or when the fix lies OUTSIDE the
  card's fence. Where each rejection is a DISTINCT, newly-found defect
  carrying a named remedy INSIDE the fence, the ARCHITECT may waive once,
  in writing, on the card, and the waiver SHALL record which of those
  distinctions it relied on. A THIRD rejection is terminal in every case:
  park and re-plan, never a fourth pass.
  **AN ESCALATION IS STILL WRITTEN EVEN WHEN THE ARCHITECT WAIVES** — the
  room is what makes the judgement reviewable; it just says *"waiving,
  here is why"* instead of *"stopped, awaiting you"*, so the pipeline
  keeps moving and the human keeps the veto.
  IF the architect is the seat that DISPATCHED the failing card THEN the
  waiver SHALL name that, because a dispatcher waiving a stop on its own
  dispatch is the conflict the escalation exists to catch.
  **WHY IT WEIGHS**: counting punishes a card for being verified
  thoroughly. Two rejections on different, novel defects, each with a
  concrete in-fence fix, is an adversarial process working — escalating
  it spends a human on a decision the architect already had the evidence
  to make, and it gets worse the better the verifiers get. This is
  discipline, not a gate: nothing computes "same defect", and the room is
  the artifact that makes the call reviewable instead.
- On done: stamp built_by / verified_by / review.

## Ceremony by size

| Size | Pipeline |
|------|----------|
| S, diff outside shipped code | executor + tests; the executor is its OWN integrator — it merges, checkpoints and removes its own worktree WHILE IT HOLDS THE INTEGRATION CHECKOUT, and hands all three to the holder when it does not (lane-protocol.md rules 4, 6). No verifier, no *separate* integrator. |
| S, touching shipped code | executor → verifier, then the executor integrates its OWN work once the verdict is in AND while it holds the integration checkout (lane-protocol.md rules 4, 6). One extra session, not two: the *separate* integrator is still not owed. |
| M | executor → verifier → integrator. |
| L | planning pass (or debate room) → executor → verifier → integrator. |

The default path must feel lighter than not using the system.

**WHY SIZE S SPLITS, AND WHAT DECIDES WHICH ROW.** A single row gave
every S card self-integration, so the cards where nothing adversarial was
watching were exactly the ones that changed the product. The rung is
cheap — it adds one session to a MINORITY of S cards and leaves the
docs/method/tooling majority untouched.

**THE BOUNDARY IS READ OFF `touches:`, AND IT IS NOT A GATE.** A card's
`touches:` already names its blast radius, and a project whose slugs
partition into code-bearing components and convention/tooling ones can
decide the row mechanically: if any entry names a component whose build
output SHIPS, the card takes a verifier. **This file cannot draw that
partition** — `method/` is product-agnostic (there are no slugs here to
enumerate), so the partition is the PROJECT's to state in its own
conventions beside its slug map, and until it does the dispatcher applies
the rule of thumb and the boundary is discipline, not enforcement.
State which it is when you dispatch. The rule of thumb: **docs, method
and tooling self-integrate; anything a user could run does not.**
A card that cannot be placed is an M.

## Ceremony by blast radius — ADVISORY

**UNTIL THE FLIP CONDITION BELOW MEASURES TRUE, THESE RUNGS BIND
NOTHING.** The table above governs every dispatch, unchanged. What the
rungs buy today is a NUMBER: the dispatching seat computes it, prints
it on the brief, and records it on the card — and where a rung and a
ceremony ROW disagree, the ROW is what the lane obeys. Say which one
you applied when you dispatch, so the disagreements are countable.
That count is the whole point of an advisory period.

**WHY A SECOND AXIS AT ALL.** Size predicts how LONG work takes. It
does not predict how expensive the work is to get wrong, and it has
been asked to stand in for both. **A card touching a file nothing
imports is cheap to get wrong; a card touching a file twelve things
import is not.** A project that already computes a dependency graph
already knows that number, and a rule keyed to it spends the expensive
rungs where they earn rather than where the letter happens to fall.

**THE RUNGS, IN DIRECT DEPENDENTS OF WHAT THE CARD TOUCHES:**

| Rung | Direct dependents | The pipeline it would buy |
|---|---|---|
| 0 | none | executor + tests; the executor is its OWN integrator |
| 1 | 1 to 7 | executor → verifier; the executor integrates its own work |
| 2 | 8 or more | executor → verifier → integrator |

**`size:` KEEPS EXACTLY ONE RUNG AND IT IS NOT ON THAT TABLE: `L` ⇒ a
planning pass before any of the above, whatever the rung.** That is a
fact about the work's SHAPE — how long it is, and whether it needs
decomposing before anyone opens an editor — and no dependent count
predicts it.

**SO THE TWO FIELDS STOP OVERLAPPING BY EACH KEEPING THE HALF IT
ACTUALLY KNOWS, WHICH IS WHY NEITHER IS DELETED.** `size:` is HOW LONG
THE WORK IS; blast radius is HOW EXPENSIVE IT IS TO GET WRONG. The
three rungs above are the same three rungs the table above already
has — this is continuity, not replacement. The mapping is total,
nothing is deleted, and an M or an L card at rung 0 or 1 becomes
spellable where before it was not.

**DIRECT DEPENDENTS, NOT TRANSITIVE.** Transitive counts saturate: in
one connected application almost everything reaches almost everything,
and a distribution that separates nothing cannot carry a threshold.
Direct keeps a legible tail.

**THE THRESHOLDS ARE NOT ROUND NUMBERS AND MAY NOT BE COPIED AS
THOUGH THEY WERE.** They sit where a measured distribution separated —
at an empty bucket below the top rung — on the project that ruled
them. **A project adopting this SHALL re-derive its own distribution
and put its own rungs where its own data separates**, and the
derivation, the command that produced it and the ref it was measured
at belong in that project's conventions or its decision record. They
are not transcribed here: a count in a normative document is a line
number by another name, and this file names no paths and no commands.

**THE THREE COVERAGE CLASSES, BECAUSE "UNMEASURED" AND "NOT CODE" ARE
DIFFERENT FACTS.** Reading them as one promotes the whole
docs/method/tooling population — the population the table above
deliberately routes to its CHEAPEST row — to the most expensive one,
and average ceremony goes UP. That is the opposite of the reason this
axis exists.

- **KNOWN NON-CODE** — the path is excluded from the project's index
  walk, or carries no walked extension, or belongs to a component
  whose declared paths name neither. **This class takes the rule of
  thumb above, NOT a raised rung.** It is not unmeasured; it is
  measured to be outside the walk, which is a different answer.
- **GENUINELY UNMEASURED** — a walked path inside the walk root with
  no entry, or an entry the indexer could not complete: skipped,
  truncated, depth-limited or refused. **This class takes the HIGHER
  ceremony, never the lower. An unmeasured blast radius is not a small
  one.**
- **MEASURED** — an entry exists, and the rungs apply.

**Which class an input falls in is DERIVED, never judged** — each of
the three is a question the project's own derivation can answer — and
**a derivation that cannot say which class an input is in has answered
GENUINELY UNMEASURED.**

**AND THE FLOOR RULE, WHICH IS NOT OPTIONAL: A BUILD-TARGET ROOT IS
NEVER AT RUNG 0.** Reverse reachability terminates at entry points, so
a root reads zero dependents BY CONSTRUCTION — and a crate root or an
application entry point is the most expensive file in its tree, not
the cheapest. The rule over-corrects on the genuinely trivial roots (a
three-line build script), and that is the correct direction: the
failure this axis exists to close is UNDER-counting.
**A PROJECT WHOSE DERIVATION MARKS ONLY SOME OF ITS ROOTS HAS NOT
MECHANISED THIS RULE.** The unmarked ones then print a bare zero and
are indistinguishable from genuinely unimported files, in exactly that
failure direction. Until every language's roots are marked in the
derivation's own OUTPUT, the floor is applied BY THE READER and the
gap is stated where a reader of that output will meet it — not only in
the notes of whoever found it. **Closing that gap is a precondition of
the flip below**, not a nicety.

**THE OVERRIDE IS PROSE IN THE CARD BODY AND NOTHING ELSE.** At
dispatch the seat may move a card's computed rung by writing the tier
and the REASON into the card. **No field, no status, no parser change,
no gate** — so a wrong threshold costs a sentence rather than a
re-ruling, and every override written down is a datum about where the
thresholds actually belong. Discipline, not enforcement.

**THE FLIP CONDITION IS A MEASUREMENT AND NOT A DATE.** These rungs
BIND on the day a re-derivation shows the MIDDLE rung NON-EMPTY over
the project's own live board — that is, at least one planned card
whose fence resolves to rung 1 under the coverage classes above — AND
the floor rule's precondition above is closed (roots marked in the
derivation's own output): a non-empty middle rung read over unmarked
roots is the under-count this axis exists to refuse. It is one
command, run against the board at that day's ref, and the project
names that command in its own conventions.

**WHY ADVISORY RATHER THAN SIMPLY ADOPTED, STATED HERE BECAUSE THE
REASON IS THE EVIDENCE.** On the board that ruled it the rule was a
**CONSTANT FUNCTION**: every code fence there was component-sized,
every component-sized set contained a rung-2 file, and once the
coverage classes rescue it, the two values it takes are code versus
not-code — which is the rule of thumb above wearing a number. **A rule
that agrees with the existing one on every card it can be asked about
adds no information and costs a derivation per dispatch.**
**THE PREREQUISITE IS PATH-GRANULAR CODE FENCES** — a norm this method
already states, that a fence names the paths a lane WRITES at the
narrowest granularity that still covers them, and one the board in
question had adopted in none of its entries. **So the flip measures
FENCE DISCIPLINE, not the metric**: the metric separates cleanly per
file and has never been handed an input finer than a component.
Re-derive it, do not re-argue it.

**REVERSING THIS IS REVERTING ONE COMMIT.** Nothing here is stored:
the number is derived on demand, no card records it, no frontmatter
field carries it, no gate reads it. That is deliberate, and it is what
makes an advisory period honest instead of a soft launch.

## Parallelism guardrails

- Tasks with overlapping `touches:` never run concurrently.
- **Ceiling: 3–5 concurrent agents, and THIS LINE IS THE VALUE'S HOME.**
  Past that, verification — not generation — becomes the bottleneck and
  quality quietly drops, and the WHY lives here and nowhere else.
  `roles/orchestrator.md`'s dispatch step CITES this line; it repeats
  the number because a project's code may pin the bound against that
  file's spelling, and a duplicate WITH a checker is one fact checked
  twice while a duplicate without one is two facts. The two said the
  same thing for a long time with neither citing the other, which is
  what the citation repairs. **A PROJECT ADOPTING THIS AIMS ITS CHECKER
  AT BOTH COPIES**: the copy nothing reads is the copy that drifts, and
  it will be this one.
- When in doubt, run turn-based; parallel is an optimization, not
  the point.
