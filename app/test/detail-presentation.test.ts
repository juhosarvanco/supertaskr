import { describe, expect, it } from "vitest";
import { criterionLines, verdictEntries } from "../src/lib/task-detail";

// T-006 panel presentation derivations: pure, total functions over the
// raw section markdown (which stays verbatim — these only decide row
// splits and tints, never rewrite text).

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
});
