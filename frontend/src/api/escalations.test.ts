import { afterEach, describe, expect, it, vi } from "vitest";
import { claimEscalationTicket, fetchEscalationQueue } from "./escalations";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("escalation queue API", () => {
  it("loads active escalation tickets", async () => {
    const payload = {
      count: 1,
      escalations: [
        {
          ticketId: "ticket_001",
          conversationId: "conv_001",
          customerId: "cust_001",
          reason: "CUSTOMER_REQUEST",
          summary: "Need a human",
          status: "OPEN",
          assignedQueue: "General Support",
          createdAt: "2026-10-06T12:00:00+00:00",
          updatedAt: "2026-10-06T12:00:00+00:00",
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await fetchEscalationQueue();
    expect(result.count).toBe(1);
    expect(result.escalations[0]?.ticketId).toBe("ticket_001");
  });

  it("claims an open escalation ticket", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ticketId: "ticket_001",
            status: "IN_PROGRESS",
            assignedQueue: "General Support",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const result = await claimEscalationTicket("ticket_001");
    expect(result.status).toBe("IN_PROGRESS");
  });
});
