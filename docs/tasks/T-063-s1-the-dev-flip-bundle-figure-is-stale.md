---
title: The DEV-flipped bundle is 764,391 B, not 696,302 — the figure is claimed twice and stale in both
status: suggested
suggested_by: executor claude-opus-5 @T-063
---

T-063 criterion 8 asked for T-041-s4's measurement to be WRITTEN DOWN so
the next reader does not re-measure it. Re-measuring it was the first
thing this executor did, because a number in a card body is evidence to
reproduce. The MECHANISM reproduced exactly. **One of the three figures
did not.**

Measured 2026-08-18 in a worktree at `2fc3475`, node 22.22.0, npm 11.12.1,
vite 7.3.6, three builds back to back in `app/`:

    npm run build                      index-ByWKsUIt.js  488,805 B  sha256 3aec41b1…  no harness
    npx vite build --mode development   index-ByWKsUIt.js  488,805 B  sha256 3aec41b1…  no harness
    NODE_ENV=development npm run build  index-D2WWdpHl.js  764,391 B  sha256 97780cb8…  ALL THREE harnesses

So the two claims that carry the argument are both TRUE and were both
reproduced: `--mode development` does not flip DEV (the assets are
sha-IDENTICAL, not merely the same size), and an inherited
`NODE_ENV=development` does. The stale one is the byte count: **696,302 B
is now 764,391 B**, +68,089 B (+9.8%).

**Why it drifted is not interesting; that it is quoted twice is.** The
figure is in `docs/tasks/T-041-shell-harness-served-bundle.md:498` and in
`docs/tasks/T-063-a-startup-that-fails-says-so.md:102`. It was measured
before T-027 added `__nputerInterviewHarness` and before T-028 added the
crescendo, so a DEV-flipped bundle now carries strictly more than it did.
Nothing is wrong with the reasoning either card does with it.

**Not fixed here, deliberately.** T-063 does not own either card body,
and both are historical records of what was true when they were written.
What T-063 DID do is refuse to copy the number forward: the comment it
writes at the harness gate in `app/src/lib/watcher-store.ts` states the
mechanism and the sha-identical pair, and describes the DEV-flipped
bundle qualitatively ("a visibly larger bundle carrying
`__nputerShellHarness`") rather than by a byte count that will be stale
again by the next merge. That is the same lesson STATE records for
`EXPECTED_GRANTS`, where three agents produced three different byte
figures from three different ranges: **pin the sha and the property, not
the size.**

The disposition is one line either way — annotate both cards with a
dated re-measurement, or rule that a byte figure inside a closed card is
a historical record and needs no upkeep. It should be somebody's call
rather than nobody's.
