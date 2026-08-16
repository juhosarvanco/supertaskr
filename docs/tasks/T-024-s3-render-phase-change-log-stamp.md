---
title: GenesisPane stamps its change log during render — bounded today, worth a ruling
status: suggested
suggested_by: executor claude-opus-5 @T-024
---

`GenesisPane.tsx:140` mutates a ref during the render phase:

    logRef.current = observeDocsChange(logRef.current, docs, clock());

This is how the pane learns which files just changed (the input to the
`writing` pulse window), and it follows the render-time ref-cache
precedent T-012 established for layout. It is guarded: `observeDocsChange`
returns `prev` **by identity** for the empty state and for already-observed
or stale seqs, so StrictMode double-renders and unrelated re-renders
cannot re-stamp, and the derivation itself stays pure.

The residual concern is React's rule against render-phase mutation. If
concurrent rendering discards a render *after* it stamped seq N, the
committed render sees seq N as already observed and reuses the discarded
render's timestamp. The blast radius is a pulse window whose start moved
by the few milliseconds between the two renders — cosmetic, self-healing,
and invisible in practice. Nothing else in the model depends on it.

Options for the architect: (a) accept it as the established T-012
pattern, documented; (b) move the fold into `useEffect` — costs one
extra render per snapshot and briefly renders the pre-change log, which
would make a just-appeared file flash as `written` before it pulses;
(c) lift the change log out of the component entirely, folding it in the
watcher store beside the snapshot it describes, so the pane becomes a
pure function of props with no ref at all. (c) is the cleanest and the
most invasive — it touches C-10, which was read-only to T-024, and it
would let T-026/T-027 share one change log across both interview panes
rather than each keeping its own. Worth deciding before a second
consumer appears.
