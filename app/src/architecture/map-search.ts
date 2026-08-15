import type { DerivedArchitecture } from "@/lib/architecture/derive";
import { UNMAPPED_ID } from "@/lib/architecture/derive";

/**
 * Map search (T-012): one list, two kinds — components and files.
 * Symbol search arrives with T-013's T2 panel (the committed graph
 * carries symbols already; the search stays honest about what selecting
 * a result can DO today, which is select-and-center a T0 node).
 *
 * Pure and deterministic: rank = (kind: components first, then files) ·
 * (match position asc) · (text asc). Case-insensitive substring — the
 * smallest model that covers "C-05", "watcher", "docs_watch.rs"
 * (ranking/cap details are a recorded planning silence).
 */

export interface SearchResult {
  kind: "component" | "file";
  /** Display text (component: "C-05 App"; file: the repo path). */
  text: string;
  /** The T0 node selecting this result targets. */
  componentId: string;
  /** Right-edge tag: the owning component for files ("unmapped" in
   * --warning when no component claims it), the word "component"
   * otherwise. */
  tag: string;
  /** True when the tag renders in the warning ink (unmapped files). */
  warning: boolean;
}

/** Results cap — the popover stays a glance, not a browser. */
export const SEARCH_CAP = 20;

export function searchMap(derived: DerivedArchitecture, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [];

  const components: { pos: number; text: string; result: SearchResult }[] = [];
  for (const component of derived.components) {
    const label = `${component.id} ${component.name}`;
    const pos = label.toLowerCase().indexOf(q);
    if (pos === -1) continue;
    components.push({
      pos,
      text: label,
      result: {
        kind: "component",
        text: label,
        componentId: component.id,
        tag: "component",
        warning: false,
      },
    });
  }

  const files: { pos: number; text: string; result: SearchResult }[] = [];
  for (const [path, owner] of derived.fileComponent) {
    const pos = path.toLowerCase().indexOf(q);
    if (pos === -1) continue;
    const unmapped = owner === UNMAPPED_ID;
    files.push({
      pos,
      text: path,
      result: {
        kind: "file",
        text: path,
        componentId: owner,
        tag: unmapped ? "unmapped" : owner,
        warning: unmapped,
      },
    });
  }

  const rank = (
    a: { pos: number; text: string },
    b: { pos: number; text: string },
  ): number => a.pos - b.pos || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0);
  components.sort(rank);
  files.sort(rank);

  return [...components, ...files].slice(0, SEARCH_CAP).map((entry) => entry.result);
}
