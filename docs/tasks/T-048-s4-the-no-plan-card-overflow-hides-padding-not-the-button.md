---
id: T-048-s4
title: Correction to T-048-s3 — the no-plan card's overflow is padding; the "Start an interview here" button is above the fold
status: suggested
suggested_by: verifier claude-opus-5 @T-048
---

**T-048-s3's measurement is right and its consequence is wrong.** This
matters because s3 is written as a first-screen usability alarm and was
escalated as one; re-measured in the served bundle at 800x600 (the
window `app/src-tauri/tauri.conf.json` configures — `width: 800`,
`height: 600`, no `minWidth`/`minHeight`), against the `noDocs` status
with a real folder path:

| what | measured |
|---|---|
| page scrollHeight / viewport | **663 / 600** — s3's figure reproduces exactly |
| `[data-testid="start-interview-here"]` | top **524**, bottom **556** — **fully visible** |
| the convention footnote (last text in the card) | bottom **590** — **fully visible** |
| elements whose own text starts at or below y=600 | **none** (empty list) |
| painted elements crossing the fold | **one**: the card's own panel, top 327, bottom 615 — **15px** of its bottom edge |
| max page scroll | **63px** |

So the 63px that overflow are the empty-state section's bottom padding
(`py-12`) plus the bottom 15px of the card's painted panel. Nothing
readable and nothing clickable is below the fold. s3's sentence — "the
'Start an interview here' button and the convention footnote sit below
the fold and you must scroll to reach them" — does not reproduce; the
button clears the fold by 44px and the footnote by 10px.

s3's own header table is internally consistent with this and the prose
is what drifted: it records the card as `115+500`, i.e. a bottom edge at
615, which is 15px past a 600px fold — not a button at 663.

**What is actually true, and what it is worth.** On first launch against
a repo with no plan the front door shows a scrollbar and the card's
bottom hairline is clipped by 15px. That is a cosmetic fit blemish on
the first screen, not a hidden call to action. The same shape appears in
the sibling state (genesis phase + a rejected pick, page **665 / 600**),
and the front door proper (`noProject`) fits exactly at **600 / 600**.

**Ruling on urgency.** s3's three candidate remedies are all still the
right menu and remedy 1 (trim `py-12`) still buys back more than the
63px needed. But this is a padding trim on a screen that works, not an
unreachable primary action, and it should be scheduled with the
front-door visual pass rather than ahead of it. s3 should be re-read
with this correction attached before anyone acts on its urgency.

**Not a mark against T-048.** Criterion 4 asked that the no-plan card be
*unaffected*, and it is: 663/600 before and 663/600 after, every field
identical at both 1280x720 and 800x600. The overflow is pre-existing and
correctly out of that task's fence. Only the suggestion's prose
overstates the consequence.
