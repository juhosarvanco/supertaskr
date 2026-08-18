---
id: T-062-s3
title: The parse-error strip sits outside the board's scroll region, and a tall one reopens the page scroll the whole task closed
status: suggested
suggested_by: verifier claude-opus-5 @T-062
---

**Found while verifying T-062 by driving a board state its five-screen
sweep does not reach.** T-062 is not made worse by this — before it, the
board's page always scrolled — but the invariant the card states
("**AFTER, every screen and every viewport: `page == viewport`**", "the
page is never the thing that scrolls") is **not universal**, and the new
lane assertion cannot see the case where it fails.

## The mechanism

`App.tsx`'s board renders three siblings inside the bounded column:

    <div>  model-counts strip        (auto height)
    <ul data-testid="parse-error-details">   (auto height, GROWS)
    <div data-testid="board-scroll" class="min-h-0 flex-1 overflow-y-auto">

The comment above `board-scroll` says the counts strip and the
parse-error list stay outside it **deliberately** — "an answer you have
to scroll back up for is not much of one". That reasoning is right for a
short list. But the `<ul>` is a flex item with no `min-h-0` and no
`overflow`, so its automatic minimum size is its content: it cannot
shrink. `flex-1` drives `board-scroll` toward zero first, and once that
is exhausted the `<ul>` pushes straight through the bottom of the
`h-screen` column, whose `overflow` is `visible`. The document grows and
the page scrolls again — header, project path, parse chips and theme
toggle included.

## Measured — served bundle, headless Chromium, this branch at `d40d76a`

Board driven through `__nputerShellHarness` with N task files whose front
matter fails validation (`id`, `milestone`, `size`, `status`,
`blocked_by`, `touches` all invalid), 3 valid cards alongside:

| bad files | viewport | page/vp | `board-scroll` | `window.scrollY` reachable |
|---|---|---|---|---|
| 1 | 1024x700 | 700/700 | 518/518 | 0 |
| 6 | 1024x700 | 700/700 | **368/338** | 0 |
| 6 | 800x600 | 600/600 | **368/142** | 0 |
| **20** | **1280x840** | **896/840** | **368/30** | **56** |
| **20** | **1024x700** | **896/700** | **368/30** | **196** |
| **20** | 800x600 | **1216/600** | 368/30 | **616** |
| **60** | 800x600 | **3296/600** | 368/30 | **2696** |

Two separate failures, both at or above the declared minimum:

1. **The page scrolls again at 20 parse errors**, on every viewport
   including T-051's shipped 1280x840 default. The column reads
   `3296/600 overflow-y: visible` in the worst row — it overflows itself
   and hands the growth to the document.
2. **The board's own region collapses to 30px** — an eighth of
   `REGION_FLOOR`, the 250px that `window-contract.spec.ts` (this same
   task) declares is "a region nobody can work in". It is already at
   142px with SIX errors at 800x600 and 338px with six at 1024x700.

Nothing is hidden (a `scrollHeight`/`clientHeight` sweep finds no clipper
here), so `shell-frame.spec.ts`'s clipper assertion stays green, and its
`page == viewport` assertion never sees this because none of its five
screens has a parse error.

## What would close it

Either give the strip its own bounded scroll region (`max-h-*` +
`overflow-y-auto`, which keeps the "answer stays visible" intent for the
first few rows and stops it eating the board), or move it inside
`board-scroll` and accept that a long list scrolls with the board. The
first is closer to the comment's stated intent.

Whatever is chosen, the assertion that would have caught this is the one
T-062 already owns, driven over a board WITH parse errors: the same
`page == viewport` check plus `board-scroll`'s `clientHeight` against
`REGION_FLOOR`. The fixture is cheap — the state is reachable from
`__nputerShellHarness` with unparsable task files.

## The class, not the instance

The card's own idiom applies to itself: **a bounded frame only holds if
every unbounded sibling of the scroll region has a ceiling.** Today the
board has two such siblings (`model-counts`, `parse-error-details`), one
of which grows without limit with the user's own tree. The genesis
screen's chain walk in `app/test/shell-frame.test.tsx` checks that every
link CAN shrink; nothing checks that every sibling MUST.
