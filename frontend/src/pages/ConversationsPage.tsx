import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/common/StatusBadge";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConversationFilters } from "../components/conversations/ConversationFilters";
import { useSupport } from "../context/support";
import { ConversationStatus } from "../types/support";
import {
  ConversationSort,
  ConversationStatusFilter,
  filterAndSortConversations,
  getConversationStatusCounts,
} from "../utils/conversationFilters";
import { formatDateTime, formatStatus } from "../utils/format";

const summaryCards = [
  {
    status: ConversationStatus.ACTIVE,
    label: "Active",
    detail: "Ready for a new message",
  },
  {
    status: ConversationStatus.ESCALATED,
    label: "Escalated",
    detail: "Waiting for human support",
  },
  {
    status: ConversationStatus.RESOLVED,
    label: "Resolved",
    detail: "Completed successfully",
  },
  {
    status: ConversationStatus.CLOSED,
    label: "Closed",
    detail: "Saved in conversation history",
  },
] as const;

export function ConversationsPage() {
  const navigate = useNavigate();
  const { customerConversations, createConversation, getPreview, getTicket } =
    useSupport();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ConversationStatusFilter>(
    ConversationStatusFilter.ALL,
  );
  const [sort, setSort] = useState<ConversationSort>(ConversationSort.NEWEST);

  const counts = useMemo(
    () => getConversationStatusCounts(customerConversations),
    [customerConversations],
  );
  const conversationItems = useMemo(
    () =>
      customerConversations.map((conversation) => ({
        conversation,
        preview: getPreview(conversation.conversationId),
        ticket: getTicket(conversation.conversationId),
      })),
    [customerConversations, getPreview, getTicket],
  );
  const visibleConversations = useMemo(
    () => filterAndSortConversations(conversationItems, { query, status, sort }),
    [conversationItems, query, sort, status],
  );

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

  function clearFilters() {
    setQuery("");
    setStatus(ConversationStatusFilter.ALL);
    setSort(ConversationSort.NEWEST);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your support</p>
          <h1>Conversations</h1>
          <p className="page__lede">
            Track recent requests, return to live support, and see which
            conversations need a human follow-up.
          </p>
        </div>
        <button type="button" className="button button--primary" onClick={handleStart}>
          Open live AI chat
        </button>
      </div>
      <ErrorMessage message={error} />

      {customerConversations.length === 0 ? (
        <div className="empty-state empty-state--panel">
          <strong>No conversations yet</strong>
          <p>Start a conversation to ask the assistant for help.</p>
        </div>
      ) : (
        <>
          <dl className="conversation-summary" aria-label="Conversation summary">
            {summaryCards.map((card) => (
              <div
                className={`summary-card summary-card--${card.status.toLowerCase()}`}
                key={card.status}
              >
                <dt>
                  <span className="summary-card__dot" aria-hidden="true" />
                  {card.label}
                </dt>
                <dd>{counts[card.status]}</dd>
                <p>{card.detail}</p>
              </div>
            ))}
          </dl>

          <div className="backend-note">
            <span className="backend-note__pulse" aria-hidden="true" />
            <p>
              <strong>Live backend demo:</strong> sign in with customer ID
              <code>cust_001</code> to open <code>conv_001</code>. New messages
              are sent through FastAPI and the AI orchestration service.
            </p>
          </div>

          <ConversationFilters
            query={query}
            status={status}
            sort={sort}
            counts={counts}
            resultCount={visibleConversations.length}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onSortChange={setSort}
            onClear={clearFilters}
          />

          {visibleConversations.length === 0 ? (
            <div className="empty-state empty-state--panel empty-state--filtered">
              <strong>No matching conversations</strong>
              <p>Try another keyword or remove the current status filter.</p>
              <button
                type="button"
                className="button button--secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="conversation-list">
              {visibleConversations.map(({ conversation, preview, ticket }) => (
                <li key={conversation.conversationId}>
                  <Link
                    className="conversation-card"
                    to={`/conversations/${conversation.conversationId}`}
                    aria-label={`Open ${conversation.conversationId}, ${formatStatus(conversation.status)}`}
                  >
                    <div className="conversation-card__top">
                      <div>
                        <span className="conversation-card__label">
                          Conversation
                        </span>
                        <strong>{conversation.conversationId}</strong>
                      </div>
                      <StatusBadge status={conversation.status} />
                    </div>
                    <p className="conversation-card__preview">{preview}</p>
                    <p className="conversation-card__meta">
                      <span>
                        Updated {formatDateTime(conversation.updatedAt)}
                      </span>
                      {ticket ? <span>Ticket {ticket.ticketId}</span> : null}
                      {ticket ? <span>{ticket.assignedQueue}</span> : null}
                    </p>
                    <span
                      className="conversation-card__action"
                      aria-hidden="true"
                    >
                      Open conversation <span>→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
