---
id: T-283
title: An executor performs an XS finding that lies INSIDE its own fence in the lane it is in, names it in the notes, and the verifier grades it as part of the diff — the filing rule routes out only what the fence forbids
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "@human (2026-09-09): decision A of the backlog review — \"Could the sessions themselves do the tasks instead of doing the whole ceremony from the beginning?\" — ruled yes for findings inside the lane's own fence"
blocked_by: [T-279, T-281]
touches: [method/roles/executor.md, method/roles/verifier.md, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
