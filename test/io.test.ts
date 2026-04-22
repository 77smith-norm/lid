import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { parseArgs, run, type CliResult, type CliOptions } from "../src/io.js";
import { Algorithm } from "../src/dither.js";
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─── Helpers ──────────────────────────────────────────────────────────

function makeMinimalPng(path: string): void {
  const { writePng } = require("../src/png.js");
  const pixels = new Uint8Array([
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
  ]);
  writePng(pixels, 2, 2, path);
}

function mktempPng(): string {
  const dir = mkdtempSync(join(tmpdir(), "lid-test-"));
  const path = join(dir, "test.png");
  makeMinimalPng(path);
  return path;
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

// ─── parseArgs: --help ───────────────────────────────────────────────

describe("parseArgs: --help", () => {
  it("prints help text on --help", () => {
    let exited = false;
    const originalExit = process.exit;
    process.exit = (() => { exited = true; }) as never;
    try {
      parseArgs(["node", "index.ts", "--help"]);
    } catch { /* ignore */ }
    process.exit = originalExit;
    expect(exited).toBe(true);
  });

  it("prints help text on -h", () => {
    let exited = false;
    const originalExit = process.exit;
    process.exit = (() => { exited = true; }) as never;
    try {
      parseArgs(["node", "index.ts", "-h"]);
    } catch { /* ignore */ }
    process.exit = originalExit;
    expect(exited).toBe(true);
  });
});

// ─── parseArgs: flags ─────────────────────────────────────────────────

describe("parseArgs: flags", () => {
  let tmpDir: string;
  let input: string;

  beforeAll(() => {
    tmpDir = mktempPng();
    input = join(tmpDir, "test.png");
  });

  afterAll(() => cleanup(tmpDir));

  it("defaults to floyd-steinberg", () => {
    const opts = parseArgs(["node", "index.ts", input]);
    expect(opts.algorithm).toBe(Algorithm.FLOYD_STEINBERG);
  });

  it("parses -o / --output", () => {
    const opts = parseArgs(["node", "index.ts", input, "-o", "custom.png"]);
    expect(opts.output).toBe("custom.png");
  });

  it("parses -a / --algorithm", () => {
    const opts = parseArgs(["node", "index.ts", input, "-a", "atkinson"]);
    expect(opts.algorithm).toBe(Algorithm.ATKINSON);
  });

  it("parses --json", () => {
    const opts = parseArgs(["node", "index.ts", input, "--json"]);
    expect(opts.json).toBe(true);
  });

  it("parses --dry-run", () => {
    const opts = parseArgs(["node", "index.ts", input, "--dry-run"]);
    expect(opts.dryRun).toBe(true);
  });

  it("combines all flags", () => {
    const opts = parseArgs([
      "node", "index.ts", input,
      "-o", "out.png",
      "-a", "bayer-2",
      "--json",
      "--dry-run",
    ]);
    expect(opts.input).toBe(input);
    expect(opts.output).toBe("out.png");
    expect(opts.algorithm).toBe(Algorithm.BAYER_2);
    expect(opts.json).toBe(true);
    expect(opts.dryRun).toBe(true);
  });

  it("auto-generates output filename", () => {
    const opts = parseArgs(["node", "index.ts", input]);
    expect(opts.output).toBe(input.replace(/\.[^.]+$/, "") + "-dithered.png");
  });

  it("rejects unknown algorithm", () => {
    let exited = false;
    const originalExit = process.exit;
    process.exit = (() => { exited = true; }) as never;
    try {
      parseArgs(["node", "index.ts", input, "-a", "bogus"]);
    } catch { /* ignore */ }
    process.exit = originalExit;
    expect(exited).toBe(true);
  });
});

// ─── parseArgs: missing input ─────────────────────────────────────────

describe("parseArgs: missing input", () => {
  it("exits with code 1 when no input provided", () => {
    let exited = false;
    const originalExit = process.exit;
    process.exit = (() => { exited = true; }) as never;
    try {
      parseArgs(["node", "index.ts"]);
    } catch { /* ignore */ }
    process.exit = originalExit;
    expect(exited).toBe(true);
  });
});

// ─── run: --json output ───────────────────────────────────────────────

describe("run: --json output", () => {
  let tmpDir: string;
  let input: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "lid-test-json-"));
    input = join(tmpDir, "test.png");
    makeMinimalPng(input);
  });

  afterAll(() => cleanup(tmpDir));

  it("outputs valid JSON with all fields", async () => {
    const result = await run(["node", "index.ts", input, "--json"]);

    expect(result.success).toBe(true);
    expect(result.input).toBe(input);
    expect(result.output).toMatch(/test-dithered\.png$/);
    expect(result.algorithm).toBe(Algorithm.FLOYD_STEINBERG);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.pixelCount).toBe(4);
    expect(result.elapsedMs).toBeGreaterThan(0);
  });

  it("outputs correct algorithm name", async () => {
    const output = join(tmpDir, "out.png");
    const result = await run(["node", "index.ts", input, "-a", "bayer-3", "-o", output, "--json"]);
    expect(result.algorithm).toBe(Algorithm.BAYER_3);
  });

  it("outputs correct output path", async () => {
    const expectedOutput = join(tmpDir, "custom.png");
    const result = await run(["node", "index.ts", input, "-o", expectedOutput, "--json"]);
    expect(result.output).toBe(expectedOutput);
  });
});

// ─── run: --dry-run ───────────────────────────────────────────────────

describe("run: --dry-run", () => {
  let tmpDir: string;
  let input: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "lid-test-dry-"));
    input = join(tmpDir, "test.png");
    makeMinimalPng(input);
  });

  afterAll(() => cleanup(tmpDir));

  it("does not write output file", async () => {
    const expectedOutput = join(tmpDir, "out.png");
    const result = await run(["node", "index.ts", input, "-o", expectedOutput, "--dry-run"]);

    expect(result.success).toBe(true);
    expect(result.output).toBe(expectedOutput);

    // Verify file was not created
    let exists = false;
    try {
      readFileSync(expectedOutput);
      exists = true;
    } catch {
      // File doesn't exist — that's what we want
    }
    expect(exists).toBe(false);
  });
});

// ─── run: success ─────────────────────────────────────────────────────

describe("run: success", () => {
  let tmpDir: string;
  let input: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "lid-test-write-"));
    input = join(tmpDir, "test.png");
    makeMinimalPng(input);
  });

  afterAll(() => cleanup(tmpDir));

  it("writes output file", async () => {
    const output = join(tmpDir, "out.png");
    await run(["node", "index.ts", input, "-o", output]);

    expect(readFileSync(output)).toBeDefined();
  });

  it("returns CliResult with success=true", async () => {
    const output = join(tmpDir, "out.png");
    const result = await run(["node", "index.ts", input, "-o", output]);

    expect(result.success).toBe(true);
    expect(result.input).toBe(input);
    expect(result.output).toBe(output);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.pixelCount).toBe(4);
  });

  it("produces binary output for all algorithms", async () => {
    for (const algo of Object.values(Algorithm)) {
      const output = join(tmpDir, `out-${algo}.png`);
      const result = await run(["node", "index.ts", input, "-o", output, "-a", algo]);
      expect(result.success).toBe(true);
    }
  });
});
