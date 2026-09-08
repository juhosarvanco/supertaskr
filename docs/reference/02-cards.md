# 02 — Cards

One file per task in docs/tasks/, named `T-NNN-<slug>.md`. The story
map, the dispatch order, the fence and the model assignment are all
pure functions of the frontmatter; no layout or state is stored
anywhere else. The format's authority is method/tasks/TASK-FORMAT.md;
the parser that owns the vocabulary is lib/parser (C-06), and a gate
reads that one place rather than restating it.

## The frontmatter

```yaml
---
id: T-016
title: Audit log            # quote it if it opens with a symbol
feature: F-03               # story map column
milestone: 2                # above or below the slice line
priority: 2                 # position in the column; 1 = top = next
size: M                     # S | M | L — sets the ceremony tier
status: planned             # suggested | planned | building | verifying |
                            # rejected | merging | done | parked
blocked_by: [T-015]         # true technical blockers only
touches: [C-03, src/egress/]   # the fence: component slugs and/or paths
suggested_by:               # role, model@session, or human
builder:                    # model[@session]; empty = supertaskr.yaml default
verifier:                   # model[@session]; empty = default (independent)
built_by:                   # stamped at done
verified_by:                # stamped at done
review: independent         # independent | same-model | self-verified
---
```

- **id** — `T-NNN`; a finding filed from a lane is `T-NNN-sN`, and the
  suffix id is a real card id, not a slug. New ids are derived from the
  maximum over the whole tree including docs/tasks/rejected/, never
  counted, because counting reuses a spent id the moment anything is
  archived.
- **feature, milestone, priority** — the card's place on the story map.
  Priority is a unique integer per feature and milestone column,
  collision-checked across `planned`, `building` and `verifying`.
- **size** — S, M or L. Size is how long the work is; it sets the
  ceremony tier (chapter 06). An L card is never dispatched without the
  human's approval.
- **status** — eight values and no ninth. `closed` is not a status.
  Adding one is a method change with a version bump. The card-input
  gate refuses an out-of-vocabulary value at the point of writing.
- **blocked_by** — technical blockers only; preference orderings go in
  priority. At least one card per feature must be unblocked on day one.
- **touches** — the fence. Chapter 04.
- **builder, verifier** — the intent set at dispatch; **built_by,
  verified_by** — what actually ran, stamped at done. The session
  syntax: `codex` (default policy, fresh), `codex@fresh`,
  `codex@S3` (resume a registered session), `claude-opus-5@subagent`.
- **review** — provenance, not a strength ranking. `independent` and
  `same-model` are the same informational blindness with different
  hands; `self-verified` names a missing guarantee. A guard-class card
  (a hook, a gate, a keeper, a security control, anything whose job is
  to refuse) requires `review: independent`, set at the dispatch stamp.

## The body

```
<one paragraph: the summary a seat may read and stop at>

## Why this card exists          the why, with dated evidence
## Acceptance criteria           EARS lines, each enforceable by a test
## Implementation notes          appended by the executor before it ends
## Verdicts                      appended by the verifier, dated, stamped
```

- **The first paragraph is the summary**; everything below it is the
  record, read when a seat needs the world rather than the ask. The
  record stays: on a project run this way the record is the product's
  proof, and pressure to shorten a card is pressure to delete evidence.
- **Evidence carries its derivation**: run ids, commits, measurements
  with the command that produced them. A count in a criterion is a line
  number by another name (chapter 03).
- **`CARD CLAIM (<tracked file>): "<quoted string>"`** is a plain body
  line asking for one sentence to be checked: the card preflight opens
  that file at the integration ref and refuses the dispatch if the
  quote is not in it. A marker inside a fenced or indented block is an
  example, not a claim.
- **A proposed replacement carries its measurement or says it has
  none.** A remedy proposed beside a diagnosis is marked UNVERIFIED
  unless it carries the command and result that produced it.
- **Implementation notes** hold what was done, what to flag for the
  verifier, the least-confident point named, and every figure with its
  ref. The verifier reads the card at its base ref, so these notes are
  invisible to phase 1 by construction.
- **Verdicts** are dated, stamped `model@session`, cite the attack-set
  digest, and are APPROVED, APPROVED WITH ASSIGNED CORRECTIONS or
  REJECTED with reproducible failures. Vague objections are not
  verdicts.

## Where cards come from

Three sources, and only the architect creates `status: planned`:

1. **A planning pass** — genesis decomposition, or a milestone's own
   decomposition at its review (chapter 12).
2. **A lane's finding** — an executor, verifier or integrator files
   `status: suggested` with `suggested_by`, one paragraph of context, a
   class parent if one exists, and a one-line disposition hint. Search
   before filing: a second instance of a known class is a dated
   corroboration line on the parent, not a sibling file.
3. **A direct human request** — a new feature goes to the architect,
   which runs a mini-interview (who is it for, what is observable when
   it works, what does it displace), adds it to the backbone below the
   slice line, and decomposes.

An executor mid-build files a suggestion and returns to its task; a
discovery that blocks the task opens a room instead. A verifier's
non-blocking ideas are suggestions, never folded into the verdict.

## Triage: the three moves

The architect's duty on every suggestion, encoded so the board and the
parser agree:

- **Promote** — the planned card absorbs the suggestion: a dated
  `Absorbs: T-001-s2, …` line in its body, and the suggestion file is
  removed in the same commit. Or a new `planned` card is minted through
  the full decomposition rules; the suggestion is raw material and the
  rewrite makes it exact.
- **Park** — `status: parked` in place, with a dated note that names
  the event bringing it back. The default event is that the card's
  fence's component is next dispatched. A resurfaced card is re-derived
  at its own ref, never trusted.
- **Reject** — the file moves to docs/tasks/rejected/ keeping
  `status: rejected` plus a dated one-line reason. The reason says
  which happened: *discharged — the work landed at `<commit>`* or
  *declined — we are not doing this*.

There is no fourth move. A finding whose work landed elsewhere keeps
`status: suggested`, records the discharge in its own body naming the
commit, and waits for triage to make one of the three moves.

## Lifecycle

- Fields lock at dispatch (`status: building`) and unlock on
  `rejected` or `planned`.
- The dispatch stamp is written by the architect on the integration
  branch and committed **before** the lane is cut; the lane inherits it
  in its base and never writes that line. A stamp written after the cut
  is a false stamp for as long as the lane runs: other lanes compute
  disjointness from the integration branch's copy of `touches:`.
- `verifying` and `merging` are lane states. The executor stamps
  `verifying` inside its worktree; it reaches the integration branch
  only when the merge lands, and the checkpoint stamps `done` in the
  next commit. A board read between shows zero cards verifying while
  lanes are genuinely under verification; the lane list (`git
  worktree list`) is the honest reader.
- A card dispatched in halves stays `building`, with a dated body line
  naming which half is built, at which commit, and what the rest waits
  on.
- A rejected card goes to a fresh executor, never the author session.
  Two rejections stop the card when the same defect survives a rebuild,
  when a known cause was not closed, or when the fix lies outside the
  fence; the architect may waive once, in writing, on the card, naming
  which distinction it relied on. A third rejection is terminal: park
  and re-plan.
- At done: `built_by`, `verified_by` and `review` are stamped, and the
  integrator reads the committed blob back to confirm the stamps
  landed.

## What a program reads off a card

- The **board** (the mirror app, C-17 board model) renders columns from
  `feature`, the slice line from `milestone`, order from `priority`,
  ghosts from `suggested`, and provenance marks from `review` and the
  two `*_by` fields (ADR-016).
- The **dispatch order** (lib/parser readDispatchOrder) classifies
  every planned card as STARTABLE, fenced (its fence overlaps a live
  lane, named), unfenceable (a token no fence can carry), waiting (a
  blocker not done) or blocked.
- The **fence** (chapter 04) expands `touches:`.
- The **card-input checks** in the docs gate refuse an out-of-vocabulary
  status, a YAML title that fails to parse, and a frontmatter block the
  parser cannot read, at the point of writing.
- The **card preflight** (chapter 10) re-derives the paths, fence,
  figures, blockers and refs the card names.
