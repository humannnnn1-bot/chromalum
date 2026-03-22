/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/chromalum/",
  plugins: [react()],
  test: {
    globals: true,
  },
});
