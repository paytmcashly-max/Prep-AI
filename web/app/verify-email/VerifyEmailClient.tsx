"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, MailWarning, ShieldAlert } from "lucide-react";
import { applyActionCode, getAuth } from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";
import { appDeepLink } from "../../lib/publicConfig";

type FirebaseWebConfig = {
  apiKey: string;
  appId: string;
  authDomain: string;
  measurementId?: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
};

type VerificationState = "error" | "idle" | "success" | "verifying";

type Props = {
  firebaseConfig: FirebaseWebConfig | null;
  oobCode?: string;
};

const getFirebaseApp = (firebaseConfig: FirebaseWebConfig) => {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

const getErrorMessage = (errorCode?: string) => {
  switch (errorCode) {
    case "auth/expired-action-code":
      return "This verification link has expired. Please request a fresh email from the app.";
    case "auth/invalid-action-code":
      return "This verification link is no longer valid. Please request a new verification email.";
    case "auth/user-disabled":
      return "This account is currently unavailable. Please contact support if this looks wrong.";
    default:
      return "We could not verify this email right now. Please try again from a fresh verification email.";
  }
};

export default function VerifyEmailClient({ firebaseConfig, oobCode }: Props) {
  const [status, setStatus] = useState<VerificationState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!firebaseConfig) {
        setStatus("error");
        setMessage("This verification page is missing Firebase web configuration.");
        return;
      }

      if (!oobCode) {
        setStatus("error");
        setMessage("This verification link is incomplete. Please open the latest email again.");
        return;
      }

      setStatus("verifying");
      setMessage("");

      try {
        const app = getFirebaseApp(firebaseConfig);
        const auth = getAuth(app);
        await applyActionCode(auth, oobCode);

        if (isMounted) {
          setStatus("success");
          setMessage("Your email is verified. Return to the app and continue with IntervueAI.");
        }
      } catch (error) {
        const auth = getAuth(getFirebaseApp(firebaseConfig));

        if (auth.currentUser) {
          void auth.signOut().catch(() => {});
        }

        if (isMounted) {
          setStatus("error");
          setMessage(getErrorMessage((error as { code?: string })?.code));
        }
      }
    };

    void verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [firebaseConfig, oobCode]);

  const content = useMemo(() => {
    if (status === "verifying" || status === "idle") {
      return {
        body: "Please wait while we securely verify your email.",
        icon: <MailWarning size={22} />,
        title: "Verifying your email"
      };
    }

    if (status === "success") {
      return {
        body: message,
        icon: <CheckCircle2 size={22} />,
        title: "Email verified"
      };
    }

    return {
      body: message,
      icon: <ShieldAlert size={22} />,
      title: "Verification unavailable"
    };
  }, [message, status]);

  return (
    <main className="verify-shell">
      <div className="verify-card">
        <div className="verify-brand">
          <span className="brand-mark">IA</span>
          <div>
            <strong>IntervueAI</strong>
            <span>Practice smarter. Interview better.</span>
          </div>
        </div>

        <div className={`verify-status ${status}`}>
          <div className="verify-status-icon">{content.icon}</div>
          <div>
            <h1>{content.title}</h1>
            <p>{content.body}</p>
          </div>
        </div>

        <div className="verify-actions">
          <a className="button" href={appDeepLink}>
            Open IntervueAI
            <ExternalLink size={16} />
          </a>
          <Link className="button secondary" href="/">
            Back to website
          </Link>
        </div>

        <p className="verify-note">
          If the app is already open, return there and tap <strong>I&apos;ve verified my email</strong>.
        </p>
      </div>
    </main>
  );
}
