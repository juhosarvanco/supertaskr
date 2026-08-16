---
id: T-048-s3
title: The "No plan in <folder>" card overflows the app's own window at 800x600
status: suggested
suggested_by: executor claude-opus-5 @T-048
---

Measured in the served bundle while establishing T-048's before/after
tables, at the size the app actually opens (800x600 — the window
`app/src-tauri/tauri.conf.json` configures):

    front door (noProject)        page 600/600   — fits
    "No plan in <folder>" card    page 663/600   — overflows by 63px
    (both at 1280x720)            page 720/720   — fits

The card is 500px tall and starts 115px down; the section's `py-12`
adds 48px below it. So on a fresh launch against a repo with no plan —
which is the FIRST screen a new user sees, and the entry point to the
whole genesis flow — the "Start an interview here" button and the
convention footnote sit below the fold and you must scroll to reach
them.

It is the same family as T-048 (a screen taller than the window at the
app's own size) and it was deliberately NOT fixed there: T-048's
criterion 4 froze the other screens, and this one is not a broken frame
— the page scrolls, everything is reachable, nothing is clipped. It is a
fit problem, not a containment problem, and the fix is different in kind:
this card wants to be shorter or the screen wants less padding, not a
bound and a scroll region.

Candidates, cheapest first:

1. **Trim the vertical padding** on the empty-state section (`py-12` →
   a smaller step) and/or the card (`p-6`). Tokens-only, no layout
   change, buys back ~30-50px. Probably enough at 800x600.
2. **Tighten the checklist block** — four rows at `gap-1.5` plus the
   heading, body copy, button row and footnote is a lot of card. The
   design sheet drew it at a larger viewport.
3. **Raise the app's default window height** in `tauri.conf.json`.
   Trivially effective and arguably correct (800x600 is small for this
   app), but it is a product decision and it hides rather than fixes the
   fit — every other size still has whatever margin it has.

@human: this is a look-at-it call, not a measurement call. The numbers
above say it overflows; whether that matters is a judgment about the
first screen of the app, and it belongs with the front-door visual pass
already on the open session's list.
