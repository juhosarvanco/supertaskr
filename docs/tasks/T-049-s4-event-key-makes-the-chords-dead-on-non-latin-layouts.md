---
id: T-049-s4
title: The chords read `event.key`, so they are silently dead on every non-Latin keyboard layout — and an IME-composing keydown is still claimed
status: suggested
suggested_by: verifier claude-opus-5 @T-049
---

`matchAccelerator` decides on `event.key.toLowerCase()`. `event.key` is
the CHARACTER the layout produces, not the physical key, so on a
Russian layout the key where `O` lives reports `"щ"` and the key where
`N` lives reports `"т"`. Measured against the real App and the real
store, 26 chords dispatched from the front door: **⌘+`щ` and ⌘+`т` are
not claimed and reach no command.** Same for Greek, Hebrew, Arabic,
Thai and any other non-Latin layout, and for Latin remaps that move the
letters (Dvorak). The user's ⌘O does nothing at all and there is
nothing on screen to explain why — the front door still advertises
`⌘O · ⌘N`.

This is INHERITED, not introduced: T-026's `EmptyState` handler read
`event.key` the same way and T-049 kept its semantics byte for byte,
deliberately and correctly (a chord fix and a semantics change in one
task is how you lose the ability to bisect either). It is also
genuinely narrow — every Latin-alphabet layout, the Nordic ones
included, reports `"o"` and `"n"` from those keys, which is why it has
never been reported. But T-049 is the task that made these chords
app-wide, and T-027 is about to add more of them to the same table, so
the table is the moment to decide.

The fix is one line in one pure function, which is precisely the
argument for the module T-049 built:

```ts
const physical = event.code === "KeyO" ? "o" : event.code === "KeyN" ? "n" : null;
switch (physical ?? event.key.toLowerCase()) { … }
```

`event.code` is the physical position and is layout-independent; the
`??` keeps `event.key` as the answer wherever `code` is absent
(synthetic events, some remappers, `KeyboardEvent` inits in tests — the
existing `matchAccelerator` unit table passes plain shapes with no
`code` at all, and would keep passing unchanged). Whether to do it is a
product call, not a bug fix: the counter-argument is that macOS's own
menu accelerators are layout-following, so a Russian user may EXPECT
⌘щ. Either answer is fine; the current state is the third one, where
the app advertises a chord it cannot receive.

**Second, smaller, same function: IME composition.** Measured: a
keydown carrying `isComposing: true` with `metaKey` and `key: "o"` is
CLAIMED — `preventDefault` ×1, `invoke("pick_project_folder")` ×1 —
because the matcher never looks at `isComposing`. The realistic case is
benign (a `keydown` during composition normally reports
`key: "Process"`, which is correctly not claimed — verified), and no
Latin-layout user can reach the bad case; but the conventional guard is
one clause, `if (event.isComposing) return null;`, and the pure matcher
is where it belongs. Fold it into the same edit or rule it explicitly
out of scope — either is better than it being unconsidered.

Everything else criterion 6 asks for holds, re-derived independently:
of 26 chords fired at the real app (⌘⇧N, ⌘⇧O, ⌥⌘O, ⌥⌘N, ⌃⇧N, ⌘P, ⌘F,
⌘A, ⌘S, ⌘W, ⌘Q, ⌘Z, bare `o`, bare `n`, Escape, Enter, Tab, `Dead`,
`Unidentified`, `Process`, `ø`, `ó`, `щ`, `т`, ⌘ alone, ⌘⌃O), exactly
one is claimed beyond the four the app declares — ⌘⌃O, and that one BY
DESIGN, since the matcher reads Command OR Control.
