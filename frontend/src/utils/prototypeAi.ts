import {
  EscalationReason,
  type EscalationReason as EscalationReasonType,
} from "../types/support";

const ESCALATION_KEYWORDS = [
  "human",
  "representative",
  "manager",
  "supervisor",
  "complaint",
] as const;

export interface PrototypeAiResult {
  responseText: string;
  confidence: number;
  escalationRequired: boolean;
  category: string;
  reason?: EscalationReasonType;
}

export function generatePrototypeReply(message: string): PrototypeAiResult {
  const normalized = message.toLowerCase();

  if (ESCALATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return {
      responseText:
        "I understand that you would like additional assistance. I can escalate this conversation to a human agent.",
      confidence: 0.95,
      escalationRequired: true,
      category: "escalation",
      reason: EscalationReason.CUSTOMER_REQUEST,
    };
  }

  if (normalized.includes("password") || normalized.includes("reset")) {
    return {
      responseText:
        "Select Forgot Password on the sign-in page and follow the reset instructions.",
      confidence: 0.94,
      escalationRequired: false,
      category: "ACCOUNT_ACCESS",
    };
  }

  if (
    normalized.includes("bill") ||
    normalized.includes("invoice") ||
    normalized.includes("charge") ||
    normalized.includes("payment")
  ) {
    return {
      responseText:
        "You can view invoices and update a payment method from Billing in your account settings.",
      confidence: 0.88,
      escalationRequired: false,
      category: "BILLING",
    };
  }

  if (normalized.includes("account") || normalized.includes("profile")) {
    return {
      responseText:
        "You can update your account information from the profile page.",
      confidence: 0.8,
      escalationRequired: false,
      category: "ACCOUNT_ACCESS",
    };
  }

  return {
    responseText:
      "Thanks for reaching out. I can help with account, billing, and password questions. Could you share a bit more detail?",
    confidence: 0.8,
    escalationRequired: false,
    category: "GENERAL",
  };
}

export function assignQueue(message: string, category: string): string {
  const normalized = message.toLowerCase();
  if (
    category === "BILLING" ||
    normalized.includes("bill") ||
    normalized.includes("invoice") ||
    normalized.includes("payment")
  ) {
    return "Billing Support";
  }
  if (
    category === "ACCOUNT_ACCESS" ||
    normalized.includes("account") ||
    normalized.includes("password") ||
    normalized.includes("login")
  ) {
    return "Account Support";
  }
  return "General Support";
}

export function summarizeMessage(message: string): string {
  const compact = message.trim().replace(/\s+/g, " ");
  if (compact.length <= 180) {
    return compact;
  }
  return `${compact.slice(0, 177)}...`;
}
