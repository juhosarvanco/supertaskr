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
 */

/** The env var that moves the boot check off the human's port. */
export const BOOT_PORT_ENV = "NPUTER_BOOT_PORT";

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
  constructor(message) {
    super(message);
    this.name = "BootPortRefusal";
  }
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
 * The `--config` overlay that moves BOTH halves of `tauri dev` to the
 * scratch port: `devUrl` (what the tauri CLI waits for and the webview
 * loads) and `beforeDevCommand` (the vite server it starts). `--strictPort`
 * so a busy scratch port fails loudly instead of drifting to another one.
 *
 * CLI flags only — tauri.conf.json is NEVER edited. Same precedent as the
 * lane's own webServer command (T-005 verifier / T-020 §7, exercised on
 * 14521).
 *
 * @param {number} port
 * @returns {string}
 */
export function bootConfigJson(port) {
  return JSON.stringify({
    build: {
      devUrl: `http://localhost:${port}`,
      beforeDevCommand: `npm run dev -- --port ${port} --strictPort`,
    },
  });
}

/**
 * The argv for `spawn("npm", …)`, cwd app/.
 *
 * Default path: `["run", "tauri", "dev"]` — byte-identical to the
 * pre-T-046 command, so the three original exit paths run the same
 * process they always did.
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
 * @returns {string[]}
 */
export function tauriDevArgs(resolved) {
  const args = ["run", "tauri", "dev"];
  if (resolved.overridden) args.push("--", "--config", bootConfigJson(resolved.port));
  return args;
}
