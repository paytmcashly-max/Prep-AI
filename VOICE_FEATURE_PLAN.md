# Voice Feature Release Plan

## Status

- Status: built and under active testing
- Public release: not yet
- Current public beta line: `1.0.0` with voice disabled
- Planned public voice release: `v1.2.0` or later

## Feature Flags

- Mobile flag: `EXPO_PUBLIC_ENABLE_VOICE_FEATURE`
- Backend flag: `ENABLE_VOICE_FEATURE`

### Public beta setting

- `EXPO_PUBLIC_ENABLE_VOICE_FEATURE=false`
- `ENABLE_VOICE_FEATURE=false`

### Internal testing setting

- `EXPO_PUBLIC_ENABLE_VOICE_FEATURE=true`
- `ENABLE_VOICE_FEATURE=true`

## Release Tracks

- Public beta/current release:
  - keep voice off
  - keep all public copy release-safe
- Internal voice QA:
  - use a non-`main` branch/build
  - enable both flags only for testers
- Future public voice release:
  - only after Android real-device testing passes
  - target `v1.2.0` or later

## Required Testing Before Public Release

- Android real-device recording
- Microphone permission handling
- Audio upload to backend
- Groq transcription through backend only
- Transcript preview and edit
- Evaluation reuse with existing interview flow
- Backend cleanup after transcription
- No secrets exposed to mobile or web
- No sensitive logs for transcripts, audio, or user private data

## Security Notes

- Groq stays backend-only
- Do not expose `GROQ_API_KEY` in mobile or web
- Do not commit `.env`, `server/.env`, Firebase Admin JSON, private keys, or keystores
- Keep public beta dark by default until release QA is complete

## Release Reminder

- Public beta: both flags must remain `false`
- Internal voice QA: both flags must be `true`
- Do not merge a voice-enabled public build directly into `main`
