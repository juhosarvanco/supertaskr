import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  BOOT_PORT_ENV,
  BootPortRefusal,
  DEFAULT_TAURI_PORT,
  EXIT_REFUSED,
  TAURI_CONF_SEGMENTS,
  beforeDevCommandWithPort,
  bootConfigJson,
  devUrlWithPort,
  isSignalableGroup,
  readCommittedBuildConfig,
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
 * SUPERTASKR_BOOT_PORT exists so the check can run BESIDE the human's live
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
  expect(stdout).not.toContain("[supertaskr]");
}

test("unset resolves to 1420 and threads no --config — the pre-T-046 command, byte for byte", () => {
  for (const raw of [undefined, ""]) {
    const resolved = resolveBootPort(raw);
    expect(resolved).toEqual({ port: DEFAULT_TAURI_PORT, overridden: false });
    expect(tauriDevArgs(resolved)).toEqual(["run", "tauri", "dev"]);
  }
});

/** The values this repository actually commits, as a fixture. */
const COMMITTED = { devUrl: "http://localhost:1420", beforeDevCommand: "npm run dev" };

test("a scratch port threads the matching --config to BOTH halves of tauri dev", () => {
  const resolved = resolveBootPort("14521");
  expect(resolved).toEqual({ port: 14521, overridden: true });

  // devUrl (what the CLI waits for and the webview loads) AND
  // beforeDevCommand (the vite server it starts) — moving one without the
  // other hangs the check on a URL nothing serves.
  expect(JSON.parse(bootConfigJson(14521, COMMITTED))).toEqual({
    build: {
      devUrl: "http://localhost:14521",
      beforeDevCommand: "npm run dev -- --port 14521 --strictPort",
    },
  });

  // The `--` is load-bearing: npm eats a bare `--config` after the script
  // name (measured on npm 11.12.1, the flag vanishes and the JSON arrives
  // as a stray positional). CLI flags only — tauri.conf.json is untouched.
  expect(tauriDevArgs(resolved, COMMITTED)).toEqual([
    "run",
    "tauri",
    "dev",
    "--",
    "--config",
    '{"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}',
  ]);
});

// ── T-061: the overlay is DERIVED from the committed values ───────────
//
// T-046's overlay EMITTED both keys from nothing, so the two it replaced
// were not merely un-asserted, they were DISCARDED — measured at T-046-s4,
// a committed devUrl on a dead port and a committed beforeDevCommand
// naming a script that does not exist BOTH exited 0, GREEN.

test("the overlay carries the COMMITTED dev command, so a renamed script still reds", () => {
  // The failure T-046-s4 names one step further than the blindness: with a
  // hard-coded `npm run dev`, a committed script renamed to `dev:app` left
  // the check happily running a command the human's `tauri dev` no longer
  // runs — green, on a config that cannot boot.
  expect(beforeDevCommandWithPort("npm run dev:app", 14521)).toBe(
    "npm run dev:app -- --port 14521 --strictPort",
  );
  expect(beforeDevCommandWithPort("npm run no-such-script-at-all", 14521)).toBe(
    "npm run no-such-script-at-all -- --port 14521 --strictPort",
  );
  expect(
    JSON.parse(bootConfigJson(14521, { ...COMMITTED, beforeDevCommand: "npm run dev:app" })).build
      .beforeDevCommand,
  ).toBe("npm run dev:app -- --port 14521 --strictPort");
});

test("a committed command that already carries `--` does not gain a second one", () => {
  // A second `--` would be handed to vite as an argument rather than eaten
  // by npm, so the port flags would arrive behind a separator vite has to
  // interpret. One separator, wherever the committed value put it.
  expect(beforeDevCommandWithPort("npm run dev -- --host", 14521)).toBe(
    "npm run dev -- --host --port 14521 --strictPort",
  );
  expect(beforeDevCommandWithPort("  npm run dev  ", 14521)).toBe(
    "npm run dev -- --port 14521 --strictPort",
  );
});

test("only the PORT of the committed devUrl is rewritten — scheme, host and path survive", () => {
  expect(devUrlWithPort("http://localhost:1420", 14521)).toBe("http://localhost:14521");
  // A committed https where vite serves http is now CAUGHT, not overwritten.
  expect(devUrlWithPort("https://localhost:1420", 14521)).toBe("https://localhost:14521");
  // A committed dead host is now CAUGHT too.
  expect(devUrlWithPort("http://t061-no-such-host.invalid:1420", 14521)).toBe(
    "http://t061-no-such-host.invalid:14521",
  );
  // A path is part of what the webview loads, so it is preserved verbatim.
  expect(devUrlWithPort("http://localhost:1420/app/", 14521)).toBe("http://localhost:14521/app/");
  // A committed URL with no port at all gains one rather than being replaced.
  expect(devUrlWithPort("http://localhost", 14521)).toBe("http://localhost:14521");
});

test("THE RESIDUAL, asserted rather than described: a wrong committed PORT is still masked", () => {
  // This is the hole T-061 SHRINKS and does not close, and it is pinned
  // here so nobody reads the card's "one integer unverified" as prose. The
  // port is the one thing the override is entitled to change; every other
  // component of the committed URL is now load-bearing.
  expect(devUrlWithPort("http://localhost:14999", 14521)).toBe("http://localhost:14521");
  expect(devUrlWithPort("http://localhost:1420", 14521)).toBe(
    devUrlWithPort("http://localhost:14999", 14521),
  );
});

test("against the REAL committed config the derivation is a no-op, byte for byte", () => {
  // The strongest thing that can be said about a refactor of a merge
  // gate's overlay: for the values this tree actually commits, the derived
  // JSON is character-identical to the string T-046 hard-coded. Anything
  // that reds here is a change to what the boot check spawns.
  const committed = readCommittedBuildConfig(repoRoot);
  expect(committed).toEqual(COMMITTED);
  expect(bootConfigJson(14521, committed)).toBe(
    '{"build":{"devUrl":"http://localhost:14521","beforeDevCommand":"npm run dev -- --port 14521 --strictPort"}}',
  );
  expect(TAURI_CONF_SEGMENTS).toEqual(["app", "src-tauri", "tauri.conf.json"]);
});

test("an underivable committed config REFUSES — it never falls back to the committed port", () => {
  // There is no safe fallback and that is the whole argument: the only
  // value to fall back to is the committed devUrl, and on this repository
  // that is 1420. A boot check that quietly dropped the overlay would boot
  // on the human's app.
  const dir = mkdtempSync(path.join(os.tmpdir(), "t061-conf-"));
  const write = (body: string): void => {
    const file = path.join(dir, ...TAURI_CONF_SEGMENTS);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body, "utf8");
  };
  try {
    // (1) no file at all
    expect(() => readCommittedBuildConfig(dir)).toThrow(BootPortRefusal);
    expect(() => readCommittedBuildConfig(dir)).toThrow(/cannot read the committed build config/);

    // (2) not JSON
    write("{ this is not json");
    expect(() => readCommittedBuildConfig(dir)).toThrow(/is not valid JSON/);

    // (3) no devUrl to rewrite the port of
    write(JSON.stringify({ build: { beforeDevCommand: "npm run dev" } }));
    expect(() => readCommittedBuildConfig(dir)).toThrow(/no string `build.devUrl`/);

    // (4) no beforeDevCommand to append to
    write(JSON.stringify({ build: { devUrl: "http://localhost:1420" } }));
    expect(() => readCommittedBuildConfig(dir)).toThrow(/no string `build.beforeDevCommand`/);

    // (5) a devUrl that is not a URL is refused at derivation time
    expect(() => devUrlWithPort("not a url", 14521)).toThrow(/is not a URL/);

    // Every refusal says the same thing about what it did NOT do.
    write(JSON.stringify({ build: { devUrl: "http://localhost:1420" } }));
    expect(() => readCommittedBuildConfig(dir)).toThrow(/Nothing was probed and nothing was spawned/);

    // And the whole thing round-trips once both keys are back.
    write(JSON.stringify({ build: COMMITTED }));
    expect(readCommittedBuildConfig(dir)).toEqual(COMMITTED);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an OVERRIDE with no committed config refuses rather than emitting a bare overlay", () => {
  expect(() => tauriDevArgs({ port: 14521, overridden: true })).toThrow(BootPortRefusal);
  expect(() => tauriDevArgs({ port: 14521, overridden: true })).toThrow(/DERIVED/);
  // The DEFAULT path needs none of it, which is exactly why it still tests
  // both committed keys for real.
  expect(tauriDevArgs({ port: DEFAULT_TAURI_PORT, overridden: false })).toEqual([
    "run",
    "tauri",
    "dev",
  ]);
});

test("the process-group guard refuses the two ids that mean something else entirely", () => {
  // `kill(-0, …)` is `kill(0, …)`, this process's OWN group, because
  // JavaScript has `-0 === 0`; `kill(-1, …)` is the POSIX broadcast to
  // every process this user may signal — which on a dev machine includes
  // the human's `tauri dev` on 1420. Neither arises from a real spawn and
  // both are one typo away in a file whose job is killing process trees.
  expect(-0 === 0).toBe(true);
  for (const bad of [0, -0, 1, -1, -5, 1.5, NaN, Infinity, undefined, null, "2", "1420"]) {
    expect(isSignalableGroup(bad), `pgid ${String(bad)} must not be signalable`).toBe(false);
  }
  for (const ok of [2, 42, 99973, 2 ** 20]) {
    expect(isSignalableGroup(ok), `pgid ${ok} is a real spawned group`).toBe(true);
  }
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
