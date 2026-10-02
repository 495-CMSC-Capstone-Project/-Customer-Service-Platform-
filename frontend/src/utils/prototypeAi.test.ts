import { describe, expect, it } from "vitest";
import {
  assignQueue,
  generatePrototypeReply,
  summarizeMessage,
} from "./prototypeAi";

describe("generatePrototypeReply", () => {
  it("escalates an explicit request for a human agent", () => {
    const result = generatePrototypeReply("Please connect me with a human.");
    expect(result.escalationRequired).toBe(true);
    expect(result.category).toBe("escalation");
  });

  it("classifies password, billing, account, and general questions", () => {
    expect(generatePrototypeReply("Reset my password").category).toBe(
      "ACCOUNT_ACCESS",
    );
    expect(generatePrototypeReply("Explain this invoice").category).toBe(
      "BILLING",
    );
    expect(generatePrototypeReply("Update my profile").category).toBe(
      "ACCOUNT_ACCESS",
    );
    expect(generatePrototypeReply("I have another question").category).toBe(
      "GENERAL",
    );
  });
});

describe("support ticket helpers", () => {
  it("routes known billing and account issues to the matching queue", () => {
    expect(assignQueue("Unexpected charge", "BILLING")).toBe(
      "Billing Support",
    );
    expect(assignQueue("Cannot login", "ACCOUNT_ACCESS")).toBe(
      "Account Support",
    );
    expect(assignQueue("Other question", "GENERAL")).toBe(
      "General Support",
    );
  });

  it("normalizes short summaries and truncates long ones", () => {
    expect(summarizeMessage("  Need   account help  ")).toBe(
      "Need account help",
    );
    const summary = summarizeMessage("a".repeat(220));
    expect(summary).toHaveLength(180);
    expect(summary.endsWith("...")).toBe(true);
  });
});
