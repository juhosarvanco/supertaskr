# Routing: the "Four missing competitors" addendum → competitors.md

Written 2026-08-30 by the marketing & business planning session.
This is the seed file's first research task performed: the 2026-08-25
addendum artifact (claude.ai/code/artifact/cbee6593…, never merged by
its own header) has had its ⚠-marked and load-bearing vendor claims
RE-VERIFIED against current vendor pages, and a merged replacement for
docs/research/competitors.md is drafted at
[competitors-merged-draft.md](competitors-merged-draft.md).

This session does not write docs/research/ (business territory only;
ADR-004 makes the architect the single writer there). @human rules the
four asks at the bottom; on a YES the architect lands the draft.

## Re-verification record — every claim, checked 2026-08-30

**1. ⚠ Rovo Dev validates "code changes against acceptance criteria
in Jira" — the heaviest claim. CONFIRMED, with the teeth measured.**
- The marketing-page wording and the NEWWORK testimonial are still
  live verbatim (atlassian.com/software/rovo-dev, read 2026-08-30).
- The product doc the addendum asked for exists:
  support.atlassian.com/rovo/docs/check-acceptance-criteria-in-a-code-review/
  (read 2026-08-30). What is compared: the PR's code vs criteria found
  in the linked work item's **summary, description, and custom fields**
  (labels searched: "Acceptance Criteria"/"AC"/"ACs", "Business/
  Functional Requirements", "Definition of Done"/"DoD"). Discovery is
  brittle: the work item is found via a key in the **branch name**, else
  commit messages (and ambiguity aborts); if the description field is
  empty the check **skips entirely**, even with criteria in custom
  fields.
- Outcomes are **per-criterion, tri-state**: "successfully met" /
  "missing from the code" / "need manual checking". This is MORE
  structured than the addendum's "semantic judgement" framing — the
  merged draft corrects that rather than softening the competitor.
- **What happens on failure: nothing binding.** No blocking, no merge
  stop, no rejection path anywhere in the doc. Advisory output on the
  PR. Gated to the **paid Rovo Dev Standard plan** only.
- Net: the addendum's three surviving distinctions all hold —
  not adversarial (same vendor plans/builds/reviews), criteria are
  prose fields not testable clauses, and **no verdict**. The last one
  is now doc-grounded instead of inferred.

**2. Linear's declining of verification — SURVIVED their release.**
All four non-goal statements are still live on
linear.app/now/our-approach-to-building-the-agent-interaction-sdk
(read 2026-08-30): "issues can only be assigned to humans, and only
delegated to agents"; "an agent cannot be held accountable"; "you're
still the one accountable for the result"; "agents should always
disclose that they are agents". The agent-interaction API docs
(linear.app/developers/agent-interaction, read 2026-08-30) confirm the
six session states, two webhooks, five activity types, 5s/10s response
rules — and contain zero mention of acceptance criteria, verification,
or rejection paths.

**3. BUT: Linear Agent has SHIPPED — the watch item resolves as
"annexation stronger, non-goal intact".** linear.app/pricing (read
2026-08-30) lists "Agent platform and Linear Agent" from the FREE tier.
Third-party coverage dates the launch to 2026-03 with AI PM + triage +
backlog grooming, Skills and Automations in beta, and a vendor claim
of 25% of new issues being agent-created (press-relayed, not
hand-verified — kept OUT of the merged map). Pricing otherwise as the
addendum had it: Free $0 (250 issues, 2 teams), Basic $10, Business
$16 (Triage Intelligence, Code Intelligence, Loops), Enterprise
custom; coding sessions and Loops consume AI credits.

**4. Plane — CONFIRMED on every figure.** plane.so/pricing (read
2026-08-30): Free $0 capped at 12 users, Pro $6/seat, Business
$13/seat, Enterprise Grid custom; **AI metered as credits on every
tier including free** — 500/1,000/2,000 per seat per month, no
rollover on free. Stars now **58,548** (api.github.com/repos/
makeplane/plane, 2026-08-30; addendum said 58.2k), AGPL-3.0, pushed
same day. The self-hosted community-edition feature gating is STILL
unstated on the pricing page — that open item stays open in the
merged draft.

**5. agentplane — alive and unchanged in kind.** 76 stars (was 74),
9 forks, MIT, pushed 2026-08-30 (api.github.com/repos/basilisk-labs/
agentplane, read same day). Self-description verbatim as quoted in the
addendum. The convergent-evidence read stands.

## What the re-verification changes in the addendum's text

Three corrections folded into the merged draft; nothing else moved:
1. Rovo Dev's check is per-criterion tri-state, not a single semantic
   alignment judgement (understating a competitor is the same defect
   as overstating us).
2. Linear Agent is shipped fact, not trailed intention — the Ring-3
   annexation is present tense.
3. Star counts and read-dates refreshed to 2026-08-30.

## The four asks — one word each

- **M1 — Land the merged draft** as the new docs/research/competitors.md
  (architect performs the write)? Recommended: **yes**.
- **M2 — Adopt Ring 1.5** ("the trackers that grew agents") as a
  permanent ring in the map? Recommended: **yes**.
- **M3 — Re-lead the pitch**: the narrowed claim (the binding-verdict
  conjunction) becomes the lead argument; the graveyard/data-ownership
  pitch demotes to supporting clause? Recommended: **yes** — Plane owns
  the ownership argument with a license we do not have.
- **M4 — Open the room** the addendum proposes ("if incumbents span
  the rings, is the integration still the product — or is adversarial
  verification the product, with the board as its delivery vehicle?")?
  Recommended: **yes** — it contradicts conclusion 1 of the record,
  and NORTH_STAR says that goes to a room, not a doc edit.
