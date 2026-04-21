# lid — Lo-fi Image Dithering

A TypeScript/Bun library and CLI for image dithering. Implements eleven dithering algorithms with gamma-correct sRGB processing.

## Algorithms

- **Random** — White noise dithering
- **Bayer** — Ordered dithering with Bayer matrices (levels 0–4)
- **Floyd-Steinberg** — Classic error diffusion
- **Atkinson** — Apple's variation, softer error spread
- **Jarvis-Judice-Ninke** — Wider error diffusion pattern
- **Stucki** — Optimized JJN variant
- **Sierra** — 2-row and 3-row variants
- **Burkes** — Lighter error diffusion

## Usage

```bash
# CLI
bun run index.ts input.png -o output.png -a floyd-steinberg

# Library
import { dither, algorithms, BayerLevel } from "./src/index.js";
const result = dither(imageData, algorithms.FLOYD_STEINBERG);
```

## References

- [Ditherpunk — Surma](https://surma.dev/things/ditherpunk/)
- [Atkinson Dithering — Beyond Loom](https://beyondloom.com/blog/dither.html)
- [Eleven Algorithms — Tanner Elland](https://tannerelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html)
- [Dithering on the GPU — Alex Charlton](https://alex-charlton.com/posts/Dithering_on_the_GPU/)
