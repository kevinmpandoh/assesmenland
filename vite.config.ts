import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const SERVER_FN_BASE = "/_serverFn/";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  define: {
    "process.env.TSS_SERVER_FN_BASE": JSON.stringify(SERVER_FN_BASE),
    "import.meta.env.TSS_SERVER_FN_BASE": JSON.stringify(SERVER_FN_BASE),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        "process.env.TSS_SERVER_FN_BASE": JSON.stringify(SERVER_FN_BASE),
        "import.meta.env.TSS_SERVER_FN_BASE": JSON.stringify(SERVER_FN_BASE),
      },
    },
  },
  plugins: [
    nodePolyfills({
      // Only polyfill what Solana wallet libs need on the CLIENT. Polyfilling
      // `process` breaks TanStack Start's `process.env.TSS_*` server-fn base
      // URL injection (URLs become "/undefined<id>").
      include: ["buffer", "util", "stream", "events"],
      globals: { Buffer: true, global: true, process: false },
      protocolImports: true,
    }),
  ],
});
