import { createContext, useContext } from "react";

export interface AuthContextValue {
  customerId: string | null;
  isAuthenticated: boolean;
  login: (customerId: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
