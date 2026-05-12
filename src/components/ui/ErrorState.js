import AppButton from "./AppButton";
import EmptyState from "./EmptyState";

export default function ErrorState({ message, onRetry, title = "Something went wrong" }) {
  return (
    <EmptyState
      icon="warning"
      message={message}
      title={title}
      action={
        onRetry ? (
          <AppButton icon="refresh" onPress={onRetry} tone="secondary">
            Try again
          </AppButton>
        ) : null
      }
    />
  );
}
