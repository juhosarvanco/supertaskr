---
id: T-079-s2
title: Two test files mint ungated motion rules into the SHIPPED stylesheet, and the comment that explains them names the wrong mechanism
feature: F-02
milestone: 4
priority: 36
size: S
status: planned
blocked_by: []
touches: [app-shell, app-interview]
suggested_by: executor claude-opus-5 @T-079
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29.** This is the rare
suggestion whose defect reaches a USER: two animation rules sit in the
production stylesheet OUTSIDE
`@media(prefers-reduced-motion:no-preference)`, and they are there
because two test files wrote the bare literal where Tailwind's source
scanner could see it. The repository already practises the idiom that
prevents it — `map-view-dom.test.tsx` assembles
`"animate-status" + "-pulse"` with a comment saying why, and
`crescendo-dom.test.tsx` joins `["board","rain"]` for the same stated
reason — so this is the idiom being defeated two doors down, not a
missing convention.

The card carries its own control, which is what makes it a finding
rather than a guess: `animate-map-teal-wipe` is declared like
`animate-status-pulse`, gated like it, and has NO bare rule, because no
file writes its name unprefixed.

The fence follows the component files rather than this card's prose:
`genesis-pane-dom.test.tsx` is C-13's (`app-interview`),
`genesis-mount.test.tsx` and `crescendo-dom.test.tsx` are C-05's
(`app-shell`).

## Acceptance criteria

- WHEN a test file needs to name a motion utility THE literal SHALL be
  assembled rather than spelled, in the form the two sibling files
  already use — the four `genesis-pane-dom.test.tsx` selector strings
  and the `genesis-mount.test.tsx` bundle probe.
- WHEN the change lands THE lane SHALL re-derive the shipped sheet and
  report that neither bare rule survives, by the same measurement this
  card used (the built `app/dist/assets/index-*.css`, with
  `animate-map-teal-wipe` as the negative control).
- THE `crescendo-dom.test.tsx` comment SHALL state the measured
  mechanism — a bare rule comes from a SCANNED CANDIDATE, never from
  the `@utility` declaration — and SHALL do so without spelling either
  name bare, since the comment is itself one of the scanned candidates.
- THE body's conclusion SHALL be preserved: "only the source can prove
  this, not the sheet" survives its reason, and for a better one — an
  ungated use mints its own bare rule on the spot, so the sheet is
  downstream of the thing being checked.
- IF "no bare motion-utility literal reaches the built sheet" is worth
  a gate THEN the card SHALL say so and route it; it is a DIFFERENT
  property from T-079's P6, which asks whether an ELEMENT gets an
  ungated class and correctly does not fire on either site here.

## The record, kept verbatim

**TAILWIND v4 EMITS UTILITIES STRICTLY ON DEMAND, AND A DECLARATION
ALONE EMITS NOTHING.** Measured at `25a9e2c` on a freshly built
`app/dist/assets/index-C86RloYb.css` (45 061 bytes, byte-identical to
the bundle STATE records at T-010's checkpoint):

| utility | declared in `app/src/index.css` | written BARE in a source | `.rule` in the sheet | `.motion-safe\:rule` |
|---|---|---|---|---|
| `animate-card-rain` | `--animate-card-rain` | nowhere | **absent** | absent |
| `animate-map-teal-wipe` | `--animate-map-teal-wipe` | nowhere | **absent** | present |
| `animate-status-pulse` | `--animate-status-pulse` | `app/test/genesis-pane-dom.test.tsx` ×4 | **present** | present |
| `board-rain` | `@utility board-rain` | `app/test/genesis-mount.test.tsx:506` | **present** | present |

`animate-map-teal-wipe` is the control that settles it: declared exactly
like `animate-status-pulse`, used exactly like it, gated exactly like it
— and it has NO bare rule, because no file writes its name without the
prefix. The two utilities that DO have a bare ungated rule in the
shipped sheet have it **because a test file wrote the bare literal and
Tailwind's source detection scanned it.**

## The two minting sites

- **`app/test/genesis-pane-dom.test.tsx`, four sites** (`:163`, `:210`,
  `:222`, `:235`) spell `qa("[class*=animate-status-pulse]")`. The
  string is an attribute SELECTOR and applies no class to anything —
  but Tailwind extracts candidates from raw text, so it mints
  `.animate-status-pulse{animation:status-pulse …}` into the production
  stylesheet, OUTSIDE the `@media(prefers-reduced-motion:no-preference)`
  block.
- **`app/test/genesis-mount.test.tsx:506`** lists `"board-rain"` among
  the needles it searches for in the built JS, minting
  `.board-rain [data-testid=task-card]{animation:var(--animate-card-rain)}`
  the same way.

**THE TREE ALREADY KNOWS THIS IS A HAZARD AND GUARDS AGAINST IT
ELSEWHERE.** `app/test/map-view-dom.test.tsx:219` builds
`"animate-status" + "-pulse"` with the comment *"The class name is
assembled so Tailwind's source scanner never sees a bare (ungated)
candidate in this file"*, and T-028's sweep in
`app/test/crescendo-dom.test.tsx` joins `["board","rain"]` for the same
stated reason. The idiom is real and load-bearing; it is simply being
defeated in two other files in the same directory.

## AND ONE WRITTEN CLAIM IS REFUTED BY THE SAME MEASUREMENT

`app/test/crescendo-dom.test.tsx`, in the body *"5. the rain is ONE
entrance transition, and it is motion-safe gated (criterion 5)"*, says:

> Tailwind emits a bare `.board-rain` rule from the `@utility`
> declaration itself (exactly as it emits a bare `.animate-status-pulse`
> beside the motion-safe one), so the sheet CANNOT prove this

The bare rule does not come from the declaration. It comes from a
scanned candidate — and, with exact irony, **one of the candidates is
that comment**, which spells `board-rain` in running text three lines
above the `join("-")` that exists to avoid spelling it.

**THE BODY'S CONCLUSION SURVIVES ITS REASON.** "Only the source can
prove this, not the sheet" is still right, and for a better reason: an
ungated use would MINT its own bare rule on the spot, so the sheet is
downstream of exactly the thing being checked. Only the premise needs
correcting — and correcting it while `board-rain` still appears bare in
the comment would keep minting the rule the comment is about.

## What is worth doing

1. Assemble the four `genesis-pane-dom.test.tsx` selector strings the
   way its two sibling files already do, and the `genesis-mount.test.tsx`
   bundle probe likewise. That removes two live ungated animation rules
   from the production stylesheet.
2. Correct the `crescendo-dom.test.tsx` comment to the measured
   mechanism, without spelling either name bare.
3. Consider whether "no bare motion-utility literal reaches the built
   sheet" wants a gate of its own. It is a DIFFERENT property from the
   one T-079's P6 guards — P6 asks whether an element gets an ungated
   class, this asks whether an ungated RULE gets minted — and P6
   deliberately does not fire on either site above (an attribute
   selector applies no class, and a bundle probe is not a class list).

**Out of T-079's fence.** T-079's `touches:` is `[tools/e2e]`; every
file above is `app/test/**`, which is `[app-shell]`, held LIVE by T-123
at `25a9e2c`. Nothing reds today: the token lint, its selftest, the E2E
lane and the app suite are all green, and the two extra rules are inert
until something applies them.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
