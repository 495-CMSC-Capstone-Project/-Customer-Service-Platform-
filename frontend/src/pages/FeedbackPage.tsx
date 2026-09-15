import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FeedbackForm } from "../components/feedback/FeedbackForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useSupport } from "../context/SupportContext";
import { ConversationStatus, ResolutionType } from "../types/support";
import { formatCategory, formatDateTime } from "../utils/format";

export function FeedbackPage() {
  const { conversationId } = useParams();
  const { customerId } = useAuth();
  const { store, getFeedback, getTicket, submitFeedback } = useSupport();
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = store.conversations.find(
    (item) => item.conversationId === conversationId,
  );
  const existing = conversationId ? getFeedback(conversationId) : undefined;
  const ticket = conversationId ? getTicket(conversationId) : undefined;

  if (!conversationId || !conversation) {
    return (
      <section className="page">
        <h1>Conversation not found</h1>
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
        <Link to="/conversations" className="button button--secondary">
          Back to conversations
        </Link>
      </section>
    );
  }

  const recorded = existing;
  const defaultResolutionType =
    conversation.status === ConversationStatus.ESCALATED || ticket
      ? ResolutionType.HUMAN_RESOLVED
      : ResolutionType.AI_RESOLVED;

  return (
    <section className="page page--narrow">
      <p className="eyebrow">
        <Link to={`/conversations/${conversation.conversationId}`}>
          Back to conversation
        </Link>
      </p>
      <h1>Resolution feedback</h1>
      <p className="page__lede">
        Record whether this issue was handled by the AI assistant or a human
        agent so the prototype can keep an outcome on the conversation.
      </p>

      {recorded ? (
        <div className="auth-card">
          {justSubmitted ? (
            <p className="notice notice--success" role="status">
              Feedback recorded.
            </p>
          ) : null}
          <p>
            <strong>{recorded.feedbackId}</strong> ·{" "}
            {formatCategory(recorded.resolutionType)}
          </p>
          <p>
            Successful: {recorded.successful ? "Yes" : "No"} · Category:{" "}
            {formatCategory(recorded.category)}
          </p>
          <p className="conversation-card__meta">
            Submitted {formatDateTime(recorded.createdAt)}
          </p>
          <StatusBadge status={conversation.status} />
        </div>
      ) : (
        <div className="auth-card">
          <ErrorMessage message={error} />
          <FeedbackForm
            defaultResolutionType={defaultResolutionType}
            onSubmit={(payload) => {
              setError(null);
              try {
                submitFeedback(conversation.conversationId, payload);
                setJustSubmitted(true);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Unable to record feedback.",
                );
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
