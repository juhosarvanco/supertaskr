---
id: T-222
title: THE LANDING GATE CANNOT EXPAND A SLUG TOKEN, so a slug-fenced lane's out-of-fence paths are ANNOUNCED rather than refused — measured, not feared
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: [T-212]
touches: [.claude/hooks/expand-fence.mjs, .claude/hooks/landing-gate.mjs, tools/e2e/scripts/lane-fence.mjs, tools/e2e/tests/landing-gate.spec.ts]
suggested_by: "T-212's executor, from its own build: the landing gate expands `touches:` through the parser's own `expandFence`, and `expandFence` needs `ComponentRecord[]` to resolve a SLUG — which needs the frontmatter parser, which needs `yaml`, which the hook dependency budget excludes"
builder: unassigned
review: independent
---

**THE GATE IS HONEST ABOUT THIS AND THAT IS WHY IT IS A CARD.** `T-212`'s
landing gate refuses a lane push carrying a path outside its card's
expanded fence. The expansion is the project's ONE implementation —
`@nputer/parser`'s `expandFence`, reached from the hook budget by
importing `lib/parser/src/fence.ts`'s SOURCE, which carries exactly one
`import type` and therefore no runtime dependency at all.

But `expandFence` takes `(task, components)`, and the components are what
turn a SLUG into paths. Reading them needs `parseComponentSet` →
`extractFrontmatter` → `yaml`, and `.claude/hooks/` runs on node builtins
because *a lane worktree ninety seconds old has no `node_modules`*
(docs/CONVENTIONS.md, "A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING
BUILT"). So the gate passes `components: []`, every slug token comes back
`unresolved`, and the fence's `unusable` list carries it out.

That is rule 5's THIRD verdict produced by the parser rather than
invented, and the gate says so out loud — but the consequence is real.

## The measurement

Token census over `docs/tasks/*.md` at `0a8dd58`
(`grep -h '^touches:' docs/tasks/*.md`, split and counted):

| token | cards | expandable in the hook budget |
|---|---|---|
| `tools/e2e` | 89 | yes (path) |
| `app-shell` | 79 | **no (slug)** |
| `docs/CONVENTIONS.md` | 58 | yes |
| `app-agent` | 43 | **no (slug)** |
| `crate-index` | 26 | **no (slug)** |
| `app-board` | 25 | **no (slug)** |
| `app-map` | 23 | **no (slug)** |
| `lib-parser` | 22 | **no (slug)** |
| `app-interview` | 19 | **no (slug)** |
| `app-dispatch` | 10 | **no (slug)** |

A lane whose fence carries ANY of those gets its resolved domains
enforced and an ANNOUNCED cannot-compare for every path outside them.
The announcement names the token and the path and never claims the diff
was clean — but it does not refuse, and `T-212`'s whole subject is a
refusal.

## What to build

Publish the slug map in a form the hook budget can read, once, where the
expansion already happens. `--write-fence` runs in the dispatching
checkout, which HAS a built parser by definition — the same argument
`T-154` used to put the expanded fence in a manifest instead of computing
it at the write.

**AND THE OUTPUT MUST NOT BE THE LANE'S TO EDIT**, which is the whole
lesson of `T-212`: a map sitting in the lane worktree is a map a lane can
widen. It has to be COMMITTED ON MAIN, or derived from files committed on
main that no lane fences. That is a change to what the dispatch ritual
commits, so it belongs beside `T-211`'s fast paths rather than inside
either card.

## Acceptance criteria

- A lane whose `touches:` carries a SLUG token SHALL have an out-of-fence
  committed path REFUSED at the push, not announced.
- **A POSITIVE CONTROL SHALL prove a slug-fenced lane pushing wholly
  inside the slug's expansion is ALLOWED** — including a path that is
  inside the slug's domains and nowhere in the card's text, which is the
  case a token comparison gets wrong.
- THE map SHALL be a function of files committed on the integration
  branch, and one body SHALL prove that editing it inside the lane does
  not widen the gate — `T-212`'s own two bodies, aimed at the new input.
- THE expansion SHALL remain `expandFence`, called with real
  `ComponentRecord`s. A second slug table is `T-057` and is also the
  thing `method/lane-protocol.md` rule 5 forbids by name: "THE EXPANSION
  READS ONE SOURCE AND MUST NEVER GROW A SECOND."
- Verification: headless.

## Read beside

`T-212` (the gate this completes), `T-211` (the dispatch ritual this
changes), `T-154` (why the expansion happens at dispatch and not at the
write), `T-219` (the other open hole in the same expansion), `T-221`
(the other unpinned half of the same containment story — that one is
`sharedDomain`'s separator in `lib/parser`; `T-212`'s own containment
body now pins `within`'s), `method/lane-protocol.md` rule 5.

*Filed as T-221 and renumbered: `T-221` was taken on main by another
lane while this one ran, which is the board moving under a lane rather
than a mistake. The id was re-derived from `git ls-tree main`, not from
this lane's copy of `docs/tasks/` — the same class of staleness this
card's own gate exists to remove.*
