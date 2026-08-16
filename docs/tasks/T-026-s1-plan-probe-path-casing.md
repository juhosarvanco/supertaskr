---
title: The plan probe matches docs/ROADMAP.md case-sensitively — decide the casing rule before Linux
status: suggested
suggested_by: executor claude-opus-5 @T-026
---

`probe_plan` (app/src-tauri/src/docs_watch.rs) stats exactly
`docs/ROADMAP.md` and `docs/ARCHITECTURE.md`, and counts any
`docs/tasks/*.md`. The criterion names those paths verbatim and the
parser's own model input is `docs/ROADMAP.md` (`ROADMAP_FILE` in
app/src/lib/docs-model.ts), so the exact spelling is right — but the
CONSEQUENCE differs per filesystem, and only one of them is exercised
today:

- macOS/Windows (case-insensitive by default): a repo carrying
  `docs/roadmap.md` — which is how the design bundle's own checklist
  spells it — probes as `roadmap: true`, so genesis is correctly
  refused and the folder opens as a project.
- Linux (case-sensitive): the same repo probes `roadmap: false`. If it
  also has no `docs/tasks/*.md`, `has_plan()` is false and the app
  OFFERS genesis for a folder a human would call planned. Nothing is
  overwritten (the app writes nothing; the agent is the writer, ADR-017)
  and the board would render nothing from `docs/roadmap.md` either, so
  this is a truthfulness question, not a data-loss one — but the two
  platforms disagree about what "already has a plan" means, which is
  exactly the kind of silent divergence T-021-s1 flagged for grants.

Decide the rule rather than inheriting the filesystem's: either (a) keep
exact-match and let the parser's spelling be the definition (then say so
in CONVENTIONS, and consider a lint that names a mis-cased ROADMAP as a
parse issue — T-030's lane), or (b) make the probe case-insensitive by
reading `docs/`'s entries once and comparing lowercased names (one
read_dir instead of two stats; also picks up `docs/Tasks/`). Cheap
either way; wants a decision, not a hot-patch. Feeds the Linux lane
(T-020) where the difference first becomes observable.
