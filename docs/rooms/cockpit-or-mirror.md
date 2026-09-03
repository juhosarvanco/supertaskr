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

## D5 RULED (2026-08-30, @human, in @human's own words)

**"Of course the models the human assigns to different tasks do those
tasks as assigned."** Assignment is BINDING, not advisory. The
mechanics that serve the ruling: the card's `builder:`/`verifier:`
fields carry the assignment; every adapter ENFORCES it where its CLI
can be told (per-adapter, in the adapter's own entry); where a spawn
path cannot force it or a human pastes a brief by hand, nputer
VERIFIES instead — `built_by:`/`verified_by:` record what actually
ran, and any mismatch between assignment and execution is a
VIOLATION FLAGGED ON THE BOARD, never a silently accepted
substitution. The flag's card: T-169.

## RE-RULED FOR v1 (2026-09-03, @human, with the architect seat of the fourth Fable sitting)

**The question, as @human re-asked it the day after the 2026-09-02
wave:** *"The most important decision now is the form of the system.
Will the user run the process from Claude or Codex, or will they run
the process from nputer. The question is, where is the main
architecture conversation going to happen. That defines where the
process will be run. You anyway need to go to the Claude or Codex to
follow the subagent sessions work and maybe it is easier to control
the models etc from the Claude/Codex desktop apps or terminal. So
maybe the best place to run the process is from the Claude or Codex
apps. Should we move the interview also to Claude or Codex as a skill
or in other format?"*

**The evidence:** the fourth Fable sitting record in docs/checkpoints/
— the whole wave ran from the Claude desktop app, the app spawned
nothing, the board was a mirror, and every load-bearing piece was a
file, a script or a gate. The 2026-08-20 ruling's central property
held: the repo could not tell.

**The seat's recommendation (the thing ruled on):** the architect sits
in Claude or Codex; nputer is the record, the gates and the mirror; the
cockpit half (F-05's in-app orchestrator conversation, an in-app spawn
path) leaves v1; the interview ships as ONE interview in two lenses (a
skill in the agent app, the app's split view; one prompt, one file
contract); what gets packaged is the architect's hand work as a seat
skill over T-239's arm, nputer's CLI as `npx nputer`, and the app open
beside the chat as the mirror; and "a skill, a CLI and a mirror app"
is what nputer is for the technical first user.

**RULED (@human, 2026-09-03, verbatim): "Lets move forward with what you
just said."** Recorded as ADR-021.

Consequences here: the 2026-08-20 order "follower first, cockpit next"
becomes "follower is v1; the cockpit is not before v2 and only on
evidence a user wants it". D-X1 of docs/design/cross-harness-plan.md is
answered for v1: the app assembles briefs and spawns no Codex. D3 and
D5 stand as ruled. The cards cut (planned, NOT dispatched under
@human's standing instruction of 2026-09-02): T-241, T-242, T-243,
T-244.
