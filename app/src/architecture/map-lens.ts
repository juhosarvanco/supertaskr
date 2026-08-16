/**
 * The pane's two lenses (T-034). T-012 shipped the pane with the lens
 * control deliberately ABSENT ("the lens control (architecture · tasks)
 * is absent until a tasks-lens task exists") — this is that task, and
 * this is the whole of the shared vocabulary.
 *
 * Lens view-state stays SESSION-EPHEMERAL, exactly like the overlay,
 * selection and viewport before it: the design says "persisted per
 * project", but that is app-preference state and T-022 owns it ("one
 * store, one precedence order"). A private half-store here would collide
 * with it. The default on every launch is `architecture` — the pane's
 * original single view, so nothing about the pane changes until the
 * control is used.
 */
export type MapLens = "architecture" | "tasks";

export const MAP_LENSES: readonly MapLens[] = ["architecture", "tasks"];
