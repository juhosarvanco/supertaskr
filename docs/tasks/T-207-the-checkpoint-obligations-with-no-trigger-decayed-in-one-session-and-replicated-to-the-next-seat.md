---
id: T-207
title: A denominator that only collects successes is worse than no band — the four checkpoint obligations with no mechanical trigger decayed within one session AND replicated to the next seat through the records
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [.claude/hooks/, .claude/settings.json, tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/, docs/CONVENTIONS.md]
suggested_by: "this seat's own skipped-obligations self-audit, returned by the outgoing architect seat with the provenance of three of the four; relayed 2026-08-31, approved in direction by @human"
builder:
review: independent
---

**THE TITLE IS THIS SEAT'S OWN SENTENCE, WRITTEN ABOUT ITS OWN SKIPS.**
The outgoing seat returned it with the half this seat could not see:
**three of the four were inherited from that seat's practice.** It
skipped them too, so the records this seat ramped from taught a checklist
**with the holes already drilled**.

## The structural claim, proven twice in one night by two seats

**Every obligation with a mechanical trigger was met 100% by BOTH
seats** — the DOCS GATE, the graph check, the lane fence's *intent*, the
governing-document budgets. **Every memory-held one decayed within a
single session, and then REPLICATED to the next seat through the
records**, because a record of an omission reads exactly like a record of
compliance.

*"Will now do at every checkpoint" is a resolution, and resolutions are
guards somebody forgets.*

## The four

1. **HEALTH BANDS never run** — and when they are run without
   `--readings`, three bands answer UNREAD, so the run is not a claim
   about the tree. The readings owed back are the outputs of steps the
   checkpoint already performs.
2. **BOOT CHECK at app-touching merges** — leaned on in-lane runs, which
   measure the lane's tree rather than the merge's.
3. **CARGO AUDIT never run.**
4. **E2E left to CI.**

## AND OBLIGATION 3 WAS LIVE WHEN THIS CARD WAS FILED

Measured at this ref rather than asserted: **`cargo audit` runs ONLY in
CI** (`.github/workflows/ci.yml:168–179`). **CI has been dead since
~02:30 on 2026-08-31** — an account-level billing block, zero steps, no
log. So the audit had **not run against any of the night's ten merges**,
and nothing in the repository would ever have said so.

This seat ran it by hand while filing this card: **exit 0, 17 allowed
warnings, zero vulnerabilities** — which the AUDIT GATE POLICY grades as
a pass, since *"the gate is VULNERABILITIES … informational warnings stay
NON-gating"*.

**Note what caused that run: a peer's message.** Not a trigger, not a
ritual, not the checkpoint — a reminder from another session. **The
pattern this card is about, demonstrating itself inside the card's own
filing.**

## THE FORM — standalone, sharing `T-203`'s token, and the argument is the TRIGGER

The proposal offered a choice: fold into `T-203`'s green-token, or stand
alone. **This seat rules standalone**, and the reason is not tidiness:

- **`T-203` fires on every PUSH. These obligations fire on a
  CHECKPOINT** — and `T-182` already made a checkpoint machine-detectable
  by its commit subject. **The two have different triggers, so one token
  cannot carry both** without either firing checkpoint obligations on
  ordinary pushes or hiding a conditional inside one artifact, giving it
  two meanings (`T-057`).
- The noise cost is not hypothetical. `docs/CONVENTIONS.md` already
  argues, about a health-bands CI step, that it *"would red every push
  for no actionable signal — the AUDIT GATE POLICY's own argument against
  `--deny warnings`"*. **That argument applies verbatim to overloading
  the push token.**

**It SHARES `T-203`'s mechanism**: the checkpoint gate reads that
verdict token and adds its own stamps. One token format, two consumers,
two triggers.

**And CONVENTIONS' existing three reasons against a CI step are reusable
here** — particularly the second, that the readings which make a health
run informative are the OUTPUTS of steps the job already runs. **A
checkpoint gate is the right home precisely because the checkpoint is
where those outputs exist.**

## RELATION TO `T-156-s6` — siblings, and neither is sufficient alone

`T-156-s6` is the bands' **CONFIG** being wrong (naming cards that do not
exist). This card is the bands' **RUNNING** never happening.

**Fixing `s6` alone leaves correct bands that nobody feeds.** Fixing this
alone leaves a gate faithfully running a config that names phantoms.
Whichever is dispatched second should read the other; they are not
foldable, because one is a data defect and the other is a missing
trigger.

## Acceptance criteria

- A commit whose subject marks it a CHECKPOINT SHALL be refused when the
  health readings are absent or were stamped at a different ref, when the
  push range touches `app/**` and no boot verdict exists, or when the
  audit's last run falls outside its stated period.
- THE readings SHALL be stamped **at the checkpoint's own ref**; a
  reading from another tree is a reading of a MACHINE, not of this tree,
  which `T-161` already established for durations.
- **A POSITIVE CONTROL SHALL prove a properly-stamped checkpoint is
  ALLOWED.** A gate that refuses every checkpoint is indistinguishable
  from one that works — `T-199`'s lesson, and this card is guard-class
  for the same reason.
- **THE AUDIT'S PERIOD SHALL BE STATED AND DERIVED, not chosen**, and the
  gate SHALL say when the last run was rather than only whether it
  passed. A gate that reports "audited" without a date is the denominator
  problem this card is named for.
- WHERE CI is the only runner for an obligation, the gate SHALL notice
  that CI has not run — **the measured instance is ten merges with no
  audit and nothing saying so.**
- **This card is GUARD-CLASS**: `review: independent` is owed and SHALL
  be set at dispatch.
- Verification: headless.

## Read beside

`T-167-s8` (the mechanical-versus-memory-held evidence, landed and
verified), `T-156-s6` (the sibling config defect), `T-203` (whose token
this shares and whose trigger it deliberately does not), `T-182` (which
made a checkpoint machine-detectable), and `docs/CONVENTIONS.md`'s three
recorded reasons against a health-bands CI step.

## `review: independent` SET AT FILING, not left for a dispatch to remember

**A checkpoint gate — its job is to REFUSE a checkpoint.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.
