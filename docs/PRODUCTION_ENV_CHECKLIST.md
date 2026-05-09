# Production Environment Checklist

Use separate development, staging, and production environment values. Do not commit real `.env` files.

Status note: production environment setup has not been verified yet. Keep the items below unchecked until actual production values are configured and tested. The current preview APK passed as a local same-WiFi beta candidate, but external testers still need a deployed public backend URL and a new APK built with that URL.

## Mobile / Expo Public Env

`EXPO_PUBLIC_*` variables are bundled into the app and are not secret.

- [ ] `EXPO_PUBLIC_API_BASE_URL`
- [ ] `EXPO_PUBLIC_FIREBASE_API_KEY`
- [ ] `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `EXPO_PUBLIC_FIREBASE_APP_ID`
- [ ] `EXPO_PUBLIC_SENTRY_DSN`
- [ ] `EXPO_PUBLIC_ANALYTICS_ENABLED`
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- [ ] `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- [ ] `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- [ ] `EXPO_PUBLIC_TERMS_URL`
- [ ] `EXPO_PUBLIC_SUPPORT_EMAIL`

Rules:

- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the deployed backend for production builds.
- [ ] `GROQ_API_KEY` is not present in mobile/root env.
- [ ] Firebase Admin credentials are not present in mobile/root env.
- [ ] No private backend keys are present in Expo public env.
- [ ] Legal/support placeholders are replaced with final public URL/email values before launch.

## Backend / Server Private Env

Backend variables are server-only and must be configured in the backend deployment environment.

- [ ] `PORT`
- [ ] `GROQ_API_KEY`
- [ ] `GROQ_QUESTION_MODEL`
- [ ] `GROQ_EVALUATION_MODEL`
- [ ] `GROQ_RESUME_MODEL`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `CORS_ORIGIN`

Rules:

- [ ] `GROQ_API_KEY` exists only in backend/server env.
- [ ] `FIREBASE_PRIVATE_KEY` exists only in backend/server env.
- [ ] `FIREBASE_CLIENT_EMAIL` exists only in backend/server env.
- [ ] `CORS_ORIGIN` is set to the intended deployed app or web origin.
- [ ] Real backend env values are not committed.

## Final Verification Commands

```sh
npm run security:audit
npm run format:check
npm run lint
cd server && npm run build
cd server && npm test
```

## Current Follow-Up

- Deploy the backend to a public URL before external beta testing.
- Build a new preview APK with public `EXPO_PUBLIC_API_BASE_URL`.
- Configure production backend/private env on the deployment platform.
- Configure production Expo public env with final backend URL and legal/support values.
- Run staging and production smoke tests before marking this checklist complete.
