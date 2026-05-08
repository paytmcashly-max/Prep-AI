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
- `EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`

`EXPO_PUBLIC_API_BASE_URL` should point to a deployed backend URL for testers. A local IP only works when the phone or emulator can reach the developer machine on the same network.

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

After the build installs, verify:

- The app starts without local `.env`.
- Firebase login works.
- The backend URL is not `localhost` unless testing on an emulator that can reach it.
- RevenueCat Test Store offerings load if the Test Store key is configured.
- No Groq or Firebase Admin secrets exist in the mobile build configuration.
