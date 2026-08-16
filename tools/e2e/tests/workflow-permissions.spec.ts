import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { repoRoot } from "../preflight";

/**
 * GITHUB_TOKEN least privilege, over EVERY workflow file (T-036,
 * generalised by T-045 criterion 3).
 *
 * T-036 declared `permissions: contents: read` in ci.yml and pinned it —
 * against the hard-coded path `.github/workflows/ci.yml`. That is a rule
 * about a FILE where the discipline is about a REPOSITORY: the second
 * workflow anyone adds (release.yml, a docs job, a stale-issue bot) would
 * inherit the repository's default workflow-permission setting again — a
 * checkbox in a web UI, not a fact in this repo — with nothing failing.
 * This spec therefore enumerates `.github/workflows/*.yml` + `*.yaml` and
 * applies the three assertions to each: the block EXISTS, it is exactly
 * `{contents: read}` unless the exception table argues otherwise, and no
 * job or step widens it.
 *
 * The facts about the ONE CI JOB — commands, order, SHA pins, apt set,
 * boot step — stay in workflow-parity.spec.ts. The split is between
 * "rules every workflow obeys" and "facts about the one job we have".
 *
 * ZERO ALLOWLIST IS NOT THE TARGET HERE; "no unargued grant" is. A
 * release job that genuinely needs `contents: write` should be able to
 * have it — argued in the workflow AND in EXCEPTIONS below, where a
 * reader sees scope, file and reason together. What must never happen is
 * a grant nobody wrote a reason for. The table is empty today, and an
 * entry that stops matching a real grant fails too: an argument for a
 * permission nothing asks for is stale, and stale arguments are how
 * allowlists rot into wallpaper.
 */

/** The least-privilege default every workflow gets for free. */
const LEAST_PRIVILEGE: Record<string, string> = { contents: "read" };

/**
 * The exception table (T-045 criterion 4): one row per grant that exceeds
 * the default, carrying WHERE it is allowed, WHAT it grants and WHY.
 *
 * EMPTY TODAY — the one workflow checks out, installs, builds, runs three
 * suites, lints, audits, runs the E2E lane and boots under xvfb; it writes
 * nothing back, opens no PR and uploads nothing. Adding a row is the
 * deliberate act: it makes the grant legible to a reviewer reading the
 * test, not only to one reading the YAML.
 */
interface Exception {
  /** File name inside .github/workflows/, e.g. "release.yml". */
  file: string;
  /** Dotted path of the `permissions:` block, e.g. "jobs.release.permissions". */
  at: string;
  /** The scope granted, e.g. "contents". */
  scope: string;
  /** The level granted, e.g. "write". */
  level: string;
  /** Why this job cannot do its work with `contents: read`. */
  reason: string;
}

const EXCEPTIONS: Exception[] = [];

interface WorkflowFile {
  name: string;
  text: string;
}

/**
 * Every `permissions:` declaration in a parsed document, with its dotted
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
 * Everything a `permissions:` value grants beyond `{contents: read}`, as
 * `{scope, level}` pairs. Empty means "not wider" — `{}` (narrower) and a
 * redundant `{contents: read}` both pass; `contents: write`, any second
 * scope (`packages: write`), and the `read-all`/`write-all` shorthands do
 * not. A shorthand grants everything, so it is reported as the pseudo-
 * scope `*` and can only be argued as such.
 */
function widenings(value: unknown): { scope: string; level: string }[] {
  if (value === null || typeof value !== "object") {
    return [{ scope: "*", level: String(value) }];
  }
  return Object.entries(value as Record<string, unknown>)
    .filter(([scope, level]) => LEAST_PRIVILEGE[scope] !== level)
    .map(([scope, level]) => ({ scope, level: String(level) }));
}

/**
 * The three least-privilege rules, over a whole set of workflow files.
 * Returns one complaint string per violation, each NAMING the file (a
 * complaint that does not say which workflow is useless the moment there
 * are two). Pure, so the fixtures below can feed it workflows that do not
 * exist on disk.
 */
export function auditPermissions(files: WorkflowFile[], exceptions: Exception[]): string[] {
  const complaints: string[] = [];
  if (files.length === 0) {
    return [
      "no workflow files found under .github/workflows/ — these rules are " +
        "vacuous, which is never the intended reading of a green run",
    ];
  }
  /** Exception rows that matched a real grant; the rest are stale. */
  const used = new Set<Exception>();

  for (const { name, text } of files) {
    let doc: Record<string, unknown>;
    try {
      doc = parse(text) as Record<string, unknown>;
    } catch (err) {
      complaints.push(`${name}: not valid YAML (${String(err).split("\n")[0]})`);
      continue;
    }

    // 1. The block EXISTS. Without it the token's scope is whatever the
    //    repository's default workflow-permission setting says.
    if (doc.permissions === undefined) {
      complaints.push(
        `${name}: no top-level \`permissions:\` block — GITHUB_TOKEN would ` +
          "silently inherit the repository's default workflow-permission " +
          "setting instead of being a fact in this repo. Declare " +
          "`permissions: {contents: read}` under `name:` (T-036).",
      );
    }

    // 2 + 3. Nothing — top level, job or step — grants beyond the default
    //        without a row in the exception table saying why.
    for (const { at, value } of collectPermissions(doc, "", [])) {
      for (const { scope, level } of widenings(value)) {
        const argued = exceptions.find(
          (e) => e.file === name && e.at === at && e.scope === scope && e.level === level,
        );
        if (argued === undefined) {
          complaints.push(
            `${name}: ${at} grants \`${scope}: ${level}\` beyond the ` +
              "least-privilege default `{contents: read}`, and no exception " +
              "row argues it. If the grant is genuinely needed, add it at THAT " +
              "job's scope with its reason beside it in the workflow, and add a " +
              "row (file, at, scope, level, reason) to EXCEPTIONS in " +
              "tools/e2e/tests/workflow-permissions.spec.ts — never by widening " +
              "a workflow default, which hands the scope to every job in the file.",
          );
        } else {
          used.add(argued);
        }
      }
    }
  }

  // 4. No stale arguments. An exception row that matches nothing is an
  //    argument for a permission nothing asks for — remove the row, or
  //    restore the grant it was written for.
  for (const e of exceptions) {
    if (!used.has(e)) {
      complaints.push(
        `the exception table argues \`${e.scope}: ${e.level}\` at ${e.at} in ` +
          `${e.file} ("${e.reason}"), but no such grant exists — remove the row ` +
          "so the table keeps meaning what it says.",
      );
    }
  }
  return complaints;
}

/** Every workflow file GitHub would load: `*.yml` and `*.yaml`, sorted. */
export function workflowFiles(): WorkflowFile[] {
  const dir = path.join(repoRoot, ".github", "workflows");
  return readdirSync(dir)
    .filter((n) => n.endsWith(".yml") || n.endsWith(".yaml"))
    .sort()
    .map((name) => ({ name, text: readFileSync(path.join(dir, name), "utf8") }));
}

// ── the live rules ─────────────────────────────────────────────────────

test("every workflow file is enumerated — the glob is not vacuous", () => {
  const files = workflowFiles();
  expect(
    files.map((f) => f.name),
    "at least ci.yml must be found; an empty enumeration would make every " +
      "rule below pass by having nothing to judge",
  ).toContain("ci.yml");
  for (const { name, text } of files) {
    expect(parse(text), `${name} must parse as YAML`).toBeTruthy();
  }
});

test("every workflow declares least privilege, and no grant is unargued", () => {
  expect(
    auditPermissions(workflowFiles(), EXCEPTIONS),
    "GITHUB_TOKEN least privilege over .github/workflows/*.y{a,}ml — a " +
      "complaint here is the conversation, not an obstacle to route around",
  ).toEqual([]);
});

// ── fixtures: each rule actually fires, and names the file ─────────────
//
// The rules run over files on disk, and the file that would break them
// does not exist — adding a real second workflow to prove a test works is
// how a dormant CI job acquires a live one. So the judge is a pure
// function and the second workflow is synthetic: the rule under test is
// the same code path the live run above uses.

const CI_LIKE = "name: ci\npermissions:\n  contents: read\njobs:\n  linux:\n    steps: []\n";

test("FIXTURE: a second workflow with no `permissions:` block fails, NAMING the file", () => {
  const complaints = auditPermissions(
    [
      { name: "ci.yml", text: CI_LIKE },
      { name: "release.yml", text: "name: release\njobs:\n  publish:\n    steps: []\n" },
    ],
    EXCEPTIONS,
  );
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("release.yml: no top-level `permissions:` block");
  expect(complaints[0]).toContain("repository's default workflow-permission");
  // ci.yml, which is fine, is not implicated in the complaint.
  expect(complaints[0]!.startsWith("ci.yml")).toBe(false);
});

test("FIXTURE: `.yaml` files are judged too, not only `.yml`", () => {
  const complaints = auditPermissions(
    [
      { name: "ci.yml", text: CI_LIKE },
      { name: "docs.yaml", text: "name: docs\njobs:\n  build:\n    steps: []\n" },
    ],
    EXCEPTIONS,
  );
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("docs.yaml: no top-level `permissions:` block");
});

test("FIXTURE: a job- or step-level widening fails, naming file, path and grant", () => {
  const jobLevel = auditPermissions(
    [
      {
        name: "release.yml",
        text:
          "name: release\npermissions:\n  contents: read\njobs:\n  publish:\n" +
          "    permissions:\n      contents: read\n      packages: write\n    steps: []\n",
      },
    ],
    EXCEPTIONS,
  );
  expect(jobLevel).toHaveLength(1);
  expect(jobLevel[0]).toContain(
    "release.yml: jobs.publish.permissions grants `packages: write`",
  );

  // A step-level key Actions would not even honour still fails, rather
  // than passing unread.
  const stepLevel = auditPermissions(
    [
      {
        name: "ci.yml",
        text:
          "name: ci\npermissions:\n  contents: read\njobs:\n  linux:\n    steps:\n" +
          "      - run: echo hi\n        permissions:\n          id-token: write\n",
      },
    ],
    EXCEPTIONS,
  );
  expect(stepLevel).toHaveLength(1);
  expect(stepLevel[0]).toContain("ci.yml: jobs.linux.steps[0].permissions grants `id-token: write`");
});

test("FIXTURE: the `write-all` shorthand fails as a whole-token grant", () => {
  const complaints = auditPermissions(
    [{ name: "ci.yml", text: "name: ci\npermissions: write-all\njobs:\n  linux:\n    steps: []\n" }],
    EXCEPTIONS,
  );
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("ci.yml: permissions grants `*: write-all`");
});

test("FIXTURE: a redundant `contents: read` and an empty block are not widenings", () => {
  const complaints = auditPermissions(
    [
      {
        name: "ci.yml",
        text:
          "name: ci\npermissions:\n  contents: read\njobs:\n  linux:\n" +
          "    permissions:\n      contents: read\n    steps: []\n  other:\n" +
          "    permissions: {}\n    steps: []\n",
      },
    ],
    EXCEPTIONS,
  );
  expect(complaints).toEqual([]);
});

test("FIXTURE: an exception row argues a grant — and a stale row is itself a failure", () => {
  const release = {
    name: "release.yml",
    text:
      "name: release\npermissions:\n  contents: read\njobs:\n  publish:\n" +
      "    permissions:\n      contents: write\n    steps: []\n",
  };
  const argued: Exception = {
    file: "release.yml",
    at: "jobs.publish.permissions",
    scope: "contents",
    level: "write",
    reason: "the release job creates a GitHub release and uploads the bundle to it.",
  };

  // Unargued: it fails, naming the grant.
  expect(auditPermissions([release], [])).toHaveLength(1);
  // Argued at exactly that file, path, scope and level: it passes.
  expect(auditPermissions([release], [argued])).toEqual([]);
  // Argued for a DIFFERENT file: the row does not transfer, and the now
  // unmatched row is reported as stale as well.
  const wrongFile = auditPermissions([release], [{ ...argued, file: "other.yml" }]);
  expect(wrongFile).toHaveLength(2);
  expect(wrongFile.join("\n")).toContain("release.yml: jobs.publish.permissions grants");
  expect(wrongFile.join("\n")).toContain("no such grant exists");
  // The grant removed but the argument left behind: stale, and reported.
  const stale = auditPermissions([{ name: "release.yml", text: CI_LIKE }], [argued]);
  expect(stale).toHaveLength(1);
  expect(stale[0]).toContain("but no such grant exists");
});

test("FIXTURE: an empty enumeration is a failure, never a green run", () => {
  const complaints = auditPermissions([], EXCEPTIONS);
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("no workflow files found");
});
