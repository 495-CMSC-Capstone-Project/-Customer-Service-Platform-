import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";

afterEach(() => {
  cleanup();
});

describe("Composer", () => {
  it("trims a valid message and reflects the parent's draft updates", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <Composer disabled={false} sending={false} message="  I need help with my account.  " onMessageChange={vi.fn()} onSend={onSend} />,
    );

    const textbox = screen.getByRole("textbox", { name: "Describe the issue" });
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("I need help with my account.");
    });
    rerender(<Composer disabled={false} sending={false} message="" onMessageChange={vi.fn()} onSend={onSend} />);
    expect((textbox as HTMLTextAreaElement).value).toBe("");
  });

  it("keeps the message and announces an API error", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error("Service unavailable."));
    render(
      <Composer disabled={false} sending={false} message="Help" onMessageChange={vi.fn()} onSend={onSend} />,
    );

    const textbox = screen.getByRole("textbox", { name: "Describe the issue" });
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Service unavailable.",
    );
    expect((textbox as HTMLTextAreaElement).value).toBe("Help");
    expect(textbox.getAttribute("aria-invalid")).toBe("true");
  });

  it("rejects a blank message submitted programmatically", () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <Composer disabled={false} sending={false} message="" onMessageChange={vi.fn()} onSend={onSend} />,
    );

    fireEvent.submit(container.querySelector("form")!);

    expect(screen.getByRole("alert").textContent).toBe(
      "Message cannot be blank.",
    );
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and reports progress while sending", () => {
    render(
      <Composer disabled={false} sending message="Help" onMessageChange={vi.fn()} onSend={vi.fn()} />,
    );

    const textbox = screen.getByRole("textbox", { name: "Describe the issue" });
    const button = screen.getByRole("button", { name: "Sending…" });
    expect((textbox as HTMLTextAreaElement).disabled).toBe(true);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("Processing");
  });

  it("associates a disabled reason with the message field", () => {
    render(
      <Composer
        disabled
        sending={false}
        disabledReason="This conversation is closed."
        message=""
        onMessageChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const textbox = screen.getByRole("textbox", { name: "Describe the issue" });
    const reason = screen.getByText("This conversation is closed.");
    expect(textbox.getAttribute("aria-describedby")).toContain(reason.id);
  });
});
