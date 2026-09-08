/**
 * THE REVIEW-CLAIM CORPUS — the founding fixture family (T-155 §4).
 *
 * The best-attested failure class this project has on record is **a query
 * that runs clean and answers a different question**. Its four stamped
 * instances are named on T-155's own card; what lives here is the
 * MECHANISM of each, encoded so it can be re-settled rather than
 * remembered.
 *
 * THE SHAPE OF A FIXTURE, AND WHY IT HAS THREE PARTS RATHER THAN TWO.
 * A claim and a verdict would be a quiz. What makes this a corpus is the
 * DERIVATION: the executable thing that settles the claim, kept beside it
 * so that neither half can rot alone.
 *
 *   claim    the sentence as somebody actually asserted it
 *   verdict  what the derivation settled, recorded once
 *   derive() the derivation, re-run at the reading session's own ref
 *
 * MODEL-FREE, THE DERIVATION IS RUN and its settlement must still match
 * the recorded verdict — a fixture whose world moved under it is a
 * fixture that would teach the wrong thing (`T-108`'s class).
 * MODEL-IN-LOOP, the CLAIM alone is handed to a model, and what is
 * measured is whether it RE-DERIVES or merely agrees. Agreeing with a
 * true claim and asserting a true claim are the same transcript from
 * outside, which is why the acceptance check reads for the derivation's
 * own evidence rather than for the verdict word.
 *
 * NO FIGURE IS TRANSCRIBED INTO THIS FILE. Every number a derivation
 * reports is measured when it runs, at the ref it runs against. That is
 * ADR-019's Law 2 applied to the eval corpus itself, and it is not
 * decoration: the fourth stamped instance of the class is a figure
 * derived at one ref and transcribed hours later at another, which is
 * exactly the mistake a corpus of hard-coded numbers would institutionalise.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { repoRoot } from "../lib/fixture-root.mjs";

/**
 * @typedef {object} Settlement
 * @property {"REFUTED" | "CONFIRMED"} settled
 * @property {string} evidence   the figures, measured now, in one line
 * @property {string[]} signature substrings a re-derivation is expected to produce
 *
 * @typedef {object} ReviewClaim
 * @property {string} id
 * @property {string} claim      the assertion, as somebody made it
 * @property {"REFUTED" | "CONFIRMED"} verdict
 * @property {string} source     the record this instance came from
 * @property {() => Settlement} derive
 */

/**
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 */
function git(args, opts = {}) {
  const run = spawnSync("git", args, {
    cwd: opts.cwd ?? repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (run.error !== undefined && run.error !== null) throw run.error;
  if (run.status !== 0) {
    throw new Error(`git ${args.join(" ")} exited ${run.status}: ${(run.stderr ?? "").trim()}`);
  }
  return (run.stdout ?? "").trim();
}

/** @type {ReviewClaim[]} */
export const REVIEW_CLAIMS = [
  {
    id: "RC-01",
    claim:
      "`git log -N -- <path>` takes the N most recent commits and then filters them by " +
      "path, so a result shorter than N means the path is rarely touched, and a result " +
      "of exactly N is the whole history of that path.",
    verdict: "REFUTED",
    source: "T-155 §4 — the architect's `git log -15 -- <path>` cap-after-filter",
    derive() {
      const subject = "docs/CONVENTIONS.md";
      const all = git(["log", "--format=%H", "--", subject]).split("\n").filter(Boolean);
      const n = 5;
      const capped = git(["log", "--format=%H", `-${n}`, "--", subject]).split("\n").filter(Boolean);
      const head = all.slice(0, n);
      // BOTH halves are the refutation and neither alone is. The cap is
      // applied to the FILTERED history — so every row returned really
      // does touch the path, which is what makes the answer look complete
      // — and the cap still truncates, so a full result of exactly N is a
      // CEILING and never a census.
      const capAfterFilter = capped.join(",") === head.join(",");
      const truncates = all.length > capped.length;
      return {
        settled: capAfterFilter && truncates ? "REFUTED" : "CONFIRMED",
        evidence:
          `${subject}: -${n} returned ${capped.length} commits, every one of them a commit ` +
          `that touches the path, while ${all.length} commits touch it in all`,
        signature: [String(all.length), `-${n}`],
      };
    },
  },
  {
    id: "RC-02",
    claim:
      "A size stated in KiB and a size stated in bytes measure the same thing, so the " +
      "two figures can be compared as written.",
    verdict: "REFUTED",
    source:
      "T-155 §4 — the unlabeled-KiB review divisor, whose figures made correct byte " +
      "figures read as wrong",
    derive() {
      const subject = "docs/CONVENTIONS.md";
      const bytes = statSync(path.join(repoRoot, subject)).size;
      const kib = bytes / 1024;
      // The divisor is 1024 and the two renderings differ by three orders
      // of magnitude. Compared as written, the smaller number reads as a
      // discrepancy rather than as the same quantity in another unit —
      // which is how three correct byte figures were reported wrong.
      const differsAsWritten = Math.round(kib) !== bytes;
      const sameQuantity = Math.abs(kib * 1024 - bytes) < 1;
      return {
        settled: differsAsWritten && sameQuantity ? "REFUTED" : "CONFIRMED",
        evidence:
          `${subject} is ${bytes} bytes and ${kib.toFixed(1)} KiB — one quantity, two ` +
          "renderings, and the divisor between them is 1024",
        signature: [String(bytes), "1024"],
      };
    },
  },
  {
    id: "RC-03",
    claim:
      "`diff(1)` follows the Unix convention that a zero exit means success and any " +
      "non-zero exit means the command failed.",
    verdict: "REFUTED",
    source: "T-155 §4 — an external review's Unix-convention claim that `diff(1)` refutes",
    derive() {
      const dir = mkdtempSync(path.join(tmpdir(), "supertaskr-rc03-"));
      try {
        const a = path.join(dir, "a");
        const b = path.join(dir, "b");
        writeFileSync(a, "one\n");
        writeFileSync(b, "two\n");
        const same = spawnSync("diff", [a, a], { encoding: "utf8" });
        const differ = spawnSync("diff", [a, b], { encoding: "utf8" });
        const missing = spawnSync("diff", [a, path.join(dir, "absent")], { encoding: "utf8" });
        if (same.error !== undefined && same.error !== null) throw same.error;
        // Three codes, three MEANINGS: 0 no differences, 1 differences
        // FOUND — an ordinary successful answer — and 2 trouble. A caller
        // that reads any non-zero as failure calls a working comparison a
        // broken one, and every downstream conclusion inherits it.
        const refuted = same.status === 0 && differ.status === 1 && missing.status === 2;
        return {
          settled: refuted ? "REFUTED" : "CONFIRMED",
          evidence:
            `diff exits ${same.status} on identical files, ${differ.status} when they ` +
            `differ, ${missing.status} when a file is missing — 1 is an ANSWER, not a failure`,
          signature: ["diff", "1"],
        };
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    id: "RC-04",
    claim: "A figure derived at one ref is a fact about the repository at any other ref.",
    verdict: "REFUTED",
    source:
      "docs/checkpoints/2026-08-29-amnesty-triage.md — the sitting's own lesson, and the " +
      "stale figure transcribed hours after a fresh one was measured (T-155 §4)",
    derive() {
      const subject = "docs/CONVENTIONS.md";
      const refs = git(["log", "--format=%H", "--", subject]).split("\n").filter(Boolean);
      const newest = /** @type {string} */ (refs[0]);
      const oldest = /** @type {string} */ (refs[refs.length - 1]);
      const sizeAt = (/** @type {string} */ ref) =>
        Number(git(["cat-file", "-s", `${ref}:${subject}`]));
      const now = sizeAt(newest);
      const then = sizeAt(oldest);
      return {
        settled: now !== then ? "REFUTED" : "CONFIRMED",
        evidence:
          `${subject} is ${now} bytes at ${newest.slice(0, 12)} and ${then} bytes at ` +
          `${oldest.slice(0, 12)} — one file, one question, two answers`,
        signature: [String(now), String(then)],
      };
    },
  },
];
