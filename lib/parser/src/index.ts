/**
 * @nputer/parser — C-06 lib-parser.
 *
 * Pure library: docs/tasks/ + ROADMAP backbone -> typed model.
 * String-level parsers (parseTaskFile, parseRoadmap, parseModelSession)
 * are side-effect free; parseProject/parseTaskDirectory add a thin
 * read-only filesystem layer. Nothing here writes anything, ever.
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
  parseTaskDirectory,
  parseRoadmapFile,
  parseProject,
  type TaskDirectoryResult,
  type ParseProjectOptions,
} from './project.js';
