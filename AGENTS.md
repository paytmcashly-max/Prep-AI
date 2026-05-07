# 🚀 AI Interview Prep App

> **Goal:** Build a React Native mobile app that generates ₹8–16 Lakh/month (~$10–20K) through AI-powered interview preparation for Indian job seekers.

---

## 🧠 App Overview

An AI-powered mobile app that helps Indian job seekers practice interviews, analyze resumes, and land their dream jobs — all from their phone.

| Property | Detail |
|----------|--------|
| Platform | iOS + Android (React Native + Expo) |
| Language | English + Hindi support |
| Model | Freemium (Free + Paid Subscription) |
| Target Market | India (20 Lakh+ job seekers/month) |
| Revenue Model | Monthly & Yearly Subscription |

---

## 🎯 Target Users

- Fresh graduates (22–26 age group)
- Engineering & MBA students preparing for campus placements
- Working professionals switching jobs
- IT professionals targeting product companies (Google, Amazon, etc.)

---

## 💡 App Name Ideas

| Name | Vibe |
|------|------|
| **MockMate** | Friendly, approachable |
| **PrepAI** | Clean, professional |
| **HireReady** | Outcome-focused |
| **InterviewAI** | Direct, searchable |

> **Tip:** Choose a name that's easy to search on App Store. Short + keyword-rich = better ASO (App Store Optimization).

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React Native + Expo | Cross-platform, you already know it |
| Navigation | React Navigation v6 | Industry standard |
| Backend | Node.js + Express | Simple REST APIs |
| Database | Firebase Firestore | Real-time, scalable, free tier |
| Auth | Firebase Auth | Google + Email login |
| AI Engine | OpenAI GPT-4o API | Best quality answers |
| Voice Input | Whisper API (OpenAI) | Speech-to-text for mock interviews |
| Subscriptions | RevenueCat | Handles iOS + Android billing |
| File Storage | Firebase Storage | Resume PDF uploads |
| Push Notifications | Firebase Cloud Messaging (FCM) | Daily reminders |
| Analytics | Mixpanel (free tier) | Track user behavior |

---

## 📁 Folder Structure

```
InterviewAI/
│
├── src/
│   ├── screens/
│   │   ├── SplashScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── LoginScreen.js
│   │   ├── SignupScreen.js
│   │   ├── ProfileSetupScreen.js
│   │   ├── HomeScreen.js
│   │   ├── PracticeScreen.js
│   │   ├── MockInterviewScreen.js
│   │   ├── ResumeScreen.js
│   │   ├── ProgressScreen.js
│   │   ├── DailyQuestionsScreen.js
│   │   ├── ProfileScreen.js
│   │   └── PaywallScreen.js
│   │
│   ├── components/
│   │   ├── QuestionCard.js
│   │   ├── FeedbackCard.js
│   │   ├── StreakCounter.js
│   │   ├── ScoreGraph.js
│   │   ├── PremiumBadge.js
│   │   ├── CategoryPicker.js
│   │   └── LoadingDots.js
│   │
│   ├── services/
│   │   ├── openaiService.js       ← All AI API calls
│   │   ├── authService.js         ← Firebase Auth
│   │   ├── revenueService.js      ← RevenueCat subscriptions
│   │   ├── resumeService.js       ← PDF upload & analysis
│   │   └── notificationService.js ← FCM push notifications
│   │
│   ├── navigation/
│   │   ├── AppNavigator.js        ← Root navigator
│   │   └── TabNavigator.js        ← Bottom tab bar
│   │
│   ├── store/
│   │   ├── userStore.js           ← User profile state
│   │   └── progressStore.js       ← Interview history & scores
│   │
│   └── utils/
│       ├── prompts.js             ← All OpenAI prompt templates
│       └── constants.js           ← Colors, fonts, config
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json
├── package.json
└── README.md                      ← You are here
```

---

## 📱 Screens & Features

### 🔐 Onboarding Flow

| Screen | What it does |
|--------|-------------|
| Splash Screen | App logo + tagline animation |
| Onboarding Slides | 3 slides showcasing key features |
| Sign Up / Login | Google OAuth + Email/Password |
| Profile Setup | Name, Job Role, Experience Level, Target Companies |

### 🏠 Home Screen

- Daily streak counter (like Duolingo 🔥)
- "Start Quick Interview" CTA button
- AI-generated tip of the day
- Recent practice history
- Upcoming mock interview reminder

### 🎤 Practice Screen

**Choose Category:**
- HR Questions
- Technical Questions
- Behavioral (STAR Method)
- Company Specific (TCS, Infosys, Google, Amazon, etc.)

**Choose Mode:**

| Mode | Free/Premium |
|------|-------------|
| Text Mode (type answer) | ✅ Free |
| Voice Mode (speak answer) | 🔒 Premium |
| Video Mode (record yourself) | 🔒 Premium |

### 🤖 Mock Interview Screen

- AI asks questions one by one
- User answers via text or voice
- Timer pressure (like a real interview)
- AI gives instant feedback:
  - Score out of 10
  - What was good ✅
  - What to improve ⚠️
  - Ideal answer suggestion 💡

### 📄 Resume Analyzer Screen

- Upload PDF resume
- AI scans and returns:
  - ATS Score (%)
  - Missing keywords for job role
  - Grammar & language fixes
  - Section-wise improvement tips
- Download improved resume 🔒 Premium

### 📊 Progress Screen

- Weekly performance graph
- Strong vs Weak topics breakdown
- Total questions practiced
- Streak calendar (visual motivation)
- Badges & achievements system

### 💡 Daily Questions Screen

| Feature | Free | Premium |
|---------|------|---------|
| Daily questions | 5/day | Unlimited |
| Save favorites | ❌ | ✅ |
| Share question | ✅ | ✅ |

> **Viral Loop:** Each question has a Share button → users share to WhatsApp/Instagram → new users discover app → zero marketing needed.

### 💎 Paywall Screen

- Free vs Premium feature comparison table
- Monthly plan: ₹299/month
- Yearly plan: ₹1,999/year (save 44%)
- 3-day free trial
- One-tap subscribe via RevenueCat

---

## 🧠 AI Implementation

All AI calls go through `openaiService.js`. Use `gpt-4o` model.

### 1. Interview Question Generator

```javascript
// In: utils/prompts.js
export const questionPrompt = (jobRole, category, difficulty, company) => `
Generate a ${difficulty} level ${category} interview question
for a ${jobRole} position${company ? ` at ${company}` : ''}.
Return ONLY the question, nothing else.
`;
```

### 2. Answer Evaluator

```javascript
export const evaluatePrompt = (question, answer, jobRole) => `
You are an expert ${jobRole} interviewer.
Evaluate this interview answer:

Question: ${question}
Candidate's Answer: ${answer}

Respond ONLY in this JSON format:
{
  "score": <number 1-10>,
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "idealAnswer": "<ideal answer in 3-4 sentences>"
}
`;
```

### 3. Resume Analyzer

```javascript
export const resumePrompt = (resumeText, jobRole) => `
Analyze this resume for a ${jobRole} position.
Resume:
${resumeText}

Respond ONLY in this JSON format:
{
  "atsScore": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "grammarIssues": ["issue1", "issue2"],
  "sectionFeedback": {
    "summary": "<feedback>",
    "experience": "<feedback>",
    "skills": "<feedback>",
    "education": "<feedback>"
  }
}
`;
```

### 4. Daily Tip Generator

```javascript
export const tipPrompt = (jobRole) => `
Give ONE actionable interview tip for a ${jobRole} candidate in exactly 2 sentences.
Make it specific, practical, and motivating.
`;
```

---

## 💰 Monetization Plan

### Free Tier

- 5 mock questions per day
- Text mode only
- Basic AI feedback (score only)
- 1 resume scan per month
- Ads shown between sessions

### Premium Tier — ₹299/month or ₹1,999/year

| Feature | Included |
|---------|---------|
| Unlimited questions | ✅ |
| Voice + Video interview mode | ✅ |
| Detailed AI feedback (full breakdown) | ✅ |
| Unlimited resume scans | ✅ |
| Download improved resume | ✅ |
| Company-specific question banks | ✅ |
| Ad-free experience | ✅ |
| Priority support | ✅ |

### RevenueCat Setup Steps

1. Create account at [revenuecat.com](https://revenuecat.com)
2. Add iOS + Android apps
3. Create `"premium_monthly"` and `"premium_yearly"` products
4. Install SDK: `npx expo install react-native-purchases`
5. Gate premium screens with `Purchases.getCustomerInfo()`

---

## 🗓️ 6-Week Build Roadmap

### ✅ Week 1 — Foundation
- Setup Expo project
- Configure Firebase (Auth + Firestore + Storage)
- Build Splash, Onboarding, Login, Signup screens
- Setup React Navigation (Stack + Bottom Tabs)

### ✅ Week 2 — Core UI
- Build Home Screen with streak counter
- Build Profile Setup + Profile Screen
- Build Practice Category picker screen
- Setup Zustand or Context for global state

### ✅ Week 3 — AI Integration
- Connect OpenAI GPT-4o API
- Build Mock Interview Screen with Q&A flow
- Implement Answer Evaluator with JSON response
- Add Daily Tip on Home Screen

### ✅ Week 4 — Advanced Features
- Build Resume Upload + PDF text extraction
- Implement Resume Analyzer with AI
- Build Progress Screen with charts (Victory Native)
- Add Daily Questions Screen with share button

### ✅ Week 5 — Monetization
- Setup RevenueCat with Monthly + Yearly plans
- Build Paywall Screen (attractive UI)
- Gate premium features with subscription check
- Setup 3-day free trial flow
- Add Refer-a-Friend (7 days free reward)

### ✅ Week 6 — Launch Prep
- Full app testing (iOS + Android)
- Fix all bugs
- Setup push notifications (daily reminders)
- Create App Store screenshots
- Submit to App Store + Play Store
- Set up App Store keywords for ASO

---

## 📈 Growth Strategy (No Marketing Needed)

### 1. 🔍 App Store SEO (ASO)

Use these keywords in your App Store listing:
- `"interview preparation"`
- `"mock interview india"`
- `"job interview practice"`
- `"ai interview coach"`
- `"placement preparation"`

### 2. 🔗 Viral-by-Design Features

- Share Question button → WhatsApp/Instagram sharing
- "Prepared with MockMate" watermark on results
- Refer-a-Friend → get 7 days free premium

### 3. ⭐ Rating Push Strategy

- After 3 successful mock interviews → prompt for rating
- High ratings → App Store algorithm boosts you automatically
- More visibility = more downloads = more revenue

### 4. 🔔 Retention (Daily Active Users)

- Daily streak system (don't break the chain!)
- Push notification: "Your daily interview question is ready 🎯"
- Weekly progress report notification

---

## 💵 Revenue Projection

| Month | Total Users | Premium Users (5%) | Monthly Revenue |
|-------|-------------|-------------------|----------------|
| Month 1–2 | 500 | 10 | ₹3,000 |
| Month 3–4 | 2,000 | 60 | ₹18,000 |
| Month 5–6 | 8,000 | 320 | ₹96,000 |
| Month 7–8 | 20,000 | 1,000 | ₹2,99,000 |
| Month 9–10 | 50,000 | 2,800 | ₹8,37,200 |

> **$10K/month = ₹8.5 Lakh = ~2,800 premium users.** Realistic target: Month 9–10 with consistent improvement & good ratings.

---

## ⚡ Key Rules to Follow

| Rule | Why |
|------|-----|
| 🚀 Launch in 6 weeks max | Don't over-build. Ship first, improve later |
| 👥 Get 10 real users first | Friends, college WhatsApp groups, LinkedIn |
| 📖 Read every review | User feedback = your free product roadmap |
| 🔒 Keep premium valuable | Don't give everything away for free |
| 🔥 Streak feature is critical | Makes users open app daily (retention = revenue) |
| 💸 Don't spend on ads | Let ASO + word of mouth do the work |
| 🔄 Update every 2 weeks | App Store rewards active developers |
| 📊 Track conversion rate | If below 3%, improve your Paywall screen |

---

## 🔗 Useful Resources

| Resource | Link |
|----------|------|
| Expo Docs | https://docs.expo.dev |
| Firebase Setup | https://firebase.google.com/docs |
| OpenAI API | https://platform.openai.com/docs |
| RevenueCat Docs | https://docs.revenuecat.com |
| React Navigation | https://reactnavigation.org |
| App Store Guidelines | https://developer.apple.com/app-store/review/guidelines |

---

> **Built by a solo developer. Shipped in 6 weeks. Path to ₹8 Lakh/month. 💪**
>
> *Start building. Stop planning. The best time to launch was yesterday.*