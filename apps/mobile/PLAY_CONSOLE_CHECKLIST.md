# Play Console Checklist for Taqam Mobile

Status date: 2026-04-06

## Already Ready

- App name in Expo config: `Taqam`
- Android package ID: `com.taqam.app`
- Version: `1.0.0`
- Version code: `1`
- Android release build scripts are wired through `pnpm --dir apps/mobile android:aab:release` and `android:apk:release`
- Internal website download points to `public/downloads/taqam-android.apk`
- Backend target for the mobile app is configured in `apps/mobile/.env` as `https://taqam.net`
- Privacy page exists on the web app at `/privacy`

## Must Be Completed Before Play Upload

- Configure a real upload keystore instead of the current debug signing fallback
- Build a fresh signed AAB after signing is configured
- Create or confirm the Play Console app record for package `com.taqam.app`
- Prepare the store listing text in Arabic and English
- Prepare Play Store graphics:
  - App icon 512x512
  - Feature graphic 1024x500
  - Phone screenshots
- Complete the Play Console Data safety form
- Complete the App access and Content rating questionnaires
- Confirm support email, website, and privacy policy URL for the public listing

## Recommended Operator Checks

- Confirm that `https://taqam.net` remains the final public backend domain before store submission
- Verify that the package ID `com.taqam.app` is the permanent store identity you want to keep
- Install the signed release APK on at least one real Android device and verify login, attendance, biometrics, logout-all, and language switching
- Archive the upload keystore outside the repository with backup and access control

## Suggested Submission Flow

1. Create `apps/mobile/.env.signing.local` from `apps/mobile/.env.signing.example`
2. Run `pnpm --dir apps/mobile android:signing:status`
3. Run `pnpm --dir apps/mobile android:aab:release`
4. Upload `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` to Play Console internal testing
5. Validate install, login, attendance, and biometrics from the internal test track before wider rollout