import {
  Algorithm,
  ALGORITHM_NAMES,
  dither,
  type ImageData,
} from "./dither.js";
import { readPng, writePng } from "./png.js";

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

export function parseArgs(argv: string[]): {
  input: string;
  output: string;
  algorithm: Algorithm;
} {
  let input = "";
  let output = "";
  let algorithm = Algorithm.FLOYD_STEINBERG;

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
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
      default:
        if (!input) input = argv[i];
    }
  }

  if (!input) {
    console.error("Usage: lid <input.png> [-o <output.png>] [-a <algorithm>]");
    console.error(`Algorithms: ${ALGORITHM_NAMES.join(", ")}`);
    process.exit(1);
  }

  if (!output) {
    const ext = input.replace(/\.[^.]+$/, "");
    output = `${ext}-dithered.png`;
  }

  return { input, output, algorithm };
}

export async function run(argv: string[]): Promise<void> {
  const { input, output, algorithm } = parseArgs(argv);

  console.log(`Loading: ${input}`);
  const img = loadImage(input);
  console.log(`  ${img.width}×${img.height}, ${img.pixels.length} pixels`);

  console.log(`Dithering with ${algorithm}...`);
  const result = dither(img.pixels, img.width, img.height, algorithm);

  console.log(`Saving: ${output}`);
  saveImage(result, img.width, img.height, output);
  console.log("Done.");
}
