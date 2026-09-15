interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Processing your request…",
}: LoadingStateProps) {
  return (
    <p className="loading-state" role="status" aria-live="polite">
      {label}
    </p>
  );
}
