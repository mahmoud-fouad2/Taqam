import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(projectRoot, "..", "..");
const androidDir = path.join(projectRoot, "android");
const gradlePropsPath = path.join(androidDir, "gradle.properties");
const appBuildGradlePath = path.join(androidDir, "app", "build.gradle");
const releaseApkPath = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
const releaseAabPath = path.join(androidDir, "app", "build", "outputs", "bundle", "release", "app-release.aab");
const publicApkPath = path.join(repoRoot, "public", "downloads", "taqam-android.apk");
const localSigningEnvPath = path.join(projectRoot, ".env.signing.local");

const target = (process.argv[2] ?? "both").toLowerCase();
const validTargets = new Set(["prebuild", "signing", "apk", "aab", "both", "publish"]);

if (!validTargets.has(target)) {
  console.error(`Unsupported target: ${target}`);
  console.error("Use one of: prebuild, signing, apk, aab, both, publish");
  process.exit(1);
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const vars = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }

  return vars;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    env: options.env ?? process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function setProp(content, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`);
  }

  return `${content.trimEnd()}\n${key}=${value}\n`;
}

function replaceOrThrow(content, pattern, replacement, description) {
  if (!pattern.test(content)) {
    throw new Error(`Unable to patch Android build file: ${description}`);
  }

  return content.replace(pattern, replacement);
}

function detectJavaHome() {
  const envJavaHome = process.env.JAVA_HOME?.trim();
  if (envJavaHome && existsSync(envJavaHome)) {
    return envJavaHome;
  }

  const probe = spawnSync("java", ["-XshowSettings:properties", "-version"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  const output = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
  const match = output.match(/java\.home = (.+)/);
  const discovered = match?.[1]?.trim();

  if (discovered && existsSync(discovered)) {
    return discovered;
  }

  throw new Error("Unable to resolve JAVA_HOME. Install Java 17+ and ensure `java` is on PATH.");
}

function detectAndroidSdk() {
  const candidates = [
    process.env.ANDROID_SDK_ROOT?.trim(),
    process.env.ANDROID_HOME?.trim(),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk") : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Local", "Android", "Sdk") : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "faheemly_dev", "AndroidSdk") : null,
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function getSigningConfig(env) {
  return {
    storeFile: env.TAQAM_UPLOAD_STORE_FILE?.trim() || "",
    storePassword: env.TAQAM_UPLOAD_STORE_PASSWORD?.trim() || "",
    keyAlias: env.TAQAM_UPLOAD_KEY_ALIAS?.trim() || "",
    keyPassword: env.TAQAM_UPLOAD_KEY_PASSWORD?.trim() || "",
  };
}

function hasReleaseSigning(env) {
  const signing = getSigningConfig(env);
  return Boolean(signing.storeFile && signing.storePassword && signing.keyAlias && signing.keyPassword);
}

function getBuildEnv() {
  const localSigningEnv = parseEnvFile(localSigningEnvPath);
  const env = {
    ...localSigningEnv,
    ...process.env,
    CI: process.env.CI || "1",
    NODE_ENV: process.env.NODE_ENV || "production",
    JAVA_HOME: detectJavaHome(),
  };

  const androidSdk = detectAndroidSdk();
  if (androidSdk) {
    env.ANDROID_HOME = androidSdk;
    env.ANDROID_SDK_ROOT = androidSdk;
  }

  return env;
}

function ensureAndroidProject(env) {
  if (existsSync(androidDir)) {
    return;
  }

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  run(npxCmd, ["expo", "prebuild", "--platform", "android"], { cwd: projectRoot, env });
}

function tuneGradleProperties() {
  let content = readFileSync(gradlePropsPath, "utf8");
  content = setProp(content, "org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8");
  content = setProp(content, "org.gradle.parallel", "false");
  content = setProp(content, "kotlin.daemon.jvm.options", "-Xmx2048m,-XX:MaxMetaspaceSize=1024m");
  content = setProp(content, "kotlin.compiler.execution.strategy", "in-process");
  writeFileSync(gradlePropsPath, content);
}

function tuneAppBuildGradle() {
  let content = readFileSync(appBuildGradlePath, "utf8");

  if (!content.includes("TAQAM_RELEASE_SIGNING_START")) {
    content = replaceOrThrow(
      content,
      /def jscFlavor = 'io\.github\.react-native-community:jsc-android:2026004\.\+'\r?\n/m,
      `def jscFlavor = 'io.github.react-native-community:jsc-android:2026004.+'\n\n// TAQAM_RELEASE_SIGNING_START\ndef releaseStoreFile = findProperty('taqam.uploadStoreFile') ?: System.getenv('TAQAM_UPLOAD_STORE_FILE')\ndef releaseStorePassword = findProperty('taqam.uploadStorePassword') ?: System.getenv('TAQAM_UPLOAD_STORE_PASSWORD')\ndef releaseKeyAlias = findProperty('taqam.uploadKeyAlias') ?: System.getenv('TAQAM_UPLOAD_KEY_ALIAS')\ndef releaseKeyPassword = findProperty('taqam.uploadKeyPassword') ?: System.getenv('TAQAM_UPLOAD_KEY_PASSWORD')\ndef hasReleaseSigning = releaseStoreFile && releaseStorePassword && releaseKeyAlias && releaseKeyPassword\n// TAQAM_RELEASE_SIGNING_END\n`,
      "insert release-signing variables",
    );

    content = replaceOrThrow(
      content,
      /    signingConfigs \{[\s\S]*?\r?\n    \}\r?\n    buildTypes \{/m,
      `    signingConfigs {\n        debug {\n            storeFile file('debug.keystore')\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'\n        }\n        if (hasReleaseSigning) {\n            release {\n                storeFile file(releaseStoreFile)\n                storePassword releaseStorePassword\n                keyAlias releaseKeyAlias\n                keyPassword releaseKeyPassword\n            }\n        }\n    }\n    buildTypes {`,
      "replace signingConfigs block",
    );

    content = replaceOrThrow(
      content,
      /        release \{\r?\n            \/\/ Caution![\s\S]*?\r?\n            signingConfig signingConfigs\.debug\r?\n/m,
      `        release {\n            // Caution! In production, you need to generate your own keystore file.\n            // see https://reactnative.dev/docs/signed-apk-android.\n            if (hasReleaseSigning) {\n                signingConfig signingConfigs.release\n            } else {\n                println(\"Taqam Android release build is using the debug keystore. Configure TAQAM_UPLOAD_* variables or .env.signing.local for a store-ready signed build.\")\n                signingConfig signingConfigs.debug\n            }\n`,
      "replace release signingConfig",
    );
  }

  writeFileSync(appBuildGradlePath, content);
}

function printSigningStatus(env) {
  const signing = getSigningConfig(env);
  const usingLocalEnv = existsSync(localSigningEnvPath);

  if (hasReleaseSigning(env)) {
    console.log("Release signing status: upload keystore configured.");
    console.log(`Store file: ${signing.storeFile}`);
    console.log(`Key alias: ${signing.keyAlias}`);
    console.log(`Source: ${usingLocalEnv ? ".env.signing.local and/or environment variables" : "environment variables"}`);
    return;
  }

  console.log("Release signing status: debug keystore fallback.");
  console.log("Provide TAQAM_UPLOAD_STORE_FILE, TAQAM_UPLOAD_STORE_PASSWORD, TAQAM_UPLOAD_KEY_ALIAS, and TAQAM_UPLOAD_KEY_PASSWORD.");
  console.log(`Optional local file: ${localSigningEnvPath}`);
}

function runGradle(task, env) {
  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  run(gradlew, ["--no-daemon", "--max-workers=4", task], { cwd: androidDir, env });
}

function publishApk() {
  if (!existsSync(releaseApkPath)) {
    throw new Error(`Release APK not found at ${releaseApkPath}`);
  }

  copyFileSync(releaseApkPath, publicApkPath);
  console.log(`Published release APK to ${publicApkPath}`);
}

try {
  const env = getBuildEnv();
  ensureAndroidProject(env);
  tuneGradleProperties();
  tuneAppBuildGradle();

  if (target === "prebuild") {
    console.log(`Android project is ready at ${androidDir}`);
    process.exit(0);
  }

  if (target === "signing") {
    printSigningStatus(env);
    process.exit(0);
  }

  if (target === "apk" || target === "both" || target === "publish") {
    runGradle("assembleRelease", env);
  }

  if (target === "aab" || target === "both") {
    runGradle("bundleRelease", env);
  }

  if (target === "publish") {
    publishApk();
  }

  if (target === "apk") {
    console.log(`Release APK: ${releaseApkPath}`);
  }

  if (target === "aab") {
    console.log(`Release AAB: ${releaseAabPath}`);
  }

  if (target === "both") {
    console.log(`Release APK: ${releaseApkPath}`);
    console.log(`Release AAB: ${releaseAabPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}