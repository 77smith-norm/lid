# Lid — Lo-fi Image Dithering

TypeScript dithering engine with CSS-styled color overlays.

## Preview

![Norm dithered with cosmic purple overlay](Resources/norm_lid-fs.png)

```css
.dither-overlay {
  filter: grayscale(100%) brightness(1.1);
  background: linear-gradient(135deg, #2d1b69 0%, #5b2187 25%, #8b3a8f 50%, #c77dba 75%, #e8b4d0 100%);
  mix-blend-mode: color;
}
```

The black-and-white dithered image sits behind a gradient that flows from deep cosmic purple through violet into a lighter, more majestic pink. The CSS `mix-blend-mode: color` preserves the dither pattern while tinting it with the gradient — same approach as the original [sloum Lid](https://web.archive.org/web/20230112195102/https://rawtext.club/~sloum/lid.html).

## Algorithms

- **Threshold** — simple brightness cutoff
- **Ordered** — Bayer matrices (levels 0–4)
- **Random** — uniform noise before quantize
- **Floyd-Steinberg** — error diffusion, 4×3 mask
- **Atkinson** — error diffusion, 3×5 mask
- **Jarvis-Judice-Ninke** — error diffusion, 4×5 mask
- **Stucki** — error diffusion, 4×4 mask
- **Sierra 2-row** — error diffusion, 5×3 mask
- **Sierra 3-row** — error diffusion, 5×4 mask
- **Burkes** — error diffusion, 3×3 mask

## Usage

```bash
bun run index.ts input.png -o output.png -a floyd-steinberg
```

## Inspired by

- [sloum's Lid](https://tildegit.org/sloum/lid) — original CSS-styled dithering tool
- [Lowtech Magazine](https://lowtechmagazine.com) — aesthetic of digital minimalism
- [Shizaru](https://shizaru.net) — server for lightweight web publishing

## Resources

Russell's original Swift playground that started it all: [Lid.playground](Resources/)
