import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const promptsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../prompts');

export interface PromptMeta {
  version: string;
  targetModel: string;
  temperature: number;
  outputFormat?: string;
  maxTokens?: number;
}

export interface LoadedPrompt {
  meta: PromptMeta;
  system: string;
  userTemplate: string;
}

export function loadPrompt(name: string): LoadedPrompt {
  const filePath = resolve(promptsDir, `${name}.md`);

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`Prompt "${name}" not found at ${filePath}`);
  }

  // Parse YAML frontmatter
  if (!content.startsWith('---\n')) {
    throw new Error(`Prompt "${name}" is missing YAML frontmatter`);
  }
  const frontmatterEnd = content.indexOf('\n---', 3);
  if (frontmatterEnd < 0) {
    throw new Error(`Prompt "${name}" has unclosed frontmatter`);
  }
  const frontmatterText = content.slice(3, frontmatterEnd);

  const meta: PromptMeta = {
    version: extractYamlField(frontmatterText, 'version'),
    targetModel: extractYamlField(frontmatterText, 'targetModel'),
    temperature: parseFloat(extractYamlField(frontmatterText, 'temperature')),
    outputFormat: extractOptionalYamlField(frontmatterText, 'outputFormat'),
    maxTokens: extractOptionalYamlField(frontmatterText, 'maxTokens')
      ? parseInt(extractOptionalYamlField(frontmatterText, 'maxTokens')!, 10)
      : undefined,
  };

  // Split on ---USER---
  const afterFrontmatter = content.slice(frontmatterEnd + 4); // skip past \n---
  const userSeparator = '---USER---';
  const userIndex = afterFrontmatter.indexOf(userSeparator);

  let system: string;
  let userTemplate: string;
  if (userIndex >= 0) {
    system = afterFrontmatter.slice(0, userIndex).trim();
    userTemplate = afterFrontmatter.slice(userIndex + userSeparator.length).trim();
  } else {
    system = afterFrontmatter.trim();
    userTemplate = '';
  }

  return { meta, system, userTemplate };
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in vars ? vars[key]! : match;
  });
}

function extractYamlField(text: string, field: string): string {
  const regex = new RegExp(`^${field}:\\s*['"]?(.+?)['"]?\\s*$`, 'm');
  const match = regex.exec(text);
  if (!match) {
    throw new Error(`Missing required frontmatter field: ${field}`);
  }
  return match[1]!;
}

function extractOptionalYamlField(text: string, field: string): string | undefined {
  const regex = new RegExp(`^${field}:\\s*['"]?(.+?)['"]?\\s*$`, 'm');
  const match = regex.exec(text);
  return match?.[1];
}

export async function expandIncludes(text: string): Promise<string> {
  const re = /<<include:([\w-]+)>>/g;
  const matches = Array.from(text.matchAll(re));
  let result = text;
  for (const m of matches) {
    const includePath = join(promptsDir, '_shared', `${m[1]}.md`);
    let content: string;
    try {
      content = await readFile(includePath, 'utf-8');
    } catch {
      throw new Error(`Include not found: _shared/${m[1]}.md`);
    }
    result = result.replace(m[0], content.trim());
  }
  return result;
}

/**
 * Load a JSON-payload prompt file (.md with frontmatter + multiple
 * `## <key>` sections, each containing one fenced ```json block).
 *
 * Returns an object mapping section heading → parsed JSON value, e.g.
 * `loadJsonPrompt('fallback-soft')` → `{ palm: {...}, face: {...}, daily: {...}, companion: {...} }`.
 *
 * Throws if any fenced block fails to parse, or if a section heading has
 * no following ```json block. Frontmatter is consumed but not returned;
 * callers that need it can use `loadPrompt()` instead.
 */
export function loadJsonPrompt(name: string): Record<string, unknown> {
  const filePath = resolve(promptsDir, `${name}.md`);

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`JSON prompt "${name}" not found at ${filePath}`);
  }

  // Strip frontmatter if present (same convention as loadPrompt).
  let body = content;
  if (body.startsWith('---\n')) {
    const fmEnd = body.indexOf('\n---', 3);
    if (fmEnd < 0) {
      throw new Error(`JSON prompt "${name}" has unclosed frontmatter`);
    }
    body = body.slice(fmEnd + 4);
  }

  const out: Record<string, unknown> = {};
  // Match `## <key>` followed (after any prose) by a ```json fenced block.
  // Use a non-greedy gap so one heading binds to its very next fence.
  const sectionRe = /^##\s+([^\n]+)\n([\s\S]*?)```json\s*\n([\s\S]*?)\n```/gm;
  let match: RegExpExecArray | null;
  while ((match = sectionRe.exec(body)) !== null) {
    const key = match[1]!.trim();
    const rawJson = match[3]!;
    try {
      out[key] = JSON.parse(rawJson);
    } catch (err) {
      throw new Error(
        `JSON prompt "${name}" section "${key}" has invalid JSON: ${(err as Error).message}`,
      );
    }
  }

  if (Object.keys(out).length === 0) {
    throw new Error(`JSON prompt "${name}" contains no parseable \`\`\`json sections`);
  }

  return out;
}
