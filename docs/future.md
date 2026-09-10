# Future — parked by design

These are committed directions, not current scope. Nothing here gets built
until the convention has survived real projects. The through-line for all
of them: every artifact the system produces — code, docs, decisions, its
own rules — must carry a mechanism for discovering it is wrong.

## v0.2 — after the first real project run
- **Cost telemetry** — token/dollar cost stamped per task next to built_by;
  budgets per milestone with burn on the board; estimated cost on the card
  before dispatch. North-star metric: **cost per verified task**, per
  model, per size tier — the number that makes routing an economics
  question.
- **Pocket cockpit** — the human gates go mobile: morning digest of
  pending approvals, escalated rooms, and rejections; approve/reject/
  answer from the phone; voice turns into rooms. What makes overnight
  autonomous milestones governable rather than unsupervised.
- **Calibration scorecards** — models estimate success/effort/risk before
  building; track calibration per model per task type from the built_by /
  verified_by stamps; routing follows demonstrated track record.
- **Retro role** — every milestone, ablate the convention itself: which
  role-prompt rules changed outcomes, which ceremony produced no delta,
  which doc sections no session read. Rules that don't earn their keep
  get deleted. (The 80%-deletion discipline, applied recursively.)
- **Enforced touches** — the declared blast radius becomes the sandbox:
  only touches: paths writable, per-task network allowlist, signed
  provenance chain task → session → model → diff.

## v0.3 — real features, real token cost; for L tasks
- **N-version building** — same task file to 2–3 different models in
  parallel worktrees; diff the *behavior*, not the code. Divergence is
  either a bug or a spec ambiguity no single builder could ever surface.
- **Spec red team** — an adversarial agent that attacks the plan itself:
  hostile user stories, contradictions between criteria, ADRs, and
  non-goals — before any task dispatches.

## v0.3 additions — dashboard-mature, no new science
- **Time machine** — the project is replayable from git: scrub through
  board states, architecture fill-in, rooms opening and resolving.
  Retro and onboarding tool now; the sharing format later — a project
  that ships its replay teaches HOW it was built.
- **Handoff score** — the succession guarantee, measured continuously:
  criteria without tests, components without owners, decisions with
  unsupported premises, stale STATE.md → one score with drill-down.
  A linter for the record now; trust currency later.
- **Dry run** — simulate a milestone before approving dispatch: critical
  path, parallelism vs the ceiling, cost forecast from historical tier
  data, which tasks block the most downstream work. The plan becomes a
  forecast you reshape before spending.

## Horizon — product-defining, genuinely hard
- **Truth maintenance** — decisions record their premises; premises form
  a graph; contradicted premises light every downstream decision amber
  on the dashboard. Plus continuous architecture-drift detection
  (code-as-is vs ARCHITECTURE.md-as-claimed, discrepancies → suggestions).
  *(The architecture-drift slice was pulled forward into F-06 v1 —
  ADR-013, 2026-08-15; the premise graph and the rest stay here.)*
- **Production feedback** — incidents trace to task/model/session via
  provenance stamps; errors auto-convert to regression tests and
  IF/THEN EARS lines; the verifier checklist grows from what actually
  broke.
- **Synthetic users** — persona agents (novice, power user, screen-reader
  user, adversary) use each milestone build and file experience reports
  as suggestions. Correctness has a verifier; this gives taste one.
- **Seeds** — a finished project's transferable residue (ablation-
  surviving conventions, ADR patterns, generalizing interview answers,
  task templates with real size/cost data) extracted into a starting
  seed for the next supertaskr init. Shareable → community seed library →
  domain compliance seeds (expert knowledge as interview questions +
  verifier checklists + doc requirements).
- **Explainer** — every verdict, resolution, and ADR carries an
  "explain this to me" affordance (janitor model, any depth) plus a
  weekly what-the-project-learned digest. The structural answer to
  "does this tool make its users more capable or less."
- **Proof of process** — a generated build dossier from the provenance
  chains, verification stamps, decision trails, and incident
  traceability, cryptographically tied to the repo. Client deliverable
  now; possibly what professional AI-built software is required to
  look like later.

- **The in-app cockpit** — F-05's orchestrator conversation inside the mirror app. Parked 2026-09-09 at @human's word ("the native apps are the cockpit for now"); scheduled in no version. The room is docs/rooms/cockpit-or-mirror.md.
