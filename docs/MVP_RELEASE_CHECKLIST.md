# MVP Release Checklist

Use this checklist before preparing the PrepAI MVP for store submission or public testing.

## Security

- [x] No real secrets committed
- [x] `GROQ_API_KEY` only used in backend/server env
- [x] No OpenAI keys
- [x] Firebase rules deny public read/write
- [ ] Resume text and user answers are not logged
- [x] `npm run security:audit` passes

## Backend

- [x] `/health` works
- [x] `/ready` works
- [x] `/api/interview` protected by Firebase auth
- [x] `/api/evaluate` protected by Firebase auth
- [x] `/api/resume/analyze` protected by Firebase auth
- [ ] Rate limits work
- [ ] Firestore usage tracking works
- [ ] Groq fallback works when key is missing

## Mobile

- [ ] Login works
- [ ] Interview question generation works
- [ ] Answer evaluation works
- [ ] Resume analysis works
- [ ] Usage limit messages are user-friendly
- [x] APK launch smoke test passes on LDPlayer
- [x] Onboarding renders in APK smoke test
- [x] Login and Signup screens render in APK smoke test
- [x] Invalid signup shows a friendly error in APK smoke test
- [x] No app fatal crash found during APK launch smoke test
- [x] No direct Groq/OpenAI calls from React Native
- [x] No secrets in Expo env
- [ ] Full valid signup/login flow verified in APK
- [ ] Full 5-question interview session verified in APK
- [ ] Resume PDF picker edge cases verified in APK
- [x] Dev-client real-device regression passed for interview length, free-user limit, and resume flow
- [x] EAS preview APK build completes on merged `main`
- [x] Latest preview APK real Android phone smoke test passes on local same-WiFi backend
- [ ] Notification banner/head-up behavior verified in latest preview APK

## Subscriptions

- [x] RevenueCat keys are placeholders in `.env.example`
- [x] App does not crash without RevenueCat keys
- [x] Premium status defaults to false
- [x] Restore purchases path exists
- [ ] RevenueCat Test Store offerings verified in APK
- [ ] RevenueCat Test Store purchase and restore verified in APK
- [ ] RevenueCat entitlement id verified as exactly `premium`
- [ ] RevenueCat Test Store products attached to the `premium` entitlement and included in offerings
- [ ] Release-style preview APKs and Google Play builds verified without RevenueCat Test Store API key
- [ ] Server-side RevenueCat verification or webhook updates verified subscription status before backend premium quota bypass

## Testing

- [x] Root lint passes
- [x] Root format check passes
- [x] Server build passes
- [x] Server tests pass
- [x] CI passes on GitHub

CI note: GitHub Actions passed on merged `main` commit `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`. Keep this checked only while the latest required checks continue to pass.

## Launch

- [x] App name finalized
- [x] Privacy policy drafted
- [x] Terms drafted
- [ ] App screenshots prepared
- [x] Play Store listing draft prepared
- [ ] Support email ready
- [ ] Final Privacy Policy URL ready
- [ ] Final Terms URL ready
- [ ] Production backend deployed
- [ ] Production env verified
- [x] Local same-WiFi beta candidate smoke test passed
- [ ] Public backend deployed for external testers
- [ ] New APK built with public `EXPO_PUBLIC_API_BASE_URL`
- [ ] Final legal/support URLs replaced before wider beta
- [ ] Latest preview APK full manual QA completed against public backend

## Before Launch, Run These Commands

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```
