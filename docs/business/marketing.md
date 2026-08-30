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
  ROUTED 2026-08-30: the ⚠ claims are re-verified and a merged draft
  awaits @human's ruling — competitors-merge-proposal.md (the
  verification record + asks M1–M4) and competitors-merged-draft.md
  (the ready-to-land text).
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

PROPOSED HOUSE RULE (needs @human's yes): **marketing material may
only claim behaviour the census proves** — every capability sentence
in outward material quotes docs/CAPABILITIES.md at a named commit.
The census is generated from passing tests, so marketing copy
inherits the same honesty gate the code lives under. No competitor
can say that about their own site, which makes the rule itself a
marketing asset.

## The positioning spine (drafted 2026-08-30, pending M1–M4)

The lead pitch is the narrowed claim from the verified competitive
map — a conjunction where every clause excludes a named competitor:

> A **different model**, given only the criteria and the diff and
> **denied the builder's reasoning**, returns a **binding verdict**
> that stops the merge — and the whole exchange is **a file in your
> repo**.

Supporting clauses, in order: the self-hosted proof (nputer built by
its own loop, records readable), safe parallelism (fences — no
competitor knows what files an issue touches), never in the
inference billing path (all three Ring-1.5 trackers meter AI —
a price comparison now, not a principle), and data ownership
(demoted from lead; Plane owns that argument with AGPL).

## The access-pass program — draft v0 (2026-08-30, @human's idea)

Design goal: the pass is a **scarce, earned artifact** for exactly
the audience nputer is built for, and the feedback it buys arrives
as suggestion cards the board already knows how to metabolize. No
feature promises anywhere in it — the pass sells what CAPABILITIES
proves on grant day.

**P0 — the trigger ("test-user readiness").** Options:
- T1: now — one completed real planner turn exists (T-025-s2).
- T2: the full Q1–Q7 genesis walk closes milestone 3 AND the board
  hands out briefs (T-112) — the loop is walkable end to end.
- T3: the full v1 cut line (needs the version sitting first).
**Recommendation: T2.** T1 is a demo, not a product experience; T3
delays real-user evidence the riskiest-assumption tracking needs.
The program can be BUILT now and armed at T2.

**P1 — who qualifies as "serious AI-native".** Options:
- A (evidence): applicant shows a repo they work in with an agent
  adapter file (CLAUDE.md/AGENTS.md) and agent-driven commit
  history — thirty seconds to check, impossible to fake casually,
  and exactly NORTH_STAR's first user (agent CLI + a real project).
- B (invitation): hand-picked practitioners from @human's and the
  project's orbit.
- C (open waitlist + screening questions).
**Recommendation: A, with B as seasoning** (a few hand-picked
anchors per cohort). C collects applause, not users — the
applause-metrics exclusion applies to program design too.

**P2 — grant mechanics.** Options: rolling admissions / fixed
cohorts of ~10 / fixed cohorts of ~20.
**Recommendation: cohorts of 15±5, one wave at a time.** Each cohort
is a sitting: its feedback is triaged as a batch, the suggestion
queue's watchdog band protects the board from flooding, and wave N+1
does not open until wave N's cards are metabolized. Scarcity is real
because capacity is real: the constraint IS the triage seat, and
saying so publicly is honest marketing.

**P3 — the time limit.** Options: 14 / 30 / 60 days.
**Recommendation: 30 days.** Success criterion 3 measures dispatch
within a WEEK of interview; 30 days holds the whole arc (genesis →
board → dispatched tasks → lived-with records) with slack, while
keeping the pass a limited thing rather than a lapsed subscription.
One renewal, earned: a pass-holder whose feedback produced a
promoted card gets +30 days. Feedback that moves the board is the
program's currency.

**P4 — what feedback is collected, and how it reaches the board.**
Collected: (1) the two timed numbers the north star already owes —
interview→dispatchable-board minutes (criterion 2) and days to first
real dispatch (criterion 3); (2) friction reports in a lightweight
template (what you tried, what happened, what you expected); (3) one
exit interview per pass-holder, run by this session's process.
Routing: raw feedback lands in a dedicated intake (a repo or form —
@human's pick, P4a below); the marketing session converts each item
into a standalone suggestion-card draft stamped with the pass-holder
id, and hands the batch to the architect seat, where it enters
docs/tasks/ at `suggested` and queues under the standing metabolism
rules like every other arrival. No new machinery, no product
promises: the feedback program is a PROCESS wrapped around the
board's existing metabolism. Program metrics are north-star metrics
(acted-not-liked): % of cohort dispatching ≥1 task within a week,
median interview→board minutes, cold-start confirmations. Explicitly
not collected: NPS, stars, testimonials-as-metrics.

**P5 — what converts a pass-holder afterwards.** Options:
- Founding price: a locked discount on the first paid tier,
  whenever @human rules one exists (the map's norm: free single-user
  core, paid collaboration/interview layer, ~$15–20/mo ceiling —
  under pressure from Plane at $6/seat). No feature promises
  attached; the offer is a price, not a roadmap.
- Founding credit: named in the repo's record as a founding tester
  (the records are public and permanent — cheap for us, real to
  them).
- Team-tier priority: first in line when a team offering exists —
  phrased as position, never as a date.
**Recommendation: all three stacked, anchored on founding price.**
They cost nothing today, promise nothing undelivered, and each one
converts a different motivation.

**P6 — the pass itself is a file.** A signed markdown certificate —
issued in its own commit, carrying the cohort, the window, and the
holder's name; revoked or renewed the same way. The pass program
runs on the product's own discipline (files, commits, records), and
that is the marketing: even our access passes have provenance.
Recommendation: yes.

**Risks, named:** cohort feedback outrunning the triage seat
(mitigated by P2's wave gating + the backlog watchdog band); the
solo-founder support burden (mitigated: support is files-first — an
FAQ grown from friction reports, office-hours batched per cohort);
pass-holders arriving before the walk is smooth (mitigated by P0=T2:
arm only when the loop is walkable); a cohort of 15 telling nobody
(accepted: the program buys evidence first, reach second — reach is
the launch post's job, and the pass program feeds it the numbers).

## The decision queue for @human — one word each

Competitive map: **M1** land the merged draft? **M2** adopt Ring
1.5? **M3** verdict-first lead? **M4** open the integration room?
(details in competitors-merge-proposal.md; recommended yes ×4)

Pass program: **P0** trigger = T1/T2/T3? (rec: T2) · **P1**
qualify = evidence/invite/open? (rec: evidence) · **P2** cohort =
rolling/10/20? (rec: ~15 waves) · **P3** window = 14/30/60? (rec:
30) · **P4a** intake = repo/form? · **P5** conversion =
price/credit/priority/all? (rec: all) · **P6** pass-as-file? (rec:
yes) · **H1** the census-only marketing rule? (rec: yes)

Next after rulings: fold answers into this plan, draft the pass
terms + application template, and open docs/business/plan.md (the
business-plan skeleton: positioning, segments, pricing frames for
@human, channel plan built on conclusion 5's register-against-their-
protocols move).
