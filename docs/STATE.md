# State

Updated: 2026-08-18 by integrator (T-029 merged), claude-opus-5 @fresh

## Just completed

**T-029 — genesis resume + hand-driven fallback. MILESTONE 3'S LAST
CARD.** Size M, **ten** criterion bullets (five original, two folded at
the 2026-08-16 triage, three at the 2026-08-17 one), `touches:` recorded
here as **`[app-interview, app-agent, app-shell, tools/e2e/]`** against
the card's two-lane field. Built by `claude-opus-5 @fresh`, **REJECTED**
by `claude-opus-5 @fresh`, fixed by a SECOND `claude-opus-5 @fresh`
executor, **APPROVED** on re-verification, `review: same-model`. Merge
**`f812d9e`**. **15 commits, 30 files, +4,924 / −140** — the largest
card in the milestone after T-027.

**THE INTERVIEW STOPS BEING A ONE-SITTING, ONE-MACHINE THING.** Three
dead ends close, and they are three different kinds of dead end. **An
app restart mid-interview** used to show an empty chat over a live
session; the app now offers RESUME — same native session id, the
conversation rehydrated from `transcript.jsonl`, and the stage and
banked artifacts read from `docs/` as truth, never from the cache. Lose
the cache and resume still works off the registry plus the docs, showing
banked progress in place of history (losable by charter, pinned).
**A session that will not resume** continues as a FRESH one over the
banked docs, assembled with T-023's resume rule — which the executor
`git grep`ed before building on it, and which unlike T-028's "completion
signal" actually EXISTS (`method/roles/planner.md:79`). **A machine with
no supported CLI** gets the hand-driven MODE: the assembled kickoff in a
copyable block, the live right half, the same completion detection —
ADR-006's manual-interview instrument as a first-class mode rather than
a fallback nobody built.

**AND TWO FAILURES THE STREAM NAMES ARE NOW TYPED.** `AuthFailed
{ status, message }` renders the one action that helps and routes to the
hand-driven escape; `ToolDenied { denials, terminal_reason }` names the
tool when `--allowedTools` was too narrow. Beside them
`RejectedSessionId` / `SessionIdRejected` (T-039-s3's blunt envelopes
split), a `listenerFailed` flag on the STORE so a refused turn channel
can no longer leave the chat silently empty (T-027-s2, shape 1 as the
card required — shape 2 was rejected in advance), and a read boundary on
`SessionEntry.model` that refuses without refusing the resume
(T-047-s3).

## THE REJECTION IS PART OF THIS CARD'S RECORD — read it before the rest

**T-029-s6 WAS A BLOCKER AND IT WOULD HAVE SHIPPED A LIE.** `auth_status`
was a MONOTONE LATCH: the `Diagnostic` arm set it from any in-band
`error_status`, and the `Result` arm overwrote it only when the terminal
line carried an `api_error_status` of its own. So a 401 the CLI RETRIED
AND RECOVERED FROM survived to the classification closure, and a turn
that then died of anything else reported as `AuthFailed`. The verifier
reproduced it against the real `run_turn` with a control that
discriminates:

    init · api_retry 401 · text delta · result{is_error:true,
      terminal_reason:"error_during_execution", result:"Error: ENOSPC…"} · exit 1
    => AuthFailed { status: Some(401), message: "Error: ENOSPC: no space
                    left on device, write '…/docs/NORTH_STAR.md'" }

    CONTROL — byte-identical but with NO 401 line
    => ExitNonZero { code: Some(1), stderr_tail: "Error: ENOSPC" }

**Why it is worse than the blunt failure it replaced.** For `authFailed`
`failureAction` returns `retry: false`, so `FailureBlock` **REMOVES the
Try again button** — the one action that would have worked — prints
`claude login` at a user whose login is fine, and renders the failure's
own text directly underneath, so the block contradicts itself: *your
CLI's login has expired* over *no space left on device*. **And it
shadowed this task's own new classification**: a real tool denial behind
a transient 401 reported as `AuthFailed`, so `ToolDenied` lost to the
bug. Closed by dropping ONE `is_some()` guard so a terminal result line
without `api_error_status` CLEARS the stale status. **T-029-s7** is the
same defect once more in the same closure — `permission_denials` treated
as CAUSE when merely PRESENT — closed with the NARROW arm only.

**THE NARROW ARM IS DISCLOSED IN THE CODE, and that is the pattern worth
keeping.** Fourteen lines at **`runner.rs:1461-1480`**, sitting ON the
guard, where the next reader meets the reasoning before they meet the
narrowness: the wider `terminal_reason` form needs a vocabulary
**T-029-s5 records as still unverified** (no live denial could be
provoked from a revoked login, so the fixture's `"refusal"` is
CONSTRUCTED, not transcribed), while `result_is_error` is a field the
CLI demonstrably sets. Refusing to build on a guessed vocabulary is what
the rejection taught, applied one commit later. **I verified this by
reading the code, not the notes.**

**THE RE-VERIFIER'S CARD-INTEGRITY CHECK IS THE ONE NOBODY WOULD THINK
TO RUN, AND I RE-RAN IT.** `## Verdicts` is **236 lines, sha256
`1d180a1898e32830…`**, byte-identical at `307319b`, `5379752` and
`4540821` — **three refs, not four**; the four-ref claim belongs to
`acl_pin.rs`, which is a different measurement. The load-bearing form is
better than either: **the first 236 lines of `## Verdicts` at the tip
`c178773` hash to the same `1d180a1898e32830…`**, so the rejection
record survives verbatim under the re-verification appended below it.
`## Acceptance criteria` is **99 lines, sha256 `149083f2a5edb28b…` at
`bdecad8` AND at every branch ref** — no criterion moved on the branch at
all, which is stronger than the card claims. Both hashes re-checked
AFTER my `status:` stamp: unchanged.

## THE MERGE ITSELF

**CLEAN, and predicted before it was performed.** Merge **`f812d9e`**,
merge-base **`bdecad8`**, main-before **`9d30d0e`**.
`git merge-tree --write-tree 9d30d0e c178773` was run FIRST and predicted
**`2876bac9`** with no conflict output; `git merge --no-ff --no-commit`
produced a staged tree that IS
**`2876bac9bbff4d880e3366f18042094be526755e`, byte-equal**. `--no-ff`,
never a rebase. **No reconcile was needed** — unlike T-028's merge, the
two parents composed with nothing extra and the merge commit carries the
branch's 30 files exactly.

**BOTH SIDES ENUMERATED BEFORE MERGING, AND THE INTERSECTION IS EMPTY —
but this time for a reason worth stating.** **30 branch files against
ONE main-side file**, `comm -12` returns **ZERO**. Main has moved by
exactly `docs/STATE.md` since the base: `2fc3475`, `4e4d900`, `145b2b4`
and `9d30d0e` are **four architect commits, all STATE-only**. **The
dispatch brief said the base was behind T-053's, T-051's and T-028's
merges; it is not** — `bdecad8` IS T-028's checkpoint, so all three
merges are ANCESTORS of the base and none of them is main-side work.
That is the useful correction: an "everything main did since the base"
list is only as good as where the base actually sits.

**THE `<main-before>` WRINKLE IS THE NARROWEST EVER RECORDED, and that
is itself the news.** `9d30d0e..HEAD` = **30 files, +4,924 / −140**. The
naive `bdecad8..HEAD` = **31 files, +5,045 / −159** — a factor of
**1.03×**, against T-051's 9× and T-028's 5.2×. The single extra file is
`docs/STATE.md`. **The rule cost nothing here and that is exactly when
it stops being applied**; it is written down because six integrators had
to re-derive it, and a merge where it does not matter is not evidence
that it never does.

## The graph regen

STANDING INTEGRATOR PRACTICE (T-009-s1), **THIRTIETH** exercise. The
top-of-file log in `architecture-dogfood.test.ts` is unbroken from
T-028's block.

**FIRED**: **13** `.ts/.tsx` files outside `docs/` in `9d30d0e..HEAD`, of
which **11 are indexed** — `tools/e2e/tests/resume-fallback.spec.ts` and
`tools/e2e/tests/shell-harness.ts` are under `.nputerignore`d `tools/`.
Order per `ceaa949` — regen to MEASURE, then the fixture edits, then the
FINAL regen. **Confirmed necessary live AGAIN, twentieth hold**: the sha
moved from `1c6d6fcb` (measuring) to **`5bc40c72`** (final) purely
because the two fixtures are themselves indexed.

**ELEVEN INDEXED FILES CHANGED AND THE GRAPH GAINED EXACTLY ONE NODE.**
Only **`app/test/interview-resume-dom.test.tsx`** is NEW; the other ten
are MODIFICATIONS, which move hash, loc and symbols and can never move a
mapping count. **Derive the mapping move from the INDEXED ADDED-file
list, never from the merge's diff and never from the indexed CHANGED
list** — this is the fourth merge running where that distinction decides
the number, and the first where the gap is 11 → 1.

**AND THE TOKEN LINT IS THE MIRROR IMAGE AGAIN, in the other direction.**
It walks `app/src`, `app/test` AND `tools/e2e`, so it takes **BOTH** new
files (114 → **116**, +2) where the graph takes **ONE** (114 → **115**,
+1). Two walk policies, two different answers about the same pair of
files, and neither is the other's proxy. At T-028 the lint saw one MORE
than the graph; here it sees one more again, by the same mechanism.

**The graph:** **114 → 115 files**, **916 → 953 symbols**, **1408 →
1468 edges** (import 435 → 442 **+7**, call 408 → 436 **+28**, type_ref
565 → 590 **+25**), 532,485 → **554,130 bytes**. Languages still
`["ts"]`. Final sha256
**`5bc40c72c6ec2de65ff5c320f7198baaf4ec85ea70c0ff01a567f07d1e6c8d53`**.
**DETERMINISM PROVED** — two consecutive regens byte-identical, `cmp`
exit **0**, both sides `5bc40c72…`. Plain non-golden self-check with
`NPUTER_UPDATE_GOLDEN` confirmed **UNSET at the shell**:
`self_graph_is_current … ok`, exit 0. Cross-checked with the SECOND
instrument: `nputer-index index --check --root <repo>` →
`graph.json is CURRENT … (554130 bytes, 115 files, 953 symbols, 1468
edges)`, exit 0. **Two independent instruments, both green.**

**THE COMPONENT PICTURE DID NOT MOVE, and unlike T-051's and T-053's
regens the reason is NOT that the new edges are package-headed.** They
reach real component heads — `docs-model` (C-10), `InterviewChat.tsx`
and `interview-source.ts` (C-13), `agent-store.ts` (C-14). They simply
land on pairs that already existed. Mapping 114 → 115 with **ONE**
per-component move (**C-05 53 → 54**). The relation table holds at **32
rows**, tally **13 confirmed / 10 undeclared / 9 planned**, with
**three** observedCounts climbing (C-05→C-10 31→32, C-05→C-13 13→15,
C-05→C-14 5→6) and **two** D1 `fileEdges` lists growing. **No finding is
created or removed**, which is why every drift ring holds — see below.

**ONE MEASUREMENT SETTLED FOR THE NEXT INTEGRATOR.**
`interview-resume-dom.test.tsx` imports `agent-store` BOTH statically
(line 5) and dynamically (line 65) and contributes **exactly ONE** file
edge. **`observedCount` is the number of DISTINCT `(from,to)` FILE
PAIRS, not the number of import statements** — the two-dynamic-imports
case adds two only because they name two different targets. That was a
live uncertainty in the forecast and it is now a measurement.

### THE FORECAST WAS **COMPLETE** — every site, every value, zero reds

**Six assertion sites were derived BEFORE anything ran, and all six were
right** — plus a longer list of "these must NOT move", every one of
which held. `architecture-dogfood.test.ts`: the `it()` name and
`fileComponent.size` (114 → 115), C-05's row (53 → 54), the findings
array (two `fileEdges` lists growing), the relation table's three
observedCounts. `map-dogfood-render.test.tsx`: the index hint
(114 → 115). **The suite went green on the first run after the edits —
one measuring regen, one final regen, no third round.**

**The method that made it complete is the one the LAST checkpoint asked
for, used rather than admired.** T-028's miss produced a written fix:
*derive the fixture's expected values by RUNNING the derivation and
DIFFING against the committed fixture, instead of enumerating sites by
reading.* This merge did exactly that — a throwaway probe `it()` was
appended to the dogfood suite, run once against the freshly regenerated
graph to dump `fileComponent`, `findings`, `edges`, the drift set and
the per-component D1 counts, and then **REMOVED and proved removed by
sha256 against `git show HEAD:<path>`** (`dfad1a58…`, byte-identical) —
never by a clean `git status`.

**AND THE TRAP T-028 FELL INTO WAS CHECKED HEAD-ON RATHER THAN ASSUMED
AWAY.** T-028's miss was `map-dogfood-render.test.tsx:124`, C-13's DRIFT
COUNT, because a drift count moves when the NUMBER of a component's D1
findings moves. Here the per-source D1 counts are **C-05 4, C-08 1,
C-09 1, C-13 4 — byte-identical**, and they hold for the RIGHT reason,
measured: this merge creates no finding, so two lists grow and no ring
does. **That is the third distinct behaviour this fixture has shown in
four merges** — T-051/T-053 held because their edges were package-headed,
T-028 moved because it created findings, T-029 holds because its edges
land on existing pairs. Three mechanisms, one number: **never reason
from "the rings did not move last time".** The comment in the fixture now
says which mechanism applied here.

**The older trap was caught again too**: the edge count and the
undeclared tally at `map-dogfood-render.test.tsx:196`/`:199` are two
assertions in ONE body, and C-05's row is the SECOND in its body. Both
were forecast, so neither could hide behind the other.

**T-024's three-fixtures rule does NOT fire, VERIFIED rather than
assumed** — `git diff 9d30d0e..HEAD -- docs/architecture/components/` is
a **0-file diff**, the card declares no component, and the parser never
reads the graph, so `lib/parser/test/smoke.test.ts` is deliberately
untouched. Its live-tree walk still re-parses the whole repo at **0
issues**, with this merge's ten new `docs/tasks/` files in it.

**TWO STALE `it()` NAMES CORRECTED, and it is a truth repair rather than
a loosening.** T-028's merge moved the relation table to 32 rows and the
undeclared tally to 10 but left three descriptions one merge behind:
`"THE FINDINGS: eight undeclared…"` (there are ten), `"the full relation
table: 13 confirmed, 8 undeclared, 9 planned"` (it is 13/10/9) and
`"draws the full 30-edge relation table"` (it asserts 32). All three
now state what the body actually asserts. **A test name that misreports
its own assertion is exactly the kind of thing this project treats as a
defect**, and it was in a file I was already reconciling.

## The gates — BOTH FIRED, and both ran

**"The merge's diff" is `<main-before>..HEAD`** (`docs/CONVENTIONS.md`,
`98f931e`). Used deliberately; see the 1.03× note above.

**BOOT GATE (T-046): FIRED, RAN, GREEN.** Trigger set from
`9d30d0e..HEAD`: **`app/src/**` = 5 files · `app/src-tauri/**` = 7 ·
`app/package.json` = not present · `app/src-tauri/Cargo.toml` = not
present.** BOTH classes at once — the first merge since T-027 to carry
frontend and Rust together, which is the combination the gate exists
for. Scratch port **17430**, bind-probed free immediately before use.
Output verbatim:

    [boot-check] port 17430 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:17430","beforeDevCommand":"npm run dev -- --port 17430 --strictPort"}}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=17430 — threading --config {"build":{"devUrl":"http://localhost:17430","beforeDevCommand":"npm run dev -- --port 17430 --strictPort"}}
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)

**`BOOT_EXIT=0`** — and one small correction to four checkpoints
including this file: **`BOOT_EXIT` is NOT printed by the script.**
`git grep BOOT_EXIT` finds it in `docs/` only, never under `tools/e2e`
or `.github`. It is the integrator's own `echo $?` and the transcripts
above have been quoting it inside a "verbatim" block as though the
harness emitted it. The exit code is real and it is 0; the LINE is ours.

**GRAPH REGEN: FIRED, ran, green.** Trigger from `9d30d0e..HEAD` = **13
`.ts/.tsx` files outside `docs/`**, of which **11 are indexed**.

**T-061's hazard did NOT recur**: after the boot check, ports 17420,
17430 and 17431 were all empty and the only live `tauri dev`/`vite` tree
was the human's own — pids **82342 / 82364 / 82549**, i.e. the
architect's app and **not a stray of this merge**.

**THE `--root` FALSE RED REPRODUCED DELIBERATELY, AND THE SECOND LINE
READ.** Run from `app/src-tauri/` without `--root`, `index --check`
exits **1**. The correction T-054's executor measured
(`docs/STATE.md` at `145b2b4`) is exactly right and this is its fourth
reproduction — **the headline is the STALE headline, byte-identical to a
real red**; `MISSING` appears only on the SECOND line:

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   MISSING at docs/architecture/graph.json

**Always read the second line.** This is the first merge where the
correction was applied PROSPECTIVELY rather than retrofitted, and it
cost nothing: the green run with `--root` was taken first and the red
was provoked beside it on purpose.

**CI STILL HAS NEVER GATED GRAPH CURRENCY.** `ci.yml:127` is bare
`cargo test`, which skips `#[ignore]`d tests, and `self_graph_is_current`
is `#[ignore]`d. **Thirty regens held up by a written ritual and
conscientious integrators, nothing else.** T-054 closes it and is IN
FLIGHT as of this checkpoint.

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**IT HOT-RELOADED UNDER THEM, and that is expected, unavoidable and
recorded.** The app ran out of the MAIN checkout throughout — `node` pid
**82549** on `[::1]:1420`, under `npm run tauri dev` pid 82342 / tauri
node pid 82364. **This merge rewrites FIVE files under `app/src/`**, so
vite recompiled and the human's window changed its contents mid-session.
There is no way to land T-029 without that; the honest thing is to say
so rather than to imply the app was untouched. **The Rust half did NOT
reach them**: `tauri dev` does not hot-swap the binary, so the seven
`app/src-tauri/**` files — including every new command — are on disk and
NOT in the process they are running. **Their window now runs T-029's
frontend against T-028's backend**, which is a state no user will ever
be in and which a relaunch fixes.

**1420 was never bound, connected to or signalled.** The only
interaction at any point was read-only `lsof`, run at session start,
after the merge, before the boot gate, after the boot gate, after the
e2e lane and at the end — **one listener, healthy, every time**. The
boot gate took **17430**, the e2e lane **17420**, the fresh-install
worktree's lane **17440**; all three bind-probed free first and all
three empty afterwards.

**THE PARSER `dist/` WAS A MEASURED NO-OP for the second merge running.**
`app/node_modules/@nputer/parser` is a **symlink** to `../../../lib/parser`
whose `exports` point at `dist/`, so ADR-011's required
`npm run build` in `lib/parser` can rewrite what the RUNNING app parses
with, without a single file under `app/` being touched — T-052's
instance 5. **Here it did not.** T-029 touches **zero** `lib/parser`
files (`git diff 9d30d0e..HEAD -- lib/parser` is EMPTY), so the required
build was a genuine no-op: dist **48 files before and 48 after**, and —
heeding the trap two checkpoints ago — compared **per-file** rather than
by rollup: **ZERO files differ**.

**THE WINDOW IS STILL 800×600 AND STILL NEEDS A RELAUNCH.**
`tauri.conf.json` is read by `tauri dev` at LAUNCH; T-051's 1280×840 has
still not reached the human's live window and this merge does not change
that. **They now have T-029's frontend, T-028's crescendo, T-051's
manifest and T-029's Rust sitting unloaded on disk** — and can see none
of the last three until they relaunch. The architect will handle the
relaunch; no agent restarted it.

**WHAT WAS NOT DONE, and why.** **No `npm ci` or `npm install` was run
anywhere in `/Users/ujju/Projects/nputer`.** All five suites ran against
the EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B, which has happened. The fresh-install proof was relocated
to a throwaway `git worktree`, **the route now walked four times**.

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the merged parents BEFORE the run**, **never piped through `tail`**,
exit codes read from `$?`.

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  225 in 11 + the merge's ZERO parser files = 225 in 11.** The smoke
  test re-parses the whole live tree at **0 issues**, with the merge's
  ten new `docs/tasks/` files in it.
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **795/795 (42 files)**, exit 0. **DERIVED BEFORE THE RUN:
  main's 768/41 + 11 (`interview-model.test.ts`, 46 → 57 bodies)
  + 16 (`interview-resume-dom.test.tsx`, a new file, all 16 `it()` at
  describe level with no loop wrapping) + 0 each from
  `agent-store.test.ts` (15 → 15), `crescendo-dom.test.tsx` (12 → 12),
  `interview-chat-dom.test.tsx` (38 → 38) and `interview-harness.test.ts`
  (9 → 9) = 795 / 42**, and it landed exactly. Bundle moves correctly
  for a 5-file frontend diff: `index-ByWKsUIt.js` 484.43→488.81 kB /
  `index-DVAVecvn.css` 43.79 kB → **`index-Bf-QNmtC.js` 497.86 kB /
  `index-CryMc_lw.css` 43.90 kB** — **the same content-hashed names the
  executor and the re-verifier each measured independently**, which is a
  third reproduction of a byte-identical bundle.
- **app/src-tauri** bare `cargo test` → **313 passed + 3 ignored, 0
  failed**, exit 0, **zero compiler warnings** (re-checked off a FORCED
  recompile — `touch` on all six changed `.rs` files + `cargo check
  --all-targets`, not a cached build), summed across **13 test binaries
  + 2 doc-test targets** (**108/0/0/46/123/0/7/13/3/7/0/2/4/0/0**).
  **DERIVED: main's 299 + 14** — `tests/agent_runner.rs` goes 33 → 47
  `#[test]`/`#[tokio::test]` attributes, one of which is the `#[ignore]`d
  real-CLI smoke, so its binary goes **32 → 46** and every other slot is
  byte-identical to main's. **Exactly THREE `#[ignore]` attributes
  repo-wide** (`perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:1802`),
  the same three as before; none added, none removed. **NO MODEL WAS
  CALLED** — the smoke was never run.
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=17420 npm
  test` → **74 passed in 14.2 s**, headless chromium, one worker,
  retries 0, **no skips, no retries, no flakes**. **DERIVED TWO WAYS and
  they agree**: main's 70 + the merge's 4 (`resume-fallback.spec.ts`,
  all four at column 0) = 74; and structurally, **72 raw `test(`
  occurrences across the specs, minus ONE false positive**
  (`workflow-parity.spec.ts:442` is `i.match.test(s.run)`, a RegExp
  method call) = **71 declarations**, of which **68 sit at column 0 and
  3 sit INSIDE two-iteration loops** (`keyboard-activation:34`,
  `panel-real-keys:40`, `window-contract:318`) = 68 + 3×2 = **74
  EXECUTIONS**. Counting declarations would have forecast 71; counting
  the naive grep 72. The run's own numbering confirms all three doubles.
- **`npm run lint:tokens`** → `clean (116 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED: main's
  114 + 2** — `app/test/interview-resume-dom.test.tsx` and
  `tools/e2e/tests/resume-fallback.spec.ts`. `-- --selftest` → **49
  samples green, 14 walk-policy checks green**.

**`EXPECTED_GRANTS` BYTE-UNCHANGED, QUOTED IN THE ONLY REPRODUCIBLE
FORM.** `acl_pin.rs` is a **0-file diff** and its **whole-file sha256 is
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
`bdecad8`, `307319b`, `5379752`, `4540821` AND `c178773`** — five refs —
with **92 grant lines** counted off the declaration at the base and the
tip. **No byte count is quoted**: three agents produced three different
figures from three different ranges (6134 the declaration, 6135 with its
terminating newline, 6110/6109/6107/6106 for four other conventions),
and the whole-file hash is the only form that cannot drift. Its pins
re-run green inside the 313. **`ENV_ALLOWLIST` sha256
`cf80f850b96a6f03661c2f0871a54b5199ab82eeefb39da29e76c13ef1e7245e`
identical at `bdecad8` and `c178773`, 16 entries** — my own extraction
measures the block at **423 bytes**, matching the re-verifier and
correcting the executor's 422, which is precisely why the hash is the
form to quote.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: EDITED, and it is the milestone's closing entry.** The
  discriminator ("does the task add a USER CAPABILITY") is met three
  times over: a restart that used to lose the conversation, a session
  that used to be a dead end, and a machine with no CLI that used to
  have no genesis at all. The entry says what a user can walk end to
  end, states the rejection in one paragraph **because a user would have
  felt that bug**, and **says plainly what is still not true**. **The
  milestone is NOT claimed** — see §3 below for the reason, which is not
  a task.
- **ARCHITECTURE: EDITED, and for the right reason — a component changed
  what it IS.** Checked against the standing correction first: the
  Components table stops at C-07, so C-13 and C-14 have no rows and the
  changes go in C-05's cell, the Interfaces bullet and the code-layout
  paragraph that already track them. **C-14 was the SPAWN surface; it is
  now the component that decides what happens when there is nothing to
  spawn** — it classifies WHY a turn died as typed outcomes rather than
  relaying an exit code, owns "an interview ran here" as one fact in one
  file, reads `SessionEntry.model` through a refusable accessor, and
  **assembles a kickoff for a HUMAN's terminal**. A component that
  serves a user with no child process is not the same component as a
  spawner. **C-13 changed by DEGREE, not kind**, and the graph says so:
  its whole relation row set is byte-unchanged at this merge. **The IPC
  surface went NINE → THIRTEEN** and C-05's cell said "still exactly
  nine", which is now corrected; the count was re-derived from both ends
  and intersected (13 `#[tauri::command]`, 13 in `generate_handler!`,
  against 10 literal `invoke` sites plus `runPicker`'s three). **All four
  new commands are ZERO-ARGUMENT**, which is ADR-012's narrowness rule
  applied rather than cited.
- **THE REGISTRY: NOT EDITED**, and nothing asked it to be — T-029
  declares no component and creates no new component pair. The ten
  undeclared edges stay live drift for the architect.
- **NO NEW ADR (three-prong).** (a) T-029's genuinely new decisions —
  four typed failure variants, four new zero-argument commands, the
  narrow s7 guard — are RULED and recorded on the card, in
  `runner.rs:1461-1480` and in ROADMAP, and ADR-012's own Consequences
  section anticipates F-03 adding app commands and says the
  justification goes in the TASK FILE. None of the four is a new SHAPE
  (a first grant, a first path-taking command). (b) Prong two verified
  MECHANICALLY: **zero new dependencies and zero lockfile lines** — all
  four lockfiles and both manifest families are 0-file diffs;
  `capabilities/**`, `gen/**`, `acl_pin.rs`, `adapter.rs`,
  `tauri.conf.json`, `.github/**`, `method/**` and `lib/**` are 0-file
  diffs too. ADR-011 holds. ADR-003 holds — **no model call was made**;
  every drill ran against `CARGO_BIN_EXE_fake_agent`. ADR-014/015 hold
  and were EXERCISED. **ADR-016 holds for the third merge running and
  needed nothing from the integrator** — `built_by`, `verified_by`,
  `review: same-model` and BOTH `## Verdicts` entries were on the branch
  before I arrived (`c3f86ad` wrote the builder stamps, `307319b` the
  verifier stamps, `c178773` amended them to name the re-verification),
  and **nothing was transcribed**. ADR-017 holds and was re-proved: no
  `writeTextFile`, `writeFile` or `mkdir` anywhere under `app/src`, and
  no `innerHTML`/`dangerouslySetInnerHTML`/`eval`/`new Function` either;
  no shell string is added anywhere in the Rust diff. The register ends
  at **ADR-017**.
  (c) Prong three: the durable calls live in the card's criteria→evidence
  map and its two committed verdicts.
- **THE TASK FILE'S STAMPS WERE COMPLETE except the one that is mine.**
  **Only `status: building → done` was written at the checkpoint** — and
  `built` was never written, because it is not one of TASK-FORMAT's
  eight. `status: building` on the branch was CORRECT and not a defect:
  the architect's ruling at `9d30d0e` (executors stamp `verifying`)
  explicitly exempts cards already in flight. Parser-validated after: **0
  issues**, `T-029 status: done`.
- **`touches:` RECORDED AS `[app-interview, app-agent, app-shell,
  tools/e2e/]`**, DERIVED rather than transcribed: `app/src/genesis/**`
  → C-13 (`app-interview`), `app/src-tauri/src/agent/**` +
  `app/src/lib/agent-store.ts` → C-14 (`app-agent`),
  `app/src-tauri/src/lib.rs` + `app/test/**` → C-05 (`app-shell`), plus
  the lane. The card's two-lane field was correctly left alone — fields
  lock at `status: building`, TASK-FORMAT § Lifecycle. **Two files in
  this merge belong to NO component** — `app/src-tauri/src/bin/fake_agent.rs`
  and `app/src-tauri/tests/agent_runner.rs` — which is T-010's
  unmapped-territory question, invisible while `languages: ["ts"]`.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN, with a refinement worth
  keeping.** `file(1)` over every one of the **35** files this merge and
  checkpoint wrote: 34 `text`, and **`docs/architecture/graph.json`
  reports `JSON data`**. That is `file(1)`'s label for a recognised TEXT
  format — `file --mime` says `application/json; charset=us-ascii` — but
  the standing phrasing in this file has been *"none classified `data`"*,
  which a `grep -i data` would fail on every merge that regenerates the
  graph. **Say `file --mime` and read the charset**, not the bare label.
  The byte scan is the real test and it is clean: a C0 sweep excluding
  tab, newline and CR returns **0 bytes across all 35**. The habit is now
  **twelve-for-twelve**.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was read before **both** commits and the staged set was exactly this
  session's each time (30 at the merge, byte-matching the branch's own
  `bdecad8..c178773` shortstat). Two sibling agents were live in
  `../nputer-T-054` and `../nputer-T-063` throughout and **neither was
  touched**. Scratch files were namespaced `int-t029-`; the one probe
  written into the repo was an appended `it()` in the dogfood suite,
  removed and its removal proved by sha256. House shape held: **merge →
  checkpoint, two commits.**
- **`cargo audit` NOT RUN, and the reason is stated rather than
  implied.** It is the one network-touching command and it fetches the
  RUSTSEC DB per run. The merge is **zero lockfile lines** (`Cargo.lock`
  is a 0-file diff), so the 2026-08-16 baseline — 0 vulnerabilities / 17
  informational, over 472 locked crates — cannot have moved. CI runs it
  every job. **This is a note, not a silence.**

## In progress / broken right now

**TWO LANES ARE LIVE.** Worktrees are open — if this session dies, these
are the first thing to look at:

    ../nputer-T-054   task/T-054-retire-graph-rule  7093652  BUILDING
    ../nputer-T-063   task/T-063-startup-says-so    3e2318c  BUILDING

**Both advanced while this merge ran** (T-054 `5991375 → 7093652`,
T-063 `a967079 → 3e2318c`) and neither was touched by it. **The T-029
worktree is REMOVED and its branch KEPT.**

**T-054 IS THE ONE TO WATCH.** It makes CI gate graph currency, and this
merge is its thirtieth piece of evidence: a stale graph here would have
been one missing file, three wrong observedCounts and two short
`fileEdges` lists, all of them invisible to `cargo test`. It also owns
the `--root` correction that is now four-for-four.

**THE ARCHITECT'S `verifying` RULING STANDS** (`9d30d0e`).
`method/roles/executor.md:18` says an executor sets **`status:
verifying`** on handoff (or `done` for size S); every dispatch written
this week said `building`, and every executor obeyed the dispatch over
the method. **The method is right.** `building` means someone is
actively building it, which is FALSE the moment the executor stops.
And the consequence is not cosmetic: **`verifying` is one of
TASK-FORMAT's eight statuses and has never once been used in this
project**, so the board has never been able to show the state the
pipeline spends most of its time in. Applied from the next dispatch
onward; **cards already stamped `building` are left alone** — T-029 was
one of them, and the integrator flipped it to `done` regardless.

**THE OVERNIGHT GRANTS (human, 2026-08-17, before sleeping).** Recorded
here because a successor session must not re-ask:
- **Four lanes approved**: **T-054**, **T-063**, **T-060**, **T-062**.
- **Triage-born cards may dispatch from the ranked queue WITHOUT further
  approval.** Every card still goes executor → adversarial verifier →
  integrator; a second rejection on the same card PARKS that lane with
  the record intact. **T-029 exercised the first half of that rule and
  came back APPROVED** — one rejection, one fresh executor, one
  re-verification.
- **Three parallel lanes**, matching the load that held (~10 on 10
  cores). Only TWO are running right now, so **one lane is free**.
- **QUEUE, and the reason each waits**: **T-060 is now UNBLOCKED** — it
  waited on T-029 because both are `[app-agent]` and both own
  `runner.rs`, and T-029 has merged. **T-062** still waits on **T-063**
  (both declare `app-shell`). The method forbids parallelizing
  overlapping `touches` and this is the live application of it.

**THE HUMAN'S APP IS RUNNING ON 1420** (node pid **82549**, under
`npm run tauri dev` pid 82342), relaunched DETACHED — an earlier launch
died when its background task was torn down, taking the app with it.
Every agent is briefed to probe it read-only and never bind, connect to
or signal it. **The integrator who takes the next merge inherits T-052's
hazard live**: main's `node_modules` sits under a running vite, so a
fresh install there kills the app (mechanism B). Run installs in a
scratch worktree at the merged commit — **that route is now walked four
times and documented** — or refuse loudly.

**T-029 FILES NINE, and two of them are CLOSED by the fix rather than
open**:

- **T-029-s1** — the auth trace in this file and in the card's notes was
  wrong about `stderr_tail`. **DISCHARGED**: the architect corrected it
  at `2fc3475` and the corrected version is below under @human.
- **T-029-s2** — `.nputer/genesis/transcript.jsonl` is append-only and
  never pruned, and it is now rehydrated on every arrival.
- **T-029-s3** — the fresh-session and resume affordances need a CLI to
  be reachable, so the one screen that offers them is the one a CLI-less
  user never sees. **The sharpest of the seven open ones**, because it is
  a gap between two of this card's own criteria.
- **T-029-s4** — the interview's outcome state lives in two places and
  the chat picks between them by a documented precedence rule.
- **T-029-s5** — **the tool-denial fixture is a CONSTRUCTION, not a
  transcription.** No real CLI denial has ever been observed, which is
  exactly why the s7 guard had to stay narrow. It cannot close without
  an authenticated machine, which puts it beside T-025-s2.
- **T-029-s6 — CLOSED**, the blocking finding, by dropping one
  `is_some()` guard. Kept as a filed record because the defect is the
  most instructive thing in this card.
- **T-029-s7 — CLOSED**, narrow arm only, disclosed in the code.
- **T-029-s8** — **the declined s7 diagnosis relays NOTHING.**
  `stderr_tail: ""`, because the ring push is gated on `is_error`, so
  *"a relayed exit code keeps Try again"* is HALF TRUE: **Try again is
  kept, nothing is relayed** and the screen reads "the planner exited
  with code 1" with no detail at all. The close is one `push` and needs
  no unverified vocabulary. Not blocking — an honest bare exit code
  beats a confident false cause — but it is the one to fix first.
- **T-029-s9** — the terminal-line rule's **two measured edges**: a
  recovered 401 still latches when no result line is written at all
  (PRE-EXISTING, unreached), and a genuine auth failure that names its
  status only in the diagnostic is no longer typed (NEW, and in the safe
  direction — it degrades to the pre-T-029 relayed blob with the 401
  still legible in the tail and Try again restored). The ask is one
  sentence of disclosure, not a change.

**T-028's SIX remain undispositioned** and are the next triage's:
s1 (the elapsed clock re-bases on restart), s2 (the detail panel covers
the whole window), s3 (a hand-driven genesis never reaches completion —
**and T-029's hand-driven MODE makes this sharper, not softer**), s4 (no
gate catches a motion utility used without `motion-safe:`), s5
(DISCHARGED at T-028's merge), and **s6, still the highest-value item in
that set** — `app/tsconfig.json` shares an ambient `.d.ts` between `src`
and `test`, so ADR-017's free typecheck-level guard against the app
writing to disk is GONE. **T-029 does not exploit it** (`writeTextFile`
/ `writeFile` / `mkdir` under `app/src` is still empty, re-proved above),
but nothing replaced the wall.

**T-051's NINE remain undispositioned** too, with s6 discharged at
T-028's merge. s7 and s8 are still the class that does the most damage
unread, because both are CORRECTIONS to claims already written down.

**THE CONTROL-BYTE HAZARD stands at THIRTEEN reproductions across five
sessions.** The habit is **twelve-for-twelve** and it found nothing this
merge. Still no gate; T-058 owns it.

## Next up (1–4)

1. **DISPATCH ORDER. THE MILESTONE-3 TASK LIST IS EMPTY.**
   - **T-060 IS UNBLOCKED AND IT IS THE ONE TO DISPATCH.** STATE has
     recorded NO STANDING SECURITY GATE since T-025-s6 closed at T-039,
     and it is still the sharpest open set: a probe arm that executes a
     relative path the cache gate refuses, a `$SHELL` that picks which
     program runs, and a suite where nothing structurally stops a test
     spawning the real CLI. It waited on T-029 for `runner.rs` and that
     lane is now free. **It should also pick up T-029-s8**, a one-`push`
     close in the same file.
   - **T-054 and T-063 are in flight.** T-054 closes a gate that has
     never existed; T-063 is still the only item in the whole backlog
     with a real user report attached. **T-062 unblocks the moment T-063
     merges.**
   - **Milestone-4-adjacent**: **T-055** in lib-parser (lane free);
     T-057, T-058, T-059 (`blocked_by: [T-033]`, and it DISSOLVES if
     that ruling moves `arch` to the Node CLI); and T-065. **Read T-062
     and T-065 together** — T-062 changes the shell's scroll model and
     will move exactly the numbers T-065's corrected criterion 4 names.
   - **Then T-061** (a demonstrated orphaned listener — **it did not
     recur at this merge**, measured above) and **T-064**.
   - **T-010 is now more interesting than its position suggests.**
     T-029's whole Rust half is invisible to the map: `languages:
     ["ts"]` means C-14 renders as ONE file while its real territory is
     `app/src-tauri/src/agent/**`, and this merge changed four of those
     files and added four commands without moving a single node.
     **The map under-reports the component that changed most.**
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier is in the shipped CSS and no gate can see the directory.
     It has no suggestion file and never did. **T-058 is its natural
     neighbour**; fold it there or file it, but do not let a fourth
     triage lose it.
   - **Carried and still un-homed**: a rolled-up `find … | xargs shasum`
     hashes PATHS as well as bytes, so any standing "did I disturb it"
     check on the `app/node_modules/@nputer/parser` symlink must fix the
     convention or compare per-file. Two merges running have compared
     per-file and had no trouble. T-052's neighbourhood.
2. **@human — THE MORNING'S AGENDA. The app IS running; the architect
   relaunched it out of main and this merge left it running** — but
   **it hot-reloaded under you**, because T-029 rewrites five files
   under `app/src/`. **YOUR WINDOW IS STILL 800×600, AND IT IS NOW ALSO
   RUNNING YESTERDAY'S RUST.** `tauri dev` does not hot-swap the binary,
   so T-029's four new commands are on disk and not in your process.
   **Relaunch** — you want it for T-051's 1280×840 anyway, and without
   it none of T-029's resume, fresh-session or hand-driven affordances
   can actually fire. You pick up everything at once: T-042's genesis
   truthfulness, T-014's 23 CSS bytes, T-027's entire screen, T-028's
   crescendo, and now **the interview that survives being closed.**

   **READ THIS BEFORE OPENING A GENESIS FOLDER.** The interview
   auto-starts on arrival, and on this machine the CLI login is revoked,
   so the first turn fails. **Run `claude login` first.**

   **THE CORRECTED AUTH TRACE (architect, 2026-08-17, correcting
   itself).** An earlier version of this paragraph said the screen
   "says exactly 'the planner exited with code 1', shows no detail at
   all" and that "nothing points at the login". T-029's executor refused
   to build on it and re-derived instead. **Three of those five steps do
   not survive reproduction**, and one command settles it:
   `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
   (`app/src-tauri/tests/agent_runner.rs`) asserts
   `stderr_tail.contains("401")` and passes on main. The error was
   reasoning from "stderr is empty" — true — to "`stderr_tail` is
   empty", which is false. **`stderr_ring` is not a stderr ring**: it
   has THREE writers, and T-025 wired the in-band lines into it
   deliberately. What the screen ACTUALLY showed on `bdecad8` was "the
   planner exited with code 1" over the CLI's own words as an escaped
   one-line blob. **The criterion's own wording — "a TYPED outcome
   rather than a relayed blob" — was the accurate one all along**, and
   **T-029 has now closed it**: an expired login says so and keeps a way
   forward. The lesson stands and is worth more than the fix: **a trace
   written by reading code is evidence to reproduce, exactly like a
   number in a card body.**

   To reach the interview at all a folder needs NO `docs/ROADMAP.md` and
   NO `docs/tasks/*.md` (`PlanProbe::has_plan`, `docs_watch.rs:414` — an
   `ARCHITECTURE.md` alone is still genesis-eligible). There is no
   `genesis-demo` folder anywhere on disk; `mkdir` one.
   - **THE MILESTONE CLOSER, AND IT IS NOW THE ONLY THING LEFT:**
     **a real, timed, end-to-end genesis on a toy idea** (T-028's
     criterion 2, target ≤30 min), judged live, with **light and dark
     completion screenshots**. Every card is through the pipeline; this
     is the one that turns all of it from mechanism into evidence, and
     it needs `claude login` first. **It is yours and nothing else can
     substitute for it.**
   - **FOUR NEW JUDGMENTS FROM T-029**, all headless-invisible:
     1. **The hand-driven block in LIGHT AND DARK.** A copyable kickoff
        in a code-ish block on the interview's left half — does it read
        as an invitation or as an error state? It has no design source.
     2. **The resume offer.** You arrive at a project with an interview
        in flight and are offered resume, fresh-session, or neither.
        Does it read as "pick up where you left off", or as a dialog in
        the way?
     3. **The auth failure, now that it has an action.** `claude login`
        plus a route into the hand-driven mode. Does the escape read as
        a real option or as a consolation prize?
     4. **The rehydrated transcript.** Reopen mid-interview: does the
        conversation look like the one you left, or like a log?
   - **T-028's FIVE and T-027's SIX are unchanged** and still yours: the
     completion panel in light and dark (no design source at all); the
     board at 640–800px; the rain at fifty cards; "the board, so far"
     as the overline; whether the completion panel belongs above or
     below the board; the one-question-at-a-time feel; the challenge
     treatment in both schemes; the eight disclosed deviations,
     especially the line-height gap; the 640/lens balance at 1280 and
     1440; **T-051-s3 (840 vs 867, the ~28px macOS title bar)**; and
     whether the header reads as the design's "nputer — new project".
   - **ONE REAL OBSERVED PLANNER TURN** — still the biggest unobserved
     thing in the project and now the ONLY thing between milestone 3 and
     an honest claim. **T-025-s2 carries the exact command.**
   - **The at-a-glance amber judgment**; **the launch shot**; **T-023's
     dry-run transcript quality**; **a Linux run**.
   - **T-050-s2 still matters most of the older set**: escaping the
     failure screen with "Open a folder…" rather than "Try again"
     reaches a board with real content that is **silently dead**.
   - **The six T-034 judgments**, of which **WAVE 0 IS A WALL
     (T-034-s1)** is the big one: 32 of 50 cards in one wave, a
     1440×3818 canvas in a ~600 px pane.
   - **The model badges should be SHORT** (T-030-s1); **the header's
     density** (T-049's item); **T-024's pane light AND dark**;
     **T-026's front door light AND dark** (read **T-048-s4 BEFORE
     T-048-s3** — s3's conclusion is wrong); the real picker flows; the
     `tauri dev` quit-the-app orphan check.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
3. **MILESTONE 3 (F-03) — THE TASK LIST IS DONE AND THE MILESTONE IS
   STILL NOT CLAIMED.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 →
   T-041 → T-042 → T-048 → T-049 → T-050 → T-027 → T-051 → T-028 →
   **T-029** are all through the pipeline. **Nothing remains on the
   list.** And the milestone still cannot be claimed, for a reason that
   has nothing to do with the list: **not one planner turn has ever been
   observed against a real model.** This machine's `claude` OAuth token
   is revoked, so no model call has ever gone through the runner. **Every
   stream this app has ever seen is a scripted fixture landing in
   milliseconds** — which means the one thing an interview actually is,
   a conversation that takes time with a model that can misunderstand
   you, has never been exercised at all. What EXISTS is a real
   conversation surface with a real event channel, a real file-evidence
   join, a real board handoff and now real recovery from being closed;
   whether it is a GOOD interview is unknown. **The evidence it waits on
   is a real, timed, end-to-end genesis run. It is @human's and it is on
   the list above.** Do not claim the milestone before it exists.
   **MILESTONE 4** carries T-010, T-013, T-015 and T-053. **T-010 is
   still the interesting one** — it makes `languages: ["ts"]` false,
   indexes the 44 `.rs` files, turns the four unclaimed ones into live
   unmapped-territory findings, and would have made this merge's biggest
   change visible on the map instead of invisible.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is **EXHAUSTED — T-029 was its last card.** Grant 2
   closed at T-034; grant 3 (third triage applied) stands, and **tasks
   NEWLY created by triage still do NOT dispatch without the human.**
   Unchanged method rules: a second REJECTED parks a lane for the human;
   @human judgments are never self-answered; no screen control beyond
   the ruled boot check; **port 1420 is the human's, and it is
   OCCUPIED.**
   **THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files**
   and closed at **16, every one PARKED with a dated trigger to unpark**:

       66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                    1 removed as already-absorbed

   **THE SIXTEEN PARKED are unmoved**: the nine standing (T-003-s2,
   T-008-s1, T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4,
   T-026-s1, T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human),
   T-034-s1 (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **The test that moves them**: *what merged recently that makes this
   item's "not live yet" clause false?* **T-029 is a live worked example
   for the next triage**: any parked item whose premise was "the
   interview cannot survive a restart", "there is no CLI-less path" or
   "an auth failure is a dead end" has just expired.
   **LANE AVAILABILITY.** T-029 released `app-interview`, `app-agent`
   and its half of `app-shell`. `app-agent` FREE (**T-060** wants it
   FIRST, then T-043); `app-interview` FREE; `app-shell` HELD by T-063
   (**T-062** queued behind it), and the standing queue's next named
   item there is **T-022** (M, milestone 4, `blocked_by: []`, which
   T-034-s3 made bigger); `lib-parser` FREE (**T-055**, **T-031**,
   **T-032** — and **T-032 carries T-034-s7**, a criterion that reads as
   an instruction to type a control byte and **should be amended BEFORE
   it is built**); `crate-index` HELD by T-054 (**T-010**, **T-013**,
   **T-015** behind it); `app-map` free (T-013, T-015, T-032's map-badge
   half); `app-board` free.

## Health of the tree

The T-029 worktree is removed and its branch KEPT — **41 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 116 files at zero allowlist; the committed graph current and proved
so **twice, by two independent instruments**, and **deterministic across
two consecutive regens**. The parser re-parses the whole live tree at
**0 issues**, with this merge's ten new `docs/tasks/` files in it.

**THE BOARD, as MAIN sees it**: **109 task files**, tally **42 done / 23
planned / 16 parked / 28 suggested / 0 building**, plus **9 in
`rejected/`**. 6 features, 11 components. **100 → 109 is T-029's nine
suggestions**; **41 → 42 done and 24 → 23 planned is T-029 itself.**
**Two worktrees ARE open** (T-054, T-063), so the board on main showing
nothing in flight is a LIMIT of the board, not a fact about the work —
which is precisely the gap the `verifying` ruling above named.

**THE FRESH-INSTALL PROOF, RELOCATED — the shape T-052 wants, walked a
FOURTH time.** Run in a throwaway `git worktree` at the merge commit
`f812d9e` with the checkpoint's uncommitted diff applied, so `npm ci`
never went near the `node_modules` under the human's live vite. The
worktree was verified to carry the EXACT tree this commit lands —
sha256 on `graph.json`, both dogfood fixtures, `ROADMAP.md`,
`ARCHITECTURE.md`, the card, `runner.rs`, `InterviewChat.tsx` and
`resume-fallback.spec.ts`, all MATCH — before anything ran. Both columns
agree exactly:

    package        in MAIN (existing node_modules)   in the scratch worktree (npm ci)
    lib/parser     225/225, 11 files                 225/225, 11 files    (npm ci, 0 vulnerabilities)
    app            795/795, 42 files                 795/795, 42 files    (npm ci, 0 vulnerabilities)
    app/src-tauri  313 passed / 3 ignored            313 passed / 3 ignored  (COLD build, own 2.3G target)
    tools/e2e      74 passed in 14.2s                74 passed in 14.4s   (npm ci, 0 vulnerabilities)
    lint:tokens    clean, 116 files                  clean, 116 files
    selftest       49 + 14 green                     49 + 14 green

**Every exit code 0 on both sides, and the app bundle hashes MATCH**
(`index-Bf-QNmtC.js` 497.86 kB / `index-CryMc_lw.css` 43.90 kB) — an
existing `node_modules` and a lockfile-exact `npm ci` produce the same
bundle from the same tree. **The cargo breakdown matches slot for slot**
(`108/0/0/46/123/0/7/13/3/7/0/2/4/0/0`) off a genuinely COLD build in
the worktree's own target directory. `STATE.md` itself was written after
the worktree ran and is the ONLY file not in it: it is inert to every
suite except the parser's live-tree walk, which was re-run in main
afterwards, unpiped, exit 0. The worktree is removed.

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect's app
runs out of the MAIN checkout (node pid 82549, one listener). **Every
agent has been briefed to probe it read-only and never bind, connect to
or signal it**, and every lane, verifier and integrator has honoured it —
T-029's first build took 15420/15430, its fix pass 15460/15470/15471,
its first verification 15440/15450, its re-verification 15480/15490,
this merge's lane 17420, boot gate 17430 and fresh-install lane 17440 —
**eleven distinct scratch ports across five sessions and not one of them
1420.** No OTHER listener is bound; no stray
`tauri dev`, `vite` or boot-check process survives beyond the human's
own app. **T-052's problem stays live for whoever takes the next
merge.**

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-029's security posture was verified rather than
argued**: zero new dependencies, zero lockfile lines, zero grant
movement (`acl_pin.rs` a 0-file diff with a whole-file sha identical at
five refs, 92 grants), `ENV_ALLOWLIST` byte-identical so no key or token
path to a spawned child was opened, `adapter.rs` / `capabilities/` /
`gen/` all 0-file diffs, no `innerHTML` / `dangerouslySetInnerHTML` /
`eval` / `new Function`, no shell string added, argv-as-data throughout,
and ADR-017 re-proved. **The four new IPC commands are the one thing
that DID widen** — nine to thirteen — and they widen in the shape
ADR-012 asks for: all four zero-argument, `tauri::State` extractors
only, no path or session id or flag crossing the boundary in either
direction. **`acl_pin.rs`'s command roster still lists only T-025's
four**, which the verifier flagged as a lapsed pattern rather than a
hole (the ACL decision is name-agnostic and structural). The sharpest
open set is otherwise unchanged and still app-agent's: **T-047-s5**,
**T-047-s6**, **T-047-s4**, **T-047-s1**; beside them **T-046-s1**,
**T-041-s4** and now **T-029-s5**, which cannot close without an
authenticated machine. **T-060 is the card that would close most of it
and it is now UNBLOCKED.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-029 adds **zero CI steps** (`.github/` is a 0-file diff) but its lane
grows by four specs, so the workflow's shape is unchanged while its lane
grows to 74. The cautions for a Linux runner are unchanged: T-027's,
T-051's and T-028's lane specs measure **geometry and animation**
against a real bundle and real CSS, and font metrics, scrollbar widths
and animation timing are not identical across platforms — **read
T-051-s8 and T-051-s9 first if a lens or window assertion reds**.
T-029's four new specs are the gentlest addition in a while: they assert
TEXT and CONTROLS rather than pixels, so they should be the least
platform-fragile in the lane. Otherwise unchanged: the ubuntu
apt/webkit2gtk set; the three `uses:` SHA pins; the `e2e types` step
(still never executed on any runner); T-034's `map-tasks-lens-dom.test.tsx`
and T-051's `window-manifest.test.ts` both reading the BUILT stylesheet,
so **build-then-test ORDER is load-bearing**; T-014's nputer-index watch
timings measured on FSEvents; `cargo audit`; the xvfb boot check; and
the THREE T-018 SENTINEL live tests.

## Open questions

- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **Carried forward, and the practice has now held THREE
  times running.** T-051's verifier committed its verdict and all four
  stamps before it ended; T-028's did the same; **T-029's did it TWICE
  — once at the rejection (`307319b`) and once at the re-verification
  (`c178773`)** — so this integrator verified ADR-016's marks and
  transcribed NOTHING. T-053 remains the only counter-example.
  **Three-for-three is a habit, not an enforcement** — nothing in
  TASK-FORMAT requires the stamps to be the verifier's last act.
  **The cheap fix is one clause in TASK-FORMAT**; the architect's call
  (ADR-004).
- **NEW — what does the pipeline owe the RECORD of a rejection?** T-029
  is the first card in the project to carry TWO verdicts, and the
  re-verifier's instinct was to prove by HASH that the first one had not
  been softened, shortened or edited in any byte. **Nothing required
  that check and nothing would have caught its absence.** A rejection is
  the most useful artefact a task produces and it is also the one with
  the most incentive to quietly improve; the record here is intact and
  provably so, but only because one agent thought to measure it.
  **Should a re-verification be REQUIRED to hash the prior verdict?**
  It is one command. The architect's, and probably a clause in
  TASK-FORMAT beside the one above.
- **Does the BOOT GATE rule retire, and when?** Carried forward.
  T-051 was the strongest argument yet for KEEPING it and also the merge
  that showed its limit (T-051-s7). T-028 added a different data point:
  it fired on a 10-file frontend diff and proved nothing the bundle
  build had not. **T-029 adds the case FOR it**: this is the first merge
  since T-027 to touch `app/src/**` and `app/src-tauri/**` together, and
  the Rust half includes four new `invoke_handler!` registrations —
  exactly the class (a manifest or handler edit that compiles and still
  will not launch) that T-040 proved `cargo test` cannot see. **The
  gate's value is concentrated where this merge sat**, and the
  retirement argument now has both halves measured. Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Still LIVE and unchanged in substance:
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while four rules now share the
  trigger → command → record → IF-it-cannot-run → why shape. A method
  version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance and still at **THIRTEEN reproductions across five sessions**.
  The habit is **twelve-for-twelve**. Still no gate; T-058 owns it.
  **This merge adds a small, cheap refinement**: the habit's own written
  form — *"none classified `data`"* — is unsound, because `file(1)`
  labels the regenerated `graph.json` as `JSON data` on every single
  merge. **`file --mime` and read the charset.** And the
  "which walk sees this file" question sharpened again: the graph's walk
  took ONE of the two new `.ts/.tsx` files and the token lint took BOTH,
  both numbers derived independently and both landed. **The repo now has
  three answers to "which walk sees this file" and no document states
  them side by side.**
- **Does the shared main working tree need a rule?** Carried forward
  with a **FOURTEENTH face, and it is a new one.** T-051 disturbed the
  app not at all and could prove it; T-028 unavoidably DID disturb it
  and said so. **T-029 disturbs it HALF WAY, which neither previous
  answer covers**: the five `app/src/**` files hot-reloaded into the
  human's window, and the seven `app/src-tauri/**` files did NOT,
  because `tauri dev` does not hot-swap the binary. **Their process is
  now running one half of this merge against the other half of the last
  one** — a state no user will ever be in, produced entirely by an
  agent's merge landing under a live dev server. "Say what you
  disturbed, AND say how you measured it" needs a third answer shape:
  *this much of it reached them, this much did not, and the mismatch is
  itself the hazard.* Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **THIRTEENTH data point, and T-029's is the
  strongest yet in the AFFIRMATIVE.** The verifier did not merely find
  T-029-s6 — it wrote the one-line fix, verified it, ran the whole cargo
  suite green against it, and named the discriminating regression pin
  that had to come with it. The second executor applied exactly that and
  the re-verification reproduced all six poison rounds. **A remedy this
  specific made the rejection cheap** — one commit, three files, two
  behavioural lines — and the alternative (a finding that only says "the
  scope is wrong") would have cost a second diagnosis. Beside T-028's
  fifth statement, this is a sixth: *a remedy in the finding is what
  turns a rejection from a restart into a correction.*
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-029 is the TENTH instance in ten
  merges, and it is the first where the card's CITATIONS split.** T-028
  cited a completion signal that no method document defines; T-029 cites
  "T-023's resume rule", and the executor `git grep`ed it before
  building — **it EXISTS** (`method/roles/planner.md:79`). The same card
  also carries an implementation-notes trace whose steps 2–4 do NOT
  survive reproduction, written by the architect and relayed into this
  file as fact. **So one card is one-for-one better AND one-for-one
  worse than the last**, which is the cleanest possible argument for
  the rule rather than for the author: *check the citation, do not
  grade the source.* Its suite figures (795/42, 313/3, 74, 116) were all
  true against this main and all re-derived anyway. Both limbs still
  want writing down, plus the third: **a citation to another task's
  artefact is a claim about the repo, not a definition.** Method version
  bump, the architect's call (ADR-004).
- **Is a forecast that has to be COMPLETE a reasonable standing bar?**
  **Asked at the last merge because the streak broke; answered here in
  the affirmative, with the mechanism that made it answerable.** T-028's
  checkpoint proposed the cheap fix — *derive the fixture's expected
  values by running the derivation and DIFFING, instead of enumerating
  sites by reading* — and this merge did exactly that for the mapping,
  the findings, the relation table, the drift set AND the rendered map,
  which is the one T-028 skipped. **Six sites forecast, six right, zero
  reds, no extra regen round.** The bar is reasonable WHEN the
  derivation is run rather than remembered; it is unreasonable when it
  is scored against a fixture whose shape the integrator learns from the
  last two checkpoints. **The question now is narrower and worth keeping
  open: should the probe be a committed tool rather than a throwaway
  `it()` that each integrator re-invents and then deletes?** Five
  merges have now written and deleted some version of it. Probably a
  paragraph in CONVENTIONS plus a small script; the architect's.
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
