import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { captureQualifiedInputs, deriveQualifiedScope, qualifiedContent, qualifiedIdentity } from "../scripts/qualified-reservation.mjs";
import { acquireQualifiedReservation, readQualifiedReservation, releaseQualifiedReservation, releaseReservation,
  qualifiedReservationPath, reservationPath, takeReservation } from "../scripts/run-record.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const ENV = { ...process.env, GIT_AUTHOR_NAME: "Qualified fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Qualified fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
const CARD = "docs/tasks/T-999-qualified.md";
const COMPONENT = "docs/architecture/components/C-01-mixed.md";
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, file: string, text: string) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text);
}
function commit(root: string, message: string) {
  git(root, ["add", ".", ":(exclude).supertaskr"]); git(root, ["commit", "-qm", message]); return git(root, ["rev-parse", "HEAD"]);
}
function card(touches: string) {
  return `---\nid: T-999\ntitle: Qualified fixture\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: M\nstatus: planned\ntouches: [${touches}]\n---\n\nOwned fixture contract.\n\n## Acceptance criteria\n\n- WHEN acquired THE complete set SHALL be reserved.\n\n## Implementation notes\n\n## Verdicts\n`;
}
function fixture(colocated = false, recordsLeaf = "records") {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "qualified-T-351-")));
  const product = path.join(dir, "product"); const records = colocated ? product : path.join(dir, recordsLeaf);
  for (const root of new Set([product, records])) {
    mkdirSync(root, { recursive: true }); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, "src/file", "base product\n"); put(root, "rules/file", "base records\n");
    put(root, "other/file", "disjoint\n");
    put(root, CARD, card("mixed"));
    put(root, COMPONENT, '---\nid: C-01\nname: Mixed\npaths: ["product::src/**", "records::rules/**"]\ntouch_slugs: [mixed]\n---\n');
    commit(root, "independent root");
  }
  if (!colocated) put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", product: {
    objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const recordsBase = commit(records, "association");
  const productBase = git(product, ["rev-parse", "HEAD"]);
  let serial = 0;
  function worker(role: "product"|"records", base = role === "product" ? productBase : recordsBase) {
    const checkout = path.join(dir, `worker-${role}-${++serial}`);
    git(role === "product" ? product : records, ["worktree", "add", "--detach", checkout, base]); return checkout;
  }
  function request(attempt = "T-999-a1", touches?: string, bindings?: any[]) {
    let nextRecords = recordsBase;
    if (touches !== undefined) { put(records, CARD, card(touches)); nextRecords = commit(records, `contract ${serial++}`); }
    const revisions = { product: colocated ? nextRecords : productBase, records: nextRecords };
    const capture = { authorityRoot: product, projectId: "qualified-fixture", revisions, taskId: "T-999", legacyTokenMap: {} };
    const receipt = captureQualifiedInputs(capture).receipt;
    const workers = bindings ?? [
      { role: "product", checkout: worker("product", revisions.product), base: revisions.product },
      { role: "records", checkout: worker("records", revisions.records), base: revisions.records },
    ];
    return { version: 1, ...capture, attempt, receipt, workers };
  }
  return { dir, product, records, productBase, recordsBase, worker, request, cleanup: () => removeGitFixture(dir, "qualified T-351") };
}
async function release(root: string, acquired: any) {
  return await releaseQualifiedReservation(root, { attempt: acquired.reservation.attempt, expectedIdentity: acquired.reservation.identity });
}
function files(root: string) {
  const home = path.join(root, ".supertaskr/runs/reservations"); return existsSync(home) ? readdirSync(home).sort() : [];
}

test("qualified acquisition freezes complete committed receipts and mixed containment across actual worker checkouts", async () => {
  const fx = fixture();
  try {
    const request = fx.request(); const first = await acquireQualifiedReservation(fx.product, request);
    expect(first.reservation.scope.fence.paths.map((entry: any) => [entry.role, entry.domain, entry.component])).toEqual([
      ["product", "src", "C-01"], ["records", "rules", "C-01"],
    ]);
    expect(first.reservation.scope.receipt.cardBlobId).toBe(git(fx.records, ["rev-parse", `${fx.recordsBase}:${CARD}`]));
    expect(first.reservation.scope.workers).toHaveLength(2);
    expect(first.reservation.scope.workers[0].identity.gitCommonDirectory).toBe(realpathSync(path.join(fx.product, ".git")));
    // A nested file collides with the component directory in another worker.
    const collision = fx.request("T-999-a2", "product::src/file, records::other/file");
    await expect(acquireQualifiedReservation(fx.product, collision)).rejects.toThrow(/QUALIFIED_CONFLICT/);
    expect(files(fx.product)).toEqual([path.basename(first.file)]);
    const disjoint = fx.request("T-999-a3", "product::other/file, records::other/file");
    const second = await acquireQualifiedReservation(fx.product, disjoint);
    expect(files(fx.product)).toHaveLength(2); expect(await release(fx.product, second)).toBe(true); expect(await release(fx.product, first)).toBe(true);
  } finally { fx.cleanup(); }
});

test("qualified domains separate independent roles while colocated aliases and reused workers collide", async () => {
  for (const colocated of [false, true]) {
    const fx = fixture(colocated);
    try {
      const a = await acquireQualifiedReservation(fx.product, fx.request("T-999-a1", "product::other/file"));
      const b = fx.request("T-999-a2", "records::other/file");
      if (colocated) await expect(acquireQualifiedReservation(fx.product, b)).rejects.toThrow(/QUALIFIED_CONFLICT/);
      else { const acquired = await acquireQualifiedReservation(fx.product, b); expect(await release(fx.product, acquired)).toBe(true); }
      expect(await release(fx.product, a)).toBe(true);
      const original = fx.request("T-999-a3", "product::src/file");
      const c = await acquireQualifiedReservation(fx.product, original);
      const reused = fx.request("T-999-a4", "product::other/file");
      git(original.workers[0]!.checkout, ["reset", "--hard", reused.revisions.product]);
      reused.workers[0] = { ...original.workers[0]!, base: reused.revisions.product };
      await expect(acquireQualifiedReservation(fx.product, reused)).rejects.toThrow(/QUALIFIED_CONFLICT/);
      expect(await release(fx.product, c)).toBe(true);
    } finally { fx.cleanup(); }
  }
});

test("qualified validation refuses drift bases duplicate roles unsafe domains and alternate authority before publication", async () => {
  const fx = fixture();
  try {
    const good = fx.request(); const control = await acquireQualifiedReservation(fx.product, good); await release(fx.product, control);
    const changed = JSON.parse(JSON.stringify(good)); changed.receipt.cardBlobId = "0".repeat(40);
    const bad: any[] = [changed, { ...good, version: 2 }, { ...good, projectId: "foreign" },
      { ...good, expandedPaths: [] }, { ...good, workers: [...good.workers, good.workers[0]] },
      { ...good, workers: [{ ...good.workers[0], base: fx.recordsBase }, good.workers[1]] },
      { ...good, workers: [{ ...good.workers[0], checkout: fx.records }, good.workers[1]] },
      { ...good, workers: [good.workers[0]] }, { ...good, revisions: { ...good.revisions, product: "HEAD" } },
      { ...good, authorityRoot: good.workers[0]!.checkout }];
    for (const request of bad) { await expect(acquireQualifiedReservation(fx.product, request)).rejects.toThrow(); expect(files(fx.product)).toEqual([]); }
    put(good.workers[0]!.checkout, "advance", "worker commit\n"); commit(good.workers[0]!.checkout, "advance before first acquisition");
    await expect(acquireQualifiedReservation(fx.product, good)).rejects.toThrow(/qualified-worker-base/);
    const reset = git(good.workers[0]!.checkout, ["reset", "--hard", fx.productBase]); expect(reset).toBeTruthy();
    const changedRegistry = JSON.parse(JSON.stringify(good)); changedRegistry.receipt.registry[0].blobId = "0".repeat(40);
    await expect(acquireQualifiedReservation(fx.product, changedRegistry)).rejects.toThrow(/qualified-changed/);
    const domain = path.join(good.workers[0]!.checkout, "src/file"); rmSync(domain); symlinkSync(path.join(fx.dir, "outside"), domain);
    await expect(acquireQualifiedReservation(fx.product, good)).rejects.toThrow(/qualified-symlink-domain/); expect(files(fx.product)).toEqual([]);
    for (const touches of ["product::../escape", "product::.git/config", "unknown::src/file"]) expect(() => fx.request("T-999-a2", touches)).toThrow(/qualified-fence/);
    const shared = fx.worker("product");
    put(shared, WORKSPACE_ASSOCIATION_REL_PATH, readFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), "utf8"));
    const sharedBase = commit(shared, "shared common directory records");
    put(fx.product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: fx.product, recordsRoot: shared }));
    expect(() => captureQualifiedInputs({ ...good, revisions: { product: fx.productBase, records: sharedBase } })).toThrow(/shared-common-directory/);
  } finally { fx.cleanup(); }
  const nested = fixture(false, "product/nested-records");
  try { expect(() => nested.request()).toThrow(/nested-roots/); } finally { nested.cleanup(); }
});

test("qualified colocated role bindings normalize one worker and refuse incompatible alias origins", async () => {
  const fx = fixture(true);
  try {
    const checkout = fx.worker("product");
    const bindings = ["product", "records"].map((role) => ({ role, checkout, base: fx.productBase }));
    const request = fx.request("T-999-a1", undefined, bindings);
    const one = await acquireQualifiedReservation(fx.product, request);
    expect(one.reservation.scope.workers).toHaveLength(1);
    expect(one.reservation.scope.workers[0].roles).toEqual(["product", "records"]);
    expect(one.reservation.scope.fence.paths.map((entry: any) => entry.domain)).toEqual(["src", "rules"]);
    expect(await release(fx.product, one)).toBe(true);
    put(fx.product, "different", "new origin\n"); const later = commit(fx.product, "different alias origin");
    const incompatible = fx.request("T-999-a2", undefined, [{ role: "product", checkout, base: fx.productBase }, { role: "records", checkout, base: later }]);
    incompatible.revisions.records = later;
    incompatible.receipt = captureQualifiedInputs(incompatible).receipt;
    await expect(acquireQualifiedReservation(fx.product, incompatible)).rejects.toThrow(/qualified-worker-(?:alias-base|base)/);
    expect(() => deriveQualifiedScope(incompatible, { retained: true })).toThrow(/qualified-worker-alias-base/);
    expect(files(fx.product)).toEqual([]);
  } finally { fx.cleanup(); }
});

test("qualified repeat read and exact release survive worker HEAD advancement but retain immutable identity", async () => {
  const fx = fixture();
  try {
    const request = fx.request(); const acquired = await acquireQualifiedReservation(fx.product, request, { pid: 999999 });
    for (const worker of request.workers) { put(worker.checkout, "normal-progress", worker.role); commit(worker.checkout, "legitimate worker progress"); }
    expect((await readQualifiedReservation(fx.product, request.attempt))?.scope).toEqual(acquired.reservation.scope);
    const repeated = await acquireQualifiedReservation(fx.product, request, { pid: 1, at: "2030-01-01T00:00:00.000Z" });
    expect(repeated.repeated).toBe(true); expect(repeated.reservation).toEqual(acquired.reservation);
    const other = fx.request("T-999-a2", "product::src/file");
    await expect(acquireQualifiedReservation(fx.product, other)).rejects.toThrow(/QUALIFIED_CONFLICT/);
    const changed = fx.request("T-999-a1", "product::other/file");
    await expect(acquireQualifiedReservation(fx.product, changed)).rejects.toThrow(/QUALIFIED_CHANGED/);
    expect(await releaseQualifiedReservation(fx.product, { attempt: "T-999-a2", expectedIdentity: acquired.reservation.identity })).toBe(false);
    await expect(releaseQualifiedReservation(fx.product, { attempt: request.attempt, expectedIdentity: "foreign" })).rejects.toThrow(/QUALIFIED_NOT_OURS/);
    expect(files(fx.product)).toHaveLength(1); expect(await release(fx.product, acquired)).toBe(true); expect(await readQualifiedReservation(fx.product, request.attempt)).toBeNull();
  } finally { fx.cleanup(); }
});

test("qualified retained readers reconstruct narrowed scope changed binding malformed authority and committed receipt", async () => {
  const fx = fixture();
  try {
    const request = fx.request(); const acquired = await acquireQualifiedReservation(fx.product, request);
    const original = readFileSync(acquired.file, "utf8");
    const narrow = JSON.parse(original); narrow.scope.fence.paths.pop(); narrow.identity = qualifiedIdentity(narrow.scope);
    const changedBinding = JSON.parse(original); changedBinding.request.workers[0].checkout = fx.worker("product");
    const changedReceipt = JSON.parse(original); changedReceipt.request.receipt.registry[0].blobId = "0".repeat(40);
    for (const authority of [JSON.stringify(narrow), JSON.stringify(changedBinding), JSON.stringify(changedReceipt), "{", JSON.stringify({ ...JSON.parse(original), version: 99 })]) {
      writeFileSync(acquired.file, authority);
      await expect(readQualifiedReservation(fx.product, request.attempt)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      await expect(acquireQualifiedReservation(fx.product, fx.request("T-999-a2"))).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      expect(() => takeReservation(fx.product, { resource: fx.worker("product"), attempt: "T-998-a1", role: "executor", at: new Date().toISOString() })).toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      await expect(release(fx.product, acquired)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      expect(readFileSync(acquired.file, "utf8")).toBe(authority);
    }
    writeFileSync(acquired.file, original);
    put(fx.product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "changed", productRoot: fx.product, recordsRoot: fx.records }));
    await expect(readQualifiedReservation(fx.product, request.attempt)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
    put(fx.product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: fx.product, recordsRoot: fx.records }));
    expect(qualifiedContent(await readQualifiedReservation(fx.product, request.attempt))).toBe(qualifiedContent(acquired.reservation));
    const oid = request.receipt.cardBlobId;
    const objectFile = path.join(fx.records, ".git/objects", oid.slice(0, 2), oid.slice(2));
    const objectBytes = readFileSync(objectFile); rmSync(objectFile);
    await expect(readQualifiedReservation(fx.product, request.attempt)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
    await expect(release(fx.product, acquired)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
    expect(readFileSync(acquired.file, "utf8")).toBe(original);
    writeFileSync(objectFile, objectBytes);
    expect(await release(fx.product, acquired)).toBe(true);
  } finally { fx.cleanup(); }
});

test("qualified second-root and legacy conflicts in both orders leave no partial grant and preserve release ownership", async () => {
  const fx = fixture();
  try {
    const first = await acquireQualifiedReservation(fx.product, fx.request("T-999-a1", "records::rules/file"));
    const two = fx.request("T-999-a2", "product::other/file, records::rules/file");
    await expect(acquireQualifiedReservation(fx.product, two)).rejects.toThrow(/QUALIFIED_CONFLICT/);
    expect(files(fx.product)).toEqual([path.basename(first.file)]);
    expect(await release(fx.product, first)).toBe(true);
    for (const role of ["product", "records"] as const) {
      const request = fx.request(); const resource = fx.worker(role);
      const legacy = { resource, attempt: "T-998-a1", role: "executor", at: new Date().toISOString() };
      takeReservation(fx.product, legacy);
      await expect(acquireQualifiedReservation(fx.product, request)).rejects.toThrow(/QUALIFIED_CONFLICT/);
      expect(files(fx.product)).toEqual([path.basename(reservationPath(fx.product, resource))]);
      expect(releaseReservation(fx.product, legacy)).toBe(true);
      const qualified = await acquireQualifiedReservation(fx.product, request);
      const cold = execFileSync(process.execPath, ["--input-type=module", "-e", `
        const api=await import(${JSON.stringify(new URL("../scripts/run-record.mjs", import.meta.url).href)});
        try{api.takeReservation(${JSON.stringify(fx.product)},${JSON.stringify(legacy)});throw Error('cold legacy admitted');}
        catch(err){if(err.code!=='QUALIFIED_CONFLICT')throw err;console.log(err.code);}
      `], { encoding: "utf8", env: ENV });
      expect(cold.trim()).toBe("QUALIFIED_CONFLICT");
      expect(() => takeReservation(fx.product, legacy)).toThrow(/QUALIFIED_CONFLICT/);
      expect(releaseReservation(fx.product, legacy)).toBe(false);
      expect(await readQualifiedReservation(fx.product, request.attempt)).toBeTruthy(); expect(await release(fx.product, qualified)).toBe(true);
    }
    const staleResource = fx.worker("product");
    const staleFile = reservationPath(fx.product, staleResource); put(fx.product, path.relative(fx.product, staleFile), "{}");
    await expect(acquireQualifiedReservation(fx.product, fx.request())).rejects.toThrow(/RESERVATION_UNREADABLE/);
    expect(readFileSync(staleFile, "utf8")).toBe("{}");
  } finally { fx.cleanup(); }
});

/** Every child terminates and is joined. Runtime rewriting is confined to its
 * isolated module view; no repository source or external authority is written.
 */
async function children(root: string, requests: any[], control: "none"|"serialization"|"conflicts") {
  const sourceUrl = new URL("../scripts/run-record.mjs", import.meta.url).href;
  const program = `
    import {registerHooks} from 'node:module';import fs from 'node:fs';
    const root=${JSON.stringify(root)}, control=${JSON.stringify(control)};
    registerHooks({load(url,context,next){const found=next(url,context);if(url!==${JSON.stringify(sourceUrl)})return found;
      let source=found.source.toString();
      const lock='return withNativeTransaction(root, { operation: "qualified-acquire" }, () => {';
      const conflict='set !== existing && validation.qualifiedSetsConflict(scope, set.scope)';
      if(control!=='none'&&(!source.includes(lock)||!source.includes(conflict)))throw Error('guard control site absent');
      if(control==='serialization'){
        source=source.replace(lock,'return ((root, opts, body) => body())(root, { operation: "qualified-acquire" }, () => {');
        const site='if (existing) return { file: existing.file, reservation: existing.reservation, repeated: true };';
        if(!source.includes(site))throw Error('interleaving site absent');
        source=source.replace(site,site+'\\n process.send({checked:true}); const barrier=root+"/barrier-T-351"; const until=Date.now()+10000; while(!existsSync(barrier)){if(Date.now()>until)throw Error("barrier timeout");Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}');
      }
      if(control==='conflicts')source=source.replace(conflict,'false');
      return {...found,source};}});
    const api=await import(${JSON.stringify(sourceUrl)});
    process.send({ready:true});process.once('message',async request=>{try{const acquired=await api.acquireQualifiedReservation(root,request);process.send({ok:true,attempt:acquired.reservation.attempt});}catch(err){process.send({ok:false,error:String(err)});}process.disconnect();});
  `;
  const results: any[] = []; const processes: ReturnType<typeof spawn>[] = [];
  let ready = 0; let checked = 0;
  const barrier = path.join(root, "barrier-T-351");
  try {
    await Promise.all(requests.map((request) => new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", program], { env: ENV, stdio: ["ignore", "pipe", "pipe", "ipc"] });
      processes.push(child); let stderr = ""; child.stderr!.on("data", (text) => { stderr += text; });
      child.on("message", (value: any) => {
        if (value.ready && ++ready === requests.length) processes.forEach((p, index) => p.send!(requests[index]));
        if (value.checked && ++checked === requests.length) writeFileSync(barrier, "release fixture barrier");
        if (value.ok !== undefined) results.push(value);
      });
      child.once("error", reject); child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(stderr || `child exit ${code}`)));
    })));
    expect(results).toHaveLength(requests.length); return results;
  } finally {
    for (const child of processes) if (child.exitCode === null && child.signalCode === null) {
      child.kill(); await new Promise<void>((resolve) => child.once("exit", () => resolve()));
    }
    rmSync(barrier, { force: true });
  }
}

test("qualified concurrent acquisition has one winner and serialization removal admits the coordinated unsafe interleaving", async () => {
  test.setTimeout(60_000);
  for (const control of ["none", "serialization"] as const) {
    const fx = fixture();
    try {
      const a = fx.request("T-999-a1"); const b = fx.request("T-999-a2");
      const results = await children(fx.product, [a, b], control);
      expect(results.filter((result) => result.ok)).toHaveLength(control === "none" ? 1 : 2);
      expect(files(fx.product)).toHaveLength(control === "none" ? 1 : 2);
      if (control === "none") expect(results.find((result) => !result.ok).error).toContain("QUALIFIED_CONFLICT");
    } finally { fx.cleanup(); }
  }
});

test("qualified conflict enforcement independently refuses sequential overlap and its removal admits a conflicting set", async () => {
  for (const control of ["none", "conflicts"] as const) {
    const fx = fixture();
    try {
      const a = fx.request("T-999-a1"); const b = fx.request("T-999-a2");
      expect((await children(fx.product, [a], "none"))[0].ok).toBe(true);
      const result = (await children(fx.product, [b], control))[0];
      expect(result.ok).toBe(control === "conflicts");
      expect(files(fx.product)).toHaveLength(control === "none" ? 1 : 2);
      if (control === "none") expect(result.error).toContain("QUALIFIED_CONFLICT");
    } finally { fx.cleanup(); }
  }
});

/** Every consumer must refuse replaced authority, not merely reconstruct a
 * different internally consistent set. Restoring the original JSON is the
 * positive control for the same fixture and original acquired identity. */
async function refuseCoherentReplacement(fx: ReturnType<typeof fixture>, request: any, acquired: any, changed: any) {
  const original = readFileSync(acquired.file, "utf8");
  changed.scope = deriveQualifiedScope(changed.request, { retained: true });
  changed.identity = qualifiedIdentity(changed.scope);
  expect(changed.identity).not.toBe(acquired.reservation.identity);
  const replacement = JSON.stringify(changed);
  writeFileSync(acquired.file, replacement);
  await expect(readQualifiedReservation(fx.product, request.attempt)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
  await expect(acquireQualifiedReservation(fx.product, request)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
  await expect(acquireQualifiedReservation(fx.product, fx.request("T-999-a2", "records::other/file"))).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
  expect(() => takeReservation(fx.product, { resource: fx.worker("product"), attempt: "T-998-a1", role: "executor", at: new Date().toISOString() })).toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
  await expect(release(fx.product, acquired)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
  expect(readFileSync(acquired.file, "utf8")).toBe(replacement);
  expect(files(fx.product)).toEqual([path.basename(acquired.file)]);
  writeFileSync(acquired.file, original);
  expect((await readQualifiedReservation(fx.product, request.attempt))?.scope).toEqual(acquired.reservation.scope);
  expect((await acquireQualifiedReservation(fx.product, request)).repeated).toBe(true);
  expect(await release(fx.product, acquired)).toBe(true);
}

test("qualified original acquisition refuses coherent worker replacement through every retained consumer", async () => {
  const fx = fixture();
  try {
    const request = fx.request("T-999-a1", "product::src/file");
    const acquired = await acquireQualifiedReservation(fx.product, request);
    const changed = JSON.parse(readFileSync(acquired.file, "utf8"));
    changed.request.workers[0].checkout = fx.worker("product", request.revisions.product);
    await refuseCoherentReplacement(fx, request, acquired, changed);
  } finally { fx.cleanup(); }
});

test("qualified original acquisition refuses coherent committed origin replacement without changing physical workers", async () => {
  const fx = fixture();
  try {
    const request = fx.request();
    const acquired = await acquireQualifiedReservation(fx.product, request);
    const changed = JSON.parse(readFileSync(acquired.file, "utf8"));
    changed.request = fx.request(request.attempt, "product::other/file");
    changed.request.workers = request.workers.map((worker: any) => ({ ...worker, base: changed.request.revisions[worker.role] }));
    await refuseCoherentReplacement(fx, request, acquired, changed);
  } finally { fx.cleanup(); }
});

test("qualified publication commits scope in its name and refuses unanchored malformed and duplicate authority", async () => {
  const fx = fixture();
  try {
    const request = fx.request();
    const acquired = await acquireQualifiedReservation(fx.product, request);
    const original = readFileSync(acquired.file, "utf8");
    expect(request.version).toBe(1);
    expect(acquired.reservation.version).toBe(2);
    expect(path.basename(acquired.file)).toBe(`qualified-${request.attempt}-${acquired.reservation.identity.slice("sha256:".length)}.json`);
    expect(qualifiedReservationPath(fx.product, request.attempt, acquired.reservation.identity)).toBe(acquired.file);
    expect(() => qualifiedReservationPath(fx.product, request.attempt, "sha256:short")).toThrow(/QUALIFIED_IDENTITY/);
    await expect(releaseQualifiedReservation(fx.product, { attempt: request.attempt, expectedIdentity: `sha256:${"0".repeat(64)}` })).rejects.toThrow(/QUALIFIED_NOT_OURS/);
    expect((await readQualifiedReservation(fx.product, request.attempt))?.identity).toBe(acquired.reservation.identity);
    const alternateRequest = fx.request(request.attempt, "product::other/file");
    const alternateScope = deriveQualifiedScope(alternateRequest, { retained: true });
    const alternateIdentity = qualifiedIdentity(alternateScope);
    const replacements = [
      { name: `qualified-${request.attempt}.json`, value: JSON.stringify({ ...acquired.reservation, version: 1 }), reason: /QUALIFIED_UNANCHORED/ },
      { name: `qualified-${request.attempt}-not-a-digest.json`, value: original, reason: /QUALIFIED_PUBLICATION_NAME/ },
      { name: path.basename(qualifiedReservationPath(fx.product, request.attempt, alternateIdentity)),
        value: JSON.stringify({ ...acquired.reservation, request: alternateRequest, scope: alternateScope, identity: alternateIdentity }), reason: /QUALIFIED_DUPLICATE/ },
    ];
    for (const replacement of replacements) {
      const file = path.join(path.dirname(acquired.file), replacement.name);
      writeFileSync(file, replacement.value);
      await expect(readQualifiedReservation(fx.product, request.attempt)).rejects.toThrow(replacement.reason);
      await expect(acquireQualifiedReservation(fx.product, request)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      expect(() => takeReservation(fx.product, { resource: fx.worker("product"), attempt: "T-998-a1", role: "executor", at: new Date().toISOString() })).toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      await expect(release(fx.product, acquired)).rejects.toThrow(/QUALIFIED_AUTHORITY_UNREADABLE/);
      expect(readFileSync(file, "utf8")).toBe(replacement.value);
      expect(readFileSync(acquired.file, "utf8")).toBe(original);
      rmSync(file);
      expect((await acquireQualifiedReservation(fx.product, request)).repeated).toBe(true);
    }
    expect(await release(fx.product, acquired)).toBe(true);
  } finally { fx.cleanup(); }
});

test("qualified accepted coordinator aliases preserve legacy conflicts retained reads exact repeats and release", async () => {
  const fx = fixture();
  try {
    const request = fx.request();
    const alias = path.join(fx.dir, "authority-alias");
    symlinkSync(fx.product, alias, "dir");
    expect(realpathSync(alias)).toBe(fx.product);
    const control = await acquireQualifiedReservation(fx.product, request);
    expect(await readQualifiedReservation(fx.product, request.attempt)).toEqual(control.reservation);
    expect((await acquireQualifiedReservation(fx.product, request)).repeated).toBe(true);
    expect(await release(fx.product, control)).toBe(true);

    const legacy = { resource: fx.worker("product"), attempt: "T-998-a1", role: "executor", at: new Date().toISOString() };
    takeReservation(fx.product, legacy);
    const heldLegacy = [path.basename(reservationPath(fx.product, legacy.resource))];
    await expect(acquireQualifiedReservation(fx.product, request)).rejects.toThrow(/QUALIFIED_CONFLICT/);
    await expect(acquireQualifiedReservation(alias, request)).rejects.toThrow(/QUALIFIED_CONFLICT/);
    expect(files(alias)).toEqual(heldLegacy);
    expect(releaseReservation(fx.product, legacy)).toBe(true);

    const acquired = await acquireQualifiedReservation(alias, request);
    expect(acquired.reservation.scope.authorityRoot).toBe(fx.product);
    expect(await readQualifiedReservation(fx.product, request.attempt)).toEqual(acquired.reservation);
    expect(await readQualifiedReservation(alias, request.attempt)).toEqual(acquired.reservation);
    const repeated = await acquireQualifiedReservation(alias, request, { pid: 1, at: "2030-01-01T00:00:00.000Z" });
    expect(repeated.repeated).toBe(true);
    expect(repeated.reservation).toEqual(acquired.reservation);
    const held = readFileSync(acquired.file, "utf8");
    await expect(releaseQualifiedReservation(alias, { attempt: request.attempt, expectedIdentity: "foreign" })).rejects.toThrow(/QUALIFIED_NOT_OURS/);
    expect(readFileSync(acquired.file, "utf8")).toBe(held);
    expect(() => takeReservation(alias, legacy)).toThrow(/QUALIFIED_CONFLICT/);
    expect(files(alias)).toEqual([path.basename(acquired.file)]);
    expect(await release(alias, acquired)).toBe(true);
    expect(await readQualifiedReservation(alias, request.attempt)).toBeNull();
    expect(await release(alias, acquired)).toBe(false);
    expect(files(alias)).toEqual([]);
  } finally { fx.cleanup(); }
});
