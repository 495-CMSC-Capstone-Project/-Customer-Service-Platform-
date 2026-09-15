import { useEffect, useRef } from "react";
import { useAuthModal } from "../../context/AuthModalContext";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export function AuthModal() {
  const { isOpen, mode, closeAuthModal, openSignIn, openSignUp } = useAuthModal();
  const panelRef = useRef<HTMLDivElement>(null);
  const isSignUp = mode === "signup";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("input")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [isOpen, mode, closeAuthModal]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          aria-label={isSignUp ? "Close sign up" : "Close sign in"}
          onClick={closeAuthModal}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {isSignUp ? (
          <>
            <h2 id="auth-modal-title">Sign up</h2>
            <p className="modal__lede">
              Create a customer account to start a support conversation. You can
              sign back in later with the same customer ID.
            </p>
            <SignUpForm
              idPrefix="modal-"
              redirectTo="/conversations"
              onSuccess={closeAuthModal}
              onRequestSignIn={openSignIn}
            />
          </>
        ) : (
          <>
            <h2 id="auth-modal-title">Sign in</h2>
            <p className="modal__lede">
              Use your customer ID to access support conversations. This
              prototype keeps the session in your browser.
            </p>
            <SignInForm
              idPrefix="modal-"
              redirectTo="/conversations"
              onSuccess={closeAuthModal}
              onRequestSignUp={openSignUp}
            />
          </>
        )}
      </div>
    </div>
  );
}
