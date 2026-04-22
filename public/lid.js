// src/dither.ts
var Algorithm = /* @__PURE__ */ ((Algorithm3) => {
  Algorithm3["RANDOM"] = "random";
  Algorithm3["BAYER_0"] = "bayer-0";
  Algorithm3["BAYER_1"] = "bayer-1";
  Algorithm3["BAYER_2"] = "bayer-2";
  Algorithm3["BAYER_3"] = "bayer-3";
  Algorithm3["BAYER_4"] = "bayer-4";
  Algorithm3["FLOYD_STEINBERG"] = "floyd-steinberg";
  Algorithm3["ATKINSON"] = "atkinson";
  Algorithm3["JARVIS_JUDICE_NINKE"] = "jarvis-judice-ninke";
  Algorithm3["STUCKI"] = "stucki";
  Algorithm3["SIERRA_2ROW"] = "sierra-2row";
  Algorithm3["SIERRA_3ROW"] = "sierra-3row";
  Algorithm3["BURKES"] = "burkes";
  return Algorithm3;
})(Algorithm || {});
var ALGORITHM_NAMES = Object.values(Algorithm);
var GAMMA = 2.4;
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, GAMMA);
}
function linearToSrgb(c) {
  return c <= 31308e-7 ? 12.92 * c : 1.055 * Math.pow(c, 1 / GAMMA) - 0.055;
}
function toLinearGray(pixels) {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = srgbToLinear(pixels[i]);
  }
  return out;
}
function toSrgbGray(pixels) {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = linearToSrgb(pixels[i]);
  }
  return out;
}
function generateBayerMatrix(level) {
  const size = 1 << level + 1;
  const total = size * size;
  const data = new Float32Array(total);
  function build(n) {
    if (n === 0) return [[0, 2], [3, 1]];
    const prev = build(n - 1);
    const s = prev.length * 2;
    const result = [];
    for (let r = 0; r < s; r++) {
      const row = [];
      for (let c = 0; c < s; c++) {
        const pr = Math.floor(r / 2);
        const pc = Math.floor(c / 2);
        const quadrant = r % 2 * 2 + c % 2;
        row.push(prev[pr][pc] * 4 + quadrant);
      }
      result.push(row);
    }
    return result;
  }
  const matrix = build(level);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      data[r * size + c] = matrix[r][c] / total;
    }
  }
  return { size, data: Array.from(data) };
}
var FLOYD_STEINBERG_MASK = {
  divisor: 16,
  mask: [
    { dx: 1, dy: 0, weight: 7 },
    { dx: -1, dy: 1, weight: 3 },
    { dx: 0, dy: 1, weight: 5 },
    { dx: 1, dy: 1, weight: 1 }
  ]
};
var ATKINSON_MASK = {
  divisor: 8,
  mask: [
    { dx: 0, dy: 1, weight: 1 },
    { dx: 1, dy: 1, weight: 1 },
    { dx: -2, dy: 2, weight: 1 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 1 },
    { dx: 1, dy: 2, weight: 1 }
  ]
};
var JARVIS_JUDICE_NINKE_MASK = {
  divisor: 48,
  mask: [
    { dx: 1, dy: 0, weight: 7 },
    { dx: 2, dy: 0, weight: 5 },
    { dx: -2, dy: 1, weight: 3 },
    { dx: -1, dy: 1, weight: 5 },
    { dx: 0, dy: 1, weight: 7 },
    { dx: 1, dy: 1, weight: 5 },
    { dx: 2, dy: 1, weight: 3 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 3 },
    { dx: 1, dy: 2, weight: 5 },
    { dx: 2, dy: 2, weight: 3 },
    { dx: 3, dy: 2, weight: 1 }
  ]
};
var STUCKI_MASK = {
  divisor: 42,
  mask: [
    { dx: 1, dy: 0, weight: 8 },
    { dx: 2, dy: 0, weight: 4 },
    { dx: -2, dy: 1, weight: 2 },
    { dx: -1, dy: 1, weight: 4 },
    { dx: 0, dy: 1, weight: 8 },
    { dx: 1, dy: 1, weight: 4 },
    { dx: 2, dy: 1, weight: 2 },
    { dx: -1, dy: 2, weight: 1 },
    { dx: 0, dy: 2, weight: 2 },
    { dx: 1, dy: 2, weight: 4 },
    { dx: 2, dy: 2, weight: 2 },
    { dx: 3, dy: 2, weight: 1 }
  ]
};
var SIERRA_2ROW_MASK = {
  divisor: 32,
  mask: [
    { dx: 1, dy: 0, weight: 5 },
    { dx: 2, dy: 0, weight: 3 },
    { dx: -2, dy: 1, weight: 2 },
    { dx: -1, dy: 1, weight: 4 },
    { dx: 0, dy: 1, weight: 5 },
    { dx: 1, dy: 1, weight: 4 },
    { dx: 2, dy: 1, weight: 2 },
    { dx: 3, dy: 1, weight: 1 },
    { dx: 4, dy: 1, weight: 1 }
  ]
};
var SIERRA_3ROW_MASK = {
  divisor: 64,
  mask: [
    { dx: 1, dy: 0, weight: 5 },
    { dx: 2, dy: 0, weight: 3 },
    { dx: -3, dy: 1, weight: 2 },
    { dx: -2, dy: 1, weight: 4 },
    { dx: -1, dy: 1, weight: 5 },
    { dx: 0, dy: 1, weight: 6 },
    { dx: 1, dy: 1, weight: 5 },
    { dx: 2, dy: 1, weight: 4 },
    { dx: 3, dy: 1, weight: 2 },
    { dx: -2, dy: 2, weight: 1 },
    { dx: -1, dy: 2, weight: 2 },
    { dx: 0, dy: 2, weight: 3 },
    { dx: 1, dy: 2, weight: 2 },
    { dx: 2, dy: 2, weight: 1 }
  ]
};
var BURKES_MASK = {
  divisor: 8,
  mask: [
    { dx: 1, dy: 0, weight: 1 },
    { dx: 2, dy: 0, weight: 1 },
    { dx: -2, dy: 1, weight: 1 },
    { dx: -1, dy: 1, weight: 2 },
    { dx: 0, dy: 1, weight: 2 },
    { dx: 1, dy: 1, weight: 1 }
  ]
};
function quantize(value) {
  return value > 0.5 ? 1 : 0;
}
function randomDither(pixels) {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = quantize(pixels[i] + Math.random() - 0.5);
  }
  return out;
}
function orderedDither(pixels, widthOrMatrix, height, matrix) {
  if (typeof widthOrMatrix === "object") {
    const m2 = widthOrMatrix;
    const w2 = Math.sqrt(pixels.length) | 0;
    return orderedDither(pixels, w2, w2, m2);
  }
  const w = widthOrMatrix;
  const h = height;
  const m = matrix;
  const out = new Float32Array(pixels.length);
  const { size, data } = m;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const mx = x % size;
      const my = y % size;
      const threshold = data[my * size + mx];
      out[idx] = pixels[idx] > threshold ? 1 : 0;
    }
  }
  return out;
}
function dither(pixels, width, height, algorithm) {
  switch (algorithm) {
    case "random" /* RANDOM */:
      return randomDither(pixels);
    case "bayer-0" /* BAYER_0 */:
    case "bayer-1" /* BAYER_1 */:
    case "bayer-2" /* BAYER_2 */:
    case "bayer-3" /* BAYER_3 */:
    case "bayer-4" /* BAYER_4 */: {
      const level = parseInt(algorithm.replace("bayer-", ""), 10);
      const matrix = generateBayerMatrix(level);
      return orderedDither(pixels, width, height, matrix);
    }
    case "floyd-steinberg" /* FLOYD_STEINBERG */:
      return errorDiffuse(pixels, width, height, FLOYD_STEINBERG_MASK);
    case "atkinson" /* ATKINSON */:
      return errorDiffuse(pixels, width, height, ATKINSON_MASK);
    case "jarvis-judice-ninke" /* JARVIS_JUDICE_NINKE */:
      return errorDiffuse(pixels, width, height, JARVIS_JUDICE_NINKE_MASK);
    case "stucki" /* STUCKI */:
      return errorDiffuse(pixels, width, height, STUCKI_MASK);
    case "sierra-2row" /* SIERRA_2ROW */:
      return errorDiffuse(pixels, width, height, SIERRA_2ROW_MASK);
    case "sierra-3row" /* SIERRA_3ROW */:
      return errorDiffuse(pixels, width, height, SIERRA_3ROW_MASK);
    case "burkes" /* BURKES */:
      return errorDiffuse(pixels, width, height, BURKES_MASK);
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}
function errorDiffuse(pixels, width, height, config) {
  const out = new Float32Array(pixels);
  const { mask, divisor } = config;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const old = out[idx];
      const nearest = quantize(old);
      const error = old - nearest;
      out[idx] = nearest;
      for (const { dx, dy, weight } of mask) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          out[ny * width + nx] += error * weight / divisor;
        }
      }
    }
  }
  return out;
}
function rgbToGray(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// src/browser.ts
function loadImageFile(file) {
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
function applyDither(gray, width, height, algorithm) {
  const dithered = dither(gray, width, height, algorithm);
  const srgb = new Float32Array(dithered.length);
  for (let i = 0; i < dithered.length; i++) {
    srgb[i] = linearToSrgb(dithered[i]);
  }
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
function renderToCanvas(canvas, pixels, width, height) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
}
function downloadDithered(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
export {
  ALGORITHM_NAMES,
  ATKINSON_MASK,
  Algorithm,
  BURKES_MASK,
  FLOYD_STEINBERG_MASK,
  JARVIS_JUDICE_NINKE_MASK,
  SIERRA_2ROW_MASK,
  SIERRA_3ROW_MASK,
  STUCKI_MASK,
  applyDither,
  dither,
  downloadDithered,
  generateBayerMatrix,
  linearToSrgb,
  loadImageFile,
  orderedDither,
  randomDither,
  renderToCanvas,
  rgbToGray,
  srgbToLinear,
  toLinearGray,
  toSrgbGray
};
//# sourceMappingURL=lid.js.map
