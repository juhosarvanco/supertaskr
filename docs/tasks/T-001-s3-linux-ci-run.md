---
id: T-001-s3
title: Linux run of the app shell (CI or manual) to close criterion 1
status: suggested
suggested_by: verifier claude-fable-5 @T-001-verify
---

T-001 criterion 1 requires the Tauri window to open on macOS AND Linux.
Builder and verifier both ran on macOS only; the Linux half is
unverified in both the Implementation notes and the verdict, and stays
a caveat on T-001 until some run happens on Linux.

Suggest making the Linux claim machine-tested rather than trusted: a CI
job (e.g. GitHub Actions ubuntu runner with the Tauri Linux deps —
webkit2gtk-4.1, libappindicator3, librsvg2 per Tauri docs) that runs
`npm ci && npm run build` plus `npm run tauri build`, and optionally
boots `npm run tauri dev` under xvfb with a timeout to assert the
`[nputer] project folder:` / `window "main" created` startup lines
appear. Also closes the same gap for every future app task, not just
T-001. Depends on the repo growing CI at all — pair with whatever task
introduces it.
