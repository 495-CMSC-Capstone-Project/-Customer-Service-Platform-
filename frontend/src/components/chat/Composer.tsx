import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingState } from "../common/LoadingState";

interface ComposerProps {
  disabled: boolean;
  sending: boolean;
  disabledReason?: string;
  onSend: (message: string) => Promise<void>;
}

export function Composer({
  disabled,
  sending,
  disabledReason,
  onSend,
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const length = message.trim().length;
  const tooLong = message.length > 2000;
  const canSend = !disabled && !sending && length >= 1 && !tooLong;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      if (tooLong || (message.trim().length > 0 && (length < 1 || length > 2000))) {
        setError("Message must contain 1–2,000 characters.");
      }
      return;
    }

    setError(null);
    try {
      await onSend(message);
      setMessage("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send the message.",
      );
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} aria-busy={sending}>
      <label htmlFor="support-message" className="sr-only">
        Describe the issue
      </label>
      <textarea
        id="support-message"
        name="message"
        rows={3}
        maxLength={2000}
        placeholder="Describe the issue in your own words"
        value={message}
        disabled={disabled || sending}
        onChange={(event) => {
          setMessage(event.target.value);
          setError(null);
        }}
      />
      <div className="composer__row">
        <p className={`char-count${tooLong ? " is-invalid" : ""}`}>
          {message.length}/2000
        </p>
        <button
          type="submit"
          className="button button--primary"
          disabled={!canSend}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
      {sending ? <LoadingState /> : null}
      {disabled && disabledReason ? (
        <p className="composer__note">{disabledReason}</p>
      ) : null}
      <ErrorMessage message={error} />
    </form>
  );
}
