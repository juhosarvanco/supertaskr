---
id: T-054
title: Retire the interim graph rule — make `index --check` the gate CI actually runs
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
blocked_by: []
touches: [docs, tools/e2e, ci]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-014-s8 (architect, 2026-08-17). The suggestion file is
removed in the same commit as this card. T-014 drafted the retirement
and deliberately did not apply it ("DRAFTED FOR THE INTEGRATOR — not
applied here"); T-014's verifier then measured that the draft can no
longer be applied alone. This card carries both halves plus the
architect ruling the retirement was waiting on.

## The finding that decides this card

`docs/CONVENTIONS.md`'s INTERIM integrator rule says it "retires when
T-014's `nputer index --check` becomes the gate". T-014 shipped that
command. So the question was framed as *may we now retire a rule?* —
and framing it that way hid what was actually measured while writing
this card:

**CI has never gated graph currency. Not once.**

- `.github/workflows/ci.yml:127` runs bare `cargo test`, which SKIPS
  `#[ignore]`d tests.
- `self_graph_is_current` — the byte-comparison against the committed
  `docs/architecture/graph.json` — is `#[ignore]`d
  (`crates/nputer-index/tests/self_graph.rs:58`). Its own module doc
  calls itself "the manual `--check` stand-in until T-014".
- `git grep nputer-index -- .github/` returns **zero**. There is one
  workflow file.

So a stale `graph.json` passes CI green today. The dogfood fixtures
assert against the committed graph, so a stale graph and fixtures that
match it agree with each other perfectly. **The only thing that has
kept the graph current is the written ritual and twenty-six
conscientious integrators.** This is not a retirement of a redundant
rule; it is the closing of a gate that has been open the whole time.

## The ruling — `index --check` is a CI step, and here is why not the alternatives

- **NOT `cargo test -- --include-ignored`.** That sweeps in
  `tests/perf.rs`, which is `#[ignore]`d precisely "so the default suite
  never flakes" and which requires a RELEASE build — its own docs say
  "debug numbers are not the criterion", and CI builds debug. (It would
  also REACH `agent_runner.rs`'s real-CLI smoke, but that one is
  additionally env-gated on `NPUTER_REAL_CLI=1` and would skip safely —
  stated accurately rather than as a scare. The perf harness is the
  real objection.)
- **NOT un-`#[ignore]`ing `self_graph_is_current`.** That makes local
  `cargo test` go red whenever anyone edits unrelated TypeScript — the
  exact ergonomic its module doc protects on purpose ("stays hermetic to
  unrelated TS edits and never dirties the working tree").
- **`index --check` as its own CI step** gates the property, leaves
  local `cargo test` hermetic, and touches no other ignored test. It is
  also the disposition T-014's own `Absorbs:` note asked for.

## Acceptance criteria
- THE change SHALL land as ONE commit touching `docs/CONVENTIONS.md`,
  `tools/e2e/tests/workflow-parity.spec.ts` and
  `.github/workflows/ci.yml`. Applying the CONVENTIONS half alone REDS
  the e2e lane by name — T-014's verifier measured it: 11 passed
  baseline, `1 failed, 10 passed` with the drafted block applied, the
  failure naming `index --check`, `index --watch` and `arch` as
  commands the spec has no entry for. **Reproduce that measurement
  before fixing it**, so the commit is known to close a red rather than
  to have never seen one.
- `nputer-index index --check` SHALL be a `CI_SEQUENCE` step placed
  after the cargo suite, with the matching step in `ci.yml`, and it
  SHALL actually fail CI on a stale graph. **Prove it by making the
  graph stale on a scratch copy and watching the command exit
  non-zero** — a gate nobody has seen fail is a gate nobody has seen.
  Record the exit code and the message.
- `index --watch` and `arch` SHALL be `LOCAL_ONLY` with their reasons
  recorded in the spec: a watcher runs until stopped, and `arch` is a
  reporter rather than a gate.
- THE interim rule (T-009-s1) SHALL be retired from `docs/CONVENTIONS.md`
  in the same commit and NOT before — retiring the ritual while CI still
  does not check would leave the property enforced by nothing at all.
  The regen command itself STAYS documented: `--check` detects a stale
  graph but does not produce a fresh one, so integrators still need
  `NPUTER_UPDATE_GOLDEN=1 …` and still commit the result. What retires
  is the obligation to hand-run the byte-comparison, not the regen.
- THE wording of the CONVENTIONS block SHALL be chosen deliberately
  against the spec's own parser, not left to chance. T-014's verifier
  found the derivation "ends at the first `·` segment that does not open
  with a backtick", so **the sentence structure decides which commands
  are visible to CI parity at all** — it flagged three of the five
  backticked commands in the draft. Enumerate which commands your final
  wording exposes, print that list, and confirm it is the list you
  intended. Do not trust the three reported problems to be the complete
  set.
- THE claim at the head of this card SHALL be re-verified first-hand and
  reported: that bare `cargo test` skips the ignored test, that
  `self_graph_is_current` is the only thing byte-comparing the committed
  graph, and that `.github/` mentions `nputer-index` zero times. **If any
  of it is wrong, say so and stop** — the whole ruling rests on it, and
  an architect's premise is evidence to reproduce like any other.

Verification: headless — the reproduced red, the green after, the
staleness proof with its exit code, the exposed-command enumeration, and
the full tools/e2e suite. No app code, no Rust code: this task changes
documentation, a spec's tables and a CI workflow only.

## Implementation notes

## Verdicts
