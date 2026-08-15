---
title: ACL pin's expected grant set is macOS-derived — decide per-platform pins when the Linux lane lands
status: suggested
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
