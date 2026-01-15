import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Keeping your SWC plugin
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // THIS LINE FIXES THE WHITE SCREEN ON GITHUB/VERCEL:
  base: "./", 
  
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));