# LDPlayer Local Testing

## PDF Resume Upload

Use this checklist when testing Resume Analyzer PDF uploads in Expo / LDPlayer.

1. Start the backend with the existing server port:
   - `cd server`
   - `npm run dev`
2. Confirm the backend is reachable from LDPlayer:
   - `GET http://<your-lan-ip>:3000/health`
   - `GET http://<your-lan-ip>:3000/ready`
3. Set the mobile app API URL with the public Expo variable:
   - `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:3000`
4. Start Expo:
   - `npm run start`
5. Open the app in LDPlayer and log in with a test account.
6. Open Resume Analyzer.
7. Upload a text-based PDF under 5MB.
8. Confirm the file selected state appears.
9. Tap Analyze PDF.
10. Confirm the analysis result appears with ATS score, missing keywords, grammar issues, and section feedback.
11. Try an unsupported file type and confirm the app shows a friendly PDF-only error.
12. Try a PDF over 5MB, if available, and confirm the app shows a friendly size error.
13. Confirm pasted resume text still works as a fallback.

Do not use real personal resumes during local testing. Use dummy resumes only. Do not put Groq keys, Firebase Admin credentials, or other server secrets in the mobile/root environment.
