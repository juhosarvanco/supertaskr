---
id: T-064-s2
title: In the overtaking interleaving the BOARD renders over the genesis folder until the invoke reply lands — measured "board", one render, and outside T-064's criteria
status: suggested
suggested_by: executor claude-opus-5 @T-064
---

T-064 criterion 1 fixes what the shell shows AFTER the genesis switch
lands: the overtaking emit's tree is kept instead of being reset away.
It says nothing about the window BEFORE it lands, and there is one.

`applyDocsPayload` (app/src/lib/watcher-store.ts) ends with
`setShell({ docs: next, phase: shell.phase === "genesis" ? "genesis" :
"open" })`. That clause exists for the right reason — T-026's rule that
the pipeline lighting up must not yank an interview away — but it can
only protect a phase that is ALREADY `genesis`. In the overtaking
interleaving the phase is still `noDocs` (or `open`), because the
invoke reply that sets `genesis` has not arrived yet. So the emit moves
the phase to `open` and the BOARD renders over the folder the user just
started an interview in, until the reply lands.

**MEASURED at T-064's tip**, inside
`app/test/genesis-switch-truth.test.tsx`'s
*an emit that overtakes the switch is KEPT*, by reading `screenOf()`
between the `emitDocs(...)` and the `reply(...)` steps:

    screen-between: board      (fileCount: no genesis pane mounted)

One render, and in production the gap is one IPC round trip rather than
a test's explicit await — but it is the same class of untruth this card
is about, one moment earlier, and it is reachable exactly when
criterion 1's fix is reachable.

**THE MATERIAL IS ALREADY IN THE STORE**: `shell.picking` is true for
the whole of `runPicker`, which is precisely the window. An
`applyDocsPayload` that declines to move the phase while a pick is in
flight would close it — the docs model would still update (that is the
part that must not be lost), only the SCREEN would wait for the reply
that is about to name it. Sized S. Deliberately not taken here: it is a
fourth reader of a fourth fact about a pick in flight, no criterion asks
for it, and the T-064 executor's own rule was not to widen a card that
already rules on three findings.
