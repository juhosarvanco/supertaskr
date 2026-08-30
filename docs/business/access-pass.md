# The nputer access pass — terms & application (draft under the 2026-08-30 rulings)

Program design ruled by @human 2026-08-30 (the rulings record in
marketing.md). This file is the operating document: the terms a
pass-holder reads, the application the waitlist runs on, and the
issuing mechanics. DRAFT until @human approves the wording; the
DESIGN is ruled, the PROSE is not yet.

## The program in one paragraph

A limited-time free access pass to nputer for AI-native developers.
The waitlist is open now; access begins when v1 ships (no date
promised — you get a position number, not a countdown). Admission is
rolling and deliberately throttled: feedback from pass-holders flows
onto nputer's own development board as suggestion cards, and we admit
only as fast as that board can honestly metabolize what you tell us.
A pass is a signed file. Even our access passes have provenance.

## Terms (the holder-facing text, v0)

1. **The pass.** A signed markdown certificate over {holder, cohort,
   issued, expires}, signed offline (public key published in this
   repository). The app verifies signature and expiry locally — no
   license server, no account, no phone-home. Your projects and data
   never leave your machine; that is the product's identity, not a
   program perk.
2. **The window.** 30 days from issue. One renewal is EARNED, not
   requested: feedback of yours that produces a promoted card on
   nputer's board extends your pass 30 days, with the renewal file
   naming the card id it thanks you for.
3. **What we ask of you.** Run nputer on a real project, not a toy.
   File friction as it happens (template below) in the feedback
   repo. Take one 30-minute exit conversation near the end of your
   window. We measure what the north star measures: whether you
   actually dispatched work from a board nputer planned — not
   whether you liked it.
4. **What your feedback becomes.** Each item is converted into a
   suggestion card carrying your pass id, and enters the same triage
   queue every other piece of work on nputer's board enters. You can
   watch what happened to it — promoted, parked with a resurfacing
   condition, or discharged with reasons — in the public record.
5. **What you get afterwards.** Founding price: a locked discount on
   the first paid tier, whenever one exists. Team-tier priority:
   first in line when a team offering exists. Both are positions and
   prices, never dates or feature promises.
6. **Revocation.** Passes are revocable for abuse the same way they
   are issued — a signed, dated file. At this program's scale we
   assume good faith; the pass's real job is identity and
   provenance, not DRM.

## The application (open waitlist — nothing here gates admission)

Admission is by waitlist order under the weekly intake throttle.
Setup questions exist for program metrics and better support, never
for scoring applicants.

    # nputer access-pass application
    name / handle:
    contact (email):
    which agent CLI(s) do you run today:        # e.g. Claude Code, Codex, Cursor, Aider
    the real project you'd run nputer on:       # one sentence; private is fine
    what's breaking in your current AI workflow: # one sentence
    where did you hear about nputer:            # optional
    ok with feedback landing publicly as board cards under your pass id? yes/no

Expectation-setting text on the form: access begins at v1; no launch
date is promised; your position number is your answer to "when";
occasional build-in-public notes go to the list.

## Operating mechanics (program-side)

- **Intake throttle (P2):** default ~5 admissions/week, proposed —
  tuned weekly against the suggestion-backlog watchdog band's state;
  @human can turn the dial any week. The throttle is public and
  honest: "we admit as fast as we can metabolize feedback" is both
  true and better marketing than artificial scarcity.
- **Issuing:** each pass is issued in its own commit (file +
  signature); renewals and revocations likewise. The issuing key's
  public half is published in-repo.
- **Feedback intake (P4a):** a dedicated feedback repo, markdown
  issues. This session runs conversion: issue → standalone
  suggestion-card draft (pass id stamped, evidence quoted, dated) →
  handed in batches to the architect seat → enters docs/tasks/ at
  `suggested` under the standing metabolism rules.
- **Metrics kept** (north-star aligned): % of holders dispatching
  ≥1 task within a week of their first interview; median
  interview→dispatchable-board minutes; cold-start confirmations;
  promoted-card count per holder (the renewal currency). Not kept:
  NPS, stars, testimonial counts.
- **Engineering dependency, honestly stated:** the app-side
  signature/expiry check is an engineering card that routes through
  a version sitting like everything else. Until it exists, passes
  are social artifacts only — which the program survives, since
  enforcement was ruled light-technical + social from the start.

## Open wording questions for @human (non-blocking)

- Does the pass file carry the holder's real name, handle, or
  either-at-choice? (privacy default: at-choice)
- Is the feedback repo public from day one, or private-per-cohort
  with public card ids? (default proposed: public, with the
  application's consent checkbox)
