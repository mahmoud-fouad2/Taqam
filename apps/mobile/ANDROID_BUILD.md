# Android Build for Taqam Mobile

This is the official Android build path for the active Expo mobile app in `apps/mobile`.

## What This Produces

- Installable release APK for direct internal download
- Android App Bundle (AAB) for store-style distribution workflows

## Commands

- `pnpm --dir apps/mobile android:prebuild`
- `pnpm --dir apps/mobile android:signing:status`
- `pnpm --dir apps/mobile android:apk:release`
- `pnpm --dir apps/mobile android:aab:release`
- `pnpm --dir apps/mobile android:release:all`
- `pnpm --dir apps/mobile android:apk:publish`

## What The Build Script Handles

- Generates `android/` with Expo prebuild when needed
- Resolves a valid `JAVA_HOME` automatically when the environment variable is stale
- Reuses `ANDROID_HOME` or `ANDROID_SDK_ROOT` when present
- Tunes Gradle and Kotlin memory to avoid Metaspace failures on Windows
- Patches the generated Android project so release builds can use a real upload keystore
- Builds with `NODE_ENV=production`

## Release Signing

- Copy `apps/mobile/.env.signing.example` to `apps/mobile/.env.signing.local`
- Fill these variables:
	- `TAQAM_UPLOAD_STORE_FILE`
	- `TAQAM_UPLOAD_STORE_PASSWORD`
	- `TAQAM_UPLOAD_KEY_ALIAS`
	- `TAQAM_UPLOAD_KEY_PASSWORD`
- Check the current mode with `pnpm --dir apps/mobile android:signing:status`
- If these values are missing, release builds fall back to the Android debug keystore and are not suitable for Play Console upload

## Output Paths

- APK: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- AAB: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

## Internal Download Path

- The website download button points to `public/downloads/taqam-android.apk`
- Use `pnpm --dir apps/mobile android:apk:publish` to overwrite that file with the latest release APK from `apps/mobile`

## Current Build State

- The currently published APK in `public/downloads/taqam-android.apk` was rebuilt from `apps/mobile`
- The current artifact is still debug-signed until upload-keystore values are configured

## Notes

- `apps/mobile/android/` is generated and ignored by git
- The Capacitor wrapper documented in `ANDROID_APK.md` is a separate legacy distribution path and is not the official native mobile app