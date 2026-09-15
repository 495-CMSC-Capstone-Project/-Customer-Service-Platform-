import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSupport } from "../../context/SupportContext";
import { ErrorMessage } from "../common/ErrorMessage";
import { createId } from "../../utils/ids";

interface SignUpFormProps {
  idPrefix?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onRequestSignIn?: () => void;
}

export function SignUpForm({
  idPrefix = "",
  redirectTo,
  onSuccess,
  onRequestSignIn,
}: SignUpFormProps) {
  const { login } = useAuth();
  const { registerCustomer } = useSupport();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState(() => createId("cust"));
  const [error, setError] = useState<string | null>(null);
  const nameId = `${idPrefix}signup-name`;
  const customerInputId = `${idPrefix}signup-customer-id`;
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
      registerCustomer(customerId, name);
      login(customerId);
      onSuccess?.();
      navigate(redirectTo ?? from, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create an account.");
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor={nameId}>Full name</label>
      <input
        id={nameId}
        name="name"
        autoComplete="name"
        placeholder="Alex Rivera"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <label htmlFor={customerInputId}>Customer ID</label>
      <input
        id={customerInputId}
        name="customerId"
        autoComplete="username"
        placeholder="cust_7832"
        value={customerId}
        onChange={(event) => setCustomerId(event.target.value)}
      />
      <p className="field-hint">
        Choose an ID you can sign back in with. This prototype stores the
        account in your browser.
      </p>
      <ErrorMessage message={error} />
      <button type="submit" className="button button--primary">
        Create account
      </button>
      {onRequestSignIn ? (
        <p className="modal__switch">
          Already have an account?{" "}
          <button type="button" onClick={onRequestSignIn}>
            Sign in
          </button>
        </p>
      ) : null}
    </form>
  );
}
