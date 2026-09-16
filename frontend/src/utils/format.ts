import type { ConversationStatus, TicketStatus } from "../types/support";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatStatus(status: ConversationStatus | TicketStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}% confidence`;
}

export function formatCategory(category: string): string {
  return category
    .split("_")
    .map((part) =>
      part === "AI" ? "AI" : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}
