import LimitCard from "./ui/LimitCard";

const DEFAULT_BENEFITS = [
  "Unlimited practice",
  "Longer interviews: 10/15/20 questions",
  "More resume scans",
  "Priority AI feedback"
];

export default function FreeLimitCard({
  benefits = DEFAULT_BENEFITS,
  countdownLabel = "Resets in",
  message = "You have used today's free interview questions. Upgrade to Premium for unlimited practice or come back tomorrow.",
  onBack,
  onUpgrade,
  primaryLabel = "Upgrade to Premium",
  resetCountdown,
  secondaryLabel = "Back",
  title = "Daily free limit reached"
}) {
  return (
    <LimitCard
      benefits={benefits}
      countdownLabel={countdownLabel}
      message={message}
      onBack={onBack}
      onUpgrade={onUpgrade}
      primaryLabel={primaryLabel}
      resetCountdown={resetCountdown}
      secondaryLabel={secondaryLabel}
      title={title}
    />
  );
}
