import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const isWindows = process.platform === "win32";
const forceWebpack = process.env.NEXT_FORCE_WEBPACK_BUILD === "true";
const forceTurbopack = process.env.NEXT_FORCE_TURBOPACK_BUILD === "true";
const useWebpack = forceWebpack || (isWindows && !forceTurbopack);
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const args = [nextBin, "build", ...(useWebpack ? ["--webpack"] : [])];

console.log(`[build] Running Next.js build with ${useWebpack ? "webpack" : "turbopack"}.`);

const env = {
  ...process.env,
  ...(isWindows && !forceTurbopack && !process.env.NEXT_DISABLE_STANDALONE_OUTPUT
    ? { NEXT_DISABLE_STANDALONE_OUTPUT: "true" }
    : {})
};

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env
});

child.on("error", (error) => {
  console.error("[build] Failed to start Next.js build.", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[build] Next.js build terminated by signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
