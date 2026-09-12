---
type: debate
status: resolved
opened: 2026-09-10
question: The loop costs about 2.5 hours and half a million subagent tokens per size-S card regardless of size; what does an elite team's proportionate process look like here, and which of our fixed costs go
---

# The loop's cost and speed — a fixed floor that does not scale down


## Resolution

- **Question** — the loop costs about 2.5 hours and half a million subagent tokens per size-S card regardless of size; what does a proportionate, elite-grade process look like here, and which fixed costs go?
- **Decision** — @human, 2026-09-10: *"Rule the loop room, A to I as amended: yes"*; *"Universality as a v1 acceptance criterion: yes"*; the public repository: *"later"*. The consolidated seven-part decision above is the ruled form: the three tiers with their budgets, the eight stages, the standing read cut to STATE and an index, the seat's rights, what stays by name, the settings in the runtime template, universality proven on a second project, the order of landing.
- **Why** — measured: two size-S cycles of 2.5 h and 3.5 h with the build a fifth to a third of them; ~520K subagent tokens per small card; a 61K-token standing read; and the superpowers reading (docs/research/superpowers-loop-b36e082.md): no fixed floor, 1.4K standing, files not pastes, one reviewer with two verdicts — and zero enforcement, which is where this method keeps its keepers.
- **Changed** — docs/decisions/024-the-proportionate-loop.md (new); cards T-293 (the standing read), T-294 (CI to ten minutes), T-295 (the merge verb and the cheap keepers), T-296 (the tiers in the method), T-297 (the bands), T-298 (right-sizing, the model per role, bounded waiting), T-299–T-302 (the settings: schema and arm, CLI, app, skill), T-303 (the universality audit), T-304 (the second project), T-305 (the over-run notice); the v1 criterion appended to docs/rooms/version-planning.md's function list and to ROADMAP's method entry. The public repository's room opens when @human says so.

## The question

@human (2026-09-09): "im not sure our current supertaskr process would pass the elite professional software developer test. it takes too long for small changes to reach from card to merge/checkpoint/end of CI run." And (2026-09-10): "we might learn how our own process might be flawed in terms of speed and token economics especially, but also safety and quality."

## What was measured — ours

Two size-S cards on 2026-09-09, dispatch to CI green (the ledger):

| Stage | T-287 | T-285 |
|---|---|---|
| Build in the lane | 29 min | 77 min (one ask) |
| Blind bench, phases 1 and 2 | 51 min | 65 min |
| Merge ritual by the seat | 15 min | 21 min |
| Closing battery | 30 min (one red, one re-run) | 15 min |
| CI | 36 min | 35 min |
| Total | ~2 h 30 | ~3 h 35 |

Subagent tokens for T-287: executor ~221K, phase 1 ~58K, phase 2 ~244K — ~520K per small card before the seat's own context. T-280's fresh verifier alone: ~310K. The standing read every seat is ordered to make (CLAUDE.md: STATE, ROADMAP, ARCHITECTURE, CONVENTIONS, CAPABILITIES): 242,673 bytes ≈ 61K tokens. The build is a fifth to a third of the cycle; the rest is ceremony and waiting. Nothing measures cycle time; no band holds it.

## What was measured — superpowers (obra, pinned b36e082, 2026-08-12)

The research record is docs/research/superpowers-loop-b36e082.md; every figure there carries a file and line. The decisive facts:

- **No fixed floor.** A bounded change takes a chat design, no plan document, no subagents: ~11.5K tokens of skill text in one seat. The full plan path costs ≈ $1 per task, ≈ 150–200K tokens per task, and a whole 10–13 task run takes 31–41 minutes.
- **Standing cost ≈ 1.4K tokens** — a 3.3 KB bootstrap plus 14 skill descriptions; skills load on a description match, never as a list. Shrunk deliberately: "its size is paid for constantly".
- **Nothing enters the controller's context that can leave as a file** — briefs, reports and diffs are files a subagent reads; the implementer returns under 15 lines; the controller never fixes code.
- **One reviewer, two verdicts** (spec compliance, then code quality), merged from two for cost; re-reviews scoped to the fix; a five-round circuit breaker; every model tier named per dispatch.
- **Enforcement: zero.** The only hook event in the repository is session start; no write gate, no fence, no CI. The whole discipline is prose the model is asked to obey, and the reviewer must not re-run the suite. Their cover for a false claim is a table demanding fresh evidence; ours is a blind bench and mutants.

## The reading

Their saving is not fewer seats; it is that ceremony is proportionate to the change. Our floor — three subagents, a hand-run merge ritual, a whole battery and a whole CI run, and a 61K-token standing read — is paid by a one-line change and a guard rewrite alike. Their risk is exactly where we are strong: nothing there stops a write outside the task or a claim without proof. The fence, the blind bench on guard-class work, the method stamp and the docs gate are keepers we keep; what goes is the fixed floor around them.

## The proposed decision (A–G)

- **A — The standing read.** Every seat reads STATE and a one-line description index of the other four; the rest loads on demand by the pack (the context pack already exists for lanes). Target: under 10K tokens standing. *Room + ADR (amends CLAUDE.md's order).*
- **B — Risk tiers and a bounded path.** Guard-class and method cards (hooks, gates, fences, method text, the parser) keep the blind two-phase bench. Every other card gets one verifier at the tip that reads the diff and the executor's drill as inputs — no phase 1, no ground file. An XS in-fence change with a green keeper is a bounded change: the arm dispatches one executor with a chat-sized brief and the integrator's owed set, no bench. *Room + ADR (verifier.md, executor.md, TASK-FORMAT's size field carries the tier).*
- **C — The arm does the merge; the seat rules, never fixes.** A merge verb runs the ritual, the scoped re-drill over the fix diff only, the corrections from the verdict's blocks, the bump and the message; returns to the seat are files and a line count. The seat's hand edits at merges produced two of yesterday's three reds. *Room + ADR; T-281-s10 is its first half.*
- **D — Regenerations off the per-merge path.** The code graph and the behaviour census are regenerated by CI on the pushed tree and checked on demand, not by hand at every merge; a stale reading is a CI red, never a seat's 3 a.m. step. *Room + ADR (amends the integrator's ritual).*
- **E — CI to ten minutes.** Shard the e2e lane, run the owed set CI-side with T-280's derivation, drop the wait for the previous run (each push has its own run keyed by its commit). *Card.*
- **F — A cycle-time and token band.** Card to CI green in minutes and subagent tokens per card, by size, with budgets (S: 60 minutes, 200K tokens), read at every checkpoint like every other band. *Card (health bands).*
- **G — Smaller cards, named tiers per dispatch, bounded waiting.** The triage right-sizes a card to "the smallest unit that carries its own test cycle"; every dispatch names its model tier (an unnamed tier put all 26 of their reviewers on the top model); the arm's waits are bounded and marker-driven. *Cards.*

Kept deliberately: the fence and the write hook; the blind bench for guard-class work; mutants where the property is data; the method stamp; the docs gate as ADR-023's keeper; the records.

## What the room needs

@human — a ruling on A–G, each yes / no / later. A becomes an ADR and a CLAUDE.md change at once; B, C and D become ADRs with their cards; E, F and G are cards for the next triage.

## The proposed process, final form (appended 2026-09-10 at @human's ask: "can we create the final form for the process?")

**Three tiers, chosen by the arm from the card, never by judgment.**

| Tier | Admits | Verification | Budget (F) |
|---|---|---|---|
| Bounded | size XS; every path inside a tracked fence; no guard-class path; no method text; a keeper already pins the property | none beyond the keeper: the executor runs the keeper spec scoped and the push owes its range | 20 min, 80K tokens |
| Standard | S and M with no guard-class path and no method text | one verifier at the tip: reads the diff BEFORE the executor's notes, carries the rubric (each criterion literally, boundaries, data mutants, the security sweep), may assign corrections as committed bodies with MUTANT BLOCKs | 75 min, 250K tokens |
| Guarded | any card touching hooks, gates, fences, the parser, the push/landing/gate scripts or method text; every L | the blind two-phase bench as today: a tool-less attack set from the card, a separate bench at the tip, mutants, sealed inputs | 100 min, 450K tokens |

Guard-class paths are a list in the method, kept by a test; the arm refuses to classify a card whose fence it cannot place.

**The stages, every tier.**

1. **Triage** — a card, right-sized to the smallest unit that carries its own test cycle (G); the arm stamps size and tier.
2. **Dispatch** — the arm cuts the worktree, writes the fence manifest, assembles the brief (the card, the pack of the CONVENTIONS bullets its fence implicates, the commands, the tier), names the model tier, arms the ask watcher. Nobody reads the tree.
3. **Build** — the executor reads the brief and the fenced files, builds, runs the keeper scoped while iterating, runs the owed set once at its final commit, stamps. It returns a file and a line count; an ask is a file.
4. **Verify** — per tier. The verifier's return is a file; the seat reads its verdict line, not its work.
5. **Merge** — the arm: the ritual, the corrections from the verdict's blocks, the re-drill scoped to the fix diff, the method bump when method text moved, the message from the verdict. The seat rules on a conflict or a refusal and never edits code.
6. **Push** — the range's owed set (T-280), the token, the guard; no waiting on the previous run.
7. **CI** — sharded, the owed set, one run per commit, under twelve minutes; the code graph and the behaviour census regenerated and checked here (D).
8. **Record** — the card done; the checkpoint at the sitting; the cycle-time and token bands read (F).

**What every seat reads standing (A):** docs/STATE.md and a one-line description index of ROADMAP, ARCHITECTURE, CONVENTIONS and CAPABILITIES; everything else on demand through the pack. Target under 10K tokens.

**The seat's rights, unchanged and written down:** records, rulings, grants, checkpoints, and text-only fast edits (a README, a wording); never code or method text — those take the bounded lane.

**What stays, by name:** the fence and its write hook; the keeper specs; mutants where the property is data; the owed-set token and the push guard; the landing gate; the docs gate as ADR-023's keeper; the method stamp; records never rewritten.

**The order of landing, one sitting after the rename merge:** A first (CLAUDE.md's order and the index — a text change plus a keeper for the index); then E (CI); then C and D together (the merge verb, T-281-s10's second half); then B (TASK-FORMAT's tier field, the arm's classifier, verifier.md's single-verifier mode — an ADR); then F and G (the bands; right-sizing at triage). Each is measured against the table's budgets at the checkpoint that follows it.

## Two amendments (2026-09-10, on @human's questions)

**Phase 1 stays in the standard tier.** Measured: phase 1 costs about 60K tokens and four minutes of wall clock (T-287: 58K, 263 s), and none of the cycle when the arm spawns it at dispatch beside the build. It does not make phase 2 cheaper in tokens — phase 2's cost is running the attacks — but it is what gives phase 2 its shape and its pre-commitment, the property that keeps a reviewer from verifying what was done instead of what was asked. What the standard tier drops is the seat's hand work around it: the ground file taken by a script (the fenced files' hashes, the census, the spec's body names, the arm's rendered findings), the phase prompts assembled by the arm from the card and the tier. The guarded tier keeps, in addition, the seat's answers to phase 1's further asks, the whole battery when the derivation owes it, and the seat reading the verdict whole. Standard's budget becomes 75 minutes and about 310K tokens.

**Opus 5 for every subagent role by default; the model per role is the user's to set.** The runtime template (method/runtime/supertaskr.yaml) already carries role → model defaults; the arm reads the model for each dispatch from there and names it, never choosing ad hoc and never choosing cheaper by policy. Decision G's clause on model tiers reads that way; the per-tier bands still record which model ran.

## Third amendment (2026-09-10): D reads "regenerated by the arm at the merge, checked in CI"

The saving D was after is the seat's time, not the regeneration's: the census takes about a minute and the graph regeneration with its dogfood pins about three, and both fire only when the diff moved a spec name or a source file under the walk. With the merge in the arm's hands (C) those are its steps, run after the corrections and before the commit, so main never carries a stale reading; CI's `--check` stays as the backstop that reds if the arm's step was skipped. Nothing waits ten minutes to learn it.

## H — the cheap keepers (appended 2026-09-10 on @human's question: what adds a minute or two and removes a class of failure)

Each is a mechanical step with an exit, run by the arm or the executor; each names the failure it removes and the instance this week that paid for it.

1. **The pinned-sentence check at the merge** (seconds): for every changed line under method/ or docs/, grep the specs for the old text; a hit refuses the commit. Removes the paraphrase class — the T-285 clause that broke a lane body.
2. **The forbidden-content scan at the merge** (seconds): the rename keeper's list plus personal names, emails, home paths and secret shapes over the diff. Removes the T-287 comment class and the public-repository leak class before it exists.
3. **The diff-size check per tier** (seconds): an XS card whose diff outgrew XS is bumped to standard before merge, never merged as bounded. Removes the classifier's blind spot on size.
4. **The executor's self-drill as a required report block** (minutes inside the lane, no cycle cost): one mutant per new body, shown red, restored and proved by hash. T-264-s3's executor found its own tautology this way; the verifier re-runs one at random.
5. **The criteria echo at the lane's start** (a minute): the executor restates each criterion as a checklist in its notes before coding, and the verdict must carry a row per criterion with its evidence; the arm refuses a verdict without the table. Removes the misread-criterion and the unexamined-criterion classes.
6. **The preflight on the card before the stamp** (seconds): `brief.mjs --task <id> --preflight` run by the executor and by the verifier on their own prose; an absolute path or a climbing token exits 3 there instead of at the next dispatch. The T-287 bench learned it at its step 7.
7. **The keeper green at the base before dispatch** (one to three minutes): the arm runs the fence's keeper spec at the base and refuses to cut a lane on a red baseline. Removes the wasted-lane class; T-281-s8's flake would have been visible at the next dispatch instead of inside a verifier's whole run.
8. **The secret scan on the merge diff** (seconds): the token lint that CI already runs, run at the merge too, so a credential never reaches a push.
9. **Meters into the bands automatically** (seconds): the executor's and verifier's `## Meters` blocks are read by the arm at the merge and appended to the bands, so F is fed without anyone typing figures.

Together under ten minutes across a lane, none on the cycle's critical path except 7, which is the cost of not starting a lane that cannot land.

## Fourth amendment (2026-09-10): the whole suite still runs somewhere, on a clock

The owed set replaces the whole battery at the bench (standard tier), at the push and in CI. What that gives up is the cross-spec red — a body outside the owed set that reds because of the change — which T-262 made the verifier run whole to catch inside the lane's ceremony after T-264's executor found four by running everything. Under this form the guarded tier still runs whole; the standard and bounded tiers accept the class, and the net is a whole four-suite run at every checkpoint and nightly in CI on main, with a red there filed as a finding against the merge that caused it and fixed forward by a bounded lane. The other real reduction is the seat no longer reading every verdict whole; the arm carries each verdict's findings by class into the bands so the checkpoint still sees the pattern.

## I — the process as settings (appended 2026-09-10 on @human's proposal: a settings menu in the app, a command in the agent apps, and the terminal, each option explaining what it does, how it affects the process and what time and tokens it costs)

**One source of truth, three surfaces.** The runtime template method/runtime/supertaskr.yaml already carries per-project settings (role → model defaults, thresholds). A `process:` section there holds the switches; the arm reads it at dispatch and merge; the CLI (`npx supertaskr settings`), the app's settings screen and the skill's command all render and edit the same file. The explanation text per option lives ONCE, in a schema file beside the template, and the three surfaces render it — the docs gate keeps the schema and the method text agreeing.

**Profiles and switches.** Three profiles — fast (bounded and standard tiers, arm merge, CI owed set), standard (the final form as ruled), guarded-everything (the blind bench on every card, whole suites everywhere) — and about ten switches under them: the standing read (index or whole), phase 1 on the standard tier, the whole-suite net (nightly, per checkpoint, per push), regenerations at the merge or in CI, CI sharding, batching of pushes, the cheap keepers on or off individually, the model per role, the budgets per size. Each switch declares its constraints: what it needs on (the tiers need the fence hook and the owed-set token) and what may not be switched off at all — the keepers that keep a claim honest: the fence, the token and guard, the landing gate, records never rewritten.

**The costs shown are measured, not estimated.** Decision F's bands record cycle time and tokens per size and per tier in the project itself; the menu shows the project's own figures beside each option, with the seat's estimate only until the project has its first readings.

**Difficulty.** The mechanics are modest: a schema, a reader in the arm, three renderers. The work is in the semantics — every switch must be a real branch the arm honours, kept by a body that reds when the switch is ignored — and in keeping the menu small. It lands after the ruling on A–H, since it is those decisions turned into switches: one guard-class card for the schema and the arm (M), one for the CLI (S), one for the app screen (M), one for the skill's command (S). Superpowers has no settings at all; a proportionate process the user chooses, with its costs measured, is a difference worth having.

## The proposed decision, consolidated (2026-09-10, for the ruling)

**1 The tiers.** Bounded (XS, inside a tracked fence, no guard-class path, no method text, a keeper already pins it): one executor, the keeper scoped, no bench; 20 min, 80K tokens. Standard (S and M, no guard-class path, no method text): the executor, phase 1 spawned by the arm beside the build, one verifier at the tip reading the diff before the notes with the rubric and data mutants; 75 min, 310K. Guarded (any card touching hooks, gates, fences, the parser, the push and gate scripts, method text; every L): the blind two-phase bench as today with the seat's ground asks answered by hand and the whole suites; 100 min, 450K. The arm classifies from a guard-class path list kept by a test; a diff that outgrows its size is bumped at merge.

**2 The stages, every tier.** Triage right-sizes and stamps the tier · dispatch cuts the worktree, the fence manifest and the brief with its pack, names the model from the runtime template (Opus 5 per role by default, the user's to change), runs the keeper green at the base · build reads the brief and the fenced files only, self-drills, returns a file · verify per tier, returns a file with a row per criterion · merge by the arm: the ritual, the corrections from the verdict's blocks, the scoped re-drill, the regenerations, the bump when method text moved, the pinned-sentence, forbidden-content, secret and diff-size checks, the message; the seat rules on a refusal and never edits code · push with the range's owed set, batched, no waiting on the previous run · CI sharded and under twelve minutes, one run per push, checking the regenerations · record: the card done, the meters into the bands, the checkpoint at the sitting, the whole suite at every checkpoint and nightly.

**3 What every seat reads standing.** STATE and a one-line index of the other four documents; the pack carries the rest. **The seat's rights:** records, rulings, grants, checkpoints, text-only fast edits; never code or method text.

**4 What stays by name.** The fence and the write hook; the keeper specs; data mutants; the owed-set token and the push guard; the landing gate; the docs gate; the method stamp and its eval gate; records never rewritten.

**5 The settings.** The switches and profiles above live in the runtime template's process section, rendered by the CLI, the app and the skill from one schema, each with its constraints and the project's own measured costs.

**6 Universality.** Every mechanism reads its configuration from the runtime template (the suites and how to run them, the smoke command, the guard-class paths, the bands, the names, the languages); the CLI packages the scripts and hooks (T-244) and the genesis installs them; the v1 acceptance criterion is a project that is not supertaskr, in another language, taken through a whole card by the loop.

**7 The order of landing.** The standing read and the index; CI; the merge verb with the cheap keepers; the tiers as an ADR; the bands and right-sizing; the settings; the universality audit and the second project. Each measured against its budget at the checkpoint that follows it.

## The switch inventory (appended 2026-09-10 on @human's question: "Do we have the process steps settings options recorded somewhere? Our old full scale ceremony as options you can choose") — the input to T-299's schema

Every step of the ceremony as it stood on 2026-09-09, as a switch: its id, what it does, its value under the **old** profile (the full-scale ceremony, kept as the profile `guarded-everything`), its value under the **ruled** profile (`standard`, ADR-024), its measured cost where one exists, and its constraint. The floor — switches that cannot be turned off in any profile — is listed last. The profile `fast` is `standard` with the whole-suite net nightly only, push batching on and the standing read at the index; T-299 may refine the three profiles, never the floor.

| id | what it does | old (guarded-everything) | ruled (standard) | measured cost | constraint |
|---|---|---|---|---|---|
| read.standing | what every seat reads before working | the five governing documents whole (~61K tokens) | STATE + the one-line index (<10K) | ~50K tokens per seat | none |
| dispatch.keeper_at_base | the fence's keeper spec run at the base before a lane is cut | off | on | 1–3 min | none |
| dispatch.model_per_role | the model of every dispatch read from the runtime template | by hand | from the template (Opus 5 default) | — | needs the template's roles section |
| dispatch.ask_watcher | the derived watcher over the live lanes' ask and report files | on | on | — | none |
| build.suites | what the executor runs at its final commit | the suites the fence owes, once (T-279/T-271) | the owed set of its range (T-280) | 5–15 min | needs push.token |
| build.self_drill | one mutant per new body, red, restored, proved, in the report | practised, not required | required block | minutes in the lane | none |
| build.criteria_echo | the criteria restated as a checklist before coding | off | on | 1 min | none |
| build.preflight_before_stamp | the card preflight on the executor's own prose | off | on | seconds | none |
| verify.tier | how a card is verified | guarded for every card | bounded / standard / guarded by the arm's classifier | see the tiers' budgets | needs fence.hook, push.token, the guard-class list |
| verify.phase1 | the tool-less attack set written from the card before the diff | on, spawned by the seat | on for standard and guarded, spawned by the arm; off for bounded | ~60K tokens, 4 min beside the build | none |
| verify.ground | the ground truths at the base phase 2 judges on | taken by the seat by hand | by a script; the seat's further asks only in guarded | 10–15 min of the seat | none |
| verify.sealed_inputs | the attack set and grounds hashed and cited | on | on for standard and guarded | seconds | none |
| verify.separate_bench | phase 2 on a detached worktree at the tip | on | on for standard and guarded | a worktree | none |
| verify.suites | what the verifier runs at the tip | the whole four legs (T-262) | the owed set of the range; whole in guarded | 15–20 min → 5 | needs record.whole_suite_net when not whole |
| verify.mutants | data mutants where the property is data, code mutants for containment | on | on | inside phase 2 | none |
| verify.corrections_as_bodies | a correction is a body the verifier commits plus a MUTANT BLOCK | on | on | — | none |
| verify.reads_notes_last | the diff before the executor's notes | on | on | — | floor for any tier with a verifier |
| merge.by | who runs the ritual | the seat, by hand | the arm (`--merge`); the seat rules only | 15–21 min → ~5 | needs T-295 |
| merge.redrill | the re-drill of the verdict's blocks | every block over the whole spec | scoped to the fix diff | minutes | none |
| merge.regen_graph | the code graph regenerated when a source under the walk moved | at the merge, by the seat | at the merge, by the arm; checked in CI | ~3 min when it fires | none |
| merge.regen_census | the behaviour census regenerated when a spec name moved | at the merge, by the seat | at the merge, by the arm; checked in CI | ~1 min when it fires | none |
| merge.keepers | pinned-sentence, forbidden-content, secret and diff-size checks, the card preflight | off | on | seconds | none |
| merge.meters_to_bands | the reports' meters appended to the bands at the merge | off | on | seconds | needs record.bands |
| merge.message | the merge message | composed by the seat | written from the verdict | — | none |
| push.owed | what a push must have graded | the whole four legs, last | the range's owed set (T-280) | 15 min → 1–5 | floor: push.token |
| push.batching | several merges per push | off (one push per merge) | on | fewer CI runs | needs ci.per_push_runs |
| push.wait_previous_run | the guard refuses a push while a run is in flight | on | off (a red concluded run is announced) | up to 35 min | none |
| ci.owed | what CI runs per push | everything | the owed set of the pushed range | 34 min → ~10 | needs record.whole_suite_net |
| ci.sharding | the e2e lane split across runners by owning spec | off | on | 21 min → ~5 | none |
| ci.regen_check | graph and census currency checked on the runner | on | on | seconds | none |
| record.whole_suite_net | the whole four suites run on a clock | at every push (implicit) | at every checkpoint and nightly in CI | 15 min per run | floor when any suites switch is not whole |
| record.bands | cycle time and tokens per size and tier, with budgets | off | on | seconds | none |
| record.checkpoint | the record and STATE regenerated at a sitting | on | on | 20 min per sitting | floor |

**The floor (no profile turns these off):** the fence and its write hook (`fence.hook`); the card preflight at dispatch; the owed-set token and the push guard (`push.token`); the landing gate; the docs gate; the method stamp and its eval gate when method text moves; records never rewritten; a verifier that reads the diff before the notes whenever a verifier runs.

**Profiles as rows of this table:** `guarded-everything` = the old column exactly; `standard` = the ruled column; `fast` = the ruled column with record.whole_suite_net nightly only, push.batching on. A project's own readings (record.bands) stand beside each row once they exist.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

The owner ruled on 2026-09-12, recording ADR-025, that a Codex child's fence is the sandbox confining writes
to the lane's own git state plus the card's path check by the child before its stamp and by the landing gate
at the merge, accepted on the demonstration in ADR-025's card 3 and not before; Claude children keep the
write-time hook. This supersedes the ruling of the same morning that only Claude sessions write to the
repository, once that demonstration has landed.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

The owner ruled on 2026-09-12 on the order of the settings doors: T-300, the terminal,
lands first as dispatched, with its own small planner; the shared settings reader is then
extracted by an ordinary card; T-300 adopts it in a follow-up; T-301 is built on it. The
expanded contract drafted in the recovery clone, which made T-301 the owner of a shared
interpreter with T-300 waiting behind it, is not adopted. The owner also ruled that the
shared reader lives in lib/parser, the pure browser-safe library the app and the tooling
already import, not in the test tooling and not in a new package.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

The owner ruled on 2026-09-12 that card statuses stay as they are and that each feature
names one user journey, owned by an existing card and run on the integrated tree at feature
acceptance. A feature with every card done and no passing journey is not delivered. Nothing
already merged is reopened by this ruling.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

The owner ruled on 2026-09-12 that the loop gains a standing RULE-REVIEW SITTING. It is
triggered whenever docs/CONVENTIONS.md crosses its ADR-019 warning line, which it has
already done. The sitting opens by declaring its batch and its budget: a prioritized list of the rules
added since the last review and of any rule with a measurable cost, and the seat's time it
may spend; a rule the batch does not reach waits for the next sitting. It asks four questions
of each rule reached: what failed and what it cost; whether the
rule has since prevented or detected anything, on evidence from verdicts, meters and merges;
whether a change to implementation, tooling or scope would solve it before another
instruction; and what evidence would justify keeping, simplifying or retiring it. Each rule
gets one outcome, keep, simplify or retire, recorded with its evidence in the sitting's
checkpoint. Simplify and retire are RECOMMENDATIONS: their implementation follows the existing
authorization and change process, a method requirement is edited only through a card, and a
checkpoint outcome does not itself authorize that edit; a retired rule leaves the rulebook and
its text stays in history; keeping a well-supported rule is an expected outcome. Rules that came from the owner's rulings are
shown to the owner before they are changed. This is an agenda recorded here once, not a new
bullet in the rulebook; a compaction for size is no longer the only response to the warning
line. The first sitting is held after T-303-s1 lands.
