import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { EXIT, unstampedLines } from "../scripts/dispatch-brief.mjs";

/**
 * THE BRIEF REACHES A PIPE WHOLE (T-197) — no browser.
 *
 * `brief.mjs` ended at `process.exit()`. **Node's stdout is ASYNCHRONOUS
 * when it is a pipe** and synchronous when it is a file or a TTY, so the
 * process tore down with the write queue still draining: to a file the
 * write completed, to a pipe it did not. Exit status 0, no error printed,
 * output ending mid-derivation looking like a complete answer — in the
 * one tool whose entire contract is a trustworthy figure.
 *
 * ── WHY THE OVERSIZE INPUT IS SYNTHESISED ────────────────────────────
 * The obvious body drives the live `--dispatch` and asserts it survives.
 * That body is VACUOUS on a quiet machine, which is exactly the machine
 * an integrator runs a final battery on. The card's own measurements
 * cross the boundary in both directions inside one day — 69,293 →
 * 77,712 → 63,732 bytes — tracking nothing but how many lanes happened
 * to be open, and `T-142-s1` watched the red go FULLY GREEN when two
 * worktrees were removed. A tell that moves reads as a flake; a tell
 * that goes green reads as fixed. So the oversize input here is BUILT,
 * and its size is a property of this file rather than of the board.
 *
 * ── WHY THERE IS NO BOUNDARY NUMBER IN THIS FILE ─────────────────────
 * There is no single loss point, and pinning one pins one reader.
 * Measured at `209e5d3` on this repository, one tree, one command:
 *
 *     --dispatch > file                   66,464 … 69,288 bytes (whole)
 *     --dispatch | cat                    65,536 bytes, 8 of 8 runs
 *     --dispatch via spawnSync            survives to ~66,470
 *
 * The loss point is a property of WHO IS READING, because it is a race
 * between the reader draining the pipe and the writer exiting.
 *
 * ── AND IT IS DECIDED BY A SLOW READER, NEVER BY THE WRITE SHAPE ──────
 * THIS FILE SAID THE OPPOSITE AND THE CORRECTION IS `T-197-s1`, TAKEN AT
 * T-225. It read: *"And it is a property of the WRITE SHAPE too, which
 * is the half that surprises … One write larger than a buffer is what
 * loses."* The measurement behind that sentence is real and is kept —
 * 115,079 bytes as two hundred small `console.log` calls lost NOTHING
 * through either reader at `209e5d3` with the defect fully present — but
 * the inference from it was wrong, because both readers there DRAIN.
 *
 * THE INVARIANT IS ONE LINE AND IT MENTIONS NO SHAPE: **bytes are lost
 * if and only if they are still queued in USERLAND when `process.exit()`
 * runs.** A reader that drains promptly keeps that queue empty however
 * the writer wrote; a reader that pauses lets it fill however small the
 * writes were. Many small writes are not safer — they are the shape a
 * FAST reader happens to rescue.
 *
 * MEASURED BOTH WAYS AT `5f193e6`, one writer of the pre-T-197 shape
 * emitting 524,400 bytes as 200 small writes: through `| cat` all
 * 524,400 arrive, three runs of three; through a reader taking 4,096
 * bytes every 5 ms, 65,536 arrive — one pipe buffer, 458,864 bytes gone
 * at exit status 0 with nothing printed. Same writer, same size, same
 * shape, two readers, and the shape explains none of it. BODY FOUR
 * drives exactly that pair, which is why the correction is a body here
 * and not only a paragraph.
 *
 * So these bodies assert an EQUALITY between two destinations and a
 * floor over the buffer; the only number they derive, they derive at run
 * time and label with the reader it belongs to.
 *
 * ── AND A CI GREEN IS NOT EVIDENCE FOR THIS CLASS ────────────────────
 * CI passed at `5e36a0b` with the brief already 928 bytes past the
 * `| cat` line. A green run proves the reader won the race, not that the
 * tail arrived. That is why the first body carries a POSITIVE CONTROL:
 * it proves, in the same run and through the same two readers, that a
 * writer of the OLD shape at THIS size still loses bytes here. Without
 * it a green says "the readers could not lose" just as loudly as it says
 * "the writer no longer drops".
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/** Generous, so `spawnSync` never becomes a second truncation mechanism. */
const MAX_BUFFER = 64 * 1024 * 1024;

/** One pipe buffer on this platform, and the FLOOR these bodies assert over. */
const PIPE_BUFFER = 65_536;

/** How much the control writer asks for: far past any plausible buffer. */
const CONTROL_WANT = 512 * 1024;

/**
 * TWO INVOCATIONS OF ONE ARM DIFFER IN EXACTLY ONE THING — THE CLOCK
 * (T-225). Since this card every arm carries a MARGIN block disclosing
 * its own size, and that size is a fact about an invocation rather than
 * about a tree, so it is stamped LIVE and carries an ISO timestamp. The
 * bodies below still compare BYTE FOR BYTE; they normalise the one field
 * that is a clock and nothing else, so a byte lost anywhere — inside the
 * margin block included — still reds.
 */
function sameButTheClock(text: string): string {
  return text.replace(/read \d{4}-\d{2}-\d{2}T[\d:.]+Z on /g, "read <clock> on ");
}

/** @see the disclosure precedent in brief.spec.ts and range-rule.spec.ts. */
function disclose(label: string, line: string): void {
  test.info().annotations.push({ type: label, description: line });
  process.stdout.write(`\n  ${label}: ${line}\n`);
}

interface Scratch {
  dir: string;
  cleanup: () => void;
}

function scratch(stem: string): Scratch {
  const dir = mkdtempSync(path.join(os.tmpdir(), `t197-${stem}-`));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/* ────────────────────────────────────────────────────────────────────
 * THE TWO READER SHAPES. A body proving one leaves the other's race
 * unproven, and the card's own measurements disagree by ~934 bytes
 * about where the loss starts.
 * ──────────────────────────────────────────────────────────────────── */

interface Read {
  /** what arrived at the reader */
  bytes: number;
  /** the reader's own text, for a byte-identity comparison */
  text: string;
  /** the writer's exit code as this reader saw it */
  status: number | null;
}

/**
 * READER ONE — `spawnSync`, which is how this suite itself reads the
 * command, so it is the reader whose race decides whether
 * `dispatch-order.spec.ts` reds.
 */
function readViaSpawnSync(argv: string[], cwd = repoRoot): Read {
  const r = spawnSync(process.execPath, argv, {
    cwd,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
  const text = r.stdout ?? "";
  return { bytes: Buffer.byteLength(text, "utf8"), text, status: r.status };
}

/**
 * READER TWO — a shell pipeline into `cat`, which is how a HUMAN reads
 * this command: `| head`, `| grep`, `| less`. It is the reader that
 * loses earliest and most deterministically (65,536 bytes, 8 of 8 runs
 * against `--dispatch` at `5e36a0b`).
 *
 * THE WRITER'S STATUS IS RECOVERED WITHOUT A DIALECT. A pipeline's own
 * status is `cat`'s, and `PIPESTATUS` is a bash/zsh array that `dash`
 * — Ubuntu's `/bin/sh`, which is what CI has — does not carry at all.
 * `docs/CONVENTIONS.md` already records what a shell dialect difference
 * costs this project when it is assumed instead of avoided, so the
 * writer's `$?` goes to a FILE from inside the pipeline's left side,
 * which is POSIX and reads the same everywhere.
 */
function readViaCatPipe(argv: string[], dir: string, cwd = repoRoot): Read {
  const stem = Math.random().toString(36).slice(2);
  const out = path.join(dir, `cat-${stem}.txt`);
  const st = path.join(dir, `cat-${stem}.status`);
  const quoted = [process.execPath, ...argv]
    .map((a) => `'${a.replace(/'/g, "'\\''")}'`)
    .join(" ");
  spawnSync(
    "/bin/sh",
    ["-c", `{ ${quoted} 2>/dev/null; echo $? > '${st}'; } | cat > '${out}'`],
    { cwd, encoding: "utf8", maxBuffer: MAX_BUFFER },
  );
  const text = readFileSync(out, "utf8");
  const written = Number.parseInt(readFileSync(st, "utf8").trim(), 10);
  return {
    bytes: Buffer.byteLength(text, "utf8"),
    text,
    status: Number.isInteger(written) ? written : null,
  };
}

/**
 * THE DESTINATION THAT CANNOT LOSE — a file. Node's stdout is
 * SYNCHRONOUS to a file, which is the whole asymmetry this card is
 * about, so this is the ground truth every pipe read is compared to.
 */
function readViaFile(argv: string[], dir: string, cwd = repoRoot): Read {
  const out = path.join(dir, `file-${Math.random().toString(36).slice(2)}.txt`);
  const fd = openSync(out, "w");
  let status: number | null;
  try {
    status = spawnSync(process.execPath, argv, {
      cwd,
      stdio: ["ignore", fd, "ignore"],
      maxBuffer: MAX_BUFFER,
    }).status;
  } finally {
    closeSync(fd);
  }
  const text = readFileSync(out, "utf8");
  return { bytes: statSync(out).size, text, status };
}

/**
 * THE SLOW READER — a real consumer at the far end of a real pipe, which
 * is what `| less` is and what neither reader above is (T-225).
 *
 * WHY IT IS A SUBPROCESS AND NOT A PAUSED `child.stdout`. The obvious
 * build spawns the command with a piped stdout, pauses that stream and
 * reads it in slices. IT LOSES BYTES BY ITSELF: measured at `5f193e6`,
 * `/bin/cat` of a 524,400-byte FILE read that way delivered 397,312
 * bytes, twice, because node tears down a child's stdio when the child
 * exits and the readable buffer goes with it. A harness that drops data
 * on a writer that dropped none would red this body for its own reason
 * and read as a finding — so the slow reader sits where a human's
 * pager sits, on the other side of a shell pipeline, owning its own
 * stdin.
 *
 * ITS OWN INTEGRITY IS THE FIRST THING BODY FOUR PROVES, and by exactly
 * this route: the same reader takes 524,400 bytes from a writer that
 * exits naturally and loses none of them.
 */
/** One slice the slow reader takes, and how long it waits before the next. */
const SLOW_CHUNK = 4096;
const SLOW_DELAY_MS = 5;

/**
 * How many runs of the DRAINING reader control two takes before it uses
 * the best of them (V-225's F1). Its arrival is a race, so one sample is
 * a coin toss reported as a property; the best of several is a claim
 * about what that reader CAN do, which is what the control argues.
 */
const FAST_SAMPLES = 5;

function slowReader(dir: string): string {
  const file = path.join(dir, "slow-reader.mjs");
  writeFileSync(
    file,
    "// A reader that PAUSES: small slices, a wait between them. It owns its\n" +
      "// own stdin, so nothing but this loop decides how fast the pipe drains.\n" +
      `const CHUNK = ${SLOW_CHUNK};\nconst DELAY = ${SLOW_DELAY_MS};\n` +
      "const inp = process.stdin;\ninp.pause();\n" +
      "let ended = false;\ninp.on('end', () => { ended = true; });\n" +
      "const sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n" +
      "for (;;) {\n" +
      "  const c = inp.read(CHUNK);\n" +
      "  if (c === null) { if (ended) break; await sleep(DELAY); continue; }\n" +
      "  process.stdout.write(c);\n" +
      "  await sleep(DELAY);\n" +
      "}\n",
    "utf8",
  );
  return file;
}

/**
 * READER THREE — the command's output through that pauser, with the
 * writer's own `$?` recovered the same dialect-free way `readViaCatPipe`
 * recovers it.
 */
function readViaSlowPipe(argv: string[], dir: string, cwd = repoRoot): Read {
  const reader = slowReader(dir);
  const stem = Math.random().toString(36).slice(2);
  const out = path.join(dir, `slow-${stem}.txt`);
  const st = path.join(dir, `slow-${stem}.status`);
  const quoted = (a: string[]) => a.map((s) => `'${s.replace(/'/g, "'\\''")}'`).join(" ");
  spawnSync(
    "/bin/sh",
    [
      "-c",
      `{ ${quoted([process.execPath, ...argv])} 2>/dev/null; echo $? > '${st}'; } | ` +
        `${quoted([process.execPath, reader])} > '${out}'`,
    ],
    { cwd, encoding: "utf8", maxBuffer: MAX_BUFFER },
  );
  const text = readFileSync(out, "utf8");
  const written = Number.parseInt(readFileSync(st, "utf8").trim(), 10);
  return {
    bytes: Buffer.byteLength(text, "utf8"),
    text,
    status: Number.isInteger(written) ? written : null,
  };
}

/**
 * THE POSITIVE CONTROL — the shape `brief.mjs` HAD, reduced to its
 * mechanism: a writer that gets past a buffer, then `process.exit()`.
 *
 * `writes` IS A PARAMETER BECAUSE THE SHAPE IS THE THING THIS FILE USED
 * TO BLAME (`T-197-s1`, taken at T-225). One write past a buffer loses
 * against a draining reader; two hundred small ones do not, and BOTH
 * lose against a reader that pauses. A control that could only be built
 * one way could not show that, and the sentence would have stayed a
 * paragraph.
 *
 * It is written to a scratch file rather than kept as a fixture, because
 * a committed copy of the defect is a thing somebody eventually imports.
 */
function controlWriter(dir: string, want: number, writes = 1): string[] {
  const file = path.join(dir, `control-writer-${writes}.mjs`);
  const per = Math.floor(want / writes);
  writeFileSync(
    file,
    "// The pre-T-197 shape, built to be lost. The writes, then the tear-down.\n" +
      `for (let i = 0; i < ${writes}; i += 1) process.stdout.write("c".repeat(${per}) + "\\n");\n` +
      "process.exit(0);\n",
    "utf8",
  );
  return [file];
}

/** What `controlWriter` actually emits: one newline per write. */
function controlBytes(want: number, writes = 1): number {
  return Math.floor(want / writes) * writes + writes;
}

/**
 * The loss point of ONE reader, derived HERE rather than quoted. It is a
 * race, so the smallest of several samples is taken: the conservative
 * end of a spread is the honest threshold to announce a margin against.
 *
 * Returns the bytes that ARRIVED. `want` is what was written.
 */
function deriveLossPoint(
  read: (argv: string[]) => Read,
  dir: string,
  samples = 3,
): { arrived: number; want: number; spread: number[] } {
  const argv = controlWriter(dir, CONTROL_WANT);
  const spread: number[] = [];
  for (let i = 0; i < samples; i += 1) spread.push(read(argv).bytes);
  return { arrived: Math.min(...spread), want: CONTROL_WANT + 1, spread };
}

/* ════════════════════════════════════════════════════════════════════
 * BODY ONE — THE PROOF, on a SYNTHESISED oversize invocation.
 * ════════════════════════════════════════════════════════════════════ */

test("the whole derivation reaches BOTH readers — one SYNTHESISED oversize invocation, byte for byte", () => {
  // KILLED BY: `process.exit(code)` at the foot of brief.mjs — the line
  // this card is about. Restore it and both readers lose the tail while
  // the exit code stays 0 and nothing is printed about it.
  const sc = scratch("proof");
  try {
    /**
     * THE SYNTHESIS. `--audit` is the arm that takes its input from a
     * PATH, so the size of this invocation's output is a function of a
     * file this body writes and of nothing else — not of the board, not
     * of the lane count, not of how many cards were filed today.
     *
     * ONE LONG LINE rather than many, and the reason is now stated
     * correctly (`T-197-s1`, taken at T-225): the two readers this body
     * drives both DRAIN, so against them many small writes let the
     * reader keep up and lose nothing — measured at `209e5d3` with the
     * defect fully present, 200 short figures produced 115,079 bytes and
     * lost NONE through either. That is a fact about THESE READERS, not
     * about the write shape: the defect is a pending write QUEUE at
     * exit, and one write past a buffer is simply the cheapest way to
     * make a DRAINING reader leave something in it. Body four takes the
     * other route to the same queue — a reader that pauses — and loses
     * bytes from small writes. The synthesis here is kept exactly as it
     * was, because it is what makes this body deterministic against the
     * reader it names.
     */
    const oversize = path.join(sc.dir, "synthesised-oversize.md");
    writeFileSync(
      oversize,
      `# synthesised, so this body's size is not the board's\n\nfigure ${"x".repeat(90_000)} <- @ deadbee ; a source this gate cannot re-run\n`,
      "utf8",
    );
    const argv = [CLI, "--audit", oversize];

    /**
     * THE POSITIVE CONTROL, FIRST. A green below means "the writer no
     * longer drops the tail" only if this machine's readers CAN drop a
     * tail at this size — and CI proved they sometimes cannot: it passed
     * at `5e36a0b` with the brief already 928 bytes past the `| cat`
     * line. Without this the whole file is a check that cannot tell an
     * absence from a refusal.
     */
    const control = controlWriter(sc.dir, CONTROL_WANT);
    const controlWant = CONTROL_WANT + 1;
    const controlSpawn = readViaSpawnSync(control);
    const controlCat = readViaCatPipe(control, sc.dir);
    expect(
      controlSpawn.bytes,
      "the spawnSync reader did not lose a byte from a writer of the OLD shape, so a green " +
        "below would prove nothing about the writer",
    ).toBeLessThan(controlWant);
    expect(
      controlCat.bytes,
      "the `| cat` reader did not lose a byte from a writer of the OLD shape, so a green " +
        "below would prove nothing about the writer",
    ).toBeLessThan(controlWant);

    // GROUND TRUTH: a file destination is synchronous and cannot lose.
    const whole = readViaFile(argv, sc.dir);

    // THE FLOOR. A body run against small output passes before and after
    // the fix, which is the vacuity this card is about (poison shape TEN).
    expect(
      whole.bytes,
      "the synthesised invocation is no longer past one pipe buffer, so this body proves nothing",
    ).toBeGreaterThan(PIPE_BUFFER);

    // BOTH READER SHAPES, BYTE FOR BYTE. `--audit`'s own rows stamp TREE
    // provenance only — no live read — so byte identity across two
    // invocations is a real assertion here and not a comparison of
    // clocks. SINCE T-225 the MARGIN block ahead of them is stamped LIVE,
    // which is one ISO timestamp per run and the only thing normalised
    // below; the sizes are still compared raw, so a byte lost inside that
    // block reds here exactly as one lost in the derivation does.
    const viaSpawn = readViaSpawnSync(argv);
    const viaCat = readViaCatPipe(argv, sc.dir);
    expect(viaSpawn.bytes, "spawnSync lost bytes the file destination received").toBe(whole.bytes);
    expect(viaCat.bytes, "the `| cat` reader lost bytes the file destination received").toBe(
      whole.bytes,
    );
    expect(sameButTheClock(viaSpawn.text)).toBe(sameButTheClock(whole.text));
    expect(sameButTheClock(viaCat.text)).toBe(sameButTheClock(whole.text));

    // AND THE EXIT CODE SURVIVES THE CHANGE. Removing `process.exit()`
    // moves the code onto `process.exitCode`, so the four-code contract
    // is re-driven through every destination rather than assumed. This
    // invocation FINDS something (an unrunnable provenance arrow), which
    // is exit 1 — the arm was chosen partly for that: a fix that made
    // every run exit 0 would pass a body that only ever asked for 0.
    expect(whole.status, "the file destination's exit code").toBe(1);
    expect(viaSpawn.status, "spawnSync's view of the exit code").toBe(1);
    expect(viaCat.status, "the writer's exit code out of the pipeline").toBe(1);

    disclose(
      "brief-flush PROOF",
      `synthesised ${whole.bytes} bytes past a ${PIPE_BUFFER}-byte buffer; both readers received ` +
        `all of them. Positive control at the same size lost ${controlWant - controlSpawn.bytes} ` +
        `bytes via spawnSync and ${controlWant - controlCat.bytes} via \`| cat\`.`,
    );
  } finally {
    sc.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * BODY FOUR — THE SLOW READER, and the correction it carries (T-225,
 * taking `T-197-s1`).
 * ════════════════════════════════════════════════════════════════════ */

test("the whole derivation reaches a SLOW reader too, and the loss is the READER'S — never the write shape", () => {
  // KILLED BY: `process.exit(code)` at the foot of brief.mjs. Restore it
  // and the third assertion below fails while bodies one and two stay
  // green whenever their two draining readers win the race — which is
  // the whole reason this body exists beside them.
  //
  // AND THE TWO CONTROLS ARE THE ARGUMENT, not scaffolding around it.
  // This file used to say the loss is a property of the WRITE SHAPE and
  // it is not: one writer, one size, one shape, two readers, two
  // answers. The pair below is that sentence made mechanical.
  const sc = scratch("slow");
  try {
    /**
     * CONTROL ONE — THE READER CANNOT LOSE BY ITSELF. A slow reader that
     * dropped bytes on its own would red the proof below for its own
     * reason and read as a finding about `brief.mjs`. The witness is a
     * writer of the CURRENT shape at the control's own size: it exits
     * naturally, so nothing should be lost, and nothing is.
     */
    const honest = path.join(sc.dir, "honest-writer.mjs");
    writeFileSync(
      honest,
      "// The post-T-197 shape at the control's size: many small writes, no tear-down.\n" +
        `for (let i = 0; i < 200; i += 1) process.stdout.write("h".repeat(${Math.floor(
          CONTROL_WANT / 200,
        )}) + "\\n");\nprocess.exitCode = 0;\n`,
      "utf8",
    );
    const honestBytes = controlBytes(CONTROL_WANT, 200);
    const readerIsHonest = readViaSlowPipe([honest], sc.dir);
    expect(
      readerIsHonest.bytes,
      "the SLOW READER lost bytes from a writer that never tears down, so it cannot be used to " +
        "judge one that does — see the paused-`child.stdout` measurement in slowReader()",
    ).toBe(honestBytes);

    /**
     * CONTROL TWO — THE SAME PRE-FIX WRITER, TWO READERS, TWO ANSWERS.
     *
     * ── V-225's F1, AND WHY THE ASSERTION MOVED ──────────────────────
     * This control USED TO REQUIRE `| cat` to receive all 524,400 bytes
     * (`expect(fast.bytes).toBe(smallWant)`). **That is not a property.
     * It is who wins a race**, and `cat` loses it often enough to
     * matter: V-225 measured 1 of 25 runs short on a quiet machine, 16
     * of 25 at six busy cores, and one REAL suite red while an unrelated
     * mutant of `dispatch-order.mjs` was applied — a body redding under
     * a file it cannot reach is a body that will red on somebody else's
     * lane, at `retries: 0`, carrying a message about write shape.
     *
     * **THE ARGUMENT NEVER NEEDED THE MAXIMUM; IT NEEDS THE
     * DISCRIMINATION.** *One writer, one shape, two readers, two
     * answers* is a claim that the two readers DIFFER, and the
     * difference is what falsifies the write-shape inference. So the
     * draining reader's arrival is DERIVED IN-RUN rather than assumed —
     * the mirror of `deriveLossPoint` one line down, and the same
     * argument turned the other way. That function takes the MIN of
     * several samples because the conservative end of a spread is the
     * honest threshold to announce a margin against; here the claim is
     * *this reader CAN keep up*, so the conservative end is the MAX.
     *
     * **WHY SAMPLING RATHER THAN A SINGLE RELAXED COMPARISON.** A single
     * `fast > slow` is still one sample of a race — under sustained load
     * `cat` reaches the pauser's own floor of one pipe buffer, which is
     * exactly what V-225 saw in its spurious red. Requiring the BEST of
     * several runs to beat the pauser fails only if every one of them is
     * that bad, which is a different and far weaker event. **What is
     * left unasserted is the vivid half** — that a draining reader loses
     * NOTHING — and it is DISCLOSED with its spread instead, the way
     * this file already discloses its own coverage rather than reporting
     * an unqualified green.
     *
     * THE OTHER HALF IS A PROPERTY AND STAYS ASSERTED: a reader that
     * pauses cannot drain half a megabyte before a burst writer exits,
     * so it loses, and it loses whatever the machine is doing.
     */
    const smallWrites = controlWriter(sc.dir, CONTROL_WANT, 200);
    const smallWant = controlBytes(CONTROL_WANT, 200);
    const slow = readViaSlowPipe(smallWrites, sc.dir);
    const fastSpread: number[] = [];
    for (let i = 0; i < FAST_SAMPLES; i += 1) {
      fastSpread.push(readViaCatPipe(smallWrites, sc.dir).bytes);
    }
    const fastBest = Math.max(...fastSpread);
    const wholeRuns = fastSpread.filter((b) => b === smallWant).length;

    expect(
      slow.bytes,
      "the reader that PAUSES lost nothing from a pre-T-197 writer at this size, so a green " +
        "below would prove nothing about the writer",
    ).toBeLessThan(smallWant);
    expect(
      fastBest,
      `not one of ${FAST_SAMPLES} runs of the DRAINING reader took more from this writer than the ` +
        "reader that pauses did, so this run cannot show that the write shape is not what decides " +
        "the loss — suspect a machine under sustained load before suspecting the writer",
    ).toBeGreaterThan(slow.bytes);

    disclose(
      "brief-flush READER SPREAD",
      `one pre-T-197 writer, ${smallWant} bytes in 200 small writes: the pauser took ` +
        `${slow.bytes}; the draining reader took ${fastSpread.join(", ")} over ${FAST_SAMPLES} ` +
        `runs, ${wholeRuns} of them whole. The BEST draining run is what the assertion uses, and ` +
        `only its being larger than the pauser's is asserted.`,
    );

    /**
     * THE PROOF. The same synthesised oversize invocation body one
     * drives, through the reader that pauses, against the destination
     * that cannot lose.
     */
    const oversize = path.join(sc.dir, "synthesised-oversize.md");
    writeFileSync(
      oversize,
      `# synthesised, so this body's size is not the board's\n\nfigure ${"x".repeat(90_000)} <- @ deadbee ; a source this gate cannot re-run\n`,
      "utf8",
    );
    const argv = [CLI, "--audit", oversize];
    const whole = readViaFile(argv, sc.dir);
    expect(
      whole.bytes,
      "the synthesised invocation is no longer past one pipe buffer, so this body proves nothing",
    ).toBeGreaterThan(PIPE_BUFFER);

    const viaSlow = readViaSlowPipe(argv, sc.dir);
    expect(viaSlow.bytes, "the SLOW reader lost bytes the file destination received").toBe(
      whole.bytes,
    );
    expect(sameButTheClock(viaSlow.text)).toBe(sameButTheClock(whole.text));
    expect(viaSlow.status, "the writer's exit code out of the slow pipeline").toBe(1);

    disclose(
      "brief-flush SLOW READER",
      `${SLOW_CHUNK} bytes every ${SLOW_DELAY_MS} ms received all ${whole.bytes} synthesised ` +
        `bytes past a ${PIPE_BUFFER}-byte buffer. The pre-T-197 writer at ${smallWant} bytes in ` +
        `200 small writes lost ${smallWant - slow.bytes} to that reader and ` +
        `${smallWant - fastBest} to \`| cat\` at its BEST of ${FAST_SAMPLES} runs — one writer, ` +
        "one shape, two readers.",
    );
  } finally {
    sc.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * BODY TWO — THE MARGIN GUARD.
 * ════════════════════════════════════════════════════════════════════ */

/**
 * The invocations this repository actually reads.
 *
 * THE WRITE SHAPE IS RECORDED HERE AND IS NOT AN ARGUMENT ABOUT SAFETY
 * (`T-197-s1`, taken at T-225). This comment used to say a multi-arm
 * invocation *"writes once per arm and is therefore harder to lose,
 * never easier"*, which is the write-shape inference this file now
 * disowns: against a reader that pauses, small writes lose exactly as a
 * large one does, because what is lost is whatever is still queued in
 * userland at exit. Since T-225 the shape is moot anyway — every arm
 * renders into one collection and the answer leaves in a SINGLE write,
 * behind the margin block disclosing its size — so the loss point
 * derived below is measured against a writer of that same single-write
 * shape, and it is still ONE READER'S answer rather than the boundary.
 */
const LIVE_ARMS: ReadonlyArray<{ label: string; args: string[] }> = [
  { label: "--dispatch", args: ["--dispatch"] },
  // THE TWO ARMS THIS LIST DID NOT CARRY, AND BOTH ARE PAST THE LINE
  // (T-225-s2, taking `T-225-s7` and this card's own CORROBORATION).
  // `--dispatch --full` is the BIGGEST invocation there is — 105,917
  // bytes at `09526da`, about 162% of one pipe buffer — and since T-225
  // it is the TRIAGE view, so the arm most likely to meet a ceiling was
  // the one the guard never mentioned. `--task <id> --preflight` is the
  // dispatch ritual's own step and was 83,080 bytes at the same ref.
  { label: "--dispatch --full", args: ["--dispatch", "--full"] },
  { label: "--task T-133 --state --full", args: ["--task", "T-133", "--state", "--full"] },
  { label: "--task T-133 --state", args: ["--task", "T-133", "--state"] },
  { label: "--task T-133", args: ["--task", "T-133"] },
  { label: "--task T-133 --preflight", args: ["--task", "T-133", "--preflight"] },
  { label: "--state", args: ["--state"] },
  { label: "--card T-133", args: ["--card", "T-133"] },
];

/**
 * THE FLAGS THAT ARE NOT AN ARM OF THEIR OWN, EACH ARGUED (T-225-s2,
 * taking `T-225-s7`).
 *
 * **THE LIST ABOVE WAS HAND-KEPT AND NOTHING COMPARED IT TO THE COMMAND**,
 * which is how the biggest invocation there is went six cards without
 * being announced. The body below closes that by DERIVING `brief.mjs`'s
 * own flag set from its own frozen `FLAGS` literal and requiring every
 * flag to be either exercised by an arm above or excluded HERE with a
 * reason — so a NEW flag reds this file by name rather than joining a
 * list nobody re-opens. The standing preference on `T-225-s7` was exactly
 * this: derived, so a seventh arm cannot be forgotten again.
 *
 * A COMBINATORIAL SWEEP IS REFUSED IN WRITING: eight read flags are 256
 * invocations of a command that takes seconds, and the guard's subject is
 * what this repository READS, not what its parser accepts.
 *
 * **AND THE RESIDUAL IS STATED, BECAUSE A GUARD BELIEVED WIDER THAN IT IS
 * IS WORSE THAN NO GUARD.** This derivation catches a FLAG that nothing
 * announces. It does NOT catch a missing COMBINATION of flags that are
 * each announced somewhere else — dropping `--dispatch --full` from the
 * list above leaves both `--dispatch` and `--full` covered by other arms,
 * and this body stays green. **That exact hole is closed by the margin
 * guard itself and not here**: it measures every arm, so it asks which
 * one is BIGGEST and requires that arm to be a `--full` arm — a question
 * this body has no sizes to ask. Deriving the whole combination set is
 * routed rather than built.
 */
const NOT_AN_ARM: ReadonlyArray<{ flag: string; why: string }> = [
  {
    flag: "--role",
    why: "a MODIFIER of --task: it chooses which role file the rows are read against. It moves the answer by the length of one contract table, never its shape, and the arms above already drive the default role.",
  },
  {
    flag: "--root",
    why: "a MODIFIER: which checkout to derive in. The size it produces is the size of whatever tree it is pointed at, so an arm here would measure that tree rather than this command.",
  },
  {
    flag: "--audit",
    why: "takes a PATH, so its size is a function of the file it is handed and not of this repository. Bodies ONE and FOUR above drive exactly that arm, at a size they SYNTHESISE, which is the whole reason they are deterministic.",
  },
  {
    flag: "--write-fence",
    why: "a WRITER. It leaves a manifest in a lane worktree, and a guard that measured it would be a suite arming a lane every time it ran.",
  },
  {
    flag: "--take-seat",
    why: "a WRITER: it records the holder of the integration checkout. A suite that took the seat would take it from whoever holds it.",
  },
  {
    flag: "--release-seat",
    why: "a WRITER, and the more dangerous half — it REMOVES a holder record, which is somebody else's declaration.",
  },
  {
    flag: "--dispatch-lane",
    why: "THE WRITER THAT COMMITS (T-239). It stamps a card on the integration branch and commits that, cuts two worktrees and writes a brief — so a guard that measured its size would perform a dispatch every time this suite ran, which is the same argument the three writers above already make and one degree worse. `brief.spec.ts` drives it end to end against scratch repositories instead.",
  },
  {
    flag: "--merge",
    why: "THE OTHER WRITER THAT COMMITS (T-295). It widens a card's fence on the integration branch as its own commit, stages a merge, stamps a card and appends to the bands' readings — so a guard that measured its size would perform a merge every time this suite ran, which is `--dispatch-lane`'s argument at the closing end of the loop. `merge.spec.ts` drives it end to end against scratch repositories instead.",
  },
  {
    flag: "--bench",
    why: "THE THIRD WRITER (T-296). It takes the verifier's ground by a script, seals the three inputs by sha256 and writes the ground, the stamps and the phase 2 brief into the lane's scratch directory — so a guard that measured its size would perform the bench ritual every time this suite ran, which is `--dispatch-lane`'s argument at the verification end of the loop. `brief.spec.ts` drives it end to end against scratch repositories instead.",
  },
  {
    flag: "--await",
    why: "a WAITER, and the one arm a size guard must never drive: it blocks until a marker file appears or its ceiling is reached, so an entry in the arm list above would make this suite wait on a file nobody is going to write. `brief.spec.ts` drives it against markers it plants itself, where the subject — that the ceiling is REPORTED rather than hung on — can actually be asserted.",
  },
  {
    flag: "--await-pid",
    why: "the second half of the same WAITER: it blocks until a process exits. Same argument as --await above, one degree worse, since the process it would wait on in this suite is nobody's.",
  },
  {
    flag: "--ceiling",
    why: "a MODIFIER of --await / --await-pid: how many seconds the wait may take before it reports the ceiling instead of hanging. It is required beside either of them and alone it is a usage error, so there is no invocation of it for this file to size.",
  },
  {
    flag: "--bump",
    why: "a MODIFIER of --merge: which method version the three stamp files move to. It is meaningless without --merge and this command refuses it alone.",
  },
  {
    flag: "--meters",
    why: "a MODIFIER of --merge taking a PATH, so its size is a function of the report it is handed and not of this repository — the same argument `--audit` above already makes.",
  },
  {
    flag: "--tier",
    why: "a MODIFIER of --merge: which tier the readings are stamped with. One word into one JSON line, and meaningless without --merge.",
  },
  {
    flag: "--blocks-absent",
    why: "a MODIFIER of --merge: the acknowledgement that names a pre-T-281 verdict carrying no mutant block. It is a sha the seat has read and typed, and it is meaningless without --merge.",
  },
  {
    flag: "--slug",
    why: "a MODIFIER of --dispatch-lane, and the one input in that whole ritual the documents leave to a person: the branch name a reader of `git branch` sees for the life of the repository. It changes no size this file measures, and alone it is a usage error.",
  },
  {
    flag: "--executor",
    why: "a MODIFIER of --dispatch-lane: which seat the dispatch stamps as the card's `builder:`. It moves one frontmatter field on one card and nothing this file measures, and alone it is a usage error.",
  },
  {
    flag: "--verifier",
    why: "a MODIFIER of --dispatch-lane: which seat the dispatch stamps as the card's `verifier:`. Same shape as --executor above, and alone it is the same usage error.",
  },
  {
    flag: "--scratch",
    why: "a MODIFIER of --dispatch-lane: the directory the ritual writes its brief into. Its size is the size of the brief that arm ALREADY writes, measured against whatever tree --root names rather than against this command.",
  },
  {
    flag: "--dry-run",
    why: "a MODIFIER of --dispatch-lane that turns the writer into a printer: the plan and the block of lane facts, a few dozen lines, and no step performed. It is exercised by `brief.spec.ts` where its subject — that NOTHING was written — can actually be asserted.",
  },
  {
    flag: "--help",
    why: "one line, and it is the usage string rather than a derivation; `brief.spec.ts` pins its exit.",
  },
];

/**
 * `brief.mjs`'s own flag set, read out of its frozen `FLAGS` literal.
 *
 * IT IS A TEXT DERIVATION AND NOT AN IMPORT, DELIBERATELY: execution lives
 * in that wrapper rather than in the module beside it (the lint-tokens
 * shape), so importing it to read one constant would RUN the command
 * inside this suite. The literal is frozen and one line per flag, and a
 * shape this reader cannot parse is a hard failure rather than an empty
 * expectation — an empty flag set would make the coverage below vacuous
 * in the direction it exists to prevent.
 */
function declaredFlags(): string[] {
  const src = readFileSync(CLI, "utf8");
  const block = /const FLAGS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(src);
  if (block === null) {
    throw new Error(
      "brief-flush: brief.mjs no longer carries a frozen `FLAGS` literal this reader can find, " +
        "so the arm list below is hand-kept again with nothing comparing it to the command. " +
        "Move this derivation with the constant rather than deleting the check.",
    );
  }
  const flags = [...(/** @type {string} */ (block[1]) ?? "").matchAll(/"(--[a-z-]+)"/g)].map(
    (m) => m[1] as string,
  );
  if (flags.length === 0) {
    throw new Error("brief-flush: the FLAGS literal parsed to zero flags, which cannot be right");
  }
  return flags;
}

test("THE ARM LIST IS COMPARED TO THE COMMAND'S OWN FLAGS, so a flag nothing announces reds by name", () => {
  // KILLED BY: dropping an arm from LIVE_ARMS without arguing its flag
  // into NOT_AN_ARM, or by adding a flag to brief.mjs and announcing
  // nothing — which is exactly how `--dispatch --full`, the biggest
  // invocation there is and the project's TRIAGE view since T-225, went
  // unmentioned by the guard that exists to announce approaches.
  const declared = declaredFlags();
  const exercised = new Set(LIVE_ARMS.flatMap((a) => a.args).filter((a) => a.startsWith("--")));
  const excused = new Map(NOT_AN_ARM.map((e) => [e.flag, e.why]));

  const unannounced = declared.filter((f) => !exercised.has(f) && !excused.has(f));
  expect(
    unannounced,
    "brief.mjs accepts a flag that no arm above announces and no entry below excuses — the arm " +
      "list is a hand-kept enumeration and this is the stale-enumeration failure this project " +
      "has paid for before. Add an arm, or argue the flag into NOT_AN_ARM with a reason.",
  ).toEqual([]);

  // AND THE EXCUSES ARE CHECKED IN THE OTHER DIRECTION TOO: an entry for
  // a flag the command no longer has is a reason nobody can act on, and
  // an entry for a flag an arm DOES drive is a contradiction.
  expect(
    NOT_AN_ARM.map((e) => e.flag).filter((f) => !declared.includes(f)),
    "an excused flag is not one this command accepts any more",
  ).toEqual([]);
  expect(
    NOT_AN_ARM.map((e) => e.flag).filter((f) => exercised.has(f)),
    "a flag is excused from the arm list and driven by an arm at the same time",
  ).toEqual([]);
  for (const e of NOT_AN_ARM) {
    expect(e.why.length, `${e.flag} is excused with no reason`).toBeGreaterThan(40);
  }

  /**
   * THE POSITIVE CONTROL. A coverage check that has only ever seen a
   * covered set cannot be told from one that decides nothing, and the
   * ZERO it reports is exactly what a finished job looks like
   * (`docs/CONVENTIONS.md`, A NEGATIVE ASSERTION NEEDS A POSITIVE
   * CONTROL, and its census clause). So the same comparison is run
   * against a flag this command does not have.
   */
  const planted = [...declared, "--a-flag-nobody-announced"].filter(
    (f) => !exercised.has(f) && !excused.has(f),
  );
  expect(
    planted,
    "the coverage comparison accepted a flag that is in neither list, so its empty answer above " +
      "proves nothing",
  ).toEqual(["--a-flag-nobody-announced"]);

  disclose(
    "brief-flush ARM COVERAGE",
    `${declared.length} flags declared by brief.mjs; ${exercised.size} exercised by ` +
      `${LIVE_ARMS.length} announced arms; ${excused.size} excused with a reason.`,
  );
});

test("THE MARGIN GUARD: every live arm against a loss point DERIVED in this run, for a NAMED reader", () => {
  // KILLED BY: restoring `process.exit(code)` — every arm whose live size
  // is past the derived loss point stops matching its file destination.
  //
  // AND IT EXISTS BECAUSE `HEAD` SAT UNDER THIRTY BYTES FROM RED WITH
  // NOTHING SAYING SO. A 30-byte title edit to `T-212` took the brief
  // from 66,464 to 66,494 bytes and turned `dispatch-order.spec.ts` from
  // 14 passed to 1 failed. The approach was silent; only the arrival was
  // loud, and it arrived three layers from its cause.
  const sc = scratch("margin");
  try {
    /**
     * THE THRESHOLD IS DERIVED, AND IT NAMES ITS READER. There is no
     * single line to pin: `| cat` loses at 65,536 while `spawnSync`
     * survives to roughly 66,470 on the same tree and the same command.
     * So the number below is measured HERE, in THIS run, against a
     * writer of the pre-fix shape, and it is reported as one reader's
     * answer rather than as the boundary.
     *
     * `spawnSync` is the reader named because it is the one this suite
     * reads with — the race that decides whether a body reds.
     */
    const READER = "spawnSync (node:child_process), one write past the buffer";
    const loss = deriveLossPoint((argv) => readViaSpawnSync(argv), sc.dir);
    expect(
      loss.arrived,
      "the derived loss point equals what was written, so nothing was lost and this reader " +
        "cannot be used to derive a threshold on this machine",
    ).toBeLessThan(loss.want);

    disclose(
      "brief-flush LOSS POINT",
      `${loss.arrived} bytes arrive out of ${loss.want} written — derived against ${READER}; ` +
        `samples ${loss.spread.join(", ")}. This is ONE reader's answer, never THE boundary.`,
    );

    /**
     * THE ANNOUNCEMENT. Every arm's true size against that threshold,
     * printed whether it is near or far — because the failure this
     * guard exists for is an approach nobody could see.
     */
    let past = 0;
    const measured = new Map<string, number>();
    for (const arm of LIVE_ARMS) {
      const argv = [CLI, ...arm.args];
      const whole = readViaFile(argv, sc.dir);
      measured.set(arm.label, whole.bytes);
      // AN ARM THAT PRODUCED NOTHING PASSES EVERY COMPARISON BELOW, ON
      // BOTH SIDES (poison SHAPE TEN). An arm that throws answers 0 bytes
      // to the file destination and 0 to `spawnSync`, and the equality
      // this guard rests on is then two absences agreeing.
      expect(
        whole.bytes,
        `${arm.label}: the arm produced no answer at all, so every comparison below is two ` +
          "absences agreeing rather than a measurement",
      ).toBeGreaterThan(0);
      const margin = loss.arrived - whole.bytes;
      if (margin <= 0) past += 1;
      disclose(
        "brief-flush MARGIN",
        `${arm.label}: ${whole.bytes} bytes, ${
          margin > 0 ? `${margin} UNDER` : `${-margin} PAST`
        } the derived loss point of ${READER}.`,
      );

      /**
       * THE ASSERTION, on every arm and not only the big ones: what the
       * reader receives is what the file destination received.
       *
       * SIZE, NOT BYTES, AND THE REASON IS NAMED. Several of these arms
       * carry LIVE provenance — `<- read <ISO timestamp> on <host>` — so
       * two invocations are byte-identical only by luck of the clock. The
       * byte-for-byte comparison lives in the body above, on the arm that
       * stamps nothing live.
       *
       * ── AND THE BOARD IS A THIRD PARTY TO THIS COMPARISON (T-225-s2) ──
       * The note here used to end *"suspect the board moving between the
       * two runs before suspecting the flush"*, which tells a reader what
       * to think about a red rather than keeping the red honest. It is a
       * REAL red: measured in this lane's own four-suite battery at
       * `adc5596`, `--task <id> --preflight` read 66,800 bytes to the file
       * and 68,405 to `spawnSync` seconds later, because a sibling lane's
       * worktree appeared between them and that arm's answer sweeps every
       * checkout on the machine. **A body that reds when another seat cuts
       * a worktree is a red on somebody else's work**, at `retries: 0`,
       * carrying a message about a flush.
       *
       * SO THE PIPE READ IS BRACKETED, and only when it has to be: on a
       * disagreement a SECOND file read is taken, and the pipe read must
       * match one of the two file reads around it. A truncation matches
       * NEITHER — it is one buffer, and both file reads are the whole
       * answer — so the property this guard exists for is untouched, while
       * a board that moved mid-arm is disclosed instead of blamed on the
       * writer. The second read costs nothing on a quiet board because it
       * is never taken there.
       */
      const viaSpawn = readViaSpawnSync(argv);
      const accepted = [whole.bytes];
      if (viaSpawn.bytes !== whole.bytes) {
        const again = readViaFile(argv, sc.dir);
        accepted.push(again.bytes);
        disclose(
          "brief-flush BOARD MOVED",
          `${arm.label}: the file destination read ${whole.bytes} then ${again.bytes} bytes ` +
            `around a pipe read of ${viaSpawn.bytes} — this arm's answer is a function of live ` +
            "state that changed mid-arm, so the pipe read is bracketed rather than compared to " +
            "one side of the move.",
        );
      }
      expect(
        accepted,
        `${arm.label}: spawnSync received ${viaSpawn.bytes} bytes where the file destination ` +
          `received ${accepted.join(" then ")} — the pipe read matches no file read taken ` +
          "around it, which is what a truncation looks like and is not what a moving board " +
          "looks like",
      ).toContain(viaSpawn.bytes);
      expect(
        unstampedLines(viaSpawn.text.trimEnd()),
        `${arm.label}: a line arrived without its stamp, which is what a cut mid-line looks like`,
      ).toEqual([]);
    }

    /**
     * AND THE VACUITY IS DISCLOSED RATHER THAN HIDDEN. When the board is
     * quiet every arm sits under the loss point, and every assertion
     * above would pass against a `brief.mjs` that still called
     * `process.exit()`. That is precisely the state an integrator is in
     * when running a final battery, so this run SAYS which of the two it
     * was instead of reporting an unqualified green.
     */
    disclose(
      "brief-flush COVERAGE",
      past === 0
        ? `no live arm is past the derived loss point today, so THIS body is a smoke test on ` +
            `this run — the SYNTHESISED body above is the one carrying the proof.`
        : `${past} of ${LIVE_ARMS.length} live arms are past the derived loss point, so this ` +
            `run exercises the flush on real input as well as on the synthesised input above.`,
    );

    /**
     * AND THE MISSING `--full` TWIN IS CAUGHT HERE, WHERE THE SIZES ARE
     * (T-225-s2, taking `T-225-s7`). The coverage body above derives the
     * FLAG set and cannot see a missing COMBINATION of flags each covered
     * elsewhere — which is exactly how `--dispatch --full` went
     * unannounced while both `--dispatch` and `--full` were on the list.
     *
     * THIS BODY HAS WHAT THAT ONE LACKS: every arm's measured size.
     * `--full` only ever ADDS to an answer, so if every announced view
     * carried its `--full` twin the biggest arm measured would carry
     * `--full` by construction. A biggest arm WITHOUT it names its own
     * missing twin — a bigger invocation this list does not announce.
     */
    const biggest = [...LIVE_ARMS].sort(
      (a, b) => (measured.get(b.label) ?? 0) - (measured.get(a.label) ?? 0),
    )[0] as (typeof LIVE_ARMS)[number];
    expect(
      biggest.args.includes("--full"),
      `the biggest arm measured this run is ${biggest.label} at ${measured.get(biggest.label)} ` +
        "bytes and it does not carry --full — so its own --full twin is a LARGER invocation that " +
        "this list does not announce, which is the stale-enumeration failure T-225-s7 was filed " +
        "for. Announce that twin.",
    ).toBe(true);
  } finally {
    sc.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * BODY FIVE — THE READER THAT STOPS, and the writer's own exit behind it
 * (T-225-s2, taking `T-225-s6`).
 *
 * THE FOURTH READER SHAPE, AND THE ONE NONE OF THE THREE ABOVE COVERS.
 * `readViaCatPipe` and `readViaFile` DRAIN; `readViaSlowPipe` pauses and
 * then drains. All three take everything in the end. **A reader that
 * takes ONE fixed-size read and STOPS never comes back** — `| head`, `|
 * dd bs=65536 count=1`, a pager closed on the first screen — and it is
 * the caller the margin block names as the owner of the 65,536-byte floor
 * it prints on every run.
 *
 * THE READER'S SIDE IS THE PROPERTY AND IT IS ASSERTED. The cut is silent
 * where it lands: at most one buffer arrives, the reader itself exits
 * clean, and nothing on the reader's side says a word about the rest.
 *
 * **THE WRITER'S SIDE IS A RACE AND IS MEASURED RATHER THAN ASSERTED.**
 * Whether the `EPIPE` from the closed pipe reaches the writer before it
 * ends is timing: measured on the dispatching seat's bench at `09526da`
 * over 40 runs of `--dispatch --full`, the writer ended non-zero in 3 of
 * them, 1 of 30 quiet and 2 of 10 under eight-core load. **So the one
 * fact a caller would reach for — "it exited 0, so nothing was cut" — is
 * the unreliable one**, and this body asserts nothing about which side of
 * that race a given run lands on. It DISCLOSES the spread instead, the
 * way this file already discloses its reader spread rather than reporting
 * an unqualified green.
 *
 * WHAT *IS* A PROPERTY ABOUT THE WRITER, AND IS THE FIX THIS CARD MADE:
 * the non-zero may not be `EXIT.FOUND`. Until this card the closed pipe
 * arrived as an UNCAUGHT `EPIPE` — a stack trace and exit 1 — which is
 * the same code the command uses for *"I derived it and found something
 * the repository disagrees with"*. Two answers the four-code contract
 * exists to keep apart, arriving as one number. `brief.mjs` now maps a
 * stdout `EPIPE` to `CANNOT_RUN`, whose own wording is *"this run is not
 * a claim about the repository at all"* — which is exactly what a
 * half-delivered answer is.
 * ════════════════════════════════════════════════════════════════════ */

/** A reader that takes ONE fixed read of `bytes` and stops: `dd`, exactly. */
function readViaOneRead(
  argv: string[],
  dir: string,
  cwd = repoRoot,
): { bytes: number; writerStatus: number | null; readerStatus: number | null; writerErr: string } {
  const stem = Math.random().toString(36).slice(2);
  const out = path.join(dir, `one-${stem}.txt`);
  const st = path.join(dir, `one-${stem}.status`);
  const err = path.join(dir, `one-${stem}.err`);
  const q = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
  const left = [process.execPath, ...argv].map(q).join(" ");
  const r = spawnSync(
    "/bin/sh",
    [
      "-c",
      `{ ${left} 2> ${q(err)}; echo $? > ${q(st)}; } | dd bs=${PIPE_BUFFER} count=1 ` +
        `2>/dev/null > ${q(out)}`,
    ],
    { cwd, encoding: "utf8", maxBuffer: MAX_BUFFER },
  );
  const written = Number.parseInt(readFileSync(st, "utf8").trim(), 10);
  return {
    bytes: statSync(out).size,
    writerStatus: Number.isInteger(written) ? written : null,
    readerStatus: r.status,
    writerErr: readFileSync(err, "utf8"),
  };
}

/**
 * THE CONTROL WRITER FOR THIS BODY: the same size, no `EPIPE` handling.
 *
 * It is what `brief.mjs` was before this card, reduced to its mechanism —
 * a writer whose stdout `error` event has no listener, which node turns
 * into an uncaught exception. It proves three things in one run: that the
 * reader really does close the pipe under a writer of this size, that the
 * harness can SEE a stack trace when one is printed, and that an unhandled
 * `EPIPE` arrives as exit 1 — indistinguishable from a finding.
 */
function unhandledEpipeWriter(dir: string, want: number): string[] {
  const file = path.join(dir, "unhandled-epipe-writer.mjs");
  writeFileSync(
    file,
    "// No stdout error listener: node turns the EPIPE into an uncaught\n" +
      "// 'error' event, which is a stack trace on stderr and exit 1.\n" +
      `process.stdout.write("e".repeat(${want}) + "\\n");\nprocess.exitCode = 0;\n`,
    "utf8",
  );
  return [file];
}

/** How many runs of the live arm the writer-exit spread is taken over. */
const EXIT_SAMPLES = 5;

/** Far past two buffers, so the writer CANNOT have finished before the close. */
const CERTAIN_EPIPE_BYTES = 200_000;

test("the reader that STOPS after one read gets a silent PREFIX, and the writer's own exit behind it is a RACE this body measures and does not assert", () => {
  // KILLED BY: removing the stdout `EPIPE` handler from brief.mjs — the
  // synthesised arm below then answers with a stack trace on stderr and
  // exit 1, which is `EXIT.FOUND`. Also killed by a reader-side claim
  // going false: more than one buffer arriving, or the reader itself
  // failing.
  const sc = scratch("one-read");
  try {
    /**
     * THE CONTROL, FIRST AND AT A SIZE THAT REMOVES THE RACE. Two
     * buffers is not enough — a reader that takes 65,536 bytes in one
     * read empties the kernel buffer, and a writer with only a little
     * left can push it and leave cleanly before the reader exits, which
     * is exactly why the live arm's spread is 37-to-3 rather than 0-to-40.
     * At three buffers the writer is still blocked when the pipe closes,
     * so the `EPIPE` is a certainty rather than a coin toss and the
     * control below is a control rather than a second sample of the race.
     */
    const control = readViaOneRead(unhandledEpipeWriter(sc.dir, CERTAIN_EPIPE_BYTES), sc.dir);
    expect(
      control.bytes,
      "the one-read reader took more than the buffer it asked for from the control writer",
    ).toBeLessThanOrEqual(PIPE_BUFFER);
    expect(
      control.writerErr,
      "a writer with NO stdout error listener printed no EPIPE at all, so this reader is not " +
        "closing the pipe under it and nothing below is a measurement of a closed pipe",
    ).toContain("EPIPE");
    expect(
      control.writerStatus,
      "an UNHANDLED EPIPE did not arrive as exit 1, so the collision with EXIT.FOUND this card " +
        "removed is not what this machine does and the fix below is being credited for nothing",
    ).toBe(1);

    /**
     * THE SAME SIZE, THE SAME READER, THROUGH THE COMMAND. `--audit`
     * takes its input from a PATH, so this invocation's size is a
     * function of a file this body writes and of nothing else — the
     * synthesis bodies one and four already rely on, for the same reason.
     */
    const oversize = path.join(sc.dir, "synthesised-oversize.md");
    writeFileSync(
      oversize,
      `# synthesised, so this body's size is not the board's\n\nfigure ${"x".repeat(
        CERTAIN_EPIPE_BYTES,
      )} <- @ deadbee ; a source this gate cannot re-run\n`,
      "utf8",
    );
    const synth = [CLI, "--audit", oversize];
    const whole = readViaFile(synth, sc.dir);
    expect(
      whole.bytes,
      "the synthesised invocation is no longer past one pipe buffer, so this body proves nothing",
    ).toBeGreaterThan(PIPE_BUFFER);

    const cut = readViaOneRead(synth, sc.dir);
    expect(cut.bytes, "one fixed read took more than the buffer it asked for").toBeLessThanOrEqual(
      PIPE_BUFFER,
    );
    expect(
      cut.bytes,
      "the one-read reader received the whole answer, so nothing was cut and the silence below " +
        "is the silence of a complete transfer",
    ).toBeLessThan(whole.bytes);
    expect(cut.readerStatus, "the fixed-buffer reader itself failed").toBe(0);

    /**
     * THE PROPERTY ABOUT THE WRITER — not which code it ends on, but
     * which codes are REACHABLE. A closed pipe may leave this command at
     * the status a whole read gives, or at `CANNOT_RUN`; it may not leave
     * it at `FOUND`, because a caller reading that number would be told
     * the repository disagrees with something when all that happened is
     * that they closed the pipe.
     *
     * THE PERMITTED SET IS DERIVED FROM THIS RUN'S OWN WHOLE READ rather
     * than typed, so a synthesis that changed what the arm finds moves
     * the assertion with it instead of falsifying it.
     */
    const wholeStatus = whole.status;
    expect(
      [wholeStatus, EXIT.CANNOT_RUN],
      `the writer ended on ${String(cut.writerStatus)} behind a reader that stopped — neither the ` +
        `status of a whole read (${String(wholeStatus)}) nor CANNOT_RUN`,
    ).toContain(cut.writerStatus);
    expect(
      cut.writerErr.includes("EPIPE"),
      "the command printed an EPIPE stack trace at a closed pipe, which is the uncaught-error " +
        "shape this card replaced with a deliberate exit",
    ).toBe(false);

    /**
     * AND THE RACE ITSELF, ON THE ARM IT WAS FOUND ON, MEASURED AND
     * ASSERTED NOWHERE. `--dispatch --full` is the biggest live arm and
     * the project's triage view; its spread here is a fact about this
     * machine at this moment, which is precisely why no body may pin it.
     * Every sample is still held to the reachable-set property above.
     */
    const live = [CLI, "--dispatch", "--full"];
    const liveWhole = readViaFile(live, sc.dir);
    const spread: Array<number | null> = [];
    for (let i = 0; i < EXIT_SAMPLES; i += 1) {
      const s = readViaOneRead(live, sc.dir);
      spread.push(s.writerStatus);
      expect(
        [liveWhole.status, EXIT.CANNOT_RUN],
        `run ${i + 1} of the live arm ended on ${String(s.writerStatus)} behind a reader that ` +
          "stopped, which is neither a whole read's status nor CANNOT_RUN",
      ).toContain(s.writerStatus);
      expect(s.bytes, `run ${i + 1}: the one-read reader took more than one buffer`).toBeLessThanOrEqual(
        PIPE_BUFFER,
      );
    }

    disclose(
      "brief-flush ONE-READ READER",
      `the synthesised ${whole.bytes}-byte answer reached a reader that stops at ${cut.bytes} ` +
        `bytes, writer status ${String(cut.writerStatus)}, no stack trace; the control writer at ` +
        `the same size left exit ${String(control.writerStatus)} with an EPIPE trace. The live ` +
        `--dispatch --full arm (${liveWhole.bytes} bytes whole, status ${String(liveWhole.status)}) ` +
        `left the writer at ${spread.map((s) => String(s)).join(", ")} over ${EXIT_SAMPLES} runs — ` +
        "a RACE, disclosed and asserted nowhere; only the reachable SET is a property.",
    );
  } finally {
    sc.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * BODY THREE — THE SWEEP, pinned rather than left in prose.
 * ════════════════════════════════════════════════════════════════════ */

/**
 * `brief.mjs` is one entry point among several under `tools/e2e/scripts/`
 * that write to stdout and then call `process.exit()`. The card asks the
 * class to be SWEPT — every sibling named, and membership argued either
 * way **with a measured size** rather than by assumption.
 *
 * THE ARGUMENT IS KEPT BY THIS BODY RATHER THAN BY PROSE, because prose
 * goes stale the day a ninth script is written. The set below is DERIVED
 * from the tree on every run, so a new command that exits after writing
 * reds this body by name and forces the same decision to be made again.
 *
 * ── THE MEMBERS ──────────────────────────────────────────────────────
 * `brief.mjs` was the only one, and is fixed. It is asserted ABSENT from
 * the derived set, which is this card's regression pin.
 *
 * ── THE NON-MEMBERS, EACH WITH THE SIZE IT WAS ARGUED ON ─────────────
 * All measured at `209e5d3` on this repository, stdout only, redirected
 * to a file and counted — never piped, because piping is the defect.
 *
 *   capabilities.mjs      36 B (`--check`). The GENERATOR writes the
 *                         document with `writeFileSync` and prints ONE
 *                         line, so its size does not track the census.
 *   docs-gate.mjs      4,947 B (`--census`, the whole-tree half) and
 *                      4,445 B fed all 586 tracked docs/*.md paths — an
 *                      upper bound no merge diff reaches. It answers
 *                      with a fixed summary, not one line per path, so
 *                      the count does not scale with the diff. SAME
 *                      SHAPE AS THE DEFECT, an order of magnitude under
 *                      the buffer; it stays listed for that reason.
 *   gate-run.mjs         120 B for one suite — one `gate-verdict` line
 *                        per suite requested, and the registry holds
 *                        four. The suite's own output goes to a FILE
 *                        whose path is printed on stderr, which is what
 *                        keeps this bounded.
 *   health-bands-run.mjs 1,939 B (exit 3, bands awaiting keepers).
 *   lint-tokens.mjs        105 B clean, 125 B `--selftest`.
 *   token-scan.mjs       the two exits `lint-tokens.mjs` cannot
 *                        intercept, measured through that wrapper above.
 *   orphan-drill.mjs         0 B stdout on the called-wrong path (338 B
 *                            on stderr).
 *   tauri-boot-check.mjs     0 B stdout on the refusal path (410 B on
 *                            stderr).
 *
 * THE RESIDUAL IS NAMED RATHER THAN PAPERED OVER: the last two were
 * measured on their REFUSAL paths only, because their success paths
 * spawn the app and this card's diff owes no boot gate. Their success
 * output is a fixed handful of `[supertaskr]` lines plus the child's last
 * output — bounded, but bounded by an argument rather than by a reading.
 */
const EXITS_AFTER_WRITING = [
  "capabilities.mjs",
  "docs-gate.mjs",
  "gate-run.mjs",
  "health-bands-run.mjs",
  "lint-tokens.mjs",
  "orphan-drill.mjs",
  "tauri-boot-check.mjs",
  "token-scan.mjs",
];

test("THE SWEEP: brief.mjs no longer tears down its own stdout, and the siblings that still do are the argued set", () => {
  // KILLED BY: restoring `process.exit(code)` at the foot of brief.mjs —
  // it rejoins the derived set and this body names it. Also killed by a
  // NEW command in this directory that ends the same way, which is the
  // point: the membership argument above is re-opened rather than
  // inherited.
  const scriptsDir = path.join(repoRoot, "tools", "e2e", "scripts");
  const derived: string[] = [];
  for (const name of readdirSync(scriptsDir).filter((n) => n.endsWith(".mjs")).sort()) {
    // CODE LINES ONLY. This card's own fix leaves a comment quoting the
    // call it removed, and a sweep that counted comments would report
    // the fix as the defect.
    const code = readFileSync(path.join(scriptsDir, name), "utf8")
      .split("\n")
      .filter((l) => {
        const t = l.trimStart();
        return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
      })
      .join("\n");
    if (/process\.exit\(/.test(code)) derived.push(name);
  }

  expect(
    derived,
    "brief.mjs is back in the class this card removed it from, or a new command joined it — " +
      "a command that ends at process.exit() drops whatever stdout has not drained, which is " +
      "invisible to a file and to a TTY and silent to a pipe. Set process.exitCode instead, or " +
      "argue the new entry into the list above with a MEASURED size.",
  ).toEqual(EXITS_AFTER_WRITING);
  expect(derived, "brief.mjs must not exit after writing").not.toContain("brief.mjs");
});
