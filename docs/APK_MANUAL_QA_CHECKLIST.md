# APK Manual QA Checklist

Use this checklist for final manual QA on an EAS preview Android APK.

## Test Setup

| Item                         | Expected Result                                          | Pass/Fail | Notes                                                                  |
| ---------------------------- | -------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| Build release APK            | `app-release.apk` builds successfully                    | Pass      | Verified locally on May 8, 2026                                        |
| EAS preview APK build        | Preview profile produces an Android APK                  | Pass      | Build `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd` finished on merged `main` |
| Install preview APK          | APK installs without errors                              | Pass      | Installed on LDPlayer and real Android phone                           |
| Open app                     | App opens without crashing                               | Pass      | Package `com.prepai.prepai` launched; no fatal launch crash found      |
| Backend URL                  | `EXPO_PUBLIC_API_BASE_URL` points to a reachable backend | Pass      | Local same-WiFi LAN backend reached during real-device smoke           |
| Firebase config              | Signup/login screens do not show invalid API key errors  | Pass      | Preview APK real-device smoke passed                                   |
| RevenueCat Test Store config | Test Store offerings load if configured                  | Pending   | Use Test Store key for pre-Play-Store dev-client/local preview APK QA  |
| Real device test             | APK opens on a physical Android phone                    | Pass      | Preview APK real-device smoke passed on local same-WiFi backend        |

## Core App Flow

| Item                  | Expected Result                                              | Pass/Fail | Notes                                                              |
| --------------------- | ------------------------------------------------------------ | --------- | ------------------------------------------------------------------ |
| Onboarding render     | Onboarding screen appears after launch                       | Pass      | Verified in installed APK                                          |
| Skip to Login         | Skip navigates to Login                                      | Pass      | Verified in installed APK                                          |
| Signup screen render  | Signup screen appears                                        | Pass      | Verified in installed APK                                          |
| Invalid signup error  | Invalid signup shows a friendly error                        | Pass      | Verified with invalid email input                                  |
| Signup                | New test user can create an account                          | Pending   | Valid signup success still needs APK verification                  |
| Login                 | Existing test user can log in                                | Pending   | Not verified in installed APK                                      |
| Home screen           | Home loads with greeting, streak, tip, and recent sessions   | Pending   | Not verified in installed APK after valid login                    |
| AI tip                | Tip does not show `Invalid interview request`                | Pending   | Not verified in installed APK after valid login                    |
| Legal links           | Privacy Policy and Terms of Service open safely              | Pending   | Not verified in installed APK                                      |
| Notification banner   | Local notification can show as a banner/head-up alert        | Pending   | Handler/channel updated; verify Android/MIUI notification settings |
| UI polish             | Core screens use consistent spacing, cards, and empty states | Pending   | May 9 polish pass needs preview APK visual QA                      |
| Tab headers           | Tab screens do not show duplicate top titles                 | Pending   | Header hidden in tab navigator; verify no content is cut off       |
| No fatal launch crash | Logcat has no app `FATAL EXCEPTION` during launch smoke      | Pass      | Verified during LDPlayer APK launch/smoke test                     |

## Latest Preview APK Smoke Result

| Item                  | Value                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Commit SHA            | `89d01fe2b2086b0a994e6bf7a28b65c7c3414897`                       |
| EAS Build ID          | `580dd40b-ba5a-4f3f-a6c2-1c94dfb1accd`                           |
| Status                | Local same-WiFi beta candidate passed                            |
| Backend               | Local LAN backend at same-WiFi URL; not yet deployed publicly    |
| External beta blocker | Deploy backend to a public URL and rebuild APK with that API URL |

## Dev-Client Real-Device Regression

These items were verified in the installed development build after the beta fixes. They still need one final pass in the latest preview APK before broader beta sharing.

| Item                    | Expected Result                                          | Pass/Fail | Notes                                 |
| ----------------------- | -------------------------------------------------------- | --------- | ------------------------------------- |
| Premium quota bypass    | Premium user is not blocked by free interview quota      | Pass      | Verified in dev-client real-device QA |
| Interview length        | Premium user can choose 5, 10, 15, or 20 questions       | Pass      | Verified in dev-client real-device QA |
| Free-user limit         | Free user remains limited to 5 daily interview questions | Pass      | Verified in dev-client real-device QA |
| Resume flow             | Resume upload/analyze flow works                         | Pass      | Verified in dev-client real-device QA |
| Home mock interview CTA | Home routes to Practice instead of starting HR directly  | Pass      | Verified after UX fix                 |

## Interview Flow

| Item                    | Expected Result                                                | Pass/Fail | Notes |
| ----------------------- | -------------------------------------------------------------- | --------- | ----- |
| Start interview         | First question loads from backend                              | Pending   |       |
| Question requests       | Requests include `jobRole`, `category`, and `difficulty`       | Pending   |       |
| Safe defaults           | Missing profile fields use safe defaults                       | Pending   |       |
| Answer evaluation       | Submitting an answer returns score and feedback                | Pending   |       |
| Full 5-question session | User can complete all 5 questions without crash                | Pending   |       |
| Summary screen          | Summary screen shows average score                             | Pending   |       |
| Firestore session save  | Session is saved under the user if implemented                 | Pending   |       |
| Sensitive logging       | User answers, tokens, and Authorization headers are not logged | Pending   |       |

## Resume Analyzer

| Item                | Expected Result                              | Pass/Fail | Notes |
| ------------------- | -------------------------------------------- | --------- | ----- |
| No file selected    | Analyze action shows friendly prompt         | Pending   |       |
| Valid PDF under 5MB | PDF uploads and analysis result appears      | Pending   |       |
| Non-PDF file        | File is rejected with friendly message       | Pending   |       |
| PDF over 5MB        | File is rejected if file size is available   | Pending   |       |
| Paste fallback      | Optional pasted text fallback still works    | Pending   |       |
| Sensitive logging   | Resume text and file contents are not logged | Pending   |       |

## RevenueCat Test Store

| Item                  | Expected Result                                                | Pass/Fail | Notes |
| --------------------- | -------------------------------------------------------------- | --------- | ----- |
| Offerings load        | Paywall shows available Test Store packages if configured      | Pending   |       |
| Empty offerings       | Paywall shows safe no-offerings message and does not crash     | Pending   |       |
| Test purchase         | Test purchase completes and premium entitlement becomes active | Pending   |       |
| Purchase cancellation | Cancellation shows safe message and does not crash             | Pending   |       |
| Restore purchases     | Restore flow completes or shows no active purchase safely      | Pending   |       |

## Next Manual QA Required

These items must stay pending until they are verified on the latest preview APK:

- Valid signup/login with a non-personal test account.
- Full interview session through summary for free and premium accounts.
- Answer evaluation after submitting a safe test answer.
- Resume valid PDF under 5MB.
- Non-PDF rejection with a friendly message.
- PDF over 5MB rejection if file size is available.
- No file selected friendly prompt.
- RevenueCat Test Store offering load.
- RevenueCat test purchase.
- Restore purchases.
- Notification banner/head-up display on Android, including Redmi/MIUI floating notification settings.
- Backend deployment to a public URL.
- New preview APK with public `EXPO_PUBLIC_API_BASE_URL`.

## Beta Gate

Beta can start only after:

- CI passes on GitHub.
- Full APK manual QA passes.
- RevenueCat Test Store purchase/restore is verified.
- Backend is deployed to a public URL for external testers.
- No secrets are exposed.
- Backend URL is reachable from tester devices.

## Expected Limitations

| Limitation              | Notes                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local backend IP        | A local IP backend only works when the phone/emulator can reach the developer machine on the same network. For external testers, use a deployed backend URL.                                  |
| Google Play billing     | Real Google Play billing should be tested later through internal or closed testing tracks.                                                                                                    |
| RevenueCat Test Store   | RevenueCat Test Store is for development only and should not be treated as production billing validation.                                                                                     |
| RevenueCat entitlement  | Entitlement identifier must be exactly `premium`; Test Store products must be attached to that entitlement and included in offerings.                                                         |
| Play billing switch     | Google Play internal/closed testing later should use the Android RevenueCat public API key and must not ship with the Test Store API key.                                                     |
| Subscription management | Use RevenueCat SDK `managementURL` when available; Test Store purchases may need to be managed from the RevenueCat dashboard.                                                                 |
| EAS env changes         | Changing EAS environment variables requires a new APK build.                                                                                                                                  |
| Android notifications   | Users must enable app notifications and banner/pop-on-screen behavior for the notification channel in system settings. On Redmi/MIUI, floating notifications may need to be enabled manually. |

## Final Result

| Decision                        | Pass/Fail | Notes                                                                                                                                  |
| ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Ready for local same-WiFi beta  | Pass      | Preview APK real-device smoke passed with local LAN backend                                                                            |
| Ready for external beta sharing | Pending   | Requires backend deployment to a public URL, new APK with public API URL, RevenueCat purchase/restore QA, and final legal/support URLs |
