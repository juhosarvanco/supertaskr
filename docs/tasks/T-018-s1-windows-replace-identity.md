---
title: Windows cannot detect a replaced docs/ (dir identity is unix-only)
status: suggested
suggested_by: executor claude-fable-5 @T-018
---

T-018's root sentinel detects a wholesale-replaced docs/ by comparing
the armed directory's (dev, ino) against a fresh stat
(`dir_identity` in app/src-tauri/src/docs_watch.rs). On non-unix the
identity is `None`, so the (armed, present) reconcile branch keeps the
existing handle: docs/ APPEARING and VANISHING still self-heal on
Windows (those are armed-state + existence checks), but a rename-swap
replacement behind the same path keeps the stale watch until the next
appear/vanish transition or a re-pick (the re-pick heal is also
identity-gated, so it too degrades to the pre-T-018 keep-the-watch
behavior there).

Deliberate at T-018 time: no Windows verification lane exists (macOS
dev + a pending Linux run are the project's platforms), and guessing at
ReadDirectoryChangesW semantics without one would be untested code. If
a Windows lane ever lands, implement identity via
`std::os::windows::fs::MetadataExt` (volume serial + file index needs
an opened handle — `GetFileInformationByHandle`) or fall back to
re-watching whenever the debounced batch contains an event whose path
equals the docs dir itself, and extend the three sentinel live tests to
the platform. The additive-only pins already cover the failure shape
(unknown identity keeps the handle; nothing errors).
