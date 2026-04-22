// Browser-compatible image I/O for lid dithering library.
// Uses Canvas API — no Node.js dependencies.

import {
  Algorithm,
  dither,
  rgbToGray,
  srgbToLinear,
  linearToSrgb,
  type ImageData as LidImageData,
} from "./dither.js";

export type { Algorithm, LidImageData };

export interface BrowserImageData {
  pixels: Float32Array;
  width: number;
  height: number;
}

/**
 * Load an image from a file (Blob/File) and return grayscale [0, 1] pixels.
 * Uses Canvas API to decode PNG/JPG.
 */
export function loadImageFile(file: File): Promise<BrowserImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context not available"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        URL.revokeObjectURL(url);

        const width = imageData.width;
        const height = imageData.height;
        const gray = new Float32Array(width * height);

        for (let i = 0; i < width * height; i++) {
          const r = imageData.data[i * 4] / 255;
          const g = imageData.data[i * 4 + 1] / 255;
          const b = imageData.data[i * 4 + 2] / 255;
          gray[i] = srgbToLinear(rgbToGray(r, g, b));
        }

        resolve({ pixels: gray, width, height });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Apply dithering to grayscale pixels and return sRGB ImageData for canvas rendering.
 */
export function applyDither(
  gray: Float32Array,
  width: number,
  height: number,
  algorithm: Algorithm,
): Uint8ClampedArray {
  const dithered = dither(gray, width, height, algorithm);

  // Convert [0,1] binary back to sRGB [0,255]
  const srgb = new Float32Array(dithered.length);
  for (let i = 0; i < dithered.length; i++) {
    srgb[i] = linearToSrgb(dithered[i]);
  }

  // Return as RGBA for canvas
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = Math.round(srgb[i] * 255);
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

/**
 * Render dithered pixels to a canvas element.
 */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Download dithered image as PNG.
 */
export function downloadDithered(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
