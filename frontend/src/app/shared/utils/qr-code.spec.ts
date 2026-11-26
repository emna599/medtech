import { createQrMatrix, createQrSvg, createQrSvgDataUrl } from './qr-code';

describe('QR Code renderer', () => {
  const finderPattern = [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ];

  it('renders UUID-sized data as a standard version 3 QR matrix', () => {
    const matrix = createQrMatrix('550e8400-e29b-41d4-a716-446655440000');

    expect(matrix).toHaveLength(29);
    expect(matrix.every((row) => row.length === 29)).toBe(true);
    expect(matrix.slice(0, 7).map((row) => row.slice(0, 7))).toEqual(finderPattern);
    expect(matrix.slice(0, 7).map((row) => row.slice(22))).toEqual(finderPattern);
    expect(matrix.slice(22).map((row) => row.slice(0, 7))).toEqual(finderPattern);
  });

  it('renders SVG with a quiet zone and a data URL for display and download', () => {
    const svg = createQrSvg('550e8400-e29b-41d4-a716-446655440000');

    expect(svg).toContain('viewBox="0 0 37 37"');
    expect(svg).toContain('<rect width="37" height="37" fill="#fff"/>');
    expect(createQrSvgDataUrl('550e8400-e29b-41d4-a716-446655440000')).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,/,
    );
  });

  it('rejects values that exceed the QR version capacity', () => {
    expect(() => createQrMatrix('x'.repeat(54))).toThrow(RangeError);
  });
});
