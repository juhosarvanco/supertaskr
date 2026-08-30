# Checkpoint: the second rulings sitting — @human answered eight open items in one pass, and the model question turned out to be a gap rather than a wording call

Date: 2026-08-30. Seat: architect/integrator (the seat that took over
today). Scope: eight @human rulings recorded across four cards, two
rooms and the roadmap; one new card filed from what a ruling exposed;
`T-178` corroborated and its second measurement taken. No merge — the
whole sitting is `docs/tasks/**`, `docs/rooms/`, `docs/business/`,
`docs/ROADMAP.md` and this record. Two lanes were live throughout and
neither was touched.

## Why this record exists separately from the triage sitting's

Standing triage sitting #4 (this morning's record) dispositioned cards.
This is the other half: the items that sat on @human's desk, none of
which a seat may rule. **Eight came back in one pass**, which is the
largest single clearing of that queue on record, and three of them
changed what the pipeline may do next. Keeping them in commit messages
alone would have scattered one decision session across six commits.

## The eight, and what each one moved

| item | @human's ruling | what it moved |
|---|---|---|
| `T-140-s4` (the graph limit) | **raise the budget** | released the card that had been parked on it; the whole code queue behind it |
| `T-140-s4`'s sub-decision | **retire `map-too-large`** | discharged the hold; the lane went out |
| milestone 3 | **close it** | the walk closed it; the roadmap says so |
| `T-162-s1` (budget formula) | **byte FLOOR, no delta budget** | the room's RESOLUTION; the card promoted from argument to implementation |
| `T-154-s4` (merge carve-out) | **keep it** | the fourth carve-out becomes @human's rather than an executor's |
| version partition | **approve as drafted** | the standing rule stops being a wall; entry 03 gated on the form decision, deferred |
| `T-169-s2` (two-model stamp) | **honoured** | the landed behaviour is correct; `T-020`/`T-024` stay clean |
| M4 strategy | **A**, and narrower than option A's text | the channel move declined outright, not kept as a tactic |

## THE RULING THAT WAS NOT A RULING — the model question

@human answered `T-169-s2` in one clause (*"The cards can name two
models, that is fine"*) and then asked the question underneath it:
*"Is the decision of the model honored by Claude and Codex?"*

**The answer is NO, and the derivation is the sitting's most valuable
output.** At `2489b0f`:

- **D5 is RULED AND BINDING** (`docs/rooms/cockpit-or-mirror.md`,
  2026-08-30): the models the human assigns do those tasks as assigned;
  every adapter ENFORCES where its CLI can be told, and where a spawn
  path cannot force it, nputer VERIFIES and flags the mismatch.
- **The verifying half exists; the enforcing half does not.**
  `app/src-tauri/src/agent/adapter.rs:126` and `:763` state the property
  in the code's own words — *"we never pass `--model`"*, ADR-003, the
  user's CLI default IS the model. The only occurrence of the string in
  that file is in the list of flag NAMES the argv rule refuses in a
  value position. `tools/e2e/tests/session-economics.spec.ts` says the
  same from the other side: the recommendation *"names a seat strength
  and never a model, because this project passes no `--model`"*.
- **So a card can name a model that nothing will ever read.** Today the
  assignment is honoured by whichever session dispatches BY HAND —
  including this one, which set the model explicitly on both executors
  it launched. That is a discipline, not a property, and converting
  disciplines into properties is what this project does.

Filed as **`T-180`** (F-05, size L) — **and PARKED the same day, by
@human, who corrected the card's framing before it could be dispatched:**
*"its not a either or question. Its a question of how much is steered
from nputer and how much is steered from Claude or Codex. So dont execute
the new card yet."*

**THE SEAT PUT THE QUESTION WRONGLY AND THE CORRECTION IS THE MORE USEFUL
OUTPUT.** The card asked WHERE the loop runs — Claude Code, Codex, or the
app — as three doors. It is a DIAL, and the answer may differ per CONCERN
(interview, build, verify, architect). A card offering three doors cannot
carry that answer, so the question moved to a room —
`docs/rooms/steering-split.md`, opened at this ruling with four dial
positions and four questions, including the one the card never asked:
what a user who prefers their own CLI gets. `T-180` resurfaces on that
room's RESOLUTION and nothing else.

**Parking costs nothing today and the record says why**: the gap is live
but inert while dispatch is hand-driven, because every dispatching
session reads `builder:` off the card and sets the model itself. The
residual is that this is a DISCIPLINE — if a dispatcher forgets, nothing
catches it at spawn and only `T-169`'s after-the-fact flag notices.

## What a ruling changed that the ruling did not say

**The graph raise is capped at 8,575 bytes on its own** — derived at
`2370144` when the ruling arrived, and it is why the card grew a third
slug. `max_graph_bytes` (1,040,000, `crates/nputer-index/src/lib.rs:160`)
sits under the docs collector's `MAX_FILE_BYTES` (1,048,576,
`docs_watch.rs:158`), coupled by
`the_emit_budget_stays_below_the_collectors_file_cap`. Raising the budget
ALONE spends the gap that keeps DEGRADATION in front of the CLIFF — which
is precisely what `T-151` was rejected for earlier the same day. Removing
the graph from the collector, this card's own step 1, dissolves the
coupling instead of overruling that rejection. **The ruling and the
removal are one lane in one order**, and the card says so.

**And strategy A came back narrower than the option text.** Option A kept
registering against Linear/Jira/Plane as a distribution tactic; @human
declined it outright — *"I'm not sure why i would want to build a Jira or
Linear integration, as our product is so similar."* Recorded with the
distinction the room needs to keep: what was rejected is the DELIVERY
VEHICLE, not the verdict's standing as the differentiator.

## THE INCIDENT-CLASS LEDGER — the 18d8166 rule paid for itself

The rulings were applied with an edit script. **It exited 0 and produced
a broken file.** `T-154-s4` already carried placement fields that the
minimal walk cards lacked, so the same insert that was correct for four
cards duplicated `feature`/`milestone`/`priority`/`size`/`blocked_by` on
that one — an unparseable card, from a script that reported success.

`npm run lint:docs` answered **exit 1**, naming the file, the line and
the column (*"Map keys must be unique at line 7"*), and
`npx vitest run` from lib/parser answered **1 failed / 335 passed** on
`smoke.test.ts`'s zero-issues assertion. Repaired, keys proved unique by
reading them back, gates re-run green — **before any commit existed**.

This is the rule from `18d8166` working as designed one day after it was
written: an edit script's success is a GATE, not a step. It is also the
DOCS GATE's own case — a docs-only diff that would have redded three
suites, caught by running them rather than by reasoning about them.

## `T-178`, corroborated and measured

The fixture-teardown `ENOTEMPTY` filed this morning **redded main**
(CI 33333142954, tip `2489b0f`, a docs-only commit) — its second sighting,
same mechanism, different path depth (`.git` where the first was
`.git/objects`), the failure again raised from teardown AFTER the body's
assertions passed. The `e2e lane` step's failure skipped the boot gate
behind it, which is the cost the card predicted.

**Second measurement: the same job re-run on the same commit came back
SUCCESS** (attempt 2). So the race is intermittent and rare rather than
reproducible — and the card carries the caution with the result, because
re-running until green is a defect's healing mechanism and not evidence
about it.

## Gates

- `npm run lint:docs` from tools/e2e — **exit 0** (after the repair; the
  failing first run is the incident above)
- `npx vitest run` from lib/parser — **336 passed, exit 0**
- `npm test` from app/ — **1060 passed, 49 files, exit 0**
- `npm test` from tools/e2e — **NOT RUN AT THIS SEAT, and that is
  disclosed rather than skipped quietly**: two lanes were building
  throughout and the e2e lane is the long, CPU-contending gate. CI ran it
  on every push in this sitting; the DOCS GATE's third named suite is
  therefore held by CI here rather than by hand, which is a weaker
  guarantee than the other two and is stated as such.
- **GRAPH: not asked** — docs-only diff, `docs/` outside the walk, and
  the same deviation sittings #2, #3 and #4 record for the same reason.
- **BOOT GATE / METHOD EVAL GATE: not owed** — no `app/src/**`,
  `app/src-tauri/**`, manifest or `method/**` path in this diff.

## CI

Green on the sitting-#4 merge (33331819651). One run CANCELLED as
superseded (33332559101) — a newer push, not a failure. One FAILED
(33333142954, `T-178`) and passed on re-run. Running at this record:
33334447575 on tip `366e199`.

## In flight at this record

- **`T-112-s3`** (the brief applies the role file's reading step) —
  executor building, lane `/Users/ujju/Projects/nputer-T-112-s3`.
- **`T-140-s4`** (graph leaves the collector, budget rises, banner
  retired) — executor building, lane
  `/Users/ujju/Projects/nputer-T-140-s4`. Its merge is the one that ends
  the 410-byte hold.

## Owed after this record

- **@human — the STEERING SPLIT**, now a room rather than a card's two
  questions (`docs/rooms/steering-split.md`): how much is steered from
  nputer and how much from Claude or Codex, answered per concern. Also
  standing: the FORM decision, deferred to 2026-08-31, which gates
  version 1's customization-by-interview entry.
- **The next sitting**: `T-178` wants to be next in `tools/e2e` — two
  reds in one evening, both on other people's work.
- `docs/CAPABILITIES.md` untouched — no spec file moved.

## Metrics (ADR-020)

@human items cleared: 8, in one pass. Cards filed: 1 (`T-180`).
Corroborations: 1 (`T-178`), with its second measurement taken rather
than assumed. Rulings taken at the seat: 0 — every ruling here is
@human's, which is the point of the sitting. Incidents against this
seat: 1, caught by a gate before it reached a commit. Lanes before and
after: TWO, untouched. Tokens and wall clock: NOT DERIVABLE at this seat
— no meter was read, and this record refuses to invent them.
