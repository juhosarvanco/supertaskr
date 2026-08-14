# Competitive map — August 2026

Four rings, closest first. Sources: SDD landscape + multi-agent tooling
research, Aug 2026. Re-verify before the launch post; this space churns
monthly.

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
- **AgentsRoom** — 7 providers, mid-conversation model switching
  (our session-switching feature, shipping today), mobile.
- **Munder Difflin** — "hive": shared memory, inter-agent messaging,
  GOD orchestrator. The closest thing to rooms anywhere.
- Also: Crystal, Superset, Sculptor (container isolation), Paperclip,
  CodeAgentSwarm, Gastown (scale), Antfarm + OpenClaw (overnight runs).

**Category mortality:** the two highest-starred tools died or went
dormant in 2026 WITH traction. Third-party workflow layers between the
user and the agent vendors are structurally fragile.

## Ring 2 — spec-method layer (vs the convention)

- **GitHub Spec Kit** — open, agent-agnostic SDD standard-bearer;
  constitution.md; 30+ agents. The convention's closest cousin.
- **AWS Kiro** — spec-first IDE; EARS-native; SMT contradiction
  checking on requirements.
- **Intent (Augment)** — the closest single competitor overall:
  living spec → coordinator/specialist/verifier → worktrees →
  managed merges, as a macOS product.
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

Planning that never touches execution. Nobody hands the plan to agents.

## Ring 0 — the platforms (don't fight; float)

Claude Code Desktop / Agent Teams, Cursor background agents, Codex app.
"The official route" is now a named alternative in every comparison.
Stay file-based and model-agnostic so their improvements lower our
dispatch cost instead of obsoleting us.

## Strategic conclusions

1. **Nobody spans the rings.** Idea → interview → exact tasks →
   governed multi-model execution → provable record has no occupant.
   The integration is the product.
2. **Nobody has our furniture.** Story map (all boards are kanban),
   file-backed rooms with debate protocol + resolutions, succession
   guarantee, provenance/review stamps.
3. **The graveyard is the pitch.** When the category's most popular
   tool can die and strand users, "your project is markdown in your
   repo — nputer can vanish and you lose nothing" is the strongest
   trust argument available.
4. **Money lives at the ends.** Ring 1 = free/open-source knife fight.
   Ring 3 = individuals paying monthly for planning craft. Open-source
   the pipeline; sell the interview.

## Steal list — lessons worth adopting

**Mechanics**
- Slash-command ergonomics (Spec Kit): ship the convention as
  /nputer-plan, /nputer-checkpoint etc., one-line install, inside every
  agent the user already runs.
- Deterministic spec-checking (Kiro): part of the v0.3 spec red team
  can be solvers/linting over EARS lines, not model calls.
- Container isolation (Sculptor): the implementation path for v0.2
  enforced-touches sandboxing.
- Conditional context packs (BB-Skills): progressive disclosure for
  CONVENTIONS.md as it grows — load only what the task touches.

**UX**
- Review is the product surface (Conductor): verdict + diff review UX
  deserves the same design love as the story map.
- Mobile review ships early (Nimbalyst): pull the pocket cockpit
  forward from horizon-adjacent to v0.2-adjacent.
- Terminal-forever (Claude Squad): fully drivable from the CLI always;
  the dashboard is the reward, never the requirement.

**Business**
- Founder-credibility moat (ChatPRD): the interview tuned by a real
  facilitator, built in public under Juho's name; coaching is a paid
  behavior — the explainer is product, not garnish.
- Comparison-page SEO (Nimbalyst): honest "X vs Y" content is a
  one-person distribution engine.
- Pricing norm: free single-user core, charge for collaboration;
  ~$15–20/mo is the individual ceiling.
- Never sit in the inference billing path: ride the user's existing
  agent subscriptions/keys.

**Negative lessons**
- Any cloud-dependent component is a death vector (Vibe Kanban);
  local-first keeps the product alive past its company.
- Stars are not retention: instrument completed real projects, not
  GitHub applause.
- The middle of the workflow demos well and gets absorbed by
  platforms; the beginning is the defensible ground.
