import {
  Algorithm,
  ALGORITHM_NAMES,
  DEFAULT_PALETTE_SIZE,
  dither,
  type ImageData,
} from "./dither.js";
import { readPng, writePng } from "./png.js";

// ─── Types ─────────────────────────────────────────────────────────────

export interface CliResult {
  success: boolean;
  input: string;
  output: string;
  algorithm: string;
  width: number;
  height: number;
  pixelCount: number;
  elapsedMs: number;
}

// ─── Image I/O ───────────────────────────────────────────────────────

export function loadImage(path: string): ImageData {
  const { pixels, width, height } = readPng(path);

  // sRGB → linear grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    const lr = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const lg = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const lb = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    gray[i] = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  }

  return { pixels: gray, width, height };
}

export function saveImage(
  pixels: Float32Array,
  width: number,
  height: number,
  outputPath: string,
): void {
  // Linear → sRGB grayscale
  const out = new Uint8Array(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    const c = pixels[i];
    const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    const v = Math.max(0, Math.min(255, Math.round(srgb * 255)));
    out[i * 4] = v;
    out[i * 4 + 1] = v;
    out[i * 4 + 2] = v;
    out[i * 4 + 3] = 255;
  }

  writePng(out, width, height, outputPath);
}

// ─── CLI ─────────────────────────────────────────────────────────────

export interface CliOptions {
  input: string;
  output: string;
  algorithm: Algorithm;
  paletteSize: number;
  json: boolean;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  let input = "";
  let output = "";
  let algorithm = Algorithm.FLOYD_STEINBERG;
  let paletteSize = DEFAULT_PALETTE_SIZE;
  let json = false;
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      case "-o":
      case "--output":
        output = argv[++i];
        break;
      case "-a":
      case "--algorithm": {
        const name = argv[++i].toLowerCase();
        const found = ALGORITHM_NAMES.find(
          (a) => a.replace(/-/g, "_").toLowerCase() === name.replace(/-/g, "_"),
        );
        if (!found) {
          console.error(
            `Unknown algorithm: ${argv[i]}\nAvailable: ${ALGORITHM_NAMES.join(", ")}`,
          );
          process.exit(1);
        }
        algorithm = found;
        break;
      }
      case "--palette-size": {
        const value = Number.parseInt(argv[++i], 10);
        if (!Number.isInteger(value) || value < 1) {
          console.error("Palette size must be a positive integer.");
          process.exit(1);
        }
        paletteSize = value;
        break;
      }
      case "--json":
        json = true;
        break;
      case "--dry-run":
        dryRun = true;
        break;
      default:
        if (!input) input = argv[i];
    }
  }

  if (!input) {
    printHelp();
    process.exit(1);
  }

  if (!output) {
    const ext = input.replace(/\.[^.]+$/, "");
    output = `${ext}-dithered.png`;
  }

  return { input, output, algorithm, paletteSize, json, dryRun };
}

function printHelp(): void {
  console.log("Usage: lid <input.png> [options]");
  console.log("");
  console.log("Options:");
  console.log("  -o, --output <file>     Output file (default: <input>-dithered.png)");
  console.log("  -a, --algorithm <name>  Dithering algorithm (default: floyd-steinberg)");
  console.log(`      --palette-size <n>   Palette size for shuffled Bayer OKM (default: ${DEFAULT_PALETTE_SIZE})`);
  console.log(`  Available: ${ALGORITHM_NAMES.join(", ")}`);
  console.log("      --json               Machine-parseable JSON output");
  console.log("      --dry-run            Validate inputs without writing output");
  console.log("  -h, --help               Show this help");
}

export async function run(argv: string[]): Promise<CliResult> {
  const { input, output, algorithm, paletteSize, json, dryRun } = parseArgs(argv);

  const start = performance.now();

  const img = loadImage(input);
  const result = dither(img.pixels, img.width, img.height, algorithm, { paletteSize });

  if (!dryRun) {
    saveImage(result, img.width, img.height, output);
  }

  const elapsed = performance.now() - start;

  const cliResult: CliResult = {
    success: true,
    input,
    output,
    algorithm,
    width: img.width,
    height: img.height,
    pixelCount: img.pixels.length,
    elapsedMs: Math.round(elapsed),
  };

  if (json) {
    console.log(JSON.stringify(cliResult, null, 2));
  } else {
    console.log(`Loading: ${input}`);
    console.log(`  ${img.width}×${img.height}, ${img.pixels.length} pixels`);
    console.log(`Dithering with ${algorithm}...`);
    if (dryRun) {
      console.log(`Dry run — output would be: ${output}`);
    } else {
      console.log(`Saving: ${output}`);
    }
    console.log(`Done in ${Math.round(elapsed)}ms.`);
  }

  return cliResult;
}
