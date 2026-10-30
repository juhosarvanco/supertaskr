/** Read-only finite bank preparation for an accepted new-project setup.
 * Managed repositories are inputs; exact Git preparation uses external scratch.
 * This module cannot publish an OP, acquire a claim, write a managed file or accept a ref.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { parseTaskFile, parseComponentFile, expandQualifiedFence, blankInertSpans } from "../../../lib/parser/dist/pure.js";
import { idSlotKey } from "../../../lib/parser/dist/id-slot.js";
import { inspectProjectInitialization } from "./genesis-init-inspect.mjs";
import { observeProjectInitialization, captureOperationCommitIdentity } from "./project-init-operation.mjs";
import { listAcceptedOperations, readAcceptedOperation, captureOperationRepository } from "./durable-operation.mjs";
import { operationContent, operationDigest, operationPayload, operationWork } from "./operation-record.mjs";
import { validProjectBankRequest, validProjectBankRecord } from "./project-bank-record.mjs";
import { parseGenesisBankProposal, captureGenesisBankProposal, assertGenesisPlannedTask, genesisBankRecordPath, GENESIS_BANK_PROPOSAL } from "./genesis-bank-proposal.mjs";
import { createGenesisProposalReader, GENESIS_PRODUCT_PROPOSAL } from "./genesis-proposal.mjs";
import { loadProjectSettings, resolveProjectRole, validateProjectSettingsText } from "./project-settings.mjs";
import { createRecordChecker, checkedRecordWriteSet, requireInstalledRuntimeAssets, verifyInstalledRecordTool } from "./records-check.mjs";
import { captureExactCommitPlan, safeOperationWorkingPath } from "./record-write.mjs";
import {captureRawCommittedInputs} from "./records.mjs";
import {observeConfiguredArmStamp} from "./configured-dispatch-operation.mjs";
import * as pairedOperations from "./project-bank-operation.mjs";
import * as exactWrites from "./record-write.mjs";
const prepared = new WeakMap();
const SETTINGS = ["version", "roles", "session_policy", "process", "suites", "smoke", "guard_class", "bands", "names", "languages", "publication", "tier_budgets", "records"];
export class GenesisBankPreparationFinding extends Error {
    /** @param {string} code */
    constructor(code) { super(`${code}: project bank preparation is unavailable`); this.name = "GenesisBankPreparationFinding"; this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new GenesisBankPreparationFinding(code); }
/** @param {any} value @param {string[]} keys */
const shape = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
/** @param {any} a @param {any} b */
const same = (a, b) => operationContent(a) === operationContent(b);
/** @param {Uint8Array} value */
const sha = value => createHash("sha256").update(value).digest("hex");
/** @param {any} value */
function freeze(value) {
    if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}
/** @param {Uint8Array} bytes */
function text(bytes) {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch {
        refuse("genesis-bank-file-encoding");
    }
}
/** @param {Uint8Array} bytes */
function json(bytes) {
    try {
        const source = text(bytes), value = JSON.parse(source);
        if (parseDocument(source, { uniqueKeys: true }).errors.length)
            refuse("genesis-bank-json");
        return operationPayload(value);
    }
    catch {
        refuse("genesis-bank-json");
    }
}
/** @param {string} root @param {string[]} args @param {Buffer|undefined} [input] */
function git(root, args, input) {
    try {
        return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { input, maxBuffer: 32 * 1024 * 1024, stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } });
    }
    catch {
        refuse("genesis-bank-repository-unavailable");
    }
}
/** @param {string} root @param {string[]} args */
const scalar = (root, args) => git(root, args).toString("utf8").replace(/\n$/, "");
/** @param {string} root @param {string} ancestor @param {string} descendant */
function ancestor(root, ancestor, descendant) { return scalar(root, ["merge-base", ancestor, descendant]) === ancestor; }
/** Read one bounded physical plain file without following a final link or
 * blocking on a pipe. Recheck the named inode and opened descriptor afterward.
 * @param {string} file @param {number} limit */
function readPlain(file, limit) {
    if (constants.O_NOFOLLOW === undefined || constants.O_NONBLOCK === undefined)
        refuse("genesis-bank-file-platform-unsupported");
    try {
        if (realpathSync(path.dirname(file)) !== path.dirname(file) || !readdirSync(path.dirname(file)).includes(path.basename(file)))
            refuse("genesis-bank-file-origin");
        const before = lstatSync(file, { bigint: true });
        if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n || before.size > BigInt(limit))
            refuse("genesis-bank-file-kind-or-size");
        const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        try {
            const opened = fstatSync(fd, { bigint: true });
            if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size || opened.mode !== before.mode || opened.nlink !== 1n)
                refuse("genesis-bank-file-changed");
            const bytes = Buffer.alloc(Number(opened.size) + 1);
            let count = 0;
            while (count < bytes.length) {
                const n = readSync(fd, bytes, count, bytes.length - count, count);
                if (n === 0)
                    break;
                count += n;
            }
            const after = fstatSync(fd, { bigint: true }), named = lstatSync(file, { bigint: true });
            if (BigInt(count) !== opened.size || after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size || after.mode !== opened.mode || after.nlink !== 1n || after.mtimeNs !== opened.mtimeNs || after.ctimeNs !== opened.ctimeNs ||
                !named.isFile() || named.isSymbolicLink() || named.dev !== opened.dev || named.ino !== opened.ino || named.mode !== opened.mode || named.size !== opened.size || named.nlink !== 1n || named.mtimeNs !== opened.mtimeNs || named.ctimeNs !== opened.ctimeNs)
                refuse("genesis-bank-file-changed");
            const content = bytes.subarray(0, count);
            return { bytes: content, mode: opened.mode & 73n ? "100755" : "100644", capture: { path: file, device: String(opened.dev), inode: String(opened.ino), fileMode: Number(opened.mode & 511n), byteLength: count, sha256: sha(content), base64: content.toString("base64") } };
        }
        finally {
            closeSync(fd);
        }
    }
    catch (error) {
        if (error instanceof GenesisBankPreparationFinding)
            throw error;
        refuse("genesis-bank-file-unavailable");
    }
}
/** @param {any} current */
function sessionOrigin(current) {
    const repository = (/** @type {any} */ r) => ({ root: r.identities[0], gitDirectory: r.identities[1], commonDirectory: r.identities[2] });
    return { version: 1, layout: "split", associationId: current.association.projectId, product: repository(current.product), records: repository(current.records), docs: current.docs, runtime: current.runtime };
}
/** @param {any} receipt */
function setupReference(receipt) { return { operationId: receipt.operationId, requestDigest: receipt.requestDigest, receiptDigest: receipt.receiptDigest, projectId: receipt.projectId, productRevision: receipt.product.commit, recordsRevision: receipt.records.commit }; }
/** @param {any} input @param {any} inspected @param {any} registry */
function selectedSession(input, inspected, registry) {
    const origin = sessionOrigin(inspected.current);
    if (operationDigest(origin) !== input.originDigest || !shape(registry, ["sessions"]) || !Array.isArray(registry.sessions))
        refuse("genesis-bank-session-origin");
    const rows = registry.sessions.filter((/** @type {any} */ row) => row?.status !== "dead" && Array.isArray(row?.roles) && row.roles.includes("planner") && same(row?.genesis?.origin, origin));
    if (rows.length !== 1)
        refuse("genesis-bank-session-ambiguous");
    const row = rows[0], genesis = row.genesis;
    if (!["claude", "codex"].includes(row.agent) || row.agent !== genesis?.planner?.selection?.harness || row.status !== "idle" || !Number.isSafeInteger(row.turns) || row.turns < 1 || !/^S[1-9][0-9]*$/.test(row.id) ||
        typeof row.native_session_id !== "string" || !row.native_session_id || !shape(genesis, ["id", "origin", "planner", "setup"]) || genesis.id !== input.sessionId || !same(genesis.setup, setupReference(inspected.receipt)))
        refuse("genesis-bank-session-provenance");
    // Original model configuration is checked at its original committed cut.
    // Stored executable metadata is never resolved or launched by this producer.
    const planner = genesis.planner, original = loadProjectSettings({ productRoot: inspected.current.product.root, productRevision: planner?.provenance?.productRevision, tool: input.tool });
    const role = resolveProjectRole(original, "planner");
    if (role.status !== "ready" || !same(role.selection, planner?.selection) || !same(role.provenance, planner?.provenance))
        refuse("genesis-bank-planner-provenance");
    return { registryId: row.id, sessionId: genesis.id, origin, originDigest: input.originDigest, planner: genesis.planner };
}
/** Actual original human lines only. Every selected line retains its exact
 * bytes/offset; the entire transcript digest closes omitted/current content.
 * @param {any} read @param {any} context @param {readonly any[]} refs */
function answersFromTranscript(read, context, refs) {
    const wanted = new Map();
    for (const ref of refs) {
        const old = wanted.get(ref.turn);
        if (old && old !== ref.sha256)
            refuse("genesis-bank-answer-mismatch");
        wanted.set(ref.turn, ref.sha256);
    }
    /** @type {any[]} */ const answers = [];
    const lines = [];
    let start = 0;
    while (start < read.bytes.length) {
        const end = read.bytes.indexOf(10, start);
        if (end < 0)
            refuse("genesis-bank-transcript-partial");
        const bytes = read.bytes.subarray(start, end + 1), line = json(bytes);
        if (line?.role === "user" && line.machine !== true && line?.genesis?.sessionId === context.sessionId && line.genesis.originDigest === context.originDigest && wanted.has(line.turn)) {
            if (answers.some(a => a.turn === line.turn) || typeof line.text !== "string" || sha(Buffer.from(line.text)) !== wanted.get(line.turn))
                refuse("genesis-bank-answer-mismatch");
            answers.push({ turn: line.turn, text: line.text, setupId: context.setupId, sessionId: context.sessionId, originDigest: context.originDigest });
            lines.push({ offset: start, base64: bytes.toString("base64"), sha256: sha(bytes) });
        }
        start = end + 1;
    }
    if (answers.length !== wanted.size)
        refuse("genesis-bank-answer-missing");
    const { base64, ...capture } = read.capture;
    return { answers, capture: { ...capture, lines } };
}
/** @param {string} root @param {string} revision @returns {any[]} */
function tree(root, revision) {
    return git(root, ["ls-tree", "-r", "-z", revision]).toString("utf8").split("\0").filter(Boolean).map(line => {
        const match = /^(\d+) (blob|tree|commit) ([0-9a-f]+)\t([\s\S]+)$/.exec(line);
        if (!match)
            refuse("genesis-bank-tree");
        return { mode: match[1], type: match[2], oid: match[3], path: match[4] };
    });
}
/** @param {string} root @param {any} entry */
function blob(root, entry) {
    if (!entry || entry.type !== "blob" || !["100644", "100755"].includes(entry.mode))
        refuse("genesis-bank-base-file-kind");
    return git(root, ["cat-file", "blob", entry.oid]);
}
/** Read exact original bank witnesses from the same store. This deliberately
 * requires actual ref/raw-object correlation, never a schema-valid receipt alone.
 * @param {any} rec @param {any} current */
function bankWitness(rec, current) {
    if (!validProjectBankRecord(rec))
        refuse("genesis-bank-history-invalid");
    const op = rec.operation;
    if (op.acceptance === null)
        refuse("genesis-bank-pending-operation");
    for (const role of ["records", "product"]) {
        const plan = op.request.plans[role];
        if (plan === null)
            continue;
        const root = current[role].root;
        // current is the canonical inspector snapshot for this same observation.
        // Reuse its measured repository facts instead of re-measuring each old bank.
        if (!same(current[role], plan.repository))
            refuse("genesis-bank-history-origin");
    }
    return { operationId: op.id, requestDigest: op.digest, receiptDigest: acceptedBankReceipt(rec).receiptDigest, stage: op.request.bank.stage, completedStage: op.request.bank.completedStage, recordsCommit: op.acceptance.records.commit, productCommit: op.acceptance.product?.commit ?? null };
}
/** One fresh bounded Git traversal per root replaces repeated subprocesses for
 * the same ancestry questions. No capture survives this history observation.
 * Every queried revision is an explicit tip, including old bank input cuts.
 * @param {string} root @param {string[]} revisions */
function historyGraph(root, revisions) {
    const tips = [...new Set(revisions)];
    if (tips.some(revision => !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision)))
        refuse("genesis-bank-history-invalid");
    /** @type {Map<string,string[]>} */ const parents = new Map();
    for (const line of scalar(root, ["rev-list", "--parents", ...tips, "--"]).split("\n")) {
        const [commit, ...prior] = line.split(" ");
        if (!commit || parents.has(commit) || [commit, ...prior].some(oid => !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(oid)))
            refuse("genesis-bank-history-invalid");
        parents.set(commit, prior);
    }
    if (tips.some(tip => !parents.has(tip))) refuse("genesis-bank-history-invalid");
    return {
        /** @param {string} descendant */
        firstParent(descendant) {
            const result = [], seen = new Set();
            for (let commit = descendant; commit; commit = parents.get(commit)?.[0] ?? "") {
                if (seen.has(commit) || !parents.has(commit)) refuse("genesis-bank-history-invalid");
                seen.add(commit); result.push(commit);
            }
            return result;
        },
        /** @param {string} prior @param {string} descendant */
        ancestor(prior, descendant) {
            const pending = [descendant], seen = new Set();
            while (pending.length) {
                const commit = /** @type {string} */ (pending.pop());
                if (commit === prior) return true;
                if (seen.has(commit)) continue;
                seen.add(commit); pending.push(...(parents.get(commit) ?? []));
            }
            return false;
        }
    };
}
/** Exact raw commit comparisons retain the same per-bank witnesses while using
 * one bounded Git batch. Ref ownership is checked separately for the whole root.
 * @param {string} root @param {any[]} plans */
function verifyBankCommitBatch(root, plans) {
    const limit = 32 * 1024 * 1024;
    /** @type {Buffer[]} */ let chunks = [];
    /** @type {string[]} */ let commits = [];
    let length = 0;
    const flush = () => {
        if (!commits.length) return;
        if (!git(root, ["cat-file", "--batch"], Buffer.from(commits.join("\n") + "\n")).equals(Buffer.concat(chunks, length)))
            refuse("genesis-bank-history-witness");
        chunks = []; commits = []; length = 0;
    };
    for (const plan of plans) {
        const bytes = Buffer.from(plan.commitBase64, "base64");
        const header = Buffer.from(`${plan.commit} commit ${bytes.length}\n`), wireLength = header.length + bytes.length + 1;
        if (length + wireLength > limit) flush();
        // Preserve the original single-object bound at the batch-header edge.
        if (wireLength > limit) {
            if (!git(root, ["cat-file", "commit", plan.commit]).equals(bytes)) refuse("genesis-bank-history-witness");
            continue;
        }
        chunks.push(header, bytes, Buffer.from("\n")); commits.push(plan.commit); length += wireLength;
    }
    flush();
}
/** Packaging only, after the caller proves the existing exact bank witness.
 * @param {any} rec */
function acceptedBankReceipt(rec){
 const op=rec.operation,body={status:"banked",operationId:op.id,stage:op.request.bank.stage,mode:op.request.bank.mode,completedStage:op.request.bank.completedStage,requestDigest:op.digest,records:op.acceptance.records,product:op.acceptance.product};
 return freeze({...body,receiptDigest:operationDigest(body)});
}
/** Pure chronology over separately verified receipts. This returns data only;
 * it cannot establish a witness, selected context, bank ownership or write grant.
 * @param {{references:any[],firstParentChain:string[],stage:number}} input */
export function deriveGenesisBankHistoryState(input) {
    const { references, firstParentChain: chain, stage } = input;
    const ordered = references.filter(ref => chain.includes(ref.recordsCommit)).sort((a, b) => chain.indexOf(a.recordsCommit) - chain.indexOf(b.recordsCommit));
    if (ordered.length !== references.length)
        refuse("genesis-bank-history-branch-diverged");
    if (new Set(ordered.map(ref => ref.recordsCommit)).size !== ordered.length)
        refuse("genesis-bank-history-ambiguous");
    const highest = ordered.length ? Math.max(...ordered.map(ref => ref.stage)) : -1;
    for (let n = 0; n <= highest; n++)
        if (!ordered.some(ref => ref.stage === n))
            refuse("genesis-bank-history-stage-gap");
    const latestBank = ordered[0] ?? null, ownBank = ordered.find(ref => ref.stage === stage) ?? null, previousBank = stage === 0 ? null : ordered.find(ref => ref.stage === stage - 1) ?? null;
    if (latestBank && latestBank.completedStage !== highest)
        refuse("genesis-bank-history-progress");
    if (ownBank === null && stage !== highest + 1 || stage > 0 && previousBank === null)
        refuse("genesis-bank-predecessor-required");
    return freeze({ latestBank, ownBank, previousBank, mode: ownBank === null ? "initial" : "update", completedStage: ownBank === null ? stage : highest });
}
/** @param {any[]} rows @param {any} session @param {any} setup @param {any} current @param {number} stage @param {string|null} [ignoredOperationId] */
function previousBank(rows, session, setup, current, stage, ignoredOperationId = null) {
    const allBanks = rows.filter(row => row.operation.kind === "project-bank");
    const banks = allBanks.filter(row => row.operation.id !== ignoredOperationId);
    /** @type {Record<string,Map<string,string>>} */ const refsByRole = {};
    for (const role of ["product", "records"]) {
        const known = new Set(allBanks.filter(row => row.operation.request.plans[role] !== null).map(row => `refs/supertaskr/project-banks/${operationWork(row.operation.id).slice(3)}/${role}`));
        const refs = new Map(scalar(current[role].root, ["for-each-ref", "--format=%(refname)%00%(objectname)", "refs/supertaskr/project-banks/"]).split("\n").filter(Boolean).map(line => /** @type {[string,string]} */(line.split("\0"))));
        refsByRole[role] = refs;
        if ([...refs.keys()].some(ref => !known.has(ref)))
            refuse("genesis-bank-history-unattributed");
    }
    if (banks.some(row => same(row.operation.request.setup, setup) && row.operation.acceptance === null))
        refuse("genesis-bank-pending-operation");
    const relevant = banks.filter(row => same(row.operation.request.setup, setup) && same(row.operation.request.session, session));
    const witnesses = relevant.map(row => bankWitness(row, current)), byId = new Map(witnesses.map(ref => [ref.operationId, ref]));
    for (const role of ["product", "records"]) {
        const plans = relevant.flatMap(row => {
            const plan = row.operation.request.plans[role];
            if (plan === null) return [];
            const ref = `refs/supertaskr/project-banks/${operationWork(row.operation.id).slice(3)}/${role}`;
            if (refsByRole[role]?.get(ref) !== plan.commit) refuse("genesis-bank-history-witness");
            return [plan];
        });
        verifyBankCommitBatch(current[role].root, plans);
    }
    const recordsGraph = historyGraph(current.records.root, [current.recordsRevision, ...relevant.map(row => row.operation.request.input.recordsRevision)]);
    const productGraph = historyGraph(current.product.root, [current.productRevision, ...relevant.map(row => row.operation.request.input.productRevision)]);
    for (const row of relevant) {
        const request = row.operation.request, chain = recordsGraph.firstParent(request.input.recordsRevision);
        const before = witnesses.filter(ref => chain.includes(ref.recordsCommit));
        const state = deriveGenesisBankHistoryState({ references: before, firstParentChain: chain, stage: request.bank.stage });
        for (const field of ["previousBank", "latestBank", "ownBank"]) {
            const ref = request.input[field];
            if (!same(ref, state[field]) || ref !== null && !same(byId.get(ref.operationId), ref))
                refuse("genesis-bank-history-link");
        }
        if (request.bank.mode !== state.mode || request.bank.completedStage !== state.completedStage)
            refuse("genesis-bank-history-progress");
        if (before.some(ref => ref.productCommit !== null && !productGraph.ancestor(ref.productCommit, request.input.productRevision)))
            refuse("genesis-bank-history-product-lineage");
    }
    const chain = recordsGraph.firstParent(current.recordsRevision);
    if (witnesses.some(ref => ref.productCommit !== null && !productGraph.ancestor(ref.productCommit, current.productRevision)))
        refuse("genesis-bank-history-product-lineage");
    const state = deriveGenesisBankHistoryState({ references: witnesses, firstParentChain: chain, stage });
    const ordered = [...relevant].sort((a, b) => chain.indexOf(a.operation.request.plans.records.commit) - chain.indexOf(b.operation.request.plans.records.commit));
    return { ...state, history: ordered };
}
/** Fixed governing-field rule, not a provenance or semantic approval check.
 * Records preserve their earlier bytes; still-planned task author data uses the
 * same strict canonical bank rule on both sides. No lifecycle authority is added.
 * @param {{file:string,stage:number,before:string,after:string}} input */
export function assertGenesisBankFieldUpdate(input) {
    const { file, stage, before, after } = input;
    if (file.startsWith("docs/decisions/")) {
        if (!after.startsWith(before))
            refuse("genesis-bank-record-append-required");
        return true;
    }
    if (file.startsWith("docs/tasks/")) {
        assertGenesisPlannedTask(file, before);
        assertGenesisPlannedTask(file, after);
        return true;
    }
    if (file === "docs/STATE.md" || file === "docs/ARCHITECTURE.md" && stage === 8)
        return true;
    /** @type {Record<number,string[]>} */
    const north = { 1: ["vision", "users"], 2: ["success criteria"], 3: ["non-goals"], 4: ["hard constraints"], 6: ["riskiest assumption"] };
    const allowed = new Set(file === "docs/NORTH_STAR.md" ? north[stage] ?? [] : file === "docs/CONVENTIONS.md" ? (stage === 5 ? ["build & test", "gotchas"] : ["gotchas"]) : file === "docs/ROADMAP.md" ? (stage === 7 ? ["backbone", "milestones"] : stage === 8 ? ["milestones", "parked"] : []) : []);
    /** @param {string} source */
    const sections = source => {
        const visible = blankInertSpans(source).content.split("\n"), raw = source.split("\n"), result = new Map();
        let offset = 0, start = 0, name = "";
        for (let i = 0; i < raw.length; i++) {
            const heading = /^ {0,3}##[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*\r?$/.exec(visible[i] ?? "");
            if (heading) {
                if (result.has(name))
                    refuse("genesis-bank-field-ambiguous");
                result.set(name, source.slice(start, offset));
                name = (heading[1] ?? "").toLowerCase().replace(/[ \t]+/g, " ").trim();
                start = offset;
            }
            offset += (raw[i] ?? "").length + (i < raw.length - 1 ? 1 : 0);
        }
        if (result.has(name))
            refuse("genesis-bank-field-ambiguous");
        result.set(name, source.slice(start));
        return result;
    };
    const previous = sections(before), next = sections(after);
    if (!same([...previous.keys()].sort(), [...next.keys()].sort()))
        refuse("genesis-bank-field-scope");
    for (const [name, value] of previous)
        if (!allowed.has(name) && next.get(name) !== value)
            refuse("genesis-bank-field-scope");
    return true;
}
/** @param {any[]} files @param {any[]} entries @param {any} initial @param {string} root @param {string} revision @param {any} current @param {number|undefined} [stage] @param {any[]} [history] */
function qualifyRecordOutputs(files, entries, initial, root, revision, current, stage, history = []) {
    const initialFiles = initial.operation.request.plans.records.files;
    /** Rows have already been ordered and actually witnessed by previousBank. */
    const owned = (/** @type {string} */ file) => {
        for (const row of history) {
            const write = row.operation.request.plans.records.writes.find((/** @type {any} */ w) => w.path === file);
            if (write)
                return { file: write, bank: true };
        }
        const seed = initialFiles.find((/** @type {any} */ f) => f.path === file);
        return seed ? { file: seed, bank: false } : null;
    };
    /** @param {string} file */
    const slot = file => {
        const task = /^docs\/tasks\/(T-[0-9]+(?:-s[0-9]+)?)(?:-|\.md$)/i.exec(file);
        if (task && task[1])
            return idSlotKey(task[1].toUpperCase());
        const adr = /^docs\/decisions\/([0-9]+)-/i.exec(file);
        return adr ? idSlotKey(`ADR-${adr[1]}`) : null;
    };
    const historic = new Set();
    if (files.some(file => /^docs\/(?:tasks|decisions)\//.test(file.path)))
        for (const commit of scalar(root, ["rev-list", revision, "--", "docs/tasks", "docs/decisions"]).split("\n").filter(Boolean))
            for (const entry of tree(root, commit)) {
                const identity = slot(entry.path);
                if (identity !== null)
                    historic.add(identity);
            }
    const components = entries.filter(e => /^docs\/architecture\/components\/[^/]+\.md$/.test(e.path)).map(e => parseComponentFile(text(blob(root, e)), e.path).component).filter(component => component !== undefined);
    for (const file of files) {
        const base = entries.find(e => e.path === file.path), source = owned(file.path), record = /^docs\/(?:tasks|decisions)\//.test(file.path);
        if (base) {
            if (!source || record && !source.bank || base.mode !== source.file.mode || file.mode !== base.mode || !blob(root, base).equals(Buffer.from(source.file.base64, "base64")))
                refuse("genesis-bank-foreign-content");
            if (stage !== undefined)
                assertGenesisBankFieldUpdate({ file: file.path, stage, before: text(blob(root, base)), after: text(file.bytes) });
        }
        else {
            if (!record)
                refuse("genesis-bank-foundation-origin");
            if (source !== null || historic.has(slot(file.path)))
                refuse("genesis-bank-record-not-new");
            if (file.mode !== "100644")
                refuse("genesis-bank-new-record-mode");
        }
        if (file.path.startsWith("docs/tasks/")) {
            const task = parseTaskFile(text(file.bytes), file.path).task;
            if (!task || task.status !== "planned")
                refuse("genesis-bank-task-format");
            const fence = expandQualifiedFence(task, components, { repositories: { product: { filesystemRoot: current.product.root, gitCommonDirectory: current.product.commonDir }, records: { filesystemRoot: current.records.root, gitCommonDirectory: current.records.commonDir } }, ownFile: file.path });
            if (!fence.usable || fence.paths.length === 0)
                refuse("genesis-bank-task-fence-unusable");
        }
    }
}
/** Output-family/ownership/fence rule only. Complete preparation separately
 * proves actual history/stage/session/cuts and structural checks. The default
 * test seam recognizes initial producer data only, never invented bank rows.
 * @param {{files:any[],initialRecord:any,current:any,stage?:number}} input */
export function assertGenesisBankRecordOutputs(input) {
    qualifyRecordOutputs(input.files, tree(input.current.records.root, input.current.recordsRevision), input.initialRecord, input.current.records.root, input.current.recordsRevision, input.current, input.stage, []);
    return true;
}
/** Literal initialized adapter slots only, with every surrounding byte intact.
 * @param {string} initial @param {string} base @param {any} identity */
function fillAdapter(initial, base, identity) {
    const name = "<project name>", line = "<One sentence: what this repo is.>";
    const at = initial.indexOf(name), next = initial.indexOf(line);
    if (at < 0 || next < at || initial.indexOf(name, at + 1) !== -1 || initial.indexOf(line, next + 1) !== -1)
        refuse("genesis-bank-adapter-slots");
    const prefix = initial.slice(0, at), middle = initial.slice(at + name.length, next), suffix = initial.slice(next + line.length);
    const boundary = base.indexOf(middle, prefix.length), oneEnd = base.length - suffix.length;
    if (!base.startsWith(prefix) || !base.endsWith(suffix) || boundary < prefix.length || oneEnd < boundary + middle.length || /[\r\n]/.test(base.slice(prefix.length, boundary) + base.slice(boundary + middle.length, oneEnd)))
        refuse("genesis-bank-adapter-changed");
    return Buffer.from(prefix + identity.projectName + middle + identity.oneLiner + suffix);
}
/** @param {any} input */
function assertBankInput(input){
 if(!shape(input,["productRoot","operationId","sessionId","originDigest","expectedProductRevision","expectedRecordsRevision","tool"])||
  ![input.operationId,input.sessionId].every(v=>typeof v==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v))||typeof input.productRoot!=="string"||!/^sha256:[0-9a-f]{64}$/.test(input.originDigest))refuse("genesis-bank-request");
}
/** Question-only turns may retain the already accepted proposal. This proves
 * a historical unchanged result, never a new bank or all-drafts-saved claim.
 * Every source/index byte in the finite output families is measured against
 * current committed inputs; Git's stat-cache/ignore flags are insufficient.
 * @param {{productRoot:string,operationId:string,sessionId:string,originDigest:string,expectedProductRevision:string,expectedRecordsRevision:string,tool:any}} input */
export function unchangedGenesisBank(input){
 assertBankInput(input);requireInstalledRuntimeAssets(input.tool,["genesis-bank-plan","genesis-bank-proposal","records"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const inspected=inspectProjectInitialization({productRoot:input.productRoot,tool:input.tool}),current=inspected.current;
 if(current.productRevision!==input.expectedProductRevision||current.recordsRevision!==input.expectedRecordsRevision)refuse("genesis-bank-current-cut-changed");
 const registry=readPlain(path.join(current.product.root,".supertaskr/sessions.json"),1024*1024),session=selectedSession(input,inspected,json(registry.bytes));
 const rows=listAcceptedOperations(current.product.root),prior=previousBank(rows,session,setupReference(inspected.receipt),current,0);
 if(prior.latestBank===null)return null;
 const latest=rows.find(row=>row.operation.id===prior.latestBank.operationId),r=latest.operation.request;
 const source=readPlain(safeOperationWorkingPath(current.records.root,GENESIS_BANK_PROPOSAL),256*1024);
 if(source.mode!=="100644"||source.bytes.toString("base64")!==r.bank.proposalCapture.sourceBase64)return null;
 const productProposal=prior.history.find((/** @type {any} */ row)=>row.operation.request.bank.productProposalCapture!==null)?.operation.request.bank.productProposalCapture;
 if(productProposal){const source=readPlain(safeOperationWorkingPath(current.records.root,GENESIS_PRODUCT_PROPOSAL),256*1024);if(source.mode!=="100644"||source.bytes.toString("base64")!==productProposal.sourceBase64)return null;}
 else{try{lstatSync(path.join(current.records.root,GENESIS_PRODUCT_PROPOSAL));return null;}catch(error){if(/** @type {any} */(error).code!=="ENOENT")refuse("genesis-bank-file-unavailable");}}
 for(const role of ["product","records"])if(!same(captureOperationRepository(current[role].root,current[`${role}Revision`]),current[role]))refuse("genesis-bank-origin-changed");
 const committed=captureRawCommittedInputs({productRoot:current.product.root,productRevision:current.productRevision,recordsRevision:current.recordsRevision});
 const captures=[],inventories=[];
 for(const role of /** @type {("product"|"records")[]} */ (["product","records"])){
  const root=current[role].root;
  const relevant=(/** @type {string} */ file)=>role==="product"?["AGENTS.md","CLAUDE.md","supertaskr.yaml"].includes(file):["docs/INDEX.md",GENESIS_BANK_PROPOSAL,GENESIS_PRODUCT_PROPOSAL].includes(file)||Array.from({length:9},(_,stage)=>stage).some(stage=>genesisBankRecordPath(stage,file));
  const paths=role==="product"?["AGENTS.md","CLAUDE.md","supertaskr.yaml"]:["docs/INDEX.md","docs/STATE.md","docs/NORTH_STAR.md","docs/CONVENTIONS.md","docs/ROADMAP.md","docs/ARCHITECTURE.md","docs/tasks","docs/decisions",GENESIS_BANK_PROPOSAL,GENESIS_PRODUCT_PROPOSAL];
  for(const flags of [["--others","--exclude-standard"],["--others","--ignored","--exclude-standard"]]){const args=["ls-files","-z",...flags,"--",...paths],bytes=git(root,args);if(bytes.toString("utf8").split("\0").some(file=>file&&relevant(file)))return null;inventories.push({root,args,bytes});}
  const args=["ls-files","-v","-z","--",...paths],bytes=git(root,args);if(bytes.toString("utf8").split("\0").some(row=>row&&relevant(row.slice(2))&&!row.startsWith("H ")))return null;inventories.push({root,args,bytes});
  const entries=committed.entries(role).filter(entry=>relevant(entry.relativePath));
  if(entries.some(entry=>entry.type!=="blob"||!["100644","100755"].includes(entry.mode)))return null;
  const index=new Map();for(const row of git(root,["ls-files","--stage","-z","--",...paths]).toString("utf8").split("\0").filter(Boolean)){
   const match=/^([0-9]+) ([0-9a-f]+) ([0-3])\t([\s\S]+)$/.exec(row);if(!match)refuse("genesis-bank-index-unavailable");const file=/** @type {string} */(match[4]);if(!relevant(file))continue;
   if(match[3]!=="0"||index.has(file))return null;index.set(file,{mode:match[1],oid:match[2]});
  }
  if(index.size!==entries.length||entries.some(entry=>!same(index.get(entry.relativePath),{mode:entry.mode,oid:entry.oid})))return null;
  for(const entry of committed.readMany(role,entries.map(entry=>entry.relativePath))){const source=readPlain(safeOperationWorkingPath(root,entry.path),4*1024*1024);if(source.mode!==entry.mode||!source.bytes.equals(entry.bytes))return null;captures.push(source.capture);}
  captures.push(readPlain(path.join(current[role].gitDir,"index"),32*1024*1024).capture);
 }
 const after=inspectProjectInitialization({productRoot:input.productRoot,tool:input.tool});if(!same(after.current,current)||!same(after.receipt,inspected.receipt)||!same(readPlain(registry.capture.path,1024*1024).capture,registry.capture))refuse("genesis-bank-current-cut-changed");
 for(const capture of captures)if(!same(readPlain(capture.path,32*1024*1024).capture,capture))refuse("genesis-bank-working-changed");
 for(const inventory of inventories)if(!git(inventory.root,inventory.args).equals(inventory.bytes))refuse("genesis-bank-working-changed");
 if(!same(previousBank(listAcceptedOperations(current.product.root),session,setupReference(inspected.receipt),current,0).latestBank,prior.latestBank))refuse("genesis-bank-operation-history-changed");
 verifyInstalledRecordTool(input.tool);return freeze({status:"unchanged",receipt:acceptedBankReceipt(latest)});
}
/** Current read qualification is separate from historical accepted facts and
 * grants no write authority. Reuse the exact bank/session witness owner; no
 * timestamps, working-document heuristics or second progress ledger.
 * @param {{productRoot:string,tool:any}} input */
export function inspectCurrentGenesisBankHistory(input){
 if(!shape(input,["productRoot","tool"])||typeof input.productRoot!=="string")refuse("genesis-bank-history-request");
 requireInstalledRuntimeAssets(input.tool,["genesis-bank-plan","genesis-init-inspect","project-bank-record"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const inspected=inspectProjectInitialization(input),current=inspected.current;
 const registry=readPlain(path.join(current.product.root,".supertaskr/sessions.json"),1024*1024),data=json(registry.bytes),origin=sessionOrigin(current);
 if(!shape(data,["sessions"])||!Array.isArray(data.sessions))refuse("genesis-bank-session-origin");
 const rows=data.sessions.filter((/** @type {any} */ row)=>row?.status!=="dead"&&Array.isArray(row?.roles)&&row.roles.includes("planner")&&same(row?.genesis?.origin,origin));
 if(rows.length!==1)refuse("genesis-bank-session-ambiguous");
 const session=selectedSession({sessionId:rows[0].genesis?.id,originDigest:operationDigest(origin),tool:input.tool},inspected,data);
 const prior=previousBank(listAcceptedOperations(current.product.root),session,setupReference(inspected.receipt),current,0);
 const banks=prior.history.map((/** @type {any} */ row)=>({receipt:acceptedBankReceipt(row),
  paths:row.operation.request.plans.records.writes.map((/** @type {any} */ write)=>write.path).filter((/** @type {string} */ file)=>file!==GENESIS_BANK_PROPOSAL&&file!==GENESIS_PRODUCT_PROPOSAL),
  turn:Math.max(1,...row.operation.request.bank.proposalCapture.proposal.answerRefs.map((/** @type {any} */ ref)=>ref.turn))}));
 const after=inspectProjectInitialization(input);
 if(!same(after,inspected)||!same(readPlain(registry.capture.path,1024*1024).capture,registry.capture)||
  !same(previousBank(listAcceptedOperations(current.product.root),session,setupReference(inspected.receipt),current,0).latestBank,prior.latestBank))refuse("genesis-bank-current-cut-changed");
 verifyInstalledRecordTool(input.tool);
 return freeze({status:"current",setupId:inspected.receipt.operationId,sessionId:session.sessionId,originDigest:session.originDigest,
  productRevision:current.productRevision,recordsRevision:current.recordsRevision,completedStage:prior.latestBank?.completedStage??null,banks});
}
/** Backend-only fixed request. TOOL is an opaque installed handle; proposal
 * bytes, filesystem roots and typed answers are never accepted through stdin.
 * @param {{productRoot:string,operationId:string,sessionId:string,originDigest:string,expectedProductRevision:string,expectedRecordsRevision:string,tool:any}} input */
export function prepareGenesisBank(input) {
    assertBankInput(input);
    requireInstalledRuntimeAssets(input.tool, ["genesis-bank-plan", "project-bank-record", "genesis-bank-proposal", "genesis-proposal", "genesis-init-inspect", "project-init-operation", "project-settings", "record-write"].map(name => `tools/e2e/scripts/${name}.mjs`));
    const inspected = inspectProjectInitialization({ productRoot: input.productRoot, tool: input.tool }), current = inspected.current;
    if (input.expectedProductRevision !== current.productRevision || input.expectedRecordsRevision !== current.recordsRevision)
        refuse("genesis-bank-current-cut-changed");
    const rows = listAcceptedOperations(current.product.root);
    if (readAcceptedOperation(current.product.root, input.operationId) !== null)
        refuse("genesis-bank-existing-operation");
    const original = observeProjectInitialization(current.product.root, inspected.receipt.operationId);
    if (original?.status !== "initialized" || !same(original.receipt, inspected.receipt))
        refuse("genesis-bank-setup-changed");
    const setup = setupReference(inspected.receipt);
    if (!ancestor(current.product.root, setup.productRevision, current.productRevision) || !ancestor(current.records.root, setup.recordsRevision, current.recordsRevision))
        refuse("genesis-bank-setup-lineage");
    const registry = readPlain(path.join(current.product.root, ".supertaskr/sessions.json"), 1024 * 1024), session = selectedSession(input, inspected, json(registry.bytes));
    const context = { setupId: setup.operationId, sessionId: session.sessionId, originDigest: session.originDigest, productRevision: current.productRevision, recordsRevision: current.recordsRevision };
    const proposalRead = readPlain(safeOperationWorkingPath(current.records.root, GENESIS_BANK_PROPOSAL), 256 * 1024), proposal = parseGenesisBankProposal({ bytes: proposalRead.bytes, context });
    const productRead = [1, 5].includes(proposal.stage) ? readPlain(safeOperationWorkingPath(current.records.root, GENESIS_PRODUCT_PROPOSAL), 256 * 1024) : null;
    const productData = productRead === null ? null : json(productRead.bytes);
    if (productData !== null && !Array.isArray(productData.answerRefs))
        refuse("genesis-bank-product-proposal");
    const transcript = readPlain(path.join(current.product.root, ".supertaskr/genesis/transcript.jsonl"), 16 * 1024 * 1024);
    const capturedAnswers = answersFromTranscript(transcript, context, [...proposal.answerRefs, ...(productData?.answerRefs ?? [])]);
    const files = proposal.records.map((/** @type {any} */ file) => { const read = readPlain(safeOperationWorkingPath(current.records.root, file.path), 4 * 1024 * 1024); return { path: file.path, mode: read.mode, bytes: read.bytes }; });
    const captured = captureGenesisBankProposal({ bytes: proposalRead.bytes, context, answers: capturedAnswers.answers, files });
    const productCapture = productRead === null ? null : createGenesisProposalReader({ validateSettings: settings => shape(settings, SETTINGS) && validateProjectSettingsText({ source: JSON.stringify(settings), tool: input.tool }).status === "ready" }).capture({ bytes: productRead.bytes, context, answers: capturedAnswers.answers });
    if (productCapture && (productCapture.proposal.proposalId !== proposal.proposalId || productCapture.proposal.bank !== (proposal.stage === 1 ? "identity" : "configuration")))
        refuse("genesis-bank-product-proposal-mismatch");
    const prior = previousBank(rows, session, setup, current, proposal.stage), entries = tree(current.records.root, current.recordsRevision);
    qualifyRecordOutputs(files, entries, original.record, current.records.root, current.recordsRevision, current, proposal.stage, prior.history);
    const overlay = files.map((/** @type {any} */ file) => ({ operation: entries.some(e => e.path === file.path) ? "edit" : "add", path: file.path, type: "blob", mode: file.mode, bytes: file.bytes }));
    const evaluate = (/** @type {any} */ profile) => {
        const checker = createRecordChecker({ tool: input.tool, profile }), capture = checker.capture({ productRoot: current.product.root, productRevision: current.productRevision, recordsRevision: current.recordsRevision }), result = checker.evaluate(capture, overlay);
        if (!result.accepted)
            refuse("genesis-bank-private-check-refused");
        const accepted = checkedRecordWriteSet(result);
        const writes = accepted.writes.map((/** @type {any} */ w) => ({ operation: w.operation, path: w.path, mode: w.mode, base64: Buffer.from(w.bytes).toString("base64"), derived: w.derived }));
        return { writes, proof: { profile: checker.profile, captureDigest: capture.digest, candidateDigest: result.candidateDigest, writeSetDigest: operationDigest(writes) } };
    };
    const checked = evaluate(inspected.settings.records.validation);
    let prospective = null, productWrites = null;
    if (productCapture) {
        const pEntries = tree(current.product.root, current.productRevision);
        if (proposal.stage === 1) {
            productWrites = ["AGENTS.md", "CLAUDE.md"].map(file => {
                const entry = pEntries.find(e => e.path === file), initial = original.record.operation.request.plans.product.files.find((/** @type {any} */ f) => f.path === file);
                if (!initial)
                    refuse("genesis-bank-adapter-origin");
                if (!entry)
                    refuse("genesis-bank-adapter-origin");
                const base = blob(current.product.root, entry), bytes = fillAdapter(text(Buffer.from(initial.base64, "base64")), text(base), productCapture.proposal.identity);
                return { operation: "edit", path: file, mode: entry.mode, base64: bytes.toString("base64"), derived: false };
            });
        }
        else {
            const config = validateProjectSettingsText({ source: JSON.stringify(productCapture.proposal.settings), tool: input.tool });
            if (config.status !== "ready")
                refuse(config.code);
            const entry = pEntries.find(e => e.path === "supertaskr.yaml");
            if (!entry)
                refuse("genesis-bank-configuration-origin");
            blob(current.product.root, entry);
            productWrites = [{ operation: "edit", path: "supertaskr.yaml", mode: entry.mode, base64: Buffer.from(config.yaml).toString("base64"), derived: false }];
            prospective = evaluate(config.settings.records.validation);
        }
        for (const write of productWrites) {
            let owned = original.record.operation.request.plans.product.files.find((/** @type {any} */ file) => file.path === write.path);
            for (const row of prior.history) {
                const earlier = row.operation.request.plans.product?.writes.find((/** @type {any} */ file) => file.path === write.path);
                if (earlier) {
                    owned = earlier;
                    break;
                }
            }
            const committed = pEntries.find(e => e.path === write.path);
            if (!owned || !committed || owned.mode !== committed.mode || !blob(current.product.root, committed).equals(Buffer.from(owned.base64, "base64")))
                refuse("genesis-bank-product-foreign-content");
            const base = blob(current.product.root, pEntries.find(e => e.path === write.path)), working = readPlain(safeOperationWorkingPath(current.product.root, write.path), 4 * 1024 * 1024);
            if (working.mode !== write.mode || !working.bytes.equals(base))
                refuse("genesis-bank-product-working-conflict");
        }
    }
    const final = prospective ?? checked, writes = [...final.writes];
    const proposals = [{ path: GENESIS_BANK_PROPOSAL, read: proposalRead }, ...(productRead ? [{ path: GENESIS_PRODUCT_PROPOSAL, read: productRead }] : [])];
    for (const { path: file, read } of proposals) {
        const base = entries.find(e => e.path === file);
        if (base && (base.type !== "blob" || base.mode !== "100644") || read.mode !== "100644")
            refuse("genesis-bank-proposal-mode");
        writes.push({ operation: base ? "edit" : "add", path: file, mode: "100644", base64: read.bytes.toString("base64"), derived: false });
    }
    const identity = captureOperationCommitIdentity(current.product.root), message = `Bank genesis stage ${proposal.stage}\n\nsupertaskr-project-bank: ${input.operationId}/records\n`;
    const rPlan = captureExactCommitPlan(current.records.root, current.recordsRevision, writes, { identity, message });
    const rRef = scalar(current.records.root, ["symbolic-ref", "HEAD"]);
    const records = { repository: current.records, targetRef: rRef, expectedRevision: current.recordsRevision, writes, ...rPlan, message };
    let product = null;
    if (productWrites) {
        const pMessage = `Configure genesis stage ${proposal.stage}\nsupertaskr-records-bank: ${rPlan.commit}\n\nsupertaskr-project-bank: ${input.operationId}/product\n`;
        product = { repository: current.product, targetRef: scalar(current.product.root, ["symbolic-ref", "HEAD"]), expectedRevision: current.productRevision, writes: productWrites, ...captureExactCommitPlan(current.product.root, current.productRevision, productWrites, { identity, message: pMessage }), message: pMessage };
    }
    const request = { version: 1, kind: "project-bank", operationId: input.operationId, tool: input.tool, setup, session,
        input: { productRevision: current.productRevision, recordsRevision: current.recordsRevision, productRepository: current.product, recordsRepository: current.records, docsIdentity: current.docs, runtimeIdentity: current.runtime, settingsProvenance: inspected.settingsProvenance, registryCapture: registry.capture, transcriptCapture: capturedAnswers.capture, previousBank: prior.previousBank, latestBank: prior.latestBank, ownBank: prior.ownBank },
        bank: { stage: proposal.stage, mode: prior.mode, completedStage: prior.completedStage, proposalCapture: captured, productProposalCapture: productCapture, answers: capturedAnswers.answers.map(a => ({ turn: a.turn, text: a.text, sha256: sha(Buffer.from(a.text)) })), validation: { current: checked.proof, prospective: prospective?.proof ?? null } }, plans: { records, product } };
    if (!validProjectBankRequest(request))
        refuse("genesis-bank-plan-invalid");
    if (!same(inspectProjectInitialization({ productRoot: current.product.root, tool: input.tool }), inspected) || !same(registry.capture, readPlain(registry.capture.path, 1024 * 1024).capture) || !same(transcript.capture, readPlain(transcript.capture.path, 16 * 1024 * 1024).capture))
        refuse("genesis-bank-current-observation-changed");
    for (const file of [...files, { path: GENESIS_BANK_PROPOSAL, mode: proposalRead.mode, bytes: proposalRead.bytes }, ...(productRead ? [{ path: GENESIS_PRODUCT_PROPOSAL, mode: productRead.mode, bytes: productRead.bytes }] : [])]) {
        const now = readPlain(safeOperationWorkingPath(current.records.root, file.path), 4 * 1024 * 1024);
        if (now.mode !== file.mode || !now.bytes.equals(file.bytes))
            refuse("genesis-bank-proposal-changed");
    }
    if (scalar(current.records.root, ["symbolic-ref", "HEAD"]) !== records.targetRef || product && scalar(current.product.root, ["symbolic-ref", "HEAD"]) !== product.targetRef)
        refuse("genesis-bank-current-ref-changed");
    for (const plan of [records, ...(product ? [product] : [])]) {
        const index = readPlain(plan.working.index.path, 32 * 1024 * 1024);
        if (operationDigest(index.capture.base64) !== plan.working.index.previousDigest)
            refuse("genesis-bank-current-index-changed");
    }
    if (!same(listAcceptedOperations(current.product.root), rows) || readAcceptedOperation(current.product.root, input.operationId) !== null)
        refuse("genesis-bank-operation-history-changed");
    verifyInstalledRecordTool(input.tool);
    freeze(request);
    prepared.set(request, { tool: input.tool });
    return freeze({ request, authority: "prepared exact data only; no bank effects or accepted receipt" });
}
/** New execution may consume only the same in-process frozen constructor
 * result. Historical replay uses the separately stored immutable request.
 * @param {any} request */
export function assertPreparedGenesisBank(request) {
    const facts = prepared.get(request);
    if (!facts)
        refuse("genesis-bank-preparation-required");
    verifyInstalledRecordTool(facts.tool);
    return true;
}

/** One canonical completed-history/product-shape owner for installation and
 * dispatch. A bank receipt alone cannot qualify an implementation-bearing tree.
 * The optional original cut is private to the actual owned-stamp reader below.
 * @param {{productRoot:string,tool:any}} input @param {{recordsRevision?:string,productRevision?:string,ownedWorking?:boolean}|undefined} [projection] */
function completedGenesisContext(input,projection) {
    requireInstalledRuntimeAssets(input.tool, ["genesis-bank-plan", "project-bank-operation", "project-bank-record", "genesis-init-inspect", "project-init-operation", "project-settings"]
        .map(name => `tools/e2e/scripts/${name}.mjs`));
    const observed = inspectProjectInitialization({ productRoot: input.productRoot, tool: input.tool }), observedCurrent = observed.current;
    const current = {...observedCurrent,...(projection?.recordsRevision===undefined?{}:{recordsRevision:projection.recordsRevision}),...(projection?.productRevision===undefined?{}:{productRevision:projection.productRevision})};
    const originalSettings=projection?.productRevision===undefined?null:loadProjectSettings({productRoot:current.product.root,productRevision:current.productRevision,tool:input.tool});
    if(originalSettings!==null&&originalSettings.status!=="ready")refuse("genesis-install-original-settings");
    const inspected=originalSettings?.status==="ready"?{...observed,current,settings:originalSettings.settings,settingsProvenance:originalSettings.provenance}:observed;
    const original = observeProjectInitialization(current.product.root, inspected.receipt.operationId);
    if (original?.status !== "initialized" || !same(original.receipt, inspected.receipt)) refuse("genesis-dispatch-baseline-setup");
    const setup = setupReference(inspected.receipt), origin = sessionOrigin(current);
    const registry = readPlain(path.join(current.product.root, ".supertaskr/sessions.json"), 1024 * 1024), parsed = json(registry.bytes);
    const matching = parsed?.sessions?.filter((/** @type {any} */ row) => row?.status !== "dead" && Array.isArray(row.roles) && row.roles.includes("planner") && same(row.genesis?.origin, origin));
    if (!Array.isArray(matching) || matching.length !== 1) refuse("genesis-bank-session-ambiguous");
    const session = selectedSession({ sessionId: matching[0].genesis?.id, originDigest: operationDigest(origin), tool: input.tool }, inspected, parsed);
    const history = previousBank(listAcceptedOperations(current.product.root), session, setup, current, 8);
    if (history.completedStage !== 8 || history.ownBank?.stage !== 8 || history.latestBank?.completedStage !== 8)
        refuse("genesis-dispatch-baseline-incomplete");
    const decomposition = history.history.find((/** @type {any} */ row) => row.operation.request.bank.stage === 8);
    if (!decomposition) refuse("genesis-dispatch-baseline-incomplete");
    const latestProduct = history.history.find((/** @type {any} */ row) => row.operation.request.plans.product !== null);
    if (!latestProduct || current.productRevision !== latestProduct.operation.request.plans.product.commit)
        refuse("genesis-dispatch-baseline-product-changed");
    if (projection?.ownedWorking!==true&&scalar(current.product.root, ["status", "--porcelain=v1", "--untracked-files=all"]) !== "")
        refuse("genesis-dispatch-baseline-product-dirty");
    // Only exact accepted init/identity/config files are code-empty. Future
    // installer assets need their own accepted finite producer receipt.
    const expected = new Map(original.record.operation.request.plans.product.files.map((/** @type {any} */ file) => [file.path, file]));
    if ([...expected.keys()].sort().join("\0") !== [".gitignore", "AGENTS.md", "CLAUDE.md", "supertaskr.yaml"].sort().join("\0"))
        refuse("genesis-dispatch-baseline-product-shape");
    for (const row of [...history.history].reverse()) {
        const plan = row.operation.request.plans.product;
        if (plan !== null) for (const file of plan.writes) {
            if (!expected.has(file.path) || !["add", "edit"].includes(file.operation)) refuse("genesis-dispatch-baseline-product-shape");
            expected.set(file.path, file);
        }
    }
    const actual = tree(current.product.root, current.productRevision);
    if (actual.length !== expected.size || actual.some(entry => {
        const file = expected.get(entry.path);
        return !file || file.mode !== entry.mode || blob(current.product.root, entry).toString("base64") !== file.base64;
    })) refuse("genesis-dispatch-baseline-product-changed");
    const again = inspectProjectInitialization({productRoot:current.product.root,tool:input.tool});
    if(!same(again.current,observedCurrent)||!same(readPlain(registry.capture.path,1024*1024).capture,registry.capture))refuse("genesis-dispatch-baseline-current-changed");
    verifyInstalledRecordTool(input.tool);
    return {inspected,current,observedCurrent,registry,setup,history,decomposition,actual};
}
/** Completed original setup/banks for the finite installer, still explicitly
 * non-GREEN. The installer adds only its separately accepted exact asset plan.
 * @param {{productRoot:string,tool:any}} input */
export function captureCompletedGenesisForInstallation(input) {
    if(!shape(input,["productRoot","tool"])||typeof input.productRoot!=="string")refuse("genesis-install-baseline-request");
    const {inspected,current,setup,history,actual}=completedGenesisContext(input);
    return freeze({kind:"initialized-code-empty",setup,bank8:history.ownBank,latestBank:history.latestBank,
      revisions:{product:current.productRevision,records:current.recordsRevision},configuration:inspected.settingsProvenance,
      productFiles:actual.map(entry=>({path:entry.path,mode:entry.mode,sha256:sha(blob(current.product.root,entry))})),qualifiedSuiteBaseline:false});
}

/** The first code-empty dispatch baseline is an observed initialization and
 * completed bank history, never a GREEN suite with missing test files.
 * Reuse the canonical session and exact bank witnesses; this grants no effect.
 * @param {{productRoot:string,tool:any,taskId:string}} input */
export function captureCompletedGenesisForDispatch(input) {
    if (!shape(input, ["productRoot", "tool", "taskId"]) || typeof input.productRoot !== "string" || !/^T-\d+(?:-s\d+)?$/.test(input.taskId))
        refuse("genesis-dispatch-baseline-request");
    return completedGenesisDispatchProof(input);
}
/** Shared exact original card/history owner. Only the retained-stamp reader
 * below may supply an earlier RECORDS cut. @param {{productRoot:string,tool:any,taskId:string}} input @param {{recordsRevision?:string}|undefined} [projection] */
function completedGenesisDispatchProof(input,projection) {
    const { inspected, current, observedCurrent, registry, setup, history, decomposition, actual } = completedGenesisContext(input,projection);
    const cards = tree(current.records.root, current.recordsRevision).filter(entry => /^docs\/tasks\/[^/]+\.md$/.test(entry.path)).map(entry => ({ entry,
        bytes: blob(current.records.root, entry) })).filter(row => parseTaskFile(text(row.bytes), row.entry.path).task?.id === input.taskId);
    if (cards.length !== 1) refuse("genesis-dispatch-baseline-task");
    const card = cards[0];
    if (!card) refuse("genesis-dispatch-baseline-task");
    const planned = decomposition.operation.request.plans.records.writes.find((/** @type {any} */ file) => file.path === card.entry.path);
    if (!planned || planned.mode !== card.entry.mode || planned.base64 !== card.bytes.toString("base64") || parseTaskFile(text(card.bytes), card.entry.path).task?.status !== "planned")
        refuse("genesis-dispatch-baseline-task-changed");
    const currentAgain = inspectProjectInitialization({ productRoot: current.product.root, tool: input.tool });
    if (!same(currentAgain.current, observedCurrent) || !same(readPlain(registry.capture.path, 1024 * 1024).capture, registry.capture))
        refuse("genesis-dispatch-baseline-current-changed");
    verifyInstalledRecordTool(input.tool);
    return freeze({ kind: "initialized-code-empty", setup, bank8: history.ownBank, latestBank: history.latestBank,
        revisions: { product: current.productRevision, records: current.recordsRevision }, configuration: inspected.settingsProvenance,
        card: { path: card.entry.path, blobId: card.entry.oid, sha256: sha(card.bytes) },
        productFiles: actual.map(entry => ({ path: entry.path, mode: entry.mode, sha256: sha(blob(current.product.root, entry)) })),
        qualifiedSuiteBaseline: false });
}

/** Read the original code-empty baseline through this operation's actual
 * accepted mechanical stamp. No caller-provided cut, result or policy waiver.
 * This is read-only and grants no current admission, reservation or lane effect.
 * @param {{productRoot:string,operationId:string,tool:any}} input */
export function captureOriginalCompletedGenesisForDispatch(input) {
    if(!shape(input,["productRoot","operationId","tool"])||typeof input.productRoot!=="string"||typeof input.operationId!=="string")refuse("genesis-original-baseline-request");
    requireInstalledRuntimeAssets(input.tool,["configured-dispatch-operation","configured-dispatch-record","genesis-bank-plan"].map(name=>`tools/e2e/scripts/${name}.mjs`));
    const root=realpathSync(input.productRoot),rec=readAcceptedOperation(root,input.operationId),r=rec?.operation.request;
    if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root||r?.baseline?.kind!=="initialized-code-empty"||!same(r.tool,input.tool))refuse("genesis-original-baseline-operation");
    const stamped=observeConfiguredArmStamp(root,input.operationId);
    if(stamped.status!=="stamped"||!same(stamped.stamp,rec.operation.progress.stamp.acceptance)||
      scalar(root,["rev-parse","HEAD"])!==r.selection.revisions.product||scalar(r.repositories.records.root,["rev-parse","HEAD"])!==r.stamp.commit)refuse("genesis-original-baseline-stamp");
    const proof=completedGenesisDispatchProof({productRoot:root,tool:input.tool,taskId:r.taskId},{recordsRevision:r.selection.revisions.records});
    if(!same(proof,r.baseline)||!same(readAcceptedOperation(root,input.operationId),rec)||!same(observeConfiguredArmStamp(root,input.operationId),stamped)||
      scalar(root,["rev-parse","HEAD"])!==r.selection.revisions.product||scalar(r.repositories.records.root,["rev-parse","HEAD"])!==r.stamp.commit)refuse("genesis-original-baseline-changed");
    verifyInstalledRecordTool(input.tool);return proof;
}

/** The same original baseline during the finite installer's captured partial
 * writes. Both selectors and phase allowances come from the actual strict OP;
 * a serialized baseline, matching path or caller boolean supplies no allowance.
 * Shared exact-write mechanics and the actual paired effect observer are owned
 * by the installer core. Missing composition fails closed until it is present.
 * @param {{productRoot:string,operationId:string,tool:any}} input */
export function captureOriginalCompletedGenesisForInstallation(input) {
    if(!shape(input,["productRoot","operationId","tool"])||typeof input.productRoot!=="string"||typeof input.operationId!=="string")refuse("genesis-install-original-request");
    requireInstalledRuntimeAssets(input.tool,["project-install-record","project-bank-operation","record-write","genesis-bank-plan"].map(name=>`tools/e2e/scripts/${name}.mjs`));
    const observer=/** @type {any} */(pairedOperations).observeProjectInstallation,consumer=/** @type {any} */(exactWrites).assertExactWriteConsumer;
    if(typeof observer!=="function"||typeof consumer!=="function")refuse("genesis-install-original-observer-unavailable");
    const root=realpathSync(input.productRoot),rec=readAcceptedOperation(root,input.operationId),r=rec?.operation.request;
    if(rec?.operation.kind!=="project-install"||rec.resource!==root||!same(r?.tool,input.tool)||r?.baseline?.kind!=="initialized-code-empty")refuse("genesis-install-original-operation");
    const observation=observer(root,input.operationId);
    if(!same(observation?.record,rec)||!observation.effects||!shape(observation.effects,["records","product","metadata"]))refuse("genesis-install-original-observation");
    const verifyCut=()=>{
      for(const role of ["product","records"]){const repo=r.input[`${role}Repository`],plan=r.plans[role],progress=rec.operation.progress[role],effect=observation.effects[role];
        if(!same(captureOperationRepository(repo.root,r.input[`${role}Revision`],{forEffect:false}),repo)||scalar(repo.root,["symbolic-ref","HEAD"])!==plan.targetRef||scalar(repo.root,["rev-parse","HEAD"])!==(effect?.commit??r.input[`${role}Revision`]))refuse("genesis-install-original-cut-changed");
        const checked=consumer(plan,{accepted:effect!==null,partial:["consumer-prepare","files-prepared"].includes(progress.stage)});
        if(!Array.isArray(checked?.ownedWorkingPaths))refuse("genesis-install-original-consumer-unavailable");
        const owned=new Set(checked.ownedWorkingPaths);
        for(const row of text(git(repo.root,["status","--porcelain=v1","-z","--untracked-files=all"])).split("\0").filter(Boolean))if(!/^[ MAD?]{2} /.test(row)||!owned.has(row.slice(3)))refuse("genesis-install-original-foreign-working");
      }
    };
    verifyCut();
    const {inspected,current,setup,history,actual}=completedGenesisContext({productRoot:root,tool:input.tool},{productRevision:r.input.productRevision,recordsRevision:r.input.recordsRevision,ownedWorking:true});
    if(!same(current.docs,r.input.docsIdentity)||!same(current.runtime,r.input.runtimeIdentity))refuse("genesis-install-original-context-changed");
    const proof=freeze({kind:"initialized-code-empty",setup,bank8:history.ownBank,latestBank:history.latestBank,
      revisions:{product:current.productRevision,records:current.recordsRevision},configuration:inspected.settingsProvenance,
      productFiles:actual.map(entry=>({path:entry.path,mode:entry.mode,sha256:sha(blob(current.product.root,entry))})),qualifiedSuiteBaseline:false});
    verifyCut();
    if(!same(proof,r.baseline)||!same(readAcceptedOperation(root,input.operationId),rec)||!same(observer(root,input.operationId),observation))refuse("genesis-install-original-changed");
    verifyCut();verifyInstalledRecordTool(input.tool);return proof;
}


/** Internal effect-policy owner for the same frozen original request. Only
 * immutable source evaluation is cached within one execution; current roots,
 * binding, TOOL, runtime and source bytes are rechecked on every invocation.
 * Observed effects are independently proven by the core, never supplied by IPC.
 * @param {any} request @param {any} tool */
export function createGenesisBankPolicy(request,tool){
 let evaluated=false;
 /** @type {any} */ let original=null;
 const verify=(/** @type {{records:any,product:any}} */ effects)=>{
  if(!validProjectBankRequest(request)||!same(request.tool,tool))refuse("genesis-bank-policy-request");
  requireInstalledRuntimeAssets(tool,["project-bank-operation","project-bank-record","genesis-bank-plan","genesis-bank-proposal","genesis-proposal","records-profile"].map(name=>`tools/e2e/scripts/${name}.mjs`));
  const inspected=inspectProjectInitialization({productRoot:request.input.productRepository.root,tool}),current=inspected.current;
  if(!same(setupReference(inspected.receipt),request.setup)||!same(current.product,request.input.productRepository)||!same(current.records,request.input.recordsRepository)||
   !same(current.docs,request.input.docsIdentity)||!same(current.runtime,request.input.runtimeIdentity)||current.productRevision!==(effects.product?.commit??request.input.productRevision)||current.recordsRevision!==(effects.records?.commit??request.input.recordsRevision))refuse("genesis-bank-policy-context-changed");
  const registry=readPlain(request.input.registryCapture.path,1024*1024);
  if(!same(registry.capture,request.input.registryCapture)||!evaluated&&!same(selectedSession({sessionId:request.session.sessionId,originDigest:request.session.originDigest,tool},inspected,json(registry.bytes)),request.session))refuse("genesis-bank-policy-session-changed");
  const transcript=readPlain(request.input.transcriptCapture.path,16*1024*1024),{base64:ignored,...actualTranscript}=transcript.capture,{lines:capturedLines,...expectedTranscript}=request.input.transcriptCapture;
  if(!same(actualTranscript,expectedTranscript)||capturedLines.some((/** @type {any} */ line)=>transcript.bytes.subarray(line.offset,line.offset+Buffer.byteLength(line.base64,"base64")).toString("base64")!==line.base64))refuse("genesis-bank-policy-transcript-changed");
  const captured=request.bank.proposalCapture,byPath=new Map(captured.records.map((/** @type {any} */ file)=>[file.path,file]));
  const files=captured.proposal.records.map((/** @type {any} */ row)=>{const file=byPath.get(row.path);return {path:file.path,mode:file.mode,bytes:Buffer.from(file.base64,"base64")};});
  for(const file of [...files,{path:GENESIS_BANK_PROPOSAL,mode:"100644",bytes:Buffer.from(captured.sourceBase64,"base64")},...(request.bank.productProposalCapture?[{path:GENESIS_PRODUCT_PROPOSAL,mode:"100644",bytes:Buffer.from(request.bank.productProposalCapture.sourceBase64,"base64")}]:[])]){
   const actual=readPlain(safeOperationWorkingPath(current.records.root,file.path),4*1024*1024);if(actual.mode!==file.mode||!actual.bytes.equals(file.bytes))refuse("genesis-bank-policy-proposal-changed");
  }
  if(original===null)original=observeProjectInitialization(current.product.root,request.setup.operationId);if(original?.status!=="initialized"||!same(setupReference(original.receipt),request.setup))refuse("genesis-bank-policy-setup-changed");
  const base={...current,productRevision:request.input.productRevision,recordsRevision:request.input.recordsRevision};
  const prior=previousBank(listAcceptedOperations(current.product.root),request.session,request.setup,base,request.bank.stage,request.operationId);
  for(const key of ["previousBank","latestBank","ownBank"])if(!same(prior[key],request.input[key]))refuse("genesis-bank-policy-history-changed");
  if(prior.mode!==request.bank.mode||prior.completedStage!==request.bank.completedStage)refuse("genesis-bank-policy-progress-changed");
  qualifyRecordOutputs(files,tree(current.records.root,base.recordsRevision),original.record,current.records.root,base.recordsRevision,base,request.bank.stage,prior.history);
  const settings={status:"ready",settings:inspected.settings,provenance:inspected.settingsProvenance};
  if(settings.status!=="ready"||!same(settings.provenance,request.input.settingsProvenance)||!same(settings.settings.records.validation,request.bank.validation.current.profile))refuse("genesis-bank-policy-settings-changed");
  if(!evaluated){
   const overlay=files.map((/** @type {any} */ file)=>({operation:request.plans.records.writes.find((/** @type {any} */ w)=>w.path===file.path).operation,path:file.path,type:"blob",mode:file.mode,bytes:file.bytes}));
   const evaluate=(/** @type {any} */ profile)=>{const checker=createRecordChecker({tool,profile}),capture=checker.capture({productRoot:current.product.root,productRevision:base.productRevision,recordsRevision:base.recordsRevision}),result=checker.evaluate(capture,overlay);if(!result.accepted)refuse("genesis-bank-policy-check-refused");const writes=checkedRecordWriteSet(result).writes.map((/** @type {any} */ w)=>({operation:w.operation,path:w.path,mode:w.mode,base64:Buffer.from(w.bytes).toString("base64"),derived:w.derived}));return {writes,proof:{profile:checker.profile,captureDigest:capture.digest,candidateDigest:result.candidateDigest,writeSetDigest:operationDigest(writes)}};};
   const checked=evaluate(settings.settings.records.validation);if(!same(checked.proof,request.bank.validation.current))refuse("genesis-bank-policy-check-changed");
   let final=checked;
   if(request.bank.productProposalCapture){
    const proposal=request.bank.productProposalCapture.proposal,pEntries=tree(current.product.root,base.productRevision);
    for(const write of request.plans.product.writes){
     let owned=original.record.operation.request.plans.product.files.find((/** @type {any} */ f)=>f.path===write.path);
     for(const row of prior.history){const previous=row.operation.request.plans.product?.writes.find((/** @type {any} */ f)=>f.path===write.path);if(previous){owned=previous;break;}}
     const entry=pEntries.find(e=>e.path===write.path);if(!owned||!entry||owned.mode!==entry.mode||!blob(current.product.root,entry).equals(Buffer.from(owned.base64,"base64")))refuse("genesis-bank-policy-product-foreign");
     if(request.bank.stage===1){const initial=original.record.operation.request.plans.product.files.find((/** @type {any} */ f)=>f.path===write.path);if(!initial||fillAdapter(text(Buffer.from(initial.base64,"base64")),text(blob(current.product.root,entry)),proposal.identity).toString("base64")!==write.base64)refuse("genesis-bank-policy-adapter-changed");}
    }
    if(request.bank.stage===5){const configured=validateProjectSettingsText({source:JSON.stringify(proposal.settings),tool});if(configured.status!=="ready"||!shape(proposal.settings,SETTINGS)||request.plans.product.writes[0].base64!==Buffer.from(configured.yaml).toString("base64"))refuse("genesis-bank-policy-proposed-settings");final=evaluate(configured.settings.records.validation);if(!same(final.proof,request.bank.validation.prospective))refuse("genesis-bank-policy-prospective-changed");}
   }
   if(!same(final.writes,request.plans.records.writes.filter((/** @type {any} */ w)=>![GENESIS_BANK_PROPOSAL,GENESIS_PRODUCT_PROPOSAL].includes(w.path))))refuse("genesis-bank-policy-write-set-changed");
   evaluated=true;
  }
  verifyInstalledRecordTool(tool);return true;
 };
 return Object.freeze({verify});
}
