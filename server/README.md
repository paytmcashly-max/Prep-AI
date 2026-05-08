# PrepAI Server

Node.js, Express, and TypeScript backend for PrepAI. The server verifies Firebase ID tokens, validates API request bodies, enforces rate limits and usage limits, and keeps Groq API calls backend-only.

## Setup

```sh
cd server
npm install
```

Create `server/.env` from `server/.env.example` and add backend-only secrets there. Do not place `GROQ_API_KEY` or Firebase Admin credentials in the mobile/root env.

## Run Locally

```sh
npm run dev
```

## Build And Start

```sh
npm run build
npm start
```

## Health And Readiness

Liveness:

```sh
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true }
```

Readiness:

```sh
curl http://localhost:3000/ready
```

Expected response when required env is configured:

```json
{
  "ok": true,
  "checks": {
    "firebase": true,
    "groq": true
  }
}
```

## Protected Endpoints

These routes require `Authorization: Bearer <Firebase ID token>`:

- `POST /api/interview`
- `POST /api/evaluate`
- `POST /api/resume/analyze`

Example interview request:

```sh
curl -X POST http://localhost:3000/api/interview \
  -H "Authorization: Bearer <Firebase ID token>" \
  -H "Content-Type: application/json" \
  -d "{\"jobRole\":\"Frontend Developer\",\"category\":\"HR\",\"difficulty\":\"easy\"}"
```

## Scripts

- `npm run dev` starts the TypeScript server in watch mode.
- `npm run build` compiles TypeScript into `dist`.
- `npm start` runs the compiled server.
- `npm test` runs backend tests.

## Security Notes

- Groq calls must remain backend-only.
- Do not log resume text, user answers, Firebase ID tokens, Authorization headers, API keys, or Firebase private keys.
- Use `/ready` to confirm required backend configuration exists without exposing secret values.
