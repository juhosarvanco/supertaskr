# North star

## Vision
A product idea becomes a thoroughly planned roadmap broken into exact,
dispatchable tasks, then governed multi-model execution of it — with the
project folder as the complete, successor-proof record. The better
builder models get, the more the bottleneck is knowing what to build.
The product is the whole loop; the proof is a repository it built.

## Users
**First user: the technical builder** — has an AI coding agent CLI
installed and a real project outgrowing their control. One person, two
faces, one door: the solo founder with abandoned vibe-coded repos who
can't turn ideas into plans, and the developer with a months-old
sediment session and no system. Front door: terminal + repo + the
open-source method.

**Later: the non-coder client** — served by the guided, paid
spec-studio layer (ADR-006), inheriting an interview sharpened on
technical users. Decided in rooms/first-user.md (resolved 2026-08-14).

## Success criteria (fixed 2026-08-14, interview Q2; planner-drafted,
human-delegated)
Within ~2 months:
1. Supertaskr ships Supertaskr — milestone 1 built entirely through its own
   pipeline; every merged change traces to a task card with a verdict;
   zero retreats to a single mega-session. Git history is the proof.
2. Idea → dispatchable milestone-1 board in ≤ 30 minutes through the
   interview — the skill in your own agent app, or the app's split
   view (the magic moment, timed).
3. 2 of 3 outside technical users who run the interview on a real idea
   dispatch ≥ 1 task from the board within a week (acted, not liked).
4. Every architect model/session switch passes the cold-start test
   first try (100%).

Failure signals (tripwires):
- Juho routes around the board while building Supertaskr → ceremony
  heavier than value (magic principle 4 failing).
- Interviews complete but nothing dispatches → planning theater
  inside the anti-planning-theater product.
Deliberately absent: stars, signups, traffic — applause metrics
(see docs/research/competitors.md graveyard lesson).

## Non-goals
- Not another kanban board; the story map is the home view.
- Not a cloud service: no accounts, no hosted backend, no telemetry
  home-phoning. Local-first is identity, not deployment detail.
- Not an IDE or an agent: we orchestrate agents users already have —
  and the user's own agent app is the cockpit. Supertaskr sits in it as
  a skill and mirrors the folder beside it, never the other way round
  (ADR-021).
- Never in the inference billing path — no proxying tokens or keys.
- Not a fourth standalone product empire: layers ship in order —
  the method, the CLI, the skill in the agent app, the mirror app, and
  a daemon only when rooms need routing — each earning the next.

## Riskiest assumption (interview Q6, 2026-08-14)
That a thorough plan really keeps AI agents coherent over months.
If false, Supertaskr is planning theater with a beautiful board. Cannot be
proven in weeks — but leading indicators can, and milestone 1 must
start the experiment on day one (Supertaskr building Supertaskr IS the
experiment). Tracked per milestone:
- drift incidents: work contradicting NORTH_STAR/ARCHITECTURE caught
  by verifier or human (falling = coherence holding)
- cold-start pass rate on switches (100% target)
- rejection rate trend per task size (rising over time = drift)
- STATE.md truthfulness: fresh-session confirmations that match reality
A manual drift audit closes every milestone until the horizon-tier
truth-maintenance features exist.

## Hard constraints
- Model-agnostic: any agent CLI that reads files can hold any role.
- Terminal-forever: fully drivable without the dashboard.
- Solo-founder maintainable: thin stack, shell-out architecture.
- The succession guarantee is non-negotiable: swap the architect
  model/session at any time with zero capability loss.

## The bar (@human, 2026-08-29)

Quoted verbatim, because the criteria decide which arguments count:
*"I need everything to be gold standard in a way that will highly
impress even the worlds best veteran software developers, ai
developers and the best experts and masters in the field. I need
nputer to be the product everyone will praise and need in their
workflow. I need nputer to be the finest example of the perfect, most
efficient, bug free, highest quality work producing AI native SDLC
tool ever created."*

Read WITH the applause-metrics exclusion above, never against it: the
bar is not praise collected — it is work that SURVIVES the scrutiny
of masters, and "need in their workflow" is success criterion 3's
"acted, not liked" at world scale. Operationally the bar is a BAND,
not an adjective (ADR-019/020): a known-vacuous keeper is a
stop-the-line defect, the guard-integrity queue trends to zero, and a
quality regression reds before it ships. The repository itself
remains the proof: the finest example is the one whose own record
shows it.
