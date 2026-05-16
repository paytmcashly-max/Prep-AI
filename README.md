# IntervueAI

IntervueAI is an Expo / React Native interview-preparation app for job seekers.
It helps users practice mock interviews, receive answer feedback, analyze resumes,
and track preparation progress.

Tagline: **Practice smarter. Interview better.**

## Project Overview

The product is split into two main parts:

- Mobile app: Expo / React Native app for authentication, interview practice, resume analysis, progress tracking, profile, and subscription UI.
- Backend: Node.js / Express / TypeScript API for authenticated AI features and server-side usage limits.

Groq is used for free/dev-stage AI usage from the backend only. The mobile app must never contain `GROQ_API_KEY`. OpenAI is not used for now.

## Tech Stack

- Expo / React Native
- Firebase Auth for authentication
- Firebase Firestore / Storage
- Node.js / Express / TypeScript backend
- Groq through backend-only API routes
- Razorpay integration with safe fallback
- ESLint, Prettier, Jest, Vitest, Supertest

## Repository Structure

```text
.
|-- App.js
|-- app.config.js
|-- app.json
|-- src/
|   |-- components/
|   |-- navigation/
|   |-- screens/
|   |-- services/
|   |-- store/
|   `-- utils/
|-- server/
|   |-- src/
|   |-- tests/
|   `-- package.json
|-- docs/
|-- scripts/
`-- .github/
```

## Prerequisites

- Node.js `20.19.x`
- npm
- Expo development environment
- Firebase project for Auth, Firestore, and Storage
- Backend environment for server-only secrets

Use `.nvmrc` where supported:

```sh
nvm use
```

## Mobile App Setup

Install root dependencies:

```sh
npm install
```

Create a root `.env` from `.env.example` and fill only public Expo variables. Do not add backend secrets to the root/mobile env.

## Backend Setup

Install backend dependencies:

```sh
cd server
npm install
```

Create `server/.env` from `server/.env.example` and add backend-only values there.

## Environment Variables

Root/mobile env uses `EXPO_PUBLIC_*` variables. These values are bundled into the app and are not secret.

Important rules:

- Never put `GROQ_API_KEY` in root/mobile env.
- Never put Firebase Admin credentials in root/mobile env.
- Backend secrets belong only in `/server` env or the backend deployment platform.
- `EXPO_PUBLIC_API_BASE_URL` should point to the deployed backend API for preview/beta builds.
- `EXPO_PUBLIC_API_BASE_URL_LOCAL` should point to a device-reachable local backend for Expo Go testing.
- `EXPO_PUBLIC_SITE_URL` should point to the deployed website domain so app legal/support links stay aligned.
- Razorpay payment verification is backend-only.
- Mobile never grants premium directly.
- Backend premium quota bypass requires `verificationStatus === "server_verified"`.
- OpenAI keys are not used for now and should not be added.
- Public beta should keep `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH=false` until Android OAuth, SHA fingerprints, and real-device testing are complete.

Recommended preview/mobile auth env:

- `EXPO_PUBLIC_API_BASE_URL` for preview/standalone builds (example: `https://intervueai-api.onrender.com`)
- `EXPO_PUBLIC_API_BASE_URL_LOCAL` for Expo Go / emulator testing (example: `http://192.168.1.100:3000`)
- `EXPO_PUBLIC_SITE_URL` (example: `https://intervueai.tech`)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional unless analytics depends on it)
- `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH=false` for public beta
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` only when Google auth is intentionally being tested

Verification email delivery is backend-only when Resend is configured. Add these to `server/.env` only:

- `RESEND_API_KEY`
- `EMAIL_FROM` (example: `IntervueAI <hello@intervueai.tech>`)
- `EMAIL_REPLY_TO` (optional)
- `APP_PUBLIC_URL` (example: `https://intervueai.tech`) so verification emails open the branded `/verify-email` page instead of the default Firebase hosted page

For the website verify page, make sure the web deployment also has Firebase public client config available. The verify page accepts either `NEXT_PUBLIC_FIREBASE_*` variables or the same `EXPO_PUBLIC_FIREBASE_*` values used by the mobile app:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- `NEXT_PUBLIC_SITE_URL` so metadata and website links stay environment-backed
- `NEXT_PUBLIC_APK_DOWNLOAD_URL` so the public APK download can be updated without editing code
- `NEXT_PUBLIC_APP_DEEP_LINK` if the website should open a different app deep link than `prepai://`

After updating EAS preview env values, rebuild with:

```sh
eas build --platform android --profile preview --clear-cache
```

See [docs/MOBILE_DEPLOYMENT.md](docs/MOBILE_DEPLOYMENT.md), [docs/BACKEND_DEPLOYMENT.md](docs/BACKEND_DEPLOYMENT.md), and [docs/PRODUCTION_ENV_CHECKLIST.md](docs/PRODUCTION_ENV_CHECKLIST.md).

## Brand Rename Notes

The user-facing brand is IntervueAI. Technical identifiers are intentionally kept
stable during this rename:

- Android package: `com.prepai.prepai`
- iOS bundle identifier: `com.prepai.app`
- Expo slug and scheme: `prepai`
- EAS project ID unchanged

Before launch, replace the app icon, splash image, adaptive icon, legal URLs, and
support email with final IntervueAI assets and destinations.

## Running Locally

Root/mobile commands:

```sh
npm run start
npm run android
npm run ios
npm run web
```

Server commands:

```sh
cd server
npm run dev
```

API target selection is automatic:

- Expo Go prefers `EXPO_PUBLIC_API_BASE_URL_LOCAL`
- Preview / standalone APK builds prefer `EXPO_PUBLIC_API_BASE_URL`

For mobile devices or emulators, `EXPO_PUBLIC_API_BASE_URL_LOCAL` must use a device-accessible backend URL instead of plain `localhost`.

## Testing And Checks

Root/mobile checks:

```sh
npm run format:check
npm run lint
npm run security:audit
```

Server checks:

```sh
cd server
npm run build
npm test
```

## Security Rules

- Do not commit real `.env` files.
- Do not hardcode secrets.
- Do not call Groq or any AI provider directly from React Native.
- Do not expose `GROQ_API_KEY` in the mobile app.
- Do not add OpenAI integration unless the project explicitly changes direction.
- Do not log resume text, interview answers, Firebase ID tokens, Authorization headers, API keys, or private user data.
- Validate user inputs and uploaded files.
- Firebase security rules must deny public read/write before production.

## Useful Docs

- [Backend deployment](docs/BACKEND_DEPLOYMENT.md)
- [Mobile deployment](docs/MOBILE_DEPLOYMENT.md)
- [Payment strategy](docs/PAYMENT_STRATEGY.md)
- [Razorpay onboarding](docs/RAZORPAY_ONBOARDING.md)
- [Production environment checklist](docs/PRODUCTION_ENV_CHECKLIST.md)
- [EAS Update / OTA updates](docs/EAS_UPDATES.md)
- [EAS preview build setup](docs/EAS_PREVIEW_BUILD_SETUP.md)
- [APK manual QA checklist](docs/APK_MANUAL_QA_CHECKLIST.md)
- [Local QA report](docs/LOCAL_QA_REPORT.md)
- [Staging smoke test](docs/STAGING_SMOKE_TEST.md)
- [MVP release checklist](docs/MVP_RELEASE_CHECKLIST.md)
- [Beta testing plan](docs/BETA_TESTING_PLAN.md)
- [Privacy Policy draft](docs/PRIVACY_POLICY_DRAFT.md)
- [Terms of Service draft](docs/TERMS_OF_SERVICE_DRAFT.md)

## Contribution Workflow

1. Keep changes small and focused.
2. Read `AGENTS.md` before starting work.
3. Do not modify unrelated files.
4. Explain any new dependency before adding it.
5. Run relevant checks before finishing.
6. Summarize changed files, risks, and follow-up tasks.

Suggested final check before opening a PR:

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```
