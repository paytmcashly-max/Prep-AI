# IntervueAI Landing Website

This directory contains the public IntervueAI landing website used for Razorpay
onboarding and app review.

Primary public URL should be set in environment variables instead of copied through the codebase.

## Framework

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Magic UI
- Lucide React icons

## Local Development

```sh
cd web
npm install
npm run dev
```

## Build

```sh
cd web
npm run build
```

## Deploy on Vercel

1. Import the repository in Vercel.
2. Set the Vercel project root directory to `web`.
3. Use the build command from `web/package.json`:

   ```sh
   npm run build
   ```

4. Leave the output directory empty/default for a standard Next.js deployment.
5. Set these production env vars in Vercel:

   ```text
   NEXT_PUBLIC_SITE_URL
   NEXT_PUBLIC_APK_DOWNLOAD_URL
   NEXT_PUBLIC_APP_DEEP_LINK
   NEXT_PUBLIC_SUPPORT_EMAIL
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
   ```

6. Deploy and use the deployed Vercel URL as the app/website link in Razorpay
   onboarding.

## Razorpay Notes

- Do not expose Razorpay secrets in this website.
- Payment processing stays in the backend.
- Backend webhook URL format:

  ```text
  https://YOUR_BACKEND_DOMAIN/api/payments/razorpay/webhook
  ```

## Remaining Launch Tasks

- Keep `/web` deployed on the domain configured in `NEXT_PUBLIC_SITE_URL`.
- Privacy page should resolve at `${NEXT_PUBLIC_SITE_URL}/privacy`.
- Terms page should resolve at `${NEXT_PUBLIC_SITE_URL}/terms`.
- Refund page should resolve at `${NEXT_PUBLIC_SITE_URL}/refund`.
- Digital delivery page should resolve at `${NEXT_PUBLIC_SITE_URL}/delivery`.
- Support email should come from `NEXT_PUBLIC_SUPPORT_EMAIL`.
- Submit the deployed Vercel URL to Razorpay as the IntervueAI website/app link.
