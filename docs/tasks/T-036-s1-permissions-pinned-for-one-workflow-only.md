---
id: T-036-s1
title: The least-privilege pin covers ci.yml only — a second workflow file would inherit the web-UI checkbox again, silently
status: suggested
suggested_by: builder claude-opus-5 @T-036
---

T-036 made GITHUB_TOKEN's scope a fact in this repo instead of a
repository setting, and pinned it: tools/e2e/tests/workflow-parity.spec.ts
now asserts the top-level `permissions:` block exists, is exactly
`{contents: read}`, and that no job or step anywhere widens it. All
three assertions read ONE file — `path.join(repoRoot, ".github",
"workflows", "ci.yml")`, hard-coded in `loadWorkflow()` since T-020.

That is correct today (ci.yml is the only workflow) and quietly wrong
the moment it stops being true. A second workflow file — a release job,
a docs publish, a scheduled audit, anything launch prep adds — starts
life with no `permissions:` key and therefore with whatever the
repository's default workflow-permission setting grants. The whole
thing T-036 exterminated comes back for the new file, and the lane
stays green while it happens: nothing in the spec looks outside ci.yml,
and the new file's own author has no failing test telling them the rule
exists. The rule is written as a comment in ci.yml, which is precisely
the file the new author is NOT editing.

The asymmetry is worth naming: the discipline is repo-wide (ADR-012 —
the minimum is the default and every addition is argued in place), but
the enforcement is file-local, and the gap opens on the exact occasion
the discipline matters most — someone adding CI that genuinely does
write something back.

Proposal, small: have the spec enumerate the directory rather than name
the file. Read `.github/workflows/*.yml` + `*.yaml`, and run the three
least-privilege assertions over EVERY workflow found — block present,
exactly `{contents: read}` unless the file argues otherwise, no wider
scope at any level. The existing parity assertions (CONVENTIONS command
verbatim + order, SHA pins, apt set, boot step) stay bound to ci.yml —
they are about that job specifically — so this is a split between
"rules every workflow obeys" and "facts about the one CI job", which is
a clarifying split rather than an extra concept.

The one judgment call it forces: a future workflow that legitimately
needs a wider grant (a release job needing `contents: write`) must then
be expressible. Suggested shape, consistent with how this repo already
handles deliberate divergence (the parity spec's `npm ci`-in-CI note):
an explicit per-file exception table in the spec, each entry carrying
the scope, the file, and the reason — so the grant is argued in the
test as well as in the workflow, and adding one is an edit a reviewer
sees. Zero-allowlist is not available here the way it is for the token
lint, because some workflow eventually will need to write; the honest
target is "no unargued grant", not "no grant".

If the enumeration is judged premature while ci.yml is the only
workflow, the cheap interim is a line in docs/CONVENTIONS.md beside the
CI bullet stating the rule as repo-wide and naming the spec file — the
T-009-s1 pattern of a manual gate said out loud. Strictly weaker, but
it puts the rule somewhere the author of workflow number two will
actually look.
