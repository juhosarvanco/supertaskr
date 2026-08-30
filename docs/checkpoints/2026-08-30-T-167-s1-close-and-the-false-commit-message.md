# Checkpoint: T-167-s1 closed — and this seat pushed a commit whose message claimed work the commit does not contain

Date: 2026-08-30. Seat: integrator (main checkout). Scope: T-167-s1's
verdict corrections, merge and close; the 18d8166 incident; T-154-s2
executor out and its blind verifier dispatched; CI's confirmation of
the fourth ask-after-write strike.

## T-167-s1: APPROVED WITH ASSIGNED CORRECTIONS, landed

The factless blind verifier approved the lane with two prose
corrections, both performed at merge:

1. **The tally is removed, not repaired.** The schema page's "**The
   other six are always written.**" was wrong on its first outing —
   seven keys remain beside the three omissible ones at the page's own
   example. Now: "**Every other key above is always written.**" — the
   cite-the-shape rule applied to the very document the card fixed.
   Same wording corrected at the card's own line 171. Sweep:
   `grep -rn "other six" method/ docs/tasks/` → one hit, the verdict
   quoting the erroneous original.
2. **The collider re-identified.** The card's notes blamed `T-157-s2`
   for the two session-economics reds; the real collider is `T-157`
   itself (`status: done`, `touches: [docs/checkpoints/, tools/e2e]`),
   the card the spec hard-codes. Corrected in place, conclusion
   (live-lane class, clears when T-154-s2 lands) left standing.

Merged --no-ff clean (no card-status conflict — the lane had already
carried `verifying`). Stamps: done, all three fields
claude-opus-5@subagent. Worktree `/Users/ujju/Projects/nputer-T-167-s1`
removed. Graph regenerated at the merge: 198 files, 2095 symbols,
**2293 edges** (+1: sessions.rs→skills.rs), 1,037,978 bytes, headroom
**2,022** — alarm printing, survivable by design (T-140-s4 still
@human's). Pin re-run at the corrected page: sessions --lib 12/12 ok
(the pin parses the JSON example, prose edits cannot move it — and now
the prose no longer states a count the example must agree with).

## THE INCIDENT: commit `18d8166`'s message is false, and it is pushed

The correction pass was scripted with a python needle that did not
match the page (the page wraps at ~72 columns with two-space
continuation indents; the needle had none). The script died on its
assert BEFORE touching either file — and the seat then ran
`git add -A && git commit -m "T-167-s1 closed: both verdict
corrections performed …" && git push` in the SAME chained command,
so the commit landed and shipped containing ONLY the graph
regeneration, under a message describing work that had not happened.

The failure is not the needle; needles miss. The failure is
**committing and pushing in the same chain as the edit, with no check
between that the edit occurred**. The corrections were then performed
for real in the follow-up commit, which says so, and an INTEGRATION
NOTE naming 18d8166 is appended to the card's verdict. Pushed history
stays; the note is the repair.

**The rule this writes for the next seat: an edit script's success is
a gate, not a step. Never chain `commit` after a scripted edit —
verify the diff exists first (`git diff --stat` non-empty for the
files the script claims), or let the script's own exit code stop the
chain (`&&` did not help here because the *later* commands were not
conditioned on the python exit — the chain used separate statements).**
This is the same genus as the ask-after-write strikes: asserting a
state instead of reading it. Fifth sighting of the genus, first time
as a false public statement.

## The fourth strike, confirmed by CI

Run 33321774720 (at 92edad6) failed exactly as the fourth
ask-after-write strike predicted: graph STALE on
`app/src/lib/board-model.ts` (loc 1364→1380) and
`app/test/select-board.test.ts` (2031→2089) — the T-143-s3 merge's
files. The strike-recording regen commit rode this seat's next push;
run 33322339699 was superseded-cancelled and the follow-up run carries
the fix. T-167-s8 (mechanical pre-push guard, F-06 p2) is the standing
answer; its case file now holds four local strikes and one CI
confirmation.

## In flight at this record

- **T-154-s2 executor OUT** (built, `verifying`, lane tip 06d906e):
  the lane-less-seat guard arm, zero-subprocess worktree walk measured
  0.19–0.50ms against four live lanes (~50× cheaper than shelling
  `git worktree list`), 12 new spec bodies (37 total), 19 mutants
  killed, three self-found gaps fixed pre-ledger. Two new suggestions
  filed by it: T-154-s3 (rule 5 prose, rides next method release) and
  T-154-s4 (mid-merge carve-out wants a ruling — the executor added
  the carve-out as its OWN criterion and flagged it). Executor's
  honest gap: the new arm has not refused a live session yet, only
  spec-driven. **Blind factless verifier dispatched** (two-phase
  attack-set protocol); verdict pending.
- **T-112 executor still building** (the brief lane, F-04's last act).
- CI: run at the T-167-s1 close tip in progress; the corrections
  commit pushes after this record.

## Board deltas

T-167-s1 `verifying → done` (verifier claude-opus-5@subagent).
T-154-s2 `building → verifying` (stamped by its executor in-lane).
