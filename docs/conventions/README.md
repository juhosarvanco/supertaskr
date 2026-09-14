# Conventions, split

This directory holds the per-topic chapters T-290 re-landed
docs/CONVENTIONS.md into under the foundation-files standard (ADR-023).
That document is now the INDEX: it carries every bullet's opener
verbatim beside the chapter the bullet lives in, in its own order, and
each chapter holds the rules themselves.

**A PROGRAM READS THE INDEX AND ITS CHAPTERS AS ONE TEXT.**
`conventionsText` in tools/e2e/scripts/docs-scan.mjs splices the pointer
lines back into the bullets they name before any rule is read out of the
document, and `splice_conventions` in app/src-tauri/src/dispatch/brief.rs
is the same rule in Rust. So a bullet found by its opener is found
wherever it now lives, and a chapter that stops carrying a bullet the
index published an opener for is a hard failure rather than a rule that
quietly left the document.

**Editing here owes two things.** A bullet whose opener changes owes the
index's pointer line in the same commit — the splice refuses otherwise —
and a new chapter owes a pointer, a `DOC_BUDGETS` row in
tools/e2e/scripts/docs-scan.mjs and a regenerated docs/INDEX.md, which
`npm run capabilities` from tools/e2e writes. The history, the
measurements and the argument behind a rule do not live here: they are
in the docs/reference chapter that owns the topic, and each compacted
bullet points at its own.

This file is not a chapter and the index does not point at it; nothing
reads it as a rule.
