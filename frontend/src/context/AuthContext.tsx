import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext, type AuthContextValue } from "./auth";

const AUTH_STORAGE_KEY = "csp-prototype-customer-id";

function readStoredCustomerId(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customerId, setCustomerId] = useState<string | null>(readStoredCustomerId);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);

  const login = useCallback((rawCustomerId: string) => {
    const nextId = rawCustomerId.trim();
    if (!nextId) {
      throw new Error("Customer ID is required.");
    }
    if (nextId.length > 64) {
      throw new Error("Customer ID must be 64 characters or fewer.");
    }
    setCustomerId(nextId);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, nextId);
      setSessionWarning(null);
    } catch {
      setSessionWarning("Your demo sign-in is active on this page only. Browser storage is unavailable, so reloading may change the selected profile.");
    }
  }, []);

  const logout = useCallback(() => {
    setCustomerId(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setSessionWarning(null);
    } catch {
      setSessionWarning("Signed out on this page. Browser storage could not be cleared, so reloading may restore the previous demo profile.");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      customerId,
      isAuthenticated: Boolean(customerId),
      sessionWarning,
      login,
      logout,
    }),
    [customerId, sessionWarning, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
