---
id: T-045-s4
title: The CONVENTIONS parse is loud about commands that MOVE and silent about commands that ARRIVE in a new shape
status: suggested
suggested_by: verifier claude-opus-5 @T-045
---

T-045's derivation was attacked twenty-four ways by the verifier: 18 red
loudly, 3 are correctly tolerated (a non-breaking space inside `run
from`, inside a command's backticks, or beside a `·` — all normalise and
parse identically), and the 3 below are silent. Every mutation of
content the parse already sees fails LOUDLY — reorder the
bullets, reword a command, delete one, swap the `·` separator for a
comma, strip a command's backticks, change the bullet's dash, put a
non-breaking space after it, rename or empty or delete the `## Build &
test` header, add a fifth `run from` bullet, put a colon after the
dev-tool bullet's `run from app/src-tauri/`. The non-vacuity guard is
real: a section replaced by one prose line yields **26 problems and two
derived steps**, never silence.

Three attacks did NOT red, and they share one shape — a command that
ARRIVES in a structure the typography rule does not recognise:

| attack | result |
|---|---|
| an indented sub-bullet inside the `app/` bullet: `  - \`npm run storybook\` (nested, new)` | `problems=0 steps=17` — invisible |
| an indented sub-bullet carrying its own marker: `  - extras, run from app/extras/: \`npm run x\`` | `problems=0 steps=17` — invisible |
| a fenced block after the `app/` bullet: ` ```sh / npm run smoke / ``` ` | `problems=0 steps=17` — invisible |

Reproduce: feed each mutated string to `deriveExpectedSteps()` from
tools/e2e/tests/workflow-parity.spec.ts. The mechanism is
`commandBullets()`: it splits on `\n(?=- )`, so anything not starting at
column 0 with `- ` is glued to the PRECEDING bullet's chunk, and the
`·`-segment walk only ever reads the first backticked span per segment.
Glued text lands after the last command segment and is never read.

**Why this is a suggestion and not a defect.** The asymmetry is entirely
in the safe direction for what T-045 was built to prevent. Nothing that
is in the doc today can silently leave it — the two-directional check
(`doc → disposition` and `disposition → doc`) makes every removal,
reword and reorder a named failure. What escapes is a command someone
ADDS in a shape the four flat bullets do not use today. The array this
parse replaced could not see such a command either; the derive arm is
nowhere weaker than what it replaced, and it is the thing that found the
missing `npm run typecheck` step.

**Shape of the fix, when someone is next in this file.** Make the parse
STRUCTURAL rather than scanning: inside the "Build & test" section,
treat an indented `- ` line and an opening ``` fence as an unrecognised
structure and push a problem naming it, the same way a fifth `run from`
bullet already does. That turns "a shape I do not read" from silence
into the loud complaint the rest of the derivation already gives —
without teaching the parser markdown. Cheap, and it wants exactly one
new fixture per shape beside the four already in the spec.

The coupling itself is already disclosed in T-045's "Honest limits" and
in CONVENTIONS' CI bullet; this card records the one class where the
disclosed coupling fails quiet instead of loud.
