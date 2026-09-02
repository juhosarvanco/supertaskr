---
id: T-225-s4
title: The triage view now needs `--full` and NO governing document names it — CONVENTIONS and STATE both send a seat to `brief.mjs --dispatch`, which since T-225 answers a narrower question than the one those bullets were written for
feature: F-06
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/STATE.md]
suggested_by: executor claude-opus-5@subagent @T-225
builder:
verifier:
built_by: the architect/integrator seat, claude-fable-5-1
verified_by: the same seat — a governing-document sentence, read back and gated
review: independent
---

**A FENCE FINDING, NOT A SCOPE ONE.** T-225's fence is the three
dispatch scripts and the three specs that read them. Both documents
below are outside it, so the edit was PARKED and routed rather than
taken (`method/roles/executor.md` step 3).

**WHAT MOVED.** `brief.mjs --dispatch` used to answer with a row per
planned card. Since T-225 the default answers *what can I START* and
collapses the fenced, waiting and blocked sets to one counted line each;
`--dispatch --full` is the unfiltered TRIAGE answer, a row per held card
with the exact paths it shares. The command says so on every run, in its
own header notes — **but a seat reaches the command through a document,
and neither document mentions the flag**:

- `docs/CONVENTIONS.md`, THE LANE PROTOCOL bullet's brief spelling, and
  the DISPATCH RITUAL beside it.
- `docs/STATE.md`'s *"IN FLIGHT: **DERIVE IT** — `brief.mjs --dispatch`"*
  under Next up, and its BOARD CENSUS bullet.

**WHY IT MATTERS RATHER THAN BEING TIDINESS.** The question those
bullets are answering is not always the dispatch question. A seat asking
*"which lane do I have to free to get T-204 back?"* — which is what a
TRIAGE sitting asks, and T-225 exists because a triage sitting could not
carry its own result — now gets a count where it used to get the answer.
The flag is one word and the failure is silent: the default view is
correct and complete for its own question, so nothing reds.

**AND ONE SPELLING, NOT TWO.** `docs/STATE.md` is byte-banded and
`docs/CONVENTIONS.md` is not, so the MECHANISM belongs in CONVENTIONS
and STATE takes a pointer at most — that document's own contract, and
the T-146 class it names.

## TRIAGE, 2026-09-02 — `planned`, the integrator's, no lane

The architect seat, at the stamp of T-225's merge (7435eae). Both edits
are reconciling writes of the kind the checkpoint owns: STATE is
regenerated there, and the CONVENTIONS sentence that sends a seat to
`brief.mjs --dispatch` for triage gains `--full` in the same commit,
which closes this card.

## CLOSED, 2026-09-02 — at the second Fable checkpoint

STATE, regenerated in this commit, sends a seat to `brief.mjs --dispatch`
for what can START and to `--dispatch --full` for TRIAGE, in its Next-up
list. CONVENTIONS at this ref does not spell `--dispatch` anywhere (measured: `grep -c -- --dispatch docs/CONVENTIONS.md` is 0 at 43e0fe8), so the half of this card that named it was already moot; the STATE half is the whole repair. Written by the integrator in the checkpoint commit.
