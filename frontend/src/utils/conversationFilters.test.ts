import { describe, expect, it } from "vitest";
import {
  ConversationStatus,
  TicketStatus,
  type Conversation,
  type Ticket,
} from "../types/support";
import {
  ConversationSort,
  ConversationStatusFilter,
  filterAndSortConversations,
  getConversationStatusCounts,
  type ConversationListItem,
} from "./conversationFilters";

const activeConversation: Conversation = {
  conversationId: "conv_active",
  customerId: "cust_001",
  status: ConversationStatus.ACTIVE,
  createdAt: "2026-09-01T09:00:00.000Z",
  updatedAt: "2026-09-03T09:00:00.000Z",
};

const escalatedConversation: Conversation = {
  conversationId: "conv_billing",
  customerId: "cust_001",
  status: ConversationStatus.ESCALATED,
  createdAt: "2026-09-01T09:00:00.000Z",
  updatedAt: "2026-09-02T09:00:00.000Z",
};

const billingTicket: Ticket = {
  ticketId: "ticket_42",
  conversationId: escalatedConversation.conversationId,
  reason: "CUSTOMER_REQUEST",
  summary: "Incorrect invoice",
  status: TicketStatus.OPEN,
  assignedQueue: "Billing Support",
  createdAt: "2026-09-02T09:00:00.000Z",
  updatedAt: "2026-09-02T09:00:00.000Z",
};

const items: ConversationListItem[] = [
  {
    conversation: activeConversation,
    preview: "I cannot update my password",
  },
  {
    conversation: escalatedConversation,
    preview: "My invoice is incorrect",
    ticket: billingTicket,
  },
];

describe("conversation filters", () => {
  it("counts every supported status and the total", () => {
    expect(
      getConversationStatusCounts([activeConversation, escalatedConversation]),
    ).toEqual({
      ALL: 2,
      ACTIVE: 1,
      ESCALATED: 1,
      RESOLVED: 0,
      CLOSED: 0,
    });
  });

  it("searches conversation previews without matching letter case", () => {
    const result = filterAndSortConversations(items, {
      query: "  PASSWORD ",
      status: ConversationStatusFilter.ALL,
      sort: ConversationSort.NEWEST,
    });

    expect(result.map(({ conversation }) => conversation.conversationId)).toEqual([
      "conv_active",
    ]);
  });

  it("searches ticket IDs and assigned queues", () => {
    const byTicket = filterAndSortConversations(items, {
      query: "ticket_42",
      status: ConversationStatusFilter.ALL,
      sort: ConversationSort.NEWEST,
    });
    const byQueue = filterAndSortConversations(items, {
      query: "billing support",
      status: ConversationStatusFilter.ALL,
      sort: ConversationSort.NEWEST,
    });

    expect(byTicket).toHaveLength(1);
    expect(byQueue).toHaveLength(1);
    expect(byQueue[0].conversation.conversationId).toBe("conv_billing");
  });

  it("combines a status filter with a search query", () => {
    const result = filterAndSortConversations(items, {
      query: "invoice",
      status: ConversationStatusFilter.ACTIVE,
      sort: ConversationSort.NEWEST,
    });

    expect(result).toEqual([]);
  });

  it("sorts conversations from oldest to newest when selected", () => {
    const result = filterAndSortConversations(items, {
      query: "",
      status: ConversationStatusFilter.ALL,
      sort: ConversationSort.OLDEST,
    });

    expect(result.map(({ conversation }) => conversation.conversationId)).toEqual([
      "conv_billing",
      "conv_active",
    ]);
  });
});
