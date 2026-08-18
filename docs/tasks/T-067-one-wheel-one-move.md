---
id: T-067
title: One wheel, one move — the map pans without native scrolling underneath it
feature: F-06
milestone: 4
priority: 20
size: M
status: planned
blocked_by: [T-062]
touches: [app-map, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs T-062-s2 and T-062-s4 (architect triage 2026-08-18). The first
finding identified T-062's new wheel double-move; the verifier's correction
proved its bound was axis-dependent and materially larger. They are one input
contract and SHALL be fixed together.

T-012's interaction ruling remains authoritative: a bare wheel pans the map;
control- or command-wheel zooms it. T-062 correctly made both architecture and
task canvases `overflow-auto` so a bounded frame cannot delete graph content.
That reachability mechanism also made the browser's native scroll consume the
same wheel event as the transform pan. One gesture now moves two coordinate
systems.

Measured in the served bundle against the real graph:

| viewport | max scrollTop | max scrollLeft | vertical wheel 300 | horizontal wheel 300 |
|---|---:|---:|---|---|
| 1280×840 | 0 | 0 | pan −300 only | pan −300 only |
| 1024×700 | 0 | 152 | pan −300 only | pan −300 + native 152 |
| 800×600 | 54 | 376 | pan −300 + native 54 | pan −300 + native 300 |

The 800×600 horizontal case is an exact doubling until native overflow clamps.
The fix is not to remove the scrollbar or fit the graph: those would reopen
T-062 or overturn T-012. The pan stays authoritative and cancels native wheel
scrolling while every hidden pixel remains reachable by the existing transform
controls and scrollbar affordance.

## Acceptance criteria
- BOTH architecture and tasks lenses SHALL use one shared wheel ownership
  mechanism. A bare wheel changes only the map transform; control- or
  command-wheel changes only zoom. Neither path may also change the canvas's
  native `scrollTop` or `scrollLeft`.
- THE listener SHALL be a real DOM `wheel` listener registered through the
  canvas ref with `{ passive: false }`, and SHALL call `preventDefault()` only
  for wheel input the map owns. React's passive root listener is not sufficient.
- THERE SHALL be exactly one registration while mounted, one cleanup on
  unmount, and a current callback without re-registering on every render.
  Poisoning passive mode, cleanup, callback freshness or cancellation SHALL red.
- T-062's `overflow-auto`, bounded-frame geometry, deterministic node layout,
  fit/reset controls and reachability sweep SHALL remain. This card introduces
  no fit-to-frame policy and no second layout algorithm.
- TRUSTED browser input SHALL prove both axes at 1024×700 and 800×600, and the
  zero-overflow case at 1280×840. The assertions SHALL observe transform and
  native offsets independently so equal-and-opposite mistakes cannot pass.
- THE same trusted-input coverage SHALL exercise both the architecture and
  tasks lenses. Synthetic dispatch alone is not evidence for passive/default
  browser behaviour.
- NO IPC, capability, dependency, parser, manifest or shell-layout surface may
  move. Any adjacent map refactor must be smaller than the behaviour it proves.
- EVERY added or changed assertion SHALL be poisoned red and restored exactly.

Verification: headless app types/build/full vitest and full E2E lane, including
trusted wheel input at all three viewports and both lenses. Graph and boot gates
fire if their path rules say so. @human: judge trackpad feel in light and dark
after relaunch; the mechanical double-move is not a judgment call.

## Implementation notes

## Verdicts
