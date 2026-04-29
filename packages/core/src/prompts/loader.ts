import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const promptsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../prompts');

export interface PromptMeta {
  version: string;
  targetModel: string;
  temperature: number;
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
