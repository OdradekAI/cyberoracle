import blacklist from './blacklist.json';

export interface ContentCheckResult {
  safe: boolean;
  matched: string[];
}

export function checkContent(text: string): ContentCheckResult {
  const normalized = text.toLowerCase();
  const matched = blacklist.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  return { safe: matched.length === 0, matched };
}
