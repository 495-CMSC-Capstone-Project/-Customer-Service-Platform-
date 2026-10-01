import { useRef, useState, type FormEvent } from "react";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingState } from "../common/LoadingState";

interface ComposerProps {
  disabled: boolean;
  sending: boolean;
  disabledReason?: string;
  draftKey?: string;
  onSend: (message: string) => Promise<void>;
}

export function Composer({
  disabled,
  sending,
  disabledReason,
  draftKey,
  onSend,
}: ComposerProps) {
  const [message, setMessage] = useState(() => {
    try { return draftKey ? sessionStorage.getItem(draftKey) ?? "" : ""; }
    catch { return ""; }
  });
  const [error, setError] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState(false);
  const inFlight = useRef(false);
  const trimmedMessage = message.trim();
  const length = trimmedMessage.length;
  const tooLong = length > 2000;
  const canSend = !disabled && !sending && length >= 1 && !tooLong;
  const characterCountId = "support-message-count";
  const errorId = "support-message-error";
  const disabledReasonId = "support-message-disabled-reason";
  const describedBy = [
    characterCountId,
    error ? errorId : null,
    disabled && disabledReason ? disabledReasonId : null,
  ]
    .filter(Boolean)
    .join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!canSend) {
      if (length < 1) {
        setError("Message cannot be blank.");
      } else if (tooLong) {
        setError("Message must contain 1–2,000 characters.");
      }
      return;
    }

    setError(null);
    inFlight.current = true;
    try {
      await onSend(trimmedMessage);
      setMessage("");
      persistDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send the message.",
      );
    } finally {
      inFlight.current = false;
    }
  }

  function persistDraft(value: string) {
    if (!draftKey) return;
    try {
      if (value) sessionStorage.setItem(draftKey, value);
      else sessionStorage.removeItem(draftKey);
      setDraftWarning(false);
    } catch {
      setDraftWarning(true);
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
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? errorId : undefined}
        onChange={(event) => {
          setMessage(event.target.value);
          persistDraft(event.target.value);
          setError(null);
        }}
      />
      <div className="composer__row">
        <p
          id={characterCountId}
          className={`char-count${tooLong ? " is-invalid" : ""}`}
        >
          {message.length}/2000
        </p>
        <button
          type="submit"
          className="button button--primary"
          disabled={!canSend}
        >
          {sending ? "Sending…" : error ? "Retry send" : "Send"}
        </button>
      </div>
      {sending ? <LoadingState /> : null}
      {disabled && disabledReason ? (
        <p id={disabledReasonId} className="composer__note">
          {disabledReason}
        </p>
      ) : null}
      <ErrorMessage id={errorId} message={error} />
      {draftWarning ? <p className="field-hint" role="status">Your draft is kept on this page only because browser storage is unavailable.</p> : null}
    </form>
  );
}
