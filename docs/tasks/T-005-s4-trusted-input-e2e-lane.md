---
title: Real-input E2E lane for interaction criteria (trusted-event timing)
status: suggested
suggested_by: verifier claude-fable-5 @T-005-verify
---

T-005's rejection is a whole class of bug that the project's current
verification means cannot catch: trusted (OS-originated) events
perform microtask checkpoints between listener invocations (HTML
spec: a microtask checkpoint runs whenever the JS stack empties,
which happens between listeners of a browser-dispatched event), so
React 18's discrete-update flush can land BETWEEN two listeners of
the same click. Synthetic `element.click()` / `dispatchEvent`
propagate synchronously with no checkpoints, so unit tests, jsdom,
and in-page probe scripts all pass while a real mouse fails. T-005's
blocker-link close is exactly this; the builder's probes were sound
by every synthetic means available and still missed it.

Suggest: a minimal real-input E2E lane for verifier use on
interaction criteria — Playwright (or WebDriver/CDP Input) driving
the dev bundle + `window.__nputerDocsHarness` on a scratch port,
issuing REAL clicks and REAL key events (Esc, Enter/Space
activation). Keep it out of app/'s dependency tree per the ADR-011
family: its own small package (e.g. tools/e2e) with its own
package.json, or a decision that verifier sessions install it
ad hoc. This also gives the standing Linux caveat (T-001-s3) a
natural home, and would let the T-005 fix ship with a regression
test instead of a manual repro. Architect call on tooling and
placement; the lane itself is a day-size task.
