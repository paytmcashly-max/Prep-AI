# Staging Smoke Test

Use this checklist after deploying the backend and building the mobile app against the staging environment.

Status note: local LDPlayer APK launch smoke testing passed on May 8, 2026, but staging has not been verified. Keep this checklist unchecked until the backend is deployed to staging and the mobile app is built against the staging `EXPO_PUBLIC_API_BASE_URL`.

## Backend Tests

- [ ] `GET /health` returns HTTP 200
- [ ] `GET /ready` returns HTTP 200 when env is configured
- [ ] `POST /api/interview` without token returns HTTP 401
- [ ] `POST /api/evaluate` without token returns HTTP 401
- [ ] `POST /api/resume/analyze` without token returns HTTP 401
- [ ] Authenticated `POST /api/interview` returns a question
- [ ] Authenticated `POST /api/evaluate` returns score/feedback JSON
- [ ] Authenticated `POST /api/resume/analyze` returns resume analysis JSON
- [ ] Usage limits return HTTP 429 after the configured limit

## Mobile Tests

- [ ] App starts with staging `EXPO_PUBLIC_API_BASE_URL`
- [ ] Login works
- [ ] Interview question generation works
- [ ] Answer evaluation works
- [ ] Resume analysis works
- [ ] Usage limit messages appear correctly
- [ ] App does not crash if RevenueCat keys are missing
- [ ] No Groq/OpenAI keys exist in mobile env

## Privacy And Security Checks

- [ ] Resume text is not logged
- [ ] User answers are not logged
- [ ] Authorization header is not logged
- [ ] Firebase ID token is not logged
- [ ] `npm run security:audit` passes

## Final Commands

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```

## Current Follow-Up

- Deploy backend to staging.
- Build/install an APK that points to the staging backend.
- Run all backend, mobile, and privacy/security checks above.
- Record pass/fail results before beta distribution.
