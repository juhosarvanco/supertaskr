---
id: T-021-s1
title: ACL pin's expected grant set is macOS-derived — decide per-platform pins when the Linux lane lands
status: parked
wake: T-303
suggested_by: executor claude-fable-5 @T-021
---

T-021's `EXPECTED_GRANTS` (app/src-tauri/src/acl_pin.rs) pins the 92
grants that `core:default` resolves to ON THIS BUILD HOST: tauri-build
target-filters `gen/schemas/acl-manifests.json` for the compiling
platform, and the pin resolves with `Target::current()`. The captured
macOS set already carries platform-scented entries
(`plugin:window|activity_name`, `plugin:menu|set_as_windows_menu_for_nsapp`),
so a Linux run (T-020's lane, T-018-s3's sibling) may resolve a
different — probably overlapping but not identical — list.

If it differs, the pin FAILS LOUDLY with the full +/- diff and the
re-pin list, which is the designed behavior (enumerated movement, never
silence), but the fix wants a decision, not a hot-patch: either
per-platform `EXPECTED_GRANTS` variants (`#[cfg(target_os)]` consts —
exact, more maintenance), or pinning a platform-normalized projection
(command set minus a documented platform-only allowlist — looser,
single list). Decide when the Linux lane produces its first real diff;
until then the macOS pin governs the only verified platform. The other
three acl_pin tests (capability source, runtime denials, authority
cross-check) are platform-independent and bind everywhere as-is.

Triage 2026-08-16 (architect, second pass): PARKED — the decision
wants the Linux lane's FIRST REAL DIFF, which STATE's launch item
already watches for by name. The pin fails LOUDLY with the full +/-
diff and a re-pin list if the set moves, so nothing goes silent while
this waits; choosing between per-platform `#[cfg(target_os)]` consts
and a platform-normalized projection before seeing the diff would be
guessing. Unpark at the first CI run.

Re-affirmed at triage 2026-08-17 (third pass): unchanged, and the
trigger has still not fired — CI remains dormant, so the Linux lane
has produced no first real diff to decide against. The reason this
stays parked rather than being guessed at is unaffected by the T-054
finding that CI has never gated graph currency: this pin does not
depend on CI catching anything, it depends on CI RUNNING once so the
diff exists to read. Nothing goes silent meanwhile — the pin fails
loudly with the full +/- diff and a re-pin list if the set moves.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-303; the expected grant set is one platform's, and per-platform pins are what the audit enumerates.
