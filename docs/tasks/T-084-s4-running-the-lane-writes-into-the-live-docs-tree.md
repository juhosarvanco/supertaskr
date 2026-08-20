---
id: T-084-s4
title: Running the E2E lane WRITES into the live docs/ tree and restores it — in the main checkout that is the tree the human's app is watching
status: suggested
suggested_by: executor claude-opus-5 @T-084
---

`tools/e2e/tests/token-scan.spec.ts`, in *"one runtime-built control byte
reds all seven first-party roots at exact byte offsets"*, appends a
poison byte to seven tracked files and restores them. One of the seven is
**`docs/NORTH_STAR.md`**, and two more are `AGENTS.md` and
`.github/workflows/ci.yml`. The restoration is proved properly — sha256
per file plus `git diff --quiet` over all seven at exit 0 — so the tree
is byte-identical afterwards and this is not a defect in that spec.

**What is unrecorded is the side effect while it runs.** `docs/` is the
tree the app's watcher is armed over. Running `npm test` from tools/e2e
in the MAIN checkout, beside a live `npm run tauri dev`, writes
`docs/NORTH_STAR.md` twice within a few milliseconds; the 250 ms
debounce will usually coalesce it away, but the human's board can
observe a snapshot in which that file is one byte longer. It is exactly
the class T-081's checkpoint recorded from the other side — *"integrating
any `app/src-tauri/**` card into a checkout with a live `tauri dev`
restarts the human's window"* — and it deserves the same one-line
warning.

Ran in a WORKTREE, as this card was, it touches nothing the human sees.

**Two cheap arms, neither taken here** (out of fence and not this card's
subject): name the hazard in CONVENTIONS' tools/e2e bullet beside the
PORT RULE, so "run the lane" carries the same "not beside the live app"
caveat the boot check does; or move the plant targets to files outside
`docs/` and prove the seven-root coverage a different way — though the
point of that spec is that CONTROL covers the whole first-party tree,
and `docs/` is a first-party root, so the first arm is likely the honest
one.
