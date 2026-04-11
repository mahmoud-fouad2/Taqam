import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const standaloneServer = path.join(projectRoot, ".next", "standalone", "server.js");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

function parseArgs(argv) {
  const passthrough = [];
  let hostname;
  let port;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if ((arg === "--hostname" || arg === "-H") && argv[index + 1]) {
      hostname = argv[index + 1];
      index += 1;
      continue;
    }

    if ((arg === "--port" || arg === "-p") && argv[index + 1]) {
      port = argv[index + 1];
      index += 1;
      continue;
    }

    passthrough.push(arg);
  }

  return { hostname, port, passthrough };
}

function run(command, args, env) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit"
  });

  child.on("close", (code) => {
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("[start-production] Failed to start:", error);
    process.exit(1);
  });
}

const { hostname, port, passthrough } = parseArgs(process.argv.slice(2));
const env = {
  ...process.env,
  ...(hostname ? { HOSTNAME: hostname } : {}),
  ...(port ? { PORT: port } : {})
};

if (existsSync(standaloneServer)) {
  console.log("[start-production] Starting Next.js standalone server...");
  run(process.execPath, [standaloneServer, ...passthrough], env);
} else {
  console.log("[start-production] Standalone output not found, falling back to next start...");
  const fallbackEnv = {
    ...env,
    NEXT_DISABLE_STANDALONE_OUTPUT: env.NEXT_DISABLE_STANDALONE_OUTPUT || "true"
  };
  const nextArgs = ["start"];

  if (hostname) {
    nextArgs.push("--hostname", hostname);
  }

  if (port) {
    nextArgs.push("--port", port);
  }

  nextArgs.push(...passthrough);
  run(process.execPath, [nextBin, ...nextArgs], fallbackEnv);
}
