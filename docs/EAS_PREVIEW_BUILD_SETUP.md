# EAS Preview Build Setup

## Why Preview Builds Need EAS Env

EAS cloud builds do not automatically use your local `.env` file when it is ignored, unavailable, or not uploaded to the build worker. For preview APK testing, add the required mobile environment variables in the Expo/EAS project settings for the `preview` environment.

Changing EAS environment variables requires a new build before the app bundle sees the new values.

## Public Mobile Variables

Expo variables that start with `EXPO_PUBLIC_` are bundled into the app. Treat them as public configuration, not private secrets.

For preview APK testing, configure these variables in the EAS `preview` environment:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` if purchase testing is intended in a release-style preview APK
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`

`EXPO_PUBLIC_API_BASE_URL` should point to a deployed backend URL for testers. A local IP only works when the phone or emulator can reach the developer machine on the same network.

Important: `EXPO_PUBLIC_FIREBASE_API_KEY` must be the Firebase Web API key. It usually starts with `AIza`. Do not paste a RevenueCat Test Store key such as `test_...` into the Firebase key field.

`EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY` is only for development/dev-client builds. Do not configure it for release-style preview APKs or production builds. RevenueCat Test Store keys can trigger a wrong-key crash in release-style APKs.

Do not submit Play Store builds with the RevenueCat Test Store API key. For release-style preview APKs, Google Play internal/closed testing, and production later, use `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` and keep the entitlement id exactly `premium`. If the Android public key or Play products are not configured, the paywall should show that purchases are unavailable in the beta build.

RevenueCat setup requirements:

- The entitlement identifier must be exactly `premium`.
- Test Store products must be attached to the `premium` entitlement.
- Offerings must contain the products shown in the paywall.
- The app uses RevenueCat SDK `managementURL` when available for subscription management.

## Never Add Server Secrets To Mobile/EAS Public Env

Do not add these to root/mobile env or EAS public variables:

- `GROQ_API_KEY`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- Firebase Admin credentials
- Any backend-only secret

Groq calls must stay backend-only. The mobile app should only know the backend URL through `EXPO_PUBLIC_API_BASE_URL`.

## Preview APK Profile

The `preview` profile in `eas.json` is configured for an internal Android APK build and uses the EAS `preview` environment.

Use:

```bash
eas build --platform android --profile preview
```

## RevenueCat Env By Build Profile

Development profile / dev-client:

- `EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium`
- Do not set `EXPO_PUBLIC_REVENUECAT_BILLING_PROVIDER=google_play` unless intentionally testing platform billing in a dev-client.

Preview profile / release-style APK:

- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium`
- Do not set `EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY`.

Production profile:

- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium`
- Do not set `EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY`.
- Configure Google Play products/subscriptions and RevenueCat Google Play service credentials before enabling real purchase testing.

After the build installs, verify:

- The app starts without local `.env`.
- Firebase login works.
- The backend URL is not `localhost` unless testing on an emulator that can reach it.
- RevenueCat offerings load from the Android public key for release-style preview APKs when products are configured.
- If products are not configured yet, the paywall shows purchases unavailable instead of using the Test Store key.
- No Groq or Firebase Admin secrets exist in the mobile build configuration.

## Current Build Status

- GitHub Actions CI passed on merged `main` commit `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`.
- EAS preview Android build `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd` finished successfully.
- Latest preview APK still needs full physical-device manual QA before broader beta sharing.

## Remaining Preview QA

- Install the latest preview APK on a real Android phone.
- Verify signup/login, full interview flow, answer evaluation, Resume Analyzer PDF edge cases, RevenueCat Test Store purchase/restore, and notification banner behavior.
- Confirm the configured backend URL is reachable from tester devices.
