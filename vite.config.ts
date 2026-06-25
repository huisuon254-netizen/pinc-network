import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

function stripCrossorigin() {
  return {
    name: "strip-crossorigin",
    enforce: "post" as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/ crossorigin(?:="[^"]*")?/g, "")
        .replace(
          /(<meta\s+[^>]*Content-Security-Policy[^>]*content=")([^"]*)(")/gi,
          (_match: string, prefix: string, csp: string, suffix: string) => {
            const fixed = csp
              .replace(/frame-src [^;]+;?/g, "")
              .replace(/object-src [^;]+;?/g, "");
            return prefix + fixed + suffix;
          }
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripCrossorigin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  clearScreen: false,
  base: "./",
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
