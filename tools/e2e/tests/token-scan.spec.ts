import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  CONTROL_PATTERN,
  CORPORA,
  TOKEN_EXCLUDED_FILES,
  corpus,
  scanControlSource,
} from "../scripts/token-scan.mjs";

const wrapper = path.join(repoRoot, "tools", "e2e", "scripts", "lint-tokens.mjs");

const sha256 = (raw: Buffer): string => createHash("sha256").update(raw).digest("hex");

test("token-scan is side-effect-free on direct import", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'await import("./scripts/token-scan.mjs"); process.stdout.write("imported");',
    ],
    { cwd: path.join(repoRoot, "tools", "e2e"), encoding: "utf8" },
  );

  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("imported");
  expect(result.stderr).toBe("");
});

test("P5 rejects every disallowed C0 byte and DEL while allowing tab, LF and CR", () => {
  const raw = Buffer.from([...Array.from({ length: 32 }, (_, byte) => byte), 0x7f]);
  const hits = scanControlSource(raw);
  const allowed = new Set([0x09, 0x0a, 0x0d]);
  const expectedBytes = Array.from({ length: 32 }, (_, byte) => byte).filter(
    (byte) => !allowed.has(byte),
  );
  const expectedOffsets = [...expectedBytes, 32];

  expect(hits.map((hit) => hit.offset)).toEqual(expectedOffsets);
  expect(hits.map((hit) => hit.codepoint)).toEqual(
    [...expectedBytes, 0x7f].map(
      (byte) => `U+${byte.toString(16).toUpperCase().padStart(4, "0")}`,
    ),
  );
  expect(new Set(hits.map((hit) => hit.id))).toEqual(new Set([CONTROL_PATTERN.id]));
});

test("P5 offsets are bytes, including after a non-ASCII prefix", () => {
  const prefix = "three bytes: 猫 ";
  const prefixBytes = Buffer.from(prefix, "utf8");
  const raw = Buffer.concat([prefixBytes, Buffer.from([0x1b])]);
  const [hit] = scanControlSource(raw);

  expect(prefixBytes.length).toBeGreaterThan(prefix.length);
  expect(hit).toMatchObject({ id: "P5", codepoint: "U+001B", offset: prefixBytes.length });
});

test("TOKEN and CONTROL are explicit, disjoint policies over the same tree", () => {
  const tokenFiles = corpus(CORPORA.TOKEN);
  const controlFiles = corpus(CORPORA.CONTROL);

  expect(tokenFiles.length).toBeGreaterThan(0);
  expect(controlFiles.length).toBeGreaterThan(tokenFiles.length);
  for (const excluded of TOKEN_EXCLUDED_FILES) {
    expect(tokenFiles, `${excluded} must implement TOKEN without scanning itself`).not.toContain(excluded);
    expect(controlFiles, `${excluded} is tracked text and must stay CONTROL-covered`).toContain(excluded);
  }
  expect(tokenFiles.some((file) => file.startsWith("docs/"))).toBe(false);
  expect(controlFiles.some((file) => file.startsWith("docs/"))).toBe(true);
  expect(controlFiles).toContain("lib/parser/src/index.ts");
});

test("one runtime-built control byte reds all seven first-party roots at exact byte offsets", () => {
  const targets = [
    "app/package.json",
    "docs/NORTH_STAR.md",
    "lib/parser/package.json",
    "tools/e2e/package.json",
    "method/README.md",
    "AGENTS.md",
    ".github/workflows/ci.yml",
  ];
  const originals = new Map(
    targets.map((relative) => [relative, readFileSync(path.join(repoRoot, relative))] as const),
  );
  const hashes = new Map([...originals].map(([relative, raw]) => [relative, sha256(raw)] as const));
  const prefix = Buffer.from("\nT-058 runtime plant é ", "utf8");
  const poison = Buffer.from([0x00]);
  const offsets = new Map<string, number>();
  let result: { status: number | null; stdout: string; stderr: string } | undefined;

  try {
    for (const [relative, original] of originals) {
      offsets.set(relative, original.length + prefix.length);
      writeFileSync(path.join(repoRoot, relative), Buffer.concat([original, prefix, poison]));
    }
    const planted = spawnSync(process.execPath, [wrapper], { cwd: repoRoot, encoding: "utf8" });
    result = {
      status: planted.status,
      stdout: planted.stdout ?? "",
      stderr: planted.stderr ?? "",
    };
  } finally {
    for (const [relative, original] of originals) {
      writeFileSync(path.join(repoRoot, relative), original);
    }
  }

  for (const [relative, expectedHash] of hashes) {
    expect(sha256(readFileSync(path.join(repoRoot, relative))), `${relative} restored byte-exact`).toBe(
      expectedHash,
    );
  }
  const diff = spawnSync("git", ["diff", "--quiet", "--", ...targets], { cwd: repoRoot });
  expect(diff.status, "all seven plant targets restore to an empty diff").toBe(0);

  expect(result).toBeDefined();
  expect(result!.status, result!.stderr).toBe(1);
  expect(result!.stdout.match(/\[P5:/g)).toHaveLength(7);
  for (const relative of targets) {
    expect(result!.stdout).toContain(`${relative}:byte ${offsets.get(relative)}: U+0000`);
  }
  expect(result!.stderr).toContain("(0 TOKEN, 7 CONTROL)");
});
