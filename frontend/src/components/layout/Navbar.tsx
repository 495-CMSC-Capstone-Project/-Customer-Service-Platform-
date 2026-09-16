import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";

const sectionLinks = [
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#support", label: "Support" },
] as const;

export function Navbar() {
  const { isAuthenticated, customerId, logout } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSignOut() {
    closeMenu();
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <span className="navbar__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1d4ed8" />
              <path
                d="M8 10.5A2.5 2.5 0 0 1 10.5 8h7A2.5 2.5 0 0 1 20 10.5v5A2.5 2.5 0 0 1 17.5 18H13l-3.5 2.5V18h-.5A2.5 2.5 0 0 1 8 15.5v-5Z"
                fill="white"
              />
            </svg>
          </span>
          <span className="navbar__title">Customer Support</span>
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? "navbar__nav is-open" : "navbar__nav"}
          aria-label="Primary"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }: { isActive: boolean }) =>
              isActive ? "navbar__link is-active" : "navbar__link"
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>
          {isAuthenticated ? (
            <NavLink
              to="/conversations"
              className={({ isActive }: { isActive: boolean }) =>
                isActive ? "navbar__link is-active" : "navbar__link"
              }
              onClick={closeMenu}
            >
              Conversations
            </NavLink>
          ) : null}
          {sectionLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="navbar__link"
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <span className="navbar__user">{customerId}</span>
              <button type="button" className="navbar__signin navbar__signin--ghost" data-auth="signout" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <div className="navbar__auth">
              <button
                type="button"
                className="navbar__signin navbar__signin--ghost"
                data-auth="signup"
                onClick={() => {
                  closeMenu();
                  openSignUp();
                }}
              >
                Sign up
              </button>
              <button
                type="button"
                className="navbar__signin"
                data-auth="signin"
                onClick={() => {
                  closeMenu();
                  openSignIn();
                }}
              >
                Sign in
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
