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
touches: [C-03, src/egress/]   # expected blast radius; orchestrator never
                               # parallelizes tasks with overlapping touches
suggested_by:            # role, model@session, or human — set on suggestions;
                         # kept after promotion for attribution
builder:                 # model[@session]; empty = nputer.yaml default
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

## Session syntax

`codex` = default session policy (fresh) · `codex@fresh` = explicit fresh ·
`codex@S3` = resume registered session S3. Verifier may be any model or
session, including the builder's — the `review:` field records which
guarantee actually held, so the board can render self-verified checks
differently from independent ones.

**THE INDEPENDENCE THAT PAYS IS INFORMATIONAL, NOT MODEL DIVERSITY.**
Read `review:` as PROVENANCE — which hand held the pen — and not as a
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

## Task creation — single writer

Only the ARCHITECT (planner/orchestrator role) creates tasks with
status: planned. This is where plan coherence lives: one gatekeeper
applies the decomposition rules, so a card on the board always means
the same thing.

Everyone else suggests. A suggestion is a minimal file:
status: suggested, title, one paragraph of context, suggested_by.
Suggested cards are NOT in the queue — the dashboard renders them as
ghosts (dashed) at the bottom of their feature column.

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
| S, diff outside shipped code | executor + tests; the executor is its OWN integrator — it merges, checkpoints and removes its own worktree (lane-protocol.md rules 4, 6). No verifier, no *separate* integrator. |
| S, touching shipped code | executor → verifier, then the executor integrates its OWN work once the verdict is in. One extra session, not two: the *separate* integrator is still not owed. |
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

## Parallelism guardrails

- Tasks with overlapping `touches:` never run concurrently.
- Ceiling: 3–5 concurrent agents. Past that, verification — not
  generation — becomes the bottleneck and quality quietly drops.
- When in doubt, run turn-based; parallel is an optimization, not
  the point.
