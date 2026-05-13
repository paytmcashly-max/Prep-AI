import LimitCard from "./ui/LimitCard";

const DEFAULT_BENEFITS = [
  "Unlimited practice",
  "Longer interviews: 10/15/20 questions",
  "More resume scans",
  "Priority feedback when premium features launch"
];

export default function FreeLimitCard({
  benefits = DEFAULT_BENEFITS,
  countdownLabel = "Resets in",
  message = "You've used today's free interview questions. Upgrade for more practice or come back after reset.",
  onBack,
  onUpgrade,
  primaryLabel = "Upgrade to Premium",
  resetCountdown,
  secondaryLabel = "Back",
  style,
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
      style={style}
      title={title}
    />
  );
}
