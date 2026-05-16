import Link from "next/link";
import type { Metadata } from "next";
import { paywallDeepLink } from "../../../../lib/publicConfig";

export const metadata: Metadata = {
  title: "Payment Status - IntervueAI",
  description: "Review your IntervueAI premium payment status and return to the app."
};

const getPaymentState = (status?: string) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "paid") {
    return {
      note:
        "Return to IntervueAI and use Check premium status if access does not unlock automatically in a few seconds.",
      statusClassName: "success",
      subtitle:
        "Your payment has been received. We are verifying premium access for your account now.",
      title: "Payment received"
    };
  }

  if (normalizedStatus === "cancelled") {
    return {
      note: "No charge was completed. You can return to the app and try again whenever you're ready.",
      statusClassName: "error",
      subtitle: "The payment flow was cancelled before premium access was activated.",
      title: "Payment cancelled"
    };
  }

  if (normalizedStatus === "expired") {
    return {
      note:
        "This payment link is no longer active. Go back to IntervueAI to start a fresh payment attempt.",
      statusClassName: "error",
      subtitle: "The payment link expired before completion.",
      title: "Payment link expired"
    };
  }

  if (normalizedStatus === "failed") {
    return {
      note:
        "No premium access was activated. Return to IntervueAI and start the payment again if you still need it.",
      statusClassName: "error",
      subtitle: "The payment did not complete successfully.",
      title: "Payment failed"
    };
  }

  return {
    note:
      "Return to IntervueAI to refresh your premium status. If payment was completed, access should sync shortly.",
    statusClassName: "",
    subtitle:
      "We have received your payment callback and are checking the latest status for this payment link.",
    title: "Checking payment status"
  };
};

const PaymentStatusIcon = ({ success = false }: { success?: boolean }) => (
  <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
    {success ? (
      <path
        d="M6.5 12.5 10 16l7.5-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ) : (
      <>
        <path
          d="M12 8v4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <circle cx="12" cy="16.5" fill="currentColor" r="1" />
      </>
    )}
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default async function RazorpayCallbackPage({
  searchParams
}: {
  searchParams: Promise<{
    razorpay_payment_link_id?: string;
    razorpay_payment_link_reference_id?: string;
    razorpay_payment_link_status?: string;
    razorpay_payment_id?: string;
  }>;
}) {
  const {
    razorpay_payment_link_id: paymentLinkId,
    razorpay_payment_link_reference_id: referenceId,
    razorpay_payment_link_status: paymentStatus,
    razorpay_payment_id: paymentId
  } = await searchParams;
  const state = getPaymentState(paymentStatus);
  const isSuccess = state.statusClassName === "success";

  return (
    <main className="verify-shell">
      <section className="verify-card">
        <div className="verify-brand">
          <span className="brand-mark">IA</span>
          <span>
            <strong>IntervueAI</strong>
            <span>Premium payment status</span>
          </span>
        </div>

        <div className={`verify-status ${state.statusClassName}`.trim()}>
          <div className="verify-status-icon">
            <PaymentStatusIcon success={isSuccess} />
          </div>
          <div>
            <h1>{state.title}</h1>
            <p>{state.subtitle}</p>
          </div>
        </div>

        <div className="payment-meta">
          {paymentStatus ? (
            <div className="payment-meta-item">
              <span>Status</span>
              <strong>{paymentStatus}</strong>
            </div>
          ) : null}
          {paymentLinkId ? (
            <div className="payment-meta-item">
              <span>Payment link</span>
              <strong>{paymentLinkId}</strong>
            </div>
          ) : null}
          {paymentId ? (
            <div className="payment-meta-item">
              <span>Payment ID</span>
              <strong>{paymentId}</strong>
            </div>
          ) : null}
          {referenceId ? (
            <div className="payment-meta-item">
              <span>Reference</span>
              <strong>{referenceId}</strong>
            </div>
          ) : null}
        </div>

        <div className="verify-actions">
          <a className="button" href={paywallDeepLink}>
            Open IntervueAI
          </a>
          <Link className="button secondary" href="/">
            Back to website
          </Link>
        </div>

        <p className="verify-note">{state.note}</p>
      </section>
    </main>
  );
}
