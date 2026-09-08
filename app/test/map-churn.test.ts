import { beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@supertaskr/parser/pure";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";
import {
  attributeChurn,
  churnBarPercent,
  CHURN_BAR_MIN_PERCENT,
  type ChurnPathEntry,
} from "../src/lib/architecture/churn";
import {
  __resetChurnForTests,
  applyChurnPayload,
  churnDisabledSentence,
  getChurnState,
  parseChurnPayload,
  subscribeChurn,
  type ChurnDisabledReason,
} from "../src/architecture/churn-source";
import { churnAge, churnFooter, churnVisual } from "../src/architecture/map-visuals";

// T-013's churn half, headless: the untrusted-payload boundary, the
// attribution join, and the state -> ink table. The subprocess itself is
// Rust and is drilled there (app/src-tauri/src/churn.rs); what this file
// owns is everything AFTER the boundary — including what happens when
// the boundary is handed something no honest Rust would send.

beforeEach(() => {
  __resetChurnForTests();
});

function componentFile(id: string, name: string, paths: string[]): FileEntry {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `name: ${JSON.stringify(name)}`,
      "paths:",
      ...paths.map((p) => `  - ${JSON.stringify(p)}`),
      "depends_on: []",
      "status: auto",
      "touch_slugs: []",
      "---",
      "prose.",
    ].join("\n"),
  };
}

function graphJson(files: string[]): string {
  return JSON.stringify({
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: files.map((path) => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] })),
    packages: [],
    edges: [],
    unresolved: [],
  });
}

function fixture(components: FileEntry[], indexed: string[]) {
  const model = parseProjectFromFiles(components);
  const parsed = parseGraph(graphJson(indexed));
  return deriveArchitecture({
    components: model.components ?? [],
    tasks: model.tasks,
    ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
  });
}

const entry = (path: string, commits: number, lastCommitMs = 0): ChurnPathEntry => ({
  path,
  commits,
  lastCommitMs,
});

// ---- the boundary -----------------------------------------------------

describe("parseChurnPayload — the boundary refuses, it never throws", () => {
  it("reads an honest measured payload whole", () => {
    const state = parseChurnPayload({
      kind: "measured",
      windowDays: 30,
      commits: 12,
      truncated: false,
      rejected: 1,
      measuredAtMs: 1700,
      paths: [
        { path: "a.ts", commits: 3, lastCommitMs: 900 },
        { path: "b.ts", commits: 1, lastCommitMs: 800 },
      ],
    });
    expect(state).toEqual({
      kind: "measured",
      windowDays: 30,
      commits: 12,
      truncated: false,
      rejected: 1,
      measuredAtMs: 1700,
      entries: [entry("a.ts", 3, 900), entry("b.ts", 1, 800)],
    });
  });

  it("A COUNT THAT IS NOT A NUMBER is refused and counted, and its siblings survive", () => {
    const state = parseChurnPayload({
      kind: "measured",
      windowDays: 30,
      commits: 4,
      rejected: 0,
      paths: [
        { path: "kept.ts", commits: 2, lastCommitMs: 5 },
        { path: "words.ts", commits: "many" },
        { path: "float.ts", commits: 1.5 },
        { path: "negative.ts", commits: -3 },
        { path: "nan.ts", commits: Number.NaN },
        { path: "infinite.ts", commits: Number.POSITIVE_INFINITY },
        { path: "zero.ts", commits: 0 },
      ],
    });
    expect(state.kind).toBe("measured");
    if (state.kind !== "measured") throw new Error("unreachable");
    expect(state.entries).toEqual([entry("kept.ts", 2, 5)]);
    expect(state.rejected).toBe(6);
  });

  it("refuses the other malformed shapes and keeps going", () => {
    const state = parseChurnPayload({
      kind: "measured",
      windowDays: 30,
      commits: 1,
      paths: [
        null,
        "a string",
        { commits: 2 },
        { path: 7, commits: 2 },
        { path: "", commits: 2 },
        { path: "dupe.ts", commits: 1 },
        { path: "dupe.ts", commits: 99 },
        { path: "bad-time.ts", commits: 1, lastCommitMs: "yesterday" },
      ],
    });
    if (state.kind !== "measured") throw new Error("unreachable");
    expect(state.entries).toEqual([entry("dupe.ts", 1, 0), entry("bad-time.ts", 1, 0)]);
    expect(state.rejected).toBe(6);
  });

  it("a crafted __proto__ key is inert data, never a prototype write", () => {
    const before = Object.prototype.hasOwnProperty.call({}, "polluted");
    const state = parseChurnPayload(
      JSON.parse(
        '{"kind":"measured","windowDays":30,"commits":1,"paths":[{"path":"__proto__","commits":1,"polluted":true}]}',
      ),
    );
    if (state.kind !== "measured") throw new Error("unreachable");
    expect(state.entries).toEqual([entry("__proto__", 1, 0)]);
    expect(Object.prototype.hasOwnProperty.call({}, "polluted")).toBe(before);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("anything that is not a payload at all is `unreadable`, not an exception", () => {
    for (const junk of [
      undefined,
      null,
      42,
      "measured",
      [],
      {},
      { kind: "nonsense" },
      { kind: "measured" },
      { kind: "measured", windowDays: 0, commits: 1 },
      { kind: "measured", windowDays: 30, commits: "lots" },
      { kind: "measured", windowDays: 30, commits: 1, paths: "not an array" },
    ]) {
      expect(parseChurnPayload(junk)).toEqual({ kind: "disabled", reason: "unreadable" });
    }
  });

  it("keeps the five Rust reasons and folds an unknown one rather than echoing it", () => {
    for (const reason of ["noProject", "gitUnavailable", "notAGitRepo", "noHistory", "gitFailed"]) {
      expect(parseChurnPayload({ kind: "disabled", reason })).toEqual({
        kind: "disabled",
        reason,
      });
    }
    // The shape a message field WOULD have taken, if there were one.
    expect(
      parseChurnPayload({ kind: "disabled", reason: "fatal: not a git repository" }),
    ).toEqual({ kind: "disabled", reason: "unreadable" });
  });

  it("every reason has ONE fixed sentence and none of them is a git string", () => {
    const reasons: ChurnDisabledReason[] = [
      "noProject",
      "gitUnavailable",
      "notAGitRepo",
      "noHistory",
      "gitFailed",
      "notTauri",
      "unreadable",
    ];
    const sentences = reasons.map(churnDisabledSentence);
    expect(new Set(sentences).size).toBe(reasons.length);
    for (const sentence of sentences) {
      expect(sentence).not.toContain("fatal");
      expect(sentence.length).toBeLessThan(80);
    }
  });

  it("applyChurnPayload is the one fold, and it notifies", () => {
    let notified = 0;
    const off = subscribeChurn(() => {
      notified += 1;
    });
    expect(getChurnState()).toEqual({ kind: "loading" });
    applyChurnPayload({ kind: "disabled", reason: "notAGitRepo" });
    expect(notified).toBe(1);
    expect(getChurnState()).toEqual({ kind: "disabled", reason: "notAGitRepo" });
    off();
    applyChurnPayload({ kind: "disabled", reason: "gitFailed" });
    expect(notified).toBe(1);
  });
});

// ---- attribution ------------------------------------------------------

describe("attributeChurn", () => {
  const derived = fixture(
    [componentFile("C-01", "Ay", ["src/a/**"]), componentFile("C-02", "Bee", ["src/b/**"])],
    ["src/a/one.ts", "src/b/two.ts", "src/loose/orphan.ts"],
  );

  it("sums a component's paths, counts its files, and keeps the newest touch", () => {
    const attribution = attributeChurn(derived, [
      entry("src/a/one.ts", 5, 300),
      entry("src/a/deep/three.rs", 2, 900),
      entry("src/b/two.ts", 1, 100),
    ]);
    expect(attribution.byComponent.get("C-01")).toEqual({
      edits: 7,
      files: 2,
      lastCommitMs: 900,
    });
    expect(attribution.byComponent.get("C-02")).toEqual({
      edits: 1,
      files: 1,
      lastCommitMs: 100,
    });
    expect(attribution.busiest).toBe(7);
    expect(attribution.hottest).toBe("C-01");
    expect(attribution.unattributed).toBe(0);
  });

  it("attributes a NON-indexed path through the declared globs — the whole point", () => {
    // `src/a/deep/three.rs` is not in the graph: the indexer collects no
    // Rust. Without the glob fallback a Rust crate reads as permanently
    // cold, which is the failure this arm exists to prevent.
    const attribution = attributeChurn(derived, [entry("src/a/deep/three.rs", 4)]);
    expect(attribution.byComponent.get("C-01")?.edits).toBe(4);
    expect(attribution.unattributed).toBe(0);
  });

  it("gives the unmapped bucket its own churn, through the indexed mapping", () => {
    const attribution = attributeChurn(derived, [entry("src/loose/orphan.ts", 3)]);
    expect(attribution.byComponent.get("unmapped")?.edits).toBe(3);
  });

  it("a path no component claims stays OUTSIDE, reported rather than folded in", () => {
    const attribution = attributeChurn(derived, [
      entry("README.md", 9),
      entry("src/a/one.ts", 1),
    ]);
    expect(attribution.unattributed).toBe(9);
    expect(attribution.busiest).toBe(1);
    expect([...attribution.byComponent.keys()]).toEqual(["C-01"]);
  });

  it("a TIE names no hottest — a peak that is not there is not drawn", () => {
    const tied = attributeChurn(derived, [entry("src/a/one.ts", 4), entry("src/b/two.ts", 4)]);
    expect(tied.busiest).toBe(4);
    expect(tied.hottest).toBeUndefined();
    // Positive control: break the tie and the peak appears.
    const broken = attributeChurn(derived, [
      entry("src/a/one.ts", 5),
      entry("src/b/two.ts", 4),
    ]);
    expect(broken.hottest).toBe("C-01");
  });

  it("an empty read attributes nothing and claims no busiest", () => {
    const attribution = attributeChurn(derived, []);
    expect(attribution.busiest).toBe(0);
    expect(attribution.hottest).toBeUndefined();
    expect(attribution.byComponent.size).toBe(0);
  });
});

describe("churnBarPercent", () => {
  it("is a share of the busiest, floored so a sliver is still visible", () => {
    expect(churnBarPercent(41, 41)).toBe(100);
    expect(churnBarPercent(20, 40)).toBe(50);
    expect(churnBarPercent(1, 1000)).toBe(CHURN_BAR_MIN_PERCENT);
    expect(churnBarPercent(0, 40)).toBe(0);
    expect(churnBarPercent(5, 0)).toBe(0);
  });
});

// ---- ink ---------------------------------------------------------------

describe("churnVisual", () => {
  const derived = fixture(
    [
      componentFile("C-01", "Ay", ["src/a/**"]),
      componentFile("C-02", "Bee", ["src/b/**"]),
      componentFile("C-03", "Paper", ["src/nothing/**"]),
    ],
    ["src/a/one.ts", "src/b/two.ts"],
  );
  const attribution = attributeChurn(derived, [
    entry("src/a/one.ts", 40),
    entry("src/b/two.ts", 10),
  ]);
  const of = (id: string) => derived.components.find((c) => c.id === id);

  it("the hottest bar is one step darker, and everyone else takes the plain ink", () => {
    const hot = churnVisual(of("C-01")!, attribution);
    expect(hot.display).toBe("bar");
    expect(hot.hottest).toBe(true);
    expect(hot.percent).toBe(100);
    expect(hot.edits).toBe(40);
    expect(hot.barClass).toBe("bg-secondary-foreground");

    const cool = churnVisual(of("C-02")!, attribution);
    expect(cool.hottest).toBe(false);
    expect(cool.percent).toBe(25);
    expect(cool.barClass).toBe("bg-muted-foreground");
  });

  it("NEVER amber, in any state — churn is not a judgement", () => {
    for (const id of ["C-01", "C-02", "C-03"]) {
      const visual = churnVisual(of(id)!, attribution);
      expect(visual.barClass).not.toContain("warning");
      expect(visual.barClass).not.toContain("status-");
    }
  });

  it("declared-only shows an em dash, not a zero-width bar", () => {
    const paper = churnVisual(of("C-03")!, attribution);
    expect(paper.display).toBe("dash");
    expect(paper.percent).toBe(0);
    expect(paper.edits).toBeUndefined();
  });

  it("a component that exists and has NOT moved reads zero, which is not the same thing", () => {
    const quiet = churnVisual(of("C-02")!, attributeChurn(derived, [entry("src/a/one.ts", 3)]));
    expect(quiet.display).toBe("zero");
    expect(quiet.edits).toBe(0);
    expect(quiet.percent).toBe(0);
  });
});

describe("churnFooter and churnAge", () => {
  const derived = fixture([componentFile("C-01", "Ay", ["src/a/**"])], ["src/a/one.ts"]);
  const attribution = attributeChurn(derived, [entry("src/a/one.ts", 6)]);

  it("states the window, what was walked, and every degradation", () => {
    expect(churnFooter(30, 214, attribution, { truncated: false, rejected: 0 })).toBe(
      "30d · 214 commits · 6 edits in the busiest component",
    );
    expect(
      churnFooter(
        30,
        1,
        attributeChurn(derived, [entry("src/a/one.ts", 6), entry("README.md", 2)]),
        { truncated: true, rejected: 1 },
      ),
    ).toBe(
      "30d · 1 commit · 6 edits in the busiest component · 2 outside every component · 1 entry refused · truncated — this is a floor",
    );
  });

  it("says unknown rather than inventing a recency", () => {
    const now = 1_800_000_000_000;
    expect(churnAge(0, now)).toBe("unknown");
    expect(churnAge(now - 5 * 60_000, now)).toBe("5m ago");
    expect(churnAge(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(churnAge(now - 4 * 86_400_000, now)).toBe("4d ago");
  });
});
