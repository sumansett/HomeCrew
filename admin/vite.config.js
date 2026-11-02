import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin panel runs on its own port: 5174
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
