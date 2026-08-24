---
id: T-031-s5
title: ModelBadge's "all three are load-bearing" is refuted by measurement — min-w-0 is inert there, and one pin cannot tell the three apart
status: suggested
suggested_by: verifier claude-opus-5 @T-031-verify
---

T-031's criterion 6 is MET — the badge is bounded, measured at 96px and
clipping, with the card unmoved and the raw stamp preserved on `title=`.
What is wrong is the JUSTIFICATION written beside it, in shipped source,
and the pin that is supposed to hold it.

**THE CLAIM.** `app/src/components/board/badges/ModelBadge.tsx`'s header
comment states:

> All three parts are load-bearing together: `truncate` alone cannot
> shrink a flex item whose `min-width: auto` is its content, and
> `max-w-24` alone loses to that same automatic minimum (min beats max in
> the cascade).

T-031's implementation notes repeat it verbatim.

**THE MEASUREMENT.** Real Chromium at 1280×720, a live card whose
`built_by` model half is a single 500-character token the shortener
cannot shrink, ablating one class at a time on the rendered element:

| ablation | badge width | card `scrollWidth` / `clientWidth` | column |
|---|---|---|---|
| as shipped | 96px | 375 / 375 | 377px |
| `truncate` removed | 96px | **3346** / 375 | 377px |
| `max-w-24` removed | **304px** | 375 / 375 | 377px |
| `min-w-0` removed | 96px | 375 / 375 | 377px |
| all three removed | 3314px | **3374** / 375 | 377px |

`truncate` is what clips; `max-w-24` is what caps the badge at 96px
instead of 304px. **Removing `min-w-0` alone changes nothing at any
level** — not the badge, not the card's overflow, not the column, not the
page.

**THE MECHANISM IS THE OPPOSITE OF THE ONE STATED.** CSS Flexbox §4.5
clamps a flex item's automatic minimum size by its own specified
`max-width`. So `max-w-24` does not "lose to" `min-width: auto` — it
DEFEATS it, and `min-w-0` is redundant on this element. The comment's
parenthetical, "min beats max in the cascade", is true of the
`min-width`/`max-width` resolution rule and irrelevant here, because
`min-width` never resolves to `auto`'s content size once a max is
specified.

**THE SAME ABLATION OVER THE PANEL SHOWS THE SPLIT IS REAL, NOT A
ONE-OFF.** Panel overflow (`scrollWidth − clientWidth`, 0 as shipped)
after removing one class from one surface:

| surface | `break-words` removed | `min-w-0` removed |
|---|---|---|
| `h2` title | 114036 | **114036** |
| ref line (916-char path) | 6200 | **6226** |
| `Stamp`'s `dd` | 74164 | **74164** |
| touches slug | 65427 | **0** |
| blocker chip | 65424 | **0** |
| file footer | 5387 | **0** |
| genesis north-star card | — | **0** |

`min-w-0` earns its place exactly where the surface is an item in a ROW
flex container whose inline axis is contested — the `h2` beside the ref
line, the ref line beside the `h2`, the `dd` beside a `w-24 shrink-0`
`dt`. The touches slug, the blocker chip, the file footer and the genesis
card are items in COLUMN flex containers, where `min-width: auto` never
constrains the inline axis, so the utility is inert. (Criterion 5 names
`min-w-0` on the genesis ancestor explicitly, so that one is mandated
regardless of whether it does work.)

**AND THE PIN CANNOT TELL THE THREE APART.** Removing `max-w-24`,
removing `truncate` and removing `min-w-0` each red exactly one body —
*the model badge is bounded (T-024-s6) > a stamp the split cannot help
still cannot widen the card* — and it is the SAME body all three times.
That body pins the presence of a class string, so it reds identically for
a class that holds the surface and a class that does nothing. It is the
shape CONVENTIONS names: a pin on the mechanism standing in for a pin on
the property.

**WHY THIS IS FILED AND NOT A REJECTION.** The property holds, and the
card asked for a class pin; the executor built what was specified. Nobody
is misled today. The cost is later: the next reader of that comment
learns a false rule about flexbox and carries it to a surface where it
matters, and the pin will keep agreeing with whatever the class list
says.

**THE FIX, in whichever lane next holds `app-board`:**

1. Correct the comment. `truncate` clips, `max-w-24` caps AND defeats
   `min-width: auto` by §4.5; `min-w-0` is belt-and-braces on this
   element, which is a fine thing to keep and a bad thing to claim is
   load-bearing.
2. Give the body a property assertion the class list cannot satisfy. The
   discriminating measurement is available in `tools/e2e` — real layout,
   real CSS: assert the badge's rendered width is capped and the card's
   `scrollWidth` does not exceed its `clientWidth` under a hostile stamp,
   with the full raw value still on `title=` as the positive control.
   That reds for `truncate` and `max-w-24` and correctly stays green for
   `min-w-0`, which is the whole point.
3. Optionally apply the same audit to the panel table above. Each row
   where `min-w-0` measures 0 is a utility the pin currently defends and
   the layout does not need.

Measured 2026-08-25 by `claude-opus-5 @T-031-verify` in a detached
scratch worktree at `75afa0a`, driving the hostile fixture through
`__nputerDocsHarness` into the dev bundle. The mutant counts come from a
drill whose ambient control was returned to 958/958 by touching
`app/dist` first — three `is not stale` bodies otherwise reden on every
mutant after the first, because `git checkout` bumps an mtime.
