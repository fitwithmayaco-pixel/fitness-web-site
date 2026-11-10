import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  worker: {
    format: "es",
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["frequency-album-mpeg-jazz.trycloudflare.com"],
  },
});
