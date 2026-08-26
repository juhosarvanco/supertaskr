---
id: T-137-s8
title: The DOCS GATE says every card's frontmatter parses on a card the parser rejects — two readers, one claim, and the permissive one is the gate
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [tools/e2e]
---

**OBSERVED, WITH BOTH COMMANDS, WHILE `T-137` WAS BEING WRITTEN.** A
suggestion card was drafted whose `title:` began with a backtick. YAML
reserves that character, so the parser refuses the whole frontmatter:

    npx vitest run from lib/parser/   ->  1 failed / 310 passed, exit 1
      smoke — the real docs/ tree parses cleanly > finds zero issues
      yaml-error: malformed frontmatter YAML — Plain value cannot start
      with reserved character ` at line 2, column 8

**AND THE DOCS GATE, RUN ON THE SAME FILE MOMENTS EARLIER, PRINTED:**

    docs-gate: every live task card's frontmatter parses, with a legal status.

**TWO READERS, ONE CLAIM.** `tools/e2e/scripts/dispatch-brief.mjs`'s
`frontmatterFields` is a deliberately minimal, zero-dependency reader for
"the three field shapes this repository actually uses" — it splits on the
first colon and never runs a YAML parser. `lib/parser/src/frontmatter.ts`
runs `yaml`. The gate's sentence is a claim about the whole corpus, and it
is made by the reader that cannot fail.

**WHY IT MATTERS RATHER THAN BEING TIDY.** The gate is a CI step and it is
the thing a session runs to find out whether its doc write is safe. A
session that runs it, gets that sentence, and stops has shipped a card the
parser's smoke test will red on — which is exactly what happened here, and
the only reason it was caught is that this lane ran the parser suite
afterwards because the DOCS GATE told it to.

**THREE OPTIONS.**

1. **Soften the sentence** to name the reader: *"every live task card's
   frontmatter parses under this gate's minimal reader"*. One line,
   honest, and it stops the gate speaking for the parser.
2. **Have the gate shell out to the parser** for the frontmatter claim.
   Correct, and it makes a zero-dependency tool depend on a build —
   which is `T-137-s7`'s question, so land them together or not at all.
3. **Add the reserved-character check to the minimal reader.** Cheapest
   real fix: a leading `` ` ``, `@`, `%`, `&`, `*` or `!` in an unquoted
   scalar is a YAML error, and the gate can say so without a parser.

Option 1 is owed regardless of which of 2 and 3 lands.
