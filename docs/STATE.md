# State

Updated: 2026-08-16 by integrator (T-020 merge), claude-opus-5 @fresh

## Just completed
T-020 (CI + real-input E2E lane, L, .github/ + tools/e2e/) done and
merged — APPROVED first-pass. Built across models (claude-fable-5
@fresh built the whole lane and died mid-verification at 986431e;
claude-opus-5 @fresh resumed from those WIP commits and ran the §9
protocol), verified by claude-opus-5 @fresh — `review: same-model`
taken as the conservative floor relative to the COMPLETING builder,
with the fable-built half receiving cross-model review. The repo gains
its first CI workflow and its THIRD npm package.

WHAT THE LANE IS: tools/e2e — a self-contained Playwright package
(exact-pinned `@playwright/test` 1.62.1, Chromium project only,
HEADLESS, workers 1, retries 0, no skips anywhere) that serves the
app's dev bundle on its own vite and drives it with REAL, trusted
input. Seven specs / 16 tests: trusted-canary (the lane's own
credential — `isTrusted` true for a lane click AND a lane keypress),
blocker-retarget, keyboard-activation (Enter + Space), panel-real-keys
(Escape closes + focus returns; Enter/Space open), panel-exempt-controls
(theme toggle keeps the panel open and the scheme actually flips;
dismissal asserted AT PRESS between mouse.down and mouse.up; the parked
row's exempt expander), map-retarget, and workflow-parity (no browser —
it machine-validates the dormant ci.yml). This is the rejection class
synthetic tests provably CANNOT reach: trusted events get microtask
checkpoints between listeners, so React's discrete flush detaches the
clicked node mid-propagation; jsdom dispatch propagates synchronously
and stays silent.

IT EARNS ITS KEEP, PROVEN: planting the T-005 rejection back into
app/src/components/board/panel-dismissal.ts — `sed` both
`"pointerdown"` strings to `"click"`, character-identical to the
rejected code — turns the lane red on exactly the right tests: 4
failed / 12 passed, i.e. blocker-retarget, keyboard-activation ×2, and
the at-press assertion. The verifier re-derived that from scratch and
did not stop at the count: the SAME locator resolved one line earlier
for the opened panel, and Playwright's own failure snapshot shows a
fully rendered board with NO panel node anywhere — so `element(s) not
found` is the panel having opened and then CLOSED, the real T-005
signature, not an incidental selector miss. Revert → 16 passed. The
lane demonstrably distinguishes the shipped app from the rejected one.

THREE-TIER HONESTY (plan §1) — this is the part that must not blur:
1. LIVE NOW, local commands, run by every future integrator on this
   machine: the E2E lane, the token lint (+ `--selftest`), `cargo
   audit`, and `npm run boot:check`. All in CONVENTIONS as of this
   commit.
2. DORMANT BUT COMPLETE: .github/workflows/ci.yml — one ubuntu-24.04
   job, every `uses:` pinned by full 40-hex commit SHA, a thin invoker
   of the CONVENTIONS-verbatim commands. It cannot run: `git remote -v`
   is still empty. It ACTIVATES at the repo's first GitHub push.
   Machine-validated NOW by workflow-parity.spec: YAML validity, every
   suite command present verbatim AND in order, 40-hex shape on every
   `uses:`, the apt set, the xvfb boot invocation. The verifier
   mutated it seven ways and each mutation was caught by exactly the
   intended assertion.
3. HONESTLY UNVERIFIED UNTIL ACTIVATION — say it plainly, do not let
   it decay into "CI is green": the ubuntu apt/webkit2gtk set, the
   xvfb webkit boot, playwright-on-Linux, audit-in-CI, and the SHA↔tag
   correspondence (the shape is machine-checked; the mapping is not,
   because the fence forbids GitHub API use — a wrong SHA fails the
   first run loudly). The Linux halves of T-001/T-003's criteria do
   NOT close here; this task built the machine that closes them.

LAUNCH ITEM — **watch the first CI run** (T-020). At the repo's first
push, confirm in order: the ubuntu apt/webkit2gtk set installs; the
three `uses:` SHA pins resolve; playwright-on-Linux runs the lane;
`cargo audit` behaves as it does locally; the xvfb `tauri dev` boot
prints both `[nputer]` startup lines. AND (T-018-s3 fold) the THREE
T-018 SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
replaced-wholesale and deleted-recreated docs/. They discriminate only
where inotify watches INODES; macOS FSEvents watches paths and was
accidentally resilient all along, which is why T-018's replace-half
evidence is mechanism-only today. Green there CLOSES that evidence gap;
red there is a real reconcile gap macOS could never surface, and gets
filed immediately.

CARGO AUDIT, and the human ruling that closed it. Local run: **0
vulnerabilities, 17 informational warnings** (16 `unmaintained` + 1
`unsound` — the gtk-rs GTK3 family, `glib` 0.18.5, `proc-macro-error`,
the `unic-*` family), 472 locked crates, cargo-audit 0.22.2 — every one
transitive under Tauri v2's own tree, nothing ours to re-pin. Plain
`cargo audit` exits 0 on warnings, so the executor measured the gap
between the shipped command and the criterion's prose, refused to hide
it or unilaterally add an ignore-list, and escalated it as T-020-s2;
the verifier PROVED the half that matters — a synthetic lock pinning
`time 0.1.44` audited → exit 1 (RUSTSEC-2020-0071) — so a genuine
vulnerability against the pins really does go red. **@human ruled
2026-08-16 (question card while awake): ACCEPT AS-IS.** Vulnerabilities
gate; informational warnings stay non-gating and are recorded as a
dated CONVENTIONS baseline reviewed by eye, because `--deny warnings`
would red CI permanently for no actionable signal. T-020-s2 resolved to
docs/tasks/rejected/ with that reasoning.

The second @human item was ruled the same night: **T-020-s1** (the open
panel occludes the header's exempt controls, so the theme toggle is
keyboard-only while a panel is open) — the exemption is a SAFETY NET
against accidental dismissal, not a promise that exempt controls stay
pointer-reachable; close the panel, then toggle. Recorded in
CONVENTIONS beside the dismissal gotcha so it stops reading as a bug;
s1 resolved to rejected/ too. So T-020 opened two @human questions and
BOTH closed the same night — the consolidated @human list below is two
items shorter than this merge forecast, not two longer.

SUITES ON MERGED MAIN, all four re-derived here first-hand, fresh
installs: lib/parser `npm ci` + `npm test` **159/159 (10 files)**,
`npx tsc --noEmit` clean, `npm run build` clean · app `npm install` +
`npm run build` exit 0 + `npm test` **398/398 (21 files)** ·
app/src-tauri bare `cargo test` **129 passed + 2 ignored** (summed
across all binaries and doc-tests — `tail` truncates the totals, a trap
the notes flag and this session avoided) · tools/e2e `npm ci` clean (8
packages, all dev, all with integrity hashes) + `npx playwright test`
**16/16 in 5.1s**, headless, one worker, its OWN vite on 14520. Nothing
ever bound or contacted 1420, and no server was left running.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS
interim regen rule; retires when T-014's `nputer index --check` becomes
the gate) — EIGHTH exercise, and the first that is a deliberate NO-OP.
TRIGGERED by the letter of the rule (the branch adds `.ts` files under
tools/, i.e. outside docs/), and the ritual was run anyway rather than
argued away: `NPUTER_UPDATE_GOLDEN=1` regen then the plain ignored
self-check, both ok — and the committed graph is BYTE-IDENTICAL,
sha256 a983156341274cf81fafce94a0a5bdb73c6f34b02b56603349340e110bb94dd9
before and after, `git diff docs/architecture/graph.json` empty, still
78 files / 449 symbols / 790 edges / languages ["ts"], and ZERO `tools/`
paths anywhere in it. That is `.nputerignore`'s new `tools/` line doing
its job. It is load-bearing, not decorative, and this is not an
assumption: the verifier ran the negative control — DELETE the `tools/`
line and the same ritual FAILS ("committed graph.json is stale"). No
fixture reconciliation was owed and none was invented; both dogfood
fixtures stand byte-unchanged and the app suite passed against the
unchanged graph.

INTEGRATOR JUDGMENT CALLS, recorded. **CONVENTIONS: the big one, and
it was owed** — the verifier flagged that without it criteria 3 and 4's
"local command" half is undocumented. Added: the tools/e2e command set
(lane, typecheck, `lint:tokens` + selftest, `boot:check` and why it is
NOT inside `npm test`), `cargo audit` beside `cargo test`, the two
one-time dev-tool expectations (`npx playwright install chromium` with
its cache OUTSIDE the repo; `cargo install cargo-audit --locked`, the
one network-touching command), the PORT RULE (the lane owns
NPUTER_E2E_PORT / default 14520, `reuseExistingServer: false`, and 1420
THROWS at config load by design), the audit gate policy with today's
dated baseline, and the CI divergences — `npm ci` for app/ where local
setup says `npm install`, and `--with-deps` on the browser install.
Two truth-fixes to existing text while there: the dismissal gotcha's
"real-input E2E lane proposed as T-005-s4" now names the lane that
EXISTS, and carries the s1 ruling. **ADR-011: amended for the first
time in this repo's history** — no ADR had ever been touched after its
checkpoint. Deliberate, drafted in the plan, architect-approved, and
applied as a clearly dated `## Addendum` section that leaves the
original decision text untouched: the third package arrived, the
revisit its own Consequences called for was performed, outcome still NO
root workspace (tools/e2e imports neither package; a workspace would
buy a shared install for three disjoint trees at the cost of migrating
every CONVENTIONS-verbatim command — the exact trap this ADR named),
with a sharper re-trigger condition. **ARCHITECTURE: minimal addition,
because the old text became FALSE** — the "Code layout" bullet ended
"no root workspace until a third npm package forces one", and the third
package has now arrived without forcing one. That clause now says the
ruling was revisited and REAFFIRMED (pointing at the addendum), and the
enumeration gains `tools/e2e/` (dev tooling under no component — it
drives the app from outside over HTTP and is .nputerignored out of the
map) and `.github/workflows/`. **NO new ADR** (three-prong): the one
cross-component question this task raised is the workspace one, and it
is answered by the ADR-011 addendum rather than a new decision; nothing
here contradicts any ADR; and the lane's own calls (Playwright pin,
Chromium-only, port rule, zero-app-code fence) are durably recorded in
the task's §§1–10 plan plus the CONVENTIONS block. **ROADMAP:
untouched, verified line by line** — T-020 is a pulled-forward
milestone-4 hardening task, the backbone tracks neither it nor
mid-milestone progress, and nothing in the file is made false by it
(T-017/T-021 precedent).

## In progress / broken right now
OVERNIGHT AUTONOMOUS RUN (human granted 2026-08-16 night, awake for the
grant card and for tonight's two T-020 rulings):
- T-024 (genesis lens, M, app-interview) in ../nputer-t024 —
  RE-VERIFICATION after a REJECTED verdict and a fresh-executor fix
  (the third registry pin; lib/parser live-tree smoke now lists C-13).
  Second REJECTED on this card would park the app-interview lane for
  the human, per the standing method rule.
- T-026 (genesis entry, M, app-shell) BUILDING in ../nputer-t026.
The t020 worktree is removed; its branch `t020-ci-lane` is KEPT.
Nothing broken. Main tree clean.

## Next up (1–4)
1. @human, consolidated (unchanged in length — T-020's two items were
   opened and ruled the same night, see above): the at-a-glance amber
   judgment (T-012 criterion 5's human half — drift stroke vs
   building/verifying fills, BOTH schemes, incl. composed
   building+drift; the dogfood hero renders it live) · the launch-shot
   re-judgment (T-006's pending screenshot predates the rail — light +
   dark now include it) · the standing real-input checklist, now
   SHRUNK by T-020: blocker-link click and real-key Esc/Enter/Space are
   automated in the lane and no longer need a human pass; PICKER FLOWS
   remain @human (native dialogs are unreachable from a browser
   harness and tauri-driver has no macOS) · a Linux run — this is now
   the "watch the first CI run" item above, and it is the gate that
   closes T-001/T-003's Linux halves and T-018's replace-half evidence
   · the T-023 dry-run conversational quality judgment — did the two
   "pushing back:" challenges actually challenge, does the skip
   handling read honest; the founder was builder-scripted in-session
   (stated limitation), true cold-context evidence arrives with
   T-026/T-029.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026 —
   hand-driven genesis rendered live: T-023 DONE, T-024 in
   RE-VERIFICATION, T-026 BUILDING. Human-ruled queue for the app-shell
   lane: T-026 → T-025 → T-022. T-026's file carries the T-018-s4 fold
   (docs-appeared staleness). T-025 (agent runner, L) is blocked ONLY
   by T-026 now — T-021 and T-023 are both done — and its planning pass
   is already applied. T-027 is L (planning pass at dispatch), and
   dispatches when T-024+T-025+T-026 all merge; T-028/T-029 behind it.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night, via question
   card while awake): app-shell lane queue T-021 → T-026 → T-025 →
   T-022; T-021 and now T-020 are DONE, so T-026 holds that lane.
   T-020: HOLD lifted, T-018-s3 folded, dispatched, and now MERGED —
   this item is closed. Milestone 3 runs through T-029 as blockers
   clear. Triage: APPLY granted — but tasks NEWLY created by triage do
   NOT dispatch without the human. Unchanged method rules: a second
   REJECTED on any task parks that lane for the human; @human
   judgments are never self-answered (tonight's two T-020 items went to
   the human and came back ruled — that is the rule working, not an
   exception to it).
4. Suggestion-backlog triage APPLIED (2026-08-16, architect): 27 open
   suggestions dispositioned, none skipped. Six new milestone-4 tasks —
   T-030 (parser strictness; absorbs T-008-s3, T-011-s4 warn-half,
   T-019-s2, T-019-s3, T-023-s1 — land before T-027, lib-parser lane
   free now), T-031 (board completeness; absorbs T-017-s1/s2/s3,
   T-019-s1 — launch-screenshot surface), T-032 (map-slice hardening;
   absorbs T-009-s2, T-011-s4 doc-half, T-011-s5, T-011-s6,
   T-012-s2/s3/s4), T-033 (zero-drift registry pass; absorbs T-008-s2,
   T-011-s2), T-034 (map tasks lens; promotes T-012-s1), T-035
   (skip-sweep prefix exemption; promotes T-018-s2). Folds: T-009-s1
   ratified as the CONVENTIONS interim regen rule (retirement folded
   into T-014); T-018-s4 into T-026; T-023-s2 into T-024 (Absorbs line
   + file removal at its merge). Parked in place: T-008-s1 (awaits
   F-04/F-05 layout decisions), T-018-s1 (awaits a Windows lane);
   T-003-s2 stays parked as already encoded. Milestone-4 queue after
   F-03: T-010, T-013, T-014, T-015, T-030…T-035, + T-022 (T-020 is
   now merged and off this list).
   FOR THE NEXT TRIAGE (seven open, none dispatched):
   T-021-s1 — the ACL pin's EXPECTED_GRANTS is macOS-derived; exercise
   it on the Linux lane (the first CI run FEEDS this) and decide
   per-platform pins vs a normalized projection · T-021-s2 —
   genericize the AppHandle-taking commands over `R: Runtime` ·
   T-021-s3 — pin the panic-path latch release as a permanent test ·
   **T-020-s3** — the boot check cannot run while the human's app holds
   1420 (a recurring macOS dev-loop cost; its "leave it" arm is well
   argued) · **T-020-s4** — ci.yml declares no `permissions:` block, so
   GITHUB_TOKEN scope is a web-UI checkbox rather than a fact in the
   repo (worth deciding BEFORE the first push) · **T-020-s5** — the
   token lint's P1 pattern fires on dash-prefixed arbitrary VARIANTS
   (`data-[state=open]:`) and on regex literals, contradicting plan §5's
   recorded variant exclusion; harmless today only because the tree's
   one variant shape has no preceding hyphen, so the next
   `npx shadcn add dialog` reds the lint on unmodified upstream code ·
   **T-020-s6** — the parity spec mirrors CONVENTIONS in a hard-coded
   array instead of parsing it, so workflow drift is caught but
   CONVENTIONS drift is not (this merge wrote the section those
   commands point at, which narrows but does not close it). T-020-s1
   and T-020-s2 are already resolved to rejected/ by tonight's human
   rulings. Integrator observation for the same triage, filed here
   rather than as a new card: four suggestion files carry no `id:`
   field (T-021-s1/s2/s3 and T-023-s2) — the T-016 encoding requires
   one at parking, and the parser accepts them silently today.

## Open questions
None.
