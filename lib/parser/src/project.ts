import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTaskFile } from './task.js';
import { parseRoadmap } from './roadmap.js';
import type {
  ParseIssue,
  ProjectParseResult,
  RoadmapParseResult,
  TaskRecord,
} from './types.js';

/**
 * Thin filesystem layer over the pure string parsers. Everything here
 * collects issues and keeps going — one broken file never hides the rest
 * of the project (the board must render what it can).
 */

export interface TaskDirectoryResult {
  tasks: TaskRecord[];
  issues: ParseIssue[];
}

/**
 * Parse every `T-*.md` in a directory (the docs/tasks/ convention).
 * Files are processed in filename order, so results are deterministic.
 *
 * Duplicate ids across files produce a `duplicate-id` issue listing the
 * first path seen and the offending path; both records stay in `tasks`
 * (flagging, not hiding, is the parser's job).
 */
export function parseTaskDirectory(dir: string): TaskDirectoryResult {
  const tasks: TaskRecord[] = [];
  const issues: ParseIssue[] = [];

  let names: string[];
  try {
    names = readdirSync(dir)
      .filter((name) => /^T-.*\.md$/.test(name))
      .sort();
  } catch (err) {
    return {
      tasks,
      issues: [
        {
          kind: 'io-error',
          file: dir,
          message: `${dir}: cannot read tasks directory — ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  const byId = new Map<string, string>(); // id -> first file seen
  for (const name of names) {
    const file = join(dir, name);
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch (err) {
      issues.push({
        kind: 'io-error',
        file,
        message: `${file}: cannot read file — ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const result = parseTaskFile(content, file);
    issues.push(...result.issues);
    if (!result.task) continue;

    const { task } = result;
    if (task.id !== undefined) {
      const first = byId.get(task.id);
      if (first !== undefined) {
        issues.push({
          kind: 'duplicate-id',
          id: task.id,
          files: [first, file],
          message: `duplicate task id '${task.id}' in ${first} and ${file}`,
        });
      } else {
        byId.set(task.id, file);
      }
    }
    tasks.push(task);
  }

  return { tasks, issues };
}

/** Parse a roadmap file from disk; a missing file is an io-error issue. */
export function parseRoadmapFile(file: string): RoadmapParseResult {
  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch (err) {
    return {
      features: [],
      issues: [
        {
          kind: 'io-error',
          file,
          message: `${file}: cannot read roadmap — ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
  return parseRoadmap(content, file);
}

export interface ParseProjectOptions {
  /** Tasks directory, default `<root>/docs/tasks`. */
  tasksDir?: string;
  /** Roadmap file, default `<root>/docs/ROADMAP.md`. */
  roadmapFile?: string;
}

/**
 * Parse a whole nputer project: docs/tasks/T-*.md plus the ROADMAP
 * backbone. Returns the typed model and every issue found; never throws.
 */
export function parseProject(root: string, options: ParseProjectOptions = {}): ProjectParseResult {
  const tasksDir = options.tasksDir ?? join(root, 'docs', 'tasks');
  const roadmapFile = options.roadmapFile ?? join(root, 'docs', 'ROADMAP.md');

  const taskResult = parseTaskDirectory(tasksDir);
  const roadmapResult = parseRoadmapFile(roadmapFile);

  return {
    tasks: taskResult.tasks,
    features: roadmapResult.features,
    issues: [...taskResult.issues, ...roadmapResult.issues],
  };
}
