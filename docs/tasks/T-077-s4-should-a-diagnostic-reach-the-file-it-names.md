---
id: T-077-s4
title: Should a diagnostic row reach the file it names? — the product question T-077 ruled around
status: suggested
suggested_by: executor claude-opus-5 @T-077
---

**@human · @architect.** T-077's criterion 3 required a RULING on
whether a cross-file issue row is clickable to the files it names. It was
ruled **NO**, for this card, on capability grounds — the reasoning is in
that card's implementation notes and in a comment above `ModelIssueRows`
in `app/src/App.tsx`. This finding carries the question that ruling did
not answer, because it is bigger than one strip.

**THE QUESTION.** Should the app be able to reveal or open a docs file at
all — from the parse-error strip, from a task card, from the map, from
anywhere?

**WHAT MAKES IT A DECISION RATHER THAN A FEATURE.**

- **ADR-012** puts native OS surfaces behind app-defined Rust commands
  with the webview capability set staying exactly `core:default`, and
  says in as many words that *"sensitive values like picked paths never
  transit the webview"*. Every existing native surface obeys this: the
  folder pickers take ZERO arguments and resolve the path Rust-side. A
  "reveal this file" affordance is the FIRST one that would need a path
  to travel webview → process. That is a new shape, not a new instance.
- **ADR-017** splits the world into "the spawned planner writes, the app
  renders what lands", and T-073 restored the type-level half of that
  guard. Opening a file in an external editor is not a write by the app —
  but it is the app handing a path to something that writes, and whoever
  rules should say whether that distinction survives contact.
- The app's IPC surface is **THIRTEEN** commands today and every merge
  that has not moved it says so explicitly in ARCHITECTURE. A fourteenth
  is a number several checkpoints quote.

**WHAT IT WOULD BUY, honestly stated.** The board's diagnostics name
paths a human then has to find by hand in their own editor. That is a
small cost paid often. The strip is not the only caller: task cards,
component nodes on the map and the genesis lens all render file-derived
identities that a human eventually wants to open.

**WHAT IT WOULD COST, equally honestly.** A path-taking command is a
process surface with a containment obligation — the same class of
argument the ACL pin, the session-id character class and the collector's
own path rules already carry — and it earns a sweep on every future
verification, forever.

**A CHEAPER MIDDLE OPTION, recorded so the ruling has three doors and not
two**: copy the path to the clipboard. It needs no new native surface
beyond what the webview already has, it works for every row uniformly
(which the navigate-in-app option does not — two of the four cross-file
kinds name `docs/ROADMAP.md`, which the board draws no card for), and it
is reversible.

Nothing is blocked on this. T-077 shipped inert rows and the strip reads
correctly without it.
