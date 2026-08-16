import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  BOOT_PORT_ENV,
  DEFAULT_TAURI_PORT,
  EXIT_REFUSED,
  bootConfigJson,
  resolveBootPort,
  tauriDevArgs,
} from "../scripts/boot-port.mjs";

/**
 * The boot check's guard rails (T-046) — no browser, and nothing here
 * ever boots the app: every test either calls the pure resolver or runs
 * the real script down a path that stops BEFORE `tauri dev` is spawned.
 * The lane stays headless; `npm run boot:check` is the thing that opens a
 * window, and it lives outside `npm test` (CONVENTIONS, tools/e2e).
 *
 * The centrepiece is the 1420 refusal, the same shape as
 * playwright.config.ts's `resolveLanePort` throw and for the same reason:
 * NPUTER_BOOT_PORT exists so the check can run BESIDE the human's live
 * app, and must never become a second way to contend for it.
 *
 * NOTHING IN THIS FILE MAY BIND OR CONTACT 1420. The refusal is asserted
 * by observing that the script exits 3 having probed nothing at all —
 * which is stronger than a bind attempt would be, not weaker.
 */

const bootCheck = path.join(repoRoot, "tools", "e2e", "scripts", "tauri-boot-check.mjs");

/** Run the real script with an env override; it must never reach `tauri dev`. */
function runBootCheck(bootPort: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [bootCheck], {
    env: { ...process.env, [BOOT_PORT_ENV]: bootPort },
    encoding: "utf8",
    timeout: 30_000,
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Proof that no `tauri dev` was started: the script logs before it spawns. */
function assertNothingSpawned(stdout: string): void {
  expect(stdout, "the script logs `port … free — spawning` immediately before the spawn").not.toContain(
    "spawning",
  );
  expect(stdout).not.toContain("[nputer]");
}

test("unset resolves to 1420 and threads no --config — the pre-T-046 command, byte for byte", () => {
  for (const raw of [undefined, ""]) {
    const resolved = resolveBootPort(raw);
    expect(resolved).toEqual({ port: DEFAULT_TAURI_PORT, overridden: false });
    expect(tauriDevArgs(resolved)).toEqual(["run", "tauri", "dev"]);
  }
});

test("a scratch port threads the matching --config to BOTH halves of tauri dev", () => {
  const resolved = resolveBootPort("14521");
  expect(resolved).toEqual({ port: 14521, overridden: true });

  // devUrl (what the CLI waits for and the webview loads) AND
  // beforeDevCommand (the vite server it starts) — moving one without the
  // other hangs the check on a URL nothing serves.
  expect(JSON.parse(bootConfigJson(14521))).toEqual({
    build: {
      devUrl: "http://localhost:14521",
      beforeDevCommand: "npm run dev -- --port 14521 --strictPort",
    },
  });

  // The `--` is load-bearing: npm eats a bare `--config` after the script
  // name (measured on npm 11.12.1, the flag vanishes and the JSON arrives
  // as a stray positional). CLI flags only — tauri.conf.json is untouched.
  expect(tauriDevArgs(resolved)).toEqual([
    "run",
    "tauri",
    "dev",
    "--",
    "--config",
    '{"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}',
  ]);
});

test(`${BOOT_PORT_ENV}=1420 is refused by the resolver — the lane's own throw, restated`, () => {
  expect(() => resolveBootPort("1420")).toThrow(/refusing/);
  expect(() => resolveBootPort("1420")).toThrow(/human's live app/);
  // Hex and padding resolve to the same port and are refused the same way;
  // the guard is on the NUMBER, not on the spelling.
  expect(() => resolveBootPort("0x58c")).toThrow(/refusing/);
  expect(() => resolveBootPort("01420")).toThrow(/refusing/);
});

test("values that are not ports are refused, never silently defaulted", () => {
  for (const raw of ["0", "70000", "-1", "1420.5", "http://localhost:14521", "nope", "  "]) {
    expect(() => resolveBootPort(raw), `${BOOT_PORT_ENV}=${JSON.stringify(raw)}`).toThrow(
      /not a valid port number/,
    );
  }
});

test(`the real script refuses ${BOOT_PORT_ENV}=1420 with exit 3, probing nothing`, () => {
  const { status, stdout, stderr } = runBootCheck("1420");

  // Exit 3, not 2: a refusal is a refusal, never reported as "busy" — and
  // not 1 either, which is reserved for a boot that failed.
  expect(status, `stderr was:\n${stderr}`).toBe(EXIT_REFUSED);
  expect(EXIT_REFUSED).toBe(3);
  expect(stderr).toContain("[boot-check] REFUSED:");
  expect(stderr).toContain("refusing");
  expect(stderr).toContain("Nothing was probed and nothing was spawned.");

  // Refused BEFORE the bind probe: had the script probed, this run would
  // have reported 1420 either free or busy. It reported neither, which is
  // how we know nothing touched the human's port.
  expect(stdout).not.toContain("free");
  expect(stderr).not.toContain("ABORT");
  assertNothingSpawned(stdout);
});

test("a busy scratch port aborts with exit 2 and spawns nothing", async () => {
  // Take a real port (OS-assigned, so never 1420 and never something
  // else's) and hold it for the length of the child's probe.
  const server = net.createServer();
  const port = await new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") reject(new Error("no port"));
      else resolve(address.port);
    });
  });
  try {
    expect(port).not.toBe(DEFAULT_TAURI_PORT);
    const { status, stdout, stderr } = runBootCheck(String(port));

    expect(status, `stdout was:\n${stdout}\nstderr was:\n${stderr}`).toBe(2);
    expect(stderr).toContain(`[boot-check] ABORT: port ${port} (${BOOT_PORT_ENV}) is in use`);
    expect(stderr).toContain("Nothing was spawned.");
    // The override reached the probe: the abort names the overridden port,
    // so the env var is honoured end-to-end, not just in the resolver.
    expect(stderr).not.toContain("1420");
    assertNothingSpawned(stdout);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
