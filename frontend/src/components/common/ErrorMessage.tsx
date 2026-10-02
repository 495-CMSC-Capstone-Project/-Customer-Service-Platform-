interface ErrorMessageProps {
  message: string | null;
  id?: string;
}

export function ErrorMessage({ message, id }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="error-message" role="alert">
      {message}
    </p>
  );
}
