---
id: T-045-s3
title: Composite actions and reusable workflows escape the permissions rules
status: suggested
suggested_by: executor claude-opus-5 @T-045
---

T-045 generalised the three least-privilege assertions off ci.yml's
hard-coded path: they now run over every `.github/workflows/*.yml` and
`*.yaml`, and a second workflow with no `permissions:` block fails by
name. That closes the hole T-036-s1 named. It does not close the whole
class, and the residue is worth writing down while the repo has no
instance of it — which is the cheapest moment.

Two shapes GitHub honours that the rules do not read:

1. **Composite actions** — `.github/actions/<name>/action.yml`. These are
   not workflows, so they carry no `permissions:` key of their own; they
   inherit the calling job's token. That means the enumeration is right to
   skip them for the "block exists" rule, but a composite action is
   exactly where a `run:` step that USES the token can hide from the
   reader of the workflow.
2. **Reusable workflow calls** — `jobs.<id>.uses: ./.github/workflows/
   x.yml` with `permissions:` on the CALLER. The callee is enumerated (it
   is a `*.yml` under workflows), so it gets judged — but the relationship
   is not: a caller granting `contents: write` to a callee that this spec
   separately certified as `contents: read` reads as fine from both ends.

Also unread, and cheaper to note than to build: `secrets:` blocks,
`environment:` protection rules, and third-party `uses:` whose own
`action.yml` runs arbitrary node (the SHA pin is the mitigation the repo
already has).

Shape of the fix, if and when a second workflow lands: extend
`workflowFiles()` to a `githubSurface()` that also collects
`.github/actions/**/action.yml`, and give the audit a second rule set for
them — every `run:` in a composite action must be accounted for the way
ci.yml's steps now are, and a `uses:` to a local reusable workflow must
not be granted more than that workflow's own declared block. Today all of
this would assert over an empty set, which is why it is a suggestion and
not a criterion: the fixtures in workflow-permissions.spec.ts are the
place to grow it, since they already prove rules over workflows that do
not exist on disk.
