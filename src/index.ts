// lid — Lo-fi Image Dithering library for the browser.
// Re-exports all dithering algorithms and browser I/O helpers.

export {
  Algorithm,
  ALGORITHM_NAMES,
  DEFAULT_PALETTE_SIZE,
  DEFAULT_SHUFFLE_SEED,
  dither,
  randomDither,
  orderedDither,
  shuffledBayerOKM,
  shuffledBayerTraversal,
  maximinInit,
  generateBayerMatrix,
  srgbToLinear,
  linearToSrgb,
  toLinearGray,
  toSrgbGray,
  rgbToGray,
  FLOYD_STEINBERG_MASK,
  ATKINSON_MASK,
  JARVIS_JUDICE_NINKE_MASK,
  STUCKI_MASK,
  SIERRA_2ROW_MASK,
  SIERRA_3ROW_MASK,
  BURKES_MASK,
  type DitherOptions,
  type ErrorMask,
  type ErrorDiffusionConfig,
  type ThresholdMatrix,
  type ImageData,
} from "./dither.js";

export {
  loadImageFile,
  applyDither,
  renderToCanvas,
  downloadDithered,
  type BrowserImageData,
} from "./browser.js";
