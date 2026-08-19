---
title: T-057's banking relocation turned a ref into state, so the chat now re-renders on snapshots that bank nothing
status: suggested
suggested_by: verifier claude-opus-5 @T-057
---

T-057 moved 43 lines of banking logic out of
`app/src/genesis/InterviewChat.tsx` into `observeBanking` in
`app/src/genesis/interview-model.ts`. The *rule* is faithfully preserved
— every branch, including the project-switch rebaselining, is the same,
and the seven mechanism mutants confirm it. But the relocation also
changed **where the baseline lives**, and that is a behaviour change no
test on this branch can see.

Before, the baseline was a `useRef` and the chips were `useState`:

```ts
const baseline = useRef<BankBaseline>(UNPRIMED_BASELINE);
const [chipsByTurn, setChipsByTurn] = useState(...);
...
if (docs.seq > baseline.current.seq || docs.projectDir !== baseline.current.projectDir) {
  baseline.current = bankBaseline(docs);   // ref mutation — no re-render
}
if (banked.length === 0) return;           // no setter called at all
```

After, both live in one `useState` and the transition returns a fresh
object whenever the baseline advances, even when nothing chips:

```ts
if (banked.length === 0) {
  return baseline === previous.baseline
    ? previous
    : { baseline, chipsByTurn: previous.chipsByTurn };
}
```

A fresh object literal is never `Object.is`-equal to `previous`, so React
does not bail out and the component re-renders.

**Measured**, with a temporary probe appended to
`app/test/interview-model.test.ts` and then removed (file restored, sha256
verified against `HEAD`):

```
M9 identity kept: false | prev baseline seq: 1 | next baseline seq: 2 | chipsByTurn identity: true
```

A quiet snapshot — seq 1 → 2, docs contents unchanged, nothing banked —
returns a new wrapper object while `chipsByTurn` keeps its identity. The
pre-relocation code called no setter on that path at all.

Two paths gained renders, not one: the `banked.length === 0` path above,
and the `merged.length === existing.length` path (a file that changes
twice inside one turn), which previously returned `previous` from the
updater and let React bail out.

**Why it is worth recording rather than shrugging at.** The reachable
triggers are routine: a deletion under `docs/`, a non-markdown file under
`docs/`, an unchanged-content snapshot at a higher seq, and the post-pick
status pull. And `InterviewChat` has an effect keyed on `transcript` —

```ts
useEffect(() => { ... el.scrollTop = el.scrollHeight; }, [transcript]);
```

— where `transcript` is recomputed unmemoised on every render, so its
dependency changes every render and the effect runs every render. Each
added render therefore also fires the auto-scroll write. The impact is
bounded (the write is a no-op when the reader is already at the bottom,
and the effect returns early when they have scrolled up), so this is not
a user-visible defect. It is a regression in the exact direction **T-056
(“the transcript stops re-rendering itself”)** is trying to move, landed
by a card whose subject is tests and whose fence says only that shipped
TypeScript moves.

The cheap fix keeps the pure transition and restores the identity: have
`observeBanking` return `previous` when `chipsByTurn` did not change, and
carry the advanced baseline in a ref that `InterviewChat` updates
alongside — or split the return so the baseline advance does not force a
new state object. Either keeps criterion 1 (one pure transition, shared by
chat and tests) intact.
