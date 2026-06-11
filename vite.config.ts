import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";

const bufferShim = path.resolve(
  process.cwd(),
  "node_modules/buffer/index.js",
);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        { find: /^node:buffer$/, replacement: bufferShim },
        { find: /^buffer$/, replacement: bufferShim },
      ],
    },
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["buffer"],
    },
  },
});
