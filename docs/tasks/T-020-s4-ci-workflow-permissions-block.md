---
id: T-020-s4
title: ci.yml declares no `permissions:` block — the GITHUB_TOKEN scope is whatever the repo default happens to be
status: suggested
suggested_by: verifier claude-opus-5 @T-020
---

.github/workflows/ci.yml pins everything else about its supply chain
— `runs-on: ubuntu-24.04` (not `-latest`), every `uses:` by full
40-hex commit SHA, `npm ci` everywhere, exact-pinned Cargo deps under
the audit — and then leaves the one credential the job carries
undeclared. There is no `permissions:` key at any level, so the
`GITHUB_TOKEN` handed to every step inherits the repository's (or
organization's) default workflow-permission setting, which is a
checkbox in the web UI, not a fact in this repo. That checkbox is
outside the repo's own record — exactly the class of machine-local,
invisible input T-009 §3 exterminated from the graph.

Nothing in this job needs write access: it checks out, installs,
builds, runs three suites, lints, audits, runs the E2E lane, and boots
the app under xvfb. It writes nothing back to the repository, opens no
PR, uploads no release, posts no status beyond the check itself.

Proposed, one block under `name: ci`:

    permissions:
      contents: read

and, if a later step ever needs more, the grant is added at the STEP's
job scope with the reason beside it — the same discipline ADR-012
applies to Tauri capability grants (the empty set is the default and
every addition is argued).

Two things make this cheap to do now rather than after launch. First,
the workflow is DORMANT (no remote exists), so there is no live run to
disturb — this is precisely the window for it. Second,
tools/e2e/tests/workflow-parity.spec.ts already machine-validates the
job's shape and would pin this in three lines beside the existing
runner/timeout assertions:

    expect(doc.permissions).toEqual({ contents: "read" });

Related surface the same pass should consider, not decided here: the
cargo cache step lists `~/.cargo/bin` in its `path`, so the
`cargo-audit` BINARY is restored from cache and executed. Cache scopes
are branch-isolated on GitHub (a PR branch cannot write main's cache),
so this is not an open door, but it does mean an executable enters the
job from a cache keyed only on `hashFiles('app/src-tauri/Cargo.lock')`
— a lockfile that has nothing to do with cargo-audit's own version.
Either drop `~/.cargo/bin` from the cached paths (and pay ~1 min of
`cargo install` per run) or key it on the tool version deliberately.
