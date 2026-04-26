// Dithering algorithms for lo-fi image processing.
// All algorithms operate on grayscale [0, 1] pixel arrays.
// sRGB → linear conversion is applied before dithering,
// linear → sRGB conversion after.

export enum Algorithm {
  RANDOM = "random",
  BAYER_0 = "bayer-0",
  BAYER_1 = "bayer-1",
  BAYER_2 = "bayer-2",
  BAYER_3 = "bayer-3",
  BAYER_4 = "bayer-4",
  SHUFFLED_BAYER_2 = "shuffled-bayer-2",
  SHUFFLED_BAYER_4 = "shuffled-bayer-4",
  FLOYD_STEINBERG = "floyd-steinberg",
  ATKINSON = "atkinson",
  JARVIS_JUDICE_NINKE = "jarvis-judice-ninke",
  STUCKI = "stucki",
  SIERRA_2ROW = "sierra-2row",
  SIERRA_3ROW = "sierra-3row",
  BURKES = "burkes",
}

export const ALGORITHM_NAMES = Object.values(Algorithm);

// Error diffusion mask: [dx, dy, weight] (weight is numerator; divisor is shared)
export interface ErrorMask {
  dx: number;
  dy: number;
  weight: number;
}

export interface ErrorDiffusionConfig {
  mask: ErrorMask[];
  divisor: number;
}

// Ordered dithering: threshold matrix (normalized [0, 1])
export interface ThresholdMatrix {
  size: number;
  data: number[];
}

export interface DitherOptions {
  paletteSize?: number;
  seed?: number;
}

// ─── sRGB / Linear RGB ───────────────────────────────────────────────

const GAMMA = 2.4;
const DEFAULT_PALETTE_SIZE = 16;
const DEFAULT_SHUFFLE_SEED = 42;

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, GAMMA);
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / GAMMA) - 0.055;
}

// Convert sRGB pixel array to linear grayscale [0, 1]
export function toLinearGray(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = srgbToLinear(pixels[i]);
  }
  return out;
}

// Convert linear grayscale back to sRGB
export function toSrgbGray(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = linearToSrgb(pixels[i]);
  }
  return out;
}

// ─── Threshold Matrices ──────────────────────────────────────────────

export function generateBayerMatrix(level: number): ThresholdMatrix {
  const size = 1 << (level + 1); // 2^(level+1)
  const total = size * size;
  const data = new Float32Array(total);

  // Recursive construction of 2D threshold matrix
  function build(n: number): number[][] {
    if (n === 0) return [[0, 2], [3, 1]];
    const prev = build(n - 1);
    const s = prev.length * 2;
    const result: number[][] = [];
    for (let r = 0; r < s; r++) {
      const row: number[] = [];
      for (let c = 0; c < s; c++) {
        const pr = Math.floor(r / 2);
        const pc = Math.floor(c / 2);
        const quadrant = (r % 2) * 2 + (c % 2);
        row.push(prev[pr][pc] * 4 + quadrant);
      }
      result.push(row);
    }
    return result;
  }

  const matrix = build(level);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      data[r * size + c] = matrix[r][c] / total;
    }
  }

  return { size, data: Array.from(data) };
}

// ─── Error Diffusion Masks ───────────────────────────────────────────

export const FLOYD_STEINBERG_MASK: ErrorDiffusionConfig = {
  divisor: 16,
  mask: [
    { dx: 1, dy: 0, weight: 7 },
    { dx: -1, dy: 1, weight: 3 },
    { dx: 0, dy: 1, weight: 5 },
    { dx: 1, dy: 1, weight: 1 },
  ],
};

export const ATKINSON_MASK: ErrorDiffusionConfig = {
  divisor: 8,
  mask: [
    { dx: 0, dy: 1, weight: 1 },
    { dx: 1, dy: 1, weight: 1 },
    { dx: -2, dy: 2, weight: 1 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 1 },
    { dx: 1, dy: 2, weight: 1 },
  ],
};

export const JARVIS_JUDICE_NINKE_MASK: ErrorDiffusionConfig = {
  divisor: 48,
  mask: [
    { dx: 1, dy: 0, weight: 7 },
    { dx: 2, dy: 0, weight: 5 },
    { dx: -2, dy: 1, weight: 3 },
    { dx: -1, dy: 1, weight: 5 },
    { dx: 0, dy: 1, weight: 7 },
    { dx: 1, dy: 1, weight: 5 },
    { dx: 2, dy: 1, weight: 3 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 3 },
    { dx: 1, dy: 2, weight: 5 },
    { dx: 2, dy: 2, weight: 3 },
    { dx: 3, dy: 2, weight: 1 },
  ],
};

export const STUCKI_MASK: ErrorDiffusionConfig = {
  divisor: 42,
  mask: [
    { dx: 1, dy: 0, weight: 8 },
    { dx: 2, dy: 0, weight: 4 },
    { dx: -2, dy: 1, weight: 2 },
    { dx: -1, dy: 1, weight: 4 },
    { dx: 0, dy: 1, weight: 8 },
    { dx: 1, dy: 1, weight: 4 },
    { dx: 2, dy: 1, weight: 2 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 2 },
    { dx: 1, dy: 2, weight: 4 },
    { dx: 2, dy: 2, weight: 2 },
    { dx: 3, dy: 2, weight: 1 },
  ],
};

export const SIERRA_2ROW_MASK: ErrorDiffusionConfig = {
  divisor: 32,
  mask: [
    { dx: 1, dy: 0, weight: 5 },
    { dx: 2, dy: 0, weight: 3 },
    { dx: -2, dy: 1, weight: 2 },
    { dx: -1, dy: 1, weight: 4 },
    { dx: 0, dy: 1, weight: 5 },
    { dx: 1, dy: 1, weight: 4 },
    { dx: 2, dy: 1, weight: 2 },
    { dx: 3, dy: 1, weight: 1 },
    { dx: 4, dy: 1, weight: 1 },
  ],
};

export const SIERRA_3ROW_MASK: ErrorDiffusionConfig = {
  divisor: 64,
  mask: [
    { dx: 1, dy: 0, weight: 5 },
    { dx: 2, dy: 0, weight: 3 },
    { dx: -3, dy: 1, weight: 2 },
    { dx: -2, dy: 1, weight: 4 },
    { dx: -1, dy: 1, weight: 5 },
    { dx: 0, dy: 1, weight: 6 },
    { dx: 1, dy: 1, weight: 5 },
    { dx: 2, dy: 1, weight: 4 },
    { dx: 3, dy: 1, weight: 2 },
    { dx: -2, dy: 2, weight: 1 },
    { dx: -1, dy: 2, weight: 2 },
    { dx: 0, dy: 2, weight: 3 },
    { dx: 1, dy: 2, weight: 2 },
    { dx: 2, dy: 2, weight: 1 },
  ],
};

export const BURKES_MASK: ErrorDiffusionConfig = {
  divisor: 8,
  mask: [
    { dx: 1, dy: 0, weight: 1 },
    { dx: 2, dy: 0, weight: 1 },
    { dx: -2, dy: 1, weight: 1 },
    { dx: -1, dy: 1, weight: 2 },
    { dx: 0, dy: 1, weight: 2 },
    { dx: 1, dy: 1, weight: 1 },
  ],
};

// ─── Core Dithering Functions ────────────────────────────────────────

function quantize(value: number): number {
  return value > 0.5 ? 1.0 : 0.0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Random dithering: add uniform noise [-0.5, 0.5] before quantizing
export function randomDither(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = quantize(pixels[i] + Math.random() - 0.5);
  }
  return out;
}

// Ordered dithering with threshold matrix
// Overload: orderedDither(pixels, width, height, matrix)
// The single-parameter overload is for backwards compat with tests
export function orderedDither(
  pixels: Float32Array,
  widthOrMatrix: number | ThresholdMatrix,
  height?: number,
  matrix?: ThresholdMatrix,
): Float32Array {
  // Backwards compat: orderedDither(pixels, matrix)
  if (typeof widthOrMatrix === "object") {
    const m = widthOrMatrix;
    const w = Math.sqrt(pixels.length) | 0;
    return orderedDither(pixels, w, w, m);
  }
  // Full impl: orderedDither(pixels, width, height, matrix)
  const w = widthOrMatrix as number;
  const h = height as number;
  const m = matrix as ThresholdMatrix;
  const out = new Float32Array(pixels.length);
  const { size, data } = m;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const mx = x % size;
      const my = y % size;
      const threshold = data[my * size + mx];
      out[idx] = pixels[idx] > threshold ? 1.0 : 0.0;
    }
  }
  return out;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function bayerLevelForSize(matrixSize: 2 | 4): number {
  return matrixSize === 2 ? 0 : 1;
}

export function maximinInit(pixels: Float32Array, paletteSize: number): Float32Array {
  const size = Math.max(0, Math.floor(paletteSize));
  if (pixels.length === 0 || size === 0) {
    return new Float32Array(0);
  }

  const palette = new Float32Array(size);
  palette[0] = pixels[0];

  let filled = 1;
  while (filled < size) {
    let bestPixel = palette[filled - 1];
    let bestDistance = -1;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      let nearestDistance = Infinity;

      for (let j = 0; j < filled; j++) {
        const distance = Math.abs(pixel - palette[j]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
        }
      }

      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance;
        bestPixel = pixel;
      }
    }

    palette[filled] = bestPixel;
    filled++;

    if (bestDistance === 0) {
      while (filled < size) {
        palette[filled] = bestPixel;
        filled++;
      }
    }
  }

  return palette;
}

export function* shuffledBayerTraversal(
  width: number,
  height: number,
  matrixSize: 2 | 4,
  seed = DEFAULT_SHUFFLE_SEED,
): Generator<[x: number, y: number]> {
  const matrix = generateBayerMatrix(bayerLevelForSize(matrixSize));
  const random = mulberry32(seed);
  const cells = matrix.data
    .map((value, index) => ({
      value,
      x: index % matrix.size,
      y: Math.floor(index / matrix.size),
    }))
    .sort((a, b) => a.value - b.value);

  for (const cell of cells) {
    const pixels: [number, number][] = [];
    for (let y = cell.y; y < height; y += matrix.size) {
      for (let x = cell.x; x < width; x += matrix.size) {
        pixels.push([x, y]);
      }
    }
    shuffleInPlace(pixels, random);
    for (const pixel of pixels) {
      yield pixel;
    }
  }
}

function nearestPaletteIndex(value: number, palette: Float32Array): number {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const distance = Math.abs(value - palette[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function shuffledBayerOKM(
  pixels: Float32Array,
  width: number,
  height: number,
  paletteSize: number,
  matrixSize: 2 | 4,
  seed = DEFAULT_SHUFFLE_SEED,
): Float32Array {
  if (pixels.length === 0) {
    return new Float32Array(0);
  }

  const srgbPixels = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    srgbPixels[i] = linearToSrgb(clamp01(pixels[i]));
  }

  const palette = maximinInit(srgbPixels, paletteSize);
  const assignments = new Uint16Array(pixels.length);

  let pixelIndex = 0;
  for (const [x, y] of shuffledBayerTraversal(width, height, matrixSize, seed)) {
    const idx = y * width + x;
    const nearest = nearestPaletteIndex(srgbPixels[idx], palette);
    assignments[idx] = nearest;

    const learningRate = 1 / (pixelIndex + 1);
    palette[nearest] += learningRate * (srgbPixels[idx] - palette[nearest]);
    pixelIndex++;
  }

  const out = new Float32Array(pixels.length);
  for (let i = 0; i < assignments.length; i++) {
    out[i] = quantize(srgbToLinear(clamp01(palette[assignments[i]])));
  }
  return out;
}

// Main dithering function
export function dither(
  pixels: Float32Array,
  width: number,
  height: number,
  algorithm: Algorithm,
  options: DitherOptions = {},
): Float32Array {
  switch (algorithm) {
    case Algorithm.RANDOM:
      return randomDither(pixels);

    case Algorithm.BAYER_0:
    case Algorithm.BAYER_1:
    case Algorithm.BAYER_2:
    case Algorithm.BAYER_3:
    case Algorithm.BAYER_4: {
      const level = parseInt(algorithm.replace("bayer-", ""), 10);
      const matrix = generateBayerMatrix(level);
      return orderedDither(pixels, width, height, matrix);
    }

    case Algorithm.SHUFFLED_BAYER_2:
      return shuffledBayerOKM(
        pixels,
        width,
        height,
        options.paletteSize ?? DEFAULT_PALETTE_SIZE,
        2,
        options.seed ?? DEFAULT_SHUFFLE_SEED,
      );

    case Algorithm.SHUFFLED_BAYER_4:
      return shuffledBayerOKM(
        pixels,
        width,
        height,
        options.paletteSize ?? DEFAULT_PALETTE_SIZE,
        4,
        options.seed ?? DEFAULT_SHUFFLE_SEED,
      );

    case Algorithm.FLOYD_STEINBERG:
      return errorDiffuse(pixels, width, height, FLOYD_STEINBERG_MASK);

    case Algorithm.ATKINSON:
      return errorDiffuse(pixels, width, height, ATKINSON_MASK);

    case Algorithm.JARVIS_JUDICE_NINKE:
      return errorDiffuse(pixels, width, height, JARVIS_JUDICE_NINKE_MASK);

    case Algorithm.STUCKI:
      return errorDiffuse(pixels, width, height, STUCKI_MASK);

    case Algorithm.SIERRA_2ROW:
      return errorDiffuse(pixels, width, height, SIERRA_2ROW_MASK);

    case Algorithm.SIERRA_3ROW:
      return errorDiffuse(pixels, width, height, SIERRA_3ROW_MASK);

    case Algorithm.BURKES:
      return errorDiffuse(pixels, width, height, BURKES_MASK);

    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

function errorDiffuse(
  pixels: Float32Array,
  width: number,
  height: number,
  config: ErrorDiffusionConfig,
): Float32Array {
  const out = new Float32Array(pixels); // work on a copy
  const { mask, divisor } = config;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const old = out[idx];
      const nearest = quantize(old);
      const error = old - nearest;

      out[idx] = nearest;

      for (const { dx, dy, weight } of mask) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          out[ny * width + nx] += (error * weight) / divisor;
        }
      }
    }
  }

  return out;
}

// ─── Image I/O Helpers ───────────────────────────────────────────────

export interface ImageData {
  pixels: Float32Array;
  width: number;
  height: number;
}

// Convert sRGB pixel to grayscale using luminance weights
export function rgbToGray(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Load an ImageData from a canvas ImageData (sRGB)
export function loadImageData(imageData: ImageData): ImageData {
  // Convert sRGB to linear grayscale
  const gray = new Float32Array(imageData.pixels.length);
  for (let i = 0; i < imageData.pixels.length; i++) {
    gray[i] = srgbToLinear(imageData.pixels[i]);
  }
  return { pixels: gray, width: imageData.width, height: imageData.height };
}

// Save grayscale [0,1] back to sRGB ImageData
export function saveImageData(gray: Float32Array, width: number, height: number): ImageData {
  const srgb = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    srgb[i] = linearToSrgb(gray[i]);
  }
  return { pixels: srgb, width, height };
}
