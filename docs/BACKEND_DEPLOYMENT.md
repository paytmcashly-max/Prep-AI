# Backend Deployment

This guide covers deploying the PrepAI `/server` backend. The backend is a Node.js, Express, and TypeScript service that handles authenticated AI requests through Groq.

## Production Start

Run these commands from the repository root on the deployment host:

```sh
cd server
npm ci
npm run build
npm start
```

`npm start` runs the compiled server from `dist/index.js`.

## Required Environment Variables

Set these variables in the deployment platform's environment settings. Never commit real values to the repository.

```sh
PORT=3000
GROQ_API_KEY=
GROQ_QUESTION_MODEL=llama-3.1-8b-instant
GROQ_EVALUATION_MODEL=llama-3.3-70b-versatile
GROQ_RESUME_MODEL=llama-3.3-70b-versatile
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CORS_ORIGIN=
```

Notes:

- `GROQ_API_KEY` is server-only and must never be exposed to the Expo app.
- `FIREBASE_PRIVATE_KEY` may need escaped newlines depending on the host, for example `\n` instead of real line breaks.
- `CORS_ORIGIN` should be set to the deployed app or web origin allowed to call the backend.
- Keep server-only variables in backend deployment env or `server/.env` for local development.

## Health And Readiness

Use `/health` for liveness checks:

```sh
curl https://your-backend.example.com/health
```

Expected response:

```json
{ "ok": true }
```

Use `/ready` for readiness checks. This verifies that required Firebase and Groq configuration is present without exposing secret values:

```sh
curl https://your-backend.example.com/ready
```

Expected ready response:

```json
{
  "ok": true,
  "checks": {
    "firebase": true,
    "groq": true
  }
}
```

If required configuration is missing, `/ready` should return HTTP 503 with safe JSON.

## Post-Deploy Verification

After deploying:

- Confirm `/health` returns HTTP 200.
- Confirm `/ready` returns HTTP 200 only when required configuration is present.
- Confirm protected endpoints reject requests without Firebase auth.
- Confirm `CORS_ORIGIN` allows only the intended deployed origin.
- Confirm logs do not include API keys, Firebase tokens, resume text, or user answers.

## Protected API Routes

These routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header:

- `POST /api/interview`
- `POST /api/evaluate`
- `POST /api/resume/analyze`

Groq calls must remain backend-only. The mobile app should call these backend routes and must not call Groq directly.
