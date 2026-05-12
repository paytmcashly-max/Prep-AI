# Backend Deployment

This guide covers deploying the IntervueAI `/server` backend. The backend is a Node.js, Express, and TypeScript service that handles authenticated AI requests through Groq.

## Production Start

Run these commands from the repository root on the deployment host:

```sh
cd server
npm ci
npm run build
npm start
```

`npm start` runs the compiled server from `dist/index.js`.

## Recommended Beta Host

For the first public beta, use a single Render Web Service. IntervueAI's backend is one Node.js API service with no separate worker or database process, so Render's Git-backed web service flow is the simplest option to operate and verify.

Recommended Render settings:

- Service type: Web Service
- Root directory: `server`
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/health`

Render provides a `PORT` environment variable for web services. The server already reads `process.env.PORT`, so do not hardcode a port in the code or deployment command.

Other options:

- Railway is also simple for Node.js apps, but Render's explicit health check path and dashboard flow are a good fit for this beta API.
- Fly.io is powerful but usually adds more setup and operations overhead than needed for the first beta.
- A VPS is not recommended for this stage because it requires manual TLS, process management, firewall, deploy, and monitoring work.

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

## Render Deployment Steps

1. Push the backend code to GitHub from an approved branch.
2. In Render, create a new Web Service from `https://github.com/paytmcashly-max/Prep-AI`.
3. Set Root Directory to `server`.
4. Set Build Command to `npm ci && npm run build`.
5. Set Start Command to `npm start`.
6. Set Health Check Path to `/health`.
7. Add the required environment variables in the Render dashboard. Do not paste real values into source files or commit them.
8. Deploy the service and wait for it to become live.
9. Verify:

```sh
curl https://your-render-service.onrender.com/health
curl https://your-render-service.onrender.com/ready
```

`/ready` should return HTTP 200 only after Firebase Admin and Groq environment variables are configured.

## Mobile Preview Env After Deployment

After the backend has a public URL, update the EAS preview environment:

```sh
EXPO_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com
```

Then create a fresh preview APK for testers. Local LAN URLs such as `http://172.20.10.7:3000` are only for same-Wi-Fi testing and should not be used for external beta testers.

## Protected API Routes

These routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header:

- `POST /api/interview`
- `POST /api/evaluate`
- `POST /api/resume/analyze`

Groq calls must remain backend-only. The mobile app should call these backend routes and must not call Groq directly.
