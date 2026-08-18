---
id: T-062-s2
title: The map canvas now pans AND native-scrolls on one wheel — 300px of wheel moves the graph 354px
status: suggested
suggested_by: executor claude-opus-5 @T-062
---

**A behaviour change T-062 introduced deliberately and measured rather
than assumed.** T-062's criterion says the canvas fix "changes nothing
today (the canvas is never smaller than its content today)". That is
true of GEOMETRY and not quite true of INPUT, and the difference is
worth writing down before someone rediscovers it as a bug.

## The mechanism

`MapView.tsx`'s canvas has carried an `onWheel` handler since T-012: a
plain wheel pans the map by translating the transform wrapper
(`setViewport((v) => ({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }))`).
It does not call `preventDefault` — React attaches wheel listeners at
the root and a passive listener cannot.

While the canvas was `overflow-hidden` that was the only thing a wheel
did there. T-062 makes it `overflow-auto` so a shrunken canvas hands its
overflow to a scrollbar instead of deleting it (the whole point of the
card: 54px of graph was disappearing silently at 800x600 under a bounded
frame). Now both respond to the same wheel.

## Measured, in the served bundle

Headless Chromium, 800x600, this repo's own graph, one
`page.mouse.wheel(0, 300)` with the pointer over the canvas:

    before  scrollTop 0    transform translate(0px, 0px) scale(1)
    after   scrollTop 54   transform translate(0px, -300px) scale(1)

**One 300px wheel moves the graph 354px.** The native component is
clamped by the canvas's own overflow — 54px is the entire scrollable
range at that viewport — so it is a small constant added to the pan,
not a doubling. At viewports where the canvas is not shrunk
(1280x840, 1024x700 — measured 666/666 and 526/526) `scrollTop` cannot
move at all and the wheel behaves exactly as before.

## Why it shipped anyway

Deleting a quarter of the graph with no scrollbar is worse than a pan
that overshoots by the height of its own overflow, and the criterion
names `overflow-auto` explicitly. Fit-to-frame — the other way to make a
shrunken canvas safe — is ruled out by T-048-s2 and restated in T-062's
own criteria: T-012's layout is deterministic and pinned, and rescaling
is a design decision.

## What would close it

A non-passive `wheel` listener registered through a ref
(`addEventListener("wheel", handler, { passive: false })`) so the pan
handler can `preventDefault` and stay authoritative — the canvas then
has exactly one scroll behaviour and the scrollbar remains as the
reachability guarantee. That is a real change to an input path with its
own trusted-input test obligations, and it is bigger than T-062's fence.

It is worth pairing with a decision nobody has made: **should the map
pan on a bare wheel at all?** Every other scroll region in this app
scrolls on a wheel, and the map is the one surface where a wheel means
something else. Read with **T-034-s1** (wave 0 is a 1440x3818 canvas in
a ~600px pane), which is the case where all of this is felt most.
