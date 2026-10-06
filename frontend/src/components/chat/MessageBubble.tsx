import type { Message } from "../../types/support";
import { formatConfidence, formatDateTime } from "../../utils/format";

const senderLabel = {
  CUSTOMER: "You",
  AI: "AI assistant",
  HUMAN: "Human agent",
  SYSTEM: "System",
} as const;

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const label = senderLabel[message.senderType];
  const source = message.source ?? (message.senderType === "AI" || message.senderType === "HUMAN"
    ? message.senderType
    : undefined);

  return (
    <article
      className={`bubble bubble--${message.senderType.toLowerCase()}`}
      aria-label={`${label} message`}
    >
      <p className="bubble__text">{message.messageText}</p>
      <p className="bubble__meta">
        <span>{label}</span>
        {source ? <span>Source: {source}</span> : null}
        {typeof message.confidence === "number" ? (
          <span title="This demo returns a preset score, not a measured probability that the answer is correct.">{formatConfidence(message.confidence)} · demo score</span>
        ) : null}
        <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
      </p>
      {typeof message.confidence === "number" ? (
        <div
          className="confidence-meter"
          role="meter"
          aria-label="AI confidence demo score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(message.confidence * 100)}
          title="Demonstration confidence score only"
        >
          <div
            className="confidence-meter__fill"
            style={{ width: `${Math.round(message.confidence * 100)}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
