# APK Manual QA Checklist

Use this checklist for final manual QA on an EAS preview Android APK.

## Test Setup

| Item                         | Expected Result                                          | Pass/Fail | Notes                                                                     |
| ---------------------------- | -------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| Build release APK            | `app-release.apk` builds successfully                    | Pass      | Verified locally on May 8, 2026                                           |
| Install preview APK          | APK installs without errors                              | Pass      | Installed on LDPlayer with `adb install -r`                               |
| Open app                     | App opens without crashing                               | Pass      | Package `com.prepai.prepai` launched; no fatal launch crash found         |
| Backend URL                  | `EXPO_PUBLIC_API_BASE_URL` points to a reachable backend | Pending   | Full API flow not verified in installed APK                               |
| Firebase config              | Signup/login screens do not show invalid API key errors  | Pending   | Screens rendered; valid signup/login success still needs APK verification |
| RevenueCat Test Store config | Test Store offerings load if configured                  | Pending   | Test Store offering/purchase/restore not verified                         |
| Real device test             | APK opens on a physical Android phone                    | Pending   | LDPlayer smoke passed; real phone not tested                              |

## Core App Flow

| Item                  | Expected Result                                            | Pass/Fail | Notes                                             |
| --------------------- | ---------------------------------------------------------- | --------- | ------------------------------------------------- |
| Onboarding render     | Onboarding screen appears after launch                     | Pass      | Verified in installed APK                         |
| Skip to Login         | Skip navigates to Login                                    | Pass      | Verified in installed APK                         |
| Signup screen render  | Signup screen appears                                      | Pass      | Verified in installed APK                         |
| Invalid signup error  | Invalid signup shows a friendly error                      | Pass      | Verified with invalid email input                 |
| Signup                | New test user can create an account                        | Pending   | Valid signup success still needs APK verification |
| Login                 | Existing test user can log in                              | Pending   | Not verified in installed APK                     |
| Home screen           | Home loads with greeting, streak, tip, and recent sessions | Pending   | Not verified in installed APK after valid login   |
| AI tip                | Tip does not show `Invalid interview request`              | Pending   | Not verified in installed APK after valid login   |
| Legal links           | Privacy Policy and Terms of Service open safely            | Pending   | Not verified in installed APK                     |
| No fatal launch crash | Logcat has no app `FATAL EXCEPTION` during launch smoke    | Pass      | Verified during LDPlayer APK launch/smoke test    |

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

These items must stay pending until they are verified on the installed APK:

- Valid signup/login with a non-personal test account.
- Full 5-question interview session through summary.
- Answer evaluation after submitting a safe test answer.
- Resume valid PDF under 5MB.
- Non-PDF rejection with a friendly message.
- PDF over 5MB rejection if file size is available.
- No file selected friendly prompt.
- RevenueCat Test Store offering load.
- RevenueCat test purchase.
- Restore purchases.
- Redmi Note 4 real-device smoke test.

## Beta Gate

Beta can start only after:

- CI passes on GitHub.
- Full APK manual QA passes.
- RevenueCat Test Store purchase/restore is verified.
- Real Android device smoke test passes.
- No secrets are exposed.
- Backend URL is reachable from tester devices.

## Expected Limitations

| Limitation            | Notes                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local backend IP      | A local IP backend only works when the phone/emulator can reach the developer machine on the same network. For external testers, use a deployed backend URL.                                  |
| Google Play billing   | Real Google Play billing should be tested later through internal or closed testing tracks.                                                                                                    |
| RevenueCat Test Store | RevenueCat Test Store is for development only and should not be treated as production billing validation.                                                                                     |
| EAS env changes       | Changing EAS environment variables requires a new APK build.                                                                                                                                  |
| Android notifications | Users must enable app notifications and banner/pop-on-screen behavior for the notification channel in system settings. On Redmi/MIUI, floating notifications may need to be enabled manually. |

## Final Result

| Decision                   | Pass/Fail | Notes                                                                                                                                     |
| -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Ready for beta APK sharing | Pending   | Launch smoke passed, but valid signup/login, full interview, resume PDF edge cases, RevenueCat Test Store, and real device QA remain open |
