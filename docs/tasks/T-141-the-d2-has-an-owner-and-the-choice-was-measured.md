---
id: T-141
title: The unmapped file has one owner that costs nothing, and two that look closer and would each invert a real dependency — plus 137 lines of fixture narrative to unwind
feature: F-06
milestone: 4
priority: 5
size: S
status: building
blocked_by: []
touches: [docs/architecture/components/, app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**T-139's merge created this repository's second D2.** `arch` at
`ae92f67`: `components=13 files=185 mapped=184 unmapped=1 edges=39
findings=5`. The unmapped file is
**`app/src-tauri/tests/graph_budget_bench.rs`**, the harness T-139 added.

**Its integrator routed rather than declared, and was right to** — picking
an owner is a disposition, and repairing it in the checkpoint would have
destroyed the evidence that the merge created unclaimed territory.

## The decision, already measured — do not re-derive it, verify it

**The file imports both sides of the seam it measures:**

    use nputer_index::{stable_json, Edge, FileEntry, Graph};              -> C-07
    use nputer_lib::docs_watch::{collect_docs_tree, DocsFile, DocsSnapshot}; -> C-10

so `arch` carries **two** shadow edges, `unmapped -> C-07` and
`unmapped -> C-10`. **Whoever claims it gains both**, which is what makes
this a disposition rather than bookkeeping.

**C-07 and C-10 are both wrong, and for the same reason in mirror.**
Claiming it in C-07 declares that the indexer depends on the app's docs
watcher — **inverting the real direction**, since `nputer-index` is a
standalone crate and the app depends on IT (`C-07 depends_on: []` today).
Claiming it in C-10 gives the watcher a dependency on the indexer it does
not have.

**C-05 is right and costs nothing.** It already declares **C-07 and C-10
both** (`depends_on: [C-01, C-06, C-07, C-08, C-09, C-10, C-11, C-12,
C-13, C-14, C-16]`), it already owns `app/src-tauri/src/**` file by file,
and the harness sits in the app's own test directory measuring the app's
own delivery path.

**MEASURED, not argued**: with the file claimed in C-05, `arch` goes to
`mapped=185 unmapped=0 edges=37 findings=4 drift_components=4`. **Edges
FALL by two and findings by one — the claim adds nothing the registry did
not already carry.** That is the test that separated C-05 from the two
candidates that looked closer, and it is the criterion this card asks you
to re-run rather than trust.

**The precedent is T-010's**, applied at `tests/agent_runner.rs` and cited
in C-14: a component's suite belongs to the component it exercises. **This
harness exercises the seam, and the seam is C-05's.**

## The real work is the fixture narrative, not the one-line claim

**T-139's checkpoint added 137 lines across two React fixtures to RECORD
the D2** (`ae92f67`: `architecture-dogfood.test.ts` +103,
`map-dogfood-render.test.tsx` +63). Closing it falsifies **six bodies**,
verified by running the claim in a scratch checkout:

| body | now asserts | becomes |
|---|---|---|
| `all 185 files map and ONE lands in the bucket` | 1 unmapped | `[]` |
| `THE FINDINGS … AND A D2 THIS MERGE CREATED` | 5 findings | 4 |
| `the full relation table: 26 confirmed, 4 undeclared` | 39 edges | 37 |
| `drift flags land on the right nodes` | `['C-05','C-10','unmapped']` | `['C-05','C-10']` |
| `renders all thirteen … the bucket is BACK` | 14 nodes | 13 |
| `draws the full 39-edge relation table` | 39 | 37 |

**Four titles carry the D2 as a claim and must move with their
assertions.** The prose explains a bucket that will no longer exist —
**rewrite it to record that the D2 lived for exactly one merge, do not
delete it.** The T-033 D2 lasted a day; this one lasted a merge, and both
are worth the archive.

## Acceptance criteria

- **RE-DERIVE THE OWNERSHIP TEST BEFORE ACCEPTING IT.** Claim the file in
  C-05 and confirm `arch` reports **edges DOWN by two and findings down by
  one**. IF the claim adds any edge THEN C-05 is the wrong owner and the
  disposition needs rethinking, not forcing.
- **`cargo test` WILL NOT NOTICE AND THAT IS THE POINT.** T-139's
  integrator measured it: `arch drift` exits 0 without `--fail-on`, the
  cargo arch pin is about **cycles**, and cargo was 518/0/4 both before and
  after the D2 appeared. **The whole of what noticed was two React
  fixtures.** State whether that gap earns a finding; do not fix it here.
- **EVERY TITLE THAT CARRIES A FIGURE OR A CLAIM SHALL MOVE WITH ITS
  BODY.** Four do. A title asserting a bucket that no longer exists is the
  defect this project has caught more than any other.
- **THE SECOND-ASSERTION TRAP HAS FIRED TWICE THIS WEEK** — a red on the
  first assertion hides the second in the same body, so T-139's integrator
  saw `8 failed` and the true count was larger. **Re-run until green, and
  report the count at each pass**, not just the last.
- **THE NARRATIVE SHALL BE REWRITTEN, NOT DELETED.** Both D2s in this
  repository's history were created by a merge and closed by a later hand;
  that is a pattern worth one paragraph, and deleting the first one's
  explanation to close it would erase the evidence.

Verification: headless — `npm test` from `app/`, exit **unpiped from
`$?`**, count derived; `cargo test --no-fail-fast` from `app/src-tauri`
with the total SUMMED from the `test result:` lines and cross-checked
against the `running N tests` headers. **Build `lib/parser` first, then
`npm run build` from `app/`.** **Ask GRAPH REGEN rather than predicting
it, and ask AGAIN after any write** — the identical-figures trap has now
fired with **bytes, files, symbols AND edges all matching** across two
distinct graphs. **POISON DRILL on any new assertion**; if this card adds
none and only reconciles existing ones, **say so explicitly** rather than
leaving the drill silent. **Ports are machine-wide while lane-protocol
rule 4 partitions by CHECKOUT.** @human: none — the disposition is the
architect's and it is recorded above.
