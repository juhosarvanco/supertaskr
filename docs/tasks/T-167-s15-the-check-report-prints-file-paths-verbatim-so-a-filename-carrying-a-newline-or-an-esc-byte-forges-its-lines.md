---
id: T-167-s15
title: The check report prints file paths verbatim, so a filename carrying a newline or an ESC byte forges report lines and colours the gate's own output — measured at the base and at T-167-s13's tip, identically
feature: F-06
milestone: 4
priority: 7
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-167-s13
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE VERIFYING T-167-s13, AND IT IS OLDER THAN THAT LANE.**
`check::render` prints file paths into the report exactly as they came
off the walk, and the walk admits a filename containing a newline or an
ESC byte. A path is therefore able to end a report line and start one of
its own choosing.

**MEASURED, both binaries, same tree.** A scratch tree carrying
`src/ev\nil.ts` and `src/e\x1b[31m.ts` beside a normal file was indexed
and then made stale. Both paths land in `docs/architecture/graph.json`'s
`files[].path` verbatim (`'src/ev\nil.ts'`, `'src/e\x1b[31m.ts'`), and
`index --check`'s `files ~1` delta list then renders as:

```
[supertaskr-index]   | ~ src/ev
il.ts  (content, loc 1 -> 2, symbols 1 -> 2)
```

The second physical line carries no `[supertaskr-index]` prefix and no
marker, so a reader — or anything grepping the report — sees a line the
indexer did not write. The ESC byte reaches the terminal unescaped.

**THE BASE AND THE TIP ARE BYTE-IDENTICAL HERE**, which is the point:
the report produced by the binary at
`098cfe10a9e94fadf56122b77597df8e64a7f58f` and the one produced at
T-167-s13's tip `c51b7ba26b1e809ea0b4644885017a1f6c5cde71` diff to
nothing on that tree. **This is not T-167-s13's defect and that lane
must not be held for it.** T-167-s13 is named only because its `WHICH
FILES` list is a second list on the same surface, and because the
`check::bounded` factoring it introduced shows the shape of the repair:
one `render_path` helper, spent by `emit_lines` and by the drop
clause, rather than two escapings that can disagree.

**THE THREAT MODEL IS MODEST AND WORTH STATING.** Whoever can plant a
file in the tree can usually do worse; the value is that the gate's
output is read by agents and by scripts, and a report that can be
forged from tree content is a report whose lines cannot be attributed.

## No class parent

Searched `docs/tasks/` for a card owning "the report prints untrusted
bytes": none. `T-248`'s injection scan is a different class (prose
aimed at a model, inside `docs/`), and this is terminal output built
from filesystem names.

## Disposition hint

Probably promote at S, folded into whatever next touches
`app/src-tauri/crates/supertaskr-index/src/check.rs` — the repair is one
helper and its two call sites, and the body is a fixture with a hostile
filename asserting the report has as many lines as it has entries.
A human may reasonably rule it WONTFIX on the threat model above; that
ruling is worth recording either way, because the next verifier to plant
a hostile filename will find it again.

## Acceptance criteria

- WHERE the report prints a path taken from the graph, THE path SHALL be
  rendered so that no byte in it can begin a new physical line or carry
  a terminal escape.
- THE escaping SHALL have one implementation, spent by every list in
  `check.rs` that prints a path, the way `check::bounded` is now the one
  implementation of `MAX_LINES`.
- THE body SHALL drive a fixture whose filenames carry a newline and an
  ESC byte and assert the rendered report's physical line count equals
  its entry count.
