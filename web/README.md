# IntervueAI Landing Website

This directory contains the public IntervueAI landing website used for Razorpay
onboarding and app review.

Current deployed URL:

```text
https://intervueai.tech
```

## Framework

- Next.js App Router
- TypeScript
- Plain CSS
- Lucide React icons

The downloaded Vercel-generated zip was inspected and reduced to a lean landing
site. Unused demo components, placeholder assets, and broad shadcn/Radix
boilerplate were not kept.

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
5. Deploy and use the deployed Vercel URL as the app/website link in Razorpay
   onboarding.

Current deployed URL:

```text
https://intervueai.tech
```

## Razorpay Notes

- Do not expose Razorpay secrets in this website.
- Payment processing stays in the backend.
- Backend webhook URL format:

  ```text
  https://YOUR_BACKEND_DOMAIN/api/payments/razorpay/webhook
  ```

## Remaining Launch Tasks

- Keep `/web` deployed on Vercel at `https://intervueai.tech`.
- Privacy page: `https://intervueai.tech/privacy`.
- Terms page: `https://intervueai.tech/terms`.
- Refund page: `https://intervueai.tech/refund`.
- Digital delivery page: `https://intervueai.tech/delivery`.
- Support email configured as `kishan@kishan.codes`.
- Submit the deployed Vercel URL to Razorpay as the IntervueAI website/app link.
