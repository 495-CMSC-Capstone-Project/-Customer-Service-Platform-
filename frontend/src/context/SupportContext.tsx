import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSeed } from "../data/seed";
import {
  ConversationStatus,
  SenderType,
  TicketStatus,
  type Conversation,
  type Feedback,
  type Message,
  type PrototypeStore,
  type ResolutionType,
  type SendMessageResult,
  type Ticket,
} from "../types/support";
import { createId } from "../utils/ids";
import {
  assignQueue,
  generatePrototypeReply,
  summarizeMessage,
} from "../utils/prototypeAi";
import { useAuth } from "./AuthContext";

const STORE_KEY = "csp-prototype-store";

interface SupportContextValue {
  store: PrototypeStore;
  sendingConversationId: string | null;
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

const SupportContext = createContext<SupportContextValue | null>(null);

function loadStore(): PrototypeStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      return createSeed();
    }
    const parsed = JSON.parse(raw) as PrototypeStore;
    if (
      !Array.isArray(parsed.customers) ||
      !Array.isArray(parsed.conversations) ||
      !Array.isArray(parsed.messages) ||
      !Array.isArray(parsed.tickets) ||
      !Array.isArray(parsed.feedback)
    ) {
      return createSeed();
    }
    return parsed;
  } catch {
    return createSeed();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function SupportProvider({ children }: { children: ReactNode }) {
  const { customerId } = useAuth();
  const [store, setStore] = useState<PrototypeStore>(loadStore);
  const [sendingConversationId, setSendingConversationId] = useState<
    string | null
  >(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  if (
    customerId &&
    !store.customers.some((customer) => customer.customerId === customerId)
  ) {
    setStore((current) => {
      if (current.customers.some((customer) => customer.customerId === customerId)) {
        return current;
      }
      return {
        ...current,
        customers: [
          ...current.customers,
          {
            customerId,
            name: "Customer",
            accountStatus: "ACTIVE",
          },
        ],
      };
    });
  }

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  const customerConversations = useMemo(() => {
    if (!customerId) {
      return [];
    }
    return currentConversations(store, customerId);
  }, [customerId, store]);

  const registerCustomer = useCallback((rawCustomerId: string, rawName: string) => {
    const nextId = rawCustomerId.trim();
    const name = rawName.trim();
    if (!name) {
      throw new Error("Name is required.");
    }
    if (!nextId) {
      throw new Error("Customer ID is required.");
    }
    if (nextId.length > 64) {
      throw new Error("Customer ID must be 64 characters or fewer.");
    }
    if (
      storeRef.current.customers.some((customer) => customer.customerId === nextId)
    ) {
      throw new Error("That customer ID is already in use. Sign in instead.");
    }

    setStore((current) => ({
      ...current,
      customers: [
        ...current.customers,
        {
          customerId: nextId,
          name,
          accountStatus: "ACTIVE",
        },
      ],
    }));
  }, []);

  const createConversation = useCallback(() => {
    if (!customerId) {
      throw new Error("You need to sign in first.");
    }
    const now = new Date().toISOString();
    const conversationId = createId("conv");
    setStore((current) => ({
      ...current,
      conversations: [
        {
          conversationId,
          customerId,
          status: ConversationStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        ...current.conversations,
      ],
      messages: [
        ...current.messages,
        {
          messageId: createId("msg"),
          conversationId,
          senderType: SenderType.SYSTEM,
          messageText:
            "You can describe your issue below. Replies show whether they came from the AI assistant or a human agent.",
          createdAt: now,
        },
      ],
    }));
    return conversationId;
  }, [customerId]);

  const sendMessage = useCallback(
    async (conversationId: string, message: string) => {
      if (!customerId) {
        throw new Error("You need to sign in first.");
      }

      const trimmed = message.trim();
      if (trimmed.length < 1 || trimmed.length > 2000) {
        throw new Error("Message must contain 1–2,000 characters.");
      }

      const conversation = storeRef.current.conversations.find(
        (item) => item.conversationId === conversationId,
      );
      if (!conversation) {
        throw new Error("Conversation cannot be found.");
      }
      if (conversation.customerId !== customerId) {
        throw new Error("You do not have access to this conversation.");
      }
      if (conversation.status !== ConversationStatus.ACTIVE) {
        throw new Error(
          "This conversation is no longer active. You can view the history or leave feedback.",
        );
      }

      const now = new Date().toISOString();
      setStore((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            messageId: createId("msg"),
            conversationId,
            senderType: SenderType.CUSTOMER,
            messageText: trimmed,
            createdAt: now,
          },
        ],
        conversations: current.conversations.map((item) =>
          item.conversationId === conversationId
            ? { ...item, updatedAt: now }
            : item,
        ),
      }));
      setSendingConversationId(conversationId);

      try {
        await delay(900);
        const result = generatePrototypeReply(trimmed);
        const replyAt = new Date().toISOString();
        const aiMessageId = createId("msg");

        setStore((current) => {
          const messages = [
            ...current.messages,
            {
              messageId: aiMessageId,
              conversationId,
              senderType: SenderType.AI,
              messageText: result.responseText,
              source: "AI" as const,
              confidence: result.confidence,
              createdAt: replyAt,
            },
          ];

          if (!result.escalationRequired) {
            return {
              ...current,
              messages,
              conversations: current.conversations.map((item) =>
                item.conversationId === conversationId
                  ? { ...item, updatedAt: replyAt }
                  : item,
              ),
            };
          }

          const hasActiveTicket = current.tickets.some(
            (ticket) =>
              ticket.conversationId === conversationId &&
              (ticket.status === TicketStatus.OPEN ||
                ticket.status === TicketStatus.IN_PROGRESS),
          );
          if (hasActiveTicket) {
            return {
              ...current,
              messages,
              conversations: current.conversations.map((item) =>
                item.conversationId === conversationId
                  ? {
                      ...item,
                      status: ConversationStatus.ESCALATED,
                      updatedAt: replyAt,
                    }
                  : item,
              ),
            };
          }

          const ticketId = createId("ticket");
          const queue = assignQueue(trimmed, result.category);
          return {
            ...current,
            messages: [
              ...messages,
              {
                messageId: createId("msg"),
                conversationId,
                senderType: SenderType.SYSTEM,
                messageText: `This issue was sent to ${queue}. Ticket ${ticketId} is OPEN.`,
                createdAt: replyAt,
              },
            ],
            tickets: [
              ...current.tickets,
              {
                ticketId,
                conversationId,
                reason: result.reason ?? "CUSTOMER_REQUEST",
                summary: summarizeMessage(trimmed),
                status: TicketStatus.OPEN,
                assignedQueue: queue,
                createdAt: replyAt,
                updatedAt: replyAt,
              },
            ],
            conversations: current.conversations.map((item) =>
              item.conversationId === conversationId
                ? {
                    ...item,
                    status: ConversationStatus.ESCALATED,
                    updatedAt: replyAt,
                  }
                : item,
            ),
          };
        });

        return {
          conversationId,
          messageId: aiMessageId,
          response: result.responseText,
          source: "AI" as const,
          confidence: result.confidence,
          escalated: result.escalationRequired,
        };
      } finally {
        setSendingConversationId(null);
      }
    },
    [customerId],
  );

  const submitFeedback = useCallback(
    (
      conversationId: string,
      payload: {
        resolutionType: ResolutionType;
        successful: boolean;
        category: string;
      },
    ) => {
      if (!customerId) {
        throw new Error("You need to sign in first.");
      }
      const conversation = storeRef.current.conversations.find(
        (item) => item.conversationId === conversationId,
      );
      if (!conversation) {
        throw new Error("Conversation cannot be found.");
      }
      if (conversation.customerId !== customerId) {
        throw new Error("You do not have access to this conversation.");
      }
      if (storeRef.current.feedback.some((item) => item.conversationId === conversationId)) {
        throw new Error("Feedback has already been recorded for this conversation.");
      }
      if (!payload.category.trim()) {
        throw new Error("Choose a support category.");
      }

      const now = new Date().toISOString();
      const feedback: Feedback = {
        feedbackId: createId("fb"),
        conversationId,
        resolutionType: payload.resolutionType,
        successful: payload.successful,
        category: payload.category,
        createdAt: now,
      };

      setStore((current) => ({
        ...current,
        feedback: [...current.feedback, feedback],
        conversations: current.conversations.map((item) =>
          item.conversationId === conversationId
            ? {
                ...item,
                status: payload.successful
                  ? ConversationStatus.RESOLVED
                  : item.status === ConversationStatus.ACTIVE
                    ? ConversationStatus.RESOLVED
                    : item.status,
                updatedAt: now,
              }
            : item,
        ),
      }));

      return feedback;
    },
    [customerId],
  );

  const getMessages = useCallback(
    (conversationId: string) => {
      return store.messages
        .filter((message) => message.conversationId === conversationId)
        .slice()
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        );
    },
    [store.messages],
  );

  const getTicket = useCallback(
    (conversationId: string) => {
      return store.tickets
        .filter((ticket) => ticket.conversationId === conversationId)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0];
    },
    [store.tickets],
  );

  const getFeedback = useCallback(
    (conversationId: string) => {
      return store.feedback.find((item) => item.conversationId === conversationId);
    },
    [store.feedback],
  );

  const getPreview = useCallback(
    (conversationId: string) => {
      const messages = store.messages.filter(
        (message) =>
          message.conversationId === conversationId &&
          message.senderType !== SenderType.SYSTEM,
      );
      const last = messages[messages.length - 1];
      return last?.messageText ?? "New conversation";
    },
    [store.messages],
  );

  const value = useMemo(
    () => ({
      store,
      sendingConversationId,
      customerConversations,
      registerCustomer,
      createConversation,
      sendMessage,
      submitFeedback,
      getMessages,
      getTicket,
      getFeedback,
      getPreview,
    }),
    [
      store,
      sendingConversationId,
      customerConversations,
      registerCustomer,
      createConversation,
      sendMessage,
      submitFeedback,
      getMessages,
      getTicket,
      getFeedback,
      getPreview,
    ],
  );

  return (
    <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
  );
}

export function useSupport(): SupportContextValue {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error("useSupport must be used within SupportProvider");
  }
  return context;
}

function currentConversations(
  store: PrototypeStore,
  customerId: string,
): Conversation[] {
  return store.conversations
    .filter((conversation) => conversation.customerId === customerId)
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}
