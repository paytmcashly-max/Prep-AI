# Mobile Deployment

This guide covers mobile app environment setup and deployment preparation for the PrepAI Expo app.

## Mobile Environment Variables

Root/mobile environment variables must use the `EXPO_PUBLIC_` prefix because Expo bundles these values into the app at build time.

Set these values in local `.env` files or the build platform environment:

```sh
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_ANALYTICS_ENABLED=false
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://example.com/prepai/privacy
EXPO_PUBLIC_TERMS_URL=https://example.com/prepai/terms
EXPO_PUBLIC_SUPPORT_EMAIL=support@example.com
```

Important rules:

- `EXPO_PUBLIC_*` values are bundled into the app and should be treated as public.
- Never put `GROQ_API_KEY` in root/mobile env.
- Never put Firebase Admin credentials in root/mobile env.
- Never put `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, or other server-only credentials in root/mobile env.
- Backend secrets belong only in `/server` env or the backend deployment platform.
- `EXPO_PUBLIC_API_BASE_URL` should point to the deployed backend for production builds.
- Production builds should be tested with a real backend URL, not `localhost`.

## Local Development

From the repository root:

```sh
npm install
npm run start
```

Platform commands:

```sh
npm run android
npm run ios
npm run web
```

For local mobile testing against a local backend, use a device-accessible backend URL for `EXPO_PUBLIC_API_BASE_URL`. Android emulators and physical devices cannot use the developer machine's `localhost` directly.

## Pre-Release Checks

Run these checks before creating production builds:

```sh
npm run format:check
npm run lint
npm run security:audit
```

The security audit helps catch accidental mobile references to server-only secrets and risky logging patterns.

## Production Build Notes

- Confirm `EXPO_PUBLIC_API_BASE_URL` points to the deployed backend.
- Confirm the backend `/health` and `/ready` endpoints pass before testing the app.
- Confirm Firebase Auth and Firestore projects match the intended production Firebase project.
- Confirm RevenueCat public API keys are platform-specific and entitlement id matches RevenueCat dashboard configuration.
- Confirm Privacy Policy URL, Terms URL, and support email placeholders are replaced with final public values before store submission.
- Confirm Sentry and analytics settings do not capture resume text, user answers, Firebase tokens, Authorization headers, or API keys.
