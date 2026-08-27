---
id: T-092-s5
title: The catalogue says every ordinal is minted here, and shapes ONE to FOUR are numbered nowhere — a reader told to cite by number cannot look four of them up
status: suggested
suggested_by: verifier claude-opus-5 @T-092
---

T-092 lands **THE CATALOGUE IS CLOSED AT ELEVEN AND EVERY ORDINAL IS
MINTED HERE** in `docs/CONVENTIONS.md`'s POISON DRILL bullet, and the
sentence immediately after it is *"Cards CITE these numbers."*

**Shapes ONE, TWO, THREE and FOUR have no entry anywhere.** Derived at
`73d7870`, from the repo root:

    git grep -inE 'shape (one|two|three|four)\b' -- docs/ method/   # exit 1, nothing

The only trace is a class reference — *"the four catalogued 'matcher
moved, value fixed' violations"* — which names the shared TELL and no
individual shape. The same derivation at the base `5887cd4` is also
empty, so **this is inherited, not introduced**: T-092 did not lose the
four, it inherited a catalogue that never wrote them down and then
claimed completeness over them.

## Why it is worth a card and not a shrug

The claim is the kind this card exists to catch: a sentence that asserts
more than the thing it describes. Concretely, seven of eleven ordinals
resolve and four do not, so a card citing "shape three" cites nothing a
reader can reach, and the entry that says otherwise is the one place they
would look. Five and six were written down precisely because cards were
citing them by number.

Note the entries are not free: SEVEN through ELEVEN run to about 3.9 KB,
and `docs/CONVENTIONS.md` has 919 bytes of warn headroom at `73d7870`
(`T-092-s2`). Four more entries at that density do not fit under the
current line, which makes this card and `T-092-s2` the same decision seen
from two sides.

## What would close it

- **Cheapest and honest:** soften the claim to what is true — the
  catalogue is CLOSED at eleven (no more ordinals to mint), FIVE through
  ELEVEN carry entries, and ONE to FOUR are the "matcher moved, value
  fixed" family whose individual histories live in the cards. One
  sentence, no bytes to speak of.
- Or write the four entries, which needs the budget decision in
  `T-092-s2` first — and if they are written, each owes a TELL and a
  mechanical-remedy line like the rest.

Fence it needs: `docs/CONVENTIONS.md`.
