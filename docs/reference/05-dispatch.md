# 05 — Dispatch

Dispatch is the act that turns a planned card into a lane with a
session in it. Everything the session needs is derived from the sources
that own it, by a program, at a named ref, and written down where a
later session can find it. The spelling is
tools/e2e/scripts/brief.mjs (the runnable half) over
tools/e2e/scripts/dispatch-brief.mjs (the derivation); the act's
authority is method/roles/orchestrator.md step 5b; the brief's contract
is the thirteen-row table in method/roles/executor.md.

## The dispatch view

```
node tools/e2e/scripts/brief.mjs --dispatch --full
```

Run from the repo root by a seat with no lane. It reads the board, the
slug map and the live lane list once, and classifies every planned
card:

- **STARTABLE** — legal status, every `blocked_by` satisfied against
  live statuses, fence disjoint from every live lane.
- **fenced** — its fence overlaps a live lane, named with the witness
  path.
- **unfenceable** — a token no fence can carry (the unfenceable
  directory, an unresolved path), or criteria demanding a test body
  with no spec path in the fence.
- **waiting** — a blocker not yet done, named.
- **blocked** — a status that cannot start.

The lane list is filtered on the branch name pattern, never on the
path, and stamped with a clock and a host because a worktree's
existence is a live fact, not a function of a tree. The integration tip
and the base commit are stamped the same way: they are reads of a
mutable ref.

## The brief

```
node tools/e2e/scripts/brief.mjs --task T-NNN
```

emits the row set of the role's normative contract table, each row
derived from the source the row itself names. The row set is read off
method/roles/executor.md at the caller's ref, never transcribed into
the program; a row with no deriver is reported as NOT DERIVED. Every
figure is a record with provenance, and a record without one throws at
render.

| # | the brief carries | assembled from |
|---|---|---|
| 1 | Role — by path and in one line | the role file's opening line |
| 2 | Task — id, path, read IN FULL, confirm before touching | the card |
| 3 | Read-first set — the adapter's list minus the role's subtractions plus its additions | CLAUDE.md, then the role file; the role file wins |
| 4 | The lane — branch, worktree path, base as a hash, the create command | lane-protocol.md plus CONVENTIONS' spellings |
| 5 | The fence — `touches:` verbatim, every live lane with its fence, disjoint or not | the card, the lane list, the slug map |
| 6 | Setup — what a fresh worktree lacks and the order that restores it | CONVENTIONS' build order and lane rules |
| 7 | Commands — build and test, verbatim | CONVENTIONS |
| 8 | Gates — each standing gate and its trigger, so the session derives fire or not-owed | CONVENTIONS' gate bullets |
| 9 | Standing disciplines — drills included | CONVENTIONS |
| 10 | Prohibitions — shared processes, live ports, other lanes' trees | CONVENTIONS plus the live environment at dispatch |
| 11 | The deliverable — the ceremony row, the status to stamp, notes and findings owed, whether to merge | the ceremony table, lane-protocol.md, the role file |
| 12 | The report — what to say, to whom, in what form | the role file's report section |
| 13 | The correction clause — re-derive every figure at your own ref; say where the brief is wrong | itself |

Rules over the whole brief: it is a transcription, not a summary; every
figure carries its ref or is left out; it is evidence, never authority,
and where it contradicts the repository or the role file it cites, the
repository or the role file wins and the session says so; nothing in it
may be the only copy of itself; executor-derived facts go below a marked
line in any brief that has one.

Below the rows, labelled as not one of them, the assembler prints the
advisory recommended-seat line (T-157, ADR-020): a seat strength derived
from the card's size, fence kind and criteria shape, never a model,
outranked by the card's `builder:` field and the role file's run
hygiene. The project passes no `--model` (ADR-003).

## The card preflight

```
node tools/e2e/scripts/brief.mjs --task T-NNN --preflight
```

The step between the brief and the fence (T-160, T-230,
tools/e2e/scripts/card-preflight.mjs). It re-derives at HEAD every
claim the card makes that is derivable, and refuses the dispatch when
one no longer holds. Every arm answers in three parts: what it checked
and found sound, what it found (a finding refuses), and what it cannot
check.

- Paths named in the acceptance criteria and the frontmatter exist;
  globs, truncations and git-ignored paths are subtracted first. Fence
  coverage of cited paths is reported, never refused on, because a
  criterion routinely cites a file it only reads.
- The fence expands, through the parser's own `readDispatchOrder`.
- The stated blocking reason still holds: the derivable claim is
  held-by-a-live-lane, which fires in the low single digits over the
  board and was genuinely stale every time.
- Stamped figures are re-run through the closed `CARD_DERIVERS`
  vocabulary in tools/e2e/scripts/card-figures.mjs and compared
  character for character; a figure whose deriver is not in the
  vocabulary is reported as unrunnable. The preflight never executes a
  shell command a card quotes.
- `CARD CLAIM` markers are opened at the integration ref and the quoted
  string must be in the named file.
- Refs the card cites resolve.

It judges no desirability. The dispatcher still audits the card's
non-derivable assertions by hand, because three of four cards dispatched
in one sitting carried a false assertion and every preflight ran green.

## The dispatch stamp and the lane cut

1. Write `status: building` (and any `builder:` / `verifier:` intent,
   and `review: independent` for a guard-class card) onto the card on
   the integration branch and commit it, stage-and-commit in one
   motion, leaving nothing staged.
2. Cut the lane from that commit: `git worktree add
   ../nputer-T-NNN -b task/T-NNN-<slug> <base hash>`. The worktree is a
   sibling directory with an absolute path; the base is a green
   commit stated as a hash, never a merge commit. The lane and bench
   spellings below still carry the pre-rename name: they are siblings of
   the repository DIRECTORY, which is @human's to rename (ADR-022
   decision 4, T-266), and they move with it in T-264-s3 — not here.
3. Arm the fence: `--write-fence`, then read the manifest back.
4. Cut the verifier's bench at the same moment: a detached sibling
   worktree (`nputer-V-T-NNN`) at the same base, holding no manifest.
   Phase 1 of verification consumes nothing the executor produces, so
   running it later is serial dead time at the end of every lane.
5. Hand the brief to a fresh session. Phase 1 of the bench runs in
   parallel with the build.

## The one-command arm

```
node tools/e2e/scripts/brief.mjs --dispatch-lane T-NNN --slug <slug> \
  --executor <model@session-kind> --verifier <model@session-kind> \
  --scratch <dir>
```

T-239 made the eight hand steps one arm: stamp, cut, preflight, fence,
manifest read-back, bench, brief, port. It writes nothing the hand
steps did not write, prints a ledger of every write, and `--dry-run`
prints the plan without performing it. The arm's step-1 commit needs a
git identity; on a CI runner without one it exits 128 (T-239-s4 gives
the seat an identity of its own).

## Machine-scoped surfaces

Some surfaces are scoped by the machine, not the checkout, and two lanes
with disjoint fences still share them. The rule (lane-protocol rule 4):
derive the value from the lane, never default it.

- **The e2e port** — `SUPERTASKR_E2E_PORT=15000+<card number>`; the default
  14520 is machine-wide. Port 1420 belongs to the human's live app and
  is refused, never borrowed.
- **Scratch files** — `<purpose>-<card id>.<ext>`; the scratchpad is one
  directory shared by every seat a session spawns.
- **The attack set and ground truths** — `attack-set-<card id>.md`,
  hashed with `shasum -a 256`.
- **The solo lock** — a timing bench and a full suite must not run
  beside each other; gate-run refuses the second and names the holding
  pid.

## The seat lock

```
node tools/e2e/scripts/brief.mjs --take-seat
node tools/e2e/scripts/brief.mjs --release-seat
```

The integration checkout has one holder at a time (T-238). The holder
record lives in `.supertaskr/holder.json`, gitignored; a second seat that
tries to take it is refused and told who holds it. The holder is
declared at dispatch, never inferred: the brief's deliverable row says
explicitly whether the lane merges, and a lane that was not told does
not take the seat. It reports ready-to-merge naming its branch and tip,
leaves its worktree standing, and stops.

## What dispatch deliberately leaves to judgement

Which ceremony row a size-S card falls on (the table gives two and only
a reader can say whether the diff touches shipped code); the lane's
slug; whether a discipline applies to this card. The assembler emits
these as the documents state them, with the choice named and left to
the dispatcher, because a tool that guesses them produces exactly the
confident wrong sentence the brief command exists to stop.
