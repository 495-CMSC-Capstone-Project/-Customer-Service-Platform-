import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type AuthModalMode = "signin" | "signup";

interface AuthModalContextValue {
  isOpen: boolean;
  mode: AuthModalMode;
  openSignIn: () => void;
  openSignUp: () => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

function readAuthModalState(
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

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("signin");

  const openSignIn = useCallback(() => {
    setMode("signin");
    setIsOpen(true);
  }, []);

  const openSignUp = useCallback(() => {
    setMode("signup");
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const requested = readAuthModalState(location.state);
    if (!requested) {
      return;
    }

    setMode(requested.mode);
    setIsOpen(true);
    navigate(location.pathname + location.hash, {
      replace: true,
      state: requested.from ? { from: requested.from } : null,
    });
  }, [location.hash, location.pathname, location.state, navigate]);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      openSignIn,
      openSignUp,
      closeAuthModal,
    }),
    [isOpen, mode, openSignIn, openSignUp, closeAuthModal],
  );

  return (
    <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
