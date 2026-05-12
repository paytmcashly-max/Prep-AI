import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntervueAI - Practice smarter. Interview better.",
  description:
    "IntervueAI is an AI-powered interview preparation app for mock interviews, resume ATS analysis, and progress tracking.",
  applicationName: "IntervueAI",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
