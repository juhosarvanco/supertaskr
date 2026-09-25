/**
 * THE NATIVE CODEX BRIDGE (T-315-s1).
 *
 * A Codex subagent shares its parent's session cwd. That cwd is useful for
 * locating the seat's run records and for nothing else: the record bound to
 * the callback's `agent_id` names the one resource the child may write.
 *
 * Native state is part of the T-311 run record: the launch intent, callback,
 * identity probe, binding, inflight tools, receipts and holds all survive in
 * the same attempt document that owns the reservation. If that document is
 * unreadable, a one-shot attempt sidecar preserves the unknown until the
 * repaired document can absorb it. The hook is a transport adapter over the
 * functions here.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const NATIVE_CODEX_VERSION = 1;
export const NATIVE_CODEX_HARNESS = "codex-desktop-native";
export const NATIVE_IDENTITY_PROBE = "/usr/bin/printenv CODEX_THREAD_ID";
export const NATIVE_SUPPORTED_TOOLS = Object.freeze(["Bash", "apply_patch"]);

export class NativeCodexFinding extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "NativeCodexFinding";
    this.code = code;
  }
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @param {unknown} value @returns {?string} */
function string(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** @param {string | Buffer} value @returns {string} */
export function nativeSha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

/** @param {string} root @param {string[]} args @param {{ allowFailure?: boolean }} [opts] */
function git(root, args, opts = {}) {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: null,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0 && opts.allowFailure !== true) {
    throw new NativeCodexFinding(
      "NATIVE_CHECKER_ERROR",
      `native-codex: git ${args[0] ?? ""} failed in ${root}: ` +
        Buffer.from(result.stderr ?? []).toString("utf8").trim(),
    );
  }
  return {
    status: result.status,
    stdout: Buffer.from(result.stdout ?? []),
    stderr: Buffer.from(result.stderr ?? []),
  };
}

/** @param {string} root @returns {string} */
function exactGitRoot(root) {
  if (!path.isAbsolute(root)) {
    throw new NativeCodexFinding("NATIVE_RESOURCE_NOT_ABSOLUTE", `native-codex: resource is not absolute: ${root}`);
  }
  const real = realpathSync(root);
  const top = git(real, ["rev-parse", "--show-toplevel"]).stdout.toString("utf8").trim();
  if (realpathSync(top) !== real) {
    throw new NativeCodexFinding(
      "NATIVE_RESOURCE_NOT_ROOT",
      `native-codex: the assigned resource must be an exact Git root: ${root}`,
    );
  }
  return real;
}

/** @param {unknown} value @returns {string} */
export function nativeDomain(value) {
  if (typeof value !== "string" || value.trim() === "" || path.isAbsolute(value)) {
    throw new NativeCodexFinding(
      "NATIVE_DOMAIN",
      `native-codex: fence/output domains are non-empty repository-relative paths: ${String(value)}`,
    );
  }
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
  if (normalized === "" || normalized === "." || normalized.split("/").includes("..")) {
    throw new NativeCodexFinding("NATIVE_DOMAIN", `native-codex: unsafe fence/output domain: ${value}`);
  }
  return normalized;
}

/** @param {string} rel @param {string} domain */
export function nativeWithin(rel, domain) {
  return rel === domain || rel.startsWith(`${domain}/`);
}

/** @param {string} rel @param {readonly string[]} domains */
export function nativePathAllowed(rel, domains) {
  return domains.some((domain) => nativeWithin(rel, domain));
}

/** @param {string} value */
export function nativeShellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

/**
 * Read the optional native assignment block. A harness claiming to be
 * native without this block is not launchable; another harness carrying the
 * block is equally contradictory.
 *
 * @param {unknown} raw
 * @param {string} harness
 * @param {string} source
 * @returns {?{ taskName: string, sessionId: string, coordinatorTurnId: string, ignoredOutputs: string[] }}
 */
export function readNativeAssignment(raw, harness, source) {
  if (harness !== NATIVE_CODEX_HARNESS) {
    if (raw !== undefined) {
      throw new NativeCodexFinding(
        "NATIVE_ASSIGNMENT_HARNESS",
        `native-codex: ${source} carries native launch authority for non-native harness ${JSON.stringify(harness)}.`,
      );
    }
    return null;
  }
  if (!isObject(raw)) {
    throw new NativeCodexFinding(
      "NATIVE_ASSIGNMENT_MISSING",
      `native-codex: ${source} names harness ${NATIVE_CODEX_HARNESS} but carries no native object.`,
    );
  }
  const taskName = string(raw.taskName);
  const sessionId = string(raw.sessionId);
  const coordinatorTurnId = string(raw.coordinatorTurnId);
  if (taskName === null || sessionId === null || coordinatorTurnId === null || !Array.isArray(raw.ignoredOutputs)) {
    throw new NativeCodexFinding(
      "NATIVE_ASSIGNMENT_INCOMPLETE",
      `native-codex: ${source} native needs taskName, sessionId, coordinatorTurnId and ignoredOutputs (an explicit array, including empty).`,
    );
  }
  const ignoredOutputs = raw.ignoredOutputs.map(nativeDomain);
  if (new Set(ignoredOutputs).size !== ignoredOutputs.length) {
    throw new NativeCodexFinding("NATIVE_ASSIGNMENT_DUPLICATE_OUTPUT", `native-codex: ${source} repeats an ignored-output domain.`);
  }
  return { taskName, sessionId, coordinatorTurnId, ignoredOutputs };
}

/** @param {string} mode */
function modeType(mode) {
  if (mode === "000000") return "absent";
  if (mode === "120000") return "symlink";
  if (mode === "160000") return "gitlink";
  if (mode.startsWith("04")) return "tree";
  return "file";
}

/** @param {Buffer} buffer */
export function parseNativeRawDiff(buffer) {
  const fields = buffer.toString("utf8").split("\0");
  if (fields.at(-1) === "") fields.pop();
  const entries = [];
  for (let i = 0; i < fields.length; ) {
    const header = fields[i++];
    if (header === undefined) {
      throw new NativeCodexFinding("NATIVE_RAW_DIFF", "native-codex: raw diff ended before its header.");
    }
    const match = /^:(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])(\d*)$/.exec(header);
    if (match === null) {
      throw new NativeCodexFinding("NATIVE_RAW_DIFF", `native-codex: unreadable raw-diff header: ${JSON.stringify(header)}`);
    }
    const oldPath = fields[i++];
    if (oldPath === undefined) throw new NativeCodexFinding("NATIVE_RAW_DIFF", "native-codex: raw diff ended before its path.");
    const status = match[5];
    const newPath = status === "R" || status === "C" ? fields[i++] : oldPath;
    if (newPath === undefined) {
      throw new NativeCodexFinding("NATIVE_RAW_DIFF", "native-codex: raw rename/copy ended before its destination.");
    }
    entries.push({
      kind: "tracked",
      status: `${status}${match[6]}`,
      oldMode: match[1],
      newMode: match[2],
      oldType: modeType(/** @type {string} */ (match[1])),
      newType: modeType(/** @type {string} */ (match[2])),
      oldObject: match[3],
      newObject: match[4],
      oldPath,
      newPath,
      paths: oldPath === newPath ? [oldPath] : [oldPath, newPath],
    });
  }
  return entries;
}

/** @param {Buffer} buffer */
function nulPaths(buffer) {
  const fields = buffer.toString("utf8").split("\0");
  if (fields.at(-1) === "") fields.pop();
  return fields.sort();
}

/** @param {string} root @param {string} rel */
export function nativeFileSignature(root, rel) {
  const absolute = path.join(root, ...rel.split("/"));
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) {
    return { path: rel, type: "symlink", mode: stat.mode & 0o7777, hash: nativeSha256(readlinkSync(absolute)) };
  }
  if (stat.isFile()) {
    return { path: rel, type: "file", mode: stat.mode & 0o7777, hash: nativeSha256(readFileSync(absolute)) };
  }
  if (stat.isDirectory()) return { path: rel, type: "directory", mode: stat.mode & 0o7777, hash: null };
  return { path: rel, type: "other", mode: stat.mode & 0o7777, hash: null };
}

/** @param {string} root @param {readonly string[]} policies */
export function nativeIgnoredSnapshot(root, policies) {
  const exclusions = policies.flatMap((domain) => [`:(exclude)${domain}`, `:(exclude)${domain}/**`]);
  return nulPaths(
    git(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", ".", ...exclusions]).stdout,
  ).map((rel) => nativeFileSignature(root, rel));
}

/** @param {any[]} entries */
function signatureMap(entries) {
  return new Map(entries.map((entry) => [entry.path, JSON.stringify(entry)]));
}

/** @param {string} root @param {string} manifest */
function readFence(root, manifest) {
  if (!path.isAbsolute(manifest) || !existsSync(manifest)) {
    throw new NativeCodexFinding("NATIVE_FENCE_UNREADABLE", `native-codex: the admitted fence manifest is absent: ${manifest}`);
  }
  let parsed;
  const text = readFileSync(manifest, "utf8");
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new NativeCodexFinding("NATIVE_FENCE_UNREADABLE", `native-codex: fence manifest did not parse: ${String(error)}`);
  }
  if (!isObject(parsed) || !Array.isArray(parsed.paths) || !Array.isArray(parsed.alwaysWritable)) {
    throw new NativeCodexFinding("NATIVE_FENCE_UNREADABLE", "native-codex: fence manifest lacks paths or alwaysWritable arrays.");
  }
  const worktree = string(parsed.worktree);
  if (worktree === null || !existsSync(worktree) || realpathSync(worktree) !== root) {
    throw new NativeCodexFinding("NATIVE_FENCE_RESOURCE", "native-codex: fence worktree is not the assigned resource.");
  }
  const paths = [...parsed.paths, ...parsed.alwaysWritable].map(nativeDomain);
  if (new Set(paths).size !== paths.length) {
    throw new NativeCodexFinding("NATIVE_FENCE_DUPLICATE", "native-codex: canonical fence contains a duplicate path.");
  }
  return {
    manifest,
    digest: nativeSha256(text),
    taskId: string(parsed.taskId),
    ref: string(parsed.ref),
    paths,
  };
}

/**
 * Add the native admission state to a newly-reserved T-311 record. This is
 * called before the record is first written and therefore before spawn.
 *
 * @param {Record<string, any>} rec
 * @param {{ at: string }} opts
 */
export function prepareNativeRecord(rec, opts) {
  if (rec.assignment?.native === null || rec.assignment?.native === undefined) return rec;
  if (rec.writer !== true || rec.resource === null) {
    throw new NativeCodexFinding("NATIVE_WRITER_REQUIRED", "native-codex: a tool-using native attempt must own a writer resource.");
  }
  const resource = exactGitRoot(rec.resource);
  if (
    !existsSync(rec.assignment.cwd) ||
    !existsSync(rec.assignment.resource) ||
    realpathSync(rec.assignment.cwd) !== resource ||
    realpathSync(rec.assignment.resource) !== resource
  ) {
    throw new NativeCodexFinding(
      "NATIVE_RESOURCE_DISAGREEMENT",
      "native-codex: assignment cwd, resource and reserved resource must be the same absolute Git root.",
    );
  }
  rec.resource = resource;
  if (!/^[0-9a-f]{40}$/.test(rec.assignment.base)) {
    throw new NativeCodexFinding("NATIVE_BASE", "native-codex: native admission requires a full 40-character base commit.");
  }
  git(resource, ["cat-file", "-e", `${rec.assignment.base}^{commit}`]);
  const head = git(resource, ["rev-parse", "HEAD"]).stdout.toString("utf8").trim();
  if (head !== rec.assignment.base) {
    throw new NativeCodexFinding(
      "NATIVE_BASE_HEAD",
      `native-codex: assigned resource HEAD ${head} is not admitted base ${rec.assignment.base}.`,
    );
  }
  const manifest = path.join(resource, ".supertaskr", "lane-fence.json");
  const fence = readFence(resource, manifest);
  if (fence.taskId !== rec.assignment.id || fence.ref !== rec.assignment.base) {
    throw new NativeCodexFinding(
      "NATIVE_FENCE_ADMISSION",
      "native-codex: fence task/ref does not match the admitted card and base.",
    );
  }
  const ignoredOutputs = rec.assignment.native.ignoredOutputs.map(nativeDomain);
  const ignoredBaseline = nativeIgnoredSnapshot(resource, ignoredOutputs);
  const fenceRel = path.relative(resource, manifest).replaceAll("\\", "/");
  const unexpectedIgnoredAtAdmission = ignoredBaseline.filter((entry) => entry.path !== fenceRel);
  if (unexpectedIgnoredAtAdmission.length > 0) {
    throw new NativeCodexFinding(
      "NATIVE_ADMISSION_DIRTY",
      `native-codex: assigned resource has ignored residue outside named policy: ${JSON.stringify(unexpectedIgnoredAtAdmission)}`,
    );
  }
  const admitted = collectNativeWorkspace(
    {
      ...rec,
      native: {
        version: NATIVE_CODEX_VERSION,
        launch: {
          taskName: rec.assignment.native.taskName,
          sessionId: rec.assignment.native.sessionId,
          coordinatorTurnIds: [rec.assignment.native.coordinatorTurnId],
        },
        preparedAt: opts.at,
        fence,
        ignoredOutputs,
        ignoredBaseline,
        start: null,
        probes: [],
        binding: null,
        inflight: [],
        receipts: [],
        holds: [],
        stopObservations: [],
        interruptObservations: [],
        disclosure:
          "repository safeguard only: it does not detect every arbitrary shell write outside the assigned repository and is not OS filesystem or read isolation",
      },
    },
    {},
  );
  if (!admitted.clean || admitted.tracked.length > 0 || admitted.untracked.length > 0) {
    throw new NativeCodexFinding(
      "NATIVE_ADMISSION_DIRTY",
      `native-codex: assigned resource is not the clean admitted base: ${JSON.stringify(admitted.findings)}`,
    );
  }
  rec.native = {
    version: NATIVE_CODEX_VERSION,
    launch: {
      taskName: rec.assignment.native.taskName,
      sessionId: rec.assignment.native.sessionId,
      coordinatorTurnIds: [rec.assignment.native.coordinatorTurnId],
    },
    preparedAt: opts.at,
    fence,
    ignoredOutputs,
    ignoredBaseline,
    start: null,
    probes: [],
    binding: null,
    inflight: [],
    receipts: [],
    holds: [],
    stopObservations: [],
    interruptObservations: [],
    disclosure:
      "repository safeguard only: it does not detect every arbitrary shell write outside the assigned repository and is not OS filesystem or read isolation",
  };
  return rec;
}

/** @param {Record<string, any>} rec @returns {any} */
function nativeState(rec) {
  const raw = rec.native;
  if (!isObject(raw) || raw.version !== NATIVE_CODEX_VERSION) {
    throw new NativeCodexFinding(
      "NATIVE_AUTHORITY_UNREADABLE",
      `native-codex: attempt ${String(rec.attempt)} has unreadable native authority; unknown remains unknown.`,
    );
  }
  const native = /** @type {any} */ (raw);
  for (const field of ["probes", "inflight", "receipts", "holds", "stopObservations", "interruptObservations"]) {
    if (!Array.isArray(native[field])) {
      throw new NativeCodexFinding(
        "NATIVE_HOLD_UNREADABLE",
        `native-codex: attempt ${String(rec.attempt)} native ${field} is unreadable; collection and continuation refuse.`,
      );
    }
  }
  if (!Array.isArray(native.launch?.coordinatorTurnIds)) {
    throw new NativeCodexFinding(
      "NATIVE_HOLD_UNREADABLE",
      `native-codex: attempt ${String(rec.attempt)} coordinator turn authority is unreadable; collection and continuation refuse.`,
    );
  }
  return native;
}

/**
 * Full admitted-base-to-workspace inspection. The three tracked layers are
 * separate so a later reversal cannot hide an earlier committed or staged
 * out-of-fence change.
 *
 * @param {Record<string, any>} rec
 * @param {{ expectedRef?: string }} opts
 */
export function collectNativeWorkspace(rec, opts = {}) {
  const native = nativeState(rec);
  const root = exactGitRoot(rec.resource);
  const currentFence = readFence(root, native.fence.manifest);
  const findings = [];
  if (currentFence.digest !== native.fence.digest || JSON.stringify(currentFence.paths) !== JSON.stringify(native.fence.paths)) {
    findings.push({ code: "fence-authority-changed", manifest: native.fence.manifest });
  }
  const head = git(root, ["rev-parse", "HEAD"]).stdout.toString("utf8").trim();
  const expectedRef = opts.expectedRef;
  if (expectedRef !== undefined) {
    if (!/^[0-9a-f]{40}$/.test(expectedRef)) findings.push({ code: "reported-ref-unreadable", ref: expectedRef });
    else if (head !== expectedRef) findings.push({ code: "reported-ref-mismatch", expected: expectedRef, actual: head });
  }
  const ancestor = git(root, ["merge-base", "--is-ancestor", rec.assignment.base, head], { allowFailure: true });
  if (ancestor.status !== 0) findings.push({ code: "base-not-ancestor", base: rec.assignment.base, head });
  const layers = [
    {
      layer: "committed",
      entries: parseNativeRawDiff(
        git(root, ["diff", "--raw", "-z", "--find-renames", "--no-abbrev", rec.assignment.base, head, "--"]).stdout,
      ),
    },
    {
      layer: "staged",
      entries: parseNativeRawDiff(
        git(root, ["diff", "--raw", "-z", "--find-renames", "--no-abbrev", "--cached", "HEAD", "--"]).stdout,
      ),
    },
    {
      layer: "unstaged",
      entries: parseNativeRawDiff(
        git(root, ["diff", "--raw", "-z", "--find-renames", "--no-abbrev", "--"]).stdout,
      ),
    },
  ];
  const tracked = layers.flatMap(({ layer, entries }) => entries.map((entry) => ({ ...entry, layer })));
  for (const entry of tracked) {
    for (const rel of entry.paths) {
      if (!nativePathAllowed(rel, native.fence.paths)) {
        findings.push({ code: "tracked-out-of-fence", path: rel, status: entry.status, layer: entry.layer });
      }
    }
  }
  const untracked = nulPaths(git(root, ["ls-files", "--others", "--exclude-standard", "-z", "--"]).stdout).map(
    (rel) => ({ kind: "untracked", path: rel, type: nativeFileSignature(root, rel).type }),
  );
  for (const entry of untracked) {
    if (!nativePathAllowed(entry.path, native.fence.paths)) {
      findings.push({ code: "untracked-out-of-fence", path: entry.path, type: entry.type });
    }
  }
  const currentIgnored = nativeIgnoredSnapshot(root, native.ignoredOutputs);
  const before = signatureMap(native.ignoredBaseline);
  const after = signatureMap(currentIgnored);
  for (const rel of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    if (before.get(rel) !== after.get(rel)) {
      findings.push({
        code: "unexpected-ignored-output",
        path: rel,
        change: before.has(rel) ? (after.has(rel) ? "modified" : "deleted") : "added",
      });
    }
  }
  return {
    clean: findings.length === 0,
    base: rec.assignment.base,
    head,
    tracked,
    untracked,
    ignoredOutsidePolicy: currentIgnored,
    ignoredOutputs: [...native.ignoredOutputs],
    findings,
  };
}

/** @param {string} attempt */
function workOf(attempt) {
  const match = /^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a\d+$/.exec(attempt);
  if (match === null || match[1] === undefined) {
    throw new NativeCodexFinding("NATIVE_ATTEMPT", `native-codex: unreadable attempt id ${JSON.stringify(attempt)}.`);
  }
  return match[1];
}

/** @param {string} root @param {string} attempt */
export function nativeRecordPath(root, attempt) {
  return path.join(root, ".supertaskr", "runs", workOf(attempt), `${attempt}.json`);
}

/** @param {string} root @param {string} attempt */
function nativeEmergencyHoldPath(root, attempt) {
  return `${nativeRecordPath(root, attempt)}.native-hold`;
}

/** @param {string} file @param {unknown} value */
function atomicJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const fd = openSync(temp, "wx", 0o600);
  try {
    writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, file);
}

/**
 * If the attempt document cannot be parsed or validated, it cannot carry
 * its own hold. Preserve the unknown in a one-shot sidecar beside that exact
 * attempt. A later readable authority absorbs the sidecar into `native.holds`
 * before any event may proceed; T-311 reconciliation remains the only route
 * that may clear it.
 *
 * @param {string} root @param {string} attempt @param {unknown} error @param {string} at
 */
function persistUnreadableAuthority(root, attempt, error, at) {
  const file = nativeEmergencyHoldPath(root, attempt);
  if (existsSync(file)) return;
  mkdirSync(path.dirname(file), { recursive: true });
  const fd = openSync(file, "wx", 0o600);
  try {
    const problem = error instanceof Error ? error.message : String(error);
    writeFileSync(
      fd,
      `${JSON.stringify(
        {
          version: 1,
          attempt,
          key: `unreadable-authority:${attempt}`,
          code: "unreadable-authority",
          recordedAt: at,
          outcome: "unknown",
          problem,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** @param {string} root @param {string} attempt @param {Record<string, any>} rec */
function absorbUnreadableAuthority(root, attempt, rec) {
  const file = nativeEmergencyHoldPath(root, attempt);
  if (!existsSync(file)) return rec;
  let hold;
  try {
    hold = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new NativeCodexFinding(
      "NATIVE_HOLD_UNREADABLE",
      `native-codex: persisted unreadable-authority hold for ${attempt} is itself unreadable: ${String(error)}.`,
    );
  }
  if (!isObject(hold) || hold.attempt !== attempt || hold.code !== "unreadable-authority") {
    throw new NativeCodexFinding(
      "NATIVE_HOLD_UNREADABLE",
      `native-codex: persisted unreadable-authority hold for ${attempt} has an invalid shape.`,
    );
  }
  addNativeHold(rec, hold);
  writeNativeRecord(root, rec);
  unlinkSync(file);
  return rec;
}

/** @param {string} root @param {string} attempt */
export function readNativeRecord(root, attempt) {
  const file = nativeRecordPath(root, attempt);
  try {
    const rec = JSON.parse(readFileSync(file, "utf8"));
    nativeState(rec);
    return absorbUnreadableAuthority(root, attempt, rec);
  } catch (error) {
    persistUnreadableAuthority(root, attempt, error, new Date().toISOString());
    if (error instanceof NativeCodexFinding) throw error;
    throw new NativeCodexFinding(
      "NATIVE_AUTHORITY_UNREADABLE",
      `native-codex: attempt authority at ${file} is unreadable: ${String(error)}.`,
    );
  }
}

/** @param {string} root @param {Record<string, any>} rec */
export function writeNativeRecord(root, rec) {
  atomicJson(nativeRecordPath(root, rec.attempt), rec);
}

/** @param {string} root @param {{ at?: string }} [opts] */
export function allNativeRecords(root, opts = {}) {
  const runs = path.join(root, ".supertaskr", "runs");
  if (!existsSync(runs)) return [];
  const records = [];
  for (const work of readdirSync(runs)) {
    const dir = path.join(runs, work);
    if (work === "reservations" || !statSync(dir).isDirectory()) continue;
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith(".json")) continue;
      const attempt = name.slice(0, -".json".length);
      try {
        const rec = JSON.parse(readFileSync(path.join(dir, name), "utf8"));
        if (isObject(rec.native) && rec.native.version === NATIVE_CODEX_VERSION) {
          nativeState(rec);
          records.push(absorbUnreadableAuthority(root, attempt, rec));
        } else if (existsSync(nativeEmergencyHoldPath(root, attempt))) {
          throw new NativeCodexFinding(
            "NATIVE_AUTHORITY_UNREADABLE",
            `native-codex: ${attempt} has a persisted native authority hold but no readable native state.`,
          );
        }
      } catch (error) {
        persistUnreadableAuthority(root, attempt, error, opts.at ?? new Date().toISOString());
        throw error instanceof NativeCodexFinding
          ? error
          : new NativeCodexFinding(
              "NATIVE_AUTHORITY_UNREADABLE",
              `native-codex: attempt authority at ${path.join(dir, name)} is unreadable: ${String(error)}.`,
            );
      }
    }
  }
  return records;
}

/** @param {Record<string, any>} rec @param {Record<string, any>} hold */
export function addNativeHold(rec, hold) {
  const native = nativeState(rec);
  const key = string(hold.key);
  const code = string(hold.code);
  if (key === null || code === null) throw new NativeCodexFinding("NATIVE_HOLD", "native-codex: a hold needs key and code.");
  if (!native.holds.some((/** @type {any} */ entry) => entry.key === key)) {
    native.holds.push({ recordedAt: hold.recordedAt ?? new Date().toISOString(), clearedAt: null, ...hold, key, code });
  }
}

/** @param {Record<string, any>} rec */
export function activeNativeHolds(rec) {
  return nativeState(rec).holds.filter(
    (/** @type {any} */ hold) => hold.clearedAt === null || hold.clearedAt === undefined,
  );
}

/** @param {Record<string, any>} rec @param {string} at @param {string} why */
function clearReconciledHolds(rec, at, why) {
  for (const hold of activeNativeHolds(rec)) {
    if (
      [
        "unknown-worker",
        "duplicate-agent-attribution",
        "ambiguous-agent-attribution",
        "missing-agent-unrecognized-turn",
        "session-mismatch",
      ].includes(hold.code)
    ) {
      continue;
    }
    hold.clearedAt = at;
    hold.clearedBy = why;
  }
}

/** @param {unknown} response */
function responseText(response) {
  if (typeof response === "string") return response;
  if (!isObject(response)) return "";
  for (const key of ["output", "text", "stdout"]) {
    if (typeof response[key] === "string") return response[key];
  }
  return "";
}

/** @param {Record<string, any>} event */
function eventMeta(event) {
  return {
    event: string(event.hook_event_name),
    sessionId: string(event.session_id),
    turnId: string(event.turn_id),
    agentId: string(event.agent_id),
    toolName: string(event.tool_name),
    toolUseId: string(event.tool_use_id),
  };
}

/** @param {Record<string, any>} event @param {string} resource */
export function explicitResourceProblem(event, resource) {
  const tool = string(event.tool_name);
  const input = isObject(event.tool_input) ? event.tool_input : {};
  if (tool === "Bash") {
    const command = string(input.command);
    const prefix = `cd -- ${nativeShellQuote(path.resolve(resource))} && `;
    if (command === null || !command.startsWith(prefix) || command.length === prefix.length) {
      return (
        `Bash/unified exec must begin with ${prefix}<command>; hook payloads guarantee the command, ` +
        "not a separate workdir, and shared session cwd is not authority"
      );
    }
    return null;
  }
  if (tool === "apply_patch") {
    const command = string(input.command);
    if (command === null) return "apply_patch has no patch command to inspect";
    const targets = [];
    for (const line of command.split(/\r?\n/)) {
      const match = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/.exec(line) ?? /^\*\*\* Move to: (.+)$/.exec(line);
      if (match !== null && match[1] !== undefined) targets.push(match[1]);
    }
    if (targets.length === 0) return "apply_patch names no source or destination path";
    for (const target of targets) {
      if (!path.isAbsolute(target)) return `apply_patch path is not absolute: ${target}`;
      const resolved = path.resolve(target);
      const root = path.resolve(resource);
      if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
        return `apply_patch source/destination is outside assigned resource: ${target}`;
      }
    }
    return null;
  }
  return `unsupported mandatory tool ${String(tool)}`;
}

/** @param {Record<string, any>[]} records @param {string} agentId */
function routedRecords(records, agentId) {
  const bound = records.filter((rec) => rec.native.binding?.agentId === agentId);
  if (bound.length > 0) return bound;
  return records.filter((rec) => rec.native.start?.agentId === agentId);
}

/** @param {Record<string, any>} rec @param {string} at @param {string} phase @param {unknown} error */
function checkerHold(rec, at, phase, error) {
  const problem = error instanceof Error ? error.message : String(error);
  addNativeHold(rec, {
    key: `checker:${phase}:${nativeSha256(problem)}`,
    code: "checker-error",
    phase,
    problem,
    recordedAt: at,
  });
}

/** @param {Record<string, any>} rec @param {string} at @param {string} phase @param {any} check */
function findingHold(rec, at, phase, check) {
  addNativeHold(rec, {
    key: `check:${phase}:${nativeSha256(JSON.stringify(check.findings))}`,
    code: "cumulative-check-failed",
    phase,
    findings: check.findings,
    changesPreserved: true,
    recordedAt: at,
  });
}

/**
 * Map one supported Codex hook event through native identity to its T-311
 * attempt. Returns the exact JSON value the thin hook wrapper should emit,
 * or null for an allowed event with no output.
 *
 * @param {string} root
 * @param {Record<string, any>} event
 * @param {{ at?: string }} [opts]
 */
export function handleNativeEvent(root, event, opts = {}) {
  const at = opts.at ?? new Date().toISOString();
  const records = allNativeRecords(root, { at });
  const eventName = string(event.hook_event_name);
  const agentId = string(event.agent_id);
  const sessionId = string(event.session_id);

  if (eventName === "UserPromptSubmit") {
    const turnId = string(event.turn_id);
    if (agentId !== null || sessionId === null || turnId === null) {
      return { output: { systemMessage: "NATIVE HOLD: coordinator turn identity is unreadable." }, disposition: "coordinator-turn-held" };
    }
    for (const rec of records.filter((entry) => entry.native.launch.sessionId === sessionId)) {
      if (!rec.native.launch.coordinatorTurnIds.includes(turnId)) rec.native.launch.coordinatorTurnIds.push(turnId);
      writeNativeRecord(root, rec);
    }
    return { output: null, disposition: "coordinator-turn-recorded" };
  }

  if (agentId === null) {
    const turnId = string(event.turn_id);
    const sessionRecords = records.filter((entry) => entry.native.launch.sessionId === sessionId);
    if (sessionRecords.length === 0) {
      return { output: null, disposition: "no-native-attempt-for-parent-session" };
    }
    const authorized =
      turnId !== null &&
      sessionRecords.every((entry) => entry.native.launch.coordinatorTurnIds.includes(turnId));
    if (authorized) {
      if (eventName === "Interrupt") {
        for (const rec of sessionRecords) {
          nativeState(rec).interruptObservations.push({
            at,
            ...eventMeta(event),
            terminalStateClaimed: false,
            ownedJobsReconciled: false,
          });
          writeNativeRecord(root, rec);
        }
        return { output: {}, disposition: "interrupt-observed" };
      }
      return { output: null, disposition: "parent-event-not-worker-authority" };
    }
    for (const rec of sessionRecords) {
      addNativeHold(rec, {
        key: `missing-agent:${String(turnId)}:${String(eventName)}`,
        code: "missing-agent-unrecognized-turn",
        event: eventMeta(event),
        recordedAt: at,
      });
      writeNativeRecord(root, rec);
    }
    const reason = "NATIVE HOLD: missing agent_id is not an authorized coordinator identity for this exact session turn.";
    return {
      output:
        eventName === "PostToolUse"
          ? { decision: "block", reason }
          : {
              hookSpecificOutput: {
                hookEventName: "PreToolUse",
                permissionDecision: "deny",
                permissionDecisionReason: reason,
              },
            },
      disposition: "missing-agent-held",
    };
  }

  if (eventName === "SubagentStart") {
    const already = routedRecords(records, agentId);
    const pending = records.filter(
      (rec) => rec.native.launch.sessionId === sessionId && rec.native.start === null && rec.state === "reserved",
    );
    if (already.length > 0 || pending.length !== 1 || string(event.turn_id) === null) {
      const affected =
        already.length > 0
          ? [...new Set([...already, ...pending])]
          : records.filter((rec) => rec.native.launch.sessionId === sessionId);
      for (const rec of affected) {
        addNativeHold(rec, {
          key: `start-attribution:${agentId}:${String(event.turn_id)}`,
          code: already.length > 0 ? "duplicate-agent-attribution" : "ambiguous-agent-attribution",
          event: eventMeta(event),
          recordedAt: at,
        });
        writeNativeRecord(root, rec);
      }
      return {
        output: { systemMessage: "NATIVE HOLD: callback identity could not be attributed to exactly one admitted launch." },
        disposition: "start-held",
      };
    }
    const rec = /** @type {Record<string, any>} */ (pending[0]);
    rec.native.start = {
      agentId,
      sessionId,
      turnId: string(event.turn_id),
      observedAt: at,
    };
    addNativeHold(rec, {
      key: `registration:${agentId}`,
      code: "registration-pending",
      agentId,
      clearableOnlyByExactBinding: true,
      recordedAt: at,
    });
    writeNativeRecord(root, rec);
    return {
      output: {
        hookSpecificOutput: {
          hookEventName: "SubagentStart",
          additionalContext:
            `Native registration is pending. Before repository tool use, run exactly \`${NATIVE_IDENTITY_PROBE}\`, ` +
            "report the value and canonical task name to the coordinator, then wait for explicit binding.",
        },
      },
      disposition: "start-recorded",
    };
  }

  const routed = routedRecords(records, agentId);
  if (routed.length !== 1) {
    const affected = records.filter((rec) => rec.native.launch.sessionId === sessionId);
    for (const rec of affected) {
      addNativeHold(rec, {
        key: `unknown-worker:${agentId}:${String(eventName)}`,
        code: routed.length > 1 ? "duplicate-agent-attribution" : "unknown-worker",
        event: eventMeta(event),
        recordedAt: at,
      });
      writeNativeRecord(root, rec);
    }
    const reason = "NATIVE HOLD: event does not map to exactly one admitted native attempt; cwd and task labels are not authority.";
    return {
      output:
        eventName === "PostToolUse"
          ? { decision: "block", reason }
          : {
              hookSpecificOutput: {
                hookEventName: "PreToolUse",
                permissionDecision: "deny",
                permissionDecisionReason: reason,
              },
            },
      disposition: "unknown-held",
    };
  }
  const rec = /** @type {Record<string, any>} */ (routed[0]);
  const native = nativeState(rec);

  if (sessionId !== native.launch.sessionId) {
    addNativeHold(rec, {
      key: `session-mismatch:${String(sessionId)}:${String(eventName)}`,
      code: "session-mismatch",
      event: eventMeta(event),
      recordedAt: at,
    });
    writeNativeRecord(root, rec);
    const reason = "NATIVE HOLD: bound agent_id arrived through a session other than its admitted launch session.";
    return {
      output:
        eventName === "PostToolUse"
          ? { decision: "block", reason }
          : {
              hookSpecificOutput: {
                hookEventName: "PreToolUse",
                permissionDecision: "deny",
                permissionDecisionReason: reason,
              },
            },
      disposition: "session-held",
    };
  }

  if (eventName === "SubagentStop") {
    native.stopObservations.push({ at, ...eventMeta(event), terminalStateClaimed: false, ownedJobsReconciled: false });
    writeNativeRecord(root, rec);
    return { output: {}, disposition: "stop-observed-only" };
  }

  if (eventName !== "PreToolUse" && eventName !== "PostToolUse") {
    addNativeHold(rec, {
      key: `unsupported-event:${String(eventName)}`,
      code: "unsupported-mandatory-event",
      event: eventMeta(event),
      recordedAt: at,
    });
    writeNativeRecord(root, rec);
    return { output: { systemMessage: `NATIVE HOLD: unsupported mandatory event ${String(eventName)}.` }, disposition: "unsupported-held" };
  }

  const tool = string(event.tool_name);
  const toolUseId = string(event.tool_use_id);
  const turnId = string(event.turn_id);
  const input = isObject(event.tool_input) ? event.tool_input : {};
  if (native.binding === null) {
    const exactProbe = tool === "Bash" && string(input.command) === NATIVE_IDENTITY_PROBE;
    if (eventName === "PreToolUse" && exactProbe && toolUseId !== null && turnId === native.start?.turnId) {
      if (native.probes.some((/** @type {any} */ probe) => probe.toolUseId === toolUseId)) {
        addNativeHold(rec, { key: `probe-duplicate:${toolUseId}`, code: "duplicate-probe", recordedAt: at });
      } else {
        native.probes.push({ agentId, turnId, toolUseId, command: NATIVE_IDENTITY_PROBE, preAt: at, postAt: null, reportedThreadId: null });
      }
      writeNativeRecord(root, rec);
      return { output: null, disposition: "identity-probe-pre" };
    }
    if (eventName === "PostToolUse" && exactProbe && toolUseId !== null) {
      const probe = native.probes.find(
        (/** @type {any} */ entry) =>
          entry.agentId === agentId && entry.turnId === turnId && entry.toolUseId === toolUseId && entry.postAt === null,
      );
      if (probe !== undefined) {
        const reported = responseText(event.tool_response).trim().split(/\s+/)[0] ?? "";
        probe.postAt = at;
        probe.reportedThreadId = reported;
        writeNativeRecord(root, rec);
        return { output: null, disposition: "identity-probe-post" };
      }
    }
    addNativeHold(rec, {
      key: `registration:${agentId}`,
      code: eventName === "PostToolUse" ? "unbound-completion" : "registration-pending",
      event: eventMeta(event),
      recordedAt: at,
    });
    writeNativeRecord(root, rec);
    const reason = `NATIVE REGISTRATION HOLD: agent ${agentId} is not explicitly bound; only the exact identity probe is allowed.`;
    return {
      output:
        eventName === "PostToolUse"
          ? { decision: "block", reason }
          : {
              hookSpecificOutput: {
                hookEventName: "PreToolUse",
                permissionDecision: "deny",
                permissionDecisionReason: reason,
              },
            },
      disposition: "unbound-held",
    };
  }

  if (eventName === "PreToolUse") {
    if (activeNativeHolds(rec).length > 0) {
      const reason = `NATIVE HOLD: ${activeNativeHolds(rec).length} persistent hold(s) require coordinator reconciliation.`;
      return {
        output: {
          hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
        },
        disposition: "held-before-tool",
      };
    }
    if (rec.execution === null || rec.execution.endedAt !== null || rec.state === "reserved") {
      addNativeHold(rec, {
        key: `execution-not-bound:${String(toolUseId)}`,
        code: "execution-not-bound",
        event: eventMeta(event),
        recordedAt: at,
      });
      writeNativeRecord(root, rec);
      return {
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: "NATIVE HOLD: the native identity is not attached to a current T-311 execution.",
          },
        },
        disposition: "execution-held",
      };
    }
    if (toolUseId === null || turnId === null || tool === null || !NATIVE_SUPPORTED_TOOLS.includes(tool)) {
      addNativeHold(rec, { key: "missing-tool-identity", code: "missing-tool-identity", event: eventMeta(event), recordedAt: at });
    } else {
      const resourceProblem = explicitResourceProblem(event, rec.resource);
      if (resourceProblem !== null) {
        addNativeHold(rec, {
          key: `explicit-resource:${toolUseId}`,
          code: "writer-resource-not-explicit",
          problem: resourceProblem,
          recordedAt: at,
        });
      } else {
        try {
          const check = collectNativeWorkspace(rec, {});
          if (!check.clean) findingHold(rec, at, "pre", check);
          else if (native.inflight.some((/** @type {any} */ entry) => entry.toolUseId === toolUseId)) {
            addNativeHold(rec, { key: `duplicate-inflight:${toolUseId}`, code: "duplicate-inflight", recordedAt: at });
          } else {
            native.inflight.push({ agentId, turnId, toolName: tool, toolUseId, preAt: at, preCheckDigest: nativeSha256(JSON.stringify(check)) });
          }
        } catch (error) {
          checkerHold(rec, at, "pre", error);
        }
      }
    }
    writeNativeRecord(root, rec);
    if (activeNativeHolds(rec).length > 0) {
      const reason = `NATIVE HOLD: pre-command admission failed; ${activeNativeHolds(rec).length} hold(s) persisted.`;
      return {
        output: {
          hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
        },
        disposition: "pre-held",
      };
    }
    return { output: null, disposition: "pre-admitted" };
  }

  const inflight = native.inflight.find((/** @type {any} */ entry) => entry.toolUseId === toolUseId);
  if (
    inflight === undefined ||
    inflight.agentId !== agentId ||
    inflight.turnId !== turnId ||
    inflight.toolName !== tool
  ) {
    addNativeHold(rec, {
      key: `completion-mismatch:${String(toolUseId)}`,
      code: inflight === undefined ? "post-without-matching-pre" : "completion-mismatch",
      expected: inflight ?? null,
      actual: eventMeta(event),
      recordedAt: at,
    });
    writeNativeRecord(root, rec);
    return {
      output: { decision: "block", reason: "NATIVE HOLD: completion has no exact persisted pre-command match." },
      disposition: "post-held",
    };
  }
  let check = null;
  try {
    check = collectNativeWorkspace(rec, {});
    if (!check.clean) findingHold(rec, at, "post", check);
  } catch (error) {
    checkerHold(rec, at, "post", error);
  }
  native.receipts.push({
    actualPostCallback: true,
    completedAt: at,
    pre: inflight,
    check,
  });
  native.inflight = native.inflight.filter((/** @type {any} */ entry) => entry.toolUseId !== toolUseId);
  writeNativeRecord(root, rec);
  if (activeNativeHolds(rec).length > 0) {
    return {
      output: {
        decision: "block",
        reason:
          `NATIVE HOLD: completed operation left ${activeNativeHolds(rec).length} persistent hold(s); ` +
          "changes are preserved and this is not proof that the task or its owned jobs stopped.",
      },
      disposition: "post-held",
    };
  }
  return { output: null, disposition: "post-clean" };
}

/**
 * Close the native half of T-311 bind from the recorded callback and actual
 * completed identity probe. The ordinary `bindRun` writes the execution.
 *
 * @param {string} root
 * @param {Record<string, any>} rec
 * @param {{ harnessId: string, at: string }} opts
 */
export function bindNativeIdentity(root, rec, opts) {
  if (rec.assignment?.native === null || rec.assignment?.native === undefined) return rec;
  const native = nativeState(rec);
  const agentId = string(opts.harnessId);
  if (native.binding !== null) {
    if (native.binding.agentId === agentId) return rec;
    throw new NativeCodexFinding("NATIVE_ALREADY_BOUND", "native-codex: attempt is already bound to another identity tuple.");
  }
  if (agentId === null || native.start?.agentId !== agentId) {
    throw new NativeCodexFinding(
      "NATIVE_BIND_MISMATCH",
      "native-codex: the coordinator's explicit bind must name the pending SubagentStart callback agent_id.",
    );
  }
  const startTurnId = string(native.start.turnId);
  const probes = native.probes.filter(
    (/** @type {any} */ probe) =>
      probe.agentId === agentId &&
      probe.turnId === startTurnId &&
      probe.postAt !== null &&
      probe.reportedThreadId === agentId,
  );
  if (probes.length !== 1) {
    throw new NativeCodexFinding(
      "NATIVE_BIND_PROBE",
      `native-codex: exact binding needs one completed identity probe; found ${probes.length}.`,
    );
  }
  for (const other of allNativeRecords(root)) {
    if (other.attempt !== rec.attempt && other.native.binding?.agentId === agentId) {
      throw new NativeCodexFinding(
        "NATIVE_AGENT_TAKEN",
        `native-codex: agent_id ${agentId} is already bound to ${other.attempt}.`,
      );
    }
  }
  native.binding = {
    agentId,
    canonicalTaskName: native.launch.taskName,
    childReportedThreadId: agentId,
    startTurnId,
    identityProbeToolUseId: /** @type {any} */ (probes[0]).toolUseId,
    boundAt: opts.at,
    correlationMethod: "explicit coordinator bind + recorded launch intent + callback agent_id + exact completed identity probe",
  };
  for (const hold of native.holds) {
    if (hold.code === "registration-pending" && hold.agentId === agentId && (hold.clearedAt === null || hold.clearedAt === undefined)) {
      hold.clearedAt = opts.at;
      hold.clearedBy = "exact native binding";
    }
  }
  return rec;
}

/**
 * Independent final gate used before reservation release, collect and
 * continue. A clean callback receipt is deliberately insufficient.
 *
 * @param {Record<string, any>} rec
 * @param {{ phase: "release" | "collect" | "continue", expectedRef?: string, at: string, lifecycleReconciled: boolean, aliveJobs: string[] }} opts
 */
export function nativeFinalGate(rec, opts) {
  if (rec.assignment?.native === null || rec.assignment?.native === undefined) {
    return { eligible: true, phase: opts.phase, check: null, inflight: [], holds: [], ownedJobs: opts.aliveJobs };
  }
  const native = nativeState(rec);
  let check = null;
  const reportedRefRequired = opts.phase === "collect" || opts.phase === "continue";
  const reportedRefPresent = opts.expectedRef !== undefined && opts.expectedRef !== "";
  if (reportedRefRequired && !reportedRefPresent) {
    addNativeHold(rec, {
      key: `reported-ref-required:${opts.phase}`,
      code: "reported-ref-required",
      phase: opts.phase,
      recordedAt: opts.at,
    });
  }
  try {
    check = collectNativeWorkspace(
      rec,
      reportedRefPresent ? { expectedRef: /** @type {string} */ (opts.expectedRef) } : {},
    );
    if (!check.clean) findingHold(rec, opts.at, `final-${opts.phase}`, check);
  } catch (error) {
    checkerHold(rec, opts.at, `final-${opts.phase}`, error);
  }
  const missingCompletions = [...native.inflight];
  if (missingCompletions.length > 0) {
    addNativeHold(rec, {
      key: `incomplete-operation:${opts.phase}:${missingCompletions.map((entry) => entry.toolUseId).join(",")}`,
      code: "incomplete-operation",
      phase: opts.phase,
      inflight: missingCompletions.map((entry) => entry.toolUseId),
      recordedAt: opts.at,
    });
    if (opts.lifecycleReconciled && opts.aliveJobs.length === 0) {
      for (const inflight of missingCompletions) {
        native.receipts.push({
          actualPostCallback: false,
          completedAt: null,
          pre: inflight,
          check: null,
          reconciledAt: opts.at,
          outcome: "unknown",
          evidence:
            `T-311 independently reconciled native cessation and owned jobs at ${opts.phase}; ` +
            "the missing PostToolUse remains recorded as missing and is not a successful receipt",
        });
      }
      native.inflight = [];
    }
  }
  if (opts.aliveJobs.length > 0) {
    addNativeHold(rec, {
      key: `owned-jobs:${opts.phase}:${opts.aliveJobs.join(",")}`,
      code: "owned-jobs-live",
      phase: opts.phase,
      jobs: opts.aliveJobs,
      recordedAt: opts.at,
    });
  }
  if (
    check?.clean === true &&
    native.inflight.length === 0 &&
    opts.lifecycleReconciled &&
    opts.aliveJobs.length === 0 &&
    (!reportedRefRequired || reportedRefPresent)
  ) {
    clearReconciledHolds(rec, opts.at, `T-311 lifecycle and owned-job reconciliation at native ${opts.phase}`);
  }
  const holds = activeNativeHolds(rec);
  const eligible =
    check?.clean === true &&
    native.inflight.length === 0 &&
    holds.length === 0 &&
    opts.lifecycleReconciled &&
    opts.aliveJobs.length === 0 &&
    (!reportedRefRequired || reportedRefPresent);
  return {
    eligible,
    phase: opts.phase,
    checkedAt: opts.at,
    actualIndependentCheck: true,
    check,
    inflight: native.inflight.map((/** @type {any} */ entry) => entry.toolUseId),
    holds: holds.map((/** @type {any} */ hold) => ({ key: hold.key, code: hold.code })),
    ownedJobs: [...opts.aliveJobs],
    terminalStateAuthority: "T-311",
  };
}
