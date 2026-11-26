import { describe, expect, it } from 'vitest';
import { braceletCode, readBraceletCode } from './bracelet-link';

describe('Bracelet link', () => {
  const origin = 'https://medtech.example';
  const code = 'QR-DEMO-010';

  it('accepts a same-origin link and keeps legacy printed codes valid', () => {
    expect(readBraceletCode(`${origin}/b#${code}`, origin)).toBe(code);
    expect(readBraceletCode(' ' + code + ' ', origin)).toBe(code);
  });

  it('rejects different origins, paths, query strings and invalid fragments', () => {
    expect(readBraceletCode(`https://other.example/b#${code}`, origin)).toBe('');
    expect(readBraceletCode(`${origin}/other#${code}`, origin)).toBe('');
    expect(readBraceletCode(`${origin}/b?code=${code}`, origin)).toBe('');
    expect(braceletCode('/admin')).toBeNull();
    expect(braceletCode('a'.repeat(201))).toBeNull();
  });
});
