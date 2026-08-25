---
id: T-127-s2
title: The docs watcher is the fence word worth cutting and the shared primitives are not — two of the eight app-shell-only cards touch nothing but C-10, and none of them touches C-16
status: suggested
suggested_by: executor claude-opus-5 @T-127
---

`T-033-s7` asked whether shared primitives deserve their own fence word.
T-127 answered it **(a) leave it** — recorded in `C-16`'s own file — and
the census that settled it found the benefit somewhere else. This card
carries that somewhere else, with the fence consequences enumerated, so
the change can be SEQUENCED rather than made as a side effect.

## The census, re-derived at `afe23c1` — every figure in T-127's card is stale

The card's table was measured at `765924d`. At T-127's ref, over
`docs/tasks/` with status in planned|parked|building:

| slug | T-127's card (`765924d`) | derived at `afe23c1` |
|---|---|---|
| `app-shell` | 22 | **20** |
| `tools/e2e` | 9 | **10** |
| `docs/CONVENTIONS.md` | 8 | **9** |
| `app-agent` | 7 | **5** |
| `app-map` | 6 | **4** |
| `crate-index` | "2 or fewer" | **4** |
| `method/` | "2 or fewer" | **4** |

*"21 of the 36 planned cards want `app-shell`"* is **20 of 38**. The
demand-side figure reproduces on the numerator and not the denominator:
**57** of **134** card files with a `touches:` list name `app-shell`
(the tenth triage said 57 of 126), and *"no other slug exceeding 21"* is
now false — `tools/e2e` is **22**.

## The eight, and what each ACTUALLY touches

`T-126` — one of the nine the card names — has **shipped**. The other
eight, read rather than assumed:

| card | its real write set | component |
|---|---|---|
| `T-114` | `docs_watch.rs` and nothing else, by its own criterion | **C-10 only** |
| `T-035` | `applySnapshot` in `app/src/lib/docs-model.ts` | **C-10 only** |
| `T-044` | `src/lib.rs`, `src/acl_pin.rs`, `src/docs_watch.rs` | C-05 + C-10 |
| `T-106` | `src/lib.rs`, `src/docs_watch.rs` | C-05 + C-10 |
| `T-022` | front door, recents, precedence | C-05 |
| `T-099` | `app/test/watcher-truth.test.tsx`, `App.tsx` | C-05 |
| `T-100` | `App.tsx` | C-05 |
| `T-115` | `churn.rs` (and `agent/**` a pinned 0-file diff) | C-05 |

**THE BENEFIT, QUANTIFIED BY NAME: a dedicated `app-watcher` frees TWO
cards outright** — `T-114` and `T-035` leave `app-shell` entirely and
become concurrent with the other six — **and makes TWO more honest**:
`T-044` and `T-106` become `[app-shell, app-watcher]`, which is what
they already hold and do not say. The remaining four stay mutually
exclusive. **Say the small number rather than bury it**: 2 of 8, not 8
of 8. `app-ui` for `C-16` frees **0 of 8**; a slug for `C-11` frees
**0 of 8** (it owns no indexed file at all).

## THE FENCE CONSEQUENCES, ENUMERATED — this is why it is a separate card

`touch_slugs:` is what `touches:` expands to, so moving this one word
re-draws **20** live cards' fences at once.

- **LOSES paths**: `app-shell` gives up `app/src-tauri/src/docs_watch.rs`,
  `app/src/lib/watcher-store.ts` and `app/src/lib/docs-model.ts`.
- **Must move in the SAME commit or break**: `T-044` and `T-106` —
  both need `docs_watch.rs` and would silently stop covering it.
  `T-035` and `T-114` should become `[app-watcher]`.
- **Unaffected but re-fenced**: the other 16 live cards naming
  `app-shell` keep exactly what they need; none of them names a C-10
  path.
- **`app-board` loses nothing** — `T-111`/`T-112` are untouched by this,
  which is the one thing T-127's card asked to be checked and the answer
  is a plain no.
- **`docs/ARCHITECTURE.md`'s slug block goes stale the moment the field
  moves** (CONVENTIONS: the FIELD is authoritative, the block is prose).

**AND NOTHING WOULD RED.** Measured on T-127's lane: changing C-10's
`touch_slugs:` alone left `npm test` from `app/` at **973 / 973, exit 0**
(`T-127-s4`). A silent fence change is worse than a loud one, and this
one is completely silent.

## Fence and sequencing

`[docs/architecture/components/, docs/tasks/, docs/ARCHITECTURE.md]` —
one commit carrying the field, the four cards' `touches:`, and the slug
prose. `touches:` on a planned card is a placement field, so this is the
ARCHITECT's (single-writer rule, tasks/TASK-FORMAT.md). **Do not dispatch
it while any lane holds `app-shell`**: none did at `afe23c1` (the live
lanes were `T-130` on `[tools/e2e]` and `T-132` on three `method/`
files), and that is a live-environment fact to re-read, not to quote.
