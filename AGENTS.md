# AGENTS.md

## Project

Prep-AI is an Expo / React Native interview-preparation app for job seekers.

## Product Goal

Help users practice interviews, analyze resumes, and improve job readiness using AI.

## Tech Stack

- Expo / React Native
- Firebase Auth / Firestore / Storage
- RevenueCat
- Node.js backend planned
- OpenAI/Groq through backend only

## Non-Negotiable Rules

- Keep PRs small and focused.
- Do not expose API keys in the mobile app.
- Do not call OpenAI, Groq, or any AI provider directly from React Native.
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

## Before Finishing Any Task

- Summarize what changed.
- List files changed.
- Mention any risks or follow-up tasks.
- If tests/checks are unavailable, say that clearly.

## Current Priority

Stabilize the codebase before adding more features:

1. Documentation
2. Toolchain pinning
3. Linting and formatting
4. CI
5. Backend for AI calls
6. Auth verification and rate limiting
7. Tests
