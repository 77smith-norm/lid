import { describe, expect, it } from "bun:test";
import { shuffledBayerOKM as exportedShuffledBayerOKM } from "../src/index.js";
import {
  Algorithm,
  dither,
  maximinInit,
  shuffledBayerOKM,
  shuffledBayerTraversal,
} from "../src/dither.js";

function makePixels(width: number, height: number, fn: (x: number, y: number) => number): Float32Array {
  const pixels = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels[y * width + x] = fn(x, y);
    }
  }
  return pixels;
}

function isBinary(pixels: Float32Array): boolean {
  for (const pixel of pixels) {
    if (pixel !== 0 && pixel !== 1) {
      return false;
    }
  }
  return true;
}

describe("maximinInit", () => {
  it("picks spread-out grayscale values deterministically", () => {
    const pixels = new Float32Array([0, 0.25, 0.5, 0.75, 1]);
    expect(Array.from(maximinInit(pixels, 3))).toEqual([0, 1, 0.5]);
  });
});

describe("shuffledBayerTraversal", () => {
  it("visits every pixel exactly once", () => {
    const traversal = Array.from(shuffledBayerTraversal(5, 3, 2, 42));
    expect(traversal).toHaveLength(15);

    const seen = new Set(traversal.map(([x, y]) => `${x},${y}`));
    expect(seen.size).toBe(15);
  });

  it("is deterministic for a fixed seed", () => {
    const a = Array.from(shuffledBayerTraversal(6, 4, 2, 42));
    const b = Array.from(shuffledBayerTraversal(6, 4, 2, 42));
    const c = Array.from(shuffledBayerTraversal(6, 4, 2, 7));

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("shuffled Bayer dither", () => {
  it("re-exports shuffledBayerOKM from the package entry", () => {
    expect(exportedShuffledBayerOKM).toBe(shuffledBayerOKM);
  });

  it("produces binary output for shuffled-bayer-2", () => {
    const pixels = makePixels(8, 8, (x) => x / 7);
    const result = dither(pixels, 8, 8, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4 });
    expect(isBinary(result)).toBe(true);
  });

  it("is deterministic for a fixed seed", () => {
    const pixels = makePixels(8, 8, (x, y) => (x + y) / 14);

    const a = dither(pixels, 8, 8, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4, seed: 42 });
    const b = dither(pixels, 8, 8, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4, seed: 42 });
    const c = dither(pixels, 8, 8, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4, seed: 7 });

    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it("uses different Bayer sizes to produce different patterns", () => {
    const pixels = makePixels(16, 16, (x, y) => ((x * 13 + y * 7) % 17) / 16);

    const bayer2 = dither(pixels, 16, 16, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 8, seed: 42 });
    const bayer4 = dither(pixels, 16, 16, Algorithm.SHUFFLED_BAYER_4, { paletteSize: 8, seed: 42 });

    expect(Array.from(bayer2)).not.toEqual(Array.from(bayer4));
  });

  it("preserves solid black and white inputs", () => {
    const black = new Float32Array(16).fill(0);
    const white = new Float32Array(16).fill(1);

    const blackResult = dither(black, 4, 4, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4 });
    const whiteResult = dither(white, 4, 4, Algorithm.SHUFFLED_BAYER_2, { paletteSize: 4 });

    expect(Array.from(blackResult)).toEqual(Array(16).fill(0));
    expect(Array.from(whiteResult)).toEqual(Array(16).fill(1));
  });
});
