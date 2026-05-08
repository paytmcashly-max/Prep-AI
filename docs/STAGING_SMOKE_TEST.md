# Staging Smoke Test

Use this checklist after deploying the backend and building the mobile app against the staging environment.

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
