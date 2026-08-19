---
id: T-074
title: Every quoted figure reproduces, and every comment teaches the mechanism the code has
feature: F-02
milestone: 4
priority: 33
size: S
status: planned
blocked_by: []
touches: [app-shell, app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-051-s1, T-058-s3, T-063-s1, T-063-s5, T-063-s6 (fourth
triage, 2026-08-19). The suggestion files are removed in the same commit
as this card. Five findings, one mechanism: **a durable statement a
reader will trust — a shipped comment, a quoted figure, a test file's
own assumed window — that the code does not support.**

THE RULING FIRST, BECAUSE TWO OF THESE ASK FOR IT BY NAME. T-063-s1 and
T-063-s6 both close with "it should be somebody's call rather than
nobody's": is a figure inside a closed card a historical record needing
no upkeep, or a number the next reader will trust? **This card takes the
call.** A card body is history, and a superseded-but-reproducible figure
stays as it is with a dated re-measurement beside it. But an arithmetic
that CANNOT be produced by the code is not history — it is a wrong
number wearing history's clothes, and it gets corrected in place with
the date and the derivation.

AND ONE CARD ALREADY CONTRADICTS ITSELF UNDER THAT RULING. T-063's
verdict section records the 870-character correction; its implementation
notes two hundred lines earlier still say 887. Recording a correction in
a verdict does not make the record true — the SOURCE claim is the one a
developer reads, and today the two disagree inside one file.

## Acceptance criteria
- THE SPLIT'S OWN COMMENT SHALL STOP TEACHING W-641.
  `GenesisScreen.tsx`'s comment above the split (the paragraph beginning
  "640px of chat plus the 1px rule") states arithmetic T-027's verifier
  falsified: the app is BORDER-BOX, the 1px rule sits INSIDE the chat's
  640, and the lens gets **W-640** — 800 / 640 / 384 / 160, not
  799 / 639 / 383 / 159. `interview.spec.ts` already carries the
  correction, so the two contradict each other across the fence.
  **AND THE DESIGN ATTRIBUTION SHALL GO WITH IT**: the comment credits
  799 to "the design's own number", and the design source says **800**
  — it sets `box-sizing: border-box` globally, gives the chat column
  `width: 640px` with a 1px right border, and gives the right half
  `flex: 1` inside a 1440px frame. The plan's W-641 was never a
  deviation from the design; it was the same border-box slip one level
  further back, and the correction at T-027 stopped short of the design.
- THE STANDING C0 CHECK'S COMMENT SHALL BE CORRECTED —
  `map-tasks-lens-dom.test.tsx`, the comment heading the control-byte
  scan. It still carries T-034-s5's superseded diagnosis verbatim: that
  the raw-HTML gate, `lint:tokens` and "the CI greps" all stop seeing a
  file carrying a literal control byte. All three claims are false as
  measured — both gates read through Node's `readFileSync` with utf8,
  where the byte is an ordinary codepoint and matching is unaffected,
  and `ci.yml` contains ZERO greps. What IS blinded is the SEARCHER: a
  binary-skipping searcher returns no match at all and exits 1, which is
  how every agent session searches this tree. The replacement SHALL keep
  the "compiles, bundles and tests green" opening and the T-012 / T-034
  history and swap only the middle. **The check itself SHALL NOT MOVE**
  — T-058's sixth criterion ordered it preserved exactly, it works, it
  names codepoint and offset, and it is proven by planting. This is
  three comment lines, no behaviour, no test change.
- THE STALE BUNDLE FIGURE SHALL BE CORRECTED AT BOTH SITES. T-041's and
  T-063's bodies both quote **696,302 B** for the DEV-flipped bundle;
  re-measured 2026-08-18 at `2fc3475` with node 22.22.0 and vite 7.3.6
  it is **764,391 B**, +68,089 (+9.8%), because the measurement predates
  T-027's interview harness and T-028's crescendo. **Both mechanisms
  reproduce exactly and SHALL be preserved**: `--mode development` does
  NOT flip DEV (the assets are sha-IDENTICAL, not merely the same size),
  and an inherited `NODE_ENV=development` does. The lesson SHALL be
  recorded with the correction: **pin the sha and the property, not the
  size** — the same lesson STATE already carries for `EXPECTED_GRANTS`,
  where three agents produced three byte figures from three ranges.
- T-063'S TWO NON-REPRODUCING FIGURES SHALL BE CORRECTED AT THEIR
  SOURCE, so the card stops contradicting itself. **887 characters** is
  **870 characters / 872 bytes** — 58 prefix plus the 800-character cap
  plus a 12-character marker, content-independent once the cap fires, so
  887 cannot be produced by this code at all. Every QUALITATIVE claim in
  that passage reproduced exactly and SHALL be left alone: zero raw
  control bytes, the escape legible as its six-ASCII-character JSON
  form, the truncation marker present, one line.
- `startup-screen.test.tsx`'s header SHALL stop saying "10 of these 23
  tests". The file has **15** and the poison reds **9**. AND the
  sharpened lesson SHALL be recorded beside it: the hazard needs the
  imported value to be GENUINELY USED, because TypeScript elides an
  import whose bindings are all unused — the first attempt at that
  poison came back 15 passed and proved nothing.
- THE SAME FILE'S EIGHT-SECOND COUPLING SHALL BE STATED AND SHRUNK. That
  file is ONE ordered narrative over one long-lived React root, and its
  first act deliberately PARKS the subscribe; the startup deadline now
  arms a REAL 8000 ms timer over that parked stretch. If wall-clock time
  between the park and the later refusal ever exceeds it, the deadline
  fires first and three copy assertions flip — a failure that looks like
  a copy regression and is actually a clock. Margin today is roughly
  150x (the whole file runs in about 52 ms), so this is latent, not
  live. Refuse the parked promise in the first describe's own `afterAll`
  so the parked window is one describe wide, AND state the coupling in
  the file's header. **A test-only deadline override is refused on
  sight**: a production seam that exists for a test is what ADR-017's
  discipline is against.
- EVERY CORRECTION SHALL CARRY ITS DATE AND ITS DERIVATION, so the next
  reader can tell a corrected figure from an original one without
  reading git history.

Verification: headless. No behaviour changes anywhere in this card
except the test-file restructure in the last criterion, which SHALL be
proved by running that file and by poisoning its moved assertions.

FENCE NOTE: the `app-map` half is **three comment lines in one file**
(`map-tasks-lens-dom.test.tsx`, T-034's file, whose subject fences it to
`app-map` even though it sits under `app/test`). IF T-067 wants the
`app-map` fence back, that criterion SHALL be split into its own size-S
card — it shares this card's mechanism, not its files. Three comment
lines are not worth a card unless the fence costs more than the work.

## Implementation notes

## Verdicts
