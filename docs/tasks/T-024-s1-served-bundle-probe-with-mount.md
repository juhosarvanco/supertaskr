---
title: T-024's served-bundle probe cannot exist until T-026 mounts the pane — land it there
status: suggested
suggested_by: executor claude-opus-5 @T-024
---

T-024's Verification line calls for a "served-bundle probe rendering
the dry-run fixture" alongside the vitest and jsdom halves. That probe
was not written, and could not be: T-024 deliberately ships the genesis
pane **standalone and unmounted** — `App.tsx` and shell routing are
T-026's territory, and outside `app/src/genesis/` the only references
to the pane in the whole app are two comments in `docs-model.ts`. A
served bundle therefore has no route that reaches the pane at all.

What T-024 verified in its place: every Tailwind utility the pane uses
was confirmed to emit into the real built stylesheet
(`dist/assets/index-*.css`), which covers the styling half of what a
served-bundle probe would catch (a token class that silently does not
exist). What remains uncovered is the assembled-in-a-real-browser half:
layout under the actual split-view width, font loading, and the pane
rendered by the shipped bundle rather than by jsdom.

Suggested: T-026, which mounts the pane, carries the served-bundle
probe rendering the `streak` fixture — on an ephemeral free port, never
1420 (the T-017 precedent, which used 64502 and released it). The
fixture and the dev harness both already exist, so the probe is small
once a route exists. Alternative, if T-026's own probe scope is already
full: a follow-up task after the mount. Either way the item should not
evaporate simply because it was impossible in the task that specified
it.
