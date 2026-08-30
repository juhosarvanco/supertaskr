---
id: T-168
title: The customization-form decision brief — the industry benchmarked, the config-system and in-app-setup forms analyzed from the ground up, and the choice routed to @human before any UI exists
feature: F-04
milestone: 4
priority: 1
size: M
status: planned
blocked_by: []
touches: [docs/research, docs/rooms]
suggested_by: "@human ruling (2026-08-30, loop-customization sitting): before any UI visual design work, decide the FORM of the customization UX — config system or in-app setup area — well designed and thought from ground up"
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing on @human's ruling, and it GATES every UI card in this
feature.** @human's condition is binding and verbatim in
docs/rooms/loop-customization.md: the whole way of customization is
designed from the ground up, form first, mockups only after the form
is ruled.

## Acceptance criteria

- THE lane SHALL produce an industry benchmark sweep as
  `docs/research/customization-ux-benchmark.md`: how the best
  developer tools actually ship customization — the config-file
  school (dotfiles, `.claude/`-style directories, eslint/prettier
  lineage), the in-app settings school, the hybrid school
  (settings UI that reads and writes the files), and the
  policy-distribution schemes enterprises use (managed settings,
  marketplaces, protected directories). Each entry: what it does
  well, where it breaks, and what it teaches nputer. Sources cited;
  claims about a tool verified against its docs, not memory.
- THE lane SHALL open `docs/rooms/customization-form.md` carrying THE
  DECISION BRIEF: the candidate forms stated fairly (config system /
  in-app setup area / designed hybrid), each analyzed from the ground
  up against (a) the benchmark's lessons, (b) nputer's layering stack
  (the loop-customization room), (c) the three audiences named by
  @human — developers, organizations, enterprises — and (d) nputer's
  own invariants (files-first, auditability, the fence system, D3's
  narrow ruling on app writes). ONE recommendation with its reasoning,
  and the open questions each form would create. The brief ends with
  the decision QUESTIONS for @human, stated so they can be answered
  in one word each.
- THE brief SHALL NOT contain mockups, visual design, or UI layout —
  the ruling forbids them before the form is chosen; naming the
  SURFACES each form implies (what screens or files would exist) is
  in scope, drawing them is not.
- Verification: headless — the docs exist, cite their sources, and
  lint:docs is green. The CLOSER is @human reading the brief; this
  card is done when the brief is routed, not when the form is ruled.

## Fence note at filing

`touches: [docs/research, docs/rooms]` — pure docs, disjoint from
everything queued. The lane has web access for the benchmark; every
external claim carries its source.

## Implementation notes

Lane `task/T-168-form-brief`, worktree `../nputer-T-168`, base
`1d297c9`. The diff is docs-only and is four paths: the two deliverable
documents, these notes, and one suggestion card. No code, no `method/`,
nothing outside the fence.

**What landed.**

1. `docs/research/customization-ux-benchmark.md` — the sweep, organised
   as four schools (config-file, in-app settings, hybrid, enterprise
   policy distribution) with one entry per tool carrying *does well /
   breaks / teaches nputer*, then a cross-cutting section, then the
   sweep's own limits, then lessons L-1…L-12 for the brief to cite.
   Entries: ESLint, Prettier, EditorConfig, git config, Claude Code
   (settings + memory/rules + skills), the Agent Skills standard,
   Cursor rules, Copilot custom instructions, AGENTS.md, VS Code
   (Settings editor, and its enterprise policies), JetBrains IDEs,
   JetBrains IDE Services, Linear, Netlify, Vercel, GitHub (CODEOWNERS
   and rulesets), Terraform, plus Claude Code's managed settings and
   plugin marketplaces.
2. `docs/rooms/customization-form.md` — the brief: the settled facts
   that bind any answer, the three forms each analysed against the
   benchmark, the layering stack, the three audiences and the
   invariants, ONE recommendation with its reasoning, the strongest
   counter-argument with the measurement that would settle it, the open
   questions per form, and nine one-word decision questions for @human.

**The finding that most shaped the brief.** Reading D3 against the four
layers of the stack produces a price list rather than a preference: the
app is forbidden `method/` and `docs/CONVENTIONS.md` outright, and
`.claude/skills/` and a `review:`-class card field are UNADDRESSED
(D3 grants `builder:`/`verifier:`/`status:` by name). So an in-app
surface that WRITES the rules reaches none of the four layers without a
new ruling. The brief states that as the price of form (b) rather than
designing around it, and Q2/Q3/Q4 are the questions it raises.

**Recommendation:** the designed hybrid in its ASYMMETRIC shape — files
are the customization system; the app reads, explains, proposes and
routes, and never authors a rule. Its disk layout is identical to the
pure config system's, so choosing it does not forgo form (a); it makes
form (a) the substrate.

**Verification claims are honest about their kind.** Every external
claim in the benchmark carries the URL it was read from, and where a
vendor's docs are silent the file records NOT FOUND rather than filling
the gap (VS Code never states in one sentence that the Settings editor
writes `settings.json`; JetBrains publishes no affirmative share-list
for `.idea`; Copilot has no enterprise instruction tier this sweep
could find; GitHub ruleset EXPORT was verified only on the
enterprise-cloud doc variant). The two precedence claims the brief
leans hardest on — Copilot's and Cursor's — were re-fetched directly
rather than left on a delegated reading. The sweep's own limits are a
named section: documentation only, no hands-on use, no usability
evidence, no source reading, a vendor set chosen to teach this decision
rather than by any sampling frame, one reading on one day.

**Two disclosures on the criteria.**

- The acceptance criterion says the brief ENDS with the decision
  questions. It ends with the questions and then a short
  `RESOLUTION:` footer, which is the room-format status line every open
  room in `docs/rooms/` carries (`method/rooms/ROOM-FORMAT.md`). The
  questions are the last substantive section.
- No mockups, no layout, no visual design. Surfaces are NAMED where a
  form implies them (a customization lens, an org-packs view, a stage-0
  interview question, a brief provenance row, an import card; on disk
  `.claude/skills/<name>/SKILL.md`, a project law section, card
  fields). None is drawn or styled.

**Gates, exits read unpiped.**

- `npm run lint:docs` from `tools/e2e/` — **exit 0**.
- DOCS GATE, diff half, executor's pair of the RANGE RULE
  (`TREE=$(git merge-tree --write-tree main HEAD)` then
  `docs-gate.mjs $(git diff --name-only main "$TREE")`, run from the
  repository root) — **exit 1, a verdict**, run TWICE because the
  answer moved when the diff did. On the docs-only diff it owed ONE
  command (`npm test` from `tools/e2e/`, both files reached through
  `shell-frame.spec.ts` and `window-contract.spec.ts`). Once this
  card's notes and `T-168-s1` joined the diff, **four paths** under
  `docs/` are code inputs and the owed set is THREE commands:
  `npm test` from `app/`, `npm test` from `tools/e2e/`, and
  `npx vitest run` from `lib/parser/`. Asking the gate again after the
  diff grew is the whole point of asking it rather than predicting it.
  **NOTE THE LEFT ENDPOINT: `main` is not this lane's base.** Main
  moved three commits past `1d297c9` while the lane ran (the dispatch
  stamps plus two filings), so a plain `main..HEAD` reports six paths
  and hands this lane main's own work in reverse. The merge-tree form
  reports the four that are actually this lane's — the RANGE RULE
  earning its keep on a live tree.
- `npx vitest run` from `lib/parser/` — **exit 0**, 315 passed.
- `npm test` from `app/` — **exit 0**, 1015 passed.
- `npm test` from `tools/e2e/` — **318 passed, 2 failed**, and NEITHER
  failure is a function of this diff. Both are
  `tools/e2e/tests/session-economics.spec.ts` (`:73` and `:247`), both
  spawn `brief.mjs --task T-157` and assert exit 0, and the assembler
  correctly exits 1 because the LIVE lane T-156-s1 holds
  `docs/checkpoints/`, which T-157's card also claims. Read in the
  source rather than guessed: `dispatch-brief.mjs` builds the fence set
  it tests from `ctx.lanes`, one per LIVE worktree, so the comparison
  is live-lane-versus-card. Confirmed by this tree — at this lane's
  base the T-156-s1 card still reads `status: planned`, so no
  status-driven check could have produced the finding, while
  `git worktree list --porcelain` showed T-156-s1, T-167 and T-168
  live. Measured unpiped in this worktree: `brief.mjs --task T-157`
  exits **1** (fence held) and `brief.mjs --task T-164` exits **0**
  (fence `bin`, held by nobody) — the command is refusing correctly,
  and two bodies read the correct refusal as a failure.
  **The lane could not fix it: `tools/e2e` is outside this fence.** It
  is filed as `T-168-s1` with the measurement attached.
  RUN TWICE, because the first run predated the card files: against the
  FINAL tree the suite answers **exit 1 unpiped, 318 passed, the same
  two bodies**, with the sibling lane still live and
  `brief.mjs --task T-157` still exiting 1 at the moment of the run.
  Same failure, same cause, reproduced — which is what makes it a
  diagnosis rather than a guess.

**Suite-run notes.** A fresh worktree has nothing installed or built,
so the owed suite needed the fresh-clone ORDER in front of it
(lib/parser `npm ci` + `npm run build`, then app `npm install` +
`npm run build`). The chain went into a script file rather than being
pasted, per CONVENTIONS' persisted-cwd hazard. The lane port was
`NPUTER_E2E_PORT=14538`, chosen off the 14520 default because another
lane was running the same suite concurrently, and lsof-read at zero
rows immediately before binding; 1420 was never probed or contacted.

**One standing-hazard note for the next docs lane.** The DOCS GATE owes
`npm test` from `tools/e2e/` to almost any diff under `docs/`, and this
project now dispatches lanes in parallel — so a docs lane can be handed
a red that belongs to a sibling's fence, arriving under a title about
model dials. T-168-s1 carries the shape and the fix options.

**No conflicts encountered.** Nothing in the card, the parent room or
the governing documents contradicted anything else this lane read. The
one tension the lane found is internal to the project and is the
brief's subject: @human's "simple for everyone" clause and D3's narrow
ruling pull in opposite directions, which is why the brief prices form
(b) rather than dismissing it.

**Hooks for whoever picks this up.** The counter-argument names a cheap
measurement nobody has made: COUNT THE SLOTS — the enumerable extension
points across executor, verifier, integrator and testing. If they are
few and prose-valued the recommendation collapses into form (a). That
count should be the next card, and it is small.
