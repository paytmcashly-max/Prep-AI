# APK Manual QA Checklist

Use this checklist for final manual QA on an EAS preview Android APK.

## Test Setup

| Item                         | Expected Result                                          | Pass/Fail | Notes |
| ---------------------------- | -------------------------------------------------------- | --------- | ----- |
| Install preview APK          | APK installs without errors                              |           |       |
| Open app                     | App opens without crashing                               |           |       |
| Backend URL                  | `EXPO_PUBLIC_API_BASE_URL` points to a reachable backend |           |       |
| Firebase config              | Signup/login screens do not show invalid API key errors  |           |       |
| RevenueCat Test Store config | Test Store offerings load if configured                  |           |       |

## Core App Flow

| Item        | Expected Result                                            | Pass/Fail | Notes |
| ----------- | ---------------------------------------------------------- | --------- | ----- |
| Signup      | New test user can create an account                        |           |       |
| Login       | Existing test user can log in                              |           |       |
| Home screen | Home loads with greeting, streak, tip, and recent sessions |           |       |
| AI tip      | Tip does not show `Invalid interview request`              |           |       |
| Legal links | Privacy Policy and Terms of Service open safely            |           |       |

## Interview Flow

| Item                    | Expected Result                                                | Pass/Fail | Notes |
| ----------------------- | -------------------------------------------------------------- | --------- | ----- |
| Start interview         | First question loads from backend                              |           |       |
| Question requests       | Requests include `jobRole`, `category`, and `difficulty`       |           |       |
| Safe defaults           | Missing profile fields use safe defaults                       |           |       |
| Answer evaluation       | Submitting an answer returns score and feedback                |           |       |
| Full 5-question session | User can complete all 5 questions without crash                |           |       |
| Summary screen          | Summary screen shows average score                             |           |       |
| Firestore session save  | Session is saved under the user if implemented                 |           |       |
| Sensitive logging       | User answers, tokens, and Authorization headers are not logged |           |       |

## Resume Analyzer

| Item                | Expected Result                              | Pass/Fail | Notes |
| ------------------- | -------------------------------------------- | --------- | ----- |
| No file selected    | Analyze action shows friendly prompt         |           |       |
| Valid PDF under 5MB | PDF uploads and analysis result appears      |           |       |
| Non-PDF file        | File is rejected with friendly message       |           |       |
| PDF over 5MB        | File is rejected if file size is available   |           |       |
| Paste fallback      | Optional pasted text fallback still works    |           |       |
| Sensitive logging   | Resume text and file contents are not logged |           |       |

## RevenueCat Test Store

| Item                  | Expected Result                                                | Pass/Fail | Notes |
| --------------------- | -------------------------------------------------------------- | --------- | ----- |
| Offerings load        | Paywall shows available Test Store packages if configured      |           |       |
| Empty offerings       | Paywall shows safe no-offerings message and does not crash     |           |       |
| Test purchase         | Test purchase completes and premium entitlement becomes active |           |       |
| Purchase cancellation | Cancellation shows safe message and does not crash             |           |       |
| Restore purchases     | Restore flow completes or shows no active purchase safely      |           |       |

## Expected Limitations

| Limitation            | Notes                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local backend IP      | A local IP backend only works when the phone/emulator can reach the developer machine on the same network. For external testers, use a deployed backend URL. |
| Google Play billing   | Real Google Play billing should be tested later through internal or closed testing tracks.                                                                   |
| RevenueCat Test Store | RevenueCat Test Store is for development only and should not be treated as production billing validation.                                                    |
| EAS env changes       | Changing EAS environment variables requires a new APK build.                                                                                                 |

## Final Result

| Decision                   | Pass/Fail | Notes |
| -------------------------- | --------- | ----- |
| Ready for beta APK sharing |           |       |
