import { PNG } from "pngjs";
import { readFileSync } from "fs";

// Read a PNG file and return RGBA pixels as [0-255] Uint8Array
export function readPng(path: string): {
  pixels: Uint8Array;
  width: number;
  height: number;
} {
  const buffer = readFileSync(path);
  const png = PNG.sync.read(buffer);
  const pixels = new Uint8Array(png.width * png.height * 4);

  for (let i = 0; i < png.width * png.height; i++) {
    pixels[i * 4] = png.data[i * 4];
    pixels[i * 4 + 1] = png.data[i * 4 + 1];
    pixels[i * 4 + 2] = png.data[i * 4 + 2];
    pixels[i * 4 + 3] = png.data[i * 4 + 3];
  }

  return { pixels, width: png.width, height: png.height };
}

// Write a grayscale Uint8Array [0-255] to a PNG file
export function writePng(
  pixels: Uint8Array,
  width: number,
  height: number,
  outputPath: string,
): void {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  const buffer = PNG.sync.write(png);
  Bun.write(outputPath, buffer);
}
