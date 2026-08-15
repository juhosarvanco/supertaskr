/** The slice of Document the panel's dismissal wiring needs — a
 * parameter so the node-env regression suite can drive the listeners
 * without a DOM emulator (see test/panel-dismissal.test.ts). */
export type DismissalDoc = Pick<Document, "addEventListener" | "removeEventListener">;

/**
 * Dismissal wiring for the task detail panel: Esc closes; a POINTERDOWN
 * outside the panel closes unless it lands on a card trigger (that
 * press's click opens/switches the panel — closing here too would race
 * it shut) or inside a `[data-panel-exempt]` subtree (T-005-s3/T-017:
 * controls whose activation must not cost the panel — the app header's
 * theme toggle and siblings, the board's parked-row toggle. Checking a
 * card's colors in both themes, or expanding parked to switch to one of
 * its tasks, should never dismiss what you are looking at). Returns the
 * detach function (the effect's cleanup).
 *
 * Why pointerdown and not click (T-005 rejection, 2026-08-15): under a
 * trusted click the browser runs microtask checkpoints between listener
 * invocations, so React flushes a discrete update BETWEEN its root
 * listener and this document-level listener. Clicking a resolved
 * blocker chip re-rendered the blocked-by list mid-propagation, the
 * chip detached, and a click-time decision then saw contains() false
 * and no [data-card-trigger] ancestor — and closed the freshly
 * re-targeted panel. (Synthetic element.click() propagates
 * synchronously, which is why only real input hit it.) pointerdown
 * fires before activation handlers and therefore before any React
 * flush: the inside/outside/exemption decision is always made against
 * the still-intact tree, for every in-panel interactive element current
 * and future, whatever its activation unmounts — the pattern dismissal
 * layers in production UI libraries use. Keyboard activation (Enter/
 * Space fires a trusted click with the same mid-propagation flush, but
 * no pointer event at all) can no longer spuriously dismiss either.
 */
export function attachPanelDismissal(
  doc: DismissalDoc,
  panel: () => Element | null,
  onClose: () => void,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  };
  const onPointerDown = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (panel()?.contains(target)) return;
    if (target.closest("[data-card-trigger]") !== null) return;
    if (target.closest("[data-panel-exempt]") !== null) return;
    onClose();
  };
  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("pointerdown", onPointerDown);
  return () => {
    doc.removeEventListener("keydown", onKeyDown);
    doc.removeEventListener("pointerdown", onPointerDown);
  };
}
