import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  claimEscalationTicket,
  fetchEscalationQueue,
  type EscalationQueueItem,
} from "../api/escalations";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingState } from "../components/common/LoadingState";
import type { TicketStatus } from "../types/support";
import { formatCategory, formatDateTime, formatStatus } from "../utils/format";

export function AgentReviewPage() {
  const [items, setItems] = useState<EscalationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEscalationQueue();
      setItems(result.escalations);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load the agent review queue.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function handleClaim(ticketId: string) {
    setClaimingId(ticketId);
    setError(null);
    try {
      const claimed = await claimEscalationTicket(ticketId);
      setItems((current) =>
        current.map((item) =>
          item.ticketId === ticketId
            ? {
                ...item,
                status: claimed.status as EscalationQueueItem["status"],
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to claim this escalation ticket.",
      );
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Human review</p>
          <h1>Agent review queue</h1>
          <p className="page__lede">
            Review conversations that the AI marked for human attention. This is a
            course-scale agent dashboard prototype, not a live agent workspace.
          </p>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void loadQueue()}
          disabled={loading}
        >
          Refresh queue
        </button>
      </header>

      <ErrorMessage message={error} />

      {loading ? <LoadingState label="Loading escalation queue…" /> : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state empty-state--panel">
          <h2>No active escalations</h2>
          <p>
            When a live conversation escalates, tickets appear here for human
            review. Try asking for a human representative in{" "}
            <Link to="/conversations/conv_001">conv_001</Link>.
          </p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="agent-queue">
          {items.map((item) => (
            <li key={item.ticketId} className="agent-queue__card">
              <div className="agent-queue__top">
                <strong>{item.ticketId}</strong>
                <span
                  className={
                    item.status === "IN_PROGRESS"
                      ? "status-badge status-badge--active"
                      : "status-badge status-badge--escalated"
                  }
                >
                  {formatStatus(item.status as TicketStatus)}
                </span>
              </div>
              <p className="field-hint">
                Conversation {item.conversationId} · Customer {item.customerId} ·{" "}
                {item.assignedQueue}
              </p>
              <p className="agent-queue__reason">
                Reason: {formatCategory(item.reason)}
              </p>
              <p className="agent-queue__summary">{item.summary}</p>
              <p className="conversation-card__meta">
                Created {formatDateTime(item.createdAt)} · Updated{" "}
                {formatDateTime(item.updatedAt)}
              </p>
              <div className="agent-queue__actions">
                <Link
                  className="button button--secondary"
                  to={`/conversations/${item.conversationId}`}
                >
                  Open conversation
                </Link>
                {item.status === "OPEN" ? (
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={claimingId === item.ticketId}
                    onClick={() => void handleClaim(item.ticketId)}
                  >
                    {claimingId === item.ticketId
                      ? "Claiming…"
                      : "Claim for review"}
                  </button>
                ) : (
                  <span className="field-hint">Claimed for review</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
