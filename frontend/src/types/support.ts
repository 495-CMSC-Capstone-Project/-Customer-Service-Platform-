export const ConversationStatus = {
  ACTIVE: "ACTIVE",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type ConversationStatus =
  (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const SenderType = {
  CUSTOMER: "CUSTOMER",
  AI: "AI",
  HUMAN: "HUMAN",
  SYSTEM: "SYSTEM",
} as const;
export type SenderType = (typeof SenderType)[keyof typeof SenderType];

export const MessageSource = {
  AI: "AI",
  HUMAN: "HUMAN",
} as const;
export type MessageSource = (typeof MessageSource)[keyof typeof MessageSource];

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const EscalationReason = {
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  COMPLEX_ISSUE: "COMPLEX_ISSUE",
  CUSTOMER_REQUEST: "CUSTOMER_REQUEST",
  AI_FAILURE: "AI_FAILURE",
} as const;
export type EscalationReason =
  (typeof EscalationReason)[keyof typeof EscalationReason];

export const ResolutionType = {
  AI_RESOLVED: "AI_RESOLVED",
  HUMAN_RESOLVED: "HUMAN_RESOLVED",
} as const;
export type ResolutionType =
  (typeof ResolutionType)[keyof typeof ResolutionType];

export const AccountStatus = {
  ACTIVE: "ACTIVE",
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const FeedbackCategory = {
  ACCOUNT_ACCESS: "ACCOUNT_ACCESS",
  BILLING: "BILLING",
  TECHNICAL: "TECHNICAL",
  GENERAL: "GENERAL",
} as const;
export type FeedbackCategory =
  (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

export interface CustomerProfile {
  customerId: string;
  name: string;
  accountStatus: AccountStatus;
}

export interface Conversation {
  conversationId: string;
  customerId: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderType: SenderType;
  messageText: string;
  source?: MessageSource;
  confidence?: number;
  createdAt: string;
}

export interface Ticket {
  ticketId: string;
  conversationId: string;
  reason: EscalationReason;
  summary: string;
  status: TicketStatus;
  assignedQueue: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  feedbackId: string;
  conversationId: string;
  resolutionType: ResolutionType;
  successful: boolean;
  category: string;
  createdAt: string;
}

export interface PrototypeStore {
  customers: CustomerProfile[];
  conversations: Conversation[];
  messages: Message[];
  tickets: Ticket[];
  feedback: Feedback[];
}

export interface SendMessageResult {
  conversationId: string;
  messageId: string;
  response: string;
  source: MessageSource;
  confidence: number;
  escalated: boolean;
}
