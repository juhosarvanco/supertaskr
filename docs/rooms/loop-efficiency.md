---
type: consultation
status: open
max_rounds: 3
---

# Where the development loop loses time, and what would give it back

Opened by the architect seat on the night of 2026-09-01/02 at @human's
request: *"find ways how to make the development process/loop more
efficient, faster without losing quality or better or more logical in any
way. Or if you already see weak spots that could be improved."* Every item
below was met while holding the seat, not reasoned from the docs; each
carries where it was measured. Items are ordered by the time they would
give back per merged card. @human rules; nothing here is a card until it
is promoted.

## @architect (claude-fable-5-1 @nputer-87) — 2026-09-02 00:55

**1. Every seat reads 158 KB of CONVENTIONS before it can start, and the
document is at its own warn line.** `wc -c docs/CONVENTIONS.md` read
158,281 at `cf9d462` against a 164,393 warn line. Five seats per card
(architect, executor, verifier, integrator, and the verifier's second
phase) each pay roughly forty thousand tokens to read it, and most of
those bytes are measurement narrative that ADR-019 says belongs in
records. A compaction landing of the 2026-08-27 kind, done once, is the
single cheapest change to every lane that follows it. Docs-protocol rule
7 already asks each role file to name the sections it reads first; the
executor's file names none.

**2. The e2e battery is 93% of every push's gate, and it grows with
every guard card.** `suite/e2e-seconds` is BREACHED at 372s against a
312s line (the 43e776a record), 535 bodies, workers: 1. T-120-s2 (planned)
measured that 92 bodies open no browser. Splitting the Playwright config
into a browser project and a no-browser project, and letting the second
run with more than one worker, would cut minutes from every battery
without touching a single assertion.

**3. Three of four suites are red inside every lane, so no lane can
certify itself and the integrator re-runs everything by hand.** T-216-s4,
dispatched first tonight for exactly this reason. Until it lands, every
verdict rests on an integrator's re-run.

**4. Every tooling card collides on the `tools/e2e` fence token.** Of the
fifteen priority-2 cards, eleven name `tools/e2e`; at token granularity
they serialise behind a word. Tonight's wave is fenced by PATH instead
(four test files, one hook plus its spec), which is the norm
lane-protocol rule 5 states and the board had adopted in none of its
entries. If the wave lands clean, path-granular fences should become the
dispatcher's default, and the blast-radius flip condition in TASK-FORMAT
becomes measurable.

**5. Triage is bounded by bytes, not by judgement.** `brief.mjs
--dispatch` printed 60,040 bytes at `85dda6d` against a 65,536-byte loss
point, so promotions are chosen by arithmetic (T-225). Fourteen sound
findings sit at `suggested` tonight with a dated PROMOTE that cannot be
applied. T-225 runs right after T-216-s4.

**6. The dispatch ritual is eight serial hand steps per lane**, and half
the brief is still typed rather than derived (T-204, planned). Audit,
stamp, cut, preflight, write-fence, read the manifest back, cut the bench,
brief two seats. Each step is right; their sum is twenty to thirty minutes
per lane of a seat's attention. T-204 removes the typed half; a single
`dispatch` arm that performs the ritual in order and refuses at the first
failed step would remove the rest.

**7. Two architect sessions held one checkout tonight without either
knowing.** The retired Opus seat was mid-battery and then mid-checkpoint
while this seat was asked to take over; nothing in the tree declares a
holder, so the only defence was reading `ps` and the session list.
T-189-s3 (the holder has no carrier) is the card; a runtime holder file in
`.nputer/` that the arming step and the push guard both read is the
construction, and it would have cost the previous seat's stale-worktree
day as well.

**8. Cards are essays, and the parser hides a fifth of their sections.**
T-216-s1's card is 36,779 bytes; T-234 measured 58 of 441 live cards
losing a notes or verdicts section to an exact-match heading rule. The
record is the product's proof, so the prose stays. The lever is cheaper:
T-234's tolerant matcher, and a one-paragraph summary discipline at the
top of every card so a seat can decide whether to read the rest.

**9. A fresh lane installs and builds everything cold.** Three `npm ci`,
a parser build, an app build and a cold cargo build per worktree, plus
the same again for the verifier's bench. The cargo cache must stay
per-lane (T-013-s7), but `sccache` or a shared `CARGO_HOME` registry plus
a warm `npm` cache would take minutes off every lane and every bench.

**10. CI takes 17 minutes per push and reads nothing back on its own.**
Batching pushes is already the rule; what is missing is the push guard
asking `gh run list` for the last run's verdict before allowing the next
push, so a red main cannot be pushed over twice in an evening, which is
what happened at 53da881 and e67cb44.

Not weak spots, and worth saying: the enforcement stack caught what it
was built for tonight (a stale checkout, a duplicated naming phrase, a
red merge), and the records made a cold hand-over possible in under an
hour. The loop is sound; it is slow in the places above.
