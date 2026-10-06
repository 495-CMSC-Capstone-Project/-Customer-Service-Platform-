const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const REQUEST_TIMEOUT_MS = 35_000;

export interface EscalationQueueItem {
  ticketId: string;
  conversationId: string;
  customerId: string;
  reason: string;
  summary: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedQueue: string;
  createdAt: string;
  updatedAt: string;
}

interface EscalationQueueResponse {
  escalations: EscalationQueueItem[];
  count: number;
}

interface ClaimEscalationResponse {
  ticketId: string;
  status: string;
  assignedQueue: string;
}

class EscalationApiError extends Error {}

export async function fetchEscalationQueue(): Promise<EscalationQueueResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/escalations`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new EscalationApiError(
        "Unable to load the agent review queue. Please try again.",
      );
    }

    const data: unknown = await response.json();
    if (!isEscalationQueueResponse(data)) {
      throw new EscalationApiError(
        "The escalation queue API returned an invalid response.",
      );
    }

    return data;
  } catch (error) {
    if (error instanceof EscalationApiError) throw error;
    if (isAbortError(error)) {
      throw new Error("The escalation queue request timed out. Please retry.");
    }
    throw new Error(
      "Unable to reach the support API. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function claimEscalationTicket(
  ticketId: string,
): Promise<ClaimEscalationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/escalations/${encodeURIComponent(ticketId)}/claim`,
      {
        method: "POST",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new EscalationApiError("Escalation ticket not found.");
      }
      if (response.status === 400) {
        throw new EscalationApiError(
          "Only open escalation tickets can be claimed for review.",
        );
      }
      throw new EscalationApiError(
        "Unable to claim this escalation ticket. Please try again.",
      );
    }

    const data: unknown = await response.json();
    if (!isClaimEscalationResponse(data)) {
      throw new EscalationApiError(
        "The claim escalation API returned an invalid response.",
      );
    }

    return data;
  } catch (error) {
    if (error instanceof EscalationApiError) throw error;
    if (isAbortError(error)) {
      throw new Error("The claim request timed out. Please retry.");
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

function isEscalationQueueResponse(
  value: unknown,
): value is EscalationQueueResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  if (!Array.isArray(response.escalations) || typeof response.count !== "number") {
    return false;
  }

  return response.escalations.every(isEscalationQueueItem);
}

function isEscalationQueueItem(value: unknown): value is EscalationQueueItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.ticketId === "string" &&
    typeof item.conversationId === "string" &&
    typeof item.customerId === "string" &&
    typeof item.reason === "string" &&
    typeof item.summary === "string" &&
    typeof item.status === "string" &&
    typeof item.assignedQueue === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function isClaimEscalationResponse(
  value: unknown,
): value is ClaimEscalationResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.ticketId === "string" &&
    typeof response.status === "string" &&
    typeof response.assignedQueue === "string"
  );
}
