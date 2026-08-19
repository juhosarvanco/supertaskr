# State

Updated: 2026-08-19 by integrator (T-058 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-058 — the tree stays searchable.** F-02, milestone 4, size M,
`touches: [tools/e2e]`. Built by `codex/gpt-5.6 @fresh`, verified by
`claude-opus-5 @fresh`, `review: independent`. Approved branch tip
**`a64a7c2`**; merge **`7c6c5aa`**.

The hazard the card names is not a blinded GATE, it is a blinded
SEARCHER. A control character written as a literal byte instead of its
six-character escape compiles, bundles, typechecks and tests green;
every gate in this repo reads through Node's `readFileSync(…, "utf8")`,
where such a byte is an ordinary codepoint, and `ci.yml` contains zero
greps. What breaks is `ripgrep`-class search with `-I`, which returns no
match at all — the mode every agent searches this tree in. Thirteen
reproductions across six sessions, one of them into STATE.md itself and
one into the card while it was being written.

`lint:tokens` now carries a fifth pattern, P5, over RAW bytes rather
than masked text, because a control byte in a COMMENT blinds a searcher
exactly as well as one in a string. The lint splits in two: the
testable half moves to a side-effect-free `tools/e2e/scripts/token-scan.mjs`
and `lint-tokens.mjs` becomes a 13-line wrapper that still calls
`lintTree()` or `selftest()` unconditionally. Importing the lint used to
run the FULL tree lint and, on a dirty tree, `process.exit(1)` the
importer before it ran a line of its own — two tasks in a row worked
around that (T-045-s2), and it is now closed. There is deliberately no
`import.meta.url === process.argv[1]` guard: a symlinked checkout or a
wrapper script can make those paths disagree and turn CI's FIRST gate
into a silent exit 0.

Two explicit corpora replace one implicit one. TOKEN keeps the UI roots
byte-for-byte as they were and P1–P4 still run over masked source.
CONTROL derives its authority from `git ls-files -z`, excludes
generated/dependency directories and a named binary-suffix set, and P5
alone reads its raw bytes — so docs, method, root records, `.github`,
Rust and both lockfiles are covered for the first time. The lint reports
the two counts SEPARATELY, so a green token scan can no longer be
mistaken for whole-tree control coverage.

## The four findings this merge delivers

`T-058-s1` through `s4` exist only on this branch and arrive with the
merge; all four landed as `status: suggested` and go to triage
immediately. None is a defect against the build.

- **s1 — the deny list is right, but almost nothing pins it.** CONTROL
  is a DENY list, which is the correct shape; the gap is one rung up,
  because `CONTROL_BINARY_EXTENSIONS` is itself the policy and the
  selftest holds only some of it. Removing a suffix class in turn, the
  classes whose loss is DETECTED are held by a named file pin; the rest
  survive on root non-emptiness rows, which stay green as long as the
  root keeps one file of any other suffix. **One line can silently drop
  the two classes the architect's ruling explicitly named.**
  Re-derived at this merge rather than transcribed: **44 `.rs` and 46
  `.tsx`**, both unchanged from the verifier's figures. The card's
  headline "109 of 521" was measured at the BUILD commit; CONTROL is
  **529** here, so triage should re-derive the total. One measurement
  caution for whoever does: s1 classifies suffixes by Node's
  `path.extname`, under which `.gitignore` and friends are "no
  extension" — a naive shell split disagrees and mis-reports that row.
- **s2 — a fifth poison shape: deleting an assertion deletes its own
  failure.** The selftest's assertion-set CARDINALITY is printed but
  pinned nowhere. Four measured deletions — including all four P1–P4
  positive samples at once — left lint, selftest and the lane green.
  This is distinct from the four catalogued "matcher moved, value fixed"
  violations, and distinct again from T-057-s1's duplicate shape.
- **s3 — the superseded mechanism survives verbatim** in
  `app/test/map-tasks-lens-dom.test.tsx`, the one file criterion six
  ordered PRESERVED byte-identical. Outside this card's fence, but it is
  the first thing the next session reads.
- **s4 — the bare-checkout gate cannot see a codepoint-format
  regression.** The only P5 positive sample is U+0000, whose hex has no
  letters, so a lowercase-vs-uppercase regression is invisible to CI's
  FIRST step while the lane catches it.

**Numbering note.** T-057's checkpoint deliberately left its own
poison-shape finding without an ordinal because T-058's verifier was
measuring a sibling shape in the same window, and two lanes independently
claiming "shape five" is how a taxonomy acquires two fifths. **Both have
now landed**: T-057-s1 (a duplicate that reds under poison because the
drill proves a body RUNS, not that it is not a COPY) and T-058-s2 (an
assertion whose deletion deletes its own failure). Numbering them is a
triage decision, not an integrator's.

## Integration truth

T-058 and main shared base **`71fa546`**. Main-before was **`f6a4f36`**
and the approved worktree was clean at **`a64a7c2`**. Main advanced
nineteen paths from that base (T-057's whole merge and checkpoint);
T-058 changed ten. **Their changed-file intersection is empty.** The
read-only `merge-tree` predicted tree **`bfc92ce6`** before anything was
written, and the no-ff merge **`7c6c5aa`** produced that tree exactly,
with parents `f6a4f36` and `a64a7c2` and nothing else.

**The merge's diff (`f6a4f36..7c6c5aa`) is TEN files**: four in
tools/e2e (`scripts/lint-tokens.mjs` shrinking 698 lines to 13,
the new `scripts/token-scan.mjs`, the new `tests/token-scan.spec.ts`,
`tsconfig.json`), T-034's card carrying the durable correction, the
T-058 card, and the four new suggestion files. The naive
`merge-base..HEAD` derivation returns **TWENTY-NINE** — the extra
nineteen are main's own T-057 commits, already integrated.

**Corpus counts, derived at every ref rather than carried.** The card
reports TOKEN 118 / CONTROL 521 and both figures are honest for the
commit they were measured at, which is the BUILD commit `2444af0` — not
the tip, and not this merge. Under the shipped policy (tracked files
minus the 18 binary assets, which are 16 icons and 2 woff2 at every ref):

| ref | tracked | CONTROL | note |
|---|---|---|---|
| `71fa546` base | 537 | 519 | |
| `2444af0` build | 539 | **521** | the card's and the verdict's figure |
| `a64a7c2` tip | 543 | 525 | +4, the verifier's own suggestion files |
| `f6a4f36` main-before | 541 | 523 | +4, T-057's suggestion files |
| `7c6c5aa` merge | 547 | **529** | 519 + 6 + 4, both sides |

TOKEN goes **117 → 118**, the one new spec file, exactly as forecast.
No count is pinned in implementation or test, which is why the corpus
could grow under the card without contradicting it — and is also
precisely what s1 is about.

Security movement is zero. `app/src-tauri/**` is a 0-file diff and so is
every manifest, lockfile and workflow; `acl_pin.rs` is byte-identical at
the base, at main-before, at the tip and in the merged tree (sha256
`8d24cbad…`, **92** grants derived twice from the `EXPECTED_GRANTS`
entries — 92 entry lines and 92 unique strings agreeing — never from a
byte range). No dependency, IPC command, capability grant, environment
allowlist, network, Rust, real CLI or model surface moved.
`tools/e2e/package.json` is unchanged and the ADR-011 family holds: the
two new files import only node builtins, `@playwright/test`,
`../preflight` and the sibling scanner, and nothing under `tools/e2e`
imports the app or the parser.

Merged-main gates, all run in main against the existing install, exits
read unpiped:

- parser suite and types: **234/234** across 12 files, `tsc` exit 0;
- app suite: **825/825** across 42 files, unchanged — T-058 adds no app
  test; app build exit 0, **265 modules transformed**. The build is a
  PREREQUISITE, not a courtesy: without `app/dist` twelve shipped-bundle
  assertions fail loudly by design;
- bare Rust workspace: **325 passed, 0 failed, 3 intentional ignores**,
  unchanged — this card touches no Rust;
- E2E typecheck and full lane: **88/88**, scratch port 17941, one
  worker, retries zero, no skips, all five new `token-scan` tests
  listed by name;
- token lint: **TOKEN 118 / CONTROL 529**, selftest **49 TOKEN samples +
  2 CONTROL samples, 37 walk-policy checks**;
- audit without fetching: **0 vulnerabilities / 17 allowed warnings**
  over 472 locked crates against the existing 1,216-advisory database;
- graph deterministic and current: two regenerations `cmp`-identical to
  the pre-regen bytes, sha256 **`e50ba36e…`**, **571,733 bytes / 117
  files / 989 symbols / 1,508 edges**; `index --check --root ../..`
  **exit 0, CURRENT**, run both before and after the regen.

**Fresh-checkout proof, taken in a scratch worktree at the MERGED
commit** — never in the main checkout, because `npm ci` there removes
`node_modules` under the human's running vite (T-052 mechanism B, which
has happened). The order matters and it is this card's own criterion:
with **zero `node_modules` anywhere in the tree**, CI's first two steps
ran green — selftest 49 + 2 samples and 37 walk checks, then
`lint:tokens` clean at **TOKEN 118 / CONTROL 529**. Only then were the
three packages installed lockfile-exact (parser 55 packages, app 499,
tools/e2e 8; **0 vulnerabilities** each), giving parser build + **234/234**,
app build 265 modules + **825/825** (exit read unpiped after a first run
was piped through `grep` and its exit code lost — the mistake this
checkpoint is naming rather than hiding), and tools/e2e typecheck exit 0.
`lint:tokens` re-run WITH `node_modules` present reports the **same
118 / 529**: `SKIP_DIRS` genuinely excludes it, and installing hundreds
of packages grows the corpus by nothing.

## The two gates, with their triggers computed

**BOOT GATE — computed, and it does NOT fire.** The trigger is
`app/src/**`, `app/src-tauri/**`, `app/package.json` or
`app/src-tauri/Cargo.toml` over `f6a4f36..7c6c5aa`. That set matches
**zero paths**: the merge is tools/e2e and docs only. `boot:check` was
therefore NOT run, no window was opened, and **there is no `BOOT_EXIT`
to record** — the script prints no exit code at all, so any figure in a
checkpoint is the integrator's own `echo $?` and there is none here. A
gate that does not fire is news too, which is why this paragraph exists.

**GRAPH REGEN — the trigger FIRES and the graph cannot move.** The
CONVENTIONS trigger is `*.ts/*.tsx/*.js/*.jsx` outside `docs/`, and
`tools/e2e/tests/token-scan.spec.ts` matches it — one file. But
`.nputerignore` excludes `tools/` by name ("Dev tooling that drives the
app from outside (T-020: the E2E lane) — config-excluded like `docs/`,
never registry territory"), and `graph.json` contains zero `tools/`
paths. **This was MEASURED rather than skipped on the wording**, because
the wording is exactly what over-fires: the regen was run anyway, twice,
and produced bytes identical to what the merge already carried —
sha256 `e50ba36e…`, 571,733 bytes, 117 files, 989 symbols, 1,508 edges,
`git status` showing the file unmodified. **This over-firing is
T-054-s1**, now with a second worked example: a trigger phrased over
SUFFIXES fires on a tree the indexer does not walk. `index --check` was
run by hand at this checkpoint under T-054's standing clause — there is
still no git remote and `ci.yml` has never executed a single step, so
"held by a gate" remains true in the FUTURE TENSE only. **`--root` is
load-bearing**: without it the false red prints the STALE headline,
identical to a real one, with `committed: MISSING` only on the second
line.

**Fixture forecast: zero dogfood assertions move, and the forecast was
complete.** It is ENTAILED rather than sampled — a byte-identical
`graph.json` cannot move an assertion that reads it — and confirmed
independently by `architecture-dogfood.test.ts` (9) and
`map-dogfood-render.test.tsx` (8) passing inside the merged-main app
suite. No throwaway probe was needed here and none was run; the probe
mechanism earns its keep when the graph actually moves, and this is the
second consecutive merge whose forecast is "nothing changes". Nothing
in the checkpoint edits an indexed file either: `docs/` is
`.nputerignore`d, so STATE.md cannot stale the graph.

## An exit contract that did NOT collapse, because it was never written

Two behaviour changes are worth knowing, both measured first-hand here
rather than inherited from the verdict:

1. **CONTROL's authority is now `git ls-files`, so CI's first step needs
   git on PATH.** Run with git genuinely absent, the lint fails LOUDLY
   and BY NAME — `lint-tokens: cannot derive tracked CONTROL corpus:
   Error: spawnSync git ENOENT` — at exit **1**. That is the right
   direction: a corpus it cannot derive is never silently an empty one.
2. **A broken TOKEN walk now throws where the old lint used
   `process.exit(2)`.** The old `corpus()` printed `cannot walk <root>`
   and exited 2; the new one rethrows, nothing catches it, and an
   uncaught throw exits **1** on Node v22.22.0. So "the gate could not
   run" and "the tree is dirty" now share an exit code.

**Checked against CONVENTIONS, which is the question that matters: it
does not contradict the doc, because the doc never documented it.**
CONVENTIONS legends the exit codes of `index --check` (0 current · 1
stale · 2 usage · 3 could not run), of `boot:check` (0 booted · 1 boot
failed · 2 port busy · 3 override refused) and the gating rule for
`cargo audit` — but the `lint:tokens` bullet carries no exit-code legend
anywhere in the file. So nothing here forces a CONVENTIONS edit, and
none was made. **What changed is that the silence is now conspicuous**:
`lint:tokens` is CI's FIRST step, it is the only gate in that list
without a legend, and it has just lost the distinction the other gates
are careful to keep. Filed below as an open question rather than
legislated at a merge. One note for whoever takes it: `boot:check`'s
legend already sits in the same bullet list with the lane's
workflow-parity spec green over it, so a legend for `lint:tokens` has
precedent and is unlikely to disturb the CONVENTIONS-derived command
parity.

## Provenance — the correction, now measured a second time

T-058 is **built by codex, verified by Claude**, no builder reasoning
consulted beyond the committed card. Derived across all done cards at
this checkpoint rather than assumed: **51 done cards — 40 read
`same-model`, 5 read `self-verified`, 5 read `independent`, and T-056 is
a done card whose `review:` is EMPTY.**

Of the five `independent` stamps, **only three have different models on
the two sides**: T-060 (claude-opus-5 built, codex/gpt-5 verified),
T-057 and now T-058 (both codex/gpt-5.6 built, claude-opus-5 verified).
**T-055 and T-066 are stamped `independent` with the SAME model on both
sides** — `codex/gpt-5.6`/`codex/gpt-5.6` and `codex/gpt-5`/`codex/gpt-5`,
which is `same-model` by the convention's own definition. So **T-058 is
the THIRD genuinely cross-model card in this project's history**, and the
second in the codex-builds / Claude-verifies direction.

The independent count reads 5 here where T-057's checkpoint derived 3,
and both are correct at their moment: T-057's merge added one and T-058's
adds another. The claim in circulation that needs correcting is not the
count but the READING — `independent` has never meant cross-model on
three of the five cards carrying it. **No other card's history was
re-stamped**; the discrepancy is filed as an open question below, where
it already was.

**The card's `status: done` was a stamping slip, and it is now true.**
`method/roles/executor.md:19` allows `done` only at size S, and T-058 is
size M. Checked rather than assumed: the stamp was written in the BUILD
commit `2444af0`, where `## Verdicts` was empty and `verifier`,
`verified_by` and `review` were all blank — so it was never a claim that
verification had happened, and nothing was merged while it stood. The
verdict commit filled the three fields and its closing line reads
"Status left for the integrator", so both roles reached for the same
field from opposite ends. Nothing needed changing in the front matter at
this checkpoint; the field is correct for the first time. T-057's
verifier left `planned` and its integrator stamped `done` at the
checkpoint — the same night, the opposite choice, which is why the open
question below stays open.

## In progress / broken right now

One sibling lane is live; its state is derived, not carried over:

- **T-043 — the kill path** (`task/T-043-kill-path`, worktree
  `../nputer-T-043`). Still **BUILDING**, and it moved twice while this
  merge was being integrated — tip `4d75bac` at T-057's checkpoint,
  `cfa86ef` when this session started, **`ade2d1a`** when it finished,
  four commits plus one STAGED change to
  `app/src-tauri/tests/agent_runner.rs`. Its committed file set is
  `app/src-tauri/**` Rust plus docs — **empty intersection with T-058's
  ten files**, verified against the tip as of this checkpoint rather
  than assumed from the slugs. T-058 declares `touches: [tools/e2e]` and
  T-043 declares `app-agent, app-shell`, so the two lanes never had a
  plausible overlap; it was measured anyway.

Nothing is broken. No lane is blocked on this checkpoint.

## Ports, and what reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid 82549,
started 2026-08-18) serving this checkout, with a live webview
connection. It was never bound, connected to or signalled; read-only
`lsof` only, checked at the start and again at the end of the session,
same pid and same established connection both times. No `npm ci` or
`npm install` ran in the main checkout (T-052 mechanism B) — every
install this session happened in a scratch worktree under /private/tmp
that has since been removed. The E2E lane used scratch port **17941**,
bind-probed free first alongside 17943 and 17945.

**What actually reached their window, stated exactly:**

1. **Docs-watcher snapshots, and nothing else.** The watcher ships a
   full snapshot of `<project>/docs` on every change, so their board
   re-read the tree: T-058 now shows `done`, four new `T-058-s*` cards
   appeared, T-034's card changed, and STATE.md moved with this
   checkpoint. Seven doc files in total.
2. **No HMR at all.** This is the difference from the last three merges.
   `app/src/**` is a **0-file diff**, so their running app took no hot
   update and no module was replaced. The card's whole permanent diff
   lives in `tools/e2e/**` and `docs/**`, neither of which vite serves.
3. **The map pane saw no new graph.** `docs/architecture/graph.json` is
   inside the watch root, but it did not move in this merge and the
   regen reproduced it byte-for-byte, so the pane re-read identical
   bytes.
4. **No second window opened.** The boot gate did not fire and
   `tauri dev` was never spawned. The three previous merges each flashed
   a window for about half a minute; this one did not.
5. **`app/dist` was rewritten** by the required pre-suite build, in the
   main checkout. The dev server does not serve `dist` and no module in
   its graph imports it, so this is invisible to their window.

## Next up

1. **Triage the four T-058 suggestions** — they arrived with this merge
   and are the immediate next action. s2 is the one with reach beyond
   its own card: it is a poison-drill limitation, and T-057-s1 is the
   sibling shape waiting to be numbered alongside it.
2. **T-065** (`blocked_by: [T-057, T-058]`) as the solo wire-contract
   bridge. **Both blockers are now done, so it is UNBLOCKED** — it is
   the first card this checkpoint frees.
3. **T-067** (`blocked_by: [T-062, T-058, T-065]`) and **T-068**
   (`blocked_by: [T-057, T-065]`) concurrently from T-065's checkpoint;
   each still waits on T-065.
4. **T-043** continues in its own lane; it is the remaining milestone-3
   process-lifecycle task.
5. The human-owned authenticated genesis below.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3): a merge carries a graph the checkpoint has not regenerated
yet, and a lane cut from one inherits a red `index --check` through no
fault of its own.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light
  and dark completion screenshots. No planner turn has succeeded against
  a real model on this machine.
- **Relaunch the desktop app.** The running process predates T-051,
  T-063, T-062, T-060, T-056, T-066, T-055 and T-057. T-058 delivered it
  nothing at all — no HMR, no new graph — so the gap between the running
  window and the merged tree is exactly what it was at the last
  checkpoint, and a hot update was never a cold boot of the merged tree.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **Repository remote:** there is still no remote. **CI has never run on
  a real runner**, so `index --check` as a CI step remains true in the
  future tense only; the integrator ran it by hand at this checkpoint
  and it exited 0 (T-054's standing clause). The same is now true of the
  token lint's dependency on git being on PATH — real on a runner,
  untested by any runner.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. Parser structural truth,
layout containment, test safety, render efficiency, assertion honesty
and now a searchable tree do not prove an interview with a model that
can misunderstand the user.

## Health of the tree

At this checkpoint main contains T-058 merge `7c6c5aa` plus this
checkpoint. Parser, app, Rust, E2E, token lint, audit and
graph-currentness gates are all green; the boot gate did not fire and
was not run. **ROADMAP was deliberately NOT ticked and ARCHITECTURE was
deliberately NOT touched.** On the discriminator this repo actually
uses — does it change what a USER can do? — T-058 changes nothing: it is
a gate and a dev script, and the precedent is unbroken (T-044, T-045,
T-046, T-053 and T-054 get zero ROADMAP narrative, and none of those ids
appears in the file). ARCHITECTURE is the sharper call, because T-057
DID earn a paragraph there for moving C-13's banking rule to one
exported owner. T-058 moves an interface too — one script becomes two,
with a real exported module — but not a COMPONENT's interface: the
Components table runs C-01 to C-07, `tools/e2e` has no C-id, and the one
place ARCHITECTURE mentions it is a code-layout line calling it "the
real-input E2E lane (T-020)". `.nputerignore` makes the same judgment in
executable form — `tools/` is "never registry territory". A card that
moves no component interface earns no ARCHITECTURE paragraph.

## Open questions

- **What does `review: independent` mean — a different session, or a
  different model?** Five done cards carry it and only three have
  different models on the two sides. Until it is defined, the field
  cannot be read as cross-model evidence, which is the one thing it
  looks like it is for. T-056 is also a done card with an empty
  `review:` where `self-verified` looks intended. ADR-016 says the
  distinction remains first-class DATA and always visible in TEXT, but
  never says which distinction.
- **Should `docs/CONVENTIONS.md` legend the token lint's exit codes?**
  It legends `index --check`'s four and `boot:check`'s four, and
  `lint:tokens` — CI's FIRST step — has none, having just collapsed
  "could not run" (was 2) into "tree is dirty" (1). Nothing is
  contradicted today because nothing was written down; the question is
  whether an undocumented distinction is allowed to disappear quietly.
- **Numbering the two poison shapes.** T-057-s1 (a duplicate positive
  survives the drill, because poisoning proves a body RUNS and that its
  value MATTERS, not that it is not a COPY) and T-058-s2 (deleting an
  assertion deletes its own failure). Both have now landed; neither has
  an ordinal, deliberately. Triage owns the taxonomy.
- **Does a size-M card's `status: done` belong to the verifier or the
  integrator?** T-057 and T-058's verifiers answered differently on the
  same night, and T-058's EXECUTOR answered a third way by stamping it
  in the build commit. `method/roles/executor.md:19` allows `done` only
  at size S, which settles who may not stamp it but not who must.
- Should the T-043 exit observer own a richer child handle, or coordinate
  with the worker that alone owns `Child`, to reap early without
  abandoning a resistant same-group descendant?
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves against
  T-056's direction. Is a render-identity property worth a standing test,
  or is "bounded and recorded" the right resting place?
