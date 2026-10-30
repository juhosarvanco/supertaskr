import { readFileSync, writeFileSync, existsSync, rmSync, linkSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { prepareGenesisBank, assertPreparedGenesisBank, assertGenesisBankRecordOutputs, assertGenesisBankFieldUpdate, deriveGenesisBankHistoryState } from "../scripts/genesis-bank-plan.mjs";
import { inspectProjectInitialization } from "../scripts/genesis-init-inspect.mjs";
import { acceptedOperationPath } from "../scripts/durable-operation.mjs";
import { observeProjectInitialization } from "../scripts/project-init-operation.mjs";
import { readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { validProjectBankRequest } from "../scripts/project-bank-record.mjs";
import { bankSchemaFixture, q1BankSchemaRequest } from "./project-bank-fixture";
import { privateGit, sha } from "./private-record-fixture";
import { withGenesisIdentity } from "./genesis-init-fixture";
let f: ReturnType<typeof bankSchemaFixture>, originalNorth: Buffer;
const input = () => ({ productRoot: f.product, operationId: "bank-constructor-fixture", sessionId: f.request.session.sessionId, originDigest: f.request.session.originDigest,
    expectedProductRevision: f.request.input.productRevision, expectedRecordsRevision: f.request.input.recordsRevision, tool: f.toolHandle });
const prepare = (overrides: Record<string, unknown> = {}) => withGenesisIdentity(() => prepareGenesisBank({ ...input(), ...overrides }));
function restore() {
    const r = f.request, registry = JSON.parse(Buffer.from(r.input.registryCapture.base64, "base64").toString("utf8"));
    registry.sessions[0].native_session_id = "authored-controlled-native-id";
    writeFileSync(r.input.registryCapture.path, JSON.stringify(registry));
    writeFileSync(r.input.transcriptCapture.path, "");
    for (const file of r.bank.proposalCapture.records)
        writeFileSync(path.join(f.records, file.path), Buffer.from(file.base64, "base64"));
    writeFileSync(path.join(f.records, "docs/plans/genesis-bank-proposal.json"), Buffer.from(r.bank.proposalCapture.sourceBase64, "base64"));
    writeFileSync(path.join(f.records, "docs/NORTH_STAR.md"), originalNorth);
    const p = path.join(f.records, "docs/plans/genesis-product-proposal.json");
    if (existsSync(p))
        rmSync(p);
}
function gitFacts() {
    return [f.product, f.records].map(root => ({ refs: privateGit(root, ["for-each-ref", "--format=%(refname) %(objectname)"]),
        index: readFileSync(path.join(root, ".git/index")).toString("base64"), objects: privateGit(root, ["cat-file", "--batch-all-objects", "--batch-check=%(objectname)"]).split("\n").sort() }));
}
function registry(change: (value: any) => void) { const file = f.request.input.registryCapture.path, value = JSON.parse(readFileSync(file, "utf8")); change(value.sessions[0]); writeFileSync(file, JSON.stringify(value)); }
test.beforeAll(() => { f = bankSchemaFixture(true); originalNorth = readFileSync(path.join(f.records, "docs/NORTH_STAR.md")); });
test.beforeEach(() => restore());
test.afterAll(() => f?.cleanup());
test("actual initialized current descendants produce frozen exact scratch plans without managed Git/file/OP effects", () => {
    const operationFile = acceptedOperationPath(f.product, f.receipt.operationId), operationBefore = readFileSync(operationFile);
    const operations = () => readdirSync(path.join(f.product, ".supertaskr/runs")).filter(name => name.startsWith("OP-")).sort();
    const operationsBefore = operations();
    const before = gitFacts(), registryBefore = readFileSync(f.request.input.registryCapture.path), transcriptBefore = readFileSync(f.request.input.transcriptCapture.path);
    expect(input().productRoot.endsWith("  ")).toBe(true);
    const result = prepare(), request = result.request;
    expect(validProjectBankRequest(request)).toBe(true);
    expect(request.setup.recordsRevision).not.toBe(request.input.recordsRevision);
    expect(assertPreparedGenesisBank(request)).toBe(true);
    expect(() => assertPreparedGenesisBank(structuredClone(request))).toThrow("genesis-bank-preparation-required");
    expect(request.plans.product).toBeNull();
    expect(request.plans.records.targetRef).toBe("refs/heads/main");
    expect(request.plans.records.writes.map((w: any) => w.path)).toContain("docs/STATE.md");
    expect(Object.isFrozen(request.input)).toBe(true);
    expect(gitFacts()).toEqual(before);
    expect(operations()).toEqual(operationsBefore);
    expect(readFileSync(operationFile)).toEqual(operationBefore);
    expect(readFileSync(f.request.input.registryCapture.path)).toEqual(registryBefore);
    expect(readFileSync(f.request.input.transcriptCapture.path)).toEqual(transcriptBefore);
    expect(privateGit(f.product, ["status", "--porcelain"])).toBe("");
});
test("current cut/session/setup/busy and typed capture mismatches refuse without a new managed effect", () => {
    const before = gitFacts();
    for (const changed of [{ expectedProductRevision: "f".repeat(40) }, { expectedRecordsRevision: "f".repeat(40) }, { sessionId: "foreign-session" }, { originDigest: `sha256:${"f".repeat(64)}` }])
        expect(() => prepare(changed)).toThrow(/genesis-bank-/);
    for (const change of [(r: any) => { delete r.genesis.setup; }, (r: any) => { r.genesis.setup.recordsRevision = f.request.input.recordsRevision; }, (r: any) => { r.status = "running"; }, (r: any) => { r.genesis.planner.selection.model = "claude-sonnet-5"; }]) {
        restore();
        registry(change);
        expect(() => prepare()).toThrow(/genesis-bank-(?:session-provenance|planner-provenance)/);
    }
    expect(gitFacts()).toEqual(before);
});
test("working byte changes, aliases and unattributed prior-bank witnesses stay unavailable with a restored positive", () => {
    const before = gitFacts(), state = path.join(f.records, "docs/STATE.md"), original = readFileSync(state);
    writeFileSync(state, "Uncaptured changed draft\n");
    expect(() => prepare()).toThrow("genesis-bank-file-changed");
    writeFileSync(state, original);
    const alias = path.join(f.records, "docs/alias.md");
    linkSync(state, alias);
    try {
        expect(() => prepare()).toThrow("genesis-bank-file-kind-or-size");
    }
    finally {
        rmSync(alias);
    }
    const unknown = `refs/supertaskr/project-banks/${"f".repeat(64)}/records`;
    privateGit(f.records, ["update-ref", unknown, input().expectedRecordsRevision]);
    try {
        expect(() => prepare()).toThrow("genesis-bank-history-unattributed");
    }
    finally {
        privateGit(f.records, ["update-ref", "-d", unknown]);
    }
    expect(validProjectBankRequest(prepare().request)).toBe(true);
    expect(gitFacts()).toEqual(before);
});
test("Q1 needs actual same-session human captures and a real accepted predecessor; authored proposal metadata grants neither", () => {
    q1BankSchemaRequest(f);
    const before = gitFacts();
    expect(() => prepare()).toThrow("genesis-bank-predecessor-required");
    const transcript = f.request.input.transcriptCapture.path, line = JSON.parse(readFileSync(transcript, "utf8"));
    line.role = "assistant";
    writeFileSync(transcript, JSON.stringify(line) + "\n");
    expect(() => prepare()).toThrow("genesis-bank-answer-missing");
    expect(gitFacts()).toEqual(before);
});
test("output rule uses actual initialized foundations and canonical role-qualified usable fences with no component registry", () => {
    const observed = inspectProjectInitialization({ productRoot: f.product, tool: f.toolHandle }), initial = observeProjectInitialization(f.product, observed.receipt.operationId)!;
    let source = readInstalledMethodAsset(f.toolHandle, "method/tasks/T-000-template.md").text.replace("id: T-000", "id: T-001").replace("<short imperative title>", "Create the first source file").replace("F-0X", "F-01").replace("touches: []", 'touches: ["product::src/first.ts"]').replaceAll("<trigger>", "the action runs").replaceAll("<behavior>", "write the file").replaceAll("<failure case>", "writing fails").replaceAll("<response>", "report the failure");
    const file = { path: "docs/tasks/T-001-first.md", mode: "100644", bytes: Buffer.from(source) };
    const check = (files: any[]) => assertGenesisBankRecordOutputs({ files, initialRecord: initial.record, current: observed.current });
    expect(check([file])).toBe(true);
    for (const scope of ["product:src/first.ts", "missing-component", "[]"]) {
        const bad = source.replace("product::src/first.ts", scope);
        expect(() => check([{ ...file, bytes: Buffer.from(bad) }])).toThrow("genesis-bank-task-fence-unusable");
    }
    expect(() => check([{ path: "docs/arbitrary.md", mode: "100644", bytes: Buffer.from("Not an initialized foundation\n") }])).toThrow("genesis-bank-foundation-origin");
    // A historically existing numeric ID remains unavailable after deletion,
    // including different zero padding. Real Git history is the source here;
    // this output-rule test confers no stage8 or bank-effect admission.
    mkdirSync(path.join(f.records, "docs/tasks"), { recursive: true });
    const old = "docs/tasks/T-0001-old.md";
    writeFileSync(path.join(f.records, old), source.replace("id: T-001", "id: T-0001"));
    privateGit(f.records, ["add", old]);
    privateGit(f.records, ["commit", "-qm", "Historical authored task fixture"]);
    rmSync(path.join(f.records, old));
    privateGit(f.records, ["add", old]);
    privateGit(f.records, ["commit", "-qm", "Remove historical authored task fixture"]);
    const later = inspectProjectInitialization({ productRoot: f.product, tool: f.toolHandle });
    expect(privateGit(f.records, ["ls-tree", "-r", "--name-only", later.current.recordsRevision])).not.toContain(old);
    expect(() => assertGenesisBankRecordOutputs({ files: [file], initialRecord: initial.record, current: later.current })).toThrow("genesis-bank-record-not-new");
});
test("chronological current progress stays distinct from logical predecessor and an earlier bank's own receipt", () => {
    const ref = (stage: number, completedStage: number, commit: string) => ({ operationId: `authored-${commit}`, requestDigest: `sha256:${"a".repeat(64)}`, receiptDigest: `sha256:${"b".repeat(64)}`, stage, completedStage, recordsCommit: commit, productCommit: null });
    const a = ref(0, 0, "a".repeat(40)), b = ref(1, 1, "b".repeat(40)), c = ref(2, 2, "c".repeat(40));
    const earlier = deriveGenesisBankHistoryState({ references: [a, b, c], firstParentChain: [c.recordsCommit, b.recordsCommit, a.recordsCommit], stage: 1 });
    expect(earlier).toEqual({ previousBank: a, latestBank: c, ownBank: b, mode: "update", completedStage: 2 });
    const d = ref(1, 2, "d".repeat(40)), chain = [d.recordsCommit, c.recordsCommit, b.recordsCommit, a.recordsCommit];
    expect(deriveGenesisBankHistoryState({ references: [a, b, c, d], firstParentChain: chain, stage: 3 })).toEqual({ previousBank: c, latestBank: d, ownBank: null, mode: "initial", completedStage: 3 });
    expect(() => deriveGenesisBankHistoryState({ references: [a, b, c, d], firstParentChain: chain, stage: 4 })).toThrow("genesis-bank-predecessor-required");
    expect(() => deriveGenesisBankHistoryState({ references: [a, b, c, { ...d, completedStage: 1 }], firstParentChain: chain, stage: 1 })).toThrow("genesis-bank-history-progress");
    // These are pure authored receipt data, never witnesses/accepted application banks.
});
test("own-field edits preserve other banks, optional Gotchas and append-only decision history", () => {
    const source = readInstalledMethodAsset(f.toolHandle, "method/docs-templates/NORTH_STAR.md").text;
    const q1 = source.replace("<!-- One paragraph. What exists when this project succeeds, and for whom. -->", "A notes tool for one writer.").replace("<!-- Who uses this, in what situation. Be concrete. -->", "A writer reviewing notes each morning.");
    expect(assertGenesisBankFieldUpdate({ file: "docs/NORTH_STAR.md", stage: 1, before: source, after: q1 })).toBe(true);
    expect(() => assertGenesisBankFieldUpdate({ file: "docs/NORTH_STAR.md", stage: 1, before: source, after: q1.replace("<!-- Measurable.", "Changed another bank. <!-- Measurable.") })).toThrow("genesis-bank-field-scope");
    const conventions = readInstalledMethodAsset(f.toolHandle, "method/docs-templates/CONVENTIONS.md").text, gotchas = conventions + "\nA confirmed gotcha.\n";
    expect(assertGenesisBankFieldUpdate({ file: "docs/CONVENTIONS.md", stage: 2, before: conventions, after: gotchas })).toBe(true);
    expect(() => assertGenesisBankFieldUpdate({ file: "docs/CONVENTIONS.md", stage: 2, before: conventions, after: gotchas.replace("## Build & test", "## Different commands") })).toThrow("genesis-bank-field-scope");
    let card = readInstalledMethodAsset(f.toolHandle, "method/tasks/T-000-template.md").text.replace("id: T-000", "id: T-001");
    expect(assertGenesisBankFieldUpdate({ file: "docs/tasks/T-001-first.md", stage: 8, before: card, after: card.replace("<short imperative title>", "Clarify the earlier planned title") })).toBe(true);
    expect(() => assertGenesisBankFieldUpdate({ file: "docs/tasks/T-001-first.md", stage: 8, before: card.replace("status: planned", "status: done"), after: card })).toThrow("genesis-bank-task-planned");
    expect(() => assertGenesisBankFieldUpdate({ file: "docs/tasks/T-001-first.md", stage: 8, before: card, after: card.replace("<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->", "### 2026-10-30 — APPROVED") })).toThrow("genesis-bank-task-lifecycle-body");
    const adr = "# ADR-001: Stack\n\nStatus: accepted\n\n## Decision\nThe earlier captured choice.\n";
    expect(assertGenesisBankFieldUpdate({ file: "docs/decisions/001-stack.md", stage: 5, before: adr, after: adr + "\n## Amendment\nA later captured choice.\n" })).toBe(true);
    expect(() => assertGenesisBankFieldUpdate({ file: "docs/decisions/001-stack.md", stage: 5, before: adr, after: adr.replace("earlier", "rewritten") })).toThrow("genesis-bank-record-append-required");
});
test("a scaffold path with later foreign committed bytes is not owned content at a newer current cut", () => {
    const state = path.join(f.records, "docs/STATE.md"), foreign = "# State\n\nAn independently authored private state must not be overwritten.\n";
    writeFileSync(state, foreign);
    privateGit(f.records, ["add", "docs/STATE.md"]);
    privateGit(f.records, ["commit", "-qm", "Foreign private foundation after initialization"]);
    const revision = privateGit(f.records, ["rev-parse", "HEAD"]), draft = Buffer.from("# State\n\nUpdated: 2026-10-30\n\n## In progress\nThe model's proposed continuation.\n");
    writeFileSync(state, draft);
    const proposal = JSON.parse(Buffer.from(f.request.bank.proposalCapture.sourceBase64, "base64").toString());
    proposal.expectedRecordsRevision = revision;
    proposal.records[0].sha256 = sha(draft);
    writeFileSync(path.join(f.records, "docs/plans/genesis-bank-proposal.json"), JSON.stringify(proposal));
    const before = gitFacts();
    expect(() => prepare({ expectedRecordsRevision: revision })).toThrow("genesis-bank-foreign-content");
    expect(gitFacts()).toEqual(before);
    expect(readFileSync(state)).toEqual(draft);
});
