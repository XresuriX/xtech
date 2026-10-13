import { describe, it, expect } from 'vitest';

describe('sample Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const text = 'Hello XTech';
    expect(text).toContain('XTech');
    expect(text.toLowerCase()).toBe('hello xtech');
  });
});