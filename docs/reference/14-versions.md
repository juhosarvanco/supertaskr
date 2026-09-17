# 14 — Versions

Every ruled feature by version, in depth, with the card that carries
it. The ruling is docs/rooms/version-planning.md and the one page that
transcribes it is docs/VERSIONS.md; the charter entries' full text is
docs/research/beyond-the-playbook-charter.md. This chapter describes
each feature as a mechanism; where a chapter above already holds it,
the pointer is the description.

## v1 — the smallest product that makes NORTH_STAR honest

One solo developer runs the whole loop on their own project from their
agent app, with the mirror beside it.

**Shipped (present tense throughout the reference):**

- The method, versioned and eval-gated (F-01; chapters 01, 06, 10).
- The interview in the app's genesis pane, seven questions banked
  incrementally into the governing docs, first cards and a board (F-03;
  chapter 12).
- The board off files: story map, detail panel, lanes off git,
  dispositions with reasons (F-02; chapter 13).
- Dispatch complete: the dispatch view, the brief as a contract, the
  fence at the write, the card preflight, blind verification as a spawn
  property, binding seat assignment, the one-command arm (F-04;
  chapters 04, 05, 07).
- The map's drift slice: architecture and tasks lenses, intent over
  reality, drift, cycles, blast, churn, budget (F-06; chapter 13).
- Skill packs into genesis (charter 01, T-167).
- The launcher (T-164).
- Codex's skill form measured (T-246).
- Ring 2 as it is: card preflight (05), fences and dispatch sets (06),
  proof of teeth (07, the poison drill), blind adversarial verification
  (08), record-first landings (09), merge pre-proof (10, the forecast),
  process vital signs (11, the bands), the metabolism (12), seat
  economics (13).

**Landing at the time of writing:** the dependency-legitimacy gate
(T-247), the injection scan on docs writes (T-248), the secret read
guard (T-249, merged 2026-09-08). The security layer at the write.

**Planned, in priority order:**

- p1 — the seat skill (T-241), the interview skill (T-242), `npx
  Supertaskr` (T-244, size L, needs the human's approval to dispatch).
- p2 — the context pack (T-254: an executor reads the method's
  protocol files plus the brief's quoted overlay, not CONVENTIONS
  whole), the CONVENTIONS compaction (T-255, behind T-254), two
  decision modes (T-257, behind T-253), the commission list as a
  verifier rule (T-258).
- p3 — the app opens on a folder (T-243), the gate taxonomy in
  CONVENTIONS (T-250), the debt-marker limit (T-251: a TODO or FIXME a
  lane adds must cite a card id or the landing is refused), a test
  named per SHALL clause (T-252), the edge and must-not questions with
  the decision list (T-253), `npm install` to `npm ci` in CONVENTIONS
  (T-256), the oracle class and the escalation form (T-259, behind
  T-252), customisation by interview (T-173, size L), the cold-start
  seam's owner (T-175).

**Explicitly not in v1:** the in-app orchestrator conversation and any
in-app spawn path; a Codex spawn adapter inside the app; archaeology;
the non-coder spec studio; everything below.

## v2 — teams and depth

- **02 Stage slots** — named extension points at every stage of the
  loop, so a team plugs a step in without editing the method.
- **04 Environment tiers and rehearsed rollback** — when services
  ship: environments as declared tiers, and a rollback that has been
  run before it is needed.
- **16 Fleet fences** — the fence system across machines
  (docs/rooms/team-enablement.md).
- **21 Competitive execution** — the same card, two models, a blinded
  judge (T-170, parked on its trigger); reviewer instances with
  consensus fold under it.
- **The Ring 2 productization pass** — dashboards and surfaces for the
  preflight, the economics and the bands; a capability registry that
  declares its gates as blocking or advisory (the shape the landing
  gate's limits take); catalogue-generated negatives once the registry
  is complete enough.
- **22 The version table.**
- Added 2026-09-08: plan-checker seat, design-mockup stage, UAT walk,
  browser QA seat, security audit seat; ship, deploy and canary under
  04; the multi-harness installer beyond Claude and Codex; the pocket
  cockpit, calibration scorecards, retro role, spec red team, dry run,
  the sandbox half of enforced touches; a reversibility rating per
  card; a complexity-triggered refactor as a health band; calibrated
  effort estimation with an actuals loop.

## v3+ — the horizon

- **Ring 3:** 14 purpose-drift signal (scope-reduction detection with
  re-injection folds under it), 15 counterfactual policy replay, 17
  compliance for free, 18 the self-confessing eval corpus (the weekly
  regeneration job folds under it), 19 method semver and the method
  marketplace, 20 rooms and standing consultations, 23 the kit is the
  product.
- **Ring 4, the gift registry:** 24 retroactive verification, 25
  session ghosts, 26 counterfactual gardens, 27 dream lanes, 28 intent
  compilation, 29 the proof economy, 30 the method breeder, 31 the
  record as training signal.
- From the parked list: time machine, truth maintenance beyond the
  drift slice, production feedback, synthetic users, explainer.

## Unruled

- **32 The accountability layer** — v3+ by its ring; awaits the human's
  word.

## Already delivered under other names

Per-agent model cost profiles are seat economics plus binding
assignment; cross-session memory is the record under the cold-start
test; PR bodies from the record are record-first landings; the honest
fallback line is T-169; a gate taxonomy with stall detection is the
four types Supertaskr runs; shortcut markers into a debt ledger are the
metabolism; cost telemetry is the `Tokens:` line; enforced touches'
write half is the fence; test-writer independence is the blind
verifier inverted; coverage per requirement is the census.

## From the conventions — the forensics behind the rules (T-290)

The rules themselves live in the chapters under docs/conventions/,
which docs/CONVENTIONS.md indexes. What follows is the history, the
measurements and the argument each of those rules was cut from, moved
here VERBATIM at T-290 under ADR-023 — the records rule forbids a
rewrite, so not a byte of it is re-worded, re-ordered inside an entry,
or summarised. Each entry names the bullet it came out of.

### method/ is the generic, product-agnostic convention

  v0.1.35 (T-344, 2026-09-17) — the OPERATIONAL GRANT STORE release: the active dispatch grant leaves the shipped runtime template for one authoritative store in the designated integration checkout, so an approval costs no code publication and the kit stops carrying this project's authorization into every project it scaffolds; the template keeps the block's DECLARATION and says in its own comment that the occupant moved, that a block left there is read as a stray rather than as authority, and that a reader finding none answers the explicit NO-GRANT state — approval each, recovery none, revision 0 — because no grant is ever created by guessing a person, an instant or a past authorization; process-schema.yaml declares the same typed shape for the store the block now lives in and the coupling to the parser's one reader does not move; the current snapshot and the superseded revisions are separate files so routine startup, admission and display open the snapshot alone, a missing or unreadable snapshot refuses pending explicit recovery rather than reading as a checkout that never held one, the store is pinned to the checkout whose path and host it records and refuses anywhere else by name, and an existing block is carried out of the template VERBATIM by a migration at a named ref so no approval is re-minted in the move.
  v0.1.34 (T-320, 2026-09-14) — the EXPRESS PATH release: from an outcome sentence and a named fence the arm writes a compact XS card (every required field, both standing sections, the sentence verbatim as its EARS criterion), measures its admission through the grant per mode (standing admits; each consumes the per-dispatch approval once; until admits only a derived repair; no grant refuses by name), prints five eligibility findings and refuses an ineligible change by name, runs the executor only under the bounded tier with a receipt keeping requested beside observed that the merge verb's keeper refuses on a mismatch, withdraws the label by a dated append when a check fails, and stamps every instant so the five delivery measurements derive from the record; the orchestrator role file says the seat edits no code under the express label.
  v0.1.33 (T-242, 2026-09-14) — the INTERVIEW SKILL release: one generated, self-contained Claude Code entry (method/skills/supertaskr-interview/SKILL.md) written by a generator in the tree from the canonical banks, decomposition, templates and adapters, installed only by the user's explicit `supertaskr install` (identical a no-op, differing refused without --force, --dry-run honoured), carried in the packaged command's tarball at pack time, closing by opening the existing project in the app; Codex deferred and unverified for this entry.
  v0.1.32 (T-290, 2026-09-14) — the INDEX release: docs/CONVENTIONS.md is the index over eleven chapters under docs/conventions/, read spliced by every reader; the seat pack's host-command-check accepts an index as a command's authority and follows its pointer to the chapter, and the model-free evals plant the chapters beside the index; the release notes live here, in the reference chapter the bump's writer now names.
  v0.1.31 (T-322, 2026-09-14) — the UNATTENDED-OPERATION release: a rejected verdict or a CI red is attributed before anything acts; a repair continues on evidence and parks with a wake condition; the health check is specific to the action; a quota refusal becomes a recorded retry instant (the wait verb gains a wait-until-instant form); a reserved decision becomes a marked question entry the order and the cut read; the return brief (`brief.mjs --since`) derives from the records and the runner's runs; the keep-awake rule lands and the stop list names only the grant's stops.
  v0.1.30 (T-143-s5, 2026-09-14) — the STALENESS-BY-CREATION release: the docs gate's staleness derivation (staleStateRecords, the one helper the docs gate and the push checks consume) compares a checkpoint record against the commit that CREATED it rather than its latest touch, so an append to an already-checkpointed record no longer demands a STATE commit whose only content is a clock; a record created without its STATE regeneration still reds by name, the same-commit tie still passes, the reading stays committed history, and a record git names no creating commit for falls back to its latest touch; docs-protocol.md rule 4 argues the rule once, both halves — the creation obliges, never every later touch, and an amendment that changes a fact or a hazard the state document summarises still updates it, conduct no program keeps.
  v0.1.29 (T-324, 2026-09-14) — the ADMISSION release: every admission the arm makes — the lane cut, a child start, a re-entry or continuation, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; an admission is explicit (a card the grant names) or derived (a repair the recovery policy allows, bound to its parent work and the failure evidence); the three approval modes and the two recovery values are enforced at those boundaries, a pause distinguishes new work from the admitted candidate's verification and integration, optional limits are read and reported as advisory and enforced by nothing, a successor coordinator inherits the grant from the block; the dispatch block's switches become operational in the process schema and the orchestrator's step 5 says a dispatch inside the current grant is approved by the grant.
  v0.1.28 (T-319, 2026-09-14) — the DISPATCH BLOCK release: the runtime template gains an optional dispatch block — the approval mode (each, until a named card, standing), the recovery policy (none, repairs) and the grant that sets them with its revision, order, endpoint, card blobs, optional advisory limits, revocation and history — declared once in the process schema as its own section of sixteen rows, every row labelled declarative because nothing admits or refuses by it until T-324; the parser library's process-settings module reads the block through the pure entry as one typed value validated against the declaration, a named refusal and never a partial value, with the explicit no-grant state (approval each, recovery none, no grant, revision 0) when the block is absent; the settings reference renders the section from the declaration; this project's own template carries no grant.
  v0.1.27 (T-298-s3, 2026-09-14) — the XS release: the size vocabulary gains XS in the parser's legal set and the task format's frontmatter block, preserving S, M and L, so the bounded tier the tier table selects on XS is reachable end to end from a card that lives in the tree; the ceremony table gains an XS row restating the bounded line (executor only, the keeper scoped, the push owing its range), written lightest-first; the lightest ceremony row and the tier table's bounded size are pinned as one invariant read from both documents rather than a typed letter.
  v0.1.26 (T-299-s6, 2026-09-13) — the LABELS release: every process switch carries an implementation label, `operational`, `manual` or `declarative`, with a manual switch's action beside it; an operational label is proved by a body that changes the value and observes the arm behave differently; the terminal shows the label beside the value and refuses to edit a declarative switch with its file unchanged; the reference carries the labels.
  v0.1.25 (T-311-s5, 2026-09-13) — the READERS release: the task format names the criteria heading's depth in words and a body keeps every card to it; the advisory seat reader and the card preflight hold one heading rule, so both answer the same criteria for the same card; the verifier role file spells the verdict entry's one shape with the date first, and the merge verb's newest-verdict reader finds a dated depth-three entry wherever its date sits, a correction block's heading excluded.
  v0.1.24 (T-311, 2026-09-12) — the RUN RECORD release: every child run, native subagent or foreign process, writer or
  read-only participant, runs under a file-backed run record and the same seven operations; a writer reserves its resource exclusively before launch, and an uncertain record is reconciled before any replacement.
  v0.1.23 (T-299, 2026-09-11) — the PROCESS AS SETTINGS release: method/runtime/process-schema.yaml declares every
  switch once (the loop room's inventory and the floor) under three profiles, and the runtime template's process: section names the profile.
  v0.1.22 (T-298, 2026-09-11) — the RIGHT-SIZING release: the triage rule stated once (orchestrator 2), the model per
  role read from the runtime template and printed in the brief (5b), every wait bounded and performed by the arm (5f).
  v0.1.21 (T-296, 2026-09-10) — the THREE TIERS release: bounded, standard and guarded chosen by the arm from
  the card against the guard-class list; phase 1 and phase 2 rendered by the arm; the standard verifier's mode stated once.
  v0.1.20 (T-295, 2026-09-10) — the ARM MERGES release: `brief.mjs --merge <id>` performs the
  integrator's ritual from the verdict and stops with the merge staged; integrator.md states the widening beside the re-drill.
  v0.1.19 (T-307, 2026-09-10) — the PROPOSE-BEFORE-RECORDING release: a room or decision
  entry is shown to the owner verbatim and appended on a yes; entries paraphrase and never quote; an eval holds it.
  v0.1.18 (T-293, 2026-09-10) — the STANDING READ release: a seat reads STATE and a
  generated one-line index of the other four governing documents, nothing else standing (ADR-024).
  v0.1.17 (T-264-s3, 2026-09-10) — the RENAME release: the runtime template is
  supertaskr.yaml, the kit and the launcher spell the product name, no spelling of the old one survives outside a ruling.
  v0.1.16 (T-285, 2026-09-09) — the WAKE FIELD release: a parked card's `wake:`
  condition is machine-read and the dispatch view lists WOKEN cards beside STARTABLE.
  v0.1.15 (T-283, 2026-09-09) — the IN-FENCE FOLLOW-THROUGH release: an executor
  performs an XS finding inside its fence and the verifier grades it.
  v0.1.14 (T-281, 2026-09-09) — the MUTANT BLOCK release: the verifier commits
  the bodies its corrections assign and the merge re-drills them.
  v0.1.13 (T-279, 2026-09-09) — the ONE GRADED RUN release: a lane runs its
  owed suites once, at its final code-and-notes commit; the stamp is exempt.
  v0.1.12 (T-254, 2026-09-09) — the CONTEXT PACK release: the seats read
  the brief's pack, not CONVENTIONS whole; itemised on T-254's card.
  v0.1.11 (T-241, 2026-09-09) — the SEAT release: the architect's hand
  work ships as a skill pack the kit carries; itemised on T-241's card.
  v0.1.10 (T-265, 2026-09-08) — the RENAME release: the kit, its
  adapters and its templates carry the product's ruled name (ADR-022);
  itemised on T-265's card.
  v0.1.9 (T-229, 2026-09-02) — the CONTROL release: a positive control
  is demonstrated failing, not asserted; itemised on T-229's card.
  v0.1.8 (T-159, 2026-08-30) — the METABOLISM release: one bump owning
  every method-text change ADR-020 and its reviews earned, plus the
  parked riders whose resurfacing condition named it; itemised on
  T-159's card and in docs/checkpoints/2026-08-30-T-159.md.
  v0.1.7 (ADR-019, 2026-08-27) — method/docs-protocol.md added, the
  three-tier governing-docs contract; itemised in
  docs/checkpoints/2026-08-27-adr019-compaction.md.
