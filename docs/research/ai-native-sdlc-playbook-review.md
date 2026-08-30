# The AI-native SDLC playbook, reviewed against nputer

Source: https://claude.com/blog/the-ai-native-sdlc-playbook — read in
full 2026-08-30. **@human's ruling (2026-08-30, in session): the
playbook is a MISSION-CRITICAL REFERENCE for nputer. Its ideas and
practices are followed; where nputer deviates, the deviation carries
excellent clear reasoning and must be at the playbook's level or
better.** This document is the practice-by-practice review that
ruling asked for. It is a RECORD of the 2026-08-30 reading; re-review
when the playbook revs.

## Stage-by-stage mapping

**1. Plan (`intent.md`).** nputer: the genesis interview — one
question at a time, each answer BANKED TO DISK on confirmation,
NORTH_STAR born from it; mid-life intake is suggestion cards and
rooms. AT LEVEL OR BETTER: the playbook's proto-spec is one artifact
reviewed once; nputer's interview commits per answer and the board is
the triage queue with metabolism rules (promote / park with
resurfacing condition / DISCHARGED-NOT-DECLINED), which is the
playbook's survival-rate metric made mechanical.

**2. Design (`spec.md` + org skills).** nputer: cards carry EARS
SHALL-criteria (requirements), rooms and ADRs carry design, features
decompose at their own sitting gated on rulings already made. **THE
ONE STRUCTURAL GAP IS HERE: nputer has no org-skills import** — no
way for brand/security/compliance/UX policy to be loaded and applied
while specs and cards are written. This is @human's 2026-08-30
directive; docs/rooms/loop-customization.md owns it.

**3. Build.** AT LEVEL OR BETTER on every practice: plan-approval ≈
the card as contract plus the executor's confirmation-of-understanding
written before anything is touched, deviations recorded ON the card
(same rule as "update plan.md in the same commit"); CLAUDE.md ≈ the
five governing docs under BYTE BUDGETS with gates (the playbook says
"keep it under a page", nputer enforces it mechanically);
"mistake-twice becomes documentation" ≈ hazards + poison drills + the
eval corpus; hooks ≈ the lane-fence hook (dispatch-stamped manifest,
hostile-payload verified) — and nputer's fences make lane collisions
IMPOSSIBLE where the playbook's worktrees share only "engineer
oversight"; subagents ≈ seats with role files.

**4. Test.** AT LEVEL OR BETTER: self-verification ≈ gate-owed
suites DERIVED per diff (the DOCS GATE names what a diff owes),
exits unpiped, evidence in reports; failing-test-first ≈ the poison
drill in its stronger form (mutants must red ONE side, restorations
sha256-proved, vacuous plants disclosed); config regression-tested ≈
method evals with the --bump obligation (every method version bump
owes the eval block) plus CI on every push. DEVIATION WITH REASONING:
the playbook blocks test-edits-during-fixes with a hook; nputer
separates BUILDER from VERIFIER instead ("the builder of a cage is
not its inspector", two-phase blindness) — seat separation covers
the incentive the hook targets, at the seam where it actually lives.
PARTIAL: the 20–50-real-task eval suite gating config changes —
nputer's eval corpus is younger; material is being collected per
incident, the obligation exists.

**5. Deploy.** Review: the verifier seat EXCEEDS PR-pass review —
adversarial attack sets written from the card alone, measured
counterfactuals, verdicts with assigned corrections; REVIEW.md's
thresholds ≈ TASK-FORMAT's ceremony table (size × shipped-partition
→ verifier owed), mechanical. Separation of duties: legislated.
DEVIATION WITH REASONING: the human gate sits at RULINGS and
standing authorizations rather than per-PR click-approval — right
for an owner-operator repo; an enterprise re-tightens via branch
protection without any nputer change (see rooms/team-enablement.md).
HONEST GAP: environment tiers and rollback rehearsal are N/A until
nputer ships a running service; adopt the playbook's tiering then,
as written.

**6. Maintain.** AT LEVEL OR BETTER where built: the playbook's
`bands.yaml` control-band loop IS nputer's health bands — declared
bands with keepers, deterministic detection, and a breach lands ON
THE BOARD as a suggestion card (`health --file`), which is exactly
monitoring-writes-intent.md with the triage queue already attached;
incidents becoming permanent evals ≈ every defect class this week
became a pinned drill. NOT BUILT: security scans on schedule,
on-call presence in chat — F-05-adjacent, sequenced behind the spawn
path (T-165).

## The six principles and six anti-patterns

All six principles hold in nputer, four of them in mechanically
enforced form (policy-as-code: fences, budgets, the no-digits law,
preflight; audit-as-commit-chain: record-first checkpoints with
provenance-stamped figures). All six anti-patterns are already law
here in equal or stronger spellings — "don't apply policy only in
review" is the fence at the WRITE; "don't create mid-build approval
prompts" is the card-as-contract with escalations PARKED rather than
blocking; "one source of truth" is the founding bet.

## The verdict, and the two real debts

nputer FOLLOWS the playbook or exceeds it everywhere the playbook's
subject exists here, with two deviations carried on reasoning
(verifier-seat separation instead of a test-edit hook; rulings
instead of per-PR human clicks) and two stages honestly N/A until
nputer ships services. The two structural debts, both @human's
2026-08-30 directive, both owned by docs/rooms/loop-customization.md:

1. **Org-skills import** — brand/security/compliance/UX policy
   loadable into genesis, spec-writing, and the seats' briefs, in the
   playbook's own `.claude/skills/<name>/SKILL.md` format
   (compatibility is adoption).
2. **Loop customization UX** — the loop is already files (method/
   roles and protocols, CONVENTIONS, per-card `review:` overrides);
   what is missing is the ACCESS LAYER: simple for most, per-stage
   deep for experts.
