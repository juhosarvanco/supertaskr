/** Entry identity, shared by configured executable modules. Modern Node's
 * own main flag handles aliases and imports without filesystem probing. */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
/** @param {ImportMeta} meta */
export function isMain(meta) {
  const main = /** @type {ImportMeta & {main?:boolean}} */ (meta).main;
  if (typeof main === "boolean") return main;
  // Compatibility for older runtimes; stdin/eval imports are never entries.
  if (!process.argv[1] || process.argv[1] === "-") return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(meta.url)); }
  catch { return false; }
}
