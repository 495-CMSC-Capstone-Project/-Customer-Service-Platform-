import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DEMO_CUSTOMER_ID } from "../../data/seed";
import { ErrorMessage } from "../common/ErrorMessage";

interface SignInFormProps {
  idPrefix?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onRequestSignUp?: () => void;
}

export function SignInForm({
  idPrefix = "",
  redirectTo,
  onSuccess,
  onRequestSignUp,
}: SignInFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = `${idPrefix}customer-id`;
  const from =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/conversations";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      login(customerId);
      onSuccess?.();
      navigate(redirectTo ?? from, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Customer ID</label>
      <input
        id={inputId}
        name="customerId"
        autoComplete="username"
        placeholder={DEMO_CUSTOMER_ID}
        value={customerId}
        onChange={(event) => setCustomerId(event.target.value)}
      />
      <p className="field-hint">
        Try <code>{DEMO_CUSTOMER_ID}</code> to open the live AI conversation
        (<code>conv_001</code>) through the backend.
      </p>
      <ErrorMessage message={error} />
      <button type="submit" className="button button--primary">
        Sign in
      </button>
      {onRequestSignUp ? (
        <p className="modal__switch">
          Need an account?{" "}
          <button type="button" onClick={onRequestSignUp}>
            Sign up
          </button>
        </p>
      ) : null}
    </form>
  );
}
