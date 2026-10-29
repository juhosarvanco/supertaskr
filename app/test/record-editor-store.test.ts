import { describe, expect, it } from "vitest";
import { emptyState } from "../src/lib/docs-model";
import {
  emptyRecordEditor, reconcileEditorSelection, reduceEditorOutcome,
  type EditorBuffer, type EditorOrigin, type PendingEditorOperation, type RecordEditorView, type SaveReceipt,
} from "../src/lib/record-editor-store";

const origin: EditorOrigin = { projectDir: "/product", recordsDir: "/private/r1", selectionSequence: 10,
  contextSequence: 10, associationId: "project", rootIncarnation: "1:1", docsIncarnation: "1:2" };
const buffer: EditorBuffer = { id: "buffer-a", fileToken: "offered-a", path: "docs/ROADMAP.md", content: "original",
  origin, productRevision: "a".repeat(40), recordsRevision: "b".repeat(40),
  observedFile: { present: true, mode: "100644", sha256: "c".repeat(64) }, operationId: "save-original-id" };
const docs = (selected = origin) => ({ ...emptyState(), projectDir: selected.projectDir, seq: selected.contextSequence,
  records: { ...selected, layout: "split", availability: "available" as const, finding: null, contentRevision: null } });
const pending = (action: PendingEditorOperation["action"], key = buffer.id, attempt = 1, submittedContent = "submitted", version = 1): PendingEditorOperation =>
  ({ action, key, attempt, submittedContent, version, cancelling: false });
const opened = (): RecordEditorView => reduceEditorOutcome({ ...emptyRecordEditor(), pending: pending("open", "offered-a") },
  { kind: "opened", operationKey: "offered-a", attempt: 1, buffer }, docs());
const draft = (text = "submitted", version = 1): RecordEditorView => {
  const state = opened();
  return { ...state, drafts: new Map(state.drafts).set(buffer.id, { ...state.drafts.get(buffer.id)!, text, version }) };
};
const receipt: SaveReceipt = { operationId: buffer.operationId, commit: "d".repeat(40), tree: "e".repeat(40),
  ref: "refs/heads/main", previousRevision: buffer.recordsRevision, recovered: false, paths: [buffer.path, "docs/INDEX.md"] };

describe("backup receipt separation", () => {
  const backup = { operationId: "native-backup", saveOperationId: receipt.operationId, commit: receipt.commit,
    file: "/private/backup/copy.private-backup.json", archiveDigest: `sha256:${"a".repeat(64)}` };
  const saved = () => reduceEditorOutcome({ ...draft("newer typing", 2), pending: pending("save") },
    { kind: "saved", operationKey: buffer.id, attempt: 1, bufferId: buffer.id, origin, receipt, submittedContent: "submitted" }, docs());
  it("backup uncertainty never changes local persistence or submitted/dirty text", () => {
    const before = saved(); const next = reduceEditorOutcome({ ...before, pending: { ...pending("backup"), receiptCommit: receipt.commit } },
      { kind: "backupError", operationKey: buffer.id, attempt: 1, commit: receipt.commit, code: "lost", message: "Unknown backup", unknown: true }, docs());
    expect(next.drafts.get(buffer.id)).toMatchObject({ text: "newer typing", savedText: "submitted", receipt, unknown: null, backup: { status: "unknown" } });
    expect(next.drafts.get(buffer.id)?.buffer.operationId).toBe(before.drafts.get(buffer.id)?.buffer.operationId);
  });
  it("an actual original backup attaches only to its matching save and leaves a later context untouched", () => {
    const before = saved(), otherOrigin = { ...origin, projectDir: "/other", recordsDir: "/private/other", selectionSequence: 30, contextSequence: 30 };
    const other = { ...before.drafts.get(buffer.id)!, buffer: { ...buffer, id: "other-buffer", origin: otherOrigin }, receipt: null, text: "other", savedText: "other" };
    before.drafts = new Map(before.drafts).set(other.buffer.id, other); before.activeId = other.buffer.id;
    const next = reduceEditorOutcome({ ...before, pending: { ...pending("backup"), receiptCommit: receipt.commit } },
      { kind: "backedUp", operationKey: buffer.id, attempt: 1, commit: receipt.commit, receipt: backup }, docs(otherOrigin));
    expect(next.drafts.get(other.buffer.id)).toBe(other); expect(next.activeId).toBe(other.buffer.id);
    expect(next.drafts.get(buffer.id)?.backup?.receipt).toBe(backup); expect(next.drafts.get(buffer.id)?.savedText).toBe("submitted");
  });
  it("a response for another accepted save cannot mark the current save backed up", () => {
    const before = { ...saved(), pending: { ...pending("backup"), receiptCommit: receipt.commit } };
    expect(reduceEditorOutcome(before, { kind: "backedUp", operationKey: buffer.id, attempt: 1, commit: receipt.commit,
      receipt: { ...backup, saveOperationId: "foreign-save" } }, docs())).toBe(before);
    expect(reduceEditorOutcome(before, { kind: "backedUp", operationKey: buffer.id, attempt: 1, commit: "f".repeat(40),
      receipt: { ...backup, commit: "f".repeat(40) } }, docs())).toBe(before);
  });
  it("cold stored progress stays separate from a freshly observed backup receipt and retires on project change", () => {
    const before = { ...emptyRecordEditor(), pending: pending("backup-discover", "backup-recoveries") };
    const next = reduceEditorOutcome(before, { kind: "backups", attempt: 1, productDir: origin.projectDir,
      backups: [{ token: "cold-token", commit: receipt.commit, recordedState: "finished" }] }, docs());
    expect(next.backupRecoveries[0]?.backup).toBeUndefined(); expect(next.drafts.size).toBe(0);
    expect(reconcileEditorSelection(next, docs({ ...origin, projectDir: "/other" })).backupRecoveries).toEqual([]);
  });
});

describe("origin-bound record drafts", () => {
  it("restores interrupted captured text as replay-only with its original operation", () => {
    const next = reduceEditorOutcome({ ...emptyRecordEditor(), pending: pending("open", "recovery-token") },
      { kind: "opened", operationKey: "recovery-token", attempt: 1, buffer: { ...buffer, recoveryContent: "original captured intent" } }, docs());
    const restored = next.drafts.get(buffer.id)!;
    expect(restored.text).toBe("original captured intent");
    expect(restored.savedText).toBe("original");
    expect(restored.unknown).toEqual({ operationId: buffer.operationId, submittedContent: "original captured intent" });
    expect(restored.receipt).toBeNull();
  });

  it("keeps accepted discovery metadata separate from current buffers and rejects a foreign discovery", () => {
    const previous = { ...draft(), pending: pending("discover", "recoveries") };
    const row = { token: "old-operation", operationId: receipt.operationId, state: "accepted" as const,
      recordsDir: "/private/earlier", paths: receipt.paths, editorAvailable: false, reason: null, receipt };
    const next = reduceEditorOutcome(previous, { kind: "recoveries", attempt: 1, productDir: origin.projectDir, recoveries: [row] }, docs());
    expect(next.recoveries[0]?.receipt).toBe(receipt);
    expect(next.drafts.get(buffer.id)?.receipt).toBeNull();
    expect(next.drafts.get(buffer.id)?.text).toBe("submitted");
    const foreign = reduceEditorOutcome(previous, { kind: "recoveries", attempt: 1, productDir: "/other-product", recoveries: [row] }, docs());
    expect(foreign.recoveries).toEqual([]);
  });

  it("preserves unsaved text across same-product R1 to R2 and marks its original buffer stale", () => {
    const previous = draft();
    const r2 = { ...origin, contextSequence: 20, recordsDir: "/private/r2", rootIncarnation: "2:1" };
    const next = reconcileEditorSelection(previous, docs(r2));
    expect(next.drafts.get(buffer.id)?.text).toBe("submitted");
    expect(next.drafts.get(buffer.id)?.buffer.origin).toBe(origin);
    expect(next.drafts.get(buffer.id)?.stale).toBe(true);
  });

  it("rejects a foreign attempt before touching the pending operation or draft", () => {
    const previous = { ...draft(), pending: pending("save") };
    expect(reduceEditorOutcome(previous, { kind: "saved", operationKey: buffer.id, attempt: 999, bufferId: buffer.id, origin,
      receipt, submittedContent: "submitted" }, docs())).toBe(previous);
    expect(previous.pending?.attempt).toBe(1);
  });

  it("does not mark newer typing clean when the older submitted version saves", () => {
    const previous = { ...draft("newer unsaved bytes", 2), pending: pending("save") };
    const next = reduceEditorOutcome(previous, { kind: "saved", operationKey: buffer.id, attempt: 1, bufferId: buffer.id, origin,
      receipt, submittedContent: "submitted" }, docs());
    expect(next.drafts.get(buffer.id)?.text).toBe("newer unsaved bytes");
    expect(next.drafts.get(buffer.id)?.savedText).toBe("submitted");
    expect(next.drafts.get(buffer.id)?.receipt).toBe(receipt);
  });

  it("attaches a late original receipt only to its original buffer after another context opens", () => {
    const otherOrigin = { ...origin, projectDir: "/product-c", recordsDir: "/private/c", selectionSequence: 30, contextSequence: 30 };
    const previous = reconcileEditorSelection({ ...draft(), pending: pending("save") }, docs(otherOrigin));
    const otherBuffer = { ...buffer, id: "buffer-c", origin: otherOrigin };
    previous.drafts = new Map(previous.drafts).set(otherBuffer.id, { ...previous.drafts.get(buffer.id)!, buffer: otherBuffer, text: "C", savedText: "C", stale: false });
    previous.activeId = otherBuffer.id;
    const next = reduceEditorOutcome(previous, { kind: "saved", operationKey: buffer.id, attempt: 1, bufferId: buffer.id, origin,
      receipt, submittedContent: "submitted" }, docs(otherOrigin));
    expect(next.activeId).toBe(otherBuffer.id);
    expect(next.drafts.get(otherBuffer.id)?.receipt).toBeNull();
    expect(next.drafts.get(buffer.id)?.receipt?.operationId).toBe(buffer.operationId);
    expect(next.drafts.get(buffer.id)?.stale).toBe(true);
  });

  it("keeps the exact operation and submitted bytes when a save is unknown", () => {
    const previous = { ...draft("newer bytes", 2), pending: pending("save") };
    const next = reduceEditorOutcome(previous, { kind: "error", operationKey: buffer.id, attempt: 1, origin,
      code: "records-app-timeout", message: "result unknown", unknown: true, operationId: buffer.operationId }, docs());
    expect(next.drafts.get(buffer.id)?.unknown).toEqual({ operationId: buffer.operationId, submittedContent: "submitted" });
    expect(next.drafts.get(buffer.id)?.text).toBe("newer bytes");
    expect(next.drafts.get(buffer.id)?.receipt).toBeNull();
  });

  it("rejects a response carrying another origin even with the correct buffer and attempt", () => {
    const previous = { ...draft(), pending: pending("save") };
    expect(reduceEditorOutcome(previous, { kind: "saved", operationKey: buffer.id, attempt: 1, bufferId: buffer.id,
      origin: { ...origin, recordsDir: "/foreign" }, receipt, submittedContent: "submitted" }, docs())).toBe(previous);
  });

  it("does not apply old validation to newer text and keeps the new backend operation id", () => {
    const previous = { ...draft("newer text", 2), pending: pending("check") };
    const next = reduceEditorOutcome(previous, { kind: "checked", operationKey: buffer.id, attempt: 1, bufferId: buffer.id, origin,
      accepted: true, blocking: 0, warnings: 0, retained: 0, messages: [], operationId: "save-next-id" }, docs());
    expect(next.drafts.get(buffer.id)?.check).toBeNull();
    expect(next.drafts.get(buffer.id)?.buffer.operationId).toBe("save-next-id");
    expect(next.drafts.get(buffer.id)?.text).toBe("newer text");
  });

  it("an explicit absent-operation refusal clears unknown state without creating a receipt", () => {
    const state = draft();
    state.drafts = new Map(state.drafts).set(buffer.id, { ...state.drafts.get(buffer.id)!, unknown: { operationId: buffer.operationId, submittedContent: "submitted" } });
    const next = reduceEditorOutcome({ ...state, pending: pending("replay") }, { kind: "error", operationKey: buffer.id, attempt: 1, origin,
      code: "records-save-operation-absent", message: "operation absent", unknown: false, operationId: null }, docs());
    expect(next.drafts.get(buffer.id)?.unknown).toBeNull();
    expect(next.drafts.get(buffer.id)?.receipt).toBeNull();
    expect(next.drafts.get(buffer.id)?.text).toBe("submitted");
  });

  it("adopts a fresh backend ID only for a known zero-effect refusal while preserving draft bytes", () => {
    const state = draft();
    state.drafts = new Map(state.drafts).set(buffer.id, { ...state.drafts.get(buffer.id)!, unknown: { operationId: buffer.operationId, submittedContent: "submitted" } });
    const next = reduceEditorOutcome({ ...state, pending: pending("replay") }, { kind: "error", operationKey: buffer.id, attempt: 1, origin,
      code: "OPERATION_POLICY_REFUSED", message: "known zero effects", unknown: false, operationId: null, nextOperationId: "save-fresh-id" }, docs());
    expect(next.drafts.get(buffer.id)?.buffer.operationId).toBe("save-fresh-id");
    expect(next.drafts.get(buffer.id)?.unknown).toBeNull();
    expect(next.drafts.get(buffer.id)?.text).toBe("submitted");
    expect(next.drafts.get(buffer.id)?.receipt).toBeNull();
  });
});
