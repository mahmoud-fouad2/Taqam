import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/android/**",
      "android/**",
      "**/apps/mobile/**",
      "apps/mobile/**",
      "**/tmp/**",
      "tmp/**"
    ]
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    }
  },
  {
    extends: [...nextCoreWebVitals]
  }
]);
