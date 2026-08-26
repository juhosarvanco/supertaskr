/**
 * THE CARD FIGURE LEDGER (T-150) — plain node, zero deps, no I/O at
 * import. The runnable half is `brief.mjs --card` beside this file; this
 * module holds the derivation and executes nothing.
 *
 * ── THE ASYMMETRY THIS CLOSES ────────────────────────────────────────
 * `dispatch-brief.mjs` (T-133) builds a brief as RECORDS: a `value`
 * without a provenance THROWS at render and a `note` may not contain a
 * digit, so the only way a figure leaves that tool is attached to its ref
 * or its reading time. **Cards were never brought under that rule.** They
 * are hand-written markdown, every count in them is typed, and on
 * 2026-08-26 two of three cards were rejected on a number their author
 * recalled instead of derived.
 *
 * ── WHY THIS IS NOT A LINT, MEASURED RATHER THAN ARGUED ──────────────
 * T-150's card offers three arms and argues for the second. The first —
 * "flag a bare figure in a card body and require an adjacent provenance
 * marker" — is refuted TWICE by the corpus it would police, and both
 * refutations are re-derivable from `docs/tasks/` at any ref:
 *
 *   1. IT OVER-FIRES BY TWO ORDERS OF MAGNITUDE. Strip fenced and
 *      indented code from every live card body and count digit runs: the
 *      corpus carries them in the tens of thousands, a couple of hundred
 *      per card, and after fifteen hand-written classes are subtracted
 *      (`T-141`, `C-05`, shas, versions, dates, ratios, exit codes …) the
 *      unclassified remainder is still in the tens of thousands. A gate
 *      firing that often is the over-fire trap docs/CONVENTIONS.md names
 *      against itself under DOCS GATE: "a gate that says run everything
 *      on any `docs/**` is ignored within a week".
 *   2. IT IS BLIND TO THE CLASS THAT ACTUALLY CAUSED THE REJECTION. The
 *      corpus's single largest figure class has NO DIGIT IN IT — number
 *      WORDS, ordinal and cardinal. `T-141`'s rejected opening sentence
 *      is one: *"this repository's **second** D2"*. No digit scan of any
 *      strictness sees that sentence at all.
 *
 * **AND THE THIRD REFUTATION IS THE SHARPEST, BECAUSE IT IS THE ARM'S
 * OWN CAUTION HAPPENING NATURALLY.** T-150's card warns that arm 1 is
 * "the arm most likely to be gamed by adding a marker without
 * re-deriving". It did not need gaming. `T-141`'s opening sentence is
 * IMMEDIATELY followed by a command and a ref — *"`arch` at `ae92f67`:
 * components=13 files=185 mapped=184 unmapped=1 edges=39 findings=5"* —
 * so an adjacency rule PASSES it. The marker was present, honest, and
 * derived six other figures; it simply does not produce the word beside
 * it, because an ordinal over the repository's whole history is not
 * something `arch` at one ref can answer. **A marker that is present and
 * does not bind is the failure, not a missing marker.**
 *
 * ── THE PROPERTY THAT PORTS, AND THE ONE THAT DOES NOT ───────────────
 * The THROW does not port. `dispatch-brief.mjs` may throw because it OWNS
 * its output — every figure passes through `value()` on its way out. A
 * markdown card is not produced by this tool, so there is no render to
 * throw at, and a gate that throws over prose either over-fires (above)
 * or goes vacuous.
 *
 * **WHAT PORTS IS THE CLOSED VOCABULARY, AND IT PORTS BY BECOMING A
 * RE-DERIVATION.** In the brief, provenance is enforced by construction.
 * In a card it is enforced by RE-RUNNING: a figure carries a stamp naming
 * a deriver in `CARD_DERIVERS`, and this gate runs that deriver and
 * requires the line to be one the deriver still produces. That is what
 * arm 1 could not have: you cannot add the marker without re-deriving,
 * because the marker IS the derivation and the gate re-runs it.
 *
 * The floor itself is NOT re-implemented here. Every record this module
 * emits goes through `value`/`treeProv`/`liveProv`/`render` imported from
 * `dispatch-brief.mjs`, so there is one provenance implementation in this
 * repository and not two (T-057).
 *
 * ── THE FIVE VERDICTS, AND WHY NOT TWO ───────────────────────────────
 * `method/lane-protocol.md` rule 5 rules that an unresolved token is not
 * "disjoint from everything" — "three verdicts, never two". The same
 * applies to a figure:
 *
 *   VERIFIED    stamped `card:<key>`, and the deriver reproduces the line
 *               at this ref. Nothing owed.
 *   STALE       stamped `card:<key>`, and the deriver does NOT reproduce
 *               it. A FINDING, naming what the tree says now.
 *   ATTESTED    stamped `card:measured`, so it is declared NOT a function
 *               of the tree — a suite result, a token spend, a duration.
 *               Carried and LISTED, never silently accepted, because the
 *               reader has to know which figures were never checked.
 *   UNRUNNABLE  carries a provenance this gate cannot re-run. A FINDING —
 *               this is `T-141`'s shape, and reporting it is the whole
 *               difference between this and an adjacency lint.
 *   CENSUS      an unstamped ordinal claim scoped to the repository's own
 *               history. A FINDING. It carries no digit, so it is the one
 *               arm a figure scanner could never have.
 *
 * ── WHAT IS DELIBERATELY NOT DERIVED ─────────────────────────────────
 * Suite results, token spends and wall-clock durations. They are not
 * functions of a tree — they are functions of a RUN — so this module
 * refuses to invent them and gives them `measured` instead. A tool that
 * guessed them would produce exactly the confident wrong figure this card
 * exists to stop.
 */

import { statSync } from "node:fs";
import path from "node:path";
import { trackedFiles } from "./docs-scan.mjs";
import {
  blank,
  expandFenceEntry,
  fieldList,
  fieldScalar,
  git,
  liveProv,
  note,
  treeProv,
  value,
} from "./dispatch-brief.mjs";

/**
 * THE STAMP A CARD CARRIES. It is `dispatch-brief.mjs`'s own tree stamp
 * with a `card:` deriver key appended, so a figure pasted out of this
 * command reads the same in a card as it does in a brief and one pattern
 * finds both.
 *
 * Anchored at end of line on purpose: a stamp is the LAST thing on the
 * line it belongs to, and a pattern that matched mid-line would let a
 * sentence quote a stamp and inherit its verdict.
 */
export const CARD_STAMP = /^(?<text>.*?)\s+<- @ (?<ref>[0-9a-f]{7,}) ; card:(?<key>[a-z-]+)$/;

/**
 * ANY provenance arrow, whatever follows it. The difference between this
 * and `CARD_STAMP` is the UNRUNNABLE verdict: a line matching this and
 * not that carries a provenance whose source this gate cannot re-run, and
 * saying so is what stops a marker from being enough on its own.
 */
export const ANY_PROVENANCE = /\s<-\s\S/;

/** The key that means "declared NOT a function of the tree". */
export const ATTESTED_KEY = "measured";

/**
 * THE CENSUS CLAIM — an ordinal bound to a phrase that scopes it to this
 * repository's whole history. **This is the arm that catches `T-141`,
 * and it contains no digit by construction.**
 *
 * IT IS NARROW ON PURPOSE AND THE NARROWNESS IS MEASURED, NOT ASSERTED:
 * a bare ordinal fires thousands of times across `docs/tasks/`, while
 * this pairing fires in the low tens across a tenth of the cards. That
 * ratio is the whole reason the scope phrase is required — re-derive it
 * over the corpus rather than trusting this comment, because it is a
 * function of a tree like any other figure.
 *
 * WHY AN ORDINAL AND NOT A SUPERLATIVE: "only", "never" and "every" are
 * the ordinary vocabulary of this project's prose and firing on them
 * would rebuild arm 1 in words. An ordinal SCOPED TO THE REPOSITORY is a
 * claim about a census nobody re-runs, which is exactly the class that
 * has cost a rejection.
 */
const ORDINAL = "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth";
const HISTORY_SCOPE =
  "repositor\\w*|this project|this tree|this repo\\w*|on main|ever had|it has ever|this method|this pipeline";
export const CENSUS_CLAIM = new RegExp(
  `(?:${HISTORY_SCOPE})[^.\\n]{0,80}?\\b(?:${ORDINAL})\\b` +
    `|\\b(?:${ORDINAL})\\b[^.\\n]{0,80}?(?:${HISTORY_SCOPE})`,
  "gi",
);

/* ────────────────────────────────────────────────────────────────────
 * The body — a card's PROSE, which is the only place a typed figure
 * causes a rejection. Fenced and indented blocks are transcripts of
 * commands that already carry their own provenance by being commands.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Frontmatter removed. It is not prose and its figures are FIELDS with
 * their own owner (`method/tasks/TASK-FORMAT.md`).
 *
 * @param {string} cardText
 * @returns {string}
 */
export function cardBody(cardText) {
  const m = cardText.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return m === null ? cardText : cardText.slice(m[0].length);
}

/**
 * The prose half of a body: fenced blocks and indented blocks blanked to
 * empty lines so LINE NUMBERS survive. A finding that cannot name its
 * line is a finding the author has to search for.
 *
 * @param {string} body
 * @returns {string}
 */
export function proseOnly(body) {
  const lines = body.split(/\r?\n/);
  /** @type {string[]} */
  const out = [];
  let fenced = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      out.push("");
      continue;
    }
    if (fenced || /^ {4,}\S/.test(line)) {
      out.push("");
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/* ────────────────────────────────────────────────────────────────────
 * The derivers — a CLOSED vocabulary. A key not in this map is not a
 * provenance this gate can re-run, and the audit says so rather than
 * accepting it.
 * ──────────────────────────────────────────────────────────────────── */

/** @typedef {import("./dispatch-brief.mjs").Ctx} Ctx */

/** @param {Ctx} ctx @param {string} via */
function tree(ctx, via) {
  return treeProv(ctx.ref, via);
}

/** @param {Ctx} ctx @param {string} via */
function live(ctx, via) {
  return liveProv(ctx.at, ctx.host, via);
}

/**
 * Tracked files under a fence entry's expanded paths, with their byte
 * total. **THIS IS `T-137`'s CLASS**: its brief carried a blast-radius
 * figure that had gone stale, and a blast radius is a pure function of a
 * tree that nobody re-derives because re-deriving it by hand is four
 * commands and remembering it is none.
 *
 * @param {Ctx} ctx
 * @param {string} entry
 * @returns {{ files: number, bytes: number, paths: string[] }}
 */
export function fenceWeight(ctx, entry) {
  const { paths } = expandFenceEntry(entry, ctx.slugs, ctx.comps);
  const prefixes = paths.map((p) => p.replace(/\*+$/, "").replace(/\/$/, ""));
  const hits = trackedFiles(ctx.root).filter((rel) =>
    prefixes.some((p) => rel === p || rel.startsWith(`${p}/`)),
  );
  let bytes = 0;
  for (const rel of hits) {
    try {
      bytes += statSync(path.join(ctx.root, rel)).size;
    } catch {
      /* a tracked path with no file on disk is a fact about the checkout,
         not about the fence; the file COUNT still carries it. */
    }
  }
  return { files: hits.length, bytes, paths };
}

/**
 * Every live card naming this entry in its own `touches:`, split by
 * status. **THIS IS `T-149`'s CLASS** — *"20 of 34 planned cards touch
 * `app-shell`"* is a join over the board that changes with every card
 * filed, and it was typed.
 *
 * @param {Ctx} ctx
 * @param {string} entry
 * @returns {{ total: number, byStatus: Map<string, number> }}
 */
export function fenceDemand(ctx, entry) {
  /** @type {Map<string, number>} */
  const byStatus = new Map();
  let total = 0;
  for (const card of ctx.cards.values()) {
    if (!fieldList(card.fields, "touches").includes(entry)) continue;
    const status = fieldScalar(card.fields, "status");
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    total += 1;
  }
  return { total, byStatus: new Map([...byStatus].sort((a, b) => a[0].localeCompare(b[0]))) };
}

/**
 * @typedef {object} CardDeriver
 * @property {string} answers  the question an author would otherwise
 *   answer from memory, in the author's own words
 * @property {(ctx: Ctx) => import("./dispatch-brief.mjs").Rec[]} derive
 */

/**
 * THE CLOSED SET. Every key here answers a figure class this
 * repository's cards demonstrably carry; `measured` is deliberately NOT
 * here, because it is the key that means "no deriver, and the author
 * says so".
 *
 * @type {Map<string, CardDeriver>}
 */
export const CARD_DERIVERS = new Map([
  [
    "board",
    {
      answers: "how many cards are on the board, and in what state",
      /** @param {Ctx} ctx */
      derive(ctx) {
        /** @type {Map<string, number>} */
        const byStatus = new Map();
        for (const card of ctx.cards.values()) {
          const s = fieldScalar(card.fields, "status");
          byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
        }
        const via = "flat docs/tasks/T-*.md frontmatter field status";
        /** @type {import("./dispatch-brief.mjs").Rec[]} */
        const recs = [];
        for (const [s, n] of [...byStatus].sort((a, b) => a[0].localeCompare(b[0]))) {
          recs.push(value(`board ${s}: ${n}`, tree(ctx, via)));
        }
        recs.push(
          value(`board live cards: ${ctx.cards.size}`, tree(ctx, via)),
          value(
            `board rejected files: ${trackedFiles(ctx.root).filter((r) => r.startsWith("docs/tasks/rejected/")).length}`,
            tree(ctx, "git ls-files docs/tasks/rejected/"),
          ),
        );
        return recs;
      },
    },
  ],
  [
    "fence",
    {
      answers: "how big this card's blast radius is, in files and bytes",
      /** @param {Ctx} ctx */
      derive(ctx) {
        if (ctx.card === undefined) return [];
        /** @type {import("./dispatch-brief.mjs").Rec[]} */
        const recs = [];
        for (const entry of fieldList(ctx.card.fields, "touches")) {
          const { files, bytes, paths } = fenceWeight(ctx, entry);
          const via = `${ctx.card.file} touches, expanded through touch_slugs, over git ls-files`;
          recs.push(
            value(`fence ${entry} paths: ${paths.join(" ")}`, tree(ctx, via)),
            value(`fence ${entry} tracked files: ${files}`, tree(ctx, via)),
            value(`fence ${entry} tracked bytes: ${bytes}`, tree(ctx, via)),
          );
        }
        return recs;
      },
    },
  ],
  [
    "demand",
    {
      answers: "how many other cards want the same fence, and in what state",
      /** @param {Ctx} ctx */
      derive(ctx) {
        if (ctx.card === undefined) return [];
        /** @type {import("./dispatch-brief.mjs").Rec[]} */
        const recs = [];
        const via = "every live card's own touches: field";
        for (const entry of fieldList(ctx.card.fields, "touches")) {
          const { total, byStatus } = fenceDemand(ctx, entry);
          recs.push(value(`demand ${entry} cards: ${total}`, tree(ctx, via)));
          for (const [s, n] of byStatus) {
            recs.push(value(`demand ${entry} ${s}: ${n}`, tree(ctx, via)));
          }
        }
        return recs;
      },
    },
  ],
  [
    "contention",
    {
      answers: "which live lane holds each entry of this card's fence right now",
      /** @param {Ctx} ctx */
      derive(ctx) {
        if (ctx.card === undefined) return [];
        const via = "git worktree list --porcelain, filtered on the branch, joined to each card";
        /** @type {import("./dispatch-brief.mjs").Rec[]} */
        const recs = [];
        for (const entry of fieldList(ctx.card.fields, "touches")) {
          /** @type {string[]} */
          const holders = [];
          for (const lane of ctx.lanes) {
            if (lane.taskId === ctx.card.id) continue;
            const other = ctx.cards.get(lane.taskId);
            if (other === undefined) continue;
            if (fieldList(other.fields, "touches").includes(entry)) holders.push(lane.taskId);
          }
          recs.push(
            value(
              `contention ${entry}: ${holders.length === 0 ? "FREE" : holders.sort().join(", ")}`,
              live(ctx, via),
            ),
          );
        }
        return recs;
      },
    },
  ],
  [
    "deps",
    {
      answers: "what this card waits on, and what waits on it",
      /** @param {Ctx} ctx */
      derive(ctx) {
        if (ctx.card === undefined) return [];
        const via = "blocked_by across every live card";
        const waitsOn = fieldList(ctx.card.fields, "blocked_by");
        /** @type {string[]} */
        const holdsUp = [];
        for (const card of ctx.cards.values()) {
          if (fieldList(card.fields, "blocked_by").includes(ctx.card.id)) holdsUp.push(card.id);
        }
        return [
          value(
            `deps ${ctx.card.id} waits on: ${waitsOn.length === 0 ? "nothing" : waitsOn.join(", ")}`,
            tree(ctx, via),
          ),
          value(`deps ${ctx.card.id} waits on count: ${waitsOn.length}`, tree(ctx, via)),
          value(
            `deps ${ctx.card.id} holds up: ${holdsUp.length === 0 ? "nothing" : holdsUp.sort().join(", ")}`,
            tree(ctx, via),
          ),
          value(`deps ${ctx.card.id} holds up count: ${holdsUp.length}`, tree(ctx, via)),
        ];
      },
    },
  ],
  [
    "history",
    {
      answers: "how long the integration branch is, and how old a ref is",
      /** @param {Ctx} ctx */
      derive(ctx) {
        const branch = ctx.spellings.integrationBranch;
        const firstParent = ctx.integrationLog.split(/\r?\n/).filter((l) => l.trim() !== "").length;
        const via = `git log --first-parent ${branch}`;
        /** @type {import("./dispatch-brief.mjs").Rec[]} */
        const recs = [
          value(`history ${branch} first-parent commits: ${firstParent}`, live(ctx, via)),
          value(
            `history ${branch} merges: ${ctx.integrationLog.split(/\r?\n/).filter((l) => / Merge /.test(l)).length}`,
            live(ctx, via),
          ),
          value(
            `history ${branch} checkpoints: ${ctx.integrationLog.split(/\r?\n/).filter((l) => /Checkpoint:/.test(l)).length}`,
            live(ctx, via),
          ),
        ];
        if (ctx.card !== undefined) {
          const added = git(ctx.root, [
            "log",
            "--diff-filter=A",
            "--format=%H %ci",
            "-1",
            "--",
            ctx.card.file,
          ]).trim();
          recs.push(
            value(
              `history ${ctx.card.id} card filed at: ${added === "" ? "not committed yet" : added}`,
              tree(ctx, `git log --diff-filter=A -- ${ctx.card.file}`),
            ),
          );
        }
        return recs;
      },
    },
  ],
]);

/* ────────────────────────────────────────────────────────────────────
 * The audit — the half arm 1 could not have, because it RE-RUNS the
 * provenance instead of noticing that one is present.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} Figure
 * @property {number} line     1-based, into the card FILE
 * @property {string} verdict  VERIFIED | STALE | ATTESTED | UNRUNNABLE | CENSUS
 * @property {string} text     what the card states
 * @property {string} detail   why, in one sentence a reader can act on
 */

/**
 * Every line the derivers currently produce, as a flat SET of texts. A
 * stamped card line is verified by being one of these character for
 * character — which is what makes the stamp unfakeable: a typed number
 * with a pasted stamp is not in this set.
 *
 * @param {Ctx} ctx
 * @returns {Map<string, Set<string>>}
 */
export function derivedTexts(ctx) {
  /** @type {Map<string, Set<string>>} */
  const out = new Map();
  for (const [key, deriver] of CARD_DERIVERS) {
    /** @type {Set<string>} */
    const texts = new Set();
    for (const rec of deriver.derive(ctx)) {
      if (rec.kind === "value") texts.add(rec.text);
    }
    out.set(key, texts);
  }
  return out;
}

/**
 * Does the deriver still produce this figure? **A SENTENCE MAY LEAD INTO
 * A DERIVED FIGURE, AND THAT IS THE WHOLE POINT** — the card stays prose
 * and only the figure itself is machine-owned. So the derived text has to
 * be the END of what the author wrote, at a word boundary: a lead-in
 * sentence is allowed, a hand-edited digit is not.
 *
 * ANCHORING AT THE END IS LOAD-BEARING. Allowing a derived text anywhere
 * INSIDE the line would let an author paste a true figure and then write
 * a different one after it under the same stamp, which is the gaming this
 * whole mechanism exists to make impossible.
 *
 * @param {Set<string>} texts
 * @param {string} stated
 * @returns {boolean}
 */
export function reproduces(texts, stated) {
  for (const d of texts) {
    if (stated === d) return true;
    if (!stated.endsWith(d)) continue;
    const before = stated.charAt(stated.length - d.length - 1);
    if (!/[A-Za-z0-9]/.test(before)) return true;
  }
  return false;
}

/**
 * THE AUDIT. It reads a card's PROSE and answers, for every figure that
 * claims a provenance and for every unstamped census claim, which of the
 * five verdicts it earns.
 *
 * **IT DELIBERATELY SAYS NOTHING ABOUT AN UNSTAMPED NUMBER.** That is
 * arm 1, and the corpus refutes it — see this file's header. The unit of
 * enforcement here is a CLAIM OF PROVENANCE and a CENSUS CLAIM, not a
 * digit.
 *
 * @param {string} cardText
 * @param {Map<string, Set<string>>} derived
 * @param {number} [frontmatterLines] lines consumed by the frontmatter,
 *   so a reported line number indexes the FILE and not the body
 * @returns {Figure[]}
 */
export function auditCard(cardText, derived, frontmatterLines = undefined) {
  const body = cardBody(cardText);
  const offset =
    frontmatterLines ?? cardText.slice(0, cardText.length - body.length).split(/\r?\n/).length - 1;
  /**
   * TWO READINGS OF ONE BODY, AND THE CUT BETWEEN THEM IS OPT-IN.
   *
   * A `card:<key>` stamp is an EXPLICIT machine claim — its author asked
   * for it to be checked — so it is audited wherever it sits, transcript
   * blocks included. **That is a hole this lane found in its own notes**:
   * the paste-ready lines were pasted into an indented block, which the
   * prose reader blanks, so the author who built the gate escaped it by
   * formatting.
   *
   * The other two arms stay PROSE-ONLY, and for a reason rather than for
   * symmetry. A transcript of this repository's own brief command is full
   * of `<- @ <ref> ; <free text>` lines, so applying the bare-arrow arm
   * inside a block would turn every quoted brief into a wall of
   * UNRUNNABLE; and a census claim is INFERRED from prose rather than
   * declared, so inferring one from a command's output is a guess.
   */
  const lines = body.split(/\r?\n/);
  const prose = proseOnly(body).split(/\r?\n/);
  /** @type {Figure[]} */
  const out = [];
  for (let i = 0; i < prose.length; i += 1) {
    const raw = /** @type {string} */ (prose[i]);
    const line = offset + i + 1;
    const stamped = (/** @type {string} */ (lines[i] ?? "")).trim().match(CARD_STAMP);
    if (stamped !== null && stamped.groups !== undefined) {
      const text = stamped.groups["text"] ?? "";
      const key = stamped.groups["key"] ?? "";
      if (key === ATTESTED_KEY) {
        out.push({
          line,
          verdict: "ATTESTED",
          text,
          detail:
            "declared NOT a function of the tree, so this gate did not re-derive it — a reader " +
            "has to know which figures were never checked.",
        });
        continue;
      }
      const texts = derived.get(key);
      if (texts === undefined) {
        out.push({
          line,
          verdict: "UNRUNNABLE",
          text,
          detail:
            `card:${key} is not a deriver this gate implements, so this figure claims a ` +
            `provenance nobody can re-run. The keys that exist are ${[...derived.keys()].join(", ")}` +
            `, plus ${ATTESTED_KEY} for a figure that is not a function of a tree.`,
        });
        continue;
      }
      out.push(
        reproduces(texts, text)
          ? { line, verdict: "VERIFIED", text, detail: `card:${key} reproduces this line at this ref.` }
          : {
              line,
              verdict: "STALE",
              text,
              detail:
                texts.size === 0
                  ? `card:${key} produced NOTHING in this run, so this line was compared ` +
                    "against an empty set rather than against the tree. That deriver is " +
                    "card-scoped and no card was named — re-run naming the card, because a " +
                    "STALE verdict reached this way is a claim about the invocation and not " +
                    "about the figure."
                  : `card:${key} does not produce this line at this ref. What it produces now ` +
                    "is listed above; re-paste the line rather than editing the number, " +
                    "because a hand-edited figure under a stamp is the shape this gate exists " +
                    "to refuse.",
            },
      );
      continue;
    }
    if (ANY_PROVENANCE.test(raw)) {
      out.push({
        line,
        verdict: "UNRUNNABLE",
        text: raw.trim(),
        detail:
          "this line carries a provenance arrow whose source this gate cannot re-run. A marker " +
          "that is PRESENT and does not BIND is how a wrong ordinal shipped beside an honest " +
          "command in this project's own record: the command derived several fields, and the " +
          "word standing next to it was none of them.",
      });
      continue;
    }
    CENSUS_CLAIM.lastIndex = 0;
    const census = CENSUS_CLAIM.exec(raw);
    if (census !== null) {
      out.push({
        line,
        verdict: "CENSUS",
        text: census[0].replace(/\s+/g, " ").trim(),
        detail:
          "an ordinal scoped to this repository's whole history, carrying no stamp. It is a " +
          "claim about a census nobody re-runs, it contains no digit so no figure scanner can " +
          "see it, and it is the class that has already cost this board a rejection. Derive " +
          `it, or attest it with <- @ <ref> ; card:${ATTESTED_KEY} naming the command that ` +
          "produced it.",
      });
    }
  }
  return out;
}

/** The verdicts that are FINDINGS. The other two are reported and owed nothing. */
export const FINDING_VERDICTS = Object.freeze(["STALE", "UNRUNNABLE", "CENSUS"]);

/**
 * ARM `--card`. The ANSWER half first, because that is the half that
 * makes the derived figure cheaper than the remembered one: every line
 * below is paste-ready, stamp included, and a figure pasted out of here
 * is a figure the AUDIT half can re-run.
 *
 * @param {Ctx} ctx
 * @param {string} cardText
 * @returns {{ recs: import("./dispatch-brief.mjs").Rec[], findings: string[] }}
 */
export function cardReport(ctx, cardText) {
  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const recs = [
    note("THE CARD FIGURE LEDGER — paste these lines; do not retype the numbers in them"),
    value(`card: ${ctx.card === undefined ? "none" : ctx.card.file}`, tree(ctx, "flat docs/tasks/T-*.md")),
    value(`HEAD in full: ${ctx.ref}`, tree(ctx, "git rev-parse HEAD")),
    blank(),
  ];
  for (const [key, deriver] of CARD_DERIVERS) {
    recs.push(note(`card:${key} — ${deriver.answers}`));
    const rows = deriver.derive(ctx);
    if (rows.length === 0) {
      recs.push(note(`  nothing to derive for card:${key} without a card`));
    } else {
      recs.push(...rows);
    }
    recs.push(blank());
  }
  recs.push(
    note("WHAT THIS COMMAND WILL NOT INVENT: a suite result, a token spend, a wall-clock"),
    note("duration. They are functions of a RUN and not of a tree. Stamp one"),
    note(`card:${ATTESTED_KEY} with the command that produced it, and the audit will LIST it`),
    note("as never-checked rather than pretend otherwise."),
    blank(),
    note("THE AUDIT — every figure in this card that CLAIMS a provenance, re-run"),
  );

  const derived = derivedTexts(ctx);
  const figures = auditCard(cardText, derived);
  /** @type {string[]} */
  const findings = [];
  if (figures.length === 0) {
    recs.push(note("  no figure in this card claims a provenance and no census claim is made"));
  }
  for (const f of figures) {
    recs.push(
      value(
        `${f.verdict} line ${f.line}: ${f.text}`,
        tree(ctx, ctx.card === undefined ? "the card text handed in" : ctx.card.file),
      ),
      note(`  ${f.detail}`),
    );
    if (FINDING_VERDICTS.includes(f.verdict)) {
      findings.push(`${f.verdict} at line ${f.line}: ${f.text} — ${f.detail}`);
    }
  }
  return { recs, findings };
}
