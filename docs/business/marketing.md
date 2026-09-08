# nputer — marketing & business planning

Opened 2026-08-30 at @human's direction. THIS FILE IS THE SEED: a
dedicated session owns marketing and general business planning for
nputer, and its work products land here (docs/business/) — the same
files-first discipline as everything else, but this directory is
BUSINESS territory: no code gates fire on it, @human rules everything
in it, and engineering sessions treat it as read-only context.

## @human's opening idea (2026-08-30, verbatim in substance)

When nputer is ready for test users: **limited-time free access
passes for serious AI-native developers**, and a feedback program
built around them. The pass is the wedge — a scarce, earned artifact
for exactly the audience whose workflow nputer is built for.

## The assets the planning session inherits

- docs/NORTH_STAR.md — the product's own words.
- docs/ROADMAP.md + docs/rooms/version-planning.md — what v1 is (the
  draft partition awaits @human's markup; the vision-not-a-queue rule).
- docs/research/competitors.md — the four-ring competitive map — AND
  the 2026-08-25 addendum artifact ("Four missing competitors":
  Linear, Jira/Rovo Dev, Plane, agentplane; the fifth-ring argument).
  ROUTED AND LANDED 2026-08-30: the ⚠ claims re-verified
  (competitors-merge-proposal.md is the record), the merged five-ring
  map landed on main by the engineering seat on @human's M1 ruling;
  competitors-merged-draft.md is now historical (the landed copy is
  authoritative).
- docs/research/ai-native-sdlc-playbook-review.md — the positioning
  evidence: where nputer meets or exceeds the reference playbook.
- The Beyond-the-Playbook charter artifact (32 features, 4 rings,
  vision-not-a-queue) and the nputer Loop artifact — the story of
  what the product IS, told two ways.
- docs/rooms/customization-form.md + team-enablement.md — the
  enterprise story's raw material (compliance-for-free, org skill
  packs, the git-host access model).

## Standing constraints

Nothing here is a queue for engineering: feature promises follow the
version-planning room's standing rule. Vendor claims carry their
source and date. Pricing/business-model decisions are @human's;
this session drafts and routes.

H1 RULED 2026-08-30 (@human, via the engineering session, overriding
this session's census-quoting proposal): **"Marketing writes freely
and uses the real artifacts and v1 plan."** No mechanical
CAPABILITIES-quoting constraint; the real artifacts and the v1 plan
are the source material. The version-planning room's standing rule
still governs feature PROMISES — freely-written copy still may not
promise what lacks a version ruling.

## The positioning spine (ruled 2026-08-30, M3)

M3 RULED with @human's own answer, overriding the verdict-first
recommendation: **"We lead with the full nputer SDLC approach."**
The lead story is the WHOLE loop — genesis → board → dispatch →
blind verification → records — with the verdict as the strongest
proof point INSIDE that story.

> One interview turns your idea into a fenced, criteria-bearing
> board; agents build it in parallel lanes that cannot collide; a
> different model — denied the builder's reasoning — returns a
> binding verdict on every card; and the whole history lands as
> records in your repo. nputer runs the entire AI-native SDLC, and
> built itself with it.

Proof points inside the story, in order: the binding verdict (the
narrowed claim — every clause excludes a named competitor, see the
landed map's conclusion 1), the self-hosted proof (every feature
forged by the loop it describes, records readable), safe parallelism
(fences — no competitor knows what files an issue touches), never in
the inference billing path (all three Ring-1.5 trackers meter AI — a
price comparison now, not a principle), and data ownership
(supporting clause; Plane owns that argument with AGPL).

## The access-pass program — RULED DESIGN (2026-08-30)

All rulings @human's, delivered via the engineering session
2026-08-30; the option analysis they ruled over is in this file's
git history. The full terms + application template:
[access-pass.md](access-pass.md).

- **P0 — trigger: T3.** Access starts at FULL v1 (not the
  genesis-walk trigger this session recommended). Read with P1/P2 as
  one coherent design: the WAITLIST opens early and collects
  interest now; access itself begins at v1.
- **P1 — qualification: OPEN WAITLIST.** No evidence gate. The
  application still collects setup facts (agent CLI, project) — for
  program metrics and prioritized support, never for gating.
- **P2 — admission: ROLLING**, with the engineering caveat honored:
  the waves-of-15 recommendation was grounded in real board-triage
  capacity, so rolling admission throttles the INTAKE RATE instead
  of the cohort size — feedback arriving faster than sittings can
  triage it burns goodwill. Default proposed: ~5 admissions/week,
  tuned against the suggestion-backlog watchdog band; @human can
  turn the dial any week.
- **P3 — window: 30 days**, one renewal earned by feedback that
  produces a promoted card (+30 days).
- **P4a — intake: REPO.** Markdown issues in a dedicated feedback
  repo; this session converts each item into a standalone
  suggestion-card draft stamped with the pass-holder id and hands
  batches to the architect seat, where they enter docs/tasks/ at
  `suggested` under the standing metabolism rules. Program metrics
  stay north-star metrics (acted-not-liked): % dispatching ≥1 task
  within a week, median interview→board minutes, cold-start
  confirmations. Not collected: NPS, stars,
  testimonials-as-metrics.
- **P5 — conversion: FOUNDING PRICE + TEAM-TIER PRIORITY, no
  credit.** @human asked whether a credit system is needed; ruled
  no — a credit ledger is a whole product surface nputer doesn't
  need at v1. The offer is a locked price and a queue position,
  never a roadmap.
- **P6 — the pass is a signed markdown file: YES**, with mechanics
  @human approved: offline signature (`ssh-keygen -Y` or minisign,
  public key published) over {holder, cohort, issued, expires}; the
  app checks signature + expiry at startup — no license server;
  renewal is a freshly signed file with a later date. At cohort
  scale enforcement is light-technical + social; the file's real
  job is identity, provenance, shareability. (The app-side check is
  an engineering card that routes through a version sitting like
  everything else; the program design assumes it, does not mint
  it.)

**Risks, named:** intake outrunning the triage seat (mitigated by
the P2 throttle + the backlog watchdog band); solo-founder support
burden (support is files-first — an FAQ grown from friction
reports, office hours batched); waitlist going stale before v1
(mitigated: dated expectations in the application — no launch date
promised, position number given; occasional build-in-public notes
keep the list warm).

## The rulings record

2026-08-30, @human via the engineering session: M1 yes (landed on
main same day) · M2 yes (Ring 1.5 adopted) · M3 @human's own
answer — lead with the full nputer SDLC approach · M4 yes
(strategy-room.md opened, business-side) · P0 T3 · P1 open
waitlist · P2 rolling, intake-throttled · P3 30 days · P4a repo ·
P5 price + priority, no credit · P6 yes, signed markdown ·
H1 @human's own answer — marketing writes freely from the real
artifacts and v1 plan.

Open work this file owes next: grow plan.md's pricing frames into
decision-ready options once the v1 version sitting rules the cut
line; the launch-post outline under the M3 lead; the comparison-page
plan (the steal list's one-person distribution engine) — its source
doc is docs/business/comparisons.md (skeleton 2026-09-08; T-245 landed the same day with the map's Ring 2
addendum and conclusion 6 — the verdict's CONSTRUCTION is the claim now,
not its existence; still gated on Notion being mapped).
