// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "../src/App";
import { CONVENTION_HINT, EMPTY_PROBE } from "../src/lib/watcher-store";

// T-007 empty-state rendering (criteria a and c's DOM half), redressed by
// T-026 into the design's front door: the two ways in ("Open a folder…",
// "Start an interview", ⌘O · ⌘N) always render, and when a folder is
// named the card becomes "No plan in <folder>" — the checklist of what
// was looked for, answered per row, with "Start an interview here" and no
// Adopt button (fenced to archaeology in v1). EmptyState is presentational
// apart from its two accelerators, so it mounts here without the store.

declare global {
  // React 19's act() requires this opt-in outside a test renderer.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(element: React.ReactElement): void {
  act(() => root.render(element));
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function press(key: string, init: KeyboardEventInit = { metaKey: true }): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

/** All props defaulted; each test overrides what it is about. */
function mount(patch: Partial<React.ComponentProps<typeof EmptyState>> = {}): {
  onPick: ReturnType<typeof vi.fn>;
  onStartInterview: ReturnType<typeof vi.fn>;
  onStartInterviewHere: ReturnType<typeof vi.fn>;
  onKeepCurrent: ReturnType<typeof vi.fn>;
} {
  const handlers = {
    onPick: vi.fn(),
    onStartInterview: vi.fn(),
    onStartInterviewHere: vi.fn(),
    onKeepCurrent: vi.fn(),
  };
  render(
    <EmptyState
      notice={{ kind: "noPlan", path: "/tmp/not-a-project", probe: EMPTY_PROBE }}
      picking={false}
      canKeepCurrent={false}
      {...handlers}
      {...patch}
    />,
  );
  return handlers;
}

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);

describe("front door: the two ways in (T-026 criterion 1)", () => {
  it("renders both buttons and the ⌘O · ⌘N hint on every empty state", () => {
    mount({ notice: { kind: "message", message: "no project open" } });
    expect(q('[data-testid="pick-folder"]')?.textContent).toContain("Open a folder…");
    expect(q('[data-testid="start-interview"]')?.textContent).toContain("Start an interview");
    expect(q('[data-testid="shortcut-hint"]')?.textContent).toBe("⌘O · ⌘N");
    expect(q('[data-testid="empty-state"]')).not.toBeNull();
  });

  it("wires each button to its own action", () => {
    const h = mount();
    click(q('[data-testid="pick-folder"]') as Element);
    click(q('[data-testid="start-interview"]') as Element);
    expect(h.onPick).toHaveBeenCalledTimes(1);
    expect(h.onStartInterview).toHaveBeenCalledTimes(1);
  });

  it("the advertised accelerators actually work (⌘O opens, ⌘N interviews)", () => {
    const h = mount();
    press("o");
    press("n");
    expect(h.onPick).toHaveBeenCalledTimes(1);
    expect(h.onStartInterview).toHaveBeenCalledTimes(1);
    // Ctrl for the platforms without a Command key.
    press("o", { ctrlKey: true });
    expect(h.onPick).toHaveBeenCalledTimes(2);
    // Bare keys and other chords are not ours to swallow.
    press("o", {});
    press("p");
    press("n", { metaKey: true, shiftKey: true });
    expect(h.onPick).toHaveBeenCalledTimes(2);
    expect(h.onStartInterview).toHaveBeenCalledTimes(1);
  });

  it("stops listening once the front door is gone", () => {
    const h = mount();
    act(() => root.render(<div />));
    press("o");
    expect(h.onPick).not.toHaveBeenCalled();
  });

  it("disables both ways in while the native dialog is open", () => {
    mount({ picking: true });
    expect((q('[data-testid="pick-folder"]') as HTMLButtonElement).disabled).toBe(true);
    expect((q('[data-testid="pick-folder"]') as HTMLElement).textContent).toContain("choosing…");
    expect((q('[data-testid="start-interview"]') as HTMLButtonElement).disabled).toBe(true);
    expect((q('[data-testid="start-interview-here"]') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('the "No plan in <folder>" card (T-026 criterion 1)', () => {
  it("names the folder, keeps the looked-for paths, and offers the interview", () => {
    mount({
      notice: {
        kind: "noPlan",
        path: "/tmp/not-a-project",
        probe: { ...EMPTY_PROBE, git: true },
      },
    });
    const heading = q('[data-testid="no-plan-heading"]');
    expect(heading?.textContent).toContain("No plan in");
    expect(heading?.textContent).toContain("/tmp/not-a-project");
    expect(q('[data-testid="empty-state-message"]')?.textContent).toContain(
      "Here's where it looked",
    );

    // The checklist IS the preserved enumeration of what was looked for.
    const rows = [...container.querySelectorAll('[data-testid="plan-checklist"] li')].map(
      (li) => li.textContent ?? "",
    );
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain("docs/ROADMAP.md");
    expect(rows[1]).toContain("docs/tasks/*.md");
    expect(rows[2]).toContain("docs/ARCHITECTURE.md");
    expect(rows[3]).toContain(".git");
    // Marks are measured: nothing found is ○, the probed .git is ✓.
    expect(rows[0]).toContain("○");
    expect(rows[3]).toContain("✓");
    expect(rows[3]).toContain("it is a repo, so the plan can live here");

    // ...and the T-007 hint survives as the footnote (docs/decisions/
    // is still named on this screen).
    expect(container.textContent).toContain(CONVENTION_HINT);
  });

  it("renders ○ for a .git it did not find — never a mark it did not measure", () => {
    mount();
    const rows = [...container.querySelectorAll('[data-testid="plan-checklist"] li')].map(
      (li) => li.textContent ?? "",
    );
    expect(rows.every((r) => r.includes("○"))).toBe(true);
    expect(container.textContent).not.toContain("✓");
    expect(container.textContent).not.toContain("it is a repo");
  });

  it("starts the interview in THAT folder, without re-opening the dialog", () => {
    const h = mount();
    const here = q('[data-testid="start-interview-here"]');
    expect(here?.textContent).toContain("Start an interview here");
    click(here as Element);
    expect(h.onStartInterviewHere).toHaveBeenCalledTimes(1);
    expect(h.onStartInterview).not.toHaveBeenCalled();
    expect(h.onPick).not.toHaveBeenCalled();
  });

  it("has no Adopt affordance in v1 (deliberately fenced to archaeology)", () => {
    mount({ notice: { kind: "noPlan", path: "/tmp/x", probe: { ...EMPTY_PROBE, git: true } } });
    expect(container.textContent).not.toContain("Adopt");
    expect(container.textContent?.toLowerCase()).not.toContain("adopt");
  });

  it("offers keep-current only when something is still open behind the rejection", () => {
    const h = mount({ canKeepCurrent: true });
    const keep = q('[data-testid="keep-current"]');
    expect(keep).not.toBeNull();
    click(keep as Element);
    expect(h.onKeepCurrent).toHaveBeenCalledTimes(1);

    mount({ canKeepCurrent: false });
    expect(q('[data-testid="keep-current"]')).toBeNull();
  });
});

describe("the plain message card (no folder named yet, or a failed pick)", () => {
  it("renders the message and no checklist", () => {
    mount({ notice: { kind: "message", message: "could not open /gone: watcher re-arm timed out" } });
    expect(q('[data-testid="empty-state-message"]')?.textContent).toBe(
      "could not open /gone: watcher re-arm timed out",
    );
    expect(container.textContent).toContain("no board to show");
    expect(q('[data-testid="plan-checklist"]')).toBeNull();
    expect(q('[data-testid="start-interview-here"]')).toBeNull();
    // Never blank, and the way in is still there.
    expect(q('[data-testid="pick-folder"]')).not.toBeNull();
  });
});
