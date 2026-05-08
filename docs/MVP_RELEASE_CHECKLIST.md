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
- [ ] Real Android phone smoke test passes

## Subscriptions

- [x] RevenueCat keys are placeholders in `.env.example`
- [x] App does not crash without RevenueCat keys
- [x] Premium status defaults to false
- [x] Restore purchases path exists
- [ ] RevenueCat Test Store offerings verified in APK
- [ ] RevenueCat Test Store purchase and restore verified in APK

## Testing

- [x] Root lint passes
- [x] Root format check passes
- [x] Server build passes
- [x] Server tests pass
- [ ] CI passes on GitHub

CI note: `.github/workflows/ci.yml` exists locally but has not been pushed because the current GitHub token lacks `workflow` scope. Follow-up: refresh GitHub auth with `workflow` scope, push the workflow file, and verify CI passes on GitHub.

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

## Before Launch, Run These Commands

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```
