---
id: T-021
title: Shell IPC hardening — pin the zero-surface proof, throttle the picker
feature: F-02
milestone: 4
priority: 12
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-007-s2, T-007-s3. Triage 2026-08-15. Must land before
F-04 (dispatch), when the webview grant set first moves.

## Acceptance criteria
- THE cargo suite SHALL gain an ACL-surface regression test built on
  the T-007 verifier's demonstrated machinery (resolved authority
  from shipped artifacts + real InvokeRequests): dialog/fs/opener
  commands denied, app commands allowed, remote origins denied —
  the zero-webview-surface proof pinned, not re-derived per task.
- THE pick_project_folder command SHALL be single-flight (AtomicBool;
  concurrent invocations get a typed busy result) and the
  validate→arm mutex window SHALL be narrowed per the T-007
  verifier's residual notes.
- IF the ACL surface changes in any future diff THEN this test SHALL
  fail with a diff of the grant set (the alarm F-04 needs).

## Implementation notes

## Verdicts
