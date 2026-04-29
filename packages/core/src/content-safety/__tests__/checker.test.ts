import { describe, it, expect } from 'vitest';
import { checkContent } from '../checker';

describe('checkContent', () => {
  it('returns safe:true with no matches for clean text', () => {
    const result = checkContent('今日运势不错，万事如意');
    expect(result.safe).toBe(true);
    expect(result.matched).toEqual([]);
  });

  it('detects 健康建议 keyword', () => {
    const result = checkContent('请注意健康建议');
    expect(result.safe).toBe(false);
    expect(result.matched).toContain('健康建议');
  });

  it('detects multiple keywords in one text', () => {
    const result = checkContent('投资建议和赚钱方法');
    expect(result.safe).toBe(false);
    expect(result.matched).toContain('投资建议');
    expect(result.matched).toContain('赚钱');
  });

  it('performs case-insensitive matching', () => {
    const result = checkContent('这是政治话题');
    expect(result.safe).toBe(false);
    expect(result.matched).toContain('政治');
  });

  it('detects all blacklist keywords', () => {
    const keywords = [
      '健康建议',
      '寿命',
      '疾病',
      '治疗',
      '投资建议',
      '赚钱',
      '自杀',
      '死亡',
      '政治',
    ];
    for (const keyword of keywords) {
      const result = checkContent(`这段文字包含${keyword}关键词`);
      expect(result.safe).toBe(false);
      expect(result.matched).toContain(keyword);
    }
  });

  it('handles empty string', () => {
    const result = checkContent('');
    expect(result.safe).toBe(true);
    expect(result.matched).toEqual([]);
  });
});
