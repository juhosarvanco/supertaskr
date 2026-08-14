---
title: Cache parsed models between reloads
status: suggested
suggested_by: executor codex @T-101
---

Re-parsing the whole tree on every save is wasteful once projects grow;
a content-hash cache would make the watcher loop cheap. One paragraph of
context, as the format requires — suggestions are minimal files.
