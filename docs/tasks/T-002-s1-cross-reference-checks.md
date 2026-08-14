---
title: Cross-reference integrity checks in the parsed model
status: suggested
suggested_by: executor claude-fable-5 @T-002
---

T-002 validates files individually (plus duplicate ids), but nothing
checks references BETWEEN records: a `blocked_by:` pointing at a task id
that exists nowhere, a `feature:` naming an F-id missing from the
ROADMAP backbone (the board would silently drop that card from every
column), or a task file whose `id:` disagrees with its `T-NNN-slug.md`
filename. All three are cheap passes over the already-parsed
ProjectParseResult and would surface as ordinary ParseIssues — natural
home is a `validateProject(result)` layer in lib/parser, useful to the
watcher (T-003) and board (T-004) the moment they join tasks to columns.
