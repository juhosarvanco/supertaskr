// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { parseProjectFromFiles } from "@supertaskr/parser/pure";
import { createExampleProject } from "../../tools/e2e/fixtures/example-project.mjs";
import { MapView } from "../src/architecture/MapView";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const example = createExampleProject(resolve(".."));
const files = ["docs/ROADMAP.md", ...["docs/tasks", "docs/architecture/components"].flatMap(dir =>
  readdirSync(join(example, dir)).filter(name => name.endsWith(".md")).map(name => `${dir}/${name}`))]
  .map(path => ({ path, content: readFileSync(join(example, path), "utf8") }));
const project = parseProjectFromFiles(files);
const paths = ["method/example.ts", "app/src/main.tsx", "lib/parser/src/index.ts", "app/src/components/board/Board.tsx", "app/src/components/detail/Detail.tsx", "app/src/lib/watcher-store.ts", "app/src/styles/tokens.css", "stray/unknown.ts"];
const graphContent = JSON.stringify({
  schema: 1, root: ".", languages: ["ts"],
  files: paths.map(path => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] })),
  packages: [{ id: "p:@example/parser", name: "@example/parser", ecosystem: "npm", path: "lib/parser" }],
  edges: [
    { from: "f:app/src/main.tsx", to: "p:@example/parser", kind: "import" },
    { from: "f:app/src/components/board/Board.tsx", to: "f:app/src/components/detail/Detail.tsx", kind: "import" },
  ], unresolved: [],
});
const parsed = parseGraph(graphContent);
const derive = () => deriveArchitecture({ components: project.components ?? [], tasks: project.tasks, graph: parsed.graph });

describe("an authored project from disk through parser, architecture join and map", () => {
  it("parses the complete representative registry and graph without losing records", () => {
    expect(project.issues).toEqual([]);
    expect(parsed.issues).toEqual([]);
    expect(project.components?.map(c => c.id)).toEqual(["C-01", "C-05", "C-06", "C-08", "C-09", "C-10", "C-11", "C-15"]);
    expect(project.tasks.length).toBe(33);
  });
  it("totally partitions graph files including explicitly unclaimed source", () => {
    const model = derive();
    expect(model.mode).toBe("full");
    expect(model.fileComponent.size).toBe(paths.length);
    expect(model.unmappedFiles).toEqual(["stray/unknown.ts"]);
    expect(model.fileComponent.get("app/src/main.tsx")).toBe("C-05");
    expect(model.fileComponent.get("lib/parser/src/index.ts")).toBe("C-06");
  });
  it("is independent of registry order and deterministic on the same parsed bytes", () => {
    const reversed = deriveArchitecture({ components: [...(project.components ?? [])].reverse(), tasks: project.tasks, graph: parsed.graph });
    expect([...reversed.fileComponent]).toEqual([...derive().fileComponent]);
    expect(reversed.edges).toEqual(derive().edges);
    expect(derive()).toEqual(derive());
  });
  it("materializes the package path seam into the declared parser relation", () => {
    expect(derive().edges.find(e => e.from === "C-05" && e.to === "C-06")).toMatchObject({ relation: "confirmed" });
  });
  it("retains undeclared, unclaimed and declared-only findings by identity", () => {
    const model = derive();
    expect(model.findings.map(f => f.id)).toEqual(expect.arrayContaining(["D1:C-08->C-09", "D2:unmapped", "D3:C-15"]));
    expect(model.components.find(c => c.id === "C-15")).toMatchObject({ declaredOnly: true, fileCount: 0 });
  });
  it("keeps pinned status and a declared component with an empty slug set", () => {
    const model = derive();
    expect(model.components.find(c => c.id === "C-01")).toMatchObject({ status: "done", pinned: true });
    expect(project.components?.find(c => c.id === "C-11")?.touchSlugs).toEqual([]);
    expect(model.components.find(c => c.id === "C-11")?.fileCount).toBe(1);
  });
  it("renders real declared, unmapped, pinned and declared-only faces from the disk fixture", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<MapView model={project} graphContent={graphContent} indexing={false} indexOutcome={null} onRunIndex={() => {}} />));
      expect(host.querySelectorAll('[data-testid="map-node"]')).toHaveLength(9);
      expect(host.querySelector('[data-component-id="C-01"]')?.getAttribute("data-pinned")).toBe("true");
      expect(host.querySelector('[data-component-id="C-15"]')?.textContent).toContain("declared");
      expect(host.querySelector('[data-component-id="unmapped"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="map-degraded"]')).toBeNull();
    } finally { act(() => root.unmount()); host.remove(); }
  });
});
