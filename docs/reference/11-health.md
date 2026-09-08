# 11 — Health

The method watches itself with declared control bands, a suggestion
metabolism, stamped seat economics and a canned eval set. Nothing here
gates a merge; it reports, and a breach lands on the board as work.

## The health bands

`npm run health -- --readings <file>` from tools/e2e/ (the `--` is
load-bearing; without it npm eats the flag). The bands are data in
tools/e2e/scripts/health-bands.config.mjs, run by health-bands.mjs,
each with an id, a unit, a drift line, a breach line, an authority
(the command or census that produces the reading) and a keeper. The
census line is what moves: *N bands: I inside, D drifting, B BREACHED,
U unread, K UNKEPT*. Exit 3 is the designed answer while any band is
unkept, and it is stamped in every checkpoint record, never read as
clean and never "fixed".

| band | unit | drift | breach | authority |
|---|---|---|---|---|
| docs-headroom/<doc>, one per budgeted governing document (STATE, ROADMAP, ARCHITECTURE, CONVENTIONS) | % of the warn line | 10 | 2 | `wc -c` against DOC_BUDGETS |
| graph/budget-headroom-bytes | bytes | 63004 | 15751 | `index --check` |
| suite/lib-seconds | seconds | 9.5 | 14.6 | `cargo test` from app/src-tauri/ |
| suite/e2e-seconds | seconds | 234 | 312 | `npm test` from tools/e2e/ |
| triage/live-suggestions | cards | 20 | 40 | the flat docs/tasks/ frontmatter |
| triage/oldest-suggestion-days | days | 5 | 15 | `git log --diff-filter=A` per live suggestion |
| triage/net-arrivals-per-window | cards | 9 | 40 | `git log --diff-filter=A/D` over docs/tasks/ since the newest `Checkpoint:` commit |
| machinery/gate-seconds | seconds | unkept | unkept | the checkpoint's `Gate runtime:` line, carried by hand |
| north-star/cold-start-pass-rate | % of switches | unkept | unkept | the checkpoint's `Cold start:` line |
| north-star/drift-incidents | incidents per milestone | unkept | unkept | the checkpoint's `Drift incidents:` line |
| north-star/rejection-rate-by-size | % rejected, by size | unkept | unkept | verdicts carry no ratified marker yet |

Fourteen bands in all. A document that gains a budget gains a band. The
suite and graph readings come from the gates the checkpoint already
ran, captured with a redirect and handed in; the three record-borne
readings reach the command by hand, because no program may walk
docs/checkpoints/. A band declared with no keeper is UNKEPT, honestly,
until a card gives it one; the retirement condition of each is written
beside it.

## The suggestion metabolism

Filing is cheap and mandatory: a lane's context dies with its session,
so anything it noticed lands as a card or is lost. Volume control
happens at triage, not at filing (chapter 02):

- **Triage at the stamp** — a done card's suggestion train is disposed
  of within one dispatch cycle of the card closing, while the context is
  hot.
- **Corroboration over duplication** — a second instance of a known
  class is a dated line on the parent card, not a sibling file.
- **The disposition hint** — the filer's one line about what should
  happen, advisory, because the filer knows and the triage seat arrives
  cold.
- **Absorption** — several findings on one paragraph or one seat become
  one edit on the card that owns it.
- **Needle checks** — a finding whose work already landed is discharged,
  naming the commit, not built.
- **The amnesty sitting** — when the queue outgrows the metabolism, one
  batch sitting triages the whole backlog (140 cards in one sitting on
  2026-08-29, about 3.4k tokens per card), then the standing per-arrival
  rules resume.
- **Parked is a condition, not a shelf** — every parking note names the
  event that brings the card back, and a resurfaced card is re-derived.

The three triage bands watch the queue's size, its oldest member's age
and the net arrivals per window.

## Seat economics

Every checkpoint record stamps `Tokens:` per seat and summed, read off
the session meters; `Gate runtime:` per gate and summed; `Rework
cycles:` from the card's verdicts; and the dispatch-to-merge elapsed
time. These are live-environment facts and carry a clock, never a
commit. The trend is derived over docs/checkpoints/ by whoever asks,
never transcribed. The stamped series so far runs from about 190k
tokens for a small verification pass to about 550k for a long
executor arc on a guard-class card; the numbers in the records are the
authority and this sentence is a pointer.

The advisory recommended-seat line on every brief (T-157, ADR-020)
names a seat strength from the card's shape; the card's `builder:` and
the role's run hygiene outrank it. Model assignment per seat is
recorded as what ran, so cost and quality can be read per model and
per size. The context pack (planned: T-254) is the next cost move: an
executor reads the method's protocol files and the brief's quoted
overlay rather than CONVENTIONS whole.

## The method evals

tools/method-evals/ holds a canned task set for the process itself
(chapter 10 lists them): brief assembly at a fixture ref, cross-
reference resolution, vocabulary agreement, role openings, the settled
review-claims corpus, the two-spawn single source, the digest refusal,
and the four MIL evals that drive a verifier and an executor against
planted fixtures. Stamped mistakes become fixtures; dismissed findings
tune the band limits that produced them; disagreements between seats
become reconciliation cards for the next method release.

## Where improvement comes from

The loop eats its own exhaust. Findings from building, verifying,
merging, CI and the health watch all land as suggestion cards; triage
metabolises them; dispatch sends the next one out; and process changes
travel as cards through this same loop, each with its retirement
condition, so a machine whose incident class has gone quiet for the
interval its condition names is demoted to a discipline or removed,
with the removal recorded at the same weight as the arrival.
