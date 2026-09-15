import type { ConversationStatus, TicketStatus } from "../../types/support";
import { formatStatus } from "../../utils/format";

interface StatusBadgeProps {
  status: ConversationStatus | TicketStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {formatStatus(status)}
    </span>
  );
}
