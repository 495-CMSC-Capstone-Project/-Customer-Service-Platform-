import {
  ConversationStatus,
  EscalationReason,
  FeedbackCategory,
  ResolutionType,
  SenderType,
  TicketStatus,
  type PrototypeStore,
} from "../types/support";

export const DEMO_CUSTOMER_ID = "cust_001";
export const LIVE_CONVERSATION_ID = "conv_001";

export function createSeed(): PrototypeStore {
  return {
    customers: [
      {
        customerId: DEMO_CUSTOMER_ID,
        name: "Jordan Lee",
        accountStatus: "ACTIVE",
      },
    ],
    conversations: [
      {
        conversationId: LIVE_CONVERSATION_ID,
        customerId: DEMO_CUSTOMER_ID,
        status: ConversationStatus.ACTIVE,
        createdAt: "2026-09-14T16:00:00.000Z",
        updatedAt: "2026-09-14T16:00:00.000Z",
      },
      {
        conversationId: "conv_12345",
        customerId: DEMO_CUSTOMER_ID,
        status: ConversationStatus.RESOLVED,
        createdAt: "2026-09-14T15:10:00.000Z",
        updatedAt: "2026-09-14T15:12:00.000Z",
      },
      {
        conversationId: "conv_esc_01",
        customerId: DEMO_CUSTOMER_ID,
        status: ConversationStatus.ESCALATED,
        createdAt: "2026-09-13T18:02:00.000Z",
        updatedAt: "2026-09-13T18:06:00.000Z",
      },
      {
        conversationId: "conv_res_01",
        customerId: DEMO_CUSTOMER_ID,
        status: ConversationStatus.RESOLVED,
        createdAt: "2026-09-12T11:20:00.000Z",
        updatedAt: "2026-09-12T11:24:00.000Z",
      },
      {
        conversationId: "conv_old_01",
        customerId: DEMO_CUSTOMER_ID,
        status: ConversationStatus.CLOSED,
        createdAt: "2026-09-08T09:40:00.000Z",
        updatedAt: "2026-09-08T09:55:00.000Z",
      },
    ],
    messages: [
      {
        messageId: "msg_1001",
        conversationId: "conv_12345",
        senderType: SenderType.CUSTOMER,
        messageText: "How do I reset my password?",
        createdAt: "2026-09-14T15:10:20.000Z",
      },
      {
        messageId: "msg_1002",
        conversationId: "conv_12345",
        senderType: SenderType.AI,
        messageText:
          "Select Forgot Password on the sign-in page and follow the reset instructions.",
        source: "AI",
        confidence: 0.94,
        createdAt: "2026-09-14T15:12:00.000Z",
      },
      {
        messageId: "msg_2001",
        conversationId: "conv_esc_01",
        senderType: SenderType.CUSTOMER,
        messageText:
          "My last invoice looks wrong and I want to speak to a manager.",
        createdAt: "2026-09-13T18:02:10.000Z",
      },
      {
        messageId: "msg_2002",
        conversationId: "conv_esc_01",
        senderType: SenderType.AI,
        messageText:
          "I understand that you would like additional assistance. I can escalate this conversation to a human agent.",
        source: "AI",
        confidence: 0.95,
        createdAt: "2026-09-13T18:04:00.000Z",
      },
      {
        messageId: "msg_2003",
        conversationId: "conv_esc_01",
        senderType: SenderType.SYSTEM,
        messageText:
          "This issue was sent to Billing Support. Ticket ticket_9821 is OPEN.",
        createdAt: "2026-09-13T18:06:00.000Z",
      },
      {
        messageId: "msg_3001",
        conversationId: "conv_res_01",
        senderType: SenderType.CUSTOMER,
        messageText: "How can I update my account information?",
        createdAt: "2026-09-12T11:20:12.000Z",
      },
      {
        messageId: "msg_3002",
        conversationId: "conv_res_01",
        senderType: SenderType.AI,
        messageText:
          "You can update your account information from the profile page.",
        source: "AI",
        confidence: 0.8,
        createdAt: "2026-09-12T11:24:00.000Z",
      },
      {
        messageId: "msg_4001",
        conversationId: "conv_old_01",
        senderType: SenderType.CUSTOMER,
        messageText: "Where do I find my recent invoices?",
        createdAt: "2026-09-08T09:40:30.000Z",
      },
      {
        messageId: "msg_4002",
        conversationId: "conv_old_01",
        senderType: SenderType.AI,
        messageText:
          "You can view invoices and update a payment method from Billing in your account settings.",
        source: "AI",
        confidence: 0.88,
        createdAt: "2026-09-08T09:42:00.000Z",
      },
      {
        messageId: "msg_5001",
        conversationId: LIVE_CONVERSATION_ID,
        senderType: SenderType.SYSTEM,
        messageText:
          "This conversation is connected to the backend AI. Replies come from FastAPI and the AI orchestration service.",
        createdAt: "2026-09-14T16:00:00.000Z",
      },
    ],
    tickets: [
      {
        ticketId: "ticket_9821",
        conversationId: "conv_esc_01",
        reason: EscalationReason.CUSTOMER_REQUEST,
        summary:
          "My last invoice looks wrong and I want to speak to a manager.",
        status: TicketStatus.OPEN,
        assignedQueue: "Billing Support",
        createdAt: "2026-09-13T18:06:00.000Z",
        updatedAt: "2026-09-13T18:06:00.000Z",
      },
    ],
    feedback: [
      {
        feedbackId: "fb_4521",
        conversationId: "conv_old_01",
        resolutionType: ResolutionType.AI_RESOLVED,
        successful: true,
        category: FeedbackCategory.BILLING,
        createdAt: "2026-09-08T09:55:00.000Z",
      },
    ],
  };
}
