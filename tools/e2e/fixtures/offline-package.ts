import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/** Install actual tarballs with a new, empty cache. The harness already owns
 * YAML as a declared dependency; packaging those prepared bytes avoids an
 * accidental dependency on registry metadata in the developer's npm cache.
 */
export function installOfflinePackage(input: {
  packageTarball: string;
  packDirectory: string;
  project: string;
  env?: NodeJS.ProcessEnv;
  ignoreScripts?: boolean;
}): void {
  const manifest = JSON.parse(execFileSync("tar", ["-xOf", input.packageTarball, "package/package.json"], { encoding: "utf8" }));
  if (typeof manifest.dependencies?.yaml !== "string" || !manifest.dependencies.yaml.trim()) {
    throw new Error("offline-fixture-yaml-declaration-required");
  }
  const cache = mkdtempSync(path.join(input.packDirectory, "empty-npm-cache-"));
  const env = { ...(input.env ?? process.env), npm_config_cache: cache };
  const yamlRoot = path.dirname(createRequire(import.meta.url).resolve("yaml/package.json"));
  const packed = JSON.parse(execFileSync("npm", [
    "pack", "--offline", "--ignore-scripts", "--json", "--pack-destination", input.packDirectory, yamlRoot,
  ], { cwd: input.packDirectory, encoding: "utf8", env }));
  execFileSync("npm", [
    "install", "--offline", "--no-audit", "--no-fund", "--prefix", input.project,
    ...(input.ignoreScripts ? ["--ignore-scripts"] : []),
    path.join(input.packDirectory, packed[0].filename), input.packageTarball,
  ], { cwd: input.project, encoding: "utf8", env });
}
