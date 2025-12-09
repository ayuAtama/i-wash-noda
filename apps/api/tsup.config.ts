import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "es2020",
  clean: true,
  splitting: false,
  sourcemap: false,

  // Do NOT bundle Node built-ins or Prisma or dotenv
  external: ["dotenv", "@prisma/client", "prisma", "fs", "path"],

  // fix Node ESM import errors
  esbuildOptions(options) {
    options.outExtension = { ".js": ".js" };
  },
});
