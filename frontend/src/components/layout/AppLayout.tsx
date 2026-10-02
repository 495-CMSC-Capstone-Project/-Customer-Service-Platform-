import type { ReactNode } from "react";
import { AuthModal } from "../auth/AuthModal";
import { Navbar } from "./Navbar";
import { useAuth } from "../../context/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sessionWarning } = useAuth();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        {sessionWarning ? <p className="page notice" role="status">{sessionWarning}</p> : null}
        {children}
      </main>
      <AuthModal />
    </div>
  );
}
