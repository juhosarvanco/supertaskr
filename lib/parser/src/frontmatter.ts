import { parse as parseYaml } from 'yaml';
import type { ParseIssue } from './types.js';

export interface FrontmatterResult {
  /** Parsed mapping; absent when the block is missing or malformed. */
  data?: Record<string, unknown>;
  /** Everything after the closing `---` (the markdown body). */
  body: string;
  issues: ParseIssue[];
}

const OPEN = /^\uFEFF?---\r?\n/;

/**
 * Extract and parse the leading `---` YAML frontmatter block.
 * Never throws: problems come back as structured issues and the body is
 * still returned so callers can keep going.
 */
export function extractFrontmatter(content: string, file: string): FrontmatterResult {
  const open = OPEN.exec(content);
  if (!open) {
    return {
      body: content,
      issues: [
        {
          kind: 'missing-frontmatter',
          file,
          message: `${file}: no frontmatter — file must start with a '---' YAML block`,
        },
      ],
    };
  }

  const rest = content.slice(open[0].length);
  const close = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (!close || close.index === undefined) {
    return {
      body: content,
      issues: [
        {
          kind: 'missing-frontmatter',
          file,
          message: `${file}: frontmatter opened with '---' but never closed`,
        },
      ],
    };
  }

  const yamlSource = rest.slice(0, close.index);
  const body = rest.slice(close.index + close[0].length);

  let data: unknown;
  try {
    data = parseYaml(yamlSource);
  } catch (err) {
    return {
      body,
      issues: [
        {
          kind: 'yaml-error',
          file,
          message: `${file}: malformed frontmatter YAML — ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  if (data === null || data === undefined) {
    // Empty frontmatter block: treat as an empty mapping; required-field
    // validation will say precisely what is missing.
    return { data: {}, body, issues: [] };
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    return {
      body,
      issues: [
        {
          kind: 'not-a-mapping',
          file,
          message: `${file}: frontmatter must be a YAML mapping of fields, got ${Array.isArray(data) ? 'a list' : typeof data}`,
        },
      ],
    };
  }

  return { data: data as Record<string, unknown>, body, issues: [] };
}
