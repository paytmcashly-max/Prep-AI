# Razorpay Onboarding

IntervueAI uses Razorpay for premium payments. The mobile app never receives
Razorpay secrets and never grants premium directly.

## Account Checklist

- Razorpay account created.
- PAN/KYC completed.
- Bank account added and verified.
- Business details completed.
- App or website description added.
- IntervueAI website deployed from `/web` and submitted as the public app/website link.
- Pricing and refund rules documented.
- App screenshots prepared.
- Monitored support email ready.

## Legal URLs Required

Do not invent these values. Replace placeholders only after final public URLs
exist:

- Privacy Policy URL.
- Terms & Conditions URL.
- Refund/Cancellation Policy URL.
- Support email.

The website source lives in `/web` and is deployed on Vercel:

```text
https://intervueai.vercel.app
```

Submit this deployed Vercel URL to Razorpay as the IntervueAI app/website link.
The website includes pricing, privacy, terms, refund/cancellation, and contact
sections for onboarding review.

## Backend Env Variables

Set these only on the backend deployment platform or `server/.env` locally:

```sh
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PREMIUM_MONTHLY_AMOUNT=
RAZORPAY_PREMIUM_YEARLY_AMOUNT=
APP_PUBLIC_URL=
```

Amounts are in paise. Example: `9900` means INR 99.00.

Never put `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` in the mobile app
environment.

## Webhook Setup

Configure the Razorpay webhook URL after the backend is deployed:

```text
https://YOUR_BACKEND_DOMAIN/api/payments/razorpay/webhook
```

Recommended event:

- `payment_link.paid`

Store the generated webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

## Verification Model

1. User selects Monthly or Yearly in the app.
2. Backend creates a Razorpay payment link/order reference.
3. Mobile opens the Razorpay-hosted payment URL.
4. Razorpay webhook or callback verification reaches the backend.
5. Backend verifies the Razorpay signature.
6. Backend/Admin writes `users/{uid}/subscription/main` with:
   - `isPremium: true`
   - `verificationStatus: "server_verified"`
   - `source: "razorpay"`
   - `provider: "razorpay"`
   - `plan: "monthly"` or `"yearly"`
   - `expirationDate`

Backend usage limits bypass premium only when the subscription document is
server-verified and unexpired.
