// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
  },
  server: {
    port: 5173,
    open: true,
  },
});
