import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { prepareGenesisInitialization } from "../scripts/genesis-init-plan.mjs";
import { validProjectInitRequest } from "../scripts/project-init-record.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { SOURCE, FIXTURE_ENV } from "./private-record-fixture";
import { RUNTIME_DIR_IGNORE } from "../../../cli/lane-fence.mjs";
import { genesisFixture as fixture, genesisInput as input, withGenesisIdentity as withIdentity } from "./genesis-init-fixture";
const text = (file: { base64: string }) => Buffer.from(file.base64, "base64").toString("utf8");

test("complete setup planning uses the actual verified kit and canonical seed while both selected roots stay untouched", () => {
  const f = fixture();
  try {
    const planned = withIdentity(() => prepareGenesisInitialization(input(f))), request = planned.request;
    expect(validProjectInitRequest(request)).toBe(true); expect(Object.isFrozen(request)).toBe(true);
    expect(request.plans.product.files.map((file: any) => file.path).sort()).toEqual([".gitignore", "AGENTS.md", "CLAUDE.md", "supertaskr.yaml"].sort());
    expect(planned.settings).toMatchObject({ languages: [], suites: [], smoke: null, guard_class: {}, bands: [], names: null,
      records: { validation: GENERIC_RECORD_PROFILE } });
    expect(planned.settingsProvenance.kind).toBe("seed");
    expect(request.plans.records.identity).toBe(request.plans.product.identity);
    expect(request.plans.product.identity.author.name).toBe(FIXTURE_ENV.GIT_AUTHOR_NAME);
    const association = request.plans.records.files.find((file: any) => file.path === "workspace-association.json");
    expect(JSON.parse(text(association))).toMatchObject({ projectId: "project-fixture", product: { rootCommits: [request.plans.product.commit] } });
    for (const role of ["product", "records"] as const) {
      const commit = Buffer.from(request.plans[role].commitBase64, "base64").toString("utf8");
      expect(commit).not.toMatch(/^parent /m); expect(commit).toContain(`Supertaskr-Initialization: init-plan-fixture/${role}`);
    }
    const binding = request.runtimeWrites.find(file => file.path === ".supertaskr/workspace.json")!;
    expect(JSON.parse(text(binding))).toMatchObject({ productRoot: f.product, recordsRoot: f.records });
    expect(request.runtimeWrites.filter(file => file.path.startsWith(".supertaskr/genesis/kit/"))).toHaveLength(f.methodFiles.length + 1);
    const blank = request.runtimeWrites.find(file => file.path.endsWith("/docs-templates/NORTH_STAR.md"))!;
    expect(text(blank)).toBe(readFileSync(path.join(SOURCE, "method/docs-templates/NORTH_STAR.md"), "utf8"));
    expect(request.runtimeWrites.some(file => file.path.endsWith("/skills/supertaskr-seat/scripts/golden-check.mjs"))).toBe(true);
    expect(planned.installation).toMatchObject({ runtimeKit: "planned", skills: "not-installed", hooks: "not-installed" });
    expect(request.preimages).toHaveLength(request.plans.product.files.length + request.plans.records.files.length + request.runtimeWrites.length);
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("new-only planning refuses foreign contents, overlapping roots and request-supplied policy before managed effects", () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.product, "foreign.txt"), "preserve foreign bytes\n");
    expect(() => withIdentity(() => prepareGenesisInitialization(input(f)))).toThrow("PROJECT_INIT_PREIMAGE_CHANGED");
    expect(readFileSync(path.join(f.product, "foreign.txt"), "utf8")).toBe("preserve foreign bytes\n");
    rmSync(path.join(f.product, "foreign.txt")); const nested = path.join(f.product, "nested"); mkdirSync(nested);
    expect(() => withIdentity(() => prepareGenesisInitialization({ ...input(f), recordsRoot: nested }))).toThrow("genesis-roots-overlap");
    expect(() => prepareGenesisInitialization({ ...input(f), manifestPath: "/unselected" } as any)).toThrow("genesis-init-request");
    expect(() => prepareGenesisInitialization({ ...input(f), tool: structuredClone(f.toolHandle) })).toThrow("records-tool-context-required");
    expect(existsSync(path.join(f.product, ".git"))).toBe(false); expect(existsSync(path.join(f.records, ".git"))).toBe(false);
    expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("an unlisted required method asset never falls back to the live checkout", () => {
  const f = fixture("method/adapters/AGENTS.md");
  try {
    expect(existsSync(path.join(SOURCE, "method/adapters/AGENTS.md"))).toBe(true);
    expect(() => withIdentity(() => prepareGenesisInitialization(input(f)))).toThrow("genesis-method-member-required");
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("case aliases of one physical directory cannot become independent setup roots", () => {
  const f = fixture();
  try {
    const alias = path.join(f.dir, "NEW-CODE  ");
    test.skip(!existsSync(alias), "the current filesystem has distinct case-sensitive names");
    expect(statSync(alias).dev).toBe(statSync(f.product).dev);
    expect(statSync(alias).ino).toBe(statSync(f.product).ino);
    expect(() => withIdentity(() => prepareGenesisInitialization({ ...input(f), recordsRoot: alias }))).toThrow("genesis-roots-same-directory");
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("planning reuses the core fresh-root rule for canonical zero-effect leftovers", () => {
  const f = fixture();
  try {
    const runtime = path.join(f.product, ".supertaskr"), ignore = path.join(runtime, ".gitignore");
    mkdirSync(path.join(runtime, "runs/reservations"), { recursive: true }); writeFileSync(ignore, RUNTIME_DIR_IGNORE);
    const previousInode = statSync(ignore).ino;
    expect(withIdentity(() => prepareGenesisInitialization(input(f))).request.roots.product.path).toBe(f.product);
    expect(readFileSync(ignore, "utf8")).toBe(RUNTIME_DIR_IGNORE); expect(statSync(ignore).ino).toBe(previousInode);
    expect(readdirSync(f.product)).toEqual([".supertaskr"]); expect(readdirSync(f.records)).toEqual([]);
    expect(readdirSync(path.join(runtime, "runs"))).toEqual(["reservations"]);
    expect(readdirSync(path.join(runtime, "runs/reservations"))).toEqual([]);
  } finally { f.cleanup(); }
});
