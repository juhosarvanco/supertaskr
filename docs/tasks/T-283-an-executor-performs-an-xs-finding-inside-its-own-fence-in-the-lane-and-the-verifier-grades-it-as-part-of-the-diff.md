---
id: T-283
title: An executor performs an XS finding that lies INSIDE its own fence in the lane it is in, names it in the notes, and the verifier grades it as part of the diff — the filing rule routes out only what the fence forbids
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: "@human (2026-09-09): decision A of the backlog review — \"Could the sessions themselves do the tasks instead of doing the whole ceremony from the beginning?\" — ruled yes for findings inside the lane's own fence"
blocked_by: [T-279, T-281]
touches: [method/roles/executor.md, method/roles/verifier.md, method/lane-protocol.md, tools/e2e/tests/brief.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was measured

At the third sitting of 2026-09-09 the board carried 353 sub-cards
(T-NNN-s<n>): 81 merged, 70 planned, 124 parked, 78 still suggested.
Every one of the fifteen filed the night before is size S, and every
one that merged went through the whole lane — dispatch, build, the
two-spawn bench, merge, battery, push — about two hours of wall clock
for changes that were often ten to thirty lines. The filing rule
(executor step 5, verifier step 6: anything you noticed but did not do,
file it and let it go) does not create the findings; it routes them out
of the lane so the diff stays inside the fence. For a finding whose
remedy lies wholly INSIDE that fence the routing buys nothing: the same
files, the same verifier, the same bench would have graded it in the
same pass, and instead it waits in a pile that grows five cards for
every one closed.

## Acceptance criteria

- WHEN an executor notices, while building, a defect or omission whose
  remedy lies wholly inside its armed fence, needs no new acceptance
  criterion, and moves fewer than about twenty lines THE executor SHALL
  perform it in the lane, and the implementation notes SHALL list it
  under a heading "In-fence follow-through" with the lines it moved and
  the property it restores — no card is filed for it.
- WHEN the remedy touches a path outside the fence, or would add a
  criterion, or exceeds that size THE executor SHALL file it as a
  suggested card exactly as today — the fence decides, never the
  effort.
- WHEN the verifier reads the diff THE follow-throughs SHALL be graded
  as part of it: each gets its own attack lines and, where a property
  lives, its own mutant; a change the notes' follow-through list does
  not name SHALL be a finding (undeclared surface), and a REJECTED
  verdict may cite a follow-through alone.
- WHEN executor.md, verifier.md and lane-protocol.md are read THE rule
  SHALL be stated once, beside the filing rule it narrows, with the
  reason (a two-hour lane for a twenty-line change is the cost the
  board is paying) and the three limits (inside the fence, no new
  criterion, the size); the method eval gate SHALL run and the bump
  SHALL carry its eval block.
- IF a lane's follow-throughs exceed three THEN the notes SHALL say so
  and the seat SHALL read it at triage as a sign the card was
  under-specified — a fact for the next card, never a refusal of the
  lane.
- IF a follow-through reds an existing body THEN the executor SHALL
  revert it and file the card instead — a follow-through never widens
  what the verifier must re-derive beyond the fence's own suites.

## Implementation notes

Built in the lane `/Users/ujju/Projects/nputer-T-283` on
`task/T-283-in-fence-follow-through`, cut from
`677941a0b6f4c91a54363c8d15366cd5d1151bc3` (the dispatch stamp). The
diff is three method files and three new suggested cards; no shipped
code moved.

### WHAT THE READING COST, before the first edit

Read WHOLE: the brief 54,377 · this card 3,467 · `docs/STATE.md` 8,322 ·
`docs/ARCHITECTURE.md` 9,300 · `docs/NORTH_STAR.md` 4,932 ·
`method/roles/executor.md` 25,678 · `method/roles/verifier.md` 15,856 ·
`method/lane-protocol.md` rule 5 in full (~8,000 of 50,221). About
130,000 bytes.

Read in PART: `method/tasks/TASK-FORMAT.md` (43,184) — the ceremony row,
the status vocabulary and the title-quoting rule, about 2,000 ·
`tools/method-evals/evals/mf-02` and `mf-04` headers and predicates,
about 8,000 · `T-281`'s and `T-279-s3`'s notes as the worked shapes,
about 9,000.

**NOT read: `docs/CONVENTIONS.md` end to end — 131,774 bytes.** The pack
carried 17 bullets; four addresses were opened by hand while working
(THE BLESSED GATE-RUNNER, DOCS GATE, METHOD EVAL GATE, SCRATCH RULE).
**PACK GAPS: none** — no gate refused anything this lane did, and the
one document the pack does not index (`docs/CAPABILITIES.md`) was never
needed, because this fence adds no spec name.

### THE SHAPE — one statement, two citations, and where the boundary lives

**`roles/executor.md` step 5 is the ONE statement.** It carries the three
limits (inside the armed fence, no new acceptance criterion, fewer than
about twenty lines), the notes heading, the reason with its measurement,
the revert-and-file clause and the more-than-three signal. It is placed
in step 5 and not in the ordered section or the report spec because the
rule NARROWS the filing rule, and a narrowing read two screens from what
it narrows is the shape `T-279-s5` is already filed about.

**`roles/verifier.md` step 6 carries only what the verifier DOES**, and
cites `roles/executor.md` step 5 for the limits, the reason and the
heading rather than respelling any of them (`T-057`). What is new there
is the grading duty, the undeclared-surface finding, and the licence to
REJECT on a follow-through alone.

**`lane-protocol.md` rule 5 contributes the boundary and nothing else** —
that a fence decides direction in BOTH directions: work reaching outside
is routed out, work that never reaches outside is not. It cites both role
files and states no limit of its own.

**THE BLINDNESS CONFLICT IS RULED IN THE VERIFIER TEXT RATHER THAN LEFT
TO BE DISCOVERED.** Criterion 3 requires the verifier to read a list that
lives in the executor's notes, and step 0 forbids reading those notes.
The two hold at once for the reason `roles/executor.md`'s brief rules
already give: the attack set is written and hashed against the card AT
ITS BASE, where no follow-through can be named yet, and the list arrives
at the TIP as part of the diff being graded. The new text says so in as
many words, and names the list a declaration of SURFACE rather than the
reasoning step 0 keeps the seat out of. Without that sentence the two
files contradict each other on their face.

### In-fence follow-through

**ONE, moving 8 lines (+5/-3) in `method/roles/verifier.md` step 0.**

Noticed while placing the step 6 text: step 0 opened *"Read the standing
set this project's root adapter names — `docs/STATE.md`,
`docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`. They are listed there,
once, and **deliberately not re-listed here**: a second copy of a list
drifts from the first, and this project has watched that happen."* The
sentence re-lists them in the clause before the one denying it, and the
copy had already drifted exactly as predicted: the adapter names six
documents (STATE, ROADMAP, ARCHITECTURE, CONVENTIONS, CAPABILITIES,
NORTH_STAR — `CLAUDE.md`/`AGENTS.md` at this ref) and the copy named
three, while step 0's own two bullets immediately below say the
verifier's differences from that set are exactly TWO. So the file
silently subtracted `docs/CAPABILITIES.md` and `docs/NORTH_STAR.md` from
a seat that was told it had two differences.

**The property restored**: the standing set has ONE home, and this role
file's differences from it are exactly the two it names. The list is
struck and the drift is recorded in place of it.

**It passes all three limits**: `method/roles/verifier.md` is in the
armed fence, no acceptance criterion is added or needed, and it moves
eight lines. **And it changes no derivation** — the brief's read-first
set is computed from the ADAPTER minus the role file's `do NOT read`
sentences, none of which this touches. Derived at this tree through the
arm's own `readSubtractions`: `executor.md` subtracts
`["docs/CONVENTIONS.md","docs/ROADMAP.md"]` and `verifier.md` subtracts
`["docs/CONVENTIONS.md","docs/ROADMAP.md"]` — unchanged, and
`brief.spec.ts` is green over 66 bodies at this tree.

**No card is filed for it**, per the rule this card lands. One
follow-through is under the three the same rule makes a seat declare.

### THE DRILL — ten data mutants, one of them the control

`drill-T-283.py` in the scratch directory; log `drill-T-283-log.txt`.
The property lives in PROSE, so a data mutant is the only kind that can
grade it (`roles/verifier.md` 2b, `T-221`). Each mutant was planted at an
anchor matching EXACTLY ONCE, each landing read back from
`git diff --numstat` rather than from the mutator's own report, each
restore proved by sha256 against the pristine bytes. **FAILED=0**, and
all three files hash identical to their pre-drill values at the end:
executor `8cfb8f866646f30e07c8ecd873bf6bccbe9495ce8a32fd55e7ac3295ce22a77a`,
verifier `85fcb97acd6901cea307a100a58c4c74cd9d683cd4af59a3a3ba869a3215c80a`,
lane-protocol `2514c1a199fa0248db838ed827677ff404e955271280deb01126890f52665dd7`.

**THE POSITIVE CONTROL RAN FIRST AND IT FAILS THE WAY IT SHOULD.** Nine
greens would otherwise be indistinguishable from a gate that never opened
these files at all. C1 renamed the NEW citation inside the new verifier
text — `roles/executor.md` → `roles/executorz.md` — and the gate exits
**1**, naming it: *"method/roles/verifier.md points at
method/roles/executorz.md, which is not in the method tree"*. MF-04 reads
these exact new lines.

Then nine one-side mutants on the SUBSTANCE — the rule deleted, "wholly
inside" widened to "near", "the fence decides, never the effort"
inverted, twenty lines doubled to forty, the verifier's grading struck,
undeclared surface made fine, the notes heading drifted out of step with
the verifier's copy, lane-protocol's clause deleted, the revert-and-file
clause struck — and **all nine leave `node tools/method-evals/run.mjs` at
exit 0 over 10 model-free evals.** The table is in `T-283-s1`, filed for
it. This is `T-279-s3`'s class at a second site; that card carries MF-11,
and `tools/method-evals/` is not in this fence, so the finding is routed
rather than the fence widened.

### CRITERION BY CRITERION

1. **MET**, and performed once in this lane — see the follow-through
   above, which is the worked example as well as the rule.
2. **MET.** The escape clause is written beside the rule and the decision
   procedure is named twice in the diff, once in `executor.md` and once
   in `lane-protocol.md`: **the fence decides, never the effort.** The
   worked case is `T-283-s2`: `T-279-s5` sits wholly inside this fence at
   two lines, and this lane did NOT perform it, because absorbing a card
   the board already carries is a different act from performing a finding
   — filed rather than guessed.
3. **MET in `verifier.md` step 6**: attack lines per follow-through, a
   mutant where a property lives (a DATA mutant where it lives in prose),
   an undeclared change is a finding, a REJECTED verdict may cite a
   follow-through alone. The blindness interaction is ruled in the same
   paragraph rather than left to the seat.
4. **MET.** Stated once per file, each beside the filing rule it narrows;
   the reason and the three limits are in `executor.md` step 5 only and
   the other two cite it. The method eval gate ran — `10 model-free`
   exit 0, `--selftest` `10 model-free, POSITIVE CONTROL` exit 0 — and
   the `--bump` block is below.
5. **MET as a rule and NOT as a mechanism**, said plainly: the sentence
   is in `executor.md` step 5, and nothing counts follow-through headings
   across cards. Filed as `T-283-s3`.
6. **MET in the text, and NOT exercised** — no follow-through in this
   lane redded anything, so the revert path is written and untried here.
   The one performed was checked the other way round: `brief.spec.ts`
   alone, 66 passed, before the graded battery.

### WHAT IS OWED AT THE MERGE AND IS OUTSIDE THIS FENCE

- **THE METHOD VERSION BUMP.** `method/**` moved, so the stamp goes past
  **0.1.14** — three files outside this fence (`docs/CONVENTIONS.md`'s
  first-gotcha stamp and its version paragraph, and
  `method/interview/plan-interview.md`'s own line). **The stamp did NOT
  move inside the lane; it is the integrator's.** The bump carries this
  block, taken at this lane's tree with
  `node tools/method-evals/run.mjs --bump`:

      Method evals: model-free exit 0, model-in-loop exit 3.
      Corpus: 10 model-free, 4 model-in-loop.
      Runner: NONE
      THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.
      Say that in the commit rather than omitting the line: a bump whose
      eval result is absent and one whose eval was skipped read the same.
      Pass rates and token spend are in the run above, at this ref. Do not
      transcribe them from an earlier run — that is the corpus's own RC-04.

- **THE CENSUS: NOT OWED.** No spec name moved; `tools/e2e/tests/` is
  untouched by this diff.
- **GRAPH REGEN: NOT OWED.** No `.ts/.tsx/.js/.jsx/.rs` path is in this
  diff — it is three `.md` under `method/` and three `.md` under
  `docs/tasks/`.
- **BOOT GATE: NOT OWED.** Nothing under `app/src-tauri/**`, `app/src/**`
  or either manifest.
- **THE RUST LEG: NOT OWED.** `app/src-tauri/src/agent/kit.rs` pins
  `roles/planner.md` and no other role file, checked at this ref; the
  docs gate names no cargo suite for these paths.
- **METHOD EVAL GATE: FIRES** on `method/**`, and it ran.
- **DOCS GATE: FIRES** on the three new cards, and names exactly three
  suites — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/`. Derived at this tree from
  `docs-gate.mjs` on the six paths, not remembered.

### THE SUITES

Run ONCE, through the blessed gate-runner, at the tip carrying the code,
these notes and the three suggested cards — `roles/executor.md`'s ordered
section: code, then the notes and the cards, then the suites, then the
stamp. Their names, refs, body counts and exits are in the executor's
report. **The `verifying` stamp is a separate commit that moves only this
card's `status:` line and re-runs nothing — a run skipped on purpose, not
a run forgotten.**

### SUGGESTIONS FILED

- **T-283-s1** — this card's own rule is unpinned: nine one-side data
  mutants on its substance all leave the method eval gate green, with a
  control that reds. `T-279-s3`'s MF-11 is the vehicle.
- **T-283-s2** — whether a follow-through may absorb an ALREADY-FILED
  card lying inside the lane's fence is unruled; `T-279-s5` is the worked
  case this lane declined.
- **T-283-s3** — the more-than-three signal has no reader; nothing counts
  follow-through headings across merged cards.

### WHERE THE BRIEF WAS WRONG

- **The base row.** Row 4 names `9ba3b7b9…` (the newest checkpoint) as
  the base while the lane was actually cut from `677941a0b6f4…`, the
  dispatch stamp — which the brief's own integration-tip row and its lane
  row both give. Same disagreement `T-281` reported; not a fault, but the
  two rows disagree and the reader has to know which is the lane's.
- **The ceremony row (row 11) is ambiguous by construction and says so.**
  Both size-S rows are printed with the note that more than one matches.
  Read against this diff — three method `.md` and three card `.md`, no
  shipped code — the "diff outside shipped code" row is the literal
  match, yet the card's frontmatter names a `verifier:` and `review:
  independent`, and criterion 3 is a claim ABOUT the verifier that only a
  verifier can exercise. **This lane stamped `verifying` and merged
  nothing**, which is the safe reading of a genuine ambiguity: it does
  not take the integration seat, and it leaves the worktree standing for
  the verdict (`lane-protocol.md` rule 6). If the seat rules otherwise,
  nothing in the diff has to change.
- **Row 3's read-first set omits `docs/ROADMAP.md` and
  `docs/CONVENTIONS.md` correctly**, and the pack's derivation was
  accurate at this ref: no bullet this lane needed was missing.

## Verdicts

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2)

**APPROVED WITH ASSIGNED CORRECTIONS.** Four corrections, four bodies
committed on the bench, four mutant blocks. Tip judged
`afd454b8f8b866d1f8d5632d7f1414ea32b459cf`; base
`677941a0b6f4c91a54363c8d15366cd5d1151bc3`; bench
`/Users/ujju/Projects/nputer-V-T-283`, detached.

**THE SEALED INPUTS, verified by `shasum -a 256` before anything was
opened**, each matching `stamps-T-283.txt`:

    de6bdcd6b05b231c6f885867b3afa5c996cf36b63750b3a380aff4319637cd93  attack-set-T-283.md
    d846cf8e2d358fe65209fa9c2d18e4a11bc328b4fe9a8d2da647e84ca4048ff7  ground-T-283.md
    b072ad39777f27400339c8003c2a760a6b0269e00feeda8ace911c67d5741509  ground-T-283-addendum.md

**THE FRAME I ACTUALLY HAD, and it is not the guaranteed one in two
places.** Two spawns: phase 1 wrote its set tool-less by instruction at
the base and says so in its own §0 — a discipline kept, not a property
the harness enforced (T-261). My brief **carries no context pack**,
which `roles/verifier.md` step 0 calls a dispatch fault; the same step
then says to read `docs/CONVENTIONS.md` whole where there is none, and
**I did not** — I read `docs/STATE.md` whole (no named intermittent that
could explain a red, and no red occurred), `docs/ARCHITECTURE.md` not at
all, and CONVENTIONS by the addresses I needed. The diff is prose under
`method/` and touches no gate bullet; that is the reason, not a defence.
**And the blindness leaked once, structurally**: R-1's fence check is the
first act a phase-2 brief orders, and `git diff --name-only` returned
three self-describing new card filenames — so the executor's conclusions
about the eval gate's blindness, the unruled card-absorption and the
unread more-than-three signal reached me before I measured anything. I
re-measured all three independently and they hold; filed as **T-283-s4**.
The ground truths were taken at the base by the dispatcher and hashed, so
no measurement here was shaped by the implementation.

#### The decision rules phase 1 fixed, answered

| rule | answer | how it was measured |
|---|---|---|
| **R-1** fence | **HOLDS** | `git diff --name-only 677941a..afd454b` = the three method files, this card, and three NEW `docs/tasks/` files. Nothing else. `integrator.md`, `kit.rs`, `plan-interview.md`, `CONVENTIONS.md`, `dispatch-brief.mjs`, `brief.spec.ts`, `gate-run.*`, `ci.yml`, `workflow-parity.spec.ts`, `ROADMAP`, `STATE`, `CAPABILITIES`, `VERSIONS`, `NORTH_STAR`, `ARCHITECTURE` all blob-identical base..tip. `docs/decisions`, `docs/rooms`, `docs/checkpoints` tree hashes identical (`9c7682d7`, `56a3cbb4`, `f505961c`). **C-4**: the check flags a planted breach — a scratch commit touching `gate-run.mjs` on a shared clone returned it, and the real diff returns nothing. |
| **R-2** stamp | **HOLDS** | `currently v0.1.14`, `(v0.1.14;`, `METHOD_SNAPSHOT_VERSION: &str = "0.1.14"` — all three at 0.1.14, and none of the three files appears in the diff. **C-6/DM-15**: the guard is armed — `kit.rs` alone moved to 0.1.15 makes `snapshot_version_matches_the_live_method_stamps` **FAIL**, cargo exit **101**, restored by sha256 `e24d3ce0043a8155`. |
| **R-3** blindness | **HOLDS** | Step 0's bullet is **byte-identical** to base. The carve-out is named (`In-fence follow-through` only), bounded (*"not the reasoning step 0 keeps you out of"*) and **timed** — *"your attack set is written and hashed against the card at its BASE … and the list arrives at the TIP"*. No blanket repeal, no pre-attack-set read. |
| **R-4** criteria | **HOLDS** | AC-1…AC-6 all present literally; see below. |
| **R-5** grammar | **HOLDS** | Measured at the reader, both refs, both role files: `readSubtractions` = `["docs/CONVENTIONS.md","docs/ROADMAP.md"]` and `readAdditions` = `["tasks/TASK-FORMAT.md"]` / `[]` — **identical base and tip**. The diff adds **zero** `docs/` paths and **zero** `do NOT read` lines. `brief.spec.ts` alone: **66 passed, exit 0**. |
| **R-6** unguarded | applied | The kill set is hand-held; see the drill. The lane wrote no eval (correct — `tools/method-evals/` is outside its fence) and filed **T-283-s1** naming the blindness. No correction is owed under R-6. |

#### Criterion by criterion

- **AC-1 MET.** `executor.md` step 5, appended directly to the filing
  rule with no intervening step. All four trigger qualifiers present —
  *notice WHILE BUILDING*, *a defect or omission*, *lies **wholly**
  inside*, the armed fence. Heading exact: `` `In-fence follow-through` ``,
  one occurrence in `executor.md`, one in `verifier.md`, **no casing or
  plural variant anywhere in `method/`**. Both fields mandated (*"the
  lines it moved and the property it restores"*). *"**No card is filed
  for one.**"* Step 5's original text survives intact — 27 insertions,
  **0 deletions** in `executor.md`'s step-5 hunk, so *"suggestions never
  expand your scope"* and the file-and-let-go sentence are untouched.
  The heading is conditional, not owed by every notes block.
- **AC-2 MET.** All three exits present in one sentence — *"reaching one
  path outside the fence, or adding a criterion, or larger than that"* —
  and the precedence carries its anti-inverse explicitly: *"filed exactly
  as the sentences above say **even when it would take a minute**"*.
  **THE FENCE DECIDES, NEVER THE EFFORT** appears in `executor.md` and,
  in lower case, in `lane-protocol.md`. The determiner is the subject of
  correction **C2**.
- **AC-3 MET, all four parts, in `verifier.md` step 6.** Attack lines per
  follow-through; a mutant where a property lives, correctly typed —
  *"a property living in prose takes a DATA mutant, per 2b above"*
  (T-221); undeclared surface a finding; *"**AND A REJECTED VERDICT MAY
  CITE A FOLLOW-THROUGH ALONE**"*, unsoftened. **A-3.5 clean**: the text
  cites **2b** (the drill) and never 5b, and adds *"what you commit on
  your own bench is 5b's corrections and nothing else"* — the two objects
  are not conflated. Step 6's original filing rule is intact.
- **AC-4 MET, in the "once across the three files" shape**, which is the
  reading this method's own *"a second copy of a list drifts from the
  first"* requires. The reason and the three limits live once, in
  `executor.md` step 5; `verifier.md` points at it exactly (*"the three
  limits, the reason and that heading are `roles/executor.md` step 5's,
  and are not respelled here"*) and `lane-protocol.md` points at it for
  the limits and cites `roles/verifier.md` step 6 for the grading. **C-2
  controls**: `In-fence follow-through`, `twenty`, `armed fence`,
  `THE FENCE DECIDES…` and `follow-through` all count **0 at base** in
  all three files, so every presence count above discriminates. The
  method eval gate ran: **10 model-free, exit 0**; `--selftest` **10
  model-free, POSITIVE CONTROL, exit 0**; `--bump` **exit 0**, and the
  block on the card re-derives verbatim at my tip.
- **AC-5 MET.** *"**AND MORE THAN THREE IN ONE LANE IS A FACT THE NOTES
  STATE OUT LOUD.**"* — *"more than three"*, not *"three or more"*; the
  reading seat is named (*"The seat reads it at triage"*); and it is
  explicitly *"a fact for the NEXT card, **never a refusal of the lane you
  are in**"*. Not converted into a gate.
- **AC-6 MET.** *"**A FOLLOW-THROUGH THAT REDS AN EXISTING BODY IS
  REVERTED, AND THEN FILED.**"* with the re-derivation clause — *"never
  widens what the verifier must re-derive beyond the suites your fence
  already owed"* — and **no exception**, so A-6.4's hole is not opened.

#### The lane's own follow-through, graded by the rule the same diff introduces

**ONE**, `verifier.md` step 0, **+5/−3**. Under the three limits:
`verifier.md` is in the manifest; it adds no criterion; and it is under
twenty lines on every reading (5, 8 or 2). It landed in `cd4187d` — the
graded commit — so it was inside the single graded run, not after it.

**Its premise re-derives, and it is a real defect it repaired.** The root
adapter names **six** documents at this ref — measured through the arm's
own `docsNamed` on `CLAUDE.md` and `AGENTS.md`: STATE, ROADMAP,
ARCHITECTURE, CONVENTIONS, CAPABILITIES, NORTH_STAR. The struck inline
copy named **three**, while step 0's own bullets immediately below say
the verifier's differences from that set are exactly **two**. The copy
had therefore silently subtracted CAPABILITIES and NORTH_STAR from this
seat — inside the sentence whose own clause says the list is
*"deliberately not re-listed here: a second copy of a list drifts from
the first, and this project has watched that happen."* **It moves no
derivation**, confirmed independently: the sets above are identical base
to tip, and `brief.spec.ts` is 66/66 green at the tip. **Well aimed, and
declared. No undeclared surface**: every other hunk in the diff maps to a
criterion — `lane-protocol.md` ×1 to AC-2/AC-4, `executor.md` ×1 to
AC-1/2/4/5/6, `verifier.md` step 6 to AC-3.

#### The drill — the kill set is hand-held, and that is stated rather than hidden

Twelve one-side data mutants of my own on a `git clone --shared` of the
bench, plus the two controls. Each anchor matched **exactly once**
(refused otherwise), each landing read from `git diff --numstat` and
never from the mutator, each restore proved by sha256.

**C-3, the arming, first — and my own harness failed it before the gate
did.** My first control read `${pipestatus[1]}` outside the command
substitution the pipeline ran in and reported exit 0 for a run that had
never been read; corrected, **C-3a** (`# Role: verifier` → `verifer`)
gives **exit 1, "MF-03: 1 role opening(s) broken"**. Only after that red
is a silence blindness rather than breakage.

**DM-1** (armed fence → the repository), **DM-2** (size clause deleted),
**DM-3** (no-new-criterion deleted), **DM-4** (heading pluralised in
`executor.md` only), **DM-5** (twenty → fifty in `executor.md` only),
**DM-6** (undeclared surface → "IS FINE"), **DM-7** (REJECT-alone
weakened), **DM-9** (*never a refusal* inverted), **DM-10** (revert
struck), **DM-13** (the `lane-protocol.md` pointer moved to step 4),
**DM-14** (*more than three* → *three or more*), and **C-3b**
(`roles/verifier.md` step 6 → step 9): **all twelve leave the gate at
exit 0 over 10 model-free evals.** This reproduces the lane's own nine
and T-279's precedent at a second site.

**What the gate DOES read is the PATH half of a citation and not the
ordinal.** Re-deriving the lane's own control: `` `roles/executor.md` ``
→ `` `roles/executorz.md` `` in the new `verifier.md` text gives **exit
1, "MF-04: 1 dangling reference(s) of 15 distinct targets"**. So MF-04
reads these exact new lines while MF-02 never resolves the `<file> step
N` form the two cross-file pointers use. Filed as **T-283-s5**; it is not
a defect of this card.

**DM-11 is the one phase 1 pre-committed on, and its answer is the
opposite of the hypothesis — without being this card's fault.** Inserting
`You do NOT read docs/STATE.md.` into the new `executor.md` prose **does**
move the reader (`readSubtractions` returns
`["docs/CONVENTIONS.md","docs/ROADMAP.md","docs/STATE.md"]`) and
`brief.spec.ts` stays **GREEN at 66 passed**. The bodies assert the
derivation's internal consistency, never the resulting values — by the
module's own design (*"the DOCUMENT is never written down in this
module"*). So phase 1's *"the grammar guard itself is broken, REJECT-grade"*
does **not** apply: nothing is broken, the guard was never a set-pin, and
**this diff moves neither set**. **DM-12** (`read docs/NORTH_STAR.md`)
moves nothing at all — `readAdditions` requires `ADDITION TO THAT SET IS `
plus a backticked run, so ordinary prose cannot trigger it. Both are
T-279-s4's standing hazard, not T-283's.

**C-5, C-7 answered:** the size rule is **not** determinate — this lane's
own +5/−3 yields 5, 8 or 2 under three defensible readings, which is
correction **C1** proven on the diff rather than asserted. Cross-file
drift is unguarded in both directions (DM-5, DM-13 both silent), so
*"stated once, consistently"* is enforced by reading only.

#### Security sweep (mandatory though the diff is prose)

**S-1 clean** — no phrasing reads "inside the repo" or "inside files I
already touched"; the determiner is under-specified rather than widened,
which is **C2**. **S-2 confirmed** — *"about twenty"* is unbounded upward
with no unit and no tie-break: **C1**. **S-3 confirmed** — the verifier is
told only that an *unlisted* change is a finding, so the heading launders
a listed one: **C3**. **S-4 clean** for this diff (R-5), hazard reported.
**S-5 clean** (R-3). **S-6 clean** — `lane-protocol.md` rule 5's sentence
*"A fence is not widened from inside the lane it fences"* survives
**verbatim**, and the new clause is framed as **the converse of the same
rule**, never as an exemption or an allowance; fast path A is untouched
(the file has one hunk, at rule 5). **S-7 confirmed** — *"needs no new
acceptance criterion"* is executor-certified and the verifier is never
told to re-derive it: folded into **C3**. **S-8 clean** — AC-5's sentence
is diagnostic and says so in its own words.

#### Held, with the derivation — not corrections

- **A-7 (T-279's order).** The ordered section is untouched, and the
  trigger is *notice **WHILE BUILDING***, which precedes the notes. The
  two together place a follow-through before the graded run, and the
  lane's own landed in `cd4187d`. The text never says it in one place;
  that is a thinness, not a failure.
- **A-6.2 (revert residue).** *"revert it and file the card"* — the filed
  card lands in the same diff and **is** the residue. The clause is
  verifiable after all.
- **A-15 (`built_by` empty at tip).** `tasks/TASK-FORMAT.md` stamps
  `built_by` **on done**, not on `verifying`. Phase 1's hypothesis is
  refuted by the file. `status: verifying` is the executor's own
  transition per step 6. No `<-` anywhere in the appended prose.
- **The stamp commit's exemption is honest.** `git diff cd4187d afd454b`
  is exactly one line: `status: building` → `status: verifying`.

#### The suites — run ONCE at MY OWN tip, through the blessed runner

All at `afd454b8f8b866d1f8d5632d7f1414ea32b459cf`, from the bench root,
after `npm ci` in `lib/parser`, `app`, `tools/e2e` and `npm run build` in
`lib/parser` and `app`:

| suite | bodies | exit | verdict |
|---|---|---|---|
| `gate-run.mjs parser` | **389** | 0 | GREEN |
| `gate-run.mjs app` | **1171** | 0 | GREEN |
| `gate-run.mjs rust` | **654** (18 targets) | 0 | GREEN |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=25283`) | **778** | 0 | GREEN |

Parser, app and e2e reproduce the lane's reported counts exactly; the
rust leg the lane derived as not-owed I ran anyway under T-262 and it is
green. `brief.spec.ts` alone: **66 passed, exit 0**. Method eval gate:
**10 model-free exit 0**; `--selftest` **exit 0 with POSITIVE CONTROL**;
`--bump` **exit 0**. `docs-gate.mjs` on the diff's six paths: **FIRES on
4 paths under `docs/`**, naming exactly the three suites the notes claim
— `npm test from app/`, `npm test from tools/e2e/`,
`npx vitest run from lib/parser/` — exit 0, every live card's frontmatter
parsing with a legal status. `docs/STATE.md` names **no** intermittent
that could explain a red, and none occurred.

#### THE FOUR CORRECTIONS

Each body is committed on this bench in `tools/e2e/tests/brief.spec.ts`
**after** this verdict commit (step 5b), and each was run **both ways**:
**RED** against the text as it landed at `afd454b` — `4 failed, 66
passed`, each of the four failing **alone** — and **GREEN** against the
corrected text below — `70 passed, exit 0`, with the method eval gate
still exit 0 under it. The method files were then restored and proved by
sha256 (`8cfb8f86…`, `85fcb97a…`, `2514c1a1…`, byte-identical to the
lane's own pre-drill hashes). **The text changes below are the
integrator's to apply** (step 2b: *"you make the code change and the
committed body is what proves it"*); the blocks re-drill them afterwards.

**C1 — the size limit has no counting unit and no tie-break.** *"moves
fewer than about twenty lines"* answers nothing at 20, 25 or 30, does not
say whether added, removed or added+removed is counted, and does not say
whether the limit is per follow-through or per lane. Three at fifteen
lines is 15 or 45; this lane's own is 5, 8 or 2.

```mutant
correction: C1 the follow-through size limit states its counting unit and its tie-break
file: method/roles/executor.md
spec: tools/e2e/tests/brief.spec.ts
body: T-283 C1 — the follow-through SIZE limit states what is counted and what to do at the boundary
message: the size limit names no COUNTING UNIT
--- old
moves fewer than about twenty lines COUNTED AS
   ADDED PLUS REMOVED, PER FOLLOW-THROUGH RATHER THAN PER LANE, AND WHERE THE
   COUNT IS ARGUABLE YOU FILE THE CARD, you PERFORM in the
--- new
moves fewer than about twenty lines, you PERFORM in the
```

**C2 — the fence determiner is undefined in one file and diverges in the
other.** `executor.md` says *"wholly inside your **armed fence**"*, a term
that occurs **nowhere else in `method/`** and whose only neighbouring
vocabulary (`armed`, `re-armed`, three occurrences in `lane-protocol.md`)
names the **physical layer**, not the fence. `lane-protocol.md` says
*"wholly inside the lane's own `touches:`"* — the one computation rule 5
forbids a lane four paragraphs later (*"a lane that computes its own fence
can compute a wider one"*). Neither names the **manifest**, which is what
actually decides and what a follow-through can collide with a live lane
by ignoring.

```mutant
correction: C2 inside-the-fence is determined by the dispatch-time manifest, in both files
file: method/roles/executor.md
spec: tools/e2e/tests/brief.spec.ts
body: T-283 C2 — `inside the fence` is determined by the dispatch-time MANIFEST, in both files that say it
message: executor.md decides `inside the fence` by a term it never defines
--- old
remedy lies wholly inside your armed fence — THE MANIFEST THE DISPATCHER
   STAMPED IN THIS LANE, never your own reading of `touches:` — needs no new
   acceptance criterion
--- new
remedy lies wholly inside your armed fence, needs no new
   acceptance criterion
```

The companion half of C2, which the same body also grades:
`method/lane-protocol.md` — replace *"remedy lies wholly inside the lane's
own `` `touches:` `` is PERFORMED in the"* with *"remedy lies wholly inside
the fence that lane's MANIFEST was stamped from — never the lane's own
reading of `` `touches:` `` — is PERFORMED in the"*.

**C3 — a listed follow-through is waved through for being listed.**
`verifier.md`'s only stated duty about the list is that an **unlisted**
change is a finding. Nothing tells the seat to check a **listed** entry
against the three limits — and two of those three (the size, and
*"needs no new acceptance criterion"*) are enforced by no machinery at
all, so the heading becomes a licence rather than a declaration.

```mutant
correction: C3 a listed follow-through is checked against the limits, never waved through
file: method/roles/verifier.md
spec: tools/e2e/tests/brief.spec.ts
body: T-283 C3 — a LISTED follow-through is checked against the limits, never waved through for being listed
message: tells the seat to flag what the list omits and never to CHECK what it contains
--- old
**AND A LISTED ENTRY IS
   CHECKED AGAINST THE THREE LIMITS RATHER THAN WAVED THROUGH FOR BEING
   LISTED** — the heading is a declaration, never a licence: an entry outside
   the manifest, or adding a criterion, or over the size, is a finding
   exactly as an unlisted change is.
--- new
**AND A LISTED ENTRY IS LISTED**, which is the declaration this step asks for.
```

**C4 — the ruling this diff amends is left standing, in a file the lane
edited.** `executor.md`'s brief rules still say *"The ruling is the BASE
REF: the verifier reads the card as it stood when the lane was cut, **which
is the card without this role's notes**, so both sentences hold at once and
neither file has to give way."* After this diff the verifier reads part of
those notes, **at the tip**. The paragraph is inside this lane's own fence
and was not amended. This is the method's own named failure —
*two descriptions of one rule are two rules the day one of them is
corrected* — committed in the file that states it.

```mutant
correction: C4 the base-ref ruling names the follow-through carve-out that amends it
file: method/roles/executor.md
spec: tools/e2e/tests/brief.spec.ts
body: T-283 C4 — the file carrying the BASE-REF ruling names the follow-through carve-out that amends it
message: the base-ref ruling still reads as complete
--- old
notes — save the `In-fence follow-through` list step 5 requires, which
  `roles/verifier.md` step 6 reads AT THE TIP as part of the diff and never
  before the attack set is hashed — so both sentences hold at once and
  neither file has to give way.
--- new
notes, so both sentences hold at once and neither file has to give way.
```

**Four corrections, four blocks — no shortfall to explain.**

#### Filed, not folded into this verdict (step 6)

- **T-283-s4** — a phase-2 verifier reads the executor's conclusions off
  the new cards' filenames during the fence check its brief orders first.
- **T-283-s5** — MF-04 reds on a citation's path, MF-02 is silent on its
  ordinal, so the half of a cross-file pointer that carries the meaning is
  unguarded.

**What is still owed at the merge and is outside every fence here:** the
method version bump past **0.1.14** in its three files, with the `--bump`
block, and the re-drill of the four blocks above on the merged tree
(`roles/integrator.md` 2b). **The bump did not move inside the lane, and
must not have.**

#### 2026-09-09 — the same verifier, step 7 at the tip MY OWN commits created

**A CORRECTION TO THIS VERDICT'S OWN FIGURE, appended rather than
rewritten.** The verdict above reports `docs-gate.mjs` on the diff's six
paths as **exit 0**. That is wrong, and it is wrong in this seat's own
named way: the exit was read through a pipe into `tail`, so the number
recorded was `tail`'s. Re-measured **unpiped**: the six paths give
**exit 1**, and `EXIT = { CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 }`
— **1 is FOUND, the gate FIRING and naming three owed suites**, not a
failure. The three method paths alone give **exit 0**, "not owed",
matching the ground truth taken at the base. The gate's substance in the
verdict above is unchanged: it fires on the four `docs/` paths and names
`npm test from app/`, `npm test from tools/e2e/` and
`npx vitest run from lib/parser/`. The same misreading bit my first
mutant control and was caught there too; both are recorded rather than
quietly fixed.

**Step 7 — the gates my own two commits (`a753265` verdict + cards,
`f4c9c3f` bodies) could move, run at `f4c9c3f`:**

| gate | result |
|---|---|
| `gate-run.mjs parser` | **exit 0**, GREEN, **389** bodies |
| `gate-run.mjs app` | **exit 0**, GREEN, **1171** bodies — *on the second reading; see below* |
| `gate-run.mjs e2e` | **exit 1**, RED, **782** bodies: **4 failed, 778 passed** |
| `docs-gate.mjs` on my three card paths + the spec | **exit 1 = FOUND**, three suites named; every live card's frontmatter parses with a legal status; injection scan 0 hits; ADR-019 budgets hold |
| `node tools/method-evals/run.mjs` | **exit 0**, 10 model-free |

**The e2e red is the four bodies this verdict assigns, and nothing else.**
By name: `T-283 C1`, `T-283 C2`, `T-283 C3`, `T-283 C4`, all in
`tools/e2e/tests/brief.spec.ts`. The other **778 pass — the same count
that was green at `afd454b`** — so the verdict and the two cards moved no
existing body. This is the shape `T-281-s7` already names: a correction
needing a text change is pinned by a body that is committed RED and turns
GREEN when the integrator applies the change the block anchors on. **The
bench tip is knowingly red on exactly those four and on nothing else.**

**AND THE APP LEG REDDED ONCE AT THIS TIP AND IS NOT ATTRIBUTABLE TO
THESE COMMITS.** Run 1 gave exit 1 over 1171 bodies with **9 failures,
all in `app/test/genesis-switch-truth.test.tsx`** — a file no card feeds
and my diff does not touch. The file passes **10/10 alone**, and the full
leg re-run gave **exit 0, GREEN, 1171**. Attributed by name as a
load-sensitive intermittent, per `docs/STATE.md`'s own
re-run-once-then-attribute move; STATE names no such intermittent for the
app suite, so it is filed as **T-283-s6** (the rust sibling is
`T-281-s8`). **The verdict stands: APPROVED WITH ASSIGNED CORRECTIONS.**
