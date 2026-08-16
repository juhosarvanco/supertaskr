---
id: T-020-s6
title: The parity spec pins ci.yml against a hard-coded list, not against CONVENTIONS — drift in CONVENTIONS is still invisible
status: suggested
suggested_by: verifier claude-opus-5 @T-020
---

Criterion 1 says the dormant workflow is "machine-validated now for
YAML validity + command parity with CONVENTIONS + SHA-pinned actions".
Two of those three are validated against the artifact itself. The
third is validated against a copy: tools/e2e/tests/workflow-parity.spec.ts
holds `EXPECTED_COMMANDS`, a hard-coded array of sixteen
(working-directory, run) pairs, with a comment pointing at
docs/CONVENTIONS.md "Build & test". The plan (§4.7) explicitly
sanctioned the hard-coding, so this is a growth step and not a defect
— but it leaves one honest hole worth naming while the lane is fresh.

What IS caught, re-derived by mutation (seven mutations, each caught
by exactly the intended assertion, all reverted): `npm test` →
`npm run test` on the app step fails "missing verbatim step: [app] npm
test"; unpinning `actions/checkout` to `@v7` fails the SHA test;
dropping `xvfb` from the apt set fails the apt test; a tab in the
indentation fails all five on `YAMLParseError`; moving `cargo audit`
above `cargo test` fails the ORDER assertion; dropping the
`WEBKIT_DISABLE_DMABUF_RENDERER` env or appending any step after the
boot step fails the boot test. The workflow cannot drift from the spec.

What is NOT caught: the spec drifting from CONVENTIONS. If someone
changes lib/parser's documented suite command in docs/CONVENTIONS.md,
nothing fails — the workflow and the spec agree with each other and
both are now wrong. The direction that matters most (docs are the
brain; the workflow is a thin invoker) is the unguarded one.

The hole is a little wider than usual right now, because the
CONVENTIONS text this spec claims parity with does not exist yet: the
tools/e2e command block, the `npm ci`-in-CI-vs-`npm install`-locally
note, and the port rule are all drafted in T-020's notes for the
INTEGRATOR to apply (§10 precedent). Six of the sixteen hard-coded
commands therefore point at a document section that is still unwritten.
If the integrator lands the notes verbatim they will match; if the
integrator rewords a command, nothing tells them.

Proposal: have the spec PARSE docs/CONVENTIONS.md rather than mirror
it. The "Build & test" section is a stable, machine-shaped list —
per-package bullets naming a directory and backticked commands — and
the same `yaml`-free string work the lint script already does would
extract them. Assert that every command the doc lists for lib/parser,
app, app/src-tauri and tools/e2e appears as a workflow step verbatim,
with the ONE documented exception (`npm ci` in CI where the doc says
`npm install` locally) expressed as an explicit, commented mapping
rather than an untracked divergence. Then criterion 1's phrase is
literally true, and the doc is the source of truth in code as well as
in prose.

Smaller alternative if parsing is judged too clever: keep the array
and add a CONVENTIONS pointer that names the spec file by path, so a
doc edit shows the reader where the machine copy lives. That is the
T-009-s1 regen-ritual pattern — a manual gate, said out loud — and it
is strictly better than the current comment, which points at the doc
but not back.
