# Glossary

The house terms, each with the standard word beside it.

| house term | standard word | one line |
|---|---|---|
| The Model | the system's shape | your agent app drives; nputer is the skill, the CLI and the mirror |
| The Loop | the development cycle | interview, board, dispatch, build, verify, merge, record |
| The Architect | planner, orchestrator, integrator | the seat that plans the board, dispatches lanes and merges |
| seat | role, session | one fresh agent session holding one written contract |
| card | task | one file under docs/tasks with criteria, a fence and verdicts |
| board | task list, story map | every card, rendered from files |
| fence | write scope | the paths a card may touch, enforced by a hook at the write |
| lane | worktree on a task branch | where one builder works on one card |
| bench | verifier worktree | cut at the same commit as the lane, before any diff exists |
| brief | task prompt | the contract a program assembles for a seat from the card and the docs |
| attack set | test plan written blind | the verifier's list of ways to satisfy the letter and fail the intent |
| verdict | review outcome | APPROVED or REJECTED, appended to the card, citing the attack set's hash |
| poison drill | mutation test | plant the defect, see the test fail, restore byte-exact with a hash |
| gate | check that can refuse | preflight, docs gate, landing gate, push guard, battery |
| checkpoint | merge record | the append-only record every merge lands with |
| room | open question | a file where a question is debated and closed with a ruling |
| ruling | decision by the human | quoted verbatim, recorded where it was made |
| the metabolism | backlog hygiene | every finding promoted, parked with a wake condition, or discharged |
| health band | process metric with thresholds | drifting, breached, unread or unkept, each with a keeper |
| the mirror | the app | renders what is on disk; never believes what a model said |
