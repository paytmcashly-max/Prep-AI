# MVP Release Checklist

Use this checklist before preparing the IntervueAI MVP for store submission or public testing.

## Security

- [x] No real secrets committed
- [x] `GROQ_API_KEY` only used in backend/server env
- [x] No OpenAI keys
- [x] Firebase rules deny public read/write
- [x] Resume text and user answers are not logged by app/backend request diagnostics
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

## Payments

- [x] Previous native purchase SDK removed
- [x] Premium status defaults to false
- [x] Mobile never grants premium directly
- [x] Backend premium bypass requires `verificationStatus === "server_verified"`
- [x] External beta can run with payments unavailable while free limits remain usable
- [x] Public landing website source added under `/web`
- [x] `/web` deployed to Vercel at `https://intervueai.vercel.app`
- [ ] Deployed website URL submitted to Razorpay as app/website link
- [ ] Razorpay backend env configured
- [ ] Razorpay webhook configured and verified
- [ ] Monthly and yearly Razorpay payment links tested
- [ ] Premium status refresh verified after payment
- [ ] Paywall payments-unavailable state verified when Razorpay env is missing

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
- [x] Deployed IntervueAI website URL ready
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
- [ ] Razorpay backend env and webhook verification enabled if payments are required

## Before Launch, Run These Commands

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```
