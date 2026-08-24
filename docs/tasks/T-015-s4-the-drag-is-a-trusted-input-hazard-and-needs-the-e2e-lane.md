---
id: T-015-s4
title: the pin drag is a trusted-input hazard of the same class as the dismissal listener, so its proof belongs in tools/e2e
status: suggested
suggested_by: executor claude-opus-5 @T-015
---

Separable from `T-015-s1` and `T-015-s2`: even a lane carrying
`[app-map, app-shell]` can add jsdom bodies for the drag and still not
have proven it. The proof needs `tools/e2e`, which is its own path fence.

## The hazard class

CONVENTIONS' standing gotcha, in its own words: *"Outside-click/dismissal
listeners must decide on pointerdown, never click — under trusted input
the browser runs microtask checkpoints between listeners, so React's
discrete-update flush lands mid-propagation and detaches the clicked
node; a click-time listener then reads inside as outside and
misdismisses (cost T-005 a rejection). Synthetic clicks propagate
synchronously and CANNOT reproduce it — no unit/jsdom probe will warn
you."*

A pin drag is the same shape one step longer:
`pointerdown -> pointermove* -> pointerup`, with React state updating
between events and the node re-rendering underneath the pointer. Under
synthetic dispatch the sequence is synchronous and the node the handler
captured is still the node under the cursor. Under trusted input it need
not be — and the failure is exactly the one that is invisible in jsdom
and obvious to a user (a node that jumps, sticks, or drops on the wrong
target).

**And the drag lands on a surface that already has a live dismissal
listener.** The map node carries `data-card-trigger`, the T-005 panel
primitive's re-target exemption. A `pointerdown` that starts a drag on a
node fires in the same trusted-event stream `attachPanelDismissal`
decides in. Whether a drag that ends without moving still counts as a
select — and whether a drag that ends over the panel dismisses it — are
both questions only trusted input answers. Nothing in the current suite
would notice either.

## What the e2e body has to cover

`tools/e2e` drives the app's dev bundle in headless Chromium with
trusted input, workers 1, retries 0, no skips — Playwright's
`mouse.down/move/up`, which produces trusted events. The bodies worth
having:

1. **A drag moves the node and only that node.** Positions of every
   other node byte-identical before and after — rule 5's real content is
   that pins do not disturb the rest.
2. **The computed slot stays ghosted rather than collapsing** — the
   card's own wording, and the half a screenshot cannot assert.
3. **Drop-on-ghost unpins**, returning the node to the computed slot.
4. **A drag that does not move still selects** (or deliberately does
   not) — the `data-card-trigger` interaction above, whichever way it is
   ruled.
5. **The panel does not misdismiss during a drag** — the T-005
   regression, in the one place that can see it.

Bodies 1–3 also want a POSITIVE CONTROL under CONVENTIONS' negative-
assertion rule: *"the computed slot stays ghosted"* is satisfied equally
by a map that ghosts nothing and renders nothing, so the same body (or
its sibling) must show a node actually occupying that slot when nothing
is pinned.

## Why it is separable

A lane holding `[app-map, app-shell]` can build the whole feature and
disclose this as an owed proof, the way this repository already discloses
the GNU `xargs` column and the first-push CI claims. That is a legitimate
shipping posture — but it should be a DISCLOSURE with a card behind it,
not an omission, because the failure mode is user-visible and the
gotcha's own history is a rejection.

## The other half, which no headless lane can close

The card says *"the faint pin hint from the design spec"*. Faintness is a
judgement — `text-muted-foreground` at `text-map-meta` (9.5px) beside a
provenance mark and possibly a drift chip, in both schemes. **@human's
eye is the only instrument for that**, on the same footing as the T-101
denial-notice look: does the hint read as quiet furniture rather than a
badge, and does it stay legible at map scale next to the ghost. Worth
one look on the lane that ships it, not a card of its own.
