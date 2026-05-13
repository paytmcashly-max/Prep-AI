import Badge from "./Badge";

export default function TimerPill({ label }) {
  return <Badge icon="timer" label={label} tone="warning" />;
}
