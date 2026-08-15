import { describe, expect, it } from "vitest";
import type { DerivedComponent, DriftFinding } from "../src/lib/architecture/derive";
import {
  attributedFindings,
  driftCount,
  driftFooter,
  edgeVisual,
  edgeWeight,
  findingText,
  hasVisibleMark,
  independentLine,
  nodeVisual,
  panelFindings,
  provenanceLabel,
  type NodeUiState,
} from "../src/architecture/map-visuals";

// The sixteen-state table (T-012 plan §6): every designed node state and
// composition maps to token-backed classes. Status is a fill, drift is
// a stroke — the invariants live here as assertions: --warning never
// appears as a node bg class, dimming is opacity (never a color swap),
// pulse exists only as the dot (motion-safe-gated in CSS).

function component(partial: Partial<DerivedComponent>): DerivedComponent {
  return {
    id: "C-01",
    name: "Test",
    kind: "declared",
    status: "planned",
    pinned: false,
    autoStatus: "planned",
    files: [],
    declaredOnly: false,
    hasDrift: false,
    tasks: [],
    ...partial,
  };
}

const base: NodeUiState = {
  hovered: false,
  selected: false,
  focused: false,
  dimmed: false,
  overlay: "status",
};

describe("the six status fills", () => {
  it.each([
    ["planned", "bg-status-planned", "text-status-planned-meta"],
    ["building", "bg-status-building", "text-status-building-meta"],
    ["verifying", "bg-status-verifying", "text-status-verifying-meta"],
    ["rejected", "bg-status-rejected", "text-status-rejected-meta"],
    ["done", "bg-status-done", "text-status-done-meta"],
    ["merging", "bg-status-merging", "text-status-merging-meta"],
  ] as const)("%s fills from the status family", (status, bg, meta) => {
    const v = nodeVisual(component({ status }), base);
    expect(v.container).toContain(bg);
    expect(v.container).toContain(`border-status-${status}-border`);
    expect(v.metaInk).toBe(meta);
    expect(v.idInk).toBe(`text-status-${status}-foreground`);
    expect(v.titleInk).toBe(`text-status-${status}-title`);
  });

  it("--warning is never a node fill, in any state", () => {
    const everything: DerivedComponent[] = [
      component({ status: "building", hasDrift: true }),
      component({ status: "done", hasDrift: true }),
      component({ kind: "unmapped", id: "unmapped", hasDrift: true }),
      component({ kind: "inferred" }),
      component({ declaredOnly: true }),
    ];
    for (const c of everything) {
      for (const overlay of ["status", "provenance", "drift"] as const) {
        const v = nodeVisual(c, { ...base, overlay });
        // Assembled so Tailwind's source scanner never sees the banned
        // utility as a candidate in this file (it must stay unminted).
        expect(v.container).not.toContain("bg-" + "warning");
      }
    }
  });
});

describe("status word + pulse placement (hero rules)", () => {
  it("verifying and merging carry the 5px dot + word up top; the dot is the only pulse", () => {
    const verifying = nodeVisual(component({ status: "verifying" }), base);
    expect(verifying.dot).toBe("bg-chart-4");
    expect(verifying.dotWord).toBe("verifying");
    expect(verifying.metaStatusWord).toBeUndefined();
    const merging = nodeVisual(component({ status: "merging" }), base);
    expect(merging.dot).toBe("bg-chart-2");
    expect(merging.dotWord).toBe("merging");
  });

  it("building and rejected put the word on the meta line", () => {
    expect(nodeVisual(component({ status: "building" }), base).metaStatusWord).toBe("building");
    expect(nodeVisual(component({ status: "rejected" }), base).metaStatusWord).toBe("rejected");
    expect(nodeVisual(component({ status: "building" }), base).dot).toBeUndefined();
  });

  it("done and planned show no status word (hero C-03/C-06)", () => {
    for (const status of ["done", "planned"] as const) {
      const v = nodeVisual(component({ status }), base);
      expect(v.dotWord).toBeUndefined();
      expect(v.metaStatusWord).toBeUndefined();
    }
  });
});

describe("declared-only · inferred · unmapped · pinned", () => {
  it("declared-only is outline-only (transparent fill, dashed border)", () => {
    const v = nodeVisual(component({ declaredOnly: true, status: "planned" }), base);
    expect(v.container).toContain("bg-transparent");
    expect(v.container).toContain("border-dashed");
    expect(v.container).toContain("border-map-declared-only-border");
    expect(v.idInk).toBe("text-map-declared-only-foreground");
    expect(v.titleInk).toBe("text-map-declared-only-title");
  });

  it("placeholders (D5 targets) share the declared-only treatment", () => {
    const v = nodeVisual(component({ kind: "placeholder" }), base);
    expect(v.container).toContain("bg-transparent");
    expect(v.container).toContain("border-map-declared-only-border");
  });

  it("a PIN beats declared-only: the architect's word renders its fill (C-01's live case)", () => {
    const v = nodeVisual(
      component({ status: "done", pinned: true, declaredOnly: true, hasDrift: true }),
      base,
    );
    expect(v.container).toContain("bg-status-done");
    expect(v.container).not.toContain("bg-transparent");
    expect(v.ring).toBe(true); // the D3 tension stays visible
  });

  it("inferred pseudo-components take the ghost family", () => {
    const v = nodeVisual(component({ kind: "inferred" }), base);
    expect(v.container).toContain("bg-map-unmapped");
    expect(v.container).toContain("border-dashed");
    expect(v.container).toContain("border-map-edge-planned");
  });

  it("the unmapped bucket is provisional grey; the drift overlay promotes it to warning-dashed", () => {
    const bucket = component({ kind: "unmapped", id: "unmapped", hasDrift: true });
    const rest = nodeVisual(bucket, base);
    expect(rest.container).toContain("border-map-edge-planned");
    expect(rest.container).not.toContain("border-warning");
    expect(rest.ring).toBe(false); // the bucket IS the finding — never ringed
    const promoted = nodeVisual(bucket, { ...base, overlay: "drift" });
    expect(promoted.container).toContain("border-warning");
    expect(promoted.idInk).toBe("text-warning");
    expect(promoted.container).not.toContain("opacity-40"); // it holds strength
  });
});

describe("drift ring composes with any fill (status fill, drift stroke)", () => {
  it("building + drift and done + drift both ring", () => {
    const building = nodeVisual(component({ status: "building", hasDrift: true }), base);
    expect(building.ring).toBe(true);
    expect(building.container).toContain("bg-status-building");
    const done = nodeVisual(component({ status: "done", hasDrift: true }), base);
    expect(done.ring).toBe(true);
    expect(done.container).toContain("bg-status-done");
  });

  it("drift renders in EVERY overlay (core rendering, never overlay-gated)", () => {
    for (const overlay of ["status", "provenance", "drift"] as const) {
      const v = nodeVisual(component({ hasDrift: true }), { ...base, overlay });
      expect(v.ring).toBe(true);
      expect(v.driftDisplay).not.toBe("none");
    }
  });

  it("the drift overlay swaps the chip for a bare numeral and dims only the clean", () => {
    const dirty = nodeVisual(component({ hasDrift: true }), { ...base, overlay: "drift" });
    expect(dirty.driftDisplay).toBe("numeral");
    expect(dirty.container).not.toContain("opacity-40");
    const clean = nodeVisual(component({}), { ...base, overlay: "drift" });
    expect(clean.container).toContain("opacity-40");
  });
});

describe("hover · selected · focused · dimmed", () => {
  it("hover darkens the border one step and lifts the strong shadow", () => {
    const v = nodeVisual(component({ status: "done" }), { ...base, hovered: true });
    expect(v.container).toContain("border-status-done-border-strong");
    expect(v.container).toContain("shadow-map-hover-strong");
  });

  it("selected takes the ink border utility and its shadow; hover border yields", () => {
    const v = nodeVisual(component({ status: "done" }), { ...base, hovered: true, selected: true });
    expect(v.container).toContain("map-node-selected");
    expect(v.container).toContain("shadow-map-selected");
    expect(v.container).not.toContain("border-status-done-border-strong");
  });

  it("focused adds the ring composite", () => {
    const v = nodeVisual(component({}), { ...base, focused: true });
    expect(v.container).toContain("shadow-map-focus");
  });

  it("dimmed is opacity, never a color swap — the teal stays teal", () => {
    const v = nodeVisual(component({ status: "done" }), { ...base, dimmed: true });
    expect(v.container).toContain("opacity-32");
    expect(v.container).toContain("bg-status-done"); // fill untouched
  });
});

describe("provenance (ADR-016: two marks; the third state is a ring)", () => {
  it("checked (independent OR same-model) and self are visible marks; unreviewed is not", () => {
    expect(hasVisibleMark("independent")).toBe(true);
    expect(hasVisibleMark("same-model")).toBe(true);
    expect(hasVisibleMark("self-verified")).toBe(true);
    expect(hasVisibleMark("unreviewed")).toBe(false);
    expect(hasVisibleMark(undefined)).toBe(false);
  });

  it("the three-way distinction lives in TEXT", () => {
    expect(provenanceLabel("independent")).toContain("different model");
    expect(provenanceLabel("same-model")).toContain("same model");
    expect(provenanceLabel("self-verified")).toContain("signed off on itself");
  });

  it("the provenance overlay grows marks 12 → 14 and rings the unverified", () => {
    const withMark = component({ status: "done", provenance: "independent" });
    expect(nodeVisual(withMark, base).markSize).toBe(12);
    expect(nodeVisual(withMark, { ...base, overlay: "provenance" }).markSize).toBe(14);
    const unverified = component({});
    expect(nodeVisual(unverified, base).unverifiedRing).toBe(false);
    expect(nodeVisual(unverified, { ...base, overlay: "provenance" }).unverifiedRing).toBe(true);
    // Done-but-unstamped (T-011's `unreviewed`) also reads unverified.
    const unstamped = component({ status: "done", provenance: "unreviewed" });
    expect(nodeVisual(unstamped, { ...base, overlay: "provenance" }).unverifiedRing).toBe(true);
  });

  it("the overlay hover line counts independent checks over done tasks", () => {
    const line = independentLine(
      component({
        tasks: [
          { title: "a", status: "done", review: "independent", file: "a.md", inRollup: true },
          { title: "b", status: "done", review: "self-verified", file: "b.md", inRollup: true },
          { title: "c", status: "building", file: "c.md", inRollup: true },
        ],
      }),
    );
    expect(line).toBe("1 of 2 tasks independently checked");
    expect(independentLine(component({}))).toBeUndefined();
  });
});

describe("reduced motion: static equivalents by construction", () => {
  it("motion never lives in the visual table — the dot's pulse and the teal wipe are motion-safe CSS", () => {
    // The table emits STATE (dot present/absent), not animation classes;
    // the rendering layer attaches `motion-safe:animate-status-pulse` /
    // `motion-safe:animate-map-teal-wipe`, so prefers-reduced-motion
    // strips motion without a JS branch. Pinned here: the only motion
    // hooks the table can produce are those two names, gated.
    const v = nodeVisual(component({ status: "verifying" }), base);
    expect(v.dot).toBe("bg-chart-4");
    expect(JSON.stringify(v)).not.toContain("animate-");
  });
});

describe("edges", () => {
  it("weight scales 1.5 → 2.5 capped", () => {
    expect(edgeWeight(0)).toBe(1.5);
    expect(edgeWeight(1)).toBe(1.5);
    expect(edgeWeight(5)).toBe(2);
    expect(edgeWeight(9)).toBe(2.5);
    expect(edgeWeight(40)).toBe(2.5);
  });

  const calm = { lifted: false, backgrounded: false, overlay: "status" as const };

  it("the three relations carry their measured strokes", () => {
    expect(edgeVisual("confirmed", 1, calm)).toMatchObject({
      stroke: "var(--map-edge)",
      strokeWidth: 1.5,
      marker: "confirmed",
    });
    expect(edgeVisual("planned", 0, calm)).toMatchObject({
      stroke: "var(--map-edge-planned)",
      strokeWidth: 1.25,
      dashArray: "1 4",
      linecap: "round",
      marker: "planned",
    });
    expect(edgeVisual("undeclared", 1, calm)).toMatchObject({
      stroke: "var(--warning)",
      dashArray: "5 4",
      marker: "drift",
    });
  });

  it("observed (inferred mode) takes the confirmed stroke — reality-only is not drift", () => {
    expect(edgeVisual("observed", 2, calm)).toMatchObject({
      stroke: "var(--map-edge)",
      marker: "confirmed",
    });
  });

  it("hover lifts to ink at 2.25 with the count; drift lifts in warning; planned darkens a step", () => {
    const lifted = { ...calm, lifted: true };
    expect(edgeVisual("confirmed", 3, lifted)).toMatchObject({
      stroke: "var(--map-edge-hover)",
      strokeWidth: 2.25,
      marker: "hover",
      showCount: true,
    });
    expect(edgeVisual("undeclared", 3, lifted)).toMatchObject({
      stroke: "var(--warning)",
      strokeWidth: 2.25,
      dashArray: "5 4",
      showCount: true,
    });
    expect(edgeVisual("planned", 0, lifted)).toMatchObject({
      stroke: "var(--map-edge)",
      strokeWidth: 1.25,
      showCount: false,
    });
  });

  it("non-neighborhood edges mute while something is lit", () => {
    const v = edgeVisual("confirmed", 3, { ...calm, backgrounded: true });
    expect(v.stroke).toBe("var(--map-edge-muted)");
    expect(v.marker).toBe("muted");
  });

  it("the provenance overlay drops every unlifted edge to muted", () => {
    const v = edgeVisual("confirmed", 3, { ...calm, overlay: "provenance" });
    expect(v.stroke).toBe("var(--map-edge-muted)");
  });

  it("the drift overlay thickens drift edges to 1.75 and mutes the clean", () => {
    expect(edgeVisual("undeclared", 1, { ...calm, overlay: "drift" })).toMatchObject({
      stroke: "var(--warning)",
      strokeWidth: 1.75,
    });
    expect(edgeVisual("confirmed", 1, { ...calm, overlay: "drift" })).toMatchObject({
      stroke: "var(--map-edge-muted)",
    });
  });
});

describe("finding attribution + text", () => {
  const findings: DriftFinding[] = [
    { rule: "D1", id: "D1:C-05->C-06", from: "C-05", to: "C-06", fileEdges: [
      { from: "app/test/a.test.ts", to: "lib/parser" },
      { from: "app/test/b.test.ts", to: "lib/parser" },
    ] },
    { rule: "D2", id: "D2:unmapped", files: ["src/x.ts", "src/y.ts"] },
    { rule: "D3", id: "D3:C-07", component: "C-07" },
    { rule: "D4", id: "D4:src/shared.ts", path: "src/shared.ts", ids: ["C-05", "C-08"] },
    { rule: "D5", id: "D5:C-05->C-99", from: "C-05", to: "C-99" },
  ];

  it("rings follow source attribution (D1/D5 from, D3 subject, D2 the bucket; D4 never rings — T-011's stance)", () => {
    expect(attributedFindings(findings, "C-05").map((f) => f.id)).toEqual([
      "D1:C-05->C-06",
      "D5:C-05->C-99",
    ]);
    expect(driftCount(findings, "C-05")).toBe(2);
    expect(driftCount(findings, "C-07")).toBe(1);
    expect(driftCount(findings, "C-06")).toBe(0); // D1 target, not source
    expect(driftCount(findings, "C-08")).toBe(0); // D4 membership only
    expect(driftCount(findings, "unmapped")).toBe(1);
  });

  it("panels additionally explain D4 to both claimants", () => {
    expect(panelFindings(findings, "C-08").map((f) => f.id)).toEqual(["D4:src/shared.ts"]);
    expect(panelFindings(findings, "C-05").map((f) => f.id)).toEqual([
      "D1:C-05->C-06",
      "D4:src/shared.ts",
      "D5:C-05->C-99",
    ]);
  });

  it("every rule renders one plain sentence (facts, not warnings)", () => {
    expect(findingText(findings[0] as DriftFinding)).toEqual({
      label: "D1",
      sentence: "C-05 imports C-06 without declaring the dependency.",
      evidence: "a.test.ts · b.test.ts",
    });
    expect(findingText(findings[1] as DriftFinding).sentence).toBe(
      "2 files claimed by no component.",
    );
    expect(findingText(findings[2] as DriftFinding).sentence).toContain(
      "globs match no indexed file",
    );
    expect(findingText(findings[3] as DriftFinding)).toEqual({
      label: "D4",
      sentence: "src/shared.ts is claimed by 2 components — C-05, C-08.",
      evidence: "first by component id order wins (C-05)",
    });
    expect(findingText(findings[4] as DriftFinding).sentence).toContain("no component file declares");
  });

  it("evidence lists cap at four leaves", () => {
    const many: DriftFinding = {
      rule: "D2",
      id: "D2:unmapped",
      files: ["a/1.ts", "a/2.ts", "a/3.ts", "a/4.ts", "a/5.ts", "a/6.ts"],
    };
    expect(findingText(many).evidence).toBe("1.ts · 2.ts · 3.ts · 4.ts · +2 more");
  });

  it("the drift-overlay footer counts findings, components, unclaimed files", () => {
    expect(driftFooter(findings, ["src/x.ts", "src/y.ts"])).toBe(
      "5 findings across 2 components · 2 unclaimed files",
    );
    expect(driftFooter([], [])).toBe("0 findings across 0 components");
  });
});
