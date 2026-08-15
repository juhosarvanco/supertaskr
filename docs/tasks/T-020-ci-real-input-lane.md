---
id: T-020
title: CI + real-input E2E lane (Linux run, trusted-input tests, token lint)
feature: F-02
milestone: 4
priority: 11
size: L
status: building
blocked_by: []
touches: [.github/, tools/e2e/, .nputerignore]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-001-s2, T-001-s3, T-005-s4, T-009-s3, T-018-s3 (folded at
dispatch 2026-08-16, human-approved). Triage 2026-08-15:
one lane, shared infrastructure — separately each would rebuild half
the other. Size L: planning pass COMPLETE (below; architect-approved
2026-08-16). Best landed before T-012's interaction-heavy
verification; also automates most of the @human real-input checklist
for the future.

## Acceptance criteria
- THE repo SHALL gain a GitHub Actions workflow (one ubuntu job:
  webkit2gtk deps, npm ci + parser/app builds + all three suites +
  token lint + cargo audit + the E2E lane + an xvfb tauri boot
  asserting the `[nputer]` startup lines) — committed complete,
  machine-validated now for YAML validity + command parity with
  CONVENTIONS + SHA-pinned actions, ACTIVATING at the repo's first
  GitHub push (no remote exists today). The Linux halves of
  T-001/T-003 criteria close at that activation and remain honestly
  open until it.
- THE repo SHALL gain a self-contained tools/e2e package (own
  package.json, ADR-011 family) driving the dev bundle +
  __nputerDocsHarness with REAL input: the T-005 blocker-link
  re-target under a trusted click, real-key Escape/Enter/Space on the
  panel — the rejection class synthetic tests provably cannot catch.
- THE lane SHALL include the token-lint guard (greppable
  arbitrary-value and non-token-utility patterns over app/src — the
  Tailwind v4 escape hatches documented in CONVENTIONS) as a local
  command AND a CI step, passing on the current tree and failing with
  file:line on a planted violation.
- THE lane SHALL include an advisory audit (cargo audit over
  app/src-tauri/Cargo.lock's exact-pinned tree) as a local command
  AND a CI step, so a RUSTSEC advisory against the pins becomes a
  visible failure prompting deliberate re-pin + re-review, never
  silence.
- IF the E2E lane cannot run under a scheme (e.g. webkit quirk) THEN
  the lane SHALL fail loudly with the reason — never silently skip.

## Implementation plan (size-L planning pass — planner session claude-fable-5, 2026-08-16)

Drafted read-only by the planning session; the architect reviews this section, the planner applies it into docs/tasks/T-020-ci-real-input-lane.md on approval, and the architect commits — nothing below is in effect until that commit.

Planning pass, not a debate room: no contested architectural fork — the lane's charter is fixed by the three absorbed suggestions (T-001-s2 token lint, T-001-s3 Linux run, T-005-s4 trusted-input E2E) and the CONVENTIONS pointerdown gotcha that names this lane by role. This section settles every decision a fresh executor would otherwise guess, including one reality the criteria predate (§1). Repo facts cited were verified against the working tree, the npm registry, and `git remote -v` on 2026-08-16.

**Frontmatter changes made by this pass:** `touches` becomes `[.github/, tools/e2e/, .nputerignore]` — the root `.nputerignore` gains one line (§3) and the guardrail only works if touches tells the truth (T-009 precedent). `blocked_by` stays empty: disjoint from T-018 (app-shell Rust) and T-019 (lib-parser); the lane runs the app and parser but edits neither. **Absorption change:** the body's absorbs line becomes `Absorbs: T-001-s2, T-001-s3, T-005-s4, T-009-s3` and the architect `git rm`s docs/tasks/T-009-s3-cargo-audit-lane.md in the same commit (triage encoding; ruling in §6).

### 1. The no-remote reality — what "CI" means here, settled first

Verified 2026-08-16: `git remote -v` is EMPTY. No GitHub presence exists; the public launch is planned, not done. The criteria's "GitHub Actions ubuntu job" therefore cannot execute at this task's own verification time — and pretending otherwise would make "done" unfalsifiable. Settled shape, three honest tiers:

1. **Live now, first-class local commands**: the real-input E2E lane, the token lint, and the cargo audit all run TODAY as per-package commands run from tools/e2e/ and app/src-tauri/, wired into CONVENTIONS (§10) — the verifier of THIS task and every future integrator runs them on this machine.
2. **Dormant-but-complete**: `.github/workflows/ci.yml` lands finished — it activates at the repo's first GitHub push, as launch-prep artifact. It is machine-validated NOW by a parity test inside the lane (§9): valid YAML, every CONVENTIONS suite command present as a step verbatim, every `uses:` action pinned by full commit SHA. The workflow is a thin invoker of the same commands CONVENTIONS documents — one source of truth, drift caught by the test.
3. **Honestly unverified until activation**: the ubuntu apt set, the xvfb webkit2gtk boot, playwright-on-Linux, audit-in-CI. The T-001-s3 Linux half does NOT close at this task's "done" — this task builds the machine that closes it at first push. STATE's launch checklist gains "watch the first CI run" at integration.

Alternatives rejected: creating a private GitHub repo now just to exercise the workflow (publishing a remote is the human's launch decision, not a hardening task's side effect); local `act`/Docker emulation (not the real runner, adds a dev-tool dependency, and a green emulation would overclaim); deferring the whole task to launch (the local halves are the value, and the workflow is cheapest written while T-001/T-005 context is fresh).

**Criteria amendments (exact text), the T-012 §1 precedent.** Replace criterion 1 with:

> - THE repo SHALL gain a GitHub Actions workflow (one ubuntu job:
>   webkit2gtk deps, npm ci + parser/app builds + all three suites +
>   token lint + cargo audit + the E2E lane + an xvfb tauri boot
>   asserting the `[nputer]` startup lines) — committed complete,
>   machine-validated now for YAML validity + command parity with
>   CONVENTIONS + SHA-pinned actions, ACTIVATING at the repo's first
>   GitHub push (no remote exists today). The Linux halves of
>   T-001/T-003 criteria close at that activation and remain honestly
>   open until it.

Replace criterion 3 with:

> - THE lane SHALL include the token-lint guard (greppable
>   arbitrary-value and non-token-utility patterns over app/src — the
>   Tailwind v4 escape hatches documented in CONVENTIONS) as a local
>   command AND a CI step, passing on the current tree and failing with
>   file:line on a planted violation.

Add (absorbing T-009-s3):

> - THE lane SHALL include an advisory audit (cargo audit over
>   app/src-tauri/Cargo.lock's exact-pinned tree) as a local command
>   AND a CI step, so a RUSTSEC advisory against the pins becomes a
>   visible failure prompting deliberate re-pin + re-review, never
>   silence.

Criteria 2 and 4 stand unchanged.

### 2. Real-input tooling — Playwright, exact-pinned, Chromium project, headless

**Decision: @playwright/test, exact-pinned `"1.62.1"`** (npm latest, verified today), Chromium project only, headless by default. The bug class this lane exists for (T-005's rejection): trusted events get microtask checkpoints BETWEEN listeners, so React's discrete flush lands mid-propagation and detaches the clicked node — synthetic dispatch propagates synchronously and provably cannot reproduce it. Playwright injects input via the CDP Input domain: `isTrusted: true` in-page, full browser input pipeline, real inter-listener timing — the class manifests (the T-005 rejection was OBSERVED in a Chromium pane; the mechanism is per-spec, engine-independent). Headless Chromium delivers the same pipeline — which also satisfies the standing rule: no screen control in the pipeline, headless verification only, humans do visual checks.

What Playwright buys: hermetic browser (the binary is keyed to the package version — the pin IS the browser pin), first-class trusted keyboard (`keyboard.press("Escape")` — the thing T-005's environment could never inject), split-step mouse (`mouse.down()`/`up()` — lets us assert dismissal-at-PRESS semantics), auto-waiting locators (kills the settled-read flake class both T-005 passes fought by hand), xvfb-free headless on Linux CI, trace-on-failure artifacts. Dependency truth stated plainly: three npm packages at one version (@playwright/test → playwright → playwright-core, Microsoft, no further runtime spread — lockfile-verifiable) plus a ~150–250MB Chromium download cached OUTSIDE the repo (~/Library/Caches/ms-playwright; `npx playwright install chromium`, a documented one-time dev-tool step, §10) — the heaviest dev tool in the repo's history, bought for the one capability nothing lighter provides, confined to a package no product code depends on.

Rejected, with costs named:
- **Bare CDP over system Chrome** (the T-006 probe precedent): right for one-off verification probes, wrong for a STANDING lane — system Chrome is exactly the machine-local input T-009 §3 exterminated from the graph (version floats weekly; "works on my Chrome" is not a lane), and it means hand-rolling WebSocket protocol, target attach, input encoding, and wait primitives (~300 lines of maintenance that Playwright ships tested). Zero-download was its only virtue.
- **tauri-driver / WebDriver**: drives the REAL wkwebview/webkit2gtk — closest to production — but has NO macOS support (Linux WebKitWebDriver + Windows Edge Driver only). The lane would be unrunnable on the only machine that exists today, inverting §1's entire point. Named as the designated Linux-era revisit (§9 silences): once CI is live, a tauri-driver job driving actual webkit2gtk is the honest next rung.
- **Playwright's webkit project now**: tempting (WebKit family = wkwebview's engine) but every engine is a fresh flake surface for a lane whose credibility rests on determinism. v1 pins the class in the engine it was observed in; adding `webkit` to `projects` is a named one-line growth step after the lane has a track record.

Recorded limit, honestly: the lane drives the DEV bundle in Chromium, not the packaged wkwebview. It pins the event-TIMING class (per-spec, engine-shared); webview-engine-specific behavior remains the xvfb boot (Linux, dormant) + the @human visual checklist.

### 3. Package shape — tools/e2e standalone; ADR-011 revisited and reaffirmed

**tools/e2e is the repo's THIRD npm package, self-contained per the ADR-011 family**: own package.json (private, `engines >=22`), own package-lock.json (committed), own tsconfig + .gitignore (test-results/, playwright-report/; root .gitignore already covers node_modules/). devDependencies only: `@playwright/test` `"1.62.1"` (exact — the browser rides the version; re-pins are deliberate acts), `yaml` `^2.8.0` (the parity test's parser; same dep lib/parser carries), `typescript` `^5.8.0`, `@types/node` `^22.15.0`. Scripts: `test` (playwright test — the lane), `typecheck` (tsc --noEmit), `lint:tokens` (node scripts/lint-tokens.mjs), `boot:check` (node scripts/tauri-boot-check.mjs).

**ADR-011's trigger fires nominally ("a THIRD package appears") — revisited, decided: still NO root workspace.** The trigger's substance was dependency wiring; tools/e2e imports NEITHER package — it drives the app over HTTP + the DEV harness and re-declares the snapshot payload shape as a small structural copy (a ~10-line interface mirroring `DocsSnapshotPayload` — `{seq, projectDir, generatedAtMs, files: [{path, content}]}`, verified against docs-model.ts today — with a comment naming the source of truth; the T-003 contract is stable and the harness fails loudly on drift). A workspace would buy a shared install for three DISJOINT trees at the price of migrating every CONVENTIONS-verbatim command — the exact silent-breakage trap ADR-011 names; the dormant CI installs per-package in CONVENTIONS order anyway. Proposed dated addendum to ADR-011 (integrator applies at merge, exact text): *"Addendum (2026-08-16, T-020): the third package arrived — tools/e2e, the real-input E2E lane. Revisit outcome: still no root workspace. The trigger's substance was dependency wiring; tools/e2e imports neither package (it drives the app over HTTP + the dev harness), so a workspace would buy a shared install for three disjoint trees at the cost of migrating every CONVENTIONS-verbatim command — the trap this ADR names. CI installs per-package in CONVENTIONS order. Revisit again when a package must IMPORT another beyond the existing file: edge, or CI install time becomes the constraint."*

**How the lane serves and drives the app**: playwright.config `webServer` runs `npm run dev -- --port ${PORT} --host 127.0.0.1` with cwd ../../app (CLI flags only — the T-005 verifier precedent; vite.config.ts untouched; `strictPort` stays true so a busy port fails loudly). `PORT` = `NPUTER_E2E_PORT` env or default **14520**; the config THROWS if PORT is 1420 ("1420 is the human's live app — never contact it") — the standing order becomes code. `reuseExistingServer: false` — the lane always owns its server, never attaches to someone else's. Each test opens a fresh page (fresh module store → phase "browser" → `window.__nputerDocsHarness` active, DEV-only by construction) and applies its own fixture payload via `page.evaluate` — synthetic calls are fine for STATE plumbing; only INPUT must be trusted. workers 1, `retries: 0` everywhere with a comment (retries would mask exactly the timing class the lane exists to catch), trace retain-on-failure, viewport 1280×720 (the T-005 repro geometry). Global-setup preflight, each failing loudly with its reason (criterion 4): app/node_modules present; lib/parser/dist present (else print the ADR-011 build-order pointer); port ≠ 1420 and bindable. Fixtures: TS modules under fixtures/ authored from the real formats (T-008 component files with `paths` globs + `touch_slugs`, TASK-FORMAT tasks, a ROADMAP.md backbone, a minimal valid graph.json cribbed from nputer-index's golden schema) — one shared fixture covering both panes: features F-A/F-B; T-A done (verdicts, stamps, `blocked_by: [T-B]`), T-B building (touches the fixture component's slug), T-C planned bodyless, one parked task; component C-A whose globs match the fixture graph's two files.

**The map/repo boundary**: `.nputerignore` gains `tools/` (one line + comment). The indexer would otherwise walk the lane's TS and mint permanent D2 unmapped-drift noise — the exact rationale that excluded docs/ ("the brain, not the codebase") and the crate's fixtures; dev tooling that drives the app from outside is config-excluded, not registry territory. Consequence the integrator relies on: the committed graph.json stays byte-identical at merge — the T-009-s1 regen ritual becomes a verified no-op (run it anyway; byte-identity is the proof).

### 4. Test inventory v1 — small, high-value, growable; each test and its assertion

Seven spec files under tests/:

1. **trusted-canary.spec** — the lane's own credential, first: harness present (else fail naming the cause — "dev-only, non-Tauri; are you serving a prod build?"); a page-level capture listener records `event.isTrusted` for one lane click and one lane keypress → BOTH true. Guards the lane against ever quietly degrading to synthetic dispatch (a future `dispatchEvent` refactor fails here, not silently).
2. **blocker-retarget.spec** — THE regression this lane exists for (T-005's rejection, verbatim under real input): apply fixture; real click T-A's card → panel opens; tag the panel node via evaluate; real click the T-B blocker chip → panel RE-TARGETS (`data-task-ref` = T-B), stays open, SAME node (tag survives — the T-005 verifier's identity trick), board intact.
3. **keyboard-activation.spec** — the latent variant T-005's fix pinned: focus the blocker chip, real `Enter` → re-targets without closing; repeat with `Space`. (Trusted click, zero pointer events — the path no jsdom test can produce.)
4. **panel-real-keys.spec** — real `Escape` closes the panel AND focus returns to the opener trigger (`document.activeElement` asserted); real `Enter`/`Space` on a focused card trigger opens it (UA activation under trusted timing).
5. **panel-exempt-controls.spec** — T-017's mechanism under real input: panel open → real click "Toggle theme" (inside the header's `data-panel-exempt` container, confirmed in App.tsx today) → panel STAYS open AND `html.dark` actually flips (both schemes' computed background asserted — the theme-flip check rides here); flip back; then a genuine outside press closes AT PRESS — asserted between `mouse.down()` and `mouse.up()` (dismissal-at-press semantics, the fix's own contract); real click on the parked row's exempt expander also stays open.
6. **map-retarget.spec** — T-012's trusted-order concern: real click the rail's map item → map pane; real click component node C-A → selection + MapPanel (`data-card-trigger` exemption holds — the press switches, never dismisses); real click the touching-task row (T-B) → the REAL TaskDetailPanel opens, stays open.
7. **workflow-parity.spec** — no browser: parse .github/workflows/ci.yml with `yaml`; assert validity, every CONVENTIONS suite command present as a step string verbatim (expected list hard-coded with a pointer comment), every `uses:` matching `@[0-9a-f]{40}`, and the boot step invoking scripts/tauri-boot-check.mjs under xvfb-run.

No `test.skip` anywhere in the lane, by rule — a scheme that cannot run FAILS with its reason (criterion 4). Named growth candidates, deliberately not v1: map search-popover Esc layering; the webkit project; a picker-flow test (impossible from the browser harness — stays @human, §9).

### 5. Token lint — the grep-grade guard, patterns verified against today's tree

`tools/e2e/scripts/lint-tokens.mjs` — plain node, zero deps: walks app/src `**/*.{ts,tsx}` (css excluded — tokens.css/index.css are the legal home of raw values and bracketed selectors), applies four patterns per line, prints every `file:line: match`, exits non-zero on any hit. `--selftest` runs the patterns against embedded positive/negative samples and is part of the lane + CI step.

| # | pattern (ERE) | catches | tree today |
|---|---|---|---|
| P1 | `-\[[^]]` | arbitrary values: `p-[13px]`, `text-[0.8rem]`, `max-h-[…]` — the T-001-s2 bypass itself | 0 hits (verified) |
| P2 | ``(^\|["'`{ ])\[[a-z-]+:[^]]+\]`` | arbitrary properties: `[color:red]`, `[mask-type:…]` | 0 hits (verified) |
| P3 | `\b(bg\|text\|border\|ring\|outline\|fill\|stroke\|shadow\|decoration\|divide\|accent\|caret)-(red\|orange\|amber\|…\|stone)-[0-9]{2,3}\b` (full 22-name default palette) | Tailwind default-scale utilities — dead-by-mechanism here, so any occurrence is a silent no-op bug made loud | 0 hits (verified) |
| P4 | `-\(--` | v4 var shorthand `bg-(--x)` — compiles without a mapped utility, same escape class | 0 hits (verified) |

Recorded exclusion, with evidence: arbitrary VARIANTS (`[&_svg]:…`) are deliberately not linted — they target selectors, not values (the token mechanism still governs the utility half), and vendored ui/button.tsx legitimately carries three (verified today; linting them would fail the tree on stock shadcn). No allow-comment mechanism — zero-allowlist by design; a genuine future collision is a consultation, not an escape hatch. Proof obligations (§9): current tree passes; a transient planted `p-[13px]` + `text-red-500` is caught with file:line and reverted; selftest green. Wired as `npm run lint:tokens` + a CI step.

### 6. cargo-audit absorption (T-009-s3) — yes

Absorbed (frontmatter note above; new criterion in §1). Cheap, and it completes T-009's own bargain: exact `=` pins made the supply-chain review binding, so nothing re-checks the tree as RUSTSEC advisories land — the audit is that re-check. **cargo-audit is a DEV TOOL, never a repo dep**: zero manifest/lockfile diff anywhere. Local expectation (CONVENTIONS): `cargo install cargo-audit --locked` once, then `cargo audit` from app/src-tauri/ (reads Cargo.lock; fetches the advisory DB — the one network-touching step, documented as such). CI gets it the same way — `cargo install cargo-audit --locked` as a step (bin cached under the ~/.cargo cache), NOT a third-party audit action: same command both places, parity test enforceable, no extra action in the supply chain. Failure semantics: HARD fail, both places — an advisory appearing overnight without a code change going red is the FEATURE (T-009-s3's words: a visible failure prompting deliberate re-pin + re-review at the stop-and-consult gate), never `continue-on-error`. At this task's own build: the executor runs it once against today's pins; findings, if any exist already, are a consultation finding — not silently accepted, not silently "fixed" by floating pins.

### 7. The xvfb tauri boot — the dormant Linux half, plus a script with live mechanics

`tools/e2e/scripts/tauri-boot-check.mjs` — plain node: bind-probe port 1420 first (bind, not connect — zero packets at anything listening; busy → abort loudly "port 1420 in use — the human's live app? boot check must not contend"); spawn `npm run tauri dev` (cwd app/), scan merged stdout/stderr for BOTH startup lines (`[nputer] project folder:` and `[nputer] window "main" created`), then kill the process tree and exit 0; overall timeout (default 20 min — debug cargo dominates cold) and a no-output watchdog, each failing loudly with what was and wasn't seen. In the workflow: `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs`, env `WEBKIT_DISABLE_DMABUF_RENDERER: "1"` (known webkit2gtk-in-headless-CI rendering workaround, commented; the check asserts startup lines, not pixels), placed LAST so the cargo cache from the test step warms the build. Why it cannot be verified now: it needs webkit2gtk + Xvfb — Linux — and no Linux machine or remote exists (§1); this is the carried-dormant half, said plainly in the task's "done". What IS verified now (§9): the script's own mechanics on macOS — a real run detecting both lines and killing clean (T-001 precedent: a briefly-opened window is not screen control), plus the timeout path forced with a 1-second limit. The workflow job itself: `runs-on: ubuntu-24.04` (pinned, not -latest); apt set per Tauri v2 Linux prerequisites (libwebkit2gtk-4.1-dev, build-essential, libxdo-dev, libssl-dev, libayatana-appindicator3-dev, librsvg2-dev, xvfb); node 22 via SHA-pinned actions/setup-node with npm cache over the three lockfiles; rust = the runner's preinstalled stable (a `rustc --version` record step; no third-party toolchain action); actions/cache (SHA-pinned) for ~/.cargo + app/src-tauri/target keyed on Cargo.lock, and ~/.cache/ms-playwright keyed on tools/e2e/package-lock.json; steps in order: token lint → parser (npm ci · vitest · tsc · build) → app (npm ci · build · test) → cargo test → cargo audit → e2e (npm ci · `npx playwright install --with-deps chromium` · playwright test) → xvfb boot. `on: push (main) + pull_request + workflow_dispatch`; concurrency group per-ref cancel-in-progress; `timeout-minutes: 45`. Every `uses:` pinned by full commit SHA current at build time, recorded in notes (the parity test enforces the shape).

**Fold (2026-08-16, T-018-s3 — human-approved at dispatch):** the ubuntu cargo-test step is the first backend where T-018's replaced-wholesale and deleted-recreated sentinel live tests can actually DISCRIMINATE — inotify watches inodes, so a stale handle really dies there; macOS FSEvents watches paths and was accidentally resilient all along (the T-018 verdict correction). No new lane work: the cargo step already runs the full suite. The fold is the designation plus its consequence — the "watch the first CI run" launch item (§1 tier 3, drafted-for-integrator STATE text) explicitly includes confirming those three sentinel live tests on ubuntu: green there closes the replace-half regression evidence T-018 carries as mechanism-only; red there is a real reconcile gap macOS could never show, filed immediately. docs/tasks/T-018-s3 is absorbed (file removed at this dispatch commit, triage encoding).

### 8. Out-of-scope fence (do not build)

- **Zero app code changes** — no file under app/ or lib/parser/ is edited, INCLUDING test hooks: the shipped testid/data-attribute surface (T-005/T-012/T-017 inventory) is the contract; a missing hook is a SUGGESTION, never an edit. The §9 bug-reintroduction probe is transient in the worktree and reverted — final `git diff` of app/** is empty.
- No board/map/parser behavior changes, no new tokens, no vite.config/tauri.conf/capabilities/CSP diff, no app or parser package.json/lockfile diff.
- Dependencies confined to tools/e2e/package.json (+ its lockfile) and documented dev-tool expectations (Playwright's browser cache outside the repo; cargo-audit binary). Nothing else gains a dep.
- No remote creation, no GitHub API use, no repo-visibility decisions — launch remains the human's.
- No dependabot/renovate/CODEOWNERS/branch-protection files (standing-rule creation without a remote is theater; launch prep's call).
- No visual/screenshot regression testing (humans do visual checks — standing rule), no `act`/Docker harness, no webkit/tauri-driver projects (named growth steps only).

### 9. Tests-of-the-lane + verification protocol

The lane itself is the deliverable, so the executor proves the LANE, not just the app under it:

1. **Green run**: full lane against the current tree, headless, all specs green; `npm run typecheck` clean; lint selftest + zero-hit run; `cargo audit` outcome recorded.
2. **The lane catches the bug — failing→passing at lane level**: transiently sed-swap the two event-name strings `"pointerdown"` → `"click"` in app/src/components/board/panel-dismissal.ts (the T-005 verifier's own stage-1 re-derivation — character-identical to the rejected code); rerun the lane → blocker-retarget.spec AND keyboard-activation.spec MUST fail (the panel closes under trusted timing); paste the failing output verbatim in notes; `git checkout` the file; rerun → green. This is the T-005 fix's failing→passing evidence pattern, promoted to lane level: the lane demonstrably distinguishes the shipped app from the rejected one.
3. **Canary integrity**: trusted-canary green; additionally one deliberate `dispatchEvent(new MouseEvent("click"))` probe in a scratch spec shows `isTrusted: false` would be caught (probe deleted; proves the canary discriminates).
4. **Lint proof**: planted `p-[13px]` + `text-red-500` in a transient app/src edit → both reported file:line, exit non-zero; reverted; zero-hit run repeated.
5. **Loud-failure drills (criterion 4)**: port forced to 1420 → config throws with the stated reason; parser dist renamed aside → preflight names the ADR-011 order; server killed mid-run → spec fails with connection error, no skip; `NPUTER_E2E_PORT` set to a busy port → vite strictPort fails the webServer loudly.
6. **Boot script mechanics (macOS)**: one real run — both `[nputer]` lines detected, process tree killed clean, exit 0; timeout path forced at 1s → loud failure naming the missing line; 1420-busy path forced with a scratch listener → the bind-probe abort message.
7. **Suites + boundary**: parser, app, and cargo suites at their then-current counts, untouched (today: 132 · 375 · 109+2 ignored); graph regen ritual run at merge → byte-identical (tools/ is nputerignored, §3); diff surface audit per §10.

**Verifier's likely attack surface, flagged now**: (1) tools/e2e dependency review — the three-package Playwright tree at the exact pin, lockfile checksums from registry.npmjs.org, no install scripts beyond Playwright's own, browser cache location outside the repo; (2) independently re-derive probe 2 (the sed-swap is one command — the whole failing→passing story is reproducible in minutes); (3) fence audit — `git diff` empty across app/**, lib/parser/**, docs/architecture/** (graph byte-identical), method/**; (4) the never-1420 rule — code-level throws + no process bound 1420 during any lane run; (5) lint attack — craft near-misses (regex literals containing `-[`, `[data-…]` selectors, arbitrary variants in vendored button.tsx) and confirm no false positives, plus false-negative probes per pattern; (6) parity-test honesty — mutate a workflow command in a scratch copy and watch the spec fail; (7) headlessness — no window appears during the default lane (the boot script's brief window is the sole, documented exception, outside `npm test`); (8) fixture fidelity — payload shape against docs-model.ts, component files against the T-008 format.

### 10. Dispatch note

New territory: tools/e2e/ and .github/ exist in no other card's touches — dispatch any time, parallel-safe against T-018/T-019 (disjoint touches; the lane runs the app but edits nothing). If either merges mid-flight, integration re-runs the lane with the suites as usual.

**Executor reads**: this section top to bottom; CONVENTIONS (the pointerdown gotcha — the lane's reason to exist — and the suite commands the parity test will bind); T-005's REJECTED verdict + fix pass (the mechanism, the sed-swap trick, the repro geometry); T-012 plan §5 + T-017's App.tsx exemption comment (the interaction surface + data attributes); T-008 component format + one nputer-index golden (fixture authoring); ADR-011 (the ruling being addended); T-009 verdict (the pins the audit re-checks); watcher-store.ts + docs-model.ts (harness contract + payload shape).

**Expected diff surface, exhaustively**: `.github/workflows/ci.yml` (new) · `tools/e2e/**` (new: package.json, package-lock.json, tsconfig.json, playwright.config.ts, global-setup, .gitignore, fixtures/, tests/ — seven specs, scripts/lint-tokens.mjs, scripts/tauri-boot-check.mjs) · `.nputerignore` (one line + comment) · this task file (notes). Drafted-in-notes for the INTEGRATOR (per precedent, not in the executor's diff): the CONVENTIONS block (tools/e2e commands; the one-time `npx playwright install chromium` and `cargo install cargo-audit --locked` expectations; the port rule; headless-by-default) and the ADR-011 addendum (§3 exact text). **Zero diff anywhere else** — app/**, lib/parser/**, docs/architecture/** (graph byte-identical at merge), method/**, every existing lockfile.

**Genuine silences, left open deliberately**: Chromium-not-wkwebview (the lane pins the timing class; engine parity is the boot check + @human until the Linux era) · picker flows stay @human — native dialogs are unreachable from the browser harness and tauri-driver has no macOS · the webkit project and a tauri-driver-on-Linux job are named growth steps once CI is live · a macOS CI job (cost/queue) is a launch-time call · map search-popover Esc layering waits for lane v2 · Windows remains the repo-wide standing silence · advisory-DB network dependence of `cargo audit` is documented, not worked around · Playwright re-pins are deliberate acts (the browser rides the version), same policy as the crate pins.

## Implementation notes

## Verdicts
