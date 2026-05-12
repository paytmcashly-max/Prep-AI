# Mobile Deployment

This guide covers mobile app environment setup and deployment preparation for the IntervueAI Expo app.

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
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://example.com/prepai/privacy
EXPO_PUBLIC_TERMS_URL=https://example.com/prepai/terms
EXPO_PUBLIC_SUPPORT_EMAIL=kishan@kishan.codes
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
- Confirm `EXPO_PUBLIC_FIREBASE_API_KEY` is the Firebase Web API key.
- Confirm the backend `/health` and `/ready` endpoints pass before testing the app.
- Confirm Firebase Auth and Firestore projects match the intended production Firebase project.
- Razorpay secrets belong only in backend env, never in Expo `EXPO_PUBLIC_*` env.
- If Razorpay backend env is missing, the paywall should show that premium payments are unavailable in the beta build.
- Confirm Razorpay webhook verification is configured before relying on automatic premium activation.
- Confirm backend subscription documents use `verificationStatus: "server_verified"` before premium quota bypass.
- Confirm Privacy Policy URL, Terms URL, and support email are correct before store submission.
- Confirm Sentry and analytics settings do not capture resume text, user answers, Firebase tokens, Authorization headers, or API keys.

## External Beta Without Billing

External beta APKs can be shared before purchases are enabled. In that mode:

- Do not put Razorpay secrets in Expo public env.
- Leave payments unavailable until backend Razorpay env and webhook verification are ready.
- The paywall should show that premium payments are not available in this beta build.
- Free interview and resume limits should continue to work through the backend.

When payments are ready, configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET`, plan amounts, and webhook URL on the backend.

## Public Website For Razorpay

The IntervueAI public landing website lives in `/web` and is deployed at:

```text
https://intervueai.vercel.app
```

Deploy it as a separate Vercel project with:

- Root directory: `web`
- Build command: `npm run build`
- Output directory: default/empty for Next.js

Submit the deployed Vercel URL to Razorpay as the app/website link. Do not put
Razorpay secrets in the website or the Expo mobile app. The backend webhook URL
remains:

```text
https://YOUR_BACKEND_DOMAIN/api/payments/razorpay/webhook
```

## OTA Updates

EAS Update can ship JS/UI-compatible bug fixes without asking users to install a new APK. Native dependency, Expo plugin, app config, permission, or runtime changes still require a new APK build.

Preview OTA command:

```sh
eas update --branch preview --message "Describe the JS/UI fix"
```

See [EAS Update / OTA updates](EAS_UPDATES.md) before publishing updates.
