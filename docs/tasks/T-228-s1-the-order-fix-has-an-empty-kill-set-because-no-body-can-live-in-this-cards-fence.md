---
id: T-228-s1
title: T-228's repaired ORDER has an empty kill set — the suite cannot tell the fix from the defect, and the one file that could say so is outside T-228's own fence
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: executor claude-opus-5@subagent @T-228
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-229`** (a positive control that cannot fail is the
most common defect this project produces). This is the sharper member:
not a control that cannot fail, but a REPAIR with **no body at all**,
routed rather than skipped because the fence that would hold the body is
the fence the repair is fenced by.

## The measurement, at `fa410f7`

`T-228` reordered `decide()` in `.claude/hooks/lane-fence.mjs` to
`alwaysWritable → stale-stamp → paths`, so the unfenceable directory
stays open during a half-performed widening. Its drill mutated the
ORDER, as that card's fourth criterion requires:

| mutant | kind | suite | kill set |
|---|---|---|---|
| `alwaysWritable` moved back AFTER the stale-stamp check — the PRE-FIX order | ORDER | 58 passed, exit 0 | **EMPTY** |
| the stale-stamp check moved to the END — the obvious fix | ORDER | 1 failed / 57 passed | `lane-fence.spec.ts:447` |
| `live !== manifest.touchesLine` inverted | PREDICATE | 15 failed / 43 passed | 15 bodies |

**RESTORING THE DEFECT LEAVES 58 OF 58 GREEN.** The repair is real —
driven through `decide()` against a real armed fixture, the card and a
fresh `docs/tasks` file go from `BLOCK stale-stamp` to `ALLOW
always-writable` in both halves of the window — and nothing in the tree
holds it there. The next reader who tidies that function back reds
nothing.

## What this card is

`T-228`'s FIRST acceptance criterion, built and unasserted:

> WHILE a lane's card and manifest disagree, a write to
> `UNFENCEABLE_PATHS` SHALL be ALLOWED, and a body SHALL prove it by
> driving `decide()` in that state against the card, a fresh file in that
> directory, and a path the fence never granted.

One body in `tools/e2e/tests/lane-fence.spec.ts`, which already builds
exactly the fixture it needs (`makeFixture` / `arm` / `ask`). It drives
`decide()` in the window and asserts three cells: the card ALLOW
`always-writable`, a fresh `docs/tasks/T-90N-…md` ALLOW
`always-writable`, and `docs/STATE.md` — never granted — still BLOCK.
Its positive control is the state one row over: the same three targets
with a CURRENT stamp, where the never-granted path is refused
`outside-the-fence` rather than `stale-stamp`, so an allow is never
confused with a guard that failed to arm (docs/CONVENTIONS.md, LIFTING A
SAFETY GUARD TO DISCRIMINATE).

**THE WINDOW HAS TWO HALVES AND THE BODY WANTS THE ONE `T-210` DOES
NOT DRIVE.** `lane-fence.spec.ts:447` widens the LANE'S card and leaves
the manifest narrow. The half `roles/executor.md`'s fast path A
describes is the other one — main amended, the fence re-expanded, the
lane's own card not yet updated — and it is reached by re-arming with a
widened card committed in the fixture's integration checkout while the
lane's working copy keeps the old line.

## Why it is a separate card

`T-228`'s fence is `touches: [.claude]`. Every reader of the hook lives
in `tools/e2e` (`command grep -rn 'lane-fence\.mjs' app lib tools
.github --exclude-dir=node_modules`), so the only file that can hold the
body is refused to that lane by the guard it repairs — asked of the live
manifest, not assumed:

    BLOCK  outside-the-fence    tools/e2e/tests/lane-fence.spec.ts

**THE FENCE IS ONE FILE AND NOT `tools/e2e`**, deliberately: at
`4c16b37` the whole-directory spelling collides with `T-225-s2`
(`tools/e2e/scripts/brief.mjs`, `tools/e2e/tests/brief.spec.ts`, …) and
with `T-230-s7` (`tools/e2e/scripts/card-preflight.mjs`,
`tools/e2e/tests/card-preflight.spec.ts`), while
`tools/e2e/tests/lane-fence.spec.ts` is disjoint from every lane live at
`T-228`'s dispatch.

**Disposition hint: this is a widening, not a project.** The cheapest
resolution is to amend `T-228`'s own `touches:` to
`[.claude, tools/e2e/tests/lane-fence.spec.ts]`, re-run
`brief.mjs --task T-228 --write-fence <worktree>`, and let that lane
finish — in which case this card is discharged by that work and triage
records the discharge rather than promoting it. Promote it only if
`T-228` has already landed.

## Read beside

`T-228` (the repair and the four-state measurement), `T-210` (the body
that drives the other half of the window and already kills the
obvious-fix mutant), `T-229` (the control release), and
docs/CONVENTIONS.md's POISON DRILL shape SEVEN — a mutant no body kills,
because the mutant set was derived from the pins rather than from the
criteria. This is shape seven found the honest way round: the criterion
was read first, and the mutant it names has no killer.
