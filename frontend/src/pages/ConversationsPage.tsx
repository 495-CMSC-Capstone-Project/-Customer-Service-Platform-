import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/common/StatusBadge";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConversationFilters } from "../components/conversations/ConversationFilters";
import { useSupport } from "../context/support";
import { useAuthModal } from "../context/authModal";
import { LIVE_CONVERSATION_ID } from "../data/seed";
import {
  ConversationSort,
  ConversationStatusFilter,
  filterAndSortConversations,
  getConversationStatusCounts,
} from "../utils/conversationFilters";
import { formatDateTime, formatStatus } from "../utils/format";

export function ConversationsPage() {
  const navigate = useNavigate();
  const { openSignIn } = useAuthModal();
  const { customerConversations, storageWarning, createConversation, getPreview, getTicket } = useSupport();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ConversationStatusFilter>(ConversationStatusFilter.ALL);
  const [sort, setSort] = useState<ConversationSort>(ConversationSort.NEWEST);
  const hasLive = customerConversations.some((item) => item.conversationId === LIVE_CONVERSATION_ID);

  const counts = useMemo(() => getConversationStatusCounts(customerConversations), [customerConversations]);
  const items = useMemo(() => customerConversations.map((conversation) => ({
    conversation,
    preview: getPreview(conversation.conversationId),
    ticket: getTicket(conversation.conversationId),
  })), [customerConversations, getPreview, getTicket]);
  const visible = useMemo(() => filterAndSortConversations(items, { query, status, sort }), [items, query, status, sort]);

  function handleStart() {
    setError(null);
    try {
      navigate("/conversations/" + createConversation());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open the conversation.");
    }
  }

  function clearFilters() {
    setQuery("");
    setStatus(ConversationStatusFilter.ALL);
    setSort(ConversationSort.NEWEST);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your support</p>
          <h1>Conversations</h1>
          <p className="page__lede">Continue your AI conversation or browse the sample support history.</p>
        </div>
        <button type="button" className="button button--primary" onClick={hasLive ? handleStart : openSignIn}>
          {hasLive ? "Open live AI chat" : "Use demo profile"}
        </button>
      </header>
      <ErrorMessage message={error} />
      {storageWarning ? <p className="error-message" role="status">{storageWarning}</p> : null}
      <p className="field-hint conversation-note">
        History and feedback are stored in this browser. Sample conversations are read-only.
        {hasLive ? " Only the live demo sends messages to the AI service." : " Sign in as cust_001 to try the live demo; new local profiles do not yet have server conversations."}
      </p>

      {customerConversations.length === 0 ? (
        <div className="empty-state empty-state--panel">
          <h2>No conversations for this profile</h2>
          <p>Use the demo profile above to try AI support.</p>
        </div>
      ) : (
        <>
          <ConversationFilters query={query} status={status} sort={sort} counts={counts}
            resultCount={visible.length} onQueryChange={setQuery} onStatusChange={setStatus}
            onSortChange={setSort} onClear={clearFilters} />
          {visible.length === 0 ? (
            <div className="empty-state empty-state--panel">
              <h2>No matching conversations</h2>
              <p>Try another keyword or use Clear filters above.</p>
            </div>
          ) : (
            <ul className="conversation-list">
              {visible.map(({ conversation, preview, ticket }) => {
                const isLive = conversation.conversationId === LIVE_CONVERSATION_ID;
                const needsReview = isLive && conversation.status === "ESCALATED";
                return (
                  <li key={conversation.conversationId}>
                    <Link className="conversation-card" to={"/conversations/" + conversation.conversationId}
                      aria-label={`Open ${conversation.conversationId}, ${needsReview ? "Human review recommended" : formatStatus(conversation.status)}`}>
                      <div className="conversation-card__top">
                        <strong>{conversation.conversationId}</strong>
                        {needsReview ? <span className="status-badge status-badge--escalated">Human review recommended</span>
                          : <StatusBadge status={conversation.status} />}
                      </div>
                      <p className="field-hint">{isLive ? "Live AI demo · local history" : "Sample conversation"}</p>
                      <p className="conversation-card__preview">{preview}</p>
                      <p className="conversation-card__meta">
                        Updated {formatDateTime(conversation.updatedAt)}
                        {ticket ? ` · Sample ticket ${ticket.ticketId} · ${ticket.assignedQueue}` : null}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
