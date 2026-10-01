import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthModalProvider } from "./AuthModalContext";
import { useAuthModal } from "./authModal";

afterEach(() => {
  cleanup();
});

function ModalStateProbe() {
  const { isOpen, mode, openSignIn, openSignUp, closeAuthModal } =
    useAuthModal();

  return (
    <div>
      <output aria-label="modal state">{isOpen ? `${mode}:open` : "closed"}</output>
      <button type="button" onClick={openSignIn}>
        Open sign in
      </button>
      <button type="button" onClick={openSignUp}>
        Open sign up
      </button>
      <button type="button" onClick={closeAuthModal}>
        Close
      </button>
    </div>
  );
}

describe("AuthModalProvider", () => {
  it("opens from router state and clears the request when closed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/",
            state: { authModal: "signin", from: "/conversations" },
          },
        ]}
      >
        <AuthModalProvider>
          <ModalStateProbe />
        </AuthModalProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("modal state").textContent).toBe(
      "signin:open",
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.getByLabelText("modal state").textContent).toBe("closed");
    });
  });

  it("switches between manually opened modes", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthModalProvider>
          <ModalStateProbe />
        </AuthModalProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Open sign up" }));
    expect(screen.getByLabelText("modal state").textContent).toBe(
      "signup:open",
    );
    await user.click(screen.getByRole("button", { name: "Open sign in" }));
    expect(screen.getByLabelText("modal state").textContent).toBe(
      "signin:open",
    );
  });
});
