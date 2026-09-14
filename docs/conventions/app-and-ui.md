# The app, the UI and the genesis kit

Tauri's serve-time behaviour, the token rule, dismissal listeners, render-phase stamps, and the ratified kit and triage encodings.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- Tauri v2 applies the CSP (app/src-tauri/tauri.conf.json) at serve
  time — it never appears in dist/index.html (that was v1 behavior);
  don't "fix" its absence there.

- Tauri capability grants compile to code, not strings — `strings` on a
  binary proves NOTHING about ACL grants (vacuously "clean" even for
  granted permissions; only config JSON, e.g. the CSP, is
  string-findable). Since T-021 the webview-surface proof is PINNED, not
  re-derived per task: `app/src-tauri/src/acl_pin.rs` re-resolves the
  shipped gen/schemas through tauri's own resolver on every `cargo test`
  and fails with a `+`/`-` grant diff if the `core:default` set moves. A
  deliberate grant is added by re-pinning EXPECTED_GRANTS in the same
  commit, with the sweep — never by deleting or muting the test (ADR-012
  for why the set stays empty of app grants; T-007's verdict correction
  for the origin).

- UI work adds tokens to app/src/styles/tokens.css, never Tailwind
  defaults or arbitrary values — unmapped utilities are deliberately
  dead, and arbitrary values (`p-[13px]`) bypass enforcement (see
  suggestion T-001-s2).

- Suggestion-triage encoding is ratified in method/tasks/TASK-FORMAT.md
  (v0.1.4, T-016): promoted → absorbed into the promoted task ("Absorbs:"
  line) + suggestion file removed in the same commit; parked → in place,
  id now required; rejected → `git mv` to docs/tasks/rejected/ with a
  dated one-line reasoning. Flat `status: rejected` in docs/tasks/ stays
  a hard parse failure BY DESIGN (missing placement fields light the
  board's parse-error badge) — move the file, don't "fix" the parser;
  the flat-glob exclusion and the loud trap are both pinned in
  lib/parser/test/rejected-exclusion.test.ts.
  THE FOURTH QUESTION (T-084): **"resolved by other work" is not a
  fourth move and `closed` is not a ninth status.** It is a DISPOSITION,
  and disposition belongs to TRIAGE (T-083's integrator ruled it): a
  finding whose work was resolved elsewhere KEEPS `status: suggested`
  and records the discharge in its own body — a `closed_by:` line naming
  the commit is the shape `T-081-s7` uses — and TRIAGE then makes one of
  the three moves above, normally promotion. ADDING A STATUS IS A METHOD
  CHANGE, NOT A PARSE FIX: the vocabulary is ratified in
  method/tasks/TASK-FORMAT.md and lives in exactly one place in code,
  `lib/parser/src/types.ts`, which the DOCS GATE below READS rather than
  restates. Do not add a status to make one file parse — and a fence
  able to add one honestly would have to carry a method version bump,
  whose third file is Rust (T-078-s3).

- The genesis kit is ratified in method/roles/planner.md +
  method/interview/plan-interview.md (ratified v0.1.5, T-023 — a
  RATIFICATION record, NOT a claim about the current method version,
  which the first gotcha above owns): interview output is INCREMENTALLY
  BANKED — the stage → artifact table in plan-interview.md is normative
  and gets transcribed by programs (T-024 stage inference, T-025 kit
  packaging); changing it is a method version bump, and code reading it
  must be kept in sync. "pushing back:" is a rendering hint, never
  load-bearing; the transcript is not record. docs-templates/ are
  scaffolded VERBATIM — examples live inside HTML comments, and since
  T-030 parseRoadmap blanks every `<!-- … -->` span before matching
  lines, so a column-0 `- F-01:` example row inside a comment yields
  neither a phantom feature nor a roadmap-error (pinned in
  lib/parser/test/roadmap.test.ts). The templates stay comment-wrapped
  REGARDLESS — a comment is how an example says it is an example, and
  the parser's tolerance is a safety net, not a licence to ship
  live-looking rows in a scaffold.

- Outside-click/dismissal listeners must decide on pointerdown, never
  click — under trusted input the browser runs microtask checkpoints
  between listeners, so React's discrete-update flush lands
  mid-propagation and detaches the clicked node; a click-time listener
  then reads inside as outside and misdismisses (cost T-005 a
  rejection). Synthetic clicks propagate synchronously and CANNOT
  reproduce it — no unit/jsdom probe will warn you. Reuse
  attachPanelDismissal (app/src/components/board/panel-dismissal.ts);
  its test pins the trusted event order headlessly, and the real-input
  lane (tools/e2e) pins it under TRUSTED input — swapping those two
  strings back to `"click"` fails three bodies by name. The
  `data-panel-exempt` exemption is a SAFETY NET against accidental
  dismissal, not a guarantee that exempt controls stay pointer-reachable
  while a panel is open: the open panel occludes the header's exempt
  controls and keyboard reach is sufficient by design (human ruling
  2026-08-16, closing T-020-s1;
  tools/e2e/tests/panel-exempt-controls.spec.ts pins the occlusion).

- A RENDER-PHASE REF STAMP is legitimate only under three conditions,
  all three of them (T-042 criterion 4, the architect's ruling on
  T-024-s3; live example `app/src/genesis/GenesisPane.tsx`'s `logRef`
  write and the header comment above it). The fold must be GUARDED —
  returning `prev` BY IDENTITY for the already-observed and stale cases,
  so a StrictMode double-render and every unrelated re-render are
  no-ops; BOUNDED — what it feeds must tolerate a discarded concurrent
  render (a pulse window whose start moves by a few ms, cosmetic and
  self-healing); and DERIVED FROM PROPS THE RENDER ALREADY HAS — no
  I/O, no subscription, no second source of truth. Miss one and lift the
  state instead.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/13-surfaces.md (T-290), verbatim.
