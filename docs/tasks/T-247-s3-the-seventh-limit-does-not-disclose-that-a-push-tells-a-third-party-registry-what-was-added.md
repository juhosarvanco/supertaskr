---
id: T-247-s3
title: The seventh limit prices three costs but not the fourth — a push adding a dependency tells a third-party registry the name, from this machine, under a self-identifying user-agent
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-247
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-223`** (the disclosure IS the fix). **Disposition
hint: two sentences in the header; no code. Promote only with the next
edit to this hook.**

The seventh limit names three costs — four manifest formats read by
hand, the registry's word taken on trust, and a base URL that is an
environment variable — and the header prices a fourth decision
(`MAX_DEPENDENCIES_PROBED`) beside them. It does not name what the check
SENDS. Derived at `f6bc5c8`: every push whose range adds a dependency
name issues one outbound GET per added name to `registry.npmjs.org` or
`crates.io`, carrying the package name in the path and a static
`user-agent: nputer-landing-gate` header, from the pushing machine's own
address. Nothing else rides along — no repository name, no card id, no
lane, no query string, and the name is percent-encoded into a single
path segment (checked: `../../etc/passwd`, `https://evil.example/x`,
`%2e%2e`, `x?y=1` and `x#f` all reach the wire as one encoded segment on
the configured host, and a name carrying a control byte or an empty name
is refused before any request is made). So the exposure is small and the
same machine's `npm ci` already contacts the same host.

It is still a fact about the guard that a reader would want stated where
the other costs are, and the user-agent makes the caller identifiable as
an nputer checkout specifically. This project's own rule is that a guard
believed narrower than it is costs somebody a surprise; the fix is two
sentences in the limit-7 block saying what leaves the machine and what
does not.
