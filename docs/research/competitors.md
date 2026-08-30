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

Supporting moves: make the rejection corpus the moat (repo-specific,
compounding, invisible to hosted trackers); sell the fence as safe
parallelism (no competitor knows what files an issue touches); win on
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

Sources for Ring 1.5 and agentplane, read 2026-08-25 (addendum) and
re-verified 2026-08-30 (this draft): linear.app, /developers/
agent-interaction, /now/our-approach-to-building-the-agent-interaction
-sdk, /pricing; atlassian.com/software/jira, /software/rovo-dev;
support.atlassian.com/rovo/docs/check-acceptance-criteria-in-a-code-
review/; plane.so, /pricing; github.com/makeplane/plane;
github.com/basilisk-labs/agentplane. Ring 1/2/3 legacy entries carry
the original map's Aug-2026 research basis and were not re-verified in
this pass.
