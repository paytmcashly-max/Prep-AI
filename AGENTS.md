# AGENTS.md

## Project

IntervueAI is an Expo / React Native interview-preparation app for job seekers.

## Product Goal

Help users practice interviews, analyze resumes, and improve job readiness using AI.

## Tech Stack

- Expo / React Native
- Firebase Auth / Firestore / Storage
- Razorpay
- Node.js / Express / TypeScript backend in `/server`
- Groq through backend only

## Non-Negotiable Rules

- Keep PRs small and focused.
- Do not expose API keys in the mobile app.
- Groq is used for free/dev-stage AI usage and must stay backend-only.
- OpenAI is not used for now.
- Do not call Groq, OpenAI, or any AI provider directly from React Native.
- All privileged AI calls must go through a backend.
- Do not add dependencies unless necessary.
- Explain every new dependency.
- Do not change unrelated files.
- Do not rewrite large files unless asked.
- Prefer simple readable code.

## Security Rules

- Never commit .env files.
- Never hardcode secrets.
- Treat resume data as sensitive personal data.
- Validate all user inputs.
- Validate uploaded files by type and size.
- Do not log resumes, API keys, tokens, or user private data.
- Firebase security rules must be considered before production.

## Commands

- `npm install`
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run format:check`
- `npm run lint`
- `npm run security:audit`
- `cd server && npm run build`
- `cd server && npm test`

## Before Finishing Any Task

- Summarize what changed.
- List files changed.
- Mention any risks or follow-up tasks.
- If tests/checks are unavailable, say that clearly.

## Current Priority

Stabilize the codebase before adding more features:

1. Finish manual APK QA
2. Verify full interview, resume, and Razorpay flows
3. Replace legal/support placeholders before launch
4. Push and verify GitHub Actions CI after auth has `workflow` scope
5. Keep backend AI, auth verification, usage limits, and tests stable
