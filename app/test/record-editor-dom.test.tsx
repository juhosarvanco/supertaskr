// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { emptyState } from "../src/lib/docs-model";
import type { EditorBuffer, EditorOutcome, SaveReceipt } from "../src/lib/record-editor-store";

const ipc = vi.hoisted(() => ({ calls: [] as { command: string; args: Record<string, unknown> }[],
  invoke: null as null | ((command: string, args: Record<string, unknown>) => Promise<unknown>),
  docs: null as unknown, shellListeners: new Set<() => void>() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: (command: string, args: Record<string, unknown>) => {
  ipc.calls.push({ command, args }); return ipc.invoke!(command, args);
} }));
vi.mock("../src/lib/watcher-store", () => ({
  isTauriRuntime: () => true,
  getShellState: () => ({ docs: ipc.docs }),
  subscribeShell: (callback: () => void) => { ipc.shellListeners.add(callback); return () => ipc.shellListeners.delete(callback); },
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const origin = { projectDir: "/selected-product", recordsDir: "/private/original", selectionSequence: 10, contextSequence: 10,
  associationId: "project", rootIncarnation: "1:1", docsIncarnation: "1:2" };
const buffer: EditorBuffer = { id: "native-buffer", fileToken: "native-offered-token", path: "docs/ROADMAP.md", content: "original text",
  origin, productRevision: "a".repeat(40), recordsRevision: "b".repeat(40),
  observedFile: { present: true, sha256: "c".repeat(64), mode: "100644" }, operationId: "save-original-id" };
const receipt: SaveReceipt = { operationId: buffer.operationId, commit: "d".repeat(40), tree: "e".repeat(40), ref: "refs/heads/main",
  previousRevision: buffer.recordsRevision, recovered: false, paths: [buffer.path, "docs/INDEX.md"] };
let container: HTMLDivElement;
let root: Root;
let store: typeof import("../src/lib/record-editor-store");
let releaseSave: ((outcome: EditorOutcome) => void) | null;
let loseSave: boolean;

beforeEach(async () => {
  vi.resetModules(); ipc.calls = []; ipc.shellListeners.clear(); releaseSave = null; loseSave = false;
  ipc.docs = { ...emptyState(), projectDir: origin.projectDir, seq: 10, records: { ...origin, layout: "split", availability: "available", finding: null, contentRevision: null } };
  ipc.invoke = async (command, args) => {
    if (command === "record_recoveries") return { kind: "recoveries", attempt: args.attempt, productDir: origin.projectDir, recoveries: [] };
    if (command === "record_backup_recoveries") return { kind: "backups", attempt: args.attempt, productDir: origin.projectDir, backups: [] };
    if (command === "record_acknowledge") return true;
    if (command === "record_files") return { kind: "files", attempt: args.attempt, origin, files: [{ token: buffer.fileToken, path: buffer.path }] };
    if (command === "record_open") return { kind: "opened", operationKey: args.fileToken, attempt: args.attempt, buffer };
    if (command === "record_cancel") return true;
    if (args.action === "check") return { kind: "checked", operationKey: buffer.id, bufferId: buffer.id, attempt: args.attempt,
      origin, accepted: true, blocking: 0, warnings: 0, retained: 0, messages: [], operationId: buffer.operationId };
    if (args.action === "save") {
      if (loseSave) throw new Error("transport response lost");
      return new Promise<EditorOutcome>(resolve => { releaseSave = resolve; });
    }
    if (args.action === "replay") return { kind: "saved", operationKey: buffer.id, bufferId: buffer.id, attempt: args.attempt,
      origin, receipt: { ...receipt, recovered: true }, submittedContent: "submitted edit" };
    throw new Error("Unexpected native editor command");
  };
  store = await import("../src/lib/record-editor-store");
  const { RecordEditor } = await import("../src/components/records/RecordEditor");
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  act(() => root.render(<RecordEditor />));
  await act(async () => { await store.showRecordEditor(); });
  await act(async () => {
    const select = container.querySelector("select")!;
    select.value = buffer.fileToken; select.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

function click(label: string): void {
  const button = [...container.querySelectorAll("button")].find(button => button.textContent === label);
  expect(button, label).toBeDefined(); button!.click();
}
function edit(value: string): void {
  const field = container.querySelector("textarea")!;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

it("the real editor Save control calls finite native check/save and keeps newer text dirty", async () => {
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  const call = ipc.calls.find(call => call.command === "record_edit" && call.args.action === "save");
  expect(call?.args).toEqual({ bufferId: buffer.id, attempt: expect.any(Number), action: "save", content: "submitted edit" });
  expect(call?.args).not.toHaveProperty("path"); expect(call?.args).not.toHaveProperty("productRoot");
  act(() => edit("newer unsaved edit"));
  await act(async () => { releaseSave!({ kind: "saved", operationKey: buffer.id, bufferId: buffer.id, attempt: call!.args.attempt as number,
    origin, receipt, submittedContent: "submitted edit" }); });
  expect(container.querySelector("textarea")?.value).toBe("newer unsaved edit");
  expect(container.querySelector('[data-testid="record-dirty-state"]')?.textContent).toBe("Unsaved changes");
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).toContain("/private/original");
  expect(ipc.calls.filter(call => call.command === "record_edit").map(call => call.args.action)).toEqual(["check", "save"]);
});

it("shows pending cleanup without losing the accepted save receipt", async () => {
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  const call = ipc.calls.find(call => call.command === "record_edit" && call.args.action === "save")!;
  await act(async () => { releaseSave!({kind:"saved",operationKey:buffer.id,bufferId:buffer.id,attempt:call.args.attempt as number,
    origin,receipt:{...receipt,cleanupWarning:"Saved. Recovery cleanup is pending."},submittedContent:"submitted edit"}); });
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).toContain(receipt.commit.slice(0,12));
  expect(container.querySelector('[data-testid="record-cleanup-warning"]')?.textContent).toBe("Saved. Recovery cleanup is pending.");
  expect(container.querySelector('[data-testid="record-save-unknown"]')).toBeNull();
  expect(store.getRecordEditor().drafts.get(buffer.id)?.savedText).toBe("submitted edit");
});

it("unknown response retains original operation and bytes for replay after context changes", async () => {
  loseSave = true;
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  expect(container.querySelector('[data-testid="record-save-unknown"]')).not.toBeNull();
  expect(store.getRecordEditor().drafts.get(buffer.id)?.unknown?.operationId).toBe(buffer.operationId);
  act(() => {
    edit("newer unsaved edit");
    ipc.docs = { ...emptyState(), projectDir: origin.projectDir, seq: 20,
      records: { ...origin, recordsDir: "/private/rebound", contextSequence: 20, rootIncarnation: "2:1", layout: "split", availability: "available", finding: null, contentRevision: null } };
    for (const listener of ipc.shellListeners) listener();
  });
  expect(container.querySelector('[data-testid="record-stale"]')).not.toBeNull();
  await act(async () => { click("Reconcile previous save"); await Promise.resolve(); });
  const replay = ipc.calls.find(call => call.args.action === "replay");
  expect(replay?.args.content).toBe("submitted edit");
  expect(container.querySelector("textarea")?.value).toBe("newer unsaved edit");
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).toContain("/private/original");
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).not.toContain("/private/rebound");
  expect(container.querySelector('[data-testid="record-save-unknown"]')).toBeNull();
});

it("cancel keeps the operation pending until the original native cleanup response", async () => {
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  const active = store.getRecordEditor().pending!;
  await act(async () => { click("Cancel operation"); await Promise.resolve(); });
  expect(ipc.calls.find(call => call.command === "record_cancel")?.args).toEqual({ operationKey: buffer.id, attempt: active.attempt });
  expect(store.getRecordEditor().pending?.cancelling).toBe(true);
  expect(container.querySelector('[data-testid="record-save-receipt"]')).toBeNull();
  await act(async () => { releaseSave!({ kind: "error", operationKey: buffer.id, attempt: active.attempt, origin,
    code: "records-app-cancelled", message: "Stopped; result must be reconciled", unknown: true, operationId: buffer.operationId }); });
  expect(store.getRecordEditor().pending).toBeNull();
  expect(container.querySelector('[data-testid="record-save-unknown"]')).not.toBeNull();
});

it("accepted response is handled before acknowledgement and acknowledgement failure never invalidates it", async () => {
  const originalInvoke = ipc.invoke!;
  let handled = false;
  ipc.invoke = async (command, args) => {
    if (command === "record_acknowledge") {
      handled = store.getRecordEditor().drafts.get(buffer.id)?.receipt?.commit === receipt.commit;
      throw new Error("bookkeeping response lost");
    }
    return originalInvoke(command, args);
  };
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  const save = ipc.calls.find(call => call.args.action === "save")!;
  await act(async () => { releaseSave!({ kind: "saved", operationKey: buffer.id, bufferId: buffer.id, attempt: save.args.attempt as number,
    origin, receipt, submittedContent: "submitted edit" }); });
  expect(handled).toBe(true);
  expect(store.getRecordEditor().drafts.get(buffer.id)?.receipt).toEqual(receipt);
  expect(store.getRecordEditor().drafts.get(buffer.id)?.unknown).toBeNull();
  expect(container.querySelector('[data-testid="record-dirty-state"]')?.textContent).toBe("No unsaved changes");
  expect(ipc.calls.filter(call => call.args.action === "save")).toHaveLength(1);
});

it("a restarted UI opens captured recovery bytes and replays that original operation", async () => {
  const originalInvoke = ipc.invoke!;
  const row = { token: "native-recovery-token", operationId: buffer.operationId, state: "pending", recordsDir: origin.recordsDir,
    paths: [buffer.path], editorAvailable: true, reason: null, receipt: null };
  ipc.invoke = async (command, args) => {
    if (command === "record_recoveries") return { kind: "recoveries", attempt: args.attempt, productDir: origin.projectDir, recoveries: [row] };
    if (command === "record_open" && args.fileToken === row.token) return { kind: "opened", operationKey: row.token, attempt: args.attempt,
      buffer: { ...buffer, id: "restored-buffer", recoveryContent: "submitted edit" } };
    if (args.action === "replay") return { kind: "saved", operationKey: "restored-buffer", bufferId: "restored-buffer", attempt: args.attempt,
      origin, receipt: { ...receipt, recovered: true }, submittedContent: "submitted edit" };
    return originalInvoke(command, args);
  };
  await act(async () => { await store.showRecordEditor(); });
  await act(async () => { click("Open interrupted draft"); await Promise.resolve(); });
  expect(container.querySelector("textarea")?.value).toBe("submitted edit");
  expect(store.getRecordEditor().drafts.get("restored-buffer")?.unknown?.operationId).toBe(buffer.operationId);
  expect([...container.querySelectorAll("button")].find(button => button.textContent === "Save record")?.disabled).toBe(true);
  await act(async () => { click("Reconcile previous save"); await Promise.resolve(); });
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).toContain(receipt.commit.slice(0, 12));
  expect(ipc.calls.filter(call => call.args.action === "save")).toHaveLength(0);
});

it("the real backup control sends a captured native receipt and preserves dirty text and local success across an unknown response", async () => {
  act(() => edit("submitted edit"));
  await act(async () => { click("Save record"); await Promise.resolve(); });
  const saved = ipc.calls.find(call => call.args.action === "save")!;
  await act(async () => { releaseSave!({ kind: "saved", operationKey: buffer.id, bufferId: buffer.id, attempt: saved.args.attempt as number,
    origin, receipt, submittedContent: "submitted edit" }); });
  act(() => edit("newer unbacked typing"));
  const originalInvoke = ipc.invoke!; let unknown = true;
  ipc.invoke = async (command, args) => {
    if (command !== "record_backup") return originalInvoke(command, args);
    if (unknown) throw Error("lost backup response");
    return { kind: "backedUp", operationKey: args.receiptToken, attempt: args.attempt, commit: receipt.commit,
      receipt: { operationId: "original-backup-id", saveOperationId: receipt.operationId, commit: receipt.commit,
        file: "/private/backups/original.private-backup.json", archiveDigest: `sha256:${"f".repeat(64)}` } };
  };
  await act(async () => { click("Back up saved version"); await Promise.resolve(); });
  expect(ipc.calls.find(call => call.command === "record_backup")?.args).toEqual({ receiptToken: buffer.id, expectedCommit: receipt.commit, attempt: expect.any(Number) });
  expect(container.querySelector('[data-testid="record-save-unknown"]')).toBeNull();
  expect(container.querySelector('[data-testid="record-save-receipt"]')?.textContent).toContain(receipt.commit.slice(0,12));
  expect(container.querySelector('[data-testid="record-backup-status"]')?.textContent).toContain("needs reconciliation");
  expect(container.querySelector("textarea")?.value).toBe("newer unbacked typing");
  unknown = false;
  await act(async () => { click("Check previous backup"); await Promise.resolve(); });
  expect(container.querySelector('[data-testid="record-backup-status"]')?.textContent).toContain("Backup confirmed");
  expect(container.querySelector('[data-testid="record-dirty-state"]')?.textContent).toBe("Unsaved changes");
  expect(ipc.calls.filter(call => call.args.action === "save")).toHaveLength(1);
  expect(ipc.calls.filter(call => call.command === "record_backup").every(call => !Object.keys(call.args).some(key => ["productRoot","operationId","directory","program","tool"].includes(key)))).toBe(true);
});
