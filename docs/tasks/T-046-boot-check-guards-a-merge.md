---
id: T-046
title: The boot check guards a merge — and stops refusing to run
feature: F-02
milestone: 3
priority: 7
size: S
status: done
blocked_by: []
touches: [tools/e2e/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-020-s3, T-040-s1. Triage 2026-08-16: these arrived hours
apart and are one task. T-040-s1 proposes making
tools/e2e/scripts/tauri-boot-check.mjs a merge gate, because T-040 —
a one-line manifest regression that stopped the app launching at all —
survived an executor, an adversarial verifier and an integrator, all
of whom ran `cargo test`, `cargo build` and three consecutive suites.
It survived because the only failing command was `cargo run`, and no
gate in this pipeline issues it. T-020-s3 records why the instrument
cannot be used as-is: it bind-probes 1420 and exits 2 when anything
holds it, which on a macOS dev loop is most of the time. A gate that
no-ops whenever the human's app is open is not a gate. T-020-s3's
option 2 was written as "do not take this casually"; T-040-s1 is the
reason to take it.

STANDING-RULE NOTE, for the human to confirm rather than inherit:
this task has the pipeline start the app. T-001 and T-020 both ruled
that a window opening and closing on its own is NOT screen control —
no input injected, no screenshot taken, nothing read off the screen;
the prohibition is on DRIVING the screen. This task relies on that
ruling and does not extend it. **The nod was given** — @human ruled 2026-08-16: allowed, the
prohibition is on DRIVING the screen, not on a process opening and
closing its own window. Recorded in the standing memory rule.

## Acceptance criteria
- THE boot check SHALL be runnable beside a live app via a narrow,
  loud `NPUTER_BOOT_PORT` (default 1420), which also threads the
  matching `--config`
  `{"build":{"devUrl":…,"beforeDevCommand":"npm run dev -- --port …
  --strictPort"}}` through to `tauri dev` — CLI flags only, never an
  edit to tauri.conf.json, the exact mechanics T-020 already exercised
  on 14521.
- IF `NPUTER_BOOT_PORT` resolves to 1420 THEN the script SHALL REFUSE
  loudly — the override must never become a second way to contend for
  the human's app — and a lane spec SHALL assert the refusal, the same
  shape as the playwright config's existing 1420 throw. The override
  SHALL be recorded in CONVENTIONS' PORT RULE bullet beside
  `NPUTER_E2E_PORT`.
- THE existing three exit paths SHALL be unchanged and still proven:
  exit 0 with both `[nputer]` startup lines and a clean process-tree
  kill; exit 1 on timeout; exit 2 on a busy port with its correct
  explanation.
- THE integrator practice SHALL be ratified in docs/CONVENTIONS.md
  beside the T-009-s1 graph-regen rule: at any merge whose diff
  touches `app/src-tauri/**`, `app/src/**` or either manifest, run the
  boot check and record the result. IF the check cannot run THEN the
  integrator SHALL say so LOUDLY in the checkpoint — a skipped gate is
  news, never silence.
- THE T-040 regression SHALL be the fixture proving the gate works:
  with `default-run` removed from app/src-tauri/Cargo.toml the check
  SHALL exit non-zero with the ambiguity error captured. The one
  command that would have caught it, now issued by the pipeline.
- WHETHER the same gate belongs in the EXECUTOR's green-gate list
  rather than only the integrator's SHALL be decided and recorded in
  this file before dispatch (T-040-s1's second open question).

Verification: headless — the script kills its own process tree; the
lane spec for the 1420 refusal runs under `npm test`. Nothing binds or
contacts 1420 during verification. @human: none, beyond confirming the
standing-rule note above.

## Implementation notes

Built on branch `t046-boot-gate` (branch point main@2961599) by
claude-opus-5 @fresh, 2026-08-16, in worktree ../nputer-t046. Two other
lanes were live (T-041 in app/src/**, T-047 in app/src-tauri/src/agent/**);
this one owns tools/e2e/** plus docs/CONVENTIONS.md and touched nothing
else. The human's app held 1420 for a visual review throughout: no
command in this session bound it, connected to it, or signalled it, and
every boot run used scratch port 14521.

### The shape

`NPUTER_BOOT_PORT` is resolved in a NEW module,
`tools/e2e/scripts/boot-port.mjs`, which `tauri-boot-check.mjs` imports.
The split is deliberate and load-bearing: the lane spec must assert this
logic, and the check calls `main()` unconditionally at module scope, so
importing the check itself would launch the app. The usual remedy — an
`import.meta.url === argv[1]` guard — is the WRONG trade for a merge
gate: any path mismatch (symlinked checkout, wrapper script) would turn
the gate into a silent exit 0, which is the exact failure T-046 exists to
end. The check keeps its unconditional entry point; the testable half
lives beside it, side-effect free.

Resolution: unset or empty → 1420, `overridden: false`, and the spawn
argv is `["run","tauri","dev"]` — byte-identical to the pre-T-046
command, so the three original exit paths run the same process they
always did. Any other value → that port, `overridden: true`, and the argv
gains `["--","--config",<json>]`. 1420-when-explicitly-set → refusal.

**The thing that surprised me, and it is a trap worth the CONVENTIONS
line.** npm parses argv AFTER the script name and eats flags it
recognises. Measured on npm 11.12.1 against an argv-echoing probe script:

    npm run tauri dev --config '{…}'      -> script sees ["dev","{…}"]
    npm run tauri -- dev --config '{…}'   -> script sees ["dev","--config","{…}"]
    npm run tauri dev -- --config '{…}'   -> script sees ["dev","--config","{…}"]

The first form silently DROPS the flag and hands tauri the JSON as a
stray positional. T-020's notes describe its scratchpad copy as having
"`--config` appended to the spawn args", which under today's npm is that
first form; whatever it actually ran, the safe form is the third, and
that is what ships. Keeping `["run","tauri","dev"]` as the literal prefix
is why the third form was chosen over the second.

### Criteria → evidence

1. **Runnable beside a live app via a narrow, loud `NPUTER_BOOT_PORT`
   (default 1420) that threads the matching `--config`, CLI flags only.**
   `boot-port.mjs` `resolveBootPort` + `bootConfigJson` + `tauriDevArgs`;
   the check logs the full overlay before spawning. Both halves move
   together — `devUrl` (what the CLI waits for and the webview loads) and
   `beforeDevCommand` (`npm run dev -- --port N --strictPort`); moving
   one alone hangs the check on a URL nothing serves. tauri.conf.json has
   ZERO diff (`git diff --stat -- app/src-tauri/tauri.conf.json` empty;
   md5 of the file unchanged). Proof: obligation 2's green run, whose
   output shows vite on 14521 and the app booting.
2. **Refusal when it resolves to 1420, pinned by a lane spec, recorded in
   the PORT RULE bullet.** `BootPortRefusal` → `[boot-check] REFUSED: …`,
   exit 3, raised BEFORE the bind probe. `tools/e2e/tests/
   boot-check-guard.spec.ts` asserts it at both levels (pure resolver and
   the real script as a subprocess). CONVENTIONS PORT RULE rewritten to
   carry `NPUTER_BOOT_PORT` beside `NPUTER_E2E_PORT`. Obligation 3.
3. **The three existing exit paths unchanged and still proven.**
   Obligation 2 — exit 0 with both lines and a clean tree kill, exit 1 on
   a forced timeout, exit 2 on a busy port — plus the honest deltas
   listed under "Deliberate deltas" below.
4. **Integrator practice ratified in CONVENTIONS beside the T-009-s1
   graph-regen rule.** New `BOOT GATE` bullet, immediately after it and
   in its shape (trigger → command → record), carrying the required
   sentence: "IF the check cannot run THEN say so LOUDLY in the
   checkpoint, naming the reason and the exit code — a skipped gate is
   news, never silence." It also states, for the integrator about to run
   it, that this is not screen control (the @human ruling of 2026-08-16).
5. **The T-040 regression is the fixture.** Obligation 1 — the ambiguity
   error captured verbatim, both directions.
6. **Executor green-gate question decided and recorded.** Below.

### Criterion 6 — DECIDED: YES, the executor runs it too, on the same trigger

**Ruling.** The boot gate belongs in the executor's green-gate list as
well as the integrator's, with the SAME diff trigger (`app/src-tauri/**`,
`app/src/**`, either manifest) and one added clause: an executor whose
own fence forbids the fix files the red as a suggestion and says so in
the notes, rather than absorbing it silently. Written into the
CONVENTIONS BOOT GATE bullet ("THE EXECUTOR RUNS IT TOO…") because
method/roles/executor.md — which is fenced out of this task — says only
"run the test commands from CONVENTIONS.md until green"; CONVENTIONS is
therefore the only place a rule can live where both roles will meet it.

**Reasoning, including the case against.** The strongest argument for
integrator-only is that T-040 was a COMPOSITION failure: T-025 added the
second binary, and T-025's fence declared zero diff to every manifest, so
its executor could not have added `default-run` even having foreseen the
need. A gate that fires on a condition the executor is forbidden to fix
looks like pure friction. That argument is wrong, and instructively so —
the whole finding of T-040 is that the break was INVISIBLE, not that it
was unfixable. A T-025 executor running this gate would have seen the
ambiguity error the day it appeared and filed it; instead it travelled
through an adversarial verifier and an integrator and was found by the
human launching the app four tasks later. News the executor cannot act on
is still news, and it arrives with the diff that caused it still in
context, which is the cheapest moment to diagnose it.

The real cost objection is time, and it is small in the cases that
matter. The trigger only fires for executors already building that
surface: anyone touching `app/src-tauri/**` has paid for a cargo build to
run `cargo test`, and anyone touching `app/src/**` has paid for
`npm run build`. Warm, the check costs seconds (measured below: 6 s and
8 s wall for the two green runs in this worktree). Executors outside the
trigger — most of them — run nothing. The counter-cost of skipping it is
a merge-time red that has to be bisected against a diff nobody is holding
in mind any more.

Two guards keep the rule honest rather than ritual. It is scoped by diff,
not blanket, so it cannot become a tax on parser or docs work. And it is
recorded as a rule the integrator can trim back to integrator-only with a
one-line CONVENTIONS edit if it proves noisy in practice — the decision
is argued, not permanent.

### Proof obligations

**1. The T-040 fixture — the point of the task.** `default-run =
"nputer"` transiently removed from app/src-tauri/Cargo.toml (perl
one-liner, one deleted line, `git diff --stat` = `1 file changed, 1
deletion(-)`), then `NPUTER_BOOT_PORT=14521 NPUTER_BOOT_TIMEOUT_MS=180000
npm run boot:check` from tools/e2e/:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}` in /Users/ujju/Projects/nputer-t046/app
    [boot-check] NPUTER_BOOT_PORT=14521 — threading --config {"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}
    [boot-check] overall timeout 180000 ms, no-output watchdog 300000 ms
    [boot-check] tauri dev exited on its own (exit=101 signal=null) before both startup lines appeared:
      MISSING  [nputer] project folder:
      MISSING  [nputer] window "main" created
      last 8 line(s) of `npm run tauri dev` output, verbatim:
      |      Running BeforeDevCommand (`npm run dev -- --port 14521 --strictPort`)
      |   VITE v7.3.6  ready in 179 ms
      |   ➜  Local:   http://localhost:14521/
      |      Running DevCommand (`cargo  run --no-default-features --color always --`)
      | error: `cargo run` could not determine which binary to run. Use the `--bin` option to specify a binary, or the `default-run` manifest key.
      | available binaries: fake_agent, nputer
      |         Info Watching /Users/ujju/Projects/nputer-t046/app/src-tauri for changes...
      |         Info Watching /Users/ujju/Projects/nputer-t046/app/src-tauri/crates/nputer-index for changes...
    SHIPPED_EXIT=1

(The `error:` line carries cargo's ANSI colour bytes in the real
terminal — `--color always` is passed by the tauri CLI — stripped here
for readability; the text is otherwise verbatim.) That last-N-lines block
is NEW in this task and is why the fixture is worth anything: the first
run of the fixture, before it was added, reported only `exit=101` and two
MISSING lines, which tells an integrator that something broke but not
what. A gate whose failure is not legible is half a gate.

Then `git checkout app/src-tauri/Cargo.toml` — md5 of both Cargo.toml
(903321552aa936a72c4220677f9286d2) and Cargo.lock
(13fbe67226b6feaa4280ee597a141283) identical to before the fixture, `git
status` clean of both — and the same command again:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}` in /Users/ujju/Projects/nputer-t046/app
    [boot-check] NPUTER_BOOT_PORT=14521 — threading --config {"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}
    [boot-check] overall timeout 420000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-t046
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    SHIPPED_EXIT=0

Non-zero with the cause quoted, then zero. The one command that would
have caught T-040, now issued by the pipeline.

**2. All three original exit paths, on the scratch port.**
- *exit 0, both lines, clean tree kill*: the second block above (and one
  earlier identical run before the tail report was added — 6 s and 8 s
  wall). After each: `lsof -nP -iTCP:14521 -sTCP:LISTEN` → none;
  `pgrep -fl nputer-t046` → none. The only `target/debug/nputer`,
  `tauri dev`, and `vite` processes alive on the machine were the human's,
  all under /Users/ujju/Projects/nputer (the main checkout), untouched.
- *exit 1, forced timeout*: `NPUTER_BOOT_PORT=14521
  NPUTER_BOOT_TIMEOUT_MS=1500`:

      [boot-check] timed out after 1500 ms waiting for the startup lines:
        MISSING  [nputer] project folder:
        MISSING  [nputer] window "main" created
        last 3 line(s) of `npm run tauri dev` output, verbatim:
        |      Running BeforeDevCommand (`npm run dev -- --port 14521 --strictPort`)
        |   VITE v7.3.6  ready in 107 ms
        |   ➜  Local:   http://localhost:14521/
      [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
      [boot-check] process tree stopped (exit=null signal=SIGTERM)
      SHIPPED_EXIT=1

  No strays; 14521 released. (Incidentally the best evidence that the
  `--config` overlay really took effect: vite came up on 14521, not 1420.)
- *exit 2, busy port*, both flavours. The DEFAULT path against the real
  condition — the human's app holding 1420, exactly as T-020's verifier
  recorded it, no listener planted, nothing freed or waited for:

      [boot-check] ABORT: port 1420 is in use — the human's live app? The boot check must not contend for it (tauri dev owns 1420 via app/vite.config.ts strictPort). Nothing was spawned. Set NPUTER_BOOT_PORT to a free scratch port to run beside it.
      SHIPPED_EXIT=2

  A failed bind exchanges zero packets with the listener; `lsof` after
  the run confirmed the human's vite still held `[::1]:1420`, untouched.
  And the OVERRIDE path, with a scratch listener this session owned on
  14598:

      [boot-check] ABORT: port 14598 (NPUTER_BOOT_PORT) is in use — the boot check must own the port it boots on, so it will not contend for someone else's server. Nothing was spawned. Pick a free port.
      SHIPPED_EXIT=2

**3. The 1420 refusal, binding nothing.** At the CLI:

    $ NPUTER_BOOT_PORT=1420 npm run boot:check
    [boot-check] REFUSED: NPUTER_BOOT_PORT is 1420 — refusing: 1420 is the human's live app (app/vite.config.ts, strictPort). This override exists so the boot check can run BESIDE that app on a scratch port — it must never become a second way to contend for it. Unset NPUTER_BOOT_PORT to run the default path, which bind-probes 1420 and aborts if anything holds it. Nothing was probed and nothing was spawned.
    SHIPPED_EXIT=3

    $ NPUTER_BOOT_PORT=not-a-port npm run boot:check
    [boot-check] REFUSED: NPUTER_BOOT_PORT="not-a-port" is not a valid port number (want an integer 1-65535). Nothing was probed and nothing was spawned.
    SHIPPED_EXIT=3

The refusal is exit **3**, deliberately not 2: a refusal must never be
readable as "the port was busy", nor as 1's "the boot failed". That it
probed nothing is not asserted by inspection — it is *observable*. Had
the script reached the bind probe, this run would have reported 1420
either free or busy, and with the human's app up it would have exited 2.
It reported neither, which is how we know nothing touched the port. The
spec asserts exactly that (`expect(stdout).not.toContain("free")`,
`expect(stderr).not.toContain("ABORT")`). The lane spec, green:

    ✓ tests/boot-check-guard.spec.ts › unset resolves to 1420 and threads no --config — the pre-T-046 command, byte for byte
    ✓ tests/boot-check-guard.spec.ts › a scratch port threads the matching --config to BOTH halves of tauri dev
    ✓ tests/boot-check-guard.spec.ts › NPUTER_BOOT_PORT=1420 is refused by the resolver — the lane's own throw, restated
    ✓ tests/boot-check-guard.spec.ts › values that are not ports are refused, never silently defaulted
    ✓ tests/boot-check-guard.spec.ts › the real script refuses NPUTER_BOOT_PORT=1420 with exit 3, probing nothing
    ✓ tests/boot-check-guard.spec.ts › a busy scratch port aborts with exit 2 and spawns nothing

Nothing in that file boots the app: two tests are pure-function, three
run the real script down paths that stop before the spawn, and the sixth
holds an OS-assigned port so the child aborts at the probe. The lane
stays headless. Spelling attacks are covered too — `0x58c` and `01420`
both resolve to 1420 and are refused as 1420; the guard is on the number,
not the string.

**4. Every new test executes.** One targeted assertion mutation per test,
each run as `npx playwright test tests/boot-check-guard.spec.ts`; every
mutation produced exactly `1 failed / 5 passed`, and the file was
restored byte-exact (`cmp`) after each:

    1/6  toEqual(["run","tauri","dev"]) -> [...,"DEV"]                  1 failed, 5 passed
    2/6  devUrl http://localhost:14521 -> :14599                        1 failed, 5 passed
    3/6  toThrow(/refusing/) -> /no-such-word-in-the-refusal/           1 failed, 5 passed
    4/6  /not a valid port number/ -> /not a valid MUTANT number/       1 failed, 5 passed
    5/6  toContain("[boot-check] REFUSED:") -> "…REFUSED-MUTANT:"       1 failed, 5 passed
    6/6  toContain("Nothing was spawned.") -> "…spawned-MUTANT."        1 failed, 5 passed

Mutation 5 re-run with full output to confirm the mutation reddens the
*named* test rather than some neighbour: the failure is reported at
`boot-check-guard.spec.ts:111` inside "the real script refuses
NPUTER_BOOT_PORT=1420 with exit 3, probing nothing", printing the real
refusal string it no longer matches.

**5. Suites, all at branch-point counts.**

| suite | result |
| --- | --- |
| lib/parser `npx vitest run` | **159 passed** (10 files); `npx tsc --noEmit` clean |
| app `npm run build` then `npm test` | build clean; **483 passed** (27 files) |
| app/src-tauri `cargo test` | **208 passed, 0 failed, 3 ignored** (summed over both workspace crates' binaries + doc-tests) |
| tools/e2e `npm test` | **23 passed** — 17 at branch point + 6 new |
| tools/e2e `npm run typecheck` | clean |
| tools/e2e `npm run lint:tokens` | `clean (37 files scanned under app/src)`, exit 0 |
| tools/e2e `npm run lint:tokens -- --selftest` | `43 samples green`, exit 0 |

Graph: NOT regenerated, and confirmed it did not need to be —
`cargo test -p nputer-index --test self_graph -- --ignored` →
`test self_graph_is_current ... ok`, `git status docs/architecture/`
empty. `tools/` is nputerignored, so a diff confined to tools/** and
docs/** moves nothing in the committed graph. The T-009-s1 regen ritual
is therefore a no-op for this merge, which is the expected outcome, not a
skipped step.

**6. Fence.** `git diff --stat` on the tracked diff:

    docs/CONVENTIONS.md                    |  42 ++++++++++--
    tools/e2e/scripts/tauri-boot-check.mjs | 113 +++++++++++++++++++++++++-----
    tools/e2e/tsconfig.json                |  17 ++++-
    3 files changed, 151 insertions(+), 21 deletions(-)

plus two new files, `tools/e2e/scripts/boot-port.mjs` and
`tools/e2e/tests/boot-check-guard.spec.ts`. `git diff --stat` is EMPTY
for every one of `app/src`, `app/src-tauri/src`, `lib/parser`, `method`,
`docs/architecture`, `app/package-lock.json`,
`lib/parser/package-lock.json`, `tools/e2e/package-lock.json`,
`app/src-tauri/Cargo.lock` — and for `app/src-tauri/tauri.conf.json` and
`app/src-tauri/Cargo.toml`, the two files the mechanics deliberately do
not touch. No new dependency: `tools/e2e/package.json` is unchanged, the
new module is plain node, the new spec imports only `@playwright/test`,
`node:*` and repo-local files. Lane fence respected: zero diff under
`app/src/**` (T-041) and `app/src-tauri/src/**` (T-047); the new spec is
named `boot-check-guard.spec.ts`, colliding with none of T-041's three
screen-named specs. Neither ../nputer-t041 nor ../nputer-t047 was
entered.

### Deliberate deltas a verifier should check rather than assume

- **Exit 3 is new.** The three original codes keep their meanings
  exactly; refusal needed a fourth rather than an overloaded 2.
- **The 1420 exit-2 message gained one sentence**, "Set NPUTER_BOOT_PORT
  to a free scratch port to run beside it." The original two sentences
  are byte-identical before it. This is the one text change to an
  existing path and it is on purpose: T-020-s3's complaint is that a
  human meeting this abort has no idea a remedy exists, and the remedy is
  now one env var away.
- **A failure tail was added** to all three exit-1 reports (last 40
  non-empty lines of the child's merged output). Success prints nothing
  extra. Without it the T-040 fixture proves only that *something* broke.
- **tsconfig gains `allowJs: true`** and `scripts/boot-port.mjs` in
  `include`, because the spec imports a JSDoc-typed .mjs and tsc
  otherwise fails TS7016. `checkJs` stays OFF deliberately: enabling it
  would newly type-check the two long-standing .mjs scripts, which is a
  separate change (filed as T-046-s2).
- **`port1420Free()` is now `portFree(port)`** — same body, both address
  families still probed (vite's `host: false` may land on ::1 or
  127.0.0.1).
- **CI is untouched.** `.github/workflows/ci.yml` still runs
  `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` with no
  override — on a Linux runner 1420 is free and the default path is
  correct. workflow-parity.spec.ts needed no change and is green.

### Honest limits — what this does NOT prove

- Nothing here is verified on Linux/webkit2gtk; the xvfb half stays as
  dormant as T-020 left it. The override changes only the port, so there
  is no reason to expect divergence, but "no reason to expect" is not
  evidence.
- The gate proves `tauri dev` — the DEV path. `tauri build` and the
  packaged binary are still guarded by nothing (T-046-s3).
- The gate is documented practice, not machinery: nothing forces an
  integrator or executor to run it. That is the same standing as the
  T-009-s1 regen rule it sits beside, and it retires the same way, when
  something can check it.
- Each boot run briefly opens a window (T-001/T-020 precedent, @human
  ruling 2026-08-16). No OS input was injected, nothing was screenshotted,
  and nothing was read off the screen at any point in this session.

### Suggestions filed

- **T-046-s1** — the child-self-exit path returns without signalling the
  process group; empirically clean here, but the failure mode it risks is
  an orphaned vite on the human's own port.
- **T-046-s2** — turn on `checkJs` for tools/e2e's .mjs scripts.
- **T-046-s3** — `tauri build` and the packaged binary remain ungated;
  T-040's class is dev-only, but the packaging equivalent would be just
  as invisible.

## Verdicts

2026-08-16 — claude-opus-5 @fresh, verifier — same-model review:
**APPROVED.** All six criteria met. Every claim re-derived from scratch
in worktree /Users/ujju/Projects/nputer-t046 at `9b2832b`, merge-base
with main confirmed `2961599` by `git merge-base`; nothing was taken from
the notes on trust, and the mutation table below is my own rather than
the builder's. Two real holes found — one in the gate's reach (filed
T-046-s4), one demonstrated in a pre-existing path the criteria froze
(reproduced into T-046-s1) — neither of which is a criterion failure, and
both of which are the kind of thing this task's own logic says to file
rather than absorb. The human's app held `[::1]:1420` throughout: no
command in this session bound it, connected to it, or signalled it, and
every boot run used scratch port 14521 (or 14598/14599 for probes).

**Criterion 5 — the T-040 fixture, both directions, shipped script.**
`default-run = "nputer"` removed with the same perl one-liner
(`git diff --stat` = `1 file changed, 1 deletion(-)`), then
`NPUTER_BOOT_PORT=14521 npm run boot:check`: **exit 1**, and the tail
carries the regression verbatim, ANSI bytes and all —

    | error: `cargo run` could not determine which binary to run. Use the `--bin` option to specify a binary, or the `default-run` manifest key.
    | available binaries: fake_agent, nputer

`git checkout app/src-tauri/Cargo.toml`, then md5 of Cargo.toml
(`903321552aa936a72c4220677f9286d2`) and Cargo.lock
(`13fbe67226b6feaa4280ee597a141283`) identical to the pre-fixture
baseline, sha256 too, `git status` clean — and the same command again:
**exit 0** in 6 s, both `[nputer]` lines, `process tree stopped
(exit=null signal=SIGTERM)`. The builder's recorded hashes are the ones I
measured before touching anything, so the fixture was fully reverted at
hand-off as well.

**Does it catch the CLASS, or only that one string?** The question the
task does not ask and should have. Four further launch-breaking
mutations, one at a time, each reverted:

| mutation | gate |
| --- | --- |
| `default-run = "nputrr"` — same class, different member | **exit 1**, cargo's `default-run target 'nputrr' not found` + its `help: a target with a similar name exists` quoted |
| `app/package.json` `"dev": "true"` — dev server never starts | **exit 1**, tail repeats `Warn Waiting for your frontend dev server to start on http://localhost:14521/...` |
| `tauri.conf.json` `devUrl` → dead port 14999 | **exit 0 — BLIND** |
| `tauri.conf.json` `beforeDevCommand` → `npm run no-such-script-at-all` | **exit 0 — BLIND** |

The first two answer the question yes, and their failures are legible
enough to diagnose without re-running: the tail report earns its place.
The last two are the hole — the `--config` overlay replaces exactly
`devUrl` and `beforeDevCommand`, so the override path cannot see a
regression in either. It is not an implementation bug; criterion 1
prescribes the overlay, and both keys must move together or the check
hangs. But it is an honest limit the notes do not carry, and the gate
CONVENTIONS mandates is the overriding one. Filed **T-046-s4** with a
shape that shrinks it (derive the overlay from the committed values
instead of hard-coding them) rather than a demand to close it.

**Criterion 2 — the 1420 refusal, attacked and instrumented.** I did not
try to defeat the guard by inspection; I ran the shipped script under
`node --import` with a spy patching `net.Server.listen`,
`net.Socket.connect` and `child_process.spawn` (via `createRequire`, so
the builtin's ESM facade is evaluated after the patch and the script's
`import { spawn }` gets the wrapper — verified by a positive control on a
free port, which logged both a BIND-ATTEMPT and the SPAWN-ATTEMPT). The
script on disk was never modified. Twenty-two spellings, every one
**exit 3, binds=0 connects=0 spawns=0**: `1420`, ` 1420`, `1420\n`,
`1420\t`, `+1420`, `1420.0`, `0x58c`, `0X58C`, `01420`, `0000001420`,
`1.42e3`, `14.20e2`, `0b10110001100`, `0o2614`, and — refused by the
other exit-3 message, as not-a-port — `1420abc`, fullwidth `１４２０`,
Arabic-indic `١٤٢٠`, `66956` (= 1420 + 65536, so nothing wraps),
`-64116`, `0`, `70000`, `"  "`. At the resolver level a further set
including NBSP, U+2028 and BOM prefixes all refuse as 1420. This is
stronger than the notes' inference: not "it reported neither free nor
busy" but "no bind was attempted", observed.

The positive control the inference needs, taken separately: the DEFAULT
path against the live app logged exactly one
`BIND-ATTEMPT net.Server.listen([1420,"::1"])`, which FAILED
(`lsof` immediately before confirmed `[::1]:1420` held, so `portFree`
short-circuits and 127.0.0.1 is never touched) → **exit 2** with the
correct message. `lsof` immediately after: same pid, same fd, same
device. A failed bind exchanges zero packets; a spawn was additionally
made impossible by arming the spy's hard block, so no run of mine could
have booted on 1420 even had it come free mid-probe.

The one input that resolves to 1420 without refusing is `""`. That is the
documented "unset or empty" branch — it takes the DEFAULT path, which
bind-probes and aborts, so it cannot become "a second way to contend";
it is pinned by the first lane spec and stated in the JSDoc. Attacked and
ruled benign, not a criterion violation.

**Criterion 3 — the three original paths, plus exit-code semantics.**
Exit 0: above, 6 s, both lines; after it `lsof -nP -iTCP:14521` empty and
`pgrep -fl nputer-t046` empty, while `ps -Ao pid,ppid,command` showed the
only surviving tauri/vite/`target/debug/nputer` processes were the
human's, all under /Users/ujju/Projects/nputer. Exit 1:
`NPUTER_BOOT_TIMEOUT_MS=1500` → the MISSING report, tail of 7 lines,
clean tree kill, port released. Exit 2, both flavours: the default-path
run above, and my own listener on 14598 → `ABORT: port 14598
(NPUTER_BOOT_PORT) is in use`, naming the overridden port, nothing
spawned. The four codes are disjoint and each means one thing: `3` is
reachable only from `EXIT_REFUSED`, `2` only from the probe, and a
refusal is raised before either, so it can never read as "busy" or as
"the boot failed". A reader is told which is which — the tools/e2e
commands bullet now carries the legend `Exit 0 booted · 1 the boot
failed, with the child's last output quoted · 2 the port is busy · 3 the
override was refused`. (It lives in that bullet, ~110 lines above the
BOOT GATE bullet that tells the integrator to record the code; same
document, but the BOOT GATE bullet does not point at it. Noted, not
filed.)

**The separate-module design — ruled sound, and demonstrated rather than
argued.** The builder's claim is that an `import.meta.url === argv[1]`
guard would turn a path mismatch into a silent exit 0. I built the guard
in its usual form and ran it through a symlink: no output, **exit 0**.
The failure mode is exactly as described. The shipped script through the
same symlink: **exit 3** — it ran. Also probed for new ways to no-op,
since that is the failure this task exists to end: from the repo root in
CI's invocation form → exit 2 (ran); from `/` with an absolute path →
exit 3 (ran); with `boot-port.mjs` renamed away → **exit 1** with a loud
`ERR_MODULE_NOT_FOUND`, never a quiet 0. And exit 0 is reachable only
through `finish(0)`, which is called only when both needles are seen in
the child's output; the overlay JSON is derived from an integer, so there
is no string a caller can inject to forge them. I could not make the
check exit 0 without booting.

**Criterion 6's npm finding — confirmed, my own probe.** An argv-echoing
script named `tauri` in a scratch package, npm 11.12.1:

    npm run tauri dev --config '{…}'      -> ["dev","{…}"]
    npm run tauri -- dev --config '{…}'   -> ["dev","--config","{…}"]
    npm run tauri dev -- --config '{…}'   -> ["dev","--config","{…}"]

Exactly the builder's table; form 1 drops the flag and leaves the JSON a
stray positional. The spy's SPAWN-ATTEMPT log confirms the shipped form
is the third: `["run","tauri","dev","--","--config",<json>]`.

**Criterion 4 — CONVENTIONS.** The BOOT GATE bullet sits immediately
after the T-009-s1 rule and mirrors its shape (label + provenance →
"at any merge whose diff touches …" → command → record). Its trigger
matches the criterion's and is strictly more precise, naming both
manifests. It carries the required sentence verbatim: "IF the check
cannot run THEN say so LOUDLY in the checkpoint, naming the reason and
the exit code — a skipped gate is news, never silence." The PORT RULE
bullet carries `NPUTER_BOOT_PORT` beside `NPUTER_E2E_PORT` as required.
Criterion 6's YES is recorded with its reasoning, including the case
against, and the trim claim checked by doing it: deleting the single
sentence "THE EXECUTOR RUNS IT TOO … in the notes." leaves a coherent
integrator-only bullet, no other edit needed (one sentence over five
wrapped lines, not literally one line — the spirit holds). The placement
argument holds too: method/roles/executor.md §4 says only "Run the test
commands from CONVENTIONS.md until green" and integrator.md names no
commands at all, so CONVENTIONS is genuinely the only place a rule meets
both roles. One asymmetry with the rule it sits beside: T-009-s1 carries
a retirement condition and BOOT GATE does not. The notes say it retires
"when something can check it"; that sentence is not in CONVENTIONS.
Noted, not filed.

**Every new test executes — my mutations, not the builder's.** One
targeted mutation per spec, each aimed at the assertion carrying the
task's actual claim, each run as `npx playwright test
tests/boot-check-guard.spec.ts`, each reverted and `cmp`-verified
byte-exact:

    1/6  overridden: false -> true                        1 failed, 5 passed  (spec:52)
    2/6  drop --strictPort from the expected command      1 failed, 5 passed  (spec:60)
    3/6  0x58c -> 0x58d (=1421, resolves fine)            1 failed, 5 passed  (spec:87)
    4/6  smuggle valid port "14521" into the reject list  1 failed, 5 passed  (spec:96)
    5/6  not.toContain("free") -> toContain("free")       1 failed, 5 passed  (spec:104)
    6/6  not.toContain("1420") -> toContain("1420")       1 failed, 5 passed  (spec:123)

Each reddened the NAMED test, checked by reading the failure title, not
the count. Mutations 5 and 6 are the load-bearing ones: they are the
probed-nothing assertion and the override-honoured-end-to-end assertion,
and both are live.

**Suites, my own runs, all matching the notes.** lib/parser `npx vitest
run` **159 passed** (10 files), `npx tsc --noEmit` clean · app
`npm run build` clean then `npm test` **483 passed** (27 files) ·
app/src-tauri `cargo test` **208 passed, 0 failed, 3 ignored** summed
across 11 test binaries — the first attempt was piped through `tail` and
reported a nonsense total, the exact trap T-020's notes record · tools/e2e
`npm test` **23 passed** (17 + 6) · `npm run typecheck` clean ·
`npm run lint:tokens` `clean (37 files scanned under app/src)` ·
`-- --selftest` `43 samples green`. Graph correctly NOT regenerated:
`cargo test -p nputer-index --test self_graph -- --ignored` →
`self_graph_is_current ... ok`, `git status docs/architecture/` empty,
and `.nputerignore:8` is `tools/` — so a diff confined to tools/** and
docs/** moves nothing in the committed graph.

**Fence, proved rather than asserted.** `git diff --stat 2961599..HEAD`
is EMPTY for every one of `app/src`, `app/src-tauri`, `lib/parser`,
`method`, `docs/architecture`, `.github`, `.nputerignore`,
`app/package.json`, `app/src-tauri/Cargo.toml`,
`app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.lock`,
`app/package-lock.json`, `lib/parser/package-lock.json`,
`tools/e2e/package-lock.json` and `tools/e2e/package.json` — so no
lockfile moved and no dependency was added. The whole diff is nine files
under tools/e2e/ and docs/. My own probes touched Cargo.toml,
tauri.conf.json and app/package.json transiently; all three were
`git checkout`-reverted and the tree is clean, with Cargo.toml and
Cargo.lock hash-checked. Neither ../nputer-t041 nor ../nputer-t047 was
entered.

**The three suggestions, ruled.**
- **T-046-s1 — REAL, and I reproduced it.** The builder called it
  empirically clean; it is clean only on the tauri CLI's ORDERLY exit. I
  ran the drill s1 itself proposes — SIGKILL the CLI mid-boot — and the
  check exited 1 with a correct report while leaving a live vite listener
  and an orphaned esbuild behind, which I then killed by hand. Evidence
  appended to the file. Not merge-blocking: the path is pre-existing, and
  criterion 3 freezes it ("the three existing exit paths SHALL be
  unchanged"), so fixing it here would have been the violation. But T-046
  multiplies its exposure — the script went from never running to running
  at every qualifying merge and every qualifying executor — and on the
  default path the orphan sits on 1420. Correct encoding, correct scope,
  priority raised.
- **T-046-s2 — real, correctly scoped, but its example is wrong and the
  file should be corrected before anyone works it.** s2 claims "a wrong
  `@param {number}` on `bootConfigJson` would silently mistype the spec's
  expectations rather than fail `npm run typecheck`". I lied in that
  exact annotation (`{number} port` → `{string} port`) and typecheck did
  NOT stay silent: `tests/boot-check-guard.spec.ts(67,36): error TS2345:
  Argument of type 'number' is not assignable to parameter of type
  'string'`. For any function the spec calls, a lying annotation surfaces
  — loudly, though misattributed, since the error blames the caller for
  the script's lie. The genuine unchecked surface is different and
  larger: with `checkJs` off, neither script BODY is ever checked against
  its own annotations, and `scripts/tauri-boot-check.mjs` and
  `scripts/lint-tokens.mjs` are not in `include` at all, so tsc never
  opens them. The remedy s2 proposes is right and its reason for
  deferring — flipping the flag edits a merge gate's kill path as a side
  effect of a tsconfig change — is right. Only the worked example is
  wrong.
- **T-046-s3 — real, and the argument transplants exactly.** Nothing in
  the pipeline has ever produced or launched a packaged nputer, and s4
  above is a second instance of the same shape (a gate that proves the
  configuration it was handed, not the one that ships). Its cost
  reasoning is right: minutes, not seconds, so it does not belong in the
  per-merge bullet.

**@human items: none new.** The standing-rule note is already ruled and
recorded. Nothing in this review injected OS input, screenshotted, or
read anything off the screen; the boot runs opened and closed their own
windows, which is the 2026-08-16 ruling this task relies on.
