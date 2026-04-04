# Legacy Mobile App Reference

هذا المجلد يحتوي على نسخة موبايل قديمة محفوظة كمرجع فقط.

التطبيق الرسمي الجاري تشغيله والتحقق منه من الجذر هو:

- `apps/mobile`

هذه النسخة `mobile-app/` ليست جزءاً من سكربتات التحقق الجذرية الحالية مثل `pnpm typecheck:mobile` أو `pnpm validate:all`.

## Current status

- Legacy reference app built with **Expo + Expo Router**
- Kept for code comparison and migration only
- Running scripts from this folder now prints a legacy notice before Expo starts
- Do not treat it as the production mobile workspace unless explicitly re-adopted

## What’s included

- Login using the existing backend endpoint: `POST /api/mobile/auth/login`
- Secure token storage using `expo-secure-store`
- Optional biometric unlock (Fingerprint/FaceID) using `expo-local-authentication`
- Device header injection (required by the backend):
  - `x-device-id` (required)
  - `x-device-platform`
  - `x-device-name`
  - `x-app-version`

## Configure API base URL

Create a `.env` file in `mobile-app/`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://YOUR-RENDER-DOMAIN
```

For local backend dev (Android emulator), you can use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

See `.env.example`.

## Run on Android

From repo root:

```bash
cd mobile-app
npm run android
```

Notes:
- Install **Android Studio** + an emulator, or use a real device with Expo Go.
- Biometrics work best on a real device.

## How biometrics works

- After signing in, go to **Settings → Unlock with biometrics**.
- When enabled, the app will ask for biometrics to refresh/unlock your session.

## Next steps (optional)

- Implement Check-in / Check-out actions using `POST /api/mobile/attendance`
- Add Arabic UI + RTL
- Add app icon, splash, and EAS build pipeline for APK/AAB
