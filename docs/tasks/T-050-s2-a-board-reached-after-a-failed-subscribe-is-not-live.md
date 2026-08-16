---
id: T-050-s2
title: A board reached after a failed `subscribe` never updates, and nothing on screen says so
status: suggested
suggested_by: executor claude-opus-5 @T-050
---

Found while writing T-050's tests, and pinned as a FACT there rather than
fixed: the two startup failures are not the same defect, and only one of
them is repaired by escaping through the picker.

**The asymmetry**, asserted in `app/test/startup-recovery.test.ts`
("records the snapshot step, and the subscription that DID succeed is not
lost"):

- **`invoke` rejected** — `listen` had already resolved, so the
  `docs-changed` subscription is LIVE. The next file change arrives on
  its own and the app comes up with no retry at all. Self-healing.
- **`listen` rejected** — there is no subscription. `docs_snapshot` was
  never even reached.

T-050's criterion 3 puts "Open a folder…" and "Start an interview" on the
failure screen, and they work: `pick_project_folder` is a separate
command whose Rust side re-arms the watcher and answers a snapshot, so
the user lands on a real board with real content. **But after a failed
`subscribe` that board is a photograph.** The pick's snapshot renders;
nothing after it does, because the frontend never subscribed to the
channel the Rust watcher pushes on. The user sees a working app that
silently stops tracking their files — which is a worse failure mode than
the honest error screen they escaped from, precisely because it looks
fine.

Three candidate remedies, cheapest first:

1. **Re-run startup after a successful pick when a subscribe failed.**
   `commitPickOutcome` knows the outcome was `picked`/`genesis`;
   `startupFailure?.step === "subscribe"` is exactly the condition. One
   `void startDocsWatcher()` there and the latch machinery does the rest
   (it is open, because recording a failure releases it). Cheap, no new
   IPC, no new state. Needs care that the re-subscribe cannot fight the
   pick's own snapshot — the seq guard should settle it, the same way it
   settles the subscribe-then-pull race today.
2. **Say it.** Keep `startupFailure` set and render a persistent
   "watcher offline — file changes will not appear" note on the board.
   Honest and tiny, but it leaves the user with a broken app and a label.
3. **Keep the unlisten handle.** `listen` resolves to an unlisten
   function that this store discards (`await listen<…>(…)` — the return
   value is dropped, at watcher-store.ts). Holding it would let a retry
   tear down a previous subscription instead of stacking a second one,
   which is also what T-050-s1's timeout idea needs. Structural, and it
   is the one that makes both other options safe.

Not a T-050 defect: no criterion asks for it, and every escape T-050
promises does arrive somewhere. It is the honest limit of "the app can
always recover" — it can always recover its SCREEN, and after one of the
two failures it does not recover its PIPELINE.
