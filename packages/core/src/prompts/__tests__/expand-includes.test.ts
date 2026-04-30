import { describe, it, expect } from 'vitest';
import { expandIncludes } from '../loader';

describe('expandIncludes', () => {
  it('replaces single <<include:safety-rules>> with file content', async () => {
    const input = 'Before\n<<include:safety-rules>>\nAfter';
    const result = await expandIncludes(input);
    expect(result).toContain('内容安全红线');
    expect(result).not.toContain('<<include:safety-rules>>');
    expect(result).toContain('Before');
    expect(result).toContain('After');
  });

  it('replaces multiple <<include:...>> markers in one text', async () => {
    const input = '<<include:safety-rules>>\n---\n<<include:tone-guidelines>>';
    const result = await expandIncludes(input);
    expect(result).toContain('内容安全红线');
    expect(result).toContain('语气规范');
    expect(result).not.toContain('<<include:');
  });

  it('returns text unchanged when no include markers present', async () => {
    const input = 'Plain text without any includes.';
    const result = await expandIncludes(input);
    expect(result).toBe(input);
  });

  it('throws descriptive error when included file does not exist', async () => {
    const input = '<<include:nonexistent-file>>';
    await expect(expandIncludes(input)).rejects.toThrow('Include not found');
  });
});
