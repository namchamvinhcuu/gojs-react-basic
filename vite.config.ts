import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // This will make paths relative
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split GoJS and React into separate chunks
          "gojs-react": ["gojs", "react"],
          // You can create additional chunks as needed
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@styles": path.resolve(__dirname, "src/styles"),
    },
  },
});
