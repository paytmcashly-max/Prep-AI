import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppText from "../components/ui/AppText";
import AuthScaffold from "../components/ui/AuthScaffold";
import MessageCard from "../components/ui/MessageCard";
import {
  getCurrentUser,
  reloadCurrentUser,
  sendActivationEmail,
  signOut
} from "../services/authService";
import { SPACING } from "../theme";

export default function VerifyEmailScreen({ onVerified }) {
  const currentUser = getCurrentUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const email = useMemo(() => currentUser?.email || "", [currentUser?.email]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage("");
    setMessage("");

    try {
      const user = await reloadCurrentUser();

      if (user?.emailVerified) {
        onVerified?.();
        return;
      }

      setMessage(
        "We still don't see the verification yet. Open the link from your email, then try again."
      );
    } catch (error) {
      setErrorMessage(error.message || "Could not refresh your account status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage("");
    setMessage("");

    try {
      await sendActivationEmail();
      setMessage("A fresh activation link is on its way to your inbox.");
    } catch (error) {
      setErrorMessage(error.message || "Could not resend the activation email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow="Activate account"
      subtitle="Verify your email to unlock profile setup, interview practice, and saved progress."
      title="Check your inbox"
    >
      <AppCard style={styles.card}>
        <MessageCard
          message={
            email
              ? `We sent an activation link to ${email}. Open it, then come back here to continue.`
              : "We sent an activation link to your email. Open it, then come back here to continue."
          }
          title="Email verification required"
          tone="warning"
        />

        {errorMessage ? (
          <MessageCard message={errorMessage} title="Verification update failed" tone="error" />
        ) : null}

        {message ? (
          <MessageCard message={message} title="Verification status" tone="default" />
        ) : null}

        <AppButton
          disabled={isRefreshing || isResending}
          loading={isRefreshing}
          onPress={handleRefresh}
        >
          I&apos;ve verified my email
        </AppButton>
        <AppButton
          disabled={isRefreshing || isResending}
          loading={isResending}
          onPress={handleResend}
          tone="secondary"
        >
          Resend activation link
        </AppButton>
      </AppCard>

      <View style={styles.footer}>
        <AppText tone="muted" variant="bodyMuted">
          Wrong account?
        </AppText>
        <AppButton onPress={signOut} tone="ghost">
          Sign out
        </AppButton>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.lg
  },
  footer: {
    alignItems: "center",
    gap: SPACING.xs
  }
});
