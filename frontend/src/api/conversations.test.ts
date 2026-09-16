import { afterEach, describe, expect, it, vi } from "vitest";
import { messageForStatus, sendCustomerMessage } from "./conversations";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sendCustomerMessage", () => {
  it("returns a validated AI response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          conversationId: "conv_001",
          messageId: "msg_101",
          response: "Try resetting your password.",
          source: "AI",
          confidence: 0.8,
          escalated: false,
        }),
      ),
    );

    await expect(
      sendCustomerMessage("conv_001", {
        customerId: "cust_001",
        message: "I cannot sign in.",
      }),
    ).resolves.toEqual({
      conversationId: "conv_001",
      messageId: "msg_101",
      response: "Try resetting your password.",
      source: "AI",
      confidence: 0.8,
      escalated: false,
    });
  });

  it("shows the backend access error for a 403 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );

    await expect(
      sendCustomerMessage("conv_001", {
        customerId: "cust_002",
        message: "Help",
      }),
    ).rejects.toThrow("You do not have access to this conversation.");
  });

  it("rejects a malformed success response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          conversationId: "conv_001",
          response: "Missing required fields",
        }),
      ),
    );

    await expect(
      sendCustomerMessage("conv_001", {
        customerId: "cust_001",
        message: "Help",
      }),
    ).rejects.toThrow(
      "The support API returned an invalid response. Please try again.",
    );
  });

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(
      sendCustomerMessage("conv_001", {
        customerId: "cust_001",
        message: "Help",
      }),
    ).rejects.toThrow(
      "Unable to reach the support API. Confirm the backend is running on port 8000.",
    );
  });

  it("stops waiting when the API request times out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, options: RequestInit) => {
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => {
            reject(new DOMException("Request aborted", "AbortError"));
          });
        });
      }),
    );

    const request = sendCustomerMessage("conv_001", {
      customerId: "cust_001",
      message: "Help",
    });
    const result = expect(request).rejects.toThrow(
      "The support API took too long to respond. Please try again.",
    );

    await vi.advanceTimersByTimeAsync(20_000);
    await result;
  });
});

describe("messageForStatus", () => {
  it("maps current backend response codes to clear messages", () => {
    expect(messageForStatus(400)).toBe("The message could not be processed.");
    expect(messageForStatus(403)).toBe(
      "You do not have access to this conversation.",
    );
    expect(messageForStatus(404)).toContain("Conversation not found.");
  });
});
