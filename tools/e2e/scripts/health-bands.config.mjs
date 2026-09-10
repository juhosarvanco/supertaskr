/**
 * THE BANDS (T-156) — the version-controlled control limits this
 * project's method watches its own health against, and the ONE file
 * that decides them.
 *
 * ── WHY A CONFIG AND NOT CONSTANTS IN THE SCRIPT ────────────────────
 * ADR-020 decision 3 applies F-06's premise — drift as a first-class
 * signal — to the method itself. The bands ALREADY EXISTED before this
 * file did; they were applied BY EYEBALL, out of docs/STATE.md's
 * standing hazards and out of a card's prose, for twenty-plus
 * checkpoints. A band nobody can edit without editing a program is a
 * band that gets edited by nobody, and a band edited without its reason
 * is a number somebody will later have to reverse-engineer. So the
 * limits sit here, beside the script, as data.
 *
 * ── THE TUNER IS **TRIAGE**, AND THAT IS THE WHOLE LOOP ─────────────
 * Nothing in this file may be tuned by the session that trips it. A
 * finding this script files re-enters the board the way every finding
 * does; TRIAGE dispositions it; and a DISMISSAL is the evidence that
 * moves the band. That is the playbook's own loop pointed at the
 * playbook — the same shape `docs/CONVENTIONS.md`'s AUDIT GATE POLICY
 * uses for its informational warnings, one layer up.
 *
 * ── EVERY BAND CARRIES ITS MEASURED REASON, AND THE SCRIPT ENFORCES
 *    IT (acceptance criterion 3, the `max_graph_bytes` pattern) ──────
 * `IndexOptions::max_graph_bytes` in
 * app/src-tauri/crates/supertaskr-index/src/lib.rs is this repository's
 * worked example of a number that states what measured it, on what
 * hardware, at which ref, by which re-runnable command — so that the
 * next reader argues with the measurement rather than with the digit.
 * Every entry below carries `measured: { at, reason }` and
 * `validateBands()` REFUSES a config where either is missing or empty.
 * A band without a reason cannot be loaded, so it cannot be changed
 * quietly: the refusal is exit 3, and exit 3 is never a green run.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ───────────────────────────────────
 * TOKEN BANDS. A token reading is a LIVE-ENVIRONMENT fact — it belongs
 * to a session and a quota, not to a tree — so it is stamped in
 * checkpoint records and never derived from a ref. The card defers them
 * to telemetry export at org scale, and this file honours that.
 *
 * ── AND WHAT ARRIVED ANYWAY, BY THE ONE ROUTE THAT PARAGRAPH LEAVES
 *    OPEN (T-297) ────────────────────────────────────────────────────
 * The sentence above stands and is not amended: a token reading is a
 * live-environment fact and is still never DERIVED from a ref. What
 * changed is where it is STAMPED. ADR-024 decision 3 has the merge
 * append each seat's own `## Meters` block to
 * docs/checkpoints/meters.jsonl, so `loop/token-budget-used` READS a
 * recorded reading instead of recomputing one — the same relationship
 * `graph/budget-headroom-bytes` has to `index --check`'s own output,
 * and the reason both bands quote the words they read. The telemetry
 * export at org scale that T-156's card deferred is still deferred and
 * is still not this.
 */

/**
 * @typedef {object} BandAuthority
 * @property {"tree" | "readings" | "none"} kind
 *   `tree`   — derivable from the checkout at this ref, no run needed.
 *   `readings` — read out of another tool's OWN output, parsed, never
 *                recomputed here. Absent from the readings ⇒ UNREAD.
 *   `none`   — declared with NO keeper. Reported as unkept, never as
 *              holding, and it costs the run exit 3.
 * @property {string} name  The authority, named the way it is invoked or read.
 * @property {string} [marker]  For `readings`: the line this parses, in words.
 * @property {string} [keeper]  For `none`: what would give this metric a keeper.
 */

/**
 * @typedef {object} Band
 * @property {string} id
 * @property {string} metric   What is measured, in a reader's words.
 * @property {string} unit
 * @property {"above" | "below"} healthy
 *   `above` — healthy readings are LARGE (headroom, room left).
 *   `below` — healthy readings are SMALL (durations, backlogs).
 * @property {number | null} drift   Crossing this is DRIFTING. null ⇒ unkept.
 * @property {number | null} breach  Crossing this is BREACHED. null ⇒ unkept.
 * @property {BandAuthority} authority
 * @property {{ at: string, reason: string }} measured
 */

/**
 * The four governing documents' WARN HEADROOM, as a percentage of the
 * warn line — one band per gated entry in `DOC_BUDGETS`, DERIVED from
 * it rather than listed here, so a document that gains a budget gains a
 * band in the same commit and cannot gain one without.
 *
 * WHY A PERCENTAGE AND NOT BYTES: `DOC_BUDGETS` sets `warn = landed ×
 * 1.25`, so headroom at every compaction landing is EXACTLY 20% of the
 * warn line, for every document, by construction. A byte floor would
 * mean four different bands and would fire on docs/STATE.md's 1,693
 * landing bytes while sleeping through docs/CONVENTIONS.md's.
 *
 * @param {Readonly<Record<string, { landed: number, warn: number, fail: number } | null>>} budgets
 * @returns {Band[]}
 */
export function docHeadroomBands(budgets) {
  /** @type {Band[]} */
  const out = [];
  for (const [rel, b] of Object.entries(budgets)) {
    if (b === null) continue;
    out.push({
      id: `docs-headroom/${rel}`,
      metric: `warn headroom left in ${rel}`,
      unit: "% of the warn line",
      healthy: "above",
      drift: 10,
      breach: 2,
      authority: {
        kind: "tree",
        name: `wc -c ${rel} against DOC_BUDGETS (tools/e2e/scripts/docs-scan.mjs)`,
      },
      measured: {
        at: "78aabe5, over the four refs T-092-s2 recorded",
        reason:
          "docs/CONVENTIONS.md's warn headroom moved 12,323 -> 919 -> 280 -> 27,586 bytes " +
          "across four refs in three days (T-092-s2, discharged in docs/tasks/rejected/), " +
          "which against its 137,928-byte warn line is 8.9% -> 0.67% -> 0.20% -> 20.0%. " +
          "EACH EXCURSION WAS DISCOVERED BY A CARD RATHER THAN BY A REPORT: T-147 was " +
          "filed blocked_by T-092-s2 at the 280-byte reading and the block was lifted by " +
          "hand at the amnesty merge. The 2% breach line calls both readings that actually " +
          "blocked a card and neither healthy one; the 10% drift line calls the 8.9% " +
          "reading, which is the one a report would have wanted to catch first. Headroom " +
          "at a compaction landing is 20% by construction (warn = landed x 1.25), so a " +
          "freshly landed document starts at the top of its own band.",
      },
    });
  }
  return out;
}

/**
 * The bands that are not derived from another table.
 * @type {Band[]}
 */
export const STANDING_BANDS = [
  {
    id: "graph/budget-headroom-bytes",
    metric: "bytes left under the emit budget after a fresh index",
    unit: "bytes",
    healthy: "above",
    drift: 63004,
    breach: 15751,
    authority: {
      kind: "readings",
      name: "cargo run -p supertaskr-index -- index --check --root ../..",
      marker: "its `[supertaskr-index]   budget:` line — the number NOTHING else reports",
    },
    measured: {
      at: "13c736e, transcribed from IndexOptions::max_graph_bytes's own doc comment",
      reason:
        "app/src-tauri/crates/supertaskr-index/src/lib.rs measures single-commit graph growth " +
        "at a MEAN of 15,751 bytes over 55 growths on record (median 5,230, max 241,980 at " +
        "T-010). That doc comment rejected a 10,819-byte headroom in those words: 'one " +
        "ordinary merge from truncating'. So the breach line IS one mean growth — the state " +
        "the authority already refused — and the drift line is four of them, 63,004 bytes, " +
        "about a checkpoint window's worth at the cadence of 2026-08-29 (four checkpoints in " +
        "one day). Crossing the budget DEGRADES rather than fails: symbol arrays are dropped " +
        "and `truncated_*` is set, which is exactly why nothing reds and a band is the " +
        "only thing that would ever have said so.",
    },
  },
  {
    id: "suite/lib-seconds",
    metric: "wall time of the cargo lib test binary",
    unit: "seconds",
    healthy: "below",
    drift: 9.5,
    breach: 14.6,
    authority: {
      kind: "readings",
      name: "cargo test (from app/src-tauri/)",
      marker: "the `finished in Xs` of the `Running unittests src/lib.rs` binary",
    },
    measured: {
      at: "T-088-s4, standing in docs/STATE.md's hazards ever since",
      reason:
        "THE CARGO CACHE CLIFF, and the band this card exists to stop reading by eye: " +
        "`startup_arm_watches_the_initial_root` reds when app/src-tauri/target/ is large " +
        "and ~never when it is small, and the suite's own duration separates the two " +
        "populations completely — every green under 9.5s, every red over 14.6s, NOTHING " +
        "EVER BETWEEN, across twenty-plus checkpoints. The band is therefore not chosen; " +
        "it is the observed gap between two populations, and the empty interval between " +
        "9.5 and 14.6 is what makes DRIFTING meaningful here: a reading inside it is the " +
        "first one this project has ever seen.",
    },
  },
  {
    id: "suite/e2e-seconds",
    metric: "wall time of the tools/e2e Playwright lane",
    unit: "seconds",
    healthy: "below",
    drift: 234,
    breach: 312,
    authority: {
      kind: "readings",
      name: "npm test (from tools/e2e/)",
      marker: "the list reporter's `N passed (Xs)` summary",
    },
    measured: {
      at: "b060f90 on task/T-156-health-bands, macOS, SUPERTASKR_E2E_PORT=14538, 279 passed in 2.6m (156s)",
      reason:
        "NO CLIFF IS KNOWN FOR THIS SUITE, so this band is a RELAPSE tripwire and says so " +
        "rather than pretending to a mechanism — unlike suite/lib-seconds, whose limits are " +
        "an observed gap between two populations. The landed measurement is this lane's own " +
        "full run, 279 specs at 156 seconds; the multiples are 1.5x and 2.0x — 234 and 312 " +
        "seconds, which are the lines — the ratio shape DOC_BUDGETS already uses for warn and " +
        "fail, chosen because it is the pattern this repository tunes by triage. The lane runs `workers: 1, retries: 0` by design, " +
        "so wall time is close to linear in spec count — which means THIS BAND MOVES AT " +
        "EVERY SUITE GROWTH and is expected to be re-landed rather than defended. Re-land " +
        "it with the run that measured it, and say which run that was.",
    },
  },
  {
    id: "triage/live-suggestions",
    metric: "live cards at status: suggested",
    unit: "cards",
    healthy: "below",
    drift: 46,
    breach: 92,
    authority: {
      kind: "tree",
      name: "the flat docs/tasks/T-*.md frontmatter, the board's own census",
    },
    measured: {
      at:
        "3a69385, over the checkpoint records since the amnesty — " +
        "docs/checkpoints/2026-08-29-amnesty-triage.md, the five standing-triage records of " +
        "2026-08-30 and 2026-08-31, and the windows stamped in the 2026-09-02 fourth fable " +
        "sitting and the 2026-09-03 form sitting; arrivals cross-read off the live cards' own " +
        "suggested_by dates and their git add-dates at that ref",
      reason:
        "RE-DERIVED FROM THE LOOP'S OWN MEASURED RATES, NOT RAISED (T-282, @human decision 4 of " +
        "2026-09-09, which refused an outside review's proposal to move this line from 40 to 80 " +
        "with no measurement behind it). THE AMNESTY IS NO LONGER THE ONLY READING, and that is " +
        "why these lines moved. Eight sittings since it stamped a tally and TWO stamped a cost: " +
        "the amnesty dispositioned 140 cards for 477,081 tokens over 45.5 minutes (~3.4k per " +
        "card) — the band's own prior entry (git show 3a69385:tools/e2e/scripts/health-bands.config.mjs) called that the state where clearing had 'become its own " +
        "project'; standing triage sitting #1 the next day took the queue 46 -> 0 for 227,693 " +
        "tokens over 26 minutes (~4.9k per disposition, the premium being the preflight on " +
        "every promotion). The sittings after it cleared 22, 14, 14 and 5, and the two later " +
        "windows 16 and 5 — every one of them under 46. SO THE LARGEST BACKLOG A SINGLE SITTING " +
        "HAS EVER TAKEN TO ZERO CHEAPLY IS 46, and the only larger clear on record is the " +
        "amnesty's 140. The drift line is that measured sitting: 46 cards, the largest clear " +
        "this project can prove is cheap. The breach line is TWO of it — 92 cards, which at the " +
        "measured 4.9k per disposition costs ~451k tokens, the amnesty's own 477k bill reached " +
        "from the other side — and it sits inside an EMPTY interval, because no sitting on " +
        "record has ever cleared anything between 46 and 140, which is the shape " +
        "suite/lib-seconds' band is cut from. WHAT MADE THE OLD 40 STOP DISCRIMINATING IS THE " +
        "ARRIVAL RATE: the loop filed 14 suggestions on 2026-09-08 and 57 on 2026-09-09 by git " +
        "add-date, so a line at 40 breaches after a single night of the loop by construction " +
        "and says nothing about whether the queue can be cleared. THE UNIT STAYS `cards` " +
        "DELIBERATELY (T-282 criterion 3, answered rather than assumed): the backlog's AGE and " +
        "its arrival RATE — the two alternatives that criterion names — are already kept by " +
        "triage/oldest-suggestion-days and triage/net-arrivals-per-window, so what this band " +
        "owed was not a different quantity but a rate-derived line; and the reading itself is a " +
        "card count computed by readingsFromTree in health-bands.mjs, outside this card's " +
        "fence, so a unit renamed here would be a label disagreeing with its own number — the " +
        "silent mis-report this whole file exists against.",
    },
  },
  {
    id: "triage/oldest-suggestion-days",
    metric: "age of the oldest live suggestion",
    unit: "days",
    healthy: "below",
    drift: 5,
    breach: 15,
    authority: {
      kind: "tree",
      name: "git log --diff-filter=A over each live suggestion card",
    },
    measured: {
      at: "3ff7f30; the first suggestion card was added 2026-08-14, the amnesty ran 2026-08-29",
      reason:
        "15 DAYS IS NOT A ROUND NUMBER — it is the amnesty's own worst reading " +
        "(docs/checkpoints/2026-08-29-amnesty-triage.md). The board's " +
        "first suggestion card arrived on 2026-08-14 and was still untriaged when the " +
        "sitting that cleared 140 of them was finally called on 2026-08-29. The breach line " +
        "is therefore the exact age at which this project has already proved a backlog " +
        "becomes a project; the drift line is 5 days, about two checkpoint windows at the " +
        "cadence of 2026-08-29. AGE MATTERS SEPARATELY FROM COUNT because a small backlog " +
        "of old cards is the shape that reads as healthy on the count band alone.",
    },
  },
  {
    id: "triage/net-arrivals-per-window",
    metric: "suggestion arrivals minus dispositions since the newest checkpoint",
    unit: "cards",
    healthy: "below",
    drift: 9,
    breach: 46,
    authority: {
      kind: "tree",
      name: "git log --diff-filter=A/D over docs/tasks/, since the newest `Checkpoint:` commit",
    },
    measured: {
      at:
        "3ff7f30, over the window 2026-08-14 to 2026-08-29; the breach line re-read at 3a69385 " +
        "against triage/live-suggestions' own re-derivation (T-282)",
      reason:
        "ADR-020's metabolism question is a RATE question, not a level one: 140 suggestions " +
        "accumulated over 15 days is 9.3 arrivals a day against dispositions that ran at " +
        "ZERO until the amnesty. The drift line is one measured day's arrivals, 9; the breach " +
        "line is the count band's own one-sitting ceiling reached inside a single checkpoint " +
        "window, which is the metabolic failure — not a big backlog, but a window in which " +
        "the board took in more than the next sitting can give back. THAT CEILING IS A " +
        "DERIVED QUANTITY AND IT MOVED, so this line moved with it: T-282 re-derived the " +
        "largest backlog a single sitting has taken to zero cheaply from 40 to 46 (standing " +
        "triage sitting #1 of 2026-08-30, 46 -> 0 for 227,693 tokens in 26 minutes), and a " +
        "breach line still reading 40 would name a ceiling this config no longer holds. The " +
        "drift line is NOT re-derived here — it belongs to the arrival measurement above and " +
        "T-282 measured the clearing side.",
    },
  },
  {
    id: "loop/cycle-budget-used",
    metric: "the worst card's cycle in this checkpoint's window, as a share of its tier's budget",
    unit: "% of the tier's budget",
    healthy: "below",
    drift: 100,
    breach: 200,
    authority: {
      kind: "tree",
      name:
        "docs/checkpoints/meters.jsonl priced against each card's own dispatch-stamp commit, " +
        "over the merges since the newest Checkpoint: commit",
    },
    measured: {
      at: "c745a6af, over the four readings docs/checkpoints/meters.jsonl carried at that ref",
      reason:
        "THE DRIFT LINE IS THE BUDGET ITSELF AND IS NOT THIS FILE'S TO MOVE. ADR-024 decision 1 " +
        "(docs/decisions/024-the-proportionate-loop.md) rules 20 minutes for bounded, 75 for " +
        "standard and 100 for guarded, so a card that has spent 100 percent of its tier's budget " +
        "has spent all of it, and crossing that is DRIFTING by arithmetic rather than by a " +
        "judgment made here — which is why the band is a SHARE and not a duration: one line has " +
        "to hold three tiers whose budgets differ by 5x. THE BREACH LINE IS THE STATE THE ROOM " +
        "MEASURED AND REFUSED. That ADR's own Context paragraph reads a size-S card at 2.5 to " +
        "3.5 hours from dispatch to CI green, and 2.5 hours against the standard tier's 75 " +
        "minutes is exactly 200 percent — the MILDEST of the readings ADR-024 was written to " +
        "end, so the line calls every one of them and calls nothing the ruling accepted. " +
        "RE-DERIVED AT c745a6af against the merges T-295 and T-296 appended: T-295 was stamped " +
        "at 46c33c07 and merged 156.3 minutes later, 208.4 percent of the standard 75; T-296 " +
        "was stamped at 9dc05597 and merged 160.3 minutes later, 160.3 percent of the guarded " +
        "100. Both lines therefore sit between readings this project has actually taken and the " +
        "budget it has actually ruled, and the first reading of this band is a breach — which " +
        "is a finding about the process and never a gate on a lane (docs/CONVENTIONS.md, HEALTH " +
        "BANDS AT THE CHECKPOINT). THE READING IS A FLOOR: the tree ends at the merge and CI " +
        "green is minutes later in an API, so this band under-reports by the runner's own wall " +
        "clock and its derivation says so on every line it prints.",
    },
  },
  {
    id: "loop/token-budget-used",
    metric: "the worst card's subagent tokens in this checkpoint's window, as a share of its tier's budget",
    unit: "% of the tier's budget",
    healthy: "below",
    drift: 100,
    breach: 168,
    authority: {
      kind: "tree",
      name:
        "a token figure in EVERY seat's `## Meters` block in docs/checkpoints/meters.jsonl, " +
        "summed per card, over the merges since the newest Checkpoint: commit",
    },
    measured: {
      at: "c745a6af, over the four readings docs/checkpoints/meters.jsonl carried at that ref",
      reason:
        "THE DRIFT LINE IS THE BUDGET, for the reason the cycle band above gives at length: " +
        "ADR-024 decision 1 rules 80K for bounded, 310K for standard and 450K for guarded, and " +
        "100 percent of a budget is the budget. THE BREACH LINE IS THE ONE READING ADR-024 " +
        "TOOK: its Context paragraph measured a size-S card at about 520K subagent tokens, and " +
        "520,000 against the standard tier's 310,000 is 167.7 percent, which rounds to 168 — " +
        "the reading the room saw and refused, transcribed rather than chosen. The cycle band's " +
        "breach is 200 and this one's is not, deliberately: the two halves of the same measured " +
        "state are 2.0x on the clock and 1.68x on the tokens, and rounding them to one number " +
        "would make one of the two lines a guess wearing a derivation. RE-DERIVED AT c745a6af: " +
        "T-295's two seats state 319,000 and 430,000 tokens, 749,000 against the standard " +
        "310,000, 241.6 percent. T-296 HAS NO READING AT ALL and that is the second thing this " +
        "band keeps — its verifier states 320K and its executor states none, so the card's total " +
        "is a lower bound, a lower bound rendered as a share of a budget reads as a measurement " +
        "while being able to sit on either side of the line, and the band goes UNREAD naming the " +
        "seat rather than reporting the sum it could see.",
    },
  },
  {
    id: "loop/soft-verifier",
    metric: "tiers whose rejections fell to zero in this window while their CI reds rose",
    unit: "tiers",
    healthy: "below",
    drift: 0,
    breach: 1,
    authority: {
      kind: "tree",
      name:
        "a `verdict` outcome and a `ciReds` count on the cards' readings in " +
        "docs/checkpoints/meters.jsonl, over the two newest checkpoint windows",
    },
    measured: {
      at: "c745a6af, by the shape ADR-024 named rather than by a reading — no window on record has two",
      reason:
        "ADR-024's Consequences: 'a tier whose rejection rate falls to zero while CI reds rise " +
        "is read as a soft verifier'. THE LINES ARE THE ARITHMETIC OF THE THING COUNTED, not a " +
        "tuning: the reading is a count of tiers and there are three, so 0 flagged tiers is the " +
        "only healthy reading and the drift line is 0 — one tier reading as a soft verifier is " +
        "DRIFTING and prints itself with its derivation, and 2 of the 3 is BREACHED and files, " +
        "which puts the breach line at 1. A band whose drift and breach could differ by more " +
        "than that would need a fourth tier to exist. THIS BAND IS WIRED AND NOT YET FED, and " +
        "the distinction from the four bands declared with no keeper at all is exactly that: " +
        "the comparison exists, is driven by health-bands.spec.ts on a planted history, and " +
        "reads UNREAD only because no capture yet stamps a verdict outcome or a CI-red count on " +
        "a reading. The vocabulary it reads is the merge subjects' own — APPROVED, APPROVED " +
        "WITH ASSIGNED CORRECTIONS, REJECTED — and its ratification is the same debt " +
        "north-star/rejection-rate-by-size routes as T-156-s2, which is why a value this does " +
        "not recognise makes a card unusable rather than quietly not-a-rejection.",
    },
  },
  {
    id: "machinery/gate-seconds",
    metric: "total standing-gate runtime per checkpoint",
    unit: "seconds",
    healthy: "below",
    drift: null,
    breach: null,
    authority: {
      kind: "none",
      name: "no checkpoint record stamps it",
      keeper:
        "a Gates line in docs/checkpoints/TEMPLATE.md that stamps the total, which this " +
        "card's fence [tools/e2e] cannot write — routed as T-156-s1",
    },
    measured: {
      at: "78aabe5, by absence",
      reason:
        "THE ENFORCEMENT LAYER IS SUBJECT TO THE SAME BUDGET DISCIPLINE AS THE DOCUMENTS, " +
        "said out loud (the card's own third widened band). It has no keeper yet and this " +
        "entry refuses to imply one: no checkpoint record carries a gate-runtime total, so " +
        "there is no landed measurement to set a band from, and setting one from a guess " +
        "would be the known-vacuous keeper docs/NORTH_STAR.md's bar calls a stop-the-line " +
        "defect. It is declared here so the debt has a number and a name instead of being " +
        "absent from every list.",
    },
  },
  {
    id: "north-star/cold-start-pass-rate",
    metric: "architect model/session switches passing the cold-start test first try",
    unit: "% of switches",
    healthy: "above",
    drift: null,
    breach: null,
    authority: {
      kind: "none",
      name: "no switch is recorded anywhere a program can read",
      keeper: "a recorded, machine-readable cold-start outcome per switch — routed as T-156-s2",
    },
    measured: {
      at: "78aabe5, by absence",
      reason:
        "docs/NORTH_STAR.md fixed this indicator on 2026-08-14, as success criterion 4 and " +
        "again under the riskiest assumption, at a 100% target — and NOTHING HAS EVER " +
        "DERIVED IT. It is a figure without a keeper in the one document nobody audited. " +
        "This entry is its keeper in the only sense a fence of [tools/e2e] can supply: it " +
        "is named on every run, it is never reported as holding, and it costs the run exit " +
        "3 until something records a switch.",
    },
  },
  {
    id: "north-star/drift-incidents",
    metric: "work contradicting NORTH_STAR or ARCHITECTURE, caught by a verifier or a human",
    unit: "incidents per milestone",
    healthy: "below",
    drift: null,
    breach: null,
    authority: {
      kind: "none",
      name: "no incident is marked anywhere a program can read",
      keeper: "a dated drift-incident marker a verdict or a room can carry — routed as T-156-s2",
    },
    measured: {
      at: "78aabe5, by absence",
      reason:
        "docs/NORTH_STAR.md tracks this per milestone under the riskiest assumption — " +
        "falling means coherence is holding — and it has never been counted. The incidents " +
        "themselves are not missing; verdicts and rooms are full of them. What is missing " +
        "is any marker a program can find, which is why a keeper is a card and not a " +
        "derivation.",
    },
  },
  {
    id: "north-star/rejection-rate-by-size",
    metric: "verdict rejection rate, trended per task size",
    unit: "% rejected, by size",
    healthy: "below",
    drift: null,
    breach: null,
    authority: {
      kind: "none",
      name: "verdicts are prose headings with no ratified marker",
      keeper:
        "a ratified verdict marker in method/tasks/TASK-FORMAT.md that a program can read " +
        "off a card — routed as T-156-s2",
    },
    measured: {
      at: "78aabe5, measured and REFUSED rather than assumed",
      reason:
        "THIS ONE WAS ATTEMPTED AND THE ATTEMPT IS THE EVIDENCE. 113 live cards carry a " +
        "`## Verdicts` section, and the verdict lines inside them are free prose: the " +
        "headings found at this ref include `VERDICT: APPROVED`, `VERDICT: PASS`, " +
        "`VERDICT IS UNCHANGED: APPROVED`, dated headings carrying a bare APPROVED or " +
        "REJECTED, and — the reason a regex must not be trusted here — headings like " +
        "`WHY A .cargo/config.toml [env] ENTRY WAS REJECTED` and `Fix pass after REJECTED`, " +
        "which are not verdicts at all. A scanner over that corpus would produce a number " +
        "with no defensible denominator, and docs/NORTH_STAR.md's own bar calls a " +
        "known-vacuous keeper a stop-the-line defect. So this band is declared UNKEPT on " +
        "purpose: the honest reading is 'no authority', not a plausible percentage.",
    },
  },
];

/**
 * Every band, in report order.
 * @param {Readonly<Record<string, { landed: number, warn: number, fail: number } | null>>} budgets
 * @returns {Band[]}
 */
export function allBands(budgets) {
  return [...docHeadroomBands(budgets), ...STANDING_BANDS];
}
