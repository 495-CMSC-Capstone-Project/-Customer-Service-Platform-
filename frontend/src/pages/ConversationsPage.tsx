import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/common/StatusBadge";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useSupport } from "../context/SupportContext";
import { formatDateTime } from "../utils/format";

export function ConversationsPage() {
  const navigate = useNavigate();
  const { customerConversations, createConversation, getPreview, getTicket } =
    useSupport();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    setError(null);
    try {
      const conversationId = createConversation();
      navigate(`/conversations/${conversationId}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to start a conversation.",
      );
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your support</p>
          <h1>Conversations</h1>
          <p className="page__lede">
            Open a past conversation or start a new one. Escalated issues stay
            visible until a human agent takes over.
          </p>
        </div>
        <button type="button" className="button button--primary" onClick={handleStart}>
          Start a conversation
        </button>
      </div>
      <ErrorMessage message={error} />

      {customerConversations.length === 0 ? (
        <p className="empty-state">
          No conversations yet. Start one to ask the assistant for help.
        </p>
      ) : (
        <ul className="conversation-list">
          {customerConversations.map((conversation) => {
            const ticket = getTicket(conversation.conversationId);
            return (
              <li key={conversation.conversationId}>
                <Link
                  className="conversation-card"
                  to={`/conversations/${conversation.conversationId}`}
                >
                  <div className="conversation-card__top">
                    <strong>{conversation.conversationId}</strong>
                    <StatusBadge status={conversation.status} />
                  </div>
                  <p>{getPreview(conversation.conversationId)}</p>
                  <p className="conversation-card__meta">
                    Updated {formatDateTime(conversation.updatedAt)}
                    {ticket
                      ? ` · Ticket ${ticket.ticketId} · ${ticket.assignedQueue}`
                      : null}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
