const QR_SIZE = 33;
const DATA_CODEWORDS = 80;
const ERROR_CORRECTION_CODEWORDS = 20;
const MAX_BYTE_LENGTH = 78;
const MASK_PATTERN = 0;

const gfExponent = new Uint8Array(512);
const gfLogarithm = new Uint8Array(256);

let gfValue = 1;
for (let index = 0; index < 255; index++) {
  gfExponent[index] = gfValue;
  gfLogarithm[gfValue] = index;
  gfValue <<= 1;
  if ((gfValue & 0x100) !== 0) {
    gfValue ^= 0x11d;
  }
}
for (let index = 255; index < gfExponent.length; index++) {
  gfExponent[index] = gfExponent[index - 255];
}

function multiplyInGaloisField(left: number, right: number): number {
  if (left === 0 || right === 0) {
    return 0;
  }
  return gfExponent[gfLogarithm[left] + gfLogarithm[right]];
}

function createErrorCorrectionCodewords(data: readonly number[]): number[] {
  let generator = [1];
  for (let index = 0; index < ERROR_CORRECTION_CODEWORDS; index++) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let coefficient = 0; coefficient < generator.length; coefficient++) {
      next[coefficient] ^= generator[coefficient];
      next[coefficient + 1] ^= multiplyInGaloisField(generator[coefficient], gfExponent[index]);
    }
    generator = next;
  }

  const remainder = new Array<number>(ERROR_CORRECTION_CODEWORDS).fill(0);
  for (const codeword of data) {
    const factor = codeword ^ remainder[0];
    for (let index = 0; index < remainder.length - 1; index++) {
      remainder[index] =
        remainder[index + 1] ^ multiplyInGaloisField(generator[index + 1], factor);
    }
    remainder[remainder.length - 1] =
      multiplyInGaloisField(generator[generator.length - 1], factor);
  }
  return remainder;
}

function appendBits(bits: number[], value: number, count: number): void {
  for (let index = count - 1; index >= 0; index--) {
    bits.push((value >>> index) & 1);
  }
}

function createDataCodewords(text: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > MAX_BYTE_LENGTH) {
    throw new RangeError(`QR Code data must not exceed ${MAX_BYTE_LENGTH} bytes.`);
  }

  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  const capacity = DATA_CODEWORDS * 8;
  const terminatorLength = Math.min(4, capacity - bits.length);
  for (let index = 0; index < terminatorLength; index++) {
    bits.push(0);
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  let padCodeword = 0xec;
  while (codewords.length < DATA_CODEWORDS) {
    codewords.push(padCodeword);
    padCodeword = padCodeword === 0xec ? 0x11 : 0xec;
  }
  return codewords;
}

function getFormatBits(): number {
  const data = (0b01 << 3) | MASK_PATTERN;
  let remainder = data;
  for (let index = 0; index < 10; index++) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

export function createQrMatrix(text: string): boolean[][] {
  const modules: (boolean | null)[][] = Array.from({ length: QR_SIZE }, () =>
    new Array<boolean | null>(QR_SIZE).fill(null),
  );
  const functionModules = Array.from({ length: QR_SIZE }, () =>
    new Array<boolean>(QR_SIZE).fill(false),
  );

  const setFunctionModule = (row: number, column: number, value: boolean): void => {
    if (row >= 0 && row < QR_SIZE && column >= 0 && column < QR_SIZE) {
      modules[row][column] = value;
      functionModules[row][column] = true;
    }
  };

  const drawFinderPattern = (top: number, left: number): void => {
    for (let rowOffset = -1; rowOffset <= 7; rowOffset++) {
      for (let columnOffset = -1; columnOffset <= 7; columnOffset++) {
        const inside = rowOffset >= 0 && rowOffset <= 6 && columnOffset >= 0 && columnOffset <= 6;
        const border = rowOffset === 0 || rowOffset === 6 || columnOffset === 0 || columnOffset === 6;
        const center =
          rowOffset >= 2 && rowOffset <= 4 && columnOffset >= 2 && columnOffset <= 4;
        setFunctionModule(
          top + rowOffset,
          left + columnOffset,
          inside && (border || center),
        );
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, QR_SIZE - 7);
  drawFinderPattern(QR_SIZE - 7, 0);

  for (let index = 8; index < QR_SIZE - 8; index++) {
    const value = index % 2 === 0;
    setFunctionModule(6, index, value);
    setFunctionModule(index, 6, value);
  }

  const alignmentCenter = QR_SIZE - 7;
  for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
    for (let columnOffset = -2; columnOffset <= 2; columnOffset++) {
      const distance = Math.max(Math.abs(rowOffset), Math.abs(columnOffset));
      setFunctionModule(
        alignmentCenter + rowOffset,
        alignmentCenter + columnOffset,
        distance !== 1,
      );
    }
  }

  const formatBits = getFormatBits();
  for (let index = 0; index <= 5; index++) {
    setFunctionModule(index, 8, ((formatBits >>> index) & 1) !== 0);
  }
  setFunctionModule(7, 8, ((formatBits >>> 6) & 1) !== 0);
  setFunctionModule(8, 8, ((formatBits >>> 7) & 1) !== 0);
  setFunctionModule(8, 7, ((formatBits >>> 8) & 1) !== 0);
  for (let index = 9; index < 15; index++) {
    setFunctionModule(8, 14 - index, ((formatBits >>> index) & 1) !== 0);
  }
  for (let index = 0; index < 8; index++) {
    setFunctionModule(8, QR_SIZE - 1 - index, ((formatBits >>> index) & 1) !== 0);
  }
  for (let index = 8; index < 15; index++) {
    setFunctionModule(QR_SIZE - 15 + index, 8, ((formatBits >>> index) & 1) !== 0);
  }
  setFunctionModule(QR_SIZE - 8, 8, true);

  const dataCodewords = createDataCodewords(text);
  const codewords = [...dataCodewords, ...createErrorCorrectionCodewords(dataCodewords)];
  const totalBits = codewords.length * 8;
  let bitIndex = 0;

  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let verticalIndex = 0; verticalIndex < QR_SIZE; verticalIndex++) {
      const upward = ((right + 1) & 2) === 0;
      const row = upward ? QR_SIZE - 1 - verticalIndex : verticalIndex;
      for (let offset = 0; offset < 2; offset++) {
        const column = right - offset;
        if (functionModules[row][column]) {
          continue;
        }

        const codewordBit =
          bitIndex < totalBits
            ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - (bitIndex % 8))) & 1) !== 0
            : false;
        const mask = (row + column) % 2 === 0;
        modules[row][column] = codewordBit !== mask;
        bitIndex++;
      }
    }
  }

  return modules.map((row) => row.map((module) => module ?? false));
}

export function createQrSvg(text: string): string {
  const matrix = createQrMatrix(text);
  const quietZone = 4;
  const viewSize = matrix.length + quietZone * 2;
  let path = '';

  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix.length; column++) {
      if (matrix[row][column]) {
        path += `M${column + quietZone} ${row + quietZone}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewSize * 8}" height="${viewSize * 8}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

export function createQrSvgDataUrl(text: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createQrSvg(text))}`;
}
