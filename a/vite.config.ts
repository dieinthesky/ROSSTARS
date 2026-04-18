import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    /**
     * Para dev local com PHP rodando fora do Vite:
     * - suba a pasta `api/` em algum host/porta (ex.: Apache em http://localhost)
     * - e use o proxy abaixo, mantendo VITE_API_BASE_URL vazio.
     *
     * Se preferir, você também pode usar `.env` com `VITE_API_BASE_URL=https://seu_host/api`.
     */
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
