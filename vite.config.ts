import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  base: "/lid/",
  build: {
    outDir: "docs/dist",
    sourcemap: true,
    rollupOptions: {
      input: ["index.html"],
      output: {
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
      },
    },
  },
  resolve: {
    alias: {
      // Resolve ./lid.js in HTML to the pre-built bundle
      "./lid.js": path.join(__dirname, "dist", "lid.js"),
    },
  },
  plugins: [
    {
      name: "copy-lid-js",
      closeBundle() {
        const src = path.join(__dirname, "dist", "lid.js");
        const dst = path.join(__dirname, "docs", "dist", "lid.js");
        const mapSrc = path.join(__dirname, "dist", "lid.js.map");
        const mapDst = path.join(__dirname, "docs", "dist", "lid.js.map");
        if (fs.existsSync(src)) fs.copyFileSync(src, dst);
        if (fs.existsSync(mapSrc)) fs.copyFileSync(mapSrc, mapDst);
      },
    },
  ],
});
