# AGENTS.md — lid (Lo-fi Image Dithering)

## Project

TypeScript/Bun library and CLI for image dithering. Eleven algorithms with gamma-correct sRGB processing.

## Stack

- **Runtime:** Bun (1.3.11+)
- **Language:** TypeScript (ESM)
- **Dependencies:** pngjs@7.0.0
- **Test:** `bun test`

## Structure

```
src/
  dither.ts — algorithms, sRGB/linear conversion, matrices
  io.ts     — image I/O, CLI parsing, run()
  png.ts    — PNG read/write
test/       — test images + test files
index.ts    — CLI entry
```

## Commands

```bash
bun test                          # run all tests
bun run index.ts input.png -o out.png -a floyd-steinberg
```

## TCR Rules

- Write failing test → implement minimally → commit green → refactor → commit
- One behavior per test. Tiny batches.
- A revert is signal, not failure.

## Compaction Recovery

When context compacts:
1. `cat docs/2026-04-21-lid-project-setup-plan.md`
2. `git log --oneline -20`
3. `bun test` — confirm green
4. Identify next incomplete plan step
5. Resume. Do not restart. Do not re-implement committed work.

## Full Harness

See `../../refs/DEVELOPMENT.md` for TCR+R, scan, close-out, and agent steering guidance.
