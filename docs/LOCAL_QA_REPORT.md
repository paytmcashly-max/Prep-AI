# Local QA Report

## Test Date

May 7, 2026

Beta cleanup update: May 8, 2026

APK smoke update: May 8, 2026

Dev-client real-device beta update: May 9, 2026

Preview APK build update: May 9, 2026

Preview login key-safety update: May 9, 2026

UI polish update: May 9, 2026

Tab header cleanup update: May 9, 2026

Preview APK real-device smoke update: May 9, 2026

## Test Environment

- Workspace: `C:\Users\kk701\Desktop\PrepAI`
- Mobile runtime: Expo Go on LDPlayer Android emulator
- Emulator device: `emulator-5554`
- Metro URL: `exp://172.20.10.7:8081`
- Backend URL used by mobile app: `http://172.20.10.7:3000`
- Backend local liveness: `GET /health` returned `{ "ok": true }`
- Backend local readiness: `GET /ready` returned `200` with Firebase and Groq checks passing
- Root/mobile env check: root `.env` only exposed `EXPO_PUBLIC_*` keys. No root/mobile Groq key, OpenAI key, or Firebase Admin private key was found.
- APK smoke build: `android/app/build/outputs/apk/release/app-release.apk`
- APK smoke package: `com.prepai.prepai`
- APK smoke version: `1.0.0`, `versionCode=1`, `minSdk=24`, `targetSdk=36`
- Merged main commit verified by CI: `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`
- GitHub Actions run: `https://github.com/paytmcashly-max/Prep-AI/actions/runs/25583955425`
- EAS preview build: `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd`
- EAS preview APK: `https://expo.dev/artifacts/eas/bSDJsCoEXs2u3tYg8bMNXp.apk`
- Latest preview APK smoke status: local same-WiFi beta candidate passed
- Current beta backend: local LAN backend, not public deployment

## Screens Tested

- App launch
- Home
- Login
- Signup
- Profile setup
- Practice/interview
- Answer feedback
- Resume Analyzer
- Profile/settings
- Legal placeholders
- Paywall / Razorpay beta-safe state
- APK launch smoke test
- Dev-client real-device regression

## Flows Passed

- App opened in LDPlayer without crashing after notification handling was fixed.
- Expo Go no longer showed the blocking `expo-notifications` warning after reload.
- Logout navigated back to Login.
- Invalid login showed a friendly error.
- Signup with synthetic QA data worked.
- Profile setup saved full name, job role, and experience, then navigated to Home.
- Home loaded without showing `Invalid interview request`.
- AI Tip of the Day used a local fallback tip instead of misusing `/api/interview`.
- Existing-user interview usage limit displayed the friendly daily question limit message.
- Fresh-user interview question generation called backend `POST /api/interview` with `category`, `difficulty`, and `jobRole`.
- Interview question loaded successfully.
- Answer evaluation called backend `POST /api/evaluate`; development logging did not include the answer, token, or Authorization header.
- Feedback displayed score, strengths, improvements, and ideal answer.
- Resume Analyzer rejected too-short resume text with a friendly message.
- Resume Analyzer sent safe dummy pasted text to backend `POST /api/resume/analyze`; development logging did not include resume text.
- Resume analysis displayed ATS score, missing keywords, grammar issues, and section feedback.
- Profile screen opened and showed settings/account/legal sections.
- Privacy Policy and Terms of Service placeholders opened safely.
- Earlier paywall fallback opened safely without payment keys; current paywall uses backend Razorpay status when configured.
- Backend tests passed.
- Backend build passed.
- Security audit passed.
- May 8 cleanup: `npm run format:check` now passes.
- May 8 cleanup: `npm run lint` now passes with no hook warnings.
- May 8 cleanup: interview question loading was inspected so each generated question is requested with a valid category, difficulty, and resolved job role defaults.
- May 8 cleanup: answer evaluation request construction was inspected and still sends question, answer, and resolved job role through the backend only.
- May 8 cleanup: Resume Analyzer now keeps PDF upload as the primary flow and hides pasted-text fallback behind an explicit toggle.
- May 8 APK smoke: release APK built successfully.
- May 8 APK smoke: APK installed on LDPlayer successfully.
- May 8 APK smoke: package `com.prepai.prepai` launched successfully.
- May 8 APK smoke: app opened without crashing.
- May 8 APK smoke: onboarding rendered correctly.
- May 8 APK smoke: Skip navigated to Login.
- May 8 APK smoke: Signup screen rendered.
- May 8 APK smoke: invalid signup showed a friendly error.
- May 8 APK smoke: no app `FATAL EXCEPTION` was found in logcat during launch/smoke testing.
- May 9 GitHub Actions: CI passed on merged `main` commit `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`.
- May 9 EAS: preview Android APK build finished successfully for merged `main`.
- May 9 dev-client real-device QA: premium quota bypass previously worked after Firestore subscription sync.
- May 9 security hardening: client-reported subscription sync is now non-authoritative; backend premium quota bypass requires server-side Razorpay verification or an Admin-written verified subscription status before beta.
- May 9 dev-client real-device QA: premium interview length selection worked for 5, 10, 15, and 20 question options.
- May 9 dev-client real-device QA: free users remained limited to 5 daily interview questions.
- May 9 dev-client real-device QA: Resume Analyzer flow worked.
- May 9 dev-client real-device QA: Home mock interview CTA routed to Practice instead of directly starting an HR round.
- May 9 notification cleanup: notification handler and Android channel were updated for SDK 54 banner/list behavior; actual preview APK banner behavior still needs manual verification.
- May 9 key-safety cleanup: Firebase login now validates that the bundled Firebase API key looks like a Firebase Web API key and shows a safe message without exposing raw key values.
- May 12 Razorpay update: mobile no longer includes a native purchase SDK. Razorpay secrets stay backend-only, and release-style APKs show the beta-safe payments-unavailable state when backend payment env is missing.
- May 9 UI polish: Home, Practice, Mock Interview, Resume, Progress, Profile, and Paywall screens were visually tightened for spacing, empty states, wording, and status clarity without adding new features.
- May 9 tab header cleanup: default tab headers for Home, Practice, Resume, Progress, and Profile were hidden so content starts from the app screen itself without the extra top title bar.
- May 9 preview APK real-device smoke: EAS build `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd` from commit `89d01fe2b2086b0a994e6bf7a28b65c7c3414897` passed as a local same-WiFi beta candidate.

## Backend Request Validation Observed

- `/api/interview` request body logged safely in development:
  - `category: "HR"`
  - `difficulty: "medium"`
  - `jobRole: "Full Stack Developer"`
- `/api/evaluate` request logging only included safe fields:
  - `jobRole: "Full Stack Developer"`
- `/api/resume/analyze` request logging only included safe fields:
  - `jobRole: "Full Stack Developer"`
- Authorization headers and Firebase ID tokens were not logged by the app.
- User answer and resume text were not logged by app request logging. One ADB command in system log contained synthetic typed answer text because the QA harness injected text with `adb shell input text`; this was not app logging.

## Bugs Found

- Expo Go displayed a notification warning because `expo-notifications` was imported statically.
- Previous logged-in user had already reached the interview usage limit, so question generation was blocked for that account. This was expected backend behavior and verified the friendly 429 UI.
- `npm run format:check` failed due existing formatting drift in 14 files.
- `npm run lint` passed with two existing React hook dependency warnings in `src/screens/MockInterviewScreen.js`.

## Bugs Fixed

- Updated `src/services/notificationService.js` so Expo Go skips notification module loading and push-token setup safely. Notifications still remain available for development/production builds.
- Ran Prettier on the 14 files reported by `npm run format:check`; the formatting check now passes.
- Fixed the two React hook warnings in `src/screens/MockInterviewScreen.js` by passing the intended question number into question loading and adding the missing category dependency.
- Updated `src/screens/ResumeScreen.js` so no-file submission shows a friendly prompt, PDF upload remains primary, file validation runs before analysis, and pasted resume text remains optional.

## Bugs Left As Follow-Up

- Manually test all 5 interview questions through session completion and Firestore session saving in one fresh account.
- Exhaust answer-evaluation and resume-analysis backend limits to verify 429 UI for those endpoints in-app.
- Manually test file picker validation with emulator files:
  - non-PDF rejection
  - empty file rejection where detectable
  - file larger than 5MB rejection where file size is available
- Replace legal placeholder alerts with final Privacy Policy and Terms URLs before launch.
- Rebuild after correcting EAS preview env if login shows an invalid Firebase API key message.
- Complete valid signup/login success testing in the latest preview APK.
- Complete a full interview session in the latest preview APK for both free and premium flows.
- Verify difficulty selection and premium interview length selection in the latest preview APK.
- Verify answer evaluation in the latest preview APK after a valid interview session starts.
- Test Resume Analyzer PDF picker edge cases in the APK build:
  - valid PDF under 5MB
  - non-PDF rejection
  - PDF over 5MB rejection where file size is available
- Verify the beta-safe payments-unavailable state in release-style APKs, or verify Razorpay payment link and status refresh if payment testing is enabled.
- Implement and verify server-side Razorpay subscription verification before relying on backend premium quota bypass.
- Verify Android notification banner/head-up behavior in the latest preview APK and enable channel/floating notification settings if needed.
- Deploy backend to a public URL before inviting external testers.
- Build a new preview APK with the public `EXPO_PUBLIC_API_BASE_URL`.
- Replace legal/support placeholder URLs before wider beta.

## Next Manual QA Required

- Valid signup/login in the preview APK.
- Full interview session in the preview APK.
- Difficulty selection and premium interview length selection in the preview APK.
- Answer evaluation in the preview APK.
- Resume valid PDF under 5MB in the preview APK.
- Non-PDF rejection in the preview APK.
- PDF over 5MB rejection if file size is available.
- No file selected friendly prompt.
- Razorpay beta-safe payments-unavailable state, or backend payment plan load if payment testing is enabled.
- Razorpay payment flow only after backend env and webhook are configured.
- refresh premium status.
- Notification banner/head-up display on Android.
- Small-screen visual QA for the May 9 UI polish pass.
- Verify tab screens do not show duplicate top titles and content remains visible on small Android screens.
- Deploy backend to a public URL.
- Build and test a new APK pointing at the public backend URL.
- Privacy Policy and Terms are hosted on the IntervueAI website. Support email is `kishan@kishan.codes`.

## Beta Gate

Beta can start only after:

- CI passes on GitHub.
- Full APK manual QA passes.
- Razorpay payment/status refresh is verified when backend payment env is configured.
- Backend is deployed to a public URL for external testers.
- No secrets are exposed.
- Backend URL is reachable from tester devices.

## Screenshot Paths

- `qa-screenshots/03_app_first_screen.png` - Home after notification fix
- `qa-screenshots/05_interview_error_area.png` - Friendly interview usage limit message
- `qa-screenshots/13_invalid_login.png` - Invalid login error
- `qa-screenshots/17_signup_result.png` - Signup success to Profile Setup
- `qa-screenshots/21_profile_save_result.png` - Home after profile setup save
- `qa-screenshots/22_fresh_interview_question.png` - Generated interview question
- `qa-screenshots/24_answer_feedback.png` - Feedback score
- `qa-screenshots/26_ideal_answer.png` - Ideal answer
- `qa-screenshots/29_resume_short_error.png` - Resume too-short validation
- `qa-screenshots/34_resume_analysis_details.png` - Resume analysis result
- `qa-screenshots/41_profile_legal_after_paywall.png` - Legal section
- `qa-screenshots/42_terms_placeholder.png` - Terms placeholder alert
- `qa-screenshots/39_paywall_alert.png` - Paywall payment placeholder alert
- `qa-screenshots/apk-launch.png` - APK onboarding launch screen
- `qa-screenshots/apk-after-skip.png` - APK Login screen after onboarding Skip
- `qa-screenshots/apk-signup.png` - APK Signup screen
- `qa-screenshots/apk-signup-error.png` - APK invalid signup friendly error

## Security Checks

- `npm run security:audit`: passed
- Manual root/mobile env key review: passed
- No direct mobile Groq/OpenAI API key usage found during this QA pass.
- No Firebase Admin private key found in root/mobile env.
- No app request logging of Authorization headers, Firebase ID tokens, user answers, or resume text observed.

## Commands Run

- `GET /health` against `http://localhost:3000` and `http://172.20.10.7:3000`
- `GET /ready` against `http://localhost:3000` and `http://172.20.10.7:3000`
- `npm run format:check` - failed due existing formatting drift
- `npm run lint` - passed with two warnings
- `npm run security:audit` - passed
- `cd server && npm run build` - passed
- `cd server && npm test` - passed
- May 8: `npm run format:check` - passed
- May 8: `npm run lint` - passed with no warnings
- May 8: `npm run security:audit` - passed
- May 8: `cd server && npm run build` - passed
- May 8: `cd server && npm test` - passed
- May 8 APK smoke: local Android release build passed with system JDK 17 and NDK `27.3.13750724`
- May 8 APK smoke: `adb install -r app-release.apk` on LDPlayer passed
- May 8 APK smoke: `adb shell monkey -p com.prepai.prepai` launched the app
- May 8 APK smoke: logcat review found no app `FATAL EXCEPTION` during launch/smoke testing
- May 9: GitHub Actions CI passed on merged `main` commit `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`
- May 9: EAS preview Android build `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd` finished successfully
- May 9: Preview APK real-device smoke passed as local same-WiFi beta candidate

## Final Recommendation

Ready for local same-WiFi beta testing. Not ready for external beta sharing yet.

The preview APK real-device smoke test passed against the local LAN backend. External testers should wait until the backend is deployed to a public URL, a new APK is built with that public API URL, Razorpay payment/status refresh is verified as needed, and final legal/support URLs replace placeholders.
