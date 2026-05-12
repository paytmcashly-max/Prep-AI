# Payment Strategy

IntervueAI uses Razorpay as the payment provider.

## Current Decision

- RevenueCat has been removed from the mobile app.
- `react-native-purchases` is no longer used.
- Razorpay is handled through backend endpoints.
- Mobile never stores Razorpay secrets.
- Mobile never grants premium directly.
- Backend premium access requires `verificationStatus === "server_verified"`.
- The public IntervueAI website lives in `/web` and is deployed to Vercel at
  `https://intervueai.vercel.app` for Razorpay onboarding.

## Beta Behavior

External beta can run without payments enabled. If Razorpay backend env is not
configured, the paywall shows:

- "Premium payments are not available in this beta build yet."
- "You can continue using the free practice limits."

Free users can still use the free interview quota, resume cooldown, progress,
and profile features.

## Premium Flow

1. Mobile requests a Razorpay payment link from the backend.
2. Backend creates the payment link using backend-only Razorpay credentials.
3. Mobile opens the Razorpay-hosted URL.
4. Backend verifies Razorpay callback/webhook signatures.
5. Backend writes server-verified subscription status to Firestore.
6. Usage limits bypass premium only when the verified subscription is active and
   unexpired.

## Launch Blockers

- Public backend URL.
- Deployed `/web` Vercel URL submitted to Razorpay as the app/website link:
  `https://intervueai.vercel.app`.
- Razorpay KYC/live keys if live payments are required.
- Razorpay webhook URL and secret.
- Privacy Policy URL.
- Terms & Conditions URL.
- Refund/Cancellation Policy URL.
- Support email.

Backend webhook URL format:

```text
https://YOUR_BACKEND_DOMAIN/api/payments/razorpay/webhook
```
