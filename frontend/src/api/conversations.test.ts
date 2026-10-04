import { afterEach, describe, expect, it, vi } from "vitest";
import { ResolutionType } from "../types/support";
import {
  messageForStatus,
  sendCustomerMessage,
  submitConversationFeedback,
} from "./conversations";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sendCustomerMessage", () => {
  it("returns a validated AI response", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      conversationId: "conv_001",
      messageId: "msg_101",
      response: "Try resetting your password.",
      source: "AI",
      confidence: 0.8,
      escalated: false,
    }),
  );

  vi.stubGlobal("fetch", fetchMock);

  await expect(
    sendCustomerMessage("conv_001", {
      customerId: "cust_001",
      requestId: "req_001",
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

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/conversations/conv_001/messages",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        customerId: "cust_001",
        requestId: "req_001",
        message: "I cannot sign in.",
      }),
    }),
  );
});

  it("shows the backend access error for a 403 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );

    await expect(
      sendCustomerMessage("conv_001", {
        customerId: "cust_002",
        requestId: "req_001",
        message: "Help",
      }),
    ).rejects.toThrow("You do not have access to this conversation.");
  });

  it("reports an in-progress duplicate request for a 409 response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 409 })),
  );

  await expect(
    sendCustomerMessage("conv_001", {
      customerId: "cust_001",
      requestId: "req_001",
      message: "Help",
    }),
  ).rejects.toThrow(
    "This message request has already been submitted.",
  );
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
        requestId: "req_001",
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
        requestId: "req_001",
        message: "Help",
      }),
    ).rejects.toThrow(
      "Unable to reach the support API. Check your connection and try again.",
    );
  });

  it.each([
    { conversationId: "someone_else", response: "Do not show this reply" },
    { conversationId: "conv_001", response: "   " },
  ])("rejects an unrelated or empty reply: %j", async (invalid) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      messageId: "reply_1", source: "AI", confidence: 0.8, escalated: false, ...invalid,
    })));
    await expect(sendCustomerMessage("conv_001", { customerId: "cust_001", requestId: "req_001", message: "Help" }))
      .rejects.toThrow("invalid response");
  });

  it("keeps the timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options: RequestInit) => Promise.resolve({
      ok: true,
      json: () => new Promise((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
    })));
    const result = expect(sendCustomerMessage("conv_001", { customerId: "cust_001", requestId: "req_001", message: "Help" }))
      .rejects.toThrow("took too long");
    await vi.advanceTimersByTimeAsync(35_000);
    await result;
  });

  it("rejects non-JSON success responses and returns a useful unauthorized message", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("not json", { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 })));
    await expect(sendCustomerMessage("conv_001", { customerId: "cust_001", requestId: "req_001", message: "Help" }))
      .rejects.toThrow("invalid response");
    await expect(sendCustomerMessage("conv_001", { customerId: "cust_001", requestId: "req_001", message: "Help" }))
      .rejects.toThrow("not authorized");
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
      requestId: "req_001",
      message: "Help",
    });
    const result = expect(request).rejects.toThrow(
      "The support API took too long to respond. The request may have reached the server; retry only if needed.",
    );

    await vi.advanceTimersByTimeAsync(35_000);
    await result;
  });
});

describe("submitConversationFeedback", () => {
  it("returns a validated feedback response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        feedbackId: "fb_101",
        status: "RECORDED",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitConversationFeedback("conv_001", {
        resolutionType: ResolutionType.AI_RESOLVED,
        successful: true,
        category: "ACCOUNT_ACCESS",
      }),
    ).resolves.toEqual({
      feedbackId: "fb_101",
      status: "RECORDED",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/conversations/conv_001/feedback",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolutionType: ResolutionType.AI_RESOLVED,
          successful: true,
          category: "ACCOUNT_ACCESS",
        }),
      }),
    );
  });

  it("reports duplicate feedback for a 409 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 409 })),
    );

    await expect(
      submitConversationFeedback("conv_001", {
        resolutionType: ResolutionType.AI_RESOLVED,
        successful: true,
        category: "GENERAL",
      }),
    ).rejects.toThrow(
      "Feedback has already been recorded for this conversation.",
    );
  });

  it("rejects a malformed feedback response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "RECORDED",
        }),
      ),
    );

    await expect(
      submitConversationFeedback("conv_001", {
        resolutionType: ResolutionType.AI_RESOLVED,
        successful: true,
        category: "GENERAL",
      }),
    ).rejects.toThrow(
      "The support API returned an invalid response. Please try again.",
    );
  });

  it("reports a feedback network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("offline")),
    );

    await expect(
      submitConversationFeedback("conv_001", {
        resolutionType: ResolutionType.AI_RESOLVED,
        successful: false,
        category: "GENERAL",
      }),
    ).rejects.toThrow(
      "Unable to reach the support API. Check your connection and try again.",
    );
  });

  it("stops waiting when feedback submission times out", async () => {
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

    const request = submitConversationFeedback("conv_001", {
      resolutionType: ResolutionType.AI_RESOLVED,
      successful: true,
      category: "GENERAL",
    });

    const result = expect(request).rejects.toThrow(
      "The support API took too long to respond. The feedback may have reached the server; retry only if needed.",
    );

    await vi.advanceTimersByTimeAsync(35_000);
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
    expect(messageForStatus(409)).toBe(
      "This message request has already been submitted.",
    );
  });
});
