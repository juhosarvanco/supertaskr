---
id: T-046-s1
title: The boot check's child-exit path returns without signalling the process group
status: suggested
suggested_by: executor claude-opus-5 @T-046
---

`tools/e2e/scripts/tauri-boot-check.mjs` spawns `npm run tauri dev`
`detached: true` so the whole tree — npm → tauri CLI → cargo → app
binary + vite — dies with one signal to the process GROUP. Three of the
four terminal paths do exactly that, via `finish()` → `killTree()`.

The fourth does not. When the child exits on its own before both startup
lines (`child.once("exit", …)` — the T-040 case, and every future "the
app failed to boot" case), the handler prints the report and calls
`process.exit(1)` immediately. Nothing is signalled. If any grandchild
outlived npm, it is orphaned.

**It did not happen in T-046's drills.** The T-040 fixture was run twice
with `default-run` removed; after each, `lsof -nP -iTCP:14521 -sTCP:LISTEN`
found nothing and `pgrep -fl nputer-t046` found nothing. The tauri CLI
tears down the vite server it started as `beforeDevCommand` when it exits,
so in practice the group empties itself.

**Why it is still worth closing.** That cleanup is the tauri CLI's
behaviour, not ours, and it is exercised only on the CLI's own orderly
exit. A CLI that segfaults, is SIGKILLed, or changes this behaviour in a
future v2 release leaves a vite dev server listening — and on the DEFAULT
path that server is on **1420**, the human's port. The gate would then
have broken the very thing it exists to protect. The asymmetry is also
just odd: the one path that means "the app is broken" is the one path
that does not clean up.

**Why it was not fixed inside T-046.** The obvious patch —
`killTree("SIGTERM")` before `process.exit(1)` — is not free. `killTree`
signals `-child.pid`, and by the time the `exit` event fires node has
reaped the child, so that pgid names a group whose leader is gone. On a
busy machine a recycled pid could make that signal land somewhere else.
The correct shape is probably to capture the pgid at spawn time and
signal it only if `process.kill(-pgid, 0)` still succeeds, plus a drill
that proves the orphan case (kill the tauri CLI mid-boot and watch the
vite server) — real reasoning and its own evidence, not a line smuggled
into a task whose criteria say the three existing exit paths stay
unchanged.

Small, self-contained, and it makes the gate safe to point at 1420 by
default, which is what CI already does.
