# Plan: lid Project Setup

**Goal:** Bring lid (Lo-fi Image Dithering) up to project standards — AGENTS.md, proper test harness, docs scaffolding.

**Status: IN PROGRESS — 2026-04-21**

## Context

lid is a TypeScript/Bun library and CLI for image dithering. It implements eleven dithering algorithms (Floyd-Steinberg, Atkinson, Bayer levels 0–4, Stucki, JJN, Sierra 2/3-row + Lite, Burkes, random) with gamma-correct sRGB processing.

Built 2026-04-20. Core library is complete and functional. Missing: AGENTS.md, test harness, docs/, proper project scaffolding.

## Architecture

```
lid/
├── src/
│   ├── dither.ts   — All dithering algorithms, sRGB/linear conversion, threshold/error matrices
│   ├── io.ts       — Image I/O (load/save), CLI argument parsing, run() entry point
│   └── png.ts      — PNG read/write via pngjs
├── test/
│   ├── gradient.png — Test input image
│   └── *.png        — Algorithm output samples
├── index.ts        — CLI entry: runs io.run(process.argv)
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md
```

**Key types:**
- `Algorithm` enum — all algorithm names
- `ImageData` — `{ pixels: Float32Array, width, height }`
- `ErrorDiffusionConfig` — `{ mask, divisor }`
- `ThresholdMatrix` — `{ size, data }`

**Build/test:** `bun test`

## Steps

### 1. AGENTS.md
- Project overview, stack, build/test commands
- TCR rules (commit green before refactor)
- Compaction recovery steps
- Link to ../refs/DEVELOPMENT.md for full harness guidance
- Keep lean (< 200 lines)

### 2. Test Harness
- `test/dither.test.ts` — unit tests for each algorithm
- Test each algorithm produces valid output:
  - Output pixels are strictly 0 or 1 (binary)
  - Output dimensions match input
  - Known input (all-white, all-black, gradient) produces expected output
- Use `bun test` (Bun 1.3.11; note v1.3.13 adds `--isolate`, `--parallel`, `--shard`, `--changed`)
- Test file naming: `*.test.ts`

### 3. Docs
- `docs/` directory created (this file)
- Future plan files go here

### 4. Git
- Commit all changes with descriptive message
- Push to origin

## Validation

- `bun test` — all tests pass
- `bun run index.ts test/gradient.png -o /tmp/test-output.png -a floyd-steinberg` — CLI works
- `cat AGENTS.md | wc -l` — under 200 lines
