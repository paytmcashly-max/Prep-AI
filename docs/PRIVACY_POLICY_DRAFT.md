# Privacy Policy Draft

This is a draft and should be reviewed by a legal professional before launch.

TODO before launch: replace the support email placeholder with the final monitored PrepAI support email, and publish this policy at the final Privacy Policy URL used by the app and store listing.

## Data We Collect

Prep-AI may collect the following data when you use the app:

- Account information, such as name, email address, job role, experience level, and profile preferences.
- Firebase authentication data used to create, verify, and manage your account.
- Resume text or uploaded resume files that you provide for resume analysis.
- Interview questions, answers, evaluation results, scores, and practice history.
- App usage events, such as feature usage, session activity, and usage-limit events.
- Crash and error reports if error tracking is configured.
- Subscription status and purchase-related entitlement information from RevenueCat.

Users should not upload highly sensitive documents unless necessary for resume analysis.

## How We Use Data

Prep-AI may use collected data to:

- Generate role-specific interview questions.
- Evaluate interview answers and provide feedback.
- Analyze resumes and provide improvement suggestions.
- Save practice sessions and show progress.
- Improve app reliability, performance, and user experience.
- Enforce free-tier usage limits and prevent abuse.
- Manage subscription status and premium access.
- Provide account, support, and safety functionality.

## Third-Party Services

Prep-AI may use third-party services to operate the app:

- Firebase for authentication, database, storage, and related app infrastructure.
- Groq for AI-powered interview question generation, answer evaluation, and resume analysis through the backend.
- RevenueCat for subscription status, purchase entitlement management, and restore purchases support.
- Sentry if configured, for crash and error reporting.
- Analytics provider if configured, for safe product usage events.

AI calls are routed through the Prep-AI backend. API keys are not stored in the mobile app.

## Data Retention

Prep-AI may retain account, profile, practice, usage-limit, and subscription-related data for as long as needed to provide the app, maintain user progress, enforce limits, comply with legal obligations, resolve disputes, and improve reliability.

Resume text, uploaded files, interview answers, and AI feedback should be retained only as needed for the features users choose to use. Production retention periods should be reviewed before launch.

## User Choices

Users may choose whether to:

- Create an account or stop using the app.
- Provide resume text or upload resume files.
- Submit interview answers for evaluation.
- Enable or disable optional notifications where supported.
- Use free features or purchase premium access where available.

Users may request account or data deletion through the support contact listed below, subject to verification and legal requirements.

## Security

Prep-AI is designed so privileged AI provider calls go through the backend instead of directly from React Native. Groq API keys and Firebase Admin credentials must remain server-only and must not be included in the mobile app.

Resume text and interview answers should not be logged intentionally. Access controls, Firebase security rules, backend authentication, rate limiting, and secure environment variable handling should be reviewed before production launch.

## Children's Privacy

Prep-AI is intended for job seekers and is not directed to children. Users who are not old enough to use online services in their location should not use the app without appropriate permission from a parent or guardian.

## Contact

For privacy questions, support requests, or data deletion requests, contact:

```text
support@example.com
```

Replace this placeholder with the official Prep-AI support email before launch.

## Changes to This Policy

Prep-AI may update this policy from time to time. When changes are made, the updated policy should include a new effective date and be made available to users through the app, website, or store listing.
