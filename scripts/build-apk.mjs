/**
 * Android APK Build Script
 * سكربت بناء تطبيق Android APK
 *
 * يقوم هذا السكربت بـ:
 * 1. اكتشاف Java JDK تلقائياً
 * 2. ضبط CAP_SERVER_URL للإنتاج
 * 3. مزامنة Capacitor
 * 4. بناء APK
 *
 * الاستخدام: node scripts/build-apk.mjs
 */

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

function getProductionUrl() {
  const baseUrl =
    process.env.MOBILE_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error(
      "Set MOBILE_WEB_URL or NEXT_PUBLIC_APP_URL or NEXTAUTH_URL before building the APK."
    );
  }

  try {
    return new URL("/m", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`)
      .toString()
      .replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid public app URL: ${baseUrl}`);
  }
}

// For the Capacitor APK we want the dedicated mobile entry (login + attendance)
const PRODUCTION_URL = getProductionUrl();

// قائمة المسارات المحتملة لـ JDK
const JDK_PATHS = [
  "C:\\Program Files\\Java\\jdk-21",
  "C:\\Program Files\\Java\\jdk-17",
  "C:\\Program Files\\Java\\jdk-11",
  "C:\\Program Files\\Eclipse Adoptium\\jdk-21",
  "C:\\Program Files\\Eclipse Adoptium\\jdk-17",
  "C:\\Program Files\\Microsoft\\jdk-21",
  "C:\\Program Files\\Microsoft\\jdk-17",
  process.env.JAVA_HOME
].filter(Boolean);

function findJavaHome() {
  for (const path of JDK_PATHS) {
    if (path && existsSync(path)) {
      const javacPath = join(path, "bin", "javac.exe");
      if (existsSync(javacPath)) {
        console.log(`✅ Found JDK at: ${path}`);
        return path;
      }
    }
  }
  return null;
}

function runCommand(cmd, env = {}) {
  console.log(`\n🔧 Running: ${cmd}\n`);
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: true
  });
}

async function main() {
  console.log("🚀 Android APK Build Script");
  console.log("============================\n");

  // 1. Find Java
  const javaHome = findJavaHome();
  if (!javaHome) {
    console.error("❌ Error: JDK not found!");
    console.error("Please install JDK 17 or higher from:");
    console.error("  - https://adoptium.net/");
    console.error("  - https://www.oracle.com/java/technologies/downloads/");
    process.exit(1);
  }

  // 2. Set environment
  const env = {
    JAVA_HOME: javaHome,
    CAP_SERVER_URL: PRODUCTION_URL,
    PATH: `${javaHome}\\bin;${process.env.PATH}`
  };

  console.log(`📦 Production URL: ${PRODUCTION_URL}`);
  console.log(`☕ JAVA_HOME: ${javaHome}\n`);

  try {
    // 3. Sync Capacitor
    console.log("📱 Syncing Capacitor...");
    runCommand("pnpm cap:sync:android", env);

    // 4. Build APK
    console.log("\n🔨 Building APK...");
    runCommand("cd android && gradlew.bat assembleDebug", env);

    // 5. Success
    const apkPath = "android\\app\\build\\outputs\\apk\\debug\\app-debug.apk";
    if (existsSync(apkPath)) {
      console.log("\n✅ APK built successfully!");
      console.log(`📁 Location: ${process.cwd()}\\${apkPath}`);
      console.log("\n📲 To install on your phone:");
      console.log("   1. Copy the APK to your phone");
      console.log('   2. Enable "Install from unknown sources"');
      console.log("   3. Open the APK file to install");
    } else {
      console.log("\n⚠️  Build completed but APK not found at expected path");
    }
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

main();
