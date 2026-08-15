---
title: A dir-level skip (unreadable) sweeps the records buried under it
status: suggested
suggested_by: verifier claude-fable-5 @T-018-verify
---

T-018's collector reports an unreadable DIRECTORY as one skip entry
(read_dir failed — it cannot enumerate what is inside), and the reducer
exempts only EXACT skipped paths from the deletion sweep (`applySnapshot`
in app/src/lib/docs-model.ts). So chmod-000 on docs/tasks/ makes every
task record leave the model while the chip truthfully shows
"1 skipped file" with `docs/tasks: skipped — unreadable` — the records
themselves still read as deletions.

Not a criterion breach: T-018's enumerated classes (>1 MiB, non-UTF-8,
depth/file-cap) are per-file or recordless-dir skips, and for all of
them the no-phantom-deletion guarantee holds (verified live and at DOM
level). The `unreadable` class was an executor addition beyond the
criterion — strictly more truthful than the silent pre-T-018 vanish,
just not fully truthful.

Suggest: in the reducer's skip pass, treat a skipped `unreadable` (and
`tooDeep`) path as a PREFIX — exempt lastGood entries under `<path>/`
from the sweep and render them `showingLastGood: true`, the same
machinery per-file skips already use. Rust cannot name the buried
files, but the frontend's lastGood map already knows them. Repro: chmod
000 a docs subtree holding a previously collected record; the next emit
carries only the dir-level skip and the record leaves `files` (cargo +
reducer probes recorded in the T-018 verdict).
