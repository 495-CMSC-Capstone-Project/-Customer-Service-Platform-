import type {
  ResolutionType,
  SendMessageResult,
} from "../types/support";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const REQUEST_TIMEOUT_MS = 20_000;
const INVALID_RESPONSE_MESSAGE =
  "The support API returned an invalid response. Please try again.";

class SupportApiError extends Error {}

interface SendMessageRequest {
  customerId: string;
  message: string;
}

interface SubmitFeedbackRequest {
  resolutionType: ResolutionType;
  successful: boolean;
  category: string;
}

interface FeedbackApiResponse {
  feedbackId: string;
  status: "RECORDED";
}

interface ChatApiResponse {
  conversationId: string;
  messageId: string;
  response: string;
  source: "AI" | "HUMAN";
  confidence: number;
  escalated: boolean;
}

export async function sendCustomerMessage(
  conversationId: string,
  payload: SendMessageRequest,
): Promise<SendMessageResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          customerId: payload.customerId,
          message: payload.message,
        }),
      },
    );

    if (!response.ok) {
      throw new SupportApiError(messageForStatus(response.status));
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new SupportApiError(INVALID_RESPONSE_MESSAGE);
    }

    if (!isChatApiResponse(data) || data.conversationId !== conversationId) {
      throw new SupportApiError(INVALID_RESPONSE_MESSAGE);
    }
    return data;
  } catch (error) {
    if (error instanceof SupportApiError) throw error;
    if (isAbortError(error)) {
      throw new Error(
        "The support API took too long to respond. The request may have reached the server; retry only if needed.",
      );
    }
    throw new Error(
      "Unable to reach the support API. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function submitConversationFeedback(
  conversationId: string,
  payload: SubmitFeedbackRequest,
): Promise<FeedbackApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new SupportApiError(feedbackMessageForStatus(response.status));
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new SupportApiError(INVALID_RESPONSE_MESSAGE);
    }

    if (!isFeedbackApiResponse(data)) {
      throw new SupportApiError(INVALID_RESPONSE_MESSAGE);
    }

    return data;
  } catch (error) {
    if (error instanceof SupportApiError) throw error;

    if (isAbortError(error)) {
      throw new Error(
        "The support API took too long to respond. The feedback may have reached the server; retry only if needed.",
      );
    }

    throw new Error(
      "Unable to reach the support API. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The message could not be processed.";
    case 401:
      return "Your session is not authorized. Sign in again before retrying.";
    case 403:
      return "You do not have access to this conversation.";
    case 404:
      return "Conversation not found. Use customer ID cust_001 and conversation conv_001 for live AI support.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 503:
      return "The service is temporarily unavailable. Please try again later.";
    default:
      return "An unexpected service error occurred.";
  }
}

function isChatApiResponse(value: unknown): value is ChatApiResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.conversationId === "string" &&
    response.conversationId.length > 0 &&
    typeof response.messageId === "string" &&
    response.messageId.length > 0 &&
    typeof response.response === "string" &&
    response.response.trim().length > 0 &&
    (response.source === "AI" || response.source === "HUMAN") &&
    typeof response.confidence === "number" &&
    Number.isFinite(response.confidence) &&
    response.confidence >= 0 &&
    response.confidence <= 1 &&
    typeof response.escalated === "boolean"
  );
}

function feedbackMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The feedback could not be recorded. Check the information and try again.";
    case 404:
      return "Conversation not found.";
    case 409:
      return "Feedback has already been recorded for this conversation.";
    case 503:
      return "The service is temporarily unavailable. Please try again later.";
    default:
      return "An unexpected service error occurred while recording feedback.";
  }
}

function isFeedbackApiResponse(
  value: unknown,
): value is FeedbackApiResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    typeof response.feedbackId === "string" &&
    response.feedbackId.length > 0 &&
    response.status === "RECORDED"
  );
}
