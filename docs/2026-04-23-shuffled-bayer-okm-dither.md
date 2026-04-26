# Plan: Shuffled Bayer Online K-Means Dithering

**Goal:** Add `SHUFFLED_BAYER_2` and `SHUFFLED_BAYER_4` dithering algorithms to lid, inspired by Pekka Väänänen's "Single-pass palette refinement and order dithering" (2026-04-23).

**Status: COMPLETED — 2026-04-25**

## Context

Pekka's article demonstrates a novel approach: reinterpret Bayer threshold matrices as *pixel processing orders* rather than static thresholds, then run online k-means (OKM) color quantization in that order, capturing the intermediate palette indices (before final Euclidean mapping) as the output image. The shuffle — randomizing pixel order *within* each matrix element's block — produces a clean ordered dither pattern with natural palette refinement.

This is fundamentally different from our existing algorithms:
- **Threshold-based** (BAYER_0–4): Static matrix, pixel-by-pixel comparison
- **Error diffusion** (Floyd-Steinberg, Atkinson, etc.): Propagate quantization error to neighbors
- **Shuffled Bayer OKM**: Stateful palette that evolves per-pixel, Bayer-driven traversal, no error propagation

## Algorithm Overview

### Core Idea

1. **Initialize palette** using maximin (deterministic maximin k-means initialization) — pick K colors spread across the input color space.
2. **Traverse pixels** in shuffled Bayer order:
   - For each matrix element (e.g., 4 values in 2x2, 16 values in 4x4), collect all pixels at that offset position across the image.
   - Shuffle those pixels randomly.
   - Process them in that shuffled order.
3. **For each pixel:**
   - Find the nearest palette color (by Euclidean distance in sRGB space).
   - Record the palette index as the output pixel value.
   - **Nudge** the palette color toward the original pixel color (online k-means update step).
4. **Output:** The sequence of palette indices, mapped to the final palette colors.

### Key Differences from Pekka's Implementation

| Aspect | Pekka | lid plan |
|--------|-------|----------|
| Language | Python (NumPy) | TypeScript |
| Palette init | Maximin | Existing maximin or k-means++ |
| Distance metric | Euclidean in RGB | Euclidean in sRGB (gamma-correct) |
| Output | Palette indices → colors | Same, but output as binary (0/1 per channel) or palette-index image |
| Color depth | Arbitrary K | Configurable (default 16 or 32) |

## Implementation Plan

### 1. Core Algorithm (`src/dither.ts`)

Add two new enum values:
```typescript
export enum Algorithm {
  // ... existing algorithms ...
  SHUFFLED_BAYER_2 = 'shuffled-bayer-2',
  SHUFFLED_BAYER_4 = 'shuffled-bayer-4',
}
```

Add implementation function:
```typescript
export function shuffledBayerOKM(
  image: ImageData,
  paletteSize: number,
  matrixSize: 2 | 4,
  seed?: number
): Uint8Array
```

**Sub-steps:**
1. **Maximin palette initialization** — implement `maximinInit(pixels, K)` using sRGB distances.
2. **Bayer matrix generation** — reuse existing Bayer matrix logic but interpret values as traversal order (1..N) rather than thresholds.
3. **Shuffled traversal generator** — yield pixels in shuffled Bayer order (collect-then-shuffle per matrix element, as Pekka describes).
4. **Online k-means loop** — for each pixel: find nearest palette color, record index, nudge palette color toward original.
5. **Output mapping** — map final palette indices to binary output (0/1 per channel) using the final palette.

### 2. Bayer Matrix as Traversal Order

Our existing Bayer matrices store threshold values. For this algorithm, we reinterpret them:

**2x2 matrix (existing):**
```
0  2
3  1
```

**As traversal order (renumber 1-indexed):**
```
1  3
4  2
```

**4x4 matrix (existing):**
```
 0  8  2 10
12  4 14  6
 3 11  1  9
15  7 13  5
```

**As traversal order (renumber 1-indexed):**
```
 1  9  3 11
13  5 15  7
 4 12  2 10
16  8 14  6
```

The values are already in the correct order — they just need to be re-indexed from 0-based thresholds to 1-based traversal sequence.

### 3. Shuffled Traversal Generator

```typescript
function* shuffledBayerTraversal(
  width: number,
  height: number,
  matrix: number[][],
  seed: number
): Generator<[x: number, y: number]> {
  const size = matrix.length;
  const blocksX = Math.floor(width / size);
  const blocksY = Math.floor(height / size);

  // Sort matrix values to get traversal order
  const sortedCells = matrix
    .flatMap((row, y) => row.map((val, x) => ({ val, x, y })))
    .sort((a, b) => a.val - b.val);

  for (const cell of sortedCells) {
    // Collect all pixels at this offset
    const pixels: [number, number][] = [];
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        const x = bx * size + cell.x;
        const y = by * size + cell.y;
        pixels.push([x, y]);
      }
    }
    // Shuffle pixels at this offset
    shuffle(pixels, seed);
    for (const [x, y] of pixels) {
      yield [x, y];
    }
  }
}
```

### 4. Online K-Means Update

```typescript
// After assigning pixel to nearest palette color at index `idx`:
const learningRate = 1.0 / (pixelIndex + 1); // MacQueen's OKM
for (let c = 0; c < 3; c++) {
  palette[idx][c] += learningRate * (originalPixel[c] - palette[idx][c]);
}
```

### 5. Output

The output is the sequence of palette indices. To produce a dithered image:
- Map each index to its final palette color.
- For binary output (matching existing lid behavior): quantize each channel of the final palette color to 0 or 1.

### 6. CLI Support

Add `--palette-size` flag (default 16):
```bash
bun run index.ts input.png -a shuffled-bayer-2 --palette-size 16 -o output.png
```

### 7. Tests

- `test/shuffled-bayer.test.ts` — unit tests for:
  - Palette initialization produces K distinct colors
  - Shuffled traversal visits all pixels exactly once
  - Output dimensions match input
  - Deterministic output with fixed seed
  - 2x2 vs 4x4 produce different patterns on same input
  - Known input (solid color) produces uniform output
- Generate output sample images for README

### 8. README

Add to algorithms list:
- `shuffled-bayer-2` — Shuffled Bayer 2×2 with online k-means palette refinement
- `shuffled-bayer-4` — Shuffled Bayer 4×4 with online k-means palette refinement

Link to Pekka's article as a reference.

## Dependencies

- No new dependencies. Pure TypeScript implementation.
- Reuses existing `shuffle` utility (if needed; may need to add one).
- Reuses existing sRGB gamma conversion.

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Performance — O(n) per-pixel palette nudge | Medium | OKM is inherently sequential; accept as trade-off for quality |
| Palette convergence — learning rate too aggressive | Medium | Use MacQueen's 1/(n+1) schedule; test with known inputs |
| Output quality on complex images | Low | Pekka's results are promising; validate with test images |
| Seed determinism | Low | Simple PRNG (mulberry32 or similar) |

## Validation

- `bun test` — all tests pass (existing + new)
- `bun run index.ts test/gradient.png -a shuffled-bayer-2 --palette-size 16 -o /tmp/shuffled-bayer-2.png` — CLI works
- Visual comparison against Pekka's sample outputs
- No regression in existing algorithm tests

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/dither.ts` | Add enum values, implementation function |
| `src/io.ts` | Add `--palette-size` CLI flag |
| `test/shuffled-bayer.test.ts` | Create — new test file |
| `test/shuffled-bayer-2.png` | Create — output sample |
| `test/shuffled-bayer-4.png` | Create — output sample |
| `README.md` | Update — add algorithms |
| `docs/2026-04-23-shuffled-bayer-okm-dither.md` | This file |

## References

- Pekka Väänänen, "Single-pass palette refinement and order dithering" (2026-04-23): https://30fps.net/pages/bayer-order-online-kmeans/
- MacQueen, "Some methods for classification and analysis of multivariate observations" (1967) — online k-means
- Tanner Helland, "Dithering: Eleven Algorithms Source Code" (2012) — Bayer matrix reference
- Pekka's reference paper: "Fast color quantization using MacQueen's k-means algorithm" (2019)
