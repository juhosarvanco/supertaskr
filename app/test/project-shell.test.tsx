// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "../src/App";
import { noDocsMessage } from "../src/lib/watcher-store";

// T-007 empty-state rendering (criteria a and c's DOM half): the friendly
// empty state must name what was looked for, offer a re-pick affordance,
// and never render a blank region. EmptyState is pure presentational, so
// it mounts here without the store or Tauri IPC.

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

const noop = () => {};

describe("EmptyState (T-007)", () => {
  it("renders the no-docs message naming the path and the convention layout", () => {
    render(
      <EmptyState
        message={noDocsMessage("/tmp/not-a-project")}
        picking={false}
        canKeepCurrent={false}
        onPick={noop}
        onKeepCurrent={noop}
      />,
    );
    const message = container.querySelector('[data-testid="empty-state-message"]');
    expect(message?.textContent).toContain("no docs/ found in /tmp/not-a-project");
    expect(message?.textContent).toContain("docs/tasks/");
    expect(message?.textContent).toContain("docs/decisions/");
    // Not blank: the section renders heading + message + actions.
    expect(container.querySelector('[data-testid="empty-state"]')).not.toBeNull();
    expect(container.textContent).toContain("no board to show");
  });

  it("offers a working re-pick affordance", () => {
    const onPick = vi.fn();
    render(
      <EmptyState
        message="no project open"
        picking={false}
        canKeepCurrent={false}
        onPick={onPick}
        onKeepCurrent={noop}
      />,
    );
    const button = container.querySelector('[data-testid="pick-folder"]');
    expect(button).not.toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button?.textContent).toContain("Open a project folder…");
    click(button as Element);
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("disables the picker button while the native dialog is open", () => {
    const onPick = vi.fn();
    render(
      <EmptyState
        message="no project open"
        picking={true}
        canKeepCurrent={false}
        onPick={onPick}
        onKeepCurrent={noop}
      />,
    );
    const button = container.querySelector('[data-testid="pick-folder"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("choosing…");
  });

  it("offers keep-current only when a project is still open behind the rejection", () => {
    const onKeep = vi.fn();
    render(
      <EmptyState
        message={noDocsMessage("/tmp/x")}
        picking={false}
        canKeepCurrent={true}
        onPick={noop}
        onKeepCurrent={onKeep}
      />,
    );
    const keep = container.querySelector('[data-testid="keep-current"]');
    expect(keep).not.toBeNull();
    click(keep as Element);
    expect(onKeep).toHaveBeenCalledTimes(1);

    render(
      <EmptyState
        message="no project open"
        picking={false}
        canKeepCurrent={false}
        onPick={noop}
        onKeepCurrent={noop}
      />,
    );
    expect(container.querySelector('[data-testid="keep-current"]')).toBeNull();
  });
});
