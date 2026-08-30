# Checkpoint record template (ADR-019)

Copy to `docs/checkpoints/<YYYY-MM-DD>-T-NNN.md` at each integration,
BEFORE docs/STATE.md is regenerated. Append-only: written once, never
edited (the T-101 precedent applies here in full force). No suite,
gate or generator may DEPEND on this directory's contents (ADR-019's
Records clause) — the two e2e specs that walk all of docs/ walk these
files as app content, and that is all they may ever be to a program.

Everything narrative that today's STATE.md carried belongs here; what
survives into the regenerated STATE is the MECHANISM, with the
INSTANCE stamped in this record and nowhere else.

---

# Checkpoint: T-NNN (<date>, <integrator>)

## Merge

Parents, ranges — every dot count stated at its own ref — the
merge-tree forecast with its exit read from `$?` first, and
disjointness proved as two named sets.

## Gates

GRAPH REGEN · BOOT GATE · DOCS GATE — each trigger derived on the
merge's own paths, verdicts and exits read unpiped, a skipped gate
named loudly with its reason.

GRAPH, asked LAST: `index --check` run AFTER this record's final
write and after every fixture reconciliation — paste its verdict and
budget line here verbatim. A checkpoint once regenerated the graph,
kept writing, never re-asked, and left main at exit 1 (T-150-s3);
this slot exists so that sequence cannot complete quietly. An empty
slot is a skipped gate, and a skipped gate is news, never silence.

## Suites

Every run declared with COUNT and EXIT, including the ones that
agree; bodies read by name where a name is load-bearing.

## Board

Movements derived on disk at this ref, stating which movements are
this merge's and which arrived outside its range.

## Environment

Live-environment facts stamped with their clock — worktrees, ports,
pids, the running app. The mechanism is the finding; the instance is
stamped here and re-derived never.

## What the brief got wrong

Facts · predictions · arguments · staleness — the standing section
every integrator brief so far has earned.

## Metrics (ADR-020)

Leading, derived at this checkpoint: rework cycles this card
(dispatch → verdict count), suites re-run before green (count per
suite), dispatch-to-merge elapsed. Lagging, pointers only: the trend
lives across records — derive it over docs/checkpoints/, never
transcribe it here.

**THREE STAMPED LINES, AND SILENCE IS NOT ONE OF THE ANSWERS** (T-157).
Write each of them, in this order, every time:

- `Rework cycles:` — dispatch → verdict count for this card, derived
  on the card's own Verdicts section at this ref.
- `Tokens:` — spent this card, **per seat and summed**: executor, any
  fix pass, verifier, any re-verification, and the integrating seat
  where it was a separate one. Read off the session usage meters.
- `Gate runtime:` — the wall clock of the gates this merge OWED, per
  gate and summed, each named with the trigger that owed it. Read off
  a timer around the gate command itself, not around the checkpoint.

**THE LAST TWO ARE LIVE-ENVIRONMENT FACTS AND CARRY A CLOCK, NEVER A
COMMIT.** A meter reading and a wall clock are not functions of a tree
— `roles/executor.md`'s figure rule names that exception in as many
words — so they are STAMPED here with what they were read off and
when, and re-derived never. Every other figure in this record carries
the ref it was measured at; these two carry the reading instead, and a
token count wearing a commit ref is wrong in a way no later reader can
detect.

**A LINE THIS CHECKPOINT COULD NOT MEASURE SAYS SO AND SAYS WHY.**
Write `not derivable here` followed by the reason — the meter was not
readable from this seat, the gate was not owed, the arc crossed a
session boundary and the earlier half is unrecoverable. Never drop the
line, and never write the phrase bare: an empty metrics line is the
empty GRAPH slot above, and a skipped measurement is news rather than
silence. `not derivable here` with no reason is silence wearing a
sentence — and the bare form is already in the record three times, each
deferring to this card, which is the debt this section closes.

**NOTHING MAY READ THESE LINES BACK.** ADR-019's Records clause holds
in full: no suite, gate or generator may depend on this directory's
contents, so the shape above is a WRITING instruction and not a schema
anything parses. A reporter a human or a checkpointing integrator runs
BY HAND over the records is fine; a gate is not. That is why the trend
is derived by whoever asks for it, at the moment they ask — and why
nothing here promises that a machine will notice a line gone missing.

## Dispositions

Cards stamped, suggestions filed, rules applied by name.
