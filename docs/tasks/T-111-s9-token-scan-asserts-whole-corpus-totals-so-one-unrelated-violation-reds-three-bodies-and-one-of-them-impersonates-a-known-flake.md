---
id: T-111-s9
title: token-scan.spec.ts asserts WHOLE-CORPUS totals from bodies that plant ONE violation, so any unrelated control character reds three at once — and one of the three is character-perfect camouflage for T-120-s3's known mtime flake
status: suggested
suggested_by: executor claude-opus-5 @T-111
touches: [tools/e2e]
---

**MEASURED ON THIS LANE, BY ACCIDENT, AND THE MISATTRIBUTION ALMOST
LANDED.** `tools/e2e` is outside `T-111`'s fence (`[app-board,
app-shell]`), so this is recorded and routed per `roles/executor.md`
rather than repaired.

## What happened

This lane's fix pass wrote two literal `U+0000` bytes into
`app/test/select-board.test.ts` — a sentinel string typed as `"\0never"`
where a space was meant. `npm run build` exited 0, the app suite went
1013/1013 exit 0, and seven poison-drill arms ran clean over it, because a
NUL inside a JavaScript string literal is a valid string. **`lint:tokens`
P5 is the only check in this repository that saw it**, which is precisely
the rationale that rule already states: *literal controls make tracked
text unsearchable to binary-skipping tools*.

`npm test` from `tools/e2e/` then went **3 failed / 191 passed, exit 1**,
and none of the three names a control character in its title:

| body | asserted | got |
|---|---|---|
| `token-scan.spec.ts:106` *one runtime-built control byte reds all seven first-party roots at exact byte offsets* | `stdout.match(/\[P5:/g)` has length **7** | length **9** |
| `token-scan.spec.ts:227` *P6 reds a planted bare motion utility and leaves its motion-safe twin alone* | stderr contains `"(1 TOKEN, 0 CONTROL)"` | `"3 violations (1 TOKEN, 2 CONTROL)"` |
| `token-scan.spec.ts:356` *the gate distinguishes clean, found-something and could-not-run* | — | — |

**All three went green on the next run with the two bytes removed: 194
passed, exit 0, same scratch-port discipline, no other change.**

## Why it is worth a card

**THE SECOND ROW IS THE DANGEROUS ONE. It is `T-120-s3`'s body.**
`docs/STATE.md` has carried a prediction for six checkpoints that
`token-scan.spec.ts:227` reds *"in exactly the places this project creates
most often: a fresh lane worktree and a fresh poison-drill worktree"*,
with a known cause — `utimesSync` writes a rounded mtime while the
assertion compares the unrounded float it captured, the `.3904` signature.
**A session that reads "P6 reds a planted bare motion utility" going red
in a fresh lane worktree has every reason to write down "the known
`T-120-s3` flake, red once then green twice" and move on.** This lane's
red was not that. It was a real violation in the tree, in this lane's own
diff, and the `.3904` signature was absent — but nothing in the failure's
TITLE says so, and the remedy for the flake (run it again) also makes this
one disappear once the author happens to fix the byte.

**THE MECHANISM IS THAT A LOCAL FIXTURE ASSERTS A GLOBAL TOTAL.** Each of
these bodies plants its own violation in a scratch tree and then asserts a
count over the WHOLE tracked corpus — seven roots, or `(1 TOKEN, 0
CONTROL)`. The planted violation is local; the denominator is the
repository. So any unrelated P5 or P6 hit anywhere in `git ls-files`
changes the number these bodies read, and the failure surfaces three
layers from its cause on a body whose title is about something else.
**That is the DOCS GATE's own founding argument** — *"the failure mode is
not that a suite goes red, it is that the red arrives detached from its
edit and gets attributed to whatever lane is nearest"* — reproduced inside
`tools/e2e` itself.

## The shape of the repair

Not prescribed, because the fence is not this card's. Three options, and
the first is the cheapest:

- **(a) ASSERT THE DELTA, NOT THE TOTAL.** Read the baseline count before
  planting and assert `after − before === 1`. The body then measures what
  it planted and is immune to the corpus.
- **(b) SCOPE THE SCAN.** Run the gate over the scratch tree alone so the
  denominator is the fixture. Changes what the body proves — it stops
  exercising the real corpus walk — so it is a trade, not a strict
  improvement.
- **(c) NAME THE RESIDUAL.** Keep the totals and make the failure message
  print the violations it did not expect, so the next reader sees
  `select-board.test.ts:byte 67908` rather than `Expected 7, received 9`.
  Cheapest of all and it fixes the ATTRIBUTION without touching the
  assertion.

**(a) AND (c) COMPOSE**, and together they close both halves: the body
stops depending on the corpus, and a corpus that has drifted anyway says
so by name.

## One more thing the same incident showed

**A NUL in a test file makes that suite's own log unreadable to `grep`
without `-a`.** Arm A31 of this lane's drill printed `Binary file … log
matches` where the test counts should have been, so the arm briefly had an
EXIT with no COUNT — the exact shape `docs/CONVENTIONS.md` forbids reading
a drill by. It was caught because the count was demanded a second time,
not because anything failed. Worth a sentence wherever the drill's
positive-control rule is written: **a log that answers `Binary file
matches` is a measurement that did not happen.**
