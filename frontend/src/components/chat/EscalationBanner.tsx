import type { Ticket } from "../../types/support";
import { formatCategory, formatStatus } from "../../utils/format";
import { StatusBadge } from "../common/StatusBadge";

interface EscalationBannerProps {
  ticket: Ticket;
}

export function EscalationBanner({ ticket }: EscalationBannerProps) {
  return (
    <aside className="escalation-banner" role="status">
      <div>
        <p className="escalation-banner__title">Sent to a human agent</p>
        <p>
          Ticket <strong>{ticket.ticketId}</strong> is in{" "}
          {ticket.assignedQueue}. Reason: {formatCategory(ticket.reason)}.
        </p>
      </div>
      <StatusBadge status={ticket.status} />
      <p className="sr-only">Current ticket status: {formatStatus(ticket.status)}</p>
    </aside>
  );
}
