---
id: T-077-s2
title: The Tailwind prose leak reaches app/src too, so `@source ./src` alone is not the close
status: suggested
suggested_by: executor claude-opus-5 @T-077
---

**T-072-s5's OWN THIRD OPTION, MEASURED.** That finding recorded a bare
word in an `app/test` COMMENT shipping `.isolate{isolation:isolate}` — 27
bytes — and proposed three closes, the third being *"Both, which is the
only combination that also catches a stray utility introduced from
`app/src` itself"*, with no instance behind it. **Here is the instance.**

**T-077's FIRST COMMIT SHIPPED 583 BYTES OF DEAD CSS FROM `app/src`.**
The local identifier `ordinal` — `const ordinal = seen.get(base) ?? 0;`
in `modelIssueRows`, plus the word twice in the doc comment above it —
became the Tailwind default utility `.ordinal`, and with it the entire
`font-variant-numeric` machinery: `--tw-ordinal`, `--tw-slashed-zero`,
`--tw-numeric-figure`, `--tw-numeric-spacing` and
`--tw-numeric-fraction` all added to the `*` initial block. The shipped
stylesheet went **43.95 kB → 44.53 kB** with no styling change anywhere
in the diff.

**ATTRIBUTED, NOT GUESSED.** Three builds off one tree — full HEAD, HEAD
minus the new test file, and the base source — with the selector set
extracted from each stylesheet and differenced: **one rule added, none
removed**, and the two HEAD variants byte-identical, so the new TEST file
contributed nothing and the leak was in `app/src`. Then bisected file by
file. Renaming the identifier restored the stylesheet to `cmp`-identical
with main's at exit 0, same content hash.

**WHY THIS CHANGES THE REMEDY.** T-072-s5's first close — a `@source`
directive naming `./src` — stops Tailwind scanning `app/test`, and it
would NOT have caught this: `app/src` is the tree `@source ./src` points
AT, and it must be scanned, because that is where real class names live.
**The leak is not "Tailwind scans the wrong directory"; it is "Tailwind
cannot tell a class name from an English word, and one of the trees it
must scan is full of English."** So option 1 is a narrowing, not a fix,
and the tripwire (option 2) is the load-bearing half rather than the
belt-and-braces one.

**THE TRIPWIRE IS ALSO THE ONLY ONE THAT WORKS RETROACTIVELY.** This
leak was found because a build log happened to be compared against a
baseline four commits earlier. Nothing in the repo would have failed;
839/839, the token lint, the type gate and the boot check were all green
with `.ordinal` live in the shipped bundle. CONVENTIONS says *"unmapped
utilities are deliberately dead"* — a word in a comment makes one LIVE,
and that rule has no test.

**Recommended close**, superseding T-072-s5's ordering:

1. **Pin the built stylesheet's SELECTOR SET** (not its byte size — that
   moves for legitimate reasons and reads as noise) against a recorded
   list, in `app/test/window-manifest.test.ts`, which already reads the
   built CSS off disk. A new selector reds by NAME, which is what tells
   the next author whether they added a token or a vocabulary word.
2. `@source` as well, since `app/test` genuinely ships no markup.

**AND THE FOUR WALKS TABLE STILL DOES NOT DESCRIBE THIS WALK.** T-072-s5
already said so. Adding the row should now say the walk covers `app/src`
AND `app/test`, that its authority is `app/src/index.css` plus
`.gitignore` plus Tailwind's own extractor, and that **prose inside the
scanned trees is an input to the shipped bundle** — which is the sentence
that would have stopped both incidents.
