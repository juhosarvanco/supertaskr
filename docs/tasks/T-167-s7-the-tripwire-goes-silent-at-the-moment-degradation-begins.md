---
id: T-167-s7
title: The tripwire goes SILENT at the exact moment degradation begins — shedding symbols raises headroom, so the alarm reads healthy while the map thins
status: suggested
suggested_by: integrator nputer-4e @T-169 merge regen, 2026-08-30
touches: [crate-index]
---

Measured at the T-169 merge regen, one command
(`index --check --root ../..` from app/src-tauri/), two consecutive
regens on the same day:

- T-025-s6's regen: 190 files, **2,205 symbols**, 1,035,307 bytes —
  99.5%, ALARM printing (4,693 left under the 14,914 tripwire).
- T-169's regen: 192 files, **2,084 symbols**, 1,005,840 bytes —
  96.7%, **NO ALARM** (34,160 left).

Two files JOINED and 121 symbols VANISHED: `apply_budget` began
dropping symbol arrays largest-first — the honest degradation T-140
built — and the emitted file SHRANK below the tripwire, so
`headroom_alarm` fell silent at the exact moment the graph started
lying by omission. The check output prints NOTHING about the drop:
no dropped-symbols count, no per-file thinning list, and the CURRENT
verdict reads as clean health.

The ask: degradation is a LOUDER state than low headroom, not a
cure for it — when the fresh emit dropped anything, the alarm block
prints the dropped count (and ideally which files thinned), and low
headroom stays the lesser warning beneath it. `T-167-s5` (the alarm
names what your tree just spent) is the sibling; this is the case
where "spent" goes negative and means the opposite of relief.
`T-140-s1` remains the real fix and its urgency is now measured in
dropped symbols, not remaining bytes.

RESURFACES: next standing sitting, or with T-140-s1's dispatch —
whichever first.
