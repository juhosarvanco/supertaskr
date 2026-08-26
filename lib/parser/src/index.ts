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
  IN_FLIGHT,
  byTaskId,
  criticalPath,
  criticalPathText,
  isRenderedTask,
  layerWaves,
  readSchedule,
  readyNowText,
  scheduleWord,
  selectTaskSchedule,
  transitiveHolds,
  waveStatus,
  worstBlockerText,
  type ScheduleReading,
  type ScheduleState,
  type SelectScheduleOptions,
  type TaskScheduleModel,
  type UnmetBlocker,
  type WaveCard,
  type WaveEdge,
  type WaveInput,
  type WaveLayering,
  type WaveStatus,
} from './task-waves.js';
export {
  REASON_PATH_CEILING,
  byDispatchRank,
  readDispatchOrder,
  witnessComponents,
  type CardStartability,
  type DispatchOrder,
  type DispatchOrderOptions,
  type LaneHold,
  type LaneRecord,
  type StartState,
} from './lanes.js';
export {
  parseProjectFromFiles,
  parseComponentsFromFiles,
  isTaskFilePath,
  isComponentFilePath,
  type FileEntry,
  type ParseProjectFromFilesOptions,
  type ParseComponentsFromFilesOptions,
} from './files.js';
export {
  parseTaskDirectory,
  parseRoadmapFile,
  parseComponentDirectory,
  parseProject,
  type TaskDirectoryResult,
  type ParseProjectOptions,
} from './project.js';
