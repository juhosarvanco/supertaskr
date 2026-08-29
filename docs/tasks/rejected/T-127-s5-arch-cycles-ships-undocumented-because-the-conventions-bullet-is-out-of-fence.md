---
id: T-127-s5
title: The arch cycles gate ships undocumented because the CONVENTIONS command bullet is outside T-127's fence — the command exists, the section that lists commands does not know it
status: rejected
suggested_by: executor claude-opus-5 @T-127
---

T-127 added `nputer-index arch cycles [--root DIR]` — the enforcing form
of @human's no-cycles ruling of 2026-08-25. It is in `--help`, it is
covered by 22 test bodies, and **it is not in `docs/CONVENTIONS.md`'s
"Build & test" section**, because that file is not in
`[crate-index, docs/architecture/components/]`.

## What is owed

The `app/src-tauri` bullet lists its sibling commands and should list
this one, with the disposition the other two READ-ONLY reporters already
carry:

    cargo run -p nputer-index -- arch cycles --root ../..

- Exit **0** the declared registry is acyclic · **1** a declared cycle,
  named as a path · **2** called wrong · **3** the registry could not be
  read. The same four codes `index --check`, `boot:check` and
  `lint:docs` use.
- **It reads the REGISTRY only** — no graph, no index — so unlike `arch`
  and `arch drift` it does not exit 3 without a committed
  `graph.json`, and it cannot be a false red from a stale one.
- CI disposition: it is a **gate**, not a reporter, so unlike
  `index --watch` and `arch` it is a candidate for a workflow step —
  but note `tools/e2e/tests/workflow-parity.spec.ts` derives its
  expectations FROM that bullet in both directions, so **adding the
  command to the doc without adding it to `CI_SEQUENCE` or `LOCAL_ONLY`
  fails the lane by name** (the mechanism T-090 walked into on purpose).
  Change it in the doc, change it in the spec, or the lane fails.
- The MIDDLE DOT rule governs the edit: the separator belongs between
  commands or after the last one, never inside a parenthetical.

## Why it is not merely tidiness

`cargo test -p nputer-index` already carries the same predicate against
this repository's own registry, so the RULE is enforced today whether or
not the doc lists the command. What the doc buys is the reverse
direction: a reader who wants to ask "is the registry acyclic?" has no
way to learn that a command answers it, and T-127's own argument is that
**a ruling without a discoverable gate decays at exactly the rate people
forget it**.

## Fence

`[docs/CONVENTIONS.md, tools/e2e]` — the bullet and the parity spec must
move together. `tools/e2e` was held by `T-130` at `afe23c1`; re-derive
before dispatch rather than trusting this sentence.

Absorbs (eleventh triage, 2026-08-26): T-133-s1 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.

closed_by: the ADR-019 phase-5 commit that adds `arch cycles` and
`arch blast` to the app/src-tauri command bullet with the exit legend
this card specifies (commas inside the parenthetical, middle dots
between commands, per the CI bullet's own typographic rule) and the
matching LOCAL_ONLY entries in workflow-parity.spec.ts — find it with
`git log -S "arch cycles --root" -- docs/CONVENTIONS.md`. Executed
directly at @human's direction per docs/rooms/governing-docs.md's
override.

Amnesty triage 2026-08-29 (triage seat): REJECTED — DISCHARGED, NOT DECLINED — the card carries its own closed_by line and the work landed. Verified at this base: docs/CONVENTIONS.md's app/src-tauri bullet now carries `cargo run -p nputer-index -- arch cycles --root ../..` with the exit legend this card specifies (line 35), the command appears twice more in the file's own reasoning, and tools/e2e/tests/workflow-parity.spec.ts carries the matching LOCAL_ONLY entry, so the parity trap this card warns about was avoided. The absorbed T-133-s1 went with it. Recorded here rather than as an absorption because the resolver is an ADR-019 phase commit executed at @human's direction and no card exists to carry the Absorbs line.
