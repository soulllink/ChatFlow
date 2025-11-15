// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  // ←←← ЭТО ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ!
  base: "/ChatFlow/", // Именно так, с большой C и слешем на конце

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
