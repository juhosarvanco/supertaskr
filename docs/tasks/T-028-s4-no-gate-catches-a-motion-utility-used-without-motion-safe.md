---
title: Nothing gates a motion utility used without the motion-safe variant
status: suggested
suggested_by: executor claude-opus-5 @T-028
---

Measured while building T-028's card entrance, and filed rather than
half-fixed because the honest closer is a lint rule and lint rules are
T-038's/T-045's territory.

**The shape.** Tailwind v4 emits a BARE rule for every animation utility
alongside the gated one. Both of these are in the shipped sheet
(`app/dist/assets/index-*.css`, measured this session):

    .board-rain [data-testid=task-card]{animation:var(--animate-card-rain)}
    @media(prefers-reduced-motion:no-preference){
      .motion-safe\:board-rain [data-testid=task-card]{…}
      .motion-safe\:animate-status-pulse{…}
      .motion-safe\:animate-map-teal-wipe{…}
    }
    .animate-status-pulse{animation:status-pulse …}   ← also bare

So the ungated class EXISTS for every motion utility this app has, and
using it is a one-character mistake: `animate-status-pulse` instead of
`motion-safe:animate-status-pulse` compiles, paints, and ignores the
user's accessibility setting silently. Nothing red-flags it — not
`tsc`, not the token lint (its four patterns are about arbitrary values
and default-palette utilities), not the DOM suites, and not the lane,
because a spec that does not emulate reduced motion sees no difference.

**Today the tree is clean**, and T-028 pinned its own corner: a
character-exact sweep over every `.ts/.tsx` under `app/src` asserting
that the entrance utility never appears un-prefixed
(`app/test/crescendo-dom.test.tsx:289`). That is one utility's worth of
guard, hand-written, in a test that belongs to one task. The property is
general and the guard should be too.

**The closer, small and mechanical.** `tools/e2e/scripts/lint-tokens.mjs`
already walks `app/src`, `app/test` and `tools/e2e` for `.ts/.tsx/.mjs`
and already masks non-string context with its own lexer — so it is
already looking at exactly the right text. A fifth pattern would be:
inside a string literal, a class token matching `animate-[a-z0-9-]+` (or
a named motion utility) that is not immediately preceded by
`motion-safe:` or `motion-reduce:` is a hit. Zero deps, same shape as the
other four, and it would have caught this class of bug before it existed
rather than after.

**Prior art in this repo for why it is worth it:** T-006 introduced
`motion-safe:animate-status-pulse` and T-012 `motion-safe:animate-map-teal-wipe`;
both got it right by hand, three tasks apart, with nothing enforcing it.
Every T-028-shaped task adds a fourth chance to get it wrong.

Adjacent: **T-038** made the token lint precise; **T-034-s5** argues the
walk policy IS the gate. Same family, same file.
