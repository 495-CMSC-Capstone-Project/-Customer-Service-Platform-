import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  sendCustomerMessage,
  submitConversationFeedback,
} from "../api/conversations";
import { createSeed, LIVE_CONVERSATION_ID } from "../data/seed";
import {
  ConversationStatus,
  SenderType,
  type Conversation,
  type Feedback,
  type PrototypeStore,
  type ResolutionType,
} from "../types/support";
import { createId } from "../utils/ids";
import { useAuth } from "./auth";
import { SupportContext, type ConversationDraft } from "./support";

const STORE_KEY = "csp-support-store-v2";

const EMPTY_DRAFT: ConversationDraft = { message: "", error: null, storageWarning: false, revision: 0 };

function loadDrafts() {
  const entries: Record<string, ConversationDraft> = {};
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith("csp-draft:")) {
        entries[key] = { ...EMPTY_DRAFT, message: sessionStorage.getItem(key) ?? "" };
      }
    }
    return { entries, readWarning: false };
  } catch {
    return { entries, readWarning: true };
  }
}

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

export function SupportProvider({ children }: { children: ReactNode }) {
  const { customerId } = useAuth();
  const [store, setStore] = useState<PrototypeStore>(loadStore);
  const [sendingConversationId, setSendingConversationId] = useState<
    string | null
  >(null);
  const storeRef = useRef(store);
  const pendingRequest = useRef(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  // Keep drafts beside the request state so route changes do not reset them.
  const [draftState, setDraftState] = useState(loadDrafts);
  const drafts = draftState.entries;
  const draftsRef = useRef(drafts);

  const saveDraft = useCallback((key: string, draft: ConversationDraft, persist = false) => {
    let nextDraft = draft;
    if (persist) {
      try {
        if (draft.message) sessionStorage.setItem(key, draft.message);
        else sessionStorage.removeItem(key);
        nextDraft = { ...draft, storageWarning: false };
      } catch {
        nextDraft = { ...draft, storageWarning: true };
      }
    }
    const next = { ...draftsRef.current, [key]: nextDraft };
    draftsRef.current = next;
    setDraftState((current) => ({ ...current, entries: next }));
  }, []);

  const getDraft = useCallback((conversationId: string) => {
    const key = `csp-draft:${customerId}:${conversationId}`;
    return drafts[key] ?? { ...EMPTY_DRAFT, storageWarning: draftState.readWarning };
  }, [customerId, drafts, draftState.readWarning]);

  const setDraftMessage = useCallback((conversationId: string, message: string) => {
    const key = `csp-draft:${customerId}:${conversationId}`;
    const current = draftsRef.current[key] ?? EMPTY_DRAFT;
    saveDraft(key, { ...current, message, error: null, revision: current.revision + 1 }, true);
  }, [customerId, saveDraft]);

  const persistStore = useCallback((next: PrototypeStore) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      setStorageWarning(null);
    } catch {
      setStorageWarning("Browser storage is unavailable. Changes are available on this page but may be lost when you reload.");
    }
  }, []);

  const updateStore = useCallback((update: (current: PrototypeStore) => PrototypeStore) => {
    const next = update(storeRef.current);
    storeRef.current = next;
    setStore(next);
    persistStore(next);
  }, [persistStore]);

  useEffect(() => {
    if (customerId && !storeRef.current.customers.some((item) => item.customerId === customerId)) {
      updateStore((current) => ({
        ...current,
        customers: [...current.customers, { customerId, name: "Customer", accountStatus: "ACTIVE" }],
      }));
    }
  }, [customerId, updateStore]);

  useEffect(() => {
    persistStore(storeRef.current);
  }, [persistStore]);

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

    updateStore((current) => ({
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
  }, [updateStore]);

  const createConversation = useCallback(() => {
    if (!customerId) {
      throw new Error("You need to sign in first.");
    }

    const liveConversation = storeRef.current.conversations.find(
      (item) =>
        item.conversationId === LIVE_CONVERSATION_ID &&
        item.customerId === customerId,
    );
    if (liveConversation) {
      return liveConversation.conversationId;
    }

    throw new Error(
      "Live AI support uses customer ID cust_001 and conversation conv_001. Sign in with cust_001 to send messages through the backend.",
    );
  }, [customerId]);

  const sendMessage = useCallback(
    async (conversationId: string, message: string) => {
      if (!customerId) throw new Error("You need to sign in first.");
      const trimmed = message.trim();
      if (!trimmed || trimmed.length > 2000) throw new Error("Message must contain 1–2,000 characters.");
      const conversation = storeRef.current.conversations.find((item) => item.conversationId === conversationId);
      if (!conversation) throw new Error("Conversation cannot be found.");
      if (conversation.customerId !== customerId) throw new Error("You do not have access to this conversation.");
      if (conversationId !== LIVE_CONVERSATION_ID) throw new Error("This is a read-only sample conversation. Open the live demo to send a message.");
      if (pendingRequest.current) throw new Error("Please wait for the current reply before sending another message.");

      // Lock immediately: React state alone cannot prevent two sends in one event turn.
      pendingRequest.current = true;
      setSendingConversationId(conversationId);
      const draftKey = `csp-draft:${customerId}:${conversationId}`;
      const submittedDraft = draftsRef.current[draftKey] ?? EMPTY_DRAFT;
      saveDraft(draftKey, { ...submittedDraft, error: null });
      const sentAt = new Date().toISOString();
      try {
        const result = await sendCustomerMessage(conversationId, { customerId, message: trimmed });
        const replyAt = new Date().toISOString();
        updateStore((current) => ({
          ...current,
          messages: [
            ...current.messages,
            { messageId: createId("msg"), conversationId, senderType: SenderType.CUSTOMER, messageText: trimmed, createdAt: sentAt },
            {
              messageId: result.messageId,
              conversationId,
              senderType: result.source === "HUMAN" ? SenderType.HUMAN : SenderType.AI,
              messageText: result.response,
              source: result.source,
              confidence: result.confidence,
              createdAt: replyAt,
            },
          ],
          conversations: current.conversations.map((item) => item.conversationId === conversationId
            ? { ...item, status: result.escalated ? ConversationStatus.ESCALATED : ConversationStatus.ACTIVE, updatedAt: replyAt }
            : item),
        }));
        const currentDraft = draftsRef.current[draftKey];
        // A late response belongs to the submitted revision, not a newer draft.
        if (currentDraft.revision === submittedDraft.revision && currentDraft.message.trim() === trimmed) {
          saveDraft(draftKey, { ...currentDraft, message: "", error: null, revision: currentDraft.revision + 1 }, true);
        }
        // The API flags escalation but does not confirm a ticket or queue assignment.
        return result;
      } catch (cause) {
        const currentDraft = draftsRef.current[draftKey];
        if (currentDraft.revision === submittedDraft.revision) {
          saveDraft(draftKey, { ...currentDraft, error: cause instanceof Error ? cause.message : "Unable to send the message." });
        }
        throw cause;
      } finally {
        pendingRequest.current = false;
        setSendingConversationId(null);
      }
    },
    [customerId, updateStore, saveDraft],
  );

const submitFeedback = useCallback(
  async (
    conversationId: string,
    payload: {
      resolutionType: ResolutionType;
      successful: boolean;
      category: string;
    },
  ): Promise<Feedback> => {
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

    if (pendingRequest.current) {
      throw new Error("Wait for the current reply before leaving feedback.");
    }

    const existingFeedback = storeRef.current.feedback.find(
      (item) => item.conversationId === conversationId,
    );
    
    if (
      existingFeedback &&
      (conversationId !== LIVE_CONVERSATION_ID ||
        existingFeedback.backendConfirmed === true)
    ) {
      throw new Error(
        "Feedback has already been recorded for this conversation.",
      );
    }

    if (!payload.category.trim()) {
      throw new Error("Choose a support category.");
    }

    const now = new Date().toISOString();
    let feedbackId: string;

    if (conversationId === LIVE_CONVERSATION_ID) {
      const result = await submitConversationFeedback(
        conversationId,
        payload,
      );

      feedbackId = result.feedbackId;
    } else {
      feedbackId = createId("fb");
    }

    const feedback: Feedback = {
      feedbackId,
      conversationId,
      resolutionType: payload.resolutionType,
      successful: payload.successful,
      category: payload.category,
      createdAt: now,
      backendConfirmed: conversationId === LIVE_CONVERSATION_ID,
    };

    updateStore((current) => ({
      ...current,
      feedback: [
        ...current.feedback.filter(
          (item) => item.conversationId !== conversationId,
        ),
        feedback,
        ],
      conversations: current.conversations.map((item) =>
        item.conversationId === conversationId
          ? {
              ...item,
              status:
                payload.successful &&
                conversationId !== LIVE_CONVERSATION_ID
                  ? ConversationStatus.RESOLVED
                  : item.status,
              updatedAt: now,
            }
          : item,
      ),
    }));

    return feedback;
  },
  [customerId, updateStore],
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
      // Legacy demo ticket IDs are not server confirmations.
      if (conversationId === LIVE_CONVERSATION_ID) return undefined;
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
      return store.feedback.find(
        (item) =>
          item.conversationId === conversationId &&
          (conversationId !== LIVE_CONVERSATION_ID ||
            item.backendConfirmed === true),
      );
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
      storageWarning,
      sendingConversationId,
      customerConversations,
      registerCustomer,
      createConversation,
      getDraft,
      setDraftMessage,
      sendMessage,
      submitFeedback,
      getMessages,
      getTicket,
      getFeedback,
      getPreview,
    }),
    [
      store,
      storageWarning,
      sendingConversationId,
      customerConversations,
      registerCustomer,
      createConversation,
      getDraft,
      setDraftMessage,
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
