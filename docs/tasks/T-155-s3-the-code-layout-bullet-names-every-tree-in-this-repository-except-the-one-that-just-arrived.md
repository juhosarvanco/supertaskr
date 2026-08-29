---
id: T-155-s3
title: The code-layout bullet names every tree in this repository except the one that just arrived
status: suggested
suggested_by: executor claude-opus-5 @T-155
---

docs/ARCHITECTURE.md's Interfaces section carries a `Code layout:` bullet
that enumerates every tree in this repository and says which component
owns it — `app/` = C-05, `lib/parser/` = C-06, the indexer crate = C-07,
and `tools/e2e/` as *"the real-input lane + the docs-gate/token-lint/
brief analysers, dev tooling under no component, `.nputerignore`d out of
the map"*. T-155 added a second such tree, `tools/method-evals/`, and
that bullet does not mention it.

**THE DISPOSITION IS ALREADY DECIDED AND ONLY THE SENTENCE IS MISSING.**
The new tree is dev tooling under no component, exactly like
`tools/e2e/`: `.nputerignore` excludes `tools/` wholesale, so the graph
never walks it (derive: `cargo run -p nputer-index -- index --check
--root ../..` is CURRENT with the suite added), and no component file
claims it. So this is one clause in an existing bullet, not a component
declaration — **DO NOT declare a component for it**, which would move
three live-registry fixtures for a directory the map is configured not to
see (docs/CONVENTIONS.md, DECLARING A COMPONENT).

**WHY IT WAS NOT DONE IN THE LANE.** T-155's fence was
`[tools/method-evals, docs/CONVENTIONS.md]` and docs/ARCHITECTURE.md is
outside it. The fence hook blocked the write, which is the guard working;
widening the fence from inside the lane is the one repair an executor may
never make (`method/roles/executor.md`).

**THE SECOND HALF, WORTH TAKING WITH IT.** ARCHITECTURE's C-01 row
describes `method/` as *"The convention: templates, formats, roles,
interviews, docs-protocol"* and gives its status as built at a version.
It is now also the SUBJECT of a standing gate, and a reader of that row
has no way to learn so. One clause naming the METHOD EVAL GATE would
close it. Whether that belongs in the C-01 row or in the Interfaces
section is the taking session's call; putting it in both would be two
copies of one fact with no precedence rule.
