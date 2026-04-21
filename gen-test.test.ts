// Generate a test PNG image using pngjs
import { PNG } from "pngjs";

const W = 256;
const H = 256;
const png = new PNG({ width: W, height: H });

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;

    const grad = x / W;
    const diag = (x + y) / (W + H);

    // Circle
    const cx = x - W / 2;
    const cy = y - H / 2;
    const dist = Math.sqrt(cx * cx + cy * cy) / (W / 2);
    const circle = dist < 0.5 ? 1.0 : dist < 0.75 ? 0.5 : 0.0;

    let v = grad * 0.6 + circle * 0.4;

    // sRGB encoding
    const srgb = Math.pow(v, 1 / 2.2);
    const byte = Math.round(srgb * 255);

    png.data[i] = byte;
    png.data[i + 1] = byte;
    png.data[i + 2] = byte;
    png.data[i + 3] = 255;
  }
}

import { writeFileSync, mkdirSync } from "fs";
mkdirSync("test", { recursive: true });
writeFileSync("test/gradient.png", PNG.sync.write(png));
console.log("Test image: test/gradient.png");
