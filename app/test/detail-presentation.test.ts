import { describe, expect, it } from "vitest";
import { criterionLines } from "../src/lib/task-detail";
import { rejectedVerdictCount, verdictEntries } from "../src/lib/verdicts";

// T-006 panel presentation derivations: pure, total functions over the
// raw section markdown (which stays verbatim — these only decide row
// splits and tints, never rewrite text). T-017 moves the verdict family
// to src/lib/verdicts.ts (shared with selectBoard's rejected ×N count)
// and pins first-match-wins tinting (T-006-s4) plus the count
// derivation (T-006-s3).

describe("criterionLines", () => {
  const raw = [
    "- THE app SHALL apply a coherent visual identity — typography",
    "  scale and color system.",
    "- WHEN the board renders THE result SHALL be screenshot-ready.",
  ].join("\n");

  it("splits bullets into rows, folding continuation lines", () => {
    const rows = criterionLines(raw, "planned");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.text).toContain("coherent visual identity — typography scale");
    expect(rows[1]?.text).toContain("screenshot-ready");
  });

  it("marks rows met only once the task passed its verdict gate", () => {
    expect(criterionLines(raw, "building").every((row) => !row.met)).toBe(true);
    expect(criterionLines(raw, "verifying").every((row) => !row.met)).toBe(true);
    expect(criterionLines(raw, "done").every((row) => row.met)).toBe(true);
    expect(criterionLines(raw, "merging").every((row) => row.met)).toBe(true);
  });

  it("renders non-bullet text as rows too (total — nothing is dropped)", () => {
    const rows = criterionLines("just a sentence\n\nanother", "planned");
    expect(rows.map((row) => row.text)).toEqual(["just a sentence", "another"]);
  });
});

describe("verdictEntries", () => {
  it("splits date-headed entries and tints by the verdict word", () => {
    const raw = [
      "2026-08-12 — codex @fresh (verifier): REJECTED",
      "",
      "repro: column order comes from file order.",
      "",
      "2026-08-13 — claude @fresh (verifier, same-model as builder):",
      "APPROVED — order now read from roadmap.",
    ].join("\n");
    const entries = verdictEntries(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.kind).toBe("rejected");
    // Verbatim: the entry keeps its full text, body included.
    expect(entries[0]?.text).toContain("repro: column order comes from file order.");
    // The verdict word may wrap to the header's next line — still found.
    expect(entries[1]?.kind).toBe("approved");
  });

  it("folds unheaded text into one neutral entry (nothing errors)", () => {
    const entries = verdictEntries("free-form notes\nwith two lines");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("note");
    expect(entries[0]?.text).toBe("free-form notes\nwith two lines");
  });

  it("only the header paragraph decides the tint, not quoted body text", () => {
    const raw = [
      "2026-08-14 — claude (verifier): APPROVED",
      "",
      "the earlier run said REJECTED but that is quoted history.",
    ].join("\n");
    expect(verdictEntries(raw)[0]?.kind).toBe("approved");
  });

  // T-006-s4 (T-017): when ONE header paragraph carries both words, the
  // earlier one wins — convention verdicts lead with the verdict word,
  // so an APPROVED entry mentioning REJECTED is approved, not terracotta.
  it("first match wins when both words share the header paragraph: APPROVED first", () => {
    const raw =
      "2026-08-14 — verifier: APPROVED — the REJECTED repro from the first entry no longer reproduces.";
    expect(verdictEntries(raw)[0]?.kind).toBe("approved");
  });

  it("first match wins when both words share the header paragraph: REJECTED first", () => {
    const raw =
      "2026-08-14 — verifier: REJECTED — the criteria said APPROVED requires green suites.";
    expect(verdictEntries(raw)[0]?.kind).toBe("rejected");
  });

  it("a lone verdict word still tints, wherever it sits in the header paragraph", () => {
    expect(verdictEntries("2026-08-14 — verifier:\nREJECTED after retry")[0]?.kind).toBe(
      "rejected",
    );
    expect(verdictEntries("2026-08-14 — verifier:\nAPPROVED on retry")[0]?.kind).toBe(
      "approved",
    );
  });
});

describe("rejectedVerdictCount (T-006-s3)", () => {
  const HISTORY = [
    "2026-08-12 — codex @fresh (verifier): REJECTED",
    "",
    "repro: column order comes from file order.",
    "",
    "2026-08-13 — codex @fresh (verifier): REJECTED — still file order.",
    "",
    "2026-08-14 — claude (verifier): APPROVED — order now from roadmap.",
  ].join("\n");

  it("counts REJECTED entries with the same classifier the tint uses", () => {
    expect(rejectedVerdictCount(HISTORY)).toBe(2);
  });

  it("an absent section counts zero", () => {
    expect(rejectedVerdictCount(undefined)).toBe(0);
  });

  it("approved-only history and neutral notes count zero", () => {
    expect(rejectedVerdictCount("2026-08-14 — verifier: APPROVED")).toBe(0);
    expect(rejectedVerdictCount("free-form notes, no verdict word")).toBe(0);
  });

  it("a REJECTED mention quoted in an approved entry's body does not count", () => {
    const raw = [
      "2026-08-14 — claude (verifier): APPROVED",
      "",
      "the earlier run said REJECTED but that is quoted history.",
    ].join("\n");
    expect(rejectedVerdictCount(raw)).toBe(0);
  });
});
