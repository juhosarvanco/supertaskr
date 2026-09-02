---
id: T-018-s7
title: A pull the overtake guard drops must also emit no `model-updated`, and nothing drives that end to end through the shipped store — the property is inherited from an identity return that only a pure-reducer body asserts
feature: F-02
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-018-s6
blocked_by: []
touches: [app/test/startup-recovery.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-018-s6`** (the startup `docs_snapshot` pull could
overtake a `docs-changed` emit and `reduceDocs` decided on `seq` alone).
Same defect, the half that lives one caller UP from the reducer and
outside that card's fence.

## What T-018-s6 built, and the exact edge it left uncovered

`reduceDocs` now returns `prev` BY IDENTITY when a pulled snapshot
carries a higher `seq` and an older content time than an emit already
applied for the same project. The identity is not decoration: it is the
whole of the second guarantee, because `applyDocsPayload` opens

    const next = reduceDocs(shell.docs, payload);
    if (next === shell.docs) return; // stale/duplicate: no re-render, no echo

and that early return precedes BOTH `setShell` and `sendEcho`. So "the
dropped pull emits no `model-updated`" is TRUE, and it is true by
inheritance from a reference comparison rather than by anything that
drives it.

**THE MEASUREMENT THAT MAKES THIS WORTH A CARD.** Driven through the
SHIPPED store at the base (jsdom, the real `startDocsWatcher`, the emit
delivered while the `docs_snapshot` invoke is still in flight), the
unguarded defect produced a **second `model-updated` echo at `seq 6`**
over a model the emit had already echoed at `seq 5` — one observable
symptom of the overwrite that the pure reducer cannot show, because
`sendEcho` is module-private and the echo is a boundary effect.

## Why T-018-s6 could not build it

Its fence was `app/src/lib/watcher-store.ts`,
`app/src/lib/docs-model.ts`, `app/test/watcher-store.test.ts`,
`app/test/docs-model.test.ts`. Both fenced test files run in vitest's
`node` environment with no Tauri boundary mocked, and the echo path is
reachable only from a jsdom body that mocks `@tauri-apps/api/core` and
`@tauri-apps/api/event` — scaffolding that already exists, in
`app/test/startup-recovery.test.ts`, which is not in that fence. The
lane asserted the property at the only point it could reach — identity,
with `toBe` — and routed the rest here rather than converting a
47-body node-environment file to jsdom to reach one assertion.

## What a fix would build

One body in `app/test/startup-recovery.test.ts`, using that file's
existing `ipc` harness: deliver a `docs-changed` emit (`seq 5`, a LATER
`generatedAtMs`, three files) through the captured `onDocsChanged`
handler while the `docs_snapshot` invoke is parked, then release the
invoke with an `open` status carrying the overtaking pull (`seq 6`, an
EARLIER `generatedAtMs`, two files). Assert on `ipc.emits`: exactly ONE
`model-updated`, at `seq 5`. The pair must be built by hand — that
file's own fixtures, like both of T-018-s6's, stamp `generatedAtMs`
monotone with `seq`, so the two stamps cannot disagree in them and the
interleaving is unrepresentable.

## What is deliberately NOT in this card

The guard itself, which shipped with T-018-s6 and is pinned by five
bodies in `app/test/watcher-store.test.ts` (positive control, the
two-path agreement body, the over-broad and same-millisecond
directions, the `generatedAtMs: 0` abstain, and the cross-project
direction) plus one ruling body in `app/test/docs-model.test.ts`. This
card adds no source change at all: if it reds, the store changed, not
the reducer.
