import type { SendMessageResult } from "../types/support";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface SendMessageRequest {
  customerId: string;
  message: string;
}

interface ChatApiResponse {
  conversationId: string;
  messageId: string;
  response: string;
  source: string;
  confidence: number;
  escalated: boolean;
}

export async function sendCustomerMessage(
  conversationId: string,
  payload: SendMessageRequest,
): Promise<SendMessageResult> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: payload.customerId,
          message: payload.message,
        }),
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the support API. Confirm the backend is running on port 8000.",
    );
  }

  if (!response.ok) {
    throw new Error(messageForStatus(response.status));
  }

  const data = (await response.json()) as ChatApiResponse;

  return {
    conversationId: data.conversationId,
    messageId: data.messageId,
    response: data.response,
    source: data.source === "HUMAN" ? "HUMAN" : "AI",
    confidence: data.confidence,
    escalated: data.escalated,
  };
}

function messageForStatus(status: number): string {
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
