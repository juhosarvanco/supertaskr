---
id: T-045-s1
title: CI could shrink two of the four divergences to zero
status: suggested
suggested_by: executor claude-opus-5 @T-045
---

T-045 replaced the parity spec's mirrored command array with a parse of
docs/CONVENTIONS.md "Build & test". The parse turned up FOUR deliberate
divergences between the doc's commands and the workflow's steps, where
the doc claimed two:

1. `npm install` → `npm ci` for app/ (documented, and genuinely wanted:
   lockfile-exact installs in CI).
2. `npx playwright install --with-deps chromium` (documented, and
   genuinely wanted: Linux system libs).
3. `npm run lint:tokens` (+ `-- --selftest`) →
   `node scripts/lint-tokens.mjs` and `… --selftest`.
4. `npm run boot:check` → `xvfb-run -a node
   tools/e2e/scripts/tauri-boot-check.mjs`.

3 and 4 are the shape worth revisiting. Both exist because CI reaches
past the package script to the file it runs — but neither needs to.
`npm run` does not require `node_modules` to be installed (the script is
plain node, and npm only extends PATH), so the token-lint steps could be
`npm run lint:tokens -- --selftest` and `npm run lint:tokens` with
`working-directory: tools/e2e`, exactly as CONVENTIONS lists them. The
boot check could be `xvfb-run -a npm run boot:check` from tools/e2e — the
xvfb wrapper is real and would stay, but the command inside it would be
the documented one.

That would leave two divergences, matching what the doc claimed all
along, and shrink the spec's CI_SEQUENCE mapping to the two that are
genuinely about CI being a different environment rather than about CI
spelling the same command differently.

NOT done in T-045 deliberately: changing a dormant workflow's commands to
make a test's table shorter is the wrong direction of causation, and the
workflow is the artifact that will run first at the repo's first push
with nothing having exercised it. The mapping is honest and argued as it
stands. This is a cleanup to take when someone is already editing ci.yml
for another reason — and it wants the parity spec re-run plus, for the
boot half, one local `xvfb`-less sanity check that npm's argv handling
does not eat the flags (T-046 measured that npm eats a bare `--config`
after a script name; `--selftest` after `--` is the safe form).
