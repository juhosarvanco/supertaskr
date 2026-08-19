---
id: T-078-s10
title: The walk table closes its reader list at two, but four files read this file's bytes — the closure is over "can red", a property the sentence never states
status: suggested
suggested_by: verifier claude-opus-5 @T-078-reverify
---

T-078's fix closed T-078-s6 by naming a second live reader of
`docs/CONVENTIONS.md` and declaring the list complete:

> **BUT TWO LIVE READERS SIT OUTSIDE ALL FOUR WALKS, AND THIS LIST IS
> CLOSED AT TWO**

The executor flagged this as the thing to attack ("no test asserts that
only two non-walk readers exist"). Measured from the repo ROOT at
`5b5e1c7`, every file that reads `docs/CONVENTIONS.md` off disk:

| file | how | can an edit here red it? |
|---|---|---|
| `tools/e2e/tests/workflow-parity.spec.ts` `readConventions()` | `readFileSync` of this exact path | YES — a command bullet |
| `app/src-tauri/src/agent/kit.rs` `snapshot_version_matches_the_live_method_stamps` | `fs::read_to_string` of this exact path | YES — the method stamp |
| `tools/e2e/tests/shell-frame.spec.ts` `repoDocs()` | recursive walk of live `docs/`, `readFileSync(full, "utf8")` on EVERY file | no |
| `tools/e2e/tests/window-contract.spec.ts` `repoBoard()` | same walk, `.md` only | no |

**Four readers, not two.** The last two ingest this file's whole bytes
into a `DocsSnapshotPayload` on every full-lane run. They cannot red on
its CONTENT, and the reason is one line away in the same table: the
shipped parser filters `/^T-.*\.md$/` and `/^C-.*\.md$/` plus
`docs/ROADMAP.md`, and `CONVENTIONS.md` matches none of them, so its
bytes are carried and then dropped.

**So the sentence is true about the property it means and false about
the property it says.** "TWO LIVE READERS" is closed over *readers whose
assertions can red on this file's content* — which is the useful set, and
the right one for the table's purpose. But an editor who does the obvious
check, `git grep -n 'CONVENTIONS' -- tools/ app/src-tauri`, finds four
and has no way to tell which two the sentence meant. A closure claim that
a reader cannot verify with the search the same page tells them to run is
worse than the open version it replaced, which is exactly what T-078-s6
objected to, one turn later and in the other direction.

`shell-frame.spec.ts` also carries a hard floor — `if (files.length < 50)
throw` on the live `docs/` tree — so it is not merely a passive reader:
it is a live assertion ABOUT the tree this file sits in, and the table
does not mention it.

**The ask.** One clause, not a rewrite. State the property the closure is
over: *two readers can RED on this file's content* — the E2E parity spec
and the cargo stamp test — *and two more read its bytes without
asserting on them (`shell-frame.spec.ts`, `window-contract.spec.ts`,
both via a live `docs/` walk).* That is verifiable by the grep, keeps the
warning the table exists to give, and stops being false the moment
someone checks it. Alternatively drop "CLOSED AT TWO" and say "the two
that can red are"; the completeness claim is doing no work the naming
does not already do.
