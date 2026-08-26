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
  COMPONENT_STATUSES,
  type TaskStatus,
  type TaskSize,
  type ReviewMode,
  type SessionPolicy,
  type ModelSession,
  type TaskSections,
  type TaskRecord,
  type FeatureRecord,
  type ComponentStatus,
  type ComponentRecord,
  type IdSpace,
  type ParseIssue,
  type TaskParseResult,
  type RoadmapParseResult,
  type ComponentParseResult,
  type ComponentSetResult,
  type ProjectParseResult,
} from './types.js';

export { parseModelSession } from './model-session.js';
export { extractFrontmatter, type FrontmatterResult } from './frontmatter.js';
export { parseTaskFile, splitSections } from './task.js';
export { parseRoadmap } from './roadmap.js';
export { parseComponentFile, compareComponentIds } from './component.js';
export { validateProject, type ValidateProjectOptions } from './validate.js';
export {
  UNFENCEABLE_PATHS,
  normalizeFenceToken,
  slugPathIndex,
  expandFence,
  compareFences,
  type FenceTokenKind,
  type FenceToken,
  type Fence,
  type SlugExpansion,
  type FenceVerdict,
  type FenceWitness,
  type FenceComparison,
  type ExpandFenceOptions,
} from './fence.js';
export {
  parseProjectFromFiles,
  parseComponentsFromFiles,
  isTaskFilePath,
  isComponentFilePath,
  type FileEntry,
  type ParseProjectFromFilesOptions,
  type ParseComponentsFromFilesOptions,
} from './files.js';
