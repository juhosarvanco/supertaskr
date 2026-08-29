import { createHash } from "node:crypto";
import { readFileSync, statSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  CONTROL_PATTERN,
  CONTROL_UNCOVERED_SUFFIXES,
  CORPORA,
  MOTION_UTILITIES,
  MOTION_UTILITIES_OUT,
  TOKEN_EXCLUDED_FILES,
  TOKEN_PATTERNS,
  corpus,
  declaredMotionUtilities,
  scanControlSource,
  suffixClass,
  trackedFiles,
} from "../scripts/token-scan.mjs";

const wrapper = path.join(repoRoot, "tools", "e2e", "scripts", "lint-tokens.mjs");

const sha256 = (raw: Buffer): string => createHash("sha256").update(raw).digest("hex");

/**
 * ── THE CLOCK RESTORE IS A MICROSECOND ROUND-TRIP, NEVER AN EXACT ONE ─
 * (T-153-s5, measured on the platform where it first mattered.)
 *
 * Both plant-and-restore bodies below put the file's clock back with
 * `utimesSync` and then PROVE the restore. Until this card the proof was
 * `toBe(clock.mtimeMs)` — exact float equality — which is green on every
 * macOS run this repository has ever made and RED on ubuntu-24.04 on
 * first contact: CI 33259394002 and 33260414204, both bodies, both runs,
 * each reporting a received value a few ten-thousandths of a millisecond
 * BELOW the expected one.
 *
 * THE ASYMMETRY IS libuv'S, NOT THE FILESYSTEM'S. `utimesSync` hands
 * libuv a DOUBLE of seconds. On Linux `uv__fs_to_timespec` truncates the
 * nanosecond field to a whole MICROSECOND before `utimensat` ever sees it
 * — a deliberate cross-platform compatibility hack, carrying its own
 * `TODO` in libuv — while the Darwin path carries the nanoseconds
 * through. So Linux writes back a clock up to one microsecond BELOW the
 * captured one, and `mtimeMs`, whose own double holds finer steps than
 * that at this epoch, cannot spell the difference away.
 *
 * THIS IS THE T-130-s1 FAMILY, IN ITS FOURTH SPELLING. That finding —
 * absorbed by `T-111-s10`, whose `Absorbs:` line carries the measurement
 * — found the same fragility one layer up: 50 of 50 fresh writes land on
 * a sub-millisecond mtime, the `Date` form round-trips 0 of 50 and the
 * seconds form 50 of 50. The seconds form is still the right form; what
 * was wrong is the inference that a form which round-trips EXACTLY on the
 * measuring platform round-trips exactly on every platform.
 *
 * WHAT SURVIVES IS THE PURPOSE, AT A PRECISION BOTH PLATFORMS GRANT. The
 * defect this guard exists to catch is a restore that leaves the clock on
 * the moment of the plant, which T-079's integration measured as a gap of
 * THREE MINUTES FORTY (`dist/` at 03:50:54 against a plant target at
 * 03:54:34, `app/test/map-t1-t2-dom.test.tsx` red at 957/958). The bound
 * below is under two MICROSECONDS — eight orders of magnitude tighter
 * than the defect and still wider than the platform's own quantisation.
 */
const CLOCK_QUANTUM_NS = 1000;

/**
 * One ULP of a double at `value`'s magnitude, in `value`'s own unit. It is
 * a function of the EPOCH — 2**-12 ms today, twice that after 2039 — so it
 * is computed here and never typed as a literal.
 */
const ulpOf = (value: number): number => 2 ** (Math.floor(Math.log2(Math.abs(value))) - 52);

/**
 * The quantum above, plus what the SECONDS ARGUMENT costs. `utimesSync`
 * takes seconds as a double, so `clock.mtimeMs / 1000` is already up to
 * half an ULP away from the captured reading before libuv sees it, and the
 * captured reading is itself a double over a nanosecond counter. Two ULPs
 * covers both roundings; at this epoch the whole bound is 1489 ns, against
 * a worst case the mechanism puts at ~1180 ns.
 */
const clockRestoreToleranceNs = (capturedMs: number): number =>
  CLOCK_QUANTUM_NS + Math.ceil(2 * ulpOf(capturedMs) * 1e6);

/** The mtime at the precision the filesystem actually keeps — the reading
 *  that makes a platform divergence a NUMBER rather than an inference from
 *  two rounded doubles. */
const mtimeNs = (absolute: string): bigint => statSync(absolute, { bigint: true }).mtimeNs;

type CapturedClock = {
  relative: string;
  absolute: string;
  capturedMs: number;
  capturedNs: bigint;
};

/**
 * Asserts the clock restore for every target of one body, and STAMPS the
 * read-back into the run log FIRST — so the measurement is on the record
 * whether the guard passes or fails, and whether or not the first target
 * is the one that diverges. One implementation for both bodies: a rule
 * written twice is two chances to disagree (T-057).
 */
const expectClocksRestored = (body: string, captured: CapturedClock[]): void => {
  const stamped = captured.map((row) => {
    const restoredNs = mtimeNs(row.absolute);
    return {
      relative: row.relative,
      capturedNs: row.capturedNs,
      restoredNs,
      // BigInt first, Number after: the difference is a handful of
      // nanoseconds, exact in a double, while the readings themselves are
      // nineteen digits and are not.
      deltaNs: Number(restoredNs - row.capturedNs),
      toleranceNs: clockRestoreToleranceNs(row.capturedMs),
    };
  });
  console.log(
    `T-153-s5 clock restore, ${body}, on ${process.platform} node ${process.version} uv ${process.versions.uv}: ` +
      stamped
        .map((row) => `${row.relative} ${row.deltaNs}ns of ${row.toleranceNs}`)
        .join(" | "),
  );
  for (const row of stamped) {
    expect(
      Math.abs(row.deltaNs),
      `${row.relative} restored its MTIME too — a content-exact restore that moves the clock reds an mtime guard (captured ${row.capturedNs}ns, restored ${row.restoredNs}ns)`,
    ).toBeLessThanOrEqual(row.toleranceNs);
  }
};

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

/**
 * T-080 / T-058-s4. The sweep above recomputes the production formula,
 * which pins the PIPELINE and not the FORMAT: change the formula on both
 * sides and it still agrees with itself. These four expectations are
 * written out as strings, so uppercasing, zero-padding and the `U+`
 * prefix each fail here on their own. Two of the four carry a hex
 * LETTER, which is what the selftest could not do before this card.
 */
test("P5 renders the codepoint in the documented format, named literally", () => {
  const rendered = (byte: number): string => {
    const hits = scanControlSource(Buffer.from([byte]));
    expect(hits, `byte ${byte} must be a P5 hit at all`).toHaveLength(1);
    return hits[0]!.codepoint;
  };

  expect(rendered(0x00)).toBe("U+0000");
  expect(rendered(0x0b)).toBe("U+000B");
  expect(rendered(0x1b)).toBe("U+001B");
  expect(rendered(0x7f)).toBe("U+007F");
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
  // T-130. Captured AFTER the reads above, exactly as the P6 body captures
  // its own — so this file holds ONE answer to what restoring a fixture
  // means. A CONTENT-EXACT RESTORE IS NOT A RESTORE: this body plants into
  // seven tracked files across four packages, and until T-130 it put every
  // byte back and left all seven clocks on the moment of the plant.
  // T-153-s5. Two readings of the same file in the same moment: the `Stats`
  // the restore is DRIVEN from, and the nanosecond reading the guard below is
  // MEASURED against — see the clock-restore block at the top of this file
  // for why the two are not the same number on every platform.
  const clocks = new Map(
    targets.map((relative) => {
      const absolute = path.join(repoRoot, relative);
      return [relative, { absolute, stats: statSync(absolute), capturedNs: mtimeNs(absolute) }] as const;
    }),
  );
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
      const absolute = path.join(repoRoot, relative);
      writeFileSync(absolute, original);
      const { stats } = clocks.get(relative)!;
      // SECONDS AS A NUMBER, never `clock.atime, clock.mtime`: a `Date` holds
      // whole milliseconds, so the Date form rounds the restore (T-130).
      utimesSync(absolute, stats.atimeMs / 1000, stats.mtimeMs / 1000);
    }
  }

  for (const [relative, expectedHash] of hashes) {
    expect(sha256(readFileSync(path.join(repoRoot, relative))), `${relative} restored byte-exact`).toBe(
      expectedHash,
    );
  }
  expectClocksRestored(
    "seven first-party roots",
    [...clocks].map(([relative, { absolute, stats, capturedNs }]) => ({
      relative,
      absolute,
      capturedMs: stats.mtimeMs,
      capturedNs,
    })),
  );
  // The clock restore above does NOT put this proof at risk, which was
  // measured rather than assumed (T-130): `git diff --quiet` answers from the
  // index's cached stat info and `utimesSync` cannot restore `ctime`, so the
  // P6 comment below records a red-green-green intermittent from exactly this
  // pairing. Replayed over these seven targets, both arms — with and without
  // the clock restore — exit 0 in 12 of 12 cycles across two checkouts, one of
  // them a freshly-cut worktree with an unrefreshed index.
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

/**
 * T-079. The selftest proves P6 against SAMPLES on a bare checkout; this
 * body proves it against the real tree, end to end through the wrapper —
 * the two-gate shape T-058 argued for P5 and the same one that keeps
 * T-028's hand-written sweep alive beside this pattern.
 *
 * The plant carries its own POSITIVE CONTROL: the gated twin sits on the
 * line above the bare one, in the same file, in the same run. One hit
 * means P6 told them apart; a "not gated is refused" assertion with no
 * accepted twin cannot tell refusal from absence (docs/CONVENTIONS.md).
 *
 * Restoration is proved by sha256 against the bytes read before the
 * write, never by a clean `git status`.
 *
 * ── THE PLANT TARGET IS IN THIS PACKAGE, AND THAT IS A CORRECTION ────
 * It was `app/src/architecture/MapNode.tsx` when this body was written,
 * and T-079's own integration measured what that costs. **A
 * content-exact restore is not a complete one when a sibling suite reads
 * the CLOCK.** `app/test/map-t1-t2-dom.test.tsx`'s body *"the build is
 * newer than the sources it is evidence about"* compares `dist/`'s mtime
 * against four files and `MapNode.tsx` is one of them, so a plant that
 * restored every byte left the file `git diff --quiet` clean and the APP
 * SUITE RED — 957/958 at merge `91398f9`, with `dist/` at 03:50:54 and
 * the plant target at 03:54:34.
 *
 * Restoring the mtime with `utimesSync` fixes THAT, and the assertion
 * below still pins it — but it is not the whole answer, for two measured
 * reasons. **SEVEN files under `app/test/` read mtimes**, so the guard
 * found was one of a surface, not the surface. And `utimesSync` cannot
 * restore `ctime`, which git compares under the default
 * `core.trustctime`, so the restore trades a stale-build red for a
 * stat-cache interaction with the `git diff` two lines down — observed
 * red once and green on re-run, and an intermittent gate is worse than
 * the bug it replaces.
 *
 * **So the plant moved INSIDE THIS PACKAGE'S OWN FENCE.** `tools/e2e` is
 * one of the three TOKEN_ROOTS, so the corpus, the walk and the wrapper
 * path being exercised are identical — and nothing under `app/` is
 * touched by a lint test at all. The `app/src` plant is still on the
 * record: T-079's Implementation notes carry it, run by hand, red at
 * exit 1 with its twin silent and restoration proved by sha256.
 */
test("P6 reds a planted bare motion utility and leaves its motion-safe twin alone", () => {
  const relative = "tools/e2e/fixtures/shell.ts";
  const target = path.join(repoRoot, relative);
  const original = readFileSync(target);
  const before = sha256(original);
  const clock = statSync(target);
  const clockNs = mtimeNs(target);
  // Assembled, never written whole: a literal here would be the very
  // ungated candidate this file forbids, minted into a TOKEN-walked
  // source by the test that guards against it (T-028's scanner-hygiene
  // trap, and the reason app/test/map-view-dom.test.tsx splits its own).
  // It also keeps THIS file out of its own gate, which is the point of
  // TOKEN_EXCLUDED_FILES one rung up.
  const utility = `animate-status${"-"}pulse`;
  const gate = `motion${"-"}safe:`;
  const plant = `\nconst t079Gated = "${gate}${utility}";\nconst t079Bare = "${utility}";\n`;
  // the file ends in a newline, so the plant's blank line lands first
  const baseLines = original.toString("utf8").split("\n").length;
  let result: { status: number | null; stdout: string; stderr: string } | undefined;

  try {
    writeFileSync(target, Buffer.concat([original, Buffer.from(plant, "utf8")]));
    const planted = spawnSync(process.execPath, [wrapper], { cwd: repoRoot, encoding: "utf8" });
    result = { status: planted.status, stdout: planted.stdout ?? "", stderr: planted.stderr ?? "" };
  } finally {
    writeFileSync(target, original);
    // T-130. NOT `clock.atime, clock.mtime`: `Stats.mtime` is a `Date` and a
    // `Date` holds WHOLE MILLISECONDS, so a Date-valued restore writes back a
    // ROUNDED timestamp while the guard below compares against the unrounded
    // capture. `utimesSync` takes SECONDS as a number and carries the fraction
    // into the timespec, which is the right form and was measured as one (50
    // of 50 fresh writes on APFS/Darwin/node 22; the Date form: 0 of 50).
    // T-153-s5: right form, wrong PRECISION CLAIM — "round-trips exactly" was
    // true of Darwin and false of Linux, and the clock-restore block at the
    // top of this file carries the mechanism and the bound that replaced it.
    utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);
  }

  // THE HASH IS THE PROOF, and deliberately not a `git diff --quiet` the
  // way the T-058 body above uses one. `--quiet` answers from the index's
  // cached STAT INFO, which is exactly what `utimesSync` rewrites: it
  // cannot restore `ctime`, so the first call after the restore reports a
  // difference on stat alone, and the call itself refreshes the index so
  // the next one passes. Measured here three runs in a row, red-green-green.
  // docs/CONVENTIONS.md already prefers the hash for this reason —
  // "restoration proved by hash rather than by a clean `git status`".
  expect(sha256(readFileSync(target)), `${relative} restored byte-exact`).toBe(before);
  expectClocksRestored("P6 plant target", [
    { relative, absolute: target, capturedMs: clock.mtimeMs, capturedNs: clockNs },
  ]);

  expect(result).toBeDefined();
  expect(result!.status, result!.stdout + result!.stderr).toBe(1);
  // exactly one — the gated line above it is not a hit
  expect(result!.stdout.match(/\[P6:/g)).toHaveLength(1);
  expect(result!.stdout).toContain(`${relative}:${baseLines + 2}: `);
  expect(result!.stdout).not.toContain(`${relative}:${baseLines + 1}: `);
  expect(result!.stderr).toContain("(1 TOKEN, 0 CONTROL)");
});

/**
 * T-079. MOTION_UTILITIES is a list and a list goes stale in silence, so
 * the names are derived too. This body recomputes the RELATION here
 * rather than calling the module's check, so deleting `motionFloorChecks`
 * from `walkPolicyChecks` reds the lane even while the selftest stays
 * green — the same asymmetry the CONTROL floor body below relies on.
 */
test("every animation utility this tree declares is matched by P6 or argued out", () => {
  const declared = declaredMotionUtilities();
  const known = new Set<string>([...MOTION_UTILITIES, ...MOTION_UTILITIES_OUT]);

  expect(declared.length, "the tree declares animation utilities to cover").toBeGreaterThan(0);
  expect(
    declared.filter(({ name }) => !known.has(name)),
    "no declared animation utility is unknown to P6's name lists",
  ).toEqual([]);
  // both producers are really reached: a `--animate-*` theme key and an
  // `@utility` whose body animates carry different names and only the
  // second one has no `animate-` prefix to find it by.
  expect(declared.map(({ name }) => name)).toContain("status-pulse");
  expect(declared.map(({ name }) => name)).toContain("board-rain");
  expect(new Set(declared.map(({ where }) => where))).toContain("app/src/index.css");
});

/**
 * T-080, closing T-058-s1. The floor lives in the selftest so it runs on
 * a bare checkout; this body recomputes the RELATION here instead of
 * calling the module's check function, so deleting the floor from
 * `walkPolicyChecks` reds the lane even while the selftest stays green.
 * Measured at `16bb47b` before the floor existed: adding one line to
 * CONTROL_BINARY_EXTENSIONS took the corpus from 507 files to 463
 * (`.rs`) or 461 (`.tsx`) with the lint AND the selftest both at exit 0.
 */
test("CONTROL covers every tracked suffix class it does not declare uncoverable", () => {
  const tracked = trackedFiles();
  const covered = new Set<string>(corpus(CORPORA.CONTROL));
  const byClass = new Map<string, { tracked: number; covered: number }>();
  for (const relative of tracked) {
    const cls = suffixClass(relative);
    const row = byClass.get(cls) ?? { tracked: 0, covered: 0 };
    row.tracked += 1;
    if (covered.has(relative)) row.covered += 1;
    byClass.set(cls, row);
  }

  expect(byClass.size, "the tree has suffix classes to cover").toBeGreaterThan(0);
  const dropped: string[] = [];
  for (const [cls, row] of byClass) {
    const exempt = CONTROL_UNCOVERED_SUFFIXES.has(cls);
    const want = exempt ? 0 : row.tracked;
    if (row.covered !== want) {
      dropped.push(`${cls || "(no extension)"}: ${row.covered}/${row.tracked}, exempt=${exempt}`);
    }
  }
  expect(dropped, "no tracked suffix class silently leaves CONTROL").toEqual([]);

  // and the classes the architect's 2026-08-18 ruling named are whole,
  // without the exemption list getting a vote.
  for (const cls of [".rs", ".tsx", ".ts", ".md"]) {
    const row = byClass.get(cls);
    expect(row, `${cls} is tracked`).toBeDefined();
    expect(row!.covered, `every tracked ${cls} file is CONTROL-covered`).toBe(row!.tracked);
  }
});

/**
 * T-080's last criterion. CI's FIRST step must be able to say whether it
 * found something or could not run at all — before T-058 there was no
 * could-not-run mode, and after it there was one that exited 1 like a
 * violation. The codes are asserted as LITERALS here, never imported
 * from the module that produces them, so renumbering reds this body.
 */
test("the gate distinguishes clean, found-something and could-not-run", () => {
  const run = (args: string[], env?: NodeJS.ProcessEnv) =>
    spawnSync(process.execPath, [wrapper, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, ...env },
    });

  const clean = run([]);
  expect(clean.status, clean.stderr).toBe(0);
  expect(clean.stdout).toContain("lint-tokens: clean");

  // git off PATH is the T-058 behaviour change made legible: the corpus
  // is underivable, so the gate did not run. Nothing is written, and the
  // tree is never consulted.
  const blind = run([], { PATH: path.join(repoRoot, "no-such-directory-t080") });
  expect(blind.status, blind.stdout + blind.stderr).toBe(3);
  expect(blind.stderr).toContain("GATE COULD NOT RUN");
  expect(blind.stderr).toContain("cannot derive tracked CONTROL corpus");
  expect(blind.stderr).toContain("NOT a claim about the tree");
  expect(blind.stdout).not.toContain("lint-tokens: clean");

  // the same distinction holds for the selftest, which reaches git too.
  const blindSelftest = run(["--selftest"], {
    PATH: path.join(repoRoot, "no-such-directory-t080"),
  });
  expect(blindSelftest.status, blindSelftest.stdout + blindSelftest.stderr).toBe(3);

  const selftest = run(["--selftest"]);
  expect(selftest.status, selftest.stderr).toBe(0);
  const floors = selftest.stdout.match(/(\d+) evidence-floor checks green/);
  expect(floors, "the selftest reports its evidence floor").not.toBeNull();
  // one row per TOKEN pattern, plus the four the control pattern needs:
  // a positive, a negative, and a positive whose hex carries a letter.
  expect(Number(floors![1])).toBeGreaterThanOrEqual(TOKEN_PATTERNS.length + 4);
});
