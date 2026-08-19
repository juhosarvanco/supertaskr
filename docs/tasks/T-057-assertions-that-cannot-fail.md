---
id: T-057
title: Assertions that cannot fail — pin the mechanisms the suites only claim
feature: F-02
milestone: 4
priority: 25
size: M
status: done
blocked_by: []
touches: [app-shell, app-interview]
builder: codex/gpt-5.6
verifier: claude-opus-5 @fresh
built_by: codex/gpt-5.6 @fresh
verified_by: claude-opus-5 @fresh
review: independent
---

Absorbs: T-027-s4, T-049-s3 (triage 2026-08-17), T-063-s7, T-063-s4
and T-062-s5 (architect triage 2026-08-18). The suggestion files are
removed in the corresponding triage commits.

THIS IS A PATTERN, NOT TWO FINDINGS. In one night the pipeline caught
SIX assertions that cannot fail — T-049's retired "stops listening
once the front door is gone" (vacuous after the fix), T-049-s3's four
deletable hook properties, T-014-s7's debounce pin restating its own
literal, and T-027-s4's `f(x) === f(x)`. Three different tasks, two
languages, builders and verifiers both. The two that live in the app's
own suites are absorbed here; T-014-s7's Rust half went to T-044,
where its file already is.

The shape is always the same: a test billed as proving a MECHANISM
proves only an OUTCOME that some other test already covers, so the
mutant survives and the comment lies. The repo's antidote already
exists as PRACTICE — integrators poison every test body and require it
to red (133-for-133 at T-027) — and is written down nowhere. Ratifying
that practice is **T-054's** criterion; this card fixes what it found.

## Acceptance criteria
- THE test-only banking replay SHALL stop hand-copying `InterviewChat`'s
  effect. Export one pure observation transition from `interview-model.ts`
  that owns baseline advancement, project-switch rebaselining, per-turn
  merge, sorting and deduplication; BOTH the shipped chat and tests SHALL use
  it. No second banking loop may remain.
- THE transition SHALL pin the missing project-switch sequence: switch from
  project A to B without producing chips, then change B and produce chips
  only for the later B change. Removing project-directory rebaselining SHALL
  fail this test.
- THE `byPlanner === byHuman` tautology and its "sharpest proof" wording SHALL
  be removed. The app has no authorship signal. The honest disk-only property
  is the conjunction of a positive (a docs snapshot during an active turn
  produces a chip) and the existing negative (model activity/text over an
  unchanged tree produces none).
- THE accelerator hook SHALL gain the two mechanism pins still missing:
  unmount then dispatching its chord does not call the action; and rerendering
  with fresh table identities registers exactly once while mounted and removes
  exactly once on unmount. Deleting cleanup or changing `[]` to `[table]`
  SHALL red those tests.
- THE two accelerator properties already closed by T-027 SHALL stay pinned,
  not gain duplicate tests: moving `preventDefault` above the absent-entry
  return and deleting the latest-table refresh each already red the scoped
  command tests.
- THE `trackKeydownPaths` comment in `accelerators.test.tsx` SHALL be
  corrected: it says it records "every live keydown listener in the
  app, whichever target it is on" and it patches `window` and
  `document` only. A comment correction, not a test (T-049-s3's
  closing note).
- THE stale-pull test in `startup-recovery.test.ts` SHALL prove the re-arm
  occurred with exact `listenCalls === 2`, `invokeCalls === 1`, plus its
  existing one-echo outcome. A rejected initial subscribe never invokes
  `docs_snapshot`; the suggestion's proposed two invokes was false. Deleting
  the post-pick re-arm block SHALL red this exact test.
- `startup-screen.test.tsx` SHALL dynamically import `isTauriRuntime` beside
  its other store value import and assert it is true before rendering. A
  temporary top-level value import of the store SHALL red this legible
  tripwire rather than silently changing the file's runtime.
- EVERY test this task adds or changes SHALL be poisoned and shown red before
  green, with restore evidence in the notes. Prefer changing only the expected
  value while the actual expression and matcher stay fixed. A matcher change
  counts only if the observed value cannot satisfy the new relation;
  widenings such as `arrayContaining`, `.not` and loosened inequalities are
  not evidence.

Verification: headless — app build/types/full vitest, with seven mechanism
mutants demonstrated red: project rebaseline, cleanup, registration deps,
absent-entry ordering, latest-table refresh, post-pick re-arm, and premature
store value import. Every changed assertion also gets an expected-value-only
poison. Boot and graph gates fire because shipped TypeScript moves. @human:
none.

## Implementation notes

Built 2026-08-18 by `codex/gpt-5.6 @fresh` from checkpoint `71fa546`.

`observeBanking` is now the one pure observation transition over a
`BankingObservation`. It owns first-turn priming, newer-snapshot baseline
advancement, unconditional project-directory rebaselining, the docs diff,
and sorted/deduplicated per-turn accumulation. `InterviewChat` updates that
state directly, and the scripted banking tests reduce their observations
through the same export; the hand-copied second loop is gone. The switch
probe covers project A at seq 8 moving to project B at both seq 8 and seq 3:
the switch produces no chip, while B's next snapshot produces exactly
`docs/STATE.md`.

The causation tautology and its "sharpest" claim are gone. The honest
positive now says only that an active-turn docs snapshot produces a chip;
the existing hostile reducer script remains the negative, proving activity
labels and completed text naming docs paths produce none over an unchanged
tree. The accelerator lane has isolated hook mounts for cleanup and
registration lifetime: a post-unmount chord cannot call its action, and two
fresh table identities still produce one add plus one remove. Its listener
tracker comment now names its real `window`/`document` scope. The stale-pull
assertion is one exact observation containing `listenCalls: 2`,
`invokeCalls: 1`, seq 9, the surviving T-901 tree and one echo. The startup
screen dynamically imports and checks `isTauriRuntime()` only after installing
`__TAURI_INTERNALS__`.

### Mutation and poison evidence

All seven requested mechanism mutants were applied one at a time and restored:

- removed project-directory rebaselining: the finalized equal/lower switch
  test failed, with both later B changes missing;
- deleted accelerator cleanup: the cleanup test observed two calls instead
  of one;
- changed registration dependencies from `[]` to `[table]`: the lifetime
  test observed 2 adds / 2 removes instead of 1 / 1;
- moved `preventDefault` above the absent-entry return: the existing scoped
  command suite failed because the board claimed the cancel chord once;
- deleted the latest-table refresh: the existing scoped command suite failed
  because the interview claimed the cancel chord zero times;
- deleted post-pick startup re-arming: the stale-pull test observed
  `listenCalls: 1`, `invokeCalls: 0` instead of 2 / 1;
- added an observably used premature top-level watcher-store value import:
  the runtime tripwire failed `false` versus `true` before any test rendered.

Poison discipline is **6/6 red**. Every added or changed assertion had only
its expected value changed while its actual expression and matcher stayed
fixed: active-turn chip, equal/lower project switch, accelerator cleanup,
accelerator registration lifetime, stale-pull aggregate, and the runtime
tripwire. The combined run reported five failed tests plus the expected
top-level failed suite, one red per assertion; the finalized switch assertion
was poisoned once more after its equal-watermark arm was added. After restore,
the focused suite passed **130/130**. Final restored test SHA-256 values are
`2019421b...f3409` (interview model), `d9736c5e...df5238`
(accelerators), `668c5cc8...134ff6` (startup recovery), and
`da3226ad...195c33` (startup screen). Temporary mutant surfaces
`accelerators.ts` and `watcher-store.ts` have empty diffs.

### Gates and fence

- documented fresh setup used the local cache: parser `npm ci --offline` and
  build; app `npm install --offline`, both with zero audit vulnerabilities;
- focused T-057 Vitest: **130/130**;
- explicit app `npx tsc --noEmit`: green;
- app `npm run build`: green, 265 modules transformed;
- full app Vitest: **825/825 tests in 42 files**;
- boot gate on scratch port 17657: exit 0, observed
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-057` and
  `[nputer] window "main" created`, then stopped by SIGTERM;
- permanent fence is exactly the two shipped genesis files, four test files,
  and this card. No App.tsx, watcher-store, production accelerator, parser,
  Rust, tools/e2e, manifest, token, registry, fixture, IPC, capability,
  filesystem-write, network, real-CLI or model surface moved. Graph
  regeneration is intentionally deferred to the integrator's checkpoint.

No suggestion was filed; the unused premature import being optimized away
was handled inside the required temporary mutant by making its value
observably used, so the module necessarily loaded early.

## Verdicts

### Verifier claude-opus-5 @fresh — 2026-08-19 (in progress, committed incrementally)

Cross-model review: built by `codex/gpt-5.6`, verified by `claude-opus-5`.
`review: independent`.

**Branch state.** `task/T-057-nonvacuous-tests` at `c00184e`, one commit off
`71fa546`. Clean worktree. Diff derived first-hand: 7 files, +236/−78 —
`app/src/genesis/InterviewChat.tsx`, `app/src/genesis/interview-model.ts`,
`app/test/{accelerators.test.tsx,interview-model.test.ts,startup-recovery.test.ts,startup-screen.test.tsx}`
and this card.

**Gates, run first-hand on the branch, exits read unpiped:**

- app Vitest `npm test`: **825 passed (825), 42 files**, `APP_VITEST_EXIT=0`
  — the card's figure reproduces exactly (`71fa546` baseline 822, net +3);
- parser Vitest: **234 passed (234)**, `PARSER_EXIT=0` (untouched lane);
- e2e Playwright on scratch port 14877: **83 passed (22.2s)**, `E2E_EXIT=0`;
- `lint:tokens`: `lint-tokens: clean (117 files scanned under app/src,
  app/test, tools/e2e)`, exit 0;
- app `npx tsc --noEmit`: `APP_TSC_EXIT=0`;
- boot gate, scratch port **17657**, bind-probed free before spawning
  (1420 read-only `lsof` only — the human's app was listening and was never
  bound, connected to or signalled). Script printed
  `detected startup line 1/2` / `2/2` and
  `process tree stopped (exit=null signal=SIGTERM)`. The script prints **no**
  exit code; **my own `echo $?` returned 0** (`BOOT_SCRIPT_RC=0`).

**Fence.** `app/src-tauri/src/acl_pin.rs` whole-file sha256 is
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
`71fa546`, at `c00184e` and in the working tree — byte-identical, so no grant
moved. No Rust, e2e, parser, manifest, capability, token, fixture or IPC
surface is in the diff. `docs/architecture/graph.json` correctly left for the
integrator.

**Mutation drills — all seven the card names, applied one at a time,
restored between each, each restoration proved by sha256 against
`git show HEAD:<path>` (not by a clean `git status`).**

| # | mutant | result |
|---|---|---|
| M1 | project-directory clause removed from `shouldRebaseline` | **red**, 1 test — `changed` flips to `undefined` in **both** the equal (seq 8) and lower (seq 3) arms |
| M2 | `useAccelerators` cleanup return deleted | **red** — `[ 'called', 'called' ]` vs `[ 'called' ]`, exit 1 |
| M3 | registration deps `[]` → `[table]` | **red**, 1 test — `{ adds: 2, removes: 2 }` vs `{ adds: 1, removes: 1 }`; **no other test in the suite caught it**, which is exactly the gap the card claimed |
| M4 | `preventDefault` moved above the absent-entry return | **red** — existing scoped test, "the board never claimed a cancel chord: expected 1 to be +0". No duplicate test was added |
| M5 | latest-table refresh effect deleted | **red** — existing scoped test, "the interview owns the cancel chord: expected +0 to be 1" |
| M6 | post-pick re-arm deleted from `watcher-store.ts` | **red** — stale-pull test observed `listenCalls: 1, invokeCalls: 0` vs `2 / 1` |
| M7 | premature top-level value import of the store, observably used | **red at collect time** — `expected false to be true` at `startup-screen.test.tsx:98`, before any test rendered |

Every figure the card quotes for these seven reproduces. The four final
test-file sha256 values it quotes also reproduce exactly:
`2019421bd68a…f3409`, `d9736c5e8759…df5238`, `668c5cc8832a…134ff6`,
`da3226ad9197…195c33`.

**Matchers.** No fifth "one-sided but relation-preserving" shape found.
Every changed assertion *tightened*: three separate `expect`s with messages
became one whole-object `toEqual`, and `toHaveLength(1)` became an exact
count inside it. No `arrayContaining`, no `.not`, no loosened inequality,
no `toContain` needle. The one matcher worth a second look —
`toEqual` ignoring `undefined` properties in the switch test — cannot bite,
because the object literal always sets the key.

**The recursive check: is there a vacuous assertion inside T-057 itself?**
Yes, one, and three lesser findings. Filed as
`T-057-s1`…`T-057-s4` (`status: suggested`):

- **s1 — the replacement positive chip test is a duplicate.** Criterion 3's
  honest positive, `"a docs snapshot during an active turn produces a chip"`,
  is the same `bank()` call as `"a file that lands AFTER completed still
  belongs to that turn"` three cases above it: same seq, same turn, same
  prime, same matcher, same expected value. The only difference is an inert
  content string. **Measured:** rewriting `"written"` to `"v1"` makes the two
  calls character-identical and the file still passes 58/58. It kills no
  mutant of its own — it stayed green under M1 and under the deleted
  different-project guard. The `f(x) === f(x)` tautology was not removed so
  much as spread across two tests. It does red under an expected-value
  poison, which is why the card's poison discipline passed it.
- **s2 — the relocation added re-renders.** Faithful rule, but the baseline
  moved from a `useRef` to `useState`, so a snapshot that advances the seq
  and banks nothing now returns a fresh object and re-renders where the old
  code called no setter at all. Measured with a temporary probe:
  `M9 identity kept: false | prev baseline seq: 1 | next baseline seq: 2 |
  chipsByTurn identity: true`. Bounded impact (it re-fires an auto-scroll
  effect that is a no-op at the bottom), but it is a behaviour change no test
  on this branch can see, moving against T-056's direction.
- **s3 — `interview-model.ts`'s header still says "and tested"** about the
  human-writes-the-file property, whose only test this commit deleted. The
  comment now lies, in the file T-057 edited. Not strictly a criterion miss
  (the "sharpest proof" wording it names was in the test file and is gone).
- **s4 — the switch test's `switched: undefined` half** is held by
  `bankedSince`'s stale-seq guard, not the different-project guard its name
  implies: deleting that guard reds two *pre-existing* tests and leaves this
  one green. A tension rather than a mistake — the equal/lower watermarks are
  precisely what makes the load-bearing `changed` half isolate the projectDir
  clause.

**One failure was mine, not the branch's.** After the drills the full app
suite reported `1 failed | 824 passed`, on
`shell-harness.test.ts > "is not stale: the build is at least as new as the
store"`. That test compares mtimes; restoring files by rewriting them from
`git show` bumps mtime while leaving content sha-identical. `npm run build`
(green, **265 modules transformed** — the card's figure exactly) cleared it
and the suite returned to **825 passed (825)**, `FINAL_APP_EXIT=0`. Recorded
so the number is not mistaken for a flake in the branch.

**Two stamp facts for the integrator, neither a defect against the builder.**
`status:` still reads `planned` and should read `verifying` — size M, so
`method/roles/executor.md:19` does not allow `done`. That is almost certainly
the stamp the builder's usage limit interrupted; status left alone as
instructed. And `docs/architecture/graph.json` is correctly not regenerated.

**VERDICT: APPROVED.** The branch is complete — every acceptance criterion
is met, and the card's own evidence reproduces line for line, including four
sha256 values and the 265-module build. All seven mechanism mutants were
re-derived first-hand and each red. The four findings above are follow-ups,
not blockers: s1 and s4 are assertions weaker than their names, s2 is an
unpinned behaviour change, s3 is a stale comment. None of them makes a
shipped mechanism wrong, and none of them was green under a mutant that
should have red.
