# MVP Release Checklist

Use this checklist before preparing the PrepAI MVP for store submission or public testing.

## Security

- [ ] No real secrets committed
- [ ] `GROQ_API_KEY` only used in backend/server env
- [ ] No OpenAI keys
- [ ] Firebase rules deny public read/write
- [ ] Resume text and user answers are not logged
- [ ] `npm run security:audit` passes

## Backend

- [ ] `/health` works
- [ ] `/ready` works
- [ ] `/api/interview` protected by Firebase auth
- [ ] `/api/evaluate` protected by Firebase auth
- [ ] `/api/resume/analyze` protected by Firebase auth
- [ ] Rate limits work
- [ ] Firestore usage tracking works
- [ ] Groq fallback works when key is missing

## Mobile

- [ ] Login works
- [ ] Interview question generation works
- [ ] Answer evaluation works
- [ ] Resume analysis works
- [ ] Usage limit messages are user-friendly
- [ ] No direct Groq/OpenAI calls from React Native
- [ ] No secrets in Expo env

## Subscriptions

- [ ] RevenueCat keys are placeholders in `.env.example`
- [ ] App does not crash without RevenueCat keys
- [ ] Premium status defaults to false
- [ ] Restore purchases path exists

## Testing

- [ ] Root lint passes
- [ ] Root format check passes
- [ ] Server build passes
- [ ] Server tests pass
- [ ] CI passes on GitHub

## Launch

- [ ] App name finalized
- [ ] Privacy policy drafted
- [ ] Terms drafted
- [ ] App screenshots prepared
- [ ] Play Store listing draft prepared
- [ ] Support email ready

## Before Launch, Run These Commands

```sh
npm run format:check
npm run lint
npm run security:audit
cd server && npm run build
cd server && npm test
```
