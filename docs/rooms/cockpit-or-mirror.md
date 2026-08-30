# Room: is nputer the cockpit or the mirror? (resolved 2026-08-20)

## The question, as the human asked it

> I'm trying to decide if nputer is a way to follow the work claude
> code or codex is doing and you run the process from the respective
> apps, or if nputer is the app from where you run the process and you
> talk there with the orchestrator and set the executor and verifier
> models.

Raised while ruling D5 (`model@session`), and correctly held to precede
it — D5's answer falls out of this one.

## What the record already committed to

- NORTH_STAR non-goal: "Not an IDE or an agent: **we orchestrate
  agents users already have**."
- Hard constraints: terminal-forever (fully drivable without the
  dashboard); model-agnostic (any agent CLI that reads files can hold
  any role); the succession guarantee.
- ADR-017: the app renders what lands on disk and never believes what
  a model said; hand-driven is first-class and the universal fallback.
- F-04's slice is brief-assembly first, spawn later, by design and by
  milestone 3's own precedent (hand-driven genesis before any agent).

## The ruling (human, 2026-08-20)

**Both — follower first, cockpit next.** The two postures are the same
system observed from different chairs, and the design's central
property is that **the repo cannot tell the difference**: a brief
pasted into the user's own terminal and a turn spawned by the app
produce identical facts on disk. That indistinguishability is what
makes the succession guarantee and hand-drivability real, so it is a
feature to defend, never a gap to close.

Order: F-04's slice ships the follower (dispatchability, briefs, lane
watching, verdict recording — works with ANY agent); the spawn path
follows; F-05's in-app orchestrator conversation after that.

## The fact that sharpened it

Codex on this machine is the ChatGPT desktop app — whose CLI ships
INSIDE the bundle at `/Applications/ChatGPT.app/Contents/Resources/codex`
(codex-cli 0.147.0-alpha.1.2, measured, captures in
docs/research/captures/). Before that was found, the working belief was
"app only, no CLI" — and even under that belief the follower posture
included Codex fully: paste the brief into the app, it works in the
worktree, commits, and nputer sees it. **Follower mode is
model-agnostic by construction — it covers agents that exist only as
apps. A spawn path can only ever cover CLIs.** That asymmetry is why
follower ships first.

## Consequences

- **D5 takes its shape from this ruling**: `model@session` is INTENT on
  the card (the `builder:`/`verifier:` fields D3 ruled the app may
  write), ENFORCED per-adapter where nputer spawns (Claude: `--model`
  stays unpassed per ADR-003; Codex `exec` accepts `-m` — measured),
  and HONOURED by the human where they paste. No global rule exists;
  the adapter entry carries it.
- The dispatch UI's lane view must render lanes it did not create with
  the same fidelity as lanes it did — follower is not a degraded mode.
- **The bypass ban gains a measured second spelling**: `codex exec`
  carries `--dangerously-bypass-approvals-and-sandbox` (and
  `--dangerously-bypass-hook-trust`). The adapter-table ban must match
  both when the Codex entry is written.

## D3 RULED (2026-08-30, @human, decision sitting with integrator nputer-4e)

**Narrow yes.** The app may write into docs/ exactly what the method
already lets a dispatch write: card frontmatter stamps (the
`builder:`/`verifier:` fields above, `status:` at dispatch and close)
and APPENDS to record-class locations — cards it is entitled to stamp,
never an edit to a record already written. The four governing
documents (NORTH_STAR, ROADMAP, ARCHITECTURE, CONVENTIONS) and
`method/` are out of bounds: their sentences are RULE- and TRUTH-tier
(ADR-019), maintained by sessions under gates, and a program gets no
pen for them. The earlier partial ruling in this room is this rule's
special case, not a separate grant. Same gates bind the app as bind
any seat — the DOCS GATE and the budget bands read an app write
exactly as they read a session's.
