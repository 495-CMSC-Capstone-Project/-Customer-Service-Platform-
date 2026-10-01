import { createContext, useContext } from "react";
import type {
  Conversation,
  Feedback,
  Message,
  PrototypeStore,
  ResolutionType,
  SendMessageResult,
  Ticket,
} from "../types/support";

export interface SupportContextValue {
  store: PrototypeStore;
  sendingConversationId: string | null;
  storageWarning: string | null;
  customerConversations: Conversation[];
  registerCustomer: (customerId: string, name: string) => void;
  createConversation: () => string;
  sendMessage: (
    conversationId: string,
    message: string,
  ) => Promise<SendMessageResult>;
  submitFeedback: (
    conversationId: string,
    payload: {
      resolutionType: ResolutionType;
      successful: boolean;
      category: string;
    },
  ) => Feedback;
  getMessages: (conversationId: string) => Message[];
  getTicket: (conversationId: string) => Ticket | undefined;
  getFeedback: (conversationId: string) => Feedback | undefined;
  getPreview: (conversationId: string) => string;
}

export const SupportContext = createContext<SupportContextValue | null>(null);

export function useSupport(): SupportContextValue {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error("useSupport must be used within SupportProvider");
  }
  return context;
}
