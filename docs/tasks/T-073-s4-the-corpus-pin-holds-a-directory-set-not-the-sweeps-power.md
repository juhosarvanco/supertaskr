---
id: T-073-s4
title: The corpus pin holds a directory set, not the sweep's power — three narrowings it cannot see, one of them poison shape seven
status: suggested
suggested_by: verifier claude-opus-5 @T-073
---

T-073 widened the sink sweep from `app/src/genesis/` (8 files) to all of
`app/src` (47 files, 9 directories) and — knowing that a sweep whose
coverage is printed but pinned nowhere can be silently narrowed — pinned
the CORPUS: the exact nine-entry directory set plus four anchors at four
depths. That pin is real: it reds on the three narrowings the card names,
and P5 reproduces exactly (corpus filtered back to `genesis/` with a real
write present → **sink sweep GREEN, corpus pin RED**).

**It holds one dimension of three.** The sweep's power is
`corpus × vocabulary × iteration`. Only the corpus is pinned. All three
demonstrations below were run on the branch tip `7386790`, one-sided
(nothing the assertion shares was ever touched), mutated text read back
from `git diff`, and restored by sha256 against `git show HEAD:<path>`.

**(1) THE SINK VOCABULARY — poison shape seven.** A DOM-typed sink
planted under `app/src`:

```ts
export async function ping(payload: string): Promise<void> {
  await fetch("https://example.com/telemetry", { method: "POST", body: payload });
}
```

`tsc` is structurally blind to it (**exit 0** — `fetch` is DOM-typed, and
this is exactly the class the sweep exists for, since a type cannot see
`writeTextFile` arriving through a Tauri plugin either). The sweep reds
it correctly. Then one string leaves the array — `"fetch(",` deleted from
`SINKS` — and: **`npm run build` exit 0, app suite 42 files / 827 tests /
exit 0**, with a live network sink in the shipped frontend. The corpus
pin is green because the corpus genuinely did not move. This is a mutant
at a call site the pins do not cover, surviving an 827-test suite —
shape seven, on the card's own guarantee.

**(2) THE ITERATION IS NOT THE CORPUS.** The pin asserts what
`frontendFiles()` RETURNS; the sweep loop is free to filter afterwards.
One line inside it —
`if (file === "t073-verify-probe.ts") continue; // known false positive`
— leaves the live sink unswept, **14/14 green**, and the corpus pin
cannot see it by construction. This is how sweeps die in practice: the
first legitimate false positive earns an excuse, and nothing then holds
the rest.

**(3) NO CARDINALITY FLOOR, INSIDE THE PINNED FUNCTION ITSELF.** The pin
asserts a directory SET and four anchors; nothing asserts 47. A
single-file exclusion written inside `frontendFiles()` —
`return found.filter((f) => f !== "t073-verify-probe.ts")` — keeps all
nine directories and all four anchors, so **14/14 green** with the sink
live. Any file dropped from a directory that still has other members is
invisible. That is poison shape five, on the pin built to prevent shape
five.

**A related gap in the vocabulary, worth its own line.** `rmSync` — the
most destructive call in the surface this card moved out of `app/src`'s
reach — matches **none** of the eleven SINKS strings. Measured on the
intact branch: an `app/src` probe calling
`rmSync(dir, { recursive: true, force: true })` reds `tsc` (TS2305, exit
2) and the sweep passes it **14/14, exit 0**. So for that call the type
guard is a single point of failure, and `T-073-s5` shows two ways to
remove it. `mkdtempSync` and `appendFileSync` are equally unmatched.

**Recommended, cheapest first.**
1. Pin the `SINKS` array the same way the corpus is pinned — an exact
   `toEqual` on its contents, changed deliberately and never loosened.
2. Give the vocabulary the surface it is supposed to mirror: add
   `rmSync`, `mkdtempSync`, `appendFileSync`, `rmdir`, `unlink` — the
   sweep should at least cover the calls the ambient split moved.
3. Assert the sweep's own iteration: count files actually examined and
   `toEqual` it against `frontendFiles().length`, so a `continue` inside
   the loop reds.
4. A cardinality floor (`expect(files.length).toBeGreaterThanOrEqual(47)`)
   is one line and kills (3); the directory set stays as the shape pin.

None of this is a T-073 criterion failure — the criteria asked for the
widening and got it. It is the difference between a sweep that is wide
today and a sweep that stays wide.
