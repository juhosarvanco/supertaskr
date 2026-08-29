#!/usr/bin/env node
/**
 * THE REPLAY RUNNER — a model runner that spends no tokens and consults
 * no model. It replays the recorded PASSING transcript for the eval id it
 * is handed.
 *
 *   NPUTER_EVAL_RUNNER="$PWD/tools/method-evals/fixtures/runners/replay.mjs" \
 *     node tools/method-evals/run.mjs --set model-in-loop
 *
 * WHAT IT IS FOR, AND WHAT IT IS EMPHATICALLY NOT. It exercises the
 * model-in-loop PATH — the runner contract, the sampling loop, the token
 * meter, the pass-rate arithmetic, the acceptance functions — end to end,
 * so that machinery is not first exercised on the day somebody is paying
 * for it. A suite whose expensive half has never run once is a suite with
 * an untested half.
 *
 * **A REPLAYED RUN IS NOT A MEASUREMENT OF ANY MODEL AND MUST NEVER BE
 * RECORDED AS ONE.** It is a fixed transcript: its pass rate is 1.00 by
 * construction, and a bump commit that quoted it would be recording a
 * number nobody measured — the exact failure T-155's founding corpus is
 * built out of. That is why `drive()` echoes the runner program into
 * every result line and why `--bump` prints it: the reader can always see
 * which runner produced the rate. Point `NPUTER_EVAL_RUNNER` at a real
 * agent CLI for a real one.
 *
 * It reports a token count of ZERO, honestly, because zero is what it
 * spent.
 */

import { passTranscript } from "../transcripts.mjs";

const evalId = process.argv[2];
if (evalId === undefined) {
  process.stderr.write("replay: no eval id given — the runner contract is `<program> <eval-id>`\n");
  process.exit(2);
}

// The prompt is READ and discarded: a runner that never drained stdin
// would deadlock a large prompt, and this one exists to exercise the real
// contract rather than a convenient subset of it.
for await (const _chunk of process.stdin) {
  void _chunk;
}

try {
  process.stdout.write(passTranscript(evalId));
  process.stderr.write("tokens: 0\n");
} catch (cause) {
  process.stderr.write(`replay: ${cause instanceof Error ? cause.message : String(cause)}\n`);
  process.exit(1);
}
