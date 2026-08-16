import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { repoRoot } from "../preflight";

/**
 * Workflow parity (T-020 plan §4.7) — no browser: the dormant
 * .github/workflows/ci.yml cannot execute before the repo's first
 * GitHub push (no remote exists), so THIS spec is its machine
 * validation: valid YAML, every CONVENTIONS suite command present as a
 * step verbatim and in the plan-§7 order, every `uses:` pinned by full
 * commit SHA, the GITHUB_TOKEN scope (T-036 — `contents: read` and
 * nothing wider, anywhere), and the boot step invoking
 * tauri-boot-check.mjs under xvfb-run. The workflow stays a thin
 * invoker of the same commands CONVENTIONS documents — one source of
 * truth, drift caught here.
 */

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  "working-directory"?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
}

/**
 * The expected (working-directory, run) commands, in order — the
 * per-package suite commands of docs/CONVENTIONS.md "Build & test"
 * (plus this task's tools/e2e additions, drafted there at integration),
 * exactly as plan §7 sequences them: token lint -> parser -> app ->
 * cargo test -> cargo audit -> e2e -> xvfb boot.
 */
const EXPECTED_COMMANDS: { dir: string | undefined; run: string }[] = [
  { dir: "tools/e2e", run: "node scripts/lint-tokens.mjs --selftest" },
  { dir: "tools/e2e", run: "node scripts/lint-tokens.mjs" },
  { dir: "lib/parser", run: "npm ci" },
  { dir: "lib/parser", run: "npx vitest run" },
  { dir: "lib/parser", run: "npx tsc --noEmit" },
  { dir: "lib/parser", run: "npm run build" },
  { dir: "app", run: "npm ci" },
  { dir: "app", run: "npm run build" },
  { dir: "app", run: "npm test" },
  { dir: "app/src-tauri", run: "cargo test" },
  { dir: "app/src-tauri", run: "cargo install cargo-audit --locked" },
  { dir: "app/src-tauri", run: "cargo audit" },
  { dir: "tools/e2e", run: "npm ci" },
  { dir: "tools/e2e", run: "npx playwright install --with-deps chromium" },
  { dir: "tools/e2e", run: "npm test" },
  { dir: undefined, run: "xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs" },
];

/** Tauri v2 Linux prerequisites the apt step must install. */
const APT_PACKAGES = [
  "libwebkit2gtk-4.1-dev",
  "build-essential",
  "libxdo-dev",
  "libssl-dev",
  "libayatana-appindicator3-dev",
  "librsvg2-dev",
  "xvfb",
];

/**
 * The workflow's whole GITHUB_TOKEN grant (T-036): the top level
 * declares exactly this, and nothing may exceed it.
 */
const LEAST_PRIVILEGE: Record<string, string> = { contents: "read" };

/**
 * Every `permissions:` declaration in the document, with its dotted
 * path — top level, any job, any step. Actions honours only the first
 * two, but a step-level key is collected as well so a grant written
 * anywhere fails this spec instead of passing unread.
 */
function collectPermissions(
  node: unknown,
  at: string,
  into: { at: string; value: unknown }[],
): { at: string; value: unknown }[] {
  if (node === null || typeof node !== "object") return into;
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectPermissions(item, `${at}[${i}]`, into));
    return into;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const here = at === "" ? key : `${at}.${key}`;
    // Don't recurse INTO a permissions block: its children are scope
    // names, and the block itself is what gets judged.
    if (key === "permissions") into.push({ at: here, value });
    else collectPermissions(value, here, into);
  }
  return into;
}

/**
 * Everything a `permissions:` value grants beyond `{ contents: read }`,
 * rendered `scope: level`. Empty means "not wider" — `{}` (narrower)
 * and a redundant `{ contents: read }` both pass; `contents: write`,
 * any second scope (`packages: write`), and the `read-all`/`write-all`
 * shorthands do not.
 */
function widenings(value: unknown): string[] {
  if (value === null || typeof value !== "object") {
    return [`the whole-token shorthand \`${String(value)}\``];
  }
  return Object.entries(value as Record<string, unknown>)
    .filter(([scope, level]) => LEAST_PRIVILEGE[scope] !== level)
    .map(([scope, level]) => `${scope}: ${String(level)}`);
}

function loadWorkflow(): { raw: string; doc: Record<string, unknown>; steps: WorkflowStep[] } {
  const file = path.join(repoRoot, ".github", "workflows", "ci.yml");
  const raw = readFileSync(file, "utf8");
  const doc = parse(raw) as Record<string, unknown>;
  const jobs = doc.jobs as Record<string, { steps: WorkflowStep[] }>;
  const jobNames = Object.keys(jobs);
  expect(jobNames, "one ubuntu job (plan §7)").toEqual(["linux"]);
  return { raw, doc, steps: jobs.linux!.steps };
}

test("ci.yml is valid YAML with the one pinned ubuntu job", () => {
  const { doc, steps } = loadWorkflow();

  // `on:` parses as YAML true — normalize.
  const on = (doc.on ?? doc[true as unknown as string]) as Record<string, unknown>;
  expect(Object.keys(on).sort()).toEqual(["pull_request", "push", "workflow_dispatch"]);
  expect((on.push as { branches: string[] }).branches).toEqual(["main"]);

  const concurrency = doc.concurrency as { group: string; "cancel-in-progress": boolean };
  expect(concurrency.group).toContain("${{ github.ref }}");
  expect(concurrency["cancel-in-progress"]).toBe(true);

  const job = (doc.jobs as Record<string, Record<string, unknown>>).linux!;
  expect(job["runs-on"], "pinned runner, not -latest").toBe("ubuntu-24.04");
  expect(job["timeout-minutes"]).toBe(45);
  expect(steps.length).toBeGreaterThan(0);
});

test("GITHUB_TOKEN is least-privilege: `contents: read`, and nothing widens it", () => {
  const { doc } = loadWorkflow();

  // 1. The block EXISTS. Without it the token's scope is whatever the
  //    repository's default workflow-permission setting says — a
  //    web-UI checkbox, not a fact in this repo (T-036).
  expect(
    doc.permissions,
    "ci.yml declares no top-level `permissions:` block — GITHUB_TOKEN would silently inherit the repository's default workflow-permission setting instead of being a fact in this repo",
  ).toBeDefined();

  // 2. It is EXACTLY `contents: read` — this job reads the repo and
  //    writes nothing back.
  expect(
    doc.permissions,
    "the top-level `permissions:` block must be exactly { contents: read }",
  ).toEqual(LEAST_PRIVILEGE);

  // 3. NOTHING anywhere widens it — a job or step granting
  //    `contents: write`, a second scope like `packages: write`, or a
  //    `write-all` shorthand fails here, naming what it grants and
  //    where. The rule (stated in ci.yml at the point of temptation) is
  //    that a genuine need is granted at THAT JOB's scope with its
  //    reason beside it; this assertion makes such a grant a deliberate,
  //    argued edit to both files rather than a silent one.
  const wider = collectPermissions(doc, "", []).flatMap(({ at, value }) =>
    widenings(value).map((grant) => `${at} grants ${grant}`),
  );
  expect(
    wider,
    "a `permissions:` declaration exceeds the workflow's least-privilege default (contents: read) — if the grant is genuinely needed, argue it at that job's scope in ci.yml and update this spec deliberately",
  ).toEqual([]);
});

test("every CONVENTIONS suite command is a step, verbatim and in plan-§7 order", () => {
  const { steps } = loadWorkflow();
  const runSteps = steps
    .filter((s) => s.run !== undefined)
    .map((s) => ({ dir: s["working-directory"], run: s.run! }));

  // Every expected command appears verbatim as its own step...
  for (const want of EXPECTED_COMMANDS) {
    const found = runSteps.some((s) => s.dir === want.dir && s.run === want.run);
    expect
      .soft(found, `missing verbatim step: [${want.dir ?? "(root)"}] ${want.run}`)
      .toBe(true);
  }

  // ...and in the plan-§7 order: filtering the workflow's run steps to
  // the expected set must reproduce the expected sequence exactly.
  const filtered = runSteps.filter((s) =>
    EXPECTED_COMMANDS.some((w) => w.dir === s.dir && w.run === s.run),
  );
  expect(filtered).toEqual(EXPECTED_COMMANDS);
});

test("every `uses:` is pinned by a full 40-hex commit SHA", () => {
  const { steps } = loadWorkflow();
  const uses = steps.filter((s) => s.uses !== undefined).map((s) => s.uses!);
  expect(uses.length).toBeGreaterThanOrEqual(3); // checkout, setup-node, cache x2
  for (const ref of uses) {
    expect(ref, `unpinned action: ${ref}`).toMatch(/^[\w./-]+@[0-9a-f]{40}$/);
  }
});

test("the xvfb boot step runs tauri-boot-check.mjs with the webkit workaround", () => {
  const { steps } = loadWorkflow();
  const boot = steps.find((s) => s.run?.includes("tauri-boot-check.mjs"));
  expect(boot, "boot step present").toBeDefined();
  expect(boot!.run).toBe("xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs");
  expect(boot!.env?.WEBKIT_DISABLE_DMABUF_RENDERER).toBe("1");
  // LAST step — the cargo cache from the test step warms its build.
  expect(steps[steps.length - 1]).toBe(boot);
});

test("the apt step installs the Tauri v2 webkit2gtk set + xvfb", () => {
  const { steps } = loadWorkflow();
  const apt = steps.find((s) => s.run?.includes("apt-get install"));
  expect(apt, "apt step present").toBeDefined();
  for (const pkg of APT_PACKAGES) {
    expect(apt!.run, `apt step must install ${pkg}`).toContain(pkg);
  }
});
