# Capture: the first-walk cold-start test, run by hand (2026-08-30)

The method's rule (plan-interview.md): "Then: cold-start test. A fresh
session reads only docs/ and explains the project back. Gaps in its
answer are gaps in the docs — fix and repeat." Genesis has no owner
for the step (T-171); this run was performed by the integration seat:
a fresh claude-opus-5 session, reading restricted to
/Users/ujju/Projects/first-walk/docs/, 14 files read, nothing else.

The explain-back succeeded across all seven stages (person/scene,
S-1..S-3 with the enforceable/unenforceable split understood,
non-goals with the template partial-overturn tracked, constraints
including the never-truncate guard class, ADR-001's shell/Go
rejections with reasons, the riskiest assumption and its unrun cheap
tests, the strictly-serial T-001→T-002→T-003 order derived from the
overlapping fences). The verdict was "the docs are not whole", with:

## A. Contradictions (7)
A-1 ARCHITECTURE still says "hands the process over and does not come
back" while ADR-002 establishes Node cannot exec and the parent
survives — ADR-002 predicted the stale wording and did not fix it.
A-2 "Nothing runs after the editor starts" (ARCHITECTURE) vs "exit
with the editor's status" (T-003) — a hard conflict that will bite
T-003's builder depending on which document is read first.
A-3 STATE names three live [?] items; grep finds nine, including the
project-invalidating terminal-focus assumption — a transcribed count,
stale at birth.
A-4 S-1's two paragraphs disagree on whether the editor's startup is
in the budget; ADR-002 exists to arbitrate but is provisional.
A-5 S-2's "no prior setup step" vs F-03 deferring PATH to an alias —
an alias is a setup step.
A-6 ADR-001's context paragraph carries the exists-then-write shape
CONVENTIONS calls a defect on sight (corrected only parenthetically).
A-7 CONVENTIONS+ARCHITECTURE order T-001's executor to record the
layout "in the same commit" — outside T-001's touches. The defective-
card class, in a criterion's clothing.

## B. Not derivable from docs/ (9)
B-1 The entire method tree (roles/executor|verifier|orchestrator,
lane-protocol, docs-protocol, decomposition, nputer.yaml) is cited
normatively and shipped nowhere → T-174. B-2 ADR-001 names T-004;
no such card exists. B-3 the check that reports S-1 is never named.
B-4 .nputer/bench-startup.js cited but unverifiable from docs/ (it
does exist — gitignored). B-5 the four things TASK-FORMAT delegates
to "the PROJECT" (card-input gate, vocabulary check, shipping
partition, blast-radius derivation) are unnamed in the project's
CONVENTIONS. B-6 the interview transcript is authority for five
documents and invisible (it survives in .nputer/genesis/ —
gitignored). B-7 repo facts (shebang, chmod, package.json, license,
inbox.md location). B-8 unspecified behaviours (exit codes, TZ, note
path as directory, symlinked ~/notes, trailing newline, PATH
collision). B-9 nobody owns S-3's verdict.

## C. Thirteen questions for a human before T-001
Board-review authorization; ~/notes + filename confirmation; layout +
the A-7 fence conflict; the header's exact bytes; the ADR-002 ruling;
the method tree's location; T-004's existence; the bench harness;
rewriting ARCHITECTURE before T-003; the five-capture terminal-focus
test; exit codes; package.json/shebang; inbox.md vs the S-3 adoption
list.

Assessment quoted from the report: "The vision, the users, the
non-goals, the constraints, the stack rationale and the three cards
are unusually complete and self-critical — the [?] discipline is
visibly doing real work... Items 1-5 in section C must be answered by
a human before T-001 is dispatched."
