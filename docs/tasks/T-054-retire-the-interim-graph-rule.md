---
id: T-054
title: Retire the interim graph rule — make `index --check` the gate CI actually runs
feature: F-06
milestone: 4
priority: 3
size: M
status: planned
blocked_by: []
touches: [docs, method, tools/e2e, ci]
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

Also absorbs: T-014-s3, T-045-s1, T-045-s4, T-049-s1 (triage
2026-08-17, merged into this card rather than given a second one).
All four land in the same three files this card already opens —
`docs/CONVENTIONS.md`, `tools/e2e/tests/workflow-parity.spec.ts` and
`.github/workflows/ci.yml`. Their suggestion files are removed in the
same commit as this line. Sized S to **M** on that merge.

**One criterion that WAS in the triage draft is already discharged and
is deliberately absent**: "both gate bullets name which diff they
read" (`<main-before>..HEAD`, six integrators having hit it) landed
early in **`98f931e`**, before the triage was applied, in both bullets,
with the 9-against-36 measurement and the honest limit that it has
never changed *whether* a gate fires — only what the checkpoint claims
was touched. Do not re-do it; read it as context for the wording of
everything below.

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

### Merged in at the 2026-08-17 triage

- THE INTERIM RULE'S WORDING SHALL MATCH WHAT INTEGRATORS ACTUALLY DO,
  in whatever survives of it. `docs/CONVENTIONS.md:205-206` says
  "commit `docs/architecture/graph.json` **with the merge**"; the
  house shape is merge → checkpoint, and the regen lands in the
  SECOND commit. Measured at T-050: at the merge commit
  `nputer-index index --check` exits 1 (STALE), at the checkpoint it
  exits 0. The rule and the practice have disagreed for twenty-six
  regens. It cannot simply move into the merge commit, and the notes
  SHALL say why: the checkpoint edits INDEXED fixture files, so a
  regen committed with the merge is stale again the moment they are
  reconciled — the ordering lesson held twelve times. If the rule
  retires wholesale per the criteria above, this becomes one sentence
  in whatever replaces it; if any part survives, it says "checkpoint"
  (T-014-s3).
- THE DISPATCH RULE SHALL BE WRITTEN DOWN: brief lanes to branch from
  the last CHECKPOINT, not from a merge commit. Seven-for-seven —
  T-027 is the seventh worked example (cut from `e92056a`, a
  checkpoint; it inherited a current graph and no inherited red), and
  T-014 is the counter-example (cut from the merge `5927adc`, it
  inherited a stale graph and a red `self_graph_is_current` through no
  fault of its own, and four sibling lanes were dispatched into the
  same window). **This rule is what makes the window harmless; the
  CI gate above is what makes it visible. Both, not either** (T-014-s3).
- THE PARSE SHALL BECOME STRUCTURAL WHERE IT IS CURRENTLY SILENT.
  T-045's verifier attacked the derivation twenty-four ways: 18 red
  loudly, 3 are correctly tolerated, and 3 are SILENT — all one shape,
  a command ARRIVING in a structure the typography rule does not
  recognise (an indented sub-bullet, an indented sub-bullet with its
  own marker, a fenced block after a bullet; each `problems=0
  steps=17`, invisible). The mechanism is `commandBullets()` splitting
  on a newline followed by "- " at column 0, so anything indented is
  glued to the PRECEDING bullet's chunk and never read. An indented
  bullet line and an opening fence inside "Build & test" SHALL push a
  problem NAMING the structure, the way a fifth `run from` bullet
  already does — without teaching the parser markdown. One new fixture
  per shape. **This is directly load-bearing for the criteria above**:
  this card's whole method is writing new commands into that section,
  and the asymmetry is that a command which ARRIVES in an unread shape
  is exactly what stays invisible (T-045-s4).
- TWO OF THE FOUR CI DIVERGENCES SHALL CLOSE while `ci.yml` is open.
  The parse found FOUR where the doc claimed two:
  `npm install`→`npm ci` and the playwright install are genuine
  environment differences and STAY; `npm run lint:tokens` →
  `node scripts/lint-tokens.mjs` and `npm run boot:check` →
  `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` are CI
  spelling the same command differently and NEED NOT BE. `npm run`
  does not require `node_modules` installed — the scripts are plain
  node and npm only extends PATH — so both become the documented
  command with `working-directory: tools/e2e`, the xvfb wrapper
  staying real on the boot half. That leaves exactly the two the doc
  always claimed. **One local check is required first**: npm's argv
  handling ate a bare `--config` after a script name at T-046, so the
  flag form after a double dash SHALL be sanity-checked before the
  workflow is edited (T-045-s1).
- THE LANE'S HONEST SCOPE SHALL BE RECORDED beside the other gate
  rules: the e2e lane covers what a BROWSER can reach, and
  Tauri-gated affordances are jsdom-plus-@human territory. Two live
  instances, neither a defect and both correct about what a browser
  can do: `runPicker` opens with a not-Tauri early return, so an
  accelerator's ACTION is unobservable in the served bundle — the
  lane can prove a chord was CLAIMED, never that it was OBEYED — and
  both header buttons are gated behind `isTauriRuntime()`, so the one
  screen where they live is the one screen the lane cannot show.
  T-027 made this bigger by adding a whole screen whose actions are
  all IPC. Arms 1 (a DEV-only attempt counter) and 2 (render the pair
  disabled in browser mode) stay AVAILABLE and SHALL be named in
  notes; arm 3 is taken now because a recorded sentence beats a
  second DEV-gated surface that T-041's single-gate argument
  disfavours (T-049-s1).
- THE VERIFICATION PRACTICE THAT CATCHES VACUOUS ASSERTIONS SHALL BE
  RATIFIED where a verifier will read it. Integrators and verifiers
  already mutate every test body and require it to red — 133-for-133
  at T-027 — and nothing in `docs/CONVENTIONS.md` or `method/roles/`
  says so: verified at triage, zero occurrences of "vacuous" or
  "mutation" in either, and the one occurrence of "vacuously" is
  about ACL grants. SIX assertions that cannot fail were caught in a
  single night by a practice that is pure oral tradition. One bullet,
  in the shape the other gate rules already use (trigger → command →
  record → IF-it-cannot-run → why). T-057 fixes what it found; this
  is the rule that found it.

Verification: headless — the reproduced red, the green after, the
staleness proof with its exit code, the exposed-command enumeration,
the three new structural fixtures, and the full tools/e2e suite. No
app code, no Rust code: this task changes documentation, a method
file, a spec's tables and a CI workflow only. **Serialize with T-052**,
which also touches `method/` and `docs/CONVENTIONS.md`.

## Implementation notes

## Verdicts
