import { describe, expect, it } from "vitest";
import {
  attachPanelDismissal,
  type DismissalDoc,
} from "../src/components/board/panel-dismissal";

// Regression tests for the 2026-08-15 T-005 rejection: under a real,
// TRUSTED click on a resolved blocker chip the browser runs microtask
// checkpoints between listener invocations, so React flushes the
// onOpen(target) discrete update BETWEEN its root listener and the
// panel's document-level listener. The re-render replaces the
// blocked-by list (different li keys), the clicked chip detaches, and a
// click-time dismissal decision then saw a disconnected target —
// contains() false, no [data-card-trigger] ancestor — and closed the
// panel that had just re-targeted. A synthetic element.click()
// propagates synchronously (no checkpoint mid-dispatch), so no
// dispatched-event test can reproduce the race in any environment;
// these tests force the trusted interleave by hand instead: deliver the
// events to the document-level wiring in trusted order, detaching the
// chip exactly where the real flush does.
//
// The app suite is node-env by design (vitest.config.ts), so the tests
// drive attachPanelDismissal with fakes implementing exactly what the
// wiring reads: instanceof Element, contains(), closest(), parent
// links, isConnected. Board.tsx unmounts the panel precisely when
// onClose fires, so "onClose never called" IS "the panel stays open".

/** Minimal element stand-in: a tree node with the few DOM members the
 * dismissal wiring touches. */
class FakeElement {
  parent: FakeElement | null = null;
  isRoot = false;
  private readonly children: FakeElement[] = [];
  private readonly attrs: ReadonlySet<string>;

  constructor(attrs: readonly string[] = []) {
    this.attrs = new Set(attrs);
  }

  append(child: FakeElement): FakeElement {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(): void {
    if (this.parent === null) return;
    const siblings = this.parent.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parent = null;
  }

  get isConnected(): boolean {
    let node: FakeElement = this;
    while (node.parent !== null) node = node.parent;
    return node.isRoot;
  }

  contains(other: unknown): boolean {
    let node = other;
    while (node instanceof FakeElement) {
      if (node === this) return true;
      node = node.parent;
    }
    return false;
  }

  matches(selector: string): boolean {
    const attr = /^\[([a-z-]+)\]$/.exec(selector);
    if (attr === null) {
      throw new Error(`FakeElement supports only [attr] selectors, got: ${selector}`);
    }
    return this.attrs.has(attr[1]);
  }

  closest(selector: string): FakeElement | null {
    let node: FakeElement | null = this;
    while (node !== null) {
      if (node.matches(selector)) return node;
      node = node.parent;
    }
    return null;
  }
}

// The wiring narrows event.target with `instanceof Element`; node-env
// has no Element global, so the fake stands in. Vitest isolates test
// files, so the global cannot leak into other suites.
(globalThis as Record<string, unknown>).Element = FakeElement;

/** Document stand-in: records listeners; `deliver` invokes the
 * listeners for `type` the way a bubbling event's final stop at
 * document would — with whatever target the dispatch captured,
 * connected or not. */
class ListenerDoc {
  private readonly listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener): void {
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  deliver(type: string, target: FakeElement): void {
    const event = new Event(type);
    Object.defineProperty(event, "target", { value: target });
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }

  deliverKeydown(key: string): void {
    const event = new Event("keydown");
    Object.defineProperty(event, "key", { value: key });
    for (const listener of [...(this.listeners.get("keydown") ?? [])]) listener(event);
  }
}

/** The board DOM around the race, in fakes:
 *  documentElement
 *  ├─ board
 *  │   ├─ background                  (genuine outside-press target)
 *  │   └─ cardTrigger [data-card-trigger]
 *  │       └─ cardLabel               (real presses land on inner spans)
 *  └─ panel (the aside)
 *      └─ blockedByList (ul)
 *          └─ chipItem (li)
 *              └─ chip (blocker button)
 */
const buildTree = () => {
  const documentElement = new FakeElement();
  documentElement.isRoot = true;
  const board = documentElement.append(new FakeElement());
  const background = board.append(new FakeElement());
  const cardTrigger = board.append(new FakeElement(["data-card-trigger"]));
  const cardLabel = cardTrigger.append(new FakeElement());
  const panel = documentElement.append(new FakeElement());
  const blockedByList = panel.append(new FakeElement());
  const chipItem = blockedByList.append(new FakeElement());
  const chip = chipItem.append(new FakeElement(["data-blocker-id"]));
  return { background, cardLabel, panel, blockedByList, chipItem, chip };
};

/** Attach the real wiring to a fresh fake board; returns probes. */
const attach = () => {
  const doc = new ListenerDoc();
  const tree = buildTree();
  let closes = 0;
  const detach = attachPanelDismissal(
    doc as unknown as DismissalDoc,
    () => tree.panel as unknown as Element,
    () => {
      closes += 1;
    },
  );
  return { doc, ...tree, closeCount: () => closes, detach };
};

describe("panel dismissal wiring (T-005 rejection, 2026-08-15)", () => {
  it("trusted blocker-chip click: chip detaches mid-propagation — panel stays open, re-targeted", () => {
    const t = attach();
    let openRef = "T-A"; // the panel's current target (Board's view state)

    // The trusted ordering, forced:
    // (1) pointerdown propagates and completes — the chip is still
    //     attached inside the panel;
    t.doc.deliver("pointerdown", t.chip);
    // (2) click reaches React's root listener, which runs the chip's
    //     onClick: onOpen({ kind: "id", id: "T-B" });
    openRef = "T-B";
    // (3) the discrete update flushes at the microtask checkpoint
    //     BEFORE the next listener runs: the blocked-by list re-renders
    //     with different keys and the clicked chip's li unmounts;
    t.chipItem.remove();
    t.blockedByList.append(new FakeElement()).append(new FakeElement(["data-blocker-id"]));
    expect(t.chip.isConnected).toBe(false); // the verdict's step (3)
    // (4) the same click finally reaches document — target detached.
    t.doc.deliver("click", t.chip);

    // REJECTED behavior: the wiring closed here. Required: it must not —
    // the press landed inside the panel.
    expect(t.closeCount()).toBe(0);
    expect(openRef).toBe("T-B");
  });

  it("keyboard activation of a chip (trusted click, no pointer events) cannot dismiss either", () => {
    const t = attach();
    let openRef = "T-A";

    // Enter/Space on the focused chip: a trusted keydown (not Escape)...
    t.doc.deliverKeydown("Enter");
    // ...then the UA fires click on the chip, with the same
    // mid-propagation flush: re-target, unmount, THEN document.
    openRef = "T-B";
    t.chipItem.remove();
    expect(t.chip.isConnected).toBe(false);
    t.doc.deliver("click", t.chip);

    expect(t.closeCount()).toBe(0);
    expect(openRef).toBe("T-B");
  });

  it("a genuine outside press still dismisses, exactly once across the press+click pair", () => {
    const t = attach();
    t.doc.deliver("pointerdown", t.background);
    t.doc.deliver("click", t.background);
    expect(t.closeCount()).toBe(1);
  });

  it("a press inside a card trigger's subtree is exempt (its click switches the panel)", () => {
    const t = attach();
    t.doc.deliver("pointerdown", t.cardLabel);
    t.doc.deliver("click", t.cardLabel);
    expect(t.closeCount()).toBe(0);
  });

  it("Escape closes; other keys do not", () => {
    const t = attach();
    t.doc.deliverKeydown("a");
    expect(t.closeCount()).toBe(0);
    t.doc.deliverKeydown("Escape");
    expect(t.closeCount()).toBe(1);
  });

  it("the returned detach removes all wiring", () => {
    const t = attach();
    t.detach();
    t.doc.deliver("pointerdown", t.background);
    t.doc.deliver("click", t.background);
    t.doc.deliverKeydown("Escape");
    expect(t.closeCount()).toBe(0);
  });
});
