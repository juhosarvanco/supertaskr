/**
 * @nputer/parser/pure — the browser-safe entry (T-003).
 *
 * Everything the package exports EXCEPT the node:fs layer (project.ts).
 * The app's webview imports from here: the root entry re-exports
 * parseProject/parseTaskDirectory, whose `node:fs` import cannot resolve in
 * a browser bundle. Keep this barrel free of any module that touches
 * node builtins.
 */

export {
  TASK_STATUSES,
  TASK_SIZES,
  REVIEW_MODES,
  type TaskStatus,
  type TaskSize,
  type ReviewMode,
  type SessionPolicy,
  type ModelSession,
  type TaskSections,
  type TaskRecord,
  type FeatureRecord,
  type ParseIssue,
  type TaskParseResult,
  type RoadmapParseResult,
  type ProjectParseResult,
} from './types.js';

export { parseModelSession } from './model-session.js';
export { extractFrontmatter, type FrontmatterResult } from './frontmatter.js';
export { parseTaskFile, splitSections } from './task.js';
export { parseRoadmap } from './roadmap.js';
export {
  parseProjectFromFiles,
  isTaskFilePath,
  type FileEntry,
  type ParseProjectFromFilesOptions,
} from './files.js';
