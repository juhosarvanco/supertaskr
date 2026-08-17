---
id: T-051-s8
title: The lens region's height is a function of the fixture's row count — T-027-s5's conclusion is vindicated and its stated lever is not
status: suggested
suggested_by: verifier claude-opus-5 @T-051
---

Three sessions have now measured the genesis pane's own scroll region at
1440×900 and got three answers — T-027's verifier **780/780**, T-051's
executor **858/780**, T-028's build **780/780 and red**. T-051 filed
T-051-s2 saying T-027's figures "do not reproduce" and declined to
guess. The mechanism is now measured, and it explains all three.

**The region's content height is a function of the artifact ROW COUNT
and the lens's width. Nothing else moved.** Measured on
`task/T-051-window` at f60b3e8, in the exact scenario
`interview.spec.ts`'s frame test drives (`arrive` → `applyDocs` → eight
pushed turns), selector
`genesis-pane-slot >> div.overflow-y-auto >> first`, fonts confirmed
`loaded` (`Geist:loaded`, `Geist Mono:loaded`):

| fixture | rows | 1024×768 | 1280×720 | 1440×900 | strict `>` at 1440×900 |
|---|---|---|---|---|---|
| `streakFixture` (9 files) | 9 | 970/648 | 886/600 | **858/780** (margin 78) | PASS |
| T-028's `streakMidInterview` (6 files, no `docs/tasks/`) | 7 | 876/648 | 792/600 | **780/780** (margin 0) | **FAIL** |

The second row was produced here by dropping `docs/tasks/` from the same
fixture — T-028's exact subtraction — and it lands on **780/780**, the
precise cell T-028 reports going red. Artifact rows are 40px tall on a
47px pitch; two rows out of the lens is 78px out of the content, which is
the whole of the margin.

**T-027-s5's conclusion is therefore right and has come true:** a
`toBeGreaterThan(content, box)` at the widest lens has margin only while
the fixture is tall enough, and one content change tips it. That is
worth keeping in T-065.

**T-027-s5's stated lever is wrong, and it should not be carried
forward.** s5 attributes its 780/780 to "identical in instrument but
with a project dir of `/e2e/genesis` (12 chars) instead of the spec's
`/e2e/streak` (11)". Both dirs were measured here, against both
fixtures, at all three viewports: **every cell is identical**. One extra
character in the path moves nothing. Whatever produced s5's 673/657/780,
it was not the dir — those content heights are shorter than either tree
above, so that probe rendered fewer rows still.

**And T-051-s2 needs the same correction.** As filed it reads as
"T-027 measured wrong"; the accurate statement is that the region's
height is fixture-dependent, which is *why* an assertion with no margin
was unsafe. T-051's own 858/780 reproduces exactly and independently —
it is the number for the tree the committed spec drives.

For T-065: the criterion should name the mechanism (content volume, not
path length), and the split T-028 already shipped — "bounded at every
size" as the frame's property, plus "scrolls where content genuinely
exceeds the box" — is the shape that survives a fixture change.
