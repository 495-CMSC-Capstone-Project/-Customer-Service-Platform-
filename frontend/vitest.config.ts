import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: [
        "src/api/conversations.ts",
        "src/components/chat/Composer.tsx",
        "src/components/conversations/ConversationFilters.tsx",
        "src/context/AuthModalContext.tsx",
        "src/context/AuthContext.tsx",
        "src/context/authModal.ts",
        "src/context/SupportContext.tsx",
        "src/components/auth/AuthModal.tsx",
        "src/components/feedback/FeedbackForm.tsx",
        "src/pages/ChatPage.tsx",
        "src/pages/FeedbackPage.tsx",
        "src/pages/ConversationsPage.tsx",
        "src/utils/conversationFilters.ts",
        "src/utils/prototypeAi.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 75,
        statements: 85,
      },
    },
  },
});
