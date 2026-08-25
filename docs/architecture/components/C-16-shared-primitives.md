---
id: C-16
name: Shared primitives
layer: app
paths:                    # extracted from C-05 at T-033 (see below)
  - app/src/components/ui/**
  - app/src/lib/utils.ts
  - app/src/lib/verdicts.ts
depends_on: []
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-shell]
---
The primitives more than one pane uses and none of them owns: the shadcn
`ui/` element set, the `cn` class merger, and the verdict-history
classifier. **A leaf by construction — `depends_on: []` is derived, not
aspirational**: `utils.ts` imports only `clsx`/`tailwind-merge`,
`button.tsx` imports React, `class-variance-authority`, `radix-ui` and
`cn`, and `verdicts.ts` imports NOTHING at all. Nothing in here may reach
a pane, which is what makes every dependency on it acyclic.

**WHY THIS EXISTS — IT IS AN EXTRACTION, NOT A NEW SURFACE (T-033
decision (1), arm (a); @human's no-cycles ruling of 2026-08-25).** Not one
byte of code moved: these three paths were C-05's, so every child that
imported `cn` or `Button` was recorded as depending on **the shell**, and
`C-13 -> C-05` was drawn for three `Button` imports. That arrow was an
artifact of where the primitives happened to live, and declaring it would
have written a cycle into the registry to describe an import of a button.
The standing rule the ruling sets is **extract when the tangle is an
accident, extract when it is real — the registry holds no cycles**, which
is the Acyclic Dependencies Principle and its two sanctioned remedies.

**`verdicts.ts` IS HERE AND THE RULING'S PATH LIST DID NOT NAME IT — SAID
PLAINLY BECAUSE IT IS THE ONE PLACE THIS LANE WENT BEYOND THE WORDS IT
WAS GIVEN.** The ruling names `app/src/components/ui/**` and
`app/src/lib/utils.ts`, and it also enumerates the rows it expects to
survive: `C-05 -> C-13` and `C-05 -> C-14`, and no others. Measured at
`ad5a0df`, those two lists contradict each other. `C-08 -> C-05` is four
file edges, three of them `cn` and the fourth
`lib/board-model.ts -> lib/verdicts.ts`; `C-09 -> C-05` is two, one `cn`
and one `TaskDetailPanel.tsx -> lib/verdicts.ts`. Extracting only the two
named paths leaves both rows standing on `verdicts.ts` alone, and then
every disposition open to this card is forbidden: declaring them writes
`C-08 -> C-05` and `C-09 -> C-05` beside the already-declared
`C-05 -> C-08`, which is two new cycles; leaving them undeclared misses
zero drift. `verdicts.ts` meets the same test as `utils.ts` by every
measure — three consumers (C-08, C-09, C-12), zero imports, pure — and
T-017's own header says it was split out *"to keep the dependency graph
acyclic"*, which is this component's whole thesis one file early. The
reversal is one line if the architect disagrees: drop the path here, and
`T-033-s6` carries what it costs.

**THE SLUG IS DELIBERATELY `app-shell` AND NOT A NEW WORD.** These files
are C-05's today, so `app-shell` is exactly who may edit them; giving
C-16 its own slug would silently move a fence as a side effect of a
registry tidy-up, and a fence that moves without a dispatch is the one
thing the slug table exists to prevent.

**`T-033-s7` IS ANSWERED, AND THE ANSWER IS ITS OPTION (a) — LEAVE IT.
DECIDED ON A MEASUREMENT RATHER THAN ON TASTE (T-127, 2026-08-25,
derived at `afe23c1`).** The question was whether shared primitives
deserve their own fence word. Re-derived at that ref rather than quoted:
**eight** cards whose `touches:` is exactly `[app-shell]` are still live
— `T-022`, `T-035`, `T-044`, `T-099`, `T-100`, `T-106`, `T-114`,
`T-115`; the ninth the census named, `T-126`, has shipped — and **NOT ONE
of the eight names `ui/**`, `utils.ts` or `verdicts.ts` anywhere in its
body.** A new `app-ui` slug would relieve **nobody in the current
queue**, and it would NARROW the fence of every live card reading
`[app-shell]`, which is a dispatch change exactly as real as a widening
(option (b)'s own warning). **And nothing in this repository could see
it**: giving `C-10` a different `touch_slugs:` value was measured on
T-127's lane and left `npm test` from `app/` at **973 / 973, exit 0**
(`T-127-s4`). Cost with no measured benefit, paid silently. Option (c)
stays ruled out for the reason `T-033-s7` already gives.

**WHERE THE BENEFIT ACTUALLY IS, MEASURED ON THE SAME EIGHT: `C-10`, NOT
`C-16`.** Two of the eight touch only the docs watcher — `T-114`, whose
own criterion reads *"NOTHING OUTSIDE `docs_watch.rs` SHALL MOVE"*, and
`T-035`, which is `applySnapshot` in `docs-model.ts` — and two more span
the shell AND the watcher (`T-044`, `T-106`). So the word that would
relieve this queue is the docs watcher's, and `T-127-s2` carries it with
the fence consequences enumerated by card id. **The suggestion asked
about the shared primitives and the census says the shared primitives
are not the problem** — which is exactly why it asked for a number.
