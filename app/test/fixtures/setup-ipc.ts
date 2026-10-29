/** Native envelope for historical shell/layout fixtures. Their docs payloads
 * remain standalone legacy embeddings; setup correlation and folder offers
 * still come from the boundary fixture rather than a production fallback.
 * Managed context refusal/recovery is exercised without this helper.
 */
export function setupFixtureReply(command: string, args: unknown, value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  const row = value as Record<string, unknown>;
  const request = args as {attempt?: number; request?: {attempt?: number}} | undefined;
  if (command === "pick_genesis_folder" || command === "start_genesis_here") {
    return {...row, attempt: request?.attempt ?? request?.request?.attempt};
  }
  if (row.kind !== "noDocs") return value;
  if (command === "docs_snapshot") return {...row, scope: row.scope ?? {
    seq: 0, selectionSequence: 0, contextSequence: 0, projectDir: row.projectDir, records: null,
  }};
  if (command === "pick_project_folder") return {...row, genesisOffer: "fixture-native-folder-offer", scope: row.scope ?? {
    seq: 0, selectionSequence: 0, contextSequence: 0, projectDir: null, records: null,
  }};
  return value;
}
