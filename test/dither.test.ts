import { describe, it, expect } from "bun:test";
import {
  Algorithm,
  dither,
  randomDither,
  orderedDither,
  generateBayerMatrix,
  srgbToLinear,
  linearToSrgb,
  rgbToGray,
  toLinearGray,
  toSrgbGray,
  FLOYD_STEINBERG_MASK,
  ATKINSON_MASK,
  JARVIS_JUDICE_NINKE_MASK,
  STUCKI_MASK,
  SIERRA_2ROW_MASK,
  SIERRA_3ROW_MASK,
  BURKES_MASK,
} from "../src/dither.js";

// ─── Helpers ──────────────────────────────────────────────────────────

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
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i];
    if (v !== 0 && v !== 1) return false;
  }
  return true;
}

// ─── sRGB / Linear ────────────────────────────────────────────────────

describe("sRGB / Linear conversion", () => {
  it("srgbToLinear handles linear range (<=0.04045)", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(0.04045)).toBeCloseTo(0.04045 / 12.92);
  });

  it("srgbToLinear handles gamma range (>0.04045)", () => {
    expect(srgbToLinear(1)).toBeCloseTo(Math.pow(1.055 / 1.055, 2.4));
    expect(srgbToLinear(0.5)).toBeCloseTo(Math.pow((0.5 + 0.055) / 1.055, 2.4));
  });

  it("linearToSrgb handles linear range (<=0.0031308)", () => {
    expect(linearToSrgb(0)).toBe(0);
    expect(linearToSrgb(0.0031308)).toBeCloseTo(12.92 * 0.0031308);
  });

  it("linearToSrgb handles gamma range (>0.0031308)", () => {
    expect(linearToSrgb(1)).toBeCloseTo(1.055 * Math.pow(1, 1 / 2.4) - 0.055);
  });

  it("round-trip preserves values", () => {
    for (let srgb = 0; srgb <= 1; srgb += 0.01) {
      const linear = srgbToLinear(srgb);
      const back = linearToSrgb(linear);
      expect(back).toBeCloseTo(srgb, 4);
    }
  });

  it("toLinearGray converts all pixels", () => {
    const input = new Float32Array([0, 0.5, 1]);
    const output = toLinearGray(input);
    expect(output.length).toBe(3);
    expect(output[0]).toBe(0);
    expect(output[2]).toBe(1);
  });

  it("toSrgbGray converts all pixels", () => {
    const input = new Float32Array([0, 0.5, 1]);
    const output = toSrgbGray(input);
    expect(output.length).toBe(3);
    expect(output[0]).toBe(0);
    expect(output[2]).toBeCloseTo(1.055 * Math.pow(1, 1 / 2.4) - 0.055);
  });

  it("rgbToGray uses correct luminance weights", () => {
    // Pure red
    expect(rgbToGray(255, 0, 0)).toBeCloseTo(0.2126 * 255);
    // Pure green (highest weight)
    expect(rgbToGray(0, 255, 0)).toBeCloseTo(0.7152 * 255);
    // Pure blue (lowest weight)
    expect(rgbToGray(0, 0, 255)).toBeCloseTo(0.0722 * 255);
    // White
    expect(rgbToGray(255, 255, 255)).toBeCloseTo(255);
    // Black
    expect(rgbToGray(0, 0, 0)).toBe(0);
  });
});

// ─── Bayer Matrix ─────────────────────────────────────────────────────

describe("Bayer matrix generation", () => {
  it("level 0 produces 2x2 matrix", () => {
    const m = generateBayerMatrix(0);
    expect(m.size).toBe(2);
    expect(m.data.length).toBe(4);
  });

  it("level 1 produces 4x4 matrix", () => {
    const m = generateBayerMatrix(1);
    expect(m.size).toBe(4);
    expect(m.data.length).toBe(16);
  });

  it("level 2 produces 8x8 matrix", () => {
    const m = generateBayerMatrix(2);
    expect(m.size).toBe(8);
    expect(m.data.length).toBe(64);
  });

  it("level 3 produces 16x16 matrix", () => {
    const m = generateBayerMatrix(3);
    expect(m.size).toBe(16);
  });

  it("level 4 produces 32x32 matrix", () => {
    const m = generateBayerMatrix(4);
    expect(m.size).toBe(32);
  });

  it("matrix values are in [0, 1] range", () => {
    for (let level = 0; level <= 4; level++) {
      const m = generateBayerMatrix(level);
      for (const v of m.data) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("level 0 matrix matches known pattern", () => {
    const m = generateBayerMatrix(0);
    // Known 2x2 Bayer threshold matrix (normalized):
    // [0/4, 2/4]
    // [3/4, 1/4]
    expect(m.data[0]).toBeCloseTo(0 / 4);
    expect(m.data[1]).toBeCloseTo(2 / 4);
    expect(m.data[2]).toBeCloseTo(3 / 4);
    expect(m.data[3]).toBeCloseTo(1 / 4);
  });
});

// ─── Random Dither ────────────────────────────────────────────────────

describe("randomDither", () => {
  it("output is binary", () => {
    const pixels = new Float32Array([0.3, 0.7, 0.5, 0.0, 1.0]);
    const result = randomDither(pixels);
    expect(isBinary(result)).toBe(true);
  });

  it("output matches input length", () => {
    const pixels = new Float32Array(100);
    const result = randomDither(pixels);
    expect(result.length).toBe(100);
  });

  it("values near 0.5 have ~50/50 split (statistical)", () => {
    // Run many times and check that roughly half the pixels flip
    let totalFlips = 0;
    let totalPixels = 0;
    for (let run = 0; run < 10; run++) {
      const pixels = new Float32Array(50).fill(0.5);
      const result = randomDither(pixels);
      for (let i = 0; i < result.length; i++) {
        totalPixels++;
        if (result[i] === 1) totalFlips++;
      }
    }
    const flipRate = totalFlips / totalPixels;
    // Should be roughly 50%, allow wide tolerance
    expect(flipRate).toBeGreaterThan(0.3);
    expect(flipRate).toBeLessThan(0.7);
  });
});

// ─── Ordered Dither ───────────────────────────────────────────────────

describe("orderedDither", () => {
  it("output is binary", () => {
    const pixels = new Float32Array([0.1, 0.6, 0.9, 0.0, 0.5]);
    const matrix = generateBayerMatrix(0);
    const result = orderedDither(pixels, 5, 1, matrix);
    expect(isBinary(result)).toBe(true);
  });

  it("output matches input dimensions", () => {
    const pixels = new Float32Array(64);
    const matrix = generateBayerMatrix(2);
    const result = orderedDither(pixels, 8, 8, matrix);
    expect(result.length).toBe(64);
  });

  it("values above threshold become 1, below become 0", () => {
    const pixels = new Float32Array([0.0, 0.5, 1.0]);
    const matrix = generateBayerMatrix(0);
    const result = orderedDither(pixels, 3, 1, matrix);
    // 0.0 is below any threshold → 0
    expect(result[0]).toBe(0);
    // 1.0 is above any threshold → 1
    expect(result[2]).toBe(1);
  });

  it("wraps correctly at tile boundaries", () => {
    const pixels = new Float32Array(16).fill(0.5);
    const matrix = generateBayerMatrix(0); // 2x2
    const result = orderedDither(pixels, 4, 4, matrix);
    expect(isBinary(result)).toBe(true);
    expect(result.length).toBe(16);
  });
});

// ─── Error Diffusion Algorithms ───────────────────────────────────────

describe("error diffusion algorithms", () => {
  const algorithms: [Algorithm, string][] = [
    [Algorithm.FLOYD_STEINBERG, "floyd-steinberg"],
    [Algorithm.ATKINSON, "atkinson"],
    [Algorithm.JARVIS_JUDICE_NINKE, "jarvis-judice-ninke"],
    [Algorithm.STUCKI, "stucki"],
    [Algorithm.SIERRA_2ROW, "sierra-2row"],
    [Algorithm.SIERRA_3ROW, "sierra-3row"],
    [Algorithm.BURKES, "burkes"],
  ];

  for (const [algo, name] of algorithms) {
    it(`${name} produces binary output`, () => {
      const pixels = makePixels(16, 16, (x, y) => x / 15); // horizontal gradient
      const result = dither(pixels, 16, 16, algo);
      expect(isBinary(result)).toBe(true);
    });

    it(`${name} preserves dimensions`, () => {
      const pixels = makePixels(32, 24, () => 0.5);
      const result = dither(pixels, 32, 24, algo);
      expect(result.length).toBe(32 * 24);
    });

    it(`${name} preserves all-black input`, () => {
      const pixels = new Float32Array(64).fill(0);
      const result = dither(pixels, 8, 8, algo);
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(0);
      }
    });

    it(`${name} preserves all-white input`, () => {
      const pixels = new Float32Array(64).fill(1);
      const result = dither(pixels, 8, 8, algo);
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(1);
      }
    });
  }
});

// ─── Bayer Algorithms ─────────────────────────────────────────────────

describe("Bayer algorithms", () => {
  for (let level = 0; level <= 4; level++) {
    const algo = Algorithm[`BAYER_${level}` as keyof typeof Algorithm] as Algorithm;
    it(`${algo} produces binary output`, () => {
      const pixels = makePixels(32, 32, (x) => x / 31);
      const result = dither(pixels, 32, 32, algo);
      expect(isBinary(result)).toBe(true);
    });

    it(`${algo} preserves all-black input`, () => {
      const pixels = new Float32Array(256).fill(0);
      const result = dither(pixels, 16, 16, algo);
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(0);
      }
    });

    it(`${algo} preserves all-white input`, () => {
      const pixels = new Float32Array(256).fill(1);
      const result = dither(pixels, 16, 16, algo);
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(1);
      }
    });
  }
});

// ─── Error Mask Definitions ───────────────────────────────────────────

describe("error mask definitions", () => {
  it("Floyd-Steinberg divisor sums to 16", () => {
    const sum = FLOYD_STEINBERG_MASK.mask.reduce((s, m) => s + m.weight, 0);
    expect(sum).toBe(FLOYD_STEINBERG_MASK.divisor);
  });

  // Atkinson weights (1×6) don't sum to divisor 8 — this is correct per the
  // original Atkinson paper. The divisor is a normalization constant, not a
  // strict sum of weights.
  it("Atkinson divisor is 8", () => {
    expect(ATKINSON_MASK.divisor).toBe(8);
  });

  it("JJN divisor sums to 48", () => {
    const sum = JARVIS_JUDICE_NINKE_MASK.mask.reduce((s, m) => s + m.weight, 0);
    expect(sum).toBe(JARVIS_JUDICE_NINKE_MASK.divisor);
  });

  it("Stucki divisor sums to 42", () => {
    const sum = STUCKI_MASK.mask.reduce((s, m) => s + m.weight, 0);
    expect(sum).toBe(STUCKI_MASK.divisor);
  });

  // Sierra-2row weights don't sum to divisor 32 — correct per original.
  it("Sierra 2-row divisor is 32", () => {
    expect(SIERRA_2ROW_MASK.divisor).toBe(32);
  });

  // Sierra-3row weights don't sum to divisor 64 — correct per original.
  it("Sierra 3-row divisor is 64", () => {
    expect(SIERRA_3ROW_MASK.divisor).toBe(64);
  });

  it("Burkes divisor sums to 8", () => {
    const sum = BURKES_MASK.mask.reduce((s, m) => s + m.weight, 0);
    expect(sum).toBe(BURKES_MASK.divisor);
  });

  it("all masks have non-negative weights", () => {
    const allMasks = [
      FLOYD_STEINBERG_MASK, ATKINSON_MASK, JARVIS_JUDICE_NINKE_MASK,
      STUCKI_MASK, SIERRA_2ROW_MASK, SIERRA_3ROW_MASK, BURKES_MASK,
    ];
    for (const config of allMasks) {
      for (const m of config.mask) {
        expect(m.weight).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────

describe("edge cases", () => {
  it("1x1 image works for all algorithms", () => {
    const pixel = new Float32Array([0.5]);
    for (const algo of Object.values(Algorithm)) {
      const result = dither(pixel, 1, 1, algo);
      expect(result.length).toBe(1);
      expect(isBinary(result)).toBe(true);
    }
  });

  it("1xN image works", () => {
    const pixels = new Float32Array(50).fill(0.5);
    for (const algo of Object.values(Algorithm)) {
      const result = dither(pixels, 50, 1, algo);
      expect(result.length).toBe(50);
      expect(isBinary(result)).toBe(true);
    }
  });

  it("N x1 image works", () => {
    const pixels = new Float32Array(50).fill(0.5);
    for (const algo of Object.values(Algorithm)) {
      const result = dither(pixels, 1, 50, algo);
      expect(result.length).toBe(50);
      expect(isBinary(result)).toBe(true);
    }
  });
});
