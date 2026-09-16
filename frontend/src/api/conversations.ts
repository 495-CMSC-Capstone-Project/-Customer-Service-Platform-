import type { SendMessageResult } from "../types/support";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const REQUEST_TIMEOUT_MS = 20_000;
const INVALID_RESPONSE_MESSAGE =
  "The support API returned an invalid response. Please try again.";

interface SendMessageRequest {
  customerId: string;
  message: string;
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
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "The support API took too long to respond. Please try again.",
      );
    }
    throw new Error(
      "Unable to reach the support API. Confirm the backend is running on port 8000.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(messageForStatus(response.status));
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  if (!isChatApiResponse(data)) {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  return {
    conversationId: data.conversationId,
    messageId: data.messageId,
    response: data.response,
    source: data.source === "HUMAN" ? "HUMAN" : "AI",
    confidence: data.confidence,
    escalated: data.escalated,
  };
}

export function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The message could not be processed.";
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
    (response.source === "AI" || response.source === "HUMAN") &&
    typeof response.confidence === "number" &&
    Number.isFinite(response.confidence) &&
    response.confidence >= 0 &&
    response.confidence <= 1 &&
    typeof response.escalated === "boolean"
  );
}
