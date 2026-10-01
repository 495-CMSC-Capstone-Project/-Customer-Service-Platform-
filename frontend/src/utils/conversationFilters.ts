import {
  ConversationStatus,
  type Conversation,
  type Ticket,
} from "../types/support";

export const ConversationStatusFilter = {
  ALL: "ALL",
  ...ConversationStatus,
} as const;

export type ConversationStatusFilter =
  (typeof ConversationStatusFilter)[keyof typeof ConversationStatusFilter];

export const ConversationSort = {
  NEWEST: "NEWEST",
  OLDEST: "OLDEST",
} as const;

export type ConversationSort =
  (typeof ConversationSort)[keyof typeof ConversationSort];

export interface ConversationListItem {
  conversation: Conversation;
  preview: string;
  ticket?: Ticket;
}

interface ConversationFilterOptions {
  query: string;
  status: ConversationStatusFilter;
  sort: ConversationSort;
}

export type ConversationStatusCounts = Record<
  ConversationStatusFilter,
  number
>;

export function getConversationStatusCounts(
  conversations: Conversation[],
): ConversationStatusCounts {
  const counts: ConversationStatusCounts = {
    ALL: conversations.length,
    ACTIVE: 0,
    ESCALATED: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  for (const conversation of conversations) {
    counts[conversation.status] += 1;
  }

  return counts;
}

export function filterAndSortConversations(
  items: ConversationListItem[],
  options: ConversationFilterOptions,
): ConversationListItem[] {
  const normalizedQuery = options.query.trim().toLocaleLowerCase();

  return items
    .filter(({ conversation }) => {
      return (
        options.status === ConversationStatusFilter.ALL ||
        conversation.status === options.status
      );
    })
    .filter(({ conversation, preview, ticket }) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        conversation.conversationId,
        preview,
        ticket?.ticketId,
        ticket?.assignedQueue,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return searchableText.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftTime = new Date(left.conversation.updatedAt).getTime();
      const rightTime = new Date(right.conversation.updatedAt).getTime();
      return options.sort === ConversationSort.NEWEST
        ? rightTime - leftTime
        : leftTime - rightTime;
    });
}
