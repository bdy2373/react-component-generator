import { describe, expect, it } from 'vitest';
import { validatePromptLength } from './validatePromptLength';

describe('validatePromptLength', () => {
  it.each([0, 1, 499, 500])('%i자는 길이 제한을 통과한다', (length) => {
    expect(validatePromptLength('가'.repeat(length))).toBe(true);
  });

  it.each([501, 1000])('%i자는 길이 제한을 초과한다', (length) => {
    expect(validatePromptLength('가'.repeat(length))).toBe(false);
  });

  it('공백과 줄바꿈도 길이에 포함한다', () => {
    expect(validatePromptLength('가'.repeat(499) + ' \n')).toBe(false);
  });
});
