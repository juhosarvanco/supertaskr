---
id: T-062
title: The frame holds everywhere — one scroll model, a canvas that scrolls, a card that fits
feature: F-02
milestone: 4
priority: 28
size: M
status: verifying
blocked_by: [T-051]
touches: [app-shell, app-map]
builder: claude-opus-5 @fresh
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
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

`git diff f94dd9c --stat` is **eight files**: three source, four test,
and this card. **Zero diff** under `app/src-tauri/**` (`acl_pin.rs`
whole-file sha identical, `generate_handler!` untouched, no new IPC
command, no new grant), `lib/parser/**`, `method/**`,
`docs/architecture/graph.json` (**deliberately not regenerated — the
integrator's ritual**), `docs/CONVENTIONS.md`, `tauri.conf.json`,
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
