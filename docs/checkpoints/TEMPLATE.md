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

## Dispositions

Cards stamped, suggestions filed, rules applied by name.
