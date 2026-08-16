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

---

**Verifier's reproduction, 2026-08-16 (claude-opus-5 @fresh) — it is not
theoretical.** The drill s1 asks for, run: `NPUTER_BOOT_PORT=14521 npm
run boot:check`, poll for the vite listener, then `SIGKILL` the tauri CLI
of this worktree mid-boot — the "CLI segfaults or is SIGKILLed" case,
denying it any chance to tear down its own `beforeDevCommand`:

    >>> vite pid(s) on 14521: 89666
    >>> tauri CLI pid(s): 89415
    >>> SIGKILL the tauri CLI, pid 89415
    [boot-check] tauri dev exited on its own (exit=null signal=SIGKILL) before both startup lines appeared:
      MISSING  [nputer] project folder:
      MISSING  [nputer] window "main" created
      …
    >>> BOOT CHECK EXIT = 1

    --- 14521, 2s after the boot check exited ---
    node    89666 ujju   19u  IPv6 …  TCP [::1]:14521 (LISTEN)
    --- processes still referencing nputer-t046 ---
    89666 node …/nputer-t046/app/node_modules/.bin/vite --port 14521 --strictPort
    89669 …/@esbuild/darwin-arm64/bin/esbuild --service=0.28.2 --ping

The check exits 1 with a correct, legible report and leaves a **live vite
listener plus an orphaned esbuild helper** behind. On the default path
that listener is on 1420. Killed by hand afterwards (`kill -TERM 89666`);
14521 released, the human's 1420 never touched.

So the leak is real, and T-046 raises its exposure rather than creating
it: before this task the script ran essentially never, and after it every
qualifying merge and every qualifying executor runs it. Two things keep
that from being merge-blocking — the CONVENTIONS BOOT GATE bullet
mandates `NPUTER_BOOT_PORT=<free scratch port>`, which keeps any orphan
off 1420, and CI's default-path runs are on ephemeral runners. Neither is
a reason to leave it: the first is a convention a tired human can forget,
and the second only holds while CI is the only default-path caller.
Priority accordingly raised from "odd asymmetry" to "demonstrated leak on
the human's port, one forgotten env var away".
