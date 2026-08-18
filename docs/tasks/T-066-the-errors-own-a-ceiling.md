---
id: T-066
title: The errors stay visible without taking the board — the strip owns a ceiling
feature: F-02
milestone: 4
priority: 23
size: M
status: verifying
blocked_by: [T-062]
touches: [app-shell, tools/e2e]
builder: codex/gpt-5 @fresh
verifier: codex/gpt-5 @fresh
built_by: codex/gpt-5 @fresh
verified_by: codex/gpt-5 @fresh
review: independent
---

Absorbs: T-062-s3 (architect triage 2026-08-18). The suggestion file is
removed in the same commit as this card.

T-062 bounded every shell screen and gave the board its own scroll region,
but one unbounded sibling remains above it: `parse-error-details`. Its height
comes from the user's own tree. The list therefore consumes `board-scroll`
first, then pushes through the `h-screen` column and gives scrolling back to
the document.

Reproduced again at main `7d94043` through the served DEV bundle. With short
failure messages, 20 failures collapse `board-scroll` to 154px at 1024x700
and 54px at 800x600. Sixty failures produce a 1376px page at all three
measured viewports and leave the board 30px high. T-062's verifier crossed
the page boundary at 20 because the real parser messages wrapped further.
The count is not the mechanism; an unbounded sibling is.

ARCHITECT RULING: keep the details strip outside `board-scroll`. That
preserves the existing intent that a short diagnostic remains visible while
the user works on the board. Give the strip its own bounded scroll region
instead of moving it into the board.

Use the token-backed `max-h-48` ceiling (192px) with vertical auto overflow.
At the 800x600 historical baseline, the current fixed chrome leaves about
474px for the details and board regions together; a 192px ceiling should
leave about 282px for the board, above the standing 250px region floor.
These are premises the executor must remeasure, not figures it may silently
assume.

## Acceptance criteria

- WHEN the board has parse failures or skipped-file records THE system SHALL
  render the same complete details list outside `board-scroll`; badge counts,
  issue text, skip reasons and last-valid-state wording SHALL remain unchanged.
- WHILE the details list's natural height is at most 192px THE list SHALL
  remain natural-height with no inner overflow, so ordinary one-error and
  short-list states do not acquire an unnecessary scrollbar.
- IF the details list grows beyond 192px THEN THE list SHALL stop at the
  token-backed `max-h-48` ceiling and SHALL expose its remaining rows through
  `overflow-y-auto`; no row may be clipped, elided or moved into the board's
  scroll region.
- WHILE a board containing this repository's normal cards plus sixty
  malformed task files renders at 1280x840, 1024x700 or 800x600 THE document
  SHALL equal the viewport, the bounded column SHALL not overflow the
  document, and `window.scrollY` SHALL remain zero.
- WHILE that pathological board renders at those three viewports THE
  `board-scroll` client height SHALL remain at least 250px and its existing
  tall board SHALL remain independently scrollable.
- WHEN the bounded details list is scrolled to its end THE final diagnostic
  row SHALL become fully reachable without moving the page; WHEN the board is
  then scrolled THE header, wordmark and pane rail SHALL remain visible.
- THE shell-frame unit suite SHALL pin the details region's ceiling and scroll
  ownership on a real parse-failure state, and the E2E every-screen sweep
  SHALL add a board-with-many-errors state so a future unbounded sibling
  cannot hide outside the five clean screens.
- THE implementation SHALL add no token, arbitrary value, IPC command,
  capability grant, Rust change or parser change. `max-h-48` SHALL derive
  from the existing spacing token.
- EVERY added or changed test body SHALL be poisoned, shown red, restored with
  an empty diff or SHA-256 proof, and counted in the implementation notes.

Verification: headless — app typecheck, production build and full vitest
suite; tools/e2e typecheck, token lint plus selftest and full Playwright lane
at a scratch port. Run the boot gate because `app/src/**` moves. The
integrator regenerates and checks the graph because TS/TSX moves. Record the
three viewport measurements before and after, including page, column, details
and board `scrollHeight/clientHeight`. @human: none.

## Implementation notes

2026-08-18 — codex/gpt-5 @fresh

- Kept `parse-error-details` exactly where it was, as a sibling before
  `board-scroll`, and added only `max-h-48 overflow-y-auto` to its existing
  class list. The same `failures` and `skipped` maps still render every row;
  no issue text, counts, last-valid wording, parser path, token, IPC surface,
  capability, Rust file or manifest moved.
- Reproduced before the production edit with this repository's normal board
  plus sixty task files that the real parser rejects for missing frontmatter.
  At 1280x840 / 1024x700 / 800x600 respectively: page and bounded-column
  scroll heights were **1376 / 1376 / 1376** against client heights
  **840 / 700 / 600**; details were **1220/1220** (`scrollHeight/clientHeight`),
  `overflow-y: visible`; board was **5695/30** at all three viewports. The
  focused shell-frame unit probe also failed on the absent `max-h-48`.
- After the edit, the same three measurements were: page **840/840 · 700/700
  · 600/600**; column **840/840 · 700/700 · 600/600**; details
  **1220/190** at each size, with a **192px border box** (the two 1px borders
  explain the 190px client area) and `overflow-y: auto`; board **5695/524 ·
  5695/384 · 5695/284**. `window.scrollY` stayed 0, the final diagnostic row
  was fully reachable after scrolling the details list, and subsequent board
  scrolling left the wordmark and pane rail in view. A one-error control is
  below 192px with `scrollHeight === clientHeight`, proving `auto` adds no
  inner overflow below the ceiling.
- Extended the shell-frame unit's real parse-failure state to pin the token
  class, overflow owner and sibling relationship. Extended the E2E
  every-screen matrix from five clean screens to include a board with sixty
  real parse failures, and added the full three-viewport geometry,
  reachability and independent-scroll probe. The full lane is now **83/83**.
- Poison discipline: **3/3 affected test behaviors red** under one-sided
  relation breaks — unit `max-h-48` ownership changed to nonexistent
  `max-h-47`; the every-screen pathological arm required page height
  `viewport + 1`; the browser token pin required 191px instead of 192px.
  Restoration SHA-256 matched the pre-drill files exactly:
  `shell-frame.test.tsx` =
  `6f58482a0d9f95af5a15a96cb85e8b739da8206d727704d43dacb6b95db981cf`,
  `shell-frame.spec.ts` =
  `34af2ed23b17084a2df193d575a6b8c4861d3cc3054d39abcaeaec834da69f94`.
- Verification gates: app `npx tsc --noEmit` green; production build green
  (264 modules, CSS 43.95 kB, JS 498.90 kB); sequential post-build Vitest
  **821/821** green in 42 files. An earlier parallel build/suite attempt was
  invalid because the bundle-pin tests observed `dist/assets` while Vite was
  replacing it (12 `no build output` failures); rerunning in the documented
  build-before-suite order resolved all 12 without a source change.
  `tools/e2e` typecheck green; token lint clean over 117 files; token selftest
  **49 samples + 14 walk-policy checks** green; full Playwright **83/83**
  green with one worker, retries 0 and no skips on scratch port 17665.
- Boot gate fired because `app/src/**` moved. With scratch port 17666 it
  exited 0, detected `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-066` and `[nputer] window "main" created`,
  then stopped its process tree. The executor did not regenerate the graph;
  the task card assigns that indexed-TypeScript checkpoint work to the
  integrator.

## Verdicts

2026-08-18 — codex/gpt-5 @fresh (independent verifier): **APPROVED**

The pre-fix class reproduced first-hand after removing only
`max-h-48 overflow-y-auto`: at 1280x840, 1024x700 and 800x600 the page
and bounded column grew to 1376px, the sixty-row details list was
1220/1220 with `overflow-y: visible`, and `board-scroll` collapsed to
30px. The focused criterion failed at the document boundary. Restoration
was byte-proven (`App.tsx` SHA-256 `d3d61ed0c9d3aa3d38e30da41d446d9f4f0786c09bf0a98fa8c4cbcbf92dfbb4`).

All nine criteria hold independently. The production delta adds only the
existing spacing utility `max-h-48` and `overflow-y-auto` to the unchanged
details-list sibling; both render loops, badge counts, issue text, skip
reason phrases and last-valid-state wording are unchanged. The real
parse-failure unit proves the list remains outside `board-scroll` and owns
the ceiling/overflow. The pre-existing skipped-file truth suite remains
green, including its exact reason and last-valid wording. An additional
verifier-only browser probe exercised one-row and five-row natural lists
at all three viewports: each remained below the ceiling with
`scrollHeight === clientHeight`, a fixed page, a visible final row and a
board region above 250px. It was removed after the run and the E2E file
restored by hash.

The pathological sixty-row measurements were, respectively: page/column
840/840, 700/700 and 600/600 with `window.scrollY === 0`; details
1220/190 with a 192px border box and `overflow-y: auto`; board
5695/524, 5695/384 and 5695/284. The final diagnostic was fully reachable
after scrolling the details region, the tall board remained independently
scrollable, and subsequent board scrolling left the wordmark and pane rail
visible. The every-screen sweep includes the many-errors board at all three
viewports and reports no unowned clipper.

Security and scope are clean: four branch files only; no dependency,
lockfile, manifest, parser, Rust, IPC, command, capability, grant, token
definition, arbitrary value, URL, credential or secret movement.
`acl_pin.rs` remains SHA-256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`
with the pinned 92-grant surface. The acceptance payload itself is
byte-identical to the planned card, SHA-256
`b266794c5556029f0252ce29758c43ba6f4809605d46a7fe647c7be1fc5bcbee`.

Poison discipline is **3/3 red** with one-sided relation breaks: the
changed unit body required nonexistent `max-h-47`; the added pathological
arm in the existing viewport sweep required page height `viewport + 1`;
the new geometry/reachability body required a 191px border box. Exact
focused runs failed at those assertions. Restoration matches HEAD:
`shell-frame.test.tsx`
`6f58482a0d9f95af5a15a96cb85e8b739da8206d727704d43dacb6b95db981cf`
and `shell-frame.spec.ts`
`34af2ed23b17084a2df193d575a6b8c4861d3cc3054d39abcaeaec834da69f94`.

Required offline gates passed first-hand with no model, real CLI or network:
parser build/types/Vitest **225/225**; app typecheck, production build and
Vitest **821/821**; bare Rust **325 passed + 3 intentional ignores**;
E2E typecheck and Playwright **83/83** (one worker, retries 0, no skips);
token lint clean over **117 files** and selftest **49 samples + 14 walk
checks**; `cargo audit --no-fetch` **0 vulnerabilities / 17 allowed
informational warnings**. Boot on scratch port 17674 detected both
`[nputer] project folder:` and `[nputer] window "main" created`, then
stopped its process tree. The graph-currentness gate reports only the
expected two changed indexed files as stale; regeneration remains the
task card's explicit integrator checkpoint duty. T-066 is ready for
integration.
