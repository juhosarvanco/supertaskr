/**
 * Boot-check port resolution and the `--config` it threads (T-046).
 *
 * WHY THIS IS A SEPARATE MODULE, and must stay one: the lane spec
 * (tests/boot-check-guard.spec.ts) asserts this logic directly, and
 * tauri-boot-check.mjs calls `main()` unconditionally at module scope —
 * importing IT would launch the app. The usual fix, an
 * `import.meta.url === argv[1]` guard, is the wrong trade here: any path
 * mismatch (a symlinked checkout, a wrapper) would turn the merge gate
 * into a silent exit 0. A gate that no-ops quietly is precisely the
 * failure T-046 exists to end (T-040: the regression nobody saw). So the
 * check keeps its unconditional entry point, and the testable part lives
 * here, side-effect free.
 *
 * The two node imports below are the only I/O this module can do, they are
 * DEFAULT ARGUMENTS rather than calls, and nothing here runs at import
 * time — the lane spec imports this file inside a headless worker.
 */
import nodeFs from "node:fs";
import nodePath from "node:path";

/** The env var that moves the boot check off the human's port. */
export const BOOT_PORT_ENV = "SUPERTASKR_BOOT_PORT";

/**
 * The port `tauri dev` uses with the committed config — app/vite.config.ts
 * (`port: 1420, strictPort: true`) and tauri.conf.json's devUrl. It is the
 * human's live app on this machine (CONVENTIONS, PORT RULE).
 */
export const DEFAULT_TAURI_PORT = 1420;

/**
 * A refused configuration: exit 3, deliberately distinct from the three
 * pre-existing exit paths (0 booted / 1 timeout / 2 port busy) so a
 * refusal can never be misread as "the port was busy" or "the app failed
 * to boot".
 */
export const EXIT_REFUSED = 3;

export class BootPortRefusal extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "BootPortRefusal";
  }
}

/**
 * MAY `process.kill(-pgid, …)` be addressed to this process-group id?
 *
 * T-061 puts this predicate HERE, beside the port refusal and away from
 * the script that runs `main()` at module scope, for exactly the reason
 * that split exists: the lane spec can assert it, and the two callers
 * that signal process groups beside a human's live app then share one
 * implementation rather than two chances to disagree (T-057).
 *
 * The two refused values are not hypothetical arithmetic. `kill(-0, …)`
 * is `kill(0, …)` — JavaScript has `-0 === 0` — which POSIX defines as
 * "every process in the CALLER's own group", i.e. this check, its shell
 * and whatever else shares that group. `kill(-1, …)` is the POSIX
 * BROADCAST to every process this user may signal, which on this machine
 * includes the human's `tauri dev` on 1420. Neither can arise from a real
 * spawn; both are one typo away in the code that kills process trees, and
 * the cost of being wrong is not recoverable.
 *
 * @param {unknown} pgid
 * @returns {boolean}
 */
export function isSignalableGroup(pgid) {
  return typeof pgid === "number" && Number.isInteger(pgid) && pgid > 1;
}

/**
 * Resolve the boot port from a raw env value.
 *
 * Unset (or empty) → 1420, `overridden: false`: the check behaves exactly
 * as it did before T-046 — bind-probe 1420, spawn plain `npm run tauri
 * dev`, abort loudly if the human's app holds it.
 *
 * Set to anything else → that port, `overridden: true`: a scratch port
 * the check owns, so it can run BESIDE a live app.
 *
 * Set to 1420 → REFUSES. Same shape as playwright.config.ts's
 * `resolveLanePort` throw, and for the same reason: the override must
 * never become a second way to contend for the human's app. If you want
 * 1420 you get the default path, whose first act is a bind-probe that
 * aborts rather than fighting for it.
 *
 * @param {string | undefined} raw
 * @returns {{ port: number, overridden: boolean }}
 */
export function resolveBootPort(raw) {
  if (raw === undefined || raw === "") {
    return { port: DEFAULT_TAURI_PORT, overridden: false };
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new BootPortRefusal(
      `${BOOT_PORT_ENV}=${JSON.stringify(raw)} is not a valid port number ` +
        "(want an integer 1-65535). Nothing was probed and nothing was spawned.",
    );
  }
  if (port === DEFAULT_TAURI_PORT) {
    throw new BootPortRefusal(
      `${BOOT_PORT_ENV} is ${DEFAULT_TAURI_PORT} — refusing: ${DEFAULT_TAURI_PORT} is ` +
        "the human's live app (app/vite.config.ts, strictPort). This override exists " +
        "so the boot check can run BESIDE that app on a scratch port — it must never " +
        `become a second way to contend for it. Unset ${BOOT_PORT_ENV} to run the ` +
        `default path, which bind-probes ${DEFAULT_TAURI_PORT} and aborts if anything ` +
        "holds it. Nothing was probed and nothing was spawned.",
    );
  }
  return { port, overridden: true };
}

/**
 * Where the committed build config lives, relative to the repository root.
 * Kept as segments so the caller joins it with its own separator.
 */
export const TAURI_CONF_SEGMENTS = ["app", "src-tauri", "tauri.conf.json"];

/**
 * The two committed `build` keys the overlay rewrites.
 *
 * @typedef {{ devUrl: string, beforeDevCommand: string }} CommittedBuild
 */

/**
 * Read the two committed `build` keys out of app/src-tauri/tauri.conf.json.
 *
 * T-061 (absorbing T-046-s4): the overlay used to EMIT both keys from
 * nothing, so the committed ones were not merely un-asserted — they were
 * DISCARDED, and the gate reported green with `devUrl` pointed at a dead
 * port or `beforeDevCommand` pointed at a script that does not exist.
 * Deriving from the committed values keeps them load-bearing.
 *
 * A committed config this function cannot read is a REFUSAL, never a
 * fallback, and the reason is the whole point of the override: the only
 * safe default port is the committed one, and on this repository the
 * committed one is 1420 — the human's live app. A boot check that
 * silently fell back to "no overlay" would boot on it. So: refuse, exit
 * `EXIT_REFUSED`, having probed nothing and spawned nothing.
 *
 * @param {string} repoRoot absolute path to the repository root
 * @param {{ readFileSync: (p: string, enc: "utf8") => string }} [fs]
 *        injectable for tests; defaults to node:fs
 * @param {(...parts: string[]) => string} [join] defaults to node:path.join
 * @returns {CommittedBuild}
 */
export function readCommittedBuildConfig(repoRoot, fs = nodeFs, join = nodePath.join) {
  const file = join(repoRoot, ...TAURI_CONF_SEGMENTS);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    throw new BootPortRefusal(
      `cannot read the committed build config at ${file} (${String(err)}). The ` +
        "scratch-port overlay is DERIVED from it, and there is no safe fallback: " +
        `the committed devUrl is what the check would otherwise boot on, and on ` +
        `this repository that is ${DEFAULT_TAURI_PORT}. Nothing was probed and ` +
        "nothing was spawned.",
    );
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new BootPortRefusal(
      `${file} is not valid JSON (${String(err)}). The scratch-port overlay is ` +
        "DERIVED from it and cannot be built. Nothing was probed and nothing was spawned.",
    );
  }
  const build =
    parsed !== null && typeof parsed === "object"
      ? /** @type {Record<string, unknown>} */ (parsed)["build"]
      : undefined;
  const devUrl =
    build !== null && typeof build === "object"
      ? /** @type {Record<string, unknown>} */ (build)["devUrl"]
      : undefined;
  const beforeDevCommand =
    build !== null && typeof build === "object"
      ? /** @type {Record<string, unknown>} */ (build)["beforeDevCommand"]
      : undefined;
  if (typeof devUrl !== "string" || devUrl === "") {
    throw new BootPortRefusal(
      `${file} has no string \`build.devUrl\` to rewrite the port of. The overlay ` +
        "is DERIVED from the committed value and will not invent one. Nothing was " +
        "probed and nothing was spawned.",
    );
  }
  if (typeof beforeDevCommand !== "string" || beforeDevCommand === "") {
    throw new BootPortRefusal(
      `${file} has no string \`build.beforeDevCommand\` to append the port flags ` +
        "to. The overlay is DERIVED from the committed value and will not invent " +
        "one. Nothing was probed and nothing was spawned.",
    );
  }
  return { devUrl, beforeDevCommand };
}

/**
 * Rewrite ONLY the port of the committed devUrl, leaving scheme, host,
 * path and query exactly as committed.
 *
 * What that buys, stated exactly because the notes have to be honest about
 * the residue: a committed devUrl on a dead HOST, or on `https` where vite
 * serves `http`, or with a wrong PATH, is still caught by the check. A
 * committed devUrl with a wrong PORT is still masked — but a wrong port is
 * the one thing this override is entitled to change. Two whole keys
 * unverified becomes one integer unverified.
 *
 * The trailing-slash dance is deliberate: `new URL(…).href` normalises
 * `http://localhost:1420` to `http://localhost:1420/`, and preserving the
 * committed spelling makes the derived overlay BYTE-IDENTICAL to T-046's
 * hard-coded one against today's committed values.
 *
 * @param {string} committedDevUrl
 * @param {number} port
 * @returns {string}
 */
export function devUrlWithPort(committedDevUrl, port) {
  /** @type {URL} */
  let url;
  try {
    url = new URL(committedDevUrl);
  } catch (err) {
    throw new BootPortRefusal(
      `the committed build.devUrl ${JSON.stringify(committedDevUrl)} is not a URL ` +
        `(${String(err)}), so its port cannot be rewritten. Nothing was probed and ` +
        "nothing was spawned.",
    );
  }
  url.port = String(port);
  const committedHadPathOrMore = /^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/[^/?#]*[/?#]/.test(committedDevUrl);
  const href = url.href;
  return !committedHadPathOrMore && href.endsWith("/") ? href.slice(0, -1) : href;
}

/**
 * Append the vite port flags to the COMMITTED beforeDevCommand rather than
 * emitting a fresh `npm run dev`.
 *
 * Why the append and not a rewrite (T-046-s4): today the overlay hard-codes
 * `npm run dev`, so a committed script renamed to `dev:app` — or deleted —
 * left the check happily running a command the human's `tauri dev` no
 * longer runs. Appending keeps the committed string load-bearing: rename
 * it and the check reds, break it and the check reds.
 *
 * The `--` separator is added only when the committed command does not
 * already carry one, so `npm run dev` becomes `npm run dev -- --port N
 * --strictPort` (byte-identical to T-046's hard-coded string) while an
 * already-separated `npm run dev -- --host` gains the flags directly
 * rather than a second, argument-eating `--`.
 *
 * @param {string} committedBeforeDevCommand
 * @param {number} port
 * @returns {string}
 */
export function beforeDevCommandWithPort(committedBeforeDevCommand, port) {
  const trimmed = committedBeforeDevCommand.trim();
  const alreadySeparated = /(^|\s)--(\s|$)/.test(trimmed);
  const separator = alreadySeparated ? "" : "-- ";
  return `${trimmed} ${separator}--port ${port} --strictPort`;
}

/**
 * The `--config` overlay that moves BOTH halves of `tauri dev` to the
 * scratch port: `devUrl` (what the tauri CLI waits for and the webview
 * loads) and `beforeDevCommand` (the vite server it starts). `--strictPort`
 * so a busy scratch port fails loudly instead of drifting to another one.
 *
 * DERIVED from the committed values since T-061 — see the two helpers
 * above for what each derivation does and does not still verify.
 *
 * CLI flags only — tauri.conf.json is NEVER edited. Same precedent as the
 * lane's own webServer command (T-005 verifier / T-020 §7, exercised on
 * 14521).
 *
 * @param {number} port
 * @param {CommittedBuild} committed
 * @returns {string}
 */
export function bootConfigJson(port, committed) {
  return JSON.stringify({
    build: {
      devUrl: devUrlWithPort(committed.devUrl, port),
      beforeDevCommand: beforeDevCommandWithPort(committed.beforeDevCommand, port),
    },
  });
}

/**
 * The argv for `spawn("npm", …)`, cwd app/.
 *
 * Default path: `["run", "tauri", "dev"]` — byte-identical to the
 * pre-T-046 command, so the three original exit paths run the same
 * process they always did. `committed` is not read at all there, which is
 * the point: the default path threads no overlay and therefore still tests
 * BOTH committed keys for real.
 *
 * Override path: the same prefix plus `-- --config <json>`.
 *
 * The `--` is LOAD-BEARING, not decoration. npm parses argv after the
 * script name itself and eats flags it recognises: measured on npm
 * 11.12.1, `npm run tauri dev --config '{…}'` reaches the script as
 * `["dev", "{…}"]` — the flag silently gone, the JSON left as a stray
 * positional. With `--` it arrives intact as
 * `["dev", "--config", "{…}"]`.
 *
 * @param {{ port: number, overridden: boolean }} resolved
 * @param {CommittedBuild | undefined} [committed] required when overridden
 * @returns {string[]}
 */
export function tauriDevArgs(resolved, committed) {
  const args = ["run", "tauri", "dev"];
  if (!resolved.overridden) return args;
  if (committed === undefined) {
    throw new BootPortRefusal(
      "the scratch-port overlay is DERIVED from the committed build config and no " +
        "committed config was supplied. Nothing was probed and nothing was spawned.",
    );
  }
  args.push("--", "--config", bootConfigJson(resolved.port, committed));
  return args;
}
