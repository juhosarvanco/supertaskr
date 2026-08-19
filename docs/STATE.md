# State

Updated: 2026-08-19 by integrator (T-057 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-057 — assertions that cannot fail.** F-02, milestone 4, size M,
`touches: [app-shell, app-interview]`. Built by `codex/gpt-5.6 @fresh`,
verified by `claude-opus-5 @fresh`, `review: independent`. Approved branch
tip **`dbe3307`**; merge **`9b0687f`**.

The card's subject was a PATTERN caught in one night — six assertions that
proved an OUTCOME another test already covered while claiming to prove a
MECHANISM. It closes the two that lived in the app's suites. C-13's banking
rule now has ONE owner: `interview-model.ts` exports `observeBanking`, a pure
`(previous, docs, turn) -> BankingObservation` transition owning priming,
advancement, project-switch rebaselining, per-turn merge, sort and dedupe,
and BOTH the shipped chat and the replay tests call it. The test-only
banking loop that hand-copied `InterviewChat`'s effect is gone, so a test
can no longer agree with a copy of the rule instead of the rule. Seven
mechanism mutants red where nothing red before: project rebaseline, hook
cleanup, registration deps, absent-entry ordering, latest-table refresh,
post-pick re-arm, and a premature store value import that fails at COLLECT
time. Two comments that lied were corrected.

## The finding this card earned about itself

**T-057 is the card about assertions that cannot fail, and its verifier
found one inside T-057 itself.** Criterion 3 asked for an honest positive to
replace the deleted `byPlanner === byHuman` tautology — "a docs snapshot
during an active turn produces a chip". That replacement is the SAME
`bank()` call as "a file that lands AFTER completed still belongs to that
turn" three cases above it: same seq, same turn, same prime, same matcher,
same expected value. The only difference is an inert content string that no
code path reads differently. **Re-measured at this merge: rewriting
`"written"` to `"v1"` makes the two bodies character-identical modulo the
test name and the local binding, and the file still passes 58/58.** Under
the project-rebaseline mutant the switch test reds and this one stays green
— it kills no mutant of its own. The verifier's sentence is the one to
carry: **the `f(x) === f(x)` tautology was not removed so much as spread
across two tests.** And the fault is not only the builder's — **the
CRITERION named a positive the suite already had**, so a card can specify a
duplicate into existence and a faithful executor will build it.

It also exposes a limit of the poison discipline this project has leaned on
all week, now written into the POISON DRILL bullet in CONVENTIONS.md:
**poisoning proves a body RUNS and that its value MATTERS; it does not prove
the body is not a DUPLICATE of another.** The duplicate reds under an
expected-value poison, which is exactly why the drill passed it. That shape
is distinct from the four catalogued "matcher moved, value fixed"
violations. It was deliberately NOT given an ordinal: T-058's verifier was
measuring a sibling shape in the same window, and two lanes independently
claiming "shape five" is how a taxonomy acquires two fifths. Number them
once both have landed. Filed as `T-057-s1`.

## Integration truth

T-057 and main shared base **`71fa546`**. Main-before was **`adb32c3`** and
the approved worktree was clean at **`dbe3307`**. Main advanced four doc
paths from the base (STATE.md and the T-065/T-067/T-068 cards); T-057
changed eleven. **Their changed-file intersection is empty.** The read-only
`merge-tree` predicted tree **`0e8058b`** before anything was written, and
the no-ff merge **`9b0687f`** produced that tree exactly, with parents
`adb32c3` and `dbe3307` and nothing else.

**The merge's diff (`adb32c3..9b0687f`) is ELEVEN files**: two shipped
(`app/src/genesis/InterviewChat.tsx`, `app/src/genesis/interview-model.ts`),
four test (`accelerators.test.tsx`, `interview-model.test.ts`,
`startup-recovery.test.ts`, `startup-screen.test.tsx`), the card, and four
new suggestion files. The naive `merge-base..HEAD` derivation returns
FIFTEEN — the extra four are main's own doc commits, already integrated.
Both gates fire on the correct set: BOOT because `app/src/**` moved, GRAPH
REGEN because six `.ts`/`.tsx` files outside docs/ moved.

Security movement is zero. `app/src-tauri/**` is a 0-file diff;
`acl_pin.rs` is byte-identical at `adb32c3`, at `dbe3307` and in the tree
(sha256 `8d24cbad…`, **92** grants derived from the `EXPECTED_GRANTS` entries
rather than counted from a byte range). No dependency, manifest, lockfile,
IPC command, capability grant, environment allowlist, network, Rust, real
CLI or model surface moved.

Merged-main gates, all run in main against the existing install, exits read
unpiped:

- parser suite and types: **234/234** across 12 files, `tsc` exit 0;
- app suite: **825/825** across 42 files — main-before's 822 plus the three
  the card adds; app `tsc --noEmit` exit 0; build **265 modules
  transformed**;
- bare Rust workspace: **325 passed, 0 failed, 3 intentional ignores**;
- E2E typecheck and full lane: **83/83**, scratch port 17931, one worker,
  retries zero, no skips;
- token lint: **117 files**, selftest **49 samples + 14 policy checks**;
- audit without fetching: **0 vulnerabilities / 17 allowed warnings** over
  472 locked crates against the existing 1,216-advisory database;
- boot gate: **FIRED and passed** on scratch port 17933, bind-probed free
  first. Both `[nputer]` startup lines detected, process tree stopped on
  SIGTERM. **The script prints no exit code — the 0 is my own `echo $?`,
  not script output;**
- graph deterministic and current: repeat regeneration `cmp`-identical,
  sha256 **`e50ba36e…`**, **571,733 bytes / 117 files / 989 symbols /
  1,508 edges**; `index --check --root ../..` **exit 0, CURRENT**.

**Graph delta.** 117 files UNCHANGED — T-057 moved 43 lines BETWEEN two
already-indexed files rather than adding one. Symbols **982 → 989** (+7:
`observeBanking`, `BankingObservation`, `EMPTY_BANKING_OBSERVATION` in
interview-model.ts; `AcceleratorHarness`, `keydownAdds`, `keydownRemoves` in
accelerators.test.tsx; `isTauriRuntime` in startup-screen.test.tsx).
`InterviewChat.tsx`'s symbol set is byte-identical — what moved lived inside
the component body. Edges **1,502 → 1,508** (+13 / −7). The four changed
file-level import edges are all EXISTING pairs whose `symbols` lists grew;
not one new file pair appears. **So zero dogfood assertions moved** — the
first merge in that ledger whose forecast is "nothing changes", verified
with a throwaway probe `it()` run once against the fresh graph and removed
with the removal proved by sha256: `fileComponent.size` 117, mapping C-05 54
/ C-06 25 / C-08 10 / C-09 3 / C-10 2 / C-12 14 / C-13 8 / C-14 1, the
32-row relation table, all ten D1 findings with every `fileEdges` list and
`observedCount`, the three D3 findings and `unmappedFiles` [] all identical.
The ceaa949 ordering was still needed: the ledger comment is itself an
indexed edit, so the measuring regen was staled by it and the graph was
regenerated a final time afterwards.

**Poison discipline is 14-for-14 RED on merged main.** Every value pinned by
a changed or added assertion was poisoned one at a time — the duplicate
positive's expected value; all four values in the project-switch object; the
unmount-stops-the-action list; both `adds`/`removes`; all five values in the
startup-recovery whole-object `toEqual`; and the collect-time `isTauriRuntime`
tripwire, which reds before any test renders. Three of those `it()` bodies
carry more than one pinned value in a single `expect`, which is the shape
seven consecutive merges have had to catch by hand. Each restoration was
proved by sha256 against `git show HEAD:<path>`, never by a clean
`git status`. Two shipped-source mechanism mutants were re-derived
first-hand as well: removing the project-directory clause reds exactly one
test (the switch test, both watermark arms), and `[]` → `[table]` on the
accelerator registration reds exactly one test with
`{ adds: 2, removes: 2 }` against `{ adds: 1, removes: 1 }`.

## Provenance — and a correction to the record

T-057 is **built by codex, verified by Claude**. Cross-model review is what
ADR-016's `review:` field was designed to carry, and it has almost never had
a real value in it. Derived across all done cards rather than assumed:
**40 read `same-model`, 5 read `self-verified`, 3 read `independent`, and
T-056 is a done card whose `review:` is EMPTY.** Of the three `independent`
stamps, only **T-060** (claude-opus-5 built, codex/gpt-5 verified) has
different models on the two sides. **T-055 and T-066 are stamped
`independent` with the SAME model on both sides** — codex verifying codex.
So T-057 is the **second** genuinely cross-model card in this project's
history, not one of a handful, and it is the first in the codex-builds /
Claude-verifies direction. T-058, approved during this session, is the
third.

The field is being used two ways — "a different session" and "a different
model" — and nothing defines it. ADR-016 says the distinction remains
first-class DATA and is always visible in TEXT, but never says which
distinction. Recorded as an open question below rather than silently
re-stamping two other cards' history.

## In progress / broken right now

Two sibling lanes are live and both moved during this session; states below
are derived, not carried over:

- **T-058 — the tree stays searchable** (`task/T-058-searchable-tree`,
  worktree `../nputer-T-058`, tip **`a64a7c2`**). No longer in
  verification: the verdict landed **APPROVED**, `built_by: codex/gpt-5.6`,
  `verified_by: claude-opus-5`, `review: independent`. **Awaiting
  integration.** Its file set (tools/e2e scripts + docs) has an empty
  intersection with T-057's. Note for its integrator: its card was already
  stamped `status: done` in the verdict commit at size M, where T-057's
  verifier deliberately left `planned` for the integrator — two Claude
  verifiers, same night, opposite choices about whose stamp that is.
- **T-043 — the kill path** (`task/T-043-kill-path`, worktree
  `../nputer-T-043`, tip **`4d75bac`**, two commits plus one uncommitted
  line in `runner.rs`). Still **building**. Its committed file set is
  `app/src-tauri/**` Rust plus docs — **empty intersection with T-057's**,
  even though both cards declare the `app-shell` slug. Verified rather than
  assumed: `app-shell` legitimately spans C-05's TS shell and its Rust
  plumbing, so two lanes can share the slug and stay disjoint. Coarse, not
  wrong.

Nothing is broken. No lane is blocked on this checkpoint.

## Ports, and what reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid 82549, started
2026-08-18) serving this checkout, with a live webview connection. It was
never bound, connected to or signalled; `lsof` read-only only. No
`npm ci`/`npm install` ran in the main checkout (T-052 mechanism B), so
`node_modules` was never removed from under it. Scratch ports this session
were bind-probed free first: **17931** for the E2E lane, **17933** for the
boot gate.

**What actually reached their window, stated exactly:**

1. **Vite HMR on two modules** — `app/src/genesis/interview-model.ts` and
   `app/src/genesis/InterviewChat.tsx`, the only `app/src/**` files in the
   merge. Their running app took a hot update; it was not restarted. The
   observable change is T-057-s2's: a docs snapshot that advances the seq
   and banks nothing now re-renders the chat, where the old code called no
   setter at all.
2. **Docs-watcher snapshots** — the watcher ships a full snapshot of
   `<project>/docs` on every change, so their board re-read the tree several
   times: T-057 now shows `done`, four new `T-057-s*` cards appeared, and
   ROADMAP/ARCHITECTURE/CONVENTIONS/STATE moved. `docs/architecture/graph.json`
   is inside the watch root too, so the map pane saw the new graph.
3. **A second window opened and closed** for about half a minute while the
   boot gate ran its own `tauri dev` on 17933. That is the gate, not their
   app.
4. **Nothing else.** `app/test/**` and `app/src-tauri/**` are not served and
   not watched; `npm run build` writes `app/dist`, which the dev server does
   not serve.

## Next up

1. **Integrate T-058** — it is approved and waiting, and it is the other
   half of T-065's block.
2. **T-065** (`blocked_by: [T-057, T-058]`) as the solo wire-contract
   bridge. T-057 is now done, so T-058's merge is the only remaining gate.
3. **T-067** (`blocked_by: [T-062, T-058, T-065]`) and **T-068**
   (`blocked_by: [T-057, T-065]`) concurrently from T-065's checkpoint.
4. **T-043** continues in its own lane; it is the remaining milestone-3
   process-lifecycle task.
5. The human-owned authenticated genesis below.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light and
  dark completion screenshots. No planner turn has succeeded against a real
  model on this machine.
- **Relaunch the desktop app.** The running process predates T-051, T-063,
  T-062, T-060, T-056, T-066, T-055 and now T-057. HMR delivered T-057's two
  modules, but a hot update is not the same as a cold boot of the merged
  tree.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep choice.
- **Repository remote:** there is still no remote. **CI has never run on a
  real runner**, so `index --check` as a CI step remains true in the future
  tense only; the integrator ran it by hand at this checkpoint and it exited
  0 (T-054's standing clause).

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. Parser structural truth, layout
containment, test safety, render efficiency and now assertion honesty do not
prove an interview with a model that can misunderstand the user.

## Health of the tree

At this checkpoint main contains T-057 merge `9b0687f` plus this checkpoint
and the regenerated graph. Parser, app, Rust, E2E, token lint, audit, boot
and graph-currentness gates are all green. ROADMAP was deliberately NOT
ticked: on this repo's own precedent, process and test-quality cards
(T-044, T-045, T-046, T-053, T-054) get zero ROADMAP narrative, and T-057
changes nothing a user can do. ARCHITECTURE gained one C-13 paragraph
because an interface did move — the banking rule now has one exported owner
— and it records T-057-s2's counterweight in the same breath.

## Open questions

- **What does `review: independent` mean — a different session, or a
  different model?** Three done cards carry it and only one has different
  models on the two sides. Until it is defined, the field cannot be read as
  cross-model evidence, which is the one thing it looks like it is for.
  T-056 is also a done card with an empty `review:` where `self-verified`
  looks intended.
- Should the T-043 exit observer own a richer child handle, or coordinate
  with the worker that alone owns `Child`, to reap early without abandoning
  a resistant same-group descendant?
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves against
  T-056's direction. Is a render-identity property worth a standing test, or
  is "bounded and recorded" the right resting place?
- Does a size-M card's `status: done` belong to the verifier or the
  integrator? T-057 and T-058's verifiers answered differently on the same
  night.
