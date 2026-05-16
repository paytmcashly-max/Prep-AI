import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { siteUrl } from "../lib/publicConfig";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "IntervueAI - Practice smarter. Interview better.",
  description:
    "IntervueAI is an AI-powered interview preparation app for mock interviews, resume ATS analysis, and progress tracking.",
  applicationName: "IntervueAI",
  metadataBase: new URL(siteUrl),
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
