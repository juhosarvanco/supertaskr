---
id: T-139-s3
title: The collector caps every file and never the payload — 2 000 x 1 MiB has no bound, and today 86.3% of the snapshot is markdown that is nowhere near the per-file cap
status: suggested
suggested_by: executor claude-opus-5 @T-139
---

**`MAX_FILE_BYTES` guards the wrong axis, and T-139's measurement is what
makes that visible rather than arguable.** Derived at `13c736e` by
`app/src-tauri/tests/graph_budget_bench.rs`, which collects this
repository's own tree through the production `collect_docs_tree`:

    the real snapshot   372 files · 7 240 105 content bytes · 7 503 958 IPC payload bytes
    graph.json          989 181 of those content bytes = 13.7%
    everything else     6 250 924 = 86.3%, all of it markdown
    largest markdown    145 078 bytes (docs/tasks/T-110-…), 13.8% of the per-file cap
    files over 100 KB   6 · files over 1 MiB   0

**So exactly ONE collected file is anywhere near the cap that governs all
372, and the payload is seven times that file.** The caps are
`MAX_FILE_BYTES = 1 MiB` and `MAX_FILES = 2 000`; their product is
2 GiB and nothing anywhere checks it. The comment above them says *"Caps
so a pathological repo cannot balloon the IPC payload"*, and on the
payload axis that is not what they do.

**IT IS ALREADY MISLEADING ONE SHIPPED ARGUMENT.**
`app/src/lib/watcher-store.ts` justifies its 8-second startup deadline
with *"what bounds the worst HONEST case is Rust-side and known — the
collector caps at 2 000 files and 1 MiB each (`docs_watch.rs`) — so a
repo at the file cap is ~13x this one's tree"*. **13x is a statement about
a plausible tree, not about the bound**, which is 2 GiB and ~280x this
one. The deadline is almost certainly still right; the sentence
supporting it is not the derivation it presents itself as.

**WHY IT DID NOT GET FIXED IN T-139'S LANE.** T-139 asked whether the
outer cap should MOVE, and the measured answer was no — the whole
delivery of the 989 181-byte graph is 3.66 ms, linear to 14 MB with no
knee, so nothing binds near 1 MiB and raising a per-file cap that governs
371 markdown files to buy headroom for one JSON file is the wrong trade.
That answer is orthogonal to this one: **the per-file cap is correctly
LEFT ALONE and there is still no aggregate cap.** Adding one is a new
refusal surface — it decides which files get dropped when a tree is
legitimately large, and "the last ones in path order" is a design
decision, not a mechanical one — so it belongs on its own card.

**Three shapes, and the second is the one T-139's card was pointing at:**

1. **An aggregate byte cap** beside `MAX_FILES`, spending the existing
   `SkipReason::FileCap` and `truncated` machinery, which already exists
   and is already rendered. Cheapest, and it makes the watcher-store
   sentence true.
2. **A GRAPH-SPECIFIC cap** on the `.json`-under-`docs/architecture/`
   branch of `is_collected_docs_path`, so the map's reality layer can
   grow past 1 MiB without every markdown file being allowed to. This is
   the shape T-139's own criterion 4 names, and it is the one to take if
   the map is ever to know more of a codebase than it does now — see
   `IndexOptions::max_graph_bytes`'s doc comment, which says so at the
   definition site.
3. **Report rather than refuse**: the snapshot already carries `skipped`,
   `skipped_total` and `truncated`, and `MapView.tsx` already renders a
   truncation notice. An aggregate figure on the snapshot would let the
   pane say how big the payload it is rendering was, which is the number
   nobody has ever seen.

**Fence: `[app-shell]`** for all three (`docs_watch.rs` is C-10); shape 3
additionally wants `app-map` to render it.
