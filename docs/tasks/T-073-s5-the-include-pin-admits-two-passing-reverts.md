---
id: T-073-s5
title: The include pin is a raw-text regex with a first-match rule and the guard has a side door — two reverts that pass it, and the one-line fix measured
status: suggested
suggested_by: verifier claude-opus-5 @T-073
---

T-073 built a third pin on its own initiative, and the instinct was
right: with `app/tsconfig.json`'s include line reverted, `tsc` exits 0
and every gate in the repo is happy, so a restoration nothing holds is
no restoration. The pin discriminates against the three shapes it was
built for — P6a/P6b/P6c all red at exit 1, re-derived at verification
with the exact messages the card reports.

**It does not hold the property. It holds two proxies, and both can be
satisfied while the property is false.** Measured on tip `7386790`,
one-sided, mutated text read back from `git diff`, restored by sha256.

**(1) THE REGEX ADMITS A PASSING REVERT — and the test's own comment
says it cannot.** The comment reads *"Parsed rather than string-matched:
the include list is read out of the JSON … so neither assertion can be
satisfied by a comment"*, and the card repeats it ("parsed out of the
JSON, not string-matched"). The implementation is
`/"include"\s*:\s*\[([^\]]*)\]/.exec(readFileSync(...))` over the raw
file: **first match wins, and comments are text.** Revert the guard the
way a developer actually would — widen the line, keep the old value in a
comment explaining what it used to be:

```jsonc
  /* T-073 kept this narrow: "include": ["src", "test/node-builtins.d.ts"] —
     widened back only because the editor complained. */
  "include": ["src", "test"],
```

`regex-first-match: "src", "test/node-builtins.d.ts"` · `last match in
file: "src", "test"`. The compiler obeys the second, the pin reads the
first: **`tsc` exits 0 with a write probe under `app/src`, pin green,
14/14.** This is precisely the scenario the pin exists for — "the shape
an editor complaint invites" — and the natural way to write it walks
through.

**(2) A SIDE DOOR THAT TOUCHES NEITHER PINNED FACT.** One line at the top
of `node-builtins.d.ts`, the file the card calls "READ-ONLY BY
CONSTRUCTION":

```ts
/// <reference path="./node-builtins-write.d.ts" />
```

The include list is untouched; neither ambient file's `export function`
set moves; all three assertions pass. And the writes are back in the app
program: **`npm run build` exit 0** and the **whole app suite 827/827 at
exit 0** with `rmSync(dir, { recursive: true, force: true })` live in an
`app/src` module — a call `T-073-s4` shows the sink sweep does not match
either, so that combination has NO gate at all. `T-073-s2` names this
mechanism in passing ("`exclude` … does not stop a file arriving by
import or by a triple-slash reference") without noticing it also defeats
the pin.

**(3) A THIRD, SMALLER ONE.** The surface assertions read
`export function (\w+)`. A write declared as
`export const writeFileSync: (p: string, d: string, e: "utf8") => void;`
is a valid ambient declaration the regex does not match.

**THE FIX, MEASURED RATHER THAN PROPOSED.** The executor's objection to
`JSON.parse` was real — `app/tsconfig.json` is JSONC and its `paths`
holds `"@/*": ["./src/*"]`, so naive comment-stripping eats the file from
that `/*` onward. The answer is not to parse it at all, but to ask the
compiler:

- `npx tsc --showConfig -p tsconfig.json` emits **real JSON, no
  comments**, with `include` verbatim AND an expanded 48-entry `files`
  array. Under the comment revert it reports the TRUE include list, so it
  kills (1) with no new machinery. Measured: under the triple-slash
  mutation it still reports only `./test/node-builtins.d.ts`, so it does
  NOT kill (2).
- `npx tsc --noEmit --listFiles` lists the actual PROGRAM. Measured:
  `grep -c node-builtins-write` = **1** under the triple-slash mutation,
  **0** on the intact branch. One assertion — *no file matching
  `node-builtins-write` is in the app program* — kills (1), (2) and (3)
  at once, because it asserts the property instead of a proxy for it.

Cost of the second: the test must spawn `tsc`, so it needs
`node:child_process` declared — which belongs in
`node-builtins-write.d.ts`, the test-only file, exactly where a
test-only capability should go, and `T-073-s4`'s recommended `SINKS`
widening keeps `app/src` from following it there.

**Recommendation.** Take `--showConfig` at minimum (one line, no new
surface, closes the revert the pin was actually built for), and correct
the two sentences that claim the current assertion is a parse — a false
sentence in a test comment is worse than no comment, because the next
reader trusts it.
