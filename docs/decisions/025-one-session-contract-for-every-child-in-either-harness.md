# ADR-025: one session contract for every child, in either harness

Date: 2026-09-12 · Status: accepted — the owner approved the architecture as the final draft of the
plan of record on 2026-09-12, after four review rounds between the Claude seat and the Codex
orchestrator, and accepted the v1 limitation in decision 3 the same day. Approval covers this
record and its checks; every card in the plan is filed and dispatched under its own authorization.

Vocabulary. Three words are used precisely throughout: an INTERFACE is shared behaviour both harnesses
present; a DEMONSTRATION is a happy path shown to work; an ENFORCED guarantee holds against
an agent that tries to break it; a PROCEDURAL safeguard holds against mistakes and is
accepted as such. Each claim below says which it is.


### Context

Two harnesses, Claude Code and Codex, each spawn their own subagents natively. The loop's
arm classifies, stamps, cuts, fences and renders briefs for a lane; the seat spawns the
child through its own harness. A seat cannot spawn a child in the other harness, and a
Codex session cannot hold the seat because the identity derivation names Claude only.
Every check the loop has is a Claude PreToolUse hook: the lane fence on writes, the push
guard and landing gate on the push. Under Codex none of them runs, and even under Claude
the push guard judges the command a session typed rather than the refs a push moves. A
child's assignment is recorded in several places (the stamp, the brief, the seat's ledger)
but in no single recoverable run state. The owner ruled on 2026-09-12 that either harness
must be able to dispatch lanes in either harness, and that the loop must run with Claude
only, with Codex only, or with any mix by role.

### Decision

1. **One session contract for every child, native or foreign** (interface). Every child run
   has a file-backed run record, one per attempt, written only by the arm's verbs, never by
   the child. Before a launch the arm takes the LANE'S single active-writer reservation,
   atomically (create-new on one file per lane, not per attempt), so two attempts cannot be
   active for one lane; the reservation is bound to the child's session id and process as
   soon as they exist. A record whose liveness is uncertain is RECONCILED (the process, the
   session, the lane's marker and git state) before any replacement, never assumed stopped.
   Seven operations, the same for a native subagent and a foreign process: start (confirmed
   started), observe (derived from the lane: the ask file, the stamps, the marker; never a
   heartbeat), send (an answer bound to its attempt id and question id, in three states:
   written, delivered, acknowledged by the child), wait (reserved, running, blocked,
   finished, failed, stopped), collect (result, evidence, usage or unknown), continue
   (resume that session, or an explicit replacement; a scope grant after the stamp is
   applied by a fresh executor, never by a resume), stop (termination confirmed, owned
   background jobs included).
2. **The arm decides; adapters translate** (interface). Card, base, fence, tier and brief
   stay the arm's. Two small adapters turn an assignment into a launch and a launch's
   output into the record. Harness, model and effort are separate fields in the record; the
   card's `builder:` and `verifier:` strings remain provenance.
3. **The push check is shared, judges the actual refs, and is procedural against deliberate
   bypass** (demonstration plus an accepted procedural safeguard). One judgement, the push
   guard and landing gate, runs from a git pre-push hook installed by the arm in every
   integration checkout, in either harness, and consumes the actual proposed updates (ref,
   old object, new object): the token is keyed to the pushed commit's tree, an unsupported
   update shape is refused by name, and a push of a commit other than the checkout's HEAD is
   judged on the pushed commit. Under Claude the existing PreToolUse guard stays as a second
   net. A session that bypasses the hook deliberately (`--no-verify`, a push from a checkout
   without the hook) is not stopped by v1; that limitation was accepted by the owner on
   2026-09-12 and is recorded here, and the runner's own owed set on the pushed range
   remains the public check. A
   protected receiving gate is a separate proposal, not a prerequisite of anything here.
4. **The seat may be held by either harness once two things hold in that harness:** the
   identity derivation recognises it, and the shared push check is installed in its
   checkout. Identity alone does not make a seat eligible for integration work. Each seat's
   launch boundary (network, authentication, filesystem) is explicit in the run records it
   writes.
5. **A lane's fence is enforced per harness, and proven before use.** A Claude child's fence
   is the write-time hook (a safeguard against ordinary mistakes, as the source itself
   says; not a security boundary). A Codex child's fence is the sandbox confining writes to
   the lane's own git state, plus the card's path check by the child before its stamp and by
   the landing gate at the merge. The lane layout for a sandboxed harness is whatever the
   demonstration shows confines refs; a shared clone is the candidate.
6. **Consultation offers two modes, and the adapter establishes the exact capability each
   promises.** PACKET mode: participants receive one frozen evidence packet and no
   repository; where a harness supports genuinely tool-less execution the adapter uses it,
   otherwise it configures the narrowest read profile the runtime documents and names that
   different guarantee in the room. TREE mode: participants read a clean clone at the ref;
   a Codex child's read confinement to that clone is the guarantee only if the runtime's
   filesystem permissions establish it in demonstration, a Claude child has no read sandbox
   and the guarantee is CONTEXT SEPARATION ONLY, stated as such. In both modes positions are
   collected by the seat from each child's own output and revealed together after every
   participant has ended; when one fails, the others' positions are revealed as collected
   and the failed one is re-run blind or recorded absent. Read-only is not tool-less, and an
   unsuccessful adversarial search by a test participant is evidence, never proof.
7. **Eligibility, never substitution.** An assignment that cannot meet its permission or
   independence requirement is refused by name, as the arm refuses a forbidden combination.
   No provider, model or authentication route is switched silently, at a quota or
   otherwise; unavailable usage is recorded as unknown.
8. **The three modes are accepted separately.** Claude only: every role and instrument
   without Codex. Codex only: every role and instrument without Claude, including the
   shared push check, and not depending on Codex-to-Claude dispatch. Mixed: either
   coordinator assigns either provider to any eligible role. One coordinator per sitting;
   two budgets, never pooled.
9. **Not built:** a daemon, an adapter registry, capability negotiation, an MCP bridge,
   credential isolation, a protected publishing gate. A daemon becomes a question only when
   work must be supervised with no seat alive.

### Consequences

The two-phase bench, the tiers, the verb, the ask file and the meters are unchanged. The
push token stays, re-keyed to the pushed commit's tree. The T-247 race is closed by the
per-lane reservation and the reconcile rule, proven by interrupting card 2 at the
launch-and-record boundary. Which documents each card touches is derived by the docs gate
at that card, not asserted here.
