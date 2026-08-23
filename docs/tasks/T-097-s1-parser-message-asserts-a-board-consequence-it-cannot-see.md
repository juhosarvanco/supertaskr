---
id: T-097-s1
title: The parser asserts a board consequence in two messages, and nothing on either side notices when the board changes
status: parked
suggested_by: executor claude-opus-5 @T-097
---

**THREE** parser messages END with a claim about the BOARD. I first
wrote "two" here from the two the T-097 card names, then ran the grep
this file's last paragraph tells the reader to run, and found a third.
That is the whole point of the finding, so the miscount stays visible:

- `duplicate-id` / space `feature` (`roadmap.ts:65`): *"the board keeps
  the first declaration's column and discards the second's name and
  description"*.
- `aliased-id` / space `feature` (`roadmap.ts:137`): *"the board renders
  a column per spelling and a task's feature field lands in whichever
  column matches its exact string"*.
- `aliased-id` / space **`task`** (`validate.ts:198`): *"…and the board
  reads the pair as two tasks"* — a fourth id space's message reaching
  into the same renderer, in a different FILE, which is why the card's
  own survey missed it.

The comment above the first says the clause is *"the board's measured
behaviour, not a guess"* — and it was, when it was written. But the
measurement is one-shot: the parser cannot see `selectBoard`, the board
does not read these strings, and no test relates them. **A sentence in
`lib/parser` describes behaviour in `app/src/lib`, and the only thing
holding the two together is that somebody once checked.**

T-097 is a live demonstration of the coupling biting. Its criterion 2
offered `selectBoard` a slot-routing arm; taking it would have made the
`aliased-id` sentence FALSE, while its criterion 6 fenced the executor
out of the parser. The card's own two criteria made the sentence
unrepairable by the card that would have broken it. The ruling went the
other way partly for that reason, so the sentence is still true today —
but the next card that changes board routing inherits the same trap,
and this time there may be no reason to refuse.

T-097 closed HALF of it: both claims are now pinned on the BOARD side
(`app/test/select-board.test.ts`, describe "a padding-aliased backbone
slot (T-097)", plus the pre-existing duplicate-collapse body), so a
board change that falsifies either message reds a test. What is still
missing is the LINK: nothing names the parser sentence at the board
pin, or the board pin at the parser sentence, so the red says "routing
changed" and not "a message in another package is now a lie".

All three read TRUE against the tree at `a15b78e` and all three still
read true after T-097, which is the only reason this is a suggestion
and not a defect.

Whoever takes it owns three questions. Whether the three messages should
stop predicting the board at all and describe only what the DOCUMENTS
say (the parser's actual subject), leaving consequences to the
renderer — this is the smallest and probably the right answer.
Whether, if they stay, a cross-package pin should assert the relation
(the board pin importing the message literal, or a shared fixture
running both). And whether the same pattern exists elsewhere: a
`git grep "the board"` over `lib/parser/src` finds these two, and it is
worth re-running rather than trusting any count in this file — the
grep is `git grep -n "the board" -- lib/parser/src`, it returns SEVEN
hits at `a15b78e`, and only three of them are message text; the other
four are doc comments, which are a milder version of the same coupling
and are probably fine.

**PARKED at the seventh triage (2026-08-24).** Unpark when a card whose criteria change `selectBoard`'s column or slot routing is dispatched. All three parser messages read TRUE today (roadmap.ts:65, :137, validate.ts:198) and T-097 pinned the board side.
