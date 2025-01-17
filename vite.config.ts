import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  server: {
    host: "0.0.0.0",
    hmr: {
      protocol: "wss",
      host: "0.0.0.0",
      port: 3000,
    },
  },
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react", 
            "react-dom",
            "react-query",
            "d3",
            "framer-motion",
            "recharts",
          ],
        },
      },
    },
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@db": path.resolve(__dirname, "db"),
    },
  },
  root: path.resolve(__dirname, "client"),
});
