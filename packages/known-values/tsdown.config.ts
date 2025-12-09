import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["iife", "cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  globalName: "BCKnownValues",
  outputOptions: {
    globals: {
      "@bcts/dcbor": "BCDcbor",
      "@bcts/tags": "BCTags",
    },
  },
});
