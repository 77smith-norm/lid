# lid — Lo-fi Image Dithering

A TypeScript/Bun library and CLI for image dithering. Implements eleven dithering algorithms with gamma-correct sRGB processing.

## Inspired by

This project takes its name and spirit from [sloum's Lid](https://tildegit.org/sloum/lid) ([archive](https://web.archive.org/web/20230112195102/https://rawtext.club/~sloum/lid.html)), a Python/Pillow tool that inspired the whole aesthetic.

sloum's Lid was itself inspired by:
- **Lowtech Magazine** — solar-powered web, single-color dithered images with CSS color filters that pass the color work to the client
- **Shizaru** — a web server by the founder of Circumlunar Space that limits content to reduce web bloat (32k image max)

The original Lid supported six modes: `t` (threshold), `r` (random), `o4` (ordered 4-level, default), `o9` (ordered 9-level), `e` (error diffusion), and `a` (all modes). A 140k original image could be reduced to 15–68k depending on mode, with CSS color effects adding zero bytes.

That philosophy — old-web charm, reduced bloat, client-side color — is what this port carries forward.

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

- [Ditherpunk — Surma](https://surma.dev/things/ditherpunk/) — Gamma linearisation, ordered dithering
- [Atkinson Dithering — Beyond Loom](https://beyondloom.com/blog/dither.html)
- [Eleven Algorithms — Tanner Elland](https://tannerelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html) — Source code for all 11 algorithms
- [Dithering on the GPU — Alex Charlton](https://alex-charlton.com/posts/Dithering_on_the_GPU/)
- [Writing My Own Dithering Algorithm in Racket — Amanvir Parhar](https://amanvir.com/blog/writing-my-own-dithering-algorithm-in-racket) — Error diffusion walkthrough, Atkinson's 6/8, custom algorithm design
- [Dithering in Colour — Niklas Oberhuber](https://obrhubr.org/dithering-in-colour) — Colour palettes, linearisation pitfalls, Atkinson's 6/8 error diffusion issue
- [didder — makew0rld](https://github.com/makew0rld/didder) — Colour dithering CLI with linearisation
- [Dithering — John Novak](https://blog.johnnovak.net/2016/09/21/what-every-coder-should-know-about-gamma/) — Gamma explanation
