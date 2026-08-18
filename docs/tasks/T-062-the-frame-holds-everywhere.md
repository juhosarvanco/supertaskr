---
id: T-062
title: The frame holds everywhere — one scroll model, a canvas that scrolls, a card that fits
feature: F-02
milestone: 4
priority: 28
size: M
status: done
blocked_by: [T-051]
touches: [app-shell, app-map]
builder: claude-opus-5 @fresh
verifier: claude-opus-5 @fresh
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-048-s1, T-048-s2, T-048-s3, T-048-s4 (triage 2026-08-17).
The suggestion files are removed in the same commit as this card.

`blocked_by: [T-051]` is real, not lane serialization: T-051 raises
the default window and declares a minimum, and every measurement in
this card is taken against the window that actually ships. T-048-s3
and T-048-s4 were going to fold INTO T-051 at triage; it was already
building, so they ride here instead.

THE FORK IS STILL OPEN AND ITS NAMED OWNER IS SPENT. T-048 bounded the
genesis column (`h-screen`) and left every other screen a growing page
(`min-h-screen`), and said the decision was T-027's to make. T-027
came and went; re-verified at triage, `App.tsx:472` still reads
`boundedFrame ? "h-screen" : "min-h-screen"`. Two scroll models in one
shell is the kind of thing a user feels without being able to name —
on a tall board at 800x600 the wordmark, project path, parse chips and
theme toggle all scroll off, while the genesis screen behaves the
other way.

THE TRAP UNDERNEATH IT. `MapView.tsx:552` (cited at :490 when filed —
the line moved, the classes did not) gives the canvas
`min-h-0 flex-1 overflow-hidden`: it can shrink, and when it does it
HIDES the overflow. Harmless today only because the column is
`min-h-screen` so the canvas never has to shrink. T-048 measured the
other side while ruling out the unconditional fix: with `h-screen`,
`div.map-canvas-grid` reads **446/320 with `overflow-y: hidden`** at
800x600 — 126px of graph gone, no scrollbar anywhere, and NOTHING
GOES RED (the lane has no assertion about canvas height and jsdom has
no layout). Bounding the frame without this fix is how a quarter of
the map disappears silently. Read with T-034-s1: the tasks lens
inherits this canvas verbatim, and wave 0 is 32+ cards tall.

## Acceptance criteria
- THE SHELL SHALL HAVE ONE SCROLL MODEL: `main` and the column
  bounded unconditionally, so T-048's conditional collapses back to
  one class and `app/test/shell-frame.test.tsx`'s scoping pin is
  rewritten to pin the single model instead.
- `PaneRail` SHALL survive the bound — its own `h-screen` or
  `sticky top-0`. Measured today: as a stretch-height sibling of the
  column it goes 2202px to 720/600px under an unconditional
  `h-screen`, so the sidebar strip and its right border stop at the
  fold while the page still scrolls to 2202.
- THE BOARD SHALL OWN A SCROLL REGION — the same
  `min-h-0 flex-1 overflow-y-auto` idiom the pane and the map already
  use — so app chrome stops scrolling away.
- THE MAP CANVAS SHALL SCROLL RATHER THAN CLIP: `overflow-auto` in
  place of `overflow-hidden`. It changes nothing today (the canvas is
  never smaller than its content today) and it is what makes the
  bound safe. Fit-to-frame is explicitly NOT taken: T-012's layout is
  deterministic and pinned, and rescaling is a design decision
  (T-048-s2).
- A LANE ASSERTION SHALL CONVERT THE SILENT FAILURE INTO A LOUD ONE:
  read `map-canvas-grid`'s `scrollHeight` against `clientHeight` at a
  small viewport and fail if content is ever hidden with no scroll
  region below it.
- THE NO-PLAN CARD SHALL FIT at the window T-051 ships and SHALL BE
  MEASURED at the declared minimum, remedy 1 first (trim the
  empty-state section's `py-12`, tokens-only, buys back more than the
  63px needed). **T-048-s4's correction rides with it and SHALL be
  recorded so nobody treats this as an alarm**: at 800x600 the page
  is 663/600, but `start-interview-here` sits at top 524 / bottom 556
  and the convention footnote's bottom is 590 — **nothing readable
  and nothing clickable is below the fold**; the 63px is the
  section's bottom padding plus 15px of the card's painted panel.
  T-048-s3's prose ("the button and the footnote sit below the fold")
  does NOT reproduce (T-048-s3 + T-048-s4).
- IF T-051's new default makes the no-plan card fit outright THEN the
  padding trim SHALL still be evaluated at the declared MINIMUM and
  the notes SHALL record whether it was needed — "the bigger window
  hides it" is not the same as "it fits".
- THE MEASUREMENT TABLE SHALL BE THE FORM OF THE PROOF, in T-048's
  own idiom: every screen (front door, no-plan, board, map, genesis)
  at the new default, at the declared minimum, and at 800x600, page
  height against viewport, before and after.
- ZERO new tokens; tokens-only styling; both schemes.

Verification: headless — served-bundle geometry probes through
T-041's shell harness in the tools/e2e lane, plus
`app/test/shell-frame.test.tsx`. @human: whether one bounded frame
feels right — a desktop app whose header scrolls away is unusual, and
that judgment is not a measurement.

## Implementation notes

Executor `claude-opus-5 @fresh`, 2026-08-18, branch
`task/T-062-frame-holds` (worktree `../nputer-T-062`), cut from
**`f94dd9c`** — T-063's checkpoint, a current graph and no inherited red
(the DISPATCH-FROM-THE-LAST-CHECKPOINT bullet, honoured). Port
discipline: **1420 was never bound, connected to or signalled** — the
only interaction was read-only `lsof`, run at session start, before the
boot gate and at the end, **one listener every time, node pid 82549,
unchanged**. Scratch ports **16200** (lane + measurement rig) and
**16201** (boot gate), both bind-probed free before use and both
`lsof`-empty afterwards. No `npm install`/`npm ci` was run anywhere in
`/Users/ujju/Projects/nputer`; this worktree had no `node_modules` and
was installed in ADR-011 order (parser `npm ci` + build, then app, then
tools/e2e — all three `0 vulnerabilities`).

### WHICH OF THE CARD'S CITED NUMBERS REPRODUCED — every one was checked

**REPRODUCED EXACTLY:**

- **`MapView.tsx:552`** is `min-h-0 flex-1 overflow-hidden` on
  `map-canvas-grid`. The card's own correction (`:490` → `:552`) is
  right and the line had not moved again.
- **`acl_pin.rs` whole-file sha256 `8d24cbad706d9e6f…`** — identical.
  Untouched by this task; **92 grants**, no new IPC command, no new
  grant. `generate_handler!` is a 0-file diff.
- **T-048-s4's whole correction, to the pixel.** At 800x600 the no-plan
  page is **663/600**; `start-interview-here` sits at **top 524 /
  bottom 556**; the convention footnote's bottom is **590**. Nothing
  readable and nothing clickable is below the fold. And the 63px
  decomposes exactly as s4 says: the `max-w-150` card runs **115..615**
  (T-048's own "card 115+500", reproduced), so **615..663 is the
  section's 48px `py-12` bottom padding** and **600..615 is 15px of
  painted panel**. 48 + 15 = **63**. **T-048-s3's prose does NOT
  reproduce and s4 is right.**
- **The rail is a stretch-height sibling that runs the whole document**,
  and a bound collapses it to the fold — the mechanism reproduced
  exactly.
- **The map canvas clips silently under a bound with nothing red** —
  reproduced by deliberately building the trap (below).
- **The eleven pre-existing `map-node` buttons** at 92/64 `hidden`, the
  same set T-048 recorded.

**DID NOT REPRODUCE — three, all numeric, all recorded rather than
quietly used:**

1. **`App.tsx:472` is now `App.tsx:495`** (and `boundedFrame` was
   declared at `:478`). The card re-verified this line at triage; it
   moved again between triage and dispatch.
2. **The canvas reads 446/392, not 446/320.** Bounding the frame with no
   other fix hides **54px** of graph at 800x600, not 126px. The
   `scrollHeight` 446 is exact; the `clientHeight` moved with the map's
   pane header since T-048. **The mechanism is the constant and the
   number is not** — this is the twelfth-ish instance of the standing
   pattern, and the strongest form of it yet, because 446 reproduced and
   320 did not *in the same measurement*.
3. **The rail's 2202 → 720/600 is now 4989 → 840/700/600.** The board
   grew (2202px was T-048's tree; this repo's docs/ tree renders 4989px
   today). The shape of the claim is exactly right.

### The trap, reproduced on purpose before anything was built

The card's central warning is that bounding the frame without fixing the
canvas deletes graph silently. That was not taken on trust. The
unconditional `h-screen` was applied to the column ALONE — T-048's own
rejected variant — and measured:

| screen @ 800x600 | page/vp | main | rail | map-canvas |
|---|---|---|---|---|
| board | **4989/600** | 600 | **600** | — |
| map | **600/600** | 600 | 600 | **446/392, `overflow-y: hidden`** |

`map-canvas` joined the clipping set **only** under that variant, exactly
as T-048 recorded — and **the whole suite stayed green**: app 821/821,
lane 77/77. That is the silent failure, reproduced first-hand. It was
then reverted and `App.tsx` proved restored by sha256 against
`git show HEAD:app/src/App.tsx` before a line of the real fix was
written.

### THE MEASUREMENT TABLE — every screen, three viewports, before and after

Rig: the REAL dev bundle on scratch port 16200, headless Chromium,
driven through **T-041's `__nputerShellHarness` + `__nputerDocsHarness`**
— no IPC faked, no source patched. The board and map are driven by
**this repo's own `docs/` tree** (the tallest real board available,
graph included so the canvas is a real one); the interview by
`streakMidInterview`; the front door and no-plan card by their own
statuses. The BEFORE column was re-measured with the identical probe by
stashing the working tree, so every field is comparable.

Viewports: **1280x840** (T-051's shipped default), **1024x700** (its
declared minimum), **800x600** (T-048's baseline and the size the app
used to open at).

| screen | viewport | page/vp BEFORE | page/vp AFTER | rail B → A | that screen's scroll region B → A |
|---|---|---|---|---|---|
| front door | 1280x840 | 840/840 | 840/840 | — | 773/773 `visible` → 773/773 **`auto`** |
| front door | 1024x700 | 700/700 | 700/700 | — | 633/633 `visible` → 633/633 **`auto`** |
| front door | 800x600 | 600/600 | 600/600 | — | 533/533 `visible` → 533/533 **`auto`** |
| no-plan | 1280x840 | 840/840 | 840/840 | — | 773/773 `visible` → 773/773 **`auto`** |
| no-plan | 1024x700 | 700/700 | 700/700 | — | 633/633 `visible` → 633/633 **`auto`** |
| no-plan | 800x600 | **663/600** | **600/600** | — | 596/596 `visible` → **596/533 `auto`** |
| board | 1280x840 | **4989/840** | **840/840** | **4989 → 840** | none → **4879/730 `auto`** |
| board | 1024x700 | **4989/700** | **700/700** | **4989 → 700** | none → **4879/590 `auto`** |
| board | 800x600 | **4989/600** | **600/600** | **4989 → 600** | none → **4879/490 `auto`** |
| map | 1280x840 | 840/840 | 840/840 | 840 → 840 | 666/666 `hidden` → 666/666 **`auto`** |
| map | 1024x700 | 700/700 | 700/700 | 700 → 700 | 526/526 `hidden` → 526/526 **`auto`** |
| map | 800x600 | **654/600** | **600/600** | 654 → 600 | 446/446 `hidden` → **446/392 `auto`** |
| genesis | 1280x840 | 840/840 | 840/840 | — | 792/720 `auto` → 792/720 `auto` |
| genesis | 1024x700 | 700/700 | 700/700 | — | 876/580 `auto` → 876/580 `auto` |
| genesis | 800x600 | 600/600 | 600/600 | — | (lens below `lg`) → unchanged |

**AFTER, every screen and every viewport: `page == viewport`.** One
scroll model, and the page is never the thing that scrolls.

**THE GENESIS ROW IS BYTE-IDENTICAL BEFORE AND AFTER, on every field.**
That is the check that the one screen T-048 already bounded was not
disturbed by making its treatment the rule — and it re-confirms T-048's
finding that bounding `main` as well is costless on that screen.

**The no-plan card's own geometry is byte-identical too** — card
327+288, button 524..556, footnote 590 at 800x600 — so the front door
was not redesigned in passing. Only its overflow behaviour moved.

### Criterion 6 and 7 — the padding trim was EVALUATED AND NOT TAKEN

The criterion asks for remedy 1 (trim `py-12`) and the triage's added
criterion says it must be evaluated **at the declared minimum** even if
the bigger window hides the problem. Measured at **1024x700**, the
declared minimum:

    no-plan card BEFORE: page 700/700 · card 345.5+288 · button 542.5..574.5
                         · footnote bottom 608.5

**It already fits, with 91px to spare below the footnote, and it fits
before this task changes anything.** The 663px figure is a fact about
800x600 — which is BELOW the declared minimum and unreachable in the
shipped app since T-051. So the trim was not needed at the minimum, and
`py-12` is **unchanged**: trimming padding that costs nothing would be a
design change with no measurement behind it. "The bigger window hides
it" is not why — **the minimum window does not hide it either**, and
that is the figure the criterion asked for.

What the card DOES get instead is the thing that actually makes 800x600
safe: the front door is now a scroll region (596/533 `auto`), so the
63px is reachable rather than merely off-page.

### What shipped, and why the front door needed a third level

    app/src/App.tsx           main:   `flex min-h-screen` -> `flex h-screen`
                              column: cn(bounded ? h-screen : min-h-screen)
                                      -> `flex h-screen min-w-0 flex-1 flex-col`
                              board:  + `min-h-0 flex-1 overflow-y-auto`
                                      (data-testid="board-scroll")
                              EmptyState + StartupScreen: the section
                                      becomes `min-h-0 flex-1 overflow-y-auto`
                                      and its card is centred by AUTO MARGINS
    app/src/components/shell/PaneRail.tsx   + `h-screen`
    app/src/architecture/MapView.tsx        overflow-hidden -> overflow-auto

`cn` became unused in `App.tsx` and its import was dropped (tsc caught
it, TS6133).

**AUTO MARGINS RATHER THAN `justify-center`, and the reason is the whole
card in miniature.** `items-center`/`justify-center` centres a child that
is too big by overflowing it **equally at both ends**, and the top half
is then unreachable no matter what scrolls — the browser cannot scroll
above the origin. Auto margins resolve to zero when free space runs out,
so the card centres while it fits and scrolls from its first pixel when
it does not.

**AND THE PADDING NEEDED A LEVEL OF ITS OWN — measured, not designed.**
The first version moved `px-10 py-12` onto the `max-w-150` card. The app
is border-box, so that narrowed the text to 520px and reflowed the
screen: **the front door's panel grew from 100px to 118px** at every
viewport. The padding now rides a middle `my-auto flex justify-center
px-10 py-12` level, and the card's measured geometry is byte-identical
to before (509.5+100 / 439.5+100 / 389.5+100). It is not on the scroll
container either, because a scroll container's trailing padding is not
reliably part of its scrollable area.

### The lane assertion — the class, not the instance

**`tools/e2e/tests/shell-frame.spec.ts`** (new, 5 executions from 3
bodies). The criterion asks for "read `map-canvas-grid`'s `scrollHeight`
against `clientHeight` at a small viewport and fail if content is ever
hidden with no scroll region below it". It is written as a **whole-page
sweep** rather than a canvas assertion: at each of the three viewports,
on each of the five screens, every element whose `scrollHeight` exceeds
its `clientHeight` and whose computed `overflow-y` is `hidden`/`clip` is
collected, **deduped by name**, and compared to an exact expected set —
`["map-node"]` on the map, `[]` everywhere else. The canvas was one
instance of a class; pinning the instance would not catch the next one.

Deduped by NAME rather than counted deliberately: a count is coupled to
the graph's component count and would red on an unrelated regen.

Plus the criterion's own assertion, at 800x600, with its **premise
asserted first** — `scrollHeight > clientHeight`, so the test cannot
pass on a canvas that never had to scroll, which is exactly the state
that hid this defect for two tasks.

### Reconciles — three suites asserted the OLD model, and one was worse

- **`app/test/shell-frame.test.tsx`** — the scoping pin rewritten to pin
  the single model (criterion 1). Its chain walk (test 4) is
  **byte-unchanged**.
- **`tools/e2e/tests/interview.spec.ts`** — T-027's "the other screens
  are untouched" block required the front door, board and map columns to
  be UNBOUNDED. Flipped, and **strengthened rather than inverted**: each
  screen is now also asked for the scroll region the bound makes
  necessary, read off COMPUTED style. A bare `false` → `true` flip would
  have left a test that says nothing.
- **`tools/e2e/tests/window-contract.spec.ts`** — two reconciles, and
  **the second is a finding in its own right**:
  - the board block required `page > 2x the window`; that guard moved
    one level in, to the board's own scroll region, which is what it was
    ever actually claiming. The rail assertion moved from "runs the
    whole page" to "is the window".
  - **`naturalHeight` WAS ALREADY HALF-BLIND, and T-062 would have made
    it fully vacuous.** It read `document.documentElement.scrollHeight`,
    which only works for a screen that can push the page open — so it
    never worked for genesis, bounded since T-048. **Measured on the
    pre-T-062 tree it reports 302 for a screen whose content is 1082
    tall.** The one screen T-051 raised the window FOR was the one its
    floor probe could not see. Under T-062 all five would have reported
    the viewport and the test would have passed measuring nothing. It
    now reads CONTENT, and **reproduces the old probe exactly on the
    pre-T-062 tree for all four screens it could measure** — front door
    475, no-plan 663, board 4989, map 620 — while additionally answering
    1082 for genesis. Filed as **T-062-s1**, because the CLAIM the old
    assertion made ("minHeight sits above every fitting screen's natural
    content") is false for genesis and is not something this task can
    settle.

### The poison drill — SIX REVERTS AND TWO THREE-LIMB MUTATIONS

Every drill ran **inline, no scratch script**. Restoration proved by
sha256 against the branch commit, never by a clean `git status`.

**REVERTS — does the coverage catch each half of the fix?**

| # | revert | jsdom | lane |
|---|---|---|---|
| R1 | `main` back to `min-h-screen` | **3 of 4 RED** | **0 of 16** |
| R2 | column back to `min-h-screen` | **3 of 4 RED** | **1 RED** |
| R3 | canvas back to `overflow-hidden` | **1 RED** | **6 RED** |
| R4 | rail loses its own `h-screen` | **1 RED** | **0 of 10** |
| R5 | board loses its scroll region | **1 RED** | **7 RED** |
| R6 | front door loses its scroll region | **1 RED** | **3 RED** |

**R3 IS THE CARD'S WHOLE POINT AND IT LANDS**: reverting the canvas
reds six lane tests, and the generic sweep names the failure in the
words the criterion asked for — *"map: a box is hiding content with no
way to scroll to it"*. Before this task the same revert was invisible.

**R1 AND R4 ARE THE INTERESTING NEGATIVE RESULTS, recorded because they
justify keeping the jsdom pins.** Neither moves the lane at all: with
the column still `h-screen`, `main` resolves to 100vh anyway, and the
rail stretches to the same height whether or not it says so. **Geometry
cannot distinguish "bounded because it says so" from "bounded because
its sibling is"** — only the class assertions can, which is exactly
T-048's argument re-proved from the other side. Neither class is
redundant; both are unfalsifiable by measurement alone.

**MUTATIONS — all three limbs, on two different assertion families.**

| drill | mutation | subs | one-sided? | breaks the relation? | result |
|---|---|---|---|---|---|
| **A1** | `overflow-auto` → `overflow-scroll` in `MapView` **and** `toBe("auto")` → `toBe("scroll")` at all three assertion sites | 4, all correct | **NO** | n/a | **16 passed — GREEN** |
| **A2** | `toBe("auto")` → `.not.toBe("visible")`, assertion side only | 1, correct | **yes** | **NO** — "auto" is not "visible" | **5 passed — GREEN** |
| **A3** | `overflow-auto` → `overflow-hidden`, source only | 1, correct | **yes** | **YES** | **RED, 2 of 5** |
| **B1** | `REGION_FLOOR` 250 → 1 **and** its pin `toBe(250)` → `toBe(1)` | 2, both correct | **NO** | n/a | **5 passed — GREEN** |
| **B2** | `toBeGreaterThanOrEqual(REGION_FLOOR)` → `(1)`, assertion only | 1, correct | **yes** | **NO** — 490 > 1 still holds | **5 passed — GREEN** |
| **B3** | `REGION_FLOOR` 250 → 1, pin left alone | 1, correct | **yes** | **YES** | **RED, 1 of 5** |

**A1 reproduces the four-substitution green poison** on a new assertion
family (a computed-style equality) — T-054 measured it on a `toContain`
needle and T-063 on a numeric constant. **A2 is a third independent
shape of the "one-sided but relation-preserving" limb**: T-054's was a
needle that stayed a substring, T-063's a loosened inequality, this one
**an equality widened to an inequality**. Same conclusion each time:
one-sidedness is necessary and not sufficient.

**B EXPOSED AN OVERCLAIM IN MY OWN COMMENT AND IT WAS CORRECTED RATHER
THAN LEFT.** I had written that `REGION_FLOOR`'s value is "pinned
against an INDEPENDENT source — the shipped manifest". **It is not.**
`expect(REGION_FLOOR).toBe(250)` is a literal in the same file, and B1
proves it: move both together and everything is green. There is no
runtime source for T-048-s5's ~250px — it is a historical measurement.
The comment now says exactly what the pin buys (a second, VISIBLE edit
rather than one silent character) and explicitly says it is not
independence.

**EVERY CHANGED OR NEW TEST BODY WAS OBSERVED RED.** Nine bodies —
three in `shell-frame.test.tsx` (the chain walk is byte-unchanged and is
therefore not owed a drill), three in `shell-frame.spec.ts`, one in
`interview.spec.ts`, two in `window-contract.spec.ts` — and each went
red in at least one drill above. That is stronger than a `PROBE`
injection, which proves a body runs but not that its assertions
discriminate.

**RESTORATION PROVED BY sha256** after every drill, against
`git show HEAD:<path>`. All seven files verified back to their branch
values at the end.

### The one behaviour change I did NOT expect, measured and filed

**The card says `overflow-auto` "changes nothing today". On the map,
that is not quite true, and I measured it rather than repeating it.**
The canvas already pans on wheel (`onWheel` translates the transform).
With native overflow scrolling on the same box, one 300px wheel at
800x600 now moves the graph **354px** — transform `-300px` **and**
`scrollTop` 54 — because React's wheel listener does not (and at the
root cannot easily) `preventDefault`. It is bounded by the small
overflow (54px is the entire scrollable range there) and it is strictly
better than deleting the content, so it ships; but it is a real
interaction wrinkle and it is **T-062-s2**.

### Suites — all first-hand in this worktree, none piped through `tail`

| suite | result | derivation |
|---|---|---|
| lib/parser | `npm run build` exit 0, `tsc --noEmit` exit 0, **225/225 (11 files)** | main's 225/11 + **0** parser files in this diff |
| app | `tsc --noEmit` exit 0, `npm run build` exit 0, **821/821 (42 files)** | main's 821/42 + **0** new `it()` — `shell-frame.test.tsx` stays at 4 declarations (bodies rewritten, none added) |
| app/src-tauri | bare `cargo test` → **318 passed + 3 ignored, 0 failed**, exit 0, **zero compiler warnings** | main's 318 + **0** Rust files. Summed over **15 targets**, per-target **113/0/0/46/123/0/7/13/3/7/0/2/4/0/0** — identical to T-063's in all fifteen positions |
| tools/e2e | `npm run typecheck` exit 0, **82 passed in 17.3 s**, one worker, retries 0, no skips, no flakes | main's 77 + this branch's **5**: one loop-wrapped `test(` over a 3-entry `VIEWPORTS` (**3**) plus **2** at column 0 |
| `lint:tokens` | `clean (117 files scanned)`, exit 0, **zero allowlist** | main's 116 + the **one** new file (`shell-frame.spec.ts`) |
| `lint:tokens -- --selftest` | **49 samples green, 14 walk-policy checks green** | unchanged |

**A TRAP FOR THE NEXT PERSON READING A CARGO LOG**: `grep -c warning`
returns **1** on a clean run — it matches the TEST NAME
`warnings_and_unknown_event_types_do_not_fail_the_turn`. There are zero
compiler warnings.

**THE BUNDLE.** `index-tsWZtfZi.js` **498.88 kB** (was `index-DN-TbnBr.js`
498.72 kB) and `index-BeT5MY7f.css` **43.90 kB** — the CSS byte count is
unchanged but **its hash moved**, which is the right shape: this diff
changes Tailwind utility usage (`overflow-auto`, `h-screen`, `min-h-0`,
`m-auto` in new places) without adding a token or a rule.

### Fence

`git diff f94dd9c --stat` is **13 files**: three source, four test, this
card and **five findings**. **CORRECTED BY THE INTEGRATOR (2026-08-18),
because an integrator runs this paragraph verbatim.** "Eight files" was
never true of any range: it is three source + four test + this card, and
it counted the card while the commit that carried it (`d40d76a`) also
carried T-062-s1 and T-062-s2. The three measurable ranges are
`f94dd9c..09127fa` = **7 files** (code only, no card), `f94dd9c..d40d76a`
= **10 files, 1290+/146−** (the executor's two commits — the figure the
VERDICT quotes, correctly, because that was HEAD when it was written),
and `f94dd9c..HEAD` = **13 files, 1780+/149−**, HEAD being the verifier's
own verdict commit `09b9af3`, which added T-062-s3, s4 and s5. **The
seven CODE files are unchanged across all three ranges**, so every
measurement in this card stands; only the count moved. **Zero diff**
under `app/src-tauri/**` (`acl_pin.rs`
whole-file sha identical, `generate_handler!` untouched, no new IPC
command, no new grant), `lib/parser/**`, `method/**`,
`docs/architecture/graph.json` (**deliberately not regenerated — the
integrator's ritual, performed at the checkpoint: 115 files unchanged,
964→965 symbols, 1477→1476 edges**). **The branch forecast was incomplete
in one place:** `expectBoundedFrame` is a new function symbol and adds
one call edge; removing `cn` from `App.tsx` removes its file import edge
and its symbol call edge, so the measured net is **+1 symbol / −1 edge**.
No component relation row moves and no dogfood fixture needs editing.
`docs/CONVENTIONS.md`, `tauri.conf.json`,
`capabilities/**`, `.github/**`, and every lockfile and manifest. **Zero
new tokens, zero arbitrary values, no `innerHTML`, no new dependency, no
model call.** Both schemes: this diff touches no colour, so light and
dark are structurally unaffected — and the token lint is what says so.

**The charset habit, in its corrected form**: `file --mime` over all
seven code files returns **`charset=utf-8`** for every one (the type
LABEL says `text/x-java`, which is exactly why the label is retired as a
test), and a C0 sweep excluding tab, LF and CR returns **0 bytes** in
all seven.

### BOOT GATE — FIRES, and it passes

Trigger classes measured separately against `f94dd9c..HEAD`:
**`app/src/**` = 3 · `app/src-tauri/**` = 0 · `app/package.json` = 0 ·
`app/src-tauri/Cargo.toml` = 0.** Run on scratch port **16201**,
bind-probed free first:

    [boot-check] port 16201 free — spawning `npm run tauri dev -- --config …`
    [boot-check] NPUTER_BOOT_PORT=16201 — threading --config …
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-062
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)

**THE ABOVE IS THE SCRIPT'S VERBATIM OUTPUT AND IT CONTAINS NO EXIT
CODE.** The gate's exit status was **0**, and that figure is **my own
`echo $?`, run separately and labelled as such**. Both `[nputer]` lines
detected. No listener survived on 16200 or 16201 afterwards, and no
process of this worktree's remained.

### For the integrator — the graph forecast, NOT regenerated

**`docs/architecture/graph.json` is a 0-file diff on this branch**, per
the dispatch: the regen is the integrator's ritual. The GRAPH REGEN
trigger **fires** (this diff carries `*.tsx`/`*.ts` outside `docs/`), so
here is what to expect, derived rather than measured:

- **Five `*.ts`/`*.tsx` files in the diff, of which FOUR are indexed**:
  `app/src/App.tsx`, `app/src/architecture/MapView.tsx`,
  `app/src/components/shell/PaneRail.tsx`, `app/test/shell-frame.test.tsx`.
  The fifth, `tools/e2e/tests/shell-frame.spec.ts`, is under `tools/`
  and is **not** walked — so **`fileComponent.size` should stay at 115**
  and there should be zero `+` and zero `-` files.
- **ONE import edge disappears**, and it is the only structural
  movement I can see: `App.tsx` lost `import { cn } from "@/lib/utils"`
  (it became unused when the conditional collapsed; `tsc` caught it as
  TS6133). **`app/src/lib/utils.ts` and `app/src/App.tsx` are BOTH
  C-05's** (`docs/architecture/components/C-05-app.md:16` claims
  `app/src/lib/utils.ts`), so this is an **intra-component** edge: it
  should move the file-level edge list and **no component relation row**.
  `PaneRail.tsx` and nine other files still import `@/lib/utils`, so the
  file itself keeps its inbound edges.
- **No new symbol and no removed symbol**: nothing here adds or deletes
  a function, component or export. The four indexed files should come
  back as `~` (hash/loc) only.

So the expected fixture delta is **none** — but that is a forecast, not
a measurement, and the standing rule is to enumerate `fileComponent`,
`findings`, `edges` and drift with a probe BEFORE editing any fixture
rather than trusting this paragraph.

### For the verifier — what I would look at first

- **THE ONE @HUMAN JUDGMENT, and the card says so itself: whether one
  bounded frame FEELS right.** A desktop app whose header never scrolls
  away is the intent, and it is unusual for a page that used to be a
  page. No measurement settles it. **Everything below the fold on the
  board now lives inside a region with its own scrollbar** — that is a
  visible change to a screen @human uses daily and it is theirs to
  judge, in light and dark, at 1280x840 and at 1024x700.
- **T-062-s1 is the finding I would read first.** T-051's minHeight
  criterion was never verified for the genesis screen, and the corrected
  probe now says that screen wants 1082px against a declared floor of
  700. Under one scroll model that is legal — but it is a live question
  about the floor, not a settled one.
- **The map wheel (T-062-s2)** is the only behaviour regression in the
  diff and it is small, bounded and deliberate. If you disagree, the
  alternative is a non-passive wheel listener, which is a bigger change
  than this card's fence.
- **R1 and R4's empty lane columns** are the argument for keeping the
  jsdom class pins. If you think the class assertions are redundant with
  the geometry ones, reproduce those two rows before ruling.
- **`REGION_FLOOR`'s pin is not independence** and its comment now says
  so. If you want a genuinely independent floor, it needs a source the
  app reports, and there isn't one.

## Verdicts

2026-08-18 — claude-opus-5 @fresh (verifier, same-model as builder): **APPROVED**

Range **derived, not quoted**: `git merge-base HEAD main` =
`f94dd9c372f720c81b9c7707114169cc2da18f9a`, so `f94dd9c..HEAD` = **two**
commits `09127fa`, `d40d76a` — **10 files, 1290+/146−** (not the eight the
Fence claims; see the corrections below). Worktree `nputer-T-062`. Scratch
ports **16400** (lane + every measurement run) and **16401** (boot gate),
both bind-probed free before use and both `lsof`-empty afterwards. **1420
was never bound, connected to or signalled** — read-only `lsof` at session
start and at the end shows exactly the human's one listener, node pid
**82549**, `[::1]:1420`, unchanged. `../nputer-T-060` untouched. No model
calls, no screen control (the boot gate opens the app's own window; it
injects no input and takes no screenshot).

**THE DISCLOSURE CHECKS OUT.** All ten files in the range are byte-identical
to `git show HEAD:<path>` by sha256, and `git status --porcelain -uall` is
empty. Nothing is lost or half-restored. I made the same hazard visible
from the other side: my own drills used `git checkout f94dd9c -- …`, which
**stages**, and left six paths reading `MM` even with the worktree back to
HEAD — a clean-looking `git diff` and a dirty index. Only `git reset` cleared
it. Every one of my restores was proved by sha256 against
`git show HEAD:<path>`, never by a clean `git status`.

### Criterion by criterion, and how

| # | criterion | verdict | how I checked it |
|---|---|---|---|
| 1 | ONE SCROLL MODEL — `main` and the column bounded unconditionally, the scoping pin rewritten | **holds** | `main` is `flex h-screen`; the column is `flex h-screen min-w-0 flex-1 flex-col`; `boundedFrame` and the `cn` import are gone (`tsc --noEmit` exit 0 on all three packages). The pin is rewritten to `expectBoundedFrame`, asserting BOTH `h-screen` present and `min-h-screen` absent on both elements. R1 (`main` back to `min-h-screen`) → **3 of 4 jsdom RED**; R2 is the column's half. Measured on the served bundle: `page == viewport` on all five screens at all three viewports (front door / no-plan / board / map / genesis at 1280x840, 1024x700, 800x600) — **15 of 15**. The BEFORE column reproduces too: board **4989/840, 4989/700, 4989/600**, no-plan **663/600**, map **654/600**. |
| 2 | `PaneRail` survives the bound with its own `h-screen` | **holds** | `h-screen` on the `<nav>`. Measured: rail **4989** before (the whole document) → **840/700/600** after, and `toBeInViewport` after a 3000px wheel. R4 (rail loses `h-screen`) → **1 jsdom RED**. |
| 3 | THE BOARD OWNS A SCROLL REGION | **holds, with a reachable exception — T-062-s3** | `board-scroll` carries `min-h-0 flex-1 overflow-y-auto`; measured **5139/730, 5139/590, 5139/490** over this repo's own tree, page stays 840/700/600, wordmark and rail stay in viewport after a real wheel. R5 is the executor's; I confirmed the region and the chrome first-hand. **The exception is filed, not waved**: see T-062-s3 below. |
| 4 | THE MAP CANVAS SCROLLS RATHER THAN CLIPS | **holds** | `overflow-auto`. Measured **446/392 `auto`** at 800x600 and the last pixel reachable with the page not moving. I reproduced the TRAP first-hand on the pre-task tree (`boundedFrame = true`, T-048's rejected variant): the sweep picks up `map-canvas 446/392` with `overflow-y: hidden` at 800x600 and nowhere else. |
| 5 | A LANE ASSERTION CONVERTS THE SILENT FAILURE INTO A LOUD ONE | **holds** | R3 (canvas back to `overflow-hidden`) → **6 lane RED**, and the sweep's message is verbatim what the criterion asked for: `Error: map: a box is hiding content with no way to scroll to it`. The premise assertion is real (`scrollHeight > clientHeight` before the overflow check), so it cannot pass on a canvas that never had to scroll. **Two honest limits, both filed**: the sweep's exactness is one matcher away from vacuity (T-062-s5) and its five-screen menu misses the board state in T-062-s3. |
| 6 | THE NO-PLAN CARD FITS, and T-048-s4's correction is recorded | **holds — reproduced to the pixel** | Pre-task tree at 800x600: page **663/600**; `.max-w-150` **115..615** (500 tall); `start-interview-here` **524..556**; convention footnote bottom **590**; panels **115+104 / 251+44 / 327+288**. So 615..663 is the section's **48px** `py-12` bottom padding and 600..615 is **15px** of painted panel — **48 + 15 = 63**, and nothing readable or clickable is below the fold. **T-048-s3's prose does not reproduce; s4 is right.** Every one of those figures is byte-identical on the post-task tree, so the front door was not redesigned in passing. |
| 7 | IF the new default makes it fit THEN the trim SHALL STILL be evaluated AT THE MINIMUM and the notes record whether it was needed | **holds — "evaluated and declined" satisfies it, and I checked the number** | The criterion's verb is *evaluated* and *recorded whether it was needed*, not *taken*; "remedy 1 first" ranks remedies, it does not mandate one. Measured at 1024x700 myself: page **700/700**, card **345.5+288**, button **542.5..574.5**, footnote bottom **608.5** — **91.5px of clearance**, and the section reads `633/633 auto`, not engaged. The card fits at the declared minimum before this task changes anything, so the trim would have been a design change with no measurement behind it. The 663/600 figure is a fact about 800x600, which is below the declared minimum. **Criterion met; had the notes said only "the bigger window hides it", it would not be.** |
| 8 | THE MEASUREMENT TABLE IS THE FORM OF THE PROOF | **holds, with one drift the integrator should expect** | I re-measured every cell independently with my own probe against the same rig. Every BEFORE and AFTER field reproduces, **including the genesis row byte-identical on both sides** (792/720 at 1280x840, 876/580 at 1024x700, lens absent below `lg`). **The board figures are the one exception and the cause is the card itself**: the table's `4879`/`4989` were measured at commit `09127fa`, and commit `d40d76a` added 588 lines of docs to the tree the board renders. On today's tree the same probe reads **5139** and **5249**. Re-measured against `f94dd9c`'s docs tree (extracted with `git archive`) it is **4989 exactly**. The number is right for the tree it was taken on; it is not reproducible from the final tree, and that is worth one sentence for whoever re-runs it. |
| 9 | ZERO new tokens, tokens-only, both schemes | **holds** | `lint:tokens` → `clean (117 files scanned)`, exit 0, **zero allowlist** (the script has none by design). Every added `className` in the diff is layout-only: `h-screen`, `min-h-0`, `flex-1`, `overflow-y-auto`, `overflow-auto`, `my-auto`, `flex-col`, `justify-center`, `px-10 py-12`. **Zero** CSS custom properties added anywhere in the diff, zero arbitrary values, no colour utility moved — so light and dark are structurally unaffected, and the token lint is what says so. `lint:tokens -- --selftest` unchanged. |

### The centring change — REPRODUCED, and the reasoning is exactly right

This was the claim most likely to be subtly wrong, so I tested it the way
the brief asked: shrink the viewport under the card and try to reach its
top. Shipped (`my-auto`), front door and no-plan, 800x{600,420,320,240,200}:
at `scrollTop = 0` the card's top is **+48px inside** the section on every
size, and scrolling to the end lands exactly on its bottom padding. The
whole card is reachable at every size.

Then I mutated the SAME live page to `items-center justify-center` and
re-measured. Front door at 800x320: the card's top sits at **−29.5px** —
*above* the scroll origin — and after scrolling to the maximum it is at
**−107.5**. At 800x200 it is **−89.5** and **−227.5**. No-plan at 800x420:
**−73.5**. The scroll extent shrinks with the mutation (408 → 331 at
800x320) precisely because overflow above the origin is not scrollable.
**The claim is not merely defensible, it is demonstrable: with
`justify-center` the top of an oversized card cannot be reached at any
scroll position.** The three-level structure (scroll container / `my-auto`
padded middle / border-box card) is measured, not styled: the card's own
geometry is byte-identical before and after.

### T-062-s1 — verified exactly, and the 700 question ANSWERED

I reproduced the whole finding on the pre-T-062 tree, both probes side by
side at 1024 wide and 200 tall:

| screen | old probe (`documentElement.scrollHeight`) | new probe (content) |
|---|---|---|
| front door | **475** | **475** |
| no-plan | **663** | **663** |
| board | **4989** | **4989** |
| map | **620** | **620** |
| **genesis** | **302** | **1082** |

Four screens agree to the pixel; genesis is off by **780**. The probe did
read the document, it did report 302 for a screen whose content is 1082,
and the one screen T-051 raised the window FOR was the one its floor probe
could not see. **Confirmed.**

**DOES 700 STILL HOLD? Yes — but NOT for the reason T-051 gave, and the
reason it gave is now demonstrably false.** T-051 justified 700 as "the
tallest natural content is the no-plan card at 663, so 700 clears it by
37px". That was never true: genesis wanted ~1082 at the time it was
written, and the board 4989. The premise "700 clears the tallest screen"
is false by 382px on one screen and by 4289 on another. What makes 700
defensible TODAY is the property T-062 created and `window-contract.spec.ts`
now asserts: every screen owns a scroll region, so "fits" stopped being
the requirement and "the leftover region is usable" replaced it. Measured
at the declared minimum, the tightest non-form region on any screen is
**580px** (the genesis lens, 876/580) with `board-scroll` at 590 — both far
above T-048-s5's 250px floor. **So: the number survives, its justification
does not, and the reconciled test is the first thing in the repo that
checks the property the number actually has.** Two caveats for whoever
takes s1: (a) the new probe SUMS side-by-side regions, so genesis's 1082 is
84px of chat log plus 796px of lens plus 2px of textarea — the honest
"nothing needs to scroll" height is ~996, still 296 above the floor;
(b) the same probe does not exclude form controls while its neighbour
`tightestRegion` does, on a measured false-alarm argument — 2 of the 1082
is a `<textarea>`. Both are small; both make 1082 a ceiling rather than a
figure. Also: s1 says three lane helpers read `documentElement.scrollHeight`;
`git grep` **from the repo root** finds them in **four** files —
`crescendo.spec.ts:224` is the one not named.

### T-062-s2 — mechanism right, BOUND wrong, and I filed the correction

354px on one 300px wheel reproduces exactly (transform −300, `scrollTop`
54, max 54). But s2's "a small constant added to the pan, not a doubling"
and "at 1280x840 and 1024x700 the wheel behaves exactly as before" are
**Y-axis-only claims**. Measured on both axes: max `scrollLeft` is **0 /
152 / 376** at the three viewports, and `wheel(300, 0)` at 800x600 produced
`scrollLeft` **300** on top of a −300px pan — **an exact doubling**, capped
at +376, seven times the 54px s2 cites. At the DECLARED MINIMUM a
horizontal wheel moves the graph 452px instead of 300. Filed as
**T-062-s4**. It does not change s2's trade (deleting graph is worse) and
I do not disagree with shipping it — the alternative is a non-passive
wheel listener, which is outside this fence. It changes what the reader is
told the cost is.

### The three non-reproducing numbers — all three confirmed, and the half-reproduction explained

- **`App.tsx:472` → `:495`**: on the pre-task tree, line **495** is
  `cn("flex min-w-0 flex-1 flex-col", boundedFrame ? "h-screen" : "min-h-screen")`
  and `boundedFrame` is declared at **478**. Both figures exact.
  `MapView.tsx:552` reproduces exactly as the card says.
- **446/392, not 446/320**: reproduced by rebuilding the trap on the
  pre-task tree. **54px hidden, not 126.** The half-reproduction is not a
  curiosity, it has a cause worth stating: `scrollHeight` **446** is the
  graph's content height, and T-012's layout is deterministic and pinned,
  so it cannot drift; `clientHeight` is the canvas box, i.e. the viewport
  minus whatever chrome sits above and below it, and **nothing pins that**.
  The map's pane header moved 72px since T-048. **The two halves of
  "446/320" have different provenance — one is pinned by a spec, the other
  is a free variable — which is exactly why one held and one did not.**
- **2202 → 4989**: the rail measures 4989 on the pre-task tree with
  `f94dd9c`'s docs; 5139/5249 on today's, for the reason in criterion 8.

### The drills — re-derived, plus a correction and a fourth shape

- **R3 lands.** 6 lane RED, the sweep names it in the criterion's own
  words. **The invisibility claim also lands, with a correction to its
  count.** I rebuilt the trap (pre-task tree, `boundedFrame = true`) and
  ran both suites: **app 818/821 and lane 76/77 — not the "app 821/821,
  lane 77/77" the notes claim.** The reds are `T-048 the frame holds — and
  only where it should` (2, jsdom) and `the other screens are untouched by
  the restructure` (1, lane, message: *"the front door stays a scrolling
  page at 800x600"*), plus one build-staleness guard tripped by my own
  drill. **Every one of them is a "you bounded the wrong screen" red; not
  one is about the canvas.** So the load-bearing half — nothing anywhere
  catches 54px of graph disappearing — is exactly true, and the "whole
  suite stayed green" phrasing is not. Recorded rather than counted
  against: the claim it supports is unaffected.
- **R1 and R4 produce zero lane movement — confirmed, and I ran the FULL
  lane rather than a subset: 82 passed, 0 red, both times.** I judge the
  reasoning sound. Geometry cannot distinguish "bounded because it says
  so" from "bounded because its sibling is", and the honest statement of
  what R4's pin buys is narrow but real: the rail is correct today by
  flex stretch, which is a property of `main`, not of the rail. Any change
  that stops stretch applying — `items-start`, a wrapper, a shell offset —
  silently collapses the strip, and no measurement in the repo would see
  it. A pin geometry cannot see is worth having **when the property it
  pins is intent rather than outcome**, which is the case for both. What
  I would not accept is the same argument used to keep a pin whose
  property IS an outcome; it is not used that way here.
- **The `REGION_FLOOR` overclaim is corrected and the new wording is
  accurate.** It now says there is no independent runtime source, that
  `expect(REGION_FLOOR).toBe(250)` does not make it independently derived,
  and states exactly what it buys (a second, visible edit). I re-derived
  B1: moving both together is green. The comment no longer says anything
  I can falsify.
- **A FOURTH SHAPE — filed as T-062-s5.** `toEqual(exactSet)` →
  `toEqual(expect.arrayContaining(exactSet))`: one substitution, assertion
  side only, entirely plausible-looking, relation-preserving. Run with **R3
  live underneath it**, all three sweep executions go **GREEN** — the
  assertion that reds in 3.3s on the unmutated file no longer sees the
  clipping canvas at all. For the four screens whose expected set is `[]`
  it is not loosened but total: `arrayContaining([])` matches any array.
  The pattern across all four known shapes is worth the one line in s5:
  every one is a widening of the MATCHER, never a change to the value.

### Suites — first-hand in this worktree, every exit unpiped

| suite | result | exit |
|---|---|---|
| lib/parser | **225 passed (11 files)**, `tsc --noEmit` clean | 0 |
| app | **821 passed (42 files)**, `tsc --noEmit` clean, `npm run build` clean | 0 |
| app/src-tauri | bare `cargo test` → **318 passed + 3 ignored, 0 failed**, **15 targets**, per-target **113/0/0/46/123/0/7/13/3/7/0/2/4/0/0** — identical to the card's in all fifteen slots | 0 |
| tools/e2e | **82 passed in 17.4s**, one worker, retries 0, no skips, no flakes; **5** from `shell-frame.spec.ts` (3 loop-wrapped + 2 at column 0), 77 elsewhere | 0 |
| `lint:tokens` | `clean (117 files scanned)`, zero allowlist | 0 |

`grep -c warning` on the cargo log returns **1** and it is the test NAME
`warnings_and_unknown_event_types_do_not_fail_the_turn` — **zero compiler
warnings**, as the card says. The bundle reproduces byte-for-byte:
`index-tsWZtfZi.js` **498.88 kB**, `index-BeT5MY7f.css` **43.90 kB**.
`acl_pin.rs` sha256 **8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e**, **92**
grants counted in `EXPECTED_GRANTS`. **Zero diff** under `app/src-tauri/**`,
`lib/parser/**`, `method/**`, `docs/architecture/graph.json`,
`docs/CONVENTIONS.md`, `.github/**` and every manifest and lockfile. No new
IPC command, no new grant, no new dependency, no `innerHTML`.

**BOOT GATE: FIRES AND PASSES**, re-run on scratch port **16401**,
bind-probed free first. Both `[nputer]` lines detected, same nine lines
verbatim. **The script prints no exit code** — the 0 is my own `echo $?`,
appended to the log by me and labelled as such, exactly as the card labels
its own. No listener survived on 16400 or 16401.

**`git grep` from a subdirectory returns nothing and reads like a
contradiction** — I confirmed the trap on this very tree: from the root,
`documentElement.scrollHeight` has 8 hits across 6 files; from `docs/`,
zero.

### THREE NEW FINDINGS, filed from s3

- **T-062-s3 — the parse-error strip reopens the page scroll.** The only
  one I would call a real hole. `parse-error-details` sits outside
  `board-scroll` deliberately, has no `min-h-0` and no `overflow`, so it
  cannot shrink; `flex-1` starves the board first and then the `<ul>`
  pushes through the bottom of the `h-screen` column, whose overflow is
  `visible`. Measured: at **20** unparsable task files the page reads
  **896/840 at the shipped 1280x840 default** and `window.scrollY` reaches
  56 — the header scrolls away again. At 800x600 with 60 it is **3296/600**.
  And `board-scroll` collapses to **30px**, an eighth of the same task's
  own `REGION_FLOOR`, already at 142px with SIX errors. **This is not a
  regression** — the board's page always scrolled before — and no
  criterion states the invariant universally, which is why it is a filing
  and not a rejection. But the card's "AFTER, every screen and every
  viewport: `page == viewport`" is a five-screen claim, not a property,
  and the new sweep cannot see the difference.
- **T-062-s4** — the wheel double-move on the X axis (above).
- **T-062-s5** — the fourth mutation shape (above).

### Corrections to the record — small, but the fence is for checking

- **The Fence says "eight files: three source, four test, and this card".
  `git diff f94dd9c..HEAD --stat` is TEN** — the two suggestion files
  landed in `d40d76a`. Eight was true of commit 1; it is not true of the
  range, and the Fence is the paragraph an integrator runs verbatim.
- **`App.tsx:504` names the wrong file.** The comment says
  "`genesis-screen.spec.ts` reds if any bounded region ever hides content
  again". It does not — the sweep is in `shell-frame.spec.ts`, and R3
  confirms it: `genesis-screen.spec.ts` is not among the six reds. A future
  reader sent to that file will not find the assertion.
- The eleven `map-node` clippers are **ten at 92/64 and one at 116/64**,
  not eleven at 92/64.
- Under T-062 the old probe does not report the viewport on all five
  screens — genesis still reads **302** and the map **214** at a 200px
  viewport. The test would still have been vacuous (both are far under
  the 700 floor), so the conclusion stands; "all five would have reported
  the viewport" is the overstatement.

### NOT MINE TO JUDGE — for the morning list

**Whether one bounded frame FEELS right is @human's, and the card says so.**
Everything below the fold on the board now lives in a region with its own
scrollbar; that is a daily-visible change to a screen @human uses, in light
and dark, at 1280x840 and 1024x700, and no measurement settles it. I neither
approved nor rejected on it. Paired with it: **T-062-s1's live question —
the interview wants ~1000-1082px at a declared floor of 700**, so at the
minimum the genesis screen is permanently scrolling. Legal under one scroll
model, and still a judgment someone should make with the app open.

**Verdict: APPROVED.** Nine criteria re-derived first-hand, the trap and
the centring claim reproduced from the other side, all three declared
non-reproductions confirmed, the disclosure independently checked to
sha256, three findings filed. `status: verifying` left for the integrator.
