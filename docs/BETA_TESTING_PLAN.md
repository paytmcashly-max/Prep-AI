# Beta Testing Plan

## Beta Goal

Validate that PrepAI helps job seekers practice interviews, understand AI feedback, analyze resumes, and build confidence without crashes, confusing flows, or security issues.

## Target Beta Users

- Students preparing for placements
- Fresh graduates
- Working professionals switching jobs
- Users preparing for IT/product company interviews

## Setup Checklist

- [ ] Staging backend deployed and reachable
- [ ] Mobile app points to staging `EXPO_PUBLIC_API_BASE_URL`
- [ ] Test Firebase project configured
- [ ] Test users can sign up and log in
- [ ] Usage limits configured for staging
- [ ] Legal links placeholder behavior confirmed
- [ ] RevenueCat fallback confirmed if keys are missing
- [ ] Crash/error reporting configured if enabled
- [ ] No real secrets included in the mobile app
- [ ] `npm run security:audit` passes before sharing the build

## Test Scenarios

- [ ] Signup/login
- [ ] Onboarding/profile setup
- [ ] Generating interview questions
- [ ] Submitting answers
- [ ] Viewing AI feedback
- [ ] Resume analysis
- [ ] Usage limit messages
- [ ] Legal links
- [ ] App crash/error behavior
- [ ] Subscription fallback if RevenueCat keys are missing or purchases are disabled

## Feedback Questions

- Was the feedback useful?
- Was the resume analysis understandable?
- Did anything feel confusing?
- Would you pay for unlimited practice?
- What feature is missing?
- What made you stop using the app?
- Which interview category felt most useful?
- Which screen felt slow or unclear?
- Did the app feel trustworthy with your resume or answers?

## Bug Report Template

```text
Title:

Device:

OS version:

App version:

Environment: staging / production

Steps to reproduce:
1.
2.
3.

Expected result:

Actual result:

Screenshot or screen recording:

How often does it happen: once / sometimes / always

Any other notes:
```

## Success Criteria

- [ ] At least 10 beta users
- [ ] At least 5 complete mock interview sessions
- [ ] No critical crashes
- [ ] No secrets exposed
- [ ] Feedback collected and prioritized
- [ ] Critical signup/login issues resolved
- [ ] AI feedback and resume analysis are understandable to most testers

## Known Risks

- AI feedback may be imperfect or too generic.
- Resume analysis quality depends on pasted text quality.
- Usage limits may interrupt testing if not communicated clearly.
- Staging backend or Firebase configuration may differ from production.
- External beta can run without purchases enabled, but the paywall must clearly say premium purchases are not available in that beta build.
- RevenueCat purchase flows require Google Play internal/closed testing or another intended billing environment before being treated as launch-ready.
- Legal links may still point to placeholders until final URLs are hosted.

## Post-Beta Action Plan

- [ ] Review crash/error reports
- [ ] Review support messages and bug reports
- [ ] Group feedback by severity and frequency
- [ ] Fix critical auth, backend, and crash issues first
- [ ] Improve confusing copy or flows
- [ ] Prioritize missing features based on beta feedback
- [ ] Re-run staging smoke test after fixes
- [ ] Update release checklist before production launch
