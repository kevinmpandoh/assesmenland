import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    nodePolyfills({
      // Only polyfill what Solana wallet libs need on the CLIENT. Polyfilling
      // `process` breaks TanStack Start's `process.env.TSS_*` server-fn base
      // URL injection (URLs become "/undefined<id>").
      include: ["buffer", "util", "stream", "events"],
      globals: { Buffer: true },
      protocolImports: true,
    }),
  ],
});
