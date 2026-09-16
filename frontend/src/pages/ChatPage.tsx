import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Composer } from "../components/chat/Composer";
import { EscalationBanner } from "../components/chat/EscalationBanner";
import { MessageBubble } from "../components/chat/MessageBubble";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useSupport } from "../context/SupportContext";
import { ConversationStatus } from "../types/support";

export function ChatPage() {
  const { conversationId } = useParams();
  const { customerId } = useAuth();
  const {
    store,
    sendingConversationId,
    sendMessage,
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

  const isActive = conversation.status === ConversationStatus.ACTIVE;
  const canLeaveFeedback = !feedback;

  return (
    <section className="chat-page">
      <header className="chat-page__header">
        <div>
          <p className="eyebrow">
            <Link to="/conversations">Conversations</Link>
          </p>
          <h1>{conversation.conversationId}</h1>
        </div>
        <StatusBadge status={conversation.status} />
      </header>

      {ticket ? <EscalationBanner ticket={ticket} /> : null}

      <div className="chat__messages" aria-live="polite">
        {messages.map((message) => (
          <MessageBubble key={message.messageId} message={message} />
        ))}
        <div ref={endRef} />
      </div>

      <Composer
        disabled={!isActive}
        sending={sending}
        disabledReason={
          isActive
            ? undefined
            : "Messaging is paused because this conversation is no longer active."
        }
        onSend={async (message) => {
          await sendMessage(conversation.conversationId, message);
        }}
      />

      {canLeaveFeedback ? (
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
