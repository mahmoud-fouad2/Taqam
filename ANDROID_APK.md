# Build an Android APK (Capacitor wrapper)

This repo is a **Next.js** application (API routes + DB + auth), so it **cannot be exported as a fully-offline static app**.
The APK we build here is a **WebView wrapper** that loads the app from a server URL.

For the actively maintained Expo mobile app, use `apps/mobile`. This document only covers the Capacitor WebView wrapper configured at the repo root.

## Prerequisites (Windows)

- Install **Android Studio**
  - Install Android SDK Platform + Build Tools
  - Ensure **Android SDK Command-line Tools** is installed
- Install **Java 17** (recommended)
- Enable **Developer options** + **USB debugging** on your phone (or use emulator)

## 1) Run the web app so your phone can access it

Option A (LAN - easiest for testing):

1. Start dev server and allow LAN access:
   - `pnpm dev:lan`
2. Find your PC IP address (example): `192.168.1.10`
3. From your phone browser (same Wi‑Fi), open:
   - `http://192.168.1.10:3000`

Option B (recommended for real testing):

- Deploy the Next.js app to a public URL (HTTPS), then use that URL in the APK.

## 2) Point Capacitor to your server URL

Set environment variable `CAP_SERVER_URL` before syncing/building.

Example (PowerShell):

- `$env:CAP_SERVER_URL = "http://192.168.1.10:3000"`
- `pnpm cap:sync:android`

## 3) Open Android Studio (optional)

- `pnpm android:open`

You can Run on a device/emulator directly from Android Studio.

## 4) Build a debug APK

- `pnpm android:apk:debug`

Your APK will be at:

- `android/app/build/outputs/apk/debug/app-debug.apk`

Install it on your phone:

- Copy the APK to the phone and install
- Or use `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`

## Notes

- If you open the APK and see a plain "Taqam" placeholder page, it means `CAP_SERVER_URL` was not set when syncing/building.
- For production, use an **HTTPS** URL and consider disabling `cleartext` (HTTP) in `capacitor.config.ts`.
