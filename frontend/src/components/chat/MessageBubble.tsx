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
          <span>{formatConfidence(message.confidence)}</span>
        ) : null}
        <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
      </p>
    </article>
  );
}
