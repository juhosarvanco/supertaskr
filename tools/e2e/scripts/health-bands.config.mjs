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
 * app/src-tauri/crates/nputer-index/src/lib.rs is this repository's
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
      name: "cargo run -p nputer-index -- index --check --root ../..",
      marker: "its `[nputer-index]   budget:` line — the number NOTHING else reports",
    },
    measured: {
      at: "13c736e, transcribed from IndexOptions::max_graph_bytes's own doc comment",
      reason:
        "app/src-tauri/crates/nputer-index/src/lib.rs measures single-commit graph growth " +
        "at a MEAN of 15,751 bytes over 55 growths on record (median 5,230, max 241,980 at " +
        "T-010). That doc comment rejected a 10,819-byte headroom in those words: 'one " +
        "ordinary merge from truncating'. So the breach line IS one mean growth — the state " +
        "the authority already refused — and the drift line is four of them, about a " +
        "checkpoint window's worth at the cadence of 2026-08-29 (four checkpoints in one " +
        "day). Crossing the budget DEGRADES rather than fails: symbol arrays are dropped " +
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
      at: "353bcd8 on task/T-156-health-bands, macOS, NPUTER_E2E_PORT=14538, 278 passed in 2.6m (156s)",
      reason:
        "NO CLIFF IS KNOWN FOR THIS SUITE, so this band is a RELAPSE tripwire and says so " +
        "rather than pretending to a mechanism — unlike suite/lib-seconds, whose limits are " +
        "an observed gap between two populations. The landed measurement is this lane's own " +
        "full run, 278 specs at 156 seconds; the multiples are 1.5x and 2.0x, the ratio " +
        "shape DOC_BUDGETS already uses for warn and fail, chosen because it is the pattern " +
        "this repository tunes by triage. The lane runs `workers: 1, retries: 0` by design, " +
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
    drift: 20,
    breach: 40,
    authority: {
      kind: "tree",
      name: "the flat docs/tasks/T-*.md frontmatter, the board's own census",
    },
    measured: {
      at: "3ff7f30, docs/checkpoints/2026-08-29-amnesty-triage.md",
      reason:
        "THE AMNESTY IS THE ONLY MEASUREMENT THIS PROJECT HAS OF WHAT A BACKLOG COSTS: 140 " +
        "cards dispositioned in one architect sitting for ~477k tokens, i.e. ~3.4k tokens " +
        "per card. At that measured rate a 40-card backlog costs ~136k tokens — the largest " +
        "one a single sitting clears without becoming its own project, which is what 140 " +
        "had become. The drift line is half of it. The failure this band names is not size; " +
        "it is a backlog crossing the threshold where clearing it needs a DECISION, because " +
        "that is the point at which it stops being cleared at all.",
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
        "15 DAYS IS NOT A ROUND NUMBER — it is the amnesty's own worst reading. The board's " +
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
    breach: 40,
    authority: {
      kind: "tree",
      name: "git log --diff-filter=A/D over docs/tasks/, since the newest `Checkpoint:` commit",
    },
    measured: {
      at: "3ff7f30, over the window 2026-08-14 to 2026-08-29",
      reason:
        "ADR-020's metabolism question is a RATE question, not a level one: 140 suggestions " +
        "accumulated over 15 days is 9.3 arrivals a day against dispositions that ran at " +
        "ZERO until the amnesty. The drift line is one measured day's arrivals; the breach " +
        "line is the count band's own one-sitting ceiling reached inside a single checkpoint " +
        "window, which is the metabolic failure — not a big backlog, but a window in which " +
        "the board took in more than the next sitting can give back.",
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
