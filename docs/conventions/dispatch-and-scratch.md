# Dispatch, ports, scratch files and the bench

The serial ritual, the port and filename a lane derives, the verifier's two spawns, and who proposes before recording.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- **THE DISPATCH RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE
  MANIFEST BACK, then cut the next.** T-209's guard refuses a dispatch
  against a lane whose fence it cannot read — *an unread fence is not
  "disjoint from everything"* — and refused four at once when a seat cut
  all four before arming any. **AND STAMP `status: building` BEFORE YOU
  CUT** (T-226): cards that stamped after the cut met a three-way
  conflict at the merge that cards stamped before did not.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/05-dispatch.md (T-290), verbatim.

- **E2E PORT — DERIVE IT PER LANE: `SUPERTASKR_E2E_PORT=15000+<card number>`.**
  The default 14520 is MACHINE-WIDE, so every concurrent lane takes the
  same one; `E2E_PORT` binds NOTHING. `lsof` to zero rows before binding,
  and never 1420.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/05-dispatch.md (T-290), verbatim.

- **SCRATCH RULE — NAME EVERY SCRATCH FILE FOR THE LANE THAT OWNS IT**
  (`<purpose>-<card id>.<ext>`, e.g. `battery-T-216-s1.sh`). **The
  scratchpad is ONE directory shared by every seat a session spawns**, so
  a defaulted filename is a machine-scoped surface exactly like a port,
  and `method/lane-protocol.md` rule 4 already rules the class — *derive
  from the lane, never default*; the spelling is here because the class
  was ruled and the spelling was not, the same gap the PORT RULE below
  closes for ports.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/05-dispatch.md (T-290), verbatim.

- **THE VERIFIER'S BENCH IS TWO SPAWNS, AND THIS BULLET IS THE
  SPELLING, NEVER THE SHAPE.** `method/roles/orchestrator.md` 5d states
  the shape once — phase 1 as its own spawn with no file, git or shell
  tools, what is pasted into it, what it may return — and this bullet
  carries only what 5b leaves to a project: the names and the commands.
  Phase 1's return is SAVED, under the SCRATCH RULE above, as
  `attack-set-<card id>.md`; a defaulted name is the collision that rule
  exists for and two benches at once is when it happens. Hash it the way
  the POISON DRILL below already hashes — `shasum -a 256 <file>`, and
  there is no `sha256sum` on this platform. The verdict appended to the
  card CITES that digest on a line of its own, `attack set:
  sha256:<hex> (<file>)`, so a later reader re-runs one command and gets
  a yes or a no instead of an impression; a REFUSAL is saved, hashed and
  cited identically, because a bench that returned a question is a bench
  whose answer somebody has to be able to find. **A verdict whose cited
  digest does not match the saved file is REFUSED and the pass is
  re-run** — `MF-09` in the method eval gate holds that refusal and
  DEMONSTRATES it, running the comparison against three implementations
  that lack the property (a presence check, a prefix compare, a
  fail-open missing-file branch) and requiring each to be caught. **THE
  WIRING LANDED WITH `T-205-s1`**: `node
  tools/method-evals/verdict-digest.mjs` hands every `attack set:` line
  on the board to MF-09's judge — VERIFIED, REFUSED (exit 1), or
  UNAVAILABLE (exit 3, never a pass: a bare filename and no root named
  at the call) — and `MF-10` runs it in this gate over the board and
  over committed fixtures. **WHAT IS STILL A HAND STEP IS REACHING THE
  SCRATCHPAD**: the checker takes roots only from the call — `--scratch
  <dir>`, repeatable, or `SUPERTASKR_ATTACK_SET_DIR` — never a default
  (rule 4). Do it by hand at the merge — the landing card as the
  argument, `--scratch` on the dispatching session's scratchpad, exit
  read unpiped — until `T-205-s6` gives sealed sets a home in the tree.

- **THE SEAT PROPOSES BEFORE IT RECORDS, AND THIS BULLET IS THE
  POINTER, NEVER THE RULE** (T-307, 2026-09-10). An entry for a room or a
  decision record is shown to the owner in the conversation, verbatim as
  it will be written, and appended only on the owner's yes; the entry
  paraphrases the ruling and dates it, never the owner's words, and the
  owner appears as the owner. The rule is stated once, in
  `method/roles/orchestrator.md` 8b and `method/rooms/ROOM-FORMAT.md`
  (the decision template carries it because it rides the genesis kit and
  the room format does not); MF-11
  (`tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs`) holds it
  over entries dated on or after 2026-09-11 — the day after the rule
  landed, because the sitting that asked for it wrote six entries that
  day and records are never restyled. Cards, checkpoints, STATE and the
  seat's ledger are the seat's own records: written, and nobody asked.

- PORT RULE: 1420 belongs to the human's live `tauri dev`. The lane
  runs its own vite on `SUPERTASKR_E2E_PORT` (default 14520),
  `reuseExistingServer: false`; setting it to 1420 THROWS at config
  load by design, and the boot check bind-probes its port and aborts
  (exit 2) if anything holds it. The boot check moves off 1420 with
  `SUPERTASKR_BOOT_PORT` (T-046; default 1420, so unset is exactly the old
  behavior), which also threads the matching `--config` — `devUrl` AND
  `beforeDevCommand` with `--strictPort` — through to `tauri dev` as
  CLI flags; tauri.conf.json is never edited. Setting `SUPERTASKR_BOOT_PORT`
  to 1420 REFUSES loudly (exit 3, before anything is probed or spawned),
  the same rule as the lane's throw: neither override may become a
  second way to contend for the human's app. The `--` in
  `npm run tauri dev -- --config …` is load-bearing — npm eats a bare
  `--config` after the script name and leaves the JSON as a stray
  positional (measured on npm 11.12.1). Nothing in the lane ever
  contacts a server it does not own.
  ONE READ-ONLY COMMAND ANSWERS EVERY QUESTION ABOUT 1420, AND NOTHING
  ELSE MAY BE USED: `lsof -nP -iTCP:1420 -sTCP:LISTEN` names the holder,
  its pid and its STACK in one line. **Never bind-probe 1420 to learn
  whether it is held** — two agents did on 2026-08-19, harmlessly and
  unnecessarily. The prohibition is on the syscall, not the intent:
  holding 1420 for a sub-millisecond window to prove it is busy is still
  taking 1420 from the human. The rule above governs the LANE's tooling,
  which is why this is stated separately — it governs the hand.
  **THAT SENTENCE IS WHERE THE LANE/HAND DISTINCTION IS STATED, AND IT
  IS LOAD-BEARING** (T-093): the hand's other rules are gathered in
  A CITATION NAMES A SYMBOL, NOT A LINE under Gotchas, and this clause
  is the pointer that keeps them findable. Two more sit here, because
  they are about this command and how it gets typed.
  **NEVER PUT A BACKTICK INSIDE A SHELL STRING** — single-quote a
  command name, or omit it; a heredoc quoted as `<<'EOF'` suppresses
  substitution too.
  Same precedent as the 1420 probe: the rule is on the
  SYSCALL.
  **`lsof` IS THE AUTHORITY AND A `bind()` PROBE IS THE CONFIRMING HALF,
  NEVER THE PRIMARY.**
  For 1420
  there is no bind half at all — read the port and stop.
  **A free IPv4 probe is not
  evidence the app is down.** `tauri-boot-check.mjs` probes `::1` THEN
  `127.0.0.1` and carries a comment naming this hazard; that is the
  shape to copy, and scratch ports must be probed on BOTH stacks.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/05-dispatch.md (T-290), verbatim.
