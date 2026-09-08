# Competitive map — August 2026

LANDED 2026-08-30 on @human's M1 ruling (with M2's Ring 1.5 adopted):
the 2026-08-25 "Four missing competitors" addendum folded in with its
⚠ claims re-verified same-day against vendor pages (verification
record: docs/business/competitors-merge-proposal.md; the pre-merge map
at `git log -- docs/research/competitors.md`). Proposed by the
marketing session, landed by the engineering seat.

Five rings, closest first. Vendor claims carry their read-date; this
space churns monthly — re-verify before any launch material.

## Ring 0 — the platforms (don't fight; float)

Claude Code Desktop / Agent Teams, Cursor background agents, Codex
app. "The official route" is now a named alternative in every
comparison. Stay file-based and model-agnostic so their improvements
lower our dispatch cost instead of obsoleting us.

## Ring 1 — orchestration boards (vs the dashboard)

The crowded, unstable ring. All kanban-shaped; all start AFTER someone
else decided what the tasks are.

- **Conductor** — closed-source macOS app; Claude Code + Codex in
  isolated workspaces, diff review, merge/PR flow. Polished, narrow.
- **Vibe Kanban** — open-source agent board; highest stars in the
  category (~27.5k) — and its company (bloop) shut down Apr 2026;
  community-maintained, commits stale.
- **Nimbalyst** — open-source visual workspace, Claude Code + Codex
  side by side, per-session transcripts/cards/worktrees, mobile review.
  Aggressive content marketing; free, monetize-collaboration-later.
- **Claude Squad** — terminal TUI; tmux + worktree per agent.
- **AgentsRoom** — 7 providers, mid-conversation model switching,
  mobile.
- **Munder Difflin** — "hive": shared memory, inter-agent messaging,
  GOD orchestrator. The closest thing to rooms anywhere.
- Also: Crystal, Superset, Sculptor (container isolation), Paperclip,
  CodeAgentSwarm, Gastown (scale), Antfarm + OpenClaw (overnight runs).

**Category mortality:** the two highest-starred tools died or went
dormant in 2026 WITH traction. Third-party workflow layers between the
user and the agent vendors are structurally fragile.

## Ring 1.5 — the trackers that grew agents (added 2026-08-25 addendum)

Established work-management products with a delegation protocol bolted
on. They arrive with distribution nobody in Ring 1 has, they annex
Ring 3 from above (AI PM, triage, PRD drafting, code planning from a
work item), and they are becoming the surface Ring 0's platforms
integrate INTO rather than compete with. **None of them returns a
binding verdict. That is the whole opening.**

- **Linear** — "The product development system for teams and agents."
  The best product here and the clearest declined opportunity.
  AgentSession protocol: six states, typed activities, 5s/10s
  response rules (linear.app/developers/agent-interaction,
  2026-08-30). Their stated non-goals, all still live 2026-08-30
  (linear.app/now/our-approach-to-building-the-agent-interaction-sdk):
  issues assign only to humans, agents are delegated to; "an agent
  cannot be held accountable"; agents must disclose they are agents.
  No acceptance criteria, no verifier role, no rejection path anywhere
  in the agent docs. **Linear Agent (AI PM + triage + backlog
  grooming) is SHIPPED and included from the Free tier**
  (linear.app/pricing, 2026-08-30). Pricing: Free $0 (250 issues, 2
  teams, agent platform included), Basic $10/user/mo, Business
  $16/user/mo (Triage Intelligence, Code Intelligence, Loops),
  Enterprise custom; coding sessions and Loops consume AI credits.
  The threat is distribution and the SDK network effect — not
  verification, which they declined in writing.
- **Jira / Rovo Dev (Atlassian)** — the only competitor contesting
  the differentiator; reaches into Ring 2. Agents in Jira GA May 2026;
  work assigns to "Claude, Cursor, Codex, GitHub Copilot, or the
  native Jira Coding Agent". Rovo Dev's four pillars: code planning,
  generation, review, automation; runs in Bitbucket Cloud, GitHub, a
  repo-aware local CLI, VS Code (atlassian.com/software/rovo-dev,
  2026-08-30). **The claim that matters, verified in the product docs
  2026-08-30** (support.atlassian.com/rovo/docs/check-acceptance-
  criteria-in-a-code-review/): Rovo Dev checks PR code against
  criteria found in the linked work item's summary/description/custom
  fields and reports each criterion **met / missing from the code /
  needs manual checking** — per-criterion and tri-state, more than a
  vibe. What it is NOT: binding. No blocking, no rejection path, no
  merge stop documented; discovery is brittle (work-item key in branch
  name or commit messages; skips entirely on an empty description
  field); paid Rovo Dev Standard plan only. Three distinctions
  survive: (1) not adversarial — same vendor plans, builds, and
  reviews, where our verifier is a different model denied the
  builder's reasoning; (2) criteria are prose fields — ours are SHALL
  clauses mapping to tests (1,435 across 136 cards at b505fca); (3)
  no verdict — it speeds the pipe, it is not a gate. Atlassian is the
  competitor to watch, and their one-vendor structure makes an
  adversarial second reader awkward for them to add.
- **Plane** — "AI-native project management." Contests our identity,
  not our differentiator. AGPL-3.0, 58,548 stars (github API,
  2026-08-30), cloud / self-hosted / air-gapped. Agents assignable
  and @mentionable, MCP server, Claude marketplace integration.
  Pricing (plane.so/pricing, 2026-08-30): Free $0 capped at 12 users,
  Pro $6/seat/mo, Business $13/seat/mo, Enterprise Grid custom — **AI
  metered as credits on every tier including free** (500/1,000/2,000
  per seat per month). Still a database (work items in Postgres — an
  agent needs an API round trip where ours runs `cat`), and squarely
  in the inference billing path NORTH_STAR forbids us. But it owns
  the data-ownership argument with a license we don't have — which is
  why ownership is now a supporting clause, not the lead. Open item:
  community-edition feature gating is still unstated on the pricing
  page (checked 2026-08-30).

## Ring 2 — spec-method layer (vs the convention)

- **agentplane** — the nearest architectural neighbour nputer has
  anywhere (github.com/basilisk-labs/agentplane; MIT, 76 stars,
  pushed 2026-08-30). "Git-native workflow control for coding agents:
  approved plans, verification, and reviewable evidence." Repo-local
  task files, machine-readable Agent Change Records (acr.json), git as
  "the durable review surface". Where it stops short: no adversarial
  verifier — the CLI observes and records rather than commissioning a
  second reader; recovery returns control to a human, not another
  model; acceptance criteria are not first-class. Do not dismiss on
  star count: an independent team converging on repo-local task files
  is evidence the thesis is right — and proof the architecture alone
  is not a moat. The moat has to be the verifier.
- **GitHub Spec Kit** — open, agent-agnostic SDD standard-bearer;
  constitution.md; 30+ agents. The convention's closest cousin.
- **AWS Kiro** — spec-first IDE; EARS-native; SMT contradiction
  checking on requirements.
- **Intent (Augment)** — living spec → coordinator/specialist/verifier
  → worktrees → managed merges, as a macOS product.
- Also: BMAD, cc-sdd, OpenSpec.

Discipline without the planning interview, the rooms, or true
multi-model session control.

## Ring 2 — addendum 2026-09-08: the skills frameworks and the agent apps (T-245)

The August map missed the largest projects in the category. Read
2026-09-08 through the GitHub API (`gh api repos/<owner>/<repo> --jq
'.stargazers_count'`) and each project's own agent prompts, hooks and
workflow files — not its README alone. Every "where it stops" below is
a reading of a named file.

- **Superpowers** (obra/superpowers; Jesse Vincent, Prime Radiant; MIT;
  282,947 stars; created 2025-10-09; pushed 2026-09-04). Auto-triggering
  skills: brainstorm → worktree → plan (2–5 minute tasks with exact
  paths) → fresh implementer subagent per task → task review → TDD →
  final whole-branch review → finish. On the official Claude and Codex
  plugin marketplaces; 14 harnesses; commercial support. **Where it
  stops:** the task reviewer (`task-reviewer-prompt.md`) READS the
  implementer's report and is told "Do Not Trust the Report" — an
  instruction, not a denial; the reviewer's model is chosen per role
  inside the same harness — not a different vendor by construction; the
  verdict binds only the orchestrator's own loop (up to five fix rounds),
  nothing refuses a merge; and the ledger, briefs and reports live in a
  plan workspace the skill DELETES once the final review is clean
  (`subagent-driven-development/SKILL.md`) — no verdict survives in the
  repo.
- **GSD Core** (open-gsd/gsd-core; community, ex-TÂCHES; MIT; 9,217
  stars on the new repo, the archived gsd-build original at 64,580;
  created 2026-05-22; pushed 2026-09-08; `npx @opengsd/gsd-core`; 14
  runtimes). **The closest thing to nputer anywhere, closer than
  agentplane.** `.planning/` committed to git with PROJECT, REQUIREMENTS
  (REQ-IDs), ROADMAP and STATE.md; discuss → CONTEXT.md; plan with a
  researcher, a planner and a plan-checker (a revision gate with stall
  detection, three iterations); execute in dependency waves of
  fresh-context executors, one commit per task, worktree isolation
  HARD-BLOCKED by a PreToolUse hook when it was promised
  (`hooks/gsd-agent-isolation-guard.js`); verify; ship. **Its verifier
  is adversarial** (`agents/gsd-verifier.md`: "Do NOT trust SUMMARY.md
  claims … FORCE stance: assume the phase goal was not achieved …
  falsify the SUMMARY.md narrative"), goal-backward, runs probes in its
  own process, and classifies BLOCKER / WARNING into a committed
  VERIFICATION.md with recorded overrides. **Its ship step is binding**
  (`workflows/ship.md` preflight: "Only `passed` may ship"; any other
  status blocks with PHASE_VERIFICATION_INCOMPLETE; capability gates
  declared `blocking: true` HALT the ship). Per-phase-type model tiers
  (`models.verification`), multiple reviewer instances across Codex,
  Gemini, OpenCode and Ollama with consensus (`/gsd-review`), and
  `cross_ai_execution` to hand execution to another CLI. Also a security
  layer nputer lacks: a package-legitimacy gate, a prompt-injection
  scanner on `.planning/` writes, a secret read guard. **Where it
  stops:** the verifier is NOT denied the builder's notes — it reads
  SUMMARY.md, PLAN.md and CONTEXT.md and is instructed to distrust them
  (nputer's phase 1 is tool-less and writes its attack set before it may
  read anything of the builder's — a property of the spawn, T-205); the
  verifier's model is Sonnet in every default profile
  (CONFIGURATION.md's tier table), the same vendor and tier as the
  executor — a different vendor is a configuration, not the design; the
  binding lives in the ship WORKFLOW, a prose file running shell
  queries — `git push` outside `/gsd-ship` is not refused, where
  nputer's guard refuses the push itself; plans NAME the files they
  touch and worktrees isolate executors, but nothing proves two plans
  disjoint or refuses a write outside the plan — the fence is
  planner-asserted; and there is no derivation-stamped figure, no doc
  budget, no health band over the method's own metrics, no killed
  mutant behind a guard.
- **gstack** (garrytan/gstack; Garry Tan, YC; MIT; 132,009 stars;
  created 2026-03-11; pushed 2026-09-07; git clone into skills; 10
  agents). 23 role skills: office hours (six forcing questions), CEO,
  eng, design and DX reviews, `/autoplan` chaining them, `/review`,
  `/qa` in a real browser, `/cso` (OWASP + STRIDE), `/ship`,
  `/land-and-deploy`, `/canary`, `/retro`, `/learn` (cross-session
  memory), `/freeze` (a one-directory edit lock). **Its review uses an
  outside model by default**: `review/sections/adversarial.md` runs
  "adversarial review from both Claude and Codex" on every diff, probes
  the Codex CLI, and when Codex is absent says so in one honest line
  ("same model family — not an outside model"). **Where it stops:** the
  review is advisory — the simplification lens "never blocks", and
  `ship/SKILL.md` gates on tests and opens the PR without reading any
  review result; the reviewers read the diff in the same session's
  context, nothing is denied; the record is a decision log and
  telemetry, not a per-change verdict file in the repo; the edit lock is
  manual and per directory, not derived from the work.
- **defract** (defract.dev; a desktop app, macOS and Windows, open beta,
  local-first, bring-your-own Claude; read from the product site only —
  no repository). Story → HTML mockups approved before code →
  architecture → parallel Claude Code agents in worktrees → review →
  release; pitches itself as "the app instead of a skills stack". Where
  it stops, as far as a marketing site shows: no verdict, no fence beyond
  the worktree, no governing docs from an interview, no architecture
  map; Codex, Gemini and opencode "planned for v1".
- **PlanWright** (planwright.tools; GitHub org created 2026-05-30, 7
  stars). "A control plane that accelerates AI agent workflows by
  automating planning and acceptance", signed decisions, SOC 2-ready
  audit trail, Free / Team $15 / Business $39 per seat per month. A
  hosted service in nputer's category; read from the site only.
- **npm `superplan`** (published 2026-05-12, v0.0.4): "Superplan contract
  compiler plus local mission-control board for Claude Code and Codex
  workers." Small, but the name and the shape are ours.
- Also seen: pi-gsd (fulgidus; a port of GSD 1.30 to the pi agent with a
  WXP preprocessor that runs setup shell in the harness so the model
  makes zero bash round-trips — 51 stars), buildomator (a GSD
  descendant with drift detection), the wshobson/agents marketplace.

**What this ring establishes.** Three projects with two to thirty times
the stars nputer will see this year have converged on nputer's SHAPE —
file-based state under a `.planning/` or `.superpowers` directory,
fresh-context seats, plans that name files and criteria, non-overlapping
waves, a STATE.md and a ROADMAP.md by those names, a verifier with an
adversarial stance. The architecture is not a moat; the map said so
about agentplane and it is truer now. See conclusion 6.

## Ring 3 — planning end (vs the interview)

- **ChatPRD** — the existence proof: solo-founder side project by a
  sitting CPO, >100k PMs, >750k documents, $15/mo. Value = encoded
  practitioner craft. Writing/coaching tool only — the document ends
  where our pipeline begins.
- **Figr** — grounded PRDs (ingests live product context first);
  the market is splitting generic vs grounded.
- Also: IdeaPlan, Kuse, Rezonant.

Planning that never touches execution — but the ring is being annexed
from above: Linear Agent does AI PM/triage/grooming, Rovo Dev plans
code from a work item. The standalone-planning window is narrowing.

## Strategic conclusions (revised 2026-08-25/30)

1. **"Nobody spans the rings" is falsified** — Linear runs Intake →
   Plan → Agents → Coding Sessions → Diffs; Jira runs work item →
   plan → generation → review. The integration is no longer, by
   itself, the product. The defensible ground is **the narrowed
   claim**, a conjunction where every clause excludes somebody:
   *a DIFFERENT MODEL, given only the criteria and the diff and
   DENIED the builder's reasoning, returns a BINDING verdict that
   stops the merge — and the whole exchange is A FILE IN YOUR REPO.*
   (different model → excludes Rovo Dev; denied reasoning → excludes
   everyone, nobody has named the problem; binding → excludes Linear,
   Jira, Plane — all advisory; file in repo → excludes Linear, Jira.)
   agentplane is the only project in the same room, and it hands
   control to a human, not a second model. And only we have evidence
   it catches anything: at b505fca, 66 tasks APPROVED, 18 distinct
   tasks REJECTED at least once first — a 27% first-pass rejection
   rate, none of the notable catches a failing test (derivations in
   the 2026-08-25 addendum, re-runnable).
2. **"Nobody has our furniture" — weakened but standing.** Story map,
   file-backed rooms with debate protocol + resolutions, succession
   guarantee, provenance stamps: still unmatched. But agentplane has
   repo-local task files with machine-readable records; the gap is
   narrower than "nobody".
3. **The graveyard pitch demotes to supporting clause.** Against an
   AGPL project with 58k stars and an air-gapped edition, "markdown
   in your repo, we can vanish and you lose nothing" is an argument
   Plane can substantially also make. Lead with the verdict.
4. **Money is contested at both ends.** Ring 3 annexed from above
   (Linear Agent, Rovo Dev planning); Plane at $6/seat undercuts the
   $15–20/mo individual ceiling. The steal-list pricing norm stands,
   with margins thinner than first mapped.
5. **The channel move: don't be a fourth tracker — be the agent all
   three delegate to.** Linear, Jira, and Plane each ship an agent
   protocol we can register against (AgentSession; Agents in Jira;
   @mentionable agents). One integration surface, three
   distributions, returning the one artifact none of them can
   produce: a reproducible REJECTED. Their protocols supply the
   mapping — Linear's `elicitation` is a room, `response` is a
   verdict, `error` is a rejection.

6. **(2026-09-08, T-245) The narrowed claim, re-checked clause by
   clause against the skills frameworks.** Read from each project's
   agent prompts, hooks and workflow files, not from READMEs:

   | clause | Superpowers | GSD Core | gstack | defract |
   |---|---|---|---|---|
   | a DIFFERENT MODEL verifies | no — per-role choice inside one harness | by configuration; default Sonnet on Sonnet | **yes** — Codex pass by default, honest fallback | no verifier |
   | DENIED the builder's reasoning | no — reads the report, told not to trust it | no — reads SUMMARY.md, told to falsify it | no — same session context | no |
   | a BINDING verdict stops the merge | in the orchestrator's loop only | **yes at ship** — `/gsd-ship` refuses unless `passed`; blocking capability gates halt; the raw `git push` is not refused; and see the open item below — on Claude Code's autonomous path the verify step itself can be SKIPPED before ship ever asks | no — advisory | no |
   | the exchange is A FILE IN YOUR REPO | no — the workspace is deleted when clean | **yes** — VERIFICATION.md under `.planning/` | partly — a decision log, no verdict file | no |

   The claim survives, and every clause still excludes somebody — but
   **GSD Core is excluded by ONE clause**, denied-by-construction, and by
   DEGREE on two others (a binding enforced by a workflow file versus a
   push guard; a different vendor as a config versus the design). What
   nobody in the ring has: blindness as a property of the spawn (T-205),
   a fence derived from the card, proved disjoint per pair and refused
   at the write (T-154, T-216-s4), a record that keeps itself honest
   (derivation-stamped figures, byte-budgeted docs, health bands over
   the method, a killed mutant behind every guard, the metabolism), the
   architecture map with drift as a finding, and an interview that
   produces the governing docs under a cold-start test. **Two supporting
   moves are falsified**: "no competitor knows what files an issue
   touches" — GSD's PLAN.md names them and its hook hard-blocks an
   unisolated executor; and "the board is not the product; the verdict
   is" — GSD has a verdict now, so the verdict's CONSTRUCTION is the
   product. The honest distinction to write everywhere: theirs is an
   instruction ("do not trust"), ours is a mechanism (cannot read). That
   is a sentence they can close in one release, and the rejection corpus
   and the record discipline are the parts they cannot copy in one.
   Distribution is theirs by two orders of magnitude; ADR-021's form (a
   skill, a CLI, a mirror) is the only channel in which the comparison
   is even made.

Supporting moves: make the rejection corpus the moat (repo-specific,
compounding, invisible to hosted trackers); sell the fence as safe
parallelism ([FALSIFIED 2026-09-08, conclusion 6: GSD's plans name their
files; what no competitor has is the fence PROVED disjoint and REFUSED
at the write]); win on
time-to-first-dispatch (30 minutes from idea to a fenced,
criteria-bearing board — a claim that only counts once the timed
genesis run exists, which makes it the highest-value unbuilt thing on
the board); keep the inference-billing non-goal loud (all three Ring
1.5 vendors meter AI — it was a principle, it is now a price
comparison).

## Steal list — lessons worth adopting

**Mechanics**
- Slash-command ergonomics (Spec Kit): ship the convention as
  /nputer-plan, /nputer-checkpoint etc., one-line install.
- Deterministic spec-checking (Kiro): solvers/linting over EARS lines.
- Container isolation (Sculptor): the path for enforced-touches
  sandboxing.
- Conditional context packs (BB-Skills): progressive disclosure for
  CONVENTIONS.md as it grows.
- Typed agent-session states (Linear): six named states with
  automatic transitions — the shape of a protocol we may want to
  speak.
- Machine-readable change record (agentplane's acr.json): they emit
  it deliberately, we derive it from git — worth deciding which is
  right.
- Air-gapped edition as a first-class SKU (Plane): offline/regulated
  deployment is a paid segment, not a hobbyist preference.

**UX**
- Review is the product surface (Conductor): verdict + diff review UX
  deserves the same design love as the story map.
- Mobile review ships early (Nimbalyst).
- Terminal-forever (Claude Squad): the dashboard is the reward, never
  the requirement.
- Session history as the review surface (Jira): "see the actions your
  agents took… catch drift early" — more legible to a non-author than
  our verdict + lane record; worth stealing the legibility.

**Business**
- Founder-credibility moat (ChatPRD): the interview tuned by a real
  facilitator, built in public under Juho's name.
- Comparison-page SEO (Nimbalyst): honest "X vs Y" content is a
  one-person distribution engine.
- Pricing norm: free single-user core, charge for collaboration;
  ~$15–20/mo individual ceiling — under visible pressure from Plane
  at $6/seat.
- Never sit in the inference billing path: ride the user's existing
  agent subscriptions/keys.

**Added 2026-09-08 from the skills frameworks (T-245) — each a
candidate in docs/VERSIONS.md's UNRULED section, never a card by itself**
- A quick path below the loop's threshold (`/gsd-quick`): the tripwire
  "ceremony heavier than value" has a shape here.
- Skills that fire without a slash command (Superpowers): the seat skill
  (T-241) should trigger on intent, not only on `/`.
- A plan-checker as a revision gate with stall detection and an
  iteration cap (GSD `references/gates.md`): four gate types named —
  pre-flight, revision, escalation, abort — a taxonomy our gates lack.
- A capability registry that DECLARES its gates (`blocking`, `onError:
  halt|skip`, `produces`/`consumes`) and a `render-hooks` query
  workflows call instead of branching on config (GSD): the shape our
  landing gate's limits could take.
- Reviewer instances and consensus (GSD `review.reviewer_instances`):
  one adapter, several reviewer identities with different models — the
  competitive-execution idea applied to verification.
- The honest fallback line (gstack): when the outside model is missing,
  SAY "same model family — not an outside model" — the built_by /
  verified_by mismatch flag (T-169) in one sentence.
- A UAT walk with severity inferred from the human's words (GSD
  verify-work); deviations and deferred-items tracked by the executor.
- Security layers at the write: package-legitimacy gate, prompt-injection
  scan on planning files, secret read guard (GSD `hooks/`).
- Per-phase-type model tiers and an `adaptive` profile (GSD): seat
  economics as a routing table the user edits.
- Shortcut markers harvested into a debt ledger by the retro (gstack
  `gstack-shortcut(dec-<id>)`).
- Setup with zero model round-trips (pi-gsd's WXP): the brief assembler
  already does this; the lesson is to keep every ritual step out of the
  model's hands.
- **An MCP transport onto the CLI and the board** (GSD's `gsd-mcp-server`
  over its `command` and `state` interface points; read 2026-09-08): Claude
  Code and Codex both speak MCP, so one server exposing `npx nputer`'s
  verbs and the parsed board would let ANY MCP-capable app drive the loop
  without a per-vendor skill format — the vendor-neutral answer to
  ADR-021 Addendum 1, and a candidate surface for T-241/T-244/T-246 to
  weigh against skills. A host-integration interface with declared
  axes and a version handshake is the same idea at engine scale; not
  for v1.
- A skipped gate that is loud, never silent, when a capability fails to
  load (GSD's overlay model, #2009): parity with the checkpoint
  template's rule — worth citing when the claim is made that the record
  discipline is ours alone; the discipline of gates is shared, the
  discipline of RECORDS is not.

**Negative lesson, 2026-09-08:** an adversarial INSTRUCTION is one
release away for anyone; only a MECHANISM (the verifier cannot read what
it is denied) is a claim. Never let a nputer sentence rest on "told to".

**Negative lessons**
- Any cloud-dependent component is a death vector (Vibe Kanban).
- Stars are not retention: instrument completed real projects.
- The middle of the workflow demos well and gets absorbed; the
  beginning is the defensible ground.
- Do not build a fourth tracker: three well-funded ones have agent
  protocols. The board is not the product; the verdict is.
- A stated non-goal is a durable moat only for the company that
  stated it: Linear declined accountability, Atlassian did not.
  Never generalise one competitor's restraint into a category-wide
  gap.

## Open items

- The room question (@human's M4): if incumbents span the rings, is
  the integration still the product — or is adversarial verification
  the product, with the board as its delivery vehicle? Contradicts
  conclusion 1 of the previous map; NORTH_STAR routes that to a room.
- Plane community-edition feature gating: unstated on vendor pages as
  of 2026-08-30; re-check before any pricing-comparison material.
- Rovo Dev verdict-lessness: re-verify before every launch material —
  Atlassian adding a blocking mode is the single likeliest change to
  invalidate the narrowed claim's "binding" clause.
- agentplane trajectory: 76 stars 2026-08-30; same thesis, watch it.
- GSD Core trajectory (2026-09-08: 9,217 stars, pushed daily): the one
  project whose next release could close the "denied" clause; re-read
  `agents/gsd-verifier.md` and `workflows/ship.md` before every launch
  material.
- **GSD Core's verifier can be silently dropped on Claude Code** — their
  own words (docs/explanation/claude-orchestration-capability.md, read
  2026-09-08, identical on `main` and `next`): backgrounded agents on
  Claude Code cannot nest subagents, so "the autonomous loop therefore
  falls back to inline sequential execution — and with it silently
  drops wave parallelism, the plan-checker, and the verifier — on the
  one runtime most GSD users run." The fix is a default-off BETA
  capability gated on Agent SDK ≥ 0.3.149. Until it is on by default,
  "binding at ship" gates a verification that may never have run.
  nputer's verifier is a property of the spawn (T-205) and the landing
  gate refuses a merge with no verdict — there is no path around it.
  Re-check the capability's default before any comparison page ships.
- **GSD Core is an embeddable engine, not only a skill set** (their
  Embeddable Orchestration System: six interface points, eight
  negotiated axes, a protocol-version handshake, fourteen runtimes as
  descriptors, a VS Code extension, and a `gsd-mcp-server` exposing
  `command` and `state` over MCP). That is the "be the engine hosts
  delegate to" move already made; see the steal list.
- gstack's Codex pass is on by default (2026-09-08): "a different model"
  is no longer exclusive; the claim's weight moves to "denied".
- Notion: named by @human 2026-09-08 for the comparison pages; not
  mapped — a wiki with agents, not a tracker; map or drop before copy.

Sources for Ring 1.5 and agentplane, read 2026-08-25 (addendum) and
re-verified 2026-08-30 (this draft): linear.app, /developers/
agent-interaction, /now/our-approach-to-building-the-agent-interaction
-sdk, /pricing; atlassian.com/software/jira, /software/rovo-dev;
support.atlassian.com/rovo/docs/check-acceptance-criteria-in-a-code-
review/; plane.so, /pricing; github.com/makeplane/plane;
github.com/basilisk-labs/agentplane. Ring 1/2/3 legacy entries carry
the original map's Aug-2026 research basis and were not re-verified in
this pass.

Sources for the 2026-09-08 addendum, read that day: github.com/obra/superpowers
(README; skills/subagent-driven-development/SKILL.md and
task-reviewer-prompt.md); github.com/open-gsd/gsd-core (README;
docs/explanation/the-phase-loop.md, multi-agent-orchestration.md;
docs/ARCHITECTURE.md; docs/CONFIGURATION.md; docs/reference/gate-predicates.md,
review-verification-capabilities.md; agents/gsd-verifier.md,
gsd-executor.md; hooks/gsd-agent-isolation-guard.js, gsd-read-guard.js,
gsd-prompt-guard.js; gsd-core/references/gates.md; gsd-core/workflows/ship.md;
docs/explanation/ — all ten, on `next` and `main`: capability-overlay-model,
capability-trust-model, claude-orchestration-capability, context-engineering,
embeddable-orchestration-system, interface-versioning-policy,
live-dom-uat-capability, multi-agent-orchestration, security-model,
the-phase-loop);
github.com/garrytan/gstack (README; review/SKILL.md,
review/sections/adversarial.md; ship/SKILL.md); github.com/fulgidus/pi-gsd
(README); defract.dev and its post "Claude Code skills frameworks";
planwright.tools; registry.npmjs.org/superplan; pulumi.com/blog/
claude-code-orchestration-frameworks.
