import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: { open: true, },
// });

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
    chunkSizeWarningLimit: 1000, // Increase the limit if needed
  },
});
