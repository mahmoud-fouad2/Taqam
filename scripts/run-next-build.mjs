import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const isWindows = process.platform === "win32";
const MIN_BUILD_HEAP_MB = 3072;
const argv = process.argv.slice(2);
const cliForceWebpack = argv.includes("--webpack");
const cliForceTurbopack = argv.includes("--turbopack");

function ensureMinHeap(nodeOptions, minimumMb) {
  const optionPattern = /--max[-_]old[-_]space[-_]size(?:=|\s+)(\d+)/i;
  const trimmed = nodeOptions?.trim() ?? "";
  const match = trimmed.match(optionPattern);

  if (!match) {
    return {
      nodeOptions: trimmed ? `${trimmed} --max-old-space-size=${minimumMb}` : `--max-old-space-size=${minimumMb}`,
      adjusted: true,
      previous: null
    };
  }

  const previous = Number(match[1]);
  if (Number.isFinite(previous) && previous >= minimumMb) {
    return {
      nodeOptions: trimmed,
      adjusted: false,
      previous
    };
  }

  return {
    nodeOptions: trimmed.replace(optionPattern, `--max-old-space-size=${minimumMb}`),
    adjusted: true,
    previous: Number.isFinite(previous) ? previous : null
  };
}

if (cliForceWebpack && cliForceTurbopack) {
  console.error("[build] Invalid flags: cannot pass both --webpack and --turbopack.");
  process.exit(1);
}

const forceWebpack = process.env.NEXT_FORCE_WEBPACK_BUILD === "true";
const forceTurbopack = process.env.NEXT_FORCE_TURBOPACK_BUILD === "true";
const useWebpack =
  cliForceWebpack || (!cliForceTurbopack && (forceWebpack || (isWindows && !forceTurbopack)));
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

const heap = ensureMinHeap(env.NODE_OPTIONS, MIN_BUILD_HEAP_MB);
env.NODE_OPTIONS = heap.nodeOptions;

if (heap.adjusted) {
  console.log(
    `[build] Raised Node heap for build to ${MIN_BUILD_HEAP_MB}MB${heap.previous ? ` (was ${heap.previous}MB)` : ""}.`
  );
}

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
