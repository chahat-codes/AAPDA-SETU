import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@farmer": resolve(__dirname, "src/farmer"),
      "@helper": resolve(__dirname, "src/helper"),
      "@officer": resolve(__dirname, "src/officer"),
      "@engine": resolve(__dirname, "src/engine"),
      "@verify": resolve(__dirname, "src/verify"),
    },
  },
});

