import jsQR from 'jsqr';
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

  it('renders UUID-sized data as a standard version 4 QR matrix', () => {
    const matrix = createQrMatrix('550e8400-e29b-41d4-a716-446655440000');

    expect(matrix).toHaveLength(33);
    expect(matrix.every((row) => row.length === 33)).toBe(true);
    expect(matrix.slice(0, 7).map((row) => row.slice(0, 7))).toEqual(finderPattern);
    expect(matrix.slice(0, 7).map((row) => row.slice(26))).toEqual(finderPattern);
    expect(matrix.slice(26).map((row) => row.slice(0, 7))).toEqual(finderPattern);
  });

  it('encodes a resident URL that can be read by the personnel scanner', () => {
    const url = 'http://localhost:4200/b#550e8400-e29b-41d4-a716-446655440000';
    const matrix = createQrMatrix(url);
    const scale = 6;
    const quietZone = 4;
    const size = (matrix.length + 2 * quietZone) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dark = matrix[Math.floor(y / scale) - quietZone]?.[Math.floor(x / scale) - quietZone];
        if (dark) {
          const offset = (y * size + x) * 4;
          pixels.fill(0, offset, offset + 3);
        }
      }
    }
    expect(jsQR(pixels, size, size)?.data).toBe(url);
  });

  it('renders SVG with a quiet zone and a data URL for display and download', () => {
    const svg = createQrSvg('550e8400-e29b-41d4-a716-446655440000');

    expect(svg).toContain('viewBox="0 0 41 41"');
    expect(svg).toContain('<rect width="41" height="41" fill="#fff"/>');
    expect(createQrSvgDataUrl('550e8400-e29b-41d4-a716-446655440000')).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,/,
    );
  });

  it('rejects values that exceed the QR version capacity', () => {
    expect(() => createQrMatrix('x'.repeat(79))).toThrow(RangeError);
  });
});
