import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AuthModalContext,
  readAuthModalState,
  type AuthModalMode,
} from "./authModal";

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const requested = readAuthModalState(location.state);
  const requestedMode = requested?.mode;
  const requestedFrom = requested?.from;
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMode, setManualMode] = useState<AuthModalMode>("signin");
  const isOpen = Boolean(requestedMode) || manualOpen;
  const mode = requestedMode ?? manualMode;

  const clearRequestedState = useCallback(() => {
    if (!requestedMode) {
      return;
    }
    navigate(location.pathname + location.hash, {
      replace: true,
      state: requestedFrom ? { from: requestedFrom } : null,
    });
  }, [location.hash, location.pathname, navigate, requestedFrom, requestedMode]);

  const openSignIn = useCallback(() => {
    setManualMode("signin");
    setManualOpen(true);
    clearRequestedState();
  }, [clearRequestedState]);

  const openSignUp = useCallback(() => {
    setManualMode("signup");
    setManualOpen(true);
    clearRequestedState();
  }, [clearRequestedState]);

  const closeAuthModal = useCallback(() => {
    setManualOpen(false);
    clearRequestedState();
  }, [clearRequestedState]);

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
