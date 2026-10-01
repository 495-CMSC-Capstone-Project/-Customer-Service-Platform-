import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Composer } from "../components/chat/Composer";
import { EscalationBanner } from "../components/chat/EscalationBanner";
import { MessageBubble } from "../components/chat/MessageBubble";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../context/auth";
import { useSupport } from "../context/support";
import { ConversationStatus } from "../types/support";
import { LIVE_CONVERSATION_ID } from "../data/seed";

export function ChatPage() {
  const { conversationId } = useParams();
  const { customerId } = useAuth();
  const {
    store,
    storageWarning,
    sendingConversationId,
    sendMessage,
    getDraft,
    setDraftMessage,
    getMessages,
    getTicket,
    getFeedback,
  } = useSupport();
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = store.conversations.find(
    (item) => item.conversationId === conversationId,
  );
  const messages = conversationId ? getMessages(conversationId) : [];
  const ticket = conversationId ? getTicket(conversationId) : undefined;
  const feedback = conversationId ? getFeedback(conversationId) : undefined;
  const sending =
    Boolean(conversationId) && sendingConversationId === conversationId;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  if (!conversationId || !conversation) {
    return (
      <section className="page">
        <h1>Conversation not found</h1>
        <p>That conversation does not exist in this prototype.</p>
        <Link to="/conversations" className="button button--secondary">
          Back to conversations
        </Link>
      </section>
    );
  }

  if (conversation.customerId !== customerId) {
    return (
      <section className="page">
        <h1>You do not have access</h1>
        <p>This conversation belongs to another customer account.</p>
        <Link to="/conversations" className="button button--secondary">
          Back to conversations
        </Link>
      </section>
    );
  }

  const isLive = conversationId === LIVE_CONVERSATION_ID;
  const needsReview = isLive && conversation.status === ConversationStatus.ESCALATED;
  const canLeaveFeedback = !feedback;
  const draft = getDraft(conversationId);

  return (
    <section className="chat-page">
      <header className="chat-page__header">
        <div>
          <p className="eyebrow">
            <Link to="/conversations">Conversations</Link>
          </p>
          <h1>{conversation.conversationId}</h1>
        </div>
        {needsReview ? <span className="status-badge status-badge--escalated">Human review recommended</span> : <StatusBadge status={conversation.status} />}
      </header>

      <p className="field-hint">
        {isLive
          ? "Live AI demo. This browser keeps the visible history; it does not retrieve previous sessions from the server. Do not enter sensitive information."
          : "Sample conversation. These messages and ticket details are demonstration data stored in this browser."}
      </p>
      {storageWarning ? <p className="error-message" role="status">{storageWarning}</p> : null}

      {needsReview ? (
        <aside className="escalation-banner" role="status">
          <div>
            <p className="escalation-banner__title">This issue may need a person</p>
            <p>The assistant recommended human review. This demo does not connect to an agent or confirm a support ticket. You can continue using the AI assistant below.</p>
          </div>
        </aside>
      ) : null}

      {ticket ? <EscalationBanner ticket={ticket} /> : null}

      <div className="chat__messages" role="log" aria-label="Conversation messages" aria-relevant="additions" aria-live="polite">
        {messages.filter((message) => !isLive || message.senderType !== "SYSTEM").map((message) => (
          <MessageBubble key={message.messageId} message={message} />
        ))}
        {isLive && !messages.some((message) => message.senderType !== "SYSTEM") ? <p className="empty-state">Describe your support issue to begin.</p> : null}
        <div ref={endRef} />
      </div>

      <Composer
        key={`${customerId}:${conversationId}`}
        message={draft.message}
        onMessageChange={(message) => setDraftMessage(conversationId, message)}
        sendError={draft.error}
        draftWarning={draft.storageWarning}
        disabled={!isLive}
        sending={sending}
        disabledReason={
          isLive
            ? undefined
            : "This sample is read-only. Return to Conversations and open the live demo to send a message."
        }
        onSend={async (message) => {
          await sendMessage(conversation.conversationId, message);
        }}
      />

      {sending ? <p className="chat-page__feedback">Feedback will be available after the reply.</p> : canLeaveFeedback ? (
        <p className="chat-page__feedback">
          Done with this issue?{" "}
          <Link to={`/conversations/${conversation.conversationId}/feedback`}>
            Leave feedback
          </Link>
        </p>
      ) : (
        <p className="chat-page__feedback">
          Feedback recorded.{" "}
          <Link to={`/conversations/${conversation.conversationId}/feedback`}>
            View the outcome
          </Link>
        </p>
      )}
    </section>
  );
}
