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

HEALTH BANDS — **a REPORTER, never a fifth gate** (T-156; this line is
the half its fence could not write, routed as T-156-s1). Run it from
tools/e2e/ once the gates above have produced their output, and stamp
the CENSUS LINE and the EXIT here, read unpiped:

    npm run health -- --readings <this checkpoint's captured output>

**THE `--` IS LOAD-BEARING AND ITS ABSENCE IS LOUD RATHER THAN SILENT**
(measured at `8c210b2` on npm 11.12.1): `npm run health --readings
<file>` warns `Unknown cli config "--readings"`, eats the flag, and
hands the script the bare path — which it refuses, *"this command takes
flags, never paths"*, **exit 2**. The same npm behaviour the PORT RULE
measures on `npm run tauri dev -- --config`.

WHAT GOES IN THE READINGS FILE is the output of gates this checkpoint
ALREADY RAN, captured as they run — `cargo test` and
`cargo run -p nputer-index -- index --check --root ../..` from
app/src-tauri/, `npm test` from tools/e2e/. Without them the three
readings-authority bands (`graph/budget-headroom-bytes`,
`suite/lib-seconds`, `suite/e2e-seconds`) are reported UNREAD, which is
honest and is not a reading. **CAPTURE WITH A REDIRECT, NOT A BARE
PIPE**: `cmd 2>&1 | tee file` hands you *tee's* status, and every
verdict in this section is read unpiped by rule — redirect to the file
and read `$?` from the gate itself, or set `pipefail` before the pipe.

THE GRAPH BAND'S READING IS THE INTEGRATOR'S AND CANNOT HONESTLY BE A
LANE'S: `index --check` is its authority, and a worktree that has built
anything with cargo carries its own `target/` inside the graph walk
(T-153-s3, T-111-s10 — a non-`target` target directory is inside the
walk). Take that reading from the checkout this merge is integrated in,
or say the band was not read and why.

**EXIT 3 IS THE DESIGNED ANSWER WHILE ANY BAND IS UNKEPT — never read
it as clean and never "fix" it** (docs/STATE.md says so in as many
words). Stamp the census rather than the code alone: the code is the
same 3 at every ref today, and *"N band(s) — I inside, D drifting, B
BREACHED, U unread, K UNKEPT"* is the part that moves.

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

**FIVE STAMPED LINES, AND SILENCE IS NOT ONE OF THE ANSWERS** (T-157's
three; the last two are T-156-s1's, and each one is a health band's only
marker). Write each of them, in this order, every time:

- `Rework cycles:` — dispatch → verdict count for this card, derived
  on the card's own Verdicts section at this ref.
- `Tokens:` — spent this card, **per seat and summed**: executor, any
  fix pass, verifier, any re-verification, and the integrating seat
  where it was a separate one. Read off the session usage meters.
- `Gate runtime:` — the wall clock of the gates this merge OWED, per
  gate and summed, each named with the trigger that owed it. Read off
  a timer around the gate command itself, not around the checkpoint.
  **THE SUM IS `machinery/gate-seconds`'S ONLY READING** — that band is
  declared with no keeper precisely because no record stamped a total,
  and this line is the total.
- `Cold start:` — this session's own cold-start outcome
  (method/README.md's test: the incoming session reads only the folder
  and explains the project, the state, the next dispatch and why).
  Write whether this session was a model or session SWITCH, whether it
  passed FIRST TRY, and every gap it had to ask about — each gap is a
  documentation bug, and naming it here is how it becomes one.
  `north-star/cold-start-pass-rate`'s marker.
- `Drift incidents:` — work in this window that contradicted
  docs/NORTH_STAR.md or docs/ARCHITECTURE.md and was caught by a
  verifier or a human, one dated line each pointing at the verdict,
  room or card that caught it. **`0` IS A READING AND IS WRITTEN AS
  ONE.** `north-star/drift-incidents`'s marker.

**THE LAST TWO ARE OWED BY THE SESSION, NOT BY WHOEVER NOTICED A
PROBLEM — THAT IS THE WHOLE OF WHY THEY ARE HERE** (T-156-s1, carrying
T-156-s2's argument). A cold start that went badly is exactly the one
nobody writes up, and a drift incident is recorded by the seat that
caught it or by nobody; a denominator that only collects successes is
worse than no band at all, because it reads as evidence. So both lines
are owed at EVERY checkpoint, whatever happened, and a clean window
says `0` rather than nothing. **AND THE DENOMINATOR THEY BUILD IS
NAMED, NOT ASSUMED**: it is switches and windows that REACHED A
CHECKPOINT, which is not every switch — a session that never integrates
writes no record — so whoever gives these bands an authority reads the
census as a floor and says so, rather than as a rate over all sessions.

**`Tokens:` AND `Gate runtime:` ARE LIVE-ENVIRONMENT FACTS AND CARRY A
CLOCK, NEVER A COMMIT** (and `Cold start:` belongs to a session the same
way). A meter reading and a wall clock are not functions of a tree
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

**AND THAT IS BINDING ON THE HEALTH BANDS TOO, WHICH IS WHY THEIR
KEEPER IS A HAND AND NOT A SCANNER** (T-156-s1). The three lines above
that a band names are markers, not a table: `npm run health` may never
walk docs/checkpoints/ for them, because ADR-019's clause does not bend
for a reporter. They reach the command the one way a record's contents
are ever allowed to reach a program — carried BY HAND into a
`--readings` file at the checkpoint that wrote them, the same path the
suite and graph readings already take. A later card that gives these
bands an `authority` reads that as its constraint: `kind: "readings"`
with the marker named in words, never a walk of this directory.

## Dispositions

Cards stamped, suggestions filed, rules applied by name.
