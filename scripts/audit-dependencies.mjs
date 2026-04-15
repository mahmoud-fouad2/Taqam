#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const workspaceRoot = process.cwd();
const auditLevel = process.env.AUDIT_LEVEL || "moderate";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const manifests = [
  {
    name: "root",
    manifestPath: path.join(workspaceRoot, "package.json")
  },
  {
    name: "mobile",
    manifestPath: path.join(workspaceRoot, "apps", "mobile", "package.json")
  }
];

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return {
    ...result,
    error: result.error,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function runShell(commandLine, cwd) {
  const result = spawnSync(commandLine, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  return {
    ...result,
    error: result.error,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function readJsonPackage(manifestPath) {
  const manifestBuffer = run(
    process.execPath,
    ["-e", `console.log(JSON.stringify(require(${JSON.stringify(manifestPath)})))`],
    workspaceRoot
  );

  if (manifestBuffer.status !== 0) {
    throw new Error(`Unable to read ${manifestPath}: ${manifestBuffer.stderr}`);
  }

  return JSON.parse(manifestBuffer.stdout.trim());
}

function summarizeVulnerabilities(vulnerabilities, manifest) {
  const actionable = [];
  const ignored = [];

  const readManifestVersion = (packageName) =>
    manifest.dependencies?.[packageName] ??
    manifest.devDependencies?.[packageName] ??
    manifest.optionalDependencies?.[packageName] ??
    null;

  const majorOf = (value) => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/^[^\d]*/, "");
    if (!/^\d/.test(normalized)) {
      return null;
    }

    return Number.parseInt(normalized.split(".")[0], 10);
  };

  for (const [packageName, details] of Object.entries(vulnerabilities)) {
    const currentVersion = readManifestVersion(packageName);

    const fixVersion =
      typeof details.fixAvailable === "object" ? details.fixAvailable.version : null;
    const fixPackageName =
      typeof details.fixAvailable === "object" ? details.fixAvailable.name : null;
    const fixTargetCurrentVersion = fixPackageName ? readManifestVersion(fixPackageName) : null;
    const isDowngradeOnlyFix =
      (majorOf(currentVersion) !== null &&
        majorOf(fixVersion) !== null &&
        majorOf(fixVersion) < majorOf(currentVersion)) ||
      (majorOf(fixTargetCurrentVersion) !== null &&
        majorOf(fixVersion) !== null &&
        majorOf(fixVersion) < majorOf(fixTargetCurrentVersion));

    if (isDowngradeOnlyFix) {
      ignored.push({
        packageName,
        severity: details.severity,
        fixVersion,
        fixPackageName: fixPackageName || packageName
      });
      continue;
    }

    actionable.push({
      packageName,
      severity: details.severity,
      fixVersion,
      via: Array.isArray(details.via)
        ? details.via
            .filter((entry) => typeof entry === "object" && entry?.title)
            .map((entry) => entry.title)
        : []
    });
  }

  return { actionable, ignored };
}

function auditManifest(target) {
  const tempDir = mkdtempSync(path.join(tmpdir(), `taqam-audit-${target.name}-`));

  try {
    const manifest = readJsonPackage(target.manifestPath);
    writeFileSync(path.join(tempDir, "package.json"), JSON.stringify(manifest, null, 2));

    const installResult = runShell(
      `${npmCommand} install --package-lock-only --ignore-scripts --no-fund --no-audit --legacy-peer-deps`,
      tempDir
    );

    if (installResult.status !== 0) {
      throw new Error(
        `npm install failed for ${target.name}: ${installResult.error?.message || installResult.stderr || installResult.stdout}`
      );
    }

    const auditResult = runShell(
      `${npmCommand} audit --package-lock-only --audit-level ${auditLevel} --json`,
      tempDir
    );

    const jsonSource = auditResult.stdout.trim() || auditResult.stderr.trim();
    const report = JSON.parse(jsonSource);
    const { actionable, ignored } = summarizeVulnerabilities(
      report.vulnerabilities || {},
      manifest
    );

    return {
      name: target.name,
      report,
      actionable,
      ignored
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const results = manifests.map(auditManifest);

for (const result of results) {
  const counts = result.report.metadata?.vulnerabilities || {};
  console.log(`\n[${result.name}] vulnerabilities: ${JSON.stringify(counts)}`);

  if (result.actionable.length > 0) {
    console.log(`[${result.name}] actionable findings:`);
    for (const finding of result.actionable) {
      const viaText = finding.via.length > 0 ? ` -> ${finding.via.join(" | ")}` : "";
      const fixText = finding.fixVersion ? ` (fix: ${finding.fixVersion})` : "";
      console.log(`- ${finding.packageName} [${finding.severity}]${fixText}${viaText}`);
    }
  }

  if (result.ignored.length > 0) {
    console.log(`[${result.name}] advisory metadata anomalies (not auto-failed):`);
    for (const finding of result.ignored) {
      console.log(
        `- ${finding.packageName} [${finding.severity}] (reported fix downgrades ${finding.fixPackageName} to ${finding.fixVersion})`
      );
    }
  }
}

if (results.some((result) => result.actionable.length > 0)) {
  process.exit(1);
}

console.log("\nDependency audit: OK");
