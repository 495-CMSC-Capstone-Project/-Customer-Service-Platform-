import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SupportProvider } from "./context/SupportContext";
import { createSeed } from "./data/seed";
import { useSupport } from "./context/support";
import type { ReactNode } from "react";

const storeKey = "csp-support-store-v2";
const draftKey = "csp-draft:cust_001:conv_001";

function reply(overrides = {}) {
  return Response.json({
    conversationId: "conv_001", messageId: "reply_1", response: "Check your account settings.",
    source: "AI", confidence: 0.8, escalated: false, ...overrides,
  });
}

function openApp(route = "/conversations/conv_001", customer: string | null = "cust_001", controls?: ReactNode) {
  if (customer) localStorage.setItem("csp-prototype-customer-id", customer);
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider><SupportProvider><App />{controls}</SupportProvider></AuthProvider>
    </MemoryRouter>,
  );
  return { ...view, user: userEvent.setup() };
}

function DraftRevisionControl() {
  const { getDraft, setDraftMessage } = useSupport();
  return <button onClick={() => {
    const original = getDraft("conv_001").message;
    setDraftMessage("conv_001", "Replacement draft");
    setDraftMessage("conv_001", original);
  }}>Create a newer draft revision</button>;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("customer support workflows", () => {
  it("returns to a protected conversation after sign-in and keeps keyboard focus in the dialog", async () => {
    const { user } = openApp("/conversations/conv_001", null);
    const dialog = await screen.findByRole("dialog");
    const controls = within(dialog);
    const close = controls.getByRole("button", { name: "Close sign in" });
    const last = controls.getByRole("button", { name: "Sign up" });
    last.focus();
    expect(document.activeElement).toBe(last);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    await user.type(controls.getByRole("textbox", { name: "Customer ID" }), "cust_001");
    await user.click(controls.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "conv_001" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("preserves a failed draft, leaves history unchanged, and sends only one pair of messages on retry", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(reply());
    vi.stubGlobal("fetch", fetchMock);
    const { user } = openApp();
    const before = JSON.parse(localStorage.getItem(storeKey)!).conversations[0].updatedAt;
    const field = screen.getByRole("textbox", { name: "Describe the issue" });
    await user.type(field, "Cannot log in");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to reach");
    expect((field as HTMLTextAreaElement).value).toBe("Cannot log in");
    expect(sessionStorage.getItem(draftKey)).toBe("Cannot log in");
    expect(JSON.parse(localStorage.getItem(storeKey)!).conversations[0].updatedAt).toBe(before);
    expect(screen.queryByRole("article", { name: "You message" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Retry send" }));
    expect(await screen.findByText("Check your account settings.")).toBeTruthy();
    expect(screen.getAllByRole("article", { name: "You message" })).toHaveLength(1);
    expect((field as HTMLTextAreaElement).value).toBe("");
    expect(sessionStorage.getItem(draftKey)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/v1/conversations/conv_001/messages");
    expect(JSON.parse(options.body)).toEqual({ customerId: "cust_001", message: "Cannot log in" });
  });

  it("restores a draft after navigating away and after remounting, without leaking it to another profile", async () => {
    const { user, unmount } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Unsaved account question");
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("Unsaved account question");
    unmount();
    const restored = openApp();
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("Unsaved account question");
    restored.unmount();
    openApp("/conversations/conv_001", "another_customer");
    expect(screen.getByRole("heading", { name: "You do not have access" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Describe the issue" })).toBeNull();
  });

  it.each(["before", "after"])("clears the sent draft when returning %s a pending reply arrives", async (returnTime) => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const { user } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "  Help while navigating  ");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    if (returnTime === "before") {
      await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
      const pendingField = screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement;
      expect(pendingField.disabled).toBe(true);
      fireEvent.submit(pendingField.closest("form")!);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
    await act(async () => { finish(reply()); });
    if (returnTime === "after") {
      await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    }
    expect(await screen.findByText("Check your account settings.")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("");
    expect(sessionStorage.getItem(draftKey)).toBeNull();
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByRole("article", { name: "You message" })).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["before", "after"])("retains a pending draft when returning %s failure, then clears it only after a successful retry", async (returnTime) => {
    let fail!: (error: Error) => void;
    const fetchMock = vi.fn()
      .mockReturnValueOnce(new Promise<Response>((_resolve, reject) => { fail = reject; }))
      .mockResolvedValueOnce(reply());
    vi.stubGlobal("fetch", fetchMock);
    const { user } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Keep this failed draft");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    if (returnTime === "before") await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    await act(async () => { fail(new TypeError("offline")); });
    if (returnTime === "after") await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to reach");
    const field = screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement;
    expect(field.value).toBe("Keep this failed draft");
    expect(sessionStorage.getItem(draftKey)).toBe("Keep this failed draft");
    expect(screen.queryByRole("article", { name: "You message" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Retry send" }));
    expect(await screen.findByText("Check your account settings.")).toBeTruthy();
    expect(field.value).toBe("");
    expect(sessionStorage.getItem(draftKey)).toBeNull();
    expect(screen.getAllByRole("article", { name: "You message" })).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["success", "failure"])("does not overwrite a newer draft revision after a late %s", async (outcome) => {
    let finish!: (response: Response) => void;
    let fail!: (error: Error) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve, reject) => {
      finish = resolve;
      fail = reject;
    })));
    const { user } = openApp(undefined, undefined, <DraftRevisionControl />);
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Same text, newer revision");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    // Exercise the provider contract directly; the production textarea stays disabled during sending.
    await user.click(screen.getByRole("button", { name: "Create a newer draft revision" }));
    await act(async () => {
      if (outcome === "success") finish(reply());
      else fail(new TypeError("offline"));
    });
    await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("Same text, newer revision");
    expect(sessionStorage.getItem(draftKey)).toBe("Same text, newer revision");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears only the submitted customer's conversation draft while another conversation is open", async () => {
    const sampleKey = "csp-draft:cust_001:conv_old_01";
    const otherCustomerKey = "csp-draft:another_customer:conv_001";
    sessionStorage.setItem(sampleKey, "Another conversation's draft");
    sessionStorage.setItem(otherCustomerKey, "Another customer's draft");
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; })));
    const { user } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Only clear the live draft");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    await user.click(screen.getByRole("link", { name: /^Open conv_old_01/ }));
    await act(async () => { finish(reply()); });
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("Another conversation's draft");
    expect(sessionStorage.getItem(sampleKey)).toBe("Another conversation's draft");
    expect(sessionStorage.getItem(otherCustomerKey)).toBe("Another customer's draft");
    expect(sessionStorage.getItem(draftKey)).toBeNull();
  });

  it("keeps in-memory drafts across navigation and clears them on success when session storage is blocked", async () => {
    const { user } = openApp();
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === sessionStorage) throw new DOMException("Storage denied", "SecurityError");
      setItem.call(this, key, value);
    });
    const removeItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === sessionStorage) throw new DOMException("Storage denied", "SecurityError");
      removeItem.call(this, key);
    });
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; })));
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "In-memory draft");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("In-memory draft");
    expect(screen.getByText(/Draft changes are kept in this tab only/)).toBeTruthy();
    await act(async () => { finish(reply()); });
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("");
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByText(/Reloading may lose changes or restore an older draft/)).toBeTruthy();
  });

  it("does not lose a restored draft if storage reads stop working before a failed send", async () => {
    sessionStorage.setItem(draftKey, "Restored before storage was blocked");
    const { user } = openApp();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Storage denied", "SecurityError"); });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to reach");
    await user.click(screen.getAllByRole("link", { name: "Conversations" })[0]);
    await user.click(screen.getByRole("button", { name: "Open live AI chat" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).value).toBe("Restored before storage was blocked");
    expect((screen.getByRole("button", { name: "Retry send" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows a human-review recommendation without inventing a ticket and allows the next AI message", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(reply({ escalated: true, response: "Please seek human help." }))
      .mockResolvedValueOnce(reply({ messageId: "reply_2" })));
    const { user } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "I need a human");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("This issue may need a person")).toBeTruthy();
    expect(screen.getByText(/does not connect to an agent or confirm a support ticket/)).toBeTruthy();
    const current = JSON.parse(localStorage.getItem(storeKey)!);
    expect(current.tickets.filter((item: { conversationId: string }) => item.conversationId === "conv_001")).toEqual([]);
    const field = screen.getByRole("textbox", { name: "Describe the issue" });
    expect((field as HTMLTextAreaElement).disabled).toBe(false);
    await user.type(field, "Can you still help with settings?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Check your account settings.")).toBeTruthy();
    expect(screen.queryByText("This issue may need a person")).toBeNull();
  });

  it("requires an explicit feedback outcome and keeps unsuccessful live conversations usable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
        feedbackId: "fb_live_001",
        status: "RECORDED",
      }),
    ),
  );
    const { user } = openApp("/conversations/conv_001/feedback");
    const outcome = screen.getByRole("combobox", { name: "Was the issue handled successfully?" });
    expect((outcome as HTMLSelectElement).value).toBe("");
    fireEvent.submit(outcome.closest("form")!);
    expect(screen.getByRole("alert").textContent).toContain("Choose whether");
    await user.selectOptions(outcome, "false");
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));
    expect(
      await screen.findByText("Feedback recorded successfully."),
    ).toBeTruthy();
    expect(screen.getByText(/Successful: No/)).toBeTruthy();
    expect(screen.getByText(/fb_live_001/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(storeKey)!).conversations[0].status).toBe("ACTIVE");
    await user.click(screen.getByRole("link", { name: "Back to conversation" }));
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).disabled).toBe(false);
  });

  it("allows backend submission when only legacy local feedback exists", async () => {
    const seed = createSeed();

    seed.feedback.push({
      feedbackId: "legacy_local_feedback",
      conversationId: "conv_001",
      resolutionType: "AI_RESOLVED",
      successful: true,
      category: "GENERAL",
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(storeKey, JSON.stringify(seed));
  
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          feedbackId: "fb_backend_001",
          status: "RECORDED",
        }),
      ),
    );

    const { user } = openApp("/conversations/conv_001/feedback");
  
    expect(
      screen.getByRole("button", { name: "Submit feedback" }),
    ).toBeTruthy();
  
    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "Was the issue handled successfully?",
      }),
      "true",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Submit feedback",
      }),
    );
  
    expect(
      await screen.findByText("Feedback recorded successfully."),
    ).toBeTruthy();
  
    expect(screen.getByText(/fb_backend_001/)).toBeTruthy();
  
    const stored = JSON.parse(localStorage.getItem(storeKey)!);
  
    const liveFeedback = stored.feedback.filter(
      (item: { conversationId: string }) =>
        item.conversationId === "conv_001",
    );

    expect(liveFeedback).toHaveLength(1);
    expect(liveFeedback[0].feedbackId).toBe("fb_backend_001");
    expect(liveFeedback[0].backendConfirmed).toBe(true);
  });

  it("prevents a second feedback submission after navigating away and back", async () => {
    let finish!: (response: Response) => void;
  
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
  
    vi.stubGlobal("fetch", fetchMock);
  
    const { user } = openApp("/conversations/conv_001/feedback");
  
    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "Was the issue handled successfully?",
      }),
      "true",
    );
  
    await user.click(
      screen.getByRole("button", {
        name: "Submit feedback",
      }),
    );
  
    expect(fetchMock).toHaveBeenCalledTimes(1);
  
    await user.click(
      screen.getByRole("link", {
        name: "Back to conversation",
      }),
    );
  
    await user.click(
      screen.getByRole("link", {
        name: "Leave feedback",
      }),
    );
  
    expect(
      screen.getByText("Feedback submission is in progress."),
    ).toBeTruthy();
  
    expect(
      screen.queryByRole("button", {
        name: "Submit feedback",
      }),
    ).toBeNull();
  
    expect(fetchMock).toHaveBeenCalledTimes(1);
  
    await act(async () => {
      finish(
        Response.json({
          feedbackId: "fb_navigation_001",
          status: "RECORDED",
        }),
      );
    });
  
    expect(
      await screen.findByText(/fb_navigation_001/),
    ).toBeTruthy();
  });
  
  it("does not infer human resolution from an open sample ticket", () => {
    openApp("/conversations/conv_esc_01/feedback");
    expect((screen.getByRole("combobox", { name: "Which support did you use?" }) as HTMLSelectElement).value).toBe("AI_RESOLVED");
    expect((screen.getByRole("combobox", { name: "Was the issue handled successfully?" }) as HTMLSelectElement).value).toBe("");
  });

  it("combines search and status filters, resets them, sorts, and opens a read-only sample", async () => {
    const { user } = openApp("/conversations");
    await user.type(screen.getByRole("searchbox", { name: "Search conversations" }), "ticket_9821");
    expect(screen.getByText("1 conversation")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Active, 1 conversation" }));
    expect(screen.getByRole("heading", { name: "No matching conversations" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("5 conversations")).toBeTruthy();
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "OLDEST");
    const cards = screen.getAllByRole("link", { name: /^Open conv_/ });
    expect(cards[0].getAttribute("href")).toBe("/conversations/conv_old_01");
    await user.click(cards[0]);
    expect(screen.getByText(/Sample conversation. These messages/)).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).disabled).toBe(true);
  });

  it("explains a new profile's limits and offers an explicit demo sign-in", async () => {
    const { user } = openApp("/conversations", "new_profile");
    expect(screen.getByRole("heading", { name: "No conversations for this profile" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open live AI chat" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Use demo profile" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(localStorage.getItem("csp-prototype-customer-id")).toBe("new_profile");
  });

  it("creates a local profile without claiming it has a live backend conversation", async () => {
    const { user } = openApp("/signup", null);
    const dialog = within(await screen.findByRole("dialog"));
    await user.type(dialog.getByRole("textbox", { name: "Full name" }), "Test Customer");
    const customer = dialog.getByRole("textbox", { name: "Customer ID" });
    await user.clear(customer);
    await user.type(customer, "new_customer");
    await user.click(dialog.getByRole("button", { name: "Create local profile" }));
    expect(await screen.findByRole("heading", { name: "No conversations for this profile" })).toBeTruthy();
    expect(localStorage.getItem("csp-prototype-customer-id")).toBe("new_customer");
    const stored = JSON.parse(localStorage.getItem(storeKey)!);
    expect(stored.customers.filter((item: { customerId: string }) => item.customerId === "new_customer")).toHaveLength(1);
    expect(stored.conversations.some((item: { customerId: string }) => item.customerId === "new_customer")).toBe(false);
  });

  it("signs in and out for the current page with an honest warning if session storage fails", async () => {
    const { user } = openApp("/login", null);
    const dialog = within(await screen.findByRole("dialog"));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Storage denied", "SecurityError"); });
    await user.type(dialog.getByRole("textbox", { name: "Customer ID" }), "cust_001");
    await user.click(dialog.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Your demo sign-in is active on this page only/)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Storage denied", "SecurityError"); });
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText(/Signed out on this page/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("still confirms live feedback when browser persistence fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          feedbackId: "fb_live_002",
          status: "RECORDED",
        }),
      ),
    );

  const { user } = openApp("/conversations/conv_001/feedback");

  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  });

  await user.selectOptions(
    screen.getByRole("combobox", {
      name: "Was the issue handled successfully?",
    }),
    "true",
  );

  await user.click(
    screen.getByRole("button", {
      name: "Submit feedback",
    }),
  );

  expect(
    await screen.findByText("Feedback recorded successfully."),
  ).toBeTruthy();

  expect(screen.getByText(/fb_live_002/)).toBeTruthy();

  expect(
    screen.queryByText("Feedback saved in this browser."),
  ).toBeNull();
});

  it("prevents double sends and feedback while a request is pending", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const { user } = openApp();
    const field = screen.getByRole("textbox", { name: "Describe the issue" });
    await user.type(field, "Need help");
    const form = field.closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: "Leave feedback" })).toBeNull();
    expect((field as HTMLTextAreaElement).disabled).toBe(true);
    finish(reply());
    await screen.findByText("Check your account settings.");
    expect(screen.getByRole("link", { name: "Leave feedback" })).toBeTruthy();
  });

  it("keeps working and explains when browser history cannot be saved", async () => {
    const { user } = openApp();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply()));
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Help with settings");
    expect(screen.getByText(/Draft changes are kept in this tab only/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Check your account settings.")).toBeTruthy();
    expect(await screen.findByText(/Browser storage is unavailable/)).toBeTruthy();
  });

  it("does not present old locally generated tickets as confirmed handoffs", () => {
    const seed = createSeed();
    seed.conversations[0].status = "ESCALATED";
    seed.tickets.push({ ...seed.tickets[0], conversationId: "conv_001", ticketId: "old_fake_ticket" });
    seed.messages.push({ messageId: "legacy", conversationId: "conv_001", senderType: "SYSTEM", messageText: "Ticket old_fake_ticket is OPEN.", createdAt: new Date().toISOString() });
    localStorage.setItem(storeKey, JSON.stringify(seed));
    openApp();
    expect(screen.queryByText(/old_fake_ticket/)).toBeNull();
    expect(screen.getByText("This issue may need a person")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Describe the issue" }) as HTMLTextAreaElement).disabled).toBe(false);
  });

  it("uses the response source when labelling a reply", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply({ source: "HUMAN" })));
    const { user } = openApp();
    await user.type(screen.getByRole("textbox", { name: "Describe the issue" }), "Help");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("article", { name: "Human agent message" })).toBeTruthy());
  });
});
