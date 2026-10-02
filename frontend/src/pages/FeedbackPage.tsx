import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FeedbackForm } from "../components/feedback/FeedbackForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useAuth } from "../context/auth";
import { useSupport } from "../context/support";
import { LIVE_CONVERSATION_ID } from "../data/seed";
import { ResolutionType } from "../types/support";
import { formatCategory, formatDateTime } from "../utils/format";

export function FeedbackPage() {
  const { conversationId } = useParams();
  const { customerId } = useAuth();
  const { store, storageWarning, sendingConversationId, getFeedback, getMessages, submitFeedback } = useSupport();
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = store.conversations.find(
    (item) => item.conversationId === conversationId,
  );
  const existing = conversationId ? getFeedback(conversationId) : undefined;

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
    getMessages(conversationId).some((message) => message.senderType === "HUMAN")
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
        Tell us whether the support helped. Feedback for the live support conversation
        is recorded by the backend. Sample conversations remain browser-only demonstrations.
      </p>
      {storageWarning ? <p className="error-message" role="status">{storageWarning}</p> : null}

      {recorded ? (
        <div className="auth-card">
          {justSubmitted ? (
            <p className="notice notice--success" role="status">
              {conversation.conversationId === LIVE_CONVERSATION_ID
                ? "Feedback recorded successfully."
                : storageWarning
                  ? "Feedback recorded for this page only."
                  : "Feedback saved in this browser."}
            </p>
          ) : null}
          <p>
            <strong>{recorded.feedbackId}</strong> ·{" "}
            {recorded.resolutionType === ResolutionType.HUMAN_RESOLVED ? "Human support" : "AI support"}
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
      ) : sendingConversationId === conversationId ? (
        <p role="status">Wait for the current reply before leaving feedback.</p>
      ) : (
        <div className="auth-card">
          <ErrorMessage message={error} />
          <FeedbackForm
            defaultResolutionType={defaultResolutionType}
            onSubmit={async (payload) => {
              setError(null);
              
              try {
                await submitFeedback(
                  conversation.conversationId,
                  payload,
                );
                  
                setJustSubmitted(true);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Unable to record feedback.",
                );

                throw cause;
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
