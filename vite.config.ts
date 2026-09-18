import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    envPrefix: ["VITE_", "GEMINI_", "GOOGLE_"],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API || env.GOOGLE_API_KEY || env.VITE_GOOGLE_API_KEY ||
        process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API || process.env.GOOGLE_API_KEY || ""
      ),
      "process.env.VITE_GEMINI_API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API || env.GEMINI_API_KEY || env.GOOGLE_API_KEY ||
        process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API || process.env.GEMINI_API_KEY || ""
      ),
      "process.env.GOOGLE_API_KEY": JSON.stringify(
        env.GOOGLE_API_KEY || env.VITE_GOOGLE_API_KEY || env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY || ""
      ),
    },
  };
});
