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

  const login = useCallback((rawCustomerId: string) => {
    const nextId = rawCustomerId.trim();
    if (!nextId) {
      throw new Error("Customer ID is required.");
    }
    if (nextId.length > 64) {
      throw new Error("Customer ID must be 64 characters or fewer.");
    }
    setCustomerId(nextId);
    localStorage.setItem(AUTH_STORAGE_KEY, nextId);
  }, []);

  const logout = useCallback(() => {
    setCustomerId(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      customerId,
      isAuthenticated: Boolean(customerId),
      login,
      logout,
    }),
    [customerId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
