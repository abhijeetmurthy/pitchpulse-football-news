import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webPort = Number(process.env.WEB_PORT || 54173);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: webPort,
    strictPort: true
  }
});
