import { parseTaskFile } from './task.js';
import { parseRoadmap } from './roadmap.js';
import type {
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

/**
 * Assemble a whole-project model from in-memory files: every
 * `<tasksDir>/T-*.md` entry plus the roadmap. Returns the typed model and
 * every issue found; never throws. Insertion order of the input does not
 * matter — task files are processed in sorted path order, so results are
 * deterministic (mirrors parseTaskDirectory's filename ordering).
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

  const roadmapContent = map.get(roadmapFile);
  if (roadmapContent === undefined) {
    issues.push({
      kind: 'io-error',
      file: roadmapFile,
      message: `${roadmapFile}: cannot read roadmap — not present in file set`,
    });
    return { tasks, features: [], issues };
  }

  const roadmap = parseRoadmap(roadmapContent, roadmapFile);
  issues.push(...roadmap.issues);
  return { tasks, features: roadmap.features, issues };
}
