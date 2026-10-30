import { invoke } from "@tauri-apps/api/core";
import { getShellState, isTauriRuntime, subscribeShell } from "./watcher-store";
import type { DocsModelState } from "./docs-model";

export interface EditorOrigin {
  projectDir: string;
  recordsDir: string;
  selectionSequence: number;
  contextSequence: number;
  associationId: string | null;
  rootIncarnation: string;
  docsIncarnation: string | null;
}
export interface EditorFile { token: string; path: string }
export interface EditorBuffer {
  id: string;
  fileToken: string;
  path: string;
  content: string;
  origin: EditorOrigin;
  productRevision: string;
  recordsRevision: string;
  observedFile: { present: boolean; sha256: string; mode: string };
  operationId: string;
  recoveryContent?: string;
}
export interface SaveReceipt {
  operationId: string;
  commit: string;
  tree: string;
  ref: string;
  previousRevision: string;
  recovered: boolean;
  paths: string[];
  cleanupWarning?: string;
}
export interface EditorRecovery {
  token: string;
  operationId: string;
  state: "pending" | "accepted" | "uncertain";
  recordsDir: string;
  paths: string[];
  editorAvailable: boolean;
  reason: string | null;
  receipt: SaveReceipt | null;
  backup?: BackupStatus;
}
export interface BackupReceipt { operationId: string; saveOperationId: string; commit: string; file: string; archiveDigest: string }
export interface BackupStatus { status: "unknown" | "backed-up" | "unavailable"; receipt?: BackupReceipt; message?: string }
export interface BackupRecovery { token: string; commit: string; recordedState: string; backup?: BackupStatus }
export type EditorAction = "discover" | "recover" | "acknowledge" | "files" | "open" | "check" | "save" | "replay" | "backup-discover" | "backup";
export type EditorOutcome =
  | { kind: "backups"; attempt: number; productDir: string; backups: BackupRecovery[] }
  | { kind: "backedUp"; operationKey: string; attempt: number; commit: string; receipt: BackupReceipt }
  | { kind: "backupCancelled"; operationKey: string; attempt: number; commit: string }
  | { kind: "backupError"; operationKey: string; attempt: number; commit: string | null; code: string; message: string; unknown: boolean }
  | { kind: "recoveries"; attempt: number; productDir: string; recoveries: EditorRecovery[] }
  | { kind: "recovered"; operationKey: string; attempt: number; recovery: EditorRecovery; receipt: SaveReceipt }
  | { kind: "files"; attempt: number; origin: EditorOrigin; files: EditorFile[] }
  | { kind: "opened"; operationKey: string; attempt: number; buffer: EditorBuffer }
  | { kind: "checked"; operationKey: string; attempt: number; bufferId: string; origin: EditorOrigin;
      accepted: boolean; blocking: number; warnings: number; retained: number; messages: string[]; operationId: string }
  | { kind: "saved"; operationKey: string; attempt: number; bufferId: string; origin: EditorOrigin;
      receipt: SaveReceipt; submittedContent: string; message?: string | null }
  | { kind: "error"; operationKey: string; attempt: number; origin: EditorOrigin | null;
      code: string; message: string; unknown: boolean; operationId: string | null; nextOperationId?: string };
export interface RecordDraft {
  buffer: EditorBuffer;
  text: string;
  savedText: string;
  version: number;
  stale: boolean;
  check: null | { version: number; accepted: boolean; blocking: number; warnings: number; retained: number; messages: string[] };
  receipt: SaveReceipt | null;
  unknown: null | { operationId: string; submittedContent: string };
  message: string | null;
  backup?: BackupStatus;
}
export interface PendingEditorOperation {
  key: string;
  attempt: number;
  action: EditorAction;
  submittedContent: string | null;
  version: number | null;
  cancelling: boolean;
  receiptCommit?: string;
}
export interface RecordEditorView {
  visible: boolean;
  listing: { origin: EditorOrigin; files: EditorFile[] } | null;
  drafts: ReadonlyMap<string, RecordDraft>;
  activeId: string | null;
  pending: PendingEditorOperation | null;
  message: string | null;
  recoveries: EditorRecovery[];
  recoveryProductDir: string | null;
  recoveryMessage: string | null;
  backupRecoveries: BackupRecovery[];
  backupMessage: string | null;
  backupProductDir: string | null;
}
export const emptyRecordEditor = (): RecordEditorView => ({
  visible: false, listing: null, drafts: new Map(), activeId: null, pending: null, message: null,
  recoveries: [], recoveryProductDir: null, recoveryMessage: null,
  backupRecoveries: [], backupMessage: null,
  backupProductDir: null,
});
export function sameEditorOrigin(a: EditorOrigin, b: EditorOrigin): boolean {
  return a.projectDir === b.projectDir && a.recordsDir === b.recordsDir &&
    a.selectionSequence === b.selectionSequence && a.contextSequence === b.contextSequence &&
    a.associationId === b.associationId && a.rootIncarnation === b.rootIncarnation && a.docsIncarnation === b.docsIncarnation;
}
export function editorOriginIsCurrent(origin: EditorOrigin, docs: DocsModelState): boolean {
  const records = docs.records;
  return records !== undefined && records.availability === "available" &&
    docs.projectDir === origin.projectDir && records.recordsDir === origin.recordsDir &&
    records.selectionSequence === origin.selectionSequence && records.contextSequence === origin.contextSequence &&
    records.associationId === origin.associationId && records.rootIncarnation === origin.rootIncarnation && records.docsIncarnation === origin.docsIncarnation;
}
/** A context switch retains the draft and its origin. It cannot rebase text or
 * manufacture a persistence receipt from the watcher's new working bytes. */
export function reconcileEditorSelection(prev: RecordEditorView, docs: DocsModelState): RecordEditorView {
  let changed = false;
  const drafts = new Map(prev.drafts);
  for (const [id, draft] of drafts) {
    if (!draft.stale && !editorOriginIsCurrent(draft.buffer.origin, docs)) {
      drafts.set(id, { ...draft, stale: true });
      changed = true;
    }
  }
  const listing = prev.listing !== null && !editorOriginIsCurrent(prev.listing.origin, docs) ? null : prev.listing;
  const foreignBackups = prev.backupProductDir !== null && prev.backupProductDir !== docs.projectDir;
  return changed || listing !== prev.listing || foreignBackups ? { ...prev, drafts, listing,
    ...(foreignBackups ? { backupRecoveries: [], backupProductDir: null, backupMessage: null } : {}) } : prev;
}
/** Every result is admitted by its original request before changing any draft.
 * New typing remains dirty when an older submitted version succeeds. */
export function reduceEditorOutcome(prev: RecordEditorView, outcome: EditorOutcome, docs: DocsModelState): RecordEditorView {
  const pending = prev.pending;
  const key = outcome.kind === "files" ? "files" : outcome.kind === "recoveries" ? "recoveries" : outcome.kind === "backups" ? "backup-recoveries" : outcome.operationKey;
  if (pending === null || pending.attempt !== outcome.attempt || pending.key !== key) return prev;
  if (outcome.kind === "backups") return outcome.productDir === docs.projectDir
    ? { ...prev, pending: null, backupRecoveries: outcome.backups, backupProductDir: outcome.productDir, backupMessage: null }
    : { ...prev, pending: null, backupMessage: "The selected product changed during backup discovery." };
  if (outcome.kind === "backedUp" || outcome.kind === "backupCancelled" || outcome.kind === "backupError") {
    if (pending.action === "backup-discover") return { ...prev, pending: null, backupMessage: outcome.kind === "backupError" ? outcome.message : null };
    if (pending.action !== "backup" || pending.receiptCommit === undefined) return prev;
    if (outcome.commit !== pending.receiptCommit) return outcome.kind === "backupError" ? { ...prev, pending: null, backupMessage: outcome.message } : prev;
    const originalDraft = prev.drafts.get(key), originalSave = prev.recoveries.find(row => row.token === key), originalBackup = prev.backupRecoveries.find(row => row.token === key);
    const saved = originalDraft?.receipt ?? originalSave?.receipt;
    if ((saved?.commit ?? originalBackup?.commit) !== pending.receiptCommit) return prev;
    if (outcome.kind === "backedUp" && (outcome.receipt.commit !== pending.receiptCommit || saved !== undefined && saved !== null && outcome.receipt.saveOperationId !== saved.operationId)) return prev;
    const old = originalDraft?.backup ?? originalSave?.backup ?? originalBackup?.backup;
    const backup = outcome.kind === "backedUp" ? { status: "backed-up" as const, receipt: outcome.receipt }
      : outcome.kind === "backupError" ? { ...(old ?? { status: "unavailable" as const }), ...(outcome.unknown ? { status: "unknown" as const } : {}), message: outcome.message } : old;
    return { ...prev, pending: null, backupMessage: null,
      drafts: originalDraft === undefined ? prev.drafts : new Map(prev.drafts).set(key, { ...originalDraft, backup }),
      recoveries: prev.recoveries.map(row => row.token === key ? { ...row, backup } : row),
      backupRecoveries: prev.backupRecoveries.map(row => row.token === key ? { ...row, backup } : row) };
  }
  if (outcome.kind === "recoveries") {
    return outcome.productDir === docs.projectDir
      ? { ...prev, pending: null, recoveries: outcome.recoveries, recoveryProductDir: outcome.productDir, recoveryMessage: null }
      : { ...prev, pending: null, recoveryMessage: "The selected product changed during recovery discovery." };
  }
  if (outcome.kind === "recovered") {
    const original = prev.recoveries.find(row => row.token === key);
    if (original === undefined || outcome.recovery.token !== key || original.operationId !== outcome.receipt.operationId ||
      original.recordsDir !== outcome.recovery.recordsDir) return prev;
    return { ...prev, pending: null, recoveries: prev.recoveries.map(row => row.token === key
      ? { ...row, state: "accepted", editorAvailable: false, receipt: outcome.receipt, reason: null } : row), recoveryMessage: null };
  }
  if (outcome.kind === "files") {
    return { ...prev, pending: null, listing: editorOriginIsCurrent(outcome.origin, docs) ? { origin: outcome.origin, files: outcome.files } : null,
      message: editorOriginIsCurrent(outcome.origin, docs) ? null : "The records context changed while listing files." };
  }
  if (outcome.kind === "opened") {
    const drafts = new Map(prev.drafts);
    drafts.set(outcome.buffer.id, { buffer: outcome.buffer, text: outcome.buffer.recoveryContent ?? outcome.buffer.content, savedText: outcome.buffer.content,
      version: 0, stale: !editorOriginIsCurrent(outcome.buffer.origin, docs), check: null, receipt: null,
      unknown: outcome.buffer.recoveryContent === undefined ? null : { operationId: outcome.buffer.operationId, submittedContent: outcome.buffer.recoveryContent }, message: null });
    return { ...prev, pending: null, drafts, activeId: outcome.buffer.id, message: null };
  }
  const draft = prev.drafts.get(key);
  if (outcome.kind === "error") {
    if (pending.action === "discover" || pending.action === "recover") return { ...prev, pending: null, recoveryMessage: outcome.message };
    if (draft === undefined) return { ...prev, pending: null, message: outcome.message };
    if (outcome.origin !== null && !sameEditorOrigin(draft.buffer.origin, outcome.origin)) return prev;
    const unknown = outcome.unknown && outcome.operationId !== null
      ? { operationId: outcome.operationId, submittedContent: pending.submittedContent ?? draft.unknown?.submittedContent ?? draft.text }
      : pending.action === "replay" ? null : draft.unknown;
    const stale = draft.stale || outcome.code === "records-app-stale" || outcome.code === "records-app-origin-changed";
    const buffer = !outcome.unknown && outcome.nextOperationId !== undefined ? { ...draft.buffer, operationId: outcome.nextOperationId } : draft.buffer;
    const drafts = new Map(prev.drafts).set(key, { ...draft, buffer, stale, unknown, message: outcome.message });
    return { ...prev, drafts, pending: null, message: null };
  }
  if (draft === undefined || outcome.bufferId !== key || !sameEditorOrigin(draft.buffer.origin, outcome.origin)) return prev;
  if (outcome.kind === "checked") {
    const check = pending.version === draft.version && pending.submittedContent === draft.text
      ? { version: draft.version, accepted: outcome.accepted, blocking: outcome.blocking, warnings: outcome.warnings, retained: outcome.retained, messages: outcome.messages }
      : null;
    const drafts = new Map(prev.drafts).set(key, { ...draft, buffer: { ...draft.buffer, operationId: outcome.operationId }, check, message: null });
    return { ...prev, pending: null, drafts, message: null };
  }
  if (pending.submittedContent !== outcome.submittedContent) return prev;
  const drafts = new Map(prev.drafts).set(key, { ...draft, savedText: outcome.submittedContent, receipt: outcome.receipt,
    unknown: null, check: null, message: outcome.message ?? null, backup: draft.receipt?.commit === outcome.receipt.commit ? draft.backup : undefined });
  return { ...prev, pending: null, drafts, message: null };
}

let view = emptyRecordEditor();
let sequence = 0;
let watching = false;
const listeners = new Set<() => void>();
const publish = (next: RecordEditorView): void => {
  if (next === view) return;
  view = next;
  for (const listener of listeners) listener();
};
export const getRecordEditor = (): RecordEditorView => view;
export function subscribeRecordEditor(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function startRecordEditor(): void {
  if (watching) return;
  watching = true;
  subscribeShell(() => publish(reconcileEditorSelection(view, getShellState().docs)));
}
export function setRecordText(id: string, text: string): void {
  const draft = view.drafts.get(id);
  if (draft === undefined || text === draft.text) return;
  publish({ ...view, drafts: new Map(view.drafts).set(id, { ...draft, text, version: draft.version + 1, check: null }) });
}
export function selectRecordDraft(id: string): void {
  if (view.drafts.has(id)) publish({ ...view, activeId: id });
}
export function closeRecordEditor(): void { publish({ ...view, visible: false }); }

async function perform(action: Exclude<EditorAction, "backup">, key: string, content: string | null = null): Promise<EditorOutcome | null> {
  if (view.pending !== null) return null;
  if (!isTauriRuntime()) {
    publish({ ...view, visible: true, message: "Record editing is available in the desktop app with the installed Supertaskr CLI." });
    return null;
  }
  const draft = view.drafts.get(key);
  if ((action === "save" || action === "check") && (draft === undefined || draft.stale || draft.unknown !== null)) return null;
  const attempt = ++sequence;
  const submittedContent = action === "replay" ? draft?.unknown?.submittedContent ?? content : content;
  publish({ ...view, message: null, pending: { key, attempt, action, submittedContent, version: draft?.version ?? null, cancelling: false } });
  try {
    const outcome = action === "discover"
      ? await invoke<EditorOutcome>("record_recoveries", { attempt })
      : action === "backup-discover"
      ? await invoke<EditorOutcome>("record_backup_recoveries", { attempt })
      : action === "recover"
      ? await invoke<EditorOutcome>("record_recover", { recoveryToken: key, attempt })
      : action === "files"
      ? await invoke<EditorOutcome>("record_files", { attempt })
      : action === "open"
        ? await invoke<EditorOutcome>("record_open", { fileToken: key, attempt })
        : await invoke<EditorOutcome>("record_edit", { bufferId: key, attempt, action, content: content ?? "" });
    const reduced = reduceEditorOutcome(view, outcome, getShellState().docs);
    publish(reduced);
    // Notification bookkeeping starts only after the exact response was
    // admitted. Its failure cannot undo a saved receipt or offer another save.
    if (outcome.kind === "saved" && reduced.drafts.get(key)?.receipt === outcome.receipt ||
        outcome.kind === "recovered" && reduced.recoveries.find(row => row.token === key)?.receipt === outcome.receipt) {
      await acknowledgeReceipt(key);
    } else if (outcome.kind === "recoveries" && reduced.recoveries === outcome.recoveries) {
      for (const row of outcome.recoveries) if (row.receipt !== null) await acknowledgeReceipt(row.token);
    }
    return outcome;
  } catch {
    const currentPending = getRecordEditor().pending;
    if (currentPending?.attempt !== attempt || currentPending.key !== key) return null;
    if (action === "backup-discover") {
      const outcome: EditorOutcome = { kind: "backupError", operationKey: key, attempt, commit: null, code: "records-app-backup-transport",
        message: "Previous backups could not be read. Local records remain saved.", unknown: false };
      publish(reduceEditorOutcome(view, outcome, getShellState().docs)); return outcome;
    }
    const unknown = action === "save" || action === "replay";
    const outcome: EditorOutcome = { kind: "error", operationKey: key, attempt, origin: draft?.buffer.origin ?? null,
      code: "records-app-transport", message: unknown ? "The save response is unavailable. Reconcile this same operation before saving changed text." : "The record service response is unavailable.",
      unknown, operationId: unknown ? draft?.unknown?.operationId ?? draft?.buffer.operationId ?? null : null };
    publish(reduceEditorOutcome(view, outcome, getShellState().docs));
    return outcome;
  } finally {
    // A malformed/obsolete response cannot release another attempt's state.
    const currentPending = getRecordEditor().pending;
    if (currentPending?.attempt === attempt && currentPending.key === key) publish({ ...view, pending: null });
  }
}
async function acknowledgeReceipt(token: string): Promise<void> {
  if (view.pending !== null) return;
  const attempt = ++sequence;
  publish({ ...view, pending: { key: token, attempt, action: "acknowledge", submittedContent: null, version: null, cancelling: false } });
  try { await invoke<boolean>("record_acknowledge", { receiptToken: token, attempt }); }
  catch { /* The canonical operation remains discoverable on a later refresh. */ }
  finally {
    const pending = getRecordEditor().pending;
    if (pending?.attempt === attempt && pending.key === token) publish({ ...view, pending: null });
  }
}
export async function showRecordEditor(): Promise<void> {
  startRecordEditor();
  publish({ ...view, visible: true });
  await perform("discover", "recoveries");
  await perform("backup-discover", "backup-recoveries");
  await perform("files", "files");
}
export async function openRecordFile(token: string): Promise<void> { await perform("open", token); }
export async function checkRecordDraft(id: string): Promise<void> {
  const draft = view.drafts.get(id);
  if (draft !== undefined) await perform("check", id, draft.text);
}
export async function saveRecordDraft(id: string): Promise<void> {
  const draft = view.drafts.get(id);
  if (draft === undefined || draft.stale || draft.unknown !== null) return;
  const text = draft.text;
  const version = draft.version;
  const checked = await perform("check", id, text);
  const current = view.drafts.get(id);
  if (checked?.kind === "checked" && checked.accepted && current !== undefined && current.version === version && current.text === text && !current.stale) {
    await perform("save", id, text);
  }
}
export async function replayRecordSave(id: string): Promise<void> {
  const draft = view.drafts.get(id);
  if (draft !== undefined && draft.unknown !== null) await perform("replay", id, draft.unknown.submittedContent);
}
export async function reconcileDiscoveredSave(token: string): Promise<void> {
  if (view.recoveries.some(row => row.token === token)) await perform("recover", token);
}
/** Capture the displayed receipt, never a later save selected after an await.
 * The native service owns all roots, backup IDs and the folder dialog. */
export async function backupSavedRecord(token: string, displayedCommit: string): Promise<void> {
  if (view.pending !== null || !isTauriRuntime()) return;
  const draft = view.drafts.get(token), saved = draft?.receipt ?? view.recoveries.find(row => row.token === token)?.receipt;
  const recovery = view.backupRecoveries.find(row => row.token === token);
  if ((saved?.commit ?? recovery?.commit) !== displayedCommit || draft?.stale === true) return;
  const attempt = ++sequence;
  publish({ ...view, backupMessage: null, pending: { key: token, attempt, action: "backup", receiptCommit: displayedCommit,
    submittedContent: null, version: null, cancelling: false } });
  try {
    const outcome = await invoke<EditorOutcome>("record_backup", { receiptToken: token, expectedCommit: displayedCommit, attempt });
    publish(reduceEditorOutcome(view, outcome, getShellState().docs));
  } catch {
    publish(reduceEditorOutcome(view, { kind: "backupError", operationKey: token, attempt, commit: displayedCommit,
      code: "records-app-backup-transport", message: "The backup result is unknown. Check this same backup again; local records remain saved.", unknown: true }, getShellState().docs));
  } finally {
    const pending = getRecordEditor().pending;
    if (pending?.attempt === attempt && pending.key === token) publish({ ...view, pending: null });
  }
}
export async function cancelRecordOperation(): Promise<void> {
  const pending = view.pending;
  if (pending === null) return;
  publish({ ...view, pending: { ...pending, cancelling: true } });
  try { await invoke("record_cancel", { operationKey: pending.key, attempt: pending.attempt }); }
  catch { /* The original operation remains pending until its result/cleanup. */ }
}
