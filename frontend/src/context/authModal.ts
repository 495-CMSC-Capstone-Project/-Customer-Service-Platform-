import { createContext, useContext } from "react";

export type AuthModalMode = "signin" | "signup";

export interface AuthModalContextValue {
  isOpen: boolean;
  mode: AuthModalMode;
  openSignIn: () => void;
  openSignUp: () => void;
  closeAuthModal: () => void;
}

export const AuthModalContext =
  createContext<AuthModalContextValue | null>(null);

export function readAuthModalState(
  state: unknown,
): { mode: AuthModalMode; from?: string } | null {
  if (typeof state !== "object" || state === null || !("authModal" in state)) {
    return null;
  }

  const mode = state.authModal === "signup" ? "signup" : "signin";
  const from =
    "from" in state && typeof state.from === "string" ? state.from : undefined;
  return { mode, from };
}

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
