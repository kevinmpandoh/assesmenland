import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const SERVER_FN_BASE = "/_serverFn/";

export default defineConfig(({ ssrBuild }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
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
  },
  plugins: [
    // Only polyfill Node.js built-ins on the client build.
    // Polyfilling them on the server breaks native Node.js modules (like util in react-dom/server).
    !ssrBuild &&
      nodePolyfills({
        include: ["buffer", "util", "stream", "events"],
        globals: { Buffer: true, global: true, process: false },
        protocolImports: false,
      }),
  ].filter(Boolean) as any,
}));
