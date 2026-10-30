import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelRecordOperation, checkRecordDraft, closeRecordEditor, getRecordEditor,
  openRecordFile, replayRecordSave, saveRecordDraft, selectRecordDraft,
  setRecordText, showRecordEditor, subscribeRecordEditor, reconcileDiscoveredSave,
  backupSavedRecord, type BackupStatus,
} from "@/lib/record-editor-store";

function BackupState({ backup }: { backup: BackupStatus | undefined }) {
  if (backup === undefined) return null;
  return <div data-testid="record-backup-status" className="break-words text-xs text-muted-foreground" role="status">
    {backup.status === "backed-up" && backup.receipt
      ? <p>Backup confirmed for {backup.receipt.commit.slice(0, 12)} · {backup.receipt.file}</p>
      : <p>{backup.status === "unknown" ? "The backup needs reconciliation." : "Backup is unavailable."} Your local save is kept.</p>}
    {backup.message && <p>{backup.message}</p>}
  </div>;
}

/** Drafts survive closing this panel and switching records contexts. Only a
 * persistence receipt can mark the exact submitted text saved. */
export function RecordEditor() {
  const view = useSyncExternalStore(subscribeRecordEditor, getRecordEditor);
  const [filter, setFilter] = useState("");
  const text = useRef<HTMLTextAreaElement>(null);
  const draft = view.activeId === null ? null : view.drafts.get(view.activeId) ?? null;
  useEffect(() => { if (view.visible && draft !== null) text.current?.focus(); }, [view.visible, draft?.buffer.id]);
  if (!view.visible) return null;
  const candidates = view.listing?.files.filter(file => file.path.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const busy = view.pending !== null;
  const dirty = draft !== null && draft.text !== draft.savedText;
  const canSubmit = draft !== null && !draft.stale && draft.unknown === null && !busy;
  return (
    <aside role="dialog" aria-label="Record editor" data-testid="record-editor" data-panel-exempt
      className="record-editor-layer fixed inset-y-0 right-0 flex w-150 max-w-full flex-col border-l border-border bg-background text-foreground shadow-pop">
      <header className="flex items-center justify-between gap-3 border-b border-hairline p-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Edit records</h2>
          <p className="break-words font-mono text-xs text-muted-foreground">
            {draft?.buffer.origin.recordsDir ?? view.listing?.origin.recordsDir ?? "Selected records home"}
          </p>
        </div>
        <div className="flex gap-2">
          {busy && <Button variant="outline" disabled={view.pending?.cancelling} onClick={() => void cancelRecordOperation()}>
            {view.pending?.cancelling ? "Stopping…" : "Cancel operation"}
          </Button>}
          <Button variant="outline" disabled={busy} onClick={closeRecordEditor}>Close</Button>
        </div>
      </header>
      <div className="flex flex-col gap-2 border-b border-hairline p-4">
        <div className="flex gap-2">
          <input aria-label="Filter record files" value={filter} onChange={event => setFilter(event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Find a record…" />
          <Button variant="outline" disabled={busy} onClick={() => void showRecordEditor()}>Refresh list</Button>
        </div>
        <select aria-label="Open record file" value="" disabled={busy || view.listing === null}
          onChange={event => { if (event.target.value !== "") void openRecordFile(event.target.value); }}
          className="min-w-0 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs">
          <option value="">Choose a record…</option>
          {candidates.slice(0, 100).map(file => <option key={file.token} value={file.token}>{file.path}</option>)}
        </select>
        {candidates.length > 100 && <p className="text-xs text-muted-foreground">Showing the first 100 matches. Narrow the search to find another record.</p>}
        {view.drafts.size > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Open record drafts">
            {[...view.drafts.values()].map(item => (
              <button type="button" role="tab" aria-selected={item.buffer.id === view.activeId} key={item.buffer.id}
                title={`${item.buffer.origin.recordsDir}/${item.buffer.path}`} onClick={() => selectRecordDraft(item.buffer.id)}
                className="rounded-md border border-input px-2 py-1 font-mono text-xs">
                {item.buffer.path}{item.text !== item.savedText ? " *" : ""}{item.stale ? " · earlier context" : ""}
              </button>
            ))}
          </div>
        )}
      </div>
      {(view.recoveries.length > 0 || view.recoveryMessage !== null) && <section aria-label="Interrupted saves" className="max-h-48 overflow-auto border-b border-hairline p-4 text-sm">
        <h3 className="font-semibold">Previous save operations</h3>
        {view.recoveryMessage !== null && <p role="status" className="text-destructive">{view.recoveryMessage}</p>}
        {view.recoveries.map(row => <div key={row.token} className="mt-2 rounded-md border border-input p-2" data-testid="record-recovery">
          <p className="break-words font-mono text-xs">{row.recordsDir} · {row.paths.join(", ")}</p>
          {row.receipt !== null ? <><p data-testid="record-recovery-receipt" className="font-mono text-xs">Original save persisted · {row.receipt.commit.slice(0, 12)}</p>
            {row.receipt.cleanupWarning && <p role="status" className="text-sm text-destructive">{row.receipt.cleanupWarning}</p>}
            <BackupState backup={row.backup} />
            <Button variant="outline" disabled={busy} onClick={() => void backupSavedRecord(row.token, row.receipt!.commit)}>Back up saved version</Button></>
            : <><p>{row.state === "uncertain" ? "The original save needs reconciliation." : "An interrupted save retains its original submitted text and operation."}</p>
              {row.reason !== null && <p className="text-xs text-muted-foreground">{row.reason}</p>}
              <div className="mt-2 flex gap-2">
                {row.editorAvailable && <Button variant="outline" disabled={busy} onClick={() => void openRecordFile(row.token)}>Open interrupted draft</Button>}
                <Button variant="outline" disabled={busy} onClick={() => void reconcileDiscoveredSave(row.token)}>Reconcile original operation</Button>
              </div></>}
        </div>)}
      </section>}
      {(view.backupRecoveries.length > 0 || view.backupMessage !== null) && <section aria-label="Previous backups" className="max-h-48 overflow-auto border-b border-hairline p-4 text-sm">
        <h3 className="font-semibold">Previous backups</h3>
        {view.backupMessage && <p role="status">{view.backupMessage}</p>}
        {view.backupRecoveries.map(row => <div key={row.token} className="mt-2 rounded-md border border-input p-2">
          <p className="font-mono text-xs">Saved version {row.commit.slice(0, 12)}</p>
          {row.backup === undefined && <p className="text-xs text-muted-foreground">{row.recordedState === "native-intent" ? "An original backup attempt in this app needs reconciliation." : "Recorded previously; the local copy has not been checked this session."}</p>}
          <BackupState backup={row.backup} />
          <Button variant="outline" disabled={busy} onClick={() => void backupSavedRecord(row.token, row.commit)}>Reconcile backup</Button>
        </div>)}
      </section>}
      {view.message !== null && <p role="status" className="mx-4 mt-3 text-sm text-destructive">{view.message}</p>}
      {draft === null ? (
        <p className="p-4 text-sm text-muted-foreground">Choose a file to open an editable draft. Closing the panel keeps open drafts.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <h3 className="break-words font-mono text-sm">{draft.buffer.path}</h3>
            <p data-testid="record-dirty-state" className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "No unsaved changes"}</p>
          </div>
          {draft.stale && <p role="status" data-testid="record-stale" className="rounded-md border border-warning-chip-border bg-warning-chip p-3 text-sm">
            This draft belongs to an earlier records context. Its text is kept; open the current record to edit there.
          </p>}
          {draft.unknown !== null && <div role="status" data-testid="record-save-unknown" className="rounded-md border border-warning-chip-border bg-warning-chip p-3 text-sm">
            <p>The save result is unknown. The submitted text and operation have been kept.</p>
            <Button variant="outline" disabled={busy} onClick={() => void replayRecordSave(draft.buffer.id)}>Reconcile previous save</Button>
          </div>}
          <textarea ref={text} aria-label="Record text" data-testid="record-text" value={draft.text}
            onChange={event => setRecordText(draft.buffer.id, event.target.value)} spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-md border border-input bg-background p-3 font-mono text-sm" />
          {draft.message !== null && <p role="status" className="text-sm text-destructive">{draft.message}</p>}
          {draft.check !== null && <div data-testid="record-check-result" className="text-sm text-muted-foreground">
            <p>{draft.check.accepted ? "Record checks passed." : `${draft.check.blocking} blocking record issue${draft.check.blocking === 1 ? "" : "s"}.`}
              {draft.check.warnings > 0 && ` ${draft.check.warnings} warning${draft.check.warnings === 1 ? "" : "s"}.`}</p>
            {draft.check.messages.length > 0 && <ul>{draft.check.messages.map((message, index) => <li key={index}>{message}</li>)}</ul>}
          </div>}
          {draft.receipt !== null && <p data-testid="record-save-receipt" className="break-words font-mono text-xs text-muted-foreground">
            Persisted in {draft.buffer.origin.recordsDir} · {draft.receipt.commit.slice(0, 12)}{draft.receipt.recovered ? " · recovered receipt" : ""}
          </p>}
          {draft.receipt?.cleanupWarning && <p role="status" data-testid="record-cleanup-warning" className="text-sm text-destructive">{draft.receipt.cleanupWarning}</p>}
          {draft.receipt !== null && <div className="flex flex-col gap-2">
            <BackupState backup={draft.backup} />
            <Button variant="outline" disabled={busy || draft.stale || draft.unknown !== null}
              onClick={() => void backupSavedRecord(draft.buffer.id, draft.receipt!.commit)}>
              {draft.backup?.status === "unknown" ? "Check previous backup" : draft.backup?.status === "backed-up" ? "Check saved backup" : "Back up saved version"}
            </Button>
          </div>}
          <footer className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
            <div className="flex gap-2">
              <Button variant="outline" disabled={!canSubmit} onClick={() => void checkRecordDraft(draft.buffer.id)}>Check record</Button>
              <Button disabled={!canSubmit || !dirty} onClick={() => void saveRecordDraft(draft.buffer.id)}>Save record</Button>
            </div>
          </footer>
        </div>
      )}
      {busy && <p role="status" className="border-t border-hairline px-4 py-2 text-xs text-muted-foreground">
        {view.pending?.cancelling ? "Waiting for the record operation to stop…" : view.pending?.action === "backup" ? "Backing up the saved version…" : view.pending?.action === "backup-discover" ? "Reading previous backup operations…" : view.pending?.action === "acknowledge" ? "Recording receipt acknowledgement…" : view.pending?.action === "save" ? "Saving records…" : view.pending?.action === "replay" || view.pending?.action === "recover" ? "Reconciling the original save…" : "Reading or checking records…"}
      </p>}
    </aside>
  );
}
