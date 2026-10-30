/** Read-only installed workspace inspection. Association checks live in the
 * canonical resolver; this front adds only argument and exact-revision bounds.
 */
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { measureProductIdentity, resolveWorkspace } from "./workspace.mjs";

const HELP = "supertaskr workspace [--root PRODUCT] [--product-only] [--at FULL_COMMIT]\n" +
  "Print the selected PRODUCT, RECORDS and runtime locations as JSON. Read-only; association grants no write authority.\n";
class WorkspaceCommandFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(code); this.code = code; }
}
/** @param {string[]} args */
function parse(args) {
  let productRoot = process.cwd(), mode = "development", commit;
  const seen = new Set();
  for (let at = 0; at < args.length; at += 1) {
    const flag = args[at];
    if (!flag || seen.has(flag)) throw new WorkspaceCommandFinding("workspace-command-usage");
    seen.add(flag);
    if (flag === "--product-only") { mode = "product-only"; continue; }
    if (flag !== "--root" && flag !== "--at") throw new WorkspaceCommandFinding("workspace-command-usage");
    const value = args[++at];
    if (!value || value.startsWith("--") || value.includes("\0")) throw new WorkspaceCommandFinding("workspace-command-usage");
    if (flag === "--root") productRoot = path.resolve(value);
    else {
      if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value)) throw new WorkspaceCommandFinding("workspace-command-exact-commit");
      commit = value;
    }
  }
  return { productRoot, mode, commit };
}

/** No current-HEAD substitution for an explicitly selected revision. The
 * product-only view still does not inspect RECORDS, even when it is unavailable.
 * @param {string[]} args */
export function inspectWorkspace(args) {
  const options = parse(args);
  if (options.commit !== undefined) {
    const identity = measureProductIdentity(options.productRoot, { commit: options.commit });
    if (identity.selectedCommit !== options.commit) throw new WorkspaceCommandFinding("workspace-command-exact-commit");
  }
  return resolveWorkspace({ productRoot: options.productRoot, mode: options.mode,
    ...(options.commit === undefined ? {} : { commit: options.commit }) });
}

/** @param {string[]} args
 * @param {{out:(text:string)=>unknown,err:(text:string)=>unknown}} [io] */
export function workspaceMain(args, io = { out: text => process.stdout.write(text), err: text => process.stderr.write(text) }) {
  if (args.length === 1 && args[0] === "--help") { io.out(HELP); return 0; }
  try { io.out(JSON.stringify(inspectWorkspace(args), null, 2) + "\n"); return 0; }
  catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code : "workspace-unavailable";
    io.err(`${code}: workspace inspection unavailable.\n`);
    if (error instanceof WorkspaceCommandFinding) { io.err(HELP); return 2; }
    return 3;
  }
}
function isEntry() {
  const entry = process.argv[1];
  try { return entry !== undefined && entry !== "" && realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isEntry()) {
  process.exitCode = workspaceMain(process.argv.slice(2));
}
