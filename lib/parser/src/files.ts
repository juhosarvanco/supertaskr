import { parseTaskFile } from './task.js';
import { parseRoadmap } from './roadmap.js';
import { parseComponentSet } from './component.js';
import type {
  ComponentSetResult,
  ParseIssue,
  ProjectParseResult,
  TaskRecord,
} from './types.js';

/**
 * Pure, filesystem-free counterpart of parseProject (T-003).
 *
 * The watcher pipeline runs the parser where TypeScript runs — inside the
 * app's webview — so the filesystem layer (project.ts, node:fs) cannot be
 * imported there. This module assembles the same ProjectParseResult from an
 * in-memory file set instead: the Rust side ships `{ path, content }` pairs
 * over IPC and the frontend calls parseProjectFromFiles on every change.
 *
 * Paths are project-relative with forward slashes (`docs/tasks/T-001-x.md`),
 * exactly as the app's snapshot payload delivers them. Semantics mirror
 * project.ts deliberately: same T-*.md filename filter, same deterministic
 * path ordering, same duplicate-id issue message, and a missing roadmap
 * surfaces as an `io-error` issue just like an unreadable file on disk.
 *
 * ADR-009: every collection keyed by file-derived strings in here is a Map.
 */

/** One in-memory file: project-relative POSIX path plus raw content. */
export interface FileEntry {
  path: string;
  content: string;
}

export interface ParseProjectFromFilesOptions {
  /** Directory (relative POSIX) holding task files, default `docs/tasks`. */
  tasksDir?: string;
  /** Roadmap path (relative POSIX), default `docs/ROADMAP.md`. */
  roadmapFile?: string;
  /** Directory (relative POSIX) holding component files, default
   * `docs/architecture/components`. */
  componentsDir?: string;
}

/** Normalize accepted input shapes into a Map (ADR-009: untrusted keys). */
function toFileMap(files: Iterable<FileEntry> | ReadonlyMap<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  if (files instanceof Map) {
    for (const [path, content] of files) map.set(path, content);
    return map;
  }
  for (const entry of files as Iterable<FileEntry>) map.set(entry.path, entry.content);
  return map;
}

/** True when `path` names a task file directly inside `tasksDir`. */
export function isTaskFilePath(path: string, tasksDir = 'docs/tasks'): boolean {
  const prefix = `${tasksDir}/`;
  if (!path.startsWith(prefix)) return false;
  const name = path.slice(prefix.length);
  return !name.includes('/') && /^T-.*\.md$/.test(name);
}

/** True when `path` names a component file directly inside `componentsDir`. */
export function isComponentFilePath(
  path: string,
  componentsDir = 'docs/architecture/components',
): boolean {
  const prefix = `${componentsDir}/`;
  if (!path.startsWith(prefix)) return false;
  const name = path.slice(prefix.length);
  return !name.includes('/') && /^C-.*\.md$/.test(name);
}

export interface ParseComponentsFromFilesOptions {
  /** Directory (relative POSIX) holding component files, default
   * `docs/architecture/components`. */
  componentsDir?: string;
}

/**
 * Parse every `<componentsDir>/C-*.md` entry of an in-memory file set
 * into the architecture intent layer (T-008). Pure counterpart of
 * parseComponentDirectory: same filename filter, same deterministic
 * ordering, same cross-file rules (duplicate ids, dangling depends_on,
 * provable paths overlap). An input with no component files yields an
 * empty result with zero issues — "no architecture declared" is a legal
 * state, not an error.
 */
export function parseComponentsFromFiles(
  files: Iterable<FileEntry> | ReadonlyMap<string, string>,
  options: ParseComponentsFromFilesOptions = {},
): ComponentSetResult {
  const componentsDir = options.componentsDir ?? 'docs/architecture/components';
  const map = toFileMap(files);
  const entries = [...map.entries()]
    .filter(([path]) => isComponentFilePath(path, componentsDir))
    .map(([path, content]) => ({ path, content }));
  return parseComponentSet(entries);
}

/**
 * Assemble a whole-project model from in-memory files: every
 * `<tasksDir>/T-*.md` entry, the roadmap, plus every
 * `<componentsDir>/C-*.md` component file (T-008; a set with none yields
 * `components: []` and no issue). Returns the typed model and every issue
 * found; never throws. Insertion order of the input does not matter —
 * files are processed in sorted path order, so results are deterministic
 * (mirrors the disk layer's filename ordering).
 */
export function parseProjectFromFiles(
  files: Iterable<FileEntry> | ReadonlyMap<string, string>,
  options: ParseProjectFromFilesOptions = {},
): ProjectParseResult {
  const tasksDir = options.tasksDir ?? 'docs/tasks';
  const roadmapFile = options.roadmapFile ?? 'docs/ROADMAP.md';
  const map = toFileMap(files);

  const tasks: TaskRecord[] = [];
  const issues: ParseIssue[] = [];

  const taskPaths = [...map.keys()].filter((path) => isTaskFilePath(path, tasksDir)).sort();

  const byId = new Map<string, string>(); // id -> first file seen
  for (const path of taskPaths) {
    const content = map.get(path);
    if (content === undefined) continue; // unreachable: paths come from map
    const result = parseTaskFile(content, path);
    issues.push(...result.issues);
    if (!result.task) continue;

    const { task } = result;
    if (task.id !== undefined) {
      const first = byId.get(task.id);
      if (first !== undefined) {
        issues.push({
          kind: 'duplicate-id',
          id: task.id,
          files: [first, path],
          message: `duplicate task id '${task.id}' in ${first} and ${path}`,
        });
      } else {
        byId.set(task.id, path);
      }
    }
    tasks.push(task);
  }

  // Components parse regardless of roadmap presence; their issues come
  // last (task -> roadmap -> component order, mirroring the disk layer).
  const componentSet = parseComponentsFromFiles(map, {
    ...(options.componentsDir !== undefined ? { componentsDir: options.componentsDir } : {}),
  });

  const roadmapContent = map.get(roadmapFile);
  if (roadmapContent === undefined) {
    issues.push({
      kind: 'io-error',
      file: roadmapFile,
      message: `${roadmapFile}: cannot read roadmap — not present in file set`,
    });
    return {
      tasks,
      features: [],
      components: componentSet.components,
      issues: [...issues, ...componentSet.issues],
    };
  }

  const roadmap = parseRoadmap(roadmapContent, roadmapFile);
  issues.push(...roadmap.issues, ...componentSet.issues);
  return { tasks, features: roadmap.features, components: componentSet.components, issues };
}
